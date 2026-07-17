/* =============================================================
   How Much Cash? — page script (v3.1: WODN's interaction grammar)

   The question: what share of a stack to hold as cash, and where in the
   channel raising it has historically meant MORE bitcoin, not less.

   THE MODEL IS WODN'S, POINTED AT THE SELL SIDE. This page is Wait-or-Deploy's
   mirror twin — a cash holder asks "deploy or wait?", an all-in holder asks
   "hold or raise?" — same record, opposite doors. So it reads the record
   through shared/channel-entries.js, the module WODN's own machinery was
   extracted into. Nothing here re-derives the neighborhood method: if this
   page and WODN ever printed different hit rates for one position, one of
   them would be lying.

   v3.1 (JM production review, round 2) — THE INTERACTION now matches WODN too.
   The undiscoverable drag-the-marker-on-canvas is retired (removed, not hidden).
   In its place, WODN's actual components, lifted (hc- prefixed, hc token names;
   the site's convention is per-page CSS/JS, so a shared partial would fight the
   grain — the shared MATH already lives in channel-entries.js):
     • the horizontal position slider, ▲ TODAY tick, zone labels, snap-to-today;
     • the dashed selected-position line on the channel chart;
     • the blue neighbourhood-entry dots (WODN's selDotPlugin, verbatim shape);
     • the verdict card row (WODN's card grammar, HMC's quantities).
   `pos` is now a CHANNEL POSITION (0–1 coord), like WODN's slider state — not
   the v3 marker-day. Two representations, one state: slider ⇄ dashed line.

   SINGLE SOURCE (the screenshot-6 lesson). EVERY displayed number — the three
   cards, the insight-chart curve/highlight/pulse, audit rows, CSV — comes from
   one compute(state) call per render. hcQA() reads the DOM back and compares it
   to compute()'s own return, so a second source of truth fails QA.

   THE OUTCOME IDENTITY (hand-checkable, asserted by hcQA):
     sell fraction x of stack C at price P, tax t, rebuy at P_rebuy
     net cash          = x·C·P·(1−t)                (zero-basis assumption)
     coins back        = netCash / P_rebuy
     end coins         = (1−x)·C + x·C·(1−t)·(P/P_rebuy)
     round-trip mult   = (1−t)·(P/P_rebuy)     ← the insight chart's Y, Card C
     breakeven         = rebuy below P·(1−t), i.e. ratio > 1/(1−t)
   P/P_rebuy is WODN's `ratio` exactly. The stack C cancels out of every
   reported figure; the BTC input is orientation only.
   ============================================================= */
(function () {
  'use strict';
  if (typeof plPrice !== 'function' || typeof PL_DATA === 'undefined') return;
  if (!window.ChannelEntries) return;

  var CE = window.ChannelEntries;
  var posOf = CE.posOf, ratioOf = CE.ratioOf, bandMetrics = CE.bandMetrics;
  var median = CE.median, monthYear = CE.monthYear;
  var S = CE.S, N = CE.N, todayD = CE.todayD, YEAR_D = CE.YEAR_D, MONTH_D = CE.MONTH_D;
  var FIRST_D = CE.FIRST_D, TABLE_CUT = CE.TABLE_CUT, DROP = CE.DROP;

  // ── Palette ──
  var FLOOR_C = '#b04525', TREND_C = '#e09422', UPPER_C = '#e8c820';
  var HIST_C = 'rgba(232,224,210,0.55)', SEL_C = '#6db3d4';
  var GAIN_C = '#6fae6f', LOSS_C = '#c0392b', REBUY_C = '#6fae6f';   // rebuy-target line: green, distinct from the blue sell line
  var MUTED = '#7a7367', DIM = '#9a9080';

  var ZONE_MULT = 0.60;
  var ALARM_AT = 80;              // past this the cash share stops being a buffer
  var MARKER_MIN = TABLE_CUT;     // the model's entries start post-2014; the chart matches

  // ── Position-slider machinery (lifted from WODN) ──
  // The slider spans slightly BELOW the floor (so today's sub-floor ~0.40× is reachable
  // and the "today" marker sits at its true position) up to the upper band. The reader-
  // facing label always shows the TRUE position; entry-matching clamps sub-floor to the
  // floor INTERNALLY only (stability), never leaking into what the reader sees.
  var POS_MIN = -0.08, POS_MAX = 1.0, POS_RANGE = POS_MAX - POS_MIN;
  function clampPos(p) { return Math.max(POS_MIN, Math.min(POS_MAX, p)); }
  function sliderToPos(v) { return POS_MIN + (v / 1000) * POS_RANGE; }
  function posToSlider(p) { return Math.round((clampPos(p) - POS_MIN) / POS_RANGE * 1000); }
  function matchPos(p) { return Math.max(0, p); }   // internal entry-match clamp (display untouched)

  var _spot = TODAY_PRICE, _priceSource = 'seed';
  function spot() { return _spot; }
  function livePos() { return posOf(spot(), todayD); }         // today's TRUE channel position

  var DEFAULTS = { share: 25, tax: 15, pos: null, stack: null, rebuy: null };  // rebuy: null = at the cap (WODN default)
  var S_ = { share: 25, tax: 15, pos: null, stack: null, rebuy: null };
  function curPos() { return (S_.pos == null) ? livePos() : clampPos(S_.pos); }

  // ── v3.3 rebuy target (slider 2). null = AT THE CAP = your sale = WODN's first-lower-entry
  // rule (the identity case); a number = a fixed channel-position target BELOW the sale. ──
  var REBUY_EPS = 0.004;                                        // ≈ one slider notch
  function atCap(rebuy, sellPos) { return rebuy == null || rebuy >= sellPos - REBUY_EPS; }
  function engineTarget(rebuy, sellPos) { return atCap(rebuy, sellPos) ? undefined : rebuy; }   // undefined → WODN rule
  // v3.7: at the cap the target docks ONTO the sale (was sellPos−DROP) — the green line rides the
  // sale line, dimmed, narrating "at your sale, the rule is simply any lower entry" (display only).
  function rebuyLinePos(rebuy, sellPos) { return atCap(rebuy, sellPos) ? sellPos : Math.min(rebuy, sellPos); }

  // ── Sticky instrument state — the site's first per-page ACTIVE-state persistence
  // (STYLE_GUIDE §6.37; §3.5 keeps sitewide ASSUMPTIONS separate). Precedence URL > store >
  // defaults; the store holds only a NON-default state, so Reset (→ defaults) removes the key. ──
  var STORE_KEY = 'lcs.how-much-cash.state';
  function readStore() { try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; } }
  function writeStore(v) { try { localStorage.setItem(STORE_KEY, v); } catch (e) {} }
  function clearStore() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} }
  function isDefaultState() {
    for (var k in DEFAULTS) if (DEFAULTS.hasOwnProperty(k) && S_[k] !== DEFAULTS[k]) return false;
    return true;
  }
  function saveState() {
    if (isDefaultState()) { clearStore(); return; }   // at defaults → no key (fresh + post-Reset both clean)
    writeStore(JSON.stringify({ share: S_.share, tax: S_.tax, pos: S_.pos, rebuy: S_.rebuy, stack: S_.stack }));
  }
  function loadStore() {
    var raw = readStore(); if (!raw) return;
    var o; try { o = JSON.parse(raw); } catch (e) { return; }
    if (!o || typeof o !== 'object') return;
    if (isFinite(o.share)) S_.share = clamp(o.share, 0, 100);
    if ([0, 15, 20].indexOf(o.tax) >= 0) S_.tax = o.tax;
    if (o.pos == null) S_.pos = null; else if (isFinite(o.pos) && o.pos >= POS_MIN - 0.001 && o.pos <= POS_MAX + 0.001) S_.pos = clampPos(o.pos);
    if (o.rebuy == null) S_.rebuy = null; else if (isFinite(o.rebuy) && o.rebuy >= POS_MIN - 0.001 && o.rebuy <= POS_MAX + 0.001) S_.rebuy = o.rebuy;
    if (o.stack == null) S_.stack = null; else if (isFinite(o.stack) && o.stack > 0) S_.stack = o.stack;
  }

  // ── Format ──
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function pct0(v) { return Math.round(v) + '%'; }
  function mult(v) { return v.toFixed(2) + '×'; }
  function usdFull(v) { return '$' + Math.round(v).toLocaleString(); }
  function usd(v) { var a = Math.abs(v); if (a >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M'; if (a >= 1e3) return '$' + Math.round(v / 1e3) + 'K'; return '$' + Math.round(v); }  // compact, for the cash composition
  function btc(v) { return (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(3)) + ' BTC'; }
  function stackFmt(v) { return (+v.toFixed(v >= 100 ? 1 : 2)).toString(); }   // "11.6", "10", "1.5"
  function fmtWait(days) {
    if (days == null) return '—';
    if (days < 1.5 * YEAR_D) return Math.max(1, Math.round(days / MONTH_D)) + ' months';
    return (days / YEAR_D).toFixed(1) + ' years';
  }

  // Zone-time base rate (survives from v2; historical fact, counted live).
  var zoneTime = (function () {
    var n = 0;
    for (var i = 0; i < N; i++) if (S[i].p / plPrice(S[i].d) <= ZONE_MULT) n++;
    return { pct: 100 * n / N, n: n, total: N };
  })();

  // ════════ THE ONE COMPUTATION ════════
  // Every displayed quantity on this page comes from here. Position-first now
  // (WODN's model): a channel position in, a representative dollar price derived
  // from TODAY's trend so the abstract position still reads in dollars for the
  // stack orientation. At the today position, P is the live spot exactly.
  function compute(st) {
    st = st || S_;
    var trend = plPrice(todayD);
    var isToday = (st.pos == null);
    var pos = isToday ? livePos() : clampPos(st.pos);
    var P = isToday ? spot() : ratioOf(pos) * trend;   // == spot at the today position
    var mlt = P / trend;                               // == ratioOf(pos)
    var eng = engineTarget(st.rebuy, pos);             // undefined at the cap (WODN rule), else the numeric target
    var m = bandMetrics(matchPos(pos), eng);           // ← WODN's machinery + v3.3 continuous rebuy target
    var t = st.tax / 100, x = st.share / 100;
    var isCap = atCap(st.rebuy, pos), rbTargetPos = rebuyLinePos(st.rebuy, pos);

    if (!m) return { pos: pos, P: P, trend: trend, mult: mlt, isToday: isToday, m: null, t: t, x: x, tax: st.tax, share: st.share, stack: st.stack, rebuy: st.rebuy, atCap: isCap, rebuyTargetPos: rbTargetPos };

    // Per-entry after-tax outcome. ratio is WODN's P/P_rebuy exactly.
    var outcomes = m.metrics.map(function (e) {
      return {
        i: e.i, d0: e.d0, p0: e.p0, P: e.P, arrived: e.arrived,
        waitDay: e.waitDay, waitPrice: e.waitPrice, ratio: e.ratio,
        disc: 1 - 1 / e.ratio,                    // rebuy discount vs entry
        rt: (1 - t) * e.ratio,                    // round-trip multiple on the sold fraction
        end: (1 - x) + x * (1 - t) * e.ratio      // end coins as a multiple of the stack
      };
    });

    var medianRatio = m.ratio;                                  // median P/P_rebuy, ALL entries
    var medianRT = (1 - t) * medianRatio;                       // median round-trip multiple
    var hit = m.paid;                                           // % where a lower PRICE arrived (WODN's headline)
    var hitAfterTax = outcomes.filter(function (o) { return o.rt > 1; }).length / outcomes.length * 100;
    var medianEnd = median(outcomes.map(function (o) { return o.end; }));
    var endSharePct = x * medianRT * 100;                       // what the sold slice became
    var medianDisc = m.condRatio != null ? (1 - 1 / m.condRatio) * 100 : null;
    var breakevenDisc = t * 100;                                // rebuy must be >t% lower
    var arrivalPct = 100 - m.never;                             // % where the target arrived within 2y
    // Whole-stack outcome: C·(1 + x·(medianRT − 1)) = the coins you end with after the round trip.
    var hasStack = (st.stack != null && isFinite(st.stack) && st.stack > 0);
    var newStack = hasStack ? st.stack * (1 + x * (medianRT - 1)) : null;
    var cardCVal = hasStack ? newStack : medianRT;             // the ONE number Card C displays

    // v3.5 §1: the branch decomposition — likelihood ÷ impact. Card A/C are the UNCONDITIONAL
    // blend; these split it into the two branches, each median computed from its OWN subset (the
    // subsets partition the neighborhood exactly — hcQA asserts this; medians don't decompose
    // arithmetically like means).
    var arrivedO = outcomes.filter(function (o) { return o.arrived; });
    var noArrO = outcomes.filter(function (o) { return !o.arrived; });
    var arrivedRT = arrivedO.length ? median(arrivedO.map(function (o) { return o.rt; })) : null;      // m₁
    var noArriveRT = noArrO.length ? median(noArrO.map(function (o) { return o.rt; })) : null;         // m₀
    var noArriveRatio = noArrO.length ? median(noArrO.map(function (o) { return o.ratio; })) : null;   // pre-tax: rebuy above/below sale
    var arriveA = (hasStack && arrivedRT != null) ? st.stack * (1 + x * (arrivedRT - 1)) : null;       // A₁
    var noArriveA = (hasStack && noArriveRT != null) ? st.stack * (1 + x * (noArriveRT - 1)) : null;   // A₀ = the marked total
    // §4: the no-arrival branch is a VALUATION MARK, not a modeled trade — decompose the held
    // position into kept bitcoin + cash marked to bitcoin at the two-year price. noArriveA already
    // equals keptBTC + soldBTC·m₀; this exposes the pieces so the composition can render/reconcile.
    var keptBTC = hasStack ? st.stack * (1 - x) : null;
    var soldBTC = hasStack ? st.stack * x : null;
    var cashRaised = hasStack ? soldBTC * P * (1 - t) : null;

    return {
      pos: pos, P: P, trend: trend, mult: mlt, isToday: isToday,
      m: m, t: t, x: x, tax: st.tax, share: st.share, stack: st.stack,
      rebuy: st.rebuy, atCap: isCap, rebuyTargetPos: rbTargetPos, eng: eng,
      n: m.n, half: m.half,
      // Every quantity the page DISPLAYS is a named field here (screenshot-6 discipline).
      hit: hit, missPct: 100 - hit, hitAfterTax: hitAfterTax, never: m.never,
      arrivalPct: arrivalPct, hasStack: hasStack, newStack: newStack, cardCVal: cardCVal,
      arrivedRT: arrivedRT, noArriveRT: noArriveRT, noArriveRatio: noArriveRatio, arriveA: arriveA, noArriveA: noArriveA,
      keptBTC: keptBTC, soldBTC: soldBTC, cashRaised: cashRaised,
      nArrived: arrivedO.length, nNoArrive: noArrO.length,
      medianRatio: medianRatio, medianRT: medianRT, condRatio: m.condRatio,
      medianDisc: medianDisc, medianDiscAbs: (medianDisc == null ? null : Math.abs(medianDisc)),
      breakevenDisc: breakevenDisc,
      typicalWait: m.waitLen, medianEnd: medianEnd, endSharePct: endSharePct,
      outcomes: outcomes,
      alarm: st.share > ALARM_AT,
      // branch is decided ONCE, here — not re-derived in the renderer
      branch: (m.never >= 90 || hit <= 10) ? 'floor'
            : (Math.abs(medianRT - 1) <= 0.03) ? 'wash'
            : (medianRT > 1) ? 'pays' : 'costs'
    };
  }

  // The insight chart's curve — same compute() shape, swept across position.
  // Depends ONLY on the tax rate (not the share or the position), so the
  // expensive neighborhood sweep is cached and the tax applied on top.
  // The curve sweeps sell position under the CURRENT tax AND rebuy target. The target is
  // either the per-position WODN rule (at the cap → engine target undefined) or a FIXED
  // numeric position; the engine caps it per position via min(target, entryP), so the
  // effective target at each x is min(target, x) — you can't rebuy above a sale (§4).
  var _rawCurve = {};                 // cached per rebuy-state key (still tax-free; tax on top)
  function curveKey(c) { return c.atCap ? 'cap' : ('t' + c.eng.toFixed(3)); }
  function rawCurve(c) {
    var key = curveKey(c), eng = c.atCap ? undefined : c.eng;
    if (_rawCurve[key]) return _rawCurve[key];
    var pts = [], p;
    for (p = -0.05; p <= 1.001; p += 0.025) {
      var m = bandMetrics(matchPos(p), eng);           // matchPos → markers seat exactly on the line
      if (!m || m.ratio == null) continue;
      pts.push({ x: p, ratio: m.ratio, n: m.n });
    }
    _rawCurve[key] = pts;
    return pts;
  }
  // The curve's y at any x, under c's tax + rebuy target — used to seat the glow/blue markers
  // exactly ON the curve (§4 glow-fix; asserted in hcQA).
  function curveYAt(x, c) {
    var m = bandMetrics(matchPos(x), c.atCap ? undefined : c.eng);
    return (m && m.ratio != null) ? (1 - c.tax / 100) * m.ratio : null;
  }
  // §1 v3.4: slider 1's track is DATA-derived — colored by the insight curve's own outcome
  // (loses-bitcoin red / earns green), transitioning at the SAME breakeven crossing the chart
  // draws (chart.$cross). Recomputes with tax + rebuy target; the sell zone shrinks as tax
  // rises. hcQA asserts the gradient's crossing == the chart's. Slider 2 stays price-colored
  // (static cheapness gradient, in CSS) — outcome vs description, kept apart (§39).
  function sellGradientCss(cross, c) {
    var RED = 'rgba(192,57,43,0.30)', RED_E = 'rgba(192,57,43,0.34)';
    var GRN = 'rgba(111,174,111,0.28)', GRN_E = 'rgba(111,174,111,0.32)';
    if (cross == null) {                          // no crossing in view — one region; sample the sign
      var y = curveYAt(0.6, c), up = (y != null && y >= 1);
      return 'linear-gradient(90deg, ' + (up ? GRN_E : RED_E) + ' 0%, ' + (up ? GRN : RED) + ' 100%)';
    }
    var pct = Math.max(0, Math.min(100, (clampPos(cross) - POS_MIN) / POS_RANGE * 100));
    return 'linear-gradient(90deg, ' + RED_E + ' 0%, ' + RED + ' ' + Math.max(0, pct - 3).toFixed(1) + '%, ' +
      GRN + ' ' + Math.min(100, pct + 3).toFixed(1) + '%, ' + GRN_E + ' 100%)';
  }
  function renderSellGradient(c) {
    var sl = document.getElementById('hcPosSlider'); if (!sl || !chart) return;
    var cross = chart.$cross;                      // the SAME crossing the insight chart plots (one computation)
    sl.$gradCross = (cross == null ? null : cross); // stashed for the QA crossing-identity assertion
    sl.style.background = sellGradientCss(cross, c);
  }
  // v3.7: slider 2's track — price-colored cheapness gradient LEFT of the ▼ sale tick; beyond the
  // tick (at/above the sale) it goes inert/desaturated, so the region reads "at your sale = the rule".
  function rebuyTrackGradient(sellPos) {
    var tickPct = Math.max(0, Math.min(100, (clampPos(sellPos) - POS_MIN) / POS_RANGE * 100));
    var GREEN = 'rgba(96,164,150,0.42)', GREEN_FADE = 'rgba(96,164,150,0.15)', INERT = 'rgba(122,115,103,0.12)';
    return 'linear-gradient(90deg, ' + GREEN + ' 0%, ' + GREEN_FADE + ' ' + Math.max(0, tickPct - 4).toFixed(1) + '%, ' +
      INERT + ' ' + tickPct.toFixed(1) + '%, ' + INERT + ' 100%)';
  }
  function renderRebuyTrack() {
    var sl = document.getElementById('hcRebuySlider'); if (!sl) return;
    sl.style.background = rebuyTrackGradient(curPos());
  }
  // Breakeven crossing: first position where the median round trip clears 1.0.
  function crossingOf(pts) {
    for (var i = 1; i < pts.length; i++) {
      if (pts[i - 1].y < 1 && pts[i].y >= 1) {
        var a = pts[i - 1], b = pts[i], f = (1 - a.y) / (b.y - a.y);
        return a.x + f * (b.x - a.x);
      }
    }
    return null;
  }

  // ════════ QA — single-source assertion ════════
  function num(id) {
    var e = document.getElementById(id);
    if (!e) return null;
    var m = (e.textContent || '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
  }
  function hcQA(st) {
    st = st || S_;
    var c = compute(st);
    if (!c.m) return { ok: false, why: 'no neighborhood at this position' };

    // (a) the identity, per entry
    var idBad = c.outcomes.filter(function (o) {
      var wantRT = (1 - c.t) * o.ratio;
      var wantEnd = (1 - c.x) + c.x * wantRT;
      return Math.abs(o.rt - wantRT) > 1e-12 || Math.abs(o.end - wantEnd) > 1e-12;
    });

    // (a2) v3.5 §1: the branch subsets partition the neighborhood exactly, and each branch median
    // is the median of its OWN subset. Medians don't decompose arithmetically like means — this
    // subset-partition check is the correct assertion, not H·m₁+(1−H)·m₀ ≈ blend.
    var _arr = c.outcomes.filter(function (o) { return o.arrived; }), _nar = c.outcomes.filter(function (o) { return !o.arrived; });
    var branchPartitionOk = (_arr.length + _nar.length === c.outcomes.length) && (c.nArrived === _arr.length) && (c.nNoArrive === _nar.length);
    var _m1 = _arr.length ? median(_arr.map(function (o) { return o.rt; })) : null;
    var _m0 = _nar.length ? median(_nar.map(function (o) { return o.rt; })) : null;
    var branchMediansOk = (_m1 === c.arrivedRT && _m0 === c.noArriveRT);

    // (a3) §4: the no-arrival composition reconciles — kept bitcoin + the cash marked to bitcoin at
    // the two-year price ≈ the marked total (noArriveA). twoYrPrice is the representative implied by m₀.
    var compositionOk = true;
    if (c.hasStack && c.noArriveRT != null && c.noArriveRT > 0) {
      var _twoYr = c.P * (1 - c.t) / c.noArriveRT;
      var _recon = c.keptBTC + c.cashRaised / _twoYr;
      compositionOk = Math.abs(_recon - c.noArriveA) <= Math.max(0.01, Math.abs(c.noArriveA) * 0.005);
    }

    // (b) the DOM must agree with compute() — one source. Each element is checked
    // against the compute() field it is BOUND to; absent elements (branch-specific,
    // e.g. hcMiss only in the floor card) are skipped.
    var live = (st === S_), mism = [], dom = {};
    if (live) {
      var cardCTol = c.hasStack ? (Math.abs(c.cardCVal) >= 100 ? 0.06 : 0.011) : 0.006;
      var bindings = [
        { id: 'hcCardA',       field: 'hitAfterTax',  round: true },
        { id: 'hcMiss',        field: 'missPct',      round: true },
        { id: 'hcCardBArrival', field: 'arrivalPct',  round: true },
        { id: 'hcCardBDisc',   field: 'medianDiscAbs', round: true },   // footer, |discount|
        { id: 'hcCardCValN',   field: 'cardCVal',     tol: cardCTol },   // round-trip × OR new-stack BTC
        { id: 'hcBranchArriveMult',   field: 'arrivedRT',  tol: 0.006 },  // v3.5 branch strip
        { id: 'hcBranchNoArriveMult', field: 'noArriveRT', tol: 0.006 },
        { id: 'hcBranchArriveBtc',    field: 'arriveA',    tol: 0.06 },
        { id: 'hcBranchNoArriveBtc',  field: 'noArriveA',  tol: 0.06 }
      ];
      bindings.forEach(function (b) {
        var shown = num(b.id);
        if (shown == null || c[b.field] == null) return;
        dom[b.id] = shown;
        var want = b.round ? Math.round(c[b.field]) : c[b.field];
        var tol = b.tol != null ? b.tol : 0.51;
        if (Math.abs(shown - want) > tol) mism.push({ f: b.id, dom: shown, computed: want });
      });
      var hlY = chart && chart.$hl ? chart.$hl.y : null;
      if (hlY != null && Math.abs(hlY - c.medianRT) > 1e-9) mism.push({ f: 'chart highlight', dom: hlY, computed: c.medianRT });
      // §4/§7: the glow is TODAY and must sit ON the curve (|dot.y − curve(today)| ≈ 0).
      var glow = chart && chart.$glow ? chart.$glow : null;
      if (glow) { var gy = curveYAt(glow.x, c); if (gy != null && Math.abs(glow.y - gy) > 1e-9) mism.push({ f: 'glow off curve', dom: glow.y, computed: gy }); }
      // §1/§5: the sell-track gradient's breakeven crossing must equal the chart's crossing.
      var slg = document.getElementById('hcPosSlider');
      if (slg && chart && slg.$gradCross !== undefined) {
        var gc = slg.$gradCross, cc = chart.$cross;
        if (!(gc == null && cc == null) && (gc == null || cc == null || Math.abs(gc - cc) > 1e-9)) mism.push({ f: 'gradient crossing', dom: gc, computed: cc });
      }
      var rows = (document.getElementById('hcAuditBody') || { rows: [] }).rows.length;
      if (rows !== c.outcomes.length) mism.push({ f: 'audit rows', dom: rows, computed: c.outcomes.length });
    }

    var res = {
      position: +c.pos.toFixed(4), xTrend: +c.mult.toFixed(3), n: c.n, tax: c.tax, share: c.share,
      rebuy: c.rebuy, atCap: c.atCap, rebuyTargetPos: +c.rebuyTargetPos.toFixed(4), arrivalPct: +c.arrivalPct.toFixed(2), newStack: c.newStack,
      hit: +c.hit.toFixed(2), hitAfterTax: +c.hitAfterTax.toFixed(2),
      medianRatio: +c.medianRatio.toFixed(4), medianRT: +c.medianRT.toFixed(4),
      branch: c.branch, alarm: c.alarm,
      identityViolations: idBad.length,
      branchPartitionOk: branchPartitionOk, branchMediansOk: branchMediansOk, compositionOk: compositionOk,
      nArrived: c.nArrived, nNoArrive: c.nNoArrive,
      arrivedRT: c.arrivedRT == null ? null : +c.arrivedRT.toFixed(4), noArriveRT: c.noArriveRT == null ? null : +c.noArriveRT.toFixed(4),
      domChecked: live, domMismatches: mism,
      // the WODN cross-check, side by side, so a divergence names itself
      wodn: { paid: +c.m.paid.toFixed(2), ratio: +c.m.ratio.toFixed(4), never: +c.m.never.toFixed(2), n: c.m.n, half: +c.m.half.toFixed(3) },
      ok: idBad.length === 0 && mism.length === 0 && branchPartitionOk && branchMediansOk && compositionOk
    };
    if (!res.ok) console.error('[hc-qa] single-source assertion failed', res);
    return res;
  }
  if (typeof window !== 'undefined') window.hcQA = hcQA;

  // ════════ RENDER — every renderer takes `c`, none recompute ════════

  // The verdict, as blocks (WODN's card row, HMC's quantities). §2 of the spec.
  function renderCards(c) {
    // Card A — the big one: the after-tax "kept more coins" rate + a branch line.
    var a = document.getElementById('hcCardA');
    if (a) a.textContent = Math.round(c.hitAfterTax) + '%';
    var wrap = document.getElementById('hcCardWrap');
    if (wrap) wrap.className = 'hc-card hc-card-hero hc-card-hero-' + c.branch + (c.alarm ? ' hc-alarm-tint' : '');
    var note = document.getElementById('hcCardANote');
    if (note) {
      var txt;
      if (c.branch === 'floor') {
        txt = 'A lower entry almost never arrived here &mdash; bitcoin sold at this position historically stayed cash or was rebought higher, less bitcoin <strong id="hcMiss">' +
          Math.round(c.missPct) + '</strong>% of the time. This is the strategy this page warns against.';
      } else if (c.branch === 'costs') {
        txt = 'The typical rebuy did not clear the tax &mdash; a trim here has cost bitcoin.';
      } else if (c.branch === 'wash') {
        txt = 'Roughly a wash here &mdash; the dip and the tax cancel.';
      } else {
        txt = 'This is the region where the trim has earned its keep.';
      }
      note.className = 'hc-card-note hc-card-note-' + c.branch;
      note.innerHTML = txt;
    }

    // Card B — the arrival pair (v3.2): ARRIVAL % · TYPICAL WAIT. The rebuy discount
    // moves to the footer, sign-aware: a deep target hit years out can rebuy ABOVE the
    // sale because the trend compounded during the wait — the honesty the feature exists for.
    var arr = document.getElementById('hcCardBArrival'), wait = document.getElementById('hcCardBWait');
    if (arr) arr.textContent = Math.round(c.arrivalPct) + '%';
    if (wait) wait.textContent = (c.typicalWait == null) ? '—' : fmtWait(c.typicalWait);
    var foot = document.getElementById('hcCardBFoot');
    if (foot) {
      if (c.medianDisc == null) foot.innerHTML = 'The target rarely arrived here &mdash; historical, not a forecast.';
      else if (c.medianDisc >= 0) foot.innerHTML = 'When it arrived, the rebuy was typically <strong id="hcCardBDisc">' + Math.round(c.medianDisc) + '</strong>% below your sale &mdash; not a forecast.';
      else foot.innerHTML = 'When it arrived, the rebuy was typically <strong id="hcCardBDisc">' + Math.round(-c.medianDisc) + '</strong>% <em>above</em> your sale (the trend rose while you waited) &mdash; not a forecast.';
    }

    // Card C — NEW STACK when the stack field is set, else ROUND TRIP. hcCardCValN wraps
    // the ONE outcome number (BTC or ×) so QA reads it clean past the "10 →" prefix.
    var ccap = document.getElementById('hcCardCCap'), cval = document.getElementById('hcCardCVal'), cl = document.getElementById('hcCardCLine');
    if (c.hasStack) {
      if (ccap) ccap.textContent = 'New stack';
      if (c.nArrived === 0 && c.noArriveRT != null) {
        // §4: ARRIVAL = 0% — the whole outcome is the two-year MARK on held cash (a valuation, not
        // a trade). Show the composition: kept bitcoin + the cash, marked to bitcoin at the 2yr price.
        if (cval) cval.innerHTML = stackFmt(c.stack) + ' &rarr; ' + stackFmt(c.keptBTC) + ' BTC + ' + usd(c.cashRaised) + ' cash';
        if (cl) cl.innerHTML = '&asymp; <span id="hcCardCValN">' + stackFmt(c.newStack) + '</span> BTC at the two-year price, after ' + c.tax +
          '% tax &mdash; the cash held; bitcoin ' + (c.noArriveRT < 1 ? 'ran' : 'fell') + ' while it waited.';
      } else {
        if (cval) cval.innerHTML = stackFmt(c.stack) + ' &rarr; <span id="hcCardCValN">' + stackFmt(c.newStack) + '</span> BTC';
        if (cl) cl.innerHTML = 'after ' + c.tax + '% tax, at these settings.';
      }
    } else {
      // Empty-state title is BITCOIN BACK, not "round trip" — that mechanical term stays in
      // prose only, after its defining sentence (addendum A1).
      if (ccap) ccap.textContent = 'Bitcoin back';
      if (cval) cval.innerHTML = '<span id="hcCardCValN">' + c.medianRT.toFixed(2) + '</span>&times;';
      if (cl) cl.innerHTML = 'per bitcoin sold &mdash; turning <strong>' + c.share +
        '%</strong> of the stack into roughly <strong>' + c.endSharePct.toFixed(0) + '%</strong>.';
    }
  }

  // v3.5 §1: the branch decomposition strip — likelihood ÷ impact, separated. Card A is the
  // blend of both branches; this shows the branches. Every value from compute(); QA binds them.
  function renderStrip(c) {
    var el = document.getElementById('hcBranchStrip'); if (!el || !c.m) return;
    var H = Math.round(c.arrivalPct), noH = 100 - H;
    var arr, no;
    if (c.arrivedRT == null) {
      arr = 'If the target arrives (' + H + '%): <em>it never did, here</em>.';
    } else {
      arr = 'If the target arrives (<strong>' + H + '%</strong>): median <strong id="hcBranchArriveMult">' + c.arrivedRT.toFixed(2) + '</strong>×' +
        (c.hasStack ? ' &mdash; ' + stackFmt(c.stack) + ' &rarr; <strong id="hcBranchArriveBtc">' + stackFmt(c.arriveA) + '</strong> BTC' : '') + '.';
    }
    if (c.noArriveRT == null) {
      no = 'If it doesn&rsquo;t (' + noH + '%): the target always arrived here.';
    } else {
      // §4: valuation-mark framing in ALL cases — the cash is HELD (never redeployed at the
      // target) and marked to bitcoin at the two-year price, not traded far above the sale.
      no = 'If it doesn&rsquo;t (<strong>' + noH + '%</strong>): the cash was never redeployed at your target &mdash; ' +
        'held to the two-year mark it&rsquo;s worth <strong id="hcBranchNoArriveMult">' + c.noArriveRT.toFixed(2) + '</strong>× in bitcoin terms' +
        (c.hasStack ? ': ' + stackFmt(c.keptBTC) + ' BTC + ' + usd(c.cashRaised) + ' cash &asymp; <strong id="hcBranchNoArriveBtc">' + stackFmt(c.noArriveA) + '</strong> BTC' : '') + '.';
    }
    el.innerHTML = '<span class="hc-branch">' + arr + '</span><span class="hc-branch">' + no + '</span>';

    // branch-aware explainer: ARRIVAL ≈ 0 but the blend is materially > 0 (JM's screenshot state)
    var ex = document.getElementById('hcBranchExplainer'); if (!ex) return;
    if (H <= 5 && c.hitAfterTax > 40) {
      ex.hidden = false;
      ex.innerHTML = 'The target almost never arrived &mdash; the <strong>' + Math.round(c.hitAfterTax) +
        '%</strong> is the two-year mark: the held cash, valued at the two-year price below your sale, was worth more bitcoin.';
    } else { ex.hidden = true; ex.innerHTML = ''; }
  }

  // One-sentence synthesized verdict above the cards — no number lives here (the
  // cards carry every figure; §2: no number in prose that isn't in a card).
  function renderVerdictLead(c) {
    var el = document.getElementById('hcVerdictLead'); if (!el) return;
    var t;
    if (c.branch === 'floor') t = 'At this position, selling bitcoin in the hope of rebuying it lower is the strategy this page warns against.';
    else if (c.branch === 'costs') t = 'At these settings, the trim is under water — the tax outruns the typical dip.';
    else if (c.branch === 'wash') t = 'At these settings, the round trip is close to a wash.';
    else t = 'At these settings, the trim has historically earned its keep.';
    el.className = 'hc-verdict-lead hc-verdict-lead-' + c.branch;
    el.textContent = t;
  }

  function renderStack(c) {
    var el = document.getElementById('hcStackNote'); if (!el) return;
    if (!c.stack || !isFinite(c.stack) || c.stack <= 0) { el.innerHTML = 'Optional. Entering a number of bitcoin may help orient you to the potential outcomes; the verdict does not depend on it.'; return; }
    var sold = c.stack * c.x, at = c.isToday ? '' : ' (at today’s trend)';
    el.innerHTML = 'Selling <strong>' + btc(sold) + '</strong> of ' + btc(c.stack) + ' at ' + usdFull(c.P) + at + ' raises <strong>' +
      usdFull(sold * c.P * (1 - c.t)) + '</strong> after ' + c.tax + '% tax. The median round trip brings back about <strong>' +
      btc(sold * c.medianRT) + '</strong>.';
  }

  function renderAlarm(c) {
    var el = document.getElementById('hcAlarm'); if (!el) return;
    el.hidden = !c.alarm;
  }

  function renderTax(c) {
    var el = document.getElementById('hcTaxLine'); if (!el) return;
    if (c.tax === 0) {
      el.innerHTML = 'At <strong>0%</strong> there is no haircut: any rebuy below the entry earns bitcoin. That is the tax-advantaged case.';
    } else {
      el.innerHTML = 'At <strong>' + c.tax + '%</strong> long-term capital gains on a fully appreciated stack, the rebuy must come more than <strong>' +
        c.tax + '%</strong> lower just to break even in bitcoin &mdash; the dip has to beat the tax before it earns you anything.';
    }
  }

  function renderShock(c) {
    var el = document.getElementById('hcShockRatio'); if (!el) return;
    var r = c.trend / c.P;
    el.innerHTML = 'A surprise bill paid from the stack ' + (c.isToday ? 'here' : 'at this position') + ' costs <strong>' + r.toFixed(2) +
      '×</strong> the bitcoin it would at trend.';
  }

  function renderZone(c) {
    var el = document.getElementById('hcZoneStrip'); if (!el) return;
    el.innerHTML = 'Bitcoin has spent <strong>' + pct0(zoneTime.pct) + '</strong> of its history at or below ' + ZONE_MULT.toFixed(2) +
      '× trend (' + zoneTime.n + ' of ' + zoneTime.total + ' samples). Historical, not a forecast.';
  }

  function renderPos(c) {
    var el = document.getElementById('hcPosReadout'); if (!el) return;
    el.innerHTML = '<strong>' + c.mult.toFixed(2) + '×</strong> trend · <em>' + positionLabel(c.pos) + '</em> · ' +
      (c.isToday ? 'today' + todayPriceNote(_priceSource) : 'at this position') + ' · ' + usdFull(c.P);
  }

  // Provenance caption beneath the card row.
  function renderProvenance(c) {
    var el = document.getElementById('hcSample'); if (!el || !c.m) return;
    el.innerHTML = 'Drawn from <strong>' + c.n + '</strong> historical entries within ' +
      (c.half <= 0.08 ? '±' + c.half.toFixed(2) : 'a widened band') +
      ' of this position (post-2014, each with a full two-year forward record). Historical, at this position &mdash; not a prediction.';
  }

  function targetName(c) { return c.atCap ? 'the first lower entry' : positionLabel(c.rebuyTargetPos); }
  function renderEndnote(c) {
    var el = document.getElementById('hcEndnote'); if (!el) return;
    var tgt = targetName(c);
    var ruleTxt = c.atCap ? 'the first lower entry within two years'
                : 'the first time price reaches ' + tgt + ' (' + ratioOf(c.rebuyTargetPos).toFixed(2) + '× trend) within two years';
    el.innerHTML = 'Your settings: ' + c.share + '% cash · ' + (100 - c.share) + '% bitcoin · ' + c.tax + '% tax · rebuy at ' + tgt +
      (c.hasStack ? ' · ' + stackFmt(c.stack) + ' BTC stack' : '') + ' · position ' +
      c.mult.toFixed(2) + '× trend · ' + positionLabel(c.pos) + (c.isToday ? ' (today)' : '') + ' · ' +
      c.n + ' historical entries since 2014<span class="help-tip" tabindex="0">?<span class="tip-content">Entries start in 2014: earlier data is thin and patchy &mdash; a tiny market in the exchange-collapse era &mdash; and every entry must carry a full two-year forward record.</span></span>. Rebuy rule: ' + ruleTxt + ', else the two-year price.';
  }

  // Insight-chart caption — today-focused, explains the glow/dot.
  function renderInsightNote(c) {
    var el = document.getElementById('hcInsightNote'); if (!el) return;
    var lp = livePos(), ty = curveYAt(lp, c);
    if (ty == null) { el.innerHTML = 'Median bitcoin back per bitcoin sold, by channel position, after ' + c.tax + '% tax.'; return; }
    var live = todayPriceIsLive(_priceSource);
    el.innerHTML = (live ? 'The glowing point is <strong>today</strong>' : 'The dot is <strong>today</strong> (latest monthly data)') +
      ' &mdash; ' + ratioOf(lp).toFixed(2) + '× trend · ' + positionLabel(lp) + ', where the median round trip returns about <strong>' +
      ty.toFixed(2) + '×</strong> per bitcoin sold after ' + c.tax + '% tax. Above the breakeven line the trim earns bitcoin; below it, it costs it.';
  }

  // ── Insight chart ──
  var chart = null;
  function chartData(c) {
    var f = 1 - c.tax / 100;
    var pts = rawCurve(c).map(function (p) { return { x: p.x, y: f * p.ratio }; });
    // Seat the glow (today) and blue (sell) markers exactly on the drawn line by inserting
    // them as vertices; y comes from the same curve function (§4 glow-fix).
    var tp = livePos(), gy = curveYAt(tp, c);
    if (gy != null) pts.push({ x: tp, y: gy });
    pts.push({ x: c.pos, y: c.medianRT });             // curveYAt(c.pos,c) === c.medianRT by construction
    pts.sort(function (a, b) { return a.x - b.x; });
    return {
      pts: pts, cross: crossingOf(pts),
      glow: (gy != null ? { x: tp, y: gy } : null),    // TODAY, always on the curve
      hl: { x: c.pos, y: c.medianRT },                 // the sell position, on the curve
      band: { left: c.rebuyTargetPos, right: c.pos }   // the stretch the strategy spans
    };
  }
  // The range band (§4): a subtle neutral vertical fill over x ∈ [rebuy target, sell] — the
  // stretch of the channel the strategy spans. Draws BEHIND the curve. Tracks both sliders.
  var rangeBandPlugin = {
    id: 'hcRangeBand',
    beforeDatasetsDraw: function (ch) {
      if (!ch.$band || !ch.scales || !ch.scales.x) return;
      var xS = ch.scales.x, area = ch.chartArea;
      var xl = xS.getPixelForValue(ch.$band.left), xr = xS.getPixelForValue(ch.$band.right);
      var lo = Math.max(area.left, Math.min(xl, xr)), hi = Math.min(area.right, Math.max(xl, xr));
      if (hi - lo < 1) return;
      var ctx = ch.ctx;
      ctx.save();
      ctx.fillStyle = 'rgba(236,228,214,0.055)';   // neutral cream, not the warning red
      ctx.fillRect(lo, area.top, hi - lo, area.bottom - area.top);
      ctx.restore();
    }
  };
  var crossPlugin = {
    id: 'hcCross',
    afterDatasetsDraw: function (ch) {
      var xS = ch.scales.x, yS = ch.scales.y, ctx = ch.ctx;
      // breakeven line at 1.0
      var y1 = yS.getPixelForValue(1);
      ctx.save();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(236,228,214,0.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xS.left, y1); ctx.lineTo(xS.right, y1); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(236,228,214,0.7)'; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('breakeven (1.00× — same bitcoin back)', xS.left + 4, y1 - 5);
      // the crossing
      if (ch.$cross != null) {
        var xc = xS.getPixelForValue(ch.$cross);
        ctx.strokeStyle = 'rgba(224,148,34,0.8)'; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(xc, yS.top); ctx.lineTo(xc, yS.bottom); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#e09422'; ctx.font = '700 10px Inter, sans-serif'; ctx.textAlign = 'center';
        var lbl = 'breakeven — shifts right as the tax rate rises';
        var tx = Math.max(xS.left + ctx.measureText(lbl).width / 2 + 2, Math.min(xc, xS.right - ctx.measureText(lbl).width / 2 - 2));
        ctx.fillText(lbl, tx, yS.top + 11);
      }
      // selected-position highlight (moves with the slider; ONE source, QA reads $hl)
      if (ch.$hl) {
        var hx = xS.getPixelForValue(ch.$hl.x), hy = yS.getPixelForValue(ch.$hl.y);
        ctx.beginPath(); ctx.arc(hx, hy, 6, 0, Math.PI * 2);
        ctx.fillStyle = SEL_C; ctx.fill();
        ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
    }
  };
  // Today's live pulse (Gallery/BvSM lcs-pulse-halo). Positions #hcInsightPulse at
  // today's curve point each render; gated on the live flag — animated when live,
  // static core dot on fallback (the live-label canon applies to the glow too).
  var insightPulse = {
    id: 'hcInsightPulse',
    afterRender: function (ch) {
      var el = document.getElementById('hcInsightPulse'); if (!el) return;
      var tp = ch.$glow;                                // TODAY, on the curve (§4 glow-fix)
      if (!tp || !ch.scales || !ch.scales.x || !ch.scales.y) { el.classList.remove('is-visible'); return; }
      var x = ch.scales.x.getPixelForValue(tp.x), y = ch.scales.y.getPixelForValue(tp.y), area = ch.chartArea;
      if (x < area.left - 4 || x > area.right + 4 || y < area.top - 4 || y > area.bottom + 4) { el.classList.remove('is-visible'); return; }
      el.style.left = x + 'px'; el.style.top = y + 'px';
      el.classList.add('is-visible');
      el.classList.toggle('hc-pulse-static', !todayPriceIsLive(_priceSource));
    }
  };
  function buildChart(c) {
    var el = document.getElementById('hcInsightChart'); if (!el || typeof Chart === 'undefined') return;
    var d = chartData(c);
    chart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: {
        datasets: [{
          label: 'Median bitcoin back per bitcoin sold',
          data: d.pts.map(function (p) { return { x: p.x, y: p.y }; }),
          borderColor: TREND_C, borderWidth: 2.4, pointRadius: 0, tension: 0.25,
          segment: { borderColor: function (ctx) { return ctx.p1.parsed.y >= 1 ? GAIN_C : LOSS_C; } }
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'nearest', axis: 'x' },
        layout: { padding: { top: 18, right: 10 } },
        scales: {
          x: {
            type: 'linear', min: -0.05, max: 1.0,
            title: { display: true, text: 'Where in the channel you sell', color: MUTED, font: { size: 11 } },
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: { color: MUTED, font: { size: 10 }, maxTicksLimit: 7, callback: function (v) { return positionLabel(v); } }
          },
          y: {
            title: { display: true, text: 'Bitcoin back per bitcoin sold', color: MUTED, font: { size: 11 } },
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, font: { size: 10 }, callback: function (v) { return v.toFixed(2) + '×'; } }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1,
            titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function (it) { return it.length ? ratioOf(it[0].parsed.x).toFixed(2) + '× trend · ' + positionLabel(it[0].parsed.x) : ''; },
              label: function (it) {
                var base = it.parsed.y.toFixed(2) + '× bitcoin back per bitcoin sold';
                // Identify the blue dot: its x is chart.$hl.x; the tooltip fires at the
                // nearest curve sample (≤0.0125 away), which is exactly where the dot sits.
                if (chart && chart.$hl && Math.abs(it.parsed.x - chart.$hl.x) < 0.014) return [base, '◆ Selected position (the blue dot)'];
                return base;
              }
            }
          }
        }
      },
      plugins: [rangeBandPlugin, crossPlugin, insightPulse]
    });
    chart.$cross = d.cross; chart.$hl = d.hl; chart.$glow = d.glow; chart.$band = d.band;
  }
  function updateChart(c) {
    if (!chart) { buildChart(c); return; }
    var d = chartData(c);
    chart.data.datasets[0].data = d.pts.map(function (p) { return { x: p.x, y: p.y }; });
    chart.$cross = d.cross; chart.$hl = d.hl; chart.$glow = d.glow; chart.$band = d.band;   // ← one source; QA reads $hl/$glow
    chart.update('none');
  }
  function chartBinding() {
    if (!chart || !chart.scales || !chart.scales.y) return null;
    var ds = chart.data.datasets[0];
    if (!ds || !ds.data.length) return null;
    var c = compute(S_);
    return {
      seriesColor: ds.borderColor, points: ds.data.length,
      highlightY: chart.$hl ? chart.$hl.y : null, expectedY: c.medianRT,
      ok: chart.$hl != null && Math.abs(chart.$hl.y - c.medianRT) < 1e-9
    };
  }
  function assertBinding() { var r = chartBinding(); if (r && !r.ok) console.error('[hc-binding] insight-chart highlight is not the computed value', r); }
  if (typeof window !== 'undefined') window.hcBinding = chartBinding;

  // ── Channel chart (WODN grammar: bands + history + dashed selected line + blue dots) ──
  var chChart = null;
  function bandLine(m, startD, span) {
    var pts = [], step = Math.max(12, span / 140), d;
    for (d = 0; d <= span + 1e-6; d += step) pts.push({ x: startD + d, y: plPrice(startD + d) * m });
    pts.push({ x: startD + span, y: plPrice(startD + span) * m });
    return pts;
  }
  function band(label, data, color, dash, w) {
    return { label: label, data: data, borderColor: color, backgroundColor: color, borderWidth: w, borderDash: dash || undefined, pointRadius: 0, tension: 0.2, fill: false, order: 4 };
  }
  // The historical entries the current neighbourhood is built from, rendered exactly
  // as WODN renders its entries (same 3.2px blue dot, page-bg hairline stroke).
  var chSelDots = [];
  var selDotPlugin = {
    id: 'hcSelDots',
    afterDatasetsDraw: function (c) {
      if (!chSelDots.length) return;
      var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx, area = c.chartArea, i, x, y;
      ctx.save();
      for (i = 0; i < chSelDots.length; i++) {
        x = xS.getPixelForValue(chSelDots[i].x); y = yS.getPixelForValue(chSelDots[i].y);
        if (x < area.left - 2 || x > area.right + 2) continue;
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fillStyle = SEL_C; ctx.globalAlpha = 0.8; ctx.fill();
        ctx.globalAlpha = 1; ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.1; ctx.stroke();
      }
      ctx.restore();
    }
  };
  // v3.6: recess the pre-2014 era — a subtle dark wash over the region (dims the bands passing
  // through it too, which reads clearer than dimming the price line alone; documented in §39) and
  // a thin boundary rule/label at exactly 2014-01-01 (TABLE_CUT) in data coordinates. Drawn on the
  // canvas, so the chart-copy export (a canvas blit) carries the dimming.
  var eraDimPlugin = {
    id: 'hcEraDim',
    afterDatasetsDraw: function (c) {
      var xS = c.scales.x, area = c.chartArea, ctx = c.ctx;
      var xb = xS.getPixelForValue(TABLE_CUT), right = Math.min(area.right, xb);
      ctx.save();
      if (right > area.left + 1) {
        ctx.fillStyle = 'rgba(10,9,8,0.4)';
        ctx.fillRect(area.left, area.top, right - area.left, area.bottom - area.top);
      }
      if (xb > area.left && xb < area.right) {
        ctx.strokeStyle = 'rgba(232,224,210,0.35)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(xb, area.top); ctx.lineTo(xb, area.bottom); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(232,224,210,0.55)'; ctx.font = '600 9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('2014 · entries start', xb + 4, area.top + 10);
      }
      ctx.restore();
    }
  };
  function chDatasets() {
    // v3.6: render the FULL existing price series (no new data plumbing) so the pre-2014 era
    // shows, dimmed. The channel bands render normally through it — the Power Law applies to all
    // history; it is the ENTRY data (the neighbourhood) we exclude before 2014, not the model.
    var startD = FIRST_D, span = todayD - startD;
    var ds = [
      band('Floor (0.42× trend)', bandLine(PL_FLOOR, startD, span), FLOOR_C, [6, 3], 1.4),
      band('Trend', bandLine(1, startD, span), TREND_C, null, 2),
      // upper band thinned/ghosted (§3) so the two strategy lines read clearly against it
      band('Upper (3× trend)', bandLine(PL_CEIL, startD, span), UPPER_C, [1, 6], 0.8)
    ];
    var price = [];
    for (var i = 0; i < N; i++) if (S[i].d >= startD) price.push({ x: S[i].d, y: S[i].p });
    price.push({ x: todayD, y: spot() });
    ds.push({
      label: 'BTC price (history)', data: price, borderColor: HIST_C, borderWidth: 1.3, pointRadius: 0, tension: 0.15, order: 1,
      // the pre-2014 record is dimmed — the model draws its entries only from 2014 on
      segment: { borderColor: function (ctx) { return ctx.p0.parsed.x < TABLE_CUT ? 'rgba(232,224,210,0.16)' : HIST_C; } }
    });
    // BOTH strategy ends (§3): the sell position (blue) and the rebuy target (green). The gap
    // between the two dashed lines IS the strategy's span.
    var P = curPos();
    ds.push(band('Sell position', bandLine(ratioOf(P), startD, span), SEL_C, [4, 4], 2));
    // v3.7: when the target is at/above the sale, the green line DOCKS onto the sale line, dimmed
    // and subordinate, with a self-narrating legend label — it isn't ignoring the thumb, it's riding the sale.
    var isCap = atCap(S_.rebuy, P);
    ds.push(band(isCap ? 'Rebuy target — at your sale' : 'Rebuy target',
      bandLine(ratioOf(rebuyLinePos(S_.rebuy, P)), startD, span),
      isCap ? 'rgba(111,174,111,0.4)' : REBUY_C, [4, 4], isCap ? 1.4 : 2));
    // the historical entries the current band is built from (same internal match-clamp)
    var m = bandMetrics(matchPos(P));
    chSelDots = (m && m.entries) ? m.entries.map(function (i) { return { x: S[i].d, y: S[i].p }; }) : [];
    return ds;
  }
  function yBounds(ds) {
    var lo = Infinity, hi = -Infinity, i, j, y;
    for (i = 0; i < ds.length; i++) for (j = 0; j < ds[i].data.length; j++) { y = ds[i].data[j].y; if (isFinite(y) && y > 0) { if (y < lo) lo = y; if (y > hi) hi = y; } }
    if (!isFinite(lo)) { lo = 1000; hi = 1e7; }
    return { min: lo * 0.55, max: hi * 1.9 };
  }
  function buildChannel() {
    var el = document.getElementById('hcChannelChart'); if (!el || typeof Chart === 'undefined') return;
    var ds = chDatasets(), yb = yBounds(ds);
    chChart = new Chart(el.getContext('2d'), {
      type: 'line', data: { datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' }, layout: { padding: { top: 16, right: 10 } },
        scales: {
          x: { type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { size: 11 }, maxTicksLimit: 8, callback: function (v) { return new Date(GENESIS_TS * 1000 + v * 86400 * 1000).getUTCFullYear(); } } },
          y: { type: 'logarithmic', min: yb.min, max: yb.max, grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { size: 11 }, callback: function (v) { if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'; return '$' + v.toFixed(0); } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: { backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10, callbacks: { title: function (it) { return it.length ? monthYear(it[0].parsed.x) : ''; }, label: function (it) { return it.dataset.label + ': $' + Math.round(it.parsed.y).toLocaleString(); } } }
        }
      },
      plugins: [eraDimPlugin, selDotPlugin]
    });
  }
  function updateChannel() {
    if (!chChart) { buildChannel(); return; }
    var ds = chDatasets(), yb = yBounds(ds);
    chChart.data.datasets = ds;
    chChart.options.scales.y.min = yb.min; chChart.options.scales.y.max = yb.max;
    chChart.update('none');
  }

  // ── The position slider + persistent TODAY tick (lifted from WODN) ──
  function syncSliderToState() { var sl = document.getElementById('hcPosSlider'); if (sl) sl.value = posToSlider(curPos()); }
  function placeTodayTick() {
    var m = document.getElementById('hcTodayTick'); if (!m) return;
    m.style.left = ((clampPos(livePos()) - POS_MIN) / POS_RANGE * 100) + '%';
    m.classList.add('is-visible');
  }

  // ── Slider 2 (the rebuy target) — v3.4 §2: FULL independence. The thumb holds an ABSOLUTE
  // channel position; no clamp, no cap-riding. effectiveTarget = min(target, sale) lives in
  // atCap()/engineTarget(): target ≥ sale ⇒ the default rule (WODN's any-lower-entry). Only
  // the ▼ tick tracks slider 1. Nothing but the user ever moves a thumb. ──
  function syncSlider2() {
    var sl = document.getElementById('hcRebuySlider'); if (!sl) return;
    sl.value = posToSlider(S_.rebuy == null ? POS_MAX : S_.rebuy);   // null (at-sale default) rests at the right end
  }
  function placeSaleTick() {                     // the ▼ YOUR SALE reference tick — moves with slider 1
    var m = document.getElementById('hcSaleTick'); if (!m) return;
    m.style.left = ((clampPos(curPos()) - POS_MIN) / POS_RANGE * 100) + '%';
    m.classList.add('is-visible');
  }
  function renderRebuyReadout(c) {
    var el = document.getElementById('hcRebuyReadout'); if (!el) return;
    if (c.atCap) {   // target at or above the sale — the default rule (also the underwater-manager state)
      el.innerHTML = '<strong>at your sale</strong> &mdash; Wait-or-Deploy&rsquo;s rule (any lower entry within two years)';
    } else {
      el.innerHTML = '<strong>' + ratioOf(c.rebuyTargetPos).toFixed(2) + '×</strong> trend · <em>' + positionLabel(c.rebuyTargetPos) +
        '</em>, below your ' + c.mult.toFixed(2) + '× sale';
    }
  }

  // ── Audit ──
  var _lastC = null;
  function renderAudit(c) {
    var head = document.getElementById('hcAuditHead'), body = document.getElementById('hcAuditBody');
    if (!head || !body || !c.m) return;
    head.innerHTML = '<tr><th>Entry</th><th class="hc-num">Position</th><th class="hc-num">Price</th><th class="hc-num">Rebuy</th><th class="hc-num">Rebuy price</th><th class="hc-num">Discount</th><th class="hc-num">Bitcoin back / bitcoin sold</th></tr>';
    var rows = '';
    c.outcomes.forEach(function (o) {
      rows += '<tr><td>' + monthYear(o.d0) + '</td><td class="hc-num">' + ratioOf(o.P).toFixed(2) + '×</td><td class="hc-num">' +
        usdFull(o.p0) + '</td><td class="hc-num">' + (o.arrived ? monthYear(o.waitDay) : '<em>no dip · 2y</em>') + '</td><td class="hc-num">' +
        usdFull(o.waitPrice) + '</td><td class="hc-num">' + (o.disc * 100).toFixed(0) + '%</td><td class="hc-num' +
        (o.rt >= 1 ? ' hc-gain' : ' hc-loss') + '">' + o.rt.toFixed(2) + '×</td></tr>';
    });
    body.innerHTML = rows;
    _lastC = c;
  }
  function csv() {
    var c = _lastC; if (!c) return;
    var lines = ['entry_date,position_x_trend,entry_price_usd,rebuy_date,rebuy_price_usd,dip_arrived,discount_pct,after_tax_bitcoin_multiple'];
    c.outcomes.forEach(function (o) {
      lines.push([monthYear(o.d0), ratioOf(o.P).toFixed(3), Math.round(o.p0),
        o.arrived ? monthYear(o.waitDay) : 'no-dip-2y', Math.round(o.waitPrice),
        o.arrived ? 'yes' : 'no', (o.disc * 100).toFixed(1), o.rt.toFixed(4)].join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'how-much-cash.csv'; a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Mirrored share control (§6.35: two representations, one state) ──
  function syncShare(from) {
    var n = document.getElementById('hcShareNum'), s = document.getElementById('hcShareSlider');
    if (from !== 'num' && n) n.value = S_.share;
    if (from !== 'slider' && s) s.value = String(S_.share);
    var split = document.getElementById('hcSplitReadout');   // one stack, two forms
    if (split) split.innerHTML = '<strong>' + (100 - S_.share) + '%</strong> bitcoin · <strong>' + S_.share + '%</strong> cash';
    setSeg('hcSharePresets', S_.share);
  }
  function setSeg(groupId, value) {
    var g = document.getElementById(groupId); if (!g) return;
    var bs = g.querySelectorAll('[data-val]');
    for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('is-active', bs[i].getAttribute('data-val') === String(value));
  }

  // ── URL (allocation register; pos is now a channel position, 3dp) ──
  // Returns true if ANY instrument param is present — the store precedence gate (A3):
  // URL params (any) > stored state > defaults. A URL-parameterized load ignores the store.
  function readUrl() {
    if (!window.URLSearchParams) return false;
    var p = new URLSearchParams(window.location.search), v;
    var present = ['share', 'tax', 'pos', 'rebuy', 'stack'].some(function (k) { return p.has(k); });
    if (p.has('share')) { v = parseInt(p.get('share'), 10); if (isFinite(v)) S_.share = clamp(v, 0, 100); }
    if (p.has('tax')) { v = parseInt(p.get('tax'), 10); if ([0, 15, 20].indexOf(v) >= 0) S_.tax = v; }
    if (p.has('pos')) {
      v = parseFloat(p.get('pos'));
      // pos is a channel position (≤1.0). A v3-era day-encoded pos (thousands) is out of
      // range — treat it as "today" rather than clamping it to the upper band.
      if (isFinite(v) && v >= POS_MIN - 0.001 && v <= POS_MAX + 0.001) S_.pos = clampPos(v);
    }
    if (p.has('rebuy')) {
      var rv = p.get('rebuy');
      // v3.3: numeric channel-position target. Legacy tokens map: first→cap(null), trend→0.36, floor→0.18.
      if (rv === 'first') S_.rebuy = null;
      else if (rv === 'trend') S_.rebuy = 0.36;
      else if (rv === 'floor') S_.rebuy = 0.18;
      else { v = parseFloat(rv); if (isFinite(v) && v >= POS_MIN - 0.001 && v <= POS_MAX + 0.001) S_.rebuy = v; }
    }
    if (p.has('stack')) { v = parseFloat(p.get('stack')); if (isFinite(v) && v > 0) S_.stack = v; }
    // v2's params (exp, buf, shock, hz, yld, depth, btc, dep, cy, rec) are retired.
    return present;
  }
  var _urlT = null;
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    if (_urlT) clearTimeout(_urlT);
    _urlT = setTimeout(function () {
      var p = new URLSearchParams();
      p.set('share', String(S_.share));
      if (S_.tax !== DEFAULTS.tax) p.set('tax', String(S_.tax));
      if (S_.pos != null) p.set('pos', String(Math.round(S_.pos * 1000) / 1000));
      if (S_.rebuy != null) p.set('rebuy', String(Math.round(S_.rebuy * 1000) / 1000));  // numeric target; cap (null) omitted
      if (S_.stack) p.set('stack', String(S_.stack));
      window.history.replaceState(null, '', window.location.pathname + '?' + p.toString() + window.location.hash);
    }, 250);
  }

  // ════════ ORCHESTRATOR — one compute, every renderer reads it ════════
  function renderAll() {
    var c = compute(S_);                // §2: no clamp — slider 2 holds its absolute position independently
    if (!c.m) return;
    renderPos(c); renderRebuyReadout(c); renderVerdictLead(c); renderCards(c); renderStrip(c); renderStack(c); renderAlarm(c); renderTax(c);
    renderShock(c); renderZone(c); renderProvenance(c); renderEndnote(c); renderInsightNote(c);
    syncSliderToState(); placeTodayTick(); syncSlider2(); placeSaleTick();
    updateChannel();
    updateChart(c);
    renderSellGradient(c);              // §1: data-derived track valence (reads chart.$cross)
    renderRebuyTrack();                 // v3.7: slider 2 cheapness + inert-beyond-sale track
    renderAudit(c);
    assertBinding();
    syncShare();
    syncUrl();
    saveState();                        // sticky settings (A3) — no-op key-removal when at defaults
    var q = hcQA(S_);
    if (!q.ok) console.error('[hc-qa] render failed the single-source assertion', q);
  }

  function initControls() {
    var st = document.getElementById('hcStack'); if (st && S_.stack) st.value = S_.stack; else if (st) st.value = '';
    setSeg('hcTax', S_.tax);
    syncShare();
  }
  function wire() {
    function on(id, ev, fn) { var e = document.getElementById(id); if (e) e.addEventListener(ev, fn); }
    function setShare(v, from) {
      if (!isFinite(v)) return;
      S_.share = clamp(Math.round(v), 0, 100);
      syncShare(from); renderAll();
    }
    on('hcShareNum', 'input', function () { setShare(parseFloat(this.value), 'num'); });
    on('hcShareSlider', 'input', function () { setShare(parseInt(this.value, 10), 'slider'); });
    on('hcSharePresets', 'click', function (e) { var b = e.target.closest('[data-val]'); if (b) setShare(parseInt(b.getAttribute('data-val'), 10), 'preset'); });
    on('hcTax', 'click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      S_.tax = parseInt(b.getAttribute('data-val'), 10); setSeg('hcTax', S_.tax); renderAll();
    });
    on('hcStack', 'input', function () { var v = parseFloat(this.value); S_.stack = (isFinite(v) && v > 0) ? v : null; renderAll(); });
    on('hcPosSlider', 'input', function () { S_.pos = sliderToPos(parseInt(this.value, 10)); renderAll(); });   // renderAll clamps slider 2 to the new sale
    on('hcRebuySlider', 'input', function () { S_.rebuy = sliderToPos(parseInt(this.value, 10)); renderAll(); });   // §2: absolute, uncapped
    on('hcSnapToday', 'click', function (e) { e.preventDefault(); S_.pos = null; syncSliderToState(); renderAll(); });
    on('hcReset', 'click', function () { for (var k in DEFAULTS) if (DEFAULTS.hasOwnProperty(k)) S_[k] = DEFAULTS[k]; clearStore(); initControls(); renderAll(); });
    on('hcAuditToggle', 'click', function () { var b = document.getElementById('hcAuditBody2'); if (!b) return; b.hidden = !b.hidden; this.setAttribute('aria-expanded', String(!b.hidden)); });
    on('hcShowWork', 'click', function () {   // surface the receipts (§5): expand the audit, anchor scrolls
      var b = document.getElementById('hcAuditBody2'), t = document.getElementById('hcAuditToggle');
      if (b && b.hidden) { b.hidden = false; if (t) t.setAttribute('aria-expanded', 'true'); }
    });
    on('hcCsvBtn', 'click', csv);
    initControls();
  }

  function init() {
    var urlPresent = readUrl();       // A3 precedence: URL params (any) > stored state > defaults
    if (!urlPresent) loadStore();     // a URL-parameterized load neither reads nor is overridden by the store
    wire(); buildChannel(); renderAll();
    try {
      fetchTodayPrice(function (price, source) {
        _priceSource = (source === 'live') ? 'live' : 'fallback';
        if (isFinite(price) && price > 0) _spot = price;
        renderAll();
      });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
