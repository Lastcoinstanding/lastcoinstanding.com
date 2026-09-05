/* =============================================================
   The Rundown v2 — "The Briefing" — page script

   RUNDOWN_DESIGN.md Part I. Built after JM's Phase 0 v2 ratification
   (2026-09-01) and the ten rulings recorded there; the findings behind every
   structural choice are in RUNDOWN_PHASE0_V2_REPORT.md.

   ── WHAT THIS PAGE OWNS, AND WHAT IT DOES NOT (§0) ──
   It owns the COMPOSITION — position × situation × intent — and nothing else.
   Every figure below is computed by a module some other page publishes from,
   and every snack routes to that page. The Rundown owns no data and no
   exhibits. If a module renders identically for every visitor at a given
   moment it belongs on the Dashboard or in the Gallery, not here.

   Modules read (all shared, all loaded before this file):
     shared/power-law-data.js        PL_DATA, plPrice, PL_FLOOR/PL_CEIL/PL_B,
                                     positionLabel, TODAY_DAYS/TODAY_PRICE,
                                     fetchTodayPrice, todayPriceLabel
     shared/channel-entries.js       bandMetrics — D1, R1, P2
                                     (what Wait-or-Deploy and How Much Cash publish)
     shared/ladder-advantage.js      bucketAt — D2   (what Lump Sum or Ladder In publishes)
     shared/reversion-durations.js   scan — R2       (what Discount, or Premium? publishes)
     shared/retirement-engine.js     lineFor — P1    (what Escape Velocity publishes)
     shared/modeling-assumptions.js  the site-wide inflation / growth-model store

   ── THE ONE RULE THAT IS EASIEST TO BREAK ──
   TWO position conventions are in play and they are NOT interchangeable:

     matchPos(p) = max(0, p)   — used for D1, R1 and P2, because
                                 ChannelEntries clamps sub-floor positions
                                 before matching entries and Wait-or-Deploy
                                 and How Much Cash both publish from the
                                 clamped read. Price is sub-floor today, so
                                 omitting this would put every pooled figure
                                 out of step with its own source page on day one.

     raw pos                   — used for D2, because Lump Sum or Ladder In
                                 does NOT clamp: its slider runs to −0.10 and
                                 its published curve is drawn on the unclamped
                                 position. Clamping here would silently quote a
                                 different bucket than the page it routes to.

   Getting this backwards produces figures that are individually plausible and
   collectively wrong, which is the failure mode the consistency test exists
   to catch. Each call site says which one it is using and why.

   ── PRIVACY (§3, JM ruling 10 as amended) ──
   Retirement year, target income and intent may be remembered on the device,
   each behind its own toggle, inside ONE key (STYLE_GUIDE §6.37).

   THE STACK IS SESSION-ONLY AND HAS NO TOGGLE. It lives in the closure
   variable below and nowhere else: never in the store, never in the URL, never
   in an analytics call. That is the shipped Discount-or-Premium pattern, and
   it is deliberate rather than cautious — this page renders a compact echo of
   D-or-P's own module, which promises "never stored or sent", and a persisted
   stack one scroll from that promise would make the page contradict itself.

   ── LIVE-COMPUTE-ONLY ──
   No figure is baked into the markup. The no-JS fallback carries no number
   rather than a placeholder, so the page adds zero lines to
   MONTHLY_REFRESH_CHECKLIST.
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;
  var CE = window.ChannelEntries, LA = window.LadderAdvantage,
      RD = window.ReversionDurations, RE = window.RetirementEngine,
      MA = window.ModelingAssumptions, RW0 = window.ReturnWindow;
  if (!CE || !LA || !RD || !RE || !MA || !RW0) return;

  var posOf = CE.posOf, ratioOf = CE.ratioOf, bandMetrics = CE.bandMetrics;
  var S = CE.S, N = CE.N, YEAR_D = CE.YEAR_D;

  /* ── Floor-visit definition — the UNIFIED rule (JM ruling 6) ─────────────
     Canonical home is The Bitcoin Floor. Until that page adopts it (gated on
     JM's word, see FLOOR_VISIT_DEFINITION_MINIREPORT.md) this page states its
     own method rather than claiming the two agree.
       GRAZE     — the Floor page's published language is that price has
                   "approached the line"; 1% is that approach made numeric.
       EPISODE_D — the site's independent-visit rule, the same 100-day gap
                   shared/reversion-durations.js groups episodes with.
     Swept in the mini-report: the gap is insensitive from 30 to 200 days; the
     graze band is load-bearing only below ~0.9%, where the current visit
     disappears. ────────────────────────────────────────────────────────── */
  var GRAZE = 1.01;
  var EPISODE_D = RD.EPISODE_D;
  var MODERN_D = (Date.UTC(2014, 0, 1) / 1000 - GENESIS_TS) / 86400;

  var liveTodayPrice = null, liveTodayPos = null, priceSource = 'seed';

  function livePos() { return (liveTodayPos != null) ? liveTodayPos : posOf(TODAY_PRICE, TODAY_DAYS); }
  function livePrice() { return (liveTodayPrice != null) ? liveTodayPrice : TODAY_PRICE; }
  function matchPos(p) { return Math.max(0, p); }   // see the header note

  /* ═══════════════════════════════════════════════════════════
     THE STATE MATRIX (B6 — JM review round 1, C7/C21/C28 as ONE rule)

     Three separate review comments were three symptoms of one defect: the
     page was written from where price happened to be standing. "Floor visit
     began" has no answer when no visit is open; talking about the floor
     reads oddly at 0.52×; "reaching only the channel floor" is incoherent
     read from above trend. Patching each string where it was noticed would
     have left the next state to be discovered by a reader.

     So every position-dependent string on this page now branches through
     ONE function. Five states, and each boundary is an EXISTING site
     constant rather than a number invented here:

       below-floor   mult <  PL_FLOOR                      under the line
       at-floor      PL_FLOOR ≤ mult ≤ PL_FLOOR × GRAZE    inside the graze
                     band — i.e. inside a floor approach as The Bitcoin
                     Floor now defines one
       below-trend   above the graze band, below NEAR_LO
       near-trend    NEAR_LO ≤ mult ≤ NEAR_HI              Discount-or-
                     Premium's dead band, where it declines to use the words
                     "discount" and "premium" at all
       above-trend   mult > NEAR_HI

     The matrix of string × state is reported in the handback. The rule for
     adding to it: a string that names the floor, names a direction, or says
     "below"/"above" is position-dependent and belongs here.
     ═══════════════════════════════════════════════════════════ */
  /* The epsilon is not decoration. PL_FLOOR * GRAZE evaluates to
     0.42419999999999997, so a multiple sitting exactly on the documented "1%
     above the floor" boundary classifies as below-trend and the page quietly
     stops calling it an approach — the one input most likely to be used to
     test this very boundary. Compare with a tolerance so the published
     definition and the code agree at the edge. */
  var GRAZE_BAND = PL_FLOOR * GRAZE, EPS = 1e-9;
  function positionState(mult) {
    if (mult < PL_FLOOR - EPS) return 'below-floor';
    if (mult <= GRAZE_BAND + EPS) return 'at-floor';
    if (mult < RD.NEAR_LO) return 'below-trend';
    if (mult <= RD.NEAR_HI) return 'near-trend';
    return 'above-trend';
  }
  // In a floor approach at all — the two states the Floor page would count.
  function inApproach(state) { return state === 'below-floor' || state === 'at-floor'; }
  // Direction words, so no call site writes "below" as a literal.
  function gapWord(mult) { return mult < 1 ? 'below' : 'above'; }
  function gapPct(mult) { return Math.abs(1 - mult) * 100; }

  /* ═══════════════════════════════════════════════════════════
     STATE — the briefing setup
     ═══════════════════════════════════════════════════════════ */
  var DEFAULTS = {
    // Escape Velocity's own defaults, deliberately: P1 routes there, and a
    // reader who has changed nothing sees a figure that reproduces on that
    // page by moving one control.
    retirementYear: 2035,
    targetIncomeUSD: 100000,
    intent: 'looking'
  };
  var YEARS_IN_RETIREMENT = 30;   // fixed, stated on the snack — JM ruling 4

  var st = {
    retirementYear: DEFAULTS.retirementYear,
    targetIncomeUSD: DEFAULTS.targetIncomeUSD,
    intent: DEFAULTS.intent,
    remember: { retirementYear: false, targetIncomeUSD: false, intent: false }
  };
  // SESSION-ONLY. Never joins `st`, so it can never reach the store or the URL.
  var stackBTC = null;

  var d3Months = 36;   // D3's horizon slider (D-or-P's own default)
  var a4Horizon = 10;  // A4's horizon slider (the Hurdle Rate's own default)

  /* ── Store: ONE key, §6.37 shape ─────────────────────────────
     A field is written only when its own remember flag is on, so "forget this"
     and "never stored" are the same state on disk rather than two. Reset
     removes the key entirely — the Phase 4 privacy test asserts it is gone,
     not that it is empty. Every call degrades silently. */
  var STORE_KEY = 'lcs.the-rundown.state.v1';
  function readStore() { try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; } }
  function writeStore(v) { try { localStorage.setItem(STORE_KEY, v); } catch (e) {} }
  function clearStore() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} }

  function saveState() {
    var r = st.remember;
    if (!r.retirementYear && !r.targetIncomeUSD && !r.intent) { clearStore(); return; }
    var blob = { v: 1, remember: { retirementYear: r.retirementYear, targetIncomeUSD: r.targetIncomeUSD, intent: r.intent } };
    if (r.retirementYear) blob.retirementYear = st.retirementYear;
    if (r.targetIncomeUSD) blob.targetIncomeUSD = st.targetIncomeUSD;
    if (r.intent) blob.intent = st.intent;
    writeStore(JSON.stringify(blob));
  }
  // Returns true when the store actually supplied a VALUE (not merely a
  // remembered set of toggles) — B2 uses that to decide whether the setup
  // panel opens or shows its summary chip.
  function loadState() {
    var raw = readStore(); if (!raw) return false;
    var o; try { o = JSON.parse(raw); } catch (e) { return false; }
    if (!o || o.v !== 1) return false;
    if (o.remember) {
      st.remember.retirementYear = !!o.remember.retirementYear;
      st.remember.targetIncomeUSD = !!o.remember.targetIncomeUSD;
      st.remember.intent = !!o.remember.intent;
    }
    var any = false;
    if (typeof o.retirementYear === 'number') { st.retirementYear = clampYear(o.retirementYear); any = true; }
    if (typeof o.targetIncomeUSD === 'number') { st.targetIncomeUSD = clampIncome(o.targetIncomeUSD); any = true; }
    if (typeof o.intent === 'string' && INTENTS.indexOf(o.intent) >= 0) { st.intent = o.intent; any = true; }
    return any;
  }

  /* ── URL: ?ry= &ti= &intent= — and NEVER the stack ────────────
     §6.37's precedence is strict: if ANY instrument param is present the store
     is neither read nor allowed to override it, so a shared link behaves
     exactly as encoded. */
  function readUrl() {
    var q; try { q = new URLSearchParams(window.location.search); } catch (e) { return false; }
    var any = false;
    if (q.has('ry')) { st.retirementYear = clampYear(parseInt(q.get('ry'), 10)); any = true; }
    if (q.has('ti')) { st.targetIncomeUSD = clampIncome(parseInt(q.get('ti'), 10)); any = true; }
    if (q.has('intent') && INTENTS.indexOf(q.get('intent')) >= 0) { st.intent = q.get('intent'); any = true; }
    return any;
  }
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var q; try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
    if (st.retirementYear === DEFAULTS.retirementYear) q.delete('ry'); else q.set('ry', String(st.retirementYear));
    if (st.targetIncomeUSD === DEFAULTS.targetIncomeUSD) q.delete('ti'); else q.set('ti', String(st.targetIncomeUSD));
    if (st.intent === DEFAULTS.intent) q.delete('intent'); else q.set('intent', st.intent);
    var s = q.toString();
    window.history.replaceState(null, '', window.location.pathname + (s ? '?' + s : ''));
  }

  var LIM = RE.LIMITS;
  function clampYear(v) { v = parseInt(v, 10); if (!isFinite(v)) v = DEFAULTS.retirementYear; return Math.max(LIM.retirementYear.min, Math.min(LIM.retirementYear.max, v)); }
  function clampIncome(v) { v = parseInt(v, 10); if (!isFinite(v)) v = DEFAULTS.targetIncomeUSD; return Math.max(LIM.targetIncomeUSD.min, Math.min(LIM.targetIncomeUSD.max, v)); }
  function clampStack(v) { v = parseFloat(v); if (!isFinite(v) || v <= 0) return null; return Math.min(v, LIM.btcStack.max); }

  var INTENTS = ['deploy', 'dca', 'cash', 'rebalance', 'retire', 'looking'];

  /* ═══════════════════════════════════════════════════════════
     FORMAT + SVG HELPERS
     ═══════════════════════════════════════════════════════════ */
  function dayToDate(day) { return new Date((GENESIS_TS + day * 86400) * 1000); }
  function fmtMonth(day) { return dayToDate(day).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function fmtMonthShort(day) { return dayToDate(day).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function yearOf(day) { return dayToDate(day).getUTCFullYear(); }
  function fmtUSD(v) {
    if (v == null || !isFinite(v)) return '—';
    if (v >= 1000) return '$' + Math.round(v).toLocaleString('en-US');
    if (v >= 1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(4);
  }
  function fmtUSDshort(v) {
    if (v == null || !isFinite(v)) return '—';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v);
  }
  function pct0(v) { return Math.round(v) + '%'; }
  function pct1(v) { return v.toFixed(1) + '%'; }
  function signPct0(v) { var r = Math.round(v); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r) + '%'; }
  function btc(v) { return (Math.round(v * 100) / 100).toFixed(2); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }

  // Stat cards. Labels and values are NOT prose and do not count against the
  // 75-word budget (§11.1) — which is exactly why the budget survives.
  /* The render date of the live read, in the house format the Dashboard
     already uses. It is the DATE THIS PAGE WAS OPENED, not a data date —
     "today" was ambiguous the moment anyone screenshotted the page, and a
     reader looking at a saved image had no way to know how old it was. The
     no-JS fallback stays date-free for the same reason a placeholder numeral
     is banned: a date baked into markup is stale the day after it ships. */
  function houseDate() {
    try { return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
    catch (e) { return ''; }
  }

  /* §6.13 help-tip, built here so every call site gets the same markup and the
     case-guard the pattern requires. `end` right-anchors the card for triggers
     near a container's right edge. */
  function tip(txt, end) {
    // Thin space before the glyph, page-wide — see the .help-tip note in the
    // stylesheet. It belongs to the trigger, not to each call site's copy, so
    // no caller can forget it and no two placements can drift apart.
    return '&thinsp;<span class="help-tip" tabindex="0">?<span class="tip-content' + (end ? ' tip-end' : '') + '">' + txt + '</span></span>';
  }

  function cards(list) {
    return '<div class="rd-cards">' + list.map(function (c) {
      return '<div class="rd-card"><span class="rd-card-k">' + c.k + '</span>' +
             '<span class="rd-card-v">' + c.v + '</span>' +
             (c.sub ? '<span class="rd-card-sub">' + c.sub + '</span>' : '') + '</div>';
    }).join('') + '</div>';
  }
  // No width/height attributes: the viewBox sets the aspect ratio and the CSS
  // (.rd-svg { width:100%; height:auto }) sizes it. `height="auto"` is not a
  // valid SVG length and throws in the console even though it renders.
  function svgOpen(w, h, label) {
    return '<svg class="rd-svg" viewBox="0 0 ' + w + ' ' + h + '" ' +
           'preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(label) + '">';
  }
  // The §5 element-2 tag. Drawn ON the chart, never in the caption.
  function illustrativeTag(x, y, anchor) {
    return '<text class="rd-illus" x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'start') + '">illustrative</text>';
  }

  /* ═══════════════════════════════════════════════════════════
     FLOOR VISITS — A3, and the context header's two cells
     ═══════════════════════════════════════════════════════════ */
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
    if (out.length) out[out.length - 1].open = (out[out.length - 1].lastD === S[N - 1].d);
    out.forEach(function (v) { v.modern = v.firstD >= MODERN_D; });
    return out;
  }
  // Days from a visit's entry until price next closed at or above trend.
  function backToTrend(v) {
    for (var i = 0; i < N; i++) {
      if (S[i].d < v.firstD) continue;
      if (S[i].p / plPrice(S[i].d) >= 1.0) return S[i].d;
    }
    return null;
  }

  /* ═══════════════════════════════════════════════════════════
     HERO + CONTEXT HEADER
     ═══════════════════════════════════════════════════════════ */
  function renderHero(mult) {
    // The dynamic element is the descriptive position ONLY. The static
    // fallback carries no number and is replaced whole, so no placeholder
    // numeral is ever visible and the reserved min-height absorbs the swap.
    // The single wrapping span is load-bearing, not decorative — see the
    // .rd-standfirst note in the stylesheet.
    // A1 (C3), candidate 1 as adopted. The register point behind the change:
    // "implications for your situation" leans forward — what the record
    // predicts — and the page's spine is what a position HAS MEANT. Past
    // tense, second person, no forward claim.
    setHTML('rdStandfirst',
      '<span>As of ' + houseDate() + ', bitcoin is at <strong>' + mult.toFixed(2) + '&times;</strong> its long-run trend. ' +
      'What has a position like this meant for <em>your</em> situation?</span>');
  }

  /* The header is an ECHO of the Dashboard and is fenced as one (§2.2): it
     never grows tiles. It carries only what the site-wide channel ribbon
     above it cannot — the ribbon already shows price, multiple and zone, and
     repeating them here is the duplication §0 exists to prevent. */
  function renderHeader(pos, visits, mult, spot) {
    var state = positionState(mult);

    // ── Cards 1 and 2 — the pair, so the multiple is checkable by eye.
    setHTML('rdHdrPrice', fmtUSD(spot));
    setText('rdHdrPriceSub', todayPriceIsLive(priceSource) ? 'live' : 'latest monthly data');
    setHTML('rdHdrTrend', fmtUSD(plPrice(TODAY_DAYS)));

    // ── Card 3 — position, with the gap spelled out in the reader's terms.
    setHTML('rdHdrPos', '<em>' + mult.toFixed(2) + '&times;</em>');
    // "0% above trend" is what the arithmetic says and not what the reader
    // wants; at the rounding boundary the honest phrase is the plain one.
    var gp = Math.round(gapPct(mult));
    setText('rdHdrPosSub', gp === 0 ? 'at trend' : gp + '% ' + gapWord(mult) + ' trend');

    // ── Card 4 — STATE-AWARE (B6). The old card asserted a visit was open.
    var modern = visits.filter(function (v) { return v.modern; });
    var last = modern.length ? modern[modern.length - 1] : null;
    var completed = modern.filter(function (v) { return !v.open; }).length;
    /* The COUNT leads; the date is the sub-line. Still state-aware — the
       reader needs to know whether the latest approach is the one they are
       standing in — but the open/closed SPLIT is deliberately not here. */
    if (!last) {
      setHTML('rdHdrFloor', '0');
      setText('rdHdrFloorSub', 'none in the modern record');
    } else {
      setHTML('rdHdrFloor', String(modern.length));
      var when = 'latest began ' + fmtMonth(last.firstD);
      setHTML('rdHdrFloorSub', last.open && inApproach(state)
        ? when + ' &middot; <span class="rd-hdr-state is-open">in one now</span>'
        : last.open
          // The record's last approach has no sample above the band yet, but
          // live price has walked out of it. "Open" alone would be false to
          // the reader's own number; "closed" would be false to the record.
          ? when + ' &middot; price has since moved off'
          : when + ' &middot; closed');
    }

    // ── The mini-bar (B5): larger labels, clearance, and today's value on
    //    the marker so the bar is readable without the cards.
    var trendPos = (Math.log(1.0) - Math.log(PL_FLOOR)) / (Math.log(PL_CEIL) - Math.log(PL_FLOOR));
    var MIN = -0.08, MAX = 1.0, RANGE = MAX - MIN;
    function place(p) { return ((Math.max(MIN, Math.min(MAX, p)) - MIN) / RANGE * 100) + '%'; }
    var tf = document.getElementById('rdTickFloor'), tt = document.getElementById('rdTickTrend'), mk = document.getElementById('rdBarMarker');
    if (tf) tf.style.left = place(0);
    if (tt) tt.style.left = place(trendPos);
    if (mk) mk.style.left = place(pos);
    setHTML('rdBarMarkerLbl', 'today &middot; ' + mult.toFixed(2) + '&times;');
    // Pull the marker label inside the track when it would hang off an end.
    if (mk) {
      var frac = (Math.max(MIN, Math.min(MAX, pos)) - MIN) / RANGE;
      mk.classList.toggle('is-nearleft', frac < 0.12);
      mk.classList.toggle('is-nearright', frac > 0.88);
    }

    // B1: the provenance line routes to the model and carries the §6.13 tip.
    // The date replaces "Today" for the same reason it does in the standfirst:
    // a screenshot of "Today (live)" carries no information about when.
    setHTML('rdProv',
      houseDate() + ' (' + (todayPriceIsLive(priceSource) ? 'live' : 'latest monthly data') + ')' +
      ' &middot; trend from the shared ' +
      '<a href="/the-power-law">Power Law module</a>' +
      '<span class="help-tip" tabindex="0">?<span class="tip-content">' +
      'The trend is a power law fitted to bitcoin&rsquo;s whole price history, and the floor is a fixed multiple of it. ' +
      'It is a model of the record rather than a law of the world &mdash; the Power Law page states its fit, its limits and what would break it.' +
      '</span></span>');
  }

  /* ═══════════════════════════════════════════════════════════
     A3 — the floor-visit timeline
     ═══════════════════════════════════════════════════════════ */
  /* IDENTITY 1 of 3 — the floor-approach module. Rendered only when price is
     inside a floor approach, which is when the approach is the occasion. */
  function renderFloorApproach(visits, liveMult) {
    setHTML('rdA3Register', 'Historical, at this position &mdash; not a prediction.');
    setHTML('rdA3Route', '<a class="rd-route" href="/the-bitcoin-floor">The Bitcoin Floor &rarr;</a>');
    setHTML('rdA3Sources', '<strong>Method.</strong> The approach definition is <a href="/the-bitcoin-floor">The Bitcoin Floor</a>&rsquo;s, and that page is its canonical home: an episode in which price came within 1% of the 0.42&times; floor or below it, with a gap of more than about 100 days starting a new one. This timeline is an echo of the set that page narrates in full &mdash; same rule, same episodes, same count. A fourth episode, in the autumn of 2010, is left out here for the reason it gives: no mature exchange, negligible liquidity, a price in cents. Durations are lower bounds &mdash; the price series is a roughly 12-day grid, not a daily close.');
    var modern = visits.filter(function (v) { return v.modern; });
    var open = modern.length && modern[modern.length - 1].open ? modern[modern.length - 1] : null;
    var closed = modern.filter(function (v) { return !v.open; });

    /* The record and live spot can disagree, and the sentence must say which
       it is describing. PL_DATA is a ~12-day grid with monthly appends, so
       spot can be weeks ahead of the last sample — price can walk off the
       floor while the newest sample is still sitting on it. A static "price is
       at the floor" would go silently false the day that happens. */
    var state = positionState(liveMult);
    var atFloor = inApproach(state);

    /* A4 (C20): the question line carries the live multiple, so "here" is a
       number rather than a gesture. It is set from the script for the same
       reason the standfirst is — a static "here" cannot be checked. */
    // Round two: historical tense, never a forward claim, and stated as the
    // question the module answers rather than as a reading of the ticker.
    setHTML('rdA3Q', 'Price is at the floor. When has it been here before?');

    var v = 'Price has come to the floor <strong>' +
            (modern.length === 3 ? 'three times' : modern.length + ' times') + '</strong> since 2014. ';
    if (open) {
      v += 'The most recent began in <strong>' + fmtMonth(open.firstD) + '</strong> and is still the last sample in the record' +
           (atFloor
             ? ', with price there now at ' + liveMult.toFixed(2) + '× trend.'
             : ' — though price has since moved up to ' + liveMult.toFixed(2) + '× trend.');
    } else if (closed.length) {
      v += 'None is open: the newest sample sits above the band, and price today is at ' + liveMult.toFixed(2) + '× trend.';
    }
    /* B6 (C21): "why are we talking about the floor at 0.52×?" — because the
       floor is where this module's record is, and the honest answer is to say
       how far away it is rather than to leave the reader to notice. The full
       fix is the state-aware module identity now under proposal; this is the
       bridge, and it is a sentence rather than a silence. */
    if (!atFloor) {
      var aboveFloorPct = (liveMult / PL_FLOOR - 1) * 100;
      v += ' Today is <strong>' + Math.round(aboveFloorPct) + '% above the floor</strong>' +
           (state === 'above-trend' ? ' and above trend' : '') +
           ', so this is the record of a place price is not currently standing.';
    }
    setHTML('rdA3Verdict', v);

    var recs = closed.map(function (v) { var b = backToTrend(v); return b ? (b - v.firstD) / YEAR_D : null; })
                     .filter(function (x) { return x != null; });
    var slowest = recs.length ? Math.max.apply(null, recs) : null;
    setHTML('rdA3Cards', cards([
      /* Was "Floor approaches since 2014 · 3 · 2 completed" — the header card
         verbatim, and the verdict sentence above states the total a third
         time. Under JM's rule that no card in any state duplicates the
         header, this card now carries ONLY the split, which is the part the
         header deliberately gave up and which has to live somewhere. */
      { k: 'Completed approaches', v: String(closed.length),
        sub: open ? 'one still open' : 'all closed' },
      { k: 'Deepest of them', v: Math.min.apply(null, modern.map(function (v) { return v.lowM; })).toFixed(3) + '×', sub: 'of trend' },
      { k: 'Slowest return to trend', v: slowest ? slowest.toFixed(1) + ' yrs' : '—', sub: 'from that entry' }
    ]));

    /* ── The timeline. Position-current by construction: today's marker is on
          it, which is what makes it an instrument rather than an exhibit (§0).

       LABEL PLACEMENT IS COMPUTED, NOT ALTERNATED (JM register review, pass 1).
       The previous version tiered labels by index parity, which is not
       collision handling at all — it happens to work until two markers land
       near each other, and today's live state is exactly that case: the open
       July 2026 episode sits at the right-hand end of the axis and today's
       marker is pinned there permanently, so their labels overlapped.

       Three mechanisms, in order:
         1. MERGE. An episode whose marker is within MERGE_X of today's is not
            a separate thing to label — it IS where we are. The pair collapses
            into one label carrying both facts.
         2. CLAMP. A label's centre is pulled inside the plot area so it can
            never hang off the edge, which is what pushed "Aug 2015" against
            the left tick.
         3. TIER. Anything still overlapping drops to the next row, measured
            against every label already placed rather than against its own
            index.
       Widths are estimated from character count and font size; the viewBox is
       fixed so those units are stable at every viewport. The estimate is
       deliberately generous — over-reserving costs a little vertical space,
       under-reserving costs a collision. Verified against measured getBBox
       extents at 375, 768 and 1280. */
    var W = 700, PADL = 34, PADR = 34, ROW_H = 21, GUTTER = 8, MERGE_X = 46;
    var y0 = 2014, y1 = yearOf(S[N - 1].d) + 1;
    function xOf(day) {
      var yr = yearOf(day) + (dayToDate(day).getUTCMonth() / 12);
      return PADL + (yr - y0) / (y1 - y0) * (W - PADL - PADR);
    }
    function estW(t, size) { return String(t).length * size * 0.58; }
    var xt = W - PADR;

    // 1 · build the label set, merging any episode coincident with today
    var labels = [], mergedWith = null;
    modern.forEach(function (v) {
      var xa = xOf(v.firstD), xb = Math.max(xOf(v.lastD), xa + 3);
      var cx = (xa + xb) / 2;
      if (mergedWith === null && Math.abs(xt - cx) <= MERGE_X) {
        mergedWith = v;
        var moved = Math.abs(liveMult - v.lowM) >= 0.005;
        labels.push({
          cx: (cx + xt) / 2, open: true,
          main: fmtMonthShort(v.firstD) + ' · today',
          sub: moved ? v.lowM.toFixed(2) + '× → ' + liveMult.toFixed(2) + '×' : liveMult.toFixed(2) + '×'
        });
      } else {
        labels.push({ cx: cx, open: !!v.open, main: fmtMonthShort(v.firstD), sub: v.lowM.toFixed(2) + '×' });
      }
    });
    if (mergedWith === null) {
      labels.push({ cx: xt, open: true, today: true, main: 'today', sub: liveMult.toFixed(2) + '×' });
    }

    // 2 · clamp inside the plot area, then 3 · tier against everything placed
    var rows = [];
    labels.forEach(function (L) {
      var half = Math.max(estW(L.main, 10.5), estW(L.sub, 9.5)) / 2;
      L.x = Math.max(PADL + half, Math.min(W - PADR - half, L.cx));
      var lo = L.x - half, hi = L.x + half, r = 0;
      for (;;) {
        var clash = false, seg = rows[r] || [];
        for (var q = 0; q < seg.length; q++) {
          if (!(hi + GUTTER < seg[q][0] || lo - GUTTER > seg[q][1])) { clash = true; break; }
        }
        if (!clash) break;
        r++;
      }
      (rows[r] = rows[r] || []).push([lo, hi]);
      L.row = r;
    });

    // The axis sits below whatever stack of label rows was needed, so the
    // chart grows downward rather than clipping at the top.
    var maxRow = rows.length - 1;
    var AXY = 30 + (maxRow + 1) * ROW_H + 24;
    var H = AXY + 26;

    var s = svgOpen(W, H, 'Timeline of the channel-floor visits since 2014, with today marked');
    s += '<line class="rd-ax" x1="' + PADL + '" y1="' + AXY + '" x2="' + (W - PADR) + '" y2="' + AXY + '"/>';
    for (var yr = y0; yr <= y1; yr += 2) {
      var x = PADL + (yr - y0) / (y1 - y0) * (W - PADL - PADR);
      s += '<line class="rd-tick" x1="' + x + '" y1="' + AXY + '" x2="' + x + '" y2="' + (AXY + 5) + '"/>';
      s += '<text class="rd-axlbl" x="' + x + '" y="' + (AXY + 18) + '" text-anchor="middle">' + yr + '</text>';
    }
    modern.forEach(function (v) {
      var xa = xOf(v.firstD), xb = Math.max(xOf(v.lastD), xa + 3);
      s += '<rect class="rd-ep' + (v.open ? ' rd-ep-open' : '') + '" x="' + xa + '" y="' + (AXY - 20) + '" width="' + (xb - xa) + '" height="20" rx="2"/>';
    });
    s += '<line class="rd-today" x1="' + xt + '" y1="' + (AXY - 28) + '" x2="' + xt + '" y2="' + (AXY + 3) + '"/>';
    labels.forEach(function (L) {
      var ty = AXY - 30 - L.row * ROW_H;
      var cls = L.open ? ' is-open' : '';
      // 12, not 11: at 11 the two lines' glyph boxes just touch, which reads
      // fine but makes an automated overlap check ambiguous about whether a
      // label has collided with its own subtitle or with a neighbour.
      s += '<text class="rd-eplbl' + cls + '" x="' + L.x.toFixed(1) + '" y="' + ty + '" text-anchor="middle">' + L.main + '</text>';
      s += '<text class="rd-epsub' + cls + '" x="' + L.x.toFixed(1) + '" y="' + (ty + 12) + '" text-anchor="middle">' + L.sub + '</text>';
    });
    s += '</svg>';
    setHTML('rdA3Viz', s);

    setHTML('rdA3Note', open
      ? 'The open approach is described, not scored &mdash; it has no outcome yet.'
      : 'Every approach shown is closed, so every one has an outcome.');
  }

  /* ═══════════════════════════════════════════════════════════
     THE RATE CONVENTION (JM ruling, 2026-09-04)

     Lead with the DATE and the trend price at it. Annualise ONLY windows of
     twelve months or more; below a year, report the TOTAL move over the
     window. The reason is not arithmetic — every one of these annualisations
     is correct — it is that a short window makes the annualised figure
     enormous, and the enormous figure is the one that survives being
     screenshotted out of its module. At today's depth a 4.3-month reversion
     annualises to 745% a year while being a 92% move; the second number is
     the one a reader can carry away without being misled by it.

     Recorded site-wide in STYLE_GUIDE. The Hurdle Rate reached the same rule
     independently and fences harder (its position view declines to render
     below three years); Discount-or-Premium does NOT yet comply and is
     flagged in the handback rather than changed from here.
     ═══════════════════════════════════════════════════════════ */
  /* EXTRACTED 2026-09-04 to shared/return-window.js and adopted back, so the
     convention has one copy across this page, the Dashboard and
     Discount-or-Premium. This wrapper adds only what is local: the formatted
     date, and the `rateLine` name every call site here already uses. The
     DECISION — annualise or not — is the shared module's and nobody else's. */
  var RW = RW0;
  var MO_D = RW.MONTH_D;
  function windowRead(months, spot) {
    var r = RW.read(months, spot);
    return {
      months: r.months, date: fmtMonthShort(r.day), trendPrice: r.trendPrice,
      total: r.total, annualised: r.annualised, rateLine: r.line
    };
  }

  /* IDENTITY 2 of 3 — at trend (Discount-or-Premium's dead band).
     The engine returns nothing here, correctly: near trend there is no gap to
     close and a duration computed from one would be noise. JM's condition was
     that a permanent module never renders "nothing to show", so this identity
     reports the LAST STRETCH EACH WAY, read from the same scan at the dead
     band's own published edges (0.95× and 1.05×), plus the LONGEST on record
     either side. No new computation: those are the multiples at which
     Discount-or-Premium itself starts reporting. */
  function renderAtTrend(visits, liveMult, spot) {
    var lo = RD.scan(RD.NEAR_LO - 1e-9), hi = RD.scan(RD.NEAR_HI + 1e-9);
    function lastClosed(rec) {
      if (!rec || rec.state === 'hidden' || !rec.episodes) return null;
      var c = rec.episodes.filter(function (e) { return !e.ongoing; });
      return c.length ? c[c.length - 1] : null;
    }
    var dLast = lastClosed(lo), pLast = lastClosed(hi);

    setHTML('rdA3Q', 'Price is at trend. What has the record looked like either side?');
    setHTML('rdA3Verdict',
      'Price is <strong>at trend</strong> &mdash; neither a discount nor a premium. ' +
      'There is no gap to close, so there is nothing to time. What the record has is the last stretch in each direction.');

    var list = [];
    if (dLast) list.push({ k: 'Last stretch below ' + RD.NEAR_LO.toFixed(2) + '×',
      v: RD.fmtMonthsShort(dLast.months), sub: 'from ' + fmtMonthShort(dLast.entryD) + ' back to trend' });
    if (pLast) list.push({ k: 'Last stretch above ' + RD.NEAR_HI.toFixed(2) + '×',
      v: RD.fmtMonthsShort(pLast.months), sub: 'from ' + fmtMonthShort(pLast.entryD) + ' back to trend' });

    /* THIRD CARD — the longest stretch away from trend on record, either side.
       It replaces a "Last floor approach" card that restated the header, under
       JM's rule that no card in any state duplicates the header.

       His condition was that it only ships if it reproduces on
       Discount-or-Premium, and it does: that page prints this figure as its
       "longest" marker, and the answer is the SAME episode at every multiple a
       reader can actually enter on this side of the dead band. Checked at
       0.94x, 0.93x and 0.90x below, and 1.06x, 1.07x and 1.10x above — the
       longest is the identical stretch at all of them, so the card does not
       depend on a multiple no one can type. `longestEp` is the episode basis,
       matching how this page counts everywhere else. */
    var longest = [lo.longestEp, hi.longestEp]
      .filter(Boolean)
      .reduce(function (a, b) { return (!a || b.months > a.months) ? b : a; }, null);
    var longBelow = !!(longest && lo.longestEp && longest === lo.longestEp);
    if (longest) {
      list.push({ k: 'Longest away from trend', v: RD.fmtMonthsShort(longest.months),
        sub: (longBelow ? 'below' : 'above') + ' trend, from ' + fmtMonthShort(longest.entryD) + ' back to trend' });
    }
    setHTML('rdA3Cards', cards(list));
    setHTML('rdA3Viz', '');
    setHTML('rdA3Note', 'Each stretch is measured from the first sample past the band to the first sample back at trend.');
    setHTML('rdA3Register', 'Historical, at this position &mdash; not a prediction. At trend the reversion record has nothing to say, which is itself the reading.');
    setHTML('rdA3Route', '<a class="rd-route" href="/discount-or-premium">Discount, or Premium? &rarr;</a>');
    setHTML('rdA3Sources', '<strong>Sources.</strong> The shared reversion-duration scan, the same one <a href="/discount-or-premium">Discount, or Premium?</a> publishes its duration record from, read at the two edges of that page&rsquo;s own near-trend band &mdash; ' + RD.NEAR_LO.toFixed(2) + '&times; and ' + RD.NEAR_HI.toFixed(2) + '&times;. Inside that band neither page reports a duration, because there is no gap to measure; these are the nearest stretches on either side of it.' +
      (longest
        ? ' The longest is that page&rsquo;s own longest stretch ' + (longBelow ? 'below' : 'above') +
          ' trend, reproducible there at <a href="/discount-or-premium?mult=' + (longBelow ? '0.94' : '1.06') + '">' +
          (longBelow ? '0.94' : '1.06') + '&times;</a> &mdash; and at every other multiple on that side of the band, since it is the same episode at all of them.'
        : ''));
  }

  /* IDENTITY 3 of 3 — the reversion module, off the floor and off trend.
     Two-sided by construction: below trend it reads stretches at or below
     this depth, above trend at or above it, and the only thing that changes
     is the direction word. */
  function renderReversion(visits, liveMult, spot, state) {
    var rec = RD.scan(liveMult);
    var premium = (state === 'above-trend');
    var dirWord = premium ? 'at or above' : 'at or below';

    // "depth" below trend, "height" above — the same question, and the word
    // that is true from where the reader is standing. Past tense throughout:
    // the module reports what a return HAS taken, never what one will.
    setHTML('rdA3Q', premium
      ? 'How long has a return to trend taken from this height?'
      : 'How long has a return to trend taken from this depth?');

    var closed = rec.episodes.filter(function (e) { return !e.ongoing; }).map(function (e) { return e.months; })
                             .sort(function (a, b) { return a - b; });
    var ongoing = rec.episodes.filter(function (e) { return e.ongoing; });

    if (!closed.length) {
      // Structurally possible: every stretch at this depth is still open.
      setHTML('rdA3Verdict', 'No stretch ' + dirWord + ' this depth has yet returned to trend, so the record has no completed duration to report from here.');
      setHTML('rdA3Cards', '');
    } else {
      var med = closed.length % 2 ? closed[(closed.length - 1) / 2]
                                  : (closed[closed.length / 2 - 1] + closed[closed.length / 2]) / 2;
      var thin = closed.length < 3;   // the N<3 rule, counted in EPISODES
      // "stretch" is this module's load-bearing noun and it is not
      // self-explanatory — the tip defines it on first use (§6.13).
      /* The era clause is not padding. This module counts from 2010 and the
         header card counts from 2014, and both are correct: the reversion scan
         reads the whole price series, while the floor count deliberately drops
         the pre-2014 genesis era the way The Bitcoin Floor does. Two different
         year-counts on one screen look like an error unless the page says why. */
      var stretchTip = tip('A continuous run of samples at or ' + (premium ? 'above' : 'below') +
        ' today&rsquo;s multiple of trend, measured to the first sample back at trend. ' +
        'Runs more than about 100 days apart count as separate episodes. ' +
        'These count from <strong>2010</strong>, where the price series begins; the floor count above starts at ' +
        '<strong>2014</strong> because it drops bitcoin&rsquo;s pre-exchange era, as <a href="/the-bitcoin-floor">The Bitcoin Floor</a> does.');
      setHTML('rdA3Verdict',
        '<strong>' + closed.length + '</strong> completed stretch' + (closed.length === 1 ? '' : 'es') + stretchTip +
        ' ' + dirWord + ' this depth since 2010. ' +
        (thin
          ? 'That is too few to read a spread from, so they are named rather than averaged: ' +
            closed.map(function (m) { return RD.fmtMonths(m); }).join(' and ') + '.'
          : 'They took between <strong>' + RD.fmtMonths(closed[0]) + '</strong> and <strong>' +
            RD.fmtMonths(closed[closed.length - 1]) + '</strong>, median <strong>' + RD.fmtMonths(med) + '</strong>.'));

      // Cards lead with the DATE and the trend price at it; the rate is the
      // sub-line and is annualised only at twelve months or more.
      var picks = thin
        ? closed.map(function (m, i) { return { label: closed.length === 1 ? 'The one on record' : (i === 0 ? 'Faster of the two' : 'Slower of the two'), m: m }; })
        : [{ label: 'Fastest', m: closed[0] }, { label: 'Median', m: med }, { label: 'Slowest', m: closed[closed.length - 1] }];
      setHTML('rdA3Cards', cards(picks.map(function (p) {
        var w = windowRead(p.m, spot);
        return { k: p.label + ' · ' + RD.fmtMonthsShort(p.m), v: fmtUSD(w.trendPrice), sub: 'trend price by ' + w.date + ' · ' + w.rateLine };
      })));
    }

    setHTML('rdA3Viz', '');
    var notes = [];
    if (rec.widened) notes.push('Too few completed stretches at exactly this depth, so the band was widened to ' + rec.band.toFixed(2) + '× to reach five &mdash; these describe that band, not today&rsquo;s multiple exactly.');
    if (ongoing.length) notes.push('One stretch is still open, running ' + RD.fmtMonths(ongoing[0].months) + ' so far; it is excluded from the figures above because it has no end yet.');
    /* The floor-approach note that stood here is GONE. It said "Last floor
       approach Jul 2026, the third since 2014" — which is now, word for word,
       the header card two screens up, since the round-two recast made the
       count and date that card's whole content. One screen stating the same
       two facts twice is exactly what the recast removed from the card, and
       it had a live ordinal bug behind it: the phrasing hard-coded "third"
       and fell back to `n + 'th'`, so a first or second approach would have
       printed "1th" / "2th". The era difference this note used to gesture at
       is now carried properly by the stretches tooltip, which explains why
       this module counts from 2010 and the card from 2014, and links out. */
    setHTML('rdA3Note', notes.join(' '));
    setHTML('rdA3Register', 'A conditional projection, not a forecast: each card assumes price returns to trend by that date and states the trend price it would return to. Whether it returns, and when, is exactly what is not known. <a href="#what-would-break-this">What would break this &rarr;</a>');
    setHTML('rdA3Route', '<a class="rd-route" href="/discount-or-premium">Discount, or Premium? &rarr;</a>');
    setHTML('rdA3Sources', '<strong>Sources.</strong> The shared reversion-duration scan, the same one <a href="/discount-or-premium">Discount, or Premium?</a> publishes its duration record from: every sample ' + dirWord + ' today&rsquo;s multiple of trend, grouped into episodes by the 100-day rule, measured to the first sample back at trend. <strong>Episodes are counted, not samples</strong> &mdash; ' + rec.nSamples + ' qualifying samples here fall into <strong>' + rec.episodes.length + ' episodes: ' + rec.episodes.filter(function (e) { return !e.ongoing; }).length + ' completed, ' + (rec.episodes.length - rec.episodes.filter(function (e) { return !e.ongoing; }).length) + ' open</strong>, and it is the COMPLETED episode count the thinness rule reads. The Dashboard states the same split for the same record. Trend prices are the shared Power Law module at each date. Rates are annualised only where the window is a year or more; shorter windows are shown as the total move, per the site convention.');
  }

  /* The dispatcher. One permanent module, three identities. */
  function renderPositionModule(visits, liveMult, spot) {
    var state = positionState(liveMult);
    if (inApproach(state)) return renderFloorApproach(visits, liveMult);
    if (state === 'near-trend') return renderAtTrend(visits, liveMult, spot);
    return renderReversion(visits, liveMult, spot, state);
  }

  /* ═══════════════════════════════════════════════════════════
     A4 — the bar this position sets (floor case vs trend case)
     Differentiated from D3 per JM ruling 7: A4 carries the PAIR, D3 carries
     the dated conditional path. The identity proved in Phase 0 — the hurdle
     page's position-view CAGR and D-or-P's reversion CAGR are the same
     expression — is why neither may headline the other's number.
     ═══════════════════════════════════════════════════════════ */
  /* C2: three bars, not two. The third — "returns to trend by then" — is the
     figure Phase 0 proved identical to D-or-P's reversion CAGR, and moving it
     here is JM's reslice: A4 shows the trio COMPARATIVELY, D3 shows the same
     rate OVER TIME with the never-reverts path and the stack dollars. A bar
     in a trio is read against its neighbours; a headline number is read as a
     promise. That is the whole of why the same figure can sit on both pages
     without either duplicating the other. */
  function hurdle(H, spot) {
    var t = TODAY_DAYS;
    return {
      floor: Math.pow((PL_FLOOR * plPrice(t + YEAR_D * H)) / spot, 1 / H) - 1,
      trend: Math.pow(plPrice(t + YEAR_D * H) / plPrice(t), 1 / H) - 1,
      revert: Math.pow(plPrice(t + YEAR_D * H) / spot, 1 / H) - 1
    };
  }
  function renderA4(spot) {
    var H = a4Horizon, r = hurdle(H, spot);
    /* Defect, round two: "a year over 1 years". One helper, so no call site
       can pluralise differently from another — the readout, the card sub-line
       and the chart's aria-label all read from this. */
    var yrs = H + (H === 1 ? ' year' : ' years');
    setText('rdA4HzOut', yrs);
    /* The trend bar leads because the Hurdle Rate page PRINTS it at each
       horizon; its floor case is drawn as a curve and never written as a
       number, so it renders here as the conservative companion and the sources
       line says where to read it. */
    /* A5 (C28): "reaching ONLY the channel floor" is written from below and
       reads as nonsense from above trend, where ending at the floor is a long
       fall rather than a modest outcome. The conservative case is now stated
       direction-neutrally — price ENDS at the floor by then — and the sentence
       around it branches on state (B6). The arithmetic is untouched. */
    var mult = spot / plPrice(TODAY_DAYS), state = positionState(mult);
    var floorTxt = 'if price only <em>ends</em> at the floor by then';
    var lead;
    if (state === 'above-trend') {
      lead = 'Bitcoin&rsquo;s trend sets a bar of <strong>' + pct1(r.trend * 100) + '</strong> a year over ' + yrs + '. From a premium, the floor case is not a mild outcome but a long unwinding: ' +
        'capital deployed at today&rsquo;s price and ending at the floor returns ' + pct1(r.floor * 100) + ' a year.';
    } else if (state === 'near-trend') {
      lead = 'Bitcoin&rsquo;s trend sets a bar of <strong>' + pct1(r.trend * 100) + '</strong> a year over ' + yrs + '. Buying at roughly today&rsquo;s price is buying at roughly that bar; ' +
        'the floor case &mdash; price ending at 0.42&times; trend by then &mdash; returns ' + pct1(r.floor * 100) + '.';
    } else {
      lead = 'Bitcoin&rsquo;s trend sets a bar of <strong>' + pct1(r.trend * 100) + '</strong> a year over ' + yrs + '. The conservative version &mdash; capital deployed at today&rsquo;s price and only <em>ending</em> at the channel floor by then &mdash; still clears ' +
        pct1(r.floor * 100) + '.';
    }
    setHTML('rdA4Verdict', lead);
    setHTML('rdA4Cards', cards([
      { k: 'If price ends at the floor' + tip('Capital deployed at today&rsquo;s price, with price sitting at the 0.42&times; channel floor on the horizon date. The conservative case &mdash; not a forecast that it gets there.'),
        v: pct1(r.floor * 100), sub: 'a year over ' + yrs },
      // Relabelled round two: "If you had bought at trend" invited the reader
      // to wonder WHEN they had bought. The card is about today's trend price.
      { k: 'Bought at today’s trend price' + tip('Buying at today&rsquo;s trend price and ending at the trend price on the horizon date &mdash; the trend&rsquo;s own growth, and the baseline the other two bars are measured against.'),
        v: pct1(r.trend * 100), sub: 'the trend’s own growth' },
      { k: 'If price returns to trend', v: pct1(r.revert * 100), sub: 'by ' + (new Date(Date.UTC(new Date().getUTCFullYear() + H, new Date().getUTCMonth(), 1))).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) }
    ]));

    /* The bars are drawn on a signed axis. Above trend the third case goes
       NEGATIVE on short horizons — returning to trend from a premium is a
       fall — and that is the risk read the trio exists to deliver. A chart
       that could only draw rightwards would hide it. */
    var W = 700, H2 = 196, PADL = 150, PADR = 52, TOP = 22, BH = 30, GAP = 26;
    var rows = [['If price ends at the floor', r.floor, 'rd-bar-floor'],
                ['If you had bought at trend', r.trend, 'rd-bar-trend'],
                ['If price returns to trend', r.revert, 'rd-bar-revert']];
    var vals = rows.map(function (x) { return x[1]; });
    var vmax = Math.max.apply(null, vals.concat([0])) * 1.2;
    var vmin = Math.min.apply(null, vals.concat([0])) * 1.2;
    if (vmax - vmin < 1e-6) vmax = 0.01;
    var plotW = W - PADL - PADR;
    function X(v) { return PADL + (v - vmin) / (vmax - vmin) * plotW; }
    var zx = X(0);
    var s = svgOpen(W, H2, 'The annual rate each case implies from today’s price, over ' + yrs);
    s += '<line class="rd-ax" x1="' + zx + '" y1="' + (TOP - 6) + '" x2="' + zx + '" y2="' + (TOP + 3 * BH + 2 * GAP + 4) + '"/>';
    rows.forEach(function (row, i) {
      var y = TOP + i * (BH + GAP), x = X(row[1]);
      var x0 = Math.min(zx, x), w = Math.max(2, Math.abs(x - zx));
      s += '<text class="rd-barlbl" x="' + (PADL - 12) + '" y="' + (y + BH / 2 + 4) + '" text-anchor="end">' + row[0] + '</text>';
      s += '<rect class="' + row[2] + '" x="' + x0 + '" y="' + y + '" width="' + w + '" height="' + BH + '" rx="3"/>';
      var lx = row[1] >= 0 ? x + 8 : x - 8;
      s += '<text class="rd-barval" x="' + lx + '" y="' + (y + BH / 2 + 4) + '"' + (row[1] >= 0 ? '' : ' text-anchor="end"') + '>' + pct1(row[1] * 100) + '</text>';
    });
    s += illustrativeTag(PADL, H2 - 10);
    s += '</svg>';
    setHTML('rdA4Viz', s);
  }

  /* ═══════════════════════════════════════════════════════════
     D1 — deploy now, or wait for lower?   [CLAMPED position]
     Verdict language is Wait-or-Deploy's own, quoted rather than rewritten.
     Its trailing directive is not carried: the Rundown's imperative ban holds,
     and the design doc quotes this verdict without it.
     ═══════════════════════════════════════════════════════════ */
  function wodnVerdict(paid) {
    if (paid < 25) return 'Waiting was almost always the wrong call here.';
    if (paid < 60) return 'Roughly a coin-flip &mdash; no clear edge to waiting.';
    return 'Waiting more often left you with more coins.';
  }
  function renderD1(m) {
    if (!m) return;
    var beat = 100 - m.paid;
    setHTML('rdD1Verdict', '<strong>' + wodnVerdict(m.paid) + '</strong> In ' + pct0(m.never) +
      ' of matched entries the lower price never arrived within two years at all.');
    setHTML('rdD1Cards', cards([
      { k: 'Deploying at once won', v: pct0(beat), sub: 'of ' + m.n + ' matched entries' },
      { k: 'Waiting won', v: pct0(m.paid), sub: 'more coins for the same money' },
      { k: 'The dip never came' + tip('The waiter is holding out for a channel position 0.15 lower than the entry &mdash; the shared engine&rsquo;s own definition of a lower entry. This is the share of matched entries where that never arrived inside two years, and the waiter deployed at the two-year price instead.', true), v: pct0(m.never), sub: 'within two years' }
    ]));

    var W = 700, H = 96, PADL = 10, PADR = 10, BY = 26, BH = 34, BW = W - PADL - PADR;
    var wNow = Math.max(0, beat) / 100 * BW;
    var s = svgOpen(W, H, 'Share of matched entries where deploying at once beat waiting');
    s += '<rect class="rd-split-b" x="' + PADL + '" y="' + BY + '" width="' + BW + '" height="' + BH + '" rx="4"/>';
    s += '<rect class="rd-split-a" x="' + PADL + '" y="' + BY + '" width="' + wNow + '" height="' + BH + '" rx="4"/>';
    s += '<text class="rd-splitlbl" x="' + (PADL + 10) + '" y="' + (BY + BH / 2 + 4) + '">Deployed at once &mdash; ' + pct0(beat) + '</text>';
    if (m.paid > 8) s += '<text class="rd-splitlbl is-b" x="' + (W - PADR - 10) + '" y="' + (BY + BH / 2 + 4) + '" text-anchor="end">Waited &mdash; ' + pct0(m.paid) + '</text>';
    s += '<text class="rd-axlbl" x="' + PADL + '" y="' + (BY + BH + 18) + '">' + m.n + ' entries matched to this position, ' + fmtMonthShort(S[m.entries[0]].d) + ' onward</text>';
    s += '</svg>';
    setHTML('rdD1Viz', s);
  }

  /* ═══════════════════════════════════════════════════════════
     D2 — all at once, or ladder in?   [RAW position — LSLI does not clamp]
     Carries the DCA question too (JM ruling 9): no position-conditioned DCA
     engine exists, and a ladder started today is the nearest honest read.
     ═══════════════════════════════════════════════════════════ */
  /* LSLI's OWN DEFAULTS, and they are not the obvious ones: the era defaults to
     post-2020, not to the whole record. Reading this snack on the full record
     would quote a different bucket — a different n and a different mean — than
     the page it routes to shows on arrival, which is exactly the failure the
     consistency test exists to catch. Caught by checking the shipped page
     rather than by assuming.
     LSLI also reports the WINNER's margin and the WINNER's rate, so this snack
     does the same: quoting the ladder's own 0% win rate beside that page's
     100% would read as a contradiction between two true statements. */
  var D2_ERA = 'post-2020', D2_N = 30;
  function renderD2(rawPos) {
    var b = LA.bucketAt(D2_ERA, D2_N, rawPos);
    if (!b.n || b.n < 4) {
      setHTML('rdD2Verdict', 'Bitcoin has rarely sat at this position since 2020 &mdash; too few entries here to read a ladder result from. Lump Sum or Ladder In can widen the window.');
      setHTML('rdD2Cards', ''); setHTML('rdD2Viz', '');
      return;
    }
    var ladderWon = b.mean > 0;
    var winName = ladderWon ? 'laddering in' : 'a single purchase';
    var loseName = ladderWon ? 'a single purchase' : 'laddering in';
    var winRate = ladderWon ? b.win : (100 - b.win);
    setHTML('rdD2Verdict',
      'From entries at this position, <strong>' + winName + '</strong> ended with <strong>' +
      pct0(Math.abs(b.mean)) + ' more coins</strong> than ' + loseName +
      ' on average, and won in ' + pct0(winRate) + ' of them.');
    setHTML('rdD2Cards', cards([
      { k: 'How much it won by', v: '+' + pct0(Math.abs(b.mean)), sub: 'more coins accumulated' },
      { k: 'How often', v: pct0(winRate), sub: 'of ' + b.n + ' entries here since 2020' },
      { k: 'Ladder length', v: '~1 year', sub: D2_N + ' buys, evenly spaced' }
    ]));

    // The advantage curve across the whole channel, with today marked. This is
    // the instrument test (§0): the curve is general, the marker is not.
    var curve = LA.advantageCurve(D2_ERA, D2_N);
    if (curve.length < 2) { setHTML('rdD2Viz', ''); return; }
    var W = 700, H = 190, PADL = 46, PADR = 14, TOP = 14, BOT = 34;
    var xs = curve.map(function (p) { return p.x; }), ys = curve.map(function (p) { return p.y; });
    var xmin = Math.min.apply(null, xs), xmax = Math.max.apply(null, xs);
    var ymin = Math.min.apply(null, ys.concat([0])), ymax = Math.max.apply(null, ys.concat([0]));
    var pad = (ymax - ymin) * 0.12 || 1; ymin -= pad; ymax += pad;
    function X(v) { return PADL + (v - xmin) / (xmax - xmin) * (W - PADL - PADR); }
    function Y(v) { return TOP + (ymax - v) / (ymax - ymin) * (H - TOP - BOT); }
    var s = svgOpen(W, H, 'Ladder-in advantage across channel position, with today marked');
    s += '<line class="rd-ax" x1="' + PADL + '" y1="' + Y(0) + '" x2="' + (W - PADR) + '" y2="' + Y(0) + '"/>';
    s += '<text class="rd-axlbl" x="' + (PADL - 6) + '" y="' + (Y(0) + 4) + '" text-anchor="end">0%</text>';
    s += '<text class="rd-axlbl" x="' + (PADL - 6) + '" y="' + (Y(ymax) + 10) + '" text-anchor="end">' + Math.round(ymax) + '%</text>';
    s += '<text class="rd-axlbl" x="' + (PADL - 6) + '" y="' + (Y(ymin) - 2) + '" text-anchor="end">' + Math.round(ymin) + '%</text>';
    s += '<polyline class="rd-line" points="' + curve.map(function (p) { return X(p.x).toFixed(1) + ',' + Y(p.y).toFixed(1); }).join(' ') + '"/>';
    var mx = X(Math.max(xmin, Math.min(xmax, rawPos)));
    s += '<line class="rd-today" x1="' + mx + '" y1="' + TOP + '" x2="' + mx + '" y2="' + (H - BOT) + '"/>';
    s += '<circle class="rd-dot" cx="' + mx + '" cy="' + Y(Math.max(ymin, Math.min(ymax, b.mean))) + '" r="4.5"/>';
    s += '<text class="rd-todaylbl" x="' + Math.min(mx + 6, W - PADR - 40) + '" y="' + (TOP + 10) + '">today</text>';
    s += '<text class="rd-axlbl" x="' + PADL + '" y="' + (H - 10) + '">floor of the channel</text>';
    s += '<text class="rd-axlbl" x="' + (W - PADR) + '" y="' + (H - 10) + '" text-anchor="end">top of the channel</text>';
    s += '</svg>';
    setHTML('rdD2Viz', s);
  }

  /* ═══════════════════════════════════════════════════════════
     D3 — what the discount is worth if it reverts
     THE §5 CONDITIONAL-PROJECTION PATTERN. All five elements, and the
     arithmetic line is quoted verbatim from Discount, or Premium?
     ═══════════════════════════════════════════════════════════ */
  function horizonDate(months) {
    return dayToDate(TODAY_DAYS + YEAR_D * months / 12)
      .toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  /* C2 — the reversion ticks. Marks on the reverts-by slider at how long
     stretches at this depth actually took, from the same scan the position
     module reads, so the reader can put the slider where the record has been
     rather than only where they guess.

     A tick outside the slider's 6–60 range is NAMED but not drawn. At today's
     depth the fastest completed stretch is under six months, and the honest
     move is to say so rather than to widen a control past the range its
     canonical home offers. */
  var D3_MIN = 6, D3_MAX = 60;
  function renderD3Ticks(spot) {
    var host = document.getElementById('rdD3TickStrip');
    var dl = document.getElementById('rdD3Ticks');
    if (!host) return;
    var mult = spot / plPrice(TODAY_DAYS);
    var rec = RD.scan(mult);
    if (!rec || rec.state === 'hidden' || !rec.episodes) { host.innerHTML = ''; return; }
    var closed = rec.episodes.filter(function (e) { return !e.ongoing; }).map(function (e) { return e.months; })
                             .sort(function (a, b) { return a - b; });
    if (!closed.length) { host.innerHTML = ''; return; }
    var med = closed.length % 2 ? closed[(closed.length - 1) / 2]
                                : (closed[closed.length / 2 - 1] + closed[closed.length / 2]) / 2;
    var marks = closed.length < 3
      ? closed.map(function (m, i) { return { lbl: 'on record', m: m }; })
      : [{ lbl: 'fastest', m: closed[0] }, { lbl: 'median', m: med }, { lbl: 'slowest', m: closed[closed.length - 1] }];

    var inRange = marks.filter(function (k) { return k.m >= D3_MIN && k.m <= D3_MAX; });
    var below = marks.filter(function (k) { return k.m < D3_MIN; });
    var above = marks.filter(function (k) { return k.m > D3_MAX; });

    var html = '<div class="rd-ticks-rail">';
    inRange.forEach(function (k) {
      var pctPos = (k.m - D3_MIN) / (D3_MAX - D3_MIN) * 100;
      html += '<span class="rd-tick-mark" style="left:' + pctPos.toFixed(2) + '%">' +
              '<span class="rd-tick-lbl">' + k.lbl + ' · ' + RD.fmtMonthsShort(k.m) + '</span></span>';
    });
    html += '</div>';
    var say = ['Where stretches at this depth actually ended.'];
    if (below.length) say.push('The ' + below.map(function (k) { return k.lbl; }).join(' and ') +
      ' (' + below.map(function (k) { return RD.fmtMonths(k.m); }).join(', ') +
      ') is shorter than this slider goes — it matches the range on Discount, or Premium?, and is not widened past it.');
    if (above.length) say.push('The ' + above.map(function (k) { return k.lbl; }).join(' and ') + ' runs past the slider’s end.');
    html += '<p class="rd-ticks-note">' + say.join(' ') + '</p>';
    host.innerHTML = html;

    /* Tier any tick labels that overlap, measured after insertion rather than
       alternated by index. Two marks that are far apart at 1280 can sit on
       top of each other at 375, and which pair collides depends on the
       durations the record happens to hold today — so this has to be measured
       every render, not decided once. Same lesson as the A3 timeline. */
    var lbls = [].slice.call(host.querySelectorAll('.rd-tick-mark'));
    var placed = [];
    lbls.forEach(function (mk) {
      var el = mk.querySelector('.rd-tick-lbl');
      mk.classList.remove('is-row2');
      var r = el.getBoundingClientRect(), row = 0;
      for (var i = 0; i < placed.length; i++) {
        if (placed[i].row === 0 && !(r.right + 6 < placed[i].L || r.left - 6 > placed[i].R)) { row = 1; break; }
      }
      if (row === 1) mk.classList.add('is-row2');
      placed.push({ L: r.left, R: r.right, row: row });
    });
    host.classList.toggle('has-row2', placed.some(function (p) { return p.row === 1; }));
  }

  function renderD3(spot) {
    var y = d3Months / 12;
    var trendNow = plPrice(TODAY_DAYS), trendThen = plPrice(TODAY_DAYS + YEAR_D * y);
    var mult = spot / trendNow;
    var rev = Math.pow(trendThen / spot, 1 / y) - 1;
    var tr = Math.pow(trendThen / trendNow, 1 / y) - 1;
    var delta = rev - tr;
    var when = horizonDate(d3Months);

    setText('rdD3HzOut', d3Months < 12 ? d3Months + ' months' : (d3Months / 12) + (d3Months === 12 ? ' year' : ' years'));
    setText('rdD3When', when);
    /* C2: D3 no longer HEADLINES the rate — that figure is now A4's third
       bar, and the same number may not headline twice. D3 keeps what is
       uniquely its own: the reverts-by date, the path chart with the
       never-reverts line, and the stack dollars. The rate is referenced as
       "the rate above" and shown under the convention: annualised only at a
       year or more, total move below that. */
    var w3 = windowRead(d3Months, spot);
    setHTML('rdD3Verdict',
      'If price returns to trend by <strong>' + when + '</strong>, the trend price then is <strong>' +
      fmtUSD(trendThen) + '</strong> &mdash; <strong>' + w3.rateLine + '</strong> from today. ' +
      'That is the rate above, seen over time rather than as a bar. It is arithmetic, not a forecast.');

    var cs = [
      { k: 'Trend price by ' + when, v: fmtUSD(trendThen), sub: w3.rateLine },
      { k: 'If you had bought at trend', v: signPct0(tr * 100), sub: 'a year — the baseline' }
    ];
    if (stackBTC) {
      cs.push({ k: 'Your stack at trend then', v: fmtUSDshort(stackBTC * trendThen), sub: 'from ' + fmtUSDshort(stackBTC * spot) + ' today' });
    }
    setHTML('rdD3Cards', cards(cs));
    renderD3Ticks(spot);

    // Log-price paths from today to the horizon: the reversion glide (labelled
    // illustrative, §5 element 2) and the never-reverts path beside it
    // (§5 element 3 — the conditional never stands alone).
    var W = 700, Ht = 190, PADL = 54, PADR = 60, TOP = 18, BOT = 30;
    var d0 = TODAY_DAYS, d1 = TODAY_DAYS + YEAR_D * y;
    var pts = 40;
    function glide(d) { var u = (d - d0) / (d1 - d0); return Math.exp(Math.log(spot) * (1 - u) + Math.log(trendThen) * u); }
    function never(d) { return mult * plPrice(d); }
    function trendAt(d) { return plPrice(d); }
    var lo = Math.min(spot, mult * plPrice(d1)), hi = Math.max(trendThen, mult * plPrice(d1), trendNow);
    var lLo = Math.log(lo * 0.94), lHi = Math.log(hi * 1.06);
    function X(d) { return PADL + (d - d0) / (d1 - d0) * (W - PADL - PADR); }
    function Y(p) { return TOP + (lHi - Math.log(p)) / (lHi - lLo) * (Ht - TOP - BOT); }
    function path(fn, cls) {
      var a = [];
      for (var k = 0; k <= pts; k++) { var d = d0 + (d1 - d0) * k / pts; a.push(X(d).toFixed(1) + ',' + Y(fn(d)).toFixed(1)); }
      return '<polyline class="' + cls + '" points="' + a.join(' ') + '"/>';
    }
    var s = svgOpen(W, Ht, 'Two paths from today to ' + when + ': a reversion to trend, and the multiple staying where it is');
    s += path(trendAt, 'rd-line rd-line-trend');
    s += path(never, 'rd-line rd-line-never');
    s += path(glide, 'rd-line rd-line-glide');
    s += '<circle class="rd-dot" cx="' + X(d0) + '" cy="' + Y(spot) + '" r="4"/>';
    s += '<text class="rd-axlbl" x="' + PADL + '" y="' + (Ht - 10) + '">today ' + fmtUSDshort(spot) + '</text>';
    s += '<text class="rd-axlbl" x="' + (W - PADR) + '" y="' + (Ht - 10) + '" text-anchor="middle">' + when + '</text>';
    s += '<text class="rd-endlbl" x="' + (X(d1) + 6) + '" y="' + (Y(trendThen) + 4) + '">trend</text>';
    s += '<text class="rd-endlbl is-never" x="' + (X(d1) + 6) + '" y="' + (Y(mult * plPrice(d1)) + 4) + '">never reverts</text>';
    s += illustrativeTag(X(d0 + (d1 - d0) * 0.62), Y(glide(d0 + (d1 - d0) * 0.62)) - 8);
    s += '</svg>';
    setHTML('rdD3Viz', s);
  }

  /* ═══════════════════════════════════════════════════════════
     R1 — selling here to rebuy lower   [CLAMPED position]
     ═══════════════════════════════════════════════════════════ */
  /* The HEADLINE figure is the win rate, not the median round-trip ratio, and
     that is a consistency-test decision rather than an editorial one: Wait-or-
     Deploy prints the win rate as its hero, so it reproduces exactly. The
     median ratio is a real output of the same shared engine but neither source
     page prints it raw — How Much Cash applies its own split and tax to it
     first — so it renders as a supporting card that says what it is and what
     that page does to it. Caught by reading both destinations, not by assuming. */
  function renderR1(m) {
    if (!m) return;
    setHTML('rdR1Verdict',
      'Selling here in the hope of rebuying lower left you with more coins in <strong>' + pct0(m.paid) +
      '</strong> of matched entries. In ' + pct0(m.never) + ' of them the lower price never arrived within two years.');
    var cs = [
      { k: 'The round trip won', v: pct0(m.paid), sub: 'of ' + m.n + ' matched entries' },
      { k: 'Median coins back' + tip('Sell one coin here, buy back at the first lower entry within two years: this is how many coins the median round trip ended with. Below 1.00&times; the round trip cost coins rather than gaining them.', true), v: m.ratio.toFixed(2) + '×', sub: 'per coin sold — before any split or tax' }
    ];
    if (stackBTC) {
      cs.push({ k: 'Your stack, round-tripped', v: btc(stackBTC * m.ratio) + ' BTC', sub: 'from ' + btc(stackBTC) + ' BTC, before split or tax' });
    }
    setHTML('rdR1Cards', cards(cs));

    var W = 700, H = 116, PADL = 10, PADR = 10, BY = 22, BH = 26;
    var BW = W - PADL - PADR;
    var s = svgOpen(W, H, 'Coins held after the median round trip, against coins held by doing nothing');
    s += '<text class="rd-barlbl2" x="' + PADL + '" y="' + (BY - 6) + '">Held &mdash; ' + (stackBTC ? btc(stackBTC) + ' BTC' : '1.00×') + '</text>';
    s += '<rect class="rd-bar-trend" x="' + PADL + '" y="' + BY + '" width="' + BW + '" height="' + BH + '" rx="3"/>';
    var y2 = BY + BH + 26;
    s += '<text class="rd-barlbl2" x="' + PADL + '" y="' + (y2 - 6) + '">Sold and rebought &mdash; ' + (stackBTC ? btc(stackBTC * m.ratio) + ' BTC' : m.ratio.toFixed(2) + '×') + '</text>';
    s += '<rect class="rd-bar-floor" x="' + PADL + '" y="' + y2 + '" width="' + Math.max(2, BW * m.ratio) + '" height="' + BH + '" rx="3"/>';
    s += '</svg>';
    setHTML('rdR1Viz', s);
  }


  /* ═══════════════════════════════════════════════════════════
     B1 — how far are the rebalancing bands from triggering?
     A NOW-READ at Disciplined Rebalancing's own STANDARD preset (JM ruling 8):
     the tool's defaults, named as the tool's defaults, with "set your own" as
     the route. The v2 input set gains no allocation fields for this.
     ═══════════════════════════════════════════════════════════ */
  var DR_RATIOS = (function () {
    var a = [];
    for (var i = 0; i < PL_DATA.length; i++) { var t = plPrice(PL_DATA[i][0]); if (t > 0) a.push(PL_DATA[i][1] / t); }
    a.sort(function (x, y) { return x - y; });
    return a;
  })();
  // Disciplined Rebalancing's calculator IIFE — the one whose readouts the
  // reader sees. (Its channel-viz IIFE interpolates instead; verified in Phase 0
  // to agree exactly at both preset percentiles, so the route reproduces.)
  function drRatio(P) {
    if (P <= 0) return DR_RATIOS[0];
    if (P >= 100) return DR_RATIOS[DR_RATIOS.length - 1];
    return DR_RATIOS[Math.floor(DR_RATIOS.length * P / 100)];
  }
  function renderB1(spot) {
    var trendNow = plPrice(TODAY_DAYS), k = spot / trendNow;
    var sell = drRatio(80), rebuy = drRatio(50);
    var sellP = sell * trendNow, rebuyP = rebuy * trendNow;
    setHTML('rdB1Verdict',
      'Neither band is near. At the standard settings the rebuy line sits <strong>' + pct0((rebuy / k - 1) * 100) +
      '</strong> above spot, which is another way of saying a protocol like this one would be buying here rather than selling.');
    setHTML('rdB1Cards', cards([
      { k: 'Sell band (80th pctile)' + tip('The price-to-trend ratio at or above which Disciplined Rebalancing&rsquo;s standard preset sells. The 80th percentile means priced higher than 80% of days in the record, relative to trend &mdash; not a percentile of price itself.'), v: sell.toFixed(2) + '×', sub: fmtUSDshort(sellP) + ' — ' + pct0((sell / k - 1) * 100) + ' above spot' },
      { k: 'Rebuy band (50th pctile)' + tip('The ratio at or below which that preset buys back after a sell. The 50th percentile is the historical median position relative to trend.'), v: rebuy.toFixed(2) + '×', sub: fmtUSDshort(rebuyP) + ' — ' + pct0((rebuy / k - 1) * 100) + ' above spot' },
      { k: 'Today', v: k.toFixed(2) + '×', sub: 'below both' }
    ]));

    // A vertical ladder of the channel with the two bands and spot on it.
    var W = 700, H = 176, PADT = 18, PADB = 26, X0 = 150, X1 = W - 150;
    var top = Math.max(sell, 1.0) * 1.12, bot = Math.min(k, rebuy) * 0.82;
    function Y(v) { return PADT + (Math.log(top) - Math.log(v)) / (Math.log(top) - Math.log(bot)) * (H - PADT - PADB); }
    var s = svgOpen(W, H, 'Where spot sits against the tool’s standard sell and rebuy bands');
    s += '<line class="rd-ladder" x1="' + ((X0 + X1) / 2) + '" y1="' + PADT + '" x2="' + ((X0 + X1) / 2) + '" y2="' + (H - PADB) + '"/>';
    [[sell, 'Sell band', 'rd-band-sell'], [1.0, 'Trend', 'rd-band-trend'], [rebuy, 'Rebuy band', 'rd-band-rebuy']].forEach(function (row) {
      var y = Y(row[0]);
      s += '<line class="' + row[2] + '" x1="' + X0 + '" y1="' + y + '" x2="' + X1 + '" y2="' + y + '"/>';
      s += '<text class="rd-barlbl" x="' + (X0 - 10) + '" y="' + (y + 4) + '" text-anchor="end">' + row[1] + '</text>';
      s += '<text class="rd-barval" x="' + (X1 + 10) + '" y="' + (y + 4) + '">' + row[0].toFixed(2) + '× · ' + fmtUSDshort(row[0] * trendNow) + '</text>';
    });
    var ys = Y(k);
    s += '<circle class="rd-dot" cx="' + ((X0 + X1) / 2) + '" cy="' + ys + '" r="6"/>';
    s += '<text class="rd-todaylbl" x="' + (X0 - 10) + '" y="' + (ys + 4) + '" text-anchor="end">today</text>';
    s += '<text class="rd-barval" x="' + (X1 + 10) + '" y="' + (ys + 4) + '">' + k.toFixed(2) + '× · ' + fmtUSDshort(spot) + '</text>';
    s += '</svg>';
    setHTML('rdB1Viz', s);
  }

  /* ═══════════════════════════════════════════════════════════
     P1 — what stack the target needs, read from here
     Engine: RetirementEngine.lineFor — what Bitcoin Escape Velocity publishes.
     The flagship never calls it, which is why the route goes to EV (JM ruling 3
     / Phase 0 §3.2b). §5 pattern applies: each figure names its condition, the
     alternative renders beside it, the arithmetic line is present.
     ═══════════════════════════════════════════════════════════ */
  function scenario() {
    return {
      btcStack: stackBTC || 1.0,
      targetIncomeUSD: st.targetIncomeUSD,
      retirementYear: st.retirementYear,
      yearsInRetirement: YEARS_IN_RETIREMENT
    };
  }
  function fmtLine(ln) {
    if (!ln || ln.value == null) return null;
    return ln.value;
  }
  function renderP1() {
    var scn = scenario();
    var here = fmtLine(RE.lineFor('stack', scn, 'current'));
    var floor = fmtLine(RE.lineFor('stack', scn, 'trend', null, 'powerlaw-floor'));

    if (here == null) {
      setHTML('rdP1Verdict', 'No stack inside the engine’s range covers that plan from here. Bitcoin Escape Velocity shows where the limit sits.');
      setHTML('rdP1Cards', ''); setHTML('rdP1Viz', ''); return;
    }
    setHTML('rdP1Verdict',
      'Retiring in <strong>' + st.retirementYear + '</strong> on <strong>' + fmtUSDshort(st.targetIncomeUSD) +
      '</strong> a year needs about <strong>' + btc(here) + ' BTC</strong> if today’s gap to trend persists. That is the model’s arithmetic, not a forecast.');

    var cs = [
      { k: 'If today’s gap persists' + tip('Prices projected forward at the trend&rsquo;s own growth rate, but starting from today&rsquo;s actual price rather than today&rsquo;s trend price &mdash; so the gap between the two never closes.'), v: btc(here) + ' BTC', sub: 'read from today’s price' },
      { k: 'If price tracks the floor' + tip('The site-wide floor-case growth model: price sits at 0.42&times; the trend for the whole plan. The more conservative of the two, and reachable on Escape Velocity by switching the growth model.'), v: floor == null ? '—' : btc(floor) + ' BTC', sub: 'the 0.42× floor case' }
    ];
    if (stackBTC) {
      var gap = stackBTC - here;
      cs.push({ k: gap >= 0 ? 'Your surplus' : 'Your shortfall', v: (gap >= 0 ? '+' : '−') + btc(Math.abs(gap)) + ' BTC',
                sub: 'against ' + btc(here) + ' BTC, from ' + btc(stackBTC) + ' held' });
    }
    setHTML('rdP1Cards', cards(cs));

    var W = 700, H = stackBTC ? 176 : 140, PADL = 168, PADR = 76, TOP = 22, BH = 28, GAP = 24;
    var rows = [['If today’s gap persists', here, 'rd-bar-trend'], ['If price tracks the floor', floor, 'rd-bar-floor']];
    if (stackBTC) rows.push(['Your stack today', stackBTC, 'rd-bar-you']);
    var maxv = Math.max.apply(null, rows.map(function (r) { return r[1] || 0; })) * 1.2 || 1;
    var s = svgOpen(W, H, 'The stack this plan needs under each case, against the stack held');
    rows.forEach(function (r, i) {
      if (r[1] == null) return;
      var y = TOP + i * (BH + GAP), w = Math.max(2, r[1] / maxv * (W - PADL - PADR));
      s += '<text class="rd-barlbl" x="' + (PADL - 10) + '" y="' + (y + BH / 2 + 4) + '" text-anchor="end">' + r[0] + '</text>';
      s += '<rect class="' + r[2] + '" x="' + PADL + '" y="' + y + '" width="' + w + '" height="' + BH + '" rx="3"/>';
      s += '<text class="rd-barval" x="' + (PADL + w + 8) + '" y="' + (y + BH / 2 + 4) + '">' + btc(r[1]) + ' BTC</text>';
    });
    s += illustrativeTag(PADL, H - 8);
    s += '</svg>';
    setHTML('rdP1Viz', s);

    setHTML('rdP1Basis', 'Over a ' + YEARS_IN_RETIREMENT + '-year retirement, at the site’s ' +
      MA.get('inflation').value + '% inflation assumption.');
  }

  /* ═══════════════════════════════════════════════════════════
     P2 — what drawdowns from this zone have looked like  [CLAMPED]
     The Stress Test is the ROUTE, not the source — v1 §16.3's R7 ruling,
     which carries. The figures are the shared channel-entry engine's.
     ═══════════════════════════════════════════════════════════ */
  function renderP2(m) {
    if (!m) return;
    var zeroish = m.ddDepth > -1;
    setHTML('rdP2Verdict',
      '<strong>' + pct0(m.ddProb) + '</strong> of entries at this position fell 20% or more within two years, and <strong>' +
      pct0(m.neverFell) + '</strong> never traded below their entry price at all.');
    setHTML('rdP2Cards', cards([
      { k: 'Fell 20%+ within two years', v: pct0(m.ddProb), sub: 'of ' + m.n + ' matched entries' },
      { k: 'Never traded below entry', v: pct0(m.neverFell), sub: 'over the same window' },
      { k: 'Median deepest fall' + tip('Each matched entry&rsquo;s deepest fall below its own buy price within two years, then the median across them. &ldquo;About zero&rdquo; means the typical entry from here never traded meaningfully below what it paid.', true), v: zeroish ? 'about zero' : Math.round(m.ddDepth) + '%', sub: 'from the entry price' }
    ]));

    var W = 700, H = 120, PADL = 210, PADR = 70, TOP = 18, BH = 24, GAP = 18;
    var s = svgOpen(W, H, 'Share of entries at this position that fell, and that never did');
    [['Fell 20% or more', m.ddProb, 'rd-bar-floor'], ['Fell, but less than 20%', 100 - m.ddProb - m.neverFell, 'rd-bar-mid'], ['Never traded below entry', m.neverFell, 'rd-bar-trend']].forEach(function (r, i) {
      var y = TOP + i * (BH + GAP), w = Math.max(1.5, Math.max(0, r[1]) / 100 * (W - PADL - PADR));
      s += '<text class="rd-barlbl" x="' + (PADL - 10) + '" y="' + (y + BH / 2 + 4) + '" text-anchor="end">' + r[0] + '</text>';
      s += '<rect class="' + r[2] + '" x="' + PADL + '" y="' + y + '" width="' + w + '" height="' + BH + '" rx="3"/>';
      s += '<text class="rd-barval" x="' + (PADL + w + 8) + '" y="' + (y + BH / 2 + 4) + '">' + pct0(Math.max(0, r[1])) + '</text>';
    });
    s += '</svg>';
    setHTML('rdP2Viz', s);
  }

  /* ═══════════════════════════════════════════════════════════
     THE INTENT ROUTER — display only (§3, §8)
     It selects which shipped snacks render. It never generates a
     recommendation, never alters a verdict's wording, and never touches a
     computed figure. Every snack computes the same numbers whatever is chosen.
     ═══════════════════════════════════════════════════════════ */
  var INTENT_LABEL = {
    deploy: 'deploying new capital', dca: 'starting or continuing a DCA',
    cash: 'raising cash', rebalance: 'rebalancing',
    retire: 'planning retirement', looking: 'just looking'
  };

  function applyIntent() {
    var snacks = document.querySelectorAll('[data-intent]');
    var always = 0, mine = 0, shown = [];
    for (var i = 0; i < snacks.length; i++) {
      var list = snacks[i].getAttribute('data-intent').split(/\s+/);
      var isAlways = list.indexOf('always') >= 0;
      var show = isAlways || list.indexOf(st.intent) >= 0;
      snacks[i].hidden = !show;
      if (show) { shown.push(snacks[i]); if (isAlways) always++; else mine++; }
    }
    var btns = document.querySelectorAll('.rd-chip');
    for (var j = 0; j < btns.length; j++) {
      var on = btns[j].getAttribute('data-intent-set') === st.intent;
      btns[j].classList.toggle('is-active', on);
      btns[j].setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    /* B3 (C33): every rendered module carries "n of N", numbered across the
       whole page rather than within its cluster — the reader is counting one
       list, and the router has already changed what is in it. The chip is
       injected rather than authored into ten articles so the numbering cannot
       drift out of step with what is actually on screen. */
    /* ROUND TWO: the question line is a TITLE, not a lead paragraph, and the
       counter sits beside it rather than above it. Both are wrapped into one
       header row per module so every module has the same shape — chip, then
       title — regardless of which cluster it is in or what order the router
       left it in. The wrapper is built once and reused; only the chip's text
       changes on re-filter. */
    var total = shown.length;
    shown.forEach(function (el, k) {
      var head = el.querySelector('.rd-mhead');
      if (!head) {
        head = document.createElement('div');
        head.className = 'rd-mhead';
        var chipNew = document.createElement('span');
        chipNew.className = 'rd-mchip';
        head.appendChild(chipNew);
        var q = el.querySelector('.rd-q');
        el.insertBefore(head, el.firstChild);
        if (q) head.appendChild(q);   // move the title into the header row
      }
      head.querySelector('.rd-mchip').textContent = (k + 1) + ' of ' + total;
    });

    /* Say what the choice just did, in counts. ROUND TWO: "for yours" is
       replaced by the intent named, so the line reads as a sentence about the
       thing the reader picked rather than about them. */
    var exp = document.getElementById('rdExpect');
    if (exp) {
      exp.innerHTML = st.intent === 'looking'
        ? '<strong>' + always + '</strong> module' + (always === 1 ? '' : 's') + ' below — the position read, shown for every question. Pick one of the others and the modules that answer it join them.'
        : '<strong>' + total + '</strong> modules below — <strong>' + always + '</strong> for every question, <strong>' + mine + '</strong> for ' + INTENT_LABEL[st.intent] + '.';
    }

    /* A3 (C18): "Always on" was jargon; the cluster headers now say what they
       are and, for the chosen cluster, what it is for and how much of it. */
    var head = document.getElementById('rdIntentHead');
    if (head) {
      head.hidden = (st.intent === 'looking');
      head.innerHTML = 'For <em>' + INTENT_LABEL[st.intent] + '</em> ' +
        '<span class="rd-cluster-sub">&middot; ' + mine + ' module' + (mine === 1 ? '' : 's') + '</span>';
    }
    var none = document.getElementById('rdIntentNone');
    if (none) none.hidden = (st.intent !== 'looking');
    // The coda names what this intent has no snack for.
    var abs = document.querySelectorAll('[data-absent]');
    for (var k = 0; k < abs.length; k++) {
      var a = abs[k].getAttribute('data-absent').split(/\s+/);
      abs[k].classList.toggle('is-relevant', a.indexOf(st.intent) >= 0);
    }
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER + BOOT
     ═══════════════════════════════════════════════════════════ */
  function renderAll() {
    var rawPos = livePos(), spot = livePrice(), mult = ratioOf(rawPos);
    var visits = floorVisits();
    var m = bandMetrics(matchPos(rawPos));   // CLAMPED — D1, R1, P2 only

    renderHero(mult);
    renderHeader(rawPos, visits, mult, spot);
    renderSetupChip();
    renderPositionModule(visits, mult, spot);   // C1 — three identities, one module
    renderA4(spot);
    renderD1(m);
    renderD2(rawPos);                        // RAW — LSLI does not clamp
    renderD3(spot);
    renderR1(m);
    renderB1(spot);
    renderP1();
    renderP2(m);
  }

  /* ═══════════════════════════════════════════════════════════
     B2 (C15) — the setup panel collapses to a summary once it has been told
     something. "Told something" means the URL or the store carried a value on
     THIS load, not that the sliders have defaults in them: a reader who has
     never touched the panel should see the panel, not a chip reporting
     numbers they never chose.

     The stack is deliberately absent from the chip even when entered. It is
     session-only and never enters the URL or the store, so listing it beside
     two remembered values would tell the reader it is held the same way. It
     is not.
     ═══════════════════════════════════════════════════════════ */
  var setupSeeded = false;   // set by init() when the URL or store supplied a value
  function setupOpen(open) {
    var body = document.getElementById('rdSetupBody');
    var chip = document.getElementById('rdSetupChip');
    if (!body || !chip) return;
    body.hidden = !open;
    chip.hidden = open;
    chip.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function renderSetupChip() {
    var el = document.getElementById('rdSetupChipText');
    if (!el) return;
    el.innerHTML = st.retirementYear + ' &middot; ' + fmtUSDshort(st.targetIncomeUSD) +
      ' &middot; ' + INTENT_LABEL[st.intent].replace(/^./, function (c) { return c.toUpperCase(); });
  }

  function syncInputs() {
    var ry = document.getElementById('rdInYear'), ti = document.getElementById('rdInIncome'), sk = document.getElementById('rdInStack');
    if (ry) ry.value = st.retirementYear;
    if (ti) ti.value = st.targetIncomeUSD;
    if (sk) sk.value = stackBTC == null ? '' : stackBTC;
    ['retirementYear', 'targetIncomeUSD', 'intent'].forEach(function (f) {
      var t = document.querySelector('[data-remember="' + f + '"]');
      if (t) t.checked = !!st.remember[f];
    });
    setText('rdIncomeOut', fmtUSDshort(st.targetIncomeUSD));
  }

  function wire() {
    var ry = document.getElementById('rdInYear');
    if (ry) ry.addEventListener('input', function () { st.retirementYear = clampYear(ry.value); setText('rdYearOut', String(st.retirementYear)); renderP1(); saveState(); syncUrl(); });
    var ti = document.getElementById('rdInIncome');
    if (ti) ti.addEventListener('input', function () { st.targetIncomeUSD = clampIncome(ti.value); setText('rdIncomeOut', fmtUSDshort(st.targetIncomeUSD)); renderP1(); saveState(); syncUrl(); });
    var sk = document.getElementById('rdInStack');
    if (sk) sk.addEventListener('input', function () {
      stackBTC = clampStack(sk.value);
      // Deliberately NOT saved and NOT put in the URL. See the header note.
      renderD3(livePrice()); renderR1(bandMetrics(matchPos(livePos()))); renderP1();
    });

    document.querySelectorAll('[data-remember]').forEach(function (t) {
      t.addEventListener('change', function () {
        st.remember[t.getAttribute('data-remember')] = t.checked;
        saveState();
      });
    });

    document.querySelectorAll('.rd-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        st.intent = b.getAttribute('data-intent-set');
        applyIntent(); saveState(); syncUrl();
      });
    });

    var clr = document.getElementById('rdClearAll');
    if (clr) clr.addEventListener('click', function () {
      clearStore();
      st.retirementYear = DEFAULTS.retirementYear;
      st.targetIncomeUSD = DEFAULTS.targetIncomeUSD;
      st.intent = DEFAULTS.intent;
      st.remember = { retirementYear: false, targetIncomeUSD: false, intent: false };
      stackBTC = null;
      // Nothing is set any more, so the panel comes back rather than leaving
      // a summary chip describing values the reader just cleared.
      setupSeeded = false;
      setupOpen(true);
      syncInputs(); applyIntent(); syncUrl(); renderAll();
      var say = document.getElementById('rdClearedNote');
      if (say) { say.hidden = false; setTimeout(function () { say.hidden = true; }, 4000); }
    });

    var h3 = document.getElementById('rdD3Hz');
    if (h3) h3.addEventListener('input', function () { d3Months = parseInt(h3.value, 10); renderD3(livePrice()); });
    var h4 = document.getElementById('rdA4Hz');
    if (h4) h4.addEventListener('input', function () { a4Horizon = parseInt(h4.value, 10); renderA4(livePrice()); });

    /* B1 — the premise-gate disclosure. A real <button> with aria-expanded and
       aria-controls, Escape closing and returning focus to the trigger, per
       the nav's documented disclosure pattern. Not <details>: the site does
       not use it anywhere, and matching the existing mechanic matters more
       than saving the handful of lines. */
    var gb = document.getElementById('rdGateBtn'), gbody = document.getElementById('rdGateBody');
    if (gb && gbody) {
      gb.addEventListener('click', function () {
        var open = gb.getAttribute('aria-expanded') === 'true';
        gb.setAttribute('aria-expanded', open ? 'false' : 'true');
        gbody.hidden = open;
      });
      gbody.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { gb.setAttribute('aria-expanded', 'false'); gbody.hidden = true; gb.focus(); }
      });
    }

    /* TOOLTIP CLAMP. §6.13 centres the 240px card on its trigger, which is
       right until the trigger sits within half a card of a viewport edge —
       then the bubble hangs off-screen and the reader gets half a sentence.
       At 375 that was ten of the page's tips, all off the LEFT edge, because
       most triggers follow a short label near the start of a line.

       CSS cannot fix this: it has no way to know where the trigger is. The
       width cap in §6.13 narrows the card but still centres it. So the shift
       is measured at the moment the tip opens and written as a transform,
       leaving the CSS show/hide untouched — the bubble stays attached to its
       trigger, which the module-relative alternative would have given up. */
    function clampTip(trigger) {
      var c = trigger.querySelector('.tip-content');
      if (!c) return;
      c.style.transform = '';                      // measure from the CSS default
      /* Measure even if the card is not painted yet. On touch, `touchstart`
         fires before the :hover rule applies, so the element can still be
         display:none when the clamp runs — and a hidden element measures zero,
         which silently produces the wrong shift rather than no shift. Force it
         visible for the measurement, then hand control back to the CSS. */
      var forced = false;
      if (!c.getClientRects().length) { c.style.display = 'block'; forced = true; }
      var r = c.getBoundingClientRect(), pad = 10, shift = 0;
      if (forced) c.style.display = '';
      if (r.left < pad) shift = pad - r.left;
      else if (r.right > window.innerWidth - pad) shift = (window.innerWidth - pad) - r.right;
      if (!shift) return;
      var base = getComputedStyle(c).getPropertyValue('--tip-base') || '-50%';
      c.style.transform = 'translateX(calc(' + base + ' + ' + Math.round(shift) + 'px))';
    }
    ['pointerenter', 'focusin', 'touchstart'].forEach(function (ev) {
      document.addEventListener(ev, function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.help-tip') : null;
        if (t) clampTip(t);
      }, true);
    });

    // B2 — the summary chip reopens the panel it replaced.
    var chip = document.getElementById('rdSetupChip');
    if (chip) chip.addEventListener('click', function () {
      setupOpen(true);
      var first = document.getElementById('rdInYear');
      if (first) first.focus();
    });
  }

  function init() {
    // §6.37 precedence, strictly: URL params (any present) > stored state > defaults.
    var fromUrl = readUrl();
    var fromStore = false;
    if (!fromUrl) fromStore = loadState();
    // B2: the panel starts collapsed only when something actually supplied a
    // value on this load. Defaults sitting in the sliders are not an answer.
    setupSeeded = !!(fromUrl || fromStore);
    syncInputs();
    setText('rdYearOut', String(st.retirementYear));
    wire();
    applyIntent();
    setupOpen(!setupSeeded);
    renderAll();

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
