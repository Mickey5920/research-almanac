---
type: implementation-record
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, implementation]
---

# Implementation status — 0.3.0 preview

This is a working local preview, not a claim that every roadmap item is complete. The package is ready for source upload to GitHub; it has not been published or installed globally.

## 已验证事实 / Verified facts

- Local runtime: Node 24.15.0 on Windows. All dependencies pinned in package-lock.json.
- Scheduling, schema validation, bilingual rendering, candidate ICS, direction SVG, comparison, JSON patches, plan selection/review, submission confirmation, preparation backplanning and local cultural reflection are implemented.
- Node test suite: **76 tests passed**, with no skipped tests. Includes the existing 68 engine/lifecycle cases and eight web/history tests covering form dates, DST, persistence, import/export, escaping and local request boundaries. See tests/engine.test.js and tests/web.test.js.
- A local HTML workbench stores paired full inputs/results, browser drafts, immutable history, restore-as-new, comparison and JSON import/export. All history can be exported as a self-contained read-only HTML archive. Source lives in web/ and the local service in scripts/server.js.
- Independent Git repository on main, baseline plus feature commit, version tag v0.3.0. Private history is excluded from Git and the release exporter; no remote is configured or pushed.
- Skill frontmatter/structure passed the bundled skill-creator validator.
- Independent forward checks reproduced three initial defects: non-boolean confirmation accepted; requested range ignored during review; stale click/readiness during review. These were fixed and regression-tested. A follow-up found a stale proposed candidate after reverting a preference; that was also fixed with a dedicated regression test.
- Synthetic demo generated Chinese/English Markdown, JSON, manifest, ICS and a direction schematic. CLI cultural mode exported successfully without a project or deadline.
- GitHub CI is configured, but no remote CI run or release URL exists yet.
- Browser checks on 2026-09-14: generated two synthetic records, restored one as new JSON, compared three changed input fields, recovered the draft and both records after reload, and downloaded the archive. A separate static-only preview opened the exported HTML with both embedded records, switched their inputs and compared results without calculation endpoints. The 390px mobile layout was also inspected. No browser console errors were observed in these checks. Real-user usability remains untested.

## Feature coverage

| Design items | Current status |
|---|---|
| F01–F02 project context/readiness | Agent-guided extraction; structured readiness and conditions enforced by CLI. No autonomous project crawler. |
| F03–F07 dates, constraints, calendar, direction, ranking | Implemented; traditional adapter limited to Asia/Shanghai. Other timezones show practical results with explicit cultural degradation. |
| F08–F09 excerpts/report | Four verified short excerpts across two chapters, with original project reflections; bilingual Markdown and JSON. |
| F10/F26 casting | Limited: user-supplied six-line recording and transformation only. No random/time/Meihua casting, no full 64-hexagram commentary. |
| F11 export/blessings | ICS implemented; original blessings can be written by the host under Skill instructions, no independent blessing database. |
| F12–F13 advanced traditions | Not implemented: Qimen, personal Bazi, true solar time. |
| F14 multi-project/profile | Not implemented as a shared profile; per-project input JSON can preserve preferences. |
| F15–F18 segmented operation/card/adjust/compare | Local workflow plus agent instructions; 0.3.0 adds a browser workbench for recommendation inputs and historical comparisons. Plan selection/submission lifecycle remains CLI/agent-based. |
| F19–F20 plan lock/review | Snapshot and review implemented; new selections create separate plans. Automatic cross-plan supersession and a persistent background watcher are not implemented. |
| F21 backplanning | Single-person conservative task scheduler with dependencies, required estimates and conflicts. |
| F22–F24 diagram/record/depth | Implemented; fixed-north schematic, explicit submission record and rendering-only depth changes. |
| F25 edition/school choices | One collection and one ruleset; additional editions/schools are unavailable, not simulated. |
| F27 reminders | Host integration instructions and explicit unavailable CLI state. No native provider or background scheduler. |
| F28 HTML history / Git | Implemented local input/result history, restore, comparison, JSON interchange, offline read-only HTML and independent source versioning. See [workbench guide](WORKBENCH.md). |

## Work-package assessment

WP01–WP08/WP12 have working initial implementations, with documented source and host-dependent limits. WP09 has local and independent checks, but the original guide's broader reference-validation gate is not fully met: the eight day-cycle tests share one upstream anchor, and independent seasonal/hour-school validation is still outstanding. WP10/WP13 are partially delivered; WP14 is limited to host guidance. WP11 remains future work.

The full design uses more granular module names and richer schemas than this preview. This package consolidates calendar/time/ranking into core.js and keeps one stage-resolved deadline. The agent resolves relevant stage and evidence before calling it. Input/output schemas and CLI help are the authoritative executable contract for this release.

## 个人理解 / Design judgments

Practical constraints precede the internal cultural ordinal. No statistical acceptance advantage is inferred. Template explanations support reflection, not scientific validation. The traditional day/hour ranking is openly documented as a modern submission analogy.

## 待验证假设 / Remaining work

- Independent traditional hour/solar-term reference sets and additional schools.
- Full autonomous cross-plan lifecycle and actual reminder-provider integration.
- Broader source editions, full hexagram lookup and approved casting methods.
- Real user usability evaluation and remote CI on both configured operating systems.

The promotional files were generated by the built-in image tool and visually inspected, including a targeted six-row motif correction. The tool did not expose a model identifier; the user's requested Image2 identity cannot be verified. See [image prompts](../assets/marketing/PROMPTS.md).

## Reproduce local validation

~~~sh
npm ci --ignore-scripts
npm test
npm run check
node scripts/cli.js recommend examples/project.json --out runs/verification-new
node scripts/cli.js recommend examples/cultural.json --out runs/cultural-new
~~~

Use fresh output directories. Private forward-check runs are excluded from release exports. The automated regression tests preserve the reproduced issues without copying private paths or machine-specific tool output.
