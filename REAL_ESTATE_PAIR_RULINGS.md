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

## 10 · The retrospective, PR 4e (JM, 2026-09-28; with implementation notes)

**Rulings.** Asked chat-side while building 4e, JM approved three recommendations ("Go with your recommendations"):
- **P8 moves up from PR 6:** the retrospective runs to today, month by month. PR 6 keeps the chart, the ledger and the CSV.
- **Bitcoin is bought at the start year's average price**, as the page did, and the monthly flows start in July of the start year.
- **Rent:** the level from Zillow's price-to-rent ratio for the start year (a CPI-rent backcast for 2014, since ZORI begins in 2015); its growth from Zillow's market rent index (ZORI).

**Implementation notes (not new rulings; each is disclosed in the PR 4e description).**
- **The end is today, as P8 says:** bitcoin at today's price (the shared `fetchTodayPrice`), the house at the latest Case-Shiller month (June 2026 at this writing; the page names it), flows through the current month. The house's value therefore lags bitcoin's by the index's two months; housing moves slowly enough that this is stated rather than modelled.
- **The start year's average price is the mean of `PL_DATA`'s samples in that year**, close to the daily average, not `btcData`, which is a mean of month-end closes and is wrong for 2013, 2022 and 2025 (TECH_DEBT). For the start years the page offered before 4e (2014–2021) the two agree within 3%, except 2017, a ×13 year: $3,967 against $4,348, which moves the 2017 result toward bitcoin. A measurable fact, so §0 takes the better-defined figure; reported with its direction.
- **Monthly flows** buy or sell at the price each month opened at (the previous month's close, `BTC_MONTHLY`).
- **The house** is bought in July at the start year's median new-house price (`homeData`) and grows by Case-Shiller from July (M11). Property tax, insurance and maintenance follow that value, reset each July, at `PAIR_DEFAULTS`' rates (M6): today's rates applied to every year (TECH_DEBT).
- **Rent** resets each July to the start rent × ZORI(July) ÷ ZORI(July of the start year). Market rents rose faster than the rents all tenants pay (July 2020 to July 2022: ×1.23 against CPI rent's ×1.08), so a yearly reset to market leans against the renter.
- **Equal cash out (M2)** works as in the projection, with its toggle beside the results ("The renter invests the difference", URL `rinv`). The "Go deeper" DCA and the Total Comparison are retired, and `dca` is dropped from links and storage.
- **Scope added, easily reverted:** start years run to 2024 (was 2021, which left four years to the fixed 2025 end; 2025 waits for its annual data to be settled); the retrospective's method toggle and custom inputs travel in links (`rmethod`, `rhome`, `rrent`, `rrate`, `rdown`), so a shared link keeps its author's case, but not in storage, as before 4e; the projection takes the same shared price (its fallback was a hardcoded $84,000, now the latest `PL_DATA` sample).
- **Fixed after an independent review of the PR (all disclosed there):** the cards' words now follow the numbers in every case, on both calculators (the rent line says how much came from bitcoin sales; the monthly line covers either sign with the toggle on or off; when the renter's bitcoin runs out, the cards and the cash-out line say when and no longer say both households paid the same); the projection's bitcoin price is no longer kept from a browser-restored value or overwritten after the reader types one; and the page writes numbers into its inputs in US format, since a German-locale browser made the projection run on a $415 house and $84 bitcoin (a bug that predates the pair build).
- **Copy (design §9's P8 check):** FAQ answer 1 and the retrospective intro take the recorded wording. The static exhibits moved to Case-Shiller with M11; The Gallery's "outperformed … by orders of magnitude", false for starts from 2018, now reads "ended ahead … by a wide margin from the early years, a narrower one from the later ones".
- **Direction (§0), one change at a time** from 4e's result for a 2017 start, 20% down, BTC pinned at $100,000 (bitcoin ahead by $1.33M): market rent (M4) moves it **toward the house by $910.6K**; Case-Shiller (M11) toward the house by $94.1K; investing the difference (M2) toward the house by $49.9K; the sourced costs (M6, including 6.6% selling and 0.5% trading) toward bitcoin by $137.0K; the daily-average entry price toward bitcoin by $149.1K; and running to today (P8) toward bitcoin by $171.4K at $100,000, but toward the house by $204.3K at $77,219 (the latest data sample), since the old end valued bitcoin at an April 2025 snapshot of $88,000. For a 2021 start the house now comes out ahead at either price.

## 11 · Implementation notes, PR 4f (2026-09-29; not new rulings)

- **Headline wording (JM, 2026-09-29).** When keeping the rental wins, BvRP's headline no longer says *"The decision is close"* (it did however large the gap); it keeps *"Try adjusting the bitcoin scenario, holding period, or path."* Text only.

Slice 4f is Prompt 4's last: the rental page's Real view (P5) and one Baseline assumptions block on both pages (design §7, Prompt 4 item 10), with harness vectors for the Real view and the first half of design §11's parity check. Records in SITE_GUIDE §14 ("The pair's shared Baseline assumptions").

- **One block, in the parts the pages share.** Home appreciation and the deflator are sitewide (`ModelingAssumptions`), so both pages now take their words and preset buttons from one file (`components/real-estate-baseline.njk`) and are bound by one script (`shared/real-estate-baseline.js`); they come first in each page's block, and each page keeps its own layout (BvRE's fields, BvRP's slider cards). The other groups stay page-specific because the pages' inputs differ: BvRE's purchase, rent and owner's costs; BvRP's tax profile, property facts, existing mortgage and HELOC. Selling costs and the bitcoin cost keep their own tooltips, since BvRP charges the bitcoin cost on purchases only until PR 6 adds the If sold basis. The tax profile joins the shared part in PR 5.
- **The deflator lives in the engine:** `RealEstateModel.deflator` and `toReal`. BvRE's projection uses it with the same expression as before, so no BvRE figure moves.
- **BvRP's Real view.** The chart (each year by its own factor), the headline difference, the chips' differences and the table's N-year totals follow the toggle. The chips' growth rates, the year-1 and cumulative cash flows, the mortgage row and the path card's mechanics stay nominal, as paid, and say so in the Real view; the path card gives the factor for its year-N values. The model's cash is idle (summed at face value, as before), so in the Real view it loses purchasing power at the deflator's rate on every path; the model notes now say so.
- **Default: Real, as on BvRE** (confirmed by JM, 2026-09-29, with the ask to make it plain: the line under the toggle, on both pages, now says which view is showing and gives a worked example at the deflator in force, *"$100,000 ten years from now buys what $53,273 buys today, so Real shows $53,273 where Nominal shows $100,000"* at M2 growth, and one shared help tip explains Real and Nominal; to change the default, `state.displayMode` and the markup's active button). It changes the figures a reader sees first, not the model or which path is ahead. At the defaults (Path 4, Stay, on the harness's date, 2026-09-27; Stay's result doesn't depend on bitcoin's price) the headline reads "$48.9K more asset value in today's dollars" where the Nominal view reads "$91.8K"; the 10-year totals are $392,347 and $441,228 against $736,490 and $828,246 (deflated at 6.5%, M2 growth; at CPI's 3.5% the difference is $65.0K).
- **Copy on both pages, from the one file:** the appreciation tooltip carries the ruled R5 sentences and the "national index" caveat on both pages (each had one of them), and names the other page; the deflator tooltip now says what the presets are (CPI about the long-run official rate; M2 growth, the default, about the 50-year growth of the money supply; Shadow Stats a disputed reconstruction). The deflator's field is always shown, like appreciation's (BvRE showed it for Custom only). The index is named S&P Cotality Case-Shiller, its name since CoreLogic became Cotality in 2025.
- **Fixed in passing:** on BvRE, text in the appreciation field that couldn't be read ran the projection at 0% until the next edit; it is now put back. On BvRP, the appreciation notice was set at body size (a page-wide paragraph rule outranked it).
- **Not in 4f:** the retrospective's cost rates as inputs (TECH_DEBT: a small slice with one design question, whether it shares the projection's cost fields).

## 12 · Implementation notes, PR 5a (2026-09-29; not new rulings)

Prompt 5 is split into slices, as Prompt 4 was: **5a** the rental page's tax corrections (M9) and the ROC basis; **5b** the home and bitcoin gains, the regime selector and the pre-/post-tax results (M7); **5c** holding location, the mortgage-interest toggle and Custom.

- **Verified first** (Prompt 5 step 1): DATA_AUDIT TX-1 to TX-6, from IRS primaries. No 2025–26 law changes §121, the LTCG rates, NIIT or the §1250 cap; the bills to lift the §121 caps are in committee.
- **Rental page, corrected (M9):** recapture at min(bracket, 25%) and never above the gain; depreciation on the original building basis, worked out from the adjusted basis and years held (it was 80% of today's value), stopping at 27.5 years in all, and the adjusted basis falls with future depreciation; state tax on rental income; NIIT on rental income where it applies (IRS: rental income is net investment income).
- **ROC basis:** STRC and SATA distributions lower each instrument's basis; once it is used up (year 8 for SATA at 13%, year 9 for STRC at 12%) they are taxed as long-term gains in the year paid. Lending interest bears state tax too. The gain left in the lower basis is for 5b's If sold basis.
- **Direction:** the corrections are measurable facts. Most raise the bitcoin paths' lead (a smaller sale tax, a smaller rental depreciation shield, state tax on rent); the ROC basis lowers the yield portfolio's cash on long holds. At the defaults the gap moves from +$91,756 to +$102,280 (Nominal, harness pins).

## 13 · Implementation notes, PR 5b (2026-09-29; not new rulings)

- **Both pages lead with If sold, after tax (M7).** BvRE's cards: the house less its sale tax, with the §121 exclusion (by filing status, from a 2-year hold; the house is assumed to be the buyer's main home; the price plus the buyer's closing costs is the basis); bitcoin less the tax on its gain over what was paid, at average cost, including coins sold along the way (added at the end, without interest; a net loss isn't credited). "Houses it could buy" uses the after-tax figure. BvRP's headline, chips and table: both sides sold at year N, the rental with its exit tax, bitcoin on its gain, STRC/SATA at par with the gain their ROC left in the lower basis; the chart stays Held until PR 6's toggle.
- **Inputs (R7 defaults):** a tax regime (United States / No capital-gains tax) on both pages; on BvRE one "Tax on a sale" block for both calculators with filing status, bracket and state; the option lists and tooltips are shared macros. Not stored or carried yet (PR 8). "Not tax advice" beside them. BvRE's meta descriptions say taxes are included again.
- **Direction:** measurable, with no judgment call. On BvRE it narrows bitcoin's lead: bitcoin's gain is taxed and most houses' gains fall inside the exclusion (defaults, Real: bitcoin $789,843 → $647,927; the house unchanged at $175,189). On BvRP it widens the default lead, because the kept rental's exit tax (recapture and gain) is larger than the yield portfolio's: Real, $54,487 held → $91,946 if sold after tax (+$81,094 before tax). Path 1's lead narrows ($1,168,131 → $973,478 Real) because bitcoin's large gain is taxed.
- **Left for 5c:** the holding-location toggle, the mortgage-interest deduction, Custom rates. The bracket-to-LTCG mapping and NIIT-by-bracket stay approximations, stated in the tooltip.

## 14 · Implementation notes, PR 5c (2026-09-29; not new rulings)

- **Bitcoin vs. Real Estate only**, in its Tax on a sale block, all off by default, so every earlier vector is unchanged:
  - **Bitcoin held in** a taxable (default) or tax-advantaged account: Roth-style, no tax at the sale. The tooltip states the 2026 contribution limits (IRA $7,500, 401(k) $24,500, DATA_AUDIT TX-7) that make the up-front sum unrealistic to shelter at once, and that traditional accounts tax withdrawals instead.
  - **Mortgage-interest deduction**, for itemisers: the owner saves interest x (bracket + state) on up to $750,000 of loan (TX-8); under equal cash out the renter invests that much less. Off by default because most households take the standard deduction ($32,200 joint, TX-9).
  - **Custom regime:** a home-gain rate after an exemption (default 0) and a bitcoin-gain rate.
- **Not on Bitcoin vs. Rental Property:** its paths deploy a sale's proceeds or a HELOC, far above any contribution limit, so a tax-advantaged option would mislead; rental mortgage interest is already deducted as a business expense.
- **Figures at the defaults (Real):** projection bitcoin $647,927 after tax; tax-advantaged $789,843; with the deduction $527,512 (the owner's lower cost means less invested); Custom 20% / $0 / 15%: bitcoin $683,406, house $154,617 (was $175,189).

## 15 · Implementation notes, PR 6a (2026-09-29; not new rulings)

PR 6 is split: **6a** "Show the calculation" and the CSV (P2, P7); **6b** the chart with the difference line and the Held / If sold toggle (M7, P4), on both pages.

- **One module, both pages:** `shared/real-estate-ledger.js` (window.RealEstateLedger) renders a disclosure with two tabs, the final rows (market value or total held → selling costs → before tax → tax → after tax) and a CSV of every tab with a #-prefixed provenance header; `shared/real-estate-ledger.css` styles it with each page's tokens. `toCsv` is the shared CSV writer P2 asked for.
- **Bitcoin vs. Real Estate:** under the cards and the toggle in both calculators (P7): *The house* and *Bitcoin + rent*, one row per year from the engine's own rows (calendar years to date in the look-back). Cumulative cash out is the same on both tabs when the renter invests the difference.
- **Bitcoin vs. Rental Property:** under the path card: *Keep the rental* (all N on Path 3) and the path, from `RealEstateModel.rentalLedger`. Each row's *Total held* is the chart's point for that year.
- **Nominal, as paid, in both views** (a small departure from Prompt 6's "current frame"): the note above the table says so and, in the Real view, gives the divisor the cards use. Deflating a ledger of payments year by year would make its sums unreadable.
- **No figure moves:** every rePairQA vector is unchanged; new E30, E31, P27 and P28 hash the ledgers' CSVs. Checked: the ledgers' after-tax rows equal the cards (BvRE, both calculators) and the table (BvRP, all four paths), and each ledger's last *Total held* equals the table's held total.
