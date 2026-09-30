/* ============================================================
   rePairQA — byte-identity tripwire for the real-estate pair
   ============================================================
   REAL_ESTATE_PAIR_DESIGN.md §6 / §11; Phase 0 report §j vectors.
   Console function in the house of evParityQA / crpParityQA.

   Loading: not part of the pages' bundles. Served at
   /qa/real-estate-qa.js (.eleventy.js passthrough) and injected only
   when the URL carries ?qa (shared/real-estate-qa-loader.js).

   Usage (browser console, on /bitcoin-vs-real-estate?qa or
   /bitcoin-vs-rental-property?qa):
       await rePairQA.run()                 // hashes every vector
       await rePairQA.run({ expect: {...} }) // PASS/FAIL against hashes
       rePairQA.ledgerCheck()               // ledger final row = cards
       rePairQA.parityCheck()               // same shared inputs, same
                                            // house-side figures (PR 4f)
       rePairQA.taxParityCheck()            // same shared tax inputs, same
                                            // tax on both pages (PR 8)
       await rePairQA.booksCheck()          // ledger = stat block = chart;
                                            // equal cash out (PR 8)
       await rePairQA.all()                 // all of the above

   It drives the page's own controls (so the real call paths run,
   not just the engine), pins everything that varies between loads,
   and hashes the rendered output:
     - Date.now → 2026-09-27T12:00Z; BTC → $100,000 (fwdBtcNow and, for
       the retrospective, TODAY_PRICE on BvRE; TODAY_PRICE on BvRP);
       ModelingAssumptions → inflation
       m2-growth, homeApprNominal since-2000, realReturns diversified (on
       BvRP too since PR 4f, whose Real view reads the inflation);
     - captures result-container innerHTML and Chart.js dataset arrays
       (labels, data at full precision, hidden flags);
     - hashes each vector's capture (FNV-1a 32) and all of them
       together (digest).
   State it touches (inputs, MA presets, URL, lcs.bvre.calc.v2,
   Date.now, TODAY_PRICE) is saved and restored at the end.

   The same file is pasted into the console on the pre-refactor page
   to produce the "before" hashes; the refactor PR records both.

   Vector mapping across PRs (a figure-changing PR compares like with
   like by vector ID; where a control's meaning changes, it is noted here):
     PR 4a (M1, M10) — `appr` is now NOMINAL home appreciation. The pinned
       dimension is homeApprNominal (was the real `realEstate`). E6–E11 and
       E13 carry the new default, 4.68 (was 3.5 real, 10.23% nominal at
       M2); E12 keeps its number, 1.0, now nominal. BvRP vectors gain
       `appr` 4.68 (was a hardcoded 3.0).
     PR 4b (M2, M4–M6) — the projection's cards are rebuilt for equal
       cash out and the "Go deeper" panel and Total Comparison are gone, so
       captureProj() captures the cards and the cash-out line. The default
       home price is 415000 (was 420000); rent blank = market rent. The
       `advanced` flag is retired: E10 (was cash + S&P leg) and E11 (was
       mortgage + DCA, rent 1,500) keep their other inputs and run with
       the difference invested, the new default. New: E14 (difference not
       invested), E15 (no closing, selling or bitcoin costs), E16 (rent
       growth 2%), E17 (the pre-4b tax and insurance: 1.2%, $1,800/yr).
       BvRP vectors gain `sell` 6.6 (was a hardcoded 8) and `btctx` 0.5;
       new P13 runs Path 1 at the old 8% and no bitcoin cost.
     PR 4c (M3) — one scenario set on both pages (floor, stay, trend, upper),
       each moving the multiple of trend in a straight line to its target at
       the horizon end. The default is `stay` (was `trend`), and BvRE's upper
       target is 2.5× (was 3×; BvRP's already was). BvRE: PROJ_BASE moves to
       `stay`, so every projection vector that doesn't name a scenario now
       runs under Stay. Like with like against 4b: new E18 (trend) is 4b's
       E6; E8a (floor) is unchanged; E8b (upper) moves to 2.5×. New E19
       captures the scenario line and the Stay button under each scenario.
       BvRP: RP_BASE moves to `stay`; P5a is now trend (it was stay, which
       is now P1); new P5c is floor. BvRP captures include the chips and the
       chart, which gain Floor, so no BvRP vector is byte-comparable with
       4b: compare the tables.
     PR 4d (item 12, M8; BvRP only) — the third yield slice is stablecoin
       lending at the dated rate (4.0%; was Ledn at 5%), keyed `lend` (was
       `ledn`), and the $500K example and worked tax example move to 6.6%
       selling costs, so S-bvrp also captures the rate spans and the rates
       disclosure. M8: every path carries or repays the existing mortgage;
       RP_BASE gains the rate (4.4) and years left (20). New: P14 (no
       mortgage: every figure as before M8), P15 (5 years left, so payments
       stop inside the horizon), P16 (Path 1, a $450K mortgage the sale
       doesn't cover). A fix in the same PR: states with no tax on the gain
       (TX, FL, NV, WA, TN, NH, AK, WY, SD) were charged the 5% typical rate
       on the sale; only P8 (TX) moves.
     PR 4e (M11, M4, M2, M6, P8; BvRE only) — the retrospective is rebuilt:
       monthly from July of the start year to today, the house on Case-Shiller,
       market rent from Zillow, equal cash out, the M6 costs; its cards take
       the projection's layout. BvRE's end price is now pinned too:
       TODAY_PRICE → $100,000, as on BvRP, and captureRetro() drops the
       price-source note ("live" or not), which depends on the network. The
       "Go deeper" DCA is retired: E2 (was DCA on) is now the difference not
       invested, the M2 toggle off; E5 drops its DCA. captureRetro() captures
       the assumptions, the cards and the cash-out line. New: E20 (a 2024
       start, one of the years 4e adds) and E21 (rent $4,000 on a 2021
       start: the renter's bitcoin runs out in 2023). No retrospective vector
       is comparable with 4d. S-bvre moves because the growth-of-$1 and
       every-starting-year exhibits now grow housing by Case-Shiller (M11).
       ledgerCheck() is rebuilt for the monthly rows. BvRP is unchanged.
     PR 4f (design §7; rulings M1, P5) — one Baseline assumptions binder
       for the sitewide inputs on both pages (shared/real-estate-baseline.js).
       BvRE: every vector is unchanged (the projection's deflator is now
       RealEstateModel.deflator, the same expression); new E22 (a custom 2.5%
       deflator) and E23 (Shadow Stats, 8%) exercise the binder's other
       presets. BvRP's appreciation field is `rpHomeAppreciation` (was
       `calc-appreciation`). New parityCheck(): the engine's house-side
       figures for the same shared inputs, as each page computes them.
       Then BvRP gains the Real view, whose default is Real (BvRE's is too).
       RP_BASE pins the Nominal display and the deflator, so P1–P16 are
       byte-comparable with 4e: the Nominal view renders exactly as before.
       New: P17–P24, the Real view (defaults; Paths 1, 2 and 3; a CPI
       deflator; a custom 0% deflator, which must equal Nominal in every
       figure; a 30-year hold; the first-3-years chart).
     PR 5a (M9; BvRP only) — the rental page's tax corrections: recapture at
       min(bracket, 25%) and never above the gain, depreciation on the
       original building basis, state tax (and NIIT where it applies) on
       rental income and lending interest, and the STRC/SATA return-of-
       capital basis. Every BvRP vector moves except P9 (no taxable rental
       income, no HELOC draw) and S-bvrp; BvRE is unchanged.
     PR 5b (M7, M9) — tax on a sale, both pages. BvRE's cards lead with the
       after-tax figure, if sold (the home-sale exclusion, bitcoin's gain over
       its cost basis, coins sold along the way), and "houses it could buy"
       uses the after-tax figure: every retrospective and projection vector
       moves except E19 (the scenario line). BvRP's headline, chips and table
       compare the two sides if sold at year N, after tax: every vector moves
       except S-bvrp. Both pages pin the tax profile (United States, married
       filing jointly, 24%, typical state; R7). New: E25 (no capital-gains
       tax), E26 (a $1.5M house, 20 years, single: the gain exceeds the
       exclusion), P25 (no capital-gains tax), P26 (Path 1, 20 years, 35%,
       NIIT applies).
     PR 5c (BvRE) — where the bitcoin is held, the mortgage-interest
       deduction and a Custom regime, all off by default: every vector is
       unchanged. setTax() also resets the three. New: E27 (bitcoin in a
       tax-advantaged account), E28 (mortgage interest deducted), E29 (Custom:
       home 20% above a $0 exemption, bitcoin 15%).
     PR 6a — "Show the calculation" on both pages. The ledger renders in its
       own container, so every vector is unchanged. New: E30 (the look-back's
       ledger, 2017) and E31 (the projection's, defaults), P27 (Path 4) and
       P28 (Path 2): each hashes the ledger's CSV (RealEstateLedger.toCsv),
       without its URL line.
     PR 6b (BvRP; M7, P4) — the chart values each year if sold, after tax,
       by default, with a Held toggle and a difference line (dataset 5).
       Every BvRP vector's chart capture moves (the other captures don't);
       BvRE is unchanged. RP_BASE pins the basis; new P29 is the Held chart.
       Checked: the If sold line's last point equals the table's after-tax
       total on every path.
     PR 6c (BvRE) — a wealth chart in both calculators, If sold after tax by
       default, Held, the difference and (projection) the Floor faintly. The
       charts render in their own blocks, so every vector is unchanged. New:
       E32 (the look-back's chart, 2017) and E33 (the projection's, defaults),
       hashing RealEstateChart.data(). Checked: each chart's last point equals
       the cards, in both frames.
     PR 7 (R9, P1) — the sensitivity grid on both pages, in its own block:
       every vector is unchanged. New: E34 and E35 (the projection's grid,
       scenario × home prices and horizon × mortgage rate), P30 and P31
       (scenario × home prices and holding period × net yield), hashing each
       grid's values. Checked: the reader's cell equals the cards (BvRE) and
       the headline (BvRP).
     PR 8 (design §11, §12) — no vector moves. The parity tripwire is
       finished: taxParityCheck() (the shared tax inputs give the same rate
       and the same tax on both pages) and booksCheck() (on each page, every
       scenario, both frames and both valuation bases: ledger = stat block =
       chart, the difference line = bitcoin minus the house, and BvRE's
       equal cash out, M2). all() runs everything. run()'s save-and-restore
       moved into session(), which booksCheck() shares; run()'s output is
       unchanged.
   ============================================================ */
(function(){
  if (typeof window === 'undefined') return;

  var FIXED_NOW = Date.UTC(2026, 8, 27, 12, 0, 0);
  var FIXED_BTC = 100000;

  function fnv(str){
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return ('00000000' + h.toString(16)).slice(-8);
  }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  function el(id){ return document.getElementById(id); }
  function fire(node, type){ node.dispatchEvent(new Event(type, { bubbles: true })); }
  function setVal(id, v, types){
    var n = el(id); if (!n) return;
    n.value = v;
    (types || ['input']).forEach(function(t){ fire(n, t); });
  }
  function click(sel){ var n = document.querySelector(sel); if (n) n.click(); }
  function html(id){ var n = el(id); return n ? n.innerHTML : null; }
  function chartData(id){
    var c = el(id);
    if (!c || typeof Chart === 'undefined' || !Chart.getChart) return null;
    var ch = Chart.getChart(c); if (!ch) return null;
    return { labels: ch.data.labels, datasets: ch.data.datasets.map(function(d){
      return { label: d.label, data: d.data, hidden: !!d.hidden };
    }) };
  }
  function page(){
    if (el('calcYear') && el('fwdHomePrice')) return 'bvre';
    if (el('calc-headline')) return 'bvrp';
    return null;
  }

  // ─── BvRE ──────────────────────────────────────────────────────────
  var RETRO_BASE = { year: '2017', mode: 'leverage', invest: true, home: '', rent: '', rate: '', down: '' };
  var RETRO = [
    { id: 'E1', desc: 'retro 2017, leverage, 20% down' },
    { id: 'E2', desc: 'retro 2017, difference not invested (was DCA on)', invest: false },
    { id: 'E3', desc: 'retro 2014, cash', year: '2014', mode: 'cash' },
    { id: 'E4', desc: 'retro 2021, rate 3%, rent $2,000, 10% down', year: '2021', rate: '3', rent: '2000', down: '10' },
    { id: 'E5', desc: 'retro 2019, home $750,000 (was + DCA on)', year: '2019', home: '750000' },
    { id: 'E20', desc: 'retro 2024 (a start year added in 4e)', year: '2024' },
    { id: 'E21', desc: 'retro 2021, rent $4,000 (the bitcoin runs out)', year: '2021', rent: '4000' }
  ];
  var PROJ_BASE = { scenario: 'stay', method: 'mortgage', down: '20', home: '415000', horizon: '10',
                    appr: '4.68', rate: '6.8', rent: '', rentg: '', close: '1.04', ptax: '0.9', ins: '',
                    maint: '1', sell: '6.6', btctx: '0.5', invest: true, display: 'real', infl: 'm2-growth',
                    regime: 'us', filing: 'mfj', bracket: '24', state: 'OTHER' };
  var PROJ = [
    { id: 'E6',  desc: 'proj defaults ($415K, 10y, stay, mortgage 20%, Real)' },
    { id: 'E7',  desc: 'proj defaults, Nominal display', display: 'nominal' },
    { id: 'E8a', desc: 'proj floor', scenario: 'floor' },
    { id: 'E8b', desc: 'proj upper (2.5× from 4c)', scenario: 'upper' },
    { id: 'E9a', desc: 'proj 5y, stay', horizon: '5' },
    { id: 'E9b', desc: 'proj 20y, stay', horizon: '20' },
    { id: 'E10', desc: 'proj cash purchase', method: 'cash' },
    { id: 'E11', desc: 'proj mortgage, rent $1,500', rent: '1500' },
    { id: 'E12', desc: 'proj down 3.5%, rate 7.5%, appr 1.0', down: '3.5', rate: '7.5', appr: '1.0' },
    { id: 'E13', desc: 'proj inflation cpi-official (3.5)', infl: 'cpi-official' },
    { id: 'E14', desc: 'proj, difference not invested', invest: false },
    { id: 'E15', desc: 'proj, no closing, selling or bitcoin costs', close: '0', sell: '0', btctx: '0' },
    { id: 'E16', desc: 'proj, rent growth 2%', rentg: '2' },
    { id: 'E17', desc: 'proj, pre-4b tax 1.2% and insurance $1,800/yr', ptax: '1.2', ins: '1800' },
    { id: 'E18', desc: 'proj trend (the pre-4c default)', scenario: 'trend' },
    { id: 'E19', desc: 'scenario line and Stay button, each scenario at defaults', growth: true },
    { id: 'E22', desc: 'proj, custom deflator 2.5% (PR 4f)', infl: 'custom', inflVal: 2.5 },
    { id: 'E23', desc: 'proj, Shadow Stats deflator 8% (PR 4f)', infl: 'shadow-stats' },
    { id: 'E25', desc: 'proj, no capital-gains tax (PR 5b)', regime: 'none' },
    { id: 'E26', desc: 'proj, $1.5M house, 20y, single: gain above the exclusion (PR 5b)', home: '1500000', horizon: '20', filing: 'single' },
    { id: 'E27', desc: 'proj, bitcoin in a tax-advantaged account (PR 5c)', account: 'advantaged' },
    { id: 'E28', desc: 'proj, mortgage interest deducted (PR 5c)', deduct: true },
    { id: 'E29', desc: 'proj, Custom: home 20% above $0, bitcoin 15% (PR 5c)', regime: 'custom', cHome: '20%', cExempt: '$0', cBtc: '15%' },
    { id: 'E30', desc: 'the look-back ledger, 2017 (PR 6a)', ledger: 'retro' },
    { id: 'E31', desc: 'the projection ledger, defaults (PR 6a)', ledger: 'proj' },
    { id: 'E32', desc: 'the look-back chart, 2017 (PR 6c)', chart: 'retro' },
    { id: 'E33', desc: 'the projection chart, defaults (PR 6c)', chart: 'proj' },
    { id: 'E34', desc: 'the grid, scenario x home prices (PR 7)', grid: 'scen' },
    { id: 'E35', desc: 'the grid, horizon x mortgage rate (PR 7)', grid: 'hr' }
  ];
  // A grid's values under one axis pair (PR 7).
  function captureGrid(id, pair){
    var n = el(id); if (!n) return null;
    var b = n.querySelector('[data-pair="' + pair + '"]'); if (b) b.click();
    var g = n._gridValues || null;
    var first = n.querySelector('.re-grid-axes [data-pair]'); if (first) first.click();   // back to the default pair
    return g;
  }
  // The ledger as its CSV, without the URL line (PR 6a).
  function captureLedger(id){
    var n = el(id); if (!n || !n._ledgerSpec || !window.RealEstateLedger) return null;
    return window.RealEstateLedger.toCsv(n._ledgerSpec).split('\n').filter(function(l){ return l.indexOf('# Live scenario URL') !== 0; }).join('\n');
  }

  // The deflator: a preset, or a custom value (PR 4f).
  function setInfl(x){
    var MA = window.ModelingAssumptions;
    if (!MA) return;
    if (x.infl === 'custom') MA.set('inflation', 'custom', x.inflVal); else MA.set('inflation', x.infl);
  }
  // BvRE's tax profile (PR 5b): one block for both calculators.
  function setTax(x){
    setVal('reTaxRegime', x.regime || 'us', ['change']); setVal('reFiling', x.filing || 'mfj', ['change']);
    setVal('reBracket', x.bracket || '24', ['change']); setVal('reState', x.state || 'OTHER', ['change']);
    setVal('reBtcAccount', x.account || 'taxable', ['change']);                       // PR 5c
    var d = el('reMortgageDeduction'); if (d && d.checked !== !!x.deduct) { d.checked = !!x.deduct; fire(d, 'change'); }
    setVal('reCustomHomeRate', x.cHome || '20%', ['change']); setVal('reCustomHomeExempt', x.cExempt || '$0', ['change']);
    setVal('reCustomBtcRate', x.cBtc || '20%', ['change']);
  }
  function applyRetro(v){
    var x = Object.assign({}, RETRO_BASE, v);
    setTax(x);
    click('.toggle-group .toggle-btn[data-mode="' + x.mode + '"]');
    setVal('calcYear', x.year, ['change']);            // clears the custom inputs
    var d = el('calcInvestDiff');
    if (d.checked !== x.invest) { d.checked = x.invest; fire(d, 'change'); }
    setVal('customHomePrice', x.home); setVal('customRent', x.rent);
    setVal('customRate', x.rate); setVal('customDownPct', x.down);
  }
  // The price-source note ("(live)" or not) depends on the network, so it
  // is dropped before hashing; the pinned price itself is captured.
  function captureRetro(){
    var cards = html('calcResultsContainer');
    if (cards) cards = cards.replace(/(<span class="retro-price-src"[^>]*>)[^<]*(<\/span>)/g, '$1$2');
    return { assumptions: html('calcAssumptions'), cards: cards, cashOut: html('calcCashOutLine') };
  }
  function applyProj(v){
    var x = Object.assign({}, PROJ_BASE, v);
    var MA = window.ModelingAssumptions;
    setInfl(x); MA.set('homeApprNominal', 'since-2000'); MA.set('realReturns', 'diversified');
    setTax(x);
    click('.purchase-btn[data-method="' + x.method + '"]');   // also resets the advanced box
    click('.scenario-btn[data-scenario="' + x.scenario + '"]');
    click('.display-mode-btn[data-mode="' + x.display + '"]');
    setVal('fwdHorizon', x.horizon, ['change']);
    setVal('fwdBtcNow', String(FIXED_BTC));
    setVal('fwdHomePrice', x.home);
    setVal('fwdDownPct', x.down);
    setVal('fwdHomeAppreciation', x.appr);                    // input only: 'change' would write the MA custom value
    setVal('fwdMortgageRate', x.rate);
    setVal('fwdMonthlyRent', x.rent);
    setVal('fwdRentGrowth', x.rentg); setVal('fwdClosingPct', x.close); setVal('fwdPropTaxPct', x.ptax);
    setVal('fwdInsurance', x.ins); setVal('fwdMaintPct', x.maint); setVal('fwdSellPct', x.sell); setVal('fwdBtcTxPct', x.btctx);
    var inv = el('fwdInvestDiff');
    if (inv) { inv.checked = x.invest; fire(inv, 'change'); }
  }
  function captureProj(){
    return { results: html('fwdResults'), cashOut: html('fwdCashOutLine') };
  }
  function captureGrowth(){
    var up = document.querySelector('[data-upper-record]');
    return ['floor', 'stay', 'trend', 'upper'].map(function(sc){
      applyProj({ scenario: sc });
      return { scenario: sc, line: html('fwdScenarioGrowth'), stay: html('fwdStayMult'), upper: up ? up.textContent : null };
    });
  }
  function captureBvreStatic(){
    return { houses: html('housesVisual'), returnTable: html('returnTable'), returnEnd: html('returnTableEndPrices'),
             charts: ['eraBarChart', 'divergenceChart', 'globalAffordabilityChart', 'btcHouseChart',
                      'seesawChart', 'burdenChart', 'totalCostChart'].map(chartData) };
  }

  // ─── BvRP ──────────────────────────────────────────────────────────
  var RP_BASE = { path: '4', scenario: 'stay', value: '500000', yld: '4.4', hold: '10', basis: '60', held: '10',
                  state: 'OTHER', bracket: '24', ltv: '80', helocRate: '9.5', mortgage: '200000',
                  props: '3', retained: '2', port: [45, 30, 10, 15], appr: '4.68', sell: '6.6', btctx: '0.5',
                  mortRate: '4.4', mortYears: '20', display: 'nominal', infl: 'm2-growth', zoom: 'full', regime: 'us', chartBasis: 'ifsold' };
  var RP = [
    { id: 'P1',  desc: 'defaults (Path 4, stay, $500K, 4.4%, 10y, OTHER, 24%)' },
    { id: 'P2',  desc: 'Path 1', path: '1' },
    { id: 'P3',  desc: 'Path 2', path: '2' },
    { id: 'P4',  desc: 'Path 3', path: '3' },
    { id: 'P5a', desc: 'Path 4, trend (the pre-4c default)', scenario: 'trend' },
    { id: 'P5b', desc: 'Path 4, upper', scenario: 'upper' },
    { id: 'P5c', desc: 'Path 4, floor', scenario: 'floor' },
    { id: 'P6a', desc: 'Path 1, hold 1y', path: '1', hold: '1' },
    { id: 'P6b', desc: 'Path 1, hold 30y', path: '1', hold: '30' },
    { id: 'P7',  desc: 'Path 1, CA, 37%', path: '1', state: 'CA', bracket: '37' },
    { id: 'P8',  desc: 'Path 1, TX, 12%', path: '1', state: 'TX', bracket: '12' },
    { id: 'P9',  desc: 'Path 2, existing mortgage $450K', path: '2', mortgage: '450000' },
    { id: 'P10', desc: 'Path 3, 10 properties, 1 retained', path: '3', props: '10', retained: '1' },
    { id: 'P11a', desc: 'Path 4, portfolio 100/0/0/0', port: [100, 0, 0, 0] },
    { id: 'P11b', desc: 'Path 4, portfolio 0/0/0/100', port: [0, 0, 0, 100] },
    { id: 'P11c', desc: 'Path 4, portfolio 50/30/10/20 (sums to 110)', port: [50, 30, 10, 20] },
    { id: 'P12', desc: 'basis 20%, held 27y (depreciation cap)', basis: '20', held: '27' },
    { id: 'P13', desc: 'Path 1 at the pre-4b costs (selling 8%, no bitcoin cost)', path: '1', sell: '8', btctx: '0' },
    { id: 'P14', desc: 'Path 4, no existing mortgage', mortgage: '0' },
    { id: 'P15', desc: 'Path 4, mortgage with 5 years left', mortYears: '5' },
    { id: 'P16', desc: "Path 1, $450K mortgage the sale doesn't cover", path: '1', mortgage: '450000' },
    { id: 'P17', desc: 'Real view: defaults (Path 4, stay), M2 growth 6.5% (PR 4f)', display: 'real' },
    { id: 'P18', desc: 'Real view: Path 1', display: 'real', path: '1' },
    { id: 'P19', desc: 'Real view: Path 2', display: 'real', path: '2' },
    { id: 'P20', desc: 'Real view: Path 3', display: 'real', path: '3' },
    { id: 'P21', desc: 'Real view: CPI deflator 3.5%', display: 'real', infl: 'cpi-official' },
    { id: 'P22', desc: 'Real view: custom deflator 0% (every figure = Nominal)', display: 'real', infl: 'custom', inflVal: 0 },
    { id: 'P23', desc: 'Real view: Path 1, hold 30y', display: 'real', path: '1', hold: '30' },
    { id: 'P24', desc: 'Real view: first 3 years of the chart', display: 'real', zoom: 'first3' },
    { id: 'P25', desc: 'no capital-gains tax (PR 5b)', regime: 'none' },
    { id: 'P26', desc: 'Path 1, 20y, 35% bracket: NIIT applies (PR 5b)', path: '1', hold: '20', bracket: '35' },
    { id: 'P27', desc: 'the ledger, defaults (Path 4) (PR 6a)', ledger: true },
    { id: 'P28', desc: 'the ledger, Path 2 (PR 6a)', ledger: true, path: '2' },
    { id: 'P29', desc: 'the Held chart (PR 6b)', chartBasis: 'held' },
    { id: 'P30', desc: 'the grid, scenario x home prices (PR 7)', grid: 'scen' },
    { id: 'P31', desc: 'the grid, holding period x net yield (PR 7)', grid: 'hy' }
  ];
  function applyRp(v){
    var x = Object.assign({}, RP_BASE, v);
    // The sitewide values first: a change there re-renders from the store.
    setInfl(x);
    if (window.ModelingAssumptions) window.ModelingAssumptions.set('homeApprNominal', 'since-2000');
    click('.calc-frame-btn[data-mode="' + x.display + '"]');   // PR 4f
    click('.calc-chart-zoom-btn[data-zoom="' + x.zoom + '"]');
    click('.calc-chart-basis-btn[data-basis="' + x.chartBasis + '"]');   // PR 6b
    click('.calc-path-btn[data-path="' + x.path + '"]');
    setVal('rpHomeAppreciation', x.appr);                     // input only, as on BvRE
    setVal('calc-sell-cost', x.sell); setVal('calc-btc-tx', x.btctx);
    setVal('calc-property-value', x.value); setVal('calc-net-yield', x.yld); setVal('calc-holding-years', x.hold);
    setVal('calc-adjusted-basis', x.basis); setVal('calc-years-held', x.held);
    setVal('calc-state', x.state, ['change']); setVal('calc-bracket', x.bracket, ['change']);
    setVal('calc-tax-regime', x.regime, ['change']);   // PR 5b
    setVal('calc-heloc-ltv', x.ltv); setVal('calc-heloc-rate', x.helocRate); setVal('calc-existing-mortgage', x.mortgage);
    setVal('calc-mortgage-rate', x.mortRate); setVal('calc-mortgage-years', x.mortYears);
    setVal('calc-num-properties', x.props); setVal('calc-properties-retained', x.retained);
    ['strc', 'sata', 'lend', 'spot'].forEach(function(k, i){ setVal('calc-port-' + k, String(x.port[i])); });
    click('.calc-cagr-chip[data-scenario="' + x.scenario + '"]');
  }
  function captureRp(){
    var c = { headline: html('calc-headline'), compHead: html('calc-comparison-headers'), comp: html('calc-comparison-body'),
             detail: html('calc-path-detail'), callout: html('calc-specific-callout'), desc: html('calc-path-description'),
             chips: html('calc-cagr-chips'), multiple: html('calc-current-multiple'), chart: chartData('calc-chart') };
    // The Real view's own labels (PR 4f). Captured in the Real view only, so
    // a Nominal capture is the same object as before 4f and P1–P16 stay
    // byte-comparable.
    if (state_display() === 'real') {
      var q = function(id){ var n = el(id); return n ? n.textContent : null; };
      c.frame = { line: q('rpDeflatorLine'), chart: q('calc-chart-frame'), table: q('calc-comparison-frame'),
                  chips: el('calc-chips-frame') ? !el('calc-chips-frame').hidden : null };
    }
    return c;
  }
  function state_display(){ var b = document.querySelector('.calc-frame-btn.active'); return b ? b.getAttribute('data-mode') : null; }
  function captureRpStatic(){
    var q = function(sel){ return Array.prototype.map.call(document.querySelectorAll(sel), function(n){ return n.textContent; }); };
    return { plCagr: q('[data-pl-cagr]'), plStay: q('[data-pl-stay-fv]'),
             rates: q('[data-yr]'), example: q('[data-yr-ex]'), disclosure: html('calc-rates-rows') };
  }

  // ─── Session: pin, run, restore ───────────────────────────────────
  // Everything a run touches (Date.now, TODAY_PRICE, the projection's
  // price, the sitewide assumptions, BvRE's stored settings, the URL, the
  // reader's frame) is saved first and put back after, whatever happens.
  // `body` drives the page's controls synchronously.
  async function session(p, body){
    var saved = { now: Date.now, url: location.pathname + location.search + location.hash, store: null, ma: {}, today: window.TODAY_PRICE,
                  btcNow: el('fwdBtcNow') ? el('fwdBtcNow').value : null, display: state_display() };
    try { saved.store = localStorage.getItem('lcs.bvre.calc.v2'); } catch (e) {}
    if (window.ModelingAssumptions) ['inflation', 'homeApprNominal', 'realReturns'].forEach(function(d){ saved.ma[d] = window.ModelingAssumptions.get(d); });
    Date.now = function(){ return FIXED_NOW; };
    try {
      window.TODAY_PRICE = FIXED_BTC;                         // the retrospective's end price on BvRE (PR 4e); BvRP's price
      click('.tab-btn[data-tab="calculator"]');
      if (p === 'bvrp') await sleep(200);                     // BvRP's chart builds on tab activation
      body();
      if (p === 'bvre') {
        applyRetro({}); applyProj({});
        click('.calc-mode-label[data-mode="retrospective"]');
      } else {
        applyRp({});
        if (saved.display) click('.calc-frame-btn[data-mode="' + saved.display + '"]');   // the reader's frame (PR 4f)
      }
    } finally {
      Date.now = saved.now;
      window.TODAY_PRICE = saved.today;
      if (p === 'bvre') {
        if (saved.btcNow !== null) setVal('fwdBtcNow', saved.btcNow);   // the projection's price, as the reader had it
        if (window.runRetroCalc) window.runRetroCalc();
      }
      if (window.ModelingAssumptions) Object.keys(saved.ma).forEach(function(d){
        var m = saved.ma[d]; if (m && m.preset === 'custom') window.ModelingAssumptions.set(d, 'custom', m.value); else if (m) window.ModelingAssumptions.set(d, m.preset);
      });
      await sleep(400);                                       // let the debounced URL/storage writer run, then restore
      try { if (saved.store === null) localStorage.removeItem('lcs.bvre.calc.v2'); else localStorage.setItem('lcs.bvre.calc.v2', saved.store); } catch (e) {}
      history.replaceState(null, '', saved.url);
    }
  }
  async function settle(p, opts){
    // Let live fetches settle so they can't overwrite a pinned value mid-run:
    // the projection's status, and the shared fetcher's in-flight queue
    // (power-law-data.js), which the retrospective waits on (PR 4e).
    if (p === 'bvre') {
      for (var w = 0; w < 120 && (/loading/i.test((el('fwdBtcPriceStatus') || {}).textContent || '') || window.__lcsPriceQueue); w++) await sleep(250);
    } else {
      await sleep((opts && opts.settleMs) || 3000);
    }
  }

  // ─── Runner ────────────────────────────────────────────────────────
  async function run(opts){
    opts = opts || {};
    var p = page();
    if (!p) { console.error('rePairQA: not on a real-estate pair page'); return null; }
    await settle(p, opts);

    var rows = [], all = [];
    await session(p, function(){
      if (p === 'bvre') {
        click('.tab-btn[data-tab="calculator"]');
        var st = JSON.stringify(captureBvreStatic());
        rows.push({ id: 'S-bvre', desc: 'static exhibits (tabs I, II, IV)', hash: fnv(st), len: st.length }); all.push(st);
        click('.calc-mode-label[data-mode="retrospective"]');
        RETRO.forEach(function(v){ applyRetro(v); var s = JSON.stringify(captureRetro()); rows.push({ id: v.id, desc: v.desc, hash: fnv(s), len: s.length }); all.push(s); });
        click('.calc-mode-label[data-mode="projection"]');
        PROJ.forEach(function(v){
          var s;
          if (v.growth) s = JSON.stringify(captureGrowth());
          else if (v.ledger === 'retro') {
            click('.calc-mode-label[data-mode="retrospective"]'); applyRetro({});
            s = JSON.stringify(captureLedger('calcLedger'));
            click('.calc-mode-label[data-mode="projection"]');
          }
          else if (v.ledger === 'proj') { applyProj({}); s = JSON.stringify(captureLedger('fwdLedger')); }
          else if (v.chart === 'retro') {
            click('.calc-mode-label[data-mode="retrospective"]'); applyRetro({});
            s = JSON.stringify(window.RealEstateChart ? window.RealEstateChart.data('calc') : null);
            click('.calc-mode-label[data-mode="projection"]');
          }
          else if (v.chart === 'proj') { applyProj({}); s = JSON.stringify(window.RealEstateChart ? window.RealEstateChart.data('fwd') : null); }
          else if (v.grid) { applyProj({}); s = JSON.stringify(captureGrid('fwdGrid', v.grid)); }
          else { applyProj(v); s = JSON.stringify(captureProj()); }
          rows.push({ id: v.id, desc: v.desc, hash: fnv(s), len: s.length }); all.push(s);
        });
      } else {
        var s0 = JSON.stringify(captureRpStatic());
        rows.push({ id: 'S-bvrp', desc: 'Power Law copy spans', hash: fnv(s0), len: s0.length }); all.push(s0);
        RP.forEach(function(v){ applyRp(v); var s = JSON.stringify(v.ledger ? captureLedger('calc-ledger') : v.grid ? captureGrid('calc-grid', v.grid) : captureRp()); rows.push({ id: v.id, desc: v.desc, hash: fnv(s), len: s.length }); all.push(s); });
      }
    });

    var digest = fnv(all.join('\u0001'));
    var fails = [];
    if (opts.expect) rows.forEach(function(r){
      var e = opts.expect[r.id]; r.expected = e || '(none)'; r.match = e === r.hash;
      if (!r.match) fails.push(r.id);
    });
    console.table(rows);
    if (opts.expect) {
      if (!fails.length) console.log('%crePairQA PASS', 'color:#7fc47f;font-weight:bold', '— ' + rows.length + ' vectors byte-identical; digest ' + digest);
      else console.error('rePairQA FAIL', fails);
    } else {
      console.log('rePairQA digest ' + digest + ' (' + rows.length + ' vectors, page ' + p + ')');
    }
    return { page: p, fixedNow: new Date(FIXED_NOW).toISOString(), fixedBtc: FIXED_BTC, digest: digest,
             pass: opts.expect ? fails.length === 0 : null, fails: fails, rows: rows };
  }

  // Ledger final row = the card figures, and the rows add up to the totals
  // (PR 4e: the retrospective's monthly engine). Runs the engine directly
  // with the harness pins and each vector's inputs, parsed as the page does.
  function ledgerCheck(){
    var RE = window.RealEstateModel;
    if (!RE || typeof homeData === 'undefined' || typeof CS_NATIONAL === 'undefined') { console.error('rePairQA.ledgerCheck: needs RealEstateModel on BvRE'); return null; }
    var D = RE.PAIR_DEFAULTS, out = [], fails = [];
    function near(a, b){ return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b)); }
    RETRO.forEach(function(v){
      var x = Object.assign({}, RETRO_BASE, v), sy = +x.year;
      var L = RE.ledgerRetro({ sy: sy, method: x.mode === 'cash' ? 'cash' : 'mortgage', homePrice: x.home ? +x.home : homeData[sy],
        mortRate: x.rate ? +x.rate : mortgageRates[sy], dpf: (x.down ? +x.down : 20) / 100, rent: x.rent ? +x.rent : null,
        investDiff: x.invest, btcToday: FIXED_BTC, nowMs: FIXED_NOW, closingPct: D.closingPct, propTaxPct: D.propTaxPct,
        insurancePer400K: D.insurancePer400K, maintPct: D.maintPct, sellPct: D.sellPct, btcTxPct: D.btcTxPct });
      var c = L.cards, last = L.rows[L.rows.length - 1];
      var sum = function(k){ return L.rows.reduce(function(a, r){ return a + r[k]; }, 0); };
      var checks = {
        lastIsToDate: last.toDate === true && L.rows.filter(function(r){ return r.toDate; }).length === 1,
        months: sum('months') === c.months,
        homeValue: last.homeValue === c.homeEnd,
        balance: last.balance === c.balance,
        btcHeld: last.btcHeld === c.btcHeld,
        btcValue: last.btcValue === c.btcValue,
        cashOut: last.cumCashOutOwner === c.cumCashOutOwner && last.cumCashOutRenter === c.cumCashOutRenter,
        equalCashOut: !x.invest || c.totals.shortfall > 0 || near(c.cumCashOutOwner, c.cumCashOutRenter),
        rent: near(sum('rent'), c.totals.rent),
        ownerCosts: near(sum('owner'), c.totals.owner),
        interest: near(sum('interest'), c.totals.interest)
      };
      var ok = Object.keys(checks).every(function(k){ return checks[k]; });
      if (!ok) fails.push(v.id);
      out.push(Object.assign({ id: v.id, rows: L.rows.length, ok: ok }, checks));
    });
    console.table(out);
    if (!fails.length) console.log('%crePairQA.ledgerCheck PASS', 'color:#7fc47f;font-weight:bold');
    else console.error('rePairQA.ledgerCheck FAIL', fails);
    return { pass: fails.length === 0, fails: fails, rows: out };
  }

  // ─── Parity: the same shared inputs give the same house-side figures ───
  // (PR 4f; design §11's parity tripwire, its first half; PR 8 finishes it.)
  // Each vector is one house described in the pair's shared inputs: price,
  // nominal appreciation, horizon, selling costs, deflator, and a 30-year
  // loan. The check computes the house as each page's engine does, BvRE's
  // projection (bvreProjection) and BvRP's rental (calcRentalExit and
  // existingLoan, with the Real view's toReal), and asserts they agree:
  // value, selling costs, value less selling costs, the same in the Real
  // view, the deflator, and the loan's payment, interest and balance. The
  // arithmetic is shared, so value and costs must match exactly; the two
  // loan schedules are written differently and must agree to rounding.
  // Runs on either page (both load RealEstateModel).
  var PARITY = [
    { id: 'H1', desc: 'the BvRE default house: $415K, 4.68%, 10y, 6.6% selling, M2 6.5%, 20% down at 6.8%',
      price: 415000, appr: 4.68, years: 10, sell: 6.6, infl: 6.5, downPct: 20, rate: 6.8 },
    { id: 'H2', desc: '$500K, long run 3.41%, 20y, CPI 3.5%, 10% down at 7.5%',
      price: 500000, appr: 3.41, years: 20, sell: 6.6, infl: 3.5, downPct: 10, rate: 7.5 },
    { id: 'H3', desc: '$750K cash, 1%, 5y, no selling costs, no inflation',
      price: 750000, appr: 1, years: 5, sell: 0, infl: 0, downPct: 100, rate: 6.8 },
    { id: 'H4', desc: '$300K, 6%, 15y, 10% selling, Shadow Stats 8%, 3.5% down at 4%',
      price: 300000, appr: 6, years: 15, sell: 10, infl: 8, downPct: 3.5, rate: 4 }
  ];
  function parityCheck(){
    var RE = window.RealEstateModel;
    if (!RE || !RE.bvreProjection || !RE.calcRentalExit) { console.error('rePairQA.parityCheck: needs RealEstateModel'); return null; }
    var D = RE.PAIR_DEFAULTS, out = [], fails = [], savedNow = Date.now;
    function near(a, b){ return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }
    Date.now = function(){ return FIXED_NOW; };
    try {
      PARITY.forEach(function(v){
        var cash = v.downPct >= 100, loan = cash ? 0 : v.price * (1 - v.downPct / 100);
        // BvRE, as its projection computes the house.
        var P = RE.bvreProjection({ method: cash ? 'cash' : 'mortgage', scenario: 'stay', horizonYrs: v.years, btcNow: FIXED_BTC,
          homePrice: v.price, homeApprNominal: v.appr, inflRate: v.infl, mortRate: v.rate, dpf: v.downPct / 100,
          rent: null, rentGrowth: null, closingPct: D.closingPct, propTaxPct: D.propTaxPct, insurance: null,
          maintPct: D.maintPct, sellPct: v.sell, btcTxPct: D.btcTxPct, investDiff: true });
        // BvRP, as its rental computes the same house and loan.
        var s = { propertyValue: v.price, appreciationPct: v.appr, sellCostPct: v.sell, yearsAlreadyHeld: 0, adjustedBasisPct: 100,
                  federalBracketPct: 24, stateCode: 'OTHER', existingMortgage: loan, mortgageRatePct: v.rate, mortgageYearsLeft: 30 };
        var X = RE.calcRentalExit(s, v.years);
        var L = RE.existingLoan(s, 1, v.years);
        var interest = 0; for (var k = 1; k <= v.years; k++) interest += L.interest[k];
        var checks = {
          value: P.homeEnd === X.marketValue,
          sellCosts: P.sellCosts === X.transactionCosts,
          lessSelling: (P.homeEnd - P.sellCosts) === X.netProceeds,
          deflator: P.deflator === RE.deflator(v.infl, v.years),
          realValue: P.real.homeEnd === RE.toReal(X.marketValue, v.infl, v.years),
          realSellCosts: P.real.sellCosts === RE.toReal(X.transactionCosts, v.infl, v.years),
          payment: near(P.monthlyPI, L.payment),
          interest: near(P.totals.interest, interest),
          balance: near(P.balance, L.balance[v.years]),
          realBalance: near(P.real.balance, RE.toReal(L.balance[v.years], v.infl, v.years))
        };
        var ok = Object.keys(checks).every(function(k){ return checks[k]; });
        if (!ok) fails.push(v.id);
        out.push(Object.assign({ id: v.id, ok: ok, homeEnd: Math.round(P.homeEnd), loanEnd: Math.round(P.balance) }, checks));
      });
    } finally { Date.now = savedNow; }
    console.table(out);
    if (!fails.length) console.log('%crePairQA.parityCheck PASS', 'color:#7fc47f;font-weight:bold', '— ' + out.length + ' houses, the same on both engines');
    else console.error('rePairQA.parityCheck FAIL', fails);
    return { pass: fails.length === 0, fails: fails, rows: out };
  }


  // ─── Tax parity: the same shared tax inputs, the same tax (PR 8) ───
  // Design §11's parity tripwire, its tax half. The pair carries `tax`,
  // `bracket` and `state` (P3); each page turns them into a tax profile its
  // own way: BvRE through bvreTaxProfile() from its select values (strings),
  // BvRP as its state object (bindSelect makes the bracket a number). For
  // each profile the check asserts the same long-term rate on both, the same
  // tax on the bitcoin sold at each PARITY house's horizon (BvRE's
  // btcSaleTax against BvRP's gain × rate), and the same tax on the house's
  // gain once the exclusion is out of it (BvRE's home-sale tax at a 1-year
  // hold, which has no exclusion, against the gain × BvRP's rate; the
  // rental's recapture has no BvRE counterpart and is not compared).
  var TAX = [
    { id: 'T1', desc: 'the default: United States, 24%, typical state', tax: 'us', bracket: '24', state: 'OTHER' },
    { id: 'T2', desc: 'United States, 37%, California: NIIT and the top state rate', tax: 'us', bracket: '37', state: 'CA' },
    { id: 'T3', desc: 'United States, 12%, Texas: no federal or state tax on the gain', tax: 'us', bracket: '12', state: 'TX' },
    { id: 'T4', desc: 'United States, 32%, New York: NIIT from the 32% bracket', tax: 'us', bracket: '32', state: 'NY' },
    { id: 'T5', desc: 'no capital-gains tax', tax: 'none', bracket: '24', state: 'OTHER' }
  ];
  function taxParityCheck(){
    var RE = window.RealEstateModel;
    if (!RE || !RE.bvreTaxProfile || !RE.gainRate) { console.error('rePairQA.taxParityCheck: needs RealEstateModel'); return null; }
    var out = [], fails = [];
    function near(a, b){ return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }
    TAX.forEach(function(t){
      var tp = RE.bvreTaxProfile({ taxRegime: t.tax, filing: 'mfj', taxBracket: t.bracket, taxState: t.state, btcAccount: 'taxable' });
      var s = { taxRegime: t.tax, federalBracketPct: Number(t.bracket), stateCode: t.state };
      var rate = RE.gainRate(s), ok = near(RE.gainRate(tp), rate), btc = true, home = true;
      PARITY.forEach(function(v){
        var gain = v.price * (Math.pow(1 + v.appr / 100, v.years) - 1), proceeds = v.price + gain;
        btc = btc && near(RE.btcSaleTax(tp, proceeds, v.price, 0).tax, Math.max(0, gain) * rate);
        home = home && near(RE.homeSaleTax(tp, proceeds, 0, v.price, 1).tax, Math.max(0, gain) * rate);
      });
      var row = { id: t.id, desc: t.desc, ratePct: Math.round(rate * 10000) / 100, rate: ok, bitcoinTax: btc, houseGainTax: home, ok: ok && btc && home };
      if (!row.ok) fails.push(t.id);
      out.push(row);
    });
    console.table(out);
    if (!fails.length) console.log('%crePairQA.taxParityCheck PASS', 'color:#7fc47f;font-weight:bold', '— ' + out.length + ' tax profiles, the same on both pages');
    else console.error('rePairQA.taxParityCheck FAIL', fails);
    return { pass: fails.length === 0, fails: fails, rows: out };
  }

  // ─── Books: ledger = stat block = chart, on the page (PR 8) ───
  // Design §11's parity tripwire, its second and third halves, and §12's
  // acceptance: on each page, for every scenario, both frames and both
  // valuation bases, the ledger's totals, the stat block and the chart's
  // end-points agree, and (BvRE, M2) cumulative cash out is the same on the
  // ledger's two tabs. It drives the page's controls, as run() does, and
  // reads what the page rendered: the ledger's spec (nominal, as paid), the
  // cards or the table (in the frame shown), and the chart's datasets.
  //   Frame: the ledger is nominal; the stat block and chart are in the
  //   frame shown. The chart must equal the stat block to the dollar, and
  //   chart ÷ ledger must be 1 in Nominal and 1 / the deflator in Real, the
  //   same on both sides (so the Real view never changes which is ahead, M1).
  //   Bases: If sold, the chart's last point = the ledger's After tax; Held,
  //   it = the ledger's last row (BvRE: equity and bitcoin value; BvRP: total
  //   held). The difference line = bitcoin (the path) minus the house (the
  //   rental), in both.
  var BOOKS_BVRE = (function(){
    var v = [];
    ['floor', 'stay', 'trend', 'upper'].forEach(function(sc){
      ['mortgage', 'cash'].forEach(function(m){
        ['real', 'nominal'].forEach(function(d){ v.push({ id: 'B-' + sc + '-' + m + '-' + d, scenario: sc, method: m, display: d }); });
      });
    });
    v.push({ id: 'B-20y', horizon: '20' }, { id: 'B-5y-cpi', horizon: '5', infl: 'cpi-official' },
           { id: 'B-noinvest', invest: false }, { id: 'B-rent4000', rent: '4000' }, { id: 'B-nocgt', regime: 'none' });
    return v;
  })();
  var BOOKS_RETRO = [{ id: 'R-2014', year: '2014' }, { id: 'R-2017', year: '2017' }, { id: 'R-2017-cash', year: '2017', mode: 'cash' },
                     { id: 'R-2021', year: '2021' }, { id: 'R-2021-rent4000', year: '2021', rent: '4000' }, { id: 'R-2024', year: '2024' }];
  var BOOKS_RP = (function(){
    var v = [];
    ['1', '2', '3', '4'].forEach(function(path){
      ['floor', 'stay', 'trend', 'upper'].forEach(function(sc){
        ['real', 'nominal'].forEach(function(d){ v.push({ id: 'Q-' + path + '-' + sc + '-' + d, path: path, scenario: sc, display: d }); });
      });
    });
    v.push({ id: 'Q-1y', path: '1', hold: '1' }, { id: 'Q-30y', path: '1', hold: '30' }, { id: 'Q-mort450', path: '1', mortgage: '450000' });
    return v;
  })();
  function money(txt){ var m = String(txt).replace(/[−–]/g, '-').match(/-?\$[\d,]+/); return m ? Number(m[0].replace(/[$,]/g, '')) : NaN; }
  function lastOf(ds){ return ds.data[ds.data.length - 1]; }
  function finalRow(spec, label){ var r = spec.final.rows.filter(function(x){ return x.label === label; })[0]; return r ? r.values : null; }
  function within(a, b, tol){ return isFinite(a) && isFinite(b) && Math.abs(a - b) <= tol; }
  // chart ÷ ledger = want; 0 ÷ 0 passes (a renter whose bitcoin ran out).
  function ratioOk(a, b, want){
    if (Math.abs(a) < 0.5 && Math.abs(b) < 0.5) return true;
    var r = a / b; return isFinite(r) && Math.abs(r - want) <= 1e-9 * Math.max(1, want);
  }

  function booksBvre(x, where){
    var RE = window.RealEstateModel, proj = where === 'proj';
    var box = el(proj ? 'fwdLedger' : 'calcLedger'), spec = box && box._ledgerSpec;
    var cards = Array.prototype.map.call(document.querySelectorAll('#' + (proj ? 'fwdResults' : 'calcResultsContainer') + ' .big-number'), function(n){ return money(n.textContent); });
    var block = proj ? 'fwdChartBlock' : 'calcChartBlock', pre = proj ? 'fwd' : 'calc';
    function chart(basis){ click('#' + block + ' [data-basis="' + basis + '"]'); return window.RealEstateChart.data(pre); }
    var sold = chart('ifsold'), held = chart('held'); chart('ifsold');
    var after = finalRow(spec, 'After tax'), rows = spec.tabs[0].rows, last = rows[rows.length - 1];
    var bLast = spec.tabs[1].rows[spec.tabs[1].rows.length - 1];
    var H = lastOf(sold.datasets[0]), B = lastOf(sold.datasets[1]), D = lastOf(sold.datasets.filter(function(d){ return /^Difference/.test(d.label); })[0]);
    var Hh = lastOf(held.datasets[0]), Bh = lastOf(held.datasets[1]), Dh = lastOf(held.datasets.filter(function(d){ return /^Difference/.test(d.label); })[0]);
    var real = proj && (document.querySelector('.display-mode-btn.active') || {}).getAttribute('data-mode') === 'real';
    var want = 1;
    if (real) { var infl = window.ModelingAssumptions.get('inflation').value, yrs = +el('fwdHorizon').value; want = 1 / RE.deflator(infl, yrs); }
    var shortfall = rows.reduce(function(a, r){ return a + (r.shortfall || 0); }, 0) + spec.tabs[1].rows.reduce(function(a, r){ return a + (r.shortfall || 0); }, 0);
    var invest = el(proj ? 'fwdInvestDiff' : 'calcInvestDiff').checked;
    var checks = {
      cardsEqualChart: cards.length >= 2 && within(cards[0], B, 1) && within(cards[1], H, 1),
      chartEqualLedgerAfterTax: ratioOk(H, after[0], want) && ratioOk(B, after[1], want),
      heldEqualLedgerRow: ratioOk(Hh, last.equity, want) && ratioOk(Bh, bLast.btcValue, want),
      equityEqualFinal: within(last.equity, finalRow(spec, 'Market value')[0] + finalRow(spec, 'Mortgage repaid')[0], 1e-6 * Math.max(1, Math.abs(last.equity))),
      differenceLine: within(D, B - H, 1e-6 * Math.max(1, Math.abs(D))) && within(Dh, Bh - Hh, 1e-6 * Math.max(1, Math.abs(Dh))),
      equalCashOut: !invest || shortfall > 0 || within(last.cumCashOutOwner, bLast.cumCashOutRenter, 1e-6 * Math.max(1, last.cumCashOutOwner))
    };
    return { checks: checks, figures: { house: Math.round(H), bitcoin: Math.round(B), cashOut: Math.round(last.cumCashOutOwner), frame: real ? 'real' : 'nominal' } };
  }
  function booksRp(){
    var box = el('calc-ledger'), spec = box && box._ledgerSpec;
    var body = el('calc-comparison-body'), table = {};
    Array.prototype.forEach.call(body.querySelectorAll('tr'), function(tr){
      var c = tr.cells, lab = c[0].textContent;
      if (/total if held/.test(lab)) table.held = [money(c[1].textContent), money(c[2].textContent)];
      if (/^If sold, after tax/.test(lab)) table.after = [money(c[1].textContent), money(c[2].textContent)];
    });
    var sc = (document.querySelector('.calc-cagr-chip.active') || {}).getAttribute('data-scenario');
    var IDX = { stay: 1, trend: 2, upper: 3, floor: 4 };
    function chart(basis){ click('.calc-chart-basis-btn[data-basis="' + basis + '"]'); var d = chartData('calc-chart'); return d; }
    var sold = chart('ifsold'), held = chart('held'); chart('ifsold');
    var K = lastOf(sold.datasets[0]), P = lastOf(sold.datasets[IDX[sc]]), D = lastOf(sold.datasets[5]);
    var Kh = lastOf(held.datasets[0]), Ph = lastOf(held.datasets[IDX[sc]]), Dh = lastOf(held.datasets[5]);
    var after = finalRow(spec, 'After tax'), tot = finalRow(spec, 'Total held');
    var rl = spec.tabs[0].rows[spec.tabs[0].rows.length - 1], pl = spec.tabs[1].rows[spec.tabs[1].rows.length - 1];
    var real = state_display() === 'real', want = 1;
    if (real) want = 1 / window.RealEstateModel.deflator(window.ModelingAssumptions.get('inflation').value, +el('calc-holding-years').value);
    var checks = {
      tableEqualChart: within(table.after[0], K, 1) && within(table.after[1], P, 1) && within(table.held[0], Kh, 1) && within(table.held[1], Ph, 1),
      chartEqualLedgerAfterTax: ratioOk(K, after[0], want) && ratioOk(P, after[1], want),
      heldEqualLedger: ratioOk(Kh, tot[0], want) && ratioOk(Ph, tot[1], want) && within(rl.held, tot[0], 1e-6 * Math.max(1, Math.abs(tot[0]))) && within(pl.held, tot[1], 1e-6 * Math.max(1, Math.abs(tot[1]))),
      differenceLine: within(D, P - K, 1e-6 * Math.max(1, Math.abs(D))) && within(Dh, Ph - Kh, 1e-6 * Math.max(1, Math.abs(Dh)))
    };
    return { checks: checks, figures: { keep: Math.round(K), path: Math.round(P), frame: real ? 'real' : 'nominal' } };
  }
  async function booksCheck(opts){
    var p = page();
    if (!p) { console.error('rePairQA.booksCheck: not on a real-estate pair page'); return null; }
    await settle(p, opts);
    var out = [], fails = [];
    function record(id, r){
      var ok = Object.keys(r.checks).every(function(k){ return r.checks[k]; });
      if (!ok) fails.push(id);
      out.push(Object.assign({ id: id, ok: ok }, r.figures, r.checks));
    }
    await session(p, function(){
      if (p === 'bvre') {
        click('.calc-mode-label[data-mode="retrospective"]');
        BOOKS_RETRO.forEach(function(v){ applyRetro(v); record(v.id, booksBvre(v, 'retro')); });
        click('.calc-mode-label[data-mode="projection"]');
        BOOKS_BVRE.forEach(function(v){ applyProj(v); record(v.id, booksBvre(v, 'proj')); });
      } else {
        BOOKS_RP.forEach(function(v){ applyRp(v); record(v.id, booksRp()); });
      }
    });
    console.table(out);
    if (!fails.length) console.log('%crePairQA.booksCheck PASS', 'color:#7fc47f;font-weight:bold', '— ' + out.length + ' states: ledger = stat block = chart' + (p === 'bvre' ? ', equal cash out' : ''));
    else console.error('rePairQA.booksCheck FAIL', fails);
    return { page: p, pass: fails.length === 0, fails: fails, rows: out };
  }

  // Everything, in one call: the byte-identity vectors, then every identity.
  async function all(opts){
    var p = page(), r = { run: await run(opts), parity: parityCheck(), tax: taxParityCheck(), books: await booksCheck(opts) };
    if (p === 'bvre') r.ledger = ledgerCheck();
    var ok = r.parity && r.parity.pass && r.tax && r.tax.pass && r.books && r.books.pass && (p !== 'bvre' || (r.ledger && r.ledger.pass)) && (!opts || !opts.expect || r.run.pass);
    if (ok) console.log('%crePairQA.all PASS', 'color:#7fc47f;font-weight:bold', '— digest ' + r.run.digest);
    else console.error('rePairQA.all FAIL');
    r.pass = !!ok;
    return r;
  }

  window.rePairQA = { run: run, all: all, ledgerCheck: ledgerCheck, parityCheck: parityCheck, taxParityCheck: taxParityCheck, booksCheck: booksCheck,
                      vectors: { retro: RETRO, projection: PROJ, rental: RP, parity: PARITY, tax: TAX,
                                 books: { retro: BOOKS_RETRO, projection: BOOKS_BVRE, rental: BOOKS_RP } } };
})();
