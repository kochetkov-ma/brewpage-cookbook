---
id: T-RECIPE-RAG-GUIDE
title: "RAG Guide PROTOTYPE -- core RU sections + diagram/worked-example/glossary payloads, ported to HTML, assembled in all 3 variants"
status: closed
priority: P1
owner: cookbook-author
created: 2026-06-04
updated: 2026-06-08
tags: [recipe, rag, prototype]
links:
  - ../specs/T-RECIPE-RAG-GUIDE.md
---

## Context
Prototype slice of the RAG Guide for the 3-theme prototype/compare phase: a reduced-depth core
that proves the shared modular architecture and lets the three visual variants
(ink / paper / blueprint) be compared. The FULL editorial plan stays at
`../specs/T-RECIPE-RAG-GUIDE.md` (kept intact, NOT deleted) -- this card is the prototype subset
only. Content is authored against the data contracts defined by `T-PLATFORM-SCAFFOLD` and uses
the shared JS lib from `T-INTERACTIVE-RAG-CORE`.

In-scope (prototype):
- Core-section RU markdown under `content/ru/`: `00-landing`, `01-chunking`, `02-embedding`.
- `diagram-data` payload + `worked-example` payload feeding the shared lib.
- Glossary RU seed (`glossary.json`).
- Cross-links present (brewpage.app + brewpage-openapi contract repo).
- Port the core RU markdown -> static HTML.
- Assemble all THREE variants (`variants/{ink,paper,blueprint}/index.html`) from the shared
  components + lib + content.

Out-of-scope this phase: all 15 chapters; the 4 stage pages; full EN bilingual; search beyond
the stub; any publishing to brewpage.app.

## Acceptance
- [ ] Core RU sections written: `content/ru/00-landing`, `01-chunking`, `02-embedding`.
- [ ] `diagram-data` payload + `worked-example` payload authored against the scaffold schemas.
- [ ] Glossary RU seed (`glossary.json`) populated for the core sections.
- [ ] Cross-links present (brewpage.app + brewpage-openapi contract repo).
- [ ] Core RU markdown ported to static HTML via the shared components.
- [ ] All three variants assembled and render as static files opened directly (no build step).
- [ ] Full editorial plan `../specs/T-RECIPE-RAG-GUIDE.md` left intact (this card is the prototype subset).

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-08: RESCOPED down to the PROTOTYPE subset for the 3-theme prototype/compare phase.
  Full chapters / stage pages / bilingual / search / publishing are out-of-scope this phase.
- BLOCKED BY `T-PLATFORM-SCAFFOLD` (needs shared components + data contracts) and
  `T-INTERACTIVE-RAG-CORE` (needs the shared JS lib to render diagram/worked-example/glossary).
- Full editorial plan retained at `../specs/T-RECIPE-RAG-GUIDE.md`.
- Prototype phase: nothing published, no release tag this phase.
- 2026-06-08: CLOSED -- PROTOTYPE SCOPE ONLY (R2 bookend). DONE: core RU md
  (`00-landing`/`01-chunking`/`02-embedding`) + diagram-data + worked-example + glossary seed +
  nav authored; md ported to static HTML; all 3 variants assembled + QA-passed.
- DEFERRED: the FULL recipe (all 15 chapters, 4 stages, EN bilingual, client-side search,
  publish to brewpage.app) remains out-of-scope and is now tracked by follow-up backlog item
  `T-RECIPE-RAG-PROMOTE`. Full editorial spec `../specs/T-RECIPE-RAG-GUIDE.md` left intact.
- Prototype phase -- no release tag, nothing published to brewpage.app.
