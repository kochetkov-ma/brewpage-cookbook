import sys
from PIL import Image, ImageChops

base = "/Users/maximus/IdeaProjects/brewpage-cookbook/.claude/reports/20260610-205328_concept-rework/screenshots/search/09"
out = base + "/crops"
import os
os.makedirs(out, exist_ok=True)

s1 = Image.open(base + "/s1-load.png").convert("RGB")
s2 = Image.open(base + "/s2-anim.png").convert("RGB")
s3 = Image.open(base + "/s3-drill.png").convert("RGB")
s5 = Image.open(base + "/s5-mobile.png").convert("RGB")

print("s1 size:", s1.size)
print("s3 size:", s3.size)
print("s5 size:", s5.size)

# diff s1 vs s2
diff = ImageChops.difference(s1, s2)
bbox = diff.getbbox()
print("s1-s2 diff bbox:", bbox)
hist = diff.convert("L").histogram()
changed = sum(hist[10:])
print("s1-s2 changed pixels (>10):", changed)

def crop(img, box, name, scale=2):
    c = img.crop(box)
    c = c.resize((c.width * scale, c.height * scale), Image.LANCZOS)
    c.save(out + "/" + name)
    print("saved", name, c.size)

w, h = s1.size
# s1: top header band, left column, right map area, bottom bar
crop(s1, (0, 0, w, int(h*0.30)), "s1-top.png", 2)
crop(s1, (0, int(h*0.28), int(w*0.55), int(h*0.78)), "s1-left.png", 2)
crop(s1, (int(w*0.50), int(h*0.28), w, h), "s1-right.png", 2)
crop(s1, (0, int(h*0.70), w, h), "s1-bottom.png", 2)

crop(s2, (int(w*0.50), int(h*0.28), w, h), "s2-right.png", 2)
crop(s2, (0, 0, w, int(h*0.30)), "s2-top.png", 2)

w3, h3 = s3.size
crop(s3, (0, int(h3*0.25), w3, int(h3*0.65)), "s3-mid.png", 2)
crop(s3, (int(w3*0.25), int(h3*0.45), w3, h3), "s3-zoom.png", 2)
crop(s3, (0, int(h3*0.25), int(w3*0.30), h3), "s3-leftrail.png", 2)

w5, h5 = s5.size
crop(s5, (0, 0, w5, int(h5*0.34)), "s5-top.png", 2)
crop(s5, (0, int(h5*0.30), w5, int(h5*0.66)), "s5-mid.png", 2)
crop(s5, (0, int(h5*0.62), w5, h5), "s5-bottom.png", 2)
