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

   THE STATES (STYLE_GUIDE §12), each worded on its own: below or above
   trend; within 5% of trend (the two scenarios land close together, and
   at a 0% gap there is one scenario column); at or below the floor (no
   floor column: a fall to the floor would test little or nothing); and a
   row no stack can escape (at high inflation the trend's yearly growth
   falls below inflation before the plan ends, so even a very large stack
   loses value at the end; the cell says "None" and a note gives the year).

   ON A NON-LIVE PRICE the browser keeps the build's dated snapshot rather
   than read the old price against today's trend, unless the reader's
   inflation setting differs from the snapshot's (then it re-renders,
   labelled with the price's date).

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

  // lineFor returns { value: null, bound: 'above' } whenever 100 BTC fails,
  // which includes plans no stack of any size can escape: at a high enough
  // inflation the trend's yearly growth falls below it before the plan ends,
  // and a stack's value after inflation then falls at the end whatever its
  // size. Probe a very large stack to tell the two apart.
  var HUGE = 1e9;
  function solve(p, basis, infl) {
    var r = RE.lineFor('stack', p, basis), out = { value: r.value, bound: r.bound, none: false };
    if (r.value === null && r.bound === 'above') {
      var big = RE.cloneWith({ btcStack: HUGE }, p);
      out.none = RE.computeVerdict(RE.projectForBasis(big, basis, true), big, infl).state !== 'escape';
    }
    return out;
  }
  // The first year in which the trend's growth over the year before falls
  // below inflation (the engine's yearly steps), or null within 2300.
  function crossYear(fromYear, infl) {
    for (var y = fromYear + 1; y <= 2300; y++) {
      var g = RE.plPriceAtDate(RE.dateForYear(y)) / RE.plPriceAtDate(RE.dateForYear(y - 1));
      if (g < 1 + infl / 100) return y;
    }
    return null;
  }

  // Everything the block prints, computed at the current clock and price.
  function compute() {
    var now = new Date(), m = RE.currentRatio(), infl = MA.get('inflation').value;
    var rows = years(now.getFullYear()).map(function (y) {
      var p = plan(y);
      return { year: y, stay: solve(p, 'stay', infl), trend: solve(p, 'trend', infl), floor: solve(p, 'floor', infl) };
    });
    var anyNone = rows.some(function (r) { return r.stay.none || r.trend.none || r.floor.none; });
    return { now: now, m: m, price: TODAY_PRICE, infl: infl, lead: PC.defaultFor(m), rows: rows,
             cross: anyNone ? crossYear(now.getFullYear(), infl) : null };
  }

  // A solver result as the table states it. lineFor's range is
  // 0.01–100 BTC; a plan outside it says so rather than printing an edge,
  // and a plan no stack can escape says "None" (a note explains).
  function cell(r) {
    if (r.none) return 'None';
    if (r.value === null || r.value === undefined) return 'more than 100 BTC';
    if (r.bound === 'below') return '0.01 BTC or less';
    return r.value.toFixed(2) + ' BTC';
  }
  function about(r) {
    if (r.value === null || r.value === undefined) return 'more than 100 BTC';
    if (r.bound === 'below') return 'at most 0.01 BTC';
    return 'about <strong>' + r.value.toFixed(2) + ' BTC</strong>';
  }
  function pct(x) { return String(Math.round(x * 10) / 10) + '%'; }

  // The block's HTML, in pieces the template and render() both place.
  // opts.priceNote: '' (the price is the clock date's), ' (live)', or a
  // parenthesised provenance note such as " (as of Sep 30)".
  function parts(d, opts) {
    opts = opts || {};
    var m = d.m, T = PC.titles(m), N = PC.names(m), F = PC.FLOOR_FALL;
    var G = PC.tags(m, ((d.rows[0].year - d.now.getFullYear()) + YEARS_IN_RETIREMENT) * 12);
    var lead = d.lead, other = lead === 'stay' ? 'trend' : 'stay';
    var near = PC.side(m) === 'near', gap0 = Math.round(Math.abs(1 - m) * 100) === 0;
    var floorTests = m > PL_FLOOR * 1.01 + 1e-9;   // the site's "at the floor" band is within 1%
    function cond(k, short) {
      var t = T[k].charAt(0).toLowerCase() + T[k].slice(1);
      return short ? t.replace(/^if bitcoin /, 'if it ') : t;
    }

    // ── The lead, enumerated (STYLE_GUIDE §12) ──
    var first = d.rows[0], plan1 = 'retiring in ' + first.year + ' on ' + usd(WITHDRAWAL) + ' a year in today&rsquo;s dollars';
    var Plan1 = plan1.charAt(0).toUpperCase() + plan1.slice(1);
    var same = gap0 || cell(first[lead]) === cell(first[other]);
    var leadHtml;
    if (first[lead].none) {
      leadHtml = 'At ' + pct(d.infl) + ' inflation, no stack size reaches escape velocity for a retirement in ' + first.year +
        ' on ' + usd(WITHDRAWAL) + ' a year in today&rsquo;s dollars' +
        ': before the plan ends, the trend&rsquo;s yearly growth falls below inflation. A large enough stack can still last the ' +
        YEARS_IN_RETIREMENT + ' years.';
    } else if (same) {
      leadHtml = (near ? 'With bitcoin within 5% of its Power Law trend, both scenarios give about the same answer: ' + plan1
                       : Plan1) + ' needs ' + about(first[lead]) + '.';
    } else {
      leadHtml = (near ? 'With bitcoin within 5% of its Power Law trend, the two scenarios land close together: ' + plan1
                       : Plan1) + ' needs ' + about(first[lead]) + ' ' + cond(lead) + ', or ' + about(first[other]) + ' ' + cond(other, true) + '.';
    }
    leadHtml += ' Neither scenario is a forecast.';

    // ── The table: the lower scenario first, then the other (one column at a
    //    0% gap, where the two are the same path), then the floor stress test
    //    while bitcoin is above its floor. Short names (STYLE_GUIDE §10.14). ──
    var cols = [{ k: lead, name: N[lead], tag: G[lead].text, cls: G[lead].cls }];
    if (!gap0) cols.push({ k: other, name: N[other], tag: G[other].text, cls: G[other].cls });
    if (floorTests) cols.push({ k: 'floor', name: F.name, tag: 'Stress test', cls: 'stress' });
    // The spaces between the spans keep the words apart in plain-text
    // extraction (a crawler, a reader mode); the layout ignores them.
    var head = '<tr><th scope="col">Retire in</th>' + cols.map(function (c) {
      return '<th scope="col"><span class="rqa-col">' + c.name + '</span> ' +
             '<span class="rqa-tag rqa-tag--' + c.cls + '">' + c.tag + '</span></th>';
    }).join('') + '</tr>';
    var rows = d.rows.map(function (r) {
      return '<tr><th scope="row">' + r.year + '</th>' + cols.map(function (c) {
        return '<td>' + cell(r[c.k]) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var anyNone = d.rows.some(function (r) {
      return cols.some(function (c) { return r[c.k].none; });
    });

    // ── The notes ──
    var half = WITHDRAWAL / 2, more = WITHDRAWAL * 1.5;
    var infl = d.infl > 0 ? 'rise with inflation at ' + pct(d.infl) + ' a year'
             : d.infl < 0 ? 'fall with prices, at ' + pct(-d.infl) + ' a year of deflation'
             : 'stay level, with inflation at 0%';
    var notes =
      '<li><strong>What &ldquo;needs&rdquo; means.</strong> The smallest stack, held from the date below with nothing added or sold before you retire, ' +
        'whose growth overtakes the withdrawals and stays ahead of them to the end of a ' + YEARS_IN_RETIREMENT +
        '-year retirement, so that its value after inflation is rising at the end. That is <a href="/bitcoin-escape-velocity">escape velocity</a>. ' +
        'A smaller stack may last the ' + YEARS_IN_RETIREMENT + ' years while shrinking, or run out sooner; the calculator below shows which.</li>' +
      '<li><strong>Scale it to your withdrawal.</strong> The figures are proportional to it: on ' + usd(half) +
        ' a year, halve them; on ' + usd(more) + ', multiply them by 1.5.</li>' +
      '<li><strong>Assumptions.</strong> Withdrawals are in today&rsquo;s dollars and ' + infl + '. ' +
        'Prices follow each column&rsquo;s path with no crash' +
        (floorTests ? '; in the floor column bitcoin falls to ' + PL_FLOOR.toFixed(2) + '&times; its trend over ' + PC.REVERT_YEARS + ' years and stays there' : '') +
        '. For a timed crash, see the <a href="/the-bitcoin-retirement-stress-test">Retirement Stress Test</a>.</li>' +
      (anyNone ?
        '<li><strong>&ldquo;None&rdquo;.</strong> At ' + pct(d.infl) + ' inflation the trend&rsquo;s yearly growth falls below inflation' +
          (d.cross ? ' in ' + d.cross : '') + ', before these plans end, so no stack size reaches escape velocity. ' +
          'A large enough stack can still last the ' + YEARS_IN_RETIREMENT + ' years.</li>' : '') +
      (floorTests ? '' :
        '<li><strong>No floor stress test.</strong> Bitcoin is at or below its floor (' + PL_FLOOR.toFixed(2) +
          '&times; its trend, within 1%), so a fall to the floor would test little or nothing, and the column is left out.</li>');

    var asof = 'Figures as of ' + longDate(d.now) + ', with bitcoin at ' + usd(d.price) + (opts.priceNote || '') +
      ', ' + m.toFixed(2) + '&times; its <a href="/the-power-law">Power Law</a> trend.';

    return { lead: leadHtml, caption: 'Bitcoin needed to retire on ' + usd(WITHDRAWAL) + ' a year in today&rsquo;s dollars',
             head: head, rows: rows, notes: notes, asof: asof };
  }

  // Fill the block in place (browser only).
  var rendered = false;
  function render(root, opts) {
    if (!root) return null;
    var d = compute(), p = parts(d, opts);
    ['lead', 'caption', 'head', 'rows', 'notes', 'asof'].forEach(function (k) {
      var el = root.querySelector('[data-rqa="' + k + '"]');
      if (el) el.innerHTML = p[k];
    });
    rendered = true;
    return d;
  }

  // Console check: every printed cell equals the solver at the same inputs
  // (once the block has been rendered here; the build's snapshot is dated
  // to the sample and cannot be recomputed in a browser), and every column
  // scales with the withdrawal.
  function qa() {
    var root = document.getElementById('quick-answer');
    if (!root) return { ok: false, why: 'no block' };
    var d = compute(), p = parts(d, {}), probe = document.createElement('tbody');
    probe.innerHTML = p.rows;
    var cellsMatch = rendered ? root.querySelector('[data-rqa="rows"]').textContent === probe.textContent : null;
    var proportional = d.rows.every(function (r) {
      return ['stay', 'trend', 'floor'].every(function (b) {
        var full = r[b];
        if (full.value === null || full.bound) return true;
        var half = RE.lineFor('stack', RE.cloneWith({ targetIncomeUSD: WITHDRAWAL / 2 }, plan(r.year)), b);
        return half.value !== null && Math.abs(half.value * 2 - full.value) <= 0.03;
      });
    });
    return { ok: cellsMatch !== false && proportional, snapshot: !rendered, cellsMatch: cellsMatch,
             proportional: proportional, rows: d.rows, m: d.m };
  }

  window.RetirementQuickAnswer = {
    WITHDRAWAL: WITHDRAWAL, YEARS_IN_RETIREMENT: YEARS_IN_RETIREMENT,
    years: years, compute: compute, parts: parts, render: render, qa: qa
  };

  // Browser wiring. The fetch shares the page's one request (fetchTodayPrice
  // dedupes in-flight callers).
  //   live price      → re-render at today's price, "(live)".
  //   no live price   → keep the build's snapshot (dated to the sample, the
  //                     same price) unless the reader's inflation setting
  //                     differs from the snapshot's; then re-render, with
  //                     the price labelled by its date.
  //   inflation change → re-render, labelled the same way.
  if (typeof document !== 'undefined' && document.getElementById) {
    var root = document.getElementById('quick-answer');
    if (root) {
      var note = (typeof todayPriceNote === 'function') ? todayPriceNote('fallback') : '';
      var snapInfl = parseFloat(root.getAttribute('data-rqa-infl'));
      var go = root.querySelector('[data-rqa-go]');
      if (go) go.addEventListener('click', function (e) {
        var btn = document.querySelector('.tab-btn[data-tab="calculator"]');
        var nav = document.querySelector('.tab-nav') || document.getElementById('tab-calculator');
        if (!btn || !nav) return;
        e.preventDefault();
        btn.click();
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        nav.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        try { btn.focus({ preventScroll: true }); } catch (err) { btn.focus(); }
      });
      if (typeof fetchTodayPrice === 'function') {
        fetchTodayPrice(function (price, source) {
          if (source === 'live') { note = ' (live)'; render(root, { priceNote: note }); return; }
          note = (typeof todayPriceNote === 'function') ? todayPriceNote(source) : '';
          if (!(MA.get('inflation').value === snapInfl)) render(root, { priceNote: note });
        });
      }
      if (MA.subscribe) MA.subscribe(function () { render(root, { priceNote: note }); });
      window.rqaQA = qa;
    }
  }
})();
