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
  var SCENARIO = {
    btcStack: 0.25,
    targetIncomeUSD: 60000,
    retirementYear: 2035,
    yearsInRetirement: 30,
    incomeBasis: 'today'   // 'today' = target is in today's dollars (default) | 'fixed' = same raw dollars every year
  };

  var LIMITS = {
    retirementYear:  { min: 2026, max: 2055 },
    btcStack:        { min: 0.01, max: 21 },
    targetIncomeUSD: { min: 20000, max: 500000 }
  };

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
    if (lastNegative >= horizonYear) { out.state = 'shrink'; return out; }
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
      syncSteppers(); scheduleRender(); scheduleUrlSync();
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
          if (isFinite(n) && setScenarioValue(key, n)) { scheduleRender(); scheduleUrlSync(); }
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

  function verdictSentence(v, basis) {
    var basisTail = '<span class="ev-verdict-tail">Checked every year through ' + v.horizonYear
      + ', ' + dollarWord() + ', with price ' + basisLabel(basis) + '.</span>';
    if (v.state === 'escape') {
      return 'On these inputs, the stack’s growth permanently exceeds spending from <strong>'
        + v.escapeYear + '</strong>.' + basisTail;
    }
    if (v.state === 'deplete') {
      return 'Never reaches escape velocity — the stack <strong>depletes in '
        + v.depletionYear + '</strong>.' + basisTail;
    }
    return 'Never reaches escape velocity — the stack lasts through <strong>'
      + v.horizonYear + '</strong> but loses ground every year. It does not run out; it runs down.'
      + basisTail;
  }

  function shortVerdict(v) {
    if (v.state === 'escape') return '<strong>' + v.escapeYear + '</strong>';
    if (v.state === 'deplete') return 'depletion in <strong>' + v.depletionYear + '</strong>';
    return '<strong>no escape</strong>, but no depletion either';
  }

  function renderVerdict(vSel, vOther, basis, otherBasis) {
    var sentEl = document.getElementById('evVerdictSentence');
    if (sentEl) sentEl.innerHTML = verdictSentence(vSel, basis);

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
          + '): ' + shortVerdict(vOther) + '.';
      } else {
        robEl.hidden = false;
        robEl.innerHTML = 'You are on the more conservative basis. The less conservative one ('
          + basisLabel(otherBasis) + ') says: ' + shortVerdict(vOther) + '.';
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

  function spectrumDetail(v, scenario) {
    if (v.state === 'deplete') {
      var n = Math.max(0, v.depletionYear - scenario.retirementYear);
      return 'Stack depletes ' + plural(n, 'year') + ' into retirement at this withdrawal.';
    }
    if (v.state === 'shrink') {
      return 'Stack outlives the horizon but never stops shrinking — it ends at '
        + (v.ratio * 100).toFixed(0) + '% of its real value at retirement.';
    }
    if (v.ratio >= 1.05) {
      return 'Stack grows ' + v.ratio.toFixed(1) + '× in real terms over the window — comfortably above escape velocity.';
    }
    if (v.ratio >= 0.85) {
      return 'Stack roughly maintains real value through the window — right at escape velocity.';
    }
    return 'Stack survives the window but loses some real value ('
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

  function cloneWith(over) {
    var s = {};
    for (var k in SCENARIO) if (Object.prototype.hasOwnProperty.call(SCENARIO, k)) s[k] = SCENARIO[k];
    for (var o in over) if (Object.prototype.hasOwnProperty.call(over, o)) s[o] = over[o];
    return s;
  }

  function statePhrase(v) {
    if (v.state === 'escape') return 'reaches escape velocity';
    if (v.state === 'shrink') return 'lasts to ' + v.horizonYear + ' but keeps shrinking';
    return 'depletes in ' + v.depletionYear;
  }

  var DELTA_ROWS = [
    { key: 'retirementYear',  dir: 1,  label: function () { return 'Retire one year later'; } },
    { key: 'targetIncomeUSD', dir: -1, label: function () { return 'Draw ' + formatCurrencyShort(GRAD.incStep) + ' less per year'; } },
    { key: 'btcStack',        dir: 1,  label: function () { return 'Add ' + formatStep(GRAD.btcStep) + ' BTC'; } }
  ];

  function renderDeltas(baseVerdict, basis) {
    var host = document.getElementById('evDeltas');
    if (!host) return;
    var inflationPct = MA.get('inflation').value;
    var baseProj = projectForBasis(SCENARIO, basis);
    var baseAtHorizon = realValueAtYear(baseProj, baseVerdict.horizonYear, inflationPct);
    var html = '';

    DELTA_ROWS.forEach(function (row) {
      var lim = LIMITS[row.key];
      var next = SCENARIO[row.key] + row.dir * stepFor(row.key);
      var available = (next >= lim.min - 1e-9) && (next <= lim.max + 1e-9);
      var label = row.label();

      if (!available) {
        html += '<button type="button" class="ev-delta" disabled data-key="' + row.key + '" data-dir="' + row.dir + '">'
          + '<span class="ev-delta-move">' + label + '</span>'
          + '<span class="ev-delta-body">Already at the end of this stepper’s range.</span>'
          + '<span class="ev-delta-apply">—</span></button>';
        return;
      }

      var nudged = cloneWith((function () { var o = {}; o[row.key] = next; return o; })());
      var nudgedProj = projectForBasis(nudged, basis);
      var nv = computeVerdict(nudgedProj, nudged, inflationPct);
      var nudgedAtHorizon = realValueAtYear(nudgedProj, baseVerdict.horizonYear, inflationPct);

      // Delta-priority rule inherited from the flagship's compare panel:
      // an escape-velocity flip is the headline of its row, ahead of
      // year shifts, ahead of stack value.
      var lead;
      if (nv.state !== baseVerdict.state) {
        lead = '<span class="ev-delta-flip">Now ' + statePhrase(nv) + '</span>';
      } else if (nv.state === 'escape' && nv.escapeYear !== baseVerdict.escapeYear) {
        var dy = baseVerdict.escapeYear - nv.escapeYear;
        lead = 'escape arrives <strong>' + plural(Math.abs(dy), 'year') + (dy > 0 ? ' earlier' : ' later') + '</strong>';
      } else if (nv.state === 'deplete' && nv.depletionYear !== baseVerdict.depletionYear) {
        var dd = nv.depletionYear - baseVerdict.depletionYear;
        lead = 'depletion moves <strong>' + plural(Math.abs(dd), 'year') + (dd > 0 ? ' later' : ' earlier') + '</strong>';
      } else {
        lead = 'verdict unchanged';
      }

      // The value-at-horizon clause is dropped when both scenarios are
      // already empty by then — "+$0" on every row is noise, not honesty.
      var body = lead;
      if (baseAtHorizon != null && nudgedAtHorizon != null
          && (baseAtHorizon > 0.5 || nudgedAtHorizon > 0.5)) {
        var dv = nudgedAtHorizon - baseAtHorizon;
        var cls = dv >= 0 ? 'ev-delta-pos' : 'ev-delta-neg';
        var sign = dv >= 0 ? '+' : '−';
        body += '<span class="ev-delta-sep">·</span>value at ' + baseVerdict.horizonYear
          + ' <strong class="' + cls + '">' + sign + formatCurrencyShort(Math.abs(dv)) + '</strong>';
      }

      html += '<button type="button" class="ev-delta" data-key="' + row.key + '" data-dir="' + row.dir + '">'
        + '<span class="ev-delta-move">' + label + '</span>'
        + '<span class="ev-delta-body">' + body + '</span>'
        + '<span class="ev-delta-apply">Apply ›</span></button>';
    });

    host.innerHTML = html;
    // Deltas are computed from the today's-dollar series only — a
    // cross-scenario delta is never taken from nominal figures (flagship
    // canon, carried over verbatim). realValueAtYear enforces that
    // regardless of the display toggle.
  }

  function wireDeltaApply() {
    var host = document.getElementById('evDeltas');
    if (!host) return;
    host.addEventListener('click', function (e) {
      var btn = e.target.closest('.ev-delta');
      if (!btn || btn.disabled) return;
      nudge(btn.getAttribute('data-key'), parseInt(btn.getAttribute('data-dir'), 10));
    });
  }

  /* ─── Where the line is.
         Under this page's escape-year definition the escape YEAR is, for
         almost every input combination, the first drawdown year or never
         (verified by sweep at build time — see the build notes). The
         quantity that actually varies, and the one the page's thesis
         promises, is the crossing value on each axis. Computed against
         the same engine and the same price basis as the verdict. ─── */
  function escapesWith(over) {
    var s = cloneWith(over);
    var infl = MA.get('inflation').value;
    return computeVerdict(projectForBasis(s, PRICE_BASIS, true), s, infl).state === 'escape';
  }

  function crossingStack() {
    var lim = LIMITS.btcStack;
    if (escapesWith({ btcStack: lim.min })) return { value: lim.min, bound: 'below' };
    if (!escapesWith({ btcStack: lim.max })) return { value: null, bound: 'above' };
    var lo = lim.min, hi = lim.max;
    for (var i = 0; i < 22; i++) {
      var mid = (lo + hi) / 2;
      if (escapesWith({ btcStack: mid })) hi = mid; else lo = mid;
    }
    return { value: Math.ceil(hi * 100) / 100, bound: null };   // round UP: the stated value still escapes
  }

  function crossingIncome() {
    var lim = LIMITS.targetIncomeUSD;
    if (escapesWith({ targetIncomeUSD: lim.max })) return { value: lim.max, bound: 'above' };
    if (!escapesWith({ targetIncomeUSD: lim.min })) return { value: null, bound: 'below' };
    var lo = lim.min, hi = lim.max;
    for (var i = 0; i < 22; i++) {
      var mid = (lo + hi) / 2;
      if (escapesWith({ targetIncomeUSD: mid })) lo = mid; else hi = mid;
    }
    return { value: Math.floor(lo / 100) * 100, bound: null };  // round DOWN: the stated value still escapes
  }

  // NOT bisected. The required stack falls with a later retirement year and
  // then rises again once the horizon reaches the low-real-growth end of
  // the Power Law, so escape is not monotone in this input. Scan.
  function crossingRetireYear() {
    var lim = LIMITS.retirementYear;
    for (var y = lim.min; y <= lim.max; y++) {
      if (escapesWith({ retirementYear: y })) return { value: y, bound: null };
    }
    return { value: null, bound: 'above' };
  }

  var LINE_KEY = null;
  var LINE_CACHE = null;
  function crossings() {
    // The three crossings are ~75 projections. They depend only on the
    // scenario, the basis, and the canonical assumptions — not on the
    // display toggle — so a key check keeps a nominal/real flip from
    // re-running them.
    var key = [SCENARIO.btcStack, SCENARIO.targetIncomeUSD, SCENARIO.retirementYear,
               SCENARIO.yearsInRetirement, SCENARIO.incomeBasis, PRICE_BASIS,
               MA.get('inflation').value, MA.get('btcGrowthModel').preset,
               liveBtcPrice].join('|');
    if (key === LINE_KEY) return LINE_CACHE;
    LINE_KEY = key;
    LINE_CACHE = { stack: crossingStack(), income: crossingIncome(), retire: crossingRetireYear() };
    return LINE_CACHE;
  }

  function renderLine() {
    var host = document.getElementById('evLineRows');
    if (!host) return;
    var rows = [];
    var cross = crossings();

    var cs = cross.stack;
    if (cs.value === null) {
      rows.push({ html: 'No stack up to <strong>21 BTC</strong> crosses at this draw and this date.', past: false });
    } else {
      rows.push({
        html: 'Stack: the line is at <strong>' + formatBtc(cs.value) + ' BTC</strong>'
          + '<span class="ev-line-you"> — you have ' + formatBtc(SCENARIO.btcStack) + '.</span>',
        past: SCENARIO.btcStack >= cs.value
      });
    }

    var ci = cross.income;
    if (ci.value === null) {
      rows.push({ html: 'No draw down to <strong>' + formatCurrencyShort(LIMITS.targetIncomeUSD.min) + '</strong> crosses at this stack and this date.', past: false });
    } else {
      rows.push({
        html: 'Draw: the line is at <strong>' + formatUsdFull(ci.value) + '/yr</strong>'
          + '<span class="ev-line-you"> — you plan ' + formatUsdFull(SCENARIO.targetIncomeUSD) + '.</span>',
        past: SCENARIO.targetIncomeUSD <= ci.value
      });
    }

    var cy = cross.retire;
    if (cy.value === null) {
      rows.push({ html: 'No retirement year through <strong>' + LIMITS.retirementYear.max + '</strong> crosses at this stack and this draw.', past: false });
    } else {
      rows.push({
        html: 'Retirement year: the earliest that crosses is <strong>' + cy.value + '</strong>'
          + '<span class="ev-line-you"> — you plan ' + SCENARIO.retirementYear + '.</span>',
        past: SCENARIO.retirementYear >= cy.value
      });
    }

    host.innerHTML = rows.map(function (r) {
      return '<div class="ev-line-row' + (r.past ? ' is-past' : '') + '">' + r.html + '</div>';
    }).join('');
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
      html += '<div class="ev-strip-col" title="' + r.year + ': '
        + (r.value >= 0 ? '+' : '−') + formatCurrencyShort(Math.abs(r.value)) + ' real">'
        + mark + '<div class="ev-bar ' + cls + '" style="' + style + '"></div></div>';
    });

    host.innerHTML = '<div class="ev-strip-plot">'
      + '<div class="ev-strip-zero" style="bottom:' + zeroPct.toFixed(3) + '%"></div>'
      + html + '</div>';

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
        tail = 'Every bar is negative — the stack never outgrows the draw, it just does not run out before ' + v.horizonYear + '.';
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
    renderDeltas(vSel, PRICE_BASIS);
    renderLine();
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
        rows.push({ basis: basis, scenario: idx, state: mine.state,
                    escapeYear: mine.escapeYear, depletionYear: mine.depletionYear,
                    flagshipAchieved: flag.achieved });
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

  function init() {
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
    wireDeltaApply();
    wireAssumptions();
    wireVerify();
    syncSteppers();
    render();
    fetchLiveBtcPrice();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
