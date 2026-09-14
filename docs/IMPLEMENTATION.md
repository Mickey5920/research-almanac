---
type: implementation-record
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, implementation]
---

# Implementation status — 0.5.0 preview

This is a working local preview, not a claim that every roadmap item is complete. The package is ready for source upload to GitHub; it has not been published or installed globally.

## 0.4.0 interaction correction

The Agent conversation is the input surface. recommend --out saves full inputs/results and outputs report.html with earlier local records and the current invocation explicitly selected. history-html rebuilds the view without calculating. The HTML has no model client, network requests or calculation controls. Local records are embedded at generation time; no service is required. The older form tool remains at /workbench; the optional service root now shows the read-only template.

## 已验证事实 / Verified facts

- Local runtime: Node 24.15.0 on Windows. All dependencies pinned in package-lock.json.
- Scheduling, schema validation, bilingual rendering, candidate ICS, direction SVG, comparison, JSON patches, plan selection/review, submission confirmation, preparation backplanning and local cultural reflection are implemented.
- Node test suite: **78 tests passed**, with no skipped tests. Includes the existing 68 engine/lifecycle cases eight web/history tests and two Agent HTML integration tests covering form dates, DST, persistence, import/export, escaping and local request boundaries. See tests/engine.test.js and tests/web.test.js.
- Agent invocations now automatically save input.json, record.json and report.html with local history. The 0.3.0 form workbench remains a compatibility tool; the default workflow no longer requires it. Source templates are web/report.html and web/report.js; generation is scripts/report-html.js.
- Independent Git repository on main, baseline plus feature commit, version tags v0.3.0 and v0.4.0. Private history is excluded from Git and the release exporter; no remote is configured or pushed.
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
| F28 HTML history / Git | Agent-first input and automatic paired local records; read-only HTML output with current/history comparison and no model/network connection. Independent Git source versioning. See [output guide](WORKBENCH.md). |

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

## 0.4.1 visual refinement

The read-only HTML now embeds a generated dark-teal/gold luopan hero and uses a dedicated report stylesheet. Primary and alternate windows share identical padding and field grids; only color highlights the primary. Inputs have a readable summary plus expandable JSON. The image is decorative and does not supply calendar or direction facts. Embedded-image regression checks and the existing 78 tests pass. Browser automation was unavailable in this session, so a fresh browser screenshot and measured visual alignment remain unverified. See [image prompt and provenance](../assets/interface/PROMPTS.md).

## 0.5.0 window explanations and reference library

Every candidate displays recorded officer/hour factors, direction context, the operational minute budget, relevant remaining conditions and a checked stage-level Zhouyi reflection. Sources are expandable; explanation version window-explanation-v1 is separate from the unchanged stored report/ranking.

The HTML includes three published study summaries with distinct denominators, a JSCS historical weekday chart, six book categories with explicit availability, seven bilingual terms, and target-specific official evidence from input.academic_evidence. Verified entries require a source URL/title and check date; venue mismatch or invalid editorial timezone is rejected. The schema checks structure; the Agent must actually verify the source.

88 automated tests pass. No model client or automatic network retrieval is introduced into HTML. Unimplemented Meihua/Qimen/Bazi systems stay unavailable. No journal-specific current acceptance dataset is claimed. Target official information remains unknown until provided and verified; no office hours inferred from publisher addresses. See [evidence rules and bibliography](../references/academic-evidence.md). Fresh visual browser verification remains pending because browser automation was unavailable.

## 0.5.1 concise window reasons

Window reasons show supported favorable factors, direction, concrete submission timing and sufficient deadline margin directly. Missing or neutral factors are omitted; an empty explanation hides the whole section. Sources remain collapsed. Historical inputs and results are preserved.

## 0.5.2 modular report design

The report uses a history sidebar, structured input cards, a result overview, and aligned submission windows. Jade identifies favorable factors, blue identifies practical schedules and academic evidence, gold identifies cultural references, and slate identifies archives and comparison. Status text accompanies color. Module navigation, mobile stacking, keyboard focus, reduced motion and print styles are included. Existing local snapshots remain immutable.

## 0.5.3 directional guidance

Each window with a supported saved direction displays a fixed-north compass, a clockwise bearing, and three practical steps for aligning the user's facing direction with a phone compass. Eight directions are supported; missing directions omit the panel. Local vector icons identify dates, timing, actions, evidence and cultural references. The HTML uses no location or orientation sensors and makes no network requests.
