import os
from PIL import Image

base = "/Users/maximus/IdeaProjects/brewpage-cookbook/.claude/reports/20260610-205328_concept-rework/screenshots/search/09"
out = base + "/crops"
os.makedirs(out, exist_ok=True)

s1 = Image.open(base + "/s1-load.png").convert("RGB")
s3 = Image.open(base + "/s3-drill.png").convert("RGB")
s5 = Image.open(base + "/s5-mobile.png").convert("RGB")

# blue vertical line in s3: in s3-zoom crop it was at x ~ (0.25*1280 + 150/1.5?) -- find saturated blue pixels
w, h = s3.size
found = {}
px = s3.load()
for x in range(0, w, 2):
    cnt = 0
    for y in range(0, h, 4):
        r, g, b = px[x, y]
        if b > 120 and b - r > 50 and b - g > 40:
            cnt += 1
    if cnt > 10:
        found[x] = cnt
print("s3 blue columns:", found)

# sample some pixels from one blue column
if found:
    xb = sorted(found)[0]
    samples = [px[xb, y] for y in (200, 400, 600, 800)]
    print("blue col", xb, "samples:", samples)

def crop(img, box, name, scale=3):
    c = img.crop(box)
    c = c.resize((c.width * scale, c.height * scale), Image.LANCZOS)
    c.save(out + "/" + name)
    print("saved", name, c.size)

# s1 bottom-center pill area
crop(s1, (380, 780, 900, 900), "s1-pill.png", 2)
# s3 pill area
crop(s3, (380, 780, 900, 900), "s3-pill.png", 2)
# s3 blue line context
crop(s3, (340, 100, 560, 500), "s3-blueline.png", 3)
# s1 top-right compass corner
crop(s1, (1100, 0, 1280, 120), "s1-compass.png", 3)
# s5 check horizontal overflow: scan rightmost 3 columns for non-bg pixels
w5, h5 = s5.size
px5 = s5.load()
edge = [px5[w5-1, y] for y in range(0, h5, 60)]
print("s5 right edge samples:", edge)

# s5 pill region big
crop(s5, (0, 700, 390, 844), "s5-pill.png", 2)
