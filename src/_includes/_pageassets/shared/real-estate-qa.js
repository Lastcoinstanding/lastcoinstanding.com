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
                    maint: '1', sell: '6.6', btctx: '0.5', invest: true, display: 'real', infl: 'm2-growth' };
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
    { id: 'E23', desc: 'proj, Shadow Stats deflator 8% (PR 4f)', infl: 'shadow-stats' }
  ];

  // The deflator: a preset, or a custom value (PR 4f).
  function setInfl(x){
    var MA = window.ModelingAssumptions;
    if (!MA) return;
    if (x.infl === 'custom') MA.set('inflation', 'custom', x.inflVal); else MA.set('inflation', x.infl);
  }
  function applyRetro(v){
    var x = Object.assign({}, RETRO_BASE, v);
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
                  mortRate: '4.4', mortYears: '20', display: 'nominal', infl: 'm2-growth', zoom: 'full' };
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
    { id: 'P24', desc: 'Real view: first 3 years of the chart', display: 'real', zoom: 'first3' }
  ];
  function applyRp(v){
    var x = Object.assign({}, RP_BASE, v);
    // The sitewide values first: a change there re-renders from the store.
    setInfl(x);
    if (window.ModelingAssumptions) window.ModelingAssumptions.set('homeApprNominal', 'since-2000');
    click('.calc-frame-btn[data-mode="' + x.display + '"]');   // PR 4f
    click('.calc-chart-zoom-btn[data-zoom="' + x.zoom + '"]');
    click('.calc-path-btn[data-path="' + x.path + '"]');
    setVal('rpHomeAppreciation', x.appr);                     // input only, as on BvRE
    setVal('calc-sell-cost', x.sell); setVal('calc-btc-tx', x.btctx);
    setVal('calc-property-value', x.value); setVal('calc-net-yield', x.yld); setVal('calc-holding-years', x.hold);
    setVal('calc-adjusted-basis', x.basis); setVal('calc-years-held', x.held);
    setVal('calc-state', x.state, ['change']); setVal('calc-bracket', x.bracket, ['change']);
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

  // ─── Runner ────────────────────────────────────────────────────────
  async function run(opts){
    opts = opts || {};
    var p = page();
    if (!p) { console.error('rePairQA: not on a real-estate pair page'); return null; }

    // Let live fetches settle so they can't overwrite a pinned value mid-run:
    // the projection's status, and the shared fetcher's in-flight queue
    // (power-law-data.js), which the retrospective waits on (PR 4e).
    if (p === 'bvre') {
      for (var w = 0; w < 120 && (/loading/i.test((el('fwdBtcPriceStatus') || {}).textContent || '') || window.__lcsPriceQueue); w++) await sleep(250);
    } else {
      await sleep(opts.settleMs || 3000);
    }

    // Save state
    var saved = { now: Date.now, url: location.pathname + location.search + location.hash, store: null, ma: {}, today: window.TODAY_PRICE,
                  btcNow: el('fwdBtcNow') ? el('fwdBtcNow').value : null, display: state_display() };
    try { saved.store = localStorage.getItem('lcs.bvre.calc.v2'); } catch (e) {}
    if (window.ModelingAssumptions) ['inflation', 'homeApprNominal', 'realReturns'].forEach(function(d){ saved.ma[d] = window.ModelingAssumptions.get(d); });

    Date.now = function(){ return FIXED_NOW; };
    var rows = [], all = [];
    try {
      if (p === 'bvre') {
        window.TODAY_PRICE = FIXED_BTC;                         // the retrospective's end price (PR 4e)
        click('.tab-btn[data-tab="calculator"]');
        var st = JSON.stringify(captureBvreStatic());
        rows.push({ id: 'S-bvre', desc: 'static exhibits (tabs I, II, IV)', hash: fnv(st), len: st.length }); all.push(st);
        click('.calc-mode-label[data-mode="retrospective"]');
        RETRO.forEach(function(v){ applyRetro(v); var s = JSON.stringify(captureRetro()); rows.push({ id: v.id, desc: v.desc, hash: fnv(s), len: s.length }); all.push(s); });
        click('.calc-mode-label[data-mode="projection"]');
        PROJ.forEach(function(v){
          var s;
          if (v.growth) s = JSON.stringify(captureGrowth());
          else { applyProj(v); s = JSON.stringify(captureProj()); }
          rows.push({ id: v.id, desc: v.desc, hash: fnv(s), len: s.length }); all.push(s);
        });
        applyRetro({}); applyProj({});
        click('.calc-mode-label[data-mode="retrospective"]');
      } else {
        window.TODAY_PRICE = FIXED_BTC;
        click('.tab-btn[data-tab="calculator"]');
        await sleep(200);                                     // chart builds on tab activation
        var s0 = JSON.stringify(captureRpStatic());
        rows.push({ id: 'S-bvrp', desc: 'Power Law copy spans', hash: fnv(s0), len: s0.length }); all.push(s0);
        RP.forEach(function(v){ applyRp(v); var s = JSON.stringify(captureRp()); rows.push({ id: v.id, desc: v.desc, hash: fnv(s), len: s.length }); all.push(s); });
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

  window.rePairQA = { run: run, ledgerCheck: ledgerCheck, parityCheck: parityCheck,
                      vectors: { retro: RETRO, projection: PROJ, rental: RP, parity: PARITY } };
})();
