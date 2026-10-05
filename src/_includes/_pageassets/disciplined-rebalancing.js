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
  var hash = location.hash.replace('#','');
  if(hash){
    var target = document.querySelector('[data-tab="'+hash+'"]');
    if(target) target.click();
  }
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
  if (!window.RuleEngine || !document.getElementById('dr2RuleSentence')) return;
  var RE = window.RuleEngine;
  function $(id){ return document.getElementById(id); }
  function cssVar(n, fb){ var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || fb; }
  function track(name, params){ try { if (typeof gtag === 'function') gtag('event', name, params); } catch (e) {} }

  var INITIAL_HREF = location.href;
  var interacted = false;

  // ─── Presets (D1) ───
  var PRESETS = {
    conservative: { timing: 'fade', sx: 2, sz: 2, f: 25, rx: 1.0, cap: 24 },
    balanced:     { timing: 'fade', sx: 2, sz: 2, f: 50, rx: 0.85, cap: 24 },
    adventurous:  { timing: 'up', sx: 1.5, sz: 1.5, f: 75, rx: 0.7, cap: 24 }
  };
  var PRESET_NAMES = { conservative: 'Conservative', balanced: 'Balanced', adventurous: 'Adventurous', custom: 'Custom' };
  // Defaults. The state matches Bitcoin's Spikes' tax hurdle ("Not included"),
  // so a reader moving between the pages sees one assumption.
  var DEF_O = { acct: 'ira', fed: 15, niit: false, state: 'NONE', lots: 'fifo', yield: 0 };
  var S = { preset: 'conservative', R: copy(PRESETS.conservative), O: copy(DEF_O), stack: 1, start: '2011-01', unit: 'coins', fromSpikes: false, rb: null };
  function copy(o){ var r = {}; for (var k in o) r[k] = o[k]; return r; }

  // ─── State rates: the shared list's labels (reb.stateOptions), with one
  // bitcoin-specific override. The list was built for the real-estate pages,
  // where Washington is right at 0% (no income tax; real estate is exempt from
  // its capital gains tax). For bitcoin it isn't: Washington taxes long-term
  // gains, crypto included, at 7% above an inflation-adjusted deduction (about
  // $270k) and 9.9% above about $1.27M from 2025 (DATA_AUDIT DR-WA).
  var BTC_STATE_OVERRIDE = { WA: { rate: 7, label: 'Washington (7% on long-term gains above about $270k)' } };
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

  function ruleText(R){
    var sell = R.timing === 'up' ? 'Sell <strong>' + R.f + '%</strong> when price rises through <strong>' + fx(R.sx) + ' trend</strong>.'
      : 'Sell <strong>' + R.f + '%</strong> when price falls back below <strong>' + fx(R.sz) + ' trend</strong> after reaching ' + (R.sz === R.sx ? 'it' : fx(R.sx)) + '.';
    var buy = ' Buy back at <strong>' + fx(R.rx) + ' trend</strong>' + (R.cap ? ', or at market after <strong>' + R.cap + ' months</strong>.' : ', with no deadline.');
    return sell + buy;
  }

  function segSet(id, v){ document.querySelectorAll('#' + id + ' button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.v === v)); }); }
  function syncControls(){
    var R = S.R;
    document.querySelectorAll('.dr2-preset').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.p === S.preset)); });
    segSet('dr2SegTiming', R.timing); segSet('dr2SegCap', String(R.cap)); segSet('dr2SegYield', String(S.O.yield)); segSet('dr2SegAcct', S.O.acct);
    segSet('dr2SegFed', String(S.O.fed)); segSet('dr2SegLots', S.O.lots); segSet('dr2SegStart', S.start); segSet('dr2SegUnit', S.unit);
    $('dr2Sx').value = R.sx; $('dr2Sz').max = R.sx; $('dr2Sz').value = R.sz; $('dr2F').value = R.f; $('dr2Rx').value = R.rx;
    $('dr2SxOut').textContent = fx(R.sx); $('dr2SzOut').textContent = fx(R.sz); $('dr2FOut').textContent = R.f + '%'; $('dr2RxOut').textContent = fx(R.rx);
    $('dr2SxLbl').textContent = R.timing === 'up' ? 'Sell when price reaches' : 'Arm the rule when price reaches';
    $('dr2SzWrap').hidden = R.timing !== 'fade';
    $('dr2TimingCtx').textContent = R.timing === 'up' ? 'Sells as price climbs through the level. Simple, but in past cycles it often sold well before the top.' : 'Waits for the spike to reach the level, then sells when it turns back down. It caught more of past spikes, but only fires if the spike gets that high.';
    $('dr2SxCtx').textContent = 'Price has been at or above ' + fx(R.sx) + ' trend ' + share(R.sx, '2011-01') + '% of the time since 2011 and ' + share(R.sx, '2017-01') + '% since 2017. The 2024–25 spike peaked at ' + fx(lastPeak()) + '.';
    $('dr2RxCtx').textContent = 'Price has been at or below ' + fx(R.rx) + ' trend ' + shareBelow(R.rx, '2011-01') + '% of the time since 2011. Cycle lows ran 0.40× to 0.56×; the floor is 0.42×.';
    $('dr2CapCtx').innerHTML = R.cap ? 'After ' + R.cap + ' months in cash the rule buys back at whatever the price is. 24 months was neutral when the buy-back level came, and it rescued sales that never got one.' : '<span class="dr2-warnline">No deadline can strand your sale in cash if price never falls to your level.</span>';
    document.querySelectorAll('.dr2-taxonly').forEach(function(e){ e.hidden = S.O.acct !== 'tax'; });
    $('dr2Niit').checked = S.O.niit;
    if ($('dr2State').value !== S.O.state) $('dr2State').value = S.O.state;
    $('dr2StateCtx').textContent = S.O.state === 'WA' ? BTC_STATE_OVERRIDE.WA.label + '; 9.9% above about $1.27M from 2025. Real estate is exempt there; bitcoin is not.' : 'Top state rates on long-term gains, from the site’s shared list.';
    $('dr2RuleSentence').innerHTML = ruleText(R);
  }
  var _lastPeak = null;
  function lastPeak(){ if (_lastPeak == null) { var t = RE.run(PRESETS.conservative, engineOpts(DEF_O, '2011-01')); _lastPeak = t.cyc[4].peak; } return _lastPeak; }

  // ─── Render ───
  function render(){
    syncControls();
    var O = S.O, other = copy(O); other.acct = O.acct === 'ira' ? 'tax' : 'ira';
    var a11 = RE.run(S.R, engineOpts(O, '2011-01')), a14 = RE.run(S.R, engineOpts(O, '2014-01'));
    var b11 = RE.run(S.R, engineOpts(other, '2011-01')), b14 = RE.run(S.R, engineOpts(other, '2014-01'));
    function hero(el, elS, a, b){
      $(el).innerHTML = '<span class="' + cls(a.end) + '">' + mult(a.end) + '</span><small>the coins</small>';
      var n = a.ev.filter(function(e){ return e.t === 'sell'; }).length;
      var acct = O.acct === 'ira' ? 'IRA' : 'Taxable';
      $(elS).innerHTML = acct + ', ' + n + ' sale' + (n === 1 ? '' : 's') + (a.inCash ? ', <span class="down">still in cash</span>' : '') + '. ' + (O.acct === 'ira' ? 'Taxable' : 'In an IRA') + ': <span class="' + cls(b.end) + '">' + mult(b.end) + '</span>.';
    }
    hero('dr2R11', 'dr2R11s', a11, b11); hero('dr2R14', 'dr2R14s', a14, b14);
    var lastPk = a11.cyc[4].peak;
    $('dr2LastCycle').innerHTML = a11.cyc[4].sell ? 'This rule sold in the last cycle, which peaked at ' + fx(lastPk) + ' trend.' : '<b class="dr2-strong">This rule did not fire in the last cycle.</b> The 2024–25 spike peaked at ' + fx(lastPk) + ' trend. As spikes shrink, a fixed level can go unreached; doing nothing is the most likely outcome of most rules next cycle, and in an IRA that costs nothing.';
    // Era note: the two growth rates are templated from the trend function.
    var g13 = Math.round(RE.trendGrowth(RE.dayOfIso('2013-07-01'))), gNow = Math.round(RE.trendGrowth(RE.lastDay));
    $('dr2EraNote').textContent = 'Since 2011 includes 2013, when the trend was growing about ' + g13 + '% a year, so a buy back “below trend” could still cost more than the sale. Today the trend grows about ' + gNow + '% a year. Since 2014 matches How Much Cash.';

    // Table + failure box
    var T = RE.run(S.R, engineOpts(O, S.start)), cum = 1, html = '', fails = [], stack = S.stack, LAST = T.last;
    T.cyc.forEach(function(c){
      if (!c.covered) return;
      if (!c.sell) {
        var why = S.R.timing === 'fade' ? 'never reached ' + fx(S.R.sx) + ' to arm' : 'never reached ' + fx(S.R.sx);
        html += '<tr class="never"><td>' + c.name + '</td><td colspan="2">Never sold. Peak ' + fx(c.peak) + ' trend, ' + why + '.</td><td class="n">—</td><td class="n mult">1.00×</td><td class="n">' + btcf(stack * cum) + '</td><td class="n">—</td></tr>';
        if (c.i === 4) fails.push('<b>' + c.name + ': never sold.</b> The spike peaked at ' + fx(c.peak) + ' trend, below the rule\'s ' + fx(S.R.sx) + '.');
        return;
      }
      var s = c.sell, b = c.buy, m, buyCell, dollar;
      if (b) { m = b.after / s.before; cum *= m; buyCell = my(b.d) + ' · ' + price(b.p) + '<span class="s">' + fx(b.r) + ' trend' + (b.why === 'fallback' ? '</span><span class="dr2-tag fb">deadline</span>' : '</span>'); dollar = (cum - 1) * stack * b.p; }
      else { var held = s.before - s.amt, cashNow = (s.amt * s.p - s.tax) / LAST.p; m = (held + cashNow) / s.before; cum *= m; buyCell = '<span class="dr2-tag cash">still in cash</span><span class="s">valued at today\'s price</span>'; dollar = (cum - 1) * stack * LAST.p; }
      var row = m < 0.995 ? 'lost' : m > 1.005 ? 'won' : '';
      html += '<tr class="' + row + '"><td>' + c.name + '</td><td>' + my(s.d) + ' · ' + price(s.p) + '<span class="s">' + fx(s.r) + ' trend · sold ' + Math.round(s.amt / s.before * 100) + '%</span></td><td>' + buyCell + '</td><td class="n">' + (s.tax > 0 ? usd(s.tax * stack) : '—') + '</td><td class="n mult">' + mult(m) + (m < 0.995 ? '<span class="s">Lost coins</span>' : '') + '</td><td class="n">' + btcf(stack * cum) + '</td><td class="n ' + (dollar > 0.5 ? 'up' : dollar < -0.5 ? 'down' : '') + '">' + (Math.abs(dollar) < 1 ? '—' : (dollar > 0 ? '+' : '') + usd(dollar)) + '</td></tr>';
      if (m < 0.995) {
        var r = b ? (b.why === 'fallback' ? 'The buy-back level never came; the ' + S.R.cap + '-month deadline bought back at ' + price(b.p) + '.' : 'Sold at ' + price(s.p) + ', bought back at ' + price(b.p) + (b.p > s.p ? ', a higher price.' : '.') + (s.tax > 0 ? ' Tax took part of the sale.' : '')) : 'Sold at ' + price(s.p) + '; price never fell to ' + fx(S.R.rx) + ' trend. Still in cash.';
        fails.push('<b>' + c.name + ': ' + mult(m) + ' the coins.</b> ' + r);
      }
    });
    $('dr2CycBody').innerHTML = html;
    renderFailBox(fails, S.start);

    updateChart1(T); updateChart2(T);
    renderHandoffs();
    renderPresetComparison();
    if (interacted) { saveSticky(); scheduleUrl(); }
  }
  function renderFailBox(fails, start){
    var fb = $('dr2FailBox');
    if (fails.length) { fb.className = 'dr2-fail'; fb.innerHTML = '<h3>Where this rule cost coins, or never sold</h3><ul>' + fails.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
    else { fb.className = 'dr2-fail ok'; fb.innerHTML = '<h3>No losing round trips from ' + start.slice(0, 4) + '</h3><ul><li>That is the record, not a promise. A rule tuned to past cycles will fit them; the next cycle can still be the one where price rises after the sale and never comes back.</li></ul>'; }
  }

  // ─── Preset comparison (rewritten for v2; every figure live) ───
  function renderPresetComparison(){
    var el = $('drPresetComparison'); if (!el) return;
    var O = S.O, acctLbl = O.acct === 'ira' ? 'In an IRA' : 'Taxable, at the rates set above';
    var rows = [], best11 = null, best14 = null, below11 = 0, fired25 = 0;
    ['conservative', 'balanced', 'adventurous'].forEach(function(k){
      var a = RE.run(PRESETS[k], engineOpts(O, '2011-01')), b = RE.run(PRESETS[k], engineOpts(O, '2014-01'));
      if (!best11 || a.end > best11.v) best11 = { k: k, v: a.end };
      if (!best14 || b.end > best14.v) best14 = { k: k, v: b.end };
      if (a.end < 0.995) below11++;
      if (a.cyc[4].sell) fired25++;
      rows.push('<tr><th scope="row">' + PRESET_NAMES[k] + '</th><td class="dr2-cmp-rule">' + ruleText(PRESETS[k]) + '</td><td class="n mult ' + cls(a.end) + '">' + mult(a.end) + '</td><td class="n mult ' + cls(b.end) + '">' + mult(b.end) + '</td></tr>');
    });
    el.innerHTML = '<div class="dr2-tablewrap"><table class="dr2-table dr2-cmp"><thead><tr><th scope="col">Preset</th><th scope="col">Rule</th><th scope="col" class="n">From 2011</th><th scope="col" class="n">From 2014</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>' +
      '<p class="dr2-small">' + acctLbl + ', coins after the rule against HODLing. From 2011, ' + PRESET_NAMES[best11.k] + ' ended highest, at ' + mult(best11.v) + '; from 2014, ' + PRESET_NAMES[best14.k] + ', at ' + mult(best14.v) + '. ' +
      (below11 ? below11 + ' of the three ended below HODLing from 2011. ' : 'None ended below HODLing from 2011. ') +
      (fired25 ? '' : 'None of them fired in the last cycle; it peaked at ' + fx(lastPeak()) + ' trend.') + '</p>';
  }

  // ─── Failure-mode worked example (computed, not remembered) ───
  function renderFailExample(){
    var el = $('dr2FailExample'); if (!el) return;
    var t = RE.run(PRESETS.conservative, engineOpts(DEF_O, '2011-01')), c = t.cyc[1];
    if (!c.sell || !c.buy) { el.textContent = ''; return; }
    var m = c.buy.after / c.sell.before, all = c.sell.p / c.buy.p;
    el.innerHTML = '<strong>The clearest case:</strong> the Conservative preset sold a quarter of the stack in ' + my(c.sell.d) + ' at <strong>' + price(c.sell.p) + '</strong> (' + fx(c.sell.r) + ' trend). The buy back came in ' + my(c.buy.d) + ' at <strong>' + price(c.buy.p) + '</strong> (' + fx(c.buy.r) + ' trend). Both triggers fired as designed, and the round trip ended at <strong>' + mult(m) + '</strong> the coins. Selling everything at that sale would have kept about <strong>' + Math.round(all * 100) + '%</strong> of the stack.';
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
  var liveBtcPrice = TODAY_PRICE;
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
          x: { type: 'linear', title: { display: true, text: 'Year', color: col.muted, font: { size: 10 } }, grid: { color: col.grid }, min: minD, ticks: { color: col.muted, maxTicksLimit: 10, callback: function(v){ return new Date(GENESIS_TS * 1000 + v * 86400000).getFullYear(); } } },
          y: { type: 'logarithmic', title: { display: true, text: 'BTC price (USD)', color: col.muted, font: { size: 10 } }, grid: { color: col.grid }, ticks: { color: col.muted, callback: function(v){ if (v >= 1e6) { var m = v / 1e6; return '$' + (m >= 10 || m === Math.floor(m) ? Math.round(m) : Math.round(m * 10) / 10) + 'M'; } if (v >= 1000) { var k = v / 1000; return '$' + (k >= 100 || k === Math.floor(k) ? Math.round(k) : Math.round(k * 10) / 10) + 'K'; } if (v >= 1) return '$' + Math.round(v); return '$' + v.toFixed(2); } } }
        }
      }
    });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function(){ if (pendingLayoutFix && canvas.clientWidth > 0) { pendingLayoutFix = false; chart.update('resize'); } }).observe(canvas);
    wireLegend(); wireRange(); wireToday();
  }
  function updateChart1(T){
    if (!chart) return;
    var R = S.R, sells = [], buys = [], fbs = [];
    T.ev.forEach(function(e){ var pt = { x: e.d, y: e.p }; if (e.t === 'sell') sells.push(pt); else if (e.why === 'fallback') fbs.push(pt); else buys.push(pt); });
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
      liveBtcPrice = p; caption(p, source);
      var h = chart.data.datasets[DS.history].data, last = h[h.length - 1];
      if (last && last.x > PL_DATA[PL_DATA.length - 1][0]) last.y = p; else h.push({ x: TODAY_DAYS, y: p });
      if (canvas.clientWidth > 0) chart.update('resize'); else pendingLayoutFix = true;
    });
  }
  function wireRange(){
    var btns = document.querySelectorAll('.dr-range-btn'); if (!btns.length) return;
    function nice(v, dir){ if (v <= 0) return v; var pow = Math.pow(10, Math.floor(Math.log10(v))), lead = v / pow, c = [1, 1.5, 2, 3, 5, 7, 10], i; if (dir === 'down') { for (i = c.length - 1; i >= 0; i--) if (c[i] <= lead) return c[i] * pow; return c[0] * pow; } for (i = 0; i < c.length; i++) if (c[i] >= lead) return c[i] * pow; return c[c.length - 1] * pow; }
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        btns.forEach(function(b){ b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
        var range = btn.getAttribute('data-range'), xs = chart.options.scales.x, ys = chart.options.scales.y;
        if (range === 'all') { xs.min = minD; xs.max = undefined; ys.min = undefined; ys.max = undefined; }
        else { var w = range === 'near-1y' ? 1 : 2, lo = TODAY_DAYS - 365 * w, hi = TODAY_DAYS + 365 * w, a = Infinity, b = -Infinity; for (var d = lo; d <= hi; d += 30) { var t = plPrice(d); a = Math.min(a, t * PL_FLOOR); b = Math.max(b, t * PL_CEIL); } xs.min = lo; xs.max = hi; ys.min = nice(a / 1.1, 'down'); ys.max = nice(b * 1.1, 'up'); }
        chart.update('resize');
      });
    });
  }

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
        { label: 'With the rule', data: [], borderColor: col.rule, borderWidth: 2, pointRadius: 0, showLine: true, order: 1 }
      ] },
      plugins: [endLabel],
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        layout: { padding: { top: 18 } },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: col.tipBg, borderColor: col.tipBorder, borderWidth: 1, bodyColor: col.tipBody, titleColor: col.rule,
          callbacks: { title: function(it){ return it.length ? my(it[0].parsed.x) : ''; }, label: function(it){ return it.dataset.label + ': ' + (S.unit === 'usd' ? usd(it.parsed.y) : btcf(it.parsed.y)); } } } },
        scales: {
          x: { type: 'linear', grid: { color: col.grid }, ticks: { color: col.muted, maxTicksLimit: 9, callback: function(v){ return new Date(GENESIS_TS * 1000 + v * 86400000).getUTCFullYear(); } } },
          y: { type: 'linear', grid: { color: col.grid }, ticks: { color: col.muted, callback: function(v){ return S.unit === 'usd' ? usd(v) : (Math.round(v * 100) / 100); } } }
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
    if (!usdMode) { var all = s.map(function(p){ return p.coins * k; }).concat([k]), lo = Math.min.apply(null, all), hi = Math.max.apply(null, all), pad = Math.max((hi - lo) * 0.15, 0.05 * k); chart2.options.scales.y.min = Math.max(0, lo - pad); chart2.options.scales.y.max = hi + pad; }
    else { chart2.options.scales.y.min = undefined; chart2.options.scales.y.max = undefined; }
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
    var preset = p.get('preset'), base = PRESETS[preset] ? preset : 'conservative';
    if (PRESETS[preset]) { out.preset = preset; out.R = copy(PRESETS[preset]); }
    var ruleKeys = ['sx', 'st', 'sz', 'f', 'rx', 'cap'].filter(function(k){ return p.has(k); });
    if (ruleKeys.length) {
      var R = copy(PRESETS[base]), v;
      if (p.has('st') && (p.get('st') === 'up' || p.get('st') === 'fade')) R.timing = p.get('st');
      v = parseFloat(p.get('sx')); if (isFinite(v)) R.sx = r2(clamp(v, 1.1, 5));
      R.sz = R.sx; v = parseFloat(p.get('sz')); if (R.timing === 'fade' && isFinite(v)) R.sz = r2(clamp(v, 1, R.sx));
      v = parseFloat(p.get('f')); if (isFinite(v)) R.f = clamp(Math.round(v / 5) * 5, 5, 100);
      v = parseFloat(p.get('rx')); if (isFinite(v)) R.rx = r2(clamp(v, 0.42, 1.5));
      v = parseInt(p.get('cap'), 10); if ([0, 12, 18, 24, 36].indexOf(v) >= 0) R.cap = v;
      out.preset = 'custom'; out.R = R;
    } else if (p.has('sell') || p.has('rebuy')) {
      // Legacy percentile links: the old rule sold everything on the way up
      // with no deadline; levels mapped on the since-2011 set.
      var sp = parseFloat(p.get('sell')), bp = parseFloat(p.get('rebuy'));
      var sx = r2(clamp(RE.ratioAtPercentile(isFinite(sp) ? sp : 80, '2011-01'), 1.1, 5)), rx = r2(clamp(RE.ratioAtPercentile(isFinite(bp) ? bp : 50, '2011-01'), 0.42, 1.5));
      out.preset = 'custom'; out.R = { timing: 'up', sx: sx, sz: sx, f: 100, rx: rx, cap: 0 };
    }
    if (p.has('account')) { var a = p.get('account'); if (a === 'retirement') out.acct = 'ira'; else if (a === 'regular') out.acct = 'tax'; }
    if (p.has('tax')) { var t = parseFloat(p.get('tax')); if (isFinite(t)) out.fed = nearestFed(clamp(t, 0, 40)); }
    if (p.has('state')) { var sc = String(p.get('state')).toUpperCase(); if (/^[A-Z]{2,5}$/.test(sc) && $('dr2State').querySelector('option[value="' + sc + '"]')) out.state = sc; }
    return out;
  }
  function applyPatch(x){
    if (x.preset) S.preset = x.preset;
    if (x.R) S.R = x.R;
    if (x.acct) S.O.acct = x.acct;
    if (x.fed != null) S.O.fed = x.fed;
    if (x.state) S.O.state = x.state;
    if (x.fromSpikes) S.fromSpikes = true;
    if (x.rb) S.rb = x.rb;
  }
  function writeParams(p){
    KEYS.forEach(function(k){ p.delete(k); });
    if (S.preset === 'custom') {
      var R = S.R;
      p.set('sx', String(R.sx)); p.set('st', R.timing);
      if (R.timing === 'fade' && R.sz !== R.sx) p.set('sz', String(R.sz));
      p.set('f', String(R.f)); p.set('rx', String(R.rx));
      if (R.cap !== 24) p.set('cap', String(R.cap));
    } else if (S.preset !== 'conservative') p.set('preset', S.preset);
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
    try { ['sellPct', 'rebuyPct', 'taxRate', 'accountType', 'era', 'customizeOpen', 'horizon'].forEach(function(k){ localStorage.removeItem('dr:' + k); }); var p = localStorage.getItem('dr:preset'); if (p && !PRESET_NAMES[p]) localStorage.removeItem('dr:preset'); } catch (e) {}
  }
  function saveSticky(){
    store('preset', S.preset); store('rule', JSON.stringify(S.R)); store('acct', S.O.acct); store('fed', String(S.O.fed)); store('niit', S.O.niit ? '1' : '0');
    store('state', S.O.state); store('lots', S.O.lots); store('yield', String(S.O.yield)); store('start', S.start); store('unit', S.unit);
  }
  function loadSticky(){
    var p = load('preset');
    if (p && PRESET_NAMES[p]) {
      S.preset = p;
      if (PRESETS[p]) S.R = copy(PRESETS[p]);
      else { try { var R = JSON.parse(load('rule') || 'null'); if (R && R.sx) S.R = { timing: R.timing === 'up' ? 'up' : 'fade', sx: r2(clamp(+R.sx, 1.1, 5)), sz: r2(clamp(+R.sz, 1, +R.sx)), f: clamp(+R.f, 5, 100), rx: r2(clamp(+R.rx, 0.42, 1.5)), cap: [0, 12, 18, 24, 36].indexOf(+R.cap) >= 0 ? +R.cap : 24 }; } catch (e) {} }
    }
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
    a.innerHTML = '<b>Picked up from Bitcoin\'s Spikes:</b> ' + what + '. I added the 24-month deadline this page uses by default. Most readers trim less than 100%; try <a href="#" id="dr2TryBal">Balanced</a> to compare.' +
      (S.rb === 'ath80' ? ' Spikes\' “80% below the high” buy back isn\'t available here yet, so this uses trend.' : '');
    a.hidden = false;
    $('dr2TryBal').addEventListener('click', function(ev){ ev.preventDefault(); S.preset = 'balanced'; S.R = copy(PRESETS.balanced); track('dr_preset', { preset: 'balanced' }); render(); });
    track('dr_arrival', { sx: R.sx, account: S.O.acct });
  }

  // ═══ Wiring ═══
  function toCustom(){ S.preset = 'custom'; }
  function wire(){
    ['input', 'change', 'click'].forEach(function(ev){ document.addEventListener(ev, function(e){ if (e.target && e.target.closest && e.target.closest('#tab-calculator')) interacted = true; }, { capture: true }); });
    document.querySelectorAll('.dr2-preset').forEach(function(b){ b.addEventListener('click', function(){ var p = b.dataset.p; S.preset = p; if (PRESETS[p]) S.R = copy(PRESETS[p]); else $('dr2Build').open = true; track('dr_preset', { preset: p }); render(); }); });
    function seg(id, fn){ document.querySelectorAll('#' + id + ' button').forEach(function(b){ b.addEventListener('click', function(){ fn(b.dataset.v); render(); }); }); }
    seg('dr2SegTiming', function(v){ S.R.timing = v; if (v === 'up' || S.R.sz > S.R.sx) S.R.sz = v === 'up' ? S.R.sx : Math.min(S.R.sz, S.R.sx); toCustom(); });
    seg('dr2SegCap', function(v){ S.R.cap = +v; toCustom(); });
    seg('dr2SegYield', function(v){ S.O.yield = +v; });
    seg('dr2SegAcct', function(v){ S.O.acct = v; });
    seg('dr2SegFed', function(v){ S.O.fed = +v; });
    seg('dr2SegLots', function(v){ S.O.lots = v; });
    seg('dr2SegStart', function(v){ S.start = v; });
    seg('dr2SegUnit', function(v){ S.unit = v; });
    $('dr2Sx').addEventListener('input', function(e){ S.R.sx = +e.target.value; if (S.R.timing === 'up') S.R.sz = S.R.sx; else S.R.sz = Math.min(S.R.sz, S.R.sx); toCustom(); render(); });
    $('dr2Sz').addEventListener('input', function(e){ S.R.sz = Math.min(+e.target.value, S.R.sx); toCustom(); render(); });
    $('dr2F').addEventListener('input', function(e){ S.R.f = +e.target.value; toCustom(); render(); });
    $('dr2Rx').addEventListener('input', function(e){ S.R.rx = +e.target.value; toCustom(); render(); });
    $('dr2Niit').addEventListener('change', function(e){ S.O.niit = e.target.checked; render(); });
    $('dr2State').addEventListener('change', function(e){ S.O.state = e.target.value; render(); });
    $('dr2Stack').addEventListener('input', function(e){ var v = +e.target.value; if (v > 0) { S.stack = v; render(); } });
    document.querySelectorAll('#tab-calculator [data-handoff]').forEach(function(a){ a.addEventListener('click', function(){ track('dr_handoff', { destination: a.getAttribute('data-handoff') }); }); });
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
    legacy: { sell80: 1.78, rebuy50: 0.87 }
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
    if ($('drQ100')) $('drQ100').textContent = mult(end(upAll, '2011-01'));
    if ($('drQ50')) $('drQ50').textContent = mult(end(upHalf, '2011-01'));
  }

  // ═══ Init ═══
  function init(){
    // The shared state list carries Washington at 0% (right for real estate);
    // relabel it here so the dropdown says what the calculator applies.
    var wa = $('dr2State').querySelector('option[value="WA"]'); if (wa) wa.textContent = BTC_STATE_OVERRIDE.WA.label;
    removeOldKeys();
    var x = window.URLSearchParams ? parseParams(new URLSearchParams(location.search)) : { present: false };
    if (x.present) applyPatch(x); else loadSticky();
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
