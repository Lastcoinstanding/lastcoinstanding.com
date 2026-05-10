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
        interaction: { mode: 'x', axis: 'x', intersect: false },
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

  // Narrow-viewport flag: drives compact tooltip styling. matchMedia
  // is supported everywhere we ship; the fallback is the default
  // (desktop) tooltip if matchMedia is unavailable. Read once at
  // chart-init — rotation/resize across the threshold is rare in
  // practice and the visual penalty for a stale value is mild.
  var isNarrowViewport = (typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(max-width: 480px)').matches);

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

  // ─── HISTORICAL BACKTEST ───
  // Walks PL_DATA day-by-day applying the user's sell/rebuy/fraction
  // logic — same trigger algorithm as the calculator's runSimulation,
  // but on real historical price data instead of the synthetic ±60%
  // cycle pattern. Returns a chronological list of trigger events
  // that would have fired if the user had been running this strategy
  // since the first PL_DATA sample (~mid-2010).
  //
  // Honest-application choice: starts holding-stack at PL_DATA[0]
  // (no choice of "starting point" that could be cherry-picked) and
  // runs through the full historical record. The only inputs are
  // the user's threshold ratios; nothing else is tunable, nothing
  // is excluded. If the strategy never crosses a threshold, the
  // backtest returns an empty trade list.
  // Walks PL_DATA day by day; records every threshold crossing as a
  // trigger event AND tracks the running BTC + cash + cost-basis state
  // across cycles. Starting position is 1.0 BTC at the cost basis of
  // the first PL_DATA price, so cumulative BTC is comparable to a
  // 1.0-BTC HODL across the same span.
  //
  // params:
  //   sellRatio, rebuyRatio  — price/trend ratios that fire triggers
  //   accountType            — 'retirement' (no tax) or 'regular' (capital-gains drag)
  //   taxRate                — 0..1, applied to gain at each sell in 'regular' mode
  //
  // returns:
  //   trades: per-trigger events with {day, price, ratio, type,
  //           deltaBTC, cumBTC, cumCash, taxPaid, costBasis}
  //   finalState: 'holding-stack' | 'holding-cash-and-stack'
  //   btcHeld, cashHeld, costBasis: end-of-record state
  //   currentDay, currentPrice, currentRatio: latest PL_DATA sample
  //   sellsCount, rebuysCount, cyclesCompleted
  function runHistoricalBacktest(sellRatio, rebuyRatio, accountType, taxRate, minDay){
    // Defaults — preserve old call-site behavior for any caller that
    // still passes only (sellRatio, rebuyRatio).
    if(typeof accountType !== 'string') accountType = 'retirement';
    if(typeof taxRate !== 'number') taxRate = 0;
    // minDay: optional — if provided, only PL_DATA samples with day >= minDay
    // are considered. Used by the preset-comparison block to compare full-
    // history vs. post-2015 results.

    // Sell fraction is now fixed at 100% — at each sell trigger the entire
    // BTC position is converted to cash; at each rebuy trigger all cash is
    // converted back to BTC. This makes the cycle dynamics directly
    // visible (cumulative BTC after one cycle = sellPrice / rebuyPrice)
    // and matches the framing decision documented in session 2026-05-09:
    // the page is a unit-level demonstration users mentally scale to
    // their own portion-allocation, not a "what would my whole stack do"
    // simulation.
    var sellFraction = 1.0;

    var trades = [];
    var state = 'holding-stack';
    var prevRatio = null;

    // Stack-tracking. Start at 1.0 BTC so cumulative is directly
    // comparable to HODL through the same window. Cost basis seeds
    // at the first historical price so capital-gains math has a
    // concrete starting value (matters for 'regular' tax accounting).
    var btcHeld = 1.0;
    var cashHeld = 0;
    var costBasis = PL_DATA.length > 0 ? PL_DATA[0][1] : 0;

    for(var i = 0; i < PL_DATA.length; i++){
      var d = PL_DATA[i][0];
      var p = PL_DATA[i][1];
      if(typeof minDay === 'number' && d < minDay) continue;
      var t = plPrice(d);
      if(t <= 0) continue;
      var ratio = p / t;

      if(prevRatio !== null){
        if(state === 'holding-stack'){
          if(prevRatio < sellRatio && ratio >= sellRatio){
            // SELL — sellFraction of held BTC at price p.
            var btcSold = btcHeld * sellFraction;
            var grossProceeds = btcSold * p;
            var taxPaid = 0;
            if(accountType === 'regular'){
              var gain = (p - costBasis) * btcSold;
              if(gain > 0) taxPaid = gain * taxRate;
            }
            var netProceeds = grossProceeds - taxPaid;

            btcHeld -= btcSold;
            cashHeld += netProceeds;
            // Cost basis of remaining BTC unchanged on a sell.

            trades.push({
              day: d, price: p, ratio: ratio, type: 'sell',
              deltaBTC: -btcSold,
              cumBTC: btcHeld,
              cumCash: cashHeld,
              taxPaid: taxPaid,
              costBasis: costBasis
            });
            state = 'holding-cash-and-stack';
          }
        } else {
          if(prevRatio > rebuyRatio && ratio <= rebuyRatio){
            // REBUY — convert all held cash back to BTC at price p.
            var btcBought = cashHeld / p;
            // Weighted-average cost basis on the new total BTC.
            var totalCost = btcHeld * costBasis + cashHeld;
            var newTotal = btcHeld + btcBought;
            costBasis = newTotal > 0 ? totalCost / newTotal : 0;

            btcHeld += btcBought;
            cashHeld = 0;

            trades.push({
              day: d, price: p, ratio: ratio, type: 'rebuy',
              deltaBTC: btcBought,
              cumBTC: btcHeld,
              cumCash: cashHeld,
              taxPaid: 0,
              costBasis: costBasis
            });
            state = 'holding-stack';
          }
        }
      }
      prevRatio = ratio;
    }

    // Latest PL_DATA sample is "today" for the historical-record view
    // (no live price fetch on this page; PL_DATA is the same series
    // the channel viz draws, so the Today row stays internally
    // consistent with what the chart shows).
    var lastIdx = PL_DATA.length - 1;
    var lastDay = lastIdx >= 0 ? PL_DATA[lastIdx][0] : null;
    var lastPrice = lastIdx >= 0 ? PL_DATA[lastIdx][1] : null;
    var lastTrend = lastDay !== null ? plPrice(lastDay) : null;
    var lastRatio = (lastTrend && lastTrend > 0) ? lastPrice / lastTrend : null;

    var sellsCount = 0, rebuysCount = 0;
    for(var k = 0; k < trades.length; k++){
      if(trades[k].type === 'sell') sellsCount++;
      else if(trades[k].type === 'rebuy') rebuysCount++;
    }

    return {
      trades: trades,
      finalState: state,
      btcHeld: btcHeld,
      cashHeld: cashHeld,
      costBasis: costBasis,
      currentDay: lastDay,
      currentPrice: lastPrice,
      currentRatio: lastRatio,
      sellsCount: sellsCount,
      rebuysCount: rebuysCount,
      // A "cycle" = a sell event followed by a rebuy event. Trailing
      // unmatched sell is an open cycle (still in cash-and-stack state).
      cyclesCompleted: Math.min(sellsCount, rebuysCount)
    };
  }

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
    sellMarkers: 7, rebuyMarkers: 8,
    histSellMarkers: 9, histRebuyMarkers: 10
  };

  // ─── CUSTOM INTERACTION MODE: 'xPerDataset' ───
  // Chart.js's built-in 'mode: index' fails on this chart because
  // datasets don't share an x-grid: bands sample every 30 days from
  // minD across the full horizon (1300+ points by 2046), historical
  // price uses PL_DATA's ~480-point cadence (denser at ~12-day
  // spacing in the historical range), markers are sparse. With axis:
  // 'x' Chart.js picks the dataset whose nearest-in-x point is
  // closest to cursor, which in the historical range is usually
  // historical price (denser locally). It then applies THAT index
  // to all datasets — bands[N] where N comes from historical_price's
  // index ends up at a completely different year than the cursor.
  // Result observed in user screenshots: active-point circles
  // appear at year ~2014 when cursor is at year ~2019.
  //
  // 'mode: x' has its own problem (point hitRadius defaults to 1px,
  // bands at 30-day cadence are ~1.5px apart on wide charts, cursor
  // frequently lands between two band points and Chart.js returns
  // nothing).
  //
  // Custom mode: iterate each dataset independently, find the data
  // point with the closest x to cursor, return ONE item per dataset
  // (within a 90-day tolerance so bands don't show when cursor is
  // outside the chart's data range, and the historical price stops
  // showing past ~mid-2025). Self-contained — uses e.x (which Chart
  // .js pre-resolves to canvas-relative pixels) plus chart.scales.x.
  // No dependency on Chart.helpers.getRelativePosition or any other
  // version-dependent helper.
  if(Chart.Interaction && Chart.Interaction.modes && !Chart.Interaction.modes.xPerDataset){
    Chart.Interaction.modes.xPerDataset = function(chart, e, options, useFinalPosition){
      var cursorPixelX = (e && typeof e.x === 'number') ? e.x : null;
      if(cursorPixelX == null) return [];

      // Pixel-space comparison. Earlier versions did this in data-space
      // (compute cursorDataX via scale.getValueForPixel, compare to each
      // raw point's data x) — but Chart.js's tooltip draws active-point
      // indicator circles at element.x (pixel-space). If element.x has
      // drifted out of sync with the underlying raw data (stale layout
      // after an update path didn't refresh elements), data-space match
      // could find the right index but the element renders at the wrong
      // pixel — circles appear far from the cursor while tooltip values
      // look correct. Comparing cursor pixel directly to element pixel
      // ensures the items we return have circles at the actual cursor
      // position; if any element is stale-positioned far from cursor,
      // it falls outside tolerance and gets dropped (better than a
      // misplaced indicator).
      //
      // Two tolerances:
      //   - 15 px for line/band datasets (Floor, Trend, Upper, sell/
      //     rebuy thresholds, Historical price, forward path). At the
      //     chart's ~50 px/year desktop scale that's ~110 days,
      //     generous enough that bands (sampled every 30 days, ~4 px
      //     apart) always intersect.
      //   - 6 px for sparse marker datasets (Historical sell/rebuy
      //     trigger ▼/▲, Forward sell/rebuy trigger ▼/▲ — datasets
      //     7-10). Otherwise on a narrow mobile chart (~240px wide,
      //     ~6 px/year) the 15-px window covers ~2.5 years of history,
      //     and the tooltip lights up rows for sell/rebuy triggers
      //     years away from the cursor — even though the user can see
      //     all the historical markers on the chart already as ▼/▲.
      //     Tighter tolerance makes the marker rows additive only when
      //     the cursor is genuinely near a marker, on both desktop
      //     and mobile.
      var lineTolerance = 15;
      var markerTolerance = 6;
      var items = [];
      chart.getSortedVisibleDatasetMetas().forEach(function(meta){
        var elements = meta.data;
        if(!elements || elements.length === 0) return;
        // Marker datasets are 7,8,9,10 (sell/rebuy/histSell/histRebuy).
        var tol = meta.index >= 7 ? markerTolerance : lineTolerance;
        var bestIdx = -1;
        var bestDist = Infinity;
        for(var i = 0; i < elements.length; i++){
          var el = elements[i];
          if(!el || el.skip) continue;
          // Element pixel x — Chart.js v4 sets this on Point elements
          // during layout. Use getProps for animation-aware reads when
          // the chart is mid-animation; falls back to direct read.
          var elX;
          if(useFinalPosition && typeof el.getProps === 'function'){
            var props = el.getProps(['x'], true);
            elX = props && typeof props.x === 'number' ? props.x : el.x;
          } else {
            elX = el.x;
          }
          if(elX == null || isNaN(elX)) continue;
          var dist = Math.abs(elX - cursorPixelX);
          if(dist < bestDist){
            bestDist = dist;
            bestIdx = i;
          }
        }
        if(bestIdx === -1 || bestDist > tol) return;
        items.push({ element: elements[bestIdx], datasetIndex: meta.index, index: bestIdx });
      });
      return items;
    };
  }

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
        },
        // 9: HISTORICAL Sell markers (▼) — what would have fired in real history.
        // Smaller + lower-opacity than forward markers so the eye distinguishes
        // "this happened" from "this is projected".
        {
          label: 'Historical sell',
          data: [],
          borderColor: 'rgba(224,148,34,0.55)',
          backgroundColor: 'rgba(224,148,34,0.35)',
          pointStyle: 'triangle',
          pointRotation: 180,
          pointRadius: 4.5,
          pointHoverRadius: 7,
          showLine: false,
          order: 1
        },
        // 10: HISTORICAL Rebuy markers (▲)
        {
          label: 'Historical rebuy',
          data: [],
          borderColor: 'rgba(39,174,96,0.55)',
          backgroundColor: 'rgba(39,174,96,0.35)',
          pointStyle: 'triangle',
          pointRadius: 4.5,
          pointHoverRadius: 7,
          showLine: false,
          order: 1
        }
      ]
    },
    plugins: [todayLinePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'xPerDataset', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,9,8,0.95)',
          borderColor: 'rgba(224,148,34,0.5)',
          borderWidth: 1,
          titleColor: amber,
          bodyColor: '#ddd',
          // Compact on narrow viewports: at 375px viewport the chart's
          // inner plot area is only ~150px wide, so a default-sized
          // tooltip card with 6+ rows of full-length labels (e.g.
          // "Floor (0.42× trend): $5.4K") covers most of the chart
          // surface. Smaller font + tighter padding + shortened band
          // labels reclaim ~40% of the tooltip footprint without losing
          // information density. Read once at chart-init; no need to
          // re-evaluate on resize since rotation between mobile and
          // desktop layouts also reloads the page in practice.
          titleFont: { size: isNarrowViewport ? 11 : 13 },
          bodyFont:  { size: isNarrowViewport ? 11 : 13 },
          padding:   isNarrowViewport ? 6 : 10,
          boxPadding: isNarrowViewport ? 3 : 5,
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
              // Shorten band labels on narrow viewports — the (0.42×
              // trend) and (3.0× trend) suffixes are also visible in
              // the legend below the chart, so dropping them from
              // the tooltip avoids redundant on-chart real estate.
              var label = item.dataset.label;
              if(isNarrowViewport){
                if(label === 'Floor (0.42× trend)') label = 'Floor';
                else if(label === 'Upper (3.0× trend)') label = 'Upper';
              }
              return label + ': ' + fmt;
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

  // Update threshold lines + historical backtest when user moves
  // sell/rebuy sliders. Threshold lines are cheap (rebuild y-values
  // for two datasets). Backtest is also cheap — ~480 PL_DATA samples,
  // a single linear pass.
  function updateThresholds(){
    if(!sellEl || !rebuyEl) return;
    var sr = percentileToRatio(parseInt(sellEl.value));
    var rr = percentileToRatio(parseInt(rebuyEl.value));
    chart.data.datasets[DS.sellLine].data = thresholdData(sr);
    chart.data.datasets[DS.rebuyLine].data = thresholdData(rr);
    updateBacktest(sr, rr);
    chart.update('none');
  }

  // Era state — controls the historical window the table + Today row +
  // summary + volatility note all reflect. Persists to localStorage so a
  // returning reader who switched to 'full' last visit stays there.
  // Default = 'since-2015' (post-volatility-compression era — more
  // representative of the future than the extreme early-bitcoin
  // cycles that no longer reflect modern dynamics).
  var startOf2015Day = (Date.UTC(2015, 0, 1) / 1000 - GENESIS_TS) / 86400;
  var currentEra = 'since-2015';
  try {
    var storedEra = localStorage.getItem('dr:era');
    if(storedEra === 'since-2015' || storedEra === 'full') currentEra = storedEra;
  } catch(e){}

  // Read account-type / tax-rate / era from the DOM. These live in the
  // calculator IIFE's controls; the channel viz doesn't own them, so
  // we read them directly each backtest run.
  function readBacktestParams(){
    var acctBtn = document.querySelector('[data-account].active');
    var accountType = acctBtn ? acctBtn.dataset.account : 'retirement';
    var trEl = document.getElementById('drTaxRate');
    var taxRate = trEl ? parseFloat(trEl.value) / 100 : 0;
    var minDay = currentEra === 'since-2015' ? startOf2015Day : null;
    return { accountType: accountType, taxRate: taxRate, minDay: minDay };
  }

  // Run the historical backtest at the user's current settings and
  // (a) paint history-marker datasets on the chart, (b) re-render the
  // "Historical signals at your current settings" summary block.
  function updateBacktest(sellRatio, rebuyRatio){
    var params = readBacktestParams();
    var bt = runHistoricalBacktest(sellRatio, rebuyRatio, params.accountType, params.taxRate, params.minDay);
    var hSells = [], hRebuys = [];
    bt.trades.forEach(function(t){
      var pt = { x: t.day, y: t.price };
      if(t.type === 'sell') hSells.push(pt);
      else hRebuys.push(pt);
    });
    chart.data.datasets[DS.histSellMarkers].data = hSells;
    chart.data.datasets[DS.histRebuyMarkers].data = hRebuys;
    renderHistoricalSummary(bt, sellRatio, rebuyRatio);
  }

  // Render the "Historical signals" block. Bounded table with one
  // row per trigger event, a final "Today" row anchoring current
  // state, and a summary line + volatility-compression note below.
  // Cumulative-BTC column tracks the running stack from a 1.0
  // starting position, directly comparable to a 1.0 BTC HODL.
  function renderHistoricalSummary(bt, sellRatio, rebuyRatio){
    var summaryEl = document.getElementById('drHistSignals');
    if(!summaryEl) return;

    var sellPctEl = document.getElementById('drSellPct');
    var rebuyPctEl = document.getElementById('drRebuyPct');
    var sellPct = sellPctEl ? sellPctEl.value : '?';
    var rebuyPct = rebuyPctEl ? rebuyPctEl.value : '?';

    // Empty case — current settings produced no triggers.
    if(bt.trades.length === 0){
      summaryEl.innerHTML = '<p class="dr-hist-signals-empty">At sell ' + sellPct + 'th &middot; rebuy ' + rebuyPct + 'th, the strategy would have fired <strong>zero</strong> triggers across ' + PL_DATA.length + ' historical price samples (~15 years). Bitcoin never crossed your sell threshold from below or your rebuy threshold from above. Try a less extreme percentile.</p>';
      return;
    }

    // Format helpers — local closures to keep this function self-contained.
    function fmtPrice(p){
      if(p >= 1e6) return '$' + (p/1e6).toFixed(2) + 'M';
      if(p >= 1000) return '$' + (p/1000).toFixed(1) + 'K';
      if(p >= 1) return '$' + p.toFixed(2);
      return '$' + p.toFixed(4);
    }
    function fmtBTC(b){
      if(Math.abs(b) >= 0.01) return b.toFixed(2);
      return b.toFixed(4);
    }
    function fmtCash(c){
      if(c >= 1e6) return '$' + (c/1e6).toFixed(2) + 'M';
      if(c >= 1000) return '$' + (c/1000).toFixed(1) + 'K';
      return '$' + c.toFixed(0);
    }
    function fmtMonth(day){
      var date = new Date(GENESIS_TS*1000 + day*86400*1000);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
    function fmtCumulative(btc, cash){
      var s = fmtBTC(btc) + ' BTC';
      if(cash > 1) s += ' + ' + fmtCash(cash);
      return s;
    }

    // ── HEADLINE ──
    var eraSpan = currentEra === 'since-2015'
      ? 'across the post-2015 record (~11 years)'
      : 'across ~15 years of bitcoin history';
    var startSpan = currentEra === 'since-2015' ? '<strong>1.00 BTC in 2015</strong>' : '<strong>1.00 BTC</strong>';
    var html = '<p class="dr-hist-signals-headline">At your current settings (sell ' + sellPct + 'th &middot; rebuy ' + rebuyPct + 'th), starting from ' + startSpan + ', the strategy would have fired <strong>' + bt.sellsCount + ' sell signal' + (bt.sellsCount === 1 ? '' : 's') + '</strong> and <strong>' + bt.rebuysCount + ' rebuy signal' + (bt.rebuysCount === 1 ? '' : 's') + '</strong> ' + eraSpan + '.</p>';

    // ── TABLE ──
    html += '<div class="dr-hist-table-wrap"><table class="dr-hist-table">';
    html += '<thead><tr>'
         +    '<th class="dr-col-date">Date</th>'
         +    '<th class="dr-col-action">Action</th>'
         +    '<th class="dr-col-price">Price</th>'
         +    '<th class="dr-col-ratio">Ratio</th>'
         +    '<th class="dr-col-delta">&Delta; BTC</th>'
         +    '<th class="dr-col-cum">Cumulative</th>'
         +  '</tr></thead><tbody>';

    // Trigger rows in chronological order.
    bt.trades.forEach(function(t){
      var verb = t.type === 'sell' ? 'SELL' : 'REBUY';
      var glyph = t.type === 'sell' ? '&#9660;' : '&#9650;';
      var actionClass = t.type === 'sell' ? 'dr-act-sell' : 'dr-act-rebuy';
      var deltaSign = t.deltaBTC >= 0 ? '+' : '&minus;';
      var deltaAbs = Math.abs(t.deltaBTC);
      html += '<tr>'
           +    '<td class="dr-col-date">' + fmtMonth(t.day) + '</td>'
           +    '<td class="dr-col-action ' + actionClass + '"><span class="dr-act-glyph">' + glyph + '</span> ' + verb + '</td>'
           +    '<td class="dr-col-price">' + fmtPrice(t.price) + '</td>'
           +    '<td class="dr-col-ratio">' + t.ratio.toFixed(2) + '&times;</td>'
           +    '<td class="dr-col-delta">' + deltaSign + fmtBTC(deltaAbs) + '</td>'
           +    '<td class="dr-col-cum">' + fmtCumulative(t.cumBTC, t.cumCash) + '</td>'
           +  '</tr>';
    });

    // ── TODAY ROW ──
    var todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

    // Threshold prices in absolute USD at today's trend value. Drives the
    // state label so users see "HODLing until $X" rather than just "waiting
    // to sell" — concrete trigger price reinforces that the strategy isn't
    // firing imminently when X is far above current price.
    var trendNow = bt.currentDay !== null ? plPrice(bt.currentDay) : null;
    var sellThresholdPrice = trendNow ? sellRatio * trendNow : null;
    var rebuyThresholdPrice = trendNow ? rebuyRatio * trendNow : null;
    function fmtThresholdPrice(p){
      if(p === null) return '—';
      if(p >= 1e6) return '$' + (p/1e6).toFixed(2) + 'M';
      if(p >= 1000) return '$' + Math.round(p/1000) + 'K';
      if(p >= 1) return '$' + p.toFixed(0);
      return '$' + p.toFixed(2);
    }

    var stateLabel, stateClass;
    if(bt.finalState === 'holding-stack'){
      stateLabel = 'HODLing until ' + fmtThresholdPrice(sellThresholdPrice);
      stateClass = 'dr-state-wait-sell';
    } else {
      stateLabel = 'Holding cash until ' + fmtThresholdPrice(rebuyThresholdPrice);
      stateClass = 'dr-state-wait-rebuy';
    }

    html += '<tr class="dr-hist-today">'
         +    '<td class="dr-col-date"><strong>' + todayStr + '</strong> <span class="dr-today-tag">today</span></td>'
         +    '<td class="dr-col-action ' + stateClass + '"><em>' + stateLabel + '</em></td>'
         +    '<td class="dr-col-price">' + fmtPrice(bt.currentPrice) + '</td>'
         +    '<td class="dr-col-ratio">' + (bt.currentRatio !== null ? bt.currentRatio.toFixed(2) + '&times;' : '&mdash;') + '</td>'
         +    '<td class="dr-col-delta">&mdash;</td>'
         +    '<td class="dr-col-cum"><strong>' + fmtCumulative(bt.btcHeld, bt.cashHeld) + '</strong></td>'
         +  '</tr>';
    html += '</tbody></table></div>';

    // ── SUMMARY LINE ──
    var multiplier = bt.btcHeld; // started at 1.0, so this is the HODL multiple in BTC terms
    var multStr = multiplier.toFixed(2) + '&times; HODL';
    var deltaPct = Math.abs((multiplier - 1) * 100);
    var deltaPctStr = deltaPct >= 10 ? deltaPct.toFixed(0) + '%' : deltaPct.toFixed(1) + '%';
    var directionWord = multiplier >= 1.0 ? 'gained' : 'lost';
    var summaryClass = multiplier >= 1.0 ? 'dr-hist-summary-up' : 'dr-hist-summary-down';

    // Tax-drag note when in regular mode and tax was actually paid.
    var acctBtn = document.querySelector('[data-account].active');
    var accountType = acctBtn ? acctBtn.dataset.account : 'retirement';
    var taxFootnote = '';
    if(accountType === 'regular'){
      var totalTax = 0;
      for(var ti = 0; ti < bt.trades.length; ti++) totalTax += (bt.trades[ti].taxPaid || 0);
      if(totalTax > 0){
        taxFootnote = ' Cumulative capital-gains tax across these sells: <strong>' + fmtCash(totalTax) + '</strong>.';
      }
    }

    html += '<div class="dr-hist-summary ' + summaryClass + '">'
         +    '<p>Across ~15 years and <strong>' + bt.cyclesCompleted + ' completed cycle' + (bt.cyclesCompleted === 1 ? '' : 's') + '</strong>, this configuration ended with <strong>' + fmtBTC(bt.btcHeld) + ' BTC</strong>'
         +    (bt.cashHeld > 1 ? ' plus <strong>' + fmtCash(bt.cashHeld) + '</strong> in cash' : '')
         +    ' &mdash; ' + multStr + ' (' + directionWord + ' ' + deltaPctStr + ' vs. holding through).' + taxFootnote + '</p>'
         +    '<p class="dr-hist-summary-honest">A fact about the historical record &mdash; not a forecast.</p>'
         +  '</div>';

    // ── VOLATILITY-COMPRESSION NOTE ──
    // Adapts to current era. In full-record mode it argues for why the
    // post-2015 view matters; in since-2015 mode it points the user
    // toward what the full record would expose.
    var volNoteHtml;
    if(currentEra === 'since-2015'){
      volNoteHtml = '<p><strong>You&rsquo;re viewing the post-volatility-compression era.</strong> Bitcoin&rsquo;s cycle amplitudes have shrunk dramatically over time &mdash; Cycle 1 peaked near 8&times; trend in 2011, recent cycles closer to 2&times;. This view excludes the early-history cycles whose magnitudes likely won&rsquo;t repeat. Switching to the full record above shows what would have happened across all of bitcoin&rsquo;s history including those extreme cycles &mdash; the strategy&rsquo;s structural worst case. <a href="/the-power-law#theory">See the Power Law Theory tab</a> for the underlying math.</p>';
    } else {
      volNoteHtml = '<p><strong>Why the post-2015 view matters.</strong> Bitcoin&rsquo;s cycle amplitudes have shrunk dramatically &mdash; Cycle 1 peaked near 8&times; trend in 2011, recent cycles closer to 2&times;. The full-record view above reflects an era of extreme volatility that won&rsquo;t repeat at the same magnitudes. Switching to <em>Since 2015</em> reflects the market that volatility compression has produced, and that the next cycle is more likely to resemble. <a href="/the-power-law#theory">See the Power Law Theory tab</a> for the underlying math.</p>';
    }
    html += '<div class="dr-hist-volatility-note">' + volNoteHtml + '</div>';

    summaryEl.innerHTML = html;
  }

  // Render the preset-comparison block — three presets × two windows.
  // Renders below the per-setting historical table. The dual-window
  // framing (full record vs. since 2015) is the heart of the page's
  // editorial finding: at every preset, restricting the analysis to
  // the post-volatility-compression era flips the verdict from "the
  // strategy mostly fails" to "the strategy mostly works". The reader
  // is asked to judge which era the future will resemble.
  //
  // Static once at page load — the comparison shows preset behavior
  // against the historical record, which doesn't change as the user
  // moves their personal sliders.
  function renderPresetComparison(){
    var el = document.getElementById('drPresetComparison');
    if(!el) return;

    // Jan 1, 2015 in days-from-genesis. Hardcoded boundary — see
    // editorial rationale in the contextual paragraph below the table:
    // bitcoin's pre-2015 cycles involved order-of-magnitude trend
    // growth in calendar years, a regime the volatility-compression
    // note already argues won't recur. Post-2015 cycles are more
    // representative of modern bitcoin dynamics.
    var startOf2015 = (Date.UTC(2015, 0, 1) / 1000 - GENESIS_TS) / 86400;

    var presets = [
      { key:'conservative', name:'Conservative', sellPct:70, rebuyPct:40 },
      { key:'standard',     name:'Standard',     sellPct:80, rebuyPct:50 },
      { key:'aggressive',   name:'Aggressive',   sellPct:90, rebuyPct:20 }
    ];

    function multClass(m){
      // Color scale: red < 0.5 < amber < 1.0 < green < 2.0 < bright-green
      if(m < 0.5) return 'dr-mult-red';
      if(m < 1.0) return 'dr-mult-amber';
      if(m < 2.0) return 'dr-mult-green';
      return 'dr-mult-bright-green';
    }
    function fmtMult(m){ return m.toFixed(2) + '×'; }

    var html = '<table class="dr-preset-table">';
    html += '<thead><tr>'
         +    '<th class="dr-pc-preset">Preset</th>'
         +    '<th class="dr-pc-trades">Triggers</th>'
         +    '<th class="dr-pc-window">Full record (2010+)</th>'
         +    '<th class="dr-pc-window">Since 2015</th>'
         +  '</tr></thead><tbody>';

    presets.forEach(function(p){
      var sR = percentileToRatio(p.sellPct);
      var rR = percentileToRatio(p.rebuyPct);
      var btFull = runHistoricalBacktest(sR, rR, 'retirement', 0);
      var bt2015 = runHistoricalBacktest(sR, rR, 'retirement', 0, startOf2015);

      // Cumulative position (BTC + cash-converted-to-BTC at latest price)
      // for fair × HODL — if the strategy ends mid-cycle holding cash,
      // converting that cash to BTC at the latest price is the equivalent
      // BTC count for comparison.
      var lastPrice = PL_DATA[PL_DATA.length-1][1];
      var fullEquiv = btFull.btcHeld + (btFull.cashHeld > 0 ? btFull.cashHeld / lastPrice : 0);
      var p2015Equiv = bt2015.btcHeld + (bt2015.cashHeld > 0 ? bt2015.cashHeld / lastPrice : 0);

      html += '<tr>';
      html += '<td class="dr-pc-preset"><strong>' + p.name + '</strong> <span class="dr-pc-spec">' + p.sellPct + ' / ' + p.rebuyPct + '</span></td>';
      html += '<td class="dr-pc-trades">' + btFull.sellsCount + ' sells &middot; ' + btFull.rebuysCount + ' rebuys</td>';
      html += '<td class="dr-pc-window ' + multClass(fullEquiv) + '">' + fmtMult(fullEquiv) + ' HODL</td>';
      html += '<td class="dr-pc-window ' + multClass(p2015Equiv) + '">' + fmtMult(p2015Equiv) + ' HODL</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';

    // ── CONTEXTUAL PARAGRAPH (direct voice) ──
    html += '<div class="dr-preset-commentary">'
         +    '<p>The strategy&rsquo;s verdict is era-dependent, not good or bad full-stop. Across the full historical record, two of three default presets <em>destroy</em> bitcoin &mdash; Conservative ends with 20% of HODL, Standard with 61%. The damage is concentrated in a single cycle: <strong>March 2013 SELL at $70 &rarr; January 2015 REBUY at $230</strong>, a 0.30&times; cycle multiplier. During bitcoin&rsquo;s most extreme-volatility era, the Power Law trend grew faster than any percentile-based threshold could keep up with. A correctly-fired sell at the 80th percentile in 2013 was rebuying into a higher absolute price two years later, even as the ratio dropped.</p>'
         +    '<p>Restricted to cycles since 2015, every preset beats HODL. The Aggressive setting nearly quadruples it. The post-2015 cycles &mdash; 2017&ndash;18, the 2019 micro-cycle, 2020&ndash;22 &mdash; produced reasonable BTC gains at every threshold combination, because the volatility compression that has since become the dominant feature of bitcoin&rsquo;s price action started kicking in around then.</p>'
         +    '<p>The reader&rsquo;s judgment, then, is which era the future will resemble. If you believe bitcoin will keep behaving like 2010&ndash;2014 &mdash; orders of magnitude in calendar years, percentile thresholds blown out by absolute price moves &mdash; the strategy is a cautionary tale and HODL is the answer. If you believe the volatility compression evident since 2015 reflects a maturing market that will continue, the strategy has historical merit at every preset, and the most aggressive settings deliver the most edge.</p>'
         +    '<p>One more dimension worth naming: the setting that performs best historically is also the one that asks the least of you in lived experience. Aggressive 90/20 fires triggers so rarely that you spend most of the time HODLing &mdash; the default Bitcoiner posture anyway. Conservative 70/40 fires triggers more often, so you spend more time in cash-and-anxious state, and you also end with the worst BTC outcome at full-record. The &lsquo;scary&rsquo; Aggressive setting is actually the least psychologically demanding to live with.</p>'
         +    '<p>Aggressive&rsquo;s edge has a precondition worth naming. The 90th-percentile sell only fires when bitcoin actually reaches that level &mdash; well above current price, and getting harder to reach as cycles compress. The same compression that flips the strategy&rsquo;s verdict from &lsquo;mostly fails&rsquo; to &lsquo;mostly works&rsquo; across all presets also reduces the frequency at which Aggressive&rsquo;s specific edge can materialize. A future where bitcoin&rsquo;s cycle peaks max out at 1.5&times;&ndash;2&times; trend would keep Aggressive in HODL state indefinitely, reducing it to its 1.0&times; HODL baseline.</p>'
         +  '</div>';

    el.innerHTML = html;
  }

  // Rebuild bands + thresholds when horizon changes (extends x-domain).
  // Rebuild bands + thresholds when horizon changes (extends x-domain).
  //
  // chart.resize() at the end is load-bearing. The natural call here is
  // chart.update('none') (via updateThresholds), but on the FIRST call
  // after initial chart construction Chart.js v4 doesn't fully recompute
  // element pixel positions — even though the new band data triggers a
  // scale-max change and the controllers are invoked, the layout cache
  // from the chart's first render survives and elements at every
  // dataset (bands AND historical AND markers) keep pixel positions
  // computed against the previous scale. The visible symptom (caught
  // by sticky-values restoring horizon=10 at page load with the slider
  // HTML default at 20): historical price line ends ~250 pixels left
  // of the Today line, with hover at the line's end correctly showing
  // 'Apr 2026' for the data but circles rendering at the year-2021
  // pixel position.
  //
  // Verified empirically (puppeteer harness with localStorage seeded
  // to dr:horizon=10):
  //   - chart.update('none') alone → elements stale at every dataset
  //   - chart.update() (default mode) → still stale
  //   - chart.update('reset') → fixes positions but flickers (bases
  //     y-values out then animates back in)
  //   - chart.resize() → no-op when canvas dimensions are unchanged,
  //     which is exactly the case here (the canvas size doesn't change
  //     when horizon does, only the data domain shrinks)
  //   - chart.update('resize') → fixes positions, no flicker, no
  //     dependency on canvas dimensions changing. This is the call
  //     Chart.js makes internally during a real resize-after-layout-
  //     change pass; invoking it directly forces the layout cache to
  //     invalidate without the visual reset that 'reset' mode causes.
  //
  // Guard: if the canvas isn't laid out yet (parent #tab-calculator
  // is display:none — the common case at page load when sticky values
  // fires the horizon input event before the user has navigated to
  // the calculator tab), skip the update and queue a deferred fix.
  // The ResizeObserver below catches the canvas going from 0×0 to
  // real dimensions and runs the update then.
  var pendingLayoutFix = false;
  function updateXDomain(){
    bands = bandData();
    chart.data.datasets[DS.floor].data = bands.floor;
    chart.data.datasets[DS.trend].data = bands.trend;
    chart.data.datasets[DS.upper].data = bands.upper;
    updateThresholds(); // re-extends sell/rebuy lines + re-runs backtest
    if(canvas.clientWidth > 0){
      chart.update('resize');
    } else {
      pendingLayoutFix = true;
    }
  }

  // ResizeObserver catches the canvas going from 0×0 (hidden tab) to
  // real dimensions (user clicked into the calculator tab). When that
  // transition happens AND we deferred a layout fix during the page-
  // load updateXDomain, run update('resize') so element positions
  // catch up to the current scale. Well-supported in evergreen
  // browsers; degrades to a slightly-stale chart on first calculator-
  // tab view if ResizeObserver is unavailable.
  if(typeof ResizeObserver !== 'undefined'){
    var ro = new ResizeObserver(function(){
      if(pendingLayoutFix && canvas.clientWidth > 0){
        pendingLayoutFix = false;
        chart.update('resize');
      }
    });
    ro.observe(canvas);
  }

  // Initial backtest at script-load (before any user interaction).
  updateBacktest(initialSellRatio, initialRebuyRatio);
  chart.update('none');

  // Preset comparison block — three presets × two windows. Static, runs once.
  renderPresetComparison();

  if(sellEl) sellEl.addEventListener('input', updateThresholds);
  if(rebuyEl) rebuyEl.addEventListener('input', updateThresholds);
  // drHorizon is no longer in the DOM (historical-only redesign), but
  // keep the guarded query so the code is robust if/when sliders evolve.
  var horizonEl = document.getElementById('drHorizon');
  if(horizonEl) horizonEl.addEventListener('input', updateXDomain);

  // Tax-rate and account-type each materially change backtest output
  // (tax drag, cumulative BTC) without touching threshold lines or
  // marker positions on the chart. Re-run the backtest so the table
  // + summary refresh; chart datasets for bands and historical markers
  // don't change so chart.update is cheap.
  var taxRateEl = document.getElementById('drTaxRate');
  if(taxRateEl) taxRateEl.addEventListener('input', updateThresholds);
  document.querySelectorAll('[data-account]').forEach(function(b){
    b.addEventListener('click', function(){
      // Brief defer — calc IIFE's click handler runs first, sets the
      // .active class on the toggle, then this fires and the backtest
      // re-reads account type via querySelector('[data-account].active').
      setTimeout(updateThresholds, 0);
    });
  });

  // ─── ERA TOGGLE ───
  // Two buttons in the historical-signals header: 'Full record (2010+)'
  // and 'Since 2015'. Clicking switches the window the table + Today
  // row + summary + volatility note all reflect. State persists in
  // localStorage so a returning reader stays in the era they last chose.
  var eraButtons = document.querySelectorAll('.dr-era-btn');
  function syncEraButtons(){
    eraButtons.forEach(function(b){
      b.classList.toggle('active', b.dataset.era === currentEra);
      b.setAttribute('aria-pressed', b.dataset.era === currentEra ? 'true' : 'false');
    });
  }
  eraButtons.forEach(function(b){
    b.addEventListener('click', function(){
      var newEra = b.dataset.era;
      if(newEra === currentEra) return;
      currentEra = newEra;
      try { localStorage.setItem('dr:era', currentEra); } catch(e){}
      syncEraButtons();
      updateThresholds();
    });
  });
  // Sync initial active state to whatever currentEra was loaded as
  // (may have been 'since-2015' if previously stored).
  syncEraButtons();

  // (No 'dr:simResult' listener — calculator IIFE no longer dispatches
  // forward-simulation results since the historical-only redesign.
  // The channel viz's forward-projection datasets stay empty by
  // initial config.)

})();

// ═══════ CALCULATOR ═══════
// Math engine + percentile computation + state machine + UI wiring.
(function(){
  // Bail if calculator surface not present (e.g., hash deep-link to non-calc tab and elements stripped)
  if(!document.getElementById('drSellPct')) return;

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
  var elSellPct = document.getElementById('drSellPct');
  var elSellPctReadout = document.getElementById('drSellPctReadout');
  var elRebuyPct = document.getElementById('drRebuyPct');
  var elRebuyPctReadout = document.getElementById('drRebuyPctReadout');
  var elTaxRate = document.getElementById('drTaxRate');
  var elTaxRateValue = document.getElementById('drTaxRateValue');
  var elTaxRow = document.getElementById('drTaxRow');

  // ─── STATE & STICKINESS ───
  var STORAGE_PREFIX = 'dr:';
  // Stack is intentionally NOT in this list — sitewide convention §8.2
  var STICKY = {
    drSellPct: 'sellPct',
    drRebuyPct: 'rebuyPct',
    drTaxRate: 'taxRate'
  };
  var STICKY_TOGGLE = {
    accountType: 'retirement',
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
    // Dispatch 'input' on the threshold sliders so the channel viz IIFE
    // picks up the restored values (its threshold-line and historical-
    // backtest update path is wired to slider 'input' events, not to a
    // bare value assignment). Without this, returning visitors with
    // non-default sliders in localStorage would see channel-viz state
    // matching the defaults rather than their stored settings.
    ['drSellPct', 'drRebuyPct', 'drTaxRate'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    // Toggles
    var aT = loadSetting('accountType') || 'retirement';
    var pS = loadSetting('preset') || 'standard';
    setAccountType(aT, true);
    // preset is informational only; sliders carry the actual values
    document.querySelectorAll('.dr-preset-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.preset === pS);
    });
  }

  // ─── PRESETS ───
  var PRESETS = {
    conservative: { sellPct: 70, rebuyPct: 40 },
    standard:     { sellPct: 80, rebuyPct: 50 },
    aggressive:   { sellPct: 90, rebuyPct: 20 }
  };
  function applyPreset(name){
    var p = PRESETS[name]; if(!p) return;
    elSellPct.value = p.sellPct;
    elRebuyPct.value = p.rebuyPct;
    // Dispatch 'input' on each slider whose value changed programmatically.
    // The channel viz IIFE listens directly for slider 'input' events to
    // refresh threshold lines + the historical backtest, and those listeners
    // don't fire from a bare value assignment.
    elSellPct.dispatchEvent(new Event('input', { bubbles: true }));
    elRebuyPct.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelectorAll('.dr-preset-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.preset === name);
    });
    saveSetting('preset', name);
    saveSetting('sellPct', p.sellPct);
    saveSetting('rebuyPct', p.rebuyPct);
    updateReadouts();
  }

  // ─── ACCOUNT TYPE TOGGLE ───
  var accountType = 'retirement';

  function setAccountType(type, silent){
    accountType = type;
    document.querySelectorAll('[data-account]').forEach(function(b){
      b.classList.toggle('active', b.dataset.account === type);
    });
    if(elTaxRow) elTaxRow.style.display = (type === 'regular') ? 'flex' : 'none';
    if(!silent){
      saveSetting('accountType', type);
      // Channel viz reads account-type via querySelector('[data-account].active')
      // each backtest run; fire a synthetic 'input' on the tax-rate slider so
      // its existing listener re-runs the backtest with the new account-type
      // (and tax-rate visibility now reflecting the toggle).
      if(elTaxRate) elTaxRate.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  // setGrowthModel removed — growth-model toggle no longer in DOM.

  // ─── READOUT UPDATES (live) ───
  function updateReadouts(){
    var sP = parseInt(elSellPct.value);
    var rP = parseInt(elRebuyPct.value);
    var sR = percentileToRatio(sP);
    var rR = percentileToRatio(rP);

    // Today's threshold prices in absolute USD — concrete anchor for
    // what the slider value means right now. Trend at today's day
    // sets the reference; the percentile-derived ratio scales it.
    var todayD = (Date.now()/1000 - GENESIS_TS) / 86400;
    var trendNow = plPrice(todayD);
    var sellThresholdToday = sR * trendNow;
    var rebuyThresholdToday = rR * trendNow;
    function fmtThresh(p){
      if(p >= 1e6) return '$' + (p/1e6).toFixed(2) + 'M';
      if(p >= 1000) return '$' + Math.round(p/1000) + 'K';
      return '$' + p.toFixed(0);
    }

    // Tight inline readout — just the percentile name
    elSellPctReadout.innerHTML = sP + 'th percentile';
    elRebuyPctReadout.innerHTML = rP + 'th percentile';

    // Full prose explainer below each slider — same data points the
    // old inline readout carried, but spelled out for readers who'd
    // otherwise need to do mental math (per session 2026-05-09 user
    // feedback). Updates live with slider movement.
    var sellEx = document.getElementById('drSellPctExplainer');
    if(sellEx){
      sellEx.innerHTML = 'Sell trigger fires when bitcoin reaches the <strong>' + sP + 'th percentile</strong> of its Power Law channel position &mdash; about <strong>' + sR.toFixed(2) + '&times; trend</strong>, or roughly <strong>' + fmtThresh(sellThresholdToday) + '</strong> at today&rsquo;s trend value. Bitcoin has historically traded at-or-above this level only <strong>' + (100-sP) + '%</strong> of the time.';
    }
    var rebuyEx = document.getElementById('drRebuyPctExplainer');
    if(rebuyEx){
      var medianClause = (rP === 50) ? ' &mdash; the historical median' : '';
      rebuyEx.innerHTML = 'Rebuy trigger fires when bitcoin falls back to the <strong>' + rP + 'th percentile</strong>' + medianClause + ' &mdash; about <strong>' + rR.toFixed(2) + '&times; trend</strong>, or roughly <strong>' + fmtThresh(rebuyThresholdToday) + '</strong> at today&rsquo;s trend value. Bitcoin has historically traded at-or-below this level <strong>' + rP + '%</strong> of the time.';
    }

    if(elTaxRateValue) elTaxRateValue.textContent = elTaxRate.value + '%';
  }
  // updateStatBlock removed — drStatBlock element is gone.

  // ─── EVENT WIRING ───
  // (No stack input or forward-sim runner anymore — historical-only redesign.
  // The channel viz IIFE handles the backtest rerun via its own listeners
  // on the same sliders + account toggle; calc IIFE here just persists
  // sticky values, updates readouts, and manages preset-active state.)

  Object.keys(STICKY).forEach(function(elId){
    var el = document.getElementById(elId);
    if(!el) return;
    el.addEventListener('input', function(){
      saveSetting(STICKY[elId], el.value);
      // Slider changes mean we're off-preset (unless settings happen to match a preset)
      var matched = null;
      Object.keys(PRESETS).forEach(function(name){
        var p = PRESETS[name];
        if(p.sellPct == elSellPct.value && p.rebuyPct == elRebuyPct.value){
          matched = name;
        }
      });
      document.querySelectorAll('.dr-preset-btn').forEach(function(b){
        b.classList.toggle('active', b.dataset.preset === matched);
      });
      saveSetting('preset', matched || '');
      updateReadouts();
    });
  });

  document.querySelectorAll('.dr-preset-btn').forEach(function(b){
    b.addEventListener('click', function(){ applyPreset(b.dataset.preset); });
  });
  document.querySelectorAll('[data-account]').forEach(function(b){
    b.addEventListener('click', function(){ setAccountType(b.dataset.account); });
  });
  // Note: [data-growth] buttons no longer in DOM — historical-only redesign.

  // ─── CUSTOMIZE COLLAPSE TOGGLE ───
  // Default-closed; expanded state persists in localStorage so a
  // returning customizer stays in customize-on mode. ARIA attributes
  // (aria-expanded on the button, hidden on the body) are kept in
  // sync for screen-reader correctness.
  var customizeToggle = document.getElementById('drCustomizeToggle');
  var customizeBody = document.getElementById('drCustomizeBody');
  function setCustomizeOpen(open, persist){
    if(!customizeToggle || !customizeBody) return;
    customizeToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if(open){ customizeBody.removeAttribute('hidden'); }
    else { customizeBody.setAttribute('hidden', ''); }
    if(persist) saveSetting('customizeOpen', open ? '1' : '0');
  }
  if(customizeToggle){
    customizeToggle.addEventListener('click', function(){
      var nowOpen = customizeToggle.getAttribute('aria-expanded') !== 'true';
      setCustomizeOpen(nowOpen, true);
    });
  }
  // Restore stored state at init (default = closed)
  var storedCustomize = loadSetting('customizeOpen');
  if(storedCustomize === '1') setCustomizeOpen(true, false);

  // ─── INIT ───
  loadStickyValues();
  updateReadouts();
  // Don't auto-run until user enters a stack value (privacy: no implicit re-runs with default stack)
})();
