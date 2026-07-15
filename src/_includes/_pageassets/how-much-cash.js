/* =============================================================
   How Much Cash? — page script

   The mirror-bookend of How Much Bitcoin: that page answers what
   fraction should BE bitcoin; this one answers what fraction should
   not, and what that fraction is for. Written for the reader already
   running 100% hot.

   Coin-denominated throughout. Every terminal readout leads with
   coins; dollars are secondary. The reader holds bitcoin but owes
   dollars, and that mismatch is the whole subject.

   THE SPINE (one identity, hand-checkable, asserted by hcLedgerQA):

     bufferedTotal − allInTotal  ==  coinsSaved + coinsBonus − coinsCost

     coinsCost  = B / P(pos) − cashLeft / P(H)      the premium
     coinsSaved = absorbed / troughPrice            the insurance
                    (absorbed = min(cash at trough, E))
     coinsBonus = deployed / troughPrice            the dry powder, 0 unless on

   The three terms are the page's three jobs, in the same order. The
   buffer pays iff saved + bonus > cost. The stack cancels: the verdict
   does not depend on how big the stack is, only on the shock, the
   buffer, and the two prices.

   The tempting shortcut — "pays iff E/troughPrice > B/P(pos)" — is TRUE
   ONLY when the buffer covers the whole shock. A buffer smaller than the
   shock stops only what its cash could absorb while still paying the full
   raise cost, so the shortcut reports a win where the ledger records a
   loss. The identity above holds either way, and is the one the page
   states.

   Both clamps break the identity by construction, so QA skips it there:
   a shock larger than the stack at trough prices (`wiped`), and a buffer
   larger than the stack can raise (`raiseCapped`), are truncations rather
   than arithmetic.

   Reads PL_DATA + PL_* + GENESIS_TS + plPrice + positionLabel +
   TODAY_DAYS/TODAY_PRICE + fetchTodayPrice + todayPriceIsLive from
   shared/power-law-data.js, and RECOVERY + crashMultiplier from
   shared/crash-model.js. Nothing is baked into copy.
   ============================================================= */
(function () {
  'use strict';
  if (typeof plPrice !== 'function' || typeof PL_DATA === 'undefined' || typeof TODAY_DAYS === 'undefined') return;

  var RECOVERY = window.CrashModel.RECOVERY;
  var crashMultiplier = window.CrashModel.crashMultiplier;

  // ── Palette (shared trilogy/channel conventions) ──
  var FLOOR_C = '#b04525', TREND_C = '#e09422', UPPER_C = '#e8c820';
  var HIST_C = 'rgba(232,224,210,0.55)', SEL_C = '#6db3d4';
  var ALLIN_C = '#F7931A', BUF_C = '#6db3d4', DEPLOY_C = '#6fae6f';
  var MUTED = '#7a7367', DIM = '#9a9080';

  // ── Channel-position math (log-space), shared with the trilogy ──
  var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
  function posOf(price, days) { return (Math.log(price / plPrice(days)) - LF) / SPAN; }

  var N = PL_DATA.length;
  var FIRST_D = PL_DATA[0][0], LAST_D = PL_DATA[N - 1][0];
  var YEAR_D = 365.25;
  var MARKER_MIN = (Date.UTC(2014, 0, 1) / 1000 - GENESIS_TS) / 86400;   // pre-2014 curiosity era excluded, matching WODN
  var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400;

  var ZONE_MULT = 0.60;   // the floor-adjacent band the base-rate fact counts, per design §4.1

  // Live spot: seeded from the latest monthly sample, upgraded by the fetch.
  // Never read TODAY_PRICE directly after init — read spot().
  var _spot = TODAY_PRICE, _priceSource = 'seed';
  function spot() { return _spot; }

  // ── State ──
  // `pos` is a DATE (days since genesis), not a channel coordinate: the marker
  // rides the price history, and the ×-trend multiple is derived from it. null
  // means "today", so the default tracks the live price rather than freezing.
  var DEFAULTS = {
    stackBtc: 1.0, expMonthly: 6000, bufMonths: 6, shock: 18000, hz: 10,
    plMode: null, cashYieldPct: 4, pos: null, deploy: false,
    crashOn: false, crashYear: 3, depthPct: 60, crashRec: 'historical'
  };
  var S = {
    stackBtc: 1.0, expMonthly: 6000, bufMonths: 6, shock: 18000, hz: 10,
    plMode: null, cashYieldPct: 4, pos: null, deploy: false,
    crashOn: false, crashYear: 3, depthPct: 60, crashRec: 'historical'
  };

  // ════════ FORMAT HELPERS ════════
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function btc(v) { return (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(3)) + ' BTC'; }
  function btcN(v) { return (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(3)); }
  function usd(v) {
    var a = Math.abs(v);
    if (a >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v);
  }
  function usdFull(v) { return '$' + Math.round(v).toLocaleString(); }
  function pct0(v) { return Math.round(v) + '%'; }
  function ratioX(r) { return r.toFixed(2) + '×'; }
  function monthYear(day) { return new Date(GENESIS_TS * 1000 + day * 86400 * 1000).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }

  // ════════ HISTORICAL PRICE AT A DAY (linear interp on PL_DATA) ════════
  function realPriceAt(absDay) {
    if (absDay <= PL_DATA[0][0]) return PL_DATA[0][1];
    if (absDay >= LAST_D) return PL_DATA[N - 1][1];
    for (var i = 1; i < N; i++) {
      if (PL_DATA[i][0] >= absDay) {
        var a = PL_DATA[i - 1], b = PL_DATA[i], t = (absDay - a[0]) / (b[0] - a[0]);
        return a[1] * (1 - t) + b[1] * t;
      }
    }
    return PL_DATA[N - 1][1];
  }

  // ── The marker resolves to a day + a price. At today (pos === null) the price
  //    is the live spot, so the whole page tracks the fetch; in history it is the
  //    actual recorded price. This is the single source of "where are we".
  function markerDay() { return S.pos == null ? todayD : clamp(S.pos, MARKER_MIN, todayD); }
  function markerIsToday() { return S.pos == null || S.pos >= todayD - 0.5; }
  function markerPrice() { return markerIsToday() ? spot() : realPriceAt(markerDay()); }
  function markerTrend() { return plPrice(markerDay()); }
  function markerMult() { return markerPrice() / markerTrend(); }
  function markerPos01() { return posOf(markerPrice(), markerDay()); }
  function markerZone() { return positionLabel(markerPos01()); }
  function markerDisplay() { return ratioX(markerMult()) + ' trend · ' + markerZone(); }
  // Live-label gate (9a83a97): "today's price" only on a real fetch, else "the latest price".
  function priceWord() { return markerIsToday() ? (todayPriceIsLive(_priceSource) ? 'today’s price' : 'the latest price') : 'the price then'; }
  function todayNote() { return markerIsToday() ? todayPriceNote(_priceSource) : ''; }

  // ════════ DERIVED QUANTITIES (every one hand-checkable) ════════
  function bufferUSD() { return S.bufMonths * S.expMonthly; }
  function coinsToRaiseHere() { var p = markerPrice(); return p > 0 ? bufferUSD() / p : 0; }
  function coinsToRaiseAtTrend() { var t = markerTrend(); return t > 0 ? bufferUSD() / t : 0; }
  // THE STRESS CASE — one quantity, one basis, used in three places.
  // The §B verdict, the insurance card, and §D's ledger must all mean the same
  // thing by "the shock lands in a deep drawdown", or the page contradicts
  // itself: a −60% trough today and a −60% trough in year 4 are different prices
  // (the trend carries price up in between) and so force very different coin
  // counts. So the hypothetical always runs the reader's own crash settings,
  // whether or not the §D disclosure is open — the same way the allocation page
  // treats crash depth as a ground rule rather than a disclosure-only input.
  // S.crashOn gates only whether §D's CHART and verdict run the stress.
  // One-slot cache, cleared at the top of every render pass. Without it the
  // verdict and the effects cards trigger four full ledger runs between them,
  // which the marker drag pays for on every frame.
  var _stressCache = null;
  function stressLedger() {
    if (_stressCache) return _stressCache;
    var st = {};
    for (var k in S) if (S.hasOwnProperty(k)) st[k] = S[k];
    st.crashOn = true;
    _stressCache = computeLedger(st);
    return _stressCache;
  }
  function hypoTroughPrice() { return stressLedger().troughPrice; }
  // The CLAMPED forced sale — never more coins than the stack holds.
  function coinsForcedHypo() { return stressLedger().allInForced; }
  function hypoUnpaid() { return stressLedger().allInUnpaid; }

  // ── Zone-time base rate: how much of the record sat at/below the floor-adjacent
  //    band. Historical fact, counted from PL_DATA at run time, never a forecast.
  var zoneTime = (function () {
    var n = 0;
    for (var i = 0; i < N; i++) if (PL_DATA[i][1] / plPrice(PL_DATA[i][0]) <= ZONE_MULT) n++;
    return { pct: 100 * n / N, n: n, total: N };
  })();

  // ════════ PL MODE (regime-aware default, allocation-page recipe) ════════
  function belowTrend() { return markerMult() < 0.98; }
  function regimeMode() { return belowTrend() ? 'hold' : 'revert'; }
  function activeMode() { return S.plMode || regimeMode(); }
  function modeLabel(k) { return k === 'hold' ? 'Today’s gap to trend persists' : 'Return to trend'; }

  // ════════ THE LEDGER ════════
  // Annual loop from the marker forward H years. Coins change ONLY at named
  // events (raise / forced sale / deploy); cash changes only at yield / shock /
  // deploy. Both facts are asserted by hcLedgerQA().
  //
  // Takes a state object (not the module's S) so QA can drive it — the
  // asParitySweep lesson.
  function buildCrash(st) {
    if (!st.crashOn) return null;
    var rec = RECOVERY[st.crashRec] || RECOVERY.historical;
    return {
      crashYear: st.crashYear, depthPct: st.depthPct / 100, troughLagYears: 1,
      recoveryYears: rec.years, recoveryShape: rec.shape, recoveryCeiling: rec.ceiling
    };
  }
  function troughYearOf(st) { return st.crashOn ? st.crashYear + 1 : null; }

  function computeLedger(st) {
    st = st || S;
    var H = st.hz, mode = st.plMode || (markerMult() < 0.98 ? 'hold' : 'revert');
    var d0 = markerDay(), P0 = markerPrice(), m0 = P0 / plPrice(d0);
    var crash = buildCrash(st), tY = troughYearOf(st);
    var yld = st.cashYieldPct / 100;

    // Price path: the PL curve, held at the marker's multiple ('hold') or
    // amortized back to trend by the horizon ('revert'), times the crash shape.
    function ratioAt(y) { return mode === 'hold' ? m0 : m0 + (1 - m0) * Math.min(1, H > 0 ? y / H : 1); }
    function priceAt(y) { return plPrice(d0 + y * YEAR_D) * ratioAt(y) * crashMultiplier(y, crash); }

    // A buffer the stack cannot raise is not a buffer, it is a liquidation. Cap
    // the raise at the stack and report what was actually raised, rather than
    // modelling the sale of coins the reader does not hold.
    var wantB = st.bufMonths * st.expMonthly;
    var wantRaise = P0 > 0 ? wantB / P0 : 0;
    var raiseCapped = wantRaise > st.stackBtc;
    var raise = raiseCapped ? st.stackBtc : wantRaise;
    var B = raiseCapped ? raise * P0 : wantB;

    var events = [];
    var allIn = new Array(H + 1), bufC = new Array(H + 1), cash = new Array(H + 1);
    var aCoins = st.stackBtc, bCoins = st.stackBtc - raise, c = B;
    var aUnpaid = 0, bUnpaid = 0;

    if (raise > 0) events.push({ year: 0, type: 'raise', coins: -raise, cash: +B, price: P0, note: 'buffer raised at ' + usdFull(P0) + (raiseCapped ? ' (capped: the whole stack raises only ' + usdFull(B) + ')' : '') });

    for (var y = 0; y <= H; y++) {
      if (y > 0) {
        var interest = c * yld;
        if (interest !== 0) { c += interest; events.push({ year: y, type: 'yield', coins: 0, cash: +interest, price: priceAt(y), note: 'cash yield ' + st.cashYieldPct + '%' }); }
      }
      if (tY != null && y === tY) {
        var tp = priceAt(y);
        // All-in has no cash: the shock is a forced sale at the trough, permanent.
        // You cannot sell coins you do not have — a shock larger than the whole
        // stack at trough prices wipes it out and still leaves a bill. Clamping
        // at zero and carrying the remainder as `unpaid` is the honest model;
        // letting coins go negative silently invents a bigger stack than exists.
        var wanted = tp > 0 ? st.shock / tp : 0;
        var forced = Math.min(aCoins, wanted);
        aCoins -= forced;
        aUnpaid = Math.max(0, (wanted - forced) * tp);
        events.push({ year: y, type: 'forced-sale', coins: -forced, cash: 0, price: tp, note: 'all-in sells ' + btc(forced) + ' at the trough' + (aUnpaid > 0 ? ', and is still ' + usdFull(aUnpaid) + ' short' : '') });
        // Buffered: cash absorbs the shock first. Its first job is the insurance.
        var absorbed = Math.min(c, st.shock);
        c -= absorbed;
        events.push({ year: y, type: 'shock', coins: 0, cash: -absorbed, price: tp, note: 'buffer absorbs ' + usdFull(absorbed) });
        var shortfall = st.shock - absorbed;
        if (shortfall > 0 && tp > 0) {
          var partialWant = shortfall / tp;
          var partial = Math.min(bCoins, partialWant);
          bCoins -= partial;
          bUnpaid = Math.max(0, (partialWant - partial) * tp);
          events.push({ year: y, type: 'forced-sale', coins: -partial, cash: 0, price: tp, note: 'buffer short by ' + usdFull(shortfall) + ', sells ' + btc(partial) + (bUnpaid > 0 ? ', and is still ' + usdFull(bUnpaid) + ' short' : '') });
        }
        // Dry powder: only what the insurance did not need, only at the trough.
        // A deployed buffer is no longer a buffer — that is why this is half, once.
        if (st.deploy && c > 0) {
          var dep = c / 2;
          c -= dep; bCoins += dep / tp;
          events.push({ year: y, type: 'deploy', coins: +dep / tp, cash: -dep, price: tp, note: 'half the remaining cash deployed at the trough' });
        }
      }
      allIn[y] = aCoins; bufC[y] = bCoins; cash[y] = c;
    }

    var PH = priceAt(H);
    return {
      H: H, mode: mode, P0: P0, m0: m0, PH: PH, troughYear: tY,
      troughPrice: tY != null ? priceAt(tY) : null,
      raise: raise, B: B, events: events,
      raiseCapped: raiseCapped, wantB: wantB,
      allInForced: st.stackBtc - (tY != null ? allIn[H] : st.stackBtc),
      allInUnpaid: aUnpaid, bufUnpaid: bUnpaid, wiped: aUnpaid > 0,
      allIn: allIn, bufCoins: bufC, cash: cash,
      priceAt: priceAt,
      allInEnd: allIn[H], bufEnd: bufC[H], cashEnd: cash[H],
      bufTotal: bufC[H] + (PH > 0 ? cash[H] / PH : 0),
      allInUSD: allIn[H] * PH, bufUSD: bufC[H] * PH + cash[H]
    };
  }

  // ════════ QA HOOK — conservation invariant ════════
  // Replays the event list and asserts the terminal balances reproduce from it:
  // coins move only at raise/forced-sale/deploy, cash only at yield/shock/deploy.
  // Returns measured-vs-expected side by side so a failure names which side drifted.
  function ledgerQA(st) {
    st = st || S;
    var L = computeLedger(st);
    var coinsFromEvents = st.stackBtc, cashFromEvents = 0;
    var coinEventTypes = { raise: 1, 'forced-sale': 1, deploy: 1 };
    var cashEventTypes = { raise: 1, yield: 1, shock: 1, deploy: 1 };
    var illegal = [];
    for (var i = 0; i < L.events.length; i++) {
      var e = L.events[i];
      if (e.coins !== 0 && !coinEventTypes[e.type]) illegal.push({ event: e, why: 'coins changed at a non-coin event' });
      if (e.cash !== 0 && !cashEventTypes[e.type]) illegal.push({ event: e, why: 'cash changed at a non-cash event' });
      // The all-in forced sale is a different ledger from the buffered path's
      // coins; only the buffered path's events accumulate here.
      if (e.type === 'forced-sale' && e.note.indexOf('all-in') === 0) continue;
      coinsFromEvents += e.coins; cashFromEvents += e.cash;
    }
    var coinsOk = Math.abs(coinsFromEvents - L.bufEnd) < 1e-9;
    var cashOk = Math.abs(cashFromEvents - L.cashEnd) < 1e-6;

    // Parity: the identity re-derived from the events, independently of the
    // loop that produced the totals. Skipped where a clamp truncates it.
    var absorbed = 0, coinsBonus = 0;
    for (var j = 0; j < L.events.length; j++) {
      if (L.events[j].type === 'shock') absorbed += -L.events[j].cash;
      if (L.events[j].type === 'deploy') coinsBonus += L.events[j].coins;
    }
    var coinsSaved = L.troughPrice ? absorbed / L.troughPrice : 0;
    var coinsCost = L.raise - (L.PH > 0 ? L.cashEnd / L.PH : 0);
    var ledgerDiff = L.bufTotal - L.allInEnd;
    // EITHER path hitting zero truncates the arithmetic, not just the all-in one:
    // a buffered stack is the smaller of the two and so clamps first.
    var identityApplies = !L.wiped && !L.raiseCapped && !(L.bufUnpaid > 0) && L.troughYear != null;
    var identityOk = !identityApplies || Math.abs(ledgerDiff - (coinsSaved + coinsBonus - coinsCost)) < 1e-9;

    var res = {
      events: L.events.map(function (e) { return e.year + ':' + e.type + ' coins=' + e.coins.toFixed(6) + ' cash=' + e.cash.toFixed(2); }),
      replayedCoins: coinsFromEvents, ledgerCoins: L.bufEnd, coinsOk: coinsOk,
      replayedCash: cashFromEvents, ledgerCash: L.cashEnd, cashOk: cashOk,
      illegal: illegal,
      terminal: { allInCoins: L.allInEnd, bufferedCoins: L.bufEnd, cash: L.cashEnd, bufferedTotalCoinEquiv: L.bufTotal },
      // The two rival quantities side by side, so a failure names which drifted.
      spine: {
        coinsCost: coinsCost, coinsSaved: coinsSaved, coinsBonus: coinsBonus,
        net: coinsSaved + coinsBonus - coinsCost, ledgerDiff: ledgerDiff,
        bufferPays: identityApplies ? (coinsSaved + coinsBonus > coinsCost) : null,
        identityApplies: identityApplies, identityOk: identityOk
      },
      clamps: { wiped: L.wiped, allInUnpaid: L.allInUnpaid, bufUnpaid: L.bufUnpaid, raiseCapped: L.raiseCapped },
      ok: coinsOk && cashOk && identityOk && !illegal.length
    };
    if (!res.ok) console.error('[hc-ledger] invariant broken', res);
    return res;
  }
  if (typeof window !== 'undefined') window.hcLedgerQA = ledgerQA;
  function assertHcLedger() { var r = ledgerQA(S); if (!r.ok) console.error('[hc-ledger] invariant failed on render', r); }

  // ════════ VERDICT (§4 canon; §10.3 rules — origin-first, anchors beside
  //          percentages, one comparison per sentence, coins primary) ════════
  function renderVerdict() {
    var el = document.getElementById('hcVerdict'); if (!el) return;
    var B = bufferUSD(), here = coinsToRaiseHere(), atTrend = coinsToRaiseAtTrend(), forced = coinsForcedHypo();
    var lead = markerIsToday() ? 'From today’s position' : 'From ' + monthYear(markerDay());
    var main = lead + ' (<strong>' + markerDisplay() + '</strong>), a <strong>' + S.bufMonths +
      '-month</strong> buffer &mdash; ' + usdFull(B) + ', about <strong>' + btc(here) +
      '</strong> &mdash; costs ' + btc(here) + ' to raise ' + (markerIsToday() ? 'here' : 'there') +
      '; at trend it would cost ' + btc(atTrend) + '.';
    // Dragging a modern buffer back into cheap-coin history asks the stack to
    // sell more coins than it holds. Say so, rather than letting §B quote a cost
    // the ledger below has quietly capped.
    if (here > S.stackBtc) {
      main += ' That is more than the whole ' + btc(S.stackBtc) + ' stack, so the ledger below caps it: at ' +
        (markerIsToday() ? 'this price' : 'these prices') + ' the entire stack raises only ' + usdFull(S.stackBtc * markerPrice()) + '.';
    }
    var unpaid = hypoUnpaid();
    var detail = 'What it buys: a ' + usdFull(S.shock) + ' surprise landing in a deep drawdown (&minus;' +
      S.depthPct + '% bottoming in year ' + (S.crashYear + 1) + ', a ' + usdFull(hypoTroughPrice()) +
      ' trough) would force selling <strong>' + btc(forced) + '</strong> without it' +
      (unpaid > 0 ? ' &mdash; the whole stack, and it would still leave ' + usdFull(unpaid) + ' of the bill unpaid.' :
        ' &mdash; with it, you sell nothing you didn’t choose.');
    el.className = 'hc-verdict ' + (here > forced ? 'hc-verdict-cost' : 'hc-verdict-buys');
    el.innerHTML = '<div class="hc-verdict-main">' + main + '</div><p class="hc-verdict-detail">' + detail + '</p>';
  }

  // ── Regime transparency line (allocation recipe) ──
  function renderRegime() {
    var el = document.getElementById('hcRegime'); if (!el) return;
    var m = markerMult(), mode = activeMode();
    var line;
    if (belowTrend()) {
      line = 'Bitcoin sits at about <strong>' + ratioX(m) + '</strong> its Power Law trend' + todayNote() +
        ', a historical discount. The default holds that discount and grows with the trend rather than banking on the gap closing. ' +
        'That cuts both ways here: coins are cheap in dollars, so a buffer costs <em>more</em> of them to raise. ' +
        'If bitcoin were at or above trend, the default would instead assume growth back to trend.';
    } else {
      line = 'Bitcoin sits at about <strong>' + ratioX(m) + '</strong> its Power Law trend' + todayNote() +
        '. The default assumes it grows back toward trend from here rather than holding a premium the Power Law says mean-reverts. ' +
        'Coins are expensive in dollars here, so a buffer costs fewer of them to raise than it would lower in the channel.';
    }
    el.innerHTML = line;
  }

  // ════════ EFFECTS CARDS ════════
  function setFace(el, big, unit, detail) {
    var b = el.querySelector('.hc-face-num'), u = el.querySelector('.hc-face-unit'), d = el.querySelector('.hc-face-detail');
    if (b) b.textContent = big;
    if (u) u.textContent = unit;
    if (d) d.innerHTML = detail;
  }
  function renderEffects() {
    var noStress = {};
    for (var k in S) if (S.hasOwnProperty(k)) noStress[k] = S[k];
    noStress.crashOn = false;
    var clean = computeLedger(noStress);
    var premium = clean.allInEnd - clean.bufTotal;   // coins foregone with no shock: the pure price of insurance

    var up = document.getElementById('hcFacePremium');
    if (up) {
      setFace(up, btcN(premium), 'coins foregone over ' + S.hz + ' years',
        'With no shock at all, the buffer costs you <strong>' + btc(premium) + '</strong>: ' + btc(clean.raise) +
        ' to raise, less ' + btc(clean.cashEnd / clean.PH) + ' the cash grows back into by year ' + S.hz +
        ' at ' + S.cashYieldPct + '%. That is the premium, paid whether or not you ever claim.');
    }
    var ins = document.getElementById('hcFaceInsurance');
    if (ins) {
      var f = coinsForcedHypo();
      setFace(ins, btcN(f), 'coins preserved in the stress case',
        'A ' + usdFull(S.shock) + ' shock at a &minus;' + S.depthPct + '% trough in year ' + (S.crashYear + 1) + ' (' +
        usdFull(hypoTroughPrice()) + ') forces selling <strong>' + btc(f) +
        '</strong> from an all-in stack. The buffer is what stops that sale, and it pays only if those coins outweigh the <strong>' +
        btc(premium) + '</strong> premium beside it.');
    }
    var base = document.getElementById('hcFaceBase');
    if (base) {
      setFace(base, pct0(zoneTime.pct), 'of the record at or below ' + ratioX(ZONE_MULT) + ' trend',
        'Bitcoin has spent <strong>' + pct0(zoneTime.pct) + '</strong> of its recorded history at or below ' + ratioX(ZONE_MULT) +
        ' trend (' + zoneTime.n + ' of ' + zoneTime.total + ' monthly samples). That is how often the bad-timing case has actually been live. ' +
        'It says nothing about how often <em>your</em> shocks arrive.');
    }
  }

  // ════════ §C READOUTS ════════
  function renderPlayground() {
    var here = coinsToRaiseHere(), atTrend = coinsToRaiseAtTrend();
    var posEl = document.getElementById('hcPosReadout');
    if (posEl) posEl.innerHTML = '<strong>' + ratioX(markerMult()) + '</strong> trend · <em>' + markerZone() + '</em> · ' +
      (markerIsToday() ? 'today' + todayNote() : monthYear(markerDay())) + ' · ' + usdFull(markerPrice());

    var raiseEl = document.getElementById('hcRaiseReadout');
    if (raiseEl) {
      var rel = atTrend > 0 ? here / atTrend : 1;
      raiseEl.innerHTML = 'Raising ' + usdFull(bufferUSD()) + ' costs <strong>' + btc(here) + '</strong> at ' + priceWord() +
        ', versus ' + btc(atTrend) + ' at trend &mdash; <strong>' + ratioX(rel) + '</strong> the coins.';
    }
    // Design §4.1's quantity: the shock landing AT the marker, no drawdown —
    // the same bill costs 2–3× the coins near the floor. Deliberately a
    // different basis from the §B/§D stress case (which lands at a crash
    // trough), so it names its own.
    var shockEl = document.getElementById('hcShockReadout');
    if (shockEl) {
      var atMarker = S.shock / markerPrice(), atTrendNow = S.shock / markerTrend();
      shockEl.innerHTML = 'A ' + usdFull(S.shock) + ' surprise arriving <em>at this moment</em>, with no buffer, costs <strong>' +
        btc(atMarker) + '</strong> at ' + priceWord() + ', versus ' + btc(atTrendNow) + ' if it had arrived at trend &mdash; <strong>' +
        ratioX(atTrendNow > 0 ? atMarker / atTrendNow : 1) + '</strong> the coins for the same bill.';
    }

    var zoneEl = document.getElementById('hcZoneStrip');
    if (zoneEl) zoneEl.innerHTML = 'Bitcoin has spent <strong>' + pct0(zoneTime.pct) + '</strong> of its history at or below ' +
      ratioX(ZONE_MULT) + ' trend (' + zoneTime.n + ' of ' + zoneTime.total + ' samples). Historical, not a forecast.';
  }

  // ════════ §D LEDGER VERDICT — all three branches ════════
  function renderLedgerVerdict(L) {
    var el = document.getElementById('hcLedgerVerdict'); if (!el) return;
    var A = L.bufTotal, Aa = L.allInEnd;
    var diff = A - Aa, basis = Math.max(Aa, A, 1e-6), rel = Math.abs(diff) / basis;
    var line, cls;
    // Ruin first: a shock the stack could not cover at trough prices is a
    // different outcome from a close call, and stating it as a coin comparison
    // would bury the only fact that matters.
    if (L.wiped) {
      cls = 'hc-lv-buys';
      line = 'At these settings the shock is bigger than the stack: the all-in path sells <strong>every coin</strong> at the ' +
        usdFull(L.troughPrice) + ' trough and is still ' + usdFull(L.allInUnpaid) + ' short. The buffered path ends year ' + L.H +
        ' with <strong>' + btc(L.bufEnd) + '</strong>' + (L.bufUnpaid > 0 ? ' and is ' + usdFull(L.bufUnpaid) + ' short itself' : ' and the bill paid') +
        '. This is the case the buffer exists for, and it is also the case where its cost stops being the interesting question.';
    } else if (!S.crashOn) {
      cls = 'hc-lv-cost';
      line = 'With no shock, there is nothing to insure: the buffer costs <strong>' + btc(Aa - A) +
        '</strong> and buys nothing &mdash; ' + btc(A) + ' versus ' + btc(Aa) + ' at year ' + L.H +
        '. That is the premium on its own. Open the stress below to see what it is buying.';
    } else if (rel <= 0.02) {
      cls = 'hc-lv-wash';
      line = 'The buffer and the all-in stack end within a coin of each other &mdash; ' + btc(A) + ' versus ' + btc(Aa) +
        ' at year ' + L.H + ', roughly a wash at these settings.';
    } else if (diff > 0) {
      cls = 'hc-lv-buys';
      line = 'The buffer preserved more coins: <strong>' + btc(A) + '</strong> vs ' + btc(Aa) + ' at year ' + L.H +
        ' &mdash; the shock at the trough cost the all-in path ' + btc(S.shock / L.troughPrice) + ' that never came back.';
    } else {
      cls = 'hc-lv-cost';
      line = 'The buffer cost more coins than it saved at these settings &mdash; <strong>' + btc(Aa) + '</strong> vs ' + btc(A) +
        '. Small shocks, shallow drawdowns, and a buffer raised when coins were expensive are where holding cash is the costly choice.';
    }
    el.className = 'hc-ledger-verdict ' + cls;
    el.innerHTML = line;
  }

  function renderLedgerReadouts(L) {
    var el = document.getElementById('hcLedgerEndnote');
    if (el) {
      el.innerHTML = 'Your plan: ' + btc(S.stackBtc) + ' stack · ' + usdFull(S.expMonthly) + '/mo expenses · ' +
        S.bufMonths + '-month buffer (' + usdFull(bufferUSD()) + ') at ' + S.cashYieldPct + '% · ' + usdFull(S.shock) + ' shock · ' +
        S.hz + '-year horizon · ' + modeLabel(L.mode) + ' · ' +
        (S.crashOn ? ('&minus;' + S.depthPct + '% crash in year ' + S.crashYear + ', ' + (RECOVERY[S.crashRec] || RECOVERY.historical).label.toLowerCase() + ' recovery') : 'no crash') +
        (S.deploy ? ' · dry powder on' : '') + ' · marker at ' + (markerIsToday() ? 'today' : monthYear(markerDay())) +
        '. Projected under your assumptions, not a forecast.';
    }
    var t = document.getElementById('hcTerminal');
    if (t) {
      t.innerHTML = '<span class="hc-term-row"><span class="hc-term-label">All in</span><strong>' + btc(L.allInEnd) +
        '</strong><span class="hc-term-usd">' + usd(L.allInUSD) + '</span></span>' +
        '<span class="hc-term-row"><span class="hc-term-label">Stack + buffer</span><strong>' + btc(L.bufEnd) +
        '</strong><span class="hc-term-usd">' + usd(L.bufUSD) + (L.cashEnd > 0 ? ' incl. ' + usd(L.cashEnd) + ' cash' : '') + '</span></span>';
    }
  }

  // ════════ §E DRY POWDER READOUT ════════
  function renderDryPowder(L) {
    var el = document.getElementById('hcDryReadout'); if (!el) return;
    if (!S.crashOn) {
      el.innerHTML = 'Dry powder needs a floor to buy at. With no crash in the model there is no trough to deploy into, ' +
        'so this readout stays empty &mdash; which is the point: the buffer is not a dip-buying fund that happens to cover emergencies.';
      return;
    }
    var dep = null;
    for (var i = 0; i < L.events.length; i++) if (L.events[i].type === 'deploy') dep = L.events[i];
    if (!S.deploy) {
      el.innerHTML = 'Switch on dry powder to deploy half of whatever the buffer has left after the shock, once, at the trough (' +
        usdFull(L.troughPrice) + ' in year ' + L.troughYear + ').';
    } else if (!dep) {
      el.innerHTML = 'The shock consumed the whole buffer at the trough, so there was nothing left to deploy. ' +
        'The insurance job came first, which is the rule.';
    } else {
      var atTrend = plPrice(markerDay() + L.troughYear * YEAR_D);
      var moreCoins = dep.price > 0 ? (atTrend / dep.price) : 1;
      el.innerHTML = 'After the shock, ' + usdFull(-dep.cash * 2) + ' remained; half of it &mdash; ' + usdFull(-dep.cash) +
        ' &mdash; went in at ' + usdFull(dep.price) + ', buying <strong>' + btc(dep.coins) + '</strong>. The same dollars at trend that year (' +
        usdFull(atTrend) + ') would have bought ' + btc(-dep.cash / atTrend) + ', so the trough bought about <strong>' + ratioX(moreCoins) +
        '</strong> the coins. Historical arithmetic on your settings, not a prediction that a trough arrives.';
    }
  }

  // ════════ CHANNEL CHART (§C) — WODN visual language + a draggable marker ════════
  var chChart = null, dragging = false;
  function bandLine(mult, startD, span) {
    var pts = [], step = Math.max(12, span / 140), d;
    for (d = 0; d <= span + 1e-6; d += step) pts.push({ x: startD + d, y: plPrice(startD + d) * mult });
    pts.push({ x: startD + span, y: plPrice(startD + span) * mult });
    return pts;
  }
  function band(label, data, color, dash, w) {
    return { label: label, data: data, borderColor: color, backgroundColor: color, borderWidth: w, borderDash: dash || undefined, pointRadius: 0, tension: 0.2, fill: false, order: 4 };
  }
  var markerPlugin = {
    id: 'hcMarker',
    afterDatasetsDraw: function (c) {
      var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx;
      var x = xS.getPixelForValue(markerDay()), y = yS.getPixelForValue(markerPrice());
      if (x < xS.left - 2 || x > xS.right + 2) return;
      ctx.save();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(109,179,212,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, yS.top); ctx.lineTo(x, yS.bottom); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = SEL_C; ctx.fill();
      ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
  };
  function chDatasets() {
    var startD = Math.max(FIRST_D, MARKER_MIN - YEAR_D), span = todayD - startD;
    var ds = [
      band('Floor (0.42× trend)', bandLine(PL_FLOOR, startD, span), FLOOR_C, [6, 3], 1.4),
      band('Trend', bandLine(1, startD, span), TREND_C, null, 2),
      band('Upper (3× trend)', bandLine(PL_CEIL, startD, span), UPPER_C, [1, 6], 1.1)
    ];
    var price = [];
    for (var i = 0; i < N; i++) if (PL_DATA[i][0] >= startD) price.push({ x: PL_DATA[i][0], y: PL_DATA[i][1] });
    price.push({ x: todayD, y: spot() });
    ds.push({ label: 'BTC price (history)', data: price, borderColor: HIST_C, borderWidth: 1.3, pointRadius: 0, tension: 0.15, order: 1 });
    return ds;
  }
  function buildChannel() {
    var el = document.getElementById('hcChannelChart'); if (!el || typeof Chart === 'undefined') return;
    _dsSpot = spot();
    chChart = new Chart(el.getContext('2d'), {
      type: 'line', data: { datasets: chDatasets() },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' }, layout: { padding: { top: 16, right: 10 } },
        scales: {
          x: { type: 'linear', grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, maxTicksLimit: 8, callback: function (v) { return new Date(GENESIS_TS * 1000 + v * 86400 * 1000).getUTCFullYear(); } } },
          y: { type: 'logarithmic', grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M'; if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K'; return '$' + v.toFixed(0); } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: { backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10, callbacks: { title: function (it) { return it.length ? monthYear(it[0].parsed.x) : ''; }, label: function (it) { return it.dataset.label + ': $' + Math.round(it.parsed.y).toLocaleString(); } } }
        }
      },
      plugins: [markerPlugin]
    });
    wireDrag(el);
  }
  // The channel itself is static: the bands and the price history only move when
  // the live spot arrives. The marker is drawn by a plugin reading live state,
  // so a marker drag needs a repaint, not a dataset rebuild — which would
  // regenerate ~900 points per frame.
  var _dsSpot = null;
  function updateChannel() {
    if (!chChart) { buildChannel(); return; }
    if (_dsSpot !== spot()) { chChart.data.datasets = chDatasets(); _dsSpot = spot(); chChart.update('none'); }
    else chChart.render();
  }
  // Drag: pointer x → day → state. Shares the single render path; no second
  // update route (§6.35's rule that representations never talk to each other).
  function wireDrag(canvas) {
    function dayFromEvent(e) {
      var r = canvas.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      return clamp(chChart.scales.x.getValueForPixel(x), MARKER_MIN, todayD);
    }
    function set(e) {
      var d = dayFromEvent(e);
      S.pos = (d >= todayD - 0.5) ? null : d;
      renderAll();
    }
    canvas.addEventListener('pointerdown', function (e) { dragging = true; canvas.setPointerCapture(e.pointerId); set(e); });
    canvas.addEventListener('pointermove', function (e) { if (dragging) set(e); });
    canvas.addEventListener('pointerup', function (e) { dragging = false; try { canvas.releasePointerCapture(e.pointerId); } catch (err) {} });
    canvas.addEventListener('pointercancel', function () { dragging = false; });
  }

  // ════════ LEDGER CHART (§D) — two paths in COINS ════════
  var ledChart = null;
  function ledDatasets(L) {
    var a = [], b = [], i;
    for (i = 0; i <= L.H; i++) { a.push({ x: i, y: L.allIn[i] }); b.push({ x: i, y: L.bufCoins[i] }); }
    var ds = [
      { label: 'All in', data: a, borderColor: ALLIN_C, backgroundColor: ALLIN_C, borderWidth: 2.2, pointRadius: 0, tension: 0.1, order: 1 },
      { label: 'Stack + buffer', data: b, borderColor: BUF_C, backgroundColor: BUF_C, borderWidth: 2.2, pointRadius: 0, tension: 0.1, order: 2 }
    ];
    return ds;
  }
  function buildLedger(L) {
    var el = document.getElementById('hcLedgerChart'); if (!el || typeof Chart === 'undefined') return;
    ledChart = new Chart(el.getContext('2d'), {
      type: 'line', data: { datasets: ledDatasets(L) },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' }, layout: { padding: { top: 16, right: 10 } },
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Years from the marker', color: MUTED, font: { size: 11 } }, grid: { color: 'rgba(224,148,34,0.05)' }, ticks: { color: MUTED, font: { size: 11 }, stepSize: 1 } },
          y: { title: { display: true, text: 'Coins', color: MUTED, font: { size: 11 } }, grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { size: 11 }, callback: function (v) { return v.toFixed(2); } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function (it) { return it.length ? 'Year ' + it[0].parsed.x : ''; },
              label: function (it) {
                var L2 = ledChart.$L, y = it.parsed.x, px = L2 ? L2.priceAt(y) : 0;
                var cash = (it.dataset.label === 'Stack + buffer' && L2) ? L2.cash[y] : 0;
                return it.dataset.label + ': ' + btc(it.parsed.y) + ' · ' + usd(it.parsed.y * px + cash);
              }
            }
          }
        }
      }
    });
    ledChart.$L = L;
  }
  function updateLedger(L) {
    if (!ledChart) { buildLedger(L); return; }
    ledChart.data.datasets = ledDatasets(L);
    ledChart.$L = L;
    ledChart.update('none');
  }
  // Binding guard (the Phase-A lesson): assert the rendered ORANGE all-in series
  // is the one carrying the all-in terminal coins ON THE CHART, not just in the
  // arrays. Datasets found by label so reordering can't silently break it.
  function ledgerBinding(known) {
    if (!ledChart || !ledChart.scales || !ledChart.scales.y) return null;
    var dsl = ledChart.data.datasets, ai = -1, bi = -1, k;
    for (k = 0; k < dsl.length; k++) {
      if (dsl[k].label === 'All in') ai = k;
      else if (dsl[k].label === 'Stack + buffer') bi = k;
    }
    if (ai < 0 || bi < 0) return null;
    var am = ledChart.getDatasetMeta(ai), bm = ledChart.getDatasetMeta(bi);
    if (!am.data.length || !bm.data.length) return null;
    // Expected comes from the render's own ledger when there is one, and from a
    // fresh compute when called bare from the console.
    var L = known || computeLedger(S);
    var visAllIn = ledChart.scales.y.getValueForPixel(am.data[am.data.length - 1].y);
    var visBuf = ledChart.scales.y.getValueForPixel(bm.data[bm.data.length - 1].y);
    if (!isFinite(visAllIn) || !isFinite(visBuf)) return null;
    var tol = Math.max(0.005, L.allInEnd * 0.01);
    return {
      visualAllInEnd: visAllIn, expectedAllInEnd: L.allInEnd,
      visualBufEnd: visBuf, expectedBufEnd: L.bufEnd,
      allInColor: dsl[ai].borderColor, bufColor: dsl[bi].borderColor,
      ok: Math.abs(visAllIn - L.allInEnd) <= tol && Math.abs(visBuf - L.bufEnd) <= tol
    };
  }
  function assertLedgerBinding(L) { var r = ledgerBinding(L); if (r && !r.ok) console.error('[hc-binding] series→color mapping wrong on the chart', r); }
  if (typeof window !== 'undefined') window.hcBinding = function () { return ledgerBinding(); };

  // ════════ AUDIT TABLE ════════
  var _lastL = null;
  function renderAudit(L) {
    var head = document.getElementById('hcAuditHead'), body = document.getElementById('hcAuditBody');
    if (!head || !body) return;
    head.innerHTML = '<tr><th>Year</th><th class="hc-num">Price</th><th class="hc-num">All in (coins)</th><th class="hc-num">Buffered (coins)</th><th class="hc-num">Cash</th><th class="hc-num">Event</th></tr>';
    var rows = '', y, ev, i;
    for (y = 0; y <= L.H; y++) {
      ev = [];
      for (i = 0; i < L.events.length; i++) if (L.events[i].year === y && L.events[i].type !== 'yield') ev.push(L.events[i].note);
      rows += '<tr><td>' + y + '</td><td class="hc-num">' + usdFull(L.priceAt(y)) + '</td><td class="hc-num">' + btcN(L.allIn[y]) +
        '</td><td class="hc-num">' + btcN(L.bufCoins[y]) + '</td><td class="hc-num">' + usdFull(L.cash[y]) +
        '</td><td class="hc-num hc-ev">' + (ev.join('; ') || '—') + '</td></tr>';
    }
    body.innerHTML = rows;
    _lastL = L;
  }
  function csv() {
    var L = _lastL; if (!L) return;
    var lines = ['year,price_usd,all_in_coins,buffered_coins,cash_usd,events'];
    for (var y = 0; y <= L.H; y++) {
      var ev = [];
      for (var i = 0; i < L.events.length; i++) if (L.events[i].year === y) ev.push(L.events[i].type);
      lines.push([y, Math.round(L.priceAt(y)), L.allIn[y].toFixed(6), L.bufCoins[y].toFixed(6), Math.round(L.cash[y]), '"' + ev.join('; ') + '"'].join(','));
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'how-much-cash.csv'; a.click();
    URL.revokeObjectURL(a.href);
  }

  // ════════ MIRRORED BUFFER CONTROL (§6.35 — two representations, one state) ════════
  // Every representation binds to S.bufMonths. The `from` token is the sole
  // don't-clobber-my-caret guard; it does not encode precedence.
  function syncBufControls(from) {
    var n = document.getElementById('hcBufNum'), s = document.getElementById('hcBufSlider'),
        m = document.getElementById('hcBufMirror'), mv = document.getElementById('hcBufMirrorVal'),
        d = document.getElementById('hcBufDollars');
    if (from !== 'num' && n) n.value = S.bufMonths;
    if (from !== 'slider' && s) s.value = String(S.bufMonths);
    if (from !== 'mirror' && m) m.value = String(S.bufMonths);
    if (mv) mv.textContent = S.bufMonths + ' months';
    if (d) d.textContent = usdFull(bufferUSD()) + ' · ' + btc(coinsToRaiseHere()) + ' at ' + priceWord();
    setSeg('hcBufPresets', S.bufMonths);
  }
  function setSeg(groupId, value) {
    var g = document.getElementById(groupId); if (!g) return;
    var bs = g.querySelectorAll('[data-val]');
    for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('is-active', bs[i].getAttribute('data-val') === String(value));
  }
  // The shock presets are "3 / 6 months of expenses", so they highlight against
  // a ratio, not a dollar figure — otherwise they only ever match at the default
  // expense level.
  function syncShockPresets() {
    var months = S.expMonthly > 0 ? S.shock / S.expMonthly : -1;
    setSeg('hcShockPresets', Number.isInteger(months) ? months : -1);
  }

  // ════════ URL STATE (allocation register: lowercase truncations, raw
  //          numbers, word enums, '1' booleans, defaults deleted) ════════
  function readUrl() {
    if (!window.URLSearchParams) return;
    var p = new URLSearchParams(window.location.search), v;
    if (p.has('stack')) { v = parseFloat(p.get('stack')); if (isFinite(v) && v > 0) S.stackBtc = v; }
    if (p.has('exp')) { v = parseFloat(p.get('exp')); if (isFinite(v) && v > 0) S.expMonthly = v; }
    if (p.has('buf')) { v = parseInt(p.get('buf'), 10); if (isFinite(v)) S.bufMonths = clamp(v, 0, 36); }
    if (p.has('shock')) { v = parseFloat(p.get('shock')); if (isFinite(v) && v >= 0) S.shock = v; }
    if (p.has('hz')) { v = parseInt(p.get('hz'), 10); if (isFinite(v)) S.hz = clamp(v, 5, 30); }
    if (p.has('yld')) { v = parseFloat(p.get('yld')); if (isFinite(v)) S.cashYieldPct = clamp(v, 0, 15); }
    if (p.has('depth')) { v = parseInt(p.get('depth'), 10); if (isFinite(v)) S.depthPct = clamp(v, 1, 99); }
    if (p.has('btc') && ['hold', 'revert'].indexOf(p.get('btc')) >= 0) S.plMode = p.get('btc');
    if (p.has('pos')) { v = parseFloat(p.get('pos')); if (isFinite(v)) S.pos = clamp(v, MARKER_MIN, todayD); }
    if (p.has('dep') && p.get('dep') === '1') S.deploy = true;
    if (p.has('cy')) { v = parseInt(p.get('cy'), 10); if (isFinite(v)) { S.crashOn = true; S.crashYear = clamp(v, 1, Math.max(1, S.hz - 1)); } }
    if (p.has('rec') && RECOVERY[p.get('rec')]) S.crashRec = p.get('rec');
  }
  var _urlT = null;
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    if (_urlT) clearTimeout(_urlT);
    _urlT = setTimeout(function () {
      var p = new URLSearchParams(window.location.search);
      p.set('stack', String(S.stackBtc)); p.set('exp', String(Math.round(S.expMonthly)));
      p.set('buf', String(S.bufMonths)); p.set('shock', String(Math.round(S.shock))); p.set('hz', String(S.hz));
      if (S.cashYieldPct !== DEFAULTS.cashYieldPct) p.set('yld', String(S.cashYieldPct)); else p.delete('yld');
      if (S.depthPct !== DEFAULTS.depthPct) p.set('depth', String(S.depthPct)); else p.delete('depth');
      if (S.plMode) p.set('btc', S.plMode); else p.delete('btc');
      if (S.pos != null) p.set('pos', String(Math.round(S.pos))); else p.delete('pos');
      if (S.deploy) p.set('dep', '1'); else p.delete('dep');
      if (S.crashOn) p.set('cy', String(S.crashYear)); else p.delete('cy');
      if (S.crashOn && S.crashRec !== DEFAULTS.crashRec) p.set('rec', S.crashRec); else p.delete('rec');
      window.history.replaceState(null, '', window.location.pathname + '?' + p.toString() + window.location.hash);
    }, 250);
  }

  // ════════ RENDER ORCHESTRATOR (flat, ordered, ends in syncUrl) ════════
  function renderAll() {
    _stressCache = null;                 // one ledger per pass, not four
    var L = computeLedger(S);
    var mv = document.getElementById('hcPlModeVal');
    if (mv) mv.textContent = modeLabel(activeMode()) + (S.plMode ? '' : ' (regime default)');
    setSeg('hcPlMode', activeMode());
    renderVerdict();
    renderRegime();
    renderEffects();
    renderPlayground();
    renderLedgerVerdict(L);
    renderLedgerReadouts(L);
    renderDryPowder(L);
    renderAudit(L);
    updateChannel();
    updateLedger(L);
    assertLedgerBinding(L);
    assertHcLedger();
    syncBufControls();
    syncUrl();
  }

  // ════════ CONTROLS ════════
  function initControls() {
    var set = function (id, val) { var e = document.getElementById(id); if (e) e.value = val; };
    set('hcStack', S.stackBtc); set('hcExp', S.expMonthly); set('hcShock', S.shock);
    set('hcHorizon', S.hz); set('hcYield', S.cashYieldPct); set('hcDepthSlider', S.depthPct);
    set('hcCrashYear', S.crashYear);
    var hv = document.getElementById('hcHorizonVal'); if (hv) hv.textContent = S.hz + ' years';
    var yv = document.getElementById('hcYieldVal'); if (yv) yv.textContent = S.cashYieldPct + '%/yr';
    var dv = document.getElementById('hcDepthVal'); if (dv) dv.innerHTML = '&minus;' + S.depthPct + '%';
    var cyv = document.getElementById('hcCrashYearVal'); if (cyv) cyv.textContent = 'year ' + S.crashYear;
    var de = document.getElementById('hcDepthEcho'); if (de) de.textContent = S.depthPct;
    var dep = document.getElementById('hcDeploy'); if (dep) dep.checked = S.deploy;
    setSeg('hcDepth', S.depthPct);
    syncShockPresets();
    setSeg('hcCrashRec', S.crashRec);
    setSeg('hcPlMode', activeMode());
    var cb = document.getElementById('hcCrashBody'), cd = document.getElementById('hcCrashDisclosure');
    if (cb) cb.hidden = !S.crashOn;
    if (cd) cd.setAttribute('aria-expanded', String(!!S.crashOn));
    syncBufControls();
  }

  function wire() {
    function on(id, ev, fn) { var e = document.getElementById(id); if (e) e.addEventListener(ev, fn); }

    // The one primary lever + its mirror (§6.35). One setter, all representations.
    function setBuf(v, from) {
      if (!isFinite(v)) return;
      S.bufMonths = clamp(Math.round(v), 0, 36);
      syncBufControls(from); renderAll();
    }
    on('hcBufNum', 'input', function () { setBuf(parseFloat(this.value), 'num'); });
    on('hcBufSlider', 'input', function () { setBuf(parseInt(this.value, 10), 'slider'); });
    on('hcBufMirror', 'input', function () { setBuf(parseInt(this.value, 10), 'mirror'); });
    on('hcBufPresets', 'click', function (e) { var b = e.target.closest('[data-val]'); if (b) setBuf(parseInt(b.getAttribute('data-val'), 10), 'preset'); });

    on('hcStack', 'input', function () { var v = parseFloat(this.value); if (isFinite(v) && v > 0) { S.stackBtc = v; renderAll(); } });
    on('hcExp', 'input', function () { var v = parseFloat(this.value); if (isFinite(v) && v > 0) { S.expMonthly = v; renderAll(); } });
    on('hcShock', 'input', function () { var v = parseFloat(this.value); if (isFinite(v) && v >= 0) { S.shock = v; syncShockPresets(); renderAll(); } });
    on('hcShockPresets', 'click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      S.shock = parseInt(b.getAttribute('data-val'), 10) * S.expMonthly;
      var f = document.getElementById('hcShock'); if (f) f.value = S.shock;
      syncShockPresets(); renderAll();
    });
    on('hcHorizon', 'input', function () {
      S.hz = clamp(parseInt(this.value, 10), 5, 30);
      if (S.crashYear >= S.hz) S.crashYear = Math.max(1, S.hz - 1);
      var hv = document.getElementById('hcHorizonVal'); if (hv) hv.textContent = S.hz + ' years';
      var cy = document.getElementById('hcCrashYear'); if (cy) { cy.max = String(Math.max(1, S.hz - 1)); cy.value = S.crashYear; }
      var cyv = document.getElementById('hcCrashYearVal'); if (cyv) cyv.textContent = 'year ' + S.crashYear;
      renderAll();
    });
    on('hcYield', 'input', function () {
      S.cashYieldPct = clamp(parseFloat(this.value), 0, 15);
      var yv = document.getElementById('hcYieldVal'); if (yv) yv.textContent = S.cashYieldPct + '%/yr';
      renderAll();
    });
    on('hcDepthSlider', 'input', function () {
      S.depthPct = clamp(parseInt(this.value, 10), 1, 99);
      var dv = document.getElementById('hcDepthVal'); if (dv) dv.innerHTML = '&minus;' + S.depthPct + '%';
      var de = document.getElementById('hcDepthEcho'); if (de) de.textContent = S.depthPct;
      setSeg('hcDepth', S.depthPct); renderAll();
    });
    on('hcDepth', 'click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      S.depthPct = parseInt(b.getAttribute('data-val'), 10);
      var sl = document.getElementById('hcDepthSlider'); if (sl) sl.value = S.depthPct;
      var dv = document.getElementById('hcDepthVal'); if (dv) dv.innerHTML = '&minus;' + S.depthPct + '%';
      var de = document.getElementById('hcDepthEcho'); if (de) de.textContent = S.depthPct;
      setSeg('hcDepth', S.depthPct); renderAll();
    });
    on('hcPlMode', 'click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      S.plMode = b.getAttribute('data-val');
      setSeg('hcPlMode', activeMode()); renderAll();
    });
    on('hcCrashDisclosure', 'click', function () {
      S.crashOn = !S.crashOn;
      this.setAttribute('aria-expanded', String(S.crashOn));
      var b = document.getElementById('hcCrashBody'); if (b) b.hidden = !S.crashOn;
      renderAll();
    });
    on('hcCrashYear', 'input', function () {
      S.crashYear = clamp(parseInt(this.value, 10), 1, Math.max(1, S.hz - 1));
      var cyv = document.getElementById('hcCrashYearVal'); if (cyv) cyv.textContent = 'year ' + S.crashYear;
      renderAll();
    });
    on('hcCrashRec', 'click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      S.crashRec = b.getAttribute('data-val'); setSeg('hcCrashRec', S.crashRec); renderAll();
    });
    on('hcDeploy', 'change', function () { S.deploy = !!this.checked; renderAll(); });
    on('hcSnapToday', 'click', function (e) { e.preventDefault(); S.pos = null; renderAll(); });
    on('hcReset', 'click', function () {
      for (var k in DEFAULTS) if (DEFAULTS.hasOwnProperty(k)) S[k] = DEFAULTS[k];
      initControls(); renderAll();
    });
    on('hcAuditToggle', 'click', function () {
      var b = document.getElementById('hcAuditBody2'); if (!b) return;
      b.hidden = !b.hidden; this.setAttribute('aria-expanded', String(!b.hidden));
    });
    on('hcCsvBtn', 'click', csv);
    initControls();
  }

  // ════════ INIT ════════
  function init() {
    readUrl();
    wire();
    buildChannel();
    renderAll();
    try {
      fetchTodayPrice(function (price, source) {
        _priceSource = (source === 'live') ? 'live' : 'fallback';
        if (isFinite(price) && price > 0) {
          _spot = price;
          if (S.plMode == null) setSeg('hcPlMode', activeMode());
        }
        renderAll();
      });
    } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
