#!/usr/bin/env python3
"""
plot-rolling-oos.py: the rolling out-of-sample exhibit, drawn from live PL_DATA.

WHY THIS EXISTS. scripts/measure-rolling-oos.js produces the numbers behind
ROLLING_OOS_FITS_2026-09-23.md; this draws them. First used for the Substack
essay "Is Bitcoin a Singularity?" (2026-09-24). If the backlog's *Rolling
out-of-sample fits* entry is ever promoted to a section on /the-power-law, this
is the exhibit already designed - the build is a web version of this chart, not
new analysis.

It shells out to the measurement script, so the chart can never disagree with
the report: one source of truth, re-read from PL_DATA at every run. Re-run it
after each monthly data refresh if the image is being reused anywhere.

HOW TO RUN (from the repo root):
    python3 scripts/plot-rolling-oos.py
    python3 scripts/plot-rolling-oos.py --out somewhere/else.png

SIZED FOR A COLUMN, NOT A SCREEN. It renders 1456x1650 but every label is
sized to survive the downscale to ~700px, which is what Substack and a phone
actually display. The first version of this chart was wide and full of fine
print, and was unreadable in the post. If it is ever re-laid-out, check the
output at its display width, not at full size.

House palette and fonts per STYLE_GUIDE (amber on near-black, Cormorant
display + Inter labels). Fonts are fetched from Google Fonts at run time, the
same way the OG-card generators do it, so nothing has to be installed.

Needs: pip install matplotlib requests
"""
import argparse, json, os, re, subprocess, sys, tempfile
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from matplotlib.ticker import FixedLocator, FuncFormatter, NullLocator

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = tempfile.gettempdir()


def fetch_css_fonts(url, prefix):
    """Download the TTFs behind a Google Fonts CSS2 URL; return {weight_style: path}."""
    import requests
    css = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}).text
    out = {}
    for block in re.findall(r"@font-face\s*\{([^}]+)\}", css):
        u = re.search(r"url\((https://[^)]+\.ttf)\)", block)
        if not u:
            continue
        style = "italic" if "italic" in block else "normal"
        w = re.search(r"font-weight:\s*(\d+)", block)
        w = int(w.group(1)) if w else 400
        path = os.path.join(TMP, f"{prefix}_{w}_{style}.ttf")
        if not os.path.exists(path):
            open(path, "wb").write(requests.get(u.group(1), headers={"User-Agent": "Mozilla/5.0"}).content)
        out[f"{w}_{style}"] = path
    return out


cor = fetch_css_fonts("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&display=swap", "cor")
inter = fetch_css_fonts("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap", "inter")
COR = fm.FontProperties(fname=cor["600_normal"])
INT = fm.FontProperties(fname=inter["400_normal"])
INTM = fm.FontProperties(fname=inter["500_normal"])
INTB = fm.FontProperties(fname=inter["600_normal"])

BG, AMBER = "#0a0908", "#e09422"
INK_BR, INK, INK_DIM, INK_FAINT = "#ece4d6", "#ccc6b8", "#968b7a", "#5a5247"

ap = argparse.ArgumentParser()
ap.add_argument("--out", default=None, help="output PNG path")
ARGS = ap.parse_args()

measure = os.path.join(ROOT, "scripts", "measure-rolling-oos.js")
DATA = json.loads(subprocess.check_output(["node", measure, "--json"], cwd=ROOT).decode())
print(f"last sample {DATA['meta']['lastSample']} - full-series fit b={DATA['meta']['fullSeriesB']}")

rows = [r for r in DATA["rows"] if int(r["cutoff"][:4]) >= 2012]
def qx(c):
    y, q = c.split("-Q"); return int(y) + (int(q) - 1) / 4 + 0.125
x = [qx(r["cutoff"]) for r in rows]; today = [r["todayX"] for r in rows]
in4 = [(qx(r["cutoff"]), r["in4y"]) for r in rows if r["in4y"] is not None]
idx = lambda c: [r["cutoff"] for r in rows].index(c)

# 1456 x 1650 px: Substack shows it at column width, so every label is sized for half scale.
fig = plt.figure(figsize=(14.56, 16.5), dpi=100, facecolor=BG)
gs = fig.add_gridspec(2, 1, height_ratios=[1.25, 1], left=0.10, right=0.97, top=0.80, bottom=0.06, hspace=0.42)
axA = fig.add_subplot(gs[0]); axB = fig.add_subplot(gs[1], sharex=axA)

fig.text(0.10, 0.965, "Fitted only on what was known at the time", fontproperties=COR, fontsize=46, color=INK_BR, va="top")
fig.text(0.10, 0.918, "The power law refitted at every quarter-end, 2012 to 2024,\nusing no data past the cutoff.", fontproperties=INT, fontsize=23, color=INK_DIM, va="top", linespacing=1.35)

TICK = 21
for ax in (axA, axB):
    ax.set_facecolor(BG)
    for s in ax.spines.values(): s.set_visible(False)
    ax.grid(True, axis="y", color=AMBER, alpha=0.12, linewidth=1)
    ax.tick_params(axis="both", colors=INK_DIM, labelsize=TICK, length=0, pad=8)
    ax.set_xlim(2011.9, 2025.1)

# Panel A
axA.set_yscale("log"); axA.set_ylim(0.3, 30)
axA.yaxis.set_major_locator(FixedLocator([0.5, 1, 2, 5, 10, 20])); axA.yaxis.set_minor_locator(NullLocator())
axA.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:g}×"))
axA.axhspan(0.68, 1.24, color=AMBER, alpha=0.10, lw=0)
axA.axhline(1.0, color=INK_FAINT, lw=1.5, ls=(0, (4, 4)))
axA.axvline(2016.0, color=INK_FAINT, lw=1.5)
axA.plot(x, today, color=AMBER, lw=3.5, solid_capstyle="round", zorder=3)
axA.scatter(x, today, s=70, color=AMBER, edgecolor=BG, linewidth=2, zorder=4)
axA.text(0.0, 1.03, "Where each fit put today's trend\n(as a multiple of the line the site draws)", transform=axA.transAxes, fontproperties=INTB, fontsize=22, color=INK, va="bottom", linespacing=1.3)
axA.text(2024.9, 1.32, "the site's line = 1×", fontproperties=INT, fontsize=20, color=INK_DIM, ha="right", va="bottom")
i = idx("2014-Q4")
axA.annotate("End of 2014:\n7× today's trend", xy=(x[i], today[i]), xytext=(2015.5, 12), fontproperties=INTM, fontsize=22, color=INK_BR, ha="left", va="center", linespacing=1.25,
             arrowprops=dict(arrowstyle="-", color=INK_DIM, lw=1.5, shrinkB=8))
axA.text(2016.2, 0.33, "From 2016, every fit\nlands within 0.68× to 1.24×", fontproperties=INTM, fontsize=22, color=INK_BR, ha="left", va="bottom", linespacing=1.25)
axA.text(2012.7, 26, "2011 fits are off the chart:\n36× to 2.9 million×", fontproperties=INT, fontsize=19, color=INK_DIM, ha="left", va="top", linespacing=1.25)

# Panel B
axB.set_ylim(0, 108)
axB.yaxis.set_major_locator(FixedLocator([0, 25, 50, 75, 100])); axB.yaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:g}%"))
axB.axvline(2016.0, color=INK_FAINT, lw=1.5)
axB.bar([p[0] for p in in4], [p[1] for p in in4], width=0.2, color=AMBER, edgecolor=BG, linewidth=1, zorder=3)
axB.text(0.0, 1.03, "How much of the next four years\nstayed inside that fit's channel", transform=axB.transAxes, fontproperties=INTB, fontsize=22, color=INK, va="bottom", linespacing=1.3)
def lab(c, txt):
    i = idx(c); axB.text(x[i], rows[i]["in4y"] + 3, txt, fontproperties=INTM, fontsize=21, color=INK_BR, ha="center", va="bottom")
lab("2014-Q3", "22%"); lab("2018-Q1", "100%"); lab("2022-Q2", "91%")
axB.text(2023.7, 52, "needs four years\nof hindsight, so\nthe record ends\nin mid-2022", fontproperties=INT, fontsize=19, color=INK_DIM, ha="center", va="center", linespacing=1.3)
axB.set_xticks(range(2012, 2026, 2)); axB.set_xticklabels([str(y) for y in range(2012, 2026, 2)])
plt.setp(axA.get_xticklabels(), visible=False)

INT_T = INT.copy(); INT_T.set_size(TICK)
for ax in (axA, axB):
    for lab in ax.get_xticklabels() + ax.get_yticklabels(): lab.set_fontproperties(INT_T)
fig.text(0.10, 0.018, "lastcoinstanding.com", fontproperties=INT, fontsize=18, color=INK_FAINT, va="bottom")
out = ARGS.out or os.path.join(ROOT, "rolling-fits-substack.png")
fig.savefig(out, dpi=100, facecolor=BG)
print("saved", out)
