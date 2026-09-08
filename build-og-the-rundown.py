"""og-the-rundown.jpg generator — brand-forward card per OG_SPEC_THE_RUNDOWN §2–§3.

Left half: procedural (§2.3). Right half: hard paste of og-synthesis.jpg x>=620 with a
200px feathered seam (§2.2). Type per §2.4; copy per §3. Output 1280x720 RGB JPEG q82.
"""
import random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1280, 720
BASE = (0x10, 0x0D, 0x0A)
FONT_DIR = "/root/.fonts/"
TEMPLATE = sys.argv[1] if len(sys.argv) > 1 else None
# Default bumped to -v2 2026-09-07: that is the file the page actually wires, and a
# re-run that quietly wrote the v1 name would leave the live card untouched.
# Override with argv[2] if you ever need the v1 name back.
OUT = sys.argv[2] if len(sys.argv) > 2 else "og-the-rundown-v2.jpg"
SEED = 20260907  # fresh per card (§2.3)
random.seed(SEED)


def font(file, size, variation=None):
    f = ImageFont.truetype(FONT_DIR + file, size)
    if variation:
        try:
            f.set_variation_by_name(variation)
        except Exception:
            try:  # fall back to axis value
                f.set_variation_by_axes([{"Medium": 500, "SemiBold": 600}.get(variation, 400)])
            except Exception:
                pass
    return f


# ---- §2.3 procedural left half --------------------------------------------------------
import numpy as np

def procedural_base():
    """§2.3: flat base + multi-scale Gaussian noise (R > G > B amplitude) + faint amber wear + 0.6 blur."""
    rng = np.random.default_rng(SEED)
    arr = np.zeros((H, W, 3), dtype=np.float32) + np.array(BASE, dtype=np.float32)
    for scale, amp in ((48, (3.2, 2.2, 1.8)), (12, (2.4, 1.6, 1.3)), (3, (1.8, 1.2, 1.0))):
        h, w = H // scale + 2, W // scale + 2
        n = rng.normal(0.0, 1.0, size=(h, w, 3)).astype(np.float32) * np.array(amp, dtype=np.float32)
        n_img = Image.fromarray(np.clip(n * 20 + 128, 0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)
        arr += (np.asarray(n_img, dtype=np.float32) - 128.0) / 20.0
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB")
    wear = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(wear)
    for _ in range(random.randint(5, 10)):
        cx, cy = random.randint(0, 700), random.randint(0, H)
        rx, ry = random.randint(80, 260), random.randint(40, 160)
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(0xE0, 0x94, 0x22, 12))
    wear = wear.filter(ImageFilter.GaussianBlur(48))  # spec says 2.5; raised to match the reference card, where wear reads as warmth not ovals
    img = Image.alpha_composite(img.convert("RGBA"), wear).convert("RGB")
    return img.filter(ImageFilter.GaussianBlur(0.6))

# ---- §2.2 composite ------------------------------------------------------------------
card = procedural_base()
if TEMPLATE:
    tpl = Image.open(TEMPLATE).convert("RGB")
    assert tpl.size == (W, H), f"template is {tpl.size}, expected 1280x720"
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    md.rectangle([820, 0, W, H], fill=255)
    for x in range(620, 820):  # 200px ramp 0 -> 1
        md.line([(x, 0), (x, H)], fill=int(255 * (x - 620) / 200))
    card = Image.composite(tpl, card, mask)

# ---- §2.4 / §3 type ------------------------------------------------------------------
d = ImageDraw.Draw(card)
f_hdr = font("Inter[opsz,wght].ttf", 18, "Medium")
f_ttl = font("CormorantGaramond[wght].ttf", 78, "SemiBold")
f_sub = font("CormorantGaramond-Italic[wght].ttf", 30, None)


def tracked(xy, text, fnt, fill, spacing):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill)
        x += d.textlength(ch, font=fnt) + spacing


tracked((100, 110), "LAST COIN STANDING", f_hdr, "#827A6E", 5.5)
d.line([(100, 144), (200, 144)], fill="#E09422", width=2)
d.text((100, 245 - 60), "The Rundown", font=f_ttl, fill="#F2EEE8")  # baseline ~245

# italic subtitle, wrap at 480px
sub = "What this position has meant for your situation"
words, lines, cur = sub.split(), [], ""
for w in words:
    t = (cur + " " + w).strip()
    if d.textlength(t, font=f_sub) <= 480:
        cur = t
    else:
        lines.append(cur); cur = w
lines.append(cur)
y = 340 - 22
for ln in lines:
    d.text((100, y), ln, font=f_sub, fill="#BEB2A0"); y += 40
assert y < 668 - 20, "subtitle collides with URL footer"

tracked((100, 668 - 14), "LASTCOINSTANDING.COM/THE-RUNDOWN", f_hdr, "#827A6E", 4.5)

card.convert("RGB").save(OUT, "JPEG", quality=82, optimize=True, progressive=True)
print(OUT, card.size)
