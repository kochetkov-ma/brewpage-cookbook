#!/usr/bin/env python3
"""Self-check concept 09 (why-rag) after defect fixes.
Captures: desktop load, desktop mid-anim, desktop drilled (blue-ring scan),
390px mobile (stacked legibility). Scans for Chrome blue focus ring."""
import os
from playwright.sync_api import sync_playwright
from PIL import Image

BASE = "/Users/maximus/IdeaProjects/brewpage-cookbook"
URL = f"file://{BASE}/recipes/rag-guide/mokups/concepts/why-rag/09-logbook.html"
OUT = f"{BASE}/.claude/reports/20260611-qa09-whyrag/screenshots"
os.makedirs(OUT, exist_ok=True)

logs = []

def blue_ring_cols(path):
    img = Image.open(path).convert("RGB"); w, h = img.size; px = img.load()
    hot = 0
    for x in range(0, w, 2):
        for y in range(0, h, 4):
            r, g, b = px[x, y]
            # Chrome default focus blue ~ rgb(0,95,204)
            if b > 150 and b - r > 90 and b - g > 50:
                hot += 1
    return hot

def run():
    with sync_playwright() as pw:
        br = pw.chromium.launch(headless=True)

        # desktop
        ctx = br.new_context(viewport={"width": 1280, "height": 820}, locale="ru-RU")
        pg = ctx.new_page()
        pg.on("console", lambda m: logs.append(f"[{m.type}] {m.text}"))
        pg.on("pageerror", lambda e: logs.append(f"[ERROR] {e}"))
        pg.goto(URL, wait_until="networkidle"); pg.wait_for_timeout(300)
        pg.screenshot(path=f"{OUT}/s1-load.png")
        pg.wait_for_timeout(3500)
        pg.screenshot(path=f"{OUT}/s2-anim.png")
        # drill into the Индекс log line, then check for blue ring
        pg.locator("#ll-index").click(); pg.wait_for_timeout(900)
        pg.screenshot(path=f"{OUT}/s3-drill.png")
        # nested drill into the fragment (level 2)
        pg.locator("#fragTop").click(); pg.wait_for_timeout(900)
        pg.screenshot(path=f"{OUT}/s4-drill2.png")
        # report active element + computed outline
        info = pg.evaluate("""() => {
          const a = document.activeElement;
          const cs = a ? getComputedStyle(a) : null;
          return { tag: a && a.tagName, id: a && a.id, cls: a && a.getAttribute('class'),
                   outline: cs && cs.outlineStyle + ' ' + cs.outlineColor + ' ' + cs.outlineWidth };
        }""")
        logs.append("ACTIVE-AFTER-DRILL: " + str(info))
        ctx.close()

        # mobile 390
        ctx2 = br.new_context(viewport={"width": 390, "height": 844}, locale="ru-RU")
        pg2 = ctx2.new_page()
        pg2.goto(URL, wait_until="networkidle"); pg2.wait_for_timeout(3500)
        pg2.screenshot(path=f"{OUT}/s5-mobile.png", full_page=True)
        # measure rendered CSS font sizes of a route label + a journal line
        sizes = pg2.evaluate("""() => {
          const stacked = document.body.classList.contains('stacked');
          const lbl = document.querySelector('.route-node .rn-lbl');
          const pen = document.querySelector('#logBook .penline.ink-write');
          const r1 = lbl ? lbl.getBoundingClientRect() : null;
          const r2 = pen ? pen.getBoundingClientRect() : null;
          const cs1 = lbl ? getComputedStyle(lbl).fontSize : null;
          const cs2 = pen ? getComputedStyle(pen).fontSize : null;
          return { stacked, lblFont: cs1, penFont: cs2,
                   lblBox: r1 && [Math.round(r1.x),Math.round(r1.y),Math.round(r1.width),Math.round(r1.height)],
                   penBox: r2 && [Math.round(r2.x),Math.round(r2.y),Math.round(r2.width),Math.round(r2.height)] };
        }""")
        logs.append("MOBILE-METRICS: " + str(sizes))
        ctx2.close()
        br.close()

    for name in ("s3-drill", "s4-drill2", "s1-load"):
        print(f"blue-ring hits {name}: {blue_ring_cols(f'{OUT}/{name}.png')}")
    print("\n--- logs ---")
    errs = [l for l in logs if l.startswith('[ERROR') or '[error]' in l.lower()]
    print(f"console errors: {len(errs)}")
    for l in logs:
        if l.startswith("ACTIVE") or l.startswith("MOBILE") or l.startswith("[ERROR"):
            print(" ", l)
    print("files:", os.listdir(OUT))

if __name__ == "__main__":
    run()
