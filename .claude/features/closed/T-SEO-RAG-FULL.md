---
id: T-SEO-RAG-FULL
title: RAG Guide -- full per-page SEO (meta/canonical/hreflang/og/twitter/JSON-LD/robots/favicon/theme-color/og-image)
status: closed
priority: P1
owner: site-builder
created: 2026-06-14
updated: 2026-06-14
tags: [seo, rag, metadata, hreflang, opengraph, json-ld]
links:
  - EPIC-RAG-SEO-VERSIONING.md
  - T-CONTENT-RAG-BILINGUAL-FLIP.md
  - T-INTERACTIVE-RAG-LANG-URL.md
  - T-RECIPE-RAG-SITE.md
---

## Context
The staged site needs full discoverability metadata on every page before a curated milestone. Land the
complete per-page SEO head: title/description meta, canonical URL, `hreflang` (EN default + RU via
`?lang=ru`, consistent with the bilingual flip), Open Graph + Twitter card tags, JSON-LD structured
data, `robots` directives, favicon, `theme-color`, and an og-image. Stays plain static HTML; head
markup only, no framework. Coordinates with the EN-primary flip (`hreflang`/canonical reflect the
EN-default + `?lang=ru` URLs) and with the og-image asset fitting the publish-scope limits.

## Acceptance
- [x] Every page carries title + description meta and a correct canonical URL.
- [x] `hreflang` alternates declared for EN (default) + RU (`?lang=ru`), consistent with the bilingual flip.
- [x] Open Graph + Twitter card tags + an og-image present on every page.
- [x] JSON-LD structured data, `robots`, favicon, and `theme-color` present per page.
- [x] ASCII-only metadata; both ecosystem cross-links preserved; head markup stays plain static HTML.

## Notes
Running log: decisions, blockers, PR/commit/report links. On close, record the release tag
`vX.Y.Z` (unprefixed) + commit SHA here.

- 2026-06-14: Created + claimed (R1) under `EPIC-RAG-SEO-VERSIONING`. Owner site-builder (head/HTML
  metadata). Depends conceptually on the bilingual flip for canonical/hreflang URL shapes.
- 2026-06-14 (R2 close): CLOSED. Full per-page SEO landed on all 12 pages: title/description meta,
  param-less canonical, the hreflang trio (EN default + RU `?lang=ru` + x-default), Open Graph +
  Twitter cards, JSON-LD, robots, theme-color, favicon, and a local og-image; plus a local favicon set
  and `sitemap.xml`. Harness SEO **168/168 PASS**. Shipped under milestone tag **`v0.1.0`**
  (unprefixed), commit SHA **`68ddcab`**, pushed to origin. Live publish stays user-gated.
