---
id: T-RECIPE-RAG-LIVE-PUBLISH
title: RAG Guide -- first live publish (REST bootstrap CREATE + secret + .brewpage-site.json) then v0.1.1 PUT update
status: closed
priority: P1
owner: release-engineer
created: 2026-06-15
updated: 2026-06-15
tags: [recipe, rag, publish, live, rest, bootstrap, release, brewpage]
links:
  - EPIC-RAG-REVIEW-DEPLOY.md
  - T-CI-RAG-PUBLISH-WORKFLOW.md
  - T-RECIPE-RAG-SITE.md
---

## Context
First live publish of the RAG Guide to brewpage.app. Two phases:
1. Bootstrap CREATE via direct REST -- create the multi-file site, store the returned owner token in
   repo secret `BREWPAGE_OWNER_TOKEN_RAG` (masked, NEVER committed), and record the returned site id
   in `.brewpage-site.json`.
2. Cut a patch release `v0.1.1` (stamp the live URL + version) so the publish workflow
   (`T-CI-RAG-PUBLISH-WORKFLOW`) runs the `brewpage-action@v1.1.1` PUT update -- giving a stable live
   link that future tags re-publish to.

Includes the stamp-url script + REST bootstrap + tag/release + the publish runbook. Part of
`EPIC-RAG-REVIEW-DEPLOY`. Owner: release-engineer. NOTE: this agent owns the task-card writes via
task-tracker; git tag/push happens per the user's release flow (not by task-tracker).

## Acceptance
- [x] Site CREATEd on brewpage.app via direct REST; multi-file upload fits limits (20 MB / 100 files / 5 MB per file).
- [x] Owner token stored in repo secret `BREWPAGE_OWNER_TOKEN_RAG_GUIDE` (masked, not committed).
- [x] Site id recorded in `.brewpage-site.json` (id `FsOfbLP4df`).
- [x] Live URL + `v0.1.1` stamped (footer/version.json) via the stamp-url script.
- [x] `v0.1.1` patch release cut -> workflow runs the PUT update -> stable live link.
- [x] Publish runbook updated with the as-run bootstrap + release steps.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-15: Minted + CLAIMED (R1) under `progress/`, owner release-engineer. Child of
  `EPIC-RAG-REVIEW-DEPLOY`. Bootstrap CREATE (REST) seeds the site id + secret that
  `T-CI-RAG-PUBLISH-WORKFLOW` PUTs against; `v0.1.1` is the first published curated milestone.
- 2026-06-15: Existing runbook: `.claude/reports/20260614-120000_rag-site-verify/PUBLISH-RUNBOOK.md`.
- 2026-06-15: CLOSED (R2) -- DONE. First live publish landed.
  - **Live URL:** https://brewpage.app/public/FsOfbLP4df (stable id `FsOfbLP4df`, PUT-updated; ttl 30,
    expires 2026-07-15). PUT kept the SAME id (update, not create).
  - **Milestone tag:** `v0.1.1` (unprefixed, annotated) -> commit `317a685`.
  - SHAs: publish infra `64173b5`; site descriptor `.brewpage-site.json` `82b9586`; stamp `e4bb5d7`;
    workflow zip-fix `317a685`.
  - Owner token stored ONLY in repo secret `BREWPAGE_OWNER_TOKEN_RAG_GUIDE` (masked, never committed,
    never leaked). Publish run `27544416117` GREEN.
  - **Link permanence (renew-on-release):** BrewPage caps ttl at 30 days and auto-deletes at expiry;
    each release sets ttl=30, so a release at least every 30 days keeps the link alive. NO cron
    renewal this round.
