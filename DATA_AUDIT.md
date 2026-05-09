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
| BR-7 | Live BTC fallback price | $108,000 | Manually set fallback when CoinGecko fetch fails; updated periodically | n/a — fallback only | 2026-05-07 | 2026-11-07 |

The Power Law constants (BR-1 through BR-3) duplicate the canonical PL-1 row; documented separately for cross-page traceability. Inflation presets (BR-6) are the canonical sitewide values from `STYLE_GUIDE.md §3.5`; no separate sourcing.

### disciplined-rebalancing

The Disciplined Rebalancing page applies the same Power Law channel as `/the-bitcoin-retirement` and `/bitcoin-vs-real-estate#calc-mode-projection`. Constants `PL_A`, `PL_B`, `PL_FLOOR`, `PL_CEIL` are copied locally from PL-1 / BR-1 to BR-3 (no separate citation rows needed). Historical price series (`PL_DATA`) is the canonical Power Law dataset, sourced via the shared module `/_pageassets/shared/power-law-data.js`.

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

---

## Audit log

When auditing, log a brief note here per session — what was checked, what changed, what's deferred.

| Date | Auditor | Rows reviewed | Notes |
|---|---|---|---|
| 2026-05-02 | initial seed | all | Registry created. Modeling-assumption rows seeded from Stage 1 STYLE_GUIDE work; existing-page rows backfilled from on-site citations as found at this date. Half-Life's three preset rates (3.5/6.5/8) are derived from the canonical (rows I-1, I-2, I-4) rather than separate sources. |
| 2026-05-06 | Phase 3 ship | BR-1 through BR-7 | New rows seeded for the Bitcoin Retirement page launch. Power Law constants (BR-1 to BR-3) derived from canonical PL-1; documented separately for cross-page traceability. Trinity Study reference (BR-4) added as the calculator's foundational anchor for the 4% rule framing. CoinGecko (BR-5) used for live price; falls back to static value (BR-7) when API is unavailable. Inflation presets (BR-6) are the canonical sitewide values from `STYLE_GUIDE §3.5`. |
| 2026-05-07 | v1 final closing-out | BR-1 through BR-7 | All retirement-page rows re-verified at v1-final closing-out. No external data sources changed. Power Law assumption (BR-1, BR-2, BR-3) is now disclosed across five tooltips on the sustainability surface (commit `64ae655`); future Power-Law-using calculators should follow the same disclosure pattern. Trinity Study (BR-4) correctly hyperlinked to Bogleheads in the Question and Strategies essays. CoinGecko (BR-5) live feed continues to function; fallback (BR-7) tested during network-disabled mobile testing and rendered correctly. |
| 2026-05-07 | Phase 4 restructure | (architectural — no new external citations) | Forward calculator migrated from Power Law page to BvRE; Power Law's Tab 4 became The Channel. Architectural change log added above. Power Law constants now duplicated across `/the-power-law.js`, `/bitcoin-vs-real-estate.js`, `/the-bitcoin-retirement.js` (and `/disciplined-rebalancing.js` after Phase 3.5). Worth promoting to shared module when convenient. |
