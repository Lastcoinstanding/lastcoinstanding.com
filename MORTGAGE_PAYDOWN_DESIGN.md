# MORTGAGE_PAYDOWN_DESIGN — Bitcoin vs. Paying Down the Mortgage

> **Rulings (JM, 2026-10-01): all nine in §9 as recommended.** JM: "it's easier for me to review the working version/preview when it's ready", so the page was built as one PR, not the five in §8. **SITE_GUIDE §58 is authoritative for what the page does;** this file is the record of intent.
>
> **What changed between this design and the build (2026-10-02):**
> - **Defaults sourced** from FHFA NMDB Q2 2026, released 2026-09-30 (DATA_AUDIT MPD-1): $240,000 (was $300,000), 4.4% (was ~3.75%; the average, not the median, because a higher rate raises the hurdle), 23 years left (was 25). At these defaults the 10-year hurdle is about 5.6% after tax and 4.6% before.
> - **A "bitcoin halves" row** joined "goes nowhere" above the four Power Law scenarios. Even Floor averages about 26% a year over ten years from today's position, so every model path cleared the hurdle; a plain falling what-if shows the other side. The caption says Floor assumes the model's lower line holds, and that price has closed below it before.
> - **The history table has no "best" column.** Up to +8,900% for a one-year stretch read as promotional.
> - **The QA vectors** live in the page as `mpQA()`, not in `rePairQA`.
> - **Bitcoin's drawdowns** in §4 were corrected against `BTC_MONTHLY` before the build: four falls of 73% or more between month-end closes, not "four of 75% or more".

_The design as reviewed on 2026-10-01 follows._

## 1 · The question and the reader

**The reader:** a homeowner with a mortgage and some spare cash each month. **The question:** should the spare cash go to paying the mortgage down early, or into bitcoin?

**Why it matters now:** about half of outstanding US mortgages carry a rate below 4% (49.9%, FHFA National Mortgage Database, Q1 2026; BvRP-24). For those owners, prepaying earns a low but certain return: the mortgage rate. It is the Zelman audience's question.

**Register:** like the pair, it describes, doesn't advise. The page shows what each path does to the household's numbers under stated assumptions, and names the risks on both sides. It never says which to choose.

## 2 · What the page computes

**Two households, identical except for one choice.** Both own the same house, carry the same mortgage, and spend the same cash every month for the whole horizon (the pair's "equal cash out" rule, M2):
- **Pay it down.** The extra cash goes to principal each month. Once the loan is paid off, the whole freed payment goes into bitcoin.
- **Hold bitcoin.** The mortgage runs on schedule. The extra cash goes into bitcoin each month; if the loan ends inside the horizon, the freed payment goes into bitcoin too.

**The house drops out.** Its value is the same in both paths, so the only differences at the end are the mortgage balance and the bitcoin. "If sold" (after tax) leads, as on the pair (R8).

**The engine** reuses the pair's shared model (`mortgagePayment`, the scenarios through `scenarioGrowthFactor`, `btcSaleTax` and the R7 tax profile, `interestSavingRate`, the 0.5% trading cost, the deflator). The new code is one function, a month-by-month run of the two households, beside `bvreProjection` in `shared/real-estate-model.js`.

## 3 · The headline: the hurdle

The single number a homeowner can weigh: the flat yearly bitcoin growth at which the two households end level, after tax, found by search and shown before any scenario.

Worked example as designed (illustrative, 2026-10-01): $300,000 at 3.5%, 25 years left, $500 a month extra, 0.5% trading cost.

| Horizon | Hurdle before tax | Hurdle after a 20% tax | Hold minus Pay down, bitcoin flat | …at 20% a year |
|---|---|---|---|---|
| 5 years | 3.8% | 4.6% | −$2,900 | +$12,000 |
| 10 years | 3.7% | 4.4% | −$12,000 | +$75,000 |
| 15 years | 3.6% | 4.4% | −$28,600 | +$274,000 |

The evidence, in three parts: the scenarios beside the hurdle; the history of the hurdle across `BTC_MONTHLY` stretches since 2011 (at 3.5%: 1 year 71% of 177, 3 years 99% of 153, 5 years 98% of 129, 10 years 100% of 69; worst one-year −73.6%), with its caveats printed (overlapping stretches, one asset's first fifteen years, a short record is not a guarantee); and the grid (scenario × mortgage rate).

## 4 · The risks, named on both sides

**Paying it down:** it doesn't lower the required payment (unless recast); the money is locked in the house (a HELOC at ~7.3%, BvRP-24, or a sale); inflation works for the borrower.

**Holding bitcoin:** it can fall a long way (−74% over the worst year; four falls of 73%+ between month-end closes: −83% 2011, −81% 2013–15, −76% 2017–19, −73% 2021–22); a forced sale at the bottom; behaviour; tax.

**Before either** (general education, not advice): an emergency fund, then high-interest debt and any employer match, then this choice.

## 5 · Inputs and defaults (as designed; see the note at the top for what was sourced)

Loan balance, mortgage rate, years left, extra cash a month ($500, stated), lump sum ($0), horizon (10 years), scenario (Stay), the R7 tax profile, the deduction off (9.2% itemize, CRS IF12789), the 0.5% trading cost.

## 6 · The page

Hero, the series strip, the tool-framing strip, the calculator (inputs, assumptions, the hurdle, scenario chips, the two households, the scenario table, the chart, the grid, the ledger with CSV), the record, the risks, the method, the FAQ. The strip gains *The homeowner · Pay it down?*; the series stays in "Bitcoin vs. Other Assets" until the fourth page.

## 7 · Compliance read

The hurdle and the history table are hypothetical history, not performance; no "should"; the tool-framing strip; the deduction toggle's wording; the "before either" line stays general.

## 8 · PR plan (superseded: one PR, at JM's preference)

## 9 · Rulings (all as recommended, JM 2026-10-01)

1. Title *Bitcoin vs. Paying Down the Mortgage*, slug `/bitcoin-vs-paying-down-the-mortgage`, strip step *The homeowner · Pay it down?*
2. After payoff, the Pay-down household's freed payment goes into bitcoin.
3. A lump-sum input.
4. No split in v1.
5. Default horizon 10 years, 1–30.
6. The history-of-the-hurdle table, with caveats.
7. A "looking back" mode in v1.1.
8. The mortgage-interest deduction off by default.
9. No home-value input.
