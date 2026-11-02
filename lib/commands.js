// Direct human command syntax; no model message or generated script required.
export const commandHelp = `Delivery board commands (run directly, without the model):
/delivery-admin board [--archived] — text board
/delivery-admin open — interactive local board (drag, edit, archive, restore, DoD checklist)
/delivery-admin init <customer> [template]   e.g. init ACME lite
/delivery-admin init {"customer":"Demo","template":"lite"}
/delivery-admin card <title> <stage> [owner] [--start YYYY-MM-DD] [--due YYYY-MM-DD] [--description ...]
/delivery-admin card {"title":"API","stage":"doing","owner":"Alice","start":"2026-11-01","due":"2026-11-10"}
/delivery-admin move <card|title> <stage|name>   e.g. move API review
/delivery-admin update {"card_id":"c1","owner":"Bob","start":"2026-11-01","due":"2026-11-20","description":"..."}
/delivery-admin update <card|title> --description ... | --start ... | --due ...
/delivery-admin dod add <card|title> <text> — append a DoD checklist item
/delivery-admin dod check <card|title> <index> [true|false] — tick/untick DoD item (0-based)
/delivery-admin archive <card|title> | restore <card|title>
/delivery-admin archive-board — snapshot to delivery-archive/<date>-<slug>.json, then reset empty board
/delivery-admin log {"type":"blocker","text":"Waiting for UAT","card_id":"c1"}
/delivery-admin resolve <log_index> — mark a risk/blocker open entry resolved
/delivery-admin hide <stage|name> | show <stage|name> — hide/show a stage column on the board (view preference)
/delivery-admin stage_add {"name":"Hardening","after":"review","wip_limit":3}
/delivery-admin stage_update {"stage_id":"doing","name":"In progress","wip_limit":5}
/delivery-admin stage_remove {"stage_id":"old","migrate_to":"doing"} — refuses if cards remain without migrate_to
/delivery-admin weekly [YYYY-MM-DD] | {"week_start":"...","week_label":"...","next_week":"next bets..."}
/delivery-admin html — export a read-only HTML snapshot
View an archived board: open --file delivery-archive/<file>.json  (or html --file …)`

function objectInput(text) {
  let value
  try { value = JSON.parse(text) } catch { throw new Error('Expected a JSON object. Run /delivery-admin help for examples.') }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a JSON object')
  return value
}

/** Peel `--name value` / `--name=value` flags; returns remaining tokens + optional value. */
function extractFlag(tokens, name) {
  const out = []
  let value
  let found = false
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token === `--${name}`) {
      found = true
      value = tokens[++i] ?? ''
      continue
    }
    if (token.startsWith(`--${name}=`)) {
      found = true
      value = token.slice(name.length + 3)
      continue
    }
    out.push(token)
  }
  return { tokens: out, value: found ? value : undefined }
}

function extractFlags(tokens, names) {
  let rest = tokens
  const values = {}
  for (const name of names) {
    const extracted = extractFlag(rest, name)
    rest = extracted.tokens
    if (extracted.value !== undefined) values[name] = extracted.value
  }
  return { tokens: rest, values }
}

export function parseDeliveryCommand(rawInput) {
  const match = /^(\S+)(?:\s+([\s\S]*))?$/.exec(rawInput.trim())
  const action = match?.[1] ?? 'help'
  const rest = match?.[2]?.trim() ?? ''
  if (['help', 'open', 'html', 'archive-board', 'archive_board'].includes(action)) {
    if (rest) throw new Error(`${action} takes no arguments`)
    return { action: action === 'archive_board' ? 'archive-board' : action, args: {} }
  }
  if (action === 'board') {
    if (rest && rest !== '--archived') throw new Error('Usage: /delivery-admin board [--archived]')
    return { action, args: { include_archived: rest === '--archived' } }
  }
  if (action === 'weekly') {
    if (!rest) return { action, args: {} }
    if (rest.startsWith('{')) return { action, args: objectInput(rest) }
    return { action, args: { week_start: rest } }
  }
  if (['archive', 'restore'].includes(action)) {
    const tokens = tokenizeArgs(rest)
    if (tokens.length !== 1) throw new Error(`Usage: /delivery-admin ${action} <card_id|title>`)
    return { action, args: { card_id: tokens[0] } }
  }
  if (action === 'resolve') {
    if (!/^\d+$/.test(rest)) throw new Error('Usage: /delivery-admin resolve <log_index>')
    return { action, args: { log_index: Number(rest) } }
  }
  if (action === 'dod') {
    if (rest.startsWith('{')) {
      const args = objectInput(rest)
      if (args.op === 'add' || args.text != null) return { action: 'dod_add', args: { card_id: args.card_id, text: args.text } }
      return { action: 'dod_check', args: { card_id: args.card_id, index: args.index, done: args.done, done_by: args.done_by } }
    }
    const parts = tokenizeArgs(rest)
    if (parts[0] === 'add') {
      if (parts.length < 3) throw new Error('Usage: /delivery-admin dod add <card|title> <text>')
      return { action: 'dod_add', args: { card_id: parts[1], text: parts.slice(2).join(' ') } }
    }
    if (parts[0] === 'check') {
      if (parts.length < 3 || parts.length > 4 || !/^\d+$/.test(parts[2])) {
        throw new Error('Usage: /delivery-admin dod check <card|title> <index> [true|false]')
      }
      const args = { card_id: parts[1], index: Number(parts[2]) }
      if (parts[3] !== undefined) {
        if (!['true', 'false'].includes(parts[3])) throw new Error('Usage: /delivery-admin dod check <card|title> <index> [true|false]')
        args.done = parts[3] === 'true'
      }
      return { action: 'dod_check', args }
    }
    throw new Error('Usage: /delivery-admin dod add <card|title> <text> | dod check <card|title> <index> [true|false]')
  }
  if (action === 'hide' || action === 'show') {
    if (rest.startsWith('{')) return { action, args: objectInput(rest) }
    const parts = tokenizeArgs(rest)
    if (parts.length !== 1) throw new Error(`Usage: /delivery-admin ${action} <stage|name>`)
    return { action, args: { stage_id: parts[0] } }
  }
  if (action === 'move' && !rest.startsWith('{')) {
    const words = tokenizeArgs(rest)
    if (words.length !== 2 || !words.every(Boolean)) throw new Error('Usage: /delivery-admin move <card|title> <stage|name>')
    return { action, args: { card_id: words[0], to_stage: words[1] } }
  }
  if (action === 'init' && rest && !rest.startsWith('{') && !rest.startsWith('[')) {
    const tokens = tokenizeArgs(rest)
    if (!tokens.length) throw new Error('Usage: /delivery-admin init <customer> [template]')
    const templates = new Set(['lite', 'default', 'governance'])
    if (tokens.length >= 2 && templates.has(tokens[tokens.length - 1])) {
      return { action, args: { customer: tokens.slice(0, -1).join(' '), template: tokens[tokens.length - 1] } }
    }
    return { action, args: { customer: tokens.join(' ') } }
  }
  if (action === 'card' && rest && !rest.startsWith('{') && !rest.startsWith('[')) {
    const { tokens, values } = extractFlags(tokenizeArgs(rest), ['description', 'start', 'due'])
    if (tokens.length < 2) throw new Error('Usage: /delivery-admin card <title> <stage> [owner] [--start ...] [--due ...] [--description ...]')
    let args
    if (tokens.length === 2) args = { title: tokens[0], stage: tokens[1] }
    else if (tokens.length === 3) args = { title: tokens[0], stage: tokens[1], owner: tokens[2] }
    else args = { title: tokens.slice(0, -2).join(' '), stage: tokens[tokens.length - 2], owner: tokens[tokens.length - 1] }
    if (values.description !== undefined) args.description = values.description
    if (values.start !== undefined) args.start = values.start || null
    if (values.due !== undefined) args.due = values.due || null
    return { action, args }
  }
  if (action === 'update' && rest && !rest.startsWith('{') && !rest.startsWith('[')) {
    const { tokens, values } = extractFlags(tokenizeArgs(rest), ['description', 'start', 'due'])
    if (tokens.length !== 1 || !Object.keys(values).length) {
      throw new Error('Usage: /delivery-admin update <card|title> --description ... | --start ... | --due ...  (or pass a JSON object)')
    }
    const args = { card_id: tokens[0] }
    if (values.description !== undefined) args.description = values.description
    if (values.start !== undefined) args.start = values.start || null
    if (values.due !== undefined) args.due = values.due || null
    return { action, args }
  }
  if (['init', 'card', 'move', 'update', 'log', 'stage_add', 'stage_update', 'stage_remove', 'hide', 'show', 'dod_add', 'dod_check'].includes(action)) {
    return { action, args: objectInput(rest) }
  }
  throw new Error(`Unknown delivery command: ${action}. Run /delivery-admin help.`)
}

function tokenizeArgs(rest) {
  const tokens = []
  const re = /"([^"]*)"|(\S+)/g
  let match
  while ((match = re.exec(rest))) tokens.push(match[1] ?? match[2])
  return tokens
}

export function registerDeliveryCommand(ctx, run) {
  ctx.commands.register({
    name: 'delivery-admin',
    description: 'Advanced delivery board controls: run validated operations directly, without the model',
    input: { hint: 'board | open | init <customer> [template] | card <title> <stage> [owner] | move <card> <stage> | help' },
    async handler(invocation) {
      try {
        const { action, args } = parseDeliveryCommand(invocation.rawInput)
        if (action === 'help') return { kind: 'success', text: commandHelp }
        return { kind: 'success', text: await run(action, args, { agent: invocation.agent, signal: invocation.signal }) }
      } catch (error) { return { kind: 'error', text: error.message } }
    },
  })
}
