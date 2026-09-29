# REAL_ESTATE_PAIR_RULINGS — rulings on the Phase 0 report (PR #121)

_2026-09-26. Drafted chat-side from `REAL_ESTATE_PAIR_PHASE0_REPORT.md` and a read of the code on `chore/real-estate-pair-phase0`; approved by JM by sending this file to Claude Code. Where these rulings and `REAL_ESTATE_PAIR_DESIGN.md` differ, the rulings win. Section references (§a–§k) are to the Phase 0 report; R1–R10 are the spec's rulings._

---

## 0 · The governing principle, clarified

The spec says every default leans against bitcoin's case. Phase 0 shows that rule can't settle everything: selling costs help bitcoin's case on BvRE and hurt it on BvRP, so direction alone can't pick one shared value. Clarified:

- **Judgment calls lean against the thesis.** The default bitcoin scenario, whether reversion is assumed, which recorded appreciation window is the default, the rent-growth rule, the chart's default valuation basis.
- **Measurable facts use the best-sourced central figure, even when the correction helps bitcoin.** Rent level, carrying costs, closing and selling costs, tax law, the recorded home-price series. A housing analyst checks facts; a figure bent in either direction costs the credibility the pair exists to earn.
- **Every change to a default figure is disclosed** with a before/after table in its PR, whichever way it moves.

## 1 · Sequencing

- **PR 1 and PR 2 do not depend on these rulings.** They go now; PR 2 stacks on PR 1. Both must be mergeable before Tuesday 2026-09-29.
- **PR 3** (byte-identical extraction) doesn't depend on them either.
- **PRs 4–8** apply the M, P and C rulings below.

---

## 2 · Model rulings (these change figures)

### M1 · The house path is nominal (replaces R2 and R5)

**Finding.** BvRE converts a real appreciation rate (3.5%, the `recent-decades` preset) to nominal using the sitewide inflation default (6.5%, M2 growth), giving **10.23% nominal home growth** (§e). The recorded nominal rate is about half that: Case-Shiller National **~4.8% (2000–2024)** and **~4.2% (1990–2025)** (§f). The preset's stated basis, DATA_AUDIT RE-2 "~3.7% real", doesn't reproduce (~2.2% CPI-real), and STYLE_GUIDE §3.5's line "At 6.5% M2 inflation, ~10% nominal — close to the 2000–2024 actual nominal experience" is incorrect. A CPI-real rate is being re-inflated at M2. The ledger JM asked for would show a house compounding at ~10% a year to the first analyst who opens it.

**Ruling.**
- Home appreciation becomes a **nominal** input on both pages. House, rent, mortgage and costs are computed in nominal dollars. Bitcoin prices are already nominal. **Inflation affects only the Real display**, deflating both paths by the same factor, so the inflation preset no longer changes which path is ahead.
- **Presets (nominal):** Long run (Shiller, 1890 to latest year, ~3%) · Since 1990 (~4.2%) · **Since 2000 (~4.8%) — default** · Custom. Since 2000 is the highest recorded window, which is the judgment call leaning against the thesis. Re-verify every value in PR 4 against FRED `CSUSHPINSA` and Shiller's own file (http://www.econ.yale.edu/~shiller/data.htm), end point = latest full year; DATA_AUDIT rows for each.
- BvRP's hardcoded 3.0% (`rp.js:131`) becomes this shared input.
- **`realEstate` dimension:** BvRE is its only consumer and no picker exists (§k-6). Replace it with a nominal dimension; Claude Code proposes the key and migration. A stored `custom` real value is converted once at read time using the sitewide inflation, and the page says so in one line.
- **Correct** DATA_AUDIT RE-2 and STYLE_GUIDE §3.5's real-estate table and rationale in PR 4.
- **R5's sentence, rewritten** for the nominal model: *"When inflation runs higher, home prices tend to rise in nominal terms while a fixed-rate loan balance doesn't. That is the fixed-rate borrower's inflation benefit. To model a higher-inflation future, raise nominal appreciation."*
- This correction moves results toward bitcoin. It is a correction of a construction error, not a default choice, so §0 applies. Report the before/after plainly.

### M2 · Equal cash out (§k-1; replaces the "Go deeper" DCA)

**Finding.** BvRE nets all rent off bitcoin but no carrying costs off the house; the DCA invests only P&I − rent ($548/mo) while the all-in gap is $1,118 ($1,468 with maintenance) (§b, §c).

**Ruling.** Both households spend the same amount every month.
- **At purchase,** the renter's bitcoin receives what the buyer pays upfront: down payment **plus buyer closing costs** (M6).
- **Each month,** it receives the owner's all-in cost (P&I + property tax + insurance + maintenance) minus rent. When rent overtakes the owner's cost (rent grows, P&I is fixed), the difference is negative and **the renter sells bitcoin to cover it**, at the scenario's price for that month.
- **Cash purchase** follows the same rule (price + closing costs at purchase; carrying costs − rent monthly, negative from the start). **Retire the cash-mode S&P leg** (`re.js:1024–1049`): the rule does its job, and it re-inflates a real return at M2 (the M1 pattern).
- **Toggle: "The renter invests the difference"** — on by default (the like-for-like case). Off = the renter spends it: only the upfront sum goes into bitcoin, and monthly shortfalls come from income. This makes the forced-saving objection testable on the page.
- The ledger's cumulative-cash-out column is **identical on both tabs by construction**; the parity check asserts it.
- Monthly purchases and sales use the scenario's monthly price path (M3), replacing the geometric path.

### M3 · Default bitcoin scenario: Stay at today's multiple (amends R1 and §k-7)

- **Set, both pages:** Floor · Stay at today's multiple · Trend · Upper. All use linear interpolation of the multiple from today's value to the target at the horizon end (§k-7). **Upper target 2.5×.**
- **Default: Stay at today's multiple.** It grows at the trend's own rate and assumes no reversion. The Hurdle Rate page makes reversion-to-trend opt-in with its assumption stated (backlog, *Channel-position-aware hurdle*); making it the default here would contradict that, and while bitcoin sits below trend, reversion is the more favourable assumption.
- **Trend** is selectable, with the tooltip: *"Assumes the gap to trend closes in a straight line by the horizon end. In the record, reversion has been irregular in timing."*
- **Floor** is drawn faintly on every chart. **Upper** is selectable, never the default and never in the grid; its tooltip keeps the brief-peak caveat.
- Show the selected scenario's **implied annual growth rate** beside the selector.
- Labels stay position-neutral; review copy at a simulated above-trend position before shipping (Hurdle Rate v2 rule).

### M4 · Default rent: Zillow (R3 → candidate B)

- Default rent = home price ÷ (12 × price-to-rent), with price-to-rent from **Zillow ZORI (all homes) and ZHVI (typical value, middle tier), US**. At August 2026 values: P/R 15.8, rent $2,219 on a $420K home (§g).
- **Why:** the closest like-for-like pair of the three; the highest rent of the three (leans against the thesis); and it reproduces Zelman's public ~$800–900 own-vs-rent gap once maintenance is counted ($891).
- DATA_AUDIT row with values and dates; refresh **semiannually**. User override kept.
- The $420K default home price stays; PR 4 sources it (existing-home median or MSPUS, whichever it tracks) and states the basis.
- **Retrospective mode** needs historical rent: use Zillow's historical P/R where it exists (ZORI's history begins around 2015) and a CPI-rent backcast for earlier start years. Claude Code proposes the method in PR 4 and reports before/after. The current 75%-of-P&I rule gives 2017 rent of $926 on a $323,500 house (P/R ≈ 29), well below market.

### M5 · Rent path (R4 + §k-2)

Rent grows at the house's nominal appreciation rate (constant price-to-rent; historically rents grew more slowly than prices, so this leans against the thesis). Rent is computed nominally and deflated like every other stream in the Real view, which removes the ~$92K Real/Nominal gap. Exposed as an input.

### M6 · Costs at purchase, while owning, and at sale (R6 + §k-8 + §k-19)

- **Buyer closing costs** (new): sourced default as % of price; input. Under M2 the renter invests the same sum.
- **Property tax, insurance, maintenance:** sourced defaults with DATA_AUDIT rows (§k-19). Property tax and maintenance as **% of current home value** (the page's own footnote says so; the code uses purchase price); insurance grows with home value.
- **Selling costs:** one shared default, sourced to post-2024 commission data plus seller closing costs; **if the sources give a range, use its midpoint.** Input 0–10%. Applied on both pages at sale. (§0: direction can't decide this one.)
- **Bitcoin transaction cost** (new): 0.5% on each purchase and sale (spread and fees), input 0–2%, so one side isn't charged and the other free.

### M7 · Two valuation bases (R8, spec §9)

- **If held:** market value less debt. No selling costs, no tax.
- **If sold:** less selling costs, then less tax.
- **Headline:** *If sold*, after tax leading, pre-tax beside it, the tax line between (R8 unchanged). Because selling costs sit in both figures, the pre→post difference is tax alone, and the Section 121 exclusion shows as its own number.
- **Ledger final rows per path:** market value → selling costs → pre-tax proceeds → tax → after-tax proceeds.
- **Chart:** Held / If sold (after tax) toggle, default If sold. BvRP's current mark-to-market keep-rental line becomes its Held view.

### M8 · BvRP's existing mortgage applies on every path (new; §d)

**Finding.** Paths 1, 3 and 4 redeploy sale proceeds without repaying the $200K existing mortgage (`rp.js:235–272`, `:352–362`), and keep-rental ignores it too. At defaults this overstates the bitcoin paths, because the unrepaid $200K compounds at bitcoin's rates.

**Ruling.** Sale paths repay the balance from proceeds before redeploying. Keep-rental carries it: the amortizing balance comes off equity, debt service comes off cash flow, and interest is deductible against rental income. Add rate and remaining-term inputs to the baseline block with stated defaults.

### M9 · Tax (R7 + §k-12)

- R7 as recommended: United States, married filing jointly, 24% bracket, typical state (~5%), bitcoin in a taxable account.
- §k-12 corrections in PR 5: recapture at min(ordinary bracket, 25%) and never above the gain; depreciation on the original building basis derived from adjusted basis; state tax on rental income.
- **Bitcoin sold during the horizon** (M2 shortfalls) is taxed in the year of sale, average-cost basis, long-term rates; stated in a tooltip.
- The pre-tax view shows no tax anywhere.

### M10 · One horizon (§k-7, finding 9)

Every path runs the same horizon from today, in 365.25-day years. The harness pins `Date.now()` (§j).

### M11 · Retrospective house path uses a repeat-sales index (new; §f)

**Finding.** Retro mode grows the house by the ratio of MSPUS medians (`re.js:234`). MSPUS is the median price of *new* houses sold; its mix shifts, so it understates like-for-like appreciation. From 2017 to 2025 it rose about 29%, against roughly 70% for Case-Shiller National (verify in PR 4).

**Ruling.** Retro's house path applies **Case-Shiller National** growth from the start year to the starting median price. The same fix applies to the static "growth of $1" and "every starting year" exhibits (`re.js:93–220`). The "BTC required to buy the median house" chart may keep MSPUS as a price *level*, labelled "median new house".

---

## 3 · Presentation and plumbing rulings

- **P1 · Grid (R9, §k-3).** New component, built so the retirement flagship can adopt it later. Default axes: bitcoin scenario (Floor · Stay · Trend) × home appreciation (long run · default · default + 2 points, a housing-boom case). Alternative: horizon × mortgage rate (BvRE) / horizon × net rental yield (BvRP). Cells show the after-tax difference, If sold.
- **P2 · CSV and chart (§k-5).** Blob download per the stress test, with the family's `#`-prefixed provenance header and unit-labelled columns; `toCsv` lives in the shared module. No shared chart helper exists: build the pair's chart config once in the shared module, starting from BvRP's Chart.js chart.
- **P3 · URL vocabulary (§k-9).** Adopt BvRE's existing names as the pair vocabulary; BvRP reads them; no prefixes. New quantities get new names, recorded in SITE_GUIDE §46. Nominal appreciation is a new quantity, so it gets a new name. A legacy `appr` (real) is read once, converted using the sitewide inflation, never written again, and the page shows one line saying the link used an older format. Legacy `pscenario` values map to the M3 keys.
- **P4 · Chart zoom and difference line (§k-10, §k-11):** accepted as Phase 0 proposed.
- **P5 · Deflator (from M1).** Show the sitewide inflation picker (CPI / M2 growth / custom) in the pair's baseline block. The Real label names the deflator: *"today's dollars, deflated at X% a year (M2 growth)"*.
- **P6 · The M2 toggle** sits with the results, not in the baseline block: it's a question about behaviour, not about the world.

## 4 · Copy and docs rulings

- **C1 · Heroes (R10), dash-free per STYLE_GUIDE §10.2.1:**
  - BvRE: *"A house didn't used to be an investment. Under sound money it was shelter, bought with savings at two to three years' income. Fiat money turned it into the default savings account. Bitcoin now competes for that role."*
  - BvRP subtitle: *"The landlord's comparison: operating costs, tax and exit frictions on one side, the alternative's risks on the other."*
  - Pair lines (PR 8): BvRE *"The tenant's side of the decision. For the landlord's side, see Bitcoin vs. Rental Property."* · BvRP *"The landlord's side of the decision. For the tenant's side, see Bitcoin vs. Real Estate."*
- **C2 · Capitalisation (§k-13):** cite SITE_GUIDE §28 in the prompts; promoting the rule to STYLE_GUIDE is logged to TECH_DEBT.
- **C3 · Dash-rule conflict (§k-14):** one-line fix to STYLE_GUIDE §11 in PR 2, pointing to §10.2.1.
- **C4 · FAQ (§k-15):** answer 1 is in the sweep ("the comparison is not close" goes); the target register is answer 3; the FAQ JSON-LD updates with it.
- **C5 · Monte Carlo citation (§k-4):** cite `PAGE_IDEAS_BACKLOG.md:568` and `COMPARE_RETIREMENT_PLANS_DESIGN.md:178`.
- **C6 · Accepted as proposed:** §k-16 (module at `src/_includes/_pageassets/shared/real-estate-model.js`), §k-17 (create a BvRP SITE_GUIDE section), §k-18 (stale docs in PR 8), §k-20 (retro "April 2025" label fixed in PR 6; a 2026 data refresh logged).
- **C7 ·** DATA_AUDIT RE-2 and STYLE_GUIDE §3.5 corrected in PR 4 (M1).

## 5 · PR 1 guidance (additions to Prompt 1)

- **Cutting beats weak sourcing.** The page is long; fewer, sourced claims serve a research reader better than many unsourced ones. A US claim sourced to a UK survey (Property118) needs a US source or goes.
- **$500K side-by-side table:** state its assumptions (an unencumbered $500K property; the sale is taxed, so the portfolio starts from after-tax proceeds, ~$411K); fix the ROC arithmetic (§i-3); name the spot slice's growth scenario, computed from the Power Law module.
- **Cash reserve:** reconcile "roughly 6 months" with the USD Reserve in Strategy's latest filing; show the as-of date.
- **SATA:** the June 16, 2026 change is past; fix the tense and verify the current rate and schedule.
- **Draft framing:** remove the Methodology intro's draft sentence and the "v0.3 caveats" label.
- **Catch-all sources line** (`rp.njk:828`) lists only what the page actually cites.
- **Engine issues stay out of PR 1.** M1–M11 are PRs 3–5. PR 1 changes copy, static figures and DATA_AUDIT only.

## 6 · Out of scope — log to TECH_DEBT

- **Sitewide real-return conversion.** `realReturns` presets are CPI-real (STYLE_GUIDE §3.5's decomposition cites Damodaran), but pages convert them to nominal with the sitewide M2 inflation (e.g. BvRE's cash-mode S&P leg, retired by M2). Check the retirement family's use of `realReturns` for the same pattern; audit separately.
- **Promote the capitalisation rule** to STYLE_GUIDE (C2).
- **Zelman companion variant**: separate decision after PR 8.

## 7 · PR 4 source rulings (JM, 2026-09-28)

Sources, computations and reasoning are in **`REAL_ESTATE_PAIR_PR4_SOURCES.md`**; re-derive any figure with `scripts/verify-real-estate-sources.py`. These rulings amend §2 where they differ.

- **M1 presets, verified to the latest full year (2025):** Long run **3.41%** · Since 1990 **4.23%** · **Since 2000 4.68% (default)**. §2's "~3%" and "~4.8%" were approximations; the ~4.8% came from a window ending in 2024. Since 2000 is still the highest of the three, so the default still leans against the thesis. The Shiller/Case-Shiller splice was checked, not assumed (the two agree to within 0.06% over 1990–2022).
- **DATA_AUDIT RE-2 is wrong** (claims ~3.7% real for 2000–2024; the primary gives **2.19%**). **RE-1** corrects to **0.59%** real, 1890–2022 (Shiller's own real index); state the window.
- **M4:** P/R **15.77** (Zillow, Aug 2026), unchanged from Phase 0.
- **Default home price $415,000** — the 2025 MSPUS average ($415,400), the latest full year, the same end-point rule as M1. Default rent on it: **$2,193/mo**. Page states the basis: median price of *new* houses sold (Census/HUD).
- **M6 costs:** property tax **0.90%** of current value (ATTOM, 2025) · insurance **$2,490/yr** for $400K dwelling, growing with value (Quadrant via NerdWallet, May 2026) · **selling costs 6.6%** (5.6% commission midpoint + 1% seller closing, the 1% stated as an estimate) · **buyer closing costs 1.1%** (Lodestar 2025; transfer-tax caveat stated) · **maintenance 1%** of current value, recorded in DATA_AUDIT as a rule of thumb with no primary.
- **Item 12 (Prompt 4) — the Ledn slice:** becomes a generic **"Stablecoin lending"** slice at **4.0%** (ordinary income), naming no platform. Ledn is unavailable to US residents today (BvRP-18). A slider tooltip and a short disclosure under the calculator list **the verifiable rates this month** (3-month T-bill as the reference; Sky, Aave and Compound base rates; Ledn marked not-US), carry the line that lending currently pays about the T-bill rate so its extra risks are unpaid, and are refreshed monthly from the script. The $500K example table follows; the CeFi prose that names platforms as examples stays.
- **Direction, per §0:** property tax and the Ledn slice move results toward the house; insurance, selling and buyer closing costs toward bitcoin. PR 4 reports every one in its before/after table.
- **Implementation note (PR 4b, 2026-09-28; not a new ruling).** Buyer closing costs are implemented at **1.04%**, not 1.1%: the 1.1% was $4,661 ÷ $420K from LodeStar's older report, while LodeStar itself states 1.04% of price for calendar-2025 purchases, *including* transfer taxes (so the "transfer-tax caveat" reverses). Lower and better sourced; say if you want 1.1% back (one line in `PAIR_DEFAULTS`). Correction details: `REAL_ESTATE_PAIR_PR4_SOURCES.md` § M6.

## 8 · Ruling during PR 4c (JM, 2026-09-28)

- **No "the Power Law fails" scenario.** Asked chat-side while building 4c: every M3 scenario assumes the Power Law trend continues (at BTC $100,000 today, even Floor implies about 24% a year over the next ten years, and Stay about 29%), so should the pair add one where the reader sets bitcoin's growth? **Ruled no.** That the Power Law broadly holds over time is a key assumption, stated rather than modelled around: a reader who doesn't accept it should set the projections, and the thesis, aside. The pages state it: the projection's opening note (*"an empirical observation … not a guarantee"*), the scenario tooltips on both pages (*"All four scenarios assume the Power Law trend itself continues"*), and BvRP's model-simplifications note. This ruling covers the pair; TECH_DEBT §7's *linear-CAGR-with-decay* item for the retirement calculator is a separate question.

## 9 · Implementation notes, PR 4d (2026-09-28; not new rulings)

- **M8 defaults, stated on the page** (`RENTAL_DEFAULTS`; DATA_AUDIT BvRP-27): balance **$200,000 per property** (40% of the $500K default; FHFA's NMDB puts the average outstanding mortgage at 45% of its home's value, Q1 2026); rate **4.4%**, the average on outstanding US mortgages (NMDB, Q1 2026), with a line that rental-property loans usually cost more; **20 years left**, derived from a 30-year loan taken when the property was bought (the page's "years already held" default, 10). The mortgage is per property, so Path 3 repays the sold ones and carries the kept ones. If a sale doesn't cover the balance, nothing is deployed and the shortfall counts against the path.
- **Item 12:** implemented as ruled. The disclosure's ruled line keeps its wording with spaced en dashes in place of em dashes (STYLE_GUIDE §10.2.1).
- **A bug fixed alongside, disclosed as a boundary-cross:** the rental sale's state tax read `STATE_CAPGAIN[code] || OTHER`, so the nine states with no tax on the gain (rate 0) were charged the 5% typical rate. One line, its own commit; it moves results toward bitcoin for readers in those states. Found by the independent model written to check 4d.
