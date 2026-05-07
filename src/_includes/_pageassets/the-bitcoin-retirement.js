/* The Bitcoin Retirement — page scripts
 * Phase 3 / commit 1: tab switching only.
 * The shared modeling-assumptions API and per-page interactivity
 * (slider clusters, math engine, chart, baseline cluster) land across
 * commits 2–7.
 */

(function(){
  var btns = document.querySelectorAll('.tab-btn');
  if (!btns.length) return;

  function activate(tabKey) {
    btns.forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(t){ t.classList.remove('active'); });
    var btn = document.querySelector('[data-tab="' + tabKey + '"]');
    var pane = document.getElementById('tab-' + tabKey);
    if (btn) btn.classList.add('active');
    if (pane) pane.classList.add('active');
  }

  btns.forEach(function(b){
    b.addEventListener('click', function(){
      var key = b.dataset.tab;
      activate(key);
      // Update URL hash without scrolling
      if (history.replaceState) {
        history.replaceState(null, '', '#' + key);
      }
    });
  });

  // Hash deep-linking on page load
  if (window.location.hash) {
    var hash = window.location.hash.replace('#','');
    if (document.querySelector('[data-tab="' + hash + '"]')) {
      activate(hash);
    }
  }
})();

/* ════════════════════════════════════════════════════════════════
   Phase 3 / commit 2 — Baseline assumptions cluster
   Wires the picker UI to the shared ModelingAssumptions API.
   Three pickers: Inflation (4 cards), Bitcoin growth model (3 cards),
   Traditional portfolio benchmark (3 cards). Plus Hide affordance,
   Custom inflation inline input, Reset link.
   See RETIREMENT_CALCULATOR_DESIGN §9.2.9.
═══════════════════════════════════════════════════════════════════ */

(function(){
  if (!window.ModelingAssumptions) return; // graceful no-op if shared script absent

  var MA = window.ModelingAssumptions;
  var STORAGE_KEY_BASELINE_HIDDEN = 'lcs.theBitcoinRetirement.baselineHidden';

  // ─── Picker rendering: reflect canonical state into card .active classes
  function renderPicker(dim) {
    var grid = document.querySelector('.picker[data-dim="' + dim + '"]');
    if (!grid) return;
    var current = MA.get(dim);
    var cards = grid.querySelectorAll('.picker-card');
    cards.forEach(function(card){
      if (card.dataset.preset === current.preset) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
    // Reveal/hide custom inflation input
    if (dim === 'inflation') {
      var wrap = document.getElementById('inflationCustomWrap');
      var input = document.getElementById('inflationCustom');
      if (wrap && input) {
        if (current.preset === 'custom') {
          wrap.hidden = false;
          // Sync visible value from canonical (only if input is not focused mid-edit)
          if (document.activeElement !== input) {
            var v = current.value;
            if (isFinite(v)) input.value = v;
          }
        } else {
          wrap.hidden = true;
        }
      }
    }
  }
  function renderAll() {
    renderPicker('inflation');
    renderPicker('btcGrowthModel');
    renderPicker('realReturns');
  }

  // ─── Picker click delegation
  function bindPicker(dim) {
    var grid = document.querySelector('.picker[data-dim="' + dim + '"]');
    if (!grid) return;
    grid.addEventListener('click', function(e){
      var card = e.target.closest('.picker-card');
      if (!card || !grid.contains(card)) return;
      var preset = card.dataset.preset;
      if (!preset) return;
      try { MA.set(dim, preset); } catch (err) { /* unknown preset — ignore */ }
      // For Custom inflation, focus the input so the user can type immediately
      if (dim === 'inflation' && preset === 'custom') {
        var input = document.getElementById('inflationCustom');
        if (input) {
          // wait for the wrap to un-hide via renderPicker (subscribe callback)
          setTimeout(function(){ input.focus(); input.select(); }, 0);
        }
      }
    });
  }

  // ─── Custom inflation input — write back to canonical on change
  function bindCustomInflationInput() {
    var input = document.getElementById('inflationCustom');
    if (!input) return;
    function commit() {
      var v = parseFloat(input.value);
      if (!isFinite(v)) return;
      try { MA.set('inflation', 'custom', v); } catch (err) {}
    }
    // Debounce while typing; commit on blur and Enter
    var t = null;
    input.addEventListener('input', function(){
      if (t) clearTimeout(t);
      t = setTimeout(commit, 200);
    });
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function(e){
      if (e.key === 'Enter') { e.preventDefault(); commit(); input.blur(); }
    });
  }

  // ─── Hide / Show baseline cluster body, with localStorage persistence
  function bindHideToggle() {
    var cluster = document.getElementById('baselineCluster');
    var toggle = document.getElementById('baselineToggle');
    if (!cluster || !toggle) return;
    function applyState(hidden) {
      cluster.classList.toggle('collapsed', hidden);
      toggle.textContent = hidden ? 'Show baseline assumptions' : 'Hide';
      try { localStorage.setItem(STORAGE_KEY_BASELINE_HIDDEN, hidden ? '1' : '0'); } catch(e) {}
    }
    // Initial state from storage
    var initiallyHidden = false;
    try { initiallyHidden = localStorage.getItem(STORAGE_KEY_BASELINE_HIDDEN) === '1'; } catch(e) {}
    if (initiallyHidden) applyState(true);
    else toggle.textContent = 'Hide';
    toggle.addEventListener('click', function(e){
      e.preventDefault();
      applyState(!cluster.classList.contains('collapsed'));
    });
  }

  // ─── Reset baseline link — clear all canonical baseline values
  function bindResetLink() {
    var link = document.getElementById('baselineReset');
    if (!link) return;
    link.addEventListener('click', function(e){
      e.preventDefault();
      // ModelingAssumptions.reset() clears every dimension. That includes
      // realEstate (which this page doesn't expose) — fine; resetting an
      // unused dimension is a harmless no-op for this page.
      MA.reset();
      // Subscribe callback below will renderAll(); explicit call is just defense.
      renderAll();
    });
  }

  // ─── Print population — copy live screen state into print-only blocks
  // Triggered on beforeprint so the printed PDF reflects current sliders.
  // Per RETIREMENT_CALCULATOR_DESIGN §8.1.
  function bindPrintPopulation() {
    function pickerSelectedLabel(dim) {
      var card = document.querySelector('[data-dim="' + dim + '"] .picker-card.active');
      if (!card) return '—';
      var val = card.querySelector('.val');
      var name = card.querySelector('.name');
      var v = val ? val.textContent.trim() : '';
      var n = name ? name.textContent.trim() : '';
      return v && n ? (v + ' — ' + n) : (v || n || '—');
    }
    function txtById(id) {
      var el = document.getElementById(id);
      return el ? el.textContent.trim() : '—';
    }
    function populate() {
      // Date
      var d = new Date();
      var dateEl = document.getElementById('printDate');
      if (dateEl) {
        dateEl.textContent = d.toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      }

      // Inputs table
      var rows = [
        ['Target annual retirement income', txtById('val-targetIncomeUSD')],
        ['Retirement year',                 txtById('val-retirementYear')],
        ['Bitcoin stack',                   txtById('val-btcStack')],
        ['Withdrawal rate',                 txtById('val-withdrawalRatePct')],
        ['Monthly DCA',                     txtById('val-monthlyDcaUSD')],
        ['Years in retirement',             txtById('val-yearsInRetirement')],
        ['Inflation rate',                  pickerSelectedLabel('inflation')],
        ['Bitcoin growth model',            pickerSelectedLabel('btcGrowthModel')],
        ['Traditional benchmark',           pickerSelectedLabel('realReturns')]
      ];
      var tbody = document.getElementById('printInputsBody');
      if (tbody) {
        tbody.innerHTML = '';
        rows.forEach(function(r){
          var tr = document.createElement('tr');
          var labelTd = document.createElement('td');
          labelTd.className = 'print-input-label';
          labelTd.textContent = r[0];
          var valTd = document.createElement('td');
          valTd.className = 'print-input-value';
          valTd.textContent = r[1];
          tr.appendChild(labelTd);
          tr.appendChild(valTd);
          tbody.appendChild(tr);
        });
      }

      // Sustainability values — copy text + escape-velocity class state
      var screenYears = document.getElementById('sustYearsLast');
      var printYears = document.getElementById('printYearsLast');
      if (screenYears && printYears) {
        printYears.textContent = screenYears.textContent.trim();
        printYears.classList.toggle('escape-velocity',
          screenYears.classList.contains('escape-velocity'));
      }
      var screenStack = document.getElementById('sustStackValue');
      var printStack = document.getElementById('printStackValue');
      if (screenStack && printStack) {
        printStack.textContent = screenStack.textContent.trim();
      }

      // Sustainability detail line — already prose-formatted on screen
      var screenDetail = document.getElementById('spectrumDetail');
      var printDetail = document.getElementById('printSustDetail');
      if (screenDetail && printDetail) {
        printDetail.textContent = screenDetail.textContent.trim();
      }
    }
    // Run on any print intent — covers Cmd/Ctrl-P, browser menu, system print
    window.addEventListener('beforeprint', populate);
    // Some browsers (Safari mobile) don't fire beforeprint reliably; also
    // pre-populate once at load so the data is in place even if the event
    // never fires. Inputs that change after load won't update without
    // beforeprint — acceptable trade-off for cross-browser robustness.
    populate();
  }

  // ─── Cross-tab sync: re-render when any baseline dim changes
  if (MA.subscribe) {
    MA.subscribe(function(dim){
      if (dim === 'inflation' || dim === '*') renderPicker('inflation');
      if (dim === 'btcGrowthModel' || dim === '*') renderPicker('btcGrowthModel');
      if (dim === 'realReturns' || dim === '*') renderPicker('realReturns');
    });
  }

  // ─── Initial wire-up
  renderAll();
  bindPicker('inflation');
  bindPicker('btcGrowthModel');
  bindPicker('realReturns');
  bindCustomInflationInput();
  bindHideToggle();
  bindResetLink();
  bindPrintPopulation();
})();

/* ════════════════════════════════════════════════════════════════
   Phase 3 / commit 3 — Projection chart + status line
   First commit where the new math runs end-to-end. Renders Power Law
   trend / floor / upper-band lines (with §7.3 asymmetric treatment)
   plus the user's stack-drawdown line under sell-as-needed math. The
   default scenario is hardcoded for now; commit 4 wires sliders.
   See RETIREMENT_CALCULATOR_DESIGN §7.3, §9.2 architecture diagram.
═══════════════════════════════════════════════════════════════════ */

(function(){
  if (typeof Chart === 'undefined') return;
  if (!window.ModelingAssumptions) return;

  // ─── Power Law constants (canonical, mirroring the-power-law.js)
  var PL_A = 1.6e-17;
  var PL_B = 5.77;
  var PL_FLOOR = 0.42;
  var PL_CEIL = 3.0;
  var GENESIS = new Date(Date.UTC(2009, 0, 3)); // Jan 3, 2009 UTC

  // CoinGecko fallback if live fetch fails (updated periodically)
  var LIVE_BTC_FALLBACK = 108000;

  // Live BTC price — updated by updateStatusLine() once the CoinGecko fetch
  // resolves. Used by renderChart() to anchor the "current trajectory" line
  // (5th dataset on the chart). Initialised to the fallback so the line
  // renders sensibly before the fetch completes.
  var liveBtcPrice = LIVE_BTC_FALLBACK;

  function daysSince(date) {
    return (date.getTime() - GENESIS.getTime()) / (1000 * 60 * 60 * 24);
  }
  function plPrice(days) {
    return PL_A * Math.pow(days, PL_B);
  }
  function plPriceAtDate(date) { return plPrice(daysSince(date)); }
  function dateForYear(year) {
    var today = new Date();
    return new Date(year, today.getMonth(), today.getDate());
  }

  // ─── Scenario state — mutable, drives all chart math
  //                 Sliders update this object; chart reads from it.
  var SCENARIO = {
    btcStack: 1.0,
    targetIncomeUSD: 100000,
    retirementYear: 2045,
    yearsInRetirement: 30,
    monthlyDcaUSD: 0,
    withdrawalRatePct: 6.0
  };

  // ─── Growth-model price helper — shared by stack-projection + sustainability math
  function projPriceForGrowth(date, growthModelKey) {
    var trend = plPriceAtDate(date);
    if (growthModelKey === 'powerlaw-floor') return trend * PL_FLOOR;
    // 'powerlaw-trend' (default) and 'linear-cagr-decay' both use trend until commit 7
    return trend;
  }

  // ─── Stack value at retirement (after pre-retirement DCA accumulation)
  // Returns nominal value in retirement-year dollars.
  function computeStackAtRetirement(scenario, growthModelKey) {
    var startYear = (new Date()).getFullYear();
    var stack = scenario.btcStack;
    for (var y = startYear; y < scenario.retirementYear; y++) {
      var d = dateForYear(y);
      var price = projPriceForGrowth(d, growthModelKey);
      if (scenario.monthlyDcaUSD > 0 && price > 0) {
        stack += (12 * scenario.monthlyDcaUSD) / price;
      }
    }
    var retDate = dateForYear(scenario.retirementYear);
    var retPrice = projPriceForGrowth(retDate, growthModelKey);
    return { stackBtc: stack, retPrice: retPrice, nominal: stack * retPrice };
  }

  // ─── Real (today's $) stack value at retirement
  function realStackAtRetirement(scenario, growthModelKey, inflationPct) {
    var info = computeStackAtRetirement(scenario, growthModelKey);
    var startYear = (new Date()).getFullYear();
    var yearsToRet = scenario.retirementYear - startYear;
    var deflator = Math.pow(1 + inflationPct / 100, yearsToRet);
    return info.nominal / deflator;
  }

  // ─── Project user's stack value year-by-year under sell-as-needed
  // Pre-retirement: BTC count grows via DCA accumulation (12 × monthly / yearly trend price).
  // Post-retirement: each year, sell BTC to cover nominal target income.
  // Returns {points, btcPoints, depletionYear} where points is [{x:year, y:usdValue}]
  // and btcPoints is [{x:year, btc:count, usd:value}] used by the BTC-count
  // annotation plugin to label the drawdown line at anchor years.
  //
  // Optional priceMultiplier: scales the price returned by the growth model
  // (default 1.0). Used by the "current trajectory" line, which projects under
  // the assumption that BTC stays at its current ratio to trend. Multiplying
  // price scales both the dollar value of remaining stack AND how much BTC
  // gets sold each year to cover the (unchanged) nominal income — so a stack
  // priced below trend depletes faster, as it should.
  function projectStackOverTime(scenario, growthModelKey, inflationPct, priceMultiplier) {
    var today = new Date();
    var startYear = today.getFullYear();
    var endYear = scenario.retirementYear + scenario.yearsInRetirement;
    var infl = inflationPct / 100;
    var multiplier = (priceMultiplier === undefined || priceMultiplier === null || !isFinite(priceMultiplier))
      ? 1
      : priceMultiplier;

    var stackBtc = scenario.btcStack;
    var points = [];
    var btcPoints = [];
    var depletionYear = null;

    for (var y = startYear; y <= endYear; y++) {
      var d = dateForYear(y);
      var price = projPriceForGrowth(d, growthModelKey) * multiplier;

      if (y < scenario.retirementYear) {
        // Pre-retirement DCA accumulation. Simple year-end approximation:
        // BTC added this year = 12 × monthly contribution / year-end trend price.
        if (scenario.monthlyDcaUSD > 0 && price > 0) {
          stackBtc += (12 * scenario.monthlyDcaUSD) / price;
        }
        // Push null so dataset length matches the band datasets — keeps index-mode
        // interaction aligned across all four series. Chart.js renders null as a
        // gap (no visible line pre-retirement, same as before).
        points.push({ x: y, y: null });
        btcPoints.push({ x: y, btc: stackBtc, usd: null });
      } else if (y === scenario.retirementYear) {
        // Drawdown line begins here, at the user's stack value at retirement
        // (after any accumulated DCA contributions).
        points.push({ x: y, y: stackBtc * price });
        btcPoints.push({ x: y, btc: stackBtc, usd: stackBtc * price });
      } else {
        // Post-retirement: sell BTC to cover nominal target income
        var yearsFromToday = y - startYear;
        var nominalIncome = scenario.targetIncomeUSD * Math.pow(1 + infl, yearsFromToday);
        var btcNeeded = nominalIncome / price;
        stackBtc = Math.max(0, stackBtc - btcNeeded);
        if (stackBtc <= 0 && depletionYear === null) {
          depletionYear = y;
        }
        points.push({ x: y, y: stackBtc * price });
        btcPoints.push({ x: y, btc: stackBtc, usd: stackBtc * price });
      }
    }
    return { points: points, btcPoints: btcPoints, depletionYear: depletionYear, startYear: startYear, endYear: endYear };
  }

  // ─── Build trend / floor / upper-band point arrays for the chart's bands
  function buildBands(startYear, endYear) {
    var trend = [], floor = [], upper = [];
    for (var y = startYear; y <= endYear; y++) {
      var d = dateForYear(y);
      var t = plPriceAtDate(d);
      trend.push({ x: y, y: t });
      floor.push({ x: y, y: t * PL_FLOOR });
      upper.push({ x: y, y: t * PL_CEIL });
    }
    return { trend: trend, floor: floor, upper: upper };
  }

  // ─── Vertical-line plugin: draws a dashed marker at a given x-axis value
  var verticalLinePlugin = {
    id: 'verticalMarkers',
    afterDraw: function(chart) {
      var markers = chart.options.plugins.verticalMarkers && chart.options.plugins.verticalMarkers.lines;
      if (!markers || !markers.length) return;
      var ctx = chart.ctx;
      var xScale = chart.scales.x, yScale = chart.scales.y;
      ctx.save();
      markers.forEach(function(m) {
        var xPx = xScale.getPixelForValue(m.x);
        ctx.strokeStyle = m.color || 'rgba(236,228,214,0.35)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(xPx, yScale.top);
        ctx.lineTo(xPx, yScale.bottom);
        ctx.stroke();
        // Label at top of plot area
        if (m.label) {
          ctx.setLineDash([]);
          ctx.fillStyle = m.labelColor || '#ece4d6';
          ctx.font = '500 12px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(m.label, xPx, yScale.top - 8);
        }
      });
      ctx.restore();
    }
  };

  // ─── BTC-count annotation plugin: dots + "X.XX BTC" labels at anchor years
  // along the user's drawdown line. Bitcoin-native readers care not just about
  // the dollar value of remaining stack but the BTC count itself; this gives
  // them that dimension at a glance without a second Y-axis.
  var btcCountPlugin = {
    id: 'btcCountAnnotations',
    afterDatasetsDraw: function(chart) {
      var cfg = chart.options.plugins.btcCountAnnotations;
      var anchors = cfg && cfg.anchors;
      if (!anchors || !anchors.length) return;
      var ctx = chart.ctx;
      var xScale = chart.scales.x, yScale = chart.scales.y;
      ctx.save();
      ctx.font = '500 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      anchors.forEach(function(a) {
        if (a.usd === null || a.usd === undefined || !isFinite(a.usd) || a.usd <= 0) return;
        var xPx = xScale.getPixelForValue(a.x);
        var yPx = yScale.getPixelForValue(a.usd);
        // Dot on the drawdown line
        ctx.fillStyle = 'rgba(236,228,214,0.9)';
        ctx.beginPath();
        ctx.arc(xPx, yPx, 3, 0, 2 * Math.PI);
        ctx.fill();
        // Label above the dot
        ctx.fillStyle = '#ece4d6';
        ctx.fillText(a.btc.toFixed(2) + ' BTC', xPx, yPx - 8);
      });
      ctx.restore();
    }
  };

  // ─── Pick 2-4 anchor years across the drawdown window for BTC-count labels.
  // Anchors are evenly distributed: retirement, +⅓, +⅔, end (or last year before
  // depletion). Shorter retirement windows get fewer anchors to avoid crowding.
  function pickBtcAnchors(retirementYear, yearsInRetirement, depletionYear, btcPoints) {
    if (!btcPoints || !btcPoints.length || yearsInRetirement < 1) return [];
    var lastYear = depletionYear
      ? Math.max(retirementYear, depletionYear - 1)
      : retirementYear + yearsInRetirement;
    var span = lastYear - retirementYear;
    if (span < 0) return [];

    var candidates;
    if (yearsInRetirement >= 9 && span >= 3) {
      candidates = [
        retirementYear,
        retirementYear + Math.round(span / 3),
        retirementYear + Math.round(2 * span / 3),
        lastYear
      ];
    } else if (yearsInRetirement >= 4 && span >= 2) {
      candidates = [retirementYear, retirementYear + Math.round(span / 2), lastYear];
    } else {
      candidates = [retirementYear, lastYear];
    }

    // Dedupe and lookup BTC counts; drop any without a usable usd value
    var seen = {};
    var anchors = [];
    candidates.forEach(function(y) {
      if (seen[y]) return;
      seen[y] = true;
      var pt = null;
      for (var i = 0; i < btcPoints.length; i++) {
        if (btcPoints[i].x === y) { pt = btcPoints[i]; break; }
      }
      if (pt && pt.usd !== null && isFinite(pt.usd) && pt.usd > 0 && pt.btc >= 0) {
        anchors.push({ x: y, btc: pt.btc, usd: pt.usd });
      }
    });
    return anchors;
  }

  // ─── Project a traditional 60/40 portfolio over the same window for
  // visual comparison (§9.2.1: realReturns picker drives this line).
  // Same starting capital as the bitcoin drawdown line (btcStack × trend
  // price today), same DCA contributions pre-retirement, same nominal
  // income withdrawals post-retirement. Grows at nominal = (1+real)(1+infl)−1.
  // Returns an array of {x:year, y:usd|null} aligned with the bitcoin lines.
  function projectTraditionalPortfolio(scenario, realReturnPct, inflationPct, startingCapital) {
    var startYear = (new Date()).getFullYear();
    var endYear = scenario.retirementYear + scenario.yearsInRetirement;
    var realRate = realReturnPct / 100;
    var infl = inflationPct / 100;
    // Nominal compounding rate via Fisher equation
    var nominalRate = (1 + realRate) * (1 + infl) - 1;

    var balance = startingCapital;
    var points = [];

    for (var y = startYear; y <= endYear; y++) {
      if (y < scenario.retirementYear) {
        // Pre-retirement: balance compounds + DCA goes into the portfolio
        // (mirrors the bitcoin DCA flow but into 60/40 instead of BTC)
        var dcaAnnual = (scenario.monthlyDcaUSD || 0) * 12;
        balance = balance * (1 + nominalRate) + dcaAnnual;
        // Hide pre-retirement segment to match the drawdown line's null prefix —
        // keeps tooltip-index alignment clean across all five datasets.
        points.push({ x: y, y: null });
      } else if (y === scenario.retirementYear) {
        // Drawdown line begins here at the carried-forward balance
        points.push({ x: y, y: balance });
      } else {
        // Post-retirement: compound, then withdraw target nominal income
        var yearsFromToday = y - startYear;
        var nominalIncome = scenario.targetIncomeUSD * Math.pow(1 + infl, yearsFromToday);
        balance = balance * (1 + nominalRate) - nominalIncome;
        if (balance <= 0) {
          balance = 0;
          points.push({ x: y, y: null });
        } else {
          points.push({ x: y, y: balance });
        }
      }
    }
    return points;
  }

  // ─── Plugin: bandFill — subtle amber tint between Floor (idx 0) and Upper
  //     (idx 2) bands. Visually groups the three power-law lines as a
  //     bounded channel, distinct from the portfolio-value lines (per user
  //     feedback). Drawn before datasets so it sits behind every line.
  var bandFillPlugin = {
    id: 'bandFill',
    beforeDatasetsDraw: function(chart) {
      var floorMeta = chart.getDatasetMeta(0);
      var upperMeta = chart.getDatasetMeta(2);
      if (!floorMeta || !upperMeta) return;
      var floorPts = floorMeta.data;
      var upperPts = upperMeta.data;
      if (!floorPts || !upperPts || floorPts.length === 0 || upperPts.length === 0) return;
      if (floorMeta.hidden || upperMeta.hidden) return;

      var ctx = chart.ctx;
      var area = chart.chartArea;
      ctx.save();
      // Clip to chart area in case any path segment falls outside (e.g. with
      // an explicit y-axis max that crops the upper band).
      ctx.beginPath();
      ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
      ctx.clip();

      ctx.beginPath();
      ctx.moveTo(floorPts[0].x, floorPts[0].y);
      for (var i = 1; i < floorPts.length; i++) {
        ctx.lineTo(floorPts[i].x, floorPts[i].y);
      }
      for (var j = upperPts.length - 1; j >= 0; j--) {
        ctx.lineTo(upperPts[j].x, upperPts[j].y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(224,148,34,0.05)';
      ctx.fill();
      ctx.restore();
    }
  };

  // ─── Chart instance + render/update
  var chart = null;
  function renderChart() {
    var canvas = document.getElementById('projectionChart');
    if (!canvas) return;

    var growth = window.ModelingAssumptions.get('btcGrowthModel');
    var inflation = window.ModelingAssumptions.get('inflation');
    var realReturns = window.ModelingAssumptions.get('realReturns');

    var startYear = (new Date()).getFullYear();
    var endYear = SCENARIO.retirementYear + SCENARIO.yearsInRetirement;
    var bands = buildBands(startYear, endYear);
    var stack = projectStackOverTime(SCENARIO, growth.preset, inflation.value);

    // Current-trajectory line: same projection, but with prices scaled by
    // today's actual ratio to trend (i.e., assume BTC stays at this discount
    // or premium). Anchored to the live BTC price, so the line starts at the
    // user's actual mark-to-market stack value rather than the at-trend value.
    var trendPriceToday = projPriceForGrowth(dateForYear(startYear), 'powerlaw-trend');
    var currentRatio = (trendPriceToday > 0) ? (liveBtcPrice / trendPriceToday) : 1;
    var currentTrajectory = projectStackOverTime(SCENARIO, 'powerlaw-trend', inflation.value, currentRatio);

    // Starting capital for the benchmark line: match the bitcoin drawdown
    // line's anchor (btcStack × trend price today). Apples-to-apples comparison
    // — both lines start at the same dollars.
    // Benchmark "starting capital" = btcStack at LIVE market price, i.e.
    // what you'd actually have if you sold today. Matches the
    // current-trajectory line's starting point — both lines now share an
    // honest "if you sold today" basis. Previously used trendPriceToday
    // which inflated the benchmark by 1/currentRatio (~1.7x at 0.59x
    // trend), making the 60/40 comparison artificially favourable.
    var startingCapital = SCENARIO.btcStack * liveBtcPrice;
    var benchmark = projectTraditionalPortfolio(SCENARIO, realReturns.value, inflation.value, startingCapital);

    // Update title to reflect the chart's actual time range
    var titleEl = document.getElementById('projectionTitle');
    if (titleEl) titleEl.textContent = 'Projected stack value, ' + startYear + ' \u2013 ' + endYear;

    var datasets = [
      // ─── Floor band — confident dashed (planning-grade anchor per §7.3) ───
      {
        label: 'Floor (0.42\u00d7 trend)',
        data: bands.floor,
        type: 'line',
        borderColor: '#b04525',
        backgroundColor: '#b04525',
        borderWidth: 1.6,
        borderDash: [6, 3],
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 4
      },
      // ─── Trend — solid (central case) ───
      {
        label: 'Trend',
        data: bands.trend,
        type: 'line',
        borderColor: '#e09422',
        backgroundColor: '#e09422',
        borderWidth: 2.5,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 3
      },
      // ─── Upper band — sparse dashed, low opacity (§7.3 visual de-emphasis) ───
      {
        label: 'Upper (3\u00d7 trend) \u2014 spike, not plateau',
        data: bands.upper,
        type: 'line',
        borderColor: '#e8c820',
        backgroundColor: '#e8c820',
        borderWidth: 1.2,
        borderDash: [1, 6],
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 5
      },
      // ─── User's stack drawdown — solid white-ish, primary visual weight ───
      {
        label: 'Your stack (drawdown strategy)',
        data: stack.points,
        type: 'line',
        borderColor: '#ece4d6',
        backgroundColor: '#ece4d6',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 2
      },
      // ─── Current trajectory — same projection at today's actual ratio to
      // trend, anchored to live BTC price. Sibling of the drawdown line: same
      // ink-bright color family but dashed and dimmer to signal "this is the
      // below-trend (or above-trend) view." Starts at the user's actual
      // mark-to-market stack value today, addresses the apparent year-1
      // discrepancy where the chart used to show stack at trend price even
      // though BTC currently trades below trend.
      {
        label: 'Your stack (current trajectory, ' + currentRatio.toFixed(2) + '\u00d7 trend)',
        data: currentTrajectory.points,
        type: 'line',
        borderColor: '#a89c8a',
        backgroundColor: '#a89c8a',
        borderWidth: 1.5,
        borderDash: [4, 3],
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 3
      },
      // ─── Traditional 60/40 benchmark — dashed muted gray, supplementary ───
      // Visually subordinate per design doc §9.2.1 ("for comparison only;
      // not core to the calc's primary computation"). Same starting capital
      // as the bitcoin drawdown above, so the two lines are directly
      // comparable. Picks up the realReturns picker value (3% / 5% / 7%).
      {
        label: 'Traditional 60/40 (' + realReturns.value + '% real)',
        data: benchmark,
        type: 'line',
        borderColor: '#5e7a92',
        backgroundColor: '#5e7a92',
        borderWidth: 1.4,
        borderDash: [5, 4],
        pointRadius: 0,
        fill: false,
        tension: 0.2,
        order: 6
      }
    ];

    var verticalLines = [
      { x: startYear, label: 'Today', color: 'rgba(224,148,34,0.45)', labelColor: '#e09422' },
      { x: SCENARIO.retirementYear, label: 'Retirement (' + SCENARIO.retirementYear + ')', color: 'rgba(236,228,214,0.35)', labelColor: '#ece4d6' }
    ];
    if (stack.depletionYear) {
      verticalLines.push({ x: stack.depletionYear, label: 'Stack depleted (' + stack.depletionYear + ')', color: 'rgba(236,228,214,0.25)', labelColor: 'rgba(236,228,214,0.7)' });
    }

    var btcAnchors = pickBtcAnchors(SCENARIO.retirementYear, SCENARIO.yearsInRetirement, stack.depletionYear, stack.btcPoints);

    // Index map for the tooltip callback: which datasets have associated
    // BTC counts that vary by year. Drawdown (index 3) and current
    // trajectory (index 4) — the user-stack lines — both have btcPoints
    // arrays where each entry is {x: year, btc: count, usd: value}. The
    // tooltip uses this to append "(N.NN BTC)" to those rows.
    var btcDataByDataset = {
      3: stack.btcPoints,
      4: currentTrajectory.btcPoints
    };

    // Compute explicit y-axis bounds from actual data. Chart.js's log-scale
    // auto-axis was producing inconsistent min values when the benchmark
    // dataset's shape shifted at the depletion threshold (small target-income
    // changes around the threshold caused the y-axis min to jump from $40K
    // to $10M). Setting min/max explicitly bypasses that.
    var yMinObs = Infinity, yMaxObs = -Infinity;
    for (var di = 0; di < datasets.length; di++) {
      var pts = datasets[di].data;
      if (!pts) continue;
      for (var pi = 0; pi < pts.length; pi++) {
        var pt = pts[pi];
        if (pt && isFinite(pt.y) && pt.y > 0) {
          if (pt.y < yMinObs) yMinObs = pt.y;
          if (pt.y > yMaxObs) yMaxObs = pt.y;
        }
      }
    }
    if (!isFinite(yMinObs) || !isFinite(yMaxObs)) {
      yMinObs = 1000; yMaxObs = 1e9;
    }
    // Half-decade padding above and below so lines aren't pinned to the edge
    var yMin = yMinObs * 0.5;
    var yMax = yMaxObs * 2;

    if (chart) {
      chart.data.datasets = datasets;
      chart.options.plugins.verticalMarkers.lines = verticalLines;
      chart.options.plugins.btcCountAnnotations.anchors = btcAnchors;
      chart._btcDataByDataset = btcDataByDataset;
      // Update x-axis range in case retirement-year or years-in-retirement changed
      chart.options.scales.x.min = startYear;
      chart.options.scales.x.max = endYear;
      // Explicit y-axis bounds — stops Chart.js auto-scale from quirking
      chart.options.scales.y.min = yMin;
      chart.options.scales.y.max = yMax;
      // 'none' = no animation — snappy response during slider drag
      chart.update('none');
      return;
    }

    var ctx = canvas.getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: { datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 36, right: 8 } },
        scales: {
          x: {
            type: 'linear',
            min: startYear,
            max: endYear,
            title: { display: false },
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: {
              color: '#7a7367',
              font: { family: 'Inter, sans-serif', size: 11 },
              stepSize: 10,
              callback: function(v){ return Math.round(v); }
            }
          },
          y: {
            type: 'logarithmic',
            position: 'left',
            min: yMin,
            max: yMax,
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: {
              color: '#7a7367',
              font: { family: 'Inter, sans-serif', size: 11 },
              callback: function(v){
                if (v >= 1e9) return '$' + (v/1e9).toFixed(0) + 'B';
                if (v >= 1e6) return '$' + (v/1e6).toFixed(0) + 'M';
                if (v >= 1e3) return '$' + (v/1e3).toFixed(0) + 'K';
                return '$' + v.toFixed(0);
              }
            }
          }
        },
        plugins: {
          legend: { display: false }, // we render our own legend in the header
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)',
            borderColor: 'rgba(224,148,34,0.30)',
            borderWidth: 1,
            titleColor: '#ece4d6',
            bodyColor: '#ccc6b8',
            padding: 10,
            displayColors: true,
            filter: function(tooltipItem) {
              // Skip rows with null y-value — the user-stack drawdown line is
              // null pre-retirement (so the tooltip doesn't read "$0" before the
              // drawdown actually begins).
              var v = tooltipItem.parsed && tooltipItem.parsed.y;
              return v !== null && v !== undefined && isFinite(v) && v > 0;
            },
            callbacks: {
              title: function(items){ return items[0] && items[0].parsed ? 'Year ' + Math.round(items[0].parsed.x) : ''; },
              label: function(ctx){
                var v = ctx.parsed.y;
                var label = ctx.dataset.label || '';
                if (!isFinite(v)) return label;
                var formatted;
                if (v >= 1e9) formatted = '$' + (v/1e9).toFixed(2) + 'B';
                else if (v >= 1e6) formatted = '$' + (v/1e6).toFixed(2) + 'M';
                else if (v >= 1e3) formatted = '$' + (v/1e3).toFixed(0) + 'K';
                else formatted = '$' + v.toFixed(0);
                // Index 0 = Floor, 1 = Trend, 2 = Upper — these are
                // per-bitcoin price lines. Suffix "(per BTC)" makes that
                // explicit so the user doesn't conflate them with stack
                // values, especially deep in time when numbers grow large.
                var i = ctx.datasetIndex;
                if (i === 0 || i === 1 || i === 2) {
                  formatted += ' (per BTC)';
                } else if (i === 3 || i === 4) {
                  // Stack lines — look up BTC count for this year.
                  // Drawdown (3) and current trajectory (4) hold different
                  // BTC counts at the same year because the price multiplier
                  // differs, so showing both is informative.
                  var btcMap = ctx.chart && ctx.chart._btcDataByDataset;
                  if (btcMap && btcMap[i]) {
                    var year = Math.round(ctx.parsed.x);
                    var pts = btcMap[i];
                    for (var j = 0; j < pts.length; j++) {
                      if (Math.round(pts[j].x) === year && isFinite(pts[j].btc)) {
                        formatted += ' (' + pts[j].btc.toFixed(2) + ' BTC)';
                        break;
                      }
                    }
                  }
                }
                return label + ': ' + formatted;
              }
            }
          },
          verticalMarkers: { lines: verticalLines },
          btcCountAnnotations: { anchors: btcAnchors }
        }
      },
      plugins: [bandFillPlugin, verticalLinePlugin, btcCountPlugin]
    });
    chart._btcDataByDataset = btcDataByDataset;
  }

  // ─── Status line: live BTC price + ratio to today's Power Law trend
  //                  + dynamic percentile (where current price sits in
  //                  the historical distribution of trend ratios)
  function updateStatusLine(currentPrice, source) {
    // Capture the live price for any module-level consumers (chart's
    // current-trajectory line, etc.). Even if the page elements below are
    // missing, downstream callers should still see the fresh value.
    liveBtcPrice = currentPrice;
    var priceEl = document.getElementById('statusPrice');
    var ratioEl = document.getElementById('statusRatio');
    var pctEl = document.getElementById('statusPercentile');
    if (!priceEl || !ratioEl) return;
    var todayTrend = plPriceAtDate(new Date());
    var ratio = currentPrice / todayTrend;
    priceEl.textContent = '$' + Math.round(currentPrice).toLocaleString();
    ratioEl.textContent = ratio.toFixed(2) + '\u00d7';
    if (pctEl && window.CalcHelpers && window.CalcHelpers.percentileBelowRatio) {
      var pct = window.CalcHelpers.percentileBelowRatio(ratio);
      if (pct === null || !isFinite(pct)) {
        pctEl.textContent = '\u2014';
      } else {
        pctEl.textContent = Math.round(pct) + '%';
      }
    }
    if (source === 'fallback') {
      priceEl.title = 'Live price fetch failed; showing fallback value.';
    }
  }
  function fetchLiveBtcPrice() {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
      .then(function(d){ updateStatusLine(d.bitcoin.usd, 'live'); scheduleRender(); })
      .catch(function(){ updateStatusLine(LIVE_BTC_FALLBACK, 'fallback'); scheduleRender(); });
  }

  // ─── Slider wiring + coupling
  //     §9.2.5: "as you move one [slider], the others update to stay
  //     mathematically consistent." The income/rate pair is kept consistent
  //     with stackValueAtRetirement (today's $) via:
  //         targetIncome ≈ (withdrawalRate / 100) × stackValueRealAtRet
  //
  //     'updates' tag controls which coupled slider gets adjusted on drag:
  //       'rate'   → income held; rate recomputed from new stack
  //       'income' → rate held;   income recomputed
  //       null     → no coupling (yearsInRetirement only affects depletion)
  var SLIDER_CONFIG = [
    { key: 'targetIncomeUSD',   parse: parseInt,   fmt: function(v){ return '$' + Math.round(v).toLocaleString(); }, updates: 'rate',   min: 20000, max: 500000 },
    { key: 'retirementYear',    parse: parseInt,   fmt: function(v){ return String(v); },                            updates: 'rate',   min: 2026,  max: 2070 },
    { key: 'btcStack',          parse: parseFloat, fmt: function(v){ return v.toFixed(1) + ' BTC'; },                updates: 'rate',   min: 0,     max: 50 },
    { key: 'withdrawalRatePct', parse: parseFloat, fmt: function(v){ return v.toFixed(1) + '%'; },                   updates: 'income', min: 2,     max: 15 },
    { key: 'monthlyDcaUSD',     parse: parseInt,   fmt: function(v){ return '$' + Math.round(v).toLocaleString() + '/mo'; }, updates: 'rate', min: 0, max: 5000 },
    { key: 'yearsInRetirement', parse: parseInt,   fmt: function(v){ return v + ' yrs'; },                           updates: null,     min: 10,    max: 50 }
  ];
  var SLIDER_BY_KEY = {};
  SLIDER_CONFIG.forEach(function(c){ SLIDER_BY_KEY[c.key] = c; });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Update both the slider input (thumb position) and the value-display
  // for a given key. Used when coupling adjusts a slider programmatically.
  function syncSliderUI(key) {
    var cfg = SLIDER_BY_KEY[key];
    if (!cfg) return;
    var input = document.getElementById('slider-' + key);
    var valEl = document.getElementById('val-' + key);
    if (!input || !valEl) return;
    input.value = SCENARIO[key];
    valEl.textContent = cfg.fmt(SCENARIO[key]);
  }

  function recomputeCoupledFromIncomeOrMeans() {
    // Income held; rate derived from current stack value
    var growthModel = window.ModelingAssumptions.get('btcGrowthModel');
    var inflation = window.ModelingAssumptions.get('inflation');
    var stackReal = realStackAtRetirement(SCENARIO, growthModel.preset, inflation.value);
    if (stackReal > 0) {
      var newRate = (SCENARIO.targetIncomeUSD / stackReal) * 100;
      var rateCfg = SLIDER_BY_KEY.withdrawalRatePct;
      SCENARIO.withdrawalRatePct = clamp(newRate, rateCfg.min, rateCfg.max);
    }
    syncSliderUI('withdrawalRatePct');
  }

  function recomputeCoupledFromRate() {
    // Rate held; income derived from current stack value
    var growthModel = window.ModelingAssumptions.get('btcGrowthModel');
    var inflation = window.ModelingAssumptions.get('inflation');
    var stackReal = realStackAtRetirement(SCENARIO, growthModel.preset, inflation.value);
    if (stackReal > 0) {
      var newIncome = (SCENARIO.withdrawalRatePct / 100) * stackReal;
      var incomeCfg = SLIDER_BY_KEY.targetIncomeUSD;
      SCENARIO.targetIncomeUSD = clamp(newIncome, incomeCfg.min, incomeCfg.max);
    }
    syncSliderUI('targetIncomeUSD');
  }

  // ─── Sustainability readout — Years stack lasts + Stack value at retirement
  function formatCurrencyShort(v) {
    if (!isFinite(v) || v <= 0) return '$0';
    if (v >= 1e9) return '$' + (v/1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v/1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + Math.round(v/1e3) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }

  // ─── Escape velocity spectrum positioning (§9.2.6)
  // Returns { position 0..1, achieved bool, detail string }.
  // Left half (0..0.5): stack depletes; position scaled by yearsLasted/window.
  // Right half (0.5..1.0): escape velocity; position scaled by tanh of the
  // ratio of final-to-retirement real stack value (so a stack that grows in
  // real terms sits further right than one that just survives).
  function computeEscapeVelocity(proj, scenario, inflationPct) {
    if (proj.depletionYear !== null) {
      var depletedAt = Math.max(0, proj.depletionYear - scenario.retirementYear);
      var pos = 0.5 * (depletedAt / Math.max(1, scenario.yearsInRetirement));
      return {
        position: Math.max(0.02, Math.min(0.50, pos)),
        achieved: false,
        detail: 'Stack depletes ' + depletedAt + ' year' + (depletedAt === 1 ? '' : 's') + ' into retirement at this withdrawal.'
      };
    }
    // Escape velocity: stack survives the projection window.
    // Compare real final stack value to real stack-at-retirement.
    var startYear = (new Date()).getFullYear();
    var infl = inflationPct / 100;
    var firstPoint = null;
    for (var i = 0; i < proj.points.length; i++) {
      if (proj.points[i].y !== null && proj.points[i].y > 0) { firstPoint = proj.points[i]; break; }
    }
    var lastPoint = proj.points[proj.points.length - 1];
    if (!firstPoint || !lastPoint || lastPoint.y === null || lastPoint.y <= 0) {
      return { position: 0.55, achieved: true, detail: 'Stack survives the projection window.' };
    }
    var realFirst = firstPoint.y / Math.pow(1 + infl, firstPoint.x - startYear);
    var realLast  = lastPoint.y  / Math.pow(1 + infl, lastPoint.x  - startYear);
    var ratio = realLast / realFirst;
    var pos = 0.5 + 0.5 * (Math.tanh(Math.log(Math.max(0.05, ratio))) + 1) / 2;
    var detail;
    if (ratio >= 1.05) {
      detail = 'Stack grows ' + ratio.toFixed(1) + '\u00d7 in real terms over the window \u2014 comfortably above escape velocity.';
    } else if (ratio >= 0.85) {
      detail = 'Stack roughly maintains real value through the window \u2014 right at escape velocity.';
    } else {
      detail = 'Stack survives the window but loses some real value (' + (ratio * 100).toFixed(0) + '% of starting real value at the end).';
    }
    return { position: Math.min(0.98, Math.max(0.52, pos)), achieved: true, detail: detail };
  }

  function updateSpectrum(proj, scenario, inflationPct) {
    var marker = document.getElementById('spectrumMarker');
    var track = document.getElementById('spectrumTrack');
    var detailEl = document.getElementById('spectrumDetail');
    if (!marker || !detailEl) return;
    var ev = computeEscapeVelocity(proj, scenario, inflationPct);
    marker.style.left = (ev.position * 100).toFixed(2) + '%';
    marker.classList.toggle('escape', ev.achieved);
    if (track) track.classList.toggle('escape', ev.achieved);
    detailEl.textContent = ev.detail;
  }

  function updateSustainability() {
    var growthModel = window.ModelingAssumptions.get('btcGrowthModel');
    var inflation = window.ModelingAssumptions.get('inflation');
    var stackReal = realStackAtRetirement(SCENARIO, growthModel.preset, inflation.value);
    var proj = projectStackOverTime(SCENARIO, growthModel.preset, inflation.value);

    var yearsEl = document.getElementById('sustYearsLast');
    if (yearsEl) {
      if (proj.depletionYear) {
        var n = proj.depletionYear - SCENARIO.retirementYear;
        yearsEl.textContent = '~' + n + (n === 1 ? ' year' : ' years');
        yearsEl.classList.remove('escape-velocity');
      } else {
        yearsEl.textContent = '\u221E \u2014 escape velocity';
        yearsEl.classList.add('escape-velocity');
      }
    }
    var stackEl = document.getElementById('sustStackValue');
    if (stackEl) stackEl.textContent = formatCurrencyShort(stackReal);

    updateSpectrum(proj, SCENARIO, inflation.value);
  }

  var renderRaf = null;
  function scheduleRender() {
    if (renderRaf) return;
    renderRaf = requestAnimationFrame(function(){
      renderRaf = null;
      renderChart();
      updateSustainability();
    });
  }

  function wireSliders() {
    SLIDER_CONFIG.forEach(function(cfg){
      var input = document.getElementById('slider-' + cfg.key);
      var valEl = document.getElementById('val-' + cfg.key);
      if (!input || !valEl) return;
      // Sync initial display from SCENARIO state
      input.value = SCENARIO[cfg.key];
      valEl.textContent = cfg.fmt(SCENARIO[cfg.key]);
      input.addEventListener('input', function(){
        var v = cfg.parse(input.value);
        SCENARIO[cfg.key] = v;
        valEl.textContent = cfg.fmt(v);
        // Coupling: update the partner slider (income↔rate)
        if (cfg.updates === 'rate') recomputeCoupledFromIncomeOrMeans();
        else if (cfg.updates === 'income') recomputeCoupledFromRate();
        scheduleRender();
      });
    });
  }

  // ─── Re-render chart when inflation or growth model changes
  if (window.ModelingAssumptions.subscribe) {
    window.ModelingAssumptions.subscribe(function(dim){
      if (dim === 'inflation' || dim === 'btcGrowthModel' || dim === 'realReturns' || dim === '*') {
        scheduleRender();
      }
    });
  }

  // ─── Initial run
  wireSliders();
  // Reconcile defaults: income held; derive withdrawal rate from current
  // stack-at-retirement so the visible values are internally consistent.
  recomputeCoupledFromIncomeOrMeans();
  renderChart();
  updateSustainability();
  fetchLiveBtcPrice();
})();
