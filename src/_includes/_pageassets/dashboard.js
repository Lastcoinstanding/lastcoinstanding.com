/* ============================================================
   The Bitcoin Dashboard — live tile computation
   ============================================================
   Reads the shared power-law-data.js globals (loaded immediately
   before this file in page_scripts): PL_A/PL_B/PL_FLOOR/PL_CEIL,
   GENESIS_TS, TODAY_DAYS, TODAY_PRICE, plPrice, positionLabel,
   fetchTodayPrice, todayPriceIsLive/Label/Note.

   V1 fence: ZERO new data sources. Every number below is derived
   from PL_DATA + spot; nothing is hardcoded. Five tiles:
     1  Channel position  — spot ÷ trend, named by the SHARED
        positionLabel() (this page is that vocabulary's 6th consumer;
        no new zone-family wording — TECH_DEBT position-label entry)
     2  Bitcoin price      — fetchTodayPrice(), provenance strictly
        via the todayPrice* helpers ("live" only on a real fetch)
     3  Trend price today  — plPrice(TODAY_DAYS), with floor + upper
     4  Below-trend share  — counted live across PL_DATA (not hardcoded)
     5  Days to double + the ~12.76% constant — both from PL_B

   The jump-back-in links tagged [data-pos-carry] receive today's
   log-space channel position via the EXISTING ?pos= schema
   (wait-or-deploy-now, how-much-cash) — no new receivers.
============================================================ */
(function () {
  if (typeof plPrice !== 'function' || typeof TODAY_DAYS !== 'number') return;

  // ── helpers ──
  function $(id) { return document.getElementById(id); }
  function setText(id, txt) { var el = $(id); if (el) el.textContent = txt; }
  function usd0(x) { return (isFinite(x) && x > 0) ? '$' + Math.round(x).toLocaleString('en-US') : '$—'; }
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  var LOG_LO = Math.log(PL_FLOOR), LOG_HI = Math.log(PL_CEIL), LOG_RANGE = LOG_HI - LOG_LO;
  // Map a ×-trend multiple to the shared log-space channel position (0 = floor
  // at PL_FLOOR×, 1 = upper band at PL_CEIL×) — the exact transform the ribbon
  // and the trilogy use, so positionLabel() here agrees with the rest of the site.
  function posFromMult(mult) { return (Math.log(mult) - LOG_LO) / LOG_RANGE; }

  var trend = plPrice(TODAY_DAYS);

  // ── TILE 3 — trend price today, with floor + upper band (static) ──
  setText('dashTrend', usd0(trend));
  setText('dashFloor', usd0(trend * PL_FLOOR));
  setText('dashUpper', usd0(trend * PL_CEIL));

  // ── TILE 4 — below-trend share of history (counted live from PL_DATA) ──
  var below = 0, total = 0;
  for (var i = 0; i < PL_DATA.length; i++) {
    var t = plPrice(PL_DATA[i][0]);
    if (t > 0) { total++; if (PL_DATA[i][1] < t) below++; }
  }
  var share = total ? below / total : 0;
  setText('dashBelowPct', Math.round(share * 100) + '%');
  setText('dashBelowCount', below.toLocaleString('en-US') + ' of ' + total.toLocaleString('en-US') + ' monthly samples');
  var fill = $('dashBelowFill'); if (fill) fill.style.width = (share * 100).toFixed(1) + '%';

  // ── TILE 5 — days to double + the age-growth constant (both from PL_B) ──
  // The trend A·days^B doubles when age grows by 2^(1/B); the constant is that
  // fraction minus one (~12.76%), the same at every point on the curve. The
  // day-count is that fraction of today's age — so it lengthens as bitcoin ages.
  var growFactor = Math.pow(2, 1 / PL_B);
  var constant = growFactor - 1;
  var daysToDouble = TODAY_DAYS * constant;
  setText('dashConstant', (constant * 100).toFixed(2) + '%');
  setText('dashDoubleDays', Math.round(daysToDouble).toLocaleString('en-US') + ' days');
  setText('dashDoubleYears', '≈ ' + (daysToDouble / 365.25).toFixed(1) + ' years');
  try {
    var doubleMs = (GENESIS_TS + (TODAY_DAYS + daysToDouble) * 86400) * 1000;
    setText('dashDoubleDate', 'around ' + new Date(doubleMs).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
  } catch (e) { /* toLocaleDateString unsupported — leave the placeholder */ }

  // ── position bar: place the trend tick + its label at the true 1.0× position ──
  var posTrendPct = clamp01(posFromMult(1)) * 100;
  var trendTick = $('dashPosTrendTick'); if (trendTick) trendTick.style.left = posTrendPct + '%';
  var trendLab = document.querySelector('.dash-posbar-lab-trend'); if (trendLab) trendLab.style.left = posTrendPct + '%';

  // ── pos-carry: append today's channel position to the EXISTING ?pos= receivers ──
  function carryPos(pos) {
    var v = Math.round(pos * 1000) / 1000; // 3dp — matches WODN/HMC encoding
    var cards = document.querySelectorAll('[data-pos-carry]');
    for (var j = 0; j < cards.length; j++) {
      var base = cards[j].getAttribute('data-href') || cards[j].getAttribute('href');
      var hash = '', path = base, h = base.indexOf('#');
      if (h >= 0) { hash = base.slice(h); path = base.slice(0, h); }
      cards[j].setAttribute('href', path + '?pos=' + v + hash);
    }
  }

  // ── TILES 1 & 2 — depend on spot; render the seed, then the live fetch ──
  function render(price, source) {
    var live = (typeof todayPriceIsLive === 'function') ? todayPriceIsLive(source) : (source === 'live');

    // TILE 2 — price + honest provenance label
    setText('dashPrice', usd0(price));
    if (typeof todayPriceLabel === 'function') setText('dashPriceLabel', todayPriceLabel(source));
    var priceTile = $('dashPriceTile'); if (priceTile) priceTile.classList.toggle('is-live', !!live);

    // TILE 1 — channel position (multiple + shared zone word + bar marker)
    if (trend > 0 && price > 0) {
      var mult = price / trend;
      var pos = posFromMult(mult);
      setText('dashMult', mult.toFixed(2));
      if (typeof positionLabel === 'function') setText('dashZone', positionLabel(pos));
      var marker = $('dashPosMarker'); if (marker) marker.style.left = (clamp01(pos) * 100) + '%';
      setText('dashPosProv', (live ? 'live spot' : 'latest monthly data') + ' ÷ trend');
      var posTile = $('dashPosTile'); if (posTile) posTile.classList.toggle('is-live', !!live);
      carryPos(pos);
    }
  }

  // First paint from the seeded TODAY_PRICE (latest monthly sample → not live),
  // so the tiles read honestly even if the fetch never resolves.
  if (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0) render(TODAY_PRICE, 'fallback');
  if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (p, source) { render(p, source); });
})();
