---
id: T-CI-RAG-PUBLISH-WORKFLOW
title: RAG Guide -- author .github/workflows/publish-recipe.yml (tag v*.*.* -> brewpage-action PUT + Release)
status: closed
priority: P1
owner: github-actions-engineer
created: 2026-06-15
updated: 2026-06-15
tags: [ci, rag, workflow, github-actions, brewpage-action, publish, release]
links:
  - EPIC-RAG-REVIEW-DEPLOY.md
  - T-RECIPE-RAG-LIVE-PUBLISH.md
---

## Context
Author the recipe-publish GitHub Actions workflow `.github/workflows/publish-recipe.yml`. Trigger on
unprefixed `v*.*.*` tags; publish the RAG Guide static folder to brewpage.app via
`brewpage-action@v1.1.1` using the PUT update path (against the site id bootstrapped by
`T-RECIPE-RAG-LIVE-PUBLISH`); then create a GitHub Release that links the live brewpage.app URL.
Owner token injected from repo secret `BREWPAGE_OWNER_TOKEN_RAG`, masked in logs.

Part of `EPIC-RAG-REVIEW-DEPLOY`. Owner: github-actions-engineer. Follow `.claude/rules/github-actions.md`
(exact-pin every `uses:`, secret masking before any output, `$GITHUB_OUTPUT`, least-privilege
permissions, concurrency + cancel-in-progress, `set -euo pipefail`).

## Acceptance
- [x] `.github/workflows/publish-recipe.yml` exists; triggers on `v*.*.*` tags.
- [x] Uses `brewpage-action@v1.1.1` PUT (update) against the recorded site id.
- [x] Owner token from `BREWPAGE_OWNER_TOKEN_RAG_GUIDE`, masked before any log/output.
- [x] Creates a GitHub Release including the live brewpage.app link.
- [x] All `uses:` pinned exact `vX.Y.Z`; least-privilege `permissions:`; concurrency group set.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-15: Minted + CLAIMED (R1) under `progress/`, owner github-actions-engineer. Child of
  `EPIC-RAG-REVIEW-DEPLOY`. Pairs with `T-RECIPE-RAG-LIVE-PUBLISH` (which bootstraps the site id +
  secret the workflow's PUT depends on).
- 2026-06-15: CLOSED (R2) -- DONE + VERIFIED GREEN. `.github/workflows/publish-recipe.yml` authored
  (tag `v*.*.*` -> `brewpage-action@v1.1.1` PUT against the recorded site id -> GitHub Release with
  live link + recipes manifest + both ecosystem cross-links). Owner token from repo secret
  `BREWPAGE_OWNER_TOKEN_RAG_GUIDE` (masked, never leaked). Publish infra committed `64173b5`; a
  zip-fix landed at `317a685` (the `v0.1.1` milestone commit). Publish run `27544416117` GREEN;
  PUT kept the SAME site id (update, not create). Live: https://brewpage.app/public/FsOfbLP4df.
  Tag `v0.1.1` -> `317a685`.
