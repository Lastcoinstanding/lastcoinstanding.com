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
    btcScenario: 'trend',      // 'stay' | 'trend' | 'upper' — drives btcCagr via Power Law math
    btcCagr: 0.28,             // derived from btcScenario + horizon; recomputed in resolveScenarioCagr()
    incomePath: 'strc',
    taxBracket: 42,
    ltcgRate: 30,
    inflation: 6.5,
    preferredTaxTreatment: 'roc',
    // Stress overlay
    stressPreset: 'base',
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

  // ===== Power Law anchors (sourced from shared /_pageassets/shared/power-law-data.js) =====
  // The shared module exposes globals: PL_A, PL_B, TODAY_DAYS, TODAY_PRICE,
  // plPrice(days), PL_FLOOR, PL_CEIL. Single-source-of-truth across pages —
  // do not redefine constants here. Monthly refresh of TODAY_PRICE happens
  // automatically (CoinGecko spot, with latest PL_DATA sample as fallback).
  //
  // currentTrendPrice = plPrice(TODAY_DAYS)              — Power Law trend at today's days-since-genesis
  // currentMultiple   = TODAY_PRICE / currentTrendPrice  — where bitcoin sits relative to trend
  //
  // resolveScenarioCagr() projects a terminal price under each scenario and
  // solves for the CAGR that connects today's price to it over the horizon.
  // Scenario target multiples at end-of-horizon:
  //   stay  → currentMultiple   (no reversion — same multiple)
  //   trend → 1.0×              (full reversion to trend)
  //   upper → 2.5×              (drift to historical above-cycle peak)
  function currentTrendPrice(){ return window.plPrice(window.TODAY_DAYS); }
  function currentMultiple(){ return window.TODAY_PRICE / currentTrendPrice(); }
  var SCENARIO_TARGET_MULT = { stay: null /* uses current multiple */, trend: 1.0, upper: 2.5 };

  function resolveScenarioCagr(scenario, horizon){
    var endDays = window.TODAY_DAYS + horizon * 365;
    var endTrend = window.plPrice(endDays);
    var targetMult = (scenario === 'stay') ? currentMultiple() : SCENARIO_TARGET_MULT[scenario];
    if (targetMult == null || !isFinite(targetMult)) return 0;
    var terminalPrice = targetMult * endTrend;
    return Math.pow(terminalPrice / window.TODAY_PRICE, 1 / horizon) - 1;
  }

  function refreshScenarioCagrs(){
    var chips = document.querySelectorAll('.calc-cagr-chip');
    chips.forEach(function(chip){
      var scenario = chip.getAttribute('data-scenario');
      var cagr = resolveScenarioCagr(scenario, state.horizon);
      var rateEl = chip.querySelector('[data-chip-rate]');
      if (rateEl) rateEl.textContent = '~' + Math.round(cagr * 100) + '% CAGR';
      if (scenario === state.btcScenario) state.btcCagr = cagr;
    });
  }

  // BTC-today indicator (static — depends only on TODAY_PRICE and trend)
  function refreshEntryConditions(){
    var mult = currentMultiple();
    var multEl = document.getElementById('entryMultiple');
    if (multEl) multEl.textContent = mult.toFixed(2);
  }

  // Income-path verdict (dynamic — driven by actual computed result so it
  // reflects scenario + stress + horizon, not just today's static multiple).
  // Thresholds based on income/bitcoin wealth ratio at end of horizon:
  //   >= 1.0  → 'stronger'  (income path actually wins)
  //   >= 0.7  → 'fair'      (close — within 30%)
  //   <  0.7  → 'weaker'    (bitcoin path clearly ahead)
  function updateVerdict(result){
    var verdictEl = document.getElementById('entryVerdictValue');
    var verdictWrap = document.getElementById('entryVerdict');
    if (!verdictEl || !verdictWrap) return;
    var incomeW = result && result.finalRealIncomeWealth;
    var btcW = result && result.finalRealBtcWealth;
    if (!isFinite(incomeW) || !isFinite(btcW) || btcW <= 0){
      verdictEl.textContent = '—';
      return;
    }
    var ratio = incomeW / btcW;
    var verdict, cls;
    if (ratio >= 1.0)      { verdict = 'stronger'; cls = 'verdict-stronger'; }
    else if (ratio >= 0.7) { verdict = 'fair';     cls = 'verdict-fair'; }
    else                   { verdict = 'weaker';   cls = 'verdict-weaker'; }
    verdictEl.textContent = verdict;
    verdictWrap.classList.remove('verdict-weaker', 'verdict-fair', 'verdict-stronger');
    verdictWrap.classList.add(cls);
  }

  // ===== Sliders with formatted-value display (BvRP pattern) =====
  // Each slider has an associated <span class="calc-slider-val" id="val-X">
  // that displays the value formatted per its formatter (currency, integer, percent).
  function fmtCurrency(v){
    return '$' + Math.round(Number(v)).toLocaleString('en-US');
  }
  function fmtYears(v){
    var n = Math.round(Number(v));
    return n + ' year' + (n === 1 ? '' : 's');
  }
  function fmtPercent(v){
    return Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';
  }
  function fmtInt(v){
    return Math.round(Number(v)).toLocaleString('en-US');
  }

  function bindSlider(sliderId, valSpanId, stateKey, parser, formatter){
    parser = parser || Number;
    formatter = formatter || String;
    var slider = document.getElementById(sliderId);
    var valSpan = valSpanId ? document.getElementById(valSpanId) : null;
    var num = document.getElementById(sliderId.replace('Slider', ''));
    if (!slider) return;

    function update(){
      var v = parser(slider.value);
      state[stateKey] = v;
      if (valSpan) valSpan.textContent = formatter(slider.value);
      if (num && num !== slider) num.value = slider.value;
      recalc();
    }
    slider.addEventListener('input', update);
    if (num && num !== slider) {
      num.addEventListener('input', function(){
        var v = parser(num.value);
        if (isNaN(v)) return;
        slider.value = v;
        update();
      });
    }
    // Initial render of formatted value
    if (valSpan) valSpan.textContent = formatter(slider.value);
  }

  // Main inputs (BvRP slider pattern — formatted value display, no number-input)
  bindSlider('incomeNeedSlider', 'val-incomeNeed', 'incomeNeed', Number, fmtCurrency);
  bindSlider('positionSlider',   'val-position',   'position',   Number, fmtCurrency);
  bindSlider('horizonSlider',    'val-horizon',    'horizon',    Number, fmtYears);

  // Horizon change must also re-derive the scenario CAGRs (their implied rates
  // depend on horizon: longer horizons give reversion more time to play out,
  // shifting the "Revert to trend" and "Reach upper" rates).
  var horizonSliderEl = document.getElementById('horizonSlider');
  if (horizonSliderEl) horizonSliderEl.addEventListener('input', refreshScenarioCagrs);

  // Advanced inputs (legacy slider + number-input pattern for percent values)
  bindSlider('taxBracketSlider', null, 'taxBracket', Number,     null);
  bindSlider('ltcgRateSlider',   null, 'ltcgRate',   Number,     null);
  bindSlider('inflationSlider',  null, 'inflation',  parseFloat, null);

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

  // Bitcoin growth scenario chips — set scenario string, then derive CAGR
  // via the Power Law-multiple math (resolveScenarioCagr). The chip's CAGR
  // is dynamic, so we can't just store data-cagr — we store data-scenario.
  document.querySelectorAll('.calc-cagr-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      document.querySelectorAll('.calc-cagr-chip').forEach(function(b){ b.classList.remove('active'); });
      chip.classList.add('active');
      state.btcScenario = chip.getAttribute('data-scenario');
      state.btcCagr = resolveScenarioCagr(state.btcScenario, state.horizon);
      recalc();
    });
  });
  // Initial CAGR render
  refreshScenarioCagrs();

  wireButtonGroup('.path-btn', 'incomePath', 'data-path');
  wireButtonGroup('.tax-btn', 'preferredTaxTreatment', 'data-tax');

  // ===== Preset buttons =====
  var PRESETS = {
    mild:   { drawdown: 0.30, durationMonths: 12 },
    mreit:  { drawdown: 0.50, durationMonths: 24 },
    winter: { drawdown: 0.70, durationMonths: 48 },
    base:   { drawdown: 0.00, durationMonths: 0  }
  };
  var stressChips = document.querySelectorAll('.stress-chip');
  stressChips.forEach(function(btn){
    btn.addEventListener('click', function(){
      stressChips.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var presetKey = btn.getAttribute('data-preset');
      var preset = PRESETS[presetKey] || PRESETS.base;
      state.stressPreset = presetKey;
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
    var dividendsPerYear = [];     // net (after-tax) nominal dividend received each year
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
      dividendsPerYear.push(netDividend);

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
    var spotPrice = window.TODAY_PRICE;
    var btcUnits = state.position / spotPrice;
    var btcPriceTrajectory = [spotPrice];
    var btcPrice = spotPrice;
    var btcCostBasis = state.position;
    var nominalBtcPath = [state.position];
    var realBtcPath = [state.position];
    var btcSoldPerYear = [];   // nominal USD value of BTC sold to fund need + tax each year

    // Apply stress: drawdown happens in months 1..duration, recovery linear after that to trend
    var stressDuration = state.stressDurationMonths / 12;
    var stressMax = state.stressDrawdown;

    for (var y2 = 1; y2 <= years; y2++){
      // Trend price (this is the scenario CAGR projection, not the Power Law trend)
      var trendPrice = spotPrice * Math.pow(1 + btcCagr, y2);
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

      btcSoldPerYear.push(btcToSell * btcPrice);
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
      dividendsPerYear: dividendsPerYear,
      btcSoldPerYear: btcSoldPerYear,
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
            borderColor: '#6db3d4',
            backgroundColor: 'rgba(109, 179, 212, 0.08)',
            borderWidth: 2.5,
            borderDash: [6, 4],
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
            borderWidth: 2.5,
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

  function updateCashflowTable(result){
    var tbody = document.getElementById('cashflowTbody');
    if (!tbody) return;
    var rows = [];
    for (var y = 1; y <= state.horizon; y++){
      var incomeWealth = result.realIncomePath[y];
      var btcWealth    = result.realBtcPath[y];
      var dividend     = result.dividendsPerYear[y - 1] || 0;
      var btcSold      = result.btcSoldPerYear[y - 1] || 0;
      rows.push(
        '<tr>' +
          '<td>' + y + '</td>' +
          '<td class="td-income">' + fmtUSD(incomeWealth) + '</td>' +
          '<td class="td-income">' + fmtUSD(dividend) + '</td>' +
          '<td class="td-btc">' + fmtUSD(btcWealth) + '</td>' +
          '<td class="td-btc">' + fmtUSD(btcSold) + '</td>' +
        '</tr>'
      );
    }
    tbody.innerHTML = rows.join('');
  }

  function recalc(){
    var result = computePaths();
    updateOutputs(result);
    updateChart(result);
    updateCashflowTable(result);
    refreshEntryConditions();
    updateVerdict(result);
  }

  // Initial render — defer until DOM and Chart.js settle
  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(recalc, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(recalc, 60); });
  }

  // The shared power-law-data module seeds window.TODAY_PRICE to the latest
  // PL_DATA sample but does NOT auto-call fetchTodayPrice. We call it ourselves
  // to swap in the live CoinGecko spot, then re-render. If CoinGecko fails,
  // the shared fetch helper falls back to the seeded value automatically.
  if (typeof window.fetchTodayPrice === 'function'){
    window.fetchTodayPrice(function(price /*, source: 'live' | 'fallback' */){
      if (price && isFinite(price) && price > 0){
        window.TODAY_PRICE = price;
      }
      refreshScenarioCagrs();
      recalc();
    });
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
