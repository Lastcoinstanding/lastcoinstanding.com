# Data audit registry

A registry of every cited data point on the site, with sources and audit dates. This file exists so that data citations can be refreshed on a regular cadence rather than rotting silently.

## Schedule

**Audit cadence: every six months.** When a row's "Next due" date is reached, work through it: visit the source URL, verify the cited number is still current (or update it), update the page if the value has materially shifted, and record a new "Last audited" date.

If a source URL has rotted (404, paywall, organizational change), find the closest equivalent stable source and update the URL — or, if no equivalent exists, mark the row `STALE` and surface as a TECH_DEBT entry for design review (sometimes a missing source means the cited claim itself needs revisiting).

Government data series (FRED, BLS, BEA) are stable long-term and rarely require URL updates. Annually-republished sources (Vanguard CMA, GMO 7-year forecasts) get specific URLs that may need annual refreshes; updating to the current edition's URL is the audit task.

## How to use this file

When **adding** a new cited value to the site, add a row here as part of the same commit. When **updating** a value, update the row. When **auditing**, work through the rows whose "Next due" date is past or near.

The registry is not exhaustive of every number on the site — narrative prose contains many quantitative claims that don't need formal citation. Register: (1) any number presented as a calculator default or selectable preset, (2) any number with an explicit source attribution in copy or chart, (3) any number that materially affects user-facing computation.

---

## Modeling assumptions canonical

Citations behind the sitewide modeling-assumption presets. See `STYLE_GUIDE.md §3.5` for the canonical pattern.

### Inflation / monetary debasement

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| I-1 | CPI Official baseline | 3.5% | BLS Consumer Price Index | https://www.bls.gov/cpi/ | 2026-05-02 | 2026-11-02 |
| I-2 | M2 money supply growth, 1974–2024 average | ~6.8% | FRED M2SL series | https://fred.stlouisfed.org/series/M2SL | 2026-05-02 | 2026-11-02 |
| I-3 | Real GDP growth, 1974–2024 average | ~2.5% | FRED GDPC1 series | https://fred.stlouisfed.org/series/GDPC1 | 2026-05-02 | 2026-11-02 |
| I-4 | Shadow Stats methodology baseline | ~8% | ShadowStats Alternate CPI | http://www.shadowstats.com/alternate_data/inflation-charts | 2026-05-02 | 2026-11-02 |

### Real returns (diversified portfolio)

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| R-1 | S&P 500 long-run real return, 1928–2024 | ~6.7% | Damodaran historical returns dataset | https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html | 2026-05-02 | 2026-11-02 |
| R-2 | US 10-yr Treasury long-run real return, 1928–2024 | ~2.0% | Damodaran historical returns dataset | https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html | 2026-05-02 | 2026-11-02 |
| R-3 | Vanguard 10-year US equity forward CMA | ~3.5–5% nominal | Vanguard Capital Markets Model | https://corporate.vanguard.com/content/corporatesite/us/en/corp/articles/economic-market-outlook.html | 2026-05-02 | 2026-11-02 |
| R-4 | GMO 7-year asset class forecast | varies | GMO 7-Year Asset Class Forecast | https://www.gmo.com/americas/research-library/gmo-7-year-asset-class-forecast/ | 2026-05-02 | 2026-11-02 |

### Real estate appreciation

**Nominal since PR 4a (2026-09-28; REAL_ESTATE_PAIR_RULINGS M1 and §7).** The sitewide dimension is `homeApprNominal` (STYLE_GUIDE §3.5); RE-3–RE-5 are its presets. RE-1 and RE-2 are the real rates, kept for reference and **corrected** here: RE-2's "~3.7% real" did not reproduce, and RE-1's ~0.4% came from a series ending in 2017. Method for all five: compound annual rate on **annual averages** of monthly data, end point = latest full year; computations in `REAL_ESTATE_PAIR_PR4_SOURCES.md` § M1, reproducible with `scripts/verify-real-estate-sources.py`.

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| RE-1 | US home prices, real (CPI), 1890–2022 | **0.59% real** (was "~0.4%, 1890–2024": that figure ended in 2017) | Shiller, *Irrational Exuberance* housing data, real index (sheet `Data`, col 1) | http://www.econ.yale.edu/~shiller/data/Fig3-1.xls | 2026-09-28 | 2027-03-28 |
| RE-2 | Case-Shiller US National, real (CPI-U), 2000–2024 | **2.19% real** (was "~3.7%", which does not reproduce); 2.09% to 2025 | FRED `CSUSHPINSA` deflated by FRED `CPIAUCNS` (2025 has 11 months; October 2025 is blank) | https://fred.stlouisfed.org/series/CSUSHPINSA · https://fred.stlouisfed.org/series/CPIAUCNS | 2026-09-28 | 2027-03-28 |
| RE-3 | Home appreciation preset **Long run** (nominal), 1890–2025 | **3.41%** a year (×92.41 over 135 years) | Shiller nominal index 1890–2022 (sheet `Data`, col 8), chained to FRED `CSUSHPINSA` 2022–2025; splice checked: the two agree to within 0.06% over 1990–2022 | http://www.econ.yale.edu/~shiller/data/Fig3-1.xls · https://fred.stlouisfed.org/series/CSUSHPINSA | 2026-09-28 | 2027-03-28 |
| RE-4 | Home appreciation preset **Since 1990** (nominal), 1990–2025 | **4.23%** a year (×4.270 over 35 years) | S&P CoreLogic Case-Shiller U.S. National Home Price Index, NSA (FRED `CSUSHPINSA`) | https://fred.stlouisfed.org/series/CSUSHPINSA | 2026-09-28 | 2027-03-28 |
| RE-5 | Home appreciation preset **Since 2000** (nominal; the default), 2000–2025 | **4.68%** a year (×3.135 over 25 years) | S&P CoreLogic Case-Shiller U.S. National Home Price Index, NSA (FRED `CSUSHPINSA`) | https://fred.stlouisfed.org/series/CSUSHPINSA | 2026-09-28 | 2027-03-28 |

**Refresh (RE-1–RE-5):** once a year, when the latest full year's twelve Case-Shiller months are published (about March). Run `scripts/verify-real-estate-sources.py`, move the end point to the new full year, and update the three preset values in `shared/modeling-assumptions.js` and STYLE_GUIDE §3.5 in the same commit. If Since 2000 stops being the highest of the three windows, the default rule (rulings M1: the judgment call leans against bitcoin's case) needs a fresh ruling rather than a silent change.

### Real-estate pair: price, rent and costs

**Added in PR 4b (2026-09-28; REAL_ESTATE_PAIR_RULINGS M4, M6 and §7).** The defaults both pages use, held in one object, `PAIR_DEFAULTS` in `src/_includes/_pageassets/shared/real-estate-model.js`. BvRE writes them into its inputs and link defaults; BvRP's `state` reads them. **A refresh edits that object** plus the tooltip prose that quotes the number (listed in MONTHLY_REFRESH_CHECKLIST §9.3). Direction per rulings §0 is in the PR 4b description.

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| RE-6 | Default home price (BvRE projection) | **$415,000**: the 2025 average of the median price of *new* houses sold ($415,400), rounded | Census/HUD via FRED `MSPUS`; latest full year, the same end-point rule as RE-3–RE-5 | https://fred.stlouisfed.org/series/MSPUS | 2026-09-28 | 2027-03-28 |
| RE-7 | US price-to-rent ratio (default rent = price ÷ 12 ÷ this) | **15.77** (August 2026): ZHVI $368,697 ÷ (12 × ZORI $1,948). Held 15.77–16.17 over the prior 12 months. Default rent on $415,000: **$2,193/mo** | Zillow Home Value Index (typical value, middle tier, SFR + condo, smoothed, SA) and Zillow Observed Rent Index (all homes), row `United States`; reproducible with `scripts/verify-real-estate-sources.py` (M4) | https://www.zillow.com/research/data/ | 2026-09-28 | 2027-03-28 (semiannual) |
| RE-8 | Buyer closing costs (% of price) | **1.04%** ($4,528 average), calendar-2025 purchase transactions; **includes** recording fees and transfer taxes ($2,993 without them). Sample 620,000+ quotes | LodeStar Software Solutions, *2026 Purchase Mortgage Closing Cost Data Report*, 27 Apr 2026 | https://www.lodestarss.com/2026/04/27/data-reports-2026-purchase-mortgage-closing-cost-data-report/ | 2026-09-28 | 2027-05-01 (next annual report) |
| RE-9 | Property tax (% of current value / yr) | **0.90%**: national effective rate on single-family homes, 2025 (0.86% in 2024); 86M+ homes | ATTOM, 2025 annual property tax analysis, 9 Apr 2026 | https://www.attomdata.com/news/market-trends/home-sales-prices/2025-annual-tax-report/ | 2026-09-28 | 2027-05-01 (next annual report) |
| RE-10 | Homeowners insurance | **about $2,490 a year for $400,000 of dwelling coverage**; the default scales it to the home's price ($2,583 on $415,000) and grows it with the home's value. Dwelling coverage excludes land, so applied to market value it is, if anything, slightly high | NerdWallet analysis of Quadrant Information Services rates, updated 6 May 2026 | https://www.nerdwallet.com/insurance/homeowners/learn/average-homeowners-insurance-cost | 2026-09-28 | 2027-03-28 |
| RE-11 | Maintenance (% of current value / yr) | **1%**, a stated rule of thumb | **No primary.** Angi's 2025 *State of Home Spending* reports sentiment, not spend as a share of value; the page says it is a rule of thumb | — | 2026-09-28 | 2027-03-28 |
| RE-12 | Selling costs (% of sale price), both pages | **6.6%** = 5.6% agent commission + 1% other seller closing costs. Commission: Clever Real Estate's two 2026 agent surveys, **5.70%** (533 agents, released 24 Mar 2026) and **5.46%** (434 agents, August 2026), midpoint 5.58%; Redfin's buyer-agent average **2.42%** (Q3 2025, 2.36% at the Aug 2024 rule change) corroborates the buyer half. The **1% is an estimate**: seller closing costs have no national primary and are dominated by state transfer taxes | Clever Real Estate; Redfin | https://listwithclever.com/average-real-estate-commission-rate/ · https://www.prnewswire.com/news-releases/the-typical-us-home-sale-costs-over-20-000-in-realtor-fees-in-2026--302722971.html · https://www.redfin.com/news/commissions-q3-2025/ | 2026-09-28 | 2027-03-28 |
| RE-13 | Bitcoin transaction cost (% per purchase and sale) | **0.5%**, a stated estimate of spread and fees, so one side isn't charged and the other free (M6) | **No primary**; the page calls it an estimate and exposes it as an input (0–2%) | — | 2026-09-28 | 2027-03-28 |

**Sourcing corrections made while implementing (2026-09-28).** `REAL_ESTATE_PAIR_PR4_SOURCES.md` had (1) LodeStar's $4,661 as "2025, likely excluding transfer taxes": it was the *2025 report* on calendar-2024 data, and it **includes** transfer taxes; the 2026 report (calendar 2025) gives 1.04% of price, which replaces the ruled 1.1% (lower and better sourced, so it also leans against the thesis). (2) FastExpert's "5.57%, early 2025": its page reports "roughly 5.5%" from a **2022** survey, before the rule change, so it is dropped; Clever's two 2026 surveys still put the commission midpoint at 5.6%, so the ruled 6.6% stands.

### Real-estate pair: bitcoin scenarios

**Added in PR 4c (2026-09-28; REAL_ESTATE_PAIR_RULINGS M3).** One scenario set on both pages, in `shared/real-estate-model.js` (`scenarioTarget`, `scenarioMultiple`): bitcoin's multiple of the Power Law trend moves in a straight line from today's to a target at the horizon end. Coefficients and the floor multiple are inherited from PL-1.

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| RE-14 | Scenario targets (multiple of trend at the horizon end) | Floor **0.42×** (`PL_FLOOR`, PL-1) · Stay **today's multiple** (the default) · Trend **1×** · Upper **2.5×** (`UPPER_TARGET`, a stated stress-test level, not a channel line; BvRE used the 3× ceiling before 4c, BvRP already used 2.5×). The engine reads the constants; the button and chip labels and the tooltips state them in copy, so a change to either constant is a copy change too | Rulings M3; Floor from PL-1 | — | 2026-09-28 | with PL-1 |
| RE-15 | Cycle-peak multiples quoted in Upper's tooltip (both pages) | **Computed at load** by `cyclePeakMultiples()` from `PL_DATA` ÷ `plPrice`: at this audit 11.99× (30 Nov 2013), 5.41× (15 Dec 2017), 3.19× (21 Feb 2021) and 1.19× (14 Dec 2024, the cycle to date). `PL_DATA` is sampled about every 12 days, so peaks between samples are missed; the copy says "at least" | `shared/power-law-data.js` (PL-1) | — | 2026-09-28 | with the monthly PL_DATA refresh (automatic) |

### Real-estate pair: the retrospective's monthly series

**Added in PR 4e (2026-09-28; REAL_ESTATE_PAIR_RULINGS M11, M4, P8).** BvRE's retrospective runs month by month from July of the start year to today (`bvreRetro` in `shared/real-estate-model.js`). The housing series live in `shared/housing-monthly-data.js`, stored as published (CS and CPI to 3 dp, ZORI to 2 dp, ZHVI to the dollar); every value was checked against the raw files at this audit, and an independent model reproduces the page's figures from the raw files to within $15 on an $18.6M result (to the cent from the stored values). **Refresh: MONTHLY_REFRESH_CHECKLIST §9.4** (append the new months; the retrospective's end month moves by itself).

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| RE-16 | Case-Shiller U.S. National, monthly (`CS_NATIONAL`), and its annual averages (`csData` in `shared/bvre-annual-data.js`) | 2013-01 to **2026-06** (162 months; 336.663 at June 2026). The retrospective grows the house by it from July of the start year to the latest month (M11), and tax, insurance and maintenance follow that value. `csData` (2013–2025 annual averages, e.g. 2025 328.52) grows housing in BvRE's growth-of-$1 chart, its every-starting-year table and The Gallery's chart 4, which used the new-house median before 4e (MSPUS rose ×1.29 from 2017 to 2025, Case-Shiller ×1.72) | S&P CoreLogic Case-Shiller U.S. National Home Price Index, NSA (FRED `CSUSHPINSA`); publishes with a two-month lag | https://fred.stlouisfed.org/series/CSUSHPINSA | 2026-09-28 | monthly (§9.4); `csData` each January |
| RE-17 | Zillow Observed Rent Index, United States, monthly (`ZORI_US`) | 2015-01 to **2026-08** (140 months; $1,947.97 at August 2026). The renter's rent resets to it each July, as a lease renewed at market would (M4). Market rents rose faster than the rents all tenants pay (July 2020 to July 2022: ZORI ×1.23, CPI rent ×1.08; July 2017 to August 2026: ×1.51 and ×1.46), so resetting to market each year leans against the renter | Zillow Research, `Metro_zori_uc_sfrcondomfr_sm_month` (all homes plus multifamily, smoothed), row `United States` | https://www.zillow.com/research/data/ | 2026-09-28 | monthly (§9.4) |
| RE-18 | Zillow Home Value Index, United States, monthly (`ZHVI_US`), and the start year's price-to-rent | 2014-01 to **2026-08** (152 months). Start-year price-to-rent = mean ZHVI ÷ (12 × mean ZORI) over the calendar year: **2014 13.74** (ZORI backcast, RE-19) · 2015 13.77 · 2016 14.05 · 2017 14.30 · 2018 14.60 · 2019 14.73 · 2020 15.24 · 2021 16.17 · 2022 16.57 · 2023 16.31 · 2024 16.38. Market rent in July of the start year = price ÷ 12 ÷ that ratio (2017: $1,886 a month on $323,500; the pre-4e rule, 75% of the mortgage payment, gave $926) | Zillow Research, `Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month` (typical home, middle tier, smoothed, SA), row `United States` | https://www.zillow.com/research/data/ | 2026-09-28 | monthly (§9.4) |
| RE-19 | CPI rent of primary residence (`CPI_RENT`), 2014–2015 | 24 months, 2014-01 to 2015-12 (272.317 to 291.204). ZORI begins in 2015, so a 2014 start backcasts it: ZORI(2015-01) × CPI rent(month) ÷ CPI rent(2015-01). Only the 2014 start year uses it | BLS CPI-U, US city average, NSA (FRED `CUUR0000SEHA`) | https://fred.stlouisfed.org/series/CUUR0000SEHA | 2026-09-28 | only if the start range extends before 2014 |
| RE-20 | Bitcoin prices in the retrospective | **Entry:** the start year's average price, the mean of `PL_DATA`'s samples in that calendar year (a ~12-day grid, close to the daily average): 2014 $524 · 2015 $274 · 2016 $553 · **2017 $3,967** · 2018 $7,599 · 2019 $7,313 · 2020 $10,962 · 2021 $47,158 · 2022 $27,920 · 2023 $28,693 · 2024 $65,153. The page used `btcData` before 4e, the mean of twelve month-end closes, which in 2017 (a ×13 year) is 9.6% higher ($4,348). **Monthly flows:** the price each month opened at, the previous month's close (BTC-M-1), or today's price when that close isn't in the series yet. **End:** today's price (`fetchTodayPrice`, seeded with the latest `PL_DATA` sample) | `shared/power-law-data.js` (PL-1), `shared/btc-monthly-data.js` (BTC-M-1) | — | 2026-09-28 | with PL-1 and BTC-M-1 (automatic) |

---

## Existing-page citations

Citations already present on the site as of Stage 1 (commit context: pending).

### the-power-law

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| PL-1 | Power Law coefficients (a, b) | a=1.6×10⁻¹⁷, b=5.77 | Porkopolis Economics: The Chart | https://www.porkopolis.io/thechart/ | 2026-05-02 | 2026-11-02 |
| PL-2 | Bitcoin price data (historical) | various | Blockchain.info | https://www.blockchain.com/explorer | 2026-05-02 | 2026-11-02 |
| PL-3 | Doubling Ladder trendline coefficients (a, b) | a=1.69×10⁻¹⁷, b=5.763 | Porkopolis / Santostasi (on-page attribution); a later refit of the same source as PL-1 | https://www.porkopolis.io/thechart/ | 2026-08-02 | 2026-11-02 |
| PL-4 | Exponent survey — BitcoinPower.law (a, b) | a=10⁻¹⁶·⁴⁹³ (≈3.2×10⁻¹⁷), b=5.68 | BitcoinPower.law (independent implementation) | https://bitcoinpower.law/ | 2026-08-04 | 2026-11-02 |
| PL-5 | Exponent survey — bitcoinretirement.net (a, b) | a=1.0117×10⁻¹⁷, b=5.82 | bitcoinretirement.net; pair recorded in `RETIREMENT_CALCULATOR_DESIGN_22` competitor table | https://bitcoinretirement.net/ | 2026-08-04 | 2026-11-02 |
| PL-6 | Exponent survey — b1m.io / Fred Krueger (b only) | b=5.566 (a not published) | Fred Krueger, b1m.io dashboard | https://b1m.io/ | 2026-08-04 | 2026-11-02 |

**PL-4 / PL-5 / PL-6 (added 2026-08-04, Power Law v2 exponent survey, item b).** These are the *competing* coefficient sets displayed in the Tab 1 exponent survey + explorer — registered per inclusion rule (2): each carries an explicit on-page source attribution. **PL-4 and PL-5 are plottable** (documented (a, b) pairs); **PL-6 is listed-not-plotted** (exponent published without its paired `a`, so no curve can be placed — that limitation is itself stated on the page). A naive full-series fit (b≈5.63) is also shown as *our own* self-fit, not an external source, so it takes no citation row. **Provenance caveat — honest at ship:** these values were taken from the Power Law v2 build prompt (JM) plus in-repo records (PL-5 from the retirement design doc), **not** freshly re-fetched from the live sources — the sites are JS-rendered dashboards and re-verification was deferred per the build prompt's fallback rule. **Re-verify all three against their live sources at the 2026-11-02 PL audit** (TECH_DEBT breadcrumb + MONTHLY_REFRESH_CHECKLIST line added the same day). The survey ranks these by *implied price*, never by bare exponent — `a` and `b` trade off (bitcoinretirement's b=5.82 is the steepest yet sits ~2% below canonical today).

**Out-of-sample chart now reader-parameterized (updated 2026-08-04; readout metric revised 2026-08-05).** Per the Architectural change log below, the OOS chart fits its own coefficients in-browser. As of Power Law v2 the training cutoff is a reader control (drag handle + presets, `?fit=` URL state); the row's recorded **default cutoff is end-2017 (b=5.657, a≈3.9×10⁻¹⁷)** — unchanged from the 2026-05-07 refit. Other cutoffs are reader-selected and transient (e.g. the end-2014 preset intentionally reproduces the historical b=6.787 bad fit). **Readout metric (2026-08-05 polish):** the fourth readout field now reports **Δ between the window's implied-today trend and a full-series self-fit** (same OLS method, every sample; full-series fit ≈ b 5.637, a 4.7×10⁻¹⁷, implied-today ≈ $137K). This replaced an "actual price vs. fitted trend" field that was contaminated by channel position (it read the cycle, ~−57% at today's ~0.43× multiple, not the fit). At the end-2017 default the Δ is ≈ −1%. No coefficient or source data changed — this is a display-metric change only.

**PL-3 (added 2026-08-02).** The Doubling Ladder page embeds its own trendline coefficients — `DL_A = 1.69×10⁻¹⁷, DL_B = 5.763` in `the-doubling-ladder.js` (its live stat card rounds the displayed exponent to 5.76) — rather than reading `PL_A`/`PL_B` from the shared module. This is **deliberate self-containment**: the file header states the coefficients are embedded so the page renders its verified figures deterministically. It is an intentional exception of the same kind TECH_DEBT §1 records for `the-melting-ice-cube` (own coefficients, left alone) — note that §1 does not name the Doubling Ladder explicitly, so this row is the registry's record of the exception. Registered per inclusion rule (2): the value carries an explicit on-page Porkopolis/Santostasi attribution. It is the **same source as PL-1 at a later refit**, not a competing source — the two differ by only ~0.66% at today's age and ~1.4% by 2060. **Flag: re-check PL-1's coefficients at its next audit (2026-11-02).** Porkopolis appears to have refit since PL-1 was recorded (2026-05-02), so canonical `a=1.6×10⁻¹⁷, b=5.77` may be due an update; PL-3 is the evidence. No code change made now.

**PL-2 sample cadence — `PL_DATA` is a ~12-day grid, NOT monthly (recorded 2026-08-10).** The `PL_DATA` series in `shared/power-law-data.js` is **481 samples spaced 12 days apart** — 476 of the 480 intervals are *exactly* 12 days — from day 592 (2010-08-18) to the present, with only the trailing handful appended one-per-month by the refresh (so the last few gaps run ~18–36 days). The module header and several consumer comments/captions long described it as "monthly samples," which is **wrong**; corrected in the dashboard-v2 pass (module header + inline comment; `/discount-or-premium` episode caption; `/disciplined-rebalancing` tooltip; `bitcoin-vs-the-stock-market.js` and `calculators-minis.js` comments; the dashboard's own tile 4). **Consequence for consumers:** measure durations, streaks, and "time below/above trend" in **elapsed time (day-spans → months), never sample counts** — a 72-sample below-trend run is ~28 months, not 72. `/discount-or-premium`'s duration engine (day-spans ÷ 30.44) and the dashboard's below-trend-streak tile both do this correctly; the defect was labelling, not arithmetic. `/what-daily-conviction-bought` already documented the true cadence ("about 12-day samples"). Residual "monthly sample" mentions remain only in `DISCOUNT_OR_PREMIUM_DESIGN.md` (a historical design record) — left as-is, listed in the dashboard-v2 PR.

### what-daily-conviction-bought

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| WDCB-1 | The "$30/day since 2017" legend story | ~$86,370 in over 7y10m12d to reach $1M (widely reported) | Benzinga (Nov 2024) · crypto.news (Jun 2025) | https://www.benzinga.com/markets/cryptocurrency/24/11/42170334/bitcoin-investor-turns-daily-30-purchases-into-1-million-portfolio-in-7-years-10-months-an · https://crypto.news/30-to-1m-how-this-bitcoin-investor-turned-spare-change-into-seven-figures/ | 2026-08-05 | 2027-08-05 |

**WDCB-1 (added 2026-08-05; direct cites attached 2026-08-05).** The page's *default* narrative — $30/day of bitcoin since Jan 2017 first crossing $1,000,000 — is the widely-reported legend. Registered per inclusion rule (2) with its two primary-coverage sources: **Benzinga** (Nov 2024) and **crypto.news** (Jun 2025), both linked on the page beside the Bitcoin Exit essay. The page **recomputes** the story live rather than restating the reported figures, and its recompute matched the legend within rounding ($86,400 vs the reported ~$86,370; crossing 2024-11-19 vs the reported "7y10m12d"). **All computed values on the page derive from `PL_DATA`** via the same log-linear daily interpolation as `scripts/thirty-a-day-chart.ps1` — no separate citation rows are needed for the accumulated-BTC / value / drawdown figures; they inherit `PL_DATA`'s provenance (PL-2).

### the-melting-ice-cube

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| MIC-1 | Power Law coefficients | (same as PL-1) | Porkopolis Economics: The Chart | https://www.porkopolis.io/thechart/ | 2026-05-02 | 2026-11-02 |
| MIC-2 | Public treasury holdings (treasury cash positions) | various, as of 2024–2025 | Public corporate filings (in-page note) | n/a — sourced from filings, not single URL | 2026-05-02 | 2026-11-02 |

### bitcoin-vs-real-estate

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| BvRE-1 | Historical home prices (median US new house, `homeData`); the retrospective's start price, start years 2014–2024 since PR 4e (was 2014–2021) | various per year | Federal Reserve Economic Data | https://fred.stlouisfed.org/series/MSPUS | 2026-05-02 | 2026-11-02 |
| BvRE-2 | Historical 30-yr fixed mortgage rates (`mortgageRates`); the retrospective's default rate, start years 2014–2024 since PR 4e | various per year | FRED MORTGAGE30US | https://fred.stlouisfed.org/series/MORTGAGE30US | 2026-05-02 | 2026-11-02 |
| BvRE-3 | Historical bitcoin prices (`btcData`, annual); the static exhibits only since PR 4e, which moved the retrospective to RE-20 | various per year | (same as PL-2) | https://www.blockchain.com/explorer | 2026-05-02 | 2026-11-02 |
| BvRE-4 | Global affordability time series — HK, Sydney, Vancouver, London, US (national), 2005–2024 | 20-year median-multiple series per market (see globalAffordabilityChart datasets in bitcoin-vs-real-estate.js) | Demographia International Housing Affordability, annual editions 2006–2025 | http://www.demographia.com/db-dhi-index.htm (older editions) + https://www.chapman.edu/communication/_files/Demographia-International-Housing-Affordability-2025-Edition.pdf (latest) | 2026-05-28 | 2027-05-28 |

**Provenance note for BvRE-4.** Each Demographia edition reports Q3 data for the prior calendar year — i.e., the 2025 edition (released May 2025) contains Q3 2024 figures, which is the most recent data point in the chart. The dataset was assembled by scraping the 20 annual PDFs into text, extracting the per-market median multiples via regex, and manually verifying every value against the source PDF (or, for the 2023 edition's UK figures and a handful of older-edition cells where layout parsing was unreliable, by re-running a targeted grep against the PDF and reading the line by hand). Hong Kong was not included in the survey before the 2011 edition (Q3 2010 data), so HK values for 2005–2009 are intentionally null and render as a gap in the chart. **Annual refresh cadence**: Demographia releases each May; update BvRE-4 within ~4 weeks of release. The new value appended is for `data_year = (publication_year - 1)`; older values are stable and do not require re-checking.

### bitcoin-vs-rental-property

_Section created 2026-09-27 (`fix/bvrp-sourcing`, `REAL_ESTATE_PAIR_DESIGN.md` §4). Every dated or sourced figure on the page has a row; Strategy figures are EDGAR-sourced (strategy.com returns 403 to automated fetches). Refresh cadence: Strategy/Strive rows monthly with `MONTHLY_REFRESH_CHECKLIST` §7; the rest semiannually._

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| BvRP-1 | Strategy BTC holdings (Tab II bear case + Methodology) | 846,000 BTC as of 2026-09-20 | Strategy 8-K filed 2026-09-21 | https://www.sec.gov/Archives/edgar/data/1050446/000119312526396093/mstr-20260914.htm | 2026-09-27 | 2026-10-27 |
| BvRP-2 | Strategy USD Reserve | $5.04B as of 2026-09-20 (≈3 years of preferred dividends + convert interest); board minimum ≥12 months (policy 2026-06-29) | Strategy 8-K filed 2026-09-21; policy 8-K filed 2026-06-29 | https://www.sec.gov/Archives/edgar/data/1050446/000119312526396093/mstr-20260914.htm · https://www.sec.gov/Archives/edgar/data/1050446/000119312526286871/mstr-20260629.htm | 2026-09-27 | 2026-10-27 |
| BvRP-3 | Annual interest + preferred dividends (published) | $1.703B as of 2026-08-23 | MSTR Investor Briefing, filed with the SEC 2026-08-24 (FWP). Replaces the derived ≈$1.59B of 2026-09-27 (chat-side research, JM). The published figure predates part of the STRC repurchases through 2026-09-20. | https://www.sec.gov/Archives/edgar/data/1050446/000119312526363557/d431748dfwp.htm | 2026-09-27 | 2026-10-27 |
| BvRP-4 | Coverage tiles (holdings × price ÷ annual interest + dividends) | 49.7 / 24.8 / 14.9 yrs at $100K / $50K / $30K | Derived: 846,000 BTC (BvRP-1) × price ÷ $1.703B (BvRP-3) | (derived) | 2026-09-27 | 2026-10-27 |
| BvRP-5 | STRC rate and schedule (`YIELD_RATES.strc`, 12.0, in `shared/real-estate-model.js` since PR 4d, was the constant `0.12`; it drives the calculator, the slider label and the $500K example) | 12.00%, semi-monthly since 2026-06-30; daily record dates proposed, vote expected 2026-10-28 | Strategy 8-K filed 2026-09-01 (rate held for periods from 2026-09-16); 8-K + PRE 14A filed 2026-09-25. **Next rate announcement due ≈2026-09-30.** | https://www.sec.gov/Archives/edgar/data/1050446/000119312526377583/mstr-20260831.htm · https://www.sec.gov/Archives/edgar/data/1050446/000119312526401636/mstr-20260924.htm | 2026-09-27 | 2026-09-30 |
| BvRP-6 | Strategy convertible notes outstanding | $6,713.7M principal at 2026-06-30 | Strategy Q2 2026 10-Q, Note 6 (confirmed chat-side 2026-09-27) | https://www.sec.gov/Archives/edgar/data/1050446/000105044626000044/mstr-20260630.htm | 2026-09-27 | 2026-11-05 (Q3 10-Q) |
| BvRP-7 | Convertible-note stress point (paraphrased, not a quote) | ≈95% fall, ≈$4,000, where the bitcoin reserve = net debt ($3.0B as of 2026-07-27; notes due 2027–32). Supersedes the Q4 2025 figure of ≈$8,000 / 90% (Q4 2025 deck p.31). The "stay there for five years" wording was trade-press paraphrase and is not used. | Strategy Q2 2026 results presentation, 2026-07-30, p.11 | https://assets.contentstack.io/v3/assets/bltf8d808d9b8cebd37/blt112f20b1e4c24a84/6a6bcf5c1dd9934bc74056f4/strategy-q2-2026-financial-results-presentation_3.pdf | 2026-09-27 | 2026-11-05 (Q3 deck) |
| BvRP-8 | ~~STRC / SATA average daily dollar volume~~ **Removed 2026-09-27** (JM: nothing on the page depends on it) | Last value: STRC ≈$150M/day; SATA ≈$55M/day (20 sessions to 2026-09-25, close × volume) | Nasdaq historical data | https://www.nasdaq.com/market-activity/stocks/strc/historical | 2026-09-27 | — |
| BvRP-9 | St. Paul rent stabilization effect | Rental properties ≈−12% value; $1.57B aggregate loss to residential owners | Ahern & Giacoletti, NBER w30083, p.21 §V.D and p.22 Table VI | https://www.nber.org/system/files/working_papers/w30083/w30083.pdf | 2026-09-27 | 2027-03-27 |
| BvRP-10 | Seattle registered rental properties | 33,691 (2019) → 26,519 (2022), ≈−21% (our calculation); units at a record | Seattle City Auditor RRIO audit (Dec 2023), Exhibit 1 | https://www.seattle.gov/documents/departments/cityauditor/auditreports/rrioaudit.pdf | 2026-09-27 | 2027-03-27 |
| BvRP-11 | NYC Local Law 18 | 38,000+ listings on one platform (early 2023) → ≈3,000 registered STRs | NYC Office of Special Enforcement | https://www.nyc.gov/site/specialenforcement/news/new-report-sheds-fresh-light-on-how-local-law-18.page | 2026-09-27 | 2027-03-27 |
| BvRP-12 | California AB 1154 | JADU rentals must exceed 30 days; Ch. 507, Stats. 2025, in force 2026-01-01 | California Legislative Information | https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202520260AB1154 | 2026-09-27 | 2027-03-27 |
| BvRP-13 | New tenant protections since 2021 | 40+ states and 128 localities | NLIHC tenant-protections tracker (advocacy database; attributed on page) | https://nlihc.org/tenant-protections | 2026-09-27 | 2027-03-27 |
| BvRP-14 | SATA rate and schedule (`YIELD_RATES.sata`, 13.0, since PR 4d) | 13.00% (held for Oct 2026); dividends every business day since 2026-06-16, declared monthly | Strive 8-K filed 2026-09-14; EX-99.1 2026-05-14 | https://www.sec.gov/Archives/edgar/data/0001920406/000162828026061949/asst-20260914.htm | 2026-09-27 | 2026-10-27 |
| BvRP-15 | Strive BTC holdings; STRC in the SATA reserve; reserve months | 26,355 BTC and 505,000 STRC shares (fair value $49,748K), both as of 2026-09-18; reserve "18+ months of dividend coverage held in USD and Marketable Securities" (as of 2026-05-14) | Strive 8-K filed 2026-09-21 (holdings table); Strive investor presentation, SEC FWP 2026-05-14, slide 8 (reserve). History: the Mar 11, 2026 release (8-K Ex. 99.1) raised the reserve to 18 months as "12 months cash + 6 months STRC"; today's balances don't fit that split, so the page doesn't present it as current. **Not used:** the 8-K's "Cash and cash equivalents $229,600K" is total cash, not labelled as reserve, so no total reserve figure is shown. **Not confirmed at source:** chat-side research quotes Strive's treasury page (≈2026-09-25) as "18 months of liquid dividend coverage held in USD and marketable securities"; strive.com/treasury renders client-side and couldn't be read, and "18.7 months" appears only in secondary coverage. | https://www.sec.gov/Archives/edgar/data/0001920406/000162828026062806/asst-20260921.htm · https://www.sec.gov/Archives/edgar/data/0001920406/000095010326007179/dp246652_fwp.htm · https://www.sec.gov/Archives/edgar/data/1920406/000162828026016664/a991-strivexmarchsatadivid.htm | 2026-09-27 | 2026-10-27 |
| BvRP-16 | Return-of-capital treatment (page says "tax-deferred", never "tax-free"/"non-taxable") | Strategy: 100% of 2025 preferred distributions ROC, expected ≥10 yrs. Strive: **expectation for 2026** that 100% of SATA distributions are ROC "to the extent of a recipient shareholder's tax basis"; final treatment after year-end (1099-DIV). No claim about SATA's 2025. | Strategy EX-99.1 2026-02-02. Strive 8-K 2026-05-14 (confirmed verbatim: "The Company does not have any accumulated earnings and profits, and does not expect to generate current earnings and profits in the current year or the foreseeable future"; repeated in the 8-K of 2026-09-14). Strive Form 8937 for the March 2026 distribution (signed 2026-04-13; wording confirmed verbatim). **Not located at source:** the May 2026 and June 16–30, 2026 Forms 8937 (corrected form signed 2026-09-02) that chat-side research cites. Same wording is expected; the page cites the March form as the example. | https://www.sec.gov/Archives/edgar/data/1050446/000119312526033573/mstr-ex99_1.htm · https://www.sec.gov/Archives/edgar/data/0001920406/000162828026034804/asst-20260514.htm · https://s21.q4cdn.com/435279266/files/doc_news/2026/Mar/15/Form-8937-SATA-03-15-2026-VF-1.pdf | 2026-09-27 | 2027-02-15 (1099-DIV season) |
| BvRP-17 | YBTC | NAV return −42.63% (1 yr to 2026-06-30); weekly 19a-1 ROC estimates mostly 100%, one 0% (Dec 2025) | Roundhill fact sheet and 19a-1 notices | https://www.roundhillinvestments.com/etf/ybtc/ | 2026-09-27 | 2027-03-27 |
| BvRP-18 | Ledn Growth Account (CeFi paragraph; a row in the stablecoin-lending disclosure, marked not open to US residents). **Since PR 4d the calculator doesn't use it:** the slice is generic stablecoin lending at 4.0% (BvRP-28); it was the constant `0.05` | 5.00% up to 100,000 USDC, 6.00% on the excess; USDC/USDT only (BTC Growth Accounts ended 2025-07-01); **not available to US residents** (Terms §2, §13(c); eligibility tool: unavailable in all 50 states, DC and PR). Calculator uses 5% (a ≈$41K default slice sits in the lower tier); was 8%. The 6.5% / 8.5% read earlier were HTML placeholders overwritten by the page script. **Watch:** Ledn is moving US clients to Ledn US LLC from October 2026, so eligibility may change. | Ledn rates page (rendered 2026-09-27); Growth Account Terms; eligibility tool; help-center note on BTC accounts | https://www.ledn.io/legal/rates-terms · https://www.ledn.io/legal/growth-account-terms · https://help.ledn.io/hc/en-us/p/eligibility · https://help.ledn.io/hc/en-us/articles/28481809829655 | 2026-09-27 | 2026-10-27 (Ledn US LLC transition) |
| BvRP-19 | Housing vs equity returns and volatility | US housing 6.03% / US equities 8.39% real, 1891–2015 (Table A.2); 16-country excess-return SD 9.86% / 21.43% (Table 3) | Jordà et al., FRBSF WP 2017-25 | https://www.frbsf.org/wp-content/uploads/wp2017-25.pdf | 2026-09-27 | 2027-09-27 |
| BvRP-20 | SFR return ÷ volatility 1.14; expenses 36–52% (avg 40%) of gross yield | 1.14 = equal-weighted average across 30 cities, 1986–2014, of average total return ÷ its volatility, **no risk-free rate subtracted** (so not called a Sharpe ratio on the page). Returns nominal, unlevered, net of operating costs, before transaction costs and income tax; the authors caution survey data may understate volatility. The "S&P 0.52" comparator stays cut: not in the paper (traces to a secondary article with no stated method). | Demers & Eisfeldt, NBER WP 21804 (May 2021 revision), Table 2 and p.16 | https://www.nber.org/papers/w21804 | 2026-09-27 | 2027-09-27 |
| BvRP-21 | Operating expenses, single-unit rentals | ≈45% of rent collected ($6,194 / $13,836, 2020 data) | Census/HUD RHFS 2021 infographic (RHFS 2024 gives ≈44%; 1-unit pairing to be checked visually before switching) | https://www.census.gov/programs-surveys/rhfs.html | 2026-09-27 | 2027-03-27 |
| BvRP-22 | National rental vacancy | 7.3%, Q2 2026 | Census Housing Vacancy Survey (released 2026-07-28) | https://www.census.gov/housing/hvs/index.html | 2026-09-27 | 2027-03-27 |
| BvRP-23 | Sale costs (our estimate) and forced-sale discounts | Orderly ≈6–9% (≈5–5.5% commissions + ≈1% title/escrow + 0–2%+ transfer tax); discounts 3% bankruptcy, 5–7% death, 27% foreclosure | Campbell, Giglio & Pathak (AER 2011); Duarte & Zhang (SSRN 5279352, 2025) on post-settlement commissions; commission level from industry surveys | https://www.aeaweb.org/articles?id=10.1257/aer.101.5.2108 · https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5279352 | 2026-09-27 | 2027-03-27 |
| BvRP-24 | Mortgage-rate context (Path 2) | 49.9% of outstanding loans <4% (Q1 2026); 30-yr fixed 7.03% (2026-09-24); Prime 7.00% (2026-09-21); Bankrate HELOC avg 7.28% (2026-09-23; vendor survey); $607/mo interest on $100K at 7.28% | FHFA NMDB; Freddie Mac PMMS via FRED; FRED DPRIME; Bankrate | https://www.fhfa.gov/data/national-mortgage-database-nmdb · https://fred.stlouisfed.org/series/MORTGAGE30US · https://fred.stlouisfed.org/series/DPRIME | 2026-09-27 | 2027-03-27 |
| BvRP-25 | Airbnb host fees | Host-only 15.5% (most hosts); split fee 3% | Airbnb Help Center article 1857 | https://www.airbnb.com/help/article/1857 | 2026-09-27 | 2027-03-27 |
| BvRP-26 | Power Law figures in prose and the $500K table (stay at today's multiple) | Live: ≈29% a yr next 10 yrs, ≈19% the 10 after; $62,550 spot slice (15% of $417K since PR 4d; was $61,650 of $411K) → ≈$826K (at 2026-09-27) | Computed in-page from `shared/power-law-data.js` (`data-pl-*` spans, `bitcoin-vs-rental-property.js`) | (same as PL-1) | 2026-09-27 | (live) |
| BvRP-27 | Existing mortgage defaults (M8, PR 4d; `RENTAL_DEFAULTS` in `shared/real-estate-model.js`) | Balance **$200,000** per property: 40% of the $500K default value; the average outstanding US mortgage is 45.1% of its home's value by loan count (54.1% by balance). Rate **4.4%**: the average contract rate on outstanding US mortgages, 2026 Q1, by loan count and by balance; loans on rental properties usually cost more (stated on the page). Years left **20**: derived, a 30-year loan taken when the property was bought ten years ago (the page's "years already held" default); for scale, NMDB's average loan age is 79 months by count (59 by balance) and 83% of outstanding loans are 30-year fixed. Direction: a higher rate or balance lowers keep-rental; the all-mortgage average is below typical rental-property rates, so it leans slightly toward the house | FHFA National Mortgage Database, Outstanding Residential Mortgage Statistics (national, quarterly; series AVE_INTRATE, AVE_MTMLTV, AVE_AGE_LOAN, PCT_TERM_FRM_30), files released 2026-06-26 | https://www.fhfa.gov/data/nmdb | 2026-09-28 | with the next NMDB release (quarterly) |
| BvRP-28 | Stablecoin-lending slice and its disclosure (item 12, PR 4d; `YIELD_RATES` in `shared/real-estate-model.js`, one dated object) | Slice **4.0%**, ordinary income: the median of the four lending rates below (4.04%). Listed, as of September 2026: 3-month T-bill **4.08%** (FRED DTB3, 2026-09-24; the reference); Sky Savings Rate (sUSDS) **3.60%**, Aave v3 USDC (Ethereum) **3.63%**, Compound v3 USDC (Ethereum) **4.45%** (DefiLlama base APY, token rewards excluded, largest pool per asset, pulled 2026-09-28); Ledn Growth Account **5.00%**, not open to US residents (BvRP-18). US CeFi rates are not listed because they can't be checked from outside (Coinbase: in-account, Coinbase One members only; Nexo: "up to", tied to its own token). Direction: 4.0% is below the old 5%, toward the house | FRED; DefiLlama yields API; Ledn; Coinbase Help; Nexo (per `REAL_ESTATE_PAIR_PR4_SOURCES.md`, Item 12) | https://fred.stlouisfed.org/series/DTB3 · https://yields.llama.fi/pools · https://www.ledn.io/legal/rates-terms | 2026-09-28 | 2026-10-28 (monthly; MONTHLY_REFRESH_CHECKLIST §9.3a) |

**BvRP cuts (2026-09-27), recorded so they aren't reintroduced from an old draft:**
- Portland, ME "$500/unit, 40%": an industry-commissioned 4-building study, and the 40% was a rent gap, not a cash-flow drop.
- Tacoma I-1 delinquency "33%→54%" and "32% removed": a landlord-association survey with no n or method. The $10 late-fee cap was also repealed from 2026-01-01.
- "29 states and 51 localities": no source.
- Eviction "$3,500–$10,000+, 7–16 weeks": vendor blogs.
- "11.7% leveraged ROI": vendor marketing (Arrived via Property Scout 360). The "best rolling 20-yr windows, 4–5× leverage" description is unsupported.
- "7–9% after-friction": unsourced.
- "5.8%" effective tax: unsourced.
- "31 hrs/month": a UK survey.
- Waterfall bands, "50–63% / 36.8–50.4%" and the high-yield paradox: synthesis only, and the bands didn't sum.
- "19–33%" / "50%+" attrition: synthesis.
- STR "15–30% of GBR", management 25–40% and insurance ranges: no source.
- YBTC "74.7%" and "45–48%": unsourced; "0–96% ROC" was not found.
- CeFi "6.5–13.9%": the upper bound had no source.
- "Native bitcoin staking": bitcoin has no native staking.
- Demers & Eisfeldt comparator "S&P 0.52" and the rolling-window floors: not verified.

### the-bitcoin-horizon

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| BH-1 | Bitcoin volatility-compression data | various | Fidelity Digital Assets (in-page note) | https://www.fidelitydigitalassets.com/research-and-insights | 2026-05-02 | 2026-11-02 |

### shared comparator series

The three monthly series behind every bitcoin-vs-equities comparison the site makes at monthly grain — `/heatmap`, `/bitcoin-vs-the-stock-market`, `/the-gallery` (charts 7 / 8 / 10), `/the-bitcoin-horizon` §2 and the `/calculators` mini-tiles. `SP500_TR_DATA` and `NDQ_TR_DATA` live in `src/_includes/_pageassets/shared/tr-comparator-data.js`; `BTC_MONTHLY` in `shared/btc-monthly-data.js`. Two sampling conventions, on purpose: the equity series are **Day-28** (last trading day on or before the 28th), the bitcoin series is **month-end close**. They feed different computations and are never combined in one. Refresh procedure: `MONTHLY_REFRESH_CHECKLIST §1`.

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| EQ-1 | S&P 500 Total Return, Day-28 monthly, 2010-01 → latest | 200 rows | `^SP500TR` daily close | https://finance.yahoo.com/quote/%5ESP500TR/history/ | 2026-09-16 | 2027-03-16 |
| EQ-2 | NASDAQ-100 total return via QQQ dividend-adjusted close, rebased to NDX level 2010-01-28 | 200 rows | Invesco QQQ adjusted close (net of 0.20%) | https://finance.yahoo.com/quote/QQQ/history/ | 2026-09-16 | 2027-03-16 |
| BTC-M-1 | Bitcoin month-end close, 2011-01 → latest | 188 rows | Yahoo BTC-USD (2014-10 →), blockchain.info market-price (2011 → 2014-09) | https://finance.yahoo.com/quote/BTC-USD/history/ · https://www.blockchain.com/explorer/charts/market-price | 2026-09-16 | 2027-03-16 |

**Provenance note (2026-09-16).** Before these rows existed, the prior contents of both files were unregistered and unsourced. `tr-comparator-data.js` held, for both series, straight-line interpolations between annual endpoints — constant monthly increments every calendar year 2010–2026, with 2026 extrapolated — so multi-year returns were approximately right (equities understated by 3–5%) while the intra-year path was fictional. `btc-monthly-data.js` was hand-entered, with five recent months wrong by 10–32%, all high: 2025-10 carried the intraday all-time high rather than the month close, and 2026-01 → 2026-04 contradicted `PL_DATA`. Both were replaced with the sourced series above in one pass, and every published conclusion on the consumer pages was re-measured against the real data before the replacement shipped: the heatmap's and BvSM's conclusions hold (win rates move by under one point at every horizon; 100% wins at 7y and 10y stand; mean 7-year outperformance moves ~4%). The EQ-2 proxy is a known compromise: the NASDAQ-100 TR index itself (XNDX) is not freely served with history, and QQQ's adjusted close understates it by the fund's 0.20% expense ratio per year — a bias against bitcoin's comparator, not for it. Replace the proxy and update this row if a free XNDX history becomes available.

### the-bitcoin-retirement

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| BR-1 | Power Law coefficients (a, b) | a=1.6×10⁻¹⁷, b=5.77 | (same as PL-1) Porkopolis Economics: The Chart | https://www.porkopolis.io/thechart/ | 2026-05-07 | 2026-11-07 |
| BR-2 | Power Law floor multiplier | 0.42 × trend | (same as PL-1) Porkopolis Economics: The Chart | https://www.porkopolis.io/thechart/ | 2026-05-07 | 2026-11-07 |
| BR-3 | Power Law upper multiplier | 3.0 × trend | (same as PL-1) Porkopolis Economics: The Chart | https://www.porkopolis.io/thechart/ | 2026-05-07 | 2026-11-07 |
| BR-4 | Trinity Study (4% rule, 7% real return target) | Cooley, Hubbard, Walz 1998; Bengen 1994 | Bogleheads explainer (also primary papers) | https://www.bogleheads.org/wiki/Trinity_study | 2026-05-07 | 2026-11-07 |
| BR-5 | Live BTC price feed | live | CoinGecko public API | https://www.coingecko.com/ | 2026-05-07 | 2026-11-07 |
| BR-6 | Inflation presets (3.5% / 6.5% / 8% / Custom) | (canonical, sitewide) | (same as I-1, I-2, I-4 in canonical inflation rows) | n/a — canonical | 2026-05-07 | 2026-11-07 |
| BR-7 | Live BTC fallback price | Latest `PL_DATA` sample | Auto-fresh after each monthly refresh — no separately-maintained constant. Routed through the shared `fetchTodayPrice()` helper in `/_pageassets/shared/power-law-data.js`. | n/a — derived from BR-5 fallback path | 2026-05-28 | 2026-11-28 |

The Power Law constants (BR-1 through BR-3) duplicate the canonical PL-1 row; documented separately for cross-page traceability. Inflation presets (BR-6) are the canonical sitewide values from `STYLE_GUIDE.md §3.5`; no separate sourcing.

### disciplined-rebalancing

The Disciplined Rebalancing page applies the same Power Law channel as `/the-bitcoin-retirement` and `/bitcoin-vs-real-estate#projection`. Constants `PL_A`, `PL_B`, `PL_FLOOR`, `PL_CEIL` are copied locally from PL-1 / BR-1 to BR-3 (no separate citation rows needed). Historical price series (`PL_DATA`) is the canonical Power Law dataset, sourced via the shared module `/_pageassets/shared/power-law-data.js`.

### bitcoin-fixed-income

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| BFI-1 | Bitcoin trend-CAGR editorial figure (spectrum card + prose ×2) | ~28%, 10–15yr-forward basis | Derived from PL-1 coefficients via `trendCAGR(t,H)`; 10yr-fwd = 29.7%, 15yr-fwd = 26.8% at t=6,424 (2026-08-06); ~28% ≈ 12.7yr-fwd | (same as PL-1) https://www.porkopolis.io/thechart/ | 2026-08-06 | 2026-11-06 |

**BFI-1 (added 2026-08-06, `/the-bitcoin-hurdle-rate` build).** The `~28%` on the instrument-spectrum card and in two prose passages is **hardcoded static text** — the page's calculator computes scenario CAGRs live off the shared module (correct `PL_B`, no local exponent), but these three headline figures are not injected. Windowed to a "10–15-year-forward" basis in the hurdle-rate build so it names its window and reconciles with that page's live readouts (10yr 29.7% / 15yr 26.8% bracket 28%). Drift is slow and downward (a widening band absorbs it); the "declining" label and this as-of row track it. Not an exponent conflict with PL-1 — verified during the §2.3 reconciliation gate. Re-check the figure at PL-1's next audit; if the window band no longer brackets the stated 28%, restate it.

### the-bitcoin-hurdle-rate

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| HR-1 | Money-market cash preset (Company lens) | ~4.3% | US 3-month Treasury yield proxy (preset anchor; user-overridden) | https://fred.stlouisfed.org/series/DGS3MO | 2026-08-06 | 2026-11-06 |
| HR-2 | Savings-account preset (Personal lens) | ~4% | FDIC national deposit rate, savings (preset anchor; user-overridden) | https://www.fdic.gov/resources/bankers/national-rates/ | 2026-08-06 | 2026-11-06 |

**HR-1 / HR-2 (added 2026-08-06).** The two short-rate-sensitive presets on `/the-bitcoin-hurdle-rate` — approximate starting points the user immediately overrides (slider + numeric entry), labelled "~". Tracking lives in the **Next due** column above: re-check both at the quarterly audit and bump the display if the short-rate regime has moved materially. The page adds **zero** MONTHLY_REFRESH surface by design (the review-date column carries it — no monthly line). The other presets need no rows: WACC ~9% and "a strong project" 20% are illustrative anchors; S&P 500 long-run TR 10.86% reuses the R-1 family (via BvSM); mortgage ~6% and rental ~8% are long-run editorial anchors. Everything else on the page computes live from the shared Power Law module (`PL_A`/`PL_B`/`PL_FLOOR`/`plPrice`) — no rows.

### the-bitcoin-floor

The Bitcoin Floor computes everything on-page from the shared Power Law module
(`PL_A` / `PL_B` / `PL_FLOOR` / `plPrice` / `PL_DATA`, all inherited from PL-1)
with one exception, which is the row below.

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| FL-1 | Episode 24-month outcomes (`xt24`, `gap24` on the four approach cards) | 2010: 0.628× / 39% · 2015: 1.381× / 163% · 2022–23: 1.175× / 130% · 2026: open, none | `analysis/2026-08-20-power-law-floor.md` §2 — an in-repo analysis, not an external source | — | 2026-08-20 | **2026-11-20** |

**FL-1 — OUTCOME PROVENANCE, OPEN ITEM (raised 2026-09-02, JM, at the visit-definition
unification).** These four figures are the only numbers on the page that do not recompute
live from `PL_DATA`. They are carried from the analysis doc, and **a naive re-derivation
does not reproduce them.** Measured at the unification: interpolating price 730.5 days
after each episode's deepest close and taking `(xt24 − xtDeep) / (1 − xtDeep)` gives
2023 = 130% (matches), 2015a = 229% vs 228% (near), 2015b = 170% vs 163% (2.8% out on
`xt24`), and **2010 = 53% vs the published 39% — about 14pp out.** So the analysis used a
convention this repo does not currently record: a different anchor, a calendar +24 months
rather than 730.5 days, a nearest-sample read rather than interpolation, or daily data
predating the 12-day grid.

**Reconcile one of two ways, and do not let it evaporate:**
1. **Document the exact derivation** — the anchor, the date arithmetic and the sampling
   rule — such that it reproduces all four published figures, and add it to this row; or
2. **Re-derive and republish** with the method stated on-page and the changed figures
   attributed as a correction.

**Why it was not done at the unification:** the ruling that merged the 2015 episodes was
a grouping change, and re-deriving outcomes at the same time would have moved published
figures by an amount unattributable to the ruling. Every surviving figure is one the page
had already published, re-attributed — which is what kept the two changes separable, and
is why this is a clean open item rather than a defect. Full record:
`FLOOR_VISIT_DEFINITION_MINIREPORT.md`.

**Scope note.** The unification did not touch these values; it changed which card carries
which. The merged 2015 card took the September half's outcome because the outcome anchors
on the episode's deepest close and that is the September half's — so `1.753× / 228%` (the
August half's) is no longer published anywhere, and only three of the four values above
are on the page today.

### the-strc-mechanism — STRC daily close (automated)

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| STRC-1 | STRC official daily close | live (e.g. $94.35 @ 2026-08-10) | Yahoo Finance chart endpoint (keyless), last daily-close bar + its ET date | https://query1.finance.yahoo.com/v8/finance/chart/STRC?interval=1d&range=7d | 2026-08-10 | (automated) |

**STRC-1 (added 2026-08-10 — the site's first automated data source).** `/the-strc-mechanism`'s price is STRC's official daily close, refreshed by a GitHub Action (`.github/workflows/strc-daily-close.yml` → `scripts/update-strc-close.mjs`) into `src/_data/strcClose.json` on market weekdays after the US close. **Source change:** the originally-scoped **Stooq CSV** (`strc.us`) is **no longer usable keyless** — as of 2026-08-10 its `q/l/` and `q/d/l/` endpoints return a "page does not exist" / JavaScript anti-bot challenge respectively (verified by hand with a browser UA). Switched to **Yahoo Finance's keyless chart JSON**, which returns the daily-close series + timestamps and identifies the instrument (`shortName` "Strategy Inc - Variable Rate Se…", 52-wk 71.25–100.42 matching filings); `query2` host is the fallback. **Method:** last non-null element of `indicators.quote[0].close`, rounded to 2dp, dated by its `timestamp` in `America/New_York`; cross-checked against `meta.regularMarketPrice`. **Guards (in the script):** aborts (no commit, run goes red) on fetch/parse failure or a >25% day-over-day move (bad-data fuse → hand-verify); writes nothing when the value is unchanged (weekends/holidays). No API key, no secrets. If Yahoo ever blocks keyless access, candidates to evaluate next: Nasdaq's `api.nasdaq.com/api/quote/STRC/info`, or a keyed provider (would need a secret). The **other** STRC constants (rate, claim stack, reserve, holdings) stay manual on `MONTHLY_REFRESH §7.5` — they move on disclosures, not daily.

### bitcoin-escape-velocity

**Nothing on this page goes stale independently.** It carries **no page-local hardcoded market data** — no embedded price series, no snapshot constants, no dated figures in copy. Every number it shows is computed at render time from shared modules, so the monthly refresh has nothing to update here.

| # | Component | Source | Refreshed by |
|---|---|---|---|
| EV-1 | Power Law coefficients (a=1.6×10⁻¹⁷, b=5.77), floor/ceiling multiples | `shared/power-law-data.js` — see PL-1 | Inherited; audited on the-power-law's row |
| EV-2 | Monthly price record (`PL_DATA`) + `TODAY_PRICE` seed | `shared/power-law-data.js` | `MONTHLY_REFRESH_CHECKLIST` (shared module) |
| EV-3 | Live spot price (drives the gap-persists basis and the above-trend footnote) | `fetchTodayPrice()` → CoinGecko, session-cached, falls back to the latest `PL_DATA` sample | Live per page load; no manual step |
| EV-4 | Inflation presets, bitcoin growth model | `shared/modeling-assumptions.js` (STYLE_GUIDE §3.5 canonical) | Canonical; page subscribes live |
| EV-5 | Projection math (`daysSince` / `plPriceAtDate` / `dateForYear` / `projPriceForGrowth`, sell-to-cover loop) | Copied from `the-bitcoin-retirement.js` per the stress-test precedent | **Parity-guarded** — `window.evParityQA()` asserts EV and the flagship never disagree about whether a scenario escapes |

**Implication for the monthly refresh:** if `power-law-data.js` or the modeling-assumptions canonical changes, this page follows automatically — but **re-run `evParityQA()` on the live page after any change to the flagship's projection functions**, because EV holds a copy. The parity assertion is the tripwire; it is the only thing standing between a flagship engine edit and two pages quietly giving different answers to the same question.

### dashboard

**Nothing on this page goes stale independently** — every tile is live-computed from shared modules, which is the page's founding fence (`SITE_GUIDE §47`: zero new data sources, zero new refresh lines). It earns a row here anyway, because **published figures on the site's return-visit anchor changed without any data changing.**

| # | Component | Value | Basis | Source | Changed | Next due |
|---|---|---|---|---|---|---|
| DB-1 | Implied reversion rate tile — count, median, quickest | `6 completed episodes` · median `~141% over ~8.5 months` · quickest `~4.3 months` | **Episodes**, not samples — grouped by the site's 100-day independent-visit rule | `shared/reversion-durations.js`, live | 2026-09-05 | live; no manual step |

**DB-1 (2026-09-05, `fix-reversion-basis`) — a published-figure change with no data change behind it.** The tile previously reported the **sample** basis, and the count was the misleading part:

| | before (samples) | after (episodes) |
|---|---|---|
| count | 65 completed | **6 completed** |
| median | ~145% over ~9.1 months | ~141% over ~8.5 months |
| quickest | ~2.0 months | ~4.3 months |
| slowest | ~24 months, ~90%/yr | unchanged |

A long stretch contributes dozens of samples and exactly one episode, so *"65 completed"* read as a record about ten times deeper than it is. **Six is the number of independent things that have happened.** Full derivation, the before/after table and the reasoning: `REVERSION_BASIS_MINIREPORT.md`. Recorded in `SITE_GUIDE §47` as v3.1 and in `§41.1` for the Discount-or-Premium side, which now publishes **both** bases with the episode row leading.

**The structural half is the part that matters for future audits.** The tile carried a local **port** of `/discount-or-premium`'s `scanDurations`; that port is **retired**, and the Dashboard now reads `shared/reversion-durations.js` — the same scan `/discount-or-premium` and `/the-rundown` read. The port was correct when written and still allowed a divergence to sit unnoticed across three pages (the Rundown showing 6 episodes / 65 samples against the Dashboard's 7 / 70 — the open episode was the entire difference). **Three pages, one scan, one grouping rule**, so they can no longer drift by being tuned separately.

**What to check, and what not to.** These figures move with `TODAY_DAYS` by design and need no manual step. The tile's **N<3 branch is now reachable** (below ~0.40× it names the individual stretches instead of publishing a median) — a refresh flipping it into or out of that form is the thinness rule firing correctly, **not a finding**; see `MONTHLY_REFRESH_CHECKLIST §5.1a`. **A real finding is the three pages disagreeing** about the episode count or the completed/open split, which the shared scan now makes impossible unless something has broken. Compare them **in one page load** — clock drift across captures is indistinguishable from a regression, and has already cost one round of investigation.

---

---

## Architectural change log

Notes on data-flow changes from major restructure events. No new external citations introduced by these changes — recorded here so future audits know where shared constants and live-fetch consumers live across the page-script chain.

### Phase 4 restructure (2026-05-07) — commits `0b2d203`, `36c13a0`, `a89f873`

The forward (projection) calculator was migrated from `/the-power-law.html` (Tab 4) to `/bitcoin-vs-real-estate.html` (sub-toggle inside the Calculator tab). Power Law's Tab 4 was rewritten as "The Channel" — an interactive visualization, not a calculator. Data sources unchanged; only the home of the projection calculator changed.

| Constant / function | Previous home | New home | Status |
|---|---|---|---|
| `PL_A`, `PL_B`, `PL_FLOOR`, `PL_CEIL` | `the-power-law.js` only | `the-power-law.js` AND `bitcoin-vs-real-estate.js` | Duplicated (~4 lines each) |
| `GENESIS_TS` | `the-power-law.js` only | `the-power-law.js` AND `bitcoin-vs-real-estate.js` | Duplicated (~1 line each) |
| `plPrice(days)` | `the-power-law.js` only | `the-power-law.js` AND `bitcoin-vs-real-estate.js` | Duplicated (~1 line each) |
| `PL_DATA` | `the-power-law.js` only | `_pageassets/shared/power-law-data.js` (extracted later) | Now single-sourced |
| Live BTC spot fetch | Forward calculator only | BvRE projection + Channel status line | Two consumers now |

Power Law constants are also duplicated in `/the-bitcoin-retirement.js` and `/disciplined-rebalancing.js`. Total: 4 pages copy ~6 lines each. Whether to consolidate into a shared module is tracked in `TECH_DEBT.md`. Until then, each page is self-contained and the constants are stable.

The Channel page's prominent Porkopolis credit block is the canonical attribution; pages that *apply* the channel framework (BvRE projection, retirement, disciplined rebalancing) link forward to The Channel rather than re-stating attribution. Intended editorial pattern.

**Out-of-sample chart coefficient refit (commit `6604126`, 2026-05-07).** The "Early Data Predicts the Future" chart on Power Law Tab 1 was refit on the same day as the main Phase 4 commits, as a follow-up correction. The chart performs an in-browser least-squares regression on a training window of `PL_DATA` and projects forward; before the refit, the cutoff was end-of-2014 (slope **6.787**, dominated by the 2013 Mt. Gox rally on a small training sample), producing a ~4× over-projection by 2025. After the refit, the cutoff is end-of-2017 (slope **5.657**, OOS bias near zero, within 2% of the canonical Porkopolis coefficient `b = 5.77`).

| Constant | Before refit | After refit | Used by |
|---|---|---|---|
| `a` (out-of-sample chart only) | 1.5×10⁻²⁰ | 3.9×10⁻¹⁷ | Power Law Tab 1 OOS chart |
| `b` (out-of-sample chart only) | 6.787 | 5.657 | Power Law Tab 1 OOS chart |
| Canonical `PL_A` (sitewide) | 1.6×10⁻¹⁷ | unchanged | The Channel, BvRE projection, retirement, DR |
| Canonical `PL_B` (sitewide) | 5.77 | unchanged | The Channel, BvRE projection, retirement, DR |
| `PL_DATA` (historical price series) | unchanged | unchanged | All channel-applying pages |

The OOS chart is the only place on the site that *fits its own* coefficients; everywhere else uses the canonical Porkopolis values directly. No source data changed — only the training-window cutoff for the in-browser regression.

---

## Audit log

When auditing, log a brief note here per session — what was checked, what changed, what's deferred.

| Date | Auditor | Rows reviewed | Notes |
|---|---|---|---|
| 2026-05-02 | initial seed | all | Registry created. Modeling-assumption rows seeded from Stage 1 STYLE_GUIDE work; existing-page rows backfilled from on-site citations as found at this date. Half-Life's three preset rates (3.5/6.5/8) are derived from the canonical (rows I-1, I-2, I-4) rather than separate sources. |
| 2026-05-06 | Phase 3 ship | BR-1 through BR-7 | New rows seeded for the Bitcoin Retirement page launch. Power Law constants (BR-1 to BR-3) derived from canonical PL-1; documented separately for cross-page traceability. Trinity Study reference (BR-4) added as the calculator's foundational anchor for the 4% rule framing. CoinGecko (BR-5) used for live price; falls back to static value (BR-7) when API is unavailable. Inflation presets (BR-6) are the canonical sitewide values from `STYLE_GUIDE §3.5`. |
| 2026-05-07 | v1 final closing-out | BR-1 through BR-7 | All retirement-page rows re-verified at v1-final closing-out. No external data sources changed. Power Law assumption (BR-1, BR-2, BR-3) is now disclosed across five tooltips on the sustainability surface (commit `64ae655`); future Power-Law-using calculators should follow the same disclosure pattern. Trinity Study (BR-4) correctly hyperlinked to Bogleheads in the Question and Strategies essays. CoinGecko (BR-5) live feed continues to function; fallback (BR-7) tested during network-disabled mobile testing and rendered correctly. |
| 2026-05-07 | Phase 4 restructure | (architectural — no new external citations) | Forward calculator migrated from Power Law page to BvRE; Power Law's Tab 4 became The Channel. Architectural change log added above. Power Law constants now duplicated across `/the-power-law.js`, `/bitcoin-vs-real-estate.js`, `/the-bitcoin-retirement.js` (and `/disciplined-rebalancing.js` after Phase 3.5). Worth promoting to shared module when convenient. |
| 2026-09-13 | monthly refresh | (no registry rows due — next 2026-11-02) | Sep 2026 data pass. Verified the short-Treasury rate at **3.86%** (FRED `DTB3`, 2026-09-10) against the 4.0% held in `how-much-bitcoin.njk` / `var R = 0.04` — a 14bp move, inside `MONTHLY_REFRESH_CHECKLIST §3`'s ±50bp rule, so both the constant and its "June 2026" month string were deliberately left unchanged. |
| 2026-09-16 | comparator rebuild | EQ-1, EQ-2, BTC-M-1 (new) | Registered the three shared monthly series for the first time, on the day both files were replaced. Finding: `SP500_TR_DATA` / `NDQ_TR_DATA` were annual-endpoint interpolations (not monthly samples) and `BTC_MONTHLY` had five recent months 10–32% high — on the Horizon page's own chart the rolling 1-year CAGR ending 2026-02 showed +5% against −21% real. Rebuilt from `^SP500TR`, QQQ adjusted close (rebased) and BTC-USD month-end closes, all through 2026-08. Re-measured on the real data, the heatmap's and BvSM's published conclusions hold. Both charts had been frozen at 2026-05-28 (right edge set by the last `SP500_TR_DATA` row) and now extend. Hardcoded figures on the consumer pages were flagged for verification in the PR, not rewritten. |
| 2026-09-28 | PR 4e (real-estate retrospective) | RE-16–RE-20 (new); BvRE-1–BvRE-3 (scope notes) | Registered the retrospective's monthly series and checked every stored value against the raw FRED and Zillow files. **Findings, logged for their own PR (TECH_DEBT):** (1) `btcData` departs from the start year's average price for **2013** (732 against a daily average near 190), **2022** (19,657 against ~27,920) and **2025** (88,000, an April 2025 snapshot, against ~102,775 for the year); 2017's 4,348 is the mean of month-end closes, 9.6% above the daily average. After 4e the retrospective no longer reads `btcData` (RE-20); the BTC-per-house chart, the houses visual, the every-starting-year table's end prices and The Gallery's charts 3, 4 and 7 still do. (2) `homeData` differs from the current vintage of FRED `MSPUS` annual averages by up to +5% (2021 401,700 against 383,000; 2022 454,900 against 432,950; 2020 +2.7%), and **2025's 416,900 is not the 2025 average** (415,400, which RE-6 uses). The values may come from Census's annual table in an earlier vintage; the definition and vintage need settling. It sets the retrospective's start price, which scales both paths about alike. |
