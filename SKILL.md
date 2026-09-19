---
name: research-almanac
description: Build a weekly research almanac and project work plan across six disciplines, with date-specific workflows, sourced Yijing passages and an offline bilingual HTML report. Add precise Zhouyi paper submission windows as optional support, or handle an explicit submission-only request with the existing planner. Use for research-week planning, 科研黄历 and 投稿择时, not predictions of scientific or publication success.
metadata:
  type: agent-skill
  status: implemented-with-limits
  created: "2026-09-14"
  updated: "2026-09-19"
---

# 科研黄历 · Research Almanac

The weekly research almanac is the primary experience; submission timing is available as a companion workflow. The product is 科研黄历 / Research Almanac, containing Research Planning (科研安排) and Submission Timing (投稿择日). The invocation name and portable folder are research-almanac. Keep one private history store when upgrading from the previous name. Use the actual local scripts. Install missing dependencies with `npm ci --ignore-scripts` from this folder. Never put private project inputs into committed examples.

## Choose the route

- Research almanac, next week's research, weekly work plan, or a combined research/submission request: use `weekly` and [the integration guide](docs/RESEARCH-ALMANAC.md).
- An explicit request only for paper submission dates, directions, plan selection or review: keep `recommend` and the [submission workflow](references/submission-workflow.md).
- A classical-text or supplied-six-line request without scheduling: use the existing cultural mode in the submission workflow; a project is not required.

Do not make the user choose a second Skill or re-enter data in a web form. The conversation is the input surface; HTML only displays saved local records.

## Weekly workflow

1. Resolve the known IANA timezone and desired week. A general almanac needs no manuscript, birthday or journal. Read only a user-specified project's relevant overview, current tasks, constraints and manuscript state when personalization is requested. Preserve sources and distinguish supplied or verified facts from assumptions. If several projects are equally plausible, clarify which one.
2. Prepare JSON matching [weekly input](schemas/weekly-input.schema.json). Start from [general](examples/weekly.json) or [project](examples/weekly-project.json) examples but remove their fixed `now`, simulated tasks and deadline for real use. Omit `week_start` for the next local Monday–Sunday; a supplied `week_start` must be a Monday. Select one discipline or `all`.
3. Map actual tasks to stable ids, estimated minutes, dependencies, earliest start, deadline and expected output. Keep unknown estimates missing, not invented. Preserve confirmed events and unavailable intervals. Include source references for project facts. Do not claim estimated tasks have been completed.
4. Add `submission` only if there is a real submission request. It uses the existing submission input contract and must match the weekly timezone. Use `submission_task_ids` only for known required preparation tasks. The weekly engine uses the same week and computation time, and subtracts research tasks before calling the old submission engine. Readiness, author approval, deadlines and verified academic evidence remain mandatory constraints.
5. Run `node scripts/cli.js weekly INPUT.json --out runs/UNIQUE-RUN`. This saves `input.json`, `weekly.json`, a paired `record.json`, bilingual Markdown and the primary `report.html`. When submission is included it also saves `submission.json` and `submission.html`; feasible candidates produce an ICS file without reminders.
6. Return an absolute clickable link to `report.html` and open the file viewer if available. Briefly state the actual date range and any tasks requiring more time or missing estimates. The main page covers all six disciplines with daily/weekly views; user tasks are a separate saved schedule. Submission details are folded beneath it.
7. For adjustments, copy the previous weekly input into a new private file, update only requested facts, remove the stale `now`, and run again to a new directory. Re-resolve the target week when the user changes it. Never overwrite a previous input, result or historical record. Render stored Markdown in another language with `render`, without recomputing the schedule.

## Priority and interpretation

玄学提供仪式感，科学提供优先级。

Confirmed clinical care, continuous experiments, field windows, appointments, task dependencies and hard deadlines take priority. Weekly scheduling is a conservative sequential single-person plan, not a guaranteed optimal resource allocation. Defaults are 20% daily buffer, three tasks per day and workday availability of 09:00–12:00 and 14:00–17:00; they are editable planning choices, not empirical claims. Explicit availability overrides the holiday default. Unknown durations stay in the unplanned list.

The bundled 2026 mainland China holiday table has an official source. Unknown years use a labelled weekday fallback. Other timezones retain practical local scheduling without invented Chinese-calendar facts. Never infer foreign editorial-office closures from local holidays.

Daily rhythms are varied workflow suggestions saved with the result, not auspicious appointments. Six-discipline suggestions cover humanities, social sciences, natural sciences, engineering, agriculture and medical research. No arbitrary luck scores, fabricated Qimen charts or medical treatment advice. Reference existing protocols for fieldwork, clinical commitments and experiments.

Classical passages and explanations come from `data/bagua.json`; show the original, chapter, plain-language meaning and a separately identifiable modern reflection. Daily passages are chosen by workflow theme, not computed divination. Submission-facing trigrams continue to use the old direction mapping. For submission evidence and personal zodiac preferences, follow [academic rules](references/academic-evidence.md) and the full submission workflow. No universal weekend penalty or acceptance probability.

## Saved local reports

Keep the same private `.local-data/history/` across invocations; `--history-dir` can select another user-authorized private location. `weekly` and `recommend` both save paired input/result records. Old records without `record_type` remain submission records and are not rewritten. A mixed report lets the user switch between almanacs and original submission reports. The old form workbench remains submission-only; normal use requires no service.

`node scripts/cli.js history-html --out runs/UNIQUE-HISTORY.html` re-exports existing history without calculation or a new record. A prior HTML stays a snapshot. CSS, images, translations and saved records are embedded. No AI client, key, remote asset requests or input forms are needed. Language and view changes never alter raw records. Keep user runs and history out of Git and public screenshots.

No reminder, message, actual submission or social-media publication is performed by generating a plan. Use separate available host tools only if the user asks for those actions. See [commands](docs/COMMANDS.md), [current implementation](docs/IMPLEMENTATION.md) and [output guide](docs/WORKBENCH.md).
