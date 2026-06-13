#!/usr/bin/env python3
"""Prune the Concept Lab screenshot tree to one flat hero PNG per variant.

Keeps EXACTLY screenshots/<chapter>-<nn>-hero.png for 30 variants, deletes
all per-variant state dirs. If deletion is blocked, falls back to moving
state dirs into screenshots/_trash/.
"""
import os
import shutil

ROOT = "/Users/maximus/IdeaProjects/brewpage-cookbook/.claude/reports/20260610-190801_concept-lab/screenshots"

# chapter/nn -> hero state (without .png)
HERO = {
    ("search", "01"): "s3-drill",
    ("search", "02"): "s3-drill",
    ("search", "03"): "s3-drill",
    ("search", "04"): "s3-drill",
    ("search", "05"): "s2-anim",
    ("search", "06"): "s2-anim",
    ("search", "07"): "s2-anim",
    ("search", "08"): "s3-drill",
    ("search", "09"): "s3-drill",
    ("search", "10"): "s4-drill2",
    ("what-rag", "01"): "s4-drill2",
    ("what-rag", "02"): "s2-anim",
    ("what-rag", "03"): "s3-drill",
    ("what-rag", "04"): "s3-drill",
    ("what-rag", "05"): "s3-drill",
    ("what-rag", "06"): "s3-drill",
    ("what-rag", "07"): "s2-anim",
    ("what-rag", "08"): "s3-drill",
    ("what-rag", "09"): "s3-drill",
    ("what-rag", "10"): "s1-load",
    ("why-rag", "01"): "s3-drill",
    ("why-rag", "02"): "s2-anim",
    ("why-rag", "03"): "s2-anim",
    ("why-rag", "04"): "s2-anim",
    ("why-rag", "05"): "s3-drill",
    ("why-rag", "06"): "s3-drill",
    ("why-rag", "07"): "s4-drill2",
    ("why-rag", "08"): "s2-anim",
    ("why-rag", "09"): "s2-anim",
    ("why-rag", "10"): "s2-anim",
}

MIN_BYTES = 10 * 1024


def step1_copy():
    flat = []
    for (chapter, nn), state in HERO.items():
        src = os.path.join(ROOT, chapter, nn, state + ".png")
        dst = os.path.join(ROOT, "{}-{}-hero.png".format(chapter, nn))
        if not os.path.isfile(src):
            raise SystemExit("MISSING SOURCE: {}".format(src))
        shutil.copyfile(src, dst)
        flat.append(dst)
    return flat


def step2_verify(flat):
    bad = []
    for dst in flat:
        if not os.path.isfile(dst):
            bad.append("missing {}".format(dst))
            continue
        size = os.path.getsize(dst)
        if size <= MIN_BYTES:
            bad.append("too small ({}B) {}".format(size, dst))
    if len(flat) != 30:
        bad.append("expected 30 heroes, got {}".format(len(flat)))
    if bad:
        raise SystemExit("VERIFY FAILED:\n" + "\n".join(bad))


def _try_delete_tree(chapter_dir):
    """Recursively os.remove files then os.rmdir dirs bottom-up.
    Returns count of files removed. Raises on permission failure.
    """
    removed = 0
    for cur, dirs, files in os.walk(chapter_dir, topdown=False):
        for f in files:
            os.remove(os.path.join(cur, f))
            removed += 1
        for d in dirs:
            os.rmdir(os.path.join(cur, d))
        # cur itself removed by parent iteration except the top chapter_dir
    os.rmdir(chapter_dir)
    return removed


def step3_delete():
    chapters = sorted({c for (c, _n) in HERO})
    total_removed = 0
    try:
        for chapter in chapters:
            cdir = os.path.join(ROOT, chapter)
            if os.path.isdir(cdir):
                total_removed += _try_delete_tree(cdir)
        return ("delete", total_removed)
    except (PermissionError, OSError) as exc:
        # Fallback: move remaining chapter dirs into _trash
        trash = os.path.join(ROOT, "_trash")
        os.makedirs(trash, exist_ok=True)
        for chapter in chapters:
            cdir = os.path.join(ROOT, chapter)
            if os.path.isdir(cdir):
                shutil.move(cdir, os.path.join(trash, chapter))
        return ("trash", str(exc))


def main():
    flat = step1_copy()
    step2_verify(flat)
    mode, info = step3_delete()
    if mode == "delete":
        print("DONE: 30 heroes kept, {} state files deleted, per-variant dirs removed.".format(info))
    else:
        print("DONE (FALLBACK): 30 heroes kept; deletion blocked ({}); "
              "state dirs MOVED into screenshots/_trash/.".format(info))


if __name__ == "__main__":
    main()
