// ═══════════════════════════════════════════════════════════════════
//  /the-gallery — chart renderers (v2)
//
//  Each chart in the Gallery's vertical scroll-through has its own
//  IIFE below. All read from shared/power-law-data.js (PL_DATA,
//  PL_A, PL_B, PL_FLOOR, PL_CEIL, GENESIS_TS, TODAY_DAYS, TODAY_PRICE,
//  plPrice, fetchTodayPrice) so the data source matches the source
//  pages — no fifth place to drift.
//
//  Render strategy: lazy IntersectionObserver init per chart (build
//  only when the section scrolls into view), plus ResizeObserver on
//  the chart container for the 0×0 hidden-canvas resize hardening
//  (TECH_DEBT §6.14). 10 charts on one page is heavy if all built
//  on first paint; lazy init keeps the page snappy.
//
//  Chart-specific config (axis bounds, color tokens, plugin set)
//  lives inside each IIFE so the charts can evolve independently
//  without cross-coupling. Shared helpers (plPrice, GENESIS_TS) come
//  from the shared module loaded before this file.
// ═══════════════════════════════════════════════════════════════════


// ─── Chart 1: The Power Law Channel (Disciplined-Rebalancing style,
//             ±2y default with All-time / Near / Planning toggle) ──
(function(){
  var canvas = document.getElementById('galleryChannelChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;
  if (typeof PL_DATA === 'undefined') return;

  var chartInstance = null;
  var currentRange = 'planning';   // ±2y default
  var hasInited = false;

  // Range definitions — bounds in days-since-genesis (x) and price USD (y).
  // For the zoomed views (near, planning), bounds are computed at build
  // time from today's day count so the window stays correct without
  // hardcoded dates that would drift.
  function getRangeBounds(range) {
    var today = (Date.now() / 1000 - GENESIS_TS) / 86400;
    if (range === 'all-time') {
      return {
        xMin: PL_DATA[0][0],
        xMax: today + 365.25 * 3,
        yMin: 0.05,
        yMax: 10000000,
        xType: 'logarithmic'
      };
    }
    if (range === 'near') {
      // ±1 year around today; y bounds = floor/ceiling at window edges
      var xMin = today - 365.25;
      var xMax = today + 365.25;
      var floorAtMin = plPrice(xMin) * PL_FLOOR * 0.85;
      var ceilAtMax  = plPrice(xMax) * PL_CEIL  * 1.10;
      return {
        xMin: xMin, xMax: xMax,
        yMin: floorAtMin, yMax: ceilAtMax,
        xType: 'linear'
      };
    }
    // planning (±2y, default)
    var xMin = today - 365.25 * 2;
    var xMax = today + 365.25 * 2;
    var floorAtMin = plPrice(xMin) * PL_FLOOR * 0.80;
    var ceilAtMax  = plPrice(xMax) * PL_CEIL  * 1.15;
    return {
      xMin: xMin, xMax: xMax,
      yMin: floorAtMin, yMax: ceilAtMax,
      xType: 'linear'
    };
  }

  // X-axis tick formatter — year labels on the linear-time zoomed views,
  // year-only every doubling on the all-time logarithmic view.
  function formatXTick(v, xType) {
    var ms = (GENESIS_TS + v * 86400) * 1000;
    var year = new Date(ms).getUTCFullYear();
    if (xType === 'logarithmic') {
      // Sparse year ticks at milestones — Chart.js's logarithmic ticks
      // are otherwise unreadable on a 15-year span.
      return [2012, 2016, 2020, 2024, 2028, 2032].indexOf(year) !== -1
        ? String(year) : '';
    }
    return String(year);
  }

  // Y-axis tick formatter — $K / $M abbreviations, sparse on the
  // zoomed views (every band line), denser on the all-time view.
  function formatYTick(v) {
    if (v >= 1000000) return '$' + (v / 1000000).toFixed(v >= 10000000 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (v >= 1000)    return '$' + Math.round(v / 1000) + 'K';
    if (v >= 1)       return '$' + Math.round(v);
    return '$' + v.toFixed(2);
  }

  function buildDatasets(bounds) {
    // Sample the three band lines at every 30 days within (or just past)
    // the visible window. The trend uses plPrice; floor and upper are
    // the canonical 0.42× and 3.0× multiples.
    var step = (bounds.xMax - bounds.xMin) / 200; // ~200 points across window
    step = Math.max(step, 5);                     // floor at 5 days resolution
    var trendLine = [], floorLine = [], upperLine = [];
    for (var d = bounds.xMin; d <= bounds.xMax; d += step) {
      var t = plPrice(d);
      trendLine.push({x: d, y: t});
      floorLine.push({x: d, y: t * PL_FLOOR});
      upperLine.push({x: d, y: t * PL_CEIL});
    }

    // Historical price — filter PL_DATA to points within the window plus
    // a small padding so the line doesn't terminate awkwardly at the edge.
    var pad = (bounds.xMax - bounds.xMin) * 0.02;
    var historicalLine = PL_DATA
      .filter(function(p){ return p[0] >= bounds.xMin - pad && p[0] <= bounds.xMax + pad; })
      .map(function(p){ return {x: p[0], y: p[1]}; });

    // Today marker — single point at (today, live spot)
    var today = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var todayPrice = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
      ? TODAY_PRICE : PL_DATA[PL_DATA.length - 1][1];

    // Extend the historical line to today's live price so the white line
    // reaches the today marker rather than terminating at PL_DATA's last
    // seeded sample (which may be days/weeks/months stale). This is
    // mutated in place by fetchTodayPrice when the live spot lands.
    if (today >= bounds.xMin - pad && today <= bounds.xMax + pad) {
      historicalLine.push({x: today, y: todayPrice});
    }

    return {
      trend: trendLine,
      floor: floorLine,
      upper: upperLine,
      history: historicalLine,
      today: [{x: today, y: todayPrice}]
    };
  }

  function buildChart() {
    var bounds = getRangeBounds(currentRange);
    var data = buildDatasets(bounds);

    var amber = 'rgba(247,147,26,0.95)';
    var rust = 'rgba(176,69,37,0.75)';
    var gold = 'rgba(232,200,32,0.65)';
    var historyColor = 'rgba(232,224,210,0.78)';

    // "Today" vertical-line plugin — same pattern as the-power-law.js
    // (visual anchor on the zoomed views so the reader can see where
    // "now" sits relative to the channel; subtle on the all-time view).
    var today = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var todayLinePlugin = {
      id: 'todayLine',
      afterDatasetsDraw: function(chart){
        var xScale = chart.scales.x;
        var area = chart.chartArea;
        if (!xScale || !area) return;
        var xPos = xScale.getPixelForValue(today);
        if (xPos < area.left || xPos > area.right) return;
        var ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(247,147,26,0.40)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(xPos, area.top);
        ctx.lineTo(xPos, area.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(247,147,26,0.85)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Today', xPos, area.top - 4);
        ctx.restore();
      }
    };

    // "Today" marker glow plugin — soft radial-gradient halo behind the
    // today dot so it visually resonates rather than sitting flat on the
    // canvas. Matches the Disciplined Rebalancing source page's treatment.
    // Hooks beforeDatasetDraw with index check so the glow draws BEFORE
    // the dot itself (which is dataset index 4), making the dot appear
    // on top of the halo.
    var todayGlowPlugin = {
      id: 'todayGlow',
      beforeDatasetDraw: function(chart, args){
        if (args.index !== 4) return;
        var meta = chart.getDatasetMeta(4);
        if (!meta || !meta.data || !meta.data[0]) return;
        var p = meta.data[0];
        if (typeof p.x !== 'number' || typeof p.y !== 'number') return;
        var gctx = chart.ctx;
        gctx.save();
        var grad = gctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
        grad.addColorStop(0,    'rgba(247,147,26,0.55)');
        grad.addColorStop(0.45, 'rgba(247,147,26,0.22)');
        grad.addColorStop(1,    'rgba(247,147,26,0)');
        gctx.fillStyle = grad;
        gctx.beginPath();
        gctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
        gctx.fill();
        gctx.restore();
      }
    };

    var ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          { label: 'Upper (3.0×)', data: data.upper, borderColor: gold, borderWidth: 1.4,
            borderDash: [5, 4], fill: false, pointRadius: 0, tension: 0 },
          { label: 'Trend',        data: data.trend, borderColor: amber, borderWidth: 2,
            fill: false, pointRadius: 0, tension: 0 },
          { label: 'Floor (0.42×)', data: data.floor, borderColor: rust, borderWidth: 1.4,
            borderDash: [5, 4], fill: false, pointRadius: 0, tension: 0 },
          { label: 'Historical price', data: data.history, borderColor: historyColor, borderWidth: 1.6,
            fill: false, pointRadius: 0, tension: 0.1 },
          { label: 'Today', data: data.today, borderColor: amber, backgroundColor: 'rgba(247,147,26,1)',
            pointRadius: 5, pointHoverRadius: 6, showLine: false }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true, position: 'top',
            labels: { color: 'rgba(220,200,170,0.55)', font: { size: 11, family: 'Inter, sans-serif' },
                      boxWidth: 18, boxHeight: 2, padding: 14, usePointStyle: false }
          },
          tooltip: {
            enabled: true, backgroundColor: 'rgba(15,12,8,0.95)', borderColor: 'rgba(247,147,26,0.30)',
            borderWidth: 1, titleColor: 'rgba(232,224,210,0.95)', bodyColor: 'rgba(220,200,170,0.85)',
            titleFont: { size: 11, family: 'Inter, sans-serif' },
            bodyFont:  { size: 11, family: 'Inter, sans-serif' },
            callbacks: {
              title: function(items){
                if (!items.length) return '';
                var d = items[0].parsed.x;
                var ms = (GENESIS_TS + d * 86400) * 1000;
                var date = new Date(ms);
                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
              },
              label: function(item){
                return item.dataset.label + ': ' + formatYTick(item.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            type: bounds.xType, min: bounds.xMin, max: bounds.xMax,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)',
              font: { size: 11, family: 'Inter, sans-serif' },
              maxRotation: 0, autoSkip: bounds.xType === 'linear',
              callback: function(v){ return formatXTick(v, bounds.xType); }
            },
            border: { display: false }
          },
          y: {
            type: 'logarithmic', min: bounds.yMin, max: bounds.yMax,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)',
              font: { size: 11, family: 'Inter, sans-serif' },
              callback: formatYTick
            },
            border: { display: false }
          }
        },
        layout: { padding: { top: 4, right: 12, bottom: 0, left: 0 } }
      },
      plugins: [todayLinePlugin, todayGlowPlugin]
    });
  }

  function rebuild() {
    if (chartInstance) {
      try { chartInstance.destroy(); } catch (e) {}
      chartInstance = null;
    }
    buildChart();
  }

  function updateStatus(price, source) {
    var priceEl = document.getElementById('channelTodayPrice');
    var multEl  = document.getElementById('channelTodayMult');
    if (!priceEl || !multEl) return;
    var today = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var trend = plPrice(today);
    var mult = price / trend;
    priceEl.textContent = price >= 1000
      ? '$' + (price / 1000).toFixed(1) + 'K'
      : '$' + Math.round(price).toLocaleString();
    multEl.textContent = mult.toFixed(2) + '\u00d7 trend';
  }

  function init() {
    if (hasInited) return;
    hasInited = true;

    requestAnimationFrame(function(){
      try {
        buildChart();

        // First-paint status from seeded TODAY_PRICE (so the live ribbon
        // is never empty even before the CoinGecko fetch resolves).
        if (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0) {
          updateStatus(TODAY_PRICE, 'seed');
        }

        // Live price replaces the seed when the fetch lands; pokes the
        // Today marker on the chart (dataset index 4) AND the trailing
        // point of the historical line (dataset index 3, last point —
        // see buildDatasets which appends a today point to the history
        // so the white line reaches the marker rather than terminating
        // at PL_DATA's last seeded sample).
        if (typeof fetchTodayPrice === 'function') {
          fetchTodayPrice(function(price /*, source */){
            updateStatus(price, 'live');
            if (!chartInstance || !chartInstance.data) return;
            var todayDs = chartInstance.data.datasets[4];
            if (todayDs && todayDs.data && todayDs.data[0]) {
              todayDs.data[0].y = price;
            }
            var historyDs = chartInstance.data.datasets[3];
            if (historyDs && historyDs.data && historyDs.data.length) {
              var lastIdx = historyDs.data.length - 1;
              historyDs.data[lastIdx].y = price;
            }
            chartInstance.update('none');
          });
        }
      } catch (err) {
        var fallback = document.querySelector('#section-channel .gallery-chart-fallback');
        if (fallback) {
          fallback.classList.add('show');
          var p = fallback.querySelector('.chart-loading');
          if (p) p.textContent = 'Chart unavailable \u2014 open the full version \u2192';
        }
      }
    });
  }

  // Range toggle — wire each button to switch currentRange + rebuild
  document.querySelectorAll('#section-channel .range-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var r = btn.dataset.range;
      if (!r || r === currentRange) return;
      currentRange = r;
      document.querySelectorAll('#section-channel .range-btn').forEach(function(b){
        var on = b.dataset.range === currentRange;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      // If init hasn't run yet (toggle clicked before chart enters view),
      // calling init() here will build with the new range; otherwise
      // rebuild explicitly.
      if (!hasInited) init();
      else rebuild();
    });
  });

  // Lazy init — only build when the section scrolls into view (10% +
  // 50px margin = generous trigger so the chart is ready by the time
  // the reader's looking at it but not paying CPU on first paint).
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          init();
          io.disconnect();
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });
    io.observe(canvas);
  } else {
    init();
  }

  // ResizeObserver — TECH_DEBT §6.14 hidden-canvas resize hardening.
  // When the chart frame resizes (orientation change, panel collapse)
  // Chart.js's internal resize doesn't always catch up; call resize()
  // explicitly so the canvas redraws at the new dimensions.
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function(){
      if (chartInstance) {
        try { chartInstance.resize(); } catch (e) {}
      }
    });
    ro.observe(canvas.parentElement);
  }
})();


// ─── Chart 2: Power Law Implied CAGR vs. S&P 500 ──────────────────
//
// Bar chart of the model's implied CAGR-to-2035 for each starting year
// 2015-2030, with a horizontal dashed line at 10% (the S&P 500's
// historical annualized average). Mirrors the chart on /the-power-law
// but rendered standalone for the Gallery (no shared module yet —
// accepted minor drift risk, per the spec conversation).
//
// Convergence note lives in the prose paragraph beside the chart
// rather than on the chart axis: per the math worked out before
// shipping, the bars don't cross 10% until ~2150 with starting year
// 2025, so extending the axis would just show more bars above the
// dashed line, not a crossing.
(function(){
  var canvas = document.getElementById('galleryCagrChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined' || typeof plPrice === 'undefined') return;

  var chartInstance = null;
  var hasInited = false;

  function buildChart() {
    var targetYear = 2035;
    var targetDays = (targetYear - 2009) * 365.25;
    var targetPrice = plPrice(targetDays);

    var years = [], cagrValues = [], sp500Line = [];
    for (var y = 2015; y <= 2030; y++) {
      var yrsHeld = targetYear - y;
      if (yrsHeld <= 0) continue;
      var startPrice = plPrice((y - 2009) * 365.25);
      var cagr = (Math.pow(targetPrice / startPrice, 1 / yrsHeld) - 1) * 100;
      years.push(y.toString());
      cagrValues.push(+cagr.toFixed(1));
      sp500Line.push(10);
    }

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: years,
        datasets: [
          { label: 'Bitcoin Power Law CAGR to 2035', data: cagrValues, order: 2,
            backgroundColor: 'rgba(247,147,26,0.45)', borderColor: 'rgba(247,147,26,0.85)',
            borderWidth: 1, borderRadius: 3 },
          { label: 'S\u0026P 500 Historical Avg (~10%)', data: sp500Line, type: 'line', order: 1,
            borderColor: 'rgba(200,190,170,0.55)', borderWidth: 2, borderDash: [6, 3],
            pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true, position: 'top',
            labels: { color: 'rgba(220,200,170,0.55)', font: { size: 11, family: 'Inter, sans-serif' },
                      boxWidth: 14, padding: 14 }
          },
          tooltip: {
            backgroundColor: 'rgba(15,12,8,0.95)', borderColor: 'rgba(247,147,26,0.30)',
            borderWidth: 1, titleColor: 'rgba(232,224,210,0.95)', bodyColor: 'rgba(220,200,170,0.85)',
            titleFont: { size: 11, family: 'Inter, sans-serif' },
            bodyFont:  { size: 11, family: 'Inter, sans-serif' },
            callbacks: {
              label: function(item){
                if (item.datasetIndex === 0) return 'Bitcoin CAGR: ' + item.raw + '%';
                return 'S&P 500 avg: ~10%';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: { color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            title: { display: true, text: 'Year of Bitcoin purchase',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: { color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' },
                     callback: function(v){ return v + '%'; } },
            title: { display: true, text: 'Implied CAGR to 2035',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            beginAtZero: true, border: { display: false }
          }
        },
        layout: { padding: { top: 4, right: 12, bottom: 0, left: 0 } }
      }
    });
  }

  function init() {
    if (hasInited) return;
    hasInited = true;
    requestAnimationFrame(function(){
      try { buildChart(); }
      catch (err) {
        var fb = document.querySelector('#section-cagr .gallery-chart-fallback');
        if (fb) {
          fb.classList.add('show');
          var p = fb.querySelector('.chart-loading');
          if (p) p.textContent = 'Chart unavailable \u2014 open the full version \u2192';
        }
      }
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          init(); io.disconnect();
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });
    io.observe(canvas);
  } else { init(); }

  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function(){
      if (chartInstance) { try { chartInstance.resize(); } catch (e) {} }
    });
    ro.observe(canvas.parentElement);
  }
})();


// ─── Chart 3: BTC Required to Buy the Median US House ─────────────
//
// Semi-log line chart, x = years 2013-2032 (2013-2025 actual, 2026-2032
// projected trend), y = log-scale BTC count. Data mirrors the source
// chart on /bitcoin-vs-real-estate#priced-in-bitcoin — accepted as
// duplicated since it's just 13 home prices and 13 BTC prices; trivial
// to keep in sync at the annual cadence the data updates.
(function(){
  var canvas = document.getElementById('galleryBtcHouseChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;

  // Annual data — mirrors bitcoin-vs-real-estate.js homeData/btcData
  // for the years where both exist (2013 onward). Refresh annually.
  var homeData = {
    2013: 268900, 2014: 282800, 2015: 294000, 2016: 306200, 2017: 323500,
    2018: 326400, 2019: 321500, 2020: 336900, 2021: 401700, 2022: 454900,
    2023: 426100, 2024: 420300, 2025: 416900
  };
  var btcData = {
    2013: 732, 2014: 530, 2015: 272, 2016: 567, 2017: 4348, 2018: 7565,
    2019: 7362, 2020: 11072, 2021: 47458, 2022: 19657, 2023: 28233,
    2024: 62682, 2025: 88000
  };

  var chartInstance = null;
  var hasInited = false;

  function buildChart() {
    var btcYears = Object.keys(btcData).map(Number);
    var projYears = [2026, 2027, 2028, 2029, 2030, 2031, 2032];
    var allLabels = btcYears.map(String).concat(projYears.map(String));

    var btcHouseValues = btcYears.map(function(y){
      return +(homeData[y] / btcData[y]).toFixed(1);
    });

    // Smooth trend line — log-linear from 367 BTC (2013) to ~1.5 BTC (2032),
    // matching the source chart. Continues seamlessly across actual + projected.
    var trendFull = btcYears.concat(projYears).map(function(y){
      var t = (y - 2013) / (2032 - 2013);
      return +(367 * Math.pow(1.5 / 367, t)).toFixed(2);
    });
    // Historical actual: data for 2013-2025, nulls for projection years
    var historicalFull = btcHouseValues.concat(projYears.map(function(){ return null; }));

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: allLabels,
        datasets: [
          { label: 'Actual', data: historicalFull,
            borderColor: 'rgba(247,147,26,0.95)',
            backgroundColor: 'rgba(247,147,26,0.15)',
            borderWidth: 2.5, pointBackgroundColor: 'rgba(247,147,26,1)',
            pointRadius: 4, pointHoverRadius: 7, fill: true, tension: 0.3 },
          { label: 'Trend', data: trendFull,
            borderColor: 'rgba(224,148,34,0.45)', backgroundColor: 'transparent',
            borderWidth: 2, borderDash: [8, 4], pointRadius: 0, tension: 0.4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true, position: 'top',
            labels: { color: 'rgba(220,200,170,0.55)', font: { size: 11, family: 'Inter, sans-serif' },
                      boxWidth: 14, padding: 14, usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            backgroundColor: 'rgba(15,12,8,0.95)', borderColor: 'rgba(247,147,26,0.30)',
            borderWidth: 1, titleColor: 'rgba(232,224,210,0.95)', bodyColor: 'rgba(220,200,170,0.85)',
            titleFont: { size: 11, family: 'Inter, sans-serif' },
            bodyFont:  { size: 11, family: 'Inter, sans-serif' },
            callbacks: {
              title: function(c){ return c[0].label; },
              label: function(c){
                var y = parseInt(c.label);
                var isProj = y > 2025;
                if (c.datasetIndex === 1) return 'Trend: ~' + c.parsed.y.toFixed(1) + ' BTC';
                if (isProj) return null;
                return [
                  c.parsed.y.toFixed(1) + ' BTC',
                  'House: $' + (homeData[y] || 0).toLocaleString(),
                  'BTC price: $' + (btcData[y] || 0).toLocaleString()
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: function(c){ return c.index > 12 ? 'rgba(220,200,170,0.25)' : 'rgba(220,200,170,0.45)'; },
              font: { size: 11, family: 'Inter, sans-serif' }, maxRotation: 0
            },
            border: { display: false }
          },
          y: {
            type: 'logarithmic', min: 1,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)',
              font: { size: 11, family: 'Inter, sans-serif' },
              callback: function(v){
                var marks = [1, 2, 5, 10, 20, 50, 100, 200, 500];
                return marks.indexOf(v) !== -1 ? v.toLocaleString() : '';
              }
            },
            title: { display: true, text: 'Bitcoin Required',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false }
          }
        },
        layout: { padding: { top: 4, right: 12, bottom: 0, left: 0 } }
      }
    });
  }

  function init() {
    if (hasInited) return;
    hasInited = true;
    requestAnimationFrame(function(){
      try { buildChart(); }
      catch (err) {
        var fb = document.querySelector('#section-btc-house .gallery-chart-fallback');
        if (fb) {
          fb.classList.add('show');
          var p = fb.querySelector('.chart-loading');
          if (p) p.textContent = 'Chart unavailable \u2014 open the full version \u2192';
        }
      }
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          init(); io.disconnect();
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });
    io.observe(canvas);
  } else { init(); }

  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function(){
      if (chartInstance) { try { chartInstance.resize(); } catch (e) {} }
    });
    ro.observe(canvas.parentElement);
  }
})();


// ─── Chart 4: The Real Opportunity Cost of Buying a House ─────────
//
// Two-line log chart, growth of $1 invested from a reader-selected
// start year (2014/2016/2018/2020/2022, default 2018) to 2025. Bitcoin
// line filled amber, housing line dashed red. Source-page parity for
// the data (annual averages mirror bitcoin-vs-real-estate.js); the
// editorial framing is the seesaw-style "pick any year" argument.
(function(){
  var canvas = document.getElementById('galleryOppCostChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;

  // Same annual data as Chart 3 — duplicated rather than shared via
  // module, since the two charts ship together and a shared module
  // would be premature factorization. Refresh annually in both places.
  var homeData = {
    2013: 268900, 2014: 282800, 2015: 294000, 2016: 306200, 2017: 323500,
    2018: 326400, 2019: 321500, 2020: 336900, 2021: 401700, 2022: 454900,
    2023: 426100, 2024: 420300, 2025: 416900
  };
  var btcData = {
    2013: 732, 2014: 530, 2015: 272, 2016: 567, 2017: 4348, 2018: 7565,
    2019: 7362, 2020: 11072, 2021: 47458, 2022: 19657, 2023: 28233,
    2024: 62682, 2025: 88000
  };

  var chartInstance = null;
  var currentStartYear = 2018;
  var hasInited = false;

  function buildChart() {
    var btcYears = Object.keys(btcData).map(Number);
    var visYrs = btcYears.filter(function(y){ return y >= currentStartYear; });

    var idxBtc  = visYrs.map(function(y){
      return +((btcData[y]  / btcData[currentStartYear])  * 100).toFixed(1);
    });
    var idxHome = visYrs.map(function(y){
      return +((homeData[y] / homeData[currentStartYear]) * 100).toFixed(1);
    });

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: visYrs.map(String),
        datasets: [
          { label: 'Bitcoin', data: idxBtc,
            borderColor: 'rgba(247,147,26,0.95)',
            backgroundColor: 'rgba(247,147,26,0.10)',
            borderWidth: 2.5, pointRadius: 3, tension: 0.3, fill: true },
          { label: 'Housing', data: idxHome,
            borderColor: 'rgba(192,57,43,0.85)', backgroundColor: 'transparent',
            borderWidth: 2.5, pointRadius: 3, tension: 0.3, borderDash: [6, 3] }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true, position: 'top',
            labels: { color: 'rgba(220,200,170,0.55)', font: { size: 11, family: 'Inter, sans-serif' },
                      boxWidth: 14, padding: 14, usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            backgroundColor: 'rgba(15,12,8,0.95)', borderColor: 'rgba(247,147,26,0.30)',
            borderWidth: 1, titleColor: 'rgba(232,224,210,0.95)', bodyColor: 'rgba(220,200,170,0.85)',
            titleFont: { size: 11, family: 'Inter, sans-serif' },
            bodyFont:  { size: 11, family: 'Inter, sans-serif' },
            callbacks: {
              label: function(c){
                var pct = (c.parsed.y - 100).toFixed(0);
                var sign = pct >= 0 ? '+' : '';
                var yr = visYrs[c.dataIndex];
                var actual = c.dataset.label === 'Bitcoin' ? btcData[yr] : homeData[yr];
                var priceFmt = '$' + actual.toLocaleString();
                return c.dataset.label + ': ' + sign + Number(pct).toLocaleString() + '% since ' + currentStartYear + ' (' + priceFmt + ')';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: { color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' }, maxRotation: 0 },
            border: { display: false }
          },
          y: {
            type: 'logarithmic', min: 30,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' },
              callback: function(v){
                var marks = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 12000];
                if (marks.indexOf(v) === -1) return '';
                if (v === 100) return '$1 (start)';
                return '$' + (v / 100).toFixed(0);
              }
            },
            title: { display: true, text: 'Growth of $1 Invested',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false }
          }
        },
        layout: { padding: { top: 4, right: 12, bottom: 0, left: 0 } }
      }
    });
  }

  function rebuild() {
    if (chartInstance) {
      try { chartInstance.destroy(); } catch (e) {}
      chartInstance = null;
    }
    buildChart();
    // Update the chart's subtitle to reflect the new start year — small
    // touch that makes the toggle feel grounded ("Growth of $1 invested
    // in 2020 — bitcoin vs. housing").
    var sub = document.getElementById('oppCostSubtitle');
    if (sub) sub.textContent = 'Growth of $1 invested in ' + currentStartYear + ' \u2014 bitcoin vs. housing, log scale.';
  }

  function init() {
    if (hasInited) return;
    hasInited = true;
    requestAnimationFrame(function(){
      try { buildChart(); }
      catch (err) {
        var fb = document.querySelector('#section-opp-cost .gallery-chart-fallback');
        if (fb) {
          fb.classList.add('show');
          var p = fb.querySelector('.chart-loading');
          if (p) p.textContent = 'Chart unavailable \u2014 open the full version \u2192';
        }
      }
    });
  }

  // Start-year toggle — same UI pattern as Chart 1's range toggle,
  // different semantics. data-start-year on each button.
  document.querySelectorAll('#section-opp-cost .range-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var y = parseInt(btn.dataset.startYear, 10);
      if (!y || y === currentStartYear) return;
      currentStartYear = y;
      document.querySelectorAll('#section-opp-cost .range-btn').forEach(function(b){
        var on = parseInt(b.dataset.startYear, 10) === currentStartYear;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (!hasInited) init();
      else rebuild();
    });
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          init(); io.disconnect();
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });
    io.observe(canvas);
  } else { init(); }

  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function(){
      if (chartInstance) { try { chartInstance.resize(); } catch (e) {} }
    });
    ro.observe(canvas.parentElement);
  }
})();
