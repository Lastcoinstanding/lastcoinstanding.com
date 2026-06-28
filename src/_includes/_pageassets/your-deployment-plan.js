/* =============================================================
   Your Bitcoin Deployment Plan — page script (Stage 2C-②, review round)

   The personal model that companions /lump-sum-or-ladder-in. Borrows The
   Bitcoin Retirement's chart SHAPE only (value-over-time, time on the x-axis,
   the Power Law channel as a floor-at-the-bottom backdrop in value terms).
   Keeps this page's own controls and voice; imports none of Retirement's
   age/withdrawal/lifespan inputs.

   Reads PL_DATA + PL_* + GENESIS_TS + plPrice + TODAY_DAYS/TODAY_PRICE +
   fetchTodayPrice from shared/power-law-data.js, and the lifted forward path
   model from shared/deployment-projection.js (DeploymentProjection). Constants
   are NOT redeclared. Everything is computed live; no live position/price is
   ever baked into static copy (cross-cutting rule #1).

   Review-round changes (STAGE_2C_REVIEW_FIXES): channel-position shown as
   "×trend · plain label", never raw coordinates (item 3); retrospective
   rebuilt into a channel-anchored distribution (default) + a secondary
   time-anchored mode, killing the 2015-pin (item 10); past-tense verdict
   (item 11); "you deployed here" entry marker (item 7); Retirement-distinct
   chart colours (item 8); three-zone upper-channel risk flag on live position
   (item 12); softened backstop (item 9).
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  // ── Palette — distinct colours borrowed from The Bitcoin Retirement (item 8) ──
  var FLOOR_C = '#b04525', TREND_C = '#e09422', UPPER_C = '#e8c820';
  var REVERT_C = '#ece4d6', TRAJ_C = '#5e7a92', REAL_C = '#ece4d6';
  var MUTED = '#7a7367', DIM = '#9a9080', AMBER = '#e09422';

  // ── Channel-position math (log-space, copied locally per rule #5) ──
  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function posOf(price, days) { return (Math.log(price / plPrice(days)) - LF) / SPAN; }
  function ratioOf(pos) { return Math.exp(pos * SPAN + LF); }
  var TREND_POS = (DeploymentProjection && DeploymentProjection.TREND_POS != null)
    ? DeploymentProjection.TREND_POS : (0 - LF) / SPAN;

  var N = PL_DATA.length;
  var FIRST_D = PL_DATA[0][0], LAST_D = PL_DATA[N - 1][0];
  var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400;
  var YEAR_D = 365.25, MONTH_D = 30.44;
  var MATCH_BAND = 0.07;   // channel-anchored match band (item 10)
  var UPPER_RISK = 0.75;   // three-zone threshold (item 12)
  var SUFFICIENT_YEARS = 6; // channel-anchored sufficiency (item 12b)
  // ── Early-era cut (STAGE_2C_early_era_fix). Bitcoin's first four years (2009–2012)
  //    traded as a sub-$15 curiosity whose genuine 2-yr forward returns ran 100–200×
  //    (and 8-yr backstop figures into the thousands) — real, but not a return any
  //    buyer today could replicate. Headline figures (channel distribution + backstop)
  //    are computed from this cut forward; the early era is KEPT BUT MARKED in the
  //    copy, never silently dropped and never part of a headline number.
  var EARLY_ERA_D = (Date.UTC(2013, 0, 1) / 1000 - GENESIS_TS) / 86400;
  function isEarly(day) { return day < EARLY_ERA_D; }

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
  function yearOf(day) { return new Date(GENESIS_TS * 1000 + day * 86400 * 1000).getUTCFullYear(); }
  function monthYear(day) { return new Date(GENESIS_TS * 1000 + day * 86400 * 1000).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }

  // ── Precomputed samples ──
  var S = (function () { var a = new Array(N); for (var i = 0; i < N; i++) a[i] = { d: PL_DATA[i][0], p: PL_DATA[i][1], pos: posOf(PL_DATA[i][1], PL_DATA[i][0]), yr: yearOf(PL_DATA[i][0]) }; return a; })();

  // ── State ──
  var state = {
    sum: 25000,
    style: 'lump',          // 'lump' | 'ladder' | 'hybrid'
    durMonths: 12,
    front: 50,
    horizon: 4,
    view: 'retrospective',  // 'retrospective' | 'projective'
    anchor: 'channel'       // retrospective sub-mode: 'channel' | 'time'
  };
  var anchorUserSet = false;   // once the reader picks an anchor, stop auto-preferring
  var liveTodayPrice = null, liveTodayPos = null;
  var buyMarks = [], markLabel = '';   // "you deployed here" buy-point markers (one per tranche)

  // ── Channel-position display (item 3): ×trend + plain label. Raw pos stays
  //    internal (logic only); never shown as the primary number. ──
  // Delegates to the shared graduated vocabulary (Stage 2H) so this page's live readout,
  // verdict, and captions use the one canonical label set — no drifted local thresholds.
  function posLabel(pos) { return positionLabel(pos); }
  function posDisplay(pos) { return ratioOf(pos).toFixed(2) + '× trend · ' + posLabel(pos); }

  // ── Buy schedule for a style ──
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
  // ── Chart series are PRICE-per-BTC, anchored at the live spot / matched entry
  //    price (not the deployed sum) — the Power Law channel orientation. Dollar
  //    value + multiples live in the verdict. Fixes the value-space anchor that
  //    pinned t=0 to the sum (BUG_projective_anchor). ──
  function bandLine(mult, baseDay, span) {
    var pts = [], step = Math.max(12, span / 80), d;
    for (d = 0; d <= span + 1e-6; d += step) pts.push({ x: baseDay + d, y: plPrice(baseDay + d) * mult });
    pts.push({ x: baseDay + span, y: plPrice(baseDay + span) * mult });
    return pts;
  }
  function pricePath(priceFn, span, baseDay) {
    var pts = [], step = Math.max(12, span / 80), d;
    for (d = 0; d <= span + 1e-6; d += step) pts.push({ x: baseDay + d, y: priceFn(d) });
    pts.push({ x: baseDay + span, y: priceFn(span) });
    return pts;
  }
  // buy points: one per tranche, at the price along `priceFn` when it was bought —
  // a lump is one dot, a ladder/hybrid several, so the chart reflects the style.
  function buyMarksFor(style, priceFn, baseDay) {
    var ev = buyEvents(style), maxw = 0, tagged = false;
    ev.forEach(function (e) { if (e.w > maxw) maxw = e.w; });
    return ev.map(function (e) { var p = !tagged && e.w >= maxw - 1e-9; if (p) tagged = true; return { x: baseDay + e.d, y: priceFn(e.d), primary: p }; });
  }
  // multiple (value/sum) for a plan deployed at entryDay over the real record
  function planMultiple(style, entryDay, span) {
    var ev = buyEvents(style), price = function (d) { return realPriceAt(entryDay + d); };
    return btcHeldAt(ev, price, span) * price(span) / state.sum;
  }

  // ── Channel-anchored matches: historical entries near `pos` with room to
  //    hold `span`. Returned as a distribution, not a single date (item 10). ──
  function channelMatches(pos, span) {
    var idx = [];
    for (var i = 0; i < N; i++) { if (S[i].d > LAST_D - span) break; if (Math.abs(S[i].pos - pos) <= MATCH_BAND) idx.push(i); }
    return idx;
  }
  function distinctYears(idx) { var y = {}, c = 0; for (var k = 0; k < idx.length; k++) if (!y[S[idx[k]].yr]) { y[S[idx[k]].yr] = 1; c++; } return c; }
  function distStats(style, idx, span) {
    var m = idx.map(function (i) { return planMultiple(style, S[i].d, span); }).sort(function (a, b) { return a - b; });
    function q(p) { return m.length ? m[Math.min(m.length - 1, Math.floor(m.length * p))] : null; }
    return { idx: idx, n: idx.length, years: distinctYears(idx), median: q(0.5), lo: q(0.1), hi: q(0.9) };
  }
  // Headline = post-cut (modern) matches; the early era is split out as marked
  // context (`early`), and `full` carries the with-early-era figures the marked
  // note quotes ("counted in, the median would read …"). repIdx is the most recent
  // MODERN match, so the chart never replays a curiosity-era entry.
  function channelDist(style, pos, span) {
    var all = channelMatches(pos, span), modern = [], early = [];
    for (var k = 0; k < all.length; k++) (isEarly(S[all[k]].d) ? early : modern).push(all[k]);
    var H = distStats(style, modern, span), F = distStats(style, all, span);
    return {
      idx: modern, n: H.n, years: H.years, median: H.median, lo: H.lo, hi: H.hi,
      repIdx: modern.length ? modern[modern.length - 1] : (all.length ? all[all.length - 1] : -1),
      early: { n: early.length, years: distinctYears(early), fullMedian: F.median, fullHi: F.hi }
    };
  }
  function timeAnchor(style, span) {
    var entryDay = Math.max(FIRST_D, todayD - span), hold = todayD - entryDay;
    return { entryDay: entryDay, hold: hold, mult: planMultiple(style, entryDay, hold) };
  }

  // Retrospective anchor = state.anchor. The graceful fallback to time-anchored
  // when the upper-channel band is too thin (item 12b) is decided once in
  // renderLive (which also syncs the toggle UI), so chart + verdict + toggle
  // never disagree.
  function effectiveAnchor() { return state.view === 'retrospective' ? state.anchor : null; }
  function livePos() { return (liveTodayPos != null) ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS); }

  // ════════ CHART (price-per-BTC + Power Law channel; anchored at spot/entry) ════════
  var chart = null;
  var markerPlugin = {
    id: 'dpEntryMark',
    afterDatasetsDraw: function (c) {
      if (!buyMarks.length) return;
      var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx, area = c.chartArea;
      ctx.save();
      var pm = null;
      for (var i = 0; i < buyMarks.length; i++) {
        var m = buyMarks[i], x = xS.getPixelForValue(m.x), y = yS.getPixelForValue(m.y);
        if (x < area.left - 2 || x > area.right + 2) continue;
        ctx.fillStyle = AMBER; ctx.globalAlpha = m.primary ? 1 : 0.55;
        ctx.beginPath(); ctx.arc(x, y, m.primary ? 4.5 : 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.3; ctx.stroke();
        if (m.primary) pm = { x: x, y: y };
      }
      if (pm) {
        ctx.strokeStyle = 'rgba(224,148,34,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(pm.x, area.top); ctx.lineTo(pm.x, area.bottom); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = AMBER; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(markLabel, Math.min(pm.x + 7, area.right - 120), area.top + 11);
      }
      ctx.restore();
    }
  };

  function band(label, data, color, dash, w) { return { label: label, data: data, borderColor: color, backgroundColor: color, borderWidth: w, borderDash: dash || undefined, pointRadius: 0, tension: 0.2, fill: false, order: 4 }; }
  function bandTriple(baseDay, span) {
    return [band('Floor (0.42× trend)', bandLine(PL_FLOOR, baseDay, span), FLOOR_C, [6, 3], 1.4),
            band('Trend', bandLine(1, baseDay, span), TREND_C, null, 2),
            band('Upper (3× trend)', bandLine(PL_CEIL, baseDay, span), UPPER_C, [1, 6], 1.1)];
  }

  function chartDatasets() {
    var span = state.horizon * YEAR_D, pos = livePos(), ds = [];
    buyMarks = []; markLabel = '';

    if (state.view === 'projective') {
      var baseDay = todayD;
      var trajPrice = function (d) { return plPrice(todayD + d) * ratioOf(pos); };
      var revertPrice = function (d) { return plPrice(todayD + d) * ratioOf(revertPos(pos, Math.min(1, d / span))); };
      ds = bandTriple(baseDay, span);
      ds.push({ label: 'Reversion to trend', data: pricePath(revertPrice, span, baseDay), borderColor: REVERT_C, backgroundColor: 'rgba(224,148,34,0.10)', borderWidth: 2.4, pointRadius: 0, tension: 0.2, fill: '+1', order: 1 });
      ds.push({ label: 'Stay on current trajectory', data: pricePath(trajPrice, span, baseDay), borderColor: TRAJ_C, backgroundColor: 'transparent', borderWidth: 2, borderDash: [5, 3], pointRadius: 0, tension: 0.2, fill: false, order: 1 });
      buyMarks = buyMarksFor(state.style, trajPrice, baseDay);   // where each tranche buys along the "stay" path
      markLabel = 'You deploy here · today';
      return ds;
    }

    // ── retrospective ──
    if (effectiveAnchor() === 'time') {
      var ta = timeAnchor(state.style, span), aDay = ta.entryDay, hold = ta.hold;
      var realPriceT = function (d) { return realPriceAt(aDay + d); };
      ds = bandTriple(aDay, hold);
      ds.push({ label: 'BTC price (actual history)', data: pricePath(realPriceT, hold, aDay), borderColor: REAL_C, borderWidth: 2.4, pointRadius: 0, tension: 0.2, fill: false, order: 1 });
      buyMarks = buyMarksFor(state.style, realPriceT, aDay);
      markLabel = 'You deployed here · ' + monthYear(aDay);
      return ds;
    }
    // channel-anchored: replay the representative (most recent) match; verdict carries the distribution
    var dist = channelDist(state.style, pos, span);
    var repDay = dist.repIdx >= 0 ? S[dist.repIdx].d : Math.max(FIRST_D, LAST_D - span);
    var rPrice = function (d) { return realPriceAt(repDay + d); };
    ds = bandTriple(repDay, span);
    ds.push({ label: 'BTC price (actual history)', data: pricePath(rPrice, span, repDay), borderColor: REAL_C, borderWidth: 2.4, pointRadius: 0, tension: 0.2, fill: false, order: 1 });
    buyMarks = buyMarksFor(state.style, rPrice, repDay);
    // Name this one replay's own multiple on the marker, so a ~6× chart next to a
    // higher distribution median reads as "one entry vs. the set", not a contradiction.
    markLabel = 'You deployed here · ' + monthYear(repDay)
      + (dist.repIdx >= 0 ? ' (this path: ' + fmtMult(planMultiple(state.style, repDay, span)) + ')' : '');
    return ds;
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
        layout: { padding: { top: 24, right: 10 } },
        scales: {
          x: { type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, maxTicksLimit: 8, callback: function (v) { return yearOf(v); } } },
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
            callbacks: { title: function (it) { return it.length ? yearOf(it[0].parsed.x) : ''; }, label: function (it) { return it.dataset.label + ': ' + fmtUSD(it.parsed.y); } }
          }
        }
      },
      plugins: [markerPlugin]
    });
  }
  function updateChart() {
    if (!chart) { buildChart(); return; }
    var ds = chartDatasets(), yb = yBounds(ds);
    chart.data.datasets = ds; chart.options.scales.y.min = yb.min; chart.options.scales.y.max = yb.max;
    chart.update('none');
  }

  // ════════ FORMAT ════════
  function fmtUSD(v) {
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }
  function fmtMult(m) { return m == null ? '—' : (m >= 100 ? Math.round(m).toLocaleString() : m.toFixed(1)) + '×'; }
  var STYLE_NAME = { lump: 'Lump sum', ladder: 'Ladder in', hybrid: 'Hybrid' };

  // ════════ VERDICT ════════
  function updateVerdict() {
    var lead = document.getElementById('dpVerdictLead'), main = document.getElementById('dpVerdictMain'), detail = document.getElementById('dpVerdictDetail');
    if (!main) return;
    var pos = livePos(), span = state.horizon * YEAR_D, sel = state.style;

    if (state.view === 'projective') {
      lead.textContent = 'Projected · starting ' + posDisplay(pos) + ' · ' + state.horizon + '-year hold';
      var styles = ['lump', 'ladder', 'hybrid'], res = {};
      styles.forEach(function (s) {
        var ev = buyEvents(s);
        var tj = function (d) { return plPrice(todayD + d) * ratioOf(pos); };
        var rv = function (d) { return plPrice(todayD + d) * ratioOf(revertPos(pos, Math.min(1, d / span))); };
        var a = btcHeldAt(ev, tj, span) * tj(span) / state.sum, b = btcHeldAt(ev, rv, span) * rv(span) / state.sum;
        res[s] = { lo: Math.min(a, b), hi: Math.max(a, b) };
      });
      main.innerHTML = posRec(pos, sel, false);
      var r = res[sel];
      detail.innerHTML = styles.map(function (s) { return '<span' + (s === sel ? ' class="dp-row-sel"' : '') + '>' + STYLE_NAME[s] + ' <strong>' + fmtMult(res[s].lo) + '–' + fmtMult(res[s].hi) + '</strong></span>'; }).join(' &nbsp;·&nbsp; ')
        + '<br><span class="dp-sparse">' + fmtUSD(state.sum) + ' deployed → <strong>' + fmtUSD(r.lo * state.sum) + '–' + fmtUSD(r.hi * state.sum) + '</strong> after ' + state.horizon + ' years — the range spans reversion-to-trend and stay-on-trajectory. Extrapolations, not forecasts.</span>';
      return;
    }

    var anchor = effectiveAnchor();
    if (anchor === 'time') {
      var ta = {}, styles2 = ['lump', 'ladder', 'hybrid'];
      styles2.forEach(function (s) { ta[s] = timeAnchor(s, span); });
      var yrs = (ta[sel].hold / YEAR_D);
      lead.textContent = 'Time-anchored · deployed ' + yrs.toFixed(0) + ' years ago, from ' + monthYear(ta[sel].entryDay) + ' · held to today';
      main.innerHTML = 'If you&rsquo;d deployed your <strong>' + STYLE_NAME[sel].toLowerCase() + '</strong> ' + yrs.toFixed(0) + ' years ago and held to today, you&rsquo;d be at <strong>' + fmtMult(ta[sel].mult) + '</strong>. This is the &ldquo;what if I&rsquo;d simply started N years ago&rdquo; view — switch to <em>channel-anchored</em> for &ldquo;what tends to happen deploying from a position like today&rsquo;s.&rdquo;';
      detail.innerHTML = styles2.map(function (s) { return '<span' + (s === sel ? ' class="dp-row-sel"' : '') + '>' + STYLE_NAME[s] + ' <strong>' + fmtMult(ta[s].mult) + '</strong></span>'; }).join(' &nbsp;·&nbsp; ')
        + '<br><span class="dp-sparse">' + fmtUSD(state.sum) + ' → <strong>' + fmtUSD(ta[sel].mult * state.sum) + '</strong>. A single historical path, not a distribution.</span>';
      return;
    }

    // channel-anchored distribution
    var dist = channelDist(sel, pos, span);
    lead.textContent = 'Replayed from history · deploying near today&rsquo;s position (' + posDisplay(pos) + ') · ' + state.horizon + '-year hold';
    if (dist.n < 4) {
      main.innerHTML = 'Bitcoin has rarely sat near today&rsquo;s position with ' + state.horizon + ' years of modern history (2013 onward) to follow — too few analogues to read.'
        + (dist.early.n ? ' The closest earlier matches sit in the pre-2013 sub-$15 curiosity era, set aside as unreplicable.' : '')
        + ' Switch to the <em>time-anchored</em> view.';
      detail.innerHTML = '';
      return;
    }
    main.innerHTML = posRec(pos, sel, true) + ' <span class="dp-pasttense">You bought at ' + ratioOf(pos).toFixed(2) + '× trend.</span>';
    var styles3 = ['lump', 'ladder', 'hybrid'], dl = {};
    styles3.forEach(function (s) { dl[s] = channelDist(s, pos, span); });
    var thin = dist.years < SUFFICIENT_YEARS;
    var repMY = monthYear(S[dist.repIdx].d), repMult = planMultiple(sel, S[dist.repIdx].d, span), early = dist.early;
    detail.innerHTML = styles3.map(function (s) { return '<span' + (s === sel ? ' class="dp-row-sel"' : '') + '>' + STYLE_NAME[s] + ' <strong>' + fmtMult(dl[s].median) + '</strong></span>'; }).join(' &nbsp;·&nbsp; ')
      + '<br><span class="dp-sparse">Across <strong>' + dist.n + '</strong> historical entries in <strong>' + dist.years + '</strong> distinct years (2013 onward) where price sat near today&rsquo;s position, deploying ' + STYLE_NAME[sel].toLowerCase() + ' and holding ' + state.horizon + ' years returned a <strong>median ' + fmtMult(dist.median) + '</strong> (typical range ' + fmtMult(dist.lo) + '–' + fmtMult(dist.hi) + '). The chart replays just one of those — the most recent, <strong>' + repMY + ' → ' + fmtMult(repMult) + '</strong> — so a single path can land well below the median of all ' + dist.n + '.'
      + (thin ? ' <em>Small sample — these come from only ' + dist.years + ' distinct years; treat as illustrative, not statistical.</em>' : '') + '</span>'
      + (early.n ? '<br><span class="dp-earlyera">Set aside: Bitcoin&rsquo;s sub-$15 curiosity era (2009–2012), when prices were too small to represent a return any buyer today could replicate. Counting its ' + early.n + ' earlier ' + (early.n === 1 ? 'match' : 'matches') + ' back in would lift the headline median to <strong>' + fmtMult(early.fullMedian) + '</strong> and stretch the range past <strong>' + fmtMult(early.fullHi) + '</strong>. Shown and marked here, never in the headline.</span>' : '');
  }

  // shared position-keyed recommendation, three-zone (item 12), tense-aware
  // (past for the retrospective replay — item 11; present/future for projective)
  function posRec(pos, sel, past) {
    var was = past ? 'was' : 'is', tend = past ? 'tended to come out ahead' : 'tends to come out ahead';
    var sn = STYLE_NAME[sel].toLowerCase();
    if (pos < 0.33) return 'With price <em>' + posLabel(pos) + '</em>, deploying decisively ' + tend + ' — ' + (past ? 'you bought below trend' : 'you&rsquo;re buying below trend') + '. '
      + (sel === 'lump' ? 'A <strong>lump</strong> ' + (past ? 'captured' : 'captures') + ' that edge in full.' : 'A <strong>' + sn + '</strong> ' + (past ? 'gave up' : 'gives up') + ' a little of that edge for the comfort of not deploying all at once.');
    if (pos < 0.66) return 'With price <em>' + posLabel(pos) + '</em>, it ' + was + ' close to a coin-flip — <strong>commitment ' + (past ? 'mattered' : 'matters') + ' more than the tactic</strong>. A ' + (sel === 'hybrid' ? 'hybrid' : sel) + ' is a reasonable call; the spread between styles is small.';
    if (pos < UPPER_RISK) return 'With price <em>' + posLabel(pos) + '</em>, the lump-sum edge thins and a <span class="dp-hedge">hybrid or ladder</span> ' + (past ? 'looked' : 'looks') + ' more attractive as a hedge.';
    return 'With price <span class="dp-hedge">' + posLabel(pos) + '</span>, a lump buys into the mean-reversion the channel predicts — <strong>this is where laddering&rsquo;s hedge earns its keep</strong>. Treat it as a <a href="#cautions">drawdown hedge, not a reliable edge</a>: the rising channel means even the hedge isn&rsquo;t guaranteed to pay.';
  }

  // ════════ LIVE READOUT + three-zone risk flag (rule #2; items 3 + 12) ════════
  function renderLive(price, source) {
    liveTodayPrice = price; liveTodayPos = posOf(price, TODAY_DAYS);
    var ratio = price / plPrice(TODAY_DAYS);
    // auto-prefer time-anchored on first load if the channel band is too thin here
    if (!anchorUserSet) {
      var d0 = channelDist(state.style, liveTodayPos, state.horizon * YEAR_D);
      state.anchor = (liveTodayPos >= UPPER_RISK && d0.years < SUFFICIENT_YEARS) ? 'time' : 'channel';
      syncAnchorUI();
    }
    var posEl = document.getElementById('dpLivePos'), recEl = document.getElementById('dpLiveRec'), metaEl = document.getElementById('dpLiveMeta');
    if (posEl) posEl.innerHTML = '<strong>' + ratio.toFixed(2) + '×</strong> trend · ' + posLabel(liveTodayPos);
    if (recEl) {
      var rec;
      if (liveTodayPos < 0.33) rec = 'the model leans <b>deploy decisively</b> — spreading mostly means paying more as price reverts up toward trend.';
      else if (liveTodayPos < 0.66) rec = 'this is close to a <b>coin-flip</b> — pick the style you can hold through; commitment matters more than the tactic.';
      else if (liveTodayPos < UPPER_RISK) rec = 'the lump-sum edge is thinning; a <b>hybrid or ladder</b> starts to look more attractive as a hedge.';
      else rec = 'a <b>hybrid or ladder</b> is the more defensible call as a drawdown hedge against the reversion the channel predicts — read the cautions, it&rsquo;s softer than it sounds.';
      recEl.innerHTML = 'With price ' + posLabel(liveTodayPos) + ', ' + rec;
    }
    if (metaEl) metaEl.textContent = 'Live: ' + fmtUSD(price) + ' · ' + ratio.toFixed(2) + '× trend' + (source === 'live' ? '' : ' (latest sample)') + ' · recomputed every load.';
    updateRiskFlag();
    updateChart(); updateVerdict();
    renderTables();   // today-anchored backstop recomputes with the live exit price (2E-A1)
  }
  function updateRiskFlag() {
    var el = document.getElementById('dpRisk'); if (!el) return;
    var pos = livePos();
    if (pos < UPPER_RISK) { el.hidden = true; return; }
    var dist = channelDist(state.style, pos, state.horizon * YEAR_D), thin = dist.years < SUFFICIENT_YEARS;
    el.hidden = false;
    el.innerHTML = '<span class="dp-risk-tag">High-risk zone for lump deployment</span> '
      + 'At today&rsquo;s position a lump buys into the mean-reversion the channel predicts — this is where laddering&rsquo;s hedge earns its keep. Frame it honestly as a <strong>drawdown hedge, not a reliable edge</strong>: the rising channel means even the hedge isn&rsquo;t guaranteed to pay.'
      + (thin ? ' <span class="dp-risk-thin">Channel-anchored history is thin up here — only ~' + dist.years + ' distinct years, clustered into a handful of brief blow-off tops. The replay below leads with the time-anchored view; treat the channel analogues as illustrative.</span>' : '');
  }

  // ════════ COMMITMENT BACKSTOP + COMPRESSION (live; softened per item 9) ════════
  var HOLDS = [2, 4, 6, 8];
  function bucketName(pos) { return pos < 0.33 ? 'lower' : (pos < 0.66 ? 'mid' : 'upper'); }
  function nearestIdx(t) { var b = 0, bd = Infinity; for (var j = 0; j < N; j++) { var dd = Math.abs(S[j].d - t); if (dd < bd) { bd = dd; b = j; } } return b; }
  // Today-anchored commitment backstop (Stage 2E-A1): for each hold length N, entries
  // deployed ~N years ago (a ~1.8yr window centred N years before today), bucketed by
  // channel position, valued at TODAY's live price ÷ entry price — what each would be
  // worth now. Recomputes live. The 2013 early-era cut is intentionally NOT applied here
  // (the today-anchor already excludes the ancient cycle-peak exits the cut suppressed);
  // the cut still applies to the channel-anchored distribution / verdict (channelDist).
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
  function compression() { var W = [[2011, 2014], [2015, 2018], [2019, 2022], [2023, 2026]], out = []; for (var w = 0; w < W.length; w++) { var mx = -Infinity; for (var i = 0; i < N; i++) if (S[i].yr >= W[w][0] && S[i].yr <= W[w][1]) mx = Math.max(mx, S[i].pos); if (mx > -Infinity) out.push({ label: W[w][0] + '–' + W[w][1], max: mx }); } return out; }
  function renderTables() {
    var bs = backstop(), tb = document.getElementById('dpBackstopBody');
    if (tb) { var rows = [['lower', 'Lower channel'], ['mid', 'Mid-channel'], ['upper', 'Upper channel']], html = ''; for (var r = 0; r < rows.length; r++) { html += '<tr class="dp-row-' + rows[r][0] + '"><th>' + rows[r][1] + '</th>'; for (var h = 0; h < HOLDS.length; h++) { var v = bs[rows[r][0]][HOLDS[h]]; html += '<td' + (h === HOLDS.length - 1 ? ' class="dp-strong"' : '') + '>' + fmtMult(v) + '</td>'; } html += '</tr>'; } tb.innerHTML = html; }
    var tk = document.getElementById('dpBackstopTakeaway');
    if (tk) {
      var H = state.horizon, up = bs.upper[H];
      var lead = (up != null)
        ? 'Even <strong>upper-channel</strong> entries — the worst-timed buys — deployed <strong>' + H + ' years ago</strong> and held to today still returned about <strong>' + fmtMult(up) + '</strong> on average. '
        : 'Bitcoin hasn&rsquo;t sat high in the channel within the last <strong>' + H + ' years</strong>, so there are no upper-channel entries that recent to show — but over longer holds even the worst-timed buys have recovered to today. ';
      tk.innerHTML = lead + 'That is a multi-year tendency, <em>not</em> a guarantee: over short horizons entries have frequently sat underwater — including now (price has been below the Power Law trend about 58% of the time, above it about 42%). Recovery has historically come with time held, not on demand.';
    }
    var cp = compression(), cb = document.getElementById('dpCompressionBody');
    if (cb) { var ch = ''; for (var i = 0; i < cp.length; i++) ch += '<tr><th>' + cp[i].label + '</th><td class="dp-strong">' + cp[i].max.toFixed(2) + '</td></tr>'; cb.innerHTML = ch; }
    var mw = document.getElementById('dpMethodWindow');
    if (mw) mw.innerHTML = '<code>PL_DATA</code> window: ' + monthYear(S[0].d) + ' – ' + monthYear(S[N - 1].d) + ' (' + N + ' samples, ~12-day spacing).';
  }

  // ════════ CONTROLS ════════
  function syncStyleUI() {
    document.body.setAttribute('data-dp-style', state.style);
    var durRow = document.getElementById('dpDurRow'), frontRow = document.getElementById('dpFrontRow');
    if (durRow) durRow.style.display = (state.style === 'lump') ? 'none' : '';
    if (frontRow) frontRow.style.display = (state.style === 'hybrid') ? '' : 'none';
    var durLabel = document.getElementById('dpDurLabelText');
    if (durLabel) durLabel.textContent = (state.style === 'hybrid') ? 'Blend the rest over' : 'Ladder over';
  }
  function syncAnchorUI() {
    document.querySelectorAll('.dp-anchor button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-anchor') === state.anchor); });
  }
  function wire() {
    var sum = document.getElementById('dpSum'), sumVal = document.getElementById('dpSumVal');
    if (sum) sum.addEventListener('input', function () { state.sum = parseInt(this.value, 10); if (sumVal) sumVal.textContent = fmtUSD(state.sum); updateChart(); updateVerdict(); });

    document.querySelectorAll('.dp-style button').forEach(function (btn) {
      btn.addEventListener('click', function () { state.style = btn.getAttribute('data-style'); document.querySelectorAll('.dp-style button').forEach(function (b) { b.classList.toggle('active', b === btn); }); syncStyleUI(); updateRiskFlag(); updateChart(); updateVerdict(); });
    });

    var dur = document.getElementById('dpDur'), durVal = document.getElementById('dpDurVal');
    if (dur) dur.addEventListener('input', function () { state.durMonths = parseInt(this.value, 10); if (durVal) durVal.textContent = state.durMonths >= 12 && state.durMonths % 12 === 0 ? (state.durMonths / 12) + (state.durMonths === 12 ? ' yr' : ' yrs') : state.durMonths + ' mo'; updateChart(); updateVerdict(); });

    var front = document.getElementById('dpFront'), frontVal = document.getElementById('dpFrontVal');
    if (front) front.addEventListener('input', function () { state.front = parseInt(this.value, 10); if (frontVal) frontVal.textContent = state.front + '% now'; updateChart(); updateVerdict(); });

    var hz = document.getElementById('dpHorizon'), hzVal = document.getElementById('dpHorizonVal');
    if (hz) hz.addEventListener('input', function () { state.horizon = parseInt(this.value, 10); if (hzVal) hzVal.textContent = state.horizon + ' yrs'; updateRiskFlag(); updateChart(); updateVerdict(); renderTables(); });

    document.querySelectorAll('.dp-view button').forEach(function (btn) {
      btn.addEventListener('click', function () { state.view = btn.getAttribute('data-view'); document.querySelectorAll('.dp-view button').forEach(function (b) { b.classList.toggle('active', b === btn); }); document.body.setAttribute('data-dp-view', state.view); updateChart(); updateVerdict(); });
    });
    document.querySelectorAll('.dp-anchor button').forEach(function (btn) {
      btn.addEventListener('click', function () { anchorUserSet = true; state.anchor = btn.getAttribute('data-anchor'); syncAnchorUI(); updateChart(); updateVerdict(); });
    });
  }

  // ════════ INIT ════════
  function init() {
    document.body.setAttribute('data-dp-view', state.view);
    syncStyleUI(); syncAnchorUI();
    buildChart(); wire(); renderTables();
    renderLive(TODAY_PRICE, 'seed');
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (price, source) { renderLive(price, source); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
