// Boots the real embedded client script under a minimal DOM stub. This catches the failure mode
// the offline renderer cannot: a renderer reached through `Function#toString` that loses a module
// reference, or a boot-time TypeError before the first paint.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'

import { createProject, addCard, moveCard, appendLog } from '../lib/delivery.js'
import { renderBoardHtml } from '../lib/board-html.js'

function control(value = '') {
  return {
    value,
    textContent: '',
    innerHTML: '',
    checked: false,
    disabled: false,
    placeholder: '',
    dataset: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false } },
    addEventListener() {},
    setAttribute() {},
    removeAttribute() {},
    focus() {},
    close() {},
    showModal() {},
    remove() {},
    querySelector() { return null },
    querySelectorAll() { return [] },
    closest() { return null },
    contains() { return false },
  }
}

function makeDocument() {
  const elements = new Map()
  const element = (selector) => {
    if (elements.has(selector)) return elements.get(selector)
    const node = control()
    node.selector = selector
    node.hidden = false
    node.open = false
    node.listeners = new Map()
    node.addEventListener = (type, handler) => { node.listeners.set(type, handler) }
    if (selector === '#card-form' || selector === '#log-form') {
      const names = ['title', 'owner', 'start', 'due', 'description', 'acceptance', 'dod', 'stage', 'type', 'text', 'card_id']
      node.elements = Object.fromEntries(names.map((name) => [name, control()]))
    }
    elements.set(selector, node)
    return node
  }
  const document = {
    documentElement: element('html'),
    activeElement: null,
    listeners: new Map(),
    addEventListener(type, handler) { document.listeners.set(type, handler) },
    querySelector(selector) {
      if (selector === '#risks .risks' || selector === '#hidden-stages-slot details') return null
      return element(selector)
    },
    querySelectorAll() { return [] },
    getElementById(id) { return element(`#${id}`) },
  }
  return {
    document,
    element,
    fire(selector, type = 'click', event = {}) {
      const node = element(selector)
      const handler = node.listeners.get(type)
      assert.ok(handler, `no ${type} listener on ${selector}`)
      return handler({ preventDefault() {}, target: node, ...event })
    },
    fireDocument(type = 'click', event = {}) {
      const handler = document.listeners.get(type)
      assert.ok(handler, `no document ${type} listener`)
      return handler({ preventDefault() {}, target: control(), ...event })
    },
  }
}

function bootClient(state, options = {}, extraGlobals = {}) {
  const html = renderBoardHtml(state, { endpoint: '/board/smoke', revision: 'revision', locale: 'en', ...options })
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
  const dom = makeDocument()
  const context = vm.createContext({
    document: dom.document,
    navigator: { language: options.locale ?? 'en-US' },
    Element: class Element {},
    console: { error(...args) { throw new Error(`client logged an error: ${args.join(' ')}`) } },
    fetch() { throw new Error('the smoke test does not call the server') },
    ...extraGlobals,
  })
  new vm.Script(script).runInContext(context)
  return { ...dom, board: () => dom.element('#board').innerHTML, risks: () => dom.element('#risks').innerHTML }
}

function boardState() {
  let state = createProject({ customer: 'Smoke', template: 'lite' })
  state = addCard(state, { title: 'Visible card', stage: 'doing', owner: 'Ada', due: '2026-11-20', dod: ['Review'] })
  state = addCard(state, { title: 'Blocked card', stage: 'review', owner: 'Bo' })
  state = moveCard(state, { cardId: 'c1', toStage: 'doing' })
  state = appendLog(state, { type: 'blocker', text: 'Waiting on the partner', cardId: 'c2' })
  return state
}

test('the embedded client boots and paints the board from boot data', () => {
  const client = bootClient(boardState())
  const board = client.board()
  assert.match(board, /Visible card/)
  assert.match(board, /data-stage="doing"/)
  assert.match(board, /class="dod-progress"/)
  assert.match(board, /data-action="new-card"/)
  assert.match(client.risks(), /Waiting on the partner/)
})

test('the embedded client renders cards on a removed stage instead of dropping them', () => {
  const state = boardState()
  const ghost = { ...state.cards[0], id: 'c9', title: 'Ghost card', stage: 'retired' }
  const client = bootClient({ ...state, cards: [...state.cards, ghost] })
  assert.match(client.board(), /class="col col-orphan"/)
  assert.match(client.board(), /Ghost card/)
})

test('switching views runs the timeline and archive renderers in the client', async () => {
  const client = bootClient(boardState())
  await client.fire('#timeline-view')
  assert.match(client.element('#timeline').innerHTML, /tl-grid/)
  await client.fire('#archive-view')
  assert.equal(client.element('#board').hidden, true)
  assert.equal(client.element('#archive').hidden, false)
  await client.fire('#active-view')
  assert.equal(client.element('#board').hidden, false)
  assert.ok(client.board().includes('Visible card'))
})

test('opening the card and log editors fills their controls', async () => {
  const client = bootClient(boardState())
  await client.fire('#new-card')
  const form = client.element('#card-form')
  assert.equal(form.elements.stage.value, 'backlog')
  assert.ok(form.elements.stage.innerHTML.includes('review'))
  await client.fire('#new-log')
  const logForm = client.element('#log-form')
  assert.equal(logForm.elements.type.value, 'risk')
  assert.ok(logForm.elements.card_id.innerHTML.includes('c1'))
})

test('the embedded client boots a zh board and tags the document language', () => {
  const client = bootClient(boardState(), { locale: 'zh-CN' })
  assert.equal(client.element('html').lang, 'zh-CN')
  assert.match(client.board(), /未分配|Ada/)
  const html = renderBoardHtml(boardState(), { locale: 'zh-CN' }).split('<script>')[0]
  assert.match(html, /新建卡片/)
  assert.doesNotMatch(html, /Acceptance criteria \(one per line\)/)
})

test('a static page connects a delivery.json handle and renders its contents', async () => {
  const state = boardState()
  let fileText = JSON.stringify({ ...state, customer: 'From file', cards: [{ ...state.cards[0], title: 'Loaded from disk' }] })
  const writes = []
  const handle = {
    name: 'delivery.json',
    async getFile() { return { name: 'delivery.json', lastModified: 1, async text() { return fileText } } },
    async createWritable() { return { async write(text) { writes.push(text) }, async close() {} } },
  }
  const client = bootClient(state, { endpoint: '' }, {
    window: { showOpenFilePicker: async () => [handle] },
  })
  assert.match(client.element('#board').innerHTML, /Visible card/)
  await client.fire('#connect-file')
  assert.match(client.element('#board').innerHTML, /Loaded from disk/)
  assert.equal(writes.length, 0)
  // Refresh re-reads the connected handle instead of calling a server.
  fileText = JSON.stringify({ ...state, cards: [{ ...state.cards[0], title: 'Changed on disk' }] })
  await client.fire('#refresh')
  assert.match(client.element('#board').innerHTML, /Changed on disk/)
})
