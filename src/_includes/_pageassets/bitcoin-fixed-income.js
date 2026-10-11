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
    btcScenario: 'stay',       // 'floor' | 'stay' | 'trend' | 'upper' (rulings M3); default Stay
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
  // adopted here 2026-10-10), so the three pages share one vocabulary. Each
  // scenario moves bitcoin's multiple of the trend in a straight line from
  // today's to a target at the horizon end, and the price is that multiple
  // times the trend then:
  //   floor → PL_FLOOR (0.42×)   the channel's lower bound, drawn faintly always
  //   stay  → today's multiple  no reversion either way (the default)
  //   trend → 1.0×              the gap to trend closes by the horizon end
  //   upper → 2.5×              an upside case, not a forecast
  // Was (to 2026-10-10): stay / trend (the default, "central case") / upper,
  // each a constant-CAGR path to its end point, with Upper's tooltip calling
  // 2.5× "the historical above-cycle peak". The record says otherwise (cycle
  // peaks of 12×, 5.4×, 3.2× and, so far this cycle, 1.2×; upperRecordText()
  // below), and the default assumed the gap to trend closes (TECH_DEBT,
  // "Bitcoin scenario vocabulary", closed 2026-10-10).
  function currentTrendPrice(){ return window.plPrice(window.TODAY_DAYS); }
  function currentMultiple(){ return window.TODAY_PRICE / currentTrendPrice(); }
  var UPPER_TARGET = 2.5;
  var SCENARIO_NAMES = {   // for the chart caption: "…if <name> (about X% a year…)"
    floor: 'bitcoin drifts to the floor',
    stay:  'today’s gap to trend persists',
    trend: 'bitcoin reverts to trend',
    upper: 'bitcoin peaks at 2.5× trend'
  };
  function scenarioTarget(scenario, m0){
    if (scenario === 'stay') return m0;
    if (scenario === 'floor') return (typeof window.PL_FLOOR === 'number') ? window.PL_FLOOR : 0.42;
    if (scenario === 'upper') return UPPER_TARGET;
    return 1.0;
  }
  // Price t years from now: the multiple moves in a straight line from
  // today's to the scenario's target over the horizon, times the trend at
  // t. 365.25-day years, as on the real-estate pair (rulings M10).
  function scenarioPrice(scenario, t, horizon){
    var m0 = currentMultiple();
    var p = Math.min(t / Math.max(1, horizon), 1);
    var mult = m0 + (scenarioTarget(scenario, m0) - m0) * p;
    return mult * window.plPrice(window.TODAY_DAYS + t * 365.25);
  }
  // The implied annual growth the chips and caption show: today's price to
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

  // Per-scenario tooltips, worded as on Bitcoin vs. Rental Property (rulings
  // M3): Trend carries the ruled sentence verbatim; Stay is worded for
  // bitcoin's position without judging it; Floor's record matches The Floor.
  // One change for this page: Upper says "an upside case to test the income
  // path against" where the rental page says "a stress test", because here
  // "stress" already names the drawdown presets below.
  function scenarioTipHTML(scenario){
    if (scenario === 'stay') {
      var mult = currentMultiple();
      var base = 'Bitcoin keeps today’s multiple of the Power Law trend (' + mult.toFixed(2) + '×), so it grows at the trend’s own rate from today’s price. No reversion is assumed in either direction. This is the default.';
      if (mult < 0.95) return base + ' Bitcoin is below trend today, so this assumes the gap stays open; Reverts to trend assumes it closes.';
      if (mult > 1.05) return base + ' Bitcoin is above trend today, so this assumes the premium persists; Reverts to trend assumes it closes.';
      return base + ' Bitcoin is close to trend today, so this and Reverts to trend give similar results.';
    }
    if (scenario === 'trend') {
      return 'Assumes the gap to trend closes in a straight line by the horizon end. In the record, reversion has been irregular in timing.';
    }
    if (scenario === 'floor') {
      return 'Bitcoin’s multiple moves in a straight line from today’s to 0.42× the Power Law trend, the channel’s lower bound, by the end of the horizon. Price has approached the floor three times since the genesis era and gone below it by 5.1% at most (2015), and each time it moved back above; the one deep breach, 42.6% below, was in 2010, in the genesis era (<a href="/the-bitcoin-floor">see The Floor</a>). Drawn faintly on the chart whichever scenario you pick.';
    }
    if (scenario === 'upper') {
      var rec = upperRecordText();
      return 'Bitcoin’s multiple moves in a straight line from today’s to 2.5× the Power Law trend by the end of the horizon: an upside case to test the income path against, not a forecast.' +
             (rec ? ' For scale, ' + rec + '.' : '') +
             ' Worth modeling as a possible window for disciplined rebalancing or partial divestment: see <a href="/disciplined-rebalancing">Disciplined Rebalancing</a>.';
    }
    return '';
  }

  // Chip rates and tooltips. Re-runs on load, on horizon changes and when
  // the live price arrives, so Stay's wording and every rate follow today's
  // multiple.
  function refreshScenarioCagrs(){
    var chips = document.querySelectorAll('.calc-cagr-chip');
    chips.forEach(function(chip){
      var scenario = chip.getAttribute('data-scenario');
      var cagr = resolveScenarioCagr(scenario, state.horizon);
      var rateEl = chip.querySelector('[data-chip-rate]');
      if (rateEl) rateEl.textContent = '~' + Math.round(cagr * 100) + '% CAGR';
      var tipEl = chip.querySelector('.calc-chip-help .tip-content');
      if (tipEl) {
        var html = scenarioTipHTML(scenario);
        if (html) tipEl.innerHTML = html;
      }
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

  // Horizon change must also re-derive the chips' implied rates (they depend
  // on the horizon: the trend's growth slows over time, and a target reached
  // over a longer horizon shifts every scenario but Stay less per year).
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
  // A chip's ? opens its tooltip (which can hold a link) without selecting
  // the chip, as on Bitcoin vs. Rental Property.
  document.querySelectorAll('.calc-cagr-chip .calc-chip-help').forEach(function(help){
    help.addEventListener('click', function(e){ e.stopPropagation(); });
    help.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
    });
  });
  // Initial render of the chips' rates and tooltips
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

      // Apply stress: drawdown happens in months 1..duration, recovery linear after that to trend
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
      msg += 'Bitcoin path: hold and sell as needed, if ' + (SCENARIO_NAMES[state.btcScenario] || SCENARIO_NAMES.stay) +
             ' (about ' + Math.round(rate * 100) + '% a year over ' + state.horizon + ' year' + (state.horizon === 1 ? '' : 's') + ')';
      if (state.stressDrawdown > 0){
        msg += ', with a ' + (state.stressDrawdown * 100).toFixed(0) + '% drawdown over ' + state.stressDurationMonths + ' months';
      }
      msg += '.';
      if (state.btcScenario !== 'floor') msg += ' The faint line is the same path if bitcoin drifts to the floor.';
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
    pushHash();  // keep URL hash in sync with calculator state for shareable scenarios
  }

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
  //     existing slider/chip click handlers so all side effects fire.
  //
  // Other state fields (tax bracket, ltcg rate, inflation, preferredTaxTreatment)
  // are intentionally left out — they're "advanced" knobs that don't belong
  // in a shareable scenario URL.
  var SHARE_DEFAULTS = {
    incomeNeed:   60000,
    position:     1000000,
    horizon:      15,
    btcScenario:  'stay',     // was 'trend' to 2026-10-10 (rulings M3 default)
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
    // Chip / button groups: click the matching control so existing handlers
    // run all the side effects (active class, stress preset table, etc.).
    if (overrides.btcScenario){
      var sc = document.querySelector('.calc-cagr-chip[data-scenario="' + overrides.btcScenario + '"]');
      if (sc) sc.click();
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


// ============================================================
// Strategy at a glance — live treasury USD value (Tab II)
// ============================================================
// Computes the live USD value of Strategy's bitcoin treasury by
// multiplying the snapshot BTC count by the shared module's TODAY_PRICE
// (which updates from the live spot once fetchTodayPrice resolves). Other
// fields in the "Strategy at a glance" indicator are snapshot values updated
// monthly per MONTHLY_REFRESH_CHECKLIST.
(function(){
  // BTC count: snapshot. Verified July 2026 against CoinGecko's
  // /companies/public_treasury/bitcoin endpoint. Update here when Strategy buys more.
  var BTC_HELD = 845050;

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
