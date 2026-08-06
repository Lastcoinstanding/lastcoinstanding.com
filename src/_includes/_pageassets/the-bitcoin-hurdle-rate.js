/* ============================================================
   The Bitcoin Hurdle Rate — engine + calculator
   ============================================================
   Answers: does this use of capital beat holding bitcoin, at the
   horizon of the decision? Two lenses (Company / Personal) over one
   shared engine.

   Constants (PL_A, PL_B, PL_FLOOR), plPrice(), TODAY_DAYS, the live
   spot path (fetchTodayPrice / todayPriceIsLive / todayPriceNote) all
   come from shared/power-law-data.js, concatenated ahead of this file
   in the page's single <script>. No local copies of the coefficients
   (DATA_AUDIT tracks duplication as debt).

   CORE PRIMITIVE (unit-test fixture, HURDLE_RATE_BUILD_PROMPT §2.2):
     trendCAGR(t,H) = ((t + 365.25*H)/t)^(PL_B/H) - 1
   At t = 6,424 days (2026-08-06), PL_B = 5.77:
     H=1 → 37.6%  H=3 → 35.4%  H=5 → 33.5%  H=10 → 29.7%
     H=20 → 24.5% H=30 → 21.1%
   trendCAGR is trend→trend and spot-independent — it is the honest,
   window-matched hurdle the verdict is measured against, and the number
   quoted in prose/FAQ. Every rate rendered names its window.

   CHART GEOMETRY NOTE (flagged in the PR): design §2.4 defines the
   band's upper edge as spot→trend. With bitcoin near its floor today
   (~0.42× trend), spot→trend spikes to ~227%/yr at H=1, which would
   breach the §7 overclaim flag and wreck legibility. Resolution kept
   faithful to §5.2 + the §2.2 fixture + §4.3(c): the primary declining
   curve is trendCAGR(H); the floor-path band beneath it is spot→floor
   (the conservative/access-conditioned reading); the spot→trend
   reversion upside is a secondary stat at the chosen horizon, not a
   chart line. All three are computed below, so switching to §2.4's
   literal reading is a one-line change.
============================================================ */
(function hurdleRate(){
  'use strict';

  var YEAR_D = 365.25;
  var NOTIONAL = 100000; // $ used only to make terminal values concrete in the stat strip

  // ── Chart palette (canvas can't read CSS vars) ──
  var AMBER = '#e09422', BAND = 'rgba(224,148,34,0.14)', FLOORLINE = 'rgba(224,148,34,0.40)';
  var CAND = '#6db3d4', MUTED = '#7a7367', DIM = '#9a9080', INK = '#0a0908';

  // ── State ──
  var S = {
    r: 12,            // candidate return, %/yr
    h: 10,            // horizon, years
    lens: 'company',  // 'company' | 'personal'
    tax: 'pretax',    // 'pretax' | 'posttax'
    funding: 'cash',  // company: 'cash' | 'debt' | 'equity'
    cashflow: 'yes',  // company: 'yes' | 'no'  — gates the verdict (§3.5)
    capsrc: 'savings',// personal: 'savings' | 'sale'
    canWait: 'yes'    // personal: 'yes' | 'limited' | 'no' — gates the verdict
  };

  var spot = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
    ? TODAY_PRICE : PL_DATA[PL_DATA.length - 1][1];
  var spotSource = 'fallback'; // 'live' once fetchTodayPrice resolves

  // ─────────── MATH ───────────
  function tDays(){ return (typeof TODAY_DAYS === 'number' && TODAY_DAYS > 0) ? TODAY_DAYS : 6424; }
  // trend→trend, window-matched (the fixture)
  function trendCAGR(H){ var t = tDays(); return Math.pow((t + YEAR_D * H) / t, PL_B / H) - 1; }
  function trendAtH(H){ return plPrice(tDays() + YEAR_D * H); }
  function floorAtH(H){ return PL_FLOOR * trendAtH(H); }
  // realised CAGR from today's spot to floor-at-horizon (conservative / floor path)
  function spotToFloorCAGR(H){ return Math.pow(floorAtH(H) / spot, 1 / H) - 1; }
  // realised CAGR from today's spot to trend-at-horizon (optimistic reversion upside)
  function spotToTrendCAGR(H){ return Math.pow(trendAtH(H) / spot, 1 / H) - 1; }
  function trendMultiple(H){ var t = tDays(); return Math.pow((t + YEAR_D * H) / t, PL_B); }

  // Horizon where the candidate return equals the trend hurdle. trendCAGR is
  // monotonically decreasing in H, so a simple scan finds the crossing.
  // Returns { kind:'always' } (candidate ≥ hurdle at H=1),
  //         { kind:'never' } (candidate < hurdle even at H=40),
  //         { kind:'at', h:<years> }.
  function crossing(){
    var r = S.r / 100;
    if (r >= trendCAGR(1)) return { kind: 'always' };
    if (r < trendCAGR(40)) return { kind: 'never' };
    var lo = 1, hi = 40, mid;
    for (var i = 0; i < 40; i++){
      mid = (lo + hi) / 2;
      if (trendCAGR(mid) > r) lo = mid; else hi = mid;
    }
    return { kind: 'at', h: (lo + hi) / 2 };
  }

  // ─────────── FORMAT ───────────
  function pct(x, d){ return (x * 100).toFixed(d == null ? 1 : d) + '%'; }
  function pctN(x, d){ return (x).toFixed(d == null ? 1 : d) + '%'; }
  function mult(x){ return x >= 100 ? Math.round(x).toLocaleString() + '×' : x.toFixed(1) + '×'; }
  function money(x){
    if (x >= 1e9) return '$' + (x / 1e9).toFixed(1) + 'B';
    if (x >= 1e6) return '$' + (x / 1e6).toFixed(2) + 'M';
    if (x >= 1e3) return '$' + Math.round(x / 1e3) + 'k';
    return '$' + Math.round(x);
  }
  function yrs(h){ return h < 2 ? h.toFixed(1) + ' year' : h.toFixed(h % 1 ? 1 : 0) + ' years'; }

  // ─────────── DOM ───────────
  var el = {};
  function grab(){
    ['hrReturn','hrReturnNum','hrHorizon','hrHorizonNum','hrTaxNote','hrCapsrcCap',
     'hrChart','hrChartCap','hrSpotNote','hrVerdict','hrStats'].forEach(function(id){
      el[id] = document.getElementById(id);
    });
  }

  // ─────────── CHART ───────────
  var chart = null;
  function curveData(){
    var trend = [], floor = [];
    for (var H = 1; H <= 40; H++){
      trend.push({ x: H, y: trendCAGR(H) * 100 });
      floor.push({ x: H, y: spotToFloorCAGR(H) * 100 });
    }
    return { trend: trend, floor: floor };
  }

  // vertical marker at the crossing horizon
  function markerPlugin(){
    return {
      id: 'hrMarker',
      afterDatasetsDraw: function(c){
        var cr = crossing();
        if (cr.kind !== 'at') return;
        var x = c.scales.x.getPixelForValue(cr.h);
        var y = c.scales.y.getPixelForValue(S.r);
        var ctx = c.ctx;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(x, c.chartArea.top); ctx.lineTo(x, c.chartArea.bottom);
        ctx.strokeStyle = 'rgba(242,238,232,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = AMBER; ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
    };
  }

  function buildChart(){
    if (!el.hrChart || typeof Chart === 'undefined') return;
    var d = curveData();
    chart = new Chart(el.hrChart.getContext('2d'), {
      type: 'line',
      data: {
        datasets: [
          // floor path (lower edge) — drawn first; band fills up to the trend curve
          { label: 'Floor path (if bitcoin only reaches its floor)', data: d.floor,
            borderColor: FLOORLINE, borderWidth: 1, borderDash: [4, 4], pointRadius: 0,
            tension: 0.2, fill: false, order: 3 },
          // trend hurdle (upper edge) — the honest window-matched hurdle
          { label: 'Bitcoin’s trend hurdle', data: d.trend,
            borderColor: AMBER, backgroundColor: BAND, borderWidth: 2.4, pointRadius: 0,
            tension: 0.2, fill: '-1', order: 2 },
          // candidate return — flat line
          { label: 'Your candidate return', data: [{ x: 1, y: S.r }, { x: 40, y: S.r }],
            borderColor: CAND, borderWidth: 2, borderDash: [6, 4], pointRadius: 0,
            tension: 0, fill: false, order: 1 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: true, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 12, right: 12 } },
        scales: {
          x: {
            type: 'linear', min: 1, max: 40,
            title: { display: true, text: 'Horizon of the decision (years)', color: MUTED,
                     font: { family: 'Inter, sans-serif', size: 11 } },
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 },
                     callback: function(v){ return v + 'y'; } }
          },
          y: {
            min: 0,
            title: { display: true, text: 'Annualised return', color: MUTED,
                     font: { family: 'Inter, sans-serif', size: 11 } },
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 },
                     callback: function(v){ return Math.round(v) + '%'; } }
          }
        },
        plugins: {
          legend: { display: true, position: 'top',
                    labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line',
                              boxWidth: 22, padding: 9 } },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1,
            titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function(it){ return it.length ? 'At a ' + Math.round(it[0].parsed.x) + '-year horizon' : ''; },
              label: function(it){ return it.dataset.label + ': ' + it.parsed.y.toFixed(1) + '%/yr'; }
            }
          }
        }
      },
      plugins: [markerPlugin()]
    });
  }

  function updateChart(){
    if (!chart) return;
    var d = curveData();
    chart.data.datasets[0].data = d.floor;
    chart.data.datasets[1].data = d.trend;
    chart.data.datasets[2].data = [{ x: 1, y: S.r }, { x: 40, y: S.r }];
    chart.update('none');
  }

  // ─────────── VERDICT (facts-not-signals; both conditions in the sentence) ───────────
  function verdict(){
    var H = S.h, r = S.r;
    var tc = trendCAGR(H);
    var provNote = todayPriceNote(spotSource); // '' when live, ' (latest monthly data)' otherwise

    // §3.5 — the not-cashflow-positive company verdict CHANGES, it is not decorated.
    if (S.lens === 'company' && S.cashflow === 'no'){
      return '<p class="hr-v-lead">The hurdle does not apply to this business.</p>' +
        '<p class="hr-v-body">A company that may be forced to sell into a drawdown to meet its obligations does not hold capital that can wait &mdash; and the hurdle is a benchmark only for capital that can. Here, bitcoin&rsquo;s volatility eats into <strong>survivability</strong>, not just optionality: realising a drawdown to make payroll or meet a covenant is the corporate form of selling at the bottom. Set the business to cashflow positive to compare a return against the bar; as it stands, the comparison the tool makes does not hold for this capital.</p>';
    }
    // Personal capital with a deadline — same logic, other lens.
    if (S.lens === 'personal' && S.canWait === 'no'){
      return '<p class="hr-v-lead">The hurdle does not apply to capital with a deadline.</p>' +
        '<p class="hr-v-body">Bitcoin&rsquo;s trend return is realised only by capital that can hold through a roughly &minus;73% drawdown without being forced to sell. Money that has to be spent on a fixed date can be caught in a drawdown at exactly the wrong moment, so the trend rate is not the benchmark for it. For this use, the certain, dated alternative is the comparison that holds &mdash; not bitcoin&rsquo;s trend.</p>';
    }

    var cr = crossing();
    var lead, body;
    var waitClause = (S.lens === 'company')
      ? 'if the trend holds and the business stays cashflow positive'
      : (S.canWait === 'limited'
          ? 'if the trend holds and the capital can wait &mdash; and a drawdown mid-horizon could force the decision early, which lowers the effective bar'
          : 'if the trend holds and the capital can wait');

    if (cr.kind === 'always'){
      lead = 'Estimated: at ' + pctN(r) + '/yr, your return clears bitcoin&rsquo;s trend hurdle at every horizon on the chart.';
      body = 'Even the one-year-forward trend rate (' + pct(trendCAGR(1)) + ') sits below your number, so across the range the candidate has been the higher-returning use of the capital &mdash; at the margin, for capital that could otherwise have waited.';
    } else if (cr.kind === 'never'){
      lead = 'Estimated: at ' + pctN(r) + '/yr, your return does not clear bitcoin&rsquo;s trend hurdle at any horizon up to 40 years.';
      body = 'At your ' + H + '-year horizon the trend hurdle is ' + pct(tc) + ' (measured over that ' + H + '-year-forward window' + provNote + '); across the whole range, holding bitcoin has been the higher-returning use of the same capital &mdash; ' + waitClause + ', at the margin, for a holder who can survive the drawdown.';
    } else {
      lead = 'Estimated: at ' + pctN(r) + '/yr, your return clears bitcoin&rsquo;s trend hurdle at horizons beyond about <strong>' + yrs(cr.h) + '</strong>.';
      body = 'Below that, holding bitcoin has been the higher-returning use of the same capital &mdash; ' + waitClause + ', at the margin, for a holder who can survive the drawdown. At your ' + H + '-year horizon the hurdle is ' + pct(tc) + ' over that ' + H + '-year-forward window' + provNote + '.';
    }
    return '<p class="hr-v-lead">' + lead + '</p><p class="hr-v-body">' + body + '</p>';
  }

  // ─────────── STAT STRIP ───────────
  function tile(val, lab){
    return '<div class="hr-stat"><div class="hr-stat-val">' + val + '</div><div class="hr-stat-lab">' + lab + '</div></div>';
  }
  function stats(){
    if (S.lens === 'company' && S.cashflow === 'no') return '';
    if (S.lens === 'personal' && S.canWait === 'no') return '';
    var H = S.h, r = S.r / 100;
    var tc = trendCAGR(H);
    var tMult = trendMultiple(H);
    var fMult = floorAtH(H) / spot;
    var candTerminal = NOTIONAL * Math.pow(1 + r, H);
    var trendTerminal = NOTIONAL * tMult;
    var revUp = spotToTrendCAGR(H);
    var out = '';
    out += tile(pct(tc), 'Trend hurdle over your ' + H + '-yr window');
    out += tile(mult(tMult) + ' <span class="hr-stat-sub">trend</span> &middot; ' + mult(fMult) + ' <span class="hr-stat-sub">floor</span>', 'Bitcoin multiple over ' + yrs(H));
    out += tile(money(candTerminal) + ' <span class="hr-stat-sub">vs</span> ' + money(trendTerminal),
                money(NOTIONAL) + ' at ' + pctN(S.r) + ' vs at bitcoin&rsquo;s trend');
    out += tile(pct(revUp), 'If bitcoin reverts to trend over ' + H + ' yr <span class="hr-stat-sub">(optimistic edge)</span>');
    if (S.lens === 'company'){
      var gap = (tc - r) * 100;
      var fundWord = S.funding === 'debt' ? 'debt serviced at ' + pctN(S.r)
                   : S.funding === 'equity' ? 'equity costing ' + pctN(S.r)
                   : 'cash returning ' + pctN(S.r);
      out += tile((gap >= 0 ? '+' : '') + gap.toFixed(1) + ' pts/yr',
                  'Trend hurdle vs ' + fundWord + ', over ' + yrs(H));
    }
    return out;
  }

  // ─────────── NOTES (tax basis, capital source, live provenance) ───────────
  function notes(){
    if (el.hrTaxNote){
      el.hrTaxNote.innerHTML = (S.tax === 'posttax')
        ? 'Bitcoin&rsquo;s hurdle is pre-tax of any capital-gains on eventual sale; a post-tax candidate is a higher bar than it looks against it. Apply your own rate to bitcoin&rsquo;s side.'
        : '';
    }
    if (el.hrCapsrcCap && S.lens === 'personal'){
      el.hrCapsrcCap.innerHTML = (S.capsrc === 'sale')
        ? 'Selling from an existing stack makes capital-gains tax a real cost of switching into the candidate &mdash; it belongs on the candidate&rsquo;s side of the comparison, and it does not apply to new savings.'
        : 'New savings: no switching cost. Selling from an existing stack would make capital-gains tax a real cost of switching, which belongs in the comparison.';
    }
    if (el.hrSpotNote){
      var ratio = spot / plPrice(tDays());
      el.hrSpotNote.innerHTML = 'Bitcoin is currently about <strong>' + ratio.toFixed(2) +
        '×</strong> its trend' + todayPriceNote(spotSource) + ', which sets where the band sits.';
    }
  }

  // ─────────── RENDER ───────────
  function render(){
    if (el.hrVerdict) el.hrVerdict.innerHTML = verdict();
    if (el.hrStats) el.hrStats.innerHTML = stats();
    notes();
    updateChart();
  }

  // ─────────── INPUT WIRING ───────────
  function clampR(v){ v = parseFloat(v); if (!isFinite(v)) v = 12; return Math.max(0, Math.min(50, v)); }
  function clampH(v){ v = parseInt(v, 10); if (!isFinite(v)) v = 10; return Math.max(1, Math.min(40, v)); }

  function setR(v, from){
    S.r = clampR(v);
    if (el.hrReturn && from !== 'slider') el.hrReturn.value = S.r;
    if (el.hrReturnNum && from !== 'num') el.hrReturnNum.value = S.r;
    render(); scheduleSync();
  }
  function setH(v, from){
    S.h = clampH(v);
    if (el.hrHorizon && from !== 'slider') el.hrHorizon.value = S.h;
    if (el.hrHorizonNum && from !== 'num') el.hrHorizonNum.value = S.h;
    render(); scheduleSync();
  }

  function segGroup(attr, key, onSet){
    var btns = document.querySelectorAll('[data-' + attr + ']');
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        var val = b.getAttribute('data-' + attr);
        S[key] = val;
        // update pressed state within this button's group only
        var group = b.parentNode.querySelectorAll('[data-' + attr + ']');
        group.forEach(function(g){
          var on = g === b;
          g.classList.toggle('active', on);
          g.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (onSet) onSet(val);
        render(); scheduleSync();
      });
    });
  }

  // Lens toggle — §6.17 pattern, adapted to show/hide lens-specific panels
  function bindLens(){
    var toggle = document.querySelector('.calc-mode-toggle.hr-lens');
    if (!toggle) return;
    var labels = toggle.querySelectorAll('.calc-mode-label');
    var sw = toggle.querySelector('.calc-mode-switch');
    var contents = document.querySelectorAll('.hr-lens-panel');
    var presets = document.querySelector('.hr-presets');
    function setLens(mode){
      S.lens = mode;
      toggle.dataset.activeMode = mode;
      labels.forEach(function(l){
        var on = l.dataset.mode === mode;
        l.classList.toggle('active', on);
        l.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      contents.forEach(function(c){ c.classList.toggle('active', c.id === 'calc-mode-' + mode); });
      if (presets) presets.setAttribute('data-lens', mode);
      render(); scheduleSync();
    }
    labels.forEach(function(l){ l.addEventListener('click', function(){ setLens(l.dataset.mode); }); });
    sw.addEventListener('click', function(){ setLens(toggle.dataset.activeMode === 'company' ? 'personal' : 'company'); });
    window.__hrSetLens = setLens;
  }

  function bindPresets(){
    document.querySelectorAll('.hr-preset').forEach(function(b){
      b.addEventListener('click', function(){
        var lens = b.getAttribute('data-preset-lens');
        var ret = b.getAttribute('data-preset-return');
        if (lens && lens !== S.lens && window.__hrSetLens) window.__hrSetLens(lens);
        if (ret != null) setR(ret);
      });
    });
  }

  // ─────────── URL STATE (?r= ?h= ?lens=) + STICKINESS ───────────
  var STORAGE_KEY = 'lcs.bhr.calc.v1';
  var _suppress = false, _syncTimer = null;

  function scheduleSync(){
    if (_suppress) return;
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(function(){ syncUrl(); syncStorage(); }, 220);
  }
  function syncUrl(){
    if (!window.history || !window.history.replaceState) return;
    var p = new URLSearchParams(window.location.search);
    if (S.r === 12) p.delete('r'); else p.set('r', String(S.r));
    if (S.h === 10) p.delete('h'); else p.set('h', String(S.h));
    if (S.lens === 'company') p.delete('lens'); else p.set('lens', S.lens);
    var qs = p.toString();
    try { window.history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : '') + window.location.hash); } catch(e){}
  }
  function syncStorage(){
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({
      r: S.r, h: S.h, lens: S.lens, tax: S.tax, funding: S.funding,
      cashflow: S.cashflow, capsrc: S.capsrc, canWait: S.canWait
    })); } catch(e){}
  }
  function readStorage(){
    if (typeof localStorage === 'undefined') return;
    var raw; try { raw = localStorage.getItem(STORAGE_KEY); } catch(e){ return; }
    if (!raw) return;
    var d; try { d = JSON.parse(raw); } catch(e){ return; }
    if (typeof d.r === 'number') S.r = clampR(d.r);
    if (typeof d.h === 'number') S.h = clampH(d.h);
    if (d.lens === 'personal' || d.lens === 'company') S.lens = d.lens;
    if (d.tax === 'pretax' || d.tax === 'posttax') S.tax = d.tax;
    if (['cash','debt','equity'].indexOf(d.funding) >= 0) S.funding = d.funding;
    if (d.cashflow === 'yes' || d.cashflow === 'no') S.cashflow = d.cashflow;
    if (d.capsrc === 'savings' || d.capsrc === 'sale') S.capsrc = d.capsrc;
    if (['yes','limited','no'].indexOf(d.canWait) >= 0) S.canWait = d.canWait;
  }
  function readUrl(){
    var p = new URLSearchParams(window.location.search);
    if (p.has('r')) S.r = clampR(p.get('r'));
    if (p.has('h')) S.h = clampH(p.get('h'));
    var l = p.get('lens'); if (l === 'personal' || l === 'company') S.lens = l;
  }

  // Reflect restored state back into the DOM controls
  function applyStateToControls(){
    if (el.hrReturn) el.hrReturn.value = S.r;
    if (el.hrReturnNum) el.hrReturnNum.value = S.r;
    if (el.hrHorizon) el.hrHorizon.value = S.h;
    if (el.hrHorizonNum) el.hrHorizonNum.value = S.h;
    // segmented groups
    [['tax','tax'],['funding','funding'],['cashflow','cashflow'],['capsrc','capsrc'],['canwait','canWait']]
      .forEach(function(pair){
        var attr = pair[0], key = pair[1];
        document.querySelectorAll('[data-' + attr + ']').forEach(function(g){
          var on = g.getAttribute('data-' + attr) === S[key];
          g.classList.toggle('active', on);
          g.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    // lens panels + toggle
    var toggle = document.querySelector('.calc-mode-toggle.hr-lens');
    if (toggle){
      toggle.dataset.activeMode = S.lens;
      toggle.querySelectorAll('.calc-mode-label').forEach(function(lb){
        var on = lb.dataset.mode === S.lens;
        lb.classList.toggle('active', on);
        lb.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
    document.querySelectorAll('.hr-lens-panel').forEach(function(c){ c.classList.toggle('active', c.id === 'calc-mode-' + S.lens); });
    var presets = document.querySelector('.hr-presets'); if (presets) presets.setAttribute('data-lens', S.lens);
  }

  // ─────────── INIT ───────────
  function init(){
    grab();
    _suppress = true;
    readStorage();   // base layer
    readUrl();       // URL overrides
    _suppress = false;

    // input listeners
    if (el.hrReturn) el.hrReturn.addEventListener('input', function(){ setR(el.hrReturn.value, 'slider'); });
    if (el.hrReturnNum) el.hrReturnNum.addEventListener('input', function(){ setR(el.hrReturnNum.value, 'num'); });
    if (el.hrHorizon) el.hrHorizon.addEventListener('input', function(){ setH(el.hrHorizon.value, 'slider'); });
    if (el.hrHorizonNum) el.hrHorizonNum.addEventListener('input', function(){ setH(el.hrHorizonNum.value, 'num'); });

    segGroup('tax', 'tax');
    segGroup('funding', 'funding');
    segGroup('cashflow', 'cashflow');
    segGroup('capsrc', 'capsrc');
    segGroup('canwait', 'canWait');
    bindLens();
    bindPresets();

    applyStateToControls();
    buildChart();
    render();

    // live spot — recolour the band once the real price resolves
    if (typeof fetchTodayPrice === 'function'){
      fetchTodayPrice(function(price, source){
        if (typeof price === 'number' && price > 0){ spot = price; spotSource = source; render(); }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
