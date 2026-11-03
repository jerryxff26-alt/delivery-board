# dsh-delivery-board

[English](README.md) · [中文](README.zh.md)

> **Plan, owners, status and handoff history in one `delivery.json` next to your code** — no SaaS, no account, no plugin; reviewed in every PR.

The board is just a view. PMs and engineers trust the same file: stages, WIP, the weekly client report, and an audit of moves that actually happened. Teams and their agents work off one shared context that travels with the repository.

![Synthetic demo: stage board → drag handoff → calendar Timeline → dark mode](docs/demo/demo.gif)

## How it ships

One repository, no dependencies:

- `SKILL.md` — how an agent should use it (plan → cards → handoffs → report)
- `scripts/delivery.mjs` — the only entry point: deterministic writes, weekly report, local board
- `lib/` — the domain rules (IDs, handoff history, DoD, archive) and the board renderer
- `test/` — the regression suite

Install it by pointing a skill directory at the repository:

```bash
git clone https://github.com/jerryxff26-alt/delivery-board.git ~/git-repo/dsh-delivery-board
ln -s ~/git-repo/dsh-delivery-board ~/.agents/skills/delivery   # or <project>/.agents/skills/delivery
```

Then either type `/delivery …` in DeepSeek Harness (the skill loads the instructions for the model), or run the script yourself with no model in the loop.

## 30-second quickstart

```bash
alias delivery="node ~/git-repo/dsh-delivery-board/scripts/delivery.mjs"

cd your-project
delivery init ACME lite
delivery card '{"title":"API integration","stage":"doing","owner":"Ada","description":"Wire partner API"}'
delivery board
delivery open        # loopback board + Timeline, Ctrl+C to stop
delivery weekly
```

State defaults to `delivery.json` in the current directory (`--cwd` / `--file` to override).

## What you get

- **Stage pipeline + cards** — owner, optional description, `start`/`due`, acceptance criteria and a checkable DoD. Stages can be added, renamed or removed after init (removing refuses while cards remain unless you migrate them).
- **Handoff audit trail** — moving a card records who handed what to whom, with the actor (`--actor`, else `DELIVERY_ACTOR`, else `git config user.name`).
- **Weekly report** — Markdown for the client: pipeline snapshot, shipped, handoffs, open risks, risks resolved this week, optional next bets.
- **Soft WIP limits** — optional per-stage `wipLimit`; the board warns, moves are never blocked.
- **Local board** — drag and drop, archive/restore, risk logging, per-card DoD, keyboard access (Tab to a card, Enter opens it), zh/en chrome.
- **Timeline view** — calendar-axis Gantt of every card derived from existing data only.
- **Whole-board archive** — snapshot to `delivery-archive/<date>-<slug>.json`, then reset an empty board with the same pipeline.
- **Offline HTML snapshot** — one read-only file teammates without the tool can open.

![Full-width editable delivery board](docs/screenshots/board.jpg)

![Timeline view: calendar-axis bars per card colored by stage](docs/screenshots/timeline.jpg)

<details>
<summary>Card editor, archive and dark-mode views</summary>

![Timeline view in dark mode with Chinese chrome](docs/screenshots/timeline-dark-zh.jpg)

![Card editor showing title, owner, due date, stage, acceptance criteria and Definition of Done](docs/screenshots/card-editor.jpg)

![Archive view with preserved card details and restore-to-original-stage buttons](docs/screenshots/archive.jpg)

</details>

## Daily loop

| Intent | Command |
|---|---|
| Initialize once | `init ACME lite` |
| Add a card | `card '{"title":"API","stage":"doing","owner":"Ada","due":"2026-11-20"}'` |
| Hand off | `move c1 review` |
| Edit without moving | `update '{"card_id":"c1","stage":"review","owner":"Bo"}'` |
| Log progress / risk / blocker | `log '{"type":"blocker","text":"Waiting for UAT","card_id":"c1"}'` |
| Glance | `board [--archived]` |
| Editable board | `open` |
| Weekly report | `weekly 2026-11-02` |

`delivery --help` lists everything, including DoD, stage surgery, archive and HTML export.

Card and stage references accept an id or an exact title/name; ambiguous or unknown references fail with the candidate list instead of guessing.

## Board

`open` binds `127.0.0.1` on an ephemeral port with an unguessable path and prints the URL. `--browser` opens it for you; the board then shuts itself down after 20 minutes without activity, or a few seconds after the last tab closes (`--idle 0` keeps it running until Ctrl+C). Treat the URL as private to your machine. The board edits the same `delivery.json` and writes through the same domain rules as the script, so history and IDs stay consistent either way.

`html` writes a single self-contained file. Opened straight from disk it is read-only, but the page also carries **Connect delivery.json**: in Chrome or Edge, pick the file once and the page reads and writes it in place — same rules, same history, no server process left running. The actor recorded for those writes is the one captured when the HTML was generated.

## Team collaboration

Commit `delivery.json` to the team repository; `git pull` / `git push` is the sync. When someone else wrote the file first, a stale write is refused with "file changed since read" — re-read and retry only the change you still need. Git resolves conflicts between commits; the version guard stops a silent overwrite of an uncommitted edit.

## Development

```bash
git clone … && cd dsh-delivery-board
npm run check     # syntax check for scripts/ and lib/
npm test          # 135 domain, board, HTTP and CLI tests
```

No runtime or build dependencies; Node ≥ 20.

## Limits

- Not a project-management suite: no cloud, accounts, notifications, portfolio rollup or realtime multi-user sync.
- WIP limits and DoD are soft signals; neither blocks a move.
- The board is a local, single-machine tool; the shared artifact is the JSON file.
- Drag and drop is checked in a local browser harness; cards are keyboard-focusable, but there is no full mobile or WCAG claim.

## License

[MIT](LICENSE) © 2026 jerryxff26-alt