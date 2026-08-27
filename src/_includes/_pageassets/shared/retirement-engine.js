/* =============================================================
   shared/retirement-engine.js — the retirement family's projection,
   verdict and threshold solver, in one place.

   PROVENANCE. Every function below is a VERBATIM port from
   bitcoin-escape-velocity.js, which in turn documents itself as a
   verbatim port of the-bitcoin-retirement.js (the flagship) minus the
   pre-retirement DCA branch. Nothing here is new modeling. The port was
   made for /compare-retirement-plans (COMPARE_RETIREMENT_PLANS_DESIGN
   §8.1: "One engine. Both columns run off one engine instance's
   constants … any constant re-declared per column is a defect"), where
   two independently configured plans have to be provably computed the
   same way.

   WHY A MODULE RATHER THAN A FOURTH COPY. The family already carries
   the loop three times (flagship → EV → Stress Test), each guarded by
   its own parity assertion. A fourth copy would be the point at which
   copying stops being cheap: the compare page runs the loop for TWO
   scenarios at once, so a drift between its columns and the pages it
   claims to agree with would be invisible in exactly the place the page
   is supposed to be authoritative.

   NOT YET ADOPTED BY THE OTHER THREE PAGES. This module is currently
   loaded only by /compare-retirement-plans. Repointing the flagship, EV
   and the Stress Test at it is the obvious follow-up and is filed as
   such — it was out of scope for the batch this shipped in (no edits to
   the three existing family pages). Until that lands, the guarantee
   that this module agrees with them is carried by the golden vectors in
   crpParityQA() (compare-retirement-plans.js), captured from the
   deployed Escape Velocity page.

   Depends on (loaded before this file): shared/power-law-data.js
   (PL_A/PL_B/PL_FLOOR/plPrice/TODAY_PRICE) and
   shared/modeling-assumptions.js (window.ModelingAssumptions).
   Pure — no DOM, no page state. Exposes window.RetirementEngine.
   ============================================================= */
(function () {
  'use strict';

  var MA = window.ModelingAssumptions;

  var GENESIS = new Date(Date.UTC(2009, 0, 3));

  function daysSince(date) {
    return (date.getTime() - GENESIS.getTime()) / (1000 * 60 * 60 * 24);
  }
  function plPriceAtDate(date) { return plPrice(daysSince(date)); }
  function dateForYear(year) {
    var today = new Date();
    return new Date(year, today.getMonth(), today.getDate());
  }
  function projPriceForGrowth(date, growthModelKey) {
    var trend = plPriceAtDate(date);
    if (growthModelKey === 'powerlaw-floor') return trend * PL_FLOOR;
    return trend;
  }

  // Live price ÷ today's trend price. Read from the live global every call
  // (TODAY_PRICE is reassigned by fetchTodayPrice when the quote lands), so a
  // page that renders before and after the fetch gets the right ratio both times.
  function currentRatio() {
    var t = projPriceForGrowth(dateForYear((new Date()).getFullYear()), 'powerlaw-trend');
    return (t > 0) ? (TODAY_PRICE / t) : 1;
  }

  /* ═══════════════════════════════════════════════════════════
     THE PROJECTION — ONE LOOP, four optional legs.

     This is the union of what the three family pages were each running.
     They were NOT identical, which the repoint (2026-08-26) surfaced:

       · Escape Velocity  — exactly this loop with every leg off.
       · The flagship     — plus pre-retirement DCA accumulation, plus a
                            `plotAccumulation` flag deciding whether those
                            pre-retirement years carry a plotted value or
                            a null (its current-trajectory line opts in so
                            it starts at today's mark-to-market).
       · The Stress Test  — plus a per-year price multiplier (the crash
                            path), plus the spending-cut lever, plus a
                            `price > 0` guard on the withdrawal division
                            that the other two did not carry.

     Every leg is OFF by default and each is guarded so that with the
     options absent this reduces, expression for expression, to what
     Escape Velocity was running — which is what lets the pages' existing
     parity assertions pass unchanged.

     THE DIVIDE GUARD IS ADOPTED FROM THE STRESS TEST for all callers.
     It was a real divergence between the copies, not a stylistic one:
     flagship and EV computed `nominalIncome / price` unguarded. It is
     unreachable in practice — the Power Law price is positive for every
     modelled date — so adopting the safest of the three variants costs
     nothing and removes the divergence rather than preserving it.

     opts: { multiplier, multFn, plotAccumulation, flexPct }
       multiplier        scalar price multiplier (default 1)
       multFn            per-year multiplier fn; overrides `multiplier`
       plotAccumulation  pre-retirement years carry a value, not null
       flexPct           cut withdrawals by this % in any year the price
                         path is below par (multFn(y) < 1)
  ═══════════════════════════════════════════════════════════ */
  function projectCore(scenario, growthModelKey, inflationPct, opts) {
    opts = opts || {};
    var startYear = (new Date()).getFullYear();
    var endYear = scenario.retirementYear + scenario.yearsInRetirement;
    var infl = inflationPct / 100;
    var scalar = (opts.multiplier === undefined || opts.multiplier === null || !isFinite(opts.multiplier))
      ? 1 : opts.multiplier;
    var multFn = opts.multFn || null;
    var flexPct = opts.flexPct || 0;

    var stackBtc = scenario.btcStack;
    var points = [], btcPoints = [], depletionYear = null;

    for (var y = startYear; y <= endYear; y++) {
      var d = dateForYear(y);
      var price = projPriceForGrowth(d, growthModelKey) * (multFn ? multFn(y) : scalar);

      if (y < scenario.retirementYear) {
        // Pre-retirement DCA. Year-end approximation, the flagship's:
        // BTC added = 12 × monthly contribution ÷ year-end price. Zero-guarded,
        // so a page with no contribution field behaves as if the leg were absent.
        var added = (scenario.monthlyDcaUSD > 0 && price > 0) ? (12 * scenario.monthlyDcaUSD) / price : 0;
        stackBtc += added;
        points.push({ x: y, y: opts.plotAccumulation ? (stackBtc * price) : null });
        btcPoints.push({ x: y, btc: stackBtc, usd: null, phase: 'accum',
          price: price, income: null, btcSold: null, dcaAdded: added });
      } else if (y === scenario.retirementYear) {
        points.push({ x: y, y: stackBtc * price });
        btcPoints.push({ x: y, btc: stackBtc, usd: stackBtc * price, phase: 'retire',
          price: price, income: null, btcSold: null, dcaAdded: 0 });
      } else {
        var yearsFromToday = y - startYear;
        var nominalIncome = (scenario.incomeBasis === 'fixed')
          ? scenario.targetIncomeUSD
          : scenario.targetIncomeUSD * Math.pow(1 + infl, yearsFromToday);
        // Spending cut, bound to the PRICE PATH (multFn(y) < 1), not to the
        // stack's underwater span — the stack recovers slower, because coins
        // sold cheap are gone, so binding to it would overstate the mitigation.
        var cut = false, fullIncome = nominalIncome;
        if (flexPct > 0 && multFn && multFn(y) < 1) { cut = true; nominalIncome = nominalIncome * (1 - flexPct / 100); }
        var btcNeeded = price > 0 ? nominalIncome / price : 0;
        stackBtc = Math.max(0, stackBtc - btcNeeded);
        if (stackBtc <= 0 && depletionYear === null) depletionYear = y;
        points.push({ x: y, y: stackBtc * price });
        btcPoints.push({ x: y, btc: stackBtc, usd: stackBtc * price, phase: 'draw',
          price: price, income: nominalIncome, fullIncome: fullIncome, cut: cut,
          btcSold: btcNeeded, dcaAdded: 0 });
      }
    }
    return { points: points, btcPoints: btcPoints, depletionYear: depletionYear,
             startYear: startYear, endYear: endYear };
  }

  // The flagship's signature, unchanged, so its call sites need no edit.
  function projectStackOverTime(scenario, growthModelKey, inflationPct, priceMultiplier, plotAccumulation) {
    return projectCore(scenario, growthModelKey, inflationPct,
      { multiplier: priceMultiplier, plotAccumulation: plotAccumulation });
  }

  /* ─── Memoised projection. Two columns × (base + threshold probes) is a few
         hundred loops per render; the cache keeps that to a handful of real
         ones. Bounded so a long dragging session cannot grow it without limit.
         The key includes the multiplier, so bear-on and bear-off never collide. ─── */
  var PROJ_CACHE = Object.create(null);
  var PROJ_CACHE_KEYS = [];
  function projectMemo(scenario, growthModelKey, inflationPct, multiplier) {
    // monthlyDcaUSD joined the key when the DCA leg landed: two scenarios
    // differing only in contribution would otherwise collide on a cache hit
    // and the second would silently get the first's projection.
    var key = [scenario.btcStack.toFixed(6), scenario.targetIncomeUSD, scenario.retirementYear,
               scenario.yearsInRetirement, scenario.incomeBasis, growthModelKey,
               inflationPct, (multiplier || 1).toFixed(6),
               (scenario.monthlyDcaUSD || 0)].join('|');
    var hit = PROJ_CACHE[key];
    if (hit) return hit;
    var out = projectStackOverTime(scenario, growthModelKey, inflationPct, multiplier);
    PROJ_CACHE[key] = out;
    PROJ_CACHE_KEYS.push(key);
    if (PROJ_CACHE_KEYS.length > 480) { delete PROJ_CACHE[PROJ_CACHE_KEYS.shift()]; }
    return out;
  }

  // Per-year multiplier path. Kept as a named entry point because a function
  // has no cache key, so this deliberately bypasses projectMemo.
  function projectWithMultFn(scenario, growthModelKey, inflationPct, multFn, flexPct) {
    return projectCore(scenario, growthModelKey, inflationPct, { multFn: multFn, flexPct: flexPct });
  }

  /* ─── One place that maps a price basis onto engine arguments, so two
         scenarios can never diverge in HOW they are computed — only in what
         they are. `multFn` (optional) injects the shared crash path; it forces
         the uncached loop because a function has no cache key. ─── */
  function projectForBasis(scenario, basis, noCache, multFn) {
    var infl = MA.get('inflation').value;
    var growth = (basis === 'current') ? 'powerlaw-trend' : MA.get('btcGrowthModel').preset;
    if (multFn) {
      var ratio = (basis === 'current') ? currentRatio() : 1;
      return projectWithMultFn(scenario, growth, infl, function (y) { return multFn(y) * ratio; });
    }
    var run = noCache ? projectStackOverTime : projectMemo;
    if (basis === 'current') return run(scenario, 'powerlaw-trend', infl, currentRatio());
    return run(scenario, growth, infl, 1);
  }

  /* ═══════════════════════════════════════════════════════════
     THE VERDICT — verbatim from Escape Velocity.

     Escape year = the first modeled year Y such that the REAL residual
     (real annual stack growth minus real annual withdrawal) is
     non-negative for EVERY year from Y through the horizon. Under the
     Power Law the trend growth rate declines with time, so the claim has
     to be checked across the whole span rather than asserted from a
     single crossing.

     Three first-class outcomes: escape / shrink / deplete.
  ═══════════════════════════════════════════════════════════ */

  var EPS = 0.01;   // one cent of real value; residuals inside this are flat

  function computeVerdict(proj, scenario, inflationPct) {
    var startYear = proj.startYear;
    var infl = inflationPct / 100;
    var horizonYear = scenario.retirementYear + scenario.yearsInRetirement;

    var years = [], real = [];
    for (var i = 0; i < proj.points.length; i++) {
      var p = proj.points[i];
      if (p.y === null || p.x < scenario.retirementYear) continue;
      years.push(p.x);
      real.push(p.y / Math.pow(1 + infl, p.x - startYear));
    }

    var residuals = [];
    for (var j = 1; j < real.length; j++) {
      residuals.push({ year: years[j], value: real[j] - real[j - 1] });
    }

    var out = {
      horizonYear: horizonYear,
      depletionYear: proj.depletionYear,
      escapeYear: null,
      residuals: residuals,
      realSeries: real,
      years: years,
      realAtRetirement: real.length ? real[0] : 0,
      valueAtHorizon: real.length ? real[real.length - 1] : 0,
      ratio: (real.length && real[0] > 0) ? (real[real.length - 1] / real[0]) : 0
    };

    if (proj.depletionYear !== null) { out.state = 'deplete'; return out; }
    if (!residuals.length) { out.state = 'escape'; out.escapeYear = horizonYear; return out; }

    var lastNegative = null;
    for (var k = 0; k < residuals.length; k++) {
      if (residuals[k].value < -EPS) lastNegative = residuals[k].year;
    }
    if (lastNegative === null) { out.state = 'escape'; out.escapeYear = residuals[0].year; return out; }
    if (lastNegative >= horizonYear) {
      out.state = 'shrink';
      var turn = residuals[residuals.length - 1].year;
      for (var t = residuals.length - 1; t >= 0; t--) {
        if (residuals[t].value < -EPS) turn = residuals[t].year; else break;
      }
      out.turnYear = turn;
      out.turnedAtStart = (turn === residuals[0].year);
      return out;
    }
    out.state = 'escape';
    out.escapeYear = lastNegative + 1;
    return out;
  }

  // Real value of a projection at an arbitrary year. Used for cross-plan value
  // comparisons, which must be read at ONE year for both plans — otherwise a
  // "Plan B ends higher" claim is silently comparing two different dates.
  function realValueAtYear(proj, year, inflationPct) {
    var infl = inflationPct / 100;
    for (var i = 0; i < proj.points.length; i++) {
      if (proj.points[i].x === year) {
        var v = proj.points[i].y;
        return (v === null) ? null : v / Math.pow(1 + infl, year - proj.startYear);
      }
    }
    return null;
  }

  function cloneWith(over, base) {
    var out = {};
    for (var k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k]; }
    for (var j in over) { if (Object.prototype.hasOwnProperty.call(over, j)) out[j] = over[j]; }
    return out;
  }

  /* ═══════════════════════════════════════════════════════════
     THE SOLVER — verbatim from Escape Velocity's lineFor().

     "Where is the line on this axis" — the stack that would just escape,
     the withdrawal that would just escape, the earliest retirement year
     that escapes. One implementation, so a printed threshold and the
     verdict it belongs to can never disagree.
  ═══════════════════════════════════════════════════════════ */

  var LIMITS = {
    retirementYear:  { min: 2026, max: 2055 },
    btcStack:        { min: 0.01, max: 100 },
    targetIncomeUSD: { min: 20000, max: 500000 }
  };

  var AXES = {
    retire: { key: 'retirementYear',  label: 'Retire in',   log: false, higherIsBetter: true  },
    stack:  { key: 'btcStack',        label: 'Stack',       log: true,  higherIsBetter: true  },
    income: { key: 'targetIncomeUSD', label: 'Withdrawal',  log: false, higherIsBetter: false }
  };

  // `multFor` (optional) threads the shared crash path through every probe, so a
  // threshold solved with the bear market on is the threshold under that world
  // — not the calm-world threshold printed beside a crashed verdict.
  //
  // It is a FACTORY — (scenario) → multFn — not a fixed multFn, because the
  // crash is anchored to the retirement year. On the `retire` axis the probe
  // moves the retirement year, and a fixed multiplier would leave the crash
  // sitting at the original year while the plan walked away from it, solving
  // for a world nobody is being shown.
  function lineFor(axis, scenario, basis, multFor) {
    var infl = MA.get('inflation').value;
    function escapes(over) {
      var s = cloneWith(over, scenario);
      return computeVerdict(projectForBasis(s, basis, true, multFor && multFor(s)), s, infl).state === 'escape';
    }
    if (axis === 'stack') {
      var ls = LIMITS.btcStack;
      if (escapes({ btcStack: ls.min })) return { value: ls.min, bound: 'below' };
      if (!escapes({ btcStack: ls.max })) return { value: null, bound: 'above' };
      var lo = ls.min, hi = ls.max;
      for (var i = 0; i < 26; i++) { var m = (lo + hi) / 2; if (escapes({ btcStack: m })) hi = m; else lo = m; }
      return { value: Math.ceil(hi * 100) / 100, bound: null };   // round UP: the stated value still escapes
    }
    if (axis === 'income') {
      var li = LIMITS.targetIncomeUSD;
      if (escapes({ targetIncomeUSD: li.max })) return { value: li.max, bound: 'above' };
      if (!escapes({ targetIncomeUSD: li.min })) return { value: null, bound: 'below' };
      var lo2 = li.min, hi2 = li.max;
      for (var j = 0; j < 26; j++) { var m2 = (lo2 + hi2) / 2; if (escapes({ targetIncomeUSD: m2 })) lo2 = m2; else hi2 = m2; }
      return { value: Math.floor(lo2 / 100) * 100, bound: null };  // round DOWN: the stated value still escapes
    }
    // Retirement year is NOT monotone: the stack a plan needs falls as the year
    // moves out, then rises again once the horizon reaches the low-real-growth
    // end of the Power Law. Bisection would be wrong. Scan.
    var ly = LIMITS.retirementYear;
    for (var y = ly.min; y <= ly.max; y++) { if (escapes({ retirementYear: y })) return { value: y, bound: null }; }
    return { value: null, bound: 'above' };
  }

  window.RetirementEngine = {
    // constants — read, never re-declared by a consumer
    LIMITS: LIMITS,
    AXES: AXES,
    EPS: EPS,
    // price/date helpers
    daysSince: daysSince,
    plPriceAtDate: plPriceAtDate,
    dateForYear: dateForYear,
    projPriceForGrowth: projPriceForGrowth,
    currentRatio: currentRatio,
    // projection
    projectCore: projectCore,
    projectStackOverTime: projectStackOverTime,
    projectWithMultFn: projectWithMultFn,
    projectForBasis: projectForBasis,
    // verdict + solver
    computeVerdict: computeVerdict,
    realValueAtYear: realValueAtYear,
    lineFor: lineFor,
    cloneWith: cloneWith
  };
})();
