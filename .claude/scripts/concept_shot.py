#!/usr/bin/env python3
"""Capture animated HTML concept mockups to PNGs via headless chromium.

Usage: python3 concept_shot.py <html-file> <out-dir>
"""
import os
import sys
import time

from playwright.sync_api import sync_playwright


def log_console(states_errors, msg):
    if msg.type == "error":
        print("CONSOLE-ERROR: " + msg.text)


def main():
    if len(sys.argv) != 3:
        print("Usage: python3 concept_shot.py <html-file> <out-dir>")
        return 2

    html_path = os.path.abspath(sys.argv[1])
    out_dir = os.path.abspath(sys.argv[2])
    os.makedirs(out_dir, exist_ok=True)
    file_url = "file://" + html_path

    page_errors = []
    written = []

    def shot(page, name):
        target = os.path.join(out_dir, name)
        page.screenshot(path=target, full_page=False)
        written.append(name)

    def try_click(page, handle, label):
        try:
            handle.scroll_into_view_if_needed(timeout=5000)
            handle.click(force=False, timeout=5000)
            return True
        except Exception as exc:
            print("CLICK-FAIL: " + label + ": " + str(exc).splitlines()[0])
            return False

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1280, "height": 900},
            device_scale_factor=1,
        )
        page = context.new_page()
        page.on("console", lambda m: log_console(None, m))
        page.on("pageerror", lambda e: page_errors.append(str(e)))

        load_start = time.monotonic()
        page.goto(file_url, wait_until="load")

        page.wait_for_timeout(300)
        shot(page, "s1-load.png")

        elapsed_ms = (time.monotonic() - load_start) * 1000
        remaining = 2000 - elapsed_ms
        if remaining > 0:
            page.wait_for_timeout(int(remaining))
        shot(page, "s2-anim.png")

        first_drill = None
        drills = page.query_selector_all("[data-drill]")
        for d in drills:
            if d.is_visible():
                first_drill = d
                break

        if first_drill is None:
            print("NO-DRILL")
        else:
            if try_click(page, first_drill, "s3-drill"):
                page.wait_for_timeout(1200)
                shot(page, "s3-drill.png")

            second_drill = None
            drills2 = page.query_selector_all("[data-drill]")
            for d in drills2:
                try:
                    same = d.evaluate("(el, other) => el === other", first_drill)
                except Exception:
                    same = False
                if same:
                    continue
                if d.is_visible():
                    second_drill = d
                    break

            if second_drill is None:
                print("NO-DRILL2")
            else:
                if try_click(page, second_drill, "s4-drill2"):
                    page.wait_for_timeout(1200)
                    shot(page, "s4-drill2.png")

        mob_ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=1,
        )
        mob = mob_ctx.new_page()
        mob.on("console", lambda m: log_console(None, m))
        mob.on("pageerror", lambda e: page_errors.append(str(e)))
        mob.goto(file_url, wait_until="load")
        mob.wait_for_timeout(2000)
        mob.screenshot(path=os.path.join(out_dir, "s5-mobile.png"), full_page=False)
        written.append("s5-mobile.png")

        browser.close()

    for err in page_errors:
        print("PAGE-ERROR: " + err.splitlines()[0])

    print("STATES: " + ", ".join(written))
    return 1 if page_errors else 0


if __name__ == "__main__":
    sys.exit(main())
