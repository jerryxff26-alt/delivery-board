// On-demand, loopback-only board bridge. Never serves arbitrary files or accepts
// a replacement JSON document: all mutations use the shared domain functions.
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import nodePath from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { applyAction } from './actions.js'
import { readSnapshot, mutateState, resolveTarget, writeState } from './store.js'
import { archiveBoard, archiveBoardSlug } from './delivery.js'
import { renderBoardHtml } from './board-html.js'

function reply(res, status, body, type = 'application/json') {
  res.writeHead(status, {
    'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; img-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  })
  res.end(type === 'application/json' ? JSON.stringify(body) : body)
}

async function readBody(req) {
  const chunks = []
  let bytes = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    bytes += buffer.length
    if (bytes > 65536) throw Object.assign(new Error('Request body is too large'), { status: 413 })
    chunks.push(buffer)
  }
  try { return JSON.parse(Buffer.concat(chunks, bytes).toString('utf8')) }
  catch { throw new Error('Request body must be valid JSON') }
}

export function createBoardHandler({ ctx, exec, config, basePath, getOrigin, actor, command, entry }) {
  return async (req, res) => {
    try {
      const origin = getOrigin()
      if (req.headers.host !== new URL(origin).host) return reply(res, 403, { error: 'Invalid local host' })
      const url = new URL(req.url, origin)
      const path = url.pathname
      const tab = url.searchParams.get('tab') ?? ''
      entry?.touch(tab)
      if (req.method === 'GET' && path === `${basePath}/alive`) return reply(res, 200, { ok: true })
      if (req.method === 'POST' && path === `${basePath}/bye`) {
        entry?.bye(tab)
        return reply(res, 200, { ok: true })
      }
      if (req.method === 'GET' && path === basePath) {
        const snapshot = await readSnapshot(ctx, exec, config.fileName)
        return reply(res, 200, renderBoardHtml(snapshot.state, { endpoint: basePath, revision: snapshot.revision, command }), 'text/html')
      }
      if (req.method === 'GET' && path === `${basePath}/state`) {
        return reply(res, 200, await readSnapshot(ctx, exec, config.fileName))
      }
      if (req.method !== 'POST' || path !== `${basePath}/action`) return reply(res, 404, { error: 'Not found' })
      if (req.headers.origin !== origin) return reply(res, 403, { error: 'Only this local board may save changes' })
      if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') return reply(res, 415, { error: 'Use application/json' })
      const body = await readBody(req)
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !['action', 'args', 'revision'].includes(key))) throw new Error('Invalid action request')
      const allowed = ['card', 'move', 'update', 'archive', 'restore', 'log', 'resolve', 'dod_add', 'dod_check', 'hide', 'show', 'archive_board']
      if (!allowed.includes(body.action)) throw new Error('Unsupported board action')
      if (typeof body.revision !== 'string' || !body.revision) throw new Error('A board revision is required; refresh before saving')
      if (body.action === 'archive_board') {
        const snapshot = await readSnapshot(ctx, exec, config.fileName)
        if (body.revision !== snapshot.revision) {
          const error = new Error('The board changed. Refresh before retrying; no changes were saved.')
          error.code = 'DELIVERY_STALE'
          throw error
        }
        const { archive, next } = archiveBoard(snapshot.state)
        const day = (archive.archivedAt ?? new Date().toISOString()).slice(0, 10)
        const slug = archiveBoardSlug(archive.customer)
        const relDir = 'delivery-archive'
        const relFile = nodePath.join(relDir, `${day}-${slug}.json`)
        const absDir = nodePath.resolve(exec.workspaceCwd, relDir)
        await mkdir(absDir, { recursive: true })
        const absFile = nodePath.resolve(exec.workspaceCwd, relFile)
        await writeFile(absFile, JSON.stringify(archive, null, 2) + '\n', 'utf8')
        await writeState(ctx, exec, config.fileName, next)
        const result = await readSnapshot(ctx, exec, config.fileName)
        return reply(res, 200, { ...result, archivedTo: relFile })
      }
      const result = await mutateState(ctx, exec, config.fileName, (state) => applyAction(state, body.action, body.args ?? {}, { actor }), body.revision)
      return reply(res, 200, result)
    } catch (error) {
      const status = ['DELIVERY_STALE', 'FS_STALE_VERSION'].includes(error.code) ? 409 : error.status ?? 400
      return reply(res, status, { error: error.message })
    }
  }
}

async function waitForReady(ready, signal) {
  if (!signal) return ready
  let onAbort
  const cancelled = new Promise((_resolve, reject) => {
    onAbort = () => reject(signal.reason)
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  })
  try { return await Promise.race([ready, cancelled]) }
  finally { signal.removeEventListener('abort', onAbort) }
}

// The optional factory is a test seam; production always uses node:http.
export function createBoardManager(ctx, config, { createServer: createHttpServer = createServer, keepAlive = false, actor, command, idleMs = 0, byeGraceMs = 10000 } = {}) {
  const boards = new Map()
  let disposed = false
  let closing
  let resolveAutoClose
  // Resolves when the board shut itself down because nobody was using it.
  const autoClosed = new Promise((resolve) => { resolveAutoClose = resolve })
  function checkOpen(signal) {
    if (disposed) throw new Error('The delivery board manager is closed')
    signal?.throwIfAborted()
  }
  function closeEntry(entry) {
    if (entry.closed) return
    entry.closed = true
    for (const [key, value] of boards) if (value === entry) boards.delete(key)
    stop(entry).finally(() => resolveAutoClose())
  }
  function stop(entry) {
    if (entry.timer) { clearInterval(entry.timer); entry.timer = null }
    if (entry.grace) { clearTimeout(entry.grace); entry.grace = null }
    if (!entry.closing) {
      entry.controller.abort()
      entry.closing = new Promise((resolve) => {
        entry.server.close(resolve)
        entry.server.closeAllConnections()
      })
    }
    return entry.closing
  }
  function close() {
    disposed = true
    if (!closing) {
      const entries = [...boards.values()]
      boards.clear()
      closing = Promise.all(entries.map(stop)).then(() => {})
    }
    return closing
  }
  ctx.effect?.(() => close, 'delivery-board local HTTP lifecycle')
  return {
    close,
    exit: autoClosed,
    async open(exec) {
      const signal = exec?.signal
      checkOpen(signal)
      const workspaceCwd = exec?.agent?.session?.header?.cwd
      if (typeof workspaceCwd !== 'string') throw new Error('Opening a delivery board requires a session workspace cwd')
      const boardConfig = { fileName: config.fileName }
      const openExec = { ...exec, workspaceCwd }
      const sessionId = exec.agent.session.id ?? ''
      await readSnapshot(ctx, openExec, boardConfig.fileName)
      checkOpen(signal)
      const target = await resolveTarget(ctx, openExec, boardConfig.fileName)
      checkOpen(signal)
      const key = `${sessionId}:${target.targetKey}`
      let entry = boards.get(key)
      const created = !entry
      if (!entry) {
        const controller = new AbortController()
        const basePath = `/board/${randomBytes(24).toString('hex')}`
        entry = {
          controller,
          tabs: new Map(),
          lastSeen: Date.now(),
          touch(tab) {
            entry.lastSeen = Date.now()
            if (!tab) return
            entry.tabs.set(tab, entry.lastSeen)
            if (entry.grace) { clearTimeout(entry.grace); entry.grace = null }
          },
          bye(tab) {
            if (tab) entry.tabs.delete(tab)
            if (entry.tabs.size || entry.grace) return
            // Closing one tab must not kill a board that another tab still uses: wait, then re-check.
            entry.grace = setTimeout(() => closeEntry(entry), byeGraceMs)
          },
        }
        const serverExec = { ...openExec, signal: controller.signal }
        let origin
        const handle = createBoardHandler({ ctx, exec: serverExec, config: boardConfig, basePath, getOrigin: () => origin, actor, command, entry })
        const server = createHttpServer((req, res) => { void handle(req, res) })
        entry.server = server
        entry.ready = new Promise((resolve, reject) => {
          const onAbort = () => reject(controller.signal.reason)
          const onError = (error) => { controller.signal.removeEventListener('abort', onAbort); reject(error) }
          controller.signal.addEventListener('abort', onAbort, { once: true })
          server.once('error', onError)
          server.listen(0, '127.0.0.1', () => {
            server.off('error', onError)
            controller.signal.removeEventListener('abort', onAbort)
            if (disposed || controller.signal.aborted) return reject(controller.signal.reason ?? new Error('The delivery board manager is closed'))
            origin = `http://127.0.0.1:${server.address().port}`
            entry.url = `${origin}${basePath}`
            if (!keepAlive) server.unref()
            if (idleMs > 0) {
              entry.timer = setInterval(() => {
                if (Date.now() - entry.lastSeen > idleMs) closeEntry(entry)
              }, Math.max(100, Math.min(15000, Math.floor(idleMs / 4))))
              entry.timer.unref?.()
            }
            resolve(server)
          })
        })
        boards.set(key, entry)
      }
      try {
        await waitForReady(entry.ready, signal)
        checkOpen(signal)
        entry.controller.signal.throwIfAborted()
        return entry.url
      } catch (error) {
        // An aborted reuse must not stop a board owned by an earlier command.
        if (created) {
          await stop(entry)
          if (boards.get(key) === entry) boards.delete(key)
        }
        throw error
      }
    },
  }
}
