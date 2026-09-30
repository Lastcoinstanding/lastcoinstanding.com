# Monthly Refresh Checklist — Last Coin Standing

A list of values, strings, and data points that go stale over time and need
periodic refresh. The bitcoin price is fetched live at page load (see "Live BTC
price fetch" near the end); everything else here is stored in the source, as
data series, dated constants and date strings, and goes stale unless someone
updates it. Running this checklist once a month keeps pages internally
consistent with the actual market state and the as-of dates the page presents
to the reader.

**§0 is the complete inventory**, by cadence: monthly, quarterly, semiannual,
annual and event-driven. Start there, and start each refresh by running
`python3 scripts/data-freshness.py`. The numbered sections below it hold the
method for each item.

This list will grow over time as the site adds pages with time-sensitive
content. When you add a new page that bakes in a data series, a dated figure or
an as-of date string, add its row to §0 (and a section if the method isn't
obvious) in the same commit.

---

## 0. Refresh inventory: everything that goes out of date, and when

_Added 2026-09-29 after a full-site audit (58 pages; the record is TECH_DEBT "Refresh audit 2026-09-29")._ The Is Bitcoin a Bubble? chart went six months without an update because no section listed it. This inventory is the complete list, so nothing depends on memory. Each row points to the section with the method. **When you add a page, a data series or a dated figure, add its row here in the same commit.**

**Start every refresh with the report:**

```bash
python3 scripts/data-freshness.py            # or: ... 2026-10-15 to run as if on that date
```

It reads every data series, dated block and dated string straight from the source and marks each one OK, DUE or OVERDUE against its cadence. It covers what can be checked mechanically. The rows below marked *(judgement)* are not in the report: prose that describes the present, legal status, and event-driven copy.

### 0.1 Monthly

| What | Where | Source | § |
|---|---|---|---|
| Power Law price series `PL_DATA` (also the live-price fallback) | `shared/power-law-data.js` | daily close | §1 |
| Equity comparators `SP500_TR_DATA`, `NDQ_TR_DATA` (Day-28 rows) | `shared/tr-comparator-data.js` | Yahoo `^SP500TR`, QQQ adjusted close | §1 |
| Bitcoin month-end closes `BTC_MONTHLY` | `shared/btc-monthly-data.js` | Yahoo BTC-USD | §1 |
| Values computed once from `PL_DATA` and stored: `TREND_RATIO_PERCENTILES`; Disciplined Rebalancing's percentile table; What Daily Conviction Bought's FAQ and meta figures; the hurdle-rate meta line; Allocation Sizing's "about 0.44× today" tooltip | several | recompute from `PL_DATA` | §9.8 |
| As-of callouts, captions and hand-typed callout values (Bitcoin vs. the Stock Market §1/§3 and its "Through August 2026" returns; the Horizon's "through August 2026") | several `.njk` | recompute | §3, §4 |
| Case-Shiller, Zillow rents and values | `shared/housing-monthly-data.js` | FRED, Zillow | §9.4 |
| Is Bitcoin a Bubble? weekly line `BTC_DATA_2014` | `not-a-bubble.js` | Yahoo, Sunday closes | §9.7 |
| Strategy at a glance (Fixed Income Tab II) | `bitcoin-fixed-income.njk` / `.js` | 8-K | §7 |
| The preferreds' rates (STRC, SATA): one file for Fixed Income, the rental page and The STRC Mechanism | `src/_data/preferredRates.json` | 8-K | §0.7 |
| Fixed Income beyond the card: the Tab II table, runway and reserve prose (Tab III is a dated record since 2026-09-30) | `bitcoin-fixed-income.njk` | 8-K, Strategy IR | §7.1 |
| `STRC_DATA`, the reserve's months-of-dividends figure, the episode decision | `the-strc-mechanism.js` / `.njk` | 8-K | §7.5 |
| STRC daily close (automatic; check the Action ran) | `src/_data/strcClose.json` | GitHub Action | §7.6 |
| `YIELD_RATES` and the rental page's dated rates | `shared/real-estate-model.js`, `bitcoin-vs-rental-property.njk` | FRED, DefiLlama, issuers | §9.3a |
| Metcalfe ETF-era figures | `bitcoin-and-metcalfes-law.njk` | ETF trackers, Coin Metrics | §9 |
| Regulatory status lines (CLARITY Act etc.) on Bull & Bear and Bitcoin as Collateral *(judgement)* | `.njk` | Congress.gov, press | §2, §3 |
| How Much Bitcoin? risk-free rate (move it at ±50bp) | `how-much-bitcoin.njk` / `.js` | FRED `DTB3` | §3 |
| Bitcoin as Collateral loan table and its "as of" | `bitcoin-as-collateral.njk` | lender pages | §3, §8.6 |
| Cross-page agreement: Strategy's BTC count, the STRC rate, reserve figures | BFI, STRC page, rental page | 8-K | §0.7 |
| The live price loads | `/dashboard` | — | §5 step 7 |
| Product-forward OG cards | `scripts/build-og-images.py` | — | §6 |
| Search Console sweep; GA4 notes | — | — | §9.5, §9.6 |
| Claude project mirror | project docs | repo | §10 |

### 0.2 Quarterly

| What | Where | § |
|---|---|---|
| Institutional guidance citations (How Much Bitcoin?) | `how-much-bitcoin.njk` | §8 |
| Copy-tell drift re-grep | site-wide | §8.5 |
| Bitcoin as Collateral: the record | `bitcoin-as-collateral.njk` | §8.6 |
| Metcalfe pinned weekly series `METCALFE_SERIES` | `bitcoin-and-metcalfes-law-data.js` | §9 |
| The Doubling Ladder series (`DEVIATION`, `MONTHLY_HIGH`, rung crossings) and the checksum figures in its text | `the-doubling-ladder.js` / `.njk` | §9.9 |
| Rates, fees and product terms quoted in prose (lenders, cards, mortgages, savings rates, the rental page's reference rates) *(judgement)* | several | §9.10 |
| Market-structure facts quoted in prose (custody shares, ETF counts, holdings, pool concentration, national debt) *(judgement)* | several | §9.10 |

### 0.3 Semiannual

| What | Where | § |
|---|---|---|
| Legal and tax status statements, plus dated deadlines (next: the broker-relief notice ends **2026-12-31**; review Spend and Replace by early December) *(judgement)* | several | §9.11 |
| DATA_AUDIT rows whose "Next due" has arrived (the report lists them, and those due within 30 days as SOON) | `DATA_AUDIT.md` | the row |
| Real-estate price, rent and cost defaults | `bitcoin-vs-real-estate.*`, `bitcoin-vs-rental-property.*` | §9.3 |

### 0.4 Annual

| When | What | § |
|---|---|---|
| January | Annual data (`homeData`, `btcData`, `csData`, `incomeData`, `mortgageRates`) and every year-bounded figure, range, input minimum, axis label and age string (the full list is in §11) | §11 |
| February | Strategy's return-of-capital classification for the prior year | §7.5 step 6 |
| May | Demographia affordability (both copies) | Annual: Demographia |
| November | Power Law exponent survey, with the PL-1 recheck | §1 |

### 0.5 Event-driven

When one of these happens, run its list in §12: a **new all-time high**; the **bear market ends** (a cycle low is confirmed); the **halving** (next about April 2028); a **Strategy capital event** or STRC rate change; **legislation** passing or failing (CLARITY, PARITY, Lummis); a **standing claim** ("never", "every", "no window") that the latest data could falsify, checked at every refresh.

### 0.6 Nothing to refresh (computed at load)

The Dashboard, The Rundown, Discount or Premium, How Much Cash, Wait or Deploy Now, The Bitcoin Floor (its QA is §5.1), the Heatmap cells, the Calculators tiles, and the calculators on Compare Retirement Plans, The Bitcoin Retirement, Escape Velocity, the Stress Test, What Daily Conviction Bought, The Bitcoin Hurdle Rate, Allocation Sizing and Disciplined Rebalancing all compute from the shared series and the live price. Their prose, presets and year bounds are listed above where they can go stale. Start Here, Synthesis, Work With Me and Bitcoin Defined carry nothing dated.

### 0.7 Cross-page agreement (monthly)

The same fact appears on several pages; after each refresh they must agree:

- **Strategy's bitcoin count:** `BTC_HELD` (`bitcoin-fixed-income.js`) and the Tab II card, `STRC_DATA.btcHoldings`, and the rental page's treasury line and sources list. (On 2026-09-29 they read 845,050, 843,775 and 846,000.)
- **The STRC dividend rate:** one place since 2026-09-30, **`src/_data/preferredRates.json`** (`strc.ratePct`, `schedule`, `source`, and the file's `asOf` / `asOfLabel`; SATA beside it). Bitcoin Fixed Income's prose, tables, tax example (computed at build time by `src/_data/preferredTax.js`) and calculator, the rental page's `YIELD_RATES.strc`, and The STRC Mechanism's `STRC_DATA.rateAnnualPct` all read it (`components/preferred-rates.njk` injects it as `window.PREFERRED_RATES`). A change also needs: a new `rateHistory` row on The STRC Mechanism (§7.5), the rental page's STRC tooltip (by hand), and DATA_AUDIT BvRP-5.
- **Strategy's USD reserve and dividend bill:** `STRC_DATA.usdReserveB`, Fixed Income Tab III, the rental page's sources.
- **Standing modelling figures quoted in prose:** the dollar's purchasing-power half-life and M2 growth (The Half-Life, The Fixed Pie, The Bitcoin Migration, What Money Has to Be, Money Trees' `data.json`) should use one set of numbers (TECH_DEBT "Refresh audit 2026-09-29" lists the current disagreement).

---

## Standing practice: keep the chat-side doc cache in sync

- **Re-sync the Claude project's copies of the repo docs so the chat-side cache tracks repo truth.** The drafting chat works from project snapshots of these docs; when they drift from the committed versions, ideas get re-derived or duplicated and instructions reference stale state. The full procedure — trigger, doc set, steps, and naming hazards — is **§10 (Claude project mirror refresh)**; this note is the standing reminder (added 2026-07-30; procedure moved to §10 2026-08-02).

---

## Per-commit: Recent Updates strip on the homepage

The most frequent maintenance task on this list — not monthly. Every
user-facing commit should add a new entry to the top of
`src/_data/updates.json`. The homepage's Recent Updates strip
(between the hero and the insight carousel) reads from this file and
is the visible signal that the site is actively maintained. Keeping
it current is part of the editorial discipline, not a periodic task.

### What counts as user-facing

A change a reader could plausibly notice on a page they visit:
new chart or calculator field, relabeled scenario, new tooltip, new
section or page, new exploration, materially improved phrasing on a
visible element, fixed visible bug (e.g. wrong number shown).

### What does NOT count

Refactors, bug fixes for issues that weren't visibly broken to
readers, internal renames, build-system / config / dependency
changes, doc updates (DATA_AUDIT, SITE_GUIDE, TECH_DEBT,
STYLE_GUIDE, this file), JS scoping fixes that don't change
observable behavior, type-only fixes, monthly PL_DATA refreshes
(implicit — already covered by §1 below). When in doubt, ask:
*would a returning reader notice this on the page?* If no, skip
the entry; the journal in git history is enough.

### Entry format

Add to the **top** of the array (newest first):

```json
{
  "date": "2026-05-30",
  "display": "5/30/26",
  "page": "/some-page.html",
  "summary": "One-line description of what changed (≤140 chars)"
}
```

- `date` — ISO `YYYY-MM-DD`. Reserved for machine sort if we ever
  add it; not currently used for rendering.
- `display` — `m/d/yy` US format as shown in the strip. Keep
  consistent across all entries (single source: this format).
- `page` — deep link to the page the entry relates to. Pick the
  most relevant single page when a commit touches several. Use the
  full path with leading slash (e.g. `/bitcoin-vs-real-estate.html`),
  not the bare slug.
- `summary` — one declarative sentence in past or active tense
  ("Added X", "Clarified Y", "Fixed Z"). No leading dash or bullet.
  Cap at ~140 chars so the row fits two lines on desktop without
  truncation. Lead with the page name when it's not obvious from
  context, e.g. "Bitcoin vs. Real Estate calculator: …".

### Batching

One PR, one entry typically. If a single PR spans several unrelated
user-facing changes, add a single entry that batches them ("Bitcoin
vs. Real Estate: scenario clarifications, Real/Nominal toggle, and
? tooltips") rather than three near-identical lines. Reader-time,
not commit-history, is the audience.

### Retention

No expiration. The scroller in the strip handles arbitrary length;
older entries scroll out of the default 3-row view but remain
accessible. We do not prune. If the file ever crosses ~50 entries,
reconsider truncation — but not before.

### Sanity-check after committing

Build, then confirm the strip picks up the new row at the top:

```bash
npm run build && \
  grep -A2 'class="update-row"' _site/index.html | head -6
```

The first match should be the new entry. The strip itself is in
`src/index.njk` (search "updates-strip"); the CSS in
`src/_includes/_pageassets/index.css`.

---

## 1. Power Law canonical data — `src/_includes/_pageassets/shared/power-law-data.js`

The shared module is the single source of truth for the Power Law model
constants and the historical price series. Update both on each refresh.

### TODAY_DAYS and TODAY_PRICE — no longer monthly-refreshed

Both anchors now live in `shared/power-law-data.js` and self-update at page
load. **You do not need to touch them on the monthly refresh.**

| Constant | What it is | How it's set now |
|---|---|---|
| `TODAY_DAYS` | Days since the Bitcoin Genesis Block (3 Jan 2009) | Computed at load: `Math.floor((Date.now() / 1000 - GENESIS_TS) / 86400)` |
| `TODAY_PRICE` | Most recent USD BTC price | Seeded to the latest `PL_DATA` sample, then overwritten by `fetchTodayPrice()` (live spot from Coinbase, else Kraken, mempool.space or CoinGecko — SITE_GUIDE §40.2 — with the latest sample as the dated fallback) |

The only thing the monthly refresh now does for "today" is keep the
fallback fresh — and that happens automatically when you append a new
`PL_DATA` sample (below), since the fallback IS the latest sample.

### PL_DATA — the historical price series

Append new monthly samples to the trailing end of the `PL_DATA` array.
Format: `[days_since_genesis, price_usd]`. One sample per month is the
right cadence; daily samples produce a heavier file with no editorial gain.

When you add the sample for the current month, also verify the as-of
caption on the BvSM Power Law chart still reads accurately (see §3).

**Staleness guard (added 2026-07).** `shared/power-law-data.js` warns at load if the
latest `PL_DATA` sample is more than **45 days** behind today (one missed monthly
refresh + slack). It is **console-only, once per load, never user-visible**, and reads:
`[power-law-data] PL_DATA is N days stale (last sample YYYY-MM-DD). Run
MONTHLY_REFRESH_CHECKLIST §1.` If you see it in the console, the fix is this section —
append the current month's sample. A correct refresh silences it.

> **Why this refresh matters most when the network is down.** `fetchTodayPrice()`
> seeds and falls back to the **latest `PL_DATA` sample**. On a normal load the
> live spot (Coinbase first, then Kraken, mempool.space, CoinGecko) overwrites it
> within a second, so a stale seed is invisible. But when no source answers (a
> network or ad-blocker that blocks them all; on 2026-09-29 a fault at CoinGecko,
> then the only source, blocked keyless requests for most of a day and took the
> whole site to the fallback until the other sources were added) the site shows
> this fallback — labelled
> with its date, **"as of Sep 12"**, never "live" (the 2026-07 honesty fix, dated
> 2026-09-29). The date makes a stale refresh visible to readers: a fallback that
> reads "as of Jul 31" in late September says plainly that the series is behind.
> **A stale monthly refresh therefore degrades the fallback path first and
> worst:** in July 2026 the fallback sat ~$10K below spot because the series ended
> in April. Keeping this sample current is what keeps the fallback honest *and*
> close. Append at least the current month every refresh; if you can only source
> one price, source today's.

### Comparator series — `shared/tr-comparator-data.js` and `shared/btc-monthly-data.js`

Three more series to append each month, alongside `PL_DATA`. Registered as
`DATA_AUDIT` EQ-1 / EQ-2 / BTC-M-1 on 2026-09-16, the day both files were
replaced: until then the equity series were straight-line interpolations
between annual endpoints, `BTC_MONTHLY` was hand-entered with five wrong recent
months, and neither file was in this procedure — their headers pointed at a
"§5" that had long since become "Verification after refresh". This subsection
is what those headers now point to.

| Series | File | Sampling | Source |
|---|---|---|---|
| `SP500_TR_DATA` | `tr-comparator-data.js` | **Day-28**: `^SP500TR` close on the last trading day on or before the 28th | Yahoo Finance `^SP500TR` history |
| `NDQ_TR_DATA` | `tr-comparator-data.js` | **Day-28**: QQQ dividend-adjusted close, rebased so 2010-01-28 = 1886.70 (the NASDAQ-100 level that day). Net of the fund's 0.20% fee — a conservative bias | Yahoo Finance `QQQ` history, *Adj Close* column |
| `BTC_MONTHLY` | `btc-monthly-data.js` | **Month-end**: last daily close of the calendar month (UTC) | Yahoo Finance `BTC-USD` history |

**Two sampling conventions — never mix them.** The equity series are Day-28
because the heatmap and BvSM interpolate between samples; the bitcoin series is
month-end because the Horizon and Gallery rolling-CAGR computations key on
`YYYY-MM`. A month-end value in the equity series, or a Day-28 value in
`BTC_MONTHLY`, is a silent error — both would parse and both would be wrong.

**Appending, one row per series per month:**

1. `SP500_TR_DATA` — `["YYYY-MM-28", close]`, the `^SP500TR` close on or
   before the 28th. The row is always dated the 28th even when the sample is
   the 26th or 27th; consumers never assume an exact day.
2. `NDQ_TR_DATA` — same date rule, but **append by ratio, not by level**:
   Yahoo restates QQQ's *entire* adjusted-close history at every distribution,
   so a fresh pull will not match the committed levels. Take the new month's
   and the previous month's adjusted closes *from the same pull* and append
   `previous committed row × (new adj close ÷ previous adj close)`. Every
   ratio between two dates is what the pages use; the level is cosmetic.
3. `BTC_MONTHLY` — `["YYYY-MM", close]`, the last daily close of the month.
   Sanity check against `PL_DATA`'s nearest sample: a gap beyond ordinary
   daily movement (10%+) is a finding, not a rounding difference — that is
   exactly how the 2026 errors were caught.
4. Bump the row counts and "through" months in each file's header comment.

**The right edge of two charts depends on this.** The heatmap and the BvSM
wealth chart take their **end date from the last `SP500_TR_DATA` row**, not
from `PL_DATA` or today's date. A missed append here freezes both charts at
the last equity sample regardless of how fresh everything else is — they sat
at 2026-05-28 from May to September 2026 for exactly this reason. If either
chart's right edge is behind the current month, this is the section.

### Annual: Power Law exponent survey — external pairs (piggyback the PL-1 recheck, due 2026-11-02)

The Tab 1 exponent survey (Power Law v2, item b) plots competing coefficient
sets from external sources. At the **PL-1 coefficient audit (DATA_AUDIT, next
due 2026-11-02)**, re-verify these against their live sources in the same pass —
they were taken from the v2 build prompt + in-repo records at ship, not freshly
fetched, and the sites are JS-rendered dashboards that move:

- **PL-4 BitcoinPower.law** — `a=10⁻¹⁶·⁴⁹³ (≈3.2×10⁻¹⁷), b=5.68` — https://bitcoinpower.law/
- **PL-5 bitcoinretirement.net** — `a=1.0117×10⁻¹⁷, b=5.82` — https://bitcoinretirement.net/
- **PL-6 b1m.io / Fred Krueger** — `b=5.566` (a not published) — https://b1m.io/

If a source has refit, update the `PAIRS` array in `the-power-law.js` (exponent
survey IIFE) and the matching DATA_AUDIT row. This is **annual**, not monthly —
listed here because the PL-1 audit is the natural carrier. The canonical
`PL_A`/`PL_B` stay pinned regardless; the survey is presentation-only.

## 2. Page-level TODAY constants — none remaining

**Per-cycle (event-driven, not monthly) — Bull & Bear Cycles status framing.** `src/_includes/_pageassets/bull-and-bear-cycles.js` hard-codes the `CYCLES` table of *documented daily-close* peak/trough extremes (register figures, not live-computed) and treats **2025 (peak $126,198, Oct 6 2025) as the ongoing bear**. The live status, table, and overlay all compute off that peak. Two triggers change the framing and need a manual edit: (a) **a new all-time high above $126,198** — the 2025 entry is no longer a bear; add the resolved 2025 trough and open a new ongoing cycle; (b) **the 2025 trough resolving** (a confirmed bottom) — fill `troughDate`/`trough`/`ddPct`/`recovery` for the 2025 row and flip `ongoing` off. Everything else (drawdown-from-peak, days-since-peak, rank, volatility) is computed live from the shared series and needs no edit.

*Three things on this page carry review flags:*
- **Live-status state copy + thresholds (event-driven).** The panel is a Power-Law-anchored state machine (`renderLive` in the page JS) covering deep-bear / recovery / near-ATH / new-ATH / extended-above-trend, driven by `fromPeak` and the price/trend `ratio` (thresholds `ST_EXTENDED`/`ST_DEEP`/`ST_RECOVERY`/`ST_NEWHIGH`, documented inline). It self-updates for price, but when Bitcoin first enters a regime the page hasn't been seen in (first new-ATH after this build, first sustained extension above trend), **verify the correct state fires and its copy reads accurately**, and tune the thresholds if needed.
- **CLARITY Act / regulatory paragraph (time-sensitive).** In "The pattern → Unproven," the copy states the CLARITY Act passed the U.S. House (July 2025) and cleared Senate Banking (May 2026) but is **not law "as of mid-2026,"** and that the SEC + CFTC jointly classified Bitcoin a digital commodity (March 2026). **Recheck this status at each monthly refresh** (still pending? passed? failed?) and update the "as of mid-2026" wording.
- **Point-in-time bear figures (snapshot data).** Figures like Galaxy's cost-basis-43.7%-of-ATH and reflexive-floor numbers, VanEck/Fidelity CAGR figures, and the analyst bottom-estimate clusters are as-of snapshots. Refresh or generalise them when the cycle resolves; do not present a stale snapshot as current.

**Annual (not monthly) — Risks to Bitcoin time-anchored facts.** `src/risks-to-bitcoin.njk` opens with "Bitcoin is seventeen years old," "As of 2026," and a claim that bitcoin holds the overwhelming majority of proof-of-work hash power. Update the age and year each January, and re-confirm the PoW-dominance claim against current data (it has been true and widening, but verify). This is a yearly task, flagged at launch (SITE_GUIDE §28).


Historically a few pages kept their own `TODAY_DAYS`/`TODAY_PRICE` copies
that needed lockstep updates. As of 2026-05-28 those copies have been
removed; every page that anchors to "today" now reads the shared globals
from `power-law-data.js`, so cross-page disagreement is no longer possible
by construction.

If a future page introduces a local copy, surface it here and prefer
deletion in favor of the shared globals — the cross-page consistency
guarantee depends on a single source.

**`/the-rundown` adds ZERO items after v2 — re-confirmed 2026-09-05.** The
page's own §1 fence is that it adds nothing to this checklist, and v2 grew it
by a great deal (reader inputs, an intent router, ten snacks, a live standfirst,
a state-aware position module) without breaking that. Verified rather than
assumed, by scanning the template and the page script for baked figures:

- **The inputs are session or device state**, never content. The retirement
  year, target income and chosen question are the reader's; the stack is
  session-only and stored nowhere. None of it is authored copy, so none of it
  can go stale.
- **Every snack computes at render time** from the shared modules
  (`power-law-data`, `channel-entries`, `ladder-advantage`,
  `reversion-durations`, `return-window`, `retirement-engine`). Nothing is
  transcribed from another page — the §1 "echo, not a copy" rule is what keeps
  this true, and it is why a figure moving on a source page moves here for free.
- **The dated standfirst is generated, not written.** It prints the client date
  and the live multiple on load (`STYLE_GUIDE §10.9`), so it is self-updating
  by construction — the opposite of the BvSM as-of callouts, which are
  hand-edited and *do* carry a line in §3.
- **The only literals in the template are definitional constants** — `0.42×`,
  `1.00×`, the `1%` graze band, the `20%` drawdown threshold. Each changes by a
  published act, not by a data refresh. The one static tooltip figure that had
  crept in was removed on 2026-09-05 under `STYLE_GUIDE §10.8`.
- **The OG card is brand-forward and carries no figure** (`OG_SPEC_THE_RUNDOWN.md`),
  so it does not enter §6's regeneration list either.

The A3 timeline agreement check in §5.1 is the page's **only** appearance in
this document, and it is a confirmation step on someone else's edit rather than
a refresh task of its own.

Sanity-grep to confirm no copies have crept back in:

```bash
grep -rn "^[^/]*\bvar (TODAY_DAYS|TODAY_PRICE)" src/_includes/_pageassets/
# Expected: only the declarations in shared/power-law-data.js
```

## 3. As-of date strings in callouts and chart captions

Hardcoded date strings that appear in callout boxes and chart sub-captions.
These tell the reader the data freshness of the page they are reading;
stale strings undermine the editorial discipline of the page.

Grep across the repo to find every instance:

```bash
grep -rni "as of\|through mid-\|through late-\|through early-\|through [a-z]* 20[0-9][0-9]" src/*.njk
```

Case-insensitive on purpose: the case-sensitive version of this grep missed
"Through August 2026" on Bitcoin vs. the Stock Market (found 2026-09-29).
`scripts/data-freshness.py` lists every dated string with its age, which is the
quicker way to see which ones are due. Bitcoin vs. the Stock Market's §1 and §3
callouts also carry **hand-typed values** (the multiple, the floor and trend
prices): recompute those, don't just re-date them.

Known patterns to expect:

- **As-of callout boxes** — uppercase label `AS OF [MONTH] [YEAR]` above
  the body text. Used on BvSM §1 (Power Law context) and §3 (forward
  projection context).
- **Chart freshness captions** — sentence-case `through mid-[Month]` or
  `through [Month]` beneath a chart. Used to indicate the trailing edge
  of the plotted data.
- **In-prose date references** — phrases like *"in May 2026"* or
  *"as of [Q] [Year]"* that anchor the prose to a specific moment.
  Update these to match the current month.

Update every instance to the current month-year. Bump even the in-prose
references if they would otherwise read as historical when they describe
the present.

**How Much Bitcoin? — risk-free rate as-of.** `src/how-much-bitcoin.njk` carries
"Risk-free rate held at **4.0%** (short Treasury yield, June 2026)" and
`src/_includes/_pageassets/how-much-bitcoin.js` carries the matching
`var R = 0.04`. Update BOTH together when short rates move materially
(±50bp); the month string updates whenever the rate does. The Power Law
preset inputs need no refresh — they compute live from the shared globals.

**Bitcoin as Collateral — the "as of August 2026" strings and the $100 table.**
`src/bitcoin-as-collateral.njk` carries two coupled things that stale together
and must move together:

1. The Gap tab's `Figures as of August 2026.` line, and the same tab's
   `at the Senate floor as of August 2026` CLARITY Act status.
2. The **$100-of-collateral table** it labels — the bitcoin loan row
   (`$40–60` / `≈9–14% APR`), the mortgage `≈6.6%`, the Reg T margin
   `≈5–8% (tiered)`, the repo `≈0.5%` haircut, and India's 75% LTV cap.
   The margin band is **best-commonly-available, matching the repo row's basis** — the
   "(tiered)" parenthetical is load-bearing, because small retail balances pay 10–11%
   base under $25K and the band would otherwise read as universal.

The loan-market rows are the fastest-staling numbers on the page and the page
says so in print, which means a stale month string here is a broken promise
rather than cosmetic drift. The **2026 Q3 row of the rate & LTV series** in The
Practice tab quotes the same LTV and rate ranges — if the table moves and the
series row does not, the page contradicts itself in two tabs. Check both, always.

```bash
grep -n "as of August 2026\|as of \[Month\]" src/bitcoin-as-collateral.njk
```

## 4. Conditional disclosures and percentile markers

Pages that compute and display a *current* state value — e.g., *"bitcoin
is currently 0.59× trend (41% below)"* — typically derive this from
`TODAY_DAYS` and `TODAY_PRICE` at page-render or page-load time. Once §1
and §2 above are updated correctly, these should refresh automatically.

After updating constants, spot-check the live page to verify the derived
values read correctly:

- BvSM §1 — *"As of [Month]"* callout with multiple-of-trend value
- BvSM §3 — *"As of [Month]"* callout with forward-projection anchor
- BvSM page header — any in-prose current-state references
- BAYB §1 — *"As of [Month]"* callout below the CAGR-vs-rates chart with
  trend CAGR (~46% currently), realized CAGR (~13% currently), and
  trend-multiple gap clause. Self-computing from PL_DATA's last sample
  at page load — refresh confirmation is *"the date in the callout
  matches the current month."*

If a derived value reads wrong, the most likely cause is a per-page TODAY
constant that wasn't updated in lockstep with the shared module.

## 5. Verification after refresh

Quick post-refresh checks to confirm everything's coherent:

1. **Grep for any remaining "old month" string** — easy to miss one.
   `grep -rn "[Pp]rior_month_name" src/` should return no matches.
2. **Load BvSM live** — verify the §1 Power Law chart shows the "you
   are here" pulse at the actual current price level, the as-of callouts
   read with the current month, the chart caption shows the right
   trailing date, and the §3 forward projection anchor is correct.
3. **Load BAYB live** — verify the §1 CAGR-vs-rates chart's as-of
   callout date matches the current month, the trend CAGR value reads
   in the 40–50% range (gradually decreasing as bitcoin's day-count
   grows), and the realized CAGR value matches the trailing-4-year
   computation against the new PL_DATA sample.
4. **Load Power Law live** — same checks against this page since it
   shares the model.
5. **Cross-check pages** — Bitcoin Retirement, Disciplined Rebalancing,
   BvRE, and any future page that uses the shared Power Law model
   should all show the same "you are here" position.
6. **Load The Bitcoin Floor live and read the console** — see §5.1. This one
   is not cosmetic: it is the only check here that can tell you the historical
   record itself has changed shape.
7. **Confirm the live price loads** — open `/dashboard`: the price tile should
   read **"Today (live)"** and name its source ("Live price from Coinbase, …").
   If it reads "Price as of …", no live source answered: check the console and
   whether a source is failing or has changed its terms (on 2026-09-29 a fault
   at CoinGecko blocked keyless requests for most of a day). The sources and their order are
   `LCS_PRICE_SOURCES` in `shared/power-law-data.js` (SITE_GUIDE §40.2).

### 5.1 The Bitcoin Floor — `[floor-qa]` after a PL_DATA refresh

`/the-bitcoin-floor` logs a single line to the console on every load:

```
[floor-qa] pass — parity fixture …, 4 episodes verified against the series.
```

The episode half of that assertion compares the page's four hand-authored
approach cards against `computeEpisodes()`, which derives them live from
`PL_DATA` under the unified visit definition (within 1% of the floor or below,
>100-day gap starts a new episode — the page's method note states it, and The
Rundown echoes it). A refresh can therefore turn this red, and **what the
failure means depends on which assertion broke.**

**An `open` failure is the tripwire working, not a regression.**

```
episode 2026 open false ≠ true
```

means the July 2026 approach **has closed** — the new samples put price back
outside the band, so the episode now has an "after" and, in time, an outcome.
The page is correctly refusing to keep showing a card that says *no outcome
yet* about an episode that has one. Do this, in order:

1. Set `open: false` on the `2026` entry in `EPISODES`.
2. Fill in `to`, `samples`, `spanDays` and `bracketDays` from the failure text
   and the derivation (`computeEpisodes()` returns all four).
3. `xt24` / `gap24` stay `null` until **24 months after the episode's deepest
   close** have actually elapsed — a closed episode with no outcome is a
   legitimate state for up to two years. Do not estimate one. **The parity
   check enforces this in both directions, measured on the series rather than
   the clock** (corrected 2026-09-13 — until then this step claimed an
   enforcement the code did not have: `[floor-qa]` failed *any* closed episode
   without a `gap24`, so steps 3 and 6 could not both be satisfied). The window
   has arrived when the last `PL_DATA` sample sits at least `OUTCOME_WINDOW_D`
   (730.5 days) past `deepestOn`; before that a filled-in outcome fails the
   check, and after it a missing one does. `samples` and `bracketDays` are
   asserted too (also added 2026-09-13; neither was checked before). When the
   window arrives, derive the outcome **by the FL-1 method in `DATA_AUDIT.md`**
   — that row is an open item precisely because the published outcomes do not
   reproduce by naive interpolation.
4. Rewrite the card body: it currently opens *"the only one on this page with
   no outcome"*, which becomes false the moment step 1 lands.
5. Update the dependents the same commit changes them in every time — the FAQ,
   the section lede's *"two out of two"*, the *"third is still running"* clause,
   the reversion stats' exclusion note, and the tripwire paragraph. Grep
   `two out of two` and `still open` to find them.
6. Reload; the line must read `pass` again.

*Fired for the first time at the 2026-09-13 refresh: the July 2026 approach
closed (`bracketDays` 78; `xt24` / `gap24` due July 2028). Steps 4–5 describe
the copy as it stood then, since rewritten. The next `open` failure belongs to
an episode that does not exist yet, so expect an `episode count` failure first
— and treat it as the page event described below, not a number to bump.*

**Any other episode failure is a real finding.** A changed `from`, `to`,
`belowPct` or `spanDays` on a *closed* episode means the historical series moved
underneath a published card — investigate the data before touching the card.
An `episode count` failure means a **new approach has begun**, which is a page
event worth its own commit and its own card, not a number to bump.

**The Rundown's A3 module echoes this same set.** It computes its own timeline
from the same rule, so it follows automatically — but its copy claims *"same
rule, same episodes, same count"*, so if you edit the Floor cards, load
`/the-rundown` and confirm the timeline agrees before you close the refresh.

### 5.1a The Dashboard's reversion tile changing shape is AUTOMATIC, not a finding

Added 2026-09-05, alongside the Floor note above, because the two look alike
and only one of them wants your attention.

Since the tile moved to the **episode basis** (`SITE_GUIDE §47` v3.1) its N<3
branch is reachable: below about **0.40×** there are fewer than three completed
episodes at that depth, and the tile **stops publishing a median and a spread
and names the individual stretches instead** — *"the longer of the 2 completed
stretches on record — 5 mo and 20 mo. Too few to read a median from, so they
are named rather than averaged."*

**That is the thinness rule firing correctly.** A refresh that moves price
deeper, or that adds samples changing an episode's grouping, can flip the tile
into or out of that form with no code change and nothing to fix. Do not open an
investigation, and do not "restore" the median — a median over two episodes is
a statistic with the honesty removed, which is the whole reason the branch
exists.

**What WOULD be a finding, and the difference is worth holding.** The Dashboard,
`/discount-or-premium` and `/the-rundown` all read one scan
(`shared/reversion-durations.js`), so they cannot disagree about the count
unless something is wrong. If a refresh leaves them stating **different episode
counts or different completed/open splits**, that is a real defect — the local
port that used to allow it is retired, so a divergence now means the shared
module or its consumers have broken, not that two pages drifted.

**Check them in ONE page load if you check at all.** Every figure here derives
from `TODAY_DAYS`, which advances with the clock; captures taken minutes apart
differ by drift that is indistinguishable from a regression, and that has
already cost one round of investigation (`NEW_PAGE_CHECKLIST §11`).

### 5.1b The parity FIXTURE half of `[floor-qa]` — fix the anchor, never the constants

Added 2026-09-13, the day it first fired. `[floor-qa]` has a second half that
§5.1 does not cover: `floorParityQA()` re-grades the fixed entry set to the
published analysis's endpoint and asserts **63.8 / 65.1** (full set, n=26) and
**60.5 / 61.9** (modern set, n=20) ± 0.1pp. Until 2026-09-13 it computed that
endpoint from `PL_DATA`'s *newest* sample — which was the analysis's date only
on the day the constants were captured — so the first append after the analysis
moved the endpoint 43 days and +22.6% and realized read **69.28 against 63.8**,
with the constants right all along. It now anchors to
`ANALYSIS_PARITY.measuredOn` (2026-07-31), located in `PL_DATA` by exact date.

After a refresh, a `median realized` / `median trend` / `entry count` failure
from the fixture therefore means one of three things, and none of them is
"bump the constant":

- the anchor sample is missing or renumbered — its own failure line names the
  date (`parity fixture anchor 2026-07-31 is no longer in PL_DATA`);
- the historical series was rewritten under the anchor (a §1 edit to samples
  before 2026-08-01, not an append);
- `gradeTo()` or the entry rule (`entrySet()`, `MODERN_FROM`) changed.

**Fix the anchor or investigate the data. Never re-pin the four constants to
this month's numbers** — that converts a regression test into a snapshot and
adds a re-pinning chore to every refresh, which is the trap the moving endpoint
already was, one month later. The four figures reach the page through the
constants (`flParityRead`, the honesty-endpoint copy) as a measurement dated
2026-07-31, which is exactly what they are; a fixture failure is a broken test,
not a published error.

## 6. OG image regeneration (product-forward cards)

The 2026-05-17 OG rollout introduced **product-forward OG cards** that
embed live chart screenshots in their composition (STYLE_GUIDE §6.15.2).
Five cards in this family will visibly drift from current data after a
monthly refresh and should be regenerated:

| OG card file | Live visual embedded |
|---|---|
| `og-heatmap.jpg` | full heatmap grid, all entry months to today |
| `og-bitcoin-vs-the-stock-market.jpg` | the §2 wealth-curve chart |
| `og-the-bitcoin-retirement.jpg` | the projection chart with current-state annotations |
| `og-calculators.jpg` | the featured-row mini-renderers (which themselves embed live data) |
| `og-compare-retirement-plans-v2.jpg` | the paired balance curves for Plan A and Plan B (added 2026-08-26; bumped to `-v2` the same day after the copy review changed the page title and cut the legend to two entries) |

Each card embeds `weeklyBtc` / `PL_DATA` / projection state, so each monthly
refresh advances the visible window by one month and changes the embedded
values. The homepage (`og-image.jpg`) was migrated to the brand-forward
family on 2026-05-17 — its glyph is static atmospheric artwork with no data
dependency, so it is excluded from this regeneration step.

**Regeneration is one command:**

```bash
npm run build-ogs       # or: python3 scripts/build-og-images.py
```

The script visits each page in headless Chromium, clones or screenshots
the live visual, composes the editorial chrome, downsamples to 1280×720,
and writes the five updated JPGs to the repo root. Re-commit alongside
the monthly refresh commit (or as an immediate follow-up); the same
filenames are reused so no head-file or `.eleventy.js` changes are
needed.

**Brand-forward OG cards** (STYLE_GUIDE §6.15.1 — Power Law, BvRE,
WMHTB, Half-Life, Money Trees, Synthesis, Migration, Trilemma, etc.)
do NOT need this. Their composition is conceptual / atmospheric and
has no data dependency. Leave them alone during refresh.

**Dashboard OG card (`og-dashboard.jpg`) — a manual check, not a script regen.**
The card bakes in a *position multiple* (currently **0.42×**) and its zone word,
which drift as price moves — but it is not produced by the product-forward script
above (it came from the drafting chat, `SITE_GUIDE §47`). Each refresh: eyeball the
baked multiple against live `/dashboard`. **If the multiple has moved materially or
the zone word has changed** (e.g. floor → below trend), request a regenerated card
from the drafting chat, re-commit at the repo root, and re-verify
`curl -I https://lastcoinstanding.com/og-dashboard.jpg` returns `image/jpeg`. If the
position is essentially unchanged, leave it.

**Verification after regeneration:**

```bash
curl -I https://lastcoinstanding.com/og-heatmap.jpg
```

Must return `HTTP 200` with `Content-Type: image/jpeg`. Then validate
the social card preview via metatags.io or a draft tweet. X/Facebook
will cache the previous version; first new share triggers re-scrape, or
use [Facebook's debugger](https://developers.facebook.com/tools/debug/)
to force a fresh fetch.

## 7. Strategy (MSTR) snapshot values — Bitcoin Fixed Income, Tab II

The "Strategy at a glance" card on Tab II shows four snapshot fields plus one truly-live field. The treasury USD value updates live (BTC count &times; shared `TODAY_PRICE`) and doesn't need a manual refresh, but the four underlying snapshots and the "Reading right now" insight prose do.

For each value, verify against the source listed and update in the BFI files as needed.

| Field | Where it lives | Source to verify against |
|---|---|---|
| **BTC held** | `src/bitcoin-fixed-income.njk` (the `845,050` figure) AND `src/_includes/_pageassets/bitcoin-fixed-income.js` (`var BTC_HELD = 845050`) | The latest Strategy 8-K (primary). Cross-check CoinGecko's `/api/v3/companies/public_treasury/bitcoin` (keyless; the Strategy entry has `symbol: "MSTR.US"`; out for most of 2026-09-29 by a CoinGecko fault, working again 2026-09-30), bitcointreasuries.net or Strategy IR. |
| **mNAV** | `.njk` (`~0.8&amp;times;`) | SaylorTracker.com headline mNAV figure. Or compute: (MSTR price &times; shares outstanding) &divide; (BTC count &times; BTC price). |
| **Shares outstanding** | `.njk` (`~384M`) | Latest 10-Q "Diluted shares outstanding" or Yahoo Finance MSTR Statistics page. Basic, all classes. |
| **ATM issuance** | `.njk` (`Active` value cell + sub-text) | Latest 10-Q ATM disclosures + 8-K announcements for new facilities. Phrase as `Active` or `Paused` with a brief structural note. |
| **Reading right now insight prose** | `.njk` `.sg-insight-text` paragraph | Rewrite when mNAV crosses ~1.0&times; (issuance accretive vs dilutive boundary) or ATM status changes (Active &harr; Paused). Stable otherwise. |
| **As-of date** | `.njk` footer (`Snapshot as of September 2026`) | Update to the current month/year whenever any other field is refreshed. |

**Critical**: the two BTC count locations on this page (the visible cell text in `.njk` AND the `BTC_HELD` constant in `.js`) MUST stay in sync. Otherwise the displayed BTC count and the live USD value will drift apart.

**There is a THIRD location off this page** (found 2026-09-13, when it had drifted to a different figure again): `src/bitcoin-vs-rental-property.njk` states the treasury in prose (“Strategy currently holds **N BTC** as of …”) and repeats it in the sources list at the foot of the page, alongside the USD Reserve figure. Grep the BTC count sitewide rather than trusting this list — `grep -rn "84[0-9],[0-9]\{3\}" src/` — and fix every hit in the same edit.

**`/bitcoin-vs-rental-property` dated figures (added 2026-09-27; DATA_AUDIT BvRP-1–8, 14–15, 18).** Refresh these with the Strategy block, from EDGAR, and update the as-of dates in the body, the Methodology list and DATA_AUDIT in the same edit:
- Strategy BTC holdings, USD Reserve, and the published "Annual interest + preferred dividends" from the latest MSTR Investor Briefing (SEC FWP filing). When it changes, recompute the three coverage tiles: holdings × $100K / $50K / $30K ÷ that figure.
- The convertible-note stress point (paraphrased from the latest quarterly results presentation; currently Q2 2026, p.11). Update it when the Q3 deck lands.
- STRC rate and schedule. **The rate lives in `src/_data/preferredRates.json` (§0.7, since 2026-09-30)**, which `YIELD_RATES.strc` in `src/_includes/_pageassets/shared/real-estate-model.js` reads (its literal is only the fallback); see §9.3a. The calculator, the Path 4 label, the slider hint and the $500K example's rate cells all read it. By hand, only the STRC tooltip in `src/bitcoin-vs-rental-property.njk` ("Paying 12.00% annualized…").
- STRC's next rate announcement: none by 2026-09-30 11:00 PT (12.00% held since July); check at each refresh (DATA_AUDIT BvRP-5).
- **Verify after any rate change:** open either page with `?qa` and run `await rePairQA.all()` in the console. The hashes will change; that is expected. The identity checks must still pass. Record the new ones in the refresh commit.
- Convertible notes outstanding.
- SATA rate and schedule; Strive BTC holdings and the STRC shares in its reserve.
- SATA's rate is `preferredRates.json` `sata.ratePct` (§0.7), read by `YIELD_RATES.sata`; by hand, only the SATA tooltip.
- Monthly until the Ledn US LLC transition settles (from October 2026), then semiannually: the Ledn Growth Account rates (rendered page, not the HTML placeholders) and whether US residents are eligible. Since PR 4d the calculator doesn't use Ledn (the slice is generic stablecoin lending); Ledn is a row in `YIELD_RATES.verifiable` (§9.3a) and an example in the CeFi prose.

If the values haven't materially changed (BTC count moved &lt;1%, mNAV moved &lt;0.1&times;, ATM status unchanged, insight prose still accurate), the only required update is the as-of date.

## 7.1. Bitcoin Fixed Income beyond the Tab II card (MONTHLY, from 2026-09-29)

§7 covers the "Strategy at a glance" card only. The rest of the page quotes the same company's figures in about a dozen other places, and on 2026-09-29 they had drifted: Tab III still read June 6 and contradicted the card (it said the ATM was paused, cash ~$900M; the card said Active, ~0.8× mNAV and the reserve was $5.04B), and the page presented STRC at 11.5% after the rate had moved to 12%. Refresh these with §7, from the same filings, in the same commit. Line numbers are as of 2026-09-29.

- ~~**Tab III "Where we are now"**~~ **Became a dated record on 2026-09-30 (JM's ruling): "Where things stood on June 6, 2026", not refreshed, pointing to The STRC Mechanism for current figures. Leave it as it is.** Was (`bitcoin-fixed-income.njk` ~484–517): It is dated ("As of Friday, June 6, 2026. This snapshot is refreshed monthly") and carries the bitcoin price and its distance from the high, STRC's price and implied yield, SATA's price and rate, the mNAV reading, cash and months of runway, dividend arrears, ATM status and the month's actions. Rewrite it from the latest 8-K and check the weekday matches the date (June 6, 2026 was a Saturday). `scripts/data-freshness.py` reads this date.
- **Every STRC rate on the page** now comes from `src/_data/preferredRates.json` (§0.7, 2026-09-30); nothing to edit here by hand except the payment-frequency row in the Tab II table (njk ~219) when the schedule changes. Was: the card "11.5–13%" (njk ~87), the table's "Current dividend rate" (~218), the prose at ~160, 172, 245, 373, 388–389 and 773, and `PATHS` in `bitcoin-fixed-income.js` (~76–80; the path buttons are at njk ~604–607). They must equal `YIELD_RATES.strc` and `STRC_DATA.rateAnnualPct` (§0.7). Check the payment frequency wording (monthly or semi-monthly) at ~160, 219 and 235 at the same time.
- **The Tab II capital-stack table** (njk ~218–227, 243): $7.98B, ~$35.6B, 2.93×, ~44 years, $44–62B, ~$1.08B, 843,738 BTC, and Strive's count.
- **"As of Q1 2026" capital structure** (njk ~285–361): move to the latest 10-Q when it lands.
- **Reserve, runway and dividend-bill prose** (The Mechanism's "The cash reserve" card; The Risks §3 and §4): updated 2026-09-30 to the $5.04B reserve (2026-09-20), the $1.70B annual bill and September's mNAV below 1.0×. Refresh with the rental page's Strategy block (DATA_AUDIT BvRP-2, BvRP-3) and the Tab II card.
- **Present-tense state statements** (njk ~476, 785 "ATM channel has frozen", 795 "has not" crossed 1.0×): rewrite whenever the state they describe changes.

The page's path reference rates (Treasury 4.3%, investment grade 5.5%, M2 6.5%, trend CAGR ~28%; njk ~72–116, 146, 383–390, 773) move slowly; check them quarterly under §9.10.

## 7.5. The STRC Mechanism — the `STRC_DATA` block (`/the-strc-mechanism.html`)

This page is **deliberately episodic** (design doc `STRC_BELOW_PAR_DESIGN.md` §7; aging-policy comment at the top of `src/the-strc-mechanism.njk`). It examines a live episode — STRC trading below its $100 par — and the monthly refresh does more than update constants: it **decides whether the episode is still live**.

All dated constants live in **one object**, `STRC_DATA`, at the top of `src/_includes/_pageassets/the-strc-mechanism.js`. The price, effective yield, and the three coverage ratios recompute live from bitcoin spot; everything else is dated and refreshed here.

Each month:

1. **Refresh `STRC_DATA`** from the latest 8-Ks / press releases (primary sources, not aggregators):
   - `asOf` — set to the refresh date. This drives every "as of" badge on the page.
   - `price` — **AUTOMATED, do NOT edit by hand.** STRC's official daily close is refreshed by the `strc-daily-close` GitHub Action into `src/_data/strcClose.json` each market day (see §7.6 and `DATA_AUDIT` STRC-1). The `STRC_DATA.price` constant is only the fallback if the data file is ever absent; leave it.
   - `rateAnnualPct` + append any new `rateHistory` row (one row per change; the latest gets the "latest" badge automatically).
   - `priorMonthVWAP` — **populate this.** While `null`, the bracket dial honestly shows "populate at monthly refresh"; once set, the dial computes framework-recommended vs board-did vs posture.
   - `sharesOutstanding` — from the latest 8-K (net of buybacks). The page derives STRC notional from `sharesOutstanding × par` (single source of truth) and cross-checks the filed `claimStack.strcNotionalB`; keep both current so the console reconciliation gap stays small.
   - `claimStack` (converts, STRF, STRC notional), `btcHoldings`, `usdReserveB` (**the USD reserve**), `authRemaining`, and **operating cash flow** if/when it is displayed in the gauge — from the latest balance-sheet filing. These are the fuel-gauge constants and each visibly inherits the on-page "as of" badge, so refresh them **together** and bump `asOf` in the same edit; a stale reserve or op-cashflow figure is the drift JM flagged.
   - Append rows to `buybackLog`, `supplyLog`, `fuelLog` for any new disclosed action (append-only; newest last).
   - **The months-of-dividends figure is typed, not computed** (corrected 2026-09-29; this list used to say `usdReserveB` drives it). "≈ 25 months" appears in `the-strc-mechanism.js` (~56, 349, 351) and the page text (njk ~377, 383), and `RESERVE_IMPLIED_TOTAL_BILL_B` divides the reserve by that same 25 (js ~137). Updating the reserve alone therefore makes the "total preferred bill" grow with the reserve, which is wrong. When the reserve changes, take the annual bill from the filing, recompute months = reserve ÷ (bill ÷ 12), and update the divisor and every "25 months" together. (At the $5.04B reserve of 20 September 2026 and the $1.703B annual interest-plus-dividend bill of 23 August, it is about 35 months; preferred dividends alone would give more.)
2. **Re-verify the rate** and the dividend mechanics against the 424B5/CoD if anything changed (rate-setting mechanics are load-bearing for the rate lever).
3. **Re-run the build-verify reconciliation** (design §5): confirm `sharesOutstanding × $100 ≈ strcNotionalB`; recompute the STRC dividend bill from float × rate (do NOT inherit any "$1.2B"/"$1.8B" figure); confirm anything not independently reconciled still carries a visible `verify` badge (currently: the reserve-implied total preferred bill, and the company BTC-breakeven-ARR figure). The console logs the notional gap, the bills, and the coverage breakevens on load — glance at them.
4. **Decide the episode state** (design §7). The page's own description of the episode is typed into the intro (njk ~20 "persistent 12% discount", ~24 "recently traded below par", ~28 "13.9%"): check it against the latest close in `src/_data/strcClose.json` ($99.10 on 2026-09-28) whichever way you decide.
   - **Ongoing** → the live numbers carry it; leave the nav entry and this block in place.
   - **Resolved** (par regained, or a dividend action taken) → convert the page to a **post-mortem**, **retire the `explorations.json` entry** (nav sunset — reachability reverts to the parent + related links), and mark this block "resolved, post-mortem" here.
5. **GSC glance** — confirm `/the-strc-mechanism` is still indexed (indexed-count didn't drop); the URL is in `sitemap.xml` at weekly changefreq. (The old `/strc-below-par` 301s to it via `_redirects`.)
6. **ROC classification note** (STRC mechanism card + BFI tax paragraph): carries "calendar-2025, 100%, announced Feb 2 2026" — Strategy publishes each year's classification ~early Feb; when the next announcement lands, update both pages' year references and re-verify the IR link. Until then, confirm the claim still reads as a dated historical fact, not a standing promise.

`SOFR_FLOOR_PCT` (the illustrative floor for the "cut" dividend scenario in the lens) is a labelled stand-in, not a sourced constant — bump it toward the current 1-month term SOFR level when you refresh.

## 7.6. STRC daily-close Action — silent-death check (`strc-daily-close`)

The STRC price is now maintained by the site's first CI automation (SITE_GUIDE §42; `DATA_AUDIT` STRC-1). It is designed to fail **loudly** (a red run on fetch failure or the >25% fuse) rather than commit bad data — but a silently-broken source (Yahoo returning stale-but-valid data) or a disabled schedule would go unnoticed. **Each monthly refresh, glance at the Action's recent runs:**

- **GitHub → Actions → "STRC daily close"** (or `gh run list --workflow=strc-daily-close.yml`). Confirm it has run on recent market days and that runs are green (or that a red run has a known cause). GitHub disables `schedule` triggers after ~60 days of repo inactivity — if the whole repo has gone quiet, re-enable / re-dispatch once.
- Cross-check the on-page **"official daily close · as of <date>"** against the true last close; if the date is stale by more than a few market days, the Action has silently stopped — investigate the source (Yahoo keyless access can change) and fall back to a hand-updated `src/_data/strcClose.json` until fixed. Alternative sources are noted in `DATA_AUDIT` STRC-1.
- **Before concluding the Action has stalled, check `git log origin/main -- src/_data/strcClose.json`** (added 2026-09-13, after exactly this false alarm): a local branch behind origin looks identical to a dead scheduler — the bot's commits land on `origin/main` and the local file stays stale until you fast-forward. Also, the early-September runs each recorded the close of the market day *before* the run date, so a one-market-day lag on the page is the Action's normal behaviour, not staleness.

## 8. Institutional guidance citations — How Much Bitcoin? (quarterly is fine)

The gap ladder and §B cite live institutional positions. Quarterly, verify:

- BlackRock's 1–2% guidance and its Target Allocation model-portfolio
  implementation are still current; update the ladder rung and §G if the
  range moves.
- Fidelity's "Getting Off Zero" (Mar 2026) remains the latest edition; if a
  successor publishes, re-verify the 9.4% / 65% / 10% trio at the primary
  before swapping numbers.
- GUARD: never reintroduce the retracted "Fidelity 84% continuous Kelly"
  figure (corpus hallucination — see SITE_GUIDE §26 register).

## 8.5. Copy-tell drift re-grep — reader-facing §5 tells (quarterly is fine)

STYLE_GUIDE §5 (show, don't claim) stops *new* imports of self-describing tells
at authoring time, but nothing catches drift between full sweeps — and the
2026-08-08 site-wide sweep found ~70 reader-facing breaches against an entry
that had expected "most hits in older explorations." The tell had spread into
current pages, homepage cards, FAQ answers, and `/calculators` tile taglines.
So, quarterly (piggyback any refresh), re-grep reader-facing copy:

```
grep -rniE 'honest|candid|transparent|canonical' src --include=*.njk --include=*.json --include=*-head.html
```

- **FIX** only when the site describes *its own* copy/analysis/answer as
  honest/candid/transparent, or uses data-sense "canonical" in reader copy
  (→ "reference"). Deletion beats substitution; when a sentence needs a word,
  describe the action or content, never swap in another self-claim.
- **Leave** subject-matter uses ("an honest ledger", "transparent on-chain
  holdings"), first-person/quoted voice, archetypal "canonical" ("the canonical
  sensory image", "the canonical exhibit"), and all code comments /
  `<link rel="canonical">` / CSS-token names.
- New pages and new homepage/tile copy since the last check are the likely
  carriers. Full method + the last sweep's carve-outs: the de-tell entry in
  `PAGE_IDEAS_BACKLOG.md`.

## 8.6. Bitcoin as Collateral — the record (QUARTERLY, `/bitcoin-as-collateral.html`)

The page promises the reader, in print, that "the tripwires in The Gap and the
three series below are refreshed quarterly." That promise is the whole
instrument: a page arguing bitcoin is maturing as collateral earns nothing if
its own evidence goes stale. This is the one recurring obligation the page
carries, and it is **quarterly, not monthly** — the monthly `as of` strings and
$100-table figures are §3 above.

Each quarter, in The Practice tab:

- **The rate & LTV series** — add a new quarter row. Record the LTV range, the
  rate range, **and the lender composition**, because the series is only
  comparable if it compares like quotes; a compression caused by a different mix
  of lenders is not the maturity signal the page claims to be watching. Convert
  the current quarter's placeholder row into a real reading and add the next
  placeholder.
- **The collateral panel** — refresh the named publishing sources (lending-protocol
  BTC visible on-chain, disclosed lender loan books, attested treasury holdings).
  Read each **both ways**, coins and dollars. Anything that cannot be observed
  stays listed as exactly that; do not substitute an estimate to fill the gap.
- **The event ledger** — sweep for any at-scale liquidation since the last check,
  including at LTVs that had been considered safe. Note the standing
  "2023 – present: no major bitcoin lender has failed" row is a *scope* claim
  about credit-system failures, not exchange-margin cascades — if it stops being
  true, that row is the most consequential edit on the page.

And in The Gap tab:

- **Tripwire status lines** — Basel haircut schedule, UCC Art. 12 adoption map,
  and especially the **CLARITY Act** status (as shipped: passed the House 2025,
  at the Senate floor as of August 2026; cloture filed 8 Aug 2026, next
  procedural step 15 Sep 2026). A moved tripwire is the page's headline event,
  so this line earns a real check rather than a glance.

## 9. Bitcoin & Metcalfe's Law — ETF-era time-sensitive figures (`/bitcoin-and-metcalfes-law.html`)

These figures are date-stamped on the page and drift over time; stale numbers
would undercut the page's "verified, not asserted" standard. Refresh monthly
(a structural argument tolerates a monthly cadence — see the cadence note).
Source files: prose + credits in `src/bitcoin-and-metcalfes-law.njk`; the fit
table in `src/_includes/_pageassets/bitcoin-and-metcalfes-law.js`.

| Figure on page | Current value (as of) | Source to re-pull | Notes |
|---|---|---|---|
| US spot ETF holdings | ≈1.25M BTC (2026-09-11) | walletpilot.com/bitcoin-tracker/etfs (cross-check Farside, Glassnode, The Block, Bitbo) | Credit [8] + §VI prose ("roughly 1.25 million BTC"). Update both the BTC figure AND the "% of circulating supply." |
| ETF holdings as % of supply | ≈6.2% | = ETF BTC ÷ circulating supply | Appears in §VI prose, the inline holder-growth/ETF visual ("6.2%"), and the visual caption. Recompute when either input moves. |
| ETF AUM (owner-count basis) | ~$96.6B | same ETF trackers | Credit [9] order-of-magnitude basis for the "millions of owners" claim. |
| ETF-era on-chain holder growth | ~3.6%/yr | recompute: Coin Metrics `AdrBalCnt` CAGR over 2024–present | §VI prose + the inline visual ("3.6%/yr"). Will drift as the ETF era extends. **Trackers disagree** by ≈1% on the BTC figure (2026-09: Wallet Pilot 1.251M vs Bitbo 1.268M, almost all of it IBIT) — quote the headline to three significant figures and name the spread in credit [8] rather than carrying false precision. |
| Long-term-held supply share | ~67% ("two-thirds today") | Bitcoin Magazine Pro HODL Waves (sum of ≥1yr bands) | §V callout ("roughly two-thirds today"). |

**Re-pull recipes** (so future-you doesn't reconstruct the method):

- **On-chain fits (β, R² by era — the `FITS` object).** Coin Metrics Community
  API — `community-api.coinmetrics.io/v4/timeseries/asset-metrics`, metrics
  `PriceUSD` + `AdrBalCnt` (holders) and Blockchain.com Charts
  `n-unique-addresses` + `market-price` (active), daily, full history; OLS on
  log-log per era. Era boundaries: retail 2011→2016-12-31; institutional
  2017-01-01→2020-03-31; ETF 2024-01-01→present; full 2011→present (calibrated
  so the holders fit reproduces the exact `bal` cells — see SITE_GUIDE §29).
  Re-running monthly mainly moves the ETF-era and full-history rows. The `bal`
  cells are exact OLS; the `act` cells were recomputed at launch.
- **HODL / long-term-held share.** Bitcoin Magazine Pro Dash app `hodl_waves`,
  POST to `_dash-update-component` with `display.children="lg 1082px"`. Free,
  full history.
- **ETF holdings.** No clean free API; read the current figure off Wallet Pilot
  / Farside and cross-check one other tracker before updating.
- **Pinned chart dataset (`src/_includes/_pageassets/bitcoin-and-metcalfes-law-data.js`).**
  The §IV fit chart reads a committed static weekly series — 808 points, one per
  ISO week: Coin Metrics `PriceUSD` + `AdrBalCnt` (holders) and Blockchain.com
  `n-unique-addresses` (active) — **pulled 2026-06-20** (source + pull date are in
  the file header). Re-pull **quarterly** (not monthly — it's a structural scatter,
  not a date-stamped headline figure): regenerate the weekly series, and **before
  committing, confirm the refreshed full-history holders fit still reproduces
  β ≈ 1.84 / R² ≈ 0.95** (and the era pattern: retail strong → ETF-era broken). If
  it drifts materially, reconcile against the `FITS` object before shipping.

**OG card — no regeneration needed.** `og-bitcoin-and-metcalfes-law.jpg` is a
**brand-forward** card (STYLE_GUIDE §6.15.1) — static atmospheric ₿, no embedded
chart data — so it does **NOT** go stale on data refresh and is **excluded** from
the §6 product-forward OG-regen list above.

**Cadence note.** ETF figures move daily but a monthly refresh is sufficient
for a page making a structural (not real-time) argument. If the page ever
quotes a "today" figure prominently, consider a quarterly re-fit of the era
exponents too, since the ETF-era window lengthens.

## 9.3. Real-estate pair: price, rent and cost defaults (SEMIANNUAL and ANNUAL, from PR 4b)

_Added 2026-09-28 (PR 4b; DATA_AUDIT RE-3–RE-13)._ Every sourced default for `/bitcoin-vs-real-estate` and `/bitcoin-vs-rental-property` lives in **one object**, `PAIR_DEFAULTS`, at the top of `src/_includes/_pageassets/shared/real-estate-model.js`. BvRE writes it into its inputs and link defaults on load; BvRP's `state` and sliders read it. So a refresh edits the object, then the tooltip prose that quotes the number, then the DATA_AUDIT row. Returning readers pick up a new default automatically: BvRE's settings storage (`lcs.bvre.calc.v2`) keeps only values a reader changed.

- **Semiannual (next ≈ March 2027): price-to-rent (RE-7).** Run `python3 scripts/verify-real-estate-sources.py` and read the M4 section. If the latest ratio differs from `priceToRent` by more than 0.1, update `priceToRent` and `priceToRentAsOf`, and the rent tooltip in `src/bitcoin-vs-real-estate.njk` ("15.77", "August 2026", "$2,193"). The rent default follows the price automatically.
- **Annual, each spring, with the latest full year:**
  - `homePrice` (RE-6): the new year's average of FRED `MSPUS`, rounded to the nearest $5,000, and the home-price tooltip ("2025", "$415,000"). Keep it a *new-house* median, and say so.
  - The three home-appreciation presets (RE-3–RE-5): see STYLE_GUIDE §3.5; they live in `shared/modeling-assumptions.js`, not in `PAIR_DEFAULTS`. Both pages' preset buttons read them there; the tooltip that quotes them is written once, in `components/real-estate-baseline.njk` (PR 4f).
  - `closingPct` (RE-8) when LodeStar's annual report lands (late April): its "% of the home sales price" figure, and the closing-costs tooltip.
  - `propTaxPct` (RE-9) when ATTOM's annual property-tax analysis lands (April): the national effective rate on single-family homes, and the property-tax tooltip.
  - `insurancePer400K` (RE-10) from NerdWallet's average-cost page (keep the $400K dwelling-coverage basis), and BvRE's insurance tooltip.
  - `sellPct` (RE-12) from Clever's latest agent surveys (midpoint of the most recent two) + the 1% estimate, and the selling-costs tooltips on **both** pages.
- **Verify after any change:** open each page with `?qa` and run `await rePairQA.all()`; the hashes move, which is expected, and every identity check (parity, tax parity, ledger = stat block = chart) must still pass, which is expected. Record the new digests in the refresh commit.

## 9.3a. Rental page: the dated rates object and the stablecoin-lending disclosure (MONTHLY, from PR 4d)

_Added 2026-09-28 (PR 4d; rulings §7 item 12; DATA_AUDIT BvRP-5, BvRP-14, BvRP-28)._ `/bitcoin-vs-rental-property` takes every yield rate from **one object**, `YIELD_RATES`, in `src/_includes/_pageassets/shared/real-estate-model.js`: `asOf`, `strc`, `sata`, `lending`, and `verifiable` (the rows of the disclosure under the calculator). The calculator, the slider labels, the Path 4 rows, the $500K example's rate-dependent cells (`data-yr-ex`) and the disclosure table all read it, so a refresh is one edit plus the dated tooltips.

- **STRC and SATA:** from the latest 8-Ks (with the Strategy and Strive blocks above). Set `strc` / `sata`.
- **The verifiable lending rates:** run `python3 scripts/verify-real-estate-sources.py` (Item 12 section): FRED `DTB3` (3-month T-bill, the reference), and from DefiLlama (`https://yields.llama.fi/pools`, **base** APY, token rewards excluded, the largest pool per asset on Ethereum) the Sky Savings Rate (sUSDS), Aave v3 USDC and Compound v3 USDC. Update each row's `rate` and `source` date.
- **Ledn:** re-check its rates page and whether US residents are eligible after the Ledn US LLC migration; update its row (`us`).
- **The 4.0% default (`lending`):** move it only if the median of the four lending rows drifts more than half a point from it. Then also update the BvRP-28 row, and the Year 1 figures in the prose if any quote it.
- **`asOf`:** the month of the refresh.
- **Verify:** open the page with `?qa` and run `await rePairQA.all()`; the S-bvrp and yield-portfolio hashes move, which is expected. Record the new digests in the refresh commit.

## 9.4. The retrospective's monthly series: Case-Shiller, Zillow rents and values (MONTHLY, from PR 4e)

_Added 2026-09-27 as a placeholder (design v1.2, ruling P8); **live since PR 4e** (2026-09-28; DATA_AUDIT RE-16–RE-20)._ `/bitcoin-vs-real-estate`'s retrospective runs month by month from July of the start year to **today**: bitcoin at today's price (the shared `fetchTodayPrice`), the house at the **latest published month** of Case-Shiller, and rent, mortgage and equal-cash-out flows through the current month. Its series live in **`src/_includes/_pageassets/shared/housing-monthly-data.js`**, one `['YYYY-MM', value]` pair per month. The flows run to the current month by the clock; the house's month ("June 2026" on the cards) comes from the data, so **the refresh is appending months; no label is edited by hand.**

- **`CS_NATIONAL`** (RE-16): FRED `CSUSHPINSA`, https://fred.stlouisfed.org/series/CSUSHPINSA. Publishes on the last Tuesday of each month with a two-month lag (late September brings July). Append each new month to 3 dp. The index is revised: compare the last three stored months with FRED's current vintage and update them if they moved.
- **`ZORI_US`** (RE-17) and **`ZHVI_US`** (RE-18): Zillow Research, https://www.zillow.com/research/data/: the metro files `Metro_zori_uc_sfrcondomfr_sm_month.csv` and `Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`, row `United States` (the same files as RE-7, so do this with §9.3's price-to-rent check). Append each new month, ZORI to 2 dp and ZHVI to the dollar. Zillow revises its smoothed series; if the last months moved by more than rounding, update them. A new **July** of ZORI is what resets every start year's rent, so check it lands.
- **`CPI_RENT`** (RE-19): 2014–2015 only. Nothing to refresh unless the start range moves before 2014.
- **Bitcoin** (RE-20): nothing here. The start-year averages come from `PL_DATA` (§1) and the monthly flows from `BTC_MONTHLY` (§1, BTC-M-1). A month whose previous month's close isn't in `BTC_MONTHLY` yet trades at today's price, so a late §1 refresh degrades gently rather than breaking.
- **`csData`** (RE-16, in `shared/bvre-annual-data.js`): the annual averages behind the growth-of-$1 and every-starting-year exhibits and The Gallery's chart 4. Append the new full year each January, when `homeData` and `btcData` roll forward (the annual step in that file's header; it has no section here yet, see TECH_DEBT), not monthly.
- **Start years:** the select offers 2014–2024. Add a year to it (and the URL notes in `bitcoin-vs-real-estate.js`) only once that calendar year is complete in `ZHVI_US`, `ZORI_US` and `PL_DATA` (the engine returns nothing for a year without them, and the page says the data isn't complete) and `homeData` and `mortgageRates` carry a sourced full-year value for it (the 2025 values are due a check first; see TECH_DEBT).
- **Verify:** open `/bitcoin-vs-real-estate?qa` and run `await rePairQA.all()` (it includes `ledgerCheck()`). A new Case-Shiller month moves every retrospective hash (E1–E5, E20, E21), which is expected; a new ZORI or ZHVI month moves them only when it lands in a July or in a start year. Record the new digest in the refresh commit.

## 9.5. Search Console indexing sweep (MONTHLY)

The publish-day habit (`NEW_PAGE_CHECKLIST`) covers a single new page on the day it ships. This is the recurring pass that catches everything the one-click sitemap resubmission does not.

**Why it is a monthly job and not a per-ship one:** Google **retired its sitemap ping endpoint** (404, verified 2026-08-20; Bing returns 410 Gone), so nothing about indexing can be automated any more. And per-URL Request Indexing carries a **~10 requests/day quota**, which a multi-page ship exceeds in one sitting. The sweep is where the overflow lands.

**Steps:**

1. **Indexing → Pages.** Scan the not-indexed reasons for anything **unexpected**. "Crawled – currently not indexed" and "Discovered – currently not indexed" on recent pages are normal and self-resolve; **"Excluded by 'noindex' tag"**, "Redirect error", "Soft 404", or a canonical pointing somewhere surprising are not — those are bugs on the page, not queue latency. Trace any of them back to the page before requesting anything.
2. **Request Indexing** for pages that are new since the last sweep, or that have been sitting stale-unindexed. Mind the **~10/day quota** — when you hit it, **spill the remainder to the next day rather than skipping them**. A page left unrequested for a month is the failure mode this sweep exists to prevent.
3. **Sitemaps.** Confirm `sitemap.xml` shows **Success** and that the **discovered URL count matches** the current entry count in the repo's `sitemap.xml`. A count that has drifted below the file's means Google is holding a stale copy — resubmit.

**Never request indexing for `/demo/*` paths.** Those pages are deliberately unlisted and carry `X-Robots-Tag: noindex` (see `SITE_GUIDE`); they exist to be reached by a direct link in an email and nothing else. Seeing them absent from the index is the system working, not a defect to fix. The same applies to any future unlisted outreach artifact.

## 9.6. GA4 comparability notes (read before comparing months)

Dated breaks in the GA4 series. Check this list before reading any month-over-month or year-over-year number that spans one of these dates.

- **2026-09-19: Enhanced-measurement history-change page_views turned OFF — views on slider pages are not comparable across this date.** (Pages that rewrite the URL as sliders move were logging a page_view per history change.) **Internal traffic tagged from 2026-09-20; filter Active from 2026-09-21.** Tagging is `traffic_type=internal`, set in `base.njk` — see `SITE_GUIDE` "GA4 internal-traffic tagging". Until the "Internal Traffic" data filter is switched from Testing to Active, internal hits are still IN the reports (labelled, not excluded); from the Active date they are permanently dropped, so sessions/views step down by JM's own usage at that date.

## 9.7. Is Bitcoin a Bubble? — the weekly bitcoin line (MONTHLY, from 2026-09-29)

`/not-a-bubble`'s chart plots bitcoin as a multiple of its 2014 price, one point per
week, in `BTC_DATA_2014` at the top of `src/_includes/_pageassets/not-a-bubble.js`
(DATA_AUDIT NB-1). Nothing refreshed it until 2026-09-29, when it was found ending
at 2026-03-15 — six months short of the chart's "today" point, with a visible gap.

- **Source:** Yahoo Finance BTC-USD **daily close** (UTC) on each **Sunday**. The
  keyless chart endpoint works from a script:
  `https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?interval=1d&range=1y`
  (`chart.result[0].timestamp` and `indicators.quote[0].close`).
- **Append** one `{"x": …, "y": …}` per Sunday after the last stored point, through
  the latest **completed** Sunday: `x = round((date − 2017-12-16) in days / 365.25, 4)`,
  `y = round(close / START_PRICE, 4)` with `START_PRICE = 398.8210144042969` (the
  2014-09-21 close). Both formulas reproduce every stored point exactly (13 of 13
  checked on 2026-09-29); if a check point doesn't, stop and find out why.
- **Never append a partial week.** The "today" point is drawn from the shared live
  price, so the line doesn't need to reach today.
- **Verify:** load `/not-a-bubble`; the line should end within a week of the today
  point, and the ATH annotation (`2025 ATH $123,513`) should not move.

## 9.8. Values computed once from `PL_DATA` and stored (MONTHLY, with §1)

Some figures were computed from the price series once and written into the source. They don't move when `PL_DATA` does, so after each §1 append, recompute them:

- **`TREND_RATIO_PERCENTILES`** (`shared/calculator-helpers.js`). The Bitcoin Retirement's status line reads it ("historically, BTC has traded below this trend level N% of its history"). Rebuild from every `PL_DATA` sample: the ratio `price ÷ (PL_A · day^PL_B)`, sorted, one row at every second percentile from 0 to 100. Update the header's "spanning days 592 → N" (the freshness report reads it). On 2026-09-29 it stopped at day 6304 (2026-04-08), six samples short. The header's note to regenerate "when PL_DATA in the-power-law.js changes" is out of date: `PL_DATA` lives in `shared/power-law-data.js`. Computing the table at load would retire this item (TECH_DEBT).
- **Disciplined Rebalancing's reference thresholds** (`disciplined-rebalancing.njk` ~376–396 and the chart lines in `disciplined-rebalancing.js` ~75–78). The page says they are "computed against current PL_DATA"; recompute the percentile multiples and fix the sample count ("~5,500+ samples"; the series has about 480).
- **What Daily Conviction Bought**: the FAQ answer (njk ~16), the drawdown figure (~20, 165) and the head meta (`what-daily-conviction-bought-head.html` ~7, 15). Recompute with the page's own tool at the default settings ($30 a day from 2017-01-01).
- **The Bitcoin Hurdle Rate**: the head meta ("near 30% over ten years"; it falls about a point a year) and the forty-year figure (njk ~24).
- **Allocation Sizing**: the tooltip "about 0.44× today" (njk ~70). Prefer rewriting it without a number, since the live figure is on the page.
- **Anything else in prose that states today's multiple or growth rate**: `grep -rni "× today\|currently ~\|currently about\|currently below trend" src/*.njk`.

## 9.9. The Doubling Ladder: its own series (QUARTERLY, from 2026-09-29)

`the-doubling-ladder.js` embeds three arrays computed offline from blockchain.info daily closes (method in the file header): `LADDER` (each doubling rung and the first daily close at or above it), `DEVIATION` (month-end ln(actual ÷ trend)) and `MONTHLY_HIGH`. The page uses its own coefficients (`DL_A`, `DL_B`), not the shared ones, by design (DATA_AUDIT PL-3). On 2026-09-29 the arrays ended in June 2026.

Each quarter:
1. Append the months since the last point with the same method and coefficients.
2. Record any rung crossing in `LADDER` (first daily close at or above the level).
3. Restate the checksum the page prints (months, mean ln-deviation, months above and below trend with their shares, the date span): the file header, and the text at njk ~86–90 and 112–114 ("mid-2010 to mid-2026", 41.9% / 58.1%, 80 / 111).
4. The page's cycle peaks and troughs (js ~271–272, njk ~92) stop at 2021–22. The 2025 peak and the next trough belong there when confirmed (§12).

`scripts/data-freshness.py` reports the last point of `DEVIATION` and `MONTHLY_HIGH`.

## 9.10. Rates, terms and market facts quoted in prose (QUARTERLY, judgement)

These are typed into the copy, not computed. Re-read each against its source every quarter; the quoted examples show what to look for, and line numbers are as of 2026-09-29.

**Rates, fees and product terms**
- **Borrowing Against Your Stack**: lender list and terms (njk ~130–139, 167–193, 263), APR and LTV bands (~377–408, 485 "as of mid-2026"), provider APRs (js ~560, 613–636) and the chart's rate bands (js ~1347–1400). The opening example (njk ~76–86) says "Bitcoin is now near $110,000"; that sentence needs rewriting (TECH_DEBT), not refreshing.
- **Living on Bitcoin**: the tools survey (fees, APYs such as "currently ~3.8% APY", card terms; njk ~65–186, 280) and Lightning's capacity ("$1.17B, November 2025", ~185).
- **Bitcoin-Backed Mortgages**: product terms (LTV, rate premiums, delinquency triggers) and rates (30-year default 7%, multisig 12–16%, Strike 7.5–10.5%).
- **Bitcoin vs. Rental Property**: vacancy (7.3%, Q2 2026), FHFA, 30-year fixed, Prime and HELOC rates (njk ~100–103, 374, 782, 792, 884, 887) and the YBTC figure (~323, 906).
- **Bitcoin Fixed Income**: the path reference rates (Treasury 4.3%, investment grade 5.5%, M2 6.5%, trend CAGR ~28%; §7.1).
- **The Bitcoin Hurdle Rate** presets: money-market ~4.3%, savings ~4%, mortgage ~6%, WACC ~9%, rental ~8%, and S&P total return 10.86%, which has no source on the page.

**Market-structure facts**
- **Paper Bitcoin**: custody concentration (Coinbase ">80%" of ETF coin), the ETF count, the lost-coin range, the France abduction figures.
- **Bitcoin vs. the Stock Market**: ETPs holding 6.4% of supply, "49+ companies", "23 states", MVRV ~2.0× (njk ~75, 366).
- **Trilemma**: "~400,000 transactions per day"; Fedwire volumes.
- **Risks to Bitcoin**: the top three pools' share (~60%) and China's hash share.
- **The Bitcoin Migration**: the national debt ("past $36 trillion") and its servicing cost (njk ~221).
- **Bull & Bear Cycles**: "~$2 trillion asset" (njk ~141).
- **What Bitcoin Is** and **Money Trees** keep their copy in `concepts.json` and `data.json` at the repo root: counts such as "~180 currencies", "~4 billion unbanked", "over 16 years".

## 9.11. Legal and tax status (SEMIANNUAL, plus dated deadlines)

Pages that state what the law is, or what is pending, go stale when a bill passes, a notice expires or a court rules. Read each against its source twice a year, and on the deadlines below. A change on one page usually means a change on the others.

- **Spend and Replace** (US tax, "as of mid-2026"; njk ~300 says "Last updated: May 2026", so update the two together). Check each rule it states: Notice 2014-21, the FIFO default, Rev. Proc. 2024-28 wallet-by-wallet tracking, the 1099-DA phase-in, §1091 and wash sales, the rate tables, the donation thresholds; the case law it cites; and the pending bills (PARITY, Lummis–Gillibrand). **Deadline: the Notice 2025-7 relief, extended by Notice 2026-20, ends 2026-12-31** (njk ~177–186, 220, 260–272). Review in early December and again in January.
- **Living on Bitcoin**: tax notes (njk ~66, 87–88, 171, 290, 332, 433, 442; the $200 threshold in js ~231–234) and the CLARITY Act status (~88).
- **Borrowing Against Your Stack**: DFAL and the state count (njk ~131), §1259, step-up basis, the capital-gains rates. njk ~151 says "The PARITY Act of 2026 confirmed §1259 applies to digital assets", but Spend and Replace and Living on Bitcoin say PARITY has not passed. Resolve that (TECH_DEBT).
- **Bitcoin-Backed Mortgages**: the QM prepayment cap, the GENIUS Act, capital-gains rates, §1259, Fannie Mae's conservatorship.
- **Paper Bitcoin**: the IBIT prospectus terms, in-kind redemption, SIPC, retirement-account access.
- **Bitcoin vs. Rental Property**: California AB 1154 (njk ~151).
- **Risks to Bitcoin**: China's rounds of restriction (Circular 42, Feb 2026).
- **Bull & Bear Cycles and Bitcoin as Collateral**: the CLARITY Act status is a monthly check (§2, §3); this is the full re-read.

## 10. Claude project mirror refresh

**Last mirror refresh: 2026-09-17** (update this line BEFORE exporting,
not after — see step 3).

The Claude project holds a copy of the repo's strategy and design docs. That
copy is what Claude reads at the start of every session — so when it goes
stale, Claude reasons from outdated facts and states them confidently. This
already happened once: SITE_GUIDE narrated the out-of-sample chart's fit window
for fifteen months after commit 6604126 changed it.

**Trigger:** after any merge to main that touches the doc set below. Not
file-by-file when someone notices — as a set, after the merge.

**Doc set:** PAGE_IDEAS_BACKLOG, SITE_GUIDE, STYLE_GUIDE, TECH_DEBT,
DATA_AUDIT, MONTHLY_REFRESH_CHECKLIST, NEW_PAGE_CHECKLIST,
POSITIONING_STRATEGY_GUIDE, TOOLS_FORWARD_LANGUAGE_KIT, FEEDBACK_SETUP, and any
design doc that changed.

**Steps:**
1. Copy the working-tree versions out of the repo; verify SHA-256 against the
   repo copy. Leave line endings as-is (CRLF matches the on-disk convention and
   makes future comparison clean).
2. In the Claude project, replace each doc AT ITS EXACT EXISTING PATH. Delete
   the old entry first if the UI would otherwise create a duplicate.
3. Before exporting, set the "Last mirror refresh" line above to
   today's date and commit it. Sequence matters: update the line,
   merge, THEN export — so the exported copies carry the correct
   date. Do not record a commit SHA; a file cannot state the SHA of
   the commit that contains it.

**Is the mirror current?** Empty output means yes:

```bash
git log --since="<last refresh date> 00:00" --oneline -- PAGE_IDEAS_BACKLOG.md \
  SITE_GUIDE.md STYLE_GUIDE.md TECH_DEBT.md DATA_AUDIT.md \
  MONTHLY_REFRESH_CHECKLIST.md NEW_PAGE_CHECKLIST.md \
  POSITIONING_STRATEGY_GUIDE.md TOOLS_FORWARD_LANGUAGE_KIT.md \
  FEEDBACK_SETUP.md '*_DESIGN.md'
```

Pin the `00:00` — a bare date in `--since` resolves to the current time-of-day,
not midnight, so it silently drops commits made earlier on the refresh day, and
an empty result would then read as "all current" when it isn't.

**Naming hazard — this is how the mess starts.** Docs shuttled by hand pick up
renames: a project doc exported to the repo becomes `claude_NAME.md` (namespace
slash flattened to underscore), and a re-downloaded file becomes `NAME (1).md`.
Both happened. Periodic check:

```bash
git ls-files | grep -E 'claude_| \(1\)'
```

Should return nothing.

**Direction of truth:** the repo is canonical for everything in the doc set
above. The planning/strategy docs (OPEN_ITEMS, X_STRATEGY_PLAYBOOK,
FUNDING_STRATEGY, REACH_GROWTH_PLAN, CREATOR_CREDIBILITY_KIT,
PARTNERSHIPS_REFERRALS_POLICY, plus the rest of the former project-only set) are now
repo-tracked at root — the `claude/` project-only split was retired 2026-08-08
(SITE_GUIDE §7); edit them in the repo directly. See PAGE_IDEAS_BACKLOG conventions.

## Live BTC price fetch — shipped 2026-05-28

The "Why not live fetch?" reasoning that previously sat here is preserved
in git history (last revision before this commit). The decision was
reversed because (a) the credibility cost of cross-page disagreement on
spot price was clearly visible — three different pages were showing three
different "current" prices on the same day — and (b) the two coherence
concerns we originally raised are addressed by computing `TODAY_DAYS` at
load and centralizing the fetch + fallback in one shared helper:

- **Reliability:** `fetchTodayPrice()` in `shared/power-law-data.js` is the
  single network surface. On any failure it falls back to the latest
  `PL_DATA` sample, which is itself refreshed monthly — so the worst-case
  is the same staleness the old hardcoded path had, never worse.
- **Coherence:** `TODAY_DAYS` is now computed from `GENESIS_TS` at load,
  so the trend anchor advances in lockstep with whatever `TODAY_PRICE`
  resolves to. No partial-coherence drift.
- **Editorial review:** the as-of strings and chart captions in §3 still
  benefit from the monthly eyeball; that discipline is preserved
  independently of the live-fetch change.

Pages consuming the shared helper: every page that shows a "today" price
(about 25; `grep -rn fetchTodayPrice src/_includes/_pageassets`), plus the
channel ribbon on every content page. Since 2026-09-29 that includes Is Bitcoin
a Bubble? and Living on Bitcoin, which had their own CoinGecko calls.

**2026-09-29 — several sources, dated fallback.** A fault at CoinGecko blocked
keyless requests from 06:42 UTC (CoinGecko fixed it that evening), and because it
was the only source, every page showed the fallback until PR #133 shipped the
same morning. `fetchTodayPrice()`
now tries Coinbase → Kraken → mempool.space → CoinGecko and takes the first
sane answer; the fallback is labelled with the sample's date rather than
"latest monthly data". Nothing is added to the monthly refresh except the §5
check that the live price loads.

## Annual: Demographia global affordability dataset — May each year

Bitcoin vs. Real Estate's Affordability Crisis tab includes a 5-market
price-to-income time series (HK, Sydney, Vancouver, Greater London,
US national — see DATA_AUDIT BvRE-4 for full provenance). The series
extends by one data point per year and the source — Demographia
International Housing Affordability — releases each May, reporting Q3
data for the prior calendar year.

**Annual procedure (do this once per year, within ~4 weeks of the
Demographia release):**

1. **Find the new edition.** Check `http://www.demographia.com/db-dhi-index.htm`
   for the latest annual edition, and `https://www.chapman.edu/communication/`
   (search "Demographia") for the Chapman-co-published PDF if newer than
   what demographia.com lists.

2. **Extract the five values** from the new PDF's "Executive Summary" /
   "Housing Affordability Ratings by Nation" table and the "Least
   affordable markets" paragraph in Section 3:
   - **Hong Kong** — appears as a national row in the by-nation table
     ("China: Hong Kong … 14.4" style)
   - **Sydney** — named in the least-affordable paragraph ("Sydney at
     13.8") and in the per-market ranking table near the front of
     Section 3
   - **Vancouver** — same: least-affordable paragraph + ranking table
   - **Greater London** — same: least-affordable paragraph + ranking
     table
   - **United States (national)** — by-nation table ("United States … 4.8")

3. **Append the new data_year** to the arrays in
   `src/_includes/_pageassets/bitcoin-vs-real-estate.js`:
   - Add the new year (integer) to `globalYears`
   - Append the five new values, in order, to `ratHK`, `ratSydney`,
     `ratVancouver`, `ratLondon`, `ratUS`
   - `affordThresh` is derived from `globalYears` length, so it
     auto-extends with no edit

4. **Update DATA_AUDIT** BvRE-4 row: `Last audited` → today, `Next due`
   → today + 1 year.

5. **Verify visually** on the built page: the chart should show one
   additional data point on the right edge for each line; the US line
   should remain the lowest of the five; the legend, tooltip, and
   y-axis range should not require any code changes (the y-axis is
   bounded at min:2 / max:25 which comfortably covers HK's all-time
   peak of 23.2 in 2021).

**Annual-cadence rationale, not monthly.** Demographia is the only
multi-market price-to-income dataset with consistent methodology across
this set of markets and the depth we need. It is published once a year.
Sub-annual updates from other sources (national stats agencies, BIS,
OECD) would introduce methodology mixing and aren't worth the editorial
inconsistency.

## 11. Annual — January (from 2026-09-29)

In January, once the prior year's data is complete. `scripts/data-freshness.py` flags the annual series, the © year and year inputs whose minimum has passed; the rest is a read-through.

1. **Annual data.** `homeData`, `btcData`, `csData` in `shared/bvre-annual-data.js`: `btcData` is the mean of the year's `BTC_MONTHLY` closes and `csData` the mean of the year's `CS_NATIONAL` months, so both can be computed rather than looked up. Also `incomeData` and `mortgageRates` in `bitcoin-vs-real-estate.js`. Bitcoin vs. Real Estate hard-codes the last full year (2025 in njk ~68–463 and js ~12–207). The Gallery reads the same series: chart 3's projection years and cutoff (`the-gallery.js` ~716–773), chart 7's end year (~1381), and the figures its copy quotes (`the-gallery.njk` ~137–265). The 2025 `btcData` value is already in question (TECH_DEBT: the annual-series refresh).
2. **Year bounds.** Retirement-year minimums (`the-bitcoin-retirement.njk` ~317 and js ~1513; `shared/retirement-engine.js` ~317; the Stress Test njk ~70, 121 and `RETIRE_YEARS` js ~333); Escape Velocity's "2026–2055" (njk ~101, 103, 231); The Power Law's "today" column label and slider minimum (njk ~269, 287; js ~652) and year buttons (njk ~621–622); the calculator tiles' axis labels (`calculators-minis.js` ~270–272); the Metcalfe page's era end and axis year (js ~46, 49; njk ~26, 55, 78, 190, 213).
3. **Completed windows.** The Fixed Pie's `historicalCagrs` (January to January, js ~302–313) and the average its prose quotes (njk ~193); the four-year windows in `lump-sum-or-ladder-in.js` (~123) and `your-deployment-plan.js` (~400), which gain a window only when one completes (next: 2027–30).
4. **Age strings.** `grep -rni "fifteen years\|sixteen years\|seventeen years\|years old" src/*.njk`, plus Risks to Bitcoin's opening (§2).
5. **The footer's © year** (`layouts/base.njk`).
6. **The Gallery's BTC-per-house line** ("20 / 1.4 / 0.23 / 0.06 BTC", `the-gallery.njk` ~236) changes on 1 January.

## 12. Event-driven triggers (from 2026-09-29)

Not on a calendar: when one of these happens, run its list.

**A new all-time high** (a daily close above the prior record)
- Is Bitcoin a Bubble?: the ATH annotation ("2025 ATH $123,513", `MILESTONES` in `not-a-bubble.js`) and the "~310×" insight card (njk ~86–89).
- Bitcoin vs. the Stock Market `TOPS` (js ~75–81) and its preset (njk ~139); the Heatmap preset (njk ~174); Discount or Premium's "Oct 2025 ATH" (js ~939).
- Bull & Bear Cycles: `CYCLES` and the live-status copy (§2).
- The Power Law's cycle list (njk ~549–551) and "$100,000… In progress" (~173).
- The Doubling Ladder: a rung crossing (§9.9).
- The Dashboard's ATH tile computes from `PL_DATA`; nothing to do.

**The bear market ends** (a cycle low is confirmed)
- Bull & Bear Cycles (§2): the trough, "the ongoing bear", and the analyst-bottom paragraph (njk ~237).
- Allocation Sizing's crash presets and "modern default" (njk ~92–101); the Stress Test's presets (njk ~22, 136–138); the Hurdle Rate's "−73% drawdown" (njk ~20, 221; js ~351); Bitcoin as Collateral's "2026 bear market" (njk ~224); the Horizon's "only one still open" (njk ~121); the Doubling Ladder's cycle list (§9.9).

**The halving** (next about April 2028)
- The Melting Ice Cube's issuance rate and epoch labels (js ~265–280); What Money Has to Be's "Current issuance rate is 0.8%" (js ~7); any block-subsidy figure.

**A Strategy capital event or an STRC rate change**
- §7, §7.1, §7.5, `YIELD_RATES` (§9.3a), and the rental page's Strategy lines (§0.7).

**Legislation passes or fails** (CLARITY, PARITY, Lummis–Gillibrand, state DFAL-type laws)
- The §9.11 pages, and the CLARITY lines on Bull & Bear and Bitcoin as Collateral (§2, §3).

**Standing claims** (re-verify at every refresh; one more month of data can falsify them)
- The Gallery: "no historical 5-year window in which a bitcoin holder failed to outperform the S&P 500" (njk ~306). False on 2026-09 data (TECH_DEBT).
- Lump Sum or Ladder In: every entry, "even the literal worst tops", has recovered (njk ~40). False while the October 2025 top is underwater.
- The Fixed Pie: no negative four-year window (njk ~142, 153). The Melting Ice Cube: no four-year window below its starting price (njk ~277).
- The Horizon: the worst case "at three years and beyond stays positive" (njk ~130; the margin was 1.6% at 36 months on 2026-09 data) and "64 months" (njk ~117–119, 218; js ~245 hard-codes 64).
- Disciplined Rebalancing: the floor has "never sustained a daily close below" (njk ~92).
- Is Bitcoin a Bubble?: "crashed over 80% three times (2011, 2018, 2022)". The 2022 drawdown was about 77% (TECH_DEBT).
