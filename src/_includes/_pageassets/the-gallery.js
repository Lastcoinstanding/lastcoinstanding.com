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

    // "You are here" pulse halo — canonical lcs-pulse-halo from
    // STYLE_GUIDE §6.23. Positions #galleryChannelPulse at the today
    // point on each render so the CSS animation runs at the data
    // location. The pulse element is inside .gallery-chart-frame
    // (position: relative); we set left/top in canvas-relative pixel
    // coords from the chart's x/y scales.
    var lcsPulsePlugin = {
      id: 'lcsPulse',
      afterRender: function(c){
        var pulse = document.getElementById('galleryChannelPulse');
        if (!pulse || !c.scales || !c.scales.x || !c.scales.y) return;
        // Use the canvas's bounding-box position relative to the frame,
        // since the canvas may have padding around it inside the frame.
        var todayDays = (Date.now() / 1000 - GENESIS_TS) / 86400;
        var livePrice = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
          ? TODAY_PRICE : PL_DATA[PL_DATA.length - 1][1];
        // Pixel coordinates are relative to the canvas; offset by the
        // canvas's offsetLeft/offsetTop within the frame to align.
        var x = c.scales.x.getPixelForValue(todayDays);
        var y = c.scales.y.getPixelForValue(livePrice);
        // Hide if today's point would render outside the visible chart area
        if (x < c.chartArea.left  - 4 || x > c.chartArea.right  + 4 ||
            y < c.chartArea.top   - 4 || y > c.chartArea.bottom + 4) {
          pulse.classList.remove('is-visible');
          return;
        }
        pulse.style.left = (c.canvas.offsetLeft + x) + 'px';
        pulse.style.top  = (c.canvas.offsetTop  + y) + 'px';
        pulse.classList.add('is-visible');
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
      plugins: [todayLinePlugin, todayGlowPlugin, lcsPulsePlugin]
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


// ─── Chart 7: Rolling 4-Year CAGR — Bitcoin vs S&P 500 TR vs NDQ TR ──
//
// Line chart of compound annual growth rate over rolling four-year
// windows, ending each year from 2017 through 2026. Three series:
// bitcoin (using annual averages from btcData + today's live price
// for the 2026 endpoint), S&P 500 total return, and NASDAQ-100 total
// return. Replaces an earlier "$10K invested in 2010" lump-sum wealth
// chart (Commit C) that was structurally vulnerable to the same
// cherry-pick objection the rest of the site works to refute — picking
// the earliest possible start year inflates returns and implies they
// will repeat, contradicting the Power Law deceleration story this
// site spends Chart 2 establishing. Rolling-window CAGR dodges that:
// every reader-relevant 4-year period is shown, no single year is
// privileged, and the pattern that emerges (declining-but-still-
// materially-above-equity-comparators) is exactly what the Power Law
// model in Chart 2 projects on the prospective side.
//
// SP500_TR_DATA and NDQ_TR_DATA arrays inlined below, mirroring the
// same arrays in calculators-minis.js — accepted duplication per
// Commit A's strategy. Both arrays refresh monthly per MONTHLY_REFRESH_
// CHECKLIST; updates need to land in both files.
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

  // ── Bitcoin annual averages (mirrors bitcoin-vs-real-estate.js
  //   homeData/btcData duplication pattern). Used as the per-year
  //   bitcoin price for CAGR calculations 2013-2025. The 2026 value
  //   is live (TODAY_PRICE, updated by fetchTodayPrice when it lands).
  var BTC_ANNUAL = {
    2013: 732, 2014: 530, 2015: 272, 2016: 567, 2017: 4348, 2018: 7565,
    2019: 7362, 2020: 11072, 2021: 47458, 2022: 19657, 2023: 28233,
    2024: 62682, 2025: 88000
  };

  // ── Helpers
  function spYearEnd(year, isCurrent) {
    if (isCurrent) return SP500_TR_DATA[SP500_TR_DATA.length - 1][1];
    var key = year + '-12-28';
    for (var i = SP500_TR_DATA.length - 1; i >= 0; i--) {
      if (SP500_TR_DATA[i][0] === key) return SP500_TR_DATA[i][1];
    }
    return null;
  }
  function ndqYearEnd(year, isCurrent) {
    if (isCurrent) return NDQ_TR_DATA[NDQ_TR_DATA.length - 1][1];
    var key = year + '-12-28';
    for (var i = NDQ_TR_DATA.length - 1; i >= 0; i--) {
      if (NDQ_TR_DATA[i][0] === key) return NDQ_TR_DATA[i][1];
    }
    return null;
  }
  function btcYearEnd(year, isCurrent) {
    if (isCurrent) {
      return (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
        ? TODAY_PRICE : PL_DATA[PL_DATA.length - 1][1];
    }
    return BTC_ANNUAL[year];
  }

  function cagr(endVal, startVal, years) {
    if (!endVal || !startVal || years <= 0) return null;
    return (Math.pow(endVal / startVal, 1 / years) - 1) * 100;
  }

  function buildSeries() {
    // Rolling 4-year CAGR ending each year 2017-2026
    var thisYear = new Date().getFullYear();
    var endYears = [], btcSeries = [], spSeries = [], ndqSeries = [];
    for (var y = 2017; y <= 2026; y++) {
      var startY = y - 4;
      var isCurrentEnd = (y === thisYear);
      var bEnd = btcYearEnd(y, isCurrentEnd);
      var bStart = btcYearEnd(startY, false);
      var sEnd = spYearEnd(y, isCurrentEnd);
      var sStart = spYearEnd(startY, false);
      var nEnd = ndqYearEnd(y, isCurrentEnd);
      var nStart = ndqYearEnd(startY, false);
      endYears.push(y.toString());
      btcSeries.push(cagr(bEnd, bStart, 4));
      spSeries.push (cagr(sEnd, sStart, 4));
      ndqSeries.push(cagr(nEnd, nStart, 4));
    }
    return { endYears: endYears, btc: btcSeries, sp: spSeries, ndq: ndqSeries };
  }

  function buildChart() {
    var s = buildSeries();

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: s.endYears,
        datasets: [
          { label: 'Bitcoin', data: s.btc,
            borderColor: 'rgba(247,147,26,0.95)', backgroundColor: 'rgba(247,147,26,0.10)',
            borderWidth: 2.8, pointBackgroundColor: 'rgba(247,147,26,1)',
            pointRadius: 4, pointHoverRadius: 6, tension: 0.25, fill: true, order: 1 },
          { label: 'NASDAQ-100 (total return)', data: s.ndq,
            borderColor: 'rgba(120,160,200,0.85)', backgroundColor: 'transparent',
            borderWidth: 2, pointBackgroundColor: 'rgba(120,160,200,1)',
            pointRadius: 3, pointHoverRadius: 5, tension: 0.25, order: 2 },
          { label: 'S&P 500 (total return)', data: s.sp,
            borderColor: 'rgba(180,170,140,0.85)', backgroundColor: 'transparent',
            borderWidth: 2, pointBackgroundColor: 'rgba(180,170,140,1)',
            pointRadius: 3, pointHoverRadius: 5, tension: 0.25, order: 3 }
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
              title: function(items){
                if (!items.length) return '';
                var y = parseInt(items[0].label, 10);
                return (y - 4) + ' → ' + y + ' (4-year window)';
              },
              label: function(c){
                if (c.parsed.y == null) return c.dataset.label + ': —';
                return c.dataset.label + ': ' + c.parsed.y.toFixed(1) + '%';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: { color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' }, maxRotation: 0 },
            title: { display: true, text: 'End year of 4-year window',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false }
          },
          y: {
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: { color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' },
                     callback: function(v){ return v + '%'; } },
            title: { display: true, text: 'Annualized return over the window',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false },
            beginAtZero: true
          }
        },
        layout: { padding: { top: 4, right: 12, bottom: 0, left: 0 } }
      }
    });
  }

  // Live-fetch hook — when fetchTodayPrice resolves, recompute the
  // 2026 bitcoin endpoint and update that single point on the chart.
  // SP500/NDQ don't need updating since they use the latest data
  // point (which is static between monthly data refreshes).
  function wireLiveUpdate() {
    if (typeof fetchTodayPrice !== 'function') return;
    fetchTodayPrice(function(/* price, source */){
      if (!chartInstance || !chartInstance.data) return;
      var s = buildSeries();   // recompute (BTC_ANNUAL is unchanged; only
                               // the current-year endpoint reads TODAY_PRICE)
      chartInstance.data.datasets[0].data = s.btc;
      chartInstance.update('none');
    });
  }

  function init() {
    if (hasInited) return;
    hasInited = true;
    requestAnimationFrame(function(){
      try {
        buildChart();
        wireLiveUpdate();
      }
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


// ─── Chart 8: The Bitcoin Heatmap ──────────────────────────────────
//
// SVG-rendered grid of monthly entry × holding horizon, colored by
// BTC outperformance vs S&P 500 total return. Mirrors the visual
// pattern of /heatmap (the canonical deep-dive page) but simplified
// for the Gallery: static (no interactive cell-click → calculator),
// just the pattern itself.
//
// Color tiers and outperformance buckets match calculators-minis.js's
// renderMiniHeatmap exactly so the Gallery and the Calculators page
// produce visually-equivalent heatmaps for the same data.
//
// Not Chart.js — Chart.js's heatmap support is awkward and the cell
// grid here is pure rectangles, so a direct SVG render is cleaner
// and faster. Generates ~1400 <rect> elements (196 months × 7
// horizons) at init; static after that. Performance is fine; the SVG
// renders in <50ms.
//
// SP500_TR_DATA needed — duplicated inline (third copy in the file
// after Chart 7's and the source-of-truth elsewhere). Accepted as
// drift-risk per spec; refactor candidate for TECH_DEBT.
(function(){
  var host = document.getElementById('galleryHeatmap');
  if (!host) return;
  if (typeof PL_DATA === 'undefined') return;

  // Inlined SP500 TR data — same as Chart 7. Refresh monthly per
  // MONTHLY_REFRESH_CHECKLIST in both places.
  var SP500_TR = [
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

  // Color tiers per outperformance multiple — same as renderMiniHeatmap
  function tierFor(outperf) {
    if (outperf <= 0.5) return '#BE3A30';
    if (outperf <= 0.9) return '#6B2A23';
    if (outperf <= 1.1) return '#1F1F1F';
    if (outperf <= 2.0) return '#E0BC50';
    if (outperf <= 5.0) return '#F5C240';
    return '#F7931A';
  }

  // Log-linear interp BTC price at a given Date (via PL_DATA)
  function daysFromDate(d) { return (d.getTime() / 1000 - GENESIS_TS) / 86400; }
  function btcPriceAt(date) {
    var days = daysFromDate(date);
    if (days <= PL_DATA[0][0]) return PL_DATA[0][1];
    if (days >= PL_DATA[PL_DATA.length - 1][0]) return PL_DATA[PL_DATA.length - 1][1];
    for (var i = 0; i < PL_DATA.length - 1; i++) {
      if (PL_DATA[i][0] <= days && days <= PL_DATA[i+1][0]) {
        var t = (days - PL_DATA[i][0]) / (PL_DATA[i+1][0] - PL_DATA[i][0]);
        return PL_DATA[i][1] * Math.pow(PL_DATA[i+1][1] / PL_DATA[i][1], t);
      }
    }
    return PL_DATA[PL_DATA.length - 1][1];
  }
  function spPriceAt(date) {
    var target = date.getTime();
    var best = SP500_TR[0], bestDiff = Math.abs(new Date(SP500_TR[0][0]).getTime() - target);
    for (var i = 1; i < SP500_TR.length; i++) {
      var d = Math.abs(new Date(SP500_TR[i][0]).getTime() - target);
      if (d < bestDiff) { bestDiff = d; best = SP500_TR[i]; }
    }
    return best[1];
  }

  // currentView: 'period' (default, exit at startDate + horizon) or
  // 'hold-to-today' (exit at today for valid cells). The cell-VALIDITY
  // check is identical in both views — a cell is valid iff its NOMINAL
  // horizon end is <= today. So future cells stay the same gray
  // regardless of view. Only the outperformance numerator/denominator
  // change between modes. This matches the source-page /heatmap behavior
  // (bitcoin-vs-the-stock-market.js, viewBtn / holdToToday flag).
  var currentView = 'period';
  var hasRendered = false;

  function renderHeatmap() {
    if (!host.clientWidth) return;     // wait for layout
    hasRendered = true;

    // Layout — viewBox dimensions chosen for aspect ratio; renders
    // responsive via CSS width/height on the svg.
    var horizons = [12, 24, 36, 60, 84, 120];   // months
    var hLabels  = ['1y', '2y', '3y', '5y', '7y', '10y'];
    var startDates = [];
    var today = new Date();
    var d = new Date(Date.UTC(2011, 0, 15));
    while (d < today) { startDates.push(new Date(d)); d.setUTCMonth(d.getUTCMonth() + 1); }

    var nCols = startDates.length, nRows = horizons.length;

    // viewBox sized so cells render at ~5px × 36px
    var ml = 40, mt = 6, mr = 8, mb = 22;
    var vbW = ml + nCols * 5.6 + mr;
    var vbH = mt + nRows * 38 + mb;

    var cellW = (vbW - ml - mr) / nCols;
    var cellH = (vbH - mt - mb) / nRows;
    var gap = 0.5;

    var parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + vbW + ' ' + vbH + '" preserveAspectRatio="xMidYMid meet">'];

    // Precompute today's prices once (only used in hold-to-today mode)
    var todayBtc = btcPriceAt(today);
    var todaySp  = spPriceAt(today);

    // Cells
    for (var r = 0; r < nRows; r++) {
      var hMo = horizons[r];                    // row 0 = 1y (shortest at top)
      for (var c = 0; c < nCols; c++) {
        var sd = startDates[c];
        var ed = new Date(sd); ed.setUTCMonth(ed.getUTCMonth() + hMo);
        var x = ml + c * cellW, y = mt + r * cellH;
        var w = Math.max(cellW - gap, 0.5), h = Math.max(cellH - gap, 1);
        var color;
        if (ed > today) {
          color = '#1a1a1a';                     // future — nominal horizon end is in the future (same in both views)
        } else {
          var bs = btcPriceAt(sd), ss = spPriceAt(sd);
          var be, se;
          if (currentView === 'hold-to-today') {
            be = todayBtc; se = todaySp;        // hold beyond the cell's horizon, exit at today
          } else {
            be = btcPriceAt(ed); se = spPriceAt(ed);   // exit at start + horizon
          }
          var outperf = (be / bs) / (se / ss);
          color = tierFor(outperf);
        }
        parts.push('<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" fill="' + color + '"/>');
      }
    }

    // Y-axis horizon labels (left of grid)
    for (var i = 0; i < nRows; i++) {
      var ly = mt + i * cellH + cellH / 2 + 4;
      parts.push('<text x="' + (ml - 8) + '" y="' + ly.toFixed(2) + '" font-size="11" font-family="Inter, sans-serif" fill="rgba(220,200,170,0.55)" text-anchor="end">' + hLabels[i] + '</text>');
    }

    // X-axis year labels (decadal-ish anchors)
    var anchorYears = { 2011: 1, 2014: 1, 2017: 1, 2020: 1, 2023: 1, 2026: 1 };
    var lastYr = null;
    for (var col = 0; col < nCols; col++) {
      var yr = startDates[col].getUTCFullYear();
      if (yr !== lastYr && anchorYears[yr]) {
        var xx = ml + col * cellW + cellW / 2;
        parts.push('<text x="' + xx.toFixed(2) + '" y="' + (vbH - 6) + '" font-size="11" font-family="Inter, sans-serif" fill="rgba(220,200,170,0.55)" text-anchor="middle">' + yr + '</text>');
        lastYr = yr;
      }
    }

    parts.push('</svg>');
    host.innerHTML = parts.join('');
  }

  // Toggle buttons: scoped to the section so we don't collide with other
  // .range-toggle blocks on the page (Chart 1, Chart 4 also use them).
  var toggleScope = document.querySelector('#section-heatmap .range-toggle');
  if (toggleScope) {
    toggleScope.addEventListener('click', function(ev){
      var btn = ev.target.closest('.range-btn');
      if (!btn) return;
      var v = btn.getAttribute('data-view');
      if (!v || v === currentView) return;
      currentView = v;
      // Update active class + aria-selected on the two buttons
      toggleScope.querySelectorAll('.range-btn').forEach(function(b){
        var sel = b === btn;
        b.classList.toggle('active', sel);
        b.setAttribute('aria-selected', sel ? 'true' : 'false');
      });
      // Re-render with the new view (only if the heatmap has been
      // built once — otherwise the IntersectionObserver path will pick
      // up the latest currentView when it fires for the first time)
      if (hasRendered) renderHeatmap();
    });
  }

  // Lazy init via IntersectionObserver
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          renderHeatmap();
          io.disconnect();
        }
      });
    }, { threshold: 0.1, rootMargin: '50px' });
    io.observe(host);
  } else {
    renderHeatmap();
  }

  // SVG is responsive via viewBox + 100% width — no resize handler needed
})();


// ─── Chart 9: The Half-Life of a Dollar ───────────────────────────
//
// Exponential decay of $100 in purchasing power at 6.5%/yr (M2 monetary-
// base growth — the default inflation preset on /the-half-life). Custom
// fill area + curve via Chart.js with a 'fill: origin' style so the
// loss area below the curve shades to make the magnitude of decay
// visually heavy. Half-life year is dashed-line annotated.
(function(){
  var canvas = document.getElementById('galleryHalfLifeChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;

  var chartInstance = null;
  var hasInited = false;

  var INFLATION_RATE = 6.5;     // M2-growth default per modeling-assumptions.js
  var MAX_YEARS = 30;
  var halfLifeYr = Math.log(2) / Math.log(1 + INFLATION_RATE / 100);

  function buildChart() {
    // Build curve at 0.5-year resolution for smoothness
    var data = [];
    for (var yr = 0; yr <= MAX_YEARS; yr += 0.5) {
      var val = 100 / Math.pow(1 + INFLATION_RATE / 100, yr);
      data.push({ x: yr, y: val });
    }

    // Custom plugin: dashed lines at the half-life intersection point
    // ($50 horizontal + half-life year vertical), with labels.
    var halfLifePlugin = {
      id: 'halfLifeMarker',
      afterDatasetsDraw: function(chart){
        var xScale = chart.scales.x, yScale = chart.scales.y;
        var area = chart.chartArea;
        if (!xScale || !yScale || !area) return;
        var ctx = chart.ctx;
        var hlX = xScale.getPixelForValue(halfLifeYr);
        var fifty = yScale.getPixelForValue(50);

        ctx.save();
        // Horizontal $50 line (from y-axis to half-life x)
        ctx.strokeStyle = 'rgba(192,57,43,0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(area.left, fifty);
        ctx.lineTo(hlX, fifty);
        ctx.stroke();
        // Vertical half-life line (from x-axis up to $50)
        ctx.beginPath();
        ctx.moveTo(hlX, fifty);
        ctx.lineTo(hlX, area.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // "Half-life: ~Xy" label near the intersection
        ctx.fillStyle = 'rgba(192,57,43,0.85)';
        ctx.font = '600 11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Half-life: ' + halfLifeYr.toFixed(1) + ' years', hlX + 6, fifty - 6);
        ctx.restore();
      }
    };

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        datasets: [{
          label: 'Purchasing power of $100',
          data: data,
          parsing: false,
          borderColor: 'rgba(192,57,43,0.95)',
          backgroundColor: 'rgba(192,57,43,0.10)',
          borderWidth: 2.5,
          fill: 'origin',
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        parsing: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,12,8,0.95)', borderColor: 'rgba(192,57,43,0.30)',
            borderWidth: 1, titleColor: 'rgba(232,224,210,0.95)', bodyColor: 'rgba(220,200,170,0.85)',
            titleFont: { size: 11, family: 'Inter, sans-serif' },
            bodyFont:  { size: 11, family: 'Inter, sans-serif' },
            callbacks: {
              title: function(items){
                if (!items.length) return '';
                return 'Year ' + items[0].parsed.x.toFixed(1);
              },
              label: function(c){
                return '$' + c.parsed.y.toFixed(2) + ' of original $100';
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear', min: 0, max: MAX_YEARS,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)',
              font: { size: 11, family: 'Inter, sans-serif' },
              stepSize: 5,
              callback: function(v){ return v + 'y'; }
            },
            title: { display: true, text: 'Years from today',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false }
          },
          y: {
            min: 0, max: 100,
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: {
              color: 'rgba(220,200,170,0.45)',
              font: { size: 11, family: 'Inter, sans-serif' },
              stepSize: 25,
              callback: function(v){ return '$' + v; }
            },
            title: { display: true, text: 'Purchasing power of $100',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false }
          }
        },
        layout: { padding: { top: 12, right: 12, bottom: 0, left: 0 } }
      },
      plugins: [halfLifePlugin]
    });
  }

  function init() {
    if (hasInited) return;
    hasInited = true;
    requestAnimationFrame(function(){
      try { buildChart(); }
      catch (err) {
        var fb = document.querySelector('#section-half-life .gallery-chart-fallback');
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


// ─── Chart 10: CAGR Ranges by Horizon — Volatility Is Not Risk ────
//
// Floating-bar chart of rolling CAGR statistics (min, median, max)
// for bitcoin and the S&P 500 across holding horizons 1/2/3/4/5/10y.
// Bitcoin stats computed from inlined btcMonthly data (mirrors the
// /the-bitcoin-horizon page exactly). S&P 500 stats are reference
// values from long-run historical CAGR analyses (Schiller / NYU
// Stern data), same as the source page.
//
// Each asset renders as a translucent floating bar (representing the
// min→max range) plus a solid scatter point at the median. Range
// bars use Chart.js's data-as-pair feature ([min, max]).
(function(){
  var canvas = document.getElementById('galleryHorizonChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;

  // Bitcoin monthly close data — mirrors the-bitcoin-horizon.js's btcMonthly
  // array. Refresh monthly per MONTHLY_REFRESH_CHECKLIST in both places.
  var BTC_MONTHLY = [
    ["2011-01",0.30],["2011-02",0.95],["2011-03",0.70],["2011-04",1.75],["2011-05",8.40],["2011-06",15.50],["2011-07",13.20],["2011-08",8.20],["2011-09",5.10],["2011-10",3.20],["2011-11",2.55],["2011-12",4.25],
    ["2012-01",5.30],["2012-02",4.90],["2012-03",4.85],["2012-04",5.00],["2012-05",5.20],["2012-06",6.60],["2012-07",8.80],["2012-08",10.40],["2012-09",12.40],["2012-10",11.05],["2012-11",12.40],["2012-12",13.40],
    ["2013-01",20.35],["2013-02",33.50],["2013-03",93.50],["2013-04",138.00],["2013-05",128.50],["2013-06",98.80],["2013-07",104.50],["2013-08",129.00],["2013-09",127.50],["2013-10",196.00],["2013-11",1075.00],["2013-12",754.00],
    ["2014-01",842.00],["2014-02",567.00],["2014-03",475.00],["2014-04",446.00],["2014-05",627.00],["2014-06",639.00],["2014-07",587.00],["2014-08",478.00],["2014-09",387.00],["2014-10",338.00],["2014-11",378.00],["2014-12",320.00],
    ["2015-01",217.00],["2015-02",254.00],["2015-03",244.00],["2015-04",236.00],["2015-05",230.00],["2015-06",263.00],["2015-07",285.00],["2015-08",230.00],["2015-09",236.00],["2015-10",314.00],["2015-11",377.00],["2015-12",430.00],
    ["2016-01",378.00],["2016-02",437.00],["2016-03",416.00],["2016-04",448.00],["2016-05",531.00],["2016-06",673.00],["2016-07",624.00],["2016-08",575.00],["2016-09",610.00],["2016-10",700.00],["2016-11",742.00],["2016-12",964.00],
    ["2017-01",970.00],["2017-02",1190.00],["2017-03",1071.00],["2017-04",1348.00],["2017-05",2286.00],["2017-06",2480.00],["2017-07",2875.00],["2017-08",4700.00],["2017-09",4338.00],["2017-10",6460.00],["2017-11",10200.00],["2017-12",13800.00],
    ["2018-01",10220.00],["2018-02",10340.00],["2018-03",6928.00],["2018-04",9244.00],["2018-05",7490.00],["2018-06",6385.00],["2018-07",7735.00],["2018-08",7035.00],["2018-09",6626.00],["2018-10",6324.00],["2018-11",4017.00],["2018-12",3742.00],
    ["2019-01",3440.00],["2019-02",3817.00],["2019-03",4105.00],["2019-04",5325.00],["2019-05",8545.00],["2019-06",10817.00],["2019-07",10080.00],["2019-08",9630.00],["2019-09",8305.00],["2019-10",9202.00],["2019-11",7550.00],["2019-12",7195.00],
    ["2020-01",9349.00],["2020-02",8523.00],["2020-03",6421.00],["2020-04",8660.00],["2020-05",9453.00],["2020-06",9137.00],["2020-07",11350.00],["2020-08",11660.00],["2020-09",10777.00],["2020-10",13800.00],["2020-11",19700.00],["2020-12",28990.00],
    ["2021-01",33100.00],["2021-02",45140.00],["2021-03",58800.00],["2021-04",57760.00],["2021-05",37330.00],["2021-06",35040.00],["2021-07",41660.00],["2021-08",47150.00],["2021-09",43790.00],["2021-10",61300.00],["2021-11",57000.00],["2021-12",46300.00],
    ["2022-01",38470.00],["2022-02",43160.00],["2022-03",45540.00],["2022-04",37610.00],["2022-05",31780.00],["2022-06",19940.00],["2022-07",23290.00],["2022-08",20050.00],["2022-09",19430.00],["2022-10",20490.00],["2022-11",17160.00],["2022-12",16540.00],
    ["2023-01",23130.00],["2023-02",23140.00],["2023-03",28470.00],["2023-04",29230.00],["2023-05",27220.00],["2023-06",30470.00],["2023-07",29230.00],["2023-08",25930.00],["2023-09",26970.00],["2023-10",34630.00],["2023-11",37720.00],["2023-12",42265.00],
    ["2024-01",42580.00],["2024-02",61170.00],["2024-03",71330.00],["2024-04",60630.00],["2024-05",67490.00],["2024-06",62680.00],["2024-07",64620.00],["2024-08",58970.00],["2024-09",63330.00],["2024-10",70300.00],["2024-11",96450.00],["2024-12",93420.00],
    ["2025-01",102500.00],["2025-02",84320.00],["2025-03",82540.00],["2025-04",94700.00],["2025-05",104200.00],["2025-06",107800.00],["2025-07",115600.00],["2025-08",109400.00],["2025-09",113200.00],["2025-10",126080.00],["2025-11",91500.00],["2025-12",88200.00],
    ["2026-01",96100.00],["2026-02",88500.00],["2026-03",86400.00],["2026-04",84300.00],["2026-05",73800.00]
  ];

  // ────────────────────────────────────────────────────────────────
  // CONSERVATIVE-DATA WINDOW
  // ────────────────────────────────────────────────────────────────
  // The CAGR stats below are deliberately computed from 2015-01
  // onwards — explicitly leaving out the parabolic 2013 run (which
  // generated 1y bitcoin returns above 4000% annualized) and the
  // 2014 drawdown (-75% 1y). Those years are historically real but
  // unrepresentative of any plausible forward outcome; including
  // them in a "what range of returns could a holder see" chart
  // inflates the visual story in bitcoin's favor in a way the rest
  // of the site refuses to. The same 2015+ window is applied to the
  // S&P 500 comparison so the two sides are apples-to-apples on
  // time period (rather than 11-year BTC vs. multi-decade SP500).
  var STATS_START_KEY = '2015-01';

  // S&P 500 total-return monthly data — 3rd inline copy in this file
  // (also in Chart 7 IIFE and Chart 8 IIFE). Refactor to shared/tr-
  // comparator-data.js is overdue (now 5-6 copies site-wide); see
  // TECH_DEBT_26.md. Refresh monthly per MONTHLY_REFRESH_CHECKLIST.
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

  // Generic rolling-CAGR stats. Walks a [['YYYY-MM', price], …] series
  // from the conservative-window start key, building every rolling
  // `months`-month window, then returns {min, median, max}.
  function rollingCAGRStats(series, months, startKey) {
    var startIdx = 0;
    for (var i = 0; i < series.length; i++) {
      if (series[i][0] === startKey || series[i][0].slice(0, 7) === startKey) {
        startIdx = i; break;
      }
    }
    var cagrs = [];
    for (var i = startIdx; i + months < series.length; i++) {
      var p0 = series[i][1];
      var p1 = series[i + months][1];
      cagrs.push(Math.pow(p1 / p0, 12 / months) - 1);
    }
    if (!cagrs.length) return { min: null, median: null, max: null };
    cagrs.sort(function(a, b){ return a - b; });
    var n = cagrs.length;
    var median = (n % 2)
      ? cagrs[(n - 1) / 2]
      : (cagrs[n / 2 - 1] + cagrs[n / 2]) / 2;
    return { min: cagrs[0], median: median, max: cagrs[n - 1] };
  }

  function btcCAGRStats(months) { return rollingCAGRStats(BTC_MONTHLY, months, STATS_START_KEY); }
  function spCAGRStats (months) { return rollingCAGRStats(SP500_TR_DATA, months, STATS_START_KEY); }

  var chartInstance = null;
  var hasInited = false;

  function buildChart() {
    var periods = [12, 24, 36, 48, 60, 120];
    var labels  = ['1 yr', '2 yr', '3 yr', '4 yr', '5 yr', '10 yr'];
    var btcStats = periods.map(btcCAGRStats);
    var spStats  = periods.map(spCAGRStats);

    // Pct-format helpers (% on chart)
    function toPct(v) { return v == null ? null : v * 100; }

    // Custom plugin: dashed break-even line at y=0
    var zeroLinePlugin = {
      id: 'zeroLine',
      afterDatasetsDraw: function(chart){
        var yScale = chart.scales.y;
        var area = chart.chartArea;
        if (!yScale || !area) return;
        var y0 = yScale.getPixelForValue(0);
        if (y0 < area.top || y0 > area.bottom) return;
        var ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(232,224,210,0.40)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(area.left, y0);
        ctx.lineTo(area.right, y0);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(232,224,210,0.55)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('break-even', area.right - 4, y0 - 4);
        ctx.restore();
      }
    };

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Bitcoin (range)', data: btcStats.map(function(s){ return [toPct(s.min), toPct(s.max)]; }),
            backgroundColor: 'rgba(224,148,34,0.30)',
            borderColor: 'rgba(224,148,34,0.75)',
            borderWidth: 1,
            barPercentage: 0.4, categoryPercentage: 0.85, order: 2 },
          { label: 'Bitcoin (median)', type: 'scatter',
            data: btcStats.map(function(s, i){ return { x: labels[i], y: toPct(s.median) }; }),
            backgroundColor: '#e09422', borderColor: '#e09422',
            pointRadius: 6, pointHoverRadius: 7, pointStyle: 'circle', showLine: false, order: 0 },
          { label: 'S&P 500 (range)', data: spStats.map(function(s){ return [toPct(s.min), toPct(s.max)]; }),
            backgroundColor: 'rgba(180,170,140,0.18)',
            borderColor: 'rgba(180,170,140,0.55)',
            borderWidth: 1,
            barPercentage: 0.4, categoryPercentage: 0.85, order: 3 },
          { label: 'S&P 500 (median)', type: 'scatter',
            data: spStats.map(function(s, i){ return { x: labels[i], y: toPct(s.median) }; }),
            backgroundColor: 'rgba(200,190,170,0.95)', borderColor: 'rgba(200,190,170,0.95)',
            pointRadius: 5, pointHoverRadius: 6, pointStyle: 'circle', showLine: false, order: 1 }
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
                if (Array.isArray(c.raw)) {
                  return c.dataset.label + ': ' + c.raw[0].toFixed(1) + '% to ' + c.raw[1].toFixed(1) + '%';
                }
                var y = c.parsed.y;
                if (y == null) return c.dataset.label;
                return c.dataset.label + ': ' + y.toFixed(1) + '%';
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: { color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            title: { display: true, text: 'Holding horizon',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false }
          },
          y: {
            min: -60, max: 250,           // cap so the 1y/2y BTC bars clip
            grid: { color: 'rgba(220,200,170,0.04)' },
            ticks: { color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' },
                     stepSize: 50,
                     callback: function(v){ return v + '%'; } },
            title: { display: true, text: 'Annualized rolling return',
                     color: 'rgba(220,200,170,0.45)', font: { size: 11, family: 'Inter, sans-serif' } },
            border: { display: false }
          }
        },
        layout: { padding: { top: 4, right: 12, bottom: 0, left: 0 } }
      },
      plugins: [zeroLinePlugin]
    });
  }

  function init() {
    if (hasInited) return;
    hasInited = true;
    requestAnimationFrame(function(){
      try { buildChart(); }
      catch (err) {
        var fb = document.querySelector('#section-horizon .gallery-chart-fallback');
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
