// ─── Bitcoin vs. Rental Property — page scripts (v0.1 / Phase 1)
//     Currently scoped to a single component: the Entry-Timing Indicator,
//     which renders BTC's current multiple-of-trend with a categorical
//     label (Favorable / Neutral / Elevated). Data comes from the canonical
//     shared/power-law-data.js (PL_DATA, TODAY_PRICE, fetchTodayPrice).
//
//     The indicator is conservative on thresholds: Favorable ≤ 1.0× trend,
//     Neutral 1.0×–1.5×, Elevated > 1.5×. Bar scale runs 0×–3× (the upper
//     band) so the marker has visual room across the full channel.
//
//     First-paint uses the seeded TODAY_PRICE (current as of the monthly
//     data refresh); fetchTodayPrice replaces it with the live spot when a
//     live source answers. The render path uses display-only DOM updates
//     to avoid layout thrash on the live-price replacement.
//
//     Calculator (Phase 2) will live in a separate IIFE in this file.

(function(){
  function categorize(multiple){
    if (multiple <= 1.0) return { label: 'Favorable', cls: 'favorable',
      copy: 'Bitcoin sits at or below long-term trend. Structurally favorable entry conditions.' };
    if (multiple <= 1.5) return { label: 'Neutral', cls: 'neutral',
      copy: 'Bitcoin trades modestly above trend. Entry conditions are neutral — no urgency, no obstruction.' };
    return { label: 'Elevated', cls: 'elevated',
      copy: 'Bitcoin trades meaningfully above trend. Forward CAGR compresses from elevated entry; consider averaging in or waiting.' };
  }

  function render(source){
    var card = document.getElementById('eti-card');
    if (!card) return;
    // Honest liveness tag: the entry multiple is derived from TODAY_PRICE, which
    // is the latest PL_DATA sample until a live fetch resolves — tagged with
    // that sample's date, never "live".
    var tagEl = document.getElementById('etiLiveTag');
    if (tagEl) tagEl.textContent = (typeof todayPriceIsLive === 'function' && todayPriceIsLive(source)) ? '· Live' : '· As of ' + lastSampleDateShort();

    // Defensive: shared globals must be present (page_scripts ordering
    // ensures power-law-data.js is concatenated before this file).
    if (typeof plPrice !== 'function' || typeof PL_DATA === 'undefined' ||
        typeof GENESIS_TS !== 'number') {
      return;
    }

    var todayDays = (Date.now() / 1000 - GENESIS_TS) / 86400;
    var trendPrice = plPrice(todayDays);
    var livePrice = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
      ? TODAY_PRICE : PL_DATA[PL_DATA.length - 1][1];
    var multiple = livePrice / trendPrice;
    var cat = categorize(multiple);

    // Bar scale: 0× to 3× trend (the upper band). Clamp marker to [2, 98]
    // so it never sits flush against the edges of the gradient bar.
    var pct = Math.min(98, Math.max(2, (multiple / 3.0) * 100));

    // Multiple value
    var mEl = card.querySelector('.eti-multiple-value');
    if (mEl) mEl.textContent = multiple.toFixed(2);

    // Label (replace classes — keep just the base class + categorical mod)
    var lEl = card.querySelector('.eti-label');
    if (lEl) {
      lEl.className = 'eti-label ' + cat.cls;
      lEl.textContent = cat.label;
    }

    // Marker position
    var markerEl = card.querySelector('.eti-marker');
    if (markerEl) markerEl.style.left = pct + '%';

    // Copy
    var copyEl = card.querySelector('.eti-copy');
    if (copyEl) copyEl.textContent = cat.copy;
  }

  function init(){
    render(); // first-paint with seeded TODAY_PRICE so nothing is empty

    if (typeof fetchTodayPrice === 'function') {
      fetchTodayPrice(function(price, source){
        // TODAY_PRICE is updated in place by the shared fetch helper.
        render(source);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ─── Power Law figures quoted in the prose ───────────────────────────
// Copy-rendering only (no engine change): fills the growth figures the
// Bitcoin Case tab and the $500K table quote, so the copy is computed
// from shared/power-law-data.js instead of hardcoded. All figures use the
// "stay at today's multiple" case: the multiple-of-trend is held, so the
// growth factor is plPrice(t1) / plPrice(t0) and doesn't depend on spot.
// Same formula and 365-day year as the calculator's 'stay' chip
// (scenarioGrowthFactor, now in shared/real-estate-model.js), so the prose
// and the chip agree.
//   data-pl-cagr="a,b"      annualised growth from year a to year b, "29%"
//   data-pl-stay-fv="amt"   amt grown over data-years (default 10), "$813K";
//                           data-show="gain" prints the gain instead
(function(){
  function render(){
    if (typeof plPrice !== 'function' || typeof GENESIS_TS !== 'number') return;
    var d = (Date.now() / 1000 - GENESIS_TS) / 86400;
    // 365.25-day years, as in the shared engine (M10, PR 4a).
    function factor(a, b){ return plPrice(d + b * 365.25) / plPrice(d + a * 365.25); }
    document.querySelectorAll('[data-pl-cagr]').forEach(function(el){
      var p = el.getAttribute('data-pl-cagr').split(',');
      var a = Number(p[0]), b = Number(p[1]);
      el.textContent = ((Math.pow(factor(a, b), 1 / (b - a)) - 1) * 100).toFixed(0) + '%';
    });
    document.querySelectorAll('[data-pl-stay-fv]').forEach(function(el){
      var amt = Number(el.getAttribute('data-pl-stay-fv'));
      var yrs = Number(el.getAttribute('data-years')) || 10;
      var v = amt * factor(0, yrs);
      if (el.getAttribute('data-show') === 'gain') v -= amt;
      el.textContent = '$' + Math.round(v / 1000).toLocaleString('en-US') + 'K';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();

// ─── Rates quoted in the copy (PR 4d; rulings §7, item 12) ───────────
// One dated object, RealEstateModel.YIELD_RATES, drives the calculator,
// the rate labels, the $500K example's rate-dependent cells and the
// stablecoin-lending disclosure, so the monthly refresh is one edit.
//   data-yr="strc|sata|lending"   the rate, "12%"
//   data-yr="asof"                the as-of month, "September 2026"
//   data-yr-ex="…"                a $500K-example figure (see EX below)
(function(){
  function render(){
    var RE = window.RealEstateModel;
    if (!RE || !RE.YIELD_RATES) return;
    var R = RE.YIELD_RATES;
    function pct(v){ return parseFloat(Number(v).toFixed(2)) + '%'; }
    function usd(v){ return '$' + Math.round(v).toLocaleString('en-US'); }
    function near(v, step){ return Math.round(v / step) * step; }
    document.querySelectorAll('[data-yr]').forEach(function(el){
      var k = el.getAttribute('data-yr');
      el.textContent = k === 'asof' ? R.asOf : pct(R[k]);
    });
    // The $500K example: one unencumbered $500K rental sold, about $417K
    // after federal tax (the Path 1 worked example), split 45/30/10/15.
    var base = 417000;
    var a = { strc: base * 0.45, sata: base * 0.30, lend: base * 0.10 };
    var y = { strc: a.strc * R.strc / 100, sata: a.sata * R.sata / 100, lend: a.lend * R.lending / 100 };
    var total = y.strc + y.sata + y.lend;
    var EX = {
      'strc-y1': usd(y.strc), 'sata-y1': usd(y.sata), 'lend-y1': usd(y.lend),
      'total-y1': '~' + usd(near(total, 100)), 'roc-y1': '~' + usd(near(y.strc + y.sata, 100)),
      'blended': (total / base * 100).toFixed(1) + '%',
      'ten-year': '~$' + Math.round(total * 10 / 1000).toLocaleString('en-US') + 'K',
      'ratio': (total / 22000).toFixed(1)
    };
    document.querySelectorAll('[data-yr-ex]').forEach(function(el){
      var v = EX[el.getAttribute('data-yr-ex')];
      if (v !== undefined) el.textContent = v;
    });
    // The disclosure under the calculator: the verifiable rates this month.
    var box = document.getElementById('calc-rates-rows');
    if (box) {
      box.innerHTML = R.verifiable.map(function(v){
        return '<tr><td>' + v.name + '<span class="calc-rates-sub">' + v.kind + ' \u00b7 ' + v.source + '</span></td>' +
               '<td class="numeric">' + Number(v.rate).toFixed(2) + '%</td><td>' + v.us + '</td></tr>';
      }).join('');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();

// ─── Calculator (Phase 2 v0.1) ───────────────────────────────────────
// Interactive head-to-head between rental property and bitcoin paths.
// Replaces the Section 7 "Coming Soon" placeholder.
//
// Math model documented in BITCOIN_VS_RENTAL_PROPERTY_CALCULATOR_DESIGN_1.md.
// Continuous: every slider movement re-renders. No "Compute" button.
//
// v0.1 simplifications (to be relaxed in future iterations):
// - Net rental yield is taken as a direct user input rather than computed
//   from gross via the §2 waterfall. Slider default ~4.4% nets to the
//   editorial's $20-24K on a $500K property.
// - BTC CAGR is flat over the holding period (declining-CAGR in v0.2).
// - ROC distributions treated as untaxed for the full holding period. In fact
//   ROC is tax-deferred: basis runs out after ~8 years at 12-13% yields, then
//   distributions are capital gains, and the lower basis raises the gain at
//   sale. Basis exhaustion is logged for PR 5 (Prompt 5).
// - State tax is a single rate per state, no AMT/local nuances.
// - HELOC modeled as interest-only with balloon repayment at end of term.

(function bvrpCalculator(){
  'use strict';

  // ─── State ───
  var state = {
    path: 4,
    propertyValue: 500000,
    netRentalYield: 4.4,       // % net (post-waterfall)
    holdingYears: 10,
    stateCode: 'OTHER',          // typical ~5% — user selects their actual state for accuracy
    federalBracketPct: 24,     // 12, 22, 24, 32, 35, 37
    adjustedBasisPct: 60,      // % of current value
    yearsAlreadyHeld: 10,
    // Bitcoin scenario, one set on both pages (rulings M3, PR 4c):
    // 'floor' | 'stay' | 'trend' | 'upper'. Default Stay at today's multiple
    // (was 'trend'); the markup's active chip must match.
    btcScenario: 'stay',
    helocLtv: 80,
    helocRatePct: 9.5,
    // The existing mortgage, per property (PR 4d, rulings M8): every path
    // now carries or repays it. Defaults: RealEstateModel.RENTAL_DEFAULTS.
    existingMortgage: window.RealEstateModel.RENTAL_DEFAULTS.existingMortgage,
    mortgageRatePct: window.RealEstateModel.RENTAL_DEFAULTS.mortgageRatePct,
    mortgageYearsLeft: window.RealEstateModel.RENTAL_DEFAULTS.mortgageYearsLeft,
    numProperties: 3,
    propertiesRetained: 2,     // derived sold = numProperties - propertiesRetained
    // The third slice was Ledn at 5%; it is now generic stablecoin lending
    // at the dated rate (PR 4d; rulings §7, item 12).
    portfolio: { strc: 45, sata: 30, lend: 10, spot: 15 },
    includeSweatEquity: false,
    // Nominal home appreciation, %/yr. The pair's shared input,
    // lcs.homeApprNominal (PR 4a, rulings M1); was a hardcoded 3.0.
    // bindBaseline() sets it from ModelingAssumptions before first render.
    appreciationPct: 4.68,
    // PR 4b (rulings M6): selling costs, one default on both pages (was a
    // hardcoded 8%), and the cost of each bitcoin purchase (was free).
    sellCostPct: window.RealEstateModel.PAIR_DEFAULTS.sellPct,
    btcTxPct: window.RealEstateModel.PAIR_DEFAULTS.btcTxPct,
    // PR 4f (design §7; rulings M1, P5): the display frame. Everything is
    // computed in nominal dollars; 'real' divides each year's value by that
    // year's inflation factor (RealEstateModel.toReal, the deflator Bitcoin
    // vs. Real Estate uses), at the sitewide rate (lcs.inflation). The
    // markup's active button must match. Not stored: like BvRE's toggle, a
    // fresh load shows the default.
    displayMode: 'real'
  };

  // ─── Engine: shared/real-estate-model.js ───
  // The rental, tax, bitcoin-path and yield-portfolio math moved to the
  // shared module in PR 3 (byte-identical). Local aliases keep every
  // call site below unchanged.
  var RE = window.RealEstateModel;
  var STATE_CAPGAIN = RE.STATE_CAPGAIN;
  var currentBTCMultiple = RE.currentBTCMultiple;
  var effectiveCAGR = RE.effectiveCAGR;
  var computeAll = RE.computeAll;
  var calcWealthTrajectory = RE.calcWealthTrajectory;

  // ─── Formatters ───
  function fmtMoney(n){
    if (n === undefined || isNaN(n)) return '—';
    var abs = Math.abs(n);
    if (abs >= 1000000) return (n < 0 ? '-' : '') + '$' + (abs/1000000).toFixed(2) + 'M';
    if (abs >= 1000)    return (n < 0 ? '-' : '') + '$' + (abs/1000).toFixed(1) + 'K';
    return (n < 0 ? '-' : '') + '$' + Math.round(abs).toLocaleString();
  }
  function fmtPct(n){ return (n*100).toFixed(1) + '%'; }
  // The dated rates (PR 4d): the Path 4 rows quote them.
  var YR = window.RealEstateModel.YIELD_RATES;
  // Path 1's rows between tax and deployment: the mortgage repayment when
  // there is one (M8); with none, the rows are as before PR 4d.
  function repaidRows(netCash, repaid){
    return repaid > 0
      ? '<div><span>Net cash after tax</span><strong>' + fmtMoneyFull(netCash) + '</strong></div>' +
        '<div><span>Existing mortgage repaid</span><strong>-' + fmtMoneyFull(repaid) + '</strong></div>'
      : '';
  }
  // When the sale doesn't cover the mortgage (M8), say so where it happens.
  function shortfallNote(shortfall){
    return shortfall > 0
      ? '<div class="calc-detail-warn">The sale doesn\u2019t cover the mortgage: ' + fmtMoneyFull(shortfall) + ' has to come from other money, so it counts against this path.</div>'
      : '';
  }
  function fmtMoneyFull(n){
    if (n === undefined || isNaN(n)) return '—';
    return (n < 0 ? '-' : '') + '$' + Math.round(Math.abs(n)).toLocaleString();
  }

  // ─── The display frame (PR 4f) ───
  // Nominal is the engine's own output, untouched. Real divides a value at
  // year t by (1 + inflation)^t through the shared deflator, so a value, the
  // difference between the paths and the chart all move by one factor per
  // year and the Real view can never change which path is ahead. Cash flows
  // (year 1, cumulative sums) and the sale mechanics stay nominal, as paid,
  // in both views, as on Bitcoin vs. Real Estate.
  function isReal(){ return state.displayMode === 'real'; }
  function inflPct(){
    var MA = window.ModelingAssumptions;
    return MA ? MA.get('inflation').value : 6.5;
  }
  function inFrame(v, t){ return isReal() ? RE.toReal(v, inflPct(), t) : v; }
  // "deflated at 6.5% a year (M2 growth)", named as on the Real label (P5).
  function deflatorPhrase(){
    return window.RealEstateBaseline ? window.RealEstateBaseline.deflatorPhrase() : 'deflated at ' + inflPct() + '% a year';
  }

  // ─── Renderers ───

  // ─── Chart.js rendering ───
  // Five datasets, dataset indices stable (legendVisibility maps to these):
  //   0 = Keep rental (amber dashed)
  //   1 = Bitcoin: Stay at today's multiple
  //   2 = Bitcoin: Trend
  //   3 = Bitcoin: Upper
  //   4 = Bitcoin: Floor (PR 4c; drawn faintly unless it is the selection)
  // The chip selection (state.btcScenario) determines which line is the
  // "primary" (bold) and which scenario drives the headline / table /
  // path-detail numbers. The user can toggle individual lines via the
  // custom legend.
  var chartInstance = null;
  // Legend visibility defaults: keep-rental, the default-primary scenario
  // (Stay) and Floor, which M3 draws faintly on every chart. Clicking a
  // different chip auto-hides the old primary (never Floor) and shows the
  // new one; manual toggles on the others persist across chip switches.
  var legendVisibility = { 0: true, 1: true, 2: false, 3: false, 4: true };
  var chartZoom = 'full';  // 'full' | 'first3' — toggleable via UI above the chart

  // Colors for the five datasets, distinguishable on dark. Upper uses a
  // distinct hue and is dashed (a stress test, never sustained in the
  // record); Floor is a muted grey, dotted, and faint unless selected.
  var CHART_COLORS = {
    rental:    '#e09422',  // amber, dashed
    stay:      '#b87a4a',  // warm brown (the default)
    trend:     '#5a8a3a',  // canonical site green
    upper:     '#5fa8d8',  // cool blue, dashed
    floor:     '#9d958a',  // muted grey, dotted
    floorFaint: 'rgba(157,149,138,0.55)'
  };

  function renderChart(s){
    var canvas = document.getElementById('calc-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    var trajStay  = calcWealthTrajectory(s, 'stay');
    var trajTrend = calcWealthTrajectory(s, 'trend');
    var trajUpper = calcWealthTrajectory(s, 'upper');
    var trajFloor = calcWealthTrajectory(s, 'floor');

    // Zoom: if 'first3', slice to the first 4 years (Y0..Y3) so the
    // short-term tax-leakage dip is visible. Auto-scaling y-axis will
    // tighten the value range around the smaller numbers, making the
    // early dynamics legible.
    var endIdx = chartZoom === 'first3' ? Math.min(3, s.holdingYears) : s.holdingYears;
    function slice(arr){ return arr.slice(0, endIdx + 1); }

    // Each year's point in the display frame (PR 4f): nominal as computed,
    // or divided by that year's inflation factor in the Real view.
    var labels = slice(trajTrend).map(function(r){ return 'Y' + r.year; });
    var keepData  = slice(trajTrend).map(function(r){ return inFrame(r.wealthKeep, r.year); });
    var pathStay  = slice(trajStay).map(function(r){ return inFrame(r.wealthPath, r.year); });
    var pathTrend = slice(trajTrend).map(function(r){ return inFrame(r.wealthPath, r.year); });
    var pathUpper = slice(trajUpper).map(function(r){ return inFrame(r.wealthPath, r.year); });
    var pathFloor = slice(trajFloor).map(function(r){ return inFrame(r.wealthPath, r.year); });

    function primary(scenario){ return scenario === s.btcScenario; }

    var datasets = [
      {
        label: 'Keep rental',
        data: keepData,
        borderColor: CHART_COLORS.rental,
        backgroundColor: CHART_COLORS.rental,
        borderWidth: 2,
        borderDash: [4, 3],
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.1,
        order: 2,
        hidden: !legendVisibility[0]
      },
      {
        label: 'Bitcoin · Stay at today\u2019s multiple',
        data: pathStay,
        borderColor: CHART_COLORS.stay,
        backgroundColor: CHART_COLORS.stay,
        borderWidth: primary('stay') ? 2.75 : 1.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.18,
        order: primary('stay') ? 1 : 4,
        hidden: !legendVisibility[1]
      },
      {
        label: 'Bitcoin · Trend',
        data: pathTrend,
        borderColor: CHART_COLORS.trend,
        backgroundColor: CHART_COLORS.trend,
        borderWidth: primary('trend') ? 2.75 : 1.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.18,
        order: primary('trend') ? 1 : 4,
        hidden: !legendVisibility[2]
      },
      {
        label: 'Bitcoin · Upper',
        data: pathUpper,
        borderColor: CHART_COLORS.upper,
        backgroundColor: CHART_COLORS.upper,
        borderWidth: primary('upper') ? 2.75 : 1.5,
        borderDash: [5, 4],  // dashed — historical spikes, never sustained
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.18,
        order: primary('upper') ? 1 : 4,
        hidden: !legendVisibility[3]
      },
      {
        // Floor (M3): drawn faintly on every chart; bold when selected.
        label: 'Bitcoin · Floor',
        data: pathFloor,
        borderColor: primary('floor') ? CHART_COLORS.floor : CHART_COLORS.floorFaint,
        backgroundColor: primary('floor') ? CHART_COLORS.floor : CHART_COLORS.floorFaint,
        borderWidth: primary('floor') ? 2.75 : 1.25,
        borderDash: [2, 3],
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.18,
        order: primary('floor') ? 1 : 5,
        hidden: !legendVisibility[4]
      }
    ];

    if (chartInstance) {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets = datasets;
      // 'resize' invalidates the layout cache (per STYLE_GUIDE §6.14);
      // safer than 'none' when the chart may have initialized in a
      // display:none container.
      chartInstance.update('resize');
      return;
    }

    chartInstance = new Chart(canvas, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },  // custom legend rendered below the chart
          tooltip: {
            backgroundColor: 'rgba(15,14,13,0.95)',
            borderColor: 'rgba(224,148,34,0.3)',
            borderWidth: 1,
            titleColor: '#ece4d6',
            bodyColor: '#ccc6b8',
            padding: 10,
            cornerRadius: 4,
            callbacks: {
              label: function(ctx){
                return ctx.dataset.label + ': ' + fmtMoney(ctx.parsed.y);
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(204,198,184,0.6)', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(204,198,184,0.6)',
              font: { size: 11 },
              callback: function(v){ return fmtMoney(v); }
            }
          }
        }
      }
    });
  }

  // Per-scenario tooltip content, shared by the chip help-tips and the
  // legend help-tips. The set and wording follow rulings M3 (PR 4c): Trend
  // carries the ruled sentence verbatim; Stay is worded for bitcoin's
  // position without judging it; Upper's record is computed from the price
  // data (RealEstateModel.upperRecordText), so it can't go stale.
  function scenarioTipHTML(scenario){
    if (scenario === 'stay') {
      var mult = currentBTCMultiple();
      var base = 'Bitcoin keeps today\u2019s multiple of the Power Law trend (' + mult.toFixed(2) + '\u00d7), so it grows at the trend\u2019s own rate from today\u2019s price. No reversion is assumed in either direction. This is the default.';
      if (mult < 0.95) return base + ' Bitcoin is below trend today, so this assumes the gap stays open; Trend assumes it closes.';
      if (mult > 1.05) return base + ' Bitcoin is above trend today, so this assumes the premium persists; Trend assumes it closes.';
      return base + ' Bitcoin is close to trend today, so this and Trend give similar results.';
    }
    if (scenario === 'trend') {
      return 'Assumes the gap to trend closes in a straight line by the horizon end. In the record, reversion has been irregular in timing.';
    }
    if (scenario === 'floor') {
      return 'Bitcoin\u2019s multiple moves in a straight line from today\u2019s to 0.42\u00d7 the Power Law trend, the channel\u2019s lower bound, by the end of the holding period. Price has approached the floor three times since the genesis era and gone below it by 5.1% at most (2015), and each time it moved back above; the one deep breach, 42.6% below, was in 2010, in the genesis era (<a href="/the-bitcoin-floor">see The Floor</a>). Drawn faintly on the chart whichever scenario you pick.';
    }
    if (scenario === 'upper') {
      var rec = window.RealEstateModel.upperRecordText();
      return 'Bitcoin\u2019s multiple moves in a straight line from today\u2019s to 2.5\u00d7 the Power Law trend by the end of the holding period: a stress test, not a forecast.' +
             (rec ? ' For scale, ' + rec + '.' : '') +
             ' Worth modeling as a possible window for disciplined rebalancing or partial divestment: see <a href="/disciplined-rebalancing">Disciplined Rebalancing</a>.';
    }
    return '';
  }

  // Custom legend: clickable items toggle dataset visibility. Pattern
  // adapted from the-bitcoin-retirement.js wireLegendToggles().
  // Help-tip clicks inside legend items are excluded so the ? glyph
  // never toggles the line — it has its own hover/focus behavior.
  function renderChartLegend(){
    var el = document.getElementById('calc-chart-legend');
    if (!el) return;
    var rows = [
      { idx: 0, label: 'Keep rental', color: CHART_COLORS.rental, dashed: true,
        tip: 'Net wealth if you keep the rental, collecting after-tax cash flow each year. Mark-to-market &mdash; the property\u2019s market value is included without applying the exit tax that would arise on sale.' },
      { idx: 4, label: 'Bitcoin \u00b7 Floor', color: CHART_COLORS.floor, dashed: true,  // dotted on the chart
        tip: scenarioTipHTML('floor') },
      { idx: 1, label: 'Bitcoin \u00b7 Stay at today\u2019s multiple', color: CHART_COLORS.stay,
        tip: scenarioTipHTML('stay') },
      { idx: 2, label: 'Bitcoin \u00b7 Trend', color: CHART_COLORS.trend,
        tip: scenarioTipHTML('trend') },
      { idx: 3, label: 'Bitcoin \u00b7 Upper', color: CHART_COLORS.upper,
        dashed: true,  // visually less confident — matches dashed chart line
        tip: scenarioTipHTML('upper') }
    ];
    var html = rows.map(function(r){
      var off = legendVisibility[r.idx] ? '' : ' off';
      var swatchStyle = 'background:' + r.color + (r.dashed ?
        ';background-image:repeating-linear-gradient(90deg,' + r.color + ' 0,' + r.color + ' 4px,transparent 4px,transparent 7px);background-color:transparent' : '');
      return '<span class="legend-item' + off + '" data-dataset-idx="' + r.idx +
             '" tabindex="0" role="button" aria-pressed="' + (legendVisibility[r.idx] ? 'true' : 'false') + '">' +
             '<span class="swatch" style="' + swatchStyle + '"></span>' +
             '<span class="legend-label">' + r.label + '</span>' +
             '<span class="help-tip" tabindex="0">?<span class="tip-content">' + r.tip + '</span></span>' +
             '</span>';
    }).join('');
    el.innerHTML = '<div class="legend-hint">click any item to hide / show that line</div>' + html;
    wireLegendToggles();
  }

  function wireLegendToggles(){
    var items = document.querySelectorAll('#calc-chart-legend .legend-item[data-dataset-idx]');
    items.forEach(function(item){
      function toggle(){
        var idx = parseInt(item.getAttribute('data-dataset-idx'), 10);
        if (isNaN(idx)) return;
        var nowVisible = !legendVisibility[idx];
        legendVisibility[idx] = nowVisible;
        item.classList.toggle('off', !nowVisible);
        item.setAttribute('aria-pressed', nowVisible ? 'true' : 'false');
        if (chartInstance) {
          chartInstance.setDatasetVisibility(idx, nowVisible);
          chartInstance.update('none');
        }
      }
      item.addEventListener('click', function(e){
        if (e.target.closest('.help-tip')) return;
        toggle();
      });
      item.addEventListener('keydown', function(e){
        if (e.target.closest('.help-tip')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  function scenarioLabel(scenario){
    if (scenario === 'floor') return 'Floor';
    if (scenario === 'trend') return 'Trend';
    if (scenario === 'upper') return 'Upper';
    return 'Stay at today\u2019s multiple';
  }

  // Path-specific plain-English description rendered below the path
  // toggle. Helps users who land on the calculator directly (deep link
  // from email, share, etc.) without first reading The Four Paths tab.
  // HELOC path includes a contextual link to the editorial section
  // since "HELOC" is jargon that needs unpacking for a non-finance
  // audience.
  function renderPathDescription(){
    var el = document.getElementById('calc-path-description');
    if (!el) return;
    var descByPath = {
      1: '<strong>Outright Sell.</strong> Sell the rental outright, pay the tax bill up front, redeploy net proceeds into spot bitcoin. The cleanest exit &mdash; cash flow stops, capital concentrates in a single asset, full bitcoin upside on what survives the tax leakage.',
      2: '<strong>HELOC + Bitcoin.</strong> Tap your home&rsquo;s equity via a Home Equity Line of Credit and buy bitcoin without selling the rental. No immediate tax event; ongoing interest carry to service from personal income. Layered leverage &mdash; structurally a leveraged bitcoin position with the rental as collateral. <a href="#paths">More on HELOC mechanics &rarr;</a>',
      3: '<strong>Partial Sale.</strong> If you have multiple rental properties, sell some but not all of them. The sold properties&rsquo; proceeds redeploy into the bitcoin yield portfolio; the retained ones keep producing rental cash flow. The middle path &mdash; partial conviction, partial diversification.',
      4: '<strong>Sell + Yield Portfolio.</strong> Sell the rental, take the tax hit, redeploy net proceeds into a portfolio of bitcoin-treasury yield instruments (STRC, SATA) plus a spot bitcoin slice. Preserves monthly income at a higher yield than the rental produced; swaps tenant-and-property risk for issuer-credit risk.'
    };
    el.innerHTML = descByPath[state.path] || '';
  }

  function renderHeadline(results, s){
    var el = document.getElementById('calc-headline');
    if (!el) return;
    // The totals at the horizon in the display frame (PR 4f); nominal as before.
    var real = isReal(), H = s.holdingYears;
    var delta = inFrame(results.path.totalWealth, H) - inFrame(results.keep.totalWealth, H);
    var inToday = real ? ' in today\u2019s dollars' : '';
    var rentalAnn = results.keep.annual.afterTax;
    var bitcoinAnn = results.path.year1CashFlow;
    var ratio = rentalAnn > 0 ? (bitcoinAnn / rentalAnn) : 0;

    var pathName = ['', 'Outright Sell + Spot Bitcoin',
                    'HELOC + Bitcoin', 'Partial Portfolio Sale + Yield', 'Sell + Yield Portfolio'][s.path];

    // Path-specific tradeoff reminder. The user has just made a decision;
    // this line surfaces what that decision *gives up* in exchange for
    // what the headline number promises. Honest framing — these are
    // tradeoffs, not free lunches.
    var explainerByPath = {
      1: 'You\u2019re foregoing operational cash flow and the property\u2019s tax-deferred appreciation in exchange for a higher terminal asset value &mdash; if bitcoin grows as the scenario suggests.',
      2: 'You\u2019re retaining the rental and layering on a leveraged bitcoin position. The HELOC carry must be serviced from personal income through any bitcoin drawdown &mdash; a real and asymmetric risk in the early years.',
      3: 'You\u2019re partially exiting &mdash; keeping some rental cash flow while gaining bitcoin exposure on the sold portion. Mental load and operational risk on the retained properties remain.',
      4: 'You\u2019re foregoing operational landlord cash flow in exchange for higher yield-instrument cash flow plus bitcoin appreciation. The trade preserves monthly income but swaps tenant-and-property risk for issuer-credit risk.'
    };

    var verdict, color;
    if (delta > 0) {
      verdict = '<strong>' + pathName + ' results in ' + fmtMoney(delta) +
                ' more asset value</strong>' + inToday + ' than keeping the rental over ' + s.holdingYears + ' years';
      if (ratio >= 1.3 && bitcoinAnn > 0) {
        verdict += ', with about <strong>' + ratio.toFixed(1) + '&times;</strong> the Year 1 cash flow';
      }
      verdict += '.';
      color = 'positive';
    } else {
      verdict = '<strong>Keeping the rental produces ' + fmtMoney(-delta) +
                ' more asset value</strong>' + inToday + ' than ' + pathName + ' under your inputs. The decision is close &mdash; try adjusting the bitcoin scenario, holding period, or path.';
      color = 'neutral';
    }
    var explainer = '<span class="calc-headline-explainer">' + explainerByPath[s.path] + '</span>';
    var hedge = '<span class="calc-headline-hedge">Under the <strong>' + scenarioLabel(s.btcScenario) +
                '</strong> bitcoin scenario and your specific inputs' +
                (real ? '; values in today\u2019s dollars, ' + deflatorPhrase() : '') + '.</span>';
    el.innerHTML = '<div class="calc-headline-verdict ' + color + '">' + verdict + '</div>' + explainer + hedge;
  }

  function renderComparison(results, s){
    var el = document.getElementById('calc-comparison-body');
    if (!el) return;
    var pathName = ['', 'Sell + Spot Bitcoin', 'HELOC + Bitcoin', 'Partial Sale + Yield', 'Sell + Yield Portfolio'][s.path];

    var rentalY1 = results.keep.annual.afterTax;
    var bitcoinY1 = results.path.year1CashFlow;
    // The totals follow the display frame (PR 4f); the cash flows and the
    // mortgage stay nominal, as paid, and say so in the Real view.
    var real = isReal();
    var rentalTotal = inFrame(results.keep.totalWealth, s.holdingYears);
    var bitcoinTotal = inFrame(results.path.totalWealth, s.holdingYears);
    var winnerClass = bitcoinTotal > rentalTotal ? 'win-bitcoin' : 'win-rental';

    // The existing mortgage (M8, PR 4d): kept rentals carry it, sales repay it.
    var k0 = results.keep;
    var carried = k0.mortgage0 > 0
      ? fmtMoneyFull(k0.mortgage0) + ' carried: ' + fmtMoneyFull(k0.mortgagePayment * 12) + ' a year in payments, ' + fmtMoneyFull(k0.mortgageEnd) + ' left after ' + s.holdingYears + ' years'
      : 'None';
    var pathMortgage;
    if (s.path === 2) {
      var rr = results.path.retainedRental;
      pathMortgage = rr.mortgage0 > 0 ? fmtMoneyFull(rr.mortgage0) + ' carried, plus the HELOC' : 'The HELOC only';
    } else if (s.path === 3) {
      var r3m = results.path;
      pathMortgage = r3m.mortgageRepaid > 0
        ? fmtMoneyFull(r3m.mortgageRepaid) + ' repaid from the sale; ' + fmtMoneyFull(r3m.retainedRental.mortgage0) + ' carried on the ' + r3m.retained + ' kept'
        : 'None';
    } else {
      pathMortgage = results.path.mortgageRepaid > 0 ? fmtMoneyFull(results.path.mortgageRepaid) + ' repaid from the sale' : 'None';
    }
    var anyMortgage = k0.mortgage0 > 0;
    el.innerHTML = '' +
      '<tr><td>Year 1 cash flow (after tax' + (anyMortgage ? ' and mortgage payments' : '') + (real ? '; nominal' : '') + ')</td>' +
        '<td class="numeric">' + fmtMoneyFull(rentalY1) + '</td>' +
        '<td class="numeric">' + fmtMoneyFull(bitcoinY1) + '</td></tr>' +
      '<tr><td>' + s.holdingYears + '-year cumulative cash flow' + (real ? ' (nominal sum)' : '') + '</td>' +
        '<td class="numeric">' + fmtMoneyFull(results.keep.cumulativeCash) + '</td>' +
        '<td class="numeric">' + fmtMoneyFull(s.path === 2 ? results.path.retainedRental.cumulativeCash : (results.path.yieldPortfolio ? results.path.yieldPortfolio.cumulativeCashAfterTax : 0)) + '</td></tr>' +
      (anyMortgage
        ? '<tr><td>Existing mortgage</td>' +
            '<td>' + carried + '</td>' +
            '<td>' + pathMortgage + '</td></tr>'
        : '') +
      '<tr><td>Operational load</td>' +
        '<td>Tenants, maintenance, turnover</td>' +
        '<td>' + (s.path === 2 ? 'Rental retained; plus HELOC servicing' : 'None' + (s.path === 3 ? ' on the sold portion' : '') + '; issuer-credit and market risk instead') + '</td></tr>' +
      '<tr><td>Liquidity</td>' +
        '<td>Months; ~6–9% to sell (orderly)</td>' +
        '<td>Seconds; spread, fees and market risk</td></tr>' +
      '<tr><td>Tax treatment</td>' +
        '<td>Depreciation-shielded</td>' +
        '<td>' + (s.path === 1 ? 'LTCG on appreciation only' : 'Tax-deferred (return of capital, expected)') + '</td></tr>' +
      '<tr class="' + winnerClass + '"><td><strong>' + s.holdingYears + '-year total asset value' + (real ? ' (today\u2019s&nbsp;$)' : '') + '</strong></td>' +
        '<td class="numeric"><strong>' + fmtMoneyFull(rentalTotal) + '</strong></td>' +
        '<td class="numeric"><strong>' + fmtMoneyFull(bitcoinTotal) + '</strong></td></tr>';

    var headers = document.getElementById('calc-comparison-headers');
    if (headers) {
      headers.innerHTML = '<tr><th>Metric</th><th>Keep Rental</th><th>' + pathName + '</th></tr>';
    }
    // What the table's dollars are (PR 4f).
    var frame = document.getElementById('calc-comparison-frame');
    if (frame) frame.textContent = real
      ? ('The ' + s.holdingYears + '-year totals are in today\u2019s dollars, ' + deflatorPhrase() + '. The cash flows and the mortgage are nominal, as paid.')
      : 'All figures are nominal: future dollars, as paid.';
  }

  function renderPathDetail(results, s){
    var el = document.getElementById('calc-path-detail');
    if (!el) return;
    var html = '';
    if (s.path === 1) {
      var r = results.path.saleAtYear0;
      html = '<div class="calc-detail-title">Path 1 mechanics — outright sale, redeploy to spot bitcoin</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>Gross sale</span><strong>' + fmtMoneyFull(r.grossSale) + '</strong></div>' +
        '<div><span>Selling costs (' + parseFloat(s.sellCostPct.toFixed(2)) + '%)</span><strong>-' + fmtMoneyFull(r.transactionCosts) + '</strong></div>' +
        '<div><span>Net proceeds</span><strong>' + fmtMoneyFull(r.netProceeds) + '</strong></div>' +
        '<div><span>Depreciation recapture (25%)</span><strong>-' + fmtMoneyFull(r.recaptureTax) + '</strong></div>' +
        '<div><span>Federal LTCG</span><strong>-' + fmtMoneyFull(r.ltcgTax) + '</strong></div>' +
        '<div><span>State tax (' + (s.stateCode === 'OTHER' ? 'typical ~5%' : s.stateCode) + ')</span><strong>-' + fmtMoneyFull(r.stateTax) + '</strong></div>' +
        '<div><span>NIIT</span><strong>-' + fmtMoneyFull(r.niit) + '</strong></div>' +
        repaidRows(r.netCash, results.path.mortgageRepaid) +
        '<div class="calc-detail-emphasis"><span>Net cash deployed to bitcoin</span><strong>' + fmtMoneyFull(results.path.netCashDeployed) + '</strong></div>' +
        '<div><span>Bitcoin purchase cost (' + parseFloat(s.btcTxPct.toFixed(2)) + '%)</span><strong>-' + fmtMoneyFull(results.path.netCashDeployed * s.btcTxPct / 100) + '</strong></div>' +
        '<div><span>All-in leakage from gross sale</span><strong>' + fmtPct(r.effectiveLeakagePct) + '</strong></div>' +
        '</div>' + shortfallNote(results.path.shortfall);
    } else if (s.path === 2) {
      var r2 = results.path;
      html = '<div class="calc-detail-title">Path 2 mechanics — HELOC against home, buy bitcoin, retain rental</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>HELOC draw available</span><strong>' + fmtMoneyFull(r2.helocDraw) + '</strong></div>' +
        '<div><span>Annual interest carry</span><strong>' + fmtMoneyFull(r2.annualCarry) + '/yr</strong></div>' +
        '<div><span>Cumulative carry (' + s.holdingYears + ' yrs)</span><strong>' + fmtMoneyFull(r2.cumulativeCarry) + '</strong></div>' +
        '<div><span>Bitcoin purchase cost (' + parseFloat(s.btcTxPct.toFixed(2)) + '%)</span><strong>-' + fmtMoneyFull(r2.helocDraw * s.btcTxPct / 100) + '</strong></div>' +
        '<div><span>Bitcoin position FV (' + scenarioLabel(s.btcScenario) + ')</span><strong>' + fmtMoneyFull(r2.btcFV) + '</strong></div>' +
        '<div class="calc-detail-emphasis"><span>Net gain from leveraged bitcoin</span><strong>' + fmtMoneyFull(r2.netGainFromLeverage) + '</strong></div>' +
        '<div><span>+ Retained rental wealth at exit' + (r2.retainedRental.mortgage0 > 0 ? ' (after its mortgage)' : '') + '</span><strong>' + fmtMoneyFull(r2.retainedRental.totalWealth) + '</strong></div>' +
        '</div>' +
        '<div class="calc-detail-warn">Caveat: HELOC interest used for bitcoin is not tax-deductible (TCJA). Carry must be serviced from personal income through any bitcoin drawdown.</div>';
    } else if (s.path === 3) {
      var r3 = results.path;
      var soldCount = r3.sold;
      var retainedCount = r3.retained;
      html = '<div class="calc-detail-title">Path 3 mechanics &mdash; sell ' + soldCount + ' of ' + s.numProperties + ' properties, redeploy</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>Sold property value (' + soldCount + ' \u00d7 ' + fmtMoneyFull(s.propertyValue) + ')</span><strong>' + fmtMoneyFull(r3.soldPropertiesValue) + '</strong></div>' +
        '<div><span>Net cash after sale taxes' + (r3.mortgageRepaid > 0 ? ' and repaying ' + (soldCount === 1 ? 'its mortgage' : 'their mortgages') + ' (' + fmtMoneyFull(r3.mortgageRepaid) + ')' : '') + '</span><strong>' + fmtMoneyFull(r3.netCashFromSale) + '</strong></div>' +
        '<div><span>Year 1 cash from yield portfolio</span><strong>' + fmtMoneyFull(r3.yieldPortfolio.year1AfterTax) + '</strong></div>' +
        '<div><span>Year 1 cash from ' + retainedCount + ' retained rental' + (retainedCount === 1 ? '' : 's') + '</span><strong>' + fmtMoneyFull(r3.retainedRental.annual.afterTax) + '</strong></div>' +
        '<div class="calc-detail-emphasis"><span>Combined Year 1 cash flow</span><strong>' + fmtMoneyFull(r3.year1CashFlow) + '</strong></div>' +
        '</div>' + shortfallNote(r3.shortfall);
    } else {
      var r4 = results.path;
      var yp = r4.yieldPortfolio;
      var p = s.portfolio;
      var nc = r4.netCashDeployed;
      html = '<div class="calc-detail-title">Path 4 mechanics — outright sale, deploy to yield portfolio</div>' +
        '<div class="calc-detail-rows">' +
        (r4.mortgageRepaid > 0
          ? '<div><span>Net cash after sale taxes</span><strong>' + fmtMoneyFull(r4.saleAtYear0.netCash) + '</strong></div>' +
            '<div><span>Existing mortgage repaid</span><strong>-' + fmtMoneyFull(r4.mortgageRepaid) + '</strong></div>' +
            '<div class="calc-detail-emphasis"><span>Net cash to deploy</span><strong>' + fmtMoneyFull(nc) + '</strong></div>'
          : '<div><span>Net cash to deploy (after sale taxes)</span><strong>' + fmtMoneyFull(nc) + '</strong></div>') +
        '</div>' + shortfallNote(r4.shortfall) +
        '<div class="calc-detail-portfolio">' +
        '<div class="calc-detail-portfolio-title">Year 1 distributions by instrument</div>' +
        '<div class="calc-detail-rows">' +
        '<div><span>STRC (' + p.strc + '%, ' + fmtMoneyFull(yp.allocations.strc) + ' @ ' + YR.strc.toFixed(1) + '% ROC)</span><strong>' + fmtMoneyFull(yp.year1Distributions.strc) + '</strong></div>' +
        '<div><span>SATA (' + p.sata + '%, ' + fmtMoneyFull(yp.allocations.sata) + ' @ ' + YR.sata.toFixed(1) + '% ROC)</span><strong>' + fmtMoneyFull(yp.year1Distributions.sata) + '</strong></div>' +
        '<div><span>Stablecoin lending (' + p.lend + '%, ' + fmtMoneyFull(yp.allocations.lend) + ' @ ' + YR.lending.toFixed(1) + '% ord.)</span><strong>' + fmtMoneyFull(yp.year1Distributions.lend) + '</strong></div>' +
        '<div><span>Spot BTC (' + p.spot + '%, ' + fmtMoneyFull(yp.allocations.spot) + ', no dist.)</span><strong>—</strong></div>' +
        '<div class="calc-detail-emphasis"><span>Year 1 after-tax total</span><strong>' + fmtMoneyFull(yp.year1AfterTax) + '</strong></div>' +
        '<div><span>Spot BTC value at year ' + s.holdingYears + ' (' + scenarioLabel(s.btcScenario) + ')</span><strong>' + fmtMoneyFull(yp.spotFV) + '</strong></div>' +
        '</div></div>';
    }
    // The mechanics stay in nominal dollars, as paid, in both views (PR 4f).
    // In the Real view, say so, and give the factor for the year-N values
    // Paths 2 and 4 show.
    if (isReal()) {
      html += '<div class="calc-detail-frame">' + ((s.path === 2 || s.path === 4)
        ? 'These mechanics are in nominal dollars, as paid. The year-' + s.holdingYears + ' values are future dollars; in today\u2019s dollars, ' +
          deflatorPhrase() + ', divide them by ' + RE.deflator(inflPct(), s.holdingYears).toFixed(2) + '.'
        : 'These mechanics are in nominal dollars, as paid.') + '</div>';
    }
    el.innerHTML = html;
  }

  function renderCAGRChips(s){
    var scenarios = ['floor', 'stay', 'trend', 'upper'];
    scenarios.forEach(function(sc){
      var chip = document.querySelector('.calc-cagr-chip[data-scenario="' + sc + '"]');
      if (!chip) return;
      var sCopy = Object.assign({}, s, { btcScenario: sc });
      var r = computeAll(sCopy);
      // In the display frame (PR 4f); nominal as before.
      var delta = inFrame(r.path.totalWealth, s.holdingYears) - inFrame(r.keep.totalWealth, s.holdingYears);

      // Effective CAGR display — derived dynamically from Power Law data
      // and the current holding period, so the number recalibrates as
      // the user drags the holding-period slider or as TODAY_PRICE
      // updates from the live fetch.
      var effCAGRPct = effectiveCAGR(sc, s.holdingYears) * 100;
      var rateEl = chip.querySelector('.calc-cagr-chip-rate');
      if (rateEl) rateEl.textContent = '~' + effCAGRPct.toFixed(0) + '% CAGR';

      var deltaEl = chip.querySelector('.calc-cagr-chip-delta');
      if (!deltaEl) {
        deltaEl = document.createElement('span');
        deltaEl.className = 'calc-cagr-chip-delta';
        chip.appendChild(deltaEl);
      }
      deltaEl.textContent = (delta > 0 ? '+' : '') + fmtMoney(delta);
      deltaEl.style.color = delta > 0 ? 'var(--green)' : '#e07a6d';
      chip.classList.toggle('active', sc === s.btcScenario);

      // Chip tooltip — populates the .tip-content span inside the chip's
      // own .help-tip. Re-runs every rerender so 'stay' picks up the
      // current multiple's bull/bear/neutral framing.
      var chipTipEl = chip.querySelector('.calc-chip-help .tip-content');
      if (chipTipEl) chipTipEl.innerHTML = scenarioTipHTML(sc);
    });

    // Update the current-multiple readout above the chips if present
    var mEl = document.getElementById('calc-current-multiple');
    if (mEl) {
      var mult = currentBTCMultiple();
      mEl.textContent = mult.toFixed(2) + '\u00d7 trend';
    }
  }

  function bindCAGRChips(){
    // Scenario code → dataset index in the chart (and in legendVisibility)
    var SCENARIO_IDX = { stay: 1, trend: 2, upper: 3, floor: 4 };

    document.querySelectorAll('.calc-cagr-chip').forEach(function(chip){
      chip.addEventListener('click', function(){
        var newScenario = chip.dataset.scenario;
        var oldScenario = state.btcScenario;
        if (newScenario === oldScenario) return;

        // Auto-swap visibility: hide the previously-primary scenario,
        // show the newly-selected. Other scenarios retain their manual
        // toggle state — so a user who turned 'Stay' on for comparison
        // keeps it on when switching primary from Trend to Upper. Floor is
        // never auto-hidden: M3 draws it faintly on every chart.
        if (SCENARIO_IDX[oldScenario] !== undefined && oldScenario !== 'floor') {
          legendVisibility[SCENARIO_IDX[oldScenario]] = false;
        }
        legendVisibility[SCENARIO_IDX[newScenario]] = true;

        state.btcScenario = newScenario;
        rerender();
      });
    });

    // Stop chip help-tip clicks from bubbling to the chip button.
    // Without this, clicking the ? glyph would toggle the chip selection.
    document.querySelectorAll('.calc-cagr-chip .calc-chip-help').forEach(function(help){
      help.addEventListener('click', function(e){ e.stopPropagation(); });
      help.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
      });
    });
  }

  function bindZoomToggle(){
    document.querySelectorAll('.calc-chart-zoom-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        chartZoom = btn.dataset.zoom;
        document.querySelectorAll('.calc-chart-zoom-btn').forEach(function(b){
          b.classList.toggle('active', b.dataset.zoom === chartZoom);
          b.setAttribute('aria-selected', b.dataset.zoom === chartZoom ? 'true' : 'false');
        });
        // Force chart rebuild so Chart.js recomputes axis scales for
        // the new data range. update('resize') alone keeps the prior
        // y-axis max baked in, which defeats the purpose of zoom.
        if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
        renderChart(state);
      });
    });
  }

  // Path 3 derived display — the sold count + property-value reminder.
  // Called every rerender so it stays in sync with the two sliders
  // (numProperties and propertiesRetained) controlling the partial-sale
  // composition. The total and retained values are already visible
  // on the sliders themselves; this surfaces the implicit "sold" count
  // so the user sees the full breakdown at a glance.
  function renderPath3Derived(s){
    var soldEl = document.getElementById('calc-path3-sold-count');
    if (!soldEl) return;
    var sold = Math.max(0, s.numProperties - s.propertiesRetained);
    soldEl.textContent = sold + ' propert' + (sold === 1 ? 'y' : 'ies');
  }

  // The frame's labels outside the result blocks (PR 4f): the toggle, the
  // frame line under it (the shared binder writes it: which view is
  // showing, and what Real means next to Nominal), the chart's title, and
  // the note under the scenario chips (their growth rates are nominal in
  // both views; their differences follow the frame).
  var baselineCtl = null;
  function renderFrameUI(){
    var real = isReal();
    if (baselineCtl) baselineCtl.renderFrame();
    document.querySelectorAll('.calc-frame-btn').forEach(function(b){
      var on = b.dataset.mode === state.displayMode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var cf = document.getElementById('calc-chart-frame');
    if (cf) cf.textContent = real ? '(real, today\u2019s $)' : '(nominal, future $)';
    var chipsNote = document.getElementById('calc-chips-frame');
    if (chipsNote) chipsNote.hidden = !real;
  }

  function bindDisplayMode(){
    document.querySelectorAll('.calc-frame-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        if (btn.dataset.mode === state.displayMode) return;
        state.displayMode = btn.dataset.mode;
        // Rebuild the chart so its axis fits the new values, as the zoom
        // toggle does.
        if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
        rerender();
      });
    });
    // "Change it" beside the frame line is bound by the shared binder.
  }

  function renderSpecificCallout(s){
    var el = document.getElementById('calc-specific-callout');
    if (!el) return;
    var isTypical = s.stateCode === 'OTHER';
    var stateName = isTypical ? 'a typical state' : s.stateCode;
    var stateRate = STATE_CAPGAIN[s.stateCode] !== undefined ? STATE_CAPGAIN[s.stateCode] : STATE_CAPGAIN.OTHER;
    var brktLabel = s.federalBracketPct + '% federal bracket';
    var statePrompt = isTypical
      ? ' <strong>Pick your actual state above for an accurate calculation</strong> &mdash; state cap-gains rates vary from 0% (TX, FL, NV, WA, TN) to 13.3% (CA), and the rental sale\u2019s tax leakage moves materially with this input.'
      : '';
    var pathSpecific = '';
    if (s.path === 2) pathSpecific = ' Your HELOC rate, CLTV, and qualification depend on your specific lender &mdash; the ' + s.helocRatePct + '% rate above is representative, not a quote.';
    if (s.path === 1 || s.path === 4) pathSpecific = ' The depreciation recapture and capital gains math above assumes a single transaction; consult a CPA before acting.';

    el.innerHTML =
      '<strong>Where this gets specific to you:</strong> Tax math is based on ' + stateName +
      ' (' + stateRate.toFixed(1) + '% state capital-gains rate) and ' + brktLabel + '.' +
      statePrompt +
      pathSpecific +
      ' This calculator is decision framing, not personalized financial, tax, or legal advice.';
  }

  function rerender(){
    var results = computeAll(state);
    renderFrameUI();
    renderPathDescription();
    renderHeadline(results, state);
    renderComparison(results, state);
    renderPathDetail(results, state);
    renderPath3Derived(state);
    renderCAGRChips(state);
    renderChart(state);
    renderChartLegend();  // re-render so Stay tooltip stays accurate as multiple/inputs shift
    renderSpecificCallout(state);
  }

  // ─── Slider/control binding ───
  function bindSlider(id, key, formatter, parser, post){
    var slider = document.getElementById(id);
    var valEl = document.getElementById('val-' + id.replace('calc-', ''));
    if (!slider) return;
    function updateLabel(){ if (valEl) valEl.textContent = formatter(state[key]); }
    slider.addEventListener('input', function(){
      state[key] = parser ? parser(slider.value) : Number(slider.value);
      if (post) post();
      updateLabel();
      rerender();
    });
    updateLabel();
  }

  function bindSelect(id, key, post){
    var sel = document.getElementById(id);
    if (!sel) return;
    sel.addEventListener('change', function(){
      var v = sel.value;
      state[key] = isNaN(Number(v)) ? v : Number(v);
      if (post) post();
      rerender();
    });
  }

  function updatePerPropertyHint(){
    // Property value and, since PR 4d, the existing mortgage are per property.
    document.querySelectorAll('.calc-perprop-hint').forEach(function(hint){
      hint.style.display = state.path === 3 ? 'inline' : 'none';
    });
  }

  function bindPathToggle(){
    document.querySelectorAll('.calc-path-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        state.path = Number(btn.dataset.path);
        document.querySelectorAll('.calc-path-btn').forEach(function(b){
          b.classList.toggle('active', Number(b.dataset.path) === state.path);
        });
        // Show path-specific input groups
        document.querySelectorAll('.calc-path-specific').forEach(function(grp){
          grp.style.display = grp.dataset.forPath.split(',').indexOf(String(state.path)) >= 0 ? '' : 'none';
        });
        updatePerPropertyHint();  // "(per property)" only when Path 3 is active
        rerender();
      });
    });
  }

  // The shared Baseline assumptions (PR 4f; design §7, rulings M1, P5):
  // home appreciation (lcs.homeApprNominal, NOMINAL since PR 4a) and the
  // deflator for the Real view (lcs.inflation) are bound by
  // shared/real-estate-baseline.js, the binder Bitcoin vs. Real Estate uses
  // too, so the two pages can't disagree about either. Typed appreciation
  // updates the calculator at once and is committed to the sitewide store
  // on 'change' (a value equal to a preset selects that preset); a store
  // change, from this page, the other page or another tab, re-renders.
  // The notice shows a pre-4a real value's conversion until the reader next
  // changes appreciation.
  function bindBaseline(){
    var MA = window.ModelingAssumptions;
    if (!MA || !window.RealEstateBaseline) return;
    baselineCtl = window.RealEstateBaseline.bind({
      prefix: 'rp',
      displayMode: function(){ return state.displayMode; },
      onInput: function(dim, v){
        if (dim !== 'homeApprNominal') return;
        state.appreciationPct = v;
        rerender();
      },
      onChange: function(dim){
        if (dim === 'homeApprNominal' || dim === '*') state.appreciationPct = MA.get('homeApprNominal').value;
        rerender();
      }
    });
    state.appreciationPct = MA.get('homeApprNominal').value;
  }

  function bindPortfolioSliders(){
    // Portfolio composition sliders — must sum to 100
    var keys = ['strc', 'sata', 'lend', 'spot'];
    keys.forEach(function(k){
      var sld = document.getElementById('calc-port-' + k);
      var val = document.getElementById('val-port-' + k);
      if (!sld) return;
      sld.addEventListener('input', function(){
        state.portfolio[k] = Number(sld.value);
        if (val) val.textContent = state.portfolio[k] + '%';
        // Auto-balance: don't enforce sum-to-100, just show total
        var total = keys.reduce(function(s, key){ return s + state.portfolio[key]; }, 0);
        var tEl = document.getElementById('calc-port-total');
        if (tEl) {
          tEl.textContent = total + '%';
          tEl.style.color = total === 100 ? 'var(--green)' : '#e07a6d';
        }
        rerender();
      });
    });
  }

  function initCalc(){
    if (!document.getElementById('calc-headline')) return;

    // Initialize all sliders/selects
    bindSlider('calc-property-value', 'propertyValue',
      function(v){ return fmtMoneyFull(v); });
    bindSlider('calc-net-yield', 'netRentalYield',
      function(v){ return v.toFixed(1) + '%'; });
    bindSlider('calc-holding-years', 'holdingYears',
      function(v){ return v + ' yrs'; });
    bindSlider('calc-adjusted-basis', 'adjustedBasisPct',
      function(v){ return v + '%'; });
    bindSlider('calc-years-held', 'yearsAlreadyHeld',
      function(v){ return v + ' yrs'; });
    // PR 4b (M6): selling costs and the bitcoin purchase cost.
    bindSlider('calc-sell-cost', 'sellCostPct',
      function(v){ return parseFloat(v.toFixed(2)) + '%'; });
    bindSlider('calc-btc-tx', 'btcTxPct',
      function(v){ return parseFloat(v.toFixed(2)) + '%'; });
    // Their defaults come from RealEstateModel.PAIR_DEFAULTS via `state`;
    // put the thumbs there too, so a refresh edits one place.
    ['calc-sell-cost', 'calc-btc-tx'].forEach(function(id, i){
      var el = document.getElementById(id);
      if (el) el.value = String(i === 0 ? state.sellCostPct : state.btcTxPct);
    });
    bindSelect('calc-state', 'stateCode');
    bindSelect('calc-bracket', 'federalBracketPct');

    // Path 2 sliders
    bindSlider('calc-heloc-ltv', 'helocLtv',
      function(v){ return v + '%'; });
    bindSlider('calc-heloc-rate', 'helocRatePct',
      function(v){ return v.toFixed(1) + '%'; });
    // The existing mortgage (PR 4d, rulings M8): now on every path, so its
    // three inputs sit with the property facts. Thumbs from RENTAL_DEFAULTS.
    bindSlider('calc-existing-mortgage', 'existingMortgage',
      function(v){ return fmtMoneyFull(v); });
    bindSlider('calc-mortgage-rate', 'mortgageRatePct',
      function(v){ return parseFloat(v.toFixed(2)) + '%'; });
    bindSlider('calc-mortgage-years', 'mortgageYearsLeft',
      function(v){ return v + ' yrs'; });
    [['calc-existing-mortgage', 'existingMortgage'], ['calc-mortgage-rate', 'mortgageRatePct'], ['calc-mortgage-years', 'mortgageYearsLeft']].forEach(function(p){
      var el = document.getElementById(p[0]);
      if (el) el.value = String(state[p[1]]);
    });

    // Path 3 sliders — coupled: numProperties drives propertiesRetained's max,
    // and we clamp propertiesRetained if numProperties is dragged below it.
    bindSlider('calc-num-properties', 'numProperties',
      function(v){ return v + ' propert' + (v === 1 ? 'y' : 'ies'); },
      null,
      function(){
        var retainedSlider = document.getElementById('calc-properties-retained');
        if (!retainedSlider) return;
        var newMax = state.numProperties - 1;
        retainedSlider.max = String(newMax);
        if (state.propertiesRetained > newMax) {
          state.propertiesRetained = newMax;
          retainedSlider.value = String(newMax);
          var lbl = document.getElementById('val-properties-retained');
          if (lbl) lbl.textContent = newMax + ' retained';
        }
      });
    bindSlider('calc-properties-retained', 'propertiesRetained',
      function(v){ return v + ' retained'; });

    bindPortfolioSliders();
    bindPathToggle();
    bindCAGRChips();
    bindZoomToggle();
    bindBaseline();
    bindDisplayMode();

    // Initial: show path-4 group, hide others
    document.querySelectorAll('.calc-path-specific').forEach(function(grp){
      grp.style.display = grp.dataset.forPath.split(',').indexOf(String(state.path)) >= 0 ? '' : 'none';
    });

    // Render everything EXCEPT the chart. The chart waits for the
    // calculator tab to activate (STYLE_GUIDE §6.14 — Chart.js charts
    // initialized inside a display:none container suffer stale layout
    // cache). The headline / table / chips / detail / callout all
    // render fine in the hidden tab.
    var results = computeAll(state);
    renderFrameUI();
    renderPathDescription();
    renderHeadline(results, state);
    renderComparison(results, state);
    renderPathDetail(results, state);
    renderPath3Derived(state);
    renderCAGRChips(state);
    renderSpecificCallout(state);
    renderChartLegend();  // static legend markup; toggle handlers persist
    updatePerPropertyHint();  // initial visibility (default path is 4, so hidden)

    // Hook into tab activation: build / refresh the chart only when the
    // calculator tab becomes visible.
    window.addEventListener('bvrp:tab-activated', function(e){
      if (e.detail && e.detail.tabId === 'calculator') {
        // Defer one frame so the panel's display:block has taken effect
        // and the canvas has real dimensions before Chart.js measures it.
        setTimeout(function(){ renderChart(state); }, 16);
      }
    });

    // Edge case: page loaded with #calculator in URL — calculator tab
    // is already active on initial render. Detect that and build the
    // chart immediately (one tick out, after layout settles).
    var calcPanel = document.getElementById('panel-calculator');
    if (calcPanel && calcPanel.classList.contains('active')) {
      setTimeout(function(){ renderChart(state); }, 16);
    }

    // The shared power-law-data module updates window.TODAY_PRICE in place
    // once fetchTodayPrice resolves (live spot, with PL_DATA fallback).
    // The ETI module above already calls fetchTodayPrice for its own render,
    // but the chip-picker's #calc-current-multiple readout is not subscribed
    // to that callback — so it stays on the first-paint seeded value (the
    // last PL_DATA sample) while the ETI updates to live. This causes the
    // page to show two different "current multiple" values for the same
    // fact (e.g. 0.51× vs 0.44×). Subscribe here so both indicators agree
    // once the live fetch returns.
    if (typeof fetchTodayPrice === 'function') {
      fetchTodayPrice(function(){
        renderCAGRChips(state);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalc);
  } else {
    initCalc();
  }
})();

// ─── Tab navigation ───────────────────────────────────────────────────
// Four-tab structure (Reality / Bitcoin Case / Four Paths / Calculator)
// adopted to break the page's sustained argument into cognitively-grouped
// chunks. Mirrors the BvRE convention: data-tab on buttons, panel-{id}
// on the panels, hash-based deep linking.
//
// Calculator state and entry-timing indicator state persist across tab
// switches (their state lives in their respective IIFEs above; the tab
// JS only toggles visibility classes).

(function bvrpTabs(){
  'use strict';

  var TAB_IDS = ['reality', 'bitcoin', 'paths', 'calculator'];

  function activateTab(tabId){
    if (TAB_IDS.indexOf(tabId) === -1) tabId = 'reality';
    document.querySelectorAll('.tab-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach(function(p){
      var match = p.id === 'panel-' + tabId;
      p.classList.toggle('active', match);
      p.classList.toggle('js-hidden', !match);
    });
    // Scroll the tab nav into view if user clicked something deep on the page
    // to make the tab change feel grounded. Skip on initial load.
    if (document.readyState === 'complete') {
      var nav = document.querySelector('.tab-nav');
      if (nav) {
        var rect = nav.getBoundingClientRect();
        if (rect.top < 0 || rect.top > window.innerHeight) {
          nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
    // Notify any per-panel initializers that this tab is now visible.
    // Consumed by the calculator IIFE to lazy-init Chart.js (avoids the
    // hidden-tab layout-cache bug — STYLE_GUIDE §6.14).
    window.dispatchEvent(new CustomEvent('bvrp:tab-activated', {
      detail: { tabId: tabId }
    }));
  }

  function initTabFromHash(){
    var hash = (window.location.hash || '').replace(/^#/, '');
    if (TAB_IDS.indexOf(hash) !== -1) {
      activateTab(hash);
    }
    // else: default to Reality (already active in initial HTML)
  }

  function init(){
    document.querySelectorAll('.tab-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var tabId = btn.dataset.tab;
        activateTab(tabId);
        // Update URL hash without scrolling
        if (history.replaceState) {
          history.replaceState(null, '', '#' + tabId);
        }
      });
    });
    window.addEventListener('hashchange', initTabFromHash);
    initTabFromHash();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
