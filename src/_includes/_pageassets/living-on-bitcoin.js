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

  // New (Commit 4) — bottom result-summary elements (mirror of top hero)
  var elSummaryHorizon      = document.getElementById('lobSummaryHorizon');
  var elSummaryDifferential = document.getElementById('lobSummaryDifferential');
  var elSummaryGross        = document.getElementById('lobSummaryGross');
  var elSummaryFees         = document.getElementById('lobSummaryFees');
  var elSummaryTaxes        = document.getElementById('lobSummaryTaxes');

  // New (Commit 4) — drawdown shock callout (the float recovers to its path)
  var elDrawdownShockValue     = document.getElementById('lobDrawdownShockValue');
  var elDrawdownShockMagnitude = document.getElementById('lobDrawdownShockMagnitude');
  var elDrawdownHorizonYear    = document.getElementById('lobDrawdownHorizonYear');

  // The two scenario radios (stays vs returns to trend over 3 years; 2026-10-11)
  var scenarioRadios = document.querySelectorAll('input[name="growthScenario"]');

  // Chart context
  var chartCanvas = document.getElementById('lobChart');
  var chart = null;

  // ─── Power Law projection — replaces user-controlled growth slider ───
  // PL_A, PL_B, PL_FLOOR, plPrice() come from shared/power-law-data.js
  // (loaded before this file via njk page_scripts).
  // Pattern matches the-bitcoin-retirement.js: GENESIS as Date object,
  // local daysSince() helper, plPriceAtDate() composition. The live BTC
  // price comes from the shared fetch (fetchTodayPrice, below); until it
  // answers, and if no live source does, the price is the latest PL_DATA
  // sample, labelled with its date. (Until 2026-09-29 this page called
  // CoinGecko itself and fell back to a hardcoded $108,000 — about $25K above
  // the market that day.)
  var GENESIS = new Date(Date.UTC(2009, 0, 3)); // Jan 3, 2009 UTC
  var liveBtcPrice = TODAY_PRICE;   // shared seed: the latest PL_DATA sample
  var liveBtcSource = 'fallback';   // 'live' once the shared fetch resolves live
  // Bitcoin's price: the two scenarios (DEFAULTS_POLICY_2026-10-11, PR B;
  // JM 2026-10-11), picked with the two radios in .projection-display:
  //   'stay'   bitcoin keeps today's multiple of trend ("If bitcoin stays 47%
  //            below trend"), so it grows at the trend's own rate;
  //   'trend'  the gap closes in a straight line over 3 years, then the trend
  //            ("If bitcoin returns to trend over 3 years").
  // The default is the lower of the two for today's price (PriceCases.
  // defaultFor) until the reader picks. Until 2026-10-11 the default was
  // "Current trajectory", described as starting at today's price but in fact
  // a full return to trend by the horizon end, expressed as one rate (51.4% a
  // year over 5 years; DEFAULTS_POLICY §3 bug 4), and the sitewide growth-
  // model setting (retired) could swap the end point for the floor.
  var growthScenario = 'stay';
  var scenarioPicked = false;
  var PC = window.PriceCases || null;

  function daysSince(date) {
    return (date.getTime() - GENESIS.getTime()) / 86400000;
  }
  function plPriceAtDate(date) { return plPrice(daysSince(date)); }
  function todayMultiple() { return liveBtcPrice / plPriceAtDate(new Date()); }
  function syncDefault() { if (!scenarioPicked && PC) growthScenario = PC.defaultFor(todayMultiple()); }
  // The price h years out on a scenario: the trend then, times the multiple.
  function scenarioEndPrice(sc, h) {
    var future = new Date(Date.now() + h * 365.25 * 86400000);
    var m0 = todayMultiple();
    var m = (sc === 'trend') ? (PC ? PC.multipleAt('trend', m0, 0, h) : Math.min(1, m0 + (1 - m0) * h / 3)) : m0;
    return plPriceAtDate(future) * m;
  }
  // Implied annual rate from today's price to the scenario's price h years out.
  // The page compounds the float at this one rate (the Math tab says so); the
  // end point is exact, the years between are smoothed.
  function computeProjectedCAGR(h, sc) {
    if (h <= 0) return 0;
    var startPrice = liveBtcPrice;
    if (!(startPrice > 0)) return 0;
    return Math.pow(scenarioEndPrice(sc || growthScenario, h) / startPrice, 1 / h) - 1;
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
  // `sc` (optional) runs the other scenario for the radios' figures, so both
  // scenarios stay on screen; omitted, the scenario picked.
  function calculate(sc) {
    var B = parseFloat(floatSlider.value);
    var M = parseFloat(monthlyBills.value);
    var h = parseInt(horizonSlider.value, 10);
    var f = parseFloat(feeSlider.value);
    var g = parseFloat(capGainsSlider.value);
    var r = computeProjectedCAGR(h, sc || growthScenario); // from today's price, on the scenario
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
    // §6.3 modeling: drawdowns are temporary deviations from Power Law,
    // not permanent damage. Pre-drawdown: matches LoB net trajectory.
    // At ddYear: 50% shock on gross value (then friction applied). After
    // ddYear: GEOMETRIC recovery (constant catch-up CAGR) from the shocked
    // value back to lobNet at horizon end. By year h the drawdown line
    // meets the LoB line — the cost of the shock is borne in the near-
    // term (paying bills at the bottom during the recovery period), not
    // in the end state.
    //
    // Why geometric, not linear: lobNet grows ~ exponentially (B·(1+r)^i
    // minus a linear friction term). Linear interpolation from a low shock
    // value to a high terminal value crosses ABOVE the exponential curve
    // almost immediately — the drawdown line ends up implying HIGHER
    // wealth than no-drawdown in the middle years, which is incoherent.
    // Geometric interp (compounding from shock at a constant rate to
    // terminal) stays below the lobNet curve throughout the recovery and
    // meets it only at horizon. A min() cap guards against any numerical
    // edge case where geometric might still overshoot.
    var drawdownSeries = [];
    var shockedAtDdYear = 0; // value at ddYear after the shock + friction
    for (var i = 0; i <= h; i++) {
      if (i < ddYear) {
        // Pre-drawdown: track LoB net exactly
        drawdownSeries.push(lobNetSeries[i]);
      } else if (i === ddYear) {
        // 50% shock on gross; apply current cumulative friction
        var shocked = lobGrossSeries[i] * 0.5;
        shockedAtDdYear = shocked - cumulativeFeesByYear[i] - cumulativeTaxesByYear[i];
        drawdownSeries.push(shockedAtDdYear);
      } else {
        // Post-drawdown: geometric recovery from shockedAtDdYear to lobNet[h].
        // If ddYear === h (drawdown at horizon), this branch never executes.
        var recoveryPeriod = h - ddYear;
        var endTarget = lobNetSeries[h];
        var interpolated;
        if (shockedAtDdYear > 0 && endTarget > 0) {
          // Geometric: constant catch-up CAGR from shock to terminal.
          // catchup = (terminal / shock)^(1/period) - 1
          var catchup = Math.pow(endTarget / shockedAtDdYear, 1 / recoveryPeriod) - 1;
          interpolated = shockedAtDdYear * Math.pow(1 + catchup, i - ddYear);
        } else {
          // Edge case: negative shock or non-positive terminal. Fall back
          // to linear; the min() cap below ensures no overshoot.
          var t = (i - ddYear) / recoveryPeriod;
          interpolated = shockedAtDdYear + (endTarget - shockedAtDdYear) * t;
        }
        // Safety cap: never let the drawdown line exceed the no-drawdown
        // trajectory. Mathematically geometric shouldn't, but cheap insurance.
        drawdownSeries.push(Math.min(interpolated, lobNetSeries[i]));
      }
    }

    var grossAppreciation = lobGrossSeries[h] - B;
    var differential = lobNetSeries[h] - B; // vs cash baseline (also B)
    var drawdownEndValue = drawdownSeries[h];
    var drawdownDelta = drawdownEndValue - B;
    // Magnitude of the shock at ddYear — used by the callout to surface
    // the near-term cost (which is where the drawdown story actually lives
    // under the recover-to-the-path assumption).
    var lobValueAtDdYear = lobNetSeries[ddYear];
    var shockValueAtDdYear = drawdownSeries[ddYear];
    var shockMagnitude = lobValueAtDdYear - shockValueAtDdYear;

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
      lobValueAtDdYear: lobValueAtDdYear,
      shockValueAtDdYear: shockValueAtDdYear,
      shockMagnitude: shockMagnitude,
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

    // Power Law projection display: the scenario picked, from today's price.
    var h = parseInt(horizonSlider.value, 10);
    var r = computeProjectedCAGR(h);
    var futurePrice = scenarioEndPrice(growthScenario, h);
    var m0 = todayMultiple(), gap = Math.round(Math.abs(1 - m0) * 100);
    var offTrendLabel = gap + '% ' + (m0 < 1 ? 'below' : 'above') + ' trend';
    var whenLabel = (liveBtcSource === 'live' ? 'today' : 'on ' + lastSampleDateShort());
    var endLabel = growthScenario === 'trend'
      ? (h >= 3 ? 'back on its Power Law trend, which it reaches in year 3' : Math.round(h / 3 * 100) + '% of the way back to its Power Law trend')
      : 'still ' + offTrendLabel;

    if (projectionCAGR) {
      projectionCAGR.textContent = (r * 100).toFixed(1) + '%';
    }
    if (projectionDetail) {
      projectionDetail.innerHTML =
        'From <strong>$' + Math.round(liveBtcPrice).toLocaleString() + '</strong> ' + whenLabel + ' (' + offTrendLabel + ') ' +
        'to <strong>$' + Math.round(futurePrice).toLocaleString() + '</strong> in year ' + h + ', ' + endLabel +
        ' &middot; <span class="projection-source">' + (liveBtcSource === 'live' ? 'live price' : 'live price unavailable') + '</span>';
    }
  }

  // The two radios: titles from PriceCases (STYLE_GUIDE §10.14) and each
  // scenario's rate and result, so the one not picked stays on screen too.
  function renderScenarioOptions(results) {
    var m0 = todayMultiple(), T = PC ? PC.titles(m0) : { stay: 'If bitcoin stays where it is against trend', trend: 'If bitcoin returns to trend over 3 years' };
    var h = parseInt(horizonSlider.value, 10);
    var plan = { months: h * 12, phrase: h === 1 ? 'the whole year' : 'all ' + h + ' years', words: h + (h === 1 ? ' year' : ' years') };
    var G = PC ? PC.tags(m0, plan.months) : null, N = PC ? PC.notes(m0, plan) : null;
    var ft = document.querySelector('[data-lob="foot"]');
    if (ft && PC) ft.textContent = 'Neither scenario is a forecast. ' + PC.foot(m0, plan);
    ['stay', 'trend'].forEach(function (k) {
      var nt = document.querySelector('.projection-scenario-option[data-scenario="' + k + '"] [data-lob="note"]');
      if (nt && N) nt.textContent = N[k];
      var opt = document.querySelector('.projection-scenario-option[data-scenario="' + k + '"]');
      if (!opt) return;
      var radio = opt.querySelector('input'); if (radio) radio.checked = (growthScenario === k);
      opt.classList.toggle('is-selected', growthScenario === k);
      var t = opt.querySelector('[data-lob="title"]'); if (t) t.textContent = T[k];
      var tg = opt.querySelector('[data-lob="tag"]'); if (tg && G) { tg.textContent = G[k].text; tg.className = 'projection-scenario-tag lob-tag--' + G[k].cls; }
      var hp = opt.querySelector('[data-lob="help"]');
      if (hp && results[k]) hp.textContent = 'about ' + (results[k].r * 100).toFixed(1) + '% a year · nets ' + fmtSignedCurrency(results[k].differential) + ' over ' + results[k].h + (results[k].h === 1 ? ' year' : ' years');
    });
  }

  // ─── Output rendering ───
  function renderOutputs(result) {
    if (elHorizonYears)        elHorizonYears.textContent = result.h;
    elBreakdownHorizon.textContent = result.h;
    elDrawdownYearDisplay.textContent = result.ddYear;
    elDrawdownYearText.textContent = result.ddYear;

    // Top headline (markup removed in Commit 5 per JM — null-guarded so
    // the page renders correctly. Kept the assignments in case the
    // markup is restored later.)
    if (elDifferential) {
      elDifferential.textContent = fmtSignedCurrency(result.differential);
      elDifferential.classList.toggle('lob-headline-negative', result.differential < 0);
    }
    if (elFeesInline) elFeesInline.textContent = fmtCurrencyFull(result.cumulativeFees);
    if (elTaxesInline) elTaxesInline.textContent = fmtCurrencyFull(result.cumulativeTaxes);

    // Bottom result block (mirror of top, anchored after the sliders).
    // Same number, slightly different framing — gives the calculator a
    // natural conclusion after the exploration. Optional elements so the
    // page renders correctly even if the bottom block isn't in the DOM.
    if (elSummaryHorizon)     elSummaryHorizon.textContent = result.h;
    if (elSummaryDifferential) {
      elSummaryDifferential.textContent = fmtSignedCurrency(result.differential);
      elSummaryDifferential.classList.toggle('lob-result-summary-negative', result.differential < 0);
    }
    if (elSummaryGross) elSummaryGross.textContent = fmtSignedCurrency(result.grossAppreciation);
    if (elSummaryFees)  elSummaryFees.textContent  = fmtCurrencyFull(result.cumulativeFees);
    if (elSummaryTaxes) elSummaryTaxes.textContent = fmtCurrencyFull(result.cumulativeTaxes);

    // Friction breakdown grid
    elFeesTotal.textContent = fmtCurrencyFull(result.cumulativeFees);
    elTaxesTotal.textContent = fmtCurrencyFull(result.cumulativeTaxes);
    elGrossAppreciation.textContent = fmtSignedCurrency(result.grossAppreciation);
    elNetDifferential.textContent = fmtSignedCurrency(result.differential);
    elNetDifferential.classList.toggle('lob-breakdown-negative', result.differential < 0);

    // Drawdown callout — under the recover-to-the-path model, the
    // end-state delta is ~0 (drawdown recovers to LoB net by horizon).
    // The story is the near-term shock at ddYear: how deep the bitcoin
    // float dips and what that means for paying bills during recovery.
    if (elDrawdownShockValue) elDrawdownShockValue.textContent = fmtCurrencyFull(result.shockValueAtDdYear);
    if (elDrawdownShockMagnitude) elDrawdownShockMagnitude.textContent = fmtCurrencyFull(result.shockMagnitude);
    if (elDrawdownHorizonYear) elDrawdownHorizonYear.textContent = result.h;
    // Legacy fields kept for compatibility — populate but they may not
    // be displayed under the new copy.
    if (elDrawdownEndValue) elDrawdownEndValue.textContent = fmtCurrencyFull(result.drawdownEndValue);
    if (elDrawdownDelta) elDrawdownDelta.textContent = fmtSignedCurrency(result.drawdownDelta);
  }

  // ─── Chart rendering ───
  // §6.14 deferred-layout pattern: the chart canvas lives inside the
  // Calculator tab (.tab-content), which has display:none on initial page
  // load (Question tab is default-active). Creating Chart.js against a 0×0
  // canvas corrupts every element's pixel position to 0, and subsequent
  // chart.update('none') calls don't recover from this. We use a flag +
  // ResizeObserver: if the canvas has zero width when renderChart() runs,
  // we stash the pending result; when the canvas first gains real
  // dimensions (user switches to Calculator tab), ResizeObserver fires
  // and we run the deferred render once.
  var pendingChartResult = null;
  function renderChart(result) {
    if (!chartCanvas) return;
    if (!chartCanvas.clientWidth || chartCanvas.clientWidth === 0) {
      // Canvas hidden (tab not active). Stash the result; ResizeObserver
      // below picks it up when the tab becomes visible.
      pendingChartResult = result;
      return;
    }
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
    syncDefault();
    renderSliderValues();
    var result = calculate();
    var other = calculate(growthScenario === 'stay' ? 'trend' : 'stay');
    var both = {}; both[growthScenario] = result; both[growthScenario === 'stay' ? 'trend' : 'stay'] = other;
    renderScenarioOptions(both);
    renderOutputs(result);
    renderChart(result);
  }

  // ─── Wire all sliders ───
  [floatSlider, monthlyBills, horizonSlider, feeSlider, capGainsSlider,
   drawdownSlider].forEach(function(s){
    s.addEventListener('input', render);
  });
  deMinimisToggle.addEventListener('change', render);

  // ─── The two scenario radios — a pick holds for the visit ───
  if (scenarioRadios && scenarioRadios.length) {
    Array.prototype.forEach.call(scenarioRadios, function(radio){
      radio.addEventListener('change', function(){
        if (radio.checked && (radio.value === 'stay' || radio.value === 'trend')) {
          growthScenario = radio.value;
          scenarioPicked = true;
          render();
        }
      });
    });
  }

  // (The ModelingAssumptions subscription for the growth model went with the
  // setting, 2026-10-11; nothing on this page reads the sitewide store now.)

  // ─── Live BTC price (the shared fetch, with its dated fallback) ───
  // Same pattern as the-bitcoin-retirement.js: fire-and-forget, re-render when
  // the shared fetch answers. On fallback the price stays the latest sample
  // and the projection line says which day it is from.
  function fetchLiveBtc() {
    if (typeof fetchTodayPrice !== 'function') return;
    fetchTodayPrice(function(price, source){
      if (typeof price === 'number' && isFinite(price) && price > 0) {
        liveBtcPrice = price;
        liveBtcSource = (source === 'live') ? 'live' : 'fallback';
        render();
      }
    });
  }
  fetchLiveBtc();

  // ─── §6.14 deferred chart render — ResizeObserver picks up the canvas
  // becoming visible (user switches to Calculator tab) and runs the
  // stashed chart render exactly once. ResizeObserver is supported in
  // every evergreen browser (Chrome 64+, Safari 13.4+, Firefox 69+);
  // without it the fallback is a slightly stale chart on first view,
  // which is no worse than the original bug. ───
  if (chartCanvas && typeof ResizeObserver !== 'undefined') {
    var chartObserver = new ResizeObserver(function() {
      if (pendingChartResult && chartCanvas.clientWidth > 0) {
        var deferred = pendingChartResult;
        pendingChartResult = null;
        renderChart(deferred);
      }
    });
    chartObserver.observe(chartCanvas);
  }

  // ─── Initial render ───
  render();
})();
