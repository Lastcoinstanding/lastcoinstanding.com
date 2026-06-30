/* ============================================================
   Deployment projection — forward lump-vs-ladder path model
   ============================================================
   Lifted out of /lump-sum-or-ladder-in (Stage 2C-①) so the
   projective logic survives the Page 1 refocus and is ready for
   reuse on Page 2 (/your-deployment-plan), which carries the
   forward (projective) view. Page 1 is now retrospective only and
   no longer loads this file; nothing here is dead — it is the
   lifted, reusable core, not deleted code.

   Self-contained: derives its channel-position math and recent-era
   amplitude cap from the shared Power Law globals (PL_A/PL_B,
   PL_FLOOR/PL_CEIL, GENESIS_TS, PL_DATA, plPrice) defined in
   shared/power-law-data.js. Include that file BEFORE this one.

   The model, unchanged from the Stage 2B build:
   forward channel-scenario paths anchored at today, with every
   excursion capped to RECENT-ERA amplitude (post-2023 max channel
   position) so the projection can never import early-era,
   un-repeatable swings (design §4.5). All advantage figures are a
   ratio of BTC accumulated, so they are amount-invariant.

   Exposes a single global namespace, DeploymentProjection:
     .PATHS                         — [{key,label,color}, …]
     .pathPos(key, startPos, u)     — channel position along a path
     .simFwdAdv(startPos, key, n)   — % more BTC laddering vs all-now
     .projectiveCurve(key, n)       — [{x:channelPos, y:advantage}]
     .TREND_POS / .RECENT_MAX       — derived constants (read-only)
============================================================ */
var DeploymentProjection = (function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return null;

  var AMBER = '#e09422', BLUE = '#6db3d4', RUST = '#c0392b';

  // ── Channel-position math (log-space, floor→ceiling) ──
  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function ratioOf(pos) { return Math.exp(pos * SPAN + LF); }   // channel pos → price/trend ratio
  var TREND_POS = (0 - LF) / SPAN;                              // channel position of the trend line (ratio = 1.0)

  // ── Recent-era amplitude cap (design §4.5): the largest channel
  //    position reached post-2023, so forward excursions stay sized
  //    to the compressed recent regime, never 2013's blow-off. ──
  var RECENT_MAX = (function () {
    var mx = -Infinity;
    for (var i = 0; i < PL_DATA.length; i++) {
      var d = PL_DATA[i][0], p = PL_DATA[i][1];
      var yr = new Date(GENESIS_TS * 1000 + d * 86400 * 1000).getUTCFullYear();
      if (yr >= 2023) {
        var pos = (Math.log(p / plPrice(d)) - LF) / SPAN;
        if (pos > mx) mx = pos;
      }
    }
    return mx > -Infinity ? mx : 0.53;
  })();

  function todayDays() { return (Date.now() / 1000 - GENESIS_TS) / 86400; }

  var PATHS = [
    { key: 'revert', label: 'Revert to trend', color: AMBER },
    { key: 'floor', label: 'Ride the floor', color: RUST },
    { key: 'stretch', label: 'Stretch, then revert', color: BLUE }
  ];

  // channel position along a forward path, u in [0,1] across the ladder window
  function pathPos(key, startPos, u) {
    if (key === 'revert') return startPos + (TREND_POS - startPos) * u;
    if (key === 'floor') return startPos + (0 - startPos) * u;
    var peak = Math.min(RECENT_MAX, Math.max(startPos, startPos + 0.28)); // recent-amplitude-capped
    return (u <= 0.4) ? startPos + (peak - startPos) * (u / 0.4) : peak + (TREND_POS - peak) * ((u - 0.4) / 0.6);
  }

  var FWD_STEP_D = 12.16;            // ~ PL_DATA cadence

  // ladder-in advantage if you enter TODAY at channel position startPos and price
  // follows `key` over the ladder window. Amount-invariant. Anchored at today.
  function simFwdAdv(startPos, key, ladderN) {
    var today = todayDays();
    var steps = Math.max(2, ladderN), p0 = plPrice(today) * ratioOf(startPos), sumInv = 0;
    for (var k = 0; k < steps; k++) {
      var u = k / (steps - 1);
      sumInv += 1 / (plPrice(today + k * FWD_STEP_D) * ratioOf(pathPos(key, startPos, u)));
    }
    return ((sumInv / steps) / (1 / p0) - 1) * 100;
  }

  function projectiveCurve(key, ladderN) {
    var pts = [];
    for (var g = 0; g <= 1.0001; g += 0.02) pts.push({ x: +g.toFixed(4), y: simFwdAdv(g, key, ladderN) });
    return pts;
  }

  return {
    PATHS: PATHS,
    pathPos: pathPos,
    simFwdAdv: simFwdAdv,
    projectiveCurve: projectiveCurve,
    TREND_POS: TREND_POS,
    RECENT_MAX: RECENT_MAX,
    FWD_STEP_D: FWD_STEP_D
  };
})();
