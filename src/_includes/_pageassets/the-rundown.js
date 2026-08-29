/* =============================================================
   The Rundown — page script

   Reads the shared modules and computes nothing of its own that the site
   does not already compute somewhere else:
     shared/power-law-data.js  — PL_DATA, PL_A/PL_B/PL_FLOOR/PL_CEIL,
                                 plPrice, positionLabel, TODAY_DAYS,
                                 TODAY_PRICE, fetchTodayPrice, the
                                 today-price label helpers
     shared/channel-entries.js — ChannelEntries.bandMetrics / posOf /
                                 ratioOf, the position-conditioned record
                                 shared with Wait-or-Deploy and How Much Cash

   ── THE TWO METHODS ON THIS PAGE, AND WHY THEY ARE NEVER MIXED ──
   (RUNDOWN_DESIGN §16.2a, ratified 2026-08-28.)

   1. POOLED — ChannelEntries.bandMetrics(P). Every eligible sample whose
      channel position sits within a widening band of P, treated as one
      set. This is what Wait-or-Deploy and How Much Cash publish, so any
      figure taken from it reproduces on those pages exactly.

   2. ENTRY-ANCHORED — visitOutcomes(). One named historical entry,
      followed forward to fixed horizons by direct lookup against PL_DATA.
      This does NOT reproduce on any source tool, because no source tool
      asks the question. It is the §16.2a exception, and the four
      conditions are met: no shipped tool computes it; it is plain
      arithmetic on canonical data with no parameters and no modelling;
      the method is stated on-page in the row's sources line; and the
      consistency test applies to the stated method exactly.

   A case study's 1y / 2y / 4y figures ALL come from method 2 — including
   1y and 2y, which method 1 could have supplied. Splicing a pooled band
   statistic into a narrated visit would give figures that are
   individually defensible and collectively incoherent. So: one method per
   narrative, and the WODN route is labelled as the pooled exploration
   rather than as verification, because it will not match and should not.

   ── LIVE-COMPUTE-ONLY ──
   No figure on this page is baked into the markup. Every number renders
   from these functions at load, which is why the page adds zero lines to
   MONTHLY_REFRESH_CHECKLIST (§1 fence). The no-JS fallback carries no
   number at all rather than a placeholder (§11).
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;
  if (!window.ChannelEntries) return;

  var CE = window.ChannelEntries;
  var posOf = CE.posOf, ratioOf = CE.ratioOf, bandMetrics = CE.bandMetrics;
  var S = CE.S, N = CE.N, YEAR_D = CE.YEAR_D;

  // ── Floor-visit definition ──────────────────────────────
  // A "floor visit" is an episode in which price came within GRAZE of the
  // 0.42x floor or below it. Both constants are analytical choices and are
  // stated on the page:
  //   GRAZE     — the Floor page's published language is that price has
  //               "approached the line"; 1% is that approach made numeric.
  //   EPISODE_D — the site's existing independent-visit rule, lifted from
  //               discount-or-premium.js so the two pages cannot publish
  //               different visit counts for the same history
  //               (RUNDOWN_DESIGN §4 as amended; 100 days, not 30).
  // Sensitivity (§10): perturbing GRAZE +/-10% leaves the visit count
  // unchanged at four. Recorded in RUNDOWN_PHASE0_REPORT.md.
  var GRAZE = 1.01;
  var EPISODE_D = 100;
  // The genesis era is recorded once and given no weight, exactly as the
  // Floor page treats it: no mature exchange, negligible liquidity, a price
  // in cents. Counting it as equal evidence about the floor today would be
  // a statistical error. This is also the era the shared engine's own
  // TABLE_CUT excludes.
  var MODERN_D = (Date.UTC(2014, 0, 1) / 1000 - GENESIS_TS) / 86400;

  var liveTodayPrice = null, liveTodayPos = null, priceSource = 'seed';

  function livePos() {
    return (liveTodayPos != null) ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS);
  }
  function livePrice() {
    return (liveTodayPrice != null) ? liveTodayPrice : TODAY_PRICE;
  }
  // The same clamp Wait-or-Deploy applies before entry matching. Display
  // stays sub-floor; only the MATCHING position is clamped. Without this the
  // page's pooled figures would diverge from WODN's the moment price sits
  // below the floor — which is exactly where it sits today.
  function matchPos(p) { return Math.max(0, p); }

  function dayToDate(day) { return new Date((GENESIS_TS + day * 86400) * 1000); }
  function fmtMonth(day) {
    return dayToDate(day).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  function fmtMonthShort(day) {
    return dayToDate(day).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  function fmtUSD(v) {
    if (v >= 1000) return '$' + Math.round(v).toLocaleString('en-US');
    if (v >= 1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(4);
  }
  function pct0(v) { return Math.round(v) + '%'; }
  function signPct0(v) { return (v > 0 ? '+' : '') + Math.round(v) + '%'; }
  // The floor comparison needs a decimal place. These gaps live in tenths of a
  // percent — Math.round turns a real −0.4% into a flat "0%", which reads as
  // "exactly at the floor" when what happened was "just under it".
  function signPct1(v) { return (v > 0 ? '+' : '') + v.toFixed(1) + '%'; }

  // Linear interpolation between the ~12-day samples, identical to the shared
  // engine's realPriceAt. PL_DATA is a grid, not a daily close, so every
  // duration this page reports is a LOWER BOUND and says so.
  function priceAt(absDay) {
    if (absDay <= S[0].d) return S[0].p;
    if (absDay >= S[N - 1].d) return null;   // beyond the record — never extrapolate
    for (var i = 1; i < N; i++) {
      if (S[i].d >= absDay) {
        var a = S[i - 1], b = S[i], t = (absDay - a.d) / (b.d - a.d);
        return a.p * (1 - t) + b.p * t;
      }
    }
    return null;
  }

  // ── Floor visits, computed live from the record ─────────
  function floorVisits() {
    var thr = PL_FLOOR * GRAZE, out = [], cur = null, i;
    for (i = 0; i < N; i++) {
      var mult = S[i].p / plPrice(S[i].d);
      if (mult > thr) continue;
      if (!cur || S[i].d - cur.lastD > EPISODE_D) {
        cur = { firstD: S[i].d, lastD: S[i].d, entryP: S[i].p, entryM: mult, lowM: mult, lowD: S[i].d, n: 0 };
        out.push(cur);
      }
      cur.lastD = S[i].d;
      if (mult < cur.lowM) { cur.lowM = mult; cur.lowD = S[i].d; }
      cur.n++;
    }
    // The final visit is OPEN if its last qualifying sample is the last
    // sample in the record — there is no "after" yet, so no outcome exists.
    if (out.length) out[out.length - 1].open = (out[out.length - 1].lastD === S[N - 1].d);
    out.forEach(function (v) { v.modern = v.firstD >= MODERN_D; });
    return out;
  }

  // ── Method 2: the entry-anchored lookup (§16.2a exception) ──
  function visitOutcomes(v) {
    var res = { horizons: [], recoveredD: null, deepestDrawdown: 0 };
    var i, mult;
    // Depth: the deepest close below the entry price within the following year.
    var lowP = v.entryP;
    for (i = 0; i < N; i++) {
      if (S[i].d < v.firstD || S[i].d > v.firstD + YEAR_D) continue;
      if (S[i].p < lowP) lowP = S[i].p;
    }
    res.deepestDrawdown = (lowP / v.entryP - 1) * 100;
    // Duration: days from entry until price next closed at or above trend.
    for (i = 0; i < N; i++) {
      if (S[i].d < v.firstD) continue;
      mult = S[i].p / plPrice(S[i].d);
      if (mult >= 1.0) { res.recoveredD = S[i].d; break; }
    }
    // Outcomes: one method, three horizons. A horizon beyond the record is
    // reported as absent, never estimated.
    [1, 2, 4].forEach(function (h) {
      var target = v.firstD + YEAR_D * h;
      var p = priceAt(target);
      res.horizons.push({ h: h, price: p, mult: p == null ? null : p / v.entryP });
    });
    return res;
  }

  // ── Render ──────────────────────────────────────────────
  function setText(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }
  function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }

  function renderHero(pos, mult) {
    // §11: the dynamic element is the descriptive position ONLY — the
    // multiple, nothing else. No zone adjective, no action flavour. The
    // static fallback in the markup carries no number and is replaced whole,
    // so no placeholder or loading numeral is ever visible.
    setHTML('rdStandfirst',
      'Bitcoin is at <strong>' + mult.toFixed(2) + '&times;</strong> its long-run trend today. ' +
      'Here is what positions like this one have meant &mdash; decision by decision.');
  }

  function renderStrip(pos, mult, price, visits) {
    var trend = plPrice(TODAY_DAYS);
    var zone = positionLabel(pos);
    setHTML('rdStripPrice', fmtUSD(price));
    setHTML('rdStripTrend', fmtUSD(trend));
    setHTML('rdStripMult', '<em>' + mult.toFixed(2) + '&times;</em>');
    setHTML('rdStripZone', zone);

    // Zone entry date + prior independent visits, both from the live record.
    var modern = visits.filter(function (v) { return v.modern; });
    var open = visits.length ? visits[visits.length - 1] : null;
    if (open && open.open) {
      setHTML('rdStripSince', fmtMonth(open.firstD));
      setHTML('rdStripVisits', String(modern.length - 1));
    } else {
      setHTML('rdStripSince', '&mdash;');
      setHTML('rdStripVisits', String(modern.length));
    }

    // The bar: floor at 0, trend at the position of 1.0x, marker at pos.
    var trendPos = (Math.log(1.0) - Math.log(PL_FLOOR)) / (Math.log(PL_CEIL) - Math.log(PL_FLOOR));
    var MIN = -0.08, MAX = 1.0, RANGE = MAX - MIN;
    function place(p) { return ((Math.max(MIN, Math.min(MAX, p)) - MIN) / RANGE * 100) + '%'; }
    var tf = document.getElementById('rdTickFloor'), tt = document.getElementById('rdTickTrend'), mk = document.getElementById('rdBarMarker');
    if (tf) tf.style.left = place(0);
    if (tt) tt.style.left = place(trendPos);
    if (mk) mk.style.left = place(pos);

    setText('rdProv', todayPriceLabel(priceSource) + ' · trend from the shared Power Law module · zone from the site’s channel-position vocabulary');
  }

  // The lede must track two things that can disagree: where the sampled record
  // ends, and where price is right now. PL_DATA runs on a ~12-day grid with
  // monthly appends, so live spot can be weeks ahead of the last sample — and
  // price can walk off the floor while the record's most recent sample is still
  // sitting on it. Saying "price is at the floor" from a static string would go
  // silently false the moment that happens, so the sentence is assembled from
  // both facts and states whichever is true.
  function renderVisitLede(visits, liveMult) {
    var el = document.getElementById('rdVisitLede');
    if (!el) return;
    var modern = visits.filter(function (v) { return v.modern; });
    var open = modern.length ? modern[modern.length - 1] : null;
    var atFloor = liveMult <= PL_FLOOR * GRAZE;
    var lastSampleD = S[N - 1].d;
    var txt = 'In the modern record, price has come to the floor of the channel <strong>' +
      (modern.length === 3 ? 'three times' : modern.length + ' times') + '</strong>. ';

    if (open && open.open) {
      txt += 'The most recent of them began in <strong>' + fmtMonth(open.firstD) + '</strong> and is the last thing in the record: the newest sample, from ' +
        fmtMonthShort(lastSampleD) + ', still sits at the floor. ';
      if (atFloor) {
        txt += 'Price is there now too, at <strong>' + liveMult.toFixed(2) + '&times;</strong> the trend &mdash; which is why this page opens with the record rather than with a decision.';
      } else {
        txt += 'Price has since moved up to <strong>' + liveMult.toFixed(2) + '&times;</strong> the trend, off the floor itself but still low in the channel. ' +
          'That gap between the sampled record and live spot is normal and it is why both are shown above rather than one standing in for the other.';
      }
    } else {
      txt += 'None is open: the record’s most recent sample is above the floor band, and price today is at <strong>' +
        liveMult.toFixed(2) + '&times;</strong> the trend. What follows is the record of the closed visits.';
    }
    el.innerHTML = txt;
  }

  function renderVisits(visits, liveMult) {
    var host = document.getElementById('rdVisits');
    if (!host) return;
    var atFloor = liveMult <= PL_FLOOR * GRAZE;
    var modern = visits.filter(function (v) { return v.modern; });
    var html = '';
    modern.forEach(function (v, idx) {
      var o = visitOutcomes(v);
      var isOpen = !!v.open;
      var span = v.lastD - v.firstD;
      html += '<div class="rd-visit' + (isOpen ? ' rd-visit-open' : '') + '">';
      html += '<div class="rd-visit-head">';
      html += '<span class="rd-visit-n">Visit ' + (idx + 1) + ' of ' + modern.length + '</span>';
      html += '<span class="rd-visit-when">' + fmtMonth(v.firstD) + (isOpen ? ' &ndash; now' : ' &ndash; ' + fmtMonthShort(v.lastD)) + '</span>';
      html += '<span class="rd-visit-state">' + (isOpen ? 'in progress' : 'closed') + '</span>';
      html += '</div>';

      html += '<div class="rd-visit-facts">';
      html += '<div><span class="rd-fact-k">Entered at</span><span class="rd-fact-v">' + fmtUSD(v.entryP) + ' &middot; ' + v.entryM.toFixed(3) + '&times;</span></div>';
      html += '<div><span class="rd-fact-k">Deepest position</span><span class="rd-fact-v">' + v.lowM.toFixed(3) + '&times; <span class="rd-note">(' + signPct1((v.lowM / PL_FLOOR - 1) * 100) + ' vs the floor)</span></span></div>';
      // Below half a point, "none" is the honest word: Math.round would render
      // a −0.07% dip as "0%", which reads as a measured zero rather than as
      // "price did not close lower".
      var ddTxt = (o.deepestDrawdown <= -0.5) ? Math.round(o.deepestDrawdown) + '%' : 'never closed lower';
      html += '<div><span class="rd-fact-k">Deepest fall from entry</span><span class="rd-fact-v">' + ddTxt + '</span></div>';
      html += '<div><span class="rd-fact-k">At or under the floor for</span><span class="rd-fact-v">' + (span > 0 ? 'at least ' + span + ' days' : 'a single sample') + '</span></div>';
      html += '<div><span class="rd-fact-k">Back to trend</span><span class="rd-fact-v">' +
        (o.recoveredD ? fmtMonthShort(o.recoveredD) + ' <span class="rd-note">(' + Math.round((o.recoveredD - v.firstD) / YEAR_D * 10) / 10 + ' yrs)</span>' : 'not yet') + '</span></div>';
      html += '</div>';

      if (isOpen) {
        html += '<p class="rd-note">This visit is still open, so it has no outcome to report. It is shown here because it is the position the page is being read from &mdash; described, not scored.' +
          (atFloor ? '' : ' Price has moved up off the floor since the last sample in the record, to ' + liveMult.toFixed(2) + '&times; the trend; whether that closes this visit is something only later samples can say.') +
          '</p>';
      } else {
        html += '<table class="rd-outcomes"><thead><tr><th>Held from entry</th><th>Price then</th><th>What one dollar became</th></tr></thead><tbody>';
        o.horizons.forEach(function (h) {
          html += '<tr><td>' + h.h + ' year' + (h.h > 1 ? 's' : '') + '</td>';
          if (h.price == null) {
            html += '<td class="rd-none" colspan="2">not yet in the record &mdash; that date has not arrived</td></tr>';
          } else {
            html += '<td>' + fmtUSD(h.price) + '</td><td><strong>' + h.mult.toFixed(2) + '&times;</strong></td></tr>';
          }
        });
        html += '</tbody></table>';
      }
      html += '</div>';
    });
    host.innerHTML = html;
  }

  function renderRows(pos) {
    var P = matchPos(pos);
    var m = bandMetrics(P);
    if (!m) return;

    // ── R1 — deploy now, or wait? ──
    // The pooled figure is stated as context for the case studies, never as
    // their source. Both are labelled for what they are.
    var beat = 100 - m.paid;
    setHTML('rdR1Pooled',
      'Pooled across every sample the shared engine matches to this position &mdash; <strong>' + m.n +
      '</strong> of them, from ' + (m.n ? fmtMonthShort(S[m.entries[0]].d) : '') + ' onward &mdash; waiting for a lower entry ' +
      'bought more coins in <strong>' + pct0(m.paid) + '</strong> of cases, and deploying at once did better in <strong>' +
      pct0(beat) + '</strong>. In <strong>' + pct0(m.never) + '</strong> of them the lower entry the waiter was waiting for never arrived at all within two years.');

    // §5 anatomy 3 as amended: where the record is unanimous the counter-case
    // is the thinness plus the unsampled scenario. The sub-floor-clamp sentence
    // is mandatory in that construction and is not a caveat — it is the reason
    // the unanimity is partly an artefact of the sample.
    setHTML('rdR1Counter',
      'Among the two closed visits there is no counter-case to name: both ran the same way. That is the thinness talking, not a law &mdash; ' +
      '<strong>two visits is not a base rate</strong>, and the pooled set behind them is drawn from a handful of real episodes rather than from that many independent ones. ' +
      'The scenario that matters most here is the one the record does not contain at all: a floor that gives way and stays gone. ' +
      'The shared engine treats any position below the floor as sitting on it when it matches entries, so <strong>no sustained break appears in this data even in principle</strong> &mdash; ' +
      'it is structurally absent, not merely rare. That absence is a limit of the sample rather than evidence about the world, and ' +
      '<a href="#what-would-break-this">what would break this</a> is where the scenario itself is set out.');

    // ── R3 — how much cash? ──
    setHTML('rdR3Body',
      'The mirror question, asked from the opposite side: a holder deciding whether to raise cash here, meaning to buy back lower. ' +
      'The same engine, the same matched set of <strong>' + m.n + '</strong> samples. Selling and rebuying lower ended up holding more coins in <strong>' +
      pct0(m.paid) + '</strong> of them; the median round trip came back with <strong>' + m.ratio.toFixed(2) +
      '&times;</strong> the coins it started with. A figure below 1.00&times; means the round trip cost coins rather than gaining them.');

    // ── R7 — what has followed, how often and how deep ──
    var zeroish = m.ddDepth > -1;
    setHTML('rdR7Body',
      'Across the same matched set, <strong>' + pct0(m.ddProb) + '</strong> of entries saw a fall of 20% or more at some point in the following two years, and ' +
      '<strong>' + pct0(m.neverFell) + '</strong> never traded below their entry price at all. The median deepest fall was <strong>' +
      (zeroish ? 'about zero' : Math.round(m.ddDepth) + '%') + '</strong>. ' +
      'These are frequencies and depths, not durations &mdash; nothing on the site computes how long a fall from a given position lasted, so this page does not say.');

    setHTML('rdR1N', String(m.n));
  }

  // ── Boot ────────────────────────────────────────────────
  function renderAll() {
    var pos = livePos(), price = livePrice(), mult = ratioOf(pos);
    var visits = floorVisits();
    renderHero(pos, mult);
    renderStrip(pos, mult, price, visits);
    renderVisitLede(visits, mult);
    renderVisits(visits, mult);
    renderRows(pos);
  }

  function init() {
    renderAll();
    // Live spot, then one re-render. Until it resolves the page shows the
    // latest monthly sample and labels it as such — never as live.
    if (typeof fetchTodayPrice === 'function') {
      fetchTodayPrice(function (price, source) {
        if (price && isFinite(price)) {
          liveTodayPrice = price;
          liveTodayPos = posOf(price, TODAY_DAYS);
          priceSource = source;
          renderAll();
        }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
