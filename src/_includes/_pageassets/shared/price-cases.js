/* =============================================================
   shared/price-cases.js — bitcoin's price on the forward calculators:
   the two scenarios (DEFAULTS_POLICY_2026-10-11, version B; JM 2026-10-11)

   Requires shared/power-law-data.js (PL_DATA, plPrice, PL_FLOOR, GENESIS_TS,
   TODAY_DAYS) and shared/reversion-durations.js (the record). Pure apart from
   render()/bind(), which fill and wire components/price-cases.njk.
   Exposes window.PriceCases.

   ── THE RULE ──
   R1  Two scenarios, both always on screen:
         stay   "If bitcoin stays 47% below trend": today's multiple of trend
                for the whole plan, so bitcoin grows at the trend's own rate.
         trend  "If bitcoin returns to trend over 3 years": the multiple moves
                in a straight line from today's to 1.0x over 36 months, then
                follows the trend. A plan shorter than 3 years ends part-way
                back. (M3 closed the gap by the horizon end; only the period
                changed, so a 10-year plan's end price is unchanged.)
       Stress tests, not scenarios (R6): floor and upper keep M3's shape, a
       straight line to 0.42x / 2.5x by the plan's end.
   R2  The default is the lower of the two: stay below trend, trend at or
       above it, decided from the price the page uses, until the reader picks.
   R3  Tags describe, never grade: Conservative · Historical pattern ·
       Never sustained (Optimistic for plans shorter than the longest stretch
       above trend on record, where "never sustained" would be false).
   R4  Every record figure comes from ReversionDurations (episode basis).
   R7  URL keys don't change; a link carries a pick, never a default.
   Consumers: the real-estate pages and The Income Question (PR A, the block),
   and the retirement family (PR B): the block on the flagship and Escape
   Velocity, the compact switch (renderSwitch) on Compare and the Stress Test.
   The retirement engine reads multipleAt and REVERT_YEARS for its paths.

   The internal names stay M3's (`stay`, `trend`, `floor`, `upper`) so every
   link and QA vector keeps its meaning; only the words and `trend`'s period
   changed.
   ============================================================= */
(function () {
  'use strict';
  if (typeof plPrice !== 'function' || !window.ReversionDurations) return;
  var RD = window.ReversionDurations;

  var REVERT_YEARS = 3;   // DEFAULTS_POLICY "Why 3 years"; revisit if a stretch below trend runs past ~30 months
  var UPPER = 2.5;        // M3's Upper target (a stress test)

  // ── The paths ──────────────────────────────────────────────────
  function target(scenario, m0) {
    if (scenario === 'stay') return m0;
    if (scenario === 'floor') return PL_FLOOR;
    if (scenario === 'upper') return UPPER;
    return 1.0;
  }
  // The multiple at a point in the plan. `progress` is the fraction of the
  // plan elapsed (the stress tests' clock, as M3 had it for every scenario);
  // `tYears` the years elapsed (the return's clock). Linear in the multiple.
  function multipleAt(scenario, m0, progress, tYears) {
    var p = scenario === 'trend' ? tYears / REVERT_YEARS : progress;
    p = Math.max(0, Math.min(1, p));
    return m0 + (target(scenario, m0) - m0) * p;
  }

  // ── Where bitcoin is, and the default ──────────────────────────
  function multipleOf(price, days) {
    var d = (days === undefined || days === null) ? (Date.now() / 1000 - GENESIS_TS) / 86400 : days;
    return price / plPrice(d);
  }
  function side(m) { return m < RD.NEAR_LO ? 'below' : m > RD.NEAR_HI ? 'above' : 'near'; }
  function defaultFor(m) { return m < 1 ? 'stay' : 'trend'; }

  // ── The words ──────────────────────────────────────────────────
  function gapPct(m) { return Math.round(Math.abs(1 - m) * 100); }
  function titleStay(m) {
    var g = gapPct(m);
    return g === 0 ? 'If bitcoin stays on trend' : 'If bitcoin stays ' + g + '% ' + (m < 1 ? 'below' : 'above') + ' trend';
  }
  var TITLE_TREND = 'If bitcoin returns to trend over ' + REVERT_YEARS + ' years';
  // Full titles for the block; short names for legends, rows and ledgers.
  function titles(m) {
    return { stay: titleStay(m), trend: TITLE_TREND, floor: 'Drifts to the floor (0.42×)', upper: 'Peaks at 2.5× trend' };
  }
  // The retirement family's floor stress test (PR B, 2026-10-11) is a
  // different shape from the real-estate pages' (a straight line to 0.42x by
  // the plan's end): it falls to the floor over the same 3 years the return
  // takes and stays there, because a retirement plan runs for decades and a
  // 50-year drift would barely differ from "stays". Its own words, so the two
  // shapes are never called by one name.
  var FLOOR_FALL = {
    chip: 'Falls to the floor (0.42×) and stays',
    title: 'If bitcoin falls to its floor (0.42×) over ' + REVERT_YEARS + ' years and stays there',
    name: 'Falls to the floor and stays'
  };
  function names(m) {
    var g = gapPct(m);
    return { stay: g === 0 ? 'Stays on trend' : 'Stays ' + g + '% ' + (m < 1 ? 'below' : 'above') + ' trend',
             trend: 'Returns to trend over ' + REVERT_YEARS + ' years', floor: 'Drifts to the floor', upper: 'Peaks at 2.5× trend' };
  }
  function tags(m, planMonths) {
    var stay;
    if (m < 1) stay = { cls: 'cons', text: 'Conservative' };
    else {
      var L = RD.longestStretch('above').longest;
      stay = (L && planMonths > L.months) ? { cls: 'never', text: 'Never sustained' } : { cls: 'never', text: 'Optimistic' };
    }
    return { stay: stay, trend: { cls: 'hist', text: 'Historical pattern' } };
  }
  function lead(m, drives) {
    var s = side(m), mx = m.toFixed(2) + '×';
    if (s === 'near') return 'Bitcoin is within 5% of its Power Law trend today (' + mx + '), so the two scenarios land close together. Neither is a forecast. Pick one to drive ' + drives + '.';
    return 'Bitcoin trades <strong>' + gapPct(m) + '% ' + s + '</strong> its Power Law trend today (' + mx + '), and your result depends on whether that ' +
      (s === 'below' ? 'gap closes' : 'premium lasts') + '. Neither scenario is a forecast. Pick one to drive ' + drives + '.';
  }
  // plan: { months, phrase ("all 10 years"), words ("10 years") }
  function notes(m, plan) {
    var s = side(m), mx = m.toFixed(2) + '×', dir = m < 1 ? 'below' : 'above';
    var stay = 'Assumes bitcoin stays at ' + mx + ' its trend for ' + plan.phrase + '.';
    if (s !== 'near') {
      var st = RD.longestStretch(dir), L = st.longest, C = st.current;
      if (C && (!L || C.months > L.months)) stay += ' The current stretch ' + dir + ' trend, ' + RD.fmtMonths(C.months) + ' so far, is the longest on record (since 2010).';
      else if (L) stay += ' The longest stretch ' + dir + ' trend on record (since 2010) is ' + RD.fmtMonths(L.months) + '.';
    }
    var trend = 'Assumes the ' + (m < 1 ? 'gap' : 'premium') + ' closes in a straight line over ' + REVERT_YEARS + ' years, then bitcoin follows its trend.';
    if (s !== 'near') {
      var rec = RD.scan(m), es = RD.episodeStats(rec);
      if (rec.state !== 'hidden' && es.n) {
        var from = (rec.widened ? rec.band : m).toFixed(2) + '× or ' + (m < 1 ? 'lower' : 'higher') +
                   (rec.widened ? ' (the nearest depth with enough history)' : '');
        trend += ' From ' + from + ', bitcoin got back to trend every earlier time' +
          (es.thin ? ': after ' + es.closed.map(RD.fmtMonths).join(' and ') + '.'
                   : ' (' + es.n + ' episodes): after ' + RD.fmtMonths(es.median) + ' at the median, ' + RD.fmtMonths(es.max) + ' at the longest.');
      }
    }
    if (plan.months < REVERT_YEARS * 12) {
      trend += ' By the end of your ' + plan.words + ' it is ' + Math.round(plan.months / (REVERT_YEARS * 12) * 100) + '% of the way back.';
    }
    return { stay: stay, trend: trend };
  }
  function foot(m, plan) {
    if (m >= 1) return 'Above trend I start you on the return to trend: it is the lower of the two, and every earlier stretch above trend has ended.';
    var L = RD.longestStretch('below').longest;
    return 'I start you on the conservative scenario so nothing here depends on a recovery' +
      (L && plan.months > L.months ? ', but over ' + plan.words + ' it asks for something bitcoin has never done.' : '.');
  }

  // ── The block (components/price-cases.njk) ─────────────────────
  // o: { mult, selected ('stay'|'trend'|'floor'|'upper'), plan, drives,
  //      values: { stay: { num, sub }, trend: { num, sub } }, showing (HTML),
  //      stressWord (optional; "stress test" by default) }
  function q(el, sel) { return el.querySelector(sel); }
  function render(el, o) {
    if (!el) return;
    var m = o.mult, T = titles(m), G = tags(m, o.plan.months), N = notes(m, o.plan);
    q(el, '[data-pc="lead"]').innerHTML = lead(m, o.drives);
    ['stay', 'trend'].forEach(function (k) {
      var h = q(el, '.pc-half[data-scenario="' + k + '"]'), on = o.selected === k, v = (o.values && o.values[k]) || {};
      h.classList.toggle('active', on);
      h.setAttribute('aria-pressed', on ? 'true' : 'false');
      h.classList.toggle('is-muted', k === 'stay' && m >= 1);
      var tag = q(h, '[data-pc="tag"]');
      tag.className = 'pc-tag pc-tag--' + G[k].cls; tag.textContent = G[k].text;
      q(h, '[data-pc="state"]').textContent = on ? '✓ Showing' : 'Show this scenario';
      q(h, '[data-pc="title"]').textContent = T[k];
      q(h, '[data-pc="num"]').innerHTML = v.num === undefined ? '&mdash;' : v.num;
      q(h, '[data-pc="sub"]').innerHTML = v.sub || '';
      q(h, '[data-pc="note"]').textContent = N[k];
    });
    el.querySelectorAll('.pc-chip').forEach(function (c) {
      var on = o.selected === c.getAttribute('data-scenario');
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    q(el, '[data-pc="foot"]').textContent = foot(m, o.plan);
    var stress = o.selected === 'floor' || o.selected === 'upper';
    q(el, '[data-pc="showingLbl"]').textContent = stress ? 'Showing a ' + (o.stressWord || 'stress test') : 'Showing';
    q(el, '[data-pc="showing"]').innerHTML = o.showing || '';
  }
  // ── The compact switch (components/price-cases-switch.njk; PR B) ──
  // For Compare and the Stress Test, where one figure per scenario would have
  // to speak for two plans or for a crash, so the halves carry no number.
  // o: { mult, selected, plan, other (HTML: the other scenario's answer, so
  //      both stay on screen), stressWord }
  function renderSwitch(el, o) {
    if (!el) return;
    var m = o.mult, T = titles(m), G = tags(m, o.plan.months), N = notes(m, o.plan), s = side(m);
    ['stay', 'trend'].forEach(function (k) {
      var b = q(el, '.pcs-opt[data-scenario="' + k + '"]'); if (!b) return;
      var on = o.selected === k;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('is-muted', k === 'stay' && m >= 1);
      var tag = q(b, '[data-pcs="tag"]');
      tag.className = 'pcs-tag pcs-tag--' + G[k].cls; tag.textContent = G[k].text;
      q(b, '[data-pcs="title"]').textContent = T[k];
      var nt = q(b, '[data-pcs="note"]'); if (nt) nt.textContent = N[k];
    });
    el.querySelectorAll('.pcs-chip').forEach(function (c) {
      var on = o.selected === c.getAttribute('data-scenario');
      c.classList.toggle('active', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var ld = q(el, '[data-pcs="lead"]');
    if (ld) ld.innerHTML = s === 'near'
      ? 'Bitcoin is within 5% of its Power Law trend today (' + m.toFixed(2) + '×), so the two scenarios land close together. Neither is a forecast.'
      : 'Bitcoin trades <strong>' + gapPct(m) + '% ' + s + '</strong> its Power Law trend today (' + m.toFixed(2) + '×). Neither scenario is a forecast.';
    var ot = q(el, '[data-pcs="other"]'); if (ot) { ot.innerHTML = o.other || ''; ot.hidden = !o.other; }
    var ft = q(el, '[data-pcs="foot"]'); if (ft) ft.textContent = foot(m, o.plan);
  }

  // Clicks on any option in the block (the two halves and the stress chips).
  // `onPick(scenario)` is the page's: it sets its state and re-renders.
  function bind(el, onPick) {
    if (!el || el._pcBound) return;
    el._pcBound = true;
    el.addEventListener('click', function (e) {
      if (e.target.closest('a, .help-tip')) return;
      var b = e.target.closest('.pc-opt');
      if (!b || !el.contains(b)) return;
      onPick(b.getAttribute('data-scenario'));
    });
  }

  window.PriceCases = {
    REVERT_YEARS: REVERT_YEARS, UPPER: UPPER, FLOOR_FALL: FLOOR_FALL,
    target: target, multipleAt: multipleAt,
    multipleOf: multipleOf, side: side, defaultFor: defaultFor,
    titles: titles, names: names, tags: tags, lead: lead, notes: notes, foot: foot,
    render: render, renderSwitch: renderSwitch, bind: bind
  };
})();
