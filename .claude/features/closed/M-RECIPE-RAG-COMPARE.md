---
id: M-RECIPE-RAG-COMPARE
title: "Launch 3 variants, QA, write compare report for the user to choose"
status: closed
priority: P1
owner: brewcode:tester
created: 2026-06-08
updated: 2026-06-08
tags: [recipe, qa, compare, prototype]
links: []
---

## Context
Final step of the 3-theme prototype/compare phase: launch all three assembled variants
(ink / paper / blueprint), run QA across them, and produce a compare report so the user can pick
one direction. No variant is published this phase; the report is the deliverable.

## Acceptance
- [ ] All three variants launched and exercised.
- [ ] QA passes: no console errors; `prefers-reduced-motion` respected; a11y (focus + ARIA) sound; ASCII-only content; mandatory cross-links present.
- [ ] Compare report written (per-variant strengths/tradeoffs + a recommendation) for the user to choose.
- [ ] Report saved under `.claude/reports/<YYYYMMDD-HHMMSS>_rag-variant-compare/`.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-08: Created for the 3-theme prototype/compare phase.
- BLOCKED BY `T-RECIPE-RAG-GUIDE` (needs the three variants assembled before QA + compare).
- Prototype phase: nothing published, no release tag this phase.
- 2026-06-08: CLOSED (R2 bookend). DONE: QA passed 7/8 (Lighthouse qualitative); compare report
  at `.claude/reports/20260608-120000_rag-theme-compare/`. BUG-1 (cross-variant nav) was found
  and already fixed.
- Prototype phase -- no release tag, nothing published to brewpage.app.
