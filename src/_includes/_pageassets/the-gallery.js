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
