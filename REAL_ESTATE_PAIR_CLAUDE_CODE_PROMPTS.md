# REAL_ESTATE_PAIR — Claude Code prompts

_2026-09-26. Nine prompts, one per PR, executing `REAL_ESTATE_PAIR_DESIGN.md`. Run them in order; each ends with a report JM reviews before the next starts. Paste each prompt whole. Prompt 0 also commits the design doc to the repo._

_**Updated 2026-09-27 for `REAL_ESTATE_PAIR_RULINGS.md`** (JM's rulings on the Phase 0 report). Prompts 1–8 now carry the rulings that change them; ruling IDs (M1–M11, P1–P6, C1–C7) are cited inline. Prompt 0 is historical (done: PR #121)._

_Shared rules every prompt inherits (restated in each so a prompt can run cold):_
- _Read the design doc (v1.1) and `REAL_ESTATE_PAIR_RULINGS.md` first. Where they differ, the rulings win; the design doc's §14 logs every amendment._
- _Branch per PR; open a PR; do not merge. JM merges._
- _Preview-first wherever social metadata, shared templates or shared modules change._
- _Never touch the coefficients in `src/_includes/_pageassets/shared/power-law-data.js`._
- _Register: `STYLE_GUIDE §5`, `§10.2.1`, de-tell discipline (`§10.6`, `§11`), Bitcoin/bitcoin capitalisation per `SITE_GUIDE §28`._
- _Judgment calls lean against the thesis; measurable facts use the best-sourced central figure; every default change gets a before/after table (rulings §0)._
- _Anything you cannot verify, list in the report; never guess a figure or a source._

---

## Prompt 0 — Phase 0: read-only verification report

_Historical. Ran 2026-09-26 as PR #121; the report is `REAL_ESTATE_PAIR_PHASE0_REPORT.md`._

```
Context: We are revising /bitcoin-vs-real-estate (BvRE) and /bitcoin-vs-rental-property (BvRP) onto one shared framework. The spec, REAL_ESTATE_PAIR_DESIGN.md, is attached below / pasted at the end of this message. It was written chat-side from the live pages, not from the repo, so its claims about code structure are hypotheses. Your job in this PR is to replace hypotheses with facts. Change no page behaviour.

Do:
1. Commit REAL_ESTATE_PAIR_DESIGN.md at repo root on branch chore/real-estate-pair-phase0.
2. Read both pages end to end: templates, _pageassets head files, page JS, and every shared module they import (ModelingAssumptions, CalcHelpers, power-law-data, any chart helpers). Read SITE_GUIDE's sections on both pages, DATA_AUDIT BvRE-* and any BvRP-* rows, STYLE_GUIDE §5, §6.10/§6.12, §10.2.1, SITE_GUIDE §46 (URL vocabulary), and the retirement family's parity QA (evParityQA / crpParityQA) and CSV export code.
3. Write REAL_ESTATE_PAIR_PHASE0_REPORT.md at repo root answering, with file:line references:
   a. Engines: where each page's house, mortgage, rent, bitcoin-path and tax math lives; what is duplicated between them; what is already shared.
   b. BvRE defaults as coded: rent rule (is it 75% of P&I, or of P&I+tax+insurance?), rent growth rule, home appreciation, inflation source, property tax, insurance, maintenance, selling costs (spec believes none), mortgage-interest treatment, BTC scenario lines, projection anchor date.
   c. Compute and report BvRE's DEFAULT monthly own-vs-rent gap at today's defaults (all-in ownership incl. P&I, property tax, insurance; report with and without maintenance). The spec's chat-side estimate is ~$1,100/mo; confirm or correct.
   d. BvRP defaults as coded: scenario set and reversion method, rental appreciation (is it an input?), net yield, selling costs, tax components, depreciation basis, whether a real/nominal toggle exists, how the chart's keep-rental line is valued.
   e. Inflation interaction: with the sitewide inflation default, what nominal home appreciation and rent growth result, and how the fixed-rate mortgage is treated in real terms. State plainly whether the current model already credits the mortgage holder for inflation.
   f. Data for ruling R2: compute real home appreciation from data already on site (Shiller long run; and 1990–2025 or the nearest available window). Show the method.
   g. Candidate sources for ruling R3 (price-to-rent anchor): list 2–3 public primaries with URLs and what default rent each implies for the current default home price. Do not pick; JM rules.
   h. Social cards: does either OG image's baked-in text contain a claim the register pass would change?
   i. BvRP sourcing inventory: every figure whose source line says "NotebookLM synthesis", "modeled estimate" or "verification pending", plus every regulatory exhibit without a link. One row each: claim, current source text, where on page.
   j. Proposed shared module name and API (function signatures only), and the list of input vectors you will use to prove byte-identical outputs in the extraction PR.
   k. Anything in the spec that the code contradicts, with a proposed amendment.
4. Open the PR (report + design doc only). Stop. JM ratifies the report and rules R1–R10 before Prompt 1.
```

---

## Prompt 1 — BvRP sourcing and factual fixes (blocking)

```
Context: REAL_ESTATE_PAIR_DESIGN.md §4 (v1.1), REAL_ESTATE_PAIR_PHASE0_REPORT.md §i, and REAL_ESTATE_PAIR_RULINGS.md §5. BvRP (/bitcoin-vs-rental-property) currently cites "NotebookLM synthesis" and "verification pending" as sources and describes itself as a draft. It must be safe to share with a housing-research audience. This PR changes copy, static figures and DATA_AUDIT only; no engine changes (M1–M11 are PRs 3–5).

Branch: fix/bvrp-sourcing (from main).

Rules for this PR (rulings §5):
- Cutting beats weak sourcing. Fewer, sourced claims serve a research reader better than many unsourced ones. A US claim sourced to a UK survey (Property118) needs a US source or goes.

Do, for each item in design §4:
1. Remove the draft framing: the draft sentence in Methodology & Sources and the "v0.3 caveats" label.
2. For every item in the Phase 0 sourcing inventory (§i-1): find a primary source and cite it; or restate the figure as the site's own worked estimate with the method shown on-page ("our estimate: X, computed as…"); or remove it. Never keep a figure whose only source is a synthesis tool. Record each disposition in a table in the PR description.
3. Regulatory exhibits (Portland ME, Tacoma I-1, NYC Local Law 18, CA AB 1154): primary source each, or cut. The catch-all sources line (rp.njk:828) lists only what the page actually cites.
4. Remove or correct the "native bitcoin staking and liquid staking tokens" bullet — bitcoin has no native staking.
5. Restate the "conservative Power Law assumptions … 25–30% CAGR" claim: name the scenario and window, compute it live from the shared Power Law module (never hardcode), and add one clause that the trend growth rate declines over time, linking /the-bitcoin-hurdle-rate.
6. $500K side-by-side table: state its assumptions (an unencumbered $500K property; the sale is taxed, so the portfolio starts from after-tax proceeds, ~$411K); fix the ROC arithmetic (Phase 0 §i-3); name the spot slice's growth scenario, computed from the Power Law module.
7. Replace "Hassle: effectively zero" and "structurally inert" risk language with wording that names issuer-credit and market risk (e.g. "No operational load; issuer-credit and market risk instead").
8. Re-verify dated figures (Strategy BTC holdings, STRC/SATA rates, SATA distribution schedule, Strive BTC, $8.2B converts) against current filings; show as-of dates. SATA: the June 16, 2026 change is past; fix the tense and verify the current rate and schedule. Cash reserve: reconcile "roughly 6 months" with the USD Reserve in Strategy's latest filing; show the as-of date. Create the DATA_AUDIT bitcoin-vs-rental-property section (none exists) with BvRP-* rows and next-due dates.
9. Update MONTHLY_REFRESH_CHECKLIST for any dated figure now on the page.

Acceptance: grep the built page for "NotebookLM", "verification pending", "modeled estimate", "draft" — zero reader-facing hits (or each remaining one deliberately kept and justified in the PR). No console errors; mobile 375px unchanged.

Report in the PR: the disposition table; any figure you could not verify (list it; JM will route it to chat-side research); any claim you removed and why.
```

---

## Prompt 2 — Register pass on both pages + metadata

```
Context: REAL_ESTATE_PAIR_DESIGN.md §5 (v1.1) and REAL_ESTATE_PAIR_RULINGS.md §4 (C1–C4). Both pages make verdicts their own FAQs disclaim. Keep every argument; remove the certainty. The target register is BvRE FAQ answer 3 ("Real estate is less volatile year to year…"). Copy only; no engine or layout changes.

Branch: chore/real-estate-pair-register, stacked on fix/bvrp-sourcing (PR 1). Preview-first (social metadata changes).

Do:
1. Sweep BvRE body copy, tooltips, captions, headings and FAQ. Rewrite every line listed in design §5 and anything else that asserts an outcome, a timeline or inevitability. FAQ answer 1 is in the sweep ("the comparison is not close" goes); the FAQPage JSON-LD updates with it (C4). Rules: STYLE_GUIDE §5 (show, don't claim), §10.2.1 (dashes), de-tell (§10.6, §11: no honest/honestly/load-bearing), Bitcoin/bitcoin capitalisation per SITE_GUIDE §28.
2. Reconcile BvRE's floor tooltip with /the-bitcoin-floor's breach record (four episodes; deepest ~42.6% below the floor). Read that page's figures from the repo; do not copy these numbers from this prompt.
3. Sweep BvRP the same way, including the H1 subtitle and "the math is not close".
4. Apply the ruled heroes verbatim (C1, dash-free):
   - BvRE: "A house didn't used to be an investment. Under sound money it was shelter, bought with savings at two to three years' income. Fiat money turned it into the default savings account. Bitcoin now competes for that role."
   - BvRP subtitle: "The landlord's comparison: operating costs, tax and exit frictions on one side, the alternative's risks on the other."
5. Metadata: BvRE — drop "and taxes" from meta/OG/Twitter/JSON-LD descriptions until the tax regime ships (PR 5 restores it). BvRP — align meta/OG/Twitter/JSON-LD descriptions with the new subtitle. Also llms.txt descriptions.
6. OG images: not regenerated. Phase 0 §h found no baked-in claim the register pass changes.
7. Homepage Explore cards and carousel slides, /calculators tile taglines (src/_data/explorations.json) and Related-card descriptions that quote either page: same sweep. updates.json changelog entries are carved out of de-tell sweeps; leave them.
8. STYLE_GUIDE §11: one-line fix so its "em-dashes not banned" line points to §10.2.1, which supersedes it (C3).

Report in the PR: a before/after table of every changed line (both pages, metadata included). Note owed after merge: X/LinkedIn card re-scrape for both pages.
```

---

## Prompt 3 — Shared engine extraction (byte-identical)

```
Context: REAL_ESTATE_PAIR_DESIGN.md §6 (v1.1) and the Phase 0 report §a, §j. Extract the house, mortgage, rent, bitcoin-path, landlord and existing tax math from both pages into one shared module at src/_includes/_pageassets/shared/real-estate-model.js, exposing window.RealEstateModel (C6). This PR changes NO figure on either page. It doesn't depend on the M/P rulings.

Branch: refactor/real-estate-shared-engine. Preview-first (shared module).

Do:
1. Create the shared module: pure functions, no DOM, plain script included via each page's page_scripts (no ES modules). Move code; do not rewrite logic. Where the two pages implement the same thing differently, keep BOTH behaviours behind explicit parameters for now (harmonisation is Prompt 4). BvRP's tax issues (Phase 0 §d) move as-is; PR 5 corrects them.
2. Point both pages at the module. BvRP adds calculator-helpers.js to its include list.
3. Add a ledger function that returns year-by-year rows from the same computations (used in Prompt 6; not rendered yet).
4. Prove byte-identical outputs: for every input vector listed in Phase 0 §j, capture each page's rendered stat-block values and chart end-points before and after. The harness pins Date.now(), the live BTC price, every ModelingAssumptions dimension, and clears lcs.bvre.calc.v1 (M10, §j). Commit the harness (a script or a QA function in the style of evParityQA) so it can be re-run.
5. No change to the Power Law coefficients.

Acceptance: all vectors identical before/after on both pages; no console errors; page weight change noted.
Report: module API, the vector table (before = after), anything you had to keep page-specific and why.
```

---

## Prompt 4 — Harmonised assumptions

```
Context: REAL_ESTATE_PAIR_DESIGN.md §3 and §7 (v1.1), REAL_ESTATE_PAIR_RULINGS.md M1, M3–M6, M8, M10, M11, P5, C7. This PR changes figures deliberately. Every change is reported, whichever way it moves (rulings §0).

Branch: feat/real-estate-harmonised-assumptions. Preview-first.

Do:
1. M1 — nominal model. Home appreciation becomes a NOMINAL input on both pages; house, rent, mortgage and costs are computed in nominal dollars; inflation affects only the Real display (both paths deflated by the same factor). Presets (nominal): Long run (Shiller 1890 to latest full year, ~3%) · Since 1990 (~4.2%) · Since 2000 (~4.8%, default) · Custom. Re-verify every value against FRED CSUSHPINSA and Shiller's own file (http://www.econ.yale.edu/~shiller/data.htm), end point = latest full year; DATA_AUDIT row each. BvRP's hardcoded 3.0% (rp.js:131) becomes this shared input. Replace the real `realEstate` ModelingAssumptions dimension with a nominal one: propose the key and migration; a stored custom real value converts once at read time using the sitewide inflation, and the page says so in one line. Correct DATA_AUDIT RE-2 and STYLE_GUIDE §3.5's real-estate table and rationale (C7).
2. P5 / R5 — show the sitewide inflation picker (CPI / M2 growth / custom) in the baseline block as the deflator; the Real label names it ("today's dollars, deflated at X% a year (M2 growth)"). Assumptions line: "When inflation runs higher, home prices tend to rise in nominal terms while a fixed-rate loan balance doesn't. That is the fixed-rate borrower's inflation benefit. To model a higher-inflation future, raise nominal appreciation."
3. M3 / R1 — one bitcoin scenario set on both pages: Floor · Stay at today's multiple · Trend · Upper. All use linear interpolation of the multiple from today's value to the target at the horizon end; Upper target 2.5×. Default: Stay at today's multiple. Trend tooltip: "Assumes the gap to trend closes in a straight line by the horizon end. In the record, reversion has been irregular in timing." Floor drawn faintly on any chart; Upper selectable, never default, keeps its brief-peak caveat. Show the selected scenario's implied annual growth rate beside the selector. Labels position-neutral; review copy at a simulated above-trend position (Hurdle Rate v2 rule). Scenario prices from the shared Power Law module only.
4. M10 — one horizon: every path runs the same horizon from today, in 365.25-day years.
5. M4 / R3 — default rent = home price ÷ (12 × P/R), P/R from Zillow ZORI (all homes) ÷ ZHVI (typical value, middle tier), US; verify current values; DATA_AUDIT row; semiannual refresh line in MONTHLY_REFRESH_CHECKLIST; user override kept. Source the $420K default home price (existing-home median or MSPUS, whichever it tracks) and state the basis. Retrospective mode: propose the historical-rent method (Zillow historical P/R where it exists, ZORI from ~2015; CPI-rent backcast earlier) and report before/after.
6. M5 / R4 — rent grows at the house's nominal appreciation (constant P/R), exposed as an input; computed nominally and deflated in the Real view.
7. M6 / R6 — buyer closing costs (new, sourced % of price, input); property tax, insurance, maintenance sourced with DATA_AUDIT rows, property tax and maintenance as % of CURRENT home value, insurance growing with value; selling costs one shared default sourced to post-2024 commission data plus seller closing costs, midpoint of any range, input 0–10%, applied at sale on both pages (BvRP's forced/distressed-sale material stays as prose context); bitcoin transaction cost 0.5% per purchase and sale, input 0–2%.
8. M8 — BvRP's existing mortgage applies on every path: sale paths repay it from proceeds before redeploying; keep-rental carries the amortizing balance (off equity), debt service (off cash flow) and deductible interest. Add rate and remaining-term inputs with stated defaults.
9. M11 — retrospective house path applies Case-Shiller National growth from the start year to the starting median price; same fix for the static "growth of $1" and "every starting year" exhibits (re.js:93–220). The "BTC required to buy the median house" chart may keep MSPUS as a price level labelled "median new house".
10. One shared "Baseline assumptions" block on both pages (BvRP's set-once, then-ignore pattern). Real/nominal display toggle on both.
11. DATA_AUDIT: a row for every changed or new default, with source and next-due.
12. BvRP yield-portfolio default allocation (logged from PR 1, 2026-09-27). The calculator's default 45/30/10/15 STRC/SATA/Ledn/spot puts 10% in Ledn. PR 1 set its rate to 5% and flagged it as stablecoin lending, **not available to US residents** (DATA_AUDIT BvRP-18; Ledn is moving US clients to Ledn US LLC from October 2026, so re-check eligibility first). Propose, with a before/after at defaults: (a) whether the default allocation should include a slice a US reader can't buy; (b) whether the slice should name a platform at all or be a generic "stablecoin / CeFi lending" slice with a stated rate; (c) the replacement default. JM rules before it ships.

Acceptance: re-run the Prompt 3 harness; every changed figure is explained by a named ruling. The inflation preset changes only the Real display, never which path is ahead. Parity: identical shared inputs give identical house-side figures on both pages.
Report: before/after table at the default scenario and at two other vectors, per page; which ruling moved each figure (M1's correction moves results toward bitcoin — report it plainly).
```

---

## Prompt 5 — Tax regime and pre-/post-tax results

```
Context: REAL_ESTATE_PAIR_DESIGN.md §8 (v1.1), rulings M7, M9 (R7/R8). Add a tax regime input to both pages and show pre-tax → tax → after-tax results for each path, If sold basis. After-tax leads.

Branch: feat/real-estate-tax-regime. Preview-first.

Do:
1. VERIFY FIRST (blocking): from IRS primaries, the Section 121 exclusion amounts and the 2-of-5-year ownership-and-use test; current-year long-term capital-gains rate thresholds and a defensible mapping from ordinary brackets; the NIIT rate and thresholds; the unrecaptured §1250 gain cap; any 2025–26 legislative changes to these. Log each in DATA_AUDIT with URL and next-due date. If any cannot be verified, stop and report.
2. Regime selector on both pages: United States (default) · No capital-gains tax · Custom.
3. United States:
   - BvRE home: gain = exit price − selling costs − purchase price; Section 121 exclusion by filing status; excess at LTCG + state + NIIT where applicable.
   - BvRP rental: existing treatment, CORRECTED (M9): recapture at min(ordinary bracket, 25%) and never above the gain; depreciation on the original building basis derived from adjusted basis; state tax on rental income; LTCG, state, NIIT at exit; 1031 unavailable into bitcoin. Before/after table for the correction.
   - BvRP yield portfolio, return-of-capital basis exhaustion (logged from PR 1, 2026-09-27). The calculator treats STRC/SATA distributions as untaxed for the whole hold (calcYieldPortfolio, calcYieldPortfolioAtYearT), but at 12–13% yields the basis is used up in about eight years. Model it: track each instrument's basis year by year; ROC reduces basis; distributions beyond basis are taxed as long-term capital gains in the year paid; at sale, the gain is proceeds − remaining (reduced) basis. Treat ROC as the issuers' stated expectation (Strategy's 2025 report; Strive's 2026 Forms 8937), tax-deferred, never tax-free. Before/after at defaults and at 10 and 20 years.
   - Bitcoin: gain = exit value − cost basis; LTCG + state + NIIT where applicable. Bitcoin sold during the horizon (M2 shortfalls) is taxed in the year of sale, average-cost basis, long-term rates; stated in a tooltip. Holding-location toggle: taxable (default) / tax-advantaged (no tax at exit), with the contribution-limit note.
   - Inputs: filing status (new; default married filing jointly), federal bracket and state (BvRP's existing components, now shared). Tooltips state the bracket-to-LTCG approximation.
   - Mortgage-interest deduction: off by default, tooltip explains why; toggle for itemisers.
4. No capital-gains tax: both paths untaxed at exit; property tax still a carrying cost.
5. Custom: home-gain rate, home exemption amount (default 0), bitcoin-gain rate.
6. Results (M7): per path, If sold: market value → selling costs → pre-tax proceeds → tax → after-tax proceeds; after-tax leads, pre-tax beside it; the Section 121 exclusion shows as its own number. The pre-tax view shows no tax anywhere. BvRE's retrospective mode uses the same functions.
7. "Not tax advice" line beside the selector on both pages.
8. BvRE metadata: restore "taxes included" wording now that it is true.

Acceptance: hand-check three cases per page against a spreadsheet (include one where the home gain exceeds the exclusion and one tax-advantaged bitcoin case); parity passes; mobile 375px usable.
Report: the verification table; the hand-check table; before/after headline figures at defaults.
```

---

## Prompt 6 — Equal cash out, chart with difference line, and the "show the calculation" ledger

```
Context: REAL_ESTATE_PAIR_DESIGN.md §9 (v1.1), rulings M2, M7, P2, P4, P6. Figures come from the shared engine. M2 changes figures: report before/after.

Branch: feat/real-estate-results. Preview-first (shared chart config).

Do:
1. M2 — equal cash out, replacing the "Go deeper" DCA. At purchase the renter's bitcoin receives the buyer's upfront cash (down payment + buyer closing costs). Each month it receives the owner's all-in cost (P&I + property tax + insurance + maintenance) minus rent; when negative, the renter sells bitcoin at that month's scenario price (M3 monthly path, replacing the geometric path; bitcoin transaction cost applies). Cash purchase follows the same rule. Retire the cash-mode S&P leg (re.js:1024–1049). Toggle "The renter invests the difference", on by default; off = only the upfront sum is invested and shortfalls come from income. The toggle sits with the results, not in the baseline block (P6).
2. M7 — two valuation bases: Held (market value less debt; no selling costs, no tax) and If sold (less selling costs, then less tax). BvRP's current mark-to-market keep-rental line becomes its Held view.
3. Chart on both pages, built once in the shared module from BvRP's Chart.js chart (P2): wealth over time per path, Held / If sold (after tax) toggle, default If sold. The DIFFERENCE line is the visual hero (new on both, P4). Floor scenario drawn faintly. Full window / first 3 years toggle: already on BvRP; add to BvRE (P4). Keep the existing stat block beneath the chart.
4. "Show the calculation" disclosure beneath the results on both pages, rendering the engine's ledger rows, one row per year, two tabs:
   - BvRE: "The house" (value, mortgage balance, principal, interest, property tax, insurance, maintenance, equity, cumulative cash out) and "Bitcoin + rent" (scenario price, BTC bought/sold, BTC held, value, rent paid, contributions, cumulative cash out).
   - BvRP: "The rental" (value, balance, net cash flow, depreciation, equity, cumulative cash) and "Bitcoin path" (scenario price, BTC held, value, distributions/contributions, cumulative cash).
   - Final rows per path: market value → selling costs → pre-tax proceeds → tax → after-tax proceeds.
   - Units in every column header; values in the current real/nominal frame, stated above the table.
5. CSV download of both tabs (P2): Blob download following the-bitcoin-retirement-stress-test.js:640–673 and :981–989, with the retirement family's #-prefixed provenance header and unit-labelled columns; toCsv lives in the shared module. Filename <page-slug>.csv.
6. Fix the retrospective's hardcoded "April 2025" label (re.js:245) while the ledger surfaces it (C6 / Phase 0 §k-20); log the 2026 data refresh.
7. Mobile: ledger scrolls horizontally inside its own container (no page scroll); chart legible at 375px.

Acceptance: ledger final rows = stat block = chart end-points, all four scenarios, both bases, both pages; cumulative cash out identical on both ledger tabs (add both to the parity harness). CSV opens cleanly in a spreadsheet.
Report: before/after for M2; screenshots desktop + 375px, both pages; the parity result.
```

---

## Prompt 7 — Sensitivity grid

```
Context: REAL_ESTATE_PAIR_DESIGN.md §10 (v1.1), rulings R9 / P1. The retirement 3×3 scenario grid never shipped (RETIREMENT_SCENARIO_COMPARISON_DESIGN.md:19–21), so this is a NEW component. Build it so the retirement flagship can adopt it later. Nearest pattern for structure: the flagship's CMP_VARIANTS compare block (the-bitcoin-retirement.js:1988–2330).

Branch: feat/real-estate-sensitivity.

Do:
1. 3×3 grid on both pages, reader's configuration in the centre cell.
2. Axis-pair toggle. Default: bitcoin scenario (Floor · Stay · Trend) × home appreciation (long run · default · default + 2 points, a housing-boom case). Alternative: horizon × mortgage rate (BvRE) / horizon × net rental yield (BvRP). Upper never appears in the grid (M3).
3. Each cell: after-tax difference, If sold (bitcoin path minus house path), sign-neutral colour scale, value labelled.
4. Caption: a map of how the answer moves with two assumptions, not a probability distribution.
5. Mobile: compact table form.

Acceptance: centre cell equals the headline after-tax difference; grid recomputes on input change without jank; parity harness still passes.
Report: screenshots; any performance note; whether the component is ready for the retirement flagship to adopt.
```

---

## Prompt 8 — Pair framing, carry, parity, bookkeeping

```
Context: REAL_ESTATE_PAIR_DESIGN.md §11–§12 (v1.1), rulings C1, C6, P3, M2. Close the build.

Branch: feat/real-estate-pair-close.

Do:
1. Framing (C1), verbatim, in each hero and each page's Related card:
   - BvRE: "The tenant's side of the decision. For the landlord's side, see Bitcoin vs. Rental Property."
   - BvRP: "The landlord's side of the decision. For the tenant's side, see Bitcoin vs. Real Estate."
2. Carry (P3): adopt BvRE's existing URL names as the pair vocabulary; BvRP reads them; no prefixes. New quantities get new names (nominal appreciation is new), recorded in SITE_GUIDE §46. A legacy `appr` (real) is read once, converted using the sitewide inflation, never written again, and the page shows one line saying the link used an older format. Legacy `pscenario` values map to the M3 keys. A "Run this on the other side" link on each page carries the shared inputs; share-link buttons include them.
3. Parity QA: finalise the tripwire in the style of evParityQA/crpParityQA (console function, input-only vectors, identity assertions against the shared module, green PASS / console.error FAIL / console.table). Assert: (1) house-side and tax figures identical across pages for identical shared inputs; (2) ledger = stat block = chart on each page; (3) cumulative cash out identical on both ledger tabs (M2).
4. Bookkeeping: SITE_GUIDE §14 amended and a NEW BvRP section (none exists, C6); the stale docs Phase 0 §k-18 lists (SITE_GUIDE §17's BvRE pscenario default and missing params, §46's BvRE entry, DATA_AUDIT BvRE-1–3 year ranges, rp.js header comments); DATA_AUDIT rows complete; MONTHLY_REFRESH_CHECKLIST lines for dated figures; updates.json entries (neutral register); STYLE_GUIDE note if the ledger/CSV or grid becomes a house component; PAGE_IDEAS_BACKLOG "Real-estate pair" entry marked shipped with SHAs; REAL_ESTATE_PAIR_DESIGN.md marked historical-from-ship, with SITE_GUIDE authoritative.
5. Run the full acceptance list in design §12 and report each item.

Report: the §12 checklist with pass/fail per item; post-deploy checks owed (cards serving image/jpeg, X/LinkedIn re-scrape).
```
