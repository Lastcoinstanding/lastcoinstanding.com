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

  // Expose
  window.CalcHelpers = {
    nominalToReal: nominalToReal,
    realToNominal: realToNominal,
    compoundAnnualGrowth: compoundAnnualGrowth,
    compoundAnnualDecay: compoundAnnualDecay,
    purchasingPowerHalfLife: purchasingPowerHalfLife,
    realFutureValue: realFutureValue,
    deflateToToday: deflateToToday,
    inflateToFuture: inflateToFuture
  };
})();
