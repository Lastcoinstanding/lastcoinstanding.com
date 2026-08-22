/* =============================================================
   The Bitcoin Floor — page engine

   Reads ONLY the shared Power Law module (power-law-data.js): PL_A,
   PL_B, PL_FLOOR, PL_CEIL, PL_DATA, plPrice, GENESIS_TS, TODAY_DAYS,
   TODAY_PRICE, fetchTodayPrice, todayPriceNote. Zero new data
   dependencies, per the design doc's engine decision.

   Two classes of number on this page, and they are kept apart:

     · LIVE      — hero distance, floor/trend/spot, tripwire status, and
                   the whole parity instrument. Computed here, at load,
                   from PL_DATA + the live spot. Never remembered.
     · HISTORICAL— the four floor episodes and the quantile fits. Static
                   constants below, copied from the dated analysis note
                   (analysis/2026-08-20-power-law-floor.md). They are
                   facts about a fixed past and do not refresh — but
                   floorParityQA() recomputes the episode boundaries from
                   PL_DATA and asserts they still match, so a future
                   refresh that moved them could not pass silently.
   ============================================================= */
(function () {
  'use strict';

  var YEAR = 365.25;

  // ═══════════════════════════════════════════════════════════
  // STATIC — from analysis/2026-08-20-power-law-floor.md §2
  // Four distinct episodes below 0.42× trend, 10 of 481 samples.
  // `belowPct` is depth below the FLOOR (not below trend). `spanDays`
  // is first-to-last below-floor sample; `bracketDays` is the last
  // above-floor print before to the first after — the honest outer
  // bound on duration given a ~12-day sampling grid.
  // gap24 = share of the gap to trend closed 24 months after the touch.
  // ═══════════════════════════════════════════════════════════
  var EPISODES = [
    {
      id: '2010',
      when: 'Aug–Oct 2010',
      from: '2010-08-30', to: '2010-10-17',
      samples: 5, spanDays: 48, bracketDays: 72,
      deepestXt: 0.241, deepestOn: '2010-10-05', belowPct: 42.6,
      xt24: 0.628, gap24: 39,
      kind: 'break',
      kindLabel: 'The one real break',
      body: 'Price closed <strong>42.6% below the floor</strong> and stayed under for at least 48 days — 72 days if you bracket it by the last print above the line and the first one after. This is the only episode in the record that a sustained-break test would catch, and it is the model’s honest asterisk.<br><br>The context is not an excuse but it is load-bearing: bitcoin traded in cents, on a handful of venues, years before any exchange we would now call mature. A market that thin can put price anywhere. Whether 2010 should count equally against a model of adoption is a real question, and the answer this page takes is that it counts — stated, not buried — while the conditions that produced it are stated too.<br><br><strong>A granularity note specific to this episode.</strong> The shared series samples roughly every 12 days, so it cannot see intraday or daily excursions between samples. The deepest print it contains is <strong>0.241× trend</strong>; the module’s own header comment cites a 2010 low near <strong>0.196×</strong>, which cannot be derived from this series and may come from daily data predating the grid. Every depth and duration on this page is therefore a <em>lower bound</em>.'
    },
    {
      id: '2015a',
      when: 'August 2015',
      from: '2015-08-28', to: '2015-08-28',
      samples: 1, spanDays: 0, bracketDays: 24,
      deepestXt: 0.412, deepestOn: '2015-08-28', belowPct: 1.8,
      xt24: 1.753, gap24: 228,
      kind: 'graze',
      kindLabel: 'A graze',
      body: 'A single print <strong>1.8% below the floor</strong>, bracketed by above-floor samples 24 days apart. On any reading this is a touch, not a break — the line was tested and held within one sampling interval.<br><br>Twenty-four months later price sat at <strong>1.75× trend</strong>: the gap to trend was not merely closed but overshot by a wide margin. This is the deepest reversion in the record and it does a lot of work in the median below, which is a reason to look at the four outcomes individually rather than trusting their midpoint.'
    },
    {
      id: '2015b',
      when: 'Sep–Oct 2015',
      from: '2015-09-21', to: '2015-10-15',
      samples: 3, spanDays: 24, bracketDays: 48,
      deepestXt: 0.398, deepestOn: '2015-09-21', belowPct: 5.1,
      xt24: 1.381, gap24: 163,
      kind: 'graze',
      kindLabel: 'A graze',
      body: 'Three consecutive samples below the line, the deepest <strong>5.1% under</strong> — the worst of the three grazes, and still nowhere near the 2010 break or the tripwire’s 10%-for-30-days threshold. Price spent about 24 days under by sample span, 48 bracketed.<br><br>Twenty-four months on, price was at <strong>1.38× trend</strong>. Note that this episode and the August one are separate visits, three weeks apart, with an above-floor print between them — collapsing them into a single “2015 event” would turn four episodes into three and quietly change every count on this page.'
    },
    {
      id: '2023',
      when: 'January 2023',
      from: '2023-01-06', to: '2023-01-06',
      samples: 1, spanDays: 0, bracketDays: 24,
      deepestXt: 0.418, deepestOn: '2023-01-06', belowPct: 0.4,
      xt24: 1.175, gap24: 130,
      kind: 'graze',
      kindLabel: 'A graze',
      body: 'The shallowest of the four: a single print <strong>0.4% below the floor</strong>, at the bottom of the 2022 bear market. In practical terms price reached the line and stopped.<br><br>Twenty-four months later it sat at <strong>1.18× trend</strong>, having closed the gap and moved past it. This is also the most recent episode before today, and the one whose conditions most resemble the present market.'
    }
  ];

  // Quantile regression on log(price) ~ log(days), analysis §1. Each row is
  // an INDEPENDENT fit (slope free); `multAtCanon` is the ×-trend multiple
  // implied when the slope is instead forced to the canonical 5.77.
  var QUANTILE_FITS = [
    { tau: 0.02, slope: 5.9552, multAtCanon: 0.4209 },
    { tau: 0.05, slope: 5.8834, multAtCanon: 0.4604 },
    { tau: 0.10, slope: 5.8597, multAtCanon: 0.4971 },
    { tau: 0.25, slope: 5.8806, multAtCanon: 0.5928 },
    { tau: 0.50, slope: 5.7949, multAtCanon: 0.8627 }
  ];

  // The analysis's headline parity result, and the exact endpoint convention
  // that reproduces it. Used by floorParityQA() as a regression fixture — see
  // the long note on that function for why the fixture is pinned to the
  // analysis's endpoint rather than to a live "today".
  var ANALYSIS_PARITY = {
    endpointDayOffset: 1,   // one day past the last PL_DATA sample
    endpointDate: '2026-08-01',
    medianRealized: 63.8,
    medianTrend: 65.1,
    entries: 26,
    tolerancePp: 0.1
  };

  // Tripwire parameters — PROPOSED, pending JM's blessing (design doc §2.5).
  var TRIPWIRE = { depthPct: 10, days: 30 };

  // ═══════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════
  function $(id) { return document.getElementById(id); }
  function trendAt(d) { return PL_A * Math.pow(d, PL_B); }
  function floorAt(d) { return PL_FLOOR * trendAt(d); }
  function isoOf(d) { return new Date((GENESIS_TS + d * 86400) * 1000).toISOString().slice(0, 10); }
  function dayOfIso(s) { return (Date.parse(s + 'T00:00:00Z') / 1000 - GENESIS_TS) / 86400; }
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length;
    if (!n) return NaN;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  function usd(v) {
    if (!isFinite(v)) return '—';
    if (v >= 1000) return '$' + Math.round(v).toLocaleString('en-US');
    if (v >= 1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(4);
  }
  function pct1(v) { return (v >= 0 ? '' : '−') + Math.abs(v).toFixed(1) + '%'; }
  function signedPct1(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%'; }
  function longDate(s) {
    var d = new Date(s + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  // ═══════════════════════════════════════════════════════════
  // Live state
  // ═══════════════════════════════════════════════════════════
  var spot = TODAY_PRICE;
  var spotSource = 'seed';
  var endpointMode = 'today';   // 'today' | 'trend' — design doc §6.3: to-today leads
  var channelChart = null;
  var activeEpisode = null;

  function todayDays() { return TODAY_DAYS; }

  // ═══════════════════════════════════════════════════════════
  // HERO — the live distance readout
  // ═══════════════════════════════════════════════════════════
  function renderHero() {
    var d = todayDays();
    var tr = trendAt(d), fl = floorAt(d);
    var xt = spot / tr;
    var vsFloorPct = (spot / fl - 1) * 100;   // + above floor, − below

    // Register guard: identical treatment at every distance. The wording
    // changes because the fact changes; nothing about the styling does.
    var lead;
    if (Math.abs(vsFloorPct) < 1) {
      lead = 'Bitcoin is sitting <em>on the floor</em>';
    } else if (vsFloorPct > 0) {
      lead = 'Bitcoin sits <em>' + Math.abs(vsFloorPct).toFixed(1) + '% above</em> the floor';
    } else {
      lead = 'Bitcoin sits <em>' + Math.abs(vsFloorPct).toFixed(1) + '% below</em> the floor';
    }
    $('flHeroFigure').innerHTML = lead;
    $('flHeroCaption').textContent =
      xt.toFixed(3) + '× trend  ·  floor at ' + PL_FLOOR.toFixed(2) + '× trend';

    $('flNumSpot').textContent = usd(spot);
    $('flNumFloor').textContent = usd(fl);
    $('flNumTrend').textContent = usd(tr);

    $('flHeroProv').textContent =
      spotSource === 'live'
        ? 'Spot is live; floor and trend are computed for today from the shared Power Law coefficients.'
        : 'Spot is the latest sample in the shared price series' + (spotSource === 'fallback' ? ' (the live fetch did not resolve)' : '') + '; floor and trend are computed for today.';

    renderAnchorBar(xt);
  }

  // Floor-anchored bar. Log scale in ×-trend across a window chosen so the
  // floor sits about a third in — the sub-floor region is real territory on
  // this bar, not an out-of-range clamp, because price has been there.
  var BAR_MIN = 0.25, BAR_MAX = 1.30;
  function barPos(xt) {
    var p = (Math.log(xt) - Math.log(BAR_MIN)) / (Math.log(BAR_MAX) - Math.log(BAR_MIN));
    return Math.max(0.015, Math.min(0.985, p)) * 100;
  }
  function renderAnchorBar(xt) {
    var fp = barPos(PL_FLOOR), tp = barPos(1.0);
    $('flTickFloor').style.left = fp + '%';
    $('flTickTrend').style.left = tp + '%';
    $('flBarSubfloor').style.width = fp + '%';
    $('flBarMarker').style.left = barPos(xt) + '%';
    $('flBarMarkerLabel').textContent = xt.toFixed(2) + '×';
  }

  // ═══════════════════════════════════════════════════════════
  // CHANNEL CHART — floor emphasised, episodes marked
  // ═══════════════════════════════════════════════════════════
  function buildChannelChart() {
    var canvas = $('flChannelChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var cFloor = cssVar('--fl-floor', '#c0603a');
    var cTrend = cssVar('--fl-trend', '#e09422');
    var cCeil = cssVar('--fl-ceil', '#d9b36b');
    var cPrice = cssVar('--fl-price', '#6db3d4');
    var cDim = cssVar('--text-muted', '#6a6256');

    var minD = PL_DATA[0][0], maxD = todayDays();
    var bandPts = [], step = (maxD - minD) / 240;
    for (var d = minD; d <= maxD; d += step) bandPts.push(d);
    bandPts.push(maxD);

    function line(mult) {
      return bandPts.map(function (dd) { return { x: dd, y: mult * trendAt(dd) }; });
    }
    var priceSeries = PL_DATA.map(function (p) { return { x: p[0], y: p[1] }; });

    // Episode shading: a Chart.js plugin drawing one translucent vertical
    // band per episode, bracketed by the last above-floor print before and
    // the first after (the same outer bound the cards report).
    var episodeBands = {
      id: 'flEpisodeBands',
      beforeDatasetsDraw: function (chart) {
        var xs = chart.scales.x, ys = chart.scales.y, ctx = chart.ctx;
        if (!xs || !ys) return;
        ctx.save();
        EPISODES.forEach(function (ep) {
          var a = dayOfIso(ep.from), b = dayOfIso(ep.to);
          var half = (ep.bracketDays - ep.spanDays) / 2;
          var x0 = xs.getPixelForValue(Math.max(a - half, xs.min));
          var x1 = xs.getPixelForValue(Math.min(b + half, xs.max));
          var w = Math.max(x1 - x0, 3);
          var isActive = activeEpisode && activeEpisode.id === ep.id;
          ctx.fillStyle = ep.kind === 'break'
            ? (isActive ? 'rgba(192,96,58,0.30)' : 'rgba(192,96,58,0.15)')
            : (isActive ? 'rgba(224,148,34,0.28)' : 'rgba(122,115,103,0.16)');
          ctx.fillRect(x0, ys.top, w, ys.bottom - ys.top);
        });
        ctx.restore();
      }
    };

    channelChart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          { label: 'Upper band (3× trend)', data: line(PL_CEIL), borderColor: cCeil, borderWidth: 1, borderDash: [1, 6], pointRadius: 0, tension: 0.2, order: 4 },
          { label: 'Trend', data: line(1), borderColor: cTrend, borderWidth: 1.6, pointRadius: 0, tension: 0.2, order: 3 },
          // The floor is the page's subject, so it is the heaviest line on
          // the chart — the inverse of the Power Law page, where trend leads.
          { label: 'Floor (0.42× trend)', data: line(PL_FLOOR), borderColor: cFloor, borderWidth: 3, pointRadius: 0, tension: 0.2, order: 1 },
          { label: 'Price', data: priceSeries, borderColor: cPrice, borderWidth: 1.4, pointRadius: 0, tension: 0.15, order: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: {
            type: 'logarithmic', min: minD, max: maxD,
            title: { display: true, text: 'Days since genesis (log)', color: cDim, font: { size: 10 } },
            ticks: {
              color: cDim, font: { size: 10 }, maxTicksLimit: 8,
              callback: function (v) { return isoOf(v).slice(0, 4); }
            },
            grid: { color: 'rgba(224,148,34,0.05)' }
          },
          y: {
            type: 'logarithmic',
            title: { display: true, text: 'Price, USD (log)', color: cDim, font: { size: 10 } },
            ticks: {
              color: cDim, font: { size: 10 },
              callback: function (v) {
                var e = Math.log10(v);
                if (Math.abs(e - Math.round(e)) > 0.01) return '';
                return v >= 1000 ? '$' + (v / 1000) + 'k' : '$' + v;
              }
            },
            grid: { color: 'rgba(224,148,34,0.05)' }
          }
        },
        plugins: {
          legend: { labels: { color: cDim, font: { size: 11 }, usePointStyle: true, boxWidth: 8 } },
          tooltip: {
            backgroundColor: '#1a1714', borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1,
            titleColor: '#f2eee8', bodyColor: '#e8e0d4',
            callbacks: {
              title: function (items) { return items.length ? isoOf(items[0].parsed.x) : ''; },
              label: function (c) { return c.dataset.label + ': ' + usd(c.parsed.y); },
              afterBody: function (items) {
                if (!items.length) return '';
                var d = items[0].parsed.x;
                var near = null;
                for (var i = 0; i < PL_DATA.length; i++) {
                  if (near === null || Math.abs(PL_DATA[i][0] - d) < Math.abs(near[0] - d)) near = PL_DATA[i];
                }
                if (!near) return '';
                return '\n' + (near[1] / trendAt(near[0])).toFixed(3) + '× trend  ·  ' +
                       (near[1] / floorAt(near[0])).toFixed(2) + '× floor';
              }
            }
          }
        }
      },
      plugins: [episodeBands]
    });
  }

  function zoomChartTo(ep) {
    if (!channelChart) return;
    if (!ep) {
      channelChart.options.scales.x.min = PL_DATA[0][0];
      channelChart.options.scales.x.max = todayDays();
      delete channelChart.options.scales.y.min;
      delete channelChart.options.scales.y.max;
      channelChart.update();
      return;
    }
    var a = dayOfIso(ep.from), b = dayOfIso(ep.to);
    var pad = Math.max((b - a) * 3, 300);
    var lo = Math.max(PL_DATA[0][0], a - pad), hi = Math.min(todayDays(), b + pad * 2);
    channelChart.options.scales.x.min = lo;
    channelChart.options.scales.x.max = hi;
    // Frame the y-window on the channel across the zoomed span so the floor
    // stays visible rather than being cropped out by the price excursion.
    var ys = [];
    PL_DATA.forEach(function (p) { if (p[0] >= lo && p[0] <= hi) ys.push(p[1]); });
    ys.push(floorAt(lo) * 0.7, trendAt(hi) * 1.4);
    channelChart.options.scales.y.min = Math.min.apply(null, ys) * 0.8;
    channelChart.options.scales.y.max = Math.max.apply(null, ys) * 1.25;
    channelChart.update();
  }

  // ═══════════════════════════════════════════════════════════
  // EPISODE EXPLORER
  // ═══════════════════════════════════════════════════════════
  function renderEpisodeStrip() {
    var strip = $('flEpStrip');
    if (!strip) return;
    strip.innerHTML = '';
    EPISODES.forEach(function (ep) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fl-ep-btn';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.innerHTML =
        '<span class="fl-ep-btn-when">' + ep.when + '</span>' +
        '<span class="fl-ep-btn-kind ' + (ep.kind === 'break' ? 'is-break' : 'is-graze') + '">' + ep.kindLabel + '</span>' +
        '<span class="fl-ep-btn-depth">' + ep.belowPct.toFixed(1) + '% below the floor</span>';
      b.addEventListener('click', function () { selectEpisode(ep.id); });
      strip.appendChild(b);
    });
    // Register guard (design doc §4): the one real break leads the section,
    // so it is the card open on arrival — never a graze, never an average.
    selectEpisode('2010');

    var gaps = EPISODES.map(function (e) { return e.gap24; });
    $('flRevMedian').textContent = Math.round(median(gaps)) + '%';
    $('flRevOvershoot').textContent = gaps.filter(function (g) { return g > 100; }).length + ' of 4';
  }

  function selectEpisode(id) {
    var ep = null;
    for (var i = 0; i < EPISODES.length; i++) if (EPISODES[i].id === id) ep = EPISODES[i];
    if (!ep) return;
    activeEpisode = ep;

    var btns = $('flEpStrip').querySelectorAll('.fl-ep-btn');
    for (var j = 0; j < btns.length; j++) {
      var on = EPISODES[j].id === id;
      btns[j].classList.toggle('is-active', on);
      btns[j].setAttribute('aria-selected', on ? 'true' : 'false');
    }

    var dur = ep.spanDays === 0
      ? 'a single print'
      : ep.spanDays + ' days';
    $('flEpCard').innerHTML =
      '<div class="fl-ep-card-h">' + ep.when + '</div>' +
      '<div class="fl-ep-card-kind ' + (ep.kind === 'break' ? 'is-break' : 'is-graze') + '">' + ep.kindLabel + '</div>' +
      '<div class="fl-ep-metrics">' +
        metric(ep.belowPct.toFixed(1) + '%', 'deepest, below the floor') +
        metric(ep.deepestXt.toFixed(3) + '×', 'deepest, × trend') +
        metric(dur, 'below the line (' + ep.bracketDays + 'd bracketed)') +
        metric(ep.xt24.toFixed(2) + '×', 'x trend, 24 months later') +
        metric(ep.gap24 + '%', 'of the gap to trend closed') +
      '</div>' +
      '<p>' + ep.body + '</p>';
    zoomChartTo(ep);
    if (channelChart) channelChart.update();
  }
  function metric(v, k) {
    return '<div class="fl-ep-metric"><div class="fl-ep-metric-v">' + v + '</div><div class="fl-ep-metric-k">' + k + '</div></div>';
  }

  // ═══════════════════════════════════════════════════════════
  // THE PARITY INSTRUMENT
  //
  // Methodology, from analysis §3, reimplemented here rather than
  // hardcoded so the figures move with the series:
  //   entries  = samples priced within 10% ABOVE the floor (×-floor ≤ 1.10),
  //              which also picks up genuine sub-floor prints;
  //   realized = CAGR from each entry's price to the endpoint price;
  //   trend    = CAGR of the trend line across the identical window;
  //   excess   = the MEDIAN OF THE PER-ENTRY DIFFERENCES — not the
  //              difference of the two medians, which is a different
  //              number (−1.3pp vs −0.5pp on today's series) and would
  //              be the natural misreading of the two figures shown.
  // ═══════════════════════════════════════════════════════════
  function entrySet() {
    return PL_DATA.filter(function (p) { return p[1] / floorAt(p[0]) <= 1.10; });
  }

  function lastTrendTouch() {
    for (var i = PL_DATA.length - 1; i >= 0; i--) {
      if (PL_DATA[i][1] / trendAt(PL_DATA[i][0]) >= 1.0) return PL_DATA[i];
    }
    return null;
  }

  function gradeTo(endDay, endPrice) {
    var re = [], tc = [], ex = [];
    entrySet().forEach(function (p) {
      var yrs = (endDay - p[0]) / YEAR;
      if (yrs <= 0) return;
      var r = (Math.pow(endPrice / p[1], 1 / yrs) - 1) * 100;
      var t = (Math.pow(trendAt(endDay) / trendAt(p[0]), 1 / yrs) - 1) * 100;
      re.push(r); tc.push(t); ex.push(r - t);
    });
    return {
      n: re.length,
      realized: median(re),
      trend: median(tc),
      excess: median(ex),
      diffOfMedians: median(re) - median(tc)
    };
  }

  function renderParity() {
    var toTrend = endpointMode === 'trend';
    var endDay, endPrice, endLabel, endWhen;

    if (toTrend) {
      var lt = lastTrendTouch();
      endDay = lt[0]; endPrice = lt[1];
      endWhen = longDate(isoOf(lt[0]));
      endLabel = 'the last time price touched trend (' + endWhen + ')';
    } else {
      endDay = todayDays(); endPrice = spot;
      endWhen = 'today';
      endLabel = 'today, with price at the floor';
    }

    var g = gradeTo(endDay, endPrice);

    $('flParityRealized').textContent = g.realized.toFixed(1) + '%';
    $('flParityTrend').textContent = g.trend.toFixed(1) + '%';
    $('flParityExcess').textContent = signedPct1(g.excess);
    $('flParityRealizedSub').textContent = 'median across ' + g.n + ' entries';
    $('flParityMethod').innerHTML =
      'Entries are the ' + g.n + ' samples in the series priced within 10% of the floor, graded to ' + endLabel + '. ' +
      'That is ' + (g.n / PL_DATA.length * 100).toFixed(1) + '% of the ' + PL_DATA.length + ' samples on record. ' +
      'The published measurement behind this instrument (<code>analysis/2026-08-20-power-law-floor.md</code> §3) graded the ' +
      'same entries to ' + ANALYSIS_PARITY.endpointDate + ', when price sat on the floor: ' +
      ANALYSIS_PARITY.medianRealized.toFixed(1) + '% realized against ' + ANALYSIS_PARITY.medianTrend.toFixed(1) +
      '% trend. Run <code>floorParityQA()</code> in the console to reproduce it.';

    if (!toTrend) {
      // The to-today read is POSITION-DEPENDENT and must be recomputed, never
      // remembered. The published analysis was written on a day when price sat
      // on the floor, which made excess ≈ 0 almost by construction. That is a
      // fact about that day's vantage, not a standing property — when price is
      // well above the floor these same windows are graded floor-to-higher and
      // the excess goes positive for exactly the same mechanical reason. The
      // branch below keeps the sentence true at any distance, and always shows
      // the published measurement alongside so the two can be reconciled.
      var d0 = todayDays();
      var vsFloorNow = (spot / floorAt(d0) - 1) * 100;
      var whereNow = Math.abs(vsFloorNow) < 3
        ? 'today sits essentially <em>on</em> the floor'
        : (vsFloorNow > 0
            ? 'today sits <em>' + Math.abs(vsFloorNow).toFixed(0) + '% above</em> the floor'
            : 'today sits <em>' + Math.abs(vsFloorNow).toFixed(0) + '% below</em> the floor');

      var read;
      if (Math.abs(g.excess) < 1.0) {
        read = '<strong>Buying within 10% of the model’s worst case did not beat the model.</strong> ' +
          'The median entry returned an enormous absolute CAGR — and its excess over what the trend line itself grew at, ' +
          'across the identical window, is ' + signedPct1(g.excess) + ': indistinguishable from zero. ' +
          'The extra return in this set came from how far <em>below</em> the line an entry went, not from the fact of buying at it.';
      } else if (g.excess > 0) {
        read = 'Graded to today, these entries show an excess of ' + signedPct1(g.excess) + ' over the model. ' +
          '<strong>That is the endpoint doing the work, not the entry.</strong> Because ' + whereNow + ', ' +
          'these windows are graded from the floor to a point above it — and excess is very nearly the annualised change ' +
          'in the ×-trend ratio between the two ends. Measured on a day when price sat <em>on</em> the floor, the published ' +
          'analysis found the same entries returned ' + ANALYSIS_PARITY.medianRealized.toFixed(1) + '% against a trend of ' +
          ANALYSIS_PARITY.medianTrend.toFixed(1) + '% — an excess of about zero. Both readings are the same arithmetic ' +
          'seen from different days.';
      } else {
        read = 'Graded to today, these entries show an excess of ' + signedPct1(g.excess) + ' — they trailed the model. ' +
          '<strong>That is the endpoint doing the work, not the entry.</strong> Because ' + whereNow + ', ' +
          'these windows end below where they began in ×-trend terms, and excess is very nearly the annualised change ' +
          'in that ratio. The published analysis, measured with price on the floor, found an excess of about zero.';
      }
      $('flParityRead').innerHTML = read;

      $('flHonestyEndpoint').innerHTML =
        'Excess here is very nearly the annualised change in the ×-trend ratio between entry and exit, so <strong>where price ' +
        'happens to sit on the day you read this decides the answer</strong>. Right now ' + whereNow + ', at ' +
        (spot / trendAt(d0)).toFixed(3) + '× trend. When price sits on the floor every window is graded floor-to-floor — ' +
        'the least flattering vantage available, and the one the published analysis used. This number is a statement about ' +
        'the <strong>pair</strong> of endpoints, not a durable property of floor entries. Change either and it changes.';
    } else {
      $('flParityRead').innerHTML =
        'Graded to the last trend touch, the same entries show a positive excess of ' + signedPct1(g.excess) + '. ' +
        '<strong>This is the reversion showing up, not evidence that floor entries beat the market.</strong> ' +
        'It is the historical bonus for having been early to a line price later left behind — and it is measured to an endpoint ' +
        'chosen precisely because it was favourable. The guarantee half is the finding that leads this page: graded at its ' +
        'worst — with price back down on the floor, as the published analysis measured it — the same entries returned ' +
        ANALYSIS_PARITY.medianRealized.toFixed(1) + '% against the model’s own ' + ANALYSIS_PARITY.medianTrend.toFixed(1) +
        '%, an excess of about zero. Matching the model at the worst vantage is the claim; this tab is the bonus.';
      $('flHonestyEndpoint').innerHTML =
        'This endpoint is <strong>chosen, not neutral</strong>. Measuring to the last moment price touched trend ' +
        '(' + endWhen + ') banks the whole reversion and stops the clock before the drawdown that followed. ' +
        'It is an honest question — what did the entry pay by the time the model was satisfied? — asked with a favourable ruler. ' +
        'Both tabs are true; neither is the answer on its own.';
    }
  }

  // ═══════════════════════════════════════════════════════════
  // QA HOOK — window.floorParityQA()
  //
  // WHY THIS ASSERTS AGAINST A FIXED ENDPOINT, NOT AGAINST "TODAY":
  // the design doc asks the page to reproduce the analysis's 63.8 / 65.1
  // at the to-today endpoint. That is reproducible only on the analysis's
  // own terminal date. The medians are endpoint-sensitive at exactly the
  // 0.1pp tolerance being asserted — sliding the endpoint from the last
  // sample to +20 days moves realized 63.8 → 63.4 — and the page's live
  // "to today" also rides the live spot, which moves hourly. Asserting
  // the live figure would therefore fail on the second day for a reason
  // that has nothing to do with correctness.
  //
  // So the fixture pins the METHOD, not the calendar: recompute at the
  // analysis's endpoint (one day past the last PL_DATA sample, 365.25-day
  // years) and require 63.8 / 65.1 ± 0.1pp with n = 26. That is a true
  // regression test — it fails if the algorithm drifts, if PL_DATA is
  // rewritten, or if the entry rule changes — and it stays green
  // tomorrow. The live figures are reported alongside, unasserted.
  // ═══════════════════════════════════════════════════════════
  function floorParityQA() {
    var last = PL_DATA[PL_DATA.length - 1];
    var fixDay = last[0] + ANALYSIS_PARITY.endpointDayOffset;
    var fix = gradeTo(fixDay, last[1]);
    var tol = ANALYSIS_PARITY.tolerancePp;

    var failures = [];
    if (fix.n !== ANALYSIS_PARITY.entries) {
      failures.push('entry count ' + fix.n + ' ≠ ' + ANALYSIS_PARITY.entries);
    }
    if (Math.abs(fix.realized - ANALYSIS_PARITY.medianRealized) > tol) {
      failures.push('median realized ' + fix.realized.toFixed(2) + ' vs ' + ANALYSIS_PARITY.medianRealized + ' (±' + tol + ')');
    }
    if (Math.abs(fix.trend - ANALYSIS_PARITY.medianTrend) > tol) {
      failures.push('median trend ' + fix.trend.toFixed(2) + ' vs ' + ANALYSIS_PARITY.medianTrend + ' (±' + tol + ')');
    }

    // Episode dataset must still match what the series says. The cards are
    // static prose over static figures; this is what stops a PL_DATA refresh
    // from silently invalidating them.
    var computed = computeEpisodes();
    if (computed.length !== EPISODES.length) {
      failures.push('episode count ' + computed.length + ' ≠ ' + EPISODES.length);
    } else {
      computed.forEach(function (c, i) {
        var e = EPISODES[i];
        if (c.from !== e.from) failures.push('episode ' + e.id + ' start ' + c.from + ' ≠ ' + e.from);
        if (c.to !== e.to) failures.push('episode ' + e.id + ' end ' + c.to + ' ≠ ' + e.to);
        if (Math.abs(c.belowPct - e.belowPct) > 0.05) failures.push('episode ' + e.id + ' depth ' + c.belowPct + ' ≠ ' + e.belowPct);
        if (Math.abs(c.spanDays - e.spanDays) > 0.5) failures.push('episode ' + e.id + ' span ' + c.spanDays + ' ≠ ' + e.spanDays);
      });
    }

    var liveToday = gradeTo(todayDays(), spot);
    var lt = lastTrendTouch();
    var liveTrend = gradeTo(lt[0], lt[1]);

    var out = {
      pass: failures.length === 0,
      failures: failures,
      fixture: {
        endpoint: isoOf(fixDay),
        n: fix.n,
        realized: +fix.realized.toFixed(2),
        trend: +fix.trend.toFixed(2),
        excess: +fix.excess.toFixed(2),
        diffOfMedians: +fix.diffOfMedians.toFixed(2),
        expects: ANALYSIS_PARITY
      },
      live: {
        spot: spot, spotSource: spotSource,
        toToday: { n: liveToday.n, realized: +liveToday.realized.toFixed(2), trend: +liveToday.trend.toFixed(2), excess: +liveToday.excess.toFixed(2) },
        toTrendTouch: { on: isoOf(lt[0]), n: liveTrend.n, realized: +liveTrend.realized.toFixed(2), trend: +liveTrend.trend.toFixed(2), excess: +liveTrend.excess.toFixed(2) }
      },
      episodes: computed,
      tripwire: tripwireState()
    };
    if (!out.pass) console.error('[floor-qa] FAILED', out);
    return out;
  }

  // Recompute the four episodes from PL_DATA — index-adjacent runs strictly
  // below the floor, so an above-floor print between two dips separates them
  // (this is what keeps the two September/August 2015 visits distinct).
  function computeEpisodes() {
    var runs = [], cur = null;
    for (var i = 0; i < PL_DATA.length; i++) {
      var p = PL_DATA[i], xt = p[1] / trendAt(p[0]);
      if (xt < PL_FLOOR) {
        if (!cur) cur = { s: i, rows: [] };
        cur.rows.push(p);
      } else if (cur) { cur.e = i - 1; runs.push(cur); cur = null; }
    }
    if (cur) { cur.e = PL_DATA.length - 1; runs.push(cur); }
    return runs.map(function (r) {
      var deepest = null;
      r.rows.forEach(function (p) {
        var xt = p[1] / trendAt(p[0]);
        if (!deepest || xt < deepest.xt) deepest = { xt: xt, day: p[0] };
      });
      var span = r.rows[r.rows.length - 1][0] - r.rows[0][0];
      var before = PL_DATA[Math.max(r.s - 1, 0)][0];
      var after = PL_DATA[Math.min(r.e + 1, PL_DATA.length - 1)][0];
      return {
        from: isoOf(r.rows[0][0]), to: isoOf(r.rows[r.rows.length - 1][0]),
        samples: r.rows.length, spanDays: span, bracketDays: after - before,
        deepestXt: +deepest.xt.toFixed(3), deepestOn: isoOf(deepest.day),
        belowPct: +((1 - deepest.xt / PL_FLOOR) * 100).toFixed(1)
      };
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TRIPWIRE
  // ═══════════════════════════════════════════════════════════
  function tripwireState() {
    var d = todayDays(), fl = floorAt(d);
    var vsFloorPct = (spot / fl - 1) * 100;
    var threshold = PL_FLOOR * (1 - TRIPWIRE.depthPct / 100);   // ×-trend at 10% below floor

    // Consecutive elapsed days in the CURRENT run of samples below the
    // threshold. Measured in elapsed days, never in sample counts — the
    // series is a ~12-day grid (module header; MONTHLY_REFRESH_CHECKLIST §1).
    var runDays = 0;
    for (var i = PL_DATA.length - 1; i >= 0; i--) {
      var xt = PL_DATA[i][1] / trendAt(PL_DATA[i][0]);
      if (xt < threshold) runDays = PL_DATA[PL_DATA.length - 1][0] - PL_DATA[i][0];
      else break;
    }
    // Has it ever fired since 2011? (i.e. excluding the 2010 infancy break)
    var firedModern = false, modernStart = dayOfIso('2011-01-01');
    var run = 0, prevDay = null;
    for (var k = 0; k < PL_DATA.length; k++) {
      var day = PL_DATA[k][0], x = PL_DATA[k][1] / trendAt(day);
      if (x < threshold) { run = prevDay === null ? 0 : run + (day - prevDay); prevDay = day; }
      else { run = 0; prevDay = null; }
      if (day >= modernStart && run > TRIPWIRE.days) firedModern = true;
    }
    return {
      vsFloorPct: +vsFloorPct.toFixed(2),
      thresholdXt: +threshold.toFixed(4),
      thresholdPrice: threshold * trendAt(d),
      daysBelow: runDays,
      armed: vsFloorPct < -TRIPWIRE.depthPct,
      firedModern: firedModern
    };
  }

  function renderTripwire() {
    var t = tripwireState();
    var where = t.vsFloorPct >= 0
      ? '<strong>' + t.vsFloorPct.toFixed(1) + '% above the floor</strong>'
      : '<strong>' + Math.abs(t.vsFloorPct).toFixed(1) + '% below the floor</strong>';
    $('flTripwireStatusV').innerHTML =
      where + ' &middot; ' +
      '<strong>' + Math.round(t.daysBelow) + ' days</strong> below the ' + TRIPWIRE.depthPct + '% line &middot; ' +
      'the tripwire has ' + (t.firedModern ? '<strong>fired</strong>' : 'never fired') + ' in the modern era (2011&ndash;). ' +
      'It would arm at ' + usd(t.thresholdPrice) + ' today.';
  }

  // ═══════════════════════════════════════════════════════════
  // VERIFY
  // ═══════════════════════════════════════════════════════════
  function renderVerify() {
    var rows = [
      ['Price series',
       PL_DATA.length + ' samples, ' + isoOf(PL_DATA[0][0]) + ' to ' + isoOf(PL_DATA[PL_DATA.length - 1][0]) + ', on a ~12-day grid. ' +
       'Intraday and daily excursions between samples are invisible to it, so every depth and duration on this page is a <em>lower bound</em>.'],
      ['Channel coefficients',
       'a = 1.6&times;10<sup>&minus;17</sup>, b = 5.77 (M&#279;zinskis / Porkopolis canonical), floor = 0.42&times; trend, upper band = 3&times; trend. Shared module, unmodified.'],
      ['Live spot',
       spotSource === 'live' ? 'Fetched live this pageload.' : 'The live fetch did not resolve; the latest series sample is standing in, and every figure that depends on it is labelled accordingly.'],
      ['The four episodes',
       'Static, from <code>analysis/2026-08-20-power-law-floor.md</code> §2 &mdash; historical facts that do not refresh. <code>floorParityQA()</code> recomputes them from the series on every load and fails loudly if they no longer match.'],
      ['Quantile fits',
       'Static, from the same note §1: pinball-loss quantile regressions at &tau; = 0.02 to 0.50, each fitted with a free slope. Not recomputed in-browser.'],
      ['The parity measurement',
       'Recomputed here at load from the series, following the note’s method. Excess is the median of per-entry differences, not the difference of the medians.'],
      ['Self-check',
       'Open the console and run <code>floorParityQA()</code>. It re-derives the medians at the analysis’s own endpoint and asserts them to &plusmn;0.1pp, checks the episode dataset against the series, and reports today’s live figures alongside.']
    ];
    $('flVerify').innerHTML = rows.map(function (r) {
      return '<div class="fl-verify-row"><div class="fl-verify-k">' + r[0] + '</div><div class="fl-verify-v">' + r[1] + '</div></div>';
    }).join('');
  }

  // ═══════════════════════════════════════════════════════════
  // WIRING + INIT
  // ═══════════════════════════════════════════════════════════
  function wire() {
    var btns = document.querySelectorAll('.fl-seg-btn[data-endpoint]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        endpointMode = this.getAttribute('data-endpoint');
        for (var j = 0; j < btns.length; j++) {
          var on = btns[j] === this;
          btns[j].classList.toggle('is-active', on);
          btns[j].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        renderParity();
      }.bind(btns[i]));
    }
    // Clicking the chart's whitespace clears the episode zoom.
    var wrap = $('flChannelChart');
    if (wrap) wrap.addEventListener('dblclick', function () { activeEpisode = null; zoomChartTo(null); });
  }

  function renderAll() {
    renderHero();
    renderParity();
    renderTripwire();
    renderVerify();
  }

  function init() {
    if (!$('flHeroFigure')) return;
    buildChannelChart();
    renderEpisodeStrip();
    wire();
    renderAll();

    if (typeof fetchTodayPrice === 'function') {
      try {
        fetchTodayPrice(function (price, source) {
          if (isFinite(price) && price > 0) { spot = price; spotSource = source; }
          renderAll();
        });
      } catch (e) { /* offline / blocked — the seeded read stands */ }
    }

    // Build-time assertion, per the design doc: assert, don't assume.
    var qa = floorParityQA();
    if (qa.pass) {
      console.log('[floor-qa] pass — parity fixture ' + qa.fixture.realized + '% / ' + qa.fixture.trend + '% at ' +
                  qa.fixture.endpoint + ', ' + qa.episodes.length + ' episodes verified against the series.');
    }
  }

  window.floorParityQA = floorParityQA;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
