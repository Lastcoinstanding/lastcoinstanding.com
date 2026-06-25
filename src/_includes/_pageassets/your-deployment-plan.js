/* =============================================================
   Your Deployment Plan — page script (Stage 2C-②)

   The personal model that companions /lump-sum-or-ladder-in. Where
   that page is the retrospective teaching demonstration, this one is
   about your situation: your sum, your cadence, your horizon — modelled
   both back across real history and forward under the Power Law.

   Borrows The Bitcoin Retirement's chart SHAPE only — value-over-time,
   time on the x-axis, the Power Law channel as a floor-at-the-bottom
   backdrop (the intuitive orientation that fixes the old inverted-floor
   advantage chart). Keeps this page's own controls and voice; imports
   none of Retirement's age/withdrawal/lifespan inputs.

   Reads PL_DATA + PL_A/PL_B/PL_FLOOR/PL_CEIL + GENESIS_TS + plPrice +
   TODAY_DAYS/TODAY_PRICE + fetchTodayPrice from shared/power-law-data.js,
   and the lifted forward path model from shared/deployment-projection.js
   (global DeploymentProjection — reused for the reversion-to-trend path).
   Constants are NOT redeclared. Everything is computed live; nothing is
   hard-coded (cross-cutting rule #1).
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  // ── Palette (matches the Retirement chassis band colours) ──
  var FLOOR_C = '#b04525', TREND_C = '#e09422', UPPER_C = '#e8c820';
  var REVERT_C = '#e09422', TRAJ_C = '#6db3d4', REAL_C = '#ece4d6';
  var MUTED = '#7a7367', DIM = '#9a9080', AMBER = '#e09422', BLUE = '#6db3d4';

  // ── Channel-position math (log-space, copied locally per rule #5) ──
  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function posOf(price, days) { return (Math.log(price / plPrice(days)) - LF) / SPAN; }
  function ratioOf(pos) { return Math.exp(pos * SPAN + LF); }
  var TREND_POS = (DeploymentProjection && DeploymentProjection.TREND_POS != null)
    ? DeploymentProjection.TREND_POS : (0 - LF) / SPAN;

  var N = PL_DATA.length;
  var FIRST_D = PL_DATA[0][0], LAST_D = PL_DATA[N - 1][1] !== undefined ? PL_DATA[N - 1][0] : PL_DATA[N - 1][0];
  var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400;
  var YEAR_D = 365.25, MONTH_D = 30.44;

  // Reversion-to-trend channel position along the forward window — reuse the
  // lifted path model where available (identical linear revert), else inline.
  function revertPos(startPos, u) {
    if (DeploymentProjection && typeof DeploymentProjection.pathPos === 'function') {
      return DeploymentProjection.pathPos('revert', startPos, u);
    }
    return startPos + (TREND_POS - startPos) * u;
  }

  // Real historical price at an absolute day, linearly interpolated.
  function realPriceAt(absDay) {
    if (absDay <= PL_DATA[0][0]) return PL_DATA[0][1];
    if (absDay >= PL_DATA[N - 1][0]) return PL_DATA[N - 1][1];
    for (var i = 1; i < N; i++) {
      if (PL_DATA[i][0] >= absDay) {
        var a = PL_DATA[i - 1], b = PL_DATA[i], t = (absDay - a[0]) / (b[0] - a[0]);
        return a[1] * (1 - t) + b[1] * t;
      }
    }
    return PL_DATA[N - 1][1];
  }

  function yearOf(day) { return new Date(GENESIS_TS * 1000 + day * 86400 * 1000).getUTCFullYear(); }
  function monthYear(day) { return new Date(GENESIS_TS * 1000 + day * 86400 * 1000).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }

  // ── State ──
  var state = {
    sum: 25000,
    style: 'lump',        // 'lump' | 'ladder' | 'hybrid'
    durMonths: 12,        // ladder / blend duration
    front: 50,            // hybrid: % deployed now (rest laddered)
    horizon: 4,           // years
    view: 'retrospective' // 'retrospective' | 'projective'
  };
  var liveTodayPrice = null, liveTodayPos = null;

  // ── Buy schedule: events with day-offset + weight (weights sum to 1) ──
  function buyEvents() {
    var n = Math.max(1, Math.round(state.durMonths)), a, k, w;
    if (state.style === 'lump') return [{ d: 0, w: 1 }];
    if (state.style === 'ladder') {
      a = []; w = 1 / n;
      for (k = 0; k < n; k++) a.push({ d: k * MONTH_D, w: w });
      return a;
    }
    // hybrid: front now, ladder the rest over the duration (months 1..n)
    var f = Math.max(0, Math.min(1, state.front / 100));
    a = [{ d: 0, w: f }]; w = (1 - f) / n;
    for (k = 1; k <= n; k++) a.push({ d: k * MONTH_D, w: w });
    return a;
  }

  // BTC held at offset t given a price-at-offset function
  function btcHeldAt(events, priceAt, t) {
    var btc = 0;
    for (var i = 0; i < events.length; i++) if (events[i].d <= t + 1e-9) btc += (events[i].w * state.sum) / priceAt(events[i].d);
    return btc;
  }
  function btcFinal(events, priceAt, horizonDays) { return btcHeldAt(events, priceAt, horizonDays); }

  // Value-over-time series for a price-at-offset function, anchored at baseDay
  function valueSeries(events, priceAt, horizonDays, baseDay) {
    var pts = [], step = Math.max(12, horizonDays / 80), d;
    for (d = 0; d <= horizonDays + 1e-6; d += step) pts.push({ x: baseDay + d, y: btcHeldAt(events, priceAt, d) * priceAt(d) });
    if (pts.length && Math.abs(pts[pts.length - 1].x - (baseDay + horizonDays)) > 1)
      pts.push({ x: baseDay + horizonDays, y: btcHeldAt(events, priceAt, horizonDays) * priceAt(horizonDays) });
    return pts;
  }
  function bandSeries(btcRef, baseDay, horizonDays, mult) {
    var pts = [], step = Math.max(12, horizonDays / 80), d;
    for (d = 0; d <= horizonDays + 1e-6; d += step) pts.push({ x: baseDay + d, y: btcRef * plPrice(baseDay + d) * mult });
    pts.push({ x: baseDay + horizonDays, y: btcRef * plPrice(baseDay + horizonDays) * mult });
    return pts;
  }

  // ── Retrospective analog: the most recent historical entry whose channel
  //    position is closest to today's AND has ≥ horizon years of forward data. ──
  function analogIndex(todayPos, horizonDays) {
    var best = -1, bestScore = Infinity;
    for (var i = 0; i < N; i++) {
      if (PL_DATA[i][0] > LAST_D - horizonDays) break;        // need room to hold
      var pos = posOf(PL_DATA[i][1], PL_DATA[i][0]);
      var recency = (LAST_D - PL_DATA[i][0]) / (LAST_D - FIRST_D); // 0 = recent, 1 = old
      var score = Math.abs(pos - todayPos) + recency * 0.15;       // prefer close position, mildly prefer recent
      if (score < bestScore) { bestScore = score; best = i; }
    }
    return best;
  }

  // ── Outcome for one style under the active view ──
  function outcome(style) {
    var saved = state.style; state.style = style;
    var events = buyEvents(); state.style = saved;
    var horizonDays = state.horizon * YEAR_D;
    var pos = (liveTodayPos != null) ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS);

    if (state.view === 'projective') {
      var trajPrice = function (d) { return plPrice(todayD + d) * ratioOf(pos); };
      var revertPrice = function (d) { return plPrice(todayD + d) * ratioOf(revertPos(pos, Math.min(1, d / horizonDays))); };
      var mTraj = btcFinal(events, trajPrice, horizonDays) * trajPrice(horizonDays) / state.sum;
      var mRevert = btcFinal(events, revertPrice, horizonDays) * revertPrice(horizonDays) / state.sum;
      return { traj: mTraj, revert: mRevert, lo: Math.min(mTraj, mRevert), hi: Math.max(mTraj, mRevert), events: events };
    }
    var ai = analogIndex(pos, horizonDays), baseDay = PL_DATA[ai][0];
    var realPrice = function (d) { return realPriceAt(baseDay + d); };
    var m = btcFinal(events, realPrice, horizonDays) * realPrice(horizonDays) / state.sum;
    return { real: m, lo: m, hi: m, analogDay: baseDay, events: events };
  }

  // ════════ CHART (Retirement chassis grammar) ════════
  var chart = null;
  var todayMarker = {
    id: 'dpToday',
    afterDatasetsDraw: function (c) {
      if (state.view !== 'projective') return;
      var xS = c.scales.x, ctx = c.ctx, area = c.chartArea, x = xS.getPixelForValue(todayD);
      if (x < area.left || x > area.right) return;
      ctx.save(); ctx.strokeStyle = 'rgba(224,148,34,0.45)'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x, area.top); ctx.lineTo(x, area.bottom); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = AMBER; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Today', x, area.top - 4); ctx.restore();
    }
  };

  function chartDatasets() {
    var horizonDays = state.horizon * YEAR_D;
    var pos = (liveTodayPos != null) ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS);
    var events = buyEvents();
    var ds = [];

    if (state.view === 'projective') {
      var baseDay = todayD;
      var trajPrice = function (d) { return plPrice(todayD + d) * ratioOf(pos); };
      var revertPrice = function (d) { return plPrice(todayD + d) * ratioOf(revertPos(pos, Math.min(1, d / horizonDays))); };
      var btcRef = state.sum / trajPrice(0);
      ds.push(band('Floor (0.42× trend)', bandSeries(btcRef, baseDay, horizonDays, PL_FLOOR), FLOOR_C, [6, 3], 1.4));
      ds.push(band('Trend', bandSeries(btcRef, baseDay, horizonDays, 1), TREND_C, null, 2));
      ds.push(band('Upper (3× trend)', bandSeries(btcRef, baseDay, horizonDays, PL_CEIL), UPPER_C, [1, 6], 1.1));
      // the two forward paths, with the range shaded between them
      var revSeries = valueSeries(events, revertPrice, horizonDays, baseDay);
      var trajSeries = valueSeries(events, trajPrice, horizonDays, baseDay);
      ds.push({ label: 'Reversion to trend', data: revSeries, borderColor: REVERT_C, backgroundColor: 'rgba(224,148,34,0.10)', borderWidth: 2.2, pointRadius: 0, tension: 0.2, fill: '+1', order: 1 });
      ds.push({ label: 'Stay on current trajectory', data: trajSeries, borderColor: TRAJ_C, backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 3], pointRadius: 0, tension: 0.2, fill: false, order: 1 });
    } else {
      var ai = analogIndex(pos, horizonDays), aDay = PL_DATA[ai][0];
      var realPrice = function (d) { return realPriceAt(aDay + d); };
      var btcRefR = state.sum / realPrice(0);
      ds.push(band('Floor (0.42× trend)', bandSeries(btcRefR, aDay, horizonDays, PL_FLOOR), FLOOR_C, [6, 3], 1.4));
      ds.push(band('Trend', bandSeries(btcRefR, aDay, horizonDays, 1), TREND_C, null, 2));
      ds.push(band('Upper (3× trend)', bandSeries(btcRefR, aDay, horizonDays, PL_CEIL), UPPER_C, [1, 6], 1.1));
      ds.push({ label: 'Your stack (actual history)', data: valueSeries(events, realPrice, horizonDays, aDay), borderColor: REAL_C, backgroundColor: 'transparent', borderWidth: 2.4, pointRadius: 0, tension: 0.2, fill: false, order: 1 });
    }
    return ds;
  }
  function band(label, data, color, dash, w) {
    return { label: label, data: data, borderColor: color, backgroundColor: color, borderWidth: w, borderDash: dash || undefined, pointRadius: 0, tension: 0.2, fill: false, order: 4 };
  }

  function yBounds(ds) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < ds.length; i++) for (var j = 0; j < ds[i].data.length; j++) {
      var y = ds[i].data[j].y; if (isFinite(y) && y > 0) { if (y < lo) lo = y; if (y > hi) hi = y; }
    }
    if (!isFinite(lo)) { lo = 1000; hi = 1e7; }
    return { min: lo * 0.55, max: hi * 1.9 };
  }

  function buildChart() {
    var el = document.getElementById('dpChart'); if (!el || typeof Chart === 'undefined') return;
    var ds = chartDatasets(), yb = yBounds(ds);
    chart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: { datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 24, right: 10 } },
        scales: {
          x: {
            type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, maxTicksLimit: 8, callback: function (v) { return yearOf(v); } }
          },
          y: {
            type: 'logarithmic', min: yb.min, max: yb.max, grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: {
              color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) {
                if (v >= 1e9) return '$' + (v / 1e9).toFixed(0) + 'B'; if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
                if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'; return '$' + v.toFixed(0);
              }
            }
          }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1,
            titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            filter: function (it) { var v = it.parsed && it.parsed.y; return v != null && isFinite(v) && v > 0; },
            callbacks: {
              title: function (it) { return it.length ? yearOf(it[0].parsed.x) : ''; },
              label: function (it) { return it.dataset.label + ': ' + fmtUSD(it.parsed.y); }
            }
          }
        }
      },
      plugins: [todayMarker]
    });
  }
  function updateChart() {
    if (!chart) { buildChart(); return; }
    var ds = chartDatasets(), yb = yBounds(ds);
    chart.data.datasets = ds;
    chart.options.scales.y.min = yb.min; chart.options.scales.y.max = yb.max;
    chart.update('none');
  }

  // ════════ FORMAT ════════
  function fmtUSD(v) {
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }
  function fmtMult(m) { return m == null ? '—' : (m >= 100 ? Math.round(m).toLocaleString() : m.toFixed(1)) + '×'; }
  function posLabel(pos) {
    if (pos < 0.12) return 'near the floor';
    if (pos < 0.33) return 'low in the channel';
    if (pos < 0.66) return 'mid-channel';
    if (pos < 1.0) return 'high in the channel';
    return 'above the upper band';
  }
  var STYLE_NAME = { lump: 'Lump sum', ladder: 'Ladder in', hybrid: 'Hybrid' };

  // ════════ VERDICT (compares lump / ladder / hybrid for the active view) ════════
  function updateVerdict() {
    var lead = document.getElementById('dpVerdictLead');
    var main = document.getElementById('dpVerdictMain');
    var detail = document.getElementById('dpVerdictDetail');
    if (!main) return;
    var pos = (liveTodayPos != null) ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS);
    var styles = ['lump', 'ladder', 'hybrid'];
    var res = {}; styles.forEach(function (s) { res[s] = outcome(s); });

    if (lead) lead.textContent = (state.view === 'projective' ? 'Projected' : 'Replayed from history') +
      ' · starting ' + posLabel(pos) + ' (channel position ' + pos.toFixed(2) + ') · ' + state.horizon + '-year hold';

    var sel = state.style, r = res[sel];
    var lumpMid = state.view === 'projective' ? (res.lump.lo + res.lump.hi) / 2 : res.lump.real;
    var selMid = state.view === 'projective' ? (r.lo + r.hi) / 2 : r.real;
    var html;
    if (pos < 0.33) {
      html = 'With price <em>' + posLabel(pos) + '</em>, deploying decisively tends to come out ahead — you&rsquo;re buying below trend. '
        + (sel === 'lump' ? 'Your <strong>lump</strong> captures that edge in full.'
          : 'Your <strong>' + STYLE_NAME[sel].toLowerCase() + '</strong> gives up a little of that edge for the comfort of not deploying all at once.');
    } else if (pos < 0.66) {
      html = 'Mid-channel is close to a coin-flip — <strong>commitment matters more than the tactic</strong> here. A '
        + (sel === 'hybrid' ? 'hybrid' : sel) + ' is a reasonable call; the spread between styles is small.';
    } else {
      html = 'Higher in the channel, the lump-sum advantage shrinks and a <span class="dp-hedge">hybrid or ladder</span> looks more attractive as a hedge — '
        + 'though <a href="#cautions">see the cautions</a>, that&rsquo;s softer than it sounds.';
    }
    main.innerHTML = html;

    if (detail) {
      var rows = styles.map(function (s) {
        var x = res[s];
        var val = state.view === 'projective'
          ? fmtMult(x.lo) + '–' + fmtMult(x.hi)
          : fmtMult(x.real);
        var on = s === sel ? ' class="dp-row-sel"' : '';
        return '<span' + on + '>' + STYLE_NAME[s] + ' <strong>' + val + '</strong></span>';
      }).join(' &nbsp;·&nbsp; ');
      var endVal = state.view === 'projective'
        ? fmtUSD(selMid * state.sum) + ' (range ' + fmtUSD(r.lo * state.sum) + '–' + fmtUSD(r.hi * state.sum) + ')'
        : fmtUSD(r.real * state.sum);
      detail.innerHTML = rows
        + '<br><span class="dp-sparse">' + fmtUSD(state.sum) + ' deployed → <strong>' + endVal + '</strong> after ' + state.horizon + ' years'
        + (state.view === 'projective'
          ? ' — the range spans reversion-to-trend and stay-on-trajectory. Extrapolations, not forecasts.'
          : ' — replaying from ' + monthYear(r.analogDay) + ', when Bitcoin last sat near where it does today.') + '</span>';
    }
  }

  // ════════ LIVE READOUT (recommendation + its caveats in one eyeful — rule #2) ════════
  function renderLive(price, source) {
    liveTodayPrice = price;
    liveTodayPos = posOf(price, TODAY_DAYS);
    var ratio = price / plPrice(TODAY_DAYS);
    var posEl = document.getElementById('dpLivePos');
    var recEl = document.getElementById('dpLiveRec');
    var metaEl = document.getElementById('dpLiveMeta');
    if (posEl) posEl.innerHTML = 'Channel position <strong>' + liveTodayPos.toFixed(2) + '</strong> · ' + posLabel(liveTodayPos);
    if (recEl) {
      var rec;
      if (liveTodayPos < 0.33) rec = 'the model leans <b>deploy decisively</b> — spreading mostly means paying more as price reverts up toward trend.';
      else if (liveTodayPos < 0.66) rec = 'this is close to a <b>coin-flip</b> — pick the style you can hold through; commitment matters more than the tactic.';
      else rec = 'a <b>hybrid or ladder</b> is the more defensible call as a hedge against the reversion the channel predicts — but read the cautions; it&rsquo;s softer than it sounds.';
      recEl.innerHTML = 'With price ' + posLabel(liveTodayPos) + ', ' + rec;
    }
    if (metaEl) metaEl.textContent = 'Live: ' + fmtUSD(price) + ' · ' + ratio.toFixed(2) + '× trend' + (source === 'live' ? '' : ' (latest sample)') + ' · recomputed every load.';
    updateChart();
    updateVerdict();
  }

  // ════════ COMMITMENT BACKSTOP + COMPRESSION (computed live; same as Page 1) ════════
  var S = (function () { var a = new Array(N); for (var i = 0; i < N; i++) a[i] = { d: PL_DATA[i][0], p: PL_DATA[i][1], pos: posOf(PL_DATA[i][1], PL_DATA[i][0]), yr: yearOf(PL_DATA[i][0]) }; return a; })();
  var HOLDS = [2, 4, 6, 8];
  function bucketName(pos) { return pos < 0.33 ? 'lower' : (pos < 0.66 ? 'mid' : 'upper'); }
  function nearestIdx(targetD) { var best = 0, bd = Infinity; for (var j = 0; j < N; j++) { var dd = Math.abs(S[j].d - targetD); if (dd < bd) { bd = dd; best = j; } } return best; }
  function backstop() {
    var agg = { lower: {}, mid: {}, upper: {} }, b, h;
    for (b in agg) for (h = 0; h < HOLDS.length; h++) agg[b][HOLDS[h]] = [];
    for (var i = 0; i < N; i++) { var bk = bucketName(S[i].pos); for (h = 0; h < HOLDS.length; h++) { var t = S[i].d + HOLDS[h] * YEAR_D; if (t > S[N - 1].d) continue; agg[bk][HOLDS[h]].push(S[nearestIdx(t)].p / S[i].p); } }
    var out = {}; for (b in agg) { out[b] = {}; for (h = 0; h < HOLDS.length; h++) { var arr = agg[b][HOLDS[h]], m = 0; for (var k = 0; k < arr.length; k++) m += arr[k]; out[b][HOLDS[h]] = arr.length ? m / arr.length : null; } }
    return out;
  }
  function worstRecovery() { var mn = Infinity, mx = 0, cnt = 0; for (var i = 0; i < N; i++) if (S[i].pos > 1.5) { cnt++; var m = S[N - 1].p / S[i].p; if (m < mn) mn = m; if (m > mx) mx = m; } return { cnt: cnt, min: mn, max: mx }; }
  function compression() { var W = [[2011, 2014], [2015, 2018], [2019, 2022], [2023, 2026]], out = []; for (var w = 0; w < W.length; w++) { var mx = -Infinity; for (var i = 0; i < N; i++) if (S[i].yr >= W[w][0] && S[i].yr <= W[w][1]) mx = Math.max(mx, S[i].pos); if (mx > -Infinity) out.push({ label: W[w][0] + '–' + W[w][1], max: mx }); } return out; }
  function renderTables() {
    var bs = backstop(), tb = document.getElementById('dpBackstopBody');
    if (tb) {
      var rows = [['lower', 'Lower channel'], ['mid', 'Mid-channel'], ['upper', 'Upper channel']], html = '';
      for (var r = 0; r < rows.length; r++) { html += '<tr class="dp-row-' + rows[r][0] + '"><th>' + rows[r][1] + '</th>'; for (var h = 0; h < HOLDS.length; h++) { var v = bs[rows[r][0]][HOLDS[h]]; html += '<td' + (h === HOLDS.length - 1 ? ' class="dp-strong"' : '') + '>' + fmtMult(v) + '</td>'; } html += '</tr>'; }
      tb.innerHTML = html;
    }
    var wr = worstRecovery(), tk = document.getElementById('dpBackstopTakeaway');
    if (tk) { var H = state.horizon, up = bs.upper[H]; tk.innerHTML = 'Even <strong>upper-channel</strong> entries — the worst-timed buys — returned about <strong>' + fmtMult(up) + '</strong> on average after ' + H + ' years. The literal worst entries in history still returned <strong>' + fmtMult(wr.min) + ' to ' + fmtMult(wr.max) + '</strong> by the latest sample. Where you bought has mattered far less than that you bought and held.'; }
    var cp = compression(), cb = document.getElementById('dpCompressionBody');
    if (cb) { var ch = ''; for (var i = 0; i < cp.length; i++) ch += '<tr><th>' + cp[i].label + '</th><td class="dp-strong">' + cp[i].max.toFixed(2) + '</td></tr>'; cb.innerHTML = ch; }
    var mw = document.getElementById('dpMethodWindow');
    if (mw) mw.innerHTML = '<code>PL_DATA</code> window: ' + monthYear(S[0].d) + ' – ' + monthYear(S[N - 1].d) + ' (' + N + ' samples, ~12-day spacing)';
  }

  // ════════ CONTROLS ════════
  function syncStyleUI() {
    document.body.setAttribute('data-dp-style', state.style);
    var durRow = document.getElementById('dpDurRow'), frontRow = document.getElementById('dpFrontRow');
    if (durRow) durRow.style.display = (state.style === 'lump') ? 'none' : '';
    if (frontRow) frontRow.style.display = (state.style === 'hybrid') ? '' : 'none';
    var durLabel = document.getElementById('dpDurLabelText');
    if (durLabel) durLabel.textContent = (state.style === 'hybrid') ? 'Blend the rest over' : 'Ladder over';
  }
  function wire() {
    var sum = document.getElementById('dpSum'), sumVal = document.getElementById('dpSumVal');
    if (sum) sum.addEventListener('input', function () { state.sum = parseInt(this.value, 10); if (sumVal) sumVal.textContent = fmtUSD(state.sum); updateChart(); updateVerdict(); });

    document.querySelectorAll('.dp-style button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.style = btn.getAttribute('data-style');
        document.querySelectorAll('.dp-style button').forEach(function (b) { b.classList.toggle('active', b === btn); });
        syncStyleUI(); updateChart(); updateVerdict();
      });
    });

    var dur = document.getElementById('dpDur'), durVal = document.getElementById('dpDurVal');
    if (dur) dur.addEventListener('input', function () { state.durMonths = parseInt(this.value, 10); if (durVal) durVal.textContent = state.durMonths >= 12 && state.durMonths % 12 === 0 ? (state.durMonths / 12) + (state.durMonths === 12 ? ' yr' : ' yrs') : state.durMonths + ' mo'; updateChart(); updateVerdict(); });

    var front = document.getElementById('dpFront'), frontVal = document.getElementById('dpFrontVal');
    if (front) front.addEventListener('input', function () { state.front = parseInt(this.value, 10); if (frontVal) frontVal.textContent = state.front + '% now'; updateChart(); updateVerdict(); });

    var hz = document.getElementById('dpHorizon'), hzVal = document.getElementById('dpHorizonVal');
    if (hz) hz.addEventListener('input', function () { state.horizon = parseInt(this.value, 10); if (hzVal) hzVal.textContent = state.horizon + ' yrs'; updateChart(); updateVerdict(); renderTables(); });

    document.querySelectorAll('.dp-view button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.view = btn.getAttribute('data-view');
        document.querySelectorAll('.dp-view button').forEach(function (b) { b.classList.toggle('active', b === btn); });
        document.body.setAttribute('data-dp-view', state.view);
        updateChart(); updateVerdict();
      });
    });
  }

  // ════════ INIT ════════
  function init() {
    document.body.setAttribute('data-dp-view', state.view);
    syncStyleUI();
    buildChart();
    wire();
    renderTables();
    renderLive(TODAY_PRICE, 'seed');
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price, source) { renderLive(price, source); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
