---
id: T-PLATFORM-SCAFFOLD
title: "Shared modular scaffold: base.css + 3 theme files (ink/paper/blueprint) + shared HTML components + 3 variant entry pages + data-contract schemas"
status: closed
priority: P1
owner: site-builder
created: 2026-06-04
updated: 2026-06-08
tags: [platform, scaffold, static, prototype, themes]
links: []
---

## Context
Prototype phase for the RAG Guide site: a reduced-depth prototype built in THREE visual
variants (ink / paper / blueprint) on ONE shared modular architecture. Before any variant or
recipe content can be assembled, the shared library must exist. The deliberate stack stays the
SIMPLEST: plain static HTML + minimal vanilla JS (ES modules) + hand-written CSS using
CSS variables only. No framework, no bundler, no build step. The three variants must differ
ONLY by swapping a theme CSS file; structure, components, and JS stay shared. This is the
foundation `T-INTERACTIVE-RAG-CORE`, `T-RECIPE-RAG-GUIDE`, and `M-DOCS-SITE-ARCH` build on.

Scope (shared modular lib + 3 thin variant entries + data contracts):
- `shared/css/base.css` -- base styling; all color expressed via CSS variables ONLY (no hard-coded colors).
- `shared/css/themes/{ink,paper,blueprint}.css` -- three theme files overriding the CSS variables; swap-only differentiation.
- `shared/components/*.html` -- shared HTML components (header, footer, nav shell, section frames, diagram/glossary/worked-example mounts).
- `shared/js/lib/` + `shared/js/pages/` -- shared ES-module JS library + page wiring (lib owned/filled by `T-INTERACTIVE-RAG-CORE`; scaffold stubs the module boundaries + page entry points).
- `shared/data/` schemas -- data-contract schemas: `diagram-data.js`, `glossary.json`, `worked-example.json`, `nav.json`.
- `variants/{ink,paper,blueprint}/index.html` -- thin entry pages that load shared components + shared JS + base.css + their one theme file.
- `content/ru/` -- core RU markdown source (content authored by `T-RECIPE-RAG-GUIDE`; scaffold defines the folder + contract only).

## Acceptance
- [ ] `shared/css/base.css` exists; all color expressed via CSS variables only (no hard-coded color literals).
- [ ] `shared/css/themes/{ink,paper,blueprint}.css` each override the variable set; switching themes is a one-file swap.
- [ ] `shared/components/*.html` provide the reusable HTML structure (header/footer/nav + content mounts), shared by all three variants.
- [ ] `shared/js/lib/` + `shared/js/pages/` define the ES-module boundaries + page entry points (lib internals delivered by `T-INTERACTIVE-RAG-CORE`).
- [ ] `shared/data/` defines the data-contract schemas: `diagram-data.js`, `glossary.json`, `worked-example.json`, `nav.json`.
- [ ] `variants/{ink,paper,blueprint}/index.html` are thin entries that compose the shared lib + base.css + exactly one theme file each.
- [ ] `content/ru/` folder + contract defined for the core RU markdown source.
- [ ] Everything renders as static files opened directly / served flat -- NO build step (matches the brewpage.app publish pipeline in CLAUDE.md).

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-08: RESCOPED from a single plain-HTML scaffold to the 3-theme shared-lib prototype
  scaffold. CLAIMED to progress (R1 bookend); owner site-builder.
- Themes differ by SWAPPING a theme CSS file only -- base.css uses CSS variables exclusively.
- BLOCKS `T-INTERACTIVE-RAG-CORE` (shared JS lib needs the module boundaries + data schemas),
  `T-RECIPE-RAG-GUIDE` (content/variant assembly needs components + contracts), and
  `M-DOCS-SITE-ARCH` (records the architecture this task establishes).
- Prototype phase: nothing published, no release tag this phase.
- 2026-06-08: CLOSED (R2 bookend). DONE: shared modular scaffold built --
  `recipes/rag-guide/shared/{css/base.css, css/themes/{ink,paper,blueprint}.css, components/*,
  js/lib/*, js/pages/*, data/*}`, `content/ru/`, `variants/{ink,paper,blueprint}/index.html`.
  One-file-theme invariant verified (theme `<link>` is the only differing line per variant).
- Prototype phase -- no release tag, nothing published to brewpage.app.
