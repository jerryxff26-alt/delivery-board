// Shared deterministic mutations for tools, slash commands and the local board.
import {
  addCard, moveCard, appendLog, updateCard, archiveCard, restoreCard, resolveLog,
  setDodDone, addDodItem, setStageHidden, addStage, updateStage, removeStage,
  archiveBoard,
} from './delivery.js'

const fields = {
  card: ['title', 'stage', 'owner', 'start', 'due', 'description', 'acceptance', 'dod'],
  move: ['card_id', 'to_stage', 'owner', 'note'],
  update: ['card_id', 'title', 'owner', 'start', 'due', 'description', 'acceptance', 'dod'],
  archive: ['card_id'], restore: ['card_id'],
  log: ['type', 'text', 'card_id'],
  resolve: ['log_index'],
  dod_add: ['card_id', 'text'],
  dod_check: ['card_id', 'index', 'done', 'done_by'],
  stage_add: ['name', 'role', 'id', 'after', 'wip_limit'],
  stage_update: ['stage_id', 'name', 'role', 'wip_limit'],
  stage_remove: ['stage_id', 'migrate_to'],
  hide: ['stage_id'],
  show: ['stage_id'],
  archive_board: [],
}

export function applyAction(state, action, args) {
  if (!fields[action]) throw new Error(`unknown delivery action: ${action}`)
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('arguments must be a JSON object')
  for (const key of Object.keys(args)) {
    if (!fields[action].includes(key)) throw new Error(`unsupported ${action} field: ${key}`)
  }
  for (const key of ['card_id', 'title', 'stage', 'to_stage', 'owner', 'note', 'text', 'type', 'stage_id', 'name', 'role', 'id', 'after', 'migrate_to', 'description', 'start', 'due', 'done_by']) {
    if (args[key] === undefined) continue
    // null clears optional card fields (start/due/description/owner) after '' → null normalization upstream.
    if (args[key] === null && ['owner', 'start', 'due', 'description'].includes(key)) continue
    if (typeof args[key] !== 'string') throw new Error(`${key} must be a string`)
  }
  for (const key of ['acceptance']) {
    if (args[key] !== undefined && (!Array.isArray(args[key]) || args[key].some((item) => typeof item !== 'string'))) throw new Error(`${key} must be an array of strings`)
  }
  if (args.dod !== undefined) {
    const ok = Array.isArray(args.dod) || typeof args.dod === 'string'
    if (!ok) throw new Error('dod must be an array or a newline-separated string')
  }
  if (args.log_index !== undefined && (!Number.isInteger(args.log_index) || args.log_index < 0)) {
    throw new Error('log_index must be a non-negative integer')
  }
  if (args.index !== undefined && (!Number.isInteger(args.index) || args.index < 0)) {
    throw new Error('index must be a non-negative integer')
  }
  if (args.done !== undefined && typeof args.done !== 'boolean') throw new Error('done must be a boolean')
  if (args.wip_limit !== undefined && args.wip_limit !== null) {
    if (!Number.isInteger(args.wip_limit) || args.wip_limit < 1) throw new Error('wip_limit must be a positive integer or null')
  }

  if (action === 'card') return addCard(state, args)
  if (action === 'move') {
    return moveCard(state, { cardId: args.card_id, toStage: args.to_stage, owner: args.owner ?? null, note: args.note ?? '' })
  }
  if (action === 'update') {
    const { card_id, ...patch } = args
    return updateCard(state, { cardId: card_id, ...patch })
  }
  if (action === 'archive') return archiveCard(state, { cardId: args.card_id })
  if (action === 'restore') return restoreCard(state, { cardId: args.card_id })
  if (action === 'resolve') return resolveLog(state, { index: args.log_index })
  if (action === 'dod_add') return addDodItem(state, { cardId: args.card_id, text: args.text })
  if (action === 'dod_check') {
    return setDodDone(state, { cardId: args.card_id, index: args.index, done: args.done, doneBy: args.done_by })
  }
  if (action === 'stage_add') {
    return addStage(state, { name: args.name, role: args.role, id: args.id, after: args.after, wipLimit: args.wip_limit })
  }
  if (action === 'stage_update') {
    const { stage_id, wip_limit, ...patch } = args
    return updateStage(state, { stageId: stage_id, ...patch, wipLimit: wip_limit })
  }
  if (action === 'stage_remove') {
    return removeStage(state, { stageId: args.stage_id, migrateTo: args.migrate_to })
  }
  if (action === 'hide') return setStageHidden(state, { stageId: args.stage_id, hidden: true })
  if (action === 'show') return setStageHidden(state, { stageId: args.stage_id, hidden: false })
  if (action === 'archive_board') {
    // Pure domain returns {archive, next}; callers that need disk I/O handle the snapshot.
    throw new Error('archive_board must be handled by the session runner')
  }
  return appendLog(state, { type: args.type, text: args.text, cardId: args.card_id ?? null })
}

export { archiveBoard }
