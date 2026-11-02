// Embedded as source in the standalone HTML; only the live board may persist.
export function boardClient(boot) {
  let state = boot.state
  let revision = boot.revision
  let busy = false
  let dragged = null
  let editingId = null
  const locale = resolveBoardLocale(boot.locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en-US'))
  let strings = boardStrings(locale)
  const ui = { interactive: Boolean(boot.endpoint), query: '', owner: '', view: 'active', limits: {}, archiveLimit: 30, locale, strings }
  const $ = (selector) => document.querySelector(selector)
  const board = $('#board')
  const archive = $('#archive')
  const timeline = $('#timeline')
  const form = $('#card-form')
  const dialog = $('#card-dialog')
  const logForm = $('#log-form')
  const logDialog = $('#log-dialog')
  const detailDialog = $('#detail-dialog')
  const detailBody = $('#detail-body')
  const status = $('#save-status')
  const interactiveHit = 'button, a, input, select, textarea, summary, label, .copybtn, .card-menu, .col-hide'
  let pointerCard = null
  let pointerMoved = false

  document.documentElement.lang = locale.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'

  function feedback(text, error = false) {
    status.textContent = text
    status.classList.toggle('error', error)
  }
  function clearDrag() {
    dragged = null
    board.querySelectorAll('.drag-over, .dragging').forEach((item) => item.classList.remove('drag-over', 'dragging'))
  }
  function applyChrome() {
    strings = boardStrings(locale)
    ui.strings = strings
    ui.locale = locale
    const activeCount = state.cards.filter((card) => card.archivedAt == null).length
    $('#search').placeholder = strings.searchPlaceholder
    $('#search').setAttribute('aria-label', strings.searchPlaceholder)
    $('#refresh').textContent = strings.refresh
    $('#new-card').textContent = strings.newCard
    $('#new-log').textContent = strings.newLog
    const archiveBoardBtn = $('#archive-board')
    if (archiveBoardBtn) archiveBoardBtn.textContent = strings.archiveBoard ?? 'Archive board…'
    if (!status.classList.contains('error') && (status.textContent === '' || status.textContent === strings.liveStatus || status.textContent === strings.readonlyStatus)) {
      status.textContent = ui.interactive ? strings.liveStatus : strings.readonlyStatus
    }
    $('#summary-count').textContent = strings.activeCount(activeCount)
    $('#active-view').textContent = strings.viewActive
    $('#archive-view').textContent = strings.viewArchive
    $('#timeline-view').textContent = strings.viewTimeline
  }
  function draw() {
    applyChrome()
    board.innerHTML = renderColumns(state, ui)
    archive.innerHTML = renderArchive(state, ui)
    timeline.innerHTML = ui.view === 'timeline' ? renderTimeline(state, ui) : ''
    board.hidden = ui.view !== 'active'
    archive.hidden = ui.view !== 'archive'
    timeline.hidden = ui.view !== 'timeline'
    $('#timeline-view').setAttribute('aria-pressed', String(ui.view === 'timeline'))
    $('#active-view').setAttribute('aria-pressed', String(ui.view === 'active'))
    $('#archive-view').setAttribute('aria-pressed', String(ui.view === 'archive'))
    $('#risks').innerHTML = renderRisks(state, ui.interactive, strings)
    const hiddenSlot = $('#hidden-stages-slot')
    if (hiddenSlot) hiddenSlot.innerHTML = renderHiddenStagesControl(state, ui)
    const owners = [...new Set(state.cards.map((card) => card.owner).filter(Boolean))].sort()
    $('#owner-filter').innerHTML = `<option value="">${escapeHtml(strings.allOwners)}</option>` + owners.map((owner) => `<option value="${escapeHtml(owner)}">${escapeHtml(owner)}</option>`).join('')
    $('#owner-filter').value = ui.owner
    document.querySelectorAll('[data-live]').forEach((control) => { control.disabled = busy || !ui.interactive })
    document.querySelectorAll('[data-action]').forEach((control) => { control.disabled = busy })
    document.querySelectorAll('[draggable="true"]').forEach((card) => { card.draggable = !busy })
  }
  async function request(path, options = {}) {
    const response = await fetch(`${boot.endpoint}/${path}`, { cache: 'no-store', ...options })
    const body = await response.json()
    if (!response.ok) throw Object.assign(new Error(body.error ?? 'Save failed'), { status: response.status })
    return body
  }
  async function save(action, args) {
    if (busy || !ui.interactive) return false
    busy = true
    feedback('Saving…')
    draw()
    try {
      const result = await request('action', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, args, revision }) })
      state = result.state
      revision = result.revision
      feedback(strings.saved)
      return true
    } catch (error) {
      feedback(error.status === 409 ? 'Not saved: Data has changed. Click "Refresh" and try again.' : `Not saved: ${error.message}`, true)
      return false
    } finally { busy = false; draw() }
  }
  $('#search').addEventListener('input', (event) => { ui.query = event.target.value; ui.limits = {}; ui.archiveLimit = 30; draw() })
  $('#owner-filter').addEventListener('change', (event) => { ui.owner = event.target.value; ui.limits = {}; ui.archiveLimit = 30; draw() })
  $('#active-view').addEventListener('click', () => { ui.view = 'active'; draw() })
  $('#archive-view').addEventListener('click', () => { ui.view = 'archive'; draw() })
  $('#timeline-view').addEventListener('click', () => { ui.view = 'timeline'; draw() })
  $('#refresh').addEventListener('click', async () => {
    if (busy || !ui.interactive) return
    busy = true; draw(); feedback('Refreshing…')
    try { const result = await request('state'); state = result.state; revision = result.revision; feedback(strings.saved) }
    catch (error) { feedback(`Refresh failed: ${error.message}`, true) }
    finally { busy = false; draw() }
  })

  function showEditor(card = null) {
    editingId = card?.id ?? null
    $('#dialog-title').textContent = card ? `Edit ${card.id}` : 'New card'
    form.elements.title.value = card?.title ?? ''
    form.elements.owner.value = card?.owner ?? ''
    form.elements.start.value = card?.start ?? ''
    form.elements.due.value = card?.due ?? ''
    form.elements.description.value = card?.description ?? ''
    form.elements.acceptance.value = (card?.acceptance ?? []).join('\n')
    form.elements.dod.value = (card?.dod ?? []).map((item) => typeof item === 'string' ? item : String(item?.text ?? '')).filter(Boolean).join('\n')
    form.elements.stage.innerHTML = state.pipeline.map((stage) => `<option value="${escapeHtml(stage.id)}">${escapeHtml(stage.name)}</option>`).join('')
    form.elements.stage.value = card?.stage ?? state.pipeline[0].id
    form.elements.stage.disabled = false
    const descLabel = form.querySelector('[data-label="description"]')
    if (descLabel) {
      const input = descLabel.querySelector('textarea')
      descLabel.textContent = strings.fieldDescription ?? 'Description'
      if (input) descLabel.appendChild(input)
    }
    $('#form-error').textContent = ''
    dialog.showModal()
    form.elements.title.focus()
  }
  function showLogEditor() {
    logForm.elements.type.value = 'risk'
    logForm.elements.text.value = ''
    const cards = state.cards.filter((card) => card.archivedAt == null)
    logForm.elements.card_id.innerHTML = '<option value="">None</option>' + cards.map((card) => `<option value="${escapeHtml(card.id)}">${escapeHtml(card.id)} · ${escapeHtml(card.title)}</option>`).join('')
    $('#log-form-error').textContent = ''
    logDialog.showModal()
    logForm.elements.text.focus()
  }
  function showDetail(card) {
    if (!card || !detailDialog || !detailBody) return
    detailBody.innerHTML = renderCardDetail(card, state, strings, { canEdit: ui.interactive && card.archivedAt == null })
    detailDialog.showModal()
    const title = detailBody.querySelector('#detail-title')
    if (title) title.focus({ preventScroll: true })
  }
  $('#new-card').addEventListener('click', () => showEditor())
  $('#new-log').addEventListener('click', () => showLogEditor())
  $('#cancel-edit').addEventListener('click', () => dialog.close())
  $('#cancel-log').addEventListener('click', () => logDialog.close())
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (busy) return
    const stage = form.elements.stage.value
    const fields = { title: form.elements.title.value, owner: form.elements.owner.value, start: form.elements.start.value || null, due: form.elements.due.value || null, description: form.elements.description.value, acceptance: form.elements.acceptance.value.split('\n').filter((line) => line.trim()), dod: form.elements.dod.value.split('\n').filter((line) => line.trim()) }
    $('#submit-edit').disabled = true
    let saved = false
    if (editingId) {
      const previous = state.cards.find((card) => card.id === editingId)
      saved = await save('update', { card_id: editingId, ...fields })
      if (saved && previous && previous.stage !== stage) {
        saved = await save('move', { card_id: editingId, to_stage: stage, note: 'Board card editor' })
      }
    } else {
      saved = await save('card', { ...fields, stage })
    }
    $('#submit-edit').disabled = false
    if (saved) dialog.close()
    else $('#form-error').textContent = status.textContent
  })
  logForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (busy) return
    const args = { type: logForm.elements.type.value, text: logForm.elements.text.value }
    if (logForm.elements.card_id.value) args.card_id = logForm.elements.card_id.value
    $('#submit-log').disabled = true
    const saved = await save('log', args)
    $('#submit-log').disabled = false
    if (saved) logDialog.close()
    else $('#log-form-error').textContent = status.textContent
  })

  document.addEventListener('click', async (event) => {
    const menu = event.target.closest('.card-menu, .hidden-stages, .toolbar-more')
    document.querySelectorAll('.card-menu[open], .hidden-stages[open], .toolbar-more[open]').forEach((item) => {
      if (item !== menu && !item.contains(menu)) item.removeAttribute('open')
    })
    const more = event.target.closest('[data-more]')
    if (more) {
      const stage = more.dataset.more
      if (stage === 'archive') ui.archiveLimit += 30
      else ui.limits[stage] = (ui.limits[stage] ?? 30) + 30
      draw(); return
    }
    const copy = event.target.closest('.copybtn')
    if (copy) {
      try { await navigator.clipboard.writeText(copy.dataset.cmd); copy.textContent = '/delivery-admin command copied' }
      catch { feedback('Copy failed: Run /delivery-admin help in DSH to see commands.', true) }
      return
    }
    const button = event.target.closest('[data-action]')
    if (button) {
      if (busy && button.dataset.action !== 'detail-close') return
      if (button.dataset.action === 'detail-close') { detailDialog?.close(); return }
      if (button.dataset.action === 'detail-edit') {
        const id = button.dataset.cardId
        detailDialog?.close()
        showEditor(state.cards.find((card) => card.id === id))
        return
      }
      if (button.dataset.action === 'resolve') {
        await save('resolve', { log_index: Number(button.dataset.logIndex) })
        return
      }
      if (button.dataset.action === 'hide' || button.dataset.action === 'show') {
        if (!ui.interactive || busy) return
        await save(button.dataset.action, { stage_id: button.dataset.stageId })
        return
      }
      const host = button.closest('[data-card-id]')
      if (!host) return
      const cardId = host.dataset.cardId
      if (button.dataset.action === 'edit') showEditor(state.cards.find((card) => card.id === cardId))
      else await save(button.dataset.action, { card_id: cardId })
      return
    }
    const cardEl = event.target.closest('.card[data-card-id]')
    if (cardEl && !event.target.closest(interactiveHit) && !pointerMoved) {
      showDetail(state.cards.find((card) => card.id === cardEl.dataset.cardId))
    }
  })
  document.addEventListener('change', async (event) => {
    const input = event.target.closest('input[data-action="dod-check"]')
    if (!input || busy || !ui.interactive) return
    const cardId = input.dataset.cardId
    const index = Number(input.dataset.dodIndex)
    const done = input.checked
    const card = state.cards.find((item) => item.id === cardId)
    const saved = await save('dod_check', { card_id: cardId, index, done, done_by: card?.owner || undefined })
    if (!saved) input.checked = !done
    else if (detailDialog?.open) {
      const next = state.cards.find((item) => item.id === cardId)
      if (next) showDetail(next)
    }
  })
  const archiveBoardDialog = $('#archive-board-dialog')
  $('#archive-board')?.addEventListener('click', () => {
    const title = $('#archive-board-title')
    const body = $('#archive-board-body')
    if (title) title.textContent = strings.archiveBoardConfirmTitle ?? 'Archive this board?'
    if (body) body.textContent = strings.archiveBoardConfirmBody ?? ''
    $('#archive-board-error').textContent = ''
    $('#confirm-archive-board').textContent = strings.archiveBoardConfirm ?? 'Archive board'
    $('#cancel-archive-board').textContent = strings.archiveBoardCancel ?? 'Cancel'
    archiveBoardDialog?.showModal()
  })
  $('#cancel-archive-board')?.addEventListener('click', () => archiveBoardDialog?.close())
  $('#confirm-archive-board')?.addEventListener('click', async () => {
    if (busy || !ui.interactive) return
    $('#confirm-archive-board').disabled = true
    const saved = await save('archive_board', {})
    $('#confirm-archive-board').disabled = false
    if (saved) archiveBoardDialog?.close()
    else $('#archive-board-error').textContent = status.textContent
  })
  board.addEventListener('pointerdown', (event) => {
    const card = event.target.closest('.card[data-card-id]')
    pointerCard = card && !event.target.closest(interactiveHit) ? card.dataset.cardId : null
    pointerMoved = false
  })
  board.addEventListener('pointermove', (event) => {
    if (pointerCard && (Math.abs(event.movementX) > 2 || Math.abs(event.movementY) > 2)) pointerMoved = true
  })
  board.addEventListener('dragstart', (event) => {
    const card = event.target.closest('[data-card-id]')
    if (!card || busy || !ui.interactive || event.target.closest(interactiveHit)) { event.preventDefault(); return }
    pointerMoved = true
    dragged = card.dataset.cardId
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', dragged)
    card.classList.add('dragging')
  })
  board.addEventListener('dragover', (event) => {
    const column = event.target.closest('[data-stage]')
    if (!column || !dragged || busy) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    board.querySelectorAll('.drag-over').forEach((item) => item.classList.remove('drag-over'))
    column.classList.add('drag-over')
  })
  board.addEventListener('dragleave', (event) => {
    const column = event.target.closest('[data-stage]')
    if (!column) return
    const next = event.relatedTarget instanceof Element ? event.relatedTarget : null
    if (next && column.contains(next)) return
    column.classList.remove('drag-over')
  })
  board.addEventListener('drop', async (event) => {
    const column = event.target.closest('[data-stage]')
    event.preventDefault()
    const cardId = dragged
    clearDrag()
    if (!column || !cardId || busy) return
    const target = column.dataset.stage
    if (state.cards.find((card) => card.id === cardId)?.stage !== target) await save('move', { card_id: cardId, to_stage: target, note: 'Board drag-and-drop' })
  })
  board.addEventListener('dragend', () => { clearDrag() })
  draw()
}
