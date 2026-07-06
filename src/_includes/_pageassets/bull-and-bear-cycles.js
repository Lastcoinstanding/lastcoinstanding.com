/* =============================================================
   Bull & Bear Cycles — page script

   The honesty page. Its spine is CAGR + volatility ("the volatility
   is the price of the returns"). This file computes only what it can
   compute rigorously and discloses the seam where the smooth chart
   line and the documented headline drawdown are reconciled:

   - HEADLINE cycle drawdowns are DOCUMENTED daily-close extremes,
     hardcoded in CYCLES (register §1). NOT computed from the sampled
     series, which runs shallow at ~12-day resolution.
   - The VISUALS (overlay, volatility) are computed from the shared
     PL_DATA series — the same one every channel page reads — and each
     cycle line is ANNOTATED with its true documented depth.
   - The LIVE status computes drawdown-from-peak + days-since-peak from
     the live spot price. It describes the present; it never forecasts
     a bottom. The conditional reversion reference is framed as
     conditional, explicitly.

   Reads PL_DATA + PL_* + GENESIS_TS + plPrice + TODAY_DAYS/TODAY_PRICE
   + fetchTodayPrice from shared/power-law-data.js.
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  // ── Palette ──
  var AMBER = '#e09422', RED = '#e08a7a', DIM = '#9a9080', MUTED = '#7a7367';
  var LIVE_C = '#f2d38a';

  // ── Documented daily-close cycle extremes (register §1). Headline %s are
  //    these researched figures, NOT computed from the sampled series. The
  //    2025 trough is UNRESOLVED (computed live). 2011 is asterisked and
  //    excluded from every trend line. `recovery` = this cycle's trough → the
  //    NEXT cycle's peak (register §13). ──
  var CYCLES = [
    { id: '2011', peakDate: '2011-06-08', peak: 31.50,  troughDate: '2011-11-18', trough: 2.05,   ddPct: -93, recovery: '621×', asterisk: true,  color: '#8a7f6d' },
    { id: '2013', peakDate: '2013-11-30', peak: 1163,   troughDate: '2015-01-14', trough: 180,    ddPct: -85, recovery: '130×', color: '#b04525' },
    { id: '2017', peakDate: '2017-12-17', peak: 19783,  troughDate: '2018-12-15', trough: 3183,   ddPct: -84, recovery: '22×',  color: '#c98a2e' },
    { id: '2021', peakDate: '2021-11-10', peak: 69000,  troughDate: '2022-11-21', trough: 15476,  ddPct: -77, recovery: '8×',   color: '#6db3d4' },
    { id: '2025', peakDate: '2025-10-06', peak: 126198, troughDate: null,         trough: null,   ddPct: null, recovery: null, ongoing: true,  color: LIVE_C }
  ];

  var YEAR_D = 365.25, MONTH_D = 30.44, PER_YR = 365.25 / 12; // ~12-day sampling → ~30.4 periods/yr

  // ── Days-since-genesis for a YYYY-MM-DD date ──
  function daysFrom(dateStr) {
    var p = dateStr.split('-');
    return (Date.UTC(+p[0], +p[1] - 1, +p[2]) / 1000 - GENESIS_TS) / 86400;
  }

  // ── Sampled series + interpolation ──
  var N = PL_DATA.length;
  var S = (function () { var a = new Array(N); for (var i = 0; i < N; i++) a[i] = { d: PL_DATA[i][0], p: PL_DATA[i][1] }; return a; })();
  var FIRST_D = S[0].d, LAST_D = S[N - 1].d;
  var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400;

  function priceAt(day) {
    if (day <= S[0].d) return S[0].p;
    if (day >= S[N - 1].d) return S[N - 1].p;
    for (var i = 1; i < N; i++) { if (S[i].d >= day) { var a = S[i - 1], b = S[i], t = (day - a.d) / (b.d - a.d); return a.p * (1 - t) + b.p * t; } }
    return S[N - 1].p;
  }

  // ── Formatters ──
  function usd(v) { if (v >= 1000) return '$' + Math.round(v).toLocaleString(); return '$' + v.toFixed(2); }
  function usdK(v) { if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'K'; return '$' + Math.round(v); }
  function pct0(v) { return Math.round(v) + '%'; }
  function months(days) {
    var m = Math.round(days / MONTH_D);
    if (m < 12) return m + ' mo';
    var y = Math.floor(m / 12), rem = m % 12;
    return y + 'y' + (rem ? ' ' + rem + 'm' : '');
  }
  function monthYear(dateStr) {
    var p = dateStr.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  // ════════ 1. CYCLE SUMMARY TABLE ════════
  function renderTable() {
    var tb = document.getElementById('bbCycleTable');
    if (!tb) return;
    var peak2025 = CYCLES[4].peak, peakDay2025 = daysFrom(CYCLES[4].peakDate);
    var live = livePrice(), rows = '';
    for (var i = 0; i < CYCLES.length; i++) {
      var c = CYCLES[i];
      if (c.ongoing) {
        var ddNow = (live / peak2025 - 1) * 100;
        var daysIn = todayD - peakDay2025;
        rows += '<tr class="bb-row-ongoing">'
          + '<td><span class="bb-cy">' + c.id + '</span><span class="bb-tag-ongoing">ongoing</span></td>'
          + '<td>' + usdK(c.peak) + '<span class="bb-when">' + monthYear(c.peakDate) + '</span></td>'
          + '<td>&mdash;<span class="bb-when">unresolved</span></td>'
          + '<td class="bb-num bb-dd">' + pct0(ddNow) + '<span class="bb-when">so far</span></td>'
          + '<td class="bb-num">' + months(daysIn) + '<span class="bb-when">and counting</span></td>'
          + '<td class="bb-num">&mdash;</td>'
          + '</tr>';
      } else {
        var pt = daysFrom(c.troughDate) - daysFrom(c.peakDate);
        var star = c.asterisk ? '<span class="bb-ast-mark">*</span>' : '';
        rows += '<tr>'
          + '<td><span class="bb-cy">' + c.id + star + '</span></td>'
          + '<td>' + usdK(c.peak) + '<span class="bb-when">' + monthYear(c.peakDate) + '</span></td>'
          + '<td>' + usdK(c.trough) + '<span class="bb-when">' + monthYear(c.troughDate) + '</span></td>'
          + '<td class="bb-num bb-dd">' + c.ddPct + '%' + star + '</td>'
          + '<td class="bb-num">' + months(pt) + '</td>'
          + '<td class="bb-num">' + c.recovery + (c.asterisk ? star : '') + '</td>'
          + '</tr>';
      }
    }
    tb.innerHTML = rows;
  }

  // ════════ 2. LIVE "WHERE ARE WE NOW" — Power-Law-anchored state machine ════════
  // The panel must read accurately in EVERY price regime, not just a bear market.
  // Power Law position is the consistent descriptive spine across all states; every
  // state is descriptive, never a recommendation and never a forecast. Thresholds are
  // explicit and documented here so they can be reviewed when the cycle changes regime.
  var _live = null;
  function livePrice() { return _live != null ? _live : TODAY_PRICE; }

  var ST_EXTENDED = 1.8;   // ratio (price/trend) at/above which price is "extended above trend"
  var ST_DEEP = -0.35;     // fromPeak at/below which it is a deep bear
  var ST_RECOVERY = -0.10; // fromPeak between ST_DEEP and here = recovery; above here = near/at high
  var ST_NEWHIGH = 0.02;   // fromPeak at/above which it is a new all-time high

  function sgnPct(v) { return (v > 0 ? '+' : (v < 0 ? '−' : '')) + Math.abs(Math.round(v)) + '%'; }

  // % of history at or below the current price/trend ratio (descriptive, both directions).
  function pctAtOrBelow(ratio) {
    var n = 0;
    for (var i = 0; i < N; i++) { if (S[i].p / plPrice(S[i].d) <= ratio) n++; }
    return Math.round(100 * n / N);
  }
  // Drawdown of a past cycle at `age` days after its own peak (for the deep-bear rank).
  function pastDDatAge(c, age) {
    var pd = daysFrom(c.peakDate), td = daysFrom(c.troughDate);
    var at = Math.min(pd + age, td);      // don't read past that cycle's own bottom
    return (priceAt(at) / priceAt(pd) - 1) * 100;
  }

  function renderLive(price, source) {
    _live = price;
    var peak = CYCLES[4].peak, peakDay = daysFrom(CYCLES[4].peakDate);
    var trend = plPrice(TODAY_DAYS);
    var ratio = price / trend;
    var fromPeak = (price - peak) / peak;         // negative = drawdown, positive = new high
    var fromPeakPct = fromPeak * 100;
    var daysIn = todayD - peakDay;
    var pctBelow = pctAtOrBelow(ratio), pctAbove = 100 - pctBelow;

    // Pick ONE state.
    var state;
    if (ratio >= ST_EXTENDED) state = 'extended';
    else if (fromPeak <= ST_DEEP) state = 'deepbear';
    else if (fromPeak <= ST_RECOVERY) state = 'recovery';
    else if (fromPeak < ST_NEWHIGH) state = 'nearhigh';
    else state = 'newhigh';

    // ── Tiles (Power Law position is the spine) ──
    var posEl = document.getElementById('bbLivePos');
    if (posEl) posEl.textContent = ratio.toFixed(2) + '×';
    var posSubEl = document.getElementById('bbLivePosSub');
    // Frame by whether price is actually above/below trend (ratio), not by state:
    // a new dollar ATH can still sit below a risen trend line, where "above only X%" misreads.
    if (posSubEl) posSubEl.innerHTML = (ratio >= 1)
      ? 'of trend · above here only <strong>' + pctAbove + '%</strong> of history'
      : 'of trend · below here <strong>' + pctBelow + '%</strong> of history';

    var ddCapEl = document.getElementById('bbLiveDDCap');
    if (ddCapEl) ddCapEl.textContent = fromPeak >= 0 ? 'Above the 2025 peak' : 'From the 2025 peak';
    var ddEl = document.getElementById('bbLiveDD');
    if (ddEl) ddEl.textContent = sgnPct(fromPeakPct);
    var priceEl = document.getElementById('bbLivePrice');
    if (priceEl) priceEl.innerHTML = 'now ' + usd(price) + ' vs ' + usdK(peak) + ' peak' + (source === 'live' ? '' : ' <span style="opacity:.7">(latest sample)</span>');

    var daysEl = document.getElementById('bbLiveDays');
    if (daysEl) daysEl.textContent = Math.round(daysIn);
    var daysSubEl = document.getElementById('bbLiveDaysSub');
    if (daysSubEl) daysSubEl.innerHTML = (state === 'deepbear' || state === 'recovery')
      ? (daysIn >= 100 ? 'past the <strong style="color:#e09422">100-day</strong> structural-bear mark' : Math.round(100 - daysIn) + ' short of the 100-day mark')
      : 'since the Oct 2025 peak';

    // ── Regime label + one merged, state-appropriate message ──
    var pos = 'Price sits at about <strong>' + ratio.toFixed(2) + '×</strong> the Power Law trend, where it has historically spent roughly <strong>' + pctBelow + '%</strong> of its time below this level.';
    var regime, read;
    if (state === 'deepbear') {
      var completed = CYCLES.filter(function (c) { return !c.ongoing; });
      var deeper = 0;
      completed.forEach(function (c) { if (pastDDatAge(c, daysIn) < fromPeakPct) deeper++; });
      var shallowMost = deeper >= Math.ceil(completed.length / 2);
      if (daysIn >= 100) {
        regime = 'Right now: a structural bear market';
        read = 'By the assumption-free measure, duration, this already qualifies as a structural bear market (100+ days to bottom). At <strong>' + Math.round(daysIn) + ' days</strong> past the peak, the drawdown of <strong>' + sgnPct(fromPeakPct) + '</strong> is ' + (shallowMost ? 'shallower than most' : 'in line with or deeper than most') + ' prior bear markets at the same age. ' + pos + ' Volatility has compressed cycle over cycle, though every past bear market has still been deep.';
      } else {
        regime = 'Right now: a deep drawdown';
        read = 'By duration, the assumption-free measure, this is not yet a confirmed structural bear market (that takes 100+ days to bottom), though the drawdown is already deep at <strong>' + sgnPct(fromPeakPct) + '</strong>, ' + (shallowMost ? 'shallower than most' : 'in line with or deeper than most') + ' prior bear markets at this age. ' + pos + ' Volatility has compressed cycle over cycle, though every past bear market has still been deep.';
      }
    } else if (state === 'recovery') {
      regime = 'Right now: recovering off the low';
      read = 'Bitcoin is off its low but still <strong>' + sgnPct(fromPeakPct) + '</strong> from the 2025 peak. ' + pos + ' In past cycles, reclaiming a prior high from a low took time: the trough-to-next-peak span has run near 1,050 days.';
    } else if (state === 'nearhigh') {
      regime = 'Right now: near the prior high';
      read = 'Bitcoin is within <strong>' + Math.abs(Math.round(fromPeakPct)) + '%</strong> of the 2025 peak. ' + pos;
    } else if (state === 'newhigh') {
      regime = 'Right now: a new all-time high';
      read = 'Bitcoin is at a new all-time high, <strong>' + sgnPct(fromPeakPct) + '</strong> above the 2025 peak. Price sits at about <strong>' + ratio.toFixed(2) + '×</strong> the Power Law trend, where it has historically spent roughly <strong>' + pctBelow + '%</strong> of its time below this level.';
    } else { // extended
      regime = 'Right now: extended above trend';
      read = 'Price sits at about <strong>' + ratio.toFixed(2) + '×</strong> the Power Law trend, well above it; historically price has been above this level only about <strong>' + pctAbove + '%</strong> of the time. In past cycles, extension this far above trend has preceded drawdowns. That is a description of history, not a forecast.';
    }

    var regimeEl = document.getElementById('bbLiveRegime');
    if (regimeEl) regimeEl.textContent = regime;
    var readEl = document.getElementById('bbLiveRead');
    if (readEl) readEl.innerHTML = read;
    var asOfEl = document.getElementById('bbLiveAsOf');
    if (asOfEl) asOfEl.textContent = 'Computed live from the current spot price on each page load; figures are as of today.';

    renderTable(); // keep the ongoing row's live figures in sync
  }

  // ════════ 3. DAY-ZERO BEAR OVERLAY ════════
  var overlayChart = null;
  var shown = {}; // id -> bool

  // Build a re-based-to-peak series from PL_DATA for one cycle.
  function cycleSeries(c) {
    var pd = daysFrom(c.peakDate);
    var end = c.ongoing ? todayD : daysFrom(c.troughDate);
    var basis = priceAt(pd);
    var pts = [{ x: 0, y: 0 }];
    for (var i = 0; i < N; i++) {
      if (S[i].d > pd && S[i].d <= end) pts.push({ x: S[i].d - pd, y: (S[i].p / basis - 1) * 100 });
    }
    // anchor the final point exactly at the endpoint (today for the live cycle)
    if (c.ongoing) pts.push({ x: todayD - pd, y: (livePrice() / basis - 1) * 100 });
    else pts.push({ x: end - pd, y: (priceAt(end) / basis - 1) * 100 });
    return pts;
  }

  // Plugin: label each visible line's DOCUMENTED trough depth at its end — the
  // hybrid seam. For completed cycles the annotation is the true daily-close %,
  // not the shallower sampled low.
  var depthLabelPlugin = {
    id: 'bbDepthLabels',
    afterDatasetsDraw: function (chart) {
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function (ds, di) {
        var meta = chart.getDatasetMeta(di);
        if (meta.hidden || !ds._depthLabel || !meta.data.length) return;
        var last = meta.data[meta.data.length - 1];
        if (!last) return;
        ctx.save();
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillStyle = ds.borderColor;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        var tx = Math.min(last.x + 6, chart.chartArea.right - 46);
        ctx.fillText(ds._depthLabel, tx, last.y);
        ctx.restore();
      });
    }
  };

  function buildOverlay() {
    var el = document.getElementById('bbOverlayChart');
    if (!el || typeof Chart === 'undefined') return;
    var datasets = CYCLES.map(function (c) {
      var isLive = !!c.ongoing;
      var label = c.id + (c.ddPct != null ? ' · ' + c.ddPct + '%' : ' · live');
      return {
        label: label,
        data: cycleSeries(c),
        borderColor: c.color,
        backgroundColor: c.color,
        borderWidth: isLive ? 2.6 : 1.5,
        borderDash: c.asterisk ? [4, 4] : undefined,
        pointRadius: 0,
        tension: 0.15,
        hidden: !shown[c.id],
        _depthLabel: isLive ? 'now' : (c.ddPct + '%'),
        order: isLive ? 0 : 2
      };
    });
    overlayChart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: { datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: true, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { right: 44, top: 8 } },
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Days since peak', color: MUTED, font: { size: 11 } }, grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, maxTicksLimit: 8 } },
          y: { max: 5, grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { return v + '%'; } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function (it) { return it.length ? 'Day ' + Math.round(it[0].parsed.x) : ''; },
              label: function (it) { return it.dataset.label.split(' · ')[0] + ': ' + it.parsed.y.toFixed(0) + '% from peak'; }
            }
          }
        }
      },
      plugins: [depthLabelPlugin]
    });
  }

  function renderToggles() {
    var wrap = document.getElementById('bbOverlayToggles');
    if (!wrap) return;
    wrap.innerHTML = '';
    CYCLES.forEach(function (c) {
      var lab = document.createElement('label');
      lab.className = 'bb-toggle' + (shown[c.id] ? ' is-on' : '');
      var depth = c.ddPct != null ? c.ddPct + '%' : 'live';
      lab.innerHTML = '<input type="checkbox"' + (shown[c.id] ? ' checked' : '') + '>' +
        '<span class="bb-swatch" style="background:' + c.color + '"></span>' +
        c.id + ' · ' + depth + (c.asterisk ? ' *' : '');
      var cb = lab.querySelector('input');
      cb.addEventListener('change', function () {
        shown[c.id] = cb.checked;
        lab.classList.toggle('is-on', cb.checked);
        syncOverlayVisibility();
      });
      wrap.appendChild(lab);
    });
  }

  function syncOverlayVisibility() {
    if (!overlayChart) return;
    CYCLES.forEach(function (c, i) { overlayChart.setDatasetVisibility(i, !!shown[c.id]); });
    overlayChart.update('none');
  }

  function updateOverlayData() {
    if (!overlayChart) return;
    // refresh the live cycle's series (last point moves with the live price)
    overlayChart.data.datasets[4].data = cycleSeries(CYCLES[4]);
    overlayChart.update('none');
  }

  // ════════ 4. ROLLING VOLATILITY SERIES ════════
  function buildVol() {
    var el = document.getElementById('bbVolChart');
    if (!el || typeof Chart === 'undefined') return;
    // log returns between consecutive ~12-day samples
    var lr = [];
    for (var i = 1; i < N; i++) lr.push({ d: S[i].d, r: Math.log(S[i].p / S[i - 1].p) });
    var W = 30; // ~1-year window at ~12-day spacing
    var series = [];
    for (var j = W; j < lr.length; j++) {
      var mean = 0, k;
      for (k = j - W; k < j; k++) mean += lr[k].r;
      mean /= W;
      var v = 0;
      for (k = j - W; k < j; k++) { var dv = lr[k].r - mean; v += dv * dv; }
      var sd = Math.sqrt(v / (W - 1));
      var annual = sd * Math.sqrt(PER_YR) * 100;
      series.push({ x: lr[j].d, y: annual });
    }
    // headline anchors: early peak and current
    var early = 0; for (var m = 0; m < Math.min(series.length, 40); m++) early = Math.max(early, series[m].y);
    var now = series.length ? series[series.length - 1].y : null;
    var earlyEl = document.getElementById('bbVolEarly'), nowEl = document.getElementById('bbVolNow');
    if (earlyEl && early) earlyEl.textContent = '~' + (Math.round(early / 10) * 10) + '%';
    if (nowEl && now) nowEl.textContent = '~' + (Math.round(now / 5) * 5) + '%';

    new Chart(el.getContext('2d'), {
      type: 'line',
      data: {
        datasets: [{
          label: 'Rolling 1-yr volatility (annualised)',
          data: series, borderColor: AMBER, backgroundColor: 'rgba(224,148,34,0.08)',
          borderWidth: 2, pointRadius: 0, tension: 0.25, fill: true
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: true, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        scales: {
          x: { type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, maxTicksLimit: 8, callback: function (v) { return new Date(GENESIS_TS * 1000 + v * 86400 * 1000).getUTCFullYear(); } } },
          y: { min: 0, grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { return v + '%'; } } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function (it) { return it.length ? new Date(GENESIS_TS * 1000 + it[0].parsed.x * 86400 * 1000).getUTCFullYear() : ''; },
              label: function (it) { return 'Volatility: ' + it.parsed.y.toFixed(0) + '%'; }
            }
          }
        }
      }
    });
  }

  // ════════ INIT ════════
  function init() {
    // default the overlay to showing the two most recent completed bears + the live cycle
    shown = { '2011': false, '2013': false, '2017': true, '2021': true, '2025': true };
    renderTable();
    renderToggles();
    buildOverlay();
    buildVol();
    renderLive(TODAY_PRICE, 'seed');
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price, source) {
      renderLive(price, source);
      updateOverlayData();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
