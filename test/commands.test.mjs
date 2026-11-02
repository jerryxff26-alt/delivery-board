import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDeliveryCommand } from '../lib/commands.js'

test('slash command supports discoverable help, precise move and archive syntax', () => {
  assert.deepEqual(parseDeliveryCommand(''), { action: 'help', args: {} })
  assert.deepEqual(parseDeliveryCommand('move c1 build'), { action: 'move', args: { card_id: 'c1', to_stage: 'build' } })
  assert.deepEqual(parseDeliveryCommand('board --archived'), { action: 'board', args: { include_archived: true } })
  assert.deepEqual(parseDeliveryCommand('archive c1'), { action: 'archive', args: { card_id: 'c1' } })
  assert.deepEqual(parseDeliveryCommand('weekly 2026-10-05'), { action: 'weekly', args: { week_start: '2026-10-05' } })
  assert.deepEqual(parseDeliveryCommand('resolve 2'), { action: 'resolve', args: { log_index: 2 } })
  assert.deepEqual(parseDeliveryCommand('dod add c1 "Ship notes"'), { action: 'dod_add', args: { card_id: 'c1', text: 'Ship notes' } })
  assert.deepEqual(parseDeliveryCommand('dod check c1 0 true'), { action: 'dod_check', args: { card_id: 'c1', index: 0, done: true } })
  assert.deepEqual(parseDeliveryCommand('archive-board'), { action: 'archive-board', args: {} })
  assert.deepEqual(
    parseDeliveryCommand('stage_add {"name":"Hardening","after":"test"}'),
    { action: 'stage_add', args: { name: 'Hardening', after: 'test' } },
  )
  assert.deepEqual(
    parseDeliveryCommand('weekly {"week_start":"2026-10-05","next_week":"Ship SSO"}'),
    { action: 'weekly', args: { week_start: '2026-10-05', next_week: 'Ship SSO' } },
  )
  assert.throws(() => parseDeliveryCommand('resolve'), /resolve <log_index>/)
  assert.throws(() => parseDeliveryCommand('resolve c1'), /resolve <log_index>/)
  assert.throws(() => parseDeliveryCommand('dod check c1'), /dod check/)
  assert.throws(() => parseDeliveryCommand('gate build'), /Unknown delivery command/)
})

test('slash command keeps JSON strings intact and never interprets shell syntax', () => {
  assert.deepEqual(parseDeliveryCommand('card {"title":"A ; B", "stage":"build"}').args, { title: 'A ; B', stage: 'build' })
  for (const input of ['unknown', 'move c1', 'move c1 build ; rm', 'archive c1 c2', 'board anything', 'open more', 'init []', 'card null', 'update {bad}']) assert.throws(() => parseDeliveryCommand(input))
})

test('positional init and card parse without JSON', () => {
  assert.deepEqual(parseDeliveryCommand('init ACME lite'), { action: 'init', args: { customer: 'ACME', template: 'lite' } })
  assert.deepEqual(parseDeliveryCommand('init ACME Corp governance'), { action: 'init', args: { customer: 'ACME Corp', template: 'governance' } })
  assert.deepEqual(parseDeliveryCommand('init Demo'), { action: 'init', args: { customer: 'Demo' } })
  assert.deepEqual(parseDeliveryCommand('card API doing Ada'), { action: 'card', args: { title: 'API', stage: 'doing', owner: 'Ada' } })
  assert.deepEqual(parseDeliveryCommand('card API doing'), { action: 'card', args: { title: 'API', stage: 'doing' } })
  assert.deepEqual(parseDeliveryCommand('card "Pay wall" review Bob'), { action: 'card', args: { title: 'Pay wall', stage: 'review', owner: 'Bob' } })
  assert.deepEqual(parseDeliveryCommand('move "Pay wall" Live'), { action: 'move', args: { card_id: 'Pay wall', to_stage: 'Live' } })
  assert.deepEqual(parseDeliveryCommand('archive "Pay wall"'), { action: 'archive', args: { card_id: 'Pay wall' } })
  assert.deepEqual(parseDeliveryCommand('card API doing Ada --start 2026-11-01 --due 2026-11-10'), {
    action: 'card', args: { title: 'API', stage: 'doing', owner: 'Ada', start: '2026-11-01', due: '2026-11-10' },
  })
  assert.deepEqual(parseDeliveryCommand('update c1 --start 2026-11-02'), { action: 'update', args: { card_id: 'c1', start: '2026-11-02' } })
})

test('hide and show parse stage refs', () => {
  assert.deepEqual(parseDeliveryCommand('hide backlog'), { action: 'hide', args: { stage_id: 'backlog' } })
  assert.deepEqual(parseDeliveryCommand('show "In progress"'), { action: 'show', args: { stage_id: 'In progress' } })
  assert.deepEqual(parseDeliveryCommand('hide {"stage_id":"doing"}'), { action: 'hide', args: { stage_id: 'doing' } })
  assert.throws(() => parseDeliveryCommand('hide'), /hide <stage/)
  assert.throws(() => parseDeliveryCommand('show a b'), /show <stage/)
})

test('card and update accept --description flag', () => {
  assert.deepEqual(
    parseDeliveryCommand('card API doing Ada --description "Wire partner"'),
    { action: 'card', args: { title: 'API', stage: 'doing', owner: 'Ada', description: 'Wire partner' } },
  )
  assert.deepEqual(
    parseDeliveryCommand('card API doing --description=Hello'),
    { action: 'card', args: { title: 'API', stage: 'doing', description: 'Hello' } },
  )
  assert.deepEqual(
    parseDeliveryCommand('update c1 --description "New notes"'),
    { action: 'update', args: { card_id: 'c1', description: 'New notes' } },
  )
  assert.deepEqual(
    parseDeliveryCommand('update {"card_id":"c1","description":"JSON"}'),
    { action: 'update', args: { card_id: 'c1', description: 'JSON' } },
  )
})

test('dod and archive-board parse', () => {
  assert.deepEqual(parseDeliveryCommand('dod add "Pay wall" Docs ready'), { action: 'dod_add', args: { card_id: 'Pay wall', text: 'Docs ready' } })
  assert.deepEqual(parseDeliveryCommand('dod check c1 1'), { action: 'dod_check', args: { card_id: 'c1', index: 1 } })
  assert.deepEqual(parseDeliveryCommand('dod check c1 1 false'), { action: 'dod_check', args: { card_id: 'c1', index: 1, done: false } })
  assert.throws(() => parseDeliveryCommand('archive-board now'), /takes no arguments/)
})
