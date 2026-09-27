# REAL_ESTATE_PAIR_PHASE0_REPORT — read-only verification

_2026-09-26. Phase 0 (Prompt 0) for `REAL_ESTATE_PAIR_DESIGN.md`. Read-only: no page behaviour changed. Every claim cites file:line on `main` at the branch point of `chore/real-estate-pair-phase0`. Where this report and the spec disagree, the spec says Phase 0 wins; §k lists the proposed amendments for JM to rule on. JM ratifies this report and rules R1–R10 before Prompt 1._

**Abbreviations.** BvRE = `/bitcoin-vs-real-estate`, BvRP = `/bitcoin-vs-rental-property`. Paths are shortened as follows:

| Short | Full path |
|---|---|
| `re.js` | `src/_includes/_pageassets/bitcoin-vs-real-estate.js` |
| `re.njk` | `src/bitcoin-vs-real-estate.njk` |
| `re-head` | `src/_includes/_pageassets/bitcoin-vs-real-estate-head.html` |
| `rp.js` | `src/_includes/_pageassets/bitcoin-vs-rental-property.js` |
| `rp.njk` | `src/bitcoin-vs-rental-property.njk` |
| `rp-head` | `src/_includes/_pageassets/bitcoin-vs-rental-property-head.html` |
| `shared/` | `src/_includes/_pageassets/shared/` |

**Method note.** Neither Node nor Python is installed on the machine that produced this report, so every figure below was computed by hand-porting the page formulas (PowerShell) rather than by executing page JS. The formulas are quoted with their line numbers so each figure can be re-derived. PR 3's harness should re-confirm them by running the real code.

---

## Headline findings (the ones that change rulings)

1. **The two engines share nothing but `shared/power-law-data.js`.** BvRE also loads `ModelingAssumptions` and `CalcHelpers`; BvRP loads neither (`rp.njk:20`). Mortgage, rent, house-cost and tax math are each implemented once per page, differently, or only on one page (§a).
2. **BvRE's headline figures are not like-for-like.** The bitcoin figure is net of all rent paid (`re.js:699`, `:263`); the house figure is gross equity, not net of P&I, property tax, insurance or maintenance (`re.js:727`, `:283`). Those costs appear only in a separate "Total outflow" line. With "Go deeper" DCA on, the owner's cash out still exceeds the renter's by the carrying costs, $570/mo at defaults ($920 with maintenance), and that difference is invested nowhere. The spec's ledger and difference line (§9) will expose this; it needs a ruling before PR 4 (§k-1).
3. **The default own-vs-rent gap is ~$1,118/mo, confirming the chat-side ~$1,100** (all-in excluding maintenance; ~$1,468 including it). But the DCA only invests the P&I-minus-rent gap, **$548/mo** (§c).
4. **BvRE's rent is flat nominal, yet it is subtracted unchanged from *real* bitcoin value** (`re.js:684`, `:709`). The Real and Nominal toggles therefore model two different rent paths. At defaults, real-mode net is ~$92K lower than the deflated nominal-mode net (§e).
5. **The model already credits the fixed-rate mortgage holder for inflation**, through deflating a fixed nominal balance. At the 6.5% default, 10-year real equity is ~$440K vs ~$305K if inflation were zero. R5's added line describes something the numbers already contain (§e).
6. **R2's premise is off.** The sitewide `realEstate` dimension already has presets `long-run 1` · `recent-decades 3.5` · `optimistic 5.5`, default `recent-decades` (`shared/modeling-assumptions.js:49–57`). The 3.5% that BvRE's tooltip calls "generous" (`re.njk:281`) *is* the "recent decades" preset. No picker UI exists for this dimension anywhere; BvRE is its only consumer (§f, §k-6). Separately, the preset's stated basis, **DATA_AUDIT RE-2 "~3.7% real, 2000–2024", doesn't reproduce**: CPI-deflated Case-Shiller gives ~2.2%. The on-site data can't compute any real figure, because there is no CPI or Shiller series (§f).
7. **BvRE already has an unnamespaced URL schema** with localStorage persistence: `year dca home horizon appr mortgage down method pscenario advanced advrate displaymode` (`re.js:1285–1304`), live since 2026-05-22. "Namespaced from the first commit" (spec §11) would break existing shared links unless legacy names are still read (§k-9).
8. **Three things the spec expects to reuse don't exist:** the 3×3 scenario grid (never shipped), a shared CSV module, and a shared chart helper. `RETIREMENT_CALCULATOR_DESIGN_22` isn't in the repo either (§k-3–5).
9. **BvRE's bitcoin horizon is shorter than its house horizon.** The house and rent compound for the full `horizonYrs`; bitcoin runs from *today's* price to 1 Jan of `endYear` (`re.js:688`). In late September 2026 a "10-year" projection gives bitcoin ~9.27 years (§b).
10. **BvRP's tax engine has three correctness issues** that PR 3 must move as-is (byte-identical) and PR 5 must fix: flat 25% recapture regardless of bracket; depreciation basis taken from *today's* value; and no state tax on rental income (§d).

---

## a. Engines — where the math lives, what is duplicated, what is shared

### Load order (script concatenation, not ES modules)

| Page | `page_scripts` | file:line |
|---|---|---|
| BvRE | `modeling-assumptions.js` → `calculator-helpers.js` → `power-law-data.js` → `bvre-annual-data.js` → `bitcoin-vs-real-estate.js` | `re.njk:27` |
| BvRP | `power-law-data.js` → `bitcoin-vs-rental-property.js` | `rp.njk:20` |

Shared modules are plain scripts included by Nunjucks and exposed as globals (`window.ModelingAssumptions`, `window.CalcHelpers`, file-scope `PL_A`/`plPrice`/`TODAY_PRICE`…). A new `shared/real-estate-model.js` follows the same pattern.

### BvRE — three calculators in one file

| Calculator | Function | file:line | Notes |
|---|---|---|---|
| Retrospective ("Postponed Purchase", default mode) | `runCalculator()` | `re.js:223–405` | Start year 2014–2021 (`re.njk:188`), end fixed at 2025 (`re.js:233`), `asOf='April 2025'` hardcoded (`re.js:245`). |
| Projection | `runFwdCalc()` inside the "TOOL B" IIFE | `re.js:471–1163` | Migrated from `/the-power-law` (header `re.js:462–468`). |
| Projection "Go deeper" | `computeProjectionDca()`, `renderAdvanced()` | `re.js:582–600`, `:974–1050` | Mortgage mode: DCA of P&I−rent. Cash mode: imputed rent into S&P at `realReturns`. |
| Static exhibits (not calculators) | houses visual, return table, burden and total-cost charts | `re.js:93–220` | Burden and total-cost charts hardcode 20% down (`re.js:189`, `:204`). |

**Mortgage payment** is implemented **three times in this file alone**: `mp()` (`re.js:106`), `monthlyPayment()` (`re.js:187`, used by retro), and inline in `runFwdCalc` (`re.js:671`). **Amortisation** is inline loops at `re.js:123`, `:282`, `:723`.

### BvRP — one calculator, pure-ish functions in one IIFE

| Piece | Function | file:line |
|---|---|---|
| Rental cash flow (annual) | `calcRentalAnnualCF(s)` | `rp.js:226–233` |
| Rental exit (sale, costs, all tax) | `calcRentalExit(s, yearsToExit)` | `rp.js:235–272` |
| Bitcoin growth path | `scenarioGrowthFactor(scenario, t, holdingYears)`, `effectiveCAGR` | `rp.js:186–223` |
| Spot BTC FV | `calcSpotBTCFV` | `rp.js:278–280` |
| Yield portfolio (STRC/SATA/Ledn/spot) | `calcYieldPortfolio`, `calcYieldPortfolioAtYearT` | `rp.js:282–323`, `:475–494` |
| Keep-rental counterfactual | `calcKeepRental` | `rp.js:338–349` |
| Paths 1–4 | `calcPath1..4` | `rp.js:352–439` |
| Orchestration | `computeAll`, `calcWealthTrajectory` | `rp.js:441–457`, `:496–549` |
| Tax tables | `STATE_CAPGAIN`, `federalLTCG`, `niitApplies` | `rp.js:135–154` |

These functions take a state object and return plain objects, with no DOM access, which makes extraction mostly a move. They are, however, closures inside the calculator IIFE and read the Power Law globals directly.

### Duplicated between the pages

| Concept | BvRE | BvRP | Same behaviour? |
|---|---|---|---|
| Power Law future price | `plPrice((endYear−2009)×365.25)` × scenario multiple (`re.js:688–696`) | `plPrice(todayDays + t×365)` × interpolated multiple (`rp.js:196–216`) | **No.** Different day origins, year lengths and scenario definitions (see §b, §d). |
| Scenario set | floor 0.42× · trend 1× · upper 3.0× at horizon end, no reversion path (`re.js:693–696`) | stay · trend · upper (drift to **2.5×**), linear reversion (`rp.js:206–213`) | **No.** "Upper" means 3.0× on one page and 2.5× on the other. |
| House appreciation | real input + sitewide inflation → nominal (`re.js:619–622`) | 3.0% nominal, hardcoded state, **not an input** (`rp.js:131`, `:236`) | No |
| Selling costs | none | 8% of appreciated value (`rp.js:237`) | No |
| Property tax | 1.2% of purchase price/yr, flat (`re.js:284`, `:735`) | not modelled (net yield input absorbs it); `STATE_PROP_TAX_RATE` defined but unused (`rp.js:143`) | No |
| Tax | none | recapture, LTCG, state, NIIT, ordinary on rental income (`rp.js:226–272`) | BvRE has none |
| Real/nominal | toggle, default Real (`re.js:531–541`, `re.njk:301–302`) | nominal only, no inflation dimension | No |
| Chart | none in the calculator | Chart.js line chart, 4 datasets, custom legend, full / first-3-years zoom (`rp.js:561–711`, `:1044–1059`) | BvRE has none |
| URL/storage state | query-param schema + localStorage `lcs.bvre.calc.v1` (`re.js:1273–1552`) | tab hash only (`rp.js:1349`) | BvRE only |

### Already shared

- `shared/power-law-data.js`: `PL_A=1.6e-17, PL_B=5.77, PL_FLOOR=0.42, PL_CEIL=3.0` (`:41`), `GENESIS_TS` (`:42`), `plPrice` (`:44`), `PL_DATA` (`:85`), `TODAY_PRICE` (`:94`, reassigned by `fetchTodayPrice` `:175`). Both pages use it. **The spec's `shared/power-law-data.js` name is correct.**
- `shared/modeling-assumptions.js` and `shared/calculator-helpers.js`: BvRE only.
- `shared/bvre-annual-data.js`: `homeData` (1965–2025, sparse before 1985) and `btcData` (2013–2025). BvRE and `/the-gallery`.
- Live BTC price: BvRE fetches CoinGecko itself with a hardcoded $84,000 fallback (`re.js:483`, `:497–513`). BvRP uses the shared `fetchTodayPrice`. That is a third duplication.

---

## b. BvRE defaults as coded

| Default | Projection mode | Retrospective mode |
|---|---|---|
| Home price | $420,000 (`re.njk:268`, URL def `re.js:1288`) | median for start year from `homeData` (`re.js:234`); default year 2017 → $323,500 |
| Down payment | 20%, bounds 3–95 (`re.js:628–631`) | 20% (`re.js:241`) |
| Mortgage rate | 6.8% nominal (`re.njk:286`) | `mortgageRates[year]` (`re.js:5`), 2017 = 3.99% |
| **Rent rule** | **75% of P&I only**, not of P&I + tax + insurance: `impliedRent = monthlyMort × 0.75` where `monthlyMort` is P&I on the loan (`re.js:671`, `:679`) | same: `mortgageMonthly × 0.75`, P&I only (`re.js:260–261`) |
| **Rent growth** | **None.** `totalRentPaid = impliedRent × 12 × horizonYrs` (`re.js:684`) | none (`re.js:262`) |
| Home appreciation | real %, bound to `ModelingAssumptions.get('realEstate')` → default preset `recent-decades` = **3.5%** real (`re.js:1104–1111`; `shared/modeling-assumptions.js:49–57`). The tooltip calls it "generous" (`re.njk:281`). | actual `homeData` ratio end/start (`re.js:234`) |
| Inflation source | `ModelingAssumptions.get('inflation')`, default `m2-growth` = **6.5%** (`re.js:620`; `shared/modeling-assumptions.js:30–38`) | n/a (nominal historical) |
| Property tax | 1.2% of **purchase** price/yr, flat, not grown (`re.js:735`). The footnote says "of home value" (`re.njk:332`); the code uses purchase price. | same (`re.js:284`) |
| Insurance | $150/mo flat (`re.js:736`) | same (`re.js:284`) |
| Maintenance | 1% of **purchase** price/yr, flat (`re.js:737`) | same (`re.js:284`) |
| Where carrying costs go | only into `totalHouseCost` ("Total cost of ownership / Total outflow", `re.js:738`, `:830`); **not deducted from equity** | only into `houseTotalSpent` (`re.js:285`) |
| **Selling costs** | **None, confirmed.** Equity = `futureHomeValue − bal` (`re.js:727`). | none (`re.js:283`) |
| Mortgage interest | shown as "Interest paid … (dead money)" (`re.js:827`); **no deduction, no tax of any kind** | same (`re.js:290`) |
| BTC scenarios | Floor (PL_FLOOR 0.42×) · **Trend (default, `re.js:481`, `re.njk:242`)** · Upper (PL_CEIL 3.0×), all as a point on the band at the horizon end (`re.js:689–696`) | actual `btcData` annual averages (`re.js:234`) |
| DCA path | geometric interpolation from today's price to the scenario endpoint (`re.js:588–594`) | actual annual average for each year (`re.js:332–336`) |
| Horizons | 5/10/15/20, default 10 (`re.js:488–494`) | start years 2014–2021 to 2025 |
| **Projection anchor** | `startYear = new Date().getFullYear()`; endpoint = `plPrice((endYear − 2009) × 365.25)` ≈ 1 Jan `endYear`, measured from 1 Jan 2009, not `GENESIS_TS` (3 Jan). BTC starts at **today's** price. House, rent and mortgage run the full `horizonYrs`. The footnote says "anchored to January 1 of the selected year" (`re.njk:294`). | fixed: end year 2025, label "April 2025" |

**The horizon mismatch in numbers.** On 2026-09-26, a 10-year projection prices bitcoin over ~9.27 years (to 1 Jan 2036) while the house compounds for 10.0 years. Near year-end the gap closes; in January it vanishes. Every figure in BvRE's projection changes slightly with the date the page is opened. This matters for PR 3's byte-identical proof: the harness must pin `Date.now()`.

**Stale markup placeholders**, overwritten at runtime and harmless: `re.njk:198` rent "$864", home "$336,900 (2020 median)" and rate "3.11% (2020 avg)" (the default year is 2017); `re.njk:290` rent "$3,150 (75% of mortgage)" (the runtime value is $1,643).

## c. BvRE default monthly own-vs-rent gap (projection defaults)

Inputs: $420,000 home, 20% down → $336,000 loan, 6.8% 30-year fixed (`re.js:668–671`).

| Line | $/mo | Basis |
|---|---:|---|
| P&I | **2,190.47** | standard amortisation, `re.js:671` |
| Default rent (75% × P&I) | **1,642.85** | `re.js:679` |
| Property tax (1.2% × 420,000 / 12) | 420.00 | `re.js:735` |
| Insurance | 150.00 | `re.js:736` |
| Maintenance (1% × 420,000 / 12) | 350.00 | `re.js:737` |
| **All-in ownership, excl. maintenance** | **2,760.47** | P&I + tax + insurance |
| **Gap, excl. maintenance** | **1,117.62** | 2,760.47 − 1,642.85 |
| All-in ownership, incl. maintenance | 3,110.47 | |
| **Gap, incl. maintenance** | **1,467.62** | |
| Gap the "Go deeper" DCA actually invests (P&I − rent) | **547.62** | `re.js:584` |

**Verdict: the chat-side ~$1,100/mo is confirmed** (all-in, excluding maintenance). Against the public ~$800–900 range the spec cites, the default leans toward renting by ~$200–300/mo on that measure, and by ~$550–650/mo if maintenance is counted. R3's sourced anchor (§g) addresses the rent side. The carrying-cost side (1.2% tax, $150 insurance, 1% maintenance) is unsourced in code and has no DATA_AUDIT row; PR 4 should source it too.

Retrospective default (2017, $323,500, 3.99%): P&I $1,234.06, rent $926.

## d. BvRP defaults as coded

State object at `rp.js:114–132`; slider markup at `rp.njk:487–569`.

| Default | Value | file:line | Notes |
|---|---|---|---|
| Path | 4 (Sell + Yield Portfolio) | `rp.js:115` | |
| Property value | $500,000 | `rp.js:116`, `rp.njk:487` | |
| Net rental yield | 4.4% (input, 1–10%) | `rp.js:117`, `rp.njk:497` | **Direct input.** The §2 gross-to-net waterfall is prose only (`rp.js:100–102`). |
| Holding period | 10 yrs (1–30) | `rp.js:118`, `rp.njk:503` | |
| State | `OTHER` = 5.0% cap-gains | `rp.js:119`, `:141` | |
| Federal bracket | 24% | `rp.js:120` | |
| Adjusted basis | 60% of current value | `rp.js:121` | |
| Years already held | 10 | `rp.js:122` | |
| **Scenario set** | `stay` · **`trend` (default)** · `upper`. **No floor case.** | `rp.js:123`, `:156–217` | |
| **Reversion method** | multiple(t) = current + progress × (target − current), progress = t / holdingYears, linear in the **multiple**; target 1.0 (trend), 2.5 (upper), current (stay). Price = multiple × `plPrice(todayDays + t×365)`. | `rp.js:203–216` | Fallback when Power Law data is absent: flat CAGRs of 20/30/45% (`rp.js:191–193`). |
| **Rental appreciation** | 3.0% **nominal**, hardcoded in state; **not an input**, no slider | `rp.js:131`, `:236` | |
| **Selling costs** | **8%** of appreciated value | `rp.js:237`; labelled "Transaction costs (8%)" `rp.js:912` | The comparison table says "7–33% exit attrition" (`rp.js:888`). |
| **Tax components** | (1) rental income: `(gross − depreciation) × federal bracket`, no state tax (`rp.js:228–231`). (2) exit: recapture = accumulated depreciation × **flat 25%** (`rp.js:248`); LTCG on `taxableGain − accumulatedDep` at 0/15/20 by bracket (`rp.js:149–153`, `:249–250`); state on the full gain (`rp.js:251–252`); NIIT 3.8% if bracket ≥ 32 (`rp.js:154`, `:253`). (3) yield portfolio: Ledn at the ordinary bracket; STRC/SATA ROC assumed tax-free for the whole hold (`rp.js:298–300`, `:103–106`). | | |
| **Depreciation basis** | 80% of the **current** property value / 27.5, both for annual depreciation and accumulated depreciation (`rp.js:229`, `:242–243`) | | **Inconsistent with the 60% adjusted-basis input**, which implies a lower original cost. |
| Real/nominal toggle | **Does not exist.** No inflation dimension; everything nominal. | | |
| **Keep-rental line valuation** | Σ after-tax cash flow (flat, no rent growth) + **mark-to-market** property value at year t; **no selling cost, no exit tax** (`rp.js:338–349`, `:513–517`) | | A deliberate choice (comment `rp.js:326–337`): bitcoin paths pay exit costs at year 0, keep-rental defers them forever. The bitcoin paths are also untaxed at year N. |
| Yield portfolio | 45/30/10/15 STRC/SATA/Ledn/spot (`rp.js:129`); yields 11.5 / 13.0 / 8.0% (`rp.js:292–294`); **principal held at par**, distributions flat and not reinvested (`rp.js:303`, `:310`) | | Yields hardcoded in JS and copy (`rp.js:957–959`); no date. |
| Existing mortgage | $200,000 (`rp.js:126`), used **only** in Path 2's HELOC room (`rp.js:366`) | | **The keep-rental and sale paths ignore the mortgage payoff.** |
| Chart zoom | full / first 3 years already exist (`rp.js:568`, `:593`, `:1044–1059`) | | Spec §9 lists this as new for both pages; BvRP has it. |
| Dead state | `includeSweatEquity` (`rp.js:130`), `STATE_PROP_TAX_RATE` (`rp.js:143–147`) | | never read |
| Missing design doc | `rp.js:96` cites `BITCOIN_VS_RENTAL_PROPERTY_CALCULATOR_DESIGN_1.md` | | not in the repo |

**Tax correctness issues** (to move byte-identical in PR 3 and fix in PR 5, logged here so PR 5 doesn't rediscover them):

1. **Recapture at a flat 25%.** Unrecaptured §1250 gain is taxed at the ordinary rate *capped at* 25%. At the 12/22/24% brackets the code overstates it. It also charges full recapture when `taxableGain < accumulatedDep`.
2. **Depreciation from today's value.** Both annual and accumulated depreciation use 80% of *today's* value rather than the original building basis, which overstates both at the default 60% adjusted basis.
3. **No state tax on rental income**, while state tax is applied at exit.

## e. Inflation interaction (BvRE; BvRP has no inflation dimension)

Default inflation is 6.5% (`m2-growth`). Real appreciation is 3.5%. Horizon 10 years, mortgage mode.

| Quantity | Value | How |
|---|---:|---|
| Nominal home appreciation | **10.23%/yr** | `CalcHelpers.realToNominal`: (1.035 × 1.065) − 1 (`re.js:621`; `shared/calculator-helpers.js:40–44`) |
| Home value in 10 yrs, nominal | $1,112,113 | `re.js:717` |
| Loan balance after 120 payments, nominal | $286,959 | `re.js:722–726` |
| Equity, nominal | $825,154 | |
| **Equity, real (today's $)** | **$439,581** | `deflateToToday` (`re.js:733`) |
| Real value of the remaining debt | $152,870 | 286,959 / 1.065¹⁰ |
| Equity if inflation were 0% (same 3.5% real) | $305,493 | counterfactual |
| At the `cpi-official` 3.5% preset | nominal appreciation 7.12%; real equity $389,021 | |
| Rent growth | **0% nominal** (flat) | `re.js:684` |
| Rent in real mode | the flat nominal total (**$197,142**) is subtracted from *real* bitcoin value as if it were today's dollars (`re.js:709`, comment `:703–708`) | |
| Real PV of that flat nominal rent stream | $146,280 | monthly deflation at 6.5% |
| Real vs nominal rent charge | in **nominal** mode, `btcNet = btcValue − 197,142` (`re.js:699`). Deflated, that charge is ~$105K real. In **real** mode the charge is the full $197K. | The two modes differ by **~$92K** at defaults, so the toggle is not just a change of units. |
| Mortgage P&I, 10-yr total | nominal $262,856; real $195,040 | not in equity either way |

**Plain statement: yes, the current model already credits the fixed-rate mortgage holder for inflation.** The balance is a fixed nominal amount deflated at 6.5%, so the higher the inflation preset, the larger the real equity: +$134K at 6.5% vs 0%, at defaults. What the model does *not* do is count the real cost of the payments, because P&I isn't deducted from equity on either display (see §k-1). R5's sentence is accurate. Phase 0 recommends it describe an effect already present rather than a new one.

**Inflation interacts with R4.** Today, real-mode rent is effectively constant in real terms (grows at inflation), while the house grows at inflation plus 3.5% real. R4 (rent grows at the house's nominal rate) would raise the rent path by 3.5% real a year. That leans further against the bitcoin path, consistent with §1's governing principle, but it moves figures materially: 10-year real rent rises ~17% at defaults, $197K → ~$231K (Σ 19,714 × 1.035ᵗ, t = 0…9).

## f. Data for ruling R2 — real home appreciation from on-site data

**The site has no Shiller or Case-Shiller series and no CPI series, so R2 can't be computed from on-site data alone.** What is on site:

| Data | Where | What it is |
|---|---|---|
| `homeData` | `shared/bvre-annual-data.js:43–45` | Nominal median sales price, 1965–2025. Every 5 years to 2010, then annual from 2013. DATA_AUDIT BvRE-1 sources it to FRED **MSPUS, the median price of *new* houses sold**, not existing homes. The file header says "annual from 1990 forward"; the data has gaps in 1991–94, 1996–99 and 2001–09. |
| `incomeData`, `mortgageRates`, era ratios, Demographia ratios | `re.js:3`, `:5`, `:12–13`, `:31–36` | Not price indices |
| `realEstate` presets 1 / 3.5 / 5.5 | `shared/modeling-assumptions.js:49–57`; rationale `STYLE_GUIDE.md:354–356` | Assumptions, not data |
| RE-1 "Case-Shiller real 1890–2024 ~0.4%" and RE-2 "Case-Shiller real 2000–2024 ~3.7%" | `DATA_AUDIT.md:47–48` | Cited figures; the series behind them isn't on site |

**Nominal CAGR from on-site `homeData`**, formula (V₁/V₀)^(1/n) − 1:

| Window | Values | Nominal CAGR |
|---|---|---:|
| 1990 → 2025 | $122,900 → $416,900 (×3.392, 35 yrs) | 3.55% |
| 2000 → 2025 | $169,000 → $416,900 (×2.467, 25 yrs) | 3.68% |
| 1965 → 2025 (longest on site) | $20,000 → $416,900 (×20.85, 60 yrs) | 5.19% |

**Real CAGR needs a deflator.** Deflating with FRED CPI-U (CPIAUCNS annual averages, fetched 2026-09-26; 2025 average from 11 months because October 2025 is blank in FRED; **off-site**):

| Series | Window | Real CAGR | Arithmetic |
|---|---|---:|---|
| On-site `homeData` (MSPUS) | 1990 → 2025 | **0.92%** | 3.392 / (321.943 / 130.658) = 1.377; ^(1/35) |
| On-site `homeData` | 2000 → 2025 | 1.12% | |
| On-site `homeData` | 1965 → 2025 | 1.20% | ratio 2.040; ^(1/60) |
| Case-Shiller National, FRED CSUSHPINSA (off-site) | 1990 → 2025 | **1.58%** (4.24% nominal) | 76.939 → 328.525 |
| Case-Shiller National (off-site) | 2000 → 2024 | **2.19%** (4.78% nominal) | |
| Shiller long run, multpl.com table (off-site) | 1890 → 2017 | ≈0.42% | 154.58 → 264.83 (July-2026 $). Agrees with RE-1. |

**Findings for the R2 ruling:**

1. **DATA_AUDIT RE-2 (~3.7% real, 2000–2024) doesn't reproduce.** The same index deflated by CPI gives ~2.2% real; 3.7% is close to a *nominal* rate. RE-2 is also the stated basis of the `recent-decades 3.5` preset. **Flag: re-verify RE-2 against the primary before PR 4; if confirmed wrong, the default moves.**
2. **R2's premise changes.** R2 wants the default to be "the recent-decades figure (higher than long run, i.e. leaning against the thesis)". On this evidence, recent decades are ~1.6% (1990–) to ~2.2% (2000–) real, **below today's 3.5%**. Adopting it still leans against the thesis relative to the long run (~0.4%), but *lowers* the house path relative to today's page. JM should rule knowing that.
3. **Proposed preset set for JM:**
   - long-run ≈ 0.4% (Shiller)
   - recent decades ≈ 1.6–2.2% (Case-Shiller, window to be ruled)
   - "generous" 3.5%, kept as an explicit option
   - custom
4. **To make R2 computable on site** (so the tooltip can say "computed from…"), PR 4 needs a small CPI-U annual series and a Case-Shiller or Shiller annual series in `shared/`, each with a DATA_AUDIT row. MSPUS-based `homeData` is new-house prices and understates like-for-like appreciation (~0.9% real 1990–2025). Phase 0 recommends not using it for R2.

**Re-verify at PR 4:** the FRED values and the multpl long-run figure, against Shiller's own file (http://www.econ.yale.edu/~shiller/data.htm, not parsed here).

## g. Candidate sources for ruling R3 — price-to-rent anchor

Default home price $420,000 (`re.njk:268`). Implied rent = 420,000 × (national rent ÷ national price); annual P/R = price ÷ (12 × rent). **No pick. JM rules.** Values fetched 2026-09-26 and re-verified at build.

| # | Source pair | Latest values | Annual P/R | Implied default rent | Gap vs P&I ($2,190) | Gap vs all-in excl. maint ($2,760) | Gap vs all-in incl. maint ($3,110) |
|---|---|---|---:|---:|---:|---:|---:|
| **Today** | 75% × P&I (`re.js:679`) | n/a | 21.3 | **$1,643** | $548 | $1,118 | $1,468 |
| **A** | Census ACS median gross rent (B25064) with FRED MSPUS | ACS 2024 1-yr **$1,487** (released 2025-09-11); MSPUS 2024 avg $418,975; latest (2026 Q2) $410,700 | 23.5 (2024) / 23.0 (latest) | **$1,491** / $1,521 | $699 / $669 | $1,269 / $1,239 | $1,619 / $1,589 |
| **B** | Zillow ZORI (all homes) with ZHVI (typical value, middle tier), US | Aug 2026: ZORI **$1,948**; ZHVI **$368,697** | 15.8 | **$2,219** | **−$29** | **$541** | **$891** |
| **C** | Apartment List national median rent with ZHVI (or MSPUS) | Aug 2026 **$1,390** (report published 2026-08-26) | 22.1 (ZHVI) / 24.6 (MSPUS) | **$1,583** / $1,421 | $607 / $769 | $1,177 / $1,339 | $1,527 / $1,689 |

**URLs:**

- A: https://data.census.gov/table/ACSDT1Y2024.B25064 · https://fred.stlouisfed.org/series/MSPUS
- B: https://www.zillow.com/research/data/ (CSV endpoints `…/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv`, `…/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv`)
- C: https://www.apartmentlist.com/research/national-rent-data
- Not a candidate: BLS CPI "Rent of primary residence" (https://fred.stlouisfed.org/series/CUUR0000SEHA) is an index level with no dollar rent. It could roll an anchor forward, not set one.

**Caveats that bear on the ruling:**

- **A:**
  - ACS covers *all* occupied rentals (every size and age, sitting tenants, utilities included), not a home comparable to the one bought. That biases rent low and the gap wide, i.e. toward renting.
  - MSPUS is new-house sales.
  - ACS lags about 9 months. Whether the 2025 1-yr release is out wasn't confirmed.
  - ACS median home value (B25077), which would make a same-survey pair, needs an API key and wasn't pulled.
- **B:**
  - The closest like-for-like pairing: asking rents on new leases for all home types, against a typical-home value.
  - It lands in the spec's public ~$800–900 range **only when maintenance is counted** ($891).
  - ZHVI ($369K) sits well below MSPUS ($411K).
  - **Under B the rent roughly equals P&I, so the current P&I-only DCA would invest ~$0/mo.** That is another reason §k-1 (invest the all-in gap) matters.
- **C:** apartments only, with no single-family rentals, so it runs low for a house. It has no price series of its own.

**Interaction with the spec's framing.** "Leaning against the thesis" means a *higher* default rent. Of the three, B leans hardest against the bitcoin path; A and C sit near today's 75%-of-P&I rule.

## h. Social cards

| Page | Image | Baked-in text | Claim a register pass would change? |
|---|---|---|---|
| BvRE | `og-bitcoin-vs-real-estate.jpg` (`re-head:7`, `:15`) | "Bitcoin vs. Real Estate" / "135 years of US housing affordability — and what changed when the dollar's monetary regime did. Homes priced in real money tell a different story." / era bar chart (Gold Standard → Late Fiat → "2025 → ?") / "1890–2025 · home-price-to-income across five monetary eras" | **No.** Descriptive; "tell a different story" is mild. The baked em-dash predates §10.2.1, and §10.2.1 exempts existing pages from sweeps. |
| BvRP | `og-bitcoin-vs-rental-property-v2.jpg` (`rp-head:8`, `:16`); built by `build-og-bitcoin-vs-rental-property.py:43–48` | "Bitcoin vs. Rental Property" / "The yield comparison, once landlord costs and tax are surfaced." | **No.** |
| BvRP (retired) | `og-bitcoin-vs-rental-property.jpg` (still in the repo, unreferenced) | "The honest comparison — once landlord costs are surfaced." | n/a. Keep it registered for cached shares; it's not served by the page. |

**No OG image needs regenerating for PR 2.** The register problems are all in text metadata:

- BvRP og:description and twitter:description: "2× the after-tax yield, no tenants, no maintenance." (`rp-head:7`, `:15`).
- BvRP JSON-LD: "the same tax-deferral mechanics as real estate's depreciation shield" (`rp-head:25`). The body itself says "The mechanism is different" (`rp.njk:256`).
- BvRE FAQ answer 1 ships as FAQPage JSON-LD: "Looking back, the comparison is not close" (`re.njk:19`, via `components/faq-schema.njk`). **The FAQ the spec names as the target register contains one of the claims the register pass removes.**
- BvRE image alt: "A house didn't used to be an investment…" (`re-head:11`, `:16`). It echoes the hero and stays compatible with the R10 hero.
- Off-page copy that quotes either page (Prompt 2 step 7):
  - Homepage concept card, BvRP: "2× the after-tax yield, no tenants, no maintenance… the comparison flips." (`src/index.njk:1466`)
  - Homepage carousel slides at `src/index.njk:144–146` and `:158–160`
  - `llms.txt:54–55`, where BvRP says "under the same ROC tax shield"
  - Calculator tiles: `src/_data/explorations.json:223` and `:235`
  - `src/_data/updates.json:274–276`, which says "the honest yield comparison". Changelog entries are carved out of the de-tell sweep (backlog :298), so leave it.

**The BvRE metadata "taxes included" is ambiguous rather than false.** The page includes property tax (`re.js:735`) but no income or capital-gains tax. Spec §5's "drop 'and taxes' until E ships" is still the safer reading for a research audience.

## i. BvRP sourcing inventory

**Every item the spec lists was found**, except that "trading volumes" appear only in Methodology (`rp.njk:817`), not in the body.

### i-1. Non-primary source lines

| Claim (short) | Current source text | Where on page |
|---|---|---|
| Gross-to-net waterfall bands (vacancy 3.5–12%, property tax 9–15%, insurance 6–15%+, management 11–14%, maintenance 9–13%, CapEx 6–10%) | "CoreVest Finance maintenance-budgeting reference, plus NotebookLM synthesis combining property tax, insurance, management, and CapEx components." | body `rp.njk:97–104`; source `rp.njk:800` |
| 50.0–63.0% consumed / 36.8–50.4% survives; "the '50% Rule'" | same (NotebookLM synthesis) | `rp.njk:106`; reused `:162`, tooltip `:492` |
| "15.6% gross … 36.8% survives"; "5.4% gross … over 50%" | none; covered by `:800` | `rp.njk:108` |
| 11.7% leveraged ROI | "Property Scout 360 (industry-standard calculation methodology), NotebookLM synthesis of model inputs." | `rp.njk:74`, `:112`; source `:803` |
| After-friction 7–9% | none of its own (the page's own model) | `rp.njk:114`; reused `:188`, `:194` |
| 31 hrs/month; 8 hrs/mo + 40–48 hrs/yr; 96 hrs/yr; $4,800/yr; $14,400 | "Property118 landlord survey + valuation synthesis (modeled estimate)." (Property118 is a UK site.) | `rp.njk:120`; source `:801`; "96 hrs" reused `:194`, `:290`, `rp.js:885` |
| 19–33% forced-sale attrition; 7–11% orderly; 50%+ distressed | "Compiled by combining academic fire-sale discounts (Nielsen) with industry-standard agent commissions and closing costs (modeled estimate)." | `rp.njk:131–137`; source `:802`; reused `:188`, `:295`, `rp.js:888` ("7–33%"); Nielsen cited unlinked `:799` |
| ~$1.7B annual preferred obligation, which drives the coverage tiles 49.6 / 24.8 / 14.8 yrs | "Derived from outstanding shares × dividend rate; verification pending against most recent Strategy 10-Q (modeled, primary source verification in progress)." | `rp.njk:308`, `:311–313`, `:316`; source `:812` |
| Saylor "$8,000 and stay there for five years" | "Public statements from Strategy executive team; primary attribution verification in progress." | `rp.njk:318`; source `:818` |
| Evictions $3,500–$10,000+, 7–16 weeks lost rent | none | `rp.njk:124` |
| "29 states and 51 localities" | none | `rp.njk:141` |
| STR 15–30% of GBR; fees 20–30%; mgmt 25–40%; insurance $1,500–$5,000+ | none | `rp.njk:162` |
| 5.8% effective landlord tax rate | none | `rp.njk:76` |
| 62% of mortgage holders sub-4%; HELOC 8.5–10.5% | none | `rp.njk:388` |
| YBTC 74.7%; 45–48% NAV decline; 0–96% ROC | none | `rp.njk:336` |
| CeFi 6.5–13.9% | none | `rp.njk:339` |
| Trading volumes (STRC ~$350M/day, SATA ~$45.9M/day) | "BitcoinQuant exchange data dashboard (third-party verified)." | `rp.njk:817` (Methodology only) |

### i-2. Regulatory exhibits

| Exhibit | Link | Where |
|---|---|---|
| Portland, ME ($500/month per unit; 40% cash-flow drop) | **none** | `rp.njk:144` |
| St. Paul, MN (12–13%; $1.57B) | NBER w30083 PDF, linked on "$1.57 billion" only | `rp.njk:145`; `:797` |
| Tacoma, WA I-1 ($10 late-fee cap; 33% → 54% delinquency; 32% removed) | **none** | `rp.njk:146` |
| Seattle, WA (21% decline) | Seattle City Auditor RRIO audit PDF | `rp.njk:147`; `:798` |
| NYC Local Law 18 (70–92%; 38,000 → <3,000) | **none** | `rp.njk:164` |
| California AB 1154 (Jan 2026 JADU STR ban) | **none** | `rp.njk:164` |
| Catch-all "Compiled from state revenue department publications and the NBER/legal-research summaries cited above." | only NBER and Seattle are actually cited | `rp.njk:828` |

### i-3. Other spec §4 items

| Item | Current text / fact | Where |
|---|---|---|
| Draft language | "…As this draft moves toward publication, those will be either re-sourced to primary references or qualified explicitly…" | `rp.njk:832–834`; also "v0.3 caveats:" `:780`; intro `:790` |
| Staking bullet | "Native bitcoin staking and liquid staking tokens behave like a triple-net lease on digital land…" | `rp.njk:347`; also clashes with `:389` "no dividends or interest unless staked" |
| 25–30% CAGR | "Under conservative Power Law assumptions, bitcoin's long-term CAGR has held in the 25–30% range…" | `rp.njk:188`. It is not computed; the calculator's live CAGR comes from `rp.js:219–223`. |
| $500K table, spot slice | "~$415K BTC appreciation on the spot slice"; prose "at a conservative 25% CAGR grows from $50K to roughly $465K" | `rp.njk:286`, `:302`. **Static HTML at a flat 25%.** |
| $500K table, arithmetic | ROC share stated ~$42,500; 45% × 11.5% + 30% × 13% on $500K = **$45,375**. The table applies $500K to both sides, but Path 4 deploys after-sale-tax proceeds (~$411K per `rp.njk:379`). | `rp.njk:276–281` |
| "Hassle: effectively zero" | "Effectively zero"; JS table "~0"; "Zero hassle"; "zero ongoing operational load" | `rp.njk:291`; `rp.js:886`; `rp.njk:302`, `:406` |
| "structurally inert" | "…they are structurally inert once accepted…"; "structurally-inert risk" | `rp.njk:122`, `:194` |
| Other certainty lines (for PR 2) | "the math is not close" `:194`; "On yield alone the head-to-head is not close" `:456`; "removes the operational anxiety entirely" `:354`; "A city council vote cannot cap bitcoin's price." `:150`; "No regulatory cliff. No policy risk…" `:190`; "The structural parallel is exact" `:256`; "The structural math is sound" `:326`, `:423`; hero "2× the after-tax yield" `rp.njk:25` | |

### i-4. Dated figures (re-verify in PR 1)

| Figure | Body | Source line | Where |
|---|---|---|---|
| Strategy BTC | 845,050 BTC "as of September 2026" | "Strategy 8-K filings as of 7 September 2026" | `rp.njk:308`; `:811`. Also listed in `MONTHLY_REFRESH_CHECKLIST.md:590` as a "THIRD location". |
| STRC rate | "around 11.5%… monthly distributions transitioning to semi-monthly" | generic 424B5 / 8-K | `rp.njk:246`, `:552`, `:554`; `rp.js:292`, `:957` |
| SATA rate and date | "13.00% … transitioning to daily distributions effective June 16, 2026" (now past, still written as future) | Strive 8-K / EX-99.1 | `rp.njk:248`, `:564`; `rp.js:293`, `:958` |
| Strive BTC | 15,009 BTC | Strive 8-K (undated) | `rp.njk:248`, `:564` |
| $8.2B converts | stated | **no source line** | `rp.njk:324` |
| Cash reserve | "roughly 6 months" vs the $1.7B obligation | none; **conflicts** with "USD Reserve ($5.10B)" at `:811` (≈3 years) | `rp.njk:316` |

**DATA_AUDIT has no BvRP-* rows** (confirmed, 0 matches). PR 1 creates the section.

## j. Proposed shared module and byte-identical vectors

**Name:** `src/_includes/_pageassets/shared/real-estate-model.js`, exposing `window.RealEstateModel`. It is pure and has no DOM access, following `retirement-engine.js`'s shape. It depends on `power-law-data.js`, plus `calculator-helpers.js` (BvRP must add that include; it is side-effect free). PR 3 keeps each page's current behaviour behind explicit parameters, per Prompt 3 step 1.

```text
// House / mortgage
mortgagePayment(principal, ratePct, years=30)                     -> number  // replaces re.js:106, :187, :671
amortize(principal, ratePct, months, payment?)                     -> {balance, principalPaid, interestPaid}
amortizeByYear(principal, ratePct, years)                          -> [{year, balance, principal, interest}]
housePath({price, realApprPct|nominalApprPct, inflationPct, years}) -> [{year, value}]
carryingCosts({price, basis:'purchase'|'current', propTaxPct, insuranceMo, maintPct, years}) -> [{year, propTax, insurance, maint}]
houseExit({value, sellingCostPct})                                 -> {gross, sellingCosts, net}   // BvRE 0, BvRP 8 in PR 3

// Rent
rentPath({startRent | ruleOfPI:{payment, ratio}, growthPct, years}) -> [{year, rent, cumulative}]

// Bitcoin
btcScenarioPrice({scenario, t, horizon, nowDays, spot, mode:'endpoint'|'interp', upperMult}) -> number
  // mode 'endpoint' = BvRE (re.js:688–696); 'interp' = BvRP (rp.js:186–217). Both kept in PR 3.
btcGrowthFactor(...)                                               -> number   // wraps the above
dcaAccumulate({monthly, months, priceAtMonth(m)})                  -> {btc, invested}

// Landlord (moved, not rewritten)
rentalAnnualCF(s), rentalExit(s, yearsToExit), yieldPortfolio(amount, s), yieldPortfolioAtT(amount, s, t),
keepRental(s), path1..path4(s), computeAll(s), wealthTrajectory(s, scenario)

// Tax (PR 3 moves BvRP's; PR 5 adds regimes)
TAX_TABLES = {STATE_CAPGAIN, ...}; federalLTCG(bracket); niitApplies(bracket)

// Composites (the page-level results each page renders today)
bvreRetro(inputs)      -> the exact objects runCalculator renders (re.js:223–405)
bvreProjection(inputs) -> the exact objects runFwdCalc renders (re.js:602–972)
ledger(inputs, page)   -> [{year, ...house cols, ...btc cols}] + final {pre, tax, after}  // built in PR 3, rendered in PR 6
```

**Harness preconditions** (without these, "byte-identical" is untestable):

- Pin `Date.now()`, since both engines read it (`re.js:486`, `rp.js:179`, `:196`).
- Pin `TODAY_PRICE` / `fwdBtcNow`, which are live-fetched.
- Pin every `ModelingAssumptions` dimension (localStorage-backed).
- Clear `lcs.bvre.calc.v1` so storage doesn't override inputs.
- Capture both rendered text (stat blocks) and the raw numbers from the chart datasets.

**Pinned context:** date 2026-09-26T12:00Z; spot $100,000; inflation 6.5; realEstate 3.5; realReturns 5.

| # | Page · mode | Vector |
|---|---|---|
| E1 | BvRE retro | 2017, leverage, 20% down, no DCA (bare default) |
| E2 | BvRE retro | 2017, leverage, DCA on |
| E3 | BvRE retro | 2014, cash |
| E4 | BvRE retro | 2021, leverage, custom rate 3%, custom rent $2,000, down 10% |
| E5 | BvRE retro | 2019, custom home $750,000, DCA on |
| E6 | BvRE proj | defaults: $420K, 10y, trend, mortgage 20%, Real |
| E7 | BvRE proj | E6 but Nominal display |
| E8 | BvRE proj | E6 with floor, and with upper (two vectors) |
| E9 | BvRE proj | 5y and 20y horizons, trend |
| E10 | BvRE proj | cash method, advanced on (S&P at 5%) |
| E11 | BvRE proj | mortgage, advanced (DCA) on, custom rent $1,500 |
| E12 | BvRE proj | down 3.5%, rate 7.5%, appr 1.0 |
| E13 | BvRE proj | E6 with inflation preset `cpi-official` (3.5) |
| P1 | BvRP | defaults (Path 4, trend, $500K, 4.4%, 10y, OTHER, 24%) |
| P2–P4 | BvRP | defaults × Path 1, 2, 3 |
| P5 | BvRP | Path 4 × `stay` and × `upper` (two vectors) |
| P6 | BvRP | Path 1, holding 1y and 30y (reversion edge; t > holding impossible) |
| P7 | BvRP | Path 1, CA, 37% bracket (NIIT on, 20% LTCG) |
| P8 | BvRP | Path 1, TX, 12% bracket (0% LTCG, recapture still 25%) |
| P9 | BvRP | Path 2, existing mortgage $450K (HELOC draw clamps to 0) |
| P10 | BvRP | Path 3, 10 properties, 1 retained |
| P11 | BvRP | Path 4, portfolio 100/0/0/0 and 0/0/0/100; one mix not summing to 100 |
| P12 | BvRP | adjusted basis 20%, years held 30 (depreciation cap at 27.5y) |
| P13 | BvRP | chart trajectories for P1, P2 and P10 at every t, all three scenarios |

Each vector is captured before and after on stat-block text, chart dataset arrays and the headline sentence.

## k. Where the code contradicts the spec — proposed amendments

Each item is a proposal for JM. Phase 0 doesn't apply any of them; the spec body is unchanged beyond the header fix.

1. **Like-for-like headline (spec §9, §8; new ruling).** BvRE nets rent off bitcoin but doesn't net carrying costs off the house (§b, §c). *Amend §9:* the difference line compares **wealth at equal cash out**. Either (a) bitcoin value vs house equity, with the renter investing the *full* monthly ownership gap (all-in, per R3/R6), or (b) both sides net of every cash outflow. Recommend (a): it matches the "Go deeper" intent and the ledger's "cumulative cash out" columns make it checkable. Leaning against the thesis, include maintenance on the house side.
2. **Rent in real mode (spec §7 / R4).** *Amend R4:* the rent path is computed in nominal terms and deflated for the Real view, like every other stream. This removes the ~$92K mode gap.
3. **Scenario grid (spec §10, Prompt 7).** `RETIREMENT_CALCULATOR_DESIGN_22` §3.6's 3×3 grid **never shipped** (`RETIREMENT_SCENARIO_COMPARISON_DESIGN.md:19–21`). *Amend:* G is a new component, not a reuse. The nearest pattern is the flagship's `CMP_VARIANTS` compare block (`the-bitcoin-retirement.js:1988–2330`). Consider building it as a shared component so the retirement flagship can adopt it later.
4. **`RETIREMENT_CALCULATOR_DESIGN_22` isn't in the repo** (not in the tree or git history). *Amend spec §2:* cite the Monte Carlo *no* via `PAGE_IDEAS_BACKLOG.md:568` and `COMPARE_RETIREMENT_PLANS_DESIGN.md:178`.
5. **CSV and chart helpers.** There is no shared CSV module and no shared chart wrapper. The CSV precedent is page-local, in two styles: clipboard (`the-bitcoin-retirement.js:948–1107`, `bitcoin-escape-velocity.js:1216–1288`) and Blob download (`the-bitcoin-retirement-stress-test.js:640–673`, `:981–989`). *Amend §9:* follow the **stress test's Blob download**, since the spec asks for a download, with the family's `#`-prefixed provenance header and real/nominal-labelled unit columns. Put `toCsv(rows, header)` in the new shared module.
6. **R2 presets already exist.** `realEstate` = `long-run 1` · `recent-decades 3.5` · `optimistic 5.5`, default `recent-decades` (`shared/modeling-assumptions.js:49–57`). BvRE is the only consumer (`re.js:1105`, `:1126`, `:1147`), and **no preset picker UI exists** for this dimension (BvRE's input writes `custom`). DATA_AUDIT already records **RE-1 ~0.4% real (1890–2024)** and **RE-2 ~3.7% real (2000–2024)** (`DATA_AUDIT.md:47–48`). *Amend R2:*
   - Re-derive the preset values from §f.
   - Rename the presets to match what they are.
   - Stop calling the default "generous" if it becomes the recent-decades figure.
   - Add a picker UI (BvRE and BvRP), since the spec's "sitewide picker" is currently data only.
   - Changing preset values affects stored `custom` users only if they were on a preset. Stored preset names survive a value change.
7. **Scenario definitions (R1).** "Upper" is **3.0×** on BvRE (`PL_CEIL`) and **2.5×** on BvRP (`rp.js:209`). BvRE's floor is a jump to 0.42× at the horizon end; BvRP has no floor. Day origins differ too: BvRE uses `(endYear−2009)×365.25`, BvRP uses `todayDays + t×365`. *Amend R1:* name the upper target (recommend 2.5×, which BvRP's comment calls conservative vs the 3.0× ceiling). All four scenarios use BvRP's linear multiple interpolation from today's multiple, with horizon measured from **today** in 365.25-day years, which also fixes the §b horizon mismatch.
8. **Selling costs (R6).** BvRP's current value is **8%** (`rp.js:237`), not "~7–8%"; BvRE's is none. The R6 default of 6% therefore *reduces* BvRP's exit cost. That leans toward selling the rental, i.e. *toward* the page's thesis, against §1's principle. JM to confirm 6% or keep 8% on BvRP.
9. **URL namespacing (spec §11).** BvRE has live unnamespaced params plus localStorage (`re.js:1285–1304`, `:1398`), shipped 2026-05-22 (SITE_GUIDE §17, `SITE_GUIDE.md:1228–1245`). SITE_GUIDE §46 has **no namespacing rule**. Its rule is "adopt an existing name, don't mint a synonym" (`SITE_GUIDE.md:2732`). *Amend §11:* adopt BvRE's existing names (`home`, `horizon`, `appr`, `mortgage`, `down`, `pscenario`) as the pair vocabulary and have BvRP read them. Mint new names only for new quantities (tax profile), and record them in §46. If JM wants prefixes anyway, BvRE must keep reading the legacy names.
10. **Chart zoom already exists on BvRP** (`rp.js:568`, `:1044–1059`). §9's "toggle on both" is new work for BvRE only.
11. **BvRP chart is "the starting point".** Confirmed, but it plots **total wealth**, not a difference line; the difference exists only as the chip delta (`rp.js:975`). The difference line is new on both pages.
12. **Tax correctness (spec §8, BvRP "existing treatment").** The existing treatment has the three issues in §d. *Amend §8:* "existing treatment, **corrected**": recapture at min(ordinary bracket, 25%) and never above the gain; depreciation on the original building basis derived from adjusted basis; state tax on rental income. PR 3 still moves the current math byte-identical.
13. **Capitalisation rule location (spec §5).** The Bitcoin/bitcoin rule is `SITE_GUIDE.md:1893` (§28, page-local to Risks to Bitcoin), not STYLE_GUIDE. STYLE_GUIDE has none. *Amend §5 and the prompts' shared rules* to cite SITE_GUIDE §28 (or promote the rule to STYLE_GUIDE).
14. **Dash rule conflict.** STYLE_GUIDE §10.2.1 (`STYLE_GUIDE.md:2279`) bans em-dashes; §11 (`:2471`) says "Explicitly NOT banned: em-dashes." §10.2.1 is later and says it supersedes. Worth a one-line fix in STYLE_GUIDE, outside this build.
15. **BvRE FAQ as target register (spec §5).** Its first answer carries "the comparison is not close" (`re.njk:19`), which also ships as JSON-LD. *Amend §5:* the target is the *third* FAQ answer's register, and answer 1 is in the sweep.
16. **Module location (spec §6).** "One module under `shared/`" resolves to `src/_includes/_pageassets/shared/`, included via each page's `page_scripts`. There are no ES modules. BvRP must add `calculator-helpers.js` (and `modeling-assumptions.js` once D lands) to its include list.
17. **BvRP has no SITE_GUIDE section** (BvRE is §14, `SITE_GUIDE.md:933–1046`). *Amend §11 bookkeeping:* "create a BvRP section" rather than "amend existing".
18. **Stale docs to fix in PR 8** (noted, not fixed here):
    - SITE_GUIDE §17's BvRE `pscenario` default says `floor`; the code says `trend` (`re.js:1302`).
    - §17 is missing `down` and `displaymode`.
    - §46 lists only BvRE tab hashes.
    - DATA_AUDIT BvRE-1–3 say "2014–2020", but the data runs 2013–2025.
    - `rp.js:96`, `:99–108` describe v0.1.
19. **Carrying-cost defaults are unsourced** (1.2% property tax, $150/mo insurance, 1% maintenance; `re.js:735–737`). *Add to §7:* each gets a source and a DATA_AUDIT row in PR 4, the same as R3's rent.
20. **BvRE retrospective hardcodes `asOf='April 2025'` and end year 2025** (`re.js:233`, `:245`), though `btcData`/`homeData` are annual averages. This is out of scope for the pair spec, but the ledger (F) will display it. Flag for PR 6.

## Not verified / owed

- **Nothing was executed.** No Node or Python on the machine. Every figure in §b–§e was hand-computed from the quoted formulas. PR 3's harness is the first execution-based check.
- **§f and §g** figures rely on on-site data plus external sources fetched on 2026-09-26. External values are dated and need re-checking at PR 4.
- **`RETIREMENT_CALCULATOR_DESIGN_22` §3.6** can't be read at source (§k-4).
