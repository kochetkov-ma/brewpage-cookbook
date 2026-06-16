---
id: M-DOCS-SITE-ARCH
title: "Record site architecture: new .claude/rules/site-architecture.md + CLAUDE.md updates"
status: closed
priority: P1
owner: site-builder
created: 2026-06-08
updated: 2026-06-08
tags: [docs, architecture, prototype]
links: []
---

## Context
Once the shared modular scaffold exists, the architecture (shared CSS-variable base + swappable
theme files, shared HTML components, the ES-module lib boundaries, the data contracts, and the
thin per-variant entry pages) must be recorded so future agents follow it instead of re-inventing
structure. Documenting it as a rule makes it auto-loaded and authoritative.

## Acceptance
- [ ] New `.claude/rules/site-architecture.md` documents: shared `base.css` (color-via-vars-only) + `themes/{ink,paper,blueprint}.css` swap model; `shared/components/*.html`; `shared/js/lib` + `pages` module map; `shared/data` contracts (`diagram-data.js`, `glossary.json`, `worked-example.json`, `nav.json`); `variants/*/index.html` thin-entry pattern; `content/ru` source location.
- [ ] `CLAUDE.md` updated to reference the new architecture + rule (one-doc-per-topic; edit in place, no fork).
- [ ] English only, ASCII punctuation only, terse table/bullet style.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-08: Created for the 3-theme prototype/compare phase.
- BLOCKED BY `T-PLATFORM-SCAFFOLD` (records the architecture that task establishes).
- Prototype phase: nothing published, no release tag this phase.
- 2026-06-08: CLOSED (R2 bookend). DONE: new `.claude/rules/site-architecture.md` authored;
  CLAUDE.md sections 5 + 8 updated to reference it.
- Prototype phase -- no release tag, nothing published to brewpage.app.
