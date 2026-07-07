#!/usr/bin/env python3
"""
Brand-forward OG card generator — The Bitcoin Retirement Stress Test.
Per STYLE_GUIDE §6.15.1 (Pillow two-tier composite), cloned from
build-og-bull-and-bear-cycles.py: right half composited from the canonical
og-synthesis.jpg template; left half procedural grain with title + italic
subtitle. Subtitle drawn as two explicit lines (sentence-boundary break).
No em-dashes, no self-referential text (STYLE_GUIDE §10).

Run from repo root (where og-synthesis.jpg exists):
    python build-og-the-bitcoin-retirement-stress-test.py
Outputs: og-the-bitcoin-retirement-stress-test.jpg (1280x720, JPEG q80).
"""
import os, re, tempfile, random, requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1280, 720
BASE_DARK = (16, 13, 10); TEXT_MUTED = (130, 122, 110); AMBER = (224, 148, 34)
TEXT_BRIGHT = (242, 238, 232); TEXT_DIM = (190, 178, 160)
SEED = 4045; random.seed(SEED)
TEMPLATE = "og-synthesis.jpg"

TITLE_SIZE = 60           # three lines so the full name fits and every line clears the seam (x=620)
TITLE_LINES = ["The Bitcoin", "Retirement", "Stress Test"]
SUBTITLE_LINES = [
    "The calculator shows the upside path.",
    "This one drops a bear market into it.",
]
URL_FOOTER = "LASTCOINSTANDING.COM/THE-BITCOIN-RETIREMENT-STRESS-TEST"
TMP = tempfile.gettempdir()


def fetch_css_fonts(url, prefix):
    css = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}).text
    out = {}
    for b in re.findall(r'@font-face\s*\{([^}]+)\}', css):
        u = re.search(r'url\((https://[^)]+\.ttf)\)', b)
        if not u:
            continue
        sty = 'italic' if 'italic' in b else 'normal'
        wt = re.search(r'font-weight:\s*(\d+)', b); wt = int(wt.group(1)) if wt else 400
        p = os.path.join(TMP, f"{prefix}_{wt}_{sty}.ttf")
        open(p, 'wb').write(requests.get(u.group(1), headers={"User-Agent": "Mozilla/5.0"}).content)
        out[f"{wt}_{sty}"] = p
    return out


cor = fetch_css_fonts("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap", "cor")
inter = fetch_css_fonts("https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap", "inter")
def F(p, s): return ImageFont.truetype(p, s)
cor_semi = cor["600_normal"]; cor_ital = cor["400_italic"]; inter_med = inter["500_normal"]

# ---- left: procedural grain ----
img = Image.new("RGB", (W, H), BASE_DARK); px = img.load()
for y in range(H):
    for x in range(W):
        n = random.gauss(0, 3.5) + random.gauss(0, 5.0)
        r, g, b = img.getpixel((x, y))
        px[x, y] = (max(0, min(255, int(r + n))), max(0, min(255, int(g + n * 0.85))), max(0, min(255, int(b + n * 0.8))))
wear = Image.new("RGBA", (W, H), (0, 0, 0, 0)); wd = ImageDraw.Draw(wear)
for _ in range(8):
    cx, cy = random.randint(0, 820), random.randint(0, H); rw, rh = random.randint(120, 360), random.randint(80, 220)
    wd.ellipse([cx - rw, cy - rh, cx + rw, cy + rh], fill=(224, 148, 34, 12))
img = Image.alpha_composite(img.convert("RGBA"), wear.filter(ImageFilter.GaussianBlur(2.5))).convert("RGB").filter(ImageFilter.GaussianBlur(0.6))

# ---- right: composite from canonical template ----
if os.path.exists(TEMPLATE):
    tpl = Image.open(TEMPLATE).convert("RGB").resize((W, H))
    seam_mask = Image.new("L", (W, H), 0); sm = ImageDraw.Draw(seam_mask)
    for x in range(620, 820):
        sm.line([(x, 0), (x, H)], fill=int(255 * ((x - 620) / 200)))
    for x in range(820, W):
        sm.line([(x, 0), (x, H)], fill=255)
    img = Image.composite(tpl, img, seam_mask)
else:
    raise SystemExit("ERROR: og-synthesis.jpg not found — run from repo root.")

# ---- text (left half) ----
d = ImageDraw.Draw(img)
def ls_text(xy, text, font, fill, ls):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill); x += d.textlength(ch, font=font) + ls
ls_text((100, 110), "LAST COIN STANDING", F(inter_med, 18), TEXT_MUTED, 5.5)
d.line([(100, 146), (200, 146)], fill=AMBER, width=2)

tf = F(cor_semi, TITLE_SIZE)
y = 238
for ln in TITLE_LINES:
    d.text((100, y), ln, font=tf, fill=TEXT_BRIGHT); y += TITLE_SIZE + 14

sf = F(cor_ital, 30)
yy = 470
for ln in SUBTITLE_LINES:
    d.text((100, yy), ln, font=sf, fill=TEXT_DIM); yy += 40

foot_f = F(inter_med, 16)
ls_text((100, 668), URL_FOOTER, foot_f, TEXT_MUTED, 2.0)

# ---- overflow diagnostics ----
for ln in TITLE_LINES:
    w = d.textlength(ln, font=tf); print(f"title '{ln}': {w:.0f}px -> ends x={100 + w:.0f}" + ("  ** WIDE" if 100 + w > 600 else ""))
for ln in SUBTITLE_LINES:
    w = d.textlength(ln, font=sf); print(f"subtl '{ln}': {w:.0f}px -> ends x={100 + w:.0f}" + ("  ** WIDE" if 100 + w > 600 else ""))
fw = sum(d.textlength(c, font=foot_f) + 2.0 for c in URL_FOOTER)
print(f"footer: {fw:.0f}px -> ends x={100 + fw:.0f}" + ("  ** WIDE" if 100 + fw > 900 else ""))

img.save("og-the-bitcoin-retirement-stress-test.jpg", "JPEG", quality=80, optimize=True)
print("saved og-the-bitcoin-retirement-stress-test.jpg", os.path.getsize("og-the-bitcoin-retirement-stress-test.jpg") // 1024, "KB")
