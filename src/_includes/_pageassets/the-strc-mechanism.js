/* =============================================================
   STRC Below Par — page script

   The two-sided lens applied to a bitcoin-backed yield instrument
   against its $100 par. The discount reading and the warning reading
   are the same arithmetic; the page shows both, computes what it can,
   and never renders a verdict.

   Data architecture — two freshness classes (design doc §data):
     • LIVE-COMPUTED from bitcoin spot: the three coverage ratios and
       their breakevens, and the bitcoin-reversion overlay. Bitcoin
       spot comes from the shared CoinGecko fetch (fetchTodayPrice /
       todayPriceIsLive, shared/power-law-data.js), the same one every
       chart page uses.
     • DATED CONSTANTS: the single STRC_DATA object below, refreshed on
       MONTHLY_REFRESH_CHECKLIST. Every constant block carries an
       as-of badge; nothing dated is presented as live.

   STRC price is a DATED CONSTANT (last close), reader-adjustable in the
   lens — it is NOT the CoinGecko value. Bitcoin spot (CoinGecko) drives
   coverage and the bitcoin overlay only. The two prices never mix.

   Guardrails (design doc §5, structural not cosmetic):
     • "Estimated:" on every projected figure; no buy zones, no verdicts.
     • The return-to-par figure never renders without its never-returns
       companion, in the same pass.
     • Anything not independently reconciled at build shows a visible
       "verify" badge rather than being presented as settled.
   ============================================================= */
(function () {

  // ═══════════════════════════════════════════════════════════════
  // DATED CONSTANTS — refresh here on MONTHLY_REFRESH_CHECKLIST (STRC block).
  // All figures 8-K-sourced as of `asOf`. See STRC_BELOW_PAR_DESIGN.md.
  // ═══════════════════════════════════════════════════════════════
  var STRC_DATA = {
    asOf: "2026-07-28",
    price: 88.32,              // last close; reader-adjustable in the lens
    parAmount: 100.00,
    rateAnnualPct: 12.00,      // paid semi-monthly, $0.50 × 2, since Jul 2026
    sharesOutstanding: 104600000,  // ≈ $10.46B notional net of buybacks
    priorMonthVWAP: null,      // populate at refresh; drives the bracket dial
    rateHistory: [             // 8-K-sourced, one row per change
      ["2025-08", 9.00], ["2025-09", 10.00], ["2025-10", 10.25], ["2025-11", 10.50],
      ["2025-12", 10.75], ["2026-01", 11.00], ["2026-02", 11.25], ["2026-03", 11.50],
      ["2026-04", 11.50], ["2026-05", 11.50], ["2026-06", 11.50], ["2026-07", 12.00]
    ],
    claimStack: {              // late-Jul 2026 filings ($B)
      seniorConvertsB: 6.70,   // unsecured, ~0.42% avg coupon, 2028–2032, no coverage triggers
      strfSeniorB: 1.284,
      strcNotionalB: 10.464    // filed; sanity-checked against shares × $100 below
    },
    btcHoldings: 843775,
    usdReserveB: 3.75,         // ≈ 25 months of preferred dividends; cannot fund buybacks
    buybackLog: [              // append-only, one row per disclosed window
      { window: "2026-07-20..26", shares: 288930, usdM: 25.0, avg: 86.52,
        parRetiredM: 28.893, annualDivSavedM: 3.5 }
    ],
    authRemaining: { preferredM: 975.0, mstrB: 1.0, btcMonetizationUsedM: 218.5, btcMonetizationCapB: 1.25 },
    supplyLog: [
      { d: "2026-07-27", t: "Policy", v: "No new STRC issuance below $100 par (stated discipline; also economic necessity below par)" }
    ],
    fuelLog: [                 // dated rows, rendered as the fuel-gauge log
      { d: "2026-05-26..31", t: "BTC sale", v: "32 BTC / $2.5M (avg $77,135) — the “inoculation” sale" },
      { d: "2026-05",        t: "Deleveraging", v: "$1.5B convertible-note cash repurchase ($8.2B → $6.7B)" },
      { d: "2026-06-29",     t: "Framework", v: "Digital Credit Capital Framework 8-K (rate → 12%, semi-monthly, buyback + monetization auths)" },
      { d: "2026-06-29..07-05", t: "BTC sale", v: "3,588 BTC / $216.0M under the BTC Monetization Program" },
      { d: "2026-07-20..26", t: "Buyback", v: "First STRC repurchase (see the bid lever)" },
      { d: "2026-07-27",     t: "Posture", v: "Standing below-par bid; no issuance <$100; hold 12% until sustained par" }
    ],
    // Company-modeled, methodology unverified at build (design §5) — carries a verify badge:
    btcBreakevenArrPct: 2.3
  };

  // ── Record-strip anchors (design §E): known points only, drawn as a labeled
  //    schematic ("shape, not tick data"). Never a fabricated tick series. ──
  var RECORD_ANCHORS = [
    { label: "Issuance", date: "Jul 2025", price: 100.00, note: "IPO near par" },
    { label: "ATH",      date: "Jan 13, 2026", price: 100.42, note: "All-time high" },
    { label: "ATL",      date: "Jun 26, 2026", price: 71.25, note: "All-time low, with bitcoin's drawdown" },
    { label: "Today",    date: "Jul 27, 2026", price: 88.32, note: "Last close" }
  ];
  var RECORD_EVENTS = [
    { at: 0.03, txt: "9.00% at IPO" },
    { at: 0.42, txt: "ratcheted to 11.50% by Mar" },
    { at: 0.72, txt: "framework +50bps → 12%" },
    { at: 0.88, txt: "first buyback" }
  ];

  // ── Illustrative floor for the "cut" dividend scenario. The absolute floor is
  //    1-month term SOFR; this is a stand-in proxy, labelled illustrative, NOT a
  //    sourced constant. Adjust with the SOFR level at refresh. ──
  var SOFR_FLOOR_PCT = 4.3;

  // 10-year Treasury yield — reused from the parent page (bitcoin-fixed-income
  // PATHS.treasury.yield = 0.043). Refresh alongside the parent on the monthly checklist.
  var TSY_YIELD = 0.043;

  // ── Palette (shared house conventions) ──
  var AMBER = '#e09422', BLUE = '#6db3d4', MUTED = '#7a7367', DIM = '#9a9080', PULSE = '#F7931A';

  // ── Horizon bounds ──
  var MIN_M = 6, MAX_M = 60, YEAR_D = 365.25;

  // ═══════════════════════════════════════════════════════════════
  // DERIVED CONSTANTS + reconciliation (verify-at-build, design §5)
  // ═══════════════════════════════════════════════════════════════
  var PAR = STRC_DATA.parAmount;
  var RATE = STRC_DATA.rateAnnualPct / 100;
  var COUPON = PAR * RATE;                       // $/yr on one $100-par share
  // Single source of truth for STRC notional: shares × par. The filed figure
  // (strcNotionalB) is cross-checked, not inherited, so the two can't silently drift.
  var STRC_NOTIONAL_B = STRC_DATA.sharesOutstanding * PAR / 1e9;
  var NOTIONAL_GAP_B = STRC_DATA.claimStack.strcNotionalB - STRC_NOTIONAL_B;
  var SENIOR = STRC_DATA.claimStack.seniorConvertsB;
  var STRF = STRC_DATA.claimStack.strfSeniorB;

  // STRC's own annual dividend bill, computed float × rate (NOT inherited). This is
  // the load-bearing obligation for this page. The broader "total preferred bill"
  // cannot be built bottom-up from the data on hand (STRK/STRD floats aren't here);
  // it is shown reserve-implied and verify-badged rather than asserted.
  var STRC_BILL_B = STRC_NOTIONAL_B * RATE;
  var RESERVE_IMPLIED_TOTAL_BILL_B = STRC_DATA.usdReserveB / 25 * 12; // $3.75B ≈ 25 months

  // ── State ──
  var state = { months: 24, never: false, div: 'sustained', ovBtc: false, ovTsy: false, priceOverride: null };
  var btcSpot = null, btcSource = 'seed';

  function strcPrice() { return state.priceOverride != null ? state.priceOverride : STRC_DATA.price; }

  // ═══════════════════════════════════════════════════════════════
  // CORE ARITHMETIC (design §B/§D — worked values are the unit tests)
  // ═══════════════════════════════════════════════════════════════
  function effYield(p) { return COUPON / p; }
  function discountMonths(p) { return (PAR - p) / (PAR * RATE / 12); }

  // Coupon paid per year under each dividend scenario.
  function scenarioCoupon(div) {
    if (div === 'suspended') return 0;
    if (div === 'cut') return PAR * (SOFR_FLOOR_PCT / 100);
    return COUPON;
  }
  // Annualized total return if price returns to par over T years, under `div`.
  // Suspended accrues arrears as an unpaid claim (not cash) — modeled as price-only.
  function returnToPar(p, T, div) {
    var c = scenarioCoupon(div);
    return Math.pow((PAR + c * T) / p, 1 / T) - 1;
  }
  // The never-returns case: you earn the scenario's effective yield (0 if suspended).
  function neverReturn(p, div) { return scenarioCoupon(div) / p; }

  // Demanded-yield ⇄ price (two-way): price = coupon / demandedYield.
  function priceFromYield(y) { return COUPON / y; }
  function yieldFromPrice(p) { return COUPON / p; }

  // Coverage — all live from bitcoin spot ($B pool). Three labelled ratios.
  function coverage(spot) {
    var poolBTC = STRC_DATA.btcHoldings * spot / 1e9;
    var pool = poolBTC + STRC_DATA.usdReserveB;
    return {
      gross: poolBTC / STRC_NOTIONAL_B,
      standalone: (pool - SENIOR - STRF) / STRC_NOTIONAL_B,
      waterfall: pool / (SENIOR + STRF + STRC_NOTIONAL_B)
    };
  }
  // Bitcoin prices at which each ratio = 1.0×. Standalone and waterfall collapse to
  // the same price by construction (both ⇔ pool = senior+STRF+STRC notional).
  function breakevens() {
    return {
      gross: STRC_NOTIONAL_B * 1e9 / STRC_DATA.btcHoldings,
      senior: (STRC_NOTIONAL_B + SENIOR + STRF - STRC_DATA.usdReserveB) * 1e9 / STRC_DATA.btcHoldings
    };
  }

  // Bitcoin reverting to trend — reuse of the shared power-law model, so this page
  // and /discount-or-premium can never disagree on what reversion is worth.
  function btcMultiple() { return (btcSpot != null ? btcSpot : TODAY_PRICE) / plPrice(TODAY_DAYS); }
  function btcRevCAGR(T) { return Math.pow(plPrice(TODAY_DAYS + YEAR_D * T) / (btcSpot != null ? btcSpot : TODAY_PRICE), 1 / T) - 1; }

  // ── Format helpers ──
  function pct1(v) { return (v * 100).toFixed(1) + '%'; }
  function pct2(v) { return (v * 100).toFixed(2) + '%'; }
  function signPct0(v) { var r = Math.round(v * 100); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r) + '%'; }
  // One-decimal signed percent — for small near-breakeven figures (e.g. the
  // 12-month par-holder total return) that signPct0 would round to a misleading 0%.
  function signPct1(v) { var r = v * 100; var s = r > 0.05 ? '+' : r < -0.05 ? '−' : ''; return s + Math.abs(r).toFixed(1) + '%'; }
  function money2(v) { return '$' + v.toFixed(2); }
  function moneyK(v) { return '$' + Math.round(v).toLocaleString(); }
  function fmtMonths(m) {
    if (m < 12) return m + ' months';
    var y = m / 12;
    return (m % 12 === 0) ? (y + (y === 1 ? ' year' : ' years')) : y.toFixed(1) + ' years';
  }
  function fmtBillions(b) { return '$' + b.toFixed(2) + 'B'; }
  var MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function prettyMonth(ym) { var p = ('' + ym).split('-'); return MONTHS_ABBR[parseInt(p[1], 10) - 1] + ' ' + p[0]; }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — live status strip
  // ═══════════════════════════════════════════════════════════════
  function setText(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }
  function setHTML(id, h) { var e = document.getElementById(id); if (e) e.innerHTML = h; }

  function renderStatus() {
    var p = strcPrice();
    setText('sbPrice', money2(p));
    setText('sbCoupon', pct2(RATE) + ' · $' + COUPON.toFixed(0) + '/yr');
    setText('sbYield', pct2(effYield(p)));
    setHTML('sbYieldSub', 'The $' + COUPON.toFixed(0) + ' coupon on a $' + p.toFixed(2)
      + ' price &mdash; <strong>' + pct2(effYield(p)) + '</strong> vs ' + pct2(RATE) + ' at par.');
    setText('sbAsOfBadge', 'as of ' + STRC_DATA.asOf);

    var live = todayPriceIsLive(btcSource);
    var dot = document.getElementById('sbLiveDot');
    if (dot) dot.hidden = !live;
    var spot = (btcSpot != null ? btcSpot : TODAY_PRICE);
    setHTML('sbStatusMeta', (live ? 'Bitcoin spot (live): ' : 'Bitcoin spot (latest monthly data): ')
      + moneyK(spot) + ' · STRC at ' + money2(p) + ' is ' + (p < PAR ? 'a ' + Math.round((1 - p / PAR) * 100) + '% discount to par' : p > PAR ? 'a ' + Math.round((p / PAR - 1) * 100) + '% premium to par' : 'at par') + '. Coverage recomputed every load.');
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — the key-insights box ("the page in three numbers")
  // Bullets 1 & 3 are live; bullet 2 is the static both-ways sentence (in HTML).
  // ═══════════════════════════════════════════════════════════════
  function renderKeyInsights() {
    var p = strcPrice();
    setHTML('sbKi1', '$' + COUPON.toFixed(0) + ' on $' + p.toFixed(2) + ' is <strong>' + pct2(effYield(p))
      + '</strong> &mdash; vs ' + pct2(RATE) + ' at par.');
    var spot = (btcSpot != null ? btcSpot : TODAY_PRICE);
    var c = coverage(spot), be = breakevens();
    setHTML('sbKi3', 'All-claims coverage is <strong>' + c.waterfall.toFixed(2)
      + '&times;</strong> at today&rsquo;s bitcoin &mdash; the one number to watch. It reaches 1.0&times; at about <strong>'
      + moneyK(be.senior) + '</strong>.');
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — §A the lever board
  // ═══════════════════════════════════════════════════════════════
  function logRows(rows) {
    // rows: [{d, t, v}], newest last in the data → "latest" badge on the last row.
    var out = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], latest = (i === rows.length - 1);
      out += '<div class="sb-log-row' + (latest ? ' is-latest' : '') + '">'
        + '<span class="sb-log-d">' + r.d + '</span>'
        + '<span class="sb-log-body"><span class="sb-log-t">' + r.t + '</span>' + r.v + '</span>'
        + (latest ? '<span class="sb-latest-badge">latest</span>' : '')
        + '</div>';
    }
    return out;
  }

  function renderRateLever() {
    var latest = STRC_DATA.rateHistory[STRC_DATA.rateHistory.length - 1];
    var priorChanges = STRC_DATA.rateHistory.length - 1;
    // Visible status carries the latest row so the collapsed 12-row log isn't needed
    // to read "where the rate is now" (progressive disclosure).
    setHTML('sbRateStatus',
      statusField('Current annualized rate', pct2(RATE) + ' <span class="sb-mini">semi-monthly, $0.50 × 2</span>')
      + statusField('History', pct2(RATE) + ' since ' + prettyMonth(latest[0]) + ' · ' + priorChanges + ' prior changes'));

    // Bracket dial: framework-says (from prior-month VWAP) vs board-did vs posture.
    var fw;
    if (STRC_DATA.priorMonthVWAP == null) {
      fw = '<span class="sb-dial-pending">populate at monthly refresh (first refresh: Aug 2026)</span>';
    } else {
      fw = bracketFor(STRC_DATA.priorMonthVWAP);
    }
    setHTML('sbBracketDial',
      '<div class="sb-dial-cap">The bracket dial <span class="sb-mini">policy formalized Feb 5, 2026</span></div>'
      + '<div class="sb-dial-row"><span class="sb-dial-lbl">Framework says</span><span class="sb-dial-val">' + fw + '</span></div>'
      + '<div class="sb-dial-row"><span class="sb-dial-lbl">Board did</span><span class="sb-dial-val">held 12.00% (Jun 29 +50bps matched the &lt;$95 bracket)</span></div>'
      + '<div class="sb-dial-row"><span class="sb-dial-lbl">Declared posture</span><span class="sb-dial-val">hold at 12% until sustained par &mdash; Jul 27, 2026</span></div>'
      + '<div class="sb-dial-brackets"><span>&lt;$95 &rarr; +50bps+</span><span>$95&ndash;98.99 &rarr; +25bps+</span><span>$99&ndash;100.99 &rarr; hold ±25</span><span>&ge;$101 &rarr; cut / reissue</span></div>');

    var rows = STRC_DATA.rateHistory.map(function (r, i) {
      var prev = i > 0 ? STRC_DATA.rateHistory[i - 1][1] : null;
      var delta = prev == null ? 'IPO' : (r[1] > prev ? '+' + Math.round((r[1] - prev) * 100) + 'bps' : r[1] < prev ? '−' + Math.round((prev - r[1]) * 100) + 'bps' : 'flat');
      return { d: r[0], t: r[1].toFixed(2) + '%', v: delta };
    });
    setHTML('sbRateLog', logRows(rows));
  }
  function bracketFor(vwap) {
    if (vwap < 95) return 'recommend +50bps or more';
    if (vwap < 99) return 'recommend +25bps';
    if (vwap < 101) return 'hold ±25bps';
    return 'cut ≥25bps and/or reissue';
  }
  function statusField(cap, val) {
    return '<div class="sb-field"><span class="sb-field-cap">' + cap + '</span><span class="sb-field-val">' + val + '</span></div>';
  }

  function renderSupplyLever() {
    setHTML('sbSupplyStatus',
      statusField('Issuance policy', 'No new STRC issued below $100 par')
      + statusField('As of', STRC_DATA.asOf));
    setHTML('sbSupplyLog', logRows(STRC_DATA.supplyLog));
  }

  function renderBidLever() {
    var totShares = 0, totUsd = 0, totPar = 0, totSaved = 0, avgNum = 0;
    STRC_DATA.buybackLog.forEach(function (b) { totShares += b.shares; totUsd += b.usdM; totPar += b.parRetiredM; totSaved += b.annualDivSavedM; avgNum += b.avg * b.shares; });
    // Display the disclosed (8-K) volume-weighted average price; the $/shares
    // computation ($25.0M / 288,930 = $86.53) differs by a rounding cent and is
    // logged as a console reconciliation only, not shown (design §5 discipline).
    var dispAvg = avgNum / totShares;
    var compAvg = totUsd * 1e6 / totShares;
    if (window.console && console.log && Math.abs(dispAvg - compAvg) > 0.005) {
      console.log('[strc] bid avg: disclosed $' + dispAvg.toFixed(2) + ' (shown) vs computed $' + compAvg.toFixed(2) + ' ($/shares) — rounding');
    }
    setHTML('sbBidStatus',
      statusField('Cumulative repurchased', totShares.toLocaleString() + ' shares · $' + totUsd.toFixed(1) + 'M · avg ' + money2(dispAvg))
      + statusField('Par retired', '$' + totPar.toFixed(2) + 'M → $' + totSaved.toFixed(1) + 'M/yr of dividends eliminated')
      + statusField('Authorization remaining', '~$' + STRC_DATA.authRemaining.preferredM.toFixed(0) + 'M of $1B preferred repurchase')
      + statusField('Sibling auths', '$' + STRC_DATA.authRemaining.mstrB.toFixed(1) + 'B MSTR (unused) · $' + STRC_DATA.authRemaining.btcMonetizationCapB.toFixed(2) + 'B BTC monetization ($' + STRC_DATA.authRemaining.btcMonetizationUsedM.toFixed(1) + 'M used)'));
    var rows = STRC_DATA.buybackLog.map(function (b) {
      return { d: b.window, t: b.shares.toLocaleString() + ' shares', v: '$' + b.usdM.toFixed(1) + 'M @ avg ' + money2(b.avg) + ' — $' + b.parRetiredM.toFixed(2) + 'M par retired, ~$' + b.annualDivSavedM.toFixed(1) + 'M/yr saved' };
    });
    setHTML('sbBidLog', logRows(rows));
  }

  function renderFuelLever() {
    setHTML('sbFuelStatus',
      statusField('Constants as of', STRC_DATA.asOf + ' <span class="sb-mini">every figure below is filing-sourced and refreshed monthly (reserve, dividend bill, claim stack, operating cash flow when shown)</span>')
      + statusField('USD reserve', fmtBillions(STRC_DATA.usdReserveB) + ' <span class="sb-mini">≈ 25 months of preferred dividends; cannot fund buybacks</span>')
      + statusField('STRC dividend bill', fmtBillions(STRC_BILL_B) + '/yr <span class="sb-mini">= ' + STRC_NOTIONAL_B.toFixed(2) + 'B notional × ' + pct2(RATE) + ', computed float × rate</span>')
      + statusField('Total preferred bill', '~' + fmtBillions(RESERVE_IMPLIED_TOTAL_BILL_B) + '/yr <span class="sb-verify-badge">verify</span> <span class="sb-mini">reserve-implied ($3.75B ÷ 25 months); not reconstructible bottom-up from data on hand (STRK/STRD floats absent)</span>')
      + statusField('Senior converts', fmtBillions(SENIOR) + ' <span class="sb-mini">~0.42% avg coupon, 2028–2032, no margin/coverage liquidation triggers</span>')
      + statusField('BTC breakeven ARR', '~' + STRC_DATA.btcBreakevenArrPct.toFixed(1) + '% <span class="sb-verify-badge">verify</span> <span class="sb-mini">company modeling; methodology not independently reproduced</span>'));
    setHTML('sbFuelLog', logRows(STRC_DATA.fuelLog));
  }

  function renderCoverage() {
    var spot = (btcSpot != null ? btcSpot : TODAY_PRICE);
    var c = coverage(spot);
    setText('sbCovGross', c.gross.toFixed(2) + '×');
    setText('sbCovStandalone', c.standalone.toFixed(2) + '×');
    setText('sbCovWaterfall', c.waterfall.toFixed(2) + '×');
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — §B arithmetic (non-interactive readouts)
  // ═══════════════════════════════════════════════════════════════
  function renderArith() {
    var p = strcPrice();
    setText('sbArithYield', pct2(effYield(p)));
    setHTML('sbArithYieldSub', '<strong>' + pct2(effYield(p)) + '</strong> vs ' + pct2(RATE) + ' at par.');
    var dm = discountMonths(p);
    setText('sbArithMonths', dm > 0 ? '~' + dm.toFixed(1) + ' mo' : (dm < 0 ? '+' + Math.abs(dm).toFixed(1) + ' mo' : '0'));
    setHTML('sbArithMonthsSub', p < PAR
      ? '$' + (PAR - p).toFixed(2) + ' below par is worth about <strong>' + dm.toFixed(1) + ' months</strong> of coupon.'
      : 'At or above par there is no discount to denominate.');
    // A par buyer 12 months on: bought at par, collected a year of coupon, marks to p.
    var parHold12 = (p + COUPON - PAR) / PAR;
    setText('sbArithParHold', signPct1(parHold12));
    // Make the math visible: entry, current mark, coupon collected, total return.
    setHTML('sbArithParHoldSub', 'Bought at $' + PAR.toFixed(0) + ' a year ago, marked at $' + p.toFixed(2)
      + ' today (' + (p >= PAR ? '+' : '−') + '$' + Math.abs(p - PAR).toFixed(2) + '), with ~$' + COUPON.toFixed(0)
      + ' of coupon collected: &asymp; <strong>' + signPct1(parHold12) + '</strong> total return.');
    setHTML('sbArithProse', p < PAR
      ? 'The coupon is real; at this price the mark-to-market has all but consumed a year of it. A buyer at par a year ago who marks to today is at <strong>' + signPct1(parHold12) + '</strong> total return despite collecting the full coupon throughout &mdash; the discount reading and the warning reading, in one number. The price of that year: recovering today&rsquo;s $' + (PAR - p).toFixed(2) + ' mark through coupon alone would take roughly another <strong>' + dm.toFixed(1) + ' months</strong> &mdash; the entry yield at par looked better than it proved.'
      : 'At or above par, the pull-to-par works in reverse: a return toward par from here would be a capital loss, and the arithmetic below shows it.');
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — the interactive lens
  // ═══════════════════════════════════════════════════════════════
  var DIV_NOTES = {
    sustained: 'The full ' + STRC_DATA.rateAnnualPct.toFixed(2) + '% coupon holds. This is the base case, not a promise &mdash; the dividend is board discretion.',
    cut: 'Illustrative: the coupon is cut toward its 1-month term SOFR floor (shown here as ~' + SOFR_FLOOR_PCT.toFixed(1) + '%). Cuts are capped per month and barred while cumulative arrears exist.',
    suspended: 'The dividend is suspended (contractually available at any time; arrears accrue, no default). Arrears build as an unpaid claim, not cash. Modeled as price-return only &mdash; the assumption-free never-case is then 0%/yr, with the claim building unseen.'
  };

  function renderLens() {
    var p = strcPrice();
    var never = neverReturn(p, state.div);
    var isNever = state.never;
    var T = state.months / 12;
    var ret = isNever ? never : returnToPar(p, T, state.div);

    setHTML('sbLensReadout', isNever
      ? 'Assuming it <strong>never</strong> returns to par'
      : 'Returning to par over <strong>' + fmtMonths(state.months) + '</strong>');

    setText('sbLensReturn', signPct0(ret));
    setHTML('sbLensReturnSub', isNever
      ? 'per year &mdash; the effective yield under the <strong>' + state.div + '</strong> dividend, with no pull-to-par.'
      : 'per year, if price returns to par by ' + horizonLabel() + ', under the <strong>' + state.div + '</strong> dividend.');

    setText('sbLensNever', signPct0(never));
    setHTML('sbLensNeverSub', state.div === 'suspended'
      ? 'per year: with the dividend suspended and price unchanged, there is no cash return &mdash; arrears accrue as a claim.'
      : 'per year: the effective yield alone, if the multiple to par never closes.');

    setText('sbDivNote', DIV_NOTES[state.div]);
    updateChart();
    renderConverter();
    syncUrl();
  }

  function horizonLabel() {
    // A calendar-agnostic label; the page avoids a hardcoded "today" date.
    return fmtMonths(state.months) + ' from now';
  }

  // ── Chart: estimated return vs horizon, with opt-in overlays ──
  var chart = null;
  function lensCurve() {
    var p = strcPrice(), pts = [];
    for (var mo = MIN_M; mo <= MAX_M; mo++) {
      var T = mo / 12;
      pts.push({ x: T, y: returnToPar(p, T, state.div) * 100 });
    }
    return pts;
  }
  function btcCurve() {
    var pts = [];
    for (var mo = MIN_M; mo <= MAX_M; mo++) {
      var T = mo / 12;
      pts.push({ x: T, y: btcRevCAGR(T) * 100 });
    }
    return pts;
  }
  function tsyCurve() {
    return [{ x: MIN_M / 12, y: 4.3 }, { x: MAX_M / 12, y: 4.3 }];
  }
  function markerPlugin() {
    return {
      id: 'sbMarker',
      afterDatasetsDraw: function (c) {
        if (state.never) return;
        var T = state.months / 12, xS = c.scales.x, yS = c.scales.y, ctx = c.ctx;
        var px = xS.getPixelForValue(T), py = yS.getPixelForValue(returnToPar(strcPrice(), T, state.div) * 100);
        if (!isFinite(px) || !isFinite(py)) return;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(px, c.chartArea.top); ctx.lineTo(px, c.chartArea.bottom);
        ctx.strokeStyle = 'rgba(242,238,232,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = AMBER; ctx.fill();
        ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
    };
  }
  function datasets() {
    var ds = [{ label: 'STRC — return to par (' + state.div + ')', data: lensCurve(), borderColor: AMBER, backgroundColor: AMBER, borderWidth: 2.2, pointRadius: 0, tension: 0.2, fill: false }];
    if (state.ovBtc) ds.push({ label: 'Bitcoin reverting to trend', data: btcCurve(), borderColor: PULSE, backgroundColor: PULSE, borderWidth: 1.8, borderDash: [5, 4], pointRadius: 0, tension: 0.2, fill: false });
    if (state.ovTsy) ds.push({ label: '10-year Treasury (~4.3%)', data: tsyCurve(), borderColor: BLUE, backgroundColor: BLUE, borderWidth: 1.6, borderDash: [2, 3], pointRadius: 0, fill: false });
    return ds;
  }
  function buildChart() {
    var el = document.getElementById('sbChart');
    if (!el || typeof Chart === 'undefined') return;
    chart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: { datasets: datasets() },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 14, right: 10 } },
        scales: {
          x: {
            type: 'linear', min: MIN_M / 12, max: MAX_M / 12,
            title: { display: true, text: 'Years to return to par', color: MUTED, font: { family: 'Inter, sans-serif', size: 11 } },
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { return v + 'y'; } }
          },
          y: {
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { return Math.round(v) + '%'; } }
          }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1,
            titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function (it) { return it.length ? 'Return to par over ' + it[0].parsed.x.toFixed(1) + ' years' : ''; },
              label: function (it) { return 'Estimated: ' + it.dataset.label + ': ' + Math.round(it.parsed.y) + '%/yr'; }
            }
          }
        }
      },
      plugins: [markerPlugin()]
    });
  }
  function updateChart() {
    if (!chart) { buildChart(); return; }
    chart.data.datasets = datasets();
    chart.update('none');
  }

  // ── Demanded-yield ⇄ price converter ──
  var convGuard = false;
  function renderConverter() {
    if (convGuard) return;
    var p = strcPrice();
    var yEl = document.getElementById('sbDemandYield'), pEl = document.getElementById('sbDemandPrice');
    if (yEl && document.activeElement !== yEl) yEl.value = (yieldFromPrice(p) * 100).toFixed(2);
    if (pEl && document.activeElement !== pEl) pEl.value = p.toFixed(2);
    setHTML('sbConvNote', 'At ' + money2(p) + ', the market is demanding <strong>' + pct2(yieldFromPrice(p)) + '</strong>. For reference: 12% demanded &rarr; par; a distressed 35% &rarr; ' + money2(priceFromYield(0.35)) + '. No scenario endorsed.');
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — §C the sharp-question table (live cells)
  // ═══════════════════════════════════════════════════════════════
  function renderSharp() {
    var p = strcPrice();
    var m = btcMultiple();
    var upToPar = (PAR / p - 1);
    var btc2y = btcRevCAGR(2);
    var tsyPct = (TSY_YIELD * 100).toFixed(1) + '%';
    // Peak-to-trough of the one completed episode, from the record anchors.
    var ath = 0, atl = Infinity;
    RECORD_ANCHORS.forEach(function (a) { if (a.price > ath) ath = a.price; if (a.price < atl) atl = a.price; });
    var ddPct = (atl - ath) / ath;
    var spot = (btcSpot != null ? btcSpot : TODAY_PRICE);
    var cov = coverage(spot);
    document.getElementById('sbColStrc').innerHTML = 'STRC at ' + (p / PAR).toFixed(2) + '× par';
    document.getElementById('sbColBtc').innerHTML = 'Bitcoin at ' + m.toFixed(2) + '× trend';
    document.getElementById('sbColTsy').innerHTML = '10-year Treasury (~' + tsyPct + ')';
    // Column order: Bitcoin | STRC | Treasury — STRC is the subject, in the middle.
    // Each row is [label, bitcoin, strc, treasury].
    var rows = [
      ['&ldquo;Wait for recovery&rdquo; upside',
        'uncapped; ~<a href="/discount-or-premium">' + signPct0(btc2y) + '/yr at a 2-year reversion</a>',
        'capped at par (' + signPct0(upToPar) + ') + coupon',
        'none beyond its ~' + tsyPct + ' yield to maturity'],
      ['Cash flow while waiting',
        'none',
        '~' + pct1(effYield(p)) + ' effective yield <strong>if sustained</strong>',
        '~' + tsyPct + ', contractual'],
      ['After inflation',
        'the appreciation asset itself — the rest of this site&rsquo;s subject',
        '<strong>' + pct1(effYield(p)) + '</strong> nominal — well above official inflation, if sustained',
        '~' + tsyPct + ' nominal, near or below many real-world inflation measures — the <a href="/the-half-life">melting ice cube</a>'],
      ['What recovery requires',
        'bitcoin recovering',
        'the same thing: bitcoin recovering',
        'nothing — independent of bitcoin'],
      ['If bitcoin doesn’t recover',
        'the ' + PL_FLOOR.toFixed(2) + '× floor has held for the record&rsquo;s length — bitcoin&rsquo;s growth continuing while price sits at the lower bound of the trend',
        'dividend at risk (see the cost accounting); no floor demonstrated ($71.25 low)',
        'unaffected — par at maturity, rate risk only'],
      ['Mark-to-market in a bitcoin drawdown',
        'the drawdown itself',
        'the discount opened as bitcoin fell — <strong>' + signPct0(ddPct) + '</strong> peak-to-trough ($' + ath.toFixed(2) + ' → $' + atl.toFixed(2) + ') in the one completed episode',
        'broadly stable — rate risk only, independent of bitcoin'],
      ['Claim seniority',
        'the asset itself',
        'a preferred claim on a bitcoin treasury — over-collateralized (~' + cov.waterfall.toFixed(1) + '× across all senior claims), with modest, covenant-free debt ahead of it',
        'full faith and credit of the U.S. government']
    ];
    document.getElementById('sbSharpBody').innerHTML = rows.map(function (r) {
      return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td><td class="sb-col-mid">' + r[2] + '</td><td>' + r[3] + '</td></tr>';
    }).join('');
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — §D cost accounting
  // ═══════════════════════════════════════════════════════════════
  function renderCost() {
    // Rate lever: each 0.5pp across the float.
    var per50 = STRC_NOTIONAL_B * 0.005 * 1000; // $M/yr
    setHTML('sbRateCost',
      'Each <strong>0.5pp</strong> of rate is about <strong>$' + per50.toFixed(0) + 'M/yr</strong> of additional perpetual obligation across the outstanding float ('
      + STRC_NOTIONAL_B.toFixed(2) + 'B notional) &mdash; the spiral risk from the parent&rsquo;s Risks tab, quantified. '
      + 'And the asymmetry, both ways: rate rises are unlimited and discretionary; rate cuts are capped (~25bps + any SOFR decline per month), floored at term SOFR, and barred while cumulative arrears exist &mdash; holder-friendly stickiness <em>and</em> an issuer-side ratchet, the same fact read twice.');

    var b = STRC_DATA.buybackLog[STRC_DATA.buybackLog.length - 1];
    var accretion = COUPON / b.avg;
    setHTML('sbBidCost',
      'Retiring a $100-par share at the log’s average of ' + money2(b.avg) + ' extinguishes a $' + COUPON.toFixed(0) + '/yr perpetual obligation &mdash; about a <strong>' + pct1(accretion) + ' return on the buyback dollar</strong> at that price (the accretion case, the issuer’s framing, credited). '
      + 'And the funding is disclosed to come from outside the preferred &mdash; common-equity issuance, and conditionally bitcoin sales &mdash; so the par defense is paid for elsewhere on the balance sheet. Both are true at once.');

    var be = breakevens();
    document.getElementById('sbBreakevens').innerHTML =
      '<li><strong>Gross BTC &divide; STRC notional</strong> falls to 1.0× at bitcoin &asymp; <strong>' + moneyK(be.gross) + '</strong> &mdash; below this, the treasury doesn’t cover STRC’s own notional even before the senior claims.</li>'
      + '<li><strong>Standalone cushion</strong> and <strong>all-claims coverage</strong> both reach 1.0× at bitcoin &asymp; <strong>' + moneyK(be.senior) + '</strong> &mdash; they cross together by construction (each means the pool equals the senior-and-STRC claims). Below this, the treasury no longer covers all claims senior-and-including STRC at once.</li>';
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER — §E the record strip (schematic SVG, anchors only)
  // ═══════════════════════════════════════════════════════════════
  function renderRecord() {
    var host = document.getElementById('sbRecordStrip');
    if (!host) return;
    var W = 820, H = 260, padL = 46, padR = 20, padT = 24, padB = 44;
    var lo = 65, hi = 105; // dollar band
    function y(v) { return padT + (hi - v) / (hi - lo) * (H - padT - padB); }
    function x(i) { return padL + i / (RECORD_ANCHORS.length - 1) * (W - padL - padR); }

    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="STRC price against $100 par since issuance — a schematic through issuance, all-time high, all-time low, and today.">';
    // Par reference line at 100
    svg += '<line x1="' + padL + '" y1="' + y(100) + '" x2="' + (W - padR) + '" y2="' + y(100) + '" stroke="' + AMBER + '" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.6"/>';
    svg += '<text x="' + (W - padR) + '" y="' + (y(100) - 6) + '" fill="' + AMBER + '" font-family="Inter, sans-serif" font-size="11" text-anchor="end">$100 par</text>';
    // Y gridlines
    [70, 80, 90, 100].forEach(function (g) {
      svg += '<text x="' + (padL - 8) + '" y="' + (y(g) + 4) + '" fill="' + MUTED + '" font-family="Inter, sans-serif" font-size="10" text-anchor="end">$' + g + '</text>';
    });
    // Schematic path through the anchors
    var d = '';
    RECORD_ANCHORS.forEach(function (a, i) { d += (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(a.price).toFixed(1) + ' '; });
    svg += '<path d="' + d + '" fill="none" stroke="' + DIM + '" stroke-width="2"/>';
    // Anchor dots + labels
    RECORD_ANCHORS.forEach(function (a, i) {
      var isToday = (a.label === 'Today');
      svg += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(a.price).toFixed(1) + '" r="4.5" fill="' + (isToday ? PULSE : AMBER) + '" stroke="#0a0908" stroke-width="1.5"/>';
      svg += '<text x="' + x(i).toFixed(1) + '" y="' + (y(a.price) - 12).toFixed(1) + '" fill="#f2eee8" font-family="Inter, sans-serif" font-size="11" font-weight="600" text-anchor="middle">$' + a.price.toFixed(2) + '</text>';
      var ly = H - padB + 16;
      svg += '<text x="' + x(i).toFixed(1) + '" y="' + ly + '" fill="' + DIM + '" font-family="Inter, sans-serif" font-size="10" text-anchor="middle">' + a.label + '</text>';
      svg += '<text x="' + x(i).toFixed(1) + '" y="' + (ly + 13) + '" fill="' + MUTED + '" font-family="Inter, sans-serif" font-size="9" text-anchor="middle">' + a.date + '</text>';
    });
    svg += '</svg>';
    host.innerHTML = svg;
  }

  // ═══════════════════════════════════════════════════════════════
  // URL STATE  (?h=&dv=&ov=&p=)
  // ═══════════════════════════════════════════════════════════════
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var params = [];
    params.push('h=' + (state.never ? 'never' : (state.months / 12).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')));
    params.push('dv=' + state.div);
    var ov = [];
    if (state.ovBtc) ov.push('btc');
    if (state.ovTsy) ov.push('tsy');
    if (ov.length) params.push('ov=' + ov.join(','));
    if (state.priceOverride != null) params.push('p=' + state.priceOverride.toFixed(2));
    try { window.history.replaceState(null, '', '?' + params.join('&')); } catch (e) { /* file:// */ }
  }
  function readUrl() {
    var q = window.location.search;
    var mh = /[?&]h=([^&]+)/.exec(q);
    if (mh) {
      if (mh[1] === 'never') state.never = true;
      else { var y = parseFloat(mh[1]); if (isFinite(y)) { var mo = Math.round(y * 12); if (mo >= MIN_M && mo <= MAX_M) state.months = mo; } }
    }
    var md = /[?&]dv=(sustained|cut|suspended)/.exec(q);
    if (md) state.div = md[1];
    var mo2 = /[?&]ov=([^&]+)/.exec(q);
    if (mo2) { state.ovBtc = /btc/.test(mo2[1]); state.ovTsy = /tsy/.test(mo2[1]); }
    var mp = /[?&]p=([0-9.]+)/.exec(q);
    if (mp) { var pv = parseFloat(mp[1]); if (isFinite(pv) && pv > 0 && pv <= 1000) state.priceOverride = pv; }
  }

  // ═══════════════════════════════════════════════════════════════
  // WIRING
  // ═══════════════════════════════════════════════════════════════
  function renderPriceDependent() {
    renderStatus(); renderKeyInsights(); renderArith(); renderLens(); renderSharp(); renderCost();
  }
  function renderCoverageDependent() {
    renderStatus(); renderKeyInsights(); renderCoverage(); renderSharp(); renderCost();
  }
  function renderAllStatic() {
    renderRateLever(); renderSupplyLever(); renderBidLever(); renderFuelLever(); renderRecord();
  }

  function wire() {
    var slider = document.getElementById('sbSlider');
    if (slider) {
      slider.value = state.months;
      slider.addEventListener('input', function () { state.months = parseInt(this.value, 10); if (state.never) { state.never = false; syncNeverBox(); } renderLens(); });
    }
    var neverBox = document.getElementById('sbNever');
    if (neverBox) {
      neverBox.checked = state.never;
      neverBox.addEventListener('change', function () { state.never = this.checked; renderLens(); });
    }
    var priceIn = document.getElementById('sbPriceInput');
    if (priceIn) {
      priceIn.value = strcPrice().toFixed(2);
      priceIn.addEventListener('input', function () {
        var v = parseFloat(this.value);
        state.priceOverride = (isFinite(v) && v > 0) ? v : null;
        renderPriceDependent();
      });
    }
    var divBtns = document.querySelectorAll('.sb-div-btn');
    for (var i = 0; i < divBtns.length; i++) {
      divBtns[i].addEventListener('click', function () {
        state.div = this.getAttribute('data-div');
        for (var j = 0; j < divBtns.length; j++) {
          var on = divBtns[j] === this;
          divBtns[j].classList.toggle('is-active', on);
          divBtns[j].setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        renderLens();
      }.bind(divBtns[i]));
    }
    var ovBtc = document.getElementById('sbOvBtc');
    if (ovBtc) { ovBtc.checked = state.ovBtc; ovBtc.addEventListener('change', function () { state.ovBtc = this.checked; updateChart(); syncUrl(); }); }
    var ovTsy = document.getElementById('sbOvTsy');
    if (ovTsy) { ovTsy.checked = state.ovTsy; ovTsy.addEventListener('change', function () { state.ovTsy = this.checked; updateChart(); syncUrl(); }); }

    // Converter — two-way, guarded so setting one doesn't fight the other.
    var yEl = document.getElementById('sbDemandYield'), pEl = document.getElementById('sbDemandPrice');
    if (yEl) yEl.addEventListener('input', function () {
      var y = parseFloat(this.value);
      if (isFinite(y) && y > 0) { convGuard = true; state.priceOverride = priceFromYield(y / 100); renderPriceDependent(); convGuard = false; var pin = document.getElementById('sbPriceInput'); if (pin) pin.value = strcPrice().toFixed(2); var pbox = document.getElementById('sbDemandPrice'); if (pbox && document.activeElement !== pbox) pbox.value = strcPrice().toFixed(2); }
    });
    if (pEl) pEl.addEventListener('input', function () {
      var v = parseFloat(this.value);
      if (isFinite(v) && v > 0) { convGuard = true; state.priceOverride = v; renderPriceDependent(); convGuard = false; var pin = document.getElementById('sbPriceInput'); if (pin) pin.value = strcPrice().toFixed(2); var yin = document.getElementById('sbDemandYield'); if (yin) yin.value = (yieldFromPrice(v) * 100).toFixed(2); }
    });
  }
  function syncNeverBox() { var b = document.getElementById('sbNever'); if (b) b.checked = state.never; }
  function syncDivBtns() {
    var divBtns = document.querySelectorAll('.sb-div-btn');
    for (var j = 0; j < divBtns.length; j++) {
      var on = divBtns[j].getAttribute('data-div') === state.div;
      divBtns[j].classList.toggle('is-active', on);
      divBtns[j].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function init() {
    if (typeof plPrice !== 'function' || typeof PL_DATA === 'undefined') { /* shared module missing */ }
    // Build-time reconciliation notes to the console (honesty, not UI noise).
    if (window.console && console.log) {
      console.log('[strc] notional shares×par=' + STRC_NOTIONAL_B.toFixed(4) + 'B filed=' + STRC_DATA.claimStack.strcNotionalB + 'B gap=$' + (NOTIONAL_GAP_B * 1000).toFixed(1) + 'M');
      console.log('[strc] STRC bill=' + STRC_BILL_B.toFixed(4) + 'B/yr; reserve-implied total=' + RESERVE_IMPLIED_TOTAL_BILL_B.toFixed(3) + 'B/yr (verify)');
      var be = breakevens();
      console.log('[strc] breakevens: gross=1x@$' + Math.round(be.gross) + '  standalone/waterfall=1x@$' + Math.round(be.senior));
    }
    readUrl();
    wire();
    syncNeverBox();
    syncDivBtns();
    buildChart();
    renderAllStatic();
    renderCoverage();
    renderPriceDependent();
    if (typeof fetchTodayPrice === 'function') {
      fetchTodayPrice(function (p, source) {
        btcSpot = p; btcSource = source;
        renderCoverageDependent();
        updateChart(); // refresh the bitcoin overlay against live spot
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
