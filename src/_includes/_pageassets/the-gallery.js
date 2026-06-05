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

  // Build explicit year-aligned ticks (Jan 1 of each year) for the linear
  // x-axis. Without this, Chart.js's autoSkip picks evenly-spaced ticks
  // that don't land on year boundaries, producing duplicate year labels
  // when adjacent ticks fall in the same calendar year (e.g. on a ±2y
  // window: "2024 2025 2025 2027 2027 2028"). With explicit Jan-1 ticks
  // every year appears exactly once. For wider ranges, stride spaces the
  // ticks (every 2 years on >10y windows, every 5y on >20y).
  function buildYearTicks(xMin, xMax) {
    var startMs = (GENESIS_TS + xMin * 86400) * 1000;
    var endMs   = (GENESIS_TS + xMax * 86400) * 1000;
    var startYear = new Date(startMs).getUTCFullYear();
    var endYear   = new Date(endMs).getUTCFullYear();
    var span = endYear - startYear + 1;
    var stride = 1;
    if (span > 20) stride = 5;
    else if (span > 10) stride = 2;
    // Snap start to a multiple of stride so 2010/2015/2020/... pattern holds
    var firstYear = Math.ceil(startYear / stride) * stride;
    var ticks = [];
    for (var y = firstYear; y <= endYear; y += stride) {
      var jan1Days = (Date.UTC(y, 0, 1) / 1000 - GENESIS_TS) / 86400;
      if (jan1Days >= xMin && jan1Days <= xMax) {
        ticks.push({ value: jan1Days });
      }
    }
    return ticks;
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

    // Densify the gap between PL_DATA's last point and today with weekly
    // linear interpolation. Without this, Chart.js's 'index' tooltip mode
    // finds no historical data point at hover positions in the gap (only
    // the bands have points there) and silently omits Historical from
    // the tooltip — even though the line visually passes through. Both
    // the gap points and the today point at the end are mutated in
    // place by fetchTodayPrice when the live spot lands; see init().
    var lastPlX = PL_DATA[PL_DATA.length - 1][0];
    var lastPlY = PL_DATA[PL_DATA.length - 1][1];
    if (today > lastPlX + 7) {
      var gap = today - lastPlX;
      for (var gx = lastPlX + 7; gx < today; gx += 7) {
        var gt = (gx - lastPlX) / gap;
        var gy = lastPlY * (1 - gt) + todayPrice * gt;
        if (gx >= bounds.xMin - pad && gx <= bounds.xMax + pad) {
          historicalLine.push({x: gx, y: gy});
        }
      }
    }

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
            // Year-aligned tick override for linear views — see
            // buildYearTicks comment above for why this is needed.
            // No-op on the logarithmic all-time view, where the sparse
            // milestone filter in formatXTick handles label density.
            afterBuildTicks: bounds.xType === 'linear'
              ? function(axis){ axis.ticks = buildYearTicks(axis.min, axis.max); }
              : undefined,
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
        // Today marker on the chart (dataset index 4) AND every point in
        // the historical-line gap-fill (dataset index 3, points between
        // PL_DATA's last sample and today — see buildDatasets which
        // weekly-interpolates the gap so 'index' tooltip mode has a
        // historical value to show at every hover x).
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
              // Re-interpolate every point that lies in the gap between
              // PL_DATA's last sample and today, plus the trailing today
              // point itself.
              var lastPlX = PL_DATA[PL_DATA.length - 1][0];
              var lastPlY = PL_DATA[PL_DATA.length - 1][1];
              var todayX  = (Date.now() / 1000 - GENESIS_TS) / 86400;
              var gap = todayX - lastPlX;
              for (var i = 0; i < historyDs.data.length; i++) {
                var pt = historyDs.data[i];
                if (pt.x > lastPlX && pt.x <= todayX && gap > 0) {
                  var t = (pt.x - lastPlX) / gap;
                  pt.y = lastPlY * (1 - t) + price * t;
                }
              }
            }
            // update('resize') not 'none' — the historical line's last
            // point is mutated in place (data array ref unchanged), so
            // update('none') leaves its element pixel cached at the
            // seeded TODAY_PRICE while the Today dot (single-point
            // dataset) does relayout — producing the documented
            // "two visually distinct dots near the today marker"
            // symptom. STYLE_GUIDE §6.14 / TECH_DEBT (DR channel viz).
            chartInstance.update('resize');
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
  /* homeData: see shared/bvre-annual-data.js (loaded before this script). */
/* btcData: see shared/bvre-annual-data.js (loaded before this script). */
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
  /* homeData: see shared/bvre-annual-data.js (loaded before this script). */
/* btcData: see shared/bvre-annual-data.js (loaded before this script). */
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
  /* SP500_TR_DATA: see shared/tr-comparator-data.js (loaded before this script). */
  /* NDQ_TR_DATA: see shared/tr-comparator-data.js (loaded before this script). */
  // ── Bitcoin annual averages (mirrors bitcoin-vs-real-estate.js
  //   homeData/btcData duplication pattern). Used as the per-year
  //   bitcoin price for CAGR calculations 2013-2025. The 2026 value
  //   is live (TODAY_PRICE, updated by fetchTodayPrice when it lands).
  /* btcData alias removed — Chart 7 now uses canonical btcData from shared/bvre-annual-data.js. */
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
    return btcData[year];
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
      var s = buildSeries();   // recompute (btcData is unchanged; only
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
    var best = SP500_TR_DATA[0], bestDiff = Math.abs(new Date(SP500_TR_DATA[0][0]).getTime() - target);
    for (var i = 1; i < SP500_TR_DATA.length; i++) {
      var d = Math.abs(new Date(SP500_TR_DATA[i][0]).getTime() - target);
      if (d < bestDiff) { bestDiff = d; best = SP500_TR_DATA[i]; }
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
  /* BTC_MONTHLY: see shared/btc-monthly-data.js (loaded before this script). */
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
  /* SP500_TR_DATA: see shared/tr-comparator-data.js (loaded before this script). */
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
