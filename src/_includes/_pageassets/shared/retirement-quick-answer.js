/* =============================================================
   shared/retirement-quick-answer.js — the quick answer at the top of
   The Bitcoin Retirement: how much bitcoin a retirement needs, by
   retirement year, on the two scenarios and the floor stress test.

   WHY IT EXISTS (JM, 2026-10-20; HANDOFF_2026-10-20 §7.1). Search Console
   shows the page for "how much bitcoin to retire in 2030" and its
   relatives at positions 40–55, and until now the page's answers existed
   only after the calculator ran in a browser. This puts the model's answer
   in the HTML: a table a search engine (or a reader without script) can
   read, labelled as the model's figures under its assumptions.

   ONE MODULE, TWO RUNS. src/_data/retirementQuickAnswer.js runs this file
   at build time, in a Node vm with the clock set to the latest PL_DATA
   sample's date and that sample's price, and the template prints its
   HTML. In the browser the same file re-renders the block once today's
   price resolves, and again when the inflation setting changes. Because
   both runs call the same compute() and parts(), the HTML a crawler reads
   and the HTML a reader sees can differ only in their inputs (the date
   and the price), never in their wording or arithmetic.

   THE FIGURES are Escape Velocity's solver, RetirementEngine.lineFor
   ('stack', …), the same call The Rundown's P1 makes: the smallest stack
   whose plan reaches escape velocity, held from today with no monthly
   buys, for a 30-year retirement, withdrawals in today's dollars rising
   with the sitewide inflation setting. Rows are the next five years that
   are multiples of five, so the table never offers a year already past.
   The model is proportional (double the withdrawal, double the stack), so
   one withdrawal level plus a scaling line answers every level.

   Depends on (loaded before this file): shared/power-law-data.js,
   shared/modeling-assumptions.js, shared/reversion-durations.js,
   shared/price-cases.js and shared/retirement-engine.js.
   Exposes window.RetirementQuickAnswer.
   ============================================================= */
(function () {
  'use strict';
  var RE = window.RetirementEngine, PC = window.PriceCases, MA = window.ModelingAssumptions;
  if (!RE || !PC || !MA) return;

  var WITHDRAWAL = 100000;       // today's dollars a year; the family's default plan
  var YEARS_IN_RETIREMENT = 30;  // the family's default horizon
  var ROWS = 5, STEP = 5;        // five retirement years, multiples of five
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
                     'August', 'September', 'October', 'November', 'December'];

  function commas(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function usd(n) { return '$' + commas(n); }
  function longDate(d) { return MONTHS_LONG[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear(); }

  // The retirement years the table offers, from this year's clock.
  function years(thisYear) {
    var out = [], first = (Math.floor(thisYear / STEP) + 1) * STEP;
    for (var i = 0; i < ROWS; i++) out.push(first + i * STEP);
    return out;
  }

  function plan(year) {
    return { btcStack: 1, targetIncomeUSD: WITHDRAWAL, retirementYear: year,
             yearsInRetirement: YEARS_IN_RETIREMENT, incomeBasis: 'today', monthlyDcaUSD: 0 };
  }

  // Everything the block prints, computed at the current clock and price.
  function compute() {
    var now = new Date(), m = RE.currentRatio();
    var rows = years(now.getFullYear()).map(function (y) {
      var p = plan(y);
      return { year: y,
               stay: RE.lineFor('stack', p, 'stay'),
               trend: RE.lineFor('stack', p, 'trend'),
               floor: RE.lineFor('stack', p, 'floor') };
    });
    return { now: now, m: m, price: TODAY_PRICE, infl: MA.get('inflation').value,
             lead: PC.defaultFor(m), rows: rows };
  }

  // A solver result as the table states it. lineFor's range is
  // 0.01–100 BTC; a plan outside it says so rather than printing an edge.
  function cell(r) {
    if (!r || r.value === null || r.value === undefined) return 'more than 100 BTC';
    if (r.bound === 'below') return '0.01 BTC or less';
    return r.value.toFixed(2) + ' BTC';
  }
  function about(r) {
    if (!r || r.value === null || r.value === undefined) return 'more than 100 BTC';
    if (r.bound === 'below') return 'at most 0.01 BTC';
    return 'about <strong>' + r.value.toFixed(2) + ' BTC</strong>';
  }

  // The block's HTML, in pieces the template and render() both place.
  // opts.priceNote: '' (the price is the clock date's, or live) or a
  // parenthesised provenance note such as " (as of Sep 30)".
  function parts(d, opts) {
    opts = opts || {};
    var m = d.m, T = PC.titles(m), N = PC.names(m), F = PC.FLOOR_FALL;
    var G = PC.tags(m, ((d.rows[0].year - d.now.getFullYear()) + YEARS_IN_RETIREMENT) * 12);
    var lead = d.lead, other = lead === 'stay' ? 'trend' : 'stay';
    function cond(k, short) {
      var t = T[k].charAt(0).toLowerCase() + T[k].slice(1);
      return short ? t.replace(/^if bitcoin /, 'if it ') : t;
    }
    var first = d.rows[0];
    // Position-dependent copy is enumerated (STYLE_GUIDE §12): close to
    // trend the two scenarios can give the same stack, and one figure is
    // then stated once rather than as "X, or X".
    var same = cell(first[lead]) === cell(first[other]);
    var leadHtml = 'Retiring in ' + first.year + ' on ' + usd(WITHDRAWAL) + ' a year needs ' +
      (same
        ? about(first[lead]) + ' whether bitcoin stays where it is against its trend or returns to it over ' + PC.REVERT_YEARS + ' years'
        : about(first[lead]) + ' ' + cond(lead) + ', or ' + about(first[other]) + ' ' + cond(other, true)) +
      '. That is the model&rsquo;s arithmetic, not a forecast.';

    // The floor stress test is a fall only from above the floor. At or below
    // it (within 1%, the site's "at the floor" band), the same path is flat
    // or a rise, so the column is left out and a note says why.
    var floorTests = m > PL_FLOOR * 1.01 + 1e-9;
    var cols = [
      { k: lead, name: N[lead], tag: G[lead].text, cls: G[lead].cls },
      { k: other, name: N[other], tag: G[other].text, cls: G[other].cls }
    ];
    if (floorTests) cols.push({ k: 'floor', name: F.chip, tag: 'Stress test', cls: 'stress' });
    var head = '<tr><th scope="col">Retire in</th>' + cols.map(function (c) {
      return '<th scope="col"><span class="rqa-col">' + c.name + '</span>' +
             '<span class="rqa-tag rqa-tag--' + c.cls + '">' + c.tag + '</span></th>';
    }).join('') + '</tr>';
    var rows = d.rows.map(function (r) {
      return '<tr><th scope="row">' + r.year + '</th>' + cols.map(function (c) {
        return '<td>' + cell(r[c.k]) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    var half = WITHDRAWAL / 2, more = WITHDRAWAL * 1.5;
    var notes =
      '<li><strong>What &ldquo;needs&rdquo; means.</strong> The smallest stack, held today with nothing added or sold before you retire, ' +
        'whose growth covers every year&rsquo;s withdrawal through ' + YEARS_IN_RETIREMENT + ' years of retirement, so its value after inflation never falls. ' +
        'That is <a href="/bitcoin-escape-velocity">escape velocity</a>. A smaller stack can still last ' + YEARS_IN_RETIREMENT +
        ' years while it shrinks; the calculator below shows how long.</li>' +
      '<li><strong>Scale it to your withdrawal.</strong> The figures are proportional to it: on ' + usd(half) +
        ' a year, halve them; on ' + usd(more) + ', multiply them by 1.5.</li>' +
      '<li><strong>Assumptions.</strong> Withdrawals are in today&rsquo;s dollars and rise with inflation at ' + d.infl +
        '% a year. No crash in the early years of retirement; the <a href="/the-bitcoin-retirement-stress-test">Retirement Stress Test</a> adds one.</li>' +
      (floorTests ? '' :
        '<li><strong>No floor stress test.</strong> Bitcoin is at or below its floor (' + PL_FLOOR.toFixed(2) +
          '&times; its trend), so a move to the floor would not be a fall; the table leaves it out.</li>');

    var asof = 'Figures as of ' + longDate(d.now) + ', with bitcoin at ' + usd(d.price) + (opts.priceNote || '') +
      ', ' + m.toFixed(2) + '&times; its <a href="/the-power-law">Power Law</a> trend.';

    return { lead: leadHtml, caption: 'Bitcoin needed to retire on ' + usd(WITHDRAWAL) + ' a year',
             head: head, rows: rows, notes: notes, asof: asof };
  }

  // Fill the block in place (browser only).
  function render(root, opts) {
    if (!root) return null;
    var d = compute(), p = parts(d, opts);
    ['lead', 'caption', 'head', 'rows', 'notes', 'asof'].forEach(function (k) {
      var el = root.querySelector('[data-rqa="' + k + '"]');
      if (el) el.innerHTML = p[k];
    });
    return d;
  }

  // Console check: every printed cell equals the solver at the same inputs.
  function qa() {
    var root = document.getElementById('quick-answer');
    if (!root) return { ok: false, why: 'no block' };
    var d = compute(), p = parts(d, {}), probe = document.createElement('tbody');
    probe.innerHTML = p.rows;
    var shown = root.querySelector('[data-rqa="rows"]').textContent, want = probe.textContent;
    var proportional = d.rows.every(function (r) {
      var half = RE.lineFor('stack', RE.cloneWith({ targetIncomeUSD: WITHDRAWAL / 2 }, plan(r.year)), 'stay');
      return r.stay.value === null || Math.abs(half.value * 2 - r.stay.value) <= 0.03;
    });
    return { ok: shown === want && proportional, cellsMatch: shown === want, proportional: proportional, rows: d.rows, m: d.m };
  }

  window.RetirementQuickAnswer = {
    WITHDRAWAL: WITHDRAWAL, YEARS_IN_RETIREMENT: YEARS_IN_RETIREMENT,
    years: years, compute: compute, parts: parts, render: render, qa: qa
  };

  // Browser wiring: re-render at today's price once it resolves, and when
  // the sitewide inflation setting changes. The fetch shares the page's
  // one request (fetchTodayPrice dedupes in-flight callers).
  if (typeof document !== 'undefined' && document.getElementById) {
    var root = document.getElementById('quick-answer');
    if (root) {
      var note = '';
      var go = root.querySelector('[data-rqa-go]');
      if (go) go.addEventListener('click', function (e) {
        var btn = document.querySelector('.tab-btn[data-tab="calculator"]');
        var pane = document.getElementById('tab-calculator');
        if (!btn || !pane) return;
        e.preventDefault();
        btn.click();
        pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      if (typeof fetchTodayPrice === 'function') {
        fetchTodayPrice(function (price, source) {
          note = (typeof todayPriceNote === 'function') ? todayPriceNote(source) : '';
          if (source === 'live') note = ' (live)';
          render(root, { priceNote: note });
        });
      }
      if (MA.subscribe) MA.subscribe(function () { render(root, { priceNote: note }); });
      window.rqaQA = qa;
    }
  }
})();
