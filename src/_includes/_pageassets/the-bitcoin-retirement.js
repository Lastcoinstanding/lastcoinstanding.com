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
        ['Bitcoin stack',                   (function(){ var f = document.getElementById('input-btcStack'); return f && f.value !== '' ? f.value + ' BTC' : '—'; })()],
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

  // PL_A, PL_B, PL_FLOOR, PL_CEIL, plPrice() come from shared/power-law-data.js
  // (loaded before this file via njk page_scripts).
  // GENESIS as a Date object and daysSince() remain local — they're a date-API
  // convention specific to this file's chart math, distinct from the shared
  // module's GENESIS_TS (Unix-timestamp seconds).
  var GENESIS = new Date(Date.UTC(2009, 0, 3)); // Jan 3, 2009 UTC

  // Fallback when the live fetch fails: the latest PL_DATA monthly sample
  // (always fresh after the monthly refresh) rather than a hand-maintained
  // constant that drifts on its own. See shared/power-law-data.js.
  var LIVE_BTC_FALLBACK = PL_DATA[PL_DATA.length - 1][1];

  // Live BTC price — updated once fetchTodayPrice() resolves. Used by
  // renderChart() to anchor the "current trajectory" line (5th dataset).
  // Seeded to the shared TODAY_PRICE (latest sample) so the line renders
  // sensibly before the fetch completes.
  var liveBtcPrice = TODAY_PRICE;

  // Interactive-legend state — which datasets are user-visible. Indices
  // match the chart.data.datasets order: 0=floor, 1=trend, 2=upper,
  // 3=drawdown, 4=current-trajectory, 5=benchmark. Persisted across
  // renderChart() re-runs (every slider change rebuilds datasets, but
  // visibility is a user-intent layer that outlives the redraw).
  var legendVisibility = { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true };

  function daysSince(date) {
    return (date.getTime() - GENESIS.getTime()) / (1000 * 60 * 60 * 24);
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
        btcPoints.push({ x: y, btc: stackBtc, usd: null, phase: 'accum',
          price: price, income: null, btcSold: null,
          dcaAdded: (scenario.monthlyDcaUSD > 0 && price > 0) ? (12 * scenario.monthlyDcaUSD) / price : 0 });
      } else if (y === scenario.retirementYear) {
        // Drawdown line begins here, at the user's stack value at retirement
        // (after any accumulated DCA contributions).
        points.push({ x: y, y: stackBtc * price });
        btcPoints.push({ x: y, btc: stackBtc, usd: stackBtc * price, phase: 'retire',
          price: price, income: null, btcSold: null, dcaAdded: 0 });
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
        btcPoints.push({ x: y, btc: stackBtc, usd: stackBtc * price, phase: 'draw',
          price: price, income: nominalIncome, btcSold: btcNeeded, dcaAdded: 0 });
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
  // with a top-anchored text label. Two-pass implementation so labels can be
  // combined (same x) and stacked vertically (near x) when the user picks a
  // configuration that puts markers close together — e.g. retirement year set
  // to the current year ("Today" + "Retirement (2026)" collide), or a
  // short-horizon scenario where stack depletion is only a year or two after
  // retirement.
  var verticalLinePlugin = {
    id: 'verticalMarkers',
    afterDraw: function(chart) {
      var markers = chart.options.plugins.verticalMarkers && chart.options.plugins.verticalMarkers.lines;
      if (!markers || !markers.length) return;
      var ctx = chart.ctx;
      var xScale = chart.scales.x, yScale = chart.scales.y;
      ctx.save();

      // ─── Pass 1: draw the vertical dashed lines for every marker
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      markers.forEach(function(m) {
        var xPx = xScale.getPixelForValue(m.x);
        ctx.strokeStyle = m.color || 'rgba(236,228,214,0.35)';
        ctx.beginPath();
        ctx.moveTo(xPx, yScale.top);
        ctx.lineTo(xPx, yScale.bottom);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // ─── Pass 2: lay out labels with same-x combining + near-x stacking
      ctx.font = '500 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      var SAME_X_PX = 5;     // labels within 5px of each other → combine
      var H_GAP_PX = 6;       // horizontal breathing room between siblings
      var LINE_HEIGHT = 14;   // vertical step when stacking upward
      var BASELINE_Y = yScale.top - 8;

      // Build label entries (skip markers with no label)
      var entries = [];
      markers.forEach(function(m){
        if (!m.label) return;
        entries.push({
          xPx: xScale.getPixelForValue(m.x),
          text: m.label,
          color: m.labelColor || '#ece4d6'
        });
      });

      // Combine same-x labels into one entry. First label's color wins (it
      // doesn't actually matter much — the combined label reads as a single
      // unit and the colors of the source markers are visible on the chart
      // lines themselves). Separator " · " is a middle dot with thin spaces.
      var combined = [];
      entries.forEach(function(e){
        var match = null;
        for (var i = 0; i < combined.length; i++) {
          if (Math.abs(combined[i].xPx - e.xPx) <= SAME_X_PX) { match = combined[i]; break; }
        }
        if (match) {
          match.text = match.text + ' \u00b7 ' + e.text;
        } else {
          combined.push({ xPx: e.xPx, text: e.text, color: e.color });
        }
      });

      // Sort left-to-right so stacking is deterministic
      combined.sort(function(a, b){ return a.xPx - b.xPx; });

      // For each label, find the lowest stack-row (smallest upward offset)
      // where its horizontal span doesn't overlap any already-placed label.
      // Stacking is upward (yOffset positive means rendered higher up on the
      // canvas); the chart's layout.padding.top has been sized to give room
      // for two stack rows.
      var placed = [];
      combined.forEach(function(e){
        var width = ctx.measureText(e.text).width;
        var left = e.xPx - width / 2;
        var right = e.xPx + width / 2;
        var row = 0;
        while (true) {
          var collides = false;
          for (var i = 0; i < placed.length; i++) {
            var p = placed[i];
            if (p.row !== row) continue;
            if (right + H_GAP_PX < p.left || left - H_GAP_PX > p.right) continue;
            collides = true; break;
          }
          if (!collides) break;
          row++;
          if (row > 3) break; // safety cap; never seen in practice
        }
        placed.push({ xPx: e.xPx, text: e.text, color: e.color, row: row, left: left, right: right });
      });

      // Render
      placed.forEach(function(p){
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.xPx, BASELINE_Y - p.row * LINE_HEIGHT);
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
  // ─── Year-by-year tabular views (below the chart) ──────────────────
  // Two collapsible tables fed by the SAME projectStackOverTime result the
  // chart consumes, so they reconcile to the chart by construction. View B
  // ("watch it grow": value + YoY change + growth bar) and View A ("verify
  // the math": full per-year audit + CSV export). The engine only captures
  // intermediates it already computed — no formula is touched. See
  // retirement-tabular-views-design-doc.md.
  var LAST_STACK = null;
  var LAST_STACK_PAIR = null;                 // { trend: <stack>, current: <stack> } — both bases from the last chart render
  var RT_BASIS = 'trend';                     // 'trend' (mean-reversion, central case) | 'current' (today's discount persists)

  // One-line reminder of the scenario the tables reflect, plus the active
  // price basis — so a reader who's been dragging sliders stays oriented.
  function rtScenarioSummary() {
    var s = SCENARIO;
    return 'Your scenario: <strong>' + s.btcStack.toFixed(2) + ' BTC</strong>' +
      ', retiring in <strong>' + s.retirementYear + '</strong>' +
      ', drawing <strong>' + formatCurrencyShort(s.targetIncomeUSD) + '/yr</strong>' +
      (s.monthlyDcaUSD > 0 ? ' · adding ' + formatCurrencyShort(s.monthlyDcaUSD) + '/mo until then' : '') +
      ' · ' + s.yearsInRetirement + ' yrs in retirement.' +
      ' Price basis: ' + (RT_BASIS === 'current' ? 'today’s discount persists' : 'reverts to trend') + '.';
  }

  function renderRtTables(stack) {
    LAST_STACK = stack;                 // module ref so the CSV button always exports the current scenario
    var rows = stack.btcPoints || [];
    renderVerifyTable(rows, stack.depletionYear);
    renderGrowTable(rows, stack.depletionYear);
    var summary = rtScenarioSummary();
    var gs = document.getElementById('rtGrowSummary');
    var vs = document.getElementById('rtVerifySummary');
    if (gs) gs.innerHTML = summary;
    if (vs) vs.innerHTML = summary;
  }

  function rtPhaseLabel(phase) {
    return phase === 'accum' ? 'Accumulate'
         : phase === 'retire' ? 'Retire'
         : phase === 'draw'   ? 'Draw down'
         : '—';
  }

  // View A — one row per year, every intermediate the projection uses.
  function renderVerifyTable(rows, depletionYear) {
    var tbody = document.getElementById('rtVerifyRows');
    if (!tbody) return;
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var isDeplete = depletionYear != null && r.x >= depletionYear;
      var rowCls = r.phase === 'retire' ? ' class="rt-row-retire"'
                 : (isDeplete ? ' class="rt-row-deplete"' : '');
      var phaseCls = r.phase === 'accum' ? 'rt-phase-accum'
                   : (r.phase === 'draw' ? 'rt-phase-draw' : '');
      // Start-of-year BTC held, backed out of the end-of-year count: undo the
      // year's sale (draw phase) and DCA add (accum phase). General identity,
      // true on every row/phase: held − btcSold + dcaAdded = left (= r.btc).
      var held = r.btc != null ? (r.btc + (r.btcSold || 0) - (r.dcaAdded || 0)) : null;
      html += '<tr' + rowCls + '>'
        + '<td>' + r.x + '</td>'
        + '<td class="' + phaseCls + '">' + rtPhaseLabel(r.phase) + '</td>'
        + '<td class="rt-num">' + (r.price  != null ? formatCurrencyShort(r.price)  : '—') + '</td>'
        + '<td class="rt-num">' + (held     != null ? held.toFixed(2)               : '—') + '</td>'
        + '<td class="rt-num">' + (r.usd    != null ? formatCurrencyShort(r.usd)    : '—') + '</td>'
        + '<td class="rt-num">' + (r.income != null ? formatCurrencyShort(r.income) : '—') + '</td>'
        + '<td class="rt-num">' + (r.btcSold != null ? r.btcSold.toFixed(3)         : '—') + '</td>'
        + '<td class="rt-num">' + (r.btc    != null ? r.btc.toFixed(2)              : '—') + '</td>'
        + '</tr>';
    }
    tbody.innerHTML = html;
  }

  // View B — dollar value + year-over-year change + proportional growth bar.
  // Starts at the retirement year (pre-retirement rows have usd===null) so the
  // year-over-year "change" is meaningful.
  function renderGrowTable(rows, depletionYear) {
    var tbody = document.getElementById('rtGrowRows');
    var tfoot = document.getElementById('rtGrowResult');
    if (!tbody) return;
    var valued = [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].usd != null) valued.push(rows[i]);
    }
    var maxUsd = 0;
    for (var j = 0; j < valued.length; j++) {
      if (valued[j].usd > maxUsd) maxUsd = valued[j].usd;
    }
    var html = '';
    var anyShrank = false;
    for (var k = 0; k < valued.length; k++) {
      var r = valued[k];
      var isDeplete = depletionYear != null && r.x >= depletionYear;
      var rowCls = r.phase === 'retire' ? ' class="rt-row-retire"'
                 : (isDeplete ? ' class="rt-row-deplete"' : '');
      var changeCell, grew;
      if (k === 0) {
        changeCell = '<span class="rt-change-flat">start</span>';
        grew = true;
      } else {
        var delta = r.usd - valued[k - 1].usd;
        if (delta > 0) {
          changeCell = '<span class="rt-change-up">▲ ' + formatCurrencyShort(delta) + '</span>';
          grew = true;
        } else if (delta < 0) {
          changeCell = '<span class="rt-change-down">▼ ' + formatCurrencyShort(-delta) + '</span>';
          grew = false;
          anyShrank = true;
        } else {
          changeCell = '<span class="rt-change-flat">—</span>';
          grew = true;
        }
      }
      var pct = maxUsd > 0 ? (r.usd / maxUsd * 100) : 0;
      html += '<tr' + rowCls + '>'
        + '<td>' + r.x + '</td>'
        + '<td class="rt-num">' + formatCurrencyShort(r.usd) + '</td>'
        + '<td class="rt-num">' + changeCell + '</td>'
        + '<td class="rt-bar-col"><span class="rt-bar-track">'
        +   '<span class="rt-bar-fill ' + (grew ? 'grew' : 'shrank') + '" style="width:' + pct.toFixed(1) + '%"></span>'
        + '</span></td>'
        + '</tr>';
    }
    tbody.innerHTML = html;
    if (tfoot) {
      if (depletionYear != null) {
        tfoot.innerHTML = '<tr><td colspan="4" class="rt-result-deplete">Depletes in ' + depletionYear + '</td></tr>';
      } else {
        var msg = anyShrank ? 'Ended above where it started — escape velocity'
                            : 'Escape velocity — grew every year';
        tfoot.innerHTML = '<tr><td colspan="4" class="rt-result-escape">' + msg + '</td></tr>';
      }
    }
  }

  // CSV export — provenance header (the assumptions that produced the table)
  // then one line per year. Reuses SCENARIO + the same ModelingAssumptions the
  // render path reads, so the export matches exactly what's on screen.
  function buildRtCsv(stack) {
    var s = SCENARIO;
    var growth = window.ModelingAssumptions.get('btcGrowthModel');
    var inflation = window.ModelingAssumptions.get('inflation');
    var lines = [];
    lines.push('# Last Coin Standing — Retirement projection');
    lines.push('# Bitcoin stack,' + s.btcStack + ' BTC');
    lines.push('# Retirement year,' + s.retirementYear);
    lines.push('# Target annual income,' + s.targetIncomeUSD);
    lines.push('# Years in retirement,' + s.yearsInRetirement);
    lines.push('# Monthly DCA,' + s.monthlyDcaUSD);
    lines.push('# Growth model,' + growth.preset);
    lines.push('# Inflation,' + inflation.value + '%');
    lines.push('# Price assumption,' + (RT_BASIS === 'current' ? "today's discount persists" : 'reverts to trend'));
    lines.push('# Live scenario URL,' + window.location.href);
    lines.push('');
    lines.push('Year,Phase,BTC price,BTC held (start),Stack value USD,Income drawn USD,BTC sold,BTC left');
    (stack.btcPoints || []).forEach(function (r) {
      var heldStart = r.btc != null ? (r.btc + (r.btcSold || 0) - (r.dcaAdded || 0)) : null;
      lines.push([r.x, r.phase,
        r.price != null ? Math.round(r.price) : '',
        heldStart != null ? heldStart.toFixed(4) : '',
        r.usd != null ? Math.round(r.usd) : '',
        r.income != null ? Math.round(r.income) : '',
        r.btcSold != null ? r.btcSold.toFixed(6) : '',
        r.btc != null ? r.btc.toFixed(4) : ''
      ].join(','));
    });
    return lines.join('\n');
  }

  function rtFallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  // Accordion — one table open at a time. Clicking an open trigger collapses
  // it (all closed); clicking a closed one closes the other and opens it.
  function wireRtAccordion() {
    var items = [
      { btn: 'rtGrowToggle',   body: 'rtGrowBody'   },
      { btn: 'rtVerifyToggle', body: 'rtVerifyBody' }
    ];
    items.forEach(function (it) {
      var btn = document.getElementById(it.btn), body = document.getElementById(it.body);
      if (!btn || !body) return;
      btn.addEventListener('click', function () {
        var willOpen = btn.getAttribute('aria-expanded') !== 'true';
        items.forEach(function (other) {
          var ob = document.getElementById(other.btn), obody = document.getElementById(other.body);
          if (ob && obody) { ob.setAttribute('aria-expanded', 'false'); obody.hidden = true; }
        });
        if (willOpen) { btn.setAttribute('aria-expanded', 'true'); body.hidden = false; }
      });
    });
  }

  // Price-assumption toggle — selects which already-computed projection the
  // tables render (trend vs. today's-discount-persists). No new math; just
  // re-renders from LAST_STACK_PAIR. Buttons in both panels stay in sync.
  function wireRtBasis() {
    var btns = document.querySelectorAll('.rt-basis-btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        RT_BASIS = b.getAttribute('data-basis');
        document.querySelectorAll('.rt-basis-btn').forEach(function (x) {
          x.classList.toggle('is-active', x.getAttribute('data-basis') === RT_BASIS);
        });
        if (LAST_STACK_PAIR) renderRtTables(LAST_STACK_PAIR[RT_BASIS]);
      });
    });
  }

  function wireRtCsv() {
    var btn = document.getElementById('rtCsvBtn');
    if (!btn) return;
    var originalHtml = btn.innerHTML;
    btn.addEventListener('click', function () {
      if (!LAST_STACK) return;
      var csv = buildRtCsv(LAST_STACK);
      var restore = function () {
        btn.classList.add('copied');
        btn.textContent = 'Copied ✓';
        setTimeout(function () { btn.classList.remove('copied'); btn.innerHTML = originalHtml; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(csv).then(restore).catch(function () { rtFallbackCopy(csv); restore(); });
      } else {
        rtFallbackCopy(csv); restore();
      }
    });
  }

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

    // Apply user-selected legend visibility to the freshly rebuilt datasets.
    // Slider changes call renderChart() which rebuilds this array from scratch,
    // so the user's toggle state would reset on every interaction without this
    // step. Hidden datasets remain in the array (so the y-axis bounds below
    // stay stable across toggles) — they just won't draw.
    for (var vIdx = 0; vIdx < datasets.length; vIdx++) {
      if (legendVisibility[vIdx] === false) datasets[vIdx].hidden = true;
    }

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

    // Year-by-year tables read the SAME stack object — placed before the
    // chart-update branch so they render on both the update and initial-
    // create paths (the update path returns early below). Store BOTH
    // already-computed bases so the price-assumption toggle can switch the
    // tables without a chart recompute; render whichever is active.
    LAST_STACK_PAIR = { trend: stack, current: currentTrajectory };
    renderRtTables(LAST_STACK_PAIR[RT_BASIS]);

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
        layout: { padding: { top: 52, right: 8 } },
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

    // ─── Today's-price caption beneath the projection chart (matches the
    // Channel's "Today's bitcoin price: …" treatment so the two pages read
    // as siblings). Updates whenever fetchTodayPrice resolves, even if the
    // existing status-badge elements below this block aren't present.
    var todayTrend = plPriceAtDate(new Date());
    var ratio = (todayTrend > 0) ? currentPrice / todayTrend : 0;
    (function updateChartTodayCaption() {
      var spotEl  = document.getElementById('retireTodaySpot');
      var multEl  = document.getElementById('retireTodayMult');
      var zoneEl  = document.getElementById('retireTodayZone');
      var trendEl = document.getElementById('retireTodayTrend');
      if (!spotEl || !multEl) return;
      function fmtUsdShort(v) {
        if (v >= 1e6)  return '$' + (v / 1e6).toFixed(2) + 'M';
        if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'K';
        return '$' + Math.round(v).toLocaleString();
      }
      spotEl.textContent = fmtUsdShort(currentPrice);
      multEl.textContent = ratio.toFixed(2) + '\u00d7';
      if (zoneEl) {
        var zone;
        if (ratio < 0.42)     zone = '\u00b7 below floor';
        else if (ratio < 1.0) zone = '\u00b7 within Floor \u2192 Trend zone';
        else if (ratio < 3.0) zone = '\u00b7 within Trend \u2192 Upper zone';
        else                  zone = '\u00b7 above upper band';
        zoneEl.textContent = zone;
      }
      if (trendEl) trendEl.textContent = fmtUsdShort(todayTrend);
    })();

    var priceEl = document.getElementById('statusPrice');
    var ratioEl = document.getElementById('statusRatio');
    var pctEl = document.getElementById('statusPercentile');
    if (!priceEl || !ratioEl) return;
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
    // Shared helper: one CoinGecko call + consistent fallback site-wide.
    fetchTodayPrice(function(price, source){
      updateStatusLine(price, source);
      scheduleRender();
    });
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
    { key: 'targetIncomeUSD',   parse: parseInt,   fmt: function(v){ return '$' + Math.round(v).toLocaleString(); }, updates: 'rate',   min: 20000, max: 1000000 },
    { key: 'retirementYear',    parse: parseInt,   fmt: function(v){ return String(v); },                            updates: 'rate',   min: 2026,  max: 2070 },
    { key: 'btcStack',          parse: parseFloat, fmt: function(v){ return v.toFixed(2); },                         updates: 'rate',   min: 0,     max: 99.99 },
    { key: 'withdrawalRatePct', parse: parseFloat, fmt: function(v){ return v.toFixed(1) + '%'; },                   updates: 'income', min: 2,     max: 15 },
    { key: 'monthlyDcaUSD',     parse: parseInt,   fmt: function(v){ return '$' + Math.round(v).toLocaleString() + '/mo'; }, updates: 'rate', min: 0, max: 5000 },
    { key: 'yearsInRetirement', parse: parseInt,   fmt: function(v){ return v + ' yrs'; },                           updates: null,     min: 10,    max: 50 }
  ];
  var SLIDER_BY_KEY = {};
  SLIDER_CONFIG.forEach(function(c){ SLIDER_BY_KEY[c.key] = c; });

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Update both the slider input (thumb position) and the value-display
  // for a given key. Used when coupling adjusts a slider programmatically.
  // Also used for keys that have a value display but no slider input —
  // i.e. derived-readouts like withdrawalRatePct after the 2026-05-29
  // rate-as-derived migration. In that case the input lookup misses
  // gracefully and only the valEl is updated.
  function syncSliderUI(key) {
    var cfg = SLIDER_BY_KEY[key];
    if (!cfg) return;
    var input = document.getElementById('slider-' + key);
    if (input) input.value = SCENARIO[key];
    // Editable numeric display (btcStack) — write to the text input unless
    // it's focused (guard prevents reformatting/jumping the caret mid-type).
    var editable = document.getElementById('input-' + key);
    if (editable) {
      if (document.activeElement !== editable) editable.value = cfg.fmt(SCENARIO[key]);
      return;
    }
    var valEl = document.getElementById('val-' + key);
    if (valEl) valEl.textContent = cfg.fmt(SCENARIO[key]);
  }

  // ─── URL ⇄ SCENARIO sync — shareable scenario state
  // Same schema as the sibling-page carry-over (see SITE_GUIDE §17.5).
  // The page URL becomes the canonical address of any configuration the
  // user has dialed in: copying the address bar gives a link that, when
  // opened, reproduces the exact slider state.
  //
  // Reader runs once at init (before sliders are wired) so SCENARIO is
  // populated from the URL before any DOM sync. Writer fires after every
  // slider change, debounced ~220ms so drags don't spam history. Defaults
  // are omitted from the URL — a clean `/the-bitcoin-retirement` represents
  // the default scenario, and only the user's deviations show up as params.
  //
  // Baseline assumptions (inflation, growth model, real returns) live in
  // localStorage via ModelingAssumptions and are deliberately out of scope
  // — per §17.5, the URL covers only page-local Retirement state.
  var SCENARIO_URL_MAP = {
    stack:    { key: 'btcStack',          isInt: false, decimals: 2 },
    retire:   { key: 'retirementYear',    isInt: true },
    income:   { key: 'targetIncomeUSD',   isInt: true },
    years:    { key: 'yearsInRetirement', isInt: true },
    dca:      { key: 'monthlyDcaUSD',     isInt: true },
    withdraw: { key: 'withdrawalRatePct', isInt: false, decimals: 1 }
  };
  // Snapshot the as-built defaults so the writer can omit unchanged values.
  // Deep clone via JSON round-trip — SCENARIO holds only primitives so this
  // is safe and concise.
  var SCENARIO_DEFAULTS_SNAPSHOT = JSON.parse(JSON.stringify(SCENARIO));

  // Reader: parses URL search params, validates against slider min/max,
  // applies clamped values to SCENARIO. Called once at init, before the
  // sliders are wired so the DOM sync inside wireSliders() picks up the
  // URL-provided values.
  function readUrlParamsIntoScenario() {
    if (!window.URLSearchParams) return;
    var params = new URLSearchParams(window.location.search);
    Object.keys(SCENARIO_URL_MAP).forEach(function(p){
      if (!params.has(p)) return;
      var raw = params.get(p);
      var num = parseFloat(raw);
      if (!isFinite(num)) return;
      var entry = SCENARIO_URL_MAP[p];
      var cfg = SLIDER_BY_KEY[entry.key];
      if (!cfg) return;
      var clamped = clamp(num, cfg.min, cfg.max);
      if (entry.isInt) clamped = Math.round(clamped);
      else clamped = Math.round(clamped * 10) / 10; // 1-decimal step precision
      SCENARIO[entry.key] = clamped;
    });
  }

  // Writer: serializes SCENARIO into URL query string via replaceState
  // (no history pollution, no scroll, no re-load). Debounced through
  // scheduleUrlSync below.
  //
  // `withdraw` is intentionally skipped in the writer even though the reader
  // accepts it: the rate is a *derived* value (income / stack-at-retirement,
  // post-reconcile) and including it would produce URL cruft like
  // `?withdraw=6.7` on a fresh page load. The receiver reproduces the rate
  // from income+stack+baselines locally, which is the more honest behavior
  // anyway when baselines may differ between sender and receiver.
  function syncUrlFromScenario() {
    if (!window.URLSearchParams || !window.history || !window.history.replaceState) return;
    var params = new URLSearchParams(window.location.search);
    Object.keys(SCENARIO_URL_MAP).forEach(function(p){
      if (p === 'withdraw') { params.delete(p); return; }
      var entry = SCENARIO_URL_MAP[p];
      var val = SCENARIO[entry.key];
      var defVal = SCENARIO_DEFAULTS_SNAPSHOT[entry.key];
      // Round to slider step precision before comparing to default — coupling
      // math can produce non-step floats that would otherwise never match.
      var rounded = entry.isInt ? Math.round(val) : Math.round(val * 10) / 10;
      if (rounded === defVal) {
        params.delete(p);
      } else {
        params.set(p, entry.isInt ? String(rounded) : rounded.toFixed(entry.decimals || 1));
      }
    });
    var qs = params.toString();
    var newUrl = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  }
  var _urlSyncTimer = null;
  function scheduleUrlSync() {
    if (_urlSyncTimer) clearTimeout(_urlSyncTimer);
    _urlSyncTimer = setTimeout(syncUrlFromScenario, 220);
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

    // Stack value line under the input — today → at retirement (reuses
    // existing values: liveBtcPrice for today, stackReal for at-retirement,
    // the same figure feeding the Sustainability readout above).
    var todayVal = SCENARIO.btcStack * liveBtcPrice;
    var elToday  = document.getElementById('stackValToday');
    var elAtRet  = document.getElementById('stackValAtRet');
    if (elToday) elToday.textContent = formatCurrencyShort(todayVal);
    if (elAtRet) elAtRet.textContent = formatCurrencyShort(stackReal);

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
      if (!input) return;
      // Sync initial display from SCENARIO state. syncSliderUI handles both
      // the static val-<key> spans and btcStack's editable input-<key>, so
      // we no longer require a val-<key> element to exist (btcStack dropped
      // its span in favour of the editable field).
      input.value = SCENARIO[cfg.key];
      syncSliderUI(cfg.key);
      input.addEventListener('input', function(){
        var v = cfg.parse(input.value);
        SCENARIO[cfg.key] = v;
        syncSliderUI(cfg.key);
        // Coupling: update the partner slider (income↔rate)
        if (cfg.updates === 'rate') recomputeCoupledFromIncomeOrMeans();
        else if (cfg.updates === 'income') recomputeCoupledFromRate();
        scheduleRender();
        scheduleUrlSync();
      });
    });
    wireStackInput();
  }

  // Editable Bitcoin-stack field (input-btcStack) — precision entry that
  // mirrors the btcStack slider's exact update path so the field and slider
  // stay behaviorally identical. Typing snaps the slider thumb; blur/Enter
  // reformat to two decimals. The slider's own 'input' handler updates this
  // field live via syncSliderUI (skipped while the field is focused).
  function wireStackInput() {
    var field = document.getElementById('input-btcStack');
    if (!field) return;
    var cfg = SLIDER_BY_KEY['btcStack'];

    function commit(reformat) {
      var raw = field.value.replace(/[^0-9.]/g, '');
      var parsed = parseFloat(raw);
      var valid = isFinite(parsed);
      field.classList.toggle('invalid', !valid && raw !== '');
      if (!valid) {
        // Non-numeric mid-type → keep the last valid scenario value. On
        // blur/Enter, coerce an empty-or-garbage field to 0.00.
        if (reformat) {
          SCENARIO.btcStack = 0;
          var slider0 = document.getElementById('slider-btcStack');
          if (slider0) slider0.value = 0;
          if (cfg.updates === 'rate') recomputeCoupledFromIncomeOrMeans();
          else if (cfg.updates === 'income') recomputeCoupledFromRate();
          scheduleRender();
          scheduleUrlSync();
          field.classList.remove('invalid');
          field.value = cfg.fmt(0);
        }
        return;
      }
      var v = Math.round(clamp(parsed, cfg.min, cfg.max) * 100) / 100;  // 0…99.99, 2dp snap
      SCENARIO.btcStack = v;
      var slider = document.getElementById('slider-btcStack');
      if (slider) slider.value = v;
      // Same update path a slider change runs (coupling + render + URL write).
      if (cfg.updates === 'rate') recomputeCoupledFromIncomeOrMeans();
      else if (cfg.updates === 'income') recomputeCoupledFromRate();
      scheduleRender();
      scheduleUrlSync();
      if (reformat) field.value = cfg.fmt(v);
    }

    field.addEventListener('input',   function(){ commit(false); });
    field.addEventListener('blur',    function(){ commit(true);  });
    field.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ commit(true); field.blur(); } });
  }

  // ─── Re-render chart when inflation or growth model changes
  if (window.ModelingAssumptions.subscribe) {
    window.ModelingAssumptions.subscribe(function(dim){
      if (dim === 'inflation' || dim === 'btcGrowthModel' || dim === 'realReturns' || dim === '*') {
        scheduleRender();
      }
    });
  }

  // ─── Interactive legend wiring
  // Each .legend-item has a data-dataset-idx mapping to its position in the
  // chart.data.datasets array. Click or Enter/Space toggles visibility on
  // both sides — the chart hides the dataset via setDatasetVisibility(),
  // and the row gets a .off class for the dimmed visual treatment.
  // Help-tip clicks inside a legend item are excluded (they have their own
  // hover/focus behavior — the ? should never toggle the line).
  function wireLegendToggles() {
    var items = document.querySelectorAll('.projection-legend .legend-item[data-dataset-idx]');
    items.forEach(function(item){
      function toggle() {
        var idx = parseInt(item.getAttribute('data-dataset-idx'), 10);
        if (isNaN(idx)) return;
        var nowVisible = !legendVisibility[idx];
        legendVisibility[idx] = nowVisible;
        item.classList.toggle('off', !nowVisible);
        item.setAttribute('aria-pressed', nowVisible ? 'true' : 'false');
        if (chart) {
          chart.setDatasetVisibility(idx, nowVisible);
          chart.update('none');
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

  // ─── Initial run
  // 1. Apply URL params to SCENARIO (if any) — must happen BEFORE wireSliders
  //    so input.value gets the URL-provided values when the DOM syncs from
  //    SCENARIO inside wireSliders().
  readUrlParamsIntoScenario();
  wireSliders();
  // 2. Reconcile defaults: income held; derive withdrawal rate from current
  //    stack-at-retirement so the visible values are internally consistent.
  //    Runs unconditionally — the URL transmits user-set inputs (stack,
  //    income, years, dca); the rate is derived locally so a receiver with
  //    different baseline assumptions sees a self-consistent rate display.
  recomputeCoupledFromIncomeOrMeans();
  renderChart();
  wireLegendToggles();
  wireRtAccordion();
  wireRtBasis();
  wireRtCsv();
  updateSustainability();
  fetchLiveBtcPrice();
  // 3. Normalize the URL — drops any out-of-range or unrecognized params,
  //    ensures the address bar reflects the actual rendered state. Runs
  //    immediately (not via scheduleUrlSync) so the URL is correct from
  //    the first frame.
  syncUrlFromScenario();
})();

/* ════════════════════════════════════════════════════════════════
   Smitty-style static viz on the Question tab — §3.1
   ════════════════════════════════════════════════════════════════
   "BTC needed to retire on $100K/year, by retirement year, under
   Power Law trend price." Pedagogical scaffolding for the user
   before they reach the Calculator tab. Read the answer; no
   sliders here. The interactive version of this same math lives
   on the Calculator tab next door.

   Math
     principal_needed = $100K / 0.04            (4% rule)
                      = $2,500,000
     btc_needed(year) = principal_needed
                      / plPrice(days_since_genesis(Jan 1 of year))

   PL_A, PL_B, GENESIS_TS, and plPrice() are globals provided by
   shared/power-law-data.js (loaded before this file via the .njk
   page_scripts include).

   Render timing
     The Question tab is not default-active — Chart.js can't size
     a canvas whose parent has display:none. So we render on the
     first activation of the tab, either via the hash deep-link
     handler in the tab-switching IIFE at the top of this file
     (which runs before this block on load), or via tab-button
     click. Once rendered, the chart is static; no re-renders.
═══════════════════════════════════════════════════════════════════ */

(function() {
  var canvas = document.getElementById('smittyChart');
  if (!canvas || typeof Chart === 'undefined' || typeof plPrice !== 'function') return;

  var rendered = false;

  function render() {
    if (rendered) return;

    // Canvas must be visible (non-zero offsetWidth) before Chart.js can
    // size it correctly. If the tab is still mid-activation, defer one
    // animation frame to let layout settle.
    if (canvas.offsetWidth === 0) {
      requestAnimationFrame(render);
      return;
    }
    rendered = true;

    var SMITTY_PRINCIPAL = 2500000;  // $100K / 4% rule
    var todayYear = (new Date()).getFullYear();
    var endYear = todayYear + 30;

    // Build the BTC-needed curve, one point per year
    var data = [];
    for (var y = todayYear; y <= endYear; y++) {
      var d = new Date(y, 0, 1);
      var daysSinceGenesis = (d.getTime() / 1000 - GENESIS_TS) / 86400;
      var trendPrice = plPrice(daysSinceGenesis);
      data.push({ x: y, y: SMITTY_PRINCIPAL / trendPrice });
    }

    // Anchor years: today, +10, +20, +30. Each gets a dot + "X BTC" label.
    var anchorYears = [todayYear, todayYear + 10, todayYear + 20, todayYear + 30];
    var anchors = [];
    anchorYears.forEach(function(y) {
      for (var i = 0; i < data.length; i++) {
        if (data[i].x === y) { anchors.push({ x: y, btc: data[i].y }); break; }
      }
    });

    // Custom plugin: anchor dots + labels, mirrors the btcCountPlugin
    // pattern used on the projection chart upstream in this file.
    var anchorPlugin = {
      id: 'smittyAnchors',
      afterDatasetsDraw: function(chart) {
        var ctx = chart.ctx;
        var xScale = chart.scales.x, yScale = chart.scales.y;
        ctx.save();
        anchors.forEach(function(a, idx) {
          var xPx = xScale.getPixelForValue(a.x);
          var yPx = yScale.getPixelForValue(a.btc);
          // Amber dot on the line
          ctx.fillStyle = '#E09422';
          ctx.beginPath();
          ctx.arc(xPx, yPx, 4, 0, 2 * Math.PI);
          ctx.fill();
          // Label: BTC count + year. Each anchor is its own scenario; the
          // explicit year-in-label is the strongest defense against the
          // visual misreading as a single-stack drawdown.
          // Edge anchors use left/right alignment so labels stay inside
          // the plot area rather than overflowing the canvas.
          var btcText = a.btc >= 1
            ? a.btc.toFixed(1) + ' BTC'
            : a.btc.toFixed(2) + ' BTC';
          ctx.textAlign = (idx === 0) ? 'left'
                        : (idx === anchors.length - 1) ? 'right'
                        : 'center';
          ctx.fillStyle = '#ece4d6';
          ctx.font = '500 12px Inter, sans-serif';
          ctx.fillText(btcText, xPx, yPx - 11);
        });
        ctx.restore();
      }
    };

    var ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'BTC needed',
          data: data,
          parsing: false,
          borderColor: '#E09422',
          backgroundColor: 'rgba(224,148,34,0.10)',
          borderWidth: 2,
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        parsing: false,
        animation: { duration: 0 },
        layout: { padding: { top: 28, right: 40, bottom: 4, left: 8 } },
        scales: {
          x: {
            type: 'linear',
            min: todayYear,
            max: endYear,
            title: {
              display: true,
              text: 'Retirement year',
              color: '#8a8275',
              font: { family: 'Inter, sans-serif', size: 11, weight: '500' },
              padding: { top: 8 }
            },
            grid: { color: 'rgba(224,148,34,0.04)' },
            ticks: {
              color: '#7a7367',
              font: { family: 'Inter, sans-serif', size: 11 },
              stepSize: 5,
              callback: function(v) { return Math.round(v); }
            }
          },
          y: {
            type: 'logarithmic',
            min: 0.04,
            max: 30,
            title: {
              display: true,
              text: 'BTC needed at trend price',
              color: '#8a8275',
              font: { family: 'Inter, sans-serif', size: 11, weight: '500' }
            },
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: {
              color: '#7a7367',
              font: { family: 'Inter, sans-serif', size: 11 },
              callback: function(v) {
                // Label only powers of ten — log scale gets noisy otherwise
                var log = Math.log10(v);
                if (Math.abs(log - Math.round(log)) > 0.001) return '';
                if (v >= 1) return v + ' BTC';
                return v.toFixed(Math.abs(log)) + ' BTC';
              }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      },
      plugins: [anchorPlugin]
    });
  }

  // Render if the Question tab is already active at page load (hash deep-link).
  function tryRenderIfActive() {
    var pane = document.getElementById('tab-question');
    if (pane && pane.classList.contains('active')) render();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryRenderIfActive);
  } else {
    tryRenderIfActive();
  }

  // First click on the Question tab button triggers the render.
  document.querySelectorAll('.tab-btn[data-tab="question"]').forEach(function(btn) {
    btn.addEventListener('click', render);
  });
})();


// ═══════ SCENARIO CARRY-OVER ═══════
// Sender side of the URL-param scenario carry-over (receiver lives on
// /borrowing-against-your-stack; future DR-page implementation will
// read the same schema). Updates the two teaser links at the bottom
// of the Strategies tab so each carries the current Retirement
// scenario as URL query params — when the user clicks through, the
// sibling page can pre-populate its inputs from the URL instead of
// re-asking.
//
// Schema (canonical — see SITE_GUIDE §17.5):
//   stack     BTC stack (decimal)
//   retire    retirement year (4-digit)
//   income    target annual income USD
//   years     years in retirement (integer)
//   dca       monthly DCA USD
//   withdraw  withdrawal rate %
//
// Baseline assumptions (inflation preset, growth model, real-returns
// preset) live in localStorage via ModelingAssumptions and carry
// across pages automatically — no URL-param help needed.
//
// Implementation notes:
//   - Reads slider values directly from the DOM (not from any closure-
//     scoped SCENARIO state) so this IIFE is self-contained and doesn't
//     need to be wired into the chart IIFE above.
//   - On every input event on any of the six sliders, all matching
//     teaser links update their href in place.
//   - Any href base path is preserved; only the query string is
//     rewritten. Existing hash fragments are dropped (none in current
//     usage; explicit comment so future me knows it was intentional).
(function(){
  var SLIDER_TO_PARAM = {
    'slider-btcStack':           'stack',
    'slider-retirementYear':     'retire',
    'slider-targetIncomeUSD':    'income',
    'slider-yearsInRetirement':  'years',
    'slider-monthlyDcaUSD':      'dca'
    // slider-withdrawalRatePct removed 2026-05-29 — rate is now a
    // derived readout, not a draggable input. The 'withdraw' URL param
    // remains accepted by readUrlParamsIntoScenario for back-compat
    // (silently overwritten by the income-driven recompute on init).
  };

  // Selectors for the teaser links — match by href prefix so we don't
  // need to add class hooks to the HTML. Both teasers live in the
  // Strategies tab's strategy-C and strategy-D sections.
  var TEASER_SELECTORS = [
    'a[href^="/borrowing-against-your-stack"]',
    'a[href^="/disciplined-rebalancing"]'
  ];

  function buildQueryString() {
    var params = new URLSearchParams();
    Object.keys(SLIDER_TO_PARAM).forEach(function(id){
      var el = document.getElementById(id);
      if (el && el.value !== '') {
        params.set(SLIDER_TO_PARAM[id], el.value);
      }
    });
    return params.toString();
  }

  function updateLinks() {
    var qs = buildQueryString();
    TEASER_SELECTORS.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(link){
        var href = link.getAttribute('href') || '';
        var base = href.split('?')[0].split('#')[0];
        link.setAttribute('href', qs ? (base + '?' + qs) : base);
      });
    });
  }

  function wireSliders() {
    Object.keys(SLIDER_TO_PARAM).forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateLinks);
    });
    updateLinks();  // initial run so links are populated immediately
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireSliders);
  } else {
    wireSliders();
  }
})();


// ═══════ SHARE THIS SCENARIO ═══════
// Discoverable share affordance with two functionally-distinct groups:
//
//   1. SHARE THIS SCENARIO (scenario URL — includes ?stack=&income=&…):
//      Copy link, Native share. These are the surfaces typically used
//      for direct messaging where you want the receiver to see exactly
//      what you configured.
//
//   2. SHARE THE CALCULATOR (generic page URL — no query params):
//      X, LinkedIn, Facebook. Default to public posts where the user
//      probably doesn't want their personal numbers broadcast — and
//      where a clean URL invites the receiver to explore their own.
//
// A user who DOES want to publish their scenario to social can still
// copy the link and paste into a tweet manually. Keeping that one extra
// step is worth it to protect users from accidentally publishing their
// retirement target income or BTC stack to their followers.
//
// The IIFE is self-contained; no closure dependencies on the chart IIFE.
// Pattern intended for reuse on other calculator pages: lift this block
// plus the matching markup + CSS and it works as-is (the markup IDs are
// the only contract).
(function(){
  // Default copy/text for social-intent links. Kept short — the OG card
  // (set at build time per the page's head fragment) carries the rich
  // preview on platforms that fetch it. Twitter/X uses the text param
  // for the tweet body alongside the URL; LinkedIn and Facebook largely
  // ignore text and lean on the OG metadata.
  var SHARE_TITLE = 'What does a bitcoin retirement look like?';

  // The current URL — includes any ?stack=&income=&... scenario state.
  // Used by Copy link and Native share (typically private-channel sharing
  // where the receiver should see the sender's exact configuration).
  function currentUrl() {
    return window.location.href;
  }

  // The generic page URL — strips query params, preserves hash (#tab).
  // Used by the social-platform buttons (X / LinkedIn / Facebook) so
  // public posts don't broadcast the user's personal slider values.
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

  // Fallback for browsers without async-clipboard support (older Safari,
  // some legacy contexts, or when the page is loaded over insecure http).
  // Uses the deprecated execCommand path through a temporary textarea.
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
      var url = currentUrl(); // scenario-laden — this is the personal-share path
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

  // Binds a social-intent button. urlGetter is one of currentUrl /
  // genericPageUrl — the caller decides which URL flavor the platform
  // should receive. urlBuilder wraps that URL in the platform's share
  // intent endpoint.
  function bindIntentButton(id, urlGetter, urlBuilder) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var shareUrl = urlBuilder(urlGetter());
      // Popup-sized window for the social composer — falls back to a new
      // tab if the browser doesn't honor the size hints (common on mobile).
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=620,height=540');
    });
  }

  function bindNativeShare() {
    var btn = document.getElementById('shareNative');
    if (!btn || !navigator.share) return;
    btn.hidden = false;
    btn.addEventListener('click', function(){
      navigator.share({
        title: 'Bitcoin retirement projection',
        text: SHARE_TITLE,
        url: currentUrl() // scenario-laden — same intent as Copy link
      }).catch(function(){
        // User cancelled or share failed — no-op (intentional silent).
      });
    });
  }

  function wireShareSection() {
    if (!document.getElementById('shareSection')) return;
    bindCopy();
    bindNativeShare();
    // Social buttons share the GENERIC page URL — see top-of-IIFE comment.
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
