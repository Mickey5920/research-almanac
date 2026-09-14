---
type: readme
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, skill, documentation]
---

<p align="center"><a href="./README.md">English</a> · <strong>简体中文</strong></p>

![周易投稿择时：从容安排，认真提交](assets/marketing/hero.png)

# 周易论文投稿择时助手

**结合论文准备状态与可追溯的周易文化解释，帮你从容安排投稿。**

根据真实准备进度、可用时间和截止日期选择投稿窗口，比较方案、保存选择，并在计划变化后复核，最终记录实际提交。

**0.5.4 版本 · 本地运行 · Node.js 22+ · 中英文文档与命令行报告**

> 择时与方位属于文化参考，不用于计算论文录用概率。

## 已实现功能

| 功能 | 实际能力 |
|---|---|
| Agent 输出 HTML | 在 Agent 中输入，Skill 保存结果并用本地只读模板展示 |
| 本次与历史记录 | 包含本次输入与结果、本地往期记录；可离线搜索和对比 |
| 结合论文项目 | 准备条件、最早就绪时间、可用时段、排除区间和当前阶段截止 |
| 传统日时参考 | 固定版本历法库；北京时间下的干支、建除、时辰与日家喜神方位 |
| 具体操作时间 | 带时区偏移的本地时间；可修改最终提交预算和建议点击偏移 |
| 对比与选定 | 稳定排序、不同日期备选、方案快照、明确的复核状态 |
| 自然语言修改 | 宿主 Agent 将“周三上午不行”等请求转为经过校验的局部修改 |
| 周易文化解读 | 乾、謙两篇中的四条可追溯短引文；简洁/详细展示；用户提供六爻记录 |
| 准备与收尾 | 有依赖关系的任务倒排、实际提交确认与更正记录 |
| 可携带产物 | 中英文 Markdown、JSON、候选 ICS、固定北向方位示意图 |

其他时区可做现实安排，并明确标注传统计算降级。**尚未实现**奇门、个人八字、真太阳时、更多流派和独立提醒服务。完整边界见[实施记录](docs/IMPLEMENTATION.md)。

## 快速开始

在 Agent 对话中调用 Skill，提供论文项目和投稿要求。Agent 完成处理后返回 **report.html**，展示本次输入、结果与本地往期记录。HTML 直接打开即可，只负责展示，不连接 AI 模型、不计算，不需要网页填表或启动服务。

Agent 使用以下本地脚本：

~~~sh
npm ci --ignore-scripts
node scripts/cli.js recommend examples/project.json --out runs/new-agent-run
~~~

每次保存 input.json、record.json、report.html 及原有中英文报告，同时在被 Git 忽略的 .local-data/history/ 中新增独立记录。示例采用固定模拟时间/截止；真实使用由 Agent 替换信息并移除固定 now。

仅从本地历史重建 HTML，不重新推算：

~~~sh
node scripts/cli.js history-html --out runs/history-view-new.html
~~~

HTML 是生成时的快照；新调用生成包含新记录的新文件，旧 HTML 不自动更新。调整要求继续在 Agent 对话中提出。[Agent 输出、历史备份与 Git 指南](docs/WORKBENCH.md)说明完整流程。

## 作为 Skill 使用

保留整个 **zhouyi-paper-submit-advisor** 文件夹，将其放入你的 Agent 宿主支持的 Skill 目录，并在该目录安装依赖。然后可以直接说：

> 使用 $zhouyi-paper-submit-advisor，结合我当前论文的准备状态，选出下周三个投稿窗口。给出本地具体时间、参考面向方位、来源和剩余待办。

[SKILL.md](SKILL.md) 是入口。无需账号或 API Key；命令行直接运行，网页通过仅本机可访问的服务计算。项目内容由宿主 Agent 按需读取；命令行程序不会自行遍历知识库或查询期刊网页。

## 从推荐到完成

1. **推荐**：在实际可行的范围内给出文化参考。
2. **对比**：查看真正影响排序的条件差异。
3. **选定**：保存方案，重复查看不自动换时间。
4. **复核**：检查截止、作息、稿件版本和准备条件的变化。
5. **记录**：实际提交后，由用户确认真实时间及回执引用。

~~~sh
node scripts/cli.js compare runs/demo/recommendations.json 1 2
node scripts/cli.js select runs/demo/recommendations.json 1 --out runs/plan-1.json
node scripts/cli.js patch examples/project.json examples/patch.json --out runs/changed-input.json
node scripts/cli.js recommend runs/changed-input.json --out runs/changed-plan
node scripts/cli.js render runs/demo/recommendations.json zh detailed
node scripts/cli.js backplan examples/tasks.json
~~~

[完整命令说明](docs/COMMANDS.md) · [输入结构](schemas/input.schema.json) · [中文示例报告](docs/example-report.zh.md)

## 纯文化模式

~~~sh
node scripts/cli.js recommend examples/cultural.json --out runs/reflection
node scripts/cli.js recommend examples/lines.json --out runs/six-lines
~~~

经文解读不强制项目或截止日期。六爻模式接受用户从下到上提供的 6/7/8/9，记录本卦线形并转换动爻；它不是随机起卦，也不声称包含完整六十四卦注解。

“成、开、收”排序以及把日家喜神方位用于面向建议，都明确标为本项目的现代文化类比。具体分钟是操作安排，不是分钟级吉凶结论。详情见[规则说明](references/calendar-rules.md)和[来源决策](docs/DECISIONS.md)。

## 隐私与提醒

输入结构拒绝未支持字段，包括生辰信息。报告仍会包含你提供的项目标题和条件，因此应保持 runs/ 私有。发布导出会排除运行记录、依赖、缓存及环境文件。

ICS 导出的是**候选日历事件，不含提醒闹钟**。真实提醒需要宿主提供相应工具，并得到用户授权；不会因为生成一个文件就声称“提醒已设置”。

## 文件结构

~~~text
SKILL.md                 Skill 入口
agents/                  宿主界面元数据
scripts/                 择时、报告、方案与发布导出
schemas/                 输入输出校验结构
data/                    经文与来源记录
config/                  可修改操作默认值
references/              按需读取的 Agent 指引
examples/                可公开的模拟输入
tests/                   自动化行为测试
docs/                    设计、决策与实施证据
assets/marketing/        生成的宣传图片及提示词
~~~

## 上传 GitHub

可以上传源文件，或先生成干净发布目录：

~~~sh
npm run check
npm run pack:release
~~~

发布脚本在 dist/ 下生成只包含公开代码、文档和图片的文件夹。将其中的**内容**作为 GitHub 仓库根目录上传；不上传 node_modules 或私人 runs。两个 README 顶部的语言链接支持一键切换。

已提供 Windows/Linux、Node 22/24 的 CI 配置，但尚未在你的 GitHub 仓库运行，不显示虚构的通过徽章或发布地址。

## 设计与当前边界

[完整项目指导文件](docs/PROJECT-GUIDE.md) · [实施与验证记录](docs/IMPLEMENTATION.md) · [第三方说明](THIRD_PARTY_NOTICES.md)

指导文件保留后续规划，不代表所有功能已实现。贡献代码时请保留未知信息、来源追溯和可重复的时间计算。

<details>
<summary>查看中文宣传海报</summary>

![周易投稿择时宣传海报](assets/marketing/poster.zh-v2.png)

</details>

代码和原创文档采用 [MIT](LICENSE)。第三方材料保留适用条款。图片生成方式与提示词见[宣传素材记录](assets/marketing/PROMPTS.md)。

## 窗口依据与学术参考

每个窗口提供日课/时辰有利因素、方位来源、具体分钟安排与周易阶段启示。新增 19.1 参考书目、19.2 学术参考（研究样本、历史星期图、官网与时区/截止核验）、19.3 中英文术语表。没有启用的术数不会假装参与计算；研究观察值不用于预测个人录用率。Agent 核验目标信息后保存到本地，HTML 保持只读。[证据规则](references/academic-evidence.md)。
