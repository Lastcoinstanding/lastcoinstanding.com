
/* ─────────────────────────────────────────
   NAV: Hamburger
───────────────────────────────────────── */
const hamburger = document.getElementById('hamburger');
const mobileOverlay = document.getElementById('mobileOverlay');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileOverlay.classList.toggle('show');
});
mobileOverlay.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileOverlay.classList.remove('show');
  });
});

/* ─────────────────────────────────────────
   TABS
───────────────────────────────────────── */
let cagrChartDrawn = false;
var pieTabMap={'slice':'your-fixed-share','energy':'network-energy'};
var pieReverseMap={};Object.keys(pieTabMap).forEach(function(k){pieReverseMap[pieTabMap[k]]=k});
function pieActivateTab(tabId){
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => {c.classList.remove('active');c.classList.add('js-hidden')});
    var btn=document.querySelector('.tab-btn[data-tab="'+tabId+'"]');
    var panel=document.getElementById('tab-'+tabId);
    if(btn)btn.classList.add('active');
    if(panel){panel.classList.add('active');panel.classList.remove('js-hidden')}
    if(tabId==='energy'&&!cagrChartDrawn){setTimeout(drawCagrChart,50);cagrChartDrawn=true}
}
function pieInitFromHash(){
    var hash=window.location.hash.replace('#','');
    if(hash&&pieReverseMap[hash]){pieActivateTab(pieReverseMap[hash])}
    else{document.querySelectorAll('.tab-content').forEach(function(c){if(!c.classList.contains('active'))c.classList.add('js-hidden')})}
}
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    pieActivateTab(btn.dataset.tab);
    history.replaceState(null,null,'#'+(pieTabMap[btn.dataset.tab]||btn.dataset.tab));
  });
window.addEventListener("hashchange",pieInitFromHash);
pieInitFromHash();
});

/* ─────────────────────────────────────────
   TAB 1: SHARE CHART
───────────────────────────────────────── */
let currentYear = 0;
let animationId = null;
let animating = false;

const yearSlider  = document.getElementById('yearSlider');
const yearDisplay = document.getElementById('yearDisplay');
const replayBtn   = document.getElementById('replayBtn');

function shareRetained(annualGrowth, year) {
  if (annualGrowth === 0) return 100;
  return 100 / Math.pow(1 + annualGrowth, year);
}

function drawShareChart(highlightYear) {
  const canvas = document.getElementById('shareChart');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth || 800;
  const h = canvas.offsetHeight || 280;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { top: 16, right: 60, bottom: 44, left: 52 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;
  const maxYear = 50;

  const xOf  = y  => pad.left + (y / maxYear) * cw;
  const yOf  = pct => pad.top + ch - (pct / 100) * ch;

  ctx.clearRect(0, 0, w, h);

  // Grid
  const gridLevels = [0, 25, 50, 75, 100];
  ctx.font = `${Math.round(10 * dpr) / dpr}px Inter, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  gridLevels.forEach(pct => {
    const y = yOf(pct);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + cw, y);
    ctx.strokeStyle = pct === 100 ? '#2a2826' : '#1e1c1a';
    ctx.lineWidth = pct === 100 ? 1.2 : 0.8;
    ctx.stroke();
    ctx.fillStyle = '#706860';
    ctx.fillText(pct + '%', pad.left - 8, y);
  });

  // X axis ticks
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#706860';
  [0, 10, 20, 30, 40, 50].forEach(yr => {
    const x = xOf(yr);
    ctx.beginPath();
    ctx.moveTo(x, pad.top + ch);
    ctx.lineTo(x, pad.top + ch + 4);
    ctx.strokeStyle = '#2a2826'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillText(yr === 0 ? 'Today' : yr, x, pad.top + ch + 8);
  });

  // X axis label
  ctx.fillStyle = '#504840';
  ctx.font = `${Math.round(9 * dpr) / dpr}px Inter, sans-serif`;
  ctx.fillText('Years', pad.left + cw / 2, pad.top + ch + 30);

  // Draw lines
  const lines = [
    { growth: 0,    color: '#F7931A', label: 'Bitcoin', lineWidth: 3 },
    { growth: 0.02, color: '#c9a84c', label: 'Gold',    lineWidth: 2 },
    { growth: 0.07, color: '#c0392b', label: 'USD',     lineWidth: 2 },
  ];

  lines.forEach(line => {
    const yearsToDraw = Math.ceil(highlightYear);

    // Shadow/glow for bitcoin
    if (line.growth === 0) {
      ctx.save();
      ctx.shadowColor = 'rgba(247,147,26,0.25)';
      ctx.shadowBlur = 8;
    }

    ctx.beginPath();
    for (let y = 0; y <= Math.min(yearsToDraw, maxYear); y++) {
      const px = xOf(y);
      const py = yOf(shareRetained(line.growth, y));
      y === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }

    // Partial last segment (smooth animation)
    const fracYear = highlightYear - Math.floor(highlightYear);
    if (fracYear > 0 && yearsToDraw <= maxYear) {
      const y0 = Math.floor(highlightYear);
      const y1 = Math.ceil(highlightYear);
      const px = xOf(y0 + fracYear);
      const py = yOf(
        shareRetained(line.growth, y0) * (1 - fracYear) +
        shareRetained(line.growth, y1) * fracYear
      );
      ctx.lineTo(px, py);
    }

    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    if (line.growth === 0) ctx.restore();

    // Draw future (dim) part - only if not animating
    if (!animating && highlightYear < maxYear) {
      ctx.beginPath();
      const startY = Math.ceil(highlightYear);
      for (let y = startY; y <= maxYear; y++) {
        const px = xOf(y);
        const py = yOf(shareRetained(line.growth, y));
        y === startY ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = line.color;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = line.lineWidth;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // End label at right edge (at highlightYear position)
    const endY = Math.min(highlightYear, maxYear);
    const labelX = xOf(endY) + 6;
    const labelY = yOf(shareRetained(line.growth, endY));
    ctx.font = `600 ${Math.round(10 * dpr) / dpr}px Inter, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = line.color;
    // Only show label if close to right edge
    if (endY >= maxYear * 0.85 || !animating) {
      const pct = shareRetained(line.growth, endY);
      ctx.fillText(line.label, labelX, labelY + (line.growth === 0 ? -8 : 0));
    }
  });

  // Cursor line at highlightYear
  const cx = xOf(highlightYear);
  ctx.beginPath();
  ctx.moveTo(cx, pad.top);
  ctx.lineTo(cx, pad.top + ch);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Dots at cursor
  [
    { growth: 0,    color: '#F7931A' },
    { growth: 0.02, color: '#c9a84c' },
    { growth: 0.07, color: '#c0392b' },
  ].forEach(({ growth, color }) => {
    const pct = shareRetained(growth, highlightYear);
    const dotX = cx, dotY = yOf(pct);
    ctx.beginPath();
    ctx.arc(dotX, dotY, growth === 0 ? 5 : 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#0a0908';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function updateStatCards(year) {
  const fiatPct  = shareRetained(0.07, year);
  const goldPct  = shareRetained(0.02, year);
  const btcPct   = 100;

  const fmt = v => v >= 99.9 ? '100%' : v.toFixed(1) + '%';

  document.getElementById('fiatShare').textContent = fmt(fiatPct);
  document.getElementById('goldShare').textContent = fmt(goldPct);
  document.getElementById('btcShare').textContent  = fmt(btcPct);

  const yr = Math.round(year);

  if (yr === 0) {
    document.getElementById('fiatSub').textContent    = 'of original position retained';
    document.getElementById('goldSub').textContent    = 'of original position retained';
    document.getElementById('btcSub').textContent     = 'of original position retained';
    document.getElementById('fiatVerdict').textContent  = 'No years have passed yet.';
    document.getElementById('goldVerdict').textContent  = 'No years have passed yet.';
    document.getElementById('btcVerdict').textContent   = 'Structurally fixed at 21M.';
  } else {
    const fiatLost = (100 - fiatPct).toFixed(1);
    const goldLost = (100 - goldPct).toFixed(1);

    document.getElementById('fiatSub').textContent    = 'of original share remains after ' + yr + ' yr' + (yr > 1 ? 's' : '');
    document.getElementById('goldSub').textContent    = 'of original share remains after ' + yr + ' yr' + (yr > 1 ? 's' : '');
    document.getElementById('btcSub').textContent     = 'of original share - no dilution, ever';
    document.getElementById('fiatVerdict').textContent  = fiatLost + '% of your share has been quietly transferred to others by new money creation.';
    document.getElementById('goldVerdict').textContent  = goldLost + '% of your share has been diluted by new mining. The supply expands forever - silently diluting your position.';
    document.getElementById('btcVerdict').textContent   = 'Your share of 21M is identical to the day you acquired it.';
  }

  yearDisplay.textContent = yr === 0 ? '0 years' : yr + ' year' + (yr > 1 ? 's' : '');
  yearSlider.value = yr;
}

function setYear(year) {
  currentYear = year;
  drawShareChart(year);
  updateStatCards(year);
}

// Slider
yearSlider.addEventListener('input', function() {
  if (animating) return;
  setYear(+this.value);
});

// Animation
function runAnimation() {
  if (animating) return;
  animating = true;
  replayBtn.textContent = '⏸ Playing...';
  replayBtn.disabled = true;
  let t = 0;
  const target = 30;
  const duration = 3500; // ms
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    t = eased * target;
    setYear(t);
    if (progress < 1) {
      animationId = requestAnimationFrame(step);
    } else {
      animating = false;
      replayBtn.textContent = '↺ Replay animation';
      replayBtn.disabled = false;
      drawShareChart(target); // final clean draw
    }
  }
  animationId = requestAnimationFrame(step);
}

replayBtn.addEventListener('click', () => {
  if (animating) return;
  setYear(0);
  setTimeout(runAnimation, 300);
});

// Resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    drawShareChart(currentYear);
  }, 100);
});

/* ─────────────────────────────────────────
   TAB 2: CAGR CHART
───────────────────────────────────────── */
const historicalCagrs = [
  { period: '12→16', cagr: 192 },
  { period: '13→17', cagr: 170 },
  { period: '14→18', cagr: 100 },
  { period: '15→19', cagr: 96  },
  { period: '16→20', cagr: 103 },
  { period: '17→21', cagr: 140 },
  { period: '18→22', cagr: 38  },
  { period: '19→23', cagr: 48  },
  { period: '20→24', cagr: 55  },
  { period: '21→25', cagr: 31  },
];

function drawCagrChart() {
  const canvas = document.getElementById('cagrChart');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth || 800;
  const h = 220;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { top: 20, right: 20, bottom: 44, left: 50 };
  const cw  = w - pad.left - pad.right;
  const ch  = h - pad.top - pad.bottom;
  const maxCagr = 220;
  const barW = (cw / historicalCagrs.length) * 0.6;
  const gap  = cw / historicalCagrs.length;

  ctx.clearRect(0, 0, w, h);

  // Grid
  [0, 50, 100, 150, 200].forEach(v => {
    const y = pad.top + ch - (v / maxCagr) * ch;
    ctx.beginPath();
    ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y);
    ctx.strokeStyle = v === 0 ? '#2a2826' : '#1a1816';
    ctx.lineWidth = v === 0 ? 1.2 : 0.7;
    ctx.stroke();
    ctx.font = `${Math.round(9 * dpr)/dpr}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#555048';
    if (v <= 200) ctx.fillText(v + '%', pad.left - 6, y);
  });

  // Bars
  historicalCagrs.forEach((d, i) => {
    const bx  = pad.left + i * gap + (gap - barW) / 2;
    const bh  = Math.min(d.cagr / maxCagr, 1) * ch;
    const by  = pad.top + ch - bh;
    const clampedNote = d.cagr > maxCagr;

    // Color: gradient warm to less warm based on value
    const intensity = Math.min(d.cagr / 200, 1);
    const r = Math.round(247);
    const g = Math.round(100 + 47 * intensity);
    const b = Math.round(26);
    const alpha = 0.4 + intensity * 0.5;

    // Bar fill
    const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
    grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
    grad.addColorStop(1, `rgba(${r},${g},${b},${alpha * 0.4})`);

    ctx.fillStyle = grad;
    const radius = 3;
    ctx.beginPath();
    ctx.moveTo(bx + radius, by);
    ctx.lineTo(bx + barW - radius, by);
    ctx.arcTo(bx + barW, by, bx + barW, by + radius, radius);
    ctx.lineTo(bx + barW, by + bh);
    ctx.lineTo(bx, by + bh);
    ctx.arcTo(bx, by, bx + radius, by, radius);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Value label on top
    ctx.font = `600 ${Math.round(9 * dpr)/dpr}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
    const labelText = clampedNote ? d.cagr + '%↑' : d.cagr + '%';
    ctx.fillText(labelText, bx + barW / 2, by - 3);

    // Period label below
    ctx.font = `${Math.round(8.5 * dpr)/dpr}px Inter, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#706860';
    ctx.fillText(d.period, bx + barW / 2, pad.top + ch + 8);
  });

  // "All positive ↑" annotation
  ctx.font = `italic ${Math.round(9 * dpr)/dpr}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(247,147,26,0.4)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('← all windows positive', pad.left + 4, pad.top + ch + 28);
}

/* ─────────────────────────────────────────
   TAB 2: PROJECTION
───────────────────────────────────────── */
const posSlider   = document.getElementById('posSlider');
const cagrSlider  = document.getElementById('cagrSlider');
const posDisplay  = document.getElementById('posDisplay');
const cagrDisplay = document.getElementById('cagrDisplay');

function fmtMoney(n) {
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1)  + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2)  + 'M';
  if (n >= 1e3)  return '$' + Math.round(n / 100) * 100 >= 1000
    ? '$' + (n / 1e3).toFixed(1) + 'K' : '$' + n;
  return '$' + Math.round(n);
}

function fmtK(n) {
  if (n >= 1e9) return '$' + (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + Math.round(n/1000) + 'K';
  return '$' + Math.round(n);
}

function updateProjection() {
  const pos  = +posSlider.value;
  const cagr = +cagrSlider.value / 100;

  posDisplay.textContent  = fmtK(pos);
  cagrDisplay.textContent = (+cagrSlider.value) + '%';

  const p4  = pos * Math.pow(1 + cagr, 4);
  const p8  = pos * Math.pow(1 + cagr, 8);
  const p12 = pos * Math.pow(1 + cagr, 12);

  document.getElementById('proj4').textContent  = fmtK(p4);
  document.getElementById('proj8').textContent  = fmtK(p8);
  document.getElementById('proj12').textContent = fmtK(p12);

  document.getElementById('mult4').textContent  = (p4/pos).toFixed(1)  + '× your position';
  document.getElementById('mult8').textContent  = (p8/pos).toFixed(1)  + '× your position';
  document.getElementById('mult12').textContent = (p12/pos).toFixed(1) + '× your position';
}

posSlider.addEventListener('input',  updateProjection);
cagrSlider.addEventListener('input', updateProjection);

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
// Init Tab 1 chart
requestAnimationFrame(() => {
  drawShareChart(0);
  updateStatCards(0);
  setTimeout(runAnimation, 600);
});

// Init Tab 2 projection
updateProjection();
