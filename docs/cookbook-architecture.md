# Cookbook Architecture & Pipeline

The architecture, build stack, recipe lifecycle, publishing pipeline, and release flow for the **BrewPage Cookbook**. Engineering reference; for writing voice and the per-recipe Definition of Done, see [`docs/recipe-authoring.md`](./recipe-authoring.md).

---

## 1. Identity

The BrewPage Cookbook is a **standalone editorial brand under the BrewPage ecosystem** -- not a docs folder, not a marketing site, but an open-source collection of interactive recipes (guides, demos, mini-apps, games) for AI artifact workflows. Each recipe is a self-contained interactive artifact you can read, play with, and learn from, published live on [brewpage.app](https://brewpage.app).

It has its own release cadence, independent of the BrewPage REST API contract.

**Precedent:** [`anthropic-cookbook`](https://github.com/anthropics/anthropic-cookbook) (interactive AI guides) and Stripe Press (a standalone editorial brand under a developer platform). The cookbook plays the same role for BrewPage: a curated, branded body of work that demonstrates the platform without being the platform.

**Target:** roughly **40 recipes** over time, covering AI artifact patterns, agent workflows, content hosting, and MCP integrations. The first recipe is the long-form interactive **RAG Guide** (plan: [`.claude/features/specs/T-RECIPE-RAG-GUIDE.md`](../.claude/features/specs/T-RECIPE-RAG-GUIDE.md)), which doubles as the production dogfood for the publish pipeline.

This repository is **one module** in the BrewPage ecosystem. It knows about only two external surfaces: the [brewpage.app](https://brewpage.app) platform (the publish target) and the [`brewpage-openapi`](https://github.com/kochetkov-ma/brewpage-openapi) coordination repo (the REST contract source of truth). All other ecosystem modules are intentionally invisible from here -- link to their public package docs; never wire cross-repo agent calls.

---

## 2. Stack

The stack is deliberately the **simplest possible**: plain static HTML, a little vanilla JavaScript, and one hand-written CSS file. There is **no framework, no bundler, and no build step** -- recipes ship exactly as authored. About **90% of a recipe is plain HTML**; vanilla JS is added only where real interactivity is needed.

| Layer | Choice | Role |
|---|---|---|
| Markup | **Plain static HTML** | One `.html` file per page; the bulk of every recipe |
| Interactivity | **Minimal vanilla JavaScript (ES modules)** | `<script type="module">`; added only where real interactivity is needed |
| Styling | **One small hand-written CSS file** | CSS variables for theming; no utility framework, no component library |
| Diagrams | **Inline SVG or static images** | Drill-down diagrams drawn by hand or exported once; no diagram build step |
| Client-side search | **Tiny vanilla JS over a small JSON index** | In-browser full-text search across a recipe; no server round-trip, no search build |

No `package.json`, no MDX, no TypeScript-strict requirement. There is nothing to install at scaffold time beyond writing the shared layout HTML and the single CSS file.

### Version pinning discipline

The repo has no dependency tree of its own, but any **third-party JS or CSS loaded from a CDN must be pinned to an exact semver** (`X.Y.Z`) in the `<script src>` / `<link href>` URL. The same rule covers any Docker base image and any GitHub Action used by the publish workflow.

**Forbidden anywhere:** `@latest`, `:latest`, `:stable`, `:edge`, `@main`, caret ranges (`^x.y`), tilde ranges (`~x.y`), or any floating / unverified tag. Applies to `<script src>` / `<link href>` CDN URLs, Dockerfile `FROM` lines, and GitHub Actions `uses:` references.

**Why:** a recipe served today must render identically next month. Floating versions silently break a page when upstream ships a major (a real precedent in the wider BrewPage ecosystem: a `@latest` CDN pin broke a docs site on a Scalar release).

**Procedure when adding or bumping a CDN dependency:** fetch the exact current stable from the canonical registry, then pin that exact `X.Y.Z` in the URL. Re-verify quarterly or on major upstream news.

> This document deliberately names **no concrete version numbers** for any CDN dependency, because they must be resolved against the registry at the time of use. Do **not** guess a version -- verify first (procedure: `.claude/rules/versions.md`).

---

## 3. Repository layout

```
brewpage-cookbook/
  README.md              -- human-facing overview + recipe index
  CLAUDE.md              -- project identity for Claude Code (LLM-facing)
  LICENSE                -- Apache-2.0
  .gitignore
  docs/                  -- engineering & authoring references
    cookbook-architecture.md   -- this file
    recipe-authoring.md        -- voice + Definition of Done
  features/              -- per-recipe plans (one short plan per recipe, written before drafting)
    01-rag-guide.md
  recipes/               -- one self-contained static folder per recipe (HTML/CSS/JS/assets)
    rag-guide/
      index.html
  .claude/
    agents/              -- domain agents (cookbook-author, site-builder, interactive-engineer, ...)
    features/            -- task board (canonical work list) + per-task tracking
    rules/               -- auto-loaded coding/content/version rules
    teams/brewpage-cookbook/
      team.md            -- agent team definition (6 agents)
```

Two parallel "plan" surfaces, with distinct scopes:

- **`.claude/features/specs/<TASK-ID>.md`** -- per-task editorial design specs, one per recipe (goal, scope, milestones, open questions, Definition of Done). Authored by `cookbook-author`, linked from the matching task card. Written before drafting.
- **`.claude/features/`** -- the operational **task board** (canonical work list across the whole repo); `specs/` holds the per-task design specs above. See §8.

---

## 4. Recipe lifecycle

Each recipe moves through a fixed sequence -- there is no migration or build stage:

```
PLAN                          AUTHOR                       PUBLISH
.claude/features/specs/   ->  recipes/<slug>/          ->  live on
<TASK-ID>.md                  index.html + css/js/svg      brewpage.app
                              (static HTML/CSS/JS)         (multi-file site, no build)
```

1. **Plan** -- write `.claude/features/specs/<TASK-ID>.md`: goal, audience, scope, interactivity targets, milestones, open questions, Definition of Done.
2. **Author** -- build the recipe directly as static files in `recipes/<slug>/`: `index.html` (and any further `.html` pages), the shared CSS file, vanilla-JS modules for any interactivity, and inline-SVG / image assets. There is no intermediate format and nothing to compile; what you write is what ships.
3. **Publish** -- the static folder is published to BrewPage as a multi-file site (see section 5).
4. **Mark SHIPPED** -- when the recipe is live, mark its `.claude/features/specs/<TASK-ID>.md` plan `SHIPPED`, add/refresh its entry in the `README.md` recipe index and the `recipes/` table, and pin the live URL.

**Drift checklist on ship** (files that fall out of sync if you forget): `recipes/<slug>/` (the static folder -- HTML, CSS, JS, assets), the `README.md` recipe index entry, the CI publish step (if the recipe gets its own URL or secret), and the `.claude/features/specs/<TASK-ID>.md` status flipped to `SHIPPED`.

---

## 5. Publishing pipeline (WORKING -- as built 2026-06-15)

**Status:** LIVE. The RAG Guide is the first production publish -- **https://brewpage.app/public/FsOfbLP4df** -- shipped through the working workflow below. The publish path is now **`brewpage-action`**, no longer direct-REST for updates.

**Trigger:** push of an unprefixed semver tag **`vX.Y.Z`** (+ manual `workflow_dispatch`). NOT every push to `main` -- a tag marks each publish. Workflow: [`.github/workflows/publish-recipe.yml`](../.github/workflows/publish-recipe.yml).

A recipe is a multi-file static bundle (HTML/CSS/JS/assets), published as a BrewPage **multi-file site**. There is no build and no `dist/` -- the files in `recipes/<slug>/` are exactly what gets hosted (after the publish-scope filter below).

### Publish mechanism (resolved -- action, not REST)

- **`brewpage-action`** -- the working mechanism, pinned **exact** to **[`kochetkov-ma/brewpage-action@v1.1.1`](https://github.com/kochetkov-ma/brewpage-action)** (annotated tag, never `@v1`/`@main`). This repo is the action's first production consumer (deliberate dogfood).
- **Direct REST** against `https://brewpage.app` -- now used **only** for the one-time bootstrap CREATE (below). All subsequent updates go through the action.
- The `brewpage` CLI fallback is not needed -- the action works.

### Bootstrap CREATE (one-time, per recipe)

Run **once** to mint the stable id + link + owner token:

1. `POST /api/sites?ns=public&ttl=30` with a **zip bundle** (the publish-scope set, zipped) -> returns `{ id, link, ownerToken }`.
2. The **owner token** goes straight to repo secret **`BREWPAGE_OWNER_TOKEN_RAG_GUIDE`** -- never committed, never logged, **unrecoverable if lost**.
3. The **non-secret** `{ namespace, id, link }` is committed to **`recipes/rag-guide/.brewpage-site.json`** (feeds stamp-url + the workflow's `update-id`). A private, gitignored `.claude/brewpage-history.md` records the same id/ns/link for human reference.

### Tag-triggered UPDATE flow (every release thereafter)

Pushing a `vX.Y.Z` tag runs the workflow:

1. **stamp-version** (`.claude/scripts/stamp-version.mjs`) from the tag.
2. **read `.brewpage-site.json`** -> `namespace` / `id` / `link` via `$GITHUB_OUTPUT`.
3. **stamp-url** (`.claude/scripts/stamp-url.mjs`) -- replaces `REPLACE_AT_PUBLISH` with the real id across pages + `sitemap.xml` + `recipes/index.json`.
4. **stage + zip** -- materialise the `.brewpageignore`-filtered set into a staging dir, assert the caps, **ZIP it**.
5. **publish** -- `brewpage-action` publishes the **zip** via PUT, `mode: update`, `update-id: <id>`, `ttl-days: 30`. The link stays stable.
6. **create GitHub Release** -- body carries the live link + the `recipes/index.json` manifest + both ecosystem cross-links. `github.ref_name` drives the tag/name; the workflow creates no tags/commits itself.

> **CRITICAL gotcha -- hand the action a `.zip`, never a directory.** Pointing the action at a directory triggers its `files[]`+`paths[]` array-upload mode, which the brewpage.app site endpoint rejects with a misleading **HTTP 413** ("max 25 MB per file") even for a ~1.8 MB bundle. The zip-archive upload mode is accepted (POST 201 create / PUT 200 update). The workflow zips the staged bundle before calling the action. (`brewpage-action@v1.1.1` sends a single `archive` field when `path` ends in `.zip`.)

> **Platform-contract gap (flagged to platform owners):** PUT `/api/sites/{ns}/{id}` can return 413 on the array-upload path though the openapi contract models only 400/403/404/410/415/429; the cookbook uses zip to avoid it.

### Link permanence / TTL (renew-on-release)

BrewPage caps `ttl` at **30 days** and **auto-deletes at expiry**. Each publish sets `ttl=30`, so the stable link survives **only if a release happens at least every 30 days** (renew-on-release). There is **no scheduled cron renewal** currently. Current expiry: **2026-07-15** -- the next release before then keeps the link alive.

### Owner tokens & secrets

- Owner token = **secret only** (`BREWPAGE_OWNER_TOKEN_RAG_GUIDE`); never in source, logs, or recipe content; unrecoverable if lost. The action calls `core.setSecret` before any emission, masking its token output.
- id + namespace + link = committed **`.brewpage-site.json`** (non-secret) + the gitignored `.claude/brewpage-history.md` record.

### Publish-scope filter (deterministic bundling)

The repo folder `recipes/<slug>/` carries more than the live site: manuscript (`content/`), mockups (`mokups/`), design docs (`*.md`), build scripts (`*.py`), agent state (`.claude/`), and authoring-time HTML partials (`shared/components/`). `brewpage-action` does **not** filter, so the workflow pre-bundles. Publishing the raw folder would blow past the BrewPage site caps (**<= 100 files / 20 MB total / 5 MB per file**).

- **Filter file:** each recipe carries a **`recipes/<slug>/.brewpageignore`** (gitignore-style globs) listing DEV-ONLY paths to exclude; everything else ships. Excluded files stay in git, they just do not upload. The workflow's `rsync --exclude` set mirrors it 1:1.
- **Procedure (what the workflow applies):** stage the filtered set -> assert caps (**count < 100**, **total < 20 MB**, **max single < 5 MB**, and **not empty**); fail loudly otherwise -> **zip the staged set** -> hand the `.zip` to the action.
- **What is excluded** (every depth): `.claude/`, `content/`, `mokups/`, all `*.md`, all `*.py`, `scripts/`, `*.log`, `*.bak`/editor junk, `.gitkeep`, `.brewpageignore`, **`shared/components/`** (authoring-time copy-in partials -- inlined into each page; nothing fetches them at runtime), and design-source `*.svg` whose rasterized counterpart is what the site references (`shared/og/og-rag-guide.svg`; **`favicon.svg` is kept** -- pages reference it).
- **What is kept** (audited against actual runtime imports/fetches): all `*.html` pages, `shared/css/**`, `shared/js/**`, `shared/data/**`, `shared/og/*.png|ico`, `favicon.*`, `sitemap.xml`.
- **RAG Guide as built (2026-06-15):** filtered published set = **84 files / ~1.72 MB / largest single < 5 MB** -- all three caps satisfied with margin.

---

## 6. Release flow

A **tag drives every publish**: pushing an unprefixed `vX.Y.Z` tag runs the §5 workflow (publish + GitHub Release). PR/merge to `main` alone does **not** publish -- it only lands content; the publish happens when the next tag is pushed (this also renews the 30-day TTL, see §5).

| Event | What happens |
|---|---|
| **PR merged to `main`** | Lands content. No publish, no tag. |
| **`vX.Y.Z` tag pushed** | Runs `publish-recipe.yml`: site UPDATE via `brewpage-action` (stable link) + GitHub Release. Also renews TTL. |

**Tag format:** **unprefixed `vX.Y.Z`** -- `v0.1.0`, `v1.0.0` -- matching the rest of the BrewPage ecosystem. The workflow consumes `github.ref_name` and creates **no** tags/commits itself.

**Local tag flow (human/manager, outside CI):** one chained command -- check last tag -> `git tag vX.Y.Z` -> add/commit -> push commit + tag together (`git push origin main && git push origin vX.Y.Z`).

**Version handling:** the tag is the single source of truth; `stamp-version.mjs` stamps it at CI time -- do not hand-edit any version file.

---

## 7. Interactivity toolkit

Every recipe must include at least one interactive element. Each element is a small piece of vanilla JavaScript wired to plain HTML; reusable snippets are shared as plain JS modules under the recipe folder (organisation settled by the `site-builder` / `interactive-engineer` agents). The toolkit:

- **Drill-down diagrams** -- inline-SVG diagrams the reader can drill from system to container to component level, with vanilla-JS show/hide on click.
- **Mini-games** -- short interactive challenges (e.g. "spot the bug", "tune the parameter" sliders with a live quality score).
- **Calculators** -- live numeric tools that respond to reader input.
- **Sandboxes / code playgrounds** -- runnable, editable code (client-side preferred for cost and privacy).
- **Client-side search** -- in-browser full-text search across the whole recipe (tiny vanilla JS over a small JSON index), no server round-trip.

---

## 8. Canonical work list & authoring reference

- **Task board (canonical work list):** [`.claude/features/board.md`](../.claude/features/board.md). Single source of truth for what work is in flight across the repo; folder/status conventions and the tracking procedure live alongside it under `.claude/features/`. Per-recipe editorial plans live as per-task design specs under `.claude/features/specs/` (`.claude/features/specs/<TASK-ID>.md`; see §3).
- **Recipe authoring (voice + Definition of Done):** [`docs/recipe-authoring.md`](./recipe-authoring.md) -- the editorial standard every recipe must meet (concrete-problem opening, real working code, at least one interactive element, cited sources, a "try it yourself" / "next steps" close, and the per-recipe DoD).
