# REAL_ESTATE_PAIR — Claude Code prompts

_2026-09-26. Nine prompts, one per PR, executing `REAL_ESTATE_PAIR_DESIGN.md`. Run them in order; each ends with a report JM reviews before the next starts. Paste each prompt whole. Prompt 0 also commits the design doc to the repo._

_Shared rules every prompt inherits (restated in each so a prompt can run cold):_
- _Read the design doc first; it is authoritative, except where Phase 0 has amended it._
- _Branch per PR; open a PR; do not merge. JM merges._
- _Preview-first wherever social metadata, shared templates or shared modules change._
- _Never touch `shared/power-law-data.js` coefficients._
- _Register: `STYLE_GUIDE §5`, `§10.2.1`, de-tell discipline, Bitcoin/bitcoin capitalisation._
- _Anything you cannot verify, list in the report; never guess a figure or a source._

---

## Prompt 0 — Phase 0: read-only verification report

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
Context: REAL_ESTATE_PAIR_DESIGN.md §4 (committed at repo root) and REAL_ESTATE_PAIR_PHASE0_REPORT.md §i. BvRP (/bitcoin-vs-rental-property) currently cites "NotebookLM synthesis" and "verification pending" as sources and describes itself as a draft. It must be safe to share with a housing-research audience. This PR changes copy and sourced figures only; no engine changes.

Branch: fix/bvrp-sourcing.

Do, for each item in design §4:
1. Remove the draft sentence in Methodology & Sources.
2. For every item in the Phase 0 sourcing inventory: find a primary source and cite it; or restate the figure as the site's own worked estimate with the method shown on-page ("our estimate: X, computed as…"); or remove it. Never keep a figure whose only source is a synthesis tool. Record each disposition in a table in the PR description.
3. Regulatory exhibits (Portland ME, Tacoma I-1, NYC Local Law 18, CA AB 1154): primary source each, or cut.
4. Remove or correct the "native bitcoin staking and liquid staking tokens" bullet — bitcoin has no native staking.
5. Restate the "conservative Power Law assumptions … 25–30% CAGR" claim: name the scenario and window, compute it live from the shared Power Law module (never hardcode), and add one clause that the trend growth rate declines over time, linking /the-bitcoin-hurdle-rate.
6. $500K side-by-side table: tie the spot-BTC slice's growth to a named, module-computed scenario, or show floor and trend.
7. Replace "Hassle: effectively zero" and "structurally inert" risk language with wording that names issuer-credit and market risk (e.g. "No operational load; issuer-credit and market risk instead").
8. Re-verify dated figures (Strategy BTC holdings, STRC/SATA rates, SATA daily-distribution date, Strive BTC, $8.2B converts) against current filings; show as-of dates; add/refresh DATA_AUDIT BvRP-* rows (create the section if absent) with next-due dates.
9. Update MONTHLY_REFRESH_CHECKLIST for any dated figure now on the page.

Acceptance: grep the built page for "NotebookLM", "verification pending", "modeled estimate", "draft" — zero reader-facing hits (or each remaining one deliberately kept and justified in the PR). No console errors; mobile 375px unchanged.

Report in the PR: the disposition table; any figure you could not verify (list it; JM will route it to chat-side research); any claim you removed and why.
```

---

## Prompt 2 — Register pass on both pages + metadata

```
Context: REAL_ESTATE_PAIR_DESIGN.md §5. Both pages make verdicts their own FAQs disclaim. Keep every argument; remove the certainty. BvRE's FAQ ("not a verdict … both views show their work") is the target register. Copy only; no engine or layout changes.

Branch: chore/real-estate-pair-register. Preview-first (social metadata changes).

Do:
1. Sweep BvRE body copy, tooltips, captions, headings and FAQ. Rewrite every line listed in design §5 and anything else that asserts an outcome, a timeline or inevitability. Rules: STYLE_GUIDE §5 (show, don't claim), §10.2.1 (dashes), de-tell (no honest/honestly/load-bearing), Bitcoin/bitcoin capitalisation.
2. Reconcile BvRE's floor tooltip with /the-bitcoin-floor's breach record (four episodes; deepest ~42.6% below the floor). Read that page's figures from the repo; do not copy these numbers from this prompt.
3. Sweep BvRP the same way, including the H1 subtitle and "the math is not close".
4. Apply the R10 hero/subtitle rewrites from design §5 (JM may have edited them; use the committed spec).
5. Metadata: BvRE — drop "and taxes" from meta/OG/Twitter/JSON-LD descriptions until the tax regime ships (PR 5 restores it). BvRP — align meta/OG/Twitter/JSON-LD descriptions with the new subtitle. Also llms.txt descriptions if present.
6. OG images: regenerate only if Phase 0 §h found a baked-in claim that changed. If regenerated, follow the existing build-og-*.py pattern, register the new asset name, keep the old one registered for cached shares, and verify it serves as image/jpeg, not text/html.
7. Homepage Explore cards, /calculators tile taglines and Related-card descriptions that quote either page: same sweep.

Report in the PR: a before/after table of every changed line (both pages, metadata included). Note owed after merge: X/LinkedIn card re-scrape for both pages.
```

---

## Prompt 3 — Shared engine extraction (byte-identical)

```
Context: REAL_ESTATE_PAIR_DESIGN.md §6 and the Phase 0 report §a, §j. Extract the house, mortgage, rent, bitcoin-path, landlord and existing tax math from both pages into one shared module (name and API as ratified in Phase 0). This PR changes NO figure on either page.

Branch: refactor/real-estate-shared-engine. Preview-first (shared module).

Do:
1. Create the shared module: pure functions, no DOM. Move code; do not rewrite logic. Where the two pages implement the same thing differently, keep BOTH behaviours behind explicit parameters for now (harmonisation is Prompt 4).
2. Point both pages at the module.
3. Add a ledger function that returns year-by-year rows from the same computations (used in Prompt 6; not rendered yet).
4. Prove byte-identical outputs: for every input vector listed in Phase 0 §j, capture each page's rendered stat-block values and chart end-points before and after. Commit the harness (a script or a QA function in the style of evParityQA) so it can be re-run.
5. No change to shared/power-law-data.js.

Acceptance: all vectors identical before/after on both pages; no console errors; page weight change noted.
Report: module API, the vector table (before = after), anything you had to keep page-specific and why.
```

---

## Prompt 4 — Harmonised assumptions

```
Context: REAL_ESTATE_PAIR_DESIGN.md §3 (rulings R1–R6 as ratified by JM — read the committed spec and the PR 0 thread for any overrides) and §7. This PR changes figures deliberately. Every change is reported.

Branch: feat/real-estate-harmonised-assumptions. Preview-first.

Do:
1. R1 — one bitcoin scenario set on both pages: Floor · Stay at today's multiple · Trend · Upper. Default Trend. Floor always drawn faintly on any chart. Upper selectable, never default. Reversion by linear interpolation from today's multiple, named as a simplification in the tooltip. Scenario prices from the shared Power Law module only.
2. R2 — home appreciation: one input wired to the sitewide ModelingAssumptions real-estate picker, with the presets and default ratified from Phase 0 §f. Tooltip states the basis.
3. R3 — default rent: the ratified price-to-rent anchor, cited; user override kept. Tooltip states the source.
4. R4 — rent growth: default = the house's nominal appreciation (constant price-to-rent), exposed as an input, stated in a tooltip.
5. R5 — keep the sitewide inflation default; add one line in each calculator's assumptions: higher inflation favours the fixed-rate mortgage holder, because the debt is repaid in cheaper dollars.
6. R6 — selling costs: one shared default (ratified value, 6% recommended), input 0–10%, applied to the house at exit on both pages. BvRP's forced/distressed-sale material stays as prose context.
7. One shared "Baseline assumptions" block on both pages (BvRP's set-once, then-ignore pattern). Real/nominal display toggle on both.
8. DATA_AUDIT: a row for every changed or new default, with source and next-due.

Acceptance: re-run the Prompt 3 harness; every changed figure is explained by a named ruling. Parity: identical shared inputs give identical house-side figures on both pages.
Report: before/after table at the default scenario and at two other vectors, per page; which ruling moved each figure.
```

---

## Prompt 5 — Tax regime and pre-/post-tax results

```
Context: REAL_ESTATE_PAIR_DESIGN.md §8 and ruling R7/R8. Add a tax regime input to both pages and show pre-tax → tax → after-tax results for each path. After-tax leads.

Branch: feat/real-estate-tax-regime. Preview-first.

Do:
1. VERIFY FIRST (blocking): from IRS primaries, the Section 121 exclusion amounts and the 2-of-5-year ownership-and-use test; current-year long-term capital-gains rate thresholds and a defensible mapping from ordinary brackets; the NIIT rate and thresholds; the unrecaptured §1250 gain cap; any 2025–26 legislative changes to these. Log each in DATA_AUDIT with URL and next-due date. If any cannot be verified, stop and report.
2. Regime selector on both pages: United States (default) · No capital-gains tax · Custom.
3. United States:
   - BvRE home: gain = exit price − selling costs − purchase price; Section 121 exclusion by filing status; excess at LTCG + state + NIIT where applicable.
   - BvRP rental: existing treatment (recapture, LTCG, state, NIIT; 1031 unavailable into bitcoin), now in the shared module.
   - Bitcoin: gain = exit value − cost basis; LTCG + state + NIIT where applicable. Holding-location toggle: taxable (default) / tax-advantaged (no tax at exit), with the contribution-limit note.
   - Inputs: filing status (new; default married filing jointly), federal bracket and state (BvRP's existing components, now shared). Tooltips state the bracket-to-LTCG approximation.
   - Mortgage-interest deduction: off by default, tooltip explains why; toggle for itemisers.
4. No capital-gains tax: both paths untaxed at exit; property tax still a carrying cost.
5. Custom: home-gain rate, home exemption amount (default 0), bitcoin-gain rate.
6. Results: for each path show pre-tax terminal value, tax, after-tax terminal value, after-tax leading. BvRE's retrospective mode uses the same functions.
7. "Not tax advice" line beside the selector on both pages.
8. BvRE metadata: restore "taxes included" wording now that it is true.

Acceptance: hand-check three cases per page against a spreadsheet (include one where the home gain exceeds the exclusion and one tax-advantaged bitcoin case); parity passes; mobile 375px usable.
Report: the verification table; the hand-check table; before/after headline figures at defaults.
```

---

## Prompt 6 — Chart with difference line, and the "show the calculation" ledger

```
Context: REAL_ESTATE_PAIR_DESIGN.md §9. Presentation only; figures come from the shared engine.

Branch: feat/real-estate-results. Preview-first if the chart helper is shared.

Do:
1. Chart on both pages (BvRP's existing chart is the starting point; BvRE gains one): wealth over time for each path (house equity after selling costs; after tax at exit when the after-tax view is on), bitcoin path value, rent paid shown as a cost. The DIFFERENCE line is the visual hero. Floor scenario drawn faintly. Full window / first 3 years toggle on both. Keep the existing stat block beneath the chart.
2. "Show the calculation" disclosure beneath the results on both pages, rendering the engine's ledger rows, one row per year, two tabs:
   - BvRE: "The house" (value, mortgage balance, principal, interest, property tax, insurance, maintenance, equity, cumulative cash out) and "Bitcoin + rent" (scenario price, BTC held, value, rent paid, contributions, cumulative cash out).
   - BvRP: "The rental" (value, balance, net cash flow, depreciation, equity, cumulative cash) and "Bitcoin path" (scenario price, BTC held, value, distributions/contributions, cumulative cash).
   - Final row: pre-tax, tax, after-tax per path.
   - Units in every column header; values in the current real/nominal frame, stated above the table.
3. CSV download of both tabs, following the retirement family's CSV export code and header conventions.
4. Mobile: ledger scrolls horizontally inside its own container (no page scroll); chart legible at 375px.

Acceptance: ledger final rows = stat block = chart end-points, all four scenarios, both pages (add this to the parity harness). CSV opens cleanly in a spreadsheet.
Report: screenshots desktop + 375px, both pages; the parity result.
```

---

## Prompt 7 — Sensitivity grid

```
Context: REAL_ESTATE_PAIR_DESIGN.md §10 and ruling R9. Reuse the retirement flagship's scenario-grid pattern (RETIREMENT_CALCULATOR_DESIGN_22 §3.6); read its implementation first and reuse components rather than rebuilding.

Branch: feat/real-estate-sensitivity.

Do:
1. 3×3 grid on both pages, reader's configuration in the centre cell.
2. Axis-pair toggle. Default: bitcoin scenario × home appreciation. Alternative: horizon × mortgage rate (BvRE) / horizon × net rental yield (BvRP).
3. Each cell: after-tax difference (bitcoin path minus house path), sign-neutral colour scale, value labelled.
4. Caption: a map of how the answer moves with two assumptions, not a probability distribution.
5. Mobile: compact table form.

Acceptance: centre cell equals the headline after-tax difference; grid recomputes on input change without jank; parity harness still passes.
Report: screenshots; any performance note.
```

---

## Prompt 8 — Pair framing, carry, parity, bookkeeping

```
Context: REAL_ESTATE_PAIR_DESIGN.md §11–§12. Close the build.

Branch: feat/real-estate-pair-close.

Do:
1. Framing: one line in each hero and each page's Related card naming the pair — BvRE the tenant's side, BvRP the landlord's side of the same lease.
2. Carry: namespaced URL params for the shared inputs (home price, rate, horizon, appreciation, tax profile, scenario) per SITE_GUIDE §46; a "Run this on the other side" link on each page carrying them; share-link buttons include them.
3. Parity QA: finalise the tripwire (house-side and tax figures identical across pages for identical shared inputs; ledger = stat block = chart on each page). Name it in the style of evParityQA/crpParityQA.
4. Bookkeeping: SITE_GUIDE sections for both pages; DATA_AUDIT rows complete; MONTHLY_REFRESH_CHECKLIST lines for dated figures; updates.json entries (neutral register); STYLE_GUIDE note if the ledger/CSV becomes a house component; PAGE_IDEAS_BACKLOG entry marked shipped with SHAs; REAL_ESTATE_PAIR_DESIGN.md marked historical-from-ship, with SITE_GUIDE authoritative.
5. Run the full acceptance list in design §12 and report each item.

Report: the §12 checklist with pass/fail per item; post-deploy checks owed (cards serving image/jpeg, X/LinkedIn re-scrape).
```
