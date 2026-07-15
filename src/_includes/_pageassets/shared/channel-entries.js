/* shared/channel-entries.js — the historical channel-entry method, shared by
   Wait-or-Deploy-Now and How Much Cash.

   Extracted 2026-07 from wait-or-deploy-now.js, where all of it lived inside the
   page's IIFE and so could not be reused. How Much Cash is the second consumer:
   it asks the same question from the opposite side (an all-in holder deciding
   whether to raise cash, rather than a cash holder deciding whether to deploy),
   so it must read the SAME record with the SAME neighborhood definition. Two
   copies of this would let the mirror-twin pages publish different numbers for
   the same position, which is the one thing neither page can afford.

   Nothing here is re-derived: the constants, the entry loop, the neighborhood
   widening and the medians are WODN's originals, moved verbatim. WODN's
   rendered figures were verified unchanged against the pre-extraction page.

   Pure — no DOM, no page state. Loads after power-law-data.js (it reads
   PL_DATA, plPrice, PL_FLOOR, PL_CEIL, GENESIS_TS); exposes window.ChannelEntries.

   THE TWO CONDITIONALS, because they are easy to confuse:
     `arrived` — a LOWER CHANNEL POSITION (≥ DROP below the entry) showed up
                 within the two-year window. Decides WHICH price the rebuy uses.
     `paid`    — the rebuy price came in below the entry price (ratio > 1), i.e.
                 the same dollars bought more coins. This is the hit rate both
                 pages headline. An entry can be `paid` without being `arrived`
                 (the two-year price alone can be lower), so they are not
                 interchangeable and never should be swapped. */
(function () {
  'use strict';
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  // ── Channel-position math (log-space) ──
  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function posOf(price, days) { return (Math.log(price / plPrice(days)) - LF) / SPAN; }
  function ratioOf(pos) { return Math.exp(pos * SPAN + LF); }

  var N = PL_DATA.length;
  var FIRST_D = PL_DATA[0][0], LAST_D = PL_DATA[N - 1][0];
  var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400;
  var YEAR_D = 365.25, MONTH_D = 30.44;
  var TABLE_CUT = (Date.UTC(2014, 0, 1) / 1000 - GENESIS_TS) / 86400;  // pre-$15 curiosity era excluded
  var WAIT_CAP = 2 * YEAR_D;   // cap the wait at 2 years (if no lower entry, the waiter deploys then)
  var DROP = 0.15;             // "wait" = wait for channel position ≥0.15 LOWER than entry
  var DD_THRESH = 0.20;        // a "drawdown" = a ≥20% drop within 2 years

  // ── Precomputed samples ──
  var S = (function () { var a = new Array(N); for (var i = 0; i < N; i++) a[i] = { d: PL_DATA[i][0], p: PL_DATA[i][1], pos: posOf(PL_DATA[i][1], PL_DATA[i][0]) }; return a; })();

  function realPriceAt(absDay) {
    if (absDay <= S[0].d) return S[0].p;
    if (absDay >= S[N - 1].d) return S[N - 1].p;
    for (var i = 1; i < N; i++) { if (S[i].d >= absDay) { var a = S[i - 1], b = S[i], t = (absDay - a.d) / (b.d - a.d); return a.p * (1 - t) + b.p * t; } }
    return S[N - 1].p;
  }
  function median(arr) { var m = arr.filter(function (x) { return x != null && isFinite(x); }).sort(function (a, b) { return a - b; }); return m.length ? m[Math.floor(m.length * 0.5)] : null; }
  function monthYear(day) { return new Date(GENESIS_TS * 1000 + day * 86400 * 1000).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }

  // ════════ COMPARATOR MATH — position-based waiting, post-2014, live ════════
  // Only entries with a full 2-year forward window count, so "wait" and "drawdown within
  // 2 years" are never truncated by the edge of the record.
  var elig = (function () { var a = []; for (var i = 0; i < N; i++) if (S[i].d >= TABLE_CUT && S[i].d <= LAST_D - WAIT_CAP) a.push(i); return a; })();

  // Per-entry: did waiting for a ≥0.15-lower position (within 2yr) get MORE Bitcoin? how deep
  // did price fall? "BTC acquired" = 1/price, so a lower price = more coins for the same dollars.
  function entryMetrics(i) {
    var d0 = S[i].d, p0 = S[i].p, P = S[i].pos, end = d0 + WAIT_CAP;
    var waitPrice = null, waitDay = null, arrived = false, j;
    for (j = i + 1; j < N && S[j].d <= end; j++) { if (S[j].pos <= P - DROP) { waitPrice = S[j].p; waitDay = S[j].d; arrived = true; break; } }
    if (!arrived) { waitPrice = realPriceAt(end); waitDay = end; }   // waiting failed → deploy at the 2yr price
    var ratio = p0 / waitPrice;                                      // coins(wait)/coins(now) = (1/waitPrice)/(1/p0)
    var trough = p0; for (j = i + 1; j < N && S[j].d <= end; j++) if (S[j].p < trough) trough = S[j].p;
    var depth = trough / p0 - 1;                                     // ≤ 0
    return { i: i, d0: d0, p0: p0, P: P, waitPrice: waitPrice, waitDay: waitDay, ratio: ratio, paid: ratio > 1, arrived: arrived, waitLen: arrived ? (waitDay - d0) : null, depth: depth, hadDD: depth <= -DD_THRESH };
  }

  // Metrics over a sliding band around position P (widen if a high/sparse band is thin).
  function bandMetrics(P) {
    var half = 0.075, set = [], t;
    for (t = 0; t < 8; t++) { set = elig.filter(function (i) { return Math.abs(S[i].pos - P) <= half; }); if (set.length >= 8) break; half += 0.03; }
    if (!set.length) return null;
    var M = set.map(entryMetrics), n = M.length;
    var arrivedLens = M.filter(function (m) { return m.arrived; }).map(function (m) { return m.waitLen; });
    return {
      n: n, half: half,
      paid: M.filter(function (m) { return m.paid; }).length / n * 100,
      ratio: median(M.map(function (m) { return m.ratio; })),
      condRatio: (function () {
        var arr = M.filter(function (m) { return m.arrived; }).map(function (m) { return m.ratio; });
        return arr.length ? median(arr) : null;
      })(),
      nArrived: M.filter(function (m) { return m.arrived; }).length,
      ddProb: M.filter(function (m) { return m.hadDD; }).length / n * 100,
      ddDepth: median(M.map(function (m) { return m.depth; })) * 100,
      never: M.filter(function (m) { return !m.arrived; }).length / n * 100,
      waitLen: arrivedLens.length ? median(arrivedLens) : null,
      entries: set,
      metrics: M
    };
  }

  window.ChannelEntries = {
    SPAN: SPAN, posOf: posOf, ratioOf: ratioOf,
    N: N, FIRST_D: FIRST_D, LAST_D: LAST_D, todayD: todayD,
    YEAR_D: YEAR_D, MONTH_D: MONTH_D,
    TABLE_CUT: TABLE_CUT, WAIT_CAP: WAIT_CAP, DROP: DROP, DD_THRESH: DD_THRESH,
    S: S, elig: elig,
    realPriceAt: realPriceAt, median: median, monthYear: monthYear,
    entryMetrics: entryMetrics, bandMetrics: bandMetrics
  };
})();
