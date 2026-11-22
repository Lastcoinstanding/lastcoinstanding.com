#!/usr/bin/env python3
"""
Share card for The Bitcoin Dashboard (og-dashboard.jpg), built from the live page.

JM ruling 2026-11-22: the Dashboard's share card carries live numbers. A share
image cannot be live, so this script takes them from the live Dashboard at the
moment it runs and DATES the card ("Figures as of ..."), so a card seen weeks
later says when its numbers were read. Re-run it at each monthly refresh and
whenever the zone word changes (MONTHLY_REFRESH_CHECKLIST, Dashboard OG card).

What it does
  1. Opens the Dashboard in headless Chrome and waits for the live price.
     It refuses to build from a fallback price, so a stale sample is never
     baked in as "today".
  2. Reads the figures from the page's own elements, and the bar's geometry
     (marker, floor and trend ticks) from the page's own layout, so the card
     draws today's position exactly where the page does, below the floor
     included (channelBarRange, SITE_GUIDE §55.6).
  3. Lays the card out in HTML with the site's own fonts (./fonts), at 2x,
     and downsamples to 1280x720 JPEG.
  4. Bumps ?v=YYYYMMDD on og:image and twitter:image in dashboard-head.html,
     so platforms that cache share images by URL fetch the new card.

Run from the repo root:
    python3 build-og-dashboard.py                       # live site
    python3 build-og-dashboard.py --url https://<preview>/dashboard
Needs: pip install playwright pillow  (and a Chromium/Chrome Playwright can launch;
set CHROME=/path/to/chrome to use an installed one).
"""
import argparse, asyncio, datetime as dt, html, io, os, re, sys
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'og-dashboard.jpg'
HEAD = ROOT / 'src' / '_includes' / '_pageassets' / 'dashboard-head.html'
FONTS = (ROOT / 'fonts').as_uri()

READ = """() => {
  const t = id => ((document.getElementById(id) || {}).textContent || '').trim();
  const left = id => parseFloat(((document.getElementById(id) || {}).style || {}).left) || null;
  const up = document.getElementById('dashPosUpperTick');
  return {
    live: document.getElementById('dashPosTile').classList.contains('is-live'),
    priceLabel: t('dashPriceLabel'),
    mult: t('dashMult'), zone: t('dashZone'), trend: t('dashTrend'),
    belowPct: t('dashBelowPct'), belowCount: t('dashBelowCount'),
    doublePair: t('dashDoublePair'), doubleWhen: t('dashDoubleWhen'),
    wasYears: t('dashTrendWasYears'), wasSub: t('dashTrendWasSub'),
    marker: left('dashPosMarker'), floor: left('dashPosFloorTick'), trendTick: left('dashPosTrendTick'),
    upper: (up && up.style.display === 'block') ? left('dashPosUpperTick') : 100
  };
}"""


def card_html(v, asof):
    e = html.escape
    m = re.search(r'≈\s*([\d.]+)\s*years?', v['doubleWhen'])
    dbl_years = m.group(1) if m else ''
    m = re.search(r'around\s+([A-Z][a-z]+ \d{4})', v['doubleWhen'])
    dbl_when = m.group(1) if m else ''
    dbl_to = v['doublePair'].split('→')[-1].strip()
    m = re.match(r'(\d+ of \d+)', v['belowCount'])
    below_n = m.group(1) if m else ''
    m = re.search(r'sat in ([A-Z][a-z]+ \d{4})', v['wasSub'])
    was_when = m.group(1) if m else ''
    was_years = v['wasYears'].replace(' years', '').replace(' year', '')
    fF, fT, fU, fM = v['floor'], v['trendTick'], v['upper'], v['marker']
    OUTC = 'rgba(122,115,103,0.20)'
    track = (f'linear-gradient(90deg, {OUTC} 0%, {OUTC} {fF}%, rgba(192,57,43,0.42) {fF}%, '
             f'rgba(224,148,34,0.38) {fT}%, rgba(212,168,67,0.40) {fU}%' +
             (f', {OUTC} {fU}%, {OUTC} 100%' if fU < 99.9 else '') + ')')
    upper_lab = '' if fU < 99.9 else '<span class="lab end">upper band</span>'
    upper_tick = f'<span class="tick" style="left:{fU}%"></span><span class="lab" style="left:{fU}%">upper band</span>' if fU < 99.9 else ''
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:'Cormorant Garamond';font-style:normal;font-weight:300 700;src:url({FONTS}/cormorant-garamond-v21-normal-latin.woff2) format('woff2')}}
@font-face{{font-family:'Cormorant Garamond';font-style:italic;font-weight:400 600;src:url({FONTS}/cormorant-garamond-v21-italic-latin.woff2) format('woff2')}}
@font-face{{font-family:'Inter';font-style:normal;font-weight:300 700;src:url({FONTS}/inter-v20-normal-latin.woff2) format('woff2')}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1280px;height:720px;overflow:hidden}}
body{{position:relative;font-family:'Inter',sans-serif;color:#f2eee8;
  background:radial-gradient(ellipse 70% 60% at 85% 0%, rgba(120,62,16,0.30), transparent 70%),
             radial-gradient(ellipse 60% 55% at 0% 100%, rgba(110,55,14,0.22), transparent 70%),
             linear-gradient(180deg,#120f0c,#0b0a08)}}
.title{{position:absolute;left:64px;top:46px;font-family:'Cormorant Garamond',serif;font-weight:500;font-size:68px;letter-spacing:0.005em;line-height:1}}
.title em{{color:#e0941f;font-style:italic;font-weight:500}}
.brand{{position:absolute;right:64px;top:62px;font-size:13px;letter-spacing:0.32em;color:#9b9284;font-weight:500}}
.brand b{{display:inline-block;width:7px;height:7px;border-radius:50%;background:#e0941f;margin-right:12px;vertical-align:2px}}
.sub{{position:absolute;left:64px;top:144px;width:880px;font-size:22px;line-height:1.5;color:#c9c0b2}}
.hero{{position:absolute;left:64px;top:248px;width:1152px;height:162px;border:1px solid rgba(255,255,255,0.08);border-left:3px solid #e0941f;
  border-radius:10px;background:rgba(22,19,16,0.78)}}
.mult{{position:absolute;left:42px;top:40px;white-space:nowrap}}
.mult .n{{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:60px;line-height:1}}
.mult .u{{font-family:'Cormorant Garamond',serif;font-size:34px;color:#8f877a;margin-left:10px}}
.zone{{position:absolute;left:42px;top:108px;font-size:19px;font-weight:600;color:#e0941f}}
.bar{{position:absolute;left:400px;right:40px;top:62px;height:16px;border-radius:8px;background:{track};border:1px solid rgba(255,255,255,0.08)}}
.tick{{position:absolute;top:-5px;width:1.5px;height:26px;background:rgba(200,190,175,0.55);transform:translateX(-50%)}}
.lab{{position:absolute;top:34px;font-size:14px;color:#a39a8c;transform:translateX(-50%);white-space:nowrap}}
.lab.end{{right:0;transform:none}}
.lab.floor{{color:#c9c0b2}}
.dot{{position:absolute;top:50%;width:20px;height:20px;border-radius:50%;background:#e0941f;border:2px solid #f6c56b;transform:translate(-50%,-50%);
  box-shadow:0 0 0 7px rgba(224,148,34,0.18),0 0 22px 6px rgba(224,148,34,0.35)}}
.tiles{{position:absolute;left:64px;top:430px;width:1152px;display:flex;gap:21px}}
.tile{{flex:1;height:172px;border:1px solid rgba(255,255,255,0.07);border-radius:10px;background:rgba(16,14,12,0.82);padding:34px 24px 0 24px}}
.fig{{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:36px;line-height:1;white-space:nowrap}}
.fig i{{font-weight:400;font-size:26px;color:#8f877a;margin-left:6px}}
.txt{{margin-top:16px;font-size:15.5px;line-height:1.5;color:#9b9284}}
.foot{{position:absolute;left:64px;top:662px;font-size:17px;color:#c9c0b2}}
.foot b{{color:#e0941f;font-weight:600}}
.url{{position:absolute;right:64px;top:666px;font-size:13px;letter-spacing:0.28em;color:#8f877a}}
</style></head><body>
<div class="title">The Bitcoin <em>Dashboard</em></div>
<div class="brand"><b></b>LAST COIN STANDING</div>
<div class="sub">Where does bitcoin stand today? A live read of its place in the Power Law channel, and what that position has meant before.</div>
<div class="hero">
  <div class="mult"><span class="n">{e(v['mult'])}×</span><span class="u">of trend</span></div>
  <div class="zone">{e(v['zone'])}</div>
  <div class="bar">
    <span class="tick" style="left:{fF}%"></span><span class="lab floor" style="left:{fF}%">floor 0.42×</span>
    <span class="tick" style="left:{fT}%"></span><span class="lab" style="left:{fT}%">trend</span>
    {upper_tick}{upper_lab}
    <span class="dot" style="left:{fM}%"></span>
  </div>
</div>
<div class="tiles">
  <div class="tile"><div class="fig">{e(v['trend'])}</div><div class="txt">the trend price today, where the channel’s centerline sits</div></div>
  <div class="tile"><div class="fig">{e(v['belowPct'])}</div><div class="txt">of price samples on record closed below trend ({e(below_n)})</div></div>
  <div class="tile"><div class="fig">{e(dbl_years)}<i>years</i></div><div class="txt">for the trend to double, to {e(dbl_to)}, around {e(dbl_when)}</div></div>
  <div class="tile"><div class="fig">{e(was_years)}<i>years</i></div><div class="txt">behind trend: today’s price is where the trend line sat in {e(was_when)}</div></div>
</div>
<div class="foot"><b>Figures as of {e(asof)}</b> · live on the page, computed in your browser</div>
<div class="url">LASTCOINSTANDING.COM/DASHBOARD</div>
</body></html>"""


async def build(url):
    exe = os.environ.get('CHROME')
    async with async_playwright() as p:
        b = await p.chromium.launch(**({'executable_path': exe} if exe else {}), args=['--no-sandbox', '--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 900})
        await pg.goto(url, wait_until='networkidle', timeout=60000)
        v = None
        for _ in range(20):
            v = await pg.evaluate(READ)
            if v['live'] and v['marker'] is not None and v['mult'] not in ('', '—'):
                break
            await pg.wait_for_timeout(500)
        if not (v and v['live']):
            sys.exit('The Dashboard did not load a live price, so the card would bake in a fallback sample. Not built.')
        m = re.search(r'([A-Z][a-z]+ \d{1,2}, \d{4})', v['priceLabel'])
        d0 = dt.date.today()
        asof = m.group(1) if m else f'{d0:%B} {d0.day}, {d0.year}'
        card = await b.new_page(viewport={'width': 1280, 'height': 720}, device_scale_factor=2)
        tmp = ROOT / '.og-dashboard-card.html'
        tmp.write_text(card_html(v, asof), encoding='utf-8')
        try:
            await card.goto(tmp.as_uri(), wait_until='load')
            await card.evaluate('document.fonts.ready')
            await card.wait_for_timeout(300)
            png = await card.screenshot(type='png')
        finally:
            tmp.unlink(missing_ok=True)
        await b.close()
    img = Image.open(io.BytesIO(png)).convert('RGB').resize((1280, 720), Image.LANCZOS)
    img.save(OUT, 'JPEG', quality=86, optimize=True, progressive=True)
    return v, asof


def bump_version(stamp):
    s = HEAD.read_text(encoding='utf-8')
    s2, n = re.subn(r'og-dashboard\.jpg(\?v=\d+)?"', f'og-dashboard.jpg?v={stamp}"', s)
    if n != 2:
        sys.exit(f'Expected 2 og-dashboard.jpg references in {HEAD.name}, found {n}. Image built; head not changed.')
    HEAD.write_text(s2, encoding='utf-8')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default='https://lastcoinstanding.com/dashboard')
    ap.add_argument('--no-bump', action='store_true', help='leave the ?v= stamp in dashboard-head.html alone')
    a = ap.parse_args()
    v, asof = asyncio.run(build(a.url))
    if not a.no_bump:
        bump_version(dt.datetime.strptime(asof, '%B %d, %Y').strftime('%Y%m%d'))
    print(f'og-dashboard.jpg: {v["mult"]}x, {v["zone"]}, as of {asof} ({OUT.stat().st_size // 1024} KB)')
