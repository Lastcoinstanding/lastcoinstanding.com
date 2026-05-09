// ═══════════════════════════════════════════════════════════════════
// DISCIPLINED REBALANCING — page logic
//
// Three-tab page: Question / Calculator / Math. This file handles
// tab routing + the Calculator's full math engine (percentile
// computation, trigger detection state machine, cycle accumulation,
// tax drag, conditional projection) + UI wiring (sliders, presets,
// stickiness, output rendering).
//
// Math primitives per DISCIPLINED_REBALANCING_DESIGN.md §4. Output
// rendering per §5. Stickiness per §8.2 (per-calculator persistence,
// stack excluded — it's never written to localStorage).
//
// PL_DATA + PL_A/B/FLOOR/CEIL + GENESIS_TS + plPrice() now in shared/power-law-data.js (loaded before this file via njk page_scripts).
// ═══════════════════════════════════════════════════════════════════

// ═══════ TAB ROUTING ═══════
(function(){
  var btns = document.querySelectorAll('.tab-btn');
  if(!btns.length) return;
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      btns.forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(t){
        t.classList.remove('active');
      });
      var tab = document.getElementById('tab-' + b.dataset.tab);
      if(tab) tab.classList.add('active');
      history.replaceState(null, '', '#' + b.dataset.tab);
    });
  });
  var hash = location.hash.replace('#','');
  if(hash){
    var target = document.querySelector('[data-tab="'+hash+'"]');
    if(target) target.click();
  }
})();

// ═══════ MATH TAB CHART ═══════
// Companion chart for the Math tab: historical price/trend ratio
// across all of PL_DATA, with horizontal reference lines at canonical
// percentile thresholds. Renders lazily — only when the Math tab
// becomes active, to avoid Chart.js startup cost on initial page load.
(function(){
  var rendered = false;
  var canvas = document.getElementById('drMathChart');
  if(!canvas) return;

  function render(){
    if(rendered) return;
    rendered = true;
    if(typeof Chart === 'undefined') return;

    // Build the historical ratio series from PL_DATA.
    // X values are days-from-genesis (raw PL_DATA[i][0]), matching the
    // Power Law Channel chart's pattern. Linear x-axis + tick callback
    // formats years — avoids the chartjs date-adapter dependency that
    // 'type: time' would require (not loaded site-wide).
    var ratioSeries = [];
    for(var i = 0; i < PL_DATA.length; i++){
      var d = PL_DATA[i][0], p = PL_DATA[i][1];
      var trend = plPrice(d);
      if(trend > 0){
        ratioSeries.push({
          x: d,
          y: p / trend
        });
      }
    }

    // Horizontal reference percentile lines — values match the
    // canonical thresholds documented in the percentile table above.
    var refs = [
      { y: 0.87, label: '50th — historical median', color: 'rgba(255,255,255,0.25)' },
      { y: 1.34, label: '70th', color: 'rgba(224,148,34,0.35)' },
      { y: 1.78, label: '80th', color: 'rgba(224,148,34,0.55)' },
      { y: 2.83, label: '90th', color: 'rgba(224,148,34,0.75)' }
    ];

    // Build datasets: one for the historical ratio line, plus
    // straight horizontal lines for each reference percentile.
    // Each reference is rendered as a 2-point dataset spanning the
    // x-domain at constant y.
    var xMin = ratioSeries[0].x;
    var xMax = ratioSeries[ratioSeries.length-1].x;
    var refDatasets = refs.map(function(r){
      return {
        label: r.label,
        data: [{x: xMin, y: r.y}, {x: xMax, y: r.y}],
        borderColor: r.color,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0,
        order: 1
      };
    });

    var ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Bitcoin price / Power Law trend',
          data: ratioSeries,
          borderColor: 'rgba(224,148,34,0.85)',
          backgroundColor: 'rgba(224,148,34,0.08)',
          borderWidth: 1.4,
          pointRadius: 0,
          tension: 0.1,
          fill: false,
          order: 0
        }].concat(refDatasets)
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', axis: 'x', intersect: false },
        scales: {
          x: {
            type: 'linear',
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              maxTicksLimit: 10,
              callback: function(v){
                // v is days-from-genesis; convert to year
                var date = new Date(GENESIS_TS*1000 + v*86400*1000);
                return date.getFullYear();
              }
            }
          },
          y: {
            type: 'logarithmic',
            min: 0.25,
            max: 7,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              callback: function(v){
                if(v === 0.5 || v === 1 || v === 2 || v === 3 || v === 5) return v + '×';
                return '';
              }
            },
            title: { display: true, text: 'Price / trend', color: 'rgba(255,255,255,0.6)', font: { size: 11 } }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: 'rgba(255,255,255,0.65)',
              font: { size: 10 },
              boxWidth: 18,
              padding: 8,
              filter: function(item){
                // Only show labeled reference percentiles + main series
                return true;
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            titleColor: 'rgba(255,255,255,0.9)',
            bodyColor: 'rgba(255,255,255,0.8)',
            borderColor: 'rgba(224,148,34,0.4)',
            borderWidth: 1,
            callbacks: {
              title: function(items){
                if(!items.length) return '';
                // parsed.x is days-from-genesis (linear axis); convert to date
                var d = new Date(GENESIS_TS*1000 + items[0].parsed.x*86400*1000);
                return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
              },
              label: function(item){
                if(item.dataset.label.indexOf('th') !== -1 && item.dataset.label.indexOf('historical') === -1){
                  return null;
                }
                return item.dataset.label + ': ' + item.parsed.y.toFixed(2) + '×';
              }
            }
          }
        }
      }
    });
  }

  // Trigger render when math tab is activated
  var mathBtn = document.querySelector('.tab-btn[data-tab="math"]');
  if(mathBtn){
    mathBtn.addEventListener('click', function(){
      // Defer one tick so tab activation completes first
      setTimeout(render, 30);
    });
  }

  // Initial-page-load case: if landing on #math, render now
  if(location.hash.replace('#','') === 'math'){
    setTimeout(render, 80);
  }

})();

// ═══════ CHANNEL VIZ — Calculator tab anchor visualization ═══════
//
// Shows the Power Law channel (floor / trend / upper) with historical
// price overlay AND the user's sell/rebuy thresholds as parallel-to-trend
// lines that update live as the percentile sliders move. Once the user
// enters a stack value, the calculator IIFE dispatches a 'dr:simResult'
// CustomEvent and we paint the simulated forward price path plus
// trigger markers (▼ sell, ▲ rebuy) on top.
//
// X-axis: linear days-from-genesis; year-formatting tick callback
// (matches the Tab 4 'Channel' chart on /the-power-law and the Math
// tab companion chart — no chartjs date-adapter needed).
// Y-axis: logarithmic USD price, autoscaled.
//
// Mežinskis / Porkopolis attribution lives in the markup below the chart.
(function(){
  var canvas = document.getElementById('drChannelChart');
  if(!canvas) return;
  if(typeof Chart === 'undefined') return;

  // ─── X-DOMAIN ───
  // Min: PL_DATA[0][0] (first historical sample; ~mid-2010)
  // Max: today + horizon × 365.25 (extends to user's projection end)
  // Today is fixed at script-load time.
  var todayD = (Date.now()/1000 - GENESIS_TS) / 86400;
  var minD = PL_DATA[0][0];
  function maxD(){
    var horizonEl = document.getElementById('drHorizon');
    var horizon = horizonEl ? parseInt(horizonEl.value) : 20;
    return todayD + horizon * 365.25;
  }

  // ─── BAND DATA ───
  // Sampled every 30 days for performance (matches Tab 4 cadence).
  function bandData(){
    var trend = [], floor = [], upper = [];
    var hi = maxD();
    for(var d = minD; d <= hi; d += 30){
      var t = plPrice(d);
      trend.push({x: d, y: t});
      floor.push({x: d, y: t * PL_FLOOR});
      upper.push({x: d, y: t * PL_CEIL});
    }
    return { trend: trend, floor: floor, upper: upper };
  }

  // User's threshold lines: ratio × trend at every day. Same x-grid
  // as the bands so they update cheaply (just rebuild y values).
  function thresholdData(ratio){
    var line = [];
    var hi = maxD();
    for(var d = minD; d <= hi; d += 30){
      line.push({x: d, y: plPrice(d) * ratio});
    }
    return line;
  }

  // Historical price as scatter data (PL_DATA is already day-indexed).
  var historicalData = PL_DATA.map(function(p){ return {x: p[0], y: p[1]}; });

  // ─── PERCENTILE → RATIO (mirrors calc IIFE; computed once at init) ───
  // We re-derive these here so the channel viz can render thresholds
  // BEFORE the calc IIFE runs (e.g. before the user enters a stack).
  var historicalRatios = [];
  for(var i = 0; i < PL_DATA.length; i++){
    var d = PL_DATA[i][0], p = PL_DATA[i][1];
    var t = plPrice(d);
    if(t > 0) historicalRatios.push(p / t);
  }
  historicalRatios.sort(function(a,b){ return a-b; });
  function percentileToRatio(P){
    if(P <= 0) return historicalRatios[0];
    if(P >= 100) return historicalRatios[historicalRatios.length-1];
    var idx = (P/100) * (historicalRatios.length - 1);
    var lo = Math.floor(idx), hi = Math.ceil(idx);
    if(lo === hi) return historicalRatios[lo];
    var frac = idx - lo;
    return historicalRatios[lo] * (1-frac) + historicalRatios[hi] * frac;
  }

  // ─── COLORS ───
  var amber = '#e09422';
  var rust = '#c0392b';
  var gold = '#e8c820';
  var historyColor = 'rgba(232,224,210,0.7)';
  var sellColor = '#e09422';
  var rebuyColor = '#27ae60';
  var muted = 'rgba(160,160,160,0.55)';

  // ─── "TODAY" VERTICAL LINE PLUGIN (mirrors Tab 4) ───
  var todayLinePlugin = {
    id: 'drTodayLine',
    afterDatasetsDraw: function(chart){
      var xScale = chart.scales.x;
      var area = chart.chartArea;
      if(!xScale || !area) return;
      var xPos = xScale.getPixelForValue(todayD);
      if(xPos < area.left || xPos > area.right) return;
      var ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = 'rgba(224,148,34,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4,4]);
      ctx.beginPath();
      ctx.moveTo(xPos, area.top);
      ctx.lineTo(xPos, area.bottom);
      ctx.stroke();
      ctx.fillStyle = amber;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Today', xPos, area.top + 12);
      ctx.restore();
    }
  };

  // ─── INITIAL RENDER ───
  var bands = bandData();
  // Read default slider values to render initial threshold lines
  var sellEl = document.getElementById('drSellPct');
  var rebuyEl = document.getElementById('drRebuyPct');
  var initialSellRatio = sellEl ? percentileToRatio(parseInt(sellEl.value)) : 1.78;
  var initialRebuyRatio = rebuyEl ? percentileToRatio(parseInt(rebuyEl.value)) : 0.87;

  // Dataset index map — used by update functions
  var DS = {
    floor: 0, trend: 1, upper: 2,
    sellLine: 3, rebuyLine: 4,
    history: 5,
    forwardPath: 6,
    sellMarkers: 7, rebuyMarkers: 8
  };

  var chart = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [
        // 0: Floor band
        {
          label: 'Floor (0.42× trend)',
          data: bands.floor,
          borderColor: rust,
          borderWidth: 1.4,
          borderDash: [6, 3],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 5
        },
        // 1: Trend
        {
          label: 'Trend',
          data: bands.trend,
          borderColor: amber,
          borderWidth: 2,
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 4
        },
        // 2: Upper band
        {
          label: 'Upper (3.0× trend)',
          data: bands.upper,
          borderColor: gold,
          borderWidth: 1.2,
          borderDash: [1, 5],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 6
        },
        // 3: User's sell-threshold line (parallel to trend, scaled by sellRatio)
        {
          label: 'Your sell threshold',
          data: thresholdData(initialSellRatio),
          borderColor: sellColor,
          borderWidth: 1.6,
          borderDash: [8, 4],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 2
        },
        // 4: User's rebuy-threshold line
        {
          label: 'Your rebuy threshold',
          data: thresholdData(initialRebuyRatio),
          borderColor: rebuyColor,
          borderWidth: 1.6,
          borderDash: [8, 4],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 3
        },
        // 5: Historical price
        {
          label: 'Historical price',
          data: historicalData,
          borderColor: historyColor,
          borderWidth: 1.2,
          pointRadius: 0,
          showLine: true,
          tension: 0.15,
          order: 1
        },
        // 6: Forward-projected discipline price path (populated on sim event)
        {
          label: 'Projected price',
          data: [],
          borderColor: 'rgba(232,224,210,0.45)',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 0
        },
        // 7: Sell markers (▼)
        {
          label: 'Sell triggers',
          data: [],
          borderColor: sellColor,
          backgroundColor: sellColor,
          pointStyle: 'triangle',
          pointRotation: 180,
          pointRadius: 7,
          pointHoverRadius: 9,
          showLine: false,
          order: 0
        },
        // 8: Rebuy markers (▲)
        {
          label: 'Rebuy triggers',
          data: [],
          borderColor: rebuyColor,
          backgroundColor: rebuyColor,
          pointStyle: 'triangle',
          pointRadius: 7,
          pointHoverRadius: 9,
          showLine: false,
          order: 0
        }
      ]
    },
    plugins: [todayLinePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', axis: 'x', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,9,8,0.95)',
          borderColor: 'rgba(224,148,34,0.5)',
          borderWidth: 1,
          titleColor: amber,
          bodyColor: '#ddd',
          callbacks: {
            title: function(items){
              if(!items.length) return '';
              var d = new Date(GENESIS_TS*1000 + items[0].parsed.x*86400*1000);
              return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            },
            label: function(item){
              var v = item.parsed.y;
              var fmt;
              if(v >= 1e6) fmt = '$' + (v/1e6).toFixed(2) + 'M';
              else if(v >= 1000) fmt = '$' + (v/1000).toFixed(1) + 'K';
              else if(v >= 1) fmt = '$' + v.toFixed(2);
              else fmt = '$' + v.toFixed(4);
              return item.dataset.label + ': ' + fmt;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Year', color: muted, font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
          min: minD,
          ticks: {
            color: muted,
            maxTicksLimit: 10,
            callback: function(v){
              var date = new Date(GENESIS_TS*1000 + v*86400*1000);
              return date.getFullYear();
            }
          }
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: 'BTC price (USD)', color: muted, font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: muted,
            callback: function(v){
              if(v >= 1e6) return '$' + (v/1e6) + 'M';
              if(v >= 1000) return '$' + (v/1000) + 'K';
              if(v >= 1) return '$' + v;
              return '$' + v.toFixed(2);
            }
          }
        }
      }
    }
  });

  // ─── DYNAMIC UPDATES ───

  // Update threshold lines when user moves sell/rebuy sliders.
  // Cheap: just rebuild the y-values for two datasets.
  function updateThresholds(){
    if(!sellEl || !rebuyEl) return;
    var sr = percentileToRatio(parseInt(sellEl.value));
    var rr = percentileToRatio(parseInt(rebuyEl.value));
    chart.data.datasets[DS.sellLine].data = thresholdData(sr);
    chart.data.datasets[DS.rebuyLine].data = thresholdData(rr);
    chart.update('none');
  }

  // Rebuild bands + thresholds when horizon changes (extends x-domain).
  function updateXDomain(){
    bands = bandData();
    chart.data.datasets[DS.floor].data = bands.floor;
    chart.data.datasets[DS.trend].data = bands.trend;
    chart.data.datasets[DS.upper].data = bands.upper;
    updateThresholds(); // re-extends sell/rebuy lines to new max
  }

  if(sellEl) sellEl.addEventListener('input', updateThresholds);
  if(rebuyEl) rebuyEl.addEventListener('input', updateThresholds);
  var horizonEl = document.getElementById('drHorizon');
  if(horizonEl) horizonEl.addEventListener('input', updateXDomain);

  // Listen for simulation results from the calculator IIFE.
  // Forward-projected path (in actual USD prices, days-from-genesis x)
  // and trigger markers populate datasets 6/7/8.
  document.addEventListener('dr:simResult', function(ev){
    var detail = ev.detail || {};
    var result = detail.result;
    if(!result || !result.sim){
      // Stack cleared — wipe the projection-related datasets.
      chart.data.datasets[DS.forwardPath].data = [];
      chart.data.datasets[DS.sellMarkers].data = [];
      chart.data.datasets[DS.rebuyMarkers].data = [];
      chart.update('none');
      return;
    }
    var sim = result.sim;
    // Forward price path: convert daysFromToday → daysFromGenesis
    chart.data.datasets[DS.forwardPath].data = sim.seriesPath.map(function(pt){
      return { x: pt.day + todayD, y: pt.price };
    });
    // Trigger markers
    var sells = [], rebuys = [];
    sim.trades.forEach(function(t){
      var point = { x: t.day + todayD, y: t.price };
      if(t.type === 'sell') sells.push(point);
      else if(t.type === 'rebuy') rebuys.push(point);
    });
    chart.data.datasets[DS.sellMarkers].data = sells;
    chart.data.datasets[DS.rebuyMarkers].data = rebuys;
    chart.update('none');
  });

})();

// ═══════ CALCULATOR ═══════
// Math engine + percentile computation + state machine + UI wiring.
(function(){
  // Bail if calculator surface not present (e.g., hash deep-link to non-calc tab and elements stripped)
  if(!document.getElementById('drStack')) return;

  // ─── PRECOMPUTE PERCENTILE-TO-RATIO MAPPING ───
  // For each historical day in PL_DATA, compute price/trend ratio. Sort.
  // Pth percentile threshold = ratio level such that P% of historical
  // ratios are at-or-below it.
  var ratios = [];
  for(var i = 0; i < PL_DATA.length; i++){
    var d = PL_DATA[i][0], p = PL_DATA[i][1];
    var trend = plPrice(d);
    if(trend > 0) ratios.push(p / trend);
  }
  ratios.sort(function(a,b){ return a-b; });

  function percentileToRatio(P){
    if(P <= 0) return ratios[0];
    if(P >= 100) return ratios[ratios.length-1];
    var idx = Math.floor(ratios.length * P / 100);
    return ratios[idx];
  }

  // ─── ELEMENT REFS ───
  var elStack = document.getElementById('drStack');
  var elHorizon = document.getElementById('drHorizon');
  var elHorizonValue = document.getElementById('drHorizonValue');
  var elSellPct = document.getElementById('drSellPct');
  var elSellPctReadout = document.getElementById('drSellPctReadout');
  var elRebuyPct = document.getElementById('drRebuyPct');
  var elRebuyPctReadout = document.getElementById('drRebuyPctReadout');
  var elSellFrac = document.getElementById('drSellFrac');
  var elSellFracReadout = document.getElementById('drSellFracReadout');
  var elTaxRate = document.getElementById('drTaxRate');
  var elTaxRateValue = document.getElementById('drTaxRateValue');
  var elTaxRow = document.getElementById('drTaxRow');
  var elInflation = document.getElementById('drInflation');
  var elInflationValue = document.getElementById('drInflationValue');
  var elStatBlock = document.getElementById('drStatBlockText');
  var elOutput = document.getElementById('drOutput');
  var elHero = document.getElementById('drHero');
  var elAccountPanel = document.getElementById('drAccountPanel');
  var elTradeTable = document.getElementById('drTradeTable');
  var elChart = document.getElementById('drChart');

  // ─── STATE & STICKINESS ───
  var STORAGE_PREFIX = 'dr:';
  // Stack is intentionally NOT in this list — sitewide convention §8.2
  var STICKY = {
    drHorizon: 'horizon',
    drSellPct: 'sellPct',
    drRebuyPct: 'rebuyPct',
    drSellFrac: 'sellFrac',
    drTaxRate: 'taxRate',
    drInflation: 'inflation'
  };
  var STICKY_TOGGLE = {
    accountType: 'retirement',
    growthModel: 'trend',
    preset: 'standard'
  };

  function saveSetting(key, value){
    try { localStorage.setItem(STORAGE_PREFIX + key, value); } catch(e){}
  }
  function loadSetting(key){
    try { return localStorage.getItem(STORAGE_PREFIX + key); } catch(e){ return null; }
  }
  function loadStickyValues(){
    Object.keys(STICKY).forEach(function(elId){
      var stored = loadSetting(STICKY[elId]);
      var el = document.getElementById(elId);
      if(stored != null && el) el.value = stored;
    });
    // Toggles
    var aT = loadSetting('accountType') || 'retirement';
    var gM = loadSetting('growthModel') || 'trend';
    var pS = loadSetting('preset') || 'standard';
    setAccountType(aT, true);
    setGrowthModel(gM, true);
    // preset is informational only; sliders carry the actual values
    document.querySelectorAll('.dr-preset-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.preset === pS);
    });
  }

  // ─── PRESETS ───
  var PRESETS = {
    conservative: { sellPct: 70, rebuyPct: 40, sellFrac: 35 },
    standard:     { sellPct: 80, rebuyPct: 50, sellFrac: 50 },
    aggressive:   { sellPct: 90, rebuyPct: 20, sellFrac: 65 }
  };
  function applyPreset(name){
    var p = PRESETS[name]; if(!p) return;
    elSellPct.value = p.sellPct;
    elRebuyPct.value = p.rebuyPct;
    elSellFrac.value = p.sellFrac;
    document.querySelectorAll('.dr-preset-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.preset === name);
    });
    saveSetting('preset', name);
    saveSetting('sellPct', p.sellPct);
    saveSetting('rebuyPct', p.rebuyPct);
    saveSetting('sellFrac', p.sellFrac);
    updateReadouts();
    runIfReady();
  }

  // ─── ACCOUNT TYPE / GROWTH MODEL TOGGLES ───
  var accountType = 'retirement';
  var growthModel = 'trend';

  function setAccountType(type, silent){
    accountType = type;
    document.querySelectorAll('[data-account]').forEach(function(b){
      b.classList.toggle('active', b.dataset.account === type);
    });
    elTaxRow.style.display = (type === 'regular') ? 'flex' : 'none';
    if(!silent){ saveSetting('accountType', type); runIfReady(); }
  }
  function setGrowthModel(model, silent){
    growthModel = model;
    document.querySelectorAll('[data-growth]').forEach(function(b){
      b.classList.toggle('active', b.dataset.growth === model);
    });
    if(!silent){ saveSetting('growthModel', model); runIfReady(); }
  }

  // ─── READOUT UPDATES (live) ───
  function updateReadouts(){
    elHorizonValue.textContent = elHorizon.value + ' years';
    var sP = parseInt(elSellPct.value);
    var rP = parseInt(elRebuyPct.value);
    var sF = parseInt(elSellFrac.value);
    var sR = percentileToRatio(sP);
    var rR = percentileToRatio(rP);
    elSellPctReadout.innerHTML = sP + 'th &middot; ~' + sR.toFixed(2) + '× trend &middot; ' + (100-sP) + '% of history';
    elRebuyPctReadout.innerHTML = rP + 'th &middot; ~' + rR.toFixed(2) + '× trend &middot; ' + (rP === 50 ? 'historical median' : (rP < 50 ? rP + '% below trend' : 'above trend'));
    elSellFracReadout.textContent = sF + '% of stack at each sell event';
    elTaxRateValue.textContent = elTaxRate.value + '%';
    elInflationValue.textContent = elInflation.value + '% / yr';
    updateStatBlock(sP, rP);
  }

  function updateStatBlock(sellPct, rebuyPct){
    var sR = percentileToRatio(sellPct);
    var rR = percentileToRatio(rebuyPct);
    var aboveSellPct = 100 - sellPct;
    var belowRebuyPct = rebuyPct;
    elStatBlock.innerHTML =
      'At your settings (sell <strong>' + sellPct + 'th</strong> / rebuy <strong>' + rebuyPct + 'th</strong>): bitcoin has crossed the ' + sellPct + 'th percentile in <strong>' + aboveSellPct + '%</strong> of historical days (price ≥ ' + sR.toFixed(2) + '× trend). It has been at-or-below the ' + rebuyPct + 'th percentile in <strong>' + belowRebuyPct + '%</strong> of historical days (≤ ' + rR.toFixed(2) + '× trend). These are facts about the data, not predictions about the future.';
  }

  // ─── PRICE PATH MODEL (cyclical projection) ───
  // Simulates a 4-year cycle pattern oscillating between historically-
  // realistic min and max ratios. For Trend growth model, that range
  // is roughly 25th-percentile (0.55× trend) to 80th-percentile (1.85×
  // trend) — matching the "average historical cycle" rather than the
  // extreme cycles (which have peaked at 6× and troughed at 0.3×).
  // This IS the conditional-projection assumption: "above-trend
  // windows with historical frequency" maps to ~80th percentile
  // amplitude, which Standard/Conservative presets can capture.
  // Aggressive preset (90th) requires above-historical-average cycles
  // to fire — and honestly surfaces as such.
  // Phase: cyclical01 = 0 at horizon start (mid-cycle on the way up),
  // peak at year 1, mid on way down at year 2, trough at year 3,
  // back to mid by year 4, repeating.
  function priceTrendRatio(daysFromToday){
    var todayDay = (Date.now()/1000 - GENESIS_TS) / 86400;
    var futureDay = todayDay + daysFromToday;
    var trend = plPrice(futureDay);
    var phase = (daysFromToday/365.25) / 4 * 2 * Math.PI;
    var cyclical01 = (1 + Math.sin(phase)) / 2; // normalize sin to 0..1
    var minRatio, maxRatio;
    if(growthModel === 'floor')      { minRatio = 0.30; maxRatio = 0.55; }
    else if(growthModel === 'upper') { minRatio = 1.50; maxRatio = 4.00; }
    else                             { minRatio = 0.55; maxRatio = 1.85; }
    var ratio = minRatio + (maxRatio - minRatio) * cyclical01;
    return { trend: trend, price: trend * ratio, ratio: ratio };
  }

  // ─── SIMULATION ENGINE ───
  function runSimulation(params){
    var stepDays = 30; // monthly resolution
    var totalDays = params.horizon * 365.25;
    var sim = {
      btc: params.stack,
      cash: 0,
      costBasis: 0, // weighted-avg cost per BTC (for Regular tax tracking)
      state: 'holding-stack',
      trades: [],
      taxPaidCumulative: 0,
      gainsCumulative: 0,
      seriesPath: [],     // [{day, value, btc, cash}]
      hodlPath: []        // [{day, value}]
    };
    // Compute starting cost basis from current trend price (assumption: user's stack is at-trend basis)
    var initial = priceTrendRatio(0);
    sim.costBasis = initial.price;

    var prevRatio = initial.ratio;

    // Step through projection
    for(var d = 0; d <= totalDays; d += stepDays){
      var here = priceTrendRatio(d);
      var ratio = here.ratio;
      var price = here.price;

      // Trigger detection
      if(sim.state === 'holding-stack'){
        if(prevRatio < params.sellThreshold && ratio >= params.sellThreshold){
          // SELL EVENT
          var btcSold = sim.btc * (params.sellFraction / 100);
          var cashGained = btcSold * price;
          var taxThis = 0;
          if(params.accountType === 'regular'){
            var gain = (price - sim.costBasis) * btcSold;
            if(gain > 0){
              taxThis = gain * (params.taxRate / 100);
              cashGained -= taxThis;
              sim.taxPaidCumulative += taxThis;
              sim.gainsCumulative += gain;
            }
          }
          sim.btc -= btcSold;
          sim.cash += cashGained;
          sim.state = 'holding-cash-and-stack';
          sim.trades.push({
            day: d, type: 'sell', price: price, btcDelta: -btcSold,
            cashDelta: cashGained, ratio: ratio, tax: taxThis
          });
        }
      } else {
        if(prevRatio > params.rebuyThreshold && ratio <= params.rebuyThreshold){
          // REBUY EVENT
          var btcBought = sim.cash / price;
          // Update cost basis (weighted average)
          if(sim.btc + btcBought > 0){
            sim.costBasis = (sim.costBasis * sim.btc + price * btcBought) / (sim.btc + btcBought);
          }
          sim.btc += btcBought;
          sim.cash = 0;
          sim.state = 'holding-stack';
          sim.trades.push({
            day: d, type: 'rebuy', price: price, btcDelta: btcBought,
            cashDelta: 0, ratio: ratio, tax: 0
          });
        }
      }

      // Record path values at this step
      var disciplineValue = sim.btc * price + sim.cash;
      var hodlValue = params.stack * price;
      sim.seriesPath.push({ day: d, value: disciplineValue, btc: sim.btc, cash: sim.cash, price: price });
      sim.hodlPath.push({ day: d, value: hodlValue });

      prevRatio = ratio;
    }

    // Final values
    var finalDay = sim.seriesPath[sim.seriesPath.length-1].day;
    var finalDiscipline = sim.seriesPath[sim.seriesPath.length-1].value;
    var finalHodl = sim.hodlPath[sim.hodlPath.length-1].value;

    return {
      sim: sim,
      finalBTC: sim.btc,
      finalCash: sim.cash,
      finalDiscipline: finalDiscipline,
      finalHodl: finalHodl,
      multiplier: finalHodl > 0 ? finalDiscipline / finalHodl : 1,
      cycleCount: sim.trades.filter(function(t){ return t.type === 'rebuy'; }).length,
      taxPaid: sim.taxPaidCumulative,
      gainsTotal: sim.gainsCumulative
    };
  }

  // ─── HERO METRIC RENDERING ───
  function renderHero(result){
    var multiplier = result.multiplier;
    var ts = result.sim.trades.length;
    var cycles = result.cycleCount;

    var prefix = 'Estimated';
    var multStr = multiplier.toFixed(2) + '× HODL';
    var multClass = multiplier >= 1 ? 'positive' : 'negative';
    var contextStr = '';
    if(ts === 0){
      contextStr = '<span style="color:var(--text-muted)">no triggers fired in this horizon — discipline reduced to holding through</span>';
    } else if(cycles === 0){
      contextStr = '<span style="color:var(--text-muted)">' + ts + ' sell event(s), no rebuys yet — terminal mid-cycle</span>';
    } else {
      contextStr = 'under historical-frequency cycle assumption · ' + cycles + ' completed cycle' + (cycles===1?'':'s');
    }

    var btcStr = result.finalBTC.toFixed(4) + ' BTC';
    var hodlBTC = result.sim.seriesPath[0].btc.toFixed(4);
    var btcDelta = result.finalBTC - parseFloat(hodlBTC);
    var btcLine = '<strong>BTC accumulated:</strong> ' + btcStr + ' (vs ' + hodlBTC + ' BTC HODL · ' + (btcDelta >= 0 ? '+' : '') + btcDelta.toFixed(4) + ' BTC)';

    elHero.innerHTML =
      '<span class="dr-hero-prefix">' + prefix + '</span>' +
      '<span class="dr-hero-multiplier">' + multStr + '</span>' +
      '<span class="dr-hero-context">' + contextStr + '</span>' +
      '<span class="dr-hero-secondary">' + btcLine + '</span>';
  }

  // ─── ACCOUNT-TYPE PANEL (Regular only) ───
  function renderAccountPanel(result, params){
    if(params.accountType !== 'regular'){
      elAccountPanel.style.display = 'none';
      return;
    }
    elAccountPanel.style.display = 'block';
    var taxPct = result.gainsTotal > 0 ? (result.taxPaid / result.gainsTotal * 100) : 0;
    elAccountPanel.innerHTML =
      '<div class="dr-account-panel-label">Tax drag at ' + params.taxRate + '% rate</div>' +
      '<div class="dr-comparison-line"><span>Total cycle gains:</span><strong>$' + Math.round(result.gainsTotal).toLocaleString() + '</strong></div>' +
      '<div class="dr-comparison-line"><span>Tax owed (' + params.taxRate + '%):</span><strong>$' + Math.round(result.taxPaid).toLocaleString() + ' (' + taxPct.toFixed(1) + '% effective)</strong></div>' +
      '<p style="margin-top:0.6rem"><em>Same trades inside a Retirement account: $0 tax owed.</em></p>';
  }

  // ─── TRADE HISTORY TABLE ───
  function renderTradeTable(result, params){
    var trades = result.sim.trades;
    if(trades.length === 0){
      elTradeTable.innerHTML = '<tr><td class="dr-trade-empty" colspan="6">No triggers fired in this horizon. Discipline reduced to holding through.</td></tr>';
      return;
    }
    var rows = ['<tr><th>Year</th><th>Type</th><th>Price</th><th>Ratio</th><th>BTC Δ</th><th>Cash Δ</th></tr>'];
    trades.forEach(function(t){
      var year = (t.day / 365.25).toFixed(1);
      var type = t.type === 'sell' ? '▼ Sell' : '▲ Rebuy';
      var price = '$' + Math.round(t.price).toLocaleString();
      var ratio = t.ratio.toFixed(2) + '×';
      var btcDelta = (t.btcDelta >= 0 ? '+' : '') + t.btcDelta.toFixed(4);
      var cashDelta = t.type === 'sell' ? '+$' + Math.round(t.cashDelta).toLocaleString() + (params.accountType === 'regular' ? ' (after $' + Math.round(t.tax).toLocaleString() + ' tax)' : '') : '—';
      rows.push('<tr class="dr-trade-' + t.type + '"><td>' + year + '</td><td>' + type + '</td><td>' + price + '</td><td>' + ratio + '</td><td>' + btcDelta + '</td><td>' + cashDelta + '</td></tr>');
    });
    elTradeTable.innerHTML = rows.join('');
  }

  // ─── CHART RENDERING ───
  var chartInstance = null;
  function renderChart(result){
    var disciplineData = result.sim.seriesPath.map(function(p){
      return { x: p.day / 365.25, y: p.value };
    });
    var hodlData = result.sim.hodlPath.map(function(p){
      return { x: p.day / 365.25, y: p.value };
    });

    // Trade markers (separate datasets so they show in legend distinctly)
    var sellMarkers = result.sim.trades.filter(function(t){return t.type==='sell';}).map(function(t){
      var pathPoint = result.sim.seriesPath.find(function(p){ return p.day === t.day; });
      return { x: t.day/365.25, y: pathPoint ? pathPoint.value : t.price * 1 };
    });
    var rebuyMarkers = result.sim.trades.filter(function(t){return t.type==='rebuy';}).map(function(t){
      var pathPoint = result.sim.seriesPath.find(function(p){ return p.day === t.day; });
      return { x: t.day/365.25, y: pathPoint ? pathPoint.value : t.price * 1 };
    });

    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(elChart, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Discipline',
            data: disciplineData,
            borderColor: 'rgba(247,147,26,0.9)',
            backgroundColor: 'rgba(247,147,26,0.05)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15,
            fill: false
          },
          {
            label: 'HODL',
            data: hodlData,
            borderColor: 'rgba(154,144,128,0.55)',
            borderWidth: 1.5,
            borderDash: [4,4],
            pointRadius: 0,
            tension: 0.15,
            fill: false
          },
          {
            label: 'Sells',
            data: sellMarkers,
            type: 'scatter',
            backgroundColor: '#c0392b',
            borderColor: '#c0392b',
            pointStyle: 'triangle',
            pointRadius: 7,
            pointRotation: 180,
            showLine: false
          },
          {
            label: 'Rebuys',
            data: rebuyMarkers,
            type: 'scatter',
            backgroundColor: '#27ae60',
            borderColor: '#27ae60',
            pointStyle: 'triangle',
            pointRadius: 7,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,9,8,0.95)',
            borderColor: 'rgba(247,147,26,0.6)',
            borderWidth: 1,
            titleColor: '#e09422',
            bodyColor: '#ddd',
            callbacks: {
              title: function(items){ return 'Year ' + items[0].parsed.x.toFixed(1); },
              label: function(item){
                var v = item.parsed.y;
                var fmt = v >= 1e6 ? '$'+(v/1e6).toFixed(2)+'M' : v >= 1000 ? '$'+(v/1000).toFixed(1)+'K' : '$'+Math.round(v).toLocaleString();
                return item.dataset.label + ': ' + fmt;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Years from today', color: 'rgba(160,160,160,0.55)', font: {size: 11} },
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(160,160,160,0.55)' }
          },
          y: {
            type: 'logarithmic',
            title: { display: true, text: 'Stack value (USD, real)', color: 'rgba(160,160,160,0.55)', font: {size: 11} },
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(160,160,160,0.55)',
              callback: function(v){
                if(v >= 1e6) return '$'+(v/1e6)+'M';
                if(v >= 1000) return '$'+(v/1000)+'K';
                return '$'+v;
              }
            }
          }
        }
      }
    });
  }

  // ─── MAIN COMPUTATION + RENDER PIPELINE ───
  function run(){
    var stackVal = parseFloat(elStack.value);
    if(!stackVal || stackVal <= 0){
      elOutput.style.display = 'none';
      // Notify channel viz to clear forward-projection datasets.
      document.dispatchEvent(new CustomEvent('dr:simResult', { detail: { result: null } }));
      return;
    }

    var params = {
      stack: stackVal,
      horizon: parseInt(elHorizon.value),
      sellThreshold: percentileToRatio(parseInt(elSellPct.value)),
      rebuyThreshold: percentileToRatio(parseInt(elRebuyPct.value)),
      sellFraction: parseInt(elSellFrac.value),
      accountType: accountType,
      taxRate: parseFloat(elTaxRate.value),
      growthModel: growthModel,
      inflation: parseFloat(elInflation.value)
    };

    var result = runSimulation(params);
    elOutput.style.display = 'block';
    renderHero(result);
    renderAccountPanel(result, params);
    renderTradeTable(result, params);
    renderChart(result);

    // Notify the channel viz: forward path + trigger markers.
    // Decoupled via CustomEvent so the calc IIFE doesn't need to know
    // whether the channel viz is wired up. See the channel viz IIFE
    // for the listener (handles the null case as a clear signal).
    document.dispatchEvent(new CustomEvent('dr:simResult', {
      detail: { result: result, params: params }
    }));
  }

  function runIfReady(){
    updateReadouts();
    run();
  }

  // ─── EVENT WIRING ───
  elStack.addEventListener('input', runIfReady);

  Object.keys(STICKY).forEach(function(elId){
    var el = document.getElementById(elId);
    if(!el) return;
    el.addEventListener('input', function(){
      saveSetting(STICKY[elId], el.value);
      // Slider changes mean we're off-preset (unless settings happen to match a preset)
      var matched = null;
      Object.keys(PRESETS).forEach(function(name){
        var p = PRESETS[name];
        if(p.sellPct == elSellPct.value && p.rebuyPct == elRebuyPct.value && p.sellFrac == elSellFrac.value){
          matched = name;
        }
      });
      document.querySelectorAll('.dr-preset-btn').forEach(function(b){
        b.classList.toggle('active', b.dataset.preset === matched);
      });
      saveSetting('preset', matched || '');
      runIfReady();
    });
  });

  document.querySelectorAll('.dr-preset-btn').forEach(function(b){
    b.addEventListener('click', function(){ applyPreset(b.dataset.preset); });
  });
  document.querySelectorAll('[data-account]').forEach(function(b){
    b.addEventListener('click', function(){ setAccountType(b.dataset.account); });
  });
  document.querySelectorAll('[data-growth]').forEach(function(b){
    b.addEventListener('click', function(){ setGrowthModel(b.dataset.growth); });
  });

  // ─── INIT ───
  loadStickyValues();
  updateReadouts();
  // Don't auto-run until user enters a stack value (privacy: no implicit re-runs with default stack)
})();
