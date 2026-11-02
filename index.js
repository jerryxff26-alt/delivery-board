// dsh-delivery-board — ToB delivery collaboration plugin (host tool plugin)
//
// A shared delivery board for ToB delivery teams: role pipeline, card flow,
// handoff audit trail, weekly report and a local visual board.
// Shared delivery state lives in the team's git repo (offline-friendly; default file configurable).
//
// Plugin contract (per deepseek-ai/deepseek-harness official docs and the community
// tested guide):
//   - exports name / inject / Config / apply; name matches the cordis.patch.yml row id
//   - tools registered via ctx.tools.register(defineTool({...}))
//   - file IO goes through ctx.fs (inherits session workspace / sandbox / observation policy)

import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'

import { createProject, renderBoard, renderWeekly, wipWarnings, LOG_TYPES, TEMPLATES, archiveBoard, archiveBoardSlug, resolveCardRef } from './lib/delivery.js'
import { renderBoardHtml } from './lib/board-html.js'
import { readState, initializeState, mutateState, resolveTarget, writeState } from './lib/store.js'
import { applyAction } from './lib/actions.js'
import { createBoardManager } from './lib/board-server.js'
import { registerDeliveryCommand } from './lib/commands.js'
import { loadDeliverySkill } from './lib/skill.js'

export const name = 'delivery-board'

export const inject = ['tools', 'fs', 'systemPrompt', 'commands', 'skills']

export const Config = z.object({
  fileName: z.string().default('delivery.json'),
  boardFile: z.string().default('delivery-board.html'),
})

// DSH output.render returns ContentBlock[], not a plain string.
const textOutput = {
  schema: {
    type: 'object',
    properties: { text: { type: 'string', required: true } },
    additionalProperties: false,
  },
  render: (_args, value) => [{ type: 'text', text: value.text }],
}

const ok = (text) => ({ text })

async function loadOrThrow(ctx, exec, fileName) {
  const state = await readState(ctx, exec, fileName)
  if (!state) {
    throw new Error(`No delivery project yet. Next step: delivery_init (or /delivery Initialize …). Data file: ${fileName}.`)
  }
  return state
}

export function apply(ctx, config) {
  const registered = new Map()
  const register = (tool) => { registered.set(tool.name, tool); ctx.tools.register(tool) }
  const boards = createBoardManager(ctx, config)
  ctx.skills.register(loadDeliverySkill())
  ctx.systemPrompt.section({
    name: 'delivery-board',
    order: 100,
    text: [
      'Codebase-native delivery: use the delivery skill for repository-grounded planning, acceptance criteria, handoffs and reporting.',
      'The /delivery skill is model-led. Load it before delivery task actions when it is available in the skill catalog; explicit /delivery invocations already include its instructions.',
      'Daily loop (prefer these tools): delivery_init, delivery_card, delivery_move, delivery_board, delivery_open, delivery_update, delivery_weekly, delivery_log. Prefer template lite for new projects.',
      'Advanced (only when asked): delivery_stage_*, delivery_dod_add, delivery_dod_check, delivery_hide, delivery_show, delivery_resolve, delivery_board_html, delivery_archive, delivery_restore, delivery_archive_board. /delivery-admin help is the deterministic escape hatch, not the normal skill workflow.',
      `Delivery state is stored at the session workspace root (default file ${config.fileName}). ${config.boardFile} is a read-only export; delivery_open returns the editable machine-local board URL.`,
    ].join('\n'),
  })

  register(
    defineTool({
      name: 'delivery_init',
      description: 'Daily: initialize delivery project (prefer template lite). Customer + lite/default/governance or custom stages',
      parameters: {
        customer: { type: 'string', description: 'Customer name', required: true },
        template: {
          type: 'string',
          enum: Object.keys(TEMPLATES),
          description: 'Pipeline template: lite = Backlog→Doing→Review→Live (recommended quickstart); default = ToB; governance = sign-off gates',
        },
        stages: {
          type: 'array',
          description: 'Custom stages (optional; overrides the template when provided)',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Stage name', required: true },
              role: { type: 'string', description: 'Owning role' },
              wipLimit: { type: 'number', description: 'Optional soft WIP limit (positive integer; warn-only)' },
            },
            additionalProperties: false,
          },
        },
      },
      output: textOutput,
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        const state = await initializeState(ctx, exec, config.fileName, () => createProject({
          customer: args.customer,
          template: args.template ?? 'default',
          stages: args.stages,
        }))
        const names = state.pipeline.map((s) => s.name).join(' → ')
        return ok(`Delivery project initialized: ${state.customer} (${TEMPLATES[state.template]?.name ?? 'Custom Pipeline'})\nPipeline: ${names}`)
      },
    }),
  )

  register(
    defineTool({
      name: 'delivery_card',
      description: 'Daily: add a work card (title, stage, optional owner/start/due/description/acceptance/DoD)',
      parameters: {
        title: { type: 'string', description: 'Card title', required: true },
        stage: { type: 'string', description: 'Stage id or name (case-insensitive; must be unique)', required: true },
        owner: { type: 'string', description: 'Owner (optional)' },
        start: { type: 'string', description: 'Start date YYYY-MM-DD (optional; must be ≤ due when both set)' },
        due: { type: 'string', description: 'Due date YYYY-MM-DD (optional)' },
        description: { type: 'string', description: 'Optional card description' },
        acceptance: { type: 'array', items: { type: 'string' }, description: 'Acceptance criteria (optional)' },
        dod: { type: 'array', items: { type: 'string' }, description: 'Definition of Done checklist items (optional)' },
      },
      output: textOutput,
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        const { state: next } = await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, 'card', args))
        const card = next.cards[next.cards.length - 1]
        return ok(`Card created [${card.id}] ${card.title} → ${args.stage}`)
      },
    }),
  )

  register(
    defineTool({
      name: 'delivery_move',
      description: 'Daily: hand off a card to another stage (records handoff audit; owner can change)',
      parameters: {
        card_id: { type: 'string', description: 'Card id or unique title', required: true },
        to_stage: { type: 'string', description: 'Target stage id or name', required: true },
        owner: { type: 'string', description: 'New owner after handoff (optional)' },
        note: { type: 'string', description: 'Handoff note (optional)' },
      },
      output: textOutput,
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        let moved = false
        const { state: next } = await mutateState(ctx, exec, config.fileName, (state) => {
          const result = applyAction(state, 'move', args)
          moved = result !== state
          return result
        })
        if (!moved) return ok(`No changes: ${args.card_id} is already in ${args.to_stage}.`)
        const last = next.logs[next.logs.length - 1]
        const movedCard = last?.cardId ? next.cards.find((c) => c.id === last.cardId) : null
        const warn = wipWarnings(next).filter((w) => movedCard && w.includes(`(${movedCard.stage})`))
        const base = last.type === 'handoff' ? `Handed off: ${last.text}` : `Updated (no handoff): ${last.text}`
        return ok(warn.length ? `${base}\nSoft WIP warning: ${warn.join('; ')}` : base)
      },
    }),
  )

  register(
    defineTool({
      name: 'delivery_board',
      description: 'Daily: quick text board (cards per stage, soft WIP, open risks)',
      parameters: { include_archived: { type: 'boolean', description: 'Include archived cards (default false)' } },
      output: textOutput,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const state = await loadOrThrow(ctx, exec, config.fileName)
        return ok(renderBoard(state, { includeArchived: args.include_archived ?? false }))
      },
    }),
  )

  register(
    defineTool({
      name: 'delivery_board_html',
      description: 'Advanced: export read-only offline HTML snapshot; prefer delivery_open to edit live',
      parameters: {
        output: { type: 'string', description: 'Output filename (optional, defaults to delivery-board.html)' },
      },
      output: textOutput,
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        const state = await loadOrThrow(ctx, exec, config.fileName)
        const outFile = args.output || config.boardFile
        const stateTarget = await resolveTarget(ctx, exec, config.fileName)
        const outputTarget = await resolveTarget(ctx, exec, outFile)
        if (outputTarget.targetKey === stateTarget.targetKey) {
          throw new Error('HTML output cannot overwrite the delivery state file.')
        }
        if (!/\.html?$/i.test(outFile)) throw new Error('HTML output must use a .html or .htm extension.')
        const html = renderBoardHtml(state)
        await ctx.fs.writeText(outputTarget, html, undefined, exec?.signal)
        return ok(`HTML board generated: ${outFile} (workspace root — open it in a browser to view/share)`)
      },
    }),
  )

  register(
    defineTool({
      name: 'delivery_log',
      description: 'Daily: log progress / risk / blocker / decision',
      parameters: {
        type: { type: 'string', enum: LOG_TYPES, description: 'Update type', required: true },
        text: { type: 'string', description: 'Content', required: true },
        card_id: { type: 'string', description: 'Related card id (optional)' },
      },
      output: textOutput,
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, 'log', args))
        return ok(`Logged [${args.type}]: ${args.text}`)
      },
    }),
  )

  register(
    defineTool({
      name: 'delivery_resolve',
      description: 'Advanced: mark an open risk/blocker resolved by logs array index',
      parameters: {
        log_index: { type: 'number', description: 'Zero-based index into the logs array', required: true },
      },
      output: textOutput,
      isConcurrencySafe: () => false,
      async execute(args, exec) {
        const index = args.log_index
        if (!Number.isInteger(index) || index < 0) throw new Error('log_index must be a non-negative integer')
        let entry
        await mutateState(ctx, exec, config.fileName, (state) => {
          entry = state.logs[index]
          return applyAction(state, 'resolve', { log_index: index })
        })
        return ok(`Resolved [${entry?.type ?? 'log'}] at index ${index}: ${entry?.text ?? ''}`)
      },
    }),
  )

  register(
    defineTool({
      name: 'delivery_weekly',
      description: 'Daily: draft client weekly Markdown report (shipped / handoffs / risks / optional next bets)',
      parameters: {
        week_label: { type: 'string', description: 'Report title label (optional; does not select the reporting dates)' },
        week_start: { type: 'string', description: 'First reporting date YYYY-MM-DD (inclusive, seven days in local time; defaults to Monday of the current week)' },
        next_week: { type: 'string', description: 'Optional next bets / next-week notes (string or newline-separated list). When omitted or empty, the Next bets section is omitted.' },
      },
      output: textOutput,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        const state = await loadOrThrow(ctx, exec, config.fileName)
        return ok(renderWeekly(state, args.week_label ?? '', args.week_start, args.next_week ?? ''))
      },
    }),
  )

  register(defineTool({
    name: 'delivery_open',
    description: 'Daily: open interactive local board URL (drag/move/edit; loopback-only)',
    parameters: {}, output: textOutput, isConcurrencySafe: () => false,
    async execute(_args, exec) {
      const url = await boards.open(exec)
      return ok(`Interactive delivery board: ${url}\nThis local URL can read and edit this workspace only. Keep it private; it expires when DSH exits or this plugin stops.`)
    },
  }))

  register(defineTool({
    name: 'delivery_update', description: 'Daily: edit active card metadata (title/owner/start/due/description/acceptance/DoD); omitted fields preserved',
    parameters: {
      card_id: { type: 'string', required: true, description: 'Card id or unique title' },
      title: { type: 'string', description: 'New title' },
      owner: { type: 'string', description: 'New owner; empty string clears' },
      start: { type: 'string', description: 'Start date YYYY-MM-DD; empty string clears; must be ≤ due when both set' },
      due: { type: 'string', description: 'New due date YYYY-MM-DD; empty string clears' },
      description: { type: 'string', description: 'Card description; empty string clears' },
      acceptance: { type: 'array', items: { type: 'string' }, description: 'Replace acceptance criteria' },
      dod: { type: 'array', items: { type: 'string' }, description: 'Replace DoD checklist (one string per item; check state resets)' },
    }, output: textOutput, isConcurrencySafe: () => false,
    async execute(args, exec) {
      const patch = { ...args }
      if (patch.due === '') patch.due = null
      if (patch.start === '') patch.start = null
      await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, 'update', patch))
      return ok(`Card updated [${args.card_id}]`)
    },
  }))

  register(defineTool({
    name: 'delivery_dod_add',
    description: 'Advanced: append a Definition of Done checklist item on a card',
    parameters: {
      card_id: { type: 'string', required: true, description: 'Card id or unique title' },
      text: { type: 'string', required: true, description: 'DoD item text' },
    },
    output: textOutput, isConcurrencySafe: () => false,
    async execute(args, exec) {
      await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, 'dod_add', args))
      return ok(`DoD item added on [${args.card_id}]`)
    },
  }))

  register(defineTool({
    name: 'delivery_dod_check',
    description: 'Advanced: tick/untick a card DoD checklist item (does not block moves)',
    parameters: {
      card_id: { type: 'string', required: true, description: 'Card id or unique title' },
      index: { type: 'number', required: true, description: 'Zero-based index into the card DoD list' },
      done: { type: 'boolean', description: 'Explicit checked state; omit to toggle' },
      done_by: { type: 'string', description: 'Who checked it (optional; defaults to card owner when ticking)' },
    },
    output: textOutput, isConcurrencySafe: () => false,
    async execute(args, exec) {
      if (!Number.isInteger(args.index) || args.index < 0) throw new Error('index must be a non-negative integer')
      let label
      await mutateState(ctx, exec, config.fileName, (state) => {
        const card = resolveCardRef(state, args.card_id)
        label = card.dod?.[args.index]?.text ?? args.index
        return applyAction(state, 'dod_check', args)
      })
      return ok(`DoD updated on ${args.card_id}: ${label}`)
    },
  }))

  register(defineTool({
    name: 'delivery_hide',
    description: 'Advanced: hide a stage column on the board (view preference; cards stay counted and reachable)',
    parameters: {
      stage_id: { type: 'string', required: true, description: 'Stage id or name to hide' },
    },
    output: textOutput, isConcurrencySafe: () => false,
    async execute(args, exec) {
      await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, 'hide', args))
      return ok(`Stage hidden [${args.stage_id}]`)
    },
  }))

  register(defineTool({
    name: 'delivery_show',
    description: 'Advanced: show a previously hidden stage column on the board',
    parameters: {
      stage_id: { type: 'string', required: true, description: 'Stage id or name to show' },
    },
    output: textOutput, isConcurrencySafe: () => false,
    async execute(args, exec) {
      await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, 'show', args))
      return ok(`Stage shown [${args.stage_id}]`)
    },
  }))

  register(defineTool({
    name: 'delivery_stage_add',
    description: 'Advanced: add a pipeline stage after init (marks template custom). Optional after=stage_id.',
    parameters: {
      name: { type: 'string', required: true, description: 'Stage name' },
      role: { type: 'string', description: 'Owning role' },
      id: { type: 'string', description: 'Optional stage id (auto-generated from name when omitted)' },
      after: { type: 'string', description: 'Insert after this stage id (append when omitted)' },
      wip_limit: { type: 'number', description: 'Optional soft WIP limit (positive integer; warn-only, does not block moves)' },
    },
    output: textOutput, isConcurrencySafe: () => false,
    async execute(args, exec) {
      let addedId
      const { state } = await mutateState(ctx, exec, config.fileName, (state) => {
        const before = new Set(state.pipeline.map((s) => s.id))
        const next = applyAction(state, 'stage_add', args)
        addedId = next.pipeline.find((s) => !before.has(s.id))?.id
        return next
      })
      const added = state.pipeline.find((s) => s.id === addedId)
      return ok(`Stage added [${added.id}] ${added.name}`)
    },
  }))

  register(defineTool({
    name: 'delivery_stage_update',
    description: 'Advanced: rename a stage or replace role / soft WIP after init',
    parameters: {
      stage_id: { type: 'string', required: true, description: 'Stage id or name' },
      name: { type: 'string', description: 'New stage name' },
      role: { type: 'string', description: 'New owning role' },
      wip_limit: { type: 'number', description: 'Soft WIP limit (positive integer). Pass null to clear.' },
    },
    output: textOutput, isConcurrencySafe: () => false,
    async execute(args, exec) {
      await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, 'stage_update', args))
      return ok(`Stage updated [${args.stage_id}]`)
    },
  }))

  register(defineTool({
    name: 'delivery_stage_remove',
    description: 'Advanced: remove a pipeline stage (requires migrate_to if cards remain)',
    parameters: {
      stage_id: { type: 'string', required: true, description: 'Stage id or name to remove' },
      migrate_to: { type: 'string', description: 'Move cards on the removed stage to this stage id/name first' },
    },
    output: textOutput, isConcurrencySafe: () => false,
    async execute(args, exec) {
      await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, 'stage_remove', args))
      return ok(`Stage removed [${args.stage_id}]`)
    },
  }))

  for (const action of ['archive', 'restore']) {
    register(defineTool({
      name: `delivery_${action}`,
      description: action === 'archive' ? 'Advanced: archive a card without deleting metadata or history' : 'Advanced: restore an archived card to its previous stage',
      parameters: { card_id: { type: 'string', required: true, description: 'Card id or unique title' } },
      output: textOutput, isConcurrencySafe: () => false,
      async execute(args, exec) {
        await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, action, args))
        return ok(`Card ${action === 'archive' ? 'archived' : 'restored'} [${args.card_id}]`)
      },
    }))
  }

  register(defineTool({
    name: 'delivery_archive_board',
    description: 'Advanced: snapshot the whole board to delivery-archive/<YYYY-MM-DD>-<slug>.json, then reset to an empty board with the same pipeline',
    parameters: {},
    output: textOutput, isConcurrencySafe: () => false,
    async execute(_args, exec) {
      const state = await loadOrThrow(ctx, exec, config.fileName)
      const { archive, next } = archiveBoard(state)
      const day = (archive.archivedAt ?? new Date().toISOString()).slice(0, 10)
      const slug = archiveBoardSlug(archive.customer)
      const relFile = `delivery-archive/${day}-${slug}.json`
      const target = await resolveTarget(ctx, exec, relFile)
      await ctx.fs.writeText(target, JSON.stringify(archive, null, 2) + '\n', undefined, exec?.signal)
      await writeState(ctx, exec, config.fileName, next)
      return ok(`Board archived to ${relFile}; ${config.fileName} reset (pipeline kept).`)
    },
  }))

  registerDeliveryCommand(ctx, async (action, args, exec) => {
    const key = action === 'html' ? 'delivery_board_html'
      : action === 'archive-board' ? 'delivery_archive_board'
      : `delivery_${action}`
    const tool = registered.get(key)
    if (!tool) throw new Error(`Unknown delivery command: ${action}`)
    return (await tool.execute(args, exec)).text
  })

}
