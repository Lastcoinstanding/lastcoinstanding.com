/* =============================================================
   The Income Question / Bitcoin and Fixed Income — page script
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
    btcScenario: 'stay',       // 'stay' | 'trend' (the two scenarios) or 'floor' | 'upper' (paths to test); the default follows today's multiple (DEFAULTS_POLICY R2, recalc)
    btcCagr: 0.27,             // the scenario's implied annual growth over the horizon; recomputed in resolveScenarioCagr()
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
  // The preferreds' rates come from src/_data/preferredRates.json, injected
  // as window.PREFERRED_RATES (components/preferred-rates.njk), the one place
  // the site keeps them (MONTHLY_REFRESH_CHECKLIST §0.7). The literals are the
  // fallback if the injection is missing.
  var PR = window.PREFERRED_RATES || {};
  var STRC_PCT = (PR.strc && isFinite(PR.strc.ratePct)) ? PR.strc.ratePct : 12.0;
  var SATA_PCT = (PR.sata && isFinite(PR.sata.ratePct)) ? PR.sata.ratePct : 13.0;
  var PATHS = {
    strc:     { label: 'STRC (' + STRC_PCT + '% ROC)',  yield: STRC_PCT / 100, treatment: 'roc' },
    sata:     { label: 'SATA (' + SATA_PCT + '% ROC)',  yield: SATA_PCT / 100, treatment: 'roc' },
    treasury: { label: '10yr Treasury',     yield: 0.043, treatment: 'ordinary-fed-only' },
    igcorp:   { label: 'IG Corporate Bond', yield: 0.055, treatment: 'ordinary' }
  };

  // ===== Power Law anchors (sourced from shared /_pageassets/shared/power-law-data.js) =====
  // The shared module exposes globals: PL_A, PL_B, TODAY_DAYS, TODAY_PRICE,
  // plPrice(days), PL_FLOOR, PL_CEIL. Single-source-of-truth across pages —
  // do not redefine constants here. Monthly refresh of TODAY_PRICE happens
  // automatically (live spot, with latest PL_DATA sample as fallback).
  //
  // currentTrendPrice = plPrice(TODAY_DAYS)              — Power Law trend at today's days-since-genesis
  // currentMultiple   = TODAY_PRICE / currentTrendPrice  — where bitcoin sits relative to trend
  //
  // The scenario set is the real-estate pair's (REAL_ESTATE_PAIR_RULINGS M3,
  // adopted here 2026-10-10; the two scenarios since 2026-10-11,
  // DEFAULTS_POLICY), so the pages share one vocabulary and one path math
  // (PriceCases.multipleAt). The price is the multiple times the trend then:
  //   stay  → today's multiple for the whole horizon (the default below trend)
  //   trend → a straight line to 1.0× over 3 years, then the trend (the
  //           default at or above trend)
  //   floor → a straight line to PL_FLOOR (0.42×) by the horizon end; a path
  //           to test, drawn faintly always
  //   upper → a straight line to 2.5× by the horizon end; an upside path to
  //           test, not a forecast
  // Was (to 2026-10-10): stay / trend (the default, "central case") / upper,
  // each a constant-CAGR path to its end point, with Upper's tooltip calling
  // 2.5× "the historical above-cycle peak". The record says otherwise (cycle
  // peaks of 12×, 5.4×, 3.2× and, so far this cycle, 1.2×; upperRecordText()
  // below), and the default assumed the gap to trend closes (TECH_DEBT,
  // "Bitcoin scenario vocabulary", closed 2026-10-10).
  // Since 2026-10-11 (DEFAULTS_POLICY): the path math is the shared one
  // (PriceCases.multipleAt, which the real-estate engine reads too), so the
  // pages can't drift. Trend now closes the gap in a straight line over 3
  // years and then follows the trend; Floor and Upper still run to the
  // horizon end; the default is Stay below trend, Trend at or above it.
  function currentTrendPrice(){ return window.plPrice(window.TODAY_DAYS); }
  function currentMultiple(){ return window.TODAY_PRICE / currentTrendPrice(); }
  var UPPER_TARGET = window.PriceCases.UPPER;
  function scenarioTarget(scenario, m0){ return window.PriceCases.target(scenario, m0); }
  // Price t years from now: the multiple at t on the scenario's path, times
  // the trend at t. 365.25-day years, as on the real-estate pair (rulings M10).
  function scenarioPrice(scenario, t, horizon){
    var m0 = currentMultiple();
    var mult = window.PriceCases.multipleAt(scenario, m0, Math.min(t / Math.max(1, horizon), 1), t);
    return mult * window.plPrice(window.TODAY_DAYS + t * 365.25);
  }
  // The implied annual growth the block and caption show: today's price to
  // the horizon-end price as one constant rate. The path between is not
  // constant: the trend's own growth slows over time.
  function resolveScenarioCagr(scenario, horizon){
    if (!(horizon > 0) || !(window.TODAY_PRICE > 0)) return 0;
    return Math.pow(scenarioPrice(scenario, horizon, horizon) / window.TODAY_PRICE, 1 / horizon) - 1;
  }

  // Upper's record, computed from the price series so it can't go stale:
  // each past cycle's peak multiple of trend and this cycle's peak so far,
  // read from SpikeRecord (shared/spike-record.js), the record Bitcoin's
  // Spikes and Disciplined Rebalancing use. Worded as the real-estate pair
  // words it (RealEstateModel.upperRecordText), from 2013 on as there:
  // "past cycle peaks reached at least 12× trend (2013), 5.4× (2017) and
  // 3.2× (2021), each lower than the last and none sustained; the peak so far
  // in this cycle is 1.2× (December 2024)". "At least" because the series is
  // sampled about every 12 days, so the samples are lower bounds.
  function upperRecordText(){
    var SR = window.SpikeRecord;
    if (!SR || typeof SR.record !== 'function') return '';
    var R = SR.record().filter(function(r){ return r.y !== '2011' && isFinite(r.spikeM); });
    var past = R.filter(function(r){ return !r.open; });
    var cur = R.filter(function(r){ return r.open; })[0];
    if (past.length < 2) return '';
    function x(m){ return (m >= 10 ? m.toFixed(0) : m.toFixed(1)) + '×'; }
    var parts = past.map(function(r, i){ return x(r.spikeM) + (i === 0 ? ' trend' : '') + ' (' + r.y + ')'; });
    var list = parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
    var falling = past.every(function(r, i){ return i === 0 || r.spikeM < past[i - 1].spikeM; }) &&
                  (!cur || cur.spikeM < past[past.length - 1].spikeM);
    var when = '';
    if (cur && typeof window.GENESIS_TS === 'number') {
      when = ' (' + new Date((window.GENESIS_TS + cur.spikeD * 86400) * 1000)
        .toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) + ')';
    }
    return 'past cycle peaks reached at least ' + list +
           (falling ? ', each lower than the last and none sustained' : ', none sustained') +
           (cur ? '; the peak so far in this cycle is ' + x(cur.spikeM) + when : '');
  }

  // Bitcoin's price: the two scenarios (components/price-cases.njk;
  // DEFAULTS_POLICY_2026-10-11, version B; replaced M3's four chips and their
  // tooltips). Each half shows the bitcoin path's end wealth under that
  // scenario, as the fourth output does; Floor and Upper are the other paths
  // to test. Until the reader picks, or a link carries a pick, the default is
  // the lower of the two for today's price (R2).
  var scenarioPicked = false;
  function applyScenarioDefault(){
    if (!scenarioPicked) state.btcScenario = window.PriceCases.defaultFor(currentMultiple());
    state.btcCagr = resolveScenarioCagr(state.btcScenario, state.horizon);
  }
  function scenarioPhrase(sc){
    var n = window.PriceCases.names(currentMultiple())[sc];
    return 'bitcoin ' + n.charAt(0).toLowerCase() + n.slice(1);
  }
  function renderPriceCases(result, btcEnd){
    var el = document.getElementById('pcBfi');
    if (!el) return;
    var m = currentMultiple(), H = state.horizon, yrs = H + (H === 1 ? ' year' : ' years');
    var incomeTxt = fmtUSD(result.finalRealIncomeWealth);
    function val(sc){
      return { num: fmtUSD(btcEnd[sc]), sub: 'the bitcoin path after ' + yrs + ', holding and selling as needed for the same income, in today\u2019s dollars \u00b7 the income path: ' + incomeTxt };
    }
    var sc = state.btcScenario, rate = resolveScenarioCagr(sc, H);
    var note = sc === 'upper' ? ' An upside path to test the income path against, not a forecast' + (upperRecordText() ? ': ' + upperRecordText() : '') + '.'
             : sc === 'floor' ? ' A path to test: 0.42\u00d7 is the channel\u2019s floor, which price has gone below by 5.1% at most since the genesis era (2015).' : '';
    window.PriceCases.render(el, {
      mult: m, selected: sc, drives: 'the outputs, the chart and the table below', stressWord: 'path to test',
      plan: { months: H * 12, phrase: 'all ' + yrs, words: yrs },
      values: { stay: val('stay'), trend: val('trend') },
      showing: window.PriceCases.titles(m)[sc] + ': bitcoin grows about <strong>' + (rate * 100).toFixed(1) + '% a year</strong> over ' + yrs + ', today\u2019s price to its price then, in nominal dollars.' + note
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

  // The block's halves and paths to test (PriceCases.bind).
  window.PriceCases.bind(document.getElementById('pcBfi'), function(k){
    scenarioPicked = true;
    state.btcScenario = k;
    recalc();
  });

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
    // Convert the position to bitcoin at today's price. The price follows the
    // scenario's path (scenarioPrice: the multiple of trend moves in a
    // straight line to the scenario's target, rulings M3; was a constant-CAGR
    // path to the same end point), with the optional stress overlay on top.
    // Sell bitcoin each year to fund the income need (inflated) and the tax
    // on the gain. Run for the selected scenario, and for Drifts to the
    // floor, which the chart always draws faintly (M3).
    function btcSellAsNeeded(scenario){
      var spotPrice = window.TODAY_PRICE;
      var btcUnits = state.position / spotPrice;
      var btcPriceTrajectory = [spotPrice];
      var btcPrice = spotPrice;
      var btcCostBasis = state.position;
      var nominalBtcPath = [state.position];
      var realBtcPath = [state.position];
      var btcSoldPerYear = [];   // nominal USD value of BTC sold to fund need + tax each year

      // Apply stress: drawdown happens in months 1..duration, then a linear
      // recovery back to the selected path (not to trend; DEFAULTS_POLICY §3, item 10)
      var stressDuration = state.stressDurationMonths / 12;
      var stressMax = state.stressDrawdown;

      for (var y2 = 1; y2 <= years; y2++){
        // The scenario's price this year (before any stress overlay)
        var scenarioPx = scenarioPrice(scenario, y2, years);
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
        btcPrice = scenarioPx * stressFactor;

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
      return { nominalBtcPath: nominalBtcPath, realBtcPath: realBtcPath,
               btcSoldPerYear: btcSoldPerYear, btcPriceTrajectory: btcPriceTrajectory };
    }
    var btcRun = btcSellAsNeeded(state.btcScenario);
    // Both scenarios' end wealth, for the two-scenario block (one of them is btcRun).
    function endOf(run){ return run.realBtcPath[run.realBtcPath.length - 1]; }
    var btcEnd = { stay:  state.btcScenario === 'stay'  ? endOf(btcRun) : endOf(btcSellAsNeeded('stay')),
                   trend: state.btcScenario === 'trend' ? endOf(btcRun) : endOf(btcSellAsNeeded('trend')) };
    var nominalBtcPath = btcRun.nominalBtcPath;
    var realBtcPath = btcRun.realBtcPath;
    var btcSoldPerYear = btcRun.btcSoldPerYear;
    var realFloorPath = (state.btcScenario === 'floor') ? null : btcSellAsNeeded('floor').realBtcPath;

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
      realFloorPath: realFloorPath,     // null when Floor is the selected scenario
      nominalIncomePath: nominalIncomePath,
      nominalBtcPath: nominalBtcPath,
      dividendsPerYear: dividendsPerYear,
      btcSoldPerYear: btcSoldPerYear,
      crossoverYear: crossoverYear,
      finalRealIncomeWealth: finalRealIncomeWealth,
      finalRealBtcWealth: realBtcPath[realBtcPath.length - 1],
      btcEnd: btcEnd,
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
      // The rate is computed here rather than read from state.btcCagr, which
      // the horizon slider refreshes only after this render has run.
      var rate = resolveScenarioCagr(state.btcScenario, state.horizon);
      msg += 'Bitcoin path: hold and sell as needed, if ' + scenarioPhrase(state.btcScenario) +
             ' (about ' + Math.round(rate * 100) + '% a year over ' + state.horizon + ' year' + (state.horizon === 1 ? '' : 's') + ')';
      if (state.stressDrawdown > 0){
        msg += ', with a ' + (state.stressDrawdown * 100).toFixed(0) + '% drawdown over ' + state.stressDurationMonths + ' months';
      }
      msg += '.';
      if (state.btcScenario !== 'floor') msg += ' The faint line is the same path if bitcoin ' + window.PriceCases.floorVerb(currentMultiple()).toLowerCase() + ' to the floor.';
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
          },
          {
            // Drifts to the floor, drawn faintly whichever scenario is picked
            // (rulings M3), so the low case is always in view. Emptied, and
            // dropped from the legend, when Floor is the selected scenario.
            label: 'Bitcoin, if it drifts to the floor (real USD)',
            data: [],
            borderColor: 'rgba(247, 147, 26, 0.5)',
            backgroundColor: 'rgba(247, 147, 26, 0)',
            borderWidth: 1.5,
            borderDash: [2, 4],
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 3,
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
              padding: 14,
              filter: function(item, data){
                var ds = data.datasets[item.datasetIndex];
                return !!(ds && ds.data && ds.data.length);
              }
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
    chart.data.datasets[2].data = result.realFloorPath || [];
    // Below the floor the faint line rises to it (PriceCases.floorVerb, 2026-11-22).
    chart.data.datasets[2].label = 'Bitcoin, if it ' + window.PriceCases.floorVerb(currentMultiple()).toLowerCase() + ' to the floor (real USD)';
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
    applyScenarioDefault();
    var result = computePaths();
    renderPriceCases(result, result.btcEnd);
    updateOutputs(result);
    updateChart(result);
    updateCashflowTable(result);
    refreshEntryConditions();
    updateVerdict(result);
    renderLedger(result);
    pushHash();  // keep URL hash in sync with calculator state for shareable scenarios
  }

  // ════════ CHECK THE WORK (STYLE_GUIDE §6.49; shared/ledger.js) ════════
  // Added 2026-11-26. Both paths year by year, every step computePaths() takes
  // (mirrored here line for line, and checked against its output), the two
  // lines side by side, then the cards. Nothing here changes a figure.
  var ledgerEl = document.getElementById('bfiLedger');
  var LAST_RESULT = null;
  function usd0(v){ return (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US'); }
  // The income path, as computePaths() runs it, keeping each step.
  function incomeRows(){
    var years = state.horizon, infl = state.inflation / 100, path = PATHS[state.incomePath] || PATHS.strc;
    var taxBracket = state.taxBracket / 100, ltcgRate = state.ltcgRate / 100;
    var basis = state.position, basisRemaining = basis, positionValue = state.position, rows = [];
    for (var y = 1; y <= years; y++){
      var start = positionValue, grossDividend = positionValue * path.yield, need = state.incomeNeed * Math.pow(1 + infl, y - 1), tax = 0, kind = 'ord';
      if (path.treatment === 'roc' && state.preferredTaxTreatment === 'roc'){
        if (basisRemaining >= grossDividend){ basisRemaining -= grossDividend; tax = 0; kind = 'roc'; }
        else { var taxable = grossDividend - basisRemaining; basisRemaining = 0; tax = taxable * ltcgRate; kind = 'roc-out'; }
      } else if (path.treatment === 'ordinary-fed-only'){ tax = grossDividend * (taxBracket * 0.75); kind = 'fed'; }
      else { tax = grossDividend * taxBracket; }
      var net = grossDividend - tax, surplus = net - need, reinvested = 0, withdrawn = 0, wTax = 0;
      if (surplus > 0){ positionValue += surplus; basis += surplus; basisRemaining += surplus; reinvested = surplus; }
      else if (surplus < 0){
        var withdrawal = -surplus;
        var gainPortion = positionValue > basis ? Math.min(withdrawal, (positionValue - basis) * (withdrawal / positionValue)) : 0;
        wTax = gainPortion * ltcgRate; positionValue -= (withdrawal + wTax); basis -= (withdrawal - gainPortion);
        basisRemaining = Math.max(0, basisRemaining - withdrawal); withdrawn = withdrawal;
      }
      rows.push({ y: y, start: start, gross: grossDividend, tax: tax, kind: kind, net: net, need: need, reinvested: reinvested, withdrawn: withdrawn, wTax: wTax, end: positionValue, rocLeft: basisRemaining, real: positionValue / Math.pow(1 + infl, y) });
    }
    return rows;
  }
  // The bitcoin path, as btcSellAsNeeded() runs it, keeping each step.
  function btcRows(scenario){
    var years = state.horizon, infl = state.inflation / 100, ltcgRate = state.ltcgRate / 100;
    var units = state.position / window.TODAY_PRICE, cost = state.position, rows = [];
    var dur = state.stressDurationMonths / 12, mx = state.stressDrawdown;
    for (var y = 1; y <= years; y++){
      var scen = scenarioPrice(scenario, y, years), factor = 1;
      if (mx > 0 && y <= dur * 2){ if (y <= dur) factor = 1 - mx * (y / dur); else factor = 1 - mx * (1 - (y - dur) / dur); }
      var px = scen * factor, need = state.incomeNeed * Math.pow(1 + infl, y - 1), forNeed = need / px;
      var avg = units > 0 ? cost / units : 0, gain = Math.max(0, (px - avg) * forNeed), tax = gain * ltcgRate, forTax = tax / px, sold = forNeed + forTax, before = units;
      units = Math.max(0, units - sold); cost = Math.max(0, cost - avg * sold);
      rows.push({ y: y, scen: scen, factor: factor, px: px, need: need, avg: avg, gain: gain, tax: tax, forNeed: forNeed, forTax: forTax, sold: sold, soldUsd: sold * px, before: before, short: sold > before + 1e-12, left: units, value: units * px, real: units * px / Math.pow(1 + infl, y) });
    }
    return rows;
  }
  function ledgerSpec(result){
    var path = PATHS[state.incomePath] || PATHS.strc, inc = incomeRows(), btc = btcRows(state.btcScenario), H = state.horizon;
    var m0 = currentMultiple(), sc = state.btcScenario, names = window.PriceCases.titles(m0), rate = resolveScenarioCagr(sc, H);
    var scName = sc === 'floor' ? 'Drifts to the floor (a path to test)' : sc === 'upper' ? 'Peaks at ' + UPPER_TARGET + '× trend (a path to test)' : names[sc];
    var roc = path.treatment === 'roc' && state.preferredTaxTreatment === 'roc';
    var taxWord = roc ? 'return of capital: no tax while the basis lasts, then ' + state.ltcgRate + '% on the rest' : path.treatment === 'ordinary-fed-only' ? state.taxBracket + '% × 0.75 (federal only, the state part taken as a quarter of the bracket)' : state.taxBracket + '% as ordinary income';
    var ranOut = btc.filter(function(r){ return r.short; }), negInc = inc.filter(function(r){ return r.end < 0; });
    var stressWord = state.stressDrawdown > 0 ? (state.stressDrawdown * 100).toFixed(0) + '% over ' + state.stressDurationMonths + ' months, on bitcoin’s price only' : 'none';
    var incCols = [
      { label: 'Year', unit: '', fmt: 'text', get: function(x){ return 'Year ' + x.y; }, how: 'Each year of the horizon. Dollars are nominal; the last column deflates.' },
      { label: 'Position at the start', unit: '$', fmt: 'usd', get: function(x){ return x.start; }, how: 'The instrument held at par: the initial position plus any reinvested surplus, less any withdrawals.' },
      { label: 'Dividend', unit: '$', fmt: 'usd', get: function(x){ return x.gross; }, how: 'The position times ' + (path.yield * 100).toFixed(1) + '% (' + path.label + ').' },
      { label: 'Tax on it', unit: '$', fmt: 'usd', get: function(x){ return x.tax; }, how: 'Taxed as ' + taxWord + '.' + (roc ? ' The basis is the money put in; each dividend uses some of it up.' : '') },
      { label: 'After tax', unit: '$', fmt: 'usd', get: function(x){ return x.net; }, how: 'The dividend less the tax: the cashflow table’s Dividend received.' },
      { label: 'Need', unit: '$', fmt: 'usd', get: function(x){ return x.need; }, how: 'The annual income need, ' + usd0(state.incomeNeed) + ', grown by ' + state.inflation + '% inflation a year.' },
      { label: 'Reinvested', unit: '$', fmt: 'usd', get: function(x){ return x.reinvested || null; }, how: 'When the after-tax dividend beats the need, the surplus buys more of the instrument at par.' },
      { label: 'Drawn from principal', unit: '$', fmt: 'usd', get: function(x){ return x.withdrawn || null; }, how: 'When it falls short, the gap is sold from the position.' },
      { label: 'Tax on the draw', unit: '$', fmt: 'usd', get: function(x){ return x.withdrawn ? x.wTax : null; }, how: 'The draw’s share of any gain over the cost basis, at ' + state.ltcgRate + '%, also taken from the position.' + (roc ? ' The cost basis here isn’t reduced by the return-of-capital dividends; only the ROC allowance is.' : '') },
      { label: 'Position at the end', unit: '$', fmt: 'usd', get: function(x){ return x.end; }, how: 'Redeemed at par at the horizon: no price risk and no tax on redemption are modelled.' + (negInc.length ? ' It goes below zero from year ' + negInc[0].y + ': the draws exceed the position, and the model does not stop.' : '') },
      { label: 'Real value', unit: '$', fmt: 'usd', get: function(x){ return x.real; }, how: 'The position deflated by ' + state.inflation + '% a year: the chart’s income line.' }];
    if (roc) incCols.splice(4, 0, { label: 'ROC basis left', unit: '$', fmt: 'usd', get: function(x){ return x.rocLeft; }, how: 'The return-of-capital allowance left after this year: what the position cost, less the dividends that used it up, plus any reinvestment.' });
    var btcCols = [
      { label: 'Year', unit: '', fmt: 'text', get: function(x){ return 'Year ' + x.y; }, how: 'Each year of the horizon. Dollars are nominal; the last column deflates.' },
      { label: 'Price on the scenario', unit: '$', fmt: 'usd', get: function(x){ return x.scen; }, how: 'The Power Law trend that year times the scenario’s multiple (' + scName + ').' },
      { label: 'Stress', unit: '×', fmt: 'mult', get: function(x){ return x.factor; }, how: state.stressDrawdown > 0 ? 'The overlay: down in a straight line to ' + (1 - state.stressDrawdown).toFixed(2) + '× at ' + (state.stressDurationMonths / 12) + ' years, back to 1 over the same time, read at each year end. Bitcoin only: the income path is not stressed.' : 'None chosen.' },
      { label: 'Price', unit: '$', fmt: 'usd', get: function(x){ return x.px; }, how: 'The scenario’s price times the stress.' },
      { label: 'Need', unit: '$', fmt: 'usd', get: function(x){ return x.need; }, how: 'The same need as the income path.' },
      { label: 'Average cost', unit: '$', fmt: 'usd', get: function(x){ return x.avg; }, how: 'The cost basis per bitcoin, averaged: the position bought at today’s ' + usd0(window.TODAY_PRICE) + ', less the cost of what has been sold.' },
      { label: 'Tax on the sale', unit: '$', fmt: 'usd', get: function(x){ return x.tax; }, how: 'The gain on the bitcoin sold for the need, price less average cost, at ' + state.ltcgRate + '%.' },
      { label: 'Bitcoin sold', unit: '₿', fmt: 'btc', get: function(x){ return x.sold; }, how: 'The need over the price, plus the tax over the price. The extra sold for the tax has a gain too, which isn’t taxed here.' },
      { label: 'Sold, in dollars', unit: '$', fmt: 'usd', get: function(x){ return x.soldUsd; }, how: 'Bitcoin sold times the price: the cashflow table’s Bitcoin sold.' },
      { label: 'Bitcoin left', unit: '₿', fmt: 'btc', get: function(x){ return x.left; }, how: 'What was held less what was sold, never below zero.' + (ranOut.length ? ' It runs out in year ' + ranOut[0].y + ': from then the sales aren’t there to make, but the model still counts the need as met.' : '') },
      { label: 'Value', unit: '$', fmt: 'usd', get: function(x){ return x.value; }, how: 'Bitcoin left times the price.' },
      { label: 'Real value', unit: '$', fmt: 'usd', get: function(x){ return x.real; }, how: 'Deflated by ' + state.inflation + '% a year: the chart’s bitcoin line.' }];
    var side = inc.map(function(r, i){ return { y: r.y, a: r.real, b: btc[i].real }; });
    var sideCols = [
      { label: 'Year', unit: '', fmt: 'text', get: function(x){ return 'Year ' + x.y; }, how: 'Each year of the horizon.' },
      { label: 'Income path', unit: '$, real', fmt: 'usd', get: function(x){ return x.a; }, how: 'The Income path tab’s real value.' },
      { label: 'Bitcoin path', unit: '$, real', fmt: 'usd', get: function(x){ return x.b; }, how: 'The Bitcoin path tab’s real value.' },
      { label: 'Bitcoin minus income', unit: '$, real', fmt: 'usd', get: function(x){ return x.b - x.a; }, how: 'The gap between the chart’s two lines.' },
      { label: 'Ahead', unit: '', fmt: 'text', get: function(x){ return x.b > x.a ? 'Bitcoin' : 'Income'; }, how: 'The first year bitcoin is ahead is the crossover the card shows.' }];
    var effTax = roc ? (Math.max(0, H - Math.min(H, 1 / path.yield)) / H) * (state.ltcgRate / 100) : path.treatment === 'ordinary-fed-only' ? (state.taxBracket / 100) * 0.75 : state.taxBracket / 100;
    var fin = [
      { label: 'Real wealth at year ' + H, fmt: 'usd', values: [result.finalRealIncomeWealth, result.finalRealBtcWealth], card: 'The two End-of-horizon wealth cards above', how: 'Each path’s last real value.' },
      { label: 'Nominal wealth at year ' + H, fmt: 'usd', values: [inc[inc.length - 1].end, btc[btc.length - 1].value], how: 'Before deflating.' },
      { label: 'Income drawn over the horizon', fmt: 'usd', values: [inc.reduce(function(a, r){ return a + r.need; }, 0), btc.reduce(function(a, r){ return a + r.need; }, 0)], how: 'The need, every year, on both paths (nominal).' },
      { label: 'Tax paid over the horizon', fmt: 'usd', values: [inc.reduce(function(a, r){ return a + r.tax + r.wTax; }, 0), btc.reduce(function(a, r){ return a + r.tax; }, 0)], how: 'Income path: tax on dividends and on draws. Bitcoin path: tax on sales (nominal).' },
      { label: 'Bitcoin path if it stays (the block)', fmt: 'usd', values: [result.finalRealIncomeWealth, result.btcEnd.stay], how: 'The two-scenario block’s figures: the bitcoin path run on each scenario, beside the income path, which doesn’t depend on bitcoin.' },
      { label: 'Bitcoin path if it returns (the block)', fmt: 'usd', values: [result.finalRealIncomeWealth, result.btcEnd.trend], how: 'The same, if bitcoin returns to trend over 3 years.' },
      { label: 'Real after-tax IRR (the card)', fmt: 'pct', values: [result.displayIRR / 100, null], how: 'Not an internal rate of return on the cashflows, as its tooltip says: the card shows the yield times one less an average tax rate, minus inflation: ' + (path.yield * 100).toFixed(1) + '% × (1 − ' + (effTax * 100).toFixed(1) + '%) − ' + state.inflation + '%.' + (roc ? ' The average tax counts ' + state.ltcgRate + '% only for the years after the basis would run out at the gross yield (' + (1 / path.yield).toFixed(1) + ' years).' : '') },
      { label: 'Crossover year', fmt: 'text', values: [result.crossoverYear !== null ? 'Year ' + result.crossoverYear : 'After year ' + H, ''], how: 'The first year the bitcoin path’s real value beats the income path’s: the Side by side tab.' }];
    var inputs = [
      ['Annual income need', usd0(state.incomeNeed) + ', grown by inflation'], ['Initial position', usd0(state.position)], ['Horizon', H + (H === 1 ? ' year' : ' years')],
      ['Income path', path.label + ', taxed as ' + taxWord], ['Inflation', state.inflation + '% a year'],
      ['Bitcoin’s price', scName + ': about ' + (rate * 100).toFixed(1) + '% a year'], ['Today’s price', usd0(window.TODAY_PRICE) + ' (' + m0.toFixed(2) + '× trend)'],
      ['Stress overlay', stressWord], ['Capital gains rate', state.ltcgRate + '%'], ['Today', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]];
    return {
      hint: 'both paths year by year, and the cards',
      inputs: inputs.map(function(m){ return { label: m[0], value: m[1] }; }),
      note: 'Every step of both paths, as the calculator takes it. The income path’s instrument holds par and pays its rate in every year and every stress; only bitcoin is stressed. The last table is the cards and the two-scenario block.',
      tabs: [{ id: 'income', label: 'Income path', columns: incCols, rows: inc, strong: function(x){ return x.y === H; } },
             { id: 'btc', label: 'Bitcoin path', columns: btcCols, rows: btc, strong: function(x){ return x.y === H; } },
             { id: 'side', label: 'Side by side', columns: sideCols, rows: side, strong: function(x){ return x.y === result.crossoverYear; } }],
      final: { title: 'At year ' + H, csvTitle: 'At year ' + H + ' (dollars as labelled)', howTitle: 'How these figures are worked out', cols: ['Income path', 'Bitcoin path'], rows: fin },
      csv: { filename: 'bitcoin-fixed-income.csv', meta: [
        ['Last Coin Standing', 'Bitcoin and Fixed Income'],
        ['Amounts', 'nominal dollars unless a column says real (today’s dollars)'],
        ['Page', function(){ return window.location.origin + window.location.pathname + window.location.search; }]] }
    };
  }
  function renderLedger(result){
    LAST_RESULT = result;
    if (!ledgerEl || !window.Ledger) return;
    window.Ledger.render(ledgerEl, ledgerSpec(result));
  }

  // ── QA (console: bfiQA()) ──
  // Both paths' mirrored steps against computePaths(), the side tab and the
  // crossover, the last table against the cards, the block and the
  // cashflow table, the CSV's shape; then a sweep through recalc(),
  // restoring the reader's settings after.
  window.bfiQA = function(){
    var near = function(x, y){ return typeof x === 'number' && typeof y === 'number' && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y)); };
    function holds(){
      var sp = ledgerEl && ledgerEl._ledgerSpec, why = [];
      if (!sp) return { ok: false, why: ['no ledger'] };
      if (!window.Ledger.check(ledgerEl, { side: false })) why.push('Ledger.check');
      var R = computePaths(), inc = sp.tabs[0].rows, btc = sp.tabs[1].rows, side = sp.tabs[2].rows, fin = sp.final.rows;
      inc.forEach(function(x, i){ if (!near(x.real, R.realIncomePath[i + 1]) || !near(x.net, R.dividendsPerYear[i]) || !near(x.net, x.gross - x.tax) || !near(x.end - x.start, x.reinvested - x.withdrawn - x.wTax)) why.push('income year ' + x.y); });
      btc.forEach(function(x, i){ if (!near(x.real, R.realBtcPath[i + 1]) || !near(x.soldUsd, R.btcSoldPerYear[i]) || !near(x.sold * x.px, x.need + x.tax) || !near(x.px, x.scen * x.factor)) why.push('bitcoin year ' + x.y); });
      var cross = null; side.forEach(function(x){ if (cross === null && x.b > x.a) cross = x.y; });
      if (cross !== R.crossoverYear) why.push('crossover');
      var t = function(id){ var e = document.getElementById(id); return e ? e.textContent : null; };
      if (!near(fin[0].values[0], R.finalRealIncomeWealth) || !near(fin[0].values[1], R.finalRealBtcWealth) || t('incomeWealth') !== fmtUSD(R.finalRealIncomeWealth) || t('btcWealth') !== fmtUSD(R.finalRealBtcWealth)) why.push('wealth cards');
      if (!near(fin[6].values[0], R.displayIRR / 100) || t('incomeIRR') !== R.displayIRR.toFixed(2)) why.push('IRR card');
      if (t('crossoverYear') !== (R.crossoverYear !== null ? String(R.crossoverYear) : '> ' + state.horizon)) why.push('crossover card');
      var pc = t('pcBfi') || '';
      if (pc.indexOf(fmtUSD(R.btcEnd.stay)) < 0 || pc.indexOf(fmtUSD(R.btcEnd.trend)) < 0 || !near(fin[4].values[1], R.btcEnd.stay) || !near(fin[5].values[1], R.btcEnd.trend)) why.push('two-scenario block');
      var trs = document.querySelectorAll('#cashflowTbody tr');
      if (trs.length !== state.horizon) why.push('cashflow rows');
      Array.prototype.forEach.call(trs, function(tr, i){ var c = tr.children; if (c[1].textContent !== fmtUSD(inc[i].real) || c[2].textContent !== fmtUSD(inc[i].net) || c[3].textContent !== fmtUSD(btc[i].real) || c[4].textContent !== fmtUSD(btc[i].soldUsd)) why.push('cashflow year ' + (i + 1)); });
      var csv = window.Ledger.toCsv(sp);
      if (!(csv.indexOf('# Last Coin Standing,') === 0 && (csv.match(/^# Input: /gm) || []).length === sp.inputs.length
        && (csv.match(/^# How each column is worked out$/gm) || []).length === 3 && csv.indexOf('# At year ') > 0)) why.push('csv shape');
      return { ok: !why.length, why: why };
    }
    var out = [], live = holds();
    out.push(['live panel: both paths against computePaths, the crossover, the cards, the block, the cashflow table, CSV', live.ok, live.why.slice(0, 6).join('; ')]);
    var keys = ['incomeNeed', 'position', 'horizon', 'btcScenario', 'incomePath', 'taxBracket', 'ltcgRate', 'inflation', 'preferredTaxTreatment', 'stressPreset', 'stressDrawdown', 'stressDurationMonths'];
    var saved = {}; keys.forEach(function(k){ saved[k] = state[k]; }); var wasPicked = scenarioPicked;
    var P = { base: [0, 0], mild: [0.30, 12], mreit: [0.50, 24], winter: [0.70, 48] };
    var V = [
      [60000, 1000000, 15, 'stay', 'strc', 'roc', 'base'], [60000, 1000000, 15, 'trend', 'sata', 'roc', 'mild'],
      [150000, 1000000, 30, 'floor', 'strc', 'roc', 'winter'], [60000, 1000000, 4, 'upper', 'treasury', 'roc', 'mreit'],
      [40000, 250000, 10, 'stay', 'igcorp', 'roc', 'base'], [100000, 2000000, 20, 'trend', 'strc', 'ordinary', 'winter'],
      [500000, 100000, 5, 'floor', 'sata', 'roc', 'winter']];
    try {
      V.forEach(function(v){
        state.incomeNeed = v[0]; state.position = v[1]; state.horizon = v[2]; state.btcScenario = v[3]; scenarioPicked = true; state.incomePath = v[4]; state.preferredTaxTreatment = v[5];
        state.stressPreset = v[6]; state.stressDrawdown = P[v[6]][0]; state.stressDurationMonths = P[v[6]][1];
        recalc();
        var r = holds();
        out.push(['sweep: ' + v.join(', '), r.ok, r.why.slice(0, 6).join('; ')]);
      });
    } finally { keys.forEach(function(k){ state[k] = saved[k]; }); scenarioPicked = wasPicked; recalc(); }
    var ok = out.every(function(x){ return x[1]; });
    if (window.console) console.table(out.map(function(x){ return { check: x[0], pass: x[1], why: x[2] }; }));
    return { ok: ok, checks: out };
  };

  // ===== URL scenario sharing (query params per SITE_GUIDE §17.5 convention) =====
  // Round-trippable encoding of calculator state to URL query params so users
  // can share a specific scenario. Six dimensions: income need, initial
  // position, horizon, growth scenario, income path, stress preset.
  //
  // Convention (matches /the-bitcoin-retirement, /disciplined-rebalancing,
  // /bitcoin-vs-real-estate, /borrowing-against-your-stack):
  //   - Query params, not hash. Hash is preserved for tab anchors (#calculator).
  //   - Defaults are omitted — a clean URL represents the default scenario.
  //   - Debounced (~250ms) history.replaceState on state changes.
  //   - Decoder runs once on page load, BEFORE the first recalc, via the
  //     existing slider handlers and button clicks so all side effects fire
  //     (the scenario is set directly, as the sender's pick).
  //
  // Other state fields (tax bracket, ltcg rate, inflation, preferredTaxTreatment)
  // are intentionally left out — they're "advanced" knobs that don't belong
  // in a shareable scenario URL.
  var SHARE_DEFAULTS = {
    incomeNeed:   60000,
    position:     1000000,
    horizon:      15,
    btcScenario:  'stay',     // unused since 2026-10-11: `sc` is written only once the reader picks (DEFAULTS_POLICY R7)
    incomePath:   'strc',
    stressPreset: 'base'
  };
  var SHARE_KEYS = {
    in: 'incomeNeed',     po: 'position',     hz: 'horizon',
    sc: 'btcScenario',    pa: 'incomePath',   st: 'stressPreset'
  };
  var SHARE_NUMERIC = { incomeNeed: true, position: true, horizon: true };
  var SHARE_VALID = {
    btcScenario:  ['floor', 'stay', 'trend', 'upper'],
    incomePath:   ['strc', 'sata', 'treasury', 'igcorp'],
    stressPreset: ['base', 'mild', 'mreit', 'winter']
  };

  // Suppress URL sync during programmatic apply so we don't flicker the
  // address bar through partial states while clicking chips/buttons one by one.
  var applyingHash = false;

  function readStateFromUrl(){
    if (!window.URLSearchParams) return null;
    var params = new URLSearchParams(window.location.search);
    var overrides = {};
    for (var k in SHARE_KEYS){
      var longKey = SHARE_KEYS[k];
      var v = params.get(k);
      if (v === null) continue;
      if (SHARE_NUMERIC[longKey]){
        var n = parseFloat(v);
        if (isFinite(n)) overrides[longKey] = n;
      } else if (SHARE_VALID[longKey]){
        if (SHARE_VALID[longKey].indexOf(v) !== -1) overrides[longKey] = v;
      }
    }
    return Object.keys(overrides).length ? overrides : null;
  }

  function applyOverridesToUI(overrides){
    applyingHash = true;
    // Sliders: set value + dispatch input event so existing handlers
    // update both state and the visible readouts.
    var sliderMap = {
      incomeNeed: 'incomeNeedSlider',
      position:   'positionSlider',
      horizon:    'horizonSlider'
    };
    for (var key in sliderMap){
      if (overrides[key] === undefined) continue;
      var el = document.getElementById(sliderMap[key]);
      if (el){
        el.value = String(overrides[key]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    // Button groups: click the matching control so existing handlers run all
    // the side effects (active class, stress preset table, etc.). A carried
    // scenario is the sender's pick (DEFAULTS_POLICY R7), set directly.
    if (overrides.btcScenario){
      scenarioPicked = true;
      state.btcScenario = overrides.btcScenario;
      recalc();
    }
    if (overrides.incomePath){
      var pa = document.querySelector('.path-btn[data-path="' + overrides.incomePath + '"]');
      if (pa) pa.click();
    }
    if (overrides.stressPreset){
      var st = document.querySelector('.stress-chip[data-preset="' + overrides.stressPreset + '"]');
      if (st) st.click();
    }
    applyingHash = false;
  }

  var urlSyncTimer = null;
  function pushHash(){  // name retained for call-site stability; writes ?query now
    if (applyingHash) return;
    if (!window.URLSearchParams || !window.history || !window.history.replaceState) return;
    clearTimeout(urlSyncTimer);
    urlSyncTimer = setTimeout(function(){
      var params = new URLSearchParams(window.location.search);
      for (var shortKey in SHARE_KEYS){
        var longKey = SHARE_KEYS[shortKey];
        var v = state[longKey];
        var def = SHARE_DEFAULTS[longKey];
        // The scenario: only a pick is carried, never the default (R7).
        if (shortKey === 'sc'){
          if (scenarioPicked) params.set(shortKey, String(v)); else params.delete(shortKey);
          continue;
        }
        if (v === undefined || v === null || v === def){
          params.delete(shortKey);  // clean URL for defaults — Retirement convention
        } else {
          params.set(shortKey, String(v));
        }
      }
      var qs = params.toString();
      var newUrl = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
      if (newUrl !== window.location.pathname + window.location.search + window.location.hash){
        try { window.history.replaceState(null, '', newUrl); } catch(e){ /* ignore */ }
      }
    }, 250);
  }

  // "Copy share link" button — wire up after DOM is ready. Reads
  // window.location.href at click time so the URL always reflects current state.
  function wireShareButton(){
    var btn = document.getElementById('btn-share-scenario');
    if (!btn) return;
    btn.addEventListener('click', function(){
      var url = window.location.href;
      var status = document.getElementById('shareStatus');
      var showStatus = function(msg){
        if (!status) return;
        status.textContent = msg;
        status.classList.remove('fade');
        setTimeout(function(){ status.classList.add('fade'); }, 2500);
        setTimeout(function(){ status.textContent = ''; status.classList.remove('fade'); }, 3000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(
          function(){ showStatus('Link copied — share away.'); },
          function(){ showStatus('Copy failed — please select the URL manually.'); }
        );
      } else {
        // Fallback: temp textarea + execCommand
        var ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed'; ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showStatus('Link copied — share away.'); }
        catch(e){ showStatus('Copy failed — please select the URL manually.'); }
        document.body.removeChild(ta);
      }
    });
  }

  // Apply any URL-query overrides BEFORE first recalc, then wire the share button.
  function initShareLayer(){
    var overrides = readStateFromUrl();
    if (overrides) applyOverridesToUI(overrides);
    wireShareButton();
  }

  // Initial render — defer until DOM and Chart.js settle
  if (document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(function(){ initShareLayer(); recalc(); }, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){ initShareLayer(); recalc(); }, 60);
    });
  }

  // The shared power-law-data module seeds window.TODAY_PRICE to the latest
  // PL_DATA sample but does NOT auto-call fetchTodayPrice. We call it ourselves
  // to swap in the live spot, then re-render. If no live source answers,
  // the shared fetch helper falls back to the seeded value automatically.
  if (typeof window.fetchTodayPrice === 'function'){
    window.fetchTodayPrice(function(price /*, source: 'live' | 'fallback' */){
      if (price && isFinite(price) && price > 0){
        window.TODAY_PRICE = price;
      }
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


// ============================================================
// Strategy at a glance — live treasury USD value (Tab II)
// ============================================================
// Computes the live USD value of Strategy's bitcoin treasury by
// multiplying the snapshot BTC count by the shared module's TODAY_PRICE
// (which updates from the live spot once fetchTodayPrice resolves). Other
// fields in the "Strategy at a glance" indicator are snapshot values updated
// monthly per MONTHLY_REFRESH_CHECKLIST.
(function(){
  // BTC count: snapshot, 849,327 BTC at November 1, 2026 (8-K filed November 2,
  // 2026). Must equal the "Strategy at a glance" cell in bitcoin-fixed-income.njk;
  // update both when Strategy buys more (MONTHLY_REFRESH_CHECKLIST §7).
  var BTC_HELD = 849327;

  function formatBigUSD(n){
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    return '$' + Math.round(n).toLocaleString();
  }

  function renderTreasuryUsd(_price, source){
    var valueEl = document.querySelector('.sg-treasury-usd-value');
    if (!valueEl) return;
    // Honest provenance tag: "live" only on a real live resolve; the
    // pre-resolve seed and the fallback are the latest monthly sample.
    var tagEl = document.getElementById('sgLiveTag');
    if (tagEl) tagEl.textContent = (typeof todayPriceIsLive === 'function' && todayPriceIsLive(source)) ? 'live' : 'latest data';
    var price;
    if (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0) {
      price = TODAY_PRICE;
    } else if (typeof PL_DATA !== 'undefined' && PL_DATA && PL_DATA.length) {
      price = PL_DATA[PL_DATA.length - 1][1];
    } else {
      return;
    }
    valueEl.textContent = formatBigUSD(BTC_HELD * price);
  }

  function initStrategyGlance(){
    renderTreasuryUsd();
    if (typeof fetchTodayPrice === 'function') {
      fetchTodayPrice(renderTreasuryUsd);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStrategyGlance);
  } else {
    initStrategyGlance();
  }
})();
