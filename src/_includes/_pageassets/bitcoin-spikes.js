/* =============================================================
   Bitcoin's Spikes — page engine

   Reads the shared modules only: power-law-data.js (PL_DATA, plPrice,
   PL_FLOOR, PL_CEIL, PL_B, TODAY_DAYS, TODAY_PRICE, fetchTodayPrice,
   todayPriceNote, positionLabelForMultiple), channel-entries.js (the
   How Much Cash method, for card B) and spike-record.js (the record and
   the trade engines). No channel math is re-derived here.

   Two classes of number, kept apart:
     · LIVE      — the readout, every record figure and every card. From
                   PL_DATA at load (and the live spot, for the readout and
                   the "never bought back" multiple).
     · SNAPSHOT  — peak-buyer recovery for other markets and the unit
                   refits, from src/_data/spikeSnapshots.json (computed
                   2026-10-04; annual refresh). Rendered into the page as
                   #spSnapshots.

   Card B's headline is How Much Cash's own figure: bandMetrics(P, 'trend')
   at the chosen sell position, with How Much Cash's tax rule (0, 15 or 20),
   so a reader who follows the handoff sees the same numbers on arrival.
   ============================================================= */
(function () {
  'use strict';
  if (!window.SpikeRecord || !window.ChannelEntries || typeof plPrice !== 'function') return;
  var SR = window.SpikeRecord, CE = window.ChannelEntries;

  function $(id) { return document.getElementById(id); }
  function cssVar(name, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v || fb; }
  function money(v) { return '$' + Math.round(v).toLocaleString('en-US'); }
  function fmtM(m) { return m < 2 ? m.toFixed(2) : m.toFixed(1); }          // table and chart labels
  function fmtShort(m) { return m >= 10 ? String(Math.round(m)) : fmtM(m); } // headline figures
  function monthYear(d) { return SR.monthYear(d); }
  function monthLong(d) { return new Date((GENESIS_TS + d * 86400) * 1000).toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }); }
  function monthOnly(d) { return new Date((GENESIS_TS + d * 86400) * 1000).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }); }
  function yearOf(d) { return new Date((GENESIS_TS + d * 86400) * 1000).getUTCFullYear(); }
  var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  function words(n) { return WORDS[n] || String(n); }
  function listAnd(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }
  function track(name, params) { try { if (typeof gtag === 'function') gtag('event', name, params); } catch (e) {} }

  var MONTH_D = SR.MONTH_D;
  var REC = SR.record();
  var SNAP = (function () { try { return JSON.parse($('spSnapshots').textContent); } catch (e) { return null; } })();
  var spot = TODAY_PRICE, spotSource = 'fallback';
  function trendNow() { return plPrice(TODAY_DAYS); }
  function multNow() { return spot / trendNow(); }

  var C = {};
  function readColors() {
    C = {
      text: cssVar('--text'), dim: cssVar('--text-dim'), muted: cssVar('--text-muted'), grid: cssVar('--border'),
      orange: cssVar('--orange'), gold: cssVar('--gold'), amber: cssVar('--amber'), floor: cssVar('--sp-floor'),
      bright: cssVar('--text-bright'), green: cssVar('--green'), bg: cssVar('--bg'), real: cssVar('--sp-real'), hot: cssVar('--sp-hot-text')
    };
  }
  var F = 'font-family="Inter,sans-serif"';
  function txt(x, y, s, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" fill="' + (o.c || C.muted) + '" font-size="' + (o.s || 10) + '" text-anchor="' + (o.a || 'middle') + '" ' + F + (o.w ? ' font-weight="' + o.w + '"' : '') + '>' + s + '</text>'; }
  function logS(lo, hi, p0, p1) { return function (v) { return p0 + (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) * (p1 - p0); }; }
  function yearX(y0, y1, p0, p1) { var a = SR.dayOfIso(y0 + '-01-01'), b = SR.dayOfIso(y1 + '-01-01'); return function (d) { return p0 + (d - a) / (b - a) * (p1 - p0); }; }

  // Derived record facts, shared by several sections.
  var BIG = REC.filter(function (r) { return r.highM >= 1.5 && r.backTrend; });            // cycles with a real spike that has come back
  var LATE = REC.filter(function (r) { return !r.sameSample; });                             // spike and high apart
  var R13 = REC.filter(function (r) { return r.y === '2013'; })[0];
  var LATEST = REC[REC.length - 1];
  function fallSpan() {
    var f = BIG.map(function (r) { return Math.round(r.backTrend.fall); });
    return Math.min.apply(null, f) + '–' + Math.max.apply(null, f) + '%';
  }
  function trendGrowth(d) { return 100 * (Math.pow((d + 365.25) / d, PL_B) - 1); }

  // ═══════════ READOUT ═══════════
  function stateOf(m) { return m < 1 ? 'calm' : m <= 1.5 ? 'warm' : 'hot'; }
  function ledeFor(m) {
    var st = stateOf(m), ms = m.toFixed(2);
    if (st === 'calm') return 'Bitcoin is not in a spike. It sits at ' + ms + '× its trend, ' + positionLabelForMultiple(m) + '. This is the time to decide what you would do in one, because the record says you won’t be able to tell when you’re in the middle of it.';
    if (st === 'warm') {
      var z = REC.filter(function (r) { return r.highM >= 1 && r.highM <= 1.5; });
      var tail = z.length === 1 ? ' In ' + z[0].y + ' the price high came while price was here, at ' + z[0].highM.toFixed(2) + '× trend, not further up.'
        : z.length > 1 ? ' In ' + listAnd(z.map(function (r) { return r.y; })) + ' the price high came while price was here, not further up.' : '';
      return 'Bitcoin is above its trend, at ' + ms + '×. Every cycle has passed through this zone.' + tail;
    }
    var hot = REC.filter(function (r) { return r.d15 != null && r.backTrend; });
    var mo = hot.map(function (r) { return Math.round(r.d15 / MONTH_D); });
    return 'Bitcoin is well above its trend, at ' + ms + '×. Price has been above 1.5× trend in ' + words(hot.length) + ' cycles, for ' +
      Math.min.apply(null, mo) + ' to ' + Math.max.apply(null, mo) + ' months each time, and every time it came back.';
  }
  function renderReadout() {
    var tr = trendNow(), m = spot / tr, st = stateOf(m);
    $('spRoMult').textContent = m.toFixed(2);
    $('spRoPrice').textContent = money(spot) + (typeof todayPriceNote === 'function' ? todayPriceNote(spotSource) : '');
    $('spRoTrend').textContent = money(tr);
    $('spRoLabel').textContent = positionLabelForMultiple(m);
    var la = SR.lastAbove();
    if (m >= 1) $('spRoLast').textContent = 'Above trend now.';
    else if (la) {
      var ago = Math.round((TODAY_DAYS - la.d) / MONTH_D);
      $('spRoLast').textContent = 'Last above trend: ' + monthYear(la.d) + ' (' + ago + ' month' + (ago === 1 ? '' : 's') + ' ago, on the ~12-day series).';
    }
    var pill = $('spRoPill');
    pill.textContent = st === 'calm' ? 'Not a spike' : st === 'warm' ? 'Above trend' : 'Well above trend';
    pill.className = 'sp-pill' + (st === 'calm' ? '' : ' ' + st);
    $('spRoLede').textContent = ledeFor(m);
    drawMultChart(m);
  }
  function drawMultChart(m) {
    var svg = $('spMultChart'), W = 560, H = 250, L = 38, R = 12, T = 10, Bm = 26;
    var M = SR.series(), x0 = M[0].d, x1 = Math.max(M[M.length - 1].d, TODAY_DAYS);
    var X = function (d) { return L + (d - x0) / (x1 - x0) * (W - L - R); };
    var Y = logS(0.2, 20, H - Bm, T), h = '';
    [[PL_FLOOR, PL_FLOOR + '× floor', C.floor], [1, '1× trend', C.amber], [PL_CEIL, PL_CEIL + '× upper band', C.gold]].forEach(function (a) {
      h += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(a[0]) + '" y2="' + Y(a[0]) + '" stroke="' + a[2] + '" stroke-width="1" stroke-dasharray="' + (a[0] === 1 ? '0' : '4 4') + '" opacity=".75"/>' +
        txt(L + 6, Y(a[0]) + (a[0] === PL_FLOOR ? 13 : -4), a[1], { a: 'start', c: a[2] });
    });
    [0.2, 0.5, 1, 2, 5, 10, 20].forEach(function (v) { h += txt(L - 6, Y(v) + 3, v + '×', { a: 'end' }); });
    for (var yr = 2012; yr <= yearOf(x1); yr += 2) { var d = SR.dayOfIso(yr + '-01-01'); h += '<line x1="' + X(d) + '" x2="' + X(d) + '" y1="' + T + '" y2="' + (H - Bm) + '" stroke="' + C.grid + '"/>' + txt(X(d), H - 8, yr); }
    h += '<path d="' + M.map(function (s, i) { return (i ? 'L' : 'M') + X(s.d).toFixed(1) + ' ' + Y(s.m).toFixed(1); }).join('') + '" fill="none" stroke="' + C.text + '" stroke-width="1.4"/>';
    REC.forEach(function (r) { h += '<circle cx="' + X(r.spikeD) + '" cy="' + Y(r.spikeM) + '" r="3.5" fill="' + C.orange + '"/>' + txt(X(r.spikeD), Y(r.spikeM) - 8, fmtM(r.spikeM) + '×', { c: C.bright }); });
    var my = Y(Math.max(0.2, m));
    h += '<circle cx="' + X(TODAY_DAYS) + '" cy="' + my + '" r="5" fill="none" stroke="' + C.orange + '" stroke-width="2"/>' + txt(X(TODAY_DAYS) - 4, my - 10, 'today ' + m.toFixed(2) + '×', { a: 'end', c: C.orange });
    svg.innerHTML = h;
  }

  // ═══════════ FACT ROW ═══════════
  function renderFacts() {
    $('spFact1').textContent = fallSpan();
    $('spWarnFall').textContent = fallSpan();
    var par = REC.map(function (r) { return r.runupSpike; }).filter(function (v) { return v > SR.PARABOLIC; });
    $('spFact2').textContent = LATE.map(function (r) { return '+' + Math.round(r.runupHigh) + '%'; }).join(' · ');
    $('spFact2Txt').textContent = 'The climbs into the ' + words(LATE.length) + ' tops nobody flagged, ' + listAnd(LATE.map(function (r) { return monthYear(r.highD); })) +
      '. The obvious tops came after +' + Math.round(Math.min.apply(null, par)).toLocaleString('en-US') + '% to +' + Math.round(Math.max.apply(null, par)).toLocaleString('en-US') + '% in 90 days.';
    $('spFact3').textContent = fmtShort(R13.spikeM) + '× → ' + fmtShort(LATEST.spikeM) + '×';
    $('spFact3Txt').textContent = 'The largest distance above trend, ' + yearOf(R13.spikeD) + ' against ' + yearOf(LATEST.spikeD) + '. The ' + monthLong(LATEST.highD) + ' high sat at ' + LATEST.highM.toFixed(2) + '× trend.';
    $('spPctAbove').textContent = Math.round(SR.pctAbove()) + '%';
  }

  // ═══════════ BARS (shared by the cards) ═══════════
  function rowsHTML(items, max) {
    return items.map(function (it) {
      var w = Math.min(100, 100 * it.v / max), mid = 100 / max, col = it.c || (it.v >= 1 ? 'var(--green)' : 'var(--amber)');
      return '<div class="sp-row"><span class="y">' + it.y + '</span><span class="sp-bar"><i style="width:' + w + '%;background:' + col + '"></i><span class="mid" style="left:' + mid + '%"></span></span><span class="v">' + it.t + '</span>' + (it.n ? '<span class="note">' + it.n + '</span>' : '') + '</div>';
    }).join('');
  }
  function seg(id, cb) {
    var btns = document.querySelectorAll('#' + id + ' button');
    btns.forEach(function (b) { b.addEventListener('click', function () { btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); cb(b.getAttribute('data-v')); }); });
  }

  // ═══════════ CARD A · FUND SOMETHING ═══════════
  var fWhen = 'down';
  function updA() {
    var mo = +$('spFMonths').value, amt = +$('spFAmt').value;
    $('spFMonthsOut').textContent = mo + ' months'; $('spFAmtOut').textContent = money(amt);
    var res = SR.fundResults(fWhen, mo);
    var items = res.map(function (o) {
      if (o.never) return { y: o.c.y, v: 1, t: 'no sale', n: 'Price never reached 2× trend. You would have sold when the bill arrived.', c: 'var(--text-muted)' };
      if (o.pending) return { y: o.c.y, v: 0, t: 'not yet', n: 'Sold ' + monthYear(o.s.d) + '; the need date is still ahead.', c: 'var(--border)' };
      var cs = amt / o.s.p, cl = amt / o.q;
      return { y: o.c.y, v: o.r, t: Math.round(o.r * 100) + '%', n: 'Sold ' + monthYear(o.s.d) + ': ' + cs.toFixed(cs < 1 ? 3 : 1) + ' BTC, against ' + cl.toFixed(cl < 1 ? 3 : 1) + ' BTC ' + mo + ' months later', c: o.r < 1 ? 'var(--green)' : 'var(--amber)' };
    });
    var done = res.filter(function (o) { return o.r != null; }).map(function (o) { return o.r; });
    var peak = SR.fundResults('peak', mo).filter(function (o) { return o.r != null; }).map(function (o) { return o.r; });
    function rng(a) { return a.length ? Math.round(Math.min.apply(null, a) * 100) + '–' + Math.round(Math.max.apply(null, a) * 100) + '%' : 'n/a'; }
    var what = fWhen === 'peak' ? 'at each spike’s peak' : fWhen === 'up' ? 'as price rose through 2× trend' : 'as price fell back below 2× trend';
    var h = 'Selling ' + what + ' for a bill due ' + mo + ' months later used <strong>' + rng(done) + '</strong> of the coins, and fewer coins in <strong>' +
      done.filter(function (v) { return v < 1; }).length + ' of ' + done.length + '</strong> cycles where a sale happened.';
    if (fWhen !== 'peak') h += ' Waiting for the peak, with perfect hindsight, would have used ' + rng(peak) + '.';
    $('spFHead').innerHTML = h; $('spFRows').innerHTML = rowsHTML(items, 1.4);
  }

  // ═══════════ CARD B · END UP WITH MORE BITCOIN ═══════════
  var bTrig = 2, bAcct = 'ira';
  // How Much Cash accepts tax 0, 15 or 20. IRA → 0; taxable → the nearer of 15 and 20.
  function hmcTax(rate) { return bAcct === 'ira' ? 0 : (rate < 17.5 ? 15 : 20); }
  function sellPos(trig) { return Math.round(CE.posOf(trig * trendNow(), TODAY_DAYS) * 1000) / 1000; }
  // The How Much Cash computation at these inputs (how-much-cash.js compute():
  // matchPos clamp, numeric rebuy 0.36 = the 'trend' token, after-tax hit rate
  // and median round trip). Exposed for the parity check.
  function cardB(trig, acct, rate) {
    var P = sellPos(trig), tax = acct === 'ira' ? 0 : (rate < 17.5 ? 15 : 20), t = tax / 100;
    var m = CE.bandMetrics(Math.max(0, P), 'trend');
    if (!m) return null;
    var rt = m.metrics.map(function (e) { return (1 - t) * e.ratio; });
    function legMed(leg) { var a = m.metrics.filter(function (e) { return e.leg === leg; }).map(function (e) { return (1 - t) * e.ratio; }); return a.length ? CE.median(a) : null; }
    return {
      P: P, tax: tax, n: m.n, since: CE.S[m.entries[0]].d,
      hitAfterTax: rt.filter(function (v) { return v > 1; }).length / rt.length * 100,
      medianRT: (1 - t) * m.ratio,
      rising: legMed('rising'), falling: legMed('falling'), m: m
    };
  }
  function bRate() { return +$('spBRate').value; }
  function updB() {
    var sh = +$('spBShare').value / 100, rate = bRate();
    $('spBShareOut').textContent = Math.round(sh * 100) + '%';
    $('spBRateOut').textContent = (rate % 1 ? rate.toFixed(1) : rate) + '%';
    var c = cardB(bTrig, bAcct, rate);
    if (c) {
      var end = 1 - sh + sh * c.medianRT, chg = Math.round((end - 1) * 100);
      $('spBHead').innerHTML = 'Selling at ' + bTrig + '× trend and buying back once price fell below trend left more bitcoin <strong>' + Math.round(c.hitAfterTax) +
        '%</strong> of the time, across the ' + c.n + ' times since ' + yearOf(c.since) + ' that price stood near ' + bTrig + '×. The typical round trip returned <strong>' +
        c.medianRT.toFixed(2) + '×</strong> the coins sold' + (c.tax ? ', after ' + c.tax + '% tax' : ', in an IRA') + '. A ' + Math.round(sh * 100) + '% trim at that typical outcome ends with ' +
        (chg === 0 ? 'about the same bitcoin as holding.' : Math.abs(chg) + '% ' + (chg > 0 ? 'more' : 'less') + ' bitcoin than holding.');
      $('spBLegs').textContent = (c.rising != null && c.falling != null)
        ? 'The same entries split by direction: sold while price was still rising through ' + bTrig + '×, the median round trip returned ' + c.rising.toFixed(2) + '×; sold as it fell back, ' + c.falling.toFixed(2) + '×. ' + CE.legSentence(c.m, 'the round trip paid')
        : '';
      $('spBTaxNote').textContent = bAcct === 'ira'
        ? 'These are How Much Cash’s figures for the same inputs, so the handoff below opens on the same numbers.'
        : 'How Much Cash models a 15% or 20% rate, so your ' + (rate % 1 ? rate.toFixed(1) : rate) + '% is carried there as ' + c.tax + '%, and the headline uses ' + c.tax + '% so the two pages agree. The rows use your exact rate.';
    }
    // Per-cycle illustration: the first time price reached the trigger in each cycle.
    var keep = bAcct === 'tax' ? 1 - rate / 100 : 1, items = [];
    SR.TRADE_CYCLES.forEach(function (cy) {
      var r = SR.roundTrip(cy, bTrig, 'trend');
      if (!r.fired) { items.push({ y: cy.y, v: 1, t: 'held', n: 'Never reached ' + bTrig + '× trend. No sale; you simply held.', c: 'var(--text-muted)' }); return; }
      if (!r.rb) { items.push({ y: cy.y, v: 1, t: 'open', n: 'Sold ' + monthYear(r.sell.d) + '; no return to trend yet.', c: 'var(--text-muted)' }); return; }
      var stack = 1 - sh + sh * keep * r.ratio;
      items.push({ y: cy.y, v: stack, t: (stack >= 1 ? '+' : '') + Math.round((stack - 1) * 100) + '%', n: 'Sold ' + monthYear(r.sell.d) + ' at ' + money(r.sell.p) + ', bought back ' + monthYear(r.rb.d) + ' at ' + money(r.rb.p) });
    });
    $('spBRowsH').textContent = 'Illustration: the first time price reached ' + bTrig + '× in each cycle' + (bAcct === 'tax' ? ', at ' + (rate % 1 ? rate.toFixed(1) : rate) + '% tax' : ', in an IRA');
    $('spBRows').innerHTML = rowsHTML(items, 2);
    var t13 = SR.roundTrip(SR.TRADE_CYCLES[0], bTrig, 'trend');
    var rose = t13.fired ? R13.highP / t13.sell.p : null;
    $('spBCaveat').textContent = 'The headline counts every sample near ' + bTrig + '× trend since ' + (c ? yearOf(c.since) : 2014) + ', as How Much Cash does; “below trend” there means price falling under about 0.85× trend, the lower edge of the site’s “at trend” zone. The rows rebuy at 1× trend. ' +
      (rose ? 'How Much Cash’s set starts in 2014, so the 2013 case appears only here: that rule sold in ' + monthYear(t13.sell.d) + ', and price rose more than ' + Math.floor(rose) + '× by ' + monthYear(R13.highD) + '. ' : '') +
      'Low cost basis assumed in taxable mode. Bars show your whole stack after the round trip; the line marks where you started.';
    if (c) $('spBCta').setAttribute('href', '/how-much-cash?pos=' + c.P.toFixed(3) + '&rebuy=trend&share=' + Math.round(sh * 100) + '&tax=' + c.tax + '&from=spikes');
  }

  // ═══════════ CARD C · RUN A RULE ═══════════
  var cTrig = 1.5, cRebuy = 'trend', cAcct = 'retirement';
  function updC() {
    var items = [];
    SR.TRADE_CYCLES.forEach(function (cy) {
      var r = SR.roundTrip(cy, cTrig, cRebuy);
      if (!r.fired) { items.push({ y: cy.y, v: 1, t: 'never fired', n: 'Held through the cycle.', c: 'var(--text-muted)' }); return; }
      if (!r.rb) { items.push({ y: cy.y, v: 0.05, t: 'no rebuy', n: 'Sold ' + monthYear(r.sell.d) + ' at ' + money(r.sell.p) + '; the rebuy never triggered. Still in cash.', c: 'var(--red)' }); return; }
      items.push({ y: cy.y, v: r.ratio, t: r.ratio.toFixed(2) + '×', n: 'Sold ' + monthYear(r.sell.d) + ', bought back ' + monthYear(r.rb.d) + ' (whole position, IRA)' });
    });
    $('spCRows').innerHTML = rowsHTML(items, 2);
    var t13 = SR.roundTrip(SR.TRADE_CYCLES[0], cTrig, 'trend');
    $('spCNote').textContent = cRebuy === 'ath80'
      ? 'A rebuy waiting for an 80% fall has not triggered since 2013, so the sale stayed in cash. Fixed drawdown targets fail as cycles shrink.'
      : 'Coins after the round trip as a multiple of coins sold, whole position, no tax.' + (t13.fired ? ' Note 2013: the rule fired in ' + monthYear(t13.sell.d) + ' and price rose more than ' + Math.floor(R13.highP / t13.sell.p) + '× by ' + monthYear(R13.highD) + '.' : '');
    $('spCCta').setAttribute('href', '/disciplined-rebalancing?account=' + cAcct);
  }

  // ═══════════ TAX HURDLE ═══════════
  var hAcct = 'tax';
  function stateRate() {
    var sel = $('spHState'), o = sel.options[sel.selectedIndex];
    if (!o || o.value === 'NONE') return 0;
    var mm = o.textContent.match(/([\d.]+)%/); return mm ? parseFloat(mm[1]) : 0;   // rates live in the shared option labels
  }
  function updH() {
    var r = +$('spHRate').value, b = +$('spHBasis').value / 100;
    $('spHRateOut').textContent = r.toFixed(1) + '%'; $('spHBasisOut').textContent = Math.round(b * 100) + '%';
    var T = (r + stateRate()) / 100, D = hAcct === 'ira' ? 0 : T * (1 - b);
    $('spHOut').textContent = (D * 100).toFixed(1) + '%';
    $('spHCtl').classList.toggle('is-off', hAcct === 'ira');
  }

  // ═══════════ INTENT CHOOSER + TIP ═══════════
  var WORK = { spIA: 'spWA', spIB: 'spWB', spIC: 'spWC' }, intent = 'fund';
  function selectIntent(btn, user) {
    document.querySelectorAll('.sp-intent').forEach(function (x) { x.setAttribute('aria-pressed', String(x === btn)); });
    for (var k in WORK) $(WORK[k]).hidden = k !== btn.id;
    intent = btn.getAttribute('data-intent');
    if (user) track('spikes_intent', { intent: intent, position: +multNow().toFixed(2) });
  }
  function wireTip() {
    var tip = document.querySelector('.sp-tip');
    if (!tip) return;
    function set(v) { tip.setAttribute('aria-expanded', String(v)); }
    tip.addEventListener('click', function (e) { e.stopPropagation(); set(tip.getAttribute('aria-expanded') !== 'true'); });
    tip.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); } });
    document.addEventListener('click', function (e) { if (!e.target.closest('.sp-pair-h')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  // ═══════════ TABS (bare-token hash deep links) ═══════════
  var tabs = [];
  function selectTab(t, writeHash) {
    tabs.forEach(function (x) {
      var on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
      $(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (writeHash && window.history && history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#' + t.getAttribute('data-hash'));
  }
  function tabFromHash() {
    var h = location.hash.replace('#', '');
    for (var i = 0; i < tabs.length; i++) if (tabs[i].getAttribute('data-hash') === h) return tabs[i];
    return null;
  }
  function wireTabs() {
    tabs = Array.prototype.slice.call(document.querySelectorAll('.sp-tab'));
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t, true); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
        if (j < 0) return; e.preventDefault(); tabs[j].focus(); selectTab(tabs[j], true);
      });
    });
    var h = tabFromHash(); if (h) selectTab(h, false);
    window.addEventListener('hashchange', function () { var t = tabFromHash(); if (t) selectTab(t, false); });
  }

  // ═══════════ TAB 2 · THE RECORD ═══════════
  function lastAtBand() { var S = SR.series(); for (var i = S.length - 1; i >= 0; i--) if (S[i].m >= PL_CEIL) return S[i]; return null; }
  function drawDecay() {
    var W = 640, H = 280, L = 46, R = 16, T = 16, Bm = 34, Y = logS(0.5, 20, H - Bm, T), n = REC.length, bw = (W - L - R) / n, h = '';
    [0.5, 1, 2, 3, 5, 10, 20].forEach(function (v) { h += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (v === 1 ? C.amber : v === 3 ? C.gold : C.grid) + '"' + (v === 3 ? ' stroke-dasharray="4 4"' : '') + '/>' + txt(L - 6, Y(v) + 3, v + '×', { a: 'end' }); });
    h += txt(L + 4, Y(1) - 4, 'trend', { a: 'start', c: C.amber }) + txt(L + 4, Y(3) - 4, '3× upper band', { a: 'start', c: C.gold });
    REC.forEach(function (r, i) {
      var x = L + i * bw + bw * .22, w = bw * .56, top = Y(r.spikeM);
      h += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + (Y(0.5) - top) + '" fill="' + C.orange + '" opacity=".85" rx="2"/>' + txt(x + w / 2, top - 6, fmtM(r.spikeM) + '×', { c: C.bright, s: 11, w: 600 });
      if (!r.sameSample) {
        var lastBar = i === REC.length - 1;
        h += '<circle cx="' + (x + w / 2) + '" cy="' + Y(r.highM) + '" r="5" fill="' + C.bg + '" stroke="' + C.bright + '" stroke-width="1.5"/>' +
          txt(lastBar ? x - 6 : x + w + 4, Y(r.highM) + (lastBar ? 16 : 3), 'high ' + r.highM.toFixed(2) + '×', { a: lastBar ? 'end' : 'start', c: C.text });
      }
      h += txt(x + w / 2, H - 14, r.y, { c: C.dim, s: 11 });
    });
    $('spDecayChart').innerHTML = h;
    var lb = lastAtBand();
    $('spDecayCap').textContent = lb ? 'The ' + PL_CEIL + '× upper band hasn’t been reached since ' + monthLong(lb.d) + '.' : '';
  }
  function drawGap() {
    var W = 640, H = 220, L = 70, R = 20, T = 14, Bm = 30, rows = REC.filter(function (r) { return r.y !== '2011'; });
    var endY = yearOf(Math.max(LATEST.highD, TODAY_DAYS)) + 1, X = yearX(2013, endY, L, W - R), rh = (H - T - Bm) / rows.length, h = '';
    for (var y = 2013; y <= endY - 1; y++) { var x = X(SR.dayOfIso(y + '-01-01')); h += '<line x1="' + x + '" x2="' + x + '" y1="' + T + '" y2="' + (H - Bm) + '" stroke="' + C.grid + '"/>' + (y % 2 ? '' : txt(x, H - 10, y)); }
    rows.forEach(function (r, i) {
      var yy = T + rh * i + rh / 2, x1 = X(r.spikeD), x2 = X(r.highD), mo = Math.round((r.highD - r.spikeD) / MONTH_D);
      h += txt(L - 10, yy + 4, r.y, { a: 'end', c: C.dim, s: 11 });
      if (mo > 0) h += '<line x1="' + x1 + '" x2="' + x2 + '" y1="' + yy + '" y2="' + yy + '" stroke="' + C.muted + '" stroke-width="2"/>' + txt((x1 + x2) / 2, yy - 9, mo + ' months apart', { c: C.text });
      h += '<circle cx="' + x1 + '" cy="' + yy + '" r="6" fill="' + C.orange + '"/>';
      if (mo > 0) h += '<circle cx="' + x2 + '" cy="' + yy + '" r="6" fill="' + C.bg + '" stroke="' + C.bright + '" stroke-width="1.5"/>' + txt(x2 + 10, yy + 4, r.highM.toFixed(2) + '×', { a: 'start', c: C.text });
      h += txt(x1 - 10, yy + 4, fmtM(r.spikeM) + '×', { a: 'end', c: C.orange });
      if (!mo) h += txt(x1 + 10, yy + 4, 'spike and high together', { a: 'start', c: C.text });
    });
    $('spGapChart').innerHTML = h;
    var s = LATE.map(function (r) {
      var mo = Math.round((r.highD - r.spikeD) / MONTH_D);
      return (r.open ? 'In this cycle' : 'In ' + r.y) + ' the spike came in ' + (r.open ? monthLong(r.spikeD) : monthOnly(r.spikeD)) + '; the price high came ' + mo + ' months later, at ' + r.highM.toFixed(2) + '× trend.';
    }).join(' ');
    $('spGapTxt').textContent = 'Through 2017, bitcoin’s biggest move above trend and its highest price arrived together. In the last ' + words(LATE.length) + ' cycles they didn’t. ' + s + ' A rule that trims at a spike will sell before the high. A rule waiting for an obvious high may not get one.';
  }
  function drawTable() {
    function mo(v) { return v == null ? '—' : Math.round(v / MONTH_D) + ' mo'; }
    var h = '<thead><tr><th scope="col">Cycle</th><th scope="col">Spike</th><th scope="col">× trend</th><th scope="col">Price high</th><th scope="col">× trend at high</th><th scope="col">Above 1.5×</th><th scope="col">Above 2×</th><th scope="col">90-day run-up</th><th scope="col">Back at trend</th><th scope="col">Cycle low</th><th scope="col">Peak buyer even</th></tr></thead><tbody>';
    REC.forEach(function (r) {
      var bt = r.backTrend ? (Math.round(r.backTrend.mo) ? Math.round(r.backTrend.mo) + ' mo, −' + Math.round(r.backTrend.fall) + '%' : 'within a month, −' + Math.round(r.backTrend.fall) + '%') : 'not yet';
      h += '<tr><td>' + r.y + '</td><td>' + monthYear(r.spikeD) + '</td><td>' + fmtM(r.spikeM) + '×</td><td>' + monthYear(r.highD) + ' · ' + money(r.highP) + '</td><td>' + fmtM(r.highM) + '×</td><td>' + mo(r.d15) + '</td><td>' + mo(r.d2) + '</td><td>+' +
        Math.round(r.runupHigh).toLocaleString('en-US') + '%</td><td>' + bt + '</td><td>' + (r.low ? '−' + Math.round(r.low.fall) + '%' : '—') + '</td><td>' + (r.be ? r.be.yrs.toFixed(1) + ' yrs' : 'not yet') + '</td></tr>';
    });
    $('spRecTable').innerHTML = h + '</tbody>';
  }
  function drawRunup() {
    var D = [];
    REC.forEach(function (r) {
      D.push({ d: r.spikeD, l: monthYear(r.spikeD), v: r.runupSpike, k: r.sameSample ? 'top' : 'spike' });
      if (!r.sameSample) D.push({ d: r.highD, l: monthYear(r.highD), v: r.runupHigh, k: 'price high' });
    });
    D.sort(function (a, b) { return a.d - b.d; });
    var W = 640, H = 260, L = 50, R = 16, T = 20, Bm = 40, Y = logS(5, 5000, H - Bm, T), bw = (W - L - R) / D.length, h = '';
    [5, 10, 50, 100, 500, 1000, 5000].forEach(function (v) { h += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + C.grid + '"/>' + txt(L - 6, Y(v) + 3, '+' + v.toLocaleString('en-US') + '%', { a: 'end' }); });
    D.forEach(function (o, i) {
      var x = L + i * bw + bw * .2, w = bw * .6, v = Math.max(5, o.v), par = o.v > SR.PARABOLIC;
      h += '<rect x="' + x + '" y="' + Y(v) + '" width="' + w + '" height="' + (Y(5) - Y(v)) + '" fill="' + (par ? C.orange : C.muted) + '" rx="2"/>' +
        txt(x + w / 2, Y(v) - 6, '+' + Math.round(o.v).toLocaleString('en-US') + '%', { c: C.bright, w: 600 }) + txt(x + w / 2, H - 22, o.l, { c: C.dim }) +
        (par ? '' : txt(x + w / 2, H - 9, o.k, { c: C.muted, s: 9 }));
    });
    $('spRunupChart').innerHTML = h;
  }
  function drawRecovery() {
    var btc = REC.filter(function (r) { return r.be; }).map(function (r) { return { l: 'Bitcoin ' + r.y, v: r.be.yrs, b: 1 }; });
    var ext = SNAP ? SNAP.recovery.map(function (o) { return { l: o.label, v: o.years, b: 0 }; }) : [];
    var D = btc.concat(ext);
    $('spBeList').textContent = listAnd(btc.map(function (o) { return o.v.toFixed(1); }));
    var W = 640, H = 330, L = 150, R = 50, T = 8, Bm = 24, X = function (v) { return L + v / 50 * (W - L - R); }, rh = (H - T - Bm) / D.length, h = '';
    [0, 10, 20, 30, 40, 50].forEach(function (v) { h += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="' + T + '" y2="' + (H - Bm) + '" stroke="' + C.grid + '"/>' + txt(X(v), H - 8, v + ' yrs'); });
    D.forEach(function (o, i) {
      var y = T + i * rh + rh * .18, hh = rh * .64;
      h += txt(L - 10, y + hh / 2 + 4, o.l, { a: 'end', c: o.b ? C.text : C.dim, s: 11 }) + '<rect x="' + L + '" y="' + y + '" width="' + (X(o.v) - L) + '" height="' + hh + '" fill="' + (o.b ? C.orange : C.muted) + '" rx="2"/>' + txt(X(o.v) + 6, y + hh / 2 + 4, o.v.toFixed(1), { a: 'start', c: C.bright, w: 600 });
    });
    $('spRecovChart').innerHTML = h;
  }
  function drawGrowth() {
    var W = 640, H = 240, L = 54, R = 16, T = 14, Bm = 28, X = yearX(2011, 2036, L, W - R), Y = logS(10, 1000, H - Bm, T), h = '';
    [10, 20, 50, 100, 200, 500, 1000].forEach(function (v) { h += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + C.grid + '"/>' + txt(L - 6, Y(v) + 3, v + '%', { a: 'end' }); });
    for (var y = 2011; y <= 2035; y += 4) h += txt(X(SR.dayOfIso(y + '-01-01')), H - 8, y);
    function dOf(yf) { return SR.dayOfIso(Math.floor(yf) + '-01-01') + (yf % 1) * 365.25; }
    var pts = []; for (var yf = 2011; yf <= 2035.01; yf += .25) { var d = dOf(yf); pts.push([X(d), Y(trendGrowth(d))]); }
    var xt = X(TODAY_DAYS);
    function path(a) { return a.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(''); }
    h += '<path d="' + path(pts.filter(function (p) { return p[0] <= xt; })) + '" fill="none" stroke="' + C.orange + '" stroke-width="2"/>';
    h += '<path d="' + path(pts.filter(function (p) { return p[0] >= xt; })) + '" fill="none" stroke="' + C.orange + '" stroke-width="2" stroke-dasharray="5 5" opacity=".7"/>';
    h += '<line x1="' + xt + '" x2="' + xt + '" y1="' + T + '" y2="' + (H - Bm) + '" stroke="' + C.muted + '" stroke-dasharray="3 3"/>';
    [[dOf(2013.5), '2013'], [TODAY_DAYS, 'today'], [dOf(2030.5), '2030']].forEach(function (a) { var g = trendGrowth(a[0]); h += '<circle cx="' + X(a[0]) + '" cy="' + Y(g) + '" r="4" fill="' + C.bright + '"/>' + txt(X(a[0]) + 6, Y(g) - 8, a[1] + ': +' + Math.round(g) + '%/yr', { a: 'start', c: C.bright }); });
    $('spGrowthChart').innerHTML = h;
  }
  function renderShrink() {
    var g13 = trendGrowth(SR.dayOfIso('2013-07-01')), gNow = trendGrowth(TODAY_DAYS);
    var x = R13.low ? R13.highP / R13.low.p : null, never = spot / R13.highP;
    $('spShrinkTxt').textContent = 'In 2013 bitcoin’s trend was rising about ' + (Math.round(g13 / 10) * 10) + '% a year; today it rises about ' + Math.round(gNow) + '%. That changes the arithmetic of selling into a spike. ' +
      (x ? 'Trimming at the ' + monthLong(R13.highD) + ' high and buying back at the ' + yearOf(R13.low.d) + ' low gave ' + x.toFixed(1) + '× the coins. ' : '') +
      'Never buying back missed a ' + Math.round(never) + '× rise. Smaller spikes mean less to gain from selling; a slower trend means less lost by being out.';
  }

  // ═══════════ TAB 3 · WHEN LAWS BREAK ═══════════
  function drawLaws() {
    var W = 640, H = 250, L = 150, R = 16, T = 10, Bm = 26, X = function (v) { return L + (v - 1900) / (2030 - 1900) * (W - L - R); };
    var D = [['Wright’s law (costs)', 1936, 2026, null, 'holding'], ['Moore’s law (chips)', 1965, 2010, 2026, 'bent'], ['Population (von Foerster)', 1900, 1962, 2026, 'broke'], ['Bitcoin power law', 2010, 2026, null, 'holding']];
    var rh = (H - T - Bm) / D.length, h = '';
    for (var y = 1900; y <= 2030; y += 20) h += '<line x1="' + X(y) + '" x2="' + X(y) + '" y1="' + T + '" y2="' + (H - Bm) + '" stroke="' + C.grid + '"/>' + txt(X(y), H - 8, y);
    var dd = X(2026.87); h += '<line x1="' + dd + '" x2="' + dd + '" y1="' + T + '" y2="' + (H - Bm) + '" stroke="' + C.floor + '" stroke-dasharray="3 3"/>';
    D.forEach(function (a, i) {
      var yy = T + i * rh + rh * .3, hh = rh * .4, hold = a[4] === 'holding';
      h += txt(L - 10, yy + hh / 2 + 4, a[0], { a: 'end', c: C.text, s: 11 }) + '<rect x="' + X(a[1]) + '" y="' + yy + '" width="' + (X(a[2]) - X(a[1])) + '" height="' + hh + '" fill="' + (hold ? C.green : C.orange) + '" rx="2"/>';
      if (a[3]) h += '<rect x="' + X(a[2]) + '" y="' + yy + '" width="' + (X(a[3]) - X(a[2])) + '" height="' + hh + '" fill="' + C.muted + '" opacity=".35" rx="2"/>';
      h += txt(X(a[2]) + (hold ? -4 : 4), yy - 3, a[4], { a: hold ? 'end' : 'start', c: hold ? C.green : C.amber });
    });
    h += txt(dd - 4, H - Bm - 6, '13 Nov 2026: von Foerster’s doomsday date', { a: 'end', c: C.hot });
    $('spLawsChart').innerHTML = h;
  }
  var CASES = [
    ['well', 'Moore’s law bent', 'Transistor counts doubled roughly every two years from 1965. From the 2010s the doubling time stretched past three years as chips hit heat and quantum limits. A law tied to the calendar bent when the physics changed.'],
    ['well', 'The doomsday curve', 'In 1960 von Foerster and colleagues fitted world population to a curve that reached infinity on Friday, 13 November 2026. Growth rates peaked in the 1960s and fell as birth rates dropped. The law broke because its cause changed.'],
    ['well', 'Wright’s law, 90 years', 'Costs fall by a steady share each time cumulative production doubles. First measured in aircraft in 1936, it still describes solar panels. Tied to activity, not time, it has outlasted Moore’s law.'],
    ['well', 'Forecasting rocket tanks', 'Engineers predicted when pressure tanks would rupture from the accelerating pattern of acoustic signals before failure. The same mathematics was later applied to market bubbles, with much weaker results.'],
    ['well', 'Weimar shares', 'German share prices rose enormously in paper marks while falling in gold terms through 1923 (Bresciani-Turroni, <em>The Economics of Inflation</em>, 1937). A rise in a failing currency is the currency failing.'],
    ['well', 'China, 2021', 'China banned bitcoin mining and trading. Hashrate dropped sharply and price fell about half. Miners moved, hashrate recovered within months, and price made a new high the same year. The trend held.'],
    ['well', 'The 2025 silence', 'When the Pi Cycle indicator failed to fire at the October 2025 high, some analysts read it as proof the top was still ahead. Price fell about half over the next nine months.'],
    ['sugg', 'Population after the Black Death', 'Some demographers find world population growth steepened after the 14th-century plagues. The pattern rests on medieval estimates, so we treat it as suggestive.'],
    ['set', 'The “cube law”', 'Claims that network value now grows with the cube of users, replacing Metcalfe’s law. The sources we found contradict each other on dates and evidence.'],
    ['set', 'Tulip mania', 'The story of a crash that ruined the Dutch economy. Archival work by historian Anne Goldgar found the episode smaller and contained.'],
    ['set', 'Bubble models that called bitcoin tops', 'Several papers show models pinpointing bitcoin’s 2017 and 2021 peaks. Every one we found was reconstructed after the fact. None was published before the top.'],
    ['set', '“90 to 95% of spikes revert”', 'A figure that appeared in our research with no source behind it.']
  ];
  function renderCases() {
    var B = { well: 'Well documented', sugg: 'Suggestive', set: 'Examined and set aside' };
    $('spCases').innerHTML = CASES.map(function (c) {
      return '<details class="sp-case' + (c[0] === 'set' ? ' is-set' : '') + '"><summary><span class="sp-badge ' + c[0] + '">' + B[c[0]] + '</span><span class="sp-case-t">' + c[1] + '</span></summary><p>' + c[2] + '</p></details>';
    }).join('');
  }

  // ═══════════ TAB 4 · UNITS ═══════════
  function drawUnits() {
    if (!SNAP) return;
    var U = SNAP.unitRefits, W = 640, H = 280, L = 46, R = 16, T = 14, Bm = 28, X = yearX(2011, 2027, L, W - R), Y = logS(0.1, 20, H - Bm, T), h = '';
    [0.1, 0.2, 0.5, 1, 2, 5, 10, 20].forEach(function (v) { h += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="' + (v === 1 ? C.amber : C.grid) + '"/>' + txt(L - 6, Y(v) + 3, v + '×', { a: 'end' }); });
    for (var y = 2011; y <= 2027; y += 2) h += txt(X(SR.dayOfIso(y + '-01-01')), H - 8, y);
    var S3 = [['usd', 'Dollars', C.text], ['real', 'Real dollars', C.real], ['gold', 'Gold ounces', C.gold]];
    S3.forEach(function (s) { h += '<path d="' + U.d.map(function (d, i) { return (i ? 'L' : 'M') + X(d).toFixed(1) + ' ' + Y(Math.max(.1, U[s[0]].res[i])).toFixed(1); }).join('') + '" fill="none" stroke="' + s[2] + '" stroke-width="1.4" opacity=".9"/>'; });
    S3.forEach(function (s, i) { h += '<rect x="' + (W - R - 150) + '" y="' + (T + 4 + i * 16) + '" width="10" height="3" fill="' + s[2] + '"/>' + txt(W - R - 135, T + 9 + i * 16, s[1], { a: 'start', c: s[2] }); });
    $('spUnitsChart').innerHTML = h;
    function lastRes(k) { var r = U[k].res; return r[r.length - 1]; }
    $('spUnitStats').innerHTML = S3.map(function (s) { return '<div class="sp-ustat"><div class="sp-ul" style="color:' + s[2] + '">' + s[1] + '</div><div class="sp-uv">' + U[s[0]].b.toFixed(2) + '</div><div class="sp-us">exponent · R² ' + U[s[0]].r2.toFixed(2) + ' · latest ' + lastRes(s[0]).toFixed(2) + '×</div></div>'; }).join('');
    $('spGoldNow').textContent = lastRes('gold').toFixed(2); $('spUsdNow').textContent = lastRes('usd').toFixed(2);
    $('spUnitsAsOf').textContent = SNAP.asOf;
  }

  // ═══════════ QA ═══════════
  function spikesQA() {
    var q = SR.spikesQA();
    q.cardB = { at2x: cardB(2, 'ira', 0), at15x: cardB(1.5, 'ira', 0) };
    ['at2x', 'at15x'].forEach(function (k) { var c = q.cardB[k]; if (c) delete c.m; });
    if (!SNAP) { q.pass = false; q.failures.push('static snapshots (#spSnapshots) did not parse'); }
    else {
      var U = SNAP.unitRefits, want = { usd: [5.51, 0.954], real: [5.32, 0.95], gold: [5.19, 0.938] };
      Object.keys(want).forEach(function (k) {
        if (!U[k] || U[k].b !== want[k][0] || U[k].r2 !== want[k][1]) { q.pass = false; q.failures.push('unit refit ' + k + ' is not ' + want[k].join(' / ')); }
        if (!U[k] || U[k].res.length !== U.d.length) { q.pass = false; q.failures.push('unit refit ' + k + ' residuals do not match the dates'); }
      });
      var yrs = SNAP.recovery.map(function (o) { return o.years; }).join(',');
      if (yrs !== '15.1,17.9,26.3,45.1,34.1') { q.pass = false; q.failures.push('recovery snapshot ' + yrs + ' ≠ 15.1,17.9,26.3,45.1,34.1'); }
    }
    return q;
  }
  window.spikesQA = spikesQA;
  window.spikesCardB = cardB;

  // ═══════════ INIT ═══════════
  function renderAll() { renderReadout(); renderShrink(); }
  function init() {
    readColors();
    wireTabs();
    renderFacts(); renderAll();
    seg('spFWhen', function (v) { fWhen = v; updA(); });
    $('spFMonths').addEventListener('input', updA); $('spFAmt').addEventListener('input', updA);
    seg('spBTrig', function (v) { bTrig = +v; updB(); });
    seg('spBAcct', function (v) { bAcct = v; $('spBRateWrap').hidden = v !== 'tax'; updB(); });
    $('spBShare').addEventListener('input', updB); $('spBRate').addEventListener('input', updB);
    seg('spCTrig', function (v) { cTrig = +v; updC(); });
    seg('spCRebuy', function (v) { cRebuy = v; updC(); });
    seg('spCAcct', function (v) { cAcct = v; updC(); });
    seg('spHAcct', function (v) { hAcct = v; updH(); });
    $('spHRate').addEventListener('input', updH); $('spHBasis').addEventListener('input', updH); $('spHState').addEventListener('change', updH);
    $('spHState').value = 'NONE';
    document.querySelectorAll('.sp-intent').forEach(function (b) { b.addEventListener('click', function () { selectIntent(b, true); }); });
    document.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { var t = $(b.getAttribute('data-go')); selectIntent(t, true); t.focus(); }); });
    document.querySelectorAll('[data-handoff]').forEach(function (a) {
      a.addEventListener('click', function () { track('spikes_handoff', { intent: intent, destination: a.getAttribute('data-handoff'), position: intent === 'trim' ? bTrig : +multNow().toFixed(2) }); });
    });
    wireTip();
    updA(); updB(); updC(); updH();
    drawDecay(); drawGap(); drawTable(); drawRunup(); drawRecovery(); drawGrowth(); drawLaws(); renderCases(); drawUnits();

    var qa = spikesQA();
    if (qa.pass) console.log('[spikes-qa] pass — record verified at ' + qa.anchor + ', ' + qa.record.length + ' cycles, time above trend ' + qa.live.pctAbove + '% (live).');
    else console.error('[spikes-qa] FAIL', qa.failures);

    if (typeof fetchTodayPrice === 'function') {
      try {
        fetchTodayPrice(function (price, source) {
          if (isFinite(price) && price > 0) { spot = price; spotSource = source; }
          renderAll();
        });
      } catch (e) { /* offline or blocked: the seeded read stands */ }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
