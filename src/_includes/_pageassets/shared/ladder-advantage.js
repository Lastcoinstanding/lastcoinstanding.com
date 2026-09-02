/* =============================================================
   shared/ladder-advantage.js — the position-conditioned lump-vs-ladder record

   EXTRACTED FROM `lump-sum-or-ladder-in.js` (2026-09-01, Rundown v2 Phase 2b,
   JM ruling 3: "the source page adopting each extracted component back so
   there is one copy in the codebase"). Lump Sum or Ladder In now calls this
   module rather than carrying its own copy; The Rundown's D2 snack calls the
   same functions, so the echo and its canonical home cannot drift.

   Requires shared/power-law-data.js first (PL_DATA, plPrice, PL_FLOOR,
   PL_CEIL, GENESIS_TS). Pure — no DOM, no page state. Exposes
   window.LadderAdvantage.

   ── WHAT IT MEASURES ──
   ladderAdvantage(i, N) is the coin-count difference between two ways of
   deploying the SAME sum starting at sample i: all of it at once, or an equal
   slice at each of the next N samples. It returns a percentage, and it is
   amount-invariant — the sum cancels in the ratio, which is why no dollar
   figure is needed to compute it.

   bucketAt() then pools that result over every historical entry whose CHANNEL
   POSITION sits within WIN of a given position. That is what makes this a
   position-conditioned record rather than a date-conditioned one, and it is
   the reason the module is worth sharing: it answers "from a position like
   this one," which is the only question The Rundown asks.

   ── TWO COMPATIBILITY NOTES, BOTH LOAD-BEARING ──

   1. `S` here is built exactly as `shared/channel-entries.js` builds its own:
      the same PL_DATA, the same log-space posOf. The two arrays are
      index-aligned and interchangeable for these functions. What this module
      does NOT do is adopt ChannelEntries' `elig` / `TABLE_CUT` filter — era
      selection here is the caller's explicit choice via `era`, because Lump
      Sum or Ladder In has always defaulted to the full record and changing
      that would move its published figures.

   2. `bucketAt` uses a FIXED window and returns {n:0} when the band is thin.
      `ChannelEntries.bandMetrics` starts at the same 0.075 half-width but
      WIDENS until it has eight samples. A page rendering both must say so
      rather than let the reader assume one neighbourhood — The Rundown does,
      in D2's sources line.
   ============================================================= */
(function () {
  'use strict';
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function posOf(price, days) { return (Math.log(price / plPrice(days)) - LF) / SPAN; }

  var N = PL_DATA.length;
  var S = new Array(N);
  for (var i = 0; i < N; i++) {
    S[i] = { d: PL_DATA[i][0], p: PL_DATA[i][1], pos: posOf(PL_DATA[i][1], PL_DATA[i][0]) };
  }
  var MIN_D = S[0].d;

  var WIN = 0.075;   // channel-position half-window for binning entries

  function eraStartDay(era) {
    if (era === 'post-2017') return (Date.UTC(2017, 0, 1) / 1000 - GENESIS_TS) / 86400;
    if (era === 'post-2020') return (Date.UTC(2020, 0, 1) / 1000 - GENESIS_TS) / 86400;
    return MIN_D - 1; // full
  }

  // returns (ladder_BTC / lump_BTC - 1) * 100  (positive = laddering got MORE BTC)
  function ladderAdvantage(i, ladderN) {
    if (i + ladderN - 1 > N - 1) return null;
    var lumpBtc = 1 / S[i].p;            // sum cancels in the ratio — amount-invariant
    var each = 1 / ladderN, dca = 0;
    for (var k = 0; k < ladderN; k++) dca += each / S[i + k].p;
    return (dca / lumpBtc - 1) * 100;
  }

  // mean ladder-advantage + win-rate over entries within WIN of position p
  function bucketAt(era, ladderN, p) {
    var startD = eraStartDay(era), vals = [];
    for (var i = 0; i < N; i++) {
      if (S[i].d < startD) continue;
      if (Math.abs(S[i].pos - p) > WIN) continue;
      var a = ladderAdvantage(i, ladderN);
      if (a !== null) vals.push(a);
    }
    if (!vals.length) return { n: 0 };
    var m = 0, wins = 0;
    for (var v = 0; v < vals.length; v++) { m += vals[v]; if (vals[v] > 0) wins++; }
    return { n: vals.length, mean: m / vals.length, win: 100 * wins / vals.length };
  }

  // advantage curve across channel position (binned, sliding window)
  function advantageCurve(era, ladderN) {
    var pts = [];
    for (var g = -0.10; g <= 1.151; g += 0.025) {
      var b = bucketAt(era, ladderN, g);
      if (b.n >= 4) pts.push({ x: +g.toFixed(4), y: b.mean });
    }
    return pts;
  }

  // The set of entry indices a bucket is built from — The Rundown's D2 snack
  // reads it to date-stamp the matched set in its sources line. Additive:
  // nothing existing calls it, so no published figure moves.
  function bucketEntries(era, ladderN, p) {
    var startD = eraStartDay(era), out = [];
    for (var i = 0; i < N; i++) {
      if (S[i].d < startD) continue;
      if (Math.abs(S[i].pos - p) > WIN) continue;
      if (ladderAdvantage(i, ladderN) !== null) out.push(i);
    }
    return out;
  }

  window.LadderAdvantage = {
    S: S, N: N, WIN: WIN, MIN_D: MIN_D,
    posOf: posOf,
    eraStartDay: eraStartDay,
    ladderAdvantage: ladderAdvantage,
    bucketAt: bucketAt,
    advantageCurve: advantageCurve,
    bucketEntries: bucketEntries
  };
})();
