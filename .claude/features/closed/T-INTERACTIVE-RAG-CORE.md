---
id: T-INTERACTIVE-RAG-CORE
title: "Shared JS ES-module lib: drilldown + timeline + process-anim + glossary + i18n + dom + a11y (+ search stub) against fixtures"
status: closed
priority: P1
owner: interactive-engineer
created: 2026-06-08
updated: 2026-06-08
tags: [interactive, prototype, es-modules, a11y]
links: []
---

## Context
The three RAG Guide variants share ONE vanilla-JS ES-module library; the variants differ only by
theme CSS, never by behaviour. This task builds that shared lib against fixtures so it can be
verified before real content lands. Modules:
- `drilldown` -- C4-style diagram drill-down.
- `timeline` -- staged timeline view.
- `process-anim` -- process animation (respect reduced-motion).
- `glossary` -- term lookup / definitions.
- `i18n` -- language switching (RU core this phase).
- `dom` -- shared DOM helpers.
- `a11y` -- accessibility helpers (focus, ARIA, reduced-motion).
- `search` stub -- minimal client-side search placeholder only (full search out-of-scope).

Built against fixtures matching the scaffold data contracts (`diagram-data.js`,
`glossary.json`, `worked-example.json`, `nav.json`).

## Acceptance
- [ ] ES-module lib provides: `drilldown`, `timeline`, `process-anim`, `glossary`, `i18n`, `dom`, `a11y`, and a `search` stub.
- [ ] Each module verified against fixtures shaped like the scaffold data contracts.
- [ ] `process-anim` + interactions respect `prefers-reduced-motion`.
- [ ] a11y module covers focus management + ARIA; no console errors.
- [ ] Lib is theme-agnostic (no hard-coded colors; behaviour identical across ink/paper/blueprint).
- [ ] Runs as static ES modules opened directly (no build step).

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-08: Created for the 3-theme prototype/compare phase.
- BLOCKED BY `T-PLATFORM-SCAFFOLD` (needs the module boundaries + data-contract schemas).
- BLOCKS `T-RECIPE-RAG-GUIDE` (variant assembly needs this lib to render diagram/worked-example/glossary).
- Prototype phase: nothing published, no release tag this phase.
- 2026-06-08: CLOSED (R2 bookend). DONE: shared JS lib built + browser-verified --
  `dom/a11y/i18n/drilldown/timeline/process-anim/glossary/search` + page glue; 0 console errors.
- Prototype phase -- no release tag, nothing published to brewpage.app.
