/* ───────────────────────────────────────────────
   BITCOIN VS. PAYING DOWN THE MORTGAGE — PAGE SCRIPT
   The homeowner, step three of the real-estate series. Engine:
   RealEstateModel.paydownProjection / paydownHurdle / hurdleHistory
   (shared/real-estate-model.js). Chart, grid and ledger: the series' shared
   modules. Design and JM's rulings (2026-10-01, all nine as recommended):
   MORTGAGE_PAYDOWN_DESIGN.md.

   URL: the series' carried names (horizon, btctx, pscenario, displaymode,
   tax, bracket, state) go through RealEstateCarry, so the strip's links take
   them to the tenant's and landlord's pages; this page's own inputs are
   bal, mrate, yrsleft, extra, lump, acct, ded. Nothing is written until the
   reader changes something; a value at its default is left out.
   ─────────────────────────────────────────────── */
(function () {
  'use strict';
  var M = window.RealEstateModel;
  if (!M || !M.paydownProjection) return;
  function $(id) { return document.getElementById(id); }

  var DEF = { bal: 240000, mrate: 4.4, yrsleft: 23, extra: 500, lump: 0, horizon: 10,
              btctx: (M.PAIR_DEFAULTS && M.PAIR_DEFAULTS.btcTxPct) || 0.5, pscenario: 'stay', displaymode: 'real',
              tax: 'us', bracket: '24', state: 'OTHER', acct: 'taxable', ded: false };
  var SC_NAME = { floor: 'Floor', stay: 'Stay at today’s multiple', trend: 'Trend', upper: 'Upper' };
  var st = { scenario: DEF.pscenario, display: DEF.displaymode };

  // ─── inputs ───
  var el = { bal: $('mpBal'), mrate: $('mpRate'), yrsleft: $('mpYears'), extra: $('mpExtra'), lump: $('mpLump'),
             horizon: $('mpHorizon'), tx: $('mpTx'), bracket: $('mpBracket'), state: $('mpState'), tax: $('mpTax'),
             acct: $('mpAcct'), ded: $('mpDed') };
  // State options from the shared tax table, so a carried state always has a row.
  (function () {
    var S = M.STATE_CAPGAIN || {}, sel = el.state; if (!sel) return;
    var NAMES = { CA: 'California', NY: 'New York', NJ: 'New Jersey', OR: 'Oregon', MN: 'Minnesota', HI: 'Hawaii', DC: 'District of Columbia',
                  VT: 'Vermont', IA: 'Iowa', WI: 'Wisconsin', MA: 'Massachusetts', IL: 'Illinois', MI: 'Michigan', CO: 'Colorado', GA: 'Georgia',
                  NC: 'North Carolina', PA: 'Pennsylvania', IN: 'Indiana', AZ: 'Arizona', TX: 'Texas', FL: 'Florida', NV: 'Nevada',
                  WA: 'Washington', TN: 'Tennessee', NH: 'New Hampshire', AK: 'Alaska', WY: 'Wyoming', SD: 'South Dakota' };
    var codes = Object.keys(S).filter(function (k) { return k !== 'OTHER'; }).sort(function (a, b) { return (NAMES[a] || a).localeCompare(NAMES[b] || b); });
    sel.innerHTML = '<option value="OTHER">Typical (about 5%)</option>' + codes.map(function (k) {
      return '<option value="' + k + '">' + (NAMES[k] || k) + ' (' + S[k] + '%)</option>'; }).join('');
    sel.value = 'OTHER';
  })();

  function num(s) { var v = parseFloat(String(s).replace(/[$,%\s]/g, '')); return isFinite(v) ? v : NaN; }
  function clamp(v, lo, hi, d) { return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
  function grouped(v) { return Math.round(v).toLocaleString('en-US'); }
  function readInputs() {
    return {
      bal: clamp(num(el.bal.value), 0, 5e6, DEF.bal),
      mrate: clamp(num(el.mrate.value), 0, 20, DEF.mrate),
      yrsleft: clamp(Math.round(num(el.yrsleft.value)), 1, 40, DEF.yrsleft),
      extra: clamp(num(el.extra.value), 0, 1e5, DEF.extra),
      lump: clamp(num(el.lump.value), 0, 1e7, DEF.lump),
      horizon: clamp(Math.round(num(el.horizon.value)), 1, 30, DEF.horizon),
      btctx: clamp(num(el.tx.value), 0, 10, DEF.btctx),
      bracket: el.bracket.value, state: el.state.value, tax: el.tax.value, acct: el.acct.value, ded: !!el.ded.checked
    };
  }
  function setInputs(v) {
    if (v.bal !== undefined) el.bal.value = grouped(v.bal);
    if (v.mrate !== undefined) el.mrate.value = v.mrate;
    if (v.yrsleft !== undefined) el.yrsleft.value = v.yrsleft;
    if (v.extra !== undefined) el.extra.value = grouped(v.extra);
    if (v.lump !== undefined) el.lump.value = grouped(v.lump);
    if (v.horizon !== undefined) el.horizon.value = v.horizon;
    if (v.btctx !== undefined) el.tx.value = v.btctx;
    if (v.bracket !== undefined && el.bracket.querySelector('option[value="' + v.bracket + '"]')) el.bracket.value = v.bracket;
    if (v.state !== undefined && el.state.querySelector('option[value="' + v.state + '"]')) el.state.value = v.state;
    if (v.tax !== undefined && el.tax.querySelector('option[value="' + v.tax + '"]')) el.tax.value = v.tax;
    if (v.acct !== undefined && el.acct.querySelector('option[value="' + v.acct + '"]')) el.acct.value = v.acct;
    if (v.ded !== undefined) el.ded.checked = !!v.ded;
    if (v.pscenario) st.scenario = v.pscenario;
    if (v.displaymode) st.display = v.displaymode;
  }

  // ─── formatting ───
  function usd(v) { return (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US'); }
  function usdK(v) { var a = Math.abs(v), s = v < 0 ? '−' : ''; return a >= 1e6 ? s + '$' + (a / 1e6).toFixed(2) + 'M' : a >= 1e4 ? s + '$' + Math.round(a / 1e3) + 'K' : usd(v); }
  function pct(x, d) { return (x * 100).toFixed(d === undefined ? 1 : d) + '%'; }
  function pctS(x) { return (x >= 0 ? '' : '−') + Math.abs(x * 100).toFixed(1) + '%'; }
  function monthsText(m) {
    if (m === null) return null;
    var y = Math.floor(m / 12), r = m % 12;
    return (y ? y + (y === 1 ? ' year' : ' years') : '') + (y && r ? ' ' : '') + (r ? r + (r === 1 ? ' month' : ' months') : '');
  }
  function payoffDate(m) {
    var d = new Date(); d.setMonth(d.getMonth() + m);
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  // ─── inflation (the site's setting) ───
  function inflPct() {
    try { return window.ModelingAssumptions.get('inflation').value; } catch (e) { return 3.5; }
  }
  function defl(t) { return st.display === 'real' ? Math.pow(1 + inflPct() / 100, t) : 1; }

  // ─── the run ───
  function taxProfile(v) {
    return M.bvreTaxProfile({ taxRegime: v.tax, taxBracket: parseFloat(v.bracket), taxState: v.state, btcAccount: v.acct, mortgageDeduction: v.ded, filing: 'mfj' });
  }
  function input(v, over) {
    var i = { balance: v.bal, ratePct: v.mrate, yearsLeft: v.yrsleft, extra: v.extra, lump: v.lump, horizon: v.horizon,
              scenario: st.scenario, tp: taxProfile(v), btcTxPct: v.btctx };
    if (over) for (var k in over) i[k] = over[k];
    return i;
  }

  var lastV = null, lastR = null;
  var chartCtl = window.RealEstateChart ? window.RealEstateChart.bind('mp', function () { render(); }) : null;

  function render() {
    var v = readInputs(); lastV = v;
    var i = input(v), R = M.paydownProjection(i); lastR = R;
    var H = v.horizon, D = defl(H), hasExtra = v.extra > 0 || v.lump > 0;
    var hAfter = hasExtra ? M.paydownHurdle(i) : null, hHeld = hasExtra ? M.paydownHurdle(i, 'held') : null;
    var flat = M.paydownProjection(input(v, { growth: 0 }));
    var cagr = function (s) { return M.effectiveCAGR(s, H); };
    var scDiff = function (s) { return M.paydownProjection(input(v, { scenario: s })).diffIfSold; };

    // Assumptions summary line
    $('mpAssumeHint').textContent = (v.tax === 'none' ? 'no capital-gains tax' : v.bracket + '% bracket, ' + (el.state.options[el.state.selectedIndex] || {}).text) +
      (v.acct === 'advantaged' ? ', tax-advantaged account' : '') + (v.ded ? ', deducting interest' : '') + ' · trading cost ' + v.btctx + '% · ' +
      (st.display === 'real' ? 'today’s dollars' : 'future dollars');
    $('mpDeflLine').textContent = st.display === 'real'
      ? 'Divided by inflation at ' + inflPct() + '% a year, the site’s setting; ' + usd(100000) + ' in ' + H + ' years is ' + usd(100000 / D) + ' today.'
      : 'Dollars of each future year, before inflation.';

    // The hurdle
    var hv = $('mpHurdleV'), hs = $('mpHurdleS');
    if (!hasExtra) {
      hv.innerHTML = 'With no extra cash, the two households are the same.';
      hs.innerHTML = 'Enter the extra you have each month, or a lump sum, to compare paying the loan down with holding bitcoin.';
    } else if (hAfter === null) {
      hv.innerHTML = 'Paying down comes out ahead at any growth the search tried.';
      hs.innerHTML = 'Check the inputs: this happens only at extreme values.';
    } else {
      var ded = R.dedRate > 0 ? ' Deducting the interest lowers the loan’s cost after tax to about <strong>' + pct(v.mrate / 100 * (1 - R.dedRate), 2) + '</strong>.' : '';
      hv.innerHTML = 'Your mortgage costs ' + v.mrate + '%. Over ' + H + (H === 1 ? ' year' : ' years') + ', holding bitcoin ends ahead if bitcoin averages more than <strong>' + pct(hAfter) + '</strong> a year.';
      hs.innerHTML = 'That is after the tax on selling the bitcoin at the end' + (v.tax === 'none' || v.acct === 'advantaged' ? ' (none, in your setting)' : '') +
        ' and the ' + v.btctx + '% trading cost. Before tax, held rather than sold: <strong>' + pct(hHeld) + '</strong>.' + ded +
        ' If bitcoin goes nowhere, holding ends <strong>' + usd(-flat.diffIfSold / D) + '</strong> behind; the scenarios and the record are below.';
    }

    // Scenario chips
    document.querySelectorAll('.mp-chip').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-scenario') === st.scenario); });

    // The two households
    var e = R.end, ap = R.payoffPay, ah = R.payoffHold, P = R.payment;
    function card(kind, h, payoff) {
      var pay = kind === 'pay';
      var sub = pay
        ? 'Puts ' + usd(v.extra) + ' a month' + (v.lump > 0 ? ' and ' + usd(v.lump) + ' today' : '') + ' on the loan. ' +
          (payoff !== null ? 'Paid off in ' + payoffDate(payoff) + ' (' + monthsText(payoff) + '), then ' + usd(P + v.extra) + ' a month into bitcoin.' : 'Still paying it off at the end of ' + H + (H === 1 ? ' year.' : ' years.'))
        : 'Buys ' + usd(v.extra) + ' of bitcoin a month' + (v.lump > 0 ? ' and ' + usd(v.lump) + ' today' : '') + ', and pays the ' + usd(P) + ' loan payment on schedule' +
          (payoff !== null ? ' until it ends in ' + payoffDate(payoff) + ', then all of it into bitcoin.' : '.');
      return '<div class="mp-card ' + kind + '"><h3>' + (pay ? 'Pay it down' : 'Hold bitcoin') + '</h3><p class="sub">' + sub + '</p>' +
        '<div class="big">' + usd(h.ifSold / D) + '</div><div class="big-k">bitcoin less the loan, if the bitcoin is sold after ' + H + (H === 1 ? ' year' : ' years') + ', after tax</div>' +
        '<dl><dt>Loan still owed</dt><dd' + (h.balance > 0.5 ? ' class="neg"' : '') + '>' + (h.balance > 0.5 ? '−' + usd(h.balance / D) : 'paid off') + '</dd>' +
        '<dt>Bitcoin, value</dt><dd>' + usd(h.btcValue / D) + '</dd>' +
        '<dt>Paid for that bitcoin</dt><dd>' + usd(h.basis / D) + '</dd>' +
        '<dt>Tax and cost on a sale</dt><dd' + (h.tax > 0.5 ? ' class="neg"' : '') + '>' + (h.tax + h.btcValue * v.btctx / 100 > 0.5 ? '−' + usd((h.tax + h.btcValue * v.btctx / 100) / D) : '$0') + '</dd>' +
        '<dt>Interest paid on the loan</dt><dd>' + usd(h.interest / D) + '</dd></dl></div>';
    }
    $('mpCards').innerHTML = card('pay', e.pay, ap) + card('hold', e.hold, ah);
    var d = R.diffIfSold / D, mult = M.effectiveCAGR(st.scenario, H);
    $('mpDiff').innerHTML = hasExtra
      ? 'Under <strong>' + SC_NAME[st.scenario] + '</strong>, where bitcoin averages about ' + pctS(mult) + ' a year over the ' + H + (H === 1 ? ' year' : ' years') + ', ' +
        (Math.abs(d) < 1 ? 'the two households end level.' : '<strong class="' + (d > 0 ? 'ahead-hold' : 'ahead-pay') + '">' + (d > 0 ? 'holding bitcoin' : 'paying it down') + ' ends ' + usd(Math.abs(d)) + ' ahead</strong>, if sold after tax' + (st.display === 'real' ? ', in today’s dollars.' : '.')) +
        ' Held rather than sold: ' + (R.diffHeld / D >= 0 ? 'holding ahead by ' : 'paying down ahead by ') + usd(Math.abs(R.diffHeld / D)) + '.'
      : '';

    // Each scenario against the hurdle
    var halfG = Math.pow(0.5, 1 / H) - 1, half = M.paydownProjection(input(v, { growth: halfG }));
    var rows = [{ k: 'half', label: 'Bitcoin halves over the ' + H + (H === 1 ? ' year' : ' years'), g: halfG, diff: half.diffIfSold },
                { k: 'flat', label: 'Bitcoin goes nowhere', g: 0, diff: flat.diffIfSold }]
      .concat(['floor', 'stay', 'trend', 'upper'].map(function (s) { return { k: s, label: SC_NAME[s] + (s === 'upper' ? ' (stress test)' : ''), g: cagr(s), diff: scDiff(s) }; }));
    $('mpScenTable').innerHTML = '<thead><tr><th>Bitcoin path</th><th>Averages a year</th><th>' + (hAfter !== null ? 'Against the hurdle' : '') + '</th><th>Holding minus paying down</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var dd = r.diff / D;
        return '<tr' + (r.k === st.scenario ? ' class="mine"' : '') + '><td>' + r.label + '</td><td>' + pctS(r.g) + '</td><td>' +
          (hAfter !== null ? (r.g > hAfter ? 'above' : 'below') : '') + '</td><td class="' + (dd > 0.5 ? 'pos' : dd < -0.5 ? 'neg' : '') + '">' + (dd > 0 ? '+' : '') + usd(dd) + '</td></tr>';
      }).join('') + '</tbody><caption>If sold after ' + H + (H === 1 ? ' year' : ' years') + ', after tax' + (st.display === 'real' ? ', today’s dollars' : '') + '. The first two rows are plain what-ifs. The four scenarios are paths drawn from the Power Law, not forecasts; even Floor assumes bitcoin keeps to the model’s lower line, and its price has closed below that line before.</caption>';

    // Chart
    var basis = chartCtl ? chartCtl.basis() : 'ifsold', key = basis === 'held' ? 'held' : 'ifSold';
    $('mpChartFrame').textContent = (basis === 'held' ? '(held, before any sale)' : '(if sold that year, after tax)') + (st.display === 'real' ? ', today’s dollars' : '');
    if (window.RealEstateChart) window.RealEstateChart.render('mp', {
      labels: R.rows.map(function (r) { return r.month === 0 ? 'Today' : 'Year ' + r.year; }),
      series: [
        { key: 'pay', label: 'Pay it down', style: 'house', data: R.rows.map(function (r) { return r.pay[key] / defl(r.year); }) },
        { key: 'hold', label: 'Hold bitcoin', style: 'btc', data: R.rows.map(function (r) { return r.hold[key] / defl(r.year); }) },
        { key: 'diff', label: 'Difference (hold − pay down)', style: 'diff', data: R.rows.map(function (r) { return (r.hold[key] - r.pay[key]) / defl(r.year); }) }
      ],
      fmt: usdK
    });

    // The grid
    if (window.RealEstateGrid && hasExtra) {
      var rates = [3, 4.5, 6, 7], hors = [5, 10, 20], extras = [250, 500, 1000];
      var gridScen = ['floor', 'stay', 'trend'];
      window.RealEstateGrid.render($('mpGrid'), {
        axes: [
          { id: 'rate', label: 'Scenario × mortgage rate', rows: { label: 'Scenario', items: gridScen.map(function (s) { return { label: SC_NAME[s].replace(' at today’s multiple', ''), v: s }; }) },
            cols: { label: 'Rate', items: rates.map(function (r) { return { label: r + '%', v: r }; }) } },
          { id: 'horizon', label: 'Scenario × years', rows: { label: 'Scenario', items: gridScen.map(function (s) { return { label: SC_NAME[s].replace(' at today’s multiple', ''), v: s }; }) },
            cols: { label: 'Years', items: hors.map(function (h) { return { label: h + ' yrs', v: h }; }) } }
        ],
        cell: function (pair, rowV, colV) {
          var over = { scenario: rowV };
          if (pair === 'rate') over.ratePct = colV; else over.horizon = colV;
          var hh = pair === 'horizon' ? colV : H;
          return M.paydownProjection(input(v, over)).diffIfSold / defl(hh);
        },
        mine: function (pair) {
          var r = gridScen.indexOf(st.scenario); if (r < 0) return null;
          var c = pair === 'rate' ? rates.indexOf(v.mrate) : hors.indexOf(H);
          return c < 0 ? null : [r, c];
        },
        ahead: ['Holding ahead', 'Paying down ahead'],
        frame: '(holding minus paying down, if sold, after tax' + (st.display === 'real' ? ', today’s dollars' : '') + ')',
        note: 'Every cell is the whole calculation rerun with one or two inputs changed and the rest as you set them. Orange: holding bitcoin ends ahead; blue: paying down does. The outlined cell is yours, when your inputs sit on the grid.'
      });
    } else if ($('mpGrid')) $('mpGrid').innerHTML = '';

    // The ledger
    if (window.RealEstateLedger) {
      var cols = function (k) { return [
        { label: 'Year', unit: '', get: function (r) { return r.month === 0 ? 'Today' : 'Year ' + r.year; }, fmt: 'text' },
        { label: 'Loan still owed', unit: '$', get: function (r) { return r[k].balance / defl(r.year); }, fmt: 'usd' },
        { label: 'Bitcoin held', unit: '₿', get: function (r) { return r[k].units; }, fmt: 'btc' },
        { label: 'Bitcoin, value', unit: '$', get: function (r) { return r[k].btcValue / defl(r.year); }, fmt: 'usd' },
        { label: 'Paid for it', unit: '$', get: function (r) { return r[k].basis / defl(r.year); }, fmt: 'usd' },
        { label: 'If sold, after tax, less the loan', unit: '$', get: function (r) { return r[k].ifSold / defl(r.year); }, fmt: 'usd' }
      ]; };
      window.RealEstateLedger.render($('mpLedger'), {
        note: 'Year by year, ' + (st.display === 'real' ? 'in today’s dollars (each year divided by inflation to then)' : 'in each year’s dollars') + '. Bitcoin held is in bitcoin, at the scenario’s price path from today’s price.',
        tabs: [{ id: 'pay', label: 'Pay it down', columns: cols('pay'), rows: R.rows }, { id: 'hold', label: 'Hold bitcoin', columns: cols('hold'), rows: R.rows }],
        final: { cols: ['Pay it down', 'Hold bitcoin'], rows: [
          { label: 'Bitcoin, value', values: [e.pay.btcValue / D, e.hold.btcValue / D] },
          { label: 'Trading cost on a sale', values: [-e.pay.btcValue * v.btctx / 100 / D, -e.hold.btcValue * v.btctx / 100 / D] },
          { label: 'Tax on the gain', values: [-e.pay.tax / D, -e.hold.tax / D] },
          { label: 'Loan still owed', values: [-e.pay.balance / D, -e.hold.balance / D] },
          { label: 'If sold, after tax, less the loan', values: [e.pay.ifSold / D, e.hold.ifSold / D] }
        ] },
        csv: { filename: 'bitcoin-vs-paying-down-the-mortgage.csv', meta: [
          ['Loan balance', v.bal], ['Mortgage rate %', v.mrate], ['Years left', v.yrsleft], ['Extra a month', v.extra], ['Lump sum', v.lump],
          ['Years compared', H], ['Scenario', SC_NAME[st.scenario]], ['Bitcoin today', Math.round(typeof TODAY_PRICE === 'number' ? TODAY_PRICE : 0)],
          ['Dollars', st.display === 'real' ? 'today’s, inflation ' + inflPct() + '%' : 'nominal'], ['Hurdle after tax %', hAfter === null ? '' : (hAfter * 100).toFixed(2)]
        ] }
      });
    }

    renderHistory(hAfter, H);
    writeUrl();
  }

  // ─── the record ───
  function renderHistory(h, H) {
    var t = $('mpHistTable'); if (!t) return;
    if (h === null) { t.innerHTML = ''; $('mpHistRate').textContent = 'the hurdle'; return; }
    $('mpHistRate').textContent = pct(h) + ' a year, your hurdle';
    var lens = [1, 3, 5, 10]; if (lens.indexOf(H) < 0) lens.push(H); lens.sort(function (a, b) { return a - b; });
    var any = null;
    t.innerHTML = '<thead><tr><th>Length of stretch</th><th>Stretches</th><th>Beat ' + pct(h) + ' a year</th><th>Worst yearly average</th></tr></thead><tbody>' +
      lens.map(function (n) {
        var x = M.hurdleHistory(h, n); if (!x || !x.count) return '<tr><td>' + n + ' years</td><td colspan="3">Too few months in the record</td></tr>';
        any = any || x;
        if (n === 1) $('mpHistWorst1').textContent = 'about ' + Math.round(-x.worst * 100) + '%';
        return '<tr' + (n === H ? ' class="mine"' : '') + '><td>' + n + (n === 1 ? ' year' : ' years') + (n === H ? ' (yours)' : '') + '</td><td>' + x.count + '</td><td>' + Math.round(x.share * 100) + '%</td><td>' + pctS(x.worst) + '</td></tr>';
      }).join('') + '</tbody>';
    if (any) $('mpHistSpan').textContent = any.first.slice(0, 4) + ' to ' + any.last;
  }

  // ─── URL (this page's own names; the carried ones go through RealEstateCarry) ───
  var touched = false;
  function writeUrl() {
    if (!touched || !window.history || !window.history.replaceState) return;
    var v = lastV, p = new URLSearchParams(window.location.search);
    function put(k, x, d) { if (x === d || String(x) === String(d)) p.delete(k); else p.set(k, String(x)); }
    put('bal', Math.round(v.bal), DEF.bal); put('mrate', v.mrate, DEF.mrate); put('yrsleft', v.yrsleft, DEF.yrsleft);
    put('extra', Math.round(v.extra), DEF.extra); put('lump', Math.round(v.lump), DEF.lump);
    put('acct', v.acct, DEF.acct); put('ded', v.ded ? '1' : '0', '0');
    var qs = p.toString(), url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    if (url !== window.location.pathname + window.location.search + window.location.hash) window.history.replaceState(null, '', url);
  }
  (function readUrl() {
    var p = new URLSearchParams(window.location.search), v = {};
    function n(k) { if (p.has(k)) { var x = parseFloat(p.get(k)); if (isFinite(x)) v[k] = x; } }
    n('bal'); n('mrate'); n('yrsleft'); n('extra'); n('lump');
    if (p.has('acct')) v.acct = p.get('acct');
    if (p.has('ded')) v.ded = p.get('ded') === '1';
    setInputs(v);
  })();

  // ─── wiring ───
  ['bal', 'mrate', 'yrsleft', 'extra', 'lump', 'horizon', 'tx'].forEach(function (k) {
    var x = el[k]; if (!x) return;
    x.addEventListener('change', function () {
      var v = readInputs();
      var map = { bal: 'bal', mrate: 'mrate', yrsleft: 'yrsleft', extra: 'extra', lump: 'lump', horizon: 'horizon', tx: 'btctx' };
      var val = v[map[k]];
      x.value = (k === 'bal' || k === 'extra' || k === 'lump') ? grouped(val) : val;
      touched = true; render();
    });
    x.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') x.blur(); });
  });
  ['bracket', 'state', 'tax', 'acct', 'ded'].forEach(function (k) { el[k].addEventListener('change', function () { touched = true; render(); }); });
  document.querySelectorAll('.mp-chip').forEach(function (b) {
    b.addEventListener('click', function () { st.scenario = b.getAttribute('data-scenario'); touched = true; render(); });
  });
  document.querySelectorAll('[data-display]').forEach(function (b) {
    b.addEventListener('click', function () {
      st.display = b.getAttribute('data-display');
      document.querySelectorAll('[data-display]').forEach(function (x) { var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      touched = true; render();
    });
  });
  function syncDisplayButtons() {
    document.querySelectorAll('[data-display]').forEach(function (x) { var on = x.getAttribute('data-display') === st.display; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  }
  if (window.ModelingAssumptions && window.ModelingAssumptions.subscribe) window.ModelingAssumptions.subscribe(function () { render(); });

  if (window.RealEstateCarry) window.RealEstateCarry.register({
    read: function () { var v = lastV || readInputs(); return { horizon: v.horizon, btctx: v.btctx, pscenario: st.scenario, displaymode: st.display, tax: v.tax, bracket: v.bracket, state: v.state }; },
    apply: function (vals) { setInputs(vals); syncDisplayButtons(); },
    writeUrl: true
  });
  syncDisplayButtons();

  // The live price arrives after first render: the scenarios start from it.
  render();
  if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price) { if (price > 0) { window.TODAY_PRICE = price; render(); } });

  // ─── QA (console: mpQA()) ───
  window.mpQA = function () {
    var v = readInputs(), out = [];
    var z = M.paydownProjection(input(v, { extra: 0, lump: 0, growth: 0.3 }));
    out.push(['no extra cash: households identical', Math.abs(z.diffIfSold) < 1e-6 && Math.abs(z.diffHeld) < 1e-6]);
    var h = M.paydownHurdle(input(v));
    if (h !== null) { var lv = M.paydownProjection(input(v, { growth: h })); out.push(['at the hurdle: level', Math.abs(lv.diffIfSold) < 0.01]); }
    var nt = M.paydownProjection(input(v, { growth: 0, btcTxPct: 0, tp: M.bvreTaxProfile({ taxRegime: 'none' }) }));
    out.push(['no tax, no cost, flat: holding trails by the interest saved', Math.abs(nt.diffIfSold + (nt.end.hold.interest - nt.end.pay.interest)) < 0.01]);
    var ok = out.every(function (x) { return x[1]; });
    if (window.console) console.table(out.map(function (x) { return { check: x[0], pass: x[1] }; }));
    return { ok: ok, checks: out };
  };
})();
