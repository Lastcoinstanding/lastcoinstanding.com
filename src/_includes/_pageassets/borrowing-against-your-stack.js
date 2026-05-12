// ═══════════════════════════════════════════════════════════════════
// BORROWING AGAINST YOUR STACK — page logic
//
// Three-tab page: Question / Calculator / Math. This file handles
// tab routing + the Calculator's first-slice math (LTV → liquidation
// price → channel position) and the Power Law channel chart.
//
// Subsequent commits will add: interest-rate and horizon inputs,
// borrow-vs-sell comparison (interest cost vs. capital-gains-tax
// saved), three loss-scenario backtests (liquidation / counterparty
// default / DeFi infrastructure), and the 0% borrowing baseline.
//
// PL_DATA + PL_A/B/FLOOR/CEIL + GENESIS_TS + plPrice() come from
// shared/power-law-data.js (loaded before this file via njk
// page_scripts). Tab-routing pattern matches Disciplined Rebalancing.
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
  // Honor deep-link via URL hash on initial load
  var hash = location.hash.replace('#','');
  if(hash){
    var target = document.querySelector('[data-tab="'+hash+'"]');
    if(target) target.click();
  }
})();


// ═══════ CALCULATOR ═══════
// Input → output flow:
//   1. User sets stack, current price, loan amount, liquidation threshold.
//   2. We compute LTV = loan / (stack * price), color-coded by zone.
//   3. We compute liquidation price = loan / (stack * threshold).
//   4. We compute drawdown to liq = (price - liqPrice) / price.
//   5. We compute channel position of liq = liqPrice / plPrice(today).
//   6. Chart renders Power Law channel with current and liquidation markers.
//
// The channel-position output is the page's editorially distinctive
// number — it's what tells you whether you have structural buffer
// (liq below floor → safe even if bitcoin breaks trend) or you're
// betting on continued strength (liq above trend → routine mean-
// reversion liquidates you). The Question tab references both zones
// explicitly; the Calculator surfaces which one your inputs put you in.
(function(){
  var stackInput = document.getElementById('basBtcStack');
  if (!stackInput) return; // calculator markup not present (e.g. on stub-only build)

  var priceInput        = document.getElementById('basBtcPrice');
  var loanInput         = document.getElementById('basLoanAmount');
  var liqThresholdSlider = document.getElementById('basLiqThreshold');

  var liqThresholdDisplay = document.getElementById('basLiqThresholdDisplay');
  var ltvOut            = document.getElementById('basLtvOut');
  var ltvZoneLabel      = document.getElementById('basLtvZone');
  var liqPriceOut       = document.getElementById('basLiqPrice');
  var liqDrawdownOut    = document.getElementById('basLiqDrawdown');
  var channelPosOut     = document.getElementById('basChannelPos');
  var channelHintOut    = document.getElementById('basChannelHint');
  var interpOut         = document.getElementById('basInterp');

  // Auto-fill the current BTC price from the most recent PL_DATA sample,
  // rounded to the nearest hundred. The page is editorial reference; we
  // accept a slight lag rather than depending on a live price feed.
  if (typeof PL_DATA !== 'undefined' && PL_DATA.length) {
    var latest = PL_DATA[PL_DATA.length - 1];
    if (!priceInput.value || priceInput.value === '0') {
      priceInput.value = Math.round(latest[1] / 100) * 100;
    }
  }

  var chart = null;

  function fmtUsd(n) {
    if (n >= 1e9) return '$' + (n/1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + Math.round(n).toLocaleString();
    if (n >= 1)   return '$' + n.toFixed(2);
    return '$' + n.toFixed(4);
  }
  function pct(n, decimals) {
    var d = (decimals === undefined) ? 1 : decimals;
    return (n*100).toFixed(d) + '%';
  }
  function daysSinceGenesis() {
    return (Date.now()/1000 - GENESIS_TS) / 86400;
  }

  // LTV zone classification — used to color-code the LTV output card
  // and to surface a one-word interpretation alongside the number.
  // Bands match the Question tab's recommendations:
  //   <40% conservative, 40-60% moderate, >60% aggressive.
  function ltvZone(ltv) {
    if (ltv < 0.40) return { label: 'Conservative', cls: 'bas-zone-good' };
    if (ltv < 0.60) return { label: 'Moderate',     cls: 'bas-zone-warn' };
    return                 { label: 'Aggressive',   cls: 'bas-zone-bad'  };
  }

  // Channel-position classification — maps liquidation-price-as-multiple-
  // of-today's-trend to the descriptive zones used in the Question tab.
  function channelZone(liqRatio) {
    if (liqRatio < PL_FLOOR) {
      return {
        label: 'Below channel floor',
        cls: 'bas-zone-good',
        hint: 'Bitcoin would need to break the long-term structural floor for liquidation.'
      };
    }
    if (liqRatio < 1.0) {
      return {
        label: 'Between floor and trend',
        cls: 'bas-zone-warn',
        hint: 'Floor has held historically; some buffer but less than the conservative case.'
      };
    }
    if (liqRatio < PL_CEIL) {
      return {
        label: 'In upper channel',
        cls: 'bas-zone-bad',
        hint: 'Routine mean-reversion to trend would liquidate this position.'
      };
    }
    return {
      label: 'Above channel ceiling',
      cls: 'bas-zone-bad',
      hint: 'Liquidation requires bitcoin to be above 3× trend — very exposed.'
    };
  }

  function recompute() {
    var stack         = parseFloat(stackInput.value)        || 0;
    var price         = parseFloat(priceInput.value)        || 0;
    var loan          = parseFloat(loanInput.value)         || 0;
    var liqThreshold  = parseFloat(liqThresholdSlider.value)/ 100;

    liqThresholdDisplay.textContent = liqThresholdSlider.value;

    if (stack <= 0 || price <= 0 || loan <= 0) {
      ltvOut.textContent = '—';
      liqPriceOut.textContent = '$—';
      liqDrawdownOut.textContent = '—';
      channelPosOut.textContent = '—';
      channelHintOut.textContent = '—';
      interpOut.innerHTML = '<p>Enter a stack size, current price, and loan amount above to see your liquidation position on the Power Law channel.</p>';
      return;
    }

    var stackUsd      = stack * price;
    var ltv           = loan / stackUsd;
    var liqPrice      = loan / (stack * liqThreshold);
    var drawdownToLiq = (price - liqPrice) / price;

    var todayDays     = daysSinceGenesis();
    var trendToday    = plPrice(todayDays);
    var liqRatio      = liqPrice / trendToday;
    var currentRatio  = price / trendToday;

    var lz = ltvZone(ltv);
    var cz = channelZone(liqRatio);

    // ─── Output cards ───
    ltvOut.textContent = pct(ltv, 1);
    ltvZoneLabel.textContent = lz.label;
    ltvZoneLabel.className = 'bas-calc-output-zone ' + lz.cls;

    liqPriceOut.textContent = fmtUsd(liqPrice);
    liqDrawdownOut.textContent = 'BTC must fall ' + pct(drawdownToLiq, 0) +
      ' from $' + Math.round(price).toLocaleString();

    channelPosOut.textContent = cz.label;
    channelPosOut.className = 'bas-calc-output-value bas-calc-output-zoned ' + cz.cls;
    channelHintOut.textContent = cz.hint;

    // ─── Interpretation paragraph ───
    // Contextualizes the numbers in the editorial frame from the Question tab.
    var interpSafety;
    if (liqRatio < PL_FLOOR) {
      interpSafety = 'Your liquidation price sits <strong>below the channel floor</strong> — bitcoin would need to break the long-term structural support that has held across every cycle of the last fifteen years for your position to liquidate. This is the conservative zone the Question tab references.';
    } else if (liqRatio < 1.0) {
      interpSafety = 'Your liquidation price sits <strong>between the floor and the trend</strong>. The floor has held across multiple historical drawdowns, but you have less buffer than the most conservative case. A typical bear-market drawdown would bring price close to but not through your liquidation.';
    } else if (liqRatio < PL_CEIL) {
      interpSafety = 'Your liquidation price sits <strong>above the trend</strong>. Routine mean-reversion to trend would liquidate this position. The Question tab calls this "betting on continued strength" rather than "buying room to be wrong."';
    } else {
      interpSafety = 'Your liquidation price sits <strong>above the upper channel bound</strong>. Bitcoin would have to remain at extended cycle-peak levels to keep this position alive — a position that requires euphoria to survive.';
    }

    interpOut.innerHTML =
      '<p>At <strong>' + pct(ltv, 1) + '</strong> LTV against <strong>' + stack.toFixed(2) + ' BTC</strong>, ' +
      'your <strong>' + fmtUsd(loan) + '</strong> loan liquidates if BTC falls to <strong>' +
      fmtUsd(liqPrice) + '</strong> — a <strong>' + pct(drawdownToLiq, 0) +
      '</strong> drawdown from today\'s price.</p>' +
      '<p>' + interpSafety + '</p>';

    renderChart(price, liqPrice);
  }

  // ═══════ CHART ═══════
  // Power Law channel chart with two markers: current price and liquidation
  // price. The liquidation line extends horizontally from today forward;
  // as time passes, the channel's floor rises through that line — making
  // the "your buffer grows with time" point visible without a separate
  // explainer.
  function renderChart(currentPrice, liqPrice) {
    if (typeof Chart === 'undefined') return;
    var canvas = document.getElementById('basChannelChart');
    if (!canvas) return;

    var todayDays  = daysSinceGenesis();
    var futureDays = todayDays + 365 * 5; // 5 years forward
    var startDays  = 592; // first PL_DATA day

    var floorPts = [], trendPts = [], upperPts = [];
    for (var d = startDays; d <= futureDays; d += 30) {
      var t = plPrice(d);
      floorPts.push({ x: d, y: t * PL_FLOOR });
      trendPts.push({ x: d, y: t });
      upperPts.push({ x: d, y: t * PL_CEIL });
    }
    var historyPts   = PL_DATA.map(function(p){ return { x: p[0], y: p[1] }; });
    var currentDot   = [{ x: todayDays, y: currentPrice }];
    var liqLineSeries = [{ x: todayDays, y: liqPrice }, { x: futureDays, y: liqPrice }];

    if (chart) chart.destroy();

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          { label: 'Upper (3.0× trend)', data: upperPts,
            borderColor: 'rgba(224,148,34,0.35)', borderWidth: 1,
            borderDash: [4,3], pointRadius: 0, fill: false, order: 4 },
          { label: 'Trend',               data: trendPts,
            borderColor: 'rgba(224,148,34,0.6)',  borderWidth: 1.4,
            pointRadius: 0, fill: false, order: 3 },
          { label: 'Floor (0.42× trend)', data: floorPts,
            borderColor: 'rgba(224,148,34,0.35)', borderWidth: 1,
            borderDash: [4,3], pointRadius: 0, fill: false, order: 4 },
          { label: 'Historical price',    data: historyPts,
            borderColor: 'rgba(232,224,212,0.8)', borderWidth: 1.5,
            pointRadius: 0, fill: false, order: 2 },
          { label: 'Liquidation price',   data: liqLineSeries,
            borderColor: '#c0392b', borderWidth: 2,
            borderDash: [6,4], pointRadius: 0, fill: false, order: 1 },
          { label: 'Current price',       data: currentDot,
            borderColor: '#27ae60', backgroundColor: '#27ae60',
            pointRadius: 6, pointHoverRadius: 8, showLine: false, order: 0 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'x', axis: 'x', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            titleColor: 'rgba(255,255,255,0.9)',
            bodyColor: 'rgba(255,255,255,0.8)',
            borderColor: 'rgba(224,148,34,0.4)',
            borderWidth: 1,
            callbacks: {
              title: function(items){
                if(!items.length) return '';
                var d = new Date(GENESIS_TS*1000 + items[0].parsed.x*86400*1000);
                return d.toLocaleDateString('en-US', { year:'numeric', month:'short' });
              },
              label: function(item){
                var label = item.dataset.label;
                var v = item.parsed.y;
                if (v >= 1000) return label + ': $' + Math.round(v).toLocaleString();
                if (v >= 1)    return label + ': $' + v.toFixed(2);
                return label + ': $' + v.toFixed(4);
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            min: startDays,
            max: futureDays,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              maxTicksLimit: 12,
              callback: function(v){
                var date = new Date(GENESIS_TS*1000 + v*86400*1000);
                return date.getFullYear();
              }
            }
          },
          y: {
            type: 'logarithmic',
            min: 0.05,
            max: 1e7,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              callback: function(v){
                if (v >= 1e6) return '$' + (v/1e6) + 'M';
                if (v >= 1e3) return '$' + (v/1e3) + 'K';
                if (v >= 1)   return '$' + v;
                return '$' + v;
              }
            }
          }
        }
      }
    });
  }

  // Wire inputs — recompute on every change.
  ['input','change'].forEach(function(evt){
    [stackInput, priceInput, loanInput, liqThresholdSlider].forEach(function(el){
      el.addEventListener(evt, recompute);
    });
  });

  // When calculator tab activates, render. The chart needs a visible
  // canvas at construction time for responsive sizing.
  var calcBtn = document.querySelector('.tab-btn[data-tab="calculator"]');
  if (calcBtn) {
    calcBtn.addEventListener('click', function(){
      setTimeout(recompute, 30);
    });
  }
  // If the calculator tab is the initial active tab (URL hash deep-link),
  // do an initial compute. Otherwise compute lazily on activation.
  if (document.getElementById('tab-calculator') &&
      document.getElementById('tab-calculator').classList.contains('active')) {
    recompute();
  } else {
    // Pre-compute outputs (text) so they're populated when tab opens,
    // but don't render chart yet — Chart.js needs visible dimensions.
    // (Cheap fallback: just leave outputs as their placeholder text.)
  }
})();
