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
      MA = window.ModelingAssumptions;
  if (!CE || !LA || !RD || !RE || !MA) return;

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
  function loadState() {
    var raw = readStore(); if (!raw) return;
    var o; try { o = JSON.parse(raw); } catch (e) { return; }
    if (!o || o.v !== 1) return;
    if (o.remember) {
      st.remember.retirementYear = !!o.remember.retirementYear;
      st.remember.targetIncomeUSD = !!o.remember.targetIncomeUSD;
      st.remember.intent = !!o.remember.intent;
    }
    if (typeof o.retirementYear === 'number') st.retirementYear = clampYear(o.retirementYear);
    if (typeof o.targetIncomeUSD === 'number') st.targetIncomeUSD = clampIncome(o.targetIncomeUSD);
    if (typeof o.intent === 'string' && INTENTS.indexOf(o.intent) >= 0) st.intent = o.intent;
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
    setHTML('rdStandfirst',
      '<span>Bitcoin is at <strong>' + mult.toFixed(2) + '&times;</strong> its long-run trend. ' +
      'Tell the page your situation and it lays out what a position like this one has meant for it.</span>');
  }

  /* The header is an ECHO of the Dashboard and is fenced as one (§2.2): it
     never grows tiles. It carries only what the site-wide channel ribbon
     above it cannot — the ribbon already shows price, multiple and zone, and
     repeating them here is the duplication §0 exists to prevent. */
  function renderHeader(pos, visits) {
    setHTML('rdHdrTrend', fmtUSD(plPrice(TODAY_DAYS)));
    var modern = visits.filter(function (v) { return v.modern; });
    var open = visits.length ? visits[visits.length - 1] : null;
    if (open && open.open) {
      setHTML('rdHdrSince', fmtMonth(open.firstD));
      setHTML('rdHdrVisits', String(modern.length - 1));
    } else {
      setHTML('rdHdrSince', 'not in one');
      setHTML('rdHdrVisits', String(modern.length));
    }
    var trendPos = (Math.log(1.0) - Math.log(PL_FLOOR)) / (Math.log(PL_CEIL) - Math.log(PL_FLOOR));
    var MIN = -0.08, MAX = 1.0, RANGE = MAX - MIN;
    function place(p) { return ((Math.max(MIN, Math.min(MAX, p)) - MIN) / RANGE * 100) + '%'; }
    var tf = document.getElementById('rdTickFloor'), tt = document.getElementById('rdTickTrend'), mk = document.getElementById('rdBarMarker');
    if (tf) tf.style.left = place(0);
    if (tt) tt.style.left = place(trendPos);
    if (mk) mk.style.left = place(pos);
    setText('rdProv', todayPriceLabel(priceSource) + ' · trend from the shared Power Law module');
  }

  /* ═══════════════════════════════════════════════════════════
     A3 — the floor-visit timeline
     ═══════════════════════════════════════════════════════════ */
  function renderA3(visits, liveMult) {
    var modern = visits.filter(function (v) { return v.modern; });
    var open = modern.length && modern[modern.length - 1].open ? modern[modern.length - 1] : null;
    var closed = modern.filter(function (v) { return !v.open; });

    /* The record and live spot can disagree, and the sentence must say which
       it is describing. PL_DATA is a ~12-day grid with monthly appends, so
       spot can be weeks ahead of the last sample — price can walk off the
       floor while the newest sample is still sitting on it. A static "price is
       at the floor" would go silently false the day that happens. */
    var atFloor = liveMult <= PL_FLOOR * GRAZE;
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
    setHTML('rdA3Verdict', v);

    var recs = closed.map(function (v) { var b = backToTrend(v); return b ? (b - v.firstD) / YEAR_D : null; })
                     .filter(function (x) { return x != null; });
    var slowest = recs.length ? Math.max.apply(null, recs) : null;
    setHTML('rdA3Cards', cards([
      { k: 'Visits since 2014', v: String(modern.length), sub: closed.length + ' closed' },
      { k: 'Deepest of them', v: Math.min.apply(null, modern.map(function (v) { return v.lowM; })).toFixed(3) + '×', sub: 'of trend' },
      { k: 'Slowest return to trend', v: slowest ? slowest.toFixed(1) + ' yrs' : '—', sub: 'from that entry' }
    ]));

    // ── The timeline. Position-current by construction: today's marker is on
    //    it, which is what makes it an instrument rather than an exhibit (§0).
    var W = 700, H = 132, PADL = 10, PADR = 10, AXY = 84;
    var y0 = 2014, y1 = yearOf(S[N - 1].d) + 1;
    function xOf(day) {
      var yr = yearOf(day) + (dayToDate(day).getUTCMonth() / 12);
      return PADL + (yr - y0) / (y1 - y0) * (W - PADL - PADR);
    }
    var s = svgOpen(W, H, 'Timeline of the channel-floor visits since 2014, with today marked');
    s += '<line class="rd-ax" x1="' + PADL + '" y1="' + AXY + '" x2="' + (W - PADR) + '" y2="' + AXY + '"/>';
    for (var yr = y0; yr <= y1; yr += 2) {
      var x = PADL + (yr - y0) / (y1 - y0) * (W - PADL - PADR);
      s += '<line class="rd-tick" x1="' + x + '" y1="' + AXY + '" x2="' + x + '" y2="' + (AXY + 5) + '"/>';
      s += '<text class="rd-axlbl" x="' + x + '" y="' + (AXY + 18) + '" text-anchor="middle">' + yr + '</text>';
    }
    modern.forEach(function (v, i) {
      var xa = xOf(v.firstD), xb = Math.max(xOf(v.lastD), xa + 3);
      var cls = v.open ? 'rd-ep rd-ep-open' : 'rd-ep';
      s += '<rect class="' + cls + '" x="' + xa + '" y="' + (AXY - 22) + '" width="' + (xb - xa) + '" height="22" rx="2"/>';
      var lab = fmtMonthShort(v.firstD);
      var ty = (i % 2 === 0) ? AXY - 30 : AXY - 48;
      s += '<text class="rd-eplbl' + (v.open ? ' is-open' : '') + '" x="' + ((xa + xb) / 2) + '" y="' + ty + '" text-anchor="middle">' + lab + '</text>';
      s += '<text class="rd-epsub" x="' + ((xa + xb) / 2) + '" y="' + (ty + 11) + '" text-anchor="middle">' + v.lowM.toFixed(2) + '×</text>';
    });
    var xt = W - PADR;
    s += '<line class="rd-today" x1="' + xt + '" y1="' + (AXY - 34) + '" x2="' + xt + '" y2="' + (AXY + 3) + '"/>';
    s += '<text class="rd-todaylbl" x="' + xt + '" y="' + (AXY - 38) + '" text-anchor="end">today ' + liveMult.toFixed(2) + '×</text>';
    s += '</svg>';
    setHTML('rdA3Viz', s);

    setHTML('rdA3Note', open
      ? 'The open visit is described, not scored &mdash; it has no outcome yet.'
      : 'Every visit shown is closed, so every one has an outcome.');
  }

  /* ═══════════════════════════════════════════════════════════
     A4 — the bar this position sets (floor case vs trend case)
     Differentiated from D3 per JM ruling 7: A4 carries the PAIR, D3 carries
     the dated conditional path. The identity proved in Phase 0 — the hurdle
     page's position-view CAGR and D-or-P's reversion CAGR are the same
     expression — is why neither may headline the other's number.
     ═══════════════════════════════════════════════════════════ */
  function hurdle(H, spot) {
    var t = TODAY_DAYS;
    return {
      floor: Math.pow((PL_FLOOR * plPrice(t + YEAR_D * H)) / spot, 1 / H) - 1,
      trend: Math.pow(plPrice(t + YEAR_D * H) / plPrice(t), 1 / H) - 1
    };
  }
  function renderA4(spot) {
    var H = a4Horizon, r = hurdle(H, spot);
    setText('rdA4HzOut', H + (H === 1 ? ' year' : ' years'));
    /* The trend bar leads because the Hurdle Rate page PRINTS it at each
       horizon; its floor case is drawn as a curve and never written as a
       number, so it renders here as the conservative companion and the sources
       line says where to read it. */
    setHTML('rdA4Verdict',
      'Bitcoin&rsquo;s trend sets a bar of <strong>' + pct1(r.trend * 100) + '</strong> a year over ' + H +
      ' years. The conservative version &mdash; capital deployed at today&rsquo;s price reaching only the channel floor by then &mdash; still clears ' +
      pct1(r.floor * 100) + '.');
    setHTML('rdA4Cards', cards([
      { k: 'The trend’s own bar', v: pct1(r.trend * 100), sub: 'a year over ' + H + ' years' },
      { k: 'Floor case, from today’s price', v: pct1(r.floor * 100), sub: 'if it only reaches 0.42× trend' }
    ]));

    var W = 700, H2 = 150, PADL = 120, PADR = 40, TOP = 26, BH = 30, GAP = 26;
    var maxv = Math.max(r.floor, r.trend) * 1.25;
    function bw(v) { return Math.max(2, v / maxv * (W - PADL - PADR)); }
    var s = svgOpen(W, H2, 'The annual rate each case implies from today’s price, over ' + H + ' years');
    [['If it only reaches the floor', r.floor, 'rd-bar-floor'], ['If you had bought at trend', r.trend, 'rd-bar-trend']].forEach(function (row, i) {
      var y = TOP + i * (BH + GAP);
      s += '<text class="rd-barlbl" x="' + (PADL - 10) + '" y="' + (y + BH / 2 + 4) + '" text-anchor="end">' + row[0] + '</text>';
      s += '<rect class="' + row[2] + '" x="' + PADL + '" y="' + y + '" width="' + bw(row[1]) + '" height="' + BH + '" rx="3"/>';
      s += '<text class="rd-barval" x="' + (PADL + bw(row[1]) + 8) + '" y="' + (y + BH / 2 + 4) + '">' + pct1(row[1] * 100) + '</text>';
    });
    s += illustrativeTag(PADL, H2 - 12);
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
      { k: 'The dip never came', v: pct0(m.never), sub: 'within two years' }
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
      setHTML('rdD2Verdict', 'Bitcoin has rarely sat at this position since 2020 &mdash; too few entries here to read a ladder result from. The full instrument can widen the window.');
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
    setHTML('rdD3Verdict',
      'If price returns to trend by <strong>' + when + '</strong>, that is <strong>' + signPct0(rev * 100) +
      '</strong> a year &mdash; ' + signPct0(delta * 100) + ' more than the trend’s own slope over the same window. That is just arithmetic, not a forecast.');

    var cs = [
      { k: 'If it reverts by ' + when, v: signPct0(rev * 100), sub: 'a year' },
      { k: 'If you had bought at trend', v: signPct0(tr * 100), sub: 'a year — the baseline' }
    ];
    if (stackBTC) {
      cs.push({ k: 'Your stack at trend then', v: fmtUSDshort(stackBTC * trendThen), sub: 'from ' + fmtUSDshort(stackBTC * spot) + ' today' });
    }
    setHTML('rdD3Cards', cards(cs));

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
      { k: 'Median coins back', v: m.ratio.toFixed(2) + '×', sub: 'per coin sold — before any split or tax' }
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
     R2 — how long have stretches like this lasted?
     The N<3 rule fires on EPISODES, not samples (the shared module's own
     header says so). At today's depth the record holds two episodes and only
     one since 2014 — so this snack narrates and refuses the median.
     ═══════════════════════════════════════════════════════════ */
  function renderR2(spot) {
    var rec = RD.scan(spot / plPrice(TODAY_DAYS));
    var host = document.getElementById('snack-r2');
    if (rec.state === 'hidden') {
      // The dead band. The module declines to answer and so does the snack —
      // an empty state, not a silent gap (JM ruling 11; Phase 0 had no
      // recommendation, so this is the build's call and it is stated).
      setHTML('rdR2Verdict', 'Price is close enough to trend that there is no stretch like this one to measure. This snack returns when it is not.');
      setHTML('rdR2Cards', '');
      setHTML('rdR2Viz', '');
      if (host) host.classList.add('is-empty');
      return;
    }
    if (host) host.classList.remove('is-empty');
    var eps = rec.episodes.slice();
    var modern = eps.filter(function (e) { return e.entryD >= MODERN_D; });
    var closed = eps.filter(function (e) { return !e.ongoing; });
    var closedModern = closed.filter(function (e) { return e.entryD >= MODERN_D; });

    /* The N<3 rule, applied to EPISODES rather than samples. How deep price
       is decides which branch fires, so both are live: at a shallow depth the
       record holds enough independent episodes to support a spread, and at a
       deep one it does not. The rule is the same either way — the page does not
       publish a distribution it cannot stand behind. */
    var thin = closedModern.length < 3;
    var cs;
    if (thin) {
      setHTML('rdR2Verdict',
        'The record holds <strong>' + (closedModern.length === 1 ? 'one completed stretch' : closedModern.length + ' completed stretches') +
        '</strong> this far below trend since 2014. That is not a base rate, so each is named rather than averaged.');
      cs = closed.slice(-3).map(function (e) {
        return { k: fmtMonthShort(e.entryD), v: Math.round(e.months) + ' mo', sub: 'to get back to trend' };
      });
    } else {
      setHTML('rdR2Verdict',
        'Stretches this far below trend took a median of <strong>' + Math.round(rec.median) +
        ' months</strong> to get back to it &mdash; the fastest ' + Math.round(rec.min) + ', the slowest ' + Math.round(rec.max) +
        '. That is ' + closedModern.length + ' completed episodes since 2014, not a forecast of this one.');
      cs = [
        { k: 'Median', v: Math.round(rec.median) + ' mo', sub: 'across ' + rec.nCompleted + ' samples' },
        { k: 'Fastest', v: Math.round(rec.min) + ' mo', sub: 'back to trend' },
        { k: 'Slowest', v: Math.round(rec.max) + ' mo', sub: 'back to trend' }
      ];
    }
    if (rec.widened) cs.push({ k: 'Band widened to', v: rec.band.toFixed(2) + '×', sub: 'too few samples at today’s exact depth' });
    if (rec.hasOngoing) cs.push({ k: 'One is still open', v: Math.round(rec.ongMonths) + ' mo', sub: 'and counting — no outcome yet' });
    setHTML('rdR2Cards', cards(cs));

    var W = 700, H = 40 + eps.length * 34, PADL = 96, PADR = 60, TOP = 14, BH = 20;
    var maxMo = Math.max.apply(null, eps.map(function (e) { return e.months; })) * 1.1;
    var s = svgOpen(W, H, 'How long each stretch this far below trend took to return to trend');
    eps.forEach(function (e, i) {
      var y = TOP + i * 34;
      var w = Math.max(3, e.months / maxMo * (W - PADL - PADR));
      s += '<text class="rd-barlbl" x="' + (PADL - 10) + '" y="' + (y + BH / 2 + 4) + '" text-anchor="end">' + fmtMonthShort(e.entryD) + '</text>';
      s += '<rect class="' + (e.ongoing ? 'rd-bar-open' : 'rd-bar-trend') + '" x="' + PADL + '" y="' + y + '" width="' + w + '" height="' + BH + '" rx="3"/>';
      s += '<text class="rd-barval" x="' + (PADL + w + 8) + '" y="' + (y + BH / 2 + 4) + '">' + Math.round(e.months) + ' mo' + (e.ongoing ? ' so far' : '') + '</text>';
    });
    s += '</svg>';
    setHTML('rdR2Viz', s);
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
      { k: 'Sell band (80th pctile)', v: sell.toFixed(2) + '×', sub: fmtUSDshort(sellP) + ' — ' + pct0((sell / k - 1) * 100) + ' above spot' },
      { k: 'Rebuy band (50th pctile)', v: rebuy.toFixed(2) + '×', sub: fmtUSDshort(rebuyP) + ' — ' + pct0((rebuy / k - 1) * 100) + ' above spot' },
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
      setHTML('rdP1Verdict', 'No stack inside the engine’s range covers that plan from here. The full instrument shows where the limit sits.');
      setHTML('rdP1Cards', ''); setHTML('rdP1Viz', ''); return;
    }
    setHTML('rdP1Verdict',
      'Retiring in <strong>' + st.retirementYear + '</strong> on <strong>' + fmtUSDshort(st.targetIncomeUSD) +
      '</strong> a year needs about <strong>' + btc(here) + ' BTC</strong> if today’s gap to trend persists. That is the model’s arithmetic, not a forecast.');

    var cs = [
      { k: 'If today’s gap persists', v: btc(here) + ' BTC', sub: 'read from today’s price' },
      { k: 'If price tracks the floor', v: floor == null ? '—' : btc(floor) + ' BTC', sub: 'the 0.42× floor case' }
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
      { k: 'Median deepest fall', v: zeroish ? 'about zero' : Math.round(m.ddDepth) + '%', sub: 'from the entry price' }
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
  function applyIntent() {
    var snacks = document.querySelectorAll('[data-intent]');
    for (var i = 0; i < snacks.length; i++) {
      var list = snacks[i].getAttribute('data-intent').split(/\s+/);
      var show = list.indexOf('always') >= 0 || list.indexOf(st.intent) >= 0;
      snacks[i].hidden = !show;
    }
    var btns = document.querySelectorAll('.rd-chip');
    for (var j = 0; j < btns.length; j++) {
      var on = btns[j].getAttribute('data-intent-set') === st.intent;
      btns[j].classList.toggle('is-active', on);
      btns[j].setAttribute('aria-pressed', on ? 'true' : 'false');
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
    renderHeader(rawPos, visits);
    renderA3(visits, mult);
    renderA4(spot);
    renderD1(m);
    renderD2(rawPos);                        // RAW — LSLI does not clamp
    renderD3(spot);
    renderR1(m);
    renderR2(spot);
    renderB1(spot);
    renderP1();
    renderP2(m);
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
      syncInputs(); applyIntent(); syncUrl(); renderAll();
      var say = document.getElementById('rdClearedNote');
      if (say) { say.hidden = false; setTimeout(function () { say.hidden = true; }, 4000); }
    });

    var h3 = document.getElementById('rdD3Hz');
    if (h3) h3.addEventListener('input', function () { d3Months = parseInt(h3.value, 10); renderD3(livePrice()); });
    var h4 = document.getElementById('rdA4Hz');
    if (h4) h4.addEventListener('input', function () { a4Horizon = parseInt(h4.value, 10); renderA4(livePrice()); });
  }

  function init() {
    // §6.37 precedence, strictly: URL params (any present) > stored state > defaults.
    var fromUrl = readUrl();
    if (!fromUrl) loadState();
    syncInputs();
    setText('rdYearOut', String(st.retirementYear));
    wire();
    applyIntent();
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
