/* ───────────────────────────────────────────────
   BORROWING AGAINST BITCOIN: THE LENDERS — PAGE JS

   The cards are rendered at build time from src/_data/lenders.json. This
   script adds the three things that need a live price or a reader's input:

   1. Trigger prices. Every card with published LTV lines gets its sentence
      recomputed from the live bitcoin price:
        trigger price = price × L_open ÷ L_threshold
        drawdown      = 1 − L_open ÷ L_threshold
      The same arithmetic as BAS's loan-health calculator (liqPrice = loan ÷
      (stack × threshold)), so the two pages cannot disagree. Lenders with no
      published maximum opening LTV (ltv.reference) are quoted at a 50% loan.
   2. The reader's own LTV. One control switches every card from the lender's
      maximum loan to a loan-to-value the reader sets. Above a lender's
      maximum the card says so and keeps the lender's own figure.
   3. Filters. Chips are AND-ed; the state select hides cards whose published
      list excludes the state and marks cards whose lender publishes no list
      (never inferred). Hidden groups collapse; an empty result says so.

   Price: TODAY_PRICE (the latest PL_DATA sample) seeds the page, then
   fetchTodayPrice() (shared/power-law-data.js) replaces it with the live
   spot and the label says which it is. URL: `ltv=<n>` is written only when
   the reader moves the control (never on load, never at the default), and
   read on load so a shared link reproduces the view. Filters are not in the
   URL by design: a filtered link would read as a shortlist.
   ─────────────────────────────────────────────── */
(function () {
  'use strict';
  var DATA = window.LENDERS || { lenders: [] };
  var byId = {};
  DATA.lenders.forEach(function (l) { byId[l.id] = l; });

  var live     = document.getElementById('lnLive');
  var priceEl  = document.getElementById('lnPrice');
  var srcEl    = document.getElementById('lnPriceSrc');
  var ownWrap  = document.getElementById('lnOwnWrap');
  var ownRange = document.getElementById('lnOwnLtv');
  var ownOut   = document.getElementById('lnOwnLtvOut');
  var radios   = document.querySelectorAll('input[name="lnMode"]');
  var cards    = Array.prototype.slice.call(document.querySelectorAll('.ln-card'));
  if (!live || !cards.length) return;

  var state = { price: null, source: null, mode: 'max', own: 0.35 };

  // ─── formatting ───
  function money(x) { return '$' + (Math.round(x / 100) * 100).toLocaleString('en-US'); } // nearest $100, as the cards quote
  function pct(open, thr) { return '−' + Math.round((1 - open / thr) * 100) + '%'; }
  function pctNum(x) { return Math.round(x * 100) + '%'; }
  function num(attr) { var v = parseFloat(attr); return isFinite(v) && v > 0 ? v : null; }

  // ─── the trigger sentence ───
  // Mirrors the build-time Nunjucks sentence in bitcoin-lenders.njk, with the
  // price filled in. Keep the two in step: same verbs (ltv.callVerb /
  // ltv.liqVerb from the data), same order, same "extra" tail.
  function autoSentence(l, base, label) {
    var ltv = l.ltv, parts = [];
    if (ltv.call) parts.push(ltv.callVerb + ' at <strong>' + money(state.price * base / ltv.call) + '</strong> (' + pct(base, ltv.call) + ')');
    if (ltv.liq)  parts.push(ltv.liqVerb  + ' at <strong>' + money(state.price * base / ltv.liq)  + '</strong> (' + pct(base, ltv.liq)  + ')');
    if (!parts.length) return '';
    return 'At ' + money(state.price) + ', ' + label + ' ' + parts.join(' and ') + '.';
  }

  function renderTrigger(card) {
    var l = byId[card.dataset.id]; if (!l) return;
    var out = document.getElementById('trig-' + l.id); if (!out) return;
    var ltv = l.ltv;
    if (l.trig.mode === 'text') {
      if (!l.trig.live || !state.price) return; // static sentence stays
      var base = ltv.open || ltv.reference || 0.5;
      var t = l.trig.live.replace(/\{price\}/g, money(state.price))
        .replace(/\{px([0-9.]+)\}/g, function (m, k) { return money(state.price * parseFloat(k)); }); // {px0.31} = 31% of today's price
      if (ltv.call) t = t.replace(/\{call\}/g, money(state.price * base / ltv.call)).replace(/\{callPct\}/g, pct(base, ltv.call));
      if (ltv.liq)  t = t.replace(/\{liq\}/g,  money(state.price * base / ltv.liq)).replace(/\{liqPct\}/g,  pct(base, ltv.liq));
      out.innerHTML = t;
      return;
    }
    if (!state.price || !(ltv.call || ltv.liq)) return;
    var html = '';
    if (state.mode === 'own') {
      if (ltv.open && state.own > ltv.open + 1e-9) {
        html = '<span class="ln-above">' + pctNum(state.own) + ' is above ' + l.name + '’s maximum opening LTV of ' + pctNum(ltv.open) + '.</span> ' +
               autoSentence(l, ltv.open, 'a loan at that maximum');
      } else {
        html = autoSentence(l, state.own, 'a loan at ' + pctNum(state.own) + ' LTV');
      }
    } else if (ltv.open) {
      html = autoSentence(l, ltv.open, 'a maximum loan (' + pctNum(ltv.open) + ' LTV)');
    } else {
      html = autoSentence(l, ltv.reference || 0.5, 'a 50% loan (' + l.name + ' doesn’t publish a maximum)');
    }
    if (l.trig.extra) html += ' ' + l.trig.extra;
    out.innerHTML = html;
  }

  function renderAll() {
    if (state.price) {
      priceEl.textContent = money(state.price);
      srcEl.textContent = state.source === 'live' ? '(live)' : (typeof todayPriceAsOf === 'function' ? '(last sample, ' + todayPriceAsOf() + ')' : '');
    }
    live.setAttribute('data-mode', state.mode);
    ownOut.textContent = pctNum(state.own);
    cards.forEach(renderTrigger);
  }

  // ─── price ───
  if (typeof TODAY_PRICE !== 'undefined' && TODAY_PRICE > 0) {
    state.price = TODAY_PRICE; state.source = 'fallback';
  }
  if (typeof fetchTodayPrice === 'function') {
    fetchTodayPrice(function (price, source) {
      if (price > 0) { state.price = price; state.source = source; renderAll(); }
    });
  }

  // ─── own-LTV control ───
  // `ltv=<n>` on the URL selects the reader's-own mode at that value (a shared
  // link reproduces the view); nothing is written until the reader moves it.
  var params = new URLSearchParams(window.location.search);
  var urlLtv = parseInt(params.get('ltv'), 10);
  if (urlLtv >= 10 && urlLtv <= 80) {
    state.mode = 'own'; state.own = urlLtv / 100;
    ownRange.value = urlLtv;
    radios.forEach(function (r) { r.checked = (r.value === 'own'); });
  }
  function writeUrl() {
    var p = new URLSearchParams(window.location.search);
    if (state.mode === 'own') p.set('ltv', Math.round(state.own * 100)); else p.delete('ltv');
    var qs = p.toString();
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash);
  }
  radios.forEach(function (r) {
    r.addEventListener('change', function () { state.mode = r.value; renderAll(); writeUrl(); });
  });
  ownRange.addEventListener('input', function () {
    state.own = parseInt(ownRange.value, 10) / 100;
    if (state.mode !== 'own') { state.mode = 'own'; radios.forEach(function (r) { r.checked = (r.value === 'own'); }); }
    renderAll(); writeUrl();
  });
  ownWrap.addEventListener('click', function () {
    if (state.mode !== 'own') { state.mode = 'own'; radios.forEach(function (r) { r.checked = (r.value === 'own'); }); renderAll(); writeUrl(); }
  });

  // ─── filters ───
  var chips   = Array.prototype.slice.call(document.querySelectorAll('.ln-chip'));
  var stateSel = document.getElementById('lnState');
  var stateLab = stateSel ? stateSel.parentNode : null;
  var countEl = document.getElementById('lnCount');
  var emptyEl = document.getElementById('lnEmpty');
  var groups  = Array.prototype.slice.call(document.querySelectorAll('.ln-group'));
  var active  = {};

  function stateVerdict(card, st) {
    // 'yes' | 'no' | 'unknown' for a chosen US state.
    var type = card.dataset.statesType;
    var list = (card.dataset.statesList || '').split(',').filter(Boolean);
    if (!st) return 'yes';
    if (type === 'all') return 'yes';
    if (type === 'none') return 'no';
    if (type === 'include') return list.indexOf(st) >= 0 ? 'yes' : 'no';
    if (type === 'exclude') return list.indexOf(st) >= 0 ? 'no' : (card.dataset.statesRest === 'unknown' ? 'unknown' : 'yes');
    return 'unknown';
  }

  function applyFilters() {
    var st = stateSel ? stateSel.value : '';
    var shown = 0;
    cards.forEach(function (card) {
      var ok = true;
      Object.keys(active).forEach(function (k) {
        if (!active[k]) return;
        var attr = { bitcoinOnly: 'bitcoinOnly', noRehyp: 'noRehyp', holdKey: 'holdKey', noPriceLiq: 'noPriceLiq', under5k: 'under5k' }[k];
        if (attr && card.dataset[attr] !== 'y') ok = false;
      });
      var note = document.getElementById('state-' + card.dataset.id);
      var v = stateVerdict(card, st);
      if (v === 'no') ok = false;
      card.classList.toggle('ln-dim', ok && v === 'unknown');
      if (note) note.textContent = (ok && v === 'unknown') ? 'Availability in ' + st + ': not published by the lender' : '';
      card.hidden = !ok;
      if (ok) shown++;
    });
    groups.forEach(function (g) {
      var any = g.querySelectorAll('.ln-card:not([hidden])').length > 0;
      g.hidden = !any;
    });
    if (countEl) countEl.textContent = shown + ' of ' + cards.length + ' lenders';
    if (emptyEl) emptyEl.hidden = shown > 0;
    if (stateLab) stateLab.classList.toggle('on', !!st);
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter;
      if (f === 'all') {
        active = {};
        chips.forEach(function (c) { c.classList.toggle('on', c.dataset.filter === 'all'); });
        if (stateSel) stateSel.value = '';
      } else {
        active[f] = !active[f];
        chip.classList.toggle('on', !!active[f]);
        var anyOn = Object.keys(active).some(function (k) { return active[k]; }) || (stateSel && stateSel.value);
        chips.forEach(function (c) { if (c.dataset.filter === 'all') c.classList.toggle('on', !anyOn); });
      }
      applyFilters();
    });
  });
  if (stateSel) stateSel.addEventListener('change', function () {
    var anyOn = Object.keys(active).some(function (k) { return active[k]; }) || stateSel.value;
    chips.forEach(function (c) { if (c.dataset.filter === 'all') c.classList.toggle('on', !anyOn); });
    applyFilters();
  });

  // ─── QA hook (?qa): the arithmetic every card uses, exposed for the harness ───
  if (/[?&]qa\b/.test(window.location.search)) {
    window.lendersQA = {
      state: state,
      trigger: function (price, open, thr) { return price * open / thr; },
      drawdown: function (open, thr) { return 1 - open / thr; },
      cards: function () {
        return cards.map(function (c) { return { id: c.dataset.id, hidden: !!c.hidden, dim: c.classList.contains('ln-dim'), trig: (document.getElementById('trig-' + c.dataset.id) || {}).textContent }; });
      }
    };
  }

  renderAll();
  applyFilters();
})();
