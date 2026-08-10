/* ============================================================
   The Bitcoin Dashboard — live tile computation
   ============================================================
   Reads the shared power-law-data.js globals (loaded immediately
   before this file in page_scripts): PL_A/PL_B/PL_FLOOR/PL_CEIL,
   GENESIS_TS, TODAY_DAYS, TODAY_PRICE, PL_DATA, plPrice,
   positionLabel, fetchTodayPrice, todayPriceIsLive/Label/Note.

   Fence (v1–v3): ZERO new data sources. Every number is derived
   from PL_DATA + spot at runtime; nothing is hardcoded.

   Tiles: channel position (hero) · price · trend price today ·
   below-trend streak+record (with a record-pace projection) ·
   implied trend doubling · implied reversion rate (ports
   /discount-or-premium's depth-matched wait-to-trend record) ·
   below-trend share · below the all-time high · behind the
   trend's schedule · 10-year trend hurdle. The [data-pos-carry]
   links receive today's channel position via the EXISTING ?pos=
   schema (wait-or-deploy-now, how-much-cash) — no new receivers.
============================================================ */
(function () {
  if (typeof plPrice !== 'function' || typeof TODAY_DAYS !== 'number') return;

  // ── helpers ──
  function $(id) { return document.getElementById(id); }
  function setText(id, txt) { var el = $(id); if (el) el.textContent = txt; }
  function setHTML(id, html) { var el = $(id); if (el) el.innerHTML = html; }
  function usd0(x) { return (isFinite(x) && x > 0) ? '$' + Math.round(x).toLocaleString('en-US') : '$—'; }
  function usdK(x) { return (isFinite(x) && x > 0) ? '$' + (Math.round(x / 1000) * 1000).toLocaleString('en-US') : '$—'; }
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function fmtPct(x) { var p = x * 100; var r = (Math.abs(p) >= 1000) ? Math.round(p / 100) * 100 : Math.round(p); return r.toLocaleString('en-US') + '%'; }
  var YEAR_D = 365.25, MONTH_D = 30.4375, DOP_MONTH = 30.44; // DOP_MONTH matches /discount-or-premium's YEARS_MO
  function fmtMonthYear(days) {
    try { return new Date((GENESIS_TS + days * 86400) * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); }
    catch (e) { return ''; }
  }
  function fmtMonths(m) { return (m >= 18) ? (m / 12).toFixed(1) + ' yr' : (m < 10 ? m.toFixed(1) : String(Math.round(m))) + ' mo'; }
  var LOG_LO = Math.log(PL_FLOOR), LOG_HI = Math.log(PL_CEIL), LOG_RANGE = LOG_HI - LOG_LO;
  // ×-trend multiple → shared log-space channel position (0 = floor, 1 = upper band)
  function posFromMult(mult) { return (Math.log(mult) - LOG_LO) / LOG_RANGE; }

  var trend = plPrice(TODAY_DAYS);

  // ── TREND PRICE TODAY, with floor + upper band (static) ──
  setText('dashTrend', usd0(trend));
  setText('dashFloor', usd0(trend * PL_FLOOR));
  setText('dashUpper', usd0(trend * PL_CEIL));

  // ── BELOW-TREND SHARE OF HISTORY (counted live; samples defined inline) ──
  var below = 0, total = 0;
  for (var i = 0; i < PL_DATA.length; i++) {
    var t = plPrice(PL_DATA[i][0]);
    if (t > 0) { total++; if (PL_DATA[i][1] < t) below++; }
  }
  var share = total ? below / total : 0;
  setText('dashBelowPct', Math.round(share * 100) + '%');
  setText('dashBelowCount', below.toLocaleString('en-US') + ' of ' + total.toLocaleString('en-US') + ' price samples — one every ~12 days since 2010');
  var fill = $('dashBelowFill'); if (fill) fill.style.width = (share * 100).toFixed(1) + '%';

  // ── IMPLIED TREND DOUBLING — the age-growth constant, dollar pair (from PL_B) ──
  var constant = Math.pow(2, 1 / PL_B) - 1;   // ~12.76%, same at every point on the curve
  var daysToDouble = TODAY_DAYS * constant;
  setText('dashConstant', (constant * 100).toFixed(2) + '%');
  setText('dashDoublePair', usd0(trend) + ' → ' + usd0(trend * 2));
  setText('dashDoubleWhen', 'around ' + fmtMonthYear(TODAY_DAYS + daysToDouble) + ' · ≈ ' + (daysToDouble / YEAR_D).toFixed(1) + ' years');

  // ── 10-YEAR STRUCTURAL TREND HURDLE: (trend(t+10y)/trend(t))^(1/10)-1
  //    = ((t + 3652.5)/t)^(PL_B/10) - 1 — the Hurdle Rate's trendCAGR(10). ──
  var hurdle10 = Math.pow((TODAY_DAYS + YEAR_D * 10) / TODAY_DAYS, PL_B / 10) - 1;
  setText('dashHurdle10', (hurdle10 * 100).toFixed(1) + '%');

  // ── ALL-TIME HIGH from PL_DATA (live spot folds into the max at render) ──
  var athFromData = 0, athDayFromData = 0;
  for (var ai = 0; ai < PL_DATA.length; ai++) { if (PL_DATA[ai][1] > athFromData) { athFromData = PL_DATA[ai][1]; athDayFromData = PL_DATA[ai][0]; } }

  // ── BELOW-TREND STREAK — continuous ELAPSED TIME (day-spans → months), not
  //    sample counts (PL_DATA is a ~12-day grid). Distribution + the current run's
  //    start are spot-independent; the current streak folds in the live spot at render. ──
  var streakStartDay = TODAY_DAYS, longestRunDays = 0;
  (function () {
    var b = [], j;
    for (j = 0; j < PL_DATA.length; j++) b.push(PL_DATA[j][1] < plPrice(PL_DATA[j][0]));
    var durs = [], s = -1;
    for (j = 0; j < b.length; j++) {
      if (b[j]) { if (s < 0) s = j; }
      else if (s >= 0) { durs.push(PL_DATA[j - 1][0] - PL_DATA[s][0]); s = -1; }
    }
    if (s >= 0) durs.push(PL_DATA[b.length - 1][0] - PL_DATA[s][0]);
    durs.sort(function (a, c) { return a - c; });
    if (durs.length) {
      longestRunDays = durs[durs.length - 1];
      var mid = durs.length % 2 ? durs[(durs.length - 1) / 2] : (durs[durs.length / 2 - 1] + durs[durs.length / 2]) / 2;
      setText('dashStreakLongest', fmtMonths(longestRunDays / MONTH_D));
      setText('dashStreakMedian', fmtMonths(mid / MONTH_D));
    }
    var t = -1;
    for (j = b.length - 1; j >= 0; j--) { if (b[j]) t = j; else break; }
    if (t >= 0) streakStartDay = PL_DATA[t][0];
  })();

  // Record-pace projection: if the current run lasted as long as the record.
  // "would end around" — never a target. Spot-independent (current run start + record length).
  (function () {
    if (longestRunDays <= 0) return;
    var endDay = streakStartDay + longestRunDays;
    setHTML('dashStreakProj', 'If this stretch ran as long as the record, it <strong>would end around '
      + fmtMonthYear(endDay) + '</strong> — when the trend line will sit near ' + usdK(plPrice(endDay)) + '.');
  })();

  // ── position bar: trend tick + its label at the true 1.0× position ──
  var posTrendPct = clamp01(posFromMult(1)) * 100;
  var trendTick = $('dashPosTrendTick'); if (trendTick) trendTick.style.left = posTrendPct + '%';
  var trendLab = document.querySelector('.dash-posbar-lab-trend'); if (trendLab) trendLab.style.left = posTrendPct + '%';

  // Last PL_DATA sample date — the fallback provenance for the price tile.
  var lastSampleDate = fmtMonthYear(PL_DATA[PL_DATA.length - 1][0]);
  try { lastSampleDate = new Date((GENESIS_TS + PL_DATA[PL_DATA.length - 1][0] * 86400) * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) {}

  // ── IMPLIED REVERSION RATE — port of /discount-or-premium's scanDurations
  //    (discount branch): completed times-to-trend from samples at least as deep as
  //    today's multiple, band-widened in 0.05 steps toward 1.0 only if <5 completed.
  //    Returns fastest/median/longest in months (matches the d-or-p record set). ──
  function sampleMult(idx) { return PL_DATA[idx][1] / plPrice(PL_DATA[idx][0]); }
  function reversionRecord(price) {
    var m = price / trend;
    if (m >= 0.95) return { nCompleted: 0, notDiscount: true }; // not a discount (dead band / above trend)
    function regainAfter(idx) { for (var j = idx + 1; j < PL_DATA.length; j++) { if (sampleMult(j) >= 1.0) return j; } return -1; }
    var band = m, comp = [], guard = 0, k, r;
    while (true) {
      comp = [];
      for (k = 0; k < PL_DATA.length; k++) {
        if (sampleMult(k) <= band) { r = regainAfter(k); if (r >= 0) comp.push((PL_DATA[r][0] - PL_DATA[k][0]) / DOP_MONTH); }
      }
      if (comp.length >= 5 || guard >= 12) break;
      band += 0.05; guard++;
      if (band >= 0.95) break;
    }
    comp.sort(function (a, b) { return a - b; });
    if (!comp.length) return { nCompleted: 0 };
    var med = comp.length % 2 ? comp[(comp.length - 1) / 2] : (comp[comp.length / 2 - 1] + comp[comp.length / 2]) / 2;
    return { min: comp[0], median: med, max: comp[comp.length - 1], nCompleted: comp.length, band: band, widened: Math.abs(band - m) > 1e-9 };
  }
  function renderReversion(price) {
    var rec = reversionRecord(price);
    if (!rec || rec.nCompleted === 0) {
      setText('dashRevMedian', rec && rec.notDiscount ? 'n/a' : '—');
      setText('dashRevMedianSub', rec && rec.notDiscount ? 'shown when price is below trend' : '');
      setText('dashRevRange', '');
      return;
    }
    // CAGR implied by spot reaching trend(t+T) in time T (years) — for each historical wait.
    function cagr(months) { var T = months / 12; return Math.pow(plPrice(TODAY_DAYS + T * YEAR_D) / price, 1 / T) - 1; }
    setText('dashRevMedian', '~' + fmtPct(cagr(rec.median)) + '/yr');
    setText('dashRevMedianSub', 'if price reached trend at the median pace on record (~' + Math.round(rec.median)
      + ' months) from a depth like today’s');
    var range = 'range ~' + fmtPct(cagr(rec.max)) + '/yr (~' + Math.round(rec.max) + ' mo, slowest) to ~'
      + fmtPct(cagr(rec.min)) + '/yr (~' + Math.round(rec.min) + ' mo, the fastest snap-back) · '
      + rec.nCompleted + ' completed episodes on record';
    if (rec.widened) range += ' · few at exactly today’s depth, so widened to ≤' + rec.band.toFixed(2) + '×';
    setText('dashRevRange', range);
  }

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

  // ── SPOT-DEPENDENT tiles — render the seed, then the live fetch ──
  function render(price, source) {
    var live = (typeof todayPriceIsLive === 'function') ? todayPriceIsLive(source) : (source === 'live');

    // PRICE — badge (canon: date always; "(live)" only on a real fetch) + dynamic derivation line
    setText('dashPrice', usd0(price));
    var badge = (typeof todayPriceLabel === 'function') ? todayPriceLabel(source) : (live ? 'Today (live)' : 'Today (latest monthly data)');
    var today = ''; try { today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch (e) {}
    setText('dashPriceLabel', today ? (badge + ' · ' + today) : badge);
    setText('dashPriceDeriv', live ? 'Fetched live on page load.' : ('Live fetch unavailable — showing the latest sample (' + lastSampleDate + ').'));
    var priceTile = $('dashPriceTile'); if (priceTile) priceTile.classList.toggle('is-live', !!live);

    if (price > 0) {
      // BEHIND THE TREND'S SCHEDULE — time-first. d* solves A·d^B = price → d* = (price/A)^(1/B).
      var dStar = Math.pow(price / PL_A, 1 / PL_B);
      var deltaYrs = (dStar - TODAY_DAYS) / YEAR_D;
      setText('dashTrendWasYears', Math.abs(deltaYrs).toFixed(1) + ' years');
      if (dStar <= TODAY_DAYS) {
        setText('dashTrendWasEyebrow', 'Behind the trend’s schedule');
        setText('dashTrendWasSub', 'today’s price is where the trend line sat in ' + fmtMonthYear(dStar));
      } else {
        setText('dashTrendWasEyebrow', 'Ahead of schedule');
        setText('dashTrendWasSub', 'the trend line is expected to reach today’s price in ' + fmtMonthYear(dStar));
      }

      // BELOW THE ALL-TIME HIGH — descriptive; at-ATH and new-ATH branches (neither renders today)
      if (price >= athFromData) {
        setText('dashAthPct', '0%');
        if (price > athFromData) {
          setText('dashAthWhen', 'a new all-time high — today');
          setText('dashAthNote', 'The live spot is the highest level in this ~12-day series, above the prior high of ' + usd0(athFromData) + ' (' + fmtMonthYear(athDayFromData) + ').');
        } else {
          setText('dashAthWhen', 'at the all-time high');
          setText('dashAthNote', 'Price is level with its highest recorded close, ' + usd0(athFromData) + ' (' + fmtMonthYear(athDayFromData) + ').');
        }
      } else {
        setText('dashAthPct', ((athFromData - price) / athFromData * 100).toFixed(1) + '% below');
        setText('dashAthWhen', usd0(athFromData) + ', ' + fmtMonthYear(athDayFromData));
        setText('dashAthNote', 'The highest close in this ~12-day series; brief intraday spikes may sit slightly higher. (ATH − today) ÷ ATH.');
      }

      // BELOW-TREND STREAK — current open run (spot decides whether it is open)
      if (price < trend) setText('dashStreakNow', fmtMonths((TODAY_DAYS - streakStartDay) / MONTH_D));
      else setText('dashStreakNow', 'none now');

      // IMPLIED REVERSION RATE (depth-matched to today's position)
      renderReversion(price);
    }

    // CHANNEL POSITION — multiple + shared zone word + bar marker (below-floor: marker clamps to
    // track start, positionLabel returns a below-floor word, multiple still shows exactly)
    if (trend > 0 && price > 0) {
      var mult = price / trend;
      var pos = posFromMult(mult);
      setText('dashMult', mult.toFixed(2));
      if (typeof positionLabel === 'function') setText('dashZone', positionLabel(pos));
      var marker = $('dashPosMarker'); if (marker) marker.style.left = (clamp01(pos) * 100) + '%';
      setText('dashPosProv', (live ? 'live spot' : 'latest sample') + ' ÷ trend');
      var posTile = $('dashPosTile'); if (posTile) posTile.classList.toggle('is-live', !!live);
      carryPos(pos);
    }
  }

  // First paint from the seeded TODAY_PRICE (latest sample → not live), then the live fetch.
  if (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0) render(TODAY_PRICE, 'fallback');
  if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (p, source) { render(p, source); });
})();
