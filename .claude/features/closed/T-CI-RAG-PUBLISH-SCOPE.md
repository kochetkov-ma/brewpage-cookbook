---
id: T-CI-RAG-PUBLISH-SCOPE
title: RAG Guide -- publish-scope filter (.brewpageignore) excluding dev-only files (fit BrewPage limits)
status: closed
priority: P1
owner: release-engineer
created: 2026-06-14
updated: 2026-06-14
tags: [ci, publish, brewpage, scope-filter, brewpageignore]
links:
  - EPIC-RAG-SEO-VERSIONING.md
  - T-RECIPE-RAG-SITE.md
---

## Context
Resolves backlog item `T-CI-PUBLISH-SCOPE-FILTER` (folded here, backlog file removed). There is no
publish-scope filter / `.brewpageignore` / manifest, so a naive publish would ship dev-only files
(`mokups/`, `content/` md manuscripts, `.claude/` at every depth -- incl. a stray
`recipes/rag-guide/shared/js/lib/.claude/logs/brewtools.log` nested deep) and risk exceeding the
100-file cap. The publish set must deterministically EXCLUDE dev-only files at every depth and fit
BrewPage limits. This unblocks any future live publish; it does NOT itself publish (publish stays
user-gated this round). Owner: release-engineer.

## Acceptance
- [x] A deterministic publish-scope filter (`.brewpageignore` / manifest) EXCLUDES dev-only files:
      `.claude/` at every depth, `mokups/`, `content/`, `*.md`.
- [x] The resulting publish set fits BrewPage limits: 20 MB total / 100 files / 5 MB per file.
- [x] The filter is documented so the future publish path (direct REST today; action/CLI later) consumes it.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-14: Created + claimed (R1) under `EPIC-RAG-SEO-VERSIONING`. RESOLVES backlog
  `T-CI-PUBLISH-SCOPE-FILTER` -- original card folded in, backlog file removed (backlog count 2 -> 1).
- Original filing context (from the `T-RECIPE-RAG-CODEBLOCKS` close, W7-BOARD): raw folder ran ~142
  files; the publish path must exclude `.claude/` at every depth plus `mokups/`, `content/`, `*.md`.
- 2026-06-14 (R2 close): CLOSED. `.brewpageignore` publish-scope filter built and documented;
  published set is **84 files / 1.69 MB** (within BrewPage limits 100 files / 20 MB / 5 MB per file).
  This RESOLVES the old backlog item `T-CI-PUBLISH-SCOPE-FILTER` (filter built). Shipped under
  milestone tag **`v0.1.0`** (unprefixed), commit SHA **`68ddcab`**, pushed to origin. Accepted-minor
  deferred to `M-INTERACTIVE-RAG-NOJS-EN-POLISH`: `.brewpageignore` does not self-exclude (published
  count 84-85, still under the 100-file cap). Filter only -- outward publish stays user-gated, no
  publish performed this round.
