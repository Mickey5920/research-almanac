---
type: user-guide
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, skill, html, history, git]
---

# Agent 调用与 HTML 本地记录输出

[简体中文 README](../README.md) · [English README](../README.en.md)

## 用户怎么用

在 Agent 中调用 Skill 并提供论文项目、准备状态、日期和截止等信息。Agent 补齐所需上下文，运行 Skill 中的本地引擎，然后交付 report.html。

~~~text
使用 $zhouyi-paper-submit-advisor，结合当前论文项目安排下周投稿时间。
用 HTML 展示这次输入、结果，以及已有的本地历史。
~~~

用户不需要在网页重新填表，也不需要启动服务。打开 Agent 返回的 HTML 文件，就能查看本次输入与结果、搜索往期记录及对比两次输入/结果。调整要求继续在 Agent 对话中提出。

## 处理边界

| 部分 | 职责 |
|---|---|
| Agent | 理解用户请求、读取授权项目上下文、整理结构化输入、调用 Skill 脚本、交付 HTML |
| 本地脚本 | 校验输入、按已有规则计算、保存 input/report、读取历史并渲染模板 |
| HTML 模板 | 只读展示生成时的本地记录快照；搜索、切换、对比；无计算、聊天或模型连接 |
| 历史文件 | .local-data/history/ 中每条独立 JSON；Git 默认忽略 |

HTML 没有 AI 客户端、API Key 或联网请求；其内容安全策略禁用网络连接。样式、展示脚本和记录均嵌入文件，关闭 Agent 后仍可直接查看。

浏览器不能在不授权的情况下自动扫描任意本地目录。因此由 Skill 脚本在生成时读取本地 JSON，并嵌入 HTML。旧 HTML 保留当时快照；后续调用会生成包含新记录的新 HTML。需要刷新历史视图时，Agent 仅重建展示文件，无需重新推算或调用模型接口。

## Agent 执行契约

首次在 Skill 目录安装依赖：npm ci --ignore-scripts。随后：

~~~sh
node scripts/cli.js recommend runs/input.json --out runs/UNIQUE-RUN
~~~

每次使用新的输出目录。结果包括：

- input.json：完整有效输入，包含本次固定计算时间 now。
- recommendations.json：引擎完整结果与版本。
- record.json：配对输入/结果，含独立记录 ID、来源与保存时间。
- report.html：当前调用默认选中，包含此前本地历史；主要交付文件。
- report.md、report.en.md、manifest.json，以及适用时的日历与方位图。

同时新增 .local-data/history/UUID.json；不覆盖任何旧记录。无 --out 的 recommend 仅输出 JSON，不保存记录；Skill 正式交付应使用 --out。

只读重建全部历史，不计算、不添加记录：

~~~sh
node scripts/cli.js history-html --out runs/history-view-new.html
~~~

Agent 应返回 report.html 的绝对文件链接，宿主支持时直接打开文件预览。不要要求用户转到网页输入信息。默认历史目录相对于 Skill 安装目录，工作目录变化不会另建一套历史；需要项目独立历史时，两个命令均支持 --history-dir 私人目录，后续调用保持一致。

损坏记录保留原文件，并在生成的 HTML 中明确警告缺失；不会伪装成完整历史。旧版报告缺原始输入时明确显示无法还原，不能从结果反推输入。导入的外部输入/结果不自动视为重新计算验证过。

## 备份与迁移

私人复制 .local-data/history/ 即可保留完整记录；迁移到新 Skill 安装目录的同名位置后可重新生成 HTML。合并时不要覆盖同名 UUID 文件，先核对内容。记录与 HTML 均为明文项目资料，不属于公共源码。

Git 管理代码和文档，不管理私人历史；源码 ZIP 与 Git bundle 都不含本地记录。不要把真实输入放入已跟踪的 examples、docs 或 assets。

0.3.0 的网页填表工具保留为兼容入口 /workbench，但不是 Agent 调用流程。可选 npm start 的首页现在也仅展示本地记录，刷新页面才重新读取；默认 HTML 交付不依赖这个服务。

## Git

开发目录使用独立 main 分支，保留历次提交和版本标签。公开仓库：[Mickey5920/zhouyi-paper-submit-advisor](https://github.com/Mickey5920/zhouyi-paper-submit-advisor)。Git 只同步代码、文档与公开示例，私人历史继续保存在本地。

~~~sh
git status
git log --oneline --decorate -5
git diff
npm test
npm run check
git add scripts web tests docs README.md README.zh-CN.md SKILL.md package.json package-lock.json
git diff --cached --stat
git commit -m "feat: describe the next change"
~~~

源码 ZIP 不带 .git；使用 Git bundle 可保留版本历史：

~~~sh
git clone zhouyi-paper-submit-advisor-0.4.0.bundle zhouyi-paper-submit-advisor
~~~

新建自己的空 GitHub 仓库后，替换以下占位地址再执行：

~~~sh
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
git push origin v0.4.0
~~~

以上推送未自动执行。后续发布更新版本、测试、提交、打标签，再使用 npm run pack:release 生成版本目录。

## English

Invoke this Skill in the Agent conversation. The Agent resolves the project input, runs the local engine and returns report.html as the primary artifact. The user does not fill another web form or start a service.

The recommend command with --out now saves the full input/result pair to private local history and embeds that history into a self-contained read-only HTML template. The current invocation is selected explicitly. Search and comparison work offline. The HTML contains no model client, credentials, calculation controls or network requests.

The script reads local records at generation time; a previously generated HTML remains a snapshot. Use history-html to rebuild a view from local records without recalculating or adding a record. Keep the same private history directory across invocations. Source Git/ZIP/bundle exclude private history.

The optional local server now serves the read-only viewer at its root; the older form tool remains at /workbench for compatibility only.

## 验证与限制

已验证事实：78 项自动测试通过，包括 Agent 连续两次调用后的输入结果留存、本次标记、历史重建不新增记录、输出拒绝覆盖、无网络请求代码与 HTML 转义。

个人理解：让 Agent 负责交互、HTML 负责阅读更符合本项目的 Skill 用法。

待验证假设：长期大量记录的性能及真实用户体验；暂无分页、加密、云同步。当前 HTML 为中文，中英文 README 与 Markdown 报告保留。传统规则与高阶能力边界未改变。
