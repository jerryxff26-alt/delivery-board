# dsh-delivery-board

[English](README.md) · [中文](README.zh.md)

> **计划、负责人、状态与交接历史，落在代码旁的一份 `delivery.json`** — 无 SaaS、无账号、无插件；随 PR 一起审阅。

看板只是视图。PM 和工程师信任同一份文件：阶段、WIP、客户周报，以及真实发生过的移动记录。团队和他们的 agent 共用一份跟着仓库走的状态。

![演示：阶段看板 → 拖拽交接 → 日历时间线 → 深色模式](docs/demo/demo.gif)

## 它是什么

一个仓库，零依赖：

- `SKILL.md` — agent 怎么用它（计划 → 建卡 → 交接 → 汇报）
- `scripts/delivery.mjs` — 唯一入口：确定性写入、周报、本地看板
- `lib/` — 领域规则（卡号、交接历史、DoD、归档）与看板渲染
- `test/` — 回归测试

安装就是把一个 skill 目录指向这个仓库：

```bash
git clone https://github.com/jerryxff26-alt/delivery-board.git ~/git-repo/dsh-delivery-board
ln -s ~/git-repo/dsh-delivery-board ~/.agents/skills/delivery   # 或 <项目>/.agents/skills/delivery
```

之后要么在 DeepSeek Harness 里输入 `/delivery-board …`（skill 会把指令加载给模型），要么直接自己跑脚本，不经过模型。

## 30 秒上手

```bash
alias delivery="node ~/git-repo/dsh-delivery-board/scripts/delivery.mjs"

cd your-project
delivery init ACME lite
delivery card '{"title":"API integration","stage":"doing","owner":"Ada","description":"Wire partner API"}'
delivery board
delivery open        # 本地看板 + 时间线，Ctrl+C 退出
delivery weekly
```

状态默认写在当前目录的 `delivery.json`（用 `--cwd` / `--file` 覆盖）。

## 包含什么

- **阶段流水线与卡片** — 负责人、可选描述、`start`/`due`、验收标准与可勾选的 DoD。阶段可在初始化后增删改（有卡片时必须先迁移）。
- **交接审计** — 移动卡片会记录谁把什么交给了谁，并写入操作者（`--actor`，其次 `DELIVERY_ACTOR`，最后 `git config user.name`）。
- **周报** — 给客户的 Markdown：流水线快照、已交付、交接、未关闭风险、本周已消化风险，可选下周投注。
- **软 WIP 上限** — 阶段可选 `wipLimit`；看板只提示，从不拦截移动。
- **本地看板** — 拖拽、归档/恢复、风险记录、卡片级 DoD、键盘可用（Tab 聚焦卡片、回车打开），中英文界面。
- **时间线视图** — 只用现有数据推导的日历轴甘特图。
- **整板归档** — 快照到 `delivery-archive/<日期>-<slug>.json`，然后重置为空板并保留流水线。
- **离线 HTML** — 一个只读文件，没有工具的人也能打开看。

![可编辑看板全宽视图](docs/screenshots/board.jpg)

![时间线视图：按阶段着色的日历轴条形](docs/screenshots/timeline.jpg)

<details>
<summary>卡片编辑器、归档与深色模式</summary>

![深色模式、中文界面的时间线视图](docs/screenshots/timeline-dark-zh.jpg)

![卡片编辑器：标题、负责人、截止日期、阶段、验收标准与完成定义](docs/screenshots/card-editor.jpg)

![归档视图：保留卡片细节，可恢复到原阶段](docs/screenshots/archive.jpg)

</details>

## 日常循环

| 意图 | 命令 |
|---|---|
| 初始化（一次） | `init ACME lite` |
| 新建卡片 | `card '{"title":"API","stage":"doing","owner":"Ada","due":"2026-11-20"}'` |
| 交接 | `move c1 review` |
| 编辑但不移动 | `update '{"card_id":"c1","stage":"review","owner":"Bo"}'` |
| 记录进展 / 风险 / 阻塞 | `log '{"type":"blocker","text":"Waiting for UAT","card_id":"c1"}'` |
| 看一眼 | `board [--archived]` |
| 可编辑看板 | `open` |
| 周报 | `weekly 2026-11-02` |

`delivery --help` 会列出全部命令，包括 DoD、阶段维护、归档和 HTML 导出。

卡片和阶段可以用 id 或完全匹配的标题/名称引用；找不到或有歧义时会列出候选，而不是猜。

## 看板

`open` 绑定 `127.0.0.1` 的随机端口和不可猜测路径，并打印 URL。加 `--browser` 会直接打开浏览器；之后 20 分钟没有访问、或最后一个标签页关闭几秒后，进程自己退出（`--idle 0` 则一直运行到 Ctrl+C）。把它当作本机私有的东西。看板改的是同一份 `delivery.json`，写入走和脚本同一套规则，所以历史和卡号保持一致。

`html` 生成的是一个自包含单文件。直接从磁盘打开是只读的，但页面里带 **连接 delivery.json**：在 Chrome / Edge 里选中文件一次，之后就在原文件上读写——同样的规则、同样的历史，不需要常驻进程。这些写入记录的操作者，是生成 HTML 时解析到的那个 actor。

## 团队协作

把 `delivery.json` 提交到团队仓库，`git pull` / `git push` 就是同步。别人先写过文件时，过期的写入会被拒绝（"file changed since read"）——重新读一遍，只重试还需要做的那部分。已提交的冲突交给 git；版本守卫负责拦住对未提交编辑的静默覆盖。

## 开发

```bash
git clone … && cd dsh-delivery-board
npm run check     # 检查 scripts/ 与 lib/ 的语法
npm test          # 135 项领域、看板、HTTP 与 CLI 测试
```

无运行时和构建依赖；需要 Node ≥ 20。

## 边界

- 不是项目管理套件：没有云端、账号、通知、项目集汇总或实时多人同步。
- WIP 上限和 DoD 都是软信号，都不拦截移动。
- 看板是单机本地工具；真正共享的是那份 JSON。
- 拖拽在本地浏览器里验证过；卡片支持键盘聚焦，但不宣称完整的移动端或 WCAG 合规。

## License

[MIT](LICENSE) © 2026 jerryxff26-alt