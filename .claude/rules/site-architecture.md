---
paths: ["**/*"]
---

[DICT: SB=site-builder, CA=cookbook-author, IE=interactive-engineer, lib=shared/js/lib module, theme=CSS-variables tokens file, host=DOM mount selector]

# Site architecture -- shared-lib + theme-as-a-file

Governs EVERY cookbook recipe site. Proven by the RAG Guide 3-variant prototype (`recipes/rag-guide/`). Plain static HTML + vanilla ES modules + one hand-written CSS file. No framework, no bundler, no build step. Read this before scaffolding or extending any recipe.

## 1. Core model -- one shared lib, theme is one file

| Principle | Detail |
|-----------|--------|
| One shared lib per site | A single `shared/` library (css + components + js + data) serves every page + variant of one recipe. !=fork per page, !=fork per variant. |
| Theme = one file | A variant/theme is ONE CSS-variables file: `shared/css/themes/<name>.css`. It (re)defines the same `:root` token set; only VALUES differ. |
| Swap = one `<link>` | Reskinning a page = swapping the single theme `<link>`. In every variant `index.html` that theme line is the ONLY differing line (`base.css` link + page-glue `<script>` are identical). |
| base.css never forked | `base.css` is shared by ALL variants. Never copy/fork it per theme. Prototype themes: `ink.css` (dark), `paper.css` (light), `blueprint.css`. |

## 2. CSS contract -- structure vs tokens

| Layer | Owns | Forbidden |
|-------|------|-----------|
| `shared/css/base.css` | layout, container, component shells + utility classes (`.site-header`, `.card`, `.diagram-host`, `.timeline`, `.search-box`, `.popover`, `.term`, `.node`/`.edge`, `.stack`, `.visually-hidden`, `.skip-link`, `.js-only`/`.no-js-only`) | NO literal color / size / font / duration -- color/space/motion come via `var(--...)` ONLY |
| `shared/css/themes/<name>.css` | the VALUES for the full token set on `:root` | NO structure, NO selectors beyond `:root` |

Token namespace each theme MUST supply (full list in `base.css` header): color `--c-bg --c-surface --c-surface-2 --c-text --c-text-muted --c-border --c-link --c-link-hover --c-focus --c-accent-1..4 --c-accent-1-soft..4-soft`; space `--sp-0..6`; radius `--radius-sm/md/lg`; type `--font-body --font-mono --fs-0..4 --lh-tight --lh-body --fw-normal --fw-bold`; border `--bw-1/2`; shadow `--shadow-1/2`; motion `--dur-1/2 --ease-1`; layout `--container-max`. SVG node/edge color comes from theme accents only (`.node--accent-N { stroke: var(--c-accent-N) }`).

## 3. HTML -- minimal semantic, partials are source of truth

- Minimal semantic HTML: real landmarks (`header`/`nav`/`main`/`footer`), headings, `figure`/`figcaption`. No div-soup, no noise, no inline styles, class hooks only.
- Shared component partials under `shared/components/` are the copy-in source of truth; a page composes them inline. Built set: `header.html`, `footer.html`, `nav.html`, `drilldown-host.html`, `search-box.html`.
- Host contract carried on the markup via `data-*`: `data-component="<name>"` (lib mount target), `data-slot="<name>"` (sub-region: `nav`/`svg`/`toolbar`/`results`/`anim`), plus `data-*-src` for the data path. Page glue finds hosts by these selectors.

## 4. JS -- single-responsibility lib + page glue

| Tier | Path | Contract |
|------|------|----------|
| lib | `shared/js/lib/<name>.js` | one responsibility per module; each exports the factory `export function init(rootEl, config) { ...; return { destroy() {} }; }` (a renderer may also return `render(step)`). No global state; IE owns internals. |
| page glue | `shared/js/pages/<page>.js` | SB owns wiring. Imports the lib modules a page needs, finds hosts by documented selectors, calls `init(host, config)`, collects instances, calls `destroy()` on `pagehide`. Sets `document.documentElement.classList.add("has-js")` to flip `.js-only`/`.no-js-only`. Loaded as `<script type="module">`. |

Built lib modules + mount: `dom.js` (shared DOM/fetch-json helpers), `a11y.js` (focus, roving-tabindex, live region, reduced-motion query), `i18n.js` (active-lang label store), `drilldown.js` (`[data-component="drilldown-host"]`), `timeline.js` (`.timeline`), `process-anim.js` (renders one worked-example step into a `[data-slot="anim"]`), `glossary.js` (binds `[data-term]`/`.term` over `document.body`), `search.js` (`[data-component="search-box"]`). Page glue built: `pages/landing.js` (variant entry pages -- all 3 variants load the SAME module), `pages/stage.js` (single stage page).

## 5. Diagrams + motion

| Rule | Detail |
|------|--------|
| Inline SVG only | Diagrams are hand-written inline SVG with `.node`/`.edge`/`.node__label` class hooks. NO diagram library. |
| transform/opacity only | Animate transform + opacity only (compositor-safe). One rAF clock drives sequencing (timeline.js). |
| Gated motion | Run animation only when on-screen (IntersectionObserver) AND `prefers-reduced-motion: no-preference`. Reduced-motion => manual stepper over the SAME DOM (snap to end state, identical markup). |
| No-JS degradation | Each interactive host ships a static, meaningful inline-SVG/flat schematic + full prose inside `.no-js-only`; the live mount is `.js-only`. JS only ENHANCES. Page works with JS off. |

## 6. Content -- md-as-source, agent-rendered static (strategy A)

- Prose lives as `.md` under `content/<lang>/` (e.g. `content/ru/`) -- the editorial single source / manuscript.
- CA hand-ports md -> static HTML into the page (no build step, NO runtime fetch of md). The committed HTML is the authored artifact; the `.md` sits beside it as its manuscript.
- Section hosts in the page wait as empty `<div data-content="<slug>">` until prose is ported in; the host is present (and the page valid) before content lands.

## 7. Data contracts (`shared/data/`)

| File | Type | Carries |
|------|------|---------|
| `diagram-data.js` | JS default export | C4 drill-down tree, keyed by stage; node `{ id, label, level(system\|container\|component), parent, children[], summary, "data-term"? }`; exactly one `level:"system"` root per stage. Schema in the file header. |
| `glossary.json` | JSON | term-key -> `{ ru, en }` definitions; referenced by `[data-term]`/`.term`. |
| `worked-example.json` | JSON | `{ doc, chunks[], vectors[], steps[] }`; step `{ id, kind(split\|embed\|store), caption, targets[], duration }`. |
| `nav.json` | JSON | `{ sections: [{ slug, title, href }] }` in display order. |

Rules: every contract documents its schema in-file. JSON files carry a `_schema` metadata block (purpose/shape/rules). Consumers MUST skip every `_`-prefixed key. Do not rename fields without a PR note so CA/IE match without guessing.

## 8. i18n-ready

- `i18n.js` holds an active-lang store, RU default. Labels are data-driven (glossary + data contracts carry `{ ru, en }`); prose hooks via `[data-term]`.
- "i18n-ready" = the data + lang store exist and consumers resolve by active lang. Full EN page-doubling is a later build-out, NOT required for ready state.

## 9. Dependencies + versions

Vanilla only -- no framework, no bundler, no build. CDN deps: prefer ZERO. Any unavoidable third-party JS/CSS is loaded from a CDN pinned to an EXACT `X.Y.Z` (`.../pkg@X.Y.Z/...`). Never `@latest`/caret/tilde/`@main`. Resolve + pin per `.claude/rules/versions.md`.

## 10. Folder layout (as built)

```
recipes/<slug>/
  variants/<name>/index.html        # entry page per theme; only theme <link> differs
  content/<lang>/*.md               # editorial md source (manuscript)
  shared/
    css/
      base.css                      # structure + components, vars only for color/space/motion
      themes/<name>.css             # ONE tokens file per theme
    components/*.html               # copy-in HTML partials (source of truth)
    data/                           # diagram-data.js, glossary.json, worked-example.json, nav.json
    js/
      lib/*.js                      # single-responsibility modules (init factory)
      pages/*.js                    # page glue (wires lib onto hosts)
```

Each `recipes/<slug>/` folder publishes verbatim to BrewPage as a multi-file site -- must fit 20 MB / 100 files / 5 MB per file.

## 11. HOW-TO playbook

| Task | Steps |
|------|-------|
| Add a section | CA writes `content/<lang>/<slug>.md`, hand-ports to a `<section>`/`<div data-content="<slug>">` host in the page; add `{ slug, title, href }` to `nav.json`; if it needs interactivity, wire it in the page-glue module (SB). |
| Add interactivity | IE adds a new `shared/js/lib/<name>.js` exporting `init(rootEl, config) { return { destroy() {} } }`; CA/SB add the host markup with `data-component`/`data-slot`; SB imports + instantiates it in the page glue on the documented selector. Hand off via a brief naming host selector + config + data source (CA describes, IE implements -- do not blur). |
| Add a theme | Copy an existing `shared/css/themes/<name>.css`, change ONLY the token values, save as `themes/<new>.css`; point one variant's theme `<link>` at it. Never touch `base.css`. |
