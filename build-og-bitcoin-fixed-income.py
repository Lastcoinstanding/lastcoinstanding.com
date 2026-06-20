#!/usr/bin/env python3
"""
Brand-forward OG card generator — Bitcoin and Fixed Income
Per STYLE_GUIDE §6.15.1 (Pillow two-tier composite).

Regenerates og-bitcoin-fixed-income.jpg with the renamed title text
("Bitcoin Fixed Income" → "Bitcoin and Fixed Income", June 2026). Only the
title changes; the existing italic subtitle and slug footer are preserved.

Right half is composited from the canonical og-synthesis.jpg template (the
textured atmospheric Bitcoin glyph + ember + paper grain) — NOT regenerated
procedurally (that's the §6.15.1 anti-pattern), and NOT from og-the-power-law.jpg
(now a product-forward chart card per §6.15.2).

Run from repo root (where og-synthesis.jpg exists):
    python build-og-bitcoin-fixed-income.py
Outputs: og-bitcoin-fixed-income.jpg (1280x720, JPEG q80, ~75-95KB) — same
filename, so the .eleventy.js staticAssets registration is unchanged.
"""
import os, re, tempfile, requests
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W,H=1280,720
BASE_DARK=(16,13,10); TEXT_MUTED=(130,122,110); AMBER=(224,148,34)
TEXT_BRIGHT=(242,238,232); TEXT_DIM=(190,178,160)
import random
SEED=8231; random.seed(SEED)
TEMPLATE="og-synthesis.jpg"   # canonical brand-forward right-half source (bare textured ₿ glyph), per STYLE_GUIDE §6.15.1.

TITLE_LINES=["Bitcoin and","Fixed Income"]          # renamed title, two lines to clear the right-half glyph
SUBTITLE="Bitcoin-backed preferreds as bear-case insurance."   # preserved from the existing card
URL_FOOTER="LASTCOINSTANDING.COM/BITCOIN-FIXED-INCOME"          # preserved (slug unchanged)

TMP=tempfile.gettempdir()   # portable temp dir (template hardcoded /tmp, absent on Windows)

def fetch_css_fonts(url,prefix):
    css=requests.get(url,headers={"User-Agent":"Mozilla/5.0"}).text
    out={}
    for b in re.findall(r'@font-face\s*\{([^}]+)\}',css):
        u=re.search(r'url\((https://[^)]+\.ttf)\)',b)
        if not u: continue
        sty='italic' if 'italic' in b else 'normal'
        wt=re.search(r'font-weight:\s*(\d+)',b); wt=int(wt.group(1)) if wt else 400
        p=os.path.join(TMP,f"{prefix}_{wt}_{sty}.ttf")
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
    seam_mask=Image.new("L",(W,H),0); sm=ImageDraw.Draw(seam_mask)
    for x in range(620,820):
        sm.line([(x,0),(x,H)],fill=int(255*((x-620)/200)))
    for x in range(820,W):
        sm.line([(x,0),(x,H)],fill=255)
    img=Image.composite(tpl,img,seam_mask)
else:
    raise SystemExit("ERROR: og-synthesis.jpg not found — run from repo root.")

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
# footer carries the slug; trimmed letterspacing keeps the longer string in the left half
ls_text((100,668),URL_FOOTER,F(inter_med,18),TEXT_MUTED,2.6)

# quality 80 (not 88): the procedurally-grained left half compresses poorly; q80 lands
# in the §6.15.1 ~75-95KB band and the heavy grain masks JPEG artifacts.
img.save("og-bitcoin-fixed-income.jpg","JPEG",quality=80,optimize=True)
print("saved og-bitcoin-fixed-income.jpg", os.path.getsize("og-bitcoin-fixed-income.jpg")//1024,"KB")
