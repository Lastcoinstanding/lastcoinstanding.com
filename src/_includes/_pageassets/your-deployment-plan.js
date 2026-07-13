/* =============================================================
   Your Bitcoin Deployment Plan — page script (Stage 3A redesign)

   The personal model that companions /lump-sum-or-ladder-in. TODAY-ANCHORED
   only: the reader has capital to deploy now, the channel is where it is now,
   and the only live decision is HOW — lump / ladder / hybrid. Entry is not a
   variable (today IS the entry); entry-position/"when" exploration lives on the
   future timing page (page 3), reached via the position-aware cross-link.

   Reads PL_DATA + PL_* + GENESIS_TS + plPrice + positionLabel + TODAY_DAYS/
   TODAY_PRICE + fetchTodayPrice from shared/power-law-data.js, and the forward
   path model from shared/deployment-projection.js (DeploymentProjection).
   Everything is computed live; no live position/price is baked into static copy.

   Stage 3A changes: removed the "A point in time" anchor toggle + hold-horizon
   slider + the dense prose verdict. Retrospective output is now a 3×4 median
   table (Lump/Ladder/Hybrid × 2/4/6/8yr) under the "held N years" convention so
   the columns CLIMB (time does the heavy lifting). Projection is a parallel 3×4
   range table. The today-anchored commitment-backstop table is unchanged and
   states its own ("held to today") convention so the two don't read as a bug.
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  // ── Palette ──
  var FLOOR_C = '#b04525', TREND_C = '#e09422', UPPER_C = '#e8c820';
  var REVERT_C = '#ece4d6', TRAJ_C = '#5e7a92', HIST_C = 'rgba(232,224,210,0.55)';
  var MUTED = '#7a7367', DIM = '#9a9080', AMBER = '#e09422';

  // ── Channel-position math (log-space) ──
  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function posOf(price, days) { return (Math.log(price / plPrice(days)) - LF) / SPAN; }
  function ratioOf(pos) { return Math.exp(pos * SPAN + LF); }
  var TREND_POS = (DeploymentProjection && DeploymentProjection.TREND_POS != null)
    ? DeploymentProjection.TREND_POS : (0 - LF) / SPAN;

  var N = PL_DATA.length;
  var FIRST_D = PL_DATA[0][0], LAST_D = PL_DATA[N - 1][0];
  var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400;
  var YEAR_D = 365.25, MONTH_D = 30.44;
  var MATCH_BAND = 0.07;        // ±0.07 channel-position band for "similar to today's position"
  var HOLDS = [2, 4, 6, 8];     // table columns + backstop columns (years)
  // Retro table entry set excludes Bitcoin's pre-2014 curiosity era (marked, not
  // silently dropped — see the table caveat). The today-anchored backstop applies
  // no cut (the today-anchor already excludes ancient cycle-peak exits).
  var TABLE_CUT = (Date.UTC(2014, 0, 1) / 1000 - GENESIS_TS) / 86400;

  function revertPos(startPos, u) {
    if (DeploymentProjection && typeof DeploymentProjection.pathPos === 'function') return DeploymentProjection.pathPos('revert', startPos, u);
    return startPos + (TREND_POS - startPos) * u;
  }
  function realPriceAt(absDay) {
    if (absDay <= PL_DATA[0][0]) return PL_DATA[0][1];
    if (absDay >= PL_DATA[N - 1][0]) return PL_DATA[N - 1][1];
    for (var i = 1; i < N; i++) {
      if (PL_DATA[i][0] >= absDay) { var a = PL_DATA[i - 1], b = PL_DATA[i], t = (absDay - a[0]) / (b[0] - a[0]); return a[1] * (1 - t) + b[1] * t; }
    }
    return PL_DATA[N - 1][1];
  }
  function monthYear(day) { return new Date(GENESIS_TS * 1000 + day * 86400 * 1000).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }

  // ── Precomputed samples ──
  var S = (function () { var a = new Array(N); for (var i = 0; i < N; i++) a[i] = { d: PL_DATA[i][0], p: PL_DATA[i][1], pos: posOf(PL_DATA[i][1], PL_DATA[i][0]) }; return a; })();

  // ── State (today-anchored; no entry/horizon variables) ──
  var state = {
    sum: 25000,
    style: 'lump',          // 'lump' | 'ladder' | 'hybrid'
    durMonths: 12,
    front: 50,
    view: 'retrospective'   // 'retrospective' | 'projective' (label: Projection)
  };
  var liveTodayPrice = null, liveTodayPos = null;
  var hoverRow = null;      // strategy row hovered (highlights the entry dots)

  // ── Vocabulary: ×-trend + shared 2H word-label only; the 0–1 coordinate never shows ──
  function posLabel(pos) { return positionLabel(pos); }
  function posDisplay(pos) { return ratioOf(pos).toFixed(2) + '× trend · ' + posLabel(pos); }
  function livePos() { return (liveTodayPos != null) ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS); }
  // Sub-floor today folds into the floor (2H "near the floor") for entry-matching, so
  // the in-band set stays full + the table climbs cleanly rather than skewing to a few
  // 2015 entries. The reader still sees their true live ×-trend in the readout.
  function matchPos() { return Math.max(0, livePos()); }

  // ── Format ──
  function fmtUSD(v) {
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }
  function fmtMult(m) { return m == null ? '—' : (m >= 100 ? Math.round(m).toLocaleString() : (m >= 10 ? Math.round(m) : m.toFixed(1))) + '×'; }
  function median(arr) { var m = arr.filter(function (x) { return x != null && isFinite(x); }).sort(function (a, b) { return a - b; }); return m.length ? m[Math.floor(m.length * 0.5)] : null; }
  var STYLES = ['lump', 'ladder', 'hybrid'];
  var STYLE_NAME = { lump: 'Lump sum', ladder: 'Ladder in', hybrid: 'Hybrid' };

  // ── Buy schedule + plan value ──
  function buyEvents(style) {
    var n = Math.max(1, Math.round(state.durMonths)), a, k, w;
    if (style === 'lump') return [{ d: 0, w: 1 }];
    if (style === 'ladder') { a = []; w = 1 / n; for (k = 0; k < n; k++) a.push({ d: k * MONTH_D, w: w }); return a; }
    var f = Math.max(0, Math.min(1, state.front / 100));
    a = [{ d: 0, w: f }]; w = (1 - f) / n;
    for (k = 1; k <= n; k++) a.push({ d: k * MONTH_D, w: w });
    return a;
  }
  function btcHeldAt(events, priceAt, t) { var btc = 0; for (var i = 0; i < events.length; i++) if (events[i].d <= t + 1e-9) btc += (events[i].w * state.sum) / priceAt(events[i].d); return btc; }
  // multiple (value/sum) for a plan deployed at entryDay, valued `span` days later (real record)
  function planMultiple(style, entryDay, span) {
    var price = function (d) { return realPriceAt(entryDay + d); };
    return btcHeldAt(buyEvents(style), price, span) * price(span) / state.sum;
  }

  // ── Entry set: historical entries within ±0.07 of today's (floor-clamped) position,
  //    post-2014, old enough for the LONGEST hold. The SAME set populates every column
  //    (Version B). Reuses the ±0.07 band matcher. ──
  function channelMatches(pos, span) {
    var idx = [];
    for (var i = 0; i < N; i++) { if (span != null && S[i].d > LAST_D - span) break; if (Math.abs(S[i].pos - pos) <= MATCH_BAND) idx.push(i); }
    return idx;
  }
  // The full in-band, post-2014 entry set at EVERY maturity. Per-column maturity is applied
  // inside retroGrid (so a column's median isn't dragged by entries too recent to have that
  // record), and the expandable detail table shows the rest with honest blank long-hold cells.
  function entrySet() {
    return channelMatches(matchPos(), null).filter(function (i) { return S[i].d >= TABLE_CUT; });
  }
  function matureFor(idx, h) { return idx.filter(function (i) { return S[i].d <= LAST_D - h * YEAR_D; }); }
  // 3×4 median grid under the "held N years" convention (each entry valued N years AFTER its
  // own entry date — captures the cycle peak within the window). Each column draws only on the
  // entries old enough for that hold, so the long-hold medians rest on fewer, older entries and
  // the row climbs because time does the work, not because of an inconsistent denominator.
  function retroGrid(idx) {
    var grid = {};
    STYLES.forEach(function (s) {
      grid[s] = HOLDS.map(function (h) { return median(matureFor(idx, h).map(function (i) { return planMultiple(s, S[i].d, h * YEAR_D); })); });
    });
    return grid;
  }
  // 3×4 projection grid: deploy TODAY, value N years forward under the two Power Law paths
  // (reversion-to-trend, stay-on-trajectory) → a low–high range per cell. Extrapolation.
  function projGrid() {
    var pos = livePos(), grid = {};
    STYLES.forEach(function (s) {
      grid[s] = HOLDS.map(function (h) {
        var span = h * YEAR_D, ev = buyEvents(s);
        var tj = function (d) { return plPrice(todayD + d) * ratioOf(pos); };
        var rv = function (d) { return plPrice(todayD + d) * ratioOf(revertPos(pos, Math.min(1, d / span))); };
        var a = btcHeldAt(ev, tj, span) * tj(span) / state.sum, b = btcHeldAt(ev, rv, span) * rv(span) / state.sum;
        return { lo: Math.min(a, b), hi: Math.max(a, b) };
      });
    });
    return grid;
  }

  // ════════ CHART — channel orientation + qualifying-entry dots ════════
  // Retrospective: floor/trend/upper bands across history + the actual price line, with
  // the qualifying entries pinpointed as dots (brighten on table row-hover). Projection:
  // forward bands + the reversion/trajectory range from today.
  var chart = null, entryDots = [];
  var dotPlugin = {
    id: 'dpDots',
    afterDatasetsDraw: function (c) {
      if (state.view !== 'retrospective' || !entryDots.length) return;
      var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx, area = c.chartArea;
      ctx.save();
      for (var i = 0; i < entryDots.length; i++) {
        var x = xS.getPixelForValue(entryDots[i].x), y = yS.getPixelForValue(entryDots[i].y);
        if (x < area.left - 2 || x > area.right + 2) continue;
        var hot = hoverRow != null;
        ctx.beginPath(); ctx.arc(x, y, hot ? 5 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = AMBER; ctx.globalAlpha = hot ? 1 : 0.7; ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      ctx.restore();
    }
  };
  function band(label, data, color, dash, w) { return { label: label, data: data, borderColor: color, backgroundColor: color, borderWidth: w, borderDash: dash || undefined, pointRadius: 0, tension: 0.2, fill: false, order: 4 }; }
  function bandLine(mult, baseDay, span) {
    var pts = [], step = Math.max(12, span / 90), d;
    for (d = 0; d <= span + 1e-6; d += step) pts.push({ x: baseDay + d, y: plPrice(baseDay + d) * mult });
    pts.push({ x: baseDay + span, y: plPrice(baseDay + span) * mult });
    return pts;
  }
  function chartDatasets() {
    entryDots = [];
    if (state.view === 'projective') {
      var pos = livePos(), span = HOLDS[HOLDS.length - 1] * YEAR_D, ds = bandTriple(todayD, span);
      var trajPrice = function (d) { return plPrice(todayD + d) * ratioOf(pos); };
      var revertPrice = function (d) { return plPrice(todayD + d) * ratioOf(revertPos(pos, Math.min(1, d / span))); };
      var path = function (fn) { var p = [], step = span / 90, d; for (d = 0; d <= span + 1e-6; d += step) p.push({ x: todayD + d, y: fn(d) }); return p; };
      ds.push({ label: 'Reversion to trend', data: path(revertPrice), borderColor: REVERT_C, backgroundColor: 'rgba(224,148,34,0.10)', borderWidth: 2.4, pointRadius: 0, tension: 0.2, fill: '+1', order: 1 });
      ds.push({ label: 'Stay on current trajectory', data: path(trajPrice), borderColor: TRAJ_C, backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 3], pointRadius: 0, tension: 0.2, fill: false, order: 1 });
      return ds;
    }
    // retrospective: bands + price over a window from a bit before the earliest entry to today
    var idx = entrySet();
    var startD = idx.length ? Math.max(FIRST_D, S[idx[0]].d - YEAR_D) : Math.max(FIRST_D, todayD - 10 * YEAR_D);
    var span = todayD - startD;
    var dr = bandTriple(startD, span);
    var price = []; for (var i = 0; i < N; i++) if (S[i].d >= startD) price.push({ x: S[i].d, y: S[i].p });
    price.push({ x: todayD, y: exitPrice() });
    dr.push({ label: 'BTC price (history)', data: price, borderColor: HIST_C, borderWidth: 1.3, pointRadius: 0, tension: 0.15, order: 1 });
    entryDots = idx.map(function (i) { return { x: S[i].d, y: S[i].p }; });
    return dr;
  }
  function bandTriple(baseDay, span) {
    return [band('Floor (0.42× trend)', bandLine(PL_FLOOR, baseDay, span), FLOOR_C, [6, 3], 1.4),
            band('Trend', bandLine(1, baseDay, span), TREND_C, null, 2),
            band('Upper (3× trend)', bandLine(PL_CEIL, baseDay, span), UPPER_C, [1, 6], 1.1)];
  }
  function yBounds(ds) {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < ds.length; i++) for (var j = 0; j < ds[i].data.length; j++) { var y = ds[i].data[j].y; if (isFinite(y) && y > 0) { if (y < lo) lo = y; if (y > hi) hi = y; } }
    if (!isFinite(lo)) { lo = 1000; hi = 1e7; }
    return { min: lo * 0.55, max: hi * 1.9 };
  }
  function buildChart() {
    var el = document.getElementById('dpChart'); if (!el || typeof Chart === 'undefined') return;
    var ds = chartDatasets(), yb = yBounds(ds);
    chart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: { datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 20, right: 10 } },
        scales: {
          x: { type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, maxTicksLimit: 8, callback: function (v) { return new Date(GENESIS_TS * 1000 + v * 86400 * 1000).getUTCFullYear(); } } },
          y: {
            type: 'logarithmic', min: yb.min, max: yb.max, grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { if (v >= 1e9) return '$' + (v / 1e9).toFixed(0) + 'B'; if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'; return '$' + v.toFixed(0); } }
          }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            filter: function (it) { var v = it.parsed && it.parsed.y; return v != null && isFinite(v) && v > 0; },
            callbacks: { title: function (it) { return it.length ? new Date(GENESIS_TS * 1000 + it[0].parsed.x * 86400 * 1000).getUTCFullYear() : ''; }, label: function (it) { return it.dataset.label + ': ' + fmtUSD(it.parsed.y); } }
          }
        }
      },
      plugins: [dotPlugin]
    });
  }
  function updateChart() {
    if (!chart) { buildChart(); return; }
    var ds = chartDatasets(), yb = yBounds(ds);
    chart.data.datasets = ds; chart.options.scales.y.min = yb.min; chart.options.scales.y.max = yb.max;
    chart.update('none');
  }
  function highlightDots(on) { hoverRow = on; if (chart) chart.update('none'); }

  // ════════ RETROSPECTIVE + PROJECTION TABLES ════════
  function strategyRows(bodyId, cells) {
    var tb = document.getElementById(bodyId); if (!tb) return;
    var html = '';
    STYLES.forEach(function (s) {
      html += '<tr class="dp-strat-row' + (s === state.style ? ' dp-row-sel' : '') + '" data-style="' + s + '"><th>' + STYLE_NAME[s] + '</th>';
      cells[s].forEach(function (c, j) { html += '<td' + (j === HOLDS.length - 1 ? ' class="dp-strong"' : '') + '>' + c + '</td>'; });
      html += '</tr>';
    });
    tb.innerHTML = html;
    // row-hover ↔ chart dots
    tb.querySelectorAll('.dp-strat-row').forEach(function (tr) {
      tr.addEventListener('mouseenter', function () { highlightDots(tr.getAttribute('data-style')); });
      tr.addEventListener('mouseleave', function () { highlightDots(null); });
    });
  }
  function renderRetro() {
    var idx = entrySet(), grid = retroGrid(idx), cells = {};
    STYLES.forEach(function (s) { cells[s] = grid[s].map(function (m) { return fmtMult(m); }); });
    strategyRows('dpRetroBody', cells);
    var mature8 = matureFor(idx, HOLDS[HOLDS.length - 1]).length;
    var cap = document.getElementById('dpRetroCaveat');
    if (cap) {
      cap.innerHTML = idx.length
        ? 'Across <strong>' + idx.length + '</strong> historical entries near today&rsquo;s position (' + posDisplay(matchPos()) + ') &mdash; <strong>' + mature8 + '</strong> with a full eight-year history &mdash; each held the listed number of years. <em>Each column uses the entries old enough for that hold, so the long-hold columns rest on the older near-floor entries, which cluster in 2015&ndash;2016 (the last time Bitcoin sat this low with room for a full eight-year record). 2014 traded well above the floor, working down from the 2013 peak &mdash; an absence, not a cut; earlier near-floor entries in 2010&ndash;2013 are set aside as the pre-$15 curiosity era, prices too small to represent returns a buyer today could replicate. Illustrative, not statistical.</em>'
        : 'Bitcoin has too few historical entries near today&rsquo;s position to follow &mdash; switch to <strong>Projection</strong> for the forward view.';
    }
    var dct = document.getElementById('dpDotCountTotal'); if (dct) dct.textContent = idx.length;
    var dcm = document.getElementById('dpDotCountMature'); if (dcm) dcm.textContent = mature8;
    var dco = document.getElementById('dpDetailCount'); if (dco) dco.textContent = idx.length;
    renderDetail(idx, grid);
  }
  // Expandable evidence table (the answer to "how do the entries become the median"): every
  // in-band entry, not just the 8yr-mature ones, with blank long-hold cells where an entry is
  // too recent for that record. A pinned median row anchors the reference; individual rows
  // zigzag (some six-year holds caught a cycle peak), the median across all of them is what climbs.
  function renderDetail(idx, grid) {
    var tb = document.getElementById('dpDetailTableBody'); if (!tb) return;
    grid = grid || retroGrid(idx);
    var s = state.style, html = '';
    html += '<tr class="dp-detail-median"><th>Median</th><td class="dp-detail-xt">&mdash;</td>';
    grid[s].forEach(function (m, j) { html += '<td' + (j === HOLDS.length - 1 ? ' class="dp-strong"' : '') + '>' + fmtMult(m) + '</td>'; });
    html += '</tr>';
    idx.forEach(function (i) {
      var xt = S[i].p / plPrice(S[i].d);
      html += '<tr><th>' + monthYear(S[i].d) + '</th><td class="dp-detail-xt">' + xt.toFixed(2) + '&times;</td>';
      for (var h = 0; h < HOLDS.length; h++) {
        var mature = S[i].d <= LAST_D - HOLDS[h] * YEAR_D, cls = [];
        if (h === HOLDS.length - 1) cls.push('dp-strong');
        if (!mature) cls.push('dp-detail-blank');
        var v = mature ? fmtMult(planMultiple(s, S[i].d, HOLDS[h] * YEAR_D)) : '&mdash;';
        html += '<td' + (cls.length ? ' class="' + cls.join(' ') + '"' : '') + '>' + v + '</td>';
      }
      html += '</tr>';
    });
    tb.innerHTML = html;
  }
  function renderProj() {
    var grid = projGrid(), cells = {};
    STYLES.forEach(function (s) { cells[s] = grid[s].map(function (r) { return fmtMult(r.lo) + '–' + fmtMult(r.hi); }); });
    strategyRows('dpProjBody', cells);
    var d = document.getElementById('dpProjDollars');
    if (d) { var r = projGrid()[state.style][HOLDS.length - 1]; d.innerHTML = fmtUSD(state.sum) + ' deployed today as <strong>' + STYLE_NAME[state.style].toLowerCase() + '</strong> → <strong>' + fmtUSD(r.lo * state.sum) + '–' + fmtUSD(r.hi * state.sum) + '</strong> in ' + HOLDS[HOLDS.length - 1] + ' years. The range spans reversion-to-trend and stay-on-trajectory — extrapolations of the Power Law, never forecasts.'; }
  }
  function renderActiveRows() {
    document.querySelectorAll('.dp-strat-row').forEach(function (tr) { tr.classList.toggle('dp-row-sel', tr.getAttribute('data-style') === state.style); });
  }

  // ════════ LIVE READOUT (top) + position-aware page-3 cross-link ════════
  function renderLive(price, source) {
    liveTodayPrice = price; liveTodayPos = posOf(price, TODAY_DAYS);
    var ratio = price / plPrice(TODAY_DAYS), pos = liveTodayPos;
    var posEl = document.getElementById('dpLivePos'), recEl = document.getElementById('dpLiveRec'), metaEl = document.getElementById('dpLiveMeta');
    if (posEl) posEl.innerHTML = '<strong>' + ratio.toFixed(2) + '×</strong> trend · ' + posLabel(pos);
    if (recEl) {
      var rec;   // bands aligned to the 2H vocabulary boundaries
      if (pos < 0.36) rec = 'the model leans <b>deploy decisively</b> — laddering-in mostly means paying more as price reverts up.';
      else if (pos < 0.53) rec = 'this is close to a <b>coin-flip</b> — pick the style you can hold through; commitment matters more than the tactic.';
      else if (pos < 0.79) rec = 'lump sum can be riskier here; a <b>hybrid or ladder</b> looks more attractive as a hedge.';
      else rec = 'a <b>hybrid or ladder</b> is the more defensible call as a drawdown hedge — read the cautions, it&rsquo;s softer than it sounds.';
      recEl.innerHTML = 'With price ' + posLabel(pos) + ', ' + rec;
    }
    if (metaEl) metaEl.textContent = (todayPriceIsLive(source) ? 'Live: ' : 'Latest monthly data: ') + fmtUSD(price) + ' · ' + ratio.toFixed(2) + '× trend · recomputed every page load.';
    renderTitle();
    updateTimingLink();
    updateChart(); renderRetro(); renderProj(); renderBackstop();
    renderCaveats();
  }
  // Position-relative caveat (no spatial pointer — the readout reordered, so "above"/"left"
  // are wrong/fragile) + decaying-returns honesty caveat. Both pull the SAME live numbers the
  // tables render, so the magnitude gap (historical ~X× vs projected ~lo–hi×) can never drift.
  // Qualitative fallback when a value is missing — a broken {} placeholder never renders.
  function renderCaveats() {
    var rel = document.getElementById('dpCaveatRel');
    if (rel) rel.innerHTML = 'Everything here is relative to <strong>today&rsquo;s position &mdash; ' + posDisplay(livePos()) + '</strong>; the recommendation is the channel&rsquo;s tendency, not a <strong>certainty or prediction</strong> &mdash; the <a href="#cautions">cautions at the bottom of the page</a> are important to understand and reflect on.';
    var dec = document.getElementById('dpDecayCaveat'); if (!dec) return;
    var idx = entrySet();
    var retro = idx.length ? retroGrid(idx).lump[HOLDS.length - 1] : null;
    var pj = projGrid().lump[HOLDS.length - 1];
    if (retro != null && pj && isFinite(pj.lo) && isFinite(pj.hi)) {
      dec.innerHTML = '<strong>These historical multiples won&rsquo;t repeat at the same scale.</strong> The Power Law&rsquo;s growth rate decays as Bitcoin matures &mdash; near-floor entries returned about <strong>' + fmtMult(retro) + '</strong> over eight years historically, but the same model projects roughly <strong>' + fmtMult(pj.lo) + '&ndash;' + fmtMult(pj.hi) + '</strong> forward. The table below teaches that <em>patience helped</em> &mdash; it does not promise the <em>magnitude</em>. For forward-looking ranges, use the <strong>Projection</strong> view.';
    } else {
      dec.innerHTML = '<strong>These historical multiples won&rsquo;t repeat at the same scale.</strong> The Power Law&rsquo;s growth rate decays as Bitcoin matures, so forward returns are expected to be materially lower. For forward-looking ranges, use the <strong>Projection</strong> view.';
    }
  }
  // Calculator H2 — dynamic by view, with the live ×-trend inline (same value as the readout).
  function renderTitle() {
    var el = document.getElementById('dpCalcTitle'); if (!el) return;
    var ratio = (liveTodayPrice != null ? liveTodayPrice : TODAY_PRICE) / plPrice(TODAY_DAYS);
    var pre = 'At today&rsquo;s position (' + ratio.toFixed(2) + '&times; trend), ';
    el.innerHTML = (state.view === 'retrospective')
      ? pre + 'how have the strategies performed?'
      : pre + 'how might the strategies perform over the years ahead?';
  }
  // Position-aware cross-link to the (future) timing page: muted/absent when low in the
  // channel (deploying decisively is the honest call — we don't manufacture hesitation);
  // surfaced when high (waiting is a real consideration worth digesting first). The
  // page-3 is /wait-or-deploy-now (the "whether/when" page, retrospective-only).
  function updateTimingLink() {
    var el = document.getElementById('dpTimingLink'); if (!el) return;
    var pos = livePos();
    if (pos < 0.53) {   // near floor / below trend / at trend → muted
      el.className = 'dp-timing-link dp-timing-muted';
      el.innerHTML = 'Today, price is <strong>' + posDisplay(pos) + '</strong> — low enough that deploying decisively is the honest call, so there&rsquo;s little to deliberate. <span class="dp-timing-note">(If price were high in the channel, this is where we&rsquo;d point you to <a href="/wait-or-deploy-now">Wait, or Deploy Now?</a> — weighing whether to wait. It isn&rsquo;t, so we don&rsquo;t.)</span>';
    } else {            // above trend / high / upper band → surfaced
      el.className = 'dp-timing-link dp-timing-surfaced';
      el.innerHTML = '<span class="dp-timing-tag">Weighing whether to wait?</span> Price is <strong>' + posDisplay(pos) + '</strong> — high enough that <em>when</em> to deploy is a real question, not just <em>how</em>. Digest the drawdown-cost and waiting tradeoffs on <a href="/wait-or-deploy-now">Wait, or Deploy Now?</a> before committing capital.';
    }
  }

  // ════════ COMMITMENT BACKSTOP (today-anchored) + COMPRESSION ════════
  function bucketName(pos) { return pos < 0.33 ? 'lower' : (pos < 0.66 ? 'mid' : 'upper'); }
  // For each hold N, entries deployed ~N years ago (~1.8yr window), valued at TODAY's
  // live price ÷ entry price — "held to today". A different question from the calculator
  // table's "held N years", which each table's caption states in plain language.
  function exitPrice() { return liveTodayPrice != null ? liveTodayPrice : TODAY_PRICE; }
  function backstop() {
    var exit = exitPrice(), HALF = 0.9 * YEAR_D, agg = { lower: {}, mid: {}, upper: {} }, b, h;
    for (b in agg) for (h = 0; h < HOLDS.length; h++) agg[b][HOLDS[h]] = [];
    for (h = 0; h < HOLDS.length; h++) {
      var center = todayD - HOLDS[h] * YEAR_D;
      for (var i = 0; i < N; i++) { if (Math.abs(S[i].d - center) > HALF) continue; agg[bucketName(S[i].pos)][HOLDS[h]].push(exit / S[i].p); }
    }
    var out = {}; for (b in agg) { out[b] = {}; for (h = 0; h < HOLDS.length; h++) { var arr = agg[b][HOLDS[h]], m = 0; for (var k = 0; k < arr.length; k++) m += arr[k]; out[b][HOLDS[h]] = arr.length ? m / arr.length : null; } } return out;
  }
  function compression() { var W = [[2011, 2014], [2015, 2018], [2019, 2022], [2023, 2026]], out = []; for (var w = 0; w < W.length; w++) { var mx = -Infinity; for (var i = 0; i < N; i++) { var yr = new Date(GENESIS_TS * 1000 + S[i].d * 86400 * 1000).getUTCFullYear(); if (yr >= W[w][0] && yr <= W[w][1]) mx = Math.max(mx, S[i].pos); } if (mx > -Infinity) out.push({ label: W[w][0] + '–' + W[w][1], max: mx }); } return out; }
  function renderBackstop() {
    var bs = backstop(), tb = document.getElementById('dpBackstopBody');
    if (tb) { var rows = [['lower', 'Lower channel'], ['mid', 'Mid-channel'], ['upper', 'Upper channel']], html = ''; for (var r = 0; r < rows.length; r++) { html += '<tr class="dp-row-' + rows[r][0] + '"><th>' + rows[r][1] + '</th>'; for (var h = 0; h < HOLDS.length; h++) { var v = bs[rows[r][0]][HOLDS[h]]; html += '<td' + (h === HOLDS.length - 1 ? ' class="dp-strong"' : '') + '>' + fmtMult(v) + '</td>'; } html += '</tr>'; } tb.innerHTML = html; }
    var tk = document.getElementById('dpBackstopTakeaway');
    if (tk) {
      var H = 8, up = bs.upper[H];
      var lead = (up != null)
        ? 'Even <strong>upper-channel</strong> entries — the worst-timed buys — deployed <strong>' + H + ' years ago</strong> and held to today still returned about <strong>' + fmtMult(up) + '</strong> on average. '
        : 'Bitcoin hasn&rsquo;t sat high in the channel within the last <strong>' + H + ' years</strong>, so there are no upper-channel entries that recent to show — but over longer holds even the worst-timed buys have recovered to today. ';
      tk.innerHTML = lead + 'That is a multi-year tendency, <em>not</em> a guarantee: over short horizons entries have frequently sat underwater — including now (price has been below the Power Law trend about 58% of the time, above it about 42%). Recovery has historically come with time held, not on demand.';
    }
    var cp = compression(), cb = document.getElementById('dpCompressionBody');
    if (cb) { var ch = ''; for (var i = 0; i < cp.length; i++) ch += '<tr><th>' + cp[i].label + '</th><td class="dp-strong">' + cp[i].max.toFixed(2) + '×</td></tr>'; cb.innerHTML = ch; }
    var mw = document.getElementById('dpMethodWindow');
    if (mw) mw.innerHTML = '<code>PL_DATA</code> window: ' + monthYear(S[0].d) + ' – ' + monthYear(S[N - 1].d) + ' (' + N + ' samples, ~12-day spacing).';
  }

  // ════════ CONTROLS ════════
  function syncStyleUI() {
    document.body.setAttribute('data-dp-style', state.style);
    var durRow = document.getElementById('dpDurRow'), frontRow = document.getElementById('dpFrontRow');
    if (durRow) durRow.style.display = (state.style === 'lump') ? 'none' : '';
    if (frontRow) frontRow.style.display = (state.style === 'hybrid') ? '' : 'none';
    updateDurLabel();
  }
  // Hybrid names the laddered remainder explicitly so the split is unambiguous (e.g. 75% now
  // → "Blend the remaining 25% over"); plain ladder just says "Ladder over".
  function updateDurLabel() {
    var durLabel = document.getElementById('dpDurLabelText'); if (!durLabel) return;
    durLabel.textContent = (state.style === 'hybrid') ? 'Blend the remaining ' + (100 - state.front) + '% over' : 'Ladder over';
  }
  function wire() {
    var sum = document.getElementById('dpSum'), sumVal = document.getElementById('dpSumVal');
    if (sum) sum.addEventListener('input', function () { state.sum = parseInt(this.value, 10); if (sumVal) sumVal.textContent = fmtUSD(state.sum); renderRetro(); renderProj(); });

    document.querySelectorAll('.dp-style button').forEach(function (btn) {
      btn.addEventListener('click', function () { state.style = btn.getAttribute('data-style'); document.querySelectorAll('.dp-style button').forEach(function (b) { b.classList.toggle('active', b === btn); }); syncStyleUI(); renderRetro(); renderActiveRows(); renderProj(); });
    });

    var dur = document.getElementById('dpDur'), durVal = document.getElementById('dpDurVal');
    if (dur) dur.addEventListener('input', function () { state.durMonths = parseInt(this.value, 10); if (durVal) durVal.textContent = state.durMonths >= 12 && state.durMonths % 12 === 0 ? (state.durMonths / 12) + (state.durMonths === 12 ? ' yr' : ' yrs') : state.durMonths + ' mo'; renderRetro(); renderProj(); });

    var front = document.getElementById('dpFront'), frontVal = document.getElementById('dpFrontVal');
    if (front) front.addEventListener('input', function () { state.front = parseInt(this.value, 10); if (frontVal) frontVal.textContent = state.front + '% now'; updateDurLabel(); renderRetro(); renderProj(); });

    document.querySelectorAll('.dp-view button').forEach(function (btn) {
      btn.addEventListener('click', function () { state.view = btn.getAttribute('data-view'); document.querySelectorAll('.dp-view button').forEach(function (b) { b.classList.toggle('active', b === btn); }); document.body.setAttribute('data-dp-view', state.view); renderTitle(); updateChart(); });
    });

    document.querySelectorAll('.dp-proj-jump').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); var b = document.querySelector('.dp-view button[data-view="projective"]'); if (b) b.click(); });
    });

    var dtog = document.getElementById('dpDetailToggle'), dbody = document.getElementById('dpDetailBody');
    if (dtog && dbody) dtog.addEventListener('click', function () {
      var open = dbody.hasAttribute('hidden');
      if (open) dbody.removeAttribute('hidden'); else dbody.setAttribute('hidden', '');
      dtog.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // ════════ INIT ════════
  function init() {
    document.body.setAttribute('data-dp-view', state.view);
    syncStyleUI();
    buildChart(); wire();
    renderLive(TODAY_PRICE, 'seed');
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price, source) { renderLive(price, source); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
