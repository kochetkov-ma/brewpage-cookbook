---
id: T-RECIPE-RAG-DRAFT
title: "RAG Guide site DRAFT -- Atlas expedition-map landing + 3 section pages on shared lib; AtlasMD design system locked"
status: closed
priority: P1
owner: site-builder
created: 2026-06-13
updated: 2026-06-13
tags: [recipe, rag, draft, atlas, design-system]
links:
  - ../specs/T-RECIPE-RAG-GUIDE.md
---

## Context
Consolidation pass after the 3-theme prototype/compare phase: the multi-variant prototype was
collapsed into ONE chosen visual direction -- the Atlas expedition-map design -- and a full DRAFT
of the RAG Guide site was built and verified on it. This is the draft milestone that precedes the
real content build-out; it proves the locked design system and the navigation/state model end to
end. Editorial source of truth stays at `../specs/T-RECIPE-RAG-GUIDE.md`; the design system is
recorded at `recipes/rag-guide/AtlasMD.md`.

Built on the shared-lib + one-CSS model (`recipes/rag-guide/shared/{css,components,data,js}`):
`index.html` Atlas MAP landing + 3 section pages (`what-rag.html`, `why-rag.html`, `search.html`).

## Acceptance
- [x] AtlasMD design system locked as canonical (`recipes/rag-guide/AtlasMD.md`); supersedes the
      3-theme prototype direction (metro variant and rejected mockups dropped).
- [x] Atlas expedition-map landing (`index.html`) built + polished: uniform serif pin labels with
      halo + side de-collision, fixed terrain rivers, two watercraft, a production-stage balloon,
      uniform-height chapter cards, back-to-map + next-step nav.
- [x] Three section pages built on the shared lib: `what-rag.html`, `why-rag.html`, `search.html`.
- [x] Persisted per-chapter completion model (`chapter-state.js`: fractional progress + 3 states).
- [x] Draft renders + verified as static files (no build step), shared lib intact.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-13: CLOSED (R2 bookend). DONE: full DRAFT of the RAG Guide site verified -- Atlas
  expedition-map landing + 3 section pages (what-rag / why-rag / search) on the shared lib;
  AtlasMD design system locked; persisted per-chapter completion model (chapter-state.js, frac +
  3 states); landing map fully polished (uniform serif pin labels w/ halo + side de-collision,
  fixed terrain rivers, two watercraft, production-stage balloon, uniform-height chapter cards,
  back-to-map + next-step nav).
- DEFERRED to next iteration ("make the real site"): real chapter CONTENT + the remaining 8 of 11
  chapters. Tracked by backlog follow-up `T-RECIPE-RAG-PROMOTE`. Full editorial spec
  `../specs/T-RECIPE-RAG-GUIDE.md` left intact.
- Release: NO tag this round -- plain commit, commit SHA d50df4b (draft state; nothing published
  to brewpage.app, no milestone tag this iteration).
