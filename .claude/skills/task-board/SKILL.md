---
name: task-board
description: "Views and updates this repo's file-based task board at .claude/features/. Triggers: show the board, task board, board status, what's in progress, add a task, create task, move task to progress, close task, dump to backlog, groom backlog."
argument-hint: "[prompt] [view | add | move | backlog | groom]"
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, Agent, CronCreate, CronList, CronDelete]
doc_type: llm
version: "6.5.5"
content_version: "6.5.4"
generated_by: "brewtools:task-board-setup"
last_updated: "2026-10-13"
---

# Task Board (dashboard)

On-demand entry point for the file-based Kanban under `.claude/features/`.
Authoritative procedure: `.claude/features/TRACKER.md`. This skill mirrors it -- do not invent rules.

## Prompt contract

`$ARGUMENTS` is one free-form prompt (English); `view`/`add`/`move`/`backlog`/`groom` and any flags
may sit anywhere in it.

| Mode | EN keywords | RU keywords | Mutates? |
|------|-------------|-------------|----------|
| `view` (default) | *(empty)*, show the board, task board, board status, what's in progress | покажи доску, статус доски, что в работе | no |
| `add` | add a task, create task, new task | добавь задачу, создай задачу, новая задача | yes |
| `move` | move task to progress, close task, pick up, ship it | перемести в работу, возьми в работу, закрой задачу | yes |
| `backlog` | dump to backlog, backlog it, look into later | закинь в бэклог, в бэклог | yes |
| `groom` | groom backlog, groom the backlog, triage backlog | разбери бэклог, приведи бэклог в порядок | yes |

1. Mode: an explicit mode token wins outright; else the most distinct whole-word keyword hits (table
   above). Tie with `view` -> `view` (read-only); of two mutating modes -> the keyword that comes
   first in the prompt. No hit or empty -> `view` (the documented default).
2. Scope: prose that is not a mode is still input: take the task id, folder or row it names before
   entering the flow (VIEW/ADD/MOVE/BACKLOG/GROOM below) -- never guess the first word as a mode.
3. Ask: ONE `AskUserQuestion` before any write, only for outcome-changing ambiguity (which task,
   which folder). A read-only run asks nothing.

Print once, before the first action (labels literal ASCII, values in English):

```
PLAN — task-board
INPUT:  <arguments verbatim, or "(empty)">
MODE:   <resolved> -- <explicit | matched keyword: X | default>
SCOPE:  <task id / row / folder touched, or "read-only view">
DO:     <2-5 imperative bullets>
RESULT: <board.md row, task file, or the view/report the user ends up holding>
```

## Invariants (always hold)

- **Folder == status.** A task file lives in `todo/` | `progress/` | `closed/` (or `backlog/`); its `status:` frontmatter MUST equal the folder. On a move, change both.
- **Board is canonical and never lags.** Edit `board.md` in the SAME change as any transition. A lagging board is a wrong board.
- **Ids never change.** UPPER-KEBAB, short, stable -- the filename stem and the board key.
- **Every accepted todo/progress task MUST have a real file** with filled Methodology/base work and a unique COMPLETE saved cron prompt. Only raw unaccepted backlog ideas may remain table-only. A queued prompt is prepared intent, never a live schedule.
- **English only.** Closing records release tag `vX.Y.Z` (UNPREFIXED) + commit SHA in `## Notes`.
- **`PROGRESS.md` tracks the SESSION, not the tasks.** Refresh `.claude/features/PROGRESS.md` in the SAME change as any transition -- five fields: `Updated`, `In flight`, `Moved since last update`, `Blocked`, `Next`, overwritten in place. !=a second board; rules in `.claude/rules/tasks.md`.

Layout under `.claude/features/`: `board.md` (dashboard), `PROGRESS.md` (session progress), `TRACKER.md` (procedure), `METHODOLOGY.md`, `ANTI-DRIFT.md` (methodology/timer controls), `task-graph.md` (derived active work), `TASK_TEMPLATE.md`, `INDEX.md` (control-file index), `backlog/` (ungated inbox), `todo/`, `progress/`, `closed/`, `specs/`. Rules: `.claude/rules/tasks.md`.

## Methodology and session timer

Read `METHODOLOGY.md` + `ANTI-DRIFT.md` before ADD/GROOM promotion/MOVE or a tick; accepting a task requires its filled Methodology (goal/acceptance, domain review/tests or explicit gaps, base work units/dependencies/owners, parent id) and complete unique Anti-drift cron prompt, with every token resolved. Hourly default; user cadence overrides it. Queued tasks store state `prepared` and no live scheduler id; only active top-level claims start timers. The MAIN SESSION running this skill owns timer calls; `task-tracker` owns file reconciliation and returns `CRON:` actions. After delegated results, execute those actions here BEFORE any mandatory final `NEXT:` redirect. On direct ADD/MOVE, refresh derived graph/PROGRESS and reconcile timers after a successful transition; never stop a timer for a refused close.

Before creating/resuming, list and match by task id + absolute project root; reuse one matching timer, reconcile only this task's duplicates, verify deletion before replacing. Create one recurring session timer per active top-level task, not child work unit; persist complete prompt/runtime state in its task file and announce effective cadence, timezone, verified id/state, known due time, session limits and stop/change controls. Completion/cancellation/parking stops this task's timers and verifies absence. Missing/denied cron tools -> save intent and report unavailable; never invent delivery or a durable fallback. Details and tick/report format: `ANTI-DRIFT.md`.

VIEW remains read-only: show missing/stale timer/methodology/graph state without scheduling. In plan mode read/report only; include methodology, saved prompt, graph and timer reconciliation as execution steps, defer writes/timers. A delivered tick runs the saved plain prompt: reread/reconcile, force goal/acceptance drift checks and advance authorized work, then at most five compact lines with local time, tick number, elapsed, achievements, remaining/next, blockers/questions and drift verdict using only 🟢🔵🔴⚪. Preserve all unfinished graph nodes + latest 10 completed; archive completion evidence before pruning rows.

## Flows

### 1. VIEW

1. Read `.claude/features/board.md` + `PROGRESS.md`.
2. Summarize: overall status (release line), counts (backlog | todo | progress | closed), current focus (1-3 lines), then the Progress (WIP) and Todo tables. Do not enumerate backlog noise. Close with `PROGRESS.md`'s `Blocked` / `Next` only -- `In flight` / `Moved` are already in the tables above; if its `Updated` predates the newest task `updated:`, report it stale and recommend reconciliation (VIEW does not write).

### 2. ADD task

1. Mint an UPPER-KEBAB id by prefix: `T-*` feature, `BUG-*` defect, `M-*` maintenance, `EPIC-*` umbrella. First kebab segment = a repo domain (see TRACKER.md id convention).
2. ALWAYS create `<ID>.md` from `TASK_TEMPLATE.md` in the accepted target folder (usually `todo/`); table-only acceptance is prohibited.
3. Fill frontmatter: `id`, `title`, `status` (== folder), `priority`, `owner`, dates, tags/links; fill Context/Acceptance, domain review/checks, bounded base units/owners/dependencies and COMPLETE unique saved prompt with actual id/root/paths/goal/base work/acceptance. No unresolved template guidance/tokens. Queued cron state `prepared`, scheduler id empty; scheduling starts only on active top-level claim.
4. Add its actual file link to `board.md` (`id | title | priority | owner | file`); sync graph/PROGRESS in the same change. A missing record/method/base work/prompt means acceptance is incomplete: finish preparation before reporting it accepted.

### 3. MOVE / TRANSITION

`todo -> progress` (pick up) | `progress -> closed` (ship) | `progress -> todo` (re-queue/park).

1. Verify the accepted record is complete before moving; repair legacy row-only or incomplete tasks through ADD preparation requirements without discarding decisions. Refresh method/prompt for current corrections, then move its file between folders.
2. Set `status:` to match the new folder; set `owner` (on pick-up); set `updated` to today.
3. On `-> closed`: add a one-line outcome + release tag `vX.Y.Z` (UNPREFIXED) + commit SHA in `## Notes`.
4. Update `board.md` in the SAME change: move the row between tables, refresh counts and current focus. Refresh `PROGRESS.md`'s five fields too. On `-> closed` with the `progress` count now `0` AND no `.claude/skills/task-spec/` in this repo, add ONE line: `NEXT: run /brewtools:task-board-setup upgrade <repo path>` (it retrofits the spec + design layer). Spec layer already present -> say nothing.

### 4. BACKLOG dump

Drop an unclear/raw item into `.claude/features/backlog/<slug>.md` -- raw idea, pasted log, "look into X later". No format gate. It is NOT a task yet; it becomes one (or is trashed) during grooming.

### 5. GROOM backlog

1. List items through Bash: `find .claude/features/backlog -maxdepth 1 -name '*.md' -not -name README.md` (an unmatched shell glob aborts under zsh).
2. For each item decide its fate: **promote** -> real `todo` task (run flow 2), **merge** -> fold into an existing task's `## Notes`, or **trash** -> delete the file.
3. Delete the backlog file once handled. Never leave a groomed item behind.
4. Refresh the board backlog count.

## Delegation

A big task handed to one agent cannot be observed or corrected and usually drifts off-target, so one subagent = ONE bounded unit — ONE board pass (one groom run, or one status folder's transitions), ~<=5 files, ~<=10 steps. Bigger MUST be split into N tasks, all spawned in ONE message.

Every spawn brief carries six labeled fields, since a subagent starts with an empty context: GOAL (task + why), ROLE (owns, must not touch), SCOPE (paths/commands in and out), CONTEXT (done, by whom, in parallel), CONSUMER (who uses the result + its shape), DONE (acceptance + return: verdict first, evidence, bounded; long output to a file, path returned).

A bare one-line task is never enough. Simple single-task view/add/move: do it directly here. For non-trivial passes (bulk transitions, large groom, migrating many rows) delegate to the `task-tracker` agent rather than hand-editing:

```
Agent(subagent_type="task-tracker", prompt="
GOAL: keep .claude/features/ truthful — a lagging board.md is a wrong board, and every reader
  (this skill's VIEW flow, any status report) trusts it over the files.
ROLE: you own this groom pass. Promote / merge / trash each backlog item, then sync board.md,
  task-graph.md and PROGRESS.md from the task files and existing control contracts.
  Do NOT touch source dirs, do NOT invent tasks no backlog item supports, do NOT rename existing ids.
SCOPE: in — .claude/features/backlog/*.md (skip README.md), the task files you promote into todo/,
  board.md, task-graph.md and PROGRESS.md. Out — progress/, closed/, specs/, source code, CLAUDE.md.
CONTEXT: the authoritative procedure is .claude/features/TRACKER.md and the id convention is in
  TASK_TEMPLATE.md — read both first, do not reinvent them. Ids are UPPER-KEBAB and never change.
  Nothing else is editing the board right now; the current counts in board.md are the pre-groom ones.
CONSUMER: the VIEW flow reads board.md counts + tables next, and folder == status: a file whose
  status: frontmatter disagrees with its folder, or a task missing from board.md, is invisible.
DONE: every backlog file handled (promoted / merged / trashed — none left behind); board.md tables,
  counts, backlog count, task-graph.md and PROGRESS.md refreshed in the SAME change. Report a table: promoted ids | merged-into
  ids | trashed slugs, plus the new counts.
")
```

## Guards

| Condition | Response |
|-----------|----------|
| an argument that matches no mode keyword and names no task/row/folder is still read as a mode | defect -- it is prose: extract the target from it or ask, never guess |
| the `PLAN` block is missing, or is printed after the first file write | defect -- print it once, right after mode resolution, before entering the flow |
