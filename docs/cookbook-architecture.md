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

The stack is deliberately the **simplest possible**: plain static HTML, a little vanilla JavaScript, and a few small hand-written CSS files. There is **no framework, no bundler, and no build step** -- recipes ship exactly as authored. About **90% of a recipe is plain HTML**; vanilla JS is added only where real interactivity is needed.

| Layer | Choice | Role |
|---|---|---|
| Markup | **Plain static HTML** | One `.html` file per page; the bulk of every recipe |
| Interactivity | **Minimal vanilla JavaScript (ES modules)** | `<script type="module">`; added only where real interactivity is needed |
| Styling | **Small hand-written CSS files** | A shared `base.css`, one theme file of CSS variables and one stylesheet per section under `shared/css/`; no utility framework, no component library |
| Diagrams | **Inline SVG or static images** | Drill-down diagrams drawn by hand or exported once; no diagram build step |
| Client-side search | **Tiny vanilla JS over a small JSON index** | In-browser full-text search across a recipe; no server round-trip, no search build |

No MDX, no TypeScript-strict requirement. The root `package.json` is metadata only (name, version, links -- no dependencies, no scripts), so there is nothing to install at scaffold time beyond writing the shared layout HTML and the CSS.

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
  package.json           -- metadata only; `version` is stamped from the tag in CI
  docs/                  -- engineering & authoring references
    brewpage-platform.md       -- platform reference (publish, limits, embeds)
    ecosystem.md               -- ecosystem & repo map
    cookbook-architecture.md   -- this file
    recipe-authoring.md        -- voice + Definition of Done
  recipes/               -- one self-contained static folder per recipe (HTML/CSS/JS/assets)
    index.json                 -- machine-readable recipe index
    rag-guide/
      index.html
  .github/workflows/
    publish-recipe.yml   -- tag-triggered publish + GitHub Release
  .claude/
    agents/              -- domain agents (cookbook-author, site-builder, interactive-engineer, ...)
    features/            -- task board (canonical work list) + per-task tracking
      specs/             -- per-recipe plans (one design spec per recipe, written before drafting)
    rules/               -- auto-loaded coding/content/version rules
    teams/brewpage-cookbook/
      team.md            -- agent team definition (8 agents)
```

Two parallel "plan" surfaces, with distinct scopes:

- **`.claude/features/specs/<TASK-ID>.md`** -- per-task editorial design specs, one per recipe (goal, scope, milestones, open questions, Definition of Done). Authored by `cookbook-author`, linked from the matching task card. Written before drafting.
- **`.claude/features/`** -- the operational **task board** (canonical work list across the whole repo); `specs/` holds the per-task design specs above. See section 8.

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
2. **Author** -- build the recipe directly as static files in `recipes/<slug>/`: `index.html` (and any further `.html` pages), the shared CSS, vanilla-JS modules for any interactivity, and inline-SVG / image assets. There is no intermediate format and nothing to compile; what you write is what ships.
3. **Publish** -- the static folder is published to BrewPage as a multi-file site (see section 5).
4. **Mark SHIPPED** -- when the recipe is live, mark its `.claude/features/specs/<TASK-ID>.md` plan `SHIPPED`, add/refresh its entry in the `README.md` recipe index and the `recipes/` table, and pin the live URL.

**Drift checklist on ship** (files that fall out of sync if you forget): `recipes/<slug>/` (the static folder -- HTML, CSS, JS, assets), the `README.md` recipe index entry, the CI publish step (if the recipe gets its own URL or secret), and the `.claude/features/specs/<TASK-ID>.md` status flipped to `SHIPPED`.

---

## 5. Publishing pipeline (WORKING -- as built 2026-06-15)

**Status:** LIVE. The RAG Guide is the first production publish -- **https://brewpage.app/public/FsOfbLP4df** -- shipped through the working workflow below. The publish path is now **`brewpage-action`**, no longer direct-REST for updates.

**Trigger:** push of an unprefixed semver tag **`vX.Y.Z`** (+ manual `workflow_dispatch`). NOT every push to `main` -- a tag marks each publish. Workflow: [`.github/workflows/publish-recipe.yml`](../.github/workflows/publish-recipe.yml).

A recipe is a multi-file static bundle (HTML/CSS/JS/assets), published as a BrewPage **multi-file site**. There is no build and no `dist/` -- the files in `recipes/<slug>/` are exactly what gets hosted (after the publish-scope filter below).

### Publish mechanism (resolved -- action, not REST)

- **`brewpage-action`** -- the working mechanism, pinned **exact** to **[`kochetkov-ma/brewpage-action@v1.2.0`](https://github.com/kochetkov-ma/brewpage-action)** (annotated tag, never `@v1`/`@main`). This repo is the action's first production consumer (deliberate dogfood).
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
3. **stamp-url** (`.claude/scripts/stamp-url.mjs`) -- requires the descriptor's server `link` and replaces complete placeholder URL bases across pages + `sitemap.xml`; copies that link to both index URL fields. Root, child, asset and query URLs retain their suffixes for OLD apex links or NEW trailing-slash native roots. Already-published URLs are preserved; repeated stamping is byte-identical.
4. **stage + zip** -- materialise the `.brewpageignore`-filtered set into a staging dir, assert the caps, **ZIP it**.
5. **publish** -- `brewpage-action` publishes the **zip** via PUT, `mode: update`, `update-id: <id>`, `ttl-days: 30`. The link stays stable.
6. **create GitHub Release** -- body uses `steps.brewpage.outputs.url` as its live link, with the recipe manifest and ecosystem cross-links. It refuses an empty output and never reconstructs a link from the ID. `github.ref_name` drives the tag/name; the workflow creates no tags/commits itself.

### Delivery cohorts

The existing RAG Guide is OLD: preserve its descriptor, ID, apex canonical/OG URLs and sitemap. Technical compatibility commits do not republish or migrate it; `main` pushes do not trigger publication.

NEW sites require `subdomain` delivery, even in `public`; explicit `path` is rejected. Save the exact server `link`, including its root trailing slash. Native child/asset/directory paths work on the publication host, with 404 for missing files and no SPA fallback. Authored HTML/site documents have no wrapper, injected base or platform navigation, but may receive the enabled read-only attribution badge; other content uses the platform viewer. Never derive the host from the resource ID.

Unlisted, protected or otherwise ineligible NEW native responses carry `noindex`; eligible public HTML, sites and files may permit indexing, without a native sitemap/SEO alias. A public gallery listing does not guarantee indexing. Protected NEW links stay clean and unlock through trusted top-level navigation at `unlock.brewpage.app`; passwords/owner tokens never belong in share URLs. Management stays on the apex API. See [platform delivery compatibility](./brewpage-platform.md#old-and-new-delivery-compatibility).

The API accepts ZIP archives or repeated `files` and matching `paths` multipart fields. The cookbook keeps ZIP transport after applying its original publish exclusions; `brewpage-action@v1.2.0` sends one `archive` field for a `.zip` input.

### Link permanence / TTL

BrewPage defaults to **15 days** and normally caps requested `ttl` at **30 days**, subject to the owner's effective limits. Site PUT retains the original expiry: the workflow's `ttl-days: 30` does not renew the publication. Treat the returned `expiresAt` as authoritative, including any separately eligible automatic extension. This repository has **no scheduled renewal**.

### Owner tokens & secrets

- Owner token = **secret only** (`BREWPAGE_OWNER_TOKEN_RAG_GUIDE`); never in source, logs, or recipe content; unrecoverable if lost. The action calls `core.setSecret` before any emission, masking its token output.
- id + namespace + link = committed **`.brewpage-site.json`** (non-secret) + the gitignored `.claude/brewpage-history.md` record.

### Publish-scope filter (deterministic bundling)

The repo folder `recipes/<slug>/` carries more than the live site: manuscript (`content/`), mockups (`mokups/`), design docs (`*.md`), build scripts (`*.py`), agent state (`.claude/`), and authoring-time HTML partials (`shared/components/`). `brewpage-action` does **not** filter, so the workflow pre-bundles. Publishing the raw folder would blow past the BrewPage site caps (**<= 100 files / 20 MB total / 5 MB per file**).

- **Filter file:** each recipe carries a **`recipes/<slug>/.brewpageignore`** (gitignore-style globs) listing DEV-ONLY paths to exclude; everything else ships. Excluded files stay in git, they just do not upload. The workflow's `rsync --exclude` set mirrors it 1:1 and also drops the `.brewpageignore` file itself.
- **Procedure (what the workflow applies):** stage the filtered set -> assert caps (**count < 100**, **total < 20 MB**, **max single < 5 MB**, and **not empty**); fail loudly otherwise -> **zip the staged set** -> hand the `.zip` to the action.
- **What is excluded** (every depth): `.claude/`, `content/`, `mokups/`, all `*.md`, all `*.py`, `scripts/`, `*.log`, `*.bak`/editor junk, `.gitkeep`, `.brewpageignore`, **`shared/components/`** (authoring-time copy-in partials -- inlined into each page; nothing fetches them at runtime), and design-source `*.svg` whose rasterized counterpart is what the site references (`shared/og/og-rag-guide.svg`; **`favicon.svg` is kept** -- pages reference it).
- **What is kept** (audited against actual runtime imports/fetches): all `*.html` pages, `shared/css/**`, `shared/js/**`, `shared/data/**`, `shared/og/*.png|ico`, `favicon.*`, `sitemap.xml`. The committed non-secret `.brewpage-site.json` descriptor is not excluded, so it ships too.
- **RAG Guide as published (`v0.1.11`):** filtered published set = **85 files / ~1.8 MB / largest single ~0.17 MB** -- all three caps satisfied with margin. Each run logs the current figures as `staged files=...`.

---

## 6. Release flow

A **tag drives every release publish**: pushing an unprefixed `vX.Y.Z` tag runs the workflow (publish + GitHub Release). PR/merge to `main` alone does **not** publish. Manual dispatch requires an explicit existing `vX.Y.Z` release tag in the `version` input and republishes that tag's source without creating a release. The workflow checks out the requested tag even when dispatched from `main`; it never labels untagged branch content as a release. PUT does not renew TTL.

| Event | What happens |
|---|---|
| **PR merged to `main`** | Lands content. No publish, no tag. |
| **`vX.Y.Z` tag pushed** | Runs `publish-recipe.yml`: site UPDATE via `brewpage-action` (stable link, original expiry) + GitHub Release. |
| **Manual dispatch with `version: vX.Y.Z`** | Republishes the existing tagged snapshot; missing, malformed or mismatched tags fail before publication. |

**Tag format:** **unprefixed `vX.Y.Z`** -- `v0.1.0`, `v1.0.0` -- matching the rest of the BrewPage ecosystem. The workflow consumes `github.ref_name` and creates **no** tags/commits itself.

**Local tag flow (human/manager, outside CI):** discover tags and select the version, then use one fail-fast chain for staging, commit, push, annotated tag creation on that commit and tag push. Never tag the previous commit before staging the release changes.

**Version handling:** the tag is the single source of truth; the workflow validates the existing tag at HEAD before invoking `stamp-version.mjs --version vX.Y.Z`. The guard lives in the workflow so older tagged stamper snapshots remain compatible. Local use may add `--require-head-tag` for the same tag guard. Do not hand-edit any version file. Local development stamping may still use a dev fallback; production publication cannot.

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

- **Task board (canonical work list):** [`.claude/features/board.md`](../.claude/features/board.md). Single source of truth for what work is in flight across the repo; folder/status conventions and the tracking procedure live alongside it under `.claude/features/`. Per-recipe editorial plans live as per-task design specs under `.claude/features/specs/` (`.claude/features/specs/<TASK-ID>.md`; see section 3).
- **Recipe authoring (voice + Definition of Done):** [`docs/recipe-authoring.md`](./recipe-authoring.md) -- the editorial standard every recipe must meet (concrete-problem opening, real working code, at least one interactive element, cited sources, a "try it yourself" / "next steps" close, and the per-recipe DoD).
