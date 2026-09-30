/* ============================================================
   RealEstateCarry — the pair's shared inputs, carried between pages
   ============================================================
   /bitcoin-vs-real-estate (BvRE) and /bitcoin-vs-rental-property
   (BvRP). PR 8; REAL_ESTATE_PAIR_DESIGN.md §11, rulings P3 and P9.

   THE VOCABULARY (P3). BvRE's URL names are the pair's names; BvRP reads
   them; no prefixes (SITE_GUIDE §46). The inputs both calculators have,
   meaning the same thing on both:

     horizon      years from today       BvRE fwdHorizon · BvRP holding period
     happr        home appreciation, nominal %/yr (both: lcs.homeApprNominal)
     sell         selling costs, % of the sale price
     btctx        bitcoin trading cost, % of each purchase or sale
     pscenario    bitcoin scenario: floor | stay | trend | upper (M3)
     displaymode  real | nominal
     tax          tax regime: us | none (custom exists on BvRE only)
     bracket      federal bracket, % (12, 22, 24, 32, 35, 37)
     state        state code (OTHER = typical, ~5%)

   Not carried, because the two pages mean different things by them: the
   home price (a house to buy vs. a rental owned), the mortgage (a new loan
   vs. the one on the rental), BvRE's filing status, account and custom
   rates (BvRP has none of them). A value equal to the pair default is
   left out of the link, as BvRE's own writer does.

   A PAGE registers once its calculator is bound:
     RealEstateCarry.register({
       read()        → { horizon: 10, happr: 4.68, … } (the page's current values)
       apply(values) → optional: set the page's inputs from carried values
                       (BvRP; BvRE's own URL reader already reads these names)
       writeUrl      → optional true: keep the address bar's carried params
                       current once the reader touches something (BvRP,
                       which has no URL writer of its own)
       legacyNote(m) → optional: show the one-line note for a legacy `appr`
     })

   LINKS. Any <a data-re-carry="/other-page" data-re-carry-hash="calculator">
   has its href rewritten with the current params: on load, and after any
   input, change or click on the page. Without script the href in the
   markup stands, a plain link (components/real-estate-series.njk, and each
   page's "Run this on the other side" link).
   ============================================================ */
(function(){
  'use strict';

  var KEYS = ['horizon', 'happr', 'sell', 'btctx', 'pscenario', 'displaymode', 'tax', 'bracket', 'state'];
  var SCENARIOS = ['floor', 'stay', 'trend', 'upper'];
  var adapter = null;

  function defaults(){
    var D = (window.RealEstateModel && window.RealEstateModel.PAIR_DEFAULTS) || {};
    var happr = 4.68;
    try {
      var dim = window.ModelingAssumptions._dimensions.homeApprNominal;
      happr = dim.presetValues[dim.defaultPreset];
    } catch (e) { /* the literal stands */ }
    return { horizon: 10, happr: happr, sell: D.sellPct, btctx: D.btcTxPct, pscenario: 'stay',
             displaymode: 'real', tax: 'us', bracket: '24', state: 'OTHER' };
  }
  function same(a, b){
    if (typeof a === 'number' || typeof b === 'number') return Number(a) === Number(b);
    return String(a) === String(b);
  }
  function round2(v){ return Math.round(v * 100) / 100; }

  // The page's current values as URL params, defaults left out.
  function params(){
    var p = new URLSearchParams();
    if (!adapter) return p;
    var v = adapter.read() || {}, d = defaults();
    KEYS.forEach(function(k){
      var x = v[k];
      if (x === undefined || x === null || x === '') return;
      if (typeof x === 'number') { if (!isFinite(x)) return; x = round2(x); }
      if (same(x, d[k])) return;
      p.set(k, String(x));
    });
    return p;
  }
  function href(path, hash){
    var qs = params().toString();
    return path + (qs ? '?' + qs : '') + (hash ? '#' + hash : '');
  }

  // Carried values from a URL, checked: numbers finite, enums known.
  function read(search){
    var p = new URLSearchParams(search), out = {};
    function num(k){ if (!p.has(k)) return; var n = parseFloat(p.get(k)); if (isFinite(n)) out[k] = n; }
    function one(k, list){ if (!p.has(k)) return; var s = p.get(k); if (!list || list.indexOf(s) !== -1) out[k] = s; }
    num('horizon'); num('happr'); num('sell'); num('btctx');
    one('pscenario', SCENARIOS); one('displaymode', ['real', 'nominal']);
    one('tax'); one('bracket'); one('state');
    return out;
  }

  // A link made before PR 4a may carry `appr`, a REAL rate (P3): convert it
  // to nominal at the sitewide inflation, once. The same words as BvRE's.
  function legacyAppr(search){
    var p = new URLSearchParams(search);
    if (!p.has('appr') || p.has('happr') || !window.ModelingAssumptions) return null;
    var real = parseFloat(p.get('appr'));
    if (!isFinite(real)) return null;
    var infl = window.ModelingAssumptions.get('inflation').value;
    var nominal = Math.round(((1 + real / 100) * (1 + infl / 100) - 1) * 10000) / 100;
    var r2 = function(v){ return parseFloat(Number(v).toFixed(2)) + '%'; };
    return { real: real, nominal: nominal, inflation: infl,
             note: 'This link used an older format: its ' + r2(real) + ' a year real home appreciation was converted to ' + r2(nominal) + ' nominal at the ' + r2(infl) + ' inflation assumption.' };
  }

  function refreshLinks(){
    document.querySelectorAll('a[data-re-carry]').forEach(function(a){
      a.setAttribute('href', href(a.getAttribute('data-re-carry'), a.getAttribute('data-re-carry-hash')));
    });
  }
  var touched = false;
  function writeUrl(){
    if (!adapter || !adapter.writeUrl || !touched || !window.history || !window.history.replaceState) return;
    var cur = new URLSearchParams(window.location.search), carried = params();
    KEYS.forEach(function(k){ cur.delete(k); });
    cur.delete('appr');
    carried.forEach(function(v, k){ cur.set(k, v); });
    var qs = cur.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    if (url !== window.location.pathname + window.location.search + window.location.hash) window.history.replaceState(null, '', url);
  }
  var timer = null;
  function schedule(){
    if (timer) clearTimeout(timer);
    timer = setTimeout(function(){ timer = null; refreshLinks(); writeUrl(); }, 250);
  }

  function register(a){
    adapter = a;
    if (a.apply) {
      var legacy = legacyAppr(window.location.search), vals = read(window.location.search);
      if (legacy && vals.happr === undefined) vals.happr = legacy.nominal;
      a.apply(vals);
      if (legacy && a.legacyNote) a.legacyNote(legacy.note);
      // Never written again: drop it from the address bar now.
      if (legacy && window.history && window.history.replaceState) {
        var q = new URLSearchParams(window.location.search);
        q.delete('appr');
        var qs = q.toString();
        window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
      }
    }
    ['input', 'change', 'click'].forEach(function(ev){
      document.addEventListener(ev, function(){ touched = true; schedule(); });
    });
    if (window.ModelingAssumptions && window.ModelingAssumptions.subscribe) window.ModelingAssumptions.subscribe(schedule);
    refreshLinks();
    // Once more after the page's own load-time work (BvRE restores its
    // inputs from storage and the URL on DOMContentLoaded).
    setTimeout(refreshLinks, 0);
    window.addEventListener('load', refreshLinks);
  }

  window.RealEstateCarry = {
    KEYS: KEYS,
    register: register,
    params: params,
    href: href,
    read: read,
    legacyAppr: legacyAppr,
    defaults: defaults,
    refresh: refreshLinks
  };
})();
