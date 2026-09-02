/* =============================================================
   The Bitcoin Floor — page engine

   Reads ONLY the shared Power Law module (power-law-data.js): PL_A,
   PL_B, PL_FLOOR, PL_CEIL, PL_DATA, plPrice, GENESIS_TS, TODAY_DAYS,
   TODAY_PRICE, fetchTodayPrice, todayPriceNote. Zero new data
   dependencies, per the design doc's engine decision.

   Two classes of number on this page, and they are kept apart:

     · LIVE      — hero distance, floor/trend/spot, tripwire status, and
                   the whole parity instrument. Computed here, at load,
                   from PL_DATA + the live spot. Never remembered.
     · HISTORICAL— the four floor episodes and the quantile fits. Static
                   constants below, copied from the dated analysis note
                   (analysis/2026-08-20-power-law-floor.md). They are
                   facts about a fixed past and do not refresh — but
                   floorParityQA() recomputes the episode boundaries from
                   PL_DATA and asserts they still match, so a future
                   refresh that moved them could not pass silently.
   ============================================================= */
(function () {
  'use strict';

  var YEAR = 365.25;

  // ═══════════════════════════════════════════════════════════
  // STATIC — from analysis/2026-08-20-power-law-floor.md §2
  //
  // ── THE VISIT DEFINITION (unified 2026-09-01, JM ruling 6) ──
  // An approach is an episode in which price came WITHIN 1% OF the 0.42×
  // floor or below it, with a gap of more than about 100 DAYS starting a new
  // one. This page is the canonical home of that definition; The Rundown and
  // Discount, or Premium? echo it rather than each carrying their own.
  //
  // It formalizes this page's own long-standing language. "Approached the
  // line" was always the phenomenon of interest here — the strip labels each
  // episode a graze or a break — and the 1% band is that phrase made numeric.
  // The 100-day gap is the site's existing independent-visit rule, already
  // shared with `shared/reversion-durations.js`.
  //
  // ── THE SENSITIVITY, STATED BECAUSE IT IS ASYMMETRIC ──
  // The 100-day gap is INSENSITIVE: every value from 30 to 200 days yields
  // the same four episodes. The ~1% graze band is LOAD-BEARING at exactly one
  // place — below about 0.9% the open 2026 approach disappears, because its
  // deepest sample sits 0.7% ABOVE the floor and never breached it. Both
  // swept in FLOOR_VISIT_DEFINITION_MINIREPORT.md; the page states this in
  // the method note beside the strip.
  //
  // ── WHAT THE UNIFICATION CHANGED, AND WHAT IT DELIBERATELY DID NOT ──
  // Changed: the two 2015 episodes MERGE (24 days apart, one approach under
  // the 100-day rule); January 2023 gains a December 2022 approach sample and
  // becomes a 12-day episode; a fourth, OPEN episode appears in July 2026.
  // NOT changed: no published figure was recomputed. Every depth and every
  // 24-month outcome below is a number this page already published, carried
  // across unchanged — the merged 2015 card takes its depth AND its outcome
  // from the deeper September half, because the outcome anchors on the
  // episode's deepest close, which is that half's. The only new numbers are
  // structural (dates, sample counts, spans) and are read straight off
  // PL_DATA, not modelled.
  //
  // `belowPct` is depth below the FLOOR (not below trend), and is NEGATIVE
  // for an approach that never breached — the strip and card say "came within
  // X% of the floor" rather than printing a negative depth.
  // `spanDays` is first-to-last qualifying sample; `bracketDays` is the last
  // sample outside the band before to the first after — the outer bound on
  // duration given a ~12-day sampling grid. It is NULL while an episode is
  // still open, because there is no "after" yet.
  // gap24 = share of the gap to trend closed 24 months after the deepest
  // close. NULL on an open episode: no outcome exists, and none is estimated.
  // ═══════════════════════════════════════════════════════════
  // The two constants of the unified visit definition. Named once, used by the
  // live derivation below and quoted in the method note on the page.
  var EPISODE_GRAZE = 1.01;   // within 1% of the floor counts as an approach
  var EPISODE_GAP_D = 100;    // a gap longer than this starts a new episode

  var EPISODES = [
    {
      id: '2010',
      when: 'Aug–Oct 2010',
      from: '2010-08-30', to: '2010-10-17',
      samples: 5, spanDays: 48, bracketDays: 72,
      deepestXt: 0.241, deepestOn: '2010-10-05', belowPct: 42.6,
      xt24: 0.628, gap24: 39, open: false,
      kind: 'break', modern: false,
      kindLabel: 'Genesis era — recorded, not weighted',
      body: 'Price closed <strong>42.6% below the floor</strong> and stayed under for at least 48 days — 72 days measured from the last sample above the line to the first one after.<br><br>This sample sits in bitcoin’s genesis era: no mature exchange, negligible liquidity, a price measured in cents, and a market thin enough for a single participant to move it. It is the same period every careful fit of this model down-weights, for exactly that reason. It is <strong>statistically spurious as evidence about the modern floor; it is recorded here for completeness, not weight.</strong> Nothing else on this page rests on it.<br><br><strong>On the numbers themselves.</strong> The deepest sample here is <strong>0.241× trend</strong>. The shared module’s own header cites a 2010 low near <strong>0.196×</strong>, which cannot be derived from this series and may come from daily data predating the 12-day grid — another reason this era resists clean measurement.'
    },
    {
      id: '2015',
      when: 'Aug–Oct 2015',
      from: '2015-08-28', to: '2015-10-15',
      samples: 4, spanDays: 48, bracketDays: 72,
      deepestXt: 0.398, deepestOn: '2015-09-21', belowPct: 5.1,
      xt24: 1.381, gap24: 163, open: false,
      kind: 'graze', modern: true,
      kindLabel: 'A graze',
      body: 'The deepest modern approach: four samples in the band across seven weeks, the lowest <strong>5.1% below the floor</strong> on 21 September, and still nowhere near the tripwire’s 10%-for-30-days criteria. Price spent about 48 days at or under the line by sample span, 72 bracketed — and the line held throughout.<br><br>Twenty-four months on from that low, price was at <strong>1.38× trend</strong>: the gap to trend closed and overshot.<br><br><strong>On the grouping.</strong> This card was two cards until 2026-09-01 — a single-sample touch in August and a three-sample stretch in September, 24 days apart. Under the site-wide 100-day rule they are one approach, which is the more faithful description of what happened: one visit to the line lasting seven weeks, not two unrelated events three weeks apart. The August low of 1.8% under and its own 24-month reading of 1.75× trend are no longer reported separately; the episode is measured from its deepest close, as every other card here is.'
    },
    {
      id: '2023',
      when: 'Dec 2022 – Jan 2023',
      from: '2022-12-25', to: '2023-01-06',
      samples: 2, spanDays: 12, bracketDays: 36,
      deepestXt: 0.418, deepestOn: '2023-01-06', belowPct: 0.4,
      xt24: 1.175, gap24: 130, open: false,
      kind: 'graze', modern: true,
      kindLabel: 'A graze',
      body: 'The shallowest of the closed approaches: price came to the line on 25 December at <strong>0.424× trend</strong> — inside the band without breaching it — and went <strong>0.4% below the floor</strong> twelve days later, at the bottom of the 2022 bear market. In practical terms price reached the line and stopped.<br><br>Twenty-four months after that low it sat at <strong>1.18× trend</strong>, having closed the gap and moved past it. Until July 2026 this was the most recent approach in the record.'
    },
    {
      id: '2026',
      when: 'July 2026 – open',
      from: '2026-07-13', to: '2026-07-31',
      samples: 2, spanDays: 18, bracketDays: null,
      deepestXt: 0.423, deepestOn: '2026-07-13', belowPct: -0.7,
      xt24: null, gap24: null, open: true,
      kind: 'graze', modern: true,
      kindLabel: 'An approach, still open',
      body: 'The current approach, and the only one on this page with <strong>no outcome</strong>: it is described, not scored. Two samples sit in the band and neither has breached the line — the deeper of them came <strong>within 0.7% of the floor</strong> without going under. The record’s newest sample is one of them, so there is no “after” to measure a duration or a reversion against, and none is estimated here.<br><br>It is also the episode that the visit definition is doing the most work for. Under a rule counting only closes strictly below the floor, this approach would not appear on this page at all; under the 1% band it does. That is stated rather than buried, because it is the one place where a reasonable change to the definition would change what this page reports.'
    }
  ];

  // Quantile regression on log(price) ~ log(days), analysis §1. Each row is
  // an INDEPENDENT fit (slope free); `multAtCanon` is the ×-trend multiple
  // implied when the slope is instead forced to the 5.77 the site uses.
  var QUANTILE_FITS = [
    { tau: 0.02, slope: 5.9552, multAtCanon: 0.4209 },
    { tau: 0.05, slope: 5.8834, multAtCanon: 0.4604 },
    { tau: 0.10, slope: 5.8597, multAtCanon: 0.4971 },
    { tau: 0.25, slope: 5.8806, multAtCanon: 0.5928 },
    { tau: 0.50, slope: 5.7949, multAtCanon: 0.8627 }
  ];

  // The analysis's headline parity result, and the exact endpoint convention
  // that reproduces it. Used by floorParityQA() as a regression fixture — see
  // the long note on that function for why the fixture is pinned to the
  // analysis's endpoint rather than to a live "today".
  var ANALYSIS_PARITY = {
    // Two dates, deliberately, and they differ by one day:
    //   measuredOn  — the DAY THE MEASUREMENT DESCRIBES, and the only one shown
    //                 to a reader. It is PL_DATA's last sample, 2026-07-31, when
    //                 price sat at ×0.423 — on the floor. That is the fact the
    //                 published 63.8/65.1 is about.
    //   endpointDay — the internal grading endpoint, one day later. The last
    //                 sample is ITSELF an entry, so grading to the sample date
    //                 gives it a zero-length window and drops it (n=25). One day
    //                 past includes it (n=26), which is what the analysis did.
    // Surfacing the +1 to a reader would be noise about an implementation
    // convention; surfacing the wrong one would misdate the finding.
    endpointDayOffset: 1,
    measuredOn: '2026-07-31',
    medianRealized: 63.8,
    medianTrend: 65.1,
    entries: 26,
    tolerancePp: 0.1
  };

  // The same measurement re-run on the MODERN set only (2011 onward), at the
  // same endpoint. This is what the page now displays; the figures above are
  // what was published. Both are asserted, so neither can drift silently and
  // the reconciliation line between them stays true.
  var MODERN_PARITY = {
    medianRealized: 60.5,
    medianTrend: 61.9,
    entries: 20
  };

  // Tripwire parameters — PUBLISHED CANON as of 2026-08-21 (JM blessed; design
  // doc §2.5 proposed them, round 1 confirmed them).
  //
  // These two numbers are the page's whole reason to exist: they are a
  // falsification test stated in advance, in public, with a live status line
  // reporting against them. CHANGING THEM LATER IS A PUBLIC ACT, NOT A TWEAK —
  // a model whose failure condition moves when it is approached has not been
  // falsified, it has been rationalised, and that is the specific failure this
  // page was built to make impossible. If they ever need to move, the move gets
  // announced with its reasoning, in the box, the same way a firing would.
  var TRIPWIRE = { depthPct: 10, days: 30 };

  // ═══════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════
  function $(id) { return document.getElementById(id); }
  function trendAt(d) { return PL_A * Math.pow(d, PL_B); }
  function floorAt(d) { return PL_FLOOR * trendAt(d); }
  function isoOf(d) { return new Date((GENESIS_TS + d * 86400) * 1000).toISOString().slice(0, 10); }
  function dayOfIso(s) { return (Date.parse(s + 'T00:00:00Z') / 1000 - GENESIS_TS) / 86400; }
  function seriesAgeDays() { return Math.max(0, Math.round(TODAY_DAYS - PL_DATA[PL_DATA.length - 1][0])); }
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length;
    if (!n) return NaN;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }
  function usd(v) {
    if (!isFinite(v)) return '—';
    if (v >= 1000) return '$' + Math.round(v).toLocaleString('en-US');
    if (v >= 1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(4);
  }
  function pct1(v) { return (v >= 0 ? '' : '−') + Math.abs(v).toFixed(1) + '%'; }
  function signedPct1(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%'; }
  function longDate(s) {
    var d = new Date(s + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  // ═══════════════════════════════════════════════════════════
  // Live state
  // ═══════════════════════════════════════════════════════════
  var spot = TODAY_PRICE;
  var spotSource = 'seed';
  var endpointMode = 'today';   // 'today' | 'trend' — design doc §6.3: to-today leads
  var channelChart = null;
  var activeEpisode = null;

  function todayDays() { return TODAY_DAYS; }

  // ═══════════════════════════════════════════════════════════
  // HERO — the live distance readout
  // ═══════════════════════════════════════════════════════════
  function renderHero() {
    var d = todayDays();
    var tr = trendAt(d), fl = floorAt(d);
    var xt = spot / tr;
    var vsFloorPct = (spot / fl - 1) * 100;   // + above floor, − below

    // Register guard: identical treatment at every distance. The wording
    // changes because the fact changes; nothing about the styling does.
    var lead;
    if (Math.abs(vsFloorPct) < 1) {
      lead = 'Bitcoin is sitting <em>on the floor</em>';
    } else if (vsFloorPct > 0) {
      lead = 'Bitcoin sits <em>' + Math.abs(vsFloorPct).toFixed(1) + '% above</em> the floor';
    } else {
      lead = 'Bitcoin sits <em>' + Math.abs(vsFloorPct).toFixed(1) + '% below</em> the floor';
    }
    $('flHeroFigure').innerHTML = lead;
    $('flHeroCaption').textContent =
      xt.toFixed(3) + '× trend  ·  floor at ' + PL_FLOOR.toFixed(2) + '× trend';

    $('flNumSpot').textContent = usd(spot);
    $('flNumFloor').textContent = usd(fl);
    $('flNumTrend').textContent = usd(tr);

    $('flHeroProv').textContent =
      spotSource === 'live'
        ? 'Spot is live; floor and trend are computed for today from the shared Power Law coefficients.'
        : 'Spot is the latest sample in the shared price series' + (spotSource === 'fallback' ? ' (the live fetch did not resolve)' : '') + '; floor and trend are computed for today.';

    renderAnchorBar(xt);
  }

  // Floor-anchored bar. Log scale in ×-trend across a window chosen so the
  // floor sits about a third in — the sub-floor region is real territory on
  // this bar, not an out-of-range clamp, because price has been there.
  var BAR_MIN = 0.25, BAR_MAX = 1.30;
  function barPos(xt) {
    var p = (Math.log(xt) - Math.log(BAR_MIN)) / (Math.log(BAR_MAX) - Math.log(BAR_MIN));
    return Math.max(0.015, Math.min(0.985, p)) * 100;
  }
  function renderAnchorBar(xt) {
    var fp = barPos(PL_FLOOR), tp = barPos(1.0);
    $('flTickFloor').style.left = fp + '%';
    $('flTickTrend').style.left = tp + '%';
    $('flBarSubfloor').style.width = fp + '%';
    $('flBarMarker').style.left = barPos(xt) + '%';
    $('flBarMarkerLabel').textContent = xt.toFixed(2) + '×';
  }

  // ═══════════════════════════════════════════════════════════
  // CHANNEL CHART — floor emphasised, episodes marked
  // ═══════════════════════════════════════════════════════════
  // ── Chart typography, page-local ────────────────────────────────────
  // Round 3: the default sizes were too small to read comfortably, worst on
  // the scatter which carries the most axis text. Bumped here ONLY — a
  // site-wide chart/UI typography review is filed separately as its own pass
  // (TECH_DEBT), because changing it globally would touch every chart page.
  var CHART_FONT = { tick: 12, title: 13, legend: 12 };

  // Custom interaction mode: one tooltip item PER DATASET at the hovered x.
  //
  // Chart.js's 'nearest' returns a single item across all datasets, which is
  // why this tooltip was showing only Price — and 'index' matches by array
  // INDEX, which is wrong here because the band lines are ~240 sampled points
  // while the price series has 481, so index N is a different date in each.
  // Matching by x-VALUE gives Floor / Trend / Upper / Price together, which is
  // what the chart's caption promises. Same fix /the-power-law carries; the
  // guard means whichever page registers it first wins and the other reuses it.
  function registerXNearest() {
    if (typeof Chart === 'undefined' || !Chart.Interaction || !Chart.Interaction.modes) return;
    if (Chart.Interaction.modes.flXNearest) return;
    Chart.Interaction.modes.flXNearest = function (chart, e) {
      var pos = (Chart.helpers && Chart.helpers.getRelativePosition)
        ? Chart.helpers.getRelativePosition(e, chart) : { x: e.x, y: e.y };
      var xScale = chart.scales.x;
      if (!xScale) return [];
      var cursorX = xScale.getValueForPixel(pos.x);
      var items = [];
      chart.data.datasets.forEach(function (dataset, di) {
        if (!chart.isDatasetVisible(di)) return;
        var data = dataset.data;
        if (!data || !data.length) return;
        var bi = 0, bd = Infinity;
        for (var i = 0; i < data.length; i++) {
          var x = data[i].x !== undefined ? data[i].x : i;
          var d = Math.abs(x - cursorX);
          if (d < bd) { bd = d; bi = i; }
        }
        var meta = chart.getDatasetMeta(di);
        if (meta && meta.data && meta.data[bi]) items.push({ element: meta.data[bi], datasetIndex: di, index: bi });
      });
      return items;
    };
  }

  function buildChannelChart() {
    var canvas = $('flChannelChart');
    if (!canvas || typeof Chart === 'undefined') return;
    registerXNearest();

    var cFloor = cssVar('--fl-floor', '#c0603a');
    var cTrend = cssVar('--fl-trend', '#e09422');
    var cCeil = cssVar('--fl-ceil', '#d9b36b');
    var cPrice = cssVar('--fl-price', '#6db3d4');
    var cDim = cssVar('--text-muted', '#6a6256');
    var cText = cssVar('--text', '#e8e0d4');

    var minD = PL_DATA[0][0], maxD = todayDays();
    var bandPts = [], step = (maxD - minD) / 240;
    for (var d = minD; d <= maxD; d += step) bandPts.push(d);
    bandPts.push(maxD);

    function line(mult) {
      return bandPts.map(function (dd) { return { x: dd, y: mult * trendAt(dd) }; });
    }
    var priceSeries = PL_DATA.map(function (p) { return { x: p[0], y: p[1] }; });

    // Episode shading: a Chart.js plugin drawing one translucent vertical
    // band per episode, bracketed by the last above-floor sample before and
    // the first after (the same outer bound the cards report).
    var episodeBands = {
      id: 'flEpisodeBands',
      beforeDatasetsDraw: function (chart) {
        var xs = chart.scales.x, ys = chart.scales.y, ctx = chart.ctx;
        if (!xs || !ys) return;
        ctx.save();
        EPISODES.forEach(function (ep) {
          var a = dayOfIso(ep.from), b = dayOfIso(ep.to);
          // An open episode has no bracketing sample after it, so there is no
          // outer bound to widen the band by. Draw it at its sample span.
          var half = ep.bracketDays == null ? 0 : (ep.bracketDays - ep.spanDays) / 2;
          var x0 = xs.getPixelForValue(Math.max(a - half, xs.min));
          var x1 = xs.getPixelForValue(Math.min(b + half, xs.max));
          var w = Math.max(x1 - x0, 3);
          var isActive = activeEpisode && activeEpisode.id === ep.id;
          ctx.fillStyle = ep.kind === 'break'
            ? (isActive ? 'rgba(192,96,58,0.30)' : 'rgba(192,96,58,0.15)')
            : (isActive ? 'rgba(224,148,34,0.28)' : 'rgba(122,115,103,0.16)');
          ctx.fillRect(x0, ys.top, w, ys.bottom - ys.top);
        });
        ctx.restore();
      }
    };

    channelChart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          { label: 'Upper band (3× trend)', data: line(PL_CEIL), borderColor: cCeil, borderWidth: 1, borderDash: [1, 6], pointRadius: 0, tension: 0.2, order: 4 },
          { label: 'Trend', data: line(1), borderColor: cTrend, borderWidth: 1.6, pointRadius: 0, tension: 0.2, order: 3 },
          // The floor is the page's subject, so it is the heaviest line on
          // the chart — the inverse of the Power Law page, where trend leads.
          { label: 'Floor (0.42× trend)', data: line(PL_FLOOR), borderColor: cFloor, borderWidth: 3, pointRadius: 0, tension: 0.2, order: 1 },
          { label: 'Price', data: priceSeries, borderColor: cPrice, borderWidth: 1.4, pointRadius: 0, tension: 0.15, order: 2 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 400 },
        interaction: { mode: 'flXNearest', axis: 'x', intersect: false },
        scales: {
          x: {
            type: 'logarithmic', min: minD, max: maxD,
            title: { display: true, text: 'Year (log time)', color: cDim, font: { size: CHART_FONT.title } },
            // Year-aligned ticks from the shared module: one tick per labelled
            // year, placed on Jan 1, so "2011 2011" cannot happen.
            ticks: { color: cText, font: { size: CHART_FONT.tick }, callback: plYearTickLabel },
            afterBuildTicks: plYearAxisTicks,
            grid: { color: 'rgba(224,148,34,0.05)' }
          },
          y: {
            type: 'logarithmic',
            title: { display: true, text: 'Price, USD (log)', color: cDim, font: { size: CHART_FONT.title } },
            ticks: {
              color: cText, font: { size: CHART_FONT.tick },
              callback: function (v) {
                var e = Math.log10(v);
                if (Math.abs(e - Math.round(e)) > 0.01) return '';
                return v >= 1000 ? '$' + (v / 1000) + 'k' : '$' + v;
              }
            },
            grid: { color: 'rgba(224,148,34,0.05)' }
          }
        },
        plugins: {
          // Legend: pinned to a stable order and given room to wrap. Chart.js
          // sorts legend items by dataset `order` and will silently drop items
          // that do not fit the space it allocates itself — which is how a
          // zoomed view can come back missing a series. maxHeight reserves two
          // rows so wrapping never costs an entry, and generateLabels fixes the
          // order to the reading order of the chart (floor first: it is the
          // page's subject) instead of leaving it to the `order` field.
          // Legend: fixed reading order (floor first — it is the page's
          // subject), and legible. Round 2 pinned the order but left the text
          // at --text-muted/11px, which rendered as swatches with barely-there
          // labels; each item now carries an explicit fontColor at the page's
          // body ink, and maxHeight still reserves a second row so wrapping
          // cannot cost an entry.
          legend: {
            position: 'top', align: 'start', maxHeight: 64,
            labels: {
              color: cText, font: { size: CHART_FONT.legend }, usePointStyle: true,
              boxWidth: 10, padding: 14,
              generateLabels: function (chart) {
                var wanted = ['Floor (0.42× trend)', 'Price', 'Trend', 'Upper band (3× trend)'];
                var out = [];
                wanted.forEach(function (name) {
                  var i = -1;
                  chart.data.datasets.forEach(function (d, k) { if (d.label === name) i = k; });
                  if (i < 0) return;
                  var ds = chart.data.datasets[i];
                  out.push({
                    text: ds.label, datasetIndex: i,
                    strokeStyle: ds.borderColor, fillStyle: ds.borderColor,
                    fontColor: cText, lineWidth: 3,
                    hidden: !chart.isDatasetVisible(i), pointStyle: 'line'
                  });
                });
                return out;
              }
            }
          },
          tooltip: {
            backgroundColor: '#1a1714', borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1,
            titleColor: '#f2eee8', bodyColor: '#e8e0d4',
            callbacks: {
              title: function (items) { return items.length ? isoOf(items[0].parsed.x) : ''; },
              label: function (c) { return c.dataset.label + ': ' + usd(c.parsed.y); },
              afterBody: function (items) {
                if (!items.length) return '';
                var d = items[0].parsed.x;
                var near = null;
                for (var i = 0; i < PL_DATA.length; i++) {
                  if (near === null || Math.abs(PL_DATA[i][0] - d) < Math.abs(near[0] - d)) near = PL_DATA[i];
                }
                if (!near) return '';
                return '\n' + (near[1] / trendAt(near[0])).toFixed(3) + '× trend  ·  ' +
                       (near[1] / floorAt(near[0])).toFixed(2) + '× floor';
              }
            }
          }
        }
      },
      plugins: [episodeBands]
    });
  }

  function setZoomContext(ep) {
    var ctx = $('flZoomContext'), btn = $('flZoomReset');
    if (!ctx || !btn) return;
    if (!ep) {
      ctx.textContent = 'Showing the full history.';
      btn.hidden = true;
    } else if (ep.open) {
      // "The floor held" is a past-tense claim and this episode is not past.
      ctx.innerHTML = 'Zoomed to the <strong>' + ep.when + '</strong> approach &mdash; the one still running, shown as far as the record goes and with no outcome attached to it.';
      btn.hidden = false;
    } else if (ep.modern) {
      ctx.innerHTML = 'Zoomed to the <strong>' + ep.when + '</strong> approach &mdash; a stretch where the floor held even as price stayed below trend for an extended period.';
      btn.hidden = false;
    } else {
      // The generic "the floor held" line is false for the genesis-era episode,
      // which is the one time it did not. Say what actually happened.
      ctx.innerHTML = 'Zoomed to the <strong>' + ep.when + '</strong> episode &mdash; the one stretch where price closed below the floor and stayed there, in the genesis-era market described in the card below.';
      btn.hidden = false;
    }
  }

  function zoomChartTo(ep) {
    setZoomContext(ep);
    if (!channelChart) return;
    if (!ep) {
      channelChart.options.scales.x.min = PL_DATA[0][0];
      channelChart.options.scales.x.max = todayDays();
      delete channelChart.options.scales.y.min;
      delete channelChart.options.scales.y.max;
      channelChart.update();
      return;
    }
    var a = dayOfIso(ep.from), b = dayOfIso(ep.to);
    var pad = Math.max((b - a) * 3, 300);
    var lo = Math.max(PL_DATA[0][0], a - pad), hi = Math.min(todayDays(), b + pad * 2);
    channelChart.options.scales.x.min = lo;
    channelChart.options.scales.x.max = hi;
    // Frame the y-window on the channel across the zoomed span so the floor
    // stays visible rather than being cropped out by the price excursion.
    var ys = [];
    PL_DATA.forEach(function (p) { if (p[0] >= lo && p[0] <= hi) ys.push(p[1]); });
    ys.push(floorAt(lo) * 0.7, trendAt(hi) * 1.4);
    channelChart.options.scales.y.min = Math.min.apply(null, ys) * 0.8;
    channelChart.options.scales.y.max = Math.max.apply(null, ys) * 1.25;
    channelChart.update();
  }

  // ═══════════════════════════════════════════════════════════
  // EPISODE EXPLORER
  // ═══════════════════════════════════════════════════════════
  function renderEpisodeStrip() {
    var strip = $('flEpStrip');
    if (!strip) return;
    strip.innerHTML = '';
    EPISODES.forEach(function (ep) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fl-ep-btn';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.innerHTML =
        '<span class="fl-ep-btn-when">' + ep.when + '</span>' +
        '<span class="fl-ep-btn-kind ' + (ep.kind === 'break' ? 'is-break' : 'is-graze') + '">' + ep.kindLabel + '</span>' +
        '<span class="fl-ep-btn-depth">' + depthLabel(ep) + '</span>';
      b.addEventListener('click', function () { selectEpisode(ep.id); });
      strip.appendChild(b);
    });
    // The reversion stats are reported on the MODERN approaches only, and only
    // on CLOSED ones. The genesis-era episode is recorded in its own card and
    // nowhere else — it is not averaged into a headline (see the section lede).
    // An OPEN episode has no 24-month window, so it is excluded rather than
    // counted as a zero, which would drag the median toward a number no
    // episode produced.
    var modern = EPISODES.filter(function (e) { return e.modern; });
    var settled = modern.filter(function (e) { return !e.open && e.gap24 != null; });
    var gaps = settled.map(function (e) { return e.gap24; });
    var over = gaps.filter(function (g) { return g > 100; }).length;
    $('flRevMedian').textContent = gaps.length ? Math.round(median(gaps)) + '%' : '—';
    $('flRevOvershoot').textContent = over + ' of ' + gaps.length;

    // Round-2 reframe: the MODERN record leads. The genesis-era episode is
    // recorded in its own card and given no weight, so it is no longer the card
    // open on arrival — that would hand it the prominence the reframe removes.
    // Opens on the most recent modern approach. Since the unification that can
    // be an OPEN episode, and that is the right card to land on rather than a
    // problem to route around: the reader arrives on the approach they are
    // currently living through, and its card says in its first line that it has
    // no outcome. The intent is unchanged — the conditions that most resemble
    // today are now literally today's.
    // `true` = do not zoom: the chart lands on the full history, and zooming is
    // something the reader chooses by picking a card.
    selectEpisode(modern[modern.length - 1].id, true);
  }

  function selectEpisode(id, noZoom) {
    var ep = null;
    for (var i = 0; i < EPISODES.length; i++) if (EPISODES[i].id === id) ep = EPISODES[i];
    if (!ep) return;
    activeEpisode = ep;

    var btns = $('flEpStrip').querySelectorAll('.fl-ep-btn');
    for (var j = 0; j < btns.length; j++) {
      var on = EPISODES[j].id === id;
      btns[j].classList.toggle('is-active', on);
      btns[j].setAttribute('aria-selected', on ? 'true' : 'false');
    }

    var dur = ep.spanDays === 0
      ? 'a single sample (&le;24d)'
      : ep.spanDays + ' days';
    // An open episode has no "after" sample, so no bracketed bound and no
    // 24-month outcome. Those metrics are omitted rather than rendered empty:
    // a tile reading "—× trend, 24 months later" invites the reader to think a
    // measurement was attempted and failed, when none is possible yet.
    var durKey = ep.bracketDays == null
      ? 'in the band so far — still open'
      : 'in the band (' + ep.bracketDays + 'd bracketed)';
    var metrics =
      metric(depthValue(ep), depthKey(ep)) +
      metric(ep.deepestXt.toFixed(3) + '×', 'deepest, × trend') +
      metric(dur, durKey);
    if (ep.xt24 != null) metrics += metric(ep.xt24.toFixed(2) + '×', '× trend, 24 months later');
    if (ep.gap24 != null) metrics += metric(ep.gap24 + '%', 'of the gap to trend closed');
    if (ep.open) metrics += metric('no outcome yet', 'described, not scored');
    $('flEpCard').innerHTML =
      '<div class="fl-ep-card-h">' + ep.when + '</div>' +
      '<div class="fl-ep-card-kind ' + (ep.kind === 'break' ? 'is-break' : 'is-graze') + '">' + ep.kindLabel + '</div>' +
      '<div class="fl-ep-metrics">' + metrics + '</div>' +
      '<p>' + ep.body + '</p>';
    if (noZoom) { setZoomContext(null); }
    else { zoomChartTo(ep); }
    if (channelChart) channelChart.update();
  }
  function metric(v, k) {
    return '<div class="fl-ep-metric"><div class="fl-ep-metric-v">' + v + '</div><div class="fl-ep-metric-k">' + k + '</div></div>';
  }

  /* Depth wording. `belowPct` is negative for an approach that entered the 1%
     band without ever closing under the line, and "−0.7% below the floor" is
     not English — it reads as a measurement error rather than as the fact that
     the floor was never breached. These three helpers are the only place the
     sign is interpreted, so the strip and the card cannot drift apart. */
  function neverBreached(ep) { return ep.belowPct < 0; }
  function depthValue(ep) {
    return Math.abs(ep.belowPct).toFixed(1) + '%';
  }
  function depthKey(ep) {
    return neverBreached(ep) ? 'closest, above the floor' : 'deepest, below the floor';
  }
  function depthLabel(ep) {
    return neverBreached(ep)
      ? 'came within ' + Math.abs(ep.belowPct).toFixed(1) + '% of the floor'
      : ep.belowPct.toFixed(1) + '% below the floor';
  }

  // ═══════════════════════════════════════════════════════════
  // THE PARITY INSTRUMENT
  //
  // Methodology, from analysis §3, reimplemented here rather than
  // hardcoded so the figures move with the series:
  //   entries  = MODERN samples (2011 onward) priced within 10% ABOVE the floor,
  //              which also picks up genuine sub-floor samples;
  //   realized = CAGR from each entry's price to the endpoint price;
  //   trend    = CAGR of the trend line across the identical window;
  //   excess   = the MEDIAN OF THE PER-ENTRY DIFFERENCES — not the
  //              difference of the two medians, which is a different
  //              number (−1.3pp vs −0.5pp on today's series) and would
  //              be the natural misreading of the two figures shown.
  // ═══════════════════════════════════════════════════════════
  // ── THE MODERN BOUNDARY, one constant for the whole page ────────────
  // 2011-01-01, the same boundary the tripwire's "modern era (2011–)" uses.
  // Everything the page MEASURES is drawn from this side of it; the genesis
  // era appears once, in the record section, and nowhere else — a position on
  // a chart is weight, so excluding it there is the same ruling as not
  // averaging it into a headline.
  //
  // Worth knowing before reading the era labels: the entry set contains SIX
  // 2010 samples and then nothing until 2012-05-27. There are no 2011 entries
  // at all, so the first surviving era bucket is a single 2012 sample and its
  // derived label is "2012", not "2011–2012".
  var MODERN_FROM = '2011-01-01';

  function entrySet() {
    return PL_DATA.filter(function (p) { return p[1] / floorAt(p[0]) <= 1.10; });
  }
  function modernEntrySet() {
    return entrySet().filter(function (p) { return isoOf(p[0]) >= MODERN_FROM; });
  }

  function lastTrendTouch() {
    for (var i = PL_DATA.length - 1; i >= 0; i--) {
      if (PL_DATA[i][1] / trendAt(PL_DATA[i][0]) >= 1.0) return PL_DATA[i];
    }
    return null;
  }

  // `set` defaults to the MODERN entries — what the page displays. The QA
  // fixture passes entrySet() explicitly so it still reproduces the published
  // full-set measurement, which included the genesis samples.
  function gradeTo(endDay, endPrice, set) {
    var re = [], tc = [], ex = [];
    (set || modernEntrySet()).forEach(function (p) {
      var yrs = (endDay - p[0]) / YEAR;
      if (yrs <= 0) return;
      var r = (Math.pow(endPrice / p[1], 1 / yrs) - 1) * 100;
      var t = (Math.pow(trendAt(endDay) / trendAt(p[0]), 1 / yrs) - 1) * 100;
      re.push(r); tc.push(t); ex.push(r - t);
    });
    return {
      n: re.length,
      realized: median(re),
      trend: median(tc),
      excess: median(ex),
      diffOfMedians: median(re) - median(tc)
    };
  }

  function renderParity() {
    var toTrend = endpointMode === 'trend';
    var endDay, endPrice, endLabel, endWhen;

    if (toTrend) {
      var lt = lastTrendTouch();
      endDay = lt[0]; endPrice = lt[1];
      endWhen = longDate(isoOf(lt[0]));
      endLabel = 'the last time price touched the trend line (' + endWhen + ')';
    } else {
      endDay = todayDays(); endPrice = spot;
      endWhen = 'today';
      // Describe where today ACTUALLY is. This label used to assert "with price
      // at the floor", which was true on the analysis date and false by the
      // first preview load — the same trap the analysis warns about.
      var vsF = (spot / floorAt(endDay) - 1) * 100;
      endLabel = 'today, with price ' + (Math.abs(vsF) < 3
        ? 'on the floor'
        : Math.abs(vsF).toFixed(1) + '% ' + (vsF > 0 ? 'above' : 'below') + ' the floor');
    }

    var g = gradeTo(endDay, endPrice);

    $('flParityRealized').textContent = g.realized.toFixed(1) + '%';
    $('flParityTrend').textContent = g.trend.toFixed(1) + '%';
    $('flParityExcess').textContent = signedPct1(g.excess);
    $('flParityRealizedSub').textContent = 'median across ' + g.n + ' entries';
    $('flParityMethod').innerHTML =
      'Entries are the ' + g.n + ' modern-era samples (2011 onward) that closed <strong>no more than 10% above the floor</strong>, graded to ' + endLabel + '. ' +
      'That is ' + (g.n / PL_DATA.length * 100).toFixed(1) + '% of the ' + PL_DATA.length + ' samples on record. ' +
      '<br><br><strong>Reconciling to the published figure.</strong> The published measurement ' +
      '(<code>analysis/2026-08-20-power-law-floor.md</code> §3), taken ' + ANALYSIS_PARITY.measuredOn +
      ' when price sat on the floor, <strong>included the genesis samples</strong> and found ' +
      ANALYSIS_PARITY.medianRealized.toFixed(1) + '% against ' + ANALYSIS_PARITY.medianTrend.toFixed(1) +
      '% — <code>floorParityQA()</code> reproduces it. The same set of dates without the genesis samples, ' +
      'at that same endpoint, gives ' + MODERN_PARITY.medianRealized.toFixed(1) + '% against ' +
      MODERN_PARITY.medianTrend.toFixed(1) + '%. The difference is the six 2010 samples, which entered far ' +
      'below the line and are excluded here for the reason the record section gives.';

    if (!toTrend) {
      // The to-today read is POSITION-DEPENDENT and must be recomputed, never
      // remembered. The published analysis was written on a day when price sat
      // on the floor, which made excess ≈ 0 almost by construction. That is a
      // fact about that day's vantage, not a standing property — when price is
      // well above the floor these same windows are graded floor-to-higher and
      // the excess goes positive for exactly the same mechanical reason. The
      // branch below keeps the sentence true at any distance, and always shows
      // the published measurement alongside so the two can be reconciled.
      var d0 = todayDays();
      var vsFloorNow = (spot / floorAt(d0) - 1) * 100;
      var whereNow = Math.abs(vsFloorNow) < 3
        ? 'today sits essentially <em>on</em> the floor'
        : (vsFloorNow > 0
            ? 'today sits <em>' + Math.abs(vsFloorNow).toFixed(1) + '% above</em> the floor'
            : 'today sits <em>' + Math.abs(vsFloorNow).toFixed(1) + '% below</em> the floor');

      var read;
      if (Math.abs(g.excess) < 1.0) {
        read = '<strong>Entering anywhere at or just above the floor did not beat the trend line.</strong> ' +
          'The median entry returned an enormous absolute CAGR — and its extra return vs the trend line, the excess over what the trend line itself grew at, ' +
          'across the identical window, is ' + signedPct1(g.excess) + ': indistinguishable from zero. ' +
          'The extra return in this set came from how far <em>below</em> the line an entry went, not from the fact of buying at it.';
      } else if (g.excess > 0) {
        read = 'Graded to today, these entries came out ' + signedPct1(g.excess) + ' per year ahead of the trend line. ' +
          '<strong>That is the endpoint doing the work, not the entry.</strong> Because ' + whereNow + ', ' +
          'these windows are graded from the floor to a point above it — and that extra return is very nearly the annualised change ' +
          'in the ×-trend ratio between the two ends. The published analysis, measured <strong>' + ANALYSIS_PARITY.measuredOn +
          '</strong> — a day when price sat <em>on</em> the floor — found the same entries returned ' +
          ANALYSIS_PARITY.medianRealized.toFixed(1) + '% against a trend of ' +
          ANALYSIS_PARITY.medianTrend.toFixed(1) + '% — a difference of about zero. Both readings are the same arithmetic ' +
          'seen from different days.';
      } else {
        read = 'Graded to today, these entries came out ' + signedPct1(g.excess) + ' per year — they trailed the trend line. ' +
          '<strong>That is the endpoint doing the work, not the entry.</strong> Because ' + whereNow + ', ' +
          'these windows end below where they began in ×-trend terms, and that shortfall is very nearly the annualised change ' +
          'in that ratio. The published analysis, measured with price on the floor, found a difference of about zero.';
      }
      $('flParityRead').innerHTML = read;

      $('flHonestyEndpoint').innerHTML =
        'Extra return vs the trend line is very nearly the annualised change in the ×-trend ratio between entry and exit, so <strong>where price ' +
        'happens to sit on the day you read this decides the answer</strong>. Right now ' + whereNow + ', at ' +
        (spot / trendAt(d0)).toFixed(3) + '× trend. When price sits on the floor every window is graded floor-to-floor — ' +
        'the least flattering vantage available, and the one the published analysis used. This number is a statement about ' +
        'the <strong>pair</strong> of endpoints, not a durable property of floor entries. Change either and it changes.';
      renderScatter(endDay, endPrice, 'today');
    } else {
      $('flParityRead').innerHTML =
        'Graded to the last time price touched the trend line, the same entries came out ' + signedPct1(g.excess) + ' per year ahead. ' +
        '<strong>This is the reversion showing up, not evidence that floor entries beat the market.</strong> ' +
        'It is the historical bonus for having been early to a line price later left behind — and it is measured to an endpoint ' +
        'chosen precisely because it was favourable. The guarantee half is the finding that leads this page: graded at its ' +
        'worst — with price back down on the floor, as the published analysis measured it on ' + ANALYSIS_PARITY.measuredOn + ' — the same entries returned ' +
        ANALYSIS_PARITY.medianRealized.toFixed(1) + '% against the trend line’s own ' + ANALYSIS_PARITY.medianTrend.toFixed(1) +
        '%, a difference of about zero. Matching the trend line at the worst vantage is the claim; this tab is the bonus.';
      $('flHonestyEndpoint').innerHTML =
        'This endpoint is <strong>chosen, not neutral</strong>. Measuring to the last moment price touched trend ' +
        '(' + endWhen + ') banks the whole reversion and stops the clock before the drawdown that followed. ' +
        'It is a fair question — what did the entry pay by the time price had returned to trend? — asked with a favourable ruler. ' +
        'Both tabs are true; neither is the answer on its own.';
      renderScatter(endDay, endPrice, 'the last time price touched the trend line (' + endWhen + ')');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // THE ENTRY SCATTER — excess against how far below the line you bought
  //
  // The parity card answers "did entering at the floor beat the trend line?"
  // with a median. This answers the sharper question underneath it, which
  // the analysis states and no single number can show: the excess in this
  // set tracks HOW FAR BELOW the line an entry went, not the fact of
  // entering near it.
  //
  // TWO DELIBERATE CHOICES, both of which change what the reader sees:
  //
  // 1. NO FITTED LINE. Not caution — the relationship here is very nearly
  //    ARITHMETIC rather than estimated. Excess is approximately the
  //    annualised change in the ×-trend ratio between entry and exit, so
  //    for a common endpoint it is close to a deterministic function of
  //    where the entry sat. Drawing a regression through it would dress a
  //    near-identity as an empirical finding, and would imply 26
  //    independent observations when these are ~12-day samples drawn from
  //    four clusters. The scatter shows a mechanism; a fit would claim an
  //    estimate. Reference lines only: x = 0 is the floor, y = 0 is
  //    matching the model.
  //
  // 2. A MINIMUM WINDOW. Entries whose window is under a year are excluded
  //    and the exclusion is stated on the chart. Annualising a three-week
  //    window multiplies its noise by ~17; the three 2026 entries produce
  //    excesses of −54% and −39% that are artifacts of the exponent, not
  //    facts about entering at the floor, and plotted raw they compress
  //    every real point into a band a few pixels tall. The medians in the
  //    card above KEEP them — a median is robust to exactly this, which is
  //    why 63.8/65.1 is unaffected — so the counts differ by design and
  //    the caption says so rather than quietly reconciling.
  // ═══════════════════════════════════════════════════════════
  var MIN_WINDOW_YEARS = 1;
  var scatterChart = null;

  function scatterRows(endDay, endPrice) {
    var rows = [];
    modernEntrySet().forEach(function (p) {
      var yrs = (endDay - p[0]) / YEAR;
      if (yrs < MIN_WINDOW_YEARS) return;
      var r = (Math.pow(endPrice / p[1], 1 / yrs) - 1) * 100;
      var t = (Math.pow(trendAt(endDay) / trendAt(p[0]), 1 / yrs) - 1) * 100;
      rows.push({
        day: p[0], date: isoOf(p[0]), years: yrs,
        x: (p[1] / floorAt(p[0]) - 1) * 100,   // + above the floor, − below
        y: r - t
      });
    });
    return rows;
  }

  // Era = a contiguous run of entries; a gap over ~2 years starts a new one.
  // Derived from the data rather than hardcoded, so the legend cannot mislabel.
  function groupEras(rows) {
    var eras = [], cur = null;
    rows.forEach(function (row) {
      if (cur && (row.day - cur.lastDay) > 730) { eras.push(cur); cur = null; }
      if (!cur) cur = { rows: [], firstDate: row.date, lastDay: row.day };
      cur.rows.push(row); cur.lastDay = row.day; cur.lastDate = row.date;
    });
    if (cur) eras.push(cur);
    return eras.map(function (e) {
      var a = e.firstDate.slice(0, 4), b = e.lastDate.slice(0, 4);
      return { label: a === b ? a : a + '–' + b, rows: e.rows };
    });
  }

  function renderScatter(endDay, endPrice, endWhen) {
    var canvas = $('flScatterChart');
    if (!canvas || typeof Chart === 'undefined') return;

    var all = entrySet().filter(function (p) { return (endDay - p[0]) / YEAR > 0; }).length;
    var rows = scatterRows(endDay, endPrice);
    var dropped = all - rows.length;
    var eras = groupEras(rows);
    var eraColors = [cssVar('--fl-era-1', '#c0603a'), cssVar('--fl-era-2', '#d9b36b'),
                     cssVar('--fl-era-3', '#6db3d4'), cssVar('--fl-era-4', '#8fae7f')];
    var cDim = cssVar('--text-muted', '#6a6256');
    var cText = cssVar('--text', '#e8e0d4');
    var cAxis = cssVar('--fl-axis', 'rgba(224,148,34,0.28)');
    var cApproach = cssVar('--fl-approach', '#e09422');

    // Frame so zero is always inside the plot with breathing room on both sides.
    var ys = rows.map(function (r) { return r.y; });
    var lo = Math.min(0, Math.min.apply(null, ys)), hi = Math.max(0, Math.max.apply(null, ys));
    var padY = Math.max((hi - lo) * 0.12, 0.5);
    var yBounds = { min: lo - padY, max: hi + padY };

    // Genesis-era points are drawn as HOLLOW, faded markers. They stay on the
    // chart — removing them would hide the shape of the entry set — but they
    // must not read as equal evidence, because the record section already
    // dismissed them and the result line below is written not to lean on them.
    // The era legend still names them, so the class is visible, not hidden.
    // The three closest approaches get their own marker so the chart ties back
    // to the record cards: these are the same events, seen from the other side.
    var APPROACH_DATES = { '2015-08-28': 'Aug 2015', '2015-09-21': 'Sep–Oct 2015', '2023-01-06': 'Jan 2023' };
    var datasets = eras.map(function (era, i) {
      var col = eraColors[i % eraColors.length];
      return {
        label: era.label,
        data: era.rows.filter(function (r) { return !APPROACH_DATES[r.date]; }),
        backgroundColor: col, borderColor: col,
        pointStyle: 'circle', pointRadius: 6, pointHoverRadius: 8
      };
    });
    var approachRows = rows.filter(function (r) { return APPROACH_DATES[r.date]; });
    if (approachRows.length) {
      datasets.push({
        label: 'The three closest approaches',
        data: approachRows,
        backgroundColor: cApproach, borderColor: cApproach,
        pointStyle: 'triangle', pointRadius: 10, pointHoverRadius: 12
      });
    }

    var refLines = {
      id: 'flScatterRefs',
      beforeDatasetsDraw: function (chart) {
        var xs = chart.scales.x, ys = chart.scales.y, ctx = chart.ctx;
        if (!xs || !ys) return;
        ctx.save();
        ctx.strokeStyle = cAxis; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
        var x0 = xs.getPixelForValue(0);
        ctx.beginPath(); ctx.moveTo(x0, ys.top); ctx.lineTo(x0, ys.bottom); ctx.stroke();
        var y0 = ys.getPixelForValue(0);
        ctx.beginPath(); ctx.moveTo(xs.left, y0); ctx.lineTo(xs.right, y0); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = cText; ctx.font = CHART_FONT.tick + 'px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('the floor', x0 + 5, ys.top + 12);
        ctx.fillText('matched the trend line', xs.left + 5, y0 - 5);
        // Faint zone labels flanking the floor line, so the sign of the x-axis
        // needs no decoding: left of the dashes is below the line, right above.
        ctx.font = (CHART_FONT.tick - 1) + 'px Inter, sans-serif';
        ctx.fillStyle = cDim;
        ctx.textAlign = 'right';
        ctx.fillText('closed below the floor', x0 - 8, ys.bottom - 8);
        ctx.textAlign = 'left';
        ctx.fillText('closed above the floor', x0 + 8, ys.bottom - 8);
        ctx.restore();
      }
    };

    // Small labels on the three approach markers, tying them to the record cards.
    var approachLabels = {
      id: 'flApproachLabels',
      afterDatasetsDraw: function (chart) {
        var ds = chart.data.datasets.findIndex(function (d) { return d.label === 'The three closest approaches'; });
        if (ds < 0) return;
        var meta = chart.getDatasetMeta(ds);
        if (!meta || !meta.data) return;
        var ctx = chart.ctx;
        ctx.save();
        ctx.font = '600 ' + (CHART_FONT.tick - 1) + 'px Inter, sans-serif';
        ctx.fillStyle = cApproach;
        ctx.textAlign = 'center';
        meta.data.forEach(function (el, i) {
          var row = chart.data.datasets[ds].data[i];
          var name = APPROACH_DATES[row.date];
          if (name) ctx.fillText(name, el.x, el.y - 14);
        });
        ctx.restore();
      }
    };

    var cfg = {
      datasets: datasets,
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: "Entry price vs. that day's floor (%) — 0% is the floor itself", color: cDim, font: { size: CHART_FONT.title } },
            ticks: { color: cText, font: { size: CHART_FONT.tick }, callback: function (v) { return v + '%'; } },
            grid: { color: 'rgba(224,148,34,0.05)' }
          },
          y: {
            // Always frame zero with margin on BOTH sides. When price sits well
            // above the floor every entry shows positive excess, and Chart.js's
            // default framing puts the zero line flush against the axis — where
            // "matched the trend line" reads as the chart’s frame rather than as the
            // reference the whole panel turns on.
            suggestedMin: yBounds.min, suggestedMax: yBounds.max,
            title: { display: true, text: 'Extra return vs the trend line (percentage points per year)', color: cDim, font: { size: CHART_FONT.title } },
            ticks: { color: cText, font: { size: CHART_FONT.tick }, callback: function (v) { return (v > 0 ? '+' : '') + v; } },
            grid: { color: 'rgba(224,148,34,0.05)' }
          }
        },
        plugins: {
          legend: { labels: { color: cText, font: { size: CHART_FONT.legend }, usePointStyle: true, boxWidth: 10, padding: 14 } },
          tooltip: {
            backgroundColor: '#1a1714', borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1,
            titleColor: '#f2eee8', bodyColor: '#e8e0d4',
            callbacks: {
              title: function (items) { return items.length ? items[0].raw.date : ''; },
              label: function (c) {
                var r = c.raw;
                var where = r.x < 0 ? Math.abs(r.x).toFixed(1) + '% below the floor'
                                    : r.x.toFixed(1) + '% above the floor';
                return [ 'Bought at ' + where,
                         'Excess ' + signedPct1(r.y) + ' per year',
                         'Held ' + r.years.toFixed(1) + ' years' ];
              }
            }
          }
        }
      },
      plugins: [refLines, approachLabels]
    };

    if (scatterChart) {
      scatterChart.data.datasets = datasets;
      // Re-frame too: the two endpoints produce very different excess ranges,
      // so keeping the first render's bounds would crop or float the points.
      scatterChart.options.scales.y.suggestedMin = yBounds.min;
      scatterChart.options.scales.y.suggestedMax = yBounds.max;
      scatterChart.update();
    } else {
      cfg.type = 'scatter';
      scatterChart = new Chart(canvas, cfg);
    }

    // ── Declarative result line, ENDPOINT-AWARE ────────────────────────
    // Never an unconditional "these entries never underperformed": whether they
    // beat the trend line is a fact about the endpoint, not about the entries.
    // Recomputed with the toggle, and phrased from what the points actually do.
    var allPositive = rows.every(function (r) { return r.y > 0; });
    var nearFloorEndpoint = Math.abs((endPrice / floorAt(endDay) - 1) * 100) < 5;

    // ── The below-vs-above clause, COMPUTED, never asserted ──────────────
    // The claim has to stand on the MODERN entries alone, or the chart is
    // leaning on the genesis cluster it just told the reader to discount.
    // Two strengths are tested and only the true one is used:
    //   clean  — every modern below-floor entry out-earned every above-floor one
    //   median — the typical below-floor entry out-earned the typical above one
    // Verified 2026-08-22 at both endpoints: median holds at both, clean holds
    // at NEITHER (an above-floor 2022 entry with a short window out-earns the
    // weakest below-floor one). If neither holds, the clause is dropped rather
    // than softened into something unfalsifiable.
    // Every row is now modern by construction (genesis excluded at the set), so
    // the split is computed over the whole chart and the copy no longer needs to
    // say "among the modern approaches alone" — there is nothing else on it.
    var modernRowsAll = rows;
    var mBelow = modernRowsAll.filter(function (r) { return r.x < 0; }).map(function (r) { return r.y; });
    var mAbove = modernRowsAll.filter(function (r) { return r.x >= 0; }).map(function (r) { return r.y; });
    var clause = '';
    if (mBelow.length && mAbove.length) {
      var cleanSplit = Math.min.apply(null, mBelow) > Math.max.apply(null, mAbove);
      var medianSplit = median(mBelow) > median(mAbove);
      if (cleanSplit) {
        clause = ' <strong>Every entry that closed below the line out-earned every entry that closed above it.</strong>';
      } else if (medianSplit) {
        clause = ' Entries that closed below the line <strong>typically out-earned</strong> those that closed above it — ' +
                 'a median of ' + signedPct1(median(mBelow)) + ' against ' + signedPct1(median(mAbove)) + ' per year, though the two groups overlap.';
      }
    }

    var resultEl = $('flScatterResult');
    if (resultEl) {
      if (nearFloorEndpoint) {
        resultEl.innerHTML =
          'Graded floor-to-floor, these entries <strong>matched the trend line’s growth</strong> — the extra return appears only ' +
          'when the endpoint sits above the floor.' + clause;
      } else if (allPositive) {
        resultEl.innerHTML =
          'Graded to ' + endWhen + ', <strong>every one of these entries beat the trend line’s own growth</strong>.' + clause;
      } else {
        resultEl.innerHTML =
          'Graded to ' + endWhen + ', these entries split — some beat the trend line’s own growth and some trailed it.' + clause;
      }
    }

    // Worked example, from the deepest MODERN entry — the genesis-era samples
    // are on the chart but must not be the sentence a reader carries away.
    var deepestModern = rows.slice().sort(function (a, b) { return a.x - b.x; })[0];
    var workedEl = $('flScatterWorked');
    if (workedEl && deepestModern) {
      workedEl.innerHTML =
        '<strong>Reading one point:</strong> the entry on ' + deepestModern.date + ' sat ' +
        (deepestModern.x < 0
          ? Math.abs(deepestModern.x).toFixed(1) + '% <em>below</em> the floor'
          : deepestModern.x.toFixed(1) + '% above the floor') +
        ' — the deepest entry on the chart. Held ' + deepestModern.years.toFixed(1) + ' years to ' + endWhen +
        ', it came out ' + signedPct1(deepestModern.y) + ' per year against what the trend line grew over the same window.';
    }

    $('flScatterSub').textContent =
      rows.length + ' entries, each graded to ' + endWhen + ' — every modern-era sample (2011 onward) that closed no more than 10% above the floor. ' +
      'Left of the dashed vertical sat below the floor; above the dashed horizontal beat the trend line. ' +
      'Hover any point for its date and figures.';
    $('flScatterNote').innerHTML =
      '<strong>No line is fitted through these points, deliberately.</strong> Excess is very nearly the annualised change ' +
      'in the ×-trend ratio between entry and exit, so against a common endpoint it is close to arithmetic rather than an ' +
      'estimated effect — and these are ~12-day samples from four clusters, not 26 independent observations. A regression ' +
      'would imply both a precision and an independence the data does not have. ' +
      (dropped > 0
        ? 'Also excluded: <strong>' + dropped + ' ' + (dropped === 1 ? 'entry' : 'entries') + ' held under a year</strong>, ' +
          'whose annualised figures are dominated by the exponent rather than by the entry ' +
          '(a three-week window multiplies its own noise roughly seventeenfold). The medians in the card above keep them — ' +
          'a median is robust to exactly this — which is why the counts differ.'
        : 'Every entry here has at least a year of window.');
  }

  // ═══════════════════════════════════════════════════════════
  // QA HOOK — window.floorParityQA()
  //
  // WHY THIS ASSERTS AGAINST A FIXED ENDPOINT, NOT AGAINST "TODAY":
  // the design doc asks the page to reproduce the analysis's 63.8 / 65.1
  // at the to-today endpoint. That is reproducible only on the analysis's
  // own terminal date. The medians are endpoint-sensitive at exactly the
  // 0.1pp tolerance being asserted — sliding the endpoint from the last
  // sample to +20 days moves realized 63.8 → 63.4 — and the page's live
  // "to today" also rides the live spot, which moves hourly. Asserting
  // the live figure would therefore fail on the second day for a reason
  // that has nothing to do with correctness.
  //
  // So the fixture pins the METHOD, not the calendar: recompute at the
  // analysis's endpoint (one day past the last PL_DATA sample, 365.25-day
  // years) and require 63.8 / 65.1 ± 0.1pp with n = 26. That is a true
  // regression test — it fails if the algorithm drifts, if PL_DATA is
  // rewritten, or if the entry rule changes — and it stays green
  // tomorrow. The live figures are reported alongside, unasserted.
  // ═══════════════════════════════════════════════════════════
  function floorParityQA() {
    var last = PL_DATA[PL_DATA.length - 1];
    var fixDay = last[0] + ANALYSIS_PARITY.endpointDayOffset;
    // FULL set, explicitly — this fixture reproduces the published measurement,
    // which included the genesis samples. It must not follow the page's display
    // set, or the regression test would drift with an editorial decision.
    var fix = gradeTo(fixDay, last[1], entrySet());
    // MODERN set at the same endpoint — the counterpart of the published figure
    // on the set the page actually displays. Asserted too, so the numbers on
    // screen are pinned by the same mechanism that pins the published ones.
    var mod = gradeTo(fixDay, last[1], modernEntrySet());
    var tol = ANALYSIS_PARITY.tolerancePp;

    var failures = [];
    if (fix.n !== ANALYSIS_PARITY.entries) {
      failures.push('entry count ' + fix.n + ' ≠ ' + ANALYSIS_PARITY.entries);
    }
    if (Math.abs(fix.realized - ANALYSIS_PARITY.medianRealized) > tol) {
      failures.push('median realized ' + fix.realized.toFixed(2) + ' vs ' + ANALYSIS_PARITY.medianRealized + ' (±' + tol + ')');
    }
    if (Math.abs(fix.trend - ANALYSIS_PARITY.medianTrend) > tol) {
      failures.push('median trend ' + fix.trend.toFixed(2) + ' vs ' + ANALYSIS_PARITY.medianTrend + ' (±' + tol + ')');
    }
    // Modern-subset fixture, same endpoint. Pins the displayed medians.
    if (mod.n !== MODERN_PARITY.entries) {
      failures.push('modern entry count ' + mod.n + ' ≠ ' + MODERN_PARITY.entries);
    }
    if (Math.abs(mod.realized - MODERN_PARITY.medianRealized) > tol) {
      failures.push('modern median realized ' + mod.realized.toFixed(2) + ' vs ' + MODERN_PARITY.medianRealized + ' (±' + tol + ')');
    }
    if (Math.abs(mod.trend - MODERN_PARITY.medianTrend) > tol) {
      failures.push('modern median trend ' + mod.trend.toFixed(2) + ' vs ' + MODERN_PARITY.medianTrend + ' (±' + tol + ')');
    }
    // The exclusion itself is asserted: no sample before the modern boundary may
    // reach the displayed set or the chart.
    var leaked = modernEntrySet().filter(function (p) { return isoOf(p[0]) < MODERN_FROM; });
    if (leaked.length) failures.push(leaked.length + ' pre-' + MODERN_FROM.slice(0, 4) + ' samples leaked into the modern set');

    // Episode dataset must still match what the series says. The cards are
    // static prose over static figures; this is what stops a PL_DATA refresh
    // from silently invalidating them.
    var computed = computeEpisodes();
    if (computed.length !== EPISODES.length) {
      failures.push('episode count ' + computed.length + ' ≠ ' + EPISODES.length);
    } else {
      computed.forEach(function (c, i) {
        var e = EPISODES[i];
        if (c.from !== e.from) failures.push('episode ' + e.id + ' start ' + c.from + ' ≠ ' + e.from);
        if (c.to !== e.to) failures.push('episode ' + e.id + ' end ' + c.to + ' ≠ ' + e.to);
        if (Math.abs(c.belowPct - e.belowPct) > 0.05) failures.push('episode ' + e.id + ' depth ' + c.belowPct + ' ≠ ' + e.belowPct);
        if (Math.abs(c.spanDays - e.spanDays) > 0.5) failures.push('episode ' + e.id + ' span ' + c.spanDays + ' ≠ ' + e.spanDays);
        // Openness is asserted too. It decides whether a card shows a 24-month
        // outcome and whether the episode enters the reversion median, so a
        // PL_DATA refresh that closes the open episode must fail loudly here
        // rather than leave a stale "no outcome yet" tile on the page.
        if (!!c.open !== !!e.open) failures.push('episode ' + e.id + ' open ' + !!c.open + ' ≠ ' + !!e.open);
        if (!c.open && e.gap24 == null) failures.push('episode ' + e.id + ' is closed but carries no 24-month outcome');
      });
    }

    var liveToday = gradeTo(todayDays(), spot);
    var lt = lastTrendTouch();
    var liveTrend = gradeTo(lt[0], lt[1]);

    var out = {
      pass: failures.length === 0,
      failures: failures,
      fixture: {
        endpoint: isoOf(fixDay),
        n: fix.n,
        realized: +fix.realized.toFixed(2),
        trend: +fix.trend.toFixed(2),
        excess: +fix.excess.toFixed(2),
        diffOfMedians: +fix.diffOfMedians.toFixed(2),
        expects: ANALYSIS_PARITY
      },
      live: {
        spot: spot, spotSource: spotSource,
        toToday: { n: liveToday.n, realized: +liveToday.realized.toFixed(2), trend: +liveToday.trend.toFixed(2), excess: +liveToday.excess.toFixed(2) },
        toTrendTouch: { on: isoOf(lt[0]), n: liveTrend.n, realized: +liveTrend.realized.toFixed(2), trend: +liveTrend.trend.toFixed(2), excess: +liveTrend.excess.toFixed(2) }
      },
      episodes: computed,
      tripwire: tripwireState()
    };
    if (!out.pass) console.error('[floor-qa] FAILED', out);
    return out;
  }

  // Recompute the four episodes from PL_DATA — index-adjacent runs strictly
  // below the floor, so an above-floor sample between two dips separates them
  // (this is what keeps the two September/August 2015 visits distinct).
  /* The derivation behind the EPISODES cards above, kept live so the cards can
     be checked against the series rather than trusted. It implements the
     unified visit definition (see the EPISODES header): within 1% of the floor
     or below, with a >100-day gap starting a new episode. Before 2026-09-01
     this counted only closes strictly below the floor and split on sample
     contiguity, which produced a different grouping from the rest of the site. */
  function computeEpisodes() {
    var runs = [], cur = null, thr = PL_FLOOR * EPISODE_GRAZE;
    for (var i = 0; i < PL_DATA.length; i++) {
      var p = PL_DATA[i], xt = p[1] / trendAt(p[0]);
      if (xt <= thr) {
        if (!cur || p[0] - cur.rows[cur.rows.length - 1][0] > EPISODE_GAP_D) {
          if (cur) { cur.e = cur.lastI; runs.push(cur); }
          cur = { s: i, rows: [] };
        }
        cur.rows.push(p); cur.lastI = i;
      }
    }
    if (cur) { cur.e = cur.lastI; runs.push(cur); }
    return runs.map(function (r) {
      var deepest = null;
      r.rows.forEach(function (p) {
        var xt = p[1] / trendAt(p[0]);
        if (!deepest || xt < deepest.xt) deepest = { xt: xt, day: p[0] };
      });
      var span = r.rows[r.rows.length - 1][0] - r.rows[0][0];
      var before = PL_DATA[Math.max(r.s - 1, 0)][0];
      // OPEN = the episode's last qualifying sample is the last sample in the
      // record. There is no bracketing sample after it, so bracketDays is null
      // rather than a number computed against the episode's own last sample —
      // which is what `Math.min(r.e + 1, len - 1)` would silently produce.
      var isOpen = (r.e === PL_DATA.length - 1);
      var after = isOpen ? null : PL_DATA[r.e + 1][0];
      return {
        from: isoOf(r.rows[0][0]), to: isoOf(r.rows[r.rows.length - 1][0]),
        samples: r.rows.length, spanDays: span,
        bracketDays: isOpen ? null : after - before,
        open: isOpen,
        deepestXt: +deepest.xt.toFixed(3), deepestOn: isoOf(deepest.day),
        belowPct: +((1 - deepest.xt / PL_FLOOR) * 100).toFixed(1)
      };
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TRIPWIRE
  // ═══════════════════════════════════════════════════════════
  function tripwireState() {
    var d = todayDays(), fl = floorAt(d);
    var vsFloorPct = (spot / fl - 1) * 100;
    var threshold = PL_FLOOR * (1 - TRIPWIRE.depthPct / 100);   // ×-trend at 10% below floor

    // Consecutive elapsed days in the CURRENT run of samples below the
    // threshold. Measured in elapsed days, never in sample counts — the
    // series is a ~12-day grid (module header; MONTHLY_REFRESH_CHECKLIST §1).
    var runDays = 0;
    for (var i = PL_DATA.length - 1; i >= 0; i--) {
      var xt = PL_DATA[i][1] / trendAt(PL_DATA[i][0]);
      if (xt < threshold) runDays = PL_DATA[PL_DATA.length - 1][0] - PL_DATA[i][0];
      else break;
    }
    // Has it ever fired since 2011? (i.e. excluding the 2010 infancy break)
    var firedModern = false, modernStart = dayOfIso('2011-01-01');
    var run = 0, prevDay = null;
    for (var k = 0; k < PL_DATA.length; k++) {
      var day = PL_DATA[k][0], x = PL_DATA[k][1] / trendAt(day);
      if (x < threshold) { run = prevDay === null ? 0 : run + (day - prevDay); prevDay = day; }
      else { run = 0; prevDay = null; }
      if (day >= modernStart && run > TRIPWIRE.days) firedModern = true;
    }
    return {
      vsFloorPct: +vsFloorPct.toFixed(2),
      thresholdXt: +threshold.toFixed(4),
      thresholdPrice: threshold * trendAt(d),
      daysBelow: runDays,
      armed: vsFloorPct < -TRIPWIRE.depthPct,
      firedModern: firedModern
    };
  }

  function renderTripwire() {
    var t = tripwireState();
    var where = t.vsFloorPct >= 0
      ? '<strong>' + t.vsFloorPct.toFixed(1) + '% above the floor</strong>'
      : '<strong>' + Math.abs(t.vsFloorPct).toFixed(1) + '% below the floor</strong>';
    // "Arms" and "fires" are different events and the wording keeps them apart:
    // price closing below the depth line ARMS the clock; only depth sustained for
    // the full duration FIRES the tripwire. The criteria are conjunctive.
    $('flTripwireStatusV').innerHTML =
      where + ' &middot; ' +
      '<strong>' + Math.round(t.daysBelow) + ' of ' + TRIPWIRE.days + '</strong> consecutive days below the ' + TRIPWIRE.depthPct + '% line &middot; ' +
      'the tripwire has ' + (t.firedModern ? '<strong>fired</strong>' : 'never fired') + ' in the modern era (2011&ndash;). ' +
      'It would arm at ' + usd(t.thresholdPrice) + ' today.';
  }

  // ═══════════════════════════════════════════════════════════
  // VERIFY
  // ═══════════════════════════════════════════════════════════
  function renderVerify() {
    var rows = [
      ['Price series',
       PL_DATA.length + ' samples, ' + isoOf(PL_DATA[0][0]) + ' to ' + isoOf(PL_DATA[PL_DATA.length - 1][0]) + ', on a ~12-day grid. ' +
       'Intraday and daily excursions between samples are invisible to it, so every depth and duration on this page is a <em>lower bound</em>.'],
      ['Series freshness',
       // Reader-facing, not just the module's console-only staleness guard: anyone
       // checking a historical figure on this page is entitled to know how old the
       // series behind it is without opening a console.
       'The most recent sample is <strong>' + isoOf(PL_DATA[PL_DATA.length - 1][0]) + '</strong>, ' +
       seriesAgeDays() + ' days ago. Everything historical on this page — the episodes, the entry set, the parity medians — ' +
       'stops there. Today’s spot, the hero distance and the tripwire status do not: those are live, and can therefore sit ' +
       'well away from the last sample, as they do now.'],
      ['Channel coefficients',
       'a = 1.6&times;10<sup>&minus;17</sup>, b = 5.77 (the published M&#279;zinskis / <a href="https://www.porkopolis.io/thechart/" target="_blank" rel="noopener">Porkopolis</a> calibration), floor = 0.42&times; trend, upper band = 3&times; trend. Shared module, unmodified.'],
      ['Live spot',
       spotSource === 'live' ? 'Fetched live this pageload.' : 'The live fetch did not resolve; the latest series sample is standing in, and every figure that depends on it is labelled accordingly.'],
      ['The four episodes',
       'Static, from <code>analysis/2026-08-20-power-law-floor.md</code> §2 &mdash; historical facts that do not refresh. <code>floorParityQA()</code> recomputes them from the series on every load and fails loudly if they no longer match.'],
      ['Quantile fits',
       'Static, from the same note §1: pinball-loss quantile regressions at &tau; = 0.02 to 0.50, each fitted with a free slope. Not recomputed in-browser.'],
      ['The parity measurement',
       'Recomputed here at load from the series, following the note’s method. Excess is the median of per-entry differences, not the difference of the medians.'],
      ['Self-check',
       'Open the console and run <code>floorParityQA()</code>. It re-derives the medians at the analysis’s own endpoint and asserts them to &plusmn;0.1pp, checks the episode dataset against the series, and reports today’s live figures alongside.']
    ];
    $('flVerify').innerHTML = rows.map(function (r) {
      return '<div class="fl-verify-row"><div class="fl-verify-k">' + r[0] + '</div><div class="fl-verify-v">' + r[1] + '</div></div>';
    }).join('');
  }

  // ═══════════════════════════════════════════════════════════
  // WIRING + INIT
  // ═══════════════════════════════════════════════════════════
  // Two endpoint toggles now — one above the parity card, one directly above
  // the scatter so the control is in reach of the chart it changes. They are
  // two views of ONE state: any click re-syncs every button on the page, so the
  // pair can never disagree about which endpoint is selected.
  function syncEndpointButtons() {
    var btns = document.querySelectorAll('.fl-seg-btn[data-endpoint]');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-endpoint') === endpointMode;
      btns[i].classList.toggle('is-active', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }

  function wire() {
    var btns = document.querySelectorAll('.fl-seg-btn[data-endpoint]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        endpointMode = this.getAttribute('data-endpoint');
        syncEndpointButtons();
        renderParity();
      });
    }
    var reset = $('flZoomReset');
    if (reset) reset.addEventListener('click', function () {
      activeEpisode = null;
      zoomChartTo(null);
      if (channelChart) channelChart.update();
    });
    // Double-click the chart also clears the zoom.
    var wrap = $('flChannelChart');
    if (wrap) wrap.addEventListener('dblclick', function () {
      activeEpisode = null; zoomChartTo(null); if (channelChart) channelChart.update();
    });
  }

  function renderAll() {
    renderHero();
    renderParity();
    renderTripwire();
    renderVerify();
  }

  function init() {
    if (!$('flHeroFigure')) return;
    buildChannelChart();
    renderEpisodeStrip();
    wire();
    renderAll();

    if (typeof fetchTodayPrice === 'function') {
      try {
        fetchTodayPrice(function (price, source) {
          if (isFinite(price) && price > 0) { spot = price; spotSource = source; }
          renderAll();
        });
      } catch (e) { /* offline / blocked — the seeded read stands */ }
    }

    // Build-time assertion, per the design doc: assert, don't assume.
    var qa = floorParityQA();
    if (qa.pass) {
      console.log('[floor-qa] pass — parity fixture ' + qa.fixture.realized + '% / ' + qa.fixture.trend + '% at ' +
                  qa.fixture.endpoint + ', ' + qa.episodes.length + ' episodes verified against the series.');
    }
  }

  window.floorParityQA = floorParityQA;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
