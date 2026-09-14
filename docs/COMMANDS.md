---
type: usage-guide
status: active
created: 2026-09-14
updated: 2026-09-14
tags: [zhouyi, skill, documentation]
---

# Commands

Default Agent output: recommend with --out saves input.json, record.json and report.html plus persistent local history. Return report.html to the user. Use node scripts/cli.js history-html --out runs/history-new.html to rebuild history without a calculation. Both commands accept --history-dir PRIVATE-DIRECTORY. The HTML does not connect to AI models or require a service.

Run commands from the repository root. Requires Node 22+ and npm. Install with `npm ci --ignore-scripts`. Run `npm test` and `npm run check`.

~~~sh
node scripts/cli.js recommend examples/project.json --out runs/my-demo
node scripts/cli.js compare runs/my-demo/recommendations.json 1 2
node scripts/cli.js select runs/my-demo/recommendations.json 1 --out runs/plan-1.json
node scripts/cli.js patch examples/project.json examples/patch.json --out runs/input-2.json
node scripts/cli.js recommend runs/input-2.json --out runs/revised
node scripts/cli.js render runs/my-demo/recommendations.json en detailed
node scripts/cli.js review runs/plan-1.json runs/input-2.json --out runs/review-1.json
node scripts/cli.js recommend examples/cultural.json --out runs/reflection
node scripts/cli.js recommend examples/lines.json --out runs/lines
node scripts/cli.js backplan examples/tasks.json
node scripts/cli.js reminder-status
~~~

The examples use a frozen clock and synthetic deadline. Remove `now` for live recommendations; update the project, range and deadline. Every `--out` target must be new. A previous `npm run demo` creates runs/demo, so repeating it requires a new output path.

A submission confirmation file has `{"confirmed":true}` plus optional actual_clicked_at / server_confirmed_at / manuscript_version / receipt_ref. Use only after actual submission. The included confirmation is a synthetic format example, not a real event.

Readiness fields are supplied facts, not an automated scientific review. CLI commands do not open a submission portal, send emails, check journal sites or set external reminders. The Skill's host agent supplies those contextual facts or optional authorized capabilities.

Output: recommendations.json, report.md, report.en.md, manifest.json; project candidates also produce submission-windows.ics and direction.svg. The SVG is a fixed-north schematic. The ICS contains candidate events, no alarms. Original input is not copied into outputs; output still contains project title, conditions and source references, so keep runs private.

