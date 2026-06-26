/* =============================================================
   Lump Sum or Ladder In? — page script
   (Stage 2C-①: the teaching demonstration · retrospective only)

   Reads PL_DATA + PL_A/PL_B/PL_FLOOR/PL_CEIL + GENESIS_TS + plPrice +
   TODAY_DAYS/TODAY_PRICE + fetchTodayPrice from shared/power-law-data.js
   (loaded before this file via the page's page_scripts). Constants are
   NOT redeclared.

   Everything is computed live from the current PL_DATA at load — the
   advantage curve, the commitment-backstop table, the volatility-
   compression table, the worst-entry recovery, and today's channel
   position. Nothing is hard-coded (cross-cutting rule #1).

   This page is the retrospective teaching demonstration. The projective
   lens, manual-blend, and recurring-windfall planner were removed in
   Stage 2C-①; the forward path model was LIFTED to
   shared/deployment-projection.js for reuse by Page 2
   (/your-deployment-plan), not deleted. The channel-orientation chart
   was promoted ABOVE the scrubber into the "Where are we right now?"
   context section, gaining the canonical glowing "you are here" pulse
   (STYLE_GUIDE §6.23) and a live factual position callout.
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
    era: 'post-2020',        // default recent (design §7); also drives the context chart x-range
    ladderN: 30,             // ~1yr of ~12-day samples
    horizon: 4               // years (drives the commitment-backstop takeaway)
  };
  var CTX_PAD_Y = 0.4;       // years of channel drawn past today so the "today" marker isn't at the edge
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
  // Sitewide channel-position display (item 3): the ×-trend multiple + a plain
  // location label — the Gallery's treatment. The raw position stays internal
  // (logic only); it is never shown as the primary number.
  function posDisplay(pos) { return ratioOf(pos).toFixed(2) + '× trend · ' + posLabel(pos); }
  var UPPER_RISK = 0.75;   // three-zone threshold (item 12): sparse upper channel

  // ════════ ADVANTAGE CHART (the novel, retrospective curve) ════════
  var advChart = null, channelChart = null;

  // zero reference line + live today marker for the advantage chart
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
      // today's live position (vertical) — computed live, never baked in
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
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,9,8,0.95)', borderColor: 'rgba(224,148,34,0.5)', borderWidth: 1,
            titleColor: AMBER, bodyColor: '#ddd', displayColors: false,
            filter: function (it) { return it.dataset.label !== 'Your position'; },
            callbacks: {
              title: function (it) { return 'Channel position ' + (+it[0].parsed.x).toFixed(2); },
              label: function (it) {
                var y = it.parsed.y;
                return (y < 0 ? 'all-now +' + Math.abs(y).toFixed(0) + '%' : 'ladder +' + y.toFixed(0) + '%') + ' BTC';
              }
            }
          }
        }
      },
      plugins: [advGuides]
    });
  }

  function updateAdvChart() {     // full refresh (era / ladder)
    if (!advChart) return;
    advChart.data.datasets = advDatasets();
    advChart.update('none');
  }
  function updateMarkerOnly() {
    if (!advChart) return;
    var ds = advChart.data.datasets;
    ds[ds.length - 1].data = [{ x: state.pos, y: markerY() }];
    advChart.update('none');
  }

  // ════════ CHANNEL CONTEXT CHART (promoted above the scrubber) ════════
  // Price vs time + bands + scrubbed entry line + a live, glowing "you are
  // here" today marker. Retrospective only — the bands stop just past today
  // (no forward extension; that moved to Page 2 with the projection).
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

  // Soft radial halo behind the today dot (canonical treatment from The
  // Gallery's first chart / DR source). Draws BEFORE the today dataset so
  // the dot sits on top of the halo.
  var TODAY_DS = 5;   // index of the single-point "Today" dataset
  var todayGlow = {
    id: 'todayGlow',
    beforeDatasetDraw: function (chart, args) {
      if (args.index !== TODAY_DS) return;
      var meta = chart.getDatasetMeta(TODAY_DS);
      if (!meta || !meta.data || !meta.data[0]) return;
      var p = meta.data[0];
      if (typeof p.x !== 'number' || typeof p.y !== 'number') return;
      var g = chart.ctx;
      g.save();
      var grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
      grad.addColorStop(0, 'rgba(224,148,34,0.55)');
      grad.addColorStop(0.45, 'rgba(224,148,34,0.22)');
      grad.addColorStop(1, 'rgba(224,148,34,0)');
      g.fillStyle = grad;
      g.beginPath(); g.arc(p.x, p.y, 16, 0, Math.PI * 2); g.fill();
      g.restore();
    }
  };

  // Canonical "you are here" pulse halo (STYLE_GUIDE §6.23). Positions the
  // #lslChannelPulse element over the today data point on each render so the
  // CSS animation runs at the live data location.
  var lcsPulse = {
    id: 'lcsPulse',
    afterRender: function (c) {
      var pulse = document.getElementById('lslChannelPulse');
      if (!pulse || !c.scales || !c.scales.x || !c.scales.y) return;
      var price = (liveTodayPrice != null) ? liveTodayPrice : TODAY_PRICE;
      var x = c.scales.x.getPixelForValue(todayD);
      var y = c.scales.y.getPixelForValue(price);
      if (x < c.chartArea.left - 4 || x > c.chartArea.right + 4 ||
          y < c.chartArea.top - 4 || y > c.chartArea.bottom + 4) {
        pulse.classList.remove('is-visible');
        return;
      }
      pulse.style.left = (c.canvas.offsetLeft + x) + 'px';
      pulse.style.top = (c.canvas.offsetTop + y) + 'px';
      pulse.classList.add('is-visible');
    }
  };

  function bands() {
    var trend = [], floor = [], upper = [], hi = todayD + CTX_PAD_Y * 365.25;
    for (var d = MIN_D; d <= hi; d += 30) { var t = plPrice(d); trend.push({ x: d, y: t }); floor.push({ x: d, y: t * PL_FLOOR }); upper.push({ x: d, y: t * PL_CEIL }); }
    return { trend: trend, floor: floor, upper: upper };
  }
  function entryLine(pos) {
    var r = ratioOf(pos), line = [], hi = todayD + CTX_PAD_Y * 365.25;
    for (var d = MIN_D; d <= hi; d += 30) line.push({ x: d, y: plPrice(d) * r });
    return line;
  }
  function buildChannelChart() {
    var el = document.getElementById('lslChannelChart'); if (!el) return;
    var b = bands();
    channelChart = new Chart(el, {
      type: 'line',
      data: {
        datasets: [
          { label: 'Floor (0.42×)', data: b.floor, borderColor: RUST, borderWidth: 1.3, borderDash: [6, 3], pointRadius: 0, tension: 0.2, order: 5 },
          { label: 'Trend', data: b.trend, borderColor: TREND, borderWidth: 1.8, pointRadius: 0, tension: 0.2, order: 4 },
          { label: 'Upper (3×)', data: b.upper, borderColor: '#d4a843', borderWidth: 1.1, borderDash: [1, 5], pointRadius: 0, tension: 0.2, order: 6 },
          { label: 'Tested entry valuation', data: entryLine(state.pos), borderColor: '#f2eee8', borderWidth: 1.6, borderDash: [7, 4], pointRadius: 0, tension: 0.2, order: 3 },
          { label: 'Historical price', data: PL_DATA.map(function (p) { return { x: p[0], y: p[1] }; }), borderColor: HISTORY, borderWidth: 1.2, pointRadius: 0, tension: 0.15, order: 1 },
          { label: 'Today', data: [{ x: todayD, y: TODAY_PRICE }], borderColor: AMBER, backgroundColor: AMBER, pointRadius: 5, pointHoverRadius: 6, showLine: false, order: 0 }
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
      plugins: [todayLine, todayGlow, lcsPulse]
    });
  }
  function updateEntryLine() {
    if (!channelChart) return;
    channelChart.data.datasets[3].data = entryLine(state.pos);
    channelChart.update('none');
  }
  // The era control sets the visible x-range; refit the log-Y to the window
  // so the bands open up. The "today" marker is always kept on-canvas.
  function applyChannelWindow() {
    if (!channelChart) return;
    var xmin = (state.era === 'full') ? MIN_D : Math.max(MIN_D, eraStartDay(state.era));
    var xmax = todayD + CTX_PAD_Y * 365.25;
    var lo = Infinity, hi = 0, d, t;
    for (d = xmin; d <= xmax; d += 30) { t = plPrice(d); if (t * PL_FLOOR < lo) lo = t * PL_FLOOR; if (t * PL_CEIL > hi) hi = t * PL_CEIL; }
    for (var i = 0; i < N; i++) { if (S[i].d >= xmin && S[i].d <= xmax) { if (S[i].p < lo) lo = S[i].p; if (S[i].p > hi) hi = S[i].p; } }
    var x = channelChart.options.scales.x, y = channelChart.options.scales.y;
    x.min = xmin; x.max = xmax; y.min = lo * 0.6; y.max = hi * 1.7;
    channelChart.update('none');
  }

  // ════════ VERDICT (retrospective) ════════
  function ladderDurationLabel() {
    var months = Math.round(state.ladderN / 2.53);
    return months >= 12 ? (months % 12 === 0 ? (months / 12) + (months === 12 ? ' year' : ' years') : (months + ' months')) : months + ' months';
  }
  function updateVerdict() {
    var lead = document.getElementById('lslVerdictLead');
    var main = document.getElementById('lslVerdictMain');
    var detail = document.getElementById('lslVerdictDetail');
    if (!main) return;

    var b = bucketAt(state.era, state.ladderN, state.pos);
    if (lead) lead.textContent = 'At ' + posDisplay(state.pos) + ' · laddered over ' + ladderDurationLabel();
    updateRiskFlag();
    if (b.n < 4) {
      main.innerHTML = 'Bitcoin has rarely sat <em>' + posLabel(state.pos) + '</em> in this window — too few historical entries here to read.';
      if (detail) detail.innerHTML = '<span class="lsl-sparse">Widen the window or move the scrubber toward where price has actually spent time.</span>';
      return;
    }
    var adv = b.mean, lumpWins = adv < 0, mag = Math.abs(adv).toFixed(0);
    var html, dec = state.decision;
    if (lumpWins) {
      html = dec === 'all-now'
        ? 'At this valuation, deploying <strong>all at once</strong> historically accumulated <strong>' + mag + '% more BTC</strong> than laddering in — the channel favoured decisiveness here.'
        : 'At this valuation, laddering in historically gave up <strong>' + mag + '% of the BTC</strong> that deploying all at once would have captured — the channel favoured decisiveness here.';
    } else {
      html = dec === 'ladder-in'
        ? 'At this valuation, laddering in historically accumulated <span class="lsl-dca">' + mag + '% more BTC</span> than deploying all at once — higher in the channel, spreading more often came out ahead.'
        : 'At this valuation, deploying all at once historically gave up <span class="lsl-dca">' + mag + '% of the BTC</span> laddering in would have captured — higher in the channel, spreading more often came out ahead.';
    }
    main.innerHTML = html;
    if (detail) {
      detail.innerHTML = 'Across <strong>' + b.n + '</strong> historical entries at this valuation, laddering beat deploying-all-at-once in <strong>' + Math.round(b.win) + '%</strong> of them. '
        + '<span class="lsl-sparse">A demonstration across history — not a call for your own situation. That’s the next page.</span>';
    }
  }

  // ════════ THREE-ZONE UPPER-CHANNEL RISK FLAG (item 12, fires on scrubbed pos) ════════
  // Counts distinct historical years with entries near the scrubbed position to
  // judge how thin the sample is (the upper channel clusters into a few brief
  // blow-off tops). Position-keyed, identical framing to Page 2's live flag.
  function distinctYearsNear(pos) {
    var yrs = {}, c = 0;
    for (var i = 0; i < N; i++) if (Math.abs(S[i].pos - pos) <= 0.07) { if (!yrs[S[i].yr]) { yrs[S[i].yr] = 1; c++; } }
    return c;
  }
  function updateRiskFlag() {
    var el = document.getElementById('lslRisk'); if (!el) return;
    if (state.pos < UPPER_RISK) { el.hidden = true; return; }
    var dy = distinctYearsNear(state.pos), thin = dy < 6;
    el.hidden = false;
    el.innerHTML = '<span class="lsl-risk-tag">High-risk zone for lump deployment</span> '
      + 'Up here a lump buys into the mean-reversion the channel predicts &mdash; this is where laddering&rsquo;s hedge earns its keep. Frame it honestly as a <strong>drawdown hedge, not a reliable edge</strong>: the rising channel means even the hedge isn&rsquo;t guaranteed to pay.'
      + (thin ? ' <span class="lsl-risk-thin">Small sample &mdash; only ~' + dy + ' distinct years sat this high, clustered into a handful of brief blow-off tops. Treat the demonstration here as illustrative, not statistical.</span>' : '');
  }

  // ════════ LIVE CHANNEL CONTEXT (factual position callout — no recommendation) ════════
  // Page 1 states where price sits today as fact; the "deploy / hedge"
  // recommendation lives on Page 2 (the personal model). Computed live,
  // never baked in (rule #1).
  function renderChannelContext(price, source) {
    liveTodayPrice = price;
    liveTodayPos = posOf(price, TODAY_DAYS);
    var ratio = price / plPrice(TODAY_DAYS);
    var posEl = document.getElementById('lslCtxPos');
    var metaEl = document.getElementById('lslCtxMeta');
    if (posEl) posEl.innerHTML = 'Today: <strong>' + ratio.toFixed(2) + '×</strong> trend · <em>' + posLabel(liveTodayPos) + '</em>';
    if (metaEl) metaEl.textContent = 'Live: ' + fmtUSD(price) + (source === 'live' ? '' : ' (latest sample)') + ' · floor 0.42× trend, upper band 3× · recomputed every load.';
    // poke the live today marker on the context chart so the dot + pulse track the live spot
    if (channelChart && channelChart.data && channelChart.data.datasets[TODAY_DS]) {
      channelChart.data.datasets[TODAY_DS].data[0].y = price;
      channelChart.update('resize');   // 'resize' so the in-place mutation relayouts and the pulse repositions
    }
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
      tk.innerHTML = 'Over a <strong>' + H + '-year</strong> hold, even <strong>upper-channel</strong> entries — the worst-timed buys — returned about <strong>' + fmtMult(up) + '</strong> on average; the literal worst entries in history (blow-off tops above the upper band) still returned <strong>' + fmtMult(wr.min) + ' to ' + fmtMult(wr.max) + '</strong> by the latest sample. '
        + 'That is a multi-year tendency, <em>not</em> a guarantee: over short horizons entries have frequently sat underwater — including now, with price below half its prior high. Recovery has historically come with time held, not on demand.';
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
      if (scrubRead) scrubRead.innerHTML = '<strong>' + ratioOf(state.pos).toFixed(2) + '×</strong> trend · <em>' + posLabel(state.pos) + '</em>';
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
        updateAdvChart(); applyChannelWindow(); updateVerdict();   // era buckets the backtest AND sets the context chart x-range
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
    });
  }

  // ════════ INIT ════════
  function init() {
    buildAdvChart();
    buildChannelChart();
    applyChannelWindow();          // initial x-range / y-refit
    wire();
    updateVerdict();
    renderBackstop();
    renderCompression();
    renderMethod();
    renderChannelContext(TODAY_PRICE, 'seed');   // seed immediately
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price, source) { renderChannelContext(price, source); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
