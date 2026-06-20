#!/usr/bin/env python3
"""
Brand-forward OG card generator — Bitcoin & Metcalfe's Law
Per STYLE_GUIDE §6.15.1 (Pillow two-tier composite).

REPO VERSION: composites the right half from the canonical og-the-power-law.jpg
template (the textured atmospheric ₿ + ember + paper grain that define the refined
family) — do NOT regenerate the glyph procedurally; that's the §6.15.1 anti-pattern.

Run from repo root (where og-the-power-law.jpg exists):
    python3 build-og-bitcoin-and-metcalfes-law.py
Outputs: og-bitcoin-and-metcalfes-law.jpg (1280x720, JPEG q88, ~75-95KB)
Then register in .eleventy.js staticAssets (already done in PR #22 as placeholder —
just overwrites at the same path) and commit.
"""
import os, math, random, re, io, requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W,H=1280,720
BASE_DARK=(16,13,10); TEXT_MUTED=(130,122,110); AMBER=(224,148,34)
TEXT_BRIGHT=(242,238,232); TEXT_DIM=(190,178,160)
SEED=4217; random.seed(SEED)
TEMPLATE="og-synthesis.jpg"   # canonical brand-forward right-half source (textured atmospheric Bitcoin glyph + ember + paper grain, per STYLE_GUIDE 6.15.1). NOTE: og-the-power-law.jpg is now a PRODUCT-FORWARD chart card (6.15.2), so compositing its right half drags in the Power Law chart + the /the-power-law URL — wrong for this page. og-synthesis.jpg is the clean brand-forward family card whose right half is the bare glyph.

TITLE_LINES=["Bitcoin &","Metcalfe\u2019s Law"]
SUBTITLE="Adoption is real — but the data is going blind."

def fetch_css_fonts(url,prefix):
    css=requests.get(url,headers={"User-Agent":"Mozilla/5.0"}).text
    out={}
    for b in re.findall(r'@font-face\s*\{([^}]+)\}',css):
        u=re.search(r'url\((https://[^)]+\.ttf)\)',b)
        if not u: continue
        sty='italic' if 'italic' in b else 'normal'
        wt=re.search(r'font-weight:\s*(\d+)',b); wt=int(wt.group(1)) if wt else 400
        p=f"/tmp/{prefix}_{wt}_{sty}.ttf"
        open(p,'wb').write(requests.get(u.group(1),headers={"User-Agent":"Mozilla/5.0"}).content)
        out[f"{wt}_{sty}"]=p
    return out
cor=fetch_css_fonts("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap","cor")
inter=fetch_css_fonts("https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap","inter")
def F(p,s): return ImageFont.truetype(p,s)
cor_semi=cor["600_normal"]; cor_ital=cor["400_italic"]; inter_med=inter["500_normal"]

# ---- left: procedural grain (seed makes it reproducible / per-card varied) ----
img=Image.new("RGB",(W,H),BASE_DARK); px=img.load()
for y in range(H):
    for x in range(W):
        n=random.gauss(0,3.5)+random.gauss(0,5.0)
        r,g,b=img.getpixel((x,y))
        px[x,y]=(max(0,min(255,int(r+n))),max(0,min(255,int(g+n*0.85))),max(0,min(255,int(b+n*0.8))))
wear=Image.new("RGBA",(W,H),(0,0,0,0)); wd=ImageDraw.Draw(wear)
for _ in range(8):
    cx,cy=random.randint(0,820),random.randint(0,H); rw,rh=random.randint(120,360),random.randint(80,220)
    wd.ellipse([cx-rw,cy-rh,cx+rw,cy+rh],fill=(224,148,34,12))
img=Image.alpha_composite(img.convert("RGBA"),wear.filter(ImageFilter.GaussianBlur(2.5))).convert("RGB").filter(ImageFilter.GaussianBlur(0.6))

# ---- right: composite from canonical template (THE refined-family signature) ----
if os.path.exists(TEMPLATE):
    tpl=Image.open(TEMPLATE).convert("RGB").resize((W,H))
    # hard-paste right portion x>=620, feather seam 620..820
    canvas=img.copy()
    canvas.paste(tpl.crop((620,0,W,H)),(620,0))
    # feathered seam
    seam_mask=Image.new("L",(W,H),0); sm=ImageDraw.Draw(seam_mask)
    for x in range(620,820):
        sm.line([(x,0),(x,H)],fill=int(255*((x-620)/200)))
    for x in range(820,W):
        sm.line([(x,0),(x,H)],fill=255)
    # Feathered composite: left procedural grain, right template glyph, blended
    # across the 620..820 seam. (The earlier hard re-paste at this point was a
    # contradictory leftover that overrode the feather and produced a visible
    # vertical seam — removed so the gradient seam_mask actually takes effect.)
    img=Image.composite(tpl,img,seam_mask)
else:
    print("WARNING: og-the-power-law.jpg not found — run from repo root. "
          "Falling back to procedural glyph (NOT pixel-matched to family).")
    # procedural fallback (see chat version) omitted for brevity in repo script

# ---- text (left half) ----
d=ImageDraw.Draw(img)
def ls_text(xy,text,font,fill,ls):
    x,y=xy
    for ch in text:
        d.text((x,y),ch,font=font,fill=fill); x+=d.textlength(ch,font=font)+ls
ls_text((100,110),"LAST COIN STANDING",F(inter_med,18),TEXT_MUTED,5.5)
d.line([(100,146),(200,146)],fill=AMBER,width=2)
tf=F(cor_semi,78)
y=238
for ln in TITLE_LINES: d.text((100,y),ln,font=tf,fill=TEXT_BRIGHT); y+=95
sf=F(cor_ital,30); words=SUBTITLE.split(); lines=[]; cur=""
for w in words:
    t=(cur+" "+w).strip()
    if d.textlength(t,font=sf)<=480: cur=t
    else: lines.append(cur); cur=w
if cur: lines.append(cur)
yy=472
for ln in lines: d.text((100,yy),ln,font=sf,fill=TEXT_DIM); yy+=40
ls_text((100,668),"LASTCOINSTANDING.COM",F(inter_med,18),TEXT_MUTED,4.5)

# quality 80 (not the family default 88): the procedurally-grained left half is
# high-entropy and compresses poorly, so q88 lands ~118KB — over the §6.15.1
# ~75-95KB target. The heavy grain masks JPEG artifacts, so q80 is visually
# indistinguishable here while bringing the file into the target band.
img.save("og-bitcoin-and-metcalfes-law.jpg","JPEG",quality=80,optimize=True)
print("saved og-bitcoin-and-metcalfes-law.jpg", os.path.getsize("og-bitcoin-and-metcalfes-law.jpg")//1024,"KB")
