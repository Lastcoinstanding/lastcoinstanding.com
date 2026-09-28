#!/usr/bin/env python3
"""
verify-real-estate-sources.py: recompute the real-estate pair's sourced defaults
from their primaries.

WHY THIS EXISTS. The real-estate pair (BvRE + BvRP) sets home-appreciation
presets and a default rent from public data. Those defaults must be re-verified
on a schedule (MONTHLY_REFRESH_CHECKLIST: price-to-rent semiannually, the
appreciation presets when a new full year of Case-Shiller data lands). Doing it
by hand means re-fetching and re-deriving four series; this does it in one run
and prints the DATA_AUDIT values. First written for PR 4 (2026-09-28).

It computes from the RAW files, never from a summary: every figure below is
(V_end / V_start)^(1/n) - 1 on annual averages of the monthly data.

HOW TO RUN (from the repo root; needs network):
    pip install xlrd requests
    python3 scripts/verify-real-estate-sources.py

WHAT IT PRINTS
  M1  nominal appreciation presets, end point = latest FULL calendar year:
        Long run   Shiller 1890 -> his last full year, chained to Case-Shiller
        Since 1990 and Since 2000   Case-Shiller National (FRED CSUSHPINSA)
      plus the real (CPI-deflated) equivalents used by DATA_AUDIT RE-1 / RE-2.
  M4  US price-to-rent from Zillow ZORI (all homes) / ZHVI (middle tier),
      the default rent on a given home price, and 12 months of the ratio.
  LENDING  the stablecoin-lending disclosure on /bitcoin-vs-rental-property
      (JM ruling 2026-09-28): the 3-month T-bill (FRED DTB3) as the risk-free
      reference, and the BASE supply rate of the largest Ethereum pool for each
      listed DeFi instrument (DefiLlama). Token-reward incentives are excluded:
      they are promotional, not lending income. Prints the median, which sets
      the slice's default (move it only if the median drifts > 0.5 points).
  The Shiller/Case-Shiller splice is CHECKED, not assumed: the script prints
  how closely the two series agree over their overlap. If that gap ever grows
  beyond a fraction of a percent, the chaining is no longer valid - stop.
"""
import csv, io, statistics as st, sys
from collections import defaultdict
import requests, xlrd

UA = {"User-Agent": "Mozilla/5.0 (lastcoinstanding.com source verification)"}
FRED = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={}"
SHILLER = "http://www.econ.yale.edu/~shiller/data/Fig3-1.xls"
ZORI = "https://files.zillowstatic.com/research/public_csvs/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv"
ZHVI = "https://files.zillowstatic.com/research/public_csvs/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv"
HOME_PRICE = 415000   # the pages' default (JM ruling 2026-09-28: 2025 MSPUS); change to test another
LLAMA = "https://yields.llama.fi/pools"
# (label, DefiLlama project, symbol). Ledn is CeFi and has no public feed: its
# rate is read from Ledn and recorded in DATA_AUDIT BvRP-18 by hand.
LENDING = [("Sky Savings Rate (sUSDS)", "sky-lending", "SUSDS"),
           ("Aave v3 USDC (Ethereum)", "aave-v3", "USDC"),
           ("Compound v3 USDC (Ethereum)", "compound-v3", "USDC")]
LEDN_RATE = 5.00      # CeFi, not available to US residents; update by hand from Ledn


def get(url):
    r = requests.get(url, headers=UA, timeout=60); r.raise_for_status(); return r


def fred_annual(series, min_months=12):
    by = defaultdict(list)
    for row in csv.DictReader(io.StringIO(get(FRED.format(series)).text)):
        v = row[series]
        if v not in ("", "."):
            by[int(row["observation_date"][:4])].append(float(v))
    return {y: st.mean(v) for y, v in by.items() if len(v) >= min_months}, by


def shiller_annual(col_date, col_val):
    s = xlrd.open_workbook(file_contents=get(SHILLER).content).sheet_by_name("Data")
    by = defaultdict(list)
    for r in range(7, s.nrows):
        d, v = s.cell_value(r, col_date), s.cell_value(r, col_val)
        if isinstance(d, float) and isinstance(v, float):
            by[int(d + 1e-9)].append(v)
    # annual rows through 1952, then monthly: keep only complete years
    return {y: st.mean(v) for y, v in by.items() if (y < 1953 and len(v) == 1) or len(v) == 12}


def cagr(g, n):
    return g ** (1 / n) - 1


def main():
    cs, cs_raw = fred_annual("CSUSHPINSA", 12)
    cpi, cpi_raw = fred_annual("CPIAUCNS", 11)   # allow 11: FRED's Oct-2025 CPI is blank
    sh_nom = shiller_annual(7, 8)                # nominal index
    sh_real = shiller_annual(0, 1)               # Shiller's own real index

    end = max(cs)                                # latest FULL year of Case-Shiller
    sh_end = max(sh_nom)
    print(f"Latest full year: Case-Shiller {end} (partial {end + 1}: {len(cs_raw.get(end + 1, []))} months); "
          f"Shiller file ends {sh_end}")

    print("\nSplice check (Shiller vs Case-Shiller growth over the overlap):")
    worst = 0
    for a in (1990, 2000, 2010):
        g_sh, g_cs = sh_nom[sh_end] / sh_nom[a], cs[sh_end] / cs[a]
        gap = 100 * (g_sh / g_cs - 1); worst = max(worst, abs(gap))
        print(f"  {a}-{sh_end}: Shiller x{g_sh:.4f}  Case-Shiller x{g_cs:.4f}  gap {gap:+.2f}%")
    if worst > 0.5:
        sys.exit(f"STOP: splice gap {worst:.2f}% exceeds 0.5% - chaining is no longer valid.")

    print(f"\nM1 - nominal appreciation presets (end {end}):")
    g_lr = (sh_nom[sh_end] / sh_nom[1890]) * (cs[end] / cs[sh_end])
    rows = [("Long run (Shiller, chained)", 1890, g_lr),
            ("Since 1990 (Case-Shiller)", 1990, cs[end] / cs[1990]),
            ("Since 2000 (Case-Shiller)", 2000, cs[end] / cs[2000])]
    for name, a, g in rows:
        n = end - a
        real = f"{100 * cagr(g / (cpi[end] / cpi[a]), n):.2f}% real" if a in cpi else "real: n/a (CPI from 1913)"
        print(f"  {name:30} {a}-{end}  x{g:7.3f}  {100 * cagr(g, n):5.2f}% nominal   {real}")
    print(f"  Shiller's own real index 1890-{sh_end}: {100 * cagr(sh_real[sh_end] / sh_real[1890], sh_end - 1890):.2f}%/yr  (DATA_AUDIT RE-1)")

    print("\nM4 - price-to-rent (Zillow, US):")
    def us(url):
        rd = csv.reader(io.StringIO(get(url).text)); hdr = next(rd)
        for row in rd:
            if row[3] == "country":
                return hdr, row
    hz, zori = us(ZORI); hv, zhvi = us(ZHVI)
    both = [d for d in hz[5:] if d in hv[5:] and zori[hz.index(d)].strip() and zhvi[hv.index(d)].strip()]
    m = both[-1]
    rz, rv = float(zori[hz.index(m)]), float(zhvi[hv.index(m)])
    pr = rv / (12 * rz)
    print(f"  {m}: ZORI ${rz:,.0f}/mo  ZHVI ${rv:,.0f}  ->  P/R {pr:.2f}")
    print(f"  default rent on ${HOME_PRICE:,}: ${HOME_PRICE / (12 * pr):,.0f}/mo")
    print("  last 12 months: " + "  ".join(
        f"{d[:7]}:{float(zhvi[hv.index(d)]) / (12 * float(zori[hz.index(d)])):.2f}" for d in both[-12:]))


def lending():
    print("\nLENDING - stablecoin-lending disclosure (base rates, largest Ethereum pool):")
    tb, tb_raw = None, None
    rows = [r for r in csv.DictReader(io.StringIO(get(FRED.format("DTB3")).text)) if r["DTB3"] not in ("", ".")]
    tb = rows[-1]
    print(f"  3-month T-bill (DTB3)          {float(tb['DTB3']):5.2f}%   as of {tb['observation_date']}   [reference]")
    pools = get(LLAMA).json()["data"]
    rates = []
    for label, project, symbol in LENDING:
        cand = [q for q in pools if q["project"] == project and q["symbol"] == symbol and q["chain"] == "Ethereum"]
        if not cand:
            print(f"  {label:30} NOT FOUND - the pool may have been renamed; check DefiLlama")
            continue
        q = max(cand, key=lambda x: x.get("tvlUsd") or 0)
        base = q.get("apyBase") or 0
        rates.append(base)
        print(f"  {label:30} {base:5.2f}%   (TVL ${(q.get('tvlUsd') or 0) / 1e6:,.0f}M; token rewards {q.get('apyReward') or 0:.2f}% excluded)")
    print(f"  {'Ledn Growth Account (USDC)':30} {LEDN_RATE:5.2f}%   CeFi, by hand; NOT available to US residents")
    allr = sorted(rates + [LEDN_RATE])
    mid = (allr[len(allr) // 2] + allr[(len(allr) - 1) // 2]) / 2
    print(f"  median of the lending rates: {mid:.2f}%   (slice default 4.0%; move it only if this drifts > 0.5 points)")


if __name__ == "__main__":
    main()
    lending()
