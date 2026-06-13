from PIL import Image

base = "/Users/maximus/IdeaProjects/brewpage-cookbook/.claude/reports/20260610-205328_concept-rework/screenshots/search/09"

for name in ("s1-load", "s2-anim", "s5-mobile"):
    img = Image.open(base + "/" + name + ".png").convert("RGB")
    w, h = img.size
    px = img.load()
    cols = {}
    for x in range(0, w, 2):
        cnt = 0
        for y in range(0, h, 4):
            r, g, b = px[x, y]
            if b > 120 and b - r > 50 and b - g > 40:
                cnt += 1
        if cnt > 8:
            cols[x] = cnt
    print(name, "blue cols:", cols)

html = open("/Users/maximus/IdeaProjects/brewpage-cookbook/recipes/rag-guide/mokups/concepts/search/09-logbook.html", encoding="utf-8").read()
import re
for m in re.finditer(r"padding-bottom\s*:\s*[^;]+|scroll-margin[^;]*|outline\s*:\s*[^;]+|focus[^{]*\{[^}]*\}", html):
    print("HTML:", m.group(0)[:120])
