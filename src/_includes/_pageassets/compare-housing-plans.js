/* ───────────────────────────────────────────────
   COMPARE HOUSING PLANS — PAGE SCRIPT
   Two housing plans side by side, step four of the real-estate series.
   Engine: RealEstateModel.housingCompare (shared/real-estate-model.js),
   one call for both plans (equal cash out couples them). Chart and ledger:
   the series' shared modules. SITE_GUIDE §59.

   URL: each plan's inputs under a_/b_ names from the first commit (the
   Compare Retirement Plans rule: retrofitting breaks every shared link):
   a_kind (now|later|rent), a_price, a_down, a_rate, a_year; the same with
   b_. Shared assumptions use the series' carried names through
   RealEstateCarry (horizon, happr, sell, btctx, pscenario, displaymode,
   tax, bracket, state); this page's own shared names are closing, ptax,
   maint, ded. Nothing is written until the reader changes something; a
   value at its default is left out.
   ─────────────────────────────────────────────── */
(function () {
  'use strict';
  var M = window.RealEstateModel;
  if (!M || !M.housingCompare) return;
  function $(id) { return document.getElementById(id); }
  var D = M.PAIR_DEFAULTS || {};

  function apprDefault() {
    try { return window.ModelingAssumptions.get('homeApprNominal').value; } catch (e) { return 4.68; }
  }
  var PLAN_DEF = {
    // 7.0%: Freddie Mac PMMS 30-year fixed, 7.03% on 2026-09-24 (DATA_AUDIT BvRP-24, CHP-1)
    a: { kind: 'now', price: D.homePrice || 415000, down: 20, rate: 7, year: 3 },
    b: { kind: 'later', price: D.homePrice || 415000, down: 20, rate: 7, year: 3 }
  };
  var SH_DEF = { horizon: 10, closing: D.closingPct || 1.04, ptax: D.propTaxPct || 0.9, maint: D.maintPct || 1, sell: D.sellPct || 6.6,
                 btctx: D.btcTxPct || 0.5, bracket: '24', state: 'OTHER', tax: 'us', ded: false };
  var PRESETS = {
    later:   { a: { kind: 'now' }, b: { kind: 'later', year: 3 } },
    down:    { a: { kind: 'now', down: 20 }, b: { kind: 'now', down: 10 } },
    cheaper: { a: { kind: 'now' }, b: { kind: 'now', price: 300000 } },
    rent:    { a: { kind: 'now' }, b: { kind: 'rent' } }
  };
  var SC_NAME = { floor: 'Floor', stay: 'Stay at today’s multiple', trend: 'Trend', upper: 'Upper' };
  var st = { scenario: 'stay', display: 'real' };

  // ─── inputs ───
  function pl(p, k) { return $('ch_' + p + '_' + k); }
  var sh = { horizon: $('chHorizon'), appr: $('chAppr'), closing: $('chClosing'), ptax: $('chPropTax'), maint: $('chMaint'), sell: $('chSell'),
             tx: $('chTx'), bracket: $('chBracket'), state: $('chState'), tax: $('chTax'), ded: $('chDed') };
  (function stateOptions() {
    var S = M.STATE_CAPGAIN || {}, sel = sh.state;
    var NAMES = { CA: 'California', NY: 'New York', NJ: 'New Jersey', OR: 'Oregon', MN: 'Minnesota', HI: 'Hawaii', DC: 'District of Columbia', VT: 'Vermont', IA: 'Iowa',
                  WI: 'Wisconsin', MA: 'Massachusetts', IL: 'Illinois', MI: 'Michigan', CO: 'Colorado', GA: 'Georgia', NC: 'North Carolina', PA: 'Pennsylvania', IN: 'Indiana',
                  AZ: 'Arizona', TX: 'Texas', FL: 'Florida', NV: 'Nevada', WA: 'Washington', TN: 'Tennessee', NH: 'New Hampshire', AK: 'Alaska', WY: 'Wyoming', SD: 'South Dakota' };
    var codes = Object.keys(S).filter(function (k) { return k !== 'OTHER'; }).sort(function (a, b) { return (NAMES[a] || a).localeCompare(NAMES[b] || b); });
    sel.innerHTML = '<option value="OTHER">Typical (about 5%)</option>' + codes.map(function (k) { return '<option value="' + k + '">' + (NAMES[k] || k) + ' (' + S[k] + '%)</option>'; }).join('');
    sel.value = 'OTHER';
  })();
  function num(s) { var v = parseFloat(String(s).replace(/[$,%\s]/g, '')); return isFinite(v) ? v : NaN; }
  function clamp(v, lo, hi, d) { return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
  function grouped(v) { return Math.round(v).toLocaleString('en-US'); }

  function setPlan(p, v) {
    if (v.kind !== undefined) pl(p, 'kind').value = v.kind;
    if (v.price !== undefined) pl(p, 'price').value = grouped(v.price);
    if (v.down !== undefined) pl(p, 'down').value = v.down;
    if (v.rate !== undefined) pl(p, 'rate').value = v.rate;
    if (v.year !== undefined) pl(p, 'year').value = v.year;
    showFields(p);
  }
  function readPlan(p) {
    var d = PLAN_DEF[p], H = readShared().horizon;
    return { kind: pl(p, 'kind').value, price: clamp(num(pl(p, 'price').value), 50000, 1e7, d.price),
             down: clamp(num(pl(p, 'down').value), 3, 100, d.down), rate: clamp(num(pl(p, 'rate').value), 0, 20, d.rate),
             year: clamp(Math.round(num(pl(p, 'year').value)), 1, Math.max(1, H), d.year) };
  }
  function readShared() {
    return { horizon: clamp(Math.round(num(sh.horizon.value)), 1, 30, SH_DEF.horizon), appr: clamp(num(sh.appr.value), -5, 20, apprDefault()),
             closing: clamp(num(sh.closing.value), 0, 10, SH_DEF.closing), ptax: clamp(num(sh.ptax.value), 0, 5, SH_DEF.ptax),
             maint: clamp(num(sh.maint.value), 0, 5, SH_DEF.maint), sell: clamp(num(sh.sell.value), 0, 15, SH_DEF.sell),
             btctx: clamp(num(sh.tx.value), 0, 10, SH_DEF.btctx), bracket: sh.bracket.value, state: sh.state.value, tax: sh.tax.value, ded: !!sh.ded.checked };
  }
  function showFields(p) {
    var k = pl(p, 'kind').value, box = $('chPlan' + p.toUpperCase());
    box.querySelectorAll('[data-own]').forEach(function (x) { x.hidden = k === 'rent'; });
    box.querySelectorAll('[data-later]').forEach(function (x) { x.hidden = k !== 'later'; });
  }

  // ─── formatting ───
  function usd(v) { return (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US'); }
  function usdK(v) { var a = Math.abs(v), s = v < 0 ? '−' : ''; return a >= 1e6 ? s + '$' + (a / 1e6).toFixed(2) + 'M' : a >= 1e4 ? s + '$' + Math.round(a / 1e3) + 'K' : usd(v); }
  function pctS(x) { return (x >= 0 ? '' : '−') + Math.abs(x * 100).toFixed(1) + '%'; }
  function yrs(n) { return n + (n === 1 ? ' year' : ' years'); }
  function inflPct() { try { return window.ModelingAssumptions.get('inflation').value; } catch (e) { return 3.5; } }
  function defl(t) { return st.display === 'real' ? Math.pow(1 + inflPct() / 100, t) : 1; }

  // ─── the run ───
  function planInput(v) {
    return { kind: v.kind === 'rent' ? 'rent' : 'buy', buyYear: v.kind === 'later' ? v.year : 0, homePrice: v.price, dpf: v.down / 100, mortRate: v.rate };
  }
  function btcNow() { return (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0) ? TODAY_PRICE : 100000; }
  function input(a, b, s, over) {
    var i = { horizonYrs: s.horizon, btcNow: btcNow(), scenario: st.scenario, homeApprNominal: s.appr, rentGrowth: null, inflRate: inflPct(),
              closingPct: s.closing, propTaxPct: s.ptax, insurancePer400K: D.insurancePer400K, maintPct: s.maint, sellPct: s.sell, btcTxPct: s.btctx,
              tp: M.bvreTaxProfile({ taxRegime: s.tax, taxBracket: parseFloat(s.bracket), taxState: s.state, mortgageDeduction: s.ded, filing: 'mfj' }),
              cashRule: 'max', plans: [planInput(a), planInput(b)] };
    if (over) for (var k in over) i[k] = over[k];
    return i;
  }
  function describe(v) {
    if (v.kind === 'rent') return 'Rents a ' + usd(v.price) + ' house the whole time';
    var how = (v.down >= 100 ? 'pays cash for' : 'puts ' + v.down + '% down on') + ' a ' + usd(v.price) + ' house' + (v.down >= 100 ? '' : ' at ' + v.rate + '%');
    return v.kind === 'now' ? 'Buys today: ' + how : 'Rents, then in year ' + v.year + ' ' + how.replace(/^puts/, 'puts').replace(/^pays/, 'pays') + ' (at that year’s price)';
  }

  var chartCtl = window.RealEstateChart ? window.RealEstateChart.bind('ch', function () { render(); }) : null;
  var lastA, lastB, lastS;

  function render() {
    var a = readPlan('a'), b = readPlan('b'), s = readShared(); lastA = a; lastB = b; lastS = s;
    var R = M.housingCompare(input(a, b, s)), H = s.horizon, Dh = defl(H);
    var A = R.plans[0], B = R.plans[1];

    $('chAssumeHint').textContent = yrs(H) + ' · homes ' + s.appr + '% a year · ' + (s.tax === 'none' ? 'no capital-gains tax' : s.bracket + '% bracket') + ' · ' + (st.display === 'real' ? 'today’s dollars' : 'future dollars');
    $('chDeflLine').textContent = st.display === 'real' ? 'Divided by inflation at ' + inflPct() + '% a year, the site’s setting.' : 'Dollars of each future year, before inflation.';
    document.querySelectorAll('.ch-chip[data-scenario]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-scenario') === st.scenario); });

    // Headline
    var d = R.diffAfter / Dh, mult = (Math.pow(R.priceEnd / btcNow(), 1 / H) - 1);
    $('chHeadV').innerHTML = Math.abs(d) < 1 ? 'After ' + yrs(H) + ', the two plans end level.'
      : 'After ' + yrs(H) + ', <strong>Plan ' + (d > 0 ? 'B' : 'A') + '</strong> ends <strong>' + usd(Math.abs(d)) + '</strong> ahead.';
    $('chHeadS').innerHTML = 'If both sell everything at the end, after selling costs and tax' + (st.display === 'real' ? ', in today’s dollars' : '') +
      ', with bitcoin on the <strong>' + SC_NAME[st.scenario] + '</strong> path (about ' + pctS(mult) + ' a year). Held instead of sold: Plan ' +
      (R.diffHeld >= 0 ? 'B' : 'A') + ' ahead by ' + usd(Math.abs(R.diffHeld / Dh)) + '. The plain what-ifs are in the table below.';

    // Equal cash out
    var first = function (P) { return P.first ? usd(P.first.cost) + ' (' + (P.first.kind === 'own' ? 'owning' : 'rent') + ')' : '—'; };
    $('chCashOut').innerHTML = 'Both start with <strong>' + usd(R.savings) + '</strong> of savings, the larger plan&rsquo;s up-front need, and spend the same every month: what the dearer plan&rsquo;s housing costs. In month one Plan A&rsquo;s housing costs ' + first(A) +
      ' and Plan B&rsquo;s ' + first(B) + '; the cheaper one puts the difference into bitcoin. Each paid out <strong>' + usd(A.cumCashOut) + '</strong> over the ' + yrs(H) + ' <span class="ch-small">(dollars of each year)</span>.';

    // Cards
    function card(P, v, cls, name) {
      var e = P.end, rows = [];
      if (e.owned) {
        rows.push(['Home value', usd(e.homeValue / Dh)], ['Loan still owed', '−' + usd(e.balance / Dh), 'neg'], ['Selling costs', '−' + usd(e.sellCosts / Dh), 'neg']);
        if (e.houseTax > 0.5) rows.push(['Tax on the home sale', '−' + usd(e.houseTax / Dh), 'neg']);
      }
      var bcost = (e.btcTax + e.btcValue - e.btcIfSold) / Dh;
      rows.push(['Bitcoin, value', usd(e.btcValue / Dh)], ['Tax and cost on its sale', bcost > 0.5 ? '−' + usd(bcost) : '$0', bcost > 0.5 ? 'neg' : '']);
      if (P.shortfall > 0.5) rows.push(['Found from income <span class="sumnote">counted against the plan; dollars of each year</span>', '−' + usd(P.shortfall), 'neg']);
      var bought = P.boughtAtMonth !== null && P.boughtAtMonth !== undefined
        ? (P.boughtAtMonth === 0 ? 'Bought today for ' + usd(P.buyPrice) : 'Bought in year ' + (P.boughtAtMonth / 12) + ' for ' + usd(P.buyPrice) + ', paying ' + usd(P.down + P.closing) + ' down and closing from its bitcoin') +
          (P.loan > 0 ? '; a ' + usd(P.loan) + ' loan at ' + v.rate + '%, ' + usd(P.pi) + ' a month.' : ', no loan.')
        : 'Never buys; rent starts at ' + usd(P.first ? P.first.cost : 0) + ' a month.';
      return '<div class="ch-card ' + cls + '"><h3>' + name + '</h3><p class="sub">' + describe(v) + '. ' + bought + '</p>' +
        '<div class="big">' + usd(e.after / Dh) + '</div><div class="big-k">everything sold after ' + yrs(H) + ', after costs and tax</div>' +
        '<dl>' + rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd' + (r[2] ? ' class="' + r[2] + '"' : '') + '>' + r[1] + '</dd>'; }).join('') + '</dl></div>';
    }
    $('chCards').innerHTML = card(A, a, 'a', 'Plan A') + card(B, b, 'b', 'Plan B');

    // Scenario table, with plain what-ifs first
    var half = Math.pow(0.5, 1 / H) - 1;
    var paths = [{ k: 'half', label: 'Bitcoin halves over the ' + yrs(H), over: { growth: half }, g: half },
                 { k: 'flat', label: 'Bitcoin goes nowhere', over: { growth: 0 }, g: 0 }]
      .concat(['floor', 'stay', 'trend', 'upper'].map(function (sc) { return { k: sc, label: SC_NAME[sc] + (sc === 'upper' ? ' (stress test)' : ''), over: { scenario: sc } }; }));
    $('chScenTable').innerHTML = '<thead><tr><th>Bitcoin path</th><th>Averages a year</th><th>Plan A</th><th>Plan B</th><th>B minus A</th></tr></thead><tbody>' +
      paths.map(function (p) {
        var r = M.housingCompare(input(a, b, s, p.over)), g = p.g !== undefined ? p.g : Math.pow(r.priceEnd / btcNow(), 1 / H) - 1, dd = r.diffAfter / Dh;
        return '<tr' + (p.k === st.scenario ? ' class="mine"' : '') + '><td>' + p.label + '</td><td>' + pctS(g) + '</td><td>' + usd(r.plans[0].end.after / Dh) + '</td><td>' + usd(r.plans[1].end.after / Dh) +
          '</td><td class="' + (dd > 0.5 ? 'pos' : dd < -0.5 ? 'neg' : '') + '">' + (dd > 0 ? '+' : '') + usd(dd) + '</td></tr>';
      }).join('') + '</tbody><caption>Everything sold after ' + yrs(H) + ', after costs and tax' + (st.display === 'real' ? ', today’s dollars' : '') + '. The first two rows are plain what-ifs; the four scenarios are Power Law paths, not forecasts. Even Floor assumes bitcoin keeps to the model’s lower line, and its price has closed below that line before.</caption>';

    // Chart
    var basis = chartCtl ? chartCtl.basis() : 'ifsold', key = basis === 'held' ? 'held' : 'after';
    $('chChartFrame').textContent = (basis === 'held' ? '(held, before any sale)' : '(if sold that year, after tax)') + (st.display === 'real' ? ', today’s dollars' : '');
    if (window.RealEstateChart) window.RealEstateChart.render('ch', {
      labels: A.rows.map(function (r) { return r.month === 0 ? 'Today' : 'Year ' + Math.round(r.year * 10) / 10; }),
      series: [
        { key: 'a', label: 'Plan A', style: 'house', data: A.rows.map(function (r) { return r[key] / defl(r.year); }) },
        { key: 'b', label: 'Plan B', style: 'btc', data: B.rows.map(function (r) { return r[key] / defl(r.year); }) },
        { key: 'diff', label: 'Difference (B − A)', style: 'diff', data: B.rows.map(function (r, j) { return (r[key] - A.rows[j][key]) / defl(r.year); }) }
      ], fmt: usdK });

    // Ledger
    if (window.RealEstateLedger) {
      var cols = function (P) { return [
        { label: 'Year', unit: '', get: function (r) { return r.month === 0 ? 'Today' : 'Year ' + Math.round(r.year * 10) / 10; }, fmt: 'text' },
        { label: 'Home value', unit: '$', get: function (r) { return r.homeValue / defl(r.year); }, fmt: 'usd' },
        { label: 'Loan still owed', unit: '$', get: function (r) { return r.balance / defl(r.year); }, fmt: 'usd' },
        { label: 'Bitcoin held', unit: '₿', get: function (r) { return r.btcHeld; }, fmt: 'btc' },
        { label: 'Bitcoin, value', unit: '$', get: function (r) { return r.btcValue / defl(r.year); }, fmt: 'usd' },
        { label: 'From income (sum, dollars of each year)', unit: '$', get: function (r) { return r.shortfall; }, fmt: 'usd' },
        { label: 'Everything sold, after tax', unit: '$', get: function (r) { return r.after / defl(r.year); }, fmt: 'usd' }
      ]; };
      var fin = function (k, f) { return [f(A.end), f(B.end)]; };
      window.RealEstateLedger.render($('chLedger'), {
        note: 'Year by year, ' + (st.display === 'real' ? 'in today’s dollars (each year divided by inflation to then)' : 'in each year’s dollars') + '.',
        tabs: [{ id: 'a', label: 'Plan A', columns: cols(A), rows: A.rows }, { id: 'b', label: 'Plan B', columns: cols(B), rows: B.rows }],
        final: { cols: ['Plan A', 'Plan B'], rows: [
          { label: 'House, if sold, less the loan', values: fin(0, function (e) { return e.houseIfSold / Dh; }) },
          { label: 'Tax on the home sale', values: fin(0, function (e) { return -e.houseTax / Dh; }) },
          { label: 'Bitcoin, if sold', values: fin(0, function (e) { return e.btcIfSold / Dh; }) },
          { label: 'Tax on the bitcoin', values: fin(0, function (e) { return -e.btcTax / Dh; }) },
          { label: 'Found from income', values: [-A.shortfall / Dh, -B.shortfall / Dh] },
          { label: 'Everything sold, after tax', values: fin(0, function (e) { return e.after / Dh; }) }
        ] },
        csv: { filename: 'compare-housing-plans.csv', meta: [
          ['Plan A', describe(a)], ['Plan B', describe(b)], ['Years', H], ['Home appreciation %', s.appr], ['Scenario', SC_NAME[st.scenario]],
          ['Bitcoin today', Math.round(btcNow())], ['Savings at the start', Math.round(R.savings)], ['Dollars', st.display === 'real' ? 'today’s, inflation ' + inflPct() + '%' : 'nominal']
        ] }
      });
    }
    writeUrl();
  }

  // ─── URL ───
  var touched = false;
  function writeUrl() {
    if (!touched || !window.history || !window.history.replaceState) return;
    var p = new URLSearchParams(window.location.search);
    function put(k, x, d) { if (x === d || String(x) === String(d)) p.delete(k); else p.set(k, String(x)); }
    ['a', 'b'].forEach(function (q) {
      var v = q === 'a' ? lastA : lastB, d = PLAN_DEF[q];
      put(q + '_kind', v.kind, d.kind); put(q + '_price', Math.round(v.price), d.price); put(q + '_down', v.down, d.down); put(q + '_rate', v.rate, d.rate); put(q + '_year', v.year, d.year);
    });
    put('closing', lastS.closing, SH_DEF.closing); put('ptax', lastS.ptax, SH_DEF.ptax); put('maint', lastS.maint, SH_DEF.maint); put('ded', lastS.ded ? '1' : '0', '0');
    var qs = p.toString(), url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    if (url !== window.location.pathname + window.location.search + window.location.hash) window.history.replaceState(null, '', url);
  }

  // ─── initial values: defaults, then the URL ───
  setPlan('a', PLAN_DEF.a); setPlan('b', PLAN_DEF.b);
  sh.appr.value = apprDefault();
  (function readUrl() {
    var q = new URLSearchParams(window.location.search);
    ['a', 'b'].forEach(function (p) {
      var v = {};
      if (['now', 'later', 'rent'].indexOf(q.get(p + '_kind')) >= 0) v.kind = q.get(p + '_kind');
      ['price', 'down', 'rate', 'year'].forEach(function (k) { var x = parseFloat(q.get(p + '_' + k)); if (isFinite(x)) v[k] = x; });
      setPlan(p, v);
    });
    var n = function (k, el) { var x = parseFloat(q.get(k)); if (isFinite(x)) el.value = x; };
    n('closing', sh.closing); n('ptax', sh.ptax); n('maint', sh.maint);
    if (q.get('ded') === '1') sh.ded.checked = true;
  })();

  // ─── wiring ───
  ['a', 'b'].forEach(function (p) {
    ['kind', 'price', 'down', 'rate', 'year'].forEach(function (k) {
      var x = pl(p, k);
      x.addEventListener('change', function () {
        if (k === 'kind') showFields(p);
        var v = readPlan(p);
        if (k === 'price') x.value = grouped(v.price); else if (k !== 'kind') x.value = v[k];
        touched = true; render();
      });
      if (x.tagName === 'INPUT') x.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') x.blur(); });
    });
  });
  Object.keys(sh).forEach(function (k) {
    var x = sh[k]; if (!x) return;
    x.addEventListener('change', function () { touched = true; render(); });
    if (x.tagName === 'INPUT' && x.type !== 'checkbox') x.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') x.blur(); });
  });
  document.querySelectorAll('.ch-chip[data-scenario]').forEach(function (b) {
    b.addEventListener('click', function () { st.scenario = b.getAttribute('data-scenario'); touched = true; render(); });
  });
  document.querySelectorAll('.ch-chip[data-preset]').forEach(function (b) {
    b.addEventListener('click', function () {
      var pr = PRESETS[b.getAttribute('data-preset')];
      setPlan('a', Object.assign({}, PLAN_DEF.a, pr.a)); setPlan('b', Object.assign({}, PLAN_DEF.a, pr.b));
      touched = true; render();
      var c = $('chHead'); if (c && c.scrollIntoView) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  });
  function syncDisplay() {
    document.querySelectorAll('[data-display]').forEach(function (x) { var on = x.getAttribute('data-display') === st.display; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  }
  document.querySelectorAll('[data-display]').forEach(function (b) {
    b.addEventListener('click', function () { st.display = b.getAttribute('data-display'); syncDisplay(); touched = true; render(); });
  });
  if (window.ModelingAssumptions && window.ModelingAssumptions.subscribe) window.ModelingAssumptions.subscribe(function () { render(); });

  if (window.RealEstateCarry) window.RealEstateCarry.register({
    read: function () { var s = lastS || readShared(); return { horizon: s.horizon, happr: s.appr, sell: s.sell, btctx: s.btctx, pscenario: st.scenario, displaymode: st.display, tax: s.tax, bracket: s.bracket, state: s.state }; },
    apply: function (v) {
      if (v.horizon !== undefined) sh.horizon.value = v.horizon;
      if (v.happr !== undefined) sh.appr.value = v.happr;
      if (v.sell !== undefined) sh.sell.value = v.sell;
      if (v.btctx !== undefined) sh.tx.value = v.btctx;
      if (v.pscenario) st.scenario = v.pscenario;
      if (v.displaymode) st.display = v.displaymode;
      if (v.tax && sh.tax.querySelector('option[value="' + v.tax + '"]')) sh.tax.value = v.tax;
      if (v.bracket && sh.bracket.querySelector('option[value="' + v.bracket + '"]')) sh.bracket.value = v.bracket;
      if (v.state && sh.state.querySelector('option[value="' + v.state + '"]')) sh.state.value = v.state;
      syncDisplay();
    },
    writeUrl: true
  });
  syncDisplay();
  render();
  if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price) { if (price > 0) render(); });

  // ─── QA (console: chpQA()) ───
  window.chpQA = function () {
    var s = readShared(), out = [];
    var same = M.housingCompare(input(lastA, lastA, s));
    out.push(['identical plans: identical results', Math.abs(same.diffAfter) < 1e-6 && Math.abs(same.diffHeld) < 1e-6]);
    // Parity with Bitcoin vs. Real Estate: Plan A buys, Plan B rents the same house, Plan A sets the budget.
    var bi = { method: 'mortgage', scenario: st.scenario, horizonYrs: s.horizon, btcNow: btcNow(), homePrice: 415000, homeApprNominal: s.appr, inflRate: inflPct(),
               mortRate: 6.8, dpf: 0.2, rent: null, rentGrowth: null, closingPct: s.closing, propTaxPct: s.ptax, insurance: null, maintPct: s.maint, sellPct: s.sell,
               btcTxPct: s.btctx, investDiff: true, taxRegime: s.tax, taxBracket: parseFloat(s.bracket), taxState: s.state, btcAccount: 'taxable', mortgageDeduction: s.ded, filing: 'mfj' };
    var bv = M.bvreProjection(bi);
    var c = M.housingCompare(input({ kind: 'now', price: 415000, down: 20, rate: 6.8, year: 3 }, { kind: 'rent', price: 415000, down: 20, rate: 6.8, year: 3 }, s, { cashRule: 'a' }));
    out.push(['house matches Bitcoin vs. Real Estate (to the cent)', Math.abs(c.plans[0].end.houseAfter - bv.houseAfterTax) < 0.01]);
    out.push(['bitcoin matches Bitcoin vs. Real Estate (to the cent)', Math.abs(c.plans[1].end.btcAfter - bv.btcAfterTax) < 0.01]);
    out.push(['cash out matches Bitcoin vs. Real Estate (owner and renter)', Math.abs(c.plans[0].cumCashOut - bv.cumCashOutOwner) < 0.01 && Math.abs(c.plans[1].cumCashOut + c.plans[1].shortfall - bv.cumCashOutRenter) < 0.01]);
    var ok = out.every(function (x) { return x[1]; });
    if (window.console) console.table(out.map(function (x) { return { check: x[0], pass: x[1] }; }));
    return { ok: ok, checks: out };
  };
})();
