
/*
  BTC monthly close dataset — APPROXIMATE / PLACEHOLDER
  Production replaces with the cached Blockchain.info JSON used on the Power Law page.
*/
/* BTC_MONTHLY: see shared/btc-monthly-data.js (loaded before this script). */
const priceMap = new Map(BTC_MONTHLY);
const monthKeys = BTC_MONTHLY.map(d => d[0]);
const lastIdx = BTC_MONTHLY.length - 1;
const lastKey = BTC_MONTHLY[lastIdx][0];

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
  for (let i = start; i + months < BTC_MONTHLY.length; i++) {
    const p0 = BTC_MONTHLY[i][1];
    const p1 = BTC_MONTHLY[i + months][1];
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
/* SP500_TR_DATA: see shared/tr-comparator-data.js (loaded before this script). */
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
      const month = BTC_MONTHLY[i][0];
      const price = BTC_MONTHLY[i][1];
      const value = btcHeld * price;
      trail.push({ month, value, invested: totalInvested });
    }
  } else {
    const monthlyContribution = state.cadence === 'weekly'
      ? state.amount * (52 / 12)
      : state.amount;

    for (let i = sIdx; i <= eIdx; i++) {
      const month = BTC_MONTHLY[i][0];
      const price = BTC_MONTHLY[i][1];
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
