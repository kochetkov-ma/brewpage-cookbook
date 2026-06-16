---
id: T-RECIPE-RAG-PROMOTE
title: "Make the real RAG Guide site -- port real chapter content + build the remaining 8 of 11 chapters on the locked Atlas draft"
status: closed
priority: P1
owner:
created: 2026-06-08
updated: 2026-06-13
tags: [recipe, rag, promote, build-out, content, superseded]
links:
  - ../specs/T-RECIPE-RAG-GUIDE.md
  - ../todo/T-CONTENT-RAG-AUTHORING.md
  - ../todo/T-RECIPE-RAG-SITE.md
---

> SUPERSEDED 2026-06-13: this single "make the real site" lump was SPLIT INTO two groomed tasks --
> `T-CONTENT-RAG-AUTHORING` (author real content + interactive/animation specs) and
> `T-RECIPE-RAG-SITE` (build the real full site, blocked-by the content task). Closed as a
> superseded record only -- not implemented under this id. See the two new cards for live scope.

## Context
Follow-up that turns the verified DRAFT (`T-RECIPE-RAG-DRAFT`, closed) into the real recipe. The
Atlas expedition-map design is locked (`recipes/rag-guide/AtlasMD.md`) and the draft ships the
landing + 3 section pages (`what-rag` / `why-rag` / `search`) on the shared lib with a persisted
per-chapter completion model. What is NOT built: real chapter CONTENT and the remaining 8 of 11
chapters. This task is the "make the real site" iteration: author + port the real prose into the
locked design and build out every remaining chapter, then publish.

Full editorial plan (source of truth): `../specs/T-RECIPE-RAG-GUIDE.md`.

## Acceptance
- [ ] Real chapter content authored + hand-ported into the locked Atlas design (md-as-source).
- [ ] Remaining 8 of 11 chapters built on the shared lib (all 11 chapters present + navigable).
- [ ] EN bilingual + client-side search wired over the real content.
- [ ] Published to brewpage.app via the recipe-publish pipeline.
- [ ] Mandatory cross-links present (brewpage.app + brewpage-openapi contract repo).

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-08: Created as the follow-up carrying the deferred full-recipe work after the prototype
  phase closed.
- 2026-06-13: REFRAMED after the draft consolidated to a SINGLE locked Atlas design (no more
  theme pick / variant deletion). Now scoped as "make the real site": port real content + build
  the remaining 8 of 11 chapters on the locked draft, then publish. Groom into `todo/` to start
  the next iteration.
- 2026-06-13: SUPERSEDED + closed. Split into `T-CONTENT-RAG-AUTHORING` (content + interactive
  specs first) and `T-RECIPE-RAG-SITE` (site build, blocked-by the content task). No tag (board is
  local-only / untracked this round). Both successor cards note "supersedes T-RECIPE-RAG-PROMOTE".
