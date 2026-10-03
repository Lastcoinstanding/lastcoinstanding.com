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
   projection, shared/calculator-helpers.js (window.CalcHelpers). BvRE's
   retrospective (PR 4e) also reads the monthly series in
   shared/housing-monthly-data.js and shared/btc-monthly-data.js, through
   retroSeries() at call time; BvRP loads neither and never calls it.

   PR 3 MOVES code; it does not rewrite logic. Where the pages
   behaved differently, both behaviours are kept behind explicit
   parameters (e.g. mortgagePayment's zero-rate guard). Known issues
   are moved as-is and fixed in later PRs (Phase 0 report §d).
   PR 5a fixed BvRP's four: recapture at a flat 25% (now the bracket,
   capped at 25%, and never above the gain), depreciation from today's
   value (now the original building basis), no state tax on rental
   income, and ROC untaxed for the whole hold (now basis tracking).
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
  var NIIT_RATE = 0.038;
  function stateRateOf(s){
    // A state with no tax has rate 0, so test for a missing entry, not a
    // falsy one (PR 4d). The same top rate is applied to income and gains.
    return (STATE_CAPGAIN[s.stateCode] !== undefined ? STATE_CAPGAIN[s.stateCode] : STATE_CAPGAIN.OTHER) / 100;
  }
  // Tax rates by kind of income (PR 5a, M9). Ordinary income (net rent,
  // lending interest): the federal bracket plus the state rate, plus NIIT
  // where it applies. Long-term gains (the sale, and distributions beyond
  // basis): the bracket's LTCG rate plus state and NIIT. Unrecaptured §1250
  // gain: the ordinary rate capped at 25% (IRS Topic 409).
  function ordinaryRate(s){ return s.federalBracketPct / 100 + stateRateOf(s) + (niitApplies(s.federalBracketPct) ? NIIT_RATE : 0); }
  // "No capital-gains tax" (PR 5b): gains, recapture and distributions
  // beyond basis are untaxed; income is taxed as before.
  function noGainTax(s){ return s.taxRegime === 'none'; }
  function gainRate(s){ return noGainTax(s) ? 0 : federalLTCG(s.federalBracketPct) + stateRateOf(s) + (niitApplies(s.federalBracketPct) ? NIIT_RATE : 0); }
  function recaptureRate(s){ return noGainTax(s) ? 0 : Math.min(s.federalBracketPct, 25) / 100; }

  // The home-sale exclusion (PR 5b; IRS Topic 701, DATA_AUDIT TX-1): up to
  // $250,000 of gain ($500,000 filing jointly) on a main home owned and
  // lived in for 2 of the last 5 years. The pair assumes the house is the
  // buyer's main home, so it applies from a 2-year hold. Not indexed.
  var HOME_EXCLUSION = { mfj: 500000, single: 250000, hoh: 250000, mfs: 250000 };
  // The tax on selling the home: gain = value - selling costs - basis (the
  // price plus the buyer's closing costs); the exclusion comes off; the rest
  // at the long-term rate, state and NIIT (excluded gain isn't subject to
  // NIIT). A loss on a home isn't deductible.
  //   tp: { taxRegime, filing, federalBracketPct, stateCode }
  function homeSaleTax(tp, value, sellCosts, basis, years){
    var gain = value - sellCosts - basis;
    // Custom (PR 5c): the reader's exemption and rate, no holding test.
    if (tp.taxRegime === 'custom') {
      var ex = Math.min(Math.max(0, gain), Math.max(0, numOr(tp.customHomeExempt, 0)));
      var tx = Math.max(0, gain - ex);
      return { gain: gain, exclusion: ex, cap: Math.max(0, numOr(tp.customHomeExempt, 0)), eligible: true, custom: true,
               taxable: tx, tax: tx * Math.max(0, numOr(tp.customHomeRate, 0)) / 100 };
    }
    var eligible = years >= 2;
    var cap = HOME_EXCLUSION[tp.filing] || HOME_EXCLUSION.mfj;
    var exclusion = (!noGainTax(tp) && eligible) ? Math.min(Math.max(0, gain), cap) : 0;
    var taxable = noGainTax(tp) ? 0 : Math.max(0, gain - exclusion);
    return { gain: gain, exclusion: exclusion, cap: cap, eligible: eligible, taxable: taxable, tax: taxable * gainRate(tp) };
  }
  // The tax on selling bitcoin: the gain over its cost basis (what was paid,
  // costs included), at the long-term rate, state and NIIT. `realized` is
  // the net gain on bitcoin sold along the way (average cost), due in the
  // years of those sales; it is added here, at the end, without interest.
  // A net loss is not credited.
  function btcSaleTax(tp, proceeds, basis, realized){
    var gain = proceeds - basis + (realized || 0);
    // PR 5c: in a tax-advantaged account (Roth-style) the sale is untaxed;
    // under Custom, the reader's bitcoin rate.
    var rate = tp.btcAccount === 'advantaged' ? 0
             : tp.taxRegime === 'custom' ? Math.max(0, numOr(tp.customBtcRate, 0)) / 100
             : gainRate(tp);
    return { gain: gain, realized: realized || 0, advantaged: tp.btcAccount === 'advantaged', tax: Math.max(0, gain) * rate };
  }
  // BvRE's inputs as a tax profile, with R7's defaults.
  function bvreTaxProfile(i){
    return { taxRegime: i.taxRegime || 'us', filing: i.filing || 'mfj',
             federalBracketPct: numOr(i.taxBracket, 24), stateCode: i.taxState || 'OTHER',
             btcAccount: i.btcAccount || 'taxable', mortgageDeduction: !!i.mortgageDeduction,
             customHomeRate: i.customHomeRate, customHomeExempt: i.customHomeExempt, customBtcRate: i.customBtcRate };
  }
  // The mortgage-interest deduction (PR 5c; off by default, for itemisers):
  // the owner saves the interest times the federal bracket plus the state
  // rate, on up to $750,000 of loan ($375,000 filing separately; IRS
  // Publication 936). No saving under No capital-gains tax or Custom, whose
  // income tax isn't modelled. The share of interest covered is fixed by the
  // opening loan.
  var MORTGAGE_DEBT_CAP = { mfj: 750000, single: 750000, hoh: 750000, mfs: 375000 };
  function interestSavingRate(tp, loan){
    if (!tp.mortgageDeduction || tp.taxRegime !== 'us' || !(loan > 0)) return 0;
    var cover = Math.min(1, (MORTGAGE_DEBT_CAP[tp.filing] || 750000) / loan);
    return cover * (tp.federalBracketPct / 100 + stateRateOf(tp));
  }

  // Depreciation on the ORIGINAL building basis (PR 5a, M9; it was 80% of
  // today's value). The reader gives today's adjusted basis A (a share of
  // today's value) and the years already held h. Straight-line on 80% of the
  // original cost basis B0 over 27.5 years means A = B0 x (1 - 0.8 x
  // min(h, 27.5) / 27.5), so B0 = A / (1 - 0.8 x min(h, 27.5) / 27.5), and
  // each year's deduction is 0.8 x B0 / 27.5 until 27.5 years in total.
  var DEP_YEARS = 27.5, BUILDING_SHARE = 0.80;
  function depreciationPlan(s){
    var A = s.propertyValue * (s.adjustedBasisPct / 100);
    var h = Math.max(0, numOr(s.yearsAlreadyHeld, 0));
    var B0 = A / (1 - BUILDING_SHARE * Math.min(h, DEP_YEARS) / DEP_YEARS);
    return { adjustedToday: A, heldYears: h, basis0: B0, annual: BUILDING_SHARE * B0 / DEP_YEARS };
  }
  // Depreciation taken from today to t years ahead, and in all (past + future).
  function depFuture(plan, t){ return plan.annual * (Math.min(plan.heldYears + t, DEP_YEARS) - Math.min(plan.heldYears, DEP_YEARS)); }
  function depTotal(plan, t){ return plan.annual * Math.min(plan.heldYears + t, DEP_YEARS); }

  // ─── One bitcoin scenario set for both pages (M3, PR 4c) ─────────────
  // Floor · Stay at today's multiple · Trend · Upper, all derived from
  // shared/power-law-data.js, so they recalibrate as bitcoin's multiple
  // of the trend moves. Each moves the multiple in a straight line from
  // today's to a target at the horizon end, then multiplies by the trend
  // on that day:
  //   floor  → PL_FLOOR (0.42×), the channel's lower bound
  //   stay   → today's multiple (the default: no reversion either way;
  //            grows at the trend's own rate)
  //   trend  → 1× (the gap to trend closes by the horizon end)
  //   upper  → 2.5× (a stress test; see cyclePeakMultiples for the record)
  // Both engines (BvRP's scenarioGrowthFactor, BvRE's bvreProjection)
  // read scenarioMultiple, so the two pages can't drift apart again.
  var UPPER_TARGET = 2.5;
  var SCENARIOS = ['floor', 'stay', 'trend', 'upper'];
  function scenarioTarget(scenario, mult0){
    if (scenario === 'stay') return mult0;
    if (scenario === 'floor') return PL_FLOOR;
    if (scenario === 'upper') return UPPER_TARGET;
    return 1.0;
  }
  function scenarioMultiple(scenario, mult0, progress){
    var p = Math.max(0, Math.min(1, progress));
    return mult0 + (scenarioTarget(scenario, mult0) - mult0) * p;
  }

  // The record behind Upper's caveat, computed from the price series so it
  // can't go stale: the highest multiple of trend in each cycle-top year
  // since the genesis era (2013, 2017, 2021) and in the current cycle
  // (2024 to date). PL_DATA is sampled about every 12 days, so a peak
  // between samples is missed: these are lower bounds, as on The Floor.
  // Returns [{ year, month, mult }].
  function cyclePeakMultiples(){
    if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function' || typeof GENESIS_TS !== 'number') return [];
    var out = [];
    [[2013, 2013], [2017, 2017], [2021, 2021], [2024, 9999]].forEach(function(w){
      var best = null;
      for (var i = 0; i < PL_DATA.length; i++) {
        var d = PL_DATA[i][0], dt = new Date((GENESIS_TS + d * 86400) * 1000), y = dt.getUTCFullYear();
        if (y < w[0] || y > w[1]) continue;
        var m = PL_DATA[i][1] / plPrice(d);
        if (!best || m > best.mult) best = { year: y, month: dt.getUTCMonth(), mult: m };
      }
      if (best) out.push(best);
    });
    return out;
  }

  // Upper's caveat as a sentence fragment, from cyclePeakMultiples():
  // "past cycle peaks reached at least 12× trend (2013), 5.4× (2017) and
  // 3.2× (2021), each lower than the last and none sustained; the peak so
  // far in this cycle is 1.2× (December 2024)". "At least" because the
  // samples are lower bounds; "each lower than the last" is only said
  // while it is true.
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function upperRecordText(){
    var pk = cyclePeakMultiples();
    if (pk.length < 2) return '';
    var past = pk.slice(0, -1), cur = pk[pk.length - 1];
    function x(m){ return (m >= 10 ? m.toFixed(0) : m.toFixed(1)) + '\u00d7'; }
    var parts = past.map(function(p, i){ return x(p.mult) + (i === 0 ? ' trend' : '') + ' (' + p.year + ')'; });
    var list = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0];
    var falling = past.every(function(p, i){ return i === 0 || p.mult < past[i - 1].mult; }) && cur.mult < past[past.length - 1].mult;
    return 'past cycle peaks reached at least ' + list + (falling ? ', each lower than the last and none sustained' : ', none sustained') +
           '; the peak so far in this cycle is ' + x(cur.mult) + ' (' + MONTHS[cur.month] + ' ' + cur.year + ')';
  }

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
                       : scenario === 'floor' ? 0.15
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

    var futurePrice = scenarioMultiple(scenario, currentMult, progress) * futureTrend;
    return futurePrice / todaySpot;
  }

  function effectiveCAGR(scenario, holdingYears){
    if (holdingYears <= 0) return 0;
    var totalGrowth = scenarioGrowthFactor(scenario, holdingYears, holdingYears);
    return Math.pow(totalGrowth, 1 / holdingYears) - 1;
  }

  // ─── Rental-page defaults and rates (PR 4d) ───
  // The existing mortgage, per property (rulings M8). $200,000 on the
  // $500,000 default property is 40% of its value; FHFA's National
  // Mortgage Database puts the average mark-to-market LTV of outstanding
  // US mortgages at 45% (2026 Q1, by loan count). The rate is the average
  // contract rate on outstanding US mortgages, 4.4% (NMDB 2026 Q1, by count
  // and by balance); loans on rental properties usually cost more. Years
  // left: a 30-year loan taken when the property was bought, ten years ago
  // (the page's "years already held" default).
  var RENTAL_DEFAULTS = { existingMortgage: 200000, mortgageRatePct: 4.4, mortgageYearsLeft: 20 };

  // The yield portfolio's rates, and the verifiable rates the stablecoin-
  // lending disclosure lists, in one dated object (rulings §7, item 12), so
  // the monthly refresh is a one-place edit (MONTHLY_REFRESH_CHECKLIST §9.3a).
  // STRC's and SATA's rates come from src/_data/preferredRates.json, the one
  // place the site keeps them, injected as window.PREFERRED_RATES by
  // components/preferred-rates.njk (2026-09-30); the literals are the fallback.
  var _PR = (typeof window !== 'undefined' && window.PREFERRED_RATES) || {};
  function _prRate(k, d){ return (_PR[k] && isFinite(_PR[k].ratePct)) ? _PR[k].ratePct : d; }
  var YIELD_RATES = {
    asOf: 'September 2026',
    strc: _prRate('strc', 12.0),   // % a year, return of capital (DATA_AUDIT BvRP-5)
    sata: _prRate('sata', 13.0),   // % a year, return of capital (BvRP-14)
    lending: 4.0,    // % a year, ordinary income: the median of the four
                     // lending rates below (4.04%), rounded (BvRP-28)
    verifiable: [
      { name: '3-month Treasury bill', kind: 'Reference (risk-free)', rate: 4.08, source: 'FRED DTB3, 24 Sep 2026', us: 'Yes' },
      { name: 'Sky Savings Rate (sUSDS)', kind: 'DeFi savings', rate: 3.60, source: 'DefiLlama, base rate, 28 Sep 2026', us: 'Permissionless' },
      { name: 'Aave v3 USDC (Ethereum)', kind: 'DeFi lending', rate: 3.63, source: 'DefiLlama, base rate, 28 Sep 2026', us: 'Permissionless' },
      { name: 'Compound v3 USDC (Ethereum)', kind: 'DeFi lending', rate: 4.45, source: 'DefiLlama, base rate, 28 Sep 2026', us: 'Permissionless' },
      { name: 'Ledn Growth Account (USDC)', kind: 'CeFi lending', rate: 5.00, source: 'Ledn rates page, Sep 2026', us: 'No' }
    ]
  };

  function numOr(v, d){ return (v !== undefined && v !== null && isFinite(v)) ? Number(v) : d; }

  // ─── The Real view's deflator, one for both pages (PR 4f; rulings M1, P5) ───
  // Everything is computed in nominal dollars; the Real view divides a value
  // at year t by (1 + inflation)^t, the sitewide deflator. Every value at the
  // same date is divided by the same factor, so the deflator can never change
  // which path is ahead. BvRE's projection and BvRP's Real view both call it.
  function deflator(inflPct, years){ return Math.pow(1 + inflPct / 100, years); }
  function toReal(v, inflPct, years){ return v / deflator(inflPct, years); }

  // ─── Math: rental side ───
  function calcRentalAnnualCF(s){
    // Net cash flow as expressed; user input already nets the waterfall.
    // Year 1, with no mortgage (PR 5a: depreciation on the original basis,
    // state tax and NIIT on the income).
    var gross = s.propertyValue * (s.netRentalYield / 100);
    var depreciation = depFuture(depreciationPlan(s), 1);
    var taxableIncome = Math.max(0, gross - depreciation);
    var tax = taxableIncome * ordinaryRate(s);
    return { pretax: gross, depreciation: depreciation, tax: tax, afterTax: gross - tax };
  }

  // The existing mortgage on `units` identical properties (M8), amortized
  // monthly from today for `years` years. balance[t] is the balance after t
  // years; paid[k] and interest[k] are the payments made and the interest
  // paid in year k (1-based). Payments stop when the loan is paid off.
  function existingLoan(s, units, years){
    var bal = Math.max(0, numOr(s.existingMortgage, RENTAL_DEFAULTS.existingMortgage)) * (units === undefined ? 1 : units);
    var ratePct = numOr(s.mortgageRatePct, RENTAL_DEFAULTS.mortgageRatePct);
    var n = Math.max(0, Math.round(numOr(s.mortgageYearsLeft, RENTAL_DEFAULTS.mortgageYearsLeft) * 12));
    var mr = ratePct / 100 / 12;
    var payment = (bal > 0 && n > 0) ? (mr > 0 ? bal * mr / (1 - Math.pow(1 + mr, -n)) : bal / n) : 0;
    var out = { balance0: bal, payment: payment, balance: [bal], paid: [0], interest: [0] };
    var m = 0;
    for (var k = 1; k <= Math.max(1, years); k++) {
      var paidK = 0, intK = 0;
      for (var j = 0; j < 12; j++) {
        m++;
        if (m > n || bal <= 0) continue;
        var it = bal * mr;
        var pr = Math.min(payment - it, bal);
        bal -= pr; paidK += it + pr; intK += it;
      }
      out.balance.push(bal); out.paid.push(paidK); out.interest.push(intK);
    }
    return out;
  }

  // Keep-rental cash flow year by year, with the existing mortgage (M8):
  // debt service comes off cash flow and interest is deductible against
  // rental income. Net operating income stays flat, as before. Since PR 5a
  // (M9) depreciation is on the original building basis and stops at 27.5
  // years in all, and the income bears state tax (and NIIT where it
  // applies) as well as the federal bracket. Losses are not carried.
  function rentalYears(s, units, years){
    var gross = s.propertyValue * (s.netRentalYield / 100);
    var plan = depreciationPlan(s);
    var loan = existingLoan(s, units, years);
    var rows = [null];
    for (var k = 1; k <= Math.max(1, years); k++) {
      var depreciation = depFuture(plan, k) - depFuture(plan, k - 1);
      var taxable = Math.max(0, gross - depreciation - loan.interest[k]);
      var tax = taxable * ordinaryRate(s);
      rows.push({ pretax: gross, depreciation: depreciation, interest: loan.interest[k], debtService: loan.paid[k],
                  tax: tax, afterTax: gross - loan.paid[k] - tax });
    }
    return { loan: loan, rows: rows };
  }

  // Cumulative after-tax cash to year t: year 1's times t, plus each year's
  // difference from year 1. The same sum, arranged so that with no mortgage
  // (every year alike) it is year 1 x t exactly, as before PR 4d.
  function cumulativeRentalCash(ry, t){
    var base = ry.rows[1].afterTax, extra = 0;
    for (var k = 2; k <= t; k++) extra += ry.rows[k].afterTax - base;
    return base * t + extra;
  }

  // Selling costs (% of sale price) and bitcoin's purchase factor, read
  // from state with the pair defaults as fallback (PR 4b, M6). Selling
  // costs were a hardcoded 8%; bitcoin purchases were free.
  function sellCostPct(s){ return (s.sellCostPct !== undefined && s.sellCostPct !== null) ? s.sellCostPct : PAIR_DEFAULTS.sellPct; }
  function btcBuyFactor(s){ return 1 - ((s.btcTxPct !== undefined && s.btcTxPct !== null) ? s.btcTxPct : PAIR_DEFAULTS.btcTxPct) / 100; }

  function calcRentalExit(s, yearsToExit){
    var appreciatedValue = s.propertyValue * Math.pow(1 + s.appreciationPct/100, yearsToExit);
    var transactionCosts = appreciatedValue * sellCostPct(s) / 100;
    var netProceeds = appreciatedValue - transactionCosts;

    // Depreciation on the original building basis (PR 5a, M9): taken to
    // date plus what the next yearsToExit years add, capped at 27.5 years
    // in all; the adjusted basis falls by the future part.
    var plan = depreciationPlan(s);
    var accumulatedDep = depTotal(plan, yearsToExit);
    var adjustedBasis = plan.adjustedToday - depFuture(plan, yearsToExit);
    var taxableGain = netProceeds - adjustedBasis;

    // Unrecaptured §1250 gain: the depreciation, but never more than the
    // gain, at the ordinary rate capped at 25% (it was a flat 25% on all of
    // it). The rest of the gain at the bracket's long-term rate; state and
    // NIIT on the whole gain.
    var unrecaptured = Math.min(accumulatedDep, Math.max(0, taxableGain));
    var recaptureTax = unrecaptured * recaptureRate(s);
    var ltcgBase = Math.max(0, taxableGain - unrecaptured);
    var none = noGainTax(s);
    var ltcgTax = none ? 0 : ltcgBase * federalLTCG(s.federalBracketPct);
    var stateTax = none ? 0 : Math.max(0, taxableGain) * stateRateOf(s);
    var niit = (!none && niitApplies(s.federalBracketPct)) ? Math.max(0, taxableGain) * NIIT_RATE : 0;

    var totalTax = recaptureTax + ltcgTax + stateTax + niit;
    var netCash = netProceeds - totalTax;
    return {
      grossSale: appreciatedValue,
      marketValue: appreciatedValue,    // mark-to-market property value (no taxes/costs applied)
      transactionCosts: transactionCosts,
      netProceeds: netProceeds,
      accumulatedDep: accumulatedDep,
      adjustedBasis: adjustedBasis,
      taxableGain: taxableGain,
      unrecaptured: unrecaptured,
      recaptureRatePct: recaptureRate(s) * 100,
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
  // matters because it sets the horizon over which every scenario but
  // 'stay' moves to its target multiple (M3).
  function calcSpotBTCFV(amount, years, scenario, holdingYears){
    return amount * scenarioGrowthFactor(scenario, years, holdingYears || years);
  }

  // The yield portfolio year by year (PR 5a). STRC and SATA distributions
  // are return of capital, as the issuers expect (Strategy's 2025 report,
  // Strive's 2026 Forms 8937): tax-deferred, never tax-free. Each year's ROC
  // reduces that instrument's basis; once the basis is used up (about eight
  // years at 12-13%), distributions are long-term gains in the year paid.
  // Lending interest is ordinary income. (Before 5a the ROC was untaxed for
  // the whole hold, and the lending interest bore no state tax.) The gain
  // left in the reduced basis falls due on a sale, which the If sold basis
  // (PR 5b) will show.
  function yieldAllocs(amount, s){
    var p = s.portfolio;
    return { strc: amount * p.strc/100, sata: amount * p.sata/100, lend: amount * p.lend/100, spot: amount * p.spot/100 };
  }
  function yieldYears(amount, s, years){
    var alloc = yieldAllocs(amount, s);
    var dist = {
      strc: alloc.strc * (YIELD_RATES.strc / 100),   // ROC
      sata: alloc.sata * (YIELD_RATES.sata / 100),   // ROC
      lend: alloc.lend * (YIELD_RATES.lending / 100), // ordinary income
      spot: 0
    };
    var basis = { strc: alloc.strc, sata: alloc.sata };
    var ord = ordinaryRate(s), gain = gainRate(s);
    var rows = [null];
    for (var k = 1; k <= Math.max(1, years); k++) {
      var excess = 0;
      ['strc', 'sata'].forEach(function(key){
        var roc = Math.min(dist[key], basis[key]);
        basis[key] -= roc;
        excess += dist[key] - roc;
      });
      var pretax = dist.strc + dist.sata + dist.lend;
      var tax = dist.lend * ord + excess * gain;
      rows.push({ pretax: pretax, ordinaryTax: dist.lend * ord, gainTax: excess * gain, taxedAsGain: excess,
                  tax: tax, afterTax: pretax - tax, basisLeft: basis.strc + basis.sata });
    }
    return { alloc: alloc, dist: dist, rows: rows };
  }
  function yieldCumCash(yy, t){
    var c = 0;
    for (var k = 1; k <= t; k++) c += yy.rows[k].afterTax;
    return c;
  }

  function calcYieldPortfolio(amount, s){
    var yy = yieldYears(amount, s, s.holdingYears);
    var alloc = yy.alloc, y1 = yy.rows[1];
    var cumulativeCash = yieldCumCash(yy, s.holdingYears);

    // Spot BTC FV (bought net of the bitcoin transaction cost, M6)
    var spotFV = calcSpotBTCFV(alloc.spot * btcBuyFactor(s), s.holdingYears, s.btcScenario);
    var spotAppreciation = spotFV - alloc.spot;

    // Total wealth at year N
    var preservedPrincipal = alloc.strc + alloc.sata + alloc.lend;
    var totalWealth = preservedPrincipal + spotFV + cumulativeCash;

    // The first year in which a distribution is taxed as a gain (0: none).
    var gainYear = 0;
    for (var k = 1; k < yy.rows.length; k++) if (yy.rows[k].taxedAsGain > 0) { gainYear = k; break; }

    return {
      allocations: alloc,
      year1Distributions: yy.dist,
      year1Pretax: y1.pretax,
      year1AfterTax: y1.afterTax,
      cumulativeCashAfterTax: cumulativeCash,
      basisLeft: yy.rows[s.holdingYears] ? yy.rows[s.holdingYears].basisLeft : yy.rows[1].basisLeft,
      rocGainYear: gainYear,
      spotFV: spotFV,
      spotAppreciation: spotAppreciation,
      totalWealth: totalWealth
    };
  }

  // ─── Counterfactual: keep rental ───
  // Asset-value (mark-to-market) framing: keep-rental wealth is cumulative
  // after-tax cash flow + the property's market value at year N, less the
  // mortgage balance then (M8, PR 4d). The exit tax that would arise on
  // sale is NOT applied — we're showing the asset trajectory of someone
  // who intends to keep holding. The path-detail card shows the tax
  // waterfall explicitly for users who want to see the realizable-at-
  // year-N number.
  //
  // This matches the visual framing of the chart: bitcoin paths pay their
  // exit tax up front (year 0) so they start lower; keep-rental defers
  // the exit tax indefinitely so it starts higher. The chart honestly
  // shows the "selling has an immediate cost" reality the prior version
  // silently hid by applying exit tax to both sides at year N.
  //
  // `units`: how many identical properties (Path 3 keeps all of them); the
  // existing mortgage is per property. s.propertyValue is already the total.
  function calcKeepRental(s, units){
    var ry = rentalYears(s, units === undefined ? 1 : units, s.holdingYears);
    var cumulativeCash = cumulativeRentalCash(ry, s.holdingYears);
    var exit = calcRentalExit(s, s.holdingYears);
    var mortgageEnd = ry.loan.balance[s.holdingYears] || 0;
    var totalWealth = cumulativeCash + exit.marketValue - mortgageEnd;  // unrealized
    return {
      annual: ry.rows[1],
      cumulativeCash: cumulativeCash,
      exit: exit,
      mortgage0: ry.loan.balance0,
      mortgagePayment: ry.loan.payment,
      mortgageEnd: mortgageEnd,
      totalWealth: totalWealth
    };
  }

  // A sale repays the existing mortgage before anything is redeployed (M8).
  // If the proceeds after tax don't cover it, nothing is deployed and the
  // shortfall is paid from other money, so it counts against the path.
  function afterRepayment(netCash, repay){
    var left = netCash - repay;
    return { repaid: repay, deployed: Math.max(0, left), shortfall: Math.max(0, -left) };
  }

  // ─── Path-specific calculators ───
  function calcPath1(s){
    var exitNow = calcRentalExit(s, 0);
    var r = afterRepayment(exitNow.netCash, existingLoan(s, 1, 0).balance0);
    var spotFV = calcSpotBTCFV(r.deployed * btcBuyFactor(s), s.holdingYears, s.btcScenario);
    return {
      saleAtYear0: exitNow,
      mortgageRepaid: r.repaid,
      shortfall: r.shortfall,
      year1CashFlow: 0,  // pure spot, no distributions
      totalWealth: spotFV - r.shortfall,
      netCashDeployed: r.deployed
    };
  }

  function calcPath2(s){
    var maxCltvDollar = s.propertyValue * (s.helocLtv/100);
    var helocDraw = Math.max(0, maxCltvDollar - s.existingMortgage);
    var annualCarry = helocDraw * (s.helocRatePct/100);
    var cumulativeCarry = annualCarry * s.holdingYears;
    var btcFV = calcSpotBTCFV(helocDraw * btcBuyFactor(s), s.holdingYears, s.btcScenario);

    // Net wealth gain from leveraged BTC position
    var grossGain = btcFV - helocDraw;  // BTC appreciation
    var netGainFromLeverage = grossGain - cumulativeCarry;  // after carry cost

    // Retained rental: continues earning, and keeps its mortgage (M8)
    var keep = calcKeepRental(s, 1);

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

    // Per-property economics (assume identical, each with the same mortgage)
    var perPropertyValue = s.propertyValue;
    var soldPropertiesValue = perPropertyValue * sold;

    // Sale on the sold portion repays their mortgages, then deploys to the
    // yield portfolio
    var sellS = Object.assign({}, s, { propertyValue: soldPropertiesValue });
    var exitNow = calcRentalExit(sellS, 0);
    var r = afterRepayment(exitNow.netCash, existingLoan(s, sold, 0).balance0);
    var netCashFromSale = r.deployed;

    var yieldPort = calcYieldPortfolio(netCashFromSale, s);

    // Retained properties keep earning, and keep their mortgages
    var retainedS = Object.assign({}, s, { propertyValue: perPropertyValue * retained });
    var keep = calcKeepRental(retainedS, retained);

    var totalWealth = yieldPort.totalWealth + keep.totalWealth - r.shortfall;
    var year1CF = yieldPort.year1AfterTax + keep.annual.afterTax;
    return {
      sold: sold,
      retained: retained,
      soldPropertiesValue: soldPropertiesValue,
      saleResult: exitNow,
      mortgageRepaid: r.repaid,
      shortfall: r.shortfall,
      netCashFromSale: netCashFromSale,
      yieldPortfolio: yieldPort,
      retainedRental: keep,
      year1CashFlow: year1CF,
      totalWealth: totalWealth
    };
  }

  function calcPath4(s){
    // Outright sell, repay the mortgage, deploy the rest to the yield portfolio
    var exitNow = calcRentalExit(s, 0);
    var r = afterRepayment(exitNow.netCash, existingLoan(s, 1, 0).balance0);
    var yieldPort = calcYieldPortfolio(r.deployed, s);
    return {
      saleAtYear0: exitNow,
      mortgageRepaid: r.repaid,
      shortfall: r.shortfall,
      netCashDeployed: r.deployed,
      yieldPortfolio: yieldPort,
      year1CashFlow: yieldPort.year1AfterTax,
      totalWealth: yieldPort.totalWealth - r.shortfall
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
    var keep = calcKeepRental(keepS, keepMultiplier);
    var pathResult;
    if (s.path === 1) pathResult = calcPath1(s);
    else if (s.path === 2) pathResult = calcPath2(s);
    else if (s.path === 3) pathResult = calcPath3(s);
    else pathResult = calcPath4(s);
    keep.ifSold = rentalIfSold(keep);
    pathResult.ifSold = pathIfSold(s, pathResult);
    return { keep: keep, path: pathResult };
  }

  // ─── If sold at year N, before and after tax (PR 5b, M7) ───
  // Each side is sold at the horizon: the rental with its exit tax
  // (recapture, the gain, state, NIIT; calcRentalExit), bitcoin with the tax
  // on its gain over what was paid for it, and the STRC/SATA preferreds at
  // par with the gain their return of capital left in the lower basis.
  // Selling costs come off both figures, so the difference between them is
  // tax alone. `preTax` and `afterTax` are totals comparable with
  // totalWealth (which stays the Held value, before selling costs and tax).
  function rentalIfSold(keep){
    var x = keep.exit;
    var pre = keep.cumulativeCash + x.netProceeds - keep.mortgageEnd;
    return { preTax: pre, tax: x.totalTax, afterTax: pre - x.totalTax, rental: x };
  }
  function btcSold(s, value, basis){
    var cost = value * (1 - btcBuyFactor(s));   // the bitcoin transaction cost on the sale
    var proceeds = value - cost;
    var gain = proceeds - basis;
    return { value: value, saleCost: cost, proceeds: proceeds, basis: basis, gain: gain, tax: Math.max(0, gain) * gainRate(s) };
  }
  function yieldSold(s, yp){
    var a = yp.allocations;
    var prefGain = (a.strc + a.sata) - yp.basisLeft;           // at par, less the reduced basis
    var spot = btcSold(s, yp.spotFV, a.spot);
    var prefTax = Math.max(0, prefGain) * gainRate(s);
    return { preTax: yp.totalWealth - spot.saleCost, tax: prefTax + spot.tax, prefGain: prefGain, prefTax: prefTax, spot: spot };
  }
  function pathIfSold(s, r){
    var pre, tax, parts = {};
    if (s.path === 1) {
      var b1 = btcSold(s, r.totalWealth + r.shortfall, r.netCashDeployed);
      pre = b1.proceeds - r.shortfall; tax = b1.tax; parts.btc = b1;
    } else if (s.path === 2) {
      var k2 = rentalIfSold(r.retainedRental), b2 = btcSold(s, r.btcFV, r.helocDraw);
      pre = k2.preTax + b2.proceeds - r.helocDraw - r.cumulativeCarry;
      tax = k2.tax + b2.tax; parts.rental = k2; parts.btc = b2;
    } else if (s.path === 3) {
      var y3 = yieldSold(s, r.yieldPortfolio), k3 = rentalIfSold(r.retainedRental);
      pre = y3.preTax + k3.preTax - r.shortfall; tax = y3.tax + k3.tax; parts.yield = y3; parts.rental = k3;
    } else {
      var y4 = yieldSold(s, r.yieldPortfolio);
      pre = y4.preTax - r.shortfall; tax = y4.tax; parts.yield = y4;
    }
    return { preTax: pre, tax: tax, afterTax: pre - tax, parts: parts };
  }

  // ─── Year-by-year wealth trajectories (for the chart) ───
  function calcYieldPortfolioAtYearT(amount, s, t, scenarioOverride){
    // In step with calcYieldPortfolio (PR 5a: the ROC basis, state tax).
    var yy = yieldYears(amount, s, Math.max(1, t));
    var cumCash = yieldCumCash(yy, t);
    var scenario = scenarioOverride || s.btcScenario;
    var spotFV = yy.alloc.spot * btcBuyFactor(s) * scenarioGrowthFactor(scenario, t, s.holdingYears);
    var preserved = yy.alloc.strc + yy.alloc.sata + yy.alloc.lend;
    return preserved + spotFV + cumCash;
  }

  function calcWealthTrajectory(s, scenarioOverride){
    var sUse = scenarioOverride ? Object.assign({}, s, { btcScenario: scenarioOverride }) : s;
    var H = sUse.holdingYears;

    // Keep-rental counterfactual scales with numProperties for Path 3
    // (compares against keeping ALL properties, not just one). For
    // paths 1, 2, 4 the keep-rental counterfactual is the single
    // subject property of the path, so multiplier = 1.
    var keepMultiplier = (sUse.path === 3) ? sUse.numProperties : 1;
    var keepS = (keepMultiplier !== 1)
      ? Object.assign({}, sUse, { propertyValue: sUse.propertyValue * keepMultiplier })
      : sUse;
    var keepYears = rentalYears(keepS, keepMultiplier, H);

    // What the sale paths deploy after tax and the mortgage (M8), and the
    // Path 3 retained rentals' own cash flows and mortgages.
    var sold = Math.max(0, sUse.numProperties - sUse.propertiesRetained);
    var sale1 = afterRepayment(calcRentalExit(sUse, 0).netCash, existingLoan(sUse, 1, 0).balance0);
    var sellS = Object.assign({}, sUse, { propertyValue: sUse.propertyValue * sold });
    var sale3 = afterRepayment(calcRentalExit(sellS, 0).netCash, existingLoan(sUse, sold, 0).balance0);
    var retainedS = Object.assign({}, sUse, { propertyValue: sUse.propertyValue * sUse.propertiesRetained });
    var retainedYears = rentalYears(retainedS, sUse.propertiesRetained, H);

    var trajectory = [];
    for (var t = 0; t <= H; t++) {
      var growth = scenarioGrowthFactor(sUse.btcScenario, t, H);
      var cumKeep = cumulativeRentalCash(keepYears, t);
      var cumRetained = cumulativeRentalCash(retainedYears, t);

      // Keep rental at year t: cumulative after-tax cash + property market
      // value at year t, less the mortgage balance then (mark-to-market,
      // no exit tax applied).
      var wealthKeep = cumKeep + calcRentalExit(keepS, t).marketValue - keepYears.loan.balance[t];

      var wealthPath;
      if (sUse.path === 1) {
        wealthPath = sale1.deployed * btcBuyFactor(sUse) * growth - sale1.shortfall;
      } else if (sUse.path === 2) {
        var maxCltv = sUse.propertyValue * (sUse.helocLtv/100);
        var heloc = Math.max(0, maxCltv - sUse.existingMortgage);
        var btcVal = heloc * btcBuyFactor(sUse) * growth;
        var carry = heloc * (sUse.helocRatePct/100) * t;
        wealthPath = wealthKeep + btcVal - heloc - carry;
      } else if (sUse.path === 3) {
        var ypVal = calcYieldPortfolioAtYearT(sale3.deployed, sUse, t);
        wealthPath = ypVal + cumRetained + calcRentalExit(retainedS, t).marketValue - retainedYears.loan.balance[t] - sale3.shortfall;
      } else {
        wealthPath = calcYieldPortfolioAtYearT(sale1.deployed, sUse, t) - sale1.shortfall;
      }
      trajectory.push({ year: t, wealthKeep: wealthKeep, wealthPath: wealthPath });
    }
    return trajectory;
  }

  // ─── If sold at year t, for the chart (PR 6b, M7) ───
  // Each year's value if both sides were sold that year, before and after
  // tax, on the same bitcoin path as the whole horizon (the scenario's
  // multiple at year t of H, not a t-year scenario). At t = H it equals
  // computeAll's ifSold (rePairQA checks). Year 0 is a sale today.
  function calcIfSoldTrajectory(s, scenarioOverride){
    var sUse = scenarioOverride ? Object.assign({}, s, { btcScenario: scenarioOverride }) : s;
    var H = sUse.holdingYears, sc = sUse.btcScenario, bf = btcBuyFactor(sUse);
    var keepMultiplier = (sUse.path === 3) ? sUse.numProperties : 1;
    var keepS = keepMultiplier !== 1 ? Object.assign({}, sUse, { propertyValue: sUse.propertyValue * keepMultiplier }) : sUse;
    var ky = rentalYears(keepS, keepMultiplier, H);
    var sold = Math.max(0, sUse.numProperties - sUse.propertiesRetained);
    var retainedS = Object.assign({}, sUse, { propertyValue: sUse.propertyValue * sUse.propertiesRetained });
    var ry = rentalYears(retainedS, sUse.propertiesRetained, H);
    var one = rentalYears(sUse, 1, H);
    var sale1 = afterRepayment(calcRentalExit(sUse, 0).netCash, existingLoan(sUse, 1, 0).balance0);
    var sale3 = afterRepayment(calcRentalExit(Object.assign({}, sUse, { propertyValue: sUse.propertyValue * sold }), 0).netCash, existingLoan(sUse, sold, 0).balance0);
    var heloc = Math.max(0, sUse.propertyValue * (sUse.helocLtv / 100) - sUse.existingMortgage);
    var yy = (sUse.path === 3) ? yieldYears(sale3.deployed, sUse, H) : (sUse.path === 4 ? yieldYears(sale1.deployed, sUse, H) : null);
    function rentalAt(S, years, t){
      var x = calcRentalExit(S, t), pre = cumulativeRentalCash(years, t) + x.netProceeds - years.loan.balance[t];
      return { pre: pre, tax: x.totalTax };
    }
    function yieldAt(t, deployed){
      var a = yy.alloc, cum = 0;
      for (var k = 1; k <= t; k++) cum += yy.rows[k].afterTax;
      var basisLeft = t > 0 ? yy.rows[t].basisLeft : (a.strc + a.sata);
      var spot = btcSold(sUse, a.spot * bf * scenarioGrowthFactor(sc, t, H), a.spot);
      var prefTax = Math.max(0, (a.strc + a.sata) - basisLeft) * gainRate(sUse);
      return { pre: a.strc + a.sata + a.lend + spot.proceeds + cum, tax: prefTax + spot.tax };
    }
    var out = [];
    for (var t = 0; t <= H; t++) {
      var g = scenarioGrowthFactor(sc, t, H);
      var keep = rentalAt(keepS, ky, t), pre, tax;
      if (sUse.path === 1) {
        var b1 = btcSold(sUse, sale1.deployed * bf * g, sale1.deployed);
        pre = b1.proceeds - sale1.shortfall; tax = b1.tax;
      } else if (sUse.path === 2) {
        var k2 = rentalAt(sUse, one, t), b2 = btcSold(sUse, heloc * bf * g, heloc);
        pre = k2.pre + b2.proceeds - heloc - heloc * (sUse.helocRatePct / 100) * t; tax = k2.tax + b2.tax;
      } else if (sUse.path === 3) {
        var y3 = yieldAt(t), k3 = rentalAt(retainedS, ry, t);
        pre = y3.pre + k3.pre - sale3.shortfall; tax = y3.tax + k3.tax;
      } else {
        var y4 = yieldAt(t);
        pre = y4.pre - sale1.shortfall; tax = y4.tax;
      }
      out.push({ year: t, keepPre: keep.pre, keepTax: keep.tax, keep: keep.pre - keep.tax, pathPre: pre, pathTax: tax, path: pre - tax });
    }
    return out;
  }

  // ─── BvRP's ledger: the rental and the path, year by year (PR 6a) ───
  // The rows behind the chart (calcWealthTrajectory) and the table: the
  // kept rental (all N properties on Path 3) and the chosen path, one row
  // per year, nominal dollars as paid. `held` equals the chart's point for
  // that year; the last year's `held` equals the table's "if held" total.
  function rentalLedger(s){
    var H = s.holdingYears, sc = s.btcScenario;
    var keepMultiplier = (s.path === 3) ? s.numProperties : 1;
    var keepS = keepMultiplier !== 1 ? Object.assign({}, s, { propertyValue: s.propertyValue * keepMultiplier }) : s;
    var ky = rentalYears(keepS, keepMultiplier, H);
    var traj = calcWealthTrajectory(s);
    var btc0 = (typeof TODAY_PRICE !== 'undefined' && TODAY_PRICE > 0) ? TODAY_PRICE : null;
    var rental = [], cum = 0;
    for (var t = 1; t <= H; t++) {
      var r = ky.rows[t];
      cum += r.afterTax;
      var value = keepS.propertyValue * Math.pow(1 + s.appreciationPct / 100, t);
      rental.push({ year: t, value: value, balance: ky.loan.balance[t], noi: r.pretax, depreciation: r.depreciation,
                    interest: r.interest, debtService: r.debtService, tax: r.tax, cash: r.afterTax, cumCash: cum,
                    equity: value - ky.loan.balance[t], held: traj[t].wealthKeep });
    }
    var bf = btcBuyFactor(s), path = [];
    var sold = Math.max(0, s.numProperties - s.propertiesRetained);
    var sale = (s.path === 3)
      ? afterRepayment(calcRentalExit(Object.assign({}, s, { propertyValue: s.propertyValue * sold }), 0).netCash, existingLoan(s, sold, 0).balance0)
      : afterRepayment(calcRentalExit(s, 0).netCash, existingLoan(s, 1, 0).balance0);
    var heloc = Math.max(0, s.propertyValue * (s.helocLtv / 100) - s.existingMortgage);
    var yy = (s.path === 3 || s.path === 4) ? yieldYears(sale.deployed, s, H) : null;
    var pcum = 0;
    for (var k = 1; k <= H; k++) {
      var g = scenarioGrowthFactor(sc, k, H), row = { year: k, btcPrice: btc0 ? btc0 * g : null, held: traj[k].wealthPath };
      if (s.path === 1) row.btcValue = sale.deployed * bf * g;
      else if (s.path === 2) { row.btcValue = heloc * bf * g; row.heloc = heloc; row.helocInterest = heloc * (s.helocRatePct / 100) * k; }
      else {
        var y = yy.rows[k];
        pcum += y.afterTax;
        row.btcValue = yy.alloc.spot * bf * g;
        row.par = yy.alloc.strc + yy.alloc.sata + yy.alloc.lend;
        row.dist = y.pretax; row.distTax = y.tax; row.cash = y.afterTax; row.cumCash = pcum; row.basisLeft = y.basisLeft;
      }
      path.push(row);
    }
    return { rental: rental, path: path };
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

  // ─── BvRE retrospective: to today, month by month (PR 4e) ────────────
  // Rulings M11 (the house follows Case-Shiller), M4 (historical market
  // rent), M2 (equal cash out), M6 (costs) and P8 (the retrospective runs to
  // today), replacing the pre-4 rules (rent at 75% of the mortgage payment,
  // flat; costs on the purchase price; the new-house median as the end
  // value; the "Go deeper" DCA; a fixed April 2025 end).
  //
  // The purchase is in July of the start year; both households then spend
  // the same every month through the current month, as in bvreProjection:
  //  - At purchase the buyer pays the down payment (or the whole price) plus
  //    closing costs; the renter puts the same sum into bitcoin at the start
  //    year's average price (startYearPrice below), less the trading cost.
  //  - Each month the owner pays P&I + property tax + insurance +
  //    maintenance; the renter pays rent and, with "invests the difference"
  //    on, buys bitcoin with (owner's cost − rent) at the price the month
  //    opened at (the previous month's close), or sells bitcoin to cover rent
  //    when rent costs more. Off: only the up-front sum is invested.
  //  - The house's value follows the Case-Shiller National index from July
  //    of the start year (M11). Property tax, insurance and maintenance
  //    follow that value, reset each July (M6; today's default rates, applied
  //    to every year).
  //  - Rent starts at market rent for the house: price ÷ 12 ÷ the start
  //    year's price-to-rent ratio, Zillow's typical home value over its
  //    market rent (annual averages; ZORI begins in 2015, so a 2014 start
  //    backcasts it with CPI rent). It resets each July by Zillow's market
  //    rent index, as a lease renewed at market would (M4).
  //  - The end is today (P8): bitcoin at today's price; the house at the
  //    latest Case-Shiller month (the index lags about two months); flows
  //    through the current month. If sold, before tax (PR 5): house value −
  //    selling costs − loan balance; bitcoin value − the trading cost.
  //   i: { sy, method 'mortgage'|'cash', homePrice (the start year's
  //        price), mortRate, dpf, rent (July rent | null), investDiff,
  //        btcToday, nowMs, closingPct, propTaxPct, insurancePer400K,
  //        maintPct, sellPct, btcTxPct, series }
  //   series: { cs, zori, zhvi, cpiRent, btc } — monthly [['YYYY-MM', v]]
  //        arrays (retroSeries() collects the page's globals).
  //   Returns end values, the first and last monthly figures the cards
  //   quote, totals, and one row per calendar year: the first from July,
  //   the last "to date" and valued as the cards are (the ledger PR 6
  //   renders; rePairQA.ledgerCheck asserts the parity).
  function monthIdx(key){ var p = String(key).split('-'); return (+p[0]) * 12 + (+p[1] - 1); }
  function monthKey(idx){ var y = Math.floor(idx / 12), m = idx % 12 + 1; return y + '-' + (m < 10 ? '0' : '') + m; }
  // The last entry at or before month idx (monthly series carry their latest
  // value forward until the next refresh adds a month).
  function atOrBefore(arr, idx){
    for (var k = arr.length - 1; k >= 0; k--) if (monthIdx(arr[k][0]) <= idx) return arr[k];
    return null;
  }
  function exactAt(arr, idx){
    var key = monthKey(idx);
    for (var k = arr.length - 1; k >= 0; k--) if (arr[k][0] === key) return arr[k][1];
    return null;
  }
  function retroSeries(){
    return { cs: CS_NATIONAL, zori: ZORI_US, zhvi: ZHVI_US, cpiRent: CPI_RENT, btc: BTC_MONTHLY };
  }
  // The start year's average bitcoin price: the mean of PL_DATA's samples in
  // that calendar year (a ~12-day grid, so close to the daily average).
  function startYearPrice(y){
    var sum = 0, n = 0;
    for (var k = 0; k < PL_DATA.length; k++) {
      var yr = new Date((GENESIS_TS + PL_DATA[k][0] * 86400) * 1000).getUTCFullYear();
      if (yr === y) { sum += PL_DATA[k][1]; n++; }
    }
    return n ? sum / n : null;
  }
  // Zillow's rent index, backcast with CPI rent before ZORI begins.
  function rentIndexAt(S, idx){
    var z0 = S.zori[0], i0 = monthIdx(z0[0]);
    if (idx >= i0) return atOrBefore(S.zori, idx)[1];
    var c = exactAt(S.cpiRent, idx), c0 = exactAt(S.cpiRent, i0);
    return (c === null || c0 === null) ? null : z0[1] * c / c0;
  }
  // Price-to-rent for a calendar year: mean ZHVI ÷ (12 × mean rent index).
  function priceToRentForYear(S, y){
    var hv = 0, rv = 0;
    for (var m = 0; m < 12; m++) {
      var idx = y * 12 + m, h = exactAt(S.zhvi, idx), r = rentIndexAt(S, idx);
      if (h === null || r === null) return null;
      hv += h; rv += r;
    }
    return (hv / 12) / (12 * rv / 12);
  }

  function bvreRetro(i){
    var S = i.series || retroSeries();
    var sy = i.sy, hs = i.homePrice, cash = i.method === 'cash';
    var s0 = sy * 12 + 6;                                     // July of the start year
    var now = new Date(i.nowMs), cur = now.getUTCFullYear() * 12 + now.getUTCMonth();
    var n = cur - s0 + 1;                                     // months, July through the current month
    if (!(n >= 1) || !(hs > 0)) return null;
    var tx = i.btcTxPct / 100;
    var invest = i.investDiff !== false;
    var btcToday = i.btcToday;

    var cs0 = atOrBefore(S.cs, s0)[1];
    function valueAt(idx){ return hs * atOrBefore(S.cs, idx)[1] / cs0; }
    var csEnd = atOrBefore(S.cs, cur);                        // the latest published month
    var z0 = rentIndexAt(S, s0);
    var pr = priceToRentForYear(S, sy);
    var rentDefault = hs / (12 * pr);
    var rent0 = (i.rent === null || i.rent === undefined) ? rentDefault : i.rent;
    function julyOf(idx){ var y = Math.floor(idx / 12); return (idx % 12 >= 6 ? y : y - 1) * 12 + 6; }
    function priceFor(idx){ var c = exactAt(S.btc, idx - 1); return c === null ? btcToday : c; }

    var loan = cash ? 0 : hs * (1 - i.dpf);
    var down = cash ? hs : hs * i.dpf;
    var closing = hs * i.closingPct / 100;
    var upfront = down + closing;
    var mr = i.mortRate / 100 / 12;
    var pi = loan > 0 ? mortgagePayment(loan, i.mortRate, 30, 'le0') : 0;
    var entryPrice = startYearPrice(sy);
    // A start year needs a full calendar year of Zillow data (for its
    // price-to-rent) and of PL_DATA (for its average price).
    if (!(pr > 0) || !(entryPrice > 0)) return null;
    var btcUpfront = upfront * (1 - tx) / entryPrice;

    var btc = btcUpfront, bal = loan;
    var basis = upfront, realized = 0;   // bitcoin's cost basis and the gain on coins sold along the way (PR 5b)
    var t = { interest: 0, principal: 0, tax: 0, ins: 0, maint: 0, owner: 0, rent: 0,
              invested: 0, sold: 0, shortfall: 0, spent: 0, fromIncome: 0, interestSaving: 0 };
    var saveRate = interestSavingRate(bvreTaxProfile(i), loan);
    var cumOwner = upfront, cumRenter = upfront;
    var rows = [], yr = null, first = null, last = null, ranOut = null;
    for (var m = 1; m <= n; m++) {
      var idx = s0 + m - 1, cy = Math.floor(idx / 12);
      if (!yr) yr = { year: cy, months: 0, first: rows.length === 0, toDate: false, interest: 0, principal: 0, tax: 0, ins: 0,
                      maint: 0, owner: 0, rent: 0, btcBoughtUsd: 0, btcSoldUsd: 0, btcBought: 0, btcSold: 0, shortfall: 0 };
      var jl = julyOf(idx), vj = valueAt(jl);
      var interest = 0, principal = 0;
      if (bal > 0) {
        interest = bal * mr;
        principal = Math.min(pi - interest, bal);
        bal -= principal;
        if (bal < 1e-6) bal = 0;
      }
      var tax = vj * i.propTaxPct / 100 / 12;
      var ins = i.insurancePer400K * vj / 400000 / 12;
      var maint = vj * i.maintPct / 100 / 12;
      var owner = interest + principal + tax + ins + maint;
      var saving = interest * saveRate;   // the mortgage-interest deduction (PR 5c; 0 unless on)
      owner -= saving; t.interestSaving += saving;
      var rent = rent0 * rentIndexAt(S, jl) / z0;
      var diff = owner - rent;
      if (m === 1) first = { owner: owner, pi: interest + principal, tax: tax, ins: ins, maint: maint, rent: rent, diff: diff };
      if (m === n) last = { owner: owner, rent: rent, diff: diff };
      var price = priceFor(idx);
      var sf = 0;
      if (invest) {
        if (diff > 0) {
          var b = diff * (1 - tx) / price;
          btc += b; basis += diff; t.invested += diff; yr.btcBoughtUsd += diff; yr.btcBought += b;
        } else if (diff < 0) {
          var need = -diff, sell = need / (price * (1 - tx));
          if (sell <= btc) {
            // Average cost (PR 5b): the coins sold take their share of the basis.
            var out = btc > 0 ? basis * sell / btc : 0;
            realized += need - out; basis -= out;
            btc -= sell; t.sold += need; yr.btcSoldUsd += need; yr.btcSold += sell;
          }
          else {
            var cover = btc * price * (1 - tx);
            realized += cover - basis; basis = 0;
            t.sold += cover; yr.btcSoldUsd += cover; yr.btcSold += btc;
            sf = need - cover; btc = 0;
            if (!ranOut) ranOut = monthKey(idx);
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
      yr.months++; yr.interest += interest; yr.principal += principal; yr.tax += tax; yr.ins += ins; yr.maint += maint;
      yr.owner += owner; yr.rent += rent;
      cumOwner += owner;
      cumRenter += invest ? (owner + sf) : rent;
      if (idx % 12 === 11 || m === n) {
        // December rows are valued at December (Case-Shiller, the month's
        // close); the last row is "to date", valued as the cards are.
        var end = m === n;
        yr.toDate = end;
        yr.homeValue = end ? hs * csEnd[1] / cs0 : valueAt(idx);
        yr.btcPrice = end ? btcToday : (exactAt(S.btc, idx) || btcToday);
        yr.balance = bal; yr.equity = yr.homeValue - bal;
        yr.btcHeld = btc; yr.btcValue = btc * yr.btcPrice;
        yr.cumCashOutOwner = cumOwner; yr.cumCashOutRenter = cumRenter;
        yr.btcBasis = basis; yr.realized = realized; yr.monthsElapsed = m;   // PR 6c: the chart's If sold points
        rows.push(yr); yr = null;
      }
    }

    var o = {};
    var homeEnd = hs * csEnd[1] / cs0;
    var sellCosts = homeEnd * i.sellPct / 100;
    var houseHeld = homeEnd - bal;
    var houseIfSold = homeEnd - sellCosts - bal;
    var btcValue = btc * btcToday;
    var btcSaleCost = btcValue * tx;
    var btcIfSold = btcValue - btcSaleCost;

    o.sy = sy; o.startKey = monthKey(s0); o.endKey = monthKey(cur); o.houseKey = csEnd[0];
    o.months = n; o.investDiff = invest; o.method = i.method;
    o.homePrice = hs; o.homeEnd = homeEnd; o.homeGrowth = csEnd[1] / cs0;
    o.priceToRent = pr; o.rentDefault = rentDefault; o.rent0 = rent0;
    o.down = down; o.closing = closing; o.upfront = upfront; o.loan = loan; o.monthlyPI = pi; o.mortRate = i.mortRate;
    o.entryPrice = entryPrice; o.btcUpfront = btcUpfront; o.btcHeld = btc; o.btcToday = btcToday;
    o.first = first; o.last = last; o.ranOutKey = ranOut;
    o.btcValue = btcValue; o.btcSaleCost = btcSaleCost; o.btcIfSold = btcIfSold;
    o.balance = bal; o.sellCosts = sellCosts; o.houseHeld = houseHeld; o.houseIfSold = houseIfSold;
    o.equityPct = homeEnd > 0 ? Math.round((houseHeld / homeEnd) * 100) : 0;
    o.rows = rows;
    o.start = { homeValue: hs, balance: loan, btcValue: btcUpfront * entryPrice, btcBasis: upfront, realized: 0 };
    exitTaxes(o, i, homeEnd, sellCosts, hs + closing, n / 12, btcIfSold, basis, realized, houseIfSold, null);
    o.totals = t;
    o.cumCashOutOwner = cumOwner; o.cumCashOutRenter = cumRenter;
    o.rows = rows;
    return o;
  }

  // If sold, after tax (PR 5b, M7, M9): the house less its sale tax (the
  // exclusion off first), bitcoin less the tax on its gain, including the
  // gain on coins sold along the way. `real` is the Real view's divisor
  // (null: the retrospective, which is nominal).
  function exitTaxes(o, i, homeEnd, sellCosts, homeBasis, years, btcIfSold, btcBasis, realized, houseIfSold, realFn){
    var tp = bvreTaxProfile(i);
    var h = homeSaleTax(tp, homeEnd, sellCosts, homeBasis, years);
    var b = btcSaleTax(tp, btcIfSold, btcBasis, realized);
    o.taxProfile = tp;
    o.homeTax = h; o.btcTax = b; o.btcBasis = btcBasis; o.homeBasis = homeBasis;
    o.houseAfterTax = houseIfSold - h.tax;
    o.btcAfterTax = btcIfSold - b.tax;
    // Each year's point for the chart (PR 6c, M7): held, and if sold that
    // year after tax, as the cards value the end. o.start is the purchase.
    var tx = i.btcTxPct / 100;
    function point(r, yrs){
      var sc = r.homeValue * i.sellPct / 100, hPre = r.homeValue - sc - r.balance;
      var bPre = r.btcValue * (1 - tx);
      var ht = homeSaleTax(tp, r.homeValue, sc, homeBasis, yrs).tax, bt = btcSaleTax(tp, bPre, r.btcBasis, r.realized).tax;
      return { houseHeld: r.homeValue - r.balance, btcHeld: r.btcValue, houseIfSold: hPre, btcIfSold: bPre, houseAfter: hPre - ht, btcAfter: bPre - bt };
    }
    o.points = [point(o.start, 0)].concat(o.rows.map(function(r){ return point(r, r.monthsElapsed / 12); }));
    // Houses the bitcoin could buy outright: after its tax (PR 5b; was before).
    o.housesCanBuy = homeEnd > 0 ? Math.max(0, o.btcAfterTax / homeEnd) : 0;
    if (realFn && o.real) {
      o.real.houseAfterTax = realFn(o.houseAfterTax); o.real.btcAfterTax = realFn(o.btcAfterTax);
      o.real.homeTax = realFn(h.tax); o.real.btcTax = realFn(b.tax); o.real.homeExclusion = realFn(h.exclusion);
    }
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
  //  - Bitcoin's price each month follows the scenario's path (M3,
  //    scenarioMultiple above): its multiple of the Power Law trend moves
  //    in a straight line from today's multiple to the scenario's target
  //    at the horizon end, times the trend on that day. Purchases and
  //    sales pay the bitcoin transaction cost.
  //  - At the end, If sold (before tax, which is PR 5): house value −
  //    selling costs − loan balance; bitcoin value − the transaction cost.
  //    Held: before those costs. Real = nominal ÷ (1 + inflation)^years for
  //    every end value, one factor for both paths.
  //   i: { method 'mortgage'|'cash', scenario 'floor'|'stay'|'trend'|'upper',
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
    var defl = deflator(i.inflRate, horizonYrs);   // the shared deflator (PR 4f); the same expression as before
    function real(v){ return v / defl; }

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
    var target = scenarioTarget(i.scenario, mult0);
    function priceAt(m){ return scenarioMultiple(i.scenario, mult0, m / n) * plPrice(d0 + (m / 12) * 365.25); }

    var btcUpfront = upfront * (1 - tx) / btcNow;
    var btc = btcUpfront;
    var bal = loan;
    var basis = upfront, realized = 0;   // bitcoin's cost basis and the gain on coins sold along the way (PR 5b)
    var t = { interest: 0, principal: 0, tax: 0, ins: 0, maint: 0, owner: 0, rent: 0,
              invested: 0, sold: 0, shortfall: 0, spent: 0, fromIncome: 0, interestSaving: 0 };
    var saveRate = interestSavingRate(bvreTaxProfile(i), loan);
    var cumOwner = upfront, cumRenter = upfront;
    var rows = [], yr = null, first = null, last = null, ranOutMonth = null;
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
      var saving = interest * saveRate;   // the mortgage-interest deduction (PR 5c; 0 unless on)
      owner -= saving; t.interestSaving += saving;
      var rent = rent0 * Math.pow(1 + rg, k);
      var diff = owner - rent;
      if (m === 1) first = { owner: owner, pi: interest + principal, tax: tax, ins: ins, maint: maint, rent: rent, diff: diff };
      if (m === n) last = { owner: owner, rent: rent, diff: diff };
      var price = priceAt(m);
      var sf = 0;
      if (invest) {
        if (diff > 0) {
          var b = diff * (1 - tx) / price;
          btc += b; basis += diff; t.invested += diff; yr.btcBoughtUsd += diff; yr.btcBought += b;
        } else if (diff < 0) {
          var need = -diff, sell = need / (price * (1 - tx));
          if (sell <= btc) {
            // Average cost (PR 5b): the coins sold take their share of the basis.
            var out = btc > 0 ? basis * sell / btc : 0;
            realized += need - out; basis -= out;
            btc -= sell; t.sold += need; yr.btcSoldUsd += need; yr.btcSold += sell;
          }
          else {
            var cover = btc * price * (1 - tx);
            realized += cover - basis; basis = 0;
            t.sold += cover; yr.btcSoldUsd += cover; yr.btcSold += btc;
            sf = need - cover; btc = 0;
            if (ranOutMonth === null) ranOutMonth = m;
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
        yr.btcBasis = basis; yr.realized = realized; yr.monthsElapsed = m;   // PR 6c: the chart's If sold points
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
    o.first = first; o.last = last; o.ranOutMonth = ranOutMonth;
    o.btcNow = btcNow; o.mult0 = mult0; o.targetMult = target;
    o.btcUpfront = btcUpfront; o.btcHeld = btc; o.priceEnd = priceEnd;
    o.futureTrend = futureTrend; o.futureFloor = futureTrend * PL_FLOOR; o.futureUpper = futureTrend * UPPER_TARGET;
    o.impliedGrowthPct = (Math.pow(priceEnd / btcNow, 1 / horizonYrs) - 1) * 100;
    o.btcValue = btcValue; o.btcSaleCost = btcSaleCost; o.btcIfSold = btcIfSold;
    o.homeEnd = homeEnd; o.balance = bal; o.sellCosts = sellCosts; o.houseHeld = houseHeld; o.houseIfSold = houseIfSold;
    o.equityPct = homeEnd > 0 ? Math.round((houseHeld / homeEnd) * 100) : 0;
    o.real = {
      btcValue: real(btcValue), btcIfSold: real(btcIfSold), btcSaleCost: real(btcSaleCost), priceEnd: real(priceEnd),
      homeEnd: real(homeEnd), sellCosts: real(sellCosts), balance: real(bal),
      houseHeld: real(houseHeld), houseIfSold: real(houseIfSold)
    };
    o.deflator = defl;
    o.rows = rows;
    o.start = { homeValue: homePrice, balance: loan, btcValue: btcUpfront * btcNow, btcBasis: upfront, realized: 0 };
    exitTaxes(o, i, homeEnd, sellCosts, homePrice + closing, horizonYrs, btcIfSold, basis, realized, houseIfSold, real);
    o.totals = t;
    o.cumCashOutOwner = cumOwner; o.cumCashOutRenter = cumRenter;
    o.rows = rows;
    return o;
  }

  // ─── Ledger (built, not rendered; PR 6 renders it) ──────────────────
  // The retrospective's rows come from the same monthly loop as its cards
  // (bvreRetro): one per calendar year, the first from July of the start
  // year, the last "to date" and valued as the cards are. rePairQA's
  // ledgerCheck asserts final row = cards and equal cumulative cash out.
  function ledgerRetro(i){
    var o = bvreRetro(i);
    return { rows: o ? o.rows : [], cards: o };
  }

  // ═══════════════════════════════════════════════════════════════════
  // Bitcoin vs. Paying Down the Mortgage — the homeowner (series step 3)
  // MORTGAGE_PAYDOWN_DESIGN_2026-10-01.md (JM's rulings 2026-10-01: all
  // nine as recommended). Two households, the same house, the same loan,
  // the same cash out every month (M2):
  //   pay    — the extra cash (and any lump sum) goes to principal; once the
  //            loan is gone, the whole freed payment goes into bitcoin;
  //   hold   — the loan runs on schedule; the extra cash (and the lump sum)
  //            go into bitcoin; if the loan ends inside the horizon, the
  //            freed payment goes into bitcoin too.
  // The house is the same in both, so it drops out: the comparison is the
  // bitcoin held minus the loan still owed. Month by month, 365.25-day
  // years for the price path (M10). Bitcoin is bought at the month's price
  // less the trading cost; "if sold" sells at the horizon less the trading
  // cost and pays btcSaleTax on the gain over cost. With the deduction on,
  // each month's interest × interestSavingRate comes back as cash and is
  // invested in bitcoin, in both households.
  //   i: { balance, ratePct, yearsLeft, extra, lump, horizon, scenario,
  //        tp (tax profile), btcTxPct, growth (optional: a flat yearly
  //        rate that replaces the scenario path; the hurdle search uses it) }
  function paydownPrice(i, t){
    if (i.growth !== undefined && i.growth !== null) return Math.pow(1 + i.growth, t);
    return scenarioGrowthFactor(i.scenario || 'stay', t, i.horizon);
  }
  function paydownProjection(i){
    var H = Math.max(1, Math.round(numOr(i.horizon, 10))), months = H * 12;
    var B0 = Math.max(0, numOr(i.balance, 0)), mr = numOr(i.ratePct, 0) / 100 / 12;
    var n = Math.max(1, Math.round(numOr(i.yearsLeft, 25) * 12));
    var P = B0 > 0 ? mortgagePayment(B0, numOr(i.ratePct, 0), n / 12, 'le0') : 0;
    var X = Math.max(0, numOr(i.extra, 0)), L = Math.max(0, numOr(i.lump, 0));
    var tx = numOr(i.btcTxPct, PAIR_DEFAULTS.btcTxPct) / 100;
    var tp = i.tp || bvreTaxProfile({});
    var ded = interestSavingRate(tp, B0);
    function hh(){ return { bal: B0, units: 0, basis: 0, interest: 0, payoff: null }; }
    var a = hh(), b = hh();   // a: pay it down; b: hold bitcoin
    function buy(h, cash, price){ if (cash > 0) { h.units += cash * (1 - tx) / price; h.basis += cash; } }
    // Month 0: the lump sum.
    var p0 = paydownPrice(i, 0);
    var toLoan = Math.min(L, a.bal); a.bal -= toLoan; buy(a, L - toLoan, p0);
    if (a.bal <= 1e-6 && B0 > 0) { a.bal = 0; a.payoff = 0; }
    buy(b, L, p0);
    function step(h, budget, toPrincipalMax, price){
      // budget: the cash this household spends this month on the loan and bitcoin
      var spare = budget;
      if (h.bal > 0) {
        var int = h.bal * mr; h.interest += int;
        var owe = h.bal + int, pay = Math.min(owe, toPrincipalMax);
        h.bal = owe - pay; spare -= pay;
        if (h.bal <= 1e-6) { h.bal = 0; if (h.payoff === null) h.payoff = h._m; }
        buy(h, int * ded, price);   // the deduction's tax saving, if any
      }
      buy(h, spare, price);
    }
    var rows = [], snap = function(m){
      var price = paydownPrice(i, m / 12);
      function v(h){ var val = h.units * price, proceeds = val * (1 - tx), tax = btcSaleTax(tp, proceeds, h.basis).tax;
        return { balance: h.bal, btcValue: val, basis: h.basis, units: h.units, interest: h.interest,
                 held: val - h.bal, ifSold: proceeds - tax - h.bal, tax: tax }; }
      return { month: m, year: m / 12, price: price, pay: v(a), hold: v(b) };
    };
    rows.push(snap(0));
    for (var m = 1; m <= months; m++) {
      var price = paydownPrice(i, (m - 0.5) / 12);   // bought mid-month
      a._m = m; b._m = m;
      // Both households spend P + X every month while either loan runs.
      step(a, P + X, P + X, price);   // all of it may go to the loan
      step(b, P + X, P, price);       // only the scheduled payment goes to the loan
      if (m % 12 === 0) rows.push(snap(m));
    }
    var end = rows[rows.length - 1];
    return { payment: P, months: months, horizon: H, dedRate: ded,
             payoffPay: a.payoff, payoffHold: b.payoff,
             rows: rows, end: end,
             diffIfSold: end.hold.ifSold - end.pay.ifSold,
             diffHeld: end.hold.held - end.pay.held };
  }
  // The hurdle: the flat yearly bitcoin growth at which the two households
  // end level, if sold after tax (or held, before tax). Bisection; the
  // difference rises with growth because Hold owns its bitcoin earlier.
  function paydownHurdle(i, basis){
    var key = basis === 'held' ? 'diffHeld' : 'diffIfSold';
    function f(g){ var j = {}; for (var k in i) j[k] = i[k]; j.growth = g; return paydownProjection(j)[key]; }
    var lo = -0.95, hi = 3;
    if (f(lo) >= 0) return lo;
    if (f(hi) <= 0) return null;
    for (var k = 0; k < 70; k++) { var mid = (lo + hi) / 2; if (f(mid) > 0) hi = mid; else lo = mid; }
    return (lo + hi) / 2;
  }
  // The hurdle's record: over every run of `years` between two month-end
  // closes in BTC_MONTHLY (2011 on), how often bitcoin's average yearly
  // growth beat `rate`. The price record, not a forecast; the runs overlap.
  function hurdleHistory(rate, years, series){
    var S = series || (typeof BTC_MONTHLY !== 'undefined' ? BTC_MONTHLY : null);
    if (!S || !S.length) return null;
    var k = Math.round(years * 12), out = { years: years, rate: rate, count: 0, beat: 0, worst: null, best: null, worstStart: null, first: null, last: null };
    for (var j = 0; j + k < S.length; j++) {
      var c = Math.pow(S[j + k][1] / S[j][1], 12 / k) - 1;
      out.count++; if (c > rate) out.beat++;
      if (out.worst === null || c < out.worst) { out.worst = c; out.worstStart = S[j][0]; }
      if (out.best === null || c > out.best) out.best = c;
      if (out.first === null) out.first = S[j][0];
      out.last = S[j + k][0];
    }
    out.share = out.count ? out.beat / out.count : null;
    return out;
  }

  // ═══════════════════════════════════════════════════════════════════
  // Compare Housing Plans — two housing plans, side by side (series step 4)
  // PAGE_IDEAS_BACKLOG "Compare Housing Plans"; the Compare Retirement Plans
  // pattern (SITE_GUIDE §52) on the pair's engine. Two households start with
  // the same savings and spend the same every month (equal cash out, M2):
  //   - Savings at the start: the larger of the two plans' up-front needs.
  //     Each plan pays its own up front (a down payment plus closing costs,
  //     if it buys today) and puts the rest into bitcoin.
  //   - Each month both spend what the dearer plan's housing costs that
  //     month (cashRule 'max'); the cheaper plan buys bitcoin with the
  //     difference. cashRule 'a' makes plan A set the budget, so the other
  //     plan sells bitcoin when its costs run higher; with A buying and B
  //     renting the same house, that is bvreProjection exactly (parity QA).
  //   - A plan that buys later rents the house it will buy (market rent:
  //     its price today ÷ 12 ÷ price-to-rent, growing at rent growth) and,
  //     at the start of its purchase year, buys at that year's price,
  //     paying the down payment and closing costs by selling bitcoin.
  //   - Owning costs P&I + property tax + insurance + maintenance, the last
  //     three following the home's value, stepped once a year, less the
  //     mortgage-interest deduction if on: bvreProjection's costs.
  //   - Money a plan needs and doesn't have (bitcoin run out) comes from
  //     income: it is reported and counted against that plan's end value.
  //   - The end: each plan's house if sold, after selling costs, the loan
  //     and tax (homeSaleTax, years owned), plus its bitcoin if sold, after
  //     the trading cost and tax (btcSaleTax). Bitcoin's price follows the
  //     scenario path exactly as bvreProjection's.
  //   i: { horizonYrs, btcNow, scenario, homeApprNominal, rentGrowth (|null),
  //        inflRate, closingPct, propTaxPct, insurancePer400K, maintPct,
  //        sellPct, btcTxPct, tp (tax profile), cashRule 'max'|'a',
  //        plans: [ { kind 'buy'|'rent', buyYear (0 = today), homePrice,
  //                   dpf (0..1; 1 = cash), mortRate } ×2 ] }
  function housingCompare(i){
    var D = PAIR_DEFAULTS;
    var H = i.horizonYrs, n = Math.round(H * 12);
    var g = i.homeApprNominal / 100;
    var rg = ((i.rentGrowth === null || i.rentGrowth === undefined) ? i.homeApprNominal : i.rentGrowth) / 100;
    var tx = i.btcTxPct / 100, btcNow = i.btcNow;
    var tp = i.tp || bvreTaxProfile({});
    var per400 = numOr(i.insurancePer400K, D.insurancePer400K);
    var d0 = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var mult0 = btcNow / plPrice(d0);
    // i.growth (optional): a flat yearly rate from today's price instead of the scenario path (the page's plain what-ifs)
    var flat = i.growth !== undefined && i.growth !== null;
    function priceAt(m){ return flat ? btcNow * Math.pow(1 + i.growth, m / 12) : scenarioMultiple(i.scenario, mult0, m / n) * plPrice(d0 + (m / 12) * 365.25); }
    var rule = i.cashRule === 'a' ? 'a' : 'max';

    var P = i.plans.map(function(q){
      var buyM = q.kind === 'buy' ? Math.max(0, Math.round(numOr(q.buyYear, 0))) * 12 : Infinity;
      return { q: q, buyM: buyM, owned: false, bal: 0, mr: q.mortRate / 100 / 12, pi: 0, save: 0, loan: 0,
               homeBasis: 0, buyPrice: null, boughtAtMonth: null, btc: 0, basis: 0, realized: 0, shortfall: 0,
               cum: 0, upfront0: 0, rent0: q.homePrice / (12 * D.priceToRent), ins0: per400 * q.homePrice / 400000,
               t: { interest: 0, principal: 0, tax: 0, ins: 0, maint: 0, rent: 0, saving: 0, bought: 0, sold: 0 },
               rows: [], first: null };
    });
    function buy(S, m){   // purchase at the start of month m+1 (m = 12 × buyYear)
      var k = m / 12, price = S.q.homePrice * Math.pow(1 + g, k);
      var cash = S.q.dpf >= 1;
      var down = cash ? price : price * S.q.dpf, closing = price * i.closingPct / 100;
      S.loan = cash ? 0 : price - down; S.bal = S.loan;
      S.pi = S.loan > 0 ? mortgagePayment(S.loan, S.q.mortRate, 30, 'le0') : 0;
      S.save = interestSavingRate(tp, S.loan);
      S.owned = true; S.buyPrice = price; S.homeBasis = price + closing; S.boughtAtMonth = m;
      S.down = down; S.closing = closing;
      return down + closing;
    }
    // Up front, today
    P.forEach(function(S){ if (S.buyM === 0) S.upfront0 = buy(S, 0); });
    var savings = rule === 'a' ? P[0].upfront0 : Math.max(P[0].upfront0, P[1].upfront0);
    P.forEach(function(S){
      var spare = savings - S.upfront0;
      if (spare > 0) { S.btc = spare * (1 - tx) / btcNow; S.basis = spare; }
      else if (spare < 0) S.shortfall += -spare;
      S.cum = savings;
    });
    function sellFor(S, need, price){   // sell bitcoin for `need` dollars, average cost; the rest from income
      if (need <= 0) return;
      var sell = need / (price * (1 - tx));
      if (sell <= S.btc) {
        var out = S.btc > 0 ? S.basis * sell / S.btc : 0;
        S.realized += need - out; S.basis -= out; S.btc -= sell; S.t.sold += need;
      } else {
        var cover = S.btc * price * (1 - tx);
        S.realized += cover - S.basis; S.basis = 0; S.t.sold += cover;
        S.shortfall += need - cover; S.btc = 0;
      }
    }
    function snap(S, m, price){
      var yrs = m / 12, homeV = S.owned ? S.q.homePrice * Math.pow(1 + g, yrs) : 0;
      var sc = homeV * i.sellPct / 100, hPre = S.owned ? homeV - sc - S.bal : 0;
      var ht = S.owned ? homeSaleTax(tp, homeV, sc, S.homeBasis, (m - S.boughtAtMonth) / 12).tax : 0;
      var bv = S.btc * price, bPre = bv * (1 - tx), bt = btcSaleTax(tp, bPre, S.basis, S.realized).tax;
      return { month: m, year: yrs, owned: S.owned, homeValue: homeV, balance: S.bal, sellCosts: sc,
               houseHeld: S.owned ? homeV - S.bal : 0, houseIfSold: hPre, houseTax: ht, houseAfter: hPre - ht,
               btcHeld: S.btc, btcValue: bv, btcIfSold: bPre, btcTax: bt, btcAfter: bPre - bt, btcBasis: S.basis,
               shortfall: S.shortfall, cumCashOut: S.cum,
               held: (S.owned ? homeV - S.bal : 0) + bv - S.shortfall,
               after: hPre - ht + bPre - bt - S.shortfall };
    }
    P.forEach(function(S){ S.rows.push(snap(S, 0, btcNow)); });
    for (var m = 1; m <= n; m++) {
      var k = Math.floor((m - 1) / 12), price = priceAt(m);
      var costs = P.map(function(S){
        if (!S.owned && S.buyM === m - 1 && m - 1 > 0) { var need = buy(S, m - 1); sellFor(S, need, price); }
        var c;
        if (S.owned) {
          var vk = S.q.homePrice * Math.pow(1 + g, k);
          var interest = 0, principal = 0;
          if (S.bal > 0) { interest = S.bal * S.mr; principal = Math.min(S.pi - interest, S.bal); S.bal -= principal; if (S.bal < 1e-6) S.bal = 0; }
          var tax = vk * i.propTaxPct / 100 / 12, ins = S.ins0 * Math.pow(1 + g, k) / 12, maint = vk * i.maintPct / 100 / 12;
          var saving = interest * S.save;
          c = interest + principal + tax + ins + maint - saving;
          S.t.interest += interest; S.t.principal += principal; S.t.tax += tax; S.t.ins += ins; S.t.maint += maint; S.t.saving += saving;
          if (!S.first) S.first = { kind: 'own', cost: c, pi: interest + principal, tax: tax, ins: ins, maint: maint };
        } else {
          c = S.rent0 * Math.pow(1 + rg, k); S.t.rent += c;
          if (!S.first) S.first = { kind: 'rent', cost: c };
        }
        return c;
      });
      var budget = rule === 'a' ? costs[0] : Math.max(costs[0], costs[1]);
      P.forEach(function(S, j){
        var diff = budget - costs[j];
        if (diff > 0) { S.btc += diff * (1 - tx) / price; S.basis += diff; S.t.bought += diff; }
        else if (diff < 0) sellFor(S, -diff, price);
        S.cum += budget;
        if (m % 12 === 0 || m === n) S.rows.push(snap(S, m, price));
      });
    }
    var out = P.map(function(S){
      var e = S.rows[S.rows.length - 1];
      return { plan: S.q, end: e, rows: S.rows, first: S.first, totals: S.t, savings: savings, upfront0: S.upfront0,
               boughtAtMonth: S.boughtAtMonth, buyPrice: S.buyPrice, down: S.down || 0, closing: S.closing || 0,
               loan: S.loan, pi: S.pi, shortfall: S.shortfall, cumCashOut: S.cum };
    });
    var defl = deflator(i.inflRate, H);
    return { plans: out, deflator: defl, months: n, savings: savings, rule: rule,
             diffAfter: out[1].end.after - out[0].end.after, diffHeld: out[1].end.held - out[0].end.held,
             priceEnd: priceAt(n), impliedGrowthPct: (Math.pow(priceAt(n) / btcNow, 1 / H) - 1) * 100 };
  }

  window.RealEstateModel = {
    // shared primitives
    mortgagePayment: mortgagePayment,
    amortizeBalance: amortizeBalance,
    deflator: deflator,
    toReal: toReal,
    // BvRE
    bvreRetro: bvreRetro,
    bvreProjection: bvreProjection,
    ledgerRetro: ledgerRetro,
    retroSeries: retroSeries,
    startYearPrice: startYearPrice,
    priceToRentForYear: function(y, S){ return priceToRentForYear(S || retroSeries(), y); },
    PAIR_DEFAULTS: PAIR_DEFAULTS,
    // BvRP defaults and dated rates (PR 4d: M8, item 12)
    RENTAL_DEFAULTS: RENTAL_DEFAULTS,
    YIELD_RATES: YIELD_RATES,
    // bitcoin scenarios (M3), shared by both pages
    SCENARIOS: SCENARIOS,
    UPPER_TARGET: UPPER_TARGET,
    scenarioTarget: scenarioTarget,
    scenarioMultiple: scenarioMultiple,
    cyclePeakMultiples: cyclePeakMultiples,
    upperRecordText: upperRecordText,
    // BvRP (original names kept so the page's aliases read 1:1)
    STATE_CAPGAIN: STATE_CAPGAIN,
    STATE_PROP_TAX_RATE: STATE_PROP_TAX_RATE,
    federalLTCG: federalLTCG,
    niitApplies: niitApplies,
    ordinaryRate: ordinaryRate,
    gainRate: gainRate,
    recaptureRate: recaptureRate,
    depreciationPlan: depreciationPlan,
    yieldYears: yieldYears,
    HOME_EXCLUSION: HOME_EXCLUSION,
    homeSaleTax: homeSaleTax,
    btcSaleTax: btcSaleTax,
    bvreTaxProfile: bvreTaxProfile,   // PR 8: rePairQA.taxParityCheck
    rentalIfSold: rentalIfSold,
    pathIfSold: pathIfSold,
    currentBTCMultiple: currentBTCMultiple,
    scenarioGrowthFactor: scenarioGrowthFactor,
    effectiveCAGR: effectiveCAGR,
    calcRentalAnnualCF: calcRentalAnnualCF,
    calcRentalExit: calcRentalExit,
    existingLoan: existingLoan,
    rentalYears: rentalYears,
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
    ledgerRental: function(s, scenarioOverride){ return { rows: calcWealthTrajectory(s, scenarioOverride), cards: computeAll(s) }; },
    rentalLedger: rentalLedger,
    calcIfSoldTrajectory: calcIfSoldTrajectory,
    // Bitcoin vs. Paying Down the Mortgage (series step 3)
    interestSavingRate: interestSavingRate,
    paydownProjection: paydownProjection,
    paydownHurdle: paydownHurdle,
    hurdleHistory: hurdleHistory,
    // Compare Housing Plans (series step 4)
    housingCompare: housingCompare
  };
})();
