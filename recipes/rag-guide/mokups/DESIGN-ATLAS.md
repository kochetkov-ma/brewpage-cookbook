# DESIGN-ATLAS -- fixed design reference

Source: `recipes/rag-guide/mokups/01-atlas.html` (finalized antique-expedition-atlas mockup, two rework rounds + vision reviews passed).
This MD is the FROZEN design contract. The real RAG Guide landing page is built FROM this doc (per `.claude/rules/site-architecture.md` -- shared-lib + theme-as-a-file). All values below are lifted verbatim from the mockup; do NOT invent. ASCII punctuation only, English.

Theme identity: warm aged parchment + sepia ink + jewel teal/rust/gold accents; hand-drawn cartography; serif body, sans labels; sepia-tinted shadows only; double-rule + hairline + corner-tick borders; NO webfonts, NO external requests.

---

## 1. Design tokens

### 1.1 `:root` palette (verbatim)

| Token | Value | Role |
|-------|-------|------|
| `--sand` | `#e8dcc0` | atlas-plate base fill |
| `--sand-deep` | `#ddcca8` | hover fill / progress track |
| `--parchment` | `#f3ead4` | page base, dot fill, light text on dark |
| `--parchment2` | `#efe3c8` | card / panel surface |
| `--sepia` | `#5c4a32` | primary heading ink, strokes |
| `--sepia-soft` | `#7a6446` | muted ink, borders |
| `--ink` | `#3a2e1d` | body text |
| `--teal` | `#4a6f6a` | accent A (flag fill, badge, example) |
| `--teal-deep` | `#335551` | accent A deep (kicker, links) |
| `--rust` | `#a55a35` | accent B / active / route / terminal |
| `--gold` | `#b08a3e` | accent C / start / focus mark / brass |
| `--line` | `#bda878` | hairline rules, corner ticks |
| `--line-soft` | `#d2bd8e` | softer divider hairline |
| `--shadow` | `rgba(60, 46, 26, 0.18)` | base sepia shadow color |
| `--shadow-1` | `0 2px 6px rgba(60, 46, 26, 0.14)` | small drop shadow |
| `--shadow-2` | `0 6px 20px rgba(60, 46, 26, 0.18)` | raised drop shadow |
| `--radius-sm` | `3px` | small radius (buttons, badges) |
| `--radius-md` | `5px` | medium radius (panels, strip) |
| `--radius-lg` | `7px` | large radius (atlas plate) |
| `--ease` | `cubic-bezier(0.22, 0.61, 0.36, 1)` | single ease curve |
| `--dur` | `.18s` | single transition duration |
| `--serif` | `"Hoefler Text", "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif` | body + headings |
| `--sans` | `"Trebuchet MS", "Gill Sans", "Segoe UI", Verdana, sans-serif` | labels, UI, numerals |

Hardcoded accent-darkening values used inline (NOT tokens, but fixed): `#4a3a26` (lang-active gradient bottom), `#7c3f24` (rust border-deep / terminal stroke), `#8c6a25` (gold border-deep / start stroke), `#8c4a2b` (badge rust bottom), `#c47a55` (compass NW face), `#6a8d88` (compass SW face).

### 1.2 Fonts -- NO webfonts

Two system-font stacks only (`--serif`, `--sans` above). No `@font-face`, no Google Fonts, no external font load. `--serif` carries body + all headings; `--sans` carries kicker, labels, buttons, badges, numerals, footer, SVG `.num`/`.pin-label`/`.pin-pct`. SVG terrain text uses `var(--serif)` (`.ter-label`, `.ter-scale-num`); compass cardinals use inline `Georgia, serif`.

### 1.3 Type scale actually used

| Element | size | line-height | weight | letter-spacing | transform |
|---------|------|-------------|--------|----------------|-----------|
| `.brand h1` | `1.6rem` | `1.05` | `600` | `0.14em` | uppercase |
| `.brand .sub` | `0.86rem` | -- | normal italic | `0.03em` | -- |
| `.hero .kicker` | `0.72rem` | -- | normal | `0.34em` | uppercase |
| `.hero h2` | `clamp(1.8rem, 3.7vw, 3rem)` | `1.14` | `600` | `0.005em` | -- (`text-wrap: balance`) |
| `.hero p.promise` | `1.08rem` | `1.6` | normal italic | -- | `text-wrap: balance` |
| `.atlas-head h3` | `1.3rem` | -- | `600` | `0.1em` | uppercase |
| `.atlas-head p` | `0.88rem` | -- | normal italic | `0.01em` | -- |
| `.legend-list-head` | `0.72rem` | -- | normal | `0.2em` | uppercase |
| `.legend-list button` | `0.84rem` | -- | normal | `0.02em` | -- |
| `.lnum` | `0.66rem` | -- | bold | `0` | -- |
| `.field-note h4` | `1.24rem` | `1.2` | normal | `0.015em` | -- |
| `.field-note .blurb` | `1.04rem` | `1.58` | normal italic | -- | -- (drop-cap `2.6em`) |
| `.field-note li` | `0.9rem` | `1.45` | normal | -- | -- |
| `.field-note .fn-example` | `0.85rem` | `1.5` | normal | -- | -- (`b`: `0.72rem` `0.1em` uppercase) |
| `.field-note .badge` | `0.78rem` | -- | bold | `0.05em` | -- |
| `.field-note .fn-close` | `0.72rem` | -- | `600` | `0.1em` | uppercase |
| `.progress-strip` | `0.72rem` | -- | `600` | `0.12em` | uppercase |
| `.lang-toggle button` | `0.74rem` | -- | `600` | `0.14em` | -- |
| `.legend-hint` | `0.94rem` | -- | normal italic | `0.01em` | -- |
| `footer.site` | `0.8rem` | -- | normal | -- | -- |
| `footer .links` | `0.78rem` | -- | normal | `0.1em` | uppercase |
| SVG `.num` | `8px` | -- | bold | -- | -- |
| SVG `.pin-label` | `10px` | -- | normal (active bold) | -- | -- |
| SVG `.pin-pct` | `8px` | -- | bold | -- | -- |
| `.mobile-route .mpin` | `0.94rem` | -- | normal | `0.01em` | -- |

Letterspacing palette (em): `0` `0.005` `0.01` `0.012` `0.015` `0.02` `0.03` `0.04` `0.05` `0.1` `0.12` `0.14` `0.2` `0.26` (mobile kicker) `0.34`. Mobile drops brand to `0.1em`, kicker to `0.26em`.

### 1.4 Spacing rhythm

Layout: `.wrap` `max-width: 1380px`, padding `0 28px 84px` (mobile `0 16px 80px`). Vertical block gaps observed: header `30px 0 16px`, hero `margin 44px 0 20px`, atlas `margin-top 34px` padding `30px 26px 32px`, legend-list `margin-top 24px` `padding-top 18px`, field-note `margin-top 18px`, progress-strip `margin-top 26px`, footer `margin-top 54px` `padding-top 28px`. Common pad/gap steps: `4 5 6 7 8 9 10 11 12 13 14 16 18 20 22 24 26 28 30 32 34 44 54 84` (px). Inner-component gaps: brand `18px`, header `16px`, atlas-head `12px`, legend gap `8px`, field-note head `14px`, progress-strip `16px`, footer `14px`/`14px 24px`.

### 1.5 Shadow recipes (sepia-tinted only)

ALL shadows are warm `rgba(60,46,26,*)` -- never gray or black.

| Use | Recipe |
|-----|--------|
| base | `--shadow` = `rgba(60,46,26,0.18)` |
| small drop | `--shadow-1` = `0 2px 6px rgba(60,46,26,0.14)` |
| raised drop | `--shadow-2` = `0 6px 20px rgba(60,46,26,0.18)` |
| header underline | `0 2px 0 -1px rgba(189,168,120,0.45)` (line-toned, riding the double rule) |
| inset highlight | `inset 0 1px 0 rgba(255,255,255,0.5)` (toggle top sheen) |
| inset hairline ring | `inset 0 0 0 1px rgba(243,234,212,0.7)` (parchment ring on panels) |
| atlas plate stack | `inset 0 0 0 1px rgba(243,234,212,0.7), inset 0 0 0 7px rgba(189,168,120,0.55), inset 0 0 60px rgba(92,74,50,0.16), 0 6px 22px var(--shadow)` |
| seal/icon | `drop-shadow(0 1px 2px var(--shadow))` |
| pressed (lang active) | `inset 0 1px 2px rgba(0,0,0,0.25)` |
| track inset | `inset 0 1px 2px rgba(60,46,26,0.18)` |
| expanded inset bar | `inset 2px 0 0 var(--rust), var(--shadow-1)` |

### 1.6 Border conventions

| Pattern | Recipe | Where |
|---------|--------|-------|
| double rule | `border-bottom: 3px double var(--line)` + line-toned underline shadow | header |
| double frame | `2px solid var(--sepia-soft)` outer + box-shadow inset hairline ring | atlas plate |
| hairline divider | `1px solid var(--line-soft)` (top) / `1px dotted var(--line)` (li) / `1px dashed var(--line)` (fn-head) | legend-list-wrap, field-note li, field-note head |
| corner L-ticks | 8 background-image gradients sized `14px 1px` + `1px 14px` (atlas, `inset 12px`) / `12px` (field-note, `inset 7px`) positioned at four corners | atlas plate, field-note |
| brass thin double | `1px solid var(--sepia-soft)` + `inset 0 0 0 1px rgba(243,234,212,0.7)` | progress-strip |
| card border | `1px solid var(--line)`, hover `var(--gold)`, expanded `var(--rust)` | legend/mobile buttons |
| dotted link underline | `border-bottom: 1px dotted var(--teal)`, hover `var(--rust)` | footer links |

### 1.7 Token mapping -- proposal `theme: atlas` onto site-architecture namespace

base.css names on the left (per `.claude/rules/site-architecture.md` section 2); atlas values on the right. `themes/atlas.css` supplies ONLY these values on `:root`; base.css carries no literal.

| site-arch token | atlas value | note |
|-----------------|-------------|------|
| `--c-bg` | `#f3ead4` (`--parchment`) | page base |
| `--c-surface` | `#efe3c8` (`--parchment2`) | card/panel surface |
| `--c-surface-2` | `#e8dcc0` (`--sand`) | atlas plate fill |
| `--c-surface-3` (extra) | `#ddcca8` (`--sand-deep`) | hover / track -- atlas needs a 3rd surface tier |
| `--c-text` | `#3a2e1d` (`--ink`) | body |
| `--c-text-muted` | `#7a6446` (`--sepia-soft`) | muted |
| `--c-heading` (extra) | `#5c4a32` (`--sepia`) | headings ink (atlas separates heading from body) |
| `--c-border` | `#bda878` (`--line`) | hairlines |
| `--c-border-soft` (extra) | `#d2bd8e` (`--line-soft`) | soft divider |
| `--c-link` | `#335551` (`--teal-deep`) | links |
| `--c-link-hover` | `#a55a35` (`--rust`) | link hover |
| `--c-focus` | `#a55a35` (`--rust`) | focus ring |
| `--c-accent-1` | `#4a6f6a` (`--teal`) | accent A |
| `--c-accent-1-soft` | `rgba(74,111,106,0.10)` | example bg |
| `--c-accent-2` | `#a55a35` (`--rust`) | accent B active/terminal |
| `--c-accent-2-soft` | `rgba(165,90,53,0.10)` | (derive) |
| `--c-accent-3` | `#b08a3e` (`--gold`) | accent C start/brass |
| `--c-accent-3-soft` | `rgba(176,138,62,0.10)` | bg radial tint |
| `--c-accent-4` | `#335551` (`--teal-deep`) | accent A deep |
| `--c-accent-4-soft` | `rgba(74,111,106,0.16)` | sea/terrain wash |
| `--sp-0..6` | `4 / 8 / 12 / 16 / 24 / 32 / 54` (px) | maps observed rhythm; extras (5,6,7,9,...) live as component literals where base.css would otherwise need them -- prefer snapping to scale |
| `--radius-sm` | `3px` | verbatim |
| `--radius-md` | `5px` | verbatim |
| `--radius-lg` | `7px` | verbatim |
| `--font-body` | `--serif` stack | serif |
| `--font-mono` | (atlas has none) -> reuse `--sans` stack | atlas uses sans for UI, no mono in mockup |
| `--font-ui` (extra) | `--sans` stack | atlas needs a UI/label font distinct from body |
| `--fs-0..4` | `0.72rem / 0.86rem / 1.04rem / 1.3rem / clamp(1.8rem,3.7vw,3rem)` | smallest label -> hero |
| `--lh-tight` | `1.14` | hero |
| `--lh-body` | `1.5` | body default |
| `--fw-normal` | `400` | -- |
| `--fw-bold` | `600` | atlas "bold" headings are 600, not 700 |
| `--bw-1` | `1px` | hairline |
| `--bw-2` | `2px` | plate frame / dot stroke |
| `--shadow-1` | `0 2px 6px rgba(60,46,26,0.14)` | verbatim |
| `--shadow-2` | `0 6px 20px rgba(60,46,26,0.18)` | verbatim |
| `--dur-1` | `.18s` (`--dur`) | UI transition |
| `--dur-2` | `.3s` | note-in / route handoff |
| `--ease-1` | `cubic-bezier(0.22,0.61,0.36,1)` (`--ease`) | verbatim |
| `--container-max` | `1380px` | `.wrap` max |

Atlas-specific extra tokens not in the base namespace (the theme adds them; base.css may reference if a class needs them): `--c-surface-3`, `--c-heading`, `--c-border-soft`, `--font-ui`, plus the cartography rgba set (section 4) and the inline darkening hex set (1.1). Keep the original `--sand`/`--sepia`/etc names as theme-internal aliases so the SVG/cartography rules read naturally.

---

## 2. Page background

`body`:
- `background-color: var(--parchment)` (`#f3ead4`).
- `background-image` (4 layers, in order):
  1. `radial-gradient(circle at 20% 15%, rgba(176,138,62,0.08) 0, rgba(176,138,62,0) 40%)` -- gold glow top-left.
  2. `radial-gradient(circle at 80% 70%, rgba(74,111,106,0.07) 0, rgba(74,111,106,0) 45%)` -- teal glow lower-right.
  3. `repeating-linear-gradient(0deg, rgba(120,96,60,0.035) 0, ...0.035) 1px, transparent 1px, transparent 26px)` -- horizontal grid hairlines every 26px.
  4. `repeating-linear-gradient(90deg, ...same...)` -- vertical grid hairlines every 26px.
- `line-height: 1.5`, `min-height: 100vh`, `font-family: var(--serif)`, `color: var(--ink)`.

Grid texture = two crossed `repeating-linear-gradient`, 1px line, 26px pitch, `rgba(120,96,60,0.035)` (very faint warm brown). Two soft color glows on top of parchment. NO image asset.

---

## 3. Components

### 3.1 Site header (`header.site`)

- Purpose: brand seal + title block left, lang toggle right, sitting on a double-rule baseline.
- Anatomy:
  ```
  header.site
    .brand
      svg.seal (viewBox 0 0 100 100)
      div > h1[data-i18n=brandTitle] + .sub[data-i18n=brandSub]
    .lang-toggle[role=group][aria-label]
      button#lang-ru.active + button#lang-en
  ```
- Key rules: `display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; padding:30px 0 16px; border-bottom:3px double var(--line); box-shadow:0 2px 0 -1px rgba(189,168,120,0.45)`.
- Seal SVG: `56x56` (mobile 46), `drop-shadow(0 1px 2px var(--shadow))`. Two concentric circles (r46 solid sepia, r40 dashed `3 4`), a rust 4-point compass diamond, a teal 4-point diamond, gold center dot. Decorative (`aria-hidden`).
- `h1`: `1.6rem`, uppercase, `0.14em`, weight 600, color `--sepia`. `.sub`: italic `0.86rem`, `--sepia-soft`, `margin-top:4px`.
- States: none on header shell. Mobile (`<=560`): `padding:22px 0 14px; gap:12px`; brand gap 13; seal 46; h1 `1.18rem`/`0.1em`.
- Motion: none.

### 3.2 Lang toggle (`.lang-toggle`)

- Purpose: brass/parchment RU<->EN segmented switch.
- Anatomy: `inline-flex` wrapper + two `button[type=button][onclick=setLang(...)]`.
- Key rules: wrapper `border:1px solid var(--gold); border-radius:var(--radius-sm); overflow:hidden; background: linear-gradient(180deg, rgba(255,255,255,0.4), rgba(0,0,0,0.02)), var(--parchment2); box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), var(--shadow-1)`. Button: `--sans` `0.74rem` `0.14em` weight600; `padding:9px 17px; min-height:44px`; color `--sepia-soft`; `button + button { border-left:1px solid var(--gold) }`.
- States:
  - `.active`: `background: linear-gradient(180deg, var(--sepia), #4a3a26); color: var(--parchment); box-shadow: inset 0 1px 2px rgba(0,0,0,0.25)`.
  - `:hover:not(.active)`: `background: var(--sand-deep); color: var(--sepia)`.
  - `:focus-visible`: `outline: 2px solid var(--rust); outline-offset:-2px`.
- A11y: real `aria-pressed` toggled by `setLang` (true on active, false on other).
- Motion: `transition: background-color/color var(--dur) var(--ease)`.

### 3.3 Hero (`.hero`)

- Purpose: kicker -> balanced headline -> italic promise -> ornamental rule.
- Anatomy: `.kicker[data-i18n] + h2[data-i18n] + p.promise[data-i18n] + svg.rule`.
- Key rules: `.hero { margin:44px 0 20px; text-align:center; position:relative }`.
  - `.kicker`: `--sans` `0.72rem` `0.34em` uppercase, `--teal-deep`, `margin-bottom:18px`, `inline-flex; gap:14px`; flanking flourishes `::before/::after { content:""; width:34px; height:1px; background:var(--line) }` (mobile width 20).
  - `h2`: `clamp(1.8rem,3.7vw,3rem)`, `line-height:1.14`, `0.005em`, weight 600, `--ink`, `max-width:17ch`, `text-wrap:balance`.
  - `p.promise`: `1.08rem` italic, `line-height:1.6`, `--sepia-soft`, `max-width:54ch`, `text-wrap:balance`; `::first-line { color: var(--sepia) }` (first-line accent darker).
  - `svg.rule`: `220x18` `viewBox 0 0 200 18`, `opacity:0.75`; two hairlines (x 0-78, 122-200) + rust diamond polygon centered at 100,9.
- Mobile (`<=560`): margin `30px 0 14px`; kicker `0.26em` gap10 flourish20; h2 `clamp(1.5rem,7.6vw,2rem)` max-width 20ch; promise `1rem`.
- Motion: none.

### 3.4 Atlas plate frame (`.atlas`)

- Purpose: framed antique map plate holding head, trail SVG, legend, panel, progress.
- Anatomy: `section.atlas[aria-labelledby=mapTitle]` containing `.atlas-head`, `p#mapHint.map-hint` (mobile-only pan hint), `.trail-shell.desktop-trail`, `.legend-list-wrap`, `.mobile-route`, `.legend-wrap`, `.progress-strip`. `::before` = vignette, `::after` = corner ticks.
- Key rules: `margin-top:34px; border:2px solid var(--sepia-soft); border-radius:var(--radius-lg); padding:30px 26px 32px; position:relative; overflow:hidden`. Background `linear-gradient(135deg, rgba(255,255,255,0.25), rgba(0,0,0,0.02)), var(--sand)`.
  - Double-frame box-shadow stack: `inset 0 0 0 1px rgba(243,234,212,0.7), inset 0 0 0 6px transparent, inset 0 0 0 7px rgba(189,168,120,0.55), inset 0 0 60px rgba(92,74,50,0.16), 0 6px 22px var(--shadow)` (parchment hairline ring at 1px, line ring at 7px, inner vignette glow, outer drop).
  - `::before` vignette: `inset:0; pointer-events:none; background-image: radial-gradient(120% 90% at 50% 45%, transparent 62%, rgba(92,74,50,0.10) 100%); opacity:0.85` -- soft non-geometric corner darkening, NO concentric rings.
  - `::after` corner L-ticks: `inset:12px` (mobile 9); 8 `linear-gradient(var(--line),var(--line))` layers sized `14px 1px` / `1px 14px`, positioned at the four inner corners; `opacity:0.7`.
- Mobile: `padding:20px 16px 22px; margin-top:26px`; `::after inset:9px`.
- Motion: none on frame.

### 3.5 Atlas head (`.atlas-head`)

- Purpose: map title block + compass rose.
- Anatomy: `.atlas-head` > `.title-block (h3#mapTitle[data-i18n] + p[data-i18n])` + `svg.compass`.
- Key rules: `display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:12px; flex-wrap:wrap; position:relative; z-index:2`. `h3`: `1.3rem` uppercase `0.1em` weight600 `--sepia` (mobile `1.1rem`). `p`: italic `0.88rem` `--sepia-soft`.
- Compass: `78x78` (mobile 56), `opacity:0.92`, `viewBox 0 0 100 100`. Outer r46 solid sepia + r38 dashed `2 3`; N/E/S/W cardinals `Georgia,serif` 9px; four needle faces (rust `#a55a35` N, light-rust `#c47a55` NW, teal `#4a6f6a` S, light-teal `#6a8d88` SW); gold center dot. Decorative.
- Motion: none.

### 3.6 Terrain SVG layer system (`#terrain` / `.ter-*`)

Hand-drawn antique cartography painted FIRST in source order inside the same `viewBox 0 0 1200 470` as the route, so route + pins + labels paint on top and stay the hero. `aria-hidden`, `pointer-events:none` (never steals pin clicks). All children `vector-effect: non-scaling-stroke` (hairlines crisp at any scale).

#### Cartography palette -- every `.ter-*` class (verbatim rgba + stroke-width)

| Class | fill | stroke | stroke-width | extra |
|-------|------|--------|--------------|-------|
| `.ter-sea` | `rgba(74,111,106,0.16)` | -- | -- | |
| `.ter-sea-hatch` | none | `rgba(74,111,106,0.42)` | `0.8` | |
| `.ter-coast` | none | `rgba(74,111,106,0.62)` | `1.4` | |
| `.ter-island` | `rgba(74,111,106,0.20)` | `rgba(74,111,106,0.58)` | `1.1` | |
| `.ter-lake` | `rgba(74,111,106,0.23)` | `rgba(74,111,106,0.58)` | `1.3` | linejoin round |
| `.ter-shore` | none | `rgba(74,111,106,0.40)` | `0.8` | linecap round |
| `.ter-water-tick` | none | `rgba(74,111,106,0.44)` | `0.7` | |
| `.ter-river` | none | `rgba(74,111,106,0.50)` | (per-path 2.6/1.5/1.4/1.3) | linecap+linejoin round |
| `.ter-mtn` | `rgba(120,96,60,0.15)` | `rgba(92,74,50,0.58)` | `1.2` | linejoin+linecap round |
| `.ter-mtn-shade` | `rgba(92,74,50,0.19)` | none | -- | shadow flank |
| `.ter-hill` | none | `rgba(92,74,50,0.48)` | `1` | linecap round |
| `.ter-hachure` | none | `rgba(92,74,50,0.46)` | `0.8` | linecap round |
| `.ter-contour` | none | `rgba(189,168,120,0.68)` | `0.9` | linecap round |
| `.ter-tree` | `rgba(74,90,60,0.16)` | `rgba(74,90,60,0.58)` | `1` | linejoin round |
| `.ter-conifer` | `rgba(60,80,54,0.18)` | `rgba(60,80,54,0.62)` | `1` | linejoin round |
| `.ter-marsh` | none | `rgba(74,111,106,0.44)` | `0.8` | linecap round |
| `.ter-grid` | none | `rgba(120,96,60,0.17)` | `0.6` | graticule |
| `.ter-rhumb` | none | `rgba(120,96,60,0.15)` | `0.55` | rhumb rays |
| `.ter-flourish` | none | `rgba(92,74,50,0.42)` | `1` | linecap round (ship) |
| `.ter-cartouche` | `rgba(255,255,255,0.10)` | `rgba(92,74,50,0.34)` | `0.8` | (defined, sparingly used) |
| `.ter-scale-seg` | `rgba(92,74,50,0.40)` | none | -- | scale bar fill |
| `.ter-scale-rule` | none | `rgba(92,74,50,0.52)` | `0.9` | linecap round |
| `.ter-scale-num` | `rgba(92,74,50,0.50)` | -- | -- | `--serif` numerals |
| `.ter-bird` | none | `rgba(92,74,50,0.40)` | `0.9` | linecap+linejoin round |
| `.ter-label` | `rgba(92,74,50,0.48)` | -- | -- | `--serif` italic |

Cartography palette = teal family (sea/water/river/island/lake) `rgba(74,111,106,*)`; brown family (mountains/hills/hachure/grid/rhumb/flourish/scale/bird/label) `rgba(92,74,50,*)` and `rgba(120,96,60,*)`; contour `rgba(189,168,120,*)`; forests own green family `rgba(74,90,60,*)` / `rgba(60,80,54,*)`. All low-alpha, muted, never above ~0.68.

#### Layering order (z within the SVG = source order)

1. terrain `#terrain.terrain` (grid, rhumb, sea+coast+shore+hatch, islands, ship flourish, rivers, lakes+ticks, contours, dead-zone contours+birds, mountain ranges + shade + hachure, foothills, marsh, forests, conifers, scale bar, terra-incognita group + label).
2. contour decoration (`stroke #bda878 0.8 opacity 0.45`, 2 quadratic paths).
3. `#routeShadow .route-shadow`.
4. `#route .route-line` (dashed).
5. `#routeDraw .route-draw` (draw-in overlay, all three share the same `d`).
6. `#pins` group (built by JS).

#### Composition rules (FIXED constraints)

- Organic bezier landforms ONLY -- every shoreline, lake, island, hill, peak is an irregular hand-drawn `<path>`. NO `<ellipse>`, NO `<circle>` for ANY landform (circles allowed only for pins/seal/compass/colophon ornaments).
- Open contours: contour/shore/hill lines are open curves that hug ranges, never closed loops.
- Hachure on the shadow (left/downhill) side only; each peak gets a `.ter-mtn-shade` flank + 2-3 `.ter-hachure` downhill strokes.
- Composed AROUND the route corridor (sweeps lower-left ~70,410 -> ~600,210 -> ~820,338 -> summit ~1150,80); nothing busy sits under pins/labels.
- Whisper-quiet garnish: faint graticule (`.ter-grid`, 4 meridians + 3 parallels), rhumb rays from upper-right (`.ter-rhumb`, 8 lines), two-stroke bird glyphs (`.ter-bird`), reed-tuft marsh band (`.ter-marsh`, "Palus"), scale bar with alternating segments + numerals 0/10/20 + italic "Leucae", italic `.ter-label` placenames (`Mare Vetus`, `Lacus Mediae`, `Mons Summus`, `Terra Incognita`, `Palus`), dead-zone fill in top-center + upper-left so no empty parchment.
- Constraint: terrain reads visually BELOW the rust route -- low alpha, muted teal/brown, never competing with the rust line.
- Swap-in point: `#terrain` children can be replaced by ONE `<image>` (documented in mockup comment); route + pins are following siblings, nothing else changes.

### 3.7 Route (`.route-line` / `.route-shadow` / `.route-draw`)

- Purpose: the rust expedition line linking all stops, with a soft cast shadow and a one-shot draw-in.
- Path: `ROUTE_D` = `"M70,410 C180,320 240,440 350,370 C450,308 480,180 600,210 C710,238 700,360 820,338 C940,316 930,170 1040,168 C1110,166 1135,110 1150,80"`. All three paths share this `d` (set by JS).
- Styles:
  - `.route-shadow`: `stroke: rgba(60,46,26,0.18); stroke-width:5; stroke-linecap:round; fill:none`.
  - `.route-line`: `stroke: var(--rust); stroke-width:2.4; stroke-dasharray:7 6; stroke-linecap:round; opacity:0.9; fill:none`.
  - `.route-draw`: `stroke: var(--rust); stroke-width:2.6; stroke-linecap:round; opacity:0.9; fill:none`.
- Draw-in animation:
  - JS sets `--route-len` = `path.getTotalLength()` on `#trailSvg`, adds `.has-anim`.
  - `.has-anim .route-line { opacity:0 }` (hide dashed during draw).
  - `.has-anim .route-draw { stroke-dasharray:var(--route-len); stroke-dashoffset:var(--route-len); animation: routeDraw 1.5s ease forwards }`; `@keyframes routeDraw { to { stroke-dashoffset:0 } }`.
  - On `animationend` (or 2200ms safety timeout) JS adds `.anim-done`, removes `.has-anim`.
  - `.anim-done .route-line { opacity:0.9; transition:opacity .3s ease }` (hand back to dashed line); `.anim-done .route-draw { display:none }`.
- Reduced motion: `setupRouteAnim` returns early if `prefers-reduced-motion: reduce` (never adds `.has-anim` -> dashed line shows immediately). CSS belt-and-braces: `@media (prefers-reduced-motion:reduce){ *,*::before,*::after { animation:none!important; transition:none!important } .has-anim .route-line { opacity:0.9!important } .has-anim .route-draw { display:none!important } }`.

### 3.8 Pins (`.pin`)

- Purpose: clickable numbered flag markers sampled ON the route, one per stop.
- Anatomy (per pin `<g class="pin {kind}" tabindex=0 role=button aria-expanded aria-label data-idx>`):
  ```
  circle.pin-hit  (r=26, fill #fff opacity 0 -- 44px-equiv hit area)
  line.flag-pole  (x,y -> x,y-28)
  path.flag       (triangle from fx,fy width ~20)
  circle.dot      (r=8)
  text.num        (centered, 0..100 label)
  text.pin-label  (chapter label, dy +/-30/34 by row)
  text.pin-pct    (percentage, offset further from label)
  ```
- Styles: `.flag-pole { stroke:var(--sepia); stroke-width:1.6 }`. `.flag { fill:var(--teal); stroke:var(--teal-deep); stroke-width:1; transition:transform .18s ease; transform-box:fill-box; transform-origin:left center }`. `.dot { fill:var(--parchment); stroke:var(--sepia); stroke-width:2; transition:transform .16s ease, fill .16s ease; transform-box:fill-box; transform-origin:center }`. `.num` `--sans` 8px bold `--sepia`. `.pin-label` `--sans` 10px `--ink`. `.pin-pct` `--sans` 8px bold `--rust`. All text + hit `pointer-events:none` except the group.
- States:
  - `.pin:hover .flag { transform: scaleX(1.12) }`; `.pin:hover .dot { transform: scale(1.18); fill: var(--gold) }`.
  - `.pin.start .flag { fill:var(--gold); stroke:#8c6a25 }` (stop 0); `.pin.terminal .flag { fill:var(--rust); stroke:#7c3f24 }` (stop 10).
  - `.pin.active .dot { fill:var(--rust); stroke:#7c3f24; transform:scale(1.25) }`; `.pin.active .pin-label { fill:var(--rust); font-weight:bold }`.
  - `.pin:focus { outline:none }`; `.pin:focus-visible .dot { stroke:var(--rust); stroke-width:3; transform:scale(1.25) }`; `.pin:focus-visible .pin-label { fill:var(--rust); font-weight:bold }`.
- Label placement: `labelDy` = `c.y > 235 ? -34 : 30` (above if dot low, below if high); pct offset further (`dy<0 ? -12 : +13`). 44px hit via invisible r26 `.pin-hit`.
- Keyboard: Enter/Space -> `toggleStop(i)`.
- Mobile: the trail is NOT hidden -- it becomes a horizontal scroller (3.10a) sitting ABOVE the `.mobile-route` list (3.10); pins stay clickable, `.pin-hit` r bumps to `32px` (`>=44px` tap at the reduced scale).

### 3.9 Chapter legend (`.legend-list`)

- Purpose: scannable antique index-card list of all stops (desktop).
- Anatomy: `.legend-list-wrap` > `h4.legend-list-head[data-i18n]` + `ul#legendList.legend-list` of `li.{is-start|is-terminal}` > `button[aria-expanded][data-idx]` > `span.lnum` (medallion, holds pct) + `span` (label).
- Key rules: wrap `margin-top:24px; padding-top:18px; border-top:1px solid var(--line-soft); z-index:2`. Head `--sans` `0.72rem` `0.2em` uppercase `--teal-deep`, `::before` rotated rust diamond `7x7`. List `grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap:8px`. Button `min-height:46px; padding:8px 14px; --sans 0.84rem; border:1px solid var(--line); border-radius:var(--radius-sm); box-shadow:var(--shadow-1); background: linear-gradient(180deg, rgba(255,255,255,0.28), rgba(0,0,0,0.012)), var(--parchment2)`.
  - `.lnum`: `30x30; border-radius:50%; border:2px solid var(--sepia); background:var(--parchment); color:var(--sepia); 0.66rem bold; inset 0 0 0 1px rgba(243,234,212,0.6)`.
- States:
  - `:hover`: `background:var(--sand-deep); border-color:var(--gold); box-shadow:var(--shadow-2); transform:translateY(-1px)` (lift); `.lnum` -> border gold, color rust.
  - `:focus-visible`: `outline:2px solid var(--rust); outline-offset:1px`.
  - `[aria-expanded=true]`: `background:var(--sand-deep); border-color:var(--rust); box-shadow:inset 2px 0 0 var(--rust), var(--shadow-1)` (rust inset bar); `.lnum` -> rust fill, `#7c3f24` border, parchment text.
  - `li.is-start .lnum`: gold fill, `#8c6a25` border, parchment text. `li.is-terminal .lnum`: rust fill, `#7c3f24` border, parchment text.
- Motion: `transition: background-color/border-color/box-shadow/transform var(--dur) var(--ease)`.
- Mobile (`<=560`): `.legend-list-wrap { display:none }` (replaced by `.mobile-route`).

### 3.10 Mobile route list (`.mobile-route`)

- Purpose: vertical dashed-spine route list = the PRIMARY mobile navigation, sitting BELOW the scrollable map (3.10a) and replacing the desktop legend grid. (Earlier it replaced the trail SVG too; the map is now kept as a scroller above it.)
- Anatomy: `.mobile-route` > `ol#mobilePins` > `li.{is-start|is-terminal}` > `button.mpin[aria-expanded][data-idx]` > `span.mnum` (medallion pct) + `span` (label).
- Key rules: `ol { padding:0 0 0 26px; position:relative }`; `ol::before` dashed spine `left:9px; top:6px; bottom:6px; border-left:2.4px dashed var(--rust); opacity:0.85`. `.mpin { min-height:52px; padding:12px 14px; --sans 0.94rem; gap:14px; border:1px solid var(--line); border-radius:var(--radius-sm); box-shadow:var(--shadow-1); background: linear-gradient(180deg, rgba(255,255,255,0.28), rgba(0,0,0,0.012)), var(--parchment2) }`. `.mnum { 34x34; margin-left:-27px (sits on spine); border-radius:50%; border:2px solid var(--sepia); background:var(--parchment); color:var(--sepia); 0.66rem bold; box-shadow:0 1px 3px var(--shadow), inset 0 0 0 1px rgba(243,234,212,0.6) }`.
- States: `:hover` sand-deep + gold border; `:focus-visible` rust outline offset1; `[aria-expanded=true]` sand-deep + rust border + rust inset bar, `.mnum` -> rust fill/`#7c3f24`/parchment. `li.is-start/.is-terminal .mnum` gold/rust as legend.
- Visibility: shown only `<=560px` (`.mobile-route { display:block }`), hidden `>=561px`.
- Hit target: `>=52px` (exceeds 44 min).

### 3.10a Mobile scrollable map (`.trail-shell.desktop-trail` on `<=560px`) + pan hint (`.map-hint`)

- Purpose: keep the full terrain map usable on mobile instead of hiding it -- a horizontally pannable, scaled-down plate above the `.mobile-route` list (the map is the visual layer; the list is the primary nav).
- Approach (ALL inside `@media (max-width:560px)`; desktop `>=561px` is byte-identical to before -- base `.trail-shell`/`.trail-svg`/`.pin-hit` rules untouched, only mobile overrides + the new `.map-hint` selectors added):
  - `.desktop-trail { display:block }` (no longer hidden); `.legend-list-wrap { display:none }`; `.mobile-route { display:block }` (unchanged).
  - `.trail-shell.desktop-trail` becomes the scroll container: `overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; overscroll-behavior-x:contain`.
  - Edge fades: parchment hint of more-map via a `mask-image: linear-gradient(90deg, transparent 0, #000 26px, #000 calc(100% - 26px), transparent 100%)` on the shell (no extra DOM; fades both left + right edges).
  - Scrollbar: subtle sepia -- `scrollbar-width:thin; scrollbar-color: var(--sepia-soft) transparent`; WebKit `::-webkit-scrollbar { height:6px }` + transparent track + `var(--sepia-soft)` `3px`-radius thumb.
  - `.trail-svg` fixed rendered width `960px` (`max-width:none; height:auto; aspect-ratio: 1200 / 470` -- derived from the route viewBox, so terrain is never squashed). 960/1200 = 0.8 render scale.
  - `.pin .pin-hit { r: 32px }` (CSS SVG geometry override) so the invisible tap target stays `>=44px` at 0.8 scale (`32*0.8 = ~25.6px` radius -> ~51px diameter).
- Pan hint (`p#mapHint.map-hint[aria-hidden]`, before the shell): atlas-style centered italic `0.84rem` `var(--sepia-soft)` "Проведите по карте" / EN "Swipe to pan the map" (`data-i18n=mapHint`) + a small inline-SVG left-right arrow glyph (`.map-hint-arrow`, `viewBox 0 0 30 9`, sepia strokes -- no external asset). `transition: opacity .3s var(--ease)`; `.is-gone { opacity:0; pointer-events:none }`. Visible only on mobile (`display:none` at `>=561px`); fades out one-time after the first scroll.
- JS (vanilla, no storage):
  - `setupMapScroll()` (called in `init`): snaps shell `scrollLeft=0` (trailhead reading start) and wires a one-time `scroll` listener that adds `.is-gone` to `#mapHint` after `scrollLeft>6`, then removes itself.
  - `scrollPinIntoView(i)` (called at the end of `openStop`): centers the active pin's x in the viewport via `shell.scrollTo({ left, behavior })` -- `behavior:'smooth'` unless `prefers-reduced-motion:reduce` (then `'auto'`/instant), clamped to `[0, scrollWidth-clientWidth]`. Pin x in viewBox units * (renderedWidth/1200).
  - Feature-detect, never viewport-detect: `mapScrollable(shell)` = `scrollWidth - clientWidth > 4`, true ONLY when the CSS scroller is active (mobile). So `scrollPinIntoView` is a no-op on desktop -- desktop behaviour unchanged.
- No-JS: the scroller is pure CSS -- the map renders + pans with JS off; the hint shows statically (only its one-time fade needs JS). Pins still open the field note via... (JS-dependent, as on desktop -- the no-JS static fallback is the shared-lib build's job per section 6.3, unchanged here).
- Route draw-in on mobile: unchanged -- the stroke-dashoffset draw is position-independent and plays once on load (gated by reduced-motion); horizontal scroll does not retrigger or skew it.

### 3.11 Field-note / chapter panel (`.field-note`)

- Purpose: in-place journal-page panel opened by a pin/legend/mobile click; never navigates away.
- Anatomy (built by `openStop`, injected into `#fieldNote[aria-live=polite]`):
  ```
  .field-note{.is-start|.is-terminal}
    .fn-head
      span.badge (pct)
      h4 (label)
      button.fn-close (onclick=closeStop)
    .fn-body
      p.blurb        (drop-cap first letter)
      ul > li*       (diamond bullets)
      p.fn-example   (b: example label + text)  -- optional
  ```
- Key rules: `position:relative; border:1px solid var(--sepia-soft); border-radius:var(--radius-md); max-width:760px; margin:0 auto; overflow:hidden; background: linear-gradient(180deg, rgba(255,255,255,0.4), rgba(0,0,0,0.015)), var(--parchment2); box-shadow: inset 0 0 0 1px rgba(243,234,212,0.7), var(--shadow-2)`. Lives in `.legend-wrap{ z-index:3; margin-top:18px }`.
  - `::before` corner ticks: `inset:7px`, 8 line-gradients sized `12px`, four corners, `opacity:0.55`.
  - `.fn-head`: `flex; gap:14px; padding:16px 20px 14px; background: linear-gradient(90deg, rgba(92,74,50,0.12), rgba(92,74,50,0)); border-bottom:1px dashed var(--line)`.
  - `.badge`: `--sans 0.78rem bold 0.05em; color:var(--parchment); background: linear-gradient(180deg, var(--teal), var(--teal-deep)); border:1px solid var(--teal-deep); border-radius:var(--radius-sm); inset 0 1px 0 rgba(255,255,255,0.2); padding:7px 11px; min-width:52px`. Variant: `.is-terminal .badge` rust gradient `(var(--rust),#8c4a2b)` border `#7c3f24`; `.is-start .badge` gold gradient `(var(--gold),#8c6a25)` border `#8c6a25`.
  - `h4`: `1.24rem; --sepia; 0.015em; line-height:1.2; flex:1`.
  - `.fn-close`: `--sans 0.72rem 600 0.1em uppercase; background:var(--parchment); border:1px solid var(--sepia-soft); color:var(--sepia-soft); border-radius:var(--radius-sm); padding:9px 13px; min-height:40px; min-width:44px`. Hover: rust fill, `#7c3f24` border, parchment text. Focus-visible: `2px solid var(--rust)` offset1.
  - `.fn-body`: `padding:18px 22px 22px`.
  - `.blurb`: `0 0 16px; italic; --ink; 1.04rem; line-height:1.58`. `::first-letter` drop-cap: `font-style:normal; font-weight:600; font-size:2.6em; line-height:0.78; float:left; margin:4px 8px 0 0; color:var(--rust)` (mobile 2.3em).
  - `ul` list-style none; `li`: `--sans 0.9rem; --sepia; padding:8px 0 8px 26px; border-top:1px dotted var(--line); line-height:1.45` (`:first-child` no border). `li::before` diamond bullet: `position:absolute; left:4px; top:13px; 9x9; background:var(--rust); transform:rotate(45deg); box-shadow:0 0 0 2px var(--parchment2)`.
  - `.fn-example`: `margin-top:16px; padding:11px 14px; --sans 0.85rem; line-height:1.5; color:var(--teal-deep); background:rgba(74,111,106,0.10); border-left:3px solid var(--teal); border-radius:var(--radius-sm)`. `b`: `inline-block; margin-right:4px; uppercase 0.72rem 0.1em; color:var(--teal)`.
- Motion: `animation: noteIn .3s var(--ease)` -> `@keyframes noteIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }` (transform+opacity only). Disabled under reduced-motion.
- Open/close: `openStop(i)` injects markup + hides `#legendHint`; `closeStop()` clears `#fieldNote` + restores hint; both call `syncActiveState`.
- Mobile (`<=560`): `margin:0 -2px`; head wraps (`flex-wrap:wrap`), `h4` becomes `flex:1 1 100%; order:3`, head padding `14px 16px 12px`; body `16px 18px 20px`; drop-cap `2.3em`.

### 3.12 Progress strip (`.progress-strip`)

- Purpose: brass-plate cartouche under the map -- START 0% ... track ... 100% SUMMIT.
- Anatomy: `.progress-strip` > `span[data-i18n=pStart]` + `.track > span` + `span[data-i18n=pEnd]`.
- Key rules: `margin-top:26px; flex; align-items:center; gap:16px; padding:12px 18px; --sans 0.72rem 600 0.12em uppercase; color:var(--sepia); border:1px solid var(--sepia-soft); border-radius:var(--radius-md); box-shadow: inset 0 0 0 1px rgba(243,234,212,0.7), var(--shadow-1); background: linear-gradient(180deg, rgba(255,255,255,0.32), rgba(0,0,0,0.015)), var(--parchment2); z-index:2`.
  - `.track`: `flex:1; height:9px; background:var(--sand-deep); border:1px solid var(--line); border-radius:5px; overflow:hidden; box-shadow: inset 0 1px 2px rgba(60,46,26,0.18)`.
  - `.track span`: `height:100%; width:100%; background: linear-gradient(90deg, var(--gold), var(--rust))` (full bar, gold->rust gradient).
- Mobile (`<=560`): `font-size:0.64rem; gap:12px; padding:11px 14px; letter-spacing:0.08em`.
- Motion: none in mockup (track is static full; a real build may animate `width`).

### 3.13 Footer colophon (`footer.site`)

- Purpose: ornamental colophon with mandatory ecosystem cross-links.
- Anatomy: `svg.colophon-rule` + `.colophon-note[data-i18n=footNote]` + `.links` (a brewpage.app + `.sep` + a brewpage-openapi).
- Key rules: `margin-top:54px; padding-top:28px; flex column; align-items:center; gap:14px; text-align:center; --sans 0.8rem; color:var(--sepia-soft)`.
  - `.colophon-rule`: `viewBox 0 0 260 14`, `width:min(260px,70%); opacity:0.7`; two hairlines + centered diamond ornament (rust dots + outlined rust diamond at 130,7).
  - `.colophon-note`: italic `0.04em` `--sepia-soft`.
  - `.links`: `flex; gap:14px 24px; flex-wrap:wrap; justify-content:center; 0.78rem 0.1em uppercase`. `.sep` color `--line`, `user-select:none`.
  - `a`: color `--teal-deep`; `border-bottom:1px dotted var(--teal)`; hover -> `--rust` + rust dotted border; `:focus-visible` `2px solid var(--rust)` offset2.
- MANDATORY links (hard rule, page not done without BOTH): `https://brewpage.app` and `https://github.com/kochetkov-ma/brewpage-openapi` (both `target=_blank rel=noopener`).
- Motion: `transition: color/border-color var(--dur) var(--ease)` on links.

### 3.14 Mockup navigator (`#mokup-nav`) -- DEV CHROME, NOT part of the final site

- Purpose: dev-only prev/next mockup pager (parchment pill). EXCLUDE from the real site build.
- Self-contained: scoped `<style id=mokup-nav-style>`, `<nav id=mokup-nav>`, scoped `<script id=mokup-nav-script>`. Fixed bottom-center pill, `z-index:9999`, parchment gradient, `border-radius:999px`, `44px` hit targets, arrow links + `1 / 2 Atlas` label.
- Behaviour: arrow keys Left/Right navigate between mockup files (guarded against input/textarea/select/contenteditable + modifier keys).
- Build note: DO NOT port `#mokup-nav` (style/nav/script) into the production page. It is review scaffolding only.

---

## 4. Interaction model

| Trigger | Effect |
|---------|--------|
| Pin click / Enter / Space | `toggleStop(i)` |
| Legend button click | `toggleStop(i)` (same handler) |
| Mobile `.mpin` click | `toggleStop(i)` (same handler) |
| `.fn-close` click | `closeStop()` |
| `toggleStop(i)` | if `activeStop === i` -> close; else `openStop(i)` |
| `openStop(i)` (mobile) | also `scrollPinIntoView(i)` -> centers the active pin in the map scroller (smooth, or instant under reduced-motion) |
| First map scroll (mobile) | hides `#mapHint` once (`.is-gone`), then unbinds |

- Pin click == legend click == mobile click -> field-note opens in place (no navigation). `openStop` injects the panel into `#fieldNote`, hides `#legendHint`, calls `syncActiveState(i)`, then `scrollPinIntoView(i)` (mobile-only no-op elsewhere).
- Mobile map (3.10a): the full terrain map is a horizontal scroller above the `.mobile-route` list; tapping a map pin OR a list item activates the same stop, syncs all active states, opens the same field note, and centers the pin in the scroller. Initial scroll = trailhead (left). One-time pan hint fades on first scroll.
- Active-state sync (`syncActiveState`): toggles `.pin.active` + `aria-expanded` on every pin; toggles `aria-expanded` on every `#legendList button` + `.mobile-route .mpin`. One active stop drives pin + legend + mobile + panel together.
- Single-open model: opening a new stop replaces the panel; clicking the active stop again closes it.
- `activeStop` integer state (-1 = none). On lang switch, if a stop is open it re-renders via `openStop(activeStop)`.

### 4.1 i18n (`data-i18n` + `DATA[lang]`)

- `setLang(l)`: sets `<html lang>`, toggles `.active` + `aria-pressed` on both lang buttons, rewrites every `[data-i18n]` element's `textContent` from `DATA[l][key]`, rebuilds pins/legend/mobile, re-opens active stop.
- Data store: `DATA.ru` / `DATA.en`, each with scalar keys (brandTitle, brandSub, heroKicker, heroTitle, heroPromise, mapTitle, mapSub, mapHint, legendListHead, legendHint, pStart, pEnd, footNote, close, exampleLabel) + `stops[]` (11 stops, each `{label, blurb, pts[], ex}`). `mapHint` = mobile pan hint ("Проведите по карте" / "Swipe to pan the map").
- RU is default (`<html lang=ru>`, `lang="ru"`, `init` calls `setLang("ru")`).
- `STOP_COUNT = 11`; pct helper: stop0=`0%`, stop10=`100%`, else `i*10%`. kind: stop0=`start`, stop10=`terminal`, else `""`.

### 4.2 Keyboard

- Pins: roving via `tabindex=0` + `role=button` + Enter/Space.
- Arrow Left/Right = mockup navigation (DEV ONLY, part of `#mokup-nav`; NOT a site feature).

---

## 5. Do-not rules (FIXED)

| # | Do NOT | Instead |
|---|--------|---------|
| 1 | Load any webfont / `@font-face` / external font | system stacks `--serif` + `--sans` only |
| 2 | Make any external request (font/image/CDN/analytics) | fully self-contained; inline SVG only |
| 3 | Use `<ellipse>` / `<circle>` for ANY landform | irregular hand-drawn bezier `<path>` (circles only for pins/seal/compass/colophon ornaments) |
| 4 | Use gray or pure-black shadows | sepia-tinted `rgba(60,46,26,*)` / line-toned only |
| 5 | Let terrain compete with the route | terrain low-alpha + below; rust route is the hero |
| 6 | Animate anything but transform/opacity | route uses dash-offset draw; note uses translateY+opacity; gate on reduced-motion |
| 7 | Use smart quotes / em-dash / unicode in code | ASCII only |
| 8 | Port `#mokup-nav` into production | dev chrome; drop it |
| 9 | Close contour/shore/hill loops | keep them open curves hugging ranges |
| 10 | Float a CDN version (`@latest` etc.) | none needed -- zero deps; if ever added, pin exact `X.Y.Z` |

---

## 6. Build mapping (-> shared-lib architecture)

Per `.claude/rules/site-architecture.md`: one `shared/`, theme = one file, base.css never forked, lib `init(rootEl, config) => { destroy() }`, page glue sets `.has-js` + wires hosts.

### 6.1 `shared/css/themes/atlas.css`

- Defines ONLY `:root` token VALUES from section 1.7 (the `--c-*`, `--sp-*`, `--fs-*`, `--radius-*`, `--font-*`, `--bw-*`, `--shadow-*`, `--dur-*`, `--ease-*`, `--container-max` namespace) PLUS the atlas extras (`--c-surface-3`, `--c-heading`, `--c-border-soft`, `--font-ui`), the cartography rgba set (section 3.6 table) and the inline darkening hex set (1.1). Keep original `--sand`/`--sepia`/... aliases for readable SVG rules. No selectors beyond `:root`. Swapping this one `<link>` reskins the page.

### 6.2 `shared/css/base.css` (structure + component shells, `var(--...)` only)

Class hooks to author (map mockup classes -> shared classes; carry NO literal):
- layout: `.container` (`.wrap`), `.visually-hidden`, `.skip-link`, `.js-only`/`.no-js-only`.
- header: `.site-header`/`__inner`/`__brand` (`header.site`/`.brand`), seal slot; `.lang-toggle` segmented control (`[aria-pressed]`).
- hero: `.hero`/`__kicker`/`__title`/`__promise`/`__rule` (kicker flourishes via `::before/::after`, promise `::first-line`).
- atlas plate: `.diagram-host` family or a recipe `.atlas`/`__head`/`__compass` shell with the double-frame box-shadow stack, vignette `::before`, corner-tick `::after`.
- trail SVG: `.diagram-host__svg` with `.terrain`/`.ter-*` cartography classes, `.route-line`/`.route-shadow`/`.route-draw`, `.pin` family (`.pin-hit`/`.flag-pole`/`.flag`/`.dot`/`.num`/`.pin-label`/`.pin-pct`) + `.pin.start`/`.terminal`/`.active`/`:focus-visible`.
- legend: `.legend-list`/`__head`/`.lnum` (`card`-like grid -> mobile list), `is-start`/`is-terminal`.
- mobile route: `.mobile-route`/`.mpin`/`.mnum` (spine `ol::before`).
- field note: `.field-note` (journal panel) with `__head`/`.badge`/`h4`/`.fn-close`/`__body`/`.blurb`/`li`/`.fn-example`, corner-tick `::before`, `noteIn` keyframe, `is-start`/`is-terminal`.
- progress: `.progress-strip`/`.track` (brass cartouche).
- footer: `.site-footer`/`__inner`/`__note`/`__links` with mandatory cross-links, `.colophon-rule`, `.sep`.
- motion: `@keyframes routeDraw`, `@keyframes noteIn`; reduced-motion guard block. All color/size/font/duration via `var(--...)`.

### 6.3 lib modules (`shared/js/lib/*.js`, IE owns internals; this agent wires)

| Module | Responsibility (from mockup behaviour) | Host / selector | Config |
|--------|----------------------------------------|-----------------|--------|
| `route-draw.js` (new) | sample N points on `ROUTE_D`, set `--route-len`, run gated draw-in (IntersectionObserver + reduced-motion), `.has-anim` -> `.anim-done` handoff | `[data-component="trail"]` / `#trailSvg` | `{ routeD, stopCount }` |
| `pins.js` / extend `drilldown.js` | build pins on sampled points, build legend list + mobile list, `toggleStop`/`openStop`/`closeStop`/`syncActiveState`, keyboard Enter/Space, aria-expanded sync, render field-note panel | `[data-component="drilldown-host"]` (trail) ; `[data-slot=svg]` pins, `[data-slot=legend]`, `[data-slot=mobile]`, `[data-slot=panel]` | `{ dataSrc, stopCount }` |
| `i18n.js` | active-lang store (RU default), `[data-i18n]` text rewrite, `setLang`, `aria-pressed` toggle, re-render hooks | `document` + `.lang-toggle` | `{ locale }` |
| `a11y.js` | `prefersReducedMotion`, aria-live announcer for `#fieldNote` (`aria-live=polite`) | -- | -- |

- Page glue `shared/js/pages/landing.js`: add `.has-js`, import `i18n` + `pins`/`drilldown` + `route-draw`, find hosts by `data-component`/`data-slot`, `init(host, config)`, collect instances, `destroy()` on `pagehide`. The mockup's inline `init()`/`setLang()`/`buildPins()`/`samplePoints()`/`setupRouteAnim()` decompose into these modules. RU/EN store + stops data move to `shared/data/` (`glossary.json` for scalar i18n strings; a `stops`/`diagram-data.js` contract for the 11 stops -- `{ id, label, level, parent, children, summary, pts[], ex }`, exactly one root).
- No-JS degradation: ship a static inline-SVG trail + the 11 stops as a plain prose list inside `.no-js-only`; live pins/panel mount inside `.js-only`. JS only enhances.
- Data: 11 stops live as authored values (CA owns final copy in `content/<lang>/` + the stop contract values); this doc fixes the SHAPE only. The RU/EN `DATA` blocks in the mockup (lines ~1378-1503) are the seed copy.

### 6.4 Variants

The atlas theme is one `themes/atlas.css`. Other RAG-Guide themes (e.g. metro from `02-metro.html`) are sibling token files over the SAME `base.css` + page glue; only the theme `<link>` differs per variant `index.html`.
