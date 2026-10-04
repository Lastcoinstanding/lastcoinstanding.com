/* shared/spike-record.js — every bitcoin spike above trend, measured.

   Built 2026-10-04 for /bitcoin-spikes. Pure: no DOM, no page state. Loads
   after power-law-data.js (reads PL_DATA, plPrice, GENESIS_TS, PL_FLOOR,
   PL_CEIL) and exposes window.SpikeRecord.

   WHAT IT OWNS. The decision, not the wording (NEW_PAGE_CHECKLIST, "the
   module owns the decision, the page owns the wording"): the cycle windows,
   the per-cycle record, time above trend, and the two trade engines the
   page's cards read (a one-time trim and a one-time sale to fund a bill).
   A page that reuses any of it supplies its own copy.

   THE MEASUREMENT SET is the modern one, 2011 onward, exactly as on The
   Bitcoin Floor (MODERN_FROM). The 2010 genesis samples never reach the
   record; spikesQA() asserts that.

   CYCLE WINDOWS. Each cycle is a fixed calendar window, wide enough to hold
   its run-up, its spike, its high and its low. The spike is the sample
   furthest above trend inside the window; the price high is the highest
   price inside it. They were the same sample through 2017 and have not been
   since. Windows end mid-year between cycles; 2021's and 2024–25's overlap
   by one month (June 2023), which holds no candidate spike, high or low.

   DURATIONS are measured in elapsed time between ~12-day samples, never by
   counting samples (power-law-data.js, CADENCE), so every duration here is
   accurate to about one sample interval.

   QA. spikesQA() pins the record to the 2026-09-30 sample by truncating the
   series there, so later monthly appends cannot move the fixture; the live
   record (to the newest sample) is what the page renders. */
(function () {
  'use strict';
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  var MODERN_FROM = '2011-01-01';
  var MONTH_D = 30.44, YEAR_D = 365.25;
  var RUNUP_D = 90;                 // run-up window into a spike or high
  var PARABOLIC = 200;              // % in 90 days that marks a parabolic run-up

  function dayOfIso(s) { return (Date.parse(s + 'T00:00:00Z') / 1000 - GENESIS_TS) / 86400; }
  function isoOf(d) { return new Date((GENESIS_TS + d * 86400) * 1000).toISOString().slice(0, 10); }
  function monthYear(d) { return new Date((GENESIS_TS + d * 86400) * 1000).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }

  var MODERN_D = dayOfIso(MODERN_FROM);
  var ALL = PL_DATA.map(function (r) { return { d: r[0], p: r[1], m: r[1] / plPrice(r[0]) }; });
  var LAST = ALL[ALL.length - 1];

  // The cycle list. `y` is the label the page prints.
  var CYCLES = [
    { y: '2011',    from: '2011-01-01', to: '2012-05-31' },
    { y: '2013',    from: '2012-06-01', to: '2015-12-31' },
    { y: '2017',    from: '2016-06-01', to: '2019-12-31' },
    { y: '2021',    from: '2020-06-01', to: '2023-06-30' },
    { y: '2024–25', from: '2023-06-01', to: '2026-12-31' }
  ].map(function (c) { return { y: c.y, from: c.from, to: c.to, a: dayOfIso(c.from), b: dayOfIso(c.to) }; });

  // Samples on the modern set, optionally cut at a day (the QA pin).
  function series(asOf) {
    var cut = asOf == null ? LAST.d : asOf;
    return ALL.filter(function (s) { return s.d >= MODERN_D && s.d <= cut; });
  }

  // Linear price interpolation between samples (the whole series, so a 90-day
  // look-back from early 2011 still has a price).
  function priceAt(day) {
    if (day <= ALL[0].d) return ALL[0].p;
    for (var i = 1; i < ALL.length; i++) {
      if (ALL[i].d >= day) { var a = ALL[i - 1], b = ALL[i], t = (day - a.d) / (b.d - a.d); return a.p + (b.p - a.p) * t; }
    }
    return LAST.p;
  }

  // Unbroken stretch around sample index k with m >= thr, in elapsed days from
  // the first sample in the run to the first sample after it. null when the
  // sample itself is below thr.
  function runDays(S, k, thr) {
    if (S[k].m < thr) return null;
    var i = k, j = k;
    while (i > 0 && S[i - 1].m >= thr) i--;
    while (j < S.length - 1 && S[j + 1].m >= thr) j++;
    var end = j < S.length - 1 ? S[j + 1].d : S[j].d;
    return end - S[i].d;
  }

  function runup(day, p) { return (p / priceAt(day - RUNUP_D) - 1) * 100; }

  // ── The record ──
  function record(asOf) {
    var S = series(asOf);
    var out = [];
    CYCLES.forEach(function (c) {
      var idx = [];
      S.forEach(function (s, i) { if (s.d >= c.a && s.d <= c.b) idx.push(i); });
      if (!idx.length) return;
      var ks = idx[0], kh = idx[0];
      idx.forEach(function (i) { if (S[i].m > S[ks].m) ks = i; if (S[i].p > S[kh].p) kh = i; });
      var sp = S[ks], hi = S[kh];
      var back = null, low = null, be = null, i;
      for (i = kh + 1; i < S.length; i++) {
        if (S[i].m < 1) { back = { d: S[i].d, p: S[i].p, mo: (S[i].d - hi.d) / MONTH_D, fall: (1 - S[i].p / hi.p) * 100 }; break; }
      }
      for (i = kh + 1; i < S.length && S[i].d <= c.b; i++) { if (!low || S[i].p < low.p) low = { d: S[i].d, p: S[i].p }; }
      for (i = kh + 1; i < S.length; i++) { if (S[i].p >= hi.p) { be = { d: S[i].d, yrs: (S[i].d - hi.d) / YEAR_D }; break; } }
      out.push({
        y: c.y, cycle: c,
        spikeD: sp.d, spikeM: sp.m, spikeP: sp.p,
        highD: hi.d, highM: hi.m, highP: hi.p,
        sameSample: ks === kh,
        d15: runDays(S, ks, 1.5), d2: runDays(S, ks, 2),
        runupHigh: runup(hi.d, hi.p), runupSpike: runup(sp.d, sp.p),
        backTrend: back,
        low: low ? { d: low.d, p: low.p, fall: (1 - low.p / hi.p) * 100 } : null,
        be: be,
        open: c.b > S[S.length - 1].d
      });
    });
    return out;
  }

  // Share of elapsed time spent at or above trend, modern set.
  function pctAbove(asOf) {
    var S = series(asOf), a = 0, b = 0;
    for (var i = 0; i < S.length - 1; i++) { var sp = S[i + 1].d - S[i].d; if (S[i].m >= 1) a += sp; else b += sp; }
    return 100 * a / (a + b);
  }

  // Last sample at or above trend (for "last above trend" in the readout).
  function lastAbove(asOf) {
    var S = series(asOf);
    for (var i = S.length - 1; i >= 0; i--) if (S[i].m >= 1) return S[i];
    return null;
  }

  // ── Trim and buy back: the FIRST sample in the cycle window at or above
  // `trig`× trend sells; the rebuy is the first later sample at or below
  // trend ('trend') or 80% below the running high ('ath80'). ratio = coins
  // after the round trip per coin sold, before tax.
  function roundTrip(c, trig, rebuy, asOf) {
    var S = series(asOf);
    var sell = null, i;
    for (i = 0; i < S.length; i++) if (S[i].d >= c.a && S[i].d <= c.b && S[i].m >= trig) { sell = S[i]; break; }
    if (!sell) return { fired: false };
    var run = sell.p, rb = null;
    for (i = 0; i < S.length; i++) {
      var s = S[i]; if (s.d <= sell.d) continue;
      run = Math.max(run, s.p);
      if (rebuy === 'ath80' ? s.p <= 0.2 * run : s.m <= 1) { rb = s; break; }
    }
    return { fired: true, sell: sell, rb: rb, ratio: rb ? sell.p / rb.p : null };
  }

  // ── Fund a bill: when in the cycle to sell. 'up' = first sample at or above
  // 2× trend; 'down' = first sample back below 2× after the spike; 'peak' =
  // the spike itself (hindsight). null when price never reached 2×.
  function fundSale(c, when, asOf) {
    var S = series(asOf).filter(function (s) { return s.d >= c.a && s.d <= c.b; });
    if (!S.length) return null;
    var mx = S.reduce(function (a, s) { return s.m > a.m ? s : a; });
    if (when === 'peak') return mx;
    if (mx.m < 2) return null;
    var i;
    if (when === 'up') { for (i = 0; i < S.length; i++) if (S[i].m >= 2) return S[i]; return null; }
    for (i = 0; i < S.length; i++) if (S[i].d > mx.d && S[i].m < 2) return S[i];
    return null;
  }
  // Coins used selling at the sale point, as a share of the coins selling when
  // the bill arrives `months` later would have taken. pending when that date
  // is still ahead of the series.
  function fundResults(when, months, asOf) {
    var lastD = series(asOf).slice(-1)[0].d;
    return CYCLES.slice(1).map(function (c) {
      var s = fundSale(c, when, asOf);
      if (!s) return { c: c, never: true };
      var need = s.d + months * MONTH_D;
      if (need > lastD) return { c: c, pending: true, s: s };
      var q = priceAt(need);
      return { c: c, s: s, q: q, r: q / s.p };
    });
  }

  // The trim/rule cycles are the four from 2013 on: 2011's window opens on the
  // modern boundary already above 2× trend, so a "first crossing" there would
  // be an artefact of where the set starts.
  var TRADE_CYCLES = CYCLES.slice(1);

  // ═══ QA fixture — the mockup's REC at the 2026-09-30 sample (design doc §10) ═══
  var ANCHOR = '2026-09-30';
  var FIXTURE = {
    pctAbove: 43,
    rec: [
      { y: '2011',    spikeM: 14.01, spikeP: 24,     highM: 14.01, highP: 24,     d15: 156, d2: 132, runup: 2734, back: { mo: 4,  fall: 86 }, low: 89, be: 1.7 },
      { y: '2013',    spikeM: 11.99, spikeP: 1134,   highM: 11.99, highP: 1134,   d15: 432, d2: 336, runup: 882,  back: { mo: 13, fall: 76 }, low: 80, be: 3.3 },
      { y: '2017',    spikeM: 5.41,  spikeP: 16408,  highM: 5.41,  highP: 16408,  d15: 264, d2: 168, runup: 314,  back: { mo: 11, fall: 77 }, low: 79, be: 2.9 },
      { y: '2021',    spikeM: 3.19,  spikeP: 56001,  highM: 2.64,  highP: 64839,  d15: 384, d2: 108, runup: 42,   back: { mo: 6,  fall: 53 }, low: 74, be: 2.3 },
      { y: '2024–25', spikeM: 1.19,  spikeP: 101468, highM: 1.07,  highP: 121684, d15: null, d2: null, runup: 7,  back: { mo: 0,  fall: 11 }, low: 49, be: null }
    ]
  };

  function spikesQA() {
    var failures = [];
    var anchor = null;
    for (var i = 0; i < ALL.length; i++) if (isoOf(ALL[i].d) === ANCHOR) anchor = ALL[i];
    if (!anchor) failures.push('fixture anchor ' + ANCHOR + ' is no longer in PL_DATA');
    var asOf = anchor ? anchor.d : dayOfIso(ANCHOR);
    var R = record(asOf);
    function near(label, got, want, tol) {
      if (want == null) { if (got != null) failures.push(label + ' ' + got + ' ≠ none'); return; }
      if (got == null || !(Math.abs(got - want) <= tol)) failures.push(label + ' ' + (got == null ? 'none' : +got.toFixed(3)) + ' vs ' + want + ' (±' + tol + ')');
    }
    if (R.length !== FIXTURE.rec.length) failures.push('cycle count ' + R.length + ' ≠ ' + FIXTURE.rec.length);
    FIXTURE.rec.forEach(function (f, k) {
      var r = R[k]; if (!r) return;
      var L = f.y + ' ';
      if (r.y !== f.y) failures.push('cycle ' + k + ' label ' + r.y + ' ≠ ' + f.y);
      near(L + 'spike ×trend', r.spikeM, f.spikeM, 0.01);
      near(L + 'spike price', r.spikeP, f.spikeP, 1);
      near(L + 'high ×trend', r.highM, f.highM, 0.01);
      near(L + 'high price', r.highP, f.highP, 1);
      near(L + 'days ≥1.5×', r.d15, f.d15, 0.5);
      near(L + 'days ≥2×', r.d2, f.d2, 0.5);
      near(L + '90-day run-up %', r.runupHigh, f.runup, 1);
      near(L + 'months to trend', r.backTrend ? Math.round(r.backTrend.mo) : null, f.back.mo, 0);
      near(L + 'fall at trend %', r.backTrend ? r.backTrend.fall : null, f.back.fall, 0.5);
      near(L + 'cycle low %', r.low ? r.low.fall : null, f.low, 0.5);
      near(L + 'years to even', r.be ? r.be.yrs : null, f.be, 0.05);
    });
    near('time above trend %', pctAbove(asOf), FIXTURE.pctAbove, 0.5);
    // Leak check: no pre-2011 sample may reach the measurement set.
    var leaked = series(asOf).filter(function (s) { return isoOf(s.d) < MODERN_FROM; });
    if (leaked.length) failures.push(leaked.length + ' pre-' + MODERN_FROM.slice(0, 4) + ' samples leaked into the record');
    return { pass: failures.length === 0, failures: failures, anchor: ANCHOR, record: R, live: { pctAbove: +pctAbove().toFixed(1), record: record() } };
  }

  window.SpikeRecord = {
    MODERN_FROM: MODERN_FROM, MONTH_D: MONTH_D, YEAR_D: YEAR_D, RUNUP_D: RUNUP_D, PARABOLIC: PARABOLIC,
    CYCLES: CYCLES, TRADE_CYCLES: TRADE_CYCLES, ANCHOR: ANCHOR, FIXTURE: FIXTURE,
    dayOfIso: dayOfIso, isoOf: isoOf, monthYear: monthYear,
    series: series, priceAt: priceAt, record: record, pctAbove: pctAbove, lastAbove: lastAbove,
    roundTrip: roundTrip, fundSale: fundSale, fundResults: fundResults,
    spikesQA: spikesQA
  };
})();
