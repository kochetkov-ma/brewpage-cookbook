---
doc_type: llm
version: "6.5.5"
content_version: "6.5.4"
generated_by: "brewtools:task-board-setup"
last_updated: "2026-10-13"
---

# Session anti-drift

## Ownership and lifecycle

The main session's `task-board` flow owns timers; the `task-tracker` agent owns board/task/graph reconciliation and returns scheduling actions to the main session. Never delegate timer creation to a child agent. One live timer per active top-level task IN THIS SESSION, matched by task id + absolute project root in its prompt; never adopt or delete unrelated timers. A child has a parent id in its task methodology; it has no independent timer.

On claim/resume and every transition:
1. Read shared/task methodology, current goal/scope/spec (when present), user corrections and this file. Author/refine `## Methodology`, its base work units/dependencies, and the task-specific prompt in `## Anti-drift cron` BEFORE creation. Persist task id, project root, started-at time, requested/effective cadence, timezone, scheduler id, state, last delivered tick time and tick number. Keep execution state out of generator provenance.
2. Use available `CronList`, `CronCreate`, `CronDelete` in the main session. List before creating; verify the prompt matches this task + project and record the confirmed id/state. Default fixed cadence: `0 * * * *`, recurring. Convert the user's cadence to supported five-field cron; if it cannot be represented exactly, report the actual cadence instead of silently claiming the requested interval. Invalid/ambiguous cadence -> ask once before scheduling. Respect scheduling permissions and explicit user opt-out.
3. Reuse one matching live timer; remove only this task's duplicates. On changed prompt/cadence, delete the old timer and verify absence before replacing; if deletion fails, report it and do not create a duplicate. On completion/cancellation/parking, delete this task's live timer(s), verify via `CronList`, then persist stopped state; failed deletion remains an explicit cleanup gap. Resume creates/reconciles one timer again. A persisted id alone never proves a timer is live.
4. If tools are unavailable, disabled, denied, expired, or at capacity, retain prompt/state and report the limitation; never substitute OS/cloud scheduling or claim delivery. On session resume re-list before creating. Only create/renew while the task is still active and authorized.
5. Announce: task id, effective cadence, timezone, verified scheduler id/state, first scheduled due time (if known), session scope and cancel/change controls. Scheduling is approximate, not guaranteed receipt; distinguish scheduled, fired and received. Persisted prompt/state is task evidence, not an independent durable scheduler.

## Task-specific tick prompt

At task acceptance, resolve the static task tokens below to its actual id, absolute root, task/methodology/spec paths, goal, base work and acceptance evidence; store the COMPLETE unique plain prompt in its task file. Started-at is its verified work-start time, or explicit `not started` while queued; refresh it on claim before scheduling. Report labels `local receipt time`, `tick N` and `elapsed` are evaluated on delivery, never prefilled with invented future values. Use a plain prompt, not a slash command: scheduled delivery may not execute a skill with model invocation disabled.

> Anti-drift tick for <TASK_ID> at <ABSOLUTE_PROJECT_ROOT>; goal: <GOAL>; started: <STARTED_AT>. Read <TASK_PATH>, METHODOLOGY.md, its task methodology, ANTI-DRIFT.md, board.md, task-graph.md, PROGRESS.md, <SPEC_PATHS_OR_NONE> and latest user corrections. Reconcile facts from owners/check evidence, statuses, dependencies, counts and next work; request concise updates from available in-flight agents through supported tools. Use the task-tracker owner for board/task/graph changes. Rebuild the derived task graph: keep ALL unfinished nodes and only the latest 10 completed nodes; preserve older completion evidence in task Notes/closed files before pruning. Reread/reconcile methodology; check drift against <GOAL> and <ACCEPTANCE_EVIDENCE>, name/correct deviations within authorized scope, quantify remaining work or say unknown; advance the next unblocked authorized step from <BASE_WORK_UNITS>. If complete/cancelled, have task-board stop and verify this task's timer. Increment the persisted tick number only for a delivered tick; record actual local receipt time. Report at most five short lines: 🔵 <TASK_ID> · local receipt time + timezone · tick N · elapsed actual duration; 🟢 achievements; 🔵 remaining units/acceptance + next action; 🔴 present problems/blockers/user question (omit if absent); ⚪ drift none verified OR deviation/correction OR check unavailable. Compute these report values from actual delivery/evidence; do not invent progress, timing or assurance. Full evidence goes to the task record, not chat.

Planning only: include task methodology, graph/base work, a saved task-specific prompt and an execution step to reconcile/create the session timer in the plan. Do not mutate files or schedule while plan mode forbids those actions. Read-only ticks in plan mode report proposed reconciliation; defer all writes and execution to the approved execution phase.
