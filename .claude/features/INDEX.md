---
doc_type: llm
version: "6.5.5"
content_version: "6.5.4"
generated_by: "brewtools:task-board-setup"
last_updated: "2026-10-13"
---

# Features -- control-file index

> `board.md` is the **canonical** task list + status. This index just maps the control
> surfaces; it never duplicates the board.

## Control files

| File | Role |
|------|------|
| [`board.md`](board.md) | Canonical task LIST + status (dashboard: overall status, progress/todo/backlog/closed/specs tables). Every task = a board row. |
| [`PROGRESS.md`](PROGRESS.md) | SESSION progress against the board: in flight / moved / blocked / next. Five fields, overwritten in place. !=a second board -- rules in `.claude/rules/tasks.md`. |
| [`METHODOLOGY.md`](METHODOLOGY.md) | Domain-derived review/test method; each task specializes it. |
| [`ANTI-DRIFT.md`](ANTI-DRIFT.md) | Main-session task-board timer lifecycle, task-specific prompt baseline and compact tick report. |
| [`task-graph.md`](task-graph.md) | Derived active work/dependencies + latest 10 completed; older evidence remains in task records. |
| [`TRACKER.md`](TRACKER.md) | The procedure: layout, lifecycle state machine, task-file format, id convention, grooming loop. |
| [`TASK_TEMPLATE.md`](TASK_TEMPLATE.md) | Copy this to create a new task file. |
| [`INDEX.md`](INDEX.md) | This file. |

## Folders (folder name == task `status:`)

| Folder | Holds |
|--------|-------|
| [`backlog/`](backlog/) | Ungroomed inbox -- raw ideas/dumps; groomed into `todo/` or trashed. |
| [`todo/`](todo/) | Accepted, queued; real task file + filled methodology/base work/complete unique prepared prompt mandatory. |
| [`progress/`](progress/) | WIP -- a task file is MANDATORY here. |
| [`closed/`](closed/) | Done / shipped. |
| [`specs/`](specs/) | Per-task implementation/design specs, linked from a task's `links:`. Not a status folder. |
