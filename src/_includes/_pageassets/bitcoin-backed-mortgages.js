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
  var stackInput       = document.getElementById('bbmBtcStack');
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
  var stackVal         = document.getElementById('bbmBtcStackVal');
  var priceVal         = document.getElementById('bbmBtcPriceVal');
  var costBasisVal     = document.getElementById('bbmCostBasisVal');
  var mortRateVal      = document.getElementById('bbmMortRateVal');
  var premiumVal       = document.getElementById('bbmPremiumVal');
  var horizonVal       = document.getElementById('bbmHorizonVal');
  var capGainsVal      = document.getElementById('bbmCapGainsVal');
  var earlyRepayVal    = document.getElementById('bbmEarlyRepayVal');

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

  // ─── Hydrate shared state from localStorage (set by the BAY page) ───
  var SHARED = [
    { key: 'bas_stack',  el: stackInput },
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

  // ─── The math ───
  function compute(){
    var homePrice    = parseFloat(homePriceInput.value)   || 0;
    var downPct      = parseFloat(downPctSlider.value)    / 100;
    var stack        = parseFloat(stackInput.value)       || 0;
    var price        = parseFloat(priceInput.value)       || 0;
    var costBasis    = parseFloat(costBasisInput.value)   || 0;
    var mortRate     = parseFloat(mortRateSlider.value)   / 100;
    var premium      = parseFloat(premiumSlider.value)    / 100;
    var horizon      = parseInt(horizonSlider.value, 10)  || 1;
    var taxRate      = parseFloat(capGainsSlider.value)   / 100;
    // Early-repayment year: 0..horizon means 'pay off the second-lien at
    // year R'. Default value of horizon (slider max) means 'never repay
    // early' — interest accrues for the full horizon. Clamped to horizon.
    var repayYear    = earlyRepaySlider ? parseInt(earlyRepaySlider.value, 10) : horizon;
    if(repayYear > horizon) repayYear = horizon;
    if(repayYear < 0) repayYear = 0;

    // ─── Update slider-val displays (formatted current values) ───
    homePriceVal.textContent = fmtUsd(homePrice);
    downPctVal.textContent   = downPctSlider.value + '%';
    stackVal.textContent     = (stack === Math.floor(stack) ? stack.toFixed(0) : stack.toFixed(1)) + ' BTC';
    priceVal.textContent     = fmtUsd(price);
    costBasisVal.textContent = fmtUsd(costBasis);
    mortRateVal.textContent  = parseFloat(mortRateSlider.value).toFixed(2) + '%';
    premiumVal.textContent   = '+' + parseFloat(premiumSlider.value).toFixed(2) + 'pp';
    horizonVal.textContent   = horizon + ' years';
    capGainsVal.textContent  = capGainsSlider.value + '%';
    if(earlyRepayVal){
      earlyRepayVal.textContent = (repayYear >= horizon)
        ? 'never'
        : 'year ' + repayYear;
    }

    // Persist shared inputs to localStorage so BAY picks them up too
    try {
      localStorage.setItem('bas_stack', stack);
      localStorage.setItem('bas_price', price);
    } catch(e){}

    var downPayment = homePrice * downPct;

    if(stack <= 0 || price <= 0 || homePrice <= 0 || downPayment <= 0){
      pledgeHeadline.textContent = '— BTC';
      sellHeadline.textContent   = '— BTC';
      pledgeRows.innerHTML       = '';
      sellRows.innerHTML         = '';
      verdict.className = 'bbm-calc-verdict';
      verdict.innerHTML = '<p>Adjust the inputs above to model the comparison.</p>';
      return;
    }

    // ─── 250% collateralization requirement ───
    // The product requires $2.50 of pledged BTC per $1.00 of down-payment credit
    // (40% LTV on pledged assets). The full stack value must cover this.
    var requiredCollateral = downPayment * 2.5;
    var stackValueNow = stack * price;
    var pledgeFeasible = stackValueNow >= requiredCollateral;

    // ─── Sell-path mechanics ───
    var gainPerBtc    = Math.max(0, price - costBasis);
    var taxPerBtc     = gainPerBtc * taxRate;
    var netPerBtc     = price - taxPerBtc;
    var btcSold       = netPerBtc > 0 ? (downPayment / netPerBtc) : Infinity;
    var sellTaxPaid   = btcSold * taxPerBtc;
    var sellStack     = Math.max(0, stack - btcSold);
    var sellFeasible  = btcSold <= stack;

    // ─── Future price (at horizon) per Power Law trend ───
    var futurePrice    = plPriceAtYear(horizon);

    // ─── Pledge-path cost differential (corrected math, v9) ───
    // Coinbase's product blog confirms BOTH loans (primary + second-lien)
    // share the combined rate of (standard rate + premium); the premium
    // applies to the entire borrowed amount, not only to the second-lien.
    //
    // Under sell path: borrow (homePrice − downPayment) at standard rate.
    // Under pledge path: borrow homePrice at (rate + premium).
    //
    // Interest-cost differential over t years (simple-interest approximation):
    //   pledge − sell
    //   = homePrice × (rate + premium) × t − (homePrice − downPayment) × rate × t
    //   = downPayment × rate × t + homePrice × premium × t
    //
    // The earlier model (downPayment × premium × t only) undercounted by
    // a ~12× factor at typical inputs; v9 corrects this and breaks the
    // cost out into the two structural components for transparency in
    // the result-card detail rows.
    //
    // Early-repayment caps both terms at min(t, repayYear). The
    // released collateral funds primary refinance or the pledge cost
    // simply ends — the calc treats post-repayment years as zero-cost
    // for both terms.
    function pledgeCostAtYear(t){
      var capped = Math.min(t, repayYear);
      return downPayment * mortRate * capped + homePrice * premium * capped;
    }

    // ─── Pledge path: full stack retained; pay corrected interest delta ───
    var cumulativePremiumInterest = pledgeCostAtYear(horizon);
    var pledgeStack    = stack;
    var pledgeTerminalWealth = pledgeStack * futurePrice - cumulativePremiumInterest;

    // ─── Sell path: reduced stack, no premium interest, tax already paid ───
    var sellTerminalWealth = sellFeasible ? (sellStack * futurePrice) : 0;

    // ─── HOLD (0% borrowing baseline): no home purchase at all ───
    // The 'genuinely conservative baseline' — the user keeps their full
    // stack, buys no house, takes no loan. Plotted as a reference line
    // on the chart so both Pledge and Sell can be seen as decisions
    // relative to it. Always feasible (no eligibility math).
    var holdTerminalWealth = stack * futurePrice;

    // ─── Year-by-year wealth trajectory (for chart) ───
    var years = [];
    var pledgeSeries = [];
    var sellSeries = [];
    var holdSeries = [];
    var crossoverYear = null;
    var prevDelta = pledgeTerminalWealth - sellTerminalWealth; // sentinel
    for(var t = 0; t <= horizon; t++){
      var pAtT = plPriceAtYear(t);
      var pledgeAtT = pledgeStack * pAtT - pledgeCostAtYear(t);
      var sellAtT   = sellFeasible ? (sellStack * pAtT) : 0;
      var holdAtT   = stack * pAtT;
      years.push(t);
      pledgeSeries.push(pledgeAtT);
      sellSeries.push(sellAtT);
      holdSeries.push(holdAtT);
      // Crossover: when pledge wealth first exceeds sell wealth (or vice versa).
      // Pledge starts ahead (at t=0, full stack vs reduced stack at current price),
      // BUT cumulative interest cost can pull it below sell over time.
      // Look for sign change in (pledge − sell).
      var delta = pledgeAtT - sellAtT;
      if(t > 0 && Math.sign(delta) !== Math.sign(prevDelta) && Math.sign(prevDelta) !== 0){
        // Linear interpolate between t-1 and t
        var prevPledge = pledgeSeries[t-1];
        var prevSell   = sellSeries[t-1];
        var prevDeltaR = prevPledge - prevSell;
        var dDelta = delta - prevDeltaR;
        if(dDelta !== 0){
          crossoverYear = (t - 1) + Math.abs(prevDeltaR / dDelta);
        }
      }
      prevDelta = delta;
    }

    // ─── Render Pledge card ───
    if(pledgeFeasible){
      pledgeHeadline.textContent = fmtBtc(pledgeStack);
      var interestRows;
      if(repayYear >= horizon){
        interestRows =
          row('Premium portion (full mortgage)',                                fmtUsd(homePrice * premium * horizon)) +
          row('Base-rate portion (down-payment loan)',                          fmtUsd(downPayment * mortRate * horizon));
      } else {
        interestRows =
          row('Premium portion (full mortgage, years 0&ndash;' + repayYear + ')', fmtUsd(homePrice * premium * repayYear)) +
          row('Base-rate portion (down-payment loan, years 0&ndash;' + repayYear + ')', fmtUsd(downPayment * mortRate * repayYear));
      }
      pledgeRows.innerHTML =
        row('Down payment funded',                                              fmtUsd(downPayment)) +
        row('Required collateral (250%)',                                       fmtUsd(requiredCollateral) + ' &middot; ' + fmtBtc(requiredCollateral / price)) +
        row('BTC sold to fund',                                                  '0 (pledged instead)') +
        row('Cap gains tax paid now',                                            '$0') +
        interestRows +
        row('Total cost of pledge path @ year ' + horizon,                       fmtUsd(cumulativePremiumInterest)) +
        row('BTC value at year ' + horizon + ' (PL trend)',                      fmtUsd(pledgeStack * futurePrice)) +
        row('Net wealth at year ' + horizon,                                     fmtUsd(pledgeTerminalWealth), true);
    } else {
      pledgeHeadline.textContent = 'N/A';
      var shortfall = requiredCollateral - stackValueNow;
      pledgeRows.innerHTML =
        row('Required collateral (250%)',                                       fmtUsd(requiredCollateral)) +
        row('Your stack value now',                                              fmtUsd(stackValueNow)) +
        row('Shortfall',                                                         fmtUsd(shortfall));
    }

    // ─── Render Sell card ───
    if(sellFeasible){
      sellHeadline.textContent = fmtBtc(sellStack);
      sellRows.innerHTML =
        row('Down payment funded',                                            fmtUsd(downPayment)) +
        row('BTC sold to fund',                                                fmtBtc(btcSold)) +
        row('Cap gains tax paid now',                                          fmtUsd(sellTaxPaid)) +
        row('Cumulative interest premium @ year ' + horizon,                   '$0') +
        row('BTC value at year ' + horizon + ' (PL trend)',                    fmtUsd(sellStack * futurePrice)) +
        row('Net wealth at year ' + horizon,                                   fmtUsd(sellTerminalWealth), true);
    } else {
      sellHeadline.textContent = 'N/A';
      sellRows.innerHTML = row('Sell path not feasible — would need to sell ' + fmtBtc(btcSold) + ', but you only have ' + fmtBtc(stack), '');
    }

    // ─── Verdict ───
    var verdictCls = 'bbm-calc-verdict';
    var verdictHtml;
    if(!pledgeFeasible && !sellFeasible){
      verdictHtml = '<p><strong>Neither path is feasible with this configuration.</strong> The pledge path requires ' + fmtUsd(requiredCollateral) + ' in collateral (250% of the down payment) but your stack is worth only ' + fmtUsd(stackValueNow) + ' at the current price. The sell path requires ' + fmtBtc(btcSold) + ' to net the down payment after tax but you have only ' + fmtBtc(stack) + '. Consider a smaller home, a larger down-payment percentage that brings the figure within reach, or growing the stack first.</p>';
    } else if(!pledgeFeasible){
      verdictHtml = '<p><strong>The pledge path isn\u2019t feasible.</strong> The product requires <strong>' + fmtUsd(requiredCollateral) + '</strong> in pledged bitcoin (250% of the down payment) but your stack is worth <strong>' + fmtUsd(stackValueNow) + '</strong> at the current price &mdash; a shortfall of ' + fmtUsd(requiredCollateral - stackValueNow) + '. The sell path remains available, or you could revisit when bitcoin&rsquo;s price brings the collateral within reach.</p>';
    } else if(!sellFeasible){
      verdictHtml = '<p><strong>The sell path isn\u2019t feasible.</strong> At your current price and cost basis, netting the ' + fmtUsd(downPayment) + ' down payment after tax would require selling ' + fmtBtc(btcSold) + ' &mdash; more than your stack. The pledge path remains the only option (or buy a less expensive home).</p>';
    } else {
      var pledgeWins = pledgeTerminalWealth > sellTerminalWealth;
      var winnerLabel = pledgeWins ? 'Pledge' : 'Sell';
      var winnerCls   = pledgeWins ? 'verdict-pledge' : 'verdict-sell';
      var loserLabel  = pledgeWins ? 'Sell' : 'Pledge';
      var loserCls    = pledgeWins ? 'verdict-sell' : 'verdict-pledge';
      var delta       = Math.abs(pledgeTerminalWealth - sellTerminalWealth);
      verdictCls = pledgeWins ? 'bbm-calc-verdict bbm-calc-verdict-pledge-wins' : 'bbm-calc-verdict bbm-calc-verdict-sell-wins';
      var crossoverStr;
      if(crossoverYear !== null && crossoverYear > 0 && crossoverYear <= horizon){
        crossoverStr = ' Crossover lands at <strong>year ' + crossoverYear.toFixed(1) + '</strong>, beyond which the ' + (pledgeWins ? 'pledge path' : 'sell path') + ' is the wealthier finish.';
      } else if(pledgeWins){
        crossoverStr = ' The pledge path is wealthier at every point in your horizon \u2014 cumulative interest cost never outpaces the appreciation captured by retaining the BTC.';
      } else {
        crossoverStr = ' The sell path is wealthier at every point in your horizon \u2014 the cumulative interest cost dominates the value of BTC retained.';
      }
      // Reference the HOLD baseline so users see the cost of buying-at-all
      var holdDelta = holdTerminalWealth - Math.max(pledgeTerminalWealth, sellTerminalWealth);
      var holdStr = ' For reference, simply <strong>holding the stack and not buying the home at all</strong> finishes at <strong>' + fmtUsd(holdTerminalWealth) + '</strong> &mdash; ' + fmtUsd(holdDelta) + ' more than the better of the two purchase paths. That gap is the all-in cost of acquiring the home, against which the Pledge vs Sell comparison is the second-order decision.';
      verdictHtml =
        '<p>At year <strong>' + horizon + '</strong>, the <strong class="' + winnerCls + '">' + winnerLabel + '</strong> path retains ' +
        '<strong class="' + winnerCls + '">' + fmtUsd(delta) + ' more wealth</strong> than the ' + loserLabel + ' path. ' +
        'BTC trend price at year ' + horizon + ': <strong>' + fmtUsd(futurePrice) + '/BTC</strong>.' + crossoverStr + holdStr + '</p>';
    }
    verdict.className = verdictCls;
    verdict.innerHTML = verdictHtml;

    // ─── Render the chart ───
    renderChart(years, pledgeSeries, sellSeries, holdSeries, crossoverYear, sellFeasible, pledgeFeasible);
  }

  function row(label, value, terminal){
    return '<div class="row' + (terminal ? ' row-terminal' : '') + '">' +
      '<span class="row-label">' + label + '</span>' +
      '<span class="row-val">' + value + '</span></div>';
  }

  function renderChart(years, pledgeSeries, sellSeries, holdSeries, crossoverYear, sellFeasible, pledgeFeasible){
    if(!chartCanvas || typeof Chart === 'undefined') return;

    var datasets = [];

    // PLEDGE and SELL paths are drawn first so HOLD (added last, drawn on top)
    // shows its dashes through any overlap regions. Without this, scenarios
    // where Pledge tracks Hold closely (small premium / large stack / no
    // early repay) produce a chart where the Hold line is invisible because
    // the solid Pledge stroke fully covers it.
    if(pledgeFeasible){
      datasets.push({
        label: 'Pledge path',
        data: pledgeSeries,
        borderColor: '#e09422',
        backgroundColor: 'rgba(224,148,34,0.10)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: false,
      });
    }
    if(sellFeasible){
      datasets.push({
        label: 'Sell path',
        data: sellSeries,
        borderColor: '#8aa3b5',
        backgroundColor: 'rgba(122,149,168,0.10)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: false,
      });
    }
    // HOLD baseline drawn LAST so its dashes are visible through the Pledge/
    // Sell strokes in overlap regions. Always shown — it's the 0% borrowing
    // reference. Muted tan, dashed weight 1.75px with longer dash segments
    // for visibility. Reads as 'reference overlay' rather than 'primary path'.
    if(holdSeries && holdSeries.length){
      datasets.push({
        label: 'Hold (no purchase)',
        data: holdSeries,
        borderColor: '#bfae97',
        backgroundColor: 'rgba(191,174,151,0.06)',
        borderWidth: 1.75,
        borderDash: [7, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.1,
        fill: false,
      });
    }

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
          title: { display: true, text: 'Net wealth (USD)', color: 'rgba(255,255,255,0.5)', font: { family: 'Inter, sans-serif', size: 11 } },
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
  var inputs = [homePriceInput, downPctSlider, stackInput, priceInput, costBasisInput,
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
