---
id: EPIC-COOKBOOK-V1
title: Cookbook V1 -- first recipe live on brewpage.app
status: todo
priority: P1
owner: (manager)
created: 2026-06-04
updated: 2026-06-14
tags: [epic, v1, milestone]
links:
  - T-CONTENT-RAG-AUTHORING.md
  - T-RECIPE-RAG-SITE.md
---

## Context
Umbrella milestone for the cookbook's V1: stand up the platform and ship the first interactive
recipe live on brewpage.app. This epic is "done" when a real reader can open the RAG Guide as a
working interactive artifact on the live site, published through the brewpage publish pipeline.
It coordinates the two concrete tasks below.

## Acceptance
- [ ] `T-PLATFORM-SCAFFOLD` closed -- simplest static HTML scaffold live (plain HTML + minimal vanilla JS + one small CSS file; no framework, no build), publishing directly to brewpage.app.
- [ ] `T-RECIPE-RAG-GUIDE` closed -- RAG Guide built, interactive, and published live on brewpage.app.
- [ ] First recipe URL is publicly reachable and back-links to brewpage.app + the brewpage-openapi contract repo.
- [ ] V1 milestone tagged `vX.Y.Z` (unprefixed) and reflected in `STATUS.md`.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

Child tasks:
- `T-PLATFORM-SCAFFOLD` (P1, closed) -- the platform foundation.
- `T-RECIPE-RAG-GUIDE` (P1, closed) -- the first recipe prototype.
- `T-CONTENT-RAG-AUTHORING` (P1, todo) -- author the real RAG Guide content (MD) + interactive/animation specs.
- `T-RECIPE-RAG-SITE` (P1, todo) -- build the real full RAG Guide site; blocked-by `T-CONTENT-RAG-AUTHORING`.

Related epic:
- `EPIC-RAG-SEO-VERSIONING` (P1, CLOSED 2026-06-14) -- RAG Guide SEO + no-build versioning + EN-primary
  bilingual flip + publish-scope filter, capped by the **`v0.1.0`** milestone tag (commit SHA
  `68ddcab`, pushed). Feeds this V1 epic. The RAG Guide is now `v0.1.0`-tagged, EN-primary,
  SEO-complete, version-stamped, and publish-scope filtered (84 files / 1.69 MB) -- STAGED but NOT live.
  This V1 epic stays open: it closes only when the RAG Guide is published live + reachable on
  brewpage.app (the gated live publish, tracked on `T-RECIPE-RAG-SITE`, pending user authorization).
