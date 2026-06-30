/* =============================================================
   Wait, or Deploy Now? — page script (trilogy page 3)

   The trilogy's third page: it owns the WHETHER/WHEN question the
   other two deliberately don't. A continuous, today-anchored channel-
   position slider drives a "waiting-paid rate": from a given position,
   how often did waiting for a LOWER CHANNEL POSITION (not a fixed time)
   historically leave you with more Bitcoin? A "never arrived" counter-
   weight and a bonded dual-impact drawdown pair (likelihood + depth,
   depth annotated with its coins-equivalent) form the why.

   POSITION-AWARE: the page reads its relevance off today's LIVE position.
   Near the floor (as now) it is QUIET — "deploying decisively is the
   clear call". High in the channel it goes LIVE. This is the anti-timing
   stance at the page level: it declines to manufacture a waiting
   deliberation when there is nothing to deliberate. Everything is
   retrospective; the forward view lives on page 2's Projection.

   Reads PL_DATA + PL_* + GENESIS_TS + plPrice + positionLabel +
   TODAY_DAYS/TODAY_PRICE + fetchTodayPrice from shared/power-law-data.js.
   Everything is computed live; no live position/price is baked into copy.
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  // ── Palette (shared trilogy conventions) ──
  var FLOOR_C = '#b04525', TREND_C = '#e09422', UPPER_C = '#e8c820';
  var HIST_C = 'rgba(232,224,210,0.55)', SEL_C = '#6db3d4';
  var MUTED = '#7a7367', DIM = '#9a9080', AMBER = '#e09422';

  // ── Channel-position math (log-space), shared with pages 1–2 ──
  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function posOf(price, days) { return (Math.log(price / plPrice(days)) - LF) / SPAN; }
  function ratioOf(pos) { return Math.exp(pos * SPAN + LF); }

  var N = PL_DATA.length;
  var FIRST_D = PL_DATA[0][0], LAST_D = PL_DATA[N - 1][0];
  var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400;
  var YEAR_D = 365.25, MONTH_D = 30.44;
  var TABLE_CUT = (Date.UTC(2014, 0, 1) / 1000 - GENESIS_TS) / 86400;  // pre-$15 curiosity era excluded
  var WAIT_CAP = 2 * YEAR_D;   // cap the wait at 2 years (if no lower entry, the waiter deploys then)
  var DROP = 0.15;             // "wait" = wait for channel position ≥0.15 LOWER than entry
  var DD_THRESH = 0.20;        // a "drawdown" = a ≥20% drop within 2 years

  // ── Precomputed samples ──
  var S = (function () { var a = new Array(N); for (var i = 0; i < N; i++) a[i] = { d: PL_DATA[i][0], p: PL_DATA[i][1], pos: posOf(PL_DATA[i][1], PL_DATA[i][0]) }; return a; })();

  function realPriceAt(absDay) {
    if (absDay <= S[0].d) return S[0].p;
    if (absDay >= S[N - 1].d) return S[N - 1].p;
    for (var i = 1; i < N; i++) { if (S[i].d >= absDay) { var a = S[i - 1], b = S[i], t = (absDay - a.d) / (b.d - a.d); return a.p * (1 - t) + b.p * t; } }
    return S[N - 1].p;
  }
  function median(arr) { var m = arr.filter(function (x) { return x != null && isFinite(x); }).sort(function (a, b) { return a - b; }); return m.length ? m[Math.floor(m.length * 0.5)] : null; }
  function monthYear(day) { return new Date(GENESIS_TS * 1000 + day * 86400 * 1000).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }

  // ── Vocabulary: ×-trend + shared word-label only; the 0–1 coordinate never shows ──
  function posLabel(pos) { return positionLabel(pos); }
  function posDisplay(pos) { return ratioOf(pos).toFixed(2) + '× trend · ' + posLabel(pos); }
  function livePos() { return (liveTodayPos != null) ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS); }
  var liveTodayPrice = null, liveTodayPos = null;

  // ════════ COMPARATOR MATH — position-based waiting, post-2014, live ════════
  // Only entries with a full 2-year forward window count, so "wait" and "drawdown within
  // 2 years" are never truncated by the edge of the record.
  var elig = (function () { var a = []; for (var i = 0; i < N; i++) if (S[i].d >= TABLE_CUT && S[i].d <= LAST_D - WAIT_CAP) a.push(i); return a; })();

  // Per-entry: did waiting for a ≥0.15-lower position (within 2yr) get MORE Bitcoin? how deep
  // did price fall? "BTC acquired" = 1/price, so a lower price = more coins for the same dollars.
  function entryMetrics(i) {
    var d0 = S[i].d, p0 = S[i].p, P = S[i].pos, end = d0 + WAIT_CAP;
    var waitPrice = null, waitDay = null, arrived = false, j;
    for (j = i + 1; j < N && S[j].d <= end; j++) { if (S[j].pos <= P - DROP) { waitPrice = S[j].p; waitDay = S[j].d; arrived = true; break; } }
    if (!arrived) { waitPrice = realPriceAt(end); waitDay = end; }   // waiting failed → deploy at the 2yr price
    var ratio = p0 / waitPrice;                                      // coins(wait)/coins(now) = (1/waitPrice)/(1/p0)
    var trough = p0; for (j = i + 1; j < N && S[j].d <= end; j++) if (S[j].p < trough) trough = S[j].p;
    var depth = trough / p0 - 1;                                     // ≤ 0
    return { P: P, ratio: ratio, paid: ratio > 1, arrived: arrived, waitLen: arrived ? (waitDay - d0) : null, depth: depth, hadDD: depth <= -DD_THRESH };
  }

  // Metrics over a sliding band around position P (widen if a high/sparse band is thin).
  function bandMetrics(P) {
    var half = 0.075, set = [], t;
    for (t = 0; t < 8; t++) { set = elig.filter(function (i) { return Math.abs(S[i].pos - P) <= half; }); if (set.length >= 8) break; half += 0.03; }
    if (!set.length) return null;
    var M = set.map(entryMetrics), n = M.length;
    var arrivedLens = M.filter(function (m) { return m.arrived; }).map(function (m) { return m.waitLen; });
    return {
      n: n, half: half,
      paid: M.filter(function (m) { return m.paid; }).length / n * 100,
      ratio: median(M.map(function (m) { return m.ratio; })),
      ddProb: M.filter(function (m) { return m.hadDD; }).length / n * 100,
      ddDepth: median(M.map(function (m) { return m.depth; })) * 100,
      never: M.filter(function (m) { return !m.arrived; }).length / n * 100,
      waitLen: arrivedLens.length ? median(arrivedLens) : null,
      entries: set
    };
  }

  // ── State (continuous position; default to today's live position) ──
  var state = { pos: 0.1 };
  // The slider spans slightly BELOW the floor (so today's sub-floor ~0.40× is reachable and the
  // "today" marker sits at the true position) up to the upper band. The reader-facing label
  // always shows the TRUE position; entry-matching clamps sub-floor to the floor INTERNALLY only
  // (stability), so the clamp never leaks into what the reader sees.
  var POS_MIN = -0.08, POS_MAX = 1.0, POS_RANGE = POS_MAX - POS_MIN;
  function clampPos(p) { return Math.max(POS_MIN, Math.min(POS_MAX, p)); }
  function sliderToPos(v) { return POS_MIN + (v / 1000) * POS_RANGE; }
  function posToSlider(p) { return Math.round((clampPos(p) - POS_MIN) / POS_RANGE * 1000); }
  function matchPos(p) { return Math.max(0, p); }   // internal entry-matching clamp (display untouched)

  // ── Format helpers ──
  function pct0(v) { return Math.round(v) + '%'; }
  function signPct0(v) { return (v > 0 ? '+' : '') + Math.round(v) + '%'; }
  function fmtRatio(r) { return (r >= 10 ? Math.round(r) : r.toFixed(2)) + '×'; }
  function fmtWait(days) {
    if (days == null) return '—';
    if (days < 1.5 * YEAR_D) return Math.max(1, Math.round(days / MONTH_D)) + ' months';
    return (days / YEAR_D).toFixed(1) + ' years';
  }
  function coinsMore(depthPct) { var D = Math.abs(depthPct); if (D < 1) return 0; return (1 / (1 - D / 100) - 1) * 100; }

  // ════════ COMPARATOR RENDER ════════
  function renderComparator() {
    var P = state.pos, m = bandMetrics(matchPos(P));
    var posReadout = document.getElementById('wdPosReadout');
    if (posReadout) posReadout.innerHTML = '<strong>' + ratioOf(P).toFixed(2) + '×</strong> trend · <em>' + posLabel(P) + '</em>';
    if (!m) return;

    // Hero — waiting-paid rate + position-graded verdict (reader concludes; no imperative beyond it)
    var heroNum = document.getElementById('wdHeroNum'), verdict = document.getElementById('wdVerdict');
    if (heroNum) heroNum.textContent = Math.round(m.paid) + '%';
    if (verdict) {
      var tone, line;
      if (m.paid < 25) { tone = 'danger'; line = 'Waiting was almost always the wrong call here — <strong>deploy decisively.</strong>'; }
      else if (m.paid < 60) { tone = 'neutral'; line = 'Roughly a coin-flip — no clear edge to waiting.'; }
      else { tone = 'success'; line = 'This is the regime where <strong>waiting earned its keep.</strong>'; }
      verdict.className = 'wd-verdict wd-verdict-' + tone;
      verdict.innerHTML = line;
    }

    // "Never arrived" counterweight — prominent when low (the dip usually never came)
    var counter = document.getElementById('wdCounter');
    if (counter) {
      if (m.never >= 50) {
        counter.className = 'wd-counter wd-counter-strong';
        counter.innerHTML = '<span class="wd-counter-tag">The dip usually never came</span> <strong>' + pct0(m.never) + '</strong> of the time, no lower entry arrived within two years — you were already near the bottom, and the rising channel carried price up and away. That is why the same dollars bought just <strong>' + fmtRatio(m.ratio) + '</strong> the coins waiting as deploying now.';
      } else if (m.never >= 15) {
        counter.className = 'wd-counter';
        counter.innerHTML = 'A lower entry arrived most of the time, but not always — <strong>' + pct0(m.never) + '</strong> of the time none came within two years and the waiter deployed later anyway. Across all entries here, waiting bought <strong>' + fmtRatio(m.ratio) + '</strong> the coins.';
      } else {
        counter.className = 'wd-counter';
        counter.innerHTML = 'From here a lower entry <strong>almost always arrived</strong>' + (m.waitLen != null ? ' — typically within about <strong>' + fmtWait(m.waitLen) + '</strong>' : '') + ', so waiting had room to work: <strong>' + fmtRatio(m.ratio) + '</strong> the coins, historically.';
      }
    }

    // Dual-impact drawdown pair (the why) — likelihood + depth, depth annotated with coins-equivalent
    var ddProbEl = document.getElementById('wdDdProb'), ddDepthEl = document.getElementById('wdDdDepth'), ddCoins = document.getElementById('wdDdCoins');
    if (ddProbEl) ddProbEl.textContent = pct0(m.ddProb);
    if (ddDepthEl) ddDepthEl.textContent = m.ddDepth <= -1 ? signPct0(m.ddDepth) : '~0%';
    if (ddCoins) {
      var more = coinsMore(m.ddDepth);
      ddCoins.innerHTML = more >= 1
        ? 'the same dollars would buy about <strong>+' + Math.round(more) + '%</strong> more Bitcoin at the trough'
        : 'price rarely fell far enough here to matter';
    }
    var waitDetail = document.getElementById('wdWaitDetail');
    if (waitDetail) waitDetail.innerHTML = m.waitLen != null
      ? 'If a lower entry arrived, the typical wait was about <strong>' + fmtWait(m.waitLen) + '</strong>.'
      : 'Lower entries almost never arrived here within two years.';

    var sample = document.getElementById('wdSampleNote');
    if (sample) sample.innerHTML = 'Drawn from <strong>' + m.n + '</strong> historical entries within ' + (m.half <= 0.08 ? '±' + m.half.toFixed(2) : 'a widened band') + ' of this position (post-2014, each with a full two-year forward record).';

    updateChart();
  }

  // ════════ CHANNEL CHART — bands + history + the selected position highlighted ════════
  var chart = null, selDots = [];
  function band(label, data, color, dash, w) { return { label: label, data: data, borderColor: color, backgroundColor: color, borderWidth: w, borderDash: dash || undefined, pointRadius: 0, tension: 0.2, fill: false, order: 4 }; }
  function bandLine(mult, baseDay, span) { var pts = [], step = Math.max(12, span / 120), d; for (d = 0; d <= span + 1e-6; d += step) pts.push({ x: baseDay + d, y: plPrice(baseDay + d) * mult }); pts.push({ x: baseDay + span, y: plPrice(baseDay + span) * mult }); return pts; }
  var selDotPlugin = {
    id: 'wdSelDots',
    afterDatasetsDraw: function (c) {
      if (!selDots.length) return;
      var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx, area = c.chartArea, i, x, y;
      ctx.save();
      for (i = 0; i < selDots.length; i++) {
        x = xS.getPixelForValue(selDots[i].x); y = yS.getPixelForValue(selDots[i].y);
        if (x < area.left - 2 || x > area.right + 2) continue;
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fillStyle = SEL_C; ctx.globalAlpha = 0.8; ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.1; ctx.stroke();
      }
      ctx.restore();
    }
  };
  function chartDatasets() {
    var startD = Math.max(FIRST_D, TABLE_CUT - YEAR_D), span = todayD - startD;
    var ds = [
      band('Floor (0.42× trend)', bandLine(PL_FLOOR, startD, span), FLOOR_C, [6, 3], 1.4),
      band('Trend', bandLine(1, startD, span), TREND_C, null, 2),
      band('Upper (3× trend)', bandLine(PL_CEIL, startD, span), UPPER_C, [1, 6], 1.1)
    ];
    var price = []; for (var i = 0; i < N; i++) if (S[i].d >= startD) price.push({ x: S[i].d, y: S[i].p });
    price.push({ x: todayD, y: exitPrice() });
    ds.push({ label: 'BTC price (history)', data: price, borderColor: HIST_C, borderWidth: 1.3, pointRadius: 0, tension: 0.15, order: 1 });
    // selected position — a line parallel to trend at the chosen ×-trend multiple
    ds.push(band('Selected position', bandLine(ratioOf(state.pos), startD, span), SEL_C, [4, 4], 2));
    // the historical entries the current band is built from (same internal match-clamp)
    var m = bandMetrics(matchPos(state.pos));
    selDots = (m && m.entries) ? m.entries.map(function (i) { return { x: S[i].d, y: S[i].p }; }) : [];
    return ds;
  }
  function yBounds(ds) {
    var lo = Infinity, hi = -Infinity, i, j, y;
    for (i = 0; i < ds.length; i++) for (j = 0; j < ds[i].data.length; j++) { y = ds[i].data[j].y; if (isFinite(y) && y > 0) { if (y < lo) lo = y; if (y > hi) hi = y; } }
    if (!isFinite(lo)) { lo = 1000; hi = 1e7; }
    return { min: lo * 0.55, max: hi * 1.9 };
  }
  function buildChart() {
    var el = document.getElementById('wdChart'); if (!el || typeof Chart === 'undefined') return;
    var ds = chartDatasets(), yb = yBounds(ds);
    chart = new Chart(el.getContext('2d'), {
      type: 'line', data: { datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' }, layout: { padding: { top: 18, right: 10 } },
        scales: {
          x: { type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, maxTicksLimit: 8, callback: function (v) { return new Date(GENESIS_TS * 1000 + v * 86400 * 1000).getUTCFullYear(); } } },
          y: { type: 'logarithmic', min: yb.min, max: yb.max, grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { if (v >= 1e9) return '$' + (v / 1e9).toFixed(0) + 'B'; if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'; return '$' + v.toFixed(0); } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: { backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10, filter: function (it) { var v = it.parsed && it.parsed.y; return v != null && isFinite(v) && v > 0; }, callbacks: { title: function (it) { return it.length ? new Date(GENESIS_TS * 1000 + it[0].parsed.x * 86400 * 1000).getUTCFullYear() : ''; }, label: function (it) { return it.dataset.label + ': $' + Math.round(it.parsed.y).toLocaleString(); } } }
        }
      },
      plugins: [selDotPlugin]
    });
  }
  function updateChart() {
    if (!chart) { buildChart(); return; }
    var ds = chartDatasets(), yb = yBounds(ds);
    chart.data.datasets = ds; chart.options.scales.y.min = yb.min; chart.options.scales.y.max = yb.max;
    chart.update('none');
  }
  function exitPrice() { return liveTodayPrice != null ? liveTodayPrice : TODAY_PRICE; }

  // ════════ POSITION-AWARE INTRO + LIVE READOUT (quiet when low, live when high) ════════
  function renderLive(price, source) {
    liveTodayPrice = price; liveTodayPos = posOf(price, TODAY_DAYS);
    var pos = liveTodayPos, ratio = price / plPrice(TODAY_DAYS);
    var metaEl = document.getElementById('wdLiveMeta'), introEl = document.getElementById('wdIntroState'), posEl = document.getElementById('wdLivePos');
    if (posEl) posEl.innerHTML = '<strong>' + ratio.toFixed(2) + '×</strong> trend · ' + posLabel(pos);
    if (metaEl) metaEl.textContent = 'Live: $' + Math.round(price).toLocaleString() + ' · ' + ratio.toFixed(2) + '× trend' + (source === 'live' ? '' : ' (latest sample)') + ' · recomputed every page load.';
    if (introEl) {
      if (pos < 0.53) {   // sub-floor / near floor / below trend / at trend → QUIET
        introEl.className = 'wd-intro-state wd-intro-quiet';
        introEl.innerHTML = '<span class="wd-intro-tag">This page is quiet right now</span> Bitcoin is <strong>' + posDisplay(pos) + '</strong> — low enough that there is essentially no advantage to waiting, based on historical data: <strong>deploying decisively is the clear call</strong>, and there is little to deliberate. This page is more applicable when price is higher in the channel, where <em>whether to deploy</em> becomes a real question.';
      } else {            // above trend / high / upper band → LIVE
        introEl.className = 'wd-intro-state wd-intro-live';
        introEl.innerHTML = '<span class="wd-intro-tag wd-intro-tag-live">This page is live right now</span> Price is <strong>' + posDisplay(pos) + '</strong> — high enough that <em>whether</em> to deploy, not just how, is a real question. Below is the historical cost of deploying at this position, and how often waiting for a lower entry paid off.';
      }
    }
    // default the explorer to today's TRUE live position the first time we learn it (no floor clamp)
    if (!state.userMoved) { state.pos = clampPos(pos); syncSliderToState(); }
    placeTodayTick();
    renderComparator();
  }

  // ════════ SLIDER + PERSISTENT "TODAY" TICK ════════
  function syncSliderToState() { var sl = document.getElementById('wdSlider'); if (sl) sl.value = posToSlider(state.pos); }
  function placeTodayTick() {
    var m = document.getElementById('wdTodayTick'); if (!m) return;
    m.style.left = ((clampPos(livePos()) - POS_MIN) / POS_RANGE * 100) + '%';
    m.classList.add('is-visible');
  }
  function wire() {
    var sl = document.getElementById('wdSlider');
    if (sl) sl.addEventListener('input', function () { state.userMoved = true; state.pos = sliderToPos(parseInt(this.value, 10)); renderComparator(); });
    var reset = document.getElementById('wdResetToday');
    if (reset) reset.addEventListener('click', function (e) { e.preventDefault(); state.userMoved = false; state.pos = clampPos(livePos()); syncSliderToState(); renderComparator(); });
  }

  // ════════ INIT ════════
  function init() {
    state.pos = clampPos(livePos());
    syncSliderToState();
    buildChart(); wire();
    renderLive(TODAY_PRICE, 'seed');
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price, source) { renderLive(price, source); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
