// ─── Bitcoin vs. Rental Property — page scripts (v0.1 / Phase 1)
//     Currently scoped to a single component: the Entry-Timing Indicator,
//     which renders BTC's current multiple-of-trend with a categorical
//     label (Favorable / Neutral / Elevated). Data comes from the canonical
//     shared/power-law-data.js (PL_DATA, TODAY_PRICE, fetchTodayPrice).
//
//     The indicator is conservative on thresholds: Favorable ≤ 1.0× trend,
//     Neutral 1.0×–1.5×, Elevated > 1.5×. Bar scale runs 0×–3× (the upper
//     band) so the marker has visual room across the full channel.
//
//     First-paint uses the seeded TODAY_PRICE (current as of the monthly
//     data refresh); fetchTodayPrice replaces it with the live spot when
//     CoinGecko resolves. The render path uses display-only DOM updates
//     to avoid layout thrash on the live-price replacement.
//
//     Calculator (Phase 2) will live in a separate IIFE in this file.

(function(){
  function categorize(multiple){
    if (multiple <= 1.0) return { label: 'Favorable', cls: 'favorable',
      copy: 'Bitcoin sits at or below long-term trend. Structurally favorable entry conditions.' };
    if (multiple <= 1.5) return { label: 'Neutral', cls: 'neutral',
      copy: 'Bitcoin trades modestly above trend. Entry conditions are neutral — no urgency, no obstruction.' };
    return { label: 'Elevated', cls: 'elevated',
      copy: 'Bitcoin trades meaningfully above trend. Forward CAGR compresses from elevated entry; consider averaging in or waiting.' };
  }

  function render(){
    var card = document.getElementById('eti-card');
    if (!card) return;

    // Defensive: shared globals must be present (page_scripts ordering
    // ensures power-law-data.js is concatenated before this file).
    if (typeof plPrice !== 'function' || typeof PL_DATA === 'undefined' ||
        typeof GENESIS_TS !== 'number') {
      return;
    }

    var todayDays = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var trendPrice = plPrice(todayDays);
    var livePrice = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
      ? TODAY_PRICE : PL_DATA[PL_DATA.length - 1][1];
    var multiple = livePrice / trendPrice;
    var cat = categorize(multiple);

    // Bar scale: 0× to 3× trend (the upper band). Clamp marker to [2, 98]
    // so it never sits flush against the edges of the gradient bar.
    var pct = Math.min(98, Math.max(2, (multiple / 3.0) * 100));

    // Multiple value
    var mEl = card.querySelector('.eti-multiple-value');
    if (mEl) mEl.textContent = multiple.toFixed(2);

    // Label (replace classes — keep just the base class + categorical mod)
    var lEl = card.querySelector('.eti-label');
    if (lEl) {
      lEl.className = 'eti-label ' + cat.cls;
      lEl.textContent = cat.label;
    }

    // Marker position
    var markerEl = card.querySelector('.eti-marker');
    if (markerEl) markerEl.style.left = pct + '%';

    // Copy
    var copyEl = card.querySelector('.eti-copy');
    if (copyEl) copyEl.textContent = cat.copy;
  }

  function init(){
    render(); // first-paint with seeded TODAY_PRICE so nothing is empty

    if (typeof fetchTodayPrice === 'function') {
      fetchTodayPrice(function(){
        // TODAY_PRICE is updated in place by the shared fetch helper.
        render();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ─── Calculator (Phase 2 v0.1) ───────────────────────────────────────
// Interactive head-to-head between rental property and bitcoin paths.
// Replaces the Section 7 "Coming Soon" placeholder.
//
// Math model documented in BITCOIN_VS_RENTAL_PROPERTY_CALCULATOR_DESIGN_1.md.
// Continuous: every slider movement re-renders. No "Compute" button.
//
// v0.1 simplifications (to be relaxed in future iterations):
// - Net rental yield is taken as a direct user input rather than computed
//   from gross via the §2 waterfall. Slider default ~4.4% nets to the
//   editorial's $20-24K on a $500K property.
// - BTC CAGR is flat over the holding period (declining-CAGR in v0.2).
// - ROC distributions assumed tax-free for the full holding period (true
//   in practice for ~9-year windows at 11.5% yield before basis exhausts;
//   acceptable approximation for 10-year default).
// - State tax is a single rate per state, no AMT/local nuances.
// - HELOC modeled as interest-only with balloon repayment at end of term.

(function bvrpCalculator(){
  'use strict';

  // ─── State ───
  var state = {
    path: 4,
    propertyValue: 500000,
    netRentalYield: 4.4,       // % net (post-waterfall)
    holdingYears: 10,
    stateCode: 'CA',
    federalBracketPct: 24,     // 12, 22, 24, 32, 35, 37
    adjustedBasisPct: 60,      // % of current value
    yearsAlreadyHeld: 10,
    btcScenario: 'trend',      // 'stay' | 'trend' | 'upper' — Power Law-anchored
    helocLtv: 80,
    helocRatePct: 9.5,
    existingMortgage: 200000,
    numProperties: 3,
    propertiesRetained: 2,     // derived sold = numProperties - propertiesRetained
    portfolio: { strc: 45, sata: 30, ledn: 10, spot: 15 },
    includeSweatEquity: false,
    appreciationPct: 3.0       // RE annual appreciation
  };

  // ─── Tax tables (simplified) ───
  var STATE_CAPGAIN = {
    CA: 13.3, NY: 10.9, NJ: 10.75, OR: 9.9, MN: 9.85, HI: 11.0,
    DC: 10.75, VT: 8.75, IA: 8.53, WI: 7.65,
    MA: 5.0, IL: 4.95, MI: 4.25, CO: 4.4, GA: 5.39, NC: 4.5,
    PA: 3.07, IN: 3.0, AZ: 2.5,
    TX: 0, FL: 0, NV: 0, WA: 0, TN: 0, NH: 0, AK: 0, WY: 0, SD: 0,
    OTHER: 5.0
  };
  var STATE_PROP_TAX_RATE = {
    CA: 0.74, NY: 1.62, NJ: 2.23, TX: 1.74, FL: 0.91, IL: 2.07,
    OR: 0.93, WA: 0.87, MA: 1.14, NV: 0.55, AZ: 0.62,
    OTHER: 1.10
  };

  function federalLTCG(brkt){
    if (brkt <= 12) return 0;
    if (brkt < 35) return 0.15;
    return 0.20;
  }
  function niitApplies(brkt){ return brkt >= 32; }

  // ─── Power Law-anchored bitcoin growth scenarios ───────────────────
  // Three named scenarios, all derived from shared/power-law-data.js so
  // they auto-recalibrate as bitcoin's current multiple-of-trend shifts.
  //
  //   stay   — Bitcoin maintains today's multiple-of-trend forever.
  //            Growth rate ≈ trend CAGR from today's price (no reversion
  //            benefit / penalty from current entry conditions).
  //
  //   trend  — Bitcoin reverts from today's multiple back to 1.0× trend
  //            linearly over the holding period. When entering below
  //            trend (current case at ~0.45×), this is the "entry-timing
  //            advantage" case that produces above-trend CAGR.
  //
  //   upper  — Bitcoin drifts from today's multiple toward 2.5× trend
  //            (historical above-cycle peak, conservative vs the 3.0×
  //            channel ceiling) over the holding period.
  //
  // currentBTCMultiple() reads today's multiple at call time so the
  // chips and chart reflect the live Power Law state.

  function currentBTCMultiple(){
    if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function' ||
        typeof GENESIS_TS !== 'number') return 1.0;
    var todayDays = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var todayTrend = plPrice(todayDays);
    var todaySpot = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
      ? TODAY_PRICE : PL_DATA[PL_DATA.length - 1][1];
    return todaySpot / todayTrend;
  }

  function scenarioGrowthFactor(scenario, t, holdingYears){
    if (t === 0) return 1.0;
    if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function' ||
        typeof GENESIS_TS !== 'number') {
      // Fallback to flat CAGR if Power Law data not loaded yet
      var fallbackCAGR = scenario === 'stay' ? 0.20
                       : scenario === 'upper' ? 0.45
                       : 0.30;
      return Math.pow(1 + fallbackCAGR, t);
    }
    var todayDays = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var todayTrend = plPrice(todayDays);
    var todaySpot = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
      ? TODAY_PRICE : PL_DATA[PL_DATA.length - 1][1];
    var currentMult = todaySpot / todayTrend;

    var futureTrend = plPrice(todayDays + t * 365);
    var progress = Math.min(t / Math.max(1, holdingYears), 1.0);

    var targetMult;
    if (scenario === 'stay') {
      targetMult = currentMult;
    } else if (scenario === 'upper') {
      targetMult = currentMult + progress * (2.5 - currentMult);
    } else {
      // 'trend' (default): linear interp to 1.0× trend
      targetMult = currentMult + progress * (1.0 - currentMult);
    }

    var futurePrice = targetMult * futureTrend;
    return futurePrice / todaySpot;
  }

  function effectiveCAGR(scenario, holdingYears){
    if (holdingYears <= 0) return 0;
    var totalGrowth = scenarioGrowthFactor(scenario, holdingYears, holdingYears);
    return Math.pow(totalGrowth, 1 / holdingYears) - 1;
  }

  // ─── Math: rental side ───
  function calcRentalAnnualCF(s){
    // Net cash flow as expressed; user input already nets the waterfall.
    var gross = s.propertyValue * (s.netRentalYield / 100);
    var depreciation = (s.propertyValue * 0.80) / 27.5;
    var taxableIncome = Math.max(0, gross - depreciation);
    var tax = taxableIncome * (s.federalBracketPct / 100);
    return { pretax: gross, depreciation: depreciation, tax: tax, afterTax: gross - tax };
  }

  function calcRentalExit(s, yearsToExit){
    var appreciatedValue = s.propertyValue * Math.pow(1 + s.appreciationPct/100, yearsToExit);
    var transactionCosts = appreciatedValue * 0.08;
    var netProceeds = appreciatedValue - transactionCosts;

    // Simplified accumulated depreciation across total holding (pre + post)
    var totalYearsHeld = s.yearsAlreadyHeld + yearsToExit;
    var buildingBasis = s.propertyValue * 0.80;
    var accumulatedDep = buildingBasis * Math.min(totalYearsHeld / 27.5, 1.0);

    var adjustedBasis = s.propertyValue * (s.adjustedBasisPct / 100);
    var taxableGain = netProceeds - adjustedBasis;

    var recaptureTax = accumulatedDep * 0.25;
    var ltcgBase = Math.max(0, taxableGain - accumulatedDep);
    var ltcgTax = ltcgBase * federalLTCG(s.federalBracketPct);
    var stateRate = (STATE_CAPGAIN[s.stateCode] || STATE_CAPGAIN.OTHER) / 100;
    var stateTax = Math.max(0, taxableGain) * stateRate;
    var niit = niitApplies(s.federalBracketPct) ? Math.max(0, taxableGain) * 0.038 : 0;

    var totalTax = recaptureTax + ltcgTax + stateTax + niit;
    var netCash = netProceeds - totalTax;
    return {
      grossSale: appreciatedValue,
      marketValue: appreciatedValue,    // mark-to-market property value (no taxes/costs applied)
      transactionCosts: transactionCosts,
      netProceeds: netProceeds,
      accumulatedDep: accumulatedDep,
      taxableGain: taxableGain,
      recaptureTax: recaptureTax,
      ltcgTax: ltcgTax,
      stateTax: stateTax,
      niit: niit,
      totalTax: totalTax,
      netCash: netCash,
      effectiveLeakagePct: 1 - (netCash / appreciatedValue)
    };
  }

  // ─── Math: bitcoin paths ───
  // Spot BTC future value uses scenarioGrowthFactor — the growth path is
  // Power Law-anchored rather than a flat CAGR. The `holdingYears` arg
  // matters because it sets the reversion horizon for 'trend' and 'upper'.
  function calcSpotBTCFV(amount, years, scenario, holdingYears){
    return amount * scenarioGrowthFactor(scenario, years, holdingYears || years);
  }

  function calcYieldPortfolio(amount, s){
    var p = s.portfolio;
    var alloc = {
      strc: amount * p.strc/100,
      sata: amount * p.sata/100,
      ledn: amount * p.ledn/100,
      spot: amount * p.spot/100
    };
    // Year 1 cash distributions
    var year1 = {
      strc: alloc.strc * 0.115,   // ROC
      sata: alloc.sata * 0.130,   // ROC
      ledn: alloc.ledn * 0.080,   // ordinary
      spot: 0
    };
    var pretax = year1.strc + year1.sata + year1.ledn;
    // Ledn portion taxed; ROC tax-deferred
    var ordinaryTax = year1.ledn * (s.federalBracketPct/100);
    var year1AfterTax = pretax - ordinaryTax;

    // 10-year cumulative cash (flat yield assumption)
    var cumulativeCash = year1AfterTax * s.holdingYears;

    // Spot BTC FV
    var spotFV = calcSpotBTCFV(alloc.spot, s.holdingYears, s.btcScenario);
    var spotAppreciation = spotFV - alloc.spot;

    // Total wealth at year N
    var preservedPrincipal = alloc.strc + alloc.sata + alloc.ledn;
    var totalWealth = preservedPrincipal + spotFV + cumulativeCash;

    return {
      allocations: alloc,
      year1Distributions: year1,
      year1Pretax: pretax,
      year1AfterTax: year1AfterTax,
      cumulativeCashAfterTax: cumulativeCash,
      spotFV: spotFV,
      spotAppreciation: spotAppreciation,
      totalWealth: totalWealth
    };
  }

  // ─── Counterfactual: keep rental ───
  // Asset-value (mark-to-market) framing: keep-rental wealth is cumulative
  // after-tax cash flow + the property's market value at year N. The exit
  // tax that would arise on sale is NOT applied — we're showing the asset
  // trajectory of someone who intends to keep holding. The path-detail
  // card shows the tax waterfall explicitly for users who want to see
  // the realizable-at-year-N number.
  //
  // This matches the visual framing of the chart: bitcoin paths pay their
  // exit tax up front (year 0) so they start lower; keep-rental defers
  // the exit tax indefinitely so it starts higher. The chart honestly
  // shows the "selling has an immediate cost" reality the prior version
  // silently hid by applying exit tax to both sides at year N.
  function calcKeepRental(s){
    var annual = calcRentalAnnualCF(s);
    var cumulativeCash = annual.afterTax * s.holdingYears;
    var exit = calcRentalExit(s, s.holdingYears);
    var totalWealth = cumulativeCash + exit.marketValue;  // unrealized
    return {
      annual: annual,
      cumulativeCash: cumulativeCash,
      exit: exit,
      totalWealth: totalWealth
    };
  }

  // ─── Path-specific calculators ───
  function calcPath1(s){
    var exitNow = calcRentalExit(s, 0);
    var netCash = exitNow.netCash;
    var spotFV = calcSpotBTCFV(netCash, s.holdingYears, s.btcScenario);
    return {
      saleAtYear0: exitNow,
      year1CashFlow: 0,  // pure spot, no distributions
      totalWealth: spotFV,
      netCashDeployed: netCash
    };
  }

  function calcPath2(s){
    var maxCltvDollar = s.propertyValue * (s.helocLtv/100);
    var helocDraw = Math.max(0, maxCltvDollar - s.existingMortgage);
    var annualCarry = helocDraw * (s.helocRatePct/100);
    var cumulativeCarry = annualCarry * s.holdingYears;
    var btcFV = calcSpotBTCFV(helocDraw, s.holdingYears, s.btcScenario);

    // Net wealth gain from leveraged BTC position
    var grossGain = btcFV - helocDraw;  // BTC appreciation
    var netGainFromLeverage = grossGain - cumulativeCarry;  // after carry cost

    // Retained rental: continues earning
    var keep = calcKeepRental(s);

    var totalWealth = keep.totalWealth + netGainFromLeverage;
    return {
      helocDraw: helocDraw,
      annualCarry: annualCarry,
      cumulativeCarry: cumulativeCarry,
      btcFV: btcFV,
      netGainFromLeverage: netGainFromLeverage,
      retainedRental: keep,
      year1CashFlow: keep.annual.afterTax,
      totalWealth: totalWealth
    };
  }

  function calcPath3(s){
    // Derive sold count from numProperties - propertiesRetained.
    // propertiesRetained is the active control; sold is implicit.
    var sold = Math.max(0, s.numProperties - s.propertiesRetained);
    var retained = s.propertiesRetained;

    // Per-property economics (assume identical)
    var perPropertyValue = s.propertyValue;
    var soldPropertiesValue = perPropertyValue * sold;

    // Sale on the sold portion, deploy to yield portfolio
    var sellS = Object.assign({}, s, { propertyValue: soldPropertiesValue });
    var exitNow = calcRentalExit(sellS, 0);
    var netCashFromSale = exitNow.netCash;

    var yieldPort = calcYieldPortfolio(netCashFromSale, s);

    // Retained properties keep earning
    var retainedS = Object.assign({}, s, { propertyValue: perPropertyValue * retained });
    var keep = calcKeepRental(retainedS);

    var totalWealth = yieldPort.totalWealth + keep.totalWealth;
    var year1CF = yieldPort.year1AfterTax + keep.annual.afterTax;
    return {
      sold: sold,
      retained: retained,
      soldPropertiesValue: soldPropertiesValue,
      saleResult: exitNow,
      netCashFromSale: netCashFromSale,
      yieldPortfolio: yieldPort,
      retainedRental: keep,
      year1CashFlow: year1CF,
      totalWealth: totalWealth
    };
  }

  function calcPath4(s){
    // Outright sell + deploy net cash to yield portfolio
    var exitNow = calcRentalExit(s, 0);
    var netCash = exitNow.netCash;
    var yieldPort = calcYieldPortfolio(netCash, s);
    return {
      saleAtYear0: exitNow,
      netCashDeployed: netCash,
      yieldPortfolio: yieldPort,
      year1CashFlow: yieldPort.year1AfterTax,
      totalWealth: yieldPort.totalWealth
    };
  }

  function computeAll(s){
    // Keep-rental scales with numProperties for Path 3 — the
    // counterfactual is keeping ALL properties (the partial-sale
    // comparison would be misleading otherwise, treating an N-property
    // path as if its keep-baseline were just one property).
    var keepMultiplier = (s.path === 3) ? s.numProperties : 1;
    var keepS = (keepMultiplier !== 1)
      ? Object.assign({}, s, { propertyValue: s.propertyValue * keepMultiplier })
      : s;
    var keep = calcKeepRental(keepS);
    var pathResult;
    if (s.path === 1) pathResult = calcPath1(s);
    else if (s.path === 2) pathResult = calcPath2(s);
    else if (s.path === 3) pathResult = calcPath3(s);
    else pathResult = calcPath4(s);
    return { keep: keep, path: pathResult };
  }

  // ─── Formatters ───
  function fmtMoney(n){
    if (n === undefined || isNaN(n)) return '—';
    var abs = Math.abs(n);
    if (abs >= 1000000) return (n < 0 ? '-' : '') + '$' + (abs/1000000).toFixed(2) + 'M';
    if (abs >= 1000)    return (n < 0 ? '-' : '') + '$' + (abs/1000).toFixed(1) + 'K';
    return (n < 0 ? '-' : '') + '$' + Math.round(abs).toLocaleString();
  }
  function fmtPct(n){ return (n*100).toFixed(1) + '%'; }
  function fmtMoneyFull(n){
    if (n === undefined || isNaN(n)) return '—';
    return (n < 0 ? '-' : '') + '$' + Math.round(Math.abs(n)).toLocaleString();
  }

  // ─── Renderers ───
  // ─── Year-by-year wealth trajectories (for the chart) ───
  function calcYieldPortfolioAtYearT(amount, s, t, scenarioOverride){
    var p = s.portfolio;
    var allocs = {
      strc: amount * p.strc/100,
      sata: amount * p.sata/100,
      ledn: amount * p.ledn/100,
      spot: amount * p.spot/100
    };
    var strcDist = allocs.strc * 0.115;
    var sataDist = allocs.sata * 0.13;
    var lednDist = allocs.ledn * 0.08;
    var pretax = strcDist + sataDist + lednDist;
    var ordTax = lednDist * (s.federalBracketPct/100);
    var year1AfterTax = pretax - ordTax;
    var cumCash = year1AfterTax * t;
    var scenario = scenarioOverride || s.btcScenario;
    var spotFV = allocs.spot * scenarioGrowthFactor(scenario, t, s.holdingYears);
    var preserved = allocs.strc + allocs.sata + allocs.ledn;
    return preserved + spotFV + cumCash;
  }

  function calcWealthTrajectory(s, scenarioOverride){
    var sUse = scenarioOverride ? Object.assign({}, s, { btcScenario: scenarioOverride }) : s;

    // Keep-rental counterfactual scales with numProperties for Path 3
    // (compares against keeping ALL properties, not just one). For
    // paths 1, 2, 4 the keep-rental counterfactual is the single
    // subject property of the path, so multiplier = 1.
    var keepMultiplier = (sUse.path === 3) ? sUse.numProperties : 1;
    var keepS = (keepMultiplier !== 1)
      ? Object.assign({}, sUse, { propertyValue: sUse.propertyValue * keepMultiplier })
      : sUse;
    var rentalAnnual = calcRentalAnnualCF(keepS);
    var trajectory = [];

    for (var t = 0; t <= sUse.holdingYears; t++) {
      var growth = scenarioGrowthFactor(sUse.btcScenario, t, sUse.holdingYears);

      // Keep rental at year t: cumulative after-tax cash + property market
      // value at year t (mark-to-market, no exit tax applied).
      var cumCash = rentalAnnual.afterTax * t;
      var exitAtT = calcRentalExit(keepS, t);
      var wealthKeep = cumCash + exitAtT.marketValue;

      var wealthPath;
      if (sUse.path === 1) {
        var exitNow = calcRentalExit(sUse, 0);
        wealthPath = exitNow.netCash * growth;
      } else if (sUse.path === 2) {
        var maxCltv = sUse.propertyValue * (sUse.helocLtv/100);
        var heloc = Math.max(0, maxCltv - sUse.existingMortgage);
        var btcVal = heloc * growth;
        var carry = heloc * (sUse.helocRatePct/100) * t;
        wealthPath = wealthKeep + btcVal - heloc - carry;
      } else if (sUse.path === 3) {
        // Derive sold/retained from numProperties - propertiesRetained.
        var sold = Math.max(0, sUse.numProperties - sUse.propertiesRetained);
        var soldVal = sUse.propertyValue * sold;
        var sellS = Object.assign({}, sUse, { propertyValue: soldVal });
        var exitSell = calcRentalExit(sellS, 0);
        var ypVal = calcYieldPortfolioAtYearT(exitSell.netCash, sUse, t);
        var retainedS = Object.assign({}, sUse, {
          propertyValue: sUse.propertyValue * sUse.propertiesRetained
        });
        var retainedAnnual = calcRentalAnnualCF(retainedS);
        var retainedExit = calcRentalExit(retainedS, t);
        wealthPath = ypVal + retainedAnnual.afterTax * t + retainedExit.marketValue;
      } else {
        var exitNow4 = calcRentalExit(sUse, 0);
        wealthPath = calcYieldPortfolioAtYearT(exitNow4.netCash, sUse, t);
      }
      trajectory.push({ year: t, wealthKeep: wealthKeep, wealthPath: wealthPath });
    }
    return trajectory;
  }

  // ─── Chart.js rendering ───
  // Four datasets, dataset indices stable (legendVisibility maps to these):
  //   0 = Keep rental (amber dashed)
  //   1 = Bitcoin: Stay at current multiple
  //   2 = Bitcoin: Revert to trend
  //   3 = Bitcoin: Reach upper channel
  // The chip selection (state.btcScenario) determines which line is the
  // "primary" (bold) and which scenario drives the headline / table /
  // path-detail numbers. All four lines are simultaneously visible by
  // default; user can toggle individual lines via the custom legend.
  var chartInstance = null;
  // Legend visibility defaults: keep-rental + the default-primary
  // scenario (trend) visible; other two scenarios hidden but
  // toggleable. User clicking a different chip auto-hides the old
  // primary and shows the new one; manual toggles on the other two
  // persist across chip switches.
  var legendVisibility = { 0: true, 1: false, 2: true, 3: false };
  var chartZoom = 'full';  // 'full' | 'first3' — toggleable via UI above the chart

  // Colors for the four datasets — distinguishable on dark, semantically
  // ordered (rental amber → bear brown → trend green → upper cyan).
  // Upper channel uses a distinct hue (not another green) and is dashed
  // to reinforce its "less certain / less sustained" character.
  var CHART_COLORS = {
    rental:    '#e09422',  // amber, dashed
    stay:      '#b87a4a',  // warm brown — bear/no-reversion
    trend:     '#5a8a3a',  // canonical site green — central/default
    upper:     '#5fa8d8'   // cool blue — upper channel, also dashed
  };

  function renderChart(s){
    var canvas = document.getElementById('calc-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    var trajStay  = calcWealthTrajectory(s, 'stay');
    var trajTrend = calcWealthTrajectory(s, 'trend');
    var trajUpper = calcWealthTrajectory(s, 'upper');

    // Zoom: if 'first3', slice to the first 4 years (Y0..Y3) so the
    // short-term tax-leakage dip is visible. Auto-scaling y-axis will
    // tighten the value range around the smaller numbers, making the
    // early dynamics legible.
    var endIdx = chartZoom === 'first3' ? Math.min(3, s.holdingYears) : s.holdingYears;
    function slice(arr){ return arr.slice(0, endIdx + 1); }

    var labels = slice(trajTrend).map(function(r){ return 'Y' + r.year; });
    var keepData  = slice(trajTrend).map(function(r){ return r.wealthKeep; });
    var pathStay  = slice(trajStay).map(function(r){ return r.wealthPath; });
    var pathTrend = slice(trajTrend).map(function(r){ return r.wealthPath; });
    var pathUpper = slice(trajUpper).map(function(r){ return r.wealthPath; });

    function primary(scenario){ return scenario === s.btcScenario; }

    var datasets = [
      {
        label: 'Keep rental',
        data: keepData,
        borderColor: CHART_COLORS.rental,
        backgroundColor: CHART_COLORS.rental,
        borderWidth: 2,
        borderDash: [4, 3],
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.1,
        order: 2,
        hidden: !legendVisibility[0]
      },
      {
        label: 'Bitcoin · Stay at current trend multiple',
        data: pathStay,
        borderColor: CHART_COLORS.stay,
        backgroundColor: CHART_COLORS.stay,
        borderWidth: primary('stay') ? 2.75 : 1.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.18,
        order: primary('stay') ? 1 : 4,
        hidden: !legendVisibility[1]
      },
      {
        label: 'Bitcoin · Revert to Power Law trend',
        data: pathTrend,
        borderColor: CHART_COLORS.trend,
        backgroundColor: CHART_COLORS.trend,
        borderWidth: primary('trend') ? 2.75 : 1.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.18,
        order: primary('trend') ? 1 : 4,
        hidden: !legendVisibility[2]
      },
      {
        label: 'Bitcoin · Reach Power Law upper channel',
        data: pathUpper,
        borderColor: CHART_COLORS.upper,
        backgroundColor: CHART_COLORS.upper,
        borderWidth: primary('upper') ? 2.75 : 1.5,
        borderDash: [5, 4],  // dashed — historical spikes, never sustained
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.18,
        order: primary('upper') ? 1 : 4,
        hidden: !legendVisibility[3]
      }
    ];

    if (chartInstance) {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets = datasets;
      // 'resize' invalidates the layout cache (per STYLE_GUIDE §6.14);
      // safer than 'none' when the chart may have initialized in a
      // display:none container.
      chartInstance.update('resize');
      return;
    }

    chartInstance = new Chart(canvas, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },  // custom legend rendered below the chart
          tooltip: {
            backgroundColor: 'rgba(15,14,13,0.95)',
            borderColor: 'rgba(224,148,34,0.3)',
            borderWidth: 1,
            titleColor: '#ece4d6',
            bodyColor: '#ccc6b8',
            padding: 10,
            cornerRadius: 4,
            callbacks: {
              label: function(ctx){
                return ctx.dataset.label + ': ' + fmtMoney(ctx.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(204,198,184,0.6)', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(204,198,184,0.6)',
              font: { size: 11 },
              callback: function(v){ return fmtMoney(v); }
            }
          }
        }
      }
    });
  }

  // Per-scenario tooltip content — DRY across chip help-tips and legend
  // help-tips. Caller may pass scenario codes 'stay' | 'trend' | 'upper'.
  // 'stay' is conditional on current multiple: below trend → bear /
  // no-reversion case; above trend → bull / no-correction case;
  // within ±5% of 1.0× → neutral.
  function scenarioTipHTML(scenario){
    if (scenario === 'stay') {
      var mult = currentBTCMultiple();
      if (mult < 0.95) {
        return 'Bitcoin grows at the Power Law trend rate from today\u2019s price, never reverting up to trend. The bear / no-reversion case &mdash; you get just trend growth and miss the catch-up upside an under-trend entry would normally deliver.';
      }
      if (mult > 1.05) {
        return 'Bitcoin grows at the Power Law trend rate from today\u2019s price, never correcting down to trend. The bull / no-correction case &mdash; you keep the premium permanently and avoid the downside risk of mean reversion.';
      }
      return 'Bitcoin grows at the Power Law trend rate from today\u2019s price (which is currently at trend). At ~1\u00d7 trend, this case is roughly equivalent to Revert to trend.';
    }
    if (scenario === 'trend') {
      return 'Bitcoin moves from today\u2019s multiple back to 1.0\u00d7 the Power Law trend linearly over the holding period. The central case &mdash; assumes today\u2019s discount-or-premium-to-trend closes over time.';
    }
    if (scenario === 'upper') {
      return 'Bitcoin drifts toward 2.5\u00d7 trend (the historical above-cycle peak) over the holding period. <strong>Not a trendline expectation</strong> &mdash; rather a recognition that bitcoin has historically <em>spiked</em> to ~2.5\u00d7 trend in cycle peaks, and that such spikes have <em>never been sustained</em>. Worth modeling as a potential window for disciplined rebalancing or partial divestment &mdash; see <a href="/disciplined-rebalancing">Disciplined Rebalancing</a>.';
    }
    return '';
  }

  // Custom legend: clickable items toggle dataset visibility. Pattern
  // adapted from the-bitcoin-retirement.js wireLegendToggles().
  // Help-tip clicks inside legend items are excluded so the ? glyph
  // never toggles the line — it has its own hover/focus behavior.
  function renderChartLegend(){
    var el = document.getElementById('calc-chart-legend');
    if (!el) return;
    var rows = [
      { idx: 0, label: 'Keep rental', color: CHART_COLORS.rental, dashed: true,
        tip: 'Net wealth if you keep the rental, collecting after-tax cash flow each year. Mark-to-market &mdash; the property\u2019s market value is included without applying the exit tax that would arise on sale.' },
      { idx: 1, label: 'Bitcoin \u00b7 Stay at current trend multiple', color: CHART_COLORS.stay,
        tip: scenarioTipHTML('stay') },
      { idx: 2, label: 'Bitcoin \u00b7 Revert to Power Law trend', color: CHART_COLORS.trend,
        tip: scenarioTipHTML('trend') },
      { idx: 3, label: 'Bitcoin \u00b7 Reach Power Law upper channel', color: CHART_COLORS.upper,
        dashed: true,  // visually less confident — matches dashed chart line
        tip: scenarioTipHTML('upper') }
    ];
    var html = rows.map(function(r){
      var off = legendVisibility[r.idx] ? '' : ' off';
      var swatchStyle = 'background:' + r.color + (r.dashed ?
        ';background-image:repeating-linear-gradient(90deg,' + r.color + ' 0,' + r.color + ' 4px,transparent 4px,transparent 7px);background-color:transparent' : '');
      return '<span class="legend-item' + off + '" data-dataset-idx="' + r.idx +
             '" tabindex="0" role="button" aria-pressed="' + (legendVisibility[r.idx] ? 'true' : 'false') + '">' +
             '<span class="swatch" style="' + swatchStyle + '"></span>' +
             '<span class="legend-label">' + r.label + '</span>' +
             '<span class="help-tip" tabindex="0">?<span class="tip-content">' + r.tip + '</span></span>' +
             '</span>';
    }).join('');
    el.innerHTML = '<div class="legend-hint">click any item to hide / show that line</div>' + html;
    wireLegendToggles();
  }

  function wireLegendToggles(){
    var items = document.querySelectorAll('#calc-chart-legend .legend-item[data-dataset-idx]');
    items.forEach(function(item){
      function toggle(){
        var idx = parseInt(item.getAttribute('data-dataset-idx'), 10);
        if (isNaN(idx)) return;
        var nowVisible = !legendVisibility[idx];
        legendVisibility[idx] = nowVisible;
        item.classList.toggle('off', !nowVisible);
        item.setAttribute('aria-pressed', nowVisible ? 'true' : 'false');
        if (chartInstance) {
          chartInstance.setDatasetVisibility(idx, nowVisible);
          chartInstance.update('none');
        }
      }
      item.addEventListener('click', function(e){
        if (e.target.closest('.help-tip')) return;
        toggle();
      });
      item.addEventListener('keydown', function(e){
        if (e.target.closest('.help-tip')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function scenarioLabel(scenario){
    if (scenario === 'stay')  return 'Stay at current trend multiple';
    if (scenario === 'upper') return 'Reach Power Law upper channel';
    return 'Revert to Power Law trend';
  }

  // Path-specific plain-English description rendered below the path
  // toggle. Helps users who land on the calculator directly (deep link
  // from email, share, etc.) without first reading The Four Paths tab.
  // HELOC path includes a contextual link to the editorial section
  // since "HELOC" is jargon that needs unpacking for a non-finance
  // audience.
  function renderPathDescription(){
    var el = document.getElementById('calc-path-description');
    if (!el) return;
    var descByPath = {
      1: '<strong>Outright Sell.</strong> Sell the rental outright, pay the tax bill up front, redeploy net proceeds into spot bitcoin. The cleanest exit &mdash; cash flow stops, capital concentrates in a single asset, full bitcoin upside on what survives the tax leakage.',
      2: '<strong>HELOC + Bitcoin.</strong> Tap your home&rsquo;s equity via a Home Equity Line of Credit and buy bitcoin without selling the rental. No immediate tax event; ongoing interest carry to service from personal income. Layered leverage &mdash; structurally a leveraged bitcoin position with the rental as collateral. <a href="#paths">More on HELOC mechanics &rarr;</a>',
      3: '<strong>Partial Sale.</strong> If you have multiple rental properties, sell some but not all of them. The sold properties&rsquo; proceeds redeploy into the bitcoin yield portfolio; the retained ones keep producing rental cash flow. The middle path &mdash; partial conviction, partial diversification.',
      4: '<strong>Sell + Yield Portfolio.</strong> Sell the rental, take the tax hit, redeploy net proceeds into a portfolio of bitcoin-treasury yield instruments (STRC, SATA) plus a spot bitcoin slice. Preserves monthly income at a higher yield than the rental produced; swaps tenant-and-property risk for issuer-credit risk.'
    };
    el.innerHTML = descByPath[state.path] || '';
  }

  function renderHeadline(results, s){
    var el = document.getElementById('calc-headline');
    if (!el) return;
    var delta = results.path.totalWealth - results.keep.totalWealth;
    var rentalAnn = results.keep.annual.afterTax;
    var bitcoinAnn = results.path.year1CashFlow;
    var ratio = rentalAnn > 0 ? (bitcoinAnn / rentalAnn) : 0;

    var pathName = ['', 'Outright Sell + Spot Bitcoin',
                    'HELOC + Bitcoin', 'Partial Portfolio Sale + Yield', 'Sell + Yield Portfolio'][s.path];

    // Path-specific tradeoff reminder. The user has just made a decision;
    // this line surfaces what that decision *gives up* in exchange for
    // what the headline number promises. Honest framing — these are
    // tradeoffs, not free lunches.
    var explainerByPath = {
      1: 'You\u2019re foregoing operational cash flow and the property\u2019s tax-deferred appreciation in exchange for a higher terminal asset value &mdash; if bitcoin grows as the scenario suggests.',
      2: 'You\u2019re retaining the rental and layering on a leveraged bitcoin position. The HELOC carry must be serviced from personal income through any bitcoin drawdown &mdash; a real and asymmetric risk in the early years.',
      3: 'You\u2019re partially exiting &mdash; keeping some rental cash flow while gaining bitcoin exposure on the sold portion. Mental load and operational risk on the retained properties remain.',
      4: 'You\u2019re foregoing operational landlord cash flow in exchange for higher yield-instrument cash flow plus bitcoin appreciation. The trade preserves monthly income but swaps tenant-and-property risk for issuer-credit risk.'
    };

    var verdict, color;
    if (delta > 0) {
      verdict = '<strong>' + pathName + ' results in ' + fmtMoney(delta) +
                ' more asset value</strong> than keeping the rental over ' + s.holdingYears + ' years';
      if (ratio >= 1.3 && bitcoinAnn > 0) {
        verdict += ', with about <strong>' + ratio.toFixed(1) + '&times;</strong> the Year 1 cash flow';
      }
      verdict += '.';
      color = 'positive';
    } else {
      verdict = '<strong>Keeping the rental produces ' + fmtMoney(-delta) +
                ' more asset value</strong> than ' + pathName + ' under your inputs. The decision is close &mdash; try adjusting the bitcoin scenario, holding period, or path.';
      color = 'neutral';
    }
    var explainer = '<span class="calc-headline-explainer">' + explainerByPath[s.path] + '</span>';
    var hedge = '<span class="calc-headline-hedge">Under the <strong>' + scenarioLabel(s.btcScenario) +
                '</strong> bitcoin scenario and your specific inputs.</span>';
    el.innerHTML = '<div class="calc-headline-verdict ' + color + '">' + verdict + '</div>' + explainer + hedge;
  }

  function renderComparison(results, s){
    var el = document.getElementById('calc-comparison-body');
    if (!el) return;
    var pathName = ['', 'Sell + Spot Bitcoin', 'HELOC + Bitcoin', 'Partial Sale + Yield', 'Sell + Yield Portfolio'][s.path];

    var rentalY1 = results.keep.annual.afterTax;
    var bitcoinY1 = results.path.year1CashFlow;
    var rentalTotal = results.keep.totalWealth;
    var bitcoinTotal = results.path.totalWealth;
    var winnerClass = bitcoinTotal > rentalTotal ? 'win-bitcoin' : 'win-rental';

    el.innerHTML = '' +
      '<tr><td>Year 1 cash flow (after tax)</td>' +
        '<td class="numeric">' + fmtMoneyFull(rentalY1) + '</td>' +
        '<td class="numeric">' + fmtMoneyFull(bitcoinY1) + '</td></tr>' +
      '<tr><td>' + s.holdingYears + '-year cumulative cash flow</td>' +
        '<td class="numeric">' + fmtMoneyFull(results.keep.cumulativeCash) + '</td>' +
        '<td class="numeric">' + fmtMoneyFull(s.path === 2 ? results.path.retainedRental.cumulativeCash : (results.path.yieldPortfolio ? results.path.yieldPortfolio.cumulativeCashAfterTax : 0)) + '</td></tr>' +
      '<tr><td>Hassle / operational load</td>' +
        '<td>96 hrs/yr + mental load</td>' +
        '<td>~0' + (s.path === 2 ? ' (rental retained)' : '') + (s.path === 3 ? ' on sold portion' : '') + '</td></tr>' +
      '<tr><td>Liquidity</td>' +
        '<td>Months; 7–33% exit attrition</td>' +
        '<td>Instant; near-zero spread</td></tr>' +
      '<tr><td>Tax treatment</td>' +
        '<td>Depreciation-shielded</td>' +
        '<td>' + (s.path === 1 ? 'LTCG on appreciation only' : 'ROC-shielded') + '</td></tr>' +
      '<tr class="' + winnerClass + '"><td><strong>' + s.holdingYears + '-year total asset value</strong></td>' +
        '<td class="numeric"><strong>' + fmtMoneyFull(rentalTotal) + '</strong></td>' +
        '<td class="numeric"><strong>' + fmtMoneyFull(bitcoinTotal) + '</strong></td></tr>';

    var headers = document.getElementById('calc-comparison-headers');
    if (headers) {
      headers.innerHTML = '<tr><th>Metric</th><th>Keep Rental</th><th>' + pathName + '</th></tr>';
    }
  }

  function renderPathDetail(results, s){
    var el = document.getElementById('calc-path-detail');
    if (!el) return;
    var html = '';
    if (s.path === 1) {
      var r = results.path.saleAtYear0;
      html = '<div class="calc-detail-title">Path 1 mechanics — outright sale, redeploy to spot bitcoin</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>Gross sale</span><strong>' + fmtMoneyFull(r.grossSale) + '</strong></div>' +
        '<div><span>Transaction costs (8%)</span><strong>-' + fmtMoneyFull(r.transactionCosts) + '</strong></div>' +
        '<div><span>Net proceeds</span><strong>' + fmtMoneyFull(r.netProceeds) + '</strong></div>' +
        '<div><span>Depreciation recapture (25%)</span><strong>-' + fmtMoneyFull(r.recaptureTax) + '</strong></div>' +
        '<div><span>Federal LTCG</span><strong>-' + fmtMoneyFull(r.ltcgTax) + '</strong></div>' +
        '<div><span>State tax (' + s.stateCode + ')</span><strong>-' + fmtMoneyFull(r.stateTax) + '</strong></div>' +
        '<div><span>NIIT</span><strong>-' + fmtMoneyFull(r.niit) + '</strong></div>' +
        '<div class="calc-detail-emphasis"><span>Net cash deployed to bitcoin</span><strong>' + fmtMoneyFull(r.netCash) + '</strong></div>' +
        '<div><span>All-in leakage from gross sale</span><strong>' + fmtPct(r.effectiveLeakagePct) + '</strong></div>' +
        '</div>';
    } else if (s.path === 2) {
      var r2 = results.path;
      html = '<div class="calc-detail-title">Path 2 mechanics — HELOC against home, buy bitcoin, retain rental</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>HELOC draw available</span><strong>' + fmtMoneyFull(r2.helocDraw) + '</strong></div>' +
        '<div><span>Annual interest carry</span><strong>' + fmtMoneyFull(r2.annualCarry) + '/yr</strong></div>' +
        '<div><span>Cumulative carry (' + s.holdingYears + ' yrs)</span><strong>' + fmtMoneyFull(r2.cumulativeCarry) + '</strong></div>' +
        '<div><span>Bitcoin position FV (' + scenarioLabel(s.btcScenario) + ')</span><strong>' + fmtMoneyFull(r2.btcFV) + '</strong></div>' +
        '<div class="calc-detail-emphasis"><span>Net gain from leveraged bitcoin</span><strong>' + fmtMoneyFull(r2.netGainFromLeverage) + '</strong></div>' +
        '<div><span>+ Retained rental wealth at exit</span><strong>' + fmtMoneyFull(r2.retainedRental.totalWealth) + '</strong></div>' +
        '</div>' +
        '<div class="calc-detail-warn">Caveat: HELOC interest used for bitcoin is not tax-deductible (TCJA). Carry must be serviced from personal income through any bitcoin drawdown.</div>';
    } else if (s.path === 3) {
      var r3 = results.path;
      var soldCount = r3.sold;
      var retainedCount = r3.retained;
      html = '<div class="calc-detail-title">Path 3 mechanics &mdash; sell ' + soldCount + ' of ' + s.numProperties + ' properties, redeploy</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>Sold property value (' + soldCount + ' \u00d7 ' + fmtMoneyFull(s.propertyValue) + ')</span><strong>' + fmtMoneyFull(r3.soldPropertiesValue) + '</strong></div>' +
        '<div><span>Net cash after sale taxes</span><strong>' + fmtMoneyFull(r3.netCashFromSale) + '</strong></div>' +
        '<div><span>Year 1 cash from yield portfolio</span><strong>' + fmtMoneyFull(r3.yieldPortfolio.year1AfterTax) + '</strong></div>' +
        '<div><span>Year 1 cash from ' + retainedCount + ' retained rental' + (retainedCount === 1 ? '' : 's') + '</span><strong>' + fmtMoneyFull(r3.retainedRental.annual.afterTax) + '</strong></div>' +
        '<div class="calc-detail-emphasis"><span>Combined Year 1 cash flow</span><strong>' + fmtMoneyFull(r3.year1CashFlow) + '</strong></div>' +
        '</div>';
    } else {
      var r4 = results.path;
      var yp = r4.yieldPortfolio;
      var p = s.portfolio;
      var nc = r4.netCashDeployed;
      html = '<div class="calc-detail-title">Path 4 mechanics — outright sale, deploy to yield portfolio</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>Net cash to deploy (after sale taxes)</span><strong>' + fmtMoneyFull(nc) + '</strong></div>' +
        '</div>' +
        '<div class="calc-detail-portfolio">' +
        '<div class="calc-detail-portfolio-title">Year 1 distributions by instrument</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>STRC (' + p.strc + '%, ' + fmtMoneyFull(yp.allocations.strc) + ' @ 11.5% ROC)</span><strong>' + fmtMoneyFull(yp.year1Distributions.strc) + '</strong></div>' +
        '<div><span>SATA (' + p.sata + '%, ' + fmtMoneyFull(yp.allocations.sata) + ' @ 13.0% ROC)</span><strong>' + fmtMoneyFull(yp.year1Distributions.sata) + '</strong></div>' +
        '<div><span>Ledn (' + p.ledn + '%, ' + fmtMoneyFull(yp.allocations.ledn) + ' @ 8.0% ord.)</span><strong>' + fmtMoneyFull(yp.year1Distributions.ledn) + '</strong></div>' +
        '<div><span>Spot BTC (' + p.spot + '%, ' + fmtMoneyFull(yp.allocations.spot) + ', no dist.)</span><strong>—</strong></div>' +
        '<div class="calc-detail-emphasis"><span>Year 1 after-tax total</span><strong>' + fmtMoneyFull(yp.year1AfterTax) + '</strong></div>' +
        '<div><span>Spot BTC value at year ' + s.holdingYears + ' (' + scenarioLabel(s.btcScenario) + ')</span><strong>' + fmtMoneyFull(yp.spotFV) + '</strong></div>' +
        '</div></div>';
    }
    el.innerHTML = html;
  }

  function renderCAGRChips(s){
    var scenarios = ['stay', 'trend', 'upper'];
    scenarios.forEach(function(sc){
      var chip = document.querySelector('.calc-cagr-chip[data-scenario="' + sc + '"]');
      if (!chip) return;
      var sCopy = Object.assign({}, s, { btcScenario: sc });
      var r = computeAll(sCopy);
      var delta = r.path.totalWealth - r.keep.totalWealth;

      // Effective CAGR display — derived dynamically from Power Law data
      // and the current holding period, so the number recalibrates as
      // the user drags the holding-period slider or as TODAY_PRICE
      // updates from the live fetch.
      var effCAGRPct = effectiveCAGR(sc, s.holdingYears) * 100;
      var rateEl = chip.querySelector('.calc-cagr-chip-rate');
      if (rateEl) rateEl.textContent = '~' + effCAGRPct.toFixed(0) + '% CAGR';

      var deltaEl = chip.querySelector('.calc-cagr-chip-delta');
      if (!deltaEl) {
        deltaEl = document.createElement('span');
        deltaEl.className = 'calc-cagr-chip-delta';
        chip.appendChild(deltaEl);
      }
      deltaEl.textContent = (delta > 0 ? '+' : '') + fmtMoney(delta);
      deltaEl.style.color = delta > 0 ? 'var(--green)' : '#e07a6d';
      chip.classList.toggle('active', sc === s.btcScenario);

      // Chip tooltip — populates the .tip-content span inside the chip's
      // own .help-tip. Re-runs every rerender so 'stay' picks up the
      // current multiple's bull/bear/neutral framing.
      var chipTipEl = chip.querySelector('.calc-chip-help .tip-content');
      if (chipTipEl) chipTipEl.innerHTML = scenarioTipHTML(sc);
    });

    // Update the current-multiple readout above the chips if present
    var mEl = document.getElementById('calc-current-multiple');
    if (mEl) {
      var mult = currentBTCMultiple();
      mEl.textContent = mult.toFixed(2) + '\u00d7 trend';
    }
  }

  function bindCAGRChips(){
    // Scenario code → dataset index in the chart (and in legendVisibility)
    var SCENARIO_IDX = { stay: 1, trend: 2, upper: 3 };

    document.querySelectorAll('.calc-cagr-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        var newScenario = chip.dataset.scenario;
        var oldScenario = state.btcScenario;
        if (newScenario === oldScenario) return;

        // Auto-swap visibility: hide the previously-primary scenario,
        // show the newly-selected. Other scenarios retain their manual
        // toggle state — so a user who turned 'Stay' on for comparison
        // keeps it on when switching primary from Trend to Upper.
        if (SCENARIO_IDX[oldScenario] !== undefined) {
          legendVisibility[SCENARIO_IDX[oldScenario]] = false;
        }
        legendVisibility[SCENARIO_IDX[newScenario]] = true;

        state.btcScenario = newScenario;
        rerender();
      });
    });

    // Stop chip help-tip clicks from bubbling to the chip button.
    // Without this, clicking the ? glyph would toggle the chip selection.
    document.querySelectorAll('.calc-cagr-chip .calc-chip-help').forEach(function(help){
      help.addEventListener('click', function(e){ e.stopPropagation(); });
      help.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
      });
    });
  }

  function bindZoomToggle(){
    document.querySelectorAll('.calc-chart-zoom-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        chartZoom = btn.dataset.zoom;
        document.querySelectorAll('.calc-chart-zoom-btn').forEach(function(b){
          b.classList.toggle('active', b.dataset.zoom === chartZoom);
          b.setAttribute('aria-selected', b.dataset.zoom === chartZoom ? 'true' : 'false');
        });
        // Force chart rebuild so Chart.js recomputes axis scales for
        // the new data range. update('resize') alone keeps the prior
        // y-axis max baked in, which defeats the purpose of zoom.
        if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
        renderChart(state);
      });
    });
  }

  // Path 3 derived display — the sold count + property-value reminder.
  // Called every rerender so it stays in sync with the two sliders
  // (numProperties and propertiesRetained) controlling the partial-sale
  // composition. The total and retained values are already visible
  // on the sliders themselves; this surfaces the implicit "sold" count
  // so the user sees the full breakdown at a glance.
  function renderPath3Derived(s){
    var soldEl = document.getElementById('calc-path3-sold-count');
    if (!soldEl) return;
    var sold = Math.max(0, s.numProperties - s.propertiesRetained);
    soldEl.textContent = sold + ' propert' + (sold === 1 ? 'y' : 'ies');
  }

  function renderSpecificCallout(s){
    var el = document.getElementById('calc-specific-callout');
    if (!el) return;
    var stateName = s.stateCode === 'OTHER' ? 'your state' : s.stateCode;
    var stateRate = STATE_CAPGAIN[s.stateCode] !== undefined ? STATE_CAPGAIN[s.stateCode] : STATE_CAPGAIN.OTHER;
    var brktLabel = s.federalBracketPct + '% federal bracket';
    var pathSpecific = '';
    if (s.path === 2) pathSpecific = ' Your HELOC rate, CLTV, and qualification depend on your specific lender — the ' + s.helocRatePct + '% rate above is representative, not a quote.';
    if (s.path === 1 || s.path === 4) pathSpecific = ' The depreciation recapture and capital gains math above assumes a single transaction; consult a CPA before acting.';

    el.innerHTML =
      '<strong>Where this gets specific to you:</strong> Tax math is based on ' + stateName +
      ' (' + stateRate.toFixed(1) + '% state capital-gains rate) and ' + brktLabel + '.' +
      pathSpecific +
      ' This calculator is decision framing, not personalized financial, tax, or legal advice.';
  }

  function rerender(){
    var results = computeAll(state);
    renderPathDescription();
    renderHeadline(results, state);
    renderComparison(results, state);
    renderPathDetail(results, state);
    renderPath3Derived(state);
    renderCAGRChips(state);
    renderChart(state);
    renderChartLegend();  // re-render so Stay tooltip stays accurate as multiple/inputs shift
    renderSpecificCallout(state);
  }

  // ─── Slider/control binding ───
  function bindSlider(id, key, formatter, parser, post){
    var slider = document.getElementById(id);
    var valEl = document.getElementById('val-' + id.replace('calc-', ''));
    if (!slider) return;
    function updateLabel(){ if (valEl) valEl.textContent = formatter(state[key]); }
    slider.addEventListener('input', function(){
      state[key] = parser ? parser(slider.value) : Number(slider.value);
      if (post) post();
      updateLabel();
      rerender();
    });
    updateLabel();
  }

  function bindSelect(id, key, post){
    var sel = document.getElementById(id);
    if (!sel) return;
    sel.addEventListener('change', function(){
      var v = sel.value;
      state[key] = isNaN(Number(v)) ? v : Number(v);
      if (post) post();
      rerender();
    });
  }

  function updatePerPropertyHint(){
    var hint = document.querySelector('.calc-perprop-hint');
    if (hint) hint.style.display = state.path === 3 ? 'inline' : 'none';
  }

  function bindPathToggle(){
    document.querySelectorAll('.calc-path-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        state.path = Number(btn.dataset.path);
        document.querySelectorAll('.calc-path-btn').forEach(function(b){
          b.classList.toggle('active', Number(b.dataset.path) === state.path);
        });
        // Show path-specific input groups
        document.querySelectorAll('.calc-path-specific').forEach(function(grp){
          grp.style.display = grp.dataset.forPath.split(',').indexOf(String(state.path)) >= 0 ? '' : 'none';
        });
        updatePerPropertyHint();  // "(per property)" only when Path 3 is active
        rerender();
      });
    });
  }

  function bindPortfolioSliders(){
    // Portfolio composition sliders — must sum to 100
    var keys = ['strc', 'sata', 'ledn', 'spot'];
    keys.forEach(function(k){
      var sld = document.getElementById('calc-port-' + k);
      var val = document.getElementById('val-port-' + k);
      if (!sld) return;
      sld.addEventListener('input', function(){
        state.portfolio[k] = Number(sld.value);
        if (val) val.textContent = state.portfolio[k] + '%';
        // Auto-balance: don't enforce sum-to-100, just show total
        var total = keys.reduce(function(s, key){ return s + state.portfolio[key]; }, 0);
        var tEl = document.getElementById('calc-port-total');
        if (tEl) {
          tEl.textContent = total + '%';
          tEl.style.color = total === 100 ? 'var(--green)' : '#e07a6d';
        }
        rerender();
      });
    });
  }

  function initCalc(){
    if (!document.getElementById('calc-headline')) return;

    // Initialize all sliders/selects
    bindSlider('calc-property-value', 'propertyValue',
      function(v){ return fmtMoneyFull(v); });
    bindSlider('calc-net-yield', 'netRentalYield',
      function(v){ return v.toFixed(1) + '%'; });
    bindSlider('calc-holding-years', 'holdingYears',
      function(v){ return v + ' yrs'; });
    bindSlider('calc-adjusted-basis', 'adjustedBasisPct',
      function(v){ return v + '%'; });
    bindSlider('calc-years-held', 'yearsAlreadyHeld',
      function(v){ return v + ' yrs'; });
    bindSelect('calc-state', 'stateCode');
    bindSelect('calc-bracket', 'federalBracketPct');

    // Path 2 sliders
    bindSlider('calc-heloc-ltv', 'helocLtv',
      function(v){ return v + '%'; });
    bindSlider('calc-heloc-rate', 'helocRatePct',
      function(v){ return v.toFixed(1) + '%'; });
    bindSlider('calc-existing-mortgage', 'existingMortgage',
      function(v){ return fmtMoneyFull(v); });

    // Path 3 sliders — coupled: numProperties drives propertiesRetained's max,
    // and we clamp propertiesRetained if numProperties is dragged below it.
    bindSlider('calc-num-properties', 'numProperties',
      function(v){ return v + ' propert' + (v === 1 ? 'y' : 'ies'); },
      null,
      function(){
        var retainedSlider = document.getElementById('calc-properties-retained');
        if (!retainedSlider) return;
        var newMax = state.numProperties - 1;
        retainedSlider.max = String(newMax);
        if (state.propertiesRetained > newMax) {
          state.propertiesRetained = newMax;
          retainedSlider.value = String(newMax);
          var lbl = document.getElementById('val-properties-retained');
          if (lbl) lbl.textContent = newMax + ' retained';
        }
      });
    bindSlider('calc-properties-retained', 'propertiesRetained',
      function(v){ return v + ' retained'; });

    bindPortfolioSliders();
    bindPathToggle();
    bindCAGRChips();
    bindZoomToggle();

    // Initial: show path-4 group, hide others
    document.querySelectorAll('.calc-path-specific').forEach(function(grp){
      grp.style.display = grp.dataset.forPath.split(',').indexOf(String(state.path)) >= 0 ? '' : 'none';
    });

    // Render everything EXCEPT the chart. The chart waits for the
    // calculator tab to activate (STYLE_GUIDE §6.14 — Chart.js charts
    // initialized inside a display:none container suffer stale layout
    // cache). The headline / table / chips / detail / callout all
    // render fine in the hidden tab.
    var results = computeAll(state);
    renderPathDescription();
    renderHeadline(results, state);
    renderComparison(results, state);
    renderPathDetail(results, state);
    renderPath3Derived(state);
    renderCAGRChips(state);
    renderSpecificCallout(state);
    renderChartLegend();  // static legend markup; toggle handlers persist
    updatePerPropertyHint();  // initial visibility (default path is 4, so hidden)

    // Hook into tab activation: build / refresh the chart only when the
    // calculator tab becomes visible.
    window.addEventListener('bvrp:tab-activated', function(e){
      if (e.detail && e.detail.tabId === 'calculator') {
        // Defer one frame so the panel's display:block has taken effect
        // and the canvas has real dimensions before Chart.js measures it.
        setTimeout(function(){ renderChart(state); }, 16);
      }
    });

    // Edge case: page loaded with #calculator in URL — calculator tab
    // is already active on initial render. Detect that and build the
    // chart immediately (one tick out, after layout settles).
    var calcPanel = document.getElementById('panel-calculator');
    if (calcPanel && calcPanel.classList.contains('active')) {
      setTimeout(function(){ renderChart(state); }, 16);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalc);
  } else {
    initCalc();
  }
})();

// ─── Tab navigation ───────────────────────────────────────────────────
// Four-tab structure (Reality / Bitcoin Case / Four Paths / Calculator)
// adopted to break the page's sustained argument into cognitively-grouped
// chunks. Mirrors the BvRE convention: data-tab on buttons, panel-{id}
// on the panels, hash-based deep linking.
//
// Calculator state and entry-timing indicator state persist across tab
// switches (their state lives in their respective IIFEs above; the tab
// JS only toggles visibility classes).

(function bvrpTabs(){
  'use strict';

  var TAB_IDS = ['reality', 'bitcoin', 'paths', 'calculator'];

  function activateTab(tabId){
    if (TAB_IDS.indexOf(tabId) === -1) tabId = 'reality';
    document.querySelectorAll('.tab-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach(function(p){
      var match = p.id === 'panel-' + tabId;
      p.classList.toggle('active', match);
      p.classList.toggle('js-hidden', !match);
    });
    // Scroll the tab nav into view if user clicked something deep on the page
    // to make the tab change feel grounded. Skip on initial load.
    if (document.readyState === 'complete') {
      var nav = document.querySelector('.tab-nav');
      if (nav) {
        var rect = nav.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight) {
          nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
    // Notify any per-panel initializers that this tab is now visible.
    // Consumed by the calculator IIFE to lazy-init Chart.js (avoids the
    // hidden-tab layout-cache bug — STYLE_GUIDE §6.14).
    window.dispatchEvent(new CustomEvent('bvrp:tab-activated', {
      detail: { tabId: tabId }
    }));
  }

  function initTabFromHash(){
    var hash = (window.location.hash || '').replace(/^#/, '');
    if (TAB_IDS.indexOf(hash) !== -1) {
      activateTab(hash);
    }
    // else: default to Reality (already active in initial HTML)
  }

  function init(){
    document.querySelectorAll('.tab-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var tabId = btn.dataset.tab;
        activateTab(tabId);
        // Update URL hash without scrolling
        if (history.replaceState) {
          history.replaceState(null, '', '#' + tabId);
        }
      });
    });
    window.addEventListener('hashchange', initTabFromHash);
    initTabFromHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
