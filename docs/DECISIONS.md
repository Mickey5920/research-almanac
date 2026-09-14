---
type: design-decisions
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, skill, documentation]
---

# Sources, conventions and decisions

## 已验证事实 / Verified facts

Dependencies installed and pinned: lunar-javascript 1.7.7, Luxon 3.7.2, Ajv 8.20.0, ajv-formats 3.0.1. Runtime used for local verification: Node 24.15.0. Package lock records resolved artifacts. Source registry is [sources.json](../data/sources.json).

Calendar reference anchor: [upstream README](https://github.com/6tail/lunar-javascript) states 1986-05-29 is 癸酉 and Xi-shen is southeast. Eight daily-cycle expectations in tests are independently counted forward from this anchor. This verifies the adapter/cycle continuity; it is not eight independent seasonal or hour-boundary attestations. Traditional hour tables are inherited from the pinned library and remain limited to its documented convention.

Four short original-text excerpts were checked on 2026-09-14 against [乾](https://zh.wikisource.org/wiki/周易/乾) and [謙](https://zh.wikisource.org/wiki/周易/謙). No modern commentary was copied. Original English and Chinese project interpretations are separately stored. The six-line mode records supplied line values with a documented mechanical transformation, not a claimed ancient casting algorithm.

## 个人理解 / Design judgments

A local operational planning tool with optional cultural framing fits this request. The 成/开/收 ranking and facing adaptation are modern product choices. This release deliberately does not infer acceptance advantage from weekdays, directions or user outcomes.

Calendar coverage outside Asia/Shanghai is degraded rather than pretending a globally validated Chinese-calendar convention. Practical timezone arithmetic remains available. The README's version number labels software, not completion of every item in the design roadmap.

## 待验证假设 / Outstanding verification

Independent hour/solar-term cross-checks, additional classical editions, Qimen, personal Bazi, true solar time, automatic cross-plan supersession and native reminder-provider integration require further implementation or evidence. No acceptance-effect validation has been performed or claimed.

