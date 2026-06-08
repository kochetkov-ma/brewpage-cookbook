---
paths:
  - ".claude/features/**"
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
