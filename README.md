---
type: readme
status: active
created: 2026-09-14
updated: 2026-09-20
tags: [research-almanac, zhouyi, skill, documentation]
---

<p align="center"><strong>简体中文</strong> · <a href="./README.en.md">English</a></p>

# 科研黄历 · 周易投稿辅助

**先安排一周科研，再为准备好的论文选择投稿时机。**

一个可在 Agent 中调用的 Skill：把六大学科的每日重点、具体行动、预期产物和周易选读放进一份紧凑的周计划。需要投稿时，再展开原有的具体时间、提交朝向、八卦解释与已有依据。

<p align="center"><strong>玄学提供仪式感，科学提供优先级。</strong></p>
<p align="center">v0.10.0 · Node.js 22+ · 本地计算 · 中英文离线 HTML · MIT</p>

![科研黄历中文界面：七天安排、六大学科、今日节奏与投稿辅助](assets/screenshots/almanac.v0100.zh-CN.png)

[功能](#把一周安排清楚) · [快速开始](#快速开始) · [投稿辅助](#投稿作为辅助完整能力保留) · [本地报告](#一次调用一份完整记录) · [规则与范围](#安排如何产生)

## 把一周安排清楚

| 功能 | 你会看到什么 |
|---|---|
| 七日科研黄历 | 按当地周一至周日显示日期、节气、假期与每日主题 |
| 六大学科 | 人文、社科、理学、工学、农学、医学，各有具体行动和对应产物 |
| 多样的今日节奏 | 梳理、推进、核查、交流、收口、恢复、轻读、接续，随日期和学科变化 |
| 项目任务安排 | 按时长、依赖、截止和可用时段安排任务，避开已定事件 |
| 一周全览 | 6 × 7 任务表，快速看到整周重点；详细内容按需展开 |
| 经典原文与解释 | 八卦原文、章节、白话解释与当日工作的现代联系 |
| 中英文切换 | 界面与内置建议离线切换，保留用户原文与古文 |
| 本次与往期 | 从本地保存的记录切换科研黄历和原有投稿报告 |

![整周安排：六大学科的每日重点与对应产物](assets/screenshots/almanac-week.v0100.zh-CN.png)

通用模式适合先看一周；提供具体项目任务后，会增加真实约束下的项目安排。缺少估时或暂时排不下的任务保留在“待安排事项”，不会自动当作完成。

## 快速开始

### 1. 放好整个 Skill 文件夹

从[仓库首页](https://github.com/Mickey5920/zhouyi-paper-submit-advisor)下载并解压，保留完整的 `zhouyi-paper-submit-advisor` 文件夹，放入 Agent 宿主支持的 Skill 目录。仓库名和调用名保持不变。

安装 Node.js 22+，在 Skill 文件夹内执行一次：

~~~sh
npm ci --ignore-scripts
~~~

依赖安装完成后，本地引擎和生成的 HTML 无需模型 API Key。Agent 宿主按自身配置运行。

### 2. 直接在 Agent 中说

> 使用 $zhouyi-paper-submit-advisor，给我下周的科研黄历和一周工作安排，六大学科都展示。我使用 Asia/Shanghai 时区，以科研安排为主，投稿作为辅助，输出中英文可切换的本地 HTML。

结合项目时：

> 结合我指定的论文项目安排下周。我需要核对图表、整理回复和确认附件。读取已有任务与截止信息；周二下午有组会。有足够时间且满足准备条件时，把投稿窗口放进辅助区。

调整时继续说：

> 主要看工学；周三上午不能安排，把未完成的验证保留到后续。沿用其他条件，生成一份新报告。

用户在对话中输入。**HTML 只读保存的记录，不连接 AI，不需要网页填表，也不需要启动服务。**

### 3. 运行示例

~~~sh
# 通用科研黄历
node scripts/cli.js weekly examples/weekly.json --out runs/first-week

# 项目科研安排 + 投稿辅助
node scripts/cli.js weekly examples/weekly-project.json --out runs/project-week
~~~

打开对应目录中的 **report.html**。示例使用固定模拟日期与任务；实际使用需移除 `now` 并替换为真实项目条件。每次输出用新目录，保留之前的记录。

## 投稿作为辅助，完整能力保留

科研任务先安排，投稿使用剩余可用时间。展开辅助区可看首选、备选窗口；继续展开完整报告，可以使用原有的朝向、八卦、星座与学术依据模块。

<p align="center"><img src="assets/marketing/poster.zh-v2.png" alt="周易论文投稿择时：融合版中的投稿辅助模块" width="480"></p>

| 保留能力 | 在融合版中的位置 |
|---|---|
| 精确投稿时间 | 辅助区显示本地操作区间与建议点击时刻 |
| 提交朝向与罗盘 | 完整投稿报告保留方向、方位角与固定北向示意 |
| 八卦原文与解释 | 依据保存的朝向对应后天八卦，附原文、章节与解释 |
| 可选个人星座 | 沿用既有文化分析，只在现实安排与学术依据之后参与比较 |
| 学术依据与截止 | 保存目标官方说明、核验来源、时区和实际截止规则 |
| 原有计划操作 | 比较、选定、复核、准备倒排与实际提交记录继续可用 |

只想择投稿时间，仍可直接调用：

~~~sh
node scripts/cli.js recommend examples/project.json --out runs/submission-only
~~~

完整用法和原投稿界面见[投稿模块指南](docs/SUBMISSION-GUIDE.md)。如果指定的投稿准备任务尚未完成，结果会保留条件状态；若必要任务无法排入，本轮不产生投稿窗口。

## 一次调用，一份完整记录

~~~text
runs/project-week/
  report.html              科研黄历 + 展开式投稿辅助
  input.json               本次完整输入
  weekly.json              七天安排与结构化结果
  record.json              输入与结果的配对记录
  report.md / report.en.md 中英文阅读版
  manifest.json            版本与运行信息
  submission.json         启用投稿时：原引擎完整结果
  submission.html         启用投稿时：独立完整投稿报告
  submission-windows.ics  有候选窗口时：候选日历事件
~~~

每次调用还会向 `.local-data/history/` 新增独立记录，旧投稿记录继续可读。更新 Skill 时保留这个目录，或持续使用同一个 `--history-dir`。`runs/` 和本地历史不进入 Git 或发布包。

只想重新查看已有记录：

~~~sh
node scripts/cli.js history-html --out runs/history-view.html
~~~

HTML 嵌入生成时的输入、结果、图片和展示逻辑。新输入和新结果由 Agent 生成新快照，打开旧报告不会自动重新计算。

<details>
<summary>查看英文界面</summary>

![英文科研黄历，展示同一份保存的示例记录](assets/screenshots/almanac.v0100.en.png)

</details>

## 安排如何产生

**真实约束 → 科研任务 → 剩余时间里的投稿窗口 → 文化解释。**

- 默认预留 20% 日程缓冲，每天最多三项项目任务；可调整。通用学科建议不会自动变成预约。
- 固定实验、采样、诊疗值班和研究随访按已确认的现实安排执行。休息日允许留白。
- 当前随包提供 2026 年中国大陆官方假期表；其他年份使用有说明的工作日回退。非上海时区仍支持当地周计划。
- 原文来自《周易·说卦传》，按工作主题选读；投稿朝向沿用既有后天八卦映射。解释与历法事实分别保存。
- 适用且已核验的学术依据优先于传统择吉；不把单篇研究变成通用的“周末拒稿率”规则，也不输出录用概率。

任务库、节奏与排程默认值是工作组织建议。当前排程为单人顺序安排，不拆分跨日任务；未实现多人资源优化、完整奇门/八字/梅花排盘或自动投稿。完整范围、输入结构和验收要求见[融合项目指导](docs/RESEARCH-ALMANAC.md)。

## 开发与分发

~~~sh
npm test
npm run check
npm run pack:release
~~~

所有运行必需文件都在同一目录。发布导出包含 Skill、模板、规则、示例与素材，不包含依赖目录、私人项目记录或缓存。

[Skill 入口](SKILL.md) · [命令](docs/COMMANDS.md) · [项目指导](docs/PROJECT-GUIDE.md) · [已实现范围](docs/IMPLEMENTATION.md) · [许可](LICENSE) · [第三方说明](THIRD_PARTY_NOTICES.md)
