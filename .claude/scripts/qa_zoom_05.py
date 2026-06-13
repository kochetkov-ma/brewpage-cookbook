"""QA helper: diff s1 vs s2 and emit zoomed crops for vision review."""
import os
from PIL import Image, ImageChops

D = "/Users/maximus/IdeaProjects/brewpage-cookbook/.claude/reports/20260610-205328_concept-rework/screenshots/why-rag/05"
OUT = os.path.join(D, "qa-crops")
os.makedirs(OUT, exist_ok=True)

s1 = Image.open(os.path.join(D, "s1-load.png")).convert("RGB")
s2 = Image.open(os.path.join(D, "s2-anim.png")).convert("RGB")
print("s1 size:", s1.size, "s2 size:", s2.size)

diff = ImageChops.difference(s1, s2)
bbox = diff.getbbox()
hist = diff.convert("L").histogram()
changed = sum(hist[8:])
print("diff bbox:", bbox, "pixels with delta>=8:", changed)

def crop(name, img, box, scale=2):
    c = img.crop(box)
    c = c.resize((c.width * scale, c.height * scale), Image.LANCZOS)
    c.save(os.path.join(OUT, name))
    print("saved", name, c.size)

w, h = s1.size
# pipeline band in s1 and s2 (middle of page)
crop("s1-pipeline.png", s1, (0, int(h*0.42), w, int(h*0.78)), 2)
crop("s2-pipeline.png", s2, (0, int(h*0.42), w, int(h*0.78)), 2)
# header / chapter copy
crop("s1-header.png", s1, (0, 0, w, int(h*0.30)), 2)
# legend / bottom band
crop("s1-bottom.png", s1, (0, int(h*0.78), w, h), 2)
# top-right compass area
crop("s1-compass.png", s1, (int(w*0.78), 0, w, int(h*0.22)), 3)

s3 = Image.open(os.path.join(D, "s3-drill.png")).convert("RGB")
crop("s3-top.png", s3, (0, int(h*0.30), w, int(h*0.70)), 2)
crop("s3-bottom.png", s3, (0, int(h*0.70), w, h), 2)

s4 = Image.open(os.path.join(D, "s4-drill2.png")).convert("RGB")
crop("s4-mid.png", s4, (0, int(h*0.30), w, int(h*0.75)), 2)
crop("s4-top.png", s4, (0, 0, w, int(h*0.30)), 2)

s5 = Image.open(os.path.join(D, "s5-mobile.png")).convert("RGB")
w5, h5 = s5.size
print("s5 size:", s5.size)
crop("s5-top.png", s5, (0, 0, w5, int(h5*0.35)), 2)
crop("s5-mid.png", s5, (0, int(h5*0.35), w5, int(h5*0.72)), 2)
crop("s5-bottom.png", s5, (0, int(h5*0.72), w5, h5), 2)
