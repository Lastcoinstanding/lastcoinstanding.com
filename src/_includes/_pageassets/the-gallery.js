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


// ─── Chart 5: Global Housing Affordability ────────────────────────
//
// Demographia annual median multiples (price-to-income) for five
// major English-speaking markets, with the 3.0× "affordable"
// threshold as a dashed reference line. Mirrors the chart on
// /bitcoin-vs-real-estate#affordability. Data refresh: annually each
// May when Demographia publishes the new survey (see MONTHLY_REFRESH_
// CHECKLIST).
(function(){
  var canvas = document.getElementById('galleryGlobalAffChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;

  var chartInstance = null;
  var hasInited = false;

  // Demographia annual ratios, 2005-2024. Nulls = year not surveyed.
  // Mirrors bitcoin-vs-real-estate.js arrays; refresh together.
  var YEARS  = [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024];
  var RAT_HK = [null,null,null,null,null,11.4,12.6,13.5,14.9,17.0,19.0,18.1,19.4,20.9,20.8,20.7,23.2,18.8,16.7,14.4];
  var RAT_SYD= [8.5,8.5,8.6,8.3,9.1,9.6,9.2,8.3,9.0,9.8,12.2,12.2,12.9,11.7,11.0,11.8,15.3,13.3,13.3,13.8];
  var RAT_VAN= [6.6,7.7,8.4,8.4,9.3,9.5,10.6,9.5,10.3,10.6,10.8,11.8,12.6,12.6,11.9,13.0,13.3,12.0,12.3,11.8];
  var RAT_LON= [6.9,8.3,7.7,6.8,6.7,7.2,6.9,6.8,7.3,6.9,7.1,7.1,6.9,6.9,8.2,8.6,8.0,8.7,8.1,9.1];
  var RAT_US = [4.6,3.7,3.6,3.2,2.9,3.3,3.1,3.2,3.5,3.6,3.7,3.9,3.8,3.9,3.9,4.2,5.0,5.0,4.8,4.8];
  var THRESH = YEARS.map(function(){ return 3.0; });

  function buildChart() {
    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: YEARS.map(String),
        datasets: [
          { label: 'Hong Kong', data: RAT_HK,
            borderColor: 'rgba(192,57,43,0.95)', backgroundColor: 'transparent',
            borderWidth: 2.5, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.3, spanGaps: false },
          { label: 'Sydney', data: RAT_SYD,
            borderColor: 'rgba(217,115,38,0.85)', backgroundColor: 'transparent',
            borderWidth: 2.5, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.3 },
          { label: 'Vancouver', data: RAT_VAN,
            borderColor: 'rgba(176,122,46,0.85)', backgroundColor: 'transparent',
            borderWidth: 2.5, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.3 },
          { label: 'Greater London', data: RAT_LON,
            borderColor: 'rgba(122,140,146,0.85)', backgroundColor: 'transparent',
            borderWidth: 2.5, pointRadius: 2.5, pointHoverRadius: 5, tension: 0.3 },
          { label: 'United States (national)', data: RAT_US,
            borderColor: 'rgba(247,147,26,0.95)', backgroundColor: 'rgba(247,147,26,0.10)',
            borderWidth: 3.5, pointRadius: 3.5, pointHoverRadius: 6, tension: 0.3, fill: true },
          { label: "\u2018Affordable\u2019 threshold (3.0\u00d7)", data: THRESH,
            borderColor: 'rgba(39,174,96,0.85)', backgroundColor: 'transparent',
            borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 0, tension: 0, fill: false }
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
            filter: function(item){ return item.parsed.y !== null; },
            callbacks: {
              label: function(c){ return c.dataset.label + ': ' + c.parsed.y.toFixed(1) + '\u00d7 income'; }
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
            min: 2, max: 25,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: { color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' },
                     stepSize: 5, callback: function(v){ return v + '\u00d7'; } },
            title: { display: true, text: 'Price-to-Income Ratio',
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
        var fb = document.querySelector('#section-global-aff .gallery-chart-fallback');
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


// ─── Chart 6: BTC Needed for Retirement (decay curve) ─────────────
//
// Mirrors the "Smitty-style" static viz on /the-bitcoin-retirement.
// At each retirement year (today through today+30), how many BTC at
// the Power Law trend price would fund a \$100K/year retirement under
// the 4% rule (i.e. a \$2.5M principal). Each anchor is its own
// scenario — the curve is NOT a single stack drawing down — so the
// editorial framing (and the in-canvas labels) make that explicit.
(function(){
  var canvas = document.getElementById('galleryRetirementChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined' || typeof plPrice !== 'function') return;

  var chartInstance = null;
  var hasInited = false;
  var anchorsData = [];   // populated in buildChart so the plugin can read

  // Anchor plugin: amber dots + "X.X BTC" labels at year 0/+10/+20/+30.
  // Mirrors the source-page treatment so a reader scanning the chart
  // sees the four concrete numbers without hovering.
  var anchorPlugin = {
    id: 'retirementAnchors',
    afterDatasetsDraw: function(chart){
      if (!anchorsData.length) return;
      var xScale = chart.scales.x, yScale = chart.scales.y;
      var ctx = chart.ctx;
      ctx.save();
      anchorsData.forEach(function(a, idx){
        var xPx = xScale.getPixelForValue(a.x);
        var yPx = yScale.getPixelForValue(a.btc);
        // Amber dot
        ctx.fillStyle = '#E09422';
        ctx.beginPath();
        ctx.arc(xPx, yPx, 4, 0, Math.PI * 2);
        ctx.fill();
        // BTC count label
        var txt = a.btc >= 1
          ? a.btc.toFixed(1) + ' BTC'
          : a.btc.toFixed(2) + ' BTC';
        ctx.textAlign = (idx === 0) ? 'left'
                      : (idx === anchorsData.length - 1) ? 'right'
                      : 'center';
        ctx.fillStyle = 'rgba(232,224,210,0.92)';
        ctx.font = '500 12px Inter, sans-serif';
        ctx.fillText(txt, xPx, yPx - 11);
      });
      ctx.restore();
    }
  };

  function buildChart() {
    var PRINCIPAL = 2500000;  // $100K / 4% rule
    var todayYear = new Date().getFullYear();
    var endYear   = todayYear + 30;

    // Build the BTC-needed curve, one point per year
    var data = [];
    for (var y = todayYear; y <= endYear; y++) {
      var d = new Date(y, 0, 1);
      var daysSinceGenesis = (d.getTime() / 1000 - GENESIS_TS) / 86400;
      var trendPrice = plPrice(daysSinceGenesis);
      data.push({ x: y, y: PRINCIPAL / trendPrice });
    }

    // Anchors at today, +10, +20, +30
    anchorsData = [];
    [todayYear, todayYear + 10, todayYear + 20, todayYear + 30].forEach(function(y){
      for (var i = 0; i < data.length; i++) {
        if (data[i].x === y) { anchorsData.push({ x: y, btc: data[i].y }); break; }
      }
    });

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        datasets: [{
          label: 'BTC needed', data: data, parsing: false,
          borderColor: '#E09422', backgroundColor: 'rgba(224,148,34,0.10)',
          borderWidth: 2, fill: true, tension: 0.25, pointRadius: 0, pointHoverRadius: 0
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        parsing: false, animation: { duration: 0 },
        layout: { padding: { top: 28, right: 40, bottom: 4, left: 8 } },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }   // anchors are the in-canvas labels
        },
        scales: {
          x: {
            type: 'linear', min: todayYear, max: endYear,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)',
              font: { size: 11, family: 'Inter, sans-serif' },
              stepSize: 5, callback: function(v){ return Math.round(v); }
            },
            title: { display: true, text: 'Retirement year',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' },
                     padding: { top: 8 } },
            border: { display: false }
          },
          y: {
            type: 'logarithmic', min: 0.04, max: 30,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)',
              font: { size: 11, family: 'Inter, sans-serif' },
              callback: function(v){
                var marks = [0.1, 1, 10];
                return marks.indexOf(v) !== -1 ? v + ' BTC' : '';
              }
            },
            title: { display: true, text: 'BTC needed at trend price',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false }
          }
        }
      },
      plugins: [anchorPlugin]
    });
  }

  function init() {
    if (hasInited) return;
    hasInited = true;
    requestAnimationFrame(function(){
      try { buildChart(); }
      catch (err) {
        var fb = document.querySelector('#section-retirement .gallery-chart-fallback');
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


// ─── Chart 7: $10K invested in 2010 — BTC vs S&P 500 vs NASDAQ-100 ──
//
// Three log-Y lines showing wealth trajectory of $10K invested in
// mid-2010 (first reliable BTC price), held to today. Total-return
// indexes for SP500 and NDQ (dividends reinvested). BTC uses PL_DATA
// directly. Data: SP500_TR_DATA and NDQ_TR_DATA are inlined below,
// mirroring the same arrays in calculators-minis.js — accepted
// duplication per Commit A's strategy. Both arrays refresh monthly
// per MONTHLY_REFRESH_CHECKLIST; updates need to land in both files.
(function(){
  var canvas = document.getElementById('galleryBvsmChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined' || typeof PL_DATA === 'undefined') return;

  var chartInstance = null;
  var hasInited = false;

  // Total-return monthly samples — mirrors calculators-minis.js (see
  // header comment). Each entry is [date-ISO, level]. Refresh monthly.
  var SP500_TR_DATA = [
    ["2010-01-28", 1721.34],["2010-02-28", 1742.67],["2010-03-28", 1764.01],["2010-04-28", 1785.34],
    ["2010-05-28", 1806.68],["2010-06-28", 1828.01],["2010-07-28", 1849.35],["2010-08-28", 1870.68],
    ["2010-09-28", 1892.02],["2010-10-28", 1913.35],["2010-11-28", 1934.69],["2010-12-28", 1956.02],
    ["2011-01-28", 1959.46],["2011-02-28", 1962.9],["2011-03-28", 1966.34],["2011-04-28", 1969.78],
    ["2011-05-28", 1973.22],["2011-06-28", 1976.66],["2011-07-28", 1980.1],["2011-08-28", 1983.53],
    ["2011-09-28", 1986.97],["2011-10-28", 1990.41],["2011-11-28", 1993.85],["2011-12-28", 1997.29],
    ["2012-01-28", 2023.92],["2012-02-28", 2050.55],["2012-03-28", 2077.18],["2012-04-28", 2103.81],
    ["2012-05-28", 2130.44],["2012-06-28", 2157.08],["2012-07-28", 2183.71],["2012-08-28", 2210.34],
    ["2012-09-28", 2236.97],["2012-10-28", 2263.6],["2012-11-28", 2290.23],["2012-12-28", 2316.86],
    ["2013-01-28", 2379.39],["2013-02-28", 2441.93],["2013-03-28", 2504.47],["2013-04-28", 2567.0],
    ["2013-05-28", 2629.54],["2013-06-28", 2692.07],["2013-07-28", 2754.61],["2013-08-28", 2817.15],
    ["2013-09-28", 2879.68],["2013-10-28", 2942.22],["2013-11-28", 3004.75],["2013-12-28", 3067.29],
    ["2014-01-28", 3102.28],["2014-02-28", 3137.27],["2014-03-28", 3172.27],["2014-04-28", 3207.26],
    ["2014-05-28", 3242.25],["2014-06-28", 3277.25],["2014-07-28", 3312.24],["2014-08-28", 3347.23],
    ["2014-09-28", 3382.22],["2014-10-28", 3417.22],["2014-11-28", 3452.21],["2014-12-28", 3487.2],
    ["2015-01-28", 3491.21],["2015-02-28", 3495.22],["2015-03-28", 3499.23],["2015-04-28", 3503.24],
    ["2015-05-28", 3507.25],["2015-06-28", 3511.26],["2015-07-28", 3515.27],["2015-08-28", 3519.28],
    ["2015-09-28", 3523.29],["2015-10-28", 3527.3],["2015-11-28", 3531.31],["2015-12-28", 3535.32],
    ["2016-01-28", 3570.56],["2016-02-28", 3605.8],["2016-03-28", 3641.03],["2016-04-28", 3676.27],
    ["2016-05-28", 3711.5],["2016-06-28", 3746.74],["2016-07-28", 3781.97],["2016-08-28", 3817.21],
    ["2016-09-28", 3852.44],["2016-10-28", 3887.68],["2016-11-28", 3922.91],["2016-12-28", 3958.15],
    ["2017-01-28", 4030.15],["2017-02-28", 4102.16],["2017-03-28", 4174.17],["2017-04-28", 4246.17],
    ["2017-05-28", 4318.18],["2017-06-28", 4390.18],["2017-07-28", 4462.19],["2017-08-28", 4534.19],
    ["2017-09-28", 4606.2],["2017-10-28", 4678.2],["2017-11-28", 4750.21],["2017-12-28", 4822.21],
    ["2018-01-28", 4804.61],["2018-02-28", 4787.01],["2018-03-28", 4769.41],["2018-04-28", 4751.81],
    ["2018-05-28", 4734.21],["2018-06-28", 4716.61],["2018-07-28", 4699.01],["2018-08-28", 4681.4],
    ["2018-09-28", 4663.8],["2018-10-28", 4646.2],["2018-11-28", 4628.6],["2018-12-28", 4611.0],
    ["2019-01-28", 4732.0],["2019-02-28", 4853.0],["2019-03-28", 4974.0],["2019-04-28", 5095.0],
    ["2019-05-28", 5216.0],["2019-06-28", 5337.0],["2019-07-28", 5458.0],["2019-08-28", 5579.0],
    ["2019-09-28", 5700.0],["2019-10-28", 5821.0],["2019-11-28", 5942.0],["2019-12-28", 6063.0],
    ["2020-01-28", 6155.97],["2020-02-28", 6248.94],["2020-03-28", 6341.9],["2020-04-28", 6434.87],
    ["2020-05-28", 6527.83],["2020-06-28", 6620.8],["2020-07-28", 6713.77],["2020-08-28", 6806.73],
    ["2020-09-28", 6899.7],["2020-10-28", 6992.67],["2020-11-28", 7085.63],["2020-12-28", 7178.6],
    ["2021-01-28", 7350.35],["2021-02-28", 7522.09],["2021-03-28", 7693.84],["2021-04-28", 7865.59],
    ["2021-05-28", 8037.34],["2021-06-28", 8209.08],["2021-07-28", 8380.83],["2021-08-28", 8552.58],
    ["2021-09-28", 8724.33],["2021-10-28", 8896.08],["2021-11-28", 9067.82],["2021-12-28", 9239.57],
    ["2022-01-28", 9100.13],["2022-02-28", 8960.69],["2022-03-28", 8821.25],["2022-04-28", 8681.81],
    ["2022-05-28", 8542.37],["2022-06-28", 8402.93],["2022-07-28", 8263.49],["2022-08-28", 8124.05],
    ["2022-09-28", 7984.61],["2022-10-28", 7845.17],["2022-11-28", 7705.73],["2022-12-28", 7566.29],
    ["2023-01-28", 7732.05],["2023-02-28", 7897.82],["2023-03-28", 8063.58],["2023-04-28", 8229.34],
    ["2023-05-28", 8395.11],["2023-06-28", 8560.87],["2023-07-28", 8726.64],["2023-08-28", 8892.4],
    ["2023-09-28", 9058.17],["2023-10-28", 9223.93],["2023-11-28", 9389.7],["2023-12-28", 9555.46],
    ["2024-01-28", 9754.69],["2024-02-28", 9953.93],["2024-03-28", 10153.16],["2024-04-28", 10352.39],
    ["2024-05-28", 10551.62],["2024-06-28", 10750.85],["2024-07-28", 10950.08],["2024-08-28", 11149.31],
    ["2024-09-28", 11348.55],["2024-10-28", 11547.78],["2024-11-28", 11747.01],["2024-12-28", 11946.24],
    ["2025-01-28", 12125.43],["2025-02-28", 12304.63],["2025-03-28", 12483.82],["2025-04-28", 12663.01],
    ["2025-05-28", 12842.21],["2025-06-28", 13021.4],["2025-07-28", 13200.59],["2025-08-28", 13379.79],
    ["2025-09-28", 13558.98],["2025-10-28", 13738.18],["2025-11-28", 13917.37],["2025-12-28", 14096.56],
    ["2026-01-28", 14128.98],["2026-02-28", 14161.41],["2026-03-28", 14193.83],["2026-04-28", 14226.25],
    ["2026-05-28", 14258.67]
  ];

  var NDQ_TR_DATA = [
    ["2010-01-28", 2082.82],["2010-02-28", 2115.63],["2010-03-28", 2148.45],["2010-04-28", 2181.27],
    ["2010-05-28", 2214.09],["2010-06-28", 2246.9],["2010-07-28", 2279.72],["2010-08-28", 2312.54],
    ["2010-09-28", 2345.35],["2010-10-28", 2378.17],["2010-11-28", 2410.99],["2010-12-28", 2443.8],
    ["2011-01-28", 2451.32],["2011-02-28", 2458.83],["2011-03-28", 2466.35],["2011-04-28", 2473.86],
    ["2011-05-28", 2481.38],["2011-06-28", 2488.89],["2011-07-28", 2496.41],["2011-08-28", 2503.92],
    ["2011-09-28", 2511.44],["2011-10-28", 2518.95],["2011-11-28", 2526.47],["2011-12-28", 2533.98],
    ["2012-01-28", 2572.27],["2012-02-28", 2610.55],["2012-03-28", 2648.83],["2012-04-28", 2687.12],
    ["2012-05-28", 2725.4],["2012-06-28", 2763.69],["2012-07-28", 2801.97],["2012-08-28", 2840.26],
    ["2012-09-28", 2878.54],["2012-10-28", 2916.82],["2012-11-28", 2955.11],["2012-12-28", 2993.39],
    ["2013-01-28", 3085.54],["2013-02-28", 3177.69],["2013-03-28", 3269.83],["2013-04-28", 3361.98],
    ["2013-05-28", 3454.13],["2013-06-28", 3546.27],["2013-07-28", 3638.42],["2013-08-28", 3730.56],
    ["2013-09-28", 3822.71],["2013-10-28", 3914.86],["2013-11-28", 4007.0],["2013-12-28", 4099.15],
    ["2014-01-28", 4165.42],["2014-02-28", 4231.69],["2014-03-28", 4297.96],["2014-04-28", 4364.23],
    ["2014-05-28", 4430.5],["2014-06-28", 4496.77],["2014-07-28", 4563.04],["2014-08-28", 4629.31],
    ["2014-09-28", 4695.58],["2014-10-28", 4761.85],["2014-11-28", 4828.12],["2014-12-28", 4894.39],
    ["2015-01-28", 4934.15],["2015-02-28", 4973.92],["2015-03-28", 5013.69],["2015-04-28", 5053.45],
    ["2015-05-28", 5093.22],["2015-06-28", 5132.99],["2015-07-28", 5172.75],["2015-08-28", 5212.52],
    ["2015-09-28", 5252.29],["2015-10-28", 5292.06],["2015-11-28", 5331.82],["2015-12-28", 5371.59],
    ["2016-01-28", 5404.13],["2016-02-28", 5436.68],["2016-03-28", 5469.22],["2016-04-28", 5501.76],
    ["2016-05-28", 5534.3],["2016-06-28", 5566.85],["2016-07-28", 5599.39],["2016-08-28", 5631.93],
    ["2016-09-28", 5664.48],["2016-10-28", 5697.02],["2016-11-28", 5729.56],["2016-12-28", 5762.1],
    ["2017-01-28", 5920.51],["2017-02-28", 6078.92],["2017-03-28", 6237.33],["2017-04-28", 6395.74],
    ["2017-05-28", 6554.15],["2017-06-28", 6712.56],["2017-07-28", 6870.97],["2017-08-28", 7029.38],
    ["2017-09-28", 7187.79],["2017-10-28", 7346.2],["2017-11-28", 7504.61],["2017-12-28", 7663.02],
    ["2018-01-28", 7662.58],["2018-02-28", 7662.13],["2018-03-28", 7661.68],["2018-04-28", 7661.23],
    ["2018-05-28", 7660.79],["2018-06-28", 7660.34],["2018-07-28", 7659.89],["2018-08-28", 7659.45],
    ["2018-09-28", 7659.0],["2018-10-28", 7658.55],["2018-11-28", 7658.1],["2018-12-28", 7657.66],
    ["2019-01-28", 7909.47],["2019-02-28", 8161.28],["2019-03-28", 8413.09],["2019-04-28", 8664.9],
    ["2019-05-28", 8916.7],["2019-06-28", 9168.51],["2019-07-28", 9420.32],["2019-08-28", 9672.13],
    ["2019-09-28", 9923.94],["2019-10-28", 10175.75],["2019-11-28", 10427.56],["2019-12-28", 10679.37],
    ["2020-01-28", 11114.38],["2020-02-28", 11549.38],["2020-03-28", 11984.39],["2020-04-28", 12419.4],
    ["2020-05-28", 12854.4],["2020-06-28", 13289.41],["2020-07-28", 13724.41],["2020-08-28", 14159.42],
    ["2020-09-28", 14594.43],["2020-10-28", 15029.43],["2020-11-28", 15464.44],["2020-12-28", 15899.45],
    ["2021-01-28", 16263.94],["2021-02-28", 16628.44],["2021-03-28", 16992.93],["2021-04-28", 17357.42],
    ["2021-05-28", 17721.92],["2021-06-28", 18086.41],["2021-07-28", 18450.91],["2021-08-28", 18815.4],
    ["2021-09-28", 19179.9],["2021-10-28", 19544.39],["2021-11-28", 19908.89],["2021-12-28", 20273.38],
    ["2022-01-28", 19726.34],["2022-02-28", 19179.3],["2022-03-28", 18632.25],["2022-04-28", 18085.21],
    ["2022-05-28", 17538.17],["2022-06-28", 16991.12],["2022-07-28", 16444.08],["2022-08-28", 15897.04],
    ["2022-09-28", 15349.99],["2022-10-28", 14802.95],["2022-11-28", 14255.91],["2022-12-28", 13708.86],
    ["2023-01-28", 14338.67],["2023-02-28", 14968.48],["2023-03-28", 15598.29],["2023-04-28", 16228.09],
    ["2023-05-28", 16857.9],["2023-06-28", 17487.71],["2023-07-28", 18117.52],["2023-08-28", 18747.33],
    ["2023-09-28", 19377.13],["2023-10-28", 20006.94],["2023-11-28", 20636.75],["2023-12-28", 21266.56],
    ["2024-01-28", 21720.24],["2024-02-28", 22173.93],["2024-03-28", 22627.62],["2024-04-28", 23081.3],
    ["2024-05-28", 23534.99],["2024-06-28", 23988.68],["2024-07-28", 24442.36],["2024-08-28", 24896.05],
    ["2024-09-28", 25349.74],["2024-10-28", 25803.42],["2024-11-28", 26257.11],["2024-12-28", 26710.8],
    ["2025-01-28", 27267.27],["2025-02-28", 27823.75],["2025-03-28", 28380.22],["2025-04-28", 28936.7],
    ["2025-05-28", 29493.17],["2025-06-28", 30049.65],["2025-07-28", 30606.12],["2025-08-28", 31162.59],
    ["2025-09-28", 31719.07],["2025-10-28", 32275.54],["2025-11-28", 32832.02],["2025-12-28", 33388.49],
    ["2026-01-28", 33465.29],["2026-02-28", 33542.08],["2026-03-28", 33618.88],["2026-04-28", 33695.67],
    ["2026-05-28", 33772.46]
  ];

  // ── Helpers: lookup price at a date for SP/NDQ; lookup BTC price at
  //   days-since-genesis. Same pattern as calculators-minis.js.
  function seriesPriceAt(arr, date){
    var target = new Date(date).getTime();
    var bestIdx = 0, bestDiff = Infinity;
    for (var i = 0; i < arr.length; i++) {
      var diff = Math.abs(new Date(arr[i][0]).getTime() - target);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
    return arr[bestIdx][1];
  }
  function btcPriceAtDays(days){
    // Find PL_DATA point with nearest x
    var best = PL_DATA[0], bestDiff = Math.abs(PL_DATA[0][0] - days);
    for (var i = 1; i < PL_DATA.length; i++) {
      var d = Math.abs(PL_DATA[i][0] - days);
      if (d < bestDiff) { bestDiff = d; best = PL_DATA[i]; }
    }
    return best[1];
  }
  function daysFromDate(date){
    return (new Date(date).getTime() / 1000 - GENESIS_TS) / 86400;
  }

  function buildChart() {
    // Build monthly time series — start at SP500_TR_DATA[0] date, end today
    var startDate = new Date(SP500_TR_DATA[0][0]);
    var endDate = new Date();
    var startBtc = btcPriceAtDays(daysFromDate(startDate));
    var startSp  = SP500_TR_DATA[0][1];
    var startNdq = NDQ_TR_DATA[0][1];
    var amount = 10000;

    var labels = [], btcWealth = [], spWealth = [], ndqWealth = [];
    var cur = new Date(startDate);
    while (cur < endDate) {
      var bp = btcPriceAtDays(daysFromDate(cur));
      var sp = seriesPriceAt(SP500_TR_DATA, cur);
      var np = seriesPriceAt(NDQ_TR_DATA, cur);
      labels.push(cur.toISOString().slice(0, 7));   // YYYY-MM
      btcWealth.push(amount * (bp / startBtc));
      spWealth.push(amount * (sp / startSp));
      ndqWealth.push(amount * (np / startNdq));
      cur.setMonth(cur.getMonth() + 1);
    }

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label: 'S&P 500 (total return)', data: spWealth,
            borderColor: 'rgba(180,170,140,0.85)', backgroundColor: 'transparent',
            borderWidth: 2, pointRadius: 0, tension: 0.2, order: 3 },
          { label: 'NASDAQ-100 (total return)', data: ndqWealth,
            borderColor: 'rgba(120,160,200,0.85)', backgroundColor: 'transparent',
            borderWidth: 2, pointRadius: 0, tension: 0.2, order: 2 },
          { label: 'Bitcoin', data: btcWealth,
            borderColor: 'rgba(247,147,26,0.95)', backgroundColor: 'rgba(247,147,26,0.06)',
            borderWidth: 2.5, pointRadius: 0, tension: 0.15, fill: true, order: 1 }
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
                var v = c.parsed.y;
                var formatted;
                if (v >= 1e9)      formatted = '$' + (v/1e9).toFixed(1) + 'B';
                else if (v >= 1e6) formatted = '$' + (v/1e6).toFixed(1) + 'M';
                else if (v >= 1e3) formatted = '$' + (v/1e3).toFixed(0) + 'K';
                else               formatted = '$' + Math.round(v).toLocaleString();
                return c.dataset.label + ': ' + formatted;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)',
              font: { size: 11, family: 'Inter, sans-serif' },
              maxRotation: 0,
              autoSkip: true, maxTicksLimit: 9,
              callback: function(v, idx){
                var label = this.getLabelForValue(idx);
                if (!label) return '';
                // Show year only — drop the -MM suffix
                return label.split('-')[0];
              }
            },
            border: { display: false }
          },
          y: {
            type: 'logarithmic', min: 5000,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)',
              font: { size: 11, family: 'Inter, sans-serif' },
              callback: function(v){
                var marks = [10000, 100000, 1000000, 10000000];
                if (marks.indexOf(v) === -1) return '';
                if (v >= 1e6) return '$' + (v/1e6) + 'M';
                return '$' + (v/1000) + 'K';
              }
            },
            title: { display: true, text: '$10K invested in 2010 grows to ...',
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
        var fb = document.querySelector('#section-bvsm .gallery-chart-fallback');
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
