---
id: T-PLATFORM-RAG-VERSIONING
title: RAG Guide -- no-build site versioning (version.json + footer stamp + stamp script)
status: closed
priority: P1
owner: recipe-site-architect
created: 2026-06-14
updated: 2026-06-14
tags: [platform, rag, versioning, no-build, footer]
links:
  - EPIC-RAG-SEO-VERSIONING.md
  - T-RECIPE-RAG-SITE.md
---

## Context
The site has no build step, so version provenance must be expressed without a bundler. Add a no-build
versioning surface: a `version.json` (version + commit/date provenance), a footer version stamp shown on
every page, and a small stamp script that updates the stamp/source so the displayed version stays
consistent with the milestone tag. Must stay pure static (no framework, no build) and degrade with no
JS (footer stamp readable from static HTML / `version.json`).

## Acceptance
- [x] `version.json` exists carrying the site version + provenance (commit/date), with an in-file `_schema` note.
- [x] Every page footer shows a version stamp sourced consistently from that version.
- [x] A stamp script keeps the displayed version in sync (no-build; runs in-repo, not a bundler step).
- [x] No-JS readers still see a meaningful version stamp; aligns with the `v0.1.0` milestone tag.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-14: Created + claimed (R1) under `EPIC-RAG-SEO-VERSIONING`. Owner recipe-site-architect
  (static-site provenance fits the architecture role).
- 2026-06-14 (R2 close): CLOSED. No-build versioning shipped: `version.json` (version + provenance,
  `_schema` note), a footer version slot on every page, and `stamp-version.mjs` -- all stamped to
  **`v0.1.0`**. Harness version-footer **36/36 PASS**. Shipped under milestone tag **`v0.1.0`**
  (unprefixed), commit SHA **`68ddcab`**, pushed to origin. Live publish stays user-gated.
