/* =============================================================
   The Income Question / Bitcoin Fixed Income — page script
   Tab switching with URL hash deep-linking, calculator math,
   Chart.js wealth-trajectory rendering, stress-test presets.
   ============================================================= */
(function(){
  'use strict';

  // ===== Tab switching (canonical per §6.2 with URL hash deep-linking) =====
  var tabBtns = document.querySelectorAll('.tab-nav .tab-btn');
  var tabContents = document.querySelectorAll('.tab-content');

  function activateTab(tabId, options){
    options = options || {};
    var found = false;
    tabBtns.forEach(function(btn){
      var matches = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', matches);
      btn.setAttribute('aria-selected', matches ? 'true' : 'false');
      if (matches) found = true;
    });
    tabContents.forEach(function(content){
      content.classList.toggle('active', content.id === 'tab-' + tabId);
    });
    if (found && !options.skipHashUpdate){
      try {
        history.replaceState(null, '', '#' + tabId);
      } catch(e) { /* noop */ }
    }
    // If calculator tab activated, trigger a chart resize if chart is initialized
    if (tabId === 'calculator' && chartInstance){
      setTimeout(function(){ chartInstance.resize(); }, 50);
    }
  }

  tabBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      activateTab(btn.getAttribute('data-tab'));
    });
  });

  // Read hash on load
  var initialHash = (window.location.hash || '').replace('#', '');
  var validTabs = ['question', 'instruments', 'mechanism', 'calculator', 'risks'];
  if (initialHash && validTabs.indexOf(initialHash) >= 0){
    activateTab(initialHash, { skipHashUpdate: true });
  }

  // Listen for browser back/forward
  window.addEventListener('hashchange', function(){
    var h = (window.location.hash || '').replace('#', '');
    if (h && validTabs.indexOf(h) >= 0){
      activateTab(h, { skipHashUpdate: true });
    }
  });

  // ===== Calculator state =====
  var state = {
    incomeNeed: 60000,
    position: 1000000,
    horizon: 15,
    btcCagr: 0.28,
    incomePath: 'strc',
    taxBracket: 42,
    ltcgRate: 30,
    inflation: 6.5,
    preferredTaxTreatment: 'roc',
    // Stress overlay
    stressDrawdown: 0,         // 0..1 — peak fraction of decline
    stressDurationMonths: 0    // 0..n
  };

  // Path definitions (yield + tax treatment)
  var PATHS = {
    strc:     { label: 'STRC (11.5% ROC)',  yield: 0.115, treatment: 'roc' },
    sata:     { label: 'SATA (13% ROC)',    yield: 0.130, treatment: 'roc' },
    treasury: { label: '10yr Treasury',     yield: 0.043, treatment: 'ordinary-fed-only' },
    igcorp:   { label: 'IG Corporate Bond', yield: 0.055, treatment: 'ordinary' }
  };

  var CURRENT_BTC_PRICE = 63800;

  // ===== Input sync — slider <-> number =====
  function syncPair(sliderId, numId, stateKey, parser){
    parser = parser || Number;
    var slider = document.getElementById(sliderId);
    var num = document.getElementById(numId);
    if (!slider || !num) return;

    function pushFromSlider(){
      num.value = slider.value;
      state[stateKey] = parser(slider.value);
      recalc();
    }
    function pushFromNum(){
      var v = parser(num.value);
      if (isNaN(v)) return;
      slider.value = v;
      state[stateKey] = v;
      recalc();
    }
    slider.addEventListener('input', pushFromSlider);
    num.addEventListener('input', pushFromNum);
    num.addEventListener('change', pushFromNum);
  }

  syncPair('incomeNeedSlider', 'incomeNeed', 'incomeNeed');
  syncPair('positionSlider', 'position', 'position');
  syncPair('horizonSlider', 'horizon', 'horizon');
  syncPair('taxBracketSlider', 'taxBracket', 'taxBracket');
  syncPair('ltcgRateSlider', 'ltcgRate', 'ltcgRate');
  syncPair('inflationSlider', 'inflation', 'inflation', parseFloat);

  // ===== Button groups =====
  function wireButtonGroup(selector, stateKey, attrKey, parser){
    parser = parser || function(x){ return x; };
    var btns = document.querySelectorAll(selector);
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        btns.forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        state[stateKey] = parser(btn.getAttribute(attrKey));
        recalc();
      });
    });
  }
  wireButtonGroup('.growth-btn', 'btcCagr', 'data-cagr', parseFloat);
  wireButtonGroup('.path-btn', 'incomePath', 'data-path');
  wireButtonGroup('.tax-btn', 'preferredTaxTreatment', 'data-tax');

  // ===== Preset buttons =====
  var PRESETS = {
    mild:   { drawdown: 0.30, durationMonths: 12 },
    mreit:  { drawdown: 0.50, durationMonths: 24 },
    winter: { drawdown: 0.70, durationMonths: 48 },
    base:   { drawdown: 0.00, durationMonths: 0  }
  };
  var presetBtns = document.querySelectorAll('.preset-btn');
  presetBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var preset = PRESETS[btn.getAttribute('data-preset')] || PRESETS.base;
      state.stressDrawdown = preset.drawdown;
      state.stressDurationMonths = preset.durationMonths;
      recalc();
    });
  });

  // ===== Math =====
  function computePaths(){
    var years = state.horizon;
    var infl = state.inflation / 100;
    var btcCagr = state.btcCagr;
    var path = PATHS[state.incomePath] || PATHS.strc;
    var taxBracket = state.taxBracket / 100;
    var ltcgRate = state.ltcgRate / 100;

    // === Income (preferred / bond) path ===
    // Assumption: user invests `position` lump-sum at year 0.
    // Each year receives `position * yield` in dividends (in nominal USD).
    // Each year, withdraws `incomeNeed` (real terms, scaled by inflation) for living.
    // If dividend > need: reinvest at same yield. If dividend < need: draws from position.
    // ROC tax treatment: no current tax until basis depleted (yrs ≈ 1 / yield); after that LTCG.
    // Ordinary: dividends taxed annually at marginal bracket.
    // Treasury (federal-only state-exempt): use marginal bracket but no state portion — approx state savings.
    // At end of horizon: assume redemption at par = position remaining.
    //
    // Simplifications acknowledged for v1:
    // - Reinvested capital assumed to receive same yield (perpetual preferred holds par)
    // - Inflation drift in real-terms output handled by deflating nominal end-value to today's USD

    var basis = state.position;
    var basisRemaining = basis;
    var positionValue = state.position; // nominal $
    var nominalIncomePath = [state.position];
    var realIncomePath = [state.position];
    var afterTaxCashflow = 0;
    var totalNominalReceived = 0;
    var basisDepleteYear = 1 / path.yield; // years until ROC basis depletes at gross yield

    for (var y = 1; y <= years; y++){
      var grossDividend = positionValue * path.yield;
      var needThisYear = state.incomeNeed * Math.pow(1 + infl, y - 1);
      var tax = 0;

      if (path.treatment === 'roc' && state.preferredTaxTreatment === 'roc'){
        // ROC: no current tax until basis depleted. After depletion, LTCG on the excess.
        if (basisRemaining >= grossDividend){
          basisRemaining -= grossDividend;
          tax = 0;
        } else {
          var taxableAmount = grossDividend - basisRemaining;
          basisRemaining = 0;
          tax = taxableAmount * ltcgRate;
        }
      } else if (path.treatment === 'ordinary-fed-only'){
        // Treasury — federal only (approximate as ~75% of full bracket since state-exempt)
        tax = grossDividend * (taxBracket * 0.75);
      } else {
        // Ordinary or stressed
        tax = grossDividend * taxBracket;
      }

      var netDividend = grossDividend - tax;
      totalNominalReceived += netDividend;

      // User withdraws need; surplus reinvested into position
      var surplus = netDividend - needThisYear;
      if (surplus > 0){
        positionValue += surplus;
        basis += surplus; // new basis from new capital
        basisRemaining += surplus;
      } else if (surplus < 0){
        // Withdraw shortfall from position principal — taxed as LTCG on gain over basis
        var withdrawal = -surplus;
        var gainPortion = positionValue > basis ? Math.min(withdrawal, (positionValue - basis) * (withdrawal / positionValue)) : 0;
        var withdrawalTax = gainPortion * ltcgRate;
        positionValue -= (withdrawal + withdrawalTax);
        basis -= (withdrawal - gainPortion);
        basisRemaining = Math.max(0, basisRemaining - withdrawal);
      }

      nominalIncomePath.push(positionValue);
      realIncomePath.push(positionValue / Math.pow(1 + infl, y));
    }

    // === Bitcoin sell-as-needed path ===
    // Convert position to BTC at today's price. Apply CAGR with optional stress overlay.
    // Sell BTC each year to fund income need (nominal-inflated). Pay LTCG on gain.
    var btcUnits = state.position / CURRENT_BTC_PRICE;
    var btcPriceTrajectory = [CURRENT_BTC_PRICE];
    var btcPrice = CURRENT_BTC_PRICE;
    var btcCostBasis = state.position;
    var nominalBtcPath = [state.position];
    var realBtcPath = [state.position];

    // Apply stress: drawdown happens in months 1..duration, recovery linear after that to trend
    var stressDuration = state.stressDurationMonths / 12;
    var stressMax = state.stressDrawdown;

    for (var y2 = 1; y2 <= years; y2++){
      // Trend price
      var trendPrice = CURRENT_BTC_PRICE * Math.pow(1 + btcCagr, y2);
      // Apply stress overlay
      var stressFactor = 1;
      if (stressMax > 0 && y2 <= stressDuration * 2){
        if (y2 <= stressDuration){
          // Drawdown phase: linear to peak
          stressFactor = 1 - stressMax * (y2 / stressDuration);
        } else {
          // Recovery phase
          var recoveryProgress = (y2 - stressDuration) / stressDuration;
          stressFactor = 1 - stressMax * (1 - recoveryProgress);
        }
      }
      btcPrice = trendPrice * stressFactor;

      // Sell BTC to fund income need this year
      var needThisYearBtc = state.incomeNeed * Math.pow(1 + infl, y2 - 1);
      var btcToSell = needThisYearBtc / btcPrice;

      // Tax on gain portion of the sale
      var avgBasisPerBtc = btcUnits > 0 ? btcCostBasis / btcUnits : 0;
      var gainPerBtc = btcPrice - avgBasisPerBtc;
      var totalGain = Math.max(0, gainPerBtc * btcToSell);
      var btcSaleTax = totalGain * ltcgRate;
      // Sell enough additional BTC to cover the tax
      var extraSale = btcSaleTax / btcPrice;
      btcToSell += extraSale;

      btcUnits = Math.max(0, btcUnits - btcToSell);
      btcCostBasis = Math.max(0, btcCostBasis - (avgBasisPerBtc * btcToSell));

      var nominalWealth = btcUnits * btcPrice;
      nominalBtcPath.push(nominalWealth);
      realBtcPath.push(nominalWealth / Math.pow(1 + infl, y2));
      btcPriceTrajectory.push(btcPrice);
    }

    // Crossover detection
    var crossoverYear = null;
    for (var c = 1; c < realBtcPath.length; c++){
      if (realBtcPath[c] > realIncomePath[c]){
        crossoverYear = c;
        break;
      }
    }

    // After-tax IRR for income path (approximate)
    var finalRealIncomeWealth = realIncomePath[realIncomePath.length - 1];
    var initialPosition = state.position;
    var realIncomeIRR = years > 0 ? (Math.pow(finalRealIncomeWealth / initialPosition, 1 / years) - 1) * 100 : 0;
    // Add the real value of consumed cashflow back into the IRR sense — approximation
    // Effective real after-tax IRR: assume all dividends consumed at their real value
    // For display: a simpler proxy — yield - inflation - effective tax drag
    var effectiveTax = 0;
    if (path.treatment === 'roc' && state.preferredTaxTreatment === 'roc'){
      // Average tax over horizon — first ~basis-deplete years at 0, then ltcg
      var deferralYears = Math.min(years, basisDepleteYear);
      var taxedYears = Math.max(0, years - deferralYears);
      effectiveTax = (taxedYears / years) * ltcgRate;
    } else if (path.treatment === 'ordinary-fed-only'){
      effectiveTax = taxBracket * 0.75;
    } else {
      effectiveTax = taxBracket;
    }
    var displayIRR = path.yield * (1 - effectiveTax) * 100 - state.inflation;

    return {
      realIncomePath: realIncomePath,
      realBtcPath: realBtcPath,
      nominalIncomePath: nominalIncomePath,
      nominalBtcPath: nominalBtcPath,
      crossoverYear: crossoverYear,
      finalRealIncomeWealth: finalRealIncomeWealth,
      finalRealBtcWealth: realBtcPath[realBtcPath.length - 1],
      displayIRR: displayIRR,
      pathLabel: path.label
    };
  }

  // ===== Render outputs =====
  function fmtUSD(v){
    if (!isFinite(v) || isNaN(v)) return '—';
    if (Math.abs(v) >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (Math.abs(v) >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }

  function updateOutputs(result){
    var crossEl = document.getElementById('crossoverYear');
    var irrEl = document.getElementById('incomeIRR');
    var incWealthEl = document.getElementById('incomeWealth');
    var btcWealthEl = document.getElementById('btcWealth');
    var captionEl = document.getElementById('chartCaption');

    if (crossEl) crossEl.textContent = result.crossoverYear !== null ? result.crossoverYear : '> ' + state.horizon;
    if (irrEl) irrEl.textContent = result.displayIRR.toFixed(2);
    if (incWealthEl) incWealthEl.textContent = fmtUSD(result.finalRealIncomeWealth);
    if (btcWealthEl) btcWealthEl.textContent = fmtUSD(result.finalRealBtcWealth);

    if (captionEl){
      var msg = 'Wealth trajectory comparison in real terms (today\'s purchasing power). ';
      msg += 'Income path: ' + result.pathLabel + '. ';
      msg += 'Bitcoin path: hold and sell-as-needed at ' + (state.btcCagr * 100).toFixed(0) + '% trend CAGR';
      if (state.stressDrawdown > 0){
        msg += ' with ' + (state.stressDrawdown * 100).toFixed(0) + '% drawdown over ' + state.stressDurationMonths + ' months';
      }
      msg += '.';
      captionEl.textContent = msg;
    }
  }

  // ===== Chart.js wiring =====
  var chartInstance = null;

  function ensureChart(){
    if (chartInstance) return chartInstance;
    if (typeof Chart === 'undefined') return null;
    var canvas = document.getElementById('iqChart');
    if (!canvas) return null;
    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Income path (real USD)',
            data: [],
            borderColor: '#e09422',
            backgroundColor: 'rgba(224, 148, 34, 0.08)',
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: false
          },
          {
            label: 'Bitcoin sell-as-needed (real USD)',
            data: [],
            borderColor: '#F7931A',
            backgroundColor: 'rgba(247, 147, 26, 0.06)',
            borderWidth: 2,
            borderDash: [],
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: true,
            labels: {
              color: '#c8c2b8',
              font: { family: 'Inter', size: 12 },
              boxWidth: 16,
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 12, 8, 0.95)',
            titleColor: '#f2eee8',
            bodyColor: '#d6cfc3',
            borderColor: 'rgba(247, 147, 26, 0.4)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function(ctx){
                return ctx.dataset.label + ': ' + fmtUSD(ctx.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Year', color: '#9a9286', font: { family: 'Inter', size: 11 } },
            ticks: { color: '#9a9286', font: { family: 'Inter', size: 11 } },
            grid: { color: 'rgba(255, 255, 255, 0.04)' }
          },
          y: {
            title: { display: true, text: 'Wealth (today\'s USD)', color: '#9a9286', font: { family: 'Inter', size: 11 } },
            ticks: {
              color: '#9a9286',
              font: { family: 'Inter', size: 11 },
              callback: function(v){ return fmtUSD(v); }
            },
            grid: { color: 'rgba(255, 255, 255, 0.04)' }
          }
        }
      }
    });
    return chartInstance;
  }

  function updateChart(result){
    var chart = ensureChart();
    if (!chart) return;
    var labels = [];
    for (var i = 0; i <= state.horizon; i++){ labels.push(i); }
    chart.data.labels = labels;
    chart.data.datasets[0].data = result.realIncomePath;
    chart.data.datasets[1].data = result.realBtcPath;
    chart.update('none');
  }

  function recalc(){
    var result = computePaths();
    updateOutputs(result);
    updateChart(result);
  }

  // Initial render — defer until DOM and Chart.js settle
  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(recalc, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(recalc, 60); });
  }

  // If Chart.js loads after our script (defer pattern), retry once
  var chartRetryAttempts = 0;
  function tryEnsureChart(){
    if (typeof Chart !== 'undefined' || chartRetryAttempts > 20){
      recalc();
      return;
    }
    chartRetryAttempts++;
    setTimeout(tryEnsureChart, 100);
  }
  setTimeout(tryEnsureChart, 200);

})();
