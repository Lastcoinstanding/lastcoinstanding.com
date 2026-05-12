// ═══════════════════════════════════════════════════════════════════
// BORROWING AGAINST YOUR STACK — page logic
//
// Three-tab page: Question / Calculator / Math. This file handles
// tab routing + the Calculator's interactive math and Power Law
// channel chart.
//
// Current scope:
//   • LTV / liquidation-price / channel-position math (risk surface)
//   • Interest rate input + monthly/annual repayment burden (cost surface)
//   • Interpretation paragraph that incorporates mean-reversion opportunity
//     cost at low PL positions and the borrow-low/repay-high (Disciplined-
//     Rebalancing-mirror) framing
//   • Power Law channel chart with current-price marker and liquidation-
//     price horizontal line projected forward
//
// Subsequent commits will add: borrow-vs-sell comparison, structured
// early-repayment surface, historical-drawdown backtest, counterparty
// default scenario, DeFi infrastructure scenario, 0% baseline anchor.
//
// PL_DATA + PL_A/B/FLOOR/CEIL + GENESIS_TS + plPrice() come from
// shared/power-law-data.js (loaded before this file via njk page_scripts).
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


// ═══════ CALCULATOR ═══════
(function(){
  var stackInput = document.getElementById('basBtcStack');
  if (!stackInput) return;

  // ─── Risk-surface inputs ───
  var priceInput          = document.getElementById('basBtcPrice');
  var loanInput           = document.getElementById('basLoanAmount');
  var liqThresholdSlider  = document.getElementById('basLiqThreshold');
  var liqThresholdDisplay = document.getElementById('basLiqThresholdDisplay');

  // ─── Cost-surface inputs ───
  var rateSlider          = document.getElementById('basInterestRate');
  var rateDisplay         = document.getElementById('basInterestRateDisplay');
  var presetBtns          = document.querySelectorAll('.bas-calc-preset');

  // ─── Risk-surface outputs ───
  var ltvOut          = document.getElementById('basLtvOut');
  var ltvZoneLabel    = document.getElementById('basLtvZone');
  var liqPriceOut     = document.getElementById('basLiqPrice');
  var liqDrawdownOut  = document.getElementById('basLiqDrawdown');
  var channelPosOut   = document.getElementById('basChannelPos');
  var channelHintOut  = document.getElementById('basChannelHint');

  // ─── Cost-surface outputs ───
  var monthlyOut         = document.getElementById('basMonthlyInterest');
  var annualOut          = document.getElementById('basAnnualInterest');
  var annualSubOut       = document.getElementById('basAnnualInterestSub');
  var annualPctStackOut  = document.getElementById('basAnnualPctStack');

  var interpOut = document.getElementById('basInterp');

  // Auto-fill current BTC price from most recent PL_DATA sample
  if (typeof PL_DATA !== 'undefined' && PL_DATA.length) {
    var latest = PL_DATA[PL_DATA.length - 1];
    if (!priceInput.value || priceInput.value === '0') {
      priceInput.value = Math.round(latest[1] / 100) * 100;
    }
  }

  var chart = null;

  // ─── Formatters ───
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

  // ─── Zone classifiers ───
  // LTV zones match the Question tab's bands: <40% conservative,
  // 40-60% moderate, >60% aggressive.
  function ltvZone(ltv) {
    if (ltv < 0.40) return { label: 'Conservative', cls: 'bas-zone-good' };
    if (ltv < 0.60) return { label: 'Moderate',     cls: 'bas-zone-warn' };
    return                 { label: 'Aggressive',   cls: 'bas-zone-bad'  };
  }
  // Channel zones map liq-price-as-multiple-of-today's-trend to descriptive
  // labels matching the Question tab.
  function channelZone(liqRatio) {
    if (liqRatio < PL_FLOOR) {
      return { label: 'Below channel floor',  cls: 'bas-zone-good',
               hint:  'Bitcoin would need to break the long-term structural floor for liquidation.' };
    }
    if (liqRatio < 1.0) {
      return { label: 'Between floor and trend', cls: 'bas-zone-warn',
               hint:  'Floor has held historically; some buffer but less than the conservative case.' };
    }
    if (liqRatio < PL_CEIL) {
      return { label: 'In upper channel', cls: 'bas-zone-bad',
               hint:  'Routine mean-reversion to trend would liquidate this position.' };
    }
    return { label: 'Above channel ceiling', cls: 'bas-zone-bad',
             hint:  'Liquidation requires bitcoin to be above 3× trend — very exposed.' };
  }
  // Current-price-relative-to-trend classifier — used by the interpretation
  // paragraph to know whether to surface the mean-reversion / borrow-low-
  // repay-high framing.
  function originationZone(currentRatio) {
    if (currentRatio < PL_FLOOR)  return 'deep-low';   // below floor — exceptional
    if (currentRatio < 0.85)      return 'low';         // bottom half of channel
    if (currentRatio < 1.4)       return 'mid';         // near trend
    if (currentRatio < 2.2)       return 'high';        // upper channel
    return 'extreme';                                   // near or above ceiling
  }

  function recompute() {
    var stack         = parseFloat(stackInput.value)         || 0;
    var price         = parseFloat(priceInput.value)         || 0;
    var loan          = parseFloat(loanInput.value)          || 0;
    var liqThreshold  = parseFloat(liqThresholdSlider.value) / 100;
    var rate          = parseFloat(rateSlider.value)         || 0;

    liqThresholdDisplay.textContent = liqThresholdSlider.value;
    rateDisplay.textContent         = rate.toFixed(1);

    if (stack <= 0 || price <= 0 || loan <= 0) {
      ltvOut.textContent = '—';
      liqPriceOut.textContent = '$—';
      liqDrawdownOut.textContent = '—';
      channelPosOut.textContent = '—';
      channelHintOut.textContent = '—';
      monthlyOut.textContent = '$—';
      annualOut.textContent = '$—';
      annualSubOut.textContent = '—';
      annualPctStackOut.textContent = '—';
      interpOut.innerHTML = '<p>Enter a stack size, current price, and loan amount above to see your liquidation position on the Power Law channel.</p>';
      return;
    }

    // ─── Risk math ───
    var stackUsd      = stack * price;
    var ltv           = loan / stackUsd;
    var liqPrice      = loan / (stack * liqThreshold);
    var drawdownToLiq = (price - liqPrice) / price;
    var todayDays     = daysSinceGenesis();
    var trendToday    = plPrice(todayDays);
    var liqRatio      = liqPrice / trendToday;
    var currentRatio  = price    / trendToday;

    // ─── Cost math ───
    // Simple interest, USD-denominated. The current page intentionally
    // doesn't model compound interest or amortization — most bitcoin-
    // backed loans are interest-only with bullet repayment, and the
    // editorial point we want to surface is the monthly carry burden
    // and the annual-cost-vs-stack-value ratio (the G > R comparison).
    var annualInterest    = loan * (rate/100);
    var monthlyInterest   = annualInterest / 12;
    var annualPctOfStack  = annualInterest / stackUsd;

    var lz = ltvZone(ltv);
    var cz = channelZone(liqRatio);
    var oz = originationZone(currentRatio);

    // ─── Output cards ───
    ltvOut.textContent       = pct(ltv, 1);
    ltvZoneLabel.textContent = lz.label;
    ltvZoneLabel.className   = 'bas-calc-output-zone ' + lz.cls;

    liqPriceOut.textContent    = fmtUsd(liqPrice);
    liqDrawdownOut.textContent = 'BTC must fall ' + pct(drawdownToLiq, 0) +
      ' from $' + Math.round(price).toLocaleString();

    channelPosOut.textContent  = cz.label;
    channelPosOut.className    = 'bas-calc-output-value bas-calc-output-zoned ' + cz.cls;
    channelHintOut.textContent = cz.hint;

    monthlyOut.textContent        = fmtUsd(monthlyInterest);
    annualOut.textContent         = fmtUsd(annualInterest);
    annualSubOut.textContent      = pct(rate/100, 1) + ' of your $' +
      Math.round(loan).toLocaleString() + ' loan principal';
    annualPctStackOut.textContent = pct(annualPctOfStack, 2);

    // ─── Interpretation paragraph ───
    interpOut.innerHTML = generateInterpretation({
      stack: stack, price: price, loan: loan, ltv: ltv,
      liqPrice: liqPrice, drawdownToLiq: drawdownToLiq,
      liqRatio: liqRatio, currentRatio: currentRatio,
      annualInterest: annualInterest, rate: rate,
      annualPctOfStack: annualPctOfStack,
      lz: lz, cz: cz, oz: oz
    });

    renderChart(price, liqPrice);
  }

  // ─── Interpretation generator ───
  // Builds a contextualized paragraph in the page's editorial voice.
  // The text adapts to four signals:
  //   1. LTV zone (conservative / moderate / aggressive)
  //   2. Channel zone of liquidation price (below floor → above ceiling)
  //   3. Origination zone (where is current price in the channel? affects
  //      the mean-reversion opportunity-cost framing)
  //   4. Annual interest cost as % of stack — the G > R comparison
  function generateInterpretation(s) {
    var blocks = [];

    // Block 1: the headline numbers, conversationally
    blocks.push(
      '<p>At <strong>' + pct(s.ltv, 1) + '</strong> LTV against ' +
      '<strong>' + s.stack.toFixed(2) + ' BTC</strong>, your <strong>' +
      fmtUsd(s.loan) + '</strong> loan liquidates if BTC falls to <strong>' +
      fmtUsd(s.liqPrice) + '</strong> — a <strong>' + pct(s.drawdownToLiq, 0) +
      '</strong> drawdown from today\'s price. Carrying cost: <strong>' +
      fmtUsd(s.annualInterest / 12) + '/month</strong> (' + s.rate.toFixed(1) +
      '% APR on the principal).</p>'
    );

    // Block 2: channel-position-of-liquidation framing
    var safetyBlock;
    if (s.liqRatio < PL_FLOOR) {
      safetyBlock = 'Your liquidation price sits <strong>below the channel floor</strong> — bitcoin would need to break the long-term structural support that has held across every cycle of the last fifteen years for your position to liquidate. This is the conservative zone the Question tab references.';
    } else if (s.liqRatio < 1.0) {
      safetyBlock = 'Your liquidation price sits <strong>between the floor and the trend</strong>. The floor has held across multiple historical drawdowns, but you have less buffer than the most conservative case. A typical bear-market drawdown would bring price close to but not through your liquidation.';
    } else if (s.liqRatio < PL_CEIL) {
      safetyBlock = 'Your liquidation price sits <strong>above the trend</strong>. Routine mean-reversion to trend would liquidate this position. The Question tab calls this "betting on continued strength" rather than "buying room to be wrong."';
    } else {
      safetyBlock = 'Your liquidation price sits <strong>above the upper channel bound</strong>. Bitcoin would have to remain at extended cycle-peak levels to keep this position alive — a position that requires euphoria to survive.';
    }
    blocks.push('<p>' + safetyBlock + '</p>');

    // Block 3: origination-zone mean-reversion framing
    // Only surfaces when the user is originating at a low PL position —
    // because that's where the opportunity-cost asymmetry is most acute.
    if (s.oz === 'deep-low' || s.oz === 'low') {
      blocks.push(
        '<p><em>One asymmetry worth seeing.</em> You\'re originating this loan ' +
        (s.oz === 'deep-low'
          ? 'with bitcoin <strong>below the Power Law floor</strong> — a position the channel has reached only briefly across fifteen years of history. '
          : 'in the <strong>lower half of the Power Law channel</strong>. ') +
        'That means you\'re not just maximally buffered from forced liquidation. You\'re also retaining the coin during what the channel suggests is a <strong>high-expected-return window</strong>. The alternative — selling some bitcoin to fund the same need at this price — would crystallize fiat at a structural low <em>and</em> forgo whatever mean-reversion upside the channel implies for the coins you didn\'t keep. Borrowing here is the trade where both sides of the asymmetry point the same way.</p>'
      );

      // Block 4: borrow-low / repay-high callout — only at the very low end
      if (s.oz === 'deep-low') {
        blocks.push(
          '<p><em>A strategic variant worth knowing about.</em> The channel position you\'re originating at is structurally similar to the trigger band on the <a href="/disciplined-rebalancing.html">Disciplined Rebalancing page</a> — except inverted in time. Where Disciplined Rebalancing sells at a high-percentile zone and rebuys at a low-percentile zone, the mirror strategy is to <strong>borrow at a low-percentile zone and repay from appreciated BTC at a high-percentile zone</strong>. The destination is the same — <em>"took some off the table at the top"</em> — but the BAS variant gets you liquidity at the bottom along the way, and the psychological framing is sharper: paying off the loan with appreciated bitcoin at the cycle peak feels like <em>releasing an obligation</em> rather than <em>selling</em>. Same financial outcome, different emotional register for the same underlying decision. A structured surface for modeling this is on the calculator\'s roadmap.</p>'
        );
      }
    }

    // Block 5: cost-side commentary — only when something noteworthy
    // Aggressive LTV with low rate ⇒ rehypothecation warning.
    if (s.rate <= 5 && s.ltv > 0.30) {
      blocks.push(
        '<p><em>A note on the rate.</em> The rate you\'ve selected is in the territory where lenders subsidize their headline number by re-lending your collateral. Tier-1 non-rehypothecating CeFi rates run 8–12%; collaborative-custody multisig rates run 12–16%. Anything substantially below that is paying for the subsidy by accepting rehypothecation risk &mdash; the structural failure mode that took down Celsius, BlockFi, Genesis, and Voyager. <em>Cheap rates are the price of tail risk, not its absence.</em></p>'
      );
    }

    // Block 6: G > R check — does bitcoin's CAGR clear the carrying cost?
    // Only surface when both rate and currentRatio data points are present.
    var bitcoinCagrEstimate = 0.39; // editorial: trailing 4-year CAGR per Question tab
    if (s.rate > 0) {
      if (s.rate/100 < bitcoinCagrEstimate * 0.5) {
        // Loan is structurally accretive even under conservative growth assumptions
        blocks.push(
          '<p><em>The G &gt; R structural check.</em> Your loan costs ' + pct(s.annualPctOfStack, 2) +
          ' of stack value per year. Bitcoin\'s trailing four-year CAGR has run around 39%. As long as the asset compounds faster than the carrying cost — even materially below the historical pace — the loan is <strong>structurally accretive</strong> rather than dilutive. The Question tab calls this the perpetual-borrowing math.</p>'
        );
      }
    }

    return blocks.join('\n');
  }

  // ═══════ CHART ═══════
  function renderChart(currentPrice, liqPrice) {
    if (typeof Chart === 'undefined') return;
    var canvas = document.getElementById('basChannelChart');
    if (!canvas) return;

    var todayDays  = daysSinceGenesis();
    var futureDays = todayDays + 365 * 5;
    var startDays  = 592;

    var floorPts = [], trendPts = [], upperPts = [];
    for (var d = startDays; d <= futureDays; d += 30) {
      var t = plPrice(d);
      floorPts.push({ x: d, y: t * PL_FLOOR });
      trendPts.push({ x: d, y: t });
      upperPts.push({ x: d, y: t * PL_CEIL });
    }
    var historyPts    = PL_DATA.map(function(p){ return { x: p[0], y: p[1] }; });
    var currentDot    = [{ x: todayDays, y: currentPrice }];
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

  // ─── Wire inputs ───
  ['input','change'].forEach(function(evt){
    [stackInput, priceInput, loanInput, liqThresholdSlider, rateSlider].forEach(function(el){
      el.addEventListener(evt, recompute);
    });
  });

  // ─── Preset buttons set the rate slider and recompute ───
  presetBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var r = parseFloat(btn.dataset.rate);
      if (isNaN(r)) return;
      rateSlider.value = r;
      // Visual feedback: mark the active preset
      presetBtns.forEach(function(b){ b.classList.remove('bas-calc-preset-active'); });
      btn.classList.add('bas-calc-preset-active');
      recompute();
    });
  });

  // Lazy chart render on calculator-tab activation
  var calcBtn = document.querySelector('.tab-btn[data-tab="calculator"]');
  if (calcBtn) {
    calcBtn.addEventListener('click', function(){ setTimeout(recompute, 30); });
  }

  // If calculator is the initial active tab (URL hash deep-link), compute now
  if (document.getElementById('tab-calculator') &&
      document.getElementById('tab-calculator').classList.contains('active')) {
    recompute();
  }
})();
