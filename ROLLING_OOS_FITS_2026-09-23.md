# Rolling out-of-sample fits: measurement, 2026-09-23

The measured version of `PAGE_IDEAS_BACKLOG` → *Rolling out-of-sample fits: when did the power law become reliable?* **Measurement only: no figure on the site changed.** Reproduce it with `node scripts/measure-rolling-oos.js` (yearly table) or `--json` (quarterly, every field).

**Method.** For every quarter-end cutoff from 2011 to 2024, fit the trend exactly as `/the-power-law`'s out-of-sample chart does: log-log least squares over `PL_DATA` from the first sample to the cutoff. Record four things for each fit:

- the exponent **b**
- **today×**: where that fit puts the trend at the last sample (Sep 2026), as a multiple of the canonical line (a = 1.6×10⁻¹⁷, b = 5.77)
- **drift +4y**: the same multiple, four years after the cutoff
- **in 4y**: the share of the next four years' prices that stayed inside the channel drawn from that fit (0.42× to 3.0× its trend, the site's own multiples)

Distance of price from trend on a given date mostly reflects where the cycle was. It is deliberately not treated as the fit's "miss".

---

## Finding 1: before 2016, the fit was not reliable, and the record shows it

| Cutoff | b | Trend today, × canonical | Trend 4 years later, × canonical | Next 4 years inside the fitted channel |
|---|---|---|---|---|
| end-2011 | 8.76 | 577× | 36× | 6% |
| end-2012 | 5.38 | 0.43× | 0.59× | 73% |
| end-2013 | 6.45 | 3.63× | 2.30× | 39% |
| end-2014 | 6.79 | 7.06× | 3.95× | 22% |
| end-2015 | 5.95 | 1.54× | 1.41× | 75% |

Someone fitting the curve in mid-2014 had just lived through the 2013 run. Their line says bitcoin "should" be worth about **9×** today's canonical trend. Within four years, price spent more than two-thirds of its time outside the channel they would have drawn. The end-2014 row reproduces the documented bad fit that the Power Law page's preset already shows (b = 6.787). The early record is not a near miss. It is a model that would have failed anyone who trusted it.

## Finding 2: from 2016 on, every cutoff tells nearly the same story

Across **every quarterly cutoff from 2016-Q1 to 2024-Q4 (36 fits):**

- **b** stayed between 5.48 and 5.86.
- The trend each fit implies for today stayed between **0.68× and 1.24×** canonical.
- Every fit with four years of hindsight available saw **83% to 100%** of the next four years inside its own channel.

From 2018-Q1 the ranges narrow further: b 5.67–5.86, today 0.95×–1.24×, next four years 90–100% inside.

The transition is visible to the quarter. The 2015-Q3 fit still had half the following four years outside its channel. By 2016-Q1 it was 12%.

**This is the data answer to "your yardstick is itself a curve fit to the price series."** It is a curve fit. But a curve fitted in 2016, 2018 or 2020 on the data available then drew nearly the same line the site draws today, and later prices stayed inside it.

## Finding 3: the stability is not just a large sample resisting change

A fair objection: with 400+ points, a new quarter can barely move the fit, so late stability could be inertia rather than evidence. I tested it. With two more years of prices at the 0.42× floor, the full-record fit's exponent drops from 5.63 to **5.47** and its trend two years out falls **19%**. Four years at the floor take it to 5.38 and −30%. The fit can still move; the data since 2016 simply hasn't pushed it. And the in-band shares above are about *future* prices landing where a past fit said they would, which no amount of training data guarantees.

## What this does not show, stated plainly

- **Few independent eras.** "Since 2016" covers about two and a half halving cycles (2016, 2020, 2024). Thirty-six quarterly fits do not add up to 36 independent tests. They are overlapping windows over the same few cycles.
- **The yardstick is itself hindsight.** The canonical line (b = 5.77) was fitted to the whole record. "× canonical" measures agreement with hindsight. The in-band shares are the column that doesn't depend on it.
- **Today's own full-record fit sits below the canonical line.** The same method over every sample gives b = 5.632, a trend **0.91×** canonical today. The site's channel therefore reads about 10% richer than a fresh fit would. Keep this in view whenever position figures are quoted.
- **Price is near the floor.** At the last sample, price was **0.50×** canonical trend; the floor is 0.42×. The lowest reading since 2016 was 0.418×, in Jan 2023.

## Falsifiability: what would count as the fit degrading again

Proposed for the exhibit's copy, to be ruled on:

1. **A sustained break of the floor.** Price below 0.42× canonical trend for more than six consecutive months. That has not happened since 2016; the Jan 2023 low touched the floor and recovered.
2. **A refit that leaves the stable band.** A full-record fit whose implied trend moves outside the 0.68×–1.24× range every 2016+ fit has stayed within.
3. **A cutoff that fails its own channel.** Any 2016+ cutoff with fewer than 80% of its next four years inside its channel. The worst so far is 83% (2017-Q2).

Each is measurable by rerunning the script after the monthly data refresh.

## Recommendation

- **Promote it as a section on `/the-power-law`**, as the backlog entry suggested. It is the swept version of the out-of-sample chart already there, and the chart it needs has two lines on one time axis:
  - the implied-today trend (× canonical) for each cutoff, with the 0.68–1.24 band shaded
  - the next-4-years in-channel share for each cutoff

  The pre-2016 failure has to be as visible as the later stability. The finding depends on showing both.
- **Add the three criteria to MONTHLY_REFRESH_CHECKLIST**, so falsifiability is checked every month rather than just stated.
- **Needs JM's ruling:**
  - whether to build the section now or after the Oct 19 read
  - the falsifiability criteria and their thresholds
  - whether the "canonical reads about 10% richer than today's refit" note belongs on the page or only in DATA_AUDIT. It already sits under the Nov 2 Power Law audit.
