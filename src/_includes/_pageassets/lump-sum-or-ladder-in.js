/* =============================================================
   Lump Sum or Ladder In? — page script (Stage 2A: core / retrospective)

   Reads PL_DATA + PL_A/PL_B/PL_FLOOR/PL_CEIL + GENESIS_TS + plPrice +
   TODAY_DAYS/TODAY_PRICE + fetchTodayPrice from shared/power-law-data.js
   (loaded before this file via the page's page_scripts). Constants are
   NOT redeclared.

   Everything is computed live from the current PL_DATA at load — the
   advantage curve, the commitment-backstop table, the volatility-
   compression table, the worst-entry recovery, and today's channel
   position. Nothing is hard-coded (cross-cutting rule #1). The
   §4.2/§4.3/§4.5 design figures are reproduced as a side effect of the
   same math validated in the Step-1 build note.

   Stage 2B will add the projective lens (+ lens toggle) and the
   advanced/optional disclosure (recurring-windfall planner + manual blend).
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  // ── Palette ──
  var AMBER = '#e09422', BLUE = '#6db3d4', RUST = '#c0392b';
  var MUTED = '#6a6256', DIM = '#9a9080', TREND = '#e09422', HISTORY = 'rgba(232,224,210,0.6)';

  // ── Channel-position math (log-space, floor→ceiling) ──
  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function posOf(price, days) { return (Math.log(price / plPrice(days)) - LF) / SPAN; }
  function ratioOf(pos) { return Math.exp(pos * SPAN + LF); }      // inverse: channel pos → price/trend ratio
  function dateOf(days) { return new Date(GENESIS_TS * 1000 + days * 86400 * 1000); }

  // ── Precompute samples ──
  var N = PL_DATA.length;
  var S = new Array(N);
  for (var i = 0; i < N; i++) {
    var d = PL_DATA[i][0], p = PL_DATA[i][1];
    S[i] = { d: d, p: p, pos: posOf(p, d), yr: dateOf(d).getUTCFullYear() };
  }
  var MIN_D = S[0].d, LAST_D = S[N - 1].d;
  var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400;

  function eraStartDay(era) {
    if (era === 'post-2017') return (Date.UTC(2017, 0, 1) / 1000 - GENESIS_TS) / 86400;
    if (era === 'post-2020') return (Date.UTC(2020, 0, 1) / 1000 - GENESIS_TS) / 86400;
    return MIN_D - 1; // full
  }

  // ── State ──
  var state = {
    // Fixed low-channel TEACHING default (the page's headline lesson). NOT today's
    // live value — today's position renders only in the live component (rule #1).
    pos: 0.15,
    decision: 'all-now',     // 'all-now' | 'ladder-in'
    era: 'post-2020',        // default recent (design §7); also drives channel x-range (Amendment 2)
    lens: 'retrospective',   // 'retrospective' | 'projective' (Stage 2B)
    sum: 12000,
    ladderN: 30,             // ~1yr of ~12-day samples
    horizon: 4,              // years (drives the backstop takeaway AND the forward channel extent)
    blend: 0                 // advanced: % laddered (0 = all-now); 0 disables the blend overlay
  };
  var MAX_H = 8;             // forward channel is drawn out to today + MAX_H years (clipped by horizon)
  var WIN = 0.075;           // channel-position window for binning entries
  var liveTodayPos = null, liveTodayPrice = null;

  // ── Core backtest: ladder-in advantage at one entry index ──
  // returns (ladder_BTC / lump_BTC - 1) * 100  (positive = laddering got MORE BTC)
  function ladderAdvantage(i, ladderN) {
    if (i + ladderN - 1 > N - 1) return null;
    var lumpBtc = 1 / S[i].p;            // sum cancels in the ratio — amount-invariant
    var each = 1 / ladderN, dca = 0;
    for (var k = 0; k < ladderN; k++) dca += each / S[i + k].p;
    return (dca / lumpBtc - 1) * 100;
  }

  // mean ladder-advantage + win-rate over entries within WIN of position p
  function bucketAt(era, ladderN, p) {
    var startD = eraStartDay(era), vals = [];
    for (var i = 0; i < N; i++) {
      if (S[i].d < startD) continue;
      if (Math.abs(S[i].pos - p) > WIN) continue;
      var a = ladderAdvantage(i, ladderN);
      if (a !== null) vals.push(a);
    }
    if (!vals.length) return { n: 0 };
    var m = 0, wins = 0;
    for (var v = 0; v < vals.length; v++) { m += vals[v]; if (vals[v] > 0) wins++; }
    return { n: vals.length, mean: m / vals.length, win: 100 * wins / vals.length };
  }

  // advantage curve across channel position (binned, sliding window)
  function advantageCurve(era, ladderN) {
    var pts = [];
    for (var g = -0.10; g <= 1.151; g += 0.025) {
      var b = bucketAt(era, ladderN, g);
      if (b.n >= 4) pts.push({ x: +g.toFixed(4), y: b.mean });
    }
    return pts;
  }

  // ── §4.3 commitment backstop: mean value-multiple by entry bucket & hold length ──
  function bucketName(pos) { return pos < 0.33 ? 'lower' : (pos < 0.66 ? 'mid' : 'upper'); }
  function nearestIdx(targetD) {
    var best = 0, bd = Infinity;
    for (var j = 0; j < N; j++) { var dd = Math.abs(S[j].d - targetD); if (dd < bd) { bd = dd; best = j; } }
    return best;
  }
  var HOLDS = [2, 4, 6, 8];
  function backstop() {
    var agg = { lower: {}, mid: {}, upper: {} }, b, h;
    for (b in agg) for (h = 0; h < HOLDS.length; h++) agg[b][HOLDS[h]] = [];
    for (var i = 0; i < N; i++) {
      var bk = bucketName(S[i].pos);
      for (h = 0; h < HOLDS.length; h++) {
        var t = S[i].d + HOLDS[h] * 365.25;
        if (t > LAST_D) continue;            // exit must exist (locked convention: nearest sample to entry+H×365.25)
        agg[bk][HOLDS[h]].push(S[nearestIdx(t)].p / S[i].p);
      }
    }
    var out = {};
    for (b in agg) {
      out[b] = {};
      for (h = 0; h < HOLDS.length; h++) {
        var arr = agg[b][HOLDS[h]], m = 0;
        for (var k = 0; k < arr.length; k++) m += arr[k];
        out[b][HOLDS[h]] = arr.length ? m / arr.length : null;
      }
    }
    return out;
  }
  function worstRecovery() {
    var mn = Infinity, mx = 0, cnt = 0;
    for (var i = 0; i < N; i++) {
      if (S[i].pos > 1.5) { cnt++; var m = S[N - 1].p / S[i].p; if (m < mn) mn = m; if (m > mx) mx = m; }
    }
    return { cnt: cnt, min: mn, max: mx };
  }

  // ── §4.5 volatility compression: max channel position by 4-year window ──
  function compression() {
    var W = [[2011, 2014], [2015, 2018], [2019, 2022], [2023, 2026]], out = [];
    for (var w = 0; w < W.length; w++) {
      var mx = -Infinity;
      for (var i = 0; i < N; i++) if (S[i].yr >= W[w][0] && S[i].yr <= W[w][1]) mx = Math.max(mx, S[i].pos);
      if (mx > -Infinity) out.push({ label: W[w][0] + '–' + W[w][1], max: mx });
    }
    return out;
  }

  // ── Formatting helpers ──
  function fmtMult(m) { return m == null ? '—' : (m >= 100 ? Math.round(m).toLocaleString() : m.toFixed(1)) + '×'; }
  function fmtUSD(v) {
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }
  function posLabel(pos) {
    if (pos < 0.12) return 'near the floor';
    if (pos < 0.33) return 'low in the channel';
    if (pos < 0.66) return 'mid-channel';
    if (pos < 1.0) return 'high in the channel';
    return 'above the upper band';
  }

  // ════════ FORWARD PROJECTION (Stage 2B, design §5.2 + Amendment 1) ════════
  // Recent-era amplitude caps every forward excursion (design §4.5) so the
  // projection can never import early-era, un-repeatable swings.
  var RECENT_MAX = (function () { var mx = -Infinity; for (var i = 0; i < N; i++) if (S[i].yr >= 2023) mx = Math.max(mx, S[i].pos); return mx > -Infinity ? mx : 0.53; })();
  var TREND_POS = (0 - LF) / SPAN;   // channel position of the trend line (ratio = 1.0)

  var PATHS = [
    { key: 'revert', label: 'Revert to trend', color: AMBER },
    { key: 'floor', label: 'Ride the floor', color: RUST },
    { key: 'stretch', label: 'Stretch, then revert', color: BLUE }
  ];
  // channel position along a forward path, u in [0,1] across the ladder window
  function pathPos(key, startPos, u) {
    if (key === 'revert') return startPos + (TREND_POS - startPos) * u;
    if (key === 'floor') return startPos + (0 - startPos) * u;
    var peak = Math.min(RECENT_MAX, Math.max(startPos, startPos + 0.28)); // recent-amplitude-capped
    return (u <= 0.4) ? startPos + (peak - startPos) * (u / 0.4) : peak + (TREND_POS - peak) * ((u - 0.4) / 0.6);
  }
  var FWD_STEP_D = 12.16;            // ~ PL_DATA cadence
  // ladder-in advantage if you enter TODAY at channel position startPos and price
  // follows `key` over the ladder window. Amount-invariant. Anchored at todayD.
  function simFwdAdv(startPos, key, ladderN) {
    var steps = Math.max(2, ladderN), p0 = plPrice(todayD) * ratioOf(startPos), sumInv = 0;
    for (var k = 0; k < steps; k++) {
      var u = k / (steps - 1);
      sumInv += 1 / (plPrice(todayD + k * FWD_STEP_D) * ratioOf(pathPos(key, startPos, u)));
    }
    return ((sumInv / steps) / (1 / p0) - 1) * 100;
  }
  function projectiveCurve(key, ladderN) {
    var pts = [];
    for (var g = 0; g <= 1.0001; g += 0.02) pts.push({ x: +g.toFixed(4), y: simFwdAdv(g, key, ladderN) });
    return pts;
  }

  // ════════ CHARTS ════════
  var advChart = null, channelChart = null;

  // zero reference line + today marker for the advantage chart
  var advGuides = {
    id: 'advGuides',
    afterDatasetsDraw: function (c) {
      var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx, area = c.chartArea;
      // zero line
      var y0 = yS.getPixelForValue(0);
      if (y0 >= area.top && y0 <= area.bottom) {
        ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(area.left, y0); ctx.lineTo(area.right, y0); ctx.stroke(); ctx.restore();
      }
      // today's live position (vertical)
      if (liveTodayPos != null) {
        var xt = xS.getPixelForValue(liveTodayPos);
        if (xt >= area.left && xt <= area.right) {
          ctx.save(); ctx.strokeStyle = 'rgba(224,148,34,0.7)'; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
          ctx.beginPath(); ctx.moveTo(xt, area.top); ctx.lineTo(xt, area.bottom); ctx.stroke();
          ctx.setLineDash([]); ctx.fillStyle = AMBER; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('TODAY', xt, area.top + 11); ctx.restore();
        }
      }
    }
  };

  function markerY() {
    if (state.lens === 'projective') return simFwdAdv(state.pos, 'revert', state.ladderN);
    var b = bucketAt(state.era, state.ladderN, state.pos);
    return b.n ? b.mean : 0;
  }
  function markerDataset() {
    return {
      label: 'Your position', data: [{ x: state.pos, y: markerY() }], showLine: false,
      pointRadius: 7, pointHoverRadius: 7, pointBackgroundColor: '#f2eee8', pointBorderColor: AMBER, pointBorderWidth: 2.5, order: 0
    };
  }
  function advDatasets() {
    if (state.lens === 'projective') {
      var ds = PATHS.map(function (pth) {
        return { label: pth.label, data: projectiveCurve(pth.key, state.ladderN), borderColor: pth.color, borderWidth: 2, pointRadius: 0, tension: 0.25, order: 3 };
      });
      ds.push({ label: 'Historical (reference)', data: advantageCurve(state.era, state.ladderN), borderColor: 'rgba(232,224,210,0.28)', borderWidth: 1.4, borderDash: [4, 4], pointRadius: 0, tension: 0.25, order: 4 });
      ds.push(markerDataset());
      return ds;
    }
    return [
      {
        label: 'Ladder-in advantage', data: advantageCurve(state.era, state.ladderN), borderColor: AMBER, borderWidth: 2.4,
        pointRadius: 0, tension: 0.25, order: 2,
        segment: { borderColor: function (ctx) { return (ctx.p0.parsed.y + ctx.p1.parsed.y) / 2 < 0 ? AMBER : BLUE; } }
      },
      markerDataset()
    ];
  }
  function buildAdvChart() {
    var el = document.getElementById('lslAdvChart'); if (!el) return;
    advChart = new Chart(el, {
      type: 'line',
      data: { datasets: advDatasets() },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'nearest', intersect: false },
        scales: {
          x: {
            type: 'linear', min: -0.1, max: 1.15,
            title: { display: true, text: 'Entry channel position  (0 = floor · 1 = upper band)', color: MUTED, font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: MUTED, stepSize: 0.25, callback: function (v) { return v === 0 ? 'Floor' : (Math.abs(v - 1) < 1e-9 ? 'Upper' : v.toFixed(2)); } }
          },
          y: {
            title: { display: true, text: 'Ladder-in advantage  (% more BTC vs. all-now)', color: MUTED, font: { size: 10 } },
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: MUTED, callback: function (v) { return (v > 0 ? '+' : '') + v + '%'; } }
          }
        },
        plugins: {
          legend: { display: false, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 10, filter: function (l) { return l.text !== 'Your position'; } } },
          tooltip: {
            backgroundColor: 'rgba(10,9,8,0.95)', borderColor: 'rgba(224,148,34,0.5)', borderWidth: 1,
            titleColor: AMBER, bodyColor: '#ddd', displayColors: false,
            filter: function (it) { return it.dataset.label !== 'Your position'; },
            callbacks: {
              title: function (it) { return 'Channel position ' + (+it[0].parsed.x).toFixed(2); },
              label: function (it) {
                var y = it.parsed.y, lab = it.dataset.label;
                var who = y < 0 ? 'all-now +' + Math.abs(y).toFixed(0) + '%' : 'ladder +' + y.toFixed(0) + '%';
                return (state.lens === 'projective' ? lab + ': ' : '') + who + ' BTC';
              }
            }
          }
        }
      },
      plugins: [advGuides]
    });
  }

  function updateAdvChart() {     // full refresh (lens / era / ladder)
    if (!advChart) return;
    advChart.data.datasets = advDatasets();
    advChart.options.plugins.legend.display = (state.lens === 'projective');
    advChart.update('none');
  }
  function updateMarkerOnly() {
    if (!advChart) return;
    var ds = advChart.data.datasets;
    ds[ds.length - 1].data = [{ x: state.pos, y: markerY() }];
    advChart.update('none');
  }

  // ── Channel orientation chart (price vs time + bands + scrubbed entry line) ──
  var todayLine = {
    id: 'todayLine',
    afterDatasetsDraw: function (c) {
      var xS = c.scales.x, ctx = c.ctx, area = c.chartArea, x = xS.getPixelForValue(todayD);
      if (x < area.left || x > area.right) return;
      ctx.save(); ctx.strokeStyle = 'rgba(224,148,34,0.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x, area.top); ctx.lineTo(x, area.bottom); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = AMBER; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Today', x, area.top + 11); ctx.restore();
    }
  };
  function bands() {
    var trend = [], floor = [], upper = [], hi = todayD + MAX_H * 365.25;
    for (var d = MIN_D; d <= hi; d += 30) { var t = plPrice(d); trend.push({ x: d, y: t }); floor.push({ x: d, y: t * PL_FLOOR }); upper.push({ x: d, y: t * PL_CEIL }); }
    return { trend: trend, floor: floor, upper: upper };
  }
  function entryLine(pos) {
    var r = ratioOf(pos), line = [], hi = todayD + MAX_H * 365.25;
    for (var d = MIN_D; d <= hi; d += 30) line.push({ x: d, y: plPrice(d) * r });
    return line;
  }
  // Forward (x ≥ today) portion of a band renders faded + finely dashed so the
  // user sees where fitted history ends and extrapolation begins (Amendment 1).
  function fwdSeg(faded) {
    return {
      borderColor: function (ctx) { return ctx.p0.parsed.x >= todayD ? faded : undefined; },
      borderDash: function (ctx) { return ctx.p0.parsed.x >= todayD ? [2, 4] : undefined; }
    };
  }
  function buildChannelChart() {
    var el = document.getElementById('lslChannelChart'); if (!el) return;
    var b = bands();
    channelChart = new Chart(el, {
      type: 'line',
      data: {
        datasets: [
          { label: 'Floor (0.42×)', data: b.floor, borderColor: RUST, borderWidth: 1.3, borderDash: [6, 3], pointRadius: 0, tension: 0.2, order: 5, segment: fwdSeg('rgba(192,57,43,0.35)') },
          { label: 'Trend', data: b.trend, borderColor: TREND, borderWidth: 1.8, pointRadius: 0, tension: 0.2, order: 4, segment: fwdSeg('rgba(224,148,34,0.4)') },
          { label: 'Upper (3×)', data: b.upper, borderColor: '#d4a843', borderWidth: 1.1, borderDash: [1, 5], pointRadius: 0, tension: 0.2, order: 6, segment: fwdSeg('rgba(212,168,67,0.35)') },
          { label: 'Your entry valuation', data: entryLine(state.pos), borderColor: '#f2eee8', borderWidth: 1.8, borderDash: [7, 4], pointRadius: 0, tension: 0.2, order: 2, segment: fwdSeg('rgba(242,238,232,0.45)') },
          { label: 'Historical price', data: PL_DATA.map(function (p) { return { x: p[0], y: p[1] }; }), borderColor: HISTORY, borderWidth: 1.2, pointRadius: 0, tension: 0.15, order: 1 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            type: 'linear', grid: { color: 'rgba(255,255,255,0.04)' },
            title: { display: true, text: 'Year', color: MUTED, font: { size: 10 } },
            ticks: { color: MUTED, maxTicksLimit: 9, callback: function (v) { return new Date(GENESIS_TS * 1000 + v * 86400 * 1000).getUTCFullYear(); } }
          },
          y: {
            type: 'logarithmic', grid: { color: 'rgba(255,255,255,0.04)' },
            title: { display: true, text: 'BTC price (USD)', color: MUTED, font: { size: 10 } },
            ticks: {
              color: MUTED, callback: function (v) {
                if (v >= 1e6) return '$' + (v / 1e6) + 'M'; if (v >= 1000) return '$' + Math.round(v / 1000) + 'K'; if (v >= 1) return '$' + Math.round(v); return '$' + v;
              }
            }
          }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 10 } },
          tooltip: { enabled: false }
        }
      },
      plugins: [todayLine]
    });
  }
  function updateEntryLine() {
    if (!channelChart) return;
    channelChart.data.datasets[3].data = entryLine(state.pos);
    channelChart.update('none');
  }
  // Amendment 2: the era control sets the visible x-range; refit the log-Y to the
  // window so the bands open up. Projective lens extends x to the horizon year so
  // the forward extension stays on-canvas; the "today" line is always inside.
  function applyChannelWindow() {
    if (!channelChart) return;
    var xmin = (state.era === 'full') ? MIN_D : Math.max(MIN_D, eraStartDay(state.era));
    var xmax = (state.lens === 'projective') ? (todayD + state.horizon * 365.25) : (todayD + 0.3 * 365.25);
    var lo = Infinity, hi = 0, d, t;
    for (d = xmin; d <= xmax; d += 30) { t = plPrice(d); if (t * PL_FLOOR < lo) lo = t * PL_FLOOR; if (t * PL_CEIL > hi) hi = t * PL_CEIL; }
    for (var i = 0; i < N; i++) { if (S[i].d >= xmin && S[i].d <= xmax) { if (S[i].p < lo) lo = S[i].p; if (S[i].p > hi) hi = S[i].p; } }
    var x = channelChart.options.scales.x, y = channelChart.options.scales.y;
    x.min = xmin; x.max = xmax; y.min = lo * 0.6; y.max = hi * 1.7;
    channelChart.update('none');
  }
  function setForwardCaveat() {
    var el = document.getElementById('lslFwdCaveat');
    if (el) el.style.display = (state.lens === 'projective') ? '' : 'none';
  }

  // ════════ VERDICT ════════
  function ladderDurationLabel() {
    var months = Math.round(state.ladderN / 2.53);
    return months >= 12 ? (months % 12 === 0 ? (months / 12) + (months === 12 ? ' year' : ' years') : (months + ' months')) : months + ' months';
  }
  function updateVerdict() {
    var lead = document.getElementById('lslVerdictLead');
    var main = document.getElementById('lslVerdictMain');
    var detail = document.getElementById('lslVerdictDetail');
    if (!main) return;

    if (state.lens === 'projective') {
      if (lead) lead.textContent = 'Starting ' + posLabel(state.pos) + ' (position ' + state.pos.toFixed(2) + ') · forward scenarios over ' + ladderDurationLabel();
      var a = PATHS.map(function (p) { return { k: p.label, v: simFwdAdv(state.pos, p.key, state.ladderN) }; });
      var ladderWins = a.filter(function (x) { return x.v > 0; }).length;
      var html;
      if (ladderWins === 0) html = 'Starting <em>' + posLabel(state.pos) + '</em>, deploying <strong>all at once</strong> comes out ahead under <strong>every</strong> permitted forward path — the channel-aware call is robust, not a bet on one path.';
      else if (ladderWins === 3) html = 'Starting <em>' + posLabel(state.pos) + '</em>, <span class="lsl-dca">laddering</span> comes out ahead under <span class="lsl-dca">every</span> permitted path — up here, spreading is the model-rational hedge against the reversion the channel predicts.';
      else html = 'Starting <em>' + posLabel(state.pos) + '</em>, the paths disagree &mdash; laddering wins under ' + ladderWins + ' of three and loses under the rest. A genuine toss-up the channel doesn&rsquo;t resolve; commitment matters more than the tactic.';
      main.innerHTML = html;
      if (detail) {
        detail.innerHTML = a.map(function (x) { return x.k + ' <strong>' + (x.v < 0 ? 'all-now +' + Math.abs(x.v).toFixed(0) : 'ladder +' + x.v.toFixed(0)) + '%</strong>'; }).join(' &nbsp;·&nbsp; ')
          + '<br><span class="lsl-sparse">Robustness across the paths the channel permits &mdash; never a single forecast. The same call beat naive deployment retrospectively too; the agreement across both lenses is the credibility.</span>';
      }
      return;
    }

    var b = bucketAt(state.era, state.ladderN, state.pos);
    if (lead) lead.textContent = 'At channel position ' + state.pos.toFixed(2) + ' (' + posLabel(state.pos) + ') · ladder over ' + ladderDurationLabel();
    if (b.n < 4) {
      main.innerHTML = 'Bitcoin has rarely sat <em>' + posLabel(state.pos) + '</em> in this era — too few historical entries here to read.';
      if (detail) detail.innerHTML = '<span class="lsl-sparse">Widen the era or move the scrubber toward where price has actually spent time.</span>';
      return;
    }
    var adv = b.mean, lumpWins = adv < 0, mag = Math.abs(adv).toFixed(0);
    var html, dec = state.decision;
    if (lumpWins) {
      html = dec === 'all-now'
        ? 'Deploying <strong>all at once</strong> historically accumulated <strong>' + mag + '% more BTC</strong> than laddering in — the channel favours decisiveness here.'
        : 'Laddering in historically gave up <strong>' + mag + '% of the BTC</strong> that deploying all at once would have captured — the channel favours decisiveness here.';
    } else {
      html = dec === 'ladder-in'
        ? 'Laddering in historically accumulated <span class="lsl-dca">' + mag + '% more BTC</span> than deploying all at once — at this valuation, spreading is the model-rational hedge.'
        : 'Deploying all at once historically gave up <span class="lsl-dca">' + mag + '% of the BTC</span> laddering in would have captured — up here, spreading is the model-rational hedge.';
    }
    main.innerHTML = html;
    if (detail) {
      detail.innerHTML = 'Across <strong>' + b.n + '</strong> historical entries at this valuation, laddering beat deploying-all-at-once in <strong>' + Math.round(b.win) + '%</strong> of them.';
    }
  }

  // ════════ LIVE READOUT (rule #2: rendered with its caveats) ════════
  function renderLive(price, source) {
    liveTodayPrice = price;
    liveTodayPos = posOf(price, TODAY_DAYS);
    var posEl = document.getElementById('lslLivePos');
    var recEl = document.getElementById('lslLiveRec');
    var metaEl = document.getElementById('lslLiveMeta');
    var ratio = price / plPrice(TODAY_DAYS);
    if (posEl) posEl.innerHTML = 'Channel position <strong>' + liveTodayPos.toFixed(2) + '</strong> · ' + posLabel(liveTodayPos);
    if (recEl) {
      var rec;
      if (liveTodayPos < 0.33) rec = 'the tool leans <b>decisive — deploy</b>: spreading purchases mostly means paying more as price reverts up toward trend.';
      else if (liveTodayPos < 0.66) rec = 'this is a genuine <b>coin-flip</b> — regret-minimisation fairly decides, and commitment matters more than the tactic.';
      else rec = 'spreading is the <b>model-rational hedge</b> against the mean-reversion the channel itself predicts.';
      recEl.innerHTML = 'With price ' + posLabel(liveTodayPos) + ', ' + rec;
    }
    if (metaEl) metaEl.textContent = 'Live: ' + fmtUSD(price) + ' · ' + ratio.toFixed(2) + '× trend' + (source === 'live' ? '' : ' (latest sample)') + ' · recomputed every load.';
    if (advChart) advChart.update('none');
  }

  // ════════ TABLES ════════
  function renderBackstop() {
    var bs = backstop(), tb = document.getElementById('lslBackstopBody'); if (!tb) return;
    var rows = [['lower', 'Lower channel'], ['mid', 'Mid-channel'], ['upper', 'Upper channel']];
    var html = '';
    for (var r = 0; r < rows.length; r++) {
      var key = rows[r][0];
      html += '<tr class="lsl-row-' + key + '"><th>' + rows[r][1] + '</th>';
      for (var h = 0; h < HOLDS.length; h++) {
        var v = bs[key][HOLDS[h]];
        html += '<td' + (h === HOLDS.length - 1 ? ' class="lsl-strong"' : '') + '>' + fmtMult(v) + '</td>';
      }
      html += '</tr>';
    }
    tb.innerHTML = html;
    // horizon-keyed takeaway
    var wr = worstRecovery(), tk = document.getElementById('lslBackstopTakeaway');
    if (tk) {
      var H = state.horizon, up = bs.upper[H];
      tk.innerHTML = 'Even <strong>upper-channel</strong> entries — the worst-timed buys — returned about <strong>' + fmtMult(up) + '</strong> on average after ' + H + ' years. '
        + 'The literal worst entries in history (buying blow-off tops above the upper band) still returned <strong>' + fmtMult(wr.min) + ' to ' + fmtMult(wr.max) + '</strong> by the latest sample. '
        + 'Commitment over a long horizon dominates the tactic entirely — the tactic is a margin; commitment is the foundation.';
    }
  }
  function renderCompression() {
    var cp = compression(), tb = document.getElementById('lslCompressionBody'); if (!tb) return;
    var html = '';
    for (var i = 0; i < cp.length; i++) html += '<tr><th>' + cp[i].label + '</th><td class="lsl-strong">' + cp[i].max.toFixed(2) + '</td></tr>';
    tb.innerHTML = html;
  }
  function renderMethod() {
    var w = document.getElementById('lslMethodWindow');
    if (w) {
      var first = dateOf(MIN_D), last = dateOf(LAST_D);
      function ym(dt) { return dt.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }
      w.innerHTML = '<code>PL_DATA</code> window: ' + ym(first) + ' – ' + ym(last) + ' (' + N + ' samples, ~12-day spacing)';
    }
  }

  // ════════ CONTROLS ════════
  function wire() {
    var scrub = document.getElementById('lslScrub');
    var scrubRead = document.getElementById('lslScrubReadout');
    function syncScrubReadout() {
      if (scrubRead) scrubRead.innerHTML = 'position <strong>' + state.pos.toFixed(2) + '</strong> · ' + ratioOf(state.pos).toFixed(2) + '× trend · <em>' + posLabel(state.pos) + '</em>';
    }
    if (scrub) {
      scrub.value = Math.round(state.pos * 100);
      scrub.addEventListener('input', function () {
        state.pos = Math.max(0, Math.min(1, this.value / 100));
        syncScrubReadout(); updateMarkerOnly(); updateEntryLine(); updateVerdict();
      });
    }
    syncScrubReadout();

    var dec = document.querySelectorAll('.lsl-decision button');
    dec.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.decision = btn.getAttribute('data-decision');
        dec.forEach(function (b) { b.classList.toggle('active', b === btn); });
        updateVerdict();
      });
    });

    var era = document.querySelectorAll('.lsl-era button');
    era.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.era = btn.getAttribute('data-era');
        era.forEach(function (b) { b.classList.toggle('active', b === btn); });
        updateAdvChart(); applyChannelWindow(); updateVerdict();   // era also drives channel x-range (Amendment 2)
      });
    });

    var lens = document.querySelectorAll('.lsl-lens button');
    lens.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.lens = btn.getAttribute('data-lens');
        lens.forEach(function (b) { b.classList.toggle('active', b === btn); });
        document.body.setAttribute('data-lsl-lens', state.lens);  // CSS hook (axis caption swap, etc.)
        updateAdvChart(); applyChannelWindow(); setForwardCaveat(); updateVerdict();
      });
    });

    var ladder = document.getElementById('lslLadder');
    var ladderVal = document.getElementById('lslLadderVal');
    if (ladder) ladder.addEventListener('input', function () {
      var months = parseInt(this.value, 10);
      state.ladderN = Math.max(2, Math.round(months * 2.53));
      if (ladderVal) ladderVal.textContent = months >= 12 && months % 12 === 0 ? (months / 12) + (months === 12 ? ' yr' : ' yrs') : months + ' mo';
      updateAdvChart(); updateVerdict();
    });

    var horizon = document.getElementById('lslHorizon');
    var horizonVal = document.getElementById('lslHorizonVal');
    if (horizon) horizon.addEventListener('input', function () {
      state.horizon = parseInt(this.value, 10);
      if (horizonVal) horizonVal.textContent = state.horizon + ' yrs';
      renderBackstop();
      applyChannelWindow();   // projective forward extent is the horizon year (Amendment 1)
    });

    var sum = document.getElementById('lslSum');
    var sumVal = document.getElementById('lslSumVal');
    if (sum) sum.addEventListener('input', function () {
      state.sum = parseInt(this.value, 10);
      if (sumVal) sumVal.textContent = fmtUSD(state.sum);
    });
  }

  // ════════ ADVANCED / OPTIONAL DISCLOSURE (design §6.1) ════════
  // Layered on top of the core decision; kept deliberately quiet so it never
  // competes with the scrubber for "the thing you manipulate."
  function primaryAdvAt(pos) {
    if (state.lens === 'projective') return simFwdAdv(pos, 'revert', state.ladderN);
    var b = bucketAt(state.era, state.ladderN, pos);
    return b.n ? b.mean : 0;
  }
  function wireAdvanced() {
    // (i) Manual %-now / %-laddered blend — the executed middle ground.
    var blend = document.getElementById('lslBlend'), blendVal = document.getElementById('lslBlendVal'), blendOut = document.getElementById('lslBlendOut');
    function renderBlend() {
      if (!blendOut) return;
      var f = state.blend / 100, base = primaryAdvAt(state.pos), blended = f * base;
      var sign = function (v) { return (v < 0 ? '' : '+') + v.toFixed(0) + '%'; };
      if (state.blend === 0) blendOut.innerHTML = 'All at once &mdash; the binary&rsquo;s &ldquo;deploy&rdquo; state. Slide right to spread part of it.';
      else if (state.blend === 100) blendOut.innerHTML = 'Fully laddered &mdash; the binary&rsquo;s &ldquo;ladder&rdquo; state (' + sign(base) + ' vs all-now).';
      else blendOut.innerHTML = 'Deploy <strong>' + (100 - state.blend) + '% now</strong>, ladder <strong>' + state.blend + '%</strong> &mdash; lands at <strong>' + sign(blended) + '</strong> vs all-now, between the two endpoints.';
    }
    if (blend) blend.addEventListener('input', function () { state.blend = parseInt(this.value, 10); if (blendVal) blendVal.textContent = state.blend + '% laddered'; renderBlend(); });
    renderBlend();

    // (ii) Recurring-windfall planner — ongoing DCA + a periodic lump, projected
    // forward along the central trend (a planning surface, not a forecast).
    var rw = document.getElementById('lslRwWeekly'), ra = document.getElementById('lslRwAnnual'), rh = document.getElementById('lslRwYears');
    function setText(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }
    function renderRw() {
      if (!rw) return;
      var weekly = parseFloat(rw.value) || 0, annual = parseFloat(ra && ra.value) || 0, yrs = parseInt(rh && rh.value, 10) || 1;
      var btc = 0, deployed = 0, weeks = Math.round(yrs * 52);
      for (var w = 0; w < weeks; w++) {
        var price = plPrice(todayD + w * 7);
        if (weekly > 0) { btc += weekly / price; deployed += weekly; }
        if (w > 0 && w % 52 === 0 && annual > 0) { btc += annual / price; deployed += annual; }
      }
      var value = btc * plPrice(todayD + yrs * 365.25);
      setText('lslRwDeployed', fmtUSD(deployed));
      setText('lslRwBtc', btc.toFixed(4) + ' BTC');
      setText('lslRwValue', fmtUSD(value));
      setText('lslRwMult', deployed > 0 ? (value / deployed).toFixed(1) + '×' : '—');
    }
    [rw, ra, rh].forEach(function (el) { if (el) el.addEventListener('input', function () { if (el === rh) setText('lslRwYearsVal', el.value + ' yrs'); renderRw(); }); });
    renderRw();
  }

  // ════════ INIT ════════
  function init() {
    buildAdvChart();
    buildChannelChart();
    applyChannelWindow();          // initial x-range / y-refit
    setForwardCaveat();            // hidden in retrospective
    document.body.setAttribute('data-lsl-lens', state.lens);
    wire();
    wireAdvanced();
    updateVerdict();
    renderBackstop();
    renderCompression();
    renderMethod();
    renderLive(TODAY_PRICE, 'seed');   // seed immediately
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price, source) { renderLive(price, source); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
