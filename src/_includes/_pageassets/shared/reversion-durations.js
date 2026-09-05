/* =============================================================
   shared/reversion-durations.js — how long stretches like today's have lasted

   EXTRACTED FROM `discount-or-premium.js` (2026-09-01, Rundown v2 Phase 2b,
   JM ruling 3: the source page adopts the extracted component back so there is
   one copy in the codebase). Discount, or Premium? now calls this module;
   The Rundown's R2 snack calls the same function, so the echo and its
   canonical home cannot drift.

   Requires shared/power-law-data.js first (PL_DATA, plPrice, TODAY_DAYS).
   Pure — no DOM, no page state. Exposes window.ReversionDurations.

   ── WHAT IT MEASURES ──
   Given today's multiple of trend, it reports what stretches AT (discount) or
   BEYOND (premium) that depth actually took to get back to trend. Two-sided by
   construction: the only thing that changes between the discount and premium
   cases is the direction of the comparison, which is why there is no branching
   arithmetic in here.

   ── THE THREE BEHAVIOURS A CONSUMER MUST HANDLE ──

   1. THE DEAD BAND. Inside 0.95x-1.05x the module returns {state:'hidden'} and
      says nothing. Price near trend has no "stretch like this" to measure, and
      a number computed there would be noise dressed as a finding. A consumer
      MUST render an empty state rather than assume a record comes back.

   2. AUTO-WIDENING. If today's exact depth has fewer than five COMPLETED
      samples behind it, the band widens toward 1.0 in 0.05 steps until it does
      (never into the dead band, and never more than twelve steps). `widened`
      says whether that happened and `band` says where it stopped — both must
      be disclosed by a consumer that prints the resulting figures.

   3. SAMPLES ARE NOT EPISODES. `nSamples` / `nCompleted` count individual
      ~12-day observations; `episodes` groups them with the site's 100-day
      independent-visit rule. A handful of samples can be one episode. Any
      consumer bound by the N<3 rule must count `episodes`, not samples —
      The Rundown's R2 snack narrates episodes for exactly this reason.
   ============================================================= */
(function () {
  'use strict';
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  // Near-trend dead band: no "discount"/"premium" language inside it.
  var NEAR_LO = 0.95, NEAR_HI = 1.05;
  var YEARS_MO = 30.44;
  var EPISODE_D = 100;   // the site's independent-visit rule

  function sampleMult(i) { return PL_DATA[i][1] / plPrice(PL_DATA[i][0]); }

  function scan(m) {
    if (m >= NEAR_LO && m <= NEAR_HI) return { state: 'hidden' }; // dead band
    var discount = m < NEAR_LO;
    function regainAfter(i) {
      for (var j = i + 1; j < PL_DATA.length; j++) {
        if (discount ? sampleMult(j) >= 1.0 : sampleMult(j) <= 1.0) return j;
      }
      return -1;
    }
    // Band = today's multiple; widen in 0.05 steps toward 1.0 only if too few completed.
    var band = m, qi, comp, ong, guard = 0, i, r;
    while (true) {
      qi = []; comp = []; ong = [];
      for (i = 0; i < PL_DATA.length; i++) {
        if (discount ? sampleMult(i) <= band : sampleMult(i) >= band) {
          qi.push(i);
          r = regainAfter(i);
          if (r >= 0) comp.push({ i: i, months: (PL_DATA[r][0] - PL_DATA[i][0]) / YEARS_MO });
          else ong.push(i);
        }
      }
      if (comp.length >= 5 || guard >= 12) break;
      band = discount ? band + 0.05 : band - 0.05; guard++;
      if (discount ? band >= NEAR_LO : band <= NEAR_HI) break; // never widen into the dead band
    }
    // Episodes: a gap > ~100 days between qualifying samples starts a new one.
    var eps = [], cur = null, k;
    for (k = 0; k < qi.length; k++) {
      var idx = qi[k], d = PL_DATA[idx][0];
      if (!cur || d - PL_DATA[cur.last][0] > EPISODE_D) { cur = { first: idx, last: idx }; eps.push(cur); }
      else cur.last = idx;
    }
    var episodes = eps.map(function (e) {
      var rr = regainAfter(e.first), entryD = PL_DATA[e.first][0], regainD = rr >= 0 ? PL_DATA[rr][0] : null;
      return { entryD: entryD, regainD: regainD, ongoing: rr < 0,
        months: (regainD != null ? regainD - entryD : TODAY_DAYS - entryD) / YEARS_MO };
    });
    var durs = comp.map(function (c) { return c.months; }).sort(function (a, b) { return a - b; });
    var med = durs.length ? (durs.length % 2 ? durs[(durs.length - 1) / 2] : (durs[durs.length / 2 - 1] + durs[durs.length / 2]) / 2) : 0;
    var longestEp = episodes.reduce(function (a, b) { return (!b.ongoing && (!a || b.months > a.months)) ? b : a; }, null);
    return {
      state: discount ? 'discount' : 'premium', band: band, widened: Math.abs(band - m) > 1e-9,
      nSamples: qi.length, nCompleted: comp.length, hasOngoing: ong.length > 0,
      ongMonths: ong.length ? (TODAY_DAYS - PL_DATA[ong[0]][0]) / YEARS_MO : 0,
      min: durs.length ? durs[0] : 0, median: med, max: durs.length ? durs[durs.length - 1] : 0,
      episodes: episodes, longestEp: longestEp
    };
  }

  /* THE DISPLAY PRECISION (JM ruling, 2026-09-05) — whole months, everywhere.

     This is a property of the DATA, not a per-page style choice, which is why
     it lives with the scan rather than in three stylesheets' worth of call
     sites. The underlying series is a ~12-day grid, so a duration is only ever
     known to within about half a month: printing "4.3 months" claims a
     resolution the record does not have, and printing it on one page while
     another prints "4 months" reads as two pages disagreeing when they are
     reporting the identical value.

     COMPUTATION STAYS EXACT. Only the printed string rounds — medians,
     comparisons and rate arithmetic all continue to use the unrounded months.

     The sub-month guard is Discount-or-Premium's, carried over: rounding a
     0.4-month stretch to "0 months" is worse than the decimal it replaces. */
  function fmtMonths(v) {
    if (!isFinite(v)) return '—';
    if (v < 1) return 'under a month';
    var r = Math.round(v);
    return r + (r === 1 ? ' month' : ' months');
  }
  // The same rule, abbreviated, for chart ticks and card keys where the word
  // does not fit. Same rounding, same guard.
  function fmtMonthsShort(v) {
    if (!isFinite(v)) return '—';
    return v < 1 ? '<1 mo' : Math.round(v) + ' mo';
  }

  window.ReversionDurations = {
    NEAR_LO: NEAR_LO, NEAR_HI: NEAR_HI, YEARS_MO: YEARS_MO, EPISODE_D: EPISODE_D,
    sampleMult: sampleMult,
    scan: scan,
    fmtMonths: fmtMonths,
    fmtMonthsShort: fmtMonthsShort
  };
})();
