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
   Stage 2C-①; the forward path model went to
   shared/deployment-projection.js for Page 2 (/your-deployment-plan),
   which since 2026-10-14 prices from shared/price-cases.js instead; the
   file was deleted on 2026-10-18 (git history has it). The channel-orientation chart
   was promoted ABOVE the slider into the "Where are we right now?"
   context section, gaining the canonical glowing "you are here" pulse
   (STYLE_GUIDE §6.23) and a live factual position callout.
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;
  if (!window.LadderAdvantage) return;   // shared/ladder-advantage.js must load first

  // ── Palette ──
  var AMBER = '#e09422', BLUE = '#6db3d4', RUST = '#c0392b';
  var MUTED = '#877e6f', DIM = '#9a9080', TREND = '#e09422', HISTORY = 'rgba(232,224,210,0.6)';

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

  // ── The position-conditioned advantage record now lives in a shared module ──
  // Extracted 2026-09-01 (Rundown v2, JM ruling 3) to shared/ladder-advantage.js
  // so this page and The Rundown's D2 snack read ONE copy and cannot drift.
  // The local names below are thin delegations: every call site on this page is
  // unchanged, and the arithmetic is byte-for-byte what it was — the shared
  // module builds the same S from the same PL_DATA with the same posOf.
  var LA = window.LadderAdvantage;

  function eraStartDay(era) { return LA.eraStartDay(era); }

  // ── State ──
  var state = {
    // Defaults to today's LIVE channel position on load (Stage 2D-B1). Set once the
    // live price resolves (renderChannelContext); until the reader drags the slider it
    // tracks live. This is a computed value, never baked into static copy (rule #1).
    pos: 0.40,
    era: 'post-2020',        // default recent (design §7); also drives the context chart x-range
    ladderN: 30,             // ~1yr of ~12-day samples
    horizon: 4               // years (drives the commitment-backstop takeaway; its slider was removed in 2D-B2)
  };
  var userMoved = false;     // true once the reader drags the slider — stops the live-position auto-sync
  var CTX_PAD_Y = 0.4;       // years of channel drawn past today so the "today" marker isn't at the edge
  var WIN = LA.WIN;          // channel-position window for binning entries (shared)
  var liveTodayPos = null, liveTodayPrice = null;

  // ── Core backtest: ladder-in advantage at one entry index ──
  // returns (ladder_BTC / lump_BTC - 1) * 100  (positive = laddering got MORE BTC)
  // Shared since 2026-09-01 — see the delegation note above.
  function ladderAdvantage(i, ladderN) { return LA.ladderAdvantage(i, ladderN); }

  // mean ladder-advantage + win-rate over entries within WIN of position p
  function bucketAt(era, ladderN, p) { return LA.bucketAt(era, ladderN, p); }

  // advantage curve across channel position (binned, sliding window)
  function advantageCurve(era, ladderN) { return LA.advantageCurve(era, ladderN); }

  // ── §4.3 commitment backstop: mean value-multiple by entry bucket & hold length ──
  function bucketName(pos) { return pos < 0.33 ? 'lower' : (pos < 0.66 ? 'mid' : 'upper'); }
  function nearestIdx(targetD) {
    var best = 0, bd = Infinity;
    for (var j = 0; j < N; j++) { var dd = Math.abs(S[j].d - targetD); if (dd < bd) { bd = dd; best = j; } }
    return best;
  }
  var HOLDS = [2, 4, 6, 8];
  // Today-anchored commitment backstop (Stage 2E-A1): for each hold length N, take
  // entries deployed ~N years ago (a ~1.8yr window centred N years before today),
  // bucket by channel position, and value each at TODAY's live price ÷ entry price —
  // what each entry would actually be worth now. Recomputes live as the price moves;
  // supersedes the old historical-exit convention (which measured cycle-peak exits and
  // produced implausible thousands-× cells).
  function exitPrice() { return liveTodayPrice != null ? liveTodayPrice : TODAY_PRICE; }
  function backstop() {
    var exit = exitPrice(), HALF = 0.9 * 365.25, agg = { lower: {}, mid: {}, upper: {} }, b, h;
    for (b in agg) for (h = 0; h < HOLDS.length; h++) agg[b][HOLDS[h]] = [];
    for (h = 0; h < HOLDS.length; h++) {
      var center = todayD - HOLDS[h] * 365.25;
      for (var i = 0; i < N; i++) {
        if (Math.abs(S[i].d - center) > HALF) continue;
        agg[bucketName(S[i].pos)][HOLDS[h]].push(exit / S[i].p);
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

  // ── Stage 2F: the COST of deploying high — median max-drawdown-within-2yr for
  //    high-channel entries (2017+). The drawdown below your deploy price within two
  //    years, before any recovery. Computed once from the canonical series, never baked
  //    in. This is the only number the "deploying high" caution shows; waiting is
  //    mechanism-prose (a high reading reverting is channel geometry, not a tradeable
  //    edge — showing a win-rate would make it a timing tool). ──
  function channelDrawdown(minPos) {
    var cut = (Date.UTC(2017, 0, 1) / 1000 - GENESIS_TS) / 86400, dds = [];
    for (var i = 0; i < N; i++) {
      if (S[i].d < cut || S[i].pos < minPos) continue;
      if (S[i].d + 2 * 365.25 > LAST_D) continue;       // need the full 2yr window
      var lo = S[i].p, end = S[i].d + 2 * 365.25;
      for (var j = i; j < N && S[j].d <= end; j++) if (S[j].p < lo) lo = S[j].p;
      dds.push((S[i].p - lo) / S[i].p);
    }
    dds.sort(function (a, b) { return a - b; });
    return { n: dds.length, median: dds.length ? dds[Math.floor(dds.length * 0.5)] : null, worst: dds.length ? dds[dds.length - 1] : null };
  }
  var DD_UPPER = channelDrawdown(0.667);   // upper third (pos ≥ 0.667) — the headline figure

  // ── Formatting helpers ──
  function fmtMult(m) { return m == null ? '—' : (m >= 100 ? Math.round(m).toLocaleString() : m.toFixed(1)) + '×'; }
  function fmtUSD(v) {
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }
  // Delegates to the shared graduated vocabulary (Stage 2H) so this page's readouts and
  // prose use the one canonical label set — no drifted local thresholds.
  function posLabel(pos) { return positionLabel(pos); }
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
      // slider position (moving, solid cream) — couples the slider to the curve;
      // distinct from the fixed amber-dashed TODAY line (Stage 2E-B). The full
      // −0.1→1.15 x-range is preserved so the lump→ladder crossover stays visible.
      var xsl = xS.getPixelForValue(state.pos);
      if (xsl >= area.left && xsl <= area.right) {
        ctx.save(); ctx.strokeStyle = 'rgba(242,238,232,0.6)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(xsl, area.top); ctx.lineTo(xsl, area.bottom); ctx.stroke();
        ctx.fillStyle = '#f2eee8'; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('SLIDER', xsl, area.bottom - 4); ctx.restore();
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

  // ════════ CHANNEL CONTEXT CHART (promoted above the slider) ════════
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
          { label: "Entry you're testing", data: entryLine(state.pos), borderColor: '#f2eee8', borderWidth: 1.6, borderDash: [7, 4], pointRadius: 0, tension: 0.2, order: 3 },
          // trailing point at todayD so the white line reaches the live Today marker (2E-C1); its y is updated live in renderChannelContext
          { label: 'Historical price', data: PL_DATA.map(function (p) { return { x: p[0], y: p[1] }; }).concat([{ x: todayD, y: TODAY_PRICE }]), borderColor: HISTORY, borderWidth: 1.2, pointRadius: 0, tension: 0.15, order: 1 },
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

  // ════════ READOUT: aligned single-strategy cluster (Stage 2D-B1) ════════
  // The slider's Gallery-style position readout (×trend + plain label).
  function syncScrubReadout() {
    var el = document.getElementById('lslScrubReadout');
    if (el) el.innerHTML = '<strong>' + ratioOf(state.pos).toFixed(2) + '×</strong> trend · <em>' + posLabel(state.pos) + '</em>';
  }
  // Place the "today" tick on the slider track at the live channel position.
  function positionTodayMarker() {
    var m = document.getElementById('lslTodayMarker');
    if (!m) return;
    if (liveTodayPos == null) { m.classList.remove('is-visible'); return; }
    m.style.left = (Math.max(0, Math.min(1, liveTodayPos)) * 100) + '%';
    m.classList.add('is-visible');
    /* The slider runs floor → upper band, so below the floor today's marker sits
       at its left end and the readout says 0.42× (2026-11-21, with today at
       0.36×). The caption says where today actually is. */
    var cap = document.getElementById('lslTodayCaption');
    if (cap) {
      cap.innerHTML = liveTodayPos < 0
        ? 'Today is below the floor, at ' + ratioOf(liveTodayPos).toFixed(2) + '&times; trend. The slider starts at the floor, the closest position it covers. Drag to explore other points.'
        : 'Current position today is here &mdash; drag to explore other points.';
    }
  }
  // One lede + two boxes, BOTH describing the winning tactic, flipping together as one unit.
  function updateBoxes() {
    var lede = document.getElementById('lslLede'), boxes = document.getElementById('lslBoxes');
    var magEl = document.getElementById('lslBoxMag'), magSub = document.getElementById('lslBoxMagSub');
    var freqEl = document.getElementById('lslBoxFreq'), freqSub = document.getElementById('lslBoxFreqSub');
    var detail = document.getElementById('lslVerdictDetail');
    if (!lede || !boxes) return;
    syncScrubReadout();
    updateRiskFlag();
    var b = bucketAt(state.era, state.ladderN, state.pos);
    if (b.n < 4) {
      lede.innerHTML = 'Bitcoin has rarely sat <em>' + posLabel(state.pos) + '</em> in this window &mdash; too few historical entries here to read.';
      boxes.style.display = 'none';
      if (detail) detail.innerHTML = '<span class="lsl-sparse">Widen the window or move the slider toward where price has actually spent time.</span>';
      renderLedger();
      return;
    }
    boxes.style.display = '';
    // Always the literal winner — no special mid-channel "wash" state (B1 #6); the
    // small magnitude / near-50% frequency near trend is the honest message.
    var adv = b.mean, ladderWon = adv > 0;
    var winName = ladderWon ? 'laddering in' : 'deploying all at once';
    var winRate = ladderWon ? b.win : (100 - b.win);   // how often the WINNER beat the other
    lede.innerHTML = 'At this position, the tactic that served you better was <span class="'
      + (ladderWon ? 'lsl-win-ladder' : 'lsl-win-lump') + '">' + winName + '</span>:';
    boxes.classList.toggle('is-ladder', ladderWon);
    boxes.classList.toggle('is-lump', !ladderWon);
    if (magEl) magEl.textContent = '+' + Math.abs(adv).toFixed(0) + '%';
    if (magSub) magSub.textContent = 'more BTC accumulated';
    if (freqEl) freqEl.textContent = Math.round(winRate) + '%';
    if (freqSub) freqSub.textContent = 'of ' + b.n + ' historical entries here';
    if (detail) detail.innerHTML = '<span class="lsl-sparse">A demonstration across history &mdash; not a call for your own situation. That&rsquo;s the next page.</span>';
    renderLedger();
  }
  // Apply a new slider position — from a drag (fromUser) or from the live default.
  function setSliderPos(pos, fromUser) {
    state.pos = Math.max(0, Math.min(1, pos));
    if (fromUser) userMoved = true;
    var scrub = document.getElementById('lslScrub');
    if (scrub && !fromUser) scrub.value = Math.round(state.pos * 100);
    updateMarkerOnly(); updateEntryLine(); updateBoxes();
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

  // ════════ Stage 6: static "deploying high in the channel" risk figure ════════
  // The full position-by-position waiting/drawdown explorer now lives on page 3
  // (/wait-or-deploy-now). Page 1 keeps only the headline COST — computed live from
  // DD_UPPER, presented statically (no slider, no tiers) — plus a live readout of
  // today's position so the decisiveness-while-low framing stays accurate.
  function renderHighRiskFigure() {
    var m = document.getElementById('lslHrMedian'), w = document.getElementById('lslHrWorst');
    if (m && DD_UPPER.median != null) m.textContent = Math.round(DD_UPPER.median * 100);
    if (w && DD_UPPER.worst != null) w.textContent = Math.round(DD_UPPER.worst * 100);
  }
  // Live readout of today's channel position (label + ×-trend), mirroring how the rest
  // of page 1 references "today". Filled from the live position; no slider drives it.
  function renderHrToday() {
    var el = document.getElementById('lslHrToday');
    if (!el || liveTodayPos == null) return;
    el.innerHTML = ratioOf(liveTodayPos).toFixed(2) + '× trend &middot; <em>' + posLabel(liveTodayPos) + '</em>';
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
    // One declarative live line (B3): "Today (live): $X · 0.XX× trend · <plain label>"
    // Label via the shared helper so provenance wording is identical site-wide.
    if (posEl) posEl.innerHTML = todayPriceLabel(source)
      + ': <strong>' + fmtUSD(price) + '</strong> &middot; ' + ratio.toFixed(2) + '× trend &middot; <em>' + posLabel(liveTodayPos) + '</em>';
    // poke the live today marker on the context chart so the dot + pulse track the live spot
    if (channelChart && channelChart.data && channelChart.data.datasets[TODAY_DS]) {
      channelChart.data.datasets[TODAY_DS].data[0].y = price;
      var hist = channelChart.data.datasets[4].data;       // extend the white line to the live Today marker (2E-C1)
      hist[hist.length - 1].y = price;
      channelChart.update('resize');   // 'resize' so the in-place mutation relayouts and the pulse repositions
    }
    if (advChart) advChart.update('none');
    // The slider tracks today's live position until the reader drags it (B1).
    positionTodayMarker();
    if (!userMoved) setSliderPos(liveTodayPos, false);
    // The shed risk section just shows today's position as a live readout (Stage 6);
    // no slider to sync — the depth lives on page 3 now.
    renderHrToday();
    renderBackstop();   // today-anchored table recomputes with the live exit price (2E-A1)
    renderLedger();     // Check the work names today's position
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
    // horizon-keyed takeaway (today-anchored: deployed N years ago, held to today)
    var tk = document.getElementById('lslBackstopTakeaway');
    if (tk) {
      var H = state.horizon, up = bs.upper[H];
      var lead = (up != null)
        ? 'Even <strong>upper-channel</strong> entries — the worst-timed buys — deployed <strong>' + H + ' years ago</strong> and held to today still returned about <strong>' + fmtMult(up) + '</strong> on average. '
        : 'Bitcoin hasn&rsquo;t sat high in the channel within the last <strong>' + H + ' years</strong>, so there are no upper-channel entries that recent to show — but over longer holds even the worst-timed buys have recovered to today. ';
      tk.innerHTML = lead
        + 'That is a multi-year tendency, <em>not</em> a guarantee: over short horizons entries have frequently sat underwater — including now (price has been below the Power Law trend about 58% of the time, above it about 42%). Recovery has historically come with time held, not on demand.';
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
    if (scrub) {
      scrub.value = Math.round(state.pos * 100);
      scrub.addEventListener('input', function () { setSliderPos(this.value / 100, true); });
    }
    syncScrubReadout();

    var era = document.querySelectorAll('.lsl-era button');
    era.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.era = btn.getAttribute('data-era');
        era.forEach(function (b) { b.classList.toggle('active', b === btn); });
        updateAdvChart(); applyChannelWindow(); updateBoxes();   // era buckets the backtest AND sets the context chart x-range
      });
    });

    var ladder = document.getElementById('lslLadder');
    var ladderVal = document.getElementById('lslLadderVal');
    if (ladder) ladder.addEventListener('input', function () {
      var months = parseInt(this.value, 10);
      state.ladderN = Math.max(2, Math.round(months * 2.53));
      if (ladderVal) ladderVal.textContent = months >= 12 && months % 12 === 0 ? (months / 12) + (months === 12 ? ' yr' : ' yrs') : months + ' mo';
      updateAdvChart(); updateBoxes();
    });
  }

  // ════════ CHECK THE WORK (STYLE_GUIDE §6.49; shared/ledger.js) ════════
  // Added 2026-11-26. Every historical entry behind the two boxes, each one's
  // lump and ladder side by side, then the advantage curve the chart draws, then
  // the boxes themselves. Built from the shared engine (LadderAdvantage) at the
  // page's state; nothing here changes a figure. Re-rendered by updateBoxes()
  // (slider, window, ladder) and renderChannelContext() (the live price).
  var ledgerEl = document.getElementById('lslLedger');
  var PER = 10000;   // the comparison is a ratio of bitcoin; shown per $10,000 so the figures read easily
  var ERA_WORDS = { 'full': 'Full: the whole record', 'post-2017': 'Post-2017: entries from January 1, 2017', 'post-2020': 'Post-2020: entries from January 1, 2020' };
  function fmtDay(d) { return dateOf(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  function monthYearOf(d) { return dateOf(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function ladderMonths() { var el = document.getElementById('lslLadder'); return el ? parseInt(el.value, 10) : 12; }
  // The record's samples are ~12 days apart, then roughly monthly from the first
  // gap over 25 days (the monthly refresh). A ladder is a count of samples, so
  // one that reaches the monthly stretch runs longer than its months.
  var SPARSE_FROM = null, GAP_DAYS = (function () {
    var g = [], j;
    for (j = 1; j < N; j++) { if (SPARSE_FROM == null && S[j].d - S[j - 1].d > 25) SPARSE_FROM = S[j - 1].d; if (SPARSE_FROM == null) g.push(S[j].d - S[j - 1].d); }
    g.sort(function (a, c) { return a - c; });
    return g.length ? g[Math.floor(g.length / 2)] : 12;
  })();
  // The chart's curve, point for point: the same loop as LadderAdvantage.advantageCurve,
  // keeping each point's entry count and ladder win share.
  function curveRows(era, n) {
    var out = [];
    for (var g = -0.10; g <= 1.151; g += 0.025) {
      var bb = bucketAt(era, n, g);
      if (bb.n >= 4) out.push({ x: +g.toFixed(4), y: bb.mean, n: bb.n, win: bb.win });
    }
    return out;
  }
  function entryRows(era, n, pos) {
    return LA.bucketEntries(era, n, pos).map(function (i) {
      var lump = PER / S[i].p, lad = 0;
      for (var k = 0; k < n; k++) lad += (PER / n) / S[i + k].p;
      return { i: i, lump: lump, lad: lad, avgP: PER / lad, end: S[i + n - 1].d, adv: LA.ladderAdvantage(i, n) / 100 };
    });
  }
  function ledgerSpec() {
    var n = state.ladderN, months = ladderMonths(), pos = state.pos, era = state.era;
    var b = bucketAt(era, n, pos), rows = entryRows(era, n, pos), ok = b.n >= 4;
    var lo = ratioOf(pos - WIN), hi = ratioOf(pos + WIN), perW = '$' + PER.toLocaleString('en-US');
    var ladderWon = ok && b.mean > 0, winName = ok ? (ladderWon ? 'Laddering in' : 'Deploying all at once') : null;
    var winRate = ok ? (ladderWon ? b.win : 100 - b.win) : null;
    var kLad = rows.filter(function (r) { return r.adv > 0; }).length;
    var span = function (r) { return r.end - S[r.i].d; };
    var longRows = rows.filter(function (r) { return span(r) > 1.25 * months * 30.44; });
    var longest = longRows.reduce(function (a, r) { return !a || span(r) > span(a) ? r : a; }, null);
    var lumpMore = rows.length ? rows.reduce(function (a, r) { return a + (r.lump / r.lad - 1); }, 0) / rows.length : null;
    var todayPos = liveTodayPos != null ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS);
    var lastStart = S[N - n].d;
    var longNote = longest ? ' Since ' + monthYearOf(SPARSE_FROM) + ' the record’s samples are about a month apart, so ' + (longRows.length === 1 ? 'one ladder here runs' : longRows.length + ' ladders here run') + ' longer: the longest, from ' + fmtDay(S[longest.i].d) + ', takes ' + Math.round(span(longest) / 30.44) + ' months.' : '';
    var entCols = [
      { label: 'Entry', unit: '', fmt: 'text', get: function (r) { return r.avg ? 'Average' : fmtDay(S[r.i].d); },
        how: 'A date in the price record, inside the historical window, when bitcoin was between ' + lo.toFixed(2) + '× and ' + hi.toFixed(2) + '× its trend: within ' + WIN + ' of the slider on the channel scale, which runs on a log scale from 0 at the floor (' + PL_FLOOR.toFixed(2) + '× trend) to 1 at the upper band (' + PL_CEIL.toFixed(1) + '×). Entries after ' + fmtDay(lastStart) + ' are left out: their ladder would run past the end of the record. The first row averages the Ladder advantage column.' },
      { label: 'Against trend', unit: '×', fmt: 'mult', get: function (r) { return r.avg ? null : S[r.i].p / plPrice(S[r.i].d); },
        how: 'Bitcoin’s price that day divided by its Power Law trend.' },
      { label: 'Price', unit: '$', fmt: 'usd', get: function (r) { return r.avg ? null : S[r.i].p; },
        how: 'Bitcoin’s price in the record that day: what the lump pays.' },
      { label: 'All at once', unit: '₿ per ' + perW, fmt: 'btc', get: function (r) { return r.avg ? null : r.lump; },
        how: perW + ' divided by that price.' },
      { label: 'Ladder’s last buy', unit: '', fmt: 'text', get: function (r) { return r.avg ? null : fmtDay(r.end); },
        how: 'The ladder buys at the entry’s own sample and the next ' + (n - 1) + ', ' + n + ' buys in all (' + months + ' months at 2.53 samples a month; the samples are about ' + GAP_DAYS + ' days apart).' + longNote },
      { label: 'Ladder’s average price', unit: '$', fmt: 'usd', get: function (r) { return r.avg ? null : r.avgP; },
        how: 'What the ladder paid per bitcoin overall: ' + perW + ' divided by the bitcoin it bought.' },
      { label: 'Laddered', unit: '₿ per ' + perW, fmt: 'btc', get: function (r) { return r.avg ? null : r.lad; },
        how: perW + ' in ' + n + ' equal parts, each divided by the price at its sample, added up.' },
      { label: 'Ladder advantage', unit: '%', fmt: 'pct', get: function (r) { return r.avg ? (rows.length ? b.mean / 100 : null) : r.adv; },
        how: 'Laddered divided by All at once, minus one: above zero where the ladder got more bitcoin, below where the lump did. The same as the price divided by the ladder’s average price, minus one.' },
      { label: 'More bitcoin', unit: '', fmt: 'text', get: function (r) { return r.avg ? (rows.length ? 'Ladder in ' + kLad + ' of ' + rows.length : null) : (r.adv > 0 ? 'Ladder' : 'All at once'); },
        how: 'Which tactic got more bitcoin from that entry.' }];
    var curCols = [
      { label: 'Channel position', unit: '0 floor · 1 upper band', fmt: 'text', get: function (r) { return r.x.toFixed(3).replace('-', '\u2212'); },
        how: 'Points every 0.025 along the chart’s horizontal axis, from −0.10 to 1.15.' },
      { label: 'Against trend', unit: '×', fmt: 'mult', get: function (r) { return ratioOf(r.x); }, how: 'That position as a multiple of the trend.' },
      { label: 'Entries', unit: '', fmt: 'text', get: function (r) { return String(r.n); },
        how: 'Entries within ' + WIN + ' of that position, chosen as on the Entries here tab. Points with fewer than 4 are left off, as on the chart.' },
      { label: 'Ladder advantage, average', unit: '%', fmt: 'pct', get: function (r) { return r.y / 100; },
        how: 'The average of those entries’ ladder advantage: the chart’s line, amber below zero (all at once got more bitcoin), blue above.' },
      { label: 'Ladder got more', unit: '% of entries', fmt: 'pct', get: function (r) { return r.win / 100; },
        how: 'The share of those entries where the ladder got more bitcoin.' }];
    var magHow = !ok ? 'Not shown with fewer than 4 entries.'
      : ladderWon ? 'The average ladder advantage: how much more bitcoin the ladder got, on average, as a share of what the lump got.'
      : 'The average ladder advantage without its minus sign. Deploying all at once served better here, so this is how much less bitcoin the ladder got, on average, as a share of what the lump got. Measured the other way, as how much more bitcoin the lump got than the ladder, the average is ' + (lumpMore * 100).toFixed(1) + '%.';
    var fin = [
      { label: 'Entries in the window', fmt: 'text', values: [String(b.n || 0)],
        how: 'The rows of the Entries here tab: the How often box’s “of ' + (b.n || 0) + ' historical entries here”.' + (ok ? '' : ' With fewer than 4 the page gives no verdict and says there are too few entries to read.') },
      { label: 'Ladder advantage, average', fmt: 'pct', values: [b.n ? b.mean / 100 : null],
        how: 'The Entries here tab’s first row. The white dot on the chart sits at this height.' },
      { label: 'Served better', fmt: 'text', values: [winName],
        how: 'Laddering in where the average is above zero, deploying all at once where it is below: the tactic named above the two boxes.' },
      { label: 'How much it won by', fmt: 'pct', values: [ok ? Math.abs(b.mean) / 100 : null], card: 'The How much it won by box above, rounded to a whole percent there', how: magHow },
      { label: 'How often it won', fmt: 'pct', values: [ok ? winRate / 100 : null],
        how: ok ? 'The share of entries where the tactic that served better got more bitcoin: ' + (ladderWon ? kLad : rows.length - kLad) + ' of ' + rows.length + '. The How often box, rounded to a whole percent there.' : 'Not shown with fewer than 4 entries.' }];
    var where = userMoved ? ''
      : todayPos < 0 ? ' (the slider’s lowest point: today, at ' + ratioOf(todayPos).toFixed(2) + '×, is below the floor)'
      : todayPos > 1 ? ' (the slider’s highest point: today, at ' + ratioOf(todayPos).toFixed(2) + '×, is above the upper band)'
      : ' (today’s, where the slider starts)';
    var inputs = [
      ['Position you’re testing', ratioOf(pos).toFixed(2) + '× trend · ' + posLabel(pos) + where],
      ['Entries matched', 'between ' + lo.toFixed(2) + '× and ' + hi.toFixed(2) + '× trend (within ' + WIN + ' of the slider on the channel scale)'],
      ['Historical window', ERA_WORDS[era] || era],
      ['Ladder', months + ' months: ' + n + ' equal buys, one at each of the next ' + n + ' price samples'],
      ['Price record', monthYearOf(S[0].d) + ' to ' + monthYearOf(S[N - 1].d) + ', ' + N + ' samples, about ' + GAP_DAYS + ' days apart' + (SPARSE_FROM != null ? ' (about a month apart since ' + monthYearOf(SPARSE_FROM) + ')' : '')],
      ['Amounts', 'bitcoin per ' + perW + ' deployed; the comparison is a ratio, so the sum doesn’t change it'],
      ['Today’s position', ratioOf(todayPos).toFixed(2) + '× trend · ' + posLabel(todayPos)],
      ['Today', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]];
    return {
      hint: 'every entry behind the two boxes, and the curve',
      inputs: inputs.map(function (m) { return { label: m[0], value: m[1] }; }),
      note: 'Every entry’s two tactics, side by side, in bitcoin per ' + perW + ' at the record’s prices of the day. The last table is the two boxes above.',
      tabs: [{ id: 'entries', label: 'Entries here', columns: entCols, rows: [{ avg: true }].concat(rows), strong: function (r) { return !!r.avg; } },
             { id: 'curve', label: 'Across the channel', columns: curCols, rows: curveRows(era, n) }],
      final: { title: 'At this position', csvTitle: 'At this position (the two boxes)', howTitle: 'How these figures are worked out', cols: ['At the slider'], rows: fin },
      csv: { filename: 'lump-sum-or-ladder-in.csv', meta: [
        ['Last Coin Standing', 'Lump Sum or Ladder In?'],
        ['Amounts', 'bitcoin per ten thousand dollars deployed; prices in dollars of the day'],   // no commas: a meta value is one cell
        ['Page', function () { return window.location.origin + window.location.pathname; }]] }
    };
  }
  function renderLedger() {
    if (!ledgerEl || !window.Ledger) return;
    window.Ledger.render(ledgerEl, ledgerSpec());
  }

  // ── QA (console: lslQA()) ──
  // The panel against the boxes, the lede and the chart; every entry rebuilt from
  // the price record; the curve against the chart's own points; the CSV's shape;
  // then a sweep of positions, windows and ladders through the page's own
  // controls, restoring the reader's settings after.
  window.lslQA = function () {
    var near = function (x, y) { return typeof x === 'number' && typeof y === 'number' && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y)); };
    function holds() {
      var sp = ledgerEl && ledgerEl._ledgerSpec, why = [];
      if (!sp) return { ok: false, why: ['no ledger'] };
      if (!window.Ledger.check(ledgerEl, { side: false })) why.push('Ledger.check');
      var n = state.ladderN, b = bucketAt(state.era, n, state.pos), ent = sp.tabs[0], cur = sp.tabs[1], fin = sp.final.rows;
      var rows = ent.rows.slice(1), idx = LA.bucketEntries(state.era, n, state.pos), cut = LA.eraStartDay(state.era), C = ent.columns;
      if (rows.length !== (b.n || 0) || rows.length !== idx.length || rows.some(function (r, k) { return r.i !== idx[k]; })) why.push('entry set');
      var sum = 0, k2 = 0;
      rows.forEach(function (r) {
        var i = r.i, lump = PER / S[i].p, lad = 0;
        for (var k = 0; k < n; k++) lad += (PER / n) / S[i + k].p;
        if (Math.abs(S[i].pos - state.pos) > WIN || S[i].d < cut || i + n - 1 > N - 1) why.push('membership ' + i);
        if (!near(C[3].get(r), lump) || !near(C[6].get(r), lad) || !near(C[5].get(r), PER / lad)) why.push('bitcoin ' + i);
        if (!near(C[7].get(r), lad / lump - 1) || !near(C[7].get(r), C[2].get(r) / C[5].get(r) - 1)) why.push('advantage ' + i);
        if ((C[8].get(r) === 'Ladder') !== (C[7].get(r) > 0)) why.push('winner ' + i);
        sum += C[7].get(r); if (C[7].get(r) > 0) k2++;
      });
      if (rows.length && (!near(C[7].get(ent.rows[0]), sum / rows.length) || !near(C[7].get(ent.rows[0]), b.mean / 100) || C[8].get(ent.rows[0]) !== 'Ladder in ' + k2 + ' of ' + rows.length || !near(100 * k2 / rows.length, b.win))) why.push('average row');
      var ok = b.n >= 4, boxes = document.getElementById('lslBoxes'), lede = document.getElementById('lslLede');
      if (fin[0].values[0] !== String(b.n || 0) || (b.n ? !near(fin[1].values[0], b.mean / 100) : fin[1].values[0] !== null)) why.push('final count or average');
      if (ok) {
        var lw = b.mean > 0, wr = lw ? b.win : 100 - b.win;
        if (fin[2].values[0] !== (lw ? 'Laddering in' : 'Deploying all at once') || lede.textContent.indexOf(lw ? 'laddering in' : 'deploying all at once') < 0) why.push('served better');
        if (!near(fin[3].values[0], Math.abs(b.mean) / 100) || document.getElementById('lslBoxMag').textContent !== '+' + (fin[3].values[0] * 100).toFixed(0) + '%') why.push('how much box');
        if (!near(fin[4].values[0], wr / 100) || document.getElementById('lslBoxFreq').textContent !== Math.round(fin[4].values[0] * 100) + '%' || document.getElementById('lslBoxFreqSub').textContent !== 'of ' + b.n + ' historical entries here') why.push('how often box');
        if (boxes.style.display === 'none') why.push('boxes hidden');
      } else if (fin[2].values[0] !== null || fin[3].values[0] !== null || fin[4].values[0] !== null || boxes.style.display !== 'none') why.push('too few entries');
      var cd = advChart ? advChart.data.datasets[0].data : [];
      if (cur.rows.length !== cd.length || cur.rows.some(function (r, k) { return r.x !== cd[k].x || r.y !== cd[k].y || r.n < 4; })) why.push('curve against the chart');
      var mk = advChart ? advChart.data.datasets[advChart.data.datasets.length - 1].data[0] : null;
      if (!mk || mk.x !== state.pos || (b.n ? !near(mk.y, b.mean) : mk.y !== 0)) why.push('chart dot');
      var csv = window.Ledger.toCsv(sp);
      if (!(csv.indexOf('# Last Coin Standing,') === 0 && (csv.match(/^# Input: /gm) || []).length === sp.inputs.length
        && (csv.match(/^# How each column is worked out$/gm) || []).length === 2 && csv.indexOf('# At this position') > 0)) why.push('csv shape');
      return { ok: !why.length, why: why };
    }
    var out = [], live = holds();
    out.push(['live panel: order, entries rebuilt, average, boxes, lede, curve against the chart, dot, CSV', live.ok, live.why.slice(0, 6).join('; ')]);
    var scrub = document.getElementById('lslScrub'), ladder = document.getElementById('lslLadder');
    var saved = { pos: state.pos, era: state.era, months: ladder ? ladder.value : '12', moved: userMoved };
    var fire = function (el, v) { el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    var pickEra = function (e) { var btn = document.querySelector('.lsl-era button[data-era="' + e + '"]'); if (btn) btn.click(); };
    var V = [];
    [0, 15, 33, 50, 70, 85, 100].forEach(function (p) { V.push({ era: 'post-2020', months: 12, pos: p }); });
    ['full', 'post-2017', 'post-2020'].forEach(function (e) { [3, 24].forEach(function (m) { [0, 50, 100].forEach(function (p) { V.push({ era: e, months: m, pos: p }); }); }); });
    V.push({ era: 'full', months: 12, pos: 40 }, { era: 'post-2017', months: 18, pos: 90 });
    try {
      V.forEach(function (v) {
        pickEra(v.era); fire(ladder, v.months); fire(scrub, v.pos);
        var r = holds();
        out.push(['sweep: ' + v.era + ', ' + v.months + ' months, slider at ' + (v.pos / 100).toFixed(2), r.ok, r.why.slice(0, 6).join('; ')]);
      });
    } finally {
      userMoved = saved.moved;
      pickEra(saved.era); fire(ladder, saved.months); setSliderPos(saved.pos, false);
    }
    var allOk = out.every(function (x) { return x[1]; });
    if (window.console) console.table(out.map(function (x) { return { check: x[0], pass: x[1], why: x[2] }; }));
    return { ok: allOk, checks: out };
  };

  // ════════ INIT ════════
  function init() {
    buildAdvChart();
    buildChannelChart();
    applyChannelWindow();          // initial x-range / y-refit
    wire();
    updateBoxes();
    renderHighRiskFigure();        // static upper-channel drawdown figure (live-computed, no slider)
    renderBackstop();
    renderCompression();
    renderMethod();
    renderChannelContext(TODAY_PRICE, 'seed');   // seeds the slider to today's live position
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price, source) { renderChannelContext(price, source); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
