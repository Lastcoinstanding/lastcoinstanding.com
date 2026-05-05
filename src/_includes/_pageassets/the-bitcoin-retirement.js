/* The Bitcoin Retirement — page scripts
 * Phase 3 / commit 1: tab switching only.
 * The shared modeling-assumptions API and per-page interactivity
 * (slider clusters, math engine, chart, baseline cluster) land across
 * commits 2–7.
 */

(function(){
  var btns = document.querySelectorAll('.tab-btn');
  if (!btns.length) return;

  function activate(tabKey) {
    btns.forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(t){ t.classList.remove('active'); });
    var btn = document.querySelector('[data-tab="' + tabKey + '"]');
    var pane = document.getElementById('tab-' + tabKey);
    if (btn) btn.classList.add('active');
    if (pane) pane.classList.add('active');
  }

  btns.forEach(function(b){
    b.addEventListener('click', function(){
      var key = b.dataset.tab;
      activate(key);
      // Update URL hash without scrolling
      if (history.replaceState) {
        history.replaceState(null, '', '#' + key);
      }
    });
  });

  // Hash deep-linking on page load
  if (window.location.hash) {
    var hash = window.location.hash.replace('#','');
    if (document.querySelector('[data-tab="' + hash + '"]')) {
      activate(hash);
    }
  }
})();

/* ════════════════════════════════════════════════════════════════
   Phase 3 / commit 2 — Baseline assumptions cluster
   Wires the picker UI to the shared ModelingAssumptions API.
   Three pickers: Inflation (4 cards), Bitcoin growth model (3 cards),
   Traditional portfolio benchmark (3 cards). Plus Hide affordance,
   Custom inflation inline input, Reset link.
   See RETIREMENT_CALCULATOR_DESIGN §9.2.9.
═══════════════════════════════════════════════════════════════════ */

(function(){
  if (!window.ModelingAssumptions) return; // graceful no-op if shared script absent

  var MA = window.ModelingAssumptions;
  var STORAGE_KEY_BASELINE_HIDDEN = 'lcs.theBitcoinRetirement.baselineHidden';

  // ─── Picker rendering: reflect canonical state into card .active classes
  function renderPicker(dim) {
    var grid = document.querySelector('.picker[data-dim="' + dim + '"]');
    if (!grid) return;
    var current = MA.get(dim);
    var cards = grid.querySelectorAll('.picker-card');
    cards.forEach(function(card){
      if (card.dataset.preset === current.preset) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
    // Reveal/hide custom inflation input
    if (dim === 'inflation') {
      var wrap = document.getElementById('inflationCustomWrap');
      var input = document.getElementById('inflationCustom');
      if (wrap && input) {
        if (current.preset === 'custom') {
          wrap.hidden = false;
          // Sync visible value from canonical (only if input is not focused mid-edit)
          if (document.activeElement !== input) {
            var v = current.value;
            if (isFinite(v)) input.value = v;
          }
        } else {
          wrap.hidden = true;
        }
      }
    }
  }
  function renderAll() {
    renderPicker('inflation');
    renderPicker('btcGrowthModel');
    renderPicker('realReturns');
  }

  // ─── Picker click delegation
  function bindPicker(dim) {
    var grid = document.querySelector('.picker[data-dim="' + dim + '"]');
    if (!grid) return;
    grid.addEventListener('click', function(e){
      var card = e.target.closest('.picker-card');
      if (!card || !grid.contains(card)) return;
      var preset = card.dataset.preset;
      if (!preset) return;
      try { MA.set(dim, preset); } catch (err) { /* unknown preset — ignore */ }
      // For Custom inflation, focus the input so the user can type immediately
      if (dim === 'inflation' && preset === 'custom') {
        var input = document.getElementById('inflationCustom');
        if (input) {
          // wait for the wrap to un-hide via renderPicker (subscribe callback)
          setTimeout(function(){ input.focus(); input.select(); }, 0);
        }
      }
    });
  }

  // ─── Custom inflation input — write back to canonical on change
  function bindCustomInflationInput() {
    var input = document.getElementById('inflationCustom');
    if (!input) return;
    function commit() {
      var v = parseFloat(input.value);
      if (!isFinite(v)) return;
      try { MA.set('inflation', 'custom', v); } catch (err) {}
    }
    // Debounce while typing; commit on blur and Enter
    var t = null;
    input.addEventListener('input', function(){
      if (t) clearTimeout(t);
      t = setTimeout(commit, 200);
    });
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function(e){
      if (e.key === 'Enter') { e.preventDefault(); commit(); input.blur(); }
    });
  }

  // ─── Hide / Show baseline cluster body, with localStorage persistence
  function bindHideToggle() {
    var cluster = document.getElementById('baselineCluster');
    var toggle = document.getElementById('baselineToggle');
    if (!cluster || !toggle) return;
    function applyState(hidden) {
      cluster.classList.toggle('collapsed', hidden);
      toggle.textContent = hidden ? 'Show baseline assumptions' : 'Hide';
      try { localStorage.setItem(STORAGE_KEY_BASELINE_HIDDEN, hidden ? '1' : '0'); } catch(e) {}
    }
    // Initial state from storage
    var initiallyHidden = false;
    try { initiallyHidden = localStorage.getItem(STORAGE_KEY_BASELINE_HIDDEN) === '1'; } catch(e) {}
    if (initiallyHidden) applyState(true);
    else toggle.textContent = 'Hide';
    toggle.addEventListener('click', function(e){
      e.preventDefault();
      applyState(!cluster.classList.contains('collapsed'));
    });
  }

  // ─── Reset baseline link — clear all canonical baseline values
  function bindResetLink() {
    var link = document.getElementById('baselineReset');
    if (!link) return;
    link.addEventListener('click', function(e){
      e.preventDefault();
      // ModelingAssumptions.reset() clears every dimension. That includes
      // realEstate (which this page doesn't expose) — fine; resetting an
      // unused dimension is a harmless no-op for this page.
      MA.reset();
      // Subscribe callback below will renderAll(); explicit call is just defense.
      renderAll();
    });
  }

  // ─── Cross-tab sync: re-render when any baseline dim changes
  if (MA.subscribe) {
    MA.subscribe(function(dim){
      if (dim === 'inflation' || dim === '*') renderPicker('inflation');
      if (dim === 'btcGrowthModel' || dim === '*') renderPicker('btcGrowthModel');
      if (dim === 'realReturns' || dim === '*') renderPicker('realReturns');
    });
  }

  // ─── Initial wire-up
  renderAll();
  bindPicker('inflation');
  bindPicker('btcGrowthModel');
  bindPicker('realReturns');
  bindCustomInflationInput();
  bindHideToggle();
  bindResetLink();
})();

/* ════════════════════════════════════════════════════════════════
   Phase 3 / commit 3 — Projection chart + status line
   First commit where the new math runs end-to-end. Renders Power Law
   trend / floor / upper-band lines (with §7.3 asymmetric treatment)
   plus the user's stack-drawdown line under sell-as-needed math. The
   default scenario is hardcoded for now; commit 4 wires sliders.
   See RETIREMENT_CALCULATOR_DESIGN §7.3, §9.2 architecture diagram.
═══════════════════════════════════════════════════════════════════ */

(function(){
  if (typeof Chart === 'undefined') return;
  if (!window.ModelingAssumptions) return;

  // ─── Power Law constants (canonical, mirroring the-power-law.js)
  var PL_A = 1.6e-17;
  var PL_B = 5.77;
  var PL_FLOOR = 0.42;
  var PL_CEIL = 3.0;
  var GENESIS = new Date(Date.UTC(2009, 0, 3)); // Jan 3, 2009 UTC

  // CoinGecko fallback if live fetch fails (updated periodically)
  var LIVE_BTC_FALLBACK = 108000;

  function daysSince(date) {
    return (date.getTime() - GENESIS.getTime()) / (1000 * 60 * 60 * 24);
  }
  function plPrice(days) {
    return PL_A * Math.pow(days, PL_B);
  }
  function plPriceAtDate(date) { return plPrice(daysSince(date)); }
  function dateForYear(year) {
    var today = new Date();
    return new Date(year, today.getMonth(), today.getDate());
  }

  // ─── Default scenario (hardcoded for commit 3; commit 4 wires sliders)
  var DEFAULT_SCENARIO = {
    btcStack: 1.0,
    targetIncomeUSD: 100000,
    retirementYear: 2045,
    yearsInRetirement: 30,
    withdrawalRatePct: 6,    // unused in commit 3's simple income-driven drawdown
    monthlyDcaUSD: 0
  };

  // ─── Project user's stack value year-by-year under sell-as-needed
  // For commit 3: pre-retirement BTC count constant (DCA=$0). Post-retirement,
  // sell each year enough BTC to cover nominal target income. Returns
  // {points, depletionYear} where points is [{x:year, y:usdValue}].
  function projectStackOverTime(scenario, growthModelKey, inflationPct) {
    var today = new Date();
    var startYear = today.getFullYear();
    var endYear = scenario.retirementYear + scenario.yearsInRetirement;
    var infl = inflationPct / 100;

    var stackBtc = scenario.btcStack;
    var points = [];
    var depletionYear = null;

    // Choose which growth-model trajectory drives the value-projection math.
    // For commit 3, all three options use Power Law trajectories at different
    // bands; commit 7 introduces the Linear-CAGR-with-decay variant.
    function projPrice(date) {
      var trend = plPriceAtDate(date);
      if (growthModelKey === 'powerlaw-floor') return trend * PL_FLOOR;
      // 'powerlaw-trend' (default) and 'linear-cagr-decay' both use trend in commit 3
      return trend;
    }

    for (var y = startYear; y <= endYear; y++) {
      var d = dateForYear(y);
      var price = projPrice(d);

      if (y < scenario.retirementYear) {
        // Pre-retirement: the user "is" the chosen growth-model curve
        // (no separate drawdown line drawn — would just overlay trend/floor
        // exactly at btcStack=1, which collides visually). Track BTC count
        // forward in case future commits add DCA accumulation.
        // No point pushed for the chart here.
      } else if (y === scenario.retirementYear) {
        // Drawdown line begins here, anchored at the user's stack value
        // (btcStack × growth-model price at retirement).
        points.push({ x: y, y: stackBtc * price });
      } else {
        // Post-retirement: sell BTC to cover nominal target income
        var yearsFromToday = y - startYear;
        var nominalIncome = scenario.targetIncomeUSD * Math.pow(1 + infl, yearsFromToday);
        var btcNeeded = nominalIncome / price;
        stackBtc = Math.max(0, stackBtc - btcNeeded);
        if (stackBtc <= 0 && depletionYear === null) {
          depletionYear = y;
        }
        points.push({ x: y, y: stackBtc * price });
      }
    }
    return { points: points, depletionYear: depletionYear, startYear: startYear, endYear: endYear };
  }

  // ─── Build trend / floor / upper-band point arrays for the chart's bands
  function buildBands(startYear, endYear) {
    var trend = [], floor = [], upper = [];
    for (var y = startYear; y <= endYear; y++) {
      var d = dateForYear(y);
      var t = plPriceAtDate(d);
      trend.push({ x: y, y: t });
      floor.push({ x: y, y: t * PL_FLOOR });
      upper.push({ x: y, y: t * PL_CEIL });
    }
    return { trend: trend, floor: floor, upper: upper };
  }

  // ─── Vertical-line plugin: draws a dashed marker at a given x-axis value
  var verticalLinePlugin = {
    id: 'verticalMarkers',
    afterDraw: function(chart) {
      var markers = chart.options.plugins.verticalMarkers && chart.options.plugins.verticalMarkers.lines;
      if (!markers || !markers.length) return;
      var ctx = chart.ctx;
      var xScale = chart.scales.x, yScale = chart.scales.y;
      ctx.save();
      markers.forEach(function(m) {
        var xPx = xScale.getPixelForValue(m.x);
        ctx.strokeStyle = m.color || 'rgba(236,228,214,0.35)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(xPx, yScale.top);
        ctx.lineTo(xPx, yScale.bottom);
        ctx.stroke();
        // Label at top of plot area
        if (m.label) {
          ctx.setLineDash([]);
          ctx.fillStyle = m.labelColor || '#ece4d6';
          ctx.font = '500 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.label, xPx, yScale.top - 6);
        }
      });
      ctx.restore();
    }
  };

  // ─── Chart instance + render/update
  var chart = null;
  function renderChart() {
    var canvas = document.getElementById('projectionChart');
    if (!canvas) return;

    var growth = window.ModelingAssumptions.get('btcGrowthModel');
    var inflation = window.ModelingAssumptions.get('inflation');

    var startYear = (new Date()).getFullYear();
    var endYear = DEFAULT_SCENARIO.retirementYear + DEFAULT_SCENARIO.yearsInRetirement;
    var bands = buildBands(startYear, endYear);
    var stack = projectStackOverTime(DEFAULT_SCENARIO, growth.preset, inflation.value);

    // Update title to reflect the chart's actual time range
    var titleEl = document.getElementById('projectionTitle');
    if (titleEl) titleEl.textContent = 'Projected stack value, ' + startYear + ' \u2013 ' + endYear;

    var datasets = [
      // ─── Floor band — confident dashed (planning-grade anchor per §7.3) ───
      {
        label: 'Floor (0.42\u00d7 trend)',
        data: bands.floor,
        type: 'line',
        borderColor: 'rgba(224,148,34,0.7)',
        borderWidth: 1.6,
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 4
      },
      // ─── Trend — solid (central case) ───
      {
        label: 'Trend',
        data: bands.trend,
        type: 'line',
        borderColor: '#e09422',
        borderWidth: 2.5,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 3
      },
      // ─── Upper band — sparse dashed, low opacity (§7.3 visual de-emphasis) ───
      {
        label: 'Upper (3\u00d7 trend) \u2014 spike, not plateau',
        data: bands.upper,
        type: 'line',
        borderColor: 'rgba(224,148,34,0.30)',
        borderWidth: 1.2,
        borderDash: [1, 6],
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 5
      },
      // ─── User's stack drawdown — solid white-ish, primary visual weight ───
      {
        label: 'Your stack (drawdown)',
        data: stack.points,
        type: 'line',
        borderColor: '#ece4d6',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 2
      }
    ];

    var verticalLines = [
      { x: startYear, label: 'Today', color: 'rgba(224,148,34,0.45)', labelColor: '#e09422' },
      { x: DEFAULT_SCENARIO.retirementYear, label: 'Retirement (' + DEFAULT_SCENARIO.retirementYear + ')', color: 'rgba(236,228,214,0.35)', labelColor: '#ece4d6' }
    ];
    if (stack.depletionYear) {
      verticalLines.push({ x: stack.depletionYear, label: 'Stack depleted (' + stack.depletionYear + ')', color: 'rgba(236,228,214,0.25)', labelColor: 'rgba(236,228,214,0.7)' });
    }

    if (chart) {
      chart.data.datasets = datasets;
      chart.options.plugins.verticalMarkers.lines = verticalLines;
      chart.update();
      return;
    }

    var ctx = canvas.getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: { datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        animation: { duration: 250 },
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 28, right: 8 } },
        scales: {
          x: {
            type: 'linear',
            min: startYear,
            max: endYear,
            title: { display: false },
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: {
              color: '#5a5247',
              font: { family: 'Inter, sans-serif', size: 10 },
              stepSize: 10,
              callback: function(v){ return Math.round(v); }
            }
          },
          y: {
            type: 'logarithmic',
            position: 'left',
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: {
              color: '#5a5247',
              font: { family: 'Inter, sans-serif', size: 10 },
              callback: function(v){
                if (v >= 1e9) return '$' + (v/1e9).toFixed(0) + 'B';
                if (v >= 1e6) return '$' + (v/1e6).toFixed(0) + 'M';
                if (v >= 1e3) return '$' + (v/1e3).toFixed(0) + 'K';
                return '$' + v.toFixed(0);
              }
            }
          }
        },
        plugins: {
          legend: { display: false }, // we render our own legend in the header
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)',
            borderColor: 'rgba(224,148,34,0.30)',
            borderWidth: 1,
            titleColor: '#ece4d6',
            bodyColor: '#ccc6b8',
            padding: 10,
            displayColors: true,
            callbacks: {
              title: function(items){ return items[0] && items[0].parsed ? 'Year ' + Math.round(items[0].parsed.x) : ''; },
              label: function(ctx){
                var v = ctx.parsed.y;
                var label = ctx.dataset.label || '';
                if (!isFinite(v)) return label;
                var formatted;
                if (v >= 1e9) formatted = '$' + (v/1e9).toFixed(2) + 'B';
                else if (v >= 1e6) formatted = '$' + (v/1e6).toFixed(2) + 'M';
                else if (v >= 1e3) formatted = '$' + (v/1e3).toFixed(0) + 'K';
                else formatted = '$' + v.toFixed(0);
                return label + ': ' + formatted;
              }
            }
          },
          verticalMarkers: { lines: verticalLines }
        }
      },
      plugins: [verticalLinePlugin]
    });
  }

  // ─── Status line: live BTC price + ratio to today's Power Law trend
  //                  + dynamic percentile (where current price sits in
  //                  the historical distribution of trend ratios)
  function updateStatusLine(currentPrice, source) {
    var priceEl = document.getElementById('statusPrice');
    var ratioEl = document.getElementById('statusRatio');
    var pctEl = document.getElementById('statusPercentile');
    if (!priceEl || !ratioEl) return;
    var todayTrend = plPriceAtDate(new Date());
    var ratio = currentPrice / todayTrend;
    priceEl.textContent = '$' + Math.round(currentPrice).toLocaleString();
    ratioEl.textContent = ratio.toFixed(2) + '\u00d7';
    if (pctEl && window.CalcHelpers && window.CalcHelpers.percentileBelowRatio) {
      var pct = window.CalcHelpers.percentileBelowRatio(ratio);
      if (pct === null || !isFinite(pct)) {
        pctEl.textContent = '\u2014';
      } else {
        pctEl.textContent = Math.round(pct) + '%';
      }
    }
    if (source === 'fallback') {
      priceEl.title = 'Live price fetch failed; showing fallback value.';
    }
  }
  function fetchLiveBtcPrice() {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
      .then(function(d){ updateStatusLine(d.bitcoin.usd, 'live'); })
      .catch(function(){ updateStatusLine(LIVE_BTC_FALLBACK, 'fallback'); });
  }

  // ─── Re-render chart when inflation or growth model changes
  if (window.ModelingAssumptions.subscribe) {
    window.ModelingAssumptions.subscribe(function(dim){
      if (dim === 'inflation' || dim === 'btcGrowthModel' || dim === '*') {
        renderChart();
      }
    });
  }

  // ─── Initial run
  renderChart();
  fetchLiveBtcPrice();
})();
