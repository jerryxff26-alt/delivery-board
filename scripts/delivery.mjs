#!/usr/bin/env node
// dsh-delivery-board — single entry point for the delivery skill.
// Deterministic mutations on an in-repo delivery.json, the weekly report and the local board.
import path from 'node:path'
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createStandaloneSession, parseDeliveryCommand, commandHelp } from '../lib/standalone.js'

const usage = `delivery — codebase-native delivery board

Usage:
  node scripts/delivery.mjs <command> [args...]
  node scripts/delivery.mjs --cwd <dir> --file delivery.json --actor <name> <command> ...

Commands:
  help
  init <customer> [template]              # e.g. init ACME lite
  init {"customer":"ACME","template":"lite"}
  card <title> <stage> [owner] [--start YYYY-MM-DD] [--due YYYY-MM-DD] [--description ...]
  card {"title":"API","stage":"doing","owner":"Alice","start":"2026-11-01","due":"2026-11-10"}
  board [--archived]
  open                                    # local editable board (Ctrl+C to stop)
  move <card|title> <stage|name>          # e.g. move API review
  update {"card_id":"c1","stage":"review","owner":"Bob","due":"2026-11-20"}
  update <card|title> --start ... | --due ... | --description ...
  dod add <card|title> <text>
  dod check <card|title> <index> [true|false]
  archive <card|title> | restore <card|title>
  archive-board                           # snapshot to delivery-archive/, then reset empty board
  log {"type":"blocker","text":"...","card_id":"c1"}
  resolve <log_index>
  hide <stage|name> | show <stage|name>
  stage_add|stage_update|stage_remove {...}
  weekly [YYYY-MM-DD] | {"week_start":"...","next_week":"..."}
  html
  # view an archived board: --file delivery-archive/<file>.json open|html

Options:
  --cwd, -C <dir>      project directory (default: current directory)
  --file, -f <name>    state file name (default delivery.json)
  --board-file <name>  HTML export name (default delivery-board.html)
  --actor, -a <name>   who is making the change (default: $DELIVERY_ACTOR, then git config user.name)
  --browser            open the board URL in the default browser (open command only)
  --idle <minutes>     stop the board after this long with no activity (default 20, 0 disables)
                       the board also stops a few seconds after the last browser tab closes

The skill (SKILL.md) is the normal way to use this; run it directly when you want no model in the loop.`

function parseFlags(argv) {
  const out = { cwd: process.cwd(), fileName: 'delivery.json', boardFile: 'delivery-board.html', actor: '', browser: false, idleMinutes: 20, rest: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--cwd' || arg === '-C') { out.cwd = path.resolve(argv[++i] ?? ''); continue }
    if (arg === '--file' || arg === '-f') { out.fileName = argv[++i] ?? out.fileName; continue }
    if (arg === '--board-file') { out.boardFile = argv[++i] ?? out.boardFile; continue }
    if (arg === '--actor' || arg === '-a') { out.actor = argv[++i] ?? ''; continue }
    if (arg === '--browser') { out.browser = true; continue }
    if (arg === '--idle') {
      const minutes = Number(argv[++i])
      if (!Number.isFinite(minutes) || minutes < 0) throw new Error('--idle must be a number of minutes (0 disables it)')
      out.idleMinutes = minutes
      continue
    }
    if (arg === '--help' || arg === '-h') { out.help = true; continue }
    if (arg === '--version' || arg === '-v') { out.version = true; continue }
    out.rest.push(arg)
  }
  return out
}

function openBrowser(url) {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open'
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url]
  try {
    const child = spawn(command, args, { detached: true, stdio: 'ignore' })
    child.unref()
  } catch { /* opening a browser is best effort */ }
}

/** Explicit flag > DELIVERY_ACTOR > git config user.name > empty. */
function resolveActor(explicit, cwd) {
  if (explicit && explicit.trim()) return explicit.trim()
  const fromEnv = (process.env.DELIVERY_ACTOR ?? '').trim()
  if (fromEnv) return fromEnv
  try {
    const name = execFileSync('git', ['config', 'user.name'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    return name || ''
  } catch {
    return ''
  }
}

async function main() {
  const flags = parseFlags(process.argv.slice(2))
  if (flags.version) {
    const here = path.dirname(fileURLToPath(import.meta.url))
    const pkg = await import(path.join(here, '../package.json'), { with: { type: 'json' } })
    process.stdout.write(`${pkg.default.version}\n`)
    return
  }

  if (flags.help || flags.rest.length === 0) {
    process.stdout.write(usage)
    if (flags.help || flags.rest[0] === 'help') process.stdout.write(`\n${commandHelp}\n`)
    return
  }

  const actor = resolveActor(flags.actor, flags.cwd)
  // The board copies commands that work from any directory, so it renders this exact script path.
  const command = `node ${fileURLToPath(import.meta.url)}`
  const session = createStandaloneSession({
    cwd: flags.cwd,
    fileName: flags.fileName,
    boardFile: flags.boardFile,
    actor,
    command,
    idleMs: Math.round(flags.idleMinutes * 60000),
  })

  try {
    const { action, args } = parseDeliveryCommand(flags.rest.join(' '))
    const result = await session.run(action, args)
    if (result && typeof result === 'object' && result.keepAlive) {
      process.stdout.write(`${result.text}\n`)
      if (flags.browser && result.url) openBrowser(result.url)
      const stop = async () => {
        try { await result.close() } catch { /* ignore */ }
        process.exit(0)
      }
      process.on('SIGINT', stop)
      process.on('SIGTERM', stop)
      // Resolves when the board closed itself (last tab gone, or idle).
      await result.exit
      process.exit(0)
    } else {
      process.stdout.write(`${result}\n`)
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
    await session.close().catch(() => {})
  }
}

main()