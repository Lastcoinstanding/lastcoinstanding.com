/* ═══════════════════════════════════════════════════════════════
   BITCOIN AS COLLATERAL — page script

   1. Sticky-offset measurement (the tab bar must sit under the site nav)
   2. Tabs + end-of-tab continue links
   3. Scorecard: data model, three lens views, strips row, reasoning box
   4. Mover (▲) tooltips — a single position:fixed card, because the
      scorecard lives inside an overflow-x:auto container that clips any
      absolutely-positioned sibling card

   No colours here: every rating maps to a CSS class, so the palette
   lives entirely in bitcoin-as-collateral.css (checklist §1).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var page = document.getElementById('bacPage');
  if (!page) return;

  /* ─── 1. STICKY OFFSET ───
     .site-nav is sticky at top:0 and its height differs between the
     desktop link row and the mobile hamburger row. Measure it rather
     than hardcoding a magic number (the two existing sticky sub-bars on
     the site disagree — 65px on Bitcoin Defined, 44px on Money Trees —
     which is exactly the drift a measurement avoids). */
  var navEl = document.querySelector('.site-nav');
  function syncNavHeight() {
    var h = navEl ? Math.round(navEl.getBoundingClientRect().height) : 65;
    document.documentElement.style.setProperty('--bac-nav-h', h + 'px');
    return h;
  }
  syncNavHeight();
  window.addEventListener('resize', syncNavHeight);

  /* ─── 2. TABS ─── */
  var tabBtns = page.querySelectorAll('.tab-btn');
  var tabBar = page.querySelector('.bac-tabbar');

  function goTab(id, scroll) {
    var found = false;
    Array.prototype.forEach.call(tabBtns, function (b) {
      var on = b.getAttribute('data-tab') === id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) found = true;
    });
    if (!found) return;
    Array.prototype.forEach.call(page.querySelectorAll('.tab-content'), function (p) {
      p.classList.toggle('active', p.id === 'tab-' + id);
    });
    closeTip();
    if (scroll !== false && tabBar) {
      /* Land the reader at the top of the tab bar. The bar is sticky
         under the site nav, so the scroll target is the bar's document
         position minus the nav height it will sit beneath. */
      var navH = syncNavHeight();
      var y = tabBar.getBoundingClientRect().top + window.pageYOffset - navH;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  Array.prototype.forEach.call(tabBtns, function (b) {
    b.addEventListener('click', function () { goTab(b.getAttribute('data-tab'), true); });
  });

  /* End-of-tab continue links, and the in-prose "the record in The
     Practice tab" references. */
  Array.prototype.forEach.call(page.querySelectorAll('[data-goto]'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      goTab(a.getAttribute('data-goto'), true);
    });
  });

  /* ─── 3. SCORECARD ─── */
  var ASSETS = [
    { id: 'tsy',    name: 'U.S. Treasuries',                grp: 1 },
    { id: 're',     name: 'Real estate',                    grp: 1 },
    { id: 'eq',     name: 'Equities (margin)',              grp: 1 },
    { id: 'goldp',  name: 'Gold – physical, allocated', grp: 1 },
    { id: 'goldpa', name: 'Gold – paper, unallocated',  grp: 0 },
    { id: 'btcs',   name: 'Bitcoin – self-custody / multisig', grp: 1 },
    { id: 'btcc',   name: 'Bitcoin – custodial',        grp: 0 }
  ];

  var ROWS = [
    { id: 'exist',  name: 'Verifiable existence' },
    { id: 'price',  name: 'Continuous price' },
    { id: 'liq',    name: 'Liquidity on seizure' },
    { id: 'fung',   name: 'Fungibility & divisibility' },
    { id: 'title',  name: 'Unencumbered title' },
    { id: 'legal',  name: 'Legal certainty in bankruptcy' },
    { id: 'settle', name: 'Settlement on seizure' },
    { id: 'cost',   name: 'Custody cost at scale' },
    { id: 'stress', name: 'Performance under stress' },
    { id: 'income', name: 'Income while pledged' }
  ];

  /* The three lens views. Filtered and REDRAWN, never dimmed — a dimmed
     row still reads as a rating the reader has to discount. */
  var LENS = {
    all: {
      order: ['exist', 'price', 'liq', 'fung', 'title', 'legal', 'settle', 'cost', 'stress', 'income'],
      note: ''
    },
    lender: {
      order: ['liq', 'stress', 'title', 'legal', 'exist', 'settle'],
      note: 'Showing the six properties lenders weigh most, in rough order of importance.'
    },
    borrower: {
      order: ['price', 'fung', 'cost', 'income'],
      note: 'Showing the four properties borrowers feel most, in rough order of importance.'
    }
  };

  /* Cells this page's thesis expects to move, and what would move them. */
  var MOVERS = { liq: ['btcs', 'btcc'], legal: ['btcs', 'btcc'], stress: ['btcs', 'btcc'] };
  var TRIP = {
    legal:  'What would move it: state adoption of UCC Article 12, and the CLARITY Act’s custody and bankruptcy protections',
    stress: 'What would move it: holding up in the next genuine panic',
    liq:    'What would move it: deeper markets, declining volatility'
  };

  var WORD = ['Poor', 'Weak', 'Mixed', 'Good', 'Strong'];

  /* [rating 0-4, reasoning] per row per asset. 10 rows × 7 assets. */
  var S = {
    exist: {
      tsy:    [3, 'Book entries at the Fed and DTC: existence is a ledger fact, but the ledger belongs to the intermediary, not to you.'],
      re:     [2, 'Title registries plus physical presence – yet title insurance exists precisely because the records fail. Verification is periodic and paid for.'],
      eq:     [3, 'Reliable book entry at the depository. What you verify is a claim held in street name, not the share itself.'],
      goldp:  [1, 'The bar must be assayed, weighed and inspected. Verification is physical, costly, and repeats at every transfer. The salad-oil rule applies: someone has to dip the tanks.'],
      goldpa: [1, 'You verify a statement, not metal. Unallocated gold is an IOU; its existence rests on the issuer’s solvency.'],
      btcs:   [4, 'Anyone with a node verifies existence, amount and address in seconds, without permission and without an intermediary attesting to anything.'],
      btcc:   [1, 'The chain proves the custodian’s coins exist, not that yours are among them. Proof of reserves without proof of liabilities is half an answer.']
    },
    price: {
      tsy:    [3, 'Deep, continuous pricing through trading hours: the world’s reference curve.'],
      re:     [0, 'Appraised occasionally, sold rarely. The "price" is an estimate that starts ageing the moment it is written.'],
      eq:     [3, 'Marked to market every trading second, but only in trading hours, with circuit breakers arriving exactly when prices move most.'],
      goldp:  [3, 'A continuous global spot price for the metal in general; your specific bars still need assay to reach it.'],
      goldpa: [3, 'Priced continuously off spot: the claim stays liquid even when the metal would not be.'],
      btcs:   [4, 'Priced globally, 24/7/365. No close, no halt, no gap between the asset and its market.'],
      btcc:   [4, 'The same continuous global price. What differs is not the price of bitcoin but whether the coins behind your balance are there – see the title row.']
    },
    liq: {
      tsy:    [4, 'The deepest market on earth. A lender can sell size in minutes without moving the price against themselves.'],
      re:     [0, 'Months of judicial process, then an illiquid sale. Seizure is a legal campaign, not a transaction.'],
      eq:     [3, 'Liquid at moderate size in normal hours, but forced sales cluster in exactly the sessions when everyone else is forced too.'],
      goldp:  [2, 'Liquid at spot in principle; moving physical size means transport, insurance, assay and settlement friction in practice.'],
      goldpa: [3, 'Paper claims sell instantly, into a market whose depth depends on the issuer honouring them.'],
      btcs:   [3, 'Global 24/7 order books absorb size well; depth thins in the same crashes that trigger liquidations.'],
      btcc:   [3, 'As liquid as the market, reached through a withdrawal or trading queue that, in every documented failure, froze first.']
    },
    fung: {
      tsy:    [3, 'Standardised issues, divisible by market convention.'],
      re:     [0, 'Every parcel is unique. You cannot seize the guest bedroom.'],
      eq:     [3, 'Perfectly fungible within an issue; divisible to a single share.'],
      goldp:  [2, 'Fungible in principle; in practice bars carry serial numbers, purities and assay histories that follow them around.'],
      goldpa: [3, 'Claims are fungible by construction, which is both their convenience and their risk.'],
      btcs:   [4, 'Divisible to eight decimal places: a lender can take precisely what is owed and return the remainder within the hour.'],
      btcc:   [4, 'The same divisibility, exercised through the custodian’s ledger.']
    },
    title: {
      tsy:    [2, 'Tri-party systems track encumbrance well, inside a chain of intermediaries trusted end to end. Rehypothecation is routine, legal, and invisible to you.'],
      re:     [3, 'Lien registries are public and mature. Encumbrance is checkable at the courthouse, at closing speed.'],
      eq:     [1, 'Standard margin agreements grant the broker rehypothecation rights. In street name, "your" shares may already be working elsewhere.'],
      goldp:  [3, 'Possession, or allocated storage with serial numbers: pledged-twice risk is low if you truly hold it – which is the mode almost nobody uses at scale.'],
      goldpa: [0, 'Unallocated gold is the textbook rehypothecation instrument: one pile of metal, many claims. This is the failure the word was coined for.'],
      btcs:   [4, 'A UTXO cannot be spent twice, and a multisig pledge is visible on-chain. Uniquely on this board, non-rehypothecation is provable rather than promised.'],
      btcc:   [0, 'Celsius depositors granted rehypothecation in the terms of service and discovered it in bankruptcy court. Custody reintroduces the exact failure the asset was built to end.']
    },
    legal: {
      tsy:    [4, 'Centuries of settled law. Ownership and priority are unambiguous.'],
      re:     [3, 'Mature recording and foreclosure law: slow, but certain.'],
      eq:     [3, 'Settled custody law within well-understood limits and protections.'],
      goldp:  [3, 'Possession and documented allocated title stand up well; the law of pledged chattels is ancient.'],
      goldpa: [1, 'Unallocated holders are unsecured creditors of the issuer, a status many discover only at the moment it matters.'],
      btcs:   [2, 'Direct on-chain title is clean, but case law is young and commercial-code modernisation is incomplete across states. Improving; not settled.'],
      btcc:   [1, 'Celsius established that custodied coins can be estate property. "Your" bitcoin may be a claim in a queue.']
    },
    settle: {
      tsy:    [3, 'Next-day settlement through mature infrastructure.'],
      re:     [0, 'Foreclosure to completed sale: months to years, with a judge involved.'],
      eq:     [3, 'Next-day settlement.'],
      goldp:  [1, 'Physical delivery: days to weeks, plus transport, insurance and re-assay at the destination.'],
      goldpa: [3, 'Book transfer the same day – of the claim, not the metal.'],
      btcs:   [4, 'Final and irreversible within the hour. Any day, any hour, any jurisdiction.'],
      btcc:   [2, 'As fast as the custodian’s process allows – and the process is most doubtful in the states where seizure happens.']
    },
    cost: {
      tsy:    [4, 'Basis points, flat with size: custody priced like a utility.'],
      re:     [1, 'The collateral survives only if someone pays maintenance, insurance and taxes forever.'],
      eq:     [4, 'Fractions of a basis point in modern custody.'],
      goldp:  [0, 'Vaults, guards, insurance and audits: costs that scale with every additional ounce, forever.'],
      goldpa: [4, 'Nearly free, because what is stored is a promise, not a metal.'],
      btcs:   [4, 'Securing the first key costs the same as securing a billion dollars behind it. Marginal custody cost approaches zero; the real cost is competence, not scale.'],
      btcc:   [3, 'Fees are low. The reintroduced cost is trust, and it is not denominated in dollars.']
    },
    stress: {
      tsy:    [3, 'The crisis bid: in panics, money flees to Treasuries, so the collateral appreciates exactly when it is needed. The failure state is inflation: 2022 delivered the deepest modern bond drawdown precisely when protection was wanted.'],
      re:     [1, '2008 answered this one: housing collateral fell furthest exactly when it was being seized most.'],
      eq:     [1, 'Falls in the same risk-off states that trigger the margin calls. The collateral and the trigger are the same trade.'],
      goldp:  [3, 'A long crisis record and a real bid in monetary stress, alongside multi-decade drawdowns of its own.'],
      goldpa: [2, 'Tracks the metal, plus an issuer whose own solvency is most doubtful in the same states.'],
      btcs:   [1, 'March 2020: roughly −40% in two days, correlation to equities near +0.6. Weakness clustered in the exact state where collateral must hold. Recent stress episodes hint at changing behaviour; one cycle is a hint, not a forecast.'],
      btcc:   [1, 'Everything in the previous column, plus a custodian whose solvency is most doubtful in the same state of the world.']
    },
    income: {
      tsy:    [4, 'The coupon keeps arriving; the collateral part-services its own loan.'],
      re:     [3, 'Rent, if leased: income that requires tenants, management, and luck.'],
      eq:     [3, 'Dividends, at the board’s discretion.'],
      goldp:  [0, 'None – and four millennia of collateral service anyway. The market prices scarcity and liquidity, not yield. The objection answers itself.'],
      goldpa: [1, 'None, unless the metal is lent, which is the encumbrance problem wearing a yield costume.'],
      btcs:   [0, 'None by design. Yield offered on bitcoin is counterparty risk in costume, and every major offering ended the same way.'],
      btcc:   [0, 'Custodians generate yield by lending your collateral. That sentence is the history tab in miniature.']
    }
  };

  var tbl = document.getElementById('bacScoreTable');
  var lensNote = document.getElementById('bacLensNote');
  var whyBox = document.getElementById('bacWhy');
  if (!tbl) return;

  var WHY_DEFAULT = '<div class="bac-whyhead">The reasoning</div><p>Tap any cell above to see why it scores the way it does.</p>';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render(lensId) {
    var lens = LENS[lensId] || LENS.all;
    if (lensNote) lensNote.textContent = lens.note;

    var h = '<thead><tr><th scope="col" class="bac-rowhead">Property</th>';
    ASSETS.forEach(function (a) {
      h += '<th scope="col"' + (a.grp ? ' class="bac-grp"' : '') + '>' + esc(a.name) + '</th>';
    });
    h += '</tr></thead><tbody>';

    lens.order.forEach(function (rid) {
      var r = null;
      ROWS.forEach(function (x) { if (x.id === rid) r = x; });
      if (!r) return;
      h += '<tr><th scope="row" class="bac-rowname">' + esc(r.name) + '</th>';
      ASSETS.forEach(function (a) {
        var pair = S[rid][a.id];
        var score = pair[0];
        var mark = '';
        if ((MOVERS[rid] || []).indexOf(a.id) !== -1) {
          var copy = TRIP[rid] || '';
          mark = '<button type="button" class="bac-mover" aria-label="' + esc(copy) + '">▲'
               + '<span class="bac-mover-copy">' + esc(copy) + '</span></button>';
        }
        h += '<td data-r="' + rid + '" data-a="' + a.id + '"' + (a.grp ? ' class="bac-grp"' : '') + '>'
           + '<span class="bac-pip bac-s' + score + '">' + WORD[score] + '</span>' + mark + '</td>';
      });
      h += '</tr>';
    });

    /* Strips summary row — each column's ten ratings, brightest first.
       Always all ten, whatever the lens shows: it is a column summary,
       not a summary of the visible rows. */
    h += '<tr class="bac-sum"><th scope="row" class="bac-rowname">All ten, compressed</th>';
    ASSETS.forEach(function (a) {
      var vals = [];
      Object.keys(S).forEach(function (rid) { vals.push(S[rid][a.id][0]); });
      vals.sort(function (x, y) { return y - x; });
      var strip = vals.map(function (v) { return '<span class="bac-c' + v + '"></span>'; }).join('');
      h += '<td' + (a.grp ? ' class="bac-grp"' : '') + '><span class="bac-strip">' + strip + '</span></td>';
    });
    h += '</tr></tbody>';

    closeTip();
    tbl.innerHTML = h;
    if (whyBox) whyBox.innerHTML = WHY_DEFAULT;
  }

  render('all');

  /* Reasoning box — delegated, so it survives every re-render. */
  tbl.addEventListener('click', function (e) {
    var td = e.target.closest ? e.target.closest('td[data-r]') : null;
    if (!td || !whyBox) return;
    Array.prototype.forEach.call(tbl.querySelectorAll('td.is-selected'), function (x) {
      x.classList.remove('is-selected');
    });
    td.classList.add('is-selected');
    var rid = td.getAttribute('data-r'), aid = td.getAttribute('data-a');
    var r = null, a = null;
    ROWS.forEach(function (x) { if (x.id === rid) r = x; });
    ASSETS.forEach(function (x) { if (x.id === aid) a = x; });
    var pair = S[rid][aid];
    whyBox.innerHTML = '<div class="bac-whyhead">' + esc(a.name) + ' · ' + esc(r.name)
      + ' · <span class="bac-pip bac-s' + pair[0] + '">' + WORD[pair[0]] + '</span></div>'
      + '<p>' + esc(pair[1]) + '</p>';
  });

  Array.prototype.forEach.call(page.querySelectorAll('.bac-lensbtn'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(page.querySelectorAll('.bac-lensbtn'), function (x) {
        var on = x === b;
        x.classList.toggle('active', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render(b.getAttribute('data-lens'));
    });
  });

  /* ─── 4. TOOLTIPS ───
     One shared card appended to <body>, driving BOTH trigger types: the
     `?` help-tips beside defined terms and the ▲ movers in the scorecard.

     The §6.13 pattern normally puts the card in an absolutely-positioned
     sibling span. That cannot work here. Every ▲ sits inside
     .bac-scrollwrap and four of the `?` triggers sit inside
     .bac-tablewrap, both overflow-x:auto — and a box with overflow-x:auto
     and overflow-y:visible computes overflow-y to auto too, so the card
     is clipped on the vertical axis as well as the horizontal. A
     position:fixed card placed from the trigger's bounding rect escapes
     the clip entirely and stays correct while the wrap scrolls sideways.

     Using one mechanism for both trigger types is deliberate: the
     alternative leaves a trap where a term that later moves into a table
     silently loses its tooltip. */
  var floatTip = document.createElement('div');
  floatTip.className = 'bac-floattip';
  floatTip.setAttribute('role', 'tooltip');
  document.body.appendChild(floatTip);
  var tipOwner = null;

  /* Guarded: render() calls closeTip() during page init, which runs
     before floatTip is assigned further down this IIFE. */
  function closeTip() {
    if (!floatTip) return;
    floatTip.classList.remove('is-open');
    tipOwner = null;
  }

  var TIP_SEL = '.bac-mover, .help-tip';

  function openTip(trigger) {
    var copyEl = trigger.querySelector('.bac-mover-copy, .tip-content');
    if (!copyEl) return;
    floatTip.textContent = copyEl.textContent;
    floatTip.classList.add('is-open');
    tipOwner = trigger;

    var r = trigger.getBoundingClientRect();
    var tw = floatTip.offsetWidth, th = floatTip.offsetHeight;
    var margin = 16;

    var left = r.left + (r.width / 2) - (tw / 2);
    left = Math.max(margin, Math.min(left, window.innerWidth - tw - margin));

    /* Prefer above; flip below when the trigger sits near the top of the
       viewport (which it does whenever the sticky tab bar is in play). */
    var top = r.top - th - 8;
    if (top < margin) top = r.bottom + 8;

    floatTip.style.left = Math.round(left) + 'px';
    floatTip.style.top = Math.round(top) + 'px';
  }

  /* Delegated on the page root so it covers the JS-rendered scorecard
     markers and the static prose/table help-tips alike. */
  function triggerFrom(e) {
    return e.target && e.target.closest ? e.target.closest(TIP_SEL) : null;
  }
  page.addEventListener('mouseover', function (e) {
    var t = triggerFrom(e);
    if (t) openTip(t);
  });
  page.addEventListener('mouseout', function (e) {
    var t = triggerFrom(e);
    if (t && t === tipOwner) closeTip();
  });
  page.addEventListener('focusin', function (e) {
    var t = triggerFrom(e);
    if (t) openTip(t);
  });
  page.addEventListener('focusout', function (e) {
    var t = triggerFrom(e);
    if (t && t === tipOwner) closeTip();
  });
  /* Touch: a tap focuses the trigger, which opens the card; tapping the
     same trigger again closes it. */
  page.addEventListener('click', function (e) {
    var t = triggerFrom(e);
    if (!t) return;
    if (tipOwner === t) closeTip(); else openTip(t);
  });

  Array.prototype.forEach.call(page.querySelectorAll('.bac-scrollwrap, .bac-tablewrap'), function (w) {
    w.addEventListener('scroll', closeTip, { passive: true });
  });
  window.addEventListener('scroll', closeTip, { passive: true });
  window.addEventListener('resize', closeTip);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTip(); });
})();
