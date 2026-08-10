/* ============================================================
   The Bitcoin Dashboard — live tile computation
   ============================================================
   Reads the shared power-law-data.js globals (loaded immediately
   before this file in page_scripts): PL_A/PL_B/PL_FLOOR/PL_CEIL,
   GENESIS_TS, TODAY_DAYS, TODAY_PRICE, plPrice, positionLabel,
   fetchTodayPrice, todayPriceIsLive/Label/Note.

   Fence (v1 + v2): ZERO new data sources. Every number below is
   derived from PL_DATA + spot; nothing is hardcoded. v2 adds four
   tiles (price-is-where-trend-was, below-trend streak+record,
   10-year trend hurdle, drawdown-from-ATH), the live price-badge
   date, and the position-marker pulse — all still live-computed.
   Original five tiles:
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
  setText('dashBelowCount', below.toLocaleString('en-US') + ' of ' + total.toLocaleString('en-US') + ' samples');
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

  // ═══════ V2 TILES — still all live-computed from the shared globals ═══════
  var YEAR_D = 365.25, MONTH_D = 30.4375;
  function fmtMonthYear(days) {
    try { return new Date((GENESIS_TS + days * 86400) * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
    catch (e) { return ''; }
  }
  // months → "N.N mo" under 18 months, "N.N yr" beyond, so long records stay legible
  function fmtMonths(m) { return (m >= 18) ? (m / 12).toFixed(1) + ' yr' : (m < 10 ? m.toFixed(1) : String(Math.round(m))) + ' mo'; }

  // ── TILE c — 10-year structural trend hurdle: (trend(t+10y)/trend(t))^(1/10)-1
  //    = ((t + 3652.5)/t)^(PL_B/10) - 1 — the Hurdle Rate's trendCAGR(10) primitive,
  //    so the two pages quote the same structural bar. Spot-independent. ──
  var hurdle10 = Math.pow((TODAY_DAYS + YEAR_D * 10) / TODAY_DAYS, PL_B / 10) - 1;
  setText('dashHurdle10', (hurdle10 * 100).toFixed(1) + '%');

  // ── TILE d — all-time high from PL_DATA (the live spot folds into the max at render) ──
  var athFromData = 0, athDayFromData = 0;
  for (var ai = 0; ai < PL_DATA.length; ai++) { if (PL_DATA[ai][1] > athFromData) { athFromData = PL_DATA[ai][1]; athDayFromData = PL_DATA[ai][0]; } }

  // ── TILE b — below-trend runs as continuous ELAPSED TIME (day-spans → months),
  //    NOT sample counts: PL_DATA is ~12-day-spaced despite the module's "monthly"
  //    comment, so a 72-sample run is ~28 months. Distribution is spot-independent;
  //    the current open streak folds in the live spot at render. ──
  var streakStartDay = TODAY_DAYS;
  (function () {
    var below = [], i;
    for (i = 0; i < PL_DATA.length; i++) below.push(PL_DATA[i][1] < plPrice(PL_DATA[i][0]));
    var durs = [], s = -1;
    for (i = 0; i < below.length; i++) {
      if (below[i]) { if (s < 0) s = i; }
      else if (s >= 0) { durs.push(PL_DATA[i - 1][0] - PL_DATA[s][0]); s = -1; }
    }
    if (s >= 0) durs.push(PL_DATA[below.length - 1][0] - PL_DATA[s][0]); // trailing (historical part)
    durs.sort(function (a, b) { return a - b; });
    if (durs.length) {
      var longest = durs[durs.length - 1];
      var mid = durs.length % 2 ? durs[(durs.length - 1) / 2] : (durs[durs.length / 2 - 1] + durs[durs.length / 2]) / 2;
      setText('dashStreakLongest', fmtMonths(longest / MONTH_D));
      setText('dashStreakMedian', fmtMonths(mid / MONTH_D));
    }
    var t = -1;
    for (i = below.length - 1; i >= 0; i--) { if (below[i]) t = i; else break; }
    if (t >= 0) streakStartDay = PL_DATA[t][0];
  })();

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

    // TILE 2 — price + badge "<Today (live) | Today (latest monthly data)> · <Month D, YYYY>".
    // Labeling canon: the date ALWAYS shows; "(live)" only when the fetch actually resolved.
    setText('dashPrice', usd0(price));
    var badge = (typeof todayPriceLabel === 'function') ? todayPriceLabel(source) : (live ? 'Today (live)' : 'Today (latest monthly data)');
    var today = ''; try { today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) {}
    setText('dashPriceLabel', today ? (badge + ' · ' + today) : badge);
    var priceTile = $('dashPriceTile'); if (priceTile) priceTile.classList.toggle('is-live', !!live);

    if (price > 0) {
      // TILE a — price is where trend was: d* solves A·d^B = price → d* = (price/A)^(1/B).
      // Below trend → d* in the past; above trend → d* in the future. Both coded; only the
      // below-trend branch renders while price sits under trend today.
      var dStar = Math.pow(price / PL_A, 1 / PL_B);
      var deltaYrs = (dStar - TODAY_DAYS) / YEAR_D;
      setText('dashTrendWasDate', fmtMonthYear(dStar));
      if (dStar <= TODAY_DAYS) {
        setText('dashTrendWasEyebrow', 'Price is where trend was');
        setText('dashTrendWasAgo', '· ' + Math.abs(deltaYrs).toFixed(1) + ' years ago');
      } else {
        setText('dashTrendWasEyebrow', 'Price is ahead of trend');
        setText('dashTrendWasAgo', '· where the trend is expected to reach it, ~' + deltaYrs.toFixed(1) + ' years ahead');
      }

      // TILE d — below the all-time high (fold the live spot into the max; descriptive only)
      var athP = athFromData, athD = athDayFromData;
      if (price > athP) { athP = price; athD = TODAY_DAYS; }
      setText('dashAthPct', (athP > 0 ? ((athP - price) / athP * 100) : 0).toFixed(1) + '% below');
      setText('dashAthWhen', athD === TODAY_DAYS ? 'reached today' : 'reached ' + fmtMonthYear(athD));

      // TILE b — current open streak: how long price has been continuously below trend (spot decides)
      if (price < trend) setText('dashStreakNow', fmtMonths((TODAY_DAYS - streakStartDay) / MONTH_D));
      else setText('dashStreakNow', 'none now');
    }

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
