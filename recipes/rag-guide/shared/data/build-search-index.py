#!/usr/bin/env python3
"""
build-search-index.py -- ONE-OFF generator for shared/data/search-index.json.

NOT part of any runtime/build step (the site has none). Run by hand when chapter
prose changes:  python3 shared/data/build-search-index.py

Source of truth for LINK TARGETS = the rendered chapter HTML pages (real
<article class="chapter-prose"> sections with stable id="pr-*" anchors + RU
heading text). EN heading + body text comes from content/en/*.md whose top-level
"## " headings align 1:1 (same order) with the RU page sections (verified).

Output contract (consumed by shared/js/lib/search.js):
  {
    "_schema": {...},
    "pages": [ { "id": <slug>, "href": "<page>.html", "t": { "ru":..., "en":... } } ],
    "docs": {
      "ru": [ { "p": <page-index>, "a": "<anchor>", "h": "<heading>", "b": "<body>" } ],
      "en": [ ... same shape, aligned by section ... ]
    }
  }
Compact by design: short keys; one doc per real section (not per page); body
capped to BODY_CAP chars (enough to match + snippet, not a full-text dump);
chapter title carried once per page in `pages`, not duplicated into every doc.
"""

import json
import os
import re
import glob

HERE = os.path.dirname(os.path.abspath(__file__))
RECIPE = os.path.abspath(os.path.join(HERE, "..", ".."))
EN_DIR = os.path.join(RECIPE, "content", "en")
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


def page_title(html):
    m = re.search(r"<title>(.*?)</title>", html, re.S)
    if not m:
        return ""
    # keep just the chapter title (strip the " - ... - RAG ..." suffix)
    return strip_tags(m.group(1)).split(" - ")[0].strip()


def html_sections(html):
    """Return [(anchor, heading, body)] for each <h2 id> section in the article."""
    m = re.search(r'<article class="chapter-prose"[^>]*>(.*?)</article>', html, re.S)
    if not m:
        return []
    art = m.group(1)
    # split on each <section ...> ... </section> that carries an h2 id
    out = []
    for sec in re.findall(r"<section\b[^>]*>(.*?)</section>", art, re.S):
        hm = re.search(r'<h2 id="([^"]+)"[^>]*>(.*?)</h2>', sec, re.S)
        if not hm:
            continue
        anchor = hm.group(1)
        if anchor in SKIP_ANCHORS:
            continue
        heading = strip_tags(hm.group(2))
        # body = section text after the heading
        body = strip_tags(sec[hm.end():])
        out.append((anchor, heading, body[:BODY_CAP]))
    return out


def en_sections(slug):
    """Real top-level '## ' sections from content/en/<slug>.md (skip code fences)."""
    path = os.path.join(EN_DIR, slug + ".md")
    if not os.path.exists(path):
        return []
    out = []
    cur_head = None
    cur_body = []
    in_fence = False
    title = None
    for raw in open(path, encoding="utf-8"):
        line = raw.rstrip("\n")
        if line.startswith("```"):
            in_fence = not in_fence
            cur_body.append(line)
            continue
        if not in_fence and line.startswith("# ") and title is None:
            title = line[2:].strip()
            continue
        if not in_fence and line.startswith("## "):
            if cur_head is not None:
                out.append((cur_head, "\n".join(cur_body)))
            cur_head = line[3:].strip()
            cur_body = []
        else:
            if cur_head is not None:
                cur_body.append(line)
    if cur_head is not None:
        out.append((cur_head, "\n".join(cur_body)))
    # md -> plain text body
    cleaned = []
    for head, body in out:
        b = re.sub(r"```.*?```", " ", body, flags=re.S)        # drop code blocks
        b = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", b)          # md links -> text
        b = re.sub(r"[#>*_`|-]+", " ", b)
        b = re.sub(r"\s+", " ", b).strip()
        cleaned.append((head.strip(), b[:BODY_CAP]))
    return title, cleaned


def main():
    pages = []
    ru_docs = []
    en_docs = []
    for pi, slug in enumerate(PAGE_ORDER):
        hpath = os.path.join(RECIPE, slug + ".html")
        html = open(hpath, encoding="utf-8").read()
        ru_secs = html_sections(html)
        en_title, en_secs_all = en_sections(slug)
        # align EN sections to RU sections by position, skipping the same tail
        # boilerplate anchors. EN md and RU html share section order 1:1.
        # Build an EN list parallel to the FULL html h2 list, then filter by skip.
        full = re.findall(
            r'<h2 id="([^"]+)"[^>]*>',
            re.search(r'<article class="chapter-prose"[^>]*>(.*?)</article>', html, re.S).group(1),
        )
        en_by_anchor = {}
        for anchor, (ehead, ebody) in zip(full, en_secs_all):
            en_by_anchor[anchor] = (ehead, ebody)

        pages.append({
            "id": slug,
            "href": slug + ".html",
            "t": {"ru": page_title(html), "en": (en_title or page_title(html))},
        })
        for anchor, heading, body in ru_secs:
            ru_docs.append({"p": pi, "a": anchor, "h": heading, "b": body})
            eh, eb = en_by_anchor.get(anchor, (heading, body))
            en_docs.append({"p": pi, "a": anchor, "h": eh, "b": eb})

    out = {
        "_schema": {
            "purpose": "Compact bilingual full-text index over the 12 RAG Guide chapters for shared/js/lib/search.js. Built by build-search-index.py from the rendered chapter HTML (RU + link anchors) + content/en/*.md (EN text). Zero external requests at runtime.",
            "shape": "{ pages:[{id,href,t:{ru,en}}], docs:{ ru:[{p,a,h,b}], en:[{p,a,h,b}] } }. p=index into pages[]; a=in-page #anchor; h=section heading (heading-weighted); b=section body excerpt (capped). Link target = pages[p].href + '#' + a.",
            "rules": [
                "one doc per real chapter section (sources/about tails excluded); body capped, not full text",
                "RU and EN doc arrays are positionally aligned (same p/a, localized h/b)",
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
