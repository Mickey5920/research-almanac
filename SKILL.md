---
name: zhouyi-paper-submit-advisor
description: Read a specified paper project's readiness and recommend submission windows with traceable Chinese-calendar cultural references, practical deadlines, exact local times and optional facing directions. Also support Yijing text reflection, plan comparison, selection and review.
metadata:
  type: agent-skill
  status: implemented-with-limits
  created: "2026-09-14"
  updated: "2026-09-14"
---

# Zhouyi Paper Submit Advisor

Use the repository's actual scripts, not invented calendar calculations. Install dependencies with npm ci --ignore-scripts once if absent. Work from this Skill folder; save user runs under runs/ or another user-authorized private output directory. Never write private project inputs into committed examples/.

## Project requests

1. Read the user-specified project. Start with its overview, task list, manuscript manifest and submission requirements. Read only related sections needed to resolve missing facts. Preserve source references and distinguish supplied, verified, inferred and unknown information. If several projects are equally plausible, ask which one.
2. Follow [project context](references/project-context.md). Prepare input matching [input schema](schemas/input.schema.json). Do not invent city, birthday, readiness, deadline, journal weekday advantages or approval.
3. Resolve the active submission stage before filling deadline. For a journal with explicitly no deadline use status none; an unknown deadline is status unknown. Use an ISO timestamp with explicit offset and source; AoE is UTC−12 only if actually specified.
4. For live requests omit the example's fixed now. Use the known IANA timezone. next_week means the next Monday through the following Monday; rolling_7_days is a different mode.
5. Run node scripts/cli.js recommend INPUT.json --out runs/UNIQUE-RUN. Do not overwrite prior runs. This saves the complete input/result pair to local history and creates report.html containing this invocation plus earlier records. Present a clickable absolute link to report.html as the primary output and open it in the host's file viewer if available. Include the actual result status. [Rules and limits](references/calendar-rules.md) define the currently supported tradition.
6. Show the short recommendation card first. Separate preparation, upload/check, final submit and receipt. Unknown prerequisites remain conditions. Report concrete timestamps in the user's clock timezone; minutes are operational preferences.
7. For natural-language adjustments, translate only the specified fields into a JSON patch, run patch, then recommend. "Cannot" is an exclusion; "prefer" is a soft hour preference. Preserve unrelated settings. For comparison use compare REPORT.json RANK RANK.
8. On explicit selection use select; preserve that plan. To continue, review with current project facts rather than silently selecting another window. Changing display language/depth uses render, not new calendar calculation. See [plan lifecycle](references/plan-lifecycle.md).
9. Only an explicit user statement of submission or an authorized system receipt can create a submitted record. Use confirmed: true as a boolean, never replace actual time with planned time. Save a new revision file.

## Local HTML history

The user supplies information in the Agent conversation. Resolve project context and run the local scripts there; do not send the user to a browser form or require npm start. The HTML template is a read-only output artifact: it renders stored local inputs/results, identifies the current invocation, and supports search and historical comparison. It contains no model client, API key, network requests or calculation controls. CSS, display logic and the local record snapshot are embedded so it can open directly from disk after the Agent closes.

Always use recommend with --out for a new recommendation, including cultural mode, to save input.json, record.json, report.html and the persistent record under .local-data/history/. Fixed input.now records the actual computation time. To view existing history without recalculating or adding a record, run node scripts/cli.js history-html --out runs/UNIQUE-HISTORY.html. A prior HTML stays a snapshot; each new invocation produces an updated HTML. Keep the same local history directory across invocations; --history-dir may select a user-authorized private location. Never infer missing inputs in legacy records. Keep personal history out of Git. See [output guide](docs/WORKBENCH.md).

## Cultural requests

No project, deadline or date range is required for text reflection. Run recommend using mode cultural and a supported excerpt_id, or omit it for the default short excerpt. The curated collection contains four excerpts from two chapters. Do not suggest full-book coverage.

For user-supplied six line values use cultural.action cast, lines bottom to top with 6/7/8/9. This records supplied lines and transforms moving lines; it does not perform random coin casting, Meihua, Qimen or full 64-hexagram interpretation. Continue with the same reading object. Unsupported methods must be stated as unavailable.

## Evidence and optional features

For every HTML report include window explanations and the reference library. Read [academic evidence rules](references/academic-evidence.md) when resolving a target venue. The Agent, not the HTML, checks official author instructions, actual editorial-office timezone/hours if published, and the conference's year/track/stage deadline including any explicit AoE rule. Save target-specific facts in input.academic_evidence with status, source URL and checked date; its target must match project.target. Not found and unknown are useful outcomes. Never invent office hours from a publisher address or apply a general journal example as the target's policy.

The reference books are a catalog of eligible sources, not a claim that all divination engines are implemented. Only supported and actually calculated factors may explain a window. Meihua, Qimen and Bazi remain unavailable; do not invent favorable configurations from their book titles. Published submission studies are descriptive evidence with sample/denominator limitations; they do not alter ranking or estimate personal acceptance probabilities.

Read [sources and decisions](docs/DECISIONS.md) when explaining conventions. Classical quotations come only from data/excerpts.json; modern explanations and blessings are original. A direction is the library's daily Xi-shen direction, optionally adapted to facing, not Wenchang or Qimen. No acceptance probabilities.

The CLI exports ICS but creates no scheduled reminders. If the user requests reminders and the host offers an actual tool, use it within the user's authorization, record its returned ID/status privately, and accurately report failures and plan changes. Without a host tool say unavailable.

Use backplan for estimated preparation tasks, and the generated fixed-north direction.svg as a schematic, never a live compass. See [commands](docs/COMMANDS.md) and [release status](docs/IMPLEMENTATION.md) for supported vs deferred features.
