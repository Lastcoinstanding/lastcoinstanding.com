# Monthly Refresh Checklist — Last Coin Standing

A list of values, strings, and data points that go stale over time and need
periodic refresh. The site does not auto-fetch live market data today (a
deliberate choice — see "Why not live fetch" below); these values live as
hardcoded constants and date strings across the codebase. Running this
checklist once a month keeps pages internally consistent with the actual
market state and the as-of dates the page presents to the reader.

This list will grow over time as the site adds pages with time-sensitive
content. When you add a new page that bakes in a TODAY constant or an
as-of date string, add it here in the same commit.

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
