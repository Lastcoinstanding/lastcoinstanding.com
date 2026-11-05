/* ============================================================
   Calculator helpers — pure-function math primitives
   ============================================================
   Used by Half-Life, Melting Ice Cube, Power Law forward tab, and
   the future retirement calculator.

   All functions are pure: same inputs → same outputs, no side effects,
   no DOM dependencies. Safe to call from any rendering loop.

   Conventions:
     - Rates are passed as PERCENTAGES (e.g. 6.5 for 6.5%/yr), not decimals
     - "real" means inflation-adjusted; "nominal" means raw
     - All calculations annual unless noted

   Exposes window.CalcHelpers.
============================================================ */
(function(){
  'use strict';

  /**
   * Convert a nominal annual rate to its real (inflation-adjusted) equivalent.
   * Uses the exact Fisher equation, not the simple subtraction approximation.
   *
   *   real = (1 + nominal) / (1 + inflation) - 1
   *
   * For small rates the approximation `nominal - inflation` is close, but
   * for rates above ~10% the difference matters.
   */
  function nominalToReal(nominalPct, inflationPct) {
    var n = nominalPct / 100;
    var i = inflationPct / 100;
    return ((1 + n) / (1 + i) - 1) * 100;
  }

  /**
   * Inverse of nominalToReal: convert a real rate to its nominal equivalent.
   *
   *   nominal = (1 + real) * (1 + inflation) - 1
   */
  function realToNominal(realPct, inflationPct) {
    var r = realPct / 100;
    var i = inflationPct / 100;
    return ((1 + r) * (1 + i) - 1) * 100;
  }

  /**
   * Compound annual growth: present × (1 + rate)^years.
   * Returns the future value at the given annual rate over the given years.
   */
  function compoundAnnualGrowth(present, ratePct, years) {
    return present * Math.pow(1 + ratePct / 100, years);
  }

  /**
   * Compound annual decay applied directly to a present value.
   *
   * Note: this is NOT the same as inflating prices and then deflating purchasing
   * power. If you want "price level rising at r% means purchasing power
   * halves in how many years," use purchasingPowerHalfLife() — that uses the
   * mathematically correct formula based on the inflation rate.
   *
   * Use this helper only when r is genuinely a direct multiplicative decay
   * rate of the value itself (rare).
   */
  function compoundAnnualDecay(present, ratePct, years) {
    return present * Math.pow(1 - ratePct / 100, years);
  }

  /**
   * Half-life of purchasing power, given an inflation rate (rate of price growth).
   *
   *   Prices grow as (1 + r)^t. Purchasing power decays as 1 / (1 + r)^t.
   *   Setting that equal to 0.5 gives t = ln(2) / ln(1 + r).
   *
   * Equivalent to the price-doubling time. At 6.5% inflation, ~11 years.
   * At 8%, ~9 years. Returns Infinity if rate is zero or negative.
   */
  function purchasingPowerHalfLife(inflationPct) {
    if (inflationPct <= 0) return Infinity;
    return Math.log(2) / Math.log(1 + inflationPct / 100);
  }

  /**
   * Real future value: present amount compounded at a real rate over years.
   * Result is in TODAY's purchasing power.
   *
   * Equivalent to nominal future value deflated by inflation, but skips the
   * round-trip — useful when reasoning natively in real terms.
   */
  function realFutureValue(present, realRatePct, years) {
    return compoundAnnualGrowth(present, realRatePct, years);
  }

  /**
   * Deflate a nominal future value to today's purchasing power, given an
   * annual inflation rate over the years between now and then.
   */
  function deflateToToday(nominalFutureValue, inflationPct, years) {
    return nominalFutureValue / Math.pow(1 + inflationPct / 100, years);
  }

  /**
   * Inflate a present amount to a future nominal value at the given inflation
   * rate. The mirror operation of deflateToToday.
   */
  function inflateToFuture(presentValue, inflationPct, years) {
    return presentValue * Math.pow(1 + inflationPct / 100, years);
  }

  /**
   * ──────────────────────────────────────────────────────────────────────
   * Historical Power-Law trend-ratio percentiles
   * ──────────────────────────────────────────────────────────────────────
   * Precomputed sorted distribution of (price ÷ Power-Law-trend-price) ratios
   * across BTC's daily-close history (12-day-spaced sample with monthly appends,
   * 486 points, spanning days 592 → 6514 since Genesis ≈ 2010-08-18 → 2026-11-04). Sampled at
   * every 2nd percentile for compactness. Used by the Bitcoin Retirement
   * status line to surface where current price sits in the historical
   * distribution.
   *
   * Regenerate when PL_DATA (shared/power-law-data.js) gains samples —
   * MONTHLY_REFRESH_CHECKLIST §9.8; scripts/data-freshness.py reads the
   * "spanning days" line above, so keep its last day current:
   *   var ratios = PL_DATA.map(d => d[1] / (1.6e-17 * Math.pow(d[0], 5.77)));
   *   ratios.sort((a,b) => a-b);
   *   for (var p = 0; p <= 100; p += 2) {
   *     emit [p, ratios[Math.min(ratios.length - 1, Math.floor(ratios.length * p / 100))].toFixed(4)];
   *   }
   *
   * Format: [percentile (0-100), ratio_value_at_that_percentile].
   */
  var TREND_RATIO_PERCENTILES = [
    [0,0.2412], [2,0.4182], [4,0.4557], [6,0.4654], [8,0.4791],
    [10,0.4949], [12,0.5034], [14,0.516], [16,0.5295], [18,0.5402],
    [20,0.5498], [22,0.5579], [24,0.5774], [26,0.5953], [28,0.6096],
    [30,0.6212], [32,0.6339], [34,0.6479], [36,0.6797], [38,0.6977],
    [40,0.7174], [42,0.7455], [44,0.7664], [46,0.784], [48,0.8233],
    [50,0.8501], [52,0.8863], [54,0.9299], [56,0.9686], [58,1.0071],
    [60,1.0397], [62,1.0796], [64,1.1372], [66,1.1854], [68,1.2445],
    [70,1.3247], [72,1.3721], [74,1.4694], [76,1.5786], [78,1.6453],
    [80,1.7387], [82,1.8508], [84,2.0781], [86,2.3214], [88,2.5523],
    [90,2.8309], [92,3.0285], [94,3.3536], [96,4.7114], [98,6.4613],
    [100,14.0052]
  ];

  /**
   * Given a current trend ratio (current price ÷ Power-Law-trend-price-today),
   * return the estimated percentage of historical days at or below that ratio.
   * Linearly interpolates within TREND_RATIO_PERCENTILES.
   *
   * Example: percentileBelowRatio(0.59) ≈ 24 (i.e., BTC has been at or below
   * 0.59× trend ~24% of its history — relatively rare territory).
   */
  function percentileBelowRatio(ratio) {
    if (!isFinite(ratio)) return null;
    var table = TREND_RATIO_PERCENTILES;
    if (ratio <= table[0][1]) return 0;
    if (ratio >= table[table.length - 1][1]) return 100;
    for (var i = 0; i < table.length - 1; i++) {
      var p1 = table[i][0], r1 = table[i][1];
      var p2 = table[i + 1][0], r2 = table[i + 1][1];
      if (r1 <= ratio && ratio <= r2) {
        var frac = (r2 === r1) ? 0 : (ratio - r1) / (r2 - r1);
        return p1 + frac * (p2 - p1);
      }
    }
    return 50; // unreachable, defensive
  }

  // Expose
  window.CalcHelpers = {
    nominalToReal: nominalToReal,
    realToNominal: realToNominal,
    compoundAnnualGrowth: compoundAnnualGrowth,
    compoundAnnualDecay: compoundAnnualDecay,
    purchasingPowerHalfLife: purchasingPowerHalfLife,
    realFutureValue: realFutureValue,
    deflateToToday: deflateToToday,
    inflateToFuture: inflateToFuture,
    percentileBelowRatio: percentileBelowRatio
  };
})();
