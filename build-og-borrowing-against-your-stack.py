#!/usr/bin/env python3
"""
Brand-forward OG card generator — Borrowing Against Your Stack (v2).
Per STYLE_GUIDE §6.15.1 (Pillow two-tier composite). Right half composited
from the canonical og-synthesis.jpg template (textured atmospheric ₿ + ember +
paper grain); left half procedural grain with the title + italic subtitle.

Cloned from build-og-bull-and-bear-cycles.py. Differences from that donor:
  - Title carries the EXISTING card's treatment (SITE_GUIDE §1363): the word
    "Borrowing" in italic amber, then "Against Your Stack" in bright semibold.
    This is a faithful reconstruction of that accent — the original card had no
    build script in the repo (it predates the per-page generators), so the
    treatment is rebuilt here, not byte-copied.
  - v2 repositioning subtitle (approved 2026-08-06), two explicit lines, no
    em-dash per STYLE_GUIDE §10:
        "Bitcoin as collateral instead of selling it,"
        "with HODL as the legitimate baseline."
  - Output filename is -v2. A new path forces X to re-scrape; the old cached
    card (og-borrowing-against-your-stack.jpg) keeps serving until it does.
  - Title + subtitle fonts AUTO-SHRINK to fit the left column before the seam,
    because "Against Your Stack" is longer than the donor's title lines. If the
    overflow guard still prints "** WIDE", lower MAX_TEXT_W a touch and rerun.

Run from repo root (where og-synthesis.jpg exists):
    python build-og-borrowing-against-your-stack.py
Outputs: og-borrowing-against-your-stack-v2.jpg (1280x720, JPEG q80, ~75-95KB).
Needs: pip install pillow requests   (fetches Cormorant/Inter TTFs at run time;
       requires network access).
"""
import os, re, tempfile, random, requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1280, 720
BASE_DARK = (16, 13, 10); TEXT_MUTED = (130, 122, 110); AMBER = (224, 148, 34)
TEXT_BRIGHT = (242, 238, 232); TEXT_DIM = (190, 178, 160)
SEED = 8420; random.seed(SEED)
TEMPLATE = "og-synthesis.jpg"

# Title: first line is the italic-amber accent word, remaining lines are bright.
TITLE_ACCENT = "Borrowing"
TITLE_REST_LINES = ["Against Your Stack"]
SUBTITLE_LINES = [
    "Bitcoin as collateral instead of selling it,",
    "with HODL as the legitimate baseline.",
]
URL_FOOTER = "LASTCOINSTANDING.COM/BORROWING-AGAINST-YOUR-STACK"
# Left text column: starts at x=100, the seam gradient begins at x=620. Keep a
# margin so no glyph crowds the composite. Fonts auto-shrink to honour this.
MAX_TEXT_W = 500
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

# Title: "Borrowing" italic-amber, then the rest bright semibold (§1363 accent).
# One shared size for all title lines; shrink until the widest fits MAX_TEXT_W.
TITLE_FS = 78
while TITLE_FS > 40:
    _ital = F(cor_ital, TITLE_FS); _semi = F(cor_semi, TITLE_FS)
    widest = max(
        d.textlength(TITLE_ACCENT, font=_ital),
        *[d.textlength(ln, font=_semi) for ln in TITLE_REST_LINES],
    )
    if widest <= MAX_TEXT_W:
        break
    TITLE_FS -= 2
tf_ital = F(cor_ital, TITLE_FS); tf_semi = F(cor_semi, TITLE_FS)
step = int(TITLE_FS * 1.22)
y = 238
d.text((100, y), TITLE_ACCENT, font=tf_ital, fill=AMBER); y += step
for ln in TITLE_REST_LINES:
    d.text((100, y), ln, font=tf_semi, fill=TEXT_BRIGHT); y += step

# Subtitle: two explicit lines, break at the sentence boundary (no word-wrap,
# no em-dash). Shrink until the widest fits MAX_TEXT_W.
SUB_FS = 30
while SUB_FS > 20:
    _sf = F(cor_ital, SUB_FS)
    if max(d.textlength(ln, font=_sf) for ln in SUBTITLE_LINES) <= MAX_TEXT_W:
        break
    SUB_FS -= 1
sf = F(cor_ital, SUB_FS)
sub_step = int(SUB_FS * 1.33)
yy = 470
for ln in SUBTITLE_LINES:
    d.text((100, yy), ln, font=sf, fill=TEXT_DIM); yy += sub_step

ls_text((100, 668), URL_FOOTER, F(inter_med, 18), TEXT_MUTED, 2.6)

# ---- overflow guard: warn if any line crowds the seam (x=620) ----
for ln in [TITLE_ACCENT] + TITLE_REST_LINES:
    fnt = tf_ital if ln == TITLE_ACCENT else tf_semi
    w = d.textlength(ln, font=fnt); print(f"title  '{ln}': {w:.0f}px @{TITLE_FS} -> ends x={100 + w:.0f}" + ("  ** WIDE" if 100 + w > 600 else ""))
for ln in SUBTITLE_LINES:
    w = d.textlength(ln, font=sf); print(f"subtl  '{ln}': {w:.0f}px @{SUB_FS} -> ends x={100 + w:.0f}" + ("  ** WIDE" if 100 + w > 600 else ""))

img.save("og-borrowing-against-your-stack-v2.jpg", "JPEG", quality=80, optimize=True)
print("saved og-borrowing-against-your-stack-v2.jpg", os.path.getsize("og-borrowing-against-your-stack-v2.jpg") // 1024, "KB")
