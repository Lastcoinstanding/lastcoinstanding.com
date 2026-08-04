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

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| RE-1 | Case-Shiller US National HPI, real terms, 1890–2024 | ~0.4% real | Robert Shiller online data | http://www.econ.yale.edu/~shiller/data.htm | 2026-05-02 | 2026-11-02 |
| RE-2 | Case-Shiller US National HPI, real terms, 2000–2024 | ~3.7% real | S&P CoreLogic Case-Shiller US National | https://www.spglobal.com/spdji/en/indices/indicators/sp-corelogic-case-shiller-us-national-home-price-nsa-index/ | 2026-05-02 | 2026-11-02 |

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

### what-daily-conviction-bought

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| WDCB-1 | The "$30/day since 2017" legend story | ~$86,370 in over ~7y10m to reach $1M (widely reported) | Benzinga / crypto.news coverage (reuses the Bitcoin Exit essay's verified figures) | (essay Sources block — `claude/THE_BITCOIN_EXIT_PUBLISHED.md`) | 2026-08-05 | 2027-08-05 |

**WDCB-1 (added 2026-08-05).** The page's *default* narrative — $30/day of bitcoin since Jan 2017 first crossing $1,000,000 — is the widely-reported legend. Registered per inclusion rule (2): it carries an explicit source attribution (Benzinga / crypto.news, as cited in the Bitcoin Exit essay). The page **recomputes** the story live rather than restating the reported figures, and its recompute matched the legend within rounding ($86,400 vs the reported ~$86,370; crossing 2024-11-19). **All computed values on the page derive from `PL_DATA`** via the same log-linear daily interpolation as `scripts/thirty-a-day-chart.ps1` — no separate citation rows are needed for the accumulated-BTC / value / drawdown figures; they inherit `PL_DATA`'s provenance (PL-2). **Exact coverage URLs live in the essay's Sources block** (project-only doc); confirm/attach them here at the next audit.

### the-melting-ice-cube

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| MIC-1 | Power Law coefficients | (same as PL-1) | Porkopolis Economics: The Chart | https://www.porkopolis.io/thechart/ | 2026-05-02 | 2026-11-02 |
| MIC-2 | Public treasury holdings (treasury cash positions) | various, as of 2024–2025 | Public corporate filings (in-page note) | n/a — sourced from filings, not single URL | 2026-05-02 | 2026-11-02 |

### bitcoin-vs-real-estate

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| BvRE-1 | Historical home prices 2014–2020 (median US) | various per year | Federal Reserve Economic Data | https://fred.stlouisfed.org/series/MSPUS | 2026-05-02 | 2026-11-02 |
| BvRE-2 | Historical 30-yr fixed mortgage rates 2014–2020 | various per year | FRED MORTGAGE30US | https://fred.stlouisfed.org/series/MORTGAGE30US | 2026-05-02 | 2026-11-02 |
| BvRE-3 | Historical bitcoin prices 2014–2020 | various per year | (same as PL-2) | https://www.blockchain.com/explorer | 2026-05-02 | 2026-11-02 |
| BvRE-4 | Global affordability time series — HK, Sydney, Vancouver, London, US (national), 2005–2024 | 20-year median-multiple series per market (see globalAffordabilityChart datasets in bitcoin-vs-real-estate.js) | Demographia International Housing Affordability, annual editions 2006–2025 | http://www.demographia.com/db-dhi-index.htm (older editions) + https://www.chapman.edu/communication/_files/Demographia-International-Housing-Affordability-2025-Edition.pdf (latest) | 2026-05-28 | 2027-05-28 |

**Provenance note for BvRE-4.** Each Demographia edition reports Q3 data for the prior calendar year — i.e., the 2025 edition (released May 2025) contains Q3 2024 figures, which is the most recent data point in the chart. The dataset was assembled by scraping the 20 annual PDFs into text, extracting the per-market median multiples via regex, and manually verifying every value against the source PDF (or, for the 2023 edition's UK figures and a handful of older-edition cells where layout parsing was unreliable, by re-running a targeted grep against the PDF and reading the line by hand). Hong Kong was not included in the survey before the 2011 edition (Q3 2010 data), so HK values for 2005–2009 are intentionally null and render as a gap in the chart. **Annual refresh cadence**: Demographia releases each May; update BvRE-4 within ~4 weeks of release. The new value appended is for `data_year = (publication_year - 1)`; older values are stable and do not require re-checking.

### the-bitcoin-horizon

| # | Component | Value | Source | URL | Last audited | Next due |
|---|---|---|---|---|---|---|
| BH-1 | Bitcoin volatility-compression data | various | Fidelity Digital Assets (in-page note) | https://www.fidelitydigitalassets.com/research-and-insights | 2026-05-02 | 2026-11-02 |

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
