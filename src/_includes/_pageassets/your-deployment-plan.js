/* =============================================================
   Your Bitcoin Deployment Plan — page script (Stage 3A redesign)

   The personal model that companions /lump-sum-or-ladder-in. TODAY-ANCHORED
   only: the reader has capital to deploy now, the channel is where it is now,
   and the only live decision is HOW — lump / ladder / hybrid. Entry is not a
   variable (today IS the entry); entry-position/"when" exploration lives on the
   future timing page (page 3), reached via the position-aware cross-link.

   Reads PL_DATA + PL_* + GENESIS_TS + plPrice + positionLabel + TODAY_DAYS/
   TODAY_PRICE + fetchTodayPrice from shared/power-law-data.js, and bitcoin's
   price forward from shared/price-cases.js (the site's two scenarios; it needs
   shared/reversion-durations.js before it).
   Everything is computed live; no live position/price is baked into static copy.

   THE PROJECTION'S TWO PATHS (DEFAULTS_POLICY_2026-10-11, PR C, 2026-10-14).
   stays: today's multiple of trend throughout, so bitcoin grows at the trend's
   own rate. trend: the multiple moves in a straight line from today's to 1.0
   over 3 years, then follows the trend. Until 2026-10-14 the return was
   DeploymentProjection.pathPos('revert'): a straight line in log-channel
   position over the whole hold, so the 2-year column was back at trend in 2
   years and the chart took all 8. That module has no other consumer, so the
   page no longer loads it (TECH_DEBT).

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
  var MUTED = '#877e6f', DIM = '#9a9080', AMBER = '#e09422';

  // ── Channel-position math (log-space) ──
  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function posOf(price, days) { return (Math.log(price / plPrice(days)) - LF) / SPAN; }
  function ratioOf(pos) { return Math.exp(pos * SPAN + LF); }

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

  // Bitcoin's price d days from today on each scenario (see the header).
  var PC = window.PriceCases || null;
  function stayPriceFn(m0) { return function (d) { return plPrice(todayD + d) * m0; }; }
  function returnPriceFn(m0) {
    return function (d) {
      var t = d / YEAR_D;
      return plPrice(todayD + d) * (PC ? PC.multipleAt('trend', m0, 0, t) : m0 + (1 - m0) * Math.max(0, Math.min(1, t / 3)));
    };
  }
  function scenarioNames(m0) {
    return PC ? PC.names(m0) : { stay: 'Stays where it is against trend', trend: 'Returns to trend over 3 years' };
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
  // record), and Check the work's Historical entries tab shows the rest with honest blank long-hold cells.
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
  // 3×4 projection grid: deploy TODAY, value N years forward on bitcoin's two price
  // scenarios (stays where it is against trend; returns to trend over 3 years) → a
  // low–high range per cell. Extrapolation.
  function projGrid() {
    var m0 = ratioOf(livePos()), tj = stayPriceFn(m0), rv = returnPriceFn(m0), grid = {};
    STYLES.forEach(function (s) {
      grid[s] = HOLDS.map(function (h) {
        var span = h * YEAR_D, ev = buyEvents(s);
        var a = btcHeldAt(ev, tj, span) * tj(span) / state.sum, b = btcHeldAt(ev, rv, span) * rv(span) / state.sum;
        return { lo: Math.min(a, b), hi: Math.max(a, b) };
      });
    });
    return grid;
  }

  // ════════ CHART — channel orientation + qualifying-entry dots ════════
  // Retrospective: floor/trend/upper bands across history + the actual price line, with
  // the qualifying entries pinpointed as dots (brighten on table row-hover). Projection:
  // forward bands + the range between the two scenarios from today.
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
      var m0 = ratioOf(livePos()), span = HOLDS[HOLDS.length - 1] * YEAR_D, ds = bandTriple(todayD, span), NM = scenarioNames(m0);
      var trajPrice = stayPriceFn(m0), revertPrice = returnPriceFn(m0);
      // 96 steps over the 8-year span: year 3 is step 36, so the return's kink lands on a sample.
      var path = function (fn) { var p = [], step = span / 96, d; for (d = 0; d <= span + 1e-6; d += step) p.push({ x: todayD + d, y: fn(d) }); return p; };
      ds.push({ label: NM.trend, data: path(revertPrice), borderColor: REVERT_C, backgroundColor: 'rgba(224,148,34,0.10)', borderWidth: 2.4, pointRadius: 0, tension: 0.2, fill: '+1', order: 1 });
      ds.push({ label: NM.stay, data: path(trajPrice), borderColor: TRAJ_C, backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 3], pointRadius: 0, tension: 0.2, fill: false, order: 1 });
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
        /* Below the floor, entries are matched at the floor (matchPos clamps),
           so "near today's position (0.42× · near the floor)" named the clamp
           as today's position (2026-11-21, with today at 0.36×). Say both. */
        ? 'Across <strong>' + idx.length + '</strong> historical entries ' +
          (livePos() < 0
            ? 'at the floor (' + ratioOf(matchPos()).toFixed(2) + '× trend), the closest the record comes to today&rsquo;s position (' + posDisplay(livePos()) + ')'
            : 'near today&rsquo;s position (' + posDisplay(matchPos()) + ')') + ' &mdash; <strong>' + mature8 + '</strong> with a full eight-year history &mdash; each held the listed number of years. <em>Each column uses the entries old enough for that hold, so the long-hold columns rest on the older near-floor entries, which cluster in 2015&ndash;2016 (the last time Bitcoin sat this low with room for a full eight-year record). 2014 traded well above the floor, working down from the 2013 peak &mdash; an absence, not a cut; earlier near-floor entries in 2010&ndash;2013 are set aside as the pre-$15 curiosity era, prices too small to represent returns a buyer today could replicate. Illustrative, not statistical.</em>'
        : 'Bitcoin has too few historical entries near today&rsquo;s position to follow &mdash; switch to <strong>Projection</strong> for the forward view.';
    }
    var dct = document.getElementById('dpDotCountTotal'); if (dct) dct.textContent = idx.length;
    var dcm = document.getElementById('dpDotCountMature'); if (dcm) dcm.textContent = mature8;
    LAST_RETRO = { idx: idx, grid: grid, mature8: mature8 };
  }
  function renderProj() {
    var grid = projGrid(), cells = {};
    STYLES.forEach(function (s) { cells[s] = grid[s].map(function (r) { return fmtMult(r.lo) + '–' + fmtMult(r.hi); }); });
    strategyRows('dpProjBody', cells);
    var d = document.getElementById('dpProjDollars');
    if (d) {
      var r = grid[state.style][HOLDS.length - 1], NM = scenarioNames(ratioOf(livePos()));
      var lc = function (x) { return x.charAt(0).toLowerCase() + x.slice(1); };
      d.innerHTML = fmtUSD(state.sum) + ' deployed today as <strong>' + STYLE_NAME[state.style].toLowerCase() + '</strong> → <strong>' + fmtUSD(r.lo * state.sum) + '–' + fmtUSD(r.hi * state.sum) + '</strong> in ' + HOLDS[HOLDS.length - 1] + ' years. The range spans bitcoin’s two price scenarios: it ' + lc(NM.stay) + ', or it ' + lc(NM.trend) + '. Neither is a forecast.';
    }
    LAST_PROJ = grid;
    renderLedger();
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
    if (metaEl) metaEl.textContent = (todayPriceIsLive(source) ? 'Live: ' : 'As of ' + lastSampleDateShort() + ': ') + fmtUSD(price) + ' · ' + ratio.toFixed(2) + '× trend · recomputed every page load.';
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
      el.innerHTML = 'Today, price is <strong>' + posDisplay(pos) + '</strong> — low enough that deploying decisively is the sensible call, so there&rsquo;s little to deliberate. <span class="dp-timing-note">(If price were high in the channel, this is where we&rsquo;d point you to <a href="/wait-or-deploy-now">Wait, or Deploy Now?</a> — weighing whether to wait. It isn&rsquo;t, so we don&rsquo;t.)</span>';
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

  // ════════ CHECK THE WORK (STYLE_GUIDE §6.49; shared/ledger.js) ════════
  // Added 2026-11-26. The Retrospective's evidence table (every in-band entry
  // behind the medians, which was the "Show all entries" disclosure) becomes
  // its first tab; the Projection gets two: your buys from today and their
  // value by year on the two scenarios. The final table is your plan's row in
  // both tables above. Built from what renderRetro() and renderProj() last
  // showed (LAST_RETRO, LAST_PROJ) and the page's own functions; nothing here
  // changes a figure.
  var ledgerEl = document.getElementById('dpLedger');
  var LAST_RETRO = null, LAST_PROJ = null;
  function ledgerSpec() {
    var R = LAST_RETRO, P = LAST_PROJ, s = state.style, sum = state.sum, H8 = HOLDS[HOLDS.length - 1];
    var m0 = ratioOf(livePos()), NM = scenarioNames(m0), stay = stayPriceFn(m0), ret = returnPriceFn(m0), ev = buyEvents(s);
    var REV = PC ? PC.REVERT_YEARS : 3, mult0 = m0.toFixed(2) + '×';
    var usd0 = function (v) { return '$' + Math.round(v).toLocaleString('en-US'); };
    // Buys with no money in them (a hybrid at 0% or 100% now) add nothing; the tab leaves them out.
    var shown = ev.filter(function (e) { return e.w > 1e-12; });
    // A plan still buying at a hold: the page values only the bitcoin bought by
    // then, so the money not yet spent adds nothing to that figure. Said where it applies.
    var lateNote = function (j) {
      var span = HOLDS[j] * YEAR_D, rest = shown.filter(function (e) { return e.d > span + 1e-9; });
      if (!rest.length) return '';
      var u = rest.reduce(function (a, e) { return a + e.w; }, 0), first = Math.round(rest[0].d / MONTH_D);
      return ' At ' + HOLDS[j] + ' years this plan still has ' + (rest.length === 1 ? 'one buy' : rest.length + ' buys') + ' to make (' + usd0(u * sum) + ', ' + (u * 100).toFixed(1) + '% of the sum)' +
        (rest[0].d - span < 1 ? ': month ' + first + ' is ' + (first * MONTH_D).toFixed(2) + ' days from today, and ' + HOLDS[j] + ' years is ' + span.toFixed(1) : '') +
        '. The page counts only the bitcoin bought by then, so the money not yet spent adds nothing to the ' + HOLDS[j] + '-year figure.';
    };
    var lateAll = HOLDS.map(function (h, j) { return lateNote(j); }).join('');
    // Today's multiple is taken at the start of today, midnight UTC (TODAY_DAYS);
    // the price paths start at this moment (todayD), so today's buy
    // can sit a few dollars above today's price. Said when it shows in whole dollars.
    var p0 = exitPrice(), s0 = stay(0), hrs = (todayD - TODAY_DAYS) * 24;
    var startNote = Math.round(s0) !== Math.round(p0) ? ' Today\u2019s buy is priced at ' + usd0(s0) + ' rather than today\u2019s ' + usd0(p0) + ' on both scenarios: the page takes today\u2019s multiple against the trend at the start of today (midnight UTC) and starts the price path at this moment, ' + (hrs < 1 ? 'less than an hour' : Math.round(hrs) + (Math.round(hrs) === 1 ? ' hour' : ' hours')) + ' later, when the trend is slightly higher.' : '';
    // Entries tab: the median first (the table above), then every entry behind it.
    var entryRows = [{ median: true }].concat(R.idx.map(function (i) { return { i: i }; }));
    var holdCol = function (j) {
      var h = HOLDS[j];
      return { label: h + ' yr', unit: '× the sum', fmt: 'mult',
        get: function (x) { return x.median ? R.grid[s][j] : (S[x.i].d <= LAST_D - h * YEAR_D ? planMultiple(s, S[x.i].d, h * YEAR_D) : null); },
        how: 'What the plan turned each dollar into, held ' + h + ' years from that entry: the bitcoin it bought from that date, at the record’s price on each buy date, times the price ' + h + ' years after the entry. Blank where the entry isn’t ' + h + ' years old yet; the median uses only the entries that are.' + lateNote(j) };
    };
    var entryCols = [
      { label: 'Entry', unit: '', fmt: 'text', get: function (x) { return x.median ? 'Median' : monthYear(S[x.i].d); },
        how: 'A date in the price record, from January 2014 on, when bitcoin\u2019s channel position was within 0.07 of today\u2019s. The position runs from 0 at the floor (' + PL_FLOOR.toFixed(2) + '\u00d7 trend) to 1 at the top of the channel (' + PL_CEIL.toFixed(1) + '\u00d7), on a log scale; while price is below the floor, today counts as 0. The first row is each column’s median, the figure in the Retrospective table: the middle value, or the upper of the two middle values when the count is even. Single entries vary: some six-year holds caught a cycle peak, so one entry\u2019s row need not rise from hold to hold.' },
      { label: 'Against trend', unit: '×', fmt: 'mult', get: function (x) { return x.median ? null : S[x.i].p / plPrice(S[x.i].d); },
        how: 'Bitcoin’s price on that date divided by its Power Law trend.' }].concat(HOLDS.map(function (h, j) { return holdCol(j); }));
    // Buys tab: the plan's purchases from today on each scenario.
    var buyRows = shown.map(function (e) { return { d: e.d, w: e.w, k: Math.round(e.d / MONTH_D) }; });
    var buyCols = [
      { label: 'Buy', unit: '', fmt: 'text', get: function (x) { return x.k === 0 ? 'Today' : 'Month ' + x.k; },
        how: (s === 'lump' ? 'Lump sum buys the whole sum today.'
          : s === 'ladder' ? 'Ladder in buys ' + state.durMonths + ' equal parts a month apart, starting today.'
          : 'Hybrid buys ' + state.front + '% of the sum today and the rest in ' + state.durMonths + ' equal parts, one a month for the next ' + state.durMonths + ' months.') + (s === 'lump' ? '' : ' A month here is ' + MONTH_D + ' days.') },
      { label: 'Share of the sum', unit: '%', fmt: 'pct', get: function (x) { return x.w; }, how: 'Each buy’s part of the sum.' },
      { label: 'Dollars', unit: '$', fmt: 'usd', get: function (x) { return x.w * sum; }, how: 'The sum times the share.' },
      { label: 'Price if it stays', unit: '$', fmt: 'usd', get: function (x) { return stay(x.d); },
        how: 'The Power Law trend on that date times today’s multiple of trend (' + mult0 + '), which this scenario keeps.' + startNote },
      { label: 'BTC if it stays', unit: '₿', fmt: 'btc', get: function (x) { return x.w * sum / stay(x.d); }, how: 'Dollars divided by that price.' },
      { label: 'Price if it returns', unit: '$', fmt: 'usd', get: function (x) { return ret(x.d); },
        how: 'The trend on that date times a multiple that moves in a straight line from today’s ' + mult0 + ' to 1.0 over ' + REV + ' years, then stays at 1.0.' },
      { label: 'BTC if it returns', unit: '₿', fmt: 'btc', get: function (x) { return x.w * sum / ret(x.d); }, how: 'Dollars divided by that price.' }];
    // Value tab: what the buys are worth at each hold, on each scenario.
    var valueRows = HOLDS.map(function (h) { var span = h * YEAR_D; return { h: h, sBtc: btcHeldAt(ev, stay, span), sP: stay(span), rBtc: btcHeldAt(ev, ret, span), rP: ret(span) }; });
    var valueCols = [
      { label: 'Year', unit: '', fmt: 'text', get: function (x) { return 'Year ' + x.h; } },
      { label: 'BTC held if it stays', unit: '₿', fmt: 'btc', get: function (x) { return x.sBtc; }, how: 'The bitcoin from every buy made by then (the Your buys tab).' + lateAll },
      { label: 'Price if it stays', unit: '$', fmt: 'usd', get: function (x) { return x.sP; }, how: 'As on the Your buys tab, at that year.' },
      { label: 'Value if it stays', unit: '$', fmt: 'usd', get: function (x) { return x.sBtc * x.sP; }, how: 'BTC held times that price. Divided by the sum, it is one end of the Projection table’s range.' },
      { label: 'BTC held if it returns', unit: '₿', fmt: 'btc', get: function (x) { return x.rBtc; }, how: 'As above, at this scenario’s prices.' },
      { label: 'Price if it returns', unit: '$', fmt: 'usd', get: function (x) { return x.rP; }, how: 'As on the Your buys tab, at that year.' },
      { label: 'Value if it returns', unit: '$', fmt: 'usd', get: function (x) { return x.rBtc * x.rP; }, how: 'BTC held times that price. Divided by the sum, it is the other end of the range.' }];
    var styleWords = s === 'lump' ? 'Lump sum, all today'
      : s === 'ladder' ? 'Ladder in, equal parts over ' + state.durMonths + ' months'
      : 'Hybrid: ' + state.front + '% today, the rest over ' + state.durMonths + ' months';
    var inputs = [
      ['Sum to deploy', usd0(sum)], ['Strategy', styleWords],
      ['Bitcoin price today', usd0(exitPrice())], ['Power Law trend today', usd0(plPrice(TODAY_DAYS)) + ' (bitcoin at ' + mult0 + ' trend)'],
      ['Today’s channel position', posDisplay(livePos())],
      ['Historical entries matched', 'channel position within 0.07 of ' + (livePos() < 0 ? 'the floor\u2019s (today counts as the floor)' : 'today\u2019s') + ', from January 2014'],
      ['Entries found', R.idx.length + ' (' + R.mature8 + ' with eight years of record)'],
      ['Price record', monthYear(S[0].d) + ' to ' + monthYear(S[N - 1].d) + ', ' + N + ' samples'],
      ['Bitcoin’s price from today', NM.stay + ', or ' + NM.trend.charAt(0).toLowerCase() + NM.trend.slice(1)],
      ['Today', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]];
    var mine = HOLDS.map(function (h, j) {
      var a = valueRows[j].sBtc * valueRows[j].sP / sum, b = valueRows[j].rBtc * valueRows[j].rP / sum;
      return { label: h + ' years', fmt: 'mult', values: [R.grid[s][j], a, b], how: '' };
    });
    mine.forEach(function (r, j) {
      r.how = j === 0
        ? 'Historical median: the Retrospective table’s ' + HOLDS[j] + '-year cell. The two scenarios: the Value by year tab divided by the sum; the Projection table shows them as a range, lower first.' + lateNote(j)
        : 'As for ' + HOLDS[0] + ' years, at ' + HOLDS[j] + ' years.' + lateNote(j);
    });
    mine[mine.length - 1].strong = true;
    mine[mine.length - 1].card = 'The ' + H8 + '-year cells in the Retrospective and Projection tables above';
    var v8 = valueRows[valueRows.length - 1];
    mine.push({ label: 'Value at ' + H8 + ' years', values: [null, v8.sBtc * v8.sP, v8.rBtc * v8.rP],
      how: 'The sum times each scenario’s multiple: the dollar range under the Projection table, lower first.' });
    return {
      hint: 'every entry behind the medians, and your buys from today',
      inputs: inputs.map(function (m) { return { label: m[0], value: m[1] }; }),
      note: 'Historical entries: each one’s own record for the strategy picked above, as multiples of the sum. Your buys and their value: from today on bitcoin’s two scenarios, in dollars before inflation. The last table is your plan’s row in both tables above.',
      tabs: [{ id: 'entries', label: 'Historical entries', columns: entryCols, rows: entryRows, strong: function (x) { return !!x.median; } },
             { id: 'buys', label: 'Your buys, from today', columns: buyCols, rows: buyRows },
             { id: 'value', label: 'Value by year', columns: valueCols, rows: valueRows }],
      final: { title: 'Your plan: ' + STYLE_NAME[s], csvTitle: 'Your plan: ' + STYLE_NAME[s] + ' (multiples of the sum; dollars before inflation)',
        howTitle: 'How your plan’s figures are worked out', cols: ['Historical median', NM.stay, NM.trend], rows: mine },
      csv: { filename: 'your-deployment-plan.csv', meta: [
        ['Last Coin Standing', 'Your Bitcoin Deployment Plan'],
        ['Amounts', 'multiples of the sum; dollars before inflation; bitcoin in BTC'],
        ['Page', function () { return window.location.origin + window.location.pathname; }]] }
    };
  }
  function renderLedger() {
    if (!ledgerEl || !window.Ledger || !LAST_RETRO || !LAST_PROJ) return;
    window.Ledger.render(ledgerEl, ledgerSpec());
  }

  // ── QA (console: dpQA()) ──
  // The panel against the two tables and the dollar line, every entry and buy,
  // the value identities, the CSV's shape; then a sweep of styles, ladders,
  // hybrid splits and sums through the page's own renders, restored after.
  window.dpQA = function () {
    var near = function (x, y) { return Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(x), Math.abs(y)); };
    function holds() {
      var sp = ledgerEl && ledgerEl._ledgerSpec, why = [];
      if (!sp) return { ok: false, why: 'no ledger' };
      if (!window.Ledger.check(ledgerEl, { side: false })) why.push('Ledger.check');
      var s = state.style, R = LAST_RETRO, P = LAST_PROJ, ent = sp.tabs[0], buys = sp.tabs[1], val = sp.tabs[2];
      var fin = sp.final.rows, row = document.querySelector('#dpRetroBody tr[data-style="' + s + '"]'), prow = document.querySelector('#dpProjBody tr[data-style="' + s + '"]');
      HOLDS.forEach(function (h, j) {
        if (!near(fin[j].values[0] == null ? NaN : fin[j].values[0], R.grid[s][j]) && !(fin[j].values[0] == null && R.grid[s][j] == null)) why.push('median ' + h);
        var lo = Math.min(fin[j].values[1], fin[j].values[2]), hi = Math.max(fin[j].values[1], fin[j].values[2]);
        if (!(near(lo, P[s][j].lo) && near(hi, P[s][j].hi))) why.push('projection ' + h);
        if (row && row.children[j + 1].textContent !== fmtMult(R.grid[s][j])) why.push('retro cell text ' + h);
        if (prow && prow.children[j + 1].textContent !== fmtMult(P[s][j].lo) + '–' + fmtMult(P[s][j].hi)) why.push('projection cell text ' + h);
        if (!(ent.columns[2 + j].get(ent.rows[0]) === R.grid[s][j])) why.push('median row ' + h);
      });
      var last = fin[fin.length - 1], dl = document.getElementById('dpProjDollars');
      if (dl && (dl.textContent.indexOf(fmtUSD(Math.min(last.values[1], last.values[2]))) < 0 || dl.textContent.indexOf(fmtUSD(Math.max(last.values[1], last.values[2]))) < 0)) why.push('dollar line');
      if (ent.rows.length !== R.idx.length + 1) why.push('entry count');
      ent.rows.slice(1).forEach(function (x) { HOLDS.forEach(function (h, j) {
        var v = ent.columns[2 + j].get(x), mature = S[x.i].d <= LAST_D - h * YEAR_D;
        if (mature ? !near(v, planMultiple(s, S[x.i].d, h * YEAR_D)) : v !== null) why.push('entry ' + x.i + ' ' + h); }); });
      var share = 0, dollars = 0;
      buys.rows.forEach(function (x) { share += x.w; dollars += buys.columns[2].get(x);
        if (!near(buys.columns[4].get(x) * buys.columns[3].get(x), buys.columns[2].get(x)) || !near(buys.columns[6].get(x) * buys.columns[5].get(x), buys.columns[2].get(x))) why.push('buy ' + x.k); });
      if (!near(share, 1) || !near(dollars, state.sum)) why.push('buys add up');
      val.rows.forEach(function (x, j) {
        var sb = 0, rb = 0, t = x.h * YEAR_D;
        buys.rows.forEach(function (b) { if (b.d <= t + 1e-9) { sb += buys.columns[4].get(b); rb += buys.columns[6].get(b); } });
        if (!near(sb, x.sBtc) || !near(rb, x.rBtc)) why.push('held ' + x.h);
        if (!near(val.columns[3].get(x) / state.sum, fin[j].values[1]) || !near(val.columns[6].get(x) / state.sum, fin[j].values[2])) why.push('value ' + x.h);
      });
      var csv = window.Ledger.toCsv(sp);
      if (!(csv.indexOf('# Last Coin Standing,') === 0 && (csv.match(/^# Input: /gm) || []).length === sp.inputs.length
        && (csv.match(/^# How each column is worked out$/gm) || []).length === 3 && csv.indexOf('# Your plan: ') > 0)) why.push('csv shape');
      return { ok: !why.length, why: why };
    }
    var out = [], live = holds();
    out.push(['live panel: order, books against both tables and the dollar line, entries, buys, values, CSV', live.ok, live.why.join('; ')]);
    var saved = { style: state.style, durMonths: state.durMonths, front: state.front, sum: state.sum };
    var V = [];
    ['lump', 'ladder', 'hybrid'].forEach(function (s) { [3, 12, 36].forEach(function (m) { V.push({ style: s, durMonths: m, front: 50, sum: 25000 }); }); });
    V.push({ style: 'hybrid', durMonths: 24, front: 0, sum: 1000 }, { style: 'hybrid', durMonths: 12, front: 100, sum: 1000000 }, { style: 'ladder', durMonths: 24, front: 50, sum: 999000 });
    try {
      V.forEach(function (v) {
        state.style = v.style; state.durMonths = v.durMonths; state.front = v.front; state.sum = v.sum;
        renderRetro(); renderProj();
        var r = holds();
        out.push(['sweep: ' + v.style + ', ' + v.durMonths + ' months, ' + v.front + '% now, $' + v.sum.toLocaleString('en-US'), r.ok, r.why.join('; ')]);
      });
    } finally {
      state.style = saved.style; state.durMonths = saved.durMonths; state.front = saved.front; state.sum = saved.sum;
      renderRetro(); renderActiveRows(); renderProj();
    }
    var ok = out.every(function (x) { return x[1]; });
    if (window.console) console.table(out.map(function (x) { return { check: x[0], pass: x[1], why: x[2] }; }));
    return { ok: ok, checks: out };
  };

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
      btn.addEventListener('click', function () { state.view = btn.getAttribute('data-view'); document.querySelectorAll('.dp-view button').forEach(function (b) { b.classList.toggle('active', b === btn); }); document.body.setAttribute('data-dp-view', state.view); renderTitle(); updateChart();
        if (ledgerEl) { ledgerEl.setAttribute('data-tab', state.view === 'retrospective' ? 'entries' : 'buys'); renderLedger(); } });
    });

    document.querySelectorAll('.dp-proj-jump').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); var b = document.querySelector('.dp-view button[data-view="projective"]'); if (b) b.click(); });
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
