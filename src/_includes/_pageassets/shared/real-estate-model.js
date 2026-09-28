/* ============================================================
   RealEstateModel — shared engine for the real-estate pair
   ============================================================
   /bitcoin-vs-real-estate (BvRE, the tenant's side) and
   /bitcoin-vs-rental-property (BvRP, the landlord's side).
   REAL_ESTATE_PAIR_DESIGN.md §6; PR 3 (refactor, byte-identical).

   Plain script, concatenated via each page's page_scripts; exposes
   window.RealEstateModel. Pure functions, no DOM. Depends on
   shared/power-law-data.js (plPrice, PL_FLOOR, PL_CEIL, GENESIS_TS,
   PL_DATA, TODAY_PRICE — read at call time) and, for BvRE's
   projection, shared/calculator-helpers.js (window.CalcHelpers).

   PR 3 MOVES code; it does not rewrite logic. Where the pages
   behaved differently, both behaviours are kept behind explicit
   parameters (e.g. mortgagePayment's zero-rate guard). Known issues
   are moved as-is and fixed in later PRs (Phase 0 report §d):
   BvRP recapture at a flat 25%, depreciation from today's value,
   no state tax on rental income, ROC untaxed for the whole hold.
   Harmonisation (one scenario set, nominal house path, costs) is
   PR 4; tax regimes PR 5; the ledger is rendered in PR 6.

   Byte-identity harness: shared/real-estate-qa.js → rePairQA(),
   loaded only with ?qa in the URL (shared/real-estate-qa-loader.js).
   ============================================================ */
(function(){
  'use strict';

  // ─── Pair defaults: sourced, dated (PR 4b; rulings M4, M6, §7) ────────
  // One place for the figures both pages default to. Sources, method and
  // next-due dates: DATA_AUDIT RE-6..RE-13; REAL_ESTATE_PAIR_PR4_SOURCES.md.
  var PAIR_DEFAULTS = {
    // 2025 average of FRED MSPUS ($415,400): the median price of NEW
    // houses sold (Census/HUD), rounded. Latest full year, as M1.
    homePrice: 415000,
    // Zillow, US: ZHVI (typical value, middle tier) ÷ (12 × ZORI, all
    // homes), August 2026. Default rent = price ÷ (12 × this). Semiannual.
    priceToRent: 15.77,
    priceToRentAsOf: 'August 2026',
    // LodeStar, calendar-2025 purchases (report 27 Apr 2026): $4,528, or
    // 1.04% of price, INCLUDING recording fees and transfer taxes.
    closingPct: 1.04,
    // ATTOM: effective tax rate on single-family homes, 2025.
    propTaxPct: 0.90,
    // NerdWallet analysis of Quadrant Information Services rates, 6 May
    // 2026: about $2,490 a year for $400,000 of dwelling coverage. The
    // default scales it to the home's price and grows it with the value.
    insurancePer400K: 2490,
    // Rule of thumb, no primary: 1% of current value a year.
    maintPct: 1.0,
    // 5.6% commission (Clever's 2026 agent surveys: 5.70% in March, 5.46%
    // in August; midpoint) + 1% seller closing costs (an estimate: no
    // national primary; state transfer taxes dominate). Both pages.
    sellPct: 6.6,
    // Spread and fees on each bitcoin purchase and sale: a stated
    // estimate, so one side isn't charged and the other free (M6).
    btcTxPct: 0.5
  };

  // ═══════════════════════════════════════════════════════════════════
  // BvRP — /bitcoin-vs-rental-property
  // Moved verbatim from bitcoin-vs-rental-property.js (PR 3). The page
  // keeps its `state` object and renderers and calls these by the same
  // names through local aliases.
  // ═══════════════════════════════════════════════════════════════════

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

    // 365.25-day years, as on BvRE (M10, PR 4a; was 365).
    var futureTrend = plPrice(todayDays + t * 365.25);
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
      strc: alloc.strc * 0.12,    // ROC; STRC rate 12.00% per 8-K 2026-09-01 (DATA_AUDIT BvRP-5)
      sata: alloc.sata * 0.130,   // ROC
      ledn: alloc.ledn * 0.05,    // ordinary; Ledn USDC Growth Account 5.00% tier (DATA_AUDIT BvRP-18)
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

  // ─── Year-by-year wealth trajectories (for the chart) ───
  function calcYieldPortfolioAtYearT(amount, s, t, scenarioOverride){
    var p = s.portfolio;
    var allocs = {
      strc: amount * p.strc/100,
      sata: amount * p.sata/100,
      ledn: amount * p.ledn/100,
      spot: amount * p.spot/100
    };
    var strcDist = allocs.strc * 0.12;   // keep in step with calcYieldPortfolio
    var sataDist = allocs.sata * 0.13;
    var lednDist = allocs.ledn * 0.05;   // keep in step with calcYieldPortfolio
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

  // ═══════════════════════════════════════════════════════════════════
  // BvRE — /bitcoin-vs-real-estate
  // Moved from bitcoin-vs-real-estate.js (PR 3, 2026-09-27). Every
  // expression keeps its original operand order so outputs stay
  // byte-identical; page code keeps parsing, formatting and rendering.
  // ═══════════════════════════════════════════════════════════════════

  // Mortgage payment. The page had three copies that differ only in the
  // zero-rate guard, so the guard is an explicit parameter:
  //   'eq0'  — monthlyPayment() (re.js): mr===0 → p/n
  //   'le0'  — runFwdCalc inline:        mr>0 ? formula : p/n
  //   'none' — mp() in the houses visual: formula only
  function mortgagePayment(p, r, y, guard){
    var mr = r/100/12, n = y*12;
    if (guard === 'le0') return mr > 0 ? p * (mr * Math.pow(1+mr, n)) / (Math.pow(1+mr, n) - 1) : p / n;
    if (guard === 'eq0' && mr === 0) return p/n;
    return p*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1);
  }

  // Remaining balance after `months` payments at monthly rate `mr`
  // (caller computes mr exactly as before and applies any clamp/round).
  function amortizeBalance(principal, mr, months, payment){
    var bal = principal;
    for (var i = 0; i < months; i++) bal = bal*(1+mr) - payment;
    return bal;
  }

  // Retrospective ("Postponed Purchase") — was the math inside
  // runCalculator(). Inputs are already parsed by the page.
  //   i: { sy, ey, mode:'cash'|'leverage', dca, hs, he, bs, be, rate,
  //        dpf, rentOverride (number|null), btcData }
  // ey is the end point. Today it is the fixed 2025 the page passes; P8
  // (design §9) will pass today, so nothing here assumes a year.
  function bvreRetro(i){
    var sy = i.sy, ey = i.ey, hs = i.hs, he = i.he, bs = i.bs, be = i.be,
        rate = i.rate, dpf = i.dpf, mode = i.mode, btcData = i.btcData;
    var o = {};
    var yrs = ey - sy;
    var dp = mode==='cash'?hs:Math.round(hs*dpf);
    var bb = dp/bs;
    var lumpValue = bb*be;
    var mortgageMonthly = mortgagePayment(hs*(1-dpf),rate,30,'eq0');
    var _defaultRent = Math.round(mortgageMonthly*0.75);
    var estRent = (i.rentOverride !== null && i.rentOverride !== undefined) ? Math.round(i.rentOverride) : _defaultRent;
    var totalRentPaid = estRent*yrs*12;
    var lumpNet = lumpValue-totalRentPaid;
    var lumpHouses = lumpNet/he;
    o.yrs = yrs; o.dp = dp; o.bb = bb; o.lumpValue = lumpValue;
    o.lumpReturn = ((lumpValue-dp)/dp*100).toFixed(0);
    o.mortgageMonthly = mortgageMonthly; o._defaultRent = _defaultRent; o.estRent = estRent;
    o.totalRentPaid = totalRentPaid; o.lumpNet = lumpNet; o.lumpHouses = lumpHouses;

    // House side
    var houseEquity=0,monthlyMortgage=0,houseTotalSpent=0,remainingBal=0,equityPct=0,debtFreeYear=sy+30;
    if(mode==='cash'){
      o.ha=((he-hs)/hs*100).toFixed(1);
      houseEquity=he;houseTotalSpent=hs;remainingBal=0;equityPct=100;debtFreeYear=sy;
      monthlyMortgage=mortgageMonthly;
    }else{
      var la=hs*(1-dpf);monthlyMortgage=mortgagePayment(la,rate,30,'eq0');
      var mps=yrs*12;var r=rate/100/12;
      var bal=amortizeBalance(la,r,mps,monthlyMortgage);bal=Math.max(0,bal);
      remainingBal=bal;houseEquity=he-bal;equityPct=Math.round((houseEquity/he)*100);debtFreeYear=sy+30;
      var pt=hs*0.012*yrs,ins=150*mps,mnt=hs*0.01*yrs;
      houseTotalSpent=(monthlyMortgage*mps)+dp+pt+ins+mnt;
      o.interestMain=Math.round((monthlyMortgage*mps)-(la-bal));
      o.bal=bal;
    }
    o.houseEquity=houseEquity;o.monthlyMortgage=monthlyMortgage;o.houseTotalSpent=houseTotalSpent;
    o.remainingBal=remainingBal;o.equityPct=equityPct;o.debtFreeYear=debtFreeYear;

    // "Go deeper" DCA (computed whether or not the page shows it)
    var monthlySavings=Math.round(mortgageMonthly-estRent);
    var dcaBtc=0,dcaTotalInvested=0;
    for(var yr=sy;yr<ey;yr++){
      var ybp=btcData[yr]||btcData[ey];
      dcaBtc+=(monthlySavings/ybp)*12;
      dcaTotalInvested+=monthlySavings*12;
    }
    var dcaValue=dcaBtc*be;
    var totalBtc=bb+dcaBtc;
    var totalBtcValue=totalBtc*be;
    var totalBtcNet=totalBtcValue-totalRentPaid;
    var totalHouses=totalBtcNet/he;
    var totalInvested=dp+dcaTotalInvested;
    var principalRepaid=(hs*(1-dpf))-remainingBal;
    o.monthlySavings=monthlySavings;o.dcaBtc=dcaBtc;o.dcaTotalInvested=dcaTotalInvested;
    o.dcaValue=dcaValue;o.totalBtc=totalBtc;o.totalBtcValue=totalBtcValue;o.totalBtcNet=totalBtcNet;
    o.totalHouses=totalHouses;o.extraHouses=totalHouses-1;o.totalInvested=totalInvested;
    // Years from the end point to debt-free (was the literal 2025; ey is
    // 2025 today, so the output is unchanged).
    o.yrsRemaining=debtFreeYear-ey;
    o.principalRepaid=principalRepaid;
    o.interestPaid=Math.round((mortgageMonthly*yrs*12)-principalRepaid);
    o.houseOutflow=Math.round(houseTotalSpent);
    o.btcOutflow=Math.round(totalInvested+totalRentPaid);
    return o;
  }

  // ─── BvRE projection: equal cash out (PR 4b) ─────────────────────────
  // Rulings M2 (equal cash out; replaces the "Go deeper" DCA and the
  // cash-mode S&P leg), M4 (market rent), M5 (rent path), M6 (costs), on
  // PR 4a's nominal frame and single horizon (M1, M10).
  //
  // Both households spend the same every month:
  //  - At purchase the buyer pays the down payment (or the whole price)
  //    plus closing costs; the renter puts the same sum into bitcoin.
  //  - Each month the owner pays P&I + property tax + insurance +
  //    maintenance. The renter pays rent and, with "invests the
  //    difference" on, buys bitcoin with (owner's cost − rent), or sells
  //    bitcoin to cover rent when rent costs more. Off: only the upfront
  //    sum is invested; monthly differences are spent or paid from income.
  //  - Rent starts at market (price ÷ 12 ÷ price-to-rent) unless given,
  //    and steps up once a year at the rent-growth rate (default: home
  //    appreciation, i.e. a constant price-to-rent). Property tax,
  //    insurance and maintenance follow the home's value, stepping once a
  //    year in the same way.
  //  - Bitcoin's price each month follows the scenario's path: its
  //    multiple of the Power Law trend moves in a straight line from
  //    today's multiple to the scenario's target at the horizon end
  //    (floor 0.42×, trend 1×, upper 3×), times the trend on that day. The
  //    end price is the one PR 4a used. Purchases and sales pay the bitcoin
  //    transaction cost.
  //  - At the end, If sold (before tax, which is PR 5): house value −
  //    selling costs − loan balance; bitcoin value − the transaction cost.
  //    Held: before those costs. Real = nominal ÷ (1 + inflation)^years for
  //    every end value, one factor for both paths.
  //   i: { method 'mortgage'|'cash', scenario 'floor'|'trend'|'upper',
  //        horizonYrs, btcNow, homePrice, homeApprNominal, inflRate,
  //        mortRate, dpf, rent (month-1 $/mo | null), rentGrowth (% | null),
  //        closingPct, propTaxPct, insurance ($/yr in year 1 | null),
  //        maintPct, sellPct, btcTxPct, investDiff (bool) }
  //   Returns end values (nominal and real), the year-1 and final monthly
  //   figures the cards quote, totals, and one row per year (the ledger
  //   PR 6 renders; cumulative cash out equal on both sides by
  //   construction while the difference is invested).
  function bvreProjection(i){
    var D = PAIR_DEFAULTS;
    var method = i.method, horizonYrs = i.horizonYrs, btcNow = i.btcNow, homePrice = i.homePrice;
    var n = Math.round(horizonYrs * 12);
    var g = i.homeApprNominal / 100;
    var rg = ((i.rentGrowth === null || i.rentGrowth === undefined) ? i.homeApprNominal : i.rentGrowth) / 100;
    var tx = i.btcTxPct / 100;
    var invest = i.investDiff !== false;
    var defl = Math.pow(1 + i.inflRate / 100, horizonYrs);
    function toReal(v){ return v / defl; }

    var cash = method === 'cash';
    var loan = cash ? 0 : homePrice * (1 - i.dpf);
    var down = cash ? homePrice : homePrice * i.dpf;
    var closing = homePrice * i.closingPct / 100;
    var upfront = down + closing;
    var mr = i.mortRate / 100 / 12;
    var pi = loan > 0 ? mortgagePayment(loan, i.mortRate, 30, 'le0') : 0;
    var rentDefault = homePrice / (12 * D.priceToRent);
    var rent0 = (i.rent === null || i.rent === undefined) ? rentDefault : i.rent;
    var insDefault = D.insurancePer400K * homePrice / 400000;
    var ins0 = (i.insurance === null || i.insurance === undefined) ? insDefault : i.insurance;

    // Bitcoin's monthly price path (see header).
    var d0 = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var mult0 = btcNow / plPrice(d0);
    var target = i.scenario === 'floor' ? PL_FLOOR : (i.scenario === 'upper' ? PL_CEIL : 1.0);
    function priceAt(m){ return (mult0 + (target - mult0) * (m / n)) * plPrice(d0 + (m / 12) * 365.25); }

    var btcUpfront = upfront * (1 - tx) / btcNow;
    var btc = btcUpfront;
    var bal = loan;
    var t = { interest: 0, principal: 0, tax: 0, ins: 0, maint: 0, owner: 0, rent: 0,
              invested: 0, sold: 0, shortfall: 0, spent: 0, fromIncome: 0 };
    var cumOwner = upfront, cumRenter = upfront;
    var rows = [], yr = null, first = null, last = null;
    for (var m = 1; m <= n; m++) {
      var k = Math.floor((m - 1) / 12);
      if (!yr) yr = { year: k + 1, interest: 0, principal: 0, tax: 0, ins: 0, maint: 0, owner: 0, rent: 0,
                      btcBoughtUsd: 0, btcSoldUsd: 0, btcBought: 0, btcSold: 0, shortfall: 0 };
      var vk = homePrice * Math.pow(1 + g, k);
      var interest = 0, principal = 0;
      if (bal > 0) {
        interest = bal * mr;
        principal = Math.min(pi - interest, bal);
        bal -= principal;
        if (bal < 1e-6) bal = 0;
      }
      var tax = vk * i.propTaxPct / 100 / 12;
      var ins = ins0 * Math.pow(1 + g, k) / 12;
      var maint = vk * i.maintPct / 100 / 12;
      var owner = interest + principal + tax + ins + maint;
      var rent = rent0 * Math.pow(1 + rg, k);
      var diff = owner - rent;
      if (m === 1) first = { owner: owner, pi: interest + principal, tax: tax, ins: ins, maint: maint, rent: rent, diff: diff };
      if (m === n) last = { owner: owner, rent: rent, diff: diff };
      var price = priceAt(m);
      var sf = 0;
      if (invest) {
        if (diff > 0) {
          var b = diff * (1 - tx) / price;
          btc += b; t.invested += diff; yr.btcBoughtUsd += diff; yr.btcBought += b;
        } else if (diff < 0) {
          var need = -diff, sell = need / (price * (1 - tx));
          if (sell <= btc) { btc -= sell; t.sold += need; yr.btcSoldUsd += need; yr.btcSold += sell; }
          else {
            var cover = btc * price * (1 - tx);
            t.sold += cover; yr.btcSoldUsd += cover; yr.btcSold += btc;
            sf = need - cover; btc = 0;
          }
        }
      } else if (diff > 0) {
        t.spent += diff;
      } else {
        t.fromIncome += -diff;
      }
      t.shortfall += sf; yr.shortfall += sf;
      t.interest += interest; t.principal += principal; t.tax += tax; t.ins += ins; t.maint += maint;
      t.owner += owner; t.rent += rent;
      yr.interest += interest; yr.principal += principal; yr.tax += tax; yr.ins += ins; yr.maint += maint;
      yr.owner += owner; yr.rent += rent;
      cumOwner += owner;
      cumRenter += invest ? (owner + sf) : rent;
      if (m % 12 === 0 || m === n) {
        yr.months = m; yr.homeValue = homePrice * Math.pow(1 + g, m / 12); yr.balance = bal;
        yr.equity = yr.homeValue - bal; yr.btcPrice = price; yr.btcHeld = btc; yr.btcValue = btc * price;
        yr.cumCashOutOwner = cumOwner; yr.cumCashOutRenter = cumRenter;
        rows.push(yr); yr = null;
      }
    }

    var o = {};
    var homeEnd = homePrice * Math.pow(1 + g, horizonYrs);
    var sellCosts = homeEnd * i.sellPct / 100;
    var houseHeld = homeEnd - bal;
    var houseIfSold = homeEnd - sellCosts - bal;
    var priceEnd = priceAt(n);
    var btcValue = btc * priceEnd;
    var btcSaleCost = btcValue * tx;
    var btcIfSold = btcValue - btcSaleCost;
    var futureTrend = plPrice(d0 + horizonYrs * 365.25);

    o.nowMs = Date.now(); o.endDateMs = o.nowMs + horizonYrs * 365.25 * 86400000;
    o.months = n; o.investDiff = invest; o.method = method;
    o.homeApprNominalPct = i.homeApprNominal;
    o.homeApprRealPct = ((1 + g) / (1 + i.inflRate / 100) - 1) * 100;
    o.rentGrowthPct = rg * 100; o.rentDefault = rentDefault; o.insuranceDefault = insDefault;
    o.priceToRent = D.priceToRent;
    o.down = down; o.closing = closing; o.upfront = upfront; o.loan = loan; o.monthlyPI = pi;
    o.first = first; o.last = last;
    o.btcNow = btcNow; o.mult0 = mult0; o.targetMult = target;
    o.btcUpfront = btcUpfront; o.btcHeld = btc; o.priceEnd = priceEnd;
    o.futureTrend = futureTrend; o.futureFloor = futureTrend * PL_FLOOR; o.futureCeil = futureTrend * PL_CEIL;
    o.btcValue = btcValue; o.btcSaleCost = btcSaleCost; o.btcIfSold = btcIfSold;
    o.homeEnd = homeEnd; o.balance = bal; o.sellCosts = sellCosts; o.houseHeld = houseHeld; o.houseIfSold = houseIfSold;
    o.equityPct = homeEnd > 0 ? Math.round((houseHeld / homeEnd) * 100) : 0;
    o.real = {
      btcValue: toReal(btcValue), btcIfSold: toReal(btcIfSold), btcSaleCost: toReal(btcSaleCost), priceEnd: toReal(priceEnd),
      homeEnd: toReal(homeEnd), sellCosts: toReal(sellCosts), balance: toReal(bal),
      houseHeld: toReal(houseHeld), houseIfSold: toReal(houseIfSold)
    };
    o.deflator = defl;
    o.housesCanBuy = homeEnd > 0 ? Math.max(0, btcIfSold / homeEnd) : 0;
    o.totals = t;
    o.cumCashOutOwner = cumOwner; o.cumCashOutRenter = cumRenter;
    o.rows = rows;
    return o;
  }

  // ─── Ledger (PR 3: built, not rendered; PR 6 renders it) ──────────
  // Year-by-year rows from the same computations the cards use. The end
  // point is a parameter so P8 can run the retrospective to today:
  //   opts.end = { year, months }  — months past Jan 1 of `year` (0–11).
  //   When months > 0 a final partial row labelled "to date" is added.
  //   opts.btcPriceAt(y) / opts.homeValueAt(y) — price lookups for each
  //   row (default: the annual series and the custom-price scaling the
  //   page already applies). P8 passes live values for the "to date" row.
  // Rows for full years up to end.year reproduce the card figures at
  // that year exactly (asserted by rePairQA).
  function ledgerRetro(i, opts){
    opts = opts || {};
    var end = opts.end || { year: i.ey, months: 0 };
    var sy = i.sy, hs = i.hs, dpf = i.dpf, mode = i.mode, btcData = i.btcData;
    var btcAt = opts.btcPriceAt || function(y){ return y === i.ey ? i.be : btcData[y]; };
    var homeAt = opts.homeValueAt || function(y){ return y === i.ey ? i.he : (y === sy ? hs : hs * (i.homeData[y] / i.homeData[sy])); };
    var base = bvreRetro(i);
    var la = hs*(1-dpf), r = i.rate/100/12, pmt = base.monthlyMortgage;
    var rows = [];
    function row(label, months, priceBtc, houseValue){
      var yrsN = months/12;
      var bal = mode==='cash' ? 0 : Math.max(0, amortizeBalance(la, r, months, pmt));
      var pmtPaid = mode==='cash' ? 0 : pmt*months;
      var rent = base.estRent*months;
      var dcaBtc = 0, dcaIn = 0;
      for (var m = 0; m < months; m += 12) {
        var yrp = sy + m/12;
        var ybp = btcData[yrp] || btcAt(end.year);
        var inYear = Math.min(12, months - m);
        dcaBtc += (base.monthlySavings/ybp)*inYear;
        dcaIn += base.monthlySavings*inYear;
      }
      return {
        label: label, months: months, years: yrsN,
        house: { value: houseValue, balance: bal, equity: houseValue - bal,
                 principalPaid: mode==='cash' ? 0 : la - bal,
                 interestPaid: mode==='cash' ? 0 : pmtPaid - (la - bal),
                 propertyTax: hs*0.012*yrsN, insurance: 150*months, maintenance: hs*0.01*yrsN,
                 cashOut: mode==='cash' ? hs : (pmtPaid + base.dp + hs*0.012*yrsN + 150*months + hs*0.01*yrsN) },
        btc: { price: priceBtc, lumpBtc: base.bb, dcaBtc: dcaBtc, value: base.bb*priceBtc,
               dcaValue: dcaBtc*priceBtc, rentPaid: rent, dcaInvested: dcaIn,
               net: base.bb*priceBtc - rent, cashOut: base.dp + dcaIn + rent }
      };
    }
    for (var y = sy; y <= end.year; y++) rows.push(row(String(y), (y - sy)*12, btcAt(y), homeAt(y)));
    if (end.months > 0) {
      var mm = (end.year - sy)*12 + end.months;
      rows.push(row('to date', mm, opts.btcPriceAt ? opts.btcPriceAt('to date') : btcAt(end.year),
                    opts.homeValueAt ? opts.homeValueAt('to date') : homeAt(end.year)));
    }
    return { rows: rows, cards: base };
  }

  window.RealEstateModel = {
    // shared primitives
    mortgagePayment: mortgagePayment,
    amortizeBalance: amortizeBalance,
    // BvRE
    bvreRetro: bvreRetro,
    bvreProjection: bvreProjection,
    ledgerRetro: ledgerRetro,
    PAIR_DEFAULTS: PAIR_DEFAULTS,
    // BvRP (original names kept so the page's aliases read 1:1)
    STATE_CAPGAIN: STATE_CAPGAIN,
    STATE_PROP_TAX_RATE: STATE_PROP_TAX_RATE,
    federalLTCG: federalLTCG,
    niitApplies: niitApplies,
    currentBTCMultiple: currentBTCMultiple,
    scenarioGrowthFactor: scenarioGrowthFactor,
    effectiveCAGR: effectiveCAGR,
    calcRentalAnnualCF: calcRentalAnnualCF,
    calcRentalExit: calcRentalExit,
    calcSpotBTCFV: calcSpotBTCFV,
    calcYieldPortfolio: calcYieldPortfolio,
    calcKeepRental: calcKeepRental,
    calcPath1: calcPath1,
    calcPath2: calcPath2,
    calcPath3: calcPath3,
    calcPath4: calcPath4,
    computeAll: computeAll,
    calcYieldPortfolioAtYearT: calcYieldPortfolioAtYearT,
    calcWealthTrajectory: calcWealthTrajectory,
    ledgerRental: function(s, scenarioOverride){ return { rows: calcWealthTrajectory(s, scenarioOverride), cards: computeAll(s) }; }
  };
})();
