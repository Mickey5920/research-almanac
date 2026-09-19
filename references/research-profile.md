---
type: skill-reference
status: active
created: 2026-09-20
updated: 2026-09-20
tags: [research-almanac, personalization, research-planning]
---

# 按专业、研究方式与阶段安排科研

0.13.0 保留六个紧凑的概览学科群，支持 `research_profile` 与更详细的科研操作。提供画像后，HTML 默认显示“我的研究安排”；查看其他方向时切换“全部学科概览”。页面仍只显示保存的本地结果，不生成新建议或调用模型。

## 在 Agent 中匹配

优先使用用户已给出的专业、项目资料和当前任务。专业名称不等于研究方法：心理学可能做访谈、量表、行为实验或计算；医学可能做临床队列或实验室研究。不要仅凭学科替用户确定方法。缺少画像也能生成通用黄历；只有缺失信息会实质影响任务时再问。

~~~json
"research_profile": {
  "specialties": ["clinical", "ai"],
  "methods": ["clinical", "computation"],
  "stage": "analysis",
  "degree": "academic_doctor",
  "focus": "核查队列定义、基线比较与模型评估"
}
~~~

- `specialties`：选用下面的方向 id，最多四项；交叉专业同时保留各方向及共同衔接点。
- `custom_specialties`：未列方向用 `[{"name":"数字人文","category":"14"}]`。名称保持用户原文；采用通用的阶段与方法建议，不假装具有专门内容库。
- 内置与自填方向合计最多四项；重复名称和 id 会被拒绝。
- `methods`：最多四种，可组合；未提供时保持空白。目录里的 `suggested_method` 仅供 Agent 发现选项，不会自动当成用户实际方法。
- `stage`：未提供时为 `general`，不推断用户刚开始选题。
- `degree`：可选 `academic_master`、`professional_master`、`academic_doctor`、`professional_doctor`。仅显示用户身份，不据此推断研究难度或可用时间。
- `focus`：可选本周关注事项，保持原文，展示在“本周关注”中，与生成的目标、产物和关键问题并列保留。

运行 `node scripts/cli.js profile-catalog` 可读取所有可用 id。示例：[临床＋AI](../examples/weekly-personalized.json)、[设计＋创作](../examples/weekly-creative.json)。示例日期与任务均为模拟数据，真实调用应替换。

## 每日建议如何组合

每个方向有专门的资料、行动、产物和核查要点。按本周真实工作日位置使用梳理、推进、核查、交流、收口、恢复、轻读和接续节奏；研究阶段进一步限定工作内容。写作、返修和答辩阶段优先整理已有证据与表达，不因为选择了实验方法就建议重新做实验。

每日保存：阶段主线、各方向行动、执行步骤、预期产物、核查点、轻量版本、卡住时的替代任务、有余力时的扩展任务、方法建议、交叉衔接和对应节奏。假期与休息日切换为可选轻量内容；必要采样、照护、连续实验和已定安排继续按真实约束执行。

这些是供选择的工作建议，不是要求一天做完的任务清单。它们不自动占用日程；只有有依据、带估时的 `tasks` 进入实际排程，真实约束与截止优先。输入阶段改变时，新建报告；旧记录不重算、不填补旧建议。

## 详细操作与本周关注

每天的执行清单默认展开。六类概览中的学科名称、详情入口及整周表格的学科和单元格都能直接打开对应学科、对应日期的安排；详情中可返回全部概览。用户主动收起的清单在当前报告、学科与日期内保持收起，语言切换不改变选择。

[本地操作库](../data/research-activities.json)为六个学科群分别保存九类操作，共 54 份双语指南。每份包含具体步骤、产物及核查点，结合专业资料和阶段展示。

| 操作 | 安排内容 |
|---|---|
| 文献阅读 | 找问题、方法、证据与出处，保留可复用的阅读卡 |
| 画图与表达 | 从研究问题选择图形，核查坐标、单位、图注与数据来源 |
| 总结归纳 | 整理本周结论、未解决问题和下一步输入 |
| 思考问题 | 写清核心问题、替代解释、假设与可核查的证据 |
| 论文复现 | 从论文中的一项结果入手，对齐材料、条件、版本与差异 |
| 实验与试做 | 按学科区分文本试标、调查试行、既定实验、测试或采样记录 |
| 代码与工具 | 复现问题、缩小改动、对照检查，保留环境与版本 |
| 论文写作 | 把主张与证据对应，完成一个可讨论的小单元 |
| 讨论与反馈 | 先展示问题和已有尝试，记录决定与后续责任 |

每天优先展示最多两项操作；完整九类指南放在“更多可选操作”。选择会考虑工作节奏、研究阶段和用户提供的方法。写作、返修、答辩、归档等阶段的实验、代码、复现菜单改为回看已有工作。恢复日不增加操作，休息日的轻读与接续均为可选。

“本周关注”保存阶段目标、各方向重点、建议产物、三个关键问题和操作日期分布，保留用户的 `focus` 原文。它是工作组织建议，不表示这些产物已经完成。

报告在顶层、各学科与个人安排中保存 `week_focus`，在每日任务中保存 `operations`，在学科或个人方向中保存可选操作库。HTML 与 Markdown 都读取这些已保存结果；打开旧报告时不填充新内容。

## 范围和来源

**已验证事实**：14 个门类名称与代码参照教育部[研究生教育学科专业目录（2022年）](https://www.moe.gov.cn/srcsite/A22/moe_833/202209/t20220914_660828.html)。门类为检索入口，不保证某个方向只能归属这个门类。

**个人理解 / 设计建议**：下面的 38 个方向是本项目面向工作流程编写的应用模板，名称、展示学科群、方法与阶段组合不等同完整官方专业名录，也不是教育部发布的科研建议。

**待验证假设**：对具体项目的适用性需要由实际研究问题、材料、已定方案与资源约束判断。模板不提供研究成功分、录用概率或诊疗决策。

## 门类与内置方向

| 门类 | 方向与调用 id |
|---|---|
| 01 哲学 | 哲学与伦理 `philosophy` |
| 02 经济学 | 经济与金融 `economics` |
| 03 法学 | 法学 `law`；政治与公共政策 `politics`；社会学与社会工作 `sociology` |
| 04 教育学 | 教育学 `education`；心理学 `psychology`；体育与运动科学 `sports` |
| 05 文学 | 文学与文化研究 `literature`；语言、翻译与传播 `language` |
| 06 历史学 | 历史学 `history`；考古与文博 `archaeology` |
| 07 理学 | 数学与统计 `mathematics`；物理与天文 `physics`；化学 `chemistry`；生物与生命科学 `biology`；地学与环境科学 `earth` |
| 08 工学 | 计算机与软件 `computer`；机械与制造 `mechanical`；电子、电气与通信 `electronics`；材料科学与工程 `materials`；土木、建筑与规划 `civil`；环境工程 `environmental` |
| 09 农学 | 作物与农业资源 `crop`；林学与生态观测 `forestry`；畜牧、兽医与水产 `animal` |
| 10 医学 | 临床与口腔研究 `clinical`；基础医学 `basic_medicine`；公共卫生与流行病学 `public_health`；药学与中药研究 `pharmacy`；护理与健康服务 `nursing` |
| 11 军事学 | 军事学文献与组织研究 `military` |
| 12 管理学 | 管理、会计与公共管理 `management` |
| 13 艺术学 | 艺术与创作研究 `arts`；音乐、戏剧与表演 `performance` |
| 14 交叉学科 | 人工智能与数据科学 `ai`；设计与人机交互 `design`；交叉研究 `interdisciplinary` |

## 研究方式

| id | 内容 |
|---|---|
| `text` | 文献与文本研究 / Literature and textual research |
| `qualitative` | 访谈与质性研究 / Interviews and qualitative research |
| `survey` | 问卷、量表与行为研究 / Surveys, measures and behavioral research |
| `secondary_data` | 数据分析与实证研究 / Data analysis and empirical research |
| `theory` | 理论推导与证明 / Theoretical derivation and proof |
| `computation` | 计算、仿真与算法 / Computation, simulation and algorithms |
| `wet_lab` | 实验室研究 / Laboratory research |
| `clinical` | 临床资料与队列研究 / Clinical records and cohort research |
| `field` | 田野、采样与观测 / Fieldwork, sampling and observation |
| `practice` | 设计、创作与实践研究 / Design, creative and practice research |
| `review` | 系统综述与证据整理 / Systematic review and evidence synthesis |
| `mixed` | 混合方法与跨域整合 / Mixed methods and cross-field integration |

## 研究阶段

| id | 阶段与产物 |
|---|---|
| `general` | 通用推进 → 一份可复查的阶段产物 |
| `exploration` | 选题与问题形成 → 问题卡与可行性清单 |
| `proposal` | 开题与方案 → 问题—方法—资料路线图 |
| `pilot` | 预研与小规模验证 → 预研记录与方案调整清单 |
| `collection` | 资料收集与实验 → 当次资料台账与质量记录 |
| `analysis` | 分析与验证 → 结果表与验证记录 |
| `writing` | 论文写作 → 一节草稿与主张—证据表 |
| `revision` | 返修与回应 → 意见—修改—回复对照表 |
| `defense` | 答辩与汇报 → 汇报页与关键问答卡 |
| `archiving` | 收尾与归档 → 可交接的研究资料包 |
