/* =============================================================
   The Bitcoin Retirement Stress Test — sequence-of-returns risk

   Reuses the retirement calculator's projection engine (the year-by-
   year sell-to-cover-income loop) and injects a TIMED price-path
   perturbation: a bear market that begins at a chosen year of
   retirement, falls to a chosen depth, and recovers along a chosen
   shape. The crash multiplies the trend PRICE only; the withdrawal
   math is untouched, so the same nominal income is now funded by
   selling MORE BTC at the depressed price. The lasting stack damage
   is emergent sequence-of-returns risk, not a special case.

   Honesty posture (opposite of Bull & Bear's): this tool risks being
   falsely reassuring. It must show failure plainly, default recovery
   to Historical (not Fast) with a prominent Weak option, and make no
   probability claims. It is a what-if, never a forecast.

   Baseline parity: the no-crash path uses the same shared
   ModelingAssumptions (inflation 6.5% m2-growth, Power Law trend by
   default) and the same math as /the-bitcoin-retirement, so the
   baseline projection matches that page for identical inputs.

   Reads PL_FLOOR/PL_CEIL/plPrice/GENESIS_TS from power-law-data.js,
   window.ModelingAssumptions, window.CalcHelpers.
   ============================================================= */
(function () {
  if (typeof plPrice !== 'function' || typeof GENESIS_TS === 'undefined') return;

  // ── Palette (retirement/house conventions) ──
  var C_TREND = 'rgba(224,148,34,0.30)', C_FLOOR = 'rgba(176,69,37,0.35)';
  var C_BASE = '#6db3d4', C_CRASH = '#e08a7a', MUTED = '#7a7367', DIM = '#9a9080';

  // ── Date / price helpers (copied from the retirement engine for parity) ──
  var GENESIS = new Date(GENESIS_TS * 1000);
  function daysSince(date) { return (date.getTime() - GENESIS.getTime()) / 86400000; }
  function plPriceAtDate(date) { return plPrice(daysSince(date)); }
  function dateForYear(year) { var t = new Date(); return new Date(year, t.getMonth(), t.getDate()); }
  function projPriceForGrowth(date, growthKey) {
    var trend = plPriceAtDate(date);
    if (growthKey === 'powerlaw-floor') return trend * PL_FLOOR;
    return trend; // 'powerlaw-trend' (default) and others use trend, matching the retirement engine
  }

  // ── Baseline scenario (mirror of the retirement SCENARIO shape) ──
  // v1.1 default: an EARLY-retirement scenario, because retirement year is the dominant
  // variable (the same plan passes or fails on when you retire) and the early retiree is
  // the audience. 5 BTC retiring 2030 on 175k/yr (today's $) is the tuned sweet spot,
  // verified against the live Power Law trend prices:
  //   - baseline (no crash) survives with a wide margin;
  //   - the default crash (-77% in year 1, HISTORICAL recovery) survives but takes a real
  //     bite out of the terminal stack;
  //   - flipping recovery to Weak (one tap) makes the SAME crash deplete the stack by 2034.
  // The lesson is not "a big stack is safe" (this one depletes if you retire early and the
  // recovery fails) and not "early retirement is dangerous" (the base case is comfortable).
  // The decisive levers are retirement year and withdrawal rate relative to stack.
  // Baseline PARITY is preserved for identical inputs (same math + shared assumptions);
  // only the cold-start defaults differ, which is the point of a stress test.
  var SCENARIO = {
    btcStack: 5,
    targetIncomeUSD: 175000,
    retirementYear: 2030,
    yearsInRetirement: 30,
    monthlyDcaUSD: 0,
    incomeBasis: 'today'   // 'today' = real target (inflate forward) | 'fixed' = fixed future nominal
  };

  // ── Crash defaults ──
  // Default to the historical -77% depth landing in YEAR 1 of retirement, with a
  // HISTORICAL (reliable-past) recovery: at the default plan this survives at a cost, and
  // switching recovery to Weak is the single tap that tips it into depletion.
  var CRASH = {
    depthPct: 0.77,          // historical worst-case depth (a selectable option, not a forecast)
    timingYear: 1,           // year OF retirement the crash begins (1 = first year)
    recoveryPreset: 'historical',
    troughLagYears: 1        // ~1 year peak->trough (Bull & Bear: 100+ days to bottom)
  };

  // ── Spending flexibility (v2 mitigation lever) ──
  // Cut withdrawals by FLEX% while the market is below its pre-crash level. The cut
  // window is derived from the PRICE PATH (crashMultiplier(y) < 1), NOT the stack's
  // underwater span (the stack recovers slower — coins sold cheap are gone — so
  // binding to it would overstate the mitigation). 0 = off; up to 50.
  var FLEX = 0;

  // Two-path chart view: 'full' (whole retirement) | 'crash' (zoom the crash window, so the
  // reader feels the trough years they would have to hold through).
  var CHART_FOCUS = 'full';

  // Recovery shapes + crash multiplier now from the shared module
  // (shared/crash-model.js — extracted from this page's + the allocation page's
  // identical copies). Historical is this page's default (see CRASH above).
  var RECOVERY = window.CrashModel.RECOVERY;

  // ── Shared assumptions (parity with the retirement page) ──
  function inflationPct() {
    try { return window.ModelingAssumptions.get('inflation').value; } catch (e) { return 6.5; }
  }
  function inflationLabel() {
    try { var a = window.ModelingAssumptions.get('inflation'); return a.value + '% (' + a.preset + ')'; } catch (e) { return '6.5%'; }
  }
  function growthKey() {
    try { return window.ModelingAssumptions.get('btcGrowthModel').preset; } catch (e) { return 'powerlaw-trend'; }
  }

  // ════════ CRASH MODEL — timed price-path multiplier (shared module) ════════
  var crashMultiplier = window.CrashModel.crashMultiplier;

  // Build a crash object from CRASH + a scenario's retirement year.
  function makeCrashFor(scn, timingYear) {
    var rec = RECOVERY[CRASH.recoveryPreset] || RECOVERY.historical;
    return {
      crashYear: scn.retirementYear + (timingYear - 1), // year 1 of retirement = retirementYear
      depthPct: CRASH.depthPct,
      troughLagYears: CRASH.troughLagYears,
      recoveryYears: rec.years,
      recoveryShape: rec.shape,
      recoveryCeiling: rec.ceiling
    };
  }
  function makeCrash(timingYear) { return makeCrashFor(SCENARIO, timingYear); }

  // ════════ PROJECTION ENGINE (parity with retirement projectStackOverTime) ════════
  // multFn(year) returns the price multiplier for that year (baseline = ()=>1).
  function projectStack(scn, growth, infl, multFn, flexPct) {
    var startYear = (new Date()).getFullYear();
    var endYear = scn.retirementYear + scn.yearsInRetirement;
    var i = infl / 100;
    var stackBtc = scn.btcStack;
    var rows = [], depletionYear = null;
    for (var y = startYear; y <= endYear; y++) {
      var d = dateForYear(y);
      var price = projPriceForGrowth(d, growth) * (multFn ? multFn(y) : 1);
      if (y < scn.retirementYear) {
        var added = (scn.monthlyDcaUSD > 0 && price > 0) ? (12 * scn.monthlyDcaUSD) / price : 0;
        stackBtc += added;
        rows.push({ x: y, phase: 'accum', price: price, btc: stackBtc, usd: null, income: null, btcSold: null, dcaAdded: added });
      } else if (y === scn.retirementYear) {
        rows.push({ x: y, phase: 'retire', price: price, btc: stackBtc, usd: stackBtc * price, income: null, btcSold: null, dcaAdded: 0 });
      } else {
        var yearsFromToday = y - startYear;
        var nominalIncome = (scn.incomeBasis === 'fixed')
          ? scn.targetIncomeUSD
          : scn.targetIncomeUSD * Math.pow(1 + i, yearsFromToday);
        // Spending flexibility: cut this year's withdrawal while the market is below
        // its pre-crash level — i.e. while the crash multiplier is < 1 (PRICE-PATH
        // underwater). Not the stack span. flexPct 0/absent → no cut, bit-identical to v1.
        var cut = false, fullIncome = nominalIncome;
        if (flexPct > 0 && multFn && multFn(y) < 1) { cut = true; nominalIncome = nominalIncome * (1 - flexPct / 100); }
        var btcNeeded = price > 0 ? nominalIncome / price : 0;
        stackBtc = Math.max(0, stackBtc - btcNeeded);
        if (stackBtc <= 0 && depletionYear === null) depletionYear = y;
        rows.push({ x: y, phase: 'draw', price: price, btc: stackBtc, usd: stackBtc * price, income: nominalIncome, fullIncome: fullIncome, cut: cut, btcSold: btcNeeded, dcaAdded: 0 });
      }
    }
    return { rows: rows, depletionYear: depletionYear, startYear: startYear, endYear: endYear };
  }

  // Real (today's $) value of a nominal amount in year y.
  function toReal(nominal, y, infl) {
    if (nominal == null) return null;
    var startYear = (new Date()).getFullYear();
    return nominal / Math.pow(1 + infl / 100, y - startYear);
  }
  function finalRealStack(proj, infl) {
    var last = proj.rows[proj.rows.length - 1];
    return toReal(last.usd, last.x, infl);
  }
  // Cost of the crash as a share of the no-crash terminal stack. Scale-free, so it stays
  // meaningful whether the Power Law leaves you with thousands or tens of millions: a
  // "years of income lost" figure balloons into the hundreds once the trend compounds a
  // stack into the millions, which reads as alarm rather than information.
  function pctSmaller(baseReal, crashReal) {
    if (!(baseReal > 0)) return 0;
    return Math.max(0, Math.round(100 * (1 - crashReal / baseReal)));
  }

  // ── Spending-flexibility helpers ──
  // Price-path underwater draw years: the years the crash keeps the market below its
  // pre-crash level (crashMultiplier < 1). The flex lever cuts across exactly these —
  // NOT the stack's underwater span (which lags because coins sold cheap are gone).
  // For Fast/Historical/Slow this is recoveryYears; for Weak it runs to the horizon.
  function priceUnderwaterYears(crash, endYear) {
    var years = [];
    for (var y = crash.crashYear + 1; y <= endYear; y++) {
      if (crashMultiplier(y, crash) < 1) years.push(y);
    }
    return years;
  }
  // Compare full-spend vs reduced-spend crashed paths: forgone income (nominal+real)
  // across the cut years, cut-year count, and the two endings.
  function mitigation(crashedFull, reduced, infl) {
    var cutYears = 0, foregoneNom = 0, foregoneReal = 0;
    reduced.rows.forEach(function (r) {
      if (r.cut) { cutYears++; var f = r.fullIncome - r.income; foregoneNom += f; foregoneReal += (toReal(f, r.x, infl) || 0); }
    });
    var fullEnd = crashedFull.rows[crashedFull.rows.length - 1].usd;
    var redEnd = reduced.rows[reduced.rows.length - 1].usd;
    return { cutYears: cutYears, foregoneNom: foregoneNom, foregoneReal: foregoneReal,
      fullDep: crashedFull.depletionYear, redDep: reduced.depletionYear,
      fullEnd: fullEnd, redEnd: redEnd, flip: !!(crashedFull.depletionYear && !reduced.depletionYear) };
  }

  // ════════ FORMATTERS ════════
  function usd(v) {
    if (v == null || !isFinite(v)) return '—';
    var a = Math.abs(v);
    if (a >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    if (a >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v);
  }
  function usdFull(v) { return v == null || !isFinite(v) ? '—' : '$' + Math.round(v).toLocaleString(); }
  var yearsWord = window.CrashModel.yearsWord;

  // ════════ CHART: two-path overlay ════════
  var mainChart = null;
  var verticalLinePlugin = {
    id: 'stMarkers',
    afterDatasetsDraw: function (chart) {
      var lines = chart.$markers || [];
      if (!lines.length) return;
      var ctx = chart.ctx, xS = chart.scales.x, yS = chart.scales.y;
      ctx.save();
      ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      lines.forEach(function (m) {
        var xp = xS.getPixelForValue(m.x);
        if (xp < xS.left - 1 || xp > xS.right + 1) return;
        ctx.strokeStyle = m.color; ctx.beginPath(); ctx.moveTo(xp, yS.top); ctx.lineTo(xp, yS.bottom); ctx.stroke();
        ctx.setLineDash([]); ctx.font = '600 10px Inter, sans-serif'; ctx.fillStyle = m.color; ctx.textAlign = 'center';
        ctx.fillText(m.label, xp, yS.top - 3);
        ctx.setLineDash([3, 3]);
      });
      ctx.restore();
    }
  };

  function buildBands(startYear, endYear) {
    var trend = [], floor = [];
    for (var y = startYear; y <= endYear; y++) {
      var t = plPriceAtDate(dateForYear(y));
      trend.push({ x: y, y: t }); floor.push({ x: y, y: t * PL_FLOOR });
    }
    return { trend: trend, floor: floor };
  }

  function lineFrom(proj, color, width, dash) {
    return {
      data: proj.rows.map(function (r) { return { x: r.x, y: r.usd }; }),
      borderColor: color, backgroundColor: color, borderWidth: width, borderDash: dash || undefined,
      pointRadius: 0, tension: 0.15, spanGaps: false, order: 1
    };
  }

  // Crash-window bounds: onset through full recovery, padded ~half a year each side.
  function focusWindow(base, crash) {
    if (CHART_FOCUS !== 'crash') return { min: undefined, max: undefined };
    var lo = Math.max(base.startYear, crash.crashYear - 0.5);
    var hi = Math.min(base.endYear, crash.crashYear + crash.troughLagYears + (crash.recoveryYears || 3) + 0.5);
    if (hi - lo < 3) hi = Math.min(base.endYear, lo + 3);
    return { min: lo, max: hi };
  }

  // The payoff of the Crash-period view: a shaded "years underwater" band from crash
  // onset to recovery (or depletion), plus a dashed pre-crash level line. Built from
  // the shared module (shared/crash-model.js), configured for this page: band BEHIND
  // the unfilled lines at alpha 0.09, label "{n} years underwater", drawn only in
  // crash focus. (The span's endY reproduces the old inline recovered?recY:(depletion
  // ||endYear) — base.endYear === the former c.$endYear.)
  var underwaterPlugin = window.CrashModel.makeUnderwaterPlugin({
    id: 'stUnderwater', spKey: '$sp',
    tint: 'rgba(192,57,43,0.09)', bandBehind: true,
    levelLineColor: 'rgba(236,228,214,0.55)', levelLabelColor: 'rgba(236,228,214,0.8)', levelLabel: 'pre-crash level',
    labelColor: '#e08a7a', minUnderwater: 1,
    label: function (sp) { return window.CrashModel.yearsWord(sp.underwater) + ' underwater'; },
    active: function () { return CHART_FOCUS === 'crash'; }
  });

  function focusNoteText(crashed, sp) {
    if (!sp) return '';
    if (crashed.depletionYear) return 'These are the crash years you would live through: the stack drops below its pre-crash level and never recovers, running dry in <strong>' + crashed.depletionYear + '</strong>.';
    if (sp.recovered) return 'These are the crash years you would live through: the stack drops below its pre-crash level and stays there until about <strong>' + sp.recY + '</strong>, all while you keep selling into it.';
    return 'These are the crash years you would live through: the stack drops below its pre-crash level and does not regain it within the projection.';
  }

  function renderMainChart(base, crashed, crash, reduced) {
    var el = document.getElementById('stChart');
    if (!el || typeof Chart === 'undefined') return;
    var bands = buildBands(base.startYear, base.endYear);
    var win = focusWindow(base, crash);
    var sp = stressPeriod(crashed, crash);
    var ds = [
      { label: 'Trend', data: bands.trend, borderColor: C_TREND, borderWidth: 1, borderDash: [2, 4], pointRadius: 0, tension: 0.2, order: 5 },
      { label: 'Floor', data: bands.floor, borderColor: C_FLOOR, borderWidth: 1, borderDash: [2, 5], pointRadius: 0, tension: 0.2, order: 5 },
      Object.assign({ label: 'Baseline (no crash)' }, lineFrom(base, C_BASE, 2)),
      Object.assign({ label: 'With the crash' }, lineFrom(crashed, C_CRASH, 2.4))
    ];
    // Mitigation path: same rose hue family as the crash line, dashed + lighter.
    if (reduced) ds.push(Object.assign({ label: 'With the crash + ' + FLEX + '% flexibility' }, lineFrom(reduced, '#eab4a2', 2, [6, 3])));
    var markers = [{ x: SCENARIO.retirementYear, color: 'rgba(236,228,214,0.5)', label: 'Retire' },
                   { x: crash.crashYear, color: C_CRASH, label: 'Crash' }];
    if (crashed.depletionYear) markers.push({ x: crashed.depletionYear, color: '#c0392b', label: 'Depleted' });
    if (reduced && reduced.depletionYear && reduced.depletionYear !== crashed.depletionYear) markers.push({ x: reduced.depletionYear, color: '#eab4a2', label: 'Reduced depleted' });

    var noteEl = document.getElementById('stFocusNote');
    if (noteEl) noteEl.innerHTML = focusNoteText(crashed, sp);

    if (mainChart) {
      mainChart.data.datasets = ds; mainChart.$markers = markers; mainChart.$sp = sp; mainChart.$endYear = base.endYear;
      mainChart.options.scales.x.min = win.min; mainChart.options.scales.x.max = win.max;
      mainChart.update('none'); return;
    }
    mainChart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: { datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: true, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' }, layout: { padding: { top: 16, right: 8 } },
        scales: {
          x: { type: 'linear', min: win.min, max: win.max, grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { size: 11 }, maxTicksLimit: 9, callback: function (v) { return Math.round(v); } } },
          y: { type: 'logarithmic', grid: { color: 'rgba(224,148,34,0.06)' }, title: { display: true, text: 'Portfolio value (total stack)', color: MUTED, font: { size: 10 } }, ticks: { color: MUTED, font: { size: 11 }, callback: function (v) { return usd(v); } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 20, padding: 8, filter: function (it) { return it.text === 'Baseline (no crash)' || it.text === 'With the crash' || it.text.indexOf('flexibility') >= 0; } } },
          tooltip: { backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10, filter: function (it) { return it.parsed.y != null && it.parsed.y > 0; }, callbacks: { title: function (it) { return it.length ? 'Year ' + it[0].parsed.x : ''; }, label: function (it) { var lbl = it.dataset.label; if (lbl === 'Trend' || lbl === 'Floor') return lbl + ': ' + usd(it.parsed.y) + ' (per BTC)'; return lbl + ', your stack: ' + usd(it.parsed.y); } } }
        }
      },
      plugins: [verticalLinePlugin, underwaterPlugin]
    });
    mainChart.$markers = markers; mainChart.$sp = sp; mainChart.$endYear = base.endYear;
  }

  // ════════ COMPARISON SWEEP (the core lesson) ════════
  // Two sweeps behind one toggle. 'retire' varies the retirement YEAR (the same plan,
  // same crash, retiring earlier or later) and is the default view: it is the direct
  // picture of "the same plan passes or fails on retirement year alone". 'timing' varies
  // WHICH year of retirement the crash lands in, the original sensitivity view. Every row
  // is measured against ITS OWN no-crash baseline, so the cost is honest in both sweeps.
  var COMPARE_MODE = 'retire';           // 'retire' | 'timing'
  var TIMING_YEARS = [1, 3, 5, 10, 15];
  var RETIRE_YEARS = [2028, 2030, 2032, 2035, 2040, 2045];
  var sweepChart = null;
  var _sweepRows = [];                    // current rows, read by the plugin + tooltip (survives chart re-use)

  function sweepRows() {
    var infl = inflationPct(), g = growthKey();
    if (COMPARE_MODE === 'timing') {
      var baseProj = projectStack(SCENARIO, g, infl, null);
      var baseReal = finalRealStack(baseProj, infl);
      return TIMING_YEARS.filter(function (t) { return t <= SCENARIO.yearsInRetirement; }).map(function (t) {
        var crash = makeCrash(t), mult = function (y) { return crashMultiplier(y, crash); };
        var proj = projectStack(SCENARIO, g, infl, mult);
        var real = finalRealStack(proj, infl);
        var red = FLEX > 0 ? projectStack(SCENARIO, g, infl, mult, FLEX) : null;
        return { key: t, label: 'Year ' + t, sub: 'crash in ' + crash.crashYear,
                 depletion: proj.depletionYear, crashReal: real, baseReal: baseReal,
                 crashReducedReal: red ? finalRealStack(red, infl) : null, depletionReduced: red ? red.depletionYear : null,
                 pct: pctSmaller(baseReal, real), current: t === CRASH.timingYear };
      });
    }
    // 'retire' mode: same stack, same withdrawal, same crash, varying the retirement YEAR.
    // Always fold in the user's own retirement year so their scenario appears (highlighted).
    var curYear = (new Date()).getFullYear();
    var years = RETIRE_YEARS.slice();
    if (SCENARIO.retirementYear >= curYear && years.indexOf(SCENARIO.retirementYear) < 0) years.push(SCENARIO.retirementYear);
    years = years.filter(function (ry) { return ry >= curYear; }).sort(function (a, b) { return a - b; });
    return years.map(function (ry) {
      var scn = Object.assign({}, SCENARIO, { retirementYear: ry });
      var crash = makeCrashFor(scn, CRASH.timingYear), mult = function (y) { return crashMultiplier(y, crash); };
      var baseProj = projectStack(scn, g, infl, null);
      var proj = projectStack(scn, g, infl, mult);
      var red = FLEX > 0 ? projectStack(scn, g, infl, mult, FLEX) : null;
      var baseReal = finalRealStack(baseProj, infl), real = finalRealStack(proj, infl);
      return { key: ry, label: String(ry), sub: 'crash in ' + crash.crashYear,
               depletion: proj.depletionYear, crashReal: real, baseReal: baseReal,
               crashReducedReal: red ? finalRealStack(red, infl) : null, depletionReduced: red ? red.depletionYear : null,
               pct: pctSmaller(baseReal, real), current: ry === SCENARIO.retirementYear };
    });
  }

  // Draw "✕ depletes YYYY" tags where the crashed bar collapses to zero, so the flip is
  // visible on the chart and not only in the table.
  var depletionTagPlugin = {
    id: 'stDepletionTags',
    afterDatasetsDraw: function (c) {
      var rows = _sweepRows; if (!rows.length) return;
      var meta = c.getDatasetMeta(1); if (!meta || !meta.data) return;
      var ctx = c.ctx, yS = c.scales.y;
      ctx.save(); ctx.textAlign = 'center';
      rows.forEach(function (r, i) {
        if (!r.depletion) return;
        var bar = meta.data[i]; if (!bar) return;
        var x = bar.x, y = yS.bottom - 6;
        ctx.fillStyle = '#e08a7a'; ctx.font = '700 11px Inter, sans-serif';
        ctx.fillText('✕', x, y - 12);
        ctx.fillStyle = 'rgba(224,138,122,0.9)'; ctx.font = '600 9px Inter, sans-serif';
        ctx.fillText('depletes', x, y);
        ctx.fillText(String(r.depletion), x, y + 10);
      });
      ctx.restore();
    }
  };

  function renderSweepChart(rows) {
    var el = document.getElementById('stTimingChart');
    if (!el || typeof Chart === 'undefined') return;
    _sweepRows = rows;
    var labels = rows.map(function (r) { return r.label; });
    var baseData = rows.map(function (r) { return Math.max(0, r.baseReal); });
    var crashData = rows.map(function (r) { return Math.max(0, r.crashReal); });
    var colors = rows.map(function (r) { return r.depletion ? '#c0392b' : C_CRASH; });
    var hasReduced = rows.some(function (r) { return r.crashReducedReal != null; });
    var ds = [
      { label: 'No crash', data: baseData, backgroundColor: 'rgba(122,115,103,0.28)', borderWidth: 0, borderRadius: 3, order: 2 },
      { label: 'With the crash', data: crashData, backgroundColor: colors, borderWidth: 0, borderRadius: 3, order: 1 }
    ];
    // Paired bar: same rows, reduced-spend crashed ending (only when the lever is on).
    if (hasReduced) ds.push({ label: 'With the crash + ' + FLEX + '% flexibility',
      data: rows.map(function (r) { return Math.max(0, r.crashReducedReal || 0); }),
      backgroundColor: rows.map(function (r) { return r.depletionReduced ? '#c0392b' : '#eab4a2'; }), borderWidth: 0, borderRadius: 3, order: 0 });
    var xTitle = COMPARE_MODE === 'retire' ? 'Retirement start year' : 'Year of retirement the crash hits';
    if (sweepChart) {
      sweepChart.data.labels = labels; sweepChart.data.datasets = ds;
      sweepChart.options.scales.x.title.text = xTitle;
      sweepChart.update('none'); return;
    }
    sweepChart = new Chart(el.getContext('2d'), {
      type: 'bar',
      data: { labels: labels, datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
        layout: { padding: { top: 8 } },
        scales: {
          x: { grid: { display: false }, ticks: { color: DIM, font: { size: 11 } }, title: { display: true, text: xTitle, color: MUTED, font: { size: 10 } } },
          y: { grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { size: 11 }, callback: function (v) { return usd(v); } }, title: { display: true, text: "Final stack, today's $", color: MUTED, font: { size: 10 } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, padding: 10 } },
          tooltip: { backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function (it) { return it.length ? (_sweepRows[it[0].dataIndex] || {}).label || '' : ''; },
              label: function (it) {
                var r = _sweepRows[it.dataIndex]; if (!r) return '';
                if (it.datasetIndex === 0) return 'No crash: ' + usd(r.baseReal);
                if (it.datasetIndex === 2) return r.depletionReduced ? 'With ' + FLEX + '% cut: depletes ' + r.depletionReduced : 'With ' + FLEX + '% cut: ' + usd(r.crashReducedReal);
                return r.depletion ? 'Depletes in ' + r.depletion : 'Survives: ' + usd(r.crashReal) + ' (' + r.pct + '% smaller)';
              }
            } }
        }
      },
      plugins: [depletionTagPlugin]
    });
  }

  function renderSweepTable(rows) {
    var tb = document.getElementById('stTimingTableBody');
    var head = document.getElementById('stTimingHead');
    if (!tb) return;
    var firstCol = COMPARE_MODE === 'retire' ? 'Retire in' : 'Crash in';
    if (head) head.innerHTML = '<tr><th>' + firstCol + '</th><th>Crash lands</th><th>Outcome</th><th class="st-num">Final stack</th><th class="st-num">Cost vs no crash</th></tr>';
    var body = rows.map(function (r) {
      var outcome = r.depletion
        ? '<span class="st-fail">Depletes ' + r.depletion + '</span>'
        : 'Survives';
      var cost = r.depletion ? '<span class="st-fail">stack gone</span>' : (r.pct > 0 ? r.pct + '% smaller' : 'about even');
      var lbl = COMPARE_MODE === 'retire'
        ? '<strong>' + r.label + '</strong>'
        : 'Year <strong>' + r.label.replace('Year ', '') + '</strong>';
      var crashYr = r.sub.replace('crash in ', '');
      return '<tr' + (r.current ? ' class="st-row-current"' : '') + '><td>' + lbl + '</td><td>' + crashYr + '</td><td>' + outcome + '</td><td class="st-num">' + usd(Math.max(0, r.crashReal)) + '</td><td class="st-num">' + cost + '</td></tr>';
    }).join('');
    tb.innerHTML = body;
  }

  // Swap the section title, lead, and caption to match the active sweep.
  function updateCompareCopy() {
    var title = document.getElementById('stTimingTitle');
    var lead = document.getElementById('stTimingLead');
    var cap = document.getElementById('stTimingCaption');
    if (COMPARE_MODE === 'retire') {
      if (title) title.textContent = 'The same plan, retiring in different years';
      if (lead) lead.innerHTML = 'This is the whole point. Hold the stack, the withdrawal, and the crash fixed, and move only <em>when</em> you retire. Retire early and you are selling into the crash before the stack has had years to compound, so the same plan that survives a later start can fail an earlier one. Retire later and the compounding does the cushioning.';
      if (cap) cap.innerHTML = 'Each pair is a <strong>separate plan</strong> retiring in that start year, not one plan tracked over time. Final stack in today&rsquo;s dollars, same crash throughout. The faint bar is that year&rsquo;s plan with <strong>no crash</strong>; the solid bar is <strong>with the crash</strong>. A <span class="st-fail">✕ depletes</span> tag marks the years the stack runs to zero. The gap between the two bars is the crash&rsquo;s cost; it shrinks the later you retire.';
    } else {
      if (title) title.textContent = 'The same crash, at different years of retirement';
      if (lead) lead.innerHTML = 'Hold the plan and the crash fixed, and move only <em>which year of retirement</em> the bear market lands in. A crash early in retirement can break a plan that the identical crash, late, barely dents. Timing is decisive, and it is unknowable in advance.';
      if (cap) cap.innerHTML = 'Final stack in today&rsquo;s dollars for the same crash landing in different years of retirement. The faint bar is the plan with <strong>no crash</strong>; the solid bar is <strong>with the crash</strong>. A <span class="st-fail">✕ depletes</span> tag marks the years the stack runs to zero.';
    }
  }

  // ════════ STRESS PERIOD (the lived experience, derived from the crashed series) ════════
  // Thin adapter over the shared CrashModel.underwaterSpan. onset = crashed stack
  // value the year the crash hits (before the drop); underwater = years until it
  // regains that value (or to depletion / horizon end). All in nominal USD, the
  // same units the chart shows. `troughUsd` aliases the module's `troughV`; the
  // span carries onsetY + endY so the plugin needs no external augmentation.
  function stressPeriod(crashed, crash) {
    if (!crashed.rows || !crashed.rows.length) return null;
    var byYear = {};
    crashed.rows.forEach(function (r) { byYear[r.x] = r.usd; });
    var lastY = crashed.rows[crashed.rows.length - 1].x;
    var sp = window.CrashModel.underwaterSpan(function (y) { return byYear[y] != null ? byYear[y] : null; },
      crash.crashYear, lastY, crashed.depletionYear);
    if (sp) sp.troughUsd = sp.troughV;
    return sp;
  }

  // ════════ HEADLINE (lead with the lived stress period, not the terminal value) ════════
  function renderHeadline(base, crashed, crash) {
    var el = document.getElementById('stHeadline'); if (!el) return;
    var pct = pctSmaller(base.rows[base.rows.length - 1].usd, crashed.rows[crashed.rows.length - 1].usd);
    var baseFinalNom = base.rows[base.rows.length - 1].usd, crashFinalNom = crashed.rows[crashed.rows.length - 1].usd;
    var retN = crash.crashYear - SCENARIO.retirementYear + 1; // which year of retirement the crash hit
    var endYear = SCENARIO.retirementYear + SCENARIO.yearsInRetirement;
    var sp = stressPeriod(crashed, crash);

    var cls, headline, detail, detailSub = '';
    if (crashed.depletionYear && !base.depletionYear) {
      cls = 'st-out-fail';
      var into = crashed.depletionYear - SCENARIO.retirementYear;
      headline = 'Your plan does not survive this scenario.';
      detail = 'A ' + Math.round(crash.depthPct * 100) + '% crash in year ' + retN + ' of retirement drains the stack to zero in <strong>' + crashed.depletionYear + '</strong>, ' + yearsWord(into) + ' into a planned ' + yearsWord(SCENARIO.yearsInRetirement) + ' retirement. Without the crash, the same plan lasts the full ' + SCENARIO.yearsInRetirement + ', to ' + endYear + '.';
      var toZero = crashed.depletionYear - crash.crashYear;
      if (toZero > 0) detailSub = 'From the crash hitting to the stack running dry is about ' + yearsWord(toZero) + ', selling more sats every year into a price that has not come back.';
    } else if (crashed.depletionYear && base.depletionYear) {
      cls = 'st-out-fail';
      var earlier = base.depletionYear - crashed.depletionYear;
      headline = 'The crash pulls depletion ' + yearsWord(earlier) + ' forward.';
      detail = 'The stack was already tight: it depletes in <strong>' + crashed.depletionYear + '</strong> with the crash, versus ' + base.depletionYear + ' without it.';
    } else {
      cls = 'st-out-ok';
      headline = 'The plan survives this scenario.';
      if (sp && sp.dropPct >= 5 && sp.underwater >= 1) {
        var uw = yearsWord(sp.underwater);
        detail = 'But living it is a long hold. The stack falls to about <strong>' + usd(sp.troughUsd) + '</strong>, roughly <strong>' + sp.dropPct + '% below</strong> where it stood when the crash hit, and stays under that level for about <strong>' + uw + '</strong> before regaining it. The plan holds, but only because the recovery came. For those ' + sp.underwater + ' years you could not have known it would.';
        detailSub = 'By ' + endYear + ' the stack is about ' + pct + '% smaller than with no crash, ' + usd(crashFinalNom) + ' versus ' + usd(baseFinalNom) + ', but that final gap is not what you would feel. The years underwater are.';
      } else {
        detail = 'It lasts the full ' + yearsWord(SCENARIO.yearsInRetirement) + ' and this crash barely dents it: the terminal stack is about <strong>' + pct + '% smaller</strong> than with no crash. Deepen the crash or move it earlier to see the stress bite.';
      }
    }
    var html = '<div class="st-headline-main">' + headline + '</div><p class="st-headline-detail">' + detail + '</p>';
    if (detailSub) html += '<p class="st-headline-sub">' + detailSub + '</p>';
    el.className = 'st-headline ' + cls;
    el.innerHTML = html;
  }

  // Mitigation result (only when the flex lever is on) — extends the verdict.
  function renderMitigation(crashedFull, reduced, crash, infl) {
    var el = document.getElementById('stMitigation'); if (!el) return;
    if (FLEX <= 0 || !reduced) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    var m = mitigation(crashedFull, reduced, infl);
    var X = FLEX, N = m.cutYears, Y = usd(m.foregoneNom), parts = [];
    if (m.flip) {
      parts.push('With a <strong>' + X + '% cut</strong> while underwater, the plan survives this scenario — at full spending it did not. The cut costs about <strong>' + Y + '</strong> of forgone income across ' + yearsWord(N) + '.');
    } else if (m.redDep && m.fullDep && m.redDep > m.fullDep) {
      parts.push('The <strong>' + X + '% cut</strong> moves depletion from <strong>' + m.fullDep + '</strong> to <strong>' + m.redDep + '</strong> — ' + yearsWord(m.redDep - m.fullDep) + ' bought for about ' + Y + ' of forgone income.');
    } else if (!m.redDep && !m.fullDep) {
      var z = (m.fullEnd > 0) ? Math.round(100 * (m.redEnd / m.fullEnd - 1)) : 0;
      parts.push('The <strong>' + X + '% cut</strong> leaves the stack about <strong>' + z + '% higher</strong> at the end (' + usd(m.redEnd) + ' vs ' + usd(m.fullEnd) + '), for about ' + Y + ' of forgone income across ' + yearsWord(N) + '.');
    } else {
      parts.push('Even with a <strong>' + X + '% cut</strong>, the plan does not survive this scenario — flexibility helps, but this crash at this timing is beyond it.');
    }
    if (CRASH.recoveryPreset === 'weak') {
      parts.push('Under a Weak recovery the market never regains its pre-crash level, so the cut persists through the horizon — ' + yearsWord(N) + ' of reduced spending.');
    }
    parts.push('<span class="st-mitigation-note">Spending flexibility is a real lever, but not a free one: these are years of living on less, shown here as arithmetic. Whether the cut is livable is a question this page cannot answer.</span>');
    el.innerHTML = parts.map(function (p) { return '<p>' + p + '</p>'; }).join('');
  }

  // QA guard (the added assertion): the cut window MUST be the price-path underwater
  // (crashMultiplier < 1), never the stack-value span the band measures.
  function assertFlexWindow(crashedFull, reduced, crash) {
    if (!reduced) return;
    var endYear = SCENARIO.retirementYear + SCENARIO.yearsInRetirement;
    var priceWin = priceUnderwaterYears(crash, endYear).length;
    var cutYears = reduced.rows.filter(function (r) { return r.cut; }).length;
    if (cutYears !== priceWin) console.error('[st-flex] cut-years != price-path window', { cutYears: cutYears, priceWindow: priceWin });
    var sp = stressPeriod(crashedFull, crash);
    if (sp && sp.underwater !== priceWin && cutYears === sp.underwater) {
      console.error('[st-flex] cut-years wrongly bound to the STACK span', { cutYears: cutYears, stackSpan: sp.underwater, priceWindow: priceWin });
    }
  }
  if (typeof window !== 'undefined') window.stFlexQA = function () {
    var infl = inflationPct(), g = growthKey(), crash = makeCrash(CRASH.timingYear);
    var endYear = SCENARIO.retirementYear + SCENARIO.yearsInRetirement;
    var mult = function (y) { return crashMultiplier(y, crash); };
    var reduced = projectStack(SCENARIO, g, infl, mult, FLEX > 0 ? FLEX : 20);
    var sp = stressPeriod(projectStack(SCENARIO, g, infl, mult), crash);
    var rec = RECOVERY[CRASH.recoveryPreset] || RECOVERY.historical;
    return {
      cutYears: reduced.rows.filter(function (r) { return r.cut; }).length,
      priceWindow: priceUnderwaterYears(crash, endYear).length,
      recoveryYears: rec.years, weak: rec.shape === 'never',
      stackSpanUnderwater: sp ? sp.underwater : null,
      boundToPricePath: reduced.rows.filter(function (r) { return r.cut; }).length === priceUnderwaterYears(crash, endYear).length
    };
  };

  // ════════ AUDIT TABLE + CSV ════════
  function renderAudit(base, crashed) {
    var tb = document.getElementById('stAuditBody'); if (!tb) return;
    var infl = inflationPct();
    var rows = '', cutN = 0, foregoneNom = 0;
    for (var k = 0; k < crashed.rows.length; k++) {
      var r = crashed.rows[k], b = base.rows[k];
      if (r.phase === 'accum') continue; // audit focuses on the drawdown phase
      var crashed_row = (r.price < b.price - 1);
      if (r.cut) { cutN++; foregoneNom += (r.fullIncome - r.income); }
      rows += '<tr' + (crashed_row ? ' class="st-row-crash"' : '') + '>'
        + '<td>' + r.x + '</td>'
        + '<td class="st-num">' + usdFull(r.price) + (crashed_row ? ' <span class="st-dot">▼</span>' : '') + '</td>'
        + '<td class="st-num">' + (r.income != null ? usdFull(r.income) : '—') + (r.cut ? ' <span class="st-dot st-cut" title="withdrawal cut">✂</span>' : '') + '</td>'
        + '<td class="st-num">' + (r.btcSold != null ? r.btcSold.toFixed(4) : '—') + '</td>'
        + '<td class="st-num">' + r.btc.toFixed(4) + '</td>'
        + '<td class="st-num">' + usdFull(r.usd) + '</td>'
        + '</tr>';
    }
    tb.innerHTML = rows;
    var fn = document.getElementById('stFlexSummary');
    if (fn) {
      if (cutN > 0) { fn.hidden = false; fn.innerHTML = '<strong>Spending flexibility:</strong> withdrawals cut ' + FLEX + '% in ' + yearsWord(cutN) + ' (marked ✂), while the market sat below its pre-crash level — about <strong>' + usdFull(foregoneNom) + '</strong> of income forgone (nominal).'; }
      else { fn.hidden = true; fn.innerHTML = ''; }
    }
  }

  function buildCsv(base, crashed, crash) {
    var infl = inflationPct();
    var L = [];
    L.push('# Last Coin Standing — Retirement stress test (sequence-of-returns risk)');
    L.push('# Bitcoin stack,' + SCENARIO.btcStack + ' BTC');
    L.push('# Retirement year,' + SCENARIO.retirementYear);
    L.push('# Years in retirement,' + SCENARIO.yearsInRetirement);
    L.push('# Target annual income,' + SCENARIO.targetIncomeUSD + ' (' + (SCENARIO.incomeBasis === 'fixed' ? 'fixed future $' : "today's dollars") + ')');
    L.push('# Monthly DCA,' + SCENARIO.monthlyDcaUSD);
    L.push('# Inflation,' + inflationLabel());
    L.push('# Crash depth,' + Math.round(crash.depthPct * 100) + '%');
    L.push('# Crash year,' + crash.crashYear + ' (year ' + (crash.crashYear - SCENARIO.retirementYear + 1) + ' of retirement)');
    L.push('# Recovery,' + (RECOVERY[CRASH.recoveryPreset] || RECOVERY.historical).label);
    L.push('# Spending flexibility,' + (FLEX > 0 ? FLEX + '% cut while the market is below its pre-crash level (price-path underwater)' : 'off'));
    L.push('# Baseline depletion,' + (base.depletionYear || 'survives'));
    L.push('# Crashed depletion,' + (crashed.depletionYear || 'survives'));
    L.push('# Live scenario URL,' + window.location.href);
    L.push('');
    L.push('Year,Phase,BTC price nominal,Baseline price,Income drawn,Spending cut?,BTC sold,BTC left,Stack USD (crashed),Stack USD (baseline)');
    for (var k = 0; k < crashed.rows.length; k++) {
      var r = crashed.rows[k], b = base.rows[k];
      L.push([r.x, r.phase,
        r.price != null ? Math.round(r.price) : '',
        b.price != null ? Math.round(b.price) : '',
        r.income != null ? Math.round(r.income) : '',
        r.cut ? 'yes' : '',
        r.btcSold != null ? r.btcSold.toFixed(6) : '',
        r.btc != null ? r.btc.toFixed(4) : '',
        r.usd != null ? Math.round(r.usd) : '',
        b.usd != null ? Math.round(b.usd) : ''
      ].join(','));
    }
    return L.join('\n');
  }

  // ════════ ASSUMPTION LINE ════════
  function renderAssumptions() {
    var el = document.getElementById('stAssumptions'); if (!el) return;
    var rec = RECOVERY[CRASH.recoveryPreset] || RECOVERY.historical;
    el.innerHTML = 'Recovery assumed: <strong>' + rec.label + '</strong> (' + rec.note + '). Baseline growth is Power Law trend, inflation <strong>' + inflationLabel() + '</strong> (shared with the Retirement page). Past recoveries were reliable; the future is not guaranteed.';
  }

  // Compact BTC formatter for readouts (trims trailing zeros).
  function fmtBtc(v) { return (Math.round(v * 100) / 100).toString(); }

  // ════════ COMPARISON SUMMARY LINE (restates the reader's plan; B5) ════════
  function renderComparSummary() {
    var el = document.getElementById('stComparSummary'); if (!el) return;
    var rec = (RECOVERY[CRASH.recoveryPreset] || RECOVERY.historical).label;
    var basis = SCENARIO.incomeBasis === 'fixed' ? 'fixed future $' : "today's $";
    var varying = COMPARE_MODE === 'retire' ? 'the retirement year' : 'the crash timing';
    el.innerHTML = 'Your plan: <strong>' + fmtBtc(SCENARIO.btcStack) + ' BTC</strong> &middot; <strong>'
      + usd(SCENARIO.targetIncomeUSD) + '/yr</strong> (' + basis + ') &middot; <strong>' + SCENARIO.yearsInRetirement + ' yrs</strong> &middot; <strong>'
      + Math.round(CRASH.depthPct * 100) + '% crash</strong> &middot; <strong>' + rec + '</strong> recovery. Varying only ' + varying + ' below.';
  }

  // Live readouts for the playground controls (year, depth, timing).
  function updateReadouts() {
    var yv = document.getElementById('stRetireVal');
    if (yv) yv.textContent = SCENARIO.retirementYear;
    var dv = document.getElementById('stDepthVal');
    if (dv) dv.innerHTML = '−' + Math.round(CRASH.depthPct * 100) + '%';
    var tv = document.getElementById('stTimingVal');
    if (tv) tv.textContent = 'Year ' + CRASH.timingYear;
    var fv = document.getElementById('stFlexVal');
    if (fv) fv.textContent = FLEX > 0 ? ('−' + FLEX + '%') : 'Off';
  }

  // ════════ WORST-CASE TIMING FINDER (v2) ════════
  // Scan crash timings 1..yearsInRetirement under the CURRENT settings — depth,
  // recovery, AND the flex lever as set — and pick the worst. "Worst" is scored by
  // earliest depletion, tie-broken by smallest ending stack (today's $). It finds
  // the worst *timing*, never a forecast: no probability language anywhere.
  // The scored path is the actually-funded one (reduced-spend when flex is on).
  function timingWorse(a, b) {
    // True if timing `a` is worse than `b`. Depletion beats survival; earlier
    // depletion beats later; then smaller ending stack; then earliest timing (stable).
    if (a.dep && !b.dep) return true;
    if (!a.dep && b.dep) return false;
    if (a.dep && b.dep) {
      if (a.dep !== b.dep) return a.dep < b.dep;
      if (a.end !== b.end) return a.end < b.end;
      return a.t < b.t;
    }
    if (a.end !== b.end) return a.end < b.end;
    return a.t < b.t;
  }
  function findWorstTiming() {
    var infl = inflationPct(), g = growthKey();
    var maxT = Math.max(1, SCENARIO.yearsInRetirement);
    var best = null;
    for (var t = 1; t <= maxT; t++) {
      var crash = makeCrash(t);
      var mult = (function (c) { return function (y) { return crashMultiplier(y, c); }; })(crash);
      var crashed = projectStack(SCENARIO, g, infl, mult);
      var funded = FLEX > 0 ? projectStack(SCENARIO, g, infl, mult, FLEX) : crashed;
      var cand = { t: t, dep: funded.depletionYear, end: finalRealStack(funded, infl) };
      if (best === null || timingWorse(cand, best)) best = cand;
    }
    return best;
  }
  function clearFinderLine() {
    var el = document.getElementById('stFinderLine');
    if (el) { el.hidden = true; el.innerHTML = ''; }
  }
  function runFinder() {
    var best = findWorstTiming();
    if (!best) return;
    CRASH.timingYear = best.t;
    var ts = document.getElementById('stTimingSlider'); if (ts) ts.value = String(best.t);
    setSeg('stTiming', String(best.t));
    renderAll(); // full recompute + URL sync; clears the (now-stale) finder line first
    var el = document.getElementById('stFinderLine'); if (!el) return;
    var tail = best.dep
      ? 'depletes the stack in <strong>' + best.dep + '</strong>'
      : 'leaves the smallest stack, <strong>' + usd(Math.max(0, best.end)) + '</strong>';
    el.innerHTML = 'Worst timing under these settings: a crash landing in <strong>year ' + best.t + '</strong> — it ' + tail + '. Worst timing, not a prediction.';
    el.hidden = false;
  }

  // ════════ RENDER ALL ════════
  function renderAll() {
    clearFinderLine(); // the finder line describes a scan of a now-stale config; any recompute clears it
    var infl = inflationPct(), g = growthKey();
    var crash = makeCrash(CRASH.timingYear);
    var mult = function (y) { return crashMultiplier(y, crash); };
    var base = projectStack(SCENARIO, g, infl, null);
    var crashed = projectStack(SCENARIO, g, infl, mult);                       // full spend
    var reduced = FLEX > 0 ? projectStack(SCENARIO, g, infl, mult, FLEX) : null; // reduced spend (cut while price underwater)
    var shown = reduced || crashed;   // the actual funded path drives audit/CSV/verdict-context

    renderMainChart(base, crashed, crash, reduced);
    renderHeadline(base, crashed, crash);
    renderMitigation(crashed, reduced, crash, infl);
    assertFlexWindow(crashed, reduced, crash);
    var rows = sweepRows();
    renderSweepChart(rows);
    renderSweepTable(rows);
    renderAudit(base, shown);
    renderAssumptions();
    renderComparSummary();
    updateReadouts();
    syncUrl();
    // stash for CSV
    _last = { base: base, crashed: shown, crashedFull: crashed, reduced: reduced, crash: crash, infl: infl };
  }
  var _last = null;

  // ════════ INPUTS + WIRING ════════
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function setSeg(groupId, value) {
    var group = document.getElementById(groupId); if (!group) return;
    group.querySelectorAll('[data-val]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-val') === String(value));
    });
  }
  // Gallery-style range toggle uses `.active` rather than `.is-active`.
  function setActive(groupId, value) {
    var group = document.getElementById(groupId); if (!group) return;
    group.querySelectorAll('[data-val]').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-val') === String(value));
    });
  }
  // Crash-period note (below the chart, shown in crash focus) + the "try it" hint (above the
  // chart, shown in full view to advertise the toggle).
  function updateFocusNote() {
    var n = document.getElementById('stFocusNote');
    if (n) n.hidden = (CHART_FOCUS !== 'crash');
    var hint = document.getElementById('stFocusHint');
    if (hint) hint.hidden = (CHART_FOCUS === 'crash');
  }

  // ── Two tiers of input ──
  // Tier 1: typed baseline fields (set once; no sliders). Tier 2: the playground sliders
  // (retirement year, depth, timing) plus segmented recovery. Retirement year lives in
  // BOTH tiers (typed above, slider below), synced to the one SCENARIO value via setYear.
  var TYPED = [
    { id: 'stStack',  key: 'btcStack',          min: 0.01, max: 100000,    float: true },
    { id: 'stIncome', key: 'targetIncomeUSD',   min: 0,    max: 100000000, float: false },
    { id: 'stYears',  key: 'yearsInRetirement', min: 1,    max: 60,        float: false },
    { id: 'stDca',    key: 'monthlyDcaUSD',      min: 0,    max: 10000000,  float: false }
  ];

  // Set the retirement year and reflect it on both tiers (from = 'typed' | 'slider' | 'init'
  // marks which control the user is touching, so it is not rewritten under them).
  function setYear(v, from) {
    if (!isFinite(v)) return;
    SCENARIO.retirementYear = Math.round(clamp(v, 2026, 2100));
    var num = document.getElementById('stRetire'), sl = document.getElementById('stRetireSlider'), val = document.getElementById('stRetireVal');
    if (from !== 'typed' && num) num.value = SCENARIO.retirementYear;
    if (from !== 'slider' && sl) sl.value = String(clamp(SCENARIO.retirementYear, 2026, 2050));
    if (val) val.textContent = SCENARIO.retirementYear;
  }

  // Clamp the timing slider's range to the current retirement length, and keep timingYear valid.
  function syncTimingRange() {
    var ts = document.getElementById('stTimingSlider');
    if (ts) ts.max = String(Math.max(1, SCENARIO.yearsInRetirement));
    if (CRASH.timingYear > SCENARIO.yearsInRetirement) CRASH.timingYear = SCENARIO.yearsInRetirement;
    if (ts) ts.value = String(CRASH.timingYear);
  }

  // Reflect current state onto every control (run once at init).
  function initControls() {
    TYPED.forEach(function (t) { var el = document.getElementById(t.id); if (el) el.value = SCENARIO[t.key]; });
    setYear(SCENARIO.retirementYear, 'init');
    var ds = document.getElementById('stDepthSlider'); if (ds) ds.value = String(Math.round(CRASH.depthPct * 100));
    var fsl = document.getElementById('stFlexSlider'); if (fsl) fsl.value = String(FLEX);
    syncTimingRange();
    setSeg('stIncomeBasis', SCENARIO.incomeBasis);
    setSeg('stFlex', String(FLEX));
    setSeg('stRecovery', CRASH.recoveryPreset);
    setSeg('stDepth', String(Math.round(CRASH.depthPct * 100)));
    setSeg('stTiming', String(CRASH.timingYear));
    setSeg('stCompareMode', COMPARE_MODE);
    setActive('stFocus', CHART_FOCUS);
    updateFocusNote();
    updateCompareCopy();
  }

  function wire() {
    // Tier 1: typed baseline fields (no sliders).
    TYPED.forEach(function (t) {
      var el = document.getElementById(t.id); if (!el) return;
      el.addEventListener('input', function () {
        var v = parseFloat(el.value); if (!isFinite(v)) return;
        SCENARIO[t.key] = t.float ? clamp(v, t.min, t.max) : Math.round(clamp(v, t.min, t.max));
        if (t.key === 'yearsInRetirement') syncTimingRange();
        renderAll();
      });
    });

    // Retirement year: typed field (Tier 1) + playground slider (Tier 2), synced.
    var yNum = document.getElementById('stRetire'), ySl = document.getElementById('stRetireSlider');
    if (yNum) yNum.addEventListener('input', function () { setYear(parseFloat(yNum.value), 'typed'); renderAll(); });
    if (ySl) ySl.addEventListener('input', function () { setYear(parseInt(ySl.value, 10), 'slider'); renderAll(); });

    // Income basis segmented
    var ib = document.getElementById('stIncomeBasis');
    if (ib) ib.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; SCENARIO.incomeBasis = b.getAttribute('data-val'); setSeg('stIncomeBasis', SCENARIO.incomeBasis); renderAll(); });

    // Crash depth slider (+ quick presets, keeping −77% a one-tap selectable option)
    var ds = document.getElementById('stDepthSlider');
    if (ds) ds.addEventListener('input', function () { var v = parseInt(ds.value, 10); if (isFinite(v)) { CRASH.depthPct = clamp(v, 1, 99) / 100; setSeg('stDepth', String(v)); renderAll(); } });
    var depth = document.getElementById('stDepth');
    if (depth) depth.addEventListener('click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      var v = parseInt(b.getAttribute('data-val'), 10);
      CRASH.depthPct = v / 100; if (ds) ds.value = String(v); setSeg('stDepth', String(v)); renderAll();
    });

    // Crash timing slider (+ quick presets)
    var ts = document.getElementById('stTimingSlider');
    if (ts) ts.addEventListener('input', function () { var v = parseInt(ts.value, 10); if (isFinite(v)) { CRASH.timingYear = clamp(v, 1, SCENARIO.yearsInRetirement); setSeg('stTiming', String(v)); renderAll(); } });
    var timing = document.getElementById('stTiming');
    if (timing) timing.addEventListener('click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      var v = clamp(parseInt(b.getAttribute('data-val'), 10), 1, SCENARIO.yearsInRetirement);
      CRASH.timingYear = v; if (ts) ts.value = String(v); setSeg('stTiming', String(v)); renderAll();
    });

    // Worst-case timing finder (scans 1..years under current settings, sets the winner)
    var finderBtn = document.getElementById('stFinderBtn');
    if (finderBtn) finderBtn.addEventListener('click', runFinder);

    // Recovery segmented
    var rec = document.getElementById('stRecovery');
    if (rec) rec.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; CRASH.recoveryPreset = b.getAttribute('data-val'); setSeg('stRecovery', CRASH.recoveryPreset); renderAll(); });

    // Spending-flexibility lever (slider 0..50 + presets 0/10/20/30)
    var fs = document.getElementById('stFlexSlider');
    if (fs) fs.addEventListener('input', function () { var v = parseInt(fs.value, 10); if (isFinite(v)) { FLEX = clamp(v, 0, 50); setSeg('stFlex', String(FLEX)); updateReadouts(); renderAll(); } });
    var flexSeg = document.getElementById('stFlex');
    if (flexSeg) flexSeg.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; var v = clamp(parseInt(b.getAttribute('data-val'), 10), 0, 50); FLEX = v; if (fs) fs.value = String(v); setSeg('stFlex', String(v)); updateReadouts(); renderAll(); });

    // Two-path chart view toggle (Full retirement | Crash period)
    var focus = document.getElementById('stFocus');
    if (focus) focus.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; CHART_FOCUS = b.getAttribute('data-val'); setActive('stFocus', CHART_FOCUS); updateFocusNote(); renderAll(); });

    // Comparison-mode toggle (vary retirement year | crash timing)
    var cmp = document.getElementById('stCompareMode');
    if (cmp) cmp.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; COMPARE_MODE = b.getAttribute('data-val'); setSeg('stCompareMode', COMPARE_MODE); updateCompareCopy(); renderAll(); });

    // Audit accordion
    var at = document.getElementById('stAuditToggle'), ab = document.getElementById('stAuditBody2');
    if (at && ab) at.addEventListener('click', function () { var open = at.getAttribute('aria-expanded') === 'true'; at.setAttribute('aria-expanded', String(!open)); ab.hidden = open; });

    // CSV
    var csvBtn = document.getElementById('stCsvBtn');
    if (csvBtn) csvBtn.addEventListener('click', function () {
      if (!_last) return;
      var csv = buildCsv(_last.base, _last.crashed, _last.crash);
      var blob = new Blob([csv], { type: 'text/csv' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'retirement-stress-test.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      var lbl = csvBtn.querySelector('.st-csv-label'); if (lbl) { var o = lbl.textContent; lbl.textContent = 'Downloaded'; setTimeout(function () { lbl.textContent = o; }, 1600); }
    });

    initControls();
  }

  // ════════ URL STATE (shareable; reuses the retirement param names) ════════
  var URL_NUM = { stack: 'btcStack', retire: 'retirementYear', income: 'targetIncomeUSD', years: 'yearsInRetirement', dca: 'monthlyDcaUSD' };
  function readUrl() {
    if (!window.URLSearchParams) return;
    var p = new URLSearchParams(window.location.search);
    Object.keys(URL_NUM).forEach(function (k) { if (p.has(k)) { var v = parseFloat(p.get(k)); if (isFinite(v)) SCENARIO[URL_NUM[k]] = (k === 'stack') ? v : Math.round(v); } });
    if (p.has('incbasis') && (p.get('incbasis') === 'today' || p.get('incbasis') === 'fixed')) SCENARIO.incomeBasis = p.get('incbasis');
    if (p.has('cdepth')) { var d = parseInt(p.get('cdepth'), 10); if (isFinite(d)) CRASH.depthPct = clamp(d, 1, 99) / 100; }
    if (p.has('ctime')) { var t = parseInt(p.get('ctime'), 10); if (isFinite(t)) CRASH.timingYear = Math.max(1, t); }
    if (p.has('crecov') && RECOVERY[p.get('crecov')]) CRASH.recoveryPreset = p.get('crecov');
    if (p.has('flex')) { var fx = parseInt(p.get('flex'), 10); if (isFinite(fx)) FLEX = clamp(fx, 0, 50); }
    if (p.has('cmp') && (p.get('cmp') === 'retire' || p.get('cmp') === 'timing')) COMPARE_MODE = p.get('cmp');
    if (p.has('focus') && (p.get('focus') === 'full' || p.get('focus') === 'crash')) CHART_FOCUS = p.get('focus');
  }
  var _urlT = null;
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    if (_urlT) clearTimeout(_urlT);
    _urlT = setTimeout(function () {
      var p = new URLSearchParams(window.location.search);
      Object.keys(URL_NUM).forEach(function (k) { p.set(k, String(SCENARIO[URL_NUM[k]])); });
      p.set('incbasis', SCENARIO.incomeBasis);
      p.set('cdepth', String(Math.round(CRASH.depthPct * 100)));
      p.set('ctime', String(CRASH.timingYear));
      p.set('crecov', CRASH.recoveryPreset);
      if (FLEX > 0) p.set('flex', String(FLEX)); else p.delete('flex');
      p.set('cmp', COMPARE_MODE);
      p.set('focus', CHART_FOCUS);
      window.history.replaceState(null, '', window.location.pathname + '?' + p.toString() + window.location.hash);
    }, 250);
  }

  // ════════ INIT ════════
  function init() {
    readUrl();
    wire();
    renderAll();
    // Recompute when shared assumptions change on another page/tab (parity).
    try { window.ModelingAssumptions.subscribe && window.ModelingAssumptions.subscribe(renderAll); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
