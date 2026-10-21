#!/usr/bin/env python3
"""
Build the static chart images: crawlable copies of live charts.

A <canvas> chart is invisible to an image search; an <img> is not. Search
Console (90 days to 2026-10-18) showed "bitcoin vs real estate chart",
"real estate vs bitcoin chart", "btc vs real estate chart" and "btc vs house
price" reaching the site with no image to show for them. Each image here is a
screenshot of a live chart's whole container (title, subtitle, chart and
sources) with the site's address added, so it reads correctly on its own
wherever it travels. The page shows it under the live chart as an image to
save or share (SITE_GUIDE §14, "Static chart image").

Images (written to the output directory, default = cwd):
    bitcoin-vs-house-prices.png
        /bitcoin-vs-real-estate#priced-in-bitcoin, "BTC Required to Buy the Median
        US House". Annual series, so it changes once a year, when a year is
        added to the yearly bitcoin and house-price data.

When to run
-----------
After the annual data gains a year (MONTHLY_REFRESH_CHECKLIST §6), or after
any change to the chart. The file is registered in .eleventy.js; verify with
    curl -I https://lastcoinstanding.com/bitcoin-vs-house-prices.png
which must return Content-Type: image/png.

Usage
-----
    python3 scripts/build-chart-images.py                     # from production
    python3 scripts/build-chart-images.py --base http://localhost:8080
                                          # from a local build or a preview

Dependencies: pip install playwright pillow; playwright install chromium
"""

import argparse
import io
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

IMAGES = [
    {
        "name": "bitcoin-vs-house-prices",
        "path": "/bitcoin-vs-real-estate#priced-in-bitcoin",
        "chart": "#btcHouseChart",
        "container": ".chart-container",
        "brand": "lastcoinstanding.com/bitcoin-vs-real-estate",
        # The page's source line says "bitcoin trades below that trend today"
        # and "the page's appreciation setting": true on the page, undated in
        # an image that travels. The image carries this dated version instead
        # (STYLE_GUIDE §10.9), filled from the page's own values at capture.
        "source_js": "bvreHouseSource",
        "width": 1600,
        "output_filename": "bitcoin-vs-house-prices.png",
    },
]

# Hide the copy button and the page's own link to this image (.chart-static);
# date the source line; add the site's address at the foot of the container, in
# the page's own type and amber.
PREP_JS = """
([chartSel, containerSel, brand, sourceFn]) => {
  const st = document.createElement('style');
  st.textContent = '.chart-copy-btn,.chart-static{display:none!important}';
  document.head.appendChild(st);
  const box = document.querySelector(chartSel).closest(containerSel);
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date(), when = MONTHS[now.getMonth()] + ' ' + now.getFullYear();
  const SOURCES = {
    // Bitcoin vs. Real Estate, "BTC Required to Buy the Median US House".
    bvreHouseSource: () => {
      const yrs = Object.keys(btcData).map(Number), last = Math.max.apply(null, yrs);
      const appr = window.ModelingAssumptions.get('homeApprNominal').value;
      const m = TODAY_PRICE / plPrice((Date.now() / 1000 - GENESIS_TS) / 86400);
      return 'Sources: FRED (MSPUS) for the house; bitcoin is each year\u2019s average price from the site\u2019s own series, through ' + last + '. ' +
        'The fitted trend is a least-squares line through 2013\u2013' + last + '. The Power Law path grows the house at ' + appr +
        '% a year and prices bitcoin at its Power Law trend; bitcoin traded ' + (m < 1 ? 'below' : 'above') + ' that trend in ' + when +
        ', when this image was made. Neither line is a price prediction.';
    }
  };
  const src = box.querySelector('.chart-source');
  if (sourceFn && src) src.textContent = SOURCES[sourceFn]();
  const tag = document.createElement('div');
  tag.textContent = brand;
  tag.style.cssText = 'margin-top:0.9rem;text-align:right;font:600 13px Inter,-apple-system,sans-serif;letter-spacing:0.04em;color:#e09422';
  box.appendChild(tag);
  box.setAttribute('data-static-capture', '1');
}
"""


def build(page, cfg, base, out_dir):
    url = base.rstrip("/") + cfg["path"]
    print(f"[{cfg['name']}] visit {url}")
    page.goto(url, wait_until="networkidle")
    page.wait_for_selector(cfg["chart"], state="visible", timeout=15_000)
    page.wait_for_timeout(2500)  # Chart.js entry animation
    page.evaluate(PREP_JS, [cfg["chart"], cfg["container"], cfg["brand"], cfg.get("source_js")])
    box = page.locator('[data-static-capture="1"]')
    box.scroll_into_view_if_needed()
    page.wait_for_timeout(600)
    png = box.screenshot(type="png")
    img = Image.open(io.BytesIO(png)).convert("RGB")
    if img.width != cfg["width"]:
        h = round(img.height * cfg["width"] / img.width)
        img = img.resize((cfg["width"], h), Image.LANCZOS)
    out = out_dir / cfg["output_filename"]
    # 256 colours, no dither: the charts are flat fills and lines on a dark
    # card, so this is visually identical and about a fifteenth of the size
    # (1.1 MB → 70 KB on the first image).
    img = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    img.save(out, "PNG", optimize=True)
    print(f"  wrote {out} ({img.width}×{img.height}, {out.stat().st_size:,} bytes)")


def main() -> int:
    ap = argparse.ArgumentParser(description="Build the static chart images.")
    ap.add_argument("--base", default="https://lastcoinstanding.com",
                    help="Origin to capture from (a local build or a Pages preview)")
    ap.add_argument("--output-dir", default=".", help="Directory to write into")
    args = ap.parse_args()
    out_dir = Path(args.output_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1100, "height": 900}, device_scale_factor=2)
        page = ctx.new_page()
        for cfg in IMAGES:
            build(page, cfg, args.base, out_dir)
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
