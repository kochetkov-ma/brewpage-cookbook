#!/usr/bin/env python3
"""
Capture screenshots of 01-atlas.html and 02-metro.html mockups via file://.
Viewport 1440x900, RU default.
Output: .claude/reports/20260609-160000_rag-final2b/screenshots/
"""
import os, time, json
from playwright.sync_api import sync_playwright

BASE = "/Users/maximus/IdeaProjects/brewpage-cookbook"
MOKUPS = f"{BASE}/recipes/rag-guide/mokups"
OUT = f"{BASE}/.claude/reports/20260609-160000_rag-final2b/screenshots"
os.makedirs(OUT, exist_ok=True)

console_logs = {"atlas": [], "metro": []}

def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)

        # --- ATLAS ---
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, locale="ru-RU")
        page = ctx.new_page()
        page.on("console", lambda msg: console_logs["atlas"].append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs["atlas"].append(f"[ERROR] {err}"))

        atlas_url = f"file://{MOKUPS}/01-atlas.html"
        page.goto(atlas_url, wait_until="networkidle")
        page.wait_for_timeout(1200)

        # 1) Full-page default state
        page.screenshot(path=f"{OUT}/01-atlas-full.png", full_page=True)
        print("Saved 01-atlas-full.png")

        # 2) Click first pin (index 0) -- pins are rendered dynamically as <g class="pin ...">
        # They are inside <g id="pins">. The first one has data-i="0" or is the first child.
        # Use the grp.addEventListener("click"...) approach -- click first .pin element in SVG.
        pin_count = page.locator("g.pin").count()
        print(f"Atlas: found {pin_count} pins")
        if pin_count > 0:
            # Click pin index 1 (second pin, 'What RAG is') -- more likely to have visible panel
            target_pin = 1 if pin_count > 1 else 0
            page.locator("g.pin").nth(target_pin).click()
            page.wait_for_timeout(800)
        page.screenshot(path=f"{OUT}/01-atlas-open.png", full_page=True)
        print("Saved 01-atlas-open.png")

        ctx.close()

        # --- METRO ---
        ctx2 = browser.new_context(viewport={"width": 1440, "height": 900}, locale="ru-RU")
        page2 = ctx2.new_page()
        page2.on("console", lambda msg: console_logs["metro"].append(f"[{msg.type}] {msg.text}"))
        page2.on("pageerror", lambda err: console_logs["metro"].append(f"[ERROR] {err}"))

        metro_url = f"file://{MOKUPS}/02-metro.html"
        page2.goto(metro_url, wait_until="networkidle")
        page2.wait_for_timeout(1200)

        # 3) Full-page default state
        page2.screenshot(path=f"{OUT}/02-metro-full.png", full_page=True)
        print("Saved 02-metro-full.png")

        # 4) Click a station (data-i="1") to open its chapter card
        station_count = page2.locator("g.station").count()
        print(f"Metro: found {station_count} station elements (in both desktop + mobile SVGs)")
        # stationLayer has stations with data-i; click data-i="1" (first one that has content)
        # Use #stationLayer g.station to target only desktop layer
        desktop_stations = page2.locator("#stationLayer g.station")
        desktop_count = desktop_stations.count()
        print(f"Metro desktop stationLayer: {desktop_count} stations")
        if desktop_count > 0:
            desktop_stations.nth(1 if desktop_count > 1 else 0).click()
            page2.wait_for_timeout(900)
        page2.screenshot(path=f"{OUT}/02-metro-open.png", full_page=True)
        print("Saved 02-metro-open.png")

        # 5) Tight viewport screenshot of metro diagram area (SVG line with stations at top)
        # The diagram SVG is inside .diagram-wrap or a top-level section; scroll to top first
        page2.evaluate("window.scrollTo(0,0)")
        page2.wait_for_timeout(300)
        # Locate the SVG element (the metro line diagram)
        svg_el = page2.locator(".diagram-wrap, #diagramSvg, svg").first
        try:
            bbox = svg_el.bounding_box()
            if bbox:
                # Clip to viewport width, capped height to show just diagram area
                clip = {
                    "x": max(0, bbox["x"]),
                    "y": max(0, bbox["y"]),
                    "width": min(1440, bbox["width"]),
                    "height": min(300, bbox["height"])
                }
                page2.screenshot(path=f"{OUT}/02-metro-diagram.png", clip=clip)
                print(f"Saved 02-metro-diagram.png (clipped bbox: {clip})")
            else:
                # fallback: viewport crop from top
                page2.screenshot(path=f"{OUT}/02-metro-diagram.png",
                                 clip={"x": 0, "y": 60, "width": 1440, "height": 280})
                print("Saved 02-metro-diagram.png (fallback clip)")
        except Exception as e:
            print(f"diagram clip failed: {e}")
            page2.screenshot(path=f"{OUT}/02-metro-diagram.png",
                             clip={"x": 0, "y": 60, "width": 1440, "height": 280})
            print("Saved 02-metro-diagram.png (exception fallback)")

        ctx2.close()
        browser.close()

    # Report console errors
    print("\n--- Console output ---")
    for name, logs in console_logs.items():
        errors = [l for l in logs if "[error]" in l.lower() or "[ERROR]" in l]
        warnings = [l for l in logs if "[warning]" in l.lower() or "warn" in l.lower()]
        print(f"{name}: {len(errors)} errors, {len(warnings)} warnings")
        for e in errors:
            print(f"  {e}")

    # List output files
    print("\n--- Files written ---")
    for f in sorted(os.listdir(OUT)):
        size = os.path.getsize(f"{OUT}/{f}")
        print(f"  {OUT}/{f}  ({size} bytes)")

if __name__ == "__main__":
    run()
