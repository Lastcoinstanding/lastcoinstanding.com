// ═══════════════════════════════════════════════════════════════════
//  /the-gallery — live hero chart (Power Law channel)
//
//  Renders a simplified version of the channel chart from the
//  /the-power-law source page into the Gallery's live-hero card.
//  Uses the shared/power-law-data.js module (PL_DATA, PL_A, PL_B,
//  PL_FLOOR, PL_CEIL, plPrice, GENESIS_TS, TODAY_PRICE,
//  fetchTodayPrice) so the data source is the same as the four
//  Power Law chart pages — no fifth place to drift.
//
//  v1 scope: All-time view only, no range toggle yet (deferred —
//  see TECH_DEBT note in the commit). The CTA on the card opens
//  the full chart on its source page, which has the toggle.
//
//  Lazy init via IntersectionObserver: the chart only builds the
//  first time the card scrolls into view. This avoids the hidden-
//  canvas 0×0 resize-corruption that TECH_DEBT §6.14 documents
//  (charts that init inside zero-dimension containers render
//  stale; the ResizeObserver below additionally catches the case
//  where the container resizes after init, e.g. mobile rotation).
// ═══════════════════════════════════════════════════════════════════
(function(){
  var canvas = document.getElementById('galleryChannelChart');
  if (!canvas) return;
  if (typeof Chart === 'undefined') return;          // CDN failure — silently skip
  if (typeof PL_DATA === 'undefined') return;        // Shared module missing

  var chartInstance = null;
  var hasInited = false;

  // Build the Chart.js config — derived from the-power-law.js's
  // channelChart IIFE but stripped of band-toggle UI, status
  // callouts, and the range-toggle wiring. Logarithmic y axis,
  // log-of-days x axis transformed via Chart.js's built-in scale.
  function buildChart() {
    var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var minD = PL_DATA[0][0];
    var futureD = todayD + 365.25 * 3;  // project 3 years past today

    // Sample band lines every 30 days
    var trendLine = [], floorLine = [], upperLine = [];
    for (var d = minD; d <= futureD; d += 30) {
      var t = plPrice(d);
      trendLine.push({x: d, y: t});
      floorLine.push({x: d, y: t * PL_FLOOR});
      upperLine.push({x: d, y: t * PL_CEIL});
    }

    // Historical price series
    var historicalLine = PL_DATA.map(function(p){ return {x: p[0], y: p[1]}; });

    // Today marker
    var todayPrice = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
      ? TODAY_PRICE
      : PL_DATA[PL_DATA.length - 1][1];

    var amber = 'rgba(247,147,26,0.9)';
    var rust = 'rgba(176,69,37,0.65)';
    var gold = 'rgba(232,200,32,0.55)';
    var historyColor = 'rgba(232,224,210,0.7)';

    var ctx = canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Upper band',
            data: upperLine,
            borderColor: gold,
            borderWidth: 1.2,
            borderDash: [4, 3],
            fill: false,
            pointRadius: 0,
            tension: 0
          },
          {
            label: 'Trend',
            data: trendLine,
            borderColor: amber,
            borderWidth: 1.6,
            fill: false,
            pointRadius: 0,
            tension: 0
          },
          {
            label: 'Floor',
            data: floorLine,
            borderColor: rust,
            borderWidth: 1.2,
            borderDash: [4, 3],
            fill: false,
            pointRadius: 0,
            tension: 0
          },
          {
            label: 'Historical price',
            data: historicalLine,
            borderColor: historyColor,
            borderWidth: 1.4,
            fill: false,
            pointRadius: 0,
            tension: 0.1
          },
          {
            label: 'Today',
            data: [{x: todayD, y: todayPrice}],
            borderColor: 'rgba(247,147,26,1)',
            backgroundColor: 'rgba(247,147,26,1)',
            pointRadius: 4,
            pointHoverRadius: 5,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }   // disabled on the small gallery card; the source page has the rich tooltip
        },
        scales: {
          x: {
            type: 'logarithmic',
            min: minD,
            max: futureD,
            grid: { color: 'rgba(220,200,170,0.05)' },
            ticks: {
              color: 'rgba(220,200,170,0.35)',
              font: { size: 9, family: 'Inter, sans-serif' },
              callback: function(v){
                // Show year labels at key milestones
                var year = 2009 + Math.floor(v / 365.25);
                return [2012, 2016, 2020, 2024, 2028].indexOf(year) !== -1
                  ? String(year) : '';
              },
              autoSkip: false
            },
            border: { display: false }
          },
          y: {
            type: 'logarithmic',
            min: 0.05,
            max: 10000000,
            grid: { color: 'rgba(220,200,170,0.05)' },
            ticks: {
              color: 'rgba(220,200,170,0.35)',
              font: { size: 9, family: 'Inter, sans-serif' },
              callback: function(v){
                if (v === 1)        return '$1';
                if (v === 100)      return '$100';
                if (v === 10000)    return '$10K';
                if (v === 1000000)  return '$1M';
                return '';
              }
            },
            border: { display: false }
          }
        },
        layout: {
          padding: { top: 4, right: 6, bottom: 0, left: 0 }
        }
      }
    });
  }

  function init() {
    if (hasInited) return;
    hasInited = true;

    // Defer to next frame so the container has a real width
    requestAnimationFrame(function(){
      try {
        buildChart();

        // If TODAY_PRICE updates after the live fetch, refresh the Today marker
        if (typeof fetchTodayPrice === 'function') {
          fetchTodayPrice(function(price){
            if (!chartInstance || !chartInstance.data || !chartInstance.data.datasets) return;
            var todayDataset = chartInstance.data.datasets[4]; // 'Today' is index 4
            if (todayDataset && todayDataset.data && todayDataset.data[0]) {
              todayDataset.data[0].y = price;
              chartInstance.update('none');
            }
          });
        }
      } catch (err) {
        // Build failed — show the fallback "Loading..." text instead of a blank canvas
        var fallback = document.querySelector('.live-chart-fallback');
        if (fallback) {
          fallback.classList.add('show');
          var p = fallback.querySelector('.chart-loading');
          if (p) p.textContent = 'Chart unavailable — open the full version →';
        }
      }
    });
  }

  // Lazy-init via IntersectionObserver — only build the chart when
  // the card is at least 10% visible. This both saves CPU on first
  // paint and dodges the 0×0 hidden-container issue.
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
    // Older browsers — init immediately
    init();
  }

  // ResizeObserver: when the container resizes after init (orientation
  // change, panel collapse, etc.), tell Chart.js to redraw at the new
  // size. Per TECH_DEBT §6.14, Chart.js's internal resize doesn't
  // always catch this on its own when the container was 0×0 at init.
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function(){
      if (chartInstance) {
        try { chartInstance.resize(); } catch (e) {}
      }
    });
    ro.observe(canvas.parentElement);
  }
})();
