
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
  ["2026-01", 96100.00], ["2026-02", 88500.00], ["2026-03", 86400.00], ["2026-04", 84300.00]
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

/* ═══ §2 CHART: BTC vs S&P 500 full-range rolling CAGR ═══ */
function btcCAGRStats(months) {
  const start = monthKeys.indexOf('2013-01');
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

// S&P 500 — approximate min/median/max rolling CAGR by holding period.
// Sources: long-run total-return historical data (Schiller, NYU Stern).
// Min values: worst rolling-period drawdowns (1929-32, 2007-09).
// Max values: best rolling-period bull runs (1949-66, 1990s).
// Medians: approximate central tendency across all rolling windows since 1928.
const sp500Stats = {
  12: { min: -0.43, median: 0.10, max: 0.54 },
  24: { min: -0.226, median: 0.095, max: 0.41 },
  36: { min: -0.161, median: 0.092, max: 0.32 },
  48: { min: -0.104, median: 0.090, max: 0.28 },
  60: { min: -0.066, median: 0.089, max: 0.24 },
  120: { min: -0.014, median: 0.088, max: 0.20 }
};

const cagrPeriods = [12, 24, 36, 48, 60, 120];
const cagrLabels = ['1 yr', '2 yr', '3 yr', '4 yr', '5 yr', '10 yr'];
const btcStats = cagrPeriods.map(m => btcCAGRStats(m));
const spStats = cagrPeriods.map(m => sp500Stats[m]);

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
