# AtlasMD -- canonical design system for the RAG Guide (AS-BUILT)

Single source of truth for the RAG Guide design + component system. Tokens + component catalog + interactions + lib map in one file, matched to the shipped site (`recipes/rag-guide/`). Atlas-only (one theme `atlas`). ASCII punctuation only, English. No smart quotes, no em-dash, three-dot `...`.

Conforms to `.claude/rules/site-architecture.md`: one shared lib per site; theme = ONE CSS-variables file (`shared/css/themes/atlas.css`); `base.css` never forked; lib modules export `init(rootEl, config) => { destroy() }`; page glue sets `.has-js` and wires hosts by `data-component`/`data-slot`/`data-*-src`.

As-built pages (the site is 4 top-level HTML files + shared lib, NOT `variants/`):
- `index.html` -- Atlas MAP landing: terrain SVG backdrop + rust route + sampled flag pins + desktop legend index + mobile vertical route + single-open field note + map progress strip.
- `what-rag.html` -- pipeline section (7 stages, inline-grow drill camera, earned progress).
- `why-rag.html` -- two-track comparison (без/с RAG) + modal drill camera.
- `search.html` -- 2D vector-space map, every point drillable, cosine rings, kNN top-k.

> `mokups/DESIGN-ATLAS.md` is folded in (kept only as the landing derivation note). `RATING.md` + the metro variant were dropped. See section 8.

---

## 1. Identity + design principles

Atlas = a warm antique-cartography / engineering-plate SKIN over SERIOUS RAG content. The cartography is restrained decoration; the words are real RAG mechanics (embeddings, ANN, cosine, top-k, grounding, citations). Never a treasure-hunt metaphor frame.

| # | Principle | Detail |
|---|-----------|--------|
| 1 | Atlas skin, serious content | parchment + sepia ink + teal/rust/gold; prose is real engineering. A node is "Эмбеддинг запроса", not "the embedding outpost". |
| 2 | No metaphor frames | terrain/compass/scale/cartouche are garnish; never replace or rename a real concept. |
| 3 | Adult restrained didactic animation | motion teaches a mechanism (text -> tokens -> vector; docs settle by cosine; spine draws once). One-time, no loops, no traveling sparkles. |
| 4 | transform/opacity only | animate `transform`+`opacity` only. The sole allowed extras are gated, one-shot `stroke-dashoffset` (route/spine draw) + `width` (progress fill). |
| 5 | Reduced-motion fallback | gate on `prefers-reduced-motion: no-preference` AND on-screen (IntersectionObserver). Under reduce: snap to END state over the SAME DOM; static stepper/end-state always reachable. |
| 6 | Mobile-first | hold at 390px + 320px; tap targets >=44px; map becomes a horizontal scroller (mobile vertical route is the primary mobile nav); tracks stack; rail reorders below the plot; long strings wrap (`overflow-wrap:anywhere`). |
| 7 | Earned progress only | progress is EARNED by traversing the section MAIN PATH (section 4.1). Strip starts neutral 0/total; current/next marker is faint rust "вы здесь", NEVER pre-green. |
| 8 | Themed selection, never blue | selected/active/focus = the canonical themed sepia/rust/gold ring (section 3.13). Default blue focus ring is FORBIDDEN everywhere. |
| 9 | Self-contained, zero deps | no webfonts, no external requests, no CDN, no diagram library; inline SVG + system font stacks only. If a dep ever became unavoidable: pin exact `X.Y.Z` per `.claude/rules/versions.md`. |
| 10 | i18n-ready, RU default | RU default (`<html lang="ru">`); EN via `i18n.js`. Static text carries `data-ru`/`data-en` (meaningful with JS off); data is `{ ru, en }`. |

---

## 2. Token system

ONE file: `shared/css/themes/atlas.css`, `:root` VALUES only (no structure, no selectors beyond `:root`). `base.css` references token names and carries NO literal color/size/font/duration except inside decorative inline SVG (terrain/seal/compass live in the HTML markup, not base.css). Swapping the single theme `<link>` reskins the page.

### 2.1 Palette aliases (theme-internal; base.css may reference)

| Alias | Value | Role |
|------|-------|------|
| `--parchment` | `#f3ead4` | page base |
| `--parchment2` | `#efe3c8` | card/panel surface |
| `--sand` | `#e8dcc0` | plate fill |
| `--sand-deep` | `#ddcca8` | hover/track tier |
| `--sepia` | `#5c4a32` | heading ink, strokes |
| `--sepia-soft` | `#7a6446` | muted ink, borders |
| `--ink` | `#3a2e1d` | body text |
| `--teal` | `#4a6f6a` | accent A |
| `--teal-deep` | `#335551` | accent A deep / links |
| `--rust` | `#a55a35` | accent B / active / route / focus |
| `--gold` | `#b08a3e` | accent C / start / in-progress |
| `--green` | `#17a673` | EARNED progress / done / top-k (semantic only) |
| `--line` | `#bda878` | hairlines |
| `--line-soft` | `#d2bd8e` | soft divider |

Frozen darkening hex tokens (in atlas.css): `--lang-active-bottom #4a3a26`, `--rust-deep #7c3f24`, `--gold-deep #8c6a25`, `--badge-rust-bottom #8c4a2b`, `--compass-nw #c47a55`, `--compass-sw #6a8d88`, `--green-text #0c7a52`. Green-surface tints: `--c-visited-bg-1 #eef7ea`, `--c-visited-bg-2 #e3efd9`.

### 2.2 Fonts -- NO webfonts

- `--serif` (`--font-body`): `"Hoefler Text","Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif` -- body + headings + the SVG pin labels (section 3.12).
- `--sans` (`--font-ui`): `"Trebuchet MS","Gill Sans","Segoe UI",Verdana,sans-serif` -- kicker, labels, buttons, status pills, medallions, footer.
- `--mono` (`--font-mono`): `ui-monospace,"SF Mono",Menlo,Consolas,monospace` -- readouts, vectors, cosine values, prompt/kv blocks (section pages).

### 2.3 Type scale

| Token | Value | Use |
|-------|-------|-----|
| `--fs-0` | `0.72rem` | kicker / status pill / mono caption |
| `--fs-1` | `0.86rem` | body sans, hint, meta |
| `--fs-2` | `1.04rem` | promise, blurb, chunk-text, qline |
| `--fs-3` | `1.3rem` | plate/section title |
| `--fs-4` | `clamp(1.8rem,3.7vw,3rem)` | hero headline (landing) |
| `--lh-tight` `--lh-body` | `1.14` / `1.5` | headings / body |
| `--fw-normal` `--fw-bold` | `400` / `600` | atlas "bold" = 600 (700 reserved for sans labels/numerals + the lit pin states) |

### 2.4 Space + radius + borders + layout

`--sp-0..6` = `4 / 8 / 12 / 16 / 24 / 32 / 54` px. `--radius-sm/md/lg` = `3 / 5 / 7` px. `--bw-1/2` = `1 / 2` px. `--container-max` = `1380px`. (Section pages set their own page `max-width` in `shared/css/sections/*.css`, not a token.)

### 2.5 Shadows -- sepia-tinted ONLY (never gray/black)

| Token | Value / role |
|-------|--------------|
| `--shadow-1` | `0 2px 6px rgba(60,46,26,0.14)` -- small drop |
| `--shadow-2` | `0 6px 20px rgba(60,46,26,0.18)` -- raised |
| `--shadow-plate` | double-frame plate stack (inset parchment ring + line ring + inner vignette + outer drop) |
| `--shadow-ring` | `inset 0 0 0 1px rgba(243,234,212,0.7)` -- parchment hairline ring |
| `--shadow-sheen` | `inset 0 1px 0 rgba(255,255,255,0.5)` -- toggle/button top sheen |
| `--shadow-pressed` | `inset 0 1px 2px rgba(0,0,0,0.25)` -- lang-active |
| `--shadow-track` | `inset 0 1px 2px rgba(60,46,26,0.18)` -- progress track |
| `--shadow-active-bar` | `inset 2px 0 0 var(--rust), var(--shadow-1)` -- active legend / mobile row |
| `--shadow-header` | `0 2px 0 -1px rgba(189,168,120,0.45)` -- header rule |

### 2.6 Motion

`--dur-1 .18s` (UI hover/state), `--dur-2 .42s` (didactic step), `--dur-zoom .52s` (drill camera), `--dur-note .3s` (field-note reveal / route handoff), `--dur-draw 1.5s` (one-shot route draw-in). `--ease-1 cubic-bezier(0.22,0.61,0.36,1)`, `--ease-zoom cubic-bezier(0.4,0.05,0.2,1)`.

### 2.7 base.css token namespace (atlas values)

`base.css` references these; `atlas.css` supplies the values. Names per `.claude/rules/site-architecture.md` section 2 plus atlas EXTRAS.

| base.css token | atlas value | note |
|----------------|-------------|------|
| `--c-bg` | `--parchment` | page base; ALSO the pin-label HALO color (section 3.12) |
| `--c-surface` `--c-surface-2` | `--parchment2` `--sand` | card / plate |
| `--c-surface-3` (extra) | `--sand-deep` | hover/track tier |
| `--c-text` `--c-text-muted` | `--ink` `--sepia-soft` | body / muted |
| `--c-heading` (extra) | `--sepia` | heading ink |
| `--c-border` `--c-border-soft` (extra) | `--line` `--line-soft` | hairlines |
| `--c-link` `--c-link-hover` `--c-focus` | `--teal-deep` `--rust` `--rust` | links / focus |
| `--c-accent-1..4` (+ `-soft`) | teal / rust / gold / teal-deep | accents A..D |
| `--c-progress` (extra) | `--green` | EARNED-progress / done. Semantic only, never decorative. |
| `--c-focus-glow` (extra) | `rgba(176,138,62,0.5)` | gold focus glow (gold-accent surfaces) |
| `--c-current-ring` (extra) | `rgba(165,90,53,0.32)` | faint rust "вы здесь" ring |
| `--c-visited-ring` (extra) | `rgba(23,166,115,0.4)` | earned-green ring |
| `--c-visited-bg-1/2` (extra) | `#eef7ea` / `#e3efd9` | visited node bg tints |
| `--c-route` `--c-route-shadow` (extra) | `--rust` / `rgba(60,46,26,0.18)` | route ink + shadow |
| `--font-body` `--font-ui` (extra) `--font-mono` | serif / sans / mono | |
| (rest) `--sp-*` `--radius-*` `--fs-*` `--bw-*` `--shadow-*` `--dur-*` `--ease-*` `--container-max` | per 2.3-2.6 | |

Atlas EXTRA tokens base.css may reference: `--c-surface-3`, `--c-heading`, `--c-border-soft`, `--c-progress`, `--c-focus-glow`, `--c-current-ring`, `--c-visited-ring`, `--c-visited-bg-1/2`, `--c-route`, `--c-route-shadow`, `--font-ui`, `--rust-deep`, `--gold-deep`, `--green-text`, `--dur-zoom`, `--dur-note`, `--dur-draw`, `--ease-zoom`, `--shadow-plate/ring/sheen/pressed/track/active-bar/header`. The palette aliases + cartography rgba set stay so SVG/cartography rules read naturally.

### 2.8 Cartography rgba set (landing terrain only)

`--ter-*` tokens carry every terrain fill/stroke (sea/coast/island/lake/shore/tick/river/mtn/hill/hachure/contour/tree/conifer/marsh/grid/rhumb/flourish/scale/bird/label/cartouche). Families: teal `rgba(74,111,106,*)`, brown `rgba(92,74,50,*)` + `rgba(120,96,60,*)`, contour `rgba(189,168,120,*)`, forest `rgba(74,90,60,*)`/`rgba(60,80,54,*)`. All low-alpha (<=~0.68), always reading BELOW the rust route. Composition rules: organic bezier landforms only (NO `<ellipse>`/`<circle>` for any landform; circles only for pins/seal/compass/flourish ornaments); open contours; hachure on shadow side; whisper-quiet garnish. The `--ter-*` tokens are referenced by terrain `fill`/`stroke` attributes from inside the inline SVG; the literal hex inside the terrain SVG is the page's ONLY literal color (base.css carries none).

As-built terrain scene (`index.html` `<g id="terrain">`, hand-drawn `ter-*` classes, `aria-hidden`, decorative): a `ter-river` runs from a mountain foot (~945,248 at the Mons Summus range) down to the south-west coast and empties into the `ter-sea` Mare Vetus (mouth ~140,444); a short tributary (`ter-river`) joins the main river; two `ter-lake`s (the labelled `Lacus Mediae` near the route mid + an unnamed lake at ~1052,292); `ter-marsh` `Palus`; exactly three `ter-flourish` decorative ink ornaments (`aria-hidden`): a three-mast sailing ship (hull + 3 masts + 3 triangular pennants) at `translate(48,392)` floating in the Mare Vetus sea (bottom-left), a smaller single-mast dinghy at `translate(568,406) scale(0.6)` in the Lacus Mediae lake (centre-bottom), and a hot-air balloon (onion/teardrop envelope with gore lines, suspension lines, small trapezoid basket) at `translate(1078,76)` in the open sky near the terminal "production" stage (top-right, by Mons Summus); contour/hachure ranges, conifers, trees, hills, birds, a scale bar (`Leucae`), and a `Terra Incognita` cartouche. To swap the whole scene for one background image, replace the `<g id="terrain">` children with a single `<image>` (the documented swap-in point).

---

## 3. Component catalog

One entry per component: purpose, markup contract (`data-*` hooks), states, interactions, reduced-motion, driving lib module. Hosts carry `data-component="<name>"` (mount), `data-slot="<name>"` (sub-region), `data-*-src` (data path). Pages compose partials inline (`shared/components/*.html` is the copy-in source of truth).

### 3.1 compass

- Inert decorative compass rose. HARD RULE: lives ONLY in a page TITLE header row, never over/beside a control/toolbar row.
- Markup: `<svg class="compass" data-component="compass" viewBox="0 0 100 100" aria-hidden="true" focusable="false">` -- two circles, four needle faces (rust N / `--compass-nw` NW / sepia S / `--compass-sw`), gold center, N/E/S/W text. Color is the frozen compass palette (inline-SVG literal, allowed).
- States/interactions: none (inert; `pointer-events:none`, not focusable).
- Reduced-motion: STATIC always; `compass.js` enforces inert + adds `.no-spin` under reduce (no rose-spin in the as-built site).
- Lib: `compass.js` -- `init(host) -> { destroy() }`; thin handle enforcing the inert contract.

### 3.2 plate-frame

- Framed engineering-plate container holding a page diagram + controls.
- Markup: `<section class="plate" data-component="plate" aria-labelledby="...">` with four `.corner` L-tick spans, frame via base.css `::before`/`::after` + `--shadow-plate`, `--radius-lg`. Optional `.graticule` SVG behind content. The title `.plate-head` carries the compass (separate from any toolbar row).
- A page may put both tokens on one element: `data-component="plate drilldown-host"` (whitespace-word match `[data-component~="plate"]`).
- Lib: `plate.js` -- `init(host) -> { stageEl, growToFit(px), reset(), destroy() }`. `stageEl` = `[data-slot="stage"]`. Drill modules call `growToFit` to set `min-height` to a panel's natural height (no scroll-jail). Structure stays in base.css.

### 3.3 node-card / pins / vector-points (unified marker)

ONE clickable/focusable concept-marker idea, three render forms over one behaviour contract:
- (a) `node-card` -- rect plate node (pipeline grid in what-rag; comparison-track steps in why-rag).
- (b) `map-flag` -- SVG flag pin on the landing route (`.pin` group: hit circle + pole + flag + dot + `.num` + `.pin-label` + `.pin-pct`).
- (c) `vector-point` -- SVG circle marker on the search plot (`.pt` group: hit / focus ring / dot / label / cosine).

- Markup hooks: `role="button" tabindex="0"` + `aria-label`; rect form `data-node`/`data-anchor`; SVG forms `data-idx`/`data-drill`/`data-rank`; zoomable forms carry `aria-expanded`. SVG text is `pointer-events:none`; an invisible `>=44px` (r=26, r=32 mobile) hit circle carries the tap target.
- States: default (neutral hairline + surface + `--shadow-1`); hover (lift + `--shadow-2` + gold border); `.current`/"вы здесь" (faint rust ring `--c-current-ring`, NOT green); `.next-step` (gold/rust pulse, the next uncompleted main-path step -- section 3.14); `.visited` (earned green); `.active`/selected (themed rust ring, persists on zoom-out); `start`/`terminal` (gold / rust medallion + flag); vector near=green dot/far=grey (still drillable); focus-visible themed (section 3.13). Landing flag THREE-STATE chapter paint is its own model (section 3.12 + 4.2), distinct from in-section `.visited`.
- Reduced-motion: hover/lit transitions disabled; state classes flip instantly.
- Lib: NO standalone `markers.js`. Map pins built+wired by `map-route.js`; vector points by `vector-map.js`; rect node-cards built+wired by `pipeline.js` + `drilldown-zoom.js`. Earned-progress state in `progress.js`.

### 3.4 breadcrumb

- Ancestor trail of zoom levels; ancestor crumbs jump to their level; current crumb inert.
- Markup: `<nav class="breadcrumb" data-slot="crumbs" aria-label="Уровень приближения">`; ancestors are real `<button class="crumb-link" data-depth="N">`; current = `<span class="crumb-current" aria-current="step">`; separators `.sep`.
- States: link `--c-link` dotted underline; hover `--c-link-hover` + sand; current bold no underline; focus-visible themed (3.13). Mobile keeps `>=44px` tap target.
- Lib: rendered + wired by `drilldown-zoom.js`. NOTE: the in-section breadcrumb ROOT returns to the section's OWN level 0; returning to the MAP uses the separate `.back-to-map` control (section 3.15).

### 3.5 zoom-controls (lens icons, ICON-only)

- zoom-out = lens-MINUS (come out one level); drill-in = lens-PLUS (dive one level deeper). NO verb words on the icon; meaning via `aria-label`.
- Markup: `<button class="zoomout" data-slot="zoomout" disabled aria-label="...">` (lens-minus, `disabled` at level 0); inline `<button class="drill" data-deep="<key>">` or a `.deeper` `role="button"` block (lens-plus, may carry a short text label next to the glyph).
- Lens geometry frozen: viewBox `0 0 24 24`, `stroke=currentColor stroke-width:1.8 round`; minus = `circle r6.5` + handle + horizontal line; plus adds the vertical line.
- Lib: `drilldown-zoom.js`. Escape also zooms out one level.

### 3.6 drill / zoom camera (semantic zoom)

- Semantic zoom INTO a marker. The detail panel GROWS to fit (no scroll-jail). Max 2 levels (node -> deep). Selection kept on zoom-out.
- Two render strategies (one module): (1) inline-grow panel (what-rag, search) -- the level-0 diagram collapses, the active panel flows, `plate.growToFit` sets the frame height; (2) modal camera overlay (why-rag) -- a fixed `.drill-layer` `role="dialog" aria-modal="true"` `.drill-stage` scaling `.7 -> 1`, focus trapped, Escape + backdrop close, focus restored.
- State machine `zstack`: `openNode(entry)` -> level 1; `openDeep(entry)` -> level 2; `zoomOut()`/Escape pop one; `zoomToLevel(depth)` (breadcrumb). Panel heading takes programmatic focus (`tabindex="-1"`, outline suppressed) on open.
- Lib: `drilldown-zoom.js` -- `init(host,{ renderPanel(entry,api), labels?, plate?, progress?, announce?, onSelect? }) -> { openNode, openDeep, zoomOut, zoomToLevel, close, currentDepth, destroy }`. BOTH inline-grow + modal live in this one module. Host `[data-component="drilldown-host"]` with `[data-slot="stage"|"crumbs"|"zoomout"|"panel"]`; modal adds `[data-slot="drill-layer"|"drill-stage"]`. Per-page `renderPanel` returns the panel DOM.

### 3.7 progress-strip (earned, main-path)

- Brass-plate cartouche. NEUTRAL on load (`0 / total`, fill width 0). Conveys EARNED route progress + a glanceable percent.
- Markup: `<div class="progress-strip" data-component="progress" aria-hidden="true">` with `.pcount` + `.ptrack > .pfill` + `.pdone`. The lib builds these if absent.
- States: load neutral; `.in-progress` (0 < done < total); `.complete` (done >= total, reveals `.pdone`). `.pcount` reads `Пройдено N / M (P%)` (EN `Visited N / M (P%)`).
- Lib: `progress.js` -- MAIN-PATH completion model. `init(root,{ mainPath:string[], total?, labels?, onChange? }) -> { markOpened(id), markVisited(id) (alias), markCurrent(id?), renderProgress(), nextStep(), nextUnvisited() (alias), doneCount(), visitedCount(), isVisited(id), isExplored(id), isComplete(), getCurrent(), reset(), destroy() }`. A step counts as DONE only if it is OPENED *and* on the ordered `mainPath`; off-path opens are "explored" (SIDE) and never count or gate. `isComplete()` = every main-path step done. `nextStep()` = next uncompleted main-path id. `onChange(state)` fires after any mutation with `{ done:Set, explored:Set, complete:bool, nextStep }` (page glue persists chapter progress here -- section 4.2). Session-only for the strip; persistence is `chapter-state.js`'s concern.

### 3.8 vector-map (2D projection)

- 2D projection of vector space: query point + chunk points, cosine rings, kNN top-k; EVERY point drillable (far points open a "why not top-k" panel).
- Markup: `<svg class="plot" data-component="vector-map" data-slot="stage" viewBox="0 0 520 420" role="img" aria-label="...">` (graticule, `#rings` cosine rings + labels, axis caption, `#links` query->top-k paths, `.pt` point groups). A side `.vmap-rail` `[data-slot="rail"]` holds the embed readout (`[data-slot="qvec"]`/`embed-step`/`tokrow`), the kNN `.ranklist` `[data-slot="ranklist"]`, the keyword-miss callout. `.scalebar` + `.vmap-legend` under the plot.
- States: points pre-placed AT the query origin, settle to cosine position; near = green dot, far = grey (lower weight, still drillable); selected point keeps themed ring on zoom-out; `.next-step` highlight on the point that opens the next main-path step; links draw on top-k highlight.
- Lib: `vector-map.js` -- `init(host,{ data, rail, onActivate(point,markerEl) }) -> { setSelected(id), setNextStep(id), ... destroy }`; builds + wires points, settle/link-draw/kNN reveal (IO + reduce gated). Per-point drill via `drilldown-zoom.js` (page glue bridges). Data from `shared/data/search-vectors.js` (default-export import, NOT a `data-*-src` attribute).

### 3.9 pipeline-flow

- Left-to-right pipeline of stage node-cards with a quiet one-time spine draw-in; each node drillable.
- Markup: `<div class="pipeline" data-component="pipeline">` with `.svg-flow` `[data-slot="flow"]` (3 stacked paths: `.edge-base` static + `.edge-draw` one-time draw + `.edge-prog` green proportional progress) over `.nodes-grid` `[data-slot="nodes"]` of node-cards. Sits inside the drill-camera stage.
- Lib: `pipeline.js` -- `init(host,{ data, camera, progress, announce }) -> { renderPanel(entry), markNode(id), refreshNodeStates(), destroy }`. Builds node-cards + spine, wires node click -> `camera.openNode`, lens-plus -> `camera.openDeep`; `refreshNodeStates()` re-lights visited green, advances "вы здесь", paints `.next-step`, grows the green progress spine. Mobile reflows to 2 columns at <=680px.

### 3.10 comparison-tracks (без / с RAG)

- Two vertical flows (Track A "Без RAG" / Track B "С RAG"), progressively revealed; some nodes drill into a modal camera.
- Markup: `<div ... data-component="comparison">` with `[data-slot="tracks"]` (two `.track` sections of `.cmp-node`s joined by `.conn` dashed connectors) + `[data-slot="takeaways"]` + `[data-slot="drill-layer"]` (modal). Drillable nodes carry `data-drill`; без-RAG weights node has `.freezetag`; с-RAG context node has `.cmp-node--grounding` (one-shot green land-pulse).
- States: `.reveal` hides flow on load (the grounded green answer is never painted before retrieval); stepped fade/translate in; `.grounding.land` runs the land-pulse; main-path (Track B) nodes also paint `.visited`/`.next-step`.
- Lib: `comparison.js` (the shipped name; planned `reveal.js`) -- `init(host,{ data, getLocale, announce, progress, mainPath }) -> { destroy }`. Owns stepped reveal (IO + reduce gated, parallel tracks so retrieval+grounding complete before B's answer) AND the modal drill. MAIN PATH = the Track B sequence `["B-q","B-embed","B-index","B-context","B-out"]`; Track A + level-2 deeps are SIDE.

### 3.11 field-note / detail-panel (unified)

- The in-place journal panel. Unifies the landing chapter field-note AND the section drill panels (inline-grow + modal).
- Markup: a `role="dialog"` region (landing `aria-modal="false"` into `[data-slot="panel"]` `aria-live="polite"`; modal `aria-modal="true"` in `.drill-layer`). Anatomy: `.fn-head` (badge + `<h4>` focus target + `.fn-close` / breadcrumb+zoom-out), `.fn-body` (`.fn-progress` chapter-progress line, `.blurb` drop-cap, diamond-bullet `<ul>`, optional `.fn-example`, optional `.fn-go` chapter link). Section pages add `.detail-panel`/`.vmap-card` blocks per content.
- States: `noteIn` keyframe on open; `.is-start`/`.is-terminal` badge variants.
- Lib: `drilldown-zoom.js` renders+manages it (landing field-note rendered by `map-route.js`). Final copy VALUES are CA's.

### 3.12 map-route + flags + lang-toggle + footer (landing)

- map-route: the rust expedition line (`#route` `.route-line` dashed + `#routeShadow` + `#routeDraw` one-shot draw via `stroke-dashoffset`, gated by reduce). Pins are SAMPLED on the actual path (`getPointAtLength`) so they never drift from the curve. Painted ON TOP of the terrain.
- map-flags: numbered flag pins sampled on the route (start gold / terminal rust / numbered chapters); click -> open the chapter field-note in place (single-open toggle: re-click closes). Desktop = SVG pins + `.legend-list` index; mobile = `.mobile-route` `<ol>` (PRIMARY mobile nav) below a horizontal map scroller. THREE-STATE chapter paint is in section 4.2.
  - Pin LABEL LAYOUT: each pin renders `.pin-label` (~12px, weight 600/700) + `.pin-pct` (~9px) in Atlas serif (`var(--font-body)`) with a parchment HALO (`paint-order: stroke fill; stroke: var(--c-bg)`; round joins) so terrain lines never cut the glyphs. Layout is by SIDE (above/below), at UNIFORM offsets only -- never variable distance:
    - `ABOVE = { labelDy:-34, pctDy:-46 }`, `BELOW = { labelDy:30, pctDy:43 }` (the SOLE source of vertical distance).
    - `computeLabelLayout()` chooses a side: default-by-pin-height (`y>235` -> above so a label never runs off the top/bottom edge), a `MIN_DX=150` prev/next-crowd flip (split a close pair above/below), and a high-pin rule (a high "below" pin under a crowded "above" neighbour flips above). Editorial `SIDE_PREF={5:"below"}` applied LAST and treated IMMOVABLE.
    - `decrampLabelSides()` post-render pass on REAL `getBBox` geometry enforces the invariant: any two labels whose X-EXTENTS overlap must be on OPPOSITE sides; it flips the lower-priority pin. GAP EXCEPTION `COMFY=14`: a same-side x-overlap is only a clash when the vertical gap is below `COMFY` (so a forced/preferred pin can coexist same-side with a pin it already clears vertically); the exception applies only to pairs involving a preferred pin -- ordinary pairs keep the strict "any x-overlap = clash" rule. A preferred pin never moves; a conflict flips the OTHER pin.
    - `clampLabelsToViewBox()` last (x-only, `VB_MARGIN=6`): nudges a terminal/edge label inward so it stays within `[6, 1194]` of the `0..1200` viewBox.
- lang-toggle: `<div class="lang-toggle" data-component="lang-toggle" role="group">` with two `<button data-lang aria-pressed>` (RU active default / EN). Page glue calls `i18n.setLocale` on click; `i18n.subscribe` rewrites `[data-i18n]` + flips `.active`/`aria-pressed`; map rebuilds markers + re-opens the active note on `lang:change`, preserving selection.
- footer colophon: `<footer class="site-footer" data-component="footer">` -- `.colophon-rule` + `.colophon-note` + `.links`. HARD RULE: must carry BOTH `https://brewpage.app` AND `https://github.com/kochetkov-ma/brewpage-openapi` (`target="_blank" rel="noopener"`). Section pages also carry an `index.html` "К карте маршрута" link in the footer. A page missing either ecosystem link is NOT done.

### 3.13 SELECTION / focus / active (canonical -- REPLACES default blue)

The browser default blue focus ring is FORBIDDEN everywhere.

| Context | Treatment |
|---------|-----------|
| focus-visible (buttons, links, crumbs, zoom-out, close, back-to-map) | `outline: var(--bw-2) solid var(--c-focus)` (rust), `outline-offset: 1-3px`. |
| focus-visible (gold-accent surfaces: track/pipeline nodes) | `box-shadow: 0 0 0 3px var(--c-focus-glow)` (gold), `outline:none`. |
| focus-visible (SVG pins/points) | suppress UA outline; raise the in-SVG ring: dot `stroke: var(--c-focus) stroke-width:3` + scale; pin-label rust + 700. |
| selected/active marker (persists on zoom-out) | dot `stroke: var(--c-focus)` + visible ring; rect node = active rust ring `var(--c-current-ring)` + `--shadow-active-bar`. |
| programmatic heading focus (panel `h2/h4`) | `tabindex="-1"` + `outline:none` (SR focus only; the reveal IS the cue). |
| EARNED-visited (distinct from selected) | green ring `var(--c-visited-ring)` + check. Visited != selected; both can coexist. |

### 3.14 next-step affordance

- The control that opens the next uncompleted MAIN-PATH step is highlighted to guide the user start-to-end. `.next-step` = gold border + `var(--c-focus-glow)` glow + a gentle `nextStepPulse` (themed, NEVER blue). Advances as steps complete; removed when the path is `isComplete()`.
- Painted by `pipeline.js refreshNodeStates()` (rect nodes), `vector-map.js setNextStep(id)` (points), `comparison.js` (Track B nodes) -- all sourced from `progress.nextStep()`.

### 3.15 back-to-map control (sections only)

- An always-visible header control returning to the Atlas map (`index.html`) from ANY drill level -- DISTINCT from the in-section breadcrumb root (which returns to the section's own level 0).
- Markup: `<a class="back-to-map" href="index.html" aria-label="...">` with `.bm-arrow` (`&larr;`) + a `data-i18n` label, inside `.site-header__nav` (grouped with the lang-toggle). Themed (sepia/rust, NEVER blue), `>=44px`, gold border, focus-visible rust outline. The landing/map does NOT use it.

---

## 4. Interaction + progress model

### 4.1 Chapter completion model (main path)

A section's chapter is DONE only when its ordered MAIN PATH is traversed start-to-end; SIDE paths are excluded.
- Each section page declares its MAIN PATH and feeds it to `progress.js` as `mainPath`:
  - what-rag: `PIPELINE_DATA.order` (the 7 pipeline stages `n0..n6`).
  - why-rag: `["B-q","B-embed","B-index","B-context","B-out"]` (the с-RAG Track B sequence).
  - search: `["pt-q","n1","n2","n3"]` (query + the top-k NEAR points).
- Opening a main-path step counts (done); opening anything else is "explored" (SIDE) and never counts or gates. `isComplete()` = all main-path steps done.

### 4.2 Persisted three-state chapters (`chapter-state.js`)

A tiny guarded `localStorage` wrapper recording REAL section completion so the map paints 3 states on return. NOT a mountable lib (named exports only, no `init`).
- Keys (back-compatible): `ragguide:chapter:<slug>` = `"started"|"done"` (the 3-state FLAG); `ragguide:chapter:<slug>:frac` = `"<done>/<total>"` (the PROGRESS fraction).
- API: `setProgress(slug,done,total)` (unified writer: persists fraction AND keeps the flag in sync -- `done>=1` -> at least started, `done>=total` -> done; never shrinks a stored fraction), `markStarted(slug)` (never downgrades done), `markDone(slug)` (terminal; squares the fraction to `total/total`), `getState(slug)` -> `"started"|"done"|null`, `getProgress(slug)` -> `{ done, total, pct, state }`, `readAll(slugs)`, `isAvailable()`, `STATES`. All access try/catch -- unavailable storage degrades to no-op/null (map shows neutral flags).
- Wiring: each section's `progress.onChange` calls `chapterState.setProgress(slug, done, total)`; on `complete` calls `markDone(slug)`. Chapters without a built section (no `href`) can never complete.
- Map paint (`map-route.js`): not-started = neutral; started = gold (`.started`); done = green + check (`.done`). Opening a flag NEVER writes state (the map only READS storage). `repaintChapters()` re-reads on demand; landing.js calls it on `window.focus` + `visibilitychange` so returning from a section reflects new state.
- Glanceable status: landing legend cards + mobile-route rows show an explicit `.cs-status` label (`Не начато` / `В процессе` / `Завершено`; EN `Not started` / `In progress` / `Completed`) with a `.cs-check` glyph on done (gold started / green done). The opened field note shows a `.fn-progress` line `Пройдено N / M (P%)` (gold in-progress / green done). The section progress strip shows its own `(P%)`. The landing map progress strip counts COMPLETED chapters only (driven by `onChaptersPaint({done,total})`, NOT by opening flags).

### 4.3 Interaction table

| Trigger | Effect |
|---------|--------|
| marker click / Enter / Space | open detail (drill level 1); if on main path mark done + grow progress; advance "вы здесь" + next-step |
| lens-plus drill (Enter/Space) | open one level deeper (level 2; SIDE) |
| zoom-out (lens-minus) / Escape | come out one level; keep selection on the marker you came from |
| breadcrumb ancestor click | jump to that level (collapse deeper) |
| current breadcrumb crumb | inert |
| re-click the active flag (landing) | close the field note (single-open toggle) |
| modal backdrop / Escape (why-rag) | close the drill modal; restore focus to origin |
| lang-toggle click | `i18n.setLocale`: set `<html lang>`, flip `.active`/`aria-pressed`, rewrite `[data-i18n]`, rebuild markers, re-open active panel |
| back-to-map (sections) | return to `index.html` from any drill level |
| map flag / list row (landing) | open the chapter field-note in place; mobile centers the pin in the scroller |
| first map scroll (mobile) | fade the one-time pan hint, then unbind |
| return to tab / map | `repaintChapters()` re-reads persisted chapter state |

Cross-cutting: keyboard (Enter+Space activate every control; Escape steps out one level; current crumb never a tab stop); focus-visible themed (3.13), never blue; tap targets `>=44px`; drill max 2 levels, panel grows (no scroll-jail), selection survives zoom-out; progress earned only.

---

## 5. Folder / layout + as-built module map

```
recipes/rag-guide/
  index.html  what-rag.html  why-rag.html  search.html   # the 4 pages
  content/ru/*.md                                          # editorial manuscript (strategy A)
  shared/
    css/
      base.css                  # structure + ALL component shells; var(--...) only (no literal color/size/font/duration)
      themes/atlas.css          # the ONLY token VALUES file (:root only)
      sections/
        what-rag.css            # pipeline + drill-panel section CSS
        why-rag.css             # comparison tracks + modal section CSS
        search.css              # vector-map + rail section CSS
    components/                 # copy-in HTML partials (source of truth)
      header.html footer.html nav.html breadcrumb.html compass.html
      plate-frame.html drilldown-host.html node-card.html field-note.html
      progress.html zoom-controls.html trail.html search-box.html
    data/                       # data contracts (section 7)
      nav.json what-rag.js why-rag.js search-vectors.js
      diagram-data.js glossary.json worked-example.json search-index.json   # scaffold seeds (see drift note)
    js/
      lib/                      # single-responsibility init-factory modules
      pages/                    # page glue
```

### 5.1 Component -> built lib module -> host

| Component | Built lib module | Host selector |
|-----------|------------------|---------------|
| compass (3.1) | `lib/compass.js` | `[data-component="compass"]` |
| plate-frame (3.2) | `lib/plate.js` | `[data-component~="plate"]` |
| node-card / pins / points (3.3) | owning host module (`map-route.js` / `vector-map.js` / `pipeline.js`+`drilldown-zoom.js`) -- no `markers.js` | per host below |
| breadcrumb (3.4) | `lib/drilldown-zoom.js` | `[data-slot="crumbs"]` |
| zoom-controls (3.5) | `lib/drilldown-zoom.js` | `[data-slot="zoomout"]` + inline `.drill`/`.deeper` |
| drill/zoom camera (3.6) | `lib/drilldown-zoom.js` | `[data-component="drilldown-host"]` (slots stage/crumbs/zoomout/panel; modal adds drill-layer/drill-stage) |
| progress-strip (3.7) | `lib/progress.js` | `[data-component="progress"]` |
| vector-map (3.8) | `lib/vector-map.js` (+ `drilldown-zoom.js` per-point) | `[data-component="vector-map"]`; rail `[data-slot="rail"|"qvec"|"ranklist"]` |
| pipeline-flow (3.9) | `lib/pipeline.js` (+ `progress.js` + `drilldown-zoom.js`) | `[data-component="pipeline"]` (slots flow/nodes) |
| comparison-tracks (3.10) | `lib/comparison.js` | `[data-component="comparison"]` (slots tracks/takeaways/drill-layer) |
| field-note / detail-panel (3.11) | `lib/drilldown-zoom.js` (landing: `map-route.js`) | `[data-slot="panel"]` (inline) / `[data-slot="drill-layer"]` (modal) |
| map-route + flags (3.12) | `lib/map-route.js` | `[data-component="trail"]` / `[data-slot="svg"]` |
| lang-toggle (3.12) | `lib/i18n.js` (`setLocale`/`subscribe`, wired in page glue) | `[data-component="lang-toggle"]` |
| chapter persistence (4.2) | `lib/chapter-state.js` (named exports, no init) | n/a (storage) |
| footer colophon (3.12) | none (static partial) | `[data-component="footer"]` |
| aria-live announcer | `lib/a11y.js` `init` | `[data-component="a11y-live"]` (or `document.body`) |

### 5.2 Support lib modules

| Module | Responsibility / contract |
|--------|---------------------------|
| `dom.js` | toolbox: `qs/qsa/el/svg/append/clear/on/listeners/fetchJson/stripMeta`; `init` no-op |
| `a11y.js` | `prefersReducedMotion`, `onReducedMotionChange`, `focusable`, `focusTrap`, `onEscape`; `init(host,{politeness})` mounts a scoped `.announce` aria-live -> `{ announce(msg), destroy }` |
| `i18n.js` | active-lang store (RU default from `<html lang>`): `getLocale/setLocale/subscribe/t`; fires `lang:change`; `init(html,{locale?})` |
| `chapter-state.js` | guarded localStorage 3-state chapter persistence (4.2); named exports only |

### 5.3 Page glue (`shared/js/pages/*.js`)

Each sets `document.documentElement.classList.add("has-js")` (flips `.js-only`/`.no-js-only`), imports the needed modules, finds hosts by selector, calls `init`, collects instances, calls `destroy()` on `pagehide`. Wires `lang-toggle` -> `i18n.setLocale` + `i18n.subscribe` -> `rewriteStaticText` (rewrites `[data-i18n]` from `data-<loc>`).

| Page glue | Wires |
|-----------|-------|
| `landing.js` | a11y + i18n + compass + plate + map-route; fetches `data/nav.json` (`stripMeta`); supplies `getStops`/`getStrings`/`getChapterState`/`getChapterProgress`/`getLocale`/`onChaptersPaint`/`announce`; paints the map progress strip from completed-chapter counts; `repaint` on focus/visibilitychange |
| `what-rag.js` | a11y + i18n + compass + plate + progress + drilldown-zoom + pipeline; `import PIPELINE_DATA from data/what-rag.js`; `mainPath = order`; persists via `chapterState.setProgress`/`markDone` in `progress.onChange`; bridges `camera.renderPanel -> pipeline.renderPanel`, `onSelect -> pipeline.refreshNodeStates` |
| `why-rag.js` | a11y + i18n + compass + progress + comparison; `import data/why-rag.js`; `MAIN_PATH` = Track B; persists chapter state in `onChange` |
| `search.js` | i18n + a11y + plate + drilldown-zoom + vector-map + progress; `import SEARCH from data/search-vectors.js`; `MAIN_PATH = ["pt-q","n1","n2","n3"]`; supplies `renderPanel` (level-1 chunk/why-not/query card + level-2 deep); mirrors selection via `vmap.setSelected`; `refreshNextStep` -> `vmap.setNextStep` |

Lib contract: every `lib/<name>.js` exports `export function init(rootEl, config) { ...; return { destroy() {} }; }` (a renderer may also expose `render(...)`); one responsibility, no global state (IE owns internals; this spec + page glue wire by selector). `chapter-state.js` is the documented exception (stateless helper, named exports, no init).

No-JS degradation: every interactive host ships a static, meaningful inline-SVG/flat schematic + full prose inside `.no-js-only` (landing = full chapter list + note; what-rag = the 7 stages as a prose list; why-rag = both tracks' full static end-state + takeaways; search = static labelled kNN list + keyword-miss note). Live mount is `.js-only`. JS only ENHANCES.

> Drift note (planned -> shipped): `drilldown.js` -> `drilldown-zoom.js`; `route.js` + landing half of `markers.js` -> `map-route.js`; search half of `markers.js` -> `vector-map.js`; `reveal.js` -> `comparison.js`; `compass.js`+`plate.js` are new (catalog had said "Lib: none"); `chapter-state.js` is new (the persistence refinement). Per-page DATA contracts shipped as `data/what-rag.js`/`why-rag.js`/`search-vectors.js` (default-export imports), NOT a generic `diagram-data.js`/`data-*-src`. STILL PRESENT but UNUSED by the 4 built pages (scaffold leftovers): `lib/drilldown.js`, `glossary.js`, `process-anim.js`, `search.js`, `timeline.js`; `pages/stage.js`; `data/diagram-data.js`, `glossary.json`, `worked-example.json`, `search-index.json`.

Each `recipes/rag-guide/` publishes verbatim to BrewPage as a multi-file site (fit 20 MB / 100 files / 5 MB per file).

---

## 6. Do-not rules (frozen) + invariants

| # | Do NOT | Instead |
|---|--------|---------|
| 1 | Pre-light any node green on load | green is EARNED by traversing the MAIN PATH; strip starts neutral |
| 2 | Use the default blue focus/selection ring | themed rust/gold treatment (3.13) on every control |
| 3 | Put the compass over/beside a control row | compass lives ONLY in a title header row |
| 4 | Load a webfont / make any external request | system stacks + inline SVG only; zero deps |
| 5 | Animate anything but transform/opacity | exception: gated one-shot `stroke-dashoffset` (route/spine) + `width` (progress) |
| 6 | Loop motion or add traveling sparkle markers | one-shot didactic motion that teaches a mechanism |
| 7 | Run motion ignoring reduced-motion / off-screen | gate on IO + `prefers-reduced-motion: no-preference`; reduce = snap to end over SAME DOM |
| 8 | Scroll-jail or clip a drill panel | panel grows the frame (`plate.growToFit`); max 2 zoom levels |
| 9 | Lose selection on zoom-out | keep selection + focus on the marker you came from |
| 10 | Use `<ellipse>`/`<circle>` for any landform | bezier paths; circles only for pins/seal/compass/flourish ornaments |
| 11 | Use gray/black shadows | sepia-tinted `rgba(60,46,26,*)` only |
| 12 | Break at 390/320px or drop below 44px tap targets | mobile-first; map scroller; tracks stack; rail reorders; long strings wrap |
| 13 | Fork base.css per theme / add a literal color/size/font/duration to base.css | base.css is `var(--...)` only; atlas values live in `themes/atlas.css` |
| 14 | Port `#mokup-nav` (dev pager) into production | review scaffolding only |
| 15 | Smart quotes / em-dash / unicode in code | ASCII only |
| 16 | Drop either mandatory ecosystem cross-link | both `brewpage.app` + `brewpage-openapi` links required |
| 17 | Mark a chapter done off a SIDE path or by opening a flag | done only when the ordered MAIN PATH is fully traversed; opening a landing flag never writes chapter state |
| 18 | Place pin labels by variable distance / per-label push | UNIFORM offsets only (`ABOVE`/`BELOW`); de-collide by SIDE, never by distance; preferred pin is immovable (flip the OTHER) |
| 19 | Hardcode the pin-label HALO color (or any decorative color) in base.css | halo = the surface token `var(--c-bg)`; ALL literal color lives in the terrain/seal/compass inline SVG, base.css carries none |
| 20 | Hand-write a magic-px legend-card height | compose `min-height` from tokens (`3 * fs * lh + 2*--sp-1 + 2*--bw-1`) + pin `.cs-name` line-height so the 3-line math is deterministic |
| 21 | Write chapter state when storage is unavailable / regress a stored fraction | `chapter-state.js` guards every access (degrades to no-op/null); fractions never shrink, "done" is terminal |

---

## 7. Data contracts (`shared/data/`)

Every contract documents its schema in-file; JSON carries a `_schema` block; consumers skip every `_`-prefixed key (`dom.stripMeta`); no field renamed without a PR note. Final label/definition/summary/copy VALUES are CA's; this spec fixes the SHAPE + host structure.

| File | Type | Carries |
|------|------|---------|
| `nav.json` | JSON | landing map: `{ routeD, stopCount, stops:[{ id, slug, href?, ru:{label,blurb,pts[],ex}, en:{...} }], ui:{ ru, en } }`. `stops` order IS route order (0=start, last=terminal). `href` only on built chapters. |
| `what-rag.js` | JS default export | pipeline: `{ order:string[], nodes:{[id]:{idx,anchor,label,hint,crumb,panel,deep?}} }`. `order` ids all exist in `nodes`; `order` = main path + spine order. Panel/deep block kinds: `tag/p/note/readout/embed/rank/cards/assemble/answer`. |
| `why-rag.js` | JS default export | comparison: `{ question:{ru,en}, note, tracks:[A,B], takeaways:[], drill:{<key>:detail{...deep?}} }`. Exactly two tracks; node `drill?` opens the modal; `{ru,en}` resolved by active locale. |
| `search-vectors.js` | JS default export | vectors: `{ query:QueryPoint, k, plot:{cx,cy,viewW,viewH}, rings:[], points:[Point] }`. Point = drillable chunk `{ id (==drill key), kind:"near"|"far", cx, cy, cos, rank, topk?, text, vector, deep:{label,preview}, ... }`. `values`/`vector` are short layout stubs, NOT real embeddings. |
| `diagram-data.js`, `glossary.json`, `worked-example.json`, `search-index.json` | scaffold seeds | the original generic contracts; UNUSED by the 4 built pages (kept for the documented architecture / future use). |

---

## 8. Supersedes

- `mokups/DESIGN-ATLAS.md` is FOLDED into this doc (token contract + base.css namespace + cartography palette + landing anatomy). AtlasMD.md is the single source of truth; DESIGN-ATLAS.md is retained only as the landing derivation note.
- `RATING.md`, the metro variant, and the rejected mockups are DROPPED. The RAG Guide is atlas-only: one theme (`atlas`), one token file. The theme-as-a-file contract is preserved (a future theme = one `themes/<name>.css` over the same `base.css`), but no second theme is planned or built.
