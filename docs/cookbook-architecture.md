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

## 5. Publishing pipeline

**Trigger:** every push to `main`.

**Flow:** `git push origin main` -> publish the recipe's **static folder directly** to BrewPage **as a multi-file site**. There is no build and no `dist/` -- the files in `recipes/<slug>/` are exactly what gets hosted.

A recipe is a multi-file static bundle (HTML/CSS/JS/assets), so it is published as a BrewPage **multi-file site**, not as a single HTML page.

### Publish mechanism -- preference order

Pick the highest available mechanism; fall back only as needed:

1. **`brewpage-action`** (preferred -- dogfood). [`kochetkov-ma/brewpage-action@v1`](https://github.com/kochetkov-ma/brewpage-action), used once released. This repository is the action's **first production consumer**, so using it here is deliberate dogfooding of the ecosystem's own publish tooling.
2. **`brewpage` CLI** -- `npx brewpage publish-site ./recipes/<slug>`. Used while the action is still pre-release.
3. **Direct REST** against `https://brewpage.app` -- **last resort** only, when neither the action nor the CLI is viable.

### Owner tokens & secrets

- Each recipe has its own BrewPage **owner token**, stored as a GitHub repo secret named **`BREWPAGE_OWNER_TOKEN_<RECIPE>`** (one per recipe).
- **Never commit owner tokens.** They live only as masked repo secrets, are injected at CI time, and must never appear in source, logs, or recipe content.

When the BrewPage REST API changes upstream: re-read `brewpage-openapi/openapi/openapi.yaml`, update any code that calls REST directly, and bump recipe metadata if any visible behaviour changed.

> **Republish vs recreate.** To update an already-published recipe, use `PUT /api/sites/{ns}/{id}` (full-replace republish: swaps the whole file set, keeps the same URL + id, requires `X-Owner-Token`). DELETE-then-POST mints a new id/URL and is **not** how we update -- see `docs/brewpage-platform.md`.

### Publish-scope filter (deterministic bundling)

The repo folder `recipes/<slug>/` carries more than the live site: manuscript (`content/`), mockups (`mokups/`), design docs (`*.md`), build scripts (`*.py`), agent state (`.claude/`), and authoring-time HTML partials (`shared/components/`). Publishing the raw folder would blow past the BrewPage site caps (**< 100 files / < 20 MB total / < 5 MB per file**). So the published bundle is **filtered, not the raw folder**.

- **Filter file:** each recipe carries a **`recipes/<slug>/.brewpageignore`** (gitignore-style globs). It lists DEV-ONLY paths to exclude; everything else ships. This is repo-keeping vs publish-scope -- excluded files stay in git, they just do not upload.
- **Deterministic bundling procedure (what CI applies):**
  1. `cd recipes/<slug>/`.
  2. Build the upload manifest = all files under the folder **minus** the `.brewpageignore` glob matches (and minus the `.brewpageignore` file itself).
  3. Assert the caps before upload: **count < 100**, **total bytes < 20 MB**, **max single file < 5 MB**. Fail the run if any cap is exceeded -- never publish a partial/over-cap bundle.
  4. Upload that exact manifest via the active mechanism (direct REST today; `brewpage` CLI / `brewpage-action` once released). With direct REST, send the manifest as the `files`+`paths` arrays (or a ZIP built from the manifest) to `POST /api/sites` (first publish) or `PUT /api/sites/{ns}/{id}` (republish).
- **What is excluded** (every depth): `.claude/`, `content/`, `mokups/`, all `*.md`, all `*.py`, `scripts/`, `*.log`, `*.bak`/editor junk, `.gitkeep`, **`shared/components/`** (authoring-time copy-in partials -- their markup is inlined into each page; nothing fetches them at runtime), and design-source `*.svg` whose rasterized counterpart is what the site references (e.g. `shared/og/og-rag-guide.svg`; **`favicon.svg` is kept** because the pages reference it).
- **What is kept** (audited against actual runtime imports/fetches): all `*.html` pages, `shared/css/**`, `shared/js/**`, `shared/data/**` (the JSON + JS the pages import or fetch), `shared/og/*.png|ico`, `favicon.*`, `sitemap.xml`.
- **RAG Guide as built (2026-06-14):** raw folder ~137 files; filtered published set = **84 files / 1.69 MB / largest single 0.16 MB** -- all three caps satisfied with margin. Resolves board task `T-CI-RAG-PUBLISH-SCOPE` (was `T-CI-PUBLISH-SCOPE-FILTER`).

---

## 6. Release flow

The cookbook is **content-first**: most changes ship on merge, and tags mark curated milestones rather than gating every publish.

| Event | What ships |
|---|---|
| **Content-only PR merged to `main`** | Ships straight to the live URL on merge (via the §5 pipeline). No tag required. |
| **Tag bump** | Marks a curated milestone (e.g. a complete recipe ships). |

**Tag format:** tags are **unprefixed `vX.Y.Z`** -- `v0.1.0`, `v1.0.0` -- matching the rest of the BrewPage ecosystem.

**Version handling:** the tag is the single source of truth for the released version. There is no `package.json` to keep in sync -- a tag simply marks the commit that a curated milestone shipped from.

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
