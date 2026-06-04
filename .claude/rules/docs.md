---
paths: ["**/*"]
---

[DICT: TT=task-tracker agent]

# Docs & artifact hygiene

| Rule | Detail |
|------|--------|
| One doc per topic | EDIT the topic file in place; !=`topic-v2` / `topic-final` / `topic-new` ∵ forks source of truth |
| LLM-friendly + dense | terse table/bullet style, no filler prose; write for fast model reads |
| Run artifacts | sweep / QA / report output -> `.claude/reports/<YYYYMMDD-HHMMSS>_<name>/` |
| Screenshots | -> `.claude/reports/<YYYYMMDD-HHMMSS>_<name>/screenshots/`; !=drop `*.png` at repo root |
| Task board | board / status changes go through `TT` agent; !=hand-edit `.claude/features/**` ∵ board + folder drift |
| New doc | register it in the relevant index/README rather than orphan it |

Timestamp fmt: `YYYYMMDD-HHMMSS` (e.g. `20260604-150052_seo-audit`).
