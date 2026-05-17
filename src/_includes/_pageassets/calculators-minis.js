/* ============================================================
   /calculators — live mini-render module (v1)
   ============================================================
   Currently exports one live preview: a mini bitcoin-vs-S&P-500
   heatmap rendered into #mini-heatmap on the Calculators page.
   Same color tiers and same conceptual cell ('bitcoin's
   outperformance multiple over the comparator across one
   monthly entry × one holding horizon') as the full /heatmap
   tool — visually a postage-stamp version that gives a flavor
   of the full tapestry.

   Why a separate module rather than reusing bvsm.js: bvsm.js is
   ~78KB and its rendering functions live inside an IIFE, so they
   can't be called from outside. Reusing would mean either
   loading the full file plus exposing internals, or factoring
   the helpers out into a shared module. For this v1, we keep
   it self-contained: shared/power-law-data.js provides PL_DATA
   (already a global), and we inline the SP500_TR_DATA array
   below. The data duplication is the known cost; future
   cleanup can extract SP500_TR_DATA + NDQ_TR_DATA into a
   shared/comparator-data.js the same way PL_DATA was promoted.

   IMPORTANT: When updating monthly comparator data, update BOTH
   this file's SP500_TR_DATA AND
   src/_includes/_pageassets/bitcoin-vs-the-stock-market.js
   SP500_TR_DATA. They must stay in sync. Marker comment 'TR-SYNC'
   appears in both places to make grep-finding easy.
   ============================================================ */

(function() {
  'use strict';

  /* TR-SYNC — canonical copy lives in bitcoin-vs-the-stock-market.js */
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

  /* ─── Helpers — mirror bvsm.js's btcPriceAt + interpolators ─── */
  function daysSinceGenesisFromDate(d) {
    return (d.getTime() / 1000 - GENESIS_TS) / 86400;
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

  function spPriceAt(date) {
    var ms = date.getTime();
    if (ms <= new Date(SP500_TR_DATA[0][0]).getTime()) return SP500_TR_DATA[0][1];
    if (ms >= new Date(SP500_TR_DATA[SP500_TR_DATA.length - 1][0]).getTime()) return SP500_TR_DATA[SP500_TR_DATA.length - 1][1];
    for (var i = 0; i < SP500_TR_DATA.length - 1; i++) {
      var t0 = new Date(SP500_TR_DATA[i][0]).getTime();
      var t1 = new Date(SP500_TR_DATA[i+1][0]).getTime();
      if (t0 <= ms && ms <= t1) {
        var t = (ms - t0) / (t1 - t0);
        return SP500_TR_DATA[i][1] * Math.pow(SP500_TR_DATA[i+1][1] / SP500_TR_DATA[i][1], t);
      }
    }
    return null;
  }

  /* ─── Tier classification (matches bvsm.js hmTier semantics) ─── */
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
      'loss-deep': '#a83232',
      'loss':      '#6d2a2a',
      'flat':      '#2a2a2a',
      'win-mild':  '#5c4a1f',
      'win-mid':   '#a07a25',
      'win-deep':  '#e09422',
      'future':    '#1a1a1a'
    }[tier];
  }

  /* ─── Mini heatmap renderer ─── */
  function renderMiniHeatmap(target) {
    var W = 400, H = 110;
    var ml = 22, mt = 4, mb = 10, mr = 4;
    var horizons = [12, 24, 36, 60, 84];        // 1y, 2y, 3y, 5y, 7y in months
    var labels   = ['1y','2y','3y','5y','7y'];

    // Monthly start dates from 2010-01 → today (mid-month anchors, matching
    // bvsm.js buildStartDates convention)
    var startDates = [];
    var today = new Date();
    var d = new Date(2010, 0, 15);
    while (d < today) {
      startDates.push(new Date(d));
      d.setMonth(d.getMonth() + 1);
    }

    var nCols = startDates.length, nRows = horizons.length;
    var cellW = (W - ml - mr) / nCols;
    var cellH = (H - mt - mb) / nRows;
    var gap = 0.5;

    var parts = [];

    // Cells: top-to-bottom = longest-to-shortest horizon (matches full heatmap)
    for (var r = 0; r < nRows; r++) {
      var hMo = horizons[nRows - 1 - r];        // r=0 → 7y, r=4 → 1y
      for (var c = 0; c < nCols; c++) {
        var sd = startDates[c];
        var ed = new Date(sd);
        ed.setMonth(ed.getMonth() + hMo);
        var x = ml + c * cellW;
        var y = mt + r * cellH;
        var w = Math.max(cellW - gap, 0.5);
        var h = Math.max(cellH - gap, 1);
        var tier;
        if (ed > today) {
          tier = 'future';
        } else {
          var btcStart = btcPriceAt(daysSinceGenesisFromDate(sd));
          var btcEnd   = btcPriceAt(daysSinceGenesisFromDate(ed));
          var spStart  = spPriceAt(sd);
          var spEnd    = spPriceAt(ed);
          if (!btcStart || !btcEnd || !spStart || !spEnd) {
            tier = 'future';
          } else {
            var btcRet = btcEnd / btcStart;
            var spRet  = spEnd / spStart;
            tier = hmTier(btcRet / spRet);
          }
        }
        parts.push(
          '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) +
          '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) +
          '" fill="' + tierColor(tier) + '"/>'
        );
      }
    }

    // Y-axis horizon labels — small, right-aligned to the grid edge
    for (var i = 0; i < nRows; i++) {
      var lbl = labels[nRows - 1 - i];
      var ly = mt + i * cellH + cellH / 2 + 2;
      parts.push(
        '<text x="' + (ml - 3) + '" y="' + ly.toFixed(2) +
        '" font-size="6.5" font-family="Inter, sans-serif" fill="#888" text-anchor="end">' +
        lbl + '</text>'
      );
    }

    // X-axis year labels — sparse (every ~4 years to avoid crowding at this scale)
    var lastYear = null;
    for (c = 0; c < nCols; c++) {
      var yr = startDates[c].getFullYear();
      if (yr !== lastYear && (yr === 2010 || yr === 2014 || yr === 2018 || yr === 2022 || yr === 2026)) {
        var xx = ml + c * cellW + cellW / 2;
        parts.push(
          '<text x="' + xx.toFixed(2) + '" y="' + (H - 1) +
          '" font-size="6" font-family="Inter, sans-serif" fill="#666" text-anchor="middle">' +
          yr + '</text>'
        );
        lastYear = yr;
      }
    }

    target.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg"' +
      ' style="width:100%;height:auto;display:block;" preserveAspectRatio="xMidYMid meet">' +
      parts.join('') + '</svg>';
  }

  /* ─── Init ─── */
  function init() {
    var target = document.getElementById('mini-heatmap');
    if (!target) return;
    if (typeof PL_DATA === 'undefined' || typeof GENESIS_TS === 'undefined') {
      console.warn('calculators-minis: PL_DATA / GENESIS_TS not loaded');
      return;
    }
    try {
      renderMiniHeatmap(target);
    } catch (e) {
      console.error('Mini heatmap render failed:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
