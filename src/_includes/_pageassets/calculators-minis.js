/* ============================================================
   /calculators — live mini-render module (v2: 7 live renderers)
   ============================================================
   Live previews for the marquee tools on /calculators. Each
   renderer is small, self-contained, and reads from inlined or
   global data so the file has no runtime dependencies beyond
   shared/power-law-data.js (which is already loaded before this
   file via the page_scripts include order).

   Renderers (target div → function):
     #mini-heatmap     → renderMiniHeatmap       (BTC outperformance grid)
     #mini-bvsm-chart  → renderMiniBvsmChart    (3-line wealth chart, BTC/SP/NDQ)
     #mini-power-law   → renderMiniPowerLaw     (log-log scatter + trend)
     #mini-retirement  → renderMiniRetirement   (forward PL projection)
     #mini-rebalancing → renderMiniRebalancing  (channel + recent price + markers)
     #mini-horizon     → renderMiniHorizon      (long-range projection)
     #mini-half-life   → renderMiniHalfLife     (purchasing power decay)

   All renderers write directly to target.innerHTML; rendering is
   one-shot at page load (no interactivity in the previews — the
   user clicks the tile to open the full tool). Total CPU budget
   at page load: ~150-250ms, dominated by the mini-heatmap's
   ~980 cell loop.

   Data layer:
   - PL_DATA, GENESIS_TS, PL_A, PL_B, PL_FLOOR, PL_CEIL, plPrice():
     globals from shared/power-law-data.js
   - SP500_TR_DATA, NDQ_TR_DATA: inlined below (TR-SYNC marker).
     Canonical source is bvsm.js. When the BvSM page updates its
     comparator data, this file must update too. Future cleanup:
     extract both to shared/comparator-data.js the same way
     PL_DATA was promoted (third-consumer trigger).
   ============================================================ */

(function() {
  'use strict';

  /* ═══════ TR-SYNC: SP500 + NDQ comparator data ═══════ */
  /* Canonical copies live in bitcoin-vs-the-stock-market.js.   */
  /* Marker comment also in that file. When updating monthly    */
  /* values, change BOTH files. ~10KB total.                    */
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


  /* ═══════════════════════════════════════════════════════════
     SHARED HELPERS
     ═══════════════════════════════════════════════════════════ */

  var FONT = 'Inter, sans-serif';
  var C = {
    btc:    '#F7931A',
    btcDim: '#e09422',
    sp:     '#5fc6d4',
    ndq:    '#7fd4b8',
    grid:   '#2a2a2a',
    gridLt: '#3a3a3a',
    label:  '#888',
    lblDim: '#666',
    bg:     '#0a0908'
  };

  function daysSinceGenesisFromDate(d) {
    return (d.getTime() / 1000 - GENESIS_TS) / 86400;
  }

  function dateFromDaysSinceGenesis(days) {
    return new Date((days * 86400 + GENESIS_TS) * 1000);
  }

  function btcPriceAt(days) {
    if (typeof PL_DATA === 'undefined') return null;
    if (days <= PL_DATA[0][0]) return PL_DATA[0][1];
    if (days >= PL_DATA[PL_DATA.length - 1][0]) return PL_DATA[PL_DATA.length - 1][1];
    for (var i = 0; i < PL_DATA.length - 1; i++) {
      if (PL_DATA[i][0] <= days && days <= PL_DATA[i+1][0]) {
        var t = (days - PL_DATA[i][0]) / (PL_DATA[i+1][0] - PL_DATA[i][0]);
        return PL_DATA[i][1] * Math.pow(PL_DATA[i+1][1] / PL_DATA[i][1], t);
      }
    }
    return null;
  }

  function seriesPriceAt(arr, date) {
    var ms = date.getTime();
    if (ms <= new Date(arr[0][0]).getTime()) return arr[0][1];
    if (ms >= new Date(arr[arr.length - 1][0]).getTime()) return arr[arr.length - 1][1];
    for (var i = 0; i < arr.length - 1; i++) {
      var t0 = new Date(arr[i][0]).getTime();
      var t1 = new Date(arr[i+1][0]).getTime();
      if (t0 <= ms && ms <= t1) {
        var t = (ms - t0) / (t1 - t0);
        return arr[i][1] * Math.pow(arr[i+1][1] / arr[i][1], t);
      }
    }
    return null;
  }

  function spPriceAt(date)  { return seriesPriceAt(SP500_TR_DATA, date); }
  function ndqPriceAt(date) { return seriesPriceAt(NDQ_TR_DATA,   date); }

  /* Power Law trend / channel at given days since genesis */
  function plTrend(days) { return PL_A * Math.pow(days, PL_B); }
  function plFloor(days) { return plTrend(days) * PL_FLOOR; }
  function plCeil(days)  { return plTrend(days) * PL_CEIL; }

  /* SVG escaping helper for safe text-content insertion */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Set target div content to a complete SVG wrapper around child markup */
  function setSvg(target, vbW, vbH, body) {
    target.innerHTML =
      '<svg viewBox="0 0 ' + vbW + ' ' + vbH + '" xmlns="http://www.w3.org/2000/svg"' +
      ' style="width:100%;height:auto;display:block" preserveAspectRatio="xMidYMid meet">' +
      body + '</svg>';
  }

  /* ═══════════════════════════════════════════════════════════
     1. MINI HEATMAP  (existing — unchanged from v1)
     ═══════════════════════════════════════════════════════════ */

  function hmTier(outperf) {
    if (outperf <= 0.5) return 'loss-deep';
    if (outperf <= 0.9) return 'loss';
    if (outperf <= 1.1) return 'flat';
    if (outperf <= 2.0) return 'win-mild';
    if (outperf <= 5.0) return 'win-mid';
    return 'win-deep';
  }
  function tierColor(tier) {
    return {
      'loss-deep': '#BE3A30', 'loss': '#6B2A23', 'flat': '#1F1F1F',
      'win-mild':  '#E5D070', 'win-mid': '#F5C240', 'win-deep': '#F7931A',
      'future':    '#1a1a1a'
    }[tier];
  }

  function renderMiniHeatmap(target) {
    var W = 400, H = 110, ml = 22, mt = 4, mb = 10, mr = 4;
    var horizons = [12, 24, 36, 60, 84];
    var labels   = ['1y','2y','3y','5y','7y'];
    var startDates = [];
    var today = new Date();
    var d = new Date(2010, 0, 15);
    while (d < today) { startDates.push(new Date(d)); d.setMonth(d.getMonth() + 1); }
    var nCols = startDates.length, nRows = horizons.length;
    var cellW = (W - ml - mr) / nCols, cellH = (H - mt - mb) / nRows, gap = 0.5;
    var parts = [];
    for (var r = 0; r < nRows; r++) {
      var hMo = horizons[nRows - 1 - r];
      for (var c = 0; c < nCols; c++) {
        var sd = startDates[c];
        var ed = new Date(sd); ed.setMonth(ed.getMonth() + hMo);
        var x = ml + c * cellW, y = mt + r * cellH;
        var w = Math.max(cellW - gap, 0.5), h = Math.max(cellH - gap, 1);
        var tier;
        if (ed > today) { tier = 'future'; }
        else {
          var bs = btcPriceAt(daysSinceGenesisFromDate(sd));
          var be = btcPriceAt(daysSinceGenesisFromDate(ed));
          var ss = spPriceAt(sd), se = spPriceAt(ed);
          tier = (!bs || !be || !ss || !se) ? 'future' : hmTier((be/bs) / (se/ss));
        }
        parts.push('<rect x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+w.toFixed(2)+'" height="'+h.toFixed(2)+'" fill="'+tierColor(tier)+'"/>');
      }
    }
    for (var i = 0; i < nRows; i++) {
      var lbl = labels[nRows - 1 - i];
      var ly = mt + i * cellH + cellH / 2 + 2;
      parts.push('<text x="'+(ml-3)+'" y="'+ly.toFixed(2)+'" font-size="6.5" font-family="'+FONT+'" fill="'+C.label+'" text-anchor="end">'+lbl+'</text>');
    }
    var lastYear = null;
    for (c = 0; c < nCols; c++) {
      var yr = startDates[c].getFullYear();
      if (yr !== lastYear && (yr === 2010 || yr === 2014 || yr === 2018 || yr === 2022 || yr === 2026)) {
        var xx = ml + c * cellW + cellW / 2;
        parts.push('<text x="'+xx.toFixed(2)+'" y="'+(H-1)+'" font-size="6" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="middle">'+yr+'</text>');
        lastYear = yr;
      }
    }
    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     2. MINI BVSM WEALTH CHART
     3 paths showing $10k invested in BTC / SP500 / NDQ from
     2010-07 (first reliable BTC price) to today, log-Y.
     ═══════════════════════════════════════════════════════════ */

  function renderMiniBvsmChart(target) {
    var W = 400, H = 110;
    var pl = 28, pt = 18, pr = 8, pb = 14;     // plot area margins
    var x0 = pl, x1 = W - pr;
    var y0 = pt, y1 = H - pb;

    // Compute series — monthly samples from PL_DATA[0] date to today
    var startDays = PL_DATA[0][0];                   // ~592
    var endDays   = PL_DATA[PL_DATA.length - 1][0];  // most recent
    var months = [];                                  // [{days, date, btc, sp, ndq}]
    var sd = dateFromDaysSinceGenesis(startDays);
    sd.setDate(28);
    var ed = new Date();
    var startBtc = btcPriceAt(startDays);
    var startSp  = spPriceAt(sd);
    var startNdq = ndqPriceAt(sd);
    var amount = 10000;
    var cur = new Date(sd);
    while (cur < ed) {
      var days = daysSinceGenesisFromDate(cur);
      var bp = btcPriceAt(days);
      var sp = spPriceAt(cur);
      var np = ndqPriceAt(cur);
      months.push({
        date: new Date(cur),
        btc:  amount * (bp / startBtc),
        sp:   amount * (sp / startSp),
        ndq:  amount * (np / startNdq)
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    // Find log-Y bounds (with a little headroom)
    var maxVal = 0;
    months.forEach(function(m) {
      if (m.btc > maxVal) maxVal = m.btc;
      if (m.sp  > maxVal) maxVal = m.sp;
      if (m.ndq > maxVal) maxVal = m.ndq;
    });
    var yMin = amount;                  // $10k floor
    var yMax = maxVal * 1.2;             // 20% headroom above max BTC
    var logMin = Math.log10(yMin);
    var logMax = Math.log10(yMax);

    function xPos(idx) { return x0 + (x1 - x0) * (idx / (months.length - 1)); }
    function yPos(v)   { return y1 - (y1 - y0) * (Math.log10(v) - logMin) / (logMax - logMin); }

    function buildPath(key) {
      var s = '';
      months.forEach(function(m, i) {
        s += (i === 0 ? 'M ' : 'L ') + xPos(i).toFixed(2) + ' ' + yPos(m[key]).toFixed(2) + ' ';
      });
      return s;
    }

    var parts = [];

    // Subtle gridlines (decades on log scale)
    for (var dec = Math.ceil(logMin); dec <= Math.floor(logMax); dec++) {
      var gy = yPos(Math.pow(10, dec));
      parts.push('<line x1="'+x0+'" y1="'+gy.toFixed(2)+'" x2="'+x1+'" y2="'+gy.toFixed(2)+'" stroke="'+C.grid+'" stroke-width="0.5" stroke-dasharray="2 3"/>');
    }
    // Axis frame
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Series — draw SP500 + NDQ first, BTC on top
    parts.push('<path d="'+buildPath('sp') +'" stroke="'+C.sp +'" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
    parts.push('<path d="'+buildPath('ndq')+'" stroke="'+C.ndq+'" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
    parts.push('<path d="'+buildPath('btc')+'" stroke="'+C.btc+'" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');

    // Mini legend (top-left)
    parts.push('<circle cx="'+(x0+8)+'" cy="10" r="2" fill="'+C.btc+'"/>');
    parts.push('<text x="'+(x0+14)+'" y="13" font-size="7" font-family="'+FONT+'" fill="#aaa">Bitcoin</text>');
    parts.push('<circle cx="'+(x0+90)+'" cy="10" r="2" fill="'+C.ndq+'"/>');
    parts.push('<text x="'+(x0+96)+'" y="13" font-size="7" font-family="'+FONT+'" fill="#aaa">NASDAQ-100</text>');
    parts.push('<circle cx="'+(x0+186)+'" cy="10" r="2" fill="'+C.sp+'"/>');
    parts.push('<text x="'+(x0+192)+'" y="13" font-size="7" font-family="'+FONT+'" fill="#aaa">S&amp;P 500</text>');

    // Year tick labels
    parts.push('<text x="'+x0+'" y="'+(H-3)+'" font-size="6" font-family="'+FONT+'" fill="'+C.lblDim+'">2010</text>');
    parts.push('<text x="'+((x0+x1)/2).toFixed(2)+'" y="'+(H-3)+'" font-size="6" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="middle">2018</text>');
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="6" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">2026</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     3. MINI POWER LAW  (log-log scatter + trend line)
     ═══════════════════════════════════════════════════════════ */

  function renderMiniPowerLaw(target) {
    var W = 200, H = 120, pl = 16, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    // Domain: log days from PL_DATA[0] to last, log prices from min to max + headroom
    var startDays = PL_DATA[0][0];
    var endDays   = PL_DATA[PL_DATA.length - 1][0];
    // Extend trend line slightly past today + 2 yrs for slope continuity
    var trendEndDays = endDays + 730;
    var xLogMin = Math.log10(startDays);
    var xLogMax = Math.log10(trendEndDays);
    // Y bounds: from min observed price to max observed (+ trend at trendEnd)
    var yMaxObs = 0, yMinObs = Infinity;
    PL_DATA.forEach(function(p) {
      if (p[1] > yMaxObs) yMaxObs = p[1];
      if (p[1] < yMinObs) yMinObs = p[1];
    });
    var yLogMin = Math.log10(yMinObs * 0.5);
    var yLogMax = Math.log10(Math.max(yMaxObs, plTrend(trendEndDays)) * 1.2);

    function xPos(days)  { return x0 + (x1 - x0) * (Math.log10(days)  - xLogMin) / (xLogMax - xLogMin); }
    function yPos(price) { return y1 - (y1 - y0) * (Math.log10(price) - yLogMin) / (yLogMax - yLogMin); }

    var parts = [];

    // Frame
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Trend line (PL_A * d^PL_B) — straight line on log-log
    var d1 = startDays, d2 = trendEndDays;
    parts.push('<line x1="'+xPos(d1).toFixed(2)+'" y1="'+yPos(plTrend(d1)).toFixed(2)+'" x2="'+xPos(d2).toFixed(2)+'" y2="'+yPos(plTrend(d2)).toFixed(2)+'" stroke="'+C.btc+'" stroke-width="1.4" stroke-linecap="round"/>');

    // Channel floor + ceil — dashed
    parts.push('<line x1="'+xPos(d1).toFixed(2)+'" y1="'+yPos(plFloor(d1)).toFixed(2)+'" x2="'+xPos(d2).toFixed(2)+'" y2="'+yPos(plFloor(d2)).toFixed(2)+'" stroke="'+C.btcDim+'" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.6"/>');
    parts.push('<line x1="'+xPos(d1).toFixed(2)+'" y1="'+yPos(plCeil(d1)).toFixed(2)+'"  x2="'+xPos(d2).toFixed(2)+'" y2="'+yPos(plCeil(d2)).toFixed(2)+'"  stroke="'+C.btcDim+'" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.6"/>');

    // Scatter — every 4th PL_DATA point to keep mini uncluttered
    for (var i = 0; i < PL_DATA.length; i += 4) {
      var p = PL_DATA[i];
      parts.push('<circle cx="'+xPos(p[0]).toFixed(2)+'" cy="'+yPos(p[1]).toFixed(2)+'" r="0.9" fill="'+C.btcDim+'" opacity="0.85"/>');
    }

    // Axis labels (tiny)
    parts.push('<text x="'+(x0-1)+'" y="'+(y0+5)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">$100k</text>');
    parts.push('<text x="'+(x0-1)+'" y="'+(y1-1)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">$0.1</text>');
    parts.push('<text x="'+x0+'"     y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'">log(days)</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     4. MINI RETIREMENT  (forward PL projection, next 25 years)
     ═══════════════════════════════════════════════════════════ */

  function renderMiniRetirement(target) {
    var W = 200, H = 120, pl = 22, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    // Today + 25 years ahead. Linear time on X, log-Y for price.
    var today = new Date();
    var todayDays = daysSinceGenesisFromDate(today);
    var horizonYears = 25;
    var endDays = todayDays + horizonYears * 365.25;

    // Y bounds: from today's floor to horizon's ceil (with headroom)
    var yMinPrice = plFloor(todayDays) * 0.7;
    var yMaxPrice = plCeil(endDays)    * 1.1;
    var logMin = Math.log10(yMinPrice);
    var logMax = Math.log10(yMaxPrice);

    function xPos(days)  { return x0 + (x1 - x0) * (days - todayDays) / (endDays - todayDays); }
    function yPos(price) { return y1 - (y1 - y0) * (Math.log10(price) - logMin) / (logMax - logMin); }

    var parts = [];

    // Frame
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Build floor / trend / ceil paths
    var nSteps = 30;
    function buildBandPath(fn) {
      var s = '';
      for (var i = 0; i <= nSteps; i++) {
        var t = i / nSteps;
        var d = todayDays + t * (endDays - todayDays);
        s += (i === 0 ? 'M ' : 'L ') + xPos(d).toFixed(2) + ' ' + yPos(fn(d)).toFixed(2) + ' ';
      }
      return s;
    }

    // Filled band between floor and ceil
    var floorStr = '', ceilStr = '';
    for (var i = 0; i <= nSteps; i++) {
      var t = i / nSteps;
      var d = todayDays + t * (endDays - todayDays);
      floorStr += (i === 0 ? 'M ' : 'L ') + xPos(d).toFixed(2) + ' ' + yPos(plFloor(d)).toFixed(2) + ' ';
    }
    for (i = nSteps; i >= 0; i--) {
      t = i / nSteps;
      d = todayDays + t * (endDays - todayDays);
      ceilStr += 'L ' + xPos(d).toFixed(2) + ' ' + yPos(plCeil(d)).toFixed(2) + ' ';
    }
    parts.push('<path d="'+floorStr+ceilStr+'Z" fill="'+C.btc+'" fill-opacity="0.08"/>');

    // Dashed floor + ceil lines
    parts.push('<path d="'+buildBandPath(plFloor)+'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.6"/>');
    parts.push('<path d="'+buildBandPath(plCeil) +'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.6"/>');
    // Trend line
    parts.push('<path d="'+buildBandPath(plTrend)+'" stroke="'+C.btc+'" stroke-width="1.6" fill="none" stroke-linecap="round"/>');

    // Today marker
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.btc+'" stroke-width="0.8" opacity="0.5"/>');
    parts.push('<text x="'+(x0+1)+'" y="'+(y0+6)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.btc+'">today</text>');

    // Horizon end label
    var endYear = today.getFullYear() + horizonYears;
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">+'+horizonYears+'y</text>');

    // Price labels
    var trendEndK = (plTrend(endDays) / 1000).toFixed(0);
    parts.push('<text x="'+(x0-2)+'" y="'+(y0+5)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">$'+trendEndK+'k</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(y1-1)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">$'+(plFloor(todayDays)/1000).toFixed(0)+'k</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     5. MINI REBALANCING  (channel + recent price + markers)
     Recent 6 years of BTC price overlaid on the PL channel,
     highlighting where price touched / crossed the upper or
     lower bands — the protocol's trigger conditions.
     ═══════════════════════════════════════════════════════════ */

  function renderMiniRebalancing(target) {
    var W = 200, H = 120, pl = 22, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    var today = new Date();
    var todayDays = daysSinceGenesisFromDate(today);
    var startDays = todayDays - 6 * 365.25;     // 6-year lookback
    // Find PL_DATA samples in range
    var samples = PL_DATA.filter(function(p) { return p[0] >= startDays && p[0] <= todayDays; });

    var yMinPrice = Math.min(plFloor(startDays), plFloor(todayDays)) * 0.85;
    var yMaxPrice = Math.max(plCeil(startDays),  plCeil(todayDays))  * 1.05;
    // Also account for actual prices in case they swing outside the band
    samples.forEach(function(p) {
      if (p[1] < yMinPrice) yMinPrice = p[1] * 0.9;
      if (p[1] > yMaxPrice) yMaxPrice = p[1] * 1.05;
    });
    var logMin = Math.log10(yMinPrice);
    var logMax = Math.log10(yMaxPrice);

    function xPos(days)  { return x0 + (x1 - x0) * (days - startDays) / (todayDays - startDays); }
    function yPos(price) { return y1 - (y1 - y0) * (Math.log10(price) - logMin) / (logMax - logMin); }

    var parts = [];
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Channel lines
    var nSteps = 20;
    function bandPath(fn) {
      var s = '';
      for (var i = 0; i <= nSteps; i++) {
        var t = i / nSteps;
        var d = startDays + t * (todayDays - startDays);
        s += (i === 0 ? 'M ' : 'L ') + xPos(d).toFixed(2) + ' ' + yPos(fn(d)).toFixed(2) + ' ';
      }
      return s;
    }
    parts.push('<path d="'+bandPath(plCeil) +'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.65"/>');
    parts.push('<path d="'+bandPath(plTrend)+'" stroke="'+C.btcDim+'" stroke-width="0.6" fill="none" opacity="0.4"/>');
    parts.push('<path d="'+bandPath(plFloor)+'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.65"/>');

    // Actual price path
    var priceStr = '';
    samples.forEach(function(p, idx) {
      priceStr += (idx === 0 ? 'M ' : 'L ') + xPos(p[0]).toFixed(2) + ' ' + yPos(p[1]).toFixed(2) + ' ';
    });
    parts.push('<path d="'+priceStr+'" stroke="'+C.btc+'" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');

    // Rebalance markers — find points where price/ceil > 0.85 (sell trigger zone)
    // or price/floor < 1.15 (rebuy trigger zone)
    samples.forEach(function(p) {
      var ratioCeil  = p[1] / plCeil(p[0]);
      var ratioFloor = p[1] / plFloor(p[0]);
      if (ratioCeil > 0.85) {
        parts.push('<path d="M '+xPos(p[0]).toFixed(2)+' '+(yPos(p[1])-3).toFixed(2)+' l 2 -3 l -4 0 Z" fill="'+C.btc+'"/>');
      } else if (ratioFloor < 1.18) {
        parts.push('<path d="M '+xPos(p[0]).toFixed(2)+' '+(yPos(p[1])+3).toFixed(2)+' l 2 3 l -4 0 Z" fill="'+C.btc+'"/>');
      }
    });

    // Tiny corner labels
    parts.push('<text x="'+(x0-2)+'" y="'+(y0+5)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">ceil</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(y1-1)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">floor</text>');
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">6y</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     6. MINI HORIZON  (long-range PL projection, 40 years)
     ═══════════════════════════════════════════════════════════ */

  function renderMiniHorizon(target) {
    var W = 200, H = 120, pl = 26, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    var today = new Date();
    var todayDays = daysSinceGenesisFromDate(today);
    // Show recent ~8y of history + 32y of projection
    var startDays = todayDays - 8 * 365.25;
    var horizonYears = 32;
    var endDays = todayDays + horizonYears * 365.25;

    var yMinPrice = Math.min(plFloor(startDays), plFloor(todayDays)) * 0.85;
    var yMaxPrice = plCeil(endDays) * 1.1;
    PL_DATA.forEach(function(p) {
      if (p[0] >= startDays && p[1] < yMinPrice) yMinPrice = p[1] * 0.85;
    });
    var logMin = Math.log10(yMinPrice);
    var logMax = Math.log10(yMaxPrice);

    function xPos(days)  { return x0 + (x1 - x0) * (days - startDays) / (endDays - startDays); }
    function yPos(price) { return y1 - (y1 - y0) * (Math.log10(price) - logMin) / (logMax - logMin); }

    var parts = [];
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    var nSteps = 40;
    function band(fn) {
      var s = '';
      for (var i = 0; i <= nSteps; i++) {
        var t = i / nSteps;
        var d = startDays + t * (endDays - startDays);
        s += (i === 0 ? 'M ' : 'L ') + xPos(d).toFixed(2) + ' ' + yPos(fn(d)).toFixed(2) + ' ';
      }
      return s;
    }
    // Filled band between floor + ceil (projection region only)
    var fillPath = '';
    for (var i = 0; i <= nSteps; i++) {
      var tt = i / nSteps;
      var dd = startDays + tt * (endDays - startDays);
      if (dd < todayDays) continue;
      fillPath += (fillPath === '' ? 'M ' : 'L ') + xPos(dd).toFixed(2) + ' ' + yPos(plFloor(dd)).toFixed(2) + ' ';
    }
    for (i = nSteps; i >= 0; i--) {
      tt = i / nSteps;
      dd = startDays + tt * (endDays - startDays);
      if (dd < todayDays) break;
      fillPath += 'L ' + xPos(dd).toFixed(2) + ' ' + yPos(plCeil(dd)).toFixed(2) + ' ';
    }
    if (fillPath) parts.push('<path d="'+fillPath+'Z" fill="'+C.btc+'" fill-opacity="0.10"/>');

    parts.push('<path d="'+band(plFloor)+'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.6"/>');
    parts.push('<path d="'+band(plCeil) +'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.6"/>');
    parts.push('<path d="'+band(plTrend)+'" stroke="'+C.btc+'" stroke-width="1.5" fill="none" stroke-linecap="round"/>');

    // Recent price points (historical, before today)
    var recent = PL_DATA.filter(function(p) { return p[0] >= startDays && p[0] <= todayDays; });
    var rs = '';
    recent.forEach(function(p, idx) {
      rs += (idx === 0 ? 'M ' : 'L ') + xPos(p[0]).toFixed(2) + ' ' + yPos(p[1]).toFixed(2) + ' ';
    });
    if (rs) parts.push('<path d="'+rs+'" stroke="'+C.btc+'" stroke-width="1.1" fill="none" opacity="0.6" stroke-linejoin="round"/>');

    // Today divider
    parts.push('<line x1="'+xPos(todayDays).toFixed(2)+'" y1="'+y0+'" x2="'+xPos(todayDays).toFixed(2)+'" y2="'+y1+'" stroke="'+C.label+'" stroke-width="0.6" stroke-dasharray="1 2" opacity="0.55"/>');
    parts.push('<text x="'+(xPos(todayDays)+2).toFixed(2)+'" y="'+(y0+6)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.label+'">today</text>');

    // Range labels
    var endYear = today.getFullYear() + horizonYears;
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">'+endYear+'</text>');
    parts.push('<text x="'+x0+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'">'+(today.getFullYear()-8)+'</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     7. MINI HALF-LIFE  (purchasing power decay curve)
     Pure math: PP(t) = (1 - inflation_rate)^t, with reference
     markers at ½ (~20y) and ¼ (~40y) assuming ~3.5% inflation.
     ═══════════════════════════════════════════════════════════ */

  function renderMiniHalfLife(target) {
    var W = 200, H = 120, pl = 22, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    var inflationRate = 0.035;   // ~3.5% annual
    var horizonYears = 80;
    var halfLifeYears = Math.log(0.5) / Math.log(1 - inflationRate);   // ~19.5 years

    function xPos(years) { return x0 + (x1 - x0) * (years / horizonYears); }
    function yPos(pp)    { return y1 - (y1 - y0) * pp; }  // 1.0 at top, 0 at bottom

    var parts = [];
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Reference horizontals
    parts.push('<line x1="'+x0+'" y1="'+yPos(0.5).toFixed(2) +'" x2="'+x1+'" y2="'+yPos(0.5).toFixed(2) +'" stroke="'+C.gridLt+'" stroke-width="0.5" stroke-dasharray="2 2"/>');
    parts.push('<line x1="'+x0+'" y1="'+yPos(0.25).toFixed(2)+'" x2="'+x1+'" y2="'+yPos(0.25).toFixed(2)+'" stroke="'+C.gridLt+'" stroke-width="0.5" stroke-dasharray="2 2"/>');
    parts.push('<line x1="'+x0+'" y1="'+yPos(0.125).toFixed(2)+'" x2="'+x1+'" y2="'+yPos(0.125).toFixed(2)+'" stroke="'+C.gridLt+'" stroke-width="0.5" stroke-dasharray="2 2"/>');

    // Decay curve
    var nSteps = 40;
    var pathStr = '';
    for (var i = 0; i <= nSteps; i++) {
      var t = (i / nSteps) * horizonYears;
      var pp = Math.pow(1 - inflationRate, t);
      pathStr += (i === 0 ? 'M ' : 'L ') + xPos(t).toFixed(2) + ' ' + yPos(pp).toFixed(2) + ' ';
    }
    parts.push('<path d="'+pathStr+'" stroke="'+C.btc+'" stroke-width="1.7" fill="none" stroke-linecap="round"/>');

    // Y labels
    parts.push('<text x="'+(x0-2)+'" y="'+(y0+5)+'" font-size="6" font-family="'+FONT+'" fill="'+C.btc+'" text-anchor="end">$1</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(yPos(0.5)+2).toFixed(2)+'"  font-size="5.5" font-family="'+FONT+'" fill="'+C.label+'" text-anchor="end">½</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(yPos(0.25)+2).toFixed(2)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.label+'" text-anchor="end">¼</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(yPos(0.125)+2).toFixed(2)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.label+'" text-anchor="end">⅛</text>');

    // X labels
    parts.push('<text x="'+x0+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'">today</text>');
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">+'+horizonYears+'y</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     INIT — find each target div and run its renderer
     ═══════════════════════════════════════════════════════════ */

  var RENDERERS = {
    'mini-heatmap':      renderMiniHeatmap,
    'mini-bvsm-chart':   renderMiniBvsmChart,
    'mini-power-law':    renderMiniPowerLaw,
    'mini-retirement':   renderMiniRetirement,
    'mini-rebalancing':  renderMiniRebalancing,
    'mini-horizon':      renderMiniHorizon,
    'mini-half-life':    renderMiniHalfLife
  };

  function init() {
    if (typeof PL_DATA === 'undefined' || typeof GENESIS_TS === 'undefined' ||
        typeof PL_A === 'undefined') {
      console.warn('calculators-minis: required globals not loaded');
      return;
    }
    Object.keys(RENDERERS).forEach(function(id) {
      var target = document.getElementById(id);
      if (!target) return;
      try {
        RENDERERS[id](target);
      } catch (e) {
        console.error('mini render failed:', id, e);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
