/* ───────────────────────────────────────────────
   BITCOIN INHERITANCE PLANNING — PAGE JS

   The cards are rendered at build time from src/_data/inheritance.json. This
   script adds three things, and the page is complete without it:

   1. The three-question check ("What would your heirs need?", STYLE_GUIDE
      §6.58). Each answer adds a line to every card, from the card's own `fit`
      text, in one of three tones: ok (✓), a caution (!), or a conflict (✕).
      A card with a conflict is dimmed, never hidden, and its flag names the
      conflict. Nothing is scored or sorted. The rules, from the card's `codes`:
        heir     "no"  → unaided: conflict · assisted: caution · app/nothing: ok
                 "yes" → ok for every card
        without  "must"   → no: conflict · partly/unknown: caution · yes: ok
                 "prefer" → no/partly/unknown: caution · yes: ok
                 "any"    → no line
        renew    "no"  → required: conflict · chosen: caution · none: ok
                 "yes" → ok for every card
      Answers live in memory only: not in the URL (a link carrying them would
      read as a shortlist, the lender page's rule for its filters) and not in
      storage.
   2. The detail dialog. Each card's <details class="bi-more"> expands in place
      without JS. With JS its summary opens #biDialog, filled with a clone of
      the whole card, and pushes #plan-<id>, so one card is linkable and Back
      closes it. A load with that hash opens the dialog after first render.
      Card elements are id="card-<id>", so in-page links scroll to a card and
      only #plan-<id> opens the dialog. Ported from bitcoin-lenders.js.
   3. The fresh-change badge: 14 days after a provider change logged with a
      date (inheritanceLog.json, kind "provider"), against the reader's clock.
   `?qa` exposes window.inheritanceQA for the harness.
   ─────────────────────────────────────────────── */
(function () {
  'use strict';
  var DATA = window.INHERITANCE || { plans: [], groups: [] };
  var byId = {};
  DATA.plans.forEach(function (p) { byId[p.id] = p; });
  var groupTitle = {};
  DATA.groups.forEach(function (g) { groupTitle[g.id] = g.title; });

  var cards = Array.prototype.slice.call(document.querySelectorAll('.bi-card'));
  var opts = Array.prototype.slice.call(document.querySelectorAll('.bi-opt'));
  var countEl = document.getElementById('biCount');
  var clearEl = document.getElementById('biClear');
  if (!cards.length) return;

  var ANS = { heir: null, without: null, renew: null };
  var SHORT = {
    heir: 'needs your heir to use a key on their own',
    without: 'doesn’t work without the company',
    renew: 'needs a renewal you said you wouldn’t make'
  };
  var ICON = { ok: '✓', warn: '!', rule: '✕' };

  function tone(q, a, code) {
    if (q === 'heir') {
      if (a === 'no') return code === 'unaided' ? 'rule' : code === 'assisted' ? 'warn' : 'ok';
      return 'ok';
    }
    if (q === 'without') {
      if (a === 'any') return null;
      if (code === 'yes') return 'ok';
      if (code === 'no') return a === 'must' ? 'rule' : 'warn';
      return 'warn';   // partly, unknown
    }
    if (q === 'renew') {
      if (a === 'no') return code === 'required' ? 'rule' : code === 'chosen' ? 'warn' : 'ok';
      return 'ok';
    }
    return null;
  }

  // The verdict for one plan under the current answers: the lines to show and
  // whether it conflicts. Pure, so the QA hook can call it with any answers.
  function verdict(plan, ans) {
    var lines = [], rules = [];
    ['heir', 'without', 'renew'].forEach(function (q) {
      var a = ans[q]; if (!a) return;
      var code = q === 'heir' ? plan.codes.heirUse : plan.codes[q];
      var t = tone(q, a, code); if (!t) return;
      lines.push({ q: q, tone: t, text: plan.fit[q] });
      if (t === 'rule') rules.push(SHORT[q]);
    });
    return { lines: lines, conflict: rules.length > 0, reasons: rules };
  }

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function renderCard(card) {
    var plan = byId[card.dataset.id]; if (!plan) return;
    var v = verdict(plan, ANS);
    var fit = document.getElementById('fit-' + plan.id);
    var flag = document.getElementById('flag-' + plan.id);
    if (fit) {
      fit.innerHTML = v.lines.map(function (l) {
        return '<div class="bi-fit-line bi-fit-' + l.tone + '"><span class="bi-fit-i" aria-hidden="true">' + ICON[l.tone] + '</span><span>' +
          '<span class="sr-only">' + (l.tone === 'rule' ? 'Conflicts with your answer: ' : l.tone === 'warn' ? 'Caution: ' : 'No conflict: ') + '</span>' + esc(l.text) + '</span></div>';
      }).join('');
      fit.hidden = !v.lines.length;
    }
    if (flag) flag.textContent = v.conflict ? 'Conflicts with your answers: ' + v.reasons.join(' · ') : '';
    card.classList.toggle('bi-off', v.conflict);
    return v;
  }

  function renderAll() {
    var answered = Object.keys(ANS).some(function (k) { return ANS[k]; });
    var off = 0;
    cards.forEach(function (c) { var v = renderCard(c); if (v && v.conflict) off++; });
    opts.forEach(function (b) { b.setAttribute('aria-pressed', String(ANS[b.dataset.q] === b.dataset.a)); });
    if (clearEl) clearEl.hidden = !answered;
    if (countEl) {
      if (!answered) countEl.textContent = cards.length + ' plans in three groups';
      else if (!off) countEl.innerHTML = 'None of the ' + cards.length + ' plans conflicts with your answers; each card says what it would ask.';
      else countEl.innerHTML = '<strong>' + off + ' of ' + cards.length + '</strong> plans conflict with your answers and are dimmed; each says why.';
    }
  }

  opts.forEach(function (b) {
    b.addEventListener('click', function () {
      var q = b.dataset.q, a = b.dataset.a;
      ANS[q] = ANS[q] === a ? null : a;   // a second press clears the answer
      renderAll();
    });
  });
  if (clearEl) clearEl.addEventListener('click', function () {
    ANS = { heir: null, without: null, renew: null };
    renderAll();
  });

  // ─── QA hook (?qa) ───
  if (/[?&]qa\b/.test(window.location.search)) {
    window.inheritanceQA = {
      answers: function () { return Object.assign({}, ANS); },
      set: function (q, a) { ANS[q] = a; renderAll(); },
      clear: function () { ANS = { heir: null, without: null, renew: null }; renderAll(); },
      verdict: function (id, ans) { return verdict(byId[id], ans || ANS); },
      tone: tone,
      cards: function () {
        return cards.map(function (c) {
          return { id: c.dataset.id, off: c.classList.contains('bi-off'), flag: (document.getElementById('flag-' + c.dataset.id) || {}).textContent,
                   lines: Array.prototype.map.call(c.querySelectorAll('.bi-fit-line'), function (l) { return { tone: (l.className.match(/bi-fit-(ok|warn|rule)/) || [])[1], text: l.textContent }; }) };
        });
      }
    };
  }

  // ─── the detail dialog ───
  var dialog = document.getElementById('biDialog');
  var dBody  = document.getElementById('biDialogBody');
  var dCrumb = document.getElementById('biDialogCrumb');
  var dClose = document.getElementById('biDialogClose');
  var canDialog = !!(dialog && typeof dialog.showModal === 'function');
  if (canDialog) document.body.classList.add('bi-js');

  // Did THIS page push the #plan- entry? Only then may closing use
  // history.back(); after a deep-link load Back would leave the page.
  var pushedHash = false;
  function openDetail(id, pushHash) {
    var card = document.getElementById('card-' + id);
    if (!card || !canDialog) return;
    var clone = card.cloneNode(true);
    clone.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });   // ids stay unique
    var more = clone.querySelector('.bi-more'); if (more) more.open = true;
    dBody.innerHTML = '';
    while (clone.firstChild) dBody.appendChild(clone.firstChild);   // the card's parts become the dialog grid's children
    var how = dBody.querySelector('.bi-how'), head = dBody.querySelector('.bi-head');
    if (how && head && head.parentNode === dBody) dBody.insertBefore(how, head.nextSibling);   // "How this plan works" reads first
    dCrumb.textContent = groupTitle[card.dataset.group] || '';
    dialog.dataset.id = id;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    if (pushHash && location.hash !== '#plan-' + id) {
      history.pushState({ plan: id }, '', location.pathname + location.search + '#plan-' + id);
      pushedHash = true;
    }
  }
  function closeDetail(viaHistory) {
    if (!dialog || !dialog.open) return;
    dialog.close();
    if (viaHistory) { pushedHash = false; return; }
    if (/^#plan-/.test(location.hash)) {
      if (pushedHash) history.back();
      else history.replaceState(null, '', location.pathname + location.search);
    }
    pushedHash = false;
  }
  if (canDialog) {
    cards.forEach(function (card) {
      var more = card.querySelector('.bi-more');
      if (!more) return;
      more.querySelector('.bi-more-btn').addEventListener('click', function (e) {
        e.preventDefault(); openDetail(card.dataset.id, true);
      });
    });
    dClose.addEventListener('click', function () { closeDetail(false); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeDetail(false); });   // backdrop
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); closeDetail(false); });     // Escape
    window.addEventListener('popstate', function () {
      var m = location.hash.match(/^#plan-([a-z0-9-]+)$/);
      if (m) openDetail(m[1], false); else closeDetail(true);
    });
    // the answers re-render the cards; keep an open dialog in step
    var _renderAll = renderAll;
    renderAll = function () { _renderAll(); if (dialog.open && dialog.dataset.id) openDetail(dialog.dataset.id, false); };
  }

  renderAll();
  var m0 = canDialog && location.hash.match(/^#plan-([a-z0-9-]+)$/);
  if (m0 && byId[m0[1]]) { history.replaceState({ plan: m0[1] }, '', location.href); openDetail(m0[1], false); }
})();

/* ── The fresh-change badge (the lender page's marker) ──
   A card whose newest provider change is under FRESH_DAYS old, against the
   reader's clock, shows its badge with the pulsing dot, and the lines that
   entry names in `changes` are highlighted. Computed in the browser, so a
   badge can't outlive its news between deploys. */
(function () {
  var FRESH_DAYS = 14;
  var WORD = { launch: 'Launched', terms: 'Terms changed', price: 'Price changed', availability: 'Availability changed', exit: 'Exited' };
  var now = Date.now();
  document.querySelectorAll('.bi-changed[data-log-date]').forEach(function (b) {
    var t = Date.parse(b.getAttribute('data-log-date') + 'T00:00:00Z');
    if (!isFinite(t) || (now - t) / 864e5 > FRESH_DAYS || t > now + 864e5) return;
    var label = (b.getAttribute('data-log-label') || '').replace(/ \d{4}$/, '');
    var txt = b.querySelector('.bi-changed-t') || b;
    txt.textContent = (WORD[b.getAttribute('data-log-type')] || 'Changed') + ' ' + label;
    b.title = 'See What changed, below the cards';
    b.hidden = false;
    var card = b.closest('.bi-card');
    if (!card) return;
    card.classList.add('bi-fresh');
    var changes = [];
    try { changes = JSON.parse(b.getAttribute('data-log-changes') || '[]'); } catch (e) { changes = []; }
    changes.forEach(function (c) {
      var el = card.querySelector('[data-f="' + c.field + '"]');
      if (el) { el.classList.add('bi-hl'); el.title = (c.was ? 'Was ' + c.was + ' before ' : 'Changed ') + label; }
    });
  });
})();
