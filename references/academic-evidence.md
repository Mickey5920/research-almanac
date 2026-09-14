---
type: skill-reference
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, academic-evidence, submission, references]
---

# 19.1 参考书目

书目与中英文术语表统一维护于 [reference-library.json](../data/reference-library.json)，HTML 直接使用同一份本地目录。已启用的《周易》引文用于投稿阶段启示。梅花易数、奇门遁甲、渊海子平、三命通会作为后续来源目录，并不表示已经起卦、排盘或分析八字。黄历通书必须确定具体版本、年份和页码，当前历法库标签不冒称已逐条核对通书。

《奇门遁甲》是用户给出的参考类别；核验时需指明具体典籍，本轮定位《遁甲演义》（四库全书本）。任何新增有利判断须保留书名、版本/篇章、原文或可靠定位、实际计算输入和规则。没有计算则显示未启用，不以书名装饰一项编造的结论。

# 19.2 学术参考与数据口径

已验证的公开研究（非本项目重新收集的投稿数据库）：

- [JSCS 个案原文，表 1](https://arxiv.org/html/1604.01544v1)：2013–2014 年，596 次投稿。页面按每个星期的接收数/投稿数画图。原文引言和摘要的周二/周三描述有不一致，图表按表 1；不使用存在不一致的表 2 总量。单刊观察值不外推为当前目标录用率。
- [四刊大样本](https://arxiv.org/abs/2005.04398)：2018 年发表，2020 年存入 arXiv，约 178,000 篇已接收论文。没有全部投稿分母，不能由已接收论文的星期分布直接推导接收率。
- [JPCH 研究](https://researchers.westernsydney.edu.au/en/publications/timing-of-submissions-to-the-journal-of-paediatrics-and-child-hea/)：2023 年发表；2015–2022 年 11,499 次投稿。周末相对工作日的更正向编辑决定 OR 为 0.87，95% 贝叶斯可信区间 0.78–0.97。OR 不是概率，也不是减少 13 个百分点；该观察性关联不证明更换时刻造成结局改变。

这些样本不相加、不训练个人录用预测、不改变择时排序。HTML 展示统计口径与限制，不贴“数据证明周二必中”的标签。若日后用户提供真实授权数据，需另行设计数据分析：保留未接收/撤稿/处理中分母、时间区间、时区、稿件类型、混杂因素、缺失值和不确定区间，不能只收已发表论文计算接收率。

## Agent 针对目标的核验流程

1. 核对 project.target 的期刊/会议身份、官网域名、会议年份、轨道与投稿阶段。
2. 查官网 author instructions / submission system，记录截止和准备要求。Nature 的内置说明只是公共核验范例，不自动套用其他刊物。
3. 编辑部工作时间须有明确来源；出版社总部地址不能推出编辑位置，支持团队办公时间也不能冒充学术编辑工作时间。找不到时保存 not_found；不得默认周一至周五 9–17 点。
4. 会议原文明说 AoE 才按 UTC−12；按其具体分钟、日期和阶段转换成本地 IANA 时区。参考 [IEEE AoE 定义](https://www.ieee802.org/16/aoe.html)。官网没说明时保持待核实。
5. 存入 input.academic_evidence。status=verified 必须同时有 source_title、https source_url、checked_at。核验状态由 Agent 的实际查证支持，校验器只检查结构，不会联网代替核验。无法浏览或未发现官方信息时分别使用 unknown / not_found。
6. academic_evidence.target 必须与 project.target 一致；换刊后重新核验。工作时间只作联络参考，不等于即时审稿。事实变更需由 Agent 再次查证，新输入保存新记录。
7. HTML 只读取本地结构化记录，不访问期刊网站、文献 API 或 AI。显式点击来源链接由用户自行打开，默认展示过程不联网。

示例结构（示意字段，不是假装已核验）：

~~~json
{
  "academic_evidence": {
    "target": "与 project.target 完全一致的目标",
    "journal_system": {
      "status": "unknown",
      "summary": "尚未核验该目标官网的投稿系统要求"
    },
    "editorial_office": {
      "status": "not_found",
      "summary": "本次检索未发现公开的编辑部工作时间"
    },
    "conference_deadline": {
      "status": "unknown",
      "summary": "需核对目标会议年份、轨道、阶段及 AoE 原文"
    }
  }
}
~~~

# 19.3 术语表

建除十二神 / Twelve Day Officers、真太阳时 / True Solar Time、文昌位 / Wenchang Direction、用神 / Useful God、体用 / Ti-Yong、十神 / Ten Gods、AoE / Anywhere on Earth。完整定义和启用状态见同一份本地 reference-library.json，并在 HTML 中提供中英文对照表。

已验证事实：上述研究和官方示例已查证，核验日期为 2026-09-14。个人理解：区分观察性研究、实际投稿规则与文化寓意更有利于复盘。待验证假设：用户未指定具体目标，无法填充其真实官网规则、编辑部工作时间或会议截止；更多术数计算仍未启用。

