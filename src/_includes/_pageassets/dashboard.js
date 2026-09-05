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
  if (!window.ReturnWindow || !window.ReversionDurations) return;   // shared modules must load first
  var RD = window.ReversionDurations;

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

  // ── IMPLIED REVERSION RATE — reads shared/reversion-durations.js, the same
  //    scan Discount-or-Premium and the Rundown use, on the EPISODE basis. ──
  /* THE EPISODE BASIS (JM ruling, 2026-09-04), and the shared scan.

     Two changes at once, because they are the same change. This function was a
     local PORT of Discount-or-Premium's scanDurations, and it took its
     statistics over SAMPLES — every ~12-day observation that qualified. At a
     floor-adjacent position that reported "65 completed" where the record
     holds SIX independent stretches: a tenfold overstatement of how much
     evidence there is, because a long stretch contributes dozens of samples
     and one episode.

     So the port is retired for `shared/reversion-durations.js` — the same
     module Discount-or-Premium and the Rundown read — and the statistics move
     to its `episodes`. Retiring the port is what makes agreement structural
     rather than coincidental: three pages, one scan, one grouping rule.

     Sample-basis figures are still available on the record (`nSamples`,
     `sampleMedian`) and Discount-or-Premium publishes both; this tile leads
     with episodes because its job is to say how much has actually happened. */
  function reversionRecord(price) {
    var m = price / trend;
    var rec = RD.scan(m);
    // The tile is a below-trend read: the dead band and the premium side both
    // fall out here, as they did before.
    if (!rec || rec.state !== 'discount') return { nCompleted: 0, notDiscount: true };

    var closedEps = rec.episodes.filter(function (e) { return !e.ongoing; });
    if (!closedEps.length) return { nCompleted: 0 };
    var durs = closedEps.map(function (e) { return e.months; }).sort(function (a, b) { return a - b; });
    var med = durs.length % 2 ? durs[(durs.length - 1) / 2] : (durs[durs.length / 2 - 1] + durs[durs.length / 2]) / 2;
    return {
      comp: closedEps.map(function (e) {
        return { months: e.months, year: new Date((GENESIS_TS + e.entryD * 86400) * 1000).getUTCFullYear() };
      }),
      min: durs[0], median: med, max: durs[durs.length - 1],
      nCompleted: durs.length,            // EPISODES now, not samples
      // ALL qualifying samples, not just the completed ones — the Rundown
      // prints this same figure, and the two must agree.
      nSamples: rec.nSamples,
      ongoing: rec.episodes.length - closedEps.length,
      band: rec.band, widened: rec.widened
    };
  }
  function renderReversion(price) {
    var rec = reversionRecord(price);
    if (!rec || rec.nCompleted === 0) {
      setText('dashRevMedian', rec && rec.notDiscount ? 'n/a' : '—');
      setText('dashRevMedianSub', rec && rec.notDiscount ? 'shown when price is below trend' : '');
      setText('dashRevRange', '');
      return;
    }
    /* Implied by spot reaching trend(t+T) in time T. This tile already carried
       the right instinct — the fastest resolution has always been shown as a
       duration only, "because annualising a months-long snap-back produces a
       rate that can't honestly be quoted (JM ruling, v3)" — but the test it
       used was IS-FASTEST rather than IS-UNDER-A-YEAR. So whenever the median
       itself fell under twelve months, the tile annualised it anyway: at a
       floor-adjacent position it printed ~228%/yr over ~9 months.

       STYLE_GUIDE §10.3.1 now states the rule site-wide, and the test moves to
       the window length. One helper decides for every figure on the tile
       rather than each call site deciding for itself — that per-call-site
       judgement is exactly what produced the gap. Same shape as
       the-rundown.js windowRead(). */
    /* The DECISION is shared/return-window.js's; the WORDING is this tile's.
       This tile is why that module exists — it had the rule and its own inline
       ruling and still tested for the wrong thing, because the decision lived
       at the call site. It cannot now. */
    var RW = window.ReturnWindow;
    function impliedRead(months) {
      var r = RW.read(months, price);
      return r.annualised_ok
        ? { v: '~' + fmtPct(r.annualised / 100) + '/yr', phrase: '~' + fmtPct(r.annualised / 100) + '/yr' }
        : { v: '~' + fmtPct(r.total / 100) + ' in total', phrase: '~' + fmtPct(r.total / 100) + ' in total, not an annual rate' };
    }
    /* THE THINNESS RULE, NOW THAT IT CAN FIRE (JM ruling, ratified as
       principle: a rule that can never fire has stopped measuring
       independence). On the sample basis the count was always in the dozens,
       so this branch was unreachable; on the episode basis it is reachable at
       shallower depths, and when it fires the tile NAMES the stretches instead
       of publishing a median over one or two of them — the same rule the
       Rundown's position module applies.

       Compact form, because this is a tile and not a module: the count, then
       the durations themselves, then the implied read for the slowest of them
       so the tile still answers "and what would that be worth". No median, no
       spread, no range sentence — those are the statistics the rule exists to
       withhold. */
    if (rec.nCompleted < 3) {
      var names = rec.comp.map(function (c) { return RD.fmtMonths(c.months); }).join(' and ');
      setText('dashRevMedian', impliedRead(rec.max).v);
      setHTML('dashRevMedianSub',
        'if it took the longer of the <strong>' + rec.nCompleted + '</strong> completed stretch' +
        (rec.nCompleted === 1 ? '' : 'es') + ' on record from a depth like today’s — ' + names +
        '. Too few to read a median from, so they are named rather than averaged.');
      setText('dashRevRange', rec.widened
        ? 'Few at exactly today’s depth, so widened to ≤' + rec.band.toFixed(2) + '×.'
        : '');
      return;
    }

    var medRead = impliedRead(rec.median);
    setText('dashRevMedian', medRead.v);
    setText('dashRevMedianSub', 'over ~' + RD.fmtMonths(rec.median) + ' — the median reversion on record from a depth like today’s, and only if it reverts at all');
    // Era note (data-driven, not a filter): do the quickest resolutions cluster in the early era?
    var byDur = rec.comp.slice().sort(function (a, b) { return a.months - b.months; });
    var fastN = Math.max(1, Math.round(byDur.length / 3));
    var fastAllEarly = byDur.slice(0, fastN).every(function (c) { return c.year < 2016; });
    var recent = rec.comp.reduce(function (a, b) { return b.year > a.year ? b : a; }, rec.comp[0]);
    var era = (fastAllEarly && recent.year >= 2020)
      ? ' The quickest resolutions came in bitcoin’s early era (≤2015); the most recent, in ' + recent.year + ', took ~' + Math.round(recent.months) + ' months.'
      : '';
    var range = 'Low end: the slowest reversion, ~' + RD.fmtMonths(rec.max) + ', implies ' + impliedRead(rec.max).phrase
      + '. The quickest resolution from a depth like today’s took ~' + RD.fmtMonths(rec.min) + '.' + era
      /* Round two: the two sister pages stated the same record with different
         totals — this tile counted only CLOSED episodes and COMPLETED samples,
         the Rundown counted all of both including the open one. Neither was
         wrong; they were answering different questions under one label. Both
         now print the same split, so a reader moving between them sees one
         record rather than two. */
      + ' ' + (rec.nCompleted + rec.ongoing) + ' episode' + ((rec.nCompleted + rec.ongoing) === 1 ? '' : 's')
      + ': ' + rec.nCompleted + ' completed, ' + rec.ongoing + ' open'
      + (rec.nSamples ? ' (' + rec.nSamples + ' qualifying samples grouped by the 100-day rule)' : '') + '.';
    if (rec.widened) range += ' Few at exactly today’s depth, so widened to ≤' + rec.band.toFixed(2) + '×.';
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
