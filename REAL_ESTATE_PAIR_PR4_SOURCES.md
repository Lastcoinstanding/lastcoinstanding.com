# REAL_ESTATE_PAIR_PR4_SOURCES — sources and rulings for Prompt 4 (harmonised assumptions)

_Chat-side research, 2026-09-28; **JM ruled on all open items the same day (§ Rulings at the end)**. Every figure below was fetched from its primary on that date; the appreciation and price-to-rent figures were **computed from the raw data files**, not read off a summary. Use these for the DATA_AUDIT rows PR 4 requires. Where a ruling assumed a value, the verified value is shown beside it._

**Direction key** (rulings §0 — report every change whichever way it moves): **→ house** = the correction makes owning look better (leans against bitcoin); **→ BTC** = it makes the bitcoin path look better.

---

## M1 · Home appreciation presets (NOMINAL, end point = latest full year = 2025)

Computed as (V_end / V_start)^(1/n) − 1 on **annual averages** of monthly data.

| Preset | Rulings assumed | **Verified** | Source & basis |
|---|---:|---:|---|
| Long run | ~3% | **3.41%** | Shiller 1890–2022, chained to Case-Shiller 2022–2025 (135 yrs, ×92.41) |
| Since 1990 | ~4.2% | **4.23%** | Case-Shiller National, FRED `CSUSHPINSA`, 1990–2025 (35 yrs, ×4.270) |
| **Since 2000 (default)** | ~4.8% | **4.68%** | Case-Shiller National, 2000–2025 (25 yrs, ×3.135) |

- **Why 4.68%, not 4.8%:** the ~4.8% came from Phase 0's window ending in **2024** (4.78%, reproduced exactly). Your ruling says end at the latest full year, which is **2025**; 2025 was a soft year, so the longer window reads lower. **Since 2000 is still the highest of the three**, so M1's "leans against the thesis" logic holds unchanged.
- **The splice is sound.** Shiller's file ends January 2023 (latest full year 2022). His post-1987 nominal series *is* Case-Shiller National: over the overlap the two agree to **within 0.06%** (1990–2022: ×3.8797 vs ×3.8773; same +0.06% for 2000–2022 and 2010–2022). Chaining to FRED for 2022–2025 is therefore the standard extension, not an approximation.
- **Real equivalents, for correcting DATA_AUDIT RE-1 / RE-2** (deflator FRED `CPIAUCNS` annual average; 2025 uses 11 months — October 2025 is blank in FRED):
  - Since 1990: **1.58% real**. Since 2000: **2.09% real** (to 2025); **2.19% real** (to 2024).
  - **RE-2 is confirmed wrong.** It states ~3.7% real for 2000–2024; the primary gives **2.19%**. Correct it.
  - **RE-1** ("~0.4% real, 1890–2024"): Shiller's own real index gives **0.59%/yr for 1890–2022**. The 0.42% Phase 0 took from multpl.com ended in 2017; the figure depends on the end year. Correct RE-1 to 0.59% (1890–2022) and state the window.
- **Primaries:** Shiller, *Irrational Exuberance* housing data, http://www.econ.yale.edu/~shiller/data/Fig3-1.xls (sheet `Data`, nominal index col 8, real index col 1) · https://fred.stlouisfed.org/series/CSUSHPINSA · https://fred.stlouisfed.org/series/CPIAUCNS

## M4 · Default rent (Zillow price-to-rent)

| | Value |
|---|---|
| ZORI, all homes, US (Aug 2026) | **$1,948/mo** |
| ZHVI, typical value, middle tier, US (Aug 2026) | **$368,697** |
| **Annual P/R** = ZHVI ÷ (12 × ZORI) | **15.77** |
| **Default rent on $415K** (ruled price) | **$2,193/mo** — on $420K it is $2,219, reproducing Phase 0 exactly |

- **Stable enough for a semiannual refresh:** the ratio has held between **15.77 and 16.17** for the last 12 months (drifting down from a Jan 2026 high of 16.17).
- **Primaries:** https://files.zillowstatic.com/research/public_csvs/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv and `…/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv` (row `United States`, RegionType `country`); landing page https://www.zillow.com/research/data/

## M4 · The $420K default home price — basis

- **$420K is FRED `MSPUS` rounded**: median sales price of **new** houses sold (Census/HUD). 2024 average **$418,975**; 2025 average **$415,400**; latest quarter (2026 Q2) **$410,700**.
- **State the basis on the page:** "$415,000: the 2025 median price of new houses sold (Census/HUD, FRED MSPUS), rounded".
- **Ruled (JM): $415K** — the 2025 average, the latest full year, the same end-point rule M1 applies. The P/R is a ratio, so the default rent scales with it: $2,193/mo.
- Note: MSPUS is *new* houses. M11 already allows MSPUS "as a price level labelled median new house"; this is consistent with that.

## M6 · Carrying and transaction costs

| Item | Page today | **Sourced value** | Source | Moves |
|---|---|---|---|---|
| **Property tax** (% of current value) | 1.2% | **0.90%** effective, 2025 | ATTOM 2025 Annual Property Tax Report, 9 Apr 2026: "the effective tax rate for single-family homes in 2025 was 0.9 percent, up from 0.86 percent in 2024" — 89.6M homes | **→ house** |
| **Insurance** (grows with value) | ~$150/mo (~$1,800/yr) | **$2,490/yr** for $400K dwelling | NerdWallet analysis of Quadrant Information Services rates, updated 6 May 2026 | **→ BTC** |
| **Selling costs** (commission) | none on BvRE | **5.5–5.7%** total | Clever Real Estate survey, Feb 2026: 5.70% (2.88% listing + 2.82% buyer); FastExpert, early 2025: 5.57%. Redfin transaction data: buyer-agent 2.42% (Q3 2025), up from 2.36% at the Aug 2024 rule change | **→ BTC** (new cost on BvRE) |
| **Buyer closing costs** | none | **$4,661** average | Lodestar, 2025 (via Bankrate) | **→ BTC** (new cost) |
| **Maintenance** (% of current value) | 1% | **no primary** | see below | — |

- **Insurance basis:** $400K is *dwelling* (replacement) coverage, not market value, which also includes land. Applied to a $420K home's value it is, if anything, a slightly high rate (~0.59% of value). Flag, don't adjust.
- **Selling-cost midpoint (your "midpoint of any range" rule):** commission 5.6% + seller closing costs excluding commission. **The latter has no national primary** — it is dominated by state transfer taxes, which run from zero to several percent. Propose: **commission 5.6% + 1% seller closing = 6.6%**, with the 1% stated as an estimate, not a sourced figure. JM rules.
- **Buyer closing costs as % of price:** Lodestar's $4,661 is **~1.1% of $420K**. It likely excludes transfer taxes; it rightly excludes prepaid escrow, which funds tax and insurance the model already charges separately, so it isn't a cost here. The "2–5% of loan" rule of thumb bundles those prepaids in and overstates true friction. ClosingCorp, the historical primary that did include taxes, has not published a national purchase figure since its CoreLogic acquisition.
  - **Propose 1.1% (the sourced figure).** Direction settles this one: buyer closing costs fall only on the buy side, and a higher value makes owning look worse, which helps bitcoin. So the lower, sourced figure is both the more defensible number and the one that leans against the thesis. State the transfer-tax caveat. JM rules.
- **Maintenance — the honest outcome is "rule of thumb, no primary".** Angi's 2025 *State of Home Spending Pulse* (1,000 homeowners, April 2025) reports sentiment and priorities, not spend or % of value. The industry figure is the "1% of value per year" rule of thumb. **Keep 1%, and write the DATA_AUDIT row as a stated rule of thumb with no primary** rather than inventing a source.

## Item 12 · BvRP's Ledn slice → a generic stablecoin-lending slice (JM ruling)

**Current state, corrected:** Ledn is **already known unavailable to US residents** — DATA_AUDIT BvRP-18 records its Terms §2 and §13(c) and its eligibility tool (unavailable in all 50 states, DC and PR). Ledn's notice "Ledn US: What Clients Need to Know" (28 Aug 2026) says accounts move from Ledn Cayman to Ledn US LLC "in the fall of 2026" but does not say which products US residents will get. So the slice defaults a US reader into something they cannot buy today, and may or may not be able to buy after the migration.

**Ruling:** the 10% slice becomes a generic **"Stablecoin lending"** slice, naming no platform, at a **4.0%** default rate (ordinary income, as now). A tooltip on the slider and a short disclosure under the calculator show **what the verifiable instruments pay this month**, refreshed with the monthly data refresh. JM: "accurate to the month … representative and directionally accurate … credible."

**Why 4.0%:** the median of the publicly verifiable rates below (4.04%), essentially the 3-month T-bill (4.08%). It is **below today's 5.00%**, so it leans against the thesis (less yield on the bitcoin-side alternative). **→ house.**

**The disclosure table (as of September 2026)** — list only rates a reader can check from outside:

| Instrument | Type | Rate | Source | US |
|---|---|---:|---|---|
| **3-month Treasury bill** | reference (risk-free) | **4.08%** | FRED `DTB3`, 24 Sep 2026 | yes |
| Sky Savings Rate (sUSDS) | DeFi savings | 3.60% | DefiLlama pool data; $4.5B TVL | permissionless |
| Aave v3 USDC (Ethereum) | DeFi lending | 3.63% | DefiLlama, base rate; $171M TVL | permissionless |
| Compound v3 USDC (Ethereum) | DeFi lending | 4.45% | DefiLlama, base rate | permissionless |
| Ledn Growth Account (USDC) | CeFi lending | 5.00% | Ledn; DATA_AUDIT BvRP-18 | **no** |

- **Base rates only.** Pools advertising 5%+ carry token-reward incentives (e.g. Aave USDC 5.31% = 3.63% base + 1.68% rewards); those are promotional, not lending income, and are excluded.
- **US CeFi rates are not publicly verifiable, so they are not listed.** Coinbase's US USDC rewards now require a paid Coinbase One membership and show the rate only in-account (Coinbase Help, "USDC rewards overview"). Nexo advertises "up to 10.5%", dependent on holding its own token, with no US availability statement on the product page. Say this in one line rather than listing unverifiable numbers.
- **The both-sides line the disclosure should carry** (the reason the table exists): *"At current rates, stablecoin lending pays about what a Treasury bill pays. The extra risks — platform failure (Celsius, BlockFi and Voyager in 2022), smart-contract failure and loss of the dollar peg — are not currently being paid for."* This matches the page's own Bear Case.
- **Refresh:** add a MONTHLY_REFRESH_CHECKLIST line: re-pull DTB3 (FRED) and the four pools (DefiLlama `yields.llama.fi/pools`, base APY, largest pool per asset on Ethereum), re-check Ledn's US status after the Ledn US LLC migration, and move the 4.0% default only if the verifiable median drifts by more than half a point. Store the table's values and as-of month in one data object so the refresh is a one-place edit.
- **Scope:** the calculator default, the slider label and tooltip, the Path 4 label, and the **$500K example table** (which uses "10% Ledn" at 5%) all follow the ruling. The CeFi **prose** that names Ledn, Unchained, Onramp and others as *examples* of the category stays, with its existing availability caveats.
- **Primaries:** https://fred.stlouisfed.org/series/DTB3 · https://yields.llama.fi/pools (DefiLlama; on-chain) · https://help.ledn.io/hc/en-us/sections/28247204483351-About-Ledn · https://help.coinbase.com/en/coinbase/coinbase-staking/rewards/usd-coin-rewards-faq · https://nexo.com/earn-crypto/usdc

---

## Rulings (JM, 2026-09-28)

| # | Item | Ruling | Direction |
|---|---|---|---|
| 1 | Default home price | **$415K** — 2025 MSPUS ($415,400), the same latest-full-year rule as M1 | small, → BTC (lower price, lower costs) |
| 2 | Selling costs | **6.6%** — 5.6% commission midpoint + 1% seller closing costs, the 1% stated as an estimate | → BTC on BvRE, → house on BvRP (rulings §0) |
| 3 | Buyer closing costs | **1.1%** — Lodestar 2025, sourced; transfer-tax caveat stated | → BTC (new cost), the lowest sourced value |
| 4 | Maintenance | **1% of current value**, recorded in DATA_AUDIT as a stated rule of thumb with no primary | none (unchanged) |
| 5 | Ledn slice | **Generic "Stablecoin lending" slice at 4.0%**, with a monthly-refreshed disclosure of verifiable rates (Item 12) | → house |

Every change is reported in PR 4's before/after table, whichever way it moves (rulings §0).
