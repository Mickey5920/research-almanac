---
type: skill-reference
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, skill, documentation]
---

# Plan lifecycle

select creates a stable plan_id and snapshot. review never chooses another candidate. It checks expiry and supplied current inputs, annotating selected / needs_review / invalidated. Review with no input cannot certify readiness. Manuscript changes trigger review. Changed click time is proposed separately and requires re-selection.

Keep prior files. CLI --out refuses an existing destination. A new user selection is a separate plan; the agent should record its relationship to the previous plan in a private project note (automatic cross-plan supersession is not implemented). Unknown preparation conditions are never silently marked done.

submitted requires a JSON boolean confirmed=true. Omit unknown actual times. Repeating the same confirmation is idempotent; corrections append history. Existing scheduled host reminders become update_pending; the agent must use the real provider to update/cancel them, never claim local JSON changed an external service.

Book depth changes are rendering only. This release has one ruleset and one transcribed source collection; unsupported editions/schools are roadmap items. Per-project preferences can be kept in the input JSON, with explicit user scope. No account or shared cross-project profile is created.

