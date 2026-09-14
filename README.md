---
type: readme
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, skill, documentation]
---

<p align="center"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>

![Zhouyi Paper Submit Advisor — Plan thoughtfully. Submit calmly.](assets/marketing/hero.png)

# Zhouyi Paper Submit Advisor

**A local agent Skill for thoughtful paper-submission planning, with traceable Yijing cultural reflection.**

Plan around your manuscript's readiness, availability and deadline. Compare up to three windows, choose one, revisit it when plans change, and keep the final submission record.

**Release 0.5.6 · Local-first · Node.js 22+ · Chinese / English documentation**

> Calendar traditions are cultural references. This tool does not estimate acceptance probabilities.

## What works today

| Capability | What you get |
|---|---|
| Agent HTML output | Agent saves paired inputs/results and returns a read-only local history template |
| Local history | Current invocation and earlier records; offline search and comparison, without AI connections |
| Project-aware scheduling | Readiness conditions, earliest-ready time, availability, exclusions and a stage-specific deadline |
| Traditional reference | Pinned Chinese-calendar day/hour labels and daily Xi-shen direction for Asia/Shanghai |
| Exact operational times | Local timestamps with offsets; editable final-operation duration and click offset |
| Compare and choose | Stable ordering, diverse dates, plan snapshots and explicit review states |
| Conversational adjustments | The host agent converts requests into validated local JSON patches |
| Cultural reflection | Four sourced excerpts from 乾 and 謙, brief/detailed explanations, supplied six-line recording |
| Prepare and record | Dependency-aware preparation backplanning and idempotent submission confirmation |
| Portable output | Chinese/English Markdown, JSON, candidate ICS and a fixed-north direction schematic |

Other timezones support practical scheduling with explicitly degraded traditional coverage. Qimen, personal Bazi, true solar time, additional schools and autonomous reminder providers are **not implemented**. See [implementation status](docs/IMPLEMENTATION.md) for exact boundaries.

## Quick start

Invoke the Skill in your Agent conversation and provide the paper project and constraints there. The Agent returns **report.html**, a read-only local template showing this invocation's input/result and earlier local records. Open the file directly: no model connection, network requests, browser form or service is required.

The Agent uses:

~~~sh
npm ci --ignore-scripts
node scripts/cli.js recommend examples/project.json --out runs/new-agent-run
~~~

Each run saves input.json, record.json, report.html and bilingual reports, and appends a pair to private .local-data/history/. The example uses a frozen synthetic date/deadline; real inputs must replace these details and omit fixed now.

To rebuild history without recalculating or adding a record:

~~~sh
node scripts/cli.js history-html --out runs/history-view-new.html
~~~

New invocations generate new HTML snapshots; existing files do not update automatically. Changes are requested in the Agent conversation. See [Agent output and Git guide](docs/WORKBENCH.md).

## Use as an agent Skill

Keep this whole folder named **zhouyi-paper-submit-advisor**. Place it in your agent host's supported Skill directory, install the local dependencies there, and invoke:

> Use $zhouyi-paper-submit-advisor to read my paper project's current preparation status and suggest three submission windows next week. Show local time, optional facing direction, sources and remaining tasks.

[SKILL.md](SKILL.md) is the entrypoint. No login or API key is required. The CLI runs directly; the browser workbench uses a local-only service. The host agent reads project context; the CLI itself does not crawl your files or browse journal websites.

## A continuous workflow

1. **Recommend** — generate feasible windows with labelled cultural references.
2. **Compare** — inspect the factors that actually determined the ranking.
3. **Select** — save a plan instead of recalculating every time you view it.
4. **Review** — check changed deadlines, availability, manuscript version or prerequisites.
5. **Submit and record** — explicitly confirm the actual event and save its evidence reference.

~~~sh
node scripts/cli.js compare runs/demo/recommendations.json 1 2
node scripts/cli.js select runs/demo/recommendations.json 1 --out runs/plan-1.json
node scripts/cli.js patch examples/project.json examples/patch.json --out runs/changed-input.json
node scripts/cli.js recommend runs/changed-input.json --out runs/changed-plan
node scripts/cli.js render runs/demo/recommendations.json en detailed
node scripts/cli.js backplan examples/tasks.json
~~~

[Full command reference](docs/COMMANDS.md) · [Input schema](schemas/input.schema.json) · [Sample report](docs/example-report.en.md)

## Cultural mode

~~~sh
node scripts/cli.js recommend examples/cultural.json --out runs/reflection
node scripts/cli.js recommend examples/lines.json --out runs/six-lines
~~~

Text reflection requires no project or deadline. The six-line mode takes user-supplied 6/7/8/9 values, bottom to top, and mechanically transforms moving lines. It is not random casting or a full 64-hexagram commentary engine.

The day-officer ranking and optional facing adaptation are explicitly modern project analogies. The minutes are scheduling preferences, not minute-level divination. See [calendar rules](references/calendar-rules.md) and [sources](docs/DECISIONS.md).

## Privacy and reminders

The input schema rejects unsupported fields, including birth data. Reports contain your supplied project title and conditions, so keep runs/ private. The release exporter excludes runs, dependencies, caches and environment files.

ICS export creates candidate calendar events **without alarms**. Actual reminders require an available host tool and user authorization. No successful external reminder is claimed merely because a local file exists.

## Repository map

~~~text
SKILL.md                 Agent entrypoint
agents/                  Optional host UI metadata
scripts/                 Scheduling, reports, plans and release export
schemas/                 Validated input and output contracts
data/                    Excerpts and source registry
config/                  Editable operational defaults
references/              Focused agent instructions
examples/                Synthetic, portable inputs
tests/                   Automated behavioral checks
docs/                    Design, decisions and implementation evidence
assets/marketing/        Generated promotional art and prompts
~~~

## For GitHub

Upload this folder's source contents, or use:

~~~sh
npm run check
npm run pack:release
~~~

The exporter creates a clean folder under dist/ with only allowlisted public source, documentation and images. Upload the **contents** of that clean folder as the GitHub repository root; do not upload node_modules or private runs. GitHub's top language link switches directly between the two README files. No repository URL, build badge or published release is fabricated.

The CI workflow is configured for Node 22/24 on Windows and Linux. A configured workflow is not evidence that GitHub CI has already run.

## Design and release scope

[Full project guide (Chinese)](docs/PROJECT-GUIDE.md) · [Implementation and verification](docs/IMPLEMENTATION.md) · [Third-party notices](THIRD_PARTY_NOTICES.md)

The guide includes future work; it is not a claim that every planned feature is implemented. Contributions should preserve explicit unknowns, traceable rules and reproducible time calculations.

<details>
<summary>Promotional poster</summary>

![Chinese promotional poster](assets/marketing/poster.zh-v2.png)

</details>

Code and original documentation: [MIT](LICENSE). Third-party material retains its applicable terms. Generated art provenance: [prompts and tool notes](assets/marketing/PROMPTS.md).

## Window explanations and academic evidence

Each window shows recorded day/hour factors, direction sources, operational minute rationale and a stage-level Zhouyi reflection. The HTML adds a book catalog, three published-study summaries with sample/denominator limits, a historical weekday chart, target-specific official evidence and a bilingual glossary. Unimplemented traditions remain unavailable. No personal acceptance probability is inferred. The Agent verifies target sources and stores them locally; HTML stays read-only. See [evidence rules](references/academic-evidence.md).
