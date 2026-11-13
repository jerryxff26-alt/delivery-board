import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { commandHelp } from '../lib/commands.js'
import { renderBoardHtml, inlineDomain } from '../lib/board-html.js'
import { createProject, addCard } from '../lib/delivery.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const skillPath = join(root, 'SKILL.md')

test('the repository root is a skill: frontmatter, body and bundled script', () => {
  const source = readFileSync(skillPath, 'utf8')
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/.exec(source)
  assert.ok(match, 'SKILL.md needs frontmatter and a body')
  const [, frontmatter, body] = match
  assert.match(frontmatter, /^name: delivery-board$/m)
  assert.match(frontmatter, /^description: \S.+$/m)
  assert.doesNotMatch(frontmatter.split('\n').find((line) => line.startsWith('description: ')) ?? '', /\n/)
  assert.ok(body.trim().length > 500)
  assert.ok(existsSync(join(root, 'scripts/delivery.mjs')), 'the skill must ship its script')
  assert.ok(statSync(join(root, 'scripts/delivery.mjs')).size > 0)
})

test('the skill teaches commands instead of the removed delivery_* tools', () => {
  const body = readFileSync(skillPath, 'utf8').split(/^---$/m).slice(2).join('---')
  assert.match(body, /scripts\/delivery\.mjs/)
  for (const command of ['init', 'card', 'move', 'board', 'open', 'update', 'weekly', 'log']) {
    assert.match(body, new RegExp(`\\b${command}\\b`), command)
  }
  assert.doesNotMatch(body, /delivery_(init|card|move|board|open|update|weekly|log)\b/)
  assert.doesNotMatch(body, /\/delivery-admin\b/)
  assert.match(body, /--actor/)
})

test('the help text covers every command the skill promises', () => {
  for (const command of ['init', 'card', 'board', 'open', 'move', 'update', 'dod add', 'dod check', 'archive', 'restore', 'archive-board', 'log', 'resolve', 'hide', 'show', 'stage_add', 'stage_update', 'stage_remove', 'weekly', 'html']) {
    assert.ok(commandHelp.includes(command), command)
  }
  assert.doesNotMatch(commandHelp, /\/delivery-admin/)
})

test('the board copies a runnable command when a command prefix is supplied', () => {
  const state = addCard(createProject({ customer: 'Skill Demo', template: 'lite' }), { title: 'API', stage: 'doing' })
  const html = renderBoardHtml(state, { command: 'node /opt/delivery/scripts/delivery.mjs' })
  assert.match(html, /data-cmd="node \/opt\/delivery\/scripts\/delivery\.mjs move c1 review"/)
  const fallback = renderBoardHtml(state)
  assert.match(fallback, /data-cmd="delivery move c1 review"/)
})

test('the static page can edit its own file with the same domain code', async () => {
  const { readFileSync } = await import('node:fs')
  const vm = await import('node:vm')
  const source = inlineDomain()
  assert.match(source, /function applyAction/)
  assert.doesNotMatch(source, /^import /m)
  assert.doesNotMatch(source, /^export /m)

  const context = vm.createContext({ structuredClone })
  vm.runInContext(source, context)
  const state = context.createProject({ customer: 'Inline', template: 'lite' })
  const next = context.applyAction(state, 'card', { title: 'API', stage: 'doing' }, { actor: 'Ada' })
  assert.equal(next.cards[0].id, 'c1')
  const moved = context.applyAction(next, 'move', { card_id: 'c1', to_stage: 'review' }, { actor: 'Bo' })
  assert.equal(moved.cards[0].stage, 'review')
  assert.equal(moved.logs.length, 1)
  assert.equal(moved.logs[0].type, 'handoff')
  assert.equal(moved.logs[0].actor, 'Bo')

  const staticHtml = renderBoardHtml(state)
  assert.match(staticHtml, /id="connect-file"/)
  assert.match(staticHtml, /function applyAction/)
  const liveHtml = renderBoardHtml(state, { endpoint: '/board/x', revision: 'r' })
  assert.doesNotMatch(liveHtml, /function applyAction/)
  assert.doesNotMatch(liveHtml.split('<script>')[0], /id="connect-file"/)
})
