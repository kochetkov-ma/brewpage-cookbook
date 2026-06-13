import sys
from PIL import Image, ImageChops

base = "/Users/maximus/IdeaProjects/brewpage-cookbook/.claude/reports/20260610-190801_concept-lab/screenshots/why-rag/02/"

s1 = Image.open(base + "s1-load.png").convert("RGB")
s2 = Image.open(base + "s2-anim.png").convert("RGB")
s3 = Image.open(base + "s3-drill.png").convert("RGB")
s5 = Image.open(base + "s5-mobile.png").convert("RGB")

print("s1 size:", s1.size)
print("s2 size:", s2.size)
print("s3 size:", s3.size)
print("s5 size:", s5.size)

diff = ImageChops.difference(s1, s2)
bbox = diff.getbbox()
hist = diff.convert("L").histogram()
changed = sum(hist[10:])
total = s1.size[0] * s1.size[1]
print("s1-vs-s2 diff bbox:", bbox)
print("s1-vs-s2 changed pixels (>thr 10):", changed, "of", total, f"({100.0*changed/total:.3f}%)")

def crop2x(img, box, name):
    c = img.crop(box)
    c = c.resize((c.width * 2, c.height * 2), Image.LANCZOS)
    c.save(base + name)
    print("saved", name, "from box", box)

w, h = s1.size
# header / intro region
crop2x(s1, (0, 0, w, int(h * 0.30)), "crop-s1-header.png")
# map upper quarter (Без RAG)
crop2x(s1, (0, int(h * 0.28), w, int(h * 0.68)), "crop-s1-map-upper.png")
# map lower area
crop2x(s1, (0, int(h * 0.62), w, h), "crop-s1-map-lower.png")
# s2 zone where diff happened
if bbox:
    x0, y0, x1, y1 = bbox
    pad = 60
    box = (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad))
    crop2x(s2, box, "crop-s2-diffzone.png")
# s3 drill interior
w3, h3 = s3.size
crop2x(s3, (0, int(h3 * 0.25), w3, int(h3 * 0.72)), "crop-s3-interior-top.png")
crop2x(s3, (0, int(h3 * 0.60), w3, h3), "crop-s3-interior-bottom.png")
# s5 mobile top and bottom halves
w5, h5 = s5.size
crop2x(s5, (0, 0, w5, int(h5 * 0.5)), "crop-s5-top.png")
crop2x(s5, (0, int(h5 * 0.45), w5, h5), "crop-s5-bottom.png")
