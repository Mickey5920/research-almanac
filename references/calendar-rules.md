---
type: skill-reference
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, skill, documentation]
---

# Calendar rules and boundaries

Pinned adapter: lunar-javascript 1.7.7. Cultural calculations are currently enabled only for Asia/Shanghai. Other IANA timezones retain practical scheduling and show degraded cultural coverage. Set tradition.enabled=false for practical-only scheduling; strict_traditional with no supported engine returns no candidates.

Calendar calls use local wall-clock components. Day label uses getDayInGanZhi (civil-date label); hour uses the library's getTimeInGanZhi/getTimeTianShenLuck convention, including its late-Zi behavior. These fields retain their distinct meaning; windows never cross a civil midnight or traditional-hour boundary. Solar-time correction and alternative day-boundary schools are not implemented.

Ranking is a modern project mapping, not a quote from a classical text: 成=3, 开=2, 收=1, other day officers=0, multiplied by 2; add 1 for a library-labelled 吉 hour. This internal ordinal is used only after practical buffer and user hour preferences. No normalized score or probability is shown. Strict mode requires one of those three officers AND a 吉 hour. This is an explicit configurable cultural preference, not empirical efficacy evidence.

The fixed source is local-cultural-v1. No forced mixing of Wenchang, Xi-shen and Qimen. Direction is the day Xi-shen direction; adapting it to a facing ritual is labelled modern_analogy. It cannot indicate reviewer location or email travel.

A final operation uses a 30-minute default budget, click at +10 minutes. Both are configurable. Upload may happen earlier only when the project/system permits it; otherwise include upload in the final budget. Time windows are half-open; full end must be strictly before a known deadline. Soft 24-hour buffer can be missed with a visible flag; a hard buffer is never silently relaxed.

