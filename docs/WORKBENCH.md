---
type: user-guide
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, skill, html, history, git]
---

# 工作台、历史备份与 Git / Workbench, history and Git

[简体中文 README](../README.zh-CN.md) · [English README](../README.md)

## 启动与日常使用

在 Skill 文件夹中首次执行 npm ci --ignore-scripts，以后执行 npm start，打开 http://127.0.0.1:4318。需要 Node.js 22 或以上。服务仅监听本机；关闭终端后再次启动，历史仍在。端口占用时，在 PowerShell 中先设置 $env:PORT='4319'，再执行 npm start，使用新端口地址。

1. 填写论文标题、期刊/会议、稿件版本、准备条件、时区、日期、可用星期和截止。
2. 点击“生成并保存本次结果”。结果由同一择时引擎计算，不是前端随机演示。
3. 左侧按保存时间列出历史；选择一条即可查看当时完整输入与实际结果。
4. “载入为新输入”保留旧记录，在完整 JSON 模式下继续调整；自动移除固定 now。历史中的绝对日期、可用时段和截止仍需自行核对。
5. 在结果底部选择另一条记录，查看输入差异及时间/方位差异。
6. “新建”开始空白草稿，不删除记录。草稿与右侧已保存记录分开，右侧标题明确标识所选历史。

简明表单适合常见项目输入；跨夜时段、不同日期不同作息、排除区间、纯文化解读和额外结构字段使用完整 JSON。JSON 需符合[输入契约](../schemas/input.schema.json)。简明表单与 JSON 各自保留草稿，切换输入方式不会自动互相转换。

简明表单自定义日期含最后一天；内部保存为不含终点的区间。用户填写截止标记为 user_supplied，不能代替外部核验。夏令时不存在/重复的墙上时间会被拒绝；重复时刻用 JSON 明确偏移。传统计算范围仍限 Asia/Shanghai。

## 保存什么、保存在哪

| 内容 | 位置与行为 |
|---|---|
| 每次完整记录 | .local-data/history/ 中独立 UUID.json；包含 record_id、created_at、source、parent_record_id、input、report |
| 计算时刻 | input.now 固定本次运行时刻；report 保留结果与引擎版本 |
| 未生成草稿 | 当前浏览器 localStorage；不同浏览器/端口不共享；清浏览器数据会清除草稿 |
| CLI 产物 | runs/；独立于工作台，需手动导入报告 |
| 导出历史 HTML | 浏览器下载位置；含当时全部有效记录，后续新记录不会自动追加到旧导出 |
| 源代码版本 | 本文件夹的 Git 仓库；历史数据、runs、依赖、缓存和 dist 均被忽略 |

记录以新增方式保存，不提供覆盖旧记录或删除入口。损坏文件会被保留并显示警告；存在损坏记录时拒绝导出“全部历史”，避免静默遗漏。导入记录表示保存了该文件内容，不意味着重新验证了输入与结果的计算对应关系。

这是明文本机存储，并非加密保险箱。迁移代码或 Git 仓库不等于迁移私人历史。不要将自己的 JSON 或导出 HTML 放进已跟踪的 examples、docs、assets 等公共目录。

## 导入、离线查看与迁移

- **导入已有记录**：支持工作台导出的单条 JSON，或 CLI 的 recommendations.json。旧报告缺原始输入时显示“未保存原始输入”，不可载入为新输入；仍可查看及对比结果。
- **导出本条 JSON**：完整输入与结果可导入另一台机器的工作台。
- **导出历史 HTML**：CSS、脚本和全部记录嵌入一个文件，无需网络、Node 或其他配套文件即可浏览、搜索、对比、导出单条 JSON。该文件为只读快照，不能生成新结果。
- **迁移全部记录**：停止本地服务，私人复制 .local-data/history/ 到新安装的同名位置；保留 UUID 文件名。合并两套历史时不覆盖同名文件，先核对内容。
- **从 HTML 恢复**：离线 HTML 中逐条导出 JSON，再逐条导入工作台。当前不支持整个 HTML 的批量恢复。
- **备份**：私人保存整个 .local-data/history/ 是完整数据备份；HTML 是方便阅读的归档。Git 和公开源代码 ZIP 均不含私人记录。

## Git 版本管理

当前开发目录已初始化独立 main 分支。基线提交保留此前可运行版本，0.3.0 功能提交记录本次工作台变化；版本标签 v0.3.0 指向功能提交。尚未配置远程仓库或推送到 GitHub。

查看和记录后续修改：

~~~sh
git status
git log --oneline --decorate -5
git diff
npm test
npm run check
git add scripts web tests schemas docs README.md README.zh-CN.md package.json package-lock.json
git diff --cached --stat
git commit -m "feat: describe the next change"
~~~

提交前检查暂存文件只包含要发布的内容。.gitignore 防止常规误提交，不会保护刻意强制添加或已跟踪的私人文件。

公开 ZIP 是干净源代码，不含 .git。如果从 ZIP 开始，在解压目录初始化 Git：

~~~sh
git init -b main
git add .
git commit -m "chore: import release source"
~~~

需要保留现有提交历史时，使用原开发仓库，或本次附带的 Git bundle：

~~~sh
git clone zhouyi-paper-submit-advisor-0.3.0.bundle zhouyi-paper-submit-advisor
~~~

准备上传时，在 GitHub 创建空仓库，把下面的占位地址换为自己的真实仓库。以下命令仅为说明，项目未自动执行推送：

~~~sh
git remote add origin https://github.com/YOUR_ACCOUNT/YOUR_REPOSITORY.git
git push -u origin main
git push origin v0.3.0
~~~

后续发布先更新 package.json、锁文件和版本说明，再通过检查并提交、打新版本标签。npm run pack:release 导出到 dist/版本号/；已有同版本目录会拒绝覆盖。

## English essentials

Run npm ci --ignore-scripts once, then npm start. Open http://127.0.0.1:4318. The Chinese-language workbench uses the existing scheduling engine and saves immutable input/result pairs under ignored .local-data/history/. Browser drafts are separate from saved records.

History supports search, restore-as-new (removing the fixed run time), two-record comparison, JSON import/export and a self-contained read-only HTML archive. Recheck absolute availability and deadline dates when restoring. Old CLI reports without inputs stay explicitly incomplete. CLI runs are not automatically added to the workbench.

The HTML archive requires no service or internet to read. New calculations require the local service. For a full backup or migration, privately copy .local-data/history/ with its filenames preserved. An HTML archive can export individual JSON records for re-import; bulk HTML restoration is not implemented.

Git tracks source and documentation. It excludes personal history, runs, dependencies and release exports. The original development repository contains the baseline and v0.3.0 commits. The source ZIP omits .git; the accompanying Git bundle carries commit history and can be cloned locally. No remote has been configured or pushed. Keep private inputs and exported archives out of publicly tracked folders.

## 验证状态

已验证事实：76 项自动测试通过；新增测试覆盖表单时间转换、夏令时边界、独立记录持久化、损坏记录保护、导入、离线打包转义与本地接口访问边界。浏览器交互检查见[实施记录](IMPLEMENTATION.md)。

个人理解：保留输入、引擎版本与完整结果有助于复盘；不应把文化排序变化解释为录用优势。

待验证假设：真实用户长期大量历史的检索体验；跨浏览器用户测试。当前历史一次性载入全部记录，尚无分页或加密存储。

