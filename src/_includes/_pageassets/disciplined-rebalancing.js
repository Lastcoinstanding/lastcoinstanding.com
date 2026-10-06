// ═══════════════════════════════════════════════════════════════════
// DISCIPLINED REBALANCING — page logic
//
// Three-tab page: Question / Calculator / Math. This file handles
// tab routing + the Calculator's full math engine (percentile
// computation, trigger detection state machine, cycle accumulation,
// tax drag, conditional projection) + UI wiring (sliders, presets,
// stickiness, output rendering).
//
// Math primitives per DISCIPLINED_REBALANCING_DESIGN.md §4. Output
// rendering per §5. Stickiness per §8.2 (per-calculator persistence,
// stack excluded — it's never written to localStorage).
//
// PL_DATA + PL_A/B/FLOOR/CEIL + GENESIS_TS + plPrice() now in shared/power-law-data.js (loaded before this file via njk page_scripts).
// ═══════════════════════════════════════════════════════════════════

// ═══════ TAB ROUTING ═══════
(function(){
  var btns = document.querySelectorAll('.tab-btn');
  if(!btns.length) return;
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      btns.forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(t){
        t.classList.remove('active');
      });
      var tab = document.getElementById('tab-' + b.dataset.tab);
      if(tab) tab.classList.add('active');
      history.replaceState(null, '', '#' + b.dataset.tab);
    });
  });
  // A hash can also name an element inside a tab (#dr-fail): open its tab,
  // then scroll to it. Covers in-page links and reloads.
  function openHash(){
    var hash = location.hash.replace('#','');
    if(!hash) return;
    var target = document.querySelector('[data-tab="'+hash+'"]');
    if(target){ target.click(); return; }
    var el = document.getElementById(hash), pane = el && el.closest('.tab-content');
    if(!pane) return;
    var btn = document.querySelector('[data-tab="'+pane.id.replace('tab-','')+'"]');
    if(btn && !pane.classList.contains('active')) btn.click();
    history.replaceState(null, '', '#' + hash);
    setTimeout(function(){ el.scrollIntoView({ block: 'start' }); }, 0);
  }
  openHash();
  window.addEventListener('hashchange', openHash);
})();

// ═══════ MATH TAB CHART ═══════
// Companion chart for the Math tab: historical price/trend ratio
// across all of PL_DATA, with horizontal reference lines at canonical
// percentile thresholds. Renders lazily — only when the Math tab
// becomes active, to avoid Chart.js startup cost on initial page load.
(function(){
  var rendered = false;
  var canvas = document.getElementById('drMathChart');
  if(!canvas) return;

  function render(){
    if(rendered) return;
    rendered = true;
    if(typeof Chart === 'undefined') return;

    // Build the historical ratio series from PL_DATA.
    // X values are days-from-genesis (raw PL_DATA[i][0]), matching the
    // Power Law Channel chart's pattern. Linear x-axis + tick callback
    // formats years — avoids the chartjs date-adapter dependency that
    // 'type: time' would require (not loaded site-wide).
    var ratioSeries = [];
    for(var i = 0; i < PL_DATA.length; i++){
      var d = PL_DATA[i][0], p = PL_DATA[i][1];
      var trend = plPrice(d);
      if(trend > 0){
        ratioSeries.push({
          x: d,
          y: p / trend
        });
      }
    }

    // Horizontal reference percentile lines, live from the engine's one
    // percentile function (since-2011 set) — the same levels the Math
    // tab's table prints.
    function pct(P){ return window.RuleEngine ? window.RuleEngine.ratioAtPercentile(P, '2011-01') : null; }
    function cv(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
    var refs = [
      { y: pct(50), label: '50th — median since 2011', color: cv('--dr-ref-50') },
      { y: pct(70), label: '70th', color: cv('--dr-ref-70') },
      { y: pct(80), label: '80th', color: cv('--dr-ref-80') },
      { y: pct(90), label: '90th', color: cv('--dr-ref-90') }
    ].filter(function(r){ return r.y != null; });

    // Build datasets: one for the historical ratio line, plus
    // straight horizontal lines for each reference percentile.
    // Each reference is rendered as a 2-point dataset spanning the
    // x-domain at constant y.
    var xMin = ratioSeries[0].x;
    var xMax = ratioSeries[ratioSeries.length-1].x;
    var refDatasets = refs.map(function(r){
      return {
        label: r.label,
        data: [{x: xMin, y: r.y}, {x: xMax, y: r.y}],
        borderColor: r.color,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0,
        order: 1
      };
    });

    var ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Bitcoin price / Power Law trend',
          data: ratioSeries,
          borderColor: 'rgba(224,148,34,0.85)',
          backgroundColor: 'rgba(224,148,34,0.08)',
          borderWidth: 1.4,
          pointRadius: 0,
          tension: 0.1,
          fill: false,
          order: 0
        }].concat(refDatasets)
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'x', axis: 'x', intersect: false },
        scales: {
          x: {
            type: 'linear',
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              maxTicksLimit: 10,
              callback: function(v){
                // v is days-from-genesis; convert to year
                var date = new Date(GENESIS_TS*1000 + v*86400*1000);
                return date.getFullYear();
              }
            }
          },
          y: {
            type: 'logarithmic',
            min: 0.25,
            max: 7,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              callback: function(v){
                if(v === 0.5 || v === 1 || v === 2 || v === 3 || v === 5) return v + '×';
                return '';
              }
            },
            title: { display: true, text: 'Price / trend', color: 'rgba(255,255,255,0.6)', font: { size: 11 } }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: 'rgba(255,255,255,0.65)',
              font: { size: 10 },
              boxWidth: 18,
              padding: 8,
              filter: function(item){
                // Only show labeled reference percentiles + main series
                return true;
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            titleColor: 'rgba(255,255,255,0.9)',
            bodyColor: 'rgba(255,255,255,0.8)',
            borderColor: 'rgba(224,148,34,0.4)',
            borderWidth: 1,
            callbacks: {
              title: function(items){
                if(!items.length) return '';
                // parsed.x is days-from-genesis (linear axis); convert to date
                var d = new Date(GENESIS_TS*1000 + items[0].parsed.x*86400*1000);
                return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
              },
              label: function(item){
                if(item.dataset.label.indexOf('th') !== -1 && item.dataset.label.indexOf('historical') === -1){
                  return null;
                }
                return item.dataset.label + ': ' + item.parsed.y.toFixed(2) + '×';
              }
            }
          }
        }
      }
    });
  }

  // Trigger render when math tab is activated
  var mathBtn = document.querySelector('.tab-btn[data-tab="math"]');
  if(mathBtn){
    mathBtn.addEventListener('click', function(){
      // Defer one tick so tab activation completes first
      setTimeout(render, 30);
    });
  }

  // Initial-page-load case: if landing on #math, render now
  if(location.hash.replace('#','') === 'math'){
    setTimeout(render, 80);
  }

})();

// ═══════ QUESTION-TAB CHANNEL CHART ═══════
//
// Simplified orientation chart for Tab 1 (The Question). Shows just
// floor / trend / upper / historical-price — no user threshold lines,
// no trigger markers, no projection path. Job is purely to make the
// channel concept visible before the essay's structural argument
// unfolds below. Same logarithmic Y-axis and year-formatting X-axis
// as the Calculator-tab chart so visual register is consistent across
// tabs without sharing chart instance state.
//
// Lazy-render-friendly: Tab 1 is the default active tab so the chart
// renders on initial page load. If the user lands on a different tab
// via URL hash, the canvas still exists but is in an inactive (hidden)
// tab-content; Chart.js handles that fine.
(function(){
  var canvas = document.getElementById('drQuestionChannelChart');
  if(!canvas) return;
  if(typeof Chart === 'undefined') return;

  var amber  = '#e09422';
  var rust   = '#c0392b';
  var gold   = '#e8c820';
  var muted  = 'rgba(160,160,160,0.55)';
  var priceColor = 'rgba(232,224,210,0.55)';

  // X-domain: full historical record + ~5 years of forward projection.
  // The projection isn't a forecast — it's the channel structure
  // extended through plPrice() — so readers can see that the channel
  // doesn't stop at today; it's a structural argument about where
  // future price action will likely fall, not just a back-fit to
  // history.
  var minD = PL_DATA[0][0];
  var todayD = PL_DATA[PL_DATA.length - 1][0];  // last real-price day
  var futureD = todayD + (5 * 365);             // ~5 years projection

  // All four datasets share the SAME X cadence (30-day stride). This
  // is what unblocks mode:'index' for the tooltip — when datasets
  // share X values, dataset[N] maps to the same X across all four,
  // and the tooltip gets exactly one value per dataset at the cursor.
  //
  // Earlier attempts: mode:'index' with mismatched cadences (30-day
  // bands + daily price) gave wrong dates; mode:'x' with the same
  // mismatch gave duplicate entries because two adjacent dense
  // samples often fell within the cursor's X tolerance. Uniform
  // sampling makes both problems disappear.
  //
  // For the historical price line, the daily PL_DATA is binned into
  // the 30-day grid by finding the nearest PL_DATA sample to each
  // grid day. Projection-range grid days get null (Chart.js skips
  // nulls when drawing and we filter them from tooltips below).
  var priceByDay = {};
  for(var pi = 0; pi < PL_DATA.length; pi++){
    priceByDay[PL_DATA[pi][0]] = PL_DATA[pi][1];
  }
  function nearestPriceAt(d){
    if(priceByDay[d] !== undefined) return priceByDay[d];
    for(var off = 1; off <= 15; off++){
      if(priceByDay[d - off] !== undefined) return priceByDay[d - off];
      if(priceByDay[d + off] !== undefined) return priceByDay[d + off];
    }
    return null;
  }

  var trend = [], floor = [], upper = [], historicalData = [];
  for(var d = minD; d <= futureD; d += 30){
    var t = plPrice(d);
    trend.push({x: d, y: t});
    floor.push({x: d, y: t * PL_FLOOR});
    upper.push({x: d, y: t * PL_CEIL});
    historicalData.push({x: d, y: d <= todayD ? nearestPriceAt(d) : null});
  }

  // Subtle vertical 'today' line plugin — visually separates the
  // historical record from the projection so the bands' continuation
  // forward reads as 'the structure extends' rather than 'I forgot
  // to clip the line.'
  var todayLinePlugin = {
    id: 'qChartTodayLine',
    afterDatasetsDraw: function(chart){
      var xScale = chart.scales.x;
      if(!xScale) return;
      var x = xScale.getPixelForValue(todayD);
      if(x < xScale.left || x > xScale.right) return;
      var ctx = chart.ctx;
      var top = chart.chartArea.top;
      var bot = chart.chartArea.bottom;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bot);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('today', x + 4, top + 10);
      ctx.restore();
    }
  };

  // Tooltip year-formatter: matches the X-axis tick callback.
  function dayToYear(d){
    return new Date(GENESIS_TS*1000 + d*86400*1000).getFullYear();
  }
  function dayToDateLabel(d){
    var date = new Date(GENESIS_TS*1000 + d*86400*1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[date.getMonth()] + ' ' + date.getFullYear();
  }
  function fmtUSD(v){
    if(v >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M';
    if(v >= 1000) return '$' + (v/1000).toFixed(v >= 10000 ? 0 : 1) + 'K';
    if(v >= 1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(3);
  }

  new Chart(canvas, {
    type: 'scatter',
    plugins: [todayLinePlugin],
    data: {
      datasets: [
        { label: 'Floor (0.42× trend)', data: floor, borderColor: rust, borderWidth: 1.4, borderDash: [6, 3], pointRadius: 0, showLine: true, tension: 0.2, order: 4 },
        { label: 'Trend',               data: trend, borderColor: amber, borderWidth: 2,                  pointRadius: 0, showLine: true, tension: 0.2, order: 3 },
        { label: 'Upper (3.0× trend)',  data: upper, borderColor: gold,  borderWidth: 1.2, borderDash: [1, 5], pointRadius: 0, showLine: true, tension: 0.2, order: 5 },
        { label: 'Historical price',    data: historicalData, borderColor: priceColor, borderWidth: 1.1, pointRadius: 0, showLine: true, tension: 0.15, order: 1, spanGaps: false }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // mode:'index' is correct here because all four datasets share
      // identical X values (uniform 30-day stride). Each dataset[N] maps
      // to the same X, so the tooltip gets one value per dataset at the
      // cursor's nearest grid day — no duplicates, no missing entries.
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(20,20,20,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          titleColor: '#e0e0e0',
          bodyColor: '#c8c8c8',
          callbacks: {
            title: function(items){ return dayToDateLabel(items[0].parsed.x); },
            label: function(ctx){
              // Skip null y-values — historicalData has nulls in the
              // projection range; without this, the tooltip would show
              // 'Historical price: $NaN' for any grid day past today.
              if(ctx.parsed.y == null || isNaN(ctx.parsed.y)) return null;
              return ctx.dataset.label + ': ' + fmtUSD(ctx.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Year', color: muted, font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
          min: minD,
          max: futureD,
          ticks: {
            color: muted,
            maxTicksLimit: 10,
            callback: function(v){ return dayToYear(v); }
          }
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: 'BTC price (USD)', color: muted, font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: muted,
            callback: function(v){
              // Defensive: round at every magnitude so any value — including
              // an explicit min/max set by the zoom code — renders as a clean
              // label rather than a raw decimal (e.g. '$854.39…K').
              if(v >= 1e6){
                var m = v / 1e6;
                if(m >= 10 || m === Math.floor(m)) return '$' + Math.round(m) + 'M';
                return '$' + (Math.round(m * 10) / 10) + 'M';
              }
              if(v >= 1000){
                var k = v / 1000;
                if(k >= 100 || k === Math.floor(k)) return '$' + Math.round(k) + 'K';
                return '$' + (Math.round(k * 10) / 10) + 'K';
              }
              if(v >= 1) return '$' + Math.round(v);
              return '$' + v.toFixed(2);
            }
          }
        }
      }
    }
  });
})();

// ═══════ CALCULATOR v2 — Stage A (2026-10-04) ═══════
//
// Replaces the percentile calculator (runHistoricalBacktest, both local
// percentileToRatio copies, the era toggle and the four-param URL sync).
// Ported from the approved DR_V2_MOCKUP: presets, the rule sentence, the
// "Build your own rule" panel, the hero (since 2011 and since 2014), the
// cycle table, the failure box, two charts and three handoffs.
//
// Engine: shared/rule-engine.js (window.RuleEngine). Percentiles: the
// engine's one function family on the since-2011 set. Chart 1 is the page's
// existing Chart.js channel chart, now carrying the rule's sell, fade and
// buy-back levels and its ▼ / ▲ / △ markers; Chart 2 (stack over time) uses
// Chart.js too, so the two match.
//
// URL schema (spec §7): preset, sx, st, sz, f, rx, cap, account, tax
// (federal 0/15/20), state, from. Never written on a bare load (the first
// real interaction unlocks the writer); defaults omitted; foreign params and
// the hash preserved. Legacy sell= / rebuy= percentiles and the old 0–40
// tax= still parse; the writer emits the new keys only.
//
// Stickiness: dr: keys for the new inputs; the stack is never saved. URL
// params (any) override storage, as before. The old sell/rebuy/tax keys are
// removed on load, not migrated.
(function(){
  if (!window.RuleEngine || !window.SpikeRecord || !document.getElementById('dr2RuleSentence')) return;
  var RE = window.RuleEngine;
  function $(id){ return document.getElementById(id); }
  function cssVar(n, fb){ var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || fb; }
  function track(name, params){ try { if (typeof gtag === 'function') gtag('event', name, params); } catch (e) {} }

  var INITIAL_HREF = location.href;
  var interacted = false;

  // ─── Stage B (2026-10-06): no presets on the page. Two sliders open at the
  // old Conservative values, the "starting rules" (DEF_R); Reset returns there.
  // PRESETS stays only for old ?preset= links and the drQA fixture.
  var PRESETS = {
    conservative: { timing: 'fade', sx: 2, sz: 2, f: 25, rx: 1.0, cap: 24 },
    balanced:     { timing: 'fade', sx: 2, sz: 2, f: 50, rx: 0.85, cap: 24 },
    adventurous:  { timing: 'up', sx: 1.5, sz: 1.5, f: 75, rx: 0.7, cap: 24 }
  };
  var DEF_R = PRESETS.conservative;
  var SX_MIN = 1.05, SX_MAX = 4, RX_MIN = 0.42, RX_MAX = 1.5;
  // Defaults. The state matches Bitcoin's Spikes' tax hurdle ("Not included"),
  // so a reader moving between the pages sees one assumption.
  var DEF_O = { acct: 'ira', fed: 15, niit: false, state: 'NONE', lots: 'fifo', yield: 0 };
  // szFollows: the fade level tracks the sell level until the reader sets it
  // on its own (the bar or "More tax and timing settings").
  var S = { R: copy(DEF_R), szFollows: true, O: copy(DEF_O), stack: 1, start: '2011-01', unit: 'coins', fromSpikes: false, rb: null };
  function copy(o){ var r = {}; for (var k in o) r[k] = o[k]; return r; }

  // ─── The record behind the sliders: spike peaks, cycle lows and the
  // next-spike projection, all from shared/spike-record.js (one record for
  // this page and Bitcoin's Spikes). REPLAY: the Looking ahead replays.
  var SR = window.SpikeRecord, EPS = RE.EPS;
  var PROJ = SR.nextSpike(), PEAKS = PROJ.peaks, LOWS = SR.cycleLows();
  var LOWS_DESC = LOWS.map(function(l){ return l.m; }).sort(function(a, b){ return b - a; });
  var LOW_GREEN = Math.round(LOWS_DESC[0] * 100) / 100, LOW_AMBER = Math.round(LOWS_DESC[1] * 100) / 100;
  var REPLAY = RE.replays(LOWS.map(function(l){ return l.d; }));
  var ROWS14 = RE.rowsFrom('2014-01');
  function lowOf(cycle){ for (var i = 0; i < LOWS.length; i++) if (LOWS[i].cycle === cycle) return LOWS[i]; return null; }
  function peakOf(cycle){ for (var i = 0; i < PEAKS.length; i++) if (PEAKS[i].y === cycle) return PEAKS[i]; return null; }

  // ─── GA4 (Stage B): dr_rule_change, once per control per 2 s ───
  var _gaT = {};
  function ruleChanged(control){ clearTimeout(_gaT[control]); _gaT[control] = setTimeout(function(){ track('dr_rule_change', { control: control }); }, 2000); }

  // ─── State rates: the shared list's labels (reb.stateOptions), with one
  // bitcoin-specific override. The list was built for the real-estate pages,
  // where Washington is right at 0% (no income tax; real estate is exempt from
  // its capital gains tax). For bitcoin it isn't: Washington taxes long-term
  // gains, crypto included, at 7% above an inflation-adjusted deduction (about
  // $270k) and 9.9% above about $1.27M from 2025 (DATA_AUDIT DR-WA).
  // Review round 1 (item 14): two Washington options. WA keeps the shared
  // code at 0% (gains under the deduction); WAHI is this page's own code for
  // gains above it. WAHI is inserted after WA at init.
  var BTC_STATE_OVERRIDE = {
    WA: { rate: 0, label: 'Washington, gains under ~$270k a year (0%)' },
    WAHI: { rate: 7, label: 'Washington, gains above ~$270k a year (7%)', help: 'Above about $1.27M the rate is 9.9% from 2025. Real estate is exempt there; bitcoin is not.' }
  };
  function stateRate(code){
    if (!code || code === 'NONE') return 0;
    if (BTC_STATE_OVERRIDE[code]) return BTC_STATE_OVERRIDE[code].rate;
    var o = $('dr2State').querySelector('option[value="' + code + '"]');
    var m = o && o.textContent.match(/([\d.]+)%/);
    return m ? parseFloat(m[1]) : 0;
  }
  function engineOpts(o, start){ return { start: start, acct: o.acct, fed: o.fed, niit: o.niit, state: stateRate(o.state), lots: o.lots, yield: o.yield }; }

  // ─── Formatting (mockup) ───
  function fx(v){ return String(parseFloat(v.toFixed(2))) + '×'; }
  function mult(v){ return v.toFixed(2) + '×'; }
  function cls(v){ return v > 1.005 ? 'up' : v < 0.995 ? 'down' : 'flat'; }
  function usd(v){ var a = Math.abs(v), s = v < 0 ? '−$' : '$'; if (a >= 1e6) return s + (a / 1e6).toFixed(2) + 'M'; if (a >= 1e4) return s + Math.round(a / 1e3) + 'k'; if (a >= 1000) return s + (a / 1e3).toFixed(1) + 'k'; return s + Math.round(a); }
  function price(v){ return v >= 1000 ? '$' + Math.round(v).toLocaleString('en-US') : v >= 10 ? '$' + Math.round(v) : '$' + v.toFixed(2); }
  function btcf(v){ return v.toFixed(v >= 10 ? 2 : 3) + ' BTC'; }
  var my = RE.monthYear;
  function share(x, from){ return Math.round(RE.pctAtOrAbove(x, from)); }
  function shareBelow(x, from){ return Math.round(RE.pctAtOrBelow(x, from)); }

  // Record figures as the page prints them: 14×, 12×, 5.4×, 3.2×, 1.19×.
  function fxs(v){ return (v >= 10 ? String(Math.round(v)) : v >= 2 ? String(parseFloat(v.toFixed(1))) : String(parseFloat(v.toFixed(2)))) + '×'; }
  function lowx(v){ return v.toFixed(2) + '×'; }

  // The rule sentence (mockup wording).
  function ruleText(R){
    var sell = R.timing === 'up' ? 'Sell <strong>' + R.f + '%</strong> when price rises through <strong>' + fx(R.sx) + ' trend</strong>.'
      : 'Sell <strong>' + R.f + '%</strong> when a spike reaches <strong>' + fx(R.sx) + ' trend</strong> and falls back below ' + (R.sz === R.sx ? 'it' : '<strong>' + fx(R.sz) + ' trend</strong>') + '.';
    var buy = ' Buy back at <strong>' + fx(R.rx) + ' trend</strong>' + (R.cap ? ', or at market after <strong>' + R.cap + ' months</strong>.' : ', with no deadline.');
    return sell + buy;
  }

  function segSet(id, v){ document.querySelectorAll('#' + id + ' button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.v === v)); }); }
  function syncControls(){
    var R = S.R;
    segSet('dr2SegTiming', R.timing); segSet('dr2SegCap', String(R.cap)); segSet('dr2SegYield', String(S.O.yield)); segSet('dr2SegAcct', S.O.acct);
    segSet('dr2SegFed', String(S.O.fed)); segSet('dr2SegLots', S.O.lots); segSet('dr2SegStart', S.start); segSet('dr2SegUnit', S.unit);
    // The two sliders. A slider being dragged is left alone.
    if (document.activeElement !== $('dr2FIn')) $('dr2FIn').value = R.f;
    if (document.activeElement !== $('dr2Stack')) $('dr2Stack').value = stackNum(S.stack);
    levelLabels();
    $('dr2Sz').max = R.sx; $('dr2Sz').value = R.sz; $('dr2SzOut').textContent = fx(R.sz);
    $('dr2SzWrap').hidden = R.timing !== 'fade';
    $('dr2SellQ').textContent = R.timing === 'fade' ? 'Sell when a spike reaches this level and then falls back below it.' : 'Sell as price rises through this level.';
    renderMarks();
    $('dr2CapCtx').innerHTML = R.cap ? 'After ' + R.cap + ' months in cash the buy-back rule buys back at whatever the price is. 24 months was neutral when the buy-back level came, and it rescued sales that never got one.' : '<span class="dr2-warnline">No deadline can strand your sale in cash if price never falls to your level.</span>';
    document.querySelectorAll('.dr2-taxonly').forEach(function(e){ e.hidden = S.O.acct !== 'tax'; });
    $('dr2Niit').checked = S.O.niit;
    if ($('dr2State').value !== S.O.state) $('dr2State').value = S.O.state;
    $('dr2StateCtx').textContent = BTC_STATE_OVERRIDE[S.O.state] && BTC_STATE_OVERRIDE[S.O.state].help ? BTC_STATE_OVERRIDE[S.O.state].help : 'Top state rates on long-term gains, from the site’s shared list.';
    $('dr2RuleSentence').innerHTML = ruleText(R);
    // The sticky bar mirrors the card: levels, deadline, account and the
    // short rule. A field the reader is typing in is left alone; it is
    // normalised on blur.
    $('dr2BarCap').value = String(R.cap);
    BAR_FIELDS.forEach(function(f){ var el = $(f.id); if (el !== document.activeElement) el.value = String(R[f.k]); });
    $('dr2BarSz').max = R.sx; $('dr2BarSzWrap').hidden = R.timing !== 'fade';
    document.querySelectorAll('#dr2BarAcct .dr2-chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.v === S.O.acct)); });
    $('dr2BarRule').textContent = shortRule(R);
    $('dr2BarSum').textContent = settingSummary() + ' · ' + stackText() + ' · from ' + S.start.slice(0, 4);
    $('dr2Showing').textContent = 'Showing: ' + shortRule(R) + ' · ' + settingSummary() + ' · ' + stackText() + ' · from ' + S.start.slice(0, 4) + '.';
  }
  // "Sell 25% below 2× after reaching it · buy back at 1× · 24-mo deadline"
  function shortRule(R){
    var sell = R.timing === 'up' ? 'Sell ' + R.f + '% rising through ' + fx(R.sx) : 'Sell ' + R.f + '% below ' + fx(R.sz) + ' after reaching ' + (R.sz === R.sx ? 'it' : fx(R.sx));
    return sell + ' · buy back at ' + fx(R.rx) + ' · ' + (R.cap ? R.cap + '-mo deadline' : 'no deadline');
  }
  // "IRA" or "Taxable · 20% + 3.8% · CA 13.3% · FIFO"
  function settingSummary(){
    var O = S.O; if (O.acct === 'ira') return 'IRA';
    var p = ['Taxable', O.fed + '%' + (O.niit ? ' + 3.8%' : '')];
    if (O.state && O.state !== 'NONE') p.push((O.state === 'WAHI' ? 'WA' : O.state) + ' ' + stateRate(O.state) + '%');
    p.push(O.lots === 'hifo' ? 'highest cost first' : 'FIFO');
    return p.join(' · ');
  }
  function stackNum(v){ return String(parseFloat(v.toFixed(4))); }
  function stackText(){ return stackNum(S.stack) + ' BTC'; }
  // ─── The marked sliders (Stage B; STYLE_GUIDE "Marked slider") ───
  // Value labels update on every input event; the rest of the page follows
  // on the throttled render.
  function levelLabels(){
    var R = S.R;
    $('dr2SxV').innerHTML = fx(R.sx) + '<small> trend</small>'; $('dr2RxV').innerHTML = fx(R.rx) + '<small> trend</small>';
    $('dr2SxR').setAttribute('aria-valuetext', fx(R.sx) + ' trend'); $('dr2RxR').setAttribute('aria-valuetext', fx(R.rx) + ' trend');
  }

  // ─── One shared scale for both sliders (Stage B round 1, 2026-10-06) ───
  // JM: two sliders that look alike but cover different ranges made a
  // sensible rule look like "sell low, buy high". Both inputs span the same
  // log scale, 0.42× (the floor) to 4×, as positions 0–1000; each rule is
  // snapped to its own step and clamped to its own range. Marks are HTML at
  // calc(10px + (100% − 20px) × f), which lines up with the 20px thumb.
  var SC_MIN = 0.42, SC_MAX = 4, SC_SPAN = Math.log(SC_MAX / SC_MIN);
  function scf(v){ return Math.max(0, Math.min(1, Math.log(v / SC_MIN) / SC_SPAN)); }
  function toPos(v){ return Math.round(scf(v) * 1000); }
  function fromPos(p){ return SC_MIN * Math.exp(SC_SPAN * p / 1000); }
  function scL(v){ return 'calc(10px + (100% - 20px) * ' + scf(v).toFixed(4) + ')'; }
  function scW(a, b){ return 'calc((100% - 20px) * ' + Math.max(0, scf(b) - scf(a)).toFixed(4) + ')'; }
  var SNAP = { sx: 0.05, rx: 0.01 };
  function snapLevel(k, v){
    var st = SNAP[k], lo = k === 'sx' ? SX_MIN : RX_MIN, hi = k === 'sx' ? SX_MAX : RX_MAX;
    return r2(clamp(Math.round(v / st) * st, lo, hi));
  }
  // The level a sale actually happens at: the fade level when selling "as the
  // spike fades", else the sell level.
  function sellEff(R){ return R.timing === 'fade' ? R.sz : R.sx; }
  // Order: the buy-back level stays at least 0.05 below the effective sell
  // level. A buy-back change pushes the sell level up; any other change
  // pushes the buy-back level down.
  var GAP = 0.05;
  function enforceOrder(changed){
    var R = S.R;
    if (R.rx <= r2(sellEff(R) - GAP) + EPS) return;
    if (changed === 'rx') {
      var ns = Math.min(SX_MAX, r2(Math.ceil((R.rx + GAP) / 0.05 - 1e-9) * 0.05));
      R.sx = Math.max(R.sx, ns); R.sz = S.szFollows || R.timing === 'up' ? R.sx : Math.max(R.sz, ns);
      if (R.rx > r2(sellEff(R) - GAP)) R.rx = r2(Math.max(RX_MIN, sellEff(R) - GAP));
    } else R.rx = r2(Math.max(RX_MIN, sellEff(R) - GAP));
  }
  function axisHTML(){
    function ax(v, t, lg, c){ return '<span class="ax' + (c ? ' ' + c : '') + '" style="left:' + scL(v) + '">' + t + (lg ? '<span class="lg">' + lg + '</span>' : '') + '</span>'; }
    return ax(SC_MIN, fx(SC_MIN), ' floor', 's') + ax(1, '1×', ' trend') + ax(2, '2×') + ax(PL_CEIL, fx(PL_CEIL), ' upper band') + ax(SC_MAX, fx(SC_MAX), '', 'e');
  }
  function marksHTML(kind){
    var R = S.R, lo = kind === 'sell' ? SX_MIN : RX_MIN, hi = kind === 'sell' ? SX_MAX : RX_MAX, o = '<div class="base"></div>';
    o += '<div class="allow" style="left:' + scL(lo) + ';width:' + scW(lo, hi) + '"></div>';
    if (kind === 'sell') {
      o += '<div class="zone z-green" style="left:' + scL(PROJ.zoneLo) + ';width:' + scW(PROJ.zoneLo, PROJ.zoneHi) + '"></div>';
      o += '<div class="zone z-amber" style="left:' + scL(PROJ.zoneHi) + ';width:' + scW(PROJ.zoneHi, PROJ.altShown) + '"></div>';
      // Lowest first, so the highest on-scale peak gets the end-aligned label.
      var on = PEAKS.filter(function(p){ return p.m <= SC_MAX; }).sort(function(a, b){ return a.m - b.m; });
      on.forEach(function(p, i){
        var end = i === on.length - 1 && on.length > 1;
        o += '<div class="tick" style="left:' + scL(p.m) + '"></div><span class="lab' + (end ? ' e' : '') + '" style="left:' + scL(p.m) + '"><span class="lg">' + p.y + ' peak </span><span class="sm">’' + p.y.slice(-2) + ' </span>' + fxs(p.m) + '</span>';
      });
    } else {
      var lmin = LOWS_DESC[LOWS_DESC.length - 1], lmax = LOWS_DESC[0];
      o += '<div class="zone z-low" style="left:' + scL(SC_MIN) + ';width:' + scW(SC_MIN, lmax) + '"></div>';
      LOWS.forEach(function(l){ o += '<div class="tick t-low" style="left:' + scL(l.m) + '"></div>'; });
      o += '<span class="lab s l-low" style="left:' + scL(SC_MIN) + '">Past cycle lows ' + lowx(lmin) + '–' + lowx(lmax) + '</span>';
    }
    var se = sellEff(R);
    o += '<div class="spr" style="left:' + scL(R.rx) + ';width:' + scW(R.rx, se) + '"></div>';
    o += '<div class="ghost" style="left:' + scL(kind === 'sell' ? R.rx : se) + '"></div>';
    return o;
  }
  // Cheap enough for every input event: both thumbs (a pushed slider moves
  // visibly), both value labels, and both tracks' marks.
  function renderScales(){
    var R = S.R;
    if (document.activeElement !== $('dr2SxR')) $('dr2SxR').value = toPos(R.sx);
    if (document.activeElement !== $('dr2RxR')) $('dr2RxR').value = toPos(R.rx);
    levelLabels();
    $('dr2SellMarks').innerHTML = marksHTML('sell'); $('dr2BuyMarks').innerHTML = marksHTML('buy');
  }
  function sellHits(sx){ return PEAKS.filter(function(p){ return p.m >= sx - EPS; }); }
  function buyHits(rx){ return LOWS.filter(function(l){ return l.m <= rx + EPS; }); }
  function sellVerdict(sx){ return sx <= PROJ.zoneHi + EPS ? 'green' : sx <= PROJ.altShown + EPS ? 'amber' : 'red'; }
  function buyVerdict(rx){ return rx >= LOW_GREEN - EPS ? 'green' : rx >= LOW_AMBER - EPS ? 'amber' : 'red'; }
  var LAST_PEAK = PEAKS[PEAKS.length - 1];
  function renderMarks(){
    var R = S.R, mid = fx(PROJ.mid), alt = fx(PROJ.altShown), lastY = LAST_PEAK.y;
    var early = PEAKS.slice(0, 3).map(function(p){ return p.m; });
    $('dr2KeyShrink').textContent = 'Next peak if spikes keep shrinking (about ' + mid + ')';
    $('dr2KeyAlt').textContent = 'If ' + lastY + ' was unusually small (up to about ' + alt + ')';
    $('dr2SellAxis').innerHTML = $('dr2BuyAxis').innerHTML = axisHTML();
    renderScales();
    var hits = sellHits(R.sx);
    $('dr2SellHist').innerHTML = 'Spike peaks, newest first: ' + PEAKS.slice().reverse().map(function(p){ var t = p.y + ' ' + fxs(p.m); return p.m >= R.sx - EPS ? '<b>' + t + ' ✓</b>' : '<span class="miss">' + t + '</span>'; }).join(' · ') +
      '. <b>' + hits.length + ' of ' + PEAKS.length + '</b> reached ' + fx(R.sx) + ' (✓). The three earliest spikes were ' + Math.floor(Math.min.apply(null, early)) + '–' + Math.round(Math.max.apply(null, early)) + '× and are unlikely to be seen again.';
    var sv = sellVerdict(R.sx), fl = $('dr2SellFlag');
    fl.className = 'dr2-flag ' + sv;
    fl.textContent = sv === 'green' ? 'Likely reached. Even if spikes keep shrinking (next peak about ' + mid + '), this level is within reach. Lower levels earn less per sale and sell into more rallies that keep going.'
      : sv === 'amber' ? 'Uncertain. Reached only if ' + lastY + ' was unusually small (next peak up to about ' + alt + '). If spikes keep shrinking (about ' + mid + '), this rule doesn’t fire next cycle.'
      : 'Unlikely. Above both projections for the next spike (about ' + mid + ', or up to about ' + alt + '). On the record so far, this rule may not fire again.';
    // Buy-back track: every cycle low, the band they span, the trend.
    var lo = LOWS_DESC[LOWS_DESC.length - 1], hi = LOWS_DESC[0];
    $('dr2KeyLows').textContent = 'Where every past cycle bottomed (' + lowx(lo) + '–' + lowx(hi) + ')';
    var bh = buyHits(R.rx);
    $('dr2BuyHist').innerHTML = 'Cycle lows, newest first: ' + LOWS.slice().reverse().map(function(l){ var t = l.y + ' ' + lowx(l.m) + (l.open ? ' (so far)' : ''); return l.m <= R.rx + EPS ? '<b>' + t + ' ✓</b>' : '<span class="miss">' + t + '</span>'; }).join(' · ') +
      '. <b>' + bh.length + ' of ' + LOWS.length + '</b> fell to ' + fx(R.rx) + ' or below (✓). Unlike the spikes, the lows haven’t shrunk: every cycle bottomed between ' + lowx(lo) + ' and ' + lowx(hi) + '.';
    var bv = buyVerdict(R.rx), bf = $('dr2BuyFlag');
    bf.className = 'dr2-flag ' + bv;
    bf.textContent = bv === 'green' ? 'Likely reached. Every past cycle fell at least this far, the latest included. If swings narrow in future, lows could stay higher; a level near trend is the safest.'
      : bv === 'amber' ? 'Uncertain. Only the deeper past lows reached this. If swings narrow, the next low may stop short, and your cash waits (or the deadline buys back higher).'
      : 'Unlikely. Only the deepest lows, at the floor, reached this. Without a deadline, the sale may never be bought back.';
  }

  var _lastPeak = null;
  function lastPeak(){ if (_lastPeak == null) { var t = RE.run(PRESETS.conservative, engineOpts(DEF_O, '2011-01')); _lastPeak = t.cyc[4].peak; } return _lastPeak; }

  // ─── Render ───
  function render(){
    syncControls();
    var O = S.O;
    var a11 = RE.run(S.R, engineOpts(O, '2011-01')), a14 = RE.run(S.R, engineOpts(O, '2014-01'));
    function hero(el, a){
      $(el).innerHTML = '<span class="' + cls(a.end) + '">' + mult(a.end) + '</span><small>HODL</small>';
      // Review round 1, item 8: the stack in BTC and dollars, at the live price when it has loaded.
      var k = S.stack, endB = a.end * k, d = endB - k, sgn = d > 0 ? '+' : d < 0 ? '−' : '';
      var dTxt = Math.abs(d) < 0.0005 ? 'no change' : sgn + btcf(Math.abs(d)) + ', about ' + (d > 0 ? '+' : '') + usd(d * liveBtcPrice) + ' ' + priceNote();
      $(el + 'b').innerHTML = (O.acct === 'ira' ? 'IRA' : 'Taxable') + '. Your ' + stackText() + ' became <strong>' + btcf(endB) + '</strong>: ' + dTxt + (a.inCash ? '. <span class="down">Still in cash.</span>' : '.');
    }
    hero('dr2R11', a11); hero('dr2R14', a14);
    renderWhy(a11, a14);
    renderPanel(a11);

    // Table + failure box
    var T = RE.run(S.R, engineOpts(O, S.start)), cum = 1, html = '', fails = [], stack = S.stack, LAST = T.last;
    T.cyc.forEach(function(c){
      if (!c.covered) return;
      // First column (Stage B): the cycle, its spike and its low against trend.
      var pk = peakOf(c.name), lw = lowOf(c.name);
      var c1 = '<td>' + c.name + '<span class="s">' + (pk ? 'spike ' + fxs(pk.m) : '') + (lw ? ' · low ' + lowx(lw.m) + (lw.open ? ' so far' : '') : '') + '</span></td>';
      if (!c.sell) {
        var why = S.R.timing === 'fade' ? 'the sell rule arms at ' + fx(S.R.sx) : 'the sell rule fires at ' + fx(S.R.sx);
        html += '<tr class="never">' + c1 + '<td colspan="2">Never sold. Peak ' + fx(c.peak) + ' trend; ' + why + '.</td><td class="n">—</td><td class="n mult">1.00×</td>' + stackCells(stack * cum, null, stack) + '</tr>';
        if (c.i === 4) fails.push('<b>' + c.name + ': never sold.</b> The spike peaked at ' + fx(c.peak) + ' trend, below the sell rule\'s ' + fx(S.R.sx) + '.');
        return;
      }
      var s = c.sell, b = c.buy, trip = tripOf(s, b, LAST.p), m = trip.m, buyCell, cum0 = cum;
      cum *= m;
      if (b) buyCell = my(b.d) + ' · ' + price(b.p) + '<span class="s">' + fx(b.r) + ' trend' + (b.why === 'fallback' ? '</span><span class="dr2-tag fb">deadline</span>' : '</span>');
      else buyCell = '<span class="dr2-tag cash">still in cash</span><span class="s">valued at today\'s price</span>';
      var row = m < 0.995 ? 'lost' : m > 1.005 ? 'won' : '';
      html += '<tr class="' + row + '">' + c1 + '<td>' + my(s.d) + ' · ' + price(s.p) + '<span class="s">' + fx(s.r) + ' trend · sold ' + Math.round(s.amt / s.before * 100) + '%</span></td><td>' + buyCell + '</td><td class="n">' + (s.tax > 0 ? usd(s.tax * stack) : '—') + '</td><td class="n mult">' + mult(m) + (m < 0.995 ? '<span class="s">Lost bitcoin</span>' : '') + '</td>' + stackCells(stack * cum, stack * (cum - cum0), stack) + '</tr>';
      if (trip.lost) {
        var r = trip.kind === 'deadline' ? 'The buy-back level never came; the buy-back rule\'s ' + S.R.cap + '-month deadline bought back at ' + price(b.p) + '.'
          : trip.kind === 'cash' ? 'Sold at ' + price(s.p) + '; price never fell to ' + fx(S.R.rx) + ' trend. Still in cash.'
          : 'Sold at ' + price(s.p) + ', bought back at ' + price(b.p) + (trip.kind === 'higher' ? ', a higher price.' : '.') + (s.tax > 0 ? ' Tax took part of the sale.' : '');
        fails.push('<b>' + c.name + ': ' + mult(m) + ' the bitcoin.</b> ' + r);
      }
    });
    $('dr2CycBody').innerHTML = html;
    $('dr2WorthNote').textContent = priceNote();
    renderFailBox(fails, S.start);

    updateChart1(T); updateChart2(T);
    renderAhead();
    renderHandoffs();
    if (interacted) { saveSticky(); scheduleUrl(); }
  }
  // Slider drags: the value labels move on every input event; the full
  // render runs at most every 90ms, with a trailing run so the last value
  // always lands.
  var _rT = null, _rLast = 0;
  function soon(){
    renderScales();
    var now = Date.now();
    clearTimeout(_rT);
    if (now - _rLast >= 90) { _rLast = now; render(); }
    else _rT = setTimeout(function(){ _rLast = Date.now(); render(); }, 90 - (now - _rLast));
  }

  // ─── One reading of a round trip (Stage B round 1) ───
  // The failure box, the "why" box and the worst-round-trip row all classify
  // a sale with this, so they can't disagree. kind: 'cash' (no buy back yet),
  // 'deadline' (the deadline bought back), 'higher' (the level came at a
  // higher price than the sale), 'lower' (it came lower; any loss is tax).
  function tripOf(s, b, lastP){
    var m = b ? b.after / s.before : ((s.before - s.amt) + (s.amt * s.p - s.tax) / lastP) / s.before;
    var kind = !b ? 'cash' : b.why === 'fallback' ? 'deadline' : b.p > s.p ? 'higher' : 'lower';
    return { s: s, b: b, m: m, kind: kind, lost: m < 0.995 };
  }
  function tripsOf(run){
    var out = [];
    run.ev.forEach(function(e, i){ if (e.t !== 'sell') return; var b = run.ev[i + 1]; out.push(tripOf(e, b && b.t === 'buy' ? b : null, run.last.p)); });
    return out;
  }
  function tripCause(t){
    return t.kind === 'deadline' ? (t.b.p > t.s.p ? 'deadline bought back higher' : 'deadline bought back') : t.kind === 'higher' ? 'bought back at a higher price' : t.kind === 'lower' ? 'tax took more than the dip saved' : 'still in cash';
  }
  // "Why" box: shown when a headline result is below HODL. The trades that
  // did it, from the since-2011 and since-2014 runs, deduped by sale month,
  // at most three (mockup v3 sentences).
  function renderWhy(a11, a14){
    var box = $('dr2Why'), R = S.R, bad11 = a11.end < 0.995, bad14 = a14.end < 0.995;
    if (!bad11 && !bad14) { box.hidden = true; box.innerHTML = ''; return; }
    var g13 = Math.round(RE.trendGrowth(RE.dayOfIso('2013-07-01'))), seen = {}, lines = [];
    [bad11 ? a11 : null, bad14 ? a14 : null].forEach(function(run){
      if (!run) return;
      tripsOf(run).forEach(function(t){
        var s = t.s, b = t.b, k = my(s.d);
        if (seen[k] || (!t.lost && t.kind !== 'cash')) return;
        seen[k] = 1;
        var x = 'Sold ' + k + ' at ' + price(s.p) + '. ';
        if (t.kind === 'cash') x += 'Price never came back down to your buy-back level (' + fx(R.rx) + ') and ' + (R.cap ? 'the ' + R.cap + '-month deadline hasn’t come yet' : 'there was no deadline') + ', so that bitcoin is still cash, valued at today’s price.';
        else if (t.kind === 'deadline') x += 'Price didn’t fall to your buy-back level (' + fx(R.rx) + ') within ' + R.cap + ' months, so the deadline bought back in ' + my(b.d) + ' at ' + price(b.p) + (b.p > s.p ? ', above the sale price.' : '.') + ' Round trip: ' + mult(t.m) + '.';
        else if (t.kind === 'higher') x += 'The buy back came in ' + my(b.d) + ' at ' + price(b.p) + ', a higher price: the trend rose faster than price fell' + (RE.ym(s.d) < '2016-01' ? ' (in those years it grew about ' + g13 + '% a year)' : '') + '. Round trip: ' + mult(t.m) + '.';
        else x += 'The buy back came in ' + my(b.d) + ' at ' + price(b.p) + ', lower, but tax on the sale took more than the dip saved. Round trip: ' + mult(t.m) + '.';
        lines.push(x);
      });
    });
    box.hidden = false;
    box.innerHTML = '<div><b>Why ' + (bad11 && bad14 ? 'both results are' : bad11 ? 'the since-2011 result is' : 'the since-2014 result is') + ' below HODL:</b></div>' +
      lines.slice(0, 3).map(function(x){ return '<div>' + x + '</div>'; }).join('');
  }

  // ─── Results panel (Stage B) ───
  function fastOpts(){ var o = engineOpts(S.O, null); o.fast = true; return o; }
  function renderPanel(a11){
    var R = S.R, sells = a11.ev.filter(function(e){ return e.t === 'sell'; }), buys = a11.ev.filter(function(e){ return e.t === 'buy'; });
    var cov = a11.cyc.filter(function(c){ return c.covered; }), nc = cov.filter(function(c){ return c.sell; }).length, last = a11.cyc[a11.cyc.length - 1];
    var early = PEAKS.slice(0, PEAKS.length - 1).map(function(p){ return p.m; });
    $('dr2PanelCaveat').textContent = 'History, not a forecast. These include spikes of ' + Math.floor(Math.min.apply(null, early)) + '–' + Math.round(Math.max.apply(null, early)) + '×, far larger than the latest (' + fxs(LAST_PEAK.m) + '). For smaller future spikes, see Looking ahead below.';
    $('dr2RkFire').innerHTML = 'In <b>' + nc + ' of ' + cov.length + '</b> cycles since 2011' + (sells.length > nc ? ' (' + sells.length + ' sales)' : '') + (last.sell ? '' : '; <span class="down">not in ' + last.name + '</span>');
    var lvl = buys.filter(function(b){ return b.why === 'level'; }).length, dl = buys.length - lvl;
    $('dr2RkBuy').innerHTML = sells.length ? '<b>' + lvl + ' of ' + sells.length + '</b> at your level' + (dl ? ', ' + dl + ' by the deadline' : '') + (a11.inCash ? ', <span class="down">1 still in cash</span>' : '') : '—';
    // Completed round trips only, as before; the short cause comes from tripOf.
    var worst = null;
    tripsOf(a11).forEach(function(t){ if (t.b && (!worst || t.m < worst.m)) worst = t; });
    $('dr2RkWorst').innerHTML = worst ? '<span class="' + cls(worst.m) + '">' + mult(worst.m) + '</span> (sold ' + my(worst.s.d) + (worst.lost ? '; ' + tripCause(worst) : '') + ')' : '—';
    var sv = sellVerdict(R.sx);
    $('dr2RkNext').innerHTML = sv === 'green' ? '<span class="up">Likely within reach</span>' : sv === 'amber' ? '<span class="amber">Only if ' + LAST_PEAK.y + ' was unusually small</span>' : '<span class="down">Above both projections</span>';
    var rb = RE.runRows(REPLAY.breakaway, R, fastOpts());
    $('dr2RkBreak').innerHTML = '<span class="' + cls(rb.end) + '">' + mult(rb.end) + '</span> HODL' + (rb.ev.length ? '' : ' (never sold)');
    renderCurve();
  }
  // "History at every sell level": since 2014, only the sell level changed.
  function curvePoints(R, opts){
    var pts = [];
    for (var x = SX_MIN; x <= SX_MAX + 1e-9; x += 0.05) {
      var rr = copy(R); rr.sx = Math.round(x * 100) / 100;
      if (rr.timing === 'fade') rr.sz = S.szFollows ? rr.sx : Math.min(R.sz, rr.sx); else rr.sz = rr.sx;
      pts.push([rr.sx, RE.runRows(ROWS14, rr, opts).end]);
    }
    return pts;
  }
  function renderCurve(){
    var R = S.R, opts = fastOpts(), pts = curvePoints(R, opts), vals = pts.map(function(p){ return p[1]; });
    var W = 560, H = 150, PL = 36, PR = 8, PT = 8, PB = 22;
    var ymax = Math.max(1.5, Math.ceil(Math.max.apply(null, vals) * 2) / 2), ymn = Math.min(0.5, Math.floor(Math.min.apply(null, vals) * 4) / 4);
    var Xc = function(v){ return PL + (v - SX_MIN) / (SX_MAX - SX_MIN) * (W - PL - PR); }, Yc = function(v){ return PT + (ymax - v) / (ymax - ymn) * (H - PT - PB); };
    var o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Result since 2014 across sell levels, with your sell level marked">';
    o += '<rect x="' + Xc(PROJ.zoneLo) + '" y="' + PT + '" width="' + (Xc(PROJ.zoneHi) - Xc(PROJ.zoneLo)) + '" height="' + (H - PT - PB) + '" style="fill:var(--dr2-zone-green-soft)"/>';
    o += '<rect x="' + Xc(PROJ.zoneHi) + '" y="' + PT + '" width="' + (Xc(PROJ.altShown) - Xc(PROJ.zoneHi)) + '" height="' + (H - PT - PB) + '" style="fill:var(--dr2-zone-amber-soft)"/>';
    for (var t = Math.ceil(ymn * 2) / 2; t <= ymax + 1e-9; t += 0.5) {
      var one = Math.abs(t - 1) < 1e-9;
      o += '<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + Yc(t) + '" y2="' + Yc(t) + '" style="stroke:var(' + (one ? '--text-muted' : '--dr2-svg-grid') + ')"' + (one ? ' stroke-dasharray="4 3"' : '') + '/><text x="' + (PL - 5) + '" y="' + (Yc(t) + 4) + '" style="fill:var(--text-muted)" font-size="10" text-anchor="end">' + t + '×</text>';
    }
    [1.5, 2, 2.5, 3, 3.5, 4].forEach(function(v){ o += '<text x="' + Xc(v) + '" y="' + (H - 6) + '" style="fill:var(--text-muted)" font-size="10" text-anchor="middle">' + v + '×</text>'; });
    o += '<polyline fill="none" style="stroke:var(--orange)" stroke-width="2" points="' + pts.map(function(p){ return Xc(p[0]).toFixed(1) + ',' + Yc(p[1]).toFixed(1); }).join(' ') + '"/>';
    var cur = RE.runRows(ROWS14, R, opts).end;
    o += '<circle cx="' + Xc(R.sx) + '" cy="' + Yc(cur) + '" r="5" style="fill:var(--orange);stroke:var(--bg)" stroke-width="2"/></svg>';
    $('dr2Curve').innerHTML = o;
  }

  // ─── Looking ahead (Stage B). Bitcoin only. ───
  var FH = []; for (var _h = 1.05; _h <= 3.0001; _h += 0.05) FH.push(Math.round(_h * 100) / 100);
  // Eight runs per spike height (four rotations × lows kept or resized):
  // band = min to max, line = the middle of the eight.
  function forwardRows(R, opts, rp){
    rp = rp || REPLAY;
    return FH.map(function(pk){
      var v = [];
      ['keep', 'rise'].forEach(function(l){ for (var ri = 0; ri < rp.rotations; ri++) v.push(RE.runRows(rp.series(pk, ri, l), R, opts).end); });
      v.sort(function(a, b){ return a - b; });
      return { h: pk, lo: v[0], hi: v[v.length - 1], mid: (v[v.length / 2 - 1] + v[v.length / 2]) / 2 };
    });
  }
  function rowAt(rows, h){ return rows.reduce(function(a, r){ return Math.abs(r.h - h) < Math.abs(a.h - h) ? r : a; }); }
  function renderAhead(){
    var R = S.R, opts = fastOpts(), rows = forwardRows(R, opts);
    var endY = new Date(GENESIS_TS * 1000 + REPLAY.series(FH[0], 0, 'keep').slice(-1)[0].d * 864e5).getUTCFullYear();
    $('dr2FEnd').textContent = endY;
    var mid = fx(PROJ.mid), alt = fx(PROJ.altShown);
    $('dr2FKeyShrink').textContent = 'Next spike if the shrinking continues (about ' + mid + ')';
    $('dr2FKeyAlt').textContent = 'If ' + LAST_PEAK.y + ' was unusually small (up to about ' + alt + ')';
    drawAhead(rows);
    var above = rows.filter(function(r){ return r.h >= R.sx - EPS; });
    var lo = above.length ? Math.min.apply(null, above.map(function(r){ return r.lo; })) : null, hi = above.length ? Math.max.apply(null, above.map(function(r){ return r.hi; })) : null;
    var pm = rowAt(rows, PROJ.mid), pa = rowAt(rows, PROJ.altShown);
    function band(r){ return r.hi - r.lo > 0.005 ? ' (' + mult(r.lo) + '–' + mult(r.hi) + ')' : ''; }
    $('dr2FRead').innerHTML = '<p>If the next spikes peak around ' + mid + ' (the shrinking continues), your rules end with <strong class="' + cls(pm.mid) + '">' + mult(pm.mid) + '</strong> HODL' + band(pm) + '. If they reach about ' + alt + ', <strong class="' + cls(pa.mid) + '">' + mult(pa.mid) + '</strong>' + band(pa) + '.</p>' +
      (above.length ? '<p class="dr2-small">Your rules sell only if spikes reach ' + fx(R.sx) + '. Across ' + fx(FH[FH.length - 1]) + ' and below, the replays where they did ended with ' + mult(lo) + ' to ' + mult(hi) + ' the bitcoin.</p>' : '');
    $('dr2CStop').innerHTML = '<span class="k">If spikes stop</span><span class="big flat">1.00×<small>HODL</small></span><p>If every future spike is like ' + LAST_PEAK.y + '’s (' + fxs(LAST_PEAK.m) + '), a sell rule above that never fires. That costs nothing in an IRA, and adds nothing either.</p>';
    var rb = RE.runRows(REPLAY.breakaway, R, opts);
    $('dr2CBreak').innerHTML = '<span class="k">If bitcoin breaks away</span><span class="big ' + cls(rb.end) + '">' + mult(rb.end) + '<small>HODL</small></span><p>Price climbs to about 2.3× trend and never returns below 1.5×. ' +
      (rb.ev.length ? 'Your rules sold and ' + (rb.ev.some(function(e){ return e.why === 'fallback'; }) ? 'the deadline bought back higher.' : 'are still in cash.') : 'Your rules never sold, so nothing was lost.') + '</p>';
  }
  function drawAhead(rows){
    var W = 900, H = 300, PL = 50, PR = 16, PT = 18, PB = 40, xmin = FH[0], xmax = FH[FH.length - 1];
    var ymax = Math.max(2, Math.ceil(Math.max.apply(null, rows.map(function(r){ return r.hi; })) * 2) / 2), ymin = 0.5;
    var X = function(v){ return PL + (v - xmin) / (xmax - xmin) * (W - PL - PR); }, Y = function(v){ return PT + (ymax - v) / (ymax - ymin) * (H - PT - PB); };
    var o = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Bitcoin after your rules against HODL, by the height of future spikes">';
    o += '<rect x="' + X(PROJ.zoneLo) + '" y="' + PT + '" width="' + (X(PROJ.zoneHi) - X(PROJ.zoneLo)) + '" height="' + (H - PT - PB) + '" style="fill:var(--dr2-zone-green-soft)"/>';
    o += '<rect x="' + X(PROJ.zoneHi) + '" y="' + PT + '" width="' + (X(PROJ.altShown) - X(PROJ.zoneHi)) + '" height="' + (H - PT - PB) + '" style="fill:var(--dr2-zone-amber-soft)"/>';
    var step = ymax > 3 ? 0.5 : 0.25;
    for (var t = Math.ceil(ymin / step) * step; t <= ymax + 1e-9; t += step) {
      var one = Math.abs(t - 1) < 1e-9;
      o += '<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" style="stroke:var(' + (one ? '--text-muted' : '--dr2-svg-grid') + ')"' + (one ? ' stroke-dasharray="5 4"' : '') + '/><text x="' + (PL - 8) + '" y="' + (Y(t) + 4) + '" style="fill:var(--text-muted)" font-size="11" text-anchor="end">' + (Math.round(t * 100) / 100) + '×</text>';
    }
    [1.2, 1.5, 2, 2.5, 3].forEach(function(v){ o += '<text x="' + X(v) + '" y="' + (H - PB + 18) + '" style="fill:var(--text-muted)" font-size="11" text-anchor="middle">' + v + '×</text>'; });
    o += '<text x="' + ((PL + W - PR) / 2) + '" y="' + (H - 4) + '" style="fill:var(--text-dim)" font-size="11.5" text-anchor="middle">Height of future spikes (peak, times trend)</text>';
    var top = [], bot = [], mid = [];
    rows.forEach(function(r, i){ var x0 = i === 0 ? X(r.h) : X((rows[i - 1].h + r.h) / 2), x1 = i === rows.length - 1 ? X(r.h) : X((r.h + rows[i + 1].h) / 2); top.push(x0 + ',' + Y(r.hi), x1 + ',' + Y(r.hi)); bot.unshift(x1 + ',' + Y(r.lo), x0 + ',' + Y(r.lo)); mid.push(x0 + ',' + Y(r.mid), x1 + ',' + Y(r.mid)); });
    o += '<polygon points="' + top.concat(bot).join(' ') + '" style="fill:var(--dr2-band)"/><polyline points="' + mid.join(' ') + '" fill="none" style="stroke:var(--orange)" stroke-width="2"/>';
    var sx = S.R.sx;
    if (sx <= xmax) o += '<line x1="' + X(sx) + '" x2="' + X(sx) + '" y1="' + PT + '" y2="' + (H - PB) + '" style="stroke:var(--dr2-red-txt)" stroke-dasharray="2 3"/><text x="' + (X(sx) + 4) + '" y="' + (PT + 12) + '" style="fill:var(--dr2-red-txt)" font-size="11">Your sell level, ' + fx(sx) + '</text>';
    var lp = LAST_PEAK.m;
    o += '<text x="' + (X(lp) + 4) + '" y="' + (H - PB - 8) + '" style="fill:var(--text-dim)" font-size="10.5">' + LAST_PEAK.y + ': ' + fxs(lp) + '</text><line x1="' + X(lp) + '" x2="' + X(lp) + '" y1="' + (H - PB - 20) + '" y2="' + (H - PB) + '" style="stroke:var(--text-dim)"/>';
    $('dr2FChart').innerHTML = o + '</svg>';
  }
  // The table's last three columns (2026-10-05): the stack with this cycle's
  // change, the cumulative difference from HODLing the starting stack in
  // bitcoin, and that difference at today's price (the hero's price and
  // fallback label). delta null = a row that never sold.
  function btcNum(v){ return v.toFixed(v >= 10 ? 2 : 3); }
  function signed(v, unit){ return (v > 0 ? '+' : '−') + btcNum(Math.abs(v)) + unit; }
  function stackCells(now, delta, start){
    var diff = now - start, zero = Math.abs(diff) < 0.0005, dc = zero ? '' : diff > 0 ? 'up' : 'down';
    var chg = delta == null ? 'no sale' : Math.abs(delta) < 0.0005 ? 'no change this cycle' : '<span class="' + (delta > 0 ? 'up' : 'down') + '">' + signed(delta, '') + ' this cycle</span>';
    return '<td class="n">' + btcf(now) + '<span class="s">' + chg + '</span></td>' +
      '<td class="n ' + dc + '">' + (zero ? '—' : signed(diff, ' BTC')) + '</td>' +
      '<td class="n ' + dc + '">' + (zero ? '—' : 'about ' + (diff > 0 ? '+' : '') + usd(diff * liveBtcPrice)) + '</td>';
  }
  function renderFailBox(fails, start){
    var fb = $('dr2FailBox');
    if (fails.length) { fb.className = 'dr2-fail'; fb.innerHTML = '<h3>Where these rules shrank your stack, or never sold</h3><ul>' + fails.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
    else { fb.className = 'dr2-fail ok'; fb.innerHTML = '<h3>No losing round trips from ' + start.slice(0, 4) + '</h3><ul><li>That is the record, not a promise. Rules tuned to past cycles will fit them; the next cycle can still be the one where price rises after the sale and never comes back.</li></ul>'; }
  }

  // ─── Failure-mode worked example (computed, not remembered) ───
  function renderFailExample(){
    var el = $('dr2FailExample'); if (!el) return;
    var t = RE.run(PRESETS.conservative, engineOpts(DEF_O, '2011-01')), c = t.cyc[1];
    if (!c.sell || !c.buy) { el.textContent = ''; return; }
    var m = c.buy.after / c.sell.before;
    el.innerHTML = '<strong>The clearest case:</strong> the starting rules sold a quarter of the stack in ' + my(c.sell.d) + ' at <strong>' + price(c.sell.p) + '</strong> (' + fx(c.sell.r) + ' trend). The buy back came in ' + my(c.buy.d) + ' at <strong>' + price(c.buy.p) + '</strong> (' + fx(c.buy.r) + ' trend). Both rules fired as designed, and the round trip ended at <strong>' + mult(m) + '</strong> the bitcoin.';
  }

  // ─── Handoffs ───
  function renderHandoffs(){
    var a = $('dr2HoHmc'); if (!a || !window.ChannelEntries) return;
    var CE = window.ChannelEntries, d = TODAY_DAYS, t = plPrice(d);
    var pos = Math.round(CE.posOf(S.R.sx * t, d) * 1000) / 1000, rb = Math.round(CE.posOf(S.R.rx * t, d) * 1000) / 1000;
    var tax = S.O.acct === 'ira' ? 0 : S.O.fed;   // How Much Cash accepts 0 / 15 / 20; the federal rate here is already one of them
    a.setAttribute('href', '/how-much-cash?pos=' + pos.toFixed(3) + '&rebuy=' + rb.toFixed(3) + '&share=' + S.R.f + '&tax=' + tax);
  }

  // ═══ CHART 1 — the page's channel chart, with the rule on it ═══
  var canvas = $('drChannelChart'), chart = null, pendingLayoutFix = false;
  var todayD = (Date.now() / 1000 - GENESIS_TS) / 86400, minD = PL_DATA[0][0];
  function maxD(){ return todayD + 20 * 365.25; }
  function bandData(){ var trend = [], floor = [], upper = []; for (var d = minD; d <= maxD(); d += 30) { var t = plPrice(d); trend.push({ x: d, y: t }); floor.push({ x: d, y: t * PL_FLOOR }); upper.push({ x: d, y: t * PL_CEIL }); } return { trend: trend, floor: floor, upper: upper }; }
  function levelData(ratio){ var line = []; for (var d = minD; d <= maxD(); d += 30) line.push({ x: d, y: plPrice(d) * ratio }); return line; }
  var DS = { floor: 0, trend: 1, upper: 2, sellLine: 3, rebuyLine: 4, history: 5, fadeLine: 6, sells: 7, buys: 8, fallbacks: 9 };
  var liveBtcPrice = TODAY_PRICE, liveSource = null;
  // The hero's dollar figure names its price: live, or the dated last sample
  // (the shared helpers' fallback label).
  function priceNote(){ return liveSource === 'live' ? 'at today’s price' : 'at the price ' + (typeof todayPriceAsOf === 'function' ? todayPriceAsOf() : 'of the last sample'); }
  var isNarrow = window.matchMedia && window.matchMedia('(max-width: 480px)').matches;

  function buildChart1(){
    if (!canvas || typeof Chart === 'undefined') return;
    var col = {
      floor: cssVar('--dr-floor'), trend: cssVar('--amber'), upper: cssVar('--dr-upper'), history: cssVar('--dr-history'),
      sell: cssVar('--dr-sell'), fade: cssVar('--dr-fade'), rebuy: cssVar('--dr-rebuy'), bg: cssVar('--bg'),
      muted: cssVar('--dr-axis'), grid: cssVar('--dr-grid'), tipBg: cssVar('--dr-tip-bg'), tipBorder: cssVar('--dr-tip-border'), tipBody: cssVar('--dr-tip-body'), todayLine: cssVar('--dr-today-line')
    };
    if (Chart.Interaction && Chart.Interaction.modes && !Chart.Interaction.modes.xPerDataset) {
      // One item per dataset at the cursor's x (pixel space): the datasets
      // don't share an x-grid, so Chart.js's index/x modes mis-pick here.
      Chart.Interaction.modes.xPerDataset = function(ch, e, options, useFinal){
        var cx = (e && typeof e.x === 'number') ? e.x : null; if (cx == null) return [];
        var items = [];
        ch.getSortedVisibleDatasetMetas().forEach(function(meta){
          var els = meta.data; if (!els || !els.length) return;
          var tol = meta.index >= 7 ? 6 : 15, best = -1, bd = Infinity;
          for (var i = 0; i < els.length; i++) { var el = els[i]; if (!el || el.skip) continue; var x = (useFinal && el.getProps) ? el.getProps(['x'], true).x : el.x; if (x == null || isNaN(x)) continue; var dd = Math.abs(x - cx); if (dd < bd) { bd = dd; best = i; } }
          if (best === -1 || bd > tol) return;
          items.push({ element: els[best], datasetIndex: meta.index, index: best });
        });
        return items;
      };
    }
    var todayLinePlugin = { id: 'drTodayLine', afterDatasetsDraw: function(ch){ var xs = ch.scales.x, a = ch.chartArea; if (!xs || !a) return; var x = xs.getPixelForValue(todayD); if (x < a.left || x > a.right) return; var c = ch.ctx; c.save(); c.strokeStyle = col.todayLine; c.lineWidth = 1; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(x, a.top); c.lineTo(x, a.bottom); c.stroke(); c.fillStyle = col.trend; c.font = '10px Inter, sans-serif'; c.textAlign = 'center'; c.fillText('Today', x, a.top + 12); c.restore(); } };
    var pulsePlugin = { id: 'lcsPulse', afterRender: function(c){ var p = $('drPulse'); if (!p || !c.scales || !c.scales.x || !c.scales.y) return; var x = c.scales.x.getPixelForValue(TODAY_DAYS), y = c.scales.y.getPixelForValue(liveBtcPrice); if (x < c.chartArea.left - 4 || x > c.chartArea.right + 4 || y < c.chartArea.top - 4 || y > c.chartArea.bottom + 4) { p.classList.remove('is-visible'); return; } p.style.left = x + 'px'; p.style.top = y + 'px'; p.classList.add('is-visible'); } };
    var bands = bandData();
    function line(label, data, color, width, dash, order){ return { label: label, data: data, borderColor: color, borderWidth: width, borderDash: dash, pointRadius: 0, showLine: true, tension: 0.2, order: order }; }
    function markers(label, color, fill, rot, order){ return { label: label, data: [], borderColor: color, backgroundColor: fill, borderWidth: 1.5, pointStyle: 'triangle', pointRotation: rot, pointRadius: 7, pointHoverRadius: 9, showLine: false, order: order }; }
    chart = new Chart(canvas, {
      type: 'scatter',
      data: { datasets: [
        line('Floor (0.42× trend)', bands.floor, col.floor, 1.4, [6, 3], 5),
        line('Trend', bands.trend, col.trend, 2, [], 4),
        line('Upper (3.0× trend)', bands.upper, col.upper, 1.2, [1, 5], 6),
        line('Sell level', [], col.sell, 1.6, [8, 4], 2),
        line('Buy-back level', [], col.rebuy, 1.6, [8, 4], 3),
        { label: 'Historical price', data: PL_DATA.map(function(p){ return { x: p[0], y: p[1] }; }), borderColor: col.history, borderWidth: 1.2, pointRadius: 0, showLine: true, tension: 0.15, order: 1 },
        line('Fade sell level', [], col.fade, 1.4, [3, 3], 2),
        markers('Sale', col.sell, col.sell, 180, 0),
        markers('Buy back', col.rebuy, col.rebuy, 0, 0),
        markers('Buy back at the deadline', col.rebuy, col.bg, 0, 0)
      ] },
      plugins: [todayLinePlugin, pulsePlugin],
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'xPerDataset', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: col.tipBg, borderColor: col.tipBorder, borderWidth: 1, titleColor: col.trend, bodyColor: col.tipBody,
            titleFont: { size: isNarrow ? 11 : 13 }, bodyFont: { size: isNarrow ? 11 : 13 }, padding: isNarrow ? 6 : 10, boxPadding: isNarrow ? 3 : 5,
            callbacks: {
              title: function(items){ if (!items.length) return ''; return new Date(GENESIS_TS * 1000 + items[0].parsed.x * 86400000).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }); },
              label: function(item){ var v = item.parsed.y, f = v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(1) + 'K' : v >= 1 ? '$' + v.toFixed(2) : '$' + v.toFixed(4); var l = item.dataset.label; if (isNarrow) { if (l === 'Floor (0.42× trend)') l = 'Floor'; else if (l === 'Upper (3.0× trend)') l = 'Upper'; } return l + ': ' + f; }
            }
          }
        },
        scales: {
          x: { type: 'linear', title: { display: true, text: 'Year', color: col.muted, font: { size: 10 } }, grid: { color: col.grid }, min: minD, afterBuildTicks: yearTicks, ticks: { color: col.muted, autoSkip: false, maxRotation: 0, callback: yearLabel } },
          y: { type: 'logarithmic', title: { display: true, text: 'BTC price (USD)', color: col.muted, font: { size: 10 } }, grid: { color: col.grid }, ticks: { color: col.muted, callback: function(v){ if (v >= 1e6) { var m = v / 1e6; return '$' + (m >= 10 || m === Math.floor(m) ? Math.round(m) : Math.round(m * 10) / 10) + 'M'; } if (v >= 1000) { var k = v / 1000; return '$' + (k >= 100 || k === Math.floor(k) ? Math.round(k) : Math.round(k * 10) / 10) + 'K'; } if (v >= 1) return '$' + Math.round(v); return '$' + v.toFixed(2); } } }
        }
      }
    });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function(){ if (pendingLayoutFix && canvas.clientWidth > 0) { pendingLayoutFix = false; chart.update('resize'); } }).observe(canvas);
    wireLegend(); wireRange(); wireToday();
  }
  var lastT = null;
  function updateChart1(T){
    if (!chart || !T) return;
    lastT = T;
    var R = S.R, sells = [], buys = [], fbs = [];
    T.ev.forEach(function(e){ var pt = { x: e.d, y: e.p }; if (!inWindow(pt)) return; if (e.t === 'sell') sells.push(pt); else if (e.why === 'fallback') fbs.push(pt); else buys.push(pt); });
    applyRange();
    chart.data.datasets[DS.sellLine].data = levelData(R.sx);
    chart.data.datasets[DS.rebuyLine].data = levelData(R.rx);
    var showFade = R.timing === 'fade' && R.sz !== R.sx;
    chart.data.datasets[DS.fadeLine].data = showFade ? levelData(R.sz) : [];
    var lf = $('dr2LegendFade'); if (lf) lf.hidden = !showFade;
    chart.data.datasets[DS.sells].data = sells; chart.data.datasets[DS.buys].data = buys; chart.data.datasets[DS.fallbacks].data = fbs;
    if (canvas.clientWidth > 0) chart.update('resize'); else { chart.update('none'); pendingLayoutFix = true; }
  }
  function wireLegend(){
    document.querySelectorAll('.dr-channel-legend .dr-legend-item[data-dataset-idx]').forEach(function(item){
      function toggle(){ var idx = parseInt(item.getAttribute('data-dataset-idx'), 10); if (isNaN(idx) || !chart) return; var vis = !chart.isDatasetVisible(idx); chart.setDatasetVisibility(idx, vis); chart.update('none'); item.classList.toggle('off', !vis); item.setAttribute('aria-pressed', vis ? 'true' : 'false'); }
      item.addEventListener('click', toggle);
      item.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    });
  }
  function wireToday(){
    function caption(p, source){ var s = $('drTodaySpot'), m = $('drTodayMult'); if (!s || !m) return; var l = $('drTodayLabel'); if (l && typeof todayPriceLabel === 'function') l.textContent = todayPriceLabel(source); s.textContent = p >= 1000 ? '$' + (p / 1000).toFixed(1) + 'K' : '$' + Math.round(p).toLocaleString(); var t = plPrice(TODAY_DAYS); m.textContent = t > 0 ? (p / t).toFixed(2) + '×' : '—×'; }
    caption(TODAY_PRICE);
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function(p, source){
      if (!(p > 0)) return;
      liveBtcPrice = p; liveSource = source; caption(p, source);
      var h = chart.data.datasets[DS.history].data, last = h[h.length - 1];
      if (last && last.x > PL_DATA[PL_DATA.length - 1][0]) last.y = p; else h.push({ x: TODAY_DAYS, y: p });
      render();
    });
  }
  // ─── Range (review round 1, item 11) ───
  // All history: first sample to today + 1 year. 10 / 5 / 2 years: back from
  // today, ending today + 6 months so the lines run a little ahead. Out to
  // 2035: two years back to the end of 2035. The y-axis is fitted to what the
  // window holds (bands, the rule's levels, price); markers outside it are not
  // drawn. Sticky as dr:range.
  var RANGES = ['all', '10y', '5y', '2y', '2035'], range = 'all', YR = 365.25;
  function rangeWindow(r){
    if (r === '10y' || r === '5y' || r === '2y') return [todayD - parseInt(r, 10) * YR, todayD + YR / 2];
    if (r === '2035') return [todayD - 2 * YR, RE.dayOfIso('2036-01-01')];
    return [minD, todayD + YR];
  }
  function nice(v, dir){ if (v <= 0) return v; var pow = Math.pow(10, Math.floor(Math.log10(v))), lead = v / pow, c = [1, 1.5, 2, 3, 5, 7, 10], i; if (dir === 'down') { for (i = c.length - 1; i >= 0; i--) if (c[i] <= lead * 1.0000001) return c[i] * pow; return c[0] * pow; } for (i = 0; i < c.length; i++) if (c[i] >= lead / 1.0000001) return c[i] * pow; return c[c.length - 1] * pow; }
  function applyRange(){
    if (!chart) return;
    var w = rangeWindow(range), R = S.R, lo = Infinity, hi = -Infinity, topM = Math.max(PL_CEIL, R.sx), botM = Math.min(PL_FLOOR, R.rx);
    for (var d = w[0]; d <= w[1] + 30; d += 15) { var t = plPrice(Math.min(d, w[1])); lo = Math.min(lo, t * botM); hi = Math.max(hi, t * topM); }
    chart.data.datasets[DS.history].data.forEach(function(p){ if (p.x >= w[0] && p.x <= w[1]) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); } });
    var xs = chart.options.scales.x, ys = chart.options.scales.y;
    xs.min = w[0]; xs.max = w[1]; ys.min = nice(lo / 1.1, 'down'); ys.max = nice(hi * 1.1, 'up');
  }
  function inWindow(pt){ var w = rangeWindow(range); return pt.x >= w[0] && pt.x <= w[1]; }
  function wireRange(){
    var btns = document.querySelectorAll('.dr-range-btn'); if (!btns.length) return;
    var saved = load('range'); if (RANGES.indexOf(saved) >= 0) range = saved;
    function mark(){ btns.forEach(function(b){ var on = b.getAttribute('data-range') === range; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', String(on)); }); }
    mark();
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        range = btn.getAttribute('data-range'); mark(); store('range', range);
        updateChart1(lastT);
      });
    });
  }
  // One tick per year (1 January, UTC), thinned to fit the axis width, so a
  // year is never labelled twice. Shared by both charts.
  function yearTicks(axis){
    var lo = axis.min, hi = axis.max, y0 = new Date(GENESIS_TS * 1000 + lo * 864e5).getUTCFullYear(), y1 = new Date(GENESIS_TS * 1000 + hi * 864e5).getUTCFullYear(), ys = [];
    for (var y = y0; y <= y1 + 1; y++) { var d = RE.dayOfIso(y + '-01-01'); if (d >= lo && d <= hi) ys.push(d); }
    var room = Math.max(2, Math.floor((axis.width || axis.chart.width || 600) / 46)), step = Math.max(1, Math.ceil(ys.length / room));
    axis.ticks = ys.filter(function(d, i){ return i % step === 0; }).map(function(d){ return { value: d }; });
  }
  function yearLabel(v){ return new Date(GENESIS_TS * 1000 + v * 864e5).getUTCFullYear(); }

  // ═══ CHART 2 — your stack over time, rule vs HODL ═══
  var chart2 = null, canvas2 = $('dr2StackChart'), pending2 = false;
  function buildChart2(){
    if (!canvas2 || typeof Chart === 'undefined') return;
    var col = { rule: cssVar('--orange'), hodl: cssVar('--text-muted'), muted: cssVar('--dr-axis'), grid: cssVar('--dr-grid'), tipBg: cssVar('--dr-tip-bg'), tipBorder: cssVar('--dr-tip-border'), tipBody: cssVar('--dr-tip-body') };
    var endLabel = { id: 'dr2EndLabel', afterDatasetsDraw: function(ch){ var ds = ch.data.datasets[1], meta = ch.getDatasetMeta(1); if (!ds || !meta.data.length) return; var pt = meta.data[meta.data.length - 1], v = ds.data[ds.data.length - 1].y, c = ch.ctx; c.save(); c.fillStyle = col.rule; c.beginPath(); c.arc(pt.x, pt.y, 3.5, 0, 2 * Math.PI); c.fill(); c.font = '12px Inter, sans-serif'; c.textAlign = 'right'; c.fillText(S.unit === 'usd' ? usd(v) : btcf(v), pt.x - 8, pt.y - 9); c.restore(); } };
    chart2 = new Chart(canvas2, {
      type: 'scatter',
      data: { datasets: [
        { label: 'HODL', data: [], borderColor: col.hodl, borderWidth: 1.4, borderDash: [5, 4], pointRadius: 0, showLine: true, order: 2 },
        { label: 'With your rules', data: [], borderColor: col.rule, borderWidth: 2, pointRadius: 0, showLine: true, order: 1 }
      ] },
      plugins: [endLabel],
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        layout: { padding: { top: 18 } },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: col.tipBg, borderColor: col.tipBorder, borderWidth: 1, bodyColor: col.tipBody, titleColor: col.rule,
          callbacks: { title: function(it){ return it.length ? my(it[0].parsed.x) : ''; }, label: function(it){ return it.dataset.label + ': ' + (S.unit === 'usd' ? usd(it.parsed.y) : btcf(it.parsed.y)); } } } },
        scales: {
          x: { type: 'linear', grid: { color: col.grid }, afterBuildTicks: yearTicks, ticks: { color: col.muted, autoSkip: false, maxRotation: 0, callback: yearLabel } },
          y: { type: 'linear', grid: { color: col.grid }, ticks: { color: col.muted, callback: function(v){ return S.unit === 'usd' ? usd(v) : stackNum(v); } } }
        }
      }
    });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function(){ if (pending2 && canvas2.clientWidth > 0) { pending2 = false; chart2.update('resize'); } }).observe(canvas2);
  }
  function updateChart2(T){
    if (!chart2) return;
    var k = S.stack, usdMode = S.unit === 'usd', s = T.ser;
    chart2.data.datasets[0].data = s.map(function(p){ return { x: p.d, y: usdMode ? p.p * k : k }; });
    chart2.data.datasets[0].borderDash = usdMode ? [] : [5, 4];
    chart2.data.datasets[1].data = s.map(function(p){ return { x: p.d, y: usdMode ? p.usd * k : p.coins * k }; });
    chart2.options.scales.y.type = usdMode ? 'logarithmic' : 'linear';
    // Item 12: in bitcoin, the y-axis runs on round steps (0.85, 0.90 … 1.15
    // at the defaults), not the data's own min and max.
    var yo = chart2.options.scales.y;
    if (!usdMode) {
      var all = s.map(function(p){ return p.coins * k; }).concat([k]), lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), pad = Math.max((hi - lo) * 0.1, 0.05 * k);
      var span = (hi - lo) + 2 * pad, raw = span / 7, pow = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 2.5, 5, 10].map(function(m){ return m * pow; }).filter(function(v){ return v >= raw; })[0];
      yo.min = Math.max(0, Math.floor((lo - pad) / step + 1e-9) * step); yo.max = Math.ceil((hi + pad) / step - 1e-9) * step; yo.ticks.stepSize = step;
    }
    else { yo.min = undefined; yo.max = undefined; yo.ticks.stepSize = undefined; }
    chart2.options.scales.x.min = s[0].d; chart2.options.scales.x.max = s[s.length - 1].d;
    if (canvas2.clientWidth > 0) chart2.update('resize'); else { chart2.update('none'); pending2 = true; }
  }

  // ═══ URL (spec §7) ═══
  var KEYS = ['preset', 'sx', 'st', 'sz', 'f', 'rx', 'cap', 'account', 'tax', 'state', 'sell', 'rebuy'];
  function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }
  function r2(v){ return Math.round(v * 100) / 100; }
  function nearestFed(v){ return [0, 15, 20].reduce(function(b, c){ return Math.abs(c - v) < Math.abs(b - v) ? c : b; }, 15); }
  // Parse a query string into a state patch. Pure, so drQA can test it.
  function parseParams(p){
    var out = { present: false };
    KEYS.forEach(function(k){ if (p.has(k)) out.present = true; });
    if (p.has('from') && p.get('from') === 'spikes') { out.fromSpikes = true; out.present = true; }
    if (p.has('rb')) out.rb = p.get('rb');
    // Old ?preset= links (Stage A) land on that preset's values; the writer
    // never emits preset=, so it drops on the next write.
    var preset = p.get('preset'), base = PRESETS[preset] ? preset : 'conservative';
    if (PRESETS[preset]) out.R = copy(PRESETS[preset]);
    var ruleKeys = ['sx', 'st', 'sz', 'f', 'rx', 'cap'].filter(function(k){ return p.has(k); });
    if (ruleKeys.length) {
      var R = copy(PRESETS[base]), v;
      if (p.has('st') && (p.get('st') === 'up' || p.get('st') === 'fade')) R.timing = p.get('st');
      v = parseFloat(p.get('sx')); if (isFinite(v)) R.sx = r2(clamp(v, SX_MIN, SX_MAX));
      R.sz = R.sx; v = parseFloat(p.get('sz')); if (R.timing === 'fade' && isFinite(v)) R.sz = r2(clamp(v, 1, R.sx));
      v = parseFloat(p.get('f')); if (isFinite(v)) R.f = clamp(Math.round(v / 5) * 5, 5, 100);
      v = parseFloat(p.get('rx')); if (isFinite(v)) R.rx = r2(clamp(v, RX_MIN, RX_MAX));
      v = parseInt(p.get('cap'), 10); if ([0, 12, 18, 24, 36].indexOf(v) >= 0) R.cap = v;
      out.R = R;
    } else if (p.has('sell') || p.has('rebuy')) {
      // Legacy percentile links: the old rule sold everything on the way up
      // with no deadline; levels mapped on the since-2011 set.
      var sp = parseFloat(p.get('sell')), bp = parseFloat(p.get('rebuy'));
      var sx = r2(clamp(RE.ratioAtPercentile(isFinite(sp) ? sp : 80, '2011-01'), SX_MIN, SX_MAX)), rx = r2(clamp(RE.ratioAtPercentile(isFinite(bp) ? bp : 50, '2011-01'), RX_MIN, RX_MAX));
      out.R = { timing: 'up', sx: sx, sz: sx, f: 100, rx: rx, cap: 0 };
    }
    if (p.has('account')) { var a = p.get('account'); if (a === 'retirement') out.acct = 'ira'; else if (a === 'regular') out.acct = 'tax'; }
    if (p.has('tax')) { var t = parseFloat(p.get('tax')); if (isFinite(t)) out.fed = nearestFed(clamp(t, 0, 40)); }
    if (p.has('state')) { var sc = String(p.get('state')).toUpperCase(); if (/^[A-Z]{2,5}$/.test(sc) && $('dr2State').querySelector('option[value="' + sc + '"]')) out.state = sc; }
    return out;
  }
  function applyPatch(x){
    if (x.R) { S.R = x.R; S.szFollows = x.R.sz === x.R.sx; }
    if (x.acct) S.O.acct = x.acct;
    if (x.fed != null) S.O.fed = x.fed;
    if (x.state) S.O.state = x.state;
    if (x.fromSpikes) S.fromSpikes = true;
    if (x.rb) S.rb = x.rb;
  }
  function writeParams(p){
    KEYS.forEach(function(k){ p.delete(k); });
    var R = S.R, isDef = ['timing', 'sx', 'sz', 'f', 'rx', 'cap'].every(function(k){ return R[k] === DEF_R[k]; });
    if (!isDef) {
      p.set('sx', String(R.sx)); p.set('st', R.timing);
      if (R.timing === 'fade' && R.sz !== R.sx) p.set('sz', String(R.sz));
      p.set('f', String(R.f)); p.set('rx', String(R.rx));
      if (R.cap !== 24) p.set('cap', String(R.cap));
    }
    if (S.O.acct === 'tax') {
      p.set('account', 'regular');
      if (S.O.fed !== DEF_O.fed) p.set('tax', String(S.O.fed));
      if (S.O.state !== DEF_O.state) p.set('state', S.O.state);
    }
    return p;
  }
  function scenarioUrl(){ var qs = writeParams(new URLSearchParams(location.search)).toString(); return location.origin + location.pathname + (qs ? '?' + qs : '') + location.hash; }
  window.drScenarioUrl = scenarioUrl;
  var _urlT = null;
  function scheduleUrl(){
    if (!interacted || !window.history || !history.replaceState) return;
    clearTimeout(_urlT);
    _urlT = setTimeout(function(){ var qs = writeParams(new URLSearchParams(location.search)).toString(); history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); }, 220);
  }

  // ═══ Stickiness (dr: keys; stack never saved) ═══
  function store(k, v){ try { localStorage.setItem('dr:' + k, v); } catch (e) {} }
  function load(k){ try { return localStorage.getItem('dr:' + k); } catch (e) { return null; } }
  function removeOldKeys(){
    try { ['sellPct', 'rebuyPct', 'taxRate', 'accountType', 'era', 'customizeOpen', 'horizon'].forEach(function(k){ localStorage.removeItem('dr:' + k); }); } catch (e) {}
  }
  // Stage B: the rule alone is stored (dr:rule). A Stage A dr:preset is read
  // once, when there is no stored rule, then removed.
  function saveSticky(){
    store('rule', JSON.stringify(S.R)); store('acct', S.O.acct); store('fed', String(S.O.fed)); store('niit', S.O.niit ? '1' : '0');
    store('state', S.O.state); store('lots', S.O.lots); store('yield', String(S.O.yield)); store('start', S.start); store('unit', S.unit);
  }
  function loadSticky(){
    var R = null;
    try { R = JSON.parse(load('rule') || 'null'); } catch (e) {}
    if (R && R.sx) { var sx = r2(clamp(+R.sx, SX_MIN, SX_MAX)); S.R = { timing: R.timing === 'up' ? 'up' : 'fade', sx: sx, sz: r2(clamp(+R.sz || sx, 1, sx)), f: clamp(Math.round(+R.f / 5) * 5 || 25, 5, 100), rx: r2(clamp(+R.rx, RX_MIN, RX_MAX)), cap: [0, 12, 18, 24, 36].indexOf(+R.cap) >= 0 ? +R.cap : 24 }; S.szFollows = S.R.sz === S.R.sx; }
    else { var p = load('preset'); if (PRESETS[p]) S.R = copy(PRESETS[p]); }
    try { localStorage.removeItem('dr:preset'); } catch (e) {}
    var a = load('acct'); if (a === 'ira' || a === 'tax') S.O.acct = a;
    var f = parseInt(load('fed'), 10); if ([0, 15, 20].indexOf(f) >= 0) S.O.fed = f;
    S.O.niit = load('niit') === '1';
    var st = load('state'); if (st && (st === 'NONE' || $('dr2State').querySelector('option[value="' + st + '"]'))) S.O.state = st;
    var l = load('lots'); if (l === 'fifo' || l === 'hifo') S.O.lots = l;
    var y = parseInt(load('yield'), 10); if (y === 0 || y === 4) S.O.yield = y;
    var s = load('start'); if (s === '2011-01' || s === '2014-01' || s === '2017-01') S.start = s;
    var u = load('unit'); if (u === 'coins' || u === 'usd') S.unit = u;
  }

  // ═══ Arrival from Bitcoin's Spikes (from=spikes) ═══
  function renderArrival(){
    var a = $('dr2Arrival'); if (!a || !S.fromSpikes) return;
    var R = S.R, acct = S.O.acct === 'ira' ? 'IRA' : 'taxable';
    var what = (R.f === 100 ? 'sell all' : 'sell ' + R.f + '%') + ' at ' + fx(R.sx) + ' trend, buy back at ' + (R.rx === 1 ? 'trend' : fx(R.rx) + ' trend') + ', ' + acct;
    a.innerHTML = '<b>Picked up from Bitcoin\'s Spikes:</b> ' + what + '. I added the 24-month deadline this page uses by default to the buy-back rule. Most readers trim less than 100%; try <a href="#" id="dr2Try25">selling 25% instead</a>.' +
      (S.rb === 'ath80' ? ' Spikes\' “80% below the high” buy back isn\'t available here yet, so this uses trend.' : '');
    a.hidden = false;
    $('dr2Try25').addEventListener('click', function(ev){ ev.preventDefault(); S.R.f = 25; ruleChanged('share'); render(); });
    track('dr_arrival', { sx: R.sx, account: S.O.acct });
  }

  // ═══ Wiring ═══
  function wire(){
    ['input', 'change', 'click'].forEach(function(ev){ document.addEventListener(ev, function(e){ if (e.target && e.target.closest && e.target.closest('#tab-calculator')) interacted = true; }, { capture: true }); });
    function seg(id, fn){ document.querySelectorAll('#' + id + ' button').forEach(function(b){ b.addEventListener('click', function(){ fn(b.dataset.v); render(); }); }); }
    seg('dr2SegTiming', function(v){ S.R.timing = v; S.R.sz = S.R.sx; S.szFollows = true; enforceOrder('timing'); ruleChanged('timing'); });
    seg('dr2SegCap', function(v){ S.R.cap = +v; ruleChanged('deadline'); });
    seg('dr2SegYield', function(v){ S.O.yield = +v; ruleChanged('cash_yield'); });
    // Taxable opens the tax settings, which live in "More tax and timing settings".
    seg('dr2SegAcct', function(v){ S.O.acct = v; if (v === 'tax') $('dr2Build').open = true; ruleChanged('account'); });
    seg('dr2SegFed', function(v){ S.O.fed = +v; ruleChanged('federal_rate'); });
    seg('dr2SegLots', function(v){ S.O.lots = v; ruleChanged('lots'); });
    seg('dr2SegStart', function(v){ S.start = v; });
    seg('dr2SegUnit', function(v){ S.unit = v; });
    // The two sliders: labels move at once, the page follows on soon().
    // Both sliders are positions 0–1000 on the shared log scale. A drag reads
    // the position back as a level, snapped and clamped to that rule.
    function setSx(v){ S.R.sx = v; S.R.sz = (S.szFollows || S.R.timing === 'up') ? v : Math.min(S.R.sz, v); enforceOrder('sx'); ruleChanged('sell_level'); }
    function setRx(v){ S.R.rx = v; enforceOrder('rx'); ruleChanged('buyback_level'); }
    $('dr2SxR').addEventListener('input', function(e){ setSx(snapLevel('sx', fromPos(+e.target.value))); soon(); });
    $('dr2RxR').addEventListener('input', function(e){ setRx(snapLevel('rx', fromPos(+e.target.value))); soon(); });
    // On release, the thumb settles on the snapped level's position.
    ['dr2SxR', 'dr2RxR'].forEach(function(id){ $(id).addEventListener('change', function(){ $(id).value = toPos(id === 'dr2SxR' ? S.R.sx : S.R.rx); }); });
    // Keyboard: one snap per arrow press (the 0–1000 positions are finer than a
    // snap, so the browser's own step would often change nothing). Page keys
    // move ten snaps; Home and End go to the rule's own ends.
    function keyStep(id, k, set){
      $(id).addEventListener('keydown', function(e){
        var st = SNAP[k], cur = S.R[k], v = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = cur + st;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = cur - st;
        else if (e.key === 'PageUp') v = cur + 10 * st;
        else if (e.key === 'PageDown') v = cur - 10 * st;
        else if (e.key === 'Home') v = k === 'sx' ? SX_MIN : RX_MIN;
        else if (e.key === 'End') v = k === 'sx' ? SX_MAX : RX_MAX;
        if (v == null) return;
        e.preventDefault();
        set(snapLevel(k, v)); $(id).value = toPos(S.R[k]); soon();
      });
    }
    keyStep('dr2SxR', 'sx', setSx); keyStep('dr2RxR', 'rx', setRx);
    $('dr2Sz').addEventListener('input', function(e){ S.R.sz = Math.min(+e.target.value, S.R.sx); S.szFollows = S.R.sz === S.R.sx; enforceOrder('sz'); ruleChanged('fade_level'); soon(); });
    $('dr2Reset').addEventListener('click', function(){ S.R = copy(DEF_R); S.szFollows = true; S.O.acct = 'ira'; ruleChanged('reset'); render(); });
    $('dr2Niit').addEventListener('change', function(e){ S.O.niit = e.target.checked; render(); });
    $('dr2State').addEventListener('change', function(e){ S.O.state = e.target.value; render(); });
    $('dr2Stack').addEventListener('input', function(e){ var v = +e.target.value; if (v > 0) { S.stack = v; render(); } });
    wireBar();
    document.querySelectorAll('#tab-calculator [data-handoff]').forEach(function(a){ a.addEventListener('click', function(){ track('dr_handoff', { destination: a.getAttribute('data-handoff') }); }); });
  }

  // ═══ Sticky rule bar (review round 1, item 9) ═══
  // Fixed under the site's sticky nav (its height measured, not assumed) from
  // the moment the rule card has scrolled out of view until the end of the
  // presets block, where it scrolls away with that block's bottom edge. Its
  // controls set the same state as the card's, so render() keeps both in sync.
  // The bar's level fields (2026-10-05): the panel sliders' ranges and steps.
  // Typing applies after a 200ms pause when the value is in range; blur
  // clamps an out-of-range value, and an empty or invalid one reverts to the
  // last good value. Any edit switches the preset to Custom.
  // Stage B: the card's "How much" field uses the same handling (dr2FIn).
  var BAR_FIELDS = [
    { id: 'dr2BarSx', k: 'sx', lo: SX_MIN, hi: function(){ return SX_MAX; }, step: 0.05 },
    { id: 'dr2BarSz', k: 'sz', lo: 1, hi: function(){ return S.R.sx; }, step: 0.05 },
    { id: 'dr2BarF', k: 'f', lo: 5, hi: function(){ return 100; }, step: 5 },
    { id: 'dr2BarRx', k: 'rx', lo: RX_MIN, hi: function(){ return RX_MAX; }, step: 0.01 },
    { id: 'dr2FIn', k: 'f', lo: 5, hi: function(){ return 100; }, step: 5 }
  ];
  var LEVEL_GA = { sx: 'sell_level', sz: 'fade_level', f: 'share', rx: 'buyback_level' };
  function setLevel(k, v){
    if (k === 'sx') { S.R.sx = v; S.R.sz = (S.szFollows || S.R.timing === 'up') ? v : Math.min(S.R.sz, v); }
    else if (k === 'sz') { S.R.sz = Math.min(v, S.R.sx); S.szFollows = S.R.sz === S.R.sx; }
    else S.R[k] = v;
    enforceOrder(k);
    ruleChanged(LEVEL_GA[k]); render();
  }
  function wireBarFields(){
    BAR_FIELDS.forEach(function(f){
      var el = $(f.id), t = null;
      function snap(v){ return f.k === 'f' ? Math.round(v / f.step) * f.step : r2(Math.round(v / f.step) * f.step); }
      function parse(){ var s = String(el.value).trim(); if (s === '') return NaN; var v = parseFloat(s); return isFinite(v) ? v : NaN; }
      el.addEventListener('input', function(){
        clearTimeout(t);
        t = setTimeout(function(){ var v = parse(); if (isFinite(v) && v >= f.lo && v <= f.hi() && snap(v) !== S.R[f.k]) setLevel(f.k, snap(v)); }, 200);
      });
      function commit(){
        clearTimeout(t);
        var v = parse();
        if (isFinite(v)) { v = snap(clamp(v, f.lo, f.hi())); if (v !== S.R[f.k]) setLevel(f.k, v); }
        el.value = String(S.R[f.k]);
      }
      el.addEventListener('change', commit);
      el.addEventListener('blur', commit);
    });
    $('dr2BarCap').addEventListener('change', function(e){ S.R.cap = +e.target.value; ruleChanged('deadline'); render(); });
  }
  // The bar shows from when the rule card leaves the viewport to the end of
  // Looking ahead. "Edit rules" goes back to the sell slider.
  function wireBar(){
    var bar = $('dr2Bar'), card = $('dr2RuleCard'), end = $('dr2AheadCard'), nav = document.querySelector('.site-nav'), tab = $('tab-calculator');
    if (!bar || !card || !end) return;
    wireBarFields();
    bar.querySelectorAll('#dr2BarAcct .dr2-chip').forEach(function(b){ b.addEventListener('click', function(){ S.O.acct = b.dataset.v; ruleChanged('account'); render(); }); });
    $('dr2BarEdit').addEventListener('click', function(){
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      card.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      $('dr2SxR').focus({ preventScroll: true });
    });
    function place(){
      var navB = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
      // The results panel sticks just under the nav, measured, not assumed.
      document.documentElement.style.setProperty('--dr2-panel-top', (navB + 12) + 'px');
      if (!tab || !tab.classList.contains('active')) { hide(); return; }
      var cardB = card.getBoundingClientRect().bottom, endB = end.getBoundingClientRect().bottom;
      if (cardB > navB || endB <= navB) { hide(); return; }
      var entering = bar.hidden;
      bar.hidden = false;
      var h = bar.offsetHeight;
      bar.style.top = Math.min(navB, endB - h) + 'px';
      if (entering) bar.classList.add('is-entering');
      // Keyboard focus moved by the browser lands below the bar, not under it.
      document.documentElement.style.scrollPaddingTop = (navB + h + 8) + 'px';
    }
    function hide(){
      if (bar.hidden) return;
      bar.hidden = true; bar.classList.remove('is-entering'); document.documentElement.style.scrollPaddingTop = '';
    }
    // Placed synchronously on scroll (three rect reads), so the bar never lags
    // the content by a frame.
    function onScroll(){ place(); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);   // STYLE_GUIDE §6.45: re-measure once fonts settle
    document.querySelectorAll('.tab-btn').forEach(function(b){ b.addEventListener('click', function(){ setTimeout(place, 0); }); });
    bar.addEventListener('animationend', function(){ bar.classList.remove('is-entering'); });
    place();
  }

  // ═══ drQA() — the §5 fixture, pinned to the 2026-09-30 sample ═══
  var ANCHOR = '2026-09-30';
  var FIXTURE = {
    // Taxable = federal 20% + NIIT, no state, FIFO, cash 0%, 24-month deadline, 1 BTC.
    presets: {
      conservative: { ira11: 1.10, ira14: 1.35, tax11: 0.82, tax14: 1.18 },
      balanced:     { ira11: 1.35, ira14: 2.25, tax11: 0.75, tax14: 1.68 },
      adventurous:  { ira11: 1.12, ira14: 2.59, tax11: 0.48, tax14: 1.75 }
    },
    conservativeCycles: [
      { name: '2011', sold: 'Sep 2011', sp: 5.02, sr: 1.65, bought: 'Oct 2011', bp: 3.32, br: 0.89, m: 1.13 },
      { name: '2013', sold: 'Apr 2013', sp: 68, sr: 1.58, bought: 'Jan 2015', bp: 270, br: 0.87, m: 0.81 },
      { name: '2017', sold: 'Apr 2018', sp: 6828, sr: 1.87, bought: 'Nov 2018', bp: 3828, br: 0.70, m: 1.20 },
      { name: '2021', sold: 'Jan 2021', sp: 30419, sr: 1.79, bought: 'May 2022', bp: 30279, br: 0.98, m: 1.00 }
    ],
    lastPeak: 1.19,
    shares: { above2x2011: 17, above2x2017: 13, below1x2011: 56 },
    legacy: { sell80: 1.78, rebuy50: 0.87 },
    // Stage B build prompt §8 (2026-10-06), IRA, starting rules unless noted.
    // projAlt is 2.21, not the prompt's 2.23: the prompt's figure used the
    // rounded peaks (3.2×, 5.4×); the record's 3.19× and 5.41× give 2.214.
    // Both print as "about 2.2×".
    stageB: {
      sell12since14: 0.95, sell12fired: 4,
      projLo: 1.06, projHi: 1.13, projAlt: 2.21,
      lowDays: [1240, 2452, 3688, 5116, 6400],
      fwd11: 1.00, fwd22: { mid: 1.58, lo: 1.48, hi: 1.70 }, breakaway: 0.80,
      sellHits2: '2021,2017,2013,2011', buyHits045: '2026,2023,2015'
    }
  };
  function drQA(){
    var f = [];
    function near(label, got, want, tol){ if (got == null || !(Math.abs(got - want) <= tol)) f.push(label + ' ' + (got == null ? 'none' : +got.toFixed(3)) + ' vs ' + want + ' (±' + tol + ')'); }
    var anchor = null; PL_DATA.forEach(function(r){ if (RE.isoOf(r[0]) === ANCHOR) anchor = r[0]; });
    if (anchor == null) f.push('fixture anchor ' + ANCHOR + ' is no longer in PL_DATA');
    var asOf = anchor != null ? anchor : RE.dayOfIso(ANCHOR);
    var IRA = { acct: 'ira', fed: 20, niit: true, state: 0, lots: 'fifo', yield: 0, asOf: asOf };
    var TAX = { acct: 'tax', fed: 20, niit: true, state: 0, lots: 'fifo', yield: 0, asOf: asOf };
    function o(base, start){ var x = copy(base); x.start = start; return x; }
    Object.keys(FIXTURE.presets).forEach(function(k){
      var w = FIXTURE.presets[k];
      near(k + ' IRA since 2011', RE.run(PRESETS[k], o(IRA, '2011-01')).end, w.ira11, 0.01);
      near(k + ' IRA since 2014', RE.run(PRESETS[k], o(IRA, '2014-01')).end, w.ira14, 0.01);
      near(k + ' taxable since 2011', RE.run(PRESETS[k], o(TAX, '2011-01')).end, w.tax11, 0.01);
      near(k + ' taxable since 2014', RE.run(PRESETS[k], o(TAX, '2014-01')).end, w.tax14, 0.01);
    });
    var t = RE.run(PRESETS.conservative, o(IRA, '2011-01'));
    FIXTURE.conservativeCycles.forEach(function(w, i){
      var c = t.cyc[i];
      if (!c || !c.sell || !c.buy) { f.push('conservative ' + w.name + ' did not sell and buy back'); return; }
      if (my(c.sell.d) !== w.sold) f.push('conservative ' + w.name + ' sold ' + my(c.sell.d) + ' ≠ ' + w.sold);
      if (my(c.buy.d) !== w.bought) f.push('conservative ' + w.name + ' bought ' + my(c.buy.d) + ' ≠ ' + w.bought);
      near('conservative ' + w.name + ' sale price', c.sell.p, w.sp, Math.max(0.01, w.sp * 0.005));
      near('conservative ' + w.name + ' buy price', c.buy.p, w.bp, Math.max(0.01, w.bp * 0.005));
      near('conservative ' + w.name + ' sale ×trend', c.sell.r, w.sr, 0.01);
      near('conservative ' + w.name + ' buy ×trend', c.buy.r, w.br, 0.01);
      near('conservative ' + w.name + ' coins after', c.buy.after / c.sell.before, w.m, 0.01);
    });
    if (t.cyc[4].sell) f.push('conservative 2024–25 sold; fixture says never');
    near('2024–25 peak ×trend', t.cyc[4].peak, FIXTURE.lastPeak, 0.01);
    near('share at or above 2× since 2011 %', Math.round(RE.pctAtOrAbove(2, '2011-01', asOf)), FIXTURE.shares.above2x2011, 0);
    near('share at or above 2× since 2017 %', Math.round(RE.pctAtOrAbove(2, '2017-01', asOf)), FIXTURE.shares.above2x2017, 0);
    near('share at or below 1× since 2011 %', Math.round(RE.pctAtOrBelow(1, '2011-01', asOf)), FIXTURE.shares.below1x2011, 0);
    // Legacy mapping, through the page's own parser.
    var lg = parseParams(new URLSearchParams('sell=80&rebuy=50&account=regular'));
    near('legacy sell=80 → ×trend', lg.R && lg.R.sx, FIXTURE.legacy.sell80, 0.01);
    near('legacy rebuy=50 → ×trend', lg.R && lg.R.rx, FIXTURE.legacy.rebuy50, 0.01);
    if (lg.acct !== 'tax') f.push('legacy account=regular did not map to taxable');
    // ── Stage B (2026-10-06), at the same anchor ──
    var IRA0 = { acct: 'ira', fed: 15, niit: false, state: 0, lots: 'fifo', yield: 0, asOf: asOf };
    var r12 = copy(DEF_R); r12.sx = 1.2; r12.sz = 1.2;
    near('sell at 1.2× IRA since 2014', RE.run(r12, o(IRA0, '2014-01')).end, FIXTURE.stageB.sell12since14, 0.01);
    var c12 = RE.run(r12, o(IRA0, '2011-01')).cyc.filter(function(c){ return c.sell; }).length;
    if (c12 !== FIXTURE.stageB.sell12fired) f.push('sell at 1.2×: sell rule fired in ' + c12 + ' of 5 cycles ≠ ' + FIXTURE.stageB.sell12fired);
    var pj = SR.nextSpike(asOf);
    near('projection, shrinking continues (low)', pj.lo, FIXTURE.stageB.projLo, 0.01);
    near('projection, shrinking continues (high)', pj.hi, FIXTURE.stageB.projHi, 0.01);
    near('projection, 2024–25 unusually small', pj.alt, FIXTURE.stageB.projAlt, 0.01);
    var lowsA = SR.cycleLows(asOf), lowDays = lowsA.map(function(l){ return l.d; });
    if (lowDays.join(',') !== FIXTURE.stageB.lowDays.join(',')) f.push('cycle-low days ' + lowDays.join(',') + ' ≠ ' + FIXTURE.stageB.lowDays.join(','));
    var rpA = RE.replays(lowDays, asOf), fo = copy(IRA0); fo.fast = true;
    var fr = forwardRows(DEF_R, fo, rpA), f11 = rowAt(fr, 1.1), f22 = rowAt(fr, 2.2);
    near('forward at about 1.1× (middle)', f11.mid, FIXTURE.stageB.fwd11, 0.01);
    near('forward at about 2.2× (middle)', f22.mid, FIXTURE.stageB.fwd22.mid, 0.01);
    near('forward at about 2.2× (band low)', f22.lo, FIXTURE.stageB.fwd22.lo, 0.01);
    near('forward at about 2.2× (band high)', f22.hi, FIXTURE.stageB.fwd22.hi, 0.01);
    near('breakaway at the starting rules', RE.runRows(rpA.breakaway, DEF_R, fo).end, FIXTURE.stageB.breakaway, 0.01);
    function ys(a){ return a.map(function(x){ return x.y; }).reverse().join(','); }
    var pkA = SR.nextSpike(asOf).peaks, sh = ys(pkA.filter(function(p){ return p.m >= 2 - EPS; })), bh = ys(lowsA.filter(function(l){ return l.m <= 0.45 + EPS; }));
    if (sh !== FIXTURE.stageB.sellHits2) f.push('sell at 2× ticks ' + sh + ' ≠ ' + FIXTURE.stageB.sellHits2);
    if (bh !== FIXTURE.stageB.buyHits045) f.push('buy back at 0.45× ticks ' + bh + ' ≠ ' + FIXTURE.stageB.buyHits045);
    // Lots: two lots, both long-term, rate 20%: FIFO sells the $100 lot (gain
    // $300 → $60), highest-cost-first the $300 lot ($100 → $20), and the old
    // average-cost method would use a $200 basis ($200 → $40).
    var g1 = RE.sellLots([{ b: 1, c: 100, d: 0 }, { b: 1, c: 300, d: 400 }], 1, 400, 800, 'fifo', 0.2, 0.4);
    var g2 = RE.sellLots([{ b: 1, c: 100, d: 0 }, { b: 1, c: 300, d: 400 }], 1, 400, 800, 'hifo', 0.2, 0.4);
    var avg = (400 - (100 + 300) / 2) * 1 * 0.2;
    near('FIFO taxable gain', g1, 60, 1e-9); near('highest-cost taxable gain', g2, 20, 1e-9); near('average-cost taxable gain', avg, 40, 1e-9);
    // Fallback: a sale on day 12 and a 12-month deadline (365.28 days) must buy
    // back on the first sample at or past day 377.28, i.e. day 384, not 372.
    var rows = []; for (var d = 0; d <= 600; d += 12) rows.push({ d: d, p: 100, r: d === 0 ? 1 : 1.2, ym: '2011-01' });
    var fb = RE.runRows(rows, { timing: 'up', sx: 1.1, sz: 1.1, f: 50, rx: 0.5, cap: 12 }, { acct: 'ira', fed: 0, niit: false, state: 0, lots: 'fifo', yield: 0 });
    var buy = fb.ev.filter(function(e){ return e.t === 'buy'; })[0];
    if (!buy || buy.d !== 384 || buy.why !== 'fallback') f.push('fallback fired at ' + (buy ? buy.d + ' (' + buy.why + ')' : 'never') + ', expected 384');
    // A bare load must leave the address bar alone.
    if (!interacted && location.href !== INITIAL_HREF) f.push('bare load changed location.href');
    var sq = typeof window.spikesQA === 'function' ? window.spikesQA().pass : 'run on /bitcoin-spikes';
    if (sq === false) f.push('spikesQA() failed');
    return { pass: f.length === 0, failures: f, anchor: ANCHOR, spikesQA: sq, live: { conservativeIRA11: +RE.run(PRESETS.conservative, engineOpts(DEF_O, '2011-01')).end.toFixed(3) } };
  }
  window.drQA = drQA;
  // Console hook for preview checks: renders the failure box for a given list,
  // so the neutral "No losing round trips" state can be seen without hunting
  // for a rule that reaches it. Changes nothing else; the next render restores.
  window.drDebug = { renderFailBox: renderFailBox };

  // ═══ Live figures in the Question and Math tabs (spec §3) ═══
  // Each [data-dr-math] span and the percentile table are computed here, so
  // the prose can't drift from the engine.
  function renderMathFigures(){
    var IRA = engineOpts({ acct: 'ira', fed: 15, niit: false, state: 'NONE', lots: 'fifo', yield: 0 }, '2011-01');
    function end(R, start){ var o = copy(IRA); o.start = start; return RE.run(R, o).end; }
    var upHalf = { timing: 'up', sx: 1.75, sz: 1.75, f: 50, rx: 0.85, cap: 24 }, upAll = { timing: 'up', sx: 1.75, sz: 1.75, f: 100, rx: 0.85, cap: 24 };
    var strand = { timing: 'up', sx: 2, sz: 2, f: 100, rx: 0.5, cap: 0 }, strand24 = copy(strand); strand24.cap = 24;
    var samp = RE.run({ timing: 'up', sx: 1.5, sz: 1.5, f: 100, rx: 1, cap: 0 }, IRA).ev.filter(function(e){ return e.t === 'sell'; })[0];
    var P = function(p, from){ return RE.ratioAtPercentile(p, from); };
    var v = {
      p80all: P(80, '2010-01'), p80s11: P(80, '2011-01'), p80s17: P(80, '2017-01'), p50s11: P(50, '2011-01'),
      fade11: end(PRESETS.balanced, '2011-01'), fade14: end(PRESETS.balanced, '2014-01'), up11: end(upHalf, '2011-01'), up14: end(upHalf, '2014-01'),
      peak25: lastPeak(), strand0: end(strand, '2011-01'), strand24: end(strand24, '2011-01'), samp11: samp ? samp.r : null
    };
    document.querySelectorAll('[data-dr-math]').forEach(function(el){ var k = el.getAttribute('data-dr-math'), x = v[k]; if (x != null) el.textContent = mult(x); });
    document.querySelectorAll('[data-dr-math="g13"]').forEach(function(el){ el.textContent = Math.round(RE.trendGrowth(RE.dayOfIso('2013-07-01'))) + '%'; });
    document.querySelectorAll('[data-dr-math="gNow"]').forEach(function(el){ el.textContent = Math.round(RE.trendGrowth(RE.lastDay)) + '%'; });
    var body = $('drMathPctBody');
    if (body) body.innerHTML = [50, 70, 80, 90].map(function(p){ return '<tr><td>' + p + 'th</td><td>' + fx(P(p, '2010-01')) + ' trend</td><td>' + fx(P(p, '2011-01')) + ' trend</td><td>' + fx(P(p, '2017-01')) + ' trend</td></tr>'; }).join('');
    // The next-spike projection, in the Math tab and the Looking ahead disclosure.
    var PJ = { lo: PROJ.lo.toFixed(2) + '×', hi: PROJ.hi.toFixed(2) + '×', altExact: PROJ.alt.toFixed(2) + '×', mid: fx(PROJ.mid), alt: fx(PROJ.altShown) };
    document.querySelectorAll('[data-dr-proj]').forEach(function(el){ var k = el.getAttribute('data-dr-proj'); if (PJ[k]) el.textContent = PJ[k]; });
    if ($('drQ100')) $('drQ100').textContent = mult(end(upAll, '2011-01'));
    if ($('drQ50')) $('drQ50').textContent = mult(end(upHalf, '2011-01'));
  }

  // ═══ Init ═══
  function init(){
    // The shared state list carries Washington at 0% (right for real estate);
    // relabel it here so the dropdown says what the calculator applies.
    var wa = $('dr2State').querySelector('option[value="WA"]');
    if (wa) { wa.textContent = BTC_STATE_OVERRIDE.WA.label; var hi = document.createElement('option'); hi.value = 'WAHI'; hi.textContent = BTC_STATE_OVERRIDE.WAHI.label; wa.after(hi); }
    removeOldKeys();
    var x = window.URLSearchParams ? parseParams(new URLSearchParams(location.search)) : { present: false };
    if (x.present) applyPatch(x); else loadSticky();
    enforceOrder('sx');   // a link or stored rule with the buy-back level at or above the sale lands in order
    $('dr2Stack').value = S.stack;
    buildChart1(); buildChart2();
    wire();
    render();
    renderFailExample();
    renderMathFigures();
    renderArrival();
    var q = drQA();
    if (q.pass) console.log('[dr-qa] pass — §5 fixture verified at ' + q.anchor + '.');
    else console.error('[dr-qa] FAIL', q.failures);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();



// ═══════ SHARE THIS SCENARIO ═══════
// Discoverable share affordance with two functionally-distinct groups
// (same pattern as the Retirement page; see STYLE_GUIDE §6.26):
//   1. SHARE THIS SCENARIO  → scenario URL (currentUrl)  → Copy, Native
//   2. SHARE THE PAGE       → generic URL (genericPageUrl) → X, LI, FB
// Splitting these prevents accidental publication of personal scenario
// numbers when a user clicks a social button meaning to promote the page.
(function(){
  var SHARE_TITLE = 'Disciplined rebalancing of bitcoin — within the Power Law channel.';

  // The scenario link comes from the calculator's own URL writer, so it carries
  // the rule even before the reader has changed anything.
  function currentUrl() { return typeof window.drScenarioUrl === 'function' ? window.drScenarioUrl() : window.location.href; }
  function genericPageUrl() {
    return window.location.origin + window.location.pathname + window.location.hash;
  }

  function showCopiedFeedback(btn) {
    var labelEl = btn.querySelector('.share-btn-label');
    if (!labelEl) return;
    var original = labelEl.textContent;
    labelEl.textContent = 'Copied';
    btn.classList.add('share-btn-copied');
    setTimeout(function(){
      labelEl.textContent = original;
      btn.classList.remove('share-btn-copied');
    }, 1800);
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function bindCopy() {
    var btn = document.getElementById('shareCopy');
    if (!btn) return;
    btn.addEventListener('click', function(){
      var url = currentUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function(){ showCopiedFeedback(btn); },
          function(){ if (fallbackCopy(url)) showCopiedFeedback(btn); }
        );
      } else if (fallbackCopy(url)) {
        showCopiedFeedback(btn);
      }
    });
  }

  function bindIntentButton(id, urlGetter, urlBuilder) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var shareUrl = urlBuilder(urlGetter());
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=620,height=540');
    });
  }

  function bindNativeShare() {
    var btn = document.getElementById('shareNative');
    if (!btn || !navigator.share) return;
    btn.hidden = false;
    btn.addEventListener('click', function(){
      navigator.share({
        title: 'Disciplined rebalancing',
        text: SHARE_TITLE,
        url: currentUrl()
      }).catch(function(){ /* user cancelled — silent */ });
    });
  }

  function wireShareSection() {
    if (!document.getElementById('shareSection')) return;
    bindCopy();
    bindNativeShare();
    bindIntentButton('shareTwitter', genericPageUrl, function(url){
      return 'https://twitter.com/intent/tweet?url=' +
        encodeURIComponent(url) + '&text=' + encodeURIComponent(SHARE_TITLE);
    });
    bindIntentButton('shareLinkedIn', genericPageUrl, function(url){
      return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
    });
    bindIntentButton('shareFacebook', genericPageUrl, function(url){
      return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireShareSection);
  } else {
    wireShareSection();
  }
})();
