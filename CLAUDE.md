# CLAUDE.md

[DICT: BP=BrewPage, CA=cookbook-author, IE=interactive-engineer, RE=release-engineer, SB=site-builder, TT=task-tracker, GAE=github-actions-engineer]

LLM-facing brief + index for **brewpage-cookbook**. Read this first; lazy-load docs below only when task touches their topic. English only. ASCII punctuation only (straight quotes, hyphens, three-dot `...`); no smart quotes / em-dashes / Unicode.

## 1. Identity

**BP Cookbook** -- standalone editorial brand under the BP ecosystem (precedent: `anthropic-cookbook`, Stripe Press). Open-source collection of **interactive recipes** (guides, demos, mini-apps, games) for AI artifact workflows. Each recipe = self-contained folder of plain static HTML + a little vanilla JS, published **live on `brewpage.app`** as a multi-file site -- no build step. Own release cadence, independent of the BP REST contract. Target **~40 recipes** over time; first = long-form **RAG Guide** (dogfood for the publish pipeline). Status: **SCAFFOLD** (pre-release, no prod tag yet). Repo: `kochetkov-ma/brewpage-cookbook`. Bootstrapped 2026-05-21.

## 2. Doc Index (lazy-load)

| Doc | Load when | Path |
|-----|-----------|------|
| Platform reference (limits, endpoints, namespaces, publishing, owner-token/TTL, embeds/CSP) | any question about what/how BP hosts or how to publish | `docs/brewpage-platform.md` |
| Ecosystem map (full local-path + GitHub-URL repo map, contract source of truth) | locating sibling repos, action/CLI/MCP routing, cross-link sourcing | `docs/ecosystem.md` |
| Cookbook architecture (stack, repo layout, recipe lifecycle, publish pipeline, release flow) | scaffold/build/stack, pipeline, release decisions | `docs/cookbook-architecture.md` |
| Recipe authoring (voice, structure template, citation, handoff brief, Definition of Done) | writing/editing any recipe content | `docs/recipe-authoring.md` |
| RAG Guide design system (Atlas tokens, component catalog, lib decomposition, as-built module map, do-not rules) | building/editing the RAG Guide site or its theme/components | `recipes/rag-guide/AtlasMD.md` |

Per-recipe editorial plans live as per-task design specs in `.claude/features/specs/<TASK-ID>.md` (e.g. `.claude/features/specs/T-RECIPE-RAG-GUIDE.md`), authored by `CA` and linked from the matching task card.

`AtlasMD.md` is the canonical RAG Guide design-system doc (supersedes `mokups/DESIGN-ATLAS.md`, kept only as the landing derivation note). `RATING.md` and the metro variant were removed -- metro archived under `recipes/rag-guide/mokups/_rejected/`. Site draft lives at `recipes/rag-guide/`: `index.html` Atlas MAP landing + 3 section pages (`what-rag.html`, `why-rag.html`, `search.html`) on the shared `shared/` lib (css themes + component partials + `js/lib` modules + `js/pages` glue).

## 3. Task tracking flow

`.claude/features/board.md` = **canonical task list + status**. Folder == status: `backlog/` → `todo/` → `progress/` (task file MANDATORY) → `closed/`; `specs/` holds per-task design specs. No root `TODO.md` -- never create one. Ship-state prose = `.claude/features/STATUS.md` (board links it, no duplication). IDs: UPPER-KEBAB `<PREFIX>-<DOMAIN>-<SLUG>` (`T-`/`BUG-`/`M-`/`EPIC-`; domain in `{RECIPE, PLATFORM, CONTENT, INTERACTIVE, CI, DOCS, SEO}`).

**Bookend rule (`.claude/rules/tasks.md` R1/R2):**
- **R1 / FIRST sub-task -> claim:** move file `todo/ -> progress/`, set `status: progress` + `owner`, bump `updated`, move board row Todo->Progress, fix counts + current focus.
- **R2 / LAST sub-task -> reconcile + close:** move file `progress/ -> closed/`, set `status: closed`, reconcile `board.md` + `STATUS.md`, record **unprefixed `vX.Y.Z` tag + commit SHA** in `## Notes`, fix counts/focus.

**Never hand-edit `.claude/features/**`** -- delegate every board transition to `TT` agent. Full procedure: `.claude/features/TRACKER.md`.

## 4. Agent index

Seven agents under `.claude/agents/`. All model `opus`. `TT` owns the board; `brewpage-platform-expert` is read-only (no Edit/Write); the other five own writes in their domain and delegate every board move to `TT`.

| Agent | Role | When to use |
|-------|------|-------------|
| `CA` | Recipe content -- plans, drafts, edits, ships `recipes/**` + `.claude/features/specs/**`; voice + citations | recipe content, draft, outline, edit, voice, source, citation, editorial pass |
| `SB` | Site scaffold + shared static structure; shared layout HTML, the one CSS file, search wiring, CDN deps | scaffold, layout, shared html, css, client-side search, dependency, cdn, css-variables decision |
| `IE` | Builds every interactive element (C4 drill-down, mini-games, sandboxes, visualisers); reusable vanilla-JS snippets | interactive, component, c4, svg, drill-down, mini-game, sandbox, visualiser, slider, playground |
| `brewpage-platform-expert` | **Read-only adviser** on BP REST/CLI/MCP/action, namespaces, owner-tokens, TTL, SEO/growth; routes edits to write agents | publish-site, namespace, owner-token, password, ttl, brewpage-action, brewpage cli, mcp, anchor cluster, seo |
| `RE` | CI/CD -- `.github/workflows/*.yml`, tag flow, brewpage-action integration, secret masking, version sync; COOKBOOK recipe-publish to brewpage.app | publish step, deploy-on-main, owner-token publish, recipe publish pipeline |
| `GAE` | Deep GHA / CI-CD authoring across brewpage-* -- workflows, custom node24 actions (`action.yml`+dist/), reusable/composite, matrix, release/tag flow, Marketplace; owns `brewpage-action` machinery | github actions, workflow, action.yml, composite/reusable workflow, workflow_call, matrix, cache, concurrency, permissions, GITHUB_OUTPUT, OIDC, check-dist, dist drift, release.yml, marketplace, semver tag |
| `TT` | **Owns `.claude/features/**` board** (scoped writer: writes only inside `features/`) -- claim/move/close, groom backlog, keep `board.md` in sync | add/move/close task, claim, ship recipe, groom backlog, board status, tracker |

Team definition (source of truth for roles, build order, expansion): `.claude/teams/brewpage-cookbook/team.md`. Cross-team / cross-repo agent calls are forbidden.

## 5. Stack (simplest plain-HTML; no build step)

Deliberately the simplest stack: **plain static HTML + minimal vanilla JavaScript (ES modules) + ONE small hand-written CSS file.** No framework, no bundler, no build step, no MDX, no TypeScript-strict requirement. About **90% of a recipe is plain HTML**; vanilla JS is added only where real interactivity is needed.

| Layer | Choice |
|-------|--------|
| Markup | Plain static HTML (one file per page) |
| Interactivity | Minimal vanilla JavaScript, ES modules (`<script type="module">`) |
| Styling | ONE small hand-written CSS file using CSS variables |
| Diagrams | Inline SVG or static images |
| Client-side search (if any) | Tiny vanilla JS over a small JSON index |
| Build | None -- files ship exactly as authored |

Each recipe = a **self-contained folder of static files** published directly to BP as a multi-file site (limits 20 MB total / 100 files / 5 MB per file). No `dist/`, no compile.

**Shared-lib + theme-as-a-file model (proven by `recipes/rag-guide/`):** one shared library per recipe site (`shared/css|components|data|js`); a variant/theme is ONE CSS-variables file (`shared/css/themes/<name>.css`) and swapping it is a one-`<link>` reskin -- `base.css` is never forked. `base.css` holds structure + shared component/utility classes and references vars only for color/space/motion; themes supply the values. Lib JS = single-responsibility ES modules under `shared/js/lib/` each exporting `init(rootEl, config) => { destroy() }`; page glue under `shared/js/pages/` wires them onto documented hosts. Inline-SVG diagrams, transform/opacity-only motion gated by IntersectionObserver + `prefers-reduced-motion`, full no-JS degradation. Prose is md-as-source (`content/<lang>/*.md`), hand-ported to static HTML (strategy A). Authoritative spec: `.claude/rules/site-architecture.md`.

**Third-party JS/CSS:** load from a CDN pinned to an **exact `X.Y.Z`**. Forbidden anywhere: `@latest`, `:latest`, `:stable`, `:edge`, `@main`, caret `^x.y`, tilde `~x.y`, any floating tag. No version numbers pinned here yet -- resolve each from its registry before use (procedure: `.claude/rules/versions.md`). Do **not** guess a version. (Precedent: a Scalar `@latest` CDN pin broke a sibling docs site.)

## 6. Publishing pipeline + release flow

**Pipeline:** every push to `main` -> publish the recipe's **static folder directly** to BP **as a multi-file site** (no build, no `dist/`). Site limits the folder must fit: 20 MB total / 100 files / 5 MB per file.

**Publish mechanism (preference order, fall back as needed):**
1. `brewpage-action` -- preferred (dogfood; this repo is its first production consumer); `kochetkov-ma/brewpage-action@v1`, used once released.
2. `brewpage` CLI -- `npx brewpage publish-site ./recipes/<slug>`, while action is pre-release.
3. Direct REST against `https://brewpage.app` -- last resort.

> **Reality (as of 2026-06-04):** `brewpage-action` and the `brewpage` CLI are planned, not yet released -- so today the only working publish path is **direct REST**. Re-check `docs/ecosystem.md` for release status before relying on the Action/CLI.

**Owner tokens:** each recipe has its own BP owner token, stored as GitHub repo secret `BREWPAGE_OWNER_TOKEN_<RECIPE>`, injected at CI time, masked in logs. **Never commit owner tokens** (never in source, logs, or recipe content); not recoverable.

**Release flow:** content-only PRs ship straight to live URL on merge (no tag); a tag marks a curated milestone (e.g. a complete recipe ships). Tags are **unprefixed `vX.Y.Z`** (`v0.1.0`, `v1.0.0`), matching the BP ecosystem. Do **not** hand-edit `package.json` `version` -- CI (once installed) overwrites it from the tag.

## 7. Ecosystem & links

The cookbook is **one module** in the BP ecosystem with **two external surfaces**: the **live platform** (`https://brewpage.app`) and the **coordination repo** `brewpage-openapi` (REST contract source of truth at `openapi/openapi.yaml`). Never wire cross-repo agent calls, never assume a sibling local clone exists. **Full repo map** (every module's local path + GitHub URL, build order, inference flags): `docs/ecosystem.md`.

| Surface | Local path | GitHub URL |
|---------|-----------|------------|
| This repo (`brewpage-cookbook`) | `~/IdeaProjects/brewpage-cookbook` | https://github.com/kochetkov-ma/brewpage-cookbook |
| Coordination / contract (`brewpage-openapi`) | `~/IdeaProjects/brewpage-openapi` | https://github.com/kochetkov-ma/brewpage-openapi |
| Live platform | -- | https://brewpage.app |
| This module's reference stub | `~/IdeaProjects/brewpage-openapi/modules/cookbook/` | https://github.com/kochetkov-ma/brewpage-openapi/tree/main/modules/cookbook |

## 8. Rules pointer

Auto-loaded from `.claude/rules/`:

| Rule | Covers |
|------|--------|
| `site-architecture.md` | shared-lib + theme-as-a-file model; base.css structure-vs-tokens, lib/page-glue JS contract, data contracts, no-JS + motion policy, folder layout, how-to playbook |
| `versions.md` | pin-exact discipline (npm/CDN/Docker/GHA); registry-verify procedure |
| `github-actions.md` | GHA workflow + custom-action discipline; `uses:` exact-pin + verified action pins, secret masking + `$GITHUB_OUTPUT`, least-privilege permissions + concurrency, node24 dist/-drift, tag-based unprefixed release + major-tag move, inputs/outputs three-file drift; brewpage-action canonical refs |
| `content.md` | recipe content essentials (pointer-level; full guide in `docs/recipe-authoring.md`) |
| `docs.md` | one-doc-per-topic, LLM-dense style, run-artifact + screenshot paths, board-via-`TT` |
| `tasks.md` | condensed task-board rules (board = canonical, folder==status, bookend R1/R2, unprefixed tags) |
| `privacy.md` | public repo -- no platform abuse-defence/anti-spam/moderation internals; UF-level only; `public/` NS shareable only |

**Disclosure protocol (public repo, hard rule):** Never reveal the algorithms or internal logic of the platform's content analysis / abuse defence at ANY level (every scan, check, or moderation layer -- no exception). Describe such behaviour only in general, user-facing terms: no algorithms, no heuristics, no scoring, no thresholds, no numbers, no internal structure (not even how many layers exist). When unsure, omit. Enforced by `.claude/rules/privacy.md`.

## 9. Voice

Recipes are **interactive teaching artifacts**, not blog posts: open with a concrete problem then the runnable solution path, use real working code (no unlabelled pseudocode), include >=1 interactive element, cite every claim to a primary source, close with "try it yourself" / "next steps", ASCII punctuation only, English default. Full voice + structure template + Definition of Done: `docs/recipe-authoring.md`. (`CA` describes interactivity in prose + a handoff brief; `IE` implements it -- do not blur the boundary.)

## 10. Mandatory cross-link rule

Hard rule from `ECOSYSTEM-PLAN.md` (coordination repo): **every `README`, every published recipe page, every package/marketplace listing must back-link to both**:

- https://brewpage.app
- https://github.com/kochetkov-ma/brewpage-openapi

A page missing either link is not done.
