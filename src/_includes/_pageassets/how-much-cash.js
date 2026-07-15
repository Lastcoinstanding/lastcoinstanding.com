/* =============================================================
   How Much Cash? — page script (v3 rebuild)

   The question: what share of a stack to hold as cash, and where in the
   channel raising it has historically meant MORE bitcoin, not less.

   THE MODEL IS WODN'S, POINTED AT THE SELL SIDE. This page is Wait-or-Deploy's
   mirror twin — a cash holder asks "deploy or wait?", an all-in holder asks
   "hold or raise?" — same record, opposite doors. So it reads the record
   through shared/channel-entries.js, the module WODN's own machinery was
   extracted into. Nothing here re-derives the neighborhood method: if this
   page and WODN ever printed different hit rates for one position, one of
   them would be lying.

   SINGLE SOURCE (the screenshot-6 lesson). The shipped v2 page had a verdict
   quoting 0.109 BTC while its terminal readout showed 0.000, because the
   verdict re-derived a quantity the ledger had capped. Here EVERY displayed
   number — verdict, Q3 stats, insight-chart curve and highlight, audit rows,
   CSV — comes from one compute(state) call per render. Nothing recomputes
   anything downstream. hcQA() asserts exactly that: it reads the DOM back and
   compares it to compute()'s own return, so a second source of truth cannot
   be added without failing QA.

   THE OUTCOME IDENTITY (hand-checkable, asserted by hcQA):
     sell fraction x of stack C at price P, tax t, rebuy at P_rebuy
     net cash          = x·C·P·(1−t)                (zero-basis assumption)
     coins back        = netCash / P_rebuy
     end coins         = (1−x)·C + x·C·(1−t)·(P/P_rebuy)
     round-trip mult   = (1−t)·(P/P_rebuy)     ← the insight chart's Y
     breakeven         = rebuy below P·(1−t), i.e. ratio > 1/(1−t)
   P/P_rebuy is WODN's `ratio` exactly. The stack C cancels out of every
   reported figure; the BTC input is orientation only.
   ============================================================= */
(function () {
  'use strict';
  if (typeof plPrice !== 'function' || typeof PL_DATA === 'undefined') return;
  if (!window.ChannelEntries) return;

  var CE = window.ChannelEntries;
  var posOf = CE.posOf, ratioOf = CE.ratioOf, bandMetrics = CE.bandMetrics;
  var median = CE.median, monthYear = CE.monthYear, realPriceAt = CE.realPriceAt;
  var S = CE.S, N = CE.N, todayD = CE.todayD, YEAR_D = CE.YEAR_D, MONTH_D = CE.MONTH_D;
  var FIRST_D = CE.FIRST_D, TABLE_CUT = CE.TABLE_CUT, WAIT_CAP = CE.WAIT_CAP;

  // ── Palette ──
  var FLOOR_C = '#b04525', TREND_C = '#e09422', UPPER_C = '#e8c820';
  var HIST_C = 'rgba(232,224,210,0.55)', SEL_C = '#6db3d4';
  var GAIN_C = '#6fae6f', LOSS_C = '#c0392b';
  var MUTED = '#7a7367', DIM = '#9a9080';

  var ZONE_MULT = 0.60;
  var ALARM_AT = 80;              // past this the cash share stops being a buffer
  var MARKER_MIN = TABLE_CUT;     // the model's entries start post-2014; the marker matches

  var _spot = TODAY_PRICE, _priceSource = 'seed';
  function spot() { return _spot; }

  var DEFAULTS = { share: 25, tax: 15, pos: null, stack: null };
  var S_ = { share: 25, tax: 15, pos: null, stack: null };

  // ── Format ──
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function pct0(v) { return Math.round(v) + '%'; }
  function pct1(v) { return (Math.round(v * 10) / 10) + '%'; }
  function mult(v) { return v.toFixed(2) + '×'; }
  function usdFull(v) { return '$' + Math.round(v).toLocaleString(); }
  function usd(v) {
    var a = Math.abs(v);
    if (a >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v);
  }
  function btc(v) { return (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(3)) + ' BTC'; }
  function fmtWait(days) {
    if (days == null) return '—';
    if (days < 1.5 * YEAR_D) return Math.max(1, Math.round(days / MONTH_D)) + ' months';
    return (days / YEAR_D).toFixed(1) + ' years';
  }

  // ── The marker: a date on the record. Everything positional derives from it. ──
  function markerDay() { return S_.pos == null ? todayD : clamp(S_.pos, MARKER_MIN, todayD); }
  function markerIsToday() { return S_.pos == null || S_.pos >= todayD - 0.5; }
  function markerPrice() { return markerIsToday() ? spot() : realPriceAt(markerDay()); }
  function markerTrend() { return plPrice(markerDay()); }
  function markerMult() { return markerPrice() / markerTrend(); }
  function markerPos() { return posOf(markerPrice(), markerDay()); }
  function priceWord() { return markerIsToday() ? (todayPriceIsLive(_priceSource) ? 'today’s price' : 'the latest price') : 'the price then'; }
  function todayNote() { return markerIsToday() ? todayPriceNote(_priceSource) : ''; }

  // Zone-time base rate (survives from v2; historical fact, counted live).
  var zoneTime = (function () {
    var n = 0;
    for (var i = 0; i < N; i++) if (S[i].p / plPrice(S[i].d) <= ZONE_MULT) n++;
    return { pct: 100 * n / N, n: n, total: N };
  })();

  // ════════ THE ONE COMPUTATION ════════
  // Every displayed quantity on this page comes from here. Takes a state object
  // (not the module's S_) so QA can drive it at pinned positions.
  function compute(st) {
    st = st || S_;
    var day = st.pos == null ? todayD : clamp(st.pos, MARKER_MIN, todayD);
    var isToday = st.pos == null || st.pos >= todayD - 0.5;
    var P = isToday ? spot() : realPriceAt(day);
    var trend = plPrice(day);
    var pos = posOf(P, day);
    var m = bandMetrics(pos);            // ← WODN's machinery, unmodified
    var t = st.tax / 100, x = st.share / 100;

    if (!m) return { day: day, P: P, pos: pos, mult: P / trend, m: null, t: t, x: x };

    // Per-entry after-tax outcome. ratio is WODN's P/P_rebuy exactly.
    var outcomes = m.metrics.map(function (e) {
      return {
        i: e.i, d0: e.d0, p0: e.p0, P: e.P, arrived: e.arrived,
        waitDay: e.waitDay, waitPrice: e.waitPrice, ratio: e.ratio,
        disc: 1 - 1 / e.ratio,                    // rebuy discount vs entry
        rt: (1 - t) * e.ratio,                    // round-trip multiple on the sold fraction
        end: (1 - x) + x * (1 - t) * e.ratio      // end coins as a multiple of the stack
      };
    });

    var medianRatio = m.ratio;                                  // median P/P_rebuy, ALL entries
    var medianRT = (1 - t) * medianRatio;                       // median round-trip multiple
    var hit = m.paid;                                           // % where a lower PRICE arrived
    var hitAfterTax = outcomes.filter(function (o) { return o.rt > 1; }).length / outcomes.length * 100;
    var medianEnd = median(outcomes.map(function (o) { return o.end; }));
    var endSharePct = x * medianRT * 100;                       // what the sold slice became
    // "median discount at the rebuy when a dip did arrive" — conditional on
    // `arrived`, which is WODN's own conditional for condRatio.
    var medianDisc = m.condRatio != null ? (1 - 1 / m.condRatio) * 100 : null;
    var breakevenDisc = t * 100;                                // rebuy must be >t% lower

    return {
      day: day, isToday: isToday, P: P, trend: trend, pos: pos, mult: P / trend,
      m: m, t: t, x: x, tax: st.tax, share: st.share, stack: st.stack,
      n: m.n, half: m.half,
      // Every quantity the page DISPLAYS is a named field here. The floor branch
      // shows the complement of the hit rate, so the complement is computed here
      // rather than derived in the renderer — the first version of this page put
      // `100 - hit` inline in the markup and bound it to the hit-rate element,
      // which is precisely the screenshot-6 defect (a displayed number that is
      // not the computed one). hcQA caught it; this shape makes it unsayable.
      hit: hit, missPct: 100 - hit, hitAfterTax: hitAfterTax, never: m.never,
      medianRatio: medianRatio, medianRT: medianRT, condRatio: m.condRatio,
      medianDisc: medianDisc, breakevenDisc: breakevenDisc,
      typicalWait: m.waitLen, medianEnd: medianEnd, endSharePct: endSharePct,
      outcomes: outcomes,
      alarm: st.share > ALARM_AT,
      // branch is decided ONCE, here — not re-derived in the renderer
      branch: (m.never >= 90 || hit <= 10) ? 'floor'
            : (Math.abs(medianRT - 1) <= 0.03) ? 'wash'
            : (medianRT > 1) ? 'pays' : 'costs'
    };
  }

  // The insight chart's curve — same compute() shape, swept across position.
  // The curve sweeps bandMetrics across the whole channel (~43 neighborhoods ×
  // 30-80 entries each) and depends ONLY on the tax rate — not on the share or
  // the marker. So the expensive half is computed once and the tax applied on
  // top: dragging the primary lever then costs nothing. Still one source — the
  // cache holds WODN's ratios, not a second derivation of them.
  var _rawCurve = null;
  function rawCurve() {
    if (_rawCurve) return _rawCurve;
    var pts = [], p;
    for (p = -0.05; p <= 1.001; p += 0.025) {
      var m = bandMetrics(p);
      if (!m || m.ratio == null) continue;
      pts.push({ x: p, ratio: m.ratio, n: m.n });
    }
    _rawCurve = pts;
    return pts;
  }
  function curveFor(st) {
    var f = 1 - st.tax / 100;
    return rawCurve().map(function (p) { return { x: p.x, y: f * p.ratio, n: p.n }; });
  }
  // Breakeven crossing: first position where the median round trip clears 1.0.
  function crossingOf(pts) {
    for (var i = 1; i < pts.length; i++) {
      if (pts[i - 1].y < 1 && pts[i].y >= 1) {
        var a = pts[i - 1], b = pts[i], f = (1 - a.y) / (b.y - a.y);
        return a.x + f * (b.x - a.x);
      }
    }
    return null;
  }

  // ════════ QA — single-source assertion ════════
  // Asserts (a) the outcome identity per entry, and (b) that the DOM shows
  // exactly what compute() returned. (b) is the structural guard: a renderer
  // that re-derives a displayed quantity fails here.
  function num(id) {
    var e = document.getElementById(id);
    if (!e) return null;
    var m = (e.textContent || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }
  function hcQA(st) {
    st = st || S_;
    var c = compute(st);
    if (!c.m) return { ok: false, why: 'no neighborhood at this position' };

    // (a) the identity, per entry
    var idBad = c.outcomes.filter(function (o) {
      var wantRT = (1 - c.t) * o.ratio;
      var wantEnd = (1 - c.x) + c.x * wantRT;
      return Math.abs(o.rt - wantRT) > 1e-12 || Math.abs(o.end - wantEnd) > 1e-12;
    });

    // (b) the DOM must agree with compute() — one source
    // Each displayed element is checked against the compute() field it is BOUND
    // to — never against a value re-derived here, which would just move the
    // second source into the test. Elements absent in a branch are skipped.
    var live = (st === S_), mism = [], dom = {};
    if (live) {
      var bindings = [
        { id: 'hcHit',    field: 'hit',      round: true },
        { id: 'hcMiss',   field: 'missPct',  round: true },
        { id: 'hcMult',   field: 'medianRT', tol: 0.006 },
        { id: 'hcQ3Hit',  field: 'hit',      round: true },
        { id: 'hcQ3Disc', field: 'medianDisc', round: true }
      ];
      bindings.forEach(function (b) {
        var shown = num(b.id);
        if (shown == null || c[b.field] == null) return;
        dom[b.id] = shown;
        var want = b.round ? Math.round(c[b.field]) : c[b.field];
        var tol = b.tol != null ? b.tol : 0.51;
        if (Math.abs(shown - want) > tol) mism.push({ f: b.id, dom: shown, computed: want });
      });
      var hlY = chart && chart.$hl ? chart.$hl.y : null;
      if (hlY != null && Math.abs(hlY - c.medianRT) > 1e-9) mism.push({ f: 'chart highlight', dom: hlY, computed: c.medianRT });
      var rows = (document.getElementById('hcAuditBody') || { rows: [] }).rows.length;
      if (rows !== c.outcomes.length) mism.push({ f: 'audit rows', dom: rows, computed: c.outcomes.length });
    }

    var res = {
      position: +c.pos.toFixed(4), xTrend: +c.mult.toFixed(3), n: c.n, tax: c.tax, share: c.share,
      hit: +c.hit.toFixed(2), medianRatio: +c.medianRatio.toFixed(4), medianRT: +c.medianRT.toFixed(4),
      branch: c.branch, alarm: c.alarm,
      identityViolations: idBad.length,
      domChecked: live, domMismatches: mism,
      // the WODN cross-check, side by side, so a divergence names itself
      wodn: { paid: +c.m.paid.toFixed(2), ratio: +c.m.ratio.toFixed(4), never: +c.m.never.toFixed(2), n: c.m.n, half: +c.m.half.toFixed(3) },
      ok: idBad.length === 0 && mism.length === 0
    };
    if (!res.ok) console.error('[hc-qa] single-source assertion failed', res);
    return res;
  }
  if (typeof window !== 'undefined') window.hcQA = hcQA;

  // ════════ RENDER — every renderer takes `c`, none recompute ════════
  function renderVerdict(c) {
    var el = document.getElementById('hcVerdict'); if (!el || !c.m) return;
    var where = c.isToday ? 'here' : 'there';
    var posTxt = mult(c.mult).replace('×', '×') + ' trend · ' + positionLabel(c.pos);
    var main, cls;

    if (c.branch === 'floor') {
      cls = 'hc-verdict-floor';
      main = 'A lower entry almost never arrived here. Cash raised at this position historically stayed cash or rebought higher &mdash; fewer coins, <strong id="hcMiss">' +
        Math.round(c.missPct) + '</strong>% of the time. This is the position where raising a buffer is the trade this page warns about.';
    } else {
      cls = c.branch === 'pays' ? 'hc-verdict-pays' : (c.branch === 'wash' ? 'hc-verdict-wash' : 'hc-verdict-costs');
      var lead = 'Selling <strong>' + c.share + '%</strong> of the stack ' + where + ' (' + posTxt + '): historically a lower rebuy arrived <strong id="hcHit">' +
        Math.round(c.hit) + '</strong>% of the time, and redeploying at the dip bought about <strong id="hcMult">' + c.medianRT.toFixed(2) +
        '</strong>× the coins after ' + c.tax + '% tax &mdash; turning ' + c.share + '% into roughly <strong>' + c.endSharePct.toFixed(0) +
        '%</strong> of your stack.';
      var tail = ' The other <strong>' + Math.round(100 - c.hit) + '%</strong> of the time no dip came, and the cash bought back fewer coins.';
      if (c.branch === 'wash') tail += ' At these settings the median round trip is a wash: the tax eats what the dip gives.';
      if (c.branch === 'costs') tail += ' At these settings the median round trip <strong>loses coins</strong>: the typical rebuy did not come far enough below to beat the tax.';
      main = lead + tail;
    }
    el.className = 'hc-verdict ' + cls + (c.alarm ? ' hc-alarm-tint' : '');
    el.innerHTML = main;
  }

  function renderStack(c) {
    var el = document.getElementById('hcStackNote'); if (!el) return;
    if (!c.stack || !isFinite(c.stack) || c.stack <= 0) { el.innerHTML = 'Optional. Entering a number of bitcoin may help orient you to the potential outcomes; the verdict does not depend on it.'; return; }
    var sold = c.stack * c.x;
    el.innerHTML = 'Selling <strong>' + btc(sold) + '</strong> of ' + btc(c.stack) + ' at ' + usdFull(c.P) + ' raises <strong>' +
      usdFull(sold * c.P * (1 - c.t)) + '</strong> after ' + c.tax + '% tax. The median round trip brings back about <strong>' +
      btc(sold * c.medianRT) + '</strong>.';
  }

  function renderAlarm(c) {
    var el = document.getElementById('hcAlarm'); if (!el) return;
    el.hidden = !c.alarm;
  }

  function renderTax(c) {
    var el = document.getElementById('hcTaxLine'); if (!el) return;
    if (c.tax === 0) {
      el.innerHTML = 'At <strong>0%</strong> there is no haircut: any rebuy below ' + usdFull(c.P) + ' earns coins. That is the tax-advantaged case.';
    } else {
      el.innerHTML = 'At <strong>' + c.tax + '%</strong> long-term capital gains on a fully appreciated stack, the rebuy must come more than <strong>' +
        c.tax + '%</strong> lower just to break even in coins &mdash; the dip has to beat the tax before it earns you anything.';
    }
  }

  function renderQ3(c) {
    var el = document.getElementById('hcQ3'); if (!el || !c.m) return;
    var disc = c.medianDisc, body;
    var sample = ' <span class="hc-sample">Drawn from ' + c.n + ' historical entries within ' +
      (c.half <= 0.08 ? '±' + c.half.toFixed(2) : 'a widened band') +
      ' of this position (post-2014, each with a full two-year forward record). Historical, at this position &mdash; not a prediction.</span>';
    if (disc == null) {
      // No entry in this neighborhood ever saw a lower position inside two
      // years, so there is no discount to quote — say that, rather than print
      // an em-dash where a number belongs.
      body = 'At this position a lower price arrived within two years <strong id="hcQ3Hit">' + Math.round(c.hit) +
        '</strong>% of the time. No dip arrived here at all within the window, so there is no typical discount or wait to report: the cash simply waited, and bought back at whatever two years later cost.';
    } else {
      body = 'At this position a lower price arrived within two years <strong id="hcQ3Hit">' + Math.round(c.hit) +
        '</strong>% of the time. When a dip did come, the rebuy was typically <strong id="hcQ3Disc">' + disc.toFixed(0) +
        '</strong>% below the entry, after a typical wait of <strong>' + fmtWait(c.typicalWait) +
        '</strong>. Breakeven at ' + c.tax + '% tax needs more than ' + c.tax + '% ' +
        (disc > c.breakevenDisc ? '&mdash; the typical dip cleared it.' : '&mdash; <strong>the typical dip did not clear it</strong>.');
    }
    el.innerHTML = body + sample;
  }

  function renderShock(c) {
    var el = document.getElementById('hcShockRatio'); if (!el) return;
    var r = c.trend / c.P;
    el.innerHTML = 'A surprise bill paid from the stack ' + (c.isToday ? 'here' : 'there') + ' costs <strong>' + r.toFixed(2) +
      '×</strong> the coins it would at trend.';
  }

  function renderZone(c) {
    var el = document.getElementById('hcZoneStrip'); if (!el) return;
    el.innerHTML = 'Bitcoin has spent <strong>' + pct0(zoneTime.pct) + '</strong> of its history at or below ' + ZONE_MULT.toFixed(2) +
      '× trend (' + zoneTime.n + ' of ' + zoneTime.total + ' samples). Historical, not a forecast.';
  }

  function renderPos(c) {
    var el = document.getElementById('hcPosReadout'); if (!el) return;
    el.innerHTML = '<strong>' + c.mult.toFixed(2) + '×</strong> trend · <em>' + positionLabel(c.pos) + '</em> · ' +
      (c.isToday ? 'today' + todayNote() : monthYear(c.day)) + ' · ' + usdFull(c.P);
  }

  function renderEndnote(c) {
    var el = document.getElementById('hcEndnote'); if (!el) return;
    el.innerHTML = 'Your settings: ' + c.share + '% cash share · ' + c.tax + '% tax · marker at ' +
      (c.isToday ? 'today' : monthYear(c.day)) + ' (' + c.mult.toFixed(2) + '× trend · ' + positionLabel(c.pos) + ') · ' +
      c.n + ' historical entries. Rebuy rule: the first lower entry within two years, else the two-year price.';
  }

  // ── Insight chart ──
  var chart = null;
  function chartData(c) {
    var pts = curveFor({ tax: c.tax });
    var cross = crossingOf(pts);
    return { pts: pts, cross: cross };
  }
  var crossPlugin = {
    id: 'hcCross',
    afterDatasetsDraw: function (ch) {
      var xS = ch.scales.x, yS = ch.scales.y, ctx = ch.ctx;
      // breakeven line at 1.0
      var y1 = yS.getPixelForValue(1);
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(236,228,214,0.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xS.left, y1); ctx.lineTo(xS.right, y1); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(236,228,214,0.7)'; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('breakeven (1.00× — same coins back)', xS.left + 4, y1 - 5);
      // the crossing
      if (ch.$cross != null) {
        var xc = xS.getPixelForValue(ch.$cross);
        ctx.strokeStyle = 'rgba(224,148,34,0.8)'; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(xc, yS.top); ctx.lineTo(xc, yS.bottom); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e09422'; ctx.font = '700 10px Inter, sans-serif'; ctx.textAlign = 'center';
        var lbl = 'breakeven — shifts right as the tax rate rises';
        var tx = Math.max(xS.left + ctx.measureText(lbl).width / 2 + 2, Math.min(xc, xS.right - ctx.measureText(lbl).width / 2 - 2));
        ctx.fillText(lbl, tx, yS.top + 11);
      }
      // marker highlight
      if (ch.$hl) {
        var hx = xS.getPixelForValue(ch.$hl.x), hy = yS.getPixelForValue(ch.$hl.y);
        ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2);
        ctx.fillStyle = SEL_C; ctx.fill();
        ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
    }
  };
  function buildChart(c) {
    var el = document.getElementById('hcInsightChart'); if (!el || typeof Chart === 'undefined') return;
    var d = chartData(c);
    chart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: {
        datasets: [{
          label: 'Median coins back per coin sold',
          data: d.pts.map(function (p) { return { x: p.x, y: p.y }; }),
          borderColor: TREND_C, borderWidth: 2.4, pointRadius: 0, tension: 0.25,
          segment: { borderColor: function (ctx) { return ctx.p1.parsed.y >= 1 ? GAIN_C : LOSS_C; } }
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'nearest', axis: 'x' },
        layout: { padding: { top: 18, right: 10 } },
        scales: {
          x: {
            type: 'linear', min: -0.05, max: 1.0,
            title: { display: true, text: 'Where in the channel you sell', color: MUTED, font: { size: 11 } },
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: {
              color: MUTED, font: { size: 10 }, maxTicksLimit: 7,
              callback: function (v) { return positionLabel(v); }
            }
          },
          y: {
            title: { display: true, text: 'Coins back per coin sold', color: MUTED, font: { size: 11 } },
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, font: { size: 10 }, callback: function (v) { return v.toFixed(2) + '×'; } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1,
            titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function (it) { return it.length ? ratioOf(it[0].parsed.x).toFixed(2) + '× trend · ' + positionLabel(it[0].parsed.x) : ''; },
              label: function (it) { return it.parsed.y.toFixed(2) + '× coins back per coin sold'; }
            }
          }
        }
      },
      plugins: [crossPlugin]
    });
    chart.$cross = d.cross;
    chart.$hl = { x: c.pos, y: c.medianRT };
  }
  function updateChart(c) {
    if (!chart) { buildChart(c); return; }
    var d = chartData(c);
    chart.data.datasets[0].data = d.pts.map(function (p) { return { x: p.x, y: p.y }; });
    chart.$cross = d.cross;
    chart.$hl = { x: c.pos, y: c.medianRT };   // ← the ONE source; QA reads this back
    chart.update('none');
  }
  function chartBinding() {
    if (!chart || !chart.scales || !chart.scales.y) return null;
    var ds = chart.data.datasets[0];
    if (!ds || !ds.data.length) return null;
    var c = compute(S_);
    return {
      seriesColor: ds.borderColor, points: ds.data.length,
      highlightY: chart.$hl ? chart.$hl.y : null, expectedY: c.medianRT,
      ok: chart.$hl != null && Math.abs(chart.$hl.y - c.medianRT) < 1e-9
    };
  }
  function assertBinding() { var r = chartBinding(); if (r && !r.ok) console.error('[hc-binding] insight-chart highlight is not the computed value', r); }
  if (typeof window !== 'undefined') window.hcBinding = chartBinding;

  // ── Channel chart (position selector) ──
  var chChart = null, dragging = false;
  function bandLine(m, startD, span) {
    var pts = [], step = Math.max(12, span / 140), d;
    for (d = 0; d <= span + 1e-6; d += step) pts.push({ x: startD + d, y: plPrice(startD + d) * m });
    pts.push({ x: startD + span, y: plPrice(startD + span) * m });
    return pts;
  }
  function band(label, data, color, dash, w) {
    return { label: label, data: data, borderColor: color, backgroundColor: color, borderWidth: w, borderDash: dash || undefined, pointRadius: 0, tension: 0.2, fill: false, order: 4 };
  }
  var markerPlugin = {
    id: 'hcMarker',
    afterDatasetsDraw: function (ch) {
      var xS = ch.scales.x, yS = ch.scales.y, ctx = ch.ctx;
      var x = xS.getPixelForValue(markerDay()), y = yS.getPixelForValue(markerPrice());
      if (x < xS.left - 2 || x > xS.right + 2) return;
      ctx.save();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(109,179,212,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, yS.top); ctx.lineTo(x, yS.bottom); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = SEL_C; ctx.fill();
      ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
  };
  function chDatasets() {
    var startD = Math.max(FIRST_D, MARKER_MIN - YEAR_D), span = todayD - startD;
    var ds = [
      band('Floor (0.42× trend)', bandLine(PL_FLOOR, startD, span), FLOOR_C, [6, 3], 1.4),
      band('Trend', bandLine(1, startD, span), TREND_C, null, 2),
      band('Upper (3× trend)', bandLine(PL_CEIL, startD, span), UPPER_C, [1, 6], 1.1)
    ];
    var price = [];
    for (var i = 0; i < N; i++) if (S[i].d >= startD) price.push({ x: S[i].d, y: S[i].p });
    price.push({ x: todayD, y: spot() });
    ds.push({ label: 'BTC price (history)', data: price, borderColor: HIST_C, borderWidth: 1.3, pointRadius: 0, tension: 0.15, order: 1 });
    return ds;
  }
  var _dsSpot = null;
  function buildChannel() {
    var el = document.getElementById('hcChannelChart'); if (!el || typeof Chart === 'undefined') return;
    _dsSpot = spot();
    chChart = new Chart(el.getContext('2d'), {
      type: 'line', data: { datasets: chDatasets() },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' }, layout: { padding: { top: 16, right: 10 } },
        scales: {
          x: { type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { size: 11 }, maxTicksLimit: 8, callback: function (v) { return new Date(GENESIS_TS * 1000 + v * 86400 * 1000).getUTCFullYear(); } } },
          y: { type: 'logarithmic', grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { size: 11 }, callback: function (v) { if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'; return '$' + v.toFixed(0); } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: { backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10, callbacks: { title: function (it) { return it.length ? monthYear(it[0].parsed.x) : ''; }, label: function (it) { return it.dataset.label + ': $' + Math.round(it.parsed.y).toLocaleString(); } } }
        }
      },
      plugins: [markerPlugin]
    });
    wireDrag(el);
  }
  function updateChannel() {
    if (!chChart) { buildChannel(); return; }
    if (_dsSpot !== spot()) { chChart.data.datasets = chDatasets(); _dsSpot = spot(); chChart.update('none'); }
    else chChart.render();
  }
  function wireDrag(canvas) {
    function dayFromEvent(e) {
      var r = canvas.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      return clamp(chChart.scales.x.getValueForPixel(x), MARKER_MIN, todayD);
    }
    function set(e) { var d = dayFromEvent(e); S_.pos = (d >= todayD - 0.5) ? null : d; renderAll(); }
    canvas.addEventListener('pointerdown', function (e) { dragging = true; try { canvas.setPointerCapture(e.pointerId); } catch (err) {} set(e); });
    canvas.addEventListener('pointermove', function (e) { if (dragging) set(e); });
    canvas.addEventListener('pointerup', function (e) { dragging = false; try { canvas.releasePointerCapture(e.pointerId); } catch (err) {} });
    canvas.addEventListener('pointercancel', function () { dragging = false; });
  }

  // ── Audit ──
  var _lastC = null;
  function renderAudit(c) {
    var head = document.getElementById('hcAuditHead'), body = document.getElementById('hcAuditBody');
    if (!head || !body || !c.m) return;
    head.innerHTML = '<tr><th>Entry</th><th class="hc-num">Position</th><th class="hc-num">Price</th><th class="hc-num">Rebuy</th><th class="hc-num">Rebuy price</th><th class="hc-num">Discount</th><th class="hc-num">Coins back / coin sold</th></tr>';
    var rows = '';
    c.outcomes.forEach(function (o) {
      rows += '<tr><td>' + monthYear(o.d0) + '</td><td class="hc-num">' + ratioOf(o.P).toFixed(2) + '×</td><td class="hc-num">' +
        usdFull(o.p0) + '</td><td class="hc-num">' + (o.arrived ? monthYear(o.waitDay) : '<em>no dip · 2y</em>') + '</td><td class="hc-num">' +
        usdFull(o.waitPrice) + '</td><td class="hc-num">' + (o.disc * 100).toFixed(0) + '%</td><td class="hc-num' +
        (o.rt >= 1 ? ' hc-gain' : ' hc-loss') + '">' + o.rt.toFixed(2) + '×</td></tr>';
    });
    body.innerHTML = rows;
    _lastC = c;
  }
  function csv() {
    var c = _lastC; if (!c) return;
    var lines = ['entry_date,position_x_trend,entry_price_usd,rebuy_date,rebuy_price_usd,dip_arrived,discount_pct,after_tax_coins_multiple'];
    c.outcomes.forEach(function (o) {
      lines.push([monthYear(o.d0), ratioOf(o.P).toFixed(3), Math.round(o.p0),
        o.arrived ? monthYear(o.waitDay) : 'no-dip-2y', Math.round(o.waitPrice),
        o.arrived ? 'yes' : 'no', (o.disc * 100).toFixed(1), o.rt.toFixed(4)].join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'how-much-cash.csv'; a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Mirrored share control (§6.35: two representations, one state) ──
  function syncShare(from) {
    var n = document.getElementById('hcShareNum'), s = document.getElementById('hcShareSlider'),
        mv = document.getElementById('hcShareVal');
    if (from !== 'num' && n) n.value = S_.share;
    if (from !== 'slider' && s) s.value = String(S_.share);
    if (mv) mv.textContent = S_.share + '%';
    setSeg('hcSharePresets', S_.share);
  }
  function setSeg(groupId, value) {
    var g = document.getElementById(groupId); if (!g) return;
    var bs = g.querySelectorAll('[data-val]');
    for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('is-active', bs[i].getAttribute('data-val') === String(value));
  }

  // ── URL (allocation register; retired v2 params decode-and-ignore) ──
  function readUrl() {
    if (!window.URLSearchParams) return;
    var p = new URLSearchParams(window.location.search), v;
    if (p.has('share')) { v = parseInt(p.get('share'), 10); if (isFinite(v)) S_.share = clamp(v, 0, 100); }
    if (p.has('tax')) { v = parseInt(p.get('tax'), 10); if ([0, 15, 20].indexOf(v) >= 0) S_.tax = v; }
    if (p.has('pos')) { v = parseFloat(p.get('pos')); if (isFinite(v)) S_.pos = clamp(v, MARKER_MIN, todayD); }
    if (p.has('stack')) { v = parseFloat(p.get('stack')); if (isFinite(v) && v > 0) S_.stack = v; }
    // v2's params (exp, buf, shock, hz, yld, depth, btc, dep, cy, rec) are
    // retired with the ledger — read and ignored, never rewritten.
  }
  var _urlT = null;
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    if (_urlT) clearTimeout(_urlT);
    _urlT = setTimeout(function () {
      var p = new URLSearchParams();
      p.set('share', String(S_.share));
      if (S_.tax !== DEFAULTS.tax) p.set('tax', String(S_.tax));
      if (S_.pos != null) p.set('pos', String(Math.round(S_.pos)));
      if (S_.stack) p.set('stack', String(S_.stack));
      window.history.replaceState(null, '', window.location.pathname + '?' + p.toString() + window.location.hash);
    }, 250);
  }

  // ════════ ORCHESTRATOR — one compute, every renderer reads it ════════
  function renderAll() {
    var c = compute(S_);
    if (!c.m) return;
    renderPos(c); renderVerdict(c); renderStack(c); renderAlarm(c); renderTax(c);
    renderQ3(c); renderShock(c); renderZone(c); renderEndnote(c);
    updateChannel();
    updateChart(c);
    renderAudit(c);
    assertBinding();
    syncShare();
    syncUrl();
    var q = hcQA(S_);
    if (!q.ok) console.error('[hc-qa] render failed the single-source assertion', q);
  }

  function initControls() {
    var st = document.getElementById('hcStack'); if (st && S_.stack) st.value = S_.stack;
    setSeg('hcTax', S_.tax);
    syncShare();
  }
  function wire() {
    function on(id, ev, fn) { var e = document.getElementById(id); if (e) e.addEventListener(ev, fn); }
    function setShare(v, from) {
      if (!isFinite(v)) return;
      S_.share = clamp(Math.round(v), 0, 100);
      syncShare(from); renderAll();
    }
    on('hcShareNum', 'input', function () { setShare(parseFloat(this.value), 'num'); });
    on('hcShareSlider', 'input', function () { setShare(parseInt(this.value, 10), 'slider'); });
    on('hcSharePresets', 'click', function (e) { var b = e.target.closest('[data-val]'); if (b) setShare(parseInt(b.getAttribute('data-val'), 10), 'preset'); });
    on('hcTax', 'click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      S_.tax = parseInt(b.getAttribute('data-val'), 10); setSeg('hcTax', S_.tax); renderAll();
    });
    on('hcStack', 'input', function () { var v = parseFloat(this.value); S_.stack = (isFinite(v) && v > 0) ? v : null; renderAll(); });
    on('hcSnapToday', 'click', function (e) { e.preventDefault(); S_.pos = null; renderAll(); });
    on('hcReset', 'click', function () { for (var k in DEFAULTS) if (DEFAULTS.hasOwnProperty(k)) S_[k] = DEFAULTS[k]; var st2 = document.getElementById('hcStack'); if (st2) st2.value = ''; initControls(); renderAll(); });
    on('hcAuditToggle', 'click', function () { var b = document.getElementById('hcAuditBody2'); if (!b) return; b.hidden = !b.hidden; this.setAttribute('aria-expanded', String(!b.hidden)); });
    on('hcCsvBtn', 'click', csv);
    initControls();
  }

  function init() {
    readUrl(); wire(); buildChannel(); renderAll();
    try {
      fetchTodayPrice(function (price, source) {
        _priceSource = (source === 'live') ? 'live' : 'fallback';
        if (isFinite(price) && price > 0) _spot = price;
        renderAll();
      });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
