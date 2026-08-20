/* =============================================================
   Bitcoin Escape Velocity — page logic

   Engine reuse (design doc §6.3, stress-test precedent): daysSince /
   plPriceAtDate / dateForYear / projPriceForGrowth / the SCENARIO shape /
   the year-by-year sell-to-cover-income loop are copied from
   the-bitcoin-retirement.js so the baseline projection is bit-parity with
   the flagship. PL_A/PL_B/PL_FLOOR/PL_CEIL/plPrice()/PL_DATA/TODAY_PRICE
   come from shared/power-law-data.js; inflation and growth model come from
   shared/modeling-assumptions.js. Both are loaded before this file.

   The only deviation from the flagship engine is the deliberate absence of
   pre-retirement DCA — this page has three inputs and no contribution
   field. The loop keeps the `dcaAdded` field (always 0) so the audit
   table's reproduce-any-row identity is the flagship's, unchanged.

   New code is confined to: the escape-year verdict (§6.1), dual-basis
   compute (§5.2), sensitivity deltas and axis crossings (§5.3), stepper
   chrome (§4), and the year-by-year residual strip (§5.4).

   window.evParityQA() runs the parity assertion required by §6.1.
   ============================================================= */
(function () {
  'use strict';

  var MA = window.ModelingAssumptions;

  /* ═══════════════════════════════════════════════════════════
     ENGINE — copied from the flagship for baseline parity
  ═══════════════════════════════════════════════════════════ */

  var GENESIS = new Date(Date.UTC(2009, 0, 3));
  var liveBtcPrice = TODAY_PRICE;

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

  // Live price ÷ today's trend price — how far below (<1) or above (>=1)
  // trend bitcoin is right now. Drives the gap-persists basis and the
  // above-trend copy guard (§5.2).
  function currentRatio() {
    var t = projPriceForGrowth(dateForYear((new Date()).getFullYear()), 'powerlaw-trend');
    return (t > 0) ? (liveBtcPrice / t) : 1;
  }
  function basisPhrase(ratio) { return ratio < 1 ? 'gap' : 'premium'; }

  /* ─── Scenario state — three primary inputs plus the horizon ─── */
  // Defaults: the wholecoiner plan — 1 BTC, $100K a year, retiring 2035 (JM's
  // call). At $100K the stack line sits at 1.11 BTC, so a whole coin lands on
  // the failure side by a clean margin rather than by a rounding error.
  // DEFAULTS below is snapshotted from this object, so the reset link and the
  // sessionStorage fallback both follow it with no second place to edit.
  var SCENARIO = {
    btcStack: 1.0,
    targetIncomeUSD: 100000,
    retirementYear: 2035,
    yearsInRetirement: 30,
    incomeBasis: 'today'   // 'today' = target is in today's dollars (default) | 'fixed' = same raw dollars every year
  };

  var LIMITS = {
    retirementYear:  { min: 2026, max: 2055 },
    btcStack:        { min: 0.01, max: 100 },
    targetIncomeUSD: { min: 20000, max: 500000 }
  };

  // How far past the horizon the shrink branch is allowed to look when
  // answering "on pace to deplete when?" (#6). A cap, not a claim: a stack
  // still shrinking 40 years past the window is reported as shrinking, not
  // assigned a depletion year the model has no business asserting.
  var EXTEND_CAP = 40;

  var GRAD = { btcStep: 0.25, incStep: 10000 };
  var PRICE_BASIS = 'trend';   // 'trend' (reverts) | 'current' (today's gap persists)
  var RT_DOLLARS  = 'real';    // 'real' (today's $, DEFAULT on this page) | 'nominal' (future $)

  var GRAD_STEPS = { btcStep: [0.05, 0.25, 1], incStep: [5000, 10000, 25000] };

  /* ─── The projection. Same loop as the flagship's
         projectStackOverTime, minus the DCA accumulation branch. ─── */
  function projectStackOverTime(scenario, growthModelKey, inflationPct, priceMultiplier) {
    var startYear = (new Date()).getFullYear();
    var endYear = scenario.retirementYear + scenario.yearsInRetirement;
    var infl = inflationPct / 100;
    var multiplier = (priceMultiplier === undefined || priceMultiplier === null || !isFinite(priceMultiplier))
      ? 1 : priceMultiplier;

    var stackBtc = scenario.btcStack;
    var points = [], btcPoints = [], depletionYear = null;

    for (var y = startYear; y <= endYear; y++) {
      var d = dateForYear(y);
      var price = projPriceForGrowth(d, growthModelKey) * multiplier;

      if (y < scenario.retirementYear) {
        // No contributions on this page: the stack rides the growth model
        // untouched. Null y keeps the pre-retirement rows out of the
        // residual series, exactly as the flagship's accumulation rows are.
        points.push({ x: y, y: null });
        btcPoints.push({ x: y, btc: stackBtc, usd: null, phase: 'accum',
          price: price, income: null, btcSold: null, dcaAdded: 0 });
      } else if (y === scenario.retirementYear) {
        points.push({ x: y, y: stackBtc * price });
        btcPoints.push({ x: y, btc: stackBtc, usd: stackBtc * price, phase: 'retire',
          price: price, income: null, btcSold: null, dcaAdded: 0 });
      } else {
        var yearsFromToday = y - startYear;
        var nominalIncome = (scenario.incomeBasis === 'fixed')
          ? scenario.targetIncomeUSD
          : scenario.targetIncomeUSD * Math.pow(1 + infl, yearsFromToday);
        var btcNeeded = nominalIncome / price;
        stackBtc = Math.max(0, stackBtc - btcNeeded);
        if (stackBtc <= 0 && depletionYear === null) depletionYear = y;
        points.push({ x: y, y: stackBtc * price });
        btcPoints.push({ x: y, btc: stackBtc, usd: stackBtc * price, phase: 'draw',
          price: price, income: nominalIncome, btcSold: btcNeeded, dcaAdded: 0 });
      }
    }
    return { points: points, btcPoints: btcPoints, depletionYear: depletionYear,
             startYear: startYear, endYear: endYear };
  }

  /* ─── Memoised projection. Every render runs both price bases plus three
         sensitivity nudges plus ~90 crossing probes; the cache keeps that
         to a handful of actual loops. Bounded so it cannot grow unbounded
         across a long dragging session. ─── */
  var PROJ_CACHE = Object.create(null);
  var PROJ_CACHE_KEYS = [];
  function projectMemo(scenario, growthModelKey, inflationPct, multiplier) {
    var key = [scenario.btcStack.toFixed(6), scenario.targetIncomeUSD, scenario.retirementYear,
               scenario.yearsInRetirement, scenario.incomeBasis, growthModelKey,
               inflationPct, (multiplier || 1).toFixed(6)].join('|');
    var hit = PROJ_CACHE[key];
    if (hit) return hit;
    var out = projectStackOverTime(scenario, growthModelKey, inflationPct, multiplier);
    PROJ_CACHE[key] = out;
    PROJ_CACHE_KEYS.push(key);
    if (PROJ_CACHE_KEYS.length > 240) { delete PROJ_CACHE[PROJ_CACHE_KEYS.shift()]; }
    return out;
  }

  // One place that maps a price basis onto engine arguments, so the two
  // bases can never diverge in how they are computed. Mirrors the
  // flagship's updateSustainability(): 'current' forces the trend growth
  // key and scales price by today's ratio.
  //
  // `noCache` is set by the crossing probes (renderLine): every bisection
  // step is a distinct stack/income value, so caching them would only
  // evict the hot base-and-delta entries that DO repeat.
  function projectForBasis(scenario, basis, noCache) {
    var infl = MA.get('inflation').value;
    var run = noCache ? projectStackOverTime : projectMemo;
    if (basis === 'current') return run(scenario, 'powerlaw-trend', infl, currentRatio());
    return run(scenario, MA.get('btcGrowthModel').preset, infl, 1);
  }

  /* ═══════════════════════════════════════════════════════════
     THE VERDICT (design doc §6.1)

     Escape year = the first modeled year Y such that the REAL residual
     (real annual stack growth minus real annual withdrawal) is
     non-negative for EVERY year from Y through the horizon — not merely
     at Y. "Permanently" is horizon-scoped, and the page says so: under
     the Power Law the trend growth rate declines with time, so the claim
     has to be checked across the whole span rather than asserted from a
     single crossing.

     Three first-class outcomes, equal weight:
       escape  — crosses and stays across through the horizon
       shrink  — never crosses, but the stack outlives the horizon
       deplete — the stack runs out in a named year

     `shrink` is not in the design doc, which assumes the only failure is
     depletion. It is reachable at ordinary inputs (0.25 BTC retiring in
     2045, for one), and calling it "depletes in YYYY" would be false, so
     it is stated plainly instead. Flagged for JM.
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

    // Depletion short-circuits: once the stack is empty every later
    // residual is exactly zero, which would otherwise read as "escaped".
    if (proj.depletionYear !== null) { out.state = 'deplete'; return out; }
    if (!residuals.length) { out.state = 'escape'; out.escapeYear = horizonYear; return out; }

    var lastNegative = null;
    for (var k = 0; k < residuals.length; k++) {
      if (residuals[k].value < -EPS) lastNegative = residuals[k].year;
    }
    if (lastNegative === null) { out.state = 'escape'; out.escapeYear = residuals[0].year; return out; }
    if (lastNegative >= horizonYear) {
      out.state = 'shrink';
      // The year the stack turned over for good: the first year of the final
      // unbroken run of negative residuals. "Shrink" does NOT mean losing
      // ground every year — a stack can grow for two decades, turn over, and
      // still be falling at the horizon, ending well above where it started.
      // Copy that says "loses ground every year" would be plainly false in
      // that case, so the turn year is computed and named instead.
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

  // Real value of a given scenario at an arbitrary year, for cross-scenario
  // deltas. Always measured at the BASE scenario's horizon year, so a
  // "retire one year later" delta is not silently comparing two dates.
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

  /* ─── Which basis is the conservative one is DYNAMIC (§5.2). It flips
         with where spot sits relative to trend, so it is never hard-coded:
         the conservative basis is whichever produces the worse answer. ─── */
  function severityTier(v) {
    if (v.state === 'deplete') return 0;
    if (v.state === 'shrink')  return 1;
    return 2;
  }
  // true when a is a worse (more conservative) outcome than b
  function isWorse(a, b) {
    var ta = severityTier(a), tb = severityTier(b);
    if (ta !== tb) return ta < tb;
    if (ta === 0) return a.depletionYear < b.depletionYear;     // depleting earlier is worse
    if (ta === 2) return a.escapeYear > b.escapeYear;           // escaping later is worse
    return false;
  }

  /* ═══════════════════════════════════════════════════════════
     FORMATTERS — flagship canon
  ═══════════════════════════════════════════════════════════ */

  function formatCurrencyShort(v) {
    if (!isFinite(v) || v <= 0) return '$0';
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }
  function formatUsdFull(v) { return '$' + Math.round(v).toLocaleString('en-US'); }
  function formatBtc(v) { return (v >= 10 ? v.toFixed(1) : v.toFixed(2)); }
  // Gradation steps read better unpadded — "Add 1 BTC", not "Add 1.00 BTC".
  function formatStep(v) { return String(Math.round(v * 1e6) / 1e6); }
  function plural(n, word) { return n + ' ' + word + (Math.abs(n) === 1 ? '' : 's'); }

  function rtDeflator(year, inflationPct) {
    var startYear = (new Date()).getFullYear();
    return Math.pow(1 + inflationPct / 100, Math.max(0, year - startYear));
  }
  // Display basis, applied at RENDER time only — the projection stays
  // nominal, so switching basis is a re-render, not a recompute. BTC price
  // is never deflated (flagship reconciliation note).
  function rtDollars(nominalUSD, year, inflationPct) {
    if (nominalUSD == null) return null;
    return (RT_DOLLARS === 'real') ? nominalUSD / rtDeflator(year, inflationPct) : nominalUSD;
  }
  function dollarWord() { return RT_DOLLARS === 'real' ? 'in today’s dollars' : 'in future dollars'; }

  function basisLabel(basis) {
    return basis === 'current'
      ? 'today’s ' + basisPhrase(currentRatio()) + ' to trend persists'
      : 'reverts to trend';
  }

  /* ═══════════════════════════════════════════════════════════
     STEPPERS (§4)
  ═══════════════════════════════════════════════════════════ */

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function stepFor(key) {
    if (key === 'btcStack') return GRAD.btcStep;
    if (key === 'targetIncomeUSD') return GRAD.incStep;
    return 1;
  }
  function displayValue(key) {
    if (key === 'retirementYear') return String(SCENARIO.retirementYear);
    if (key === 'btcStack') return formatBtc(SCENARIO.btcStack) + ' BTC';
    return formatUsdFull(SCENARIO.targetIncomeUSD);
  }

  // Deliberately does NOT snap to the gradation grid. A scenario arriving
  // from the flagship (or from a shared link) carries whatever stack the
  // sender actually had — snapping 0.37 BTC to 0.25 would silently answer
  // a different question than the one the link asked. Steppers add and
  // subtract the step from wherever the value is; only float drift is
  // rounded away.
  function setScenarioValue(key, raw) {
    var lim = LIMITS[key];
    var v = clamp(raw, lim.min, lim.max);
    v = (key === 'retirementYear') ? Math.round(v) : Math.round(v * 1e6) / 1e6;
    if (SCENARIO[key] === v) return false;
    SCENARIO[key] = v;
    return true;
  }

  function nudge(key, dir) {
    if (setScenarioValue(key, SCENARIO[key] + dir * stepFor(key))) {
      syncSteppers(); scheduleRender(); scheduleUrlSync(); saveSession();
    }
  }

  function syncSteppers() {
    document.querySelectorAll('.ev-stepper').forEach(function (el) {
      var key = el.getAttribute('data-key');
      var valBtn = el.querySelector('[data-role="value"]');
      if (valBtn) valBtn.textContent = displayValue(key);
      var lim = LIMITS[key], s = stepFor(key);
      el.querySelectorAll('.ev-step-btn').forEach(function (b) {
        var dir = parseInt(b.getAttribute('data-dir'), 10);
        var next = SCENARIO[key] + dir * s;
        b.disabled = (dir < 0) ? (SCENARIO[key] <= lim.min + 1e-9) : (next > lim.max + 1e-9);
      });
    });
  }

  // Press-and-hold repeat at ~4 steps/sec after a 450ms hold. The trailing
  // click is swallowed so a hold does not fire one extra step on release.
  function bindHoldRepeat(btn, fn) {
    var holdTimer = null, repeatTimer = null, didRepeat = false;
    function stop() {
      if (holdTimer) clearTimeout(holdTimer);
      if (repeatTimer) clearInterval(repeatTimer);
      holdTimer = repeatTimer = null;
    }
    btn.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      stop(); didRepeat = false;
      holdTimer = setTimeout(function () {
        didRepeat = true; fn();
        repeatTimer = setInterval(fn, 250);
      }, 450);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) {
      btn.addEventListener(t, stop);
    });
    btn.addEventListener('click', function () {
      if (didRepeat) { didRepeat = false; return; }
      fn();
    });
  }

  function wireSteppers() {
    document.querySelectorAll('.ev-stepper').forEach(function (el) {
      var key = el.getAttribute('data-key');
      el.querySelectorAll('.ev-step-btn').forEach(function (b) {
        var dir = parseInt(b.getAttribute('data-dir'), 10);
        bindHoldRepeat(b, function () { nudge(key, dir); });
      });

      // Keyboard: arrows drive the stepper once anything inside has focus.
      el.addEventListener('keydown', function (e) {
        if (e.target.classList.contains('ev-stepper-input')) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); nudge(key, 1); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); nudge(key, -1); }
      });

      // Direct entry — click the value to type it. The stepper stays the
      // primary surface; this exists so a 20-BTC visitor is not asked to
      // click eighty times.
      var valBtn = el.querySelector('[data-role="value"]');
      var input  = el.querySelector('[data-role="entry"]');
      if (!valBtn || !input) return;
      var entryOpen = false;
      function openEntry() {
        entryOpen = true;
        input.value = String(SCENARIO[key]);
        valBtn.hidden = true; input.hidden = false;
        input.focus(); input.select();
      }
      function closeEntry(commit) {
        // Guard: Enter closes the field, which fires blur, which would
        // otherwise re-enter here — and after Escape that second pass
        // would commit the value the user just cancelled.
        if (!entryOpen) return;
        entryOpen = false;
        if (commit) {
          var n = parseFloat(input.value);
          if (isFinite(n) && setScenarioValue(key, n)) {
            scheduleRender(); scheduleUrlSync(); saveSession();
          }
        }
        input.hidden = true; valBtn.hidden = false;
        syncSteppers();
      }
      valBtn.addEventListener('click', openEntry);
      input.addEventListener('blur', function () { closeEntry(true); });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); closeEntry(true); valBtn.focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); closeEntry(false); valBtn.focus(); }
      });
    });

    // Gradation controls. Changing the step also changes the units the
    // sensitivity panel speaks in, so "add 0.25 BTC" is literally
    // "click the right arrow once" (§4.2).
    document.querySelectorAll('.seg-control[data-grad]').forEach(function (group) {
      var which = group.getAttribute('data-grad');
      group.querySelectorAll('.seg-btn').forEach(function (b) {
        b.addEventListener('click', function (e) {
          if (e.target.closest('.help-tip')) return;
          if (which === 'years') {
            SCENARIO.yearsInRetirement = parseInt(b.getAttribute('data-years'), 10);
          } else {
            GRAD[which] = parseFloat(b.getAttribute('data-step'));
          }
          group.querySelectorAll('.seg-btn').forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
          syncSteppers(); scheduleRender(); scheduleUrlSync();
        });
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     VERDICT CARD + ROBUSTNESS LINE (§5.1–5.2)
  ═══════════════════════════════════════════════════════════ */

  // The Power Law is the assumption every figure on this page rests on, so it
  // carries the flagship's disclosure discipline rather than a bare mention
  // (#2). Rendered inside the verdict explainer, where the reader meets the
  // claim, not parked in a footnote.
  var POWER_LAW_TIP = '<span class="help-tip" tabindex="0">?<span class="tip-content">'
    + 'Every figure on this page is computed against the <strong>Power Law trend</strong> — a regression of '
    + 'bitcoin’s entire price history against time, used as a central-tendency assumption, not a forecast. '
    + 'Its implied growth rate <em>declines</em> with time, which is exactly why “permanently” has to be '
    + 'checked across the whole horizon instead of asserted from a single crossing. '
    + '<a href="/the-power-law.html">What the Power Law is, and where it breaks →</a>'
    + '</span></span>';

  function verdictSentence(v, basis, extDepletion) {
    // Name the arithmetic rather than dropping a bare year on the reader (#3).
    // The Power Law's first appearance in body copy gets three ways in (#19):
    // the phrase itself links out, the disclosure tooltip sits beside it, and
    // the growth-model control and the FAQ carry their own links.
    var basisTail = '<span class="ev-verdict-tail">Checked every year through <strong>' + v.horizonYear
      + '</strong> — your ' + SCENARIO.retirementYear + ' retirement plus the '
      + SCENARIO.yearsInRetirement + '-year horizon (set under Assumptions) — '
      + dollarWord() + ', against the <a href="/the-power-law.html">Power Law</a> trend with price '
      + basisLabel(basis) + '.' + POWER_LAW_TIP + '</span>';

    if (v.state === 'escape') {
      return 'On these inputs, the stack’s growth permanently exceeds spending from <strong>'
        + v.escapeYear + '</strong>.' + basisTail;
    }
    if (v.state === 'deplete') {
      return 'Never reaches escape velocity — the stack <strong>depletes in '
        + v.depletionYear + '</strong>.' + basisTail;
    }
    // Shrink: survives the window, but growth stops covering withdrawals
    // before it ends. Two shapes — never covered them at all, or covered them
    // for a while and turned over — and the copy has to tell them apart.
    var turnClause = v.turnedAtStart
      ? 'growth never covers your withdrawals'
      : 'growth stops covering your withdrawals from <strong>' + v.turnYear + '</strong>';
    var tail = extDepletion
      ? ' <strong>On pace to deplete around ' + roundApprox(extDepletion) + '</strong>, beyond the window.'
      : ' It does not run out inside the window; it runs down.';
    return 'Survives your ' + SCENARIO.yearsInRetirement + '-year window, but ' + turnClause
      + ' — and it is still falling at <strong>' + v.horizonYear + '</strong>.' + tail + basisTail;
  }

  // The robustness line mirrors the shape of the verdict it is reporting (#17).
  // "No escape, but no depletion either" said nothing a reader could act on;
  // the shrink state has a turn year and a trajectory, and the line that
  // reports it should carry both — recomputed for whichever basis it describes.
  function shortVerdict(v, basis) {
    if (v.state === 'escape') return '<strong>' + v.escapeYear + '</strong>';
    if (v.state === 'deplete') return 'depletion in <strong>' + v.depletionYear + '</strong>';
    var ext = extendedDepletion(SCENARIO, basis);
    return ext
      ? '<strong>no escape</strong> — the stack turns over in <strong>' + v.turnYear
        + '</strong> and is on pace to deplete around <strong>' + roundApprox(ext) + '</strong>, beyond the window'
      : '<strong>no escape</strong> — the stack turns over in <strong>' + v.turnYear
        + '</strong> and is still falling at the horizon';
  }

  function renderVerdict(vSel, vOther, basis, otherBasis) {
    var extDep = (vSel.state === 'shrink') ? extendedDepletion(SCENARIO, basis) : null;
    var sentEl = document.getElementById('evVerdictSentence');
    if (sentEl) sentEl.innerHTML = verdictSentence(vSel, basis, extDep);

    // Robustness line. Never hard-codes which basis is conservative —
    // it reports whichever of the two produced the worse answer, and says
    // so in the opposite direction when the user is already on it (§5.2,
    // open item #3: shown rather than suppressed, symmetry reads as
    // confidence).
    var robEl = document.getElementById('evRobustness');
    if (robEl) {
      var same = (vOther.state === vSel.state)
        && (vOther.escapeYear === vSel.escapeYear)
        && (vOther.depletionYear === vSel.depletionYear);
      if (same) {
        robEl.hidden = false;
        robEl.innerHTML = 'Both price bases agree here — ' + basisLabel(otherBasis)
          + ' gives the same answer.';
      } else if (isWorse(vOther, vSel)) {
        robEl.hidden = false;
        robEl.innerHTML = 'Under the more conservative price basis (' + basisLabel(otherBasis)
          + '): ' + shortVerdict(vOther, otherBasis) + '.';
      } else {
        robEl.hidden = false;
        robEl.innerHTML = 'You are on the more conservative basis. The less conservative one ('
          + basisLabel(otherBasis) + ') says: ' + shortVerdict(vOther, otherBasis) + '.';
      }
    }

    // Above-trend copy guard (§5.2). The floor-vs-upper asymmetry the
    // retirement page codifies, applied to basis selection: excursions
    // below trend have held, excursions above it have been brief.
    var noteEl = document.getElementById('evAboveTrendNote');
    if (noteEl) {
      var r = currentRatio();
      if (r > 1.05 && basis === 'current') {
        noteEl.hidden = false;
        noteEl.textContent = 'Bitcoin currently trades above its long-term trend ('
          + r.toFixed(2) + '×). Historically, excursions above trend have been brief spikes '
          + 'rather than sustained plateaus — the trend basis is the more conservative read here.';
      } else { noteEl.hidden = true; }
    }

    var nomEl = document.getElementById('evNominalNote');
    if (nomEl) nomEl.hidden = (RT_DOLLARS !== 'nominal');

    // Two supporting figures.
    var inflationPct = MA.get('inflation').value;
    var proj = projectForBasis(SCENARIO, basis);
    var atRetNominal = null;
    for (var i = 0; i < proj.points.length; i++) {
      if (proj.points[i].x === SCENARIO.retirementYear) { atRetNominal = proj.points[i].y; break; }
    }
    var elStack = document.getElementById('evStackAtRet');
    if (elStack) elStack.textContent = formatCurrencyShort(rtDollars(atRetNominal, SCENARIO.retirementYear, inflationPct));

    var horizonNominal = null;
    for (var j = 0; j < proj.points.length; j++) {
      if (proj.points[j].x === vSel.horizonYear) { horizonNominal = proj.points[j].y; break; }
    }
    var elHz = document.getElementById('evValueAtHorizon');
    if (elHz) elHz.textContent = formatCurrencyShort(rtDollars(horizonNominal, vSel.horizonYear, inflationPct));

    var elHzYear = document.getElementById('evHorizonYearLabel');
    if (elHzYear) elHzYear.textContent = vSel.horizonYear;
    var elHzNote = document.getElementById('evHorizonBasisNote');
    if (elHzNote) elHzNote.textContent = RT_DOLLARS === 'real' ? 'In today’s dollars.' : 'In future dollars.';
    var elBw = document.getElementById('evBasisWord');
    if (elBw) elBw.textContent = basisLabel(basis) + (basis === 'current' ? ' (' + currentRatio().toFixed(2) + '×)' : '');

    updateSpectrum(vSel);
  }

  /* ─── Spectrum bar. Position and detail copy are the flagship's
         computeEscapeVelocity() semantics, with the middle `shrink` state
         given its own band so the marker cannot sit in the escape zone
         while the sentence above says otherwise. ─── */
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

  function updateSpectrum(v) {
    var marker = document.getElementById('evSpectrumMarker');
    var track  = document.getElementById('evSpectrumTrack');
    var detail = document.getElementById('evSpectrumDetail');
    if (!marker) return;
    var pos = spectrumPosition(v, SCENARIO);
    var achieved = (v.state === 'escape');
    marker.style.left = (pos * 100).toFixed(2) + '%';
    marker.classList.toggle('escape', achieved);
    if (track) track.classList.toggle('escape', achieved);
    if (detail) detail.textContent = spectrumDetail(v, SCENARIO);
  }

  /* ═══════════════════════════════════════════════════════════
     SENSITIVITY PANEL (§5.3) + AXIS CROSSINGS
  ═══════════════════════════════════════════════════════════ */

  function cloneWith(over, base) {
    var src = base || SCENARIO;
    var s = {};
    for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) s[k] = src[k];
    for (var o in over) if (Object.prototype.hasOwnProperty.call(over, o)) s[o] = over[o];
    return s;
  }

  /* ─── Shrink-branch extension (#6). A stack that outlives the horizon while
         still losing ground every year is on a trajectory, and the honest thing
         is to name where that trajectory ends. Runs the SAME loop with the
         horizon pushed out by EXTEND_CAP years and reports the depletion year
         if one lands inside the cap. This is new OUTPUT only — it never feeds
         computeVerdict, so the escape/deplete boundary is untouched. ─── */
  function extendedDepletion(scenario, basis) {
    var ext = cloneWith({ yearsInRetirement: scenario.yearsInRetirement + EXTEND_CAP }, scenario);
    return projectForBasis(ext, basis, true).depletionYear;   // null = still going at the cap
  }

  // Displayed to the nearest five years. This is an extrapolation decades past
  // the horizon the reader chose; quoting it to the year would be false
  // precision dressed as an answer.
  function roundApprox(year) { return year === null ? null : Math.round(year / 5) * 5; }

  function statePhrase(v) {
    if (v.state === 'escape') return 'reaches escape velocity';
    if (v.state === 'shrink') return 'lasts to ' + v.horizonYear + ' but is falling by the end';
    return 'depletes in ' + v.depletionYear;
  }


  /* ═══════════════════════════════════════════════════════════
     THE THRESHOLD (review round 2)

     One instrument, replacing both the old One-step rows and the
     single-axis scrubber. Three full-range sliders, always visible: the
     thumb is your value, the tick is that axis's LINE, solved live while
     the other two hold. Fix-two-find-the-third, with all three at once.

     There is no Apply. Every control on the page — steppers, docked bar,
     mobile fallback, these sliders — reads and writes one shared state.

     One solver, never two: the tick position, the where-the-lines text and
     the consequences readout all call lineFor(). A slider whose flip point
     disagreed with its own printed line would be worse than no slider, and
     the only way to guarantee they agree is for there to be nothing to
     disagree with. evParityQA asserts it across the vector set anyway.
  ═══════════════════════════════════════════════════════════ */

  var AXES = {
    retire: { key: 'retirementYear',  label: 'Retire in',   log: false, higherIsBetter: true  },
    stack:  { key: 'btcStack',        label: 'Stack',       log: true,  higherIsBetter: true  },
    income: { key: 'targetIncomeUSD', label: 'Withdrawal',  log: false, higherIsBetter: false }
  };

  /* ─── THE SOLVER. The single implementation of "where is the line on this
         axis". The slider ticks, the where-the-lines text, the consequences
         readout and the QA assertion all call this and nothing else — a
         second implementation is exactly how a tick and its own caption end
         up disagreeing. ─── */
  // `basis` defaults to the live PRICE_BASIS. It is a parameter rather than a
  // read of the global because the QA pass solves under both bases, and a
  // solver that silently ignored the basis it was asked for produced 22 false
  // failures the first time this assertion ran.
  function lineFor(axis, scenario, basis) {
    var infl = MA.get('inflation').value;
    var useBasis = basis || PRICE_BASIS;
    function escapes(over) {
      var s = cloneWith(over, scenario);
      return computeVerdict(projectForBasis(s, useBasis, true), s, infl).state === 'escape';
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
    // Retirement year is NOT monotone: the stack a plan needs falls as the
    // year moves out, then rises again once the horizon reaches the
    // low-real-growth end of the Power Law. Bisection would be wrong. Scan.
    var ly = LIMITS.retirementYear;
    for (var y = ly.min; y <= ly.max; y++) { if (escapes({ retirementYear: y })) return { value: y, bound: null }; }
    return { value: null, bound: 'above' };
  }

  function formatLineValue(axis, v) {
    if (axis === 'stack')  return formatBtc(v) + ' BTC';
    if (axis === 'income') return formatUsdFull(Math.round(v));
    return String(Math.round(v));
  }
  var SLIDER_RES = 1000;   // range inputs run 0..1000; axis units are mapped

  // Log scale on the stack axis only. Linear over 0.01–100 BTC would put every
  // interesting value — and almost every line — inside the first 3% of the
  // track. Log spreads 0.01→1 and 1→100 over half the track each.
  function axisToPos(axis, v) {
    var lim = LIMITS[AXES[axis].key];
    var f;
    if (AXES[axis].log) {
      var lo = Math.log(lim.min), hi = Math.log(lim.max);
      f = (Math.log(Math.max(lim.min, v)) - lo) / (hi - lo);
    } else {
      f = (v - lim.min) / (lim.max - lim.min);
    }
    return Math.round(Math.max(0, Math.min(1, f)) * SLIDER_RES);
  }
  function posToAxis(axis, pos) {
    var lim = LIMITS[AXES[axis].key];
    var f = Math.max(0, Math.min(1, pos / SLIDER_RES));
    if (AXES[axis].log) {
      var lo = Math.log(lim.min), hi = Math.log(lim.max);
      return Math.exp(lo + f * (hi - lo));
    }
    return lim.min + f * (lim.max - lim.min);
  }

  // Step chips act as snap increments on the sliders (#3). Below the first
  // whole step the axis minimum stays reachable, so the low end of the log
  // track is not a dead zone.
  function snapToStep(axis, v) {
    var lim = LIMITS[AXES[axis].key];
    if (axis === 'retire') return Math.round(v);
    var step = (axis === 'stack') ? GRAD.btcStep : GRAD.incStep;
    var snapped = Math.round(v / step) * step;
    if (snapped < step) snapped = (v < step / 2) ? lim.min : step;
    return Math.max(lim.min, Math.min(lim.max, Math.round(snapped * 1e6) / 1e6));
  }

  function planValue(axis) { return SCENARIO[AXES[axis].key]; }

  // Lines depend on the plan, the basis and the canonical assumptions — not on
  // the display toggle — so a nominal/real flip must not re-run ~75 projections.
  var LINE_KEY = null, LINE_CACHE = null;
  function lines() {
    var key = [SCENARIO.btcStack, SCENARIO.targetIncomeUSD, SCENARIO.retirementYear,
               SCENARIO.yearsInRetirement, SCENARIO.incomeBasis, PRICE_BASIS,
               MA.get('inflation').value, MA.get('btcGrowthModel').preset,
               liveBtcPrice].join('|');
    if (key === LINE_KEY) return LINE_CACHE;
    LINE_KEY = key;
    LINE_CACHE = { stack:  lineFor('stack', SCENARIO),
                   income: lineFor('income', SCENARIO),
                   retire: lineFor('retire', SCENARIO) };
    return LINE_CACHE;
  }

  function renderSliders() {
    var L = lines();
    document.querySelectorAll('.ev-slider').forEach(function (el) {
      var axis = el.getAttribute('data-axis');
      var ax = AXES[axis], lim = LIMITS[ax.key], ln = L[axis];
      var val = planValue(axis);

      var valBtn = el.querySelector('[data-role="value"]');
      if (valBtn && valBtn.hidden !== true) valBtn.textContent = formatLineValue(axis, val);

      var range = el.querySelector('[data-role="range"]');
      if (range && document.activeElement !== range) range.value = axisToPos(axis, val);
      else if (range && range.value !== String(axisToPos(axis, val))) range.value = axisToPos(axis, val);

      // Track paints the spectrum bar's vocabulary onto this axis.
      var track = el.querySelector('[data-role="track"]');
      var tick = el.querySelector('[data-role="tick"]');
      var outOfRange = (ln.value === null);
      if (track) {
        var f = outOfRange ? (ax.higherIsBetter ? 1 : 0) : (axisToPos(axis, ln.value) / SLIDER_RES);
        var pct = (Math.max(0, Math.min(1, f)) * 100).toFixed(2) + '%';
        track.style.background = ax.higherIsBetter
          ? 'linear-gradient(to right, rgba(192,57,43,0.45) 0%, rgba(224,148,34,0.35) ' + pct + ', rgba(120,180,90,0.45) 100%)'
          : 'linear-gradient(to right, rgba(120,180,90,0.45) 0%, rgba(224,148,34,0.35) ' + pct + ', rgba(192,57,43,0.45) 100%)';
        if (tick) { tick.style.left = pct; tick.hidden = outOfRange; }
      }

      var lo = el.querySelector('[data-role="min"]'), hi = el.querySelector('[data-role="max"]');
      if (lo) lo.textContent = formatLineValue(axis, lim.min);
      if (hi) hi.textContent = formatLineValue(axis, lim.max);
      var lbl = el.querySelector('[data-role="linelabel"]');
      if (lbl) {
        lbl.textContent = outOfRange ? 'line beyond this range' : 'line ' + formatLineValue(axis, ln.value);
        lbl.classList.toggle('is-out', outOfRange);
      }
    });
  }

  function wireSliders() {
    document.querySelectorAll('.ev-slider').forEach(function (el) {
      var axis = el.getAttribute('data-axis');
      var ax = AXES[axis];
      var range = el.querySelector('[data-role="range"]');
      var valBtn = el.querySelector('[data-role="value"]');
      var entry = el.querySelector('[data-role="entry"]');

      if (range) {
        range.addEventListener('input', function () {
          var raw = posToAxis(axis, parseFloat(range.value));
          var snapped = snapToStep(axis, raw);
          // Live state, no Apply: the slider IS the plan.
          if (setScenarioValue(ax.key, snapped)) {
            syncSteppers(); scheduleRender(); scheduleUrlSync(); saveSession();
          }
          if (valBtn) valBtn.textContent = formatLineValue(axis, SCENARIO[ax.key]);
        });
      }

      if (!valBtn || !entry) return;
      var open = false;
      function openEntry() {
        open = true;
        entry.value = String(SCENARIO[ax.key]);
        valBtn.hidden = true; entry.hidden = false;
        entry.focus(); entry.select();
      }
      function closeEntry(commit) {
        if (!open) return;
        open = false;
        if (commit) {
          var n = parseFloat(entry.value);
          if (isFinite(n) && setScenarioValue(ax.key, n)) {
            syncSteppers(); scheduleRender(); scheduleUrlSync(); saveSession();
          }
        }
        entry.hidden = true; valBtn.hidden = false;
        renderSliders();
      }
      valBtn.addEventListener('click', openEntry);
      entry.addEventListener('blur', function () { closeEntry(true); });
      entry.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); closeEntry(true); valBtn.focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); closeEntry(false); valBtn.focus(); }
      });
    });
  }

  /* ─── Line phrasing (#12). One place, so the pattern cannot drift.
         Never "the line moves X → Y" — the sentence has to say what the
         quantity IS before it says what it did. ─── */
  function lineMovePhrase(axis, from, to) {
    var dir = (to > from) ? 'rises' : 'falls';
    if (axis === 'stack') {
      return 'the stack needed to escape ' + dir + ' from ' + formatBtc(from) + ' to <strong>' + formatBtc(to) + ' BTC</strong>';
    }
    if (axis === 'income') {
      return 'the withdrawal the plan can sustain ' + dir + ' from ' + formatUsdFull(from) + ' to <strong>' + formatUsdFull(to) + '</strong>';
    }
    return 'the earliest retirement year that crosses moves from ' + from + ' to <strong>' + to + '</strong>';
  }
  function lineSitPhrase(axis, ln, plan) {
    if (ln.value === null) {
      if (axis === 'stack')  return { html: 'The stack needed to escape is <strong>beyond this page&rsquo;s range</strong> &mdash; no stack up to ' + formatBtc(LIMITS.btcStack.max) + ' BTC crosses at this withdrawal and this date.', past: false };
      if (axis === 'income') return { html: 'The withdrawal the plan can sustain is <strong>below this page&rsquo;s range</strong> &mdash; no withdrawal down to ' + formatUsdFull(LIMITS.targetIncomeUSD.min) + ' crosses at this stack and this date.', past: false };
      return { html: 'No retirement year through <strong>' + LIMITS.retirementYear.max + '</strong> crosses at this stack and this withdrawal.', past: false };
    }
    if (axis === 'stack')  return { html: 'The stack needed to escape is <strong>' + formatBtc(ln.value) + ' BTC</strong><span class="ev-line-you"> &mdash; your plan holds ' + formatBtc(plan) + '.</span>', past: plan >= ln.value };
    if (axis === 'income') return { html: 'The withdrawal the plan can sustain is <strong>' + formatUsdFull(ln.value) + '/yr</strong><span class="ev-line-you"> &mdash; your plan withdraws ' + formatUsdFull(plan) + '.</span>', past: plan <= ln.value };
    return { html: 'The earliest retirement year that crosses is <strong>' + ln.value + '</strong><span class="ev-line-you"> &mdash; your plan retires ' + plan + '.</span>', past: plan >= ln.value };
  }

  function renderLineRows() {
    var host = document.getElementById('evLineRows');
    if (!host) return;
    var L = lines();
    var rows = [
      lineSitPhrase('stack',  L.stack,  SCENARIO.btcStack),
      lineSitPhrase('income', L.income, SCENARIO.targetIncomeUSD),
      lineSitPhrase('retire', L.retire, SCENARIO.retirementYear)
    ];
    host.innerHTML = rows.map(function (r) {
      return '<div class="ev-line-row' + (r.past ? ' is-past' : '') + '">' + r.html + '</div>';
    }).join('');
  }

  /* ─── Bidirectional consequences (#5).
         One step each way per variable, verdict flips headlined. Kept to one
         clause per direction: three rows × two directions is already six
         outcomes, and any more per clause turns a readout into a paragraph. ─── */
  var CONSEQ_ROWS = [
    { axis: 'retire', key: 'retirementYear',  reports: 'stack',
      title: function () { return 'Retire ±1 year'; },
      unit: function (d) { return (d > 0 ? '+1 yr' : '−1 yr'); } },
    { axis: 'stack',  key: 'btcStack',        reports: 'income',
      title: function () { return 'Stack ±' + formatStep(GRAD.btcStep) + ' BTC'; },
      unit: function (d) { return (d > 0 ? '+' : '−') + formatStep(GRAD.btcStep) + ' BTC'; } },
    { axis: 'income', key: 'targetIncomeUSD', reports: 'stack',
      title: function () { return 'Withdrawal ±' + formatCurrencyShort(GRAD.incStep); },
      unit: function (d) { return (d > 0 ? '+' : '−') + formatCurrencyShort(GRAD.incStep); } }
  ];

  function renderConsequences(baseVerdict, basis) {
    var host = document.getElementById('evConsequences');
    if (!host) return;
    var inflationPct = MA.get('inflation').value;
    var baseProj = projectForBasis(SCENARIO, basis);
    var baseAtHorizon = realValueAtYear(baseProj, baseVerdict.horizonYear, inflationPct);
    var L = lines();
    var html = '';

    CONSEQ_ROWS.forEach(function (row) {
      var lim = LIMITS[row.key];
      var step = (row.key === 'retirementYear') ? 1 : (row.key === 'btcStack' ? GRAD.btcStep : GRAD.incStep);
      var dirs = '';

      [-1, 1].forEach(function (d) {
        var next = SCENARIO[row.key] + d * step;
        if (next < lim.min - 1e-9 || next > lim.max + 1e-9) {
          dirs += '<div class="ev-conseq-dir"><span class="ev-conseq-arrow">' + row.unit(d)
            + '</span><span class="ev-line-you">end of range</span></div>';
          return;
        }
        var over = {}; over[row.key] = next;
        var nudged = cloneWith(over);
        var nProj = projectForBasis(nudged, basis);
        var nv = computeVerdict(nProj, nudged, inflationPct);

        var clause;
        if (nv.state !== baseVerdict.state) {
          clause = '<span class="ev-conseq-flip">' + (nv.state === 'escape' ? 'crosses the line' : 'now ' + statePhrase(nv)) + '</span>';
        } else {
          var lnBefore = L[row.reports], lnAfter = lineFor(row.reports, nudged);
          clause = (lnBefore.value !== null && lnAfter.value !== null && lnBefore.value !== lnAfter.value)
            ? 'no flip &mdash; ' + lineMovePhrase(row.reports, lnBefore.value, lnAfter.value)
            : 'no flip';
        }
        var nAtHorizon = realValueAtYear(nProj, baseVerdict.horizonYear, inflationPct);
        if (baseAtHorizon != null && nAtHorizon != null && (baseAtHorizon > 0.5 || nAtHorizon > 0.5)) {
          var dv = nAtHorizon - baseAtHorizon;
          clause += '<span class="ev-conseq-sep">·</span>value at ' + baseVerdict.horizonYear
            + ' <strong class="' + (dv >= 0 ? 'ev-conseq-pos' : 'ev-conseq-neg') + '">'
            + (dv >= 0 ? '+' : '−') + formatCurrencyShort(Math.abs(dv)) + '</strong>';
        }
        dirs += '<div class="ev-conseq-dir"><span class="ev-conseq-arrow">' + row.unit(d) + '</span>' + clause + '</div>';
      });

      html += '<div class="ev-conseq"><span class="ev-conseq-var">' + row.title() + '</span>'
        + '<span class="ev-conseq-dirs">' + dirs + '</span></div>';
    });

    host.innerHTML = html;
  }

  function renderThreshold(baseVerdict, basis) {
    renderSliders();
    renderConsequences(baseVerdict, basis);
    renderLineRows();
  }

  /* ═══════════════════════════════════════════════════════════
     YEAR-BY-YEAR RESIDUAL STRIP (§5.4)
     The flagship's growing-green-bar treatment, kept deliberately.
     Bar length is the residual — that year's growth minus that year's
     spending — so the widening (or narrowing) IS the picture.
  ═══════════════════════════════════════════════════════════ */

  function renderStrip(v, basis) {
    var host = document.getElementById('evStrip');
    var cap  = document.getElementById('evStripCaption');
    if (!host) return;

    var res = v.residuals;
    if (!res.length) { host.innerHTML = ''; if (cap) cap.textContent = '—'; return; }

    var posMax = 0, negMax = 0;
    res.forEach(function (r) {
      if (r.value > posMax) posMax = r.value;
      if (-r.value > negMax) negMax = -r.value;
    });
    var span = posMax + negMax;
    // Fraction of the strip height that sits BELOW the zero line.
    var zeroFrac = span > 0 ? (negMax / span) : 0;
    var zeroPct = (zeroFrac * 100);

    var markYear = (v.state === 'deplete') ? v.depletionYear
                 : (v.state === 'escape')  ? v.escapeYear : null;

    var html = '';
    res.forEach(function (r, idx) {
      var cls, style;
      if (r.value > EPS) {
        cls = 'pos';
        style = 'bottom:' + zeroPct.toFixed(3) + '%;height:' + ((r.value / (posMax || 1)) * (100 - zeroPct)).toFixed(3) + '%';
      } else if (r.value < -EPS) {
        cls = 'neg';
        style = 'top:' + (100 - zeroPct).toFixed(3) + '%;height:' + ((-r.value / (negMax || 1)) * zeroPct).toFixed(3) + '%';
      } else {
        // A flat year sits ON the zero rule, not above it — otherwise a
        // strip where every residual is negative (zero line at the top)
        // pushes its flat tail up into the padding.
        cls = 'zero';
        style = 'bottom:calc(' + zeroPct.toFixed(3) + '% - 1px);height:2px';
      }
      var mark = '';
      if (markYear !== null && r.year === markYear) {
        var right = (idx / res.length) > 0.62 ? ' is-right' : '';
        var word = (v.state === 'deplete') ? 'Depletes ' : 'Escape ';
        mark = '<span class="ev-strip-mark' + right + '"><span>' + word + r.year + '</span></span>';
      }
      // No `title` attribute (#20): the native tooltip's ~1s delay makes
      // scrubbing across years feel broken. Data rides on the column and a
      // real element renders it instantly.
      html += '<div class="ev-strip-col" data-year="' + r.year + '" data-residual="' + r.value.toFixed(2) + '">'
        + mark + '<div class="ev-bar ' + cls + '" style="' + style + '"></div></div>';
    });

    var tipEl = document.getElementById('evStripTip');
    host.innerHTML = '<div class="ev-strip-plot">'
      + '<div class="ev-strip-zero" style="bottom:' + zeroPct.toFixed(3) + '%"></div>'
      + html + '</div>';
    if (tipEl) { tipEl.hidden = true; host.appendChild(tipEl); }

    if (cap) {
      var first = res[0], last = res[res.length - 1];
      var tail;
      if (v.state === 'escape') {
        // Not always a monotone widening: under the Power Law the trend
        // growth rate declines with time, so on a long horizon the gap can
        // peak and then ease. Say which of the two actually happened.
        var peak = res[0];
        res.forEach(function (r) { if (r.value > peak.value) peak = r; });
        tail = 'The gap ' + (last.value > first.value ? 'widens' : 'runs') + ' from <strong>'
          + (first.value >= 0 ? '+' : '−') + formatCurrencyShort(Math.abs(first.value))
          + '</strong> in ' + first.year + ' to <strong>+'
          + formatCurrencyShort(Math.max(0, last.value)) + '</strong> by ' + last.year + '.';
        if (peak.year !== last.year && peak.year !== first.year) {
          tail += ' It peaks in <strong>' + peak.year + '</strong> and eases after — trend growth slows as the Power Law flattens.';
        }
      } else if (v.state === 'deplete') {
        tail = 'Every bar is a year the stack lost ground; it runs out in <strong>' + v.depletionYear + '</strong>.';
      } else {
        // Same trap as the verdict copy: a shrinking plan is usually NOT
        // negative throughout. It runs positive, turns over, and stays
        // negative from there. Say which shape this one is.
        tail = v.turnedAtStart
          ? 'Every bar is negative — the stack never outgrows the withdrawal; it just does not run out before ' + v.horizonYear + '.'
          : 'The bars run positive until <strong>' + v.turnYear + '</strong>, then turn negative and stay that way through ' + v.horizonYear + '.';
      }
      cap.innerHTML = 'One bar per retirement year, ' + (first.year) + '–' + (last.year)
        + ', in today’s dollars, with price ' + basisLabel(basis) + '. ' + tail;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     ASSUMPTIONS CARD (§4.3)
  ═══════════════════════════════════════════════════════════ */

  function assumptionsSummary() {
    return basisLabel(PRICE_BASIS)
      + ' · ' + (RT_DOLLARS === 'real' ? 'today’s $' : 'future $')
      + ' · income ' + (SCENARIO.incomeBasis === 'fixed' ? 'same every year' : 'rises with inflation')
      + ' · ' + SCENARIO.yearsInRetirement + '-yr horizon'
      + ' · ' + MA.get('inflation').value + '% inflation';
  }

  function syncAssumptionControls() {
    document.querySelectorAll('.ev-basis-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-basis') === PRICE_BASIS);
    });
    document.querySelectorAll('.ev-dollars-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-dollars') === RT_DOLLARS);
    });
    document.querySelectorAll('[data-incbasis]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-incbasis') === SCENARIO.incomeBasis);
    });
    document.querySelectorAll('[data-grad="years"] .seg-btn').forEach(function (b) {
      b.classList.toggle('is-active', parseInt(b.getAttribute('data-years'), 10) === SCENARIO.yearsInRetirement);
    });
    ['inflation', 'btcGrowthModel'].forEach(function (dim) {
      var cur = MA.get(dim).preset;
      document.querySelectorAll('[data-dim="' + dim + '"] .seg-btn').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-preset') === cur);
      });
    });
    // Live inflation rate on the real-dollars button, flagship pattern.
    var infl = MA.get('inflation').value;
    document.querySelectorAll('.ev-dollars-btn[data-dollars="real"] .seg-btn-sub').forEach(function (el) {
      el.textContent = infl + '%';
    });
    // Live basis labels with the multiple, flagship pattern.
    var r = currentRatio();
    document.querySelectorAll('.ev-basis-btn[data-basis="trend"] .ev-basis-text').forEach(function (el) {
      el.textContent = 'Reverts to trend (1.0×)';
    });
    document.querySelectorAll('.ev-basis-btn[data-basis="current"] .ev-basis-text').forEach(function (el) {
      el.textContent = 'Today’s ' + basisPhrase(r) + ' to trend persists (' + r.toFixed(2) + '×)';
    });
    var sum = document.getElementById('evAssumpSummary');
    if (sum) sum.textContent = assumptionsSummary();
  }

  function wireAssumptions() {
    var toggle = document.getElementById('evAssumpToggle');
    var body   = document.getElementById('evAssumpBody');
    if (toggle && body) {
      toggle.addEventListener('click', function () {
        var open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        body.hidden = open;
      });
    }

    document.querySelectorAll('.ev-basis-btn').forEach(function (b) {
      b.addEventListener('click', function (e) {
        if (e.target.closest('.help-tip')) return;
        PRICE_BASIS = b.getAttribute('data-basis');
        syncAssumptionControls(); scheduleRender(); scheduleUrlSync();
      });
    });
    document.querySelectorAll('.ev-dollars-btn').forEach(function (b) {
      b.addEventListener('click', function (e) {
        if (e.target.closest('.help-tip')) return;
        RT_DOLLARS = b.getAttribute('data-dollars');
        syncAssumptionControls(); scheduleRender(); scheduleUrlSync();
      });
    });
    document.querySelectorAll('[data-incbasis]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        if (e.target.closest('.help-tip')) return;
        SCENARIO.incomeBasis = b.getAttribute('data-incbasis');
        syncAssumptionControls(); scheduleRender(); scheduleUrlSync();
      });
    });
    ['inflation', 'btcGrowthModel'].forEach(function (dim) {
      document.querySelectorAll('[data-dim="' + dim + '"] .seg-btn').forEach(function (b) {
        b.addEventListener('click', function (e) {
          if (e.target.closest('.help-tip')) return;
          MA.set(dim, b.getAttribute('data-preset'));
        });
      });
    });
    // Canonical assumptions are sitewide-sticky; re-render on any change,
    // including one made in another tab.
    MA.subscribe(function () { syncAssumptionControls(); scheduleRender(); });
  }

  /* ═══════════════════════════════════════════════════════════
     VERIFY THE MATH (§5.6) — flagship audit renderer
  ═══════════════════════════════════════════════════════════ */

  function rtPhaseLabel(phase) {
    return phase === 'accum' ? 'Hold'
         : phase === 'retire' ? 'Retire'
         : phase === 'draw'   ? 'Draw down'
         : '—';
  }

  function scenarioSummaryHtml() {
    return 'Your scenario: <strong>' + formatBtc(SCENARIO.btcStack) + ' BTC</strong>'
      + ', retiring in <strong>' + SCENARIO.retirementYear + '</strong>'
      + ', drawing <strong>' + formatCurrencyShort(SCENARIO.targetIncomeUSD) + '/yr</strong>'
      + ' · ' + SCENARIO.yearsInRetirement + ' yrs in retirement.'
      + ' Price basis: ' + basisLabel(PRICE_BASIS) + '.'
      + ' Dollars: ' + (RT_DOLLARS === 'real' ? 'real (today’s, ' + MA.get('inflation').value + '% infl)' : 'nominal (future)') + '.'
      + ' Income target: ' + (SCENARIO.incomeBasis === 'fixed' ? 'same every year' : 'rises with inflation') + '.';
  }

  var LAST_PROJ = null;

  function renderVerifyTable(proj) {
    LAST_PROJ = proj;
    var tbody = document.getElementById('evVerifyRows');
    if (!tbody) return;
    var inflationPct = MA.get('inflation').value;
    var rows = proj.btcPoints || [];
    var depletionYear = proj.depletionYear;
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var isDeplete = depletionYear != null && r.x >= depletionYear;
      var rowCls = r.phase === 'retire' ? ' class="rt-row-retire"' : (isDeplete ? ' class="rt-row-deplete"' : '');
      var phaseCls = r.phase === 'accum' ? 'rt-phase-accum' : (r.phase === 'draw' ? 'rt-phase-draw' : '');
      var held = r.btc != null ? (r.btc + (r.btcSold || 0) - (r.dcaAdded || 0)) : null;
      html += '<tr' + rowCls + '>'
        + '<td>' + r.x + '</td>'
        + '<td class="' + phaseCls + '">' + rtPhaseLabel(r.phase) + '</td>'
        + '<td class="rt-num">' + (r.price   != null ? formatCurrencyShort(r.price) : '—') + '</td>'
        + '<td class="rt-num">' + (held      != null ? held.toFixed(2) : '—') + '</td>'
        + '<td class="rt-num">' + (r.usd     != null ? formatCurrencyShort(rtDollars(r.usd, r.x, inflationPct)) : '—') + '</td>'
        + '<td class="rt-num">' + (r.income  != null ? formatCurrencyShort(rtDollars(r.income, r.x, inflationPct)) : '—') + '</td>'
        + '<td class="rt-num">' + (r.btcSold != null ? r.btcSold.toFixed(3) : '—') + '</td>'
        + '<td class="rt-num">' + (r.btc     != null ? r.btc.toFixed(2) : '—') + '</td>'
        + '</tr>';
    }
    tbody.innerHTML = html;

    var sum = document.getElementById('evVerifySummary');
    if (sum) sum.innerHTML = scenarioSummaryHtml();

    var incEl = document.getElementById('evIncomeNote');
    if (incEl) {
      incEl.textContent = (SCENARIO.incomeBasis === 'fixed')
        ? 'Income drawn is flat here because your $ target is treated as the same raw dollars every year; in real (today’s $) mode it shrinks as inflation erodes it. To treat your target as today’s purchasing power instead, switch “Interpret my retirement income as” to “Rises with inflation” on the assumptions card.'
        : 'Income drawn rises in nominal mode because your $ target is treated as today’s dollars — it takes more future dollars each year to buy the same goods; in real mode it stays flat at your target. To keep the same raw dollars every year instead, switch “Interpret my retirement income as” to “Same every year” on the assumptions card.';
    }
  }

  function buildCsv(proj) {
    var s = SCENARIO;
    var growth = MA.get('btcGrowthModel');
    var inflation = MA.get('inflation');
    var lines = [];
    lines.push('# Last Coin Standing — Bitcoin Escape Velocity');
    lines.push('# Bitcoin stack,' + s.btcStack + ' BTC');
    lines.push('# Retirement year,' + s.retirementYear);
    lines.push('# Target annual income,' + s.targetIncomeUSD);
    lines.push('# Years in retirement,' + s.yearsInRetirement);
    lines.push('# Growth model,' + growth.preset);
    lines.push('# Inflation,' + inflation.value + '%');
    lines.push('# Price assumption,' + basisLabel(PRICE_BASIS));
    lines.push('# Dollar basis,' + (RT_DOLLARS === 'real' ? 'real (today’s dollars, ' + inflation.value + '% inflation)' : 'nominal (future dollars)'));
    lines.push('# Income target basis,' + (s.incomeBasis === 'fixed' ? 'same every year' : 'rises with inflation'));
    lines.push('# Live scenario URL,' + window.location.href);
    lines.push('');
    lines.push('Year,Phase,BTC price (nominal),Starting BTC,Stack value USD,Income drawn USD,BTC sold,BTC left');
    (proj.btcPoints || []).forEach(function (r) {
      var heldStart = r.btc != null ? (r.btc + (r.btcSold || 0) - (r.dcaAdded || 0)) : null;
      var usdShown = rtDollars(r.usd, r.x, inflation.value);
      var incomeShown = rtDollars(r.income, r.x, inflation.value);
      lines.push([r.x, r.phase,
        r.price != null ? Math.round(r.price) : '',
        heldStart != null ? heldStart.toFixed(4) : '',
        usdShown != null ? Math.round(usdShown) : '',
        incomeShown != null ? Math.round(incomeShown) : '',
        r.btcSold != null ? r.btcSold.toFixed(6) : '',
        r.btc != null ? r.btc.toFixed(4) : ''
      ].join(','));
    });
    return lines.join('\n');
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function wireVerify() {
    var btn = document.getElementById('evVerifyToggle');
    var body = document.getElementById('evVerifyBody');
    if (btn && body) {
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        body.hidden = open;
      });
    }
    var csv = document.getElementById('evCsvBtn');
    if (!csv) return;
    var originalHtml = csv.innerHTML;
    csv.addEventListener('click', function () {
      if (!LAST_PROJ) return;
      var text = buildCsv(LAST_PROJ);
      var restore = function () {
        csv.classList.add('copied');
        csv.textContent = 'Copied ✓';
        setTimeout(function () { csv.classList.remove('copied'); csv.innerHTML = originalHtml; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(restore).catch(function () { fallbackCopy(text); restore(); });
      } else { fallbackCopy(text); restore(); }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     URL PARAMS (§6.3)
     Flagship names so a scenario carries across the retirement family,
     plus this page's own gradation and display params.
  ═══════════════════════════════════════════════════════════ */

  var URL_MAP = {
    stack:  { key: 'btcStack',          isInt: false, decimals: 2 },
    retire: { key: 'retirementYear',    isInt: true },
    income: { key: 'targetIncomeUSD',   isInt: true },
    years:  { key: 'yearsInRetirement', isInt: true }
  };
  var DEFAULTS = JSON.parse(JSON.stringify(SCENARIO));
  var GRAD_DEFAULTS = JSON.parse(JSON.stringify(GRAD));

  function readUrlParams() {
    if (!window.URLSearchParams) return;
    var params = new URLSearchParams(window.location.search);
    Object.keys(URL_MAP).forEach(function (p) {
      if (!params.has(p)) return;
      var num = parseFloat(params.get(p));
      if (!isFinite(num)) return;
      var entry = URL_MAP[p];
      if (entry.key === 'yearsInRetirement') { SCENARIO.yearsInRetirement = Math.round(clamp(num, 5, 60)); return; }
      setScenarioValue(entry.key, num);
    });
    if (params.has('incbasis')) {
      var ib = params.get('incbasis');
      if (ib === 'today' || ib === 'fixed') SCENARIO.incomeBasis = ib;
    }
    if (params.has('basis')) {
      var pb = params.get('basis');
      if (pb === 'trend' || pb === 'current') PRICE_BASIS = pb;
    }
    if (params.has('dollars')) {
      var d = params.get('dollars');
      if (d === 'real' || d === 'nominal') RT_DOLLARS = d;
    }
    ['btcstep', 'incstep'].forEach(function (p) {
      if (!params.has(p)) return;
      var n = parseFloat(params.get(p));
      var target = (p === 'btcstep') ? 'btcStep' : 'incStep';
      if (GRAD_STEPS[target].indexOf(n) !== -1) GRAD[target] = n;
    });
  }

  function syncUrl() {
    if (!window.URLSearchParams || !window.history || !window.history.replaceState) return;
    var params = new URLSearchParams(window.location.search);
    Object.keys(URL_MAP).forEach(function (p) {
      var entry = URL_MAP[p];
      var val = SCENARIO[entry.key], def = DEFAULTS[entry.key];
      var rounded = entry.isInt ? Math.round(val) : Math.round(val * 100) / 100;
      if (rounded === def) params.delete(p);
      else params.set(p, entry.isInt ? String(rounded) : rounded.toFixed(entry.decimals || 2));
    });
    if (SCENARIO.incomeBasis !== DEFAULTS.incomeBasis) params.set('incbasis', SCENARIO.incomeBasis); else params.delete('incbasis');
    if (PRICE_BASIS !== 'trend') params.set('basis', PRICE_BASIS); else params.delete('basis');
    if (RT_DOLLARS !== 'real') params.set('dollars', RT_DOLLARS); else params.delete('dollars');
    if (GRAD.btcStep !== GRAD_DEFAULTS.btcStep) params.set('btcstep', String(GRAD.btcStep)); else params.delete('btcstep');
    if (GRAD.incStep !== GRAD_DEFAULTS.incStep) params.set('incstep', String(GRAD.incStep)); else params.delete('incstep');
    var qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
  }
  var _urlTimer = null;
  function scheduleUrlSync() {
    if (_urlTimer) clearTimeout(_urlTimer);
    _urlTimer = setTimeout(syncUrl, 220);
  }

  /* ─── Session stickiness (#11).
         sessionStorage ONLY. The stack is position data: how much bitcoin a
         reader holds is the single most sensitive number they will type on
         this site, and it must not outlive the tab. sessionStorage dies with
         the tab; localStorage would not. Nothing on this page writes the
         plan to localStorage — the only localStorage this page touches is
         ModelingAssumptions (inflation, growth model), which holds no
         position data.
         Load precedence: URL params > sessionStorage > defaults. ─── */
  var SESSION_KEY = 'lcs.ev.plan';

  function saveSession() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        stack:  SCENARIO.btcStack,
        income: SCENARIO.targetIncomeUSD,
        retire: SCENARIO.retirementYear
      }));
    } catch (e) { /* private mode — stickiness is a convenience, not a requirement */ }
  }

  function loadSession() {
    var raw;
    try { raw = sessionStorage.getItem(SESSION_KEY); } catch (e) { return; }
    if (!raw) return;
    var o;
    try { o = JSON.parse(raw); } catch (e) { return; }
    if (!o || typeof o !== 'object') return;
    if (isFinite(o.stack))  setScenarioValue('btcStack', o.stack);
    if (isFinite(o.income)) setScenarioValue('targetIncomeUSD', o.income);
    if (isFinite(o.retire)) setScenarioValue('retirementYear', o.retire);
  }

  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  // Reset (#10) — the three plan inputs only. Assumptions are sitewide-sticky
  // and deliberately survive: a reader who set 8% inflation meant it.
  function resetPlanDefaults() {
    SCENARIO.btcStack        = DEFAULTS.btcStack;
    SCENARIO.targetIncomeUSD = DEFAULTS.targetIncomeUSD;
    SCENARIO.retirementYear  = DEFAULTS.retirementYear;
    clearSession();
    syncSteppers(); scheduleRender(); scheduleUrlSync();
  }

  // Cross-link to the flagship's full audit view carries the live scenario.
  function updateFlagshipLink() {
    var a = document.getElementById('evFlagshipLink');
    if (!a || !window.URLSearchParams) return;
    var p = new URLSearchParams();
    p.set('stack', SCENARIO.btcStack.toFixed(2));
    p.set('retire', String(SCENARIO.retirementYear));
    p.set('income', String(Math.round(SCENARIO.targetIncomeUSD)));
    p.set('years', String(SCENARIO.yearsInRetirement));
    if (SCENARIO.incomeBasis !== 'today') p.set('incbasis', SCENARIO.incomeBasis);
    a.href = '/the-bitcoin-retirement.html?' + p.toString();
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */

  var _renderTimer = null;
  function scheduleRender() {
    if (_renderTimer) return;
    _renderTimer = setTimeout(function () { _renderTimer = null; render(); }, 30);
  }

  function render() {
    var inflationPct = MA.get('inflation').value;
    var otherBasis = (PRICE_BASIS === 'trend') ? 'current' : 'trend';

    var projSel   = projectForBasis(SCENARIO, PRICE_BASIS);
    var projOther = projectForBasis(SCENARIO, otherBasis);
    var vSel   = computeVerdict(projSel, SCENARIO, inflationPct);
    var vOther = computeVerdict(projOther, SCENARIO, inflationPct);

    renderVerdict(vSel, vOther, PRICE_BASIS, otherBasis);
    renderThreshold(vSel, PRICE_BASIS);
    renderStrip(vSel, PRICE_BASIS);
    renderVerifyTable(projSel);
    syncAssumptionControls();
    updateFlagshipLink();
  }

  /* ═══════════════════════════════════════════════════════════
     PARITY QA (§6.1) — required by the build prompt.

     The two pages must never disagree about whether a scenario escapes.
     computeEscapeVelocityFlagship() below is the flagship's function
     copied verbatim from the-bitcoin-retirement.js; the assertion runs a
     shared scenario vector through both and checks:

       1. this page's `deplete` state  <=>  flagship `achieved === false`
       2. depletion years are identical
       3. when this page says `escape`, the real residual really is
          non-negative for every year from the escape year onward, and
          negative in the year before it (when there is one)
       4. the DOM bindings actually reflect the computed verdict — the
          spectrum marker's left offset and its .escape class, and the
          verdict sentence's year. Verifying the data arrays is not
          verifying what rendered (drift-chart lesson).

     Note on (1): the flagship's `achieved` means "did not deplete inside
     the window", which is strictly weaker than this page's escape test.
     A scenario can survive the horizon while shrinking every year — this
     page calls that `shrink`. The assertion therefore checks the
     deplete/not-deplete axis, which is where the two pages could
     genuinely contradict each other, and reports the `shrink` band
     separately rather than pretending it does not exist.
  ═══════════════════════════════════════════════════════════ */

  function computeEscapeVelocityFlagship(proj, scenario, inflationPct) {
    if (proj.depletionYear !== null) {
      var depletedAt = Math.max(0, proj.depletionYear - scenario.retirementYear);
      var pos = 0.5 * (depletedAt / Math.max(1, scenario.yearsInRetirement));
      return { position: Math.max(0.02, Math.min(0.50, pos)), achieved: false };
    }
    var startYear = (new Date()).getFullYear();
    var infl = inflationPct / 100;
    var firstPoint = null;
    for (var i = 0; i < proj.points.length; i++) {
      if (proj.points[i].y !== null && proj.points[i].y > 0) { firstPoint = proj.points[i]; break; }
    }
    var lastPoint = proj.points[proj.points.length - 1];
    if (!firstPoint || !lastPoint || lastPoint.y === null || lastPoint.y <= 0) {
      return { position: 0.55, achieved: true };
    }
    var realFirst = firstPoint.y / Math.pow(1 + infl, firstPoint.x - startYear);
    var realLast  = lastPoint.y  / Math.pow(1 + infl, lastPoint.x  - startYear);
    var ratio = realLast / realFirst;
    var p = 0.5 + 0.5 * (Math.tanh(Math.log(Math.max(0.05, ratio))) + 1) / 2;
    return { position: Math.min(0.98, Math.max(0.52, p)), achieved: true };
  }

  var QA_VECTOR = [
    { btcStack: 0.25, targetIncomeUSD: 60000,  retirementYear: 2035, yearsInRetirement: 30, incomeBasis: 'today' },
    { btcStack: 0.05, targetIncomeUSD: 60000,  retirementYear: 2030, yearsInRetirement: 30, incomeBasis: 'today' },
    { btcStack: 0.60, targetIncomeUSD: 60000,  retirementYear: 2035, yearsInRetirement: 30, incomeBasis: 'today' },
    { btcStack: 1.00, targetIncomeUSD: 60000,  retirementYear: 2035, yearsInRetirement: 30, incomeBasis: 'today' },
    { btcStack: 3.00, targetIncomeUSD: 100000, retirementYear: 2040, yearsInRetirement: 40, incomeBasis: 'today' },
    { btcStack: 0.25, targetIncomeUSD: 60000,  retirementYear: 2045, yearsInRetirement: 30, incomeBasis: 'today' },
    { btcStack: 0.20, targetIncomeUSD: 60000,  retirementYear: 2035, yearsInRetirement: 30, incomeBasis: 'fixed' },
    { btcStack: 2.00, targetIncomeUSD: 250000, retirementYear: 2050, yearsInRetirement: 20, incomeBasis: 'today' },
    { btcStack: 0.01, targetIncomeUSD: 500000, retirementYear: 2026, yearsInRetirement: 30, incomeBasis: 'today' },
    { btcStack: 21.0, targetIncomeUSD: 20000,  retirementYear: 2055, yearsInRetirement: 40, incomeBasis: 'today' }
  ];

  window.evParityQA = function () {
    var infl = MA.get('inflation').value;
    var failures = [], rows = [];

    ['trend', 'current'].forEach(function (basis) {
      QA_VECTOR.forEach(function (sc, idx) {
        var proj = projectForBasis(sc, basis);
        var mine = computeVerdict(proj, sc, infl);
        var flag = computeEscapeVelocityFlagship(proj, sc, infl);
        var tag = basis + '#' + idx;

        // (1) deplete <=> flagship not achieved
        if ((mine.state === 'deplete') !== (flag.achieved === false)) {
          failures.push(tag + ': deplete/achieved disagree (mine=' + mine.state + ', flagship achieved=' + flag.achieved + ')');
        }
        // (2) depletion years identical
        if (mine.depletionYear !== proj.depletionYear) {
          failures.push(tag + ': depletion year mismatch (' + mine.depletionYear + ' vs ' + proj.depletionYear + ')');
        }
        // (3) the escape year really is the permanent crossing
        if (mine.state === 'escape') {
          mine.residuals.forEach(function (r) {
            if (r.year >= mine.escapeYear && r.value < -EPS) {
              failures.push(tag + ': residual negative at ' + r.year + ' but escape claimed from ' + mine.escapeYear);
            }
          });
          var prior = null;
          mine.residuals.forEach(function (r) { if (r.year === mine.escapeYear - 1) prior = r; });
          if (prior && prior.value >= -EPS) {
            failures.push(tag + ': escape year ' + mine.escapeYear + ' is not the FIRST permanent crossing');
          }
        }
        // (5) The shrink extension (#6) is new OUTPUT, not a change to the
        // escape/deplete boundary. Assert that directly: recomputing the
        // verdict after running the extended loop must return the identical
        // classification, and any extended depletion year must fall strictly
        // beyond the original horizon — never inside the window the verdict
        // already answered for.
        var ext = extendedDepletion(sc, basis);
        var recheck = computeVerdict(projectForBasis(sc, basis), sc, infl);
        if (recheck.state !== mine.state
            || recheck.escapeYear !== mine.escapeYear
            || recheck.depletionYear !== mine.depletionYear) {
          failures.push(tag + ': extension altered the boundary classification ('
            + mine.state + ' → ' + recheck.state + ')');
        }
        if (ext !== null && mine.state !== 'deplete' && ext <= mine.horizonYear) {
          failures.push(tag + ': extended depletion ' + ext + ' falls inside the horizon '
            + mine.horizonYear + ', which the verdict already cleared');
        }
        if (mine.state === 'deplete' && ext !== mine.depletionYear) {
          failures.push(tag + ': extended loop moved a depletion year (' + mine.depletionYear + ' → ' + ext + ')');
        }

        // (6) THE LINE IS THE FLIP POINT (round 2 #7). The sliders place their
        // ticks with lineFor() and the text quotes lineFor(), so they cannot
        // disagree by construction — but the line itself still has to be a
        // real boundary. For each axis: escape AT the reported line, and NOT
        // escape one increment on the failing side of it. This is what makes
        // dragging a thumb onto a tick actually flip the verdict.
        ['stack', 'income', 'retire'].forEach(function (axis) {
          var ln = lineFor(axis, sc, basis);
          if (ln.value === null || ln.bound) return;   // out of range is reported, not asserted
          var keyName = AXES[axis].key;
          function stateAtValue(v) {
            var o = {}; o[keyName] = v;
            var s2 = cloneWith(o, sc);
            return computeVerdict(projectForBasis(s2, basis, true), s2, infl).state;
          }
          if (stateAtValue(ln.value) !== 'escape') {
            failures.push(tag + '/' + axis + ': reported line ' + ln.value + ' does not itself escape');
          }
          var justInside = (axis === 'stack') ? ln.value - 0.01
                         : (axis === 'income') ? ln.value + 100
                         : ln.value - 1;
          var lim = LIMITS[keyName];
          if (justInside >= lim.min && justInside <= lim.max && stateAtValue(justInside) === 'escape') {
            failures.push(tag + '/' + axis + ': ' + justInside + ' also escapes — ' + ln.value + ' is not the boundary');
          }
        });

        rows.push({ basis: basis, scenario: idx, state: mine.state,
                    escapeYear: mine.escapeYear, depletionYear: mine.depletionYear,
                    extendedDepletion: ext, flagshipAchieved: flag.achieved });
      });
    });

    // (4) DOM bindings reflect the live verdict — not just the arrays.
    var liveProj = projectForBasis(SCENARIO, PRICE_BASIS);
    var live = computeVerdict(liveProj, SCENARIO, infl);
    var marker = document.getElementById('evSpectrumMarker');
    var sentence = document.getElementById('evVerdictSentence');
    if (marker) {
      // Compare parsed numbers, not strings: the browser normalises
      // `left: 98.00%` to `98%`, which a string match reads as drift.
      var expected = spectrumPosition(live, SCENARIO) * 100;
      var actual = parseFloat(marker.style.left);
      if (!isFinite(actual) || Math.abs(actual - expected) > 0.01) {
        failures.push('DOM: spectrum marker at ' + marker.style.left + ', expected ' + expected.toFixed(2) + '%');
      }
      if (marker.classList.contains('escape') !== (live.state === 'escape')) failures.push('DOM: spectrum .escape class does not match verdict state ' + live.state);
    }
    if (sentence) {
      var needle = live.state === 'escape' ? String(live.escapeYear)
                 : live.state === 'deplete' ? String(live.depletionYear)
                 : String(live.horizonYear);
      if (sentence.textContent.indexOf(needle) === -1) failures.push('DOM: verdict sentence does not contain ' + needle);
    }

    var shrinkCount = rows.filter(function (r) { return r.state === 'shrink'; }).length;
    var result = { pass: failures.length === 0, failures: failures, rows: rows,
                   shrinkBandCount: shrinkCount, vectors: QA_VECTOR.length * 2 };
    if (result.pass) {
      console.log('%cevParityQA PASS', 'color:#7fc47f;font-weight:600',
        result.vectors + ' vectors, ' + shrinkCount + ' in the survives-but-shrinking band');
    } else {
      console.error('evParityQA FAIL', failures);
    }
    console.table(rows);
    return result;
  };

  /* ═══════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════ */

  /* ─── Live BTC price. Seeded to the latest monthly PL sample so the page
         renders sensibly before the fetch resolves; the gap-persists basis
         and the above-trend guard both key off it, so a resolved fetch
         re-renders. Same hook the flagship uses. ─── */
  function fetchLiveBtcPrice() {
    if (typeof fetchTodayPrice !== 'function') return;
    fetchTodayPrice(function (price) {
      if (!isFinite(price) || price <= 0) return;
      liveBtcPrice = price;
      LINE_KEY = null;          // crossings depend on the ratio under the gap-persists basis
      syncAssumptionControls();
      scheduleRender();
    });
  }

  /* ═══════════════════════════════════════════════════════════
     DOCKED STEPPER BAR (#12)

     Deliberately `position: fixed`, not `position: sticky`. Sticky is the
     exact thing that silently broke on money-trees: it depends on every
     ancestor's overflow and on offsets that go stale, and it fails by
     quietly doing nothing. Fixed has no ancestor dependency at all. The
     top offset is MEASURED from the live nav and ribbon rather than
     hardcoded, and re-measured on resize, so the bar cannot drift under
     the chrome the way a hardcoded offset does.

     Desktop only. At 375px three values plus six 44px arrows cannot fit in
     one legible row, so mobile gets the fallback the brief specifies: a
     slim repeat of the steppers immediately before the year-by-year
     section (see `.ev-steppers-repeat` in the template). CSS decides which
     of the two is visible; both drive the same state through the same
     `.ev-stepper` wiring.
  ═══════════════════════════════════════════════════════════ */
  function measureDockOffset() {
    var top = 0;
    var nav = document.querySelector('.site-nav');
    if (nav) {
      var cs = getComputedStyle(nav);
      if (cs.position === 'sticky' || cs.position === 'fixed') top += nav.getBoundingClientRect().height;
    }
    var ribbon = document.querySelector('.channel-ribbon');
    if (ribbon) {
      var rs = getComputedStyle(ribbon);
      if (rs.position === 'sticky' || rs.position === 'fixed') top += ribbon.getBoundingClientRect().height;
    }
    document.documentElement.style.setProperty('--ev-dock-top', Math.round(top) + 'px');
  }

  function wireDock() {
    var dock = document.getElementById('evDock');
    var anchor = document.getElementById('inputs');
    if (!dock || !anchor) return;

    // Deliberately a scroll listener, not an IntersectionObserver. IO was the
    // first implementation and it failed exactly the way sticky fails: built
    // against a viewport that was not laid out yet, it fired once with
    // meaningless geometry and then never again, leaving the bar permanently
    // hidden with nothing in the console. A direct rect comparison has no root,
    // no thresholds and no construction-time state — it simply reads the truth
    // on every frame it is asked to. The offset is re-measured in the same
    // pass, so a nav that changes height (wrap, font load, zoom) cannot leave
    // the bar sitting at a stale offset.
    var ticking = false;
    function evaluate() {
      ticking = false;
      measureDockOffset();
      var top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ev-dock-top')) || 0;
      dock.classList.toggle('is-docked', anchor.getBoundingClientRect().bottom < top);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(evaluate);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Fonts land after first paint and change the nav's height; re-measure
    // when they do rather than trusting the first reading.
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(evaluate).catch(function () {});
    }
    evaluate();
  }

  /* ─── Year-by-year hover readout (#20).
         Delegated once at wire time rather than rebound on every render, and
         the hit target is the whole column — a reader hovering the empty space
         above a short bar still gets that year, which is the difference
         between a chart you can read and one you have to aim at. ─── */
  function wireStripHover() {
    var host = document.getElementById('evStrip');
    var tip = document.getElementById('evStripTip');
    if (!host || !tip) return;
    var current = null;

    host.addEventListener('mousemove', function (e) {
      var col = e.target.closest('.ev-strip-col');
      if (!col) { hide(); return; }
      if (col !== current) {
        if (current) current.classList.remove('is-hovered');
        current = col; col.classList.add('is-hovered');
        var year = col.getAttribute('data-year');
        var res = parseFloat(col.getAttribute('data-residual'));
        var sign = res >= 0 ? '+' : '−';
        tip.innerHTML = '<span class="ev-tip-year">' + year + '</span> &nbsp;'
          + '<span class="' + (res >= 0 ? 'ev-tip-pos' : 'ev-tip-neg') + '">' + sign
          + formatCurrencyShort(Math.abs(res)) + '</span> '
          + (res >= 0 ? 'more than spent' : 'short of spending');
        tip.hidden = false;
      }
      var hostRect = host.getBoundingClientRect();
      var colRect = col.getBoundingClientRect();
      tip.style.left = (colRect.left - hostRect.left + colRect.width / 2) + 'px';
      tip.style.top = Math.max(18, e.clientY - hostRect.top - 12) + 'px';
    });
    host.addEventListener('mouseleave', hide);
    function hide() {
      if (current) { current.classList.remove('is-hovered'); current = null; }
      tip.hidden = true;
    }
  }

  function wireReset() {
    var el = document.getElementById('evReset');
    if (!el) return;
    el.addEventListener('click', function (e) { e.preventDefault(); resetPlanDefaults(); });
  }

  function init() {
    // Precedence: URL params > sessionStorage > defaults (#11).
    loadSession();
    readUrlParams();
    // Reflect any URL-provided gradation into the segmented controls.
    document.querySelectorAll('.seg-control[data-grad]').forEach(function (group) {
      var which = group.getAttribute('data-grad');
      if (which === 'years') return;
      group.querySelectorAll('.seg-btn').forEach(function (b) {
        b.classList.toggle('is-active', parseFloat(b.getAttribute('data-step')) === GRAD[which]);
      });
    });
    wireSteppers();
    wireSliders();
    wireStripHover();
    wireAssumptions();
    wireVerify();
    wireReset();
    wireDock();
    syncSteppers();
    render();
    fetchLiveBtcPrice();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
