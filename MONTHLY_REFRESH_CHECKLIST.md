# Monthly Refresh Checklist — Last Coin Standing

A list of values, strings, and data points that go stale over time and need
periodic refresh. The site does not auto-fetch live market data today (a
deliberate choice — see "Why not live fetch" below); these values live as
hardcoded constants and date strings across the codebase. Running this
checklist once a month keeps pages internally consistent with the actual
market state and the as-of dates the page presents to the reader.

Most items are monthly. A few are **per-commit** (Recent Updates strip
on the homepage) or **annual** (Demographia dataset) — the relevant cadence
is flagged in each section header.

This list will grow over time as the site adds pages with time-sensitive
content. When you add a new page that bakes in a TODAY constant or an
as-of date string, add it here in the same commit.

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
| `TODAY_PRICE` | Most recent USD BTC price | Seeded to the latest `PL_DATA` sample, then overwritten by `fetchTodayPrice()` (CoinGecko spot, with the latest sample as fallback) |

The only thing the monthly refresh now does for "today" is keep the
fallback fresh — and that happens automatically when you append a new
`PL_DATA` sample (below), since the fallback IS the latest sample.

### PL_DATA — the historical price series

Append new monthly samples to the trailing end of the `PL_DATA` array.
Format: `[days_since_genesis, price_usd]`. One sample per month is the
right cadence; daily samples produce a heavier file with no editorial gain.

When you add the sample for the current month, also verify the as-of
caption on the BvSM Power Law chart still reads accurately (see §3).

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
grep -rn "AS OF\|as of\|through mid-\|through late-\|through early-" src/
```

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

## 6. OG image regeneration (product-forward cards)

The 2026-05-17 OG rollout introduced **product-forward OG cards** that
embed live chart screenshots in their composition (STYLE_GUIDE §6.15.2).
Four cards in this family will visibly drift from current data after a
monthly refresh and should be regenerated:

| OG card file | Live visual embedded |
|---|---|
| `og-heatmap.jpg` | full heatmap grid, all entry months to today |
| `og-bitcoin-vs-the-stock-market.jpg` | the §2 wealth-curve chart |
| `og-the-bitcoin-retirement.jpg` | the projection chart with current-state annotations |
| `og-calculators.jpg` | the featured-row mini-renderers (which themselves embed live data) |

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
and writes the four updated JPGs to the repo root. Re-commit alongside
the monthly refresh commit (or as an immediate follow-up); the same
filenames are reused so no head-file or `.eleventy.js` changes are
needed.

**Brand-forward OG cards** (STYLE_GUIDE §6.15.1 — Power Law, BvRE,
WMHTB, Half-Life, Money Trees, Synthesis, Migration, Trilemma, etc.)
do NOT need this. Their composition is conceptual / atmospheric and
has no data dependency. Leave them alone during refresh.

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
| **BTC held** | `src/bitcoin-fixed-income.njk` (the `845,256` figure) AND `src/_includes/_pageassets/bitcoin-fixed-income.js` (`var BTC_HELD = 845256`) | CoinGecko `/api/v3/companies/public_treasury/bitcoin` (find Strategy entry by `symbol: "MSTR.US"`). Cross-check against Saylor's latest tweet or Strategy IR page. |
| **mNAV** | `.njk` (`~1.7&amp;times;`) | SaylorTracker.com headline mNAV figure. Or compute: (MSTR price &times; shares outstanding) &divide; (BTC count &times; BTC price). |
| **Shares outstanding** | `.njk` (`~282M`) | Latest 10-Q "Diluted shares outstanding" or Yahoo Finance MSTR Statistics page. Basic, all classes. |
| **ATM issuance** | `.njk` (`Active` value cell + sub-text) | Latest 10-Q ATM disclosures + 8-K announcements for new facilities. Phrase as `Active` or `Paused` with a brief structural note. |
| **Reading right now insight prose** | `.njk` `.sg-insight-text` paragraph | Rewrite when mNAV crosses ~1.0&times; (issuance accretive vs dilutive boundary) or ATM status changes (Active &harr; Paused). Stable otherwise. |
| **As-of date** | `.njk` footer (`Snapshot as of June 2026`) | Update to the current month/year whenever any other field is refreshed. |

**Critical**: the two BTC count locations (the visible cell text in `.njk` AND the `BTC_HELD` constant in `.js`) MUST stay in sync. Otherwise the displayed BTC count and the live USD value will drift apart.

If the values haven't materially changed (BTC count moved &lt;1%, mNAV moved &lt;0.1&times;, ATM status unchanged, insight prose still accurate), the only required update is the as-of date.

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

## 9. Bitcoin & Metcalfe's Law — ETF-era time-sensitive figures (`/bitcoin-and-metcalfes-law.html`)

These figures are date-stamped on the page and drift over time; stale numbers
would undercut the page's "verified, not asserted" standard. Refresh monthly
(a structural argument tolerates a monthly cadence — see the cadence note).
Source files: prose + credits in `src/bitcoin-and-metcalfes-law.njk`; the fit
table in `src/_includes/_pageassets/bitcoin-and-metcalfes-law.js`.

| Figure on page | Current value (as of) | Source to re-pull | Notes |
|---|---|---|---|
| US spot ETF holdings | 1,283,551 BTC (2026-06-17) | walletpilot.com/bitcoin-tracker/etfs (cross-check Farside, Glassnode, The Block, Bitbo) | Credit [8] + §VI prose ("roughly 1.28 million BTC"). Update both the BTC figure AND the "% of circulating supply." |
| ETF holdings as % of supply | ≈6.5% | = ETF BTC ÷ circulating supply | Appears in §VI prose, the inline holder-growth/ETF visual ("6.5%"), and the visual caption. Recompute when either input moves. |
| ETF AUM (owner-count basis) | ~$82.5B | same ETF trackers | Credit [9] order-of-magnitude basis for the "millions of owners" claim. |
| ETF-era on-chain holder growth | ~3.7%/yr | recompute: Coin Metrics `AdrBalCnt` CAGR over 2024–present | §VI prose + the inline visual ("3.7%/yr"). Will drift as the ETF era extends. |
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

Pages consuming the shared helper: BvSM, the Power Law Channel tab, the
Bitcoin Retirement, and Borrowing Against Your Stack (Loan Health input
auto-fill). Disciplined Rebalancing continues to use the latest `PL_DATA`
sample for its "today" (matches the chart's historical line by design);
a future pass may add the live anchor there too.

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
