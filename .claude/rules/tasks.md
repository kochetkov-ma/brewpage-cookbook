---
paths:
  - ".claude/features/**"
version: "6.5.5"
content_version: "6.5.4"
generated_by: "brewtools:task-board-setup"
last_updated: "2026-10-13"
---

[DICT: GROOM=backlog triage, FM=frontmatter, TT=task-tracker agent]

# Task tracker rules

Canonical task LIST: `.claude/features/board.md`. Task files: `.claude/features/{backlog,todo,progress,closed}/`. New file = copy `.claude/features/TASK_TEMPLATE.md`. Full procedure: `.claude/features/TRACKER.md`.

| # | Rule |
|---|------|
| 1 | `board.md` = canonical LIST + status. Update in SAME change as ANY transition -- lagging board = wrong board |
| 2 | Folder == `status:` FM. File lives in `backlog/`\|`todo/`\|`progress/`\|`closed/`; FM `status:` MUST match folder. On move -> change BOTH |
| 3 | Lifecycle: `backlog -> todo -> progress -> closed` (trash/merge only from `backlog`). Task in `progress/` MUST have a file from `TASK_TEMPLATE.md` |
| 4 | IDs = UPPER-KEBAB, never change once minted. Prefix: `T-` (recipe/feature) \| `BUG-` (defect) \| `M-` (maintenance/refactor) \| `EPIC-` (umbrella) |
| 5 | First kebab segment = cookbook domain {RECIPE, PLATFORM, CONTENT, INTERACTIVE, CI, DOCS, SEO}. e.g. `T-PLATFORM-SCAFFOLD`, `T-RECIPE-RAG-GUIDE`, `M-CONTENT-VOICE-GUIDE`, `EPIC-COOKBOOK-V1` |
| 6 | Required FM fields: `id, title, status, priority, owner, created, updated` (`tags, links` optional) |
| 7 | `backlog/` = ungated inbox. GROOM loop: promote -> `todo`, merge dupes, or trash. !=leave groomed items behind |
| 8 | TT bookends EVERY feature: FIRST sub-task claims `todo -> progress` (set owner + `updated`, move board row, fix counts); LAST sub-task reconciles `board.md` + `STATUS.md` (move to `closed`, record tag + SHA, fix counts/focus) |
| 9 | This repo has NO root `TODO.md` -- NEVER invent one. Ship-state prose = `.claude/features/STATUS.md` (link it, !=duplicate). Per-recipe content plans live as per-task specs in `.claude/features/specs/<TASK-ID>.md` (CA-authored), linked from the task card; there is NO repo-root `features/` directory |
| 10 | English only. Closing: record release tag `vX.Y.Z` (UNPREFIXED) + commit SHA in `## Notes` |
| 11 | After closing tasks, COMMIT the `.claude/features/**` change -- closure is not done until committed |
| 12 | Non-trivial board work (GROOM pass, bulk transitions, hand-edits) -> delegate to `TT` agent; !=hand-edit ad-hoc |

## Session progress (`.claude/features/PROGRESS.md`)

`board.md` owns the task LIST + status; `PROGRESS.md` owns what THIS SESSION did about it -- !=a second board (no task table), !=per-task detail (task's `## Notes`). Five fields, overwritten in place, never appended: `Updated`, `In flight`, `Moved since last update`, `Blocked`, `Next`.

| # | Rule |
|---|------|
| P1 | It ALWAYS exists -- created at board init. Missing -> recreate it from `board.md` before anything else |
| P2 | The MAIN SESSION refreshes it in the SAME change as any transition and before ending any turn that moved work -- else the session cannot say where it is |
| P3 | Plan mode: a plan that touches any task MUST carry an explicit final step `update .claude/features/PROGRESS.md`; without it the plan is incomplete |
| P4 | `task-tracker` WATCHES it: every run it rewrites the five fields from `board.md` + the task files and reports staleness in one line. It cannot run a skill for you -- act on its `NEXT:` line yourself |

## Methodology and anti-drift

At EVERY task start, read `.claude/features/METHODOLOGY.md` + `ANTI-DRIFT.md`; derive task Methodology from the domain (review strategy, reliable checks, base work/owners/dependencies, parent id). The isolated tracker claims/reconciles files; then the main session, which alone owns timer calls, runs `task-board` to create/reconcile one unique session timer per active top-level task (hourly unless the user overrides or opts out) and announces the verified schedule. Save the task's COMPLETE tick prompt/runtime state in its task file before creation. Missing tools are reported, never disguised as scheduling.

Each delivered tick rereads methodology/anti-drift, task/spec/goal/user corrections; requests owner evidence; reconciles statuses/dependencies/counts and rebuilds derived `task-graph.md` (ALL unfinished nodes + latest 10 done, older evidence archived first); forces a goal/acceptance drift check, corrects deviations within scope, advances unblocked work; reports in at most five compact lines, only 🟢🔵🔴⚪: local time, tick number, elapsed, achievements, remaining/next, present problems/blockers/questions. Completion/cancellation/parking -> main-session task-board deletes the timer and verifies absence. Runtime contract: `ANTI-DRIFT.md`.

Plan mode (with P3): include task methodology, graph/base work, saved prompt and an execution step to reconcile/create its timer; no file writes or timer creation/deletion until execution is allowed. Ticks delivered during planning report proposed changes only.
