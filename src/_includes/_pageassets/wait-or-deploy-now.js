/* =============================================================
   Wait, or Deploy Now? — page script (trilogy page 3)

   The trilogy's third page: it owns the WHETHER/WHEN question the
   other two deliberately don't. A continuous, today-anchored channel-
   position slider drives a "waiting-paid rate": from a given position,
   how often did waiting for a LOWER CHANNEL POSITION (not a fixed time)
   historically leave you with more Bitcoin? A "never arrived" counter-
   weight and a bonded dual-impact drawdown pair (likelihood + depth,
   depth annotated with its coins-equivalent) form the why.

   POSITION-AWARE: the page reads its relevance off today's LIVE position.
   Near the floor (as now) it is QUIET — "deploying decisively is the
   clear call". High in the channel it goes LIVE. This is the anti-timing
   stance at the page level: it declines to manufacture a waiting
   deliberation when there is nothing to deliberate. Everything is
   retrospective; the forward view lives on page 2's Projection.

   Reads PL_DATA + PL_* + GENESIS_TS + plPrice + positionLabel +
   TODAY_DAYS/TODAY_PRICE + fetchTodayPrice from shared/power-law-data.js.
   Everything is computed live; no live position/price is baked into copy.
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;
  if (!window.ChannelEntries) return;

  // ── Palette (shared trilogy conventions) ──
  var FLOOR_C = '#b04525', TREND_C = '#e09422', UPPER_C = '#e8c820';
  var HIST_C = 'rgba(232,224,210,0.55)', SEL_C = '#6db3d4';
  var MUTED = '#877e6f', DIM = '#9a9080', AMBER = '#e09422';

  // ── Channel-entry method (extracted 2026-07 to shared/channel-entries.js) ──
  // The position math, the sample prep, the eligible-entry set, entryMetrics and
  // bandMetrics all used to live here. How Much Cash is the mirror-twin page and
  // needs the SAME record read with the SAME neighborhood definition, so a second
  // copy was not an option — the two pages would eventually publish different
  // numbers for one position. Moved verbatim; aliased to locals so every call
  // site below is untouched and this page's figures cannot move.
  var CE = window.ChannelEntries;
  var SPAN = CE.SPAN, posOf = CE.posOf, ratioOf = CE.ratioOf;
  var N = CE.N, FIRST_D = CE.FIRST_D, LAST_D = CE.LAST_D, todayD = CE.todayD;
  var YEAR_D = CE.YEAR_D, MONTH_D = CE.MONTH_D;
  var TABLE_CUT = CE.TABLE_CUT, WAIT_CAP = CE.WAIT_CAP, DROP = CE.DROP, DD_THRESH = CE.DD_THRESH;
  var S = CE.S, elig = CE.elig;
  var realPriceAt = CE.realPriceAt, median = CE.median, monthYear = CE.monthYear;
  var entryMetrics = CE.entryMetrics, bandMetrics = CE.bandMetrics;

  // ── Vocabulary: ×-trend + shared word-label only; the 0–1 coordinate never shows ──
  function posLabel(pos) { return positionLabel(pos); }
  function posDisplay(pos) { return ratioOf(pos).toFixed(2) + '× trend · ' + posLabel(pos); }
  function livePos() { return (liveTodayPos != null) ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS); }
  var liveTodayPrice = null, liveTodayPos = null;

  // ── State (continuous position; default to today's live position) ──
  var state = { pos: 0.1 };
  // The slider spans slightly BELOW the floor (so today's sub-floor ~0.40× is reachable and the
  // "today" marker sits at the true position) up to the upper band. The reader-facing label
  // always shows the TRUE position; entry-matching clamps sub-floor to the floor INTERNALLY only
  // (stability), so the clamp never leaks into what the reader sees.
  var POS_MIN = -0.08, POS_MAX = 1.0, POS_RANGE = POS_MAX - POS_MIN;
  function clampPos(p) { return Math.max(POS_MIN, Math.min(POS_MAX, p)); }
  function sliderToPos(v) { return POS_MIN + (v / 1000) * POS_RANGE; }
  function posToSlider(p) { return Math.round((clampPos(p) - POS_MIN) / POS_RANGE * 1000); }
  function matchPos(p) { return Math.max(0, p); }   // internal entry-matching clamp (display untouched)

  // ── URL state (pos = channel position; receiver + write-back) ──
  // Suite vocabulary: `pos` is the shared normalized channel-position param (same name,
  // range and 3dp encoding How Much Cash uses — the twins share this engine). WODN adopts
  // `pos` only, not HMC's `rebuy` — it is a single-position tool with no rebuy leg.
  // Precedence is 2-tier by design: a valid ?pos= wins over today's live default on first
  // load; WODN keeps NO localStorage (its relevance is always "today", so a stored drag
  // would contradict the page). The URL is therefore the only persistence layer — write-back
  // on drag is what lets a reload restore the slider.
  function readUrlPos() {
    if (!window.URLSearchParams) return null;
    var v = parseFloat(new URLSearchParams(window.location.search).get('pos'));
    return (isFinite(v) && v >= POS_MIN - 0.001 && v <= POS_MAX + 0.001) ? clampPos(v) : null;
  }
  var _urlT = null;
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    if (_urlT) clearTimeout(_urlT);
    _urlT = setTimeout(function () {
      var p = new URLSearchParams(window.location.search);
      if (state.userMoved) p.set('pos', String(Math.round(clampPos(state.pos) * 1000) / 1000));
      else p.delete('pos');   // at "today" (reset / never moved) → clean URL, falls back to live default
      var qs = p.toString();
      try { window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash); } catch (e) {}
    }, 250);
  }

  // ── Format helpers ──
  function pct0(v) { return Math.round(v) + '%'; }
  function signPct0(v) { return (v > 0 ? '+' : '') + Math.round(v) + '%'; }
  function fmtRatio(r) { return (r >= 10 ? Math.round(r) : r.toFixed(2)) + '×'; }
  function fmtWait(days) {
    if (days == null) return '—';
    if (days < 1.5 * YEAR_D) return Math.max(1, Math.round(days / MONTH_D)) + ' months';
    return (days / YEAR_D).toFixed(1) + ' years';
  }
  function coinsMore(depthPct) { var D = Math.abs(depthPct); if (D < 1) return 0; return (1 / (1 - D / 100) - 1) * 100; }

  // ════════ COMPARATOR RENDER ════════
  function renderComparator() {
    var P = state.pos, m = bandMetrics(matchPos(P));
    var legsEl = document.getElementById('wdLegs');
    if (legsEl) { var legTxt = (m && CE.legSentence) ? CE.legSentence(m, 'waiting paid') : ''; legsEl.textContent = legTxt; legsEl.hidden = !legTxt; }
    var posReadout = document.getElementById('wdPosReadout');
    if (posReadout) posReadout.innerHTML = '<strong>' + ratioOf(P).toFixed(2) + '×</strong> trend · <em>' + posLabel(P) + '</em>';
    if (!m) return;

    // Hero — waiting-paid rate + position-graded verdict (reader concludes; no imperative beyond it)
    var heroNum = document.getElementById('wdHeroNum'), verdict = document.getElementById('wdVerdict');
    if (heroNum) heroNum.textContent = Math.round(m.paid) + '%';
    if (verdict) {
      var tone, line;
      if (m.paid < 25) { tone = 'danger'; line = 'Waiting was almost always the wrong call here — <strong>deploy decisively.</strong>'; }
      else if (m.paid < 60) { tone = 'neutral'; line = 'Roughly a coin-flip — no clear edge to waiting.'; }
      else { tone = 'success'; line = 'This is the regime where <strong>waiting earned its keep.</strong>'; }
      verdict.className = 'wd-verdict wd-verdict-' + tone;
      verdict.innerHTML = line;
    }

    // "Never arrived" counterweight — prominent when low (the dip usually never came)
    var counter = document.getElementById('wdCounter');
    if (counter) {
      var dip = (m.condRatio != null)
        ? 'when a lower entry did arrive, waiting bought about <strong>' + fmtRatio(m.condRatio) +
          '</strong> the coins (from ' + m.nArrived + ' historical dip' + (m.nArrived === 1 ? '' : 's') + ')'
        : 'no lower entry arrived here within two years at all';
      if (m.never >= 50) {
        counter.className = 'wd-counter wd-counter-strong';
        counter.innerHTML = '<span class="wd-counter-tag">The dip usually never came</span> <strong>' +
          pct0(m.never) + '</strong> of the time, no lower entry arrived within two years — you were already near the bottom. ' +
          (m.condRatio != null
            ? 'On the rare occasions one did, waiting bought about <strong>' + fmtRatio(m.condRatio) +
              '</strong> the coins (from ' + m.nArrived + ' historical dip' + (m.nArrived === 1 ? '' : 's') + ').'
            : 'A lower entry never arrived here within two years.');
      } else if (m.never >= 15) {
        counter.className = 'wd-counter';
        counter.innerHTML = 'A lower entry arrived most of the time, but <strong>' + pct0(m.never) +
          '</strong> of the time none came within two years — ' + dip + '.';
      } else {
        counter.className = 'wd-counter';
        counter.innerHTML = 'From here a lower entry <strong>almost always arrived</strong>' +
          (m.waitLen != null ? ', typically within about <strong>' + fmtWait(m.waitLen) + '</strong>' : '') +
          ', so waiting had room to work — ' + dip + '.';
      }
    }

    // Dual-impact pair (the why) — likelihood + depth. BOTH halves are measured against
    // THE ENTRY PRICE, not peak-to-trough; the copy says so in every line, because the
    // bare word "drawdown" collides with the site-wide peak-to-trough sense (Stress Test
    // canon) and that collision is what made the depth box unreadable.
    //
    // The depth half BRANCHES on the computed median, the way the verdict cards do:
    //   A. median materially below zero  → the numeric form (unchanged behaviour)
    //   B. median rounds to 0 AND most entries never fell → lead with the finding in words
    //   C. median rounds to 0 but the never-fell share is NOT a majority → neutral
    //      zero-state wording, so "Most never fell" can never render against a minority.
    // The B/C split is a guard, not decoration: state B asserts "most", so it must not
    // fire below a real majority.
    var NEVER_MAJORITY = 60;      // the "Most never fell" claim needs at least this share
    var ddProbEl = document.getElementById('wdDdProb'), ddDepthEl = document.getElementById('wdDdDepth'), ddSub = document.getElementById('wdDdSub');
    if (ddProbEl) ddProbEl.textContent = pct0(m.ddProb);
    var zeroish = m.ddDepth > -1;                 // same rounding threshold the old copy used
    var never = (m.neverFell != null) ? m.neverFell : 0;
    if (ddDepthEl) {
      ddDepthEl.textContent = (zeroish && never >= NEVER_MAJORITY) ? 'Most never fell'
                            : (zeroish ? '~0%' : signPct0(m.ddDepth));
      ddDepthEl.className = 'wd-dd-num wd-dd-num-red' + ((zeroish && never >= NEVER_MAJORITY) ? ' wd-dd-num-word' : '');
    }
    if (ddSub) {
      if (!zeroish) {
        var more = coinsMore(m.ddDepth);
        ddSub.innerHTML = 'median worst dip <strong>below the entry price</strong>' +
          (more >= 1 ? ' &mdash; the same dollars would buy about <strong>+' + Math.round(more) + '%</strong> more Bitcoin at that trough.' : '.');
      } else if (never >= NEVER_MAJORITY) {
        ddSub.innerHTML = '<strong>' + pct0(never) + '</strong> of entries here never fell below their entry price at all &mdash; the median worst dip below entry rounds to 0%.';
      } else {
        ddSub.innerHTML = 'the typical entry here barely dipped below its buy price &mdash; <strong>' + pct0(never) + '</strong> never fell below it at all.';
      }
    }
    var waitDetail = document.getElementById('wdWaitDetail');
    if (waitDetail) waitDetail.innerHTML = m.waitLen != null
      ? 'If a lower entry arrived, the typical wait was about <strong>' + fmtWait(m.waitLen) + '</strong>.'
      : 'Lower entries almost never arrived here within two years.';

    var sample = document.getElementById('wdSampleNote');
    // The band in the page's own terms (×-trend, never the 0–1 coordinate) and the halving cycles
    // behind it (2026-11-26, JM's ruling): entries weeks apart move together, so the cycles are
    // the fairer count of independent history. Was "within ±0.07 of this position", which also
    // rounded the 0.075 half-width down.
    if (sample) { var nc = CE.bandCycles(m), mp0 = matchPos(P);
      sample.innerHTML = 'Drawn from <strong>' + m.n + '</strong> historical entries between ' + ratioOf(mp0 - m.half).toFixed(2) + '× and ' + ratioOf(mp0 + m.half).toFixed(2) + '× trend, from <strong>' + CE.cycText(nc) + '</strong> (post-2014, each with a full two-year forward record). Entries weeks apart tend to move together, so the cycles are the fairer count of how much history this rests on.'; }

    renderLedger(m);
    updateChart();
  }

  // ════════ CHECK THE WORK (STYLE_GUIDE §6.49; shared/ledger.js) ════════
  // Added 2026-11-26. Every historical entry behind the result band (the
  // waiter's rule run on each), then the band's figures. Built from
  // ChannelEntries.bandMetrics at the slider's position, as renderComparator()
  // ran it; nothing here changes a figure.
  var ledgerEl = document.getElementById('wdLedger');
  function dayText(d) { return new Date(GENESIS_TS * 1000 + d * 86400 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  function ledgerSpec(m) {
    var dropPct = Math.round((1 - Math.exp(-DROP * SPAN)) * 100), P = state.pos, mp = matchPos(P), lo = ratioOf(mp - m.half), hi = ratioOf(mp + m.half), rows = m.metrics.slice();
    var nPaid = rows.filter(function (x) { return x.paid; }).length, nDD = rows.filter(function (x) { return x.hadDD; }).length;
    var below = P < 0 ? ' (entries are matched at the floor, ' + ratioOf(0).toFixed(2) + '\u00d7)' : '';
    var cols = [
      { label: 'Entry', unit: '', fmt: 'text', get: function (x) { return x.summary ? 'All ' + m.n + ' entries' : dayText(x.d0); },
        how: 'A date in the record from 2014 on, with two full years of record after it, when bitcoin was between ' + lo.toFixed(2) + '× and ' + hi.toFixed(2) + '× its trend: within ' + m.half.toFixed(3) + ' of the position on the channel scale (0 at the floor, 1 at the upper band; the band starts at 0.075 and widens by 0.03 until it holds 8 entries). The first row sums them up.' },
      { label: 'Against trend', unit: '×', fmt: 'mult', get: function (x) { return x.summary ? null : x.p0 / plPrice(x.d0); }, how: 'The entry’s price over the Power Law trend that day.' },
      { label: 'Price', unit: '$', fmt: 'price', get: function (x) { return x.summary ? null : x.p0; }, how: 'What deploying now paid.' },
      { label: 'A lower entry came', unit: '', fmt: 'text', get: function (x) { return x.summary ? m.nArrived + ' of ' + m.n : (x.arrived ? dayText(x.waitDay) : 'No'); },
        how: 'The waiter’s rule: wait for the first sample, within two years, at least ' + DROP + ' lower than the entry on the channel scale (0 at the floor, 1 at the upper band, evenly spaced in the logarithm of the multiple), which is a multiple of trend about ' + dropPct + '% lower than the entry’s.' },
      { label: 'Wait', unit: 'months', fmt: 'text', get: function (x) { return x.summary ? (m.waitLen != null ? 'median ' + (m.waitLen / MONTH_D).toFixed(1) : '') : (x.arrived ? (x.waitLen / MONTH_D).toFixed(1) : ''); }, how: 'From the entry to that lower entry. The first row is the median over the entries where one came (with an even count, the higher of the two middle values).' },
      { label: 'Price the waiter paid', unit: '$', fmt: 'price', get: function (x) { return x.summary ? null : x.waitPrice; }, how: 'The lower entry’s price; if none came, the price two years on (read between samples, in a straight line), when the waiter deploys anyway.' },
      { label: 'Coins, waiting ÷ now', unit: '×', fmt: 'mult', get: function (x) { return x.summary ? null : x.ratio; }, how: 'The entry’s price over the waiter’s: how many times the coins waiting bought, for the same dollars (the cash earns nothing while it waits).' },
      { label: 'Waiting paid', unit: '', fmt: 'text', get: function (x) { return x.summary ? nPaid + ' of ' + m.n : (x.paid ? 'Yes' : 'No'); }, how: 'Yes when waiting bought more coins (the ratio above 1), whether or not a lower entry came.' },
      { label: 'Worst dip below entry', unit: '%', fmt: 'pct', get: function (x) { return x.summary ? m.ddDepth / 100 : x.depth; }, how: 'The lowest sample price in the two years over the entry price, minus one; zero if it never went below. A dip that came back between two samples isn’t seen, so this can only understate it. The first row is the median (with an even count, the higher of the two middle values).' },
      { label: 'Fell 20% or more', unit: '', fmt: 'text', get: function (x) { return x.summary ? nDD + ' of ' + m.n : (x.hadDD ? 'Yes' : 'No'); }, how: 'Whether that dip reached ' + Math.round(DD_THRESH * 100) + '% below the entry price.' },
      { label: 'Leg', unit: '', fmt: 'text', get: function (x) { return x.summary ? '' : x.leg; }, how: 'Falling if the channel position was lower than ' + CE.LEG_W + ' days before; rising otherwise. The leg sentence under the result compares the two when they differ by more than 20 points with at least 10 entries each.' }];
    var L = m.legs;
    var fin = [
      { label: 'Entries', fmt: 'text', values: [String(m.n)], how: 'The Entries tab’s rows: the sample note’s count, from ' + CE.cycText(CE.bandCycles(m)) + '.' },
      { label: 'Waiting paid', fmt: 'pct', values: [m.paid / 100], card: 'The large percentage above, rounded to a whole percent there', how: nPaid + ' of ' + m.n + ' entries where waiting bought more coins.' },
      { label: 'When a lower entry came, median', fmt: 'mult', values: [m.condRatio], how: m.nArrived + ' entries had one; the median of their coins column (with an even count, the higher of the two middle values): the figure in the line under the result.' },
      { label: 'No lower entry within two years', fmt: 'pct', values: [m.never / 100], how: 'The share of entries where none came: the counterweight line’s percentage.' },
      { label: 'Typical wait when one came', fmt: 'text', values: [m.waitLen != null ? fmtWait(m.waitLen) : '—'], how: 'The median wait over those entries (with an even count, the higher of the two middle values), as the page writes it.' },
      { label: 'A dip of 20% or more', fmt: 'pct', values: [m.ddProb / 100], how: nDD + ' of ' + m.n + ': the likelihood box.' },
      { label: 'Median worst dip below entry', fmt: 'pct', values: [m.ddDepth / 100], how: 'The median of the dip column (with an even count, the higher of the two middle values): the depth box, which shows words when it rounds to zero.' },
      { label: 'Never fell below the entry', fmt: 'pct', values: [m.neverFell / 100], how: 'The share whose worst dip was zero.' },
      { label: 'Waiting paid, falling leg', fmt: 'pct', values: [L.falling.n ? L.falling.paid / 100 : null], how: L.falling.n + ' entries across ' + L.falling.cycles + ' halving cycles.' + (L.differs ? ' The legs differ, so the leg sentence shows.' : ' Within 20 points of the other leg (or too few), so the page shows no leg sentence.') },
      { label: 'Waiting paid, rising leg', fmt: 'pct', values: [L.rising.n ? L.rising.paid / 100 : null], how: L.rising.n + ' entries across ' + L.rising.cycles + ' halving cycles.' }];
    var tp = livePos(), gapDays = median(S.slice(1).map(function (s, k) { return s.d - S[k].d; }));
    var inputs = [
      ['Position you’re testing', ratioOf(P).toFixed(2) + '× trend · ' + posLabel(P) + below],
      ['Entries matched', m.n + ' between ' + lo.toFixed(2) + '× and ' + hi.toFixed(2) + '× trend, from ' + CE.cycText(CE.bandCycles(m)) + ', from 2014, each with two years of record after it'],
      ['The waiter’s rule', 'wait for a multiple of trend about ' + dropPct + '% below the entry’s, up to two years; if none comes, deploy at the two-year price'],
      ['What counts as a dip', Math.round(DD_THRESH * 100) + '% or more below the entry price within two years'],
      ['Price record', monthYear(S[0].d) + ' to ' + monthYear(S[N - 1].d) + ', ' + N + ' samples, about every ' + Math.round(gapDays) + ' days'],
      ['Today’s position', ratioOf(tp).toFixed(2) + '× trend · ' + posLabel(tp)],
      ['Today', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]];
    return {
      hint: 'every entry behind the result, and the waiter’s rule on each',
      inputs: inputs.map(function (x) { return { label: x[0], value: x[1] }; }),
      note: 'Each historical entry near this position, deployed now or held for a lower entry. Coins, not dollars: the sum doesn’t matter. The last table is the result band.',
      tabs: [{ id: 'entries', label: 'Entries here', columns: cols, rows: [{ summary: true }].concat(rows), strong: function (x) { return !!x.summary; } }],
      final: { title: 'At this position', csvTitle: 'At this position (the result band)', howTitle: 'How these figures are worked out', cols: ['At the slider'], rows: fin },
      csv: { filename: 'wait-or-deploy-now.csv', meta: [
        ['Last Coin Standing', 'Wait or Deploy Now?'],
        ['Amounts', 'coins as a ratio; prices in dollars of the day'],
        ['Page', function () { return window.location.origin + window.location.pathname + window.location.search; }]] }
    };
  }
  function renderLedger(m) {
    if (!ledgerEl || !window.Ledger || !m) return;
    window.Ledger.render(ledgerEl, ledgerSpec(m));
  }

  // ── QA (console: wdQA()) ──
  // Every entry re-run from the record with the waiter's rule written out
  // again here, the band's figures against them and the page's text, the
  // CSV's shape; then a sweep of positions, restoring the slider after.
  window.wdQA = function () {
    var near = function (x, y) { return typeof x === 'number' && typeof y === 'number' && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y)); };
    function holds() {
      var sp = ledgerEl && ledgerEl._ledgerSpec, why = [];
      if (!sp) return { ok: false, why: ['no ledger'] };
      if (!window.Ledger.check(ledgerEl, { side: false })) why.push('Ledger.check');
      var m = bandMetrics(matchPos(state.pos)), rows = sp.tabs[0].rows.slice(1), C = sp.tabs[0].columns, fin = sp.final.rows;
      var mp = matchPos(state.pos), within = function (h) { return elig.filter(function (i) { return Math.abs(S[i].pos - mp) <= h; }); };
      var mine = within(m.half), narrower = m.half > 0.075 + 1e-9 ? within(m.half - 0.03) : null;
      if (rows.length !== m.n || rows.length !== mine.length || rows.some(function (x, k) { return x.i !== mine[k]; }) || (mine.length < 8 && m.half < 0.27) || (narrower && narrower.length >= 8)) why.push('entry set');
      rows.forEach(function (x) {
        var i = x.i, d0 = S[i].d, p0 = S[i].p, thr = S[i].pos - DROP, end = d0 + WAIT_CAP, wp = null, wd = null, lowP = p0, j;
        if (Math.abs(S[i].pos - matchPos(state.pos)) > m.half + 1e-12 || d0 < TABLE_CUT || d0 > LAST_D - WAIT_CAP) why.push('membership ' + i);
        for (j = i + 1; j < N && S[j].d <= end; j++) { if (wp == null && S[j].pos <= thr) { wp = S[j].p; wd = S[j].d; } if (S[j].p < lowP) lowP = S[j].p; }
        var arrived = wp != null; if (!arrived) wp = realPriceAt(end);
        if (arrived !== x.arrived || !near(C[5].get(x), wp) || !near(C[6].get(x), p0 / wp) || (C[7].get(x) === 'Yes') !== (p0 / wp > 1) || !near(C[8].get(x), lowP / p0 - 1) || (C[9].get(x) === 'Yes') !== (lowP / p0 - 1 <= -DD_THRESH)) why.push('entry ' + i);
      });
      var paid = rows.filter(function (x) { return x.paid; }).length;
      if (!near(fin[1].values[0], paid / m.n) || !near(fin[3].values[0], rows.filter(function (x) { return !x.arrived; }).length / m.n)
        || !near(fin[5].values[0], rows.filter(function (x) { return x.hadDD; }).length / m.n) || !near(fin[6].values[0], median(rows.map(function (x) { return x.depth; })))) why.push('band figures');
      var came = rows.filter(function (x) { return x.arrived; }), upper = function (a) { a = a.slice().sort(function (p, q) { return p - q; }); return a.length ? a[Math.floor(a.length / 2)] : null; };
      var cr = upper(came.map(function (x) { return x.ratio; })), wl = upper(came.map(function (x) { return x.waitDay - x.d0; }));
      if (!(cr == null ? fin[2].values[0] == null : near(fin[2].values[0], cr)) || !(wl == null ? m.waitLen == null : near(m.waitLen, wl)) || !near(fin[7].values[0], rows.filter(function (x) { return x.depth >= 0; }).length / m.n)) why.push('conditional figures');
      ['falling', 'rising'].forEach(function (g, k) { var s = rows.filter(function (x) { return x.leg === g; }), v = fin[8 + k].values[0];
        if (s.length ? !near(v, s.filter(function (x) { return x.paid; }).length / s.length) : v != null) why.push('leg ' + g); });
      var t = function (id) { var e = document.getElementById(id); return e ? e.textContent : ''; };
      var cyc = {}; rows.forEach(function (x) { cyc[CE.epochOf(x.d0)] = 1; });
      var note = t('wdSampleNote'), want = [String(m.n), ratioOf(mp - m.half).toFixed(2) + '×', ratioOf(mp + m.half).toFixed(2) + '×', CE.cycText(Object.keys(cyc).length)];
      if (t('wdHeroNum') !== Math.round(m.paid) + '%' || t('wdDdProb') !== Math.round(m.ddProb) + '%' || want.some(function (w) { return note.indexOf(w) < 0; }) || note.indexOf('±') >= 0) why.push('page text');
      if (m.never >= 15 && t('wdCounter').indexOf(Math.round(m.never) + '%') < 0) why.push('counterweight');
      if (m.condRatio != null && t('wdCounter').indexOf(fmtRatio(m.condRatio)) < 0) why.push('dip ratio');
      var csv = window.Ledger.toCsv(sp);
      if (!(csv.indexOf('# Last Coin Standing,') === 0 && (csv.match(/^# Input: /gm) || []).length === sp.inputs.length
        && (csv.match(/^# How each column is worked out$/gm) || []).length === 1 && csv.indexOf('# At this position') > 0)) why.push('csv shape');
      return { ok: !why.length, why: why };
    }
    var out = [], live = holds();
    out.push(['live panel: every entry re-run, the band, the page text, CSV', live.ok, live.why.slice(0, 6).join('; ')]);
    var saved = { pos: state.pos, moved: state.userMoved };
    try {
      [-0.08, 0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1.0].forEach(function (p) { state.pos = p; state.userMoved = true; renderComparator(); var r = holds(); out.push(['sweep: position ' + p.toFixed(2) + ' (' + ratioOf(p).toFixed(2) + '× trend)', r.ok, r.why.slice(0, 6).join('; ')]); });
    } finally { state.pos = saved.pos; state.userMoved = saved.moved; syncSliderToState(); renderComparator(); }
    var ok = out.every(function (x) { return x[1]; });
    if (window.console) console.table(out.map(function (x) { return { check: x[0], pass: x[1], why: x[2] }; }));
    return { ok: ok, checks: out };
  };

  // ════════ CHANNEL CHART — bands + history + the selected position highlighted ════════
  var chart = null, selDots = [];
  function band(label, data, color, dash, w) { return { label: label, data: data, borderColor: color, backgroundColor: color, borderWidth: w, borderDash: dash || undefined, pointRadius: 0, tension: 0.2, fill: false, order: 4 }; }
  function bandLine(mult, baseDay, span) { var pts = [], step = Math.max(12, span / 120), d; for (d = 0; d <= span + 1e-6; d += step) pts.push({ x: baseDay + d, y: plPrice(baseDay + d) * mult }); pts.push({ x: baseDay + span, y: plPrice(baseDay + span) * mult }); return pts; }
  var selDotPlugin = {
    id: 'wdSelDots',
    afterDatasetsDraw: function (c) {
      if (!selDots.length) return;
      var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx, area = c.chartArea, i, x, y;
      ctx.save();
      for (i = 0; i < selDots.length; i++) {
        x = xS.getPixelForValue(selDots[i].x); y = yS.getPixelForValue(selDots[i].y);
        if (x < area.left - 2 || x > area.right + 2) continue;
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fillStyle = SEL_C; ctx.globalAlpha = 0.8; ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.1; ctx.stroke();
      }
      ctx.restore();
    }
  };
  function chartDatasets() {
    var startD = Math.max(FIRST_D, TABLE_CUT - YEAR_D), span = todayD - startD;
    var ds = [
      band('Floor (0.42× trend)', bandLine(PL_FLOOR, startD, span), FLOOR_C, [6, 3], 1.4),
      band('Trend', bandLine(1, startD, span), TREND_C, null, 2),
      band('Upper (3× trend)', bandLine(PL_CEIL, startD, span), UPPER_C, [1, 6], 1.1)
    ];
    var price = []; for (var i = 0; i < N; i++) if (S[i].d >= startD) price.push({ x: S[i].d, y: S[i].p });
    price.push({ x: todayD, y: exitPrice() });
    ds.push({ label: 'BTC price (history)', data: price, borderColor: HIST_C, borderWidth: 1.3, pointRadius: 0, tension: 0.15, order: 1 });
    // selected position — a line parallel to trend at the chosen ×-trend multiple
    ds.push(band('Selected position', bandLine(ratioOf(state.pos), startD, span), SEL_C, [4, 4], 2));
    // the historical entries the current band is built from (same internal match-clamp)
    var m = bandMetrics(matchPos(state.pos));
    selDots = (m && m.entries) ? m.entries.map(function (i) { return { x: S[i].d, y: S[i].p }; }) : [];
    return ds;
  }
  function yBounds(ds) {
    var lo = Infinity, hi = -Infinity, i, j, y;
    for (i = 0; i < ds.length; i++) for (j = 0; j < ds[i].data.length; j++) { y = ds[i].data[j].y; if (isFinite(y) && y > 0) { if (y < lo) lo = y; if (y > hi) hi = y; } }
    if (!isFinite(lo)) { lo = 1000; hi = 1e7; }
    return { min: lo * 0.55, max: hi * 1.9 };
  }
  function buildChart() {
    var el = document.getElementById('wdChart'); if (!el || typeof Chart === 'undefined') return;
    var ds = chartDatasets(), yb = yBounds(ds);
    chart = new Chart(el.getContext('2d'), {
      type: 'line', data: { datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' }, layout: { padding: { top: 18, right: 10 } },
        scales: {
          x: { type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, maxTicksLimit: 8, callback: function (v) { return new Date(GENESIS_TS * 1000 + v * 86400 * 1000).getUTCFullYear(); } } },
          y: { type: 'logarithmic', min: yb.min, max: yb.max, grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { if (v >= 1e9) return '$' + (v / 1e9).toFixed(0) + 'B'; if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'; return '$' + v.toFixed(0); } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: { backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10, filter: function (it) { var v = it.parsed && it.parsed.y; return v != null && isFinite(v) && v > 0; }, callbacks: { title: function (it) { return it.length ? new Date(GENESIS_TS * 1000 + it[0].parsed.x * 86400 * 1000).getUTCFullYear() : ''; }, label: function (it) { return it.dataset.label + ': $' + Math.round(it.parsed.y).toLocaleString(); } } }
        }
      },
      plugins: [selDotPlugin]
    });
  }
  function updateChart() {
    if (!chart) { buildChart(); return; }
    var ds = chartDatasets(), yb = yBounds(ds);
    chart.data.datasets = ds; chart.options.scales.y.min = yb.min; chart.options.scales.y.max = yb.max;
    chart.update('none');
  }
  function exitPrice() { return liveTodayPrice != null ? liveTodayPrice : TODAY_PRICE; }

  // ════════ POSITION-AWARE INTRO + LIVE READOUT (quiet when low, live when high) ════════
  function renderLive(price, source) {
    liveTodayPrice = price; liveTodayPos = posOf(price, TODAY_DAYS);
    var pos = liveTodayPos, ratio = price / plPrice(TODAY_DAYS);
    var metaEl = document.getElementById('wdLiveMeta'), introEl = document.getElementById('wdIntroState'), posEl = document.getElementById('wdLivePos');
    if (posEl) posEl.innerHTML = '<strong>' + ratio.toFixed(2) + '×</strong> trend · ' + posLabel(pos);
    if (metaEl) metaEl.textContent = (todayPriceIsLive(source) ? 'Live: ' : 'As of ' + lastSampleDateShort() + ': ') + '$' + Math.round(price).toLocaleString() + ' · ' + ratio.toFixed(2) + '× trend · recomputed every page load.';
    if (introEl) {
      if (pos < 0.53) {   // sub-floor / near floor / below trend / at trend → QUIET
        introEl.className = 'wd-intro-state wd-intro-quiet';
        introEl.innerHTML = '<span class="wd-intro-tag">This page is quiet right now</span> Bitcoin is <strong>' + posDisplay(pos) + '</strong> — low enough that there is essentially no advantage to waiting, based on historical data: <strong>deploying decisively is the clear call</strong>, and there is little to deliberate. This page is more applicable when price is higher in the channel, where <em>whether to deploy</em> becomes a real question.';
      } else {            // above trend / high / upper band → LIVE
        introEl.className = 'wd-intro-state wd-intro-live';
        introEl.innerHTML = '<span class="wd-intro-tag wd-intro-tag-live">This page is live right now</span> Price is <strong>' + posDisplay(pos) + '</strong> — high enough that <em>whether</em> to deploy, not just how, is a real question. Below is the historical cost of deploying at this position, and how often waiting for a lower entry paid off.';
      }
    }
    // default the explorer to today's TRUE live position the first time we learn it (no floor clamp)
    if (!state.userMoved) { state.pos = clampPos(pos); syncSliderToState(); }
    placeTodayTick();
    renderComparator();
  }

  // ════════ SLIDER + PERSISTENT "TODAY" TICK ════════
  function syncSliderToState() { var sl = document.getElementById('wdSlider'); if (sl) sl.value = posToSlider(state.pos); }
  function placeTodayTick() {
    var m = document.getElementById('wdTodayTick'); if (!m) return;
    m.style.left = ((clampPos(livePos()) - POS_MIN) / POS_RANGE * 100) + '%';
    m.classList.add('is-visible');
  }
  // Carry acknowledgement: shown only on a ?pos= arrival (init), hidden the moment the reader
  // takes over (drag or snap-to-today). Both snap links share resetToToday.
  function showCarryNote() { var cn = document.getElementById('wdCarryNote'); if (cn) cn.hidden = false; }
  function hideCarryNote() { var cn = document.getElementById('wdCarryNote'); if (cn) cn.hidden = true; }
  function resetToToday(e) { if (e) e.preventDefault(); state.userMoved = false; state.pos = clampPos(livePos()); syncSliderToState(); renderComparator(); syncUrl(); hideCarryNote(); }
  function wire() {
    var sl = document.getElementById('wdSlider');
    if (sl) sl.addEventListener('input', function () { state.userMoved = true; state.pos = sliderToPos(parseInt(this.value, 10)); renderComparator(); syncUrl(); hideCarryNote(); });
    var reset = document.getElementById('wdResetToday'); if (reset) reset.addEventListener('click', resetToToday);
    var carryReset = document.getElementById('wdCarryReset'); if (carryReset) carryReset.addEventListener('click', resetToToday);
  }

  // ════════ INIT ════════
  function init() {
    var urlPos = readUrlPos();
    // ?pos= wins over the live default (2-tier precedence). userMoved=true also suppresses the
    // async live-default in renderLive (L~231) — a URL arrival IS a reader-specified position.
    if (urlPos != null) { state.pos = urlPos; state.userMoved = true; showCarryNote(); }
    else { state.pos = clampPos(livePos()); }
    syncSliderToState();
    buildChart(); wire();
    renderLive(TODAY_PRICE, 'seed');
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price, source) { renderLive(price, source); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
