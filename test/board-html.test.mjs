import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createProject, addCard, archiveCard, moveCard, appendLog, resolveLog, setStageHidden } from '../lib/delivery.js'
import { renderBoardHtml } from '../lib/board-html.js'
import { formatTimestamp, renderColumns, renderArchive, renderRisks, renderCardDetail, boardStrings } from '../lib/board-view.js'

function sampleState() {
  let s = createProject({ customer: 'ACME <Group>', template: 'governance' })
  s = addCard(s, {
    title: 'SSO login<script>alert(1)</script>',
    stage: 'analyze',
    owner: 'carol',
    due: '2020-01-01', // overdue on purpose
    acceptance: ['SSO supported'],
    dod: ['PRD reviewed'],
  })
  s = moveCard(s, { cardId: 'c1', toStage: 'design', note: 'PRD reviewed' })
  s = appendLog(s, { type: 'risk', text: 'Understaffed' })
  return s
}

test('renderBoardHtml produces a complete standalone page', () => {
  const html = renderBoardHtml(sampleState())
  assert.ok(html.includes('<!DOCTYPE html>'))
  assert.ok(html.includes('ACME &lt;Group&gt; · Delivery Board'))
  assert.ok(html.includes('Governance Pipeline'))
  assert.ok(html.includes('Copy handoff'))
  assert.ok(html.includes('</html>'))
})

test('renderBoardHtml escapes user content (XSS safe)', () => {
  const html = renderBoardHtml(sampleState())
  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'))
})

test('renderBoardHtml shows stages and risks; no board gates or activity panel', () => {
  const html = renderBoardHtml(sampleState())
  assert.ok(html.includes('Analyze'))
  assert.ok(html.includes('Risks ('))
  assert.ok(html.includes('Understaffed'))
  assert.ok(html.includes('PRD reviewed'))
  assert.ok(html.includes('dod-progress') || html.includes('0/1') || html.includes('class="dod-progress"'))
  const body = html.split('<script>')[0]
  assert.doesNotMatch(body, /class="col-role"/)
  assert.doesNotMatch(body, /board-gates|id="board-gates"|class="audit"|Activity ·|活动/)
  assert.doesNotMatch(body, /阶段检查清单|Stage checklist/)
  assert.match(body, /id="archive-board"/)
  assert.match(body, /id="archive-board-dialog"/)
  assert.match(body, /name="start"/)
})

test('renderBoardHtml marks overdue cards', () => {
  const html = renderBoardHtml(sampleState())
  assert.ok(html.includes('is-overdue'))
  assert.ok(html.includes('overdue'))
})

test('renderBoardHtml handles empty projects', () => {
  const html = renderBoardHtml(createProject({ customer: 'Empty', template: 'lite' }))
  const body = html.split('<script>')[0]
  // Empty columns stay full-width with an empty-state hint (no collapse strip).
  assert.ok(!body.includes('is-collapsed'))
  assert.ok(!body.includes('data-collapsed'))
  assert.ok(body.includes('data-stage="backlog"'))
  assert.ok(body.includes('No cards in this stage') || body.includes('Drop a card here'))
  assert.ok(!body.includes('(empty)'))
  assert.ok(!body.includes('Open risks'))
  assert.equal(body.includes('id="risks"'), true)
})

test('live board empty columns stay open and keep New card in the toolbar', () => {
  const live = renderBoardHtml(createProject({ customer: 'Empty', template: 'lite' }), {
    endpoint: '/board/test',
    revision: 'revision',
  })
  const body = live.split('<script>')[0]
  assert.ok(!body.includes('is-collapsed'))
  assert.ok(!body.includes('data-collapsed'))
  assert.ok(body.includes('New card'))
  assert.ok(body.includes('Lite Pipeline'))
  assert.ok(body.includes('Drop a card here'))
  assert.ok(body.includes('col-hide'))
})

test('offline snapshots are visibly read-only and live boards prioritize drag over card-face stage selects', () => {
  const state = sampleState()
  assert.match(renderBoardHtml(state), /Read-only/)
  assert.match(renderBoardHtml(state), /draggable="false"/)
  const live = renderBoardHtml(state, { endpoint: '/board/test', revision: 'revision' })
  assert.match(live, /draggable="true"/)
  assert.match(live, /aria-label="Edit c1"/)
  assert.match(live, /aria-live="polite"/)
  assert.match(live, /cursor: grab/)
  assert.match(live, /Board drag-and-drop/)
  assert.match(live, /aria-label="Card stage"/)
  assert.doesNotMatch(live.split('<script>')[0], /Live local board|Drag a card into another stage/)
  // Stage moves on the card face use drag; no prominent per-card Move-to dropdown.
  const body = live.split('<script>')[0]
  assert.doesNotMatch(body, /class="move-label"/)
  assert.doesNotMatch(body, /class="stage-select"/)
  assert.match(body, /name="stage"/)
})

test('live board client wires pointer drag handlers and editor stage fallback', () => {
  const live = renderBoardHtml(sampleState(), { endpoint: '/board/test', revision: 'revision' })
  assert.match(live, /addEventListener\('dragstart'/)
  assert.match(live, /addEventListener\('dragover'/)
  assert.match(live, /addEventListener\('drop'/)
  assert.match(live, /addEventListener\('dragend'/)
  assert.match(live, /note: 'Board drag-and-drop'/)
  assert.match(live, /note: 'Board card editor'/)
  assert.match(live, /classList\.add\('drag-over'\)/)
  assert.match(live, /classList\.add\('dragging'\)/)
})

test('large boards render only thirty cards per column initially and expose load-more', () => {
  let state = createProject({ customer: 'Large', template: 'governance' })
  for (let i = 0; i < 1000; i++) state = addCard(state, { title: `Task ${i}`, stage: 'build' })
  const markup = renderBoardHtml(state).split('<script>')[0]
  assert.equal((markup.match(/<article class="card/g) ?? []).length, 30)
  assert.match(markup, /Load more \(30\/1000\)/)
  assert.match(markup, />Active</)
  assert.match(markup, /1000 cards/)
})

test('archived cards are not rendered in the initial active view', () => {
  const state = sampleState()
  state.cards[0].archivedAt = '2026-10-07T03:00:00Z'
  const markup = renderBoardHtml(state).split('<script>')[0]
  assert.equal((markup.match(/<article class="card/g) ?? []).length, 0)
  assert.match(markup, />Archive</)
})

test('English demo data keeps live, read-only and dynamic UI labels free of Chinese characters', () => {
  let state = sampleState()
  state = addCard(state, { title: 'Unassigned task', stage: 'design' })
  for (const title of ['Completed task', 'Another completed task']) {
    state = addCard(state, { title, stage: 'design' })
    state = archiveCard(state, { cardId: state.cards.at(-1).id })
  }
  const chinese = /\p{Script=Han}/u
  for (const interactive of [false, true]) {
    const html = renderBoardHtml(state, interactive ? { endpoint: '/board/test', revision: 'revision' } : {})
    assert.match(html, /<html lang="en">/)
    // Visible chrome stays English under en locale; the script may embed a zh dictionary for runtime switching.
    assert.doesNotMatch(html.split('<script>')[0], chinese)
    assert.match(html, /Unassigned/)
    const ui = { interactive, query: '', owner: '', limits: { design: 1 }, archiveLimit: 1 }
    const columns = renderColumns(state, ui)
    const archive = renderArchive(state, ui)
    assert.doesNotMatch(columns + archive, chinese)
    assert.match(columns, /Load more \(1\/2\)/)
    assert.match(archive, /Load more \(1\/2\)/)
    assert.match(archive, /archived on/)
    if (interactive) assert.match(archive, /Restore to original stage/)
    const filtered = { ...ui, query: 'no matching title' }
    const emptyColumns = renderColumns(state, filtered)
    const emptyArchive = renderArchive(state, filtered)
    assert.doesNotMatch(emptyColumns + emptyArchive, chinese)
    assert.match(emptyColumns, /No matching cards/)
    assert.match(emptyArchive, /No matching archived cards/)
  }
  const timestamp = '2026-10-07T03:00:00Z'
  const sameYear = formatTimestamp(timestamp)
  assert.match(sameYear, /^\d{2}-\d{2} \d{2}:\d{2}$/)
  assert.equal(formatTimestamp(timestamp, 'en-US'), sameYear)
  assert.equal(formatTimestamp(timestamp, 'zh-CN'), sameYear)
  const older = formatTimestamp('2025-11-02T08:54:00')
  assert.match(older, /^2025-11-02 \d{2}:\d{2}$/)
  assert.match(boardStrings('zh-CN').refresh, /刷新/)
  assert.match(renderBoardHtml(state, { locale: 'zh-CN' }), /lang="zh-CN"/)
  assert.match(renderBoardHtml(state, { locale: 'zh-CN' }), /刷新/)
})

test('bootstrap data cannot close the script or introduce executable user markup', async () => {
  const state = sampleState()
  state.customer = '</script><script>window.pwned=1</script>'
  const html = renderBoardHtml(state)
  assert.equal((html.match(/<script>/g) ?? []).length, 1)
  assert.equal((html.match(/<\/script>/g) ?? []).length, 1)
  const { Script } = await import('node:vm')
  assert.doesNotThrow(() => new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]))
})

test('live board exposes log risk UI and hides resolved risks', () => {
  let state = sampleState()
  const live = renderBoardHtml(state, { endpoint: '/board/test', revision: 'revision' })
  assert.match(live, /Log risk/)
  assert.match(live, /id="log-dialog"/)
  assert.match(live, /id="new-log"/)
  assert.match(live, /class="toolbar-more"/)
  assert.match(live, /Understaffed/)
  assert.match(live, /data-action="resolve"/)
  assert.match(live, /save\('log'/)
  assert.match(live, /save\('resolve'/)

  const riskIndex = state.logs.findIndex((entry) => entry.type === 'risk')
  state = resolveLog(state, { index: riskIndex })
  const after = renderBoardHtml(state, { endpoint: '/board/test', revision: 'revision' }).split('<script>')[0]
  assert.doesNotMatch(after, /Understaffed/)
  assert.doesNotMatch(after, /Risks \(/)
  assert.equal(renderRisks(state, true), '')
})

test('live board renders checkable DoD in detail and archive-board controls', () => {
  const state = sampleState()
  const live = renderBoardHtml(state, { endpoint: '/board/test', revision: 'revision' })
  assert.match(live, /data-action="dod-check"/)
  assert.match(live, /archive-board/)
  assert.doesNotMatch(live, /gate-check|data-action="gate"|save\('gate'/)
  assert.doesNotMatch(live.split('<script>')[0], /Delivery state is saved|Drag a card into another stage|board-footer|board-gates|class="audit"/)
})

test('risks stay collapsed by default; gates and activity are gone', () => {
  const s = createProject({ customer: 'X', template: 'default' })
  const html = renderBoardHtml(s)
  assert.doesNotMatch(html, /board-gates|class="gates"|class="audit"/)
  assert.match(html, /id="risks"/)
})

test('v0.3.0 polish-freeze: title+meta face, touch ⋯ overlay, quiet secondary views', () => {
  let state = sampleState()
  state = appendLog(state, { type: 'blocker', text: 'Waiting', cardId: 'c1' })
  state = addCard(state, { title: 'Ship notes', stage: 'build', owner: 'dana' })
  state = archiveCard(state, { cardId: 'c2' })
  const live = renderBoardHtml(state, { endpoint: '/board/test', revision: 'revision' })
  const body = live.split('<script>')[0]
  assert.match(body, /class="card-menu"/)
  assert.match(body, /aria-label="Card actions"/)
  assert.doesNotMatch(body, /class="card-top"/)
  assert.doesNotMatch(body, /class="drag-hint"/)
  assert.match(body, /\.card-menu \{ position: absolute/)
  // Touch: quiet always-visible ⋯; desktop stays opacity 0 until hover.
  assert.match(body, /@media \(hover: none\)/)
  assert.match(body, /\.card-menu > summary \{ opacity: \.55/)
  assert.doesNotMatch(body, /class="card-actions"/)
  assert.doesNotMatch(body, /class="card-extras"/)
  assert.doesNotMatch(body, /class="chip/)
  assert.doesNotMatch(body, /\d+ criteria/)
  assert.match(body, /name="acceptance"/)
  assert.match(body, /name="dod"/)
  assert.doesNotMatch(body, /style="--stage:/)
  assert.match(body, /--accent: #171717/)
  assert.doesNotMatch(body, /#5c6ac4/)
  assert.match(body, /border-radius: var\(--radius\)/)
  assert.match(body, /box-shadow: none/)
  assert.doesNotMatch(body, /class="col-role"/)
  assert.match(body, /class="toolbar-more"/)
  assert.doesNotMatch(body, /board-gates|class="audit"/)
  assert.match(body, />Active</)
  assert.match(body, />Timeline</)
  assert.match(body, />Archive</)
  assert.doesNotMatch(body, /Active cards|Archived \(/)
  assert.doesNotMatch(body, /last-updated|Updated:/)
  assert.doesNotMatch(body, /Live local board/)
  assert.match(body, /class="blocked-meta"/)
  assert.doesNotMatch(body, /meta-flag/)
  assert.match(body, /<details class="risks">/)
  assert.doesNotMatch(body, /<details class="risks" open>/)
  assert.doesNotMatch(body, /font-weight: 650/)
  // Archive cards share title+meta + menu overlay (Restore in ⋯, not a face strip).
  const archive = renderArchive(state, { interactive: true, query: '', owner: '', archiveLimit: 30, strings: boardStrings() })
  assert.match(archive, /class="card-menu"/)
  assert.match(archive, /data-action="restore"/)
  assert.doesNotMatch(archive, /class="card-actions"/)
  // Secondary views: no heavy surface panel chrome on archive/timeline wrappers.
  assert.match(body, /\.archive-panel \{[^}]*background: transparent/)
  assert.match(body, /\.timeline-panel \{[^}]*background: transparent/)
})

test('zh locale keeps bilingual chrome without stage checklist or activity', () => {
  const html = renderBoardHtml(createProject({ customer: 'X', template: 'default' }), { locale: 'zh-CN' })
  const body = html.split('<script>')[0]
  assert.doesNotMatch(body, /阶段检查清单|活动 ·|board-gates|class="audit"/)
  assert.match(body, /归档整板/)
  const en = renderBoardHtml(createProject({ customer: 'X', template: 'default' }), { locale: 'en' }).split('<script>')[0]
  assert.match(en, /Archive board/)
  assert.doesNotMatch(en, /Stage checklist|Activity ·/)
})

test('empty columns render full-width with empty state and a header hide control', () => {
  const state = createProject({ customer: 'Empty', template: 'lite' })
  const html = renderColumns(state, { interactive: true, query: '', owner: '', limits: {}, strings: boardStrings() })
  assert.doesNotMatch(html, /is-collapsed/)
  assert.match(html, /Drop a card here/)
  assert.match(html, /data-stage="backlog"/)
  assert.match(html, /class="col-hide"/)
  assert.match(html, /aria-label="Hide column"/)
  assert.doesNotMatch(html, /col-menu/)
})

test('hiddenStages omit columns, keep +N hidden control, and persist card counts', () => {
  let state = createProject({ customer: 'Hide', template: 'lite' })
  state = addCard(state, { title: 'Work', stage: 'doing', owner: 'Ada' })
  state = setStageHidden(state, { stageId: 'backlog', hidden: true })
  assert.deepEqual(state.hiddenStages, ['backlog'])
  const live = renderBoardHtml(state, { endpoint: '/board/test', revision: 'r1', locale: 'en' })
  const body = live.split('<script>')[0]
  assert.doesNotMatch(body, /data-stage="backlog"/)
  assert.match(body, /data-stage="doing"/)
  assert.match(body, /data-stage="review"/)
  assert.match(body, /\+1 hidden/)
  // Hide is a direct header icon button; Show lives on the +N panel
  assert.match(body, /data-action="hide"/)
  assert.match(body, /class="col-hide"/)
  assert.doesNotMatch(body, /col-menu|is-collapsed/)
  assert.match(body, /data-action="show"/)
  assert.match(live, /dataset\.action === 'hide'|action === 'hide'/)
  assert.match(live, /save\(button\.dataset\.action/)
  state = setStageHidden(state, { stageId: 'doing', hidden: true })
  assert.deepEqual(state.hiddenStages, ['backlog', 'doing'])
  const both = renderBoardHtml(state, { endpoint: '/board/test', revision: 'r1', locale: 'en' }).split('<script>')[0]
  assert.doesNotMatch(both, /data-stage="doing"/)
  assert.match(both, /\+2 hidden · 1/)
  const offline = renderBoardHtml(state, { locale: 'en' }).split('<script>')[0]
  assert.doesNotMatch(offline, /data-stage="doing"/)
  assert.match(offline, /\+2 hidden · 1/)
})

test('card body click opens read-only detail with history; Edit only when interactive', () => {
  let state = sampleState()
  state = appendLog(state, { type: 'decision', text: 'Go ahead', cardId: 'c1' })
  const detail = renderCardDetail(state.cards[0], state, boardStrings('en'), { canEdit: true })
  assert.match(detail, /SSO login/)
  assert.match(detail, /Acceptance criteria/)
  assert.match(detail, /Definition of done/)
  assert.match(detail, /Handoffs &amp; decisions/)
  assert.match(detail, /PRD reviewed/)
  assert.match(detail, /Go ahead/)
  assert.match(detail, /data-action="detail-edit"/)
  const ro = renderCardDetail(state.cards[0], state, boardStrings('en'), { canEdit: false })
  assert.doesNotMatch(ro, /data-action="detail-edit"/)
  const live = renderBoardHtml(state, { endpoint: '/board/x', revision: 'r' })
  assert.match(live, /id="detail-dialog"/)
  assert.match(live, /showDetail\(/)
  assert.match(live, /renderCardDetail/)
  const offline = renderBoardHtml(state).split('<script>')[0]
  assert.match(offline, /id="detail-dialog"/)
})

test('card description appears on the board, detail, form and offline export', () => {
  let state = createProject({ customer: 'Desc', template: 'lite' })
  state = addCard(state, {
    title: 'With desc',
    stage: 'doing',
    owner: 'Ada',
    description: 'Short note\nSecond line that is long enough to clamp on the card face when rendered.',
  })
  const live = renderBoardHtml(state, { endpoint: '/board/test', revision: 'r1', locale: 'en' })
  const body = live.split('<script>')[0]
  assert.match(body, /class="card-desc"/)
  assert.match(body, /Short note/)
  assert.match(body, /name="description"/)
  assert.match(body, /-webkit-line-clamp:\s*2/)
  const detail = renderCardDetail(state.cards[0], state, boardStrings('en'), { canEdit: true })
  assert.match(detail, /class="detail-desc"/)
  assert.match(detail, /Short note/)
  assert.match(detail, /Second line/)
})

test('cards show muted DoD progress and detail lists checkable items', () => {
  let state = createProject({ customer: 'X', template: 'lite' })
  state = addCard(state, {
    title: 'API', stage: 'doing', owner: 'Ada', start: '2026-11-01', due: '2026-11-10',
    dod: [{ text: 'Specs', done: true, doneAt: '2026-11-02T09:03:00.000Z', doneBy: 'Ada' }, { text: 'Tests', done: false }],
  })
  const live = renderBoardHtml(state, { endpoint: '/board/test', revision: 'revision', locale: 'zh-CN' })
  const body = live.split('<script>')[0]
  assert.match(body, /class="dod-progress">1\/2</)
  assert.match(body, /name="start"/)
  const detail = renderCardDetail(state.cards[0], state, boardStrings('zh-CN'), { canEdit: true })
  assert.match(detail, /开始/)
  assert.match(detail, /2026-11-01/)
  assert.match(detail, /data-action="dod-check"/)
  assert.match(detail, /class="dod-item done"/)
  assert.match(detail, /09:03|11-02/)
  const offline = renderCardDetail(state.cards[0], state, boardStrings('zh-CN'), { canEdit: false })
  assert.doesNotMatch(offline, /data-action="dod-check"/)
  assert.match(offline, /class="dod-item done"/)
})

test('detail history localizes auto handoff/decision text; legacy English still works', () => {
  let state = createProject({ customer: '蒂芙尼', template: 'lite' })
  state = addCard(state, { title: '会员积分兑换页', stage: 'backlog', owner: '小林' })
  state = moveCard(state, { cardId: 'c1', toStage: 'doing', note: '需求已确认，进入开发' })
  assert.equal(state.logs.at(-1).event.kind, 'move')
  assert.match(state.logs.at(-1).text, /moved from Backlog → Doing/)
  const zh = renderCardDetail(state.cards[0], state, boardStrings('zh-CN'), { canEdit: true })
  assert.match(zh, /「会员积分兑换页」从 Backlog 移到 Doing：需求已确认，进入开发/)
  assert.doesNotMatch(zh, /moved from/)
  const en = renderCardDetail(state.cards[0], state, boardStrings('en'), { canEdit: true })
  assert.match(en, /&quot;会员积分兑换页&quot; moved from Backlog → Doing: 需求已确认，进入开发/)

  // Legacy entry without event still localizes at display time.
  const legacyState = {
    ...state,
    logs: [{
      ts: '2026-11-01T09:00:00.000Z',
      type: 'handoff',
      cardId: 'c1',
      text: '"会员积分兑换页" moved from Backlog → Doing: 旧记录',
    }],
  }
  const legacyZh = renderCardDetail(legacyState.cards[0], legacyState, boardStrings('zh'), { canEdit: false })
  assert.match(legacyZh, /「会员积分兑换页」从 Backlog 移到 Doing：旧记录/)
  assert.doesNotMatch(legacyZh, /moved from/)

  state = archiveCard(state, { cardId: 'c1' })
  const archZh = renderCardDetail(state.cards[0], state, boardStrings('zh'), { canEdit: false })
  assert.match(archZh, /「会员积分兑换页」已归档/)
  assert.doesNotMatch(archZh, /"会员积分兑换页" archived/)
})
