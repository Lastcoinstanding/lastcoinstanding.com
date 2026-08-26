/* =============================================================
   Compare Retirement Plans — page logic

   Two independently configured plans, one engine. Every projection,
   verdict and threshold on this page goes through
   window.RetirementEngine (shared/retirement-engine.js), which is the
   Escape Velocity / flagship engine extracted verbatim. This file
   declares NO model constants of its own — design §8.1: "any constant
   re-declared per column is a defect." The two columns differ only in
   the three reader-controlled inputs they hold.

   The bear-market path comes from window.CrashModel
   (shared/crash-model.js), the module the Retirement Stress Test itself
   runs on, at that page's own shipped defaults. There is no second
   crash definition here.

   window.crpParityQA() runs the assertions required by design §8.2.
   ============================================================= */
(function () {
  'use strict';

  var E = window.RetirementEngine;
  var CM = window.CrashModel;
  var MA = window.ModelingAssumptions;

  /* ═══════════════════════════════════════════════════════════
     STATE — two plans and one shared environment flag.

     Plan B initialises as Plan A with the retirement year +1 (design
     §2, ratified §9): the page opens on a meaningful comparison rather
     than a blank column, and "what does one more year buy?" is the
     question most readers arrive holding.

     Plan A's own defaults are Escape Velocity's, unchanged, so a reader
     arriving from that page sees the plan they left.
  ═══════════════════════════════════════════════════════════ */

  var DEFAULT_A = {
    btcStack: 1.0,
    targetIncomeUSD: 100000,
    retirementYear: 2035,
    yearsInRetirement: 30,
    incomeBasis: 'today'
  };

  function planFrom(base, over) { return E.cloneWith(over || {}, base); }

  var PLANS = {
    a: planFrom(DEFAULT_A),
    b: planFrom(DEFAULT_A, { retirementYear: DEFAULT_A.retirementYear + 1 })
  };
  var BEAR = false;
  var EDIT_COL = 'a';        // mobile only — which column's inputs are shown
  var BASIS = 'trend';       // shared; the gap-persists variant is flagship territory

  var LIMITS = E.LIMITS;
  var STEP = { retirementYear: 1, btcStack: 0.25, targetIncomeUSD: 10000 };

  /* ─── The bear path. Built from the Stress Test's shipped defaults, read
         off the shared module — a −60% crash landing in the FIRST YEAR of
         each plan's own retirement, historical recovery, ~1yr to trough.
         Anchoring to each plan's own retirement year is what keeps the
         toggle honest: both plans meet the same crash at the same point of
         their own life, so a plan is never punished merely for retiring on
         a different date. ─── */
  var BEAR_SPEC = { depthPct: 0.60, timingYear: 1, troughLagYears: 1, recoveryPreset: 'historical' };

  function crashFor(scn) {
    var rec = CM.RECOVERY[BEAR_SPEC.recoveryPreset] || CM.RECOVERY.historical;
    return {
      crashYear: scn.retirementYear + (BEAR_SPEC.timingYear - 1),
      depthPct: BEAR_SPEC.depthPct,
      troughLagYears: BEAR_SPEC.troughLagYears,
      recoveryYears: rec.years,
      recoveryShape: rec.shape,
      recoveryCeiling: rec.ceiling
    };
  }
  // Factory, not a fixed function — see the note on E.lineFor.
  function multFor(scn) {
    if (!BEAR) return null;
    var crash = crashFor(scn);
    return function (y) { return CM.crashMultiplier(y, crash); };
  }

  /* ═══════════════════════════════════════════════════════════
     FORMATTERS — flagship canon, copied so the two pages read alike.
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
  function plural(n, word) { return n + ' ' + word + (Math.abs(n) === 1 ? '' : 's'); }
  function yearsWord(n) { return plural(Math.abs(Math.round(n)), 'year'); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function displayValue(key, scn) {
    var v = scn[key];
    if (key === 'retirementYear') return String(Math.round(v));
    if (key === 'btcStack') return formatBtc(v) + ' BTC';
    return formatUsdFull(v);
  }

  /* ═══════════════════════════════════════════════════════════
     COMPUTE — one call per column, everything downstream reads it.
  ═══════════════════════════════════════════════════════════ */

  function computeCol(key) {
    var scn = PLANS[key];
    var infl = MA.get('inflation').value;
    var proj = E.projectForBasis(scn, BASIS, false, multFor(scn));
    var verdict = E.computeVerdict(proj, scn, infl);
    return { key: key, scn: scn, proj: proj, v: verdict, infl: infl };
  }

  // Thresholds are the expensive part (~75 projections per column), so they
  // are cached on the full state key and recomputed only when it moves.
  var LINE_KEY = null, LINE_CACHE = null;
  function linesFor(c) {
    var scn = c.scn;
    return {
      stack:  E.lineFor('stack',  scn, BASIS, multFor),
      income: E.lineFor('income', scn, BASIS, multFor),
      retire: E.lineFor('retire', scn, BASIS, multFor)
    };
  }
  function allLines(ca, cb) {
    var key = [stateKey(), MA.get('inflation').value, MA.get('btcGrowthModel').preset, TODAY_PRICE].join('|');
    if (key === LINE_KEY) return LINE_CACHE;
    LINE_KEY = key;
    LINE_CACHE = { a: linesFor(ca), b: linesFor(cb) };
    return LINE_CACHE;
  }
  function stateKey() {
    return ['a', PLANS.a.btcStack, PLANS.a.targetIncomeUSD, PLANS.a.retirementYear,
            'b', PLANS.b.btcStack, PLANS.b.targetIncomeUSD, PLANS.b.retirementYear,
            'bear', BEAR ? 1 : 0].join('|');
  }

  // The one year BOTH plans are read at, for any value comparison. Using each
  // plan's own horizon would silently compare two different dates and call the
  // later one richer. The later horizon is the shared one: it is the only year
  // both projections actually reach.
  function sharedHorizon() {
    return Math.max(PLANS.a.retirementYear + PLANS.a.yearsInRetirement,
                    PLANS.b.retirementYear + PLANS.b.yearsInRetirement);
  }
  // A plan's real value at an arbitrary year, extending past its own horizon by
  // re-running it to that year. Returns null when the plan has depleted.
  function realValueAt(c, year) {
    if (c.v.depletionYear !== null && year >= c.v.depletionYear) return 0;
    var span = year - c.scn.retirementYear;
    if (span <= c.scn.yearsInRetirement) return E.realValueAtYear(c.proj, year, c.infl);
    var stretched = E.cloneWith({ yearsInRetirement: span }, c.scn);
    var p = E.projectForBasis(stretched, BASIS, false, multFor(stretched));
    return E.realValueAtYear(p, year, c.infl);
  }

  /* ═══════════════════════════════════════════════════════════
     VERDICT LANGUAGE — Escape Velocity's vocabulary, so the family
     reads as one system. No winner-crowning: verdicts are facts.
  ═══════════════════════════════════════════════════════════ */

  function stateWord(v) {
    if (v.state === 'deplete') return 'depletes';
    if (v.state === 'shrink') return 'shrinks';
    return 'crosses';
  }
  function colVerdictHtml(c) {
    var v = c.v, y = c.scn.retirementYear;
    if (v.state === 'deplete') {
      return 'Retiring in <strong>' + y + '</strong>, this plan <strong>runs out in ' + v.depletionYear + '</strong> &mdash; ' +
             yearsWord(v.depletionYear - y) + ' into a planned ' + yearsWord(c.scn.yearsInRetirement) + '.';
    }
    if (v.state === 'shrink') {
      return 'Retiring in <strong>' + y + '</strong>, this plan <strong>never crosses the threshold</strong> but outlives the horizon &mdash; it turns over in ' + v.turnYear + ' and is still falling at ' + v.horizonYear + '.';
    }
    return 'Retiring in <strong>' + y + '</strong>, this plan <strong>crosses the threshold</strong> &mdash; from ' + v.escapeYear + ' its growth stays ahead of the draw through ' + v.horizonYear + '.';
  }

  /* ═══════════════════════════════════════════════════════════
     THE DELTA — sentences, not arithmetic (design §7). Two columns of
     numbers make the reader do the subtraction; the subtraction is not
     the insight.

     Register: state what each plan buys and costs, symmetrically. No
     winner language, no editorialising on depletion.
  ═══════════════════════════════════════════════════════════ */

  // What actually differs between the two plans, in reader vocabulary.
  function differences() {
    var out = [];
    if (PLANS.a.retirementYear !== PLANS.b.retirementYear) {
      var dy = PLANS.b.retirementYear - PLANS.a.retirementYear;
      out.push({ key: 'retire', phrase: 'retiring ' + yearsWord(dy) + (dy > 0 ? ' later' : ' earlier') });
    }
    if (Math.abs(PLANS.a.btcStack - PLANS.b.btcStack) > 1e-9) {
      var ds = PLANS.b.btcStack - PLANS.a.btcStack;
      out.push({ key: 'stack', phrase: (ds > 0 ? 'holding ' : 'holding ') + formatBtc(Math.abs(ds)) + ' BTC ' + (ds > 0 ? 'more' : 'less') });
    }
    if (PLANS.a.targetIncomeUSD !== PLANS.b.targetIncomeUSD) {
      var di = PLANS.b.targetIncomeUSD - PLANS.a.targetIncomeUSD;
      out.push({ key: 'income', phrase: 'drawing ' + formatUsdFull(Math.abs(di)) + ' a year ' + (di > 0 ? 'more' : 'less') });
    }
    return out;
  }
  function differenceClause() {
    var d = differences();
    if (!d.length) return null;
    if (d.length === 1) return d[0].phrase.charAt(0).toUpperCase() + d[0].phrase.slice(1);
    var parts = d.map(function (x) { return x.phrase; });
    var last = parts.pop();
    var s = parts.join(', ') + ' and ' + last;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function deltaSentences(ca, cb, L) {
    var out = [];
    var clause = differenceClause();
    var hz = sharedHorizon();

    if (!clause) {
      out.push({ html: 'Both plans are identical &mdash; every row below matches. <em>Change one of Plan B&rsquo;s three inputs to see what it buys.</em>', plain: true });
      return out;
    }

    // 1. The headline: what the bundle buys, in longevity and in ending value.
    var va = realValueAt(ca, hz), vb = realValueAt(cb, hz);
    var lead = '<strong>' + clause + ':</strong> ';
    var pieces = [];

    if (ca.v.state === 'deplete' && cb.v.state === 'deplete') {
      var dd = cb.v.depletionYear - ca.v.depletionYear;
      pieces.push(dd === 0 ? 'both plans still run out in ' + ca.v.depletionYear
        : 'the plan holds ' + yearsWord(dd) + (dd > 0 ? ' longer' : ' less') + ', running out in ' + cb.v.depletionYear + ' instead of ' + ca.v.depletionYear);
    } else if (ca.v.state === 'deplete' && cb.v.state !== 'deplete') {
      pieces.push('Plan A runs out in ' + ca.v.depletionYear + '; Plan B holds through the horizon');
    } else if (ca.v.state !== 'deplete' && cb.v.state === 'deplete') {
      pieces.push('Plan A holds through the horizon; Plan B runs out in ' + cb.v.depletionYear);
    } else if (va != null && vb != null) {
      var diff = vb - va;
      if (Math.abs(diff) < 1) pieces.push('the two plans end level at ' + hz);
      else pieces.push('the plan ends ' + formatCurrencyShort(Math.abs(diff)) + (diff > 0 ? ' higher' : ' lower') + ' at ' + hz);
    }
    if (pieces.length) out.push({ html: lead + pieces.join(', and ') + '.' });

    // 2. The threshold, which is the family's shared vocabulary.
    var ea = ca.v.state === 'escape', eb = cb.v.state === 'escape';
    if (ea && eb) {
      var ma = ca.scn.btcStack - (L.a.stack.value != null ? L.a.stack.value : ca.scn.btcStack);
      var mb = cb.scn.btcStack - (L.b.stack.value != null ? L.b.stack.value : cb.scn.btcStack);
      var mg = mb - ma;
      out.push({ html: Math.abs(mg) < 0.005
        ? 'Both plans cross the threshold, by the same margin.'
        : 'Both plans cross the threshold; <strong>Plan ' + (mg > 0 ? 'B' : 'A') + '&rsquo;s margin is ' + formatBtc(Math.abs(mg)) + ' BTC wider</strong>.' });
    } else if (ea !== eb) {
      out.push({ html: '<strong>Plan ' + (ea ? 'A' : 'B') + ' crosses the threshold and Plan ' + (ea ? 'B' : 'A') + ' does not</strong> &mdash; that is the whole of the difference between them.' });
    } else {
      var need = (L.a.stack.value != null && L.b.stack.value != null) ? (L.b.stack.value - L.a.stack.value) : null;
      out.push({ html: need == null || Math.abs(need) < 0.005
        ? 'Neither plan crosses the threshold.'
        : 'Neither plan crosses the threshold; Plan B would need ' + formatBtc(Math.abs(need)) + ' BTC ' + (need > 0 ? 'more' : 'less') + ' than Plan A to get there.' });
    }

    // 3. The bear line, only when the toggle is on — it is the page's own
    //    question and it does not belong in the copy when nobody asked it.
    if (BEAR) {
      out.push({ html: 'With a ' + Math.round(BEAR_SPEC.depthPct * 100) + '% crash in the first year of <em>each</em> plan&rsquo;s retirement, the comparison above is what survives it.' });
    }
    return out;
  }

  /* ═══════════════════════════════════════════════════════════
     THE VERDICT TABLE — A | B | Δ, Δ in sentences.
  ═══════════════════════════════════════════════════════════ */

  function lineCell(axis, ln, scn) {
    if (ln.value == null) return '<span class="crp-no">out of range</span>';
    if (axis === 'stack')  return formatBtc(ln.value) + ' vs ' + formatBtc(scn.btcStack) + ' BTC';
    if (axis === 'income') return formatUsdFull(ln.value) + ' vs ' + formatUsdFull(scn.targetIncomeUSD);
    return ln.value + ' vs ' + scn.retirementYear;
  }

  function verdictRows(ca, cb, L) {
    var hz = sharedHorizon();
    var rows = [];

    // Crosses the threshold
    (function () {
      function cell(c, ln) {
        var yes = c.v.state === 'escape';
        var margin = (ln.stack.value != null) ? (c.scn.btcStack - ln.stack.value) : null;
        return '<span class="' + (yes ? 'crp-yes' : 'crp-no') + '">' + (yes ? 'Yes' : 'No') + '</span>' +
          (margin == null ? '' : '<br><span class="crp-sub">' + (margin >= 0 ? '+' : '&minus;') + formatBtc(Math.abs(margin)) + ' BTC</span>');
      }
      var ea = ca.v.state === 'escape', eb = cb.v.state === 'escape';
      var d;
      if (ea && eb) d = 'Both cross. The margin is the stack each holds above the stack it would need.';
      else if (ea !== eb) d = '<strong>Plan ' + (ea ? 'A' : 'B') + ' crosses; Plan ' + (ea ? 'B' : 'A') + ' does not.</strong>';
      else d = 'Neither crosses within the horizon.';
      rows.push({ label: 'Crosses the threshold', a: cell(ca, L.a), b: cell(cb, L.b), d: d });
    })();

    // Stack needed to escape vs held
    (function () {
      var d;
      if (L.a.stack.value == null || L.b.stack.value == null) d = 'One of the plans needs a stack outside the range this page models.';
      else {
        var gap = L.b.stack.value - L.a.stack.value;
        d = Math.abs(gap) < 0.005
          ? 'Both plans need the same stack to cross.'
          : 'Plan B needs <strong>' + formatBtc(Math.abs(gap)) + ' BTC ' + (gap > 0 ? 'more' : 'less') + '</strong> than Plan A to cross.';
      }
      rows.push({ label: 'Stack needed to cross, vs held', a: lineCell('stack', L.a.stack, ca.scn), b: lineCell('stack', L.b.stack, cb.scn), d: d });
    })();

    // Sustainable withdrawal vs planned
    (function () {
      var d;
      if (L.a.income.value == null || L.b.income.value == null) d = 'One of the plans has no crossing withdrawal inside the range this page models.';
      else {
        var gap = L.b.income.value - L.a.income.value;
        d = Math.abs(gap) < 50
          ? 'Both plans support the same withdrawal at the threshold.'
          : 'Plan B supports <strong>' + formatUsdFull(Math.abs(gap)) + ' a year ' + (gap > 0 ? 'more' : 'less') + '</strong> than Plan A before it stops crossing.';
      }
      rows.push({ label: 'Withdrawal that still crosses, vs planned', a: lineCell('income', L.a.income, ca.scn), b: lineCell('income', L.b.income, cb.scn), d: d });
    })();

    // Earliest crossing year vs chosen
    (function () {
      var d;
      if (L.a.retire.value == null || L.b.retire.value == null) d = 'One of the plans does not cross at any retirement year this page models.';
      else {
        var gap = L.b.retire.value - L.a.retire.value;
        d = gap === 0
          ? 'Both plans could cross from ' + L.a.retire.value + ' at their own stack and draw.'
          : 'At its own stack and draw, Plan B could cross <strong>' + yearsWord(gap) + (gap > 0 ? ' later' : ' earlier') + '</strong> than Plan A.';
      }
      rows.push({ label: 'Earliest year that crosses, vs chosen', a: lineCell('retire', L.a.retire, ca.scn), b: lineCell('retire', L.b.retire, cb.scn), d: d });
    })();

    // Depletes / holds
    (function () {
      function cell(c) {
        return c.v.depletionYear !== null
          ? '<span class="crp-no">' + c.v.depletionYear + '</span>'
          : '<span class="crp-yes">holds</span>';
      }
      var da = ca.v.depletionYear, db = cb.v.depletionYear;
      var d;
      if (da === null && db === null) d = 'Neither plan runs out inside its horizon.';
      else if (da !== null && db !== null) {
        var g = db - da;
        d = g === 0 ? 'Both plans run out in ' + da + '.'
          : 'Plan B holds <strong>' + yearsWord(g) + (g > 0 ? ' longer' : ' less') + '</strong>, running out in ' + db + ' rather than ' + da + '.';
      } else if (da !== null) d = '<strong>Plan A runs out in ' + da + '; Plan B holds through the horizon.</strong>';
      else d = '<strong>Plan B runs out in ' + db + '; Plan A holds through the horizon.</strong>';
      rows.push({ label: 'Depletes / holds', a: cell(ca), b: cell(cb), d: d });
    })();

    // Value at the shared horizon
    (function () {
      var va = realValueAt(ca, hz), vb = realValueAt(cb, hz);
      var d;
      if (va == null || vb == null) d = 'One of the plans has no value to read at ' + hz + '.';
      else {
        var diff = vb - va;
        d = Math.abs(diff) < 1
          ? 'The two plans end level at ' + hz + '.'
          : 'Plan B ends <strong>' + formatCurrencyShort(Math.abs(diff)) + (diff > 0 ? ' higher' : ' lower') + '</strong> at ' + hz + '.';
      }
      rows.push({
        label: 'Value at ' + hz + ' (today&rsquo;s $)',
        a: va == null ? '&mdash;' : formatCurrencyShort(va),
        b: vb == null ? '&mdash;' : formatCurrencyShort(vb),
        d: d
      });
    })();

    return rows;
  }

  /* ═══════════════════════════════════════════════════════════
     THE CHART — design §5, Option 1. Paired balance curves, one job:
     which line holds. Log y per house convention. Hovering a column or
     a legend entry emphasises that plan and dims the other; there is no
     A/B toggle, because comparison requires simultaneity.
  ═══════════════════════════════════════════════════════════ */

  var CHART_FONT = { tick: 12, title: 13, legend: 12 };   // house standard, day one
  var chart = null, EMPHASIS = null;

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  // The curve STOPS at the depletion year rather than running along a clamped
  // floor. A log axis has no zero, so a depleted plan drawn to the end would be
  // a flat line at whatever the clamp happened to be — which reads as "this
  // plan is worth something" for every year after it is worth nothing.
  function seriesFor(c) {
    var out = [];
    for (var i = 0; i < c.proj.points.length; i++) {
      var p = c.proj.points[i];
      if (p.y === null) continue;
      var real = p.y / Math.pow(1 + c.infl / 100, p.x - c.proj.startYear);
      if (c.v.depletionYear !== null && p.x > c.v.depletionYear) break;
      out.push({ x: p.x, y: Math.max(1, real) });
    }
    return out;
  }

  // The one point worth marking on each curve: where the plan escapes, or
  // where it depletes. Nothing else — the flagship owns full model context.
  function markerFor(c, series) {
    var year = (c.v.state === 'escape') ? c.v.escapeYear
      : (c.v.depletionYear !== null ? c.v.depletionYear : null);
    if (year == null) return [];
    for (var i = 0; i < series.length; i++) if (series[i].x === year) return [series[i]];
    return [];
  }

  function renderChart(ca, cb) {
    var el = document.getElementById('crpChart');
    if (!el || !window.Chart) return;
    var cA = cssVar('--crp-a', '#e09422'), cB = cssVar('--crp-b', '#6db3d4');
    var cDim = cssVar('--text-muted', '#6a6256'), cText = cssVar('--text', '#e8e0d4');
    var cGrid = cssVar('--crp-grid', 'rgba(224,148,34,0.07)');
    var cMark = cssVar('--crp-marker', '#d9b36b');

    var sa = seriesFor(ca), sb = seriesFor(cb);
    function alpha(key, base) { return (EMPHASIS && EMPHASIS !== key) ? 0.22 : 1; }

    var data = {
      datasets: [
        { label: 'Plan A', data: sa, borderColor: cA, backgroundColor: cA, borderWidth: 2.2,
          pointRadius: 0, tension: 0.15, order: 2, __key: 'a' },
        { label: 'Plan B', data: sb, borderColor: cB, backgroundColor: cB, borderWidth: 2.2,
          pointRadius: 0, tension: 0.15, order: 2, __key: 'b' },
        { label: 'Plan A — ' + (ca.v.state === 'escape' ? 'crosses' : 'runs out'), data: markerFor(ca, sa),
          borderColor: cMark, backgroundColor: cA, pointRadius: 5, pointStyle: 'circle', showLine: false, order: 1, __key: 'a' },
        { label: 'Plan B — ' + (cb.v.state === 'escape' ? 'crosses' : 'runs out'), data: markerFor(cb, sb),
          borderColor: cMark, backgroundColor: cB, pointRadius: 5, pointStyle: 'circle', showLine: false, order: 1, __key: 'b' }
      ]
    };
    // Emphasis is applied by rewriting alpha on the already-built colours,
    // so the dim state cannot drift from the live state.
    data.datasets.forEach(function (ds) {
      var a = alpha(ds.__key);
      if (a < 1) { ds.borderColor = withAlpha(ds.borderColor, a); ds.backgroundColor = withAlpha(ds.backgroundColor, a); }
    });

    var opts = {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: { type: 'linear',
          title: { display: true, text: 'Year', color: cDim, font: { size: CHART_FONT.title } },
          ticks: { color: cText, font: { size: CHART_FONT.tick }, maxTicksLimit: 10, callback: function (v) { return String(Math.round(v)); } },
          grid: { color: cGrid } },
        y: { type: 'logarithmic',
          title: { display: true, text: 'Stack value, today&rsquo;s $ (log)', color: cDim, font: { size: CHART_FONT.title } },
          ticks: { color: cText, font: { size: CHART_FONT.tick }, callback: function (v) { return formatCurrencyShort(v); } },
          grid: { color: cGrid } }
      },
      plugins: {
        legend: { labels: { color: cText, font: { size: CHART_FONT.legend }, usePointStyle: true, boxWidth: 10, padding: 14 },
          onHover: function (e, item) { setEmphasis(data.datasets[item.datasetIndex].__key); },
          onLeave: function () { setEmphasis(null); } },
        tooltip: {
          callbacks: {
            title: function (items) { return items.length ? String(Math.round(items[0].parsed.x)) : ''; },
            label: function (item) { return item.dataset.label + ': ' + formatCurrencyShort(item.parsed.y); }
          }
        }
      }
    };
    // Axis titles carry an HTML entity in the source string; Chart.js draws raw
    // text, so decode it once rather than shipping "&rsquo;" onto the canvas.
    opts.scales.y.title.text = decodeEntities(opts.scales.y.title.text);

    if (chart) { chart.data = data; chart.options = opts; chart.update('none'); }
    else { chart = new window.Chart(el.getContext('2d'), { type: 'line', data: data, options: opts }); }
  }

  function decodeEntities(s) {
    var t = document.createElement('textarea'); t.innerHTML = s; return t.value;
  }
  function withAlpha(color, a) {
    if (!color) return color;
    if (color.charAt(0) === '#') {
      var h = color.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    }
    if (color.indexOf('rgba(') === 0) return color.replace(/,\s*[\d.]+\)$/, ',' + a + ')');
    if (color.indexOf('rgb(') === 0) return color.replace('rgb(', 'rgba(').replace(')', ',' + a + ')');
    return color;
  }
  // Emphasis is a chart-only affordance, so it redraws the chart and nothing
  // else. Routing it through render() would rewrite every table and sentence
  // on the page on each pointer move, for a change none of them display.
  var LAST_COLS = null;
  function setEmphasis(key) {
    if (EMPHASIS === key) return;
    EMPHASIS = key;
    if (LAST_COLS) renderChart(LAST_COLS[0], LAST_COLS[1]);
  }

  /* ═══════════════════════════════════════════════════════════
     VERIFY THE MATH — the flagship's audit renderer, one per column.
  ═══════════════════════════════════════════════════════════ */

  function renderVerify(c, bodyId, summaryId, linkId) {
    var tb = document.getElementById(bodyId);
    if (!tb) return;
    var rows = c.proj.btcPoints, html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var cls = r.phase === 'retire' ? ' class="rt-row-retire"' : (r.btc <= 0 ? ' class="rt-row-deplete"' : '');
      html += '<tr' + cls + '>' +
        '<td>' + r.x + '</td>' +
        '<td class="rt-phase-' + (r.phase === 'draw' ? 'draw' : 'accum') + '">' + (r.phase === 'accum' ? 'Before' : r.phase === 'retire' ? 'Retire' : 'Draw') + '</td>' +
        '<td class="rt-num">' + formatCurrencyShort(r.price) + '</td>' +
        '<td class="rt-num">' + formatBtc(r.btc + (r.btcSold || 0)) + '</td>' +
        '<td class="rt-num">' + (r.usd == null ? '&mdash;' : formatCurrencyShort(r.usd)) + '</td>' +
        '<td class="rt-num">' + (r.income == null ? '&mdash;' : formatCurrencyShort(r.income)) + '</td>' +
        '<td class="rt-num">' + (r.btcSold == null ? '&mdash;' : r.btcSold.toFixed(3)) + '</td>' +
        '<td class="rt-num">' + formatBtc(r.btc) + '</td>' +
        '</tr>';
    }
    tb.innerHTML = html;

    var sm = document.getElementById(summaryId);
    if (sm) {
      sm.innerHTML = '<strong>' + formatBtc(c.scn.btcStack) + ' BTC</strong>, retiring <strong>' + c.scn.retirementYear +
        '</strong>, drawing <strong>' + formatUsdFull(c.scn.targetIncomeUSD) + '</strong> a year in today&rsquo;s dollars over ' +
        yearsWord(c.scn.yearsInRetirement) + '. Inflation ' + MA.get('inflation').value + '%, growth ' +
        MA.get('btcGrowthModel').preset.replace('powerlaw-', 'Power Law ') + (BEAR ? ', with the bear-market test on' : '') + '.';
    }
    var lk = document.getElementById(linkId);
    if (lk) lk.setAttribute('href', flagshipHref(c.scn));
  }

  /* ═══════════════════════════════════════════════════════════
     CARRY (design §6). Senders speak the receiver's vocabulary — the
     retirement family's existing param names, verified against the
     Stress Test's own reader: stack / retire / income / years /
     incbasis. NOT a_/b_ (that namespace is this page's own).
  ═══════════════════════════════════════════════════════════ */

  function familyParams(scn) {
    return 'stack=' + scn.btcStack + '&retire=' + scn.retirementYear +
           '&income=' + Math.round(scn.targetIncomeUSD) + '&years=' + scn.yearsInRetirement +
           '&incbasis=' + scn.incomeBasis;
  }
  function flagshipHref(scn) { return '/the-bitcoin-retirement?' + familyParams(scn); }
  function stressHref(scn) { return '/the-bitcoin-retirement-stress-test?' + familyParams(scn); }
  function evHref(scn) { return '/bitcoin-escape-velocity?' + familyParams(scn); }

  // Which column the "stress-test the winner" link carries. There is no
  // winner-crowning in the copy, so the rule is stated plainly instead: the
  // plan that holds, or — when both or neither hold — Plan A.
  function carryColumn(ca, cb) {
    var ha = ca.v.depletionYear === null, hb = cb.v.depletionYear === null;
    if (ha && !hb) return ca;
    if (hb && !ha) return cb;
    var ea = ca.v.state === 'escape', eb = cb.v.state === 'escape';
    if (ea && !eb) return ca;
    if (eb && !ea) return cb;
    return ca;
  }

  /* ═══════════════════════════════════════════════════════════
     URL STATE (design §6) — namespaced from commit one, because
     retrofitting a namespace breaks every link already shared.
  ═══════════════════════════════════════════════════════════ */

  var URL_MAP = { stack: 'btcStack', retire: 'retirementYear', income: 'targetIncomeUSD' };
  var _suppressUrlWrite = true, _urlT = null;

  function readUrl() {
    if (!window.URLSearchParams) return;
    var p = new URLSearchParams(window.location.search);
    var sawB = false;
    ['a', 'b'].forEach(function (col) {
      Object.keys(URL_MAP).forEach(function (short) {
        var name = col + '_' + short;
        if (!p.has(name)) return;
        var v = parseFloat(p.get(name));
        if (!isFinite(v)) return;
        if (col === 'b') sawB = true;
        setValue(col, URL_MAP[short], v, true);
      });
    });
    // A link that carries only Plan A (a sender from the flagship or EV) must
    // still open on a meaningful comparison, so Plan B re-derives from the
    // arriving Plan A rather than sitting on the shipped default.
    if (!sawB && (p.has('a_stack') || p.has('a_retire') || p.has('a_income'))) {
      PLANS.b = planFrom(PLANS.a, { retirementYear: clamp(PLANS.a.retirementYear + 1, LIMITS.retirementYear.min, LIMITS.retirementYear.max) });
    }
    // Also accept the family's un-namespaced params as Plan A, so an existing
    // retirement-family link opens here without translation.
    Object.keys(URL_MAP).forEach(function (short) {
      if (p.has(short) && !p.has('a_' + short)) {
        var v = parseFloat(p.get(short));
        if (isFinite(v)) { setValue('a', URL_MAP[short], v, true); PLANS.b[URL_MAP[short]] = PLANS.a[URL_MAP[short]]; }
      }
    });
    if (p.has('bear')) BEAR = (p.get('bear') === '1' || p.get('bear') === 'true');
  }

  function syncUrl() {
    if (_suppressUrlWrite || !window.URLSearchParams || !window.history || !window.history.replaceState) return;
    if (_urlT) clearTimeout(_urlT);
    _urlT = setTimeout(function () {
      var p = new URLSearchParams();
      ['a', 'b'].forEach(function (col) {
        Object.keys(URL_MAP).forEach(function (short) {
          var key = URL_MAP[short], v = PLANS[col][key];
          p.set(col + '_' + short, (key === 'btcStack') ? String(Math.round(v * 1e6) / 1e6) : String(Math.round(v)));
        });
      });
      if (BEAR) p.set('bear', '1');
      window.history.replaceState(null, '', window.location.pathname + '?' + p.toString());
    }, 250);
  }

  /* ═══════════════════════════════════════════════════════════
     CONTROLS
  ═══════════════════════════════════════════════════════════ */

  function setValue(col, key, raw, silent) {
    var lim = LIMITS[key];
    var v = raw;
    if (key === 'retirementYear') v = Math.round(v);
    else if (key === 'targetIncomeUSD') v = Math.round(v);
    else v = Math.round(v * 1e6) / 1e6;
    PLANS[col][key] = clamp(v, lim.min, lim.max);
    if (!silent) { render(); syncUrl(); }
  }
  function nudge(col, key, dir) {
    setValue(col, key, PLANS[col][key] + dir * STEP[key]);
  }

  function parseEntry(key, text) {
    var t = String(text).replace(/[$,\s]/g, '').replace(/btc/i, '');
    var v = parseFloat(t);
    return isFinite(v) ? v : null;
  }

  function wireSteppers() {
    document.querySelectorAll('.crp-stepper').forEach(function (el) {
      var col = el.getAttribute('data-col'), key = el.getAttribute('data-key');
      el.querySelectorAll('.crp-step-btn').forEach(function (b) {
        var dir = parseInt(b.getAttribute('data-dir'), 10);
        bindHoldRepeat(b, function () { nudge(col, key, dir); });
      });
      var valBtn = el.querySelector('[data-role="value"]');
      if (!valBtn) return;
      valBtn.addEventListener('click', function () {
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'crp-stepper-entry';
        input.value = (key === 'btcStack') ? String(PLANS[col][key]) : String(Math.round(PLANS[col][key]));
        input.setAttribute('aria-label', valBtn.getAttribute('aria-label') || 'value');
        valBtn.replaceWith(input);
        input.focus(); input.select();
        function close(commit) {
          if (commit) { var v = parseEntry(key, input.value); if (v != null) setValue(col, key, v, true); }
          input.replaceWith(valBtn);
          render(); syncUrl();
        }
        input.addEventListener('blur', function () { close(true); });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); close(true); }
          else if (e.key === 'Escape') { e.preventDefault(); close(false); }
        });
      });
    });
  }

  function bindHoldRepeat(btn, fn) {
    var holdTimer = null, repeatTimer = null;
    function stop() { clearTimeout(holdTimer); clearInterval(repeatTimer); holdTimer = repeatTimer = null; }
    btn.addEventListener('pointerdown', function () {
      holdTimer = setTimeout(function () { repeatTimer = setInterval(fn, 110); }, 420);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) { btn.addEventListener(t, stop); });
    btn.addEventListener('click', function () { if (!repeatTimer) fn(); });
  }

  function wireControls() {
    var bear = document.getElementById('crpBearToggle');
    if (bear) bear.addEventListener('change', function () { BEAR = bear.checked; render(); syncUrl(); });

    var copy = document.getElementById('crpCopyAtoB');
    if (copy) copy.addEventListener('click', function () {
      PLANS.b = planFrom(PLANS.a);
      render(); syncUrl();
    });

    var reset = document.getElementById('crpReset');
    if (reset) reset.addEventListener('click', function () {
      PLANS.a = planFrom(DEFAULT_A);
      PLANS.b = planFrom(DEFAULT_A, { retirementYear: DEFAULT_A.retirementYear + 1 });
      BEAR = false;
      if (bear) bear.checked = false;
      if (window.history && window.history.replaceState) window.history.replaceState(null, '', window.location.pathname);
      render();
    });

    document.querySelectorAll('#crpSwitcher .seg-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        EDIT_COL = b.getAttribute('data-editcol');
        document.querySelectorAll('#crpSwitcher .seg-btn').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        applyEditCol();
      });
    });

    [['crpVerifyToggleA', 'crpVerifyBodyA'], ['crpVerifyToggleB', 'crpVerifyBodyB']].forEach(function (pair) {
      var t = document.getElementById(pair[0]), b = document.getElementById(pair[1]);
      if (!t || !b) return;
      t.addEventListener('click', function () {
        var open = t.getAttribute('aria-expanded') === 'true';
        t.setAttribute('aria-expanded', open ? 'false' : 'true');
        b.hidden = open;
      });
    });

    // Hovering a column emphasises its curve — the design's "inspection
    // without a toggle". Pointer only; it must never gate information.
    [['crpColA', 'a'], ['crpColB', 'b']].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!el) return;
      el.addEventListener('pointerenter', function () { setEmphasis(pair[1]); });
      el.addEventListener('pointerleave', function () { setEmphasis(null); });
    });
  }

  function applyEditCol() {
    ['a', 'b'].forEach(function (col) {
      var el = document.getElementById(col === 'a' ? 'crpColA' : 'crpColB');
      if (el) el.setAttribute('data-editing', String(col === EDIT_COL));
    });
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */

  function render() {
    var ca = computeCol('a'), cb = computeCol('b');
    var L = allLines(ca, cb);
    LAST_COLS = [ca, cb];

    // steppers
    document.querySelectorAll('.crp-stepper').forEach(function (el) {
      var col = el.getAttribute('data-col'), key = el.getAttribute('data-key');
      var v = el.querySelector('[data-role="value"]');
      if (v) v.textContent = displayValue(key, PLANS[col]);
    });

    var va = document.getElementById('crpVerdictA'), vb = document.getElementById('crpVerdictB');
    if (va) va.innerHTML = colVerdictHtml(ca);
    if (vb) vb.innerHTML = colVerdictHtml(cb);

    // shared card
    var sm = document.getElementById('crpSharedSummary');
    if (sm) {
      sm.textContent = 'Power Law trend · inflation ' + MA.get('inflation').value + '% · ' +
        yearsWord(PLANS.a.yearsInRetirement) + ' horizon' + (BEAR ? ' · bear-market test on' : '');
    }
    var spec = document.getElementById('crpBearSpec');
    if (spec) {
      var rec = CM.RECOVERY[BEAR_SPEC.recoveryPreset] || CM.RECOVERY.historical;
      spec.textContent = '−' + Math.round(BEAR_SPEC.depthPct * 100) + '%, ' + rec.label.toLowerCase() + ' recovery (' + rec.note + ')';
    }

    // chart + its copy
    renderChart(ca, cb);
    var lead = document.getElementById('crpChartLead');
    if (lead) {
      var clause = differenceClause();
      lead.innerHTML = clause
        ? clause + ' &mdash; the two curves below are the same plan under two different choices, in today&rsquo;s dollars on a log scale.'
        : 'Both plans are identical, so the curves sit on top of one another. Change one of Plan B&rsquo;s inputs to separate them.';
    }
    var cap = document.getElementById('crpChartCaption');
    if (cap) {
      cap.innerHTML = 'Each curve is one plan&rsquo;s stack value in today&rsquo;s dollars, from retirement to the end of its horizon. The marked point is where a plan crosses the threshold, or where it runs out. Log scale &mdash; equal vertical distances are equal <em>ratios</em>, not equal dollars.';
    }

    // delta strip
    var dl = document.getElementById('crpDeltaList');
    if (dl) {
      dl.innerHTML = deltaSentences(ca, cb, L).map(function (s) {
        return '<li' + (s.plain ? ' class="crp-delta-none"' : '') + '>' + s.html + '</li>';
      }).join('');
    }

    // verdict table
    var tb = document.getElementById('crpVerdictRows');
    if (tb) {
      tb.innerHTML = verdictRows(ca, cb, L).map(function (r) {
        return '<tr><th scope="row">' + r.label + '</th><td>' + r.a + '</td><td>' + r.b + '</td>' +
               '<td class="crp-delta-cell">' + r.d + '</td></tr>';
      }).join('');
    }

    // verify tables
    renderVerify(ca, 'crpVerifyRowsA', 'crpVerifySummaryA', 'crpFlagshipLinkA');
    renderVerify(cb, 'crpVerifyRowsB', 'crpVerifySummaryB', 'crpFlagshipLinkB');

    // carry links
    var carry = carryColumn(ca, cb);
    var st = document.getElementById('crpStressLink');
    if (st) st.setAttribute('href', stressHref(carry.scn));
    var sc = document.getElementById('crpStressCarry');
    if (sc) sc.textContent = 'Carries Plan ' + carry.key.toUpperCase() + '.';
    var ev = document.getElementById('crpEvLink');
    if (ev) ev.setAttribute('href', evHref(PLANS.a));
  }

  /* ═══════════════════════════════════════════════════════════
     PARITY QA (design §8.2)

     (a) identical inputs in A and B produce identical outputs;
     (b) each column's outputs match the flagship/EV engines for the
         same inputs — asserted against GOLDEN VECTORS captured from the
         deployed Escape Velocity page (see the note below);
     (c) both columns read the same shared constants object.

     On (b): EV's engine lives inside that page's IIFE and is not
     callable from here, so the assertion is made against values read
     off the live page rather than by calling into it. When the three
     existing family pages are repointed at shared/retirement-engine.js
     (the filed follow-up), this should become a direct call and the
     golden table should be deleted rather than maintained.
  ═══════════════════════════════════════════════════════════ */

  /* GOLDEN VECTORS — captured 2026-08-26 from the deployed Escape Velocity
     page at https://lastcoinstanding.com/bitcoin-escape-velocity, one
     navigation per row (?stack=&retire=&income=), reading that page's own
     rendered verdict, horizon value and three threshold lines. Basis:
     reverts-to-trend; inflation and growth at their shipped defaults.

     TWO TIERS, AND THE REASON. The engine's price at year Y runs through
     dateForYear(Y), which is built from TODAY's month and day — so every
     dollar figure and every solved threshold drifts a little each day and
     steps when the calendar year rolls over. Asserting those as exact
     equalities would produce a tripwire that fails for the calendar rather
     than for a defect, which is worse than no tripwire.

       · `state` / `escapeYear` / `turnYear` / `depletionYear` / whether a
         threshold is in range are STRUCTURAL — integers and enums that move
         only when a plan actually crosses something. These FAIL the run.
       · `valueAtHorizon` and the three threshold VALUES are drift-prone.
         These WARN with the measured-vs-captured pair, so a real engine
         change is still visible without crying wolf on the date.

     When the three existing family pages are repointed at
     shared/retirement-engine.js (the filed follow-up), assertion (b) should
     become a direct call into the same module and this table should be
     deleted rather than maintained. */
  var GOLDEN_CAPTURED = '2026-08-26';
  var GOLDEN = [
    { stack: 1.0, income: 100000, retire: 2035, state: 'shrink',  turnYear: 2056, depletionYear: null, horizon: 2065, value: '$1.33M',  stackLine: 1.11, incomeLine: 90500,  retireLine: 2037 },
    { stack: 2.0, income: 100000, retire: 2035, state: 'escape',  escapeYear: 2036, depletionYear: null, horizon: 2065, value: '$12.28M', stackLine: 1.11, incomeLine: 181100, retireLine: 2030 },
    { stack: 0.5, income: 100000, retire: 2035, state: 'deplete', depletionYear: 2044, horizon: 2065, value: '$0',     stackLine: 1.11, incomeLine: 45200,  retireLine: null },
    { stack: 1.0, income: 50000,  retire: 2035, state: 'escape',  escapeYear: 2036, depletionYear: null, horizon: 2065, value: '$6.14M',  stackLine: 0.56, incomeLine: 90500,  retireLine: 2030 },
    { stack: 1.0, income: 200000, retire: 2035, state: 'deplete', depletionYear: 2044, horizon: 2065, value: '$0',     stackLine: 2.21, incomeLine: 90500,  retireLine: null },
    { stack: 1.0, income: 100000, retire: 2045, state: 'escape',  escapeYear: 2046, depletionYear: null, horizon: 2075, value: '$8.96M',  stackLine: 0.68, incomeLine: 148600, retireLine: 2037 }
  ];

  window.crpParityQA = function () {
    var failures = [];
    var infl = MA.get('inflation').value;

    // (c) one constants object, read by both columns.
    if (!E || !E.LIMITS) failures.push('c/engine: window.RetirementEngine.LIMITS missing');
    if (E.LIMITS !== LIMITS) failures.push('c/constants: page LIMITS is not the engine LIMITS object');
    var savedA = planFrom(PLANS.a), savedB = planFrom(PLANS.b), savedBear = BEAR;

    // (a) identical inputs → identical outputs, bear off AND bear on.
    [false, true].forEach(function (bearState) {
      BEAR = bearState;
      GOLDEN.forEach(function (g, i) {
        PLANS.a = planFrom(DEFAULT_A, { btcStack: g.stack, targetIncomeUSD: g.income, retirementYear: g.retire });
        PLANS.b = planFrom(PLANS.a);
        var ca = computeCol('a'), cb = computeCol('b');
        if (ca.v.state !== cb.v.state) failures.push('a/vec' + i + '/bear' + bearState + ': states differ (' + ca.v.state + ' vs ' + cb.v.state + ')');
        if (ca.v.escapeYear !== cb.v.escapeYear) failures.push('a/vec' + i + '/bear' + bearState + ': escapeYear differs');
        if (ca.v.depletionYear !== cb.v.depletionYear) failures.push('a/vec' + i + '/bear' + bearState + ': depletionYear differs');
        if (Math.abs(ca.v.valueAtHorizon - cb.v.valueAtHorizon) > 1e-6) failures.push('a/vec' + i + '/bear' + bearState + ': valueAtHorizon differs');
        var la = E.lineFor('stack', ca.scn, BASIS, multFor), lb = E.lineFor('stack', cb.scn, BASIS, multFor);
        if (la.value !== lb.value) failures.push('a/vec' + i + '/bear' + bearState + ': stack threshold differs (' + la.value + ' vs ' + lb.value + ')');
      });
    });

    // (b) this page's columns reproduce the family's answers.
    //   b1 — against the DEPLOYED Escape Velocity page's own output (golden).
    //   b2 — internal identities that must hold for the port to be the port:
    //        memo ≡ raw, and the multFn path with a flat multiplier ≡ scalar.
    var drift = [];
    BEAR = false;
    GOLDEN.forEach(function (g, i) {
      var scn = planFrom(DEFAULT_A, { btcStack: g.stack, targetIncomeUSD: g.income, retirementYear: g.retire });
      var proj = E.projectForBasis(scn, BASIS, false, null);
      var v = E.computeVerdict(proj, scn, infl);
      var tag = 'b1/vec' + i + ' (' + g.stack + ' BTC, ' + g.income + ', ' + g.retire + ')';

      // structural — these fail
      if (v.state !== g.state) failures.push(tag + ': state ' + v.state + ', EV said ' + g.state);
      if (v.horizonYear !== g.horizon) failures.push(tag + ': horizon ' + v.horizonYear + ', EV said ' + g.horizon);
      if ((v.depletionYear || null) !== (g.depletionYear || null)) failures.push(tag + ': depletionYear ' + v.depletionYear + ', EV said ' + g.depletionYear);
      if (g.escapeYear != null && v.escapeYear !== g.escapeYear) failures.push(tag + ': escapeYear ' + v.escapeYear + ', EV said ' + g.escapeYear);
      if (g.turnYear != null && v.turnYear !== g.turnYear) failures.push(tag + ': turnYear ' + v.turnYear + ', EV said ' + g.turnYear);

      var ls = E.lineFor('stack', scn, BASIS, null);
      var li = E.lineFor('income', scn, BASIS, null);
      var lr = E.lineFor('retire', scn, BASIS, null);
      // in-range-ness is structural; the values are not
      if ((lr.value == null) !== (g.retireLine == null)) failures.push(tag + ': retire threshold in-range disagrees with EV');

      // drift-prone — these warn
      function near(got, want, tol) { return want == null || got == null ? got == want : Math.abs(got - want) <= Math.abs(want) * tol; }
      if (formatCurrencyShort(v.valueAtHorizon) !== g.value) drift.push(tag + ': value ' + formatCurrencyShort(v.valueAtHorizon) + ' vs EV ' + g.value);
      if (!near(ls.value, g.stackLine, 0.05)) drift.push(tag + ': stack threshold ' + ls.value + ' vs EV ' + g.stackLine);
      if (!near(li.value, g.incomeLine, 0.05)) drift.push(tag + ': withdrawal threshold ' + li.value + ' vs EV ' + g.incomeLine);
      if (lr.value != null && g.retireLine != null && lr.value !== g.retireLine) drift.push(tag + ': earliest year ' + lr.value + ' vs EV ' + g.retireLine);

      // b2 — internal identities
      var viaRaw = E.projectStackOverTime(scn, MA.get('btcGrowthModel').preset, infl, 1);
      if (proj.depletionYear !== viaRaw.depletionYear) failures.push('b2/vec' + i + ': memo and raw depletionYear differ');
      for (var k = 0; k < viaRaw.points.length; k++) {
        var m = proj.points[k] && proj.points[k].y, r = viaRaw.points[k].y;
        if ((m === null) !== (r === null) || (m !== null && Math.abs(m - r) > 1e-6)) { failures.push('b2/vec' + i + ': memo and raw series differ at ' + viaRaw.points[k].x); break; }
      }
      var viaMult = E.projectWithMultFn(scn, MA.get('btcGrowthModel').preset, infl, function () { return 1; });
      if (viaMult.depletionYear !== viaRaw.depletionYear) failures.push('b2/vec' + i + ': multFn identity broke depletionYear');
      for (var j = 0; j < viaRaw.points.length; j++) {
        var a2 = viaMult.points[j].y, b2 = viaRaw.points[j].y;
        if ((a2 === null) !== (b2 === null) || (a2 !== null && Math.abs(a2 - b2) > 1e-6)) { failures.push('b2/vec' + i + ': multFn identity broke the series'); break; }
      }
    });

    PLANS.a = savedA; PLANS.b = savedB; BEAR = savedBear;
    LINE_KEY = null;
    render();

    if (drift.length) {
      console.warn('crpParityQA DRIFT (expected as the calendar moves; golden captured ' + GOLDEN_CAPTURED + ')', drift);
    }
    if (!failures.length) {
      console.log('%ccrpParityQA PASS', 'color:#7fc47f;font-weight:600',
        '(' + GOLDEN.length + ' vectors × 2 bear states A≡B; ' + GOLDEN.length +
        ' vectors vs deployed Escape Velocity; memo/raw/multFn identities hold' +
        (drift.length ? '; ' + drift.length + ' drift warning' + (drift.length === 1 ? '' : 's') : '') + ')');
      return true;
    }
    console.error('crpParityQA FAIL', failures);
    return false;
  };

  /* ═══════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════ */

  /* The mobile A/B switcher is sticky under the site nav. A hardcoded offset is
     the documented way this breaks (SITE_GUIDE §47 — nav height moved 65→90px
     and every hardcoded offset went with it), so the nav is MEASURED into a
     CSS var and re-measured on resize. The stylesheet keeps a fallback for the
     case where the nav is absent. */
  function measureSticky() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;
    var h = Math.round(nav.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty('--lcs-sticky-top', h + 'px');
  }

  function init() {
    readUrl();
    var bear = document.getElementById('crpBearToggle');
    if (bear) bear.checked = BEAR;
    measureSticky();
    window.addEventListener('resize', measureSticky);
    wireSteppers();
    wireControls();
    applyEditCol();
    render();
    _suppressUrlWrite = false;

    // The live quote lands after first paint; the trend basis does not use it,
    // but currentRatio() and the flagship link do, so re-render once it is in.
    if (typeof fetchTodayPrice === 'function') {
      fetchTodayPrice(function () { LINE_KEY = null; render(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
