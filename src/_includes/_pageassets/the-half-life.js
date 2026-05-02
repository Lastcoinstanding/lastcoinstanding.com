
function showTab(id){document.querySelectorAll('.tab-content').forEach(function(t){t.classList.remove('active')});document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});document.getElementById('tab-'+id).classList.add('active');var m={interactive:0,history:1,takeaway:2};document.querySelectorAll('.tab-btn')[m[id]].classList.add('active');document.querySelector('.tab-nav').scrollIntoView({behavior:'smooth',block:'start'})}

// Inflation state — driven entirely by the sitewide ModelingAssumptions API.
// fiatRate is computed from the current preset/customValue on every read.
function getFiatRate() {
  return window.ModelingAssumptions.get('inflation').value;
}

// Half-life uses the canonical math helper (ln(2)/ln(1+r))
function halfLife(rate) {
  return window.CalcHelpers.purchasingPowerHalfLife(rate);
}

function setFiat(b) {
  var preset = b.dataset.preset;
  // Toggle visual selection
  document.querySelectorAll('#fiatBtns .opt-btn').forEach(function(x) { x.classList.remove('sel-fiat'); });
  b.classList.add('sel-fiat');

  // Show or hide custom input row
  var customRow = document.getElementById('customRateRow');
  if (preset === 'custom') {
    customRow.style.display = '';
    var input = document.getElementById('customRateInput');
    var current = window.ModelingAssumptions.get('inflation');
    // If we have a stored custom value, surface it; otherwise leave the field empty
    var stored = parseFloat(localStorage.getItem('lcs.inflation.customValue'));
    if (isFinite(stored)) {
      input.value = stored;
      window.ModelingAssumptions.set('inflation', 'custom', stored);
    } else {
      input.value = '';
      input.focus();
      // Don't write a custom preset until user actually enters a value
      return;
    }
  } else {
    customRow.style.display = 'none';
    window.ModelingAssumptions.set('inflation', preset);
  }
  updateDecay();
}

// Wire up the custom-rate input: writes through to ModelingAssumptions on change
function bindCustomRateInput() {
  var input = document.getElementById('customRateInput');
  if (!input) return;
  input.addEventListener('input', function() {
    var v = parseFloat(input.value);
    if (isFinite(v)) {
      window.ModelingAssumptions.set('inflation', 'custom', v);
      updateDecay();
    }
  });
}

function resetFiat(e) {
  e.preventDefault();
  window.ModelingAssumptions.reset();
  syncFiatUI();
  updateDecay();
}

// Sync the button group + custom-input UI to match the current ModelingAssumptions state.
// Called on page load and on cross-tab storage events.
function syncFiatUI() {
  var current = window.ModelingAssumptions.get('inflation');
  document.querySelectorAll('#fiatBtns .opt-btn').forEach(function(btn) {
    if (btn.dataset.preset === current.preset) {
      btn.classList.add('sel-fiat');
    } else {
      btn.classList.remove('sel-fiat');
    }
  });
  var customRow = document.getElementById('customRateRow');
  if (current.preset === 'custom') {
    customRow.style.display = '';
    var input = document.getElementById('customRateInput');
    if (input.value === '' || parseFloat(input.value) !== current.value) {
      input.value = current.value;
    }
  } else {
    customRow.style.display = 'none';
  }
}

function drawDecayCurve() {
  var canvas = document.getElementById('decayChart');
  if (!canvas) return;
  var fiatRate = getFiatRate();
  var ctx = canvas.getContext('2d');
  var wrap = canvas.parentElement;
  var dpr = window.devicePixelRatio || 1;

  canvas.width = wrap.clientWidth * dpr;
  canvas.height = wrap.clientHeight * dpr;
  canvas.style.width = wrap.clientWidth + 'px';
  canvas.style.height = wrap.clientHeight + 'px';
  ctx.scale(dpr, dpr);

  var W = wrap.clientWidth;
  var H = wrap.clientHeight;
  var pad = { t: 20, r: 20, b: 36, l: 48 };
  var cW = W - pad.l - pad.r;
  var cH = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);

  // Scale: Y = $0–$100, X = 0–30 years
  var maxYears = 30;
  function xP(yr) { return pad.l + (yr / maxYears) * cW; }
  function yP(val) { return pad.t + (1 - val / 100) * cH; }

  var hl = halfLife(fiatRate);

  // Grid lines (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,.04)';
  ctx.lineWidth = 1;
  [75, 50, 25].forEach(function(v) {
    ctx.beginPath(); ctx.moveTo(pad.l, yP(v)); ctx.lineTo(pad.l + cW, yP(v)); ctx.stroke();
  });

  // Y-axis labels
  ctx.fillStyle = 'rgba(255,255,255,.2)';
  ctx.font = '500 10px Inter, sans-serif';
  ctx.textAlign = 'right';
  [100, 75, 50, 25, 0].forEach(function(v) {
    ctx.fillText('$' + v, pad.l - 8, yP(v) + 4);
  });

  // X-axis labels
  ctx.textAlign = 'center';
  [0, 5, 10, 15, 20, 25, 30].forEach(function(yr) {
    ctx.fillText(yr + 'y', xP(yr), pad.t + cH + 20);
  });
  ctx.textAlign = 'left';

  // --- $50 dashed line ---
  ctx.strokeStyle = 'rgba(192,57,43,.35)';
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, yP(50));
  ctx.lineTo(xP(Math.min(hl, maxYears)), yP(50));
  ctx.stroke();
  ctx.setLineDash([]);

  // $50 label
  ctx.fillStyle = 'rgba(192,57,43,.5)';
  ctx.font = '600 10px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('$50', pad.l - 8, yP(50) + 4);
  ctx.textAlign = 'left';

  // --- Vertical dashed line at half-life point ---
  if (hl <= maxYears) {
    ctx.strokeStyle = 'rgba(192,57,43,.35)';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(xP(hl), yP(50));
    ctx.lineTo(xP(hl), pad.t + cH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // --- Fill area under curve (loss area) ---
  ctx.beginPath();
  ctx.moveTo(xP(0), yP(100));
  for (var yr = 0; yr <= maxYears; yr += 0.5) {
    var val = 100 / Math.pow(1 + fiatRate / 100, yr);
    ctx.lineTo(xP(yr), yP(Math.max(val, 0)));
  }
  ctx.lineTo(xP(maxYears), yP(100));
  ctx.closePath();
  ctx.fillStyle = 'rgba(192,57,43,.06)';
  ctx.fill();

  // --- The decay curve ---
  // Glow
  ctx.strokeStyle = 'rgba(192,57,43,.2)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  for (yr = 0; yr <= maxYears; yr += 0.5) {
    var val = 100 / Math.pow(1 + fiatRate / 100, yr);
    var px = xP(yr), py = yP(Math.max(val, 0));
    yr === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Main line
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (yr = 0; yr <= maxYears; yr += 0.5) {
    var val = 100 / Math.pow(1 + fiatRate / 100, yr);
    var px = xP(yr), py = yP(Math.max(val, 0));
    yr === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.stroke();

  // --- Intersection dot ---
  if (hl <= maxYears) {
    var dotX = xP(hl), dotY = yP(50);

    // Outer glow
    ctx.beginPath();
    ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(192,57,43,.2)';
    ctx.fill();

    // Inner dot
    ctx.beginPath();
    ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#c0392b';
    ctx.fill();

    // Label above the dot
    ctx.fillStyle = '#c0392b';
    ctx.font = '700 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(hl.toFixed(1) + ' years', dotX, dotY - 14);
    ctx.textAlign = 'left';
  }

  // $100 start label
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.font = '500 10px Inter, sans-serif';
  ctx.fillText('$100', pad.l + 4, yP(100) + 14);
}

function updateDecay() {
  var fiatRate = getFiatRate();
  var hl = halfLife(fiatRate);
  document.getElementById('fiatHL').textContent = isFinite(hl) ? hl.toFixed(1) : '\u221E';

  drawDecayCurve();

  // Update contextual note based on rate band (canonical thresholds map to
  // CPI Official 3.5%, M2 growth 6.5%, Shadow Stats 8%, plus Custom)
  var noteEl = document.getElementById('decayNote');
  if (fiatRate <= 4) {
    noteEl.textContent = 'Even at the government\u2019s own CPI figure, your dollar loses half of its value in about 20 years. And most economists agree that CPI understates real inflation.';
  } else if (fiatRate <= 7) {
    noteEl.textContent = 'At the 50-year average rate of M2 money supply growth \u2014 the most accurate measure of monetary debasement \u2014 your dollar\u2019s half-life is about 11 years. What used to take a generation to debase 50% now takes about a decade.';
  } else if (fiatRate <= 10) {
    noteEl.textContent = 'Using pre-1980 CPI methodology, the dollar\u2019s half-life compresses to about 9 years. The methodology revisions since then have systematically reduced reported inflation, but the underlying monetary expansion continued.';
  } else {
    noteEl.textContent = 'At rates this high, the dollar\u2019s half-life compresses to a handful of years. This is the territory of currency crises and emerging-market debasement \u2014 not a stable store of value.';
  }
}

window.addEventListener('load', function() {
  syncFiatUI();
  bindCustomRateInput();
  updateDecay();
});
window.addEventListener('resize', drawDecayCurve);

// Subscribe to canonical changes (e.g. cross-tab updates, reset events)
if (window.ModelingAssumptions && window.ModelingAssumptions.subscribe) {
  window.ModelingAssumptions.subscribe(function(dim) {
    if (dim === 'inflation' || dim === '*') {
      syncFiatUI();
      updateDecay();
    }
  });
}
