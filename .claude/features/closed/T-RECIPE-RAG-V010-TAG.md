---
id: T-RECIPE-RAG-V010-TAG
title: RAG Guide -- cut the v0.1.0 milestone tag (publish stays gated this round)
status: closed
priority: P1
owner: release-engineer
created: 2026-06-14
updated: 2026-06-14
tags: [recipe, rag, release, milestone, tag]
links:
  - EPIC-RAG-SEO-VERSIONING.md
  - T-RECIPE-RAG-SITE.md
  - EPIC-COOKBOOK-V1.md
---

## Context
Mark the first curated RAG Guide milestone with the unprefixed `v0.1.0` tag once the bilingual flip,
versioning, SEO, and publish-scope filter children land. This is the tag-milestone marker ONLY -- the
outward publish to brewpage.app remains user-gated this round (no live publish in scope here; that stays
tracked on `T-RECIPE-RAG-SITE`). The tag records the milestone commit so `version.json` / footer stamp
align. release-engineer owns the tag flow; the actual `git tag`/push is performed only under explicit
user authorization (this card does not run git itself until that point).

## Acceptance
- [x] `v0.1.0` (unprefixed) milestone tag prepared against the milestone commit, with provenance recorded.
- [x] `version.json` + footer stamp align with the `v0.1.0` tag.
- [x] Publish to brewpage.app remains GATED -- this milestone is the tag only, no outward publish.
- [x] Tag + commit SHA recorded here + reflected in `STATUS.md` on close.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-14: Created + claimed (R1) under `EPIC-RAG-SEO-VERSIONING`. Tag-milestone marker; live
  publish deliberately out of scope (stays user-gated, tracked on `T-RECIPE-RAG-SITE`).
- 2026-06-14 (R2 close): CLOSED. Milestone tag **`v0.1.0`** (unprefixed) cut on `main` at commit SHA
  **`68ddcab`** (stamp commit; ancestry: `1dffb8b` baseline, `85d8a9e` shared-layer, `08a4b67` HTML
  rollout, `bc1552e` fixes, `68ddcab` stamp). Pushed to origin. `version.json` + footer stamp align
  to `v0.1.0`. Publish to brewpage.app stayed GATED -- this milestone is the tag marker only, no
  outward publish performed (live publish remains pending user authorization, tracked on
  `T-RECIPE-RAG-SITE`).
