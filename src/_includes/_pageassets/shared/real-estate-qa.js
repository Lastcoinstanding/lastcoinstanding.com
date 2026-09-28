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

   It drives the page's own controls (so the real call paths run,
   not just the engine), pins everything that varies between loads,
   and hashes the rendered output:
     - Date.now → 2026-09-27T12:00Z; BTC → $100,000 (fwdBtcNow on
       BvRE, TODAY_PRICE on BvRP); ModelingAssumptions → inflation
       m2-growth, homeApprNominal since-2000, realReturns diversified;
     - captures result-container innerHTML and Chart.js dataset arrays
       (labels, data at full precision, hidden flags);
     - hashes each vector's capture (FNV-1a 32) and all of them
       together (digest).
   State it touches (inputs, MA presets, URL, lcs.bvre.calc.v1,
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
  var RETRO_BASE = { year: '2017', mode: 'leverage', dca: false, home: '', rent: '', rate: '', down: '' };
  var RETRO = [
    { id: 'E1', desc: 'retro 2017, leverage, 20% down, no DCA' },
    { id: 'E2', desc: 'retro 2017, leverage, DCA on', dca: true },
    { id: 'E3', desc: 'retro 2014, cash', year: '2014', mode: 'cash' },
    { id: 'E4', desc: 'retro 2021, rate 3%, rent $2,000, 10% down', year: '2021', rate: '3', rent: '2000', down: '10' },
    { id: 'E5', desc: 'retro 2019, home $750,000, DCA on', year: '2019', home: '750000', dca: true }
  ];
  var PROJ_BASE = { scenario: 'trend', method: 'mortgage', down: '20', home: '420000', horizon: '10',
                    appr: '4.68', rate: '6.8', rent: '', advanced: false, display: 'real', infl: 'm2-growth' };
  var PROJ = [
    { id: 'E6',  desc: 'proj defaults ($420K, 10y, trend, mortgage 20%, Real)' },
    { id: 'E7',  desc: 'proj defaults, Nominal display', display: 'nominal' },
    { id: 'E8a', desc: 'proj floor', scenario: 'floor' },
    { id: 'E8b', desc: 'proj upper', scenario: 'upper' },
    { id: 'E9a', desc: 'proj 5y, trend', horizon: '5' },
    { id: 'E9b', desc: 'proj 20y, trend', horizon: '20' },
    { id: 'E10', desc: 'proj cash, advanced (index fund at 5%)', method: 'cash', advanced: true },
    { id: 'E11', desc: 'proj mortgage, advanced DCA, rent $1,500', advanced: true, rent: '1500' },
    { id: 'E12', desc: 'proj down 3.5%, rate 7.5%, appr 1.0', down: '3.5', rate: '7.5', appr: '1.0' },
    { id: 'E13', desc: 'proj inflation cpi-official (3.5)', infl: 'cpi-official' }
  ];

  function applyRetro(v){
    var x = Object.assign({}, RETRO_BASE, v);
    click('.toggle-group .toggle-btn[data-mode="' + x.mode + '"]');
    setVal('calcYear', x.year, ['change']);            // clears the custom inputs
    var d = el('calcDCA');
    if (d.checked !== x.dca) { d.checked = x.dca; fire(d, 'change'); }
    setVal('customHomePrice', x.home); setVal('customRent', x.rent);
    setVal('customRate', x.rate); setVal('customDownPct', x.down);
  }
  function captureRetro(){
    return { assumptions: html('calcAssumptions'), cards: html('calcResultsContainer'),
             dca: html('dcaResultContainer'), total: html('totalSummary'),
             totalShown: el('totalSummaryWrapper').style.display };
  }
  function applyProj(v){
    var x = Object.assign({}, PROJ_BASE, v);
    var MA = window.ModelingAssumptions;
    MA.set('inflation', x.infl); MA.set('homeApprNominal', 'since-2000'); MA.set('realReturns', 'diversified');
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
    var a = el('fwdAdvancedCheck');
    a.checked = x.advanced; fire(a, 'change');
  }
  function captureProj(){
    // The advanced panel is hidden, not cleared, when "Go deeper" is off,
    // so its innerHTML is only captured while it is shown; otherwise the
    // hash would depend on what an earlier vector left behind.
    var advShown = el('fwdAdvancedContent').style.display;
    var adv = advShown === 'none' ? null
      : { note: html('fwdAdvancedNote'), left: html('fwdAdvancedLeft'), right: html('fwdAdvancedRight') };
    var totShown = el('fwdTotalSummaryWrapper').style.display;
    return { results: html('fwdResults'), totalShown: totShown,
             total: totShown === 'none' ? null : html('fwdTotalSummary'),
             advShown: advShown, adv: adv };
  }
  function captureBvreStatic(){
    return { houses: html('housesVisual'), returnTable: html('returnTable'), returnEnd: html('returnTableEndPrices'),
             charts: ['eraBarChart', 'divergenceChart', 'globalAffordabilityChart', 'btcHouseChart',
                      'seesawChart', 'burdenChart', 'totalCostChart'].map(chartData) };
  }

  // ─── BvRP ──────────────────────────────────────────────────────────
  var RP_BASE = { path: '4', scenario: 'trend', value: '500000', yld: '4.4', hold: '10', basis: '60', held: '10',
                  state: 'OTHER', bracket: '24', ltv: '80', helocRate: '9.5', mortgage: '200000',
                  props: '3', retained: '2', port: [45, 30, 10, 15], appr: '4.68' };
  var RP = [
    { id: 'P1',  desc: 'defaults (Path 4, trend, $500K, 4.4%, 10y, OTHER, 24%)' },
    { id: 'P2',  desc: 'Path 1', path: '1' },
    { id: 'P3',  desc: 'Path 2', path: '2' },
    { id: 'P4',  desc: 'Path 3', path: '3' },
    { id: 'P5a', desc: 'Path 4, stay', scenario: 'stay' },
    { id: 'P5b', desc: 'Path 4, upper', scenario: 'upper' },
    { id: 'P6a', desc: 'Path 1, hold 1y', path: '1', hold: '1' },
    { id: 'P6b', desc: 'Path 1, hold 30y', path: '1', hold: '30' },
    { id: 'P7',  desc: 'Path 1, CA, 37%', path: '1', state: 'CA', bracket: '37' },
    { id: 'P8',  desc: 'Path 1, TX, 12%', path: '1', state: 'TX', bracket: '12' },
    { id: 'P9',  desc: 'Path 2, existing mortgage $450K', path: '2', mortgage: '450000' },
    { id: 'P10', desc: 'Path 3, 10 properties, 1 retained', path: '3', props: '10', retained: '1' },
    { id: 'P11a', desc: 'Path 4, portfolio 100/0/0/0', port: [100, 0, 0, 0] },
    { id: 'P11b', desc: 'Path 4, portfolio 0/0/0/100', port: [0, 0, 0, 100] },
    { id: 'P11c', desc: 'Path 4, portfolio 50/30/10/20 (sums to 110)', port: [50, 30, 10, 20] },
    { id: 'P12', desc: 'basis 20%, held 27y (depreciation cap)', basis: '20', held: '27' }
  ];
  function applyRp(v){
    var x = Object.assign({}, RP_BASE, v);
    if (window.ModelingAssumptions) window.ModelingAssumptions.set('homeApprNominal', 'since-2000');
    click('.calc-path-btn[data-path="' + x.path + '"]');
    setVal('calc-appreciation', x.appr);                      // input only, as on BvRE
    setVal('calc-property-value', x.value); setVal('calc-net-yield', x.yld); setVal('calc-holding-years', x.hold);
    setVal('calc-adjusted-basis', x.basis); setVal('calc-years-held', x.held);
    setVal('calc-state', x.state, ['change']); setVal('calc-bracket', x.bracket, ['change']);
    setVal('calc-heloc-ltv', x.ltv); setVal('calc-heloc-rate', x.helocRate); setVal('calc-existing-mortgage', x.mortgage);
    setVal('calc-num-properties', x.props); setVal('calc-properties-retained', x.retained);
    ['strc', 'sata', 'ledn', 'spot'].forEach(function(k, i){ setVal('calc-port-' + k, String(x.port[i])); });
    click('.calc-cagr-chip[data-scenario="' + x.scenario + '"]');
  }
  function captureRp(){
    return { headline: html('calc-headline'), compHead: html('calc-comparison-headers'), comp: html('calc-comparison-body'),
             detail: html('calc-path-detail'), callout: html('calc-specific-callout'), desc: html('calc-path-description'),
             chips: html('calc-cagr-chips'), multiple: html('calc-current-multiple'), chart: chartData('calc-chart') };
  }
  function captureRpStatic(){
    var q = function(sel){ return Array.prototype.map.call(document.querySelectorAll(sel), function(n){ return n.textContent; }); };
    return { plCagr: q('[data-pl-cagr]'), plStay: q('[data-pl-stay-fv]') };
  }

  // ─── Runner ────────────────────────────────────────────────────────
  async function run(opts){
    opts = opts || {};
    var p = page();
    if (!p) { console.error('rePairQA: not on a real-estate pair page'); return null; }

    // Let live fetches settle so they can't overwrite a pinned value mid-run.
    if (p === 'bvre') {
      for (var w = 0; w < 40 && /loading/i.test((el('fwdBtcPriceStatus') || {}).textContent || ''); w++) await sleep(250);
    } else {
      await sleep(opts.settleMs || 3000);
    }

    // Save state
    var saved = { now: Date.now, url: location.pathname + location.search + location.hash, store: null, ma: {}, today: window.TODAY_PRICE };
    try { saved.store = localStorage.getItem('lcs.bvre.calc.v1'); } catch (e) {}
    if (window.ModelingAssumptions) ['inflation', 'homeApprNominal', 'realReturns'].forEach(function(d){ saved.ma[d] = window.ModelingAssumptions.get(d); });

    Date.now = function(){ return FIXED_NOW; };
    var rows = [], all = [];
    try {
      if (p === 'bvre') {
        click('.tab-btn[data-tab="calculator"]');
        var st = JSON.stringify(captureBvreStatic());
        rows.push({ id: 'S-bvre', desc: 'static exhibits (tabs I, II, IV)', hash: fnv(st), len: st.length }); all.push(st);
        click('.calc-mode-label[data-mode="retrospective"]');
        RETRO.forEach(function(v){ applyRetro(v); var s = JSON.stringify(captureRetro()); rows.push({ id: v.id, desc: v.desc, hash: fnv(s), len: s.length }); all.push(s); });
        click('.calc-mode-label[data-mode="projection"]');
        PROJ.forEach(function(v){ applyProj(v); var s = JSON.stringify(captureProj()); rows.push({ id: v.id, desc: v.desc, hash: fnv(s), len: s.length }); all.push(s); });
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
      }
    } finally {
      Date.now = saved.now;
      if (p === 'bvrp') window.TODAY_PRICE = saved.today;
      if (window.ModelingAssumptions) Object.keys(saved.ma).forEach(function(d){
        var m = saved.ma[d]; if (m && m.preset === 'custom') window.ModelingAssumptions.set(d, 'custom', m.value); else if (m) window.ModelingAssumptions.set(d, m.preset);
      });
      await sleep(400);                                       // let the debounced URL/storage writer run, then restore
      try { if (saved.store === null) localStorage.removeItem('lcs.bvre.calc.v1'); else localStorage.setItem('lcs.bvre.calc.v1', saved.store); } catch (e) {}
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

  // Ledger final row = the card figures (post-refactor only; needs the module).
  function ledgerCheck(){
    var RE = window.RealEstateModel;
    if (!RE || typeof homeData === 'undefined') { console.error('rePairQA.ledgerCheck: needs RealEstateModel on BvRE'); return null; }
    var out = [], fails = [];
    RETRO.forEach(function(v){
      var x = Object.assign({}, RETRO_BASE, v);
      var sy = +x.year, ey = 2025;
      var hsNum = x.home ? +x.home : null;
      var hs = hsNum || homeData[sy], he = hsNum ? Math.round(hsNum * (homeData[ey] / homeData[sy])) : homeData[ey];
      var inp = { sy: sy, ey: ey, mode: x.mode, hs: hs, he: he, bs: btcData[sy], be: btcData[ey],
                  rate: x.rate ? +x.rate : mortgageRates[sy], dpf: (x.down ? +x.down : 20) / 100,
                  rentOverride: x.rent ? +x.rent : null, btcData: btcData, homeData: homeData };
      var L = RE.ledgerRetro(inp), last = L.rows[L.rows.length - 1], c = L.cards;
      var checks = {
        btcNet: last.btc.net === c.lumpNet,
        btcValue: last.btc.value === c.lumpValue,
        houseEquity: last.house.equity === c.houseEquity,
        cashOutHouse: last.house.cashOut === c.houseTotalSpent,
        dcaBtc: last.btc.dcaBtc === c.dcaBtc,
        rent: last.btc.rentPaid === c.totalRentPaid
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

  window.rePairQA = { run: run, ledgerCheck: ledgerCheck, vectors: { retro: RETRO, projection: PROJ, rental: RP } };
})();
