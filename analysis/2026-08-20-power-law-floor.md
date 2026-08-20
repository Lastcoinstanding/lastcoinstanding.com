# The Power Law floor — how well does it hold, and what did entering there buy?

_Analysis note, 2026-08-20. Source: `src/_includes/_pageassets/shared/power-law-data.js`
(`PL_DATA`, 481 samples, 2010-08-18 → 2026-07-31; `PL_A = 1.6e-17`, `PL_B = 5.77`,
`PL_FLOOR = 0.42`, `PL_CEIL = 3.0`). Analysis only — no page reads these figures, and
nothing here shipped to a page. Working scripts are session-local and not committed;
every number below is reproducible from the module plus the method described._

---

## Read this first — what this note cannot support

Five limits, stated up front because several of the numbers below look more decisive
than they are:

1. **The sample of floor events is tiny.** Four floor touches and eight cycle lows in
   sixteen years. A "median of four" is an ordering of four numbers, not a distribution.
   Nothing here supports a probability statement.
2. **The series is autocorrelated.** Every fit below is descriptive. No standard errors,
   no p-values, no significance claims — an R² on 481 samples of a rising, serially
   correlated series is a shape summary, not evidence.
3. **It is partly in-sample.** The canonical coefficients were fitted on substantially
   this same history. "The floor held 98% of the time" is therefore partly circular: the
   line was drawn where it would hold.
4. **`PL_DATA` is a ~12-day grid, not daily.** 476 of 480 intervals are exactly 12 days.
   Intraday and daily excursions below the floor between samples are invisible, so every
   violation depth and duration below is a **lower bound**.
5. **The forward-return result is highly sensitive to the terminal date** — see §3, where
   this is the whole story rather than a footnote.

---

## 1 · Is the floor's exponent the trend's?

**Analytically, yes — by construction, not by fit.** The module defines the floor as a
constant multiple of trend:

```
trend(d) = PL_A * d^PL_B
floor(d) = PL_FLOOR * PL_A * d^PL_B
```

In log-log that is the same line shifted down by `log(0.42) = -0.8675`. The exponent is
identical because the floor is never independently estimated. Any claim that "the floor
is parallel to the trend" is therefore a restatement of the formulation, not a finding.
The empirical question is whether the *data's* lower envelope is parallel to it.

**Empirically — 5th-percentile quantile regression on log(price) ~ log(days),** fitted by
minimising pinball loss (for a fixed slope the optimal intercept is the τ-quantile of the
residuals; slope found by grid search with two refinements):

| τ | fitted slope | implied ×-trend multiple with slope forced to 5.77 |
|---|---|---|
| 0.02 | 5.9552 | **0.4209** |
| 0.05 | **5.8834** | 0.4604 |
| 0.10 | 5.8597 | 0.4971 |
| 0.25 | 5.8806 | 0.5928 |
| 0.50 | 5.7949 | 0.8627 |

OLS on all points for reference: slope 5.6372, R² 0.9603.

Two things fall out.

**The empirical quantiles are close to parallel with each other** — every slope from τ=0.02
to τ=0.50 sits in a 5.79–5.96 band. That is real support for the *form* of the model: a
constant-multiple channel, rather than one that fans open or shut with time.

**But they are all slightly steeper than 5.77**, by roughly +0.09 to +0.19. The
5th-percentile slope is 5.8834, or +0.1134 on the canonical exponent. Over the 16 years of
record that difference is small; extrapolated forward it is not, because the gap compounds
in log space.

**The canonical 0.42 floor is closer to a 2nd-percentile line than a 5th.** Forcing the
canonical slope, τ=0.02 implies a multiple of 0.4209 — almost exactly `PL_FLOOR`. A true
5th-percentile floor on this record would sit at about **0.46× trend**, roughly 10% higher
than the line the site draws. The floor is stricter than "5% of observations below", which
is the conservative direction to err.

---

## 2 · How often has the floor broken?

**10 of 481 samples (2.1%) closed below 0.42× trend, in 4 distinct episodes.**

| # | From | To | Samples | Span (d) | Bracketed (d) | Deepest ×-trend | Deepest below floor |
|---|---|---|---|---|---|---|---|
| 1 | 2010-08-30 | 2010-10-17 | 5 | 48 | 72 | 0.241 | **42.6%** |
| 2 | 2015-08-28 | 2015-08-28 | 1 | 0 | 24 | 0.412 | 1.8% |
| 3 | 2015-09-21 | 2015-10-15 | 3 | 24 | 48 | 0.398 | 5.1% |
| 4 | 2023-01-06 | 2023-01-06 | 1 | 0 | 24 | 0.418 | 0.4% |

- **Deepest violation:** 2010-10-05, ×-trend **0.241**, **42.6% below the floor**.
- **Longest episode:** 48 days by sample span; 72 days bracketed by the last above-floor
  print before and the first after. (Durations are elapsed days, not sample counts — the
  module explicitly warns against counting samples on this grid.)
- **Total time below the floor:** 72 days of 5,826 (**1.2%** of the record).
- **Latest sample** (2026-07-31): ×-trend **0.423** — above the floor by less than 1%.

The distribution matters more than the count. **One episode is unlike the other three.**
2010 broke the floor by 42.6% and stayed under for 48+ days. 2015 and 2023 grazed it — the
worst of those three was 5.1% under, and two were single prints. Reported as one number,
"the floor has broken four times" flattens a 42.6% break in bitcoin's illiquid infancy into
the same category as a 0.4% touch in 2023. Any page copy built on this must keep them
apart.

### Cycle lows versus the floor

Cycle low := a sample that is the minimum price within ±15 samples (~180 days), so only
major bottoms qualify; adjacent duplicates collapsed. Eight qualify:

| Date | ×-trend | ×-floor | log(price/floor) |
|---|---|---|---|
| 2010-09-11 | 0.301 | 0.716 | −0.3341 |
| 2011-11-17 | 0.607 | 1.446 | +0.3687 |
| 2015-04-18 | 0.563 | 1.341 | +0.2934 |
| 2019-02-08 | 0.558 | 1.328 | +0.2833 |
| 2020-03-22 | 0.555 | 1.321 | +0.2786 |
| 2022-11-19 | 0.438 | 1.042 | +0.0415 |
| 2024-09-09 | 0.710 | 1.691 | +0.5254 |
| 2026-07-13 | 0.423 | 1.007 | +0.0066 |

- **Median log-deviation from the floor: +0.2810** — cycle lows have typically bottomed
  about **1.32× the floor**, not at it.
- **MAD (log space, about the median): 0.1636** → a multiplicative spread of about
  **±1.18×**.
- MAD about the floor itself: 0.2884 (×1.33).

So the floor is not where bottoms happen; it is well below where bottoms usually happen.
The typical cycle low has left roughly a third of headroom above the line. Two of the
eight (2022-11 and 2026-07) landed essentially *on* it, and one (2010-09) went through.

### Lows-only fit — reported, but it earns little

Regressing log(price) on log(days) across those eight lows: **slope 5.8999**
(+0.1299 on canonical), intercept −40.3910, **R² 0.9976**, implied ×-trend multiple 0.5043
at a forced 5.77 slope.

The slope agrees closely with the τ=0.02–0.05 quantile slopes (5.88–5.96), which is a
genuine consistency check — three different methods put the lower envelope near 5.88–5.90
rather than 5.77.

**The R² is close to meaningless and should not be quoted as support.** Eight points drawn
from a monotonically rising series in log-log will fit almost any upward-sloping line at
R² > 0.99. It is reported because it was asked for, and flagged because publishing 0.9976
without this sentence would be the kind of number that travels further than it deserves.

---

## 3 · What did entering near the floor actually buy?

**Entry set:** price within 10% above the floor (×-floor ≤ 1.10, i.e. ×-trend ≤ 0.462),
which also picks up genuine sub-floor prints. **26 of 481 samples (5.4%)**, clustered in
2010, 2012, 2015–16, 2022–23 and 2026.

**Floor touches** (episode starts, the events an entry can be measured *to*): 4 —
2010-08-30, 2015-08-28, 2015-09-21, 2023-01-06.

### The headline, and it is deflating

| Measure (median across the 26 entries) | Value |
|---|---|
| Realized CAGR to today | **63.8%** |
| Trend CAGR over the same window | **65.1%** |
| **Excess (realized − trend)** | **−0.3%** |
| Excess to the next floor touch (n=19) | −2.4% |

**Buying within 10% of the model's worst case did not beat the model.** Median excess over
the trend's own CAGR across the same window is −0.3% — indistinguishable from zero, and
slightly negative.

This is not a claim that floor entries were bad. Those entries returned a median **63.8%
CAGR**, which is an enormous absolute return. The finding is narrower and more useful: the
*extra* return from timing the entry at the floor, relative to simply holding the trend's
own growth over the identical window, was approximately nothing.

### Why — and the caveat that dominates this section

The excess is, almost by construction, the annualised change in the ×-trend ratio between
entry and exit. **Today sits at ×0.423 — back at the floor.** An entry at the floor
measured to an exit at the floor has zero excess mechanically, whatever happened in between.

The per-entry detail shows this plainly. The 2010 entries, measured across 15.8–15.9 years
that end at today's depressed ratio, still show **+5.1% to +8.4%** excess, because they
entered *below* the floor (down to ×0.574 and ×0.641 of it). Entries that went in *at*
around 1.05–1.10× the floor show −1% to −2%. The signal is entirely "how far below the line
did you buy", not "did you buy at the line".

**Measured to a mid-cycle terminal date this table would look completely different.** The
−0.3% is a statement about the pair (entry near floor, exit 2026-07-31 near floor), not a
durable property of floor entries. Anyone quoting it must quote the terminal condition with
it. This is the single most misleadable number in the note.

### Reversion toward trend after a floor touch

| Horizon | n | Median ×-trend at touch | Median ×-trend after | Median change | Median gap to trend closed |
|---|---|---|---|---|---|
| 12 months | 4 | 0.405 | 0.588 | +0.179 | **30.6%** |
| 24 months | 4 | 0.405 | 1.278 | +0.869 | **146.7%** |

Per touch:

| Touch | +12mo | gap closed | +24mo | gap closed |
|---|---|---|---|---|
| 2010-08-30 (×0.393) | ×2.912 | 415% | ×0.628 | 39% |
| 2015-08-28 (×0.412) | ×0.460 | 8% | ×1.753 | 228% |
| 2015-09-21 (×0.398) | ×0.465 | 11% | ×1.381 | 163% |
| 2023-01-06 (×0.418) | ×0.710 | 50% | ×1.175 | 130% |

At **12 months the dispersion is total** — 8%, 11%, 50%, 415%. The median of 30.6% is the
midpoint of four numbers that share no shape. It should not be used.

At **24 months the four agree far better**: three of four closed the gap completely and
overshot past trend (130%, 163%, 228%), and the fourth reached 39%. That is the most
defensible statement in the whole note — *and it rests on four observations.*

Note also that the 2010 row inverts between horizons (415% at 12 months, 39% at 24) because
the 2011 spike to ×2.9 had round-tripped by 2012. A single path, sampled at two horizons,
gives opposite impressions. With n=4, one path like that moves the median.

---

## 4 · Two things that need fixing elsewhere

**The module's own comment does not reproduce.** `power-law-data.js` states price has sat
below the floor with a "low ~0.196× in 2010". The minimum ×-trend in `PL_DATA` is **0.241**
(2010-10-05). The 0.196 figure cannot be derived from the series the comment sits on — it
may come from daily data predating the 12-day grid, or it may be stale. Either way a
reader checking the claim against the adjacent array will not find it. Worth a correction
or a source note in the module.

**Today's position is a live editorial fact.** The latest sample sits at ×0.423, less than
1% above the floor, and 2026-07-13 registered as a cycle low at ×1.007 of the floor. Any
page that describes the current position needs to be recomputed, not remembered.
