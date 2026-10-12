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

   ADOPTED BY ALL FOUR FAMILY PAGES since 2026-08-26 (PR #93): the
   flagship, Escape Velocity, Compare and the Stress Test all run this
   module, and The Rundown's P1 reads its solver. (Until then only Compare
   loaded it; this note said so until 2026-10-11.)

   THE PRICE PATHS (DEFAULTS_POLICY_2026-10-11, PR B; JM 2026-10-11).
   Every path starts at TODAY'S PRICE and is a multiple of the Power Law
   trend, year by year (pathMultiple):
     stay   today's multiple for the whole plan, so bitcoin grows at the
            trend's own rate ("If bitcoin stays 47% below trend").
     trend  the multiple moves in a straight line from today's to 1.0x over
            3 years (PriceCases.REVERT_YEARS), then follows the trend ("If
            bitcoin returns to trend over 3 years"). Until 2026-10-11 this
            basis re-set the price to trend at year 0, which valued a stack
            held today at the trend price, not the market's.
     floor  a stress test, not a scenario: the multiple falls in a straight
            line to the floor (0.42x) over the same 3 years and stays there.
            It replaces the retired sitewide growth-model setting, whose
            Floor put the whole plan, today included, at 0.42x.
   'current' is the old name for 'stay', kept for links (?basis=current)
   and callers; a 'trend' call with growthKey 'powerlaw-floor' is 'floor'.
   The pages pick the default (the lower of the two scenarios) with
   PriceCases.defaultFor; this module only computes.

   Depends on (loaded before this file): shared/power-law-data.js
   (PL_A/PL_B/PL_FLOOR/plPrice/TODAY_PRICE), shared/reversion-durations.js
   and shared/price-cases.js (window.PriceCases: REVERT_YEARS and the
   return path), and shared/modeling-assumptions.js (inflation).
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

  /* ─── The price paths (see the header). `tYears` is whole years from this
         year: dateForYear keeps today's month and day, so year y is exactly
         y − this year from today. At t = 0 every path is today's multiple,
         so a stack held today is valued at the market's price. ─── */
  var PC = window.PriceCases || null;
  var REVERT_YEARS = PC ? PC.REVERT_YEARS : 3;
  function normBasis(basis, growthKey) {
    if (basis === 'current' || basis === 'stay') return 'stay';
    if (basis === 'floor' || growthKey === 'powerlaw-floor') return 'floor';
    return 'trend';
  }
  function pathMultiple(basis, m0, tYears) {
    var b = normBasis(basis);
    if (b === 'stay') return m0;
    var p = Math.max(0, Math.min(1, tYears / REVERT_YEARS));
    if (b === 'floor') return m0 + (PL_FLOOR - m0) * p;
    return PC ? PC.multipleAt('trend', m0, 0, tYears) : m0 + (1 - m0) * p;
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

     opts: { multiplier, multFn, plotAccumulation, flexPct, pathFn }
       multiplier        scalar price multiplier (default 1)
       multFn            per-year multiplier fn; overrides `multiplier`
       plotAccumulation  pre-retirement years carry a value, not null
       flexPct           cut withdrawals by this % in any year the price
                         path is below par (multFn(y) < 1)
       pathFn            per-year MULTIPLE OF TREND (the price paths,
                         2026-10-11): price = trend × pathFn(y) × multFn(y),
                         and growthModelKey and `multiplier` are ignored.
                         Kept apart from multFn on purpose: the spending cut
                         binds to the crash (multFn < 1), never to a path
                         that sits below trend.
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
    var pathFn = opts.pathFn || null;

    var stackBtc = scenario.btcStack;
    var points = [], btcPoints = [], depletionYear = null;

    for (var y = startYear; y <= endYear; y++) {
      var d = dateForYear(y);
      var price = pathFn
        ? plPriceAtDate(d) * pathFn(y) * (multFn ? multFn(y) : 1)
        : projPriceForGrowth(d, growthModelKey) * (multFn ? multFn(y) : scalar);

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

  // Legacy entry points: the raw trend (or 0.42x) price times a scalar or a
  // per-year multiplier, with no price path. No page calls them since
  // 2026-10-11 (every page runs projectPath / projectForBasis); they stay so
  // an old console call or QA script still gets an answer.
  function projectStackOverTime(scenario, growthModelKey, inflationPct, priceMultiplier, plotAccumulation) {
    return projectCore(scenario, growthModelKey, inflationPct,
      { multiplier: priceMultiplier, plotAccumulation: plotAccumulation });
  }
  function projectWithMultFn(scenario, growthModelKey, inflationPct, multFn, flexPct) {
    return projectCore(scenario, growthModelKey, inflationPct, { multFn: multFn, flexPct: flexPct });
  }

  /* ─── One price path through the loop (2026-10-11). opts: { multFn (a
         crash on top of the path), flexPct, plotAccumulation, growthKey,
         inflationPct }. m0 is read once per call, so every year of one
         projection uses the same starting multiple. ─── */
  function projectPath(scenario, basis, opts) {
    opts = opts || {};
    var b = normBasis(basis, opts.growthKey), m0 = currentRatio(), y0 = (new Date()).getFullYear();
    var infl = (opts.inflationPct !== undefined && opts.inflationPct !== null) ? opts.inflationPct : MA.get('inflation').value;
    return projectCore(scenario, 'powerlaw-trend', infl, {
      pathFn: function (y) { return pathMultiple(b, m0, y - y0); },
      multFn: opts.multFn || null, flexPct: opts.flexPct || 0, plotAccumulation: !!opts.plotAccumulation });
  }

  /* ─── Memoised path. Two columns × (base + threshold probes) is a few
         hundred loops per render; the cache keeps that to a handful of real
         ones. Bounded so a long dragging session cannot grow it without limit.
         The key carries the path, today's multiple (to 1e-8, so a new live
         price is a new entry) and the plot flag; monthlyDcaUSD joined it when
         the DCA leg landed, since two scenarios differing only in contribution
         would otherwise collide. ─── */
  var PROJ_CACHE = Object.create(null);
  var PROJ_CACHE_KEYS = [];
  function projectPathMemo(scenario, basis, growthKey, plotAccumulation) {
    var b = normBasis(basis, growthKey), infl = MA.get('inflation').value;
    var key = [scenario.btcStack.toFixed(6), scenario.targetIncomeUSD, scenario.retirementYear,
               scenario.yearsInRetirement, scenario.incomeBasis, b, currentRatio().toFixed(8),
               infl, plotAccumulation ? 1 : 0, (scenario.monthlyDcaUSD || 0), (new Date()).getFullYear()].join('|');
    var hit = PROJ_CACHE[key];
    if (hit) return hit;
    var out = projectPath(scenario, b, { inflationPct: infl, plotAccumulation: plotAccumulation });
    PROJ_CACHE[key] = out;
    PROJ_CACHE_KEYS.push(key);
    if (PROJ_CACHE_KEYS.length > 480) { delete PROJ_CACHE[PROJ_CACHE_KEYS.shift()]; }
    return out;
  }

  /* ─── One place that maps a price basis onto engine arguments, so two
         scenarios can never diverge in HOW they are computed — only in what
         they are. `multFn` (optional) injects the shared crash path ON TOP OF
         the price path; it forces the uncached loop because a function has
         no cache key. `basis`: 'stay' (or 'current') | 'trend' | 'floor'. ─── */
  /* `growthKey` (added 2026-09-01 for The Rundown's P1 snack): 'powerlaw-floor'
     with basis 'trend' runs the floor stress test, without touching any
     sitewide setting. Since 2026-10-11 nothing reads the old sitewide
     growth-model setting (retired; DEFAULTS_POLICY decision 2), so the
     override is the only way a caller reaches 'floor' besides naming it. */
  function projectForBasis(scenario, basis, noCache, multFn, growthKey) {
    if (multFn) return projectPath(scenario, basis, { multFn: multFn, growthKey: growthKey });
    if (noCache) return projectPath(scenario, basis, { growthKey: growthKey });
    return projectPathMemo(scenario, basis, growthKey, false);
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
  // `growthKey` (optional) threads straight through to projectForBasis — see the
  // note there. Omitted, the basis alone picks the price path.
  function lineFor(axis, scenario, basis, multFor, growthKey) {
    var infl = MA.get('inflation').value;
    function escapes(over) {
      var s = cloneWith(over, scenario);
      return computeVerdict(projectForBasis(s, basis, true, multFor && multFor(s), growthKey), s, infl).state === 'escape';
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

  /* ─── Verdict presentation — shared so every family page says the same
         thing about the same plan (coherence F1, 2026-09-23). Moved verbatim
         from bitcoin-escape-velocity.js, which had already added the `shrink`
         band; the flagship now reads these instead of its own two-state
         classifier. Wording lives here deliberately: the words ARE the
         verdict, and a page rewording them is how the family drifted. ─── */
  function plural(n, word) { return n + ' ' + word + (Math.abs(n) === 1 ? '' : 's'); }

  function spectrumPosition(v, scenario) {
    if (v.state === 'deplete') {
      var depletedAt = Math.max(0, v.depletionYear - scenario.retirementYear);
      var pos = 0.5 * (depletedAt / Math.max(1, scenario.yearsInRetirement));
      return Math.max(0.02, Math.min(0.46, pos));
    }
    if (v.state === 'shrink') {
      // Survives the window but shrinking: between depleting and escape,
      // scaled by how much real value is left at the horizon.
      var keep = Math.max(0, Math.min(1, v.ratio));
      return 0.46 + 0.04 * keep;
    }
    var ratio = v.ratio;
    var p = 0.5 + 0.5 * (Math.tanh(Math.log(Math.max(0.05, ratio))) + 1) / 2;
    return Math.min(0.98, Math.max(0.52, p));
  }

  // Every mention of "the window" names the year it ends (#3) — the reader
  // should never have to hunt for what the horizon actually is.
  function spectrumDetail(v, scenario) {
    var toYear = ' (to ' + v.horizonYear + ')';
    if (v.state === 'deplete') {
      var n = Math.max(0, v.depletionYear - scenario.retirementYear);
      return 'Stack depletes ' + plural(n, 'year') + ' into retirement at this withdrawal.';
    }
    if (v.state === 'shrink') {
      // Not "shrinking throughout" — it may have grown for two decades first.
      // Name the turn, and give the ending ratio so the reader can see both.
      return (v.turnedAtStart
          ? 'Stack outlives the window' + toYear + ' but growth never covers the withdrawal'
          : 'Stack outlives the window' + toYear + ' but turns over in ' + v.turnYear)
        + ' — it ends at ' + (v.ratio * 100).toFixed(0) + '% of its real value at retirement, and still falling.';
    }
    if (v.ratio >= 1.05) {
      return 'Stack grows ' + v.ratio.toFixed(1) + '× in real terms over the window' + toYear
        + ' — comfortably above escape velocity.';
    }
    if (v.ratio >= 0.85) {
      return 'Stack roughly maintains real value through the window' + toYear + ' — right at escape velocity.';
    }
    return 'Stack survives the window' + toYear + ' but loses some real value ('
      + (v.ratio * 100).toFixed(0) + '% of starting real value at the end).';
  }

  // The verdict as the two-scenario block states it (2026-10-11, DEFAULTS_POLICY
  // PR B): a short headline for the half's number and its tail, the same three
  // states in the family's words, so the flagship and Escape Velocity say the
  // same thing about the same plan.
  function blockVerdict(v, scenario) {
    if (v.state === 'deplete') {
      var n = Math.max(0, v.depletionYear - scenario.retirementYear);
      return { num: 'Runs out in ' + v.depletionYear, tail: plural(n, 'year') + ' into retirement' };
    }
    if (v.state === 'shrink') {
      return { num: v.turnedAtStart ? 'Shrinking throughout' : 'Shrinking from ' + v.turnYear,
               tail: 'lasts to ' + v.horizonYear + ', still falling at the end' };
    }
    return { num: 'Escape velocity', tail: 'from ' + v.escapeYear + ' through ' + v.horizonYear };
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
    // the price paths (2026-10-11)
    REVERT_YEARS: REVERT_YEARS,
    normBasis: normBasis,
    pathMultiple: pathMultiple,
    // projection
    projectCore: projectCore,
    projectStackOverTime: projectStackOverTime,
    projectWithMultFn: projectWithMultFn,
    projectPath: projectPath,
    projectPathMemo: projectPathMemo,
    projectForBasis: projectForBasis,
    // verdict + solver
    computeVerdict: computeVerdict,
    spectrumPosition: spectrumPosition,
    spectrumDetail: spectrumDetail,
    blockVerdict: blockVerdict,
    realValueAtYear: realValueAtYear,
    lineFor: lineFor,
    cloneWith: cloneWith
  };
})();
