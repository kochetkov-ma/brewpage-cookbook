# BrewPage Cookbook Task Board

> Canonical task list + status. Procedure: [`TRACKER.md`](TRACKER.md). New-task template: [`TASK_TEMPLATE.md`](TASK_TEMPLATE.md). Ungroomed inbox: [`backlog/`](backlog/). Ship-state prose: [`STATUS.md`](STATUS.md). Root `TODO.md` does NOT exist -- this board is the only tracker.

## Overall status

- **Release line:** RAG Guide is **LIVE** -- first publish shipped at milestone tag **`v0.1.1`** (unprefixed, annotated) on `main`, publishing commit SHA `317a685`. Live URL: https://brewpage.app/public/FsOfbLP4df (stable id, PUT-updated; ttl 30, expires 2026-07-15). Publish run `27544416117` GREEN; GitHub Release `v0.1.1` with the live link + both ecosystem cross-links. Prior milestone `v0.1.0` (`68ddcab`) was the staged marker.
- **Counts:** backlog `2` | todo `1` | progress `0` | closed `24` | specs `2`.
- **Current focus:** keep the live link alive via **release-on-30d** -- BrewPage caps ttl at 30 days and auto-deletes at expiry; each release sets ttl=30, so cutting a release at least every 30 days (next deadline 2026-07-15) keeps https://brewpage.app/public/FsOfbLP4df live (no cron renewal this round). Beyond that: **future recipes** (next cookbook guides) toward `EPIC-COOKBOOK-V1`. The first-live-deploy round closed clean: `EPIC-RAG-REVIEW-DEPLOY` + its 4 children + the staged `T-RECIPE-RAG-SITE` all CLOSED as LIVE under `v0.1.1`.

## Progress (WIP)

_None -- nothing in flight. The RAG Guide first-live-deploy round closed under `v0.1.1`._

| id | title | priority | owner | file |
|----|-------|----------|-------|------|

## Todo (queued)

| id | title | priority | owner | file |
|----|-------|----------|-------|------|
| EPIC-COOKBOOK-V1 | Cookbook V1 -- first recipe live on brewpage.app | P1 | (manager) | [file](todo/EPIC-COOKBOOK-V1.md) |

## Backlog (ungroomed)

`2` items -- see [`backlog/`](backlog/). Procedure: [`TRACKER.md`](TRACKER.md) §7. Ungroomed, no owner claim yet. (`T-CI-PUBLISH-SCOPE-FILTER` was groomed 2026-06-14 -- folded into `T-CI-RAG-PUBLISH-SCOPE` and shipped under `v0.1.0`, now closed.)

- `BUG-INTERACTIVE-PROCESS-ANIM-REDUCED-MOTION` (P2, INTERACTIVE) -- embedding `process-anim` fails harness V3 under prefers-reduced-motion (node settles at `width:auto` instead of fixed ~48.45px end width). Pre-existing; filed from the `T-RECIPE-RAG-CODEBLOCKS` close.
- `M-INTERACTIVE-RAG-NOJS-EN-POLISH` (P3, INTERACTIVE) -- EN-primary polish for the no-JS path: interactive-host data fallbacks + chunking cat-table still render RU on 6 pages, bilingual lang-toggle `aria-label`, `.brewpageignore` self-exclude. Accepted-minors carried from the `v0.1.0` / `EPIC-RAG-SEO-VERSIONING` close (not blockers).

## Closed (recent)

| id | title | closed in (vX.Y.Z) | file |
|----|-------|--------------------|------|
| EPIC-RAG-REVIEW-DEPLOY | RAG Guide -- content/SEO/fact/link post-review + first live deploy via brewpage-action [umbrella; 4 children; LIVE] | v0.1.1 (317a685) | [file](closed/EPIC-RAG-REVIEW-DEPLOY.md) |
| T-RECIPE-RAG-SITE | RAG Guide -- build the real full site (all chapters, specced animations, EN + search, publish) [DONE/LIVE @ /public/FsOfbLP4df] | v0.1.1 (317a685) | [file](closed/T-RECIPE-RAG-SITE.md) |
| T-RECIPE-RAG-LIVE-VERIFY | RAG Guide -- verify first live deploy (GitHub run/Release green + brewpage.app EN/RU, footer v0.1.1, SEO live) [run 27544416117 GREEN] | v0.1.1 (317a685) | [file](closed/T-RECIPE-RAG-LIVE-VERIFY.md) |
| T-RECIPE-RAG-LIVE-PUBLISH | RAG Guide -- first live publish (REST bootstrap CREATE + secret + .brewpage-site.json) then v0.1.1 PUT update | v0.1.1 (317a685) | [file](closed/T-RECIPE-RAG-LIVE-PUBLISH.md) |
| T-CI-RAG-PUBLISH-WORKFLOW | RAG Guide -- author .github/workflows/publish-recipe.yml (tag v*.*.* -> brewpage-action PUT + Release) | v0.1.1 (317a685) | [file](closed/T-CI-RAG-PUBLISH-WORKFLOW.md) |
| T-CONTENT-RAG-REVIEW | RAG Guide -- post-review all text (facts/links/SEO), EN then RU, apply fixes | v0.1.1 (317a685) | [file](closed/T-CONTENT-RAG-REVIEW.md) |
| EPIC-RAG-SEO-VERSIONING | RAG Guide -- SEO + no-build versioning + EN-primary bilingual flip [umbrella; 6 children; resolves backlog T-CI-PUBLISH-SCOPE-FILTER] | v0.1.0 (68ddcab) | [file](closed/EPIC-RAG-SEO-VERSIONING.md) |
| T-CONTENT-RAG-BILINGUAL-FLIP | RAG Guide -- EN-primary bilingual flip (static EN HTML default + RU JS toggle) | v0.1.0 (68ddcab) | [file](closed/T-CONTENT-RAG-BILINGUAL-FLIP.md) |
| T-INTERACTIVE-RAG-LANG-URL | RAG Guide -- shareable ?lang=ru locale URL + EN-default JS toggle wiring [i18n-URL 66/66 PASS] | v0.1.0 (68ddcab) | [file](closed/T-INTERACTIVE-RAG-LANG-URL.md) |
| T-PLATFORM-RAG-VERSIONING | RAG Guide -- no-build site versioning (version.json + footer stamp + stamp script) [version-footer 36/36 PASS] | v0.1.0 (68ddcab) | [file](closed/T-PLATFORM-RAG-VERSIONING.md) |
| T-SEO-RAG-FULL | RAG Guide -- full per-page SEO (meta/canonical/hreflang/og/twitter/JSON-LD/robots/favicon/theme-color/og-image) [SEO 168/168 PASS] | v0.1.0 (68ddcab) | [file](closed/T-SEO-RAG-FULL.md) |
| T-CI-RAG-PUBLISH-SCOPE | RAG Guide -- publish-scope filter (.brewpageignore); resolves T-CI-PUBLISH-SCOPE-FILTER [84 files / 1.69 MB] | v0.1.0 (68ddcab) | [file](closed/T-CI-RAG-PUBLISH-SCOPE.md) |
| T-RECIPE-RAG-V010-TAG | RAG Guide -- cut the v0.1.0 milestone tag (publish stays gated this round) | v0.1.0 (68ddcab) | [file](closed/T-RECIPE-RAG-V010-TAG.md) |
| T-RECIPE-RAG-CODEBLOCKS | Unified code-block system for the RAG Guide (syntax highlight + bilingual hover annotations) [190/190 harness PASS; 6-agent review fix-looped to green] | user-gated -- no tag | [file](closed/T-RECIPE-RAG-CODEBLOCKS.md) |
| T-CONTENT-RAG-EN | RAG Guide -- English translation of 12 chapters (i18n) [EN delivered with the site build; ships with the site milestone] | ships with site -- no separate tag | [file](closed/T-CONTENT-RAG-EN.md) |
| T-CONTENT-RAG-AUTHORING | RAG Guide -- author 12 RU manuscripts (native Cyrillic) + interactive/animation specs + IE handoff briefs | content-only -- no tag | [file](closed/T-CONTENT-RAG-AUTHORING.md) |
| T-RECIPE-RAG-PROMOTE | "Make the real site" -- SUPERSEDED, split into T-CONTENT-RAG-AUTHORING + T-RECIPE-RAG-SITE | superseded -- no tag | [file](closed/T-RECIPE-RAG-PROMOTE.md) |
| T-RECIPE-RAG-DRAFT | RAG Guide site DRAFT -- Atlas map landing + 3 section pages on shared lib; AtlasMD locked | draft -- no tag | [file](closed/T-RECIPE-RAG-DRAFT.md) |
| T-PLATFORM-SCAFFOLD | Shared modular scaffold: base.css + 3 themes + components + 3 variant entries + data contracts | prototype -- no tag | [file](closed/T-PLATFORM-SCAFFOLD.md) |
| T-INTERACTIVE-RAG-CORE | Shared JS ES-module lib (drilldown/timeline/process-anim/glossary/i18n/dom/a11y + search) | prototype -- no tag | [file](closed/T-INTERACTIVE-RAG-CORE.md) |
| M-DOCS-SITE-ARCH | Record site architecture: rules/site-architecture.md + CLAUDE.md updates | prototype -- no tag | [file](closed/M-DOCS-SITE-ARCH.md) |
| T-RECIPE-RAG-GUIDE | RAG Guide PROTOTYPE -- core RU sections + payloads, ported to HTML, 3 variants (full recipe deferred) | prototype -- no tag | [file](closed/T-RECIPE-RAG-GUIDE.md) |
| T-PLATFORM-SITE-AGENT | Specialized cookbook-site builder agent encoding the shared catalog | prototype -- no tag | [file](closed/T-PLATFORM-SITE-AGENT.md) |
| M-RECIPE-RAG-COMPARE | Launch 3 variants, QA (7/8), write compare report for the user to choose | prototype -- no tag | [file](closed/M-RECIPE-RAG-COMPARE.md) |

## Feature specs

| id | title | file |
|----|-------|------|
| T-RECIPE-RAG-GUIDE | RAG Guide content plan (CA-authored) | [spec](specs/T-RECIPE-RAG-GUIDE.md) |
| T-CONTENT-RAG-AUTHORING | RAG Guide content + interactive/animation design spec (IE handoff briefs; CA-authored stub) | [spec](specs/T-CONTENT-RAG-AUTHORING.md) |
