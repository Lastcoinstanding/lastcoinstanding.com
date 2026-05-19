/* ============================================================
   Living on Bitcoin — Calculator, chart, and tab routing
   ============================================================
   Tab structure mirrors BAS/Retirement (4 tabs: Question, Tools,
   Calculator, Math). The Calculator is the central deliverable.

   The math:
     - Strategy A (cash baseline) holds B in dollars; no growth.
     - Strategy B (LoB) holds B as BTC; compounds at growth rate r.
     - Monthly conversions (M out, M back in) generate fees and tax events.
     - Under HIFO with monthly cadence, sold-lot holding period is short,
       so per-dollar gain ≈ r/12 and annual gain ≈ M*r.
     - De-minimis toggle zeros out tax events under PARITY-style threshold.
     - Drawdown stress test applies -50% shock at chosen year, with recovery.

   See the Math tab for the full specification and what's not modelled.
   ============================================================ */


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
      window.scrollTo({top: 0, behavior: 'smooth'});
    });
  });

  // Cross-tab links (e.g. "see the Calculator" inside Question prose)
  document.querySelectorAll('.tab-jump').forEach(function(link){
    link.addEventListener('click', function(e){
      var target = link.dataset.tabTarget;
      if(!target) return;
      e.preventDefault();
      var btn = document.querySelector('.tab-btn[data-tab="' + target + '"]');
      if(btn) btn.click();
    });
  });

  // Honor URL hash on load
  var hash = location.hash.replace('#','');
  if(hash){
    var target = document.querySelector('[data-tab="' + hash + '"]');
    if(target) target.click();
  }
})();


// ═══════ CALCULATOR ═══════
(function(){
  var floatSlider     = document.getElementById('slider-floatHeldUSD');
  if(!floatSlider) return; // page not present

  var monthlyBills    = document.getElementById('slider-monthlyBillsUSD');
  var horizonSlider   = document.getElementById('slider-horizonYears');
  var feeSlider       = document.getElementById('slider-feePctPerSide');
  var capGainsSlider  = document.getElementById('slider-capGainsPct');
  var deMinimisToggle = document.getElementById('slider-deMinimisOn');
  var drawdownSlider  = document.getElementById('slider-drawdownYear');

  // Value-display elements
  var valFloat     = document.getElementById('val-floatHeldUSD');
  var valBills     = document.getElementById('val-monthlyBillsUSD');
  var valHorizon   = document.getElementById('val-horizonYears');
  var valFee       = document.getElementById('val-feePctPerSide');
  var valCapGains  = document.getElementById('val-capGainsPct');
  var valDeMinimis = document.getElementById('val-deMinimisOn');
  var valDrawdown  = document.getElementById('val-drawdownYear');

  // Projection display elements (replaces former btcGrowthSlider)
  var projectionCAGR   = document.getElementById('projection-cagr');
  var projectionDetail = document.getElementById('projection-detail');

  // Output elements
  var elHorizonYears        = document.getElementById('lobHorizonYears');
  var elDifferential        = document.getElementById('lobDifferential');
  var elFeesInline          = document.getElementById('lobFeesInline');
  var elTaxesInline         = document.getElementById('lobTaxesInline');
  var elBreakdownHorizon    = document.getElementById('lobBreakdownHorizon');
  var elFeesTotal           = document.getElementById('lobFeesTotal');
  var elTaxesTotal          = document.getElementById('lobTaxesTotal');
  var elGrossAppreciation   = document.getElementById('lobGrossAppreciation');
  var elNetDifferential     = document.getElementById('lobNetDifferential');
  var elDrawdownYearDisplay = document.getElementById('lobDrawdownYearDisplay');
  var elDrawdownYearText    = document.getElementById('lobDrawdownYearText');
  var elDrawdownEndValue    = document.getElementById('lobDrawdownEndValue');
  var elDrawdownDelta       = document.getElementById('lobDrawdownDelta');

  // Chart context
  var chartCanvas = document.getElementById('lobChart');
  var chart = null;

  // ─── Power Law projection — replaces user-controlled growth slider ───
  // PL_A, PL_B, PL_FLOOR, plPrice() come from shared/power-law-data.js
  // (loaded before this file via njk page_scripts).
  // Pattern matches the-bitcoin-retirement.js: GENESIS as Date object,
  // local daysSince() helper, plPriceAtDate() composition. Live BTC price
  // is fetched from CoinGecko on load; falls back to LIVE_BTC_FALLBACK
  // if the fetch fails (offline, rate-limited, etc.).
  var GENESIS = new Date(Date.UTC(2009, 0, 3)); // Jan 3, 2009 UTC
  var LIVE_BTC_FALLBACK = 108000; // periodically updated; matches Retirement
  var liveBtcPrice = LIVE_BTC_FALLBACK;
  var liveBtcSource = 'fallback';
  // Growth-model preset from sitewide modeling-assumptions (default: trend).
  // Honored by projectedTrendPrice() — same as Retirement's growth-model
  // semantics. 'powerlaw-floor' returns trend × PL_FLOOR; the others
  // return trend.
  var growthModel = 'powerlaw-trend';

  function daysSince(date) {
    return (date.getTime() - GENESIS.getTime()) / 86400000;
  }
  function plPriceAtDate(date) { return plPrice(daysSince(date)); }
  function projectedTrendPrice(date) {
    var trend = plPriceAtDate(date);
    if (growthModel === 'powerlaw-floor') return trend * PL_FLOOR;
    return trend; // 'powerlaw-trend', 'linear-cagr-decay', or fallback
  }
  // Implied annual CAGR from today's price to projected trend price h years out.
  function computeProjectedCAGR(h) {
    if (h <= 0 || liveBtcPrice <= 0) return 0;
    var today = new Date();
    var future = new Date(today.getTime() + h * 365.25 * 86400000);
    var futurePrice = projectedTrendPrice(future);
    return Math.pow(futurePrice / liveBtcPrice, 1 / h) - 1;
  }

  // ─── Pull initial growth model from ModelingAssumptions, if available ───
  // The shared module exposes presets keyed by btcGrowthModel. Used here
  // to drive projectedTrendPrice() — the model determines whether we
  // project to trend or floor band.
  if (window.ModelingAssumptions && window.ModelingAssumptions.get) {
    try {
      var growthPreset = window.ModelingAssumptions.get('btcGrowthModel');
      if (growthPreset && growthPreset.preset) {
        growthModel = growthPreset.preset;
      }
    } catch(_e) { /* keep default */ }
  }

  // ─── Formatters ───
  function fmtCurrency(v) {
    var sign = v < 0 ? '-' : '';
    var abs = Math.abs(v);
    if (abs >= 1e6) return sign + '$' + (abs/1e6).toFixed(2).replace(/\.?0+$/,'') + 'M';
    if (abs >= 1e3) return sign + '$' + Math.round(abs/100)/10 + 'k';
    return sign + '$' + Math.round(abs).toLocaleString();
  }
  function fmtCurrencyFull(v) {
    var sign = v < 0 ? '-' : '';
    return sign + '$' + Math.round(Math.abs(v)).toLocaleString();
  }
  function fmtSignedCurrency(v) {
    var sign = v >= 0 ? '+' : '-';
    return sign + '$' + Math.round(Math.abs(v)).toLocaleString();
  }
  function fmtPercent(v) {
    return v.toFixed(v < 10 ? 1 : 0) + '%';
  }

  // ─── Calculation core ───
  function calculate() {
    var B = parseFloat(floatSlider.value);
    var M = parseFloat(monthlyBills.value);
    var h = parseInt(horizonSlider.value, 10);
    var f = parseFloat(feeSlider.value);
    var g = parseFloat(capGainsSlider.value);
    var r = computeProjectedCAGR(h); // Power Law projection from today
    var deMinimisOn = deMinimisToggle.checked;
    var ddYear = Math.min(parseInt(drawdownSlider.value, 10), h);

    // ─── Cash baseline: flat at B ───
    var cashSeries = [];
    for (var i = 0; i <= h; i++) cashSeries.push(B);

    // ─── LoB gross series (pre-friction) ───
    // BTC quantity stays constant at B/P0; dollar value compounds at r.
    var lobGrossSeries = [];
    for (var i = 0; i <= h; i++) lobGrossSeries.push(B * Math.pow(1 + r, i));

    // ─── Cumulative friction by year ───
    // Annual fees: 2 sides × 12 months × M × f%
    var annualFees = 2 * 12 * M * (f / 100);
    // Annual taxable gain (HIFO, ~1-month holding): M × r
    var annualGain = M * r;
    // De-minimis approximation: 12 bills/month, each at M/12.
    // If per-transaction amount < $200, treat as exempt → no tax.
    var perTxAmount = M / 12;
    var effectiveAnnualGain = annualGain;
    if (deMinimisOn && perTxAmount < 200) {
      effectiveAnnualGain = 0;
    }
    var annualTax = effectiveAnnualGain * (g / 100);

    var cumulativeFeesByYear = [];
    var cumulativeTaxesByYear = [];
    for (var i = 0; i <= h; i++) {
      cumulativeFeesByYear.push(annualFees * i);
      cumulativeTaxesByYear.push(annualTax * i);
    }

    // ─── LoB net series (gross minus cumulative friction) ───
    var lobNetSeries = [];
    for (var i = 0; i <= h; i++) {
      lobNetSeries.push(
        lobGrossSeries[i] - cumulativeFeesByYear[i] - cumulativeTaxesByYear[i]
      );
    }

    // ─── Drawdown stress series ───
    // Follows LoB net until ddYear; at end of ddYear, drop 50%; then resume
    // compounding at r from the new level; continue subtracting friction.
    var drawdownSeries = [];
    var ddBalance = B; // starts same as gross
    for (var i = 0; i <= h; i++) {
      // Match LoB gross trajectory up to ddYear
      if (i <= ddYear) {
        ddBalance = B * Math.pow(1 + r, i);
      } else {
        // After drawdown, compound from the post-drawdown base
        var postDrawdownBase = B * Math.pow(1 + r, ddYear) * 0.5;
        ddBalance = postDrawdownBase * Math.pow(1 + r, i - ddYear);
      }
      // Apply 50% shock at exact end of ddYear
      var shocked = ddBalance;
      if (i === ddYear) shocked = ddBalance * 0.5;

      drawdownSeries.push(
        shocked - cumulativeFeesByYear[i] - cumulativeTaxesByYear[i]
      );
    }

    var grossAppreciation = lobGrossSeries[h] - B;
    var differential = lobNetSeries[h] - B; // vs cash baseline (also B)
    var drawdownEndValue = drawdownSeries[h];
    var drawdownDelta = drawdownEndValue - B;

    return {
      B: B,
      M: M,
      h: h,
      r: r,
      ddYear: ddYear,
      cashSeries: cashSeries,
      lobGrossSeries: lobGrossSeries,
      lobNetSeries: lobNetSeries,
      drawdownSeries: drawdownSeries,
      cumulativeFees: cumulativeFeesByYear[h],
      cumulativeTaxes: cumulativeTaxesByYear[h],
      grossAppreciation: grossAppreciation,
      differential: differential,
      drawdownEndValue: drawdownEndValue,
      drawdownDelta: drawdownDelta,
      deMinimisActive: deMinimisOn && perTxAmount < 200,
    };
  }

  // ─── Slider value-display updates ───
  function renderSliderValues() {
    valFloat.textContent     = '$' + parseFloat(floatSlider.value).toLocaleString();
    valBills.textContent     = '$' + parseFloat(monthlyBills.value).toLocaleString();
    valHorizon.textContent   = horizonSlider.value + (horizonSlider.value === '1' ? ' year' : ' years');
    valFee.textContent       = parseFloat(feeSlider.value).toFixed(1) + '%';
    valCapGains.textContent  = capGainsSlider.value + '%';
    valDeMinimis.textContent = deMinimisToggle.checked ? 'On' : 'Off';
    valDrawdown.textContent  = 'Year ' + drawdownSlider.value;

    // Power Law projection display
    var h = parseInt(horizonSlider.value, 10);
    var r = computeProjectedCAGR(h);
    var today = new Date();
    var future = new Date(today.getTime() + h * 365.25 * 86400000);
    var futurePrice = projectedTrendPrice(future);
    var trendToday = plPriceAtDate(today);
    var pctOffTrend = (liveBtcPrice / trendToday - 1) * 100;
    var offTrendLabel = pctOffTrend < 0
      ? Math.abs(pctOffTrend).toFixed(0) + '% below trend'
      : pctOffTrend.toFixed(0) + '% above trend';
    var modelLabel = growthModel === 'powerlaw-floor' ? 'Power Law floor band' : 'Power Law trend';

    if (projectionCAGR) {
      projectionCAGR.textContent = (r * 100).toFixed(1) + '%';
    }
    if (projectionDetail) {
      projectionDetail.innerHTML =
        'From <strong>$' + Math.round(liveBtcPrice).toLocaleString() + '</strong> today ' +
        '(' + offTrendLabel + ') ' +
        'to <strong>$' + Math.round(futurePrice).toLocaleString() + '</strong> ' +
        'at ' + modelLabel + ' in year ' + h +
        ' &middot; <span class="projection-source">' + liveBtcSource + '</span>';
    }
  }

  // ─── Output rendering ───
  function renderOutputs(result) {
    elHorizonYears.textContent = result.h;
    elBreakdownHorizon.textContent = result.h;
    elDrawdownYearDisplay.textContent = result.ddYear;
    elDrawdownYearText.textContent = result.ddYear;

    // Headline
    elDifferential.textContent = fmtSignedCurrency(result.differential);
    elDifferential.classList.toggle('lob-headline-negative', result.differential < 0);
    elFeesInline.textContent = fmtCurrencyFull(result.cumulativeFees);
    elTaxesInline.textContent = fmtCurrencyFull(result.cumulativeTaxes);

    // Friction breakdown grid
    elFeesTotal.textContent = fmtCurrencyFull(result.cumulativeFees);
    elTaxesTotal.textContent = fmtCurrencyFull(result.cumulativeTaxes);
    elGrossAppreciation.textContent = fmtSignedCurrency(result.grossAppreciation);
    elNetDifferential.textContent = fmtSignedCurrency(result.differential);
    elNetDifferential.classList.toggle('lob-breakdown-negative', result.differential < 0);

    // Drawdown callout
    elDrawdownEndValue.textContent = fmtCurrencyFull(result.drawdownEndValue);
    elDrawdownDelta.textContent = fmtSignedCurrency(result.drawdownDelta);
  }

  // ─── Chart rendering ───
  function renderChart(result) {
    if (!chartCanvas) return;
    var labels = [];
    for (var i = 0; i <= result.h; i++) {
      labels.push('Year ' + i);
    }

    var datasets = [
      {
        label: 'Cash baseline',
        data: result.cashSeries,
        borderColor: '#9a9080', // matches var(--text-dim) + .swatch-baseline
        backgroundColor: 'rgba(154,144,128,0.04)',
        borderWidth: 2,
        borderDash: [4, 4],
        tension: 0.0,
        pointRadius: 0,
        pointHoverRadius: 5,
      },
      {
        label: 'Living on Bitcoin (net of friction)',
        data: result.lobNetSeries,
        borderColor: '#e09422', // matches var(--amber) + .swatch-lob
        backgroundColor: 'rgba(224,148,34,0.10)',
        borderWidth: 3,
        tension: 0.2,
        pointRadius: 0,
        pointHoverRadius: 6,
        fill: true,
      },
      {
        label: 'LoB with −50% drawdown at year ' + result.ddYear,
        data: result.drawdownSeries,
        borderColor: '#c0392b', // matches var(--red) + .swatch-drawdown
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [8, 4],
        tension: 0.15,
        pointRadius: 0,
        pointHoverRadius: 5,
      }
    ];

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = result.cashSeries;
      chart.data.datasets[1].data = result.lobNetSeries;
      chart.data.datasets[2].data = result.drawdownSeries;
      chart.data.datasets[2].label = 'LoB with −50% drawdown at year ' + result.ddYear;
      chart.update('none');
      return;
    }

    chart = new Chart(chartCanvas, {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false }, // legend in HTML
          tooltip: {
            backgroundColor: 'rgba(20,18,16,0.95)',
            borderColor: 'rgba(224,148,34,0.30)',
            borderWidth: 1,
            titleColor: '#e8e0d4',
            bodyColor: '#e8e0d4',
            padding: 10,
            cornerRadius: 4,
            displayColors: true,
            callbacks: {
              label: function(ctx){
                return ctx.dataset.label + ': $' + Math.round(ctx.parsed.y).toLocaleString();
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: '#9a9080', font: { size: 11 } },
            border: { color: 'rgba(224,148,34,0.15)' },
          },
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(224,148,34,0.06)' },
            border: { color: 'rgba(224,148,34,0.15)' },
            ticks: {
              color: '#9a9080',
              font: { size: 11 },
              callback: function(v){
                if (v >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M';
                if (v >= 1e3) return '$' + (v/1e3).toFixed(0) + 'k';
                return '$' + v;
              }
            }
          }
        }
      }
    });
  }

  // ─── Master render: slider values → calculation → outputs + chart ───
  function render() {
    renderSliderValues();
    var result = calculate();
    renderOutputs(result);
    renderChart(result);
  }

  // ─── Wire all sliders ───
  [floatSlider, monthlyBills, horizonSlider, feeSlider, capGainsSlider,
   drawdownSlider].forEach(function(s){
    s.addEventListener('input', render);
  });
  deMinimisToggle.addEventListener('change', render);

  // ─── Subscribe to ModelingAssumptions changes (optional) ───
  // If the user changes the btcGrowthModel preset on another page (via the
  // sitewide modeling-assumptions picker), we update our projection accordingly.
  // No on-page slider to keep in sync any more — the projection display
  // re-computes naturally on render().
  if (window.ModelingAssumptions && window.ModelingAssumptions.subscribe) {
    window.ModelingAssumptions.subscribe(function(dim){
      if (dim === 'btcGrowthModel' || dim === '*') {
        try {
          var growthPreset = window.ModelingAssumptions.get('btcGrowthModel');
          if (growthPreset && growthPreset.preset) {
            growthModel = growthPreset.preset;
            render();
          }
        } catch(_e) { /* ignore */ }
      }
    });
  }

  // ─── Live BTC price fetch (CoinGecko, with fallback) ───
  // Match the pattern from the-bitcoin-retirement.js: fire-and-forget,
  // re-render on success, silent fallback on failure. Network/CORS/rate-limit
  // issues all degrade gracefully to LIVE_BTC_FALLBACK.
  function fetchLiveBtc() {
    if (typeof fetch !== 'function') return;
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
      mode: 'cors', cache: 'no-store'
    })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        if (d && d.bitcoin && typeof d.bitcoin.usd === 'number' && d.bitcoin.usd > 0) {
          liveBtcPrice = d.bitcoin.usd;
          liveBtcSource = 'live price';
          render();
        }
      })
      .catch(function(){ /* keep fallback; render already ran with it */ });
  }
  fetchLiveBtc();

  // ─── Initial render ───
  render();
})();
