# REAL_ESTATE_PAIR_DESIGN — Bitcoin vs. Real Estate + Bitcoin vs. Rental Property

_v1, 2026-09-26. Build spec for revising `/bitcoin-vs-real-estate` (BvRE) and `/bitcoin-vs-rental-property` (BvRP) onto one framework. Promotes a chat-side backlog capture (`REAL_ESTATE_PAIR_REVISION_2026-09-26`, a project note, not a repo file). Commit this file at repo root (planning docs are repo-tracked; no `claude/` prefix). The Claude Code prompts that execute it are in `REAL_ESTATE_PAIR_CLAUDE_CODE_PROMPTS.md`._

_Written chat-side from the live pages (read 2026-09-26) and the project docs, **not** from the repo. Anything this spec says about code structure is a hypothesis for Phase 0 to confirm or correct. Where Phase 0 finds the code differs, Phase 0's finding wins and this spec is amended._

---

## 1 · Purpose and the frame that binds the pair

Two pages, one decision seen from opposite chairs of the same lease:

- **BvRE — the tenant's side.** Own the home you live in, or rent it and hold the difference in bitcoin.
- **BvRP — the landlord's side.** Own the rental, or hold bitcoin / bitcoin-yield instead.

Today they share a subject and almost nothing else: different bitcoin scenario sets, different assumption surfaces, different results formats, tax on one side only. This revision gives them **one engine, one assumption surface, one results pattern**, brings both to current register and sourcing standards, and adds four capabilities JM asked for: a dynamic chart, a sensitivity view, a year-by-year "show the calculation" ledger, and pre-/post-tax results under a changeable tax regime.

**Why now:** the pair is the site's entry point to a housing-research audience (Zelman & Associates). That reader checks the arithmetic, knows the market rent gap by heart, and will notice a missing home-sale tax exclusion immediately.

**Governing principle for every default in this spec: defaults lean against the page's thesis.** Where a choice is uncertain, pick the value that makes bitcoin's case *harder*, say so in the tooltip, and let the reader move it. A comparison that wins on unfavourable defaults persuades; one that wins on favourable defaults invites dismissal.

## 2 · Scope

**In:**
- A. BvRP sourcing and factual fixes (blocking).
- B. Register pass on both pages, including meta/OG/Twitter/JSON-LD descriptions.
- C. One shared engine module for house, mortgage, rent, bitcoin-path and tax math.
- D. Harmonised assumptions: bitcoin scenario set, sitewide `ModelingAssumptions` pickers, home appreciation, rent and rent growth, carrying costs, exit costs.
- E. Tax regime input and pre-/post-tax results on both pages.
- F. Results pattern on both pages: wealth-over-time chart with a difference line and a first-3-years view; year-by-year ledger with CSV export.
- G. Sensitivity grid on both pages.
- H. Pair framing, URL carry between the pages, parity QA, bookkeeping.

**Out (fences):**
- No Monte Carlo (site-wide *no*, `RETIREMENT_CALCULATOR_DESIGN_22 §3.6`).
- No change to the canonical Power Law coefficients or `shared/power-law-data.js`.
- No house allocation number, no recommendation, no "which should you do" verdict.
- No change to BvRP's four-paths structure or the STRC/SATA instrument content beyond sourcing and register fixes (the instruments' own pages own them).
- No Zelman-branded variant in this build. It becomes cheap once C–F exist; it is a separate decision.
- No new nav entries.

## 3 · Rulings (JM) — recommended defaults

Claude Code applies the **recommended** value unless JM overrides before the relevant PR. Phase 0 supplies the numbers several of these need.

| # | Decision | Recommended | Why |
|---|---|---|---|
| R1 | Bitcoin scenario set, both pages | **Floor · Stay at today's multiple · Trend · Upper.** Default **Trend**; Floor always drawn on the chart; Upper selectable, never default. Reversion paths use BvRP's existing linear interpolation from today's multiple, named as a simplification. | One vocabulary; BvRP currently has no downside case below "stay"; floor-vs-upper asymmetry canon. |
| R2 | Home appreciation default | Phase 0 computes real appreciation from data already on site (Shiller long run; 1990–2025). **Presets:** long-run record · recent decades · "generous" (3.5% real, today's default). **Default: the recent-decades figure** (higher than long run, i.e. leaning against the thesis). One input, wired to the sitewide real-estate appreciation picker. | Today's 3.5% default is labelled "generous" on the page; a sourced preset is more defensible, and the default stays generous to housing. |
| R3 | Default rent | Replace "75% of the mortgage payment" with a **sourced price-to-rent anchor** (Phase 0 proposes the source, e.g. Census/ACS median gross rent vs. MSPUS, or a named rent index; verify at build). Phase 0 reports the default monthly own-vs-rent gap before and after; it should land in the range public market data supports. User override kept. | The current ratio may imply a gap wider than market data (chat-side estimate ≈ $1,100/mo vs. Zelman's public ~$800–900), which tilts toward renting. |
| R4 | Rent growth | **Default: rent grows at the house's nominal appreciation rate** (constant price-to-rent), stated in a tooltip; exposed as an input. | One stated rule both pages share; avoids an unstated divergence between the rent path and the house path. |
| R5 | Inflation | Keep the sitewide `ModelingAssumptions` inflation default (consistency), **and** add one line in each calculator's assumptions: higher inflation favours the fixed-rate mortgage holder, because the debt is repaid in cheaper dollars. | The interaction is material and currently unstated; stating it is the both-sides move. |
| R6 | Selling costs at exit | **One shared default of 6%** of sale price (commissions + closing), input 0–10%, applied to the house on both pages. BvRP keeps its forced/distressed-sale prose as context, not as the default. | BvRE applies none today; BvRP ~7–8%. Post-2024 commission changes make 6% defensible; Phase 0 confirms BvRP's current value before unifying. |
| R7 | Tax regime default | **United States**, married filing jointly, 24% federal bracket, "typical / average" state (~5%, BvRP's existing default), bitcoin held in a **taxable** account. | Mirrors BvRP's existing defaults; MFJ is the common homeowning household. |
| R8 | Headline results figure | **After-tax** terminal values lead; pre-tax shown alongside with the tax line between them. | JM: the difference is the lesson; after-tax is the number a decision rests on. |
| R9 | Sensitivity default axes | **Bitcoin scenario × home appreciation**; alternative **horizon × mortgage rate** (BvRE) / **horizon × net rental yield** (BvRP). | Answers "how much of the result rests on one assumption?" |
| R10 | Hero/subtitle rewrites | As drafted in §5 (JM edits freely). | Register. |

## 4 · A — BvRP sourcing and factual fixes (blocking)

The live page (read 2026-09-26) must not be forwarded to a research audience until these are done.

1. **Remove the draft language** in *Methodology & Sources* ("As this draft moves toward publication…").
2. **"NotebookLM synthesis" is not a source.** Every figure whose source line says so, or says "modeled estimate" or "verification pending", is either (a) re-sourced to a primary and cited, (b) restated as the site's own worked estimate with its method shown on-page, or (c) removed. Known items: the gross-to-net waterfall bands and the 50% Rule; the 31 hrs/month and $4,800/yr time cost; the 19–33% exit attrition; the 11.7% leveraged-ROI critique and the 7–9% after-friction figure; the ~$1.7B annual preferred obligation; the Saylor "$8,000 for five years" line; trading volumes.
3. **Regulatory exhibits** — each gets a primary source or is cut: Portland ME ($500/unit, 40%), Tacoma I-1 (33% → 54% delinquency, 32% removed), NYC Local Law 18 listing decline (70–92%), California AB 1154. St. Paul (NBER) and Seattle (City Auditor) already link.
4. **"Native bitcoin staking and liquid staking tokens"** (*What's Familiar*): bitcoin has no native staking. Remove the bullet or restate accurately (e.g. yield from lending bitcoin, with its counterparty risk).
5. **"Under conservative Power Law assumptions, bitcoin's long-term CAGR has held in the 25–30% range"**: the floor is the conservative case and does not produce 25–30%. Restate with the scenario and window named, computed live from the shared Power Law module, and note that the trend growth rate declines over time (`/the-bitcoin-hurdle-rate`).
6. **$500K side-by-side table**: the spot-BTC slice compounds at 25% for ten years. Tie it to a named scenario computed from the module, or show it under floor and trend.
7. **Register-adjacent factual claims**: "Hassle: effectively zero" and risk described as "structurally inert" understate issuer-credit risk the page's own *Bear Case* treats seriously. Restate as "no operational load; issuer-credit and market risk instead" (or similar).
8. **Figures that carry an as-of date** (Strategy BTC holdings, STRC/SATA rates, SATA's daily-distribution date, Strive's BTC) are re-verified against current filings, with the date shown; add or refresh `DATA_AUDIT` BvRP-* rows.

**Research note:** Claude Code verifies against primaries where it can fetch them. Anything it cannot verify, it lists in its report rather than guessing; JM can hand those to chat-side research.

## 5 · B — Register pass (both pages)

Rules: `STYLE_GUIDE §5` (show, don't claim; no verdicts about the page or the outcome), `§10.2.1` (dashes), de-tell discipline (no "honest/honestly", "load-bearing"), Bitcoin/bitcoin capitalisation per the style guide. **Keep every argument; remove the certainty.** The FAQ on BvRE ("not a verdict… both views show their work") is the target register for the whole pair.

**BvRE lines to rewrite (non-exhaustive — sweep the page):** "Bitcoin fixes it" (hero); reversion to 2–3× income "a matter of when, not if"; "the math is inescapable"; "There are only three possible outcomes" (one being a crash); "thirty years of debt servitude"; "finances a bank's profit margin for three decades"; "No amount of fiat appreciation… can disguise"; "Bitcoin is the first instrument in modern history that offers a non-painful path"; "The trend line tells you where this is heading"; the floor tooltip's "every meaningful dip recovered above it" since 2010 (reconcile with `/the-bitcoin-floor`: four breach episodes, deepest ~42.6% below).

**BvRP lines to rewrite:** H1 subtitle and OG/Twitter descriptions "2× the after-tax yield, no tenants, no maintenance"; "the math is not close" (twice); "What you're really buying is your weekends back" (keep the idea, lose the slogan if JM prefers); "structurally inert"; "effectively zero".

**Proposed heroes (R10):**
- BvRE: *"A house didn't used to be an investment. Under sound money it was shelter, bought with savings at two to three years' income. Fiat money turned it into the default savings account — and bitcoin is the first asset that competes for that role."*
- BvRP subtitle: *"The landlord's comparison, once operating costs, tax and exit frictions are on the table — and the risks of the alternative with them."*

**Metadata:** BvRE meta/OG/Twitter "leverage, costs, and taxes included" becomes true after E; until E ships, drop "and taxes". BvRP OG/Twitter descriptions follow the new subtitle. **Preview-first** (social metadata; failures surface only in crawlers). X/LinkedIn card re-scrape owed after merge. OG *images* are not regenerated unless the baked-in text contains a changed claim (Phase 0 checks both cards).

## 6 · C — Shared engine

One module under `shared/` (name set in Phase 0, e.g. `shared/real-estate-model.js`), pure functions, no DOM, consumed by both pages. It owns:

- **House path:** price path from real appreciation + sitewide inflation; 30-year fixed amortisation (principal, interest, balance by year); property tax, insurance, maintenance by year; equity; exit value net of selling costs.
- **Rent path:** starting rent (R3), growth (R4), cumulative rent by year.
- **Bitcoin path:** lump sum and/or monthly contributions (the existing "Go deeper" DCA of the rent-vs-own difference), priced by the shared Power Law module under the R1 scenario set; BTC held and value by year.
- **Landlord path (BvRP):** net rental cash flow by year, depreciation (27.5-year straight line on the building basis), and the four paths' existing mechanics — *moved*, not rewritten.
- **Tax (E):** pure functions per regime; returns pre-tax value, tax by component, after-tax value for each path.
- **Ledger:** one function returning the year-by-year rows both pages render (F).

**Refactor discipline:** extraction first, with **byte-identical outputs** asserted on both pages at a fixed set of input vectors (record them in the PR). Behaviour changes (D, E) come in later PRs with before/after tables. No second implementation of any of this math anywhere on the site.

## 7 · D — Harmonised assumptions

Apply R1–R6 on both pages. One shared "Baseline assumptions" block (BvRP's two-tier pattern: set once, then ignore), carrying: inflation (sitewide), home appreciation (sitewide real-estate picker + R2 presets), mortgage rate, down payment, property tax, insurance, maintenance, selling costs, rent anchor and growth, and the tax profile (E). Real/nominal display toggle on both (BvRE has one; BvRP gains it). Every changed default gets a `DATA_AUDIT` row and a before/after figure in the PR description.

## 8 · E — Tax regime, pre- and post-tax results

**Regime selector** (both pages): *United States* (default) · *No capital-gains tax* · *Custom*.

**United States:**
- *Primary residence (BvRE):* gain = exit price − selling costs − purchase price. **Section 121 exclusion** of $250,000 (single) / $500,000 (married filing jointly), tooltip stating the ownership-and-use test (2 of the 5 years before sale). Gain above the exclusion taxed at the long-term capital-gains rate + state + NIIT where applicable.
- *Rental (BvRP):* the page's existing treatment (depreciation recapture at up to 25%, LTCG, state, NIIT; 1031 not available into bitcoin), now computed in the shared module.
- *Bitcoin:* gain = exit value − cost basis (sum of contributions), at LTCG + state + NIIT where applicable. **Holding location** toggle: taxable (default) / tax-advantaged (no tax at exit), with a one-line note that annual contribution limits mean a tax-advantaged account rarely holds a down-payment-sized sum.
- *Inputs:* filing status (new), federal bracket and state (BvRP's existing components, now shared). LTCG rate and NIIT applicability derived from the bracket as an approximation, stated in the tooltip.
- *Mortgage-interest deduction:* off by default, with a tooltip (most households take the standard deduction); available for itemisers.
- **Verify at build (blocking, log in `DATA_AUDIT`):** Section 121 amounts and test; current-year LTCG thresholds and their mapping to ordinary brackets; NIIT rate (3.8%) and thresholds; recapture cap; any 2025–26 legislative changes to any of these. Cite IRS primaries.

**No capital-gains tax:** both paths untaxed at exit (property tax still applies to the house as a carrying cost).

**Custom:** reader sets home-gain rate, home exemption amount (default 0), bitcoin-gain rate.

**Results:** for each path, *pre-tax terminal value → tax → after-tax terminal value*, after-tax leading (R8). Retrospective ("Postponed purchase") mode on BvRE uses the same functions. The "not tax advice" posture is unchanged and repeated beside the selector.

## 9 · F — Results pattern

**Chart (both pages):** wealth over time for each path on the shared chart pattern (BvRP's existing chart is the starting point; BvRE gains one). House: equity after selling costs (and after tax at exit when the after-tax view is on). Bitcoin path: value, with rent paid shown as the cost it is. **The difference line** is the visual hero, so the reader sees when the paths cross. Floor scenario always drawn faintly (R1). **Full window / first 3 years** toggle on both — the early years are where the bitcoin path is most likely to be behind, and showing them is the both-sides move. The existing stat block stays, beneath the chart.

**Show the calculation (both pages):** a disclosure under the results opening a year-by-year ledger, one row per year, **two tabs**:
- *The house* (BvRE) / *The rental* (BvRP): value, mortgage balance, principal, interest, property tax, insurance, maintenance (BvRP: net cash flow, depreciation), equity, cumulative cash out.
- *Bitcoin + rent* (BvRE) / *Bitcoin path* (BvRP): scenario price, BTC held, value, rent paid (BvRE), contributions or distributions (BvRP), cumulative cash out.
- Final row: pre-tax, tax, after-tax for each path.
- **CSV download** of both tabs (retirement-family precedent). An analyst checking the arithmetic in a spreadsheet is the strongest credibility signal the pair can earn.
- Ledger reads from the same engine output as the chart and stat block — one source of truth, verified by the parity check (H).

## 10 · G — Sensitivity grid

The retirement flagship's scenario-grid pattern: a 3×3 grid, reader's configuration in the centre cell, one-click axis-pair toggle (R9). Each cell shows the after-tax difference (bitcoin path minus house path) with a sign-neutral colour scale. Caption states what the grid is and is not: a map of how the answer moves with two assumptions, not a probability distribution. Mobile: the grid collapses to a compact table.

## 11 · H — Pair framing, carry, parity, bookkeeping

- **Framing:** one line in each hero and each page's Related card naming the pair (tenant's side / landlord's side).
- **Carry:** namespaced URL params for the shared inputs (home price, rate, horizon, appreciation, tax profile, scenario), following `SITE_GUIDE §46`; a "Run this on the other side" link on each page that carries them. Namespaced from the first commit.
- **Parity QA:** a tripwire in the house of `evParityQA` / `crpParityQA` asserting (1) both pages produce identical house-side and tax figures for identical shared inputs, and (2) ledger totals equal the stat block and chart end-points on each page.
- **Bookkeeping:** `SITE_GUIDE` sections for both pages updated (new §, or amend existing), `DATA_AUDIT` BvRE-*/BvRP-* rows for every changed or new figure, `MONTHLY_REFRESH_CHECKLIST` lines for any new dated figure, `updates.json` entries, `STYLE_GUIDE` note if the ledger/CSV becomes a house component, backlog entry closed with SHAs.

## 12 · Acceptance

- BvRP carries no "NotebookLM", "verification pending" or draft language; every figure has a source or a shown method.
- Neither page states an outcome as certain; the FAQ register holds page-wide.
- Identical shared inputs → identical house-side and tax figures on both pages (parity QA passes).
- Refactor PR: byte-identical outputs at the recorded input vectors.
- Every changed default: before/after figure in its PR, `DATA_AUDIT` row, tooltip stating its basis.
- Tax figures verified against IRS primaries and logged.
- Ledger totals = chart end-points = stat block, on both pages, all scenarios.
- CSV opens cleanly in a spreadsheet; columns labelled with units.
- Mobile 375px: chart, grid, ledger usable; no horizontal page scroll.
- No console errors; social cards serve `image/jpeg` after deploy; re-scrape done.

## 13 · Sequence and timing

| PR | Content | Changes figures? | Before Tuesday 2026-09-29? |
|---|---|---|---|
| 0 | Phase 0 read-only report | No | Yes |
| 1 | BvRP sourcing + factual fixes (A) | Some (restated claims) | **Yes — priority** |
| 2 | Register pass both pages + metadata (B) | No | **Yes** |
| 3 | Shared engine extraction (C), byte-identical | No | Stretch |
| 4 | Harmonised assumptions (D) | Yes | No |
| 5 | Tax regime + pre/post-tax (E) | Yes | No |
| 6 | Chart + ledger + CSV (F) | No (presentation) | No |
| 7 | Sensitivity grid (G) | No | No |
| 8 | Pair framing, carry, parity QA, bookkeeping (H) | No | No |

PRs 1 and 2 are copy/sourcing only and make both pages safe to share on Tuesday. PRs 3–8 are the build.
