/* shared/rule-engine.js — a standing sell-and-buy-back rule, run on the record.

   Built 2026-10-04 for Disciplined Rebalancing v2, Stage A
   (DISCIPLINED_REBALANCING_V2_SPEC_2026-10-04, project side). A port of the
   approved mockup's run(); its semantics are the spec. Pure: no DOM. Loads
   after power-law-data.js (PL_DATA, plPrice, GENESIS_TS) and exposes
   window.RuleEngine.

   THE RULE  { timing: 'up'|'fade', sx, sz, f, rx, cap }
     up    sells when price crosses UP through sx× trend (prev < sx, now >= sx).
     fade  arms when price is at or above sx×, then sells when it falls back
           below sz× (armed, prev >= sz, now < sz). sz <= sx.
     f     % of the coins held at that moment.
     rx    buys back when price crosses DOWN through rx× (prev > rx, now <= rx),
     cap   else at market cap × 30.44 days after the sale (0 = never).
   One open sale at a time; the buy back spends all the cash.

   THE OPTIONS  { start: 'YYYY-MM', acct: 'ira'|'tax', fed, niit, state,
                  lots: 'fifo'|'hifo', yield, asOf? }
     The record starts at the first sample of the start month; that sample's
     price is the basis of the only lot. Lots are sold oldest first (FIFO) or
     highest cost first. A lot held under 365 days is taxed at the short-term
     rate (32% + NIIT + state), otherwise long-term (fed + NIIT + state). Tax
     is max(0, net gain across the lots sold) and only in a taxable account.
     Cash earns `yield` % a year, compounded over each sample interval. The
     end figure values any cash at the last sample's price. asOf (a day
     number) truncates the series there: drQA() pins the fixture with it.

   SAMPLING. PL_DATA's ~12-day grid is the record: a trigger fires on the
   first sample past its level, so a 1.5× "up" rule sold 2011 at 2.94×.

   PERCENTILES. One function family on the since-2011 set (the ChannelEntries
   modern-set convention), share of samples. It serves the context lines and
   the legacy ?sell= / ?rebuy= mapping. Percentiles drift as data arrives;
   the rule itself runs on ×trend levels, which don't.

   Not used by Bitcoin's Spikes card C in Stage A: card C answers each cycle
   on its own (fresh coins per cycle, at-or-above levels), where this engine
   runs one continuous record with crossing triggers. TECH_DEBT tracks the
   Stage B decision. */
(function () {
  'use strict';
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  var DAY_MS = 864e5, G = GENESIS_TS * 1000;
  var MONTH_D = 30.44, ST_RATE = 32;
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function ym(d) { var t = new Date(G + d * DAY_MS); return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0'); }
  function monthYear(d) { var t = new Date(G + d * DAY_MS); return MON[t.getUTCMonth()] + ' ' + t.getUTCFullYear(); }
  function isoOf(d) { return new Date(G + d * DAY_MS).toISOString().slice(0, 10); }
  function dayOfIso(s) { return (Date.parse(s + 'T00:00:00Z') - G) / DAY_MS; }

  var ALL = PL_DATA.map(function (r) { return { d: r[0], p: r[1], r: r[1] / plPrice(r[0]), ym: ym(r[0]) }; });

  // Cycle windows for the per-cycle table. Each sale is assigned to the cycle
  // whose window holds its date; the buy back is the event after it.
  var CYC = [['2011', '2010-01', '2012-06'], ['2013', '2012-07', '2015-12'], ['2017', '2016-01', '2019-12'], ['2021', '2020-01', '2023-12'], ['2024–25', '2024-01', '2099-12']];
  function cycOf(s) { for (var i = 0; i < CYC.length; i++) if (s >= CYC[i][1] && s <= CYC[i][2]) return i; return -1; }

  function rowsFrom(start, asOf) {
    return ALL.filter(function (x) { return x.ym >= start && (asOf == null || x.d <= asOf); });
  }

  // Sell `amt` coins out of `lots` at price p on day d. Mutates lots (sorted
  // and drawn down); returns the taxable gain, weighted per lot by its rate.
  function sellLots(lots, amt, p, d, mode, lt, sh) {
    if (mode === 'hifo') lots.sort(function (a, b) { return b.c - a.c; }); else lots.sort(function (a, b) { return a.d - b.d; });
    var left = amt, gain = 0;
    for (var k = 0; k < lots.length && left > 1e-12; k++) {
      var use = Math.min(lots[k].b, left), g = (p - lots[k].c) * use;
      gain += g * ((d - lots[k].d) >= 365 ? lt : sh);
      lots[k].b -= use; left -= use;
    }
    return gain;
  }

  // EPS (Stage B): a level is "reached" within 1e-9, so a replayed spike
  // resized to exactly the sell level still fires it. No recorded sample sits
  // that close to a slider level, so the record's results don't move.
  // O.fast skips the per-sample series and the per-cycle table: the replays
  // and the sell-level curve only need the end figure and the events.
  var EPS = 1e-9;
  function runRows(rows, R, O) {
    var last = rows[rows.length - 1];
    var lots = [{ b: 1, c: rows[0].p, d: rows[0].d }], cash = 0, st = 'hold', armed = false, prev = null, ts = null, ev = [], ser = [], lastD = rows[0].d;
    var lt = (O.fed + (O.niit ? 3.8 : 0) + O.state) / 100, sh = (ST_RATE + (O.niit ? 3.8 : 0) + O.state) / 100;
    function btc() { var s = 0; lots.forEach(function (l) { s += l.b; }); return s; }
    for (var i = 0; i < rows.length; i++) {
      var x = rows[i];
      if (cash > 0 && O.yield) cash *= Math.pow(1 + O.yield / 100, (x.d - lastD) / 365);
      lastD = x.d;
      if (prev !== null) {
        if (st === 'hold') {
          var fire = false;
          if (R.timing === 'up') { if (prev < R.sx && x.r >= R.sx - EPS) fire = true; }
          else { if (x.r >= R.sx - EPS) armed = true; if (armed && prev >= R.sz && x.r < R.sz) fire = true; }
          if (fire) {
            var held = btc(), amt = held * R.f / 100;
            var gain = sellLots(lots, amt, x.p, x.d, O.lots, lt, sh);
            lots = lots.filter(function (l) { return l.b > 1e-12; });
            var tax = O.acct === 'tax' ? Math.max(0, gain) : 0;
            cash += amt * x.p - tax; st = 'cash'; ts = x.d; armed = false;
            ev.push({ t: 'sell', d: x.d, p: x.p, r: x.r, amt: amt, tax: tax, before: held });
          }
        } else {
          var why = null;
          if (prev > R.rx && x.r <= R.rx) why = 'level'; else if (R.cap && x.d - ts >= R.cap * MONTH_D) why = 'fallback';
          if (why) { var b = cash / x.p; lots.push({ b: b, c: x.p, d: x.d }); cash = 0; st = 'hold'; ev.push({ t: 'buy', d: x.d, p: x.p, r: x.r, why: why, after: btc() }); }
        }
      }
      if (!O.fast) ser.push({ d: x.d, p: x.p, r: x.r, coins: btc() + cash / x.p, usd: btc() * x.p + cash });
      prev = x.r;
    }
    var endC = btc() + cash / last.p;
    if (O.fast) return { ev: ev, end: endC, inCash: st === 'cash' };
    var cyc = CYC.map(function (c, i) {
      var inWin = rows.filter(function (x) { return x.ym >= c[1] && x.ym <= c[2]; });
      var peak = inWin.reduce(function (m, x) { return Math.max(m, x.r); }, 0);
      return { i: i, name: c[0], peak: peak, covered: inWin.length > 0, sell: null, buy: null };
    });
    for (var j = 0; j < ev.length; j++) {
      if (ev[j].t === 'sell') { var ci = cycOf(ym(ev[j].d)); if (ci >= 0 && !cyc[ci].sell) { cyc[ci].sell = ev[j]; cyc[ci].buy = (ev[j + 1] && ev[j + 1].t === 'buy') ? ev[j + 1] : null; } }
    }
    return { ev: ev, ser: ser, end: endC, inCash: st === 'cash', cyc: cyc, start: rows[0], last: last };
  }

  function run(R, O) { return runRows(rowsFrom(O.start, O.asOf), R, O); }

  // ── Percentiles, since 2011 by default (share of samples) ──
  function setFrom(from, asOf) { return rowsFrom(from || '2011-01', asOf); }
  function pctAtOrAbove(x, from, asOf) { var a = setFrom(from, asOf); return 100 * a.filter(function (r) { return r.r >= x; }).length / a.length; }
  function pctAtOrBelow(x, from, asOf) { var a = setFrom(from, asOf); return 100 * a.filter(function (r) { return r.r <= x; }).length / a.length; }
  // The ×trend level at or below which price has sat P% of the time.
  function ratioAtPercentile(P, from, asOf) {
    var s = setFrom(from, asOf).map(function (r) { return r.r; }).sort(function (a, b) { return a - b; });
    if (P <= 0) return s[0];
    if (P >= 100) return s[s.length - 1];
    var idx = (P / 100) * (s.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx);
    return lo === hi ? s[lo] : s[lo] * (1 - (idx - lo)) + s[hi] * (idx - lo);
  }

  // Trend growth over the 12 months from day d, % (the era note).
  function trendGrowth(d) { return 100 * (plPrice(d + 365.25) / plPrice(d) - 1); }

  // ── Looking ahead (Stage B, 2026-10-06): replays of the record ──
  // Ported from the approved mockup's fpath / BREAK. An explicit series runs
  // through the same runRows as the record; nothing here forks the engine.
  // A series is rows of { d, p, r, ym } with p = r × the trend on day d.
  function seriesOf(pts) { return pts.map(function (q) { return { d: q[0], p: q[1] * plPrice(q[0]), r: q[1], ym: ym(q[0]) }; }); }
  // lowDays: the sample days of the cycle lows (SpikeRecord.cycleLows), so the
  // four complete low-to-low cycles are the segments. asOf: the day the replays
  // start from (the latest sample, or drQA's anchor).
  function replays(lowDays, asOf) {
    var rows = asOf == null ? ALL : ALL.filter(function (x) { return x.d <= asOf; });
    var today = rows[rows.length - 1].d, nowR = rows[rows.length - 1].r, seg = [], i;
    for (i = 0; i + 1 < lowDays.length; i++) {
      var a = lowDays[i], b = lowDays[i + 1];
      var pts = rows.filter(function (x) { return x.d >= a && x.d < b; }).map(function (x) { return [x.d - a, x.r]; });
      seg.push({ len: b - a, pts: pts, max: Math.max.apply(null, pts.map(function (q) { return q[1]; })) });
    }
    var ROT = seg.map(function (_, k) { return seg.map(function (__, j) { return (j + k) % seg.length; }); });
    var cache = {};
    // Resize every spike so its peak equals `peak`: ratio^a, a = ln peak / ln max,
    // applied to ratios above 1. lows 'keep' leaves the rest alone; 'rise'
    // scales the lows with the same exponent.
    function path(order, peak, lows) {
      var t0 = today, out = [];
      order.forEach(function (ci) {
        var s = seg[ci], a = Math.min(1, Math.log(peak) / Math.log(s.max));
        s.pts.forEach(function (q) { var r = (q[1] > 1 || lows === 'rise') ? Math.pow(q[1], a) : q[1]; out.push([t0 + q[0], r]); });
        t0 += s.len;
      });
      return seriesOf(out);
    }
    function series(peak, rot, lows) { var k = peak + '|' + rot + '|' + lows; return cache[k] || (cache[k] = path(ROT[rot], peak, lows)); }
    // Breakaway: from today's ratio up to 2.3× over three years, then
    // exp(ln 2.2 + 0.35 sin(1.4 (y − 3))), 14 years on the 12-day grid.
    var brk = (function () {
      var out = [];
      for (var d = today; d < today + 14 * 365; d += 12) {
        var y = (d - today) / 365, lr = y < 3 ? Math.log(nowR) + (Math.log(2.3) - Math.log(nowR)) * y / 3 : Math.log(2.2) + 0.35 * Math.sin((y - 3) * 1.4);
        out.push([d, Math.exp(lr)]);
      }
      return seriesOf(out);
    })();
    return { today: today, nowR: nowR, segments: seg, rotations: ROT.length, series: series, breakaway: brk };
  }

  window.RuleEngine = {
    run: run, runRows: runRows, sellLots: sellLots, rowsFrom: rowsFrom, seriesOf: seriesOf, replays: replays, EPS: EPS,
    CYC: CYC, MONTH_D: MONTH_D, ST_RATE: ST_RATE,
    pctAtOrAbove: pctAtOrAbove, pctAtOrBelow: pctAtOrBelow, ratioAtPercentile: ratioAtPercentile,
    trendGrowth: trendGrowth, ym: ym, monthYear: monthYear, isoOf: isoOf, dayOfIso: dayOfIso,
    lastDay: ALL[ALL.length - 1].d
  };
})();
