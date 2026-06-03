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
    btcScenario: 'median',     // 'conservative', 'median', 'optimistic'
    helocLtv: 80,
    helocRatePct: 9.5,
    existingMortgage: 200000,
    numProperties: 3,
    propertiesToSell: 1,
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

  function btcCAGR(scenario){
    if (scenario === 'conservative') return 0.15;
    if (scenario === 'optimistic') return 0.35;
    return 0.25;  // median
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
  function calcSpotBTCFV(amount, years, scenario){
    return amount * Math.pow(1 + btcCAGR(scenario), years);
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
  function calcKeepRental(s){
    var annual = calcRentalAnnualCF(s);
    var cumulativeCash = annual.afterTax * s.holdingYears;
    var exit = calcRentalExit(s, s.holdingYears);
    var totalWealth = cumulativeCash + exit.netCash;
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
    // Sell propertiesToSell out of numProperties; retain the rest
    var soldFraction = s.propertiesToSell / s.numProperties;
    var retainedFraction = 1 - soldFraction;

    // Per-property economics (assume identical)
    var perPropertyValue = s.propertyValue;  // user enters per-property value
    var soldPropertiesValue = perPropertyValue * s.propertiesToSell;

    // Sale on the sold portion, deploy to yield portfolio
    var sellS = Object.assign({}, s, { propertyValue: soldPropertiesValue });
    var exitNow = calcRentalExit(sellS, 0);
    var netCashFromSale = exitNow.netCash;

    // Deploy to yield portfolio
    var yieldPort = calcYieldPortfolio(netCashFromSale, s);

    // Retained properties keep earning
    var retainedS = Object.assign({}, s, { propertyValue: perPropertyValue * (s.numProperties - s.propertiesToSell) });
    var keep = calcKeepRental(retainedS);

    var totalWealth = yieldPort.totalWealth + keep.totalWealth;
    var year1CF = yieldPort.year1AfterTax + keep.annual.afterTax;
    return {
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
    var keep = calcKeepRental(s);
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
  function renderHeadline(results, s){
    var el = document.getElementById('calc-headline');
    if (!el) return;
    var delta = results.path.totalWealth - results.keep.totalWealth;
    var rentalAnn = results.keep.annual.afterTax;
    var bitcoinAnn = results.path.year1CashFlow;
    var ratio = rentalAnn > 0 ? (bitcoinAnn / rentalAnn) : 0;

    var pathName = ['', 'Outright Sell + Spot Bitcoin',
                    'HELOC + Bitcoin', 'Partial Portfolio Sale + Yield', 'Sell + Yield Portfolio'][s.path];

    var verdict, color;
    if (delta > 0) {
      verdict = '<strong>' + pathName + ' outperforms keeping the rental by ' +
                fmtMoney(delta) + '</strong> over ' + s.holdingYears + ' years';
      if (ratio >= 1.3 && bitcoinAnn > 0) {
        verdict += ', with about <strong>' + ratio.toFixed(1) + '&times;</strong> the annual cash flow';
      }
      verdict += '.';
      color = 'positive';
    } else {
      verdict = '<strong>Keeping the rental produces ' + fmtMoney(-delta) +
                ' more</strong> than ' + pathName + ' under your inputs. The decision is close — try adjusting bitcoin CAGR, holding period, or path.';
      color = 'neutral';
    }
    var hedge = '<span class="calc-headline-hedge">Under a <strong>' + s.btcScenario +
                '</strong> bitcoin CAGR scenario and your specific inputs.</span>';
    el.innerHTML = '<div class="calc-headline-verdict ' + color + '">' + verdict + '</div>' + hedge;
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
      '<tr class="' + winnerClass + '"><td><strong>' + s.holdingYears + '-year total wealth</strong></td>' +
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
        '<div><span>Bitcoin position FV (' + s.btcScenario + ' CAGR)</span><strong>' + fmtMoneyFull(r2.btcFV) + '</strong></div>' +
        '<div class="calc-detail-emphasis"><span>Net gain from leveraged bitcoin</span><strong>' + fmtMoneyFull(r2.netGainFromLeverage) + '</strong></div>' +
        '<div><span>+ Retained rental wealth at exit</span><strong>' + fmtMoneyFull(r2.retainedRental.totalWealth) + '</strong></div>' +
        '</div>' +
        '<div class="calc-detail-warn">Caveat: HELOC interest used for bitcoin is not tax-deductible (TCJA). Carry must be serviced from personal income through any bitcoin drawdown.</div>';
    } else if (s.path === 3) {
      var r3 = results.path;
      html = '<div class="calc-detail-title">Path 3 mechanics — sell ' + s.propertiesToSell + ' of ' + s.numProperties + ' properties, redeploy</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>Sold property value</span><strong>' + fmtMoneyFull(r3.soldPropertiesValue) + '</strong></div>' +
        '<div><span>Net cash after taxes (' + s.propertiesToSell + ' property)</span><strong>' + fmtMoneyFull(r3.netCashFromSale) + '</strong></div>' +
        '<div><span>Year 1 cash from yield portfolio</span><strong>' + fmtMoneyFull(r3.yieldPortfolio.year1AfterTax) + '</strong></div>' +
        '<div><span>Year 1 cash from retained ' + (s.numProperties - s.propertiesToSell) + ' rentals</span><strong>' + fmtMoneyFull(r3.retainedRental.annual.afterTax) + '</strong></div>' +
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
        '<div><span>Spot BTC value at year ' + s.holdingYears + ' (' + s.btcScenario + ' CAGR)</span><strong>' + fmtMoneyFull(yp.spotFV) + '</strong></div>' +
        '</div></div>';
    }
    el.innerHTML = html;
  }

  function renderCAGRBands(s){
    var el = document.getElementById('calc-cagr-bands');
    if (!el) return;
    var scenarios = ['conservative', 'median', 'optimistic'];
    var html = '<div class="calc-cagr-title">Same path under three bitcoin CAGR scenarios</div><div class="calc-cagr-bars">';
    scenarios.forEach(function(sc){
      var sCopy = Object.assign({}, s, { btcScenario: sc });
      var r = computeAll(sCopy);
      var delta = r.path.totalWealth - r.keep.totalWealth;
      var rate = btcCAGR(sc) * 100;
      var winClass = delta > 0 ? 'positive' : 'neutral';
      html += '<div class="calc-cagr-band ' + winClass + ' ' + (sc === s.btcScenario ? 'active' : '') + '" data-scenario="' + sc + '">' +
              '<div class="calc-cagr-label">' + sc.charAt(0).toUpperCase() + sc.slice(1) + ' · ' + rate + '%</div>' +
              '<div class="calc-cagr-delta">' + (delta > 0 ? '+' : '') + fmtMoney(delta) + '</div>' +
              '<div class="calc-cagr-sub">' + (delta > 0 ? 'Bitcoin wins' : 'Rental wins') + ' by this amount</div>' +
              '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
    // Click handlers to switch scenario
    el.querySelectorAll('.calc-cagr-band').forEach(function(band){
      band.addEventListener('click', function(){
        state.btcScenario = band.dataset.scenario;
        var cagrSlider = document.getElementById('calc-btc-scenario');
        if (cagrSlider) cagrSlider.value = ['conservative','median','optimistic'].indexOf(state.btcScenario);
        rerender();
      });
    });
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
    renderHeadline(results, state);
    renderComparison(results, state);
    renderPathDetail(results, state);
    renderCAGRBands(state);
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

    // BTC scenario as 3-position selector
    bindSlider('calc-btc-scenario', 'btcScenario',
      function(v){ return v.charAt(0).toUpperCase() + v.slice(1) + ' (' + Math.round(btcCAGR(v)*100) + '% CAGR)'; },
      function(v){ return ['conservative','median','optimistic'][Number(v)]; });

    // Path 2 sliders
    bindSlider('calc-heloc-ltv', 'helocLtv',
      function(v){ return v + '%'; });
    bindSlider('calc-heloc-rate', 'helocRatePct',
      function(v){ return v.toFixed(1) + '%'; });
    bindSlider('calc-existing-mortgage', 'existingMortgage',
      function(v){ return fmtMoneyFull(v); });

    // Path 3 sliders
    bindSlider('calc-num-properties', 'numProperties',
      function(v){ return v + ' properties'; });
    bindSlider('calc-properties-to-sell', 'propertiesToSell',
      function(v){ return v + ' to sell'; });

    bindPortfolioSliders();
    bindPathToggle();

    // Initial: show path-4 group, hide others
    document.querySelectorAll('.calc-path-specific').forEach(function(grp){
      grp.style.display = grp.dataset.forPath.split(',').indexOf(String(state.path)) >= 0 ? '' : 'none';
    });

    rerender();
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
