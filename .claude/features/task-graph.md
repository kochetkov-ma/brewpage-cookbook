---
doc_type: llm
version: "6.5.5"
content_version: "6.5.4"
generated_by: "brewtools:task-board-setup"
last_updated: "2026-10-13"
---

# brewpage-cookbook active task graph

Derived from `board.md` and each task's Methodology/Notes; never a competing status authority. Rewrite after transitions/ticks: ALL unfinished top-level tasks and their work units, plus only the latest 10 completed nodes by recorded completion time (stable id tie-break). Missing completion evidence -> flag uncertainty, never classify as done. Before pruning, preserve each completed node's outcome/check evidence in its task Notes or `closed/` record; remove the graph row only. `board.md` counts include archived closed tasks; graph counts describe its retained nodes. Root/backlog ideas are not work units until accepted.

Updated: 2026-10-13
Counts: queued 1 | in-progress 0 | blocked 0 | done-recent 10 | done-archived 14

| Node | Parent task | Work / acceptance evidence | Owner | Depends on | State | Completed at / evidence |
|------|-------------|----------------------------|-------|------------|-------|-------------------------|
| EPIC-COOKBOOK-V1 | -- | Cookbook V1 -- first recipe live on brewpage.app; record lists children T-PLATFORM-SCAFFOLD, T-RECIPE-RAG-GUIDE, T-CONTENT-RAG-AUTHORING, T-RECIPE-RAG-SITE (all now in `closed/`) -- record needs reconciliation | (manager) | -- | queued | -- |
| EPIC-RAG-REVIEW-DEPLOY | -- | first live deploy round | -- | -- | done | 2026-06-15; `v0.1.1` / `317a685` (`closed/EPIC-RAG-REVIEW-DEPLOY.md`) |
| T-RECIPE-RAG-SITE | -- | RAG Guide site | -- | -- | done | 2026-06-15; `v0.1.1` / `317a685` |
| T-RECIPE-RAG-LIVE-VERIFY | EPIC-RAG-REVIEW-DEPLOY | live verify | -- | -- | done | 2026-06-15; run `27544416117`, `v0.1.1` |
| T-RECIPE-RAG-LIVE-PUBLISH | EPIC-RAG-REVIEW-DEPLOY | live publish | -- | -- | done | 2026-06-15; `v0.1.1` / `317a685` |
| T-CI-RAG-PUBLISH-WORKFLOW | EPIC-RAG-REVIEW-DEPLOY | publish workflow | -- | -- | done | 2026-06-15; `v0.1.1` / `317a685` |
| T-CONTENT-RAG-REVIEW | EPIC-RAG-REVIEW-DEPLOY | content review fixes | -- | -- | done | 2026-06-15; `d99fbab`, shipped under `v0.1.1` |
| EPIC-RAG-SEO-VERSIONING | -- | SEO + versioning hardening | -- | -- | done | 2026-06-14 (intra-day order uncertain); `v0.1.0` / `68ddcab` |
| T-CONTENT-RAG-BILINGUAL-FLIP | EPIC-RAG-SEO-VERSIONING | EN-primary bilingual flip | -- | -- | done | 2026-06-14 (intra-day order uncertain); `v0.1.0` / `68ddcab` |
| T-INTERACTIVE-RAG-LANG-URL | EPIC-RAG-SEO-VERSIONING | lang URL writeback | -- | -- | done | 2026-06-14 (intra-day order uncertain); `v0.1.0` / `68ddcab` |
| T-PLATFORM-RAG-VERSIONING | EPIC-RAG-SEO-VERSIONING | no-build versioning | -- | -- | done | 2026-06-14 (intra-day order uncertain); `v0.1.0` / `68ddcab` |

States: queued, in-progress, blocked, done. Preserve every unfinished node and dependency; retained nodes may reference archived completions by task record path. Scope changes, user corrections and newly discovered blockers update base work/dependencies rather than erase unfinished work. A tick checks the goal/acceptance gap, records deviations/corrections in the task and refreshes `PROGRESS.md` from the canonical board.
