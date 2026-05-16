/* ═══════════════════════════════════════════════════════════════
   BITCOIN VS. THE STOCK MARKET — calculators + charts

   Four interactive surfaces:
     §1 Power Law cautionary-tale viz (NEW — Path A step 2)
     §2 Lump-sum calculator at cyclical-top presets
     §3 Weekly DCA calculator
     §4 Forward projection (Power Law vs comparator CAGRs)

   §2-4 will be restructured in Path A step 3 — §2 and §3 merge into
   a unified Lump-sum/DCA calculator with a mode toggle. §4 keeps its
   current dual-line BTC projection shape and drops gold.

   Bitcoin price data: site-wide PL_DATA (loaded via shared module).
   Comparator data: embedded monthly closes built from documented
   annual returns with linear interpolation. Approximate for
   prototype use; NotebookLM-verified daily series will refine.
   ═══════════════════════════════════════════════════════════════ */


/* ═══════ §1 — Power Law cautionary-tale viz ═══════
   Plots BTC price (PL_DATA monthly samples + a current point) on a
   log Y axis against the Power Law trend across 2010-today, with
   annotated markers at each cyclical top, each cyclical floor, and
   today's position. The viz makes the page's lead editorial argument
   visible at a glance: top multiples have compressed from 12× over
   trend in 2013 to barely 1.1× in 2024-2025 (the maturation thesis),
   floors have stayed in a tight 0.41-0.66× band across four cycles,
   and today's 0.59× position sits squarely inside the historical
   floor range.

   Pattern follows the Power Law page's Channel chart: scatter type,
   linear X (days-since-genesis with year-formatted ticks), log Y,
   custom afterDatasetsDraw plugin to render the annotation markers
   and labels on top of the line datasets.

   All annotation positions and multiples computed against canonical
   coefficients PL_A=1.6e-17, PL_B=5.77 (Mežinskis/Porkopolis), and
   the May 14, 2026 site-wide reference price of $81,741. */

(function() {
  if (typeof PL_DATA === 'undefined' || typeof Chart === 'undefined') return;

  // May 14, 2026 reference (matches the site-wide today price)
  var TODAY_DAYS = 6340;
  var TODAY_PRICE = 81741;

  // Build BTC price series: PL_DATA samples + an appended today point so
  // the historical line extends to the present and the today marker sits
  // on a real data point rather than floating off the line's end.
  var historicalLine = PL_DATA.map(function(p) { return { x: p[0], y: p[1] }; });
  historicalLine.push({ x: TODAY_DAYS, y: TODAY_PRICE });

  // Sample the trend every 30 days for a smooth dashed curve
  var trendLine = [];
  var floorLine = [];
  var ceilingLine = [];
  for (var d = PL_DATA[0][0]; d <= TODAY_DAYS; d += 30) {
    var trendY = plPrice(d);
    trendLine.push({ x: d, y: trendY });
    // Bands: 0.42× floor + 3× ceiling, matching the Power Law page's
    // canonical band coefficients. These give the chart its 'corridor'
    // visualization — peaks register as breaks above the ceiling,
    // floors as approaches to the floor band. Per JM screenshot review:
    // the maturation story is clearer when readers can see that the
    // 2024 March + 2025 ATH tops at 1.12-1.14× are INSIDE the band
    // (no longer breaking above ceiling) while 2013/2017/2021 tops
    // broke ABOVE it, sometimes dramatically (12.13× in 2013).
    floorLine.push({   x: d, y: trendY * 0.42 });
    ceilingLine.push({ x: d, y: trendY * 3.0  });
  }

  // Cyclical-top markers: days_since_genesis, market price, trend multiple, year label.
  // Multiples computed: market_price / plPrice(days). See computeDeviations.py history.
  var TOPS = [
    { d: 1792, p: 1147,    m: 12.13, lbl: '2013'     },
    { d: 3270, p: 19500,   m:  6.41, lbl: '2017'     },
    { d: 4694, p: 69000,   m:  2.82, lbl: '2021'     },
    { d: 5549, p: 73000,   m:  1.14, lbl: '2024 Mar' },
    { d: 6121, p: 126200,  m:  1.12, lbl: '2025 ATH' }
  ];

  // Cyclical-floor markers (canonical post-top lows + 2024 mid-cycle dip)
  var FLOORS = [
    { d: 2203, p: 172,     m: 0.55, lbl: '2015'     },
    { d: 3633, p: 3200,    m: 0.57, lbl: '2018'     },
    { d: 5070, p: 15500,   m: 0.41, lbl: '2022'     },
    { d: 5693, p: 49000,   m: 0.66, lbl: '2024 Aug' }
  ];

  var TODAY_MARKER = { d: TODAY_DAYS, p: TODAY_PRICE, m: 0.59 };

  // Palette — matches the Power Law page Channel chart conventions where
  // applicable, with new top/floor accent colors for the deviation markers.
  var amberDash    = 'rgba(247,147,26,0.85)';
  var topColor     = '#d4533a';   // muted rust — for above-trend markers
  var floorColor   = '#5a9d7d';   // muted sage — for below-trend markers
  var todayColor   = '#f7931a';   // bright amber — for the today highlight
  var historyColor = 'rgba(232,224,210,0.85)';
  var muted        = 'rgba(170,170,170,0.7)';

  // Custom plugin: draws all annotation markers + labels above the line layers.
  // Markers use the chart's actual scales via getPixelForValue, so positions
  // stay correct under resize and zoom.
  var markersPlugin = {
    id: 'bvsmPlMarkers',
    afterDatasetsDraw: function(chart) {
      var ctx = chart.ctx;
      var xs = chart.scales.x;
      var ys = chart.scales.y;

      function drawMarker(item, color, labelAbove) {
        var x = xs.getPixelForValue(item.d);
        var y = ys.getPixelForValue(item.p);
        // Skip markers that fall outside the visible chart area (when zoomed
        // to the recent-cycle range, the older markers are clipped out).
        // Small tolerance so a marker exactly at the edge still renders.
        if (x < chart.chartArea.left - 4 || x > chart.chartArea.right + 4) return;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
        // Multiple label (primary, in marker color)
        ctx.font = '600 10.5px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        var primaryY = labelAbove ? y - 10 : y + 16;
        ctx.fillText(item.m.toFixed(2) + '\u00d7', x, primaryY);
        // Year sub-label (muted, smaller)
        ctx.font = '500 9px Inter, sans-serif';
        ctx.fillStyle = muted;
        var subY = labelAbove ? y - 22 : y + 28;
        ctx.fillText(item.lbl, x, subY);
      }

      // Order: floors first (background), tops second, today last (foreground)
      FLOORS.forEach(function(m) { drawMarker(m, floorColor, false); });
      TOPS.forEach(function(m)   { drawMarker(m, topColor,   true);  });

      // Today marker — larger, with concentric rings and a distinct label
      var tx = xs.getPixelForValue(TODAY_MARKER.d);
      var ty = ys.getPixelForValue(TODAY_MARKER.p);
      // Outer halo
      ctx.beginPath();
      ctx.arc(tx, ty, 11, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(247,147,26,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Mid ring
      ctx.beginPath();
      ctx.arc(tx, ty, 7, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(247,147,26,0.75)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Core dot
      ctx.beginPath();
      ctx.arc(tx, ty, 4, 0, 2 * Math.PI);
      ctx.fillStyle = todayColor;
      ctx.fill();
      // Label — anchored to the left of the dot since today is near the
      // right edge of the chart area; offset by 16px to clear the rings
      ctx.font = '700 11px Inter, sans-serif';
      ctx.fillStyle = todayColor;
      ctx.textAlign = 'right';
      ctx.fillText('You are here', tx - 16, ty - 2);
      ctx.font = '500 10px Inter, sans-serif';
      ctx.fillStyle = muted;
      ctx.fillText('0.59\u00d7 trend', tx - 16, ty + 12);
    }
  };

  function initPowerLawViz() {
    var canvas = document.getElementById('bvsmPowerLawChart');
    if (!canvas) return;

    var plChart = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'Ceiling (3× trend)',
            data: ceilingLine,
            borderColor: 'rgba(212,83,58,0.55)',
            borderWidth: 1.1,
            borderDash: [3, 5],
            pointRadius: 0,
            showLine: true,
            tension: 0,
            order: 4
          },
          {
            label: 'Floor (0.42× trend)',
            data: floorLine,
            borderColor: 'rgba(90,157,125,0.55)',
            borderWidth: 1.1,
            borderDash: [3, 5],
            pointRadius: 0,
            showLine: true,
            tension: 0,
            order: 3
          },
          {
            label: 'Power Law trend',
            data: trendLine,
            borderColor: amberDash,
            borderWidth: 1.6,
            borderDash: [6, 4],
            pointRadius: 0,
            showLine: true,
            tension: 0,
            order: 2
          },
          {
            label: 'Bitcoin price',
            data: historicalLine,
            borderColor: historyColor,
            borderWidth: 1.5,
            pointRadius: 0,
            showLine: true,
            tension: 0.15,
            fill: false,
            order: 1
          }
        ]
      },
      plugins: [markersPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        // Top padding for above-trend top labels; right padding for today label
        layout: { padding: { top: 28, right: 12, bottom: 8, left: 8 } },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              padding: 12,
              color: 'rgba(180,180,180,0.85)',
              font: { size: 11, family: 'Inter, sans-serif' },
              boxWidth: 28,
              boxHeight: 2
            }
          },
          tooltip: {
            backgroundColor: 'rgba(10,9,8,0.95)',
            borderColor: 'rgba(247,147,26,0.6)',
            borderWidth: 1,
            titleColor: '#e09422',
            bodyColor: '#ddd',
            callbacks: {
              title: function(items) {
                if (!items.length) return '';
                var d = items[0].parsed.x;
                var date = new Date(GENESIS_TS * 1000 + d * 86400 * 1000);
                return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
              },
              label: function(item) {
                var v = item.parsed.y;
                var fmt;
                if (v >= 1000) fmt = '$' + (v / 1000).toFixed(1) + 'K';
                else if (v >= 1) fmt = '$' + v.toFixed(2);
                else fmt = '$' + v.toFixed(4);
                return item.dataset.label + ': ' + fmt;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: muted,
              maxTicksLimit: 9,
              font: { size: 10, family: 'Inter, sans-serif' },
              callback: function(v) {
                var date = new Date(GENESIS_TS * 1000 + v * 86400 * 1000);
                return date.getFullYear();
              }
            }
          },
          y: {
            type: 'logarithmic',
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: muted,
              font: { size: 10, family: 'Inter, sans-serif' },
              callback: function(v) {
                if (v === 1 || v === 10 || v === 100 || v === 1000 ||
                    v === 10000 || v === 100000 || v === 1000000) {
                  if (v >= 1000) return '$' + (v / 1000) + 'K';
                  return '$' + v;
                }
                return '';
              }
            }
          }
        }
      }
    });

    // ─── Time-range toggle: All time / Recent 2y ───
    // When 'Recent' is active, zoom the X-axis to roughly the last 2.5 years
    // (TODAY_DAYS − 900 ≈ Dec 2023), which captures the four most recent
    // markers (2024 Mar top, 2024 Aug floor, 2025 ATH, today). The Y-axis
    // is left to auto-scale so the floor/ceiling bands stay in view.
    document.querySelectorAll('.bvsm-pl-range').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.bvsm-pl-range').forEach(function(b){
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        var range = btn.getAttribute('data-range');
        if (range === 'recent') {
          plChart.options.scales.x.min = TODAY_DAYS - 900;
          plChart.options.scales.x.max = TODAY_DAYS + 60;
          // Bump the X-axis tick density up in the zoomed view so the
          // year labels along the X don't collapse to just 2 values
          plChart.options.scales.x.ticks.maxTicksLimit = 5;
        } else {
          plChart.options.scales.x.min = undefined;
          plChart.options.scales.x.max = undefined;
          plChart.options.scales.x.ticks.maxTicksLimit = 9;
        }
        plChart.update();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPowerLawViz);
  } else {
    initPowerLawViz();
  }
})();


/* ═══════ §2-4 calculators + projection (existing surfaces) ═══════ */

(function(){
  'use strict';

  /* ───────────── Embedded comparator data ───────────── */
  /* Built from documented annual total-return figures (Damodaran NYU
     Stern, Slickcharts, World Gold Council) with linear interpolation
     between year-ends. Each entry is [iso-date, value-USD].          */

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

  /* ───────────── Helper functions ───────────── */

  // Power Law BTC price at day d from genesis (PL_A, PL_B from shared module)
  function plBtcPrice(d) {
    if (typeof PL_A !== 'undefined' && typeof PL_B !== 'undefined') {
      return PL_A * Math.pow(d, PL_B);
    }
    return 1.6e-17 * Math.pow(d, 5.77);
  }

  // Days since bitcoin genesis (Jan 3, 2009)
  var GENESIS_TS = 1230940800;
  function daysSinceGenesisFromDate(d) {
    return (d.getTime() / 1000 - GENESIS_TS) / 86400;
  }

  // Get BTC price closest to a given date string (yyyy-mm-dd) from PL_DATA
  function btcPriceOnDate(dateStr) {
    if (typeof PL_DATA === 'undefined' || !PL_DATA.length) {
      // Fallback to Power Law trend
      var d = daysSinceGenesisFromDate(new Date(dateStr));
      return plBtcPrice(d);
    }
    var targetDays = daysSinceGenesisFromDate(new Date(dateStr));
    var closest = PL_DATA[0];
    var minDiff = Math.abs(PL_DATA[0][0] - targetDays);
    for (var i = 1; i < PL_DATA.length; i++) {
      var diff = Math.abs(PL_DATA[i][0] - targetDays);
      if (diff < minDiff) { minDiff = diff; closest = PL_DATA[i]; }
    }
    return closest[1];
  }

  // Find comparator value at a given date (using closest monthly entry)
  function valueOnDate(series, dateStr) {
    var target = new Date(dateStr).getTime();
    var closest = series[0];
    var minDiff = Math.abs(new Date(series[0][0]).getTime() - target);
    for (var i = 1; i < series.length; i++) {
      var diff = Math.abs(new Date(series[i][0]).getTime() - target);
      if (diff < minDiff) { minDiff = diff; closest = series[i]; }
    }
    return closest[1];
  }

  // Map slider index (0-195) to a date string. Index 0 = 2010-01-28, index 195 = 2026-05-28.
  function sliderIndexToDate(idx) {
    return SP500_TR_DATA[Math.max(0, Math.min(idx, SP500_TR_DATA.length - 1))][0];
  }

  // Pretty-format date string yyyy-mm-dd → 'Mon dd, yyyy'
  function fmtDate(isoStr) {
    var d = new Date(isoStr);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  // Format USD with $ prefix and commas / abbreviations
  function fmtUsd(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    var abs = Math.abs(v);
    if (abs >= 1e9) return '$' + (v/1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return '$' + (v/1e6).toFixed(2) + 'M';
    if (abs >= 1e3) return '$' + Math.round(v).toLocaleString();
    return '$' + v.toFixed(0);
  }

  function fmtMultiple(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return v.toFixed(2) + '×';
  }

  // Format date back to ISO for the most-recent comparator entry
  function todayISO() {
    return SP500_TR_DATA[SP500_TR_DATA.length - 1][0];
  }

  /* ───────────── §2: Unified calculator (Lump sum / Weekly DCA) ───────────── */
  /* Replaces the previous separate LSI + DCA functions per Path A step 3.
     A single calcMode state ('lump' or 'dca') drives the math branch in
     recomputeCalc(); setMode() handles the UI labels, slider range, and
     active-state classes on the mode toggle. Result cards, chart canvas,
     verdict, and start-date slider are SHARED across both modes — only
     the amount slider's range (1000-100000 step 1000 for lump vs 10-1000
     step 10 for DCA) and the labels switch. Chart instance is destroyed
     and recreated on each recompute since the dataset shapes differ. */

  var calcChart = null;
  var calcMode = 'lump';

  var SLIDER_RANGES = {
    lump:    { min: 1000, max: 100000, step: 1000, value: 10000 },
    dca:     { min: 10,   max: 1000,   step: 10,   value: 100   },
    horizon: { min: 1000, max: 100000, step: 1000, value: 10000 }
  };

  // Per-mode labels — applied by setMode() so the UI re-skins on toggle.
  var MODE_LABELS = {
    lump: {
      heading:      'Lump sum at the cyclical top',
      presetsLabel: 'Bought at:',
      amountLabel:  'Lump-sum amount',
      amountTip:    'The hypothetical dollar amount invested as a single lump sum on the start date. The calculation tracks what that amount would have become in each asset class through today.',
      btcSub:       'Value today',
      spSub:        'Value today (total return)',
      ndqSub:       'Value today (total return)',
      chartLabel:   'Wealth-over-time — lump sum invested at the chosen start date',
      chartCaption: 'Log-scale Y-axis. All three series start at the same dollar amount on the start date and track their respective asset\'s value through today.'
    },
    dca: {
      heading:      'Weekly DCA from the chosen start date',
      presetsLabel: 'DCA started:',
      amountLabel:  'Weekly amount',
      amountTip:    'The dollar amount bought each week. For modelling simplicity the simulation aggregates by month: weekly buys are converted to monthly buys at month-end-close prices.',
      btcSub:       'Portfolio value today',
      spSub:        'Portfolio value today (TR)',
      ndqSub:       'Portfolio value today (TR)',
      chartLabel:   'Portfolio value over time — weekly DCA from the chosen start date',
      chartCaption: 'Log-scale Y-axis. The dashed line shows cumulative dollars invested as a reference; the solid lines show the portfolio value of each asset over time.'
    },
    horizon: {
      heading:      'Lump sum held for the chosen horizon',
      presetsLabel: 'Bought at:',
      amountLabel:  'Lump-sum amount',
      amountTip:    'The hypothetical dollar amount invested as a single lump sum on the start date. The calculation tracks what that amount would be worth at the chosen horizon — historical outcome where the horizon falls within real data, projected forward from today where it extends past today.',
      btcSub:       'Value at horizon',
      spSub:        'Value at horizon (TR)',
      ndqSub:       'Value at horizon (TR)',
      chartLabel:   'Wealth-over-time across the horizon — historical (solid) + projected forward from today (dashed)',
      chartCaption: 'Log-scale Y-axis. Solid line segments are historical. Dashed segments are projected forward from today using the Power Law trend for bitcoin and the long-run historical CAGRs (10.9% S&P 500, 16.3% NASDAQ-100) for the equity comparators.'
    }
  };

  function setMode(newMode, opts) {
    opts = opts || {};
    calcMode = newMode;

    // Toggle button active states
    document.querySelectorAll('.bvsm-mode').forEach(function(btn) {
      var active = btn.getAttribute('data-mode') === newMode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    // Toggle is-horizon-mode class on the calc container so the CSS
    // can reveal the horizon slider row only when this mode is active
    var calcEl = document.getElementById('bvsmCalc');
    if (calcEl) calcEl.classList.toggle('is-horizon-mode', newMode === 'horizon');

    var L = MODE_LABELS[newMode];

    // Update text-only labels
    var setText = function(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setText('bvsmCalcHeading',  L.heading);
    setText('bvsmPresetsLabel', L.presetsLabel);
    setText('bvsmBtcSublabel',  L.btcSub);
    setText('bvsmSpSublabel',   L.spSub);
    setText('bvsmNdqSublabel',  L.ndqSub);
    setText('bvsmChartLabel',   L.chartLabel);
    setText('bvsmChartCaption', L.chartCaption);

    // Amount label — preserve the nested help-tip span, update only the
    // leading text node and the tip-content text
    var amountLabelEl = document.getElementById('bvsmAmountLabel');
    if (amountLabelEl && amountLabelEl.firstChild) {
      amountLabelEl.firstChild.nodeValue = L.amountLabel;
    }
    var amountTipEl = document.getElementById('bvsmAmountTip');
    if (amountTipEl) amountTipEl.textContent = L.amountTip;

    // Amount slider range + reset to mode default (preserves user's start-
    // date selection but resets amount, since the units differ between modes)
    var amountEl = document.getElementById('bvsmAmount');
    var range = SLIDER_RANGES[newMode];
    if (amountEl && !opts.skipSliderReset) {
      amountEl.min  = range.min;
      amountEl.max  = range.max;
      amountEl.step = range.step;
      amountEl.value = range.value;
    }

    recomputeCalc();
  }

  function recomputeCalc() {
    var startEl  = document.getElementById('bvsmStartDate');
    var amountEl = document.getElementById('bvsmAmount');
    if (!startEl || !amountEl) return;

    var startDate = sliderIndexToDate(parseInt(startEl.value, 10));
    var amount = parseFloat(amountEl.value);

    document.getElementById('bvsmStartDateVal').textContent = fmtDate(startDate);
    document.getElementById('bvsmAmountVal').textContent = fmtUsd(amount);

    if (calcMode === 'lump') {
      computeLumpResults(startDate, amount);
    } else if (calcMode === 'dca') {
      computeDcaResults(startDate, amount);
    } else if (calcMode === 'horizon') {
      var horizonEl = document.getElementById('bvsmHorizon');
      var horizonYears = horizonEl ? parseInt(horizonEl.value, 10) : 10;
      document.getElementById('bvsmHorizonVal').textContent = horizonYears + ' year' + (horizonYears === 1 ? '' : 's');
      computeHorizonResults(startDate, amount, horizonYears);
    }
  }

  function rowHtml(label, value) {
    return '<div class="row"><span class="row-label">' + label + '</span><span class="row-val">' + value + '</span></div>';
  }

  function findStartIdx(startDate) {
    for (var i = 0; i < SP500_TR_DATA.length; i++) {
      if (SP500_TR_DATA[i][0] === startDate) return i;
    }
    // Nearest by absolute date diff
    var target = new Date(startDate).getTime();
    var minDiff = Infinity, bestIdx = -1;
    for (var j = 0; j < SP500_TR_DATA.length; j++) {
      var diff = Math.abs(new Date(SP500_TR_DATA[j][0]).getTime() - target);
      if (diff < minDiff) { minDiff = diff; bestIdx = j; }
    }
    return bestIdx;
  }

  function computeLumpResults(startDate, amount) {
    var btc0 = btcPriceOnDate(startDate);
    var sp0  = valueOnDate(SP500_TR_DATA, startDate);
    var ndq0 = valueOnDate(NDQ_TR_DATA,  startDate);

    var today = todayISO();
    var btc1 = btcPriceOnDate(today);
    var sp1  = valueOnDate(SP500_TR_DATA, today);
    var ndq1 = valueOnDate(NDQ_TR_DATA,  today);

    var btcValue = amount * (btc1 / btc0);
    var spValue  = amount * (sp1  / sp0);
    var ndqValue = amount * (ndq1 / ndq0);

    var years   = (new Date(today) - new Date(startDate)) / (365.25 * 86400000);
    var btcCagr = Math.pow(btcValue / amount, 1 / years) - 1;
    var spCagr  = Math.pow(spValue  / amount, 1 / years) - 1;
    var ndqCagr = Math.pow(ndqValue / amount, 1 / years) - 1;

    document.getElementById('bvsmBtcValue').textContent = fmtUsd(btcValue);
    document.getElementById('bvsmSpValue').textContent  = fmtUsd(spValue);
    document.getElementById('bvsmNdqValue').textContent = fmtUsd(ndqValue);

    document.getElementById('bvsmBtcRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(btcValue / amount)) +
      rowHtml('CAGR', (btcCagr * 100).toFixed(1) + '%');
    document.getElementById('bvsmSpRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(spValue / amount)) +
      rowHtml('CAGR', (spCagr * 100).toFixed(1) + '%');
    document.getElementById('bvsmNdqRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(ndqValue / amount)) +
      rowHtml('CAGR', (ndqCagr * 100).toFixed(1) + '%');

    // Verdict — restructured per JM screenshot feedback: the original
    // text was too binary (won/lost), which forced mental gymnastics
    // when the 2021/2024/2025 presets came back roughly even or
    // underwater. The new logic frames each result honestly while
    // pointing the reader to the longer-horizon presets where the
    // page's argument has fully played out. The default preset
    // (2013 top, ~12y) is in the 'btcWon at long horizon' branch
    // so the first impression on page load is the strong win case.
    var btcVsSp = btcValue / spValue;
    var btcWon = btcValue > spValue && btcValue > ndqValue;
    var verdictText;
    if (years < 1) {
      // Very recent top (2025 ATH at ~7mo): pre-argument horizon
      verdictText = '<strong>Less than a year of history.</strong> Bitcoin is currently at ' + fmtMultiple(btcVsSp) + ' the S&amp;P 500 position (' + fmtUsd(btcValue) + ' vs. ' + fmtUsd(spValue) + '). This is well below the 5-to-10-year horizon the page&rsquo;s argument depends on. <strong>The 2017 top preset (~8y) and 2013 top preset (~12y) show what the same scenario looks like once that horizon is reached</strong> &mdash; both show bitcoin pulling decisively ahead.';
    } else if (years < 3) {
      // Short horizon (2024 Mar at ~2y): too early to draw the conclusion
      verdictText = 'After <strong>' + years.toFixed(1) + ' years</strong> from ' + fmtDate(startDate) + ', the bitcoin position is at <strong>' + fmtMultiple(btcVsSp) + ' the S&amp;P 500 position</strong> (' + fmtUsd(btcValue) + ' vs. ' + fmtUsd(spValue) + '). Still a short horizon by the page&rsquo;s argument. <strong>Try the 2017 (~8y) or 2013 (~12y) presets to see the pattern after the long-horizon argument has had time to play out.</strong>';
    } else if (btcWon) {
      // Long horizon, BTC dominates (2013 + 2017 cases): the strong-argument message
      verdictText = 'Over <strong>' + years.toFixed(1) + ' years</strong> from ' + fmtDate(startDate) + ' to today, the bitcoin position is worth <strong>' + fmtMultiple(btcVsSp) + ' the S&amp;P 500 position</strong>, despite starting at a cyclical top. Holding through the drawdowns paid off.';
    } else {
      // Medium horizon, BTC roughly even (2021 case at ~4.5y): honest framing
      verdictText = 'Over <strong>' + years.toFixed(1) + ' years</strong> from ' + fmtDate(startDate) + ', the bitcoin position is at <strong>' + fmtMultiple(btcVsSp) + ' the S&amp;P 500 position</strong> (' + fmtUsd(btcValue) + ' vs. ' + fmtUsd(spValue) + ') &mdash; roughly even or modestly behind. This is still inside the page&rsquo;s 5-to-10-year horizon zone; the 2017 and 2013 presets show what tends to happen as the horizon extends further.';
    }
    document.getElementById('bvsmVerdict').innerHTML = verdictText;

    renderLumpChart(startDate, amount, btc0, sp0, ndq0);
  }

  function computeDcaResults(startDate, amount) {
    var weeklyAmt = amount;
    var monthlyAmt = weeklyAmt * 52 / 12;

    var startIdx = findStartIdx(startDate);

    var labels = [];
    var investedSeries = [], btcSeries = [], spSeries = [], ndqSeries = [];
    var btcUnits = 0, spUnits = 0, ndqUnits = 0;
    var totalInvested = 0;

    for (var i = startIdx; i < SP500_TR_DATA.length; i++) {
      var dateStr = SP500_TR_DATA[i][0];
      var btcP = btcPriceOnDate(dateStr);
      var spP  = SP500_TR_DATA[i][1];
      var ndqP = NDQ_TR_DATA[i][1];

      btcUnits += monthlyAmt / btcP;
      spUnits  += monthlyAmt / spP;
      ndqUnits += monthlyAmt / ndqP;
      totalInvested += monthlyAmt;

      labels.push(dateStr.substring(0, 7));
      investedSeries.push(totalInvested);
      btcSeries.push(btcUnits * btcP);
      spSeries.push(spUnits * spP);
      ndqSeries.push(ndqUnits * ndqP);
    }

    var btcFinal = btcSeries[btcSeries.length - 1] || 0;
    var spFinal  = spSeries[spSeries.length - 1]  || 0;
    var ndqFinal = ndqSeries[ndqSeries.length - 1] || 0;

    document.getElementById('bvsmBtcValue').textContent = fmtUsd(btcFinal);
    document.getElementById('bvsmSpValue').textContent  = fmtUsd(spFinal);
    document.getElementById('bvsmNdqValue').textContent = fmtUsd(ndqFinal);

    function rowsFor(final) {
      var divisor = Math.max(totalInvested, 1);
      return rowHtml('Total invested', fmtUsd(totalInvested)) +
             rowHtml('Multiple', fmtMultiple(final / divisor));
    }
    document.getElementById('bvsmBtcRows').innerHTML = rowsFor(btcFinal);
    document.getElementById('bvsmSpRows').innerHTML  = rowsFor(spFinal);
    document.getElementById('bvsmNdqRows').innerHTML = rowsFor(ndqFinal);

    var verdictText;
    if (totalInvested === 0 || labels.length === 0) {
      verdictText = '<strong>Pick a start date earlier than today</strong> to see the DCA outcome.';
    } else {
      verdictText = 'After <strong>' + (labels.length / 12).toFixed(1) + ' years</strong> of weekly DCA from ' + fmtDate(startDate) + ', total invested: ' + fmtUsd(totalInvested) + '. The bitcoin position is worth <strong>' + fmtUsd(btcFinal) + '</strong>, the S&amp;P 500 position <strong>' + fmtUsd(spFinal) + '</strong>. Bitcoin / S&amp;P 500 ratio: <strong>' + fmtMultiple(btcFinal / Math.max(spFinal, 1)) + '</strong>.';
    }
    document.getElementById('bvsmVerdict').innerHTML = verdictText;

    renderDcaChart(labels, investedSeries, btcSeries, spSeries, ndqSeries);
  }

  /* ─── Horizon mode: lump sum held for N years ───
     Locks the elapsed time across presets so the 2024/2025 tops aren't
     compared to today (where they've had only weeks/months to compound)
     against the 2013/2017 tops (8-12 years of compounding). The horizon
     slider sets target_date = start_date + N years. Where target_date
     falls within historical data, the result is the historical outcome.
     Where it extends past today, the calculator projects forward from
     today's actual values using the canonical Power Law trend (for BTC)
     and the long-run historical CAGRs (10.86% S&P 500, 16.26% NDQ-100). */

  function computeHorizonResults(startDate, amount, horizonYears) {
    var startDateObj = new Date(startDate);
    var targetDateObj = new Date(startDateObj);
    targetDateObj.setFullYear(targetDateObj.getFullYear() + horizonYears);
    var targetDateStr = targetDateObj.toISOString().substring(0, 10);

    var todayDateObj = new Date(todayISO());
    var todayMs = todayDateObj.getTime();
    var targetMs = targetDateObj.getTime();
    var isProjection = targetMs > todayMs;

    // Initial prices at start_date
    var btc0 = btcPriceOnDate(startDate);
    var sp0  = valueOnDate(SP500_TR_DATA, startDate);
    var ndq0 = valueOnDate(NDQ_TR_DATA,  startDate);

    // Final prices at target_date — historical lookup if inside data,
    // forward projection from today if beyond.
    var btcAtTarget, spAtTarget, ndqAtTarget;
    if (!isProjection) {
      btcAtTarget = btcPriceOnDate(targetDateStr);
      spAtTarget  = valueOnDate(SP500_TR_DATA, targetDateStr);
      ndqAtTarget = valueOnDate(NDQ_TR_DATA,  targetDateStr);
    } else {
      var btcToday = btcPriceOnDate(todayISO());
      var spToday  = SP500_TR_DATA[SP500_TR_DATA.length - 1][1];
      var ndqToday = NDQ_TR_DATA[NDQ_TR_DATA.length - 1][1];

      var yearsFromToday = (targetMs - todayMs) / (365.25 * 86400000);
      var targetDays = daysSinceGenesisFromDate(targetDateObj);
      // BTC forward: Power Law trend ratio from today to target,
      // anchored at today's actual market price (not at-trend price)
      var btcGrowth = plPrice(targetDays) / plPrice(TODAY_DAYS);
      var spGrowth  = Math.pow(1 + 0.1086, yearsFromToday);
      var ndqGrowth = Math.pow(1 + 0.1626, yearsFromToday);

      btcAtTarget = btcToday * btcGrowth;
      spAtTarget  = spToday  * spGrowth;
      ndqAtTarget = ndqToday * ndqGrowth;
    }

    var btcValue = amount * (btcAtTarget / btc0);
    var spValue  = amount * (spAtTarget  / sp0);
    var ndqValue = amount * (ndqAtTarget / ndq0);

    document.getElementById('bvsmBtcValue').textContent = fmtUsd(btcValue);
    document.getElementById('bvsmSpValue').textContent  = fmtUsd(spValue);
    document.getElementById('bvsmNdqValue').textContent = fmtUsd(ndqValue);

    var methodLabel = isProjection ? 'projected' : 'historical';
    document.getElementById('bvsmBtcRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(btcValue / amount)) +
      rowHtml('Method', methodLabel);
    document.getElementById('bvsmSpRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(spValue / amount)) +
      rowHtml('Method', methodLabel);
    document.getElementById('bvsmNdqRows').innerHTML =
      rowHtml('Multiple', fmtMultiple(ndqValue / amount)) +
      rowHtml('Method', methodLabel);

    // Verdict — explicit about historical-vs-projected and consistent
    // across presets (same N-year horizon for all of them)
    var btcVsSp = btcValue / spValue;
    var verdictText;
    if (isProjection) {
      verdictText = 'At the <strong>' + horizonYears + '-year mark</strong> (' + fmtDate(targetDateStr) + '), the bitcoin position is <em>projected</em> to be worth <strong>' + fmtMultiple(btcVsSp) + ' the S&amp;P 500 position</strong> (' + fmtUsd(btcValue) + ' vs. ' + fmtUsd(spValue) + '). Projection method: Power Law trend forward from today\'s actual bitcoin price; equity comparators compound at their long-run historical CAGRs (S&amp;P 500 ~10.9%, NASDAQ-100 ~16.3%). Try the 2013 and 2017 presets at the same horizon &mdash; those are fully historical and show the pattern the projection rests on.';
    } else {
      verdictText = 'At the <strong>' + horizonYears + '-year mark</strong> from ' + fmtDate(startDate) + ' (' + fmtDate(targetDateStr) + '), the bitcoin position was worth <strong>' + fmtMultiple(btcVsSp) + ' the S&amp;P 500 position</strong> (' + fmtUsd(btcValue) + ' vs. ' + fmtUsd(spValue) + '). This is historical &mdash; no projection involved.';
    }
    document.getElementById('bvsmVerdict').innerHTML = verdictText;

    renderHorizonChart(startDate, targetDateObj, todayDateObj, amount, btc0, sp0, ndq0);
  }

  function renderLumpChart(startDate, amount, btc0, sp0, ndq0) {
    var canvas = document.getElementById('bvsmCalcChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var labels = [];
    var btcData = [], spData = [], ndqData = [];
    var startIdx = findStartIdx(startDate);

    for (var i = startIdx; i < SP500_TR_DATA.length; i++) {
      var dateStr = SP500_TR_DATA[i][0];
      labels.push(dateStr.substring(0, 7));
      btcData.push(amount * (btcPriceOnDate(dateStr) / btc0));
      spData.push(amount * (SP500_TR_DATA[i][1] / sp0));
      ndqData.push(amount * (NDQ_TR_DATA[i][1] / ndq0));
    }

    var datasets = [
      { label: 'Bitcoin',         data: btcData, borderColor: '#e09422', borderWidth: 2.2, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'S&P 500 (TR)',    data: spData,  borderColor: '#8aa3b5', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'NASDAQ-100 (TR)', data: ndqData, borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 }
    ];

    drawCalcChart(canvas, labels, datasets);
  }

  function renderDcaChart(labels, investedSeries, btcSeries, spSeries, ndqSeries) {
    var canvas = document.getElementById('bvsmCalcChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var datasets = [
      { label: 'Bitcoin',             data: btcSeries,      borderColor: '#e09422', borderWidth: 2.2, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'S&P 500 (TR)',        data: spSeries,       borderColor: '#8aa3b5', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'NASDAQ-100 (TR)',     data: ndqSeries,      borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0 },
      { label: 'Cumulative invested', data: investedSeries, borderColor: '#bfae97', borderWidth: 1.4, borderDash: [5, 4], fill: false, tension: 0.1, pointRadius: 0 }
    ];

    drawCalcChart(canvas, labels, datasets);
  }

  /* Horizon-mode chart: walks monthly from start_date to target_date,
     using historical data through today and projected values beyond.
     The transitionIdx is the last historical sample; Chart.js segment.
     borderDash makes segments at or after that index render dashed,
     visually marking the historical→projection boundary on each line. */
  function renderHorizonChart(startDate, targetDateObj, todayDateObj, amount, btc0, sp0, ndq0) {
    var canvas = document.getElementById('bvsmCalcChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var startObj = new Date(startDate);
    var todayMs  = todayDateObj.getTime();
    var stopMs   = targetDateObj.getTime();

    var btcToday = btcPriceOnDate(todayISO());
    var spToday  = SP500_TR_DATA[SP500_TR_DATA.length - 1][1];
    var ndqToday = NDQ_TR_DATA[NDQ_TR_DATA.length - 1][1];
    var plToday  = plPrice(TODAY_DAYS);

    var labels = [];
    var btcData = [], spData = [], ndqData = [];
    var transitionIdx = -1;
    var i = 0;
    var monthDate = new Date(startObj);

    while (monthDate.getTime() <= stopMs) {
      var monthMs   = monthDate.getTime();
      var monthFull = monthDate.toISOString().substring(0, 10);
      labels.push(monthDate.toISOString().substring(0, 7));

      if (monthMs <= todayMs) {
        // Historical
        btcData.push(amount * (btcPriceOnDate(monthFull) / btc0));
        spData.push( amount * (valueOnDate(SP500_TR_DATA, monthFull) / sp0));
        ndqData.push(amount * (valueOnDate(NDQ_TR_DATA,  monthFull) / ndq0));
        transitionIdx = i;
      } else {
        // Projected forward from today's actual values
        var yearsForward = (monthMs - todayMs) / (365.25 * 86400000);
        var monthDays = daysSinceGenesisFromDate(monthDate);
        var btcGrowth = plPrice(monthDays) / plToday;
        var spGrowth  = Math.pow(1 + 0.1086, yearsForward);
        var ndqGrowth = Math.pow(1 + 0.1626, yearsForward);
        btcData.push(amount * ((btcToday * btcGrowth) / btc0));
        spData.push( amount * ((spToday  * spGrowth)  / sp0));
        ndqData.push(amount * ((ndqToday * ndqGrowth) / ndq0));
      }

      monthDate.setMonth(monthDate.getMonth() + 1);
      i++;
    }

    // Capture transitionIdx for the closure — segments at or beyond
    // this index are projected and rendered dashed
    var firstProjectedIdx = transitionIdx + 1;
    var segmentDash = function(ctx) {
      return ctx.p1DataIndex >= firstProjectedIdx ? [5, 5] : undefined;
    };

    var datasets = [
      { label: 'Bitcoin',         data: btcData, borderColor: '#e09422', borderWidth: 2.2, fill: false, tension: 0.1, pointRadius: 0,
        segment: { borderDash: segmentDash } },
      { label: 'S&P 500 (TR)',    data: spData,  borderColor: '#8aa3b5', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0,
        segment: { borderDash: segmentDash } },
      { label: 'NASDAQ-100 (TR)', data: ndqData, borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.1, pointRadius: 0,
        segment: { borderDash: segmentDash } }
    ];

    drawCalcChart(canvas, labels, datasets);
  }

  function drawCalcChart(canvas, labels, datasets) {
    if (calcChart) calcChart.destroy();
    calcChart = new Chart(canvas, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#9a9080', font: { family: 'Inter', size: 11 } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtUsd(ctx.parsed.y); } } }
        },
        scales: {
          x: { ticks: { color: '#6a6256', font: { size: 10 }, maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { type: 'logarithmic', ticks: { color: '#6a6256', font: { size: 10 }, callback: function(v){ return fmtUsd(v); } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  /* ───────────── §3: Forward projection ───────────── */

  var projChart = null;

  function recomputeProjection() {
    var horizonEl = document.getElementById('bvsmProjHorizon');
    var investEl = document.getElementById('bvsmProjInvest');
    if (!horizonEl || !investEl) return;
    var horizonYears = parseInt(horizonEl.value, 10);
    var investAmt = parseFloat(investEl.value);
    document.getElementById('bvsmProjHorizonVal').textContent = horizonYears + ' years';
    document.getElementById('bvsmProjInvestVal').textContent = fmtUsd(investAmt);

    var todayDate = new Date(todayISO());
    var btcToday = btcPriceOnDate(todayISO());

    var SP_CAGR = 0.1086, NDQ_CAGR = 0.1626;

    // The §4 chart plots TWO bitcoin lines to capture both the conservative
    // forward-trend projection AND the current discount/premium to trend:
    //
    //   Line 1 — Trend basis: assumes today is fair value, projects Power Law
    //     forward. Starts at investAmt.
    //   Line 2 — Current-price basis: anchors to today's market price and
    //     projects forward at trend. Captures whether today is a discount or
    //     premium to trend; vertical gap at y=0 is the entry-quality signal.
    var btcTrendToday = plBtcPrice(daysSinceGenesisFromDate(todayDate));

    var labels = [];
    var btcTrendData = [], btcMarketData = [], spData = [], ndqData = [];
    for (var y = 0; y <= horizonYears; y++) {
      labels.push('+' + y + 'y');
      var d = daysSinceGenesisFromDate(todayDate) + y * 365.25;
      var btcTrendPrice = plBtcPrice(d);
      btcTrendData.push(investAmt * (btcTrendPrice / btcTrendToday));
      btcMarketData.push(investAmt * (btcTrendPrice / btcToday));
      spData.push(investAmt * Math.pow(1 + SP_CAGR, y));
      ndqData.push(investAmt * Math.pow(1 + NDQ_CAGR, y));
    }

    document.getElementById('bvsmProjBtcTrendValue').textContent  = fmtUsd(btcTrendData[btcTrendData.length - 1]);
    document.getElementById('bvsmProjBtcMarketValue').textContent = fmtUsd(btcMarketData[btcMarketData.length - 1]);
    document.getElementById('bvsmProjSpValue').textContent  = fmtUsd(spData[spData.length - 1]);
    document.getElementById('bvsmProjNdqValue').textContent = fmtUsd(ndqData[ndqData.length - 1]);

    var canvas = document.getElementById('bvsmProjectionChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var datasets = [
      { label: 'Bitcoin (trend basis)',   data: btcTrendData,  borderColor: '#e09422', borderWidth: 2.2, fill: false, tension: 0.05, pointRadius: 0 },
      { label: 'Bitcoin (current price)', data: btcMarketData, borderColor: '#e09422', borderWidth: 2.2, borderDash: [6, 4], fill: false, tension: 0.05, pointRadius: 0 },
      { label: 'S&P 500 (10.9% CAGR)',    data: spData,        borderColor: '#8aa3b5', borderWidth: 1.6, fill: false, tension: 0.05, pointRadius: 0 },
      { label: 'NASDAQ-100 (16.3% CAGR)', data: ndqData,       borderColor: '#6fa68f', borderWidth: 1.6, fill: false, tension: 0.05, pointRadius: 0 }
    ];

    if (projChart) projChart.destroy();
    projChart = new Chart(canvas, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: '#9a9080', font: { family: 'Inter', size: 11 } } },
          tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': ' + fmtUsd(ctx.parsed.y); } } }
        },
        scales: {
          x: { ticks: { color: '#6a6256', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { type: 'logarithmic', ticks: { color: '#6a6256', font: { size: 10 }, callback: function(v){ return fmtUsd(v); } }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  /* ───────────── Wire up controls ───────────── */

  function wireUp() {
    // Mode toggle (lump / dca)
    document.querySelectorAll('.bvsm-mode').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var mode = btn.getAttribute('data-mode');
        if (mode !== calcMode) setMode(mode);
      });
    });

    // Preset row (single row now — applies to whichever mode is active)
    document.querySelectorAll('.bvsm-preset').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.bvsm-preset').forEach(function(b){ b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        var dateStr = btn.getAttribute('data-preset-date');
        for (var i = 0; i < SP500_TR_DATA.length; i++) {
          if (SP500_TR_DATA[i][0] >= dateStr) {
            document.getElementById('bvsmStartDate').value = i;
            break;
          }
        }
        recomputeCalc();
      });
    });

    // Calculator slider listeners
    // Calculator slider listeners (start date + amount + horizon).
    // Horizon slider only has visible effect in horizon mode but the
    // listener is wired unconditionally — recomputeCalc() reads
    // calcMode and only consults the horizon value when relevant.
    ['bvsmStartDate', 'bvsmAmount', 'bvsmHorizon'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', recomputeCalc);
    });

    // Forward-projection slider listeners (§4 unchanged)
    ['bvsmProjHorizon', 'bvsmProjInvest'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', recomputeProjection);
    });
  }

  function init() {
    wireUp();
    // Initial render — setMode('lump', skipSliderReset:true) preserves the
    // HTML's default amount value (10000) rather than overwriting it.
    setMode('lump', { skipSliderReset: true });
    recomputeProjection();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
