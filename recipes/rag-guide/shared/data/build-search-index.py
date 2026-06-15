#!/usr/bin/env python3
"""
build-search-index.py -- ONE-OFF generator for shared/data/search-index.json.

NOT part of any runtime/build step (the site has none). Run by hand when chapter
prose changes:  python3 shared/data/build-search-index.py   (cwd = recipe root)

EN-PRIMARY model (post i18n migration):
  The static chapter HTML is now ENGLISH source of truth. Russian prose lives in
  the runtime overlay shared/data/prose-ru.js (export default PROSE_RU), keyed by
  page slug + each leaf's data-pk attribute; prose-i18n.js swaps it in at runtime.
  So:
    * EN heading/body  <- the (English) chapter HTML <article class="chapter-prose">
    * RU heading/body  <- prose-ru.js, matched by the section's data-pk keys
  This replaces the old RU-from-HTML + EN-from-md flow (which now stuffs English
  into every RU slot because the HTML stopped being Russian).

Source of truth for LINK TARGETS = the rendered chapter HTML pages (stable
id="pr-*" section anchors). The h2 of each section carries data-pk="<sect>.h2";
its body leaves carry data-pk="<sect>.<leaf>" in document order. The same keys
index into prose-ru.js[slug] to recover the Russian.

Output contract (consumed by shared/js/lib/search.js):
  {
    "_schema": {...},
    "pages": [ { "id": <slug>, "href": "<page>.html", "t": { "ru":..., "en":... } } ],
    "docs": {
      "ru": [ { "p": <page-index>, "a": "<anchor>", "h": "<heading>", "b": "<body>" } ],
      "en": [ ... same shape, positionally aligned by section ... ]
    }
  }
Compact by design: short keys; one doc per real section (not per page); body
capped to BODY_CAP chars (enough to match + snippet, not a full-text dump);
chapter title carried once per page in `pages`, not duplicated into every doc.
"""

import json
import os
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
RECIPE = os.path.abspath(os.path.join(HERE, "..", ".."))
PROSE_RU_JS = os.path.join(HERE, "prose-ru.js")
OUT = os.path.join(HERE, "search-index.json")

BODY_CAP = 600  # chars of body text kept per section (match + snippet budget)

# Pages to index, in route order. index.html (the map) carries no prose article.
PAGE_ORDER = [
    "what-rag", "why-rag", "search", "chunking", "embedding", "vector-store",
    "assemble-context", "generation", "evaluation", "production",
    "payload-anatomy",
]
# Editorial sections we never index (boilerplate / navigation tail).
SKIP_ANCHORS = {"pr-sources", "pr-about"}


def strip_tags(s):
    s = re.sub(r"<(script|style)\b.*?</\1>", " ", s, flags=re.S | re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
          .replace("&quot;", '"').replace("&bull;", "-").replace("&larr;", "<-")
          .replace("&nbsp;", " "))
    s = re.sub(r"\s+", " ", s).strip()
    return s


def page_title_en(html):
    m = re.search(r"<title>(.*?)</title>", html, re.S)
    if not m:
        return ""
    # keep just the chapter title (strip the " - ... - RAG Guide" suffix)
    return strip_tags(m.group(1)).split(" - ")[0].strip()


def page_title_ru(ru_page):
    """RU page title from prose-ru.js __title (same " - " suffix-strip as EN)."""
    title = (ru_page or {}).get("__title", "")
    return title.split(" - ")[0].strip()


def load_prose_ru():
    """Evaluate the prose-ru.js ES module via node and return PROSE_RU as a dict.

    prose-ru.js is `export default PROSE_RU`. We dump only the page-slug keys
    (skipping every _-prefixed metadata key) to JSON on stdout; node warnings go
    to stderr and never reach the JSON. No node dependency at runtime -- this is a
    one-off authoring tool, and node already ships with the repo toolchain.
    """
    script = (
        "import P from %s;"
        "const o={};for(const[k,v]of Object.entries(P)){if(k.startsWith('_'))continue;o[k]=v;}"
        "process.stdout.write(JSON.stringify(o));"
    ) % json.dumps(PROSE_RU_JS)
    res = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        capture_output=True, text=True, check=True,
    )
    return json.loads(res.stdout)


def ru_value_text(node):
    """One prose-ru leaf ({t} or {html}) -> plain text (inline tags stripped)."""
    if not isinstance(node, dict):
        return ""
    if "t" in node:
        return strip_tags(node["t"])
    if "html" in node:
        return strip_tags(node["html"])
    return ""


def sections(html):
    """Yield (anchor, h2_pk, h2_html, body_html, body_pks) per indexed section.

    body_pks = the data-pk leaf keys in document order, EXCLUDING the h2's own pk
    (used to recover RU body text from prose-ru.js).
    """
    m = re.search(r'<article class="chapter-prose"[^>]*>(.*?)</article>', html, re.S)
    if not m:
        return
    art = m.group(1)
    for sec in re.findall(r"<section\b[^>]*>(.*?)</section>", art, re.S):
        hm = re.search(r'<h2 id="([^"]+)"([^>]*)>(.*?)</h2>', sec, re.S)
        if not hm:
            continue
        anchor = hm.group(1)
        if anchor in SKIP_ANCHORS:
            continue
        h2pk_m = re.search(r'data-pk="([^"]+)"', hm.group(2))
        h2_pk = h2pk_m.group(1) if h2pk_m else None
        h2_html = hm.group(3)
        body_html = sec[hm.end():]
        all_pks = re.findall(r'data-pk="([^"]+)"', sec)
        body_pks = [pk for pk in all_pks if pk != h2_pk]
        yield anchor, h2_pk, h2_html, body_html, body_pks


def main():
    prose_ru = load_prose_ru()
    pages = []
    ru_docs = []
    en_docs = []
    for pi, slug in enumerate(PAGE_ORDER):
        hpath = os.path.join(RECIPE, slug + ".html")
        html = open(hpath, encoding="utf-8").read()
        ru_page = prose_ru.get(slug, {})

        pages.append({
            "id": slug,
            "href": slug + ".html",
            "t": {
                "ru": page_title_ru(ru_page) or page_title_en(html),
                "en": page_title_en(html),
            },
        })

        for anchor, h2_pk, h2_html, body_html, body_pks in sections(html):
            # EN: straight from the (English) HTML.
            en_h = strip_tags(h2_html)
            en_b = strip_tags(body_html)[:BODY_CAP]
            # RU: from prose-ru.js, matched by data-pk.
            ru_h = ru_value_text(ru_page.get(h2_pk)) if h2_pk else ""
            ru_b = " ".join(
                t for t in (ru_value_text(ru_page.get(pk)) for pk in body_pks) if t
            )
            ru_b = re.sub(r"\s+", " ", ru_b).strip()[:BODY_CAP]
            # Fall back to EN only if a RU leaf is genuinely absent (keeps the
            # index complete rather than emitting an empty doc).
            ru_docs.append({"p": pi, "a": anchor, "h": ru_h or en_h, "b": ru_b or en_b})
            en_docs.append({"p": pi, "a": anchor, "h": en_h, "b": en_b})

    out = {
        "_schema": {
            "purpose": "Compact bilingual full-text index over the RAG Guide chapters for shared/js/lib/search.js. EN-primary: EN text comes from the (English) chapter HTML; RU text comes from shared/data/prose-ru.js (keyed by data-pk). Built by build-search-index.py. Zero external requests at runtime.",
            "shape": "{ pages:[{id,href,t:{ru,en}}], docs:{ ru:[{p,a,h,b}], en:[{p,a,h,b}] } }. p=index into pages[]; a=in-page #anchor; h=section heading (heading-weighted); b=section body excerpt (capped). Link target = pages[p].href + '#' + a.",
            "rules": [
                "one doc per real chapter section (sources/about tails excluded); body capped, not full text",
                "RU and EN doc arrays are positionally aligned (same p/a, localized h/b)",
                "EN h/b from the English chapter HTML; RU h/b from prose-ru.js matched by data-pk",
                "underscore-prefixed keys are metadata; consumers MUST skip them",
                "regenerate via build-search-index.py when chapter prose changes; do not hand-edit",
            ],
        },
        "pages": pages,
        "docs": {"ru": ru_docs, "en": en_docs},
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size = os.path.getsize(OUT)
    print(f"wrote {OUT}")
    print(f"  pages={len(pages)} ru_docs={len(ru_docs)} en_docs={len(en_docs)}")
    print(f"  size={size} bytes ({size/1024:.1f} KB)")


if __name__ == "__main__":
    main()
