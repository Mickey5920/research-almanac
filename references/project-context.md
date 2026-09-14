---
type: skill-reference
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, skill, documentation]
---

# Project context

Read only the specified project. Record title, stage, manuscript version, conditions, earliest ready time, availability and the applicable deadline. The deterministic CLI consumes structured JSON; semantic extraction is performed by the agent, not an automatic vault crawler.

Use project.source_ids for short relative file/section references; do not include machine-specific controlled paths or private contents. Check current task notes for author approval, figures, supplements, response letter and final PDF. Absence of a task is not evidence of completion.

- ready: explicit completion information and no known blocker.
- conditional: remaining tasks/approval with a possible schedule.
- unknown: insufficient evidence; stays conditional in recommendations.
- blocked: necessary conditions cannot be met in the range.

Select the current stage's deadline before calling the engine. Multiple stage deadlines are not automatically inferred. Unknown journal deadline is not the same as a journal explicitly having none. Source verification is an agent responsibility; the CLI does not browse journal websites.

Natural-language preferences use only declared input fields. A user requesting an unsupported tradition should receive the documented capability limitation, not a fabricated plan. Birth information is not needed or accepted by this release.

