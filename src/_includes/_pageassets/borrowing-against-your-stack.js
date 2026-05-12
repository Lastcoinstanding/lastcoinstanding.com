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

  var profileChecksOut = document.getElementById('basProfileChecks');
  var profileNotesOut  = document.getElementById('basProfileNotes');
  var providerCardsOut = document.getElementById('basProviderCards');

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
      profileChecksOut.innerHTML = '<li class="bas-calc-profile-check bas-calc-profile-check-empty">Enter a stack size, current price, and loan amount above to see the loan profile.</li>';
      profileNotesOut.innerHTML = '';
      // Provider cards still render (they only need loan amount) but show em-dashes
      renderProviderCards(0);
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

    // ─── Loan profile (check list + conditional strategic notes) ───
    var profile = generateLoanProfile({
      stack: stack, price: price, loan: loan, ltv: ltv,
      liqPrice: liqPrice, drawdownToLiq: drawdownToLiq,
      liqRatio: liqRatio, currentRatio: currentRatio,
      annualInterest: annualInterest, monthlyInterest: monthlyInterest, rate: rate,
      annualPctOfStack: annualPctOfStack,
      lz: lz, cz: cz, oz: oz
    });
    profileChecksOut.innerHTML = profile.checksHtml;
    profileNotesOut.innerHTML  = profile.notesHtml;

    // ─── Provider category comparison cards ───
    renderProviderCards(loan);

    renderChart(price, liqPrice);
  }

  // ─── Loan-profile generator ───
  // Returns {checksHtml, notesHtml}. Checks are scannable status items
  // (one assertion + one detail line each, with green/amber/red icon
  // matching the underlying assessment). Notes are conditional editorial
  // blocks that only surface at specific PL positions where they add
  // genuine signal beyond the checks above.
  //
  // The checks adapt to four signals:
  //   1. LTV zone (conservative / moderate / aggressive)
  //   2. Channel zone of liquidation price (below floor → above ceiling)
  //   3. Origination zone (where current price sits in the channel)
  //   4. Cost vs. bitcoin's trailing CAGR — the G > R structural check
  //   5. Rate-vs-rehypothecation-zone — flags low rates as warning
  function generateLoanProfile(s) {
    var checks = [];

    // Check 1: LTV assessment
    if (s.ltv < 0.40) {
      checks.push({
        status: 'good',
        title: 'LTV is conservative',
        detail: pct(s.ltv, 1) + ' &mdash; within the recommended 30&ndash;40% safe band.'
      });
    } else if (s.ltv < 0.60) {
      checks.push({
        status: 'warn',
        title: 'LTV is moderate',
        detail: pct(s.ltv, 1) + ' &mdash; above the conservative band; less drawdown buffer than recommended.'
      });
    } else {
      checks.push({
        status: 'bad',
        title: 'LTV is aggressive',
        detail: pct(s.ltv, 1) + ' &mdash; above 60%; small drawdowns put you at liquidation risk.'
      });
    }

    // Check 2: Channel position of liquidation price (the page's headline insight)
    if (s.liqRatio < PL_FLOOR) {
      checks.push({
        status: 'good',
        title: 'Liquidation price below channel floor',
        detail: 'Bitcoin would need to break the long-term structural support that has held across every cycle of the last fifteen years for your position to liquidate.'
      });
    } else if (s.liqRatio < 1.0) {
      checks.push({
        status: 'warn',
        title: 'Liquidation price between floor and trend',
        detail: 'Floor has held historically; some buffer, but a typical bear-market drawdown brings price close to your liquidation.'
      });
    } else if (s.liqRatio < PL_CEIL) {
      checks.push({
        status: 'bad',
        title: 'Liquidation price above the trend line',
        detail: 'Routine mean-reversion to trend would liquidate this position. Betting on continued strength rather than buying room to be wrong.'
      });
    } else {
      checks.push({
        status: 'bad',
        title: 'Liquidation price above the upper channel bound',
        detail: 'Bitcoin would need to remain at extended cycle-peak levels for this position to survive.'
      });
    }

    // Check 3: Origination position (only if user is at a favorable point)
    if (s.oz === 'deep-low') {
      checks.push({
        status: 'good',
        title: 'Originating below the Power Law floor',
        detail: 'A position the channel has reached only briefly across fifteen years. Mean reversion implies asymmetric upside on retained coins.'
      });
    } else if (s.oz === 'low') {
      checks.push({
        status: 'good',
        title: 'Originating in the lower half of the channel',
        detail: 'Mean reversion implies a high-expected-return window for retained coins.'
      });
    } else if (s.oz === 'high') {
      checks.push({
        status: 'warn',
        title: 'Originating in the upper half of the channel',
        detail: 'Less mean-reversion upside on retained coins; consider whether the loan can wait until a lower channel position.'
      });
    } else if (s.oz === 'extreme') {
      checks.push({
        status: 'bad',
        title: 'Originating near or above the channel ceiling',
        detail: 'High-percentile zone &mdash; both liquidation risk and downside on retained coins are elevated.'
      });
    } // 'mid' produces no check — it's neither notable nor problematic

    // Check 4: G > R structural check
    var bitcoinCagrEstimate = 0.39; // editorial: trailing 4-year CAGR per Question tab
    if (s.rate > 0) {
      var rateDecimal = s.rate / 100;
      if (rateDecimal < bitcoinCagrEstimate * 0.5) {
        checks.push({
          status: 'good',
          title: 'Loan is structurally accretive',
          detail: 'At ' + pct(s.annualPctOfStack, 2) + ' annual cost on stack value, well below bitcoin\'s ~39% trailing four-year CAGR.'
        });
      } else if (rateDecimal < bitcoinCagrEstimate) {
        checks.push({
          status: 'warn',
          title: 'Loan is conditionally accretive',
          detail: pct(s.annualPctOfStack, 2) + ' annual cost vs ~39% trailing CAGR &mdash; accretive in average years, dilutive in flat/down cycles.'
        });
      } else {
        checks.push({
          status: 'bad',
          title: 'Loan cost approaches asset growth rate',
          detail: 'At ' + pct(rateDecimal, 1) + ' APR, the carrying cost is close to bitcoin\'s historical compound growth &mdash; the perpetual-borrowing math doesn\'t work here.'
        });
      }
    }

    // Check 5: Rehypothecation rate warning — only when rate is suspiciously low
    if (s.rate <= 5 && s.ltv > 0.30) {
      checks.push({
        status: 'bad',
        title: 'Rate is in the rehypothecation zone',
        detail: 'Tier-1 non-rehypothecating CeFi is 8&ndash;12%, multisig 12&ndash;16%. Rates below 5% are typically subsidized by re-lending your collateral &mdash; the failure mode that took down Celsius, BlockFi, Genesis, and Voyager.'
      });
    }

    // Render checks
    var checksHtml = checks.map(function(c){
      var icon = c.status === 'good' ? '&#10003;'
               : c.status === 'warn' ? '!'
               : c.status === 'bad'  ? '&#10005;'
               : 'i';
      return '<li class="bas-calc-profile-check">' +
        '<span class="bas-calc-profile-icon bas-calc-profile-icon-' + c.status + '">' + icon + '</span>' +
        '<span class="bas-calc-profile-body"><strong>' + c.title + '</strong>' +
        '<span class="bas-calc-profile-detail">' + c.detail + '</span></span>' +
        '</li>';
    }).join('\n');

    // ─── Strategic-context notes (conditional, editorial-register) ───
    // These surface only for the specific PL positions where they add
    // editorial value beyond what the checks already say.
    var notes = [];

    // Note 1: Mean-reversion opportunity-cost asymmetry — surfaces at
    // low or deep-low PL origination positions.
    if (s.oz === 'deep-low' || s.oz === 'low') {
      notes.push(
        '<div class="bas-calc-profile-note">' +
        '<span class="bas-calc-profile-note-label">An asymmetry worth seeing</span>' +
        '<p>Borrowing here is the trade where both sides of the asymmetry point the same way. You\'re not just maximally buffered from forced liquidation &mdash; you\'re also retaining the coin during what the channel suggests is a <strong>high-expected-return window</strong>. The alternative, selling some bitcoin to fund the same need at this price, would crystallize fiat at a structural low <em>and</em> forgo whatever mean-reversion upside the channel implies for the coins you didn\'t keep.</p>' +
        '</div>'
      );
    }

    // Note 2: Borrow-low / repay-high (Disciplined Rebalancing mirror)
    // — surfaces only at the very low end (below floor).
    if (s.oz === 'deep-low') {
      notes.push(
        '<div class="bas-calc-profile-note">' +
        '<span class="bas-calc-profile-note-label">A strategic variant worth knowing about</span>' +
        '<p>The channel position you\'re originating at is structurally the mirror image of <a href="/disciplined-rebalancing.html">Disciplined Rebalancing</a>. Where Disciplined Rebalancing sells at a high-percentile zone and rebuys at a low-percentile zone, the mirror is to <strong>borrow at a low-percentile zone and repay from appreciated bitcoin at a high-percentile zone</strong>. The destination is the same &mdash; <em>took some off the table at the top</em> &mdash; but the BAS variant gets you liquidity at the bottom along the way, and the psychological framing is sharper: paying off a loan with appreciated bitcoin at the cycle peak feels like <em>releasing an obligation</em> rather than <em>selling</em>. A structured surface for modeling this is on the calculator\'s roadmap.</p>' +
        '</div>'
      );
    }

    return { checksHtml: checksHtml, notesHtml: notes.join('\n') };
  }

  // ─── Provider-category interest comparison ───
  // Three live cards (plus one dismissed-DeFi reference card) showing
  // what the same loan principal costs per month and per year across
  // the three approved categories. Updates live with the loan-amount
  // input. Editorial point: the "no-rehypothecation premium" is the
  // visible cost of buying out of Celsius-style risk.
  var PROVIDER_SCENARIOS = [
    {
      name: 'Collaborative-custody multisig',
      apr: 14.0,
      tone: 'good',
      examples: 'Unchained, Anchor Watch, Onramp',
      note: 'Verifiable on-chain custody. The structural gold standard.'
    },
    {
      name: 'Tier-1 non-rehypothecating CeFi',
      apr: 10.0,
      tone: 'good',
      examples: 'Ledn, APX, Strike, Salt, Arch, Aven, Figure',
      note: 'Contractual no-rehypothecation at qualified custodians.'
    },
    {
      name: 'Rehypothecating CeFi',
      apr: 3.0,
      tone: 'bad',
      examples: 'Nexo, Binance Loans, Matrixport',
      note: 'Cheap rate, structural failure mode.',
      dismissed: 'Not recommended &mdash; see Question tab.'
    }
  ];

  function renderProviderCards(loan) {
    if (!providerCardsOut) return;
    var html = PROVIDER_SCENARIOS.map(function(p){
      var monthly = loan > 0 ? fmtUsd(loan * (p.apr / 100) / 12) : '$&mdash;';
      var annual  = loan > 0 ? fmtUsd(loan * (p.apr / 100))      : '$&mdash;';
      var toneCls = p.tone === 'good' ? 'bas-provider-card-good'
                  : p.tone === 'bad'  ? 'bas-provider-card-bad'
                  : 'bas-provider-card-neutral';
      var dismissedHtml = p.dismissed
        ? '<div class="bas-provider-card-dismissed">' + p.dismissed + '</div>'
        : '';
      return '<div class="bas-provider-card ' + toneCls + '">' +
        '<div class="bas-provider-card-name">' + p.name + '</div>' +
        '<div class="bas-provider-card-apr">' + p.apr.toFixed(1) + '% APR &middot; interest-only</div>' +
        '<div class="bas-provider-card-cost">' +
          '<span class="bas-provider-card-cost-label">Monthly</span>' +
          '<span class="bas-provider-card-cost-val">' + monthly + '</span>' +
        '</div>' +
        '<div class="bas-provider-card-cost">' +
          '<span class="bas-provider-card-cost-label">Annual</span>' +
          '<span class="bas-provider-card-cost-val">' + annual + '</span>' +
        '</div>' +
        '<div class="bas-provider-card-examples">' + p.examples + '</div>' +
        '<div class="bas-provider-card-note">' + p.note + '</div>' +
        dismissedHtml +
      '</div>';
    }).join('\n');
    providerCardsOut.innerHTML = html;
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
