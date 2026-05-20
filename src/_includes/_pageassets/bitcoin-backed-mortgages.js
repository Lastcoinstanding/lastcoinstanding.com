/* ═══════════════════════════════════════════════════════════════
   BITCOIN-BACKED MORTGAGES — calculator logic

   Pledge vs Sell comparison for funding a home down payment.

   Three paths, all evaluated at the same horizon:

   PLEDGE:
     - Take the Coinbase/Better/Fannie-Mae product
     - BOTH loans (primary + second-lien) carry the combined rate of
       (standard 30-yr rate + premium); the premium applies to the
       full borrowed amount per the published product structure,
       not only to the second-lien. The borrower keeps the full BTC
       stack — it appreciates per Power Law.
     - Cost-of-pledge delta vs the sell baseline:
         (down_payment × rate + home_price × premium) × horizon
       — simple-interest approximation, matching the parent BvS
       calculator convention. The two terms decompose as:
         · down_payment × rate × t  — base-rate interest on the
           down-payment portion, which the sell path doesn't borrow
           at all (and so doesn't pay)
         · home_price × premium × t  — the premium portion applied
           to the entire mortgage (per Coinbase's blog)
     - Early-repayment input caps the interest accrual: if the user
       repays the second-lien at year R, the cost contribution
       stops at R rather than continuing to horizon. Released
       collateral funds the rest of the home (or refinances the
       primary at the standard rate); calc treats the cost as
       'paused' from year R onward.
     - At horizon: wealth = stack × P_powerLaw(t) − cost(min(t, R))

   SELL:
     - Sell enough BTC at today's price to net the down payment
       after tax. Take a normal Fannie-Mae conforming mortgage on
       the rest at the standard rate (no premium).
     - BTC stack reduced by btcSold; no premium interest cost; cap
       gains paid upfront.
     - At horizon: wealth = (stack − btcSold) × P_powerLaw(t)

   HOLD (0% borrowing baseline):
     - Don't buy the house at all. Keep the full stack untouched.
     - At horizon: wealth = stack × P_powerLaw(t)
     - This is the 'genuinely conservative baseline' per
       RETIREMENT_CALCULATOR_DESIGN §4.2 — the reference against
       which both Pledge and Sell represent decisions to commit
       BTC to a home purchase. Both Pledge and Sell carry a cost
       relative to this baseline; the calc surfaces that cost as
       the gap between the lines on the chart.

   Tactical / strategic preset toggle scopes the horizon to either
   5y (tactical — short-term cash-flow framing) or 30y (strategic —
   full-duration appreciation framing). The slider remains the
   canonical control; the toggle is a one-click preset.

   Shared state with the borrowing page (BAY):
     stack / price / costBasis / capGainsTax sync via localStorage
     so the user's inputs persist across the two pages. Mortgage-
     specific inputs (home price, down payment %, mortgage rate,
     premium, horizon, early-repayment) are local to this page.
   ═══════════════════════════════════════════════════════════════ */

(function(){
  if(typeof PL_DATA === 'undefined' || !PL_DATA.length) return;

  // ─── Power Law trend price at a given days-from-genesis ───
  // Use GENESIS_TS exported by the shared PL_DATA module (seconds since
  // epoch) - same pattern as the BAY calculator. PL_DATA format is
  // [days_since_genesis, price_usd] pairs, not [date_string, price].
  // plPrice() also comes from the shared module.

  function daysSinceGenesisNow(){
    return (Date.now()/1000 - GENESIS_TS) / 86400;
  }

  function plPriceAtYear(year){
    // Power Law price at (today + year × 365.25 days)
    return plPrice(daysSinceGenesisNow() + year * 365.25);
  }

  // ─── Formatting helpers ───
  function fmtUsd(v){
    if(v === null || v === undefined || isNaN(v)) return '$—';
    var abs = Math.abs(v);
    if(abs >= 1e9) return (v < 0 ? '−' : '') + '$' + (Math.abs(v)/1e9).toFixed(2) + 'B';
    if(abs >= 1e6) return (v < 0 ? '−' : '') + '$' + (Math.abs(v)/1e6).toFixed(2) + 'M';
    if(abs >= 1e3) return (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString();
    return (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v));
  }
  function fmtBtc(v){
    if(v === null || v === undefined || isNaN(v)) return '— BTC';
    return v.toFixed(v < 1 ? 4 : 3) + ' BTC';
  }
  function fmtPct(v){
    return v.toFixed(1) + '%';
  }

  // ─── Element refs ───
  // All inputs are now sliders (slider-cluster pattern per STYLE_GUIDE
  // §6.16). Each slider has a sibling .slider-val span that shows its
  // formatted current value (populated by updateSliderVals() below).
  var homePriceInput   = document.getElementById('bbmHomePrice');
  var downPctSlider    = document.getElementById('bbmDownPct');
  var priceInput       = document.getElementById('bbmBtcPrice');
  var costBasisInput   = document.getElementById('bbmCostBasis');
  var mortRateSlider   = document.getElementById('bbmMortRate');
  var premiumSlider    = document.getElementById('bbmPremium');
  var horizonSlider    = document.getElementById('bbmHorizon');
  var capGainsSlider   = document.getElementById('bbmCapGains');
  var earlyRepaySlider = document.getElementById('bbmEarlyRepay');

  // Slider-val displays — formatted current-value spans next to each slider
  var homePriceVal     = document.getElementById('bbmHomePriceVal');
  var downPctVal       = document.getElementById('bbmDownPctVal');
  var priceVal         = document.getElementById('bbmBtcPriceVal');
  var costBasisVal     = document.getElementById('bbmCostBasisVal');
  var mortRateVal      = document.getElementById('bbmMortRateVal');
  var premiumVal       = document.getElementById('bbmPremiumVal');
  var horizonVal       = document.getElementById('bbmHorizonVal');
  var capGainsVal      = document.getElementById('bbmCapGainsVal');
  var earlyRepayVal    = document.getElementById('bbmEarlyRepayVal');

  // Derived required-collateral display (Commit 2 calc simplification — JM12).
  // The required pledged BTC is a *derived output* of (home_price, down_pct,
  // current_price), not a user input. Prominent placement so the user can
  // gauge whether the product is reachable for their situation without
  // scrolling past a 'not feasible' failure message hidden below the chart.
  var collateralValue  = document.getElementById('bbmCollateralValue');
  var collateralSub    = document.getElementById('bbmCollateralSub');

  // Tactical/strategic preset buttons (set horizon when clicked)
  var presetButtons    = document.querySelectorAll('.bbm-horizon-preset');

  var pledgeHeadline   = document.getElementById('bbmPledgeHeadline');
  var pledgeRows       = document.getElementById('bbmPledgeRows');
  var sellHeadline     = document.getElementById('bbmSellHeadline');
  var sellRows         = document.getElementById('bbmSellRows');
  var verdict          = document.getElementById('bbmVerdict');
  var chartCanvas      = document.getElementById('bbmWealthChart');

  if(!homePriceInput || !chartCanvas) return;

  // ─── Auto-populate price + cost basis from latest PL sample on first load ───
  // localStorage values from BAY (if present) override the PL sample.
  var latest = PL_DATA[PL_DATA.length - 1];
  var latestPrice = Math.round(latest[1] / 1000) * 1000;
  priceInput.value = latestPrice;
  costBasisInput.value = latestPrice;

  // ─── Hydrate shared current-price from localStorage (set by the BAY page) ───
  // Stack is no longer an input on this page (Commit 2 simplification — JM12),
  // so only the current-price field shares state with BAY.
  var SHARED = [
    { key: 'bas_price',  el: priceInput }
  ];
  SHARED.forEach(function(p){
    try {
      var v = localStorage.getItem(p.key);
      if(v !== null && v !== '' && !isNaN(parseFloat(v))){
        p.el.value = v;
      }
    } catch(e){}
  });

  // ─── Chart.js instance (initialised on first compute) ───
  var chart = null;

  // ─── The math (Commit 2 simplification — JM12) ───
  // Calculator is now stack-independent. The Pledge-vs-Sell differential
  // doesn't actually depend on stack size — it's:
  //   differential = btcSold × P(t) − pledgeExtraInterest(t)
  // where btcSold is the BTC the user would have to sell to net the down-
  // payment after tax. Both costs are computed from (downPayment, current
  // price, cost basis, tax rate, rates) — none of which depend on stack.
  //
  // The chart shows the two cost trajectories. The user can read the
  // required pledged collateral as a derived display above and compare
  // it against their own holdings mentally — feasibility-failure surface
  // is no longer needed.
  function compute(){
    var homePrice    = parseFloat(homePriceInput.value)   || 0;
    var downPct      = parseFloat(downPctSlider.value)    / 100;
    var price        = parseFloat(priceInput.value)       || 0;
    var costBasis    = parseFloat(costBasisInput.value)   || 0;
    var mortRate     = parseFloat(mortRateSlider.value)   / 100;
    var premium      = parseFloat(premiumSlider.value)    / 100;
    var horizon      = parseInt(horizonSlider.value, 10)  || 1;
    var taxRate      = parseFloat(capGainsSlider.value)   / 100;
    var repayYear    = earlyRepaySlider ? parseInt(earlyRepaySlider.value, 10) : horizon;
    if(repayYear > horizon) repayYear = horizon;
    if(repayYear < 0) repayYear = 0;

    // ─── Update slider-val displays (formatted current values) ───
    homePriceVal.textContent = fmtUsd(homePrice);
    downPctVal.textContent   = downPctSlider.value + '%';
    priceVal.textContent     = fmtUsd(price);
    costBasisVal.textContent = fmtUsd(costBasis);
    mortRateVal.textContent  = parseFloat(mortRateSlider.value).toFixed(2) + '%';
    premiumVal.textContent   = '+' + parseFloat(premiumSlider.value).toFixed(2) + 'pp';
    horizonVal.textContent   = horizon + ' years';
    capGainsVal.textContent  = capGainsSlider.value + '%';
    if(earlyRepayVal){
      earlyRepayVal.textContent = (repayYear >= horizon) ? 'never' : 'year ' + repayYear;
    }

    // Persist current-price for cross-page state with BAY
    try { localStorage.setItem('bas_price', price); } catch(e){}

    var downPayment = homePrice * downPct;

    if(price <= 0 || homePrice <= 0 || downPayment <= 0){
      if(collateralValue) collateralValue.textContent = '—';
      if(collateralSub) collateralSub.textContent = 'Set the home price and down-payment percentage to see the required pledged collateral.';
      pledgeHeadline.textContent = '—';
      sellHeadline.textContent   = '—';
      pledgeRows.innerHTML       = '';
      sellRows.innerHTML         = '';
      verdict.className = 'bbm-calc-verdict';
      verdict.innerHTML = '<p>Adjust the inputs above to model the comparison.</p>';
      return;
    }

    // ─── Required pledged collateral (derived output) ───
    // The product requires 2.5× over-collateralization on the down-payment
    // credit. Shown as a prominent derived value above the result cards so
    // the user can gauge whether the product is reachable for their own
    // stack without scrolling past a hidden 'not feasible' message.
    var requiredCollateralUsd = downPayment * 2.5;
    var requiredCollateralBtc = requiredCollateralUsd / price;
    if(collateralValue){
      collateralValue.innerHTML = '<strong>' + fmtBtc(requiredCollateralBtc) + '</strong> &middot; ' + fmtUsd(requiredCollateralUsd);
    }
    if(collateralSub){
      collateralSub.innerHTML = '2.5&times; the ' + fmtUsd(downPayment) + ' down-payment, valued at the ' + fmtUsd(price) + '/BTC assumption below. Compare against your own bitcoin holdings to gauge reachability.';
    }

    // ─── Sell-path mechanics (BTC sold to net the down-payment after tax) ───
    var gainPerBtc    = Math.max(0, price - costBasis);
    var taxPerBtc     = gainPerBtc * taxRate;
    var netPerBtc     = price - taxPerBtc;
    var btcSold       = netPerBtc > 0 ? (downPayment / netPerBtc) : 0;
    var sellTaxPaid   = btcSold * taxPerBtc;

    // ─── Future price (at horizon) per Power Law trend ───
    var futurePrice   = plPriceAtYear(horizon);

    // ─── Pledge-path extra interest cost over t years ───
    // Same model as v9. The differential between pledge and sell paths in
    // mortgage interest, decomposed into two structural components:
    //   pledge − sell
    //   = homePrice × (rate + premium) × t − (homePrice − downPayment) × rate × t
    //   = downPayment × rate × t + homePrice × premium × t
    // Simple-interest approximation; matches BvS calculator convention.
    // Stops accruing at repayYear (early-repayment of the lien).
    function pledgeCostAtYear(t){
      var capped = Math.min(t, repayYear);
      return downPayment * mortRate * capped + homePrice * premium * capped;
    }

    // ─── Sell-path opportunity cost over t years ───
    // The future value of the BTC consumed by the sell path. btcSold
    // INCLUDES the BTC needed to net the down-payment after cap-gains tax,
    // so btcSold × P(t) captures both the down-payment-equivalent value
    // and the tax-leakage value at future prices.
    function sellCostAtYear(t){
      return btcSold * plPriceAtYear(t);
    }

    // ─── Year-by-year cost trajectories (for chart + crossover detection) ───
    var years = [];
    var pledgeSeries = [];
    var sellSeries = [];
    var crossoverYear = null;
    var prevDelta = pledgeCostAtYear(0) - sellCostAtYear(0);
    for(var t = 0; t <= horizon; t++){
      var pCost = pledgeCostAtYear(t);
      var sCost = sellCostAtYear(t);
      years.push(t);
      pledgeSeries.push(pCost);
      sellSeries.push(sCost);
      var delta = pCost - sCost;
      if(t > 0 && Math.sign(delta) !== Math.sign(prevDelta) && Math.sign(prevDelta) !== 0){
        var prevP = pledgeSeries[t-1];
        var prevS = sellSeries[t-1];
        var prevDeltaR = prevP - prevS;
        var dDelta = delta - prevDeltaR;
        if(dDelta !== 0){
          crossoverYear = (t - 1) + Math.abs(prevDeltaR / dDelta);
        }
      }
      prevDelta = delta;
    }

    var pledgeTerminalCost = pledgeCostAtYear(horizon);
    var sellTerminalCost   = sellCostAtYear(horizon);

    // ─── Render Pledge card (cost-of-path framing) ───
    pledgeHeadline.textContent = fmtUsd(pledgeTerminalCost);
    var interestRows;
    if(repayYear >= horizon){
      interestRows =
        row('Premium portion (full mortgage, years 0&ndash;' + horizon + ')',          fmtUsd(homePrice * premium * horizon)) +
        row('Base-rate portion (down-payment loan, years 0&ndash;' + horizon + ')',    fmtUsd(downPayment * mortRate * horizon));
    } else {
      interestRows =
        row('Premium portion (full mortgage, years 0&ndash;' + repayYear + ')',        fmtUsd(homePrice * premium * repayYear)) +
        row('Base-rate portion (down-payment loan, years 0&ndash;' + repayYear + ')',  fmtUsd(downPayment * mortRate * repayYear));
    }
    pledgeRows.innerHTML =
      row('Down-payment funded',                                                fmtUsd(downPayment)) +
      row('BTC pledged (stays in custody)',                                     fmtBtc(requiredCollateralBtc)) +
      row('Cap-gains tax paid now',                                              '$0 (loan, not a disposition)') +
      interestRows +
      row('Cumulative cost @ year ' + horizon,                                  fmtUsd(pledgeTerminalCost), true);

    // ─── Render Sell card (forgone-value framing) ───
    sellHeadline.textContent = fmtUsd(sellTerminalCost);
    sellRows.innerHTML =
      row('Down-payment funded',                                                fmtUsd(downPayment)) +
      row('BTC sold to fund (incl. tax leakage)',                                fmtBtc(btcSold)) +
      row('Cap-gains tax paid now',                                              fmtUsd(sellTaxPaid)) +
      row('Cumulative interest premium',                                          '$0') +
      row('BTC trend price @ year ' + horizon,                                    fmtUsd(futurePrice) + '/BTC') +
      row('Forgone BTC value @ year ' + horizon,                                  fmtUsd(sellTerminalCost), true);

    // ─── Verdict (which path is cheaper at horizon) ───
    var verdictCls;
    var pledgeWins = pledgeTerminalCost < sellTerminalCost;
    var winnerLabel = pledgeWins ? 'Pledge' : 'Sell';
    var loserLabel  = pledgeWins ? 'Sell' : 'Pledge';
    var winnerCls   = pledgeWins ? 'verdict-pledge' : 'verdict-sell';
    var costDelta   = Math.abs(pledgeTerminalCost - sellTerminalCost);
    verdictCls = pledgeWins ? 'bbm-calc-verdict bbm-calc-verdict-pledge-wins' : 'bbm-calc-verdict bbm-calc-verdict-sell-wins';
    var crossoverStr;
    if(crossoverYear !== null && crossoverYear > 0 && crossoverYear <= horizon){
      crossoverStr = ' Crossover lands at <strong>year ' + crossoverYear.toFixed(1) + '</strong>, beyond which the ' + (pledgeWins ? 'pledge path' : 'sell path') + ' becomes the cheaper finish.';
    } else if(pledgeWins){
      crossoverStr = ' The pledge path is cheaper at every point in your horizon \u2014 cumulative interest never outpaces the value of the BTC the sell path would have given up.';
    } else {
      crossoverStr = ' The sell path is cheaper at every point in your horizon \u2014 the value of forgone BTC stays below the cumulative interest cost of the pledge.';
    }
    verdict.className = verdictCls;
    verdict.innerHTML =
      '<p>At year <strong>' + horizon + '</strong>, the <strong class="' + winnerCls + '">' + winnerLabel + '</strong> path is cheaper by ' +
      '<strong class="' + winnerCls + '">' + fmtUsd(costDelta) + '</strong> than the ' + loserLabel + ' path. ' +
      'BTC trend price at year ' + horizon + ': <strong>' + fmtUsd(futurePrice) + '/BTC</strong>.' + crossoverStr + '</p>';

    // ─── Render the chart (two cost lines + crossover marker) ───
    renderChart(years, pledgeSeries, sellSeries, crossoverYear);
  }

  function row(label, value, terminal){
    return '<div class="row' + (terminal ? ' row-terminal' : '') + '">' +
      '<span class="row-label">' + label + '</span>' +
      '<span class="row-val">' + value + '</span></div>';
  }

  function renderChart(years, pledgeSeries, sellSeries, crossoverYear){
    if(!chartCanvas || typeof Chart === 'undefined') return;

    // Commit 2 simplification: chart now shows two cost lines instead of
    // wealth trajectories. Pledge cost is cumulative extra interest
    // (linear, plateaus at repayYear); Sell cost is forgone BTC value
    // priced at the Power Law trend (exponential). The Hold baseline
    // (previously a dashed reference) no longer applies — there's no
    // "no purchase" alternative being modelled in cost terms.
    var datasets = [
      {
        label: 'Pledge: cumulative extra interest cost',
        data: pledgeSeries,
        borderColor: '#e09422',
        backgroundColor: 'rgba(224,148,34,0.10)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: false,
      },
      {
        label: 'Sell: forgone BTC value (PL trend)',
        data: sellSeries,
        borderColor: '#8aa3b5',
        backgroundColor: 'rgba(122,149,168,0.10)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: false,
      }
    ];

    // Custom plugin: draw vertical dashed crossover line + label.
    // (Chart.js 4 doesn't ship annotations by default; this avoids the
    // extra plugin dependency.)
    var crossoverPlugin = {
      id: 'bbmCrossover',
      afterDraw: function(c){
        if(crossoverYear === null || crossoverYear <= 0 || crossoverYear > years[years.length-1]) return;
        var xScale = c.scales.x;
        var yScale = c.scales.y;
        if(!xScale || !yScale) return;
        var xPx = xScale.getPixelForValue(crossoverYear);
        var ctx = c.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xPx, yScale.top);
        ctx.lineTo(xPx, yScale.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label
        var label = 'crossover ~ year ' + crossoverYear.toFixed(1);
        ctx.font = '600 10px Inter, sans-serif';
        var w = ctx.measureText(label).width;
        var labelX = Math.min(xPx + 6, c.chartArea.right - w - 8);
        var labelY = yScale.top + 4;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(labelX - 4, labelY, w + 8, 16);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textBaseline = 'top';
        ctx.fillText(label, labelX, labelY + 3);
        ctx.restore();
      }
    };

    var opts = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Years from purchase', color: 'rgba(255,255,255,0.5)', font: { family: 'Inter, sans-serif', size: 11 } },
          ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Inter, sans-serif', size: 10 }, stepSize: 5 },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          title: { display: true, text: 'Cumulative cost (USD)', color: 'rgba(255,255,255,0.5)', font: { family: 'Inter, sans-serif', size: 11 } },
          ticks: {
            color: 'rgba(255,255,255,0.5)',
            font: { family: 'Inter, sans-serif', size: 10 },
            callback: function(v){
              if(Math.abs(v) >= 1e9) return '$' + (v/1e9).toFixed(1) + 'B';
              if(Math.abs(v) >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M';
              if(Math.abs(v) >= 1e3) return '$' + Math.round(v/1e3) + 'k';
              return '$' + v;
            }
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: 'rgba(255,255,255,0.75)',
            font: { family: 'Inter, sans-serif', size: 12 },
            usePointStyle: true,
            boxWidth: 8,
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          borderColor: 'rgba(224,148,34,0.4)',
          borderWidth: 1,
          titleFont: { family: 'Inter, sans-serif', size: 12 },
          bodyFont: { family: 'Inter, sans-serif', size: 11 },
          callbacks: {
            title: function(items){ return 'Year ' + items[0].label; },
            label: function(ctx){
              var v = ctx.parsed.y;
              var s;
              if(Math.abs(v) >= 1e9) s = '$' + (v/1e9).toFixed(2) + 'B';
              else if(Math.abs(v) >= 1e6) s = '$' + (v/1e6).toFixed(2) + 'M';
              else s = '$' + Math.round(v).toLocaleString();
              return ctx.dataset.label + ': ' + s;
            }
          }
        }
      }
    };

    if(chart){
      chart.data.labels = years;
      chart.data.datasets = datasets;
      chart.options = opts;
      // Replace the per-chart plugin (need to reflect updated crossoverYear closure)
      chart.config.plugins = [crossoverPlugin];
      chart.update();
    } else {
      chart = new Chart(chartCanvas, {
        type: 'line',
        data: { labels: years, datasets: datasets },
        options: opts,
        plugins: [crossoverPlugin]
      });
    }
  }

  // ─── Wire all inputs to recompute ───
  var inputs = [homePriceInput, downPctSlider, priceInput, costBasisInput,
                mortRateSlider, premiumSlider, horizonSlider, capGainsSlider,
                earlyRepaySlider];
  ['input','change'].forEach(function(evt){
    inputs.forEach(function(el){ if(el) el.addEventListener(evt, compute); });
  });

  // ─── Tactical/strategic horizon presets ───
  // Each .bbm-horizon-preset button carries a data-horizon attribute.
  // Clicking sets the horizon slider to that value and triggers compute.
  // The slider remains the canonical control; the buttons are a
  // one-click shortcut between three named framings:
  //   tactical (5y)   — near-term cash-flow comparison
  //   standard (15y)  — typical mid-horizon
  //   strategic (30y) — full mortgage duration / strategic framing
  // When the user uses the slider, the active-state styling is
  // recomputed from the current horizon value.
  function syncPresetActive(){
    if(!presetButtons || !presetButtons.length) return;
    var current = parseInt(horizonSlider.value, 10);
    presetButtons.forEach(function(btn){
      var v = parseInt(btn.getAttribute('data-horizon'), 10);
      if(v === current) btn.classList.add('is-active');
      else btn.classList.remove('is-active');
    });
  }
  if(presetButtons && presetButtons.length){
    presetButtons.forEach(function(btn){
      btn.addEventListener('click', function(){
        var v = parseInt(btn.getAttribute('data-horizon'), 10);
        if(isNaN(v)) return;
        horizonSlider.value = v;
        // Also clamp early-repayment to the new horizon so the
        // 'never' label stays consistent at the slider max
        if(earlyRepaySlider){
          earlyRepaySlider.max = v;
          if(parseInt(earlyRepaySlider.value, 10) > v) earlyRepaySlider.value = v;
        }
        syncPresetActive();
        compute();
      });
    });
    // Resync on direct slider use, too
    horizonSlider.addEventListener('input', syncPresetActive);
  }

  // ─── Initial compute ───
  syncPresetActive();
  compute();
})();
