# TRACKER -- BrewPage Cookbook task/feature tracker procedure

> Canonical procedure for the `.claude/features/` task board. `board.md` = single source of truth for task LIST + status. A task file (when present) = source of truth for that task's DETAIL. Read this before touching any task.

[DICT: WIP=work in progress, GROOM=backlog triage, RECIPE=a published cookbook recipe]

## 1. What this is

Lightweight file-based Kanban for brewpage-cookbook. No external tool. Everything lives in `.claude/features/` and is versioned with the repo. There is NO root `TODO.md` -- never create one. `.claude/features/STATUS.md` = prose ship-state narrative; board links to it, not duplicate.

Note: the repo-root `features/` directory no longer exists. Per-recipe content *plans* now live as per-task specs in `.claude/features/specs/<TASK-ID>.md` (e.g. `specs/T-RECIPE-RAG-GUIDE.md`), authored by the cookbook-author agent and linked from the task card.

## 2. Layout

```
.claude/features/
  board.md            <- DASHBOARD: overall status + index table of EVERY task (canonical list)
  TRACKER.md          <- this procedure
  TASK_TEMPLATE.md    <- copy this to create a new task file
  STATUS.md           <- prose ship-state narrative (linked from board, not duplicated)
  backlog/            <- INBOX: ungroomed junk/ideas/dumps; not yet real tasks
  todo/               <- accepted tasks, queued, not started (file optional here)
  progress/           <- WIP; task file is MANDATORY here
  closed/             <- done/shipped (file optional; keep notable ones)
  specs/              <- per-task implementation/design specs (linked from task `links:`)
```

Folder name == task status. Task file always lives in folder matching its status.

## 3. Lifecycle (state machine)

```
            groom (promote)        pick up            ship
 backlog  ------------------>  todo --------> progress --------> closed
   |  \                          ^               |
   |   \  groom (trash)          |  re-queue     |  blocked/parked
   |    -----> [deleted]         +---------------+
   |
   +--> groom (merge into existing task)
```

| Transition | Action |
|------------|--------|
| backlog -> todo | groom: real, scoped task. Give id, create task file (or board row), move/author under `todo/` |
| backlog -> deleted | groom: noise, done, or out of scope. Delete backlog file. Note nothing |
| backlog -> merge | groom: duplicates/extends existing task. Fold notes, delete backlog file |
| todo -> progress | pick up: MOVE file into `progress/` (create from template if table-only), set `status: progress`, `owner`, `updated` |
| progress -> closed | ship: MOVE file into `closed/`, set `status: closed`, add outcome + version/commit |
| progress -> todo | re-queue: MOVE back, set `status: todo`, note why parked |

Always update `board.md` in the SAME change as any transition. Board lags reality = board is wrong.

## 4. Task file format

Copy `TASK_TEMPLATE.md`. Frontmatter required; body sections recommended. English only.

```markdown
---
id: T-RECIPE-RAG-GUIDE          # unique; see id convention below
title: Build the first recipe -- RAG Guide
status: progress                # backlog | todo | progress | closed (MUST match folder)
priority: P1                    # P1 (now) | P2 (soon) | P3 (nice-to-have)
owner: cookbook-author          # agent name or person; empty in todo/backlog
created: 2026-06-04
updated: 2026-06-04
tags: [recipe, rag]
links:
  - ../recipes/rag-guide.md
  - ../specs/T-RECIPE-RAG-GUIDE.md
---

## Context
Why this exists, what problem it solves.

## Acceptance
- [ ] concrete, checkable outcome 1
- [ ] concrete, checkable outcome 2

## Notes
Running log: decisions, blockers, links to PRs/commits/reports.
```

Invariants:
- `status` FM MUST equal the folder. On any move, change both.
- Task in `progress/` MUST have a file. In `todo/`/`backlog/` a file is optional.
- Closing: keep `updated` current, record closing version (`vX.Y.Z`, unprefixed) + commit SHA in `## Notes`.

## 5. ID convention

Id = UPPER-KEBAB, short, stable. Once minted never changes (it is the filename stem and the board key).

Format: `<PREFIX>-<DOMAIN>-<SLUG>`.

| Prefix | Use |
|--------|-----|
| `T-*`    | recipe / feature task |
| `BUG-*`  | defect |
| `M-*`    | maintenance / refactor / tech-debt |
| `EPIC-*` | umbrella over several tasks |

First kebab segment after the prefix = cookbook domain, one of: `RECIPE`, `PLATFORM`, `CONTENT`, `INTERACTIVE`, `CI`, `DOCS`, `SEO`.

| Domain | Scope |
|--------|-------|
| `RECIPE`      | a specific published recipe (content + interactivity for one guide) |
| `PLATFORM`    | site scaffold / static publishing (plain HTML, vanilla JS, hand-written CSS) |
| `CONTENT`     | cross-recipe editorial: voice, style, shared copy, index |
| `INTERACTIVE` | reusable interactive components (diagram drill-down, mini-games, calculators, search UI) |
| `CI`          | build + publish pipeline to brewpage.app (action / CLI / REST) |
| `DOCS`        | repo docs (CLAUDE.md, README, docs/, conventions) |
| `SEO`         | discoverability: metadata, sitemap, llms.txt, cross-links, listings |

Examples: `T-PLATFORM-SCAFFOLD`, `T-RECIPE-RAG-GUIDE`, `M-CONTENT-VOICE-GUIDE`, `EPIC-COOKBOOK-V1`.

## 6. The board (`board.md`)

`board.md` = canonical LIST. Holds:
1. **Overall status** -- release line, headline counts (`backlog N | todo N | progress N | closed N | specs N`), current focus (1-3 lines).
2. **Progress (WIP) table** -- every WIP task.
3. **Todo (queued) table** -- every queued task (incl. rows with no file yet).
4. **Backlog** -- count + pointer to `backlog/` (do not enumerate noise here).
5. **Closed (recent)** -- last N notable closes; older ones live as files in `closed/` only.

Progress/Todo table columns: `id | title | priority | owner | file`. The `file` cell links the task file or says `--` when table-only.
Closed table columns: `id | title | closed in (vX.Y.Z) | file`.

Rule: if a task exists anywhere (file or row), it is on the board. Board is regenerated/edited by hand on every transition. Keep it terse.

## 7. Backlog grooming

`backlog/` = dumping ground -- raw ideas, pasted error logs, "look into X later", half-thoughts. Drop anything there fast; do not gate it.

Groom on regular cadence (start of work session, or when backlog > ~10 items):

1. Read each `backlog/*.md`.
2. Decide per §3: **promote** to `todo` (mint id, create file/row, update board), **merge** into existing task, or **trash** (delete).
3. Never leave a groomed item in `backlog/`. After grooming, `backlog/` holds only un-triaged items.
4. Log nothing for trashed junk; for promoted items the new task file carries the context.

The `task-tracker` agent knows this loop -- invoke it to run a groom pass.

## 8. Working procedure (per session)

1. Open `board.md` -> read overall status + progress table.
2. (Optional) groom `backlog/` per §7.
3. Pick a `todo` task (respect priority). Move to `progress/`, set owner, update board.
4. Do the work. Keep `## Notes` in the task file current.
5. On done: ship via the cookbook release flow (content-only PRs ship on merge; a `vX.Y.Z` unprefixed tag marks a curated milestone such as a complete recipe going live). Move file to `closed/`, record closing version + commit SHA in `## Notes`, update board counts + focus, and touch `STATUS.md`.
6. If new work surfaces mid-task, drop it in `backlog/` (do not derail).

## 9. Bookend rule (claim / close)

Every multi-step feature bookended by the `task-tracker` agent:

- **FIRST sub-task -> claim.** Move task file `todo/ -> progress/`, set `status: progress`, `owner`, bump `updated`, move board row Todo->Progress, fix counts.
- **LAST sub-task -> reconcile/close.** Move task file `progress/ -> closed/`, set `status: closed`, append release tag `vX.Y.Z` (unprefixed) + commit SHA to `## Notes`, move board row to Closed with `closed in` version, fix counts + current focus, touch `STATUS.md`.

## 10. Relationship to other surfaces

| Surface | Role |
|---------|------|
| `.claude/features/board.md` | canonical task list + status (THIS system) |
| root `TODO.md` | does NOT exist -- never create one |
| `.claude/features/STATUS.md` | prose ship-state narrative; board links to it, no duplication |
| `.claude/features/specs/<TASK-ID>.md` | per-recipe content plans (CA-authored), linked from the task card; not the board list |
| `.claude/features/specs/*` | per-task implementation/design specs (linked from task `links:`) |
| `.claude/reports/` | generated analysis/report artifacts |

## 11. Ownership & related rules

- Tags are UNPREFIXED `vX.Y.Z` (cookbook + BP ecosystem convention) -- e.g. `v0.1.0`, `v1.0.0`.
- !=hand-edit `.claude/features/**` ad-hoc for non-trivial board work (groom passes, bulk transitions). Delegate to `task-tracker` agent so board + frontmatter + folder stay in lockstep.
- See `.claude/rules/tasks.md` for condensed task-authoring rules.
- When starting/finishing/parking a task, follow §3 + §8 + §9 and keep the board in sync.
