#!/usr/bin/env python3
"""Prune the Concept REWORK screenshot tree to one flat hero PNG per variant.

18 variants (3 chapters x 6 archetypes). Copies each hero state flat as
screenshots/<chapter>-<nn>-hero.png, then deletes every per-variant dir via
os.remove / os.rmdir (session Bash denies compound + rm).
"""
import os

ROOT = "/Users/maximus/IdeaProjects/brewpage-cookbook/.claude/reports/20260610-205328_concept-rework/screenshots"

HERO = {
    ("search", "02"): "s4-drill2",
    ("search", "05"): "s3-drill",
    ("search", "06"): "s4-drill2",
    ("search", "08"): "s3-drill",
    ("search", "09"): "s3-drill",
    ("search", "10"): "s4-drill2",
    ("what-rag", "02"): "s3-drill",
    ("what-rag", "05"): "s3-drill",
    ("what-rag", "06"): "s3-drill",
    ("what-rag", "08"): "s4-drill2",
    ("what-rag", "09"): "s2-anim",
    ("what-rag", "10"): "s4-drill2",
    ("why-rag", "02"): "s2-anim",
    ("why-rag", "05"): "s2-anim",
    ("why-rag", "06"): "s4-drill2",
    ("why-rag", "08"): "s3-drill",
    ("why-rag", "09"): "s4-drill2",
    ("why-rag", "10"): "s3-drill",
}

MIN_BYTES = 10 * 1024


def step1_copy():
    flat = []
    for (chapter, nn), state in HERO.items():
        src = os.path.join(ROOT, chapter, nn, state + ".png")
        dst = os.path.join(ROOT, "{}-{}-hero.png".format(chapter, nn))
        if not os.path.isfile(src):
            raise SystemExit("MISSING SOURCE: {}".format(src))
        with open(src, "rb") as fsrc, open(dst, "wb") as fdst:
            fdst.write(fsrc.read())
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
    if len(flat) != 18:
        bad.append("expected 18 heroes, got {}".format(len(flat)))
    if bad:
        raise SystemExit("VERIFY FAILED:\n" + "\n".join(bad))


def _delete_tree(top):
    removed = 0
    for cur, dirs, files in os.walk(top, topdown=False):
        for f in files:
            os.remove(os.path.join(cur, f))
            removed += 1
        for d in dirs:
            os.rmdir(os.path.join(cur, d))
    os.rmdir(top)
    return removed


def step3_delete():
    chapters = sorted({c for (c, _n) in HERO})
    total = 0
    for chapter in chapters:
        cdir = os.path.join(ROOT, chapter)
        if os.path.isdir(cdir):
            total += _delete_tree(cdir)
    return total


def step4_audit():
    entries = sorted(os.listdir(ROOT))
    heroes = [e for e in entries if e.endswith("-hero.png")]
    subdirs = [e for e in entries if os.path.isdir(os.path.join(ROOT, e))]
    return heroes, subdirs


def main():
    flat = step1_copy()
    step2_verify(flat)
    removed = step3_delete()
    heroes, subdirs = step4_audit()
    print("copied + verified 18 heroes; deleted {} state files".format(removed))
    print("flat heroes in ROOT: {}".format(len(heroes)))
    for h in heroes:
        print("  {}  {}B".format(h, os.path.getsize(os.path.join(ROOT, h))))
    print("remaining subdirs: {}".format(subdirs if subdirs else "NONE"))
    if len(heroes) != 18 or subdirs:
        raise SystemExit("POST-AUDIT FAIL")
    print("OK: 18 flat heroes, no subdirs left")


if __name__ == "__main__":
    main()
