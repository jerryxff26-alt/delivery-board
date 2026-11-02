export function boardUiTables() {
  return {
    en: {
      allOwners: 'All owners',
      viewActive: 'Active',
      viewArchive: 'Archive',
      refresh: 'Refresh',
      newCard: 'New card',
      newLog: 'Log risk',
      searchPlaceholder: 'Search ID, title or owner',
      activeCount: (n) => `${n} cards`,
      liveStatus: '',
      readonlyStatus: 'Read-only',
      saved: 'Saved',
      hideStage: 'Hide',
      hideColumn: 'Hide column',
      showStage: 'Show',
      hiddenToggle: (n, cards) => cards ? `+${n} hidden · ${cards}` : `+${n} hidden`,
      hiddenMenu: 'Hidden stages',
      detailTitle: 'Card detail',
      fieldDescription: 'Description',
      detailEdit: 'Edit',
      detailClose: 'Close',
      detailStage: 'Stage',
      detailOwner: 'Owner',
      detailStart: 'Start',
      detailDue: 'Due',
      detailBlocked: 'Blocked',
      detailAc: 'Acceptance criteria',
      detailDod: 'Definition of done',
      detailHistory: 'Handoffs & decisions',
      detailEmptyList: 'None',
      detailNoHistory: 'No handoffs or decisions yet',
      detailTypeHandoff: 'handoff',
      detailTypeDecision: 'decision',
      openRisks: (n) => `Risks (${n})`,
      resolve: 'Resolve',
      archiveBoard: 'Archive board…',
      archiveBoardConfirmTitle: 'Archive this board?',
      archiveBoardConfirmBody: 'Save a read-only snapshot under delivery-archive/, then reset to an empty board with the same pipeline.',
      archiveBoardConfirm: 'Archive board',
      archiveBoardCancel: 'Cancel',
      archiveTitle: (n) => `Archived · ${n}`,
      archiveHelp: 'Archiving hides cards but keeps their IDs, original stages, acceptance criteria and history. Restore a card to keep editing.',
      empty: 'Drop a card here · New card',
      emptyReadonly: 'No cards in this stage',
      noMatch: 'No matching cards',
      noMatchArchive: 'No matching archived cards',
      loadMore: (a, b) => `Load more (${a}/${b})`,
      edit: 'Edit',
      archiveBtn: 'Archive',
      restoreBtn: 'Restore to original stage',
      cardMenu: 'Card actions',
      moreMenu: 'More',
      copyHandoff: 'Copy handoff',
      due: 'due ',
      unassigned: 'Unassigned',
      blocker: 'blocked',
      archivedOn: 'archived on',
      wipLabel: (n, limit) => `WIP ${n}/${limit}`,
      wipSoft: 'Over WIP',
      viewTimeline: 'Timeline',
      viewsLabel: 'Board views',
      timelineTitle: (n) => `Timeline · ${n} card(s)`,
      timelineHelp: 'Calendar axis: handoff bars follow creation → stage moves. A schedule bar spans start→due when both are set; ◆ marks due-only.',
      timelineCard: 'Card',
      legend: 'Legend',
      legendStage: 'Stage span',
      legendSchedule: 'Schedule (start→due)',
      today: 'Today',
      legendDue: 'Due',
      legendOverdue: 'Overdue',
      legendShipped: 'Shipped',
      legendArchived: 'Archived',
      timelineArchived: 'Archived',
      undated: (n) => `No dates yet (${n})`,
      undatedHelp: 'These cards have no creation, handoff or due date to place on the calendar.',
      noStart: 'no start date',
      timelineEmpty: 'No cards to place on the timeline',
      daysSpan: (n) => `${n}d`,
      shippedOn: 'shipped',
      dueOn: 'due',
      clipped: 'Earlier history is outside the visible window',
      logNone: '(none)',
      logField: {
        title: 'title', owner: 'owner', start: 'start', due: 'due', description: 'description',
        acceptance: 'acceptance', dod: 'dod', name: 'name', role: 'role', wipLimit: 'wipLimit',
      },
      logMove: (title, from, to, note) => note
        ? `"${title}" moved from ${from} → ${to}: ${note}`
        : `"${title}" moved from ${from} → ${to}`,
      logOwnerChange: (title, fromOwner, toOwner, stage, note) => {
        const base = `"${title}" owner changed: ${fromOwner} → ${toOwner} (stage unchanged: ${stage})`
        return note ? `${base}: ${note}` : base
      },
      logNote: (title, stage, note) => {
        const base = `"${title}" note (stage unchanged: ${stage})`
        return note ? `${base}: ${note}` : base
      },
      logArchive: (title) => `"${title}" archived`,
      logRestore: (title) => `"${title}" restored`,
      logUpdate: (title, fields) => `"${title}" updated: ${fields}`,
      logDodAdd: (title) => `"${title}" DoD added`,
      logStageUpdate: (name, id, fields) => `Stage "${name}" (${id}) updated: ${fields}`,
      logStageRemove: (name, id, migrate) => `Stage "${name}" (${id}) removed${migrate || ''}`,
      logStageMigrate: (n, to) => `; ${n} card(s) moved to ${to}`,
    },
    zh: {
      allOwners: '全部负责人',
      viewActive: '进行中',
      viewArchive: '归档',
      refresh: '刷新',
      newCard: '新建卡片',
      newLog: '记录风险',
      searchPlaceholder: '搜索 ID、标题或负责人',
      activeCount: (n) => `${n} 张卡片`,
      liveStatus: '',
      readonlyStatus: '只读',
      saved: '已保存',
      hideStage: '隐藏',
      hideColumn: '隐藏此列',
      showStage: '显示',
      hiddenToggle: (n, cards) => cards ? `+${n} 已隐藏 · ${cards}` : `+${n} 已隐藏`,
      hiddenMenu: '已隐藏阶段',
      detailTitle: '卡片详情',
      fieldDescription: '描述',
      detailEdit: '编辑',
      detailClose: '关闭',
      detailStage: '阶段',
      detailOwner: '负责人',
      detailStart: '开始',
      detailDue: '截止',
      detailBlocked: '阻塞',
      detailAc: '验收标准',
      detailDod: '完成定义',
      detailHistory: '交接与决策',
      detailEmptyList: '无',
      detailNoHistory: '暂无交接或决策记录',
      detailTypeHandoff: '交接',
      detailTypeDecision: '决策',
      openRisks: (n) => `风险 (${n})`,
      resolve: '标记已解决',
      archiveBoard: '归档整板…',
      archiveBoardConfirmTitle: '归档整板？',
      archiveBoardConfirmBody: '将当前状态保存到 delivery-archive/，然后清空看板（保留同一流水线）。',
      archiveBoardConfirm: '归档整板',
      archiveBoardCancel: '取消',
      archiveTitle: (n) => `已归档 · ${n}`,
      archiveHelp: '归档会隐藏卡片，但保留 ID、原阶段、验收标准与历史。恢复后可继续编辑。',
      empty: '拖入卡片，或点「新建卡片」',
      emptyReadonly: '本列暂无卡片',
      noMatch: '无匹配卡片',
      noMatchArchive: '无匹配的已归档卡片',
      loadMore: (a, b) => `加载更多 (${a}/${b})`,
      edit: '编辑',
      archiveBtn: '归档',
      restoreBtn: '恢复到原阶段',
      cardMenu: '卡片操作',
      moreMenu: '更多',
      copyHandoff: '复制交接',
      due: '截止 ',
      unassigned: '未分配',
      blocker: '阻塞',
      archivedOn: '归档于',
      wipLabel: (n, limit) => `WIP ${n}/${limit}`,
      wipSoft: '超出 WIP',
      viewTimeline: '时间线',
      viewsLabel: '看板视图',
      timelineTitle: (n) => `时间线 · ${n} 张卡片`,
      timelineHelp: '日历轴：交接条从创建到各阶段；同时有开始与截止时画计划条；仅截止时用 ◆ 标记。',
      timelineCard: '卡片',
      legend: '图例',
      legendStage: '阶段区间',
      legendSchedule: '计划（开始→截止）',
      today: '今天',
      legendDue: '截止',
      legendOverdue: '已逾期',
      legendShipped: '已上线',
      legendArchived: '已归档',
      timelineArchived: '已归档',
      undated: (n) => `暂无日期 (${n})`,
      undatedHelp: '这些卡片没有可放到日历上的创建、交接或截止日期。',
      noStart: '无开始日期',
      timelineEmpty: '暂无可显示在时间线上的卡片',
      daysSpan: (n) => `${n} 天`,
      shippedOn: '上线',
      dueOn: '截止',
      clipped: '更早的历史不在当前可见范围内',
      logNone: '（无）',
      logField: {
        title: '标题', owner: '负责人', start: '开始', due: '截止', description: '描述',
        acceptance: '验收标准', dod: '完成定义', name: '名称', role: '角色', wipLimit: 'WIP 上限',
      },
      logMove: (title, from, to, note) => note
        ? `「${title}」从 ${from} 移到 ${to}：${note}`
        : `「${title}」从 ${from} 移到 ${to}`,
      logOwnerChange: (title, fromOwner, toOwner, stage, note) => {
        const base = `「${title}」负责人变更：${fromOwner} → ${toOwner}（阶段未变：${stage}）`
        return note ? `${base}：${note}` : base
      },
      logNote: (title, stage, note) => {
        const base = `「${title}」备注（阶段未变：${stage}）`
        return note ? `${base}：${note}` : base
      },
      logArchive: (title) => `「${title}」已归档`,
      logRestore: (title) => `「${title}」已恢复`,
      logUpdate: (title, fields) => `「${title}」已更新：${fields}`,
      logDodAdd: (title) => `「${title}」已添加完成定义项`,
      logStageUpdate: (name, id, fields) => `阶段「${name}」（${id}）已更新：${fields}`,
      logStageRemove: (name, id, migrate) => `阶段「${name}」（${id}）已移除${migrate || ''}`,
      logStageMigrate: (n, to) => `；${n} 张卡片移至 ${to}`,
    },
  }
}

export function resolveBoardLocale(explicit) {
  if (explicit) return explicit
  if (typeof navigator !== 'undefined' && navigator.language) return navigator.language
  return 'en-US'
}

export function boardStrings(locale) {
  const tag = resolveBoardLocale(locale).toLowerCase()
  const tables = boardUiTables()
  return tag.startsWith('zh') ? tables.zh : tables.en
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/** Resolve structured auto-log event, including legacy English-only entries. */
export function resolveAutoLogEvent(entry) {
  if (!entry || typeof entry !== 'object') return null
  if (entry.event && typeof entry.event === 'object' && entry.event.kind) return entry.event
  const text = String(entry.text ?? '')
  let m
  m = /^"([^"]*)" moved from (.+) → ([^:]+)(?:: (.*))?$/.exec(text)
  if (m) {
    const event = { kind: 'move', title: m[1], from: m[2], to: m[3] }
    if (m[4]) event.note = m[4]
    return event
  }
  m = /^"([^"]*)" owner changed: (.*) → (.*) \(stage unchanged: ([^)]+)\)(?:: (.*))?$/.exec(text)
  if (m) {
    const event = { kind: 'owner_change', title: m[1], fromOwner: m[2], toOwner: m[3], stageName: m[4] }
    if (m[5]) event.note = m[5]
    return event
  }
  m = /^"([^"]*)" note \(stage unchanged: ([^)]+)\)(?:: (.*))?$/.exec(text)
  if (m) {
    const event = { kind: 'note', title: m[1], stageName: m[2] }
    if (m[3]) event.note = m[3]
    return event
  }
  m = /^"([^"]*)" archived$/.exec(text)
  if (m) return { kind: 'archive', title: m[1] }
  m = /^"([^"]*)" restored$/.exec(text)
  if (m) return { kind: 'restore', title: m[1] }
  m = /^"([^"]*)" updated: (.+)$/.exec(text)
  if (m) return { kind: 'update', title: m[1], fields: m[2].split(', ').filter(Boolean) }
  m = /^"([^"]*)" DoD added$/.exec(text)
  if (m) return { kind: 'dod_add', title: m[1] }
  m = /^Stage "([^"]*)" \(([^)]+)\) updated: (.+)$/.exec(text)
  if (m) return { kind: 'stage_update', stageName: m[1], stageId: m[2], fields: m[3].split(', ').filter(Boolean) }
  m = /^Stage "([^"]*)" \(([^)]+)\) removed(?:; (\d+) card\(s\) moved to (.+))?$/.exec(text)
  if (m) {
    const event = { kind: 'stage_remove', stageName: m[1], stageId: m[2] }
    if (m[3]) {
      event.migrateCount = Number(m[3])
      event.migrateTo = m[4]
    }
    return event
  }
  return null
}

/** Locale-aware display text for a log entry. Falls back to stored text. */
export function formatLogText(entry, strings) {
  const t = strings ?? boardStrings()
  const event = resolveAutoLogEvent(entry)
  if (!event) return entry?.text ?? ''
  const none = t.logNone ?? '(none)'
  const fieldLabel = (key) => (t.logField && t.logField[key]) || key
  const fields = (event.fields || []).map(fieldLabel).join(', ')
  switch (event.kind) {
    case 'move':
      return t.logMove(event.title, event.from, event.to, event.note || '')
    case 'owner_change':
      return t.logOwnerChange(event.title, event.fromOwner || none, event.toOwner || none, event.stageName, event.note || '')
    case 'note':
      return t.logNote(event.title, event.stageName, event.note || '')
    case 'archive':
      return t.logArchive(event.title)
    case 'restore':
      return t.logRestore(event.title)
    case 'update':
      return t.logUpdate(event.title, fields)
    case 'dod_add':
      return t.logDodAdd(event.title)
    case 'stage_update':
      return t.logStageUpdate(event.stageName, event.stageId, fields)
    case 'stage_remove': {
      const migrate = event.migrateCount
        ? t.logStageMigrate(event.migrateCount, event.migrateTo)
        : ''
      return t.logStageRemove(event.stageName, event.stageId, migrate)
    }
    default:
      return entry?.text ?? ''
  }
}

export function formatTimestamp(value, _locale) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return String(value ?? '')
  const pad = (n) => String(n).padStart(2, '0')
  const y = date.getFullYear()
  const stamp = `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
  return y === new Date().getFullYear() ? stamp : `${y}-${stamp}`
}

export function cardMatches(card, ui) {
  const query = ui.query.trim().toLocaleLowerCase()
  return (!ui.owner || card.owner === ui.owner) && (!query || `${card.id} ${card.title} ${card.owner ?? ''}`.toLocaleLowerCase().includes(query))
}

export function renderCard(card, state, interactive, strings) {
  const esc = escapeHtml
  const t = strings ?? boardStrings()
  const archived = card.archivedAt != null
  const stageIndex = state.pipeline.findIndex((stage) => stage.id === card.stage)
  const next = state.pipeline[stageIndex + 1]
  const date = new Date()
  const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const overdue = Boolean(!archived && next && card.due && card.due < today)
  const blocker = state.logs.some((entry) => entry.type === 'blocker' && entry.cardId === card.id && entry.resolvedAt == null)
  const command = next ? `/delivery-admin move ${card.id} ${next.id}` : ''
  const initial = card.owner ? [...String(card.owner)][0].toLocaleUpperCase() : ''
  // Face: title + owner + due only. AC/DoD open in the read-only detail panel (Edit → form).
  const copy = !archived && next
    ? `<button class="copybtn" data-cmd="${esc(command)}" aria-label="${esc(t.copyHandoff)}" title="${esc(command)}">${esc(t.copyHandoff)}</button>`
    : ''
  const actions = interactive && !archived
    ? `<details class="card-menu"><summary aria-label="${esc(t.cardMenu ?? 'Card actions')}">⋯</summary><div class="card-menu-panel" role="menu"><button data-action="edit" role="menuitem" aria-label="${esc(t.edit)} ${esc(card.id)}">${esc(t.edit)}</button><button data-action="archive" role="menuitem" aria-label="${esc(t.archiveBtn)} ${esc(card.id)}">${esc(t.archiveBtn)}</button>${copy}</div></details>`
    : interactive && archived
      ? `<details class="card-menu"><summary aria-label="${esc(t.cardMenu ?? 'Card actions')}">⋯</summary><div class="card-menu-panel" role="menu"><button data-action="restore" role="menuitem" aria-label="${esc(t.restoreBtn)} ${esc(card.id)}">${esc(t.restoreBtn)}</button></div></details>`
      : !interactive && copy
        ? `<details class="card-menu"><summary aria-label="${esc(t.cardMenu ?? 'Card actions')}">⋯</summary><div class="card-menu-panel" role="menu">${copy}</div></details>`
        : ''
  const desc = card.description
    ? `<div class="card-desc">${esc(card.description)}</div>`
    : ''
  return `<article class="card${archived ? ' archived-card' : ''}${overdue ? ' is-overdue' : ''}${blocker ? ' is-blocked' : ''}" data-card-id="${esc(card.id)}" draggable="${interactive && !archived}" aria-label="${esc(card.id)} ${esc(card.title)}">
    ${actions}
    <div class="card-title">${esc(card.title)}</div>
    ${desc}
    <div class="card-meta">${card.owner ? `<span class="owner"><span class="avatar" aria-hidden="true">${esc(initial)}</span>${esc(card.owner)}</span>` : `<span class="unassigned">${esc(t.unassigned)}</span>`}${card.due ? `<span class="due${overdue ? ' overdue' : ''}">${esc(card.due)}</span>` : ''}${(() => { const items = Array.isArray(card.dod) ? card.dod : []; const total = items.filter((item) => item && (typeof item === 'string' ? item.trim() : String(item.text ?? '').trim())).length; if (!total) return ''; const done = items.filter((item) => item && typeof item === 'object' && item.done === true).length; return `<span class="dod-progress">${done}/${total}</span>` })()}${blocker ? `<span class="blocked-meta">${esc(t.blocker)}</span>` : ''}</div>
    ${archived ? `<div class="archive-meta">${esc(state.pipeline[stageIndex]?.name)} · ${esc(t.archivedOn)} ${esc(formatTimestamp(card.archivedAt))}</div>` : ''}
  </article>`
}


export function renderHiddenStagesControl(state, ui) {
  const esc = escapeHtml
  const t = ui.strings ?? boardStrings(ui.locale)
  const hiddenIds = state.hiddenStages ?? []
  if (!hiddenIds.length) return ''
  const stages = hiddenIds.map((id) => state.pipeline.find((stage) => stage.id === id)).filter(Boolean)
  if (!stages.length) return ''
  const cardCount = stages.reduce((n, stage) => n + state.cards.filter((card) => card.stage === stage.id && card.archivedAt == null).length, 0)
  const items = stages.map((stage) => {
    const n = state.cards.filter((card) => card.stage === stage.id && card.archivedAt == null).length
    const show = ui.interactive
      ? `<button type="button" data-action="show" data-stage-id="${esc(stage.id)}">${esc(t.showStage)}</button>`
      : ''
    return `<div class="hidden-stage-row"><span class="hidden-stage-name">${esc(stage.name)} <span class="count">${n}</span></span>${show}</div>`
  }).join('')
  return `<details class="hidden-stages"><summary>${esc(t.hiddenToggle(stages.length, cardCount))}</summary><div class="hidden-stages-panel" role="menu">${items}</div></details>`
}

export function renderColumns(state, ui) {
  const esc = escapeHtml
  const t = ui.strings ?? boardStrings(ui.locale)
  const hidden = new Set(state.hiddenStages ?? [])
  const hideLabel = t.hideColumn ?? t.hideStage ?? 'Hide column'
  const hideIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 2.5l11 11"/><path d="M6.6 6.7a2.4 2.4 0 0 0 2.7 2.7"/><path d="M3.4 4.6C2.2 5.6 1.4 6.9 1.2 8c.5 2.4 3.3 4.8 6.8 4.8 1.2 0 2.3-.3 3.3-.8"/><path d="M12.6 11.4c1.1-1 1.9-2.2 2.2-3.4C14.3 5.6 11.5 3.2 8 3.2c-.9 0-1.7.1-2.5.4"/></svg>`
  return state.pipeline.filter((stage) => !hidden.has(stage.id)).map((stage) => {
    const total = state.cards.filter((card) => card.stage === stage.id && card.archivedAt == null)
    const cards = total.filter((card) => cardMatches(card, ui))
    const limit = ui.limits[stage.id] ?? 30
    const shown = cards.slice(0, limit)
    const wipOver = stage.wipLimit != null && total.length > stage.wipLimit
    const hideBtn = ui.interactive
      ? `<button type="button" class="col-hide" data-action="hide" data-stage-id="${esc(stage.id)}" aria-label="${esc(hideLabel)}" title="${esc(hideLabel)}">${hideIcon}</button>`
      : ''
    // Columns stay identical: name + count only. WIP only when over.
    return `<section class="col${wipOver ? ' wip-over' : ''}" data-stage="${esc(stage.id)}" aria-label="${esc(stage.name)} stage" title="${esc(stage.id)}">
      <header><div class="col-head"><div class="col-name"><span class="col-title">${esc(stage.name)}</span><span class="count">${cards.length}${cards.length !== total.length ? `/${total.length}` : ''}</span></div>${hideBtn}</div>${wipOver ? `<div class="wip-note" role="note">${esc(t.wipSoft)} · ${esc(t.wipLabel(total.length, stage.wipLimit))}</div>` : ''}</header>
      <div class="col-body">${shown.length ? shown.map((card) => renderCard(card, state, ui.interactive, t)).join('') : `<div class="empty">${total.length ? esc(t.noMatch) : esc(ui.interactive ? t.empty : (t.emptyReadonly ?? t.empty))}</div>`}${cards.length > limit ? `<button class="load-more" data-more="${esc(stage.id)}">${esc(t.loadMore(shown.length, cards.length))}</button>` : ''}</div>
    </section>`
  }).join('')
}

export function renderArchive(state, ui) {
  const t = ui.strings ?? boardStrings(ui.locale)
  const cards = state.cards.filter((card) => card.archivedAt != null && cardMatches(card, ui)).sort((a, b) => String(b.archivedAt).localeCompare(String(a.archivedAt)))
  const limit = ui.archiveLimit ?? 30
  return `<h2>${escapeHtml(t.archiveTitle(cards.length))}</h2><p>${escapeHtml(t.archiveHelp)}</p><div class="archive-grid">${cards.length ? cards.slice(0, limit).map((card) => renderCard(card, state, ui.interactive, t)).join('') : `<p class="empty">${escapeHtml(t.noMatchArchive)}</p>`}</div>${cards.length > limit ? `<button data-more="archive">${escapeHtml(t.loadMore(Math.min(limit, cards.length), cards.length))}</button>` : ''}`
}


export function renderRisks(state, interactive = false, strings) {
  const t = strings ?? boardStrings()
  const open = []
  state.logs.forEach((entry, index) => {
    if ((entry.type === 'risk' || entry.type === 'blocker') && entry.resolvedAt == null) open.push({ entry, index })
  })
  if (!open.length) return ''
  const shown = open.slice(-8)
  const esc = escapeHtml
  return `<details class="risks"><summary>${esc(t.openRisks(open.length))}</summary><ul>${shown.map(({ entry, index }) => {
    const resolve = interactive
      ? ` <button data-action="resolve" data-log-index="${index}" aria-label="${esc(t.resolve)} ${index}">${esc(t.resolve)}</button>`
      : ''
    return `<li><span class="risk-type">${esc(entry.type)}</span> ${esc(entry.text)}${entry.cardId ? ` <span class="cid">${esc(entry.cardId)}</span>` : ''}${resolve}</li>`
  }).join('')}</ul></details>`
}


/** Read-only card detail body (edit lives in the existing card dialog). */
export function renderCardDetail(card, state, strings, { canEdit = false } = {}) {
  const esc = escapeHtml
  const t = strings ?? boardStrings()
  if (!card) return ''
  const stage = state.pipeline.find((item) => item.id === card.stage)
  const blocker = state.logs.some((entry) => entry.type === 'blocker' && entry.cardId === card.id && entry.resolvedAt == null)
  const history = state.logs
    .filter((entry) => entry.cardId === card.id && (entry.type === 'handoff' || entry.type === 'decision'))
    .slice()
    .reverse()
  const list = (items) => items?.length
    ? `<ul class="detail-list">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
    : `<p class="detail-empty">${esc(t.detailEmptyList)}</p>`
  const dodItems = Array.isArray(card.dod) ? card.dod : []
  const dodList = dodItems.length
    ? `<ul class="detail-list detail-dod">${dodItems.map((item, index) => {
      const text = typeof item === 'string' ? item : String(item?.text ?? '')
      const done = typeof item === 'object' && item?.done === true
      const stamp = done && item.doneAt ? `<span class="ts">${esc(formatTimestamp(item.doneAt))}</span>` : ''
      if (canEdit) {
        return `<li class="dod-item${done ? ' done' : ''}"><label><input type="checkbox" data-action="dod-check" data-card-id="${esc(card.id)}" data-dod-index="${index}" ${done ? 'checked' : ''}> <span>${esc(text)}</span></label>${stamp}</li>`
      }
      return `<li class="dod-item${done ? ' done' : ''}"><span class="dod-mark" aria-hidden="true">${done ? '✓' : '○'}</span><span>${esc(text)}</span>${stamp}</li>`
    }).join('')}</ul>`
    : `<p class="detail-empty">${esc(t.detailEmptyList)}</p>`
  const typeLabel = (type) => type === 'decision' ? (t.detailTypeDecision ?? type) : type === 'handoff' ? (t.detailTypeHandoff ?? type) : type
  const historyHtml = history.length
    ? `<ul class="detail-history">${history.map((entry) => `<li><span class="ts">${esc(formatTimestamp(entry.ts))}</span><span class="detail-type">${esc(typeLabel(entry.type))}</span><span class="detail-text">${esc(formatLogText(entry, t))}</span></li>`).join('')}</ul>`
    : `<p class="detail-empty">${esc(t.detailNoHistory)}</p>`
  const edit = canEdit ? `<button type="button" class="primary" data-action="detail-edit" data-card-id="${esc(card.id)}">${esc(t.detailEdit)}</button>` : ''
  const description = card.description
    ? `<p class="detail-desc">${esc(card.description)}</p>`
    : ''
  return `<div class="detail-head"><h2 id="detail-title" tabindex="-1">${esc(card.title)}</h2><span class="cid">${esc(card.id)}</span></div>
    ${description}
    <dl class="detail-meta">
      <div><dt>${esc(t.detailStage)}</dt><dd>${esc(stage?.name ?? card.stage)}</dd></div>
      <div><dt>${esc(t.detailOwner)}</dt><dd>${esc(card.owner || t.unassigned)}</dd></div>
      <div><dt>${esc(t.detailStart ?? 'Start')}</dt><dd>${esc(card.start || '—')}</dd></div>
      <div><dt>${esc(t.detailDue)}</dt><dd>${esc(card.due || '—')}</dd></div>
      <div><dt>${esc(t.detailBlocked)}</dt><dd>${esc(blocker ? t.blocker : '—')}</dd></div>
    </dl>
    <section class="detail-section"><h3>${esc(t.detailAc)}</h3>${list(card.acceptance)}</section>
    <section class="detail-section"><h3>${esc(t.detailDod)}</h3>${dodList}</section>
    <section class="detail-section"><h3>${esc(t.detailHistory)}</h3>${historyHtml}</section>
    <div class="form-actions"><button type="button" data-action="detail-close">${esc(t.detailClose)}</button>${edit}</div>`
}

// Calendar-axis timeline. Derives each card's dated spans from existing data only
// (createdAt, handoff log timestamps, due, archivedAt); no data format changes.
export function cardTimeline(card, state, nowMs) {
  const day = 86400000
  const parse = (value) => {
    const ms = Date.parse(value ?? '')
    return Number.isFinite(ms) ? ms : null
  }
  const parseDay = (value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''))
    if (!match) return null
    const ms = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).getTime()
    return Number.isFinite(ms) ? ms : null
  }
  const byLongestName = [...state.pipeline].sort((a, b) => b.name.length - a.name.length)
  const findStage = (text, pattern) => byLongestName.find((stage) => pattern(stage.name).test(text))?.id ?? null
  const quote = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const moves = state.logs
    .filter((entry) => entry.type === 'handoff' && entry.cardId === card.id && parse(entry.ts) != null)
    .map((entry) => {
      const event = resolveAutoLogEvent(entry)
      const from = event?.fromId
        || (event?.from ? byLongestName.find((stage) => stage.name === event.from)?.id : null)
        || findStage(entry.text, (name) => new RegExp(`moved from ${quote(name)} → `))
      const to = event?.toId
        || (event?.to ? byLongestName.find((stage) => stage.name === event.to)?.id : null)
        || findStage(entry.text, (name) => new RegExp(`→ ${quote(name)}(?::|$)`))
      return { ts: parse(entry.ts), from, to }
    })
    .sort((a, b) => a.ts - b.ts)
  const terminal = state.pipeline[state.pipeline.length - 1]?.id
  const created = parse(card.createdAt)
  const archivedAt = parse(card.archivedAt)
  const due = parseDay(card.due)
  const scheduleStart = parseDay(card.start)
  const start = created ?? (moves.length ? moves[0].ts : null)
  const segments = []
  let shipped = null
  if (start != null) {
    let current = moves[0]?.from ?? (moves.length ? null : card.stage)
    let from = start
    for (const move of moves) {
      if (move.ts < from) continue
      if (current) segments.push({ stage: current, start: from, end: move.ts })
      current = move.to
      from = move.ts
      if (current === terminal) shipped = move.ts
    }
    if (current === terminal && card.stage === terminal) {
      shipped = shipped ?? from
    } else {
      if (current !== terminal) shipped = null
      const end = archivedAt ?? nowMs
      if (current) segments.push({ stage: current, start: from, end: Math.max(end, from + day / 24) })
    }
  }
  return { start, due, scheduleStart, shipped, archivedAt, segments, created }
}

export function renderTimeline(state, ui) {
  const esc = escapeHtml
  const t = ui.strings ?? boardStrings(ui.locale)
  const loc = resolveBoardLocale(ui.locale)
  const day = 86400000
  const nowMs = ui.now ?? Date.now()
  const midnight = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime() }
  const addDays = (ms, n) => { const d = new Date(ms); d.setDate(d.getDate() + n); return d.getTime() }
  const todayMs = midnight(nowMs)
  const stageIndex = new Map(state.pipeline.map((stage, index) => [stage.id, index]))
  const terminal = state.pipeline[state.pipeline.length - 1]?.id
  const cards = state.cards.filter((card) => cardMatches(card, ui))
  const rows = cards.map((card) => ({ card, tl: cardTimeline(card, state, nowMs) }))
  const dated = rows.filter((row) => row.tl.start != null || row.tl.due != null || row.tl.scheduleStart != null)
  const undated = rows.filter((row) => row.tl.start == null && row.tl.due == null && row.tl.scheduleStart == null)
  const head = `<div class="tl-head"><div><h2>${esc(t.timelineTitle(cards.length))}</h2><p class="tl-help">${esc(t.timelineHelp)}</p></div>${renderLegend()}</div>`
  if (!dated.length) {
    return `${head}<div class="empty tl-empty">${esc(t.timelineEmpty)}</div>${renderUndated()}`
  }
  const points = [todayMs]
  for (const { tl } of dated) {
    if (tl.start != null) points.push(tl.start)
    if (tl.scheduleStart != null) points.push(tl.scheduleStart)
    if (tl.due != null) points.push(tl.due)
    if (tl.archivedAt != null) points.push(tl.archivedAt)
  }
  let rangeStart = midnight(Math.min(...points))
  let rangeEnd = midnight(Math.max(...points))
  // Pad, then snap the start to a Monday so week gridlines line up.
  rangeStart = addDays(rangeStart, -2)
  rangeStart = addDays(rangeStart, -((new Date(rangeStart).getDay() + 6) % 7))
  rangeEnd = addDays(rangeEnd, 8)
  const maxDays = 370
  let clipped = false
  if ((rangeEnd - rangeStart) / day > maxDays) {
    rangeStart = midnight(addDays(Math.max(rangeEnd, addDays(todayMs, 30)), -maxDays))
    rangeStart = addDays(rangeStart, -((new Date(rangeStart).getDay() + 6) % 7))
    clipped = true
  }
  const totalDays = Math.round((rangeEnd - rangeStart) / day)
  const dayWidth = totalDays <= 75 ? 26 : totalDays <= 160 ? 12 : 5
  const width = totalDays * dayWidth
  const x = (ms) => Math.max(0, Math.min(width, ((ms - rangeStart) / day) * dayWidth))
  const fmtDay = (ms) => new Date(ms).toLocaleDateString(loc, { month: 'short', day: 'numeric' })
  const lines = []
  const months = []
  const weeks = []
  for (let ms = rangeStart; ms < rangeEnd; ms = addDays(ms, 1)) {
    const date = new Date(ms)
    const left = x(ms)
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    if (date.getDate() === 1 || (ms === rangeStart && daysInMonth - date.getDate() >= 9)) {
      if (date.getDate() === 1) lines.push(`<span class="tl-line month" style="left:${left}px"></span>`)
      months.push(`<span class="tl-month" style="left:${left}px">${esc(date.toLocaleDateString(loc, { year: 'numeric', month: 'short' }))}</span>`)
    }
    if (date.getDay() === 1) {
      if (date.getDate() !== 1) lines.push(`<span class="tl-line week" style="left:${left}px"></span>`)
      if (dayWidth >= 10) weeks.push(`<span class="tl-week" style="left:${left}px">${esc(fmtDay(ms))}</span>`)
    } else if (dayWidth >= 20 && date.getDay() % 6 === 0) {
      lines.push(`<span class="tl-weekend" style="left:${left}px;width:${dayWidth}px"></span>`)
    }
  }
  const todayLeft = x(todayMs + day / 2)
  const order = (row) => {
    if (row.card.archivedAt != null) return 1e6
    return stageIndex.get(row.card.stage) ?? 9e5
  }
  dated.sort((a, b) => order(a) - order(b) || (a.tl.start ?? a.tl.due) - (b.tl.start ?? b.tl.due))
  const groups = []
  for (const row of dated) {
    const key = row.card.archivedAt != null ? '__archived' : row.card.stage
    let group = groups.find((item) => item.key === key)
    if (!group) {
      const stage = state.pipeline.find((item) => item.id === key)
      group = { key, name: key === '__archived' ? t.timelineArchived : stage?.name ?? key, rows: [] }
      groups.push(group)
    }
    group.rows.push(row)
  }
  const nameOf = (id) => state.pipeline.find((stage) => stage.id === id)?.name ?? id
  const body = groups.map((group) => `<div class="tl-group" role="row"><div class="tl-label tl-group-label" role="rowheader">${esc(group.name)} <span class="count">${group.rows.length}</span></div><div class="tl-track" aria-hidden="true"></div></div>` + group.rows.map(({ card, tl }) => {
    const archived = card.archivedAt != null
    const overdue = !archived && card.stage !== terminal && tl.due != null && tl.due < todayMs
    const segs = tl.segments.map((seg, index) => {
      const left = x(seg.start)
      const w = Math.max(3, x(seg.end) - left)
      const last = index === tl.segments.length - 1
      const days = Math.max(1, Math.round((seg.end - seg.start) / day))
      const label = `${nameOf(seg.stage)} · ${fmtDay(seg.start)} → ${fmtDay(seg.end)} (${t.daysSpan(days)})`
      return `<span class="tl-seg${last && !archived && tl.shipped == null ? ' current' : ''}" style="left:${left}px;width:${w}px" title="${esc(label)}">${last && w > 64 ? `<span class="tl-seg-text">${esc(nameOf(seg.stage))}</span>` : ''}</span>`
    }).join('')
    const sched = tl.scheduleStart != null && tl.due != null
      ? (() => {
        const left = x(tl.scheduleStart)
        const w = Math.max(4, x(tl.due + day) - left)
        const days = Math.max(1, Math.round((tl.due - tl.scheduleStart) / day) + 1)
        const label = `${t.legendSchedule ?? 'Schedule'} · ${card.start} → ${card.due} (${t.daysSpan(days)})`
        return `<span class="tl-sched${overdue ? ' overdue' : ''}" style="left:${left}px;width:${w}px" title="${esc(label)}"></span>`
      })()
      : ''
    const dueMark = tl.due != null && !(tl.scheduleStart != null) ? `<span class="tl-due${overdue ? ' overdue' : ''}" style="left:${x(tl.due + day / 2)}px" title="${esc(`${overdue ? t.legendOverdue : t.legendDue} · ${card.due}`)}">◆</span>` : ''
    const shipMark = tl.shipped != null ? `<span class="tl-ship" style="left:${x(tl.shipped)}px" title="${esc(`${t.legendShipped} · ${fmtDay(tl.shipped)}`)}">✓</span>` : ''
    const archMark = archived && tl.archivedAt != null ? `<span class="tl-arch" style="left:${x(tl.archivedAt)}px" title="${esc(`${t.legendArchived} · ${fmtDay(tl.archivedAt)}`)}">■</span>` : ''
    const noStart = tl.due != null && tl.start == null && tl.scheduleStart == null ? `<span class="tl-nostart" style="left:${Math.max(0, x(tl.due) - 120)}px">${esc(t.noStart)}</span>` : ''
    const title = ui.interactive && !archived
      ? `<button class="tl-title" data-action="edit" aria-label="${esc(t.edit)} ${esc(card.id)}">${esc(card.title)}</button>`
      : `<span class="tl-title">${esc(card.title)}</span>`
    const stageName = tl.shipped != null ? `${t.shippedOn} ${fmtDay(tl.shipped)}` : tl.due != null ? `${t.dueOn} ${card.due}` : ''
    return `<div class="tl-row${archived ? ' archived' : ''}${overdue ? ' is-overdue' : ''}" role="row" data-card-id="${esc(card.id)}"><div class="tl-label" role="rowheader"><span class="cid">${esc(card.id)}</span>${title}<span class="tl-sub">${card.owner ? `@${esc(card.owner)}` : esc(t.unassigned)}${stageName ? ` · <span class="${overdue ? 'overdue' : ''}">${esc(stageName)}</span>` : ''}</span></div><div class="tl-track" role="cell">${segs}${sched}${noStart}${dueMark}${shipMark}${archMark}</div></div>`
  }).join('')).join('')
  return `${head}${clipped ? `<p class="tl-clipped">◂ ${esc(t.clipped)}</p>` : ''}<div class="tl-scroll" tabindex="0" role="region" aria-label="${esc(t.viewTimeline)}"><div class="tl-grid" role="table" style="--tl-width:${width}px;--day:${dayWidth}px">
    <div class="tl-axis" role="row"><div class="tl-label tl-corner" role="columnheader">${esc(t.timelineCard)}</div><div class="tl-track tl-scale" role="columnheader"><div class="tl-months">${months.join('')}</div><div class="tl-weeks">${weeks.join('')}</div><span class="tl-today-tag" style="left:${todayLeft}px">${esc(t.today)} · ${esc(fmtDay(todayMs))}</span></div></div>
    <div class="tl-body"><div class="tl-lines" aria-hidden="true">${lines.join('')}<span class="tl-today" style="left:${todayLeft}px"></span></div>${body}</div>
  </div></div>${renderUndated()}`

  function renderLegend() {
    return `<ul class="tl-legend" aria-label="${esc(t.legend)}"><li><span class="tl-key seg" aria-hidden="true"></span>${esc(t.legendStage)}</li><li><span class="tl-key sched" aria-hidden="true"></span>${esc(t.legendSchedule ?? 'Schedule')}</li><li><span class="tl-key due" aria-hidden="true">◆</span>${esc(t.legendDue)}</li><li><span class="tl-key due overdue" aria-hidden="true">◆</span>${esc(t.legendOverdue)}</li><li><span class="tl-key ship" aria-hidden="true">✓</span>${esc(t.legendShipped)}</li><li><span class="tl-key arch" aria-hidden="true">■</span>${esc(t.legendArchived)}</li><li><span class="tl-key today" aria-hidden="true"></span>${esc(t.today)}</li></ul>`
  }
  function renderUndated() {
    if (!undated.length) return ''
    return `<section class="tl-undated"><h3>${esc(t.undated(undated.length))}</h3><p>${esc(t.undatedHelp)}</p><div class="tl-chips">${undated.map(({ card }) => `<span class="tl-chip" data-card-id="${esc(card.id)}"><span class="cid">${esc(card.id)}</span>${esc(card.title)}</span>`).join('')}</div></section>`
  }
}
