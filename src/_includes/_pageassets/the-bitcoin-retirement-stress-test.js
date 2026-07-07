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
    depthPct: 0.77,          // Bitcoin's historical bear-market characteristic
    depthPreset: '77',
    timingYear: 1,           // year OF retirement the crash begins (1 = first year)
    timingPreset: '1',
    recoveryPreset: 'historical',
    troughLagYears: 1        // ~1 year peak->trough (Bull & Bear: 100+ days to bottom)
  };

  // Recovery shapes -> {years, shape, ceiling}. Historical is the default (not Fast).
  // 'never' asymptotes to a ceiling below trend: the honest weak/failed-recovery case.
  var RECOVERY = {
    fast:       { years: 2, shape: 'fast',       label: 'Fast', note: 'back to trend in about 2 years' },
    historical: { years: 3, shape: 'historical', label: 'Historical', note: 'about 3 years to trend, the reliable past pattern' },
    slow:       { years: 6, shape: 'slow',       label: 'Slow', note: 'a long, grinding 6 years to trend' },
    weak:       { years: 6, shape: 'never', ceiling: 0.6, label: 'Weak', note: 'never fully recovers, settling well below trend' }
  };

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

  // ════════ CRASH MODEL — timed price-path multiplier (the core new logic) ════════
  // Returns a price multiplier (<= 1) for a given calendar year. Before the crash: 1.
  // Slides to the trough over troughLagYears, then recovers toward 1 (or a ceiling < 1
  // for the weak case) over recoveryYears, eased by shape.
  function crashMultiplier(year, crash) {
    if (!crash) return 1;
    if (year < crash.crashYear) return 1;
    var trough = 1 - crash.depthPct;
    var troughYear = crash.crashYear + crash.troughLagYears;
    if (year <= troughYear) {
      var f = crash.troughLagYears === 0 ? 1 : (year - crash.crashYear) / crash.troughLagYears;
      return 1 - f * crash.depthPct;
    }
    var into = year - troughYear;
    var r = Math.min(1, into / Math.max(1, crash.recoveryYears));
    if (crash.recoveryShape === 'never') {
      var ceil = (crash.recoveryCeiling != null) ? crash.recoveryCeiling : 0.6;
      return trough + r * (ceil - trough);
    }
    if (crash.recoveryShape === 'slow') r = r * r;
    else if (crash.recoveryShape === 'fast') r = Math.sqrt(r);
    return trough + r * (1 - trough);
  }

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
  function projectStack(scn, growth, infl, multFn) {
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
        var btcNeeded = price > 0 ? nominalIncome / price : 0;
        stackBtc = Math.max(0, stackBtc - btcNeeded);
        if (stackBtc <= 0 && depletionYear === null) depletionYear = y;
        rows.push({ x: y, phase: 'draw', price: price, btc: stackBtc, usd: stackBtc * price, income: nominalIncome, btcSold: btcNeeded, dcaAdded: 0 });
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
  function yearsWord(n) { n = Math.round(n); return n + (n === 1 ? ' year' : ' years'); }

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

  function renderMainChart(base, crashed, crash) {
    var el = document.getElementById('stChart');
    if (!el || typeof Chart === 'undefined') return;
    var bands = buildBands(base.startYear, base.endYear);
    var ds = [
      { label: 'Trend', data: bands.trend, borderColor: C_TREND, borderWidth: 1, borderDash: [2, 4], pointRadius: 0, tension: 0.2, order: 5 },
      { label: 'Floor', data: bands.floor, borderColor: C_FLOOR, borderWidth: 1, borderDash: [2, 5], pointRadius: 0, tension: 0.2, order: 5 },
      Object.assign({ label: 'Baseline (no crash)' }, lineFrom(base, C_BASE, 2)),
      Object.assign({ label: 'With the crash' }, lineFrom(crashed, C_CRASH, 2.4))
    ];
    var markers = [{ x: SCENARIO.retirementYear, color: 'rgba(236,228,214,0.5)', label: 'Retire' },
                   { x: crash.crashYear, color: C_CRASH, label: 'Crash' }];
    if (crashed.depletionYear) markers.push({ x: crashed.depletionYear, color: '#c0392b', label: 'Depleted' });

    if (mainChart) {
      mainChart.data.datasets = ds; mainChart.$markers = markers; mainChart.update('none'); return;
    }
    mainChart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: { datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: true, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' }, layout: { padding: { top: 16, right: 8 } },
        scales: {
          x: { type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { size: 11 }, maxTicksLimit: 9, callback: function (v) { return v; } } },
          y: { type: 'logarithmic', grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { size: 11 }, callback: function (v) { return usd(v); } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 20, padding: 8, filter: function (it) { return it.text === 'Baseline (no crash)' || it.text === 'With the crash'; } } },
          tooltip: { backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10, filter: function (it) { return it.parsed.y != null && it.parsed.y > 0; }, callbacks: { title: function (it) { return it.length ? 'Year ' + it[0].parsed.x : ''; }, label: function (it) { return it.dataset.label + ': ' + usd(it.parsed.y); } } }
        }
      },
      plugins: [verticalLinePlugin]
    });
    mainChart.$markers = markers;
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
        var crash = makeCrash(t);
        var proj = projectStack(SCENARIO, g, infl, function (y) { return crashMultiplier(y, crash); });
        var real = finalRealStack(proj, infl);
        return { key: t, label: 'Year ' + t, sub: 'crash in ' + crash.crashYear,
                 depletion: proj.depletionYear, crashReal: real, baseReal: baseReal,
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
      var crash = makeCrashFor(scn, CRASH.timingYear);
      var baseProj = projectStack(scn, g, infl, null);
      var proj = projectStack(scn, g, infl, function (y) { return crashMultiplier(y, crash); });
      var baseReal = finalRealStack(baseProj, infl), real = finalRealStack(proj, infl);
      return { key: ry, label: String(ry), sub: 'crash in ' + crash.crashYear,
               depletion: proj.depletionYear, crashReal: real, baseReal: baseReal,
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
    var ds = [
      { label: 'No crash', data: baseData, backgroundColor: 'rgba(122,115,103,0.28)', borderWidth: 0, borderRadius: 3, order: 2 },
      { label: 'With the crash', data: crashData, backgroundColor: colors, borderWidth: 0, borderRadius: 3, order: 1 }
    ];
    if (sweepChart) {
      sweepChart.data.labels = labels; sweepChart.data.datasets[0].data = baseData;
      sweepChart.data.datasets[1].data = crashData; sweepChart.data.datasets[1].backgroundColor = colors;
      sweepChart.update('none'); return;
    }
    sweepChart = new Chart(el.getContext('2d'), {
      type: 'bar',
      data: { labels: labels, datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
        layout: { padding: { top: 8 } },
        scales: {
          x: { grid: { display: false }, ticks: { color: DIM, font: { size: 11 } } },
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
      if (cap) cap.innerHTML = 'Final stack in today&rsquo;s dollars for each retirement year, same crash throughout. The faint bar is that year&rsquo;s plan with <strong>no crash</strong>; the solid bar is <strong>with the crash</strong>. A <span class="st-fail">✕ depletes</span> tag marks the years the stack runs to zero. The gap between the two bars is the crash&rsquo;s cost; it shrinks the later you retire.';
    } else {
      if (title) title.textContent = 'The same crash, at different years of retirement';
      if (lead) lead.innerHTML = 'Hold the plan and the crash fixed, and move only <em>which year of retirement</em> the bear market lands in. A crash early in retirement can break a plan that the identical crash, late, barely dents. Timing is decisive, and it is unknowable in advance.';
      if (cap) cap.innerHTML = 'Final stack in today&rsquo;s dollars for the same crash landing in different years of retirement. The faint bar is the plan with <strong>no crash</strong>; the solid bar is <strong>with the crash</strong>. A <span class="st-fail">✕ depletes</span> tag marks the years the stack runs to zero.';
    }
  }

  // ════════ HEADLINE (survive / deplete / years-of-income lost) ════════
  function renderHeadline(base, crashed, crash) {
    var el = document.getElementById('stHeadline'); if (!el) return;
    var infl = inflationPct();
    var baseFinal = finalRealStack(base, infl), crashFinal = finalRealStack(crashed, infl);
    var pct = pctSmaller(baseFinal, crashFinal);
    var retN = crash.crashYear - SCENARIO.retirementYear + 1; // which year of retirement the crash hit

    var cls, headline, detail;
    if (crashed.depletionYear && !base.depletionYear) {
      cls = 'st-out-fail';
      var into = crashed.depletionYear - SCENARIO.retirementYear;
      headline = 'Your plan does not survive this scenario.';
      detail = 'A ' + Math.round(crash.depthPct * 100) + '% crash in year ' + retN + ' of retirement drains the stack to zero in <strong>' + crashed.depletionYear + '</strong>, ' + yearsWord(into) + ' into a planned ' + yearsWord(SCENARIO.yearsInRetirement) + ' retirement. Without the crash, the same plan lasts the full ' + SCENARIO.yearsInRetirement + '.';
    } else if (crashed.depletionYear && base.depletionYear) {
      cls = 'st-out-fail';
      var earlier = base.depletionYear - crashed.depletionYear;
      headline = 'The crash pulls depletion ' + yearsWord(earlier) + ' forward.';
      detail = 'The stack was already tight: it depletes in <strong>' + crashed.depletionYear + '</strong> with the crash, versus ' + base.depletionYear + ' without it.';
    } else {
      cls = 'st-out-ok';
      headline = 'The plan survives this scenario.';
      detail = 'It lasts the full ' + yearsWord(SCENARIO.yearsInRetirement) + ', but the crash still costs you: the terminal stack is about <strong>' + pct + '% smaller</strong> than with no crash, ' + usd(crashFinal) + " versus " + usd(baseFinal) + " in today's dollars. Retire earlier or draw harder and the same crash can tip into depletion.";
    }
    el.className = 'st-headline ' + cls;
    el.innerHTML = '<div class="st-headline-main">' + headline + '</div><p class="st-headline-detail">' + detail + '</p>';
  }

  // ════════ AUDIT TABLE + CSV ════════
  function renderAudit(base, crashed) {
    var tb = document.getElementById('stAuditBody'); if (!tb) return;
    var infl = inflationPct();
    var rows = '';
    for (var k = 0; k < crashed.rows.length; k++) {
      var r = crashed.rows[k], b = base.rows[k];
      if (r.phase === 'accum') continue; // audit focuses on the drawdown phase
      var crashed_row = (r.price < b.price - 1);
      rows += '<tr' + (crashed_row ? ' class="st-row-crash"' : '') + '>'
        + '<td>' + r.x + '</td>'
        + '<td class="st-num">' + usdFull(r.price) + (crashed_row ? ' <span class="st-dot">▼</span>' : '') + '</td>'
        + '<td class="st-num">' + (r.income != null ? usdFull(r.income) : '—') + '</td>'
        + '<td class="st-num">' + (r.btcSold != null ? r.btcSold.toFixed(4) : '—') + '</td>'
        + '<td class="st-num">' + r.btc.toFixed(4) + '</td>'
        + '<td class="st-num">' + usdFull(r.usd) + '</td>'
        + '</tr>';
    }
    tb.innerHTML = rows;
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
    L.push('# Baseline depletion,' + (base.depletionYear || 'survives'));
    L.push('# Crashed depletion,' + (crashed.depletionYear || 'survives'));
    L.push('# Live scenario URL,' + window.location.href);
    L.push('');
    L.push('Year,Phase,BTC price nominal,Baseline price,Income drawn,BTC sold,BTC left,Stack USD (crashed),Stack USD (baseline)');
    for (var k = 0; k < crashed.rows.length; k++) {
      var r = crashed.rows[k], b = base.rows[k];
      L.push([r.x, r.phase,
        r.price != null ? Math.round(r.price) : '',
        b.price != null ? Math.round(b.price) : '',
        r.income != null ? Math.round(r.income) : '',
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

  // ════════ RENDER ALL ════════
  function renderAll() {
    var infl = inflationPct(), g = growthKey();
    var crash = makeCrash(CRASH.timingYear);
    var base = projectStack(SCENARIO, g, infl, null);
    var crashed = projectStack(SCENARIO, g, infl, function (y) { return crashMultiplier(y, crash); });

    renderMainChart(base, crashed, crash);
    renderHeadline(base, crashed, crash);
    var rows = sweepRows();
    renderSweepChart(rows);
    renderSweepTable(rows);
    renderAudit(base, crashed);
    renderAssumptions();
    syncUrl();
    // stash for CSV
    _last = { base: base, crashed: crashed, crash: crash };
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

  function wire() {
    // Baseline plan number inputs
    var map = [
      ['stStack', 'btcStack', 0.01, 100000, true],
      ['stRetire', 'retirementYear', 2026, 2100, false],
      ['stYears', 'yearsInRetirement', 1, 60, false],
      ['stIncome', 'targetIncomeUSD', 0, 100000000, false],
      ['stDca', 'monthlyDcaUSD', 0, 10000000, false]
    ];
    map.forEach(function (m) {
      var el = document.getElementById(m[0]); if (!el) return;
      el.value = SCENARIO[m[1]];
      el.addEventListener('input', function () {
        var v = parseFloat(el.value); if (!isFinite(v)) return;
        SCENARIO[m[1]] = m[4] ? clamp(v, m[2], m[3]) : Math.round(clamp(v, m[2], m[3]));
        renderAll();
      });
    });
    // Income basis segmented
    var ib = document.getElementById('stIncomeBasis');
    if (ib) ib.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; SCENARIO.incomeBasis = b.getAttribute('data-val'); setSeg('stIncomeBasis', SCENARIO.incomeBasis); renderAll(); });

    // Crash depth segmented (+ custom)
    var depth = document.getElementById('stDepth');
    if (depth) depth.addEventListener('click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      var v = b.getAttribute('data-val'); CRASH.depthPreset = v;
      var wrap = document.getElementById('stDepthCustomWrap');
      if (v === 'custom') { if (wrap) wrap.hidden = false; var ci = document.getElementById('stDepthCustom'); if (ci && isFinite(parseFloat(ci.value))) CRASH.depthPct = clamp(parseFloat(ci.value), 1, 99) / 100; }
      else { if (wrap) wrap.hidden = true; CRASH.depthPct = parseInt(v, 10) / 100; }
      setSeg('stDepth', v); renderAll();
    });
    var dc = document.getElementById('stDepthCustom');
    if (dc) dc.addEventListener('input', function () { var v = parseFloat(dc.value); if (isFinite(v)) { CRASH.depthPct = clamp(v, 1, 99) / 100; CRASH.depthPreset = 'custom'; renderAll(); } });

    // Crash timing segmented (+ custom)
    var timing = document.getElementById('stTiming');
    if (timing) timing.addEventListener('click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      var v = b.getAttribute('data-val'); CRASH.timingPreset = v;
      var wrap = document.getElementById('stTimingCustomWrap');
      if (v === 'custom') { if (wrap) wrap.hidden = false; var ci = document.getElementById('stTimingCustom'); if (ci && isFinite(parseInt(ci.value, 10))) CRASH.timingYear = clamp(parseInt(ci.value, 10), 1, SCENARIO.yearsInRetirement); }
      else { if (wrap) wrap.hidden = true; CRASH.timingYear = parseInt(v, 10); }
      setSeg('stTiming', v); renderAll();
    });
    var tc = document.getElementById('stTimingCustom');
    if (tc) tc.addEventListener('input', function () { var v = parseInt(tc.value, 10); if (isFinite(v)) { CRASH.timingYear = clamp(v, 1, SCENARIO.yearsInRetirement); CRASH.timingPreset = 'custom'; renderAll(); } });

    // Recovery segmented
    var rec = document.getElementById('stRecovery');
    if (rec) rec.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; CRASH.recoveryPreset = b.getAttribute('data-val'); setSeg('stRecovery', CRASH.recoveryPreset); renderAll(); });

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

    // reflect initial state on the segmented controls
    setSeg('stIncomeBasis', SCENARIO.incomeBasis);
    setSeg('stDepth', CRASH.depthPreset); setSeg('stTiming', CRASH.timingPreset); setSeg('stRecovery', CRASH.recoveryPreset);
    setSeg('stCompareMode', COMPARE_MODE); updateCompareCopy();
  }

  // ════════ URL STATE (shareable; reuses the retirement param names) ════════
  var URL_NUM = { stack: 'btcStack', retire: 'retirementYear', income: 'targetIncomeUSD', years: 'yearsInRetirement', dca: 'monthlyDcaUSD' };
  function readUrl() {
    if (!window.URLSearchParams) return;
    var p = new URLSearchParams(window.location.search);
    Object.keys(URL_NUM).forEach(function (k) { if (p.has(k)) { var v = parseFloat(p.get(k)); if (isFinite(v)) SCENARIO[URL_NUM[k]] = (k === 'stack') ? v : Math.round(v); } });
    if (p.has('incbasis') && (p.get('incbasis') === 'today' || p.get('incbasis') === 'fixed')) SCENARIO.incomeBasis = p.get('incbasis');
    if (p.has('cdepth')) { var d = parseInt(p.get('cdepth'), 10); if (isFinite(d)) { CRASH.depthPct = clamp(d, 1, 99) / 100; CRASH.depthPreset = (['40', '60', '77'].indexOf(String(d)) >= 0) ? String(d) : 'custom'; } }
    if (p.has('ctime')) { var t = parseInt(p.get('ctime'), 10); if (isFinite(t)) { CRASH.timingYear = Math.max(1, t); CRASH.timingPreset = (['1', '3', '5', '10'].indexOf(String(t)) >= 0) ? String(t) : 'custom'; } }
    if (p.has('crecov') && RECOVERY[p.get('crecov')]) CRASH.recoveryPreset = p.get('crecov');
    if (p.has('cmp') && (p.get('cmp') === 'retire' || p.get('cmp') === 'timing')) COMPARE_MODE = p.get('cmp');
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
      p.set('cmp', COMPARE_MODE);
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
