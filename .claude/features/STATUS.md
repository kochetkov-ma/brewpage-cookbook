# BrewPage Cookbook -- ship state

Last updated: 2026-06-15 (V9-BOARD / R2: first-live-deploy round CLOSED -- the RAG Guide is LIVE. EPIC-RAG-REVIEW-DEPLOY + its 4 children (T-CONTENT-RAG-REVIEW, T-CI-RAG-PUBLISH-WORKFLOW, T-RECIPE-RAG-LIVE-PUBLISH, T-RECIPE-RAG-LIVE-VERIFY) + the staged T-RECIPE-RAG-SITE all CLOSED as LIVE under milestone tag v0.1.1 (unprefixed, annotated; publishing commit SHA 317a685). Live URL: https://brewpage.app/public/FsOfbLP4df (stable id, PUT-updated; ttl 30, expires 2026-07-15). Verified: publish run 27544416117 GREEN; GitHub Release v0.1.1 with the live link + recipes manifest + both ecosystem cross-links; PUT kept the SAME id (update, not create); owner token only in repo secret BREWPAGE_OWNER_TOKEN_RAG_GUIDE (never leaked); harness 712/0; live renders EN-default + RU toggle, footer v0.1.1, SEO meta with real id, og:image 200, zero recipe-origin external requests. Link permanence = renew-on-release: BrewPage caps ttl at 30 days + auto-deletes at expiry, so a release at least every 30 days (next deadline 2026-07-15) keeps the link alive -- NO cron renewal this round. Key SHAs: review fixes d99fbab, publish infra 64173b5, site descriptor 82b9586, stamp e4bb5d7, workflow zip-fix 317a685. Progress count 6 -> 0; closed 18 -> 24. Prior: V8-BOARD / R1 opened the gate + claimed the epic; V7-BOARD / R2: EPIC-RAG-SEO-VERSIONING + its 6 children CLOSED -- the RAG Guide hardening pass shipped and the staged milestone was TAGGED `v0.1.0` (unprefixed) on main at commit SHA 68ddcab, pushed to origin. Delivered: EN-primary bilingual flip (static EN default + RU ?lang=ru toggle with URL writeback), no-build versioning (version.json + footer slot + stamp-version.mjs, all stamped v0.1.0), full per-page SEO on all 12 pages, publish-scope filter (.brewpageignore, 84 files / 1.69 MB), local og-image + favicon set + sitemap.xml. Harness 706 PASS / 6 accepted-minor FAIL (RU no-JS interactive-host data fallbacks; 0 blocker / 0 major). T-CI-RAG-PUBLISH-SCOPE resolved the old backlog T-CI-PUBLISH-SCOPE-FILTER. Accepted-minors filed to backlog as M-INTERACTIVE-RAG-NOJS-EN-POLISH. Live publish to brewpage.app stays USER-GATED -- v0.1.0 is the milestone marker only, nothing published live. T-RECIPE-RAG-SITE stays IN PROGRESS (STAGED + v0.1.0-tagged; only the gated live publish remains). Prior: W8-BOARD / R1 minted+claimed the epic; W7-BOARD / R2 closed T-RECIPE-RAG-CODEBLOCKS; board local-only / untracked)

Prose narrative of where each initiative stands. [`board.md`](board.md) = canonical task list; this file is the story behind it and is not a duplicate of the tables.

## Where we are

The RAG Guide is **LIVE** -- **first publish shipped** at milestone tag **`v0.1.1`** (unprefixed, annotated; publishing commit SHA **`317a685`**). Live URL: **https://brewpage.app/public/FsOfbLP4df** (stable id, PUT-updated). The site is the complete **EN-primary bilingual** recipe: **12 pages** on the shared lib + atlas theme (**AtlasMD design system locked**, `recipes/rag-guide/AtlasMD.md`), static EN default prose with RU served via a shareable `?lang=ru` toggle (URL writeback + persistence), all authored chapters ported, every specced interactive/animated element implemented, client-side search, persisted per-chapter completion + map nav, **full per-page SEO** on all 12 pages, **no-build versioning** (footer stamped `v0.1.1`), and a **publish-scope filter** (`.brewpageignore`), with mandatory ecosystem cross-links on every page + README. The first live deploy was verified on both surfaces: publish run **`27544416117` GREEN**; GitHub Release **`v0.1.1`** with the live link + recipes manifest + both ecosystem cross-links; the PUT update kept the **SAME site id** (update, not create); the owner token lives **only** in repo secret `BREWPAGE_OWNER_TOKEN_RAG_GUIDE` (never leaked); harness **712/0**; the live site renders EN-default + RU toggle, footer `v0.1.1`, SEO meta with the real id, og:image 200, and **zero recipe-origin external requests**.

**Link permanence = renew-on-release.** BrewPage caps ttl at 30 days and auto-deletes a page at expiry; each release sets ttl=30. The current link **expires 2026-07-15** -- cutting a release at least every 30 days keeps https://brewpage.app/public/FsOfbLP4df alive. NO cron renewal this round; the next renewal is a release before the 2026-07-15 deadline. Key SHAs: review content fixes `d99fbab`, publish infra `64173b5`, site descriptor `82b9586`, stamp `e4bb5d7`, workflow zip-fix `317a685`. Prior staged milestone `v0.1.0` (commit `68ddcab`) was the marker before the gate opened. Publish runbook: `.claude/reports/20260614-120000_rag-site-verify/PUBLISH-RUNBOOK.md`.

> Process note (learning): during the review phase an agent ran `git checkout HEAD -- <pages>` and destroyed the uncommitted EN-primary HTML rollout; it was fully recovered by re-running the rollout and committing (now protected in git). Lesson: commit work-in-progress before any destructive-capable git operation.

## Platform

`T-PLATFORM-SCAFFOLD` (P1, **closed**, owner site-builder) -- the **shared modular prototype scaffold** is built: `shared/css/base.css` (color via CSS variables only) + `shared/css/themes/{ink,paper,blueprint}.css` (swap-only theming), `shared/components/*.html`, `shared/js/lib` + `pages`, `shared/data` contracts (`diagram-data.js`, `glossary.json`, `worked-example.json`, `nav.json`), `variants/{ink,paper,blueprint}/index.html` thin entries, and `content/ru` core source. One-file-theme invariant verified.

## Interactive lib

`T-INTERACTIVE-RAG-CORE` (P1, **closed**, owner interactive-engineer) -- the shared vanilla-JS ES-module lib (drilldown, timeline, process-anim, glossary, i18n, dom, a11y, plus search) is built and browser-verified with 0 console errors.

## Prototype recipe

`T-RECIPE-RAG-GUIDE` (P1, **closed -- prototype scope only**, owner cookbook-author) -- the prototype subset shipped: core RU sections (`00-landing`, `01-chunking`, `02-embedding`), diagram + worked-example payloads, glossary RU seed, cross-links, ported to HTML, QA-passed. Superseded by the consolidated draft below. The full editorial plan stays intact at `.claude/features/specs/T-RECIPE-RAG-GUIDE.md`.

## Site draft + design system

`T-RECIPE-RAG-DRAFT` (P1, **closed -- draft scope**, owner site-builder) -- the prototype consolidated into ONE locked Atlas expedition-map direction and a full DRAFT of the site was built + verified: the Atlas MAP landing (`index.html`) + 3 section pages (`what-rag` / `why-rag` / `search`) on the shared lib, a persisted per-chapter completion model (`chapter-state.js`), and a fully polished landing map. The **AtlasMD design system is locked** (`recipes/rag-guide/AtlasMD.md`). Real chapter content + the remaining 8 of 11 chapters are **deferred** to the next iteration, tracked by `T-RECIPE-RAG-PROMOTE`. Closed as a plain commit -- no release tag this round.

## Architecture docs + agent

`M-DOCS-SITE-ARCH` (P1, **closed**, owner site-builder) recorded the shared architecture as the new `.claude/rules/site-architecture.md` plus CLAUDE.md sections 5/8. `T-PLATFORM-SITE-AGENT` (P1, **closed**, owner brewcode:agent-creator) encoded the shared catalog into the new `recipe-site-architect` agent (model opus).

## Compare

`M-RECIPE-RAG-COMPARE` (P1, **closed**, owner brewcode:tester) -- all three variants launched and QA'd (7/8, Lighthouse qualitative); BUG-1 (cross-variant nav) found and fixed. Compare report (per-variant strengths/tradeoffs + recommendation) at `.claude/reports/20260608-120000_rag-theme-compare/`, ready for the user to pick a direction.

## Next -- the real recipe, split in two

The single "make the real site" backlog lump `T-RECIPE-RAG-PROMOTE` was groomed on 2026-06-13 and **split into two queued P1 tasks** (the promote card is closed as a superseded record). Content is authored first; the site build is blocked by it.

`T-CONTENT-RAG-AUTHORING` (P1, **RECLOSED**, owner cookbook-author) -- the manuscripts were delivered earlier but written in latin-transliterated Russian; reopened 2026-06-13 to convert all 12 manuscripts under `content/ru/` to natural native Cyrillic Russian (matching the Cyrillic `nav.json`) and run a completeness validation pass. That rework is now DONE and verified, and the task is reclosed: all 12 manuscripts are native Cyrillic (0 residual translit, 0 non-ASCII punctuation), sign-off headings standardized to full Cyrillic, the chunking catalog expanded 5 -> 9 strategies (token-vs-char note, markdown-header, parent-document/hierarchical, late chunking arXiv:2409.04701, contextual retrieval), embedding coverage expanded (normalization, distance metrics, hybrid sparse+dense/BM25, Matryoshka, asymmetric query/doc, multilingual, quantization), vector-store + payload-anatomy headers fixed to Cyrillic, and the spec updated (sign-off block, 9-row catalog, embedding-coverage note, +15 glossary terms). 4 independent audits passed (chunking, embedding, language/accessibility, DoD); both ecosystem cross-links present in every chapter; model id `claude-sonnet-4-5` consistent. EN translation is tracked separately by `T-CONTENT-RAG-EN` (deferred to the site-build phase). Closed with NO release tag (content-only; nothing published to brewpage.app). Original delivery record below for reference. Delivered: 11 canonical-slug RU manuscripts plus a payload-anatomy file under `recipes/rag-guide/content/ru/` (start, what-rag, why-rag, search, chunking, embedding, vector-store, assemble-context, generation, evaluation, production, payload-anatomy; the old numbered 00/01/02 files renamed/deleted), each to recipe DoD; the design spec `.claude/features/specs/T-CONTENT-RAG-AUTHORING.md` fully filled (Scope, chapter manuscript map, annotated JSON-payload showcases, chunking-strategies catalog rated on complexity + cost with algorithm steps, progressive-disclosure schemes, didactic algorithm animations, **16 IE handoff briefs**, cross-references, a **68-term glossary**, and an IE feasibility review: 11 buildable / 5 needs-reduction / 0 infeasible); and `.claude/features/specs/T-RECIPE-RAG-GUIDE.md` Scope reconciled 15 -> 11 chapters. Verified: 0 non-ASCII, both ecosystem cross-links in every chapter, no stale model ids, no `shared/data` edits (deferred to the site task). Closed with NO release tag -- content-only milestone, nothing published to brewpage.app yet. Supersedes `T-RECIPE-RAG-PROMOTE`; feeds `EPIC-COOKBOOK-V1`.

`T-RECIPE-RAG-SITE` (P1, **closed -- DONE / LIVE**, owner site-builder) -- the real full RAG Guide site is BUILT on the locked Atlas shared lib from the authored content, superseding the 3-section draft: all planned chapters ported to static HTML, every specced interactive/animated element implemented (annotated JSON viewer, chunking comparison, progressive-disclosure schemes, didactic animations) as vanilla-JS ES modules + inline SVG with transform/opacity-only motion gated by IntersectionObserver + prefers-reduced-motion, full no-JS fallback, mobile 390/320px, client-side search, persisted per-chapter completion + map nav, mandatory cross-links on every page + README. It is **EN-primary bilingual** (static EN default + RU `?lang=ru` toggle), **SEO-complete** on all 12 pages, **no-build version-stamped** (`v0.1.1`), and **publish-scope filtered** (`.brewpageignore`), hardened by the closed `EPIC-RAG-SEO-VERSIONING`. It was **per-animation VERIFIED** (Playwright V1-V11: 0 console errors, mobile OK, reduced-motion OK), **6-agent adversarially REVIEWED + fix-looped to 0 blocker / 0 major**. CLOSED as LIVE on 2026-06-15: the recipe is published live at **https://brewpage.app/public/FsOfbLP4df** under milestone tag **`v0.1.1`** (publishing commit SHA `317a685`; content/stamp SHA `e4bb5d7`), publish run `27544416117` GREEN, harness 712/0. Runbook: `.claude/reports/20260614-120000_rag-site-verify/PUBLISH-RUNBOOK.md`. Owners across build: site-builder + interactive-engineer + release-engineer (+ cookbook-author for content fixes). Supersedes `T-RECIPE-RAG-PROMOTE`; feeds `EPIC-COOKBOOK-V1`.

`T-CONTENT-RAG-EN` (P2, **closed**, owner cookbook-author) -- the English locale is delivered as part of the RAG Guide site build: 12 `content/en/*.md` chapters translated with structural parity to the RU originals (code blocks + citations + IE briefs preserved, ASCII punctuation, both ecosystem cross-links per chapter), the `data`/`nav` `{ru,en}` payloads wired, and i18n live on all 12 pages with bilingual RU/EN verified in-browser. Closed on 2026-06-14 with NO separate release tag -- EN ships WITH the RAG Guide site milestone (the `vX.Y.Z` tag belongs to `T-RECIPE-RAG-SITE`, pending user authorization).

## Code-block system

`T-RECIPE-RAG-CODEBLOCKS` (P1, **closed -- DONE / verified**, lead owner interactive-engineer) -- the unified, hand-rolled (ZERO-dependency) vanilla code-block system for the RAG Guide is **built, verified, and reviewed green**: a syntax highlighter (python/json/sql/bash/plaintext) in the Atlas dark-plate style, a hover/focus bilingual annotation popover layer over line-range regions, and a bilingual `{ru,en}` line-aligned code model, rolled across all code pages (payload-anatomy got the highlighter ONLY under its existing click-card drill, as specced). Multi-agent collaborative build (interactive-engineer lead + recipe-site-architect for code CSS tokens + cookbook-author for bilingual code/annotation copy + site-builder for the page roll-out), with a verbatim file-ownership map in the task card so parallel agents never collided. **Verification:** harness code-block system **190/190 PASS** (Vcb1-9 + Pcb1-4); 6-agent adversarial review + fix loop closed **2 blockers** (token-color class collision on what-rag/search; 100-file publish cap) + **2 majors** (focus-ring contrast 2.89 -> 6.47:1; section-CSS plate-token override) + **9 minors**; data files consolidated **16 -> 1** (folder now **89 publishable files**); zero external requests; WCAG AA token contrast on the plate; no-JS + reduced-motion fallbacks; both ecosystem cross-links per page. Release stayed user-gated -- **no `vX.Y.Z` tag, no publish, no commit recorded** (intentionally absent). Two out-of-scope findings filed to backlog: `BUG-INTERACTIVE-PROCESS-ANIM-REDUCED-MOTION` (embedding `process-anim` V3 reduced-motion width bug, pre-existing) and `T-CI-PUBLISH-SCOPE-FILTER` (exclude dev-only files from the publish set; blocks future live publish). Card: [`board.md`](board.md) Closed row / `closed/T-RECIPE-RAG-CODEBLOCKS.md`.

## SEO + versioning + bilingual-flip hardening

`EPIC-RAG-SEO-VERSIONING` (P1, **closed -- shipped under `v0.1.0`**, owner manager) -- the RAG Guide
hardening pass on top of the staged site is DONE, and the first curated milestone is **tagged `v0.1.0`**
(commit SHA `68ddcab`, pushed). All six children closed in the same change: `T-CONTENT-RAG-BILINGUAL-FLIP`
(cookbook-author) flipped the served default to EN-primary -- the static, crawler-visible, no-JS prose is
now English on all 12 pages with RU as the toggle alternate; `T-INTERACTIVE-RAG-LANG-URL` (interactive-engineer)
made RU reachable via a shareable, deep-linkable `?lang=ru` URL with toggle writeback + persistence on the
shared `i18n.js` lang store (i18n-URL 66/66 PASS); `T-PLATFORM-RAG-VERSIONING` (recipe-site-architect) added
no-build versioning (`version.json` + footer stamp + `stamp-version.mjs`, all stamped `v0.1.0`; version-footer
36/36 PASS); `T-SEO-RAG-FULL` (site-builder) landed full per-page SEO on every page
(meta/canonical/hreflang/og/twitter/JSON-LD/robots/favicon/theme-color/og-image + favicon set + sitemap.xml;
SEO 168/168 PASS); `T-CI-RAG-PUBLISH-SCOPE` (release-engineer) added the deterministic publish-scope filter
(`.brewpageignore`, published set 84 files / 1.69 MB) and **resolved** the old backlog item
`T-CI-PUBLISH-SCOPE-FILTER` (filter built); and `T-RECIPE-RAG-V010-TAG` (release-engineer) cut the unprefixed
`v0.1.0` milestone tag. Verification: harness 706 PASS / 6 accepted-minor FAIL (RU no-JS interactive-host data
fallbacks), 0 blocker / 0 major. Scope boundary held: the outward publish to brewpage.app stayed
**user-gated** -- `v0.1.0` is the milestone marker only; live publish remains pending user authorization
(tracked on `T-RECIPE-RAG-SITE`). Accepted-minors deferred to backlog `M-INTERACTIVE-RAG-NOJS-EN-POLISH`
(no-JS EN fallbacks for interactive hosts + cat-table + bilingual lang-toggle aria-label + `.brewpageignore`
self-exclude -- none blockers). Fed `EPIC-COOKBOOK-V1`.

## Post-review + first live deploy

`EPIC-RAG-REVIEW-DEPLOY` (P1, **closed -- shipped LIVE under `v0.1.1`**, owner manager) -- the user
opened the publish gate; this umbrella ran the RAG Guide post-review + FIRST LIVE DEPLOY round on top
of the staged `v0.1.0` site and is now DONE. All four children + the staged `T-RECIPE-RAG-SITE` closed
in the same change. `T-CONTENT-RAG-REVIEW` (cookbook-author + site-builder) post-reviewed all guide
text for facts/links/SEO -- EN first then RU -- and applied fixes in place (review SHA `d99fbab`);
`T-CI-RAG-PUBLISH-WORKFLOW` (github-actions-engineer) authored `.github/workflows/publish-recipe.yml`
(unprefixed `v*.*.*` trigger, `brewpage-action@v1.1.1` PUT against the bootstrapped site id, GitHub
Release linking the live URL; exact-pinned `uses:`, masked token, least-privilege permissions,
concurrency; publish infra `64173b5`, zip-fix `317a685`); `T-RECIPE-RAG-LIVE-PUBLISH` (release-engineer)
did the first live publish -- direct-REST bootstrap CREATE, owner token to repo secret
`BREWPAGE_OWNER_TOKEN_RAG_GUIDE` (masked, never committed), site id recorded in `.brewpage-site.json`
(`82b9586`), stamp-url (`e4bb5d7`), then the `v0.1.1` release that ran the workflow's PUT update for a
stable link; `T-RECIPE-RAG-LIVE-VERIFY` (interactive-engineer + general-purpose/Playwright) confirmed
publish run `27544416117` GREEN + Release `v0.1.1` links the live URL, and that
**https://brewpage.app/public/FsOfbLP4df** renders EN-default + RU toggle, footer `v0.1.1`, real-id SEO
meta + og:image 200, zero recipe-origin external requests, harness 712/0, PUT kept the SAME id. The
link is on the renew-on-release model (ttl 30, expires 2026-07-15; release within 30 days to keep it
alive -- no cron this round). Fed `EPIC-COOKBOOK-V1`.

## V1 milestone

`EPIC-COOKBOOK-V1` (P1, todo) -- umbrella for V1: platform up + first recipe live on brewpage.app. Its core deliverable -- a reader can open the RAG Guide as a working interactive artifact on the live site -- is now MET: the RAG Guide is LIVE at https://brewpage.app/public/FsOfbLP4df under `v0.1.1` (commit `317a685`), EN-primary, SEO-complete, version-stamped, publish-scope filtered, verified GREEN. The first-live-deploy round (`EPIC-RAG-REVIEW-DEPLOY`) + `T-RECIPE-RAG-SITE` closed under `v0.1.1`; the hardening epic `EPIC-RAG-SEO-VERSIONING` closed under `v0.1.0`. This epic stays queued pending a manager review to confirm the V1 definition-of-done and to scope ongoing link-keepalive (release within 30 days, next deadline 2026-07-15) + the next cookbook recipes.
