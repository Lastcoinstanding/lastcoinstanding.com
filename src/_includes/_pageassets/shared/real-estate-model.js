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

  // Projection DCA — was computeProjectionDca() in re.js, verbatim.
  function projectionDca(method, btcNow, futurePrice, monthlyMort, impliedRent, horizonYrs){
    if(method !== 'mortgage') return null;
    var monthlySavings = Math.max(0, monthlyMort - impliedRent);
    if(monthlySavings <= 0 || btcNow <= 0 || futurePrice <= 0) return null;
    var dcaBtc = 0;
    var totalMonths = horizonYrs * 12;
    for(var m = 0; m < totalMonths; m++){
      var frac = m / totalMonths;
      var monthPrice = btcNow * Math.pow(futurePrice/btcNow, frac);
      dcaBtc += monthlySavings / monthPrice;
    }
    return {
      dcaBtc: dcaBtc,
      dcaInvested: monthlySavings * totalMonths,
      monthlySavings: monthlySavings
    };
  }

  // Projection — was the math inside runFwdCalc() in re.js.
  //   i: { method, scenario, horizonYrs, btcNow, homePrice, homeApprReal,
  //        inflRate, mortRate, dpf, rentOverride (number|null), endYear }
  // Uses plPrice/PL_FLOOR/PL_CEIL (power-law-data.js) and CalcHelpers.
  function bvreProjection(i){
    var o = {};
    var method = i.method, horizonYrs = i.horizonYrs, btcNow = i.btcNow, homePrice = i.homePrice,
        inflRate = i.inflRate, mortRate = i.mortRate, dpf = i.dpf, endYear = i.endYear;
    function toReal(nominalFutureValue) {
      return window.CalcHelpers.deflateToToday(nominalFutureValue, inflRate, horizonYrs);
    }
    var homeApprNominalPct = window.CalcHelpers.realToNominal(i.homeApprReal, inflRate);
    var homeAppr = homeApprNominalPct / 100;
    var amount = (method === 'cash') ? homePrice : homePrice * dpf;
    var loanAmt = homePrice * (1 - dpf);
    var mr = mortRate / 100 / 12;
    var nPayments = 360;
    var monthlyMort = mortgagePayment(loanAmt, mortRate, 30, 'le0');
    var impliedRent = (i.rentOverride !== null && i.rentOverride !== undefined) ? i.rentOverride : (monthlyMort * 0.75);
    var totalRentPaid = impliedRent * 12 * horizonYrs;

    var btcBought = amount / btcNow;
    // M10 (PR 4a): bitcoin runs the same horizon as the house, today +
    // horizonYrs 365.25-day years. It used to stop at 1 Jan of the end year.
    var nowMs = Date.now();
    var futureDays = (nowMs / 1000 - GENESIS_TS) / 86400 + horizonYrs * 365.25;
    var endDateMs = nowMs + horizonYrs * 365.25 * 86400000;
    var futureTrend = plPrice(futureDays);
    var futureFloor = futureTrend * PL_FLOOR;
    var futureCeil = futureTrend * PL_CEIL;
    var futurePrice;
    if(i.scenario === 'floor'){ futurePrice = futureFloor; }
    else if(i.scenario === 'trend'){ futurePrice = futureTrend; }
    else { futurePrice = futureCeil; }

    var btcValue = btcBought * futurePrice;
    var btcNet = btcValue - totalRentPaid;
    var btcValueReal = toReal(btcValue);
    var futurePriceReal = toReal(futurePrice);
    var btcNetReal = btcValueReal - totalRentPaid;
    var btcReturn = ((btcNetReal - amount) / amount * 100).toFixed(0);
    var btcCAGR = btcNetReal > 0 ? ((Math.pow(btcNetReal/amount, 1/horizonYrs) - 1) * 100).toFixed(1) : '—';

    var futureHomeValue = homePrice * Math.pow(1 + homeAppr, horizonYrs);
    var futureHomeValueReal = toReal(futureHomeValue);
    var bal = 0, equity = futureHomeValue, interestPaid = 0, totalMortPaid = 0;
    if(method === 'mortgage'){
      var monthsPaid = horizonYrs * 12;
      bal = amortizeBalance(loanAmt, mr, Math.min(monthsPaid, nPayments), monthlyMort);
      bal = Math.max(0, bal);
      equity = futureHomeValue - bal;
      totalMortPaid = monthlyMort * Math.min(monthsPaid, nPayments);
      interestPaid = totalMortPaid - (loanAmt - bal);
    }
    var equityReal = toReal(equity);
    var propTax = homePrice * 0.012 * horizonYrs;
    var insurance = 150 * 12 * horizonYrs;
    var maintenance = homePrice * 0.01 * horizonYrs;
    var totalHouseCost = amount + totalMortPaid + propTax + insurance + maintenance;
    var housesCanBuy = Math.max(0, btcNetReal / futureHomeValueReal);
    var equityPct = futureHomeValue > 0 ? Math.round((equity / futureHomeValue) * 100) : 0;

    o.homeApprNominalPct = homeApprNominalPct; o.homeAppr = homeAppr; o.amount = amount; o.loanAmt = loanAmt;
    o.mr = mr; o.nPayments = nPayments; o.monthlyMort = monthlyMort; o.impliedRent = impliedRent;
    o.totalRentPaid = totalRentPaid; o.btcBought = btcBought; o.futureDays = futureDays; o.endDateMs = endDateMs;
    o.futureTrend = futureTrend; o.futureFloor = futureFloor; o.futureCeil = futureCeil; o.futurePrice = futurePrice;
    o.btcValue = btcValue; o.btcNet = btcNet; o.btcValueReal = btcValueReal; o.futurePriceReal = futurePriceReal;
    o.btcNetReal = btcNetReal; o.btcReturn = btcReturn; o.btcCAGR = btcCAGR;
    o.futureHomeValue = futureHomeValue; o.futureHomeValueReal = futureHomeValueReal;
    o.bal = bal; o.equity = equity; o.interestPaid = interestPaid; o.totalMortPaid = totalMortPaid;
    o.equityReal = equityReal; o.propTax = propTax; o.insurance = insurance; o.maintenance = maintenance;
    o.totalHouseCost = totalHouseCost; o.housesCanBuy = housesCanBuy; o.equityPct = equityPct;
    return o;
  }

  // Imputed rent into an index fund (the projection's cash-mode "go
  // deeper" leg) — was inline in renderAdvanced(). Retired by M2 in PR 6.
  function imputedRentFV(impliedRent, rate, months){
    var monthlyRate = rate / 12;
    return monthlyRate > 0 ? impliedRent * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : impliedRent * months;
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
    projectionDca: projectionDca,
    imputedRentFV: imputedRentFV,
    ledgerRetro: ledgerRetro,
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
