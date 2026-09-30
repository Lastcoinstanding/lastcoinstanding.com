# REAL_ESTATE_PAIR_DESIGN — Bitcoin vs. Real Estate + Bitcoin vs. Rental Property

> **Historical from ship (2026-09-29).** The pair shipped in PRs 0–8 (PAGE_IDEAS_BACKLOG, Promoted / shipped, lists the merges). **SITE_GUIDE §14 and §14.1 are now authoritative** for what the pages do, with §46 (URL vocabulary), §53.2 (series strip), §55.4 (shared modules) and STYLE_GUIDE §6.49 (ledger and grid). `REAL_ESTATE_PAIR_RULINGS.md` keeps the rulings and each PR's implementation notes. This spec is kept as the record of intent; where it and the pages differ, the pages and SITE_GUIDE win.

_v1, 2026-09-26. Build spec for revising `/bitcoin-vs-real-estate` (BvRE) and `/bitcoin-vs-rental-property` (BvRP) onto one framework. Promotes a chat-side backlog capture (`REAL_ESTATE_PAIR_REVISION_2026-09-26`, a project note, not a repo file). Commit this file at repo root (planning docs are repo-tracked; no `claude/` prefix). The Claude Code prompts that execute it are in `REAL_ESTATE_PAIR_CLAUDE_CODE_PROMPTS.md`._

_Written chat-side from the live pages (read 2026-09-26) and the project docs, **not** from the repo. Anything this spec says about code structure is a hypothesis for Phase 0 to confirm or correct. Where Phase 0 finds the code differs, Phase 0's finding wins and this spec is amended._

_**v1.1, 2026-09-27: amended by `REAL_ESTATE_PAIR_RULINGS.md`** (JM's rulings on `REAL_ESTATE_PAIR_PHASE0_REPORT.md`). Where the rulings and this spec differ, the rulings win. Every change is listed with its ruling number in §14. Ruling IDs used in the text: M1–M11 (model), P1–P6 (presentation), C1–C7 (copy and docs)._

_**v1.2, 2026-09-27: rulings P7–P9** (JM, chat-side, after PRs 1–2 merged): results on BvRE's first tab, the retrospective running to today, and a series strip. They are logged in §14 (v1.1 → v1.2), with two follow-on pages captured in `PAGE_IDEAS_BACKLOG.md` under "Real-estate series"._

---

## 1 · Purpose and the frame that binds the pair

Two pages, one decision seen from opposite chairs of the same lease:

- **BvRE — the tenant's side.** Own the home you live in, or rent it and hold the difference in bitcoin.
- **BvRP — the landlord's side.** Own the rental, or hold bitcoin / bitcoin-yield instead.

Today they share a subject and almost nothing else: different bitcoin scenario sets, different assumption surfaces, different results formats, tax on one side only. This revision gives them **one engine, one assumption surface, one results pattern**, brings both to current register and sourcing standards, and adds four capabilities JM asked for: a dynamic chart, a sensitivity view, a year-by-year "show the calculation" ledger, and pre-/post-tax results under a changeable tax regime.

**Why now:** the pair is the site's entry point to a housing-research audience (Zelman & Associates). That reader checks the arithmetic, knows the market rent gap by heart, and will notice a missing home-sale tax exclusion immediately.

**Governing principle (clarified, rulings §0).** Direction alone can't settle every default (selling costs help bitcoin's case on BvRE and hurt it on BvRP), so:

- **Judgment calls lean against the thesis.** The default bitcoin scenario, whether reversion is assumed, which recorded appreciation window is the default, the rent-growth rule, the chart's default valuation basis. Pick the value that makes bitcoin's case *harder*, say so in the tooltip, let the reader move it.
- **Measurable facts use the best-sourced central figure, even when the correction helps bitcoin.** Rent level, carrying costs, closing and selling costs, tax law, the recorded home-price series. A housing analyst checks facts; a figure bent in either direction costs the credibility the pair exists to earn.
- **Every change to a default figure is disclosed** with a before/after table in its PR, whichever way it moves.

A comparison that wins on unfavourable judgment calls and honestly sourced facts persuades; one that wins on favourable defaults invites dismissal.

## 2 · Scope

**In:**
- A. BvRP sourcing and factual fixes (blocking).
- B. Register pass on both pages, including meta/OG/Twitter/JSON-LD descriptions.
- C. One shared engine module for house, mortgage, rent, bitcoin-path and tax math.
- D. Harmonised assumptions: bitcoin scenario set, sitewide `ModelingAssumptions` pickers, **nominal** home appreciation, rent and rent growth, costs at purchase / while owning / at sale, BvRP's existing mortgage, one horizon (M1–M6, M8, M10, M11).
- E. Tax regime input and pre-/post-tax results on both pages.
- F. Results pattern on both pages: wealth-over-time chart with a difference line, Held / If sold bases and a first-3-years view; year-by-year ledger with CSV export; equal-cash-out comparison (M2, M7).
- G. Sensitivity grid on both pages.
- H. Pair framing, URL carry between the pages, parity QA, bookkeeping.

**Out (fences):**
- No Monte Carlo (site-wide *no*; the source doc `RETIREMENT_CALCULATOR_DESIGN_22` is not in the repo, so cite `PAGE_IDEAS_BACKLOG.md:568` and `COMPARE_RETIREMENT_PLANS_DESIGN.md:178`, C5).
- No change to the canonical Power Law coefficients in `src/_includes/_pageassets/shared/power-law-data.js`.
- No house allocation number, no recommendation, no "which should you do" verdict.
- No change to BvRP's four-paths structure or the STRC/SATA instrument content beyond sourcing and register fixes (the instruments' own pages own them).
- No Zelman-branded variant in this build. It becomes cheap once C–F exist; it is a separate decision after PR 8 (logged in TECH_DEBT §7).
- No new nav entries.
- The sitewide `realReturns` CPI-real-at-M2 conversion is **not** fixed here (logged in TECH_DEBT §5); the pair only retires its own instance (M2).

## 3 · Rulings (JM, ratified 2026-09-27)

The **Ruled** column is binding. The original recommendation is kept in the amendment log (§14) where it changed.

| # | Decision | Ruled | Source |
|---|---|---|---|
| R1 | Bitcoin scenario set, both pages | **Floor · Stay at today's multiple · Trend · Upper.** All four use linear interpolation of the multiple from today's value to the target at the horizon end. Upper target **2.5×**. **Default: Stay at today's multiple** (no reversion assumed). Trend selectable, tooltip: *"Assumes the gap to trend closes in a straight line by the horizon end. In the record, reversion has been irregular in timing."* Floor drawn faintly on every chart. Upper selectable, never default, never in the grid, keeps its brief-peak caveat. The selected scenario's **implied annual growth rate** is shown beside the selector. Labels stay position-neutral; review copy at a simulated above-trend position before shipping (Hurdle Rate v2 rule). | M3 |
| R2 | Home appreciation | **Nominal input on both pages.** House, rent, mortgage and costs computed in nominal dollars; inflation affects **only** the Real display (both paths deflated by the same factor). **Presets (nominal):** Long run (Shiller, 1890 to latest full year, ~3%) · Since 1990 (~4.2%) · **Since 2000 (~4.8%) — default** · Custom. Re-verify every value in PR 4 against FRED `CSUSHPINSA` and Shiller's own file; DATA_AUDIT row for each. BvRP's hardcoded 3.0% becomes this shared input. The `realEstate` (real) dimension is replaced by a nominal dimension (Claude Code proposes the key and migration; a stored `custom` real value is converted once at read time with the sitewide inflation, and the page says so in one line). DATA_AUDIT RE-2 and STYLE_GUIDE §3.5's real-estate table and rationale are corrected in PR 4. | M1, C7 |
| R3 | Default rent | **Zillow ZORI (all homes) ÷ ZHVI (typical value, middle tier), US.** Rent = home price ÷ (12 × P/R). At Aug 2026 values P/R 15.8, rent $2,219 on $420K. DATA_AUDIT row; refresh **semiannually**; user override kept. The $420K default home price stays; PR 4 sources it and states the basis. **Retrospective mode:** Zillow historical P/R where it exists (ZORI from ~2015), CPI-rent backcast for earlier start years; Claude Code proposes the method in PR 4 with before/after. | M4 |
| R4 | Rent growth | Rent grows at the **house's nominal appreciation rate** (constant price-to-rent), exposed as an input. Rent is computed nominally and deflated like every other stream in the Real view (removes the ~$92K Real/Nominal gap). | M5 |
| R5 | Inflation | Keep the sitewide inflation picker, now **as the deflator only** (P5): show it (CPI / M2 growth / custom) in the pair's baseline block, and name it in the Real label: *"today's dollars, deflated at X% a year (M2 growth)"*. Assumptions line (rewritten for the nominal model): *"When inflation runs higher, home prices tend to rise in nominal terms while a fixed-rate loan balance doesn't. That is the fixed-rate borrower's inflation benefit. To model a higher-inflation future, raise nominal appreciation."* | M1, P5 |
| R6 | Costs | **Buyer closing costs** (new): sourced % of price, input. **Property tax, insurance, maintenance:** sourced defaults with DATA_AUDIT rows; property tax and maintenance as **% of current home value**; insurance grows with home value. **Selling costs:** one shared default, sourced to post-2024 commission data plus seller closing costs; **midpoint** if the sources give a range; input 0–10%; applied on both pages at sale (direction can't decide this one). **Bitcoin transaction cost** (new): 0.5% on each purchase and sale, input 0–2%. | M6 |
| R7 | Tax regime default | United States, married filing jointly, 24% federal bracket, typical state (~5%), bitcoin in a **taxable** account. | M9 |
| R8 | Headline results figure | **If sold, after tax** leads; pre-tax beside it; the tax line between. Selling costs sit in both figures, so pre→post is tax alone and the Section 121 exclusion shows as its own number. | M7 |
| R9 | Sensitivity default axes | **Bitcoin scenario (Floor · Stay · Trend) × home appreciation (long run · default · default + 2 points)**; alternative **horizon × mortgage rate** (BvRE) / **horizon × net rental yield** (BvRP). Cells: after-tax difference, If sold. | P1 |
| R10 | Hero/subtitle rewrites | As ruled in §5 (dash-free). | C1 |

**Rulings with no R-number** (full text in `REAL_ESTATE_PAIR_RULINGS.md`):

- **M2 · Equal cash out:** replaces the "Go deeper" DCA. See §9.
- **M8 · BvRP's existing mortgage applies on every path.** See §7.
- **M10 · One horizon from today**, in 365.25-day years, for every path.
- **M11 · Retrospective house path uses Case-Shiller National growth**, not the MSPUS ratio. See §7.
- **P2–P6:** presentation and plumbing. See §6, §9 and §11.
- **P7 · Results on BvRE's first tab:** the chart and ledger apply to both BvRE calculators, including the retrospective on the default tab. See §9.
- **P8 · The retrospective runs to today**, replacing the fixed "April 2025" end point. See §9.
- **P9 · Series strip** at the top of both pages, carrying the shared inputs; both calculators answer to `#calculator`. See §11.

## 4 · A — BvRP sourcing and factual fixes (blocking)

The live page (read 2026-09-26) must not be forwarded to a research audience until these are done. **PR 1 changes copy, static figures and DATA_AUDIT only; engine issues (M1–M11) stay out of it** (rulings §5).

**Cutting beats weak sourcing.** The page is long; fewer, sourced claims serve a research reader better than many unsourced ones. A US claim sourced to a UK survey (Property118) needs a US source or goes.

1. **Remove the draft framing:** the draft sentence in *Methodology & Sources* ("As this draft moves toward publication…") and the **"v0.3 caveats"** label.
2. **"NotebookLM synthesis" is not a source.** Every figure whose source line says so, or says "modeled estimate" or "verification pending", is either (a) re-sourced to a primary and cited, (b) restated as the site's own worked estimate with its method shown on-page, or (c) removed. Known items: the gross-to-net waterfall bands and the 50% Rule; the 31 hrs/month and $4,800/yr time cost; the 19–33% exit attrition; the 11.7% leveraged-ROI critique and the 7–9% after-friction figure; the ~$1.7B annual preferred obligation; the Saylor "$8,000 for five years" line; trading volumes. Full inventory: Phase 0 report §i.
3. **Regulatory exhibits** — each gets a primary source or is cut: Portland ME ($500/unit, 40%), Tacoma I-1 (33% → 54% delinquency, 32% removed), NYC Local Law 18 listing decline (70–92%), California AB 1154. St. Paul (NBER) and Seattle (City Auditor) already link. **The catch-all sources line (`rp.njk:828`) lists only what the page actually cites.**
4. **"Native bitcoin staking and liquid staking tokens"** (*What's Familiar*): bitcoin has no native staking. Remove the bullet or restate accurately (e.g. yield from lending bitcoin, with its counterparty risk).
5. **"Under conservative Power Law assumptions, bitcoin's long-term CAGR has held in the 25–30% range"**: restate with the scenario and window named, computed live from the shared Power Law module, and note that the trend growth rate declines over time (`/the-bitcoin-hurdle-rate`).
6. **$500K side-by-side table:** state its assumptions (an unencumbered $500K property; the sale is taxed, so the portfolio starts from after-tax proceeds, ~$411K); fix the ROC arithmetic (Phase 0 §i-3); name the spot slice's growth scenario, computed from the Power Law module.
7. **Register-adjacent factual claims**: "Hassle: effectively zero" and risk described as "structurally inert" understate issuer-credit risk the page's own *Bear Case* treats seriously. Restate as "no operational load; issuer-credit and market risk instead" (or similar).
8. **Figures that carry an as-of date** (Strategy BTC holdings, STRC/SATA rates, SATA's distribution schedule, Strive's BTC, converts) are re-verified against current filings, with the date shown; add `DATA_AUDIT` BvRP-* rows (the section does not exist yet). **SATA:** the June 16, 2026 change is past; fix the tense and verify the current rate and schedule. **Cash reserve:** reconcile "roughly 6 months" with the USD Reserve in Strategy's latest filing; show the as-of date.

**Research note:** Claude Code verifies against primaries where it can fetch them. Anything it cannot verify, it lists in its report rather than guessing; JM can hand those to chat-side research.

## 5 · B — Register pass (both pages)

Rules: `STYLE_GUIDE §5` (show, don't claim; no verdicts about the page or the outcome), `§10.2.1` (dashes), de-tell discipline (`STYLE_GUIDE §10.6`, `§11`: no "honest/honestly", "load-bearing"), Bitcoin/bitcoin capitalisation per **`SITE_GUIDE §28`** (the rule is page-local there; promotion to STYLE_GUIDE is logged in TECH_DEBT, C2). **Keep every argument; remove the certainty.** The target register for the whole pair is **BvRE FAQ answer 3** ("Real estate is less volatile year to year…"). **FAQ answer 1 is in the sweep** ("the comparison is not close" goes), and the FAQPage JSON-LD updates with it (C4).

**BvRE lines to rewrite (non-exhaustive — sweep the page):** "Bitcoin fixes it" (hero); reversion to 2–3× income "a matter of when, not if"; "the math is inescapable"; "There are only three possible outcomes" (one being a crash); "thirty years of debt servitude"; "finances a bank's profit margin for three decades"; "No amount of fiat appreciation… can disguise"; "Bitcoin is the first instrument in modern history that offers a non-painful path"; "The trend line tells you where this is heading"; the floor tooltip's "every meaningful dip recovered above it" since 2010 (reconcile with `/the-bitcoin-floor`: four breach episodes, deepest ~42.6% below); FAQ answer 1's "the comparison is not close".

**BvRP lines to rewrite:** H1 subtitle and OG/Twitter descriptions "2× the after-tax yield, no tenants, no maintenance"; "the math is not close" (twice); "What you're really buying is your weekends back" (keep the idea, lose the slogan if JM prefers); "structurally inert"; "effectively zero"; plus the other certainty lines in Phase 0 §i-3.

**Heroes (R10, ruled, dash-free per §10.2.1 — C1):**
- BvRE: *"A house didn't used to be an investment. Under sound money it was shelter, bought with savings at two to three years' income. Fiat money turned it into the default savings account. Bitcoin now competes for that role."*
- BvRP subtitle: *"The landlord's comparison: operating costs, tax and exit frictions on one side, the alternative's risks on the other."*

**Dash-rule conflict (C3):** a one-line fix to STYLE_GUIDE §11 in PR 2, pointing its "em-dashes not banned" line to §10.2.1.

**Metadata:** BvRE meta/OG/Twitter "leverage, costs, and taxes included" becomes true after E; until E ships, drop "and taxes". BvRP OG/Twitter descriptions follow the new subtitle. **Preview-first** (social metadata; failures surface only in crawlers). X/LinkedIn card re-scrape owed after merge. OG *images* are not regenerated: Phase 0 §h found no baked-in claim the register pass changes.

## 6 · C — Shared engine

One module at **`src/_includes/_pageassets/shared/real-estate-model.js`**, exposing `window.RealEstateModel` (C6). Plain script concatenated through each page's `page_scripts`, like the other shared modules (no ES modules). Pure functions, no DOM, consumed by both pages. BvRP adds `calculator-helpers.js` (and `modeling-assumptions.js` once D lands) to its include list. It owns:

- **House path:** nominal price path from the nominal appreciation input (M1); 30-year fixed amortisation (principal, interest, balance by year); buyer closing costs, property tax, insurance and maintenance by year (M6); equity; exit value under both bases (M7).
- **Rent path:** starting rent (R3), growth (R4), cumulative rent by year.
- **Bitcoin path:** the four-scenario price path by month (M3); purchases and sales under equal cash out (M2), with the bitcoin transaction cost (M6); BTC held and value by year.
- **Landlord path (BvRP):** net rental cash flow by year, depreciation (27.5-year straight line on the building basis), the existing mortgage (M8), and the four paths' existing mechanics — *moved*, not rewritten, in PR 3.
- **Tax (E):** pure functions per regime; returns pre-tax value, tax by component, after-tax value for each path.
- **Ledger:** one function returning the year-by-year rows both pages render (F).
- **`toCsv(rows, header)`** (P2) and **the pair's Chart.js config** (P2), built once here starting from BvRP's chart (no shared chart helper exists sitewide).

**Refactor discipline:** extraction first, with **byte-identical outputs** asserted on both pages at a fixed set of input vectors (Phase 0 §j; record them in the PR). The harness pins `Date.now()`, the live BTC price, every `ModelingAssumptions` dimension and clears `lcs.bvre.calc.v1` (M10, §j). Behaviour changes (D, E) come in later PRs with before/after tables. No second implementation of any of this math anywhere on the site.

## 7 · D — Harmonised assumptions

Apply R1–R6, M8, M10 and M11 on both pages.

- **One horizon (M10).** Every path runs the same horizon from **today**, in 365.25-day years. (Today BvRE prices bitcoin to 1 Jan of the end year while the house runs the full horizon; Phase 0 §b.)
- **Nominal model (M1).** See R2. The inflation preset no longer changes which path is ahead.
- **BvRP's existing mortgage (M8).** Sale paths repay the balance from proceeds before redeploying. Keep-rental carries it: the amortizing balance comes off equity, debt service comes off cash flow, and interest is deductible against rental income. Add **rate** and **remaining-term** inputs to the baseline block with stated defaults.
- **Retrospective house path (M11).** Retro mode applies **Case-Shiller National** growth from the start year to the starting median price, replacing the MSPUS ratio (`re.js:234`; MSPUS is new-house sales and understates like-for-like appreciation, ~29% vs ~70% for 2017–2025, verify in PR 4). The same fix applies to the static "growth of $1" and "every starting year" exhibits (`re.js:93–220`). The "BTC required to buy the median house" chart may keep MSPUS as a price *level*, labelled "median new house".

One shared **"Baseline assumptions"** block (BvRP's two-tier pattern: set once, then ignore), carrying:
- the deflator (sitewide inflation picker, P5)
- nominal home appreciation (M1 presets)
- mortgage rate and down payment
- buyer closing costs
- property tax, insurance and maintenance
- selling costs and the bitcoin transaction cost
- rent anchor and growth
- BvRP's existing-mortgage rate and remaining term (M8)
- the tax profile (E)

A Real/nominal display toggle sits on both pages (BvRE has one; BvRP gains it). Every changed default gets a `DATA_AUDIT` row and a before/after figure in the PR description, whichever way it moves (§1).

## 8 · E — Tax regime, pre- and post-tax results

**Regime selector** (both pages): *United States* (default) · *No capital-gains tax* · *Custom*.

**United States:**
- *Primary residence (BvRE):* gain = exit price − selling costs − purchase price. **Section 121 exclusion** of $250,000 (single) / $500,000 (married filing jointly), tooltip stating the ownership-and-use test (2 of the 5 years before sale). Gain above the exclusion taxed at the long-term capital-gains rate + state + NIIT where applicable.
- *Rental (BvRP):* the page's existing treatment, **corrected** (M9, Phase 0 §k-12):
  - depreciation recapture at **min(ordinary bracket, 25%)**, never above the gain;
  - depreciation on the **original building basis** derived from adjusted basis;
  - **state tax on rental income**;
  - LTCG, state and NIIT at exit;
  - 1031 not available into bitcoin.

  All of it is computed in the shared module. PR 3 still moves the current math byte-identical; PR 5 corrects it.
- *Bitcoin:* gain = exit value − cost basis, at LTCG + state + NIIT where applicable. **Bitcoin sold during the horizon** (M2 shortfalls) is taxed in the year of sale, average-cost basis, long-term rates; stated in a tooltip (M9). **Holding location** toggle: taxable (default) / tax-advantaged (no tax at exit), with a one-line note that annual contribution limits mean a tax-advantaged account rarely holds a down-payment-sized sum.
- *Inputs:* filing status (new), federal bracket and state (BvRP's existing components, now shared). LTCG rate and NIIT applicability derived from the bracket as an approximation, stated in the tooltip.
- *Mortgage-interest deduction:* off by default, with a tooltip (most households take the standard deduction); available for itemisers.
- **Verify at build (blocking, log in `DATA_AUDIT`):** Section 121 amounts and test; current-year LTCG thresholds and their mapping to ordinary brackets; NIIT rate (3.8%) and thresholds; recapture cap; any 2025–26 legislative changes to any of these. Cite IRS primaries.

**No capital-gains tax:** both paths untaxed at exit (property tax still applies to the house as a carrying cost).

**Custom:** reader sets home-gain rate, home exemption amount (default 0), bitcoin-gain rate.

**Results:** for each path, *If sold*: market value → selling costs → pre-tax proceeds → tax → after-tax proceeds, **after-tax leading** (R8, M7). **The pre-tax view shows no tax anywhere** (M9). Retrospective ("Postponed purchase") mode on BvRE uses the same functions. The "not tax advice" posture is unchanged and repeated beside the selector.

## 9 · F — Results pattern

**Equal cash out (M2; replaces the "Go deeper" DCA).** Both households spend the same amount every month.
- **At purchase**, the renter's bitcoin receives what the buyer pays upfront: down payment **plus buyer closing costs**.
- **Each month**, it receives the owner's all-in cost (P&I + property tax + insurance + maintenance) minus rent. When rent overtakes the owner's cost (rent grows, P&I is fixed), the difference is negative and **the renter sells bitcoin to cover it**, at the scenario's price for that month.
- **Cash purchase** follows the same rule: price plus closing costs at purchase, then carrying costs minus rent each month (negative from the start). **The cash-mode S&P leg is retired** (`re.js:1024–1049`).
- **Toggle: "The renter invests the difference"**, on by default (the like-for-like case). Off means the renter spends it: only the upfront sum goes into bitcoin, and monthly shortfalls come from income. This makes the forced-saving objection testable on the page. The toggle sits **with the results, not in the baseline block** (P6).
- Monthly purchases and sales use the scenario's monthly price path (M3), replacing the geometric path.
- The ledger's **cumulative-cash-out column is identical on both tabs by construction**; the parity check asserts it.

**Two valuation bases (M7):**
- **Held:** market value less debt. No selling costs, no tax.
- **If sold:** less selling costs, then less tax.

**Chart (both pages):**
- **Content:** wealth over time for each path on the pair's shared Chart.js config (P2; BvRP's chart is the starting point, BvRE gains one), with a **Held / If sold (after tax)** toggle, default **If sold**. BvRP's current mark-to-market keep-rental line becomes its Held view.
- **The difference line** is the visual hero, so the reader sees when the paths cross. It is new on both pages; BvRP plots totals today (P4).
- **Floor** is drawn faintly (R1).
- **Full window / first 3 years** toggle on both. It already exists on BvRP, so it's new work on BvRE only (P4). The early years are where the bitcoin path is most likely to be behind, and showing them is the both-sides move.
- The existing stat block stays, beneath the chart.

**Show the calculation (both pages):** a disclosure under the results opening a year-by-year ledger, one row per year, **two tabs**:
- *The house* (BvRE) / *The rental* (BvRP): value, mortgage balance, principal, interest, property tax, insurance, maintenance (BvRP: net cash flow, depreciation), equity, cumulative cash out.
- *Bitcoin + rent* (BvRE) / *Bitcoin path* (BvRP): scenario price, BTC bought or sold, BTC held, value, rent paid (BvRE), contributions or distributions (BvRP), cumulative cash out.
- Final rows per path (M7): market value → selling costs → pre-tax proceeds → tax → after-tax proceeds.
- **CSV download** of both tabs (P2): Blob download per the stress test (`the-bitcoin-retirement-stress-test.js:640–673`, `:981–989`), with the retirement family's `#`-prefixed provenance header and unit-labelled columns; `toCsv` lives in the shared module. An analyst checking the arithmetic in a spreadsheet is the strongest credibility signal the pair can earn.
- Ledger reads from the same engine output as the chart and stat block — one source of truth, verified by the parity check (H).

**Where the results live on BvRE (P7).** The chart and the "Show the calculation" ledger (with CSV) apply to **both** BvRE calculators, explicitly including the **retrospective "Postponed Purchase" calculator on Tab I, the page's default view**, not only the projection. On each, they sit **directly below the result cards and the "renter invests the difference" toggle** (P6), in that order: cards, toggle, chart, ledger disclosure. The chart shows a **per-year tooltip on hover**, as BvRP's does (`interaction: { mode: 'index', intersect: false }`, `rp.js:714`). Its lines are the house path, the bitcoin path and the difference. The retrospective ledger's rows are calendar years from the start year.

**The retrospective runs to today (P8).** The fixed end point (`ey = 2025`, `asOf = 'April 2025'`, `re.js:233`, `:245`) is replaced by **today**:
- **Bitcoin:** the live price, via the shared `fetchTodayPrice`, with its seeded fallback.
- **House:** Case-Shiller National growth from the start year to the **latest published month** (M11). The ledger and cards state that month, since Case-Shiller lags by about two months.
- **Mortgage and rent:** amortisation, rent and equal-cash-out flows run **through the current month**.
- **Ledger:** the last row is a partial year labelled **"to date"**.
- **Static exhibits:** the Tab I–IV exhibits (era bars, divergence, BTC-per-house, growth of $1, every starting year, burden, total cost; `re.js:11–220`) may stay on **annual data through the latest full year**, labelled as such.
- **Refresh:** the Case-Shiller value gets a `MONTHLY_REFRESH_CHECKLIST` line (added with v1.2) and a DATA_AUDIT row when it lands.

This supersedes the earlier "fix the April 2025 label" step (Phase 0 §k-20).

**Copy that a live end point can make stale (P8 check).** Under a fixed 2025 end point, two lines are accurate today. Under a live one, they can flip with bitcoin's price: a 2021 start was about $101K net against about $125K of equity on the page's own formula at 2025 prices. **The PR that ships P8 rewords both:**
- **FAQ answer 1** (`re.njk:19`, and its FAQPage JSON-LD): "Looking back, bitcoin came out ahead for most of the start years the retrospective calculator covers, though not all…" → *"Looking back, the retrospective calculator shows which path came out ahead for each start year it covers, measured to today; the answer depends on the start year and on today's bitcoin price, and the calculator shows the numbers for each one."* The rest of the answer stays.
- **Retrospective intro** (`re.njk:180`): "For most start years in the calculator's range, the historical data show that after a few years you could have bought the house outright…" → *"Pick a start year to see whether, by today, the bitcoin path would have bought the house outright, with no mortgage."* The not-advice sentence stays.

## 10 · G — Sensitivity grid

**A new component** (P1): the 3×3 scenario grid from the retirement design never shipped, so there is nothing to reuse. Build it so the retirement flagship can adopt it later. Layout: a 3×3 grid, reader's configuration in the centre cell, one-click axis-pair toggle (R9). Default axes: **bitcoin scenario (Floor · Stay · Trend) × home appreciation (long run · default · default + 2 points, a housing-boom case)**. Alternative: horizon × mortgage rate (BvRE) / horizon × net rental yield (BvRP). Upper never appears in the grid (M3). Each cell shows the **after-tax difference, If sold** (bitcoin path minus house path) with a sign-neutral colour scale. Caption states what the grid is and is not: a map of how the answer moves with two assumptions, not a probability distribution. Mobile: the grid collapses to a compact table.

## 11 · H — Pair framing, carry, parity, bookkeeping

- **Framing (C1):** one line in each hero and each page's Related card naming the pair:
  - BvRE *"The tenant's side of the decision. For the landlord's side, see Bitcoin vs. Rental Property."*
  - BvRP *"The landlord's side of the decision. For the tenant's side, see Bitcoin vs. Real Estate."*
- **Carry (P3):**
  - **Names:** adopt BvRE's existing URL names (`home`, `horizon`, `mortgage`, `down`, `pscenario`, …) as the pair vocabulary; BvRP reads them; **no prefixes** (SITE_GUIDE §46: adopt an existing name, don't mint a synonym). New quantities get new names, recorded in SITE_GUIDE §46. Nominal appreciation is a new quantity, so it gets a new name.
  - **Legacy `appr`:** a real value, read once, converted using the sitewide inflation, never written again. The page shows one line saying the link used an older format.
  - **Legacy `pscenario`:** values map to the M3 keys.
  - **Cross-link:** a "Run this on the other side" link on each page carries the shared inputs.
- **Series strip (P9).** A shared component, `src/_includes/components/real-estate-series.njk`, following `components/retirement-family.njk` (SITE_GUIDE §53.1):
  - **Styling and heading:** own scoped `<style>` with prefixed selectors and var-with-fallback colours; one include line per page; the component owns its heading; the current page is marked from the page's `slug`.
  - **Place:** at the **top of both pages**, unlike the retirement strip, which sits at the foot of its spokes.
  - **Labels:** questions, not page names. *"Buy or rent?"* (BvRE) · *"Keep the rental?"* (BvRP).
  - **Carries the shared inputs (P3).** The retirement strip's hrefs are plain and can't carry state (§53.1), so this one needs a small script that rewrites its links with the page's current P3 params on load and on input change, via the shared module's URL writer. Without JavaScript the links stay plain. The link targets `#calculator` on the other page.
  - **Growth:** built so the two backlog spokes (Compare Housing Plans; the homeowner's side) slot in as further items.
- **One calculator hash (P9).** Both calculators answer to **`#calculator`**. BvRP already does (`rp.js:1341`). BvRE's calculator tab currently writes `#postponed-purchase`, and `#calculator` is **not** in its hash map (`re.js:409–410`); it only works today because that tab is the default. PR 8 makes BvRE write `#calculator` and keeps reading `#postponed-purchase` (and `#projection`, which selects the projection mode) for existing links.
- **Parity QA:** a tripwire in the house of `evParityQA` / `crpParityQA` (console function on `window`, fixed input-only vectors, identity assertions against the shared module, green PASS / `console.error` FAIL / `console.table`). It asserts:
  1. both pages produce identical house-side and tax figures for identical shared inputs;
  2. ledger totals equal the stat block and chart end-points on each page;
  3. cumulative cash out is identical on both ledger tabs (M2).
- **Bookkeeping:**
  - `SITE_GUIDE`: amend §14 (BvRE) and **create a BvRP section** (none exists, C6).
  - `DATA_AUDIT`: BvRE-*/BvRP-* rows for every changed or new figure.
  - `MONTHLY_REFRESH_CHECKLIST`: lines for any new dated figure (Zillow P/R semiannually).
  - `updates.json` entries.
  - `STYLE_GUIDE` note if the ledger/CSV or grid becomes a house component.
  - The stale docs Phase 0 §k-18 lists (C6).
  - Backlog entry closed with SHAs.

## 12 · Acceptance

- BvRP carries no "NotebookLM", "verification pending" or draft language; every figure has a source or a shown method.
- Neither page states an outcome as certain; the FAQ answer-3 register holds page-wide.
- Identical shared inputs → identical house-side and tax figures on both pages (parity QA passes).
- Equal cash out: cumulative cash out identical on both ledger tabs, every scenario (M2).
- Refactor PR: byte-identical outputs at the recorded input vectors.
- Every changed default: before/after figure in its PR, `DATA_AUDIT` row, tooltip stating its basis.
- The inflation preset changes only the Real display, never which path is ahead (M1).
- Tax figures verified against IRS primaries and logged.
- Ledger totals = chart end-points = stat block, on both pages, all scenarios, both valuation bases — **including BvRE's retrospective** (P7).
- The retrospective ends **today**: live bitcoin, latest Case-Shiller month stated, a "to date" ledger row; no fixed-year copy that a live end point can make wrong (P8).
- The series strip marks the current page, and its links carry the shared inputs to `#calculator` on the other page (P9).
- CSV opens cleanly in a spreadsheet; columns labelled with units.
- Mobile 375px: chart, grid, ledger usable; no horizontal page scroll.
- No console errors; social cards serve `image/jpeg` after deploy; re-scrape done.

## 13 · Sequence and timing

**PRs 1–3 don't depend on the M, P and C rulings** (apart from C1 and C3–C4, which PR 2 applies). PRs 4–8 apply them (rulings §1).

| PR | Content | Changes figures? | Before Tuesday 2026-09-29? |
|---|---|---|---|
| 0 | Phase 0 read-only report + rulings folded in | No | Yes |
| 1 | BvRP sourcing + factual fixes (A) | Some (restated claims) | **Yes — priority** |
| 2 | Register pass both pages + metadata (B, C1, C3, C4); stacks on PR 1 | No | **Yes** |
| 3 | Shared engine extraction (C), byte-identical | No | Stretch |
| 4 | Harmonised assumptions (D: M1, M3–M6, M8, M10, M11, P5, C7) | Yes | No |
| 5 | Tax regime + pre/post-tax (E: M9, M7 headline) | Yes | No |
| 6 | Chart + ledger + CSV + equal cash out, on both BvRE calculators; retrospective to today (F: M2, M7, P2, P4, P6, P7, P8) | Yes (M2, P8) | No |
| 7 | Sensitivity grid (G: P1) | No | No |
| 8 | Pair framing, carry, series strip, one hash, parity QA, bookkeeping (H: C1 pair lines, P3, P9) | No | No |

PRs 1 and 2 are copy/sourcing only and make both pages safe to share on Tuesday. PRs 3–8 are the build.

## 14 · Amendment log (v1 → v1.1, 2026-09-27)

Each change is listed with the ruling it applies (`REAL_ESTATE_PAIR_RULINGS.md`).

| # | Section | Change | Ruling |
|---|---|---|---|
| 1 | Header | Header states the doc promotes a chat-side backlog capture, not a repo file (Phase 0 housekeeping, JM 2026-09-26). v1.1 note added. | — |
| 2 | §1 | Governing principle clarified: judgment calls lean against the thesis; measurable facts use the best-sourced central figure; every default change disclosed. Was: "defaults lean against the page's thesis" for every default. | §0 |
| 3 | §2 | Scope D/F reworded to include the nominal model, costs, existing mortgage, one horizon, equal cash out and the two valuation bases. Monte Carlo fence recited to `PAGE_IDEAS_BACKLOG.md:568` and `COMPARE_RETIREMENT_PLANS_DESIGN.md:178`. Zelman variant and sitewide real-return fix fenced out and logged to TECH_DEBT. Power Law module path made explicit. | C5, §6 |
| 4 | §3 R1 | Default **Trend → Stay at today's multiple**. All four scenarios on linear multiple interpolation; Upper target fixed at 2.5×; Trend tooltip; Upper never in the grid; implied growth rate beside the selector; above-trend copy review. | M3 |
| 5 | §3 R2 | Was: real appreciation, presets long-run / recent decades / "generous" 3.5%, default recent decades, wired to the real `realEstate` picker. Now: **nominal** input, presets Long run ~3% / Since 1990 ~4.2% / **Since 2000 ~4.8% (default)** / Custom; inflation affects only the Real display; `realEstate` replaced by a nominal dimension with a one-time conversion; BvRP's 3.0% absorbed. | M1 |
| 6 | §3 R3 | Was: a sourced anchor, Phase 0 proposes. Now: **Zillow ZORI ÷ ZHVI** (P/R 15.8, $2,219 on $420K at Aug 2026), semiannual refresh; retro method proposed in PR 4. | M4 |
| 7 | §3 R4 | Added: rent computed nominally and deflated like every other stream. | M5 |
| 8 | §3 R5 | Was: keep sitewide inflation as a model input plus a line on the mortgage holder's inflation benefit. Now: inflation is the **deflator only**, shown in the baseline block and named in the Real label; line rewritten for the nominal model. | M1, P5 |
| 9 | §3 R6 | Was: one shared 6% selling cost. Now: sourced selling-cost midpoint; new buyer closing costs; carrying costs sourced, as % of current value, insurance growing; new 0.5% bitcoin transaction cost. | M6 |
| 10 | §3 R7 | Confirmed as recommended. | M9 |
| 11 | §3 R8 | Headline specified as **If sold**, after tax leading. | M7 |
| 12 | §3 R9 | Default axes specified: scenario (Floor · Stay · Trend) × appreciation (long run · default · default + 2 pts); cells after-tax If sold. | P1 |
| 13 | §3 R10 | Heroes replaced by the dash-free ruled text. | C1 |
| 14 | §3 | "Rulings with no R-number" list added (M2, M8, M10, M11, P2–P6). | M2, M8, M10, M11, P2–P6 |
| 15 | §4 | PR 1 guidance added: copy/static/DATA_AUDIT only; cutting beats weak sourcing; $500K table assumptions and ROC fix; cash-reserve reconciliation; SATA tense; "v0.3 caveats" label; catch-all sources line. | rulings §5 |
| 16 | §5 | Capitalisation cited to SITE_GUIDE §28. Target register = FAQ answer 3; answer 1 in the sweep with JSON-LD. STYLE_GUIDE §11 dash one-liner added. OG images confirmed not regenerated. | C1–C4 |
| 17 | §6 | Module path and global fixed; `toCsv` and the pair chart config added to the module; harness pins listed. | C6, P2, M10 |
| 18 | §7 | Rewritten: one horizon, nominal model, BvRP existing mortgage, retro Case-Shiller path, expanded baseline block. | M1, M4–M6, M8, M10, M11, P5 |
| 19 | §8 | BvRP tax "existing treatment, corrected"; bitcoin sold in-horizon taxed; results in If sold order; pre-tax view shows no tax. | M7, M9 |
| 20 | §9 | Equal cash out added (replaces "Go deeper" DCA, retires cash-mode S&P leg); M2 toggle with the results; Held / If sold bases and chart toggle; zoom and difference line scoped; CSV spec fixed to Blob download; ledger final-row order. | M2, M7, P2, P4, P6 |
| 21 | §10 | Grid is a new component; axes and cell metric specified. | P1 |
| 22 | §11 | Pair lines specified; URL vocabulary (no prefixes, legacy `appr`/`pscenario` handling); parity tripwire shape and third assertion; BvRP SITE_GUIDE section created, not amended. | C1, P3, C6, M2 |
| 23 | §12 | Acceptance adds equal cash out, inflation-as-display-only and both valuation bases. | M1, M2, M7 |
| 24 | §13 | Sequence notes rulings dependency; PR rows tagged with the rulings each applies; PR 6 now changes figures (M2). | rulings §1 |

### v1.1 → v1.2 (2026-09-27, rulings P7–P9)

| # | Section | Change | Ruling |
|---|---|---|---|
| 25 | Header | v1.2 note added. | P7–P9 |
| 26 | §3 | P7, P8, P9 added to "Rulings with no R-number". | P7–P9 |
| 27 | §9 | Chart and ledger (with CSV) apply to **both** BvRE calculators, including the retrospective on the default tab; placed directly below the result cards and the M2 toggle; per-year hover tooltip as on BvRP. | P7 |
| 28 | §9 | The retrospective runs to **today** (live bitcoin, latest Case-Shiller month, mortgage and rent through the current month, "to date" ledger row); static exhibits may stay annual through the latest full year, labelled. **Supersedes** Phase 0 §k-20's "fix the April 2025 label" (C6). Case-Shiller line added to `MONTHLY_REFRESH_CHECKLIST`. | P8 |
| 29 | §9 | P8 staleness check: FAQ answer 1's "most, though not all" and the retrospective intro's "For most start years…" can flip under a live end point. Replacement wording recorded, to ship with P8. | P8 |
| 30 | §11 | Series strip: `components/real-estate-series.njk` after the retirement strip (§53.1), top of both pages, question labels, current page marked. It carries the P3 inputs via a small link-rewriting script, since the retirement strip's plain hrefs can't. | P9 |
| 31 | §11 | One calculator hash: both calculators answer to `#calculator`. BvRE writes it and keeps reading `#postponed-purchase` and `#projection`. | P9 |
| 32 | §12 | Acceptance adds: BvRE retrospective in the parity check; retrospective ends today with no stale fixed-year copy; strip carries inputs. | P7–P9 |
| 33 | §13 | PR 6 row adds P7 and P8 (and now changes figures for P8); PR 8 row adds P9. | P7–P9 |
