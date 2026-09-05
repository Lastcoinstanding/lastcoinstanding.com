/* =============================================================
   shared/return-window.js — the annualisation convention, in one place

   EXTRACTED FROM `the-rundown.js` (2026-09-04, JM ruling) after the same rule
   had to be implemented three times: the Rundown's `windowRead()`, then
   Discount-or-Premium's sub-year branch, then the Dashboard's. The Dashboard
   is the argument for this module existing — it had the right instinct and
   its own inline ruling, and still got the test wrong (it exempted "the
   fastest" rather than "under twelve months"), because the decision lived at
   the call site instead of in one function.

   Requires shared/power-law-data.js first (TODAY_DAYS, plPrice). Pure — no
   DOM, no page state. Exposes window.ReturnWindow.

   ── THE RULE (STYLE_GUIDE §10.3.1) ──
   Annualise ONLY a window of twelve months or more. Below that, report the
   TOTAL move over the window. Lead with the date and the price at it; the
   rate is a sub-line, never the headline.

   Not because the arithmetic is wrong — every one of these annualisations is
   correct — but because a short window compounds into a very large number,
   the largest figure rests on the LEAST evidence (the shortest window), and
   it is the figure that survives being screenshotted away from its caveats.
   At a floor-adjacent position a 4.3-month reversion annualises to 745% a
   year while being a 92% move.

   ── THE RULE BINDS PLOTTED POINTS TOO (JM, 2026-09-04) ──
   A data point is published the same way a sentence is. A chart of annualised
   rates clips its domain at `MIN_MONTHS`; it does not draw down to a control's
   floor just because the control goes there. `MIN_MONTHS` is exported so a
   chart and a readout cannot disagree about where the line sits.

   ── WHAT THIS MODULE DOES NOT DO ──
   It does not decide what a page's window IS — that is the page's own record
   (a slider, a median reversion, a horizon). It decides only how a window,
   once chosen, may be expressed.
   ============================================================= */
(function () {
  'use strict';
  if (typeof plPrice !== 'function' || typeof TODAY_DAYS !== 'number') return;

  var MIN_MONTHS = 12;      // the annualisation floor — §10.3.1
  var MONTH_D = 30.44;      // matches Discount-or-Premium's YEARS_MO
  var YEAR_D = 365.25;

  function mayAnnualise(months) { return months >= MIN_MONTHS; }

  function pct0(v) { var r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r) + '%'; }

  /* read(months, fromPrice) — everything a caller needs about one window.
     `fromPrice` is what the return is measured FROM: today's spot for a
     reversion read, today's trend price for the at-trend baseline. */
  function read(months, fromPrice) {
    var d = TODAY_DAYS + months * MONTH_D;
    var tp = plPrice(d);
    var total = (tp / fromPrice - 1) * 100;
    var ann = mayAnnualise(months) ? (Math.pow(tp / fromPrice, 12 / months) - 1) * 100 : null;
    return {
      months: months,
      day: d,
      trendPrice: tp,
      total: total,
      annualised: ann,           // null below MIN_MONTHS — callers must handle it
      annualised_ok: ann != null,
      // The one-line expression of the figure. Pages differ in wording around
      // it; none of them re-decides WHICH figure is allowed.
      line: ann != null
        ? pct0(ann) + ' a year over ' + (months / 12).toFixed(1) + ' years'
        : pct0(total) + ' over ' + months.toFixed(1) + ' months',
      // The same, phrased for a sentence rather than a card sub-line.
      phrase: ann != null
        ? '~' + pct0(ann) + '/yr'
        : '~' + pct0(total) + ' in total, not an annual rate'
    };
  }

  // Years-based convenience for callers whose control is in years, not months.
  function readYears(years, fromPrice) { return read(years * 12, fromPrice); }

  window.ReturnWindow = {
    MIN_MONTHS: MIN_MONTHS,
    MONTH_D: MONTH_D,
    YEAR_D: YEAR_D,
    mayAnnualise: mayAnnualise,
    read: read,
    readYears: readYears
  };
})();
