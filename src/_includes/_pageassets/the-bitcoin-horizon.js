
/*
  BTC monthly close dataset — APPROXIMATE / PLACEHOLDER
  Production replaces with the cached Blockchain.info JSON used on the Power Law page.
*/
const btcMonthly = [
  ["2011-01", 0.30], ["2011-02", 0.95], ["2011-03", 0.70], ["2011-04", 1.75],
  ["2011-05", 8.40], ["2011-06", 15.50], ["2011-07", 13.20], ["2011-08", 8.20],
  ["2011-09", 5.10], ["2011-10", 3.20], ["2011-11", 2.55], ["2011-12", 4.25],
  ["2012-01", 5.30], ["2012-02", 4.90], ["2012-03", 4.85], ["2012-04", 5.00],
  ["2012-05", 5.20], ["2012-06", 6.60], ["2012-07", 8.80], ["2012-08", 10.40],
  ["2012-09", 12.40], ["2012-10", 11.05], ["2012-11", 12.40], ["2012-12", 13.40],
  ["2013-01", 20.35], ["2013-02", 33.50], ["2013-03", 93.50], ["2013-04", 138.00],
  ["2013-05", 128.50], ["2013-06", 98.80], ["2013-07", 104.50], ["2013-08", 129.00],
  ["2013-09", 127.50], ["2013-10", 196.00], ["2013-11", 1075.00], ["2013-12", 754.00],
  ["2014-01", 842.00], ["2014-02", 567.00], ["2014-03", 475.00], ["2014-04", 446.00],
  ["2014-05", 627.00], ["2014-06", 639.00], ["2014-07", 587.00], ["2014-08", 478.00],
  ["2014-09", 387.00], ["2014-10", 338.00], ["2014-11", 378.00], ["2014-12", 320.00],
  ["2015-01", 217.00], ["2015-02", 254.00], ["2015-03", 244.00], ["2015-04", 236.00],
  ["2015-05", 230.00], ["2015-06", 263.00], ["2015-07", 285.00], ["2015-08", 230.00],
  ["2015-09", 236.00], ["2015-10", 314.00], ["2015-11", 377.00], ["2015-12", 430.00],
  ["2016-01", 378.00], ["2016-02", 437.00], ["2016-03", 416.00], ["2016-04", 448.00],
  ["2016-05", 531.00], ["2016-06", 673.00], ["2016-07", 624.00], ["2016-08", 575.00],
  ["2016-09", 610.00], ["2016-10", 700.00], ["2016-11", 742.00], ["2016-12", 964.00],
  ["2017-01", 970.00], ["2017-02", 1190.00], ["2017-03", 1071.00], ["2017-04", 1348.00],
  ["2017-05", 2286.00], ["2017-06", 2480.00], ["2017-07", 2875.00], ["2017-08", 4700.00],
  ["2017-09", 4338.00], ["2017-10", 6460.00], ["2017-11", 10200.00], ["2017-12", 13800.00],
  ["2018-01", 10220.00], ["2018-02", 10340.00], ["2018-03", 6928.00], ["2018-04", 9244.00],
  ["2018-05", 7490.00], ["2018-06", 6385.00], ["2018-07", 7735.00], ["2018-08", 7035.00],
  ["2018-09", 6626.00], ["2018-10", 6324.00], ["2018-11", 4017.00], ["2018-12", 3742.00],
  ["2019-01", 3440.00], ["2019-02", 3817.00], ["2019-03", 4105.00], ["2019-04", 5325.00],
  ["2019-05", 8545.00], ["2019-06", 10817.00], ["2019-07", 10080.00], ["2019-08", 9630.00],
  ["2019-09", 8305.00], ["2019-10", 9202.00], ["2019-11", 7550.00], ["2019-12", 7195.00],
  ["2020-01", 9349.00], ["2020-02", 8523.00], ["2020-03", 6421.00], ["2020-04", 8660.00],
  ["2020-05", 9453.00], ["2020-06", 9137.00], ["2020-07", 11350.00], ["2020-08", 11660.00],
  ["2020-09", 10777.00], ["2020-10", 13800.00], ["2020-11", 19700.00], ["2020-12", 28990.00],
  ["2021-01", 33100.00], ["2021-02", 45140.00], ["2021-03", 58800.00], ["2021-04", 57760.00],
  ["2021-05", 37330.00], ["2021-06", 35040.00], ["2021-07", 41660.00], ["2021-08", 47150.00],
  ["2021-09", 43790.00], ["2021-10", 61300.00], ["2021-11", 57000.00], ["2021-12", 46300.00],
  ["2022-01", 38470.00], ["2022-02", 43160.00], ["2022-03", 45540.00], ["2022-04", 37610.00],
  ["2022-05", 31780.00], ["2022-06", 19940.00], ["2022-07", 23290.00], ["2022-08", 20050.00],
  ["2022-09", 19430.00], ["2022-10", 20490.00], ["2022-11", 17160.00], ["2022-12", 16540.00],
  ["2023-01", 23130.00], ["2023-02", 23140.00], ["2023-03", 28470.00], ["2023-04", 29230.00],
  ["2023-05", 27220.00], ["2023-06", 30470.00], ["2023-07", 29230.00], ["2023-08", 25930.00],
  ["2023-09", 26970.00], ["2023-10", 34630.00], ["2023-11", 37720.00], ["2023-12", 42265.00],
  ["2024-01", 42580.00], ["2024-02", 61170.00], ["2024-03", 71330.00], ["2024-04", 60630.00],
  ["2024-05", 67490.00], ["2024-06", 62680.00], ["2024-07", 64620.00], ["2024-08", 58970.00],
  ["2024-09", 63330.00], ["2024-10", 70300.00], ["2024-11", 96450.00], ["2024-12", 93420.00],
  ["2025-01", 102500.00], ["2025-02", 84320.00], ["2025-03", 82540.00], ["2025-04", 94700.00],
  ["2025-05", 104200.00], ["2025-06", 107800.00], ["2025-07", 115600.00], ["2025-08", 109400.00],
  ["2025-09", 113200.00], ["2025-10", 126080.00], ["2025-11", 91500.00], ["2025-12", 88200.00],
  ["2026-01", 96100.00],["2026-02", 88500.00],["2026-03", 86400.00],["2026-04", 84300.00],
  ["2026-05", 73800.00]
];

const priceMap = new Map(btcMonthly);
const monthKeys = btcMonthly.map(d => d[0]);
const lastIdx = btcMonthly.length - 1;
const lastKey = btcMonthly[lastIdx][0];

function idxOf(key) { return monthKeys.indexOf(key); }
function priceAt(key) { return priceMap.get(key); }
function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
}
function monthsBetween(a, b) {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

const fmtMoney = n => '$' + Math.round(n).toLocaleString('en-US');
const fmtPct = n => (n >= 0 ? '+' : '') + (n * 100).toFixed(1) + '%';
const fmtCAGR = n => (n * 100).toFixed(1) + '%';

/* ═══ §2 CHART: BTC vs S&P 500 full-range rolling CAGR ═══

  CONSERVATIVE-DATA WINDOW
  ════════════════════════
  Stats are deliberately computed from 2015-01 onwards — explicitly
  leaving out the parabolic 2013 run (1y returns >4000%) and the 2014
  drawdown (-75% 1y). Both are historically real but unrepresentative
  of plausible forward outcomes, and including them in a 'what range
  could a holder see' chart distorts the visual story. The same 2015+
  window is applied to the S&P 500 comparison so the two assets are
  apples-to-apples on time period rather than 11-year BTC vs. multi-
  decade SP500. */
const STATS_START_KEY = '2015-01';

function btcCAGRStats(months) {
  const start = monthKeys.indexOf(STATS_START_KEY);
  const cagrs = [];
  for (let i = start; i + months < btcMonthly.length; i++) {
    const p0 = btcMonthly[i][1];
    const p1 = btcMonthly[i + months][1];
    cagrs.push(Math.pow(p1 / p0, 12 / months) - 1);
  }
  cagrs.sort((a, b) => a - b);
  const median = cagrs.length % 2
    ? cagrs[(cagrs.length - 1) / 2]
    : (cagrs[cagrs.length / 2 - 1] + cagrs[cagrs.length / 2]) / 2;
  return { min: cagrs[0], median, max: cagrs[cagrs.length - 1] };
}

// S&P 500 total-return monthly data — inline (now 6th copy site-wide).
// Refactor to shared/tr-comparator-data.js is overdue; see TECH_DEBT_26.md.
// Refresh monthly per MONTHLY_REFRESH_CHECKLIST in lockstep with the other
// copies (calculators-minis.js, bitcoin-vs-the-stock-market.js, the-gallery.js
// Charts 7, 8, 10).
const SP500_TR_DATA = [
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

// S&P 500 rolling CAGR stats — same 2015+ window as BTC, computed from
// SP500_TR_DATA (monthly closes). Previously a hardcoded multi-decade
// reference (Schiller/NYU Stern); replaced for apples-to-apples on
// time period.
function spCAGRStats(months) {
  let startIdx = 0;
  for (let i = 0; i < SP500_TR_DATA.length; i++) {
    if (SP500_TR_DATA[i][0].slice(0, 7) === STATS_START_KEY) { startIdx = i; break; }
  }
  const cagrs = [];
  for (let i = startIdx; i + months < SP500_TR_DATA.length; i++) {
    const p0 = SP500_TR_DATA[i][1];
    const p1 = SP500_TR_DATA[i + months][1];
    cagrs.push(Math.pow(p1 / p0, 12 / months) - 1);
  }
  if (!cagrs.length) return { min: null, median: null, max: null };
  cagrs.sort((a, b) => a - b);
  const median = cagrs.length % 2
    ? cagrs[(cagrs.length - 1) / 2]
    : (cagrs[cagrs.length / 2 - 1] + cagrs[cagrs.length / 2]) / 2;
  return { min: cagrs[0], median, max: cagrs[cagrs.length - 1] };
}

const cagrPeriods = [12, 24, 36, 48, 60, 120];
const cagrLabels = ['1 yr', '2 yr', '3 yr', '4 yr', '5 yr', '10 yr'];
const btcStats = cagrPeriods.map(m => btcCAGRStats(m));
const spStats = cagrPeriods.map(m => spCAGRStats(m));

const cagrCtx = document.getElementById('cagrCompareChart').getContext('2d');

const cagrZeroLine = {
  id: 'cagrZeroLine',
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!scales.y) return;
    const y0 = scales.y.getPixelForValue(0);
    ctx.save();
    ctx.strokeStyle = 'rgba(232, 228, 220, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(chartArea.left, y0);
    ctx.lineTo(chartArea.right, y0);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(232, 228, 220, 0.6)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('break-even', chartArea.right - 4, y0 - 4);
    ctx.restore();
  }
};

new Chart(cagrCtx, {
  type: 'bar',
  data: {
    labels: cagrLabels,
    datasets: [
      // Bitcoin full range (min → max)
      {
        label: 'Bitcoin (full range)',
        data: btcStats.map(s => [s.min, s.max]),
        backgroundColor: 'rgba(224, 148, 34, 0.25)',
        borderColor: 'rgba(224, 148, 34, 0.65)',
        borderWidth: 1,
        barPercentage: 0.4,
        categoryPercentage: 0.85,
        order: 2
      },
      // Bitcoin median (scatter)
      {
        label: 'Bitcoin (median)',
        type: 'scatter',
        data: btcStats.map((s, i) => ({ x: cagrLabels[i], y: s.median })),
        backgroundColor: '#e09422',
        borderColor: '#e09422',
        pointRadius: 6,
        pointHoverRadius: 7,
        pointStyle: 'circle',
        showLine: false,
        order: 0
      },
      // S&P 500 full range
      {
        label: 'S&P 500 (full range)',
        data: spStats.map(s => [s.min, s.max]),
        backgroundColor: 'rgba(168, 162, 154, 0.18)',
        borderColor: 'rgba(168, 162, 154, 0.55)',
        borderWidth: 1,
        barPercentage: 0.4,
        categoryPercentage: 0.85,
        order: 3
      },
      // S&P 500 median
      {
        label: 'S&P 500 (median)',
        type: 'scatter',
        data: spStats.map((s, i) => ({ x: cagrLabels[i], y: s.median })),
        backgroundColor: '#a8a29a',
        borderColor: '#a8a29a',
        pointRadius: 6,
        pointHoverRadius: 7,
        pointStyle: 'rectRot',
        showLine: false,
        order: 1
      }
    ]
  },
  options: {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        min: -0.5,
        max: 2.0,
        ticks: {
          color: '#a8a29a',
          callback: v => (v * 100).toFixed(0) + '%',
          font: { family: 'Inter', size: 11 }
        },
        grid: { color: 'rgba(255,255,255,0.035)' },
        title: { display: true, text: 'Rolling CAGR — full range (worst to best, with median)', color: '#a8a29a', font: { family: 'Inter', size: 11, weight: '500' } }
      },
      x: {
        ticks: { color: '#a8a29a', font: { family: 'Inter', size: 12 } },
        grid: { display: false },
        title: { display: true, text: 'Holding period', color: '#a8a29a', font: { family: 'Inter', size: 11, weight: '500' } }
      }
    },
    plugins: {
      legend: { labels: { color: '#a8a29a', font: { family: 'Inter', size: 11 }, boxWidth: 14, padding: 14 }, position: 'bottom' },
      tooltip: {
        backgroundColor: '#111010',
        borderColor: '#1e1c1a',
        borderWidth: 1,
        titleColor: '#e8e4dc',
        bodyColor: '#a8a29a',
        callbacks: {
          label: ctx => {
            if (ctx.dataset.label.includes('full range')) {
              const arr = ctx.raw;
              return `${ctx.dataset.label}: ${fmtCAGR(arr[0])} to ${fmtCAGR(arr[1])}`;
            }
            return `${ctx.dataset.label}: ${fmtCAGR(ctx.parsed.y)}`;
          }
        }
      }
    }
  },
  plugins: [cagrZeroLine]
});

/* ═══ §3 CALCULATOR ═══ */
const state = {
  startDate: '2021-11',
  type: 'lump',
  amount: 10000,
  cadence: 'monthly',
  period: 48
};

let progressionChart = null;

function maxMonthsForStart(startKey) {
  // Slider clamps to today (last available data)
  return Math.max(1, monthsBetween(startKey, lastKey));
}

function updateSliderMax() {
  const max = maxMonthsForStart(state.startDate);
  const slider = document.getElementById('periodSlider');
  slider.max = max;
  if (state.period > max) {
    state.period = max;
    slider.value = max;
    document.getElementById('periodMonths').textContent = max;
  }
  // mid mark stays at 41 months unless dataset is shorter
  const midMark = Math.min(41, max);
  document.getElementById('midMark').textContent = midMark + ' months';
  // end mark shows the actual end date — "Today (Apr 2026)"
  const [ey, em] = lastKey.split('-').map(Number);
  const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][em - 1];
  document.getElementById('endMark').textContent = `Today (${monthName} ${ey})`;
}

function simulate() {
  const startKey = state.startDate;
  const sIdx = idxOf(startKey);
  if (sIdx === -1) return { invalid: true };

  const periodMonths = Math.min(state.period, maxMonthsForStart(startKey));
  const eIdx = sIdx + periodMonths;
  if (eIdx > lastIdx || periodMonths < 1) return { invalid: true };

  // Build month-by-month progression
  const trail = [];
  let btcHeld = 0, totalInvested = 0;

  if (state.type === 'lump') {
    const p0 = priceAt(startKey);
    btcHeld = state.amount / p0;
    totalInvested = state.amount;

    for (let i = sIdx; i <= eIdx; i++) {
      const month = btcMonthly[i][0];
      const price = btcMonthly[i][1];
      const value = btcHeld * price;
      trail.push({ month, value, invested: totalInvested });
    }
  } else {
    const monthlyContribution = state.cadence === 'weekly'
      ? state.amount * (52 / 12)
      : state.amount;

    for (let i = sIdx; i <= eIdx; i++) {
      const month = btcMonthly[i][0];
      const price = btcMonthly[i][1];
      btcHeld += monthlyContribution / price;
      totalInvested += monthlyContribution;
      const value = btcHeld * price;
      trail.push({ month, value, invested: totalInvested });
    }
  }

  // Compute summary stats from the trail
  const last = trail[trail.length - 1];
  const endValue = last.value;
  const endInvested = last.invested;
  const totalReturn = (endValue - endInvested) / endInvested;
  const years = periodMonths / 12;
  const cagr = years > 0 ? Math.pow(endValue / endInvested, 1 / years) - 1 : 0;

  // Max drawdown: largest deficit between value and invested at any point in trail
  let maxDeficit = 0;
  trail.forEach(p => {
    const deficit = (p.value - p.invested) / p.invested;
    if (deficit < maxDeficit) maxDeficit = deficit;
  });

  return {
    invalid: false,
    trail,
    totalInvested: endInvested,
    endValue,
    totalReturn,
    cagr,
    maxDrawdown: maxDeficit,
    periodMonths
  };
}

function renderProgressionChart(r) {
  const labels = r.trail.map(p => p.month);
  const values = r.trail.map(p => p.value);
  const invested = r.trail.map(p => p.invested);

  const data = {
    labels,
    datasets: [
      {
        label: 'Portfolio value',
        data: values,
        borderColor: '#e09422',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.15,
        fill: false
      },
      {
        label: 'Total invested',
        data: invested,
        borderColor: 'rgba(168, 162, 154, 0.6)',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0,
        fill: false
      }
    ]
  };

  // Custom plugin to shade above/below water
  const shadingPlugin = {
    id: 'aboveBelowShade',
    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!scales.x || !scales.y) return;
      const trail = r.trail;
      ctx.save();
      for (let i = 0; i < trail.length - 1; i++) {
        const x1 = scales.x.getPixelForValue(i);
        const x2 = scales.x.getPixelForValue(i + 1);
        const v1 = trail[i].value, v2 = trail[i + 1].value;
        const inv1 = trail[i].invested, inv2 = trail[i + 1].invested;
        const yV1 = scales.y.getPixelForValue(v1);
        const yV2 = scales.y.getPixelForValue(v2);
        const yI1 = scales.y.getPixelForValue(inv1);
        const yI2 = scales.y.getPixelForValue(inv2);

        // determine whether segment is above or below
        const above1 = v1 >= inv1, above2 = v2 >= inv2;

        if (above1 && above2) {
          // entirely above — shade green between curves
          ctx.fillStyle = 'rgba(139, 180, 139, 0.18)';
          ctx.beginPath();
          ctx.moveTo(x1, yV1);
          ctx.lineTo(x2, yV2);
          ctx.lineTo(x2, yI2);
          ctx.lineTo(x1, yI1);
          ctx.closePath();
          ctx.fill();
        } else if (!above1 && !above2) {
          // entirely below — shade red
          ctx.fillStyle = 'rgba(200, 106, 90, 0.22)';
          ctx.beginPath();
          ctx.moveTo(x1, yV1);
          ctx.lineTo(x2, yV2);
          ctx.lineTo(x2, yI2);
          ctx.lineTo(x1, yI1);
          ctx.closePath();
          ctx.fill();
        } else {
          // mixed — split at crossing point (linear interp)
          // value crosses invested somewhere between i and i+1
          const dv = (v2 - v1) - (inv2 - inv1);
          let t = 0.5;
          if (Math.abs(dv) > 1e-9) {
            t = (inv1 - v1) / dv;
            t = Math.max(0, Math.min(1, t));
          }
          const xC = x1 + (x2 - x1) * t;
          const yC = yV1 + (yV2 - yV1) * t;

          if (above1 && !above2) {
            ctx.fillStyle = 'rgba(139, 180, 139, 0.18)';
            ctx.beginPath();
            ctx.moveTo(x1, yV1);
            ctx.lineTo(xC, yC);
            ctx.lineTo(xC, yC);
            ctx.lineTo(x1, yI1);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(200, 106, 90, 0.22)';
            ctx.beginPath();
            ctx.moveTo(xC, yC);
            ctx.lineTo(x2, yV2);
            ctx.lineTo(x2, yI2);
            ctx.lineTo(xC, yC);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(200, 106, 90, 0.22)';
            ctx.beginPath();
            ctx.moveTo(x1, yV1);
            ctx.lineTo(xC, yC);
            ctx.lineTo(xC, yC);
            ctx.lineTo(x1, yI1);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = 'rgba(139, 180, 139, 0.18)';
            ctx.beginPath();
            ctx.moveTo(xC, yC);
            ctx.lineTo(x2, yV2);
            ctx.lineTo(x2, yI2);
            ctx.lineTo(xC, yC);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }
  };

  if (progressionChart) progressionChart.destroy();

  progressionChart = new Chart(document.getElementById('progressionChart').getContext('2d'), {
    type: 'line',
    data,
    options: {
      maintainAspectRatio: false,
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          ticks: {
            color: '#a8a29a',
            callback: v => '$' + Math.round(v).toLocaleString('en-US'),
            font: { family: 'Inter', size: 10 }
          },
          grid: { color: 'rgba(255,255,255,0.035)' }
        },
        x: {
          ticks: {
            color: '#a8a29a',
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            font: { family: 'Inter', size: 10 }
          },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { labels: { color: '#a8a29a', font: { family: 'Inter', size: 11 }, boxWidth: 14, padding: 12 }, position: 'bottom' },
        tooltip: {
          backgroundColor: '#111010',
          borderColor: '#1e1c1a',
          borderWidth: 1,
          titleColor: '#e8e4dc',
          bodyColor: '#a8a29a',
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${fmtMoney(ctx.parsed.y)}`
          }
        }
      }
    },
    plugins: [shadingPlugin]
  });
}

function render() {
  const r = simulate();
  const out = document.getElementById('outputs');

  if (r.invalid) {
    out.innerHTML = `<div class="out-card" style="grid-column:1/-1;"><div class="o-lbl">Invalid window</div><div class="o-val neg">Start date must be at least one month before today.</div></div>`;
    return;
  }

  renderProgressionChart(r);

  const positive = r.endValue >= r.totalInvested;
  const pillCls = positive ? 'positive' : 'negative';
  const pillTxt = positive ? 'Positive' : 'Negative';
  const returnCls = positive ? 'accent' : 'neg';

  // update period label
  document.getElementById('periodLabel').textContent = r.periodMonths === 1 ? 'month' : 'months';

  out.innerHTML = `
    <div class="out-card">
      <div class="o-lbl">Total invested</div>
      <div class="o-val">${fmtMoney(r.totalInvested)}</div>
    </div>
    <div class="out-card">
      <div class="o-lbl">Ending value</div>
      <div class="o-val accent">${fmtMoney(r.endValue)}</div>
    </div>
    <div class="out-card">
      <div class="o-lbl">Total return</div>
      <div class="o-val ${returnCls}">${fmtPct(r.totalReturn)}</div>
    </div>
    <div class="out-card">
      <div class="o-lbl">CAGR</div>
      <div class="o-val ${returnCls}">${fmtCAGR(r.cagr)}</div>
    </div>
    <div class="out-card">
      <div class="o-lbl">Max underwater</div>
      <div class="o-val neg">${fmtPct(r.maxDrawdown)}</div>
    </div>
    <div class="out-card">
      <div class="o-lbl">Outcome</div>
      <div class="o-val"><span class="outcome-pill ${pillCls}">${pillTxt}</span></div>
    </div>
  `;
}

function setPreset(dateKey) {
  state.startDate = dateKey;
  document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
  const match = document.querySelector(`.preset[data-date="${dateKey}"]`);
  if (match) match.classList.add('active');
  document.getElementById('datePicker').classList.remove('show');
  document.getElementById('customBtn').classList.remove('active');
  updateSliderMax();
  render();
}

document.querySelectorAll('.preset[data-date]').forEach(btn => {
  btn.addEventListener('click', () => setPreset(btn.dataset.date));
});

document.getElementById('customBtn').addEventListener('click', () => {
  document.querySelectorAll('.preset').forEach(b => b.classList.remove('active'));
  document.getElementById('customBtn').classList.add('active');
  document.getElementById('datePicker').classList.add('show');
  state.startDate = document.getElementById('customDate').value;
  updateSliderMax();
  render();
});

document.getElementById('customDate').addEventListener('change', e => {
  state.startDate = e.target.value;
  updateSliderMax();
  render();
});

document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.type = btn.dataset.type;
    document.getElementById('cadenceField').style.display = state.type === 'dca' ? 'block' : 'none';
    document.getElementById('amountLabel').textContent = state.type === 'dca'
      ? 'Per contribution (USD)'
      : 'Amount (USD)';
    document.getElementById('amount').value = state.type === 'dca' ? 200 : 10000;
    state.amount = state.type === 'dca' ? 200 : 10000;
    render();
  });
});

document.querySelectorAll('.cad-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cad-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.cadence = btn.dataset.cadence;
    render();
  });
});

document.getElementById('amount').addEventListener('input', e => {
  state.amount = Number(e.target.value) || 0;
  render();
});

document.getElementById('periodSlider').addEventListener('input', e => {
  state.period = Number(e.target.value);
  document.getElementById('periodMonths').textContent = state.period;
  render();
});

setPreset('2021-11');
