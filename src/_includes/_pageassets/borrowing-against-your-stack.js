// ═══════════════════════════════════════════════════════════════════
// BORROWING AGAINST YOUR STACK — page logic
//
// Four-tab page: Question / Loan Health / Borrow-vs-Sell-vs-HODL /
// Math. This file handles tab routing + the interactive math and
// charts for the two tool-led tabs (Loan Health, Borrow-vs-Sell-vs-
// HODL) and the Math tab's CAGR-vs-rates chart.
//
// Loan Health (Tab II) — risk surface:
//   • LTV / liquidation-price / channel-position math
//   • Interest-rate input + monthly/annual repayment burden
//   • Interpretation paragraph that incorporates mean-reversion
//     opportunity cost at low PL positions and the borrow-low/repay-
//     high (Disciplined-Rebalancing-mirror) framing
//   • Power Law channel chart (basChannelChart) with current-price
//     marker and liquidation-price horizontal line projected forward
//
// Borrow vs. Sell vs. HODL (Tab III) — cross-strategy comparison:
//   • Three-path comparison over chosen horizon (1–15y)
//   • HODL baseline + Borrow path + Sell-with-cap-gains-tax path
//   • Exceeds §4.2 spec by adding the do-nothing baseline that makes
//     both active paths' wealth costs legible
//
// The Math (Tab IV) — cagrVsRatesChart, defined in its own IIFE
// below the calculator code (separator block around line 1039).
//
// PL_DATA + PL_A/B/FLOOR/CEIL + GENESIS_TS + plPrice() come from
// shared/power-law-data.js (loaded before this file via njk page_scripts).
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


// ═══════ CALCULATOR ═══════
(function(){
  var stackInput = document.getElementById('basBtcStack');
  if (!stackInput) return;

  // ─── Risk-surface inputs ───
  var priceInput          = document.getElementById('basBtcPrice');
  var loanInput           = document.getElementById('basLoanAmount');
  var liqThresholdSlider  = document.getElementById('basLiqThreshold');
  var liqThresholdDisplay = document.getElementById('basLiqThresholdDisplay');

  // ─── Cost-surface inputs ───
  var rateSlider          = document.getElementById('basInterestRate');
  var rateDisplay         = document.getElementById('basInterestRateDisplay');
  var bvsRateDisplay      = document.getElementById('bvsInterestRateDisplay');
  var presetBtns          = document.querySelectorAll('.bas-calc-preset');

  // ─── Risk-surface outputs ───
  var ltvOut          = document.getElementById('basLtvOut');
  var ltvZoneLabel    = document.getElementById('basLtvZone');
  var liqPriceOut     = document.getElementById('basLiqPrice');
  var liqDrawdownOut  = document.getElementById('basLiqDrawdown');
  var channelPosOut   = document.getElementById('basChannelPos');
  var channelHintOut  = document.getElementById('basChannelHint');

  // ─── Cost-surface outputs ───
  var monthlyOut         = document.getElementById('basMonthlyInterest');
  var annualOut          = document.getElementById('basAnnualInterest');
  var annualSubOut       = document.getElementById('basAnnualInterestSub');
  var annualPctStackOut  = document.getElementById('basAnnualPctStack');

  var profileChecksOut = document.getElementById('basProfileChecks');
  var profileNotesOut  = document.getElementById('basProfileNotes');
  var providerCardsOut = document.getElementById('basProviderCards');

  // ─── LTV meter element refs ───
  var ltvMeterFill           = document.getElementById('basLtvMeterFill');
  var ltvMeterMarker         = document.getElementById('basLtvMeterMarker');
  var ltvMeterCurrentSwatch  = document.getElementById('basLtvMeterCurrentSwatch');
  var ltvMeterCurrentLabel   = document.getElementById('basLtvMeterCurrentLabel');
  var ltvMeterTriggerLabel   = document.getElementById('basLtvMeterTriggerLabel');

  // ─── Borrow-vs-sell inputs and outputs ───
  // BvS now lives in its own top-level tab. Inputs are prefixed bvs* to
  // distinguish from the Loan Health tab's bas* inputs. The four shared
  // values (stack, price, loan, rate) appear on BOTH tabs and stay in
  // sync via the state-sync layer initialised at the end of this IIFE.
  var horizonSlider     = document.getElementById('bvsHorizon');
  var horizonDisplay    = document.getElementById('bvsHorizonDisplay');
  var costBasisInput    = document.getElementById('bvsCostBasis');
  var capGainsSlider    = document.getElementById('bvsCapGains');
  var capGainsDisplay   = document.getElementById('bvsCapGainsDisplay');
  var bvsBorrowHeadline = document.getElementById('basBvsBorrowHeadline');
  var bvsBorrowRows     = document.getElementById('basBvsBorrowRows');
  var bvsSellHeadline   = document.getElementById('basBvsSellHeadline');
  var bvsSellRows       = document.getElementById('basBvsSellRows');
  var bvsHodlHeadline   = document.getElementById('basBvsHodlHeadline');
  var bvsHodlRows       = document.getElementById('basBvsHodlRows');
  var bvsVerdict        = document.getElementById('basBvsVerdict');

  // ─── Bitcoin's price on the Borrow vs. Sell vs. HODL tab: the two scenarios
  // (DEFAULTS_POLICY_2026-10-11, PR C, 2026-10-14; shared/price-cases.js).
  //   stay   "If bitcoin stays 47% below trend": today's multiple of trend
  //          at the horizon, so bitcoin grows at the trend's own rate.
  //   trend  "If bitcoin returns to trend over 3 years": on trend from year 3
  //          (part-way back for a 1- or 2-year horizon).
  // Until 2026-10-14 the tab priced every path at the trend at the horizon,
  // the return over the whole horizon, and called it the central-tendency
  // expectation. The default is the lower of the two for the price in the
  // current-price input (an editable price counts, R2), until the reader
  // picks; `sc` carries a pick in the address bar (R7).
  var PC = window.PriceCases || null;
  var pcBas = document.getElementById('pcBas');
  var BVS_SC = 'stay', BVS_PICKED = false;
  try {
    var _sc = new URLSearchParams(window.location.search).get('sc');
    if (_sc === 'stay' || _sc === 'trend') { BVS_SC = _sc; BVS_PICKED = true; }
  } catch (e) {}
  function bvsScenarioMultiple(scenario, m0, years) {
    if (scenario !== 'trend') return m0;
    return PC ? PC.multipleAt('trend', m0, 0, years) : m0 + (1 - m0) * Math.max(0, Math.min(1, years / 3));
  }

  // ─── Scenario carry-over from sibling pages ──────────────────────────
  // /the-bitcoin-retirement (the primary calculator) builds links to
  // BAS with the user's scenario serialized as URL query parameters.
  //
  // The full URL ⇄ state sync now lives in a dedicated IIFE at the end
  // of this file (see "═══════ SCENARIO URL SYNC & SHARE — BAS ═══════"),
  // which handles all 7 BAS schema keys (stack/loan/rate/liq/horizon/
  // cb/cg) AND runs AFTER the SHARED_PAIRS localStorage hydration
  // below, so URL params correctly override stored values.
  //
  // Unknown params (e.g. Retirement's retire/income/years/dca/withdraw)
  // are preserved on the URL untouched per the §17.5 forward-compat
  // convention, so any back-link to /the-bitcoin-retirement still sees
  // the original sender's full state.

  // ─── Cost-basis presets (typical bitcoiner entry points) ───
  // Editorially-anchored to recognizable cycle moments. The "today"
  // preset is the conservative default (no embedded gain). The others
  // give the user one-click access to typical accumulation scenarios.
  var cbPresetBtns = document.querySelectorAll('.bas-calc-bvs-cb-preset');
  var CB_PRESETS = {
    'today':   function(){ return parseFloat(priceInput.value) || 0; },
    '2yr':     30000,   // ~2024 avg accumulation cost
    '4yr':     20000,   // ~2022 cycle low region
    'genesis': 5000     // pre-2020 average accumulation
  };

  // Auto-fill current BTC price from the shared live anchor. TODAY_PRICE
  // seeds to the latest PL_DATA sample (used immediately so the page renders
  // with a sensible value) and fetchTodayPrice() then overwrites with the
  // live spot. We only overwrite the input if the user hasn't already
  // typed a value — this is an editable modeling input by design. The fixed
  // "Today (live)" caption below the chart legend always reflects the live
  // spot regardless of user edits, so the reader has a stable factual anchor.
  function updateTodayCaption(price, source) {
    var spotEl = document.getElementById('basTodaySpot');
    var multEl = document.getElementById('basTodayMult');
    if (!spotEl || !multEl) return;
    var labelEl = document.getElementById('basTodayLabel');
    if (labelEl && typeof todayPriceLabel === 'function') labelEl.textContent = todayPriceLabel(source);
    var fmt = (price >= 1000) ? '$' + (price / 1000).toFixed(1) + 'K'
                              : '$' + Math.round(price).toLocaleString();
    spotEl.textContent = fmt;
    var trendNow = (typeof plPrice === 'function' && typeof TODAY_DAYS !== 'undefined')
                   ? plPrice(TODAY_DAYS) : null;
    multEl.textContent = (trendNow && trendNow > 0)
                         ? (price / trendNow).toFixed(2) + '\u00d7'
                         : '\u2014\u00d7';
  }
  if (typeof PL_DATA !== 'undefined' && PL_DATA.length) {
    var userHadValue = !!(priceInput.value && priceInput.value !== '0');
    if (!userHadValue) {
      priceInput.value = Math.round(TODAY_PRICE / 100) * 100;
    }
    // Seed the fixed caption right away so the reader sees a sensible
    // value before the fetch resolves.
    updateTodayCaption(TODAY_PRICE);
    if (typeof fetchTodayPrice === 'function') {
      priceInput.addEventListener('input', function(){ priceInput.dataset.userEdited = '1'; });
      fetchTodayPrice(function(price, source) {
        // The fixed caption always reflects the resolved spot — even if the
        // user has edited the modeling input to a hypothetical. The label is
        // honest: "live" only on a real fetch, else the sample's date.
        updateTodayCaption(price, source);
        // Only fill the editable input if the user hasn't touched it.
        if (!priceInput.dataset.userEdited && !userHadValue) {
          priceInput.value = Math.round(price / 100) * 100;
          priceInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }
  }

  // Auto-fill cost basis with current price on first render — defaults to
  // 'no embedded gain' which is the most conservative assumption for the
  // sell path (zero tax bill, so the sell path is most competitive against
  // borrowing). If the user lowers cost basis, the sell path's tax burden
  // rises and the borrow path's advantage grows accordingly.
  // data-autofilled marks this value as one WE filled in rather than one the reader
  // chose. The URL writer (separate IIFE below, hence a DOM attribute rather than a
  // closure variable) omits `cb` while the mark holds. That is what stopped a bare
  // load from serializing ?cb=<seed price>: the auto-fill runs against the SEED
  // price, the live fetch then moves priceInput underneath it, and the writer's
  // "cb equals current price" default test stopped matching.
  if (costBasisInput && (!costBasisInput.value || costBasisInput.value === '0')) {
    costBasisInput.value = priceInput.value;
    costBasisInput.dataset.autofilled = '1';
  }
  if (costBasisInput) {
    ['input', 'change'].forEach(function (ev) {
      costBasisInput.addEventListener(ev, function () { delete costBasisInput.dataset.autofilled; });
    });
  }

  var chart = null;

  // ─── Canonical "you are here" pulse halo plugin (STYLE_GUIDE §6.23).
  // Promotes the static green "Current price" dot into the canonical
  // animated pulse — no second marker added; the dot's pointRadius is 0
  // and the pulse div is the visual. Anchored to the "Current price"
  // dataset's single data point so it tracks user edits to the price
  // input naturally (renderChart() rebuilds currentDot from the input).
  var lcsPulsePlugin = {
    id: 'lcsPulse',
    afterRender: function(c) {
      var pulse = document.getElementById('basPulse');
      if (!pulse || !c.scales || !c.scales.x || !c.scales.y) return;
      // Current price dataset is the last one (label === 'Current price').
      var ds = null;
      for (var i = c.data.datasets.length - 1; i >= 0; i--) {
        if (c.data.datasets[i].label === 'Current price') { ds = c.data.datasets[i]; break; }
      }
      if (!ds || !ds.data || !ds.data.length) { pulse.classList.remove('is-visible'); return; }
      var pt = ds.data[0];
      var x = c.scales.x.getPixelForValue(pt.x);
      var y = c.scales.y.getPixelForValue(pt.y);
      if (x < c.chartArea.left  - 4 || x > c.chartArea.right  + 4 ||
          y < c.chartArea.top   - 4 || y > c.chartArea.bottom + 4) {
        pulse.classList.remove('is-visible');
        return;
      }
      pulse.style.left = x + 'px';
      pulse.style.top  = y + 'px';
      pulse.classList.add('is-visible');
    }
  };

  // ─── Formatters ───
  function fmtUsd(n) {
    if (n === 0) return '$0';   // a zero tax read "$0.0000" until 2026-10-14
    if (n >= 1e9) return '$' + (n/1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + Math.round(n).toLocaleString();
    if (n >= 1)   return '$' + n.toFixed(2);
    return '$' + n.toFixed(4);
  }
  function pct(n, decimals) {
    var d = (decimals === undefined) ? 1 : decimals;
    return (n*100).toFixed(d) + '%';
  }
  function daysSinceGenesis() {
    return (Date.now()/1000 - GENESIS_TS) / 86400;
  }

  // ─── Zone classifiers ───
  // LTV zones based on the RATIO of current LTV to liquidation threshold.
  // Threshold-relative is more meaningful than absolute bands when the
  // liquidation threshold itself varies by lender category — a 50% LTV
  // is conservative against a 95% predatory threshold (53% of trigger)
  // but aggressive against a 60% multisig threshold (83% of trigger).
  // <50% of trigger: Conservative — well buffered
  // 50-80% of trigger: Moderate — buffer narrowing
  // >=80% of trigger: Aggressive — close to forced sale
  function ltvZone(ltv, threshold) {
    if (!threshold || threshold <= 0) {
      // Defensive fallback to absolute bands if threshold isn't supplied
      if (ltv < 0.40) return { label: 'Conservative', cls: 'bas-zone-good' };
      if (ltv < 0.60) return { label: 'Moderate',     cls: 'bas-zone-warn' };
      return                 { label: 'Aggressive',   cls: 'bas-zone-bad'  };
    }
    var ratio = ltv / threshold;
    if (ratio < 0.50) return { label: 'Conservative', cls: 'bas-zone-good' };
    if (ratio < 0.80) return { label: 'Moderate',     cls: 'bas-zone-warn' };
    return                  { label: 'Aggressive',   cls: 'bas-zone-bad'  };
  }
  // Channel zones map liq-price-as-multiple-of-today's-trend to descriptive
  // labels matching the Question tab.
  function channelZone(liqRatio) {
    if (liqRatio < PL_FLOOR) {
      return { label: 'Below channel floor',  cls: 'bas-zone-good',
               hint:  'Bitcoin would need to break the long-term structural floor for liquidation.' };
    }
    if (liqRatio < 1.0) {
      return { label: 'Between floor and trend', cls: 'bas-zone-warn',
               hint:  'Price went beneath the floor only briefly through October 2026; some buffer but less than the conservative case.' };
    }
    if (liqRatio < PL_CEIL) {
      return { label: 'In upper channel', cls: 'bas-zone-bad',
               hint:  'Routine mean-reversion to trend would liquidate this position.' };
    }
    return { label: 'Above the upper band', cls: 'bas-zone-bad',
             hint:  'Liquidation requires bitcoin to be above 3× trend — very exposed.' };
  }
  // Current-price-relative-to-trend classifier — used by the interpretation
  // paragraph to know whether to surface the mean-reversion / borrow-low-
  // repay-high framing.
  function originationZone(currentRatio) {
    if (currentRatio < PL_FLOOR)  return 'deep-low';   // below floor — exceptional
    if (currentRatio < 0.85)      return 'low';         // bottom half of channel
    if (currentRatio < 1.4)       return 'mid';         // near trend
    if (currentRatio < 2.2)       return 'high';        // upper channel
    return 'extreme';                                   // near or above ceiling
  }

  function recompute() {
    var stack         = parseFloat(stackInput.value)         || 0;
    var price         = parseFloat(priceInput.value)         || 0;
    var loan          = parseFloat(loanInput.value)          || 0;
    var liqThreshold  = parseFloat(liqThresholdSlider.value) / 100;
    var rate          = parseFloat(rateSlider.value)         || 0;

    liqThresholdDisplay.textContent = liqThresholdSlider.value;
    rateDisplay.textContent         = rate.toFixed(1);
    if (bvsRateDisplay) bvsRateDisplay.textContent = rate.toFixed(1);

    if (stack <= 0 || price <= 0 || loan <= 0) {
      ltvOut.textContent = '—';
      liqPriceOut.textContent = '$—';
      liqDrawdownOut.textContent = '—';
      channelPosOut.textContent = '—';
      channelHintOut.textContent = '—';
      monthlyOut.textContent = '$—';
      annualOut.textContent = '$—';
      annualSubOut.textContent = '—';
      annualPctStackOut.textContent = '—';
      profileChecksOut.innerHTML = '<li class="bas-calc-profile-check bas-calc-profile-check-empty">Enter a stack size, current price, and loan amount above to see the loan profile.</li>';
      profileNotesOut.innerHTML = '';
      // Reset LTV meter so it doesn't show stale values
      if (ltvMeterFill)         ltvMeterFill.style.width = '0%';
      if (ltvMeterMarker)       ltvMeterMarker.style.left = (liqThreshold * 100) + '%';
      if (ltvMeterCurrentLabel) ltvMeterCurrentLabel.textContent = '—';
      if (ltvMeterTriggerLabel) ltvMeterTriggerLabel.textContent = pct(liqThreshold, 0);
      // Provider cards still render (they only need loan amount) but show em-dashes
      renderProviderCards(0);
      // Reset borrow-vs-sell area to empty state
      if (bvsBorrowHeadline) bvsBorrowHeadline.textContent = '— BTC';
      if (bvsSellHeadline)   bvsSellHeadline.textContent   = '— BTC';
      if (bvsHodlHeadline)   bvsHodlHeadline.textContent   = '— BTC';
      if (bvsBorrowRows)     bvsBorrowRows.innerHTML       = '';
      if (bvsSellRows)       bvsSellRows.innerHTML         = '';
      if (bvsHodlRows)       bvsHodlRows.innerHTML         = '';
      if (bvsVerdict) {
        bvsVerdict.className = 'bas-calc-bvs-verdict';
        bvsVerdict.innerHTML = '<p>Enter a stack, current price, and loan amount above to compare the two paths.</p>';
      }
      // Update displays for the bvs sliders even in empty state
      if (horizonDisplay)  horizonDisplay.textContent  = horizonSlider.value;
      if (capGainsDisplay) capGainsDisplay.textContent = capGainsSlider.value;
      LAST_RISK = null; LAST_BVS = null;
      renderLedger(null);
      return;
    }

    // ─── Risk math ───
    var stackUsd      = stack * price;
    var ltv           = loan / stackUsd;
    var liqPrice      = loan / (stack * liqThreshold);
    var drawdownToLiq = (price - liqPrice) / price;
    var todayDays     = daysSinceGenesis();
    var trendToday    = plPrice(todayDays);
    var liqRatio      = liqPrice / trendToday;
    var currentRatio  = price    / trendToday;

    // ─── Cost math ───
    // Simple interest, USD-denominated. The current page intentionally
    // doesn't model compound interest or amortization — most bitcoin-
    // backed loans are interest-only with bullet repayment, and the
    // editorial point we want to surface is the monthly carry burden
    // and the annual-cost-vs-stack-value ratio (the G > R comparison).
    var annualInterest    = loan * (rate/100);
    var monthlyInterest   = annualInterest / 12;
    var annualPctOfStack  = annualInterest / stackUsd;

    LAST_RISK = { ltv: ltv, liqPrice: liqPrice, drawdownToLiq: drawdownToLiq, liqRatio: liqRatio,
                  annualInterest: annualInterest, monthlyInterest: monthlyInterest };
    var lz = ltvZone(ltv, liqThreshold);
    var cz = channelZone(liqRatio);
    var oz = originationZone(currentRatio);

    // ─── Output cards ───
    ltvOut.textContent       = pct(ltv, 1);
    ltvZoneLabel.textContent = lz.label;
    ltvZoneLabel.className   = 'bas-calc-output-zone ' + lz.cls;

    // ─── LTV meter (visualizes current LTV vs. Liquidation LTV) ───
    // Cap displayed positions at 100% so the bar can't overflow even in
    // pathological inputs (loan > stack value, threshold > 100%).
    var ltvDisplayPct       = Math.min(Math.max(ltv * 100, 0), 100);
    var thresholdDisplayPct = Math.min(Math.max(liqThreshold * 100, 0), 100);
    var zoneKey             = lz.cls.replace('bas-zone-', ''); // good/warn/bad
    if (ltvMeterFill) {
      ltvMeterFill.style.width  = ltvDisplayPct + '%';
      ltvMeterFill.className    = 'bas-calc-ltv-meter-fill bas-calc-ltv-meter-fill-' + zoneKey;
    }
    if (ltvMeterMarker)        ltvMeterMarker.style.left = thresholdDisplayPct + '%';
    if (ltvMeterCurrentSwatch) ltvMeterCurrentSwatch.className =
        'bas-calc-ltv-meter-swatch bas-calc-ltv-meter-swatch-current bas-calc-ltv-meter-swatch-' + zoneKey;
    if (ltvMeterCurrentLabel)  ltvMeterCurrentLabel.textContent = pct(ltv, 1);
    if (ltvMeterTriggerLabel)  ltvMeterTriggerLabel.textContent = pct(liqThreshold, 0);

    liqPriceOut.textContent    = fmtUsd(liqPrice);
    liqDrawdownOut.textContent = 'BTC must fall ' + pct(drawdownToLiq, 0) +
      ' from $' + Math.round(price).toLocaleString();

    channelPosOut.textContent  = cz.label;
    channelPosOut.className    = 'bas-calc-output-value bas-calc-output-zoned ' + cz.cls;
    channelHintOut.textContent = cz.hint;

    monthlyOut.textContent        = fmtUsd(monthlyInterest);
    annualOut.textContent         = fmtUsd(annualInterest);
    annualSubOut.textContent      = pct(rate/100, 1) + ' of your $' +
      Math.round(loan).toLocaleString() + ' loan principal';
    annualPctStackOut.textContent = pct(annualPctOfStack, 2);

    // ─── Loan profile (check list + conditional strategic notes) ───
    var profile = generateLoanProfile({
      stack: stack, price: price, loan: loan, ltv: ltv,
      liqPrice: liqPrice, drawdownToLiq: drawdownToLiq,
      liqRatio: liqRatio, currentRatio: currentRatio,
      threshold: liqThreshold,
      annualInterest: annualInterest, monthlyInterest: monthlyInterest, rate: rate,
      annualPctOfStack: annualPctOfStack,
      lz: lz, cz: cz, oz: oz
    });
    profileChecksOut.innerHTML = profile.checksHtml;
    profileNotesOut.innerHTML  = profile.notesHtml;

    // ─── Provider category comparison cards ───
    renderProviderCards(loan);

    // ─── Borrow vs. sell comparison ───
    var horizonYears = parseFloat(horizonSlider.value) || 5;
    var costBasis    = parseFloat(costBasisInput.value);
    if (isNaN(costBasis) || costBasis < 0) costBasis = price; // fallback
    var taxRate      = parseFloat(capGainsSlider.value) || 0;
    horizonDisplay.textContent  = horizonYears;
    capGainsDisplay.textContent = taxRate;
    // Both scenarios are computed every pass: the block shows each one's
    // answer, and the cards and verdict show the one picked.
    if (!BVS_PICKED && PC) BVS_SC = PC.defaultFor(currentRatio);
    var bvsBoth = {};
    ['stay', 'trend'].forEach(function (sc) {
      bvsBoth[sc] = computeBorrowVsSell({
        stack: stack, currentPrice: price, loan: loan, rate: rate,
        horizonYears: horizonYears, costBasis: costBasis, taxRate: taxRate, scenario: sc,
        todayDays: todayDays
      });
    });
    var bvs = bvsBoth[BVS_SC];
    LAST_BVS = bvs;
    renderBorrowVsSell(bvs, {stack: stack, loan: loan, rate: rate});
    renderBvsBlock(bvsBoth, currentRatio, horizonYears, price);
    renderLedger({
      stack: stack, price: price, loan: loan, rate: rate, liqThreshold: liqThreshold, liqPrice: liqPrice,
      horizonYears: horizonYears, costBasis: costBasis, taxRate: taxRate, scenario: BVS_SC,
      todayDays: todayDays, m0: currentRatio
    });

    renderChart(price, liqPrice);
  }

  // ─── Loan-profile generator ───
  // Returns {checksHtml, notesHtml}. Checks are scannable status items
  // (one assertion + one detail line each, with green/amber/red icon
  // matching the underlying assessment). Notes are conditional editorial
  // blocks that only surface at specific PL positions where they add
  // genuine signal beyond the checks above.
  //
  // The checks adapt to four signals:
  //   1. LTV zone (conservative / moderate / aggressive)
  //   2. Channel zone of liquidation price (below floor → above ceiling)
  //   3. Origination zone (where current price sits in the channel)
  //   4. Cost vs. bitcoin's trailing CAGR — the G > R structural check
  //   5. Rate-vs-rehypothecation-zone — flags low rates as warning
  function generateLoanProfile(s) {
    var checks = [];

    // Check 1: LTV assessment — uses the threshold-relative zone so the
    // check, the output-card zone pill, and the LTV meter fill colour
    // all agree.
    var zoneKey = s.lz.cls.replace('bas-zone-', ''); // good/warn/bad
    var ltvDetail = pct(s.ltv, 1) + ' &mdash; with Liquidation LTV at ' + pct(s.threshold, 0) +
                    ', your LTV is ' + (s.ltv / s.threshold * 100).toFixed(0) + '% of the way to the trigger.';
    if (zoneKey === 'good') {
      checks.push({ status: 'good', title: 'LTV is conservative', detail: ltvDetail });
    } else if (zoneKey === 'warn') {
      checks.push({ status: 'warn', title: 'LTV is moderate', detail: ltvDetail });
    } else {
      checks.push({ status: 'bad', title: 'LTV is aggressive', detail: ltvDetail });
    }

    // Check 2: Channel position of liquidation price (the page's headline insight)
    if (s.liqRatio < PL_FLOOR) {
      checks.push({
        status: 'good',
        title: 'Liquidation price below channel floor',
        detail: 'Bitcoin would need to fall below the long-term floor, which price went beneath only briefly from 2011 to October 2026, for your position to liquidate.'
      });
    } else if (s.liqRatio < 1.0) {
      checks.push({
        status: 'warn',
        title: 'Liquidation price between floor and trend',
        detail: 'Price went beneath the floor only briefly through October 2026; some buffer, but a typical bear-market drawdown brings price close to your liquidation.'
      });
    } else if (s.liqRatio < PL_CEIL) {
      checks.push({
        status: 'bad',
        title: 'Liquidation price above the trend line',
        detail: 'Routine mean-reversion to trend would liquidate this position. Betting on continued strength rather than buying room to be wrong.'
      });
    } else {
      checks.push({
        status: 'bad',
        title: 'Liquidation price above the upper channel bound',
        detail: 'Bitcoin would need to remain at extended cycle-peak levels for this position to survive.'
      });
    }

    // Check 3: Origination position (only if user is at a favorable point)
    if (s.oz === 'deep-low') {
      checks.push({
        status: 'good',
        title: 'Originating below the Power Law floor',
        detail: 'A position the channel has reached only briefly across fifteen years. Mean reversion implies asymmetric upside on retained coins.'
      });
    } else if (s.oz === 'low') {
      checks.push({
        status: 'good',
        title: 'Originating in the lower half of the channel',
        detail: 'Mean reversion implies a high-expected-return window for retained coins.'
      });
    } else if (s.oz === 'high') {
      checks.push({
        status: 'warn',
        title: 'Originating in the upper half of the channel',
        detail: 'Less mean-reversion upside on retained coins; consider whether the loan can wait until a lower channel position.'
      });
    } else if (s.oz === 'extreme') {
      checks.push({
        status: 'bad',
        title: 'Originating near or above the upper band',
        detail: 'High-percentile zone &mdash; both liquidation risk and downside on retained coins are elevated.'
      });
    } // 'mid' produces no check — it's neither notable nor problematic

    // Check 4: G > R structural check
    var bitcoinCagrEstimate = 0.39; // editorial: trailing 4-year CAGR per Question tab
    if (s.rate > 0) {
      var rateDecimal = s.rate / 100;
      if (rateDecimal < bitcoinCagrEstimate * 0.5) {
        checks.push({
          status: 'good',
          title: 'Loan is structurally accretive',
          detail: 'At ' + pct(s.annualPctOfStack, 2) + ' annual cost on stack value, well below bitcoin\'s ~39% trailing four-year CAGR.'
        });
      } else if (rateDecimal < bitcoinCagrEstimate) {
        checks.push({
          status: 'warn',
          title: 'Loan is conditionally accretive',
          detail: pct(s.annualPctOfStack, 2) + ' annual cost vs ~39% trailing CAGR &mdash; accretive in average years, dilutive in flat/down cycles.'
        });
      } else {
        checks.push({
          status: 'bad',
          title: 'Loan cost approaches asset growth rate',
          detail: 'At ' + pct(rateDecimal, 1) + ' APR, the carrying cost is close to bitcoin\'s historical compound growth &mdash; the perpetual-borrowing math doesn\'t work here.'
        });
      }
    }

    // Check 5: Rehypothecation rate warning — only when rate is suspiciously low
    if (s.rate <= 5 && s.ltv > 0.30) {
      checks.push({
        status: 'bad',
        title: 'Rate is in the rehypothecation zone',
        detail: 'Tier-1 non-rehypothecating CeFi is 8&ndash;12%, multisig 12&ndash;16%. Rates below 5% are typically subsidized by re-lending your collateral &mdash; the failure mode that took down Celsius, BlockFi, Genesis, and Voyager.'
      });
    }

    // Render checks
    var checksHtml = checks.map(function(c){
      var icon = c.status === 'good' ? '&#10003;'
               : c.status === 'warn' ? '!'
               : c.status === 'bad'  ? '&#10005;'
               : 'i';
      return '<li class="bas-calc-profile-check">' +
        '<span class="bas-calc-profile-icon bas-calc-profile-icon-' + c.status + '">' + icon + '</span>' +
        '<span class="bas-calc-profile-body"><strong>' + c.title + '</strong>' +
        '<span class="bas-calc-profile-detail">' + c.detail + '</span></span>' +
        '</li>';
    }).join('\n');

    // ─── Strategic-context notes (conditional, editorial-register) ───
    // These surface only for the specific PL positions where they add
    // editorial value beyond what the checks already say.
    var notes = [];

    // Note 1: Mean-reversion opportunity-cost asymmetry — surfaces at
    // low or deep-low PL origination positions.
    if (s.oz === 'deep-low' || s.oz === 'low') {
      notes.push(
        '<div class="bas-calc-profile-note">' +
        '<span class="bas-calc-profile-note-label">An asymmetry worth seeing</span>' +
        '<p>Borrowing here is the trade where both sides of the asymmetry point the same way. You\'re not just maximally buffered from forced liquidation &mdash; you\'re also retaining the coin during what the channel suggests is a <strong>high-expected-return window</strong>. The alternative, selling some bitcoin to fund the same need at this price, would crystallize fiat at a structural low <em>and</em> forgo whatever mean-reversion upside the channel implies for the coins you didn\'t keep.</p>' +
        '</div>'
      );
    }

    // Note 2: Borrow-low / repay-high (Disciplined Rebalancing mirror)
    // — surfaces only at the very low end (below floor).
    if (s.oz === 'deep-low') {
      notes.push(
        '<div class="bas-calc-profile-note">' +
        '<span class="bas-calc-profile-note-label">A strategic variant worth knowing about</span>' +
        '<p>The channel position you\'re originating at is structurally the mirror image of <a href="/disciplined-rebalancing">Disciplined Rebalancing</a>. Where Disciplined Rebalancing sells at a high-percentile zone and rebuys at a low-percentile zone, the mirror is to <strong>borrow at a low-percentile zone and repay from appreciated bitcoin at a high-percentile zone</strong>. The destination is the same &mdash; <em>took some off the table at the top</em> &mdash; but the BAS variant gets you liquidity at the bottom along the way, and the psychological framing is sharper: paying off a loan with appreciated bitcoin at the cycle peak feels like <em>releasing an obligation</em> rather than <em>selling</em>. A structured surface for modeling this is on the calculator\'s roadmap.</p>' +
        '</div>'
      );
    }

    return { checksHtml: checksHtml, notesHtml: notes.join('\n') };
  }

  // ─── Provider-category interest comparison ───
  // Three live cards (plus one dismissed-DeFi reference card) showing
  // what the same loan principal costs per month and per year across
  // the three approved categories. Updates live with the loan-amount
  // input. Editorial point: the "no-rehypothecation premium" is the
  // visible cost of buying out of Celsius-style risk.
  var PROVIDER_SCENARIOS = [
    {
      name: 'Collaborative-custody multisig',
      apr: 14.0,
      tone: 'good',
      examples: 'Unchained, Anchor Watch, Onramp',
      note: 'Verifiable on-chain custody. The structural gold standard.'
    },
    {
      name: 'Tier-1 non-rehypothecating CeFi',
      apr: 10.0,
      tone: 'good',
      examples: 'Ledn, APX, Strike, Salt, Arch, Aven, Figure',
      note: 'Contractual no-rehypothecation at qualified custodians.'
    },
    {
      name: 'Rehypothecating CeFi',
      apr: 3.0,
      tone: 'bad',
      examples: 'Celsius, BlockFi (failed 2022)',
      note: 'Cheap rate, structural failure mode.',
      dismissed: 'Not recommended &mdash; see Question tab.'
    }
  ];

  function renderProviderCards(loan) {
    if (!providerCardsOut) return;
    var html = PROVIDER_SCENARIOS.map(function(p){
      var monthly = loan > 0 ? fmtUsd(loan * (p.apr / 100) / 12) : '$&mdash;';
      var annual  = loan > 0 ? fmtUsd(loan * (p.apr / 100))      : '$&mdash;';
      var toneCls = p.tone === 'good' ? 'bas-provider-card-good'
                  : p.tone === 'bad'  ? 'bas-provider-card-bad'
                  : 'bas-provider-card-neutral';
      var dismissedHtml = p.dismissed
        ? '<div class="bas-provider-card-dismissed">' + p.dismissed + '</div>'
        : '';
      return '<div class="bas-provider-card ' + toneCls + '">' +
        '<div class="bas-provider-card-name">' + p.name + '</div>' +
        '<div class="bas-provider-card-apr">' + p.apr.toFixed(1) + '% APR &middot; interest-only</div>' +
        '<div class="bas-provider-card-cost">' +
          '<span class="bas-provider-card-cost-label">Monthly</span>' +
          '<span class="bas-provider-card-cost-val">' + monthly + '</span>' +
        '</div>' +
        '<div class="bas-provider-card-cost">' +
          '<span class="bas-provider-card-cost-label">Annual</span>' +
          '<span class="bas-provider-card-cost-val">' + annual + '</span>' +
        '</div>' +
        '<div class="bas-provider-card-examples">' + p.examples + '</div>' +
        '<div class="bas-provider-card-note">' + p.note + '</div>' +
        dismissedHtml +
      '</div>';
    }).join('\n');
    providerCardsOut.innerHTML = html;
  }

  // ═══════ BORROW vs. SELL COMPARISON ═══════
  // Two paths over the chosen horizon, evaluated at bitcoin's price at the
  // end of the horizon on the scenario picked (args.scenario, see above):
  //
  // SELL PATH: sell BTC now to net `loan` after capital gains tax. The
  //   remaining BTC compounds with bitcoin's appreciation.
  //
  // BORROW PATH: keep the stack intact, pay simple interest at `rate`
  //   on the loan principal monthly. At horizon, sell just enough BTC at
  //   the future trend price to repay the loan (still after cap-gains tax,
  //   computed on the future gain). Cumulative interest paid is a fiat
  //   cost taken from external income, so it reduces terminal USD wealth
  //   but doesn't touch the BTC stack during the horizon.
  //
  // Future BTC price = the Power Law trend at the horizon × the scenario's
  // multiple there (today's for 'stay', 1.0 from year 3 for 'trend'). NOT a
  // forecast; the block above the cards says so and shows both.
  function computeBorrowVsSell(args) {
    var stack         = args.stack;
    var currentPrice  = args.currentPrice;
    var loan          = args.loan;
    var rate          = args.rate / 100;        // APR as decimal
    var horizonYears  = args.horizonYears;
    var costBasis     = args.costBasis;
    var taxRate       = args.taxRate / 100;     // % as decimal

    // Future price at end of horizon = trend there × the scenario's multiple.
    // args.todayDays (optional, 2026-11-26): recompute() passes its own, so the
    // cards, Loan Health and the Check the work ledger price from one "today".
    var todayDays  = (typeof args.todayDays === 'number') ? args.todayDays : (Date.now()/1000 - GENESIS_TS) / 86400;
    var futureDays = todayDays + horizonYears * 365.25;
    var trendNow   = plPrice(todayDays);
    var m0         = trendNow > 0 ? currentPrice / trendNow : 1;
    var futurePrice = plPrice(futureDays) * bvsScenarioMultiple(args.scenario, m0, horizonYears);

    // ─── Sell path ───
    // Net per BTC after tax (when selling now at currentPrice)
    var gainPerBtcNow = Math.max(0, currentPrice - costBasis);
    var taxPerBtcNow  = gainPerBtcNow * taxRate;
    var netPerBtcNow  = currentPrice - taxPerBtcNow;
    var btcSoldNow    = (netPerBtcNow > 0) ? loan / netPerBtcNow : Infinity;

    // ─── Borrow path ───
    // Cumulative simple interest paid over the horizon (interest-only loan)
    var cumulativeInterest = loan * rate * horizonYears;
    // At horizon, sell BTC at futurePrice to repay principal (after cap-gains tax
    // on the future gain — cost basis is still the original purchase price).
    var gainPerBtcFuture = Math.max(0, futurePrice - costBasis);
    var taxPerBtcFuture  = gainPerBtcFuture * taxRate;
    var netPerBtcFuture  = futurePrice - taxPerBtcFuture;
    var btcSoldAtHorizon = (netPerBtcFuture > 0) ? loan / netPerBtcFuture : Infinity;

    // Feasibility check — can the user actually sell enough BTC?
    var sellPathFeasible   = btcSoldNow    <= stack;
    var borrowPathFeasible = btcSoldAtHorizon <= stack;

    // BTC retained at end of horizon (in each path)
    var sellRetained   = sellPathFeasible   ? stack - btcSoldNow      : 0;
    var borrowRetained = borrowPathFeasible ? stack - btcSoldAtHorizon : 0;

    // Terminal USD wealth (at futurePrice). The borrow path subtracts
    // the cumulative interest paid (a fiat cost from external income).
    var sellTerminalWealth   = sellRetained   * futurePrice;
    var borrowTerminalWealth = borrowRetained * futurePrice - cumulativeInterest;

    // ─── HODL path (baseline / wealth-maximising reference) ───
    // No loan taken, no BTC sold. Mathematically always the highest
    // terminal wealth — by definition, since it sells zero BTC and pays
    // zero interest. The HODL card quantifies the opportunity cost of
    // any active decision: the wealth the user gives up to fund the
    // dollar need today.
    var hodlRetained        = stack;
    var hodlTerminalWealth  = stack * futurePrice;

    // Costs vs HODL — how much terminal wealth each active path gives up
    // to fund the dollar need today.
    var borrowCostVsHodl = hodlTerminalWealth - borrowTerminalWealth;
    var sellCostVsHodl   = hodlTerminalWealth - sellTerminalWealth;

    return {
      scenario:              args.scenario === 'trend' ? 'trend' : 'stay',
      futurePrice:           futurePrice,
      horizonYears:          horizonYears,
      loan:                  loan,
      sellPathFeasible:      sellPathFeasible,
      borrowPathFeasible:    borrowPathFeasible,
      hodl: {
        btcRetained:         hodlRetained,
        terminalWealth:      hodlTerminalWealth,
        btcSold:             0,
        taxPaid:             0,
        cumulativeInterest:  0
      },
      sell: {
        btcSold:             btcSoldNow,
        taxPaid:             btcSoldNow * taxPerBtcNow,
        btcRetained:         sellRetained,
        terminalWealth:      sellTerminalWealth,
        costVsHodl:          sellCostVsHodl
      },
      borrow: {
        cumulativeInterest:  cumulativeInterest,
        btcSoldAtHorizon:    btcSoldAtHorizon,
        taxPaid:             btcSoldAtHorizon * taxPerBtcFuture,
        btcRetained:         borrowRetained,
        terminalWealth:      borrowTerminalWealth,
        costVsHodl:          borrowCostVsHodl
      },
      deltaWealth:           borrowTerminalWealth - sellTerminalWealth,
      deltaBtcRetained:      borrowRetained - sellRetained
    };
  }

  // Render the borrow-vs-sell comparison cards + verdict line.
  function renderBorrowVsSell(r, ctx) {
    if (!bvsBorrowHeadline) return;

    // Helpers for BTC formatting (different from fmtUsd — show 4 sig figs of BTC)
    function fmtBtc(n) {
      if (!isFinite(n) || isNaN(n)) return '—';
      if (n >= 100)  return n.toFixed(2) + ' BTC';
      if (n >= 1)    return n.toFixed(3) + ' BTC';
      return n.toFixed(4) + ' BTC';
    }

    // ─── Scenario summary panel removed (now lives as a self-contained tab
    //     with its own inputs visible at the top). ───

    var horizonYears = r.horizonYears;

    // Helper for row labels with tooltips
    function tip(text) {
      return '<span class="help-tip" tabindex="0">?<span class="tip-content">' + text + '</span></span>';
    }

    // ─── HODL path card (leftmost — wealth-maximising baseline) ───
    // No loan, no sale, no tax, no interest. Full stack retained;
    // net wealth = stack × future trend price. The "Need funded today: $0"
    // row is the editorial point — HODL preserves wealth at the cost
    // of forgoing the spending power.
    bvsHodlHeadline.textContent = fmtBtc(r.hodl.btcRetained);
    bvsHodlRows.innerHTML =
      row('Need funded today'                       + tip('HODL doesn\'t fund any dollar need &mdash; the spending power that borrow and sell provide is forgone here. The trade-off: zero wealth cost, zero spending power today.'),                                                              '$0') +
      row('BTC sold'                                + tip('No bitcoin is sold in the HODL path. The stack is preserved intact through the horizon.'),                                                                                                                                            'None') +
      row('Cap gains tax'                           + tip('No taxable event in the HODL path. The cost basis carries forward unchanged.'),                                                                                                                                                       '$0') +
      row('Cumulative interest paid'                + tip('Zero &mdash; no loan is taken in the HODL path.'),                                                                                                                                                                                    '$0') +
      row('Net wealth at year ' + horizonYears      + tip('Stack at horizon &times; bitcoin&rsquo;s price at year ' + horizonYears + ' on the scenario showing (' + fmtUsd(r.futurePrice) + '). Mathematically the highest of the three paths &mdash; HODL sells nothing and pays nothing, so its terminal wealth is the wealth-maximising baseline.'), fmtUsd(r.hodl.terminalWealth), true);

    // ─── Borrow path card ───
    // Labels match HODL and Sell row-for-row for visual alignment; the
    // timing context ("at horizon" / "now") that was previously in the
    // label now lives in the tooltip for each row.
    bvsBorrowHeadline.textContent = fmtBtc(r.borrow.btcRetained);
    bvsBorrowRows.innerHTML =
      row('Need funded today'                       + tip('The loan amount, available in cash today. Same dollar figure as the sell path; HODL funds nothing.'),                                                                                                                                  fmtUsd(r.loan)) +
      row('BTC sold'                                + tip('Sold <strong>at horizon</strong> to repay the loan principal. At year ' + horizonYears + ', bitcoin&rsquo;s price on the scenario showing is higher than today, so fewer BTC are needed to repay the same loan amount &mdash; the structural advantage of borrowing.'), fmtBtc(r.borrow.btcSoldAtHorizon)) +
      row('Cap gains tax'                           + tip('Owed <strong>at horizon</strong> when those BTC are sold. Cost basis is your original purchase price; the gain is the difference between that and bitcoin&rsquo;s price at year ' + horizonYears + ' on the scenario showing.'),                                                            fmtUsd(r.borrow.taxPaid)) +
      row('Cumulative interest paid'                + tip('Total interest paid over the full horizon &mdash; paid from external income, not from the bitcoin stack. Simple-interest model: loan &times; rate &times; horizon years.'),                                                              fmtUsd(r.borrow.cumulativeInterest)) +
      row('Net wealth at year ' + horizonYears      + tip('Value of BTC retained at horizon (at bitcoin&rsquo;s price at year ' + horizonYears + ' on the scenario showing), minus the cumulative interest paid along the way. Always less than HODL &mdash; the difference is the wealth cost of funding the need this way.'),                        fmtUsd(r.borrow.terminalWealth), true);

    // ─── Sell path card ───
    bvsSellHeadline.textContent = fmtBtc(r.sell.btcRetained);
    bvsSellRows.innerHTML =
      row('Need funded today'                       + tip('The loan amount, available in cash today &mdash; net of capital gains tax. Same dollar figure as the borrow path; HODL funds nothing.'),                                                                                                fmtUsd(r.loan)) +
      row('BTC sold'                                + tip('Sold <strong>now</strong> at today\'s price to net the loan amount after capital gains tax. Higher cost basis or lower tax rate means fewer BTC sold.'),                                                                                  fmtBtc(r.sell.btcSold)) +
      row('Cap gains tax'                           + tip('Owed <strong>now</strong> when the BTC is sold. Will be $0 if your cost basis equals today\'s price (no embedded gain) &mdash; use the cost-basis presets to model typical cycle entry points.'),                                          fmtUsd(r.sell.taxPaid)) +
      row('Cumulative interest paid'                + tip('Zero &mdash; the sell path has no interest cost, because there\'s no loan.'),                                                                                                                                                            '$0') +
      row('Net wealth at year ' + horizonYears      + tip('Value of BTC retained at horizon (at bitcoin&rsquo;s price at year ' + horizonYears + ' on the scenario showing). Always less than HODL &mdash; the difference is the wealth cost of funding the need this way.'),                                                                          fmtUsd(r.sell.terminalWealth), true);

    // ─── Three-path verdict ───
    // Lead with HODL as the wealth-maximising reference, then compare
    // what each active path costs vs hodling, then recommend the
    // cheaper of the two active paths.
    var verdictCls, verdictHtml;
    if (!r.sellPathFeasible) {
      verdictCls = 'bas-calc-bvs-verdict-error';
      verdictHtml = '<p><strong>The sell path isn\'t feasible at these inputs.</strong> To net the loan amount after tax, you\'d need to sell more BTC than you have. HODL still preserves the full stack worth ' + fmtUsd(r.hodl.terminalWealth) + ' at year ' + horizonYears + '; borrowing remains an option if the need is real.</p>';
    } else if (!r.borrowPathFeasible) {
      verdictCls = 'bas-calc-bvs-verdict-error';
      verdictHtml = '<p><strong>The borrow path isn\'t feasible to fully unwind at horizon.</strong> Bitcoin\'s price at year ' + horizonYears + ' on this scenario isn\'t high enough to repay the loan from a fraction of your stack at the configured tax rate.</p>';
    } else if (!r.loan || r.loan === 0) {
      verdictCls = '';
      verdictHtml = '<p>Enter a loan amount above to model the cost of funding it three different ways.</p>';
    } else {
      // Both active paths feasible — three-way comparison
      var borrowCheaper = r.borrow.costVsHodl < r.sell.costVsHodl;
      var cheaperLabel  = borrowCheaper ? 'borrowing' : 'selling';
      var costlierLabel = borrowCheaper ? 'selling'   : 'borrowing';
      // Color classes for the cheaper/costlier active paths, used in the
      // "if the spending is real" line so the recommended path's color
      // matches its card and the matching number/word in the same color.
      var cheaperCls    = borrowCheaper ? 'verdict-borrow' : 'verdict-sell';
      var costlierCls   = borrowCheaper ? 'verdict-sell'   : 'verdict-borrow';
      var cheaperCost   = borrowCheaper ? r.borrow.costVsHodl : r.sell.costVsHodl;
      var costlierCost  = borrowCheaper ? r.sell.costVsHodl   : r.borrow.costVsHodl;
      var savings       = costlierCost - cheaperCost;
      verdictCls = borrowCheaper ? 'bas-calc-bvs-verdict-borrow-wins' : 'bas-calc-bvs-verdict-sell-wins';
      verdictHtml =
        '<p>At year <strong>' + horizonYears + '</strong>, ' +
        '<strong class="verdict-hodl">HODL</strong> preserves the most wealth: ' +
        '<strong class="verdict-hodl">' + fmtUsd(r.hodl.terminalWealth) + '</strong>. ' +
        'Any active path costs you wealth in exchange for the ' +
        fmtUsd(r.loan) + ' in spending power today &mdash; ' +
        'borrowing costs <strong class="verdict-borrow">' + fmtUsd(r.borrow.costVsHodl) + '</strong>; ' +
        'selling costs <strong class="verdict-sell">' + fmtUsd(r.sell.costVsHodl) + '</strong>.' +
        '</p><p style="margin-top:0.6rem;">' +
        '<em>If the spending is real: <span class="verdict-' + (borrowCheaper ? 'borrow' : 'sell') + '">' + cheaperLabel + '</span> is ' +
        '<strong class="' + cheaperCls + '">' + fmtUsd(savings) + ' cheaper</strong> than ' +
        '<span class="' + costlierCls + '">' + costlierLabel + '</span>. ' +
        'If the spending can wait, <span class="verdict-hodl">HODL</span> preserves the ' +
        '<strong class="verdict-hodl">' + fmtUsd(cheaperCost) + '</strong> ' +
        'the cheapest active path would otherwise cost &mdash; the true opportunity cost of the decision itself.</em>' +
        '</p>';
    }
    bvsVerdict.className = 'bas-calc-bvs-verdict ' + verdictCls;
    bvsVerdict.innerHTML = verdictHtml;
  }

  // ─── The two-scenario block above the cards (components/price-cases.njk) ───
  // Each half carries that scenario's answer to the page's question: which
  // active path is cheaper, by how much, at the horizon.
  function renderBvsBlock(both, m0, horizonYears, price) {
    if (!pcBas || !PC) return;
    function half(r) {
      if (!r.loan) return { num: '&mdash;', sub: 'enter a loan amount to compare' };
      if (!r.sellPathFeasible) return { num: '&mdash;', sub: 'the sell path isn&rsquo;t feasible at these inputs' };
      if (!r.borrowPathFeasible) return { num: '&mdash;', sub: 'the borrow path can&rsquo;t be unwound at year ' + horizonYears + ' on this path' };
      var d = r.borrow.terminalWealth - r.sell.terminalWealth;
      return { num: fmtUsd(Math.abs(d)),
               sub: (d >= 0 ? 'cheaper to borrow than to sell' : 'cheaper to sell than to borrow') + ' at year ' + horizonYears +
                    ' &middot; bitcoin at about ' + fmtUsd(r.futurePrice) };
    }
    var plan = { months: horizonYears * 12, phrase: horizonYears === 1 ? 'the whole year' : 'all ' + horizonYears + ' years', words: horizonYears + (horizonYears === 1 ? ' year' : ' years') };
    var sel = both[BVS_SC], T = PC.titles(m0);
    PC.render(pcBas, {
      mult: m0, selected: BVS_SC, plan: plan, drives: 'the three paths and the verdict below',
      values: { stay: half(both.stay), trend: half(both.trend) },
      showing: T[BVS_SC] + ': bitcoin goes from ' + fmtUsd(price) + ' today to about <strong>' + fmtUsd(sel.futurePrice) + '</strong> in year ' + horizonYears + ' (prices before inflation).'
    });
  }
  if (pcBas && PC) PC.bind(pcBas, function (k) {
    if (k !== 'stay' && k !== 'trend') return;
    BVS_PICKED = true; BVS_SC = k;
    recompute();
    // R7: a pick rides in the address bar; the URL-sync IIFE below keeps
    // unknown keys, so `sc` survives its writes.
    try {
      var params = new URLSearchParams(window.location.search);
      params.set('sc', k);
      window.history.replaceState(null, '', window.location.pathname + '?' + params.toString() + window.location.hash);
    } catch (e) {}
  });

  // ═══════ CHECK THE WORK (STYLE_GUIDE §6.49; shared/ledger.js) ═══════
  // Added 2026-11-26, the first page outside the real-estate series on the
  // shared ledger. computeBorrowVsSell() prices the three paths at the
  // horizon only; the ledger runs that same function at every whole year
  // from today to the horizon (horizonYears = t), so each row is what the
  // cards would show with the horizon set to that year and the last row IS
  // the cards. Loan Health's figures are the Today row (LTV, liquidation
  // price, fall to liquidation, liquidation against trend) and Year 1's
  // interest. Every other column is one line of arithmetic on the engine's
  // outputs, stated under the table. Nothing here changes a figure.
  var basLedgerEl = document.getElementById('basLedger');
  var LEDGER = null;                   // { args, spec }: the last one rendered, for basQA()
  var LAST_RISK = null, LAST_BVS = null; // what Loan Health and the cards last showed
  function ledgerRows(a) {
    var rows = [];
    for (var t = 0; t <= a.horizonYears; t++) {
      var r = computeBorrowVsSell({
        stack: a.stack, currentPrice: a.price, loan: a.loan, rate: a.rate,
        horizonYears: t, costBasis: a.costBasis, taxRate: a.taxRate, scenario: a.scenario,
        todayDays: a.todayDays
      });
      var p = r.futurePrice, trend = plPrice(a.todayDays + t * 365.25);
      rows.push({ t: t, price: p, trend: trend, r: r,
                  collateral: a.stack * p, ltv: a.loan / (a.stack * p),
                  fall: 1 - a.liqPrice / p, liqVsTrend: a.liqPrice / trend });
    }
    return rows;
  }
  function ledgerSpec(a) {
    var rows = ledgerRows(a), N = a.horizonYears, end = rows[rows.length - 1].r;
    var names = PC ? PC.names(a.m0) : { stay: 'Stays where it is against trend', trend: 'Returns to trend over 3 years' };
    var REV = PC ? PC.REVERT_YEARS : 3;
    var usd0 = function (v) { return '$' + Math.round(v).toLocaleString('en-US'); };
    var btcWords = function (v) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: 8 }) + ' BTC'; };
    var atN = 'at year ' + N, liqPct = Math.round(a.liqThreshold * 100) + '%';
    var mult0 = a.m0.toFixed(2) + '×';
    var year = { label: 'Year', unit: '', fmt: 'text', get: function (x) { return x.t === 0 ? 'Today' : 'Year ' + x.t; } };
    var priceHow = a.scenario === 'trend'
      ? 'The Power Law trend on that date times a multiple of trend that moves in a straight line from today’s ' + mult0 + ' to 1.0 over ' + REV + ' years, then stays at 1.0. Today’s row is the price you entered.'
      : 'The Power Law trend on that date times today’s multiple of trend (' + mult0 + '), which this scenario keeps every year. Today’s row is the price you entered.';
    var price = { label: 'Bitcoin price', unit: '$', fmt: 'usd', get: function (x) { return x.price; }, how: priceHow };
    var priceAgain = { label: 'Bitcoin price', unit: '$', fmt: 'usd', get: function (x) { return x.price; }, how: 'As on The loan tab.' };
    var interest = { label: 'Interest paid to date', unit: '$', fmt: 'usd', get: function (x) { return x.r.borrow.cumulativeInterest; },
      how: 'The loan times the interest rate times the years so far (simple interest). Year 1 is the Annual interest on Loan Health. It is paid from your income, not from the stack.' };
    var loanCols = [year, price,
      { label: 'Collateral value', unit: '$', fmt: 'usd', get: function (x) { return x.collateral; }, how: 'Your stack times that year’s bitcoin price.' },
      { label: 'Loan owed', unit: '$', fmt: 'usd', get: function () { return a.loan; }, how: 'The loan amount. The loan is interest-only, so the balance stays the same until it is repaid.' },
      { label: 'LTV', unit: '%', fmt: 'pct', get: function (x) { return x.ltv; },
        how: 'Loan owed divided by the collateral value. Today’s row is Your LTV on Loan Health. At the liquidation LTV (' + liqPct + ') or above, the lender would sell collateral; the comparison on this tab doesn’t model that, and Loan Health is where it is tested.' },
      { label: 'Fall to liquidation', unit: '%', fmt: 'pct', get: function (x) { return x.fall; },
        how: 'How far bitcoin can fall from that year’s price before the lender sells: 1 minus the liquidation price divided by that year’s price. Below zero, that year’s price is already under the liquidation price.' },
      { label: 'Liquidation price', unit: '$', fmt: 'usd', get: function () { return a.liqPrice; },
        how: 'The loan divided by your stack times the liquidation LTV, as on Loan Health. It stays the same because the loan and the stack do.' },
      { label: 'Liquidation price against trend', unit: '× trend', fmt: 'mult', get: function (x) { return x.liqVsTrend; },
        how: 'The liquidation price divided by the Power Law trend on that date. Under 0.42× it sits below the channel floor: bitcoin would have to break the floor before the lender sells.' },
      interest];
    var borrowCols = [year, priceAgain,
      { label: 'BTC sold to repay', unit: '₿', fmt: 'btc', get: function (x) { return x.r.borrow.btcSoldAtHorizon; },
        how: 'If the loan were repaid that year: the loan divided by what one bitcoin brings in after tax that year, which is the price less the tax rate times its gain over your cost basis.' },
      { label: 'Tax on that sale', unit: '$', fmt: 'usd', get: function (x) { return x.r.borrow.taxPaid; },
        how: 'The bitcoin sold times the tax rate times each one’s gain over your cost basis (none if there is no gain).' },
      { label: 'BTC retained', unit: '₿', fmt: 'btc', get: function (x) { return x.r.borrow.btcRetained; },
        how: 'Your stack less the bitcoin sold to repay; none if repaying would take more than the whole stack.' },
      { label: 'Value retained', unit: '$', fmt: 'usd', get: function (x) { return x.r.borrow.btcRetained * x.price; }, how: 'BTC retained times that year’s price.' },
      { label: 'Interest paid to date', unit: '$', fmt: 'usd', get: interest.get, how: 'As on The loan tab.' },
      { label: 'Net wealth if repaid that year', unit: '$', fmt: 'usd', get: function (x) { return x.r.borrow.terminalWealth; },
        how: 'Value retained less the interest paid to date: what the Borrow path card would show with the horizon set to that year. The last row is the card.' }];
    var sellCols = [year, priceAgain,
      { label: 'BTC sold', unit: '₿', fmt: 'btc', get: function (x) { return x.t === 0 ? x.r.sell.btcSold : null; },
        how: 'Sold today, at today’s price: the loan divided by what one bitcoin brings in after tax today. Nothing more is sold.' },
      { label: 'Tax on the sale', unit: '$', fmt: 'usd', get: function (x) { return x.t === 0 ? x.r.sell.taxPaid : null; },
        how: 'The bitcoin sold times the tax rate times each one’s gain over your cost basis (none if there is no gain).' },
      { label: 'BTC retained', unit: '₿', fmt: 'btc', get: function (x) { return x.r.sell.btcRetained; },
        how: 'Your stack less the bitcoin sold today; none if the sale would take more than the whole stack.' },
      { label: 'Value retained', unit: '$', fmt: 'usd', get: function (x) { return x.r.sell.terminalWealth; },
        how: 'BTC retained times that year’s price. The last row is the Sell path card’s net wealth.' }];
    var sideCols = [year,
      { label: 'Just HODL', unit: '$', fmt: 'usd', get: function (x) { return x.r.hodl.terminalWealth; }, how: 'Your whole stack times that year’s price: nothing sold, no interest.' },
      { label: 'Borrow path', unit: '$', fmt: 'usd', get: function (x) { return x.r.borrow.terminalWealth; }, how: 'The Borrow path tab’s last column for that year.' },
      { label: 'Sell path', unit: '$', fmt: 'usd', get: function (x) { return x.r.sell.terminalWealth; }, how: 'The Sell path tab’s last column for that year.' },
      { label: 'Borrow minus sell', unit: '$', fmt: 'usd', get: function (x) { return x.r.borrow.terminalWealth - x.r.sell.terminalWealth; },
        how: 'Borrow path minus Sell path in the same row. In the last row it is the figure in the scenario block above: how much cheaper one path is than the other.' },
      { label: 'Cheaper', unit: '', fmt: 'text', get: function (x) {
          if (!x.r.sellPathFeasible) return 'sell not feasible';
          if (!x.r.borrowPathFeasible) return 'borrow not feasible';
          var d = x.r.borrow.terminalWealth - x.r.sell.terminalWealth;
          return Math.abs(d) < 0.5 ? 'level' : d > 0 ? 'borrowing' : 'selling'; },
        how: 'Borrowing where Borrow minus sell is above zero, selling where it is below. Not feasible where a path needs more bitcoin than the stack, as the cards say.' }];
    var inputs = [
      ['Bitcoin stack', btcWords(a.stack)], ['Bitcoin price today', usd0(a.price)],
      ['Power Law trend today', usd0(rows[0].trend) + ' (bitcoin at ' + mult0 + ' trend)'],
      ['Loan', usd0(a.loan)], ['Interest rate', a.rate.toFixed(1) + '% a year, interest only'],
      ['Liquidation LTV', liqPct + ' (set on Loan Health)'], ['Years to the horizon', String(N)],
      ['Cost basis', usd0(a.costBasis) + ' a bitcoin'], ['Capital gains tax rate', a.taxRate + '%'],
      ['Bitcoin’s price', names[a.scenario]],
      ['Today', new Date((GENESIS_TS + a.todayDays * 86400) * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]];
    return {
      hint: 'year by year, and the three paths ' + atN,
      inputs: inputs.map(function (m) { return { label: m[0], value: m[1] }; }),
      note: 'Dollars of each year (before inflation), on the scenario showing: <strong>' + names[a.scenario] + '</strong>. Each row runs the comparison with the horizon set to that year, so the last row is the three cards above.',
      tabs: [{ id: 'loan', label: 'The loan', columns: loanCols, rows: rows },
             { id: 'borrow', label: 'Borrow path', columns: borrowCols, rows: rows },
             { id: 'sell', label: 'Sell path', columns: sellCols, rows: rows },
             { id: 'side', label: 'Side by side', columns: sideCols, rows: rows }],
      final: { title: 'At year ' + N, csvTitle: 'At year ' + N + ' (USD, nominal; bitcoin in BTC)', howTitle: 'How the three paths ' + atN + ' are worked out',
        cols: ['Just HODL', 'Borrow path', 'Sell path'], rows: [
          { label: 'Need funded today', values: [0, a.loan, a.loan], how: 'The loan, in cash today: borrowed, or raised by selling bitcoin and paying the tax. HODL funds nothing.' },
          { label: 'BTC sold', fmt: 'btc', values: [0, end.borrow.btcSoldAtHorizon, end.sell.btcSold], how: 'Borrow path: sold ' + atN + ' to repay the loan. Sell path: sold today.' },
          { label: 'Cap gains tax', values: [0, end.borrow.taxPaid, end.sell.taxPaid], how: 'The tax on those sales: the tax rate times each bitcoin’s gain over your cost basis.' },
          { label: 'Cumulative interest paid', values: [0, end.borrow.cumulativeInterest, 0], how: 'The loan times the interest rate times ' + N + (N === 1 ? ' year' : ' years') + ', paid from income.' },
          { label: 'BTC retained', fmt: 'btc', values: [end.hodl.btcRetained, end.borrow.btcRetained, end.sell.btcRetained], how: 'Your stack less the bitcoin sold: the large figure on each card.' },
          { label: 'Net wealth ' + atN, values: [end.hodl.terminalWealth, end.borrow.terminalWealth, end.sell.terminalWealth], strong: true,
            card: 'The Net wealth row on each card above', how: 'BTC retained times bitcoin’s price ' + atN + ', less the interest paid on the borrow path.' },
          { label: 'Cost against HODL', values: [0, end.borrow.costVsHodl, end.sell.costVsHodl], how: 'HODL’s net wealth less this path’s: the two costs the verdict compares.' }
        ] },
      csv: { filename: 'borrowing-against-your-stack.csv', meta: [
        ['Last Coin Standing', 'Borrowing Against Your Stack: Borrow vs. Sell vs. HODL'],
        ['Amounts', 'nominal USD (before inflation); bitcoin in BTC'],
        ['Live scenario URL', function () { return window.location.href; }]] }
    };
  }
  function renderLedger(a) {
    if (!basLedgerEl || !window.Ledger) return;
    if (!a) { LEDGER = null; basLedgerEl.innerHTML = ''; basLedgerEl._ledgerSpec = null; return; }
    LEDGER = { args: a, spec: ledgerSpec(a) };
    window.Ledger.render(basLedgerEl, LEDGER.spec);
  }

  // ─── QA (console: basQA()) ───
  // The live ledger against what Loan Health and the cards show, every row's
  // arithmetic, and the same identities across scenarios, horizons and the
  // infeasible cases, run through the engine directly.
  window.basQA = function () {
    var out = [], near = function (x, y) { return Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(x), Math.abs(y)); };
    function rowsHold(sp, a) {
      var ok = true, rows = sp.tabs[0].rows;
      sp.tabs.forEach(function (t) { ok = ok && t.rows.length === a.horizonYears + 1; });
      rows.forEach(function (x) {
        var tr = plPrice(a.todayDays + x.t * 365.25), m = x.price / tr;
        ok = ok && near(x.collateral, a.stack * x.price) && near(x.ltv * x.collateral, a.loan)
          && near(x.r.hodl.terminalWealth, a.stack * x.price)
          && near(x.r.sell.terminalWealth, x.r.sell.btcRetained * x.price)
          && near(x.r.borrow.terminalWealth, x.r.borrow.btcRetained * x.price - x.r.borrow.cumulativeInterest)
          && near(x.r.borrow.cumulativeInterest, a.loan * a.rate / 100 * x.t)
          && (a.scenario === 'trend' ? (x.t >= 3 ? near(m, 1) : near(m, a.m0 + (1 - a.m0) * x.t / 3)) : near(m, a.m0));
      });
      return ok && near(rows[0].price, a.price);
    }
    if (!LAST_BVS) out.push(['empty inputs: no panel, as the cards show none', !!basLedgerEl && basLedgerEl.innerHTML === '']);
    else out.push(['ledger: the Check the work order and clarity additions', !!(window.Ledger && basLedgerEl && window.Ledger.check(basLedgerEl, { side: false }))]);
    if (LEDGER && LAST_BVS && LAST_RISK) {
      var sp = LEDGER.spec, a = LEDGER.args, rows = sp.tabs[0].rows, today = rows[0];
      var net = sp.final.rows.filter(function (r) { return r.card; })[0], side = sp.tabs[3];
      var lastSide = rows[rows.length - 1];
      out.push(['books: the marked row = the three cards', near(net.values[0], LAST_BVS.hodl.terminalWealth) && near(net.values[1], LAST_BVS.borrow.terminalWealth) && near(net.values[2], LAST_BVS.sell.terminalWealth)]);
      out.push(['books: Side by side, last row = the cards and the block', near(side.columns[1].get(lastSide), LAST_BVS.hodl.terminalWealth) && near(side.columns[2].get(lastSide), LAST_BVS.borrow.terminalWealth)
        && near(side.columns[3].get(lastSide), LAST_BVS.sell.terminalWealth) && near(side.columns[4].get(lastSide), LAST_BVS.deltaWealth)]);
      out.push(['books: Today row = Loan Health (LTV, liquidation price, fall, against trend)', near(today.ltv, LAST_RISK.ltv) && near(LEDGER.args.liqPrice, LAST_RISK.liqPrice)
        && near(today.fall, LAST_RISK.drawdownToLiq) && near(today.liqVsTrend, LAST_RISK.liqRatio)]);
      out.push(['books: Year 1 interest = Loan Health’s annual interest', rows.length < 2 || near(rows[1].r.borrow.cumulativeInterest, LAST_RISK.annualInterest)]);
      out.push(['rows: every identity holds on the live ledger', rowsHold(sp, a)]);
      var csv = window.Ledger.toCsv(sp);
      out.push(['csv: settings, four tables, their sentences, the year-' + a.horizonYears + ' block', csv.indexOf('# Last Coin Standing,') === 0 && (csv.match(/^# Input: /gm) || []).length === sp.inputs.length
        && (csv.match(/^# How each column is worked out$/gm) || []).length === 4 && csv.indexOf('# At year ' + a.horizonYears + ' (USD') > 0 && (csv.match(/^"(Today|Year \d+)",/gm) || []).length === 4 * (a.horizonYears + 1)]);
    } else if (LAST_BVS) out.push(['live ledger rendered', false]);
    // Vectors through the engine: both scenarios, short and long horizons,
    // a gain to tax, and each path infeasible in turn.
    var TD = daysSinceGenesis(), tr0 = plPrice(TD), V = [
      { stack: 1, price: tr0 * 0.53, loan: 10000, rate: 10, liqThreshold: 0.8, horizonYears: 5, costBasis: tr0 * 0.53, taxRate: 20, scenario: 'stay' },
      { stack: 1, price: tr0 * 0.53, loan: 10000, rate: 10, liqThreshold: 0.8, horizonYears: 5, costBasis: 20000, taxRate: 20, scenario: 'trend' },
      { stack: 2.5, price: tr0 * 0.53, loan: 50000, rate: 14, liqThreshold: 0.77, horizonYears: 1, costBasis: 30000, taxRate: 15, scenario: 'trend' },
      { stack: 0.5, price: tr0 * 1.8, loan: 25000, rate: 3, liqThreshold: 0.8, horizonYears: 15, costBasis: 5000, taxRate: 0, scenario: 'trend' },
      { stack: 0.1, price: tr0 * 0.53, loan: 10000, rate: 10, liqThreshold: 0.8, horizonYears: 5, costBasis: 5000, taxRate: 20, scenario: 'stay' },
      { stack: 0.05, price: tr0 * 1.6, loan: 4000, rate: 20, liqThreshold: 0.95, horizonYears: 3, costBasis: 1000, taxRate: 40, scenario: 'trend' }];
    V.forEach(function (v, i) {
      v.todayDays = TD; v.m0 = v.price / tr0; v.liqPrice = v.loan / (v.stack * v.liqThreshold);
      var sp = ledgerSpec(v), end = computeBorrowVsSell({ stack: v.stack, currentPrice: v.price, loan: v.loan, rate: v.rate, horizonYears: v.horizonYears,
        costBasis: v.costBasis, taxRate: v.taxRate, scenario: v.scenario, todayDays: TD });
      var fin = sp.final.rows.filter(function (r) { return r.card; })[0];
      var finite = sp.tabs.every(function (t) { return t.rows.every(function (x) { return t.columns.every(function (c) { var g = c.get(x); return g === null || typeof g === 'string' || isFinite(g); }); }); });
      out.push(['vector ' + (i + 1) + ' (' + v.scenario + ', ' + v.horizonYears + 'y' + (!end.sellPathFeasible ? ', sell infeasible' : '') + (!end.borrowPathFeasible ? ', borrow infeasible' : '') + ')',
        rowsHold(sp, v) && finite && near(fin.values[1], end.borrow.terminalWealth) && near(fin.values[2], end.sell.terminalWealth) && near(fin.values[0], end.hodl.terminalWealth)]);
    });
    var ok = out.every(function (x) { return x[1]; });
    if (window.console) console.table(out.map(function (x) { return { check: x[0], pass: x[1] }; }));
    return { ok: ok, checks: out };
  };

  // Helper for building rows in the comparison cards
  function row(label, value, terminal) {
    return '<div class="bas-calc-bvs-row">' +
      '<span class="bas-calc-bvs-row-label">' + label + '</span>' +
      '<span class="' + (terminal ? 'bas-calc-bvs-row-value-terminal' : 'bas-calc-bvs-row-value') + '">' + value + '</span>' +
    '</div>';
  }

  // ═══════ CHART ═══════
  function renderChart(currentPrice, liqPrice) {
    if (typeof Chart === 'undefined') return;
    var canvas = document.getElementById('basChannelChart');
    if (!canvas) return;

    var todayDays  = daysSinceGenesis();
    var futureDays = todayDays + 365 * 5;
    var startDays  = 592;

    var floorPts = [], trendPts = [], upperPts = [];
    for (var d = startDays; d <= futureDays; d += 30) {
      var t = plPrice(d);
      floorPts.push({ x: d, y: t * PL_FLOOR });
      trendPts.push({ x: d, y: t });
      upperPts.push({ x: d, y: t * PL_CEIL });
    }
    var historyPts    = PL_DATA.map(function(p){ return { x: p[0], y: p[1] }; });
    var currentDot    = [{ x: todayDays, y: currentPrice }];
    var liqLineSeries = [{ x: todayDays, y: liqPrice }, { x: futureDays, y: liqPrice }];

    if (chart) chart.destroy();

    chart = new Chart(canvas, {
      type: 'line',
      data: {
        datasets: [
          { label: 'Upper (3.0× trend)', data: upperPts,
            borderColor: 'rgba(224,148,34,0.35)', borderWidth: 1,
            borderDash: [4,3], pointRadius: 0, fill: false, order: 4 },
          { label: 'Trend',               data: trendPts,
            borderColor: 'rgba(224,148,34,0.6)',  borderWidth: 1.4,
            pointRadius: 0, fill: false, order: 3 },
          { label: 'Floor (0.42× trend)', data: floorPts,
            borderColor: 'rgba(224,148,34,0.35)', borderWidth: 1,
            borderDash: [4,3], pointRadius: 0, fill: false, order: 4 },
          { label: 'Historical price',    data: historyPts,
            borderColor: 'rgba(232,224,212,0.8)', borderWidth: 1.5,
            pointRadius: 0, fill: false, order: 2 },
          { label: 'Liquidation price',   data: liqLineSeries,
            borderColor: '#c0392b', borderWidth: 2,
            borderDash: [6,4], pointRadius: 0, fill: false, order: 1 },
          { label: 'Current price',       data: currentDot,
            borderColor: '#e09422', backgroundColor: '#e09422',
            pointRadius: 0, pointHoverRadius: 0, showLine: false, order: 0 }
        ]
      },
      plugins: [lcsPulsePlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'x', axis: 'x', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            titleColor: 'rgba(255,255,255,0.9)',
            bodyColor: 'rgba(255,255,255,0.8)',
            borderColor: 'rgba(224,148,34,0.4)',
            borderWidth: 1,
            callbacks: {
              title: function(items){
                if(!items.length) return '';
                var d = new Date(GENESIS_TS*1000 + items[0].parsed.x*86400*1000);
                return d.toLocaleDateString('en-US', { year:'numeric', month:'short' });
              },
              label: function(item){
                var label = item.dataset.label;
                var v = item.parsed.y;
                if (v >= 1000) return label + ': $' + Math.round(v).toLocaleString();
                if (v >= 1)    return label + ': $' + v.toFixed(2);
                return label + ': $' + v.toFixed(4);
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            min: startDays,
            max: futureDays,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              maxTicksLimit: 12,
              callback: function(v){
                var date = new Date(GENESIS_TS*1000 + v*86400*1000);
                return date.getFullYear();
              }
            }
          },
          y: {
            type: 'logarithmic',
            min: 0.05,
            max: 1e7,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              callback: function(v){
                if (v >= 1e6) return '$' + (v/1e6) + 'M';
                if (v >= 1e3) return '$' + (v/1e3) + 'K';
                if (v >= 1)   return '$' + v;
                return '$' + v;
              }
            }
          }
        }
      }
    });
  }

  // ─── Wire tab-specific inputs to recompute ───
  // Shared inputs (stack / price / loan / rate) are wired by the
  // state-sync layer below (where the mirror + persist + recompute
  // happens in one event handler). Only tab-specific inputs are wired
  // directly to recompute here:
  //   Loan-Health-only: liquidation threshold
  //   BvS-only: horizon, cost basis, capital gains tax
  ['input','change'].forEach(function(evt){
    [liqThresholdSlider, horizonSlider, costBasisInput, capGainsSlider].forEach(function(el){
      if (el) el.addEventListener(evt, recompute);
    });
  });

  // ─── Preset buttons set rate + threshold and recompute ───
  // Each preset gives a coherent provider scenario: rate AND liquidation
  // LTV move together to reflect typical category values. The user can
  // still drag either slider afterward to override.
  presetBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var r = parseFloat(btn.dataset.rate);
      var t = parseFloat(btn.dataset.threshold);
      if (!isNaN(r)) rateSlider.value         = r;
      if (!isNaN(t)) liqThresholdSlider.value = t;
      // Visual feedback: mark the active preset
      presetBtns.forEach(function(b){ b.classList.remove('bas-calc-preset-active'); });
      btn.classList.add('bas-calc-preset-active');
      recompute();
    });
  });

  // ─── State-sync layer for shared inputs across the two calculator tabs ───
  // BTC stack, current price, loan amount, and interest rate appear on
  // BOTH the Loan Health tab (basX inputs) and the Borrow vs. Sell tab
  // (bvsX inputs). The sync layer:
  //   1. Hydrates each pair from localStorage on page load
  //   2. Mirrors any change on one input into its pair partner
  //   3. Persists each change to localStorage
  //   4. Triggers recompute() so outputs on both tabs stay current
  //
  // Tab-specific inputs (Liquidation LTV on Loan Health; Horizon /
  // Cost basis / Cap gains tax on BvS) are not synced.
  var SHARED_PAIRS = [
    { key: 'bas_stack',     ids: ['basBtcStack',     'bvsBtcStack']     },
    { key: 'bas_price',     ids: ['basBtcPrice',     'bvsBtcPrice']     },
    { key: 'bas_loan',      ids: ['basLoanAmount',   'bvsLoanAmount']   },
    { key: 'bas_rate',      ids: ['basInterestRate', 'bvsInterestRate'] }
  ];

  // Hydrate shared inputs from localStorage (if present, and only if non-empty)
  SHARED_PAIRS.forEach(function(p){
    try {
      var v = window.localStorage && localStorage.getItem(p.key);
      if (v !== null && v !== '' && !isNaN(parseFloat(v))) {
        p.ids.forEach(function(id){
          var el = document.getElementById(id);
          if (el) el.value = v;
        });
      }
    } catch (e) { /* localStorage disabled / quota / etc. — fall back to defaults */ }
  });

  // Wire bidirectional sync: change in one input updates its pair partner,
  // persists to localStorage, and re-runs recompute.
  SHARED_PAIRS.forEach(function(p){
    p.ids.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      ['input','change'].forEach(function(evt){
        el.addEventListener(evt, function(){
          // Persist
          try { localStorage.setItem(p.key, el.value); } catch (e) {}
          // Mirror to pair partner(s)
          p.ids.forEach(function(otherId){
            if (otherId === id) return;
            var other = document.getElementById(otherId);
            if (other && other.value !== el.value) other.value = el.value;
          });
          recompute();
        });
      });
    });
  });

  // ─── Cost-basis presets ───
  // Quick-pick entry points for typical bitcoiner accumulation scenarios.
  // "today" resolves to the current price input (no embedded gain);
  // the others are anchored to recognizable cycle moments.
  cbPresetBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var key = btn.dataset.cb;
      var raw = CB_PRESETS[key];
      var val = (typeof raw === 'function') ? raw() : raw;
      if (val > 0) {
        costBasisInput.value = val;
        // A preset click IS a reader choice — drop the auto-fill mark so the URL
        // writer starts carrying `cb` (these set .value directly, no input event).
        delete costBasisInput.dataset.autofilled;
        cbPresetBtns.forEach(function(b){ b.classList.remove('bas-calc-bvs-cb-preset-active'); });
        btn.classList.add('bas-calc-bvs-cb-preset-active');
        recompute();
      }
    });
  });

  // ─── BvS rate-preset buttons ───
  // Sets rate ONLY (BvS tab has no Liquidation LTV slider; that's owned
  // by Loan Health). Rate change syncs to Loan Health via the shared-pair
  // wiring above.
  var bvsPresetBtns = document.querySelectorAll('.bas-calc-preset-bvs');
  bvsPresetBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      var r = parseFloat(btn.dataset.rate);
      if (isNaN(r)) return;
      var bvsRate = document.getElementById('bvsInterestRate');
      var basRate = document.getElementById('basInterestRate');
      if (bvsRate) bvsRate.value = r;
      if (basRate) basRate.value = r;
      try { localStorage.setItem('bas_rate', r); } catch (e) {}
      bvsPresetBtns.forEach(function(b){ b.classList.remove('bas-calc-preset-active'); });
      btn.classList.add('bas-calc-preset-active');
      recompute();
    });
  });

  // Lazy chart render on tab activation. Two paths: Loan Health (which
  // hosts the chart) and Borrow vs. Sell (which doesn't, but still needs
  // recompute so its comparison cards update if the user lands directly
  // via URL fragment).
  var lhTabBtn  = document.querySelector('.tab-btn[data-tab="loan-health"]');
  var bvsTabBtn = document.querySelector('.tab-btn[data-tab="borrow-vs-sell"]');
  if (lhTabBtn)  lhTabBtn.addEventListener('click',  function(){ setTimeout(recompute, 30); });
  if (bvsTabBtn) bvsTabBtn.addEventListener('click', function(){ setTimeout(recompute, 30); });

  // If either calculator tab is the initial active tab (URL hash
  // deep-link), compute immediately so outputs aren't blank.
  var lhTab  = document.getElementById('tab-loan-health');
  var bvsTab = document.getElementById('tab-borrow-vs-sell');
  if ((lhTab  && lhTab.classList.contains('active')) ||
      (bvsTab && bvsTab.classList.contains('active'))) {
    recompute();
  }

  // ─── Print population — copy live screen state into print-only blocks ──
  // Triggered on beforeprint so the printed PDF reflects current sliders.
  // Pattern documented in STYLE_GUIDE §6.16. Scope: Loan Health tab only;
  // Borrow vs. Sell and The Math tabs degrade to printing on-screen UI
  // with chrome hidden (acceptable — see TECH_DEBT for full coverage).
  function bindPrintPopulation() {
    function txtById(id) {
      var el = document.getElementById(id);
      return el ? el.textContent.trim().replace(/\s+/g, ' ') : '—';
    }
    function fmtUSD(n) {
      var v = parseFloat(n);
      if (isNaN(v)) return '—';
      return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    function rowHtml(label, value) {
      return '<tr><td>' + label + '</td><td>' + value + '</td></tr>';
    }

    function populate() {
      // Date in header
      var dateEl = document.getElementById('printDate');
      if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      }

      // Inputs table (5 rows — read live input values)
      var stack    = stackInput ? stackInput.value : '—';
      var price    = priceInput ? fmtUSD(priceInput.value) : '—';
      var loan     = loanInput  ? fmtUSD(loanInput.value)  : '—';
      var liqThr   = liqThresholdSlider ? (liqThresholdSlider.value + '%') : '—';
      var rate     = rateSlider ? (rateSlider.value + '%')                 : '—';
      var inputsBody = document.getElementById('printInputsBody');
      if (inputsBody) {
        inputsBody.innerHTML =
          rowHtml('Bitcoin stack',                  stack + ' BTC') +
          rowHtml('Current BTC price',              price) +
          rowHtml('Loan amount',                    loan) +
          rowHtml('Liquidation threshold (LTV)',    liqThr) +
          rowHtml('Interest rate (APR)',            rate);
      }

      // Outputs table (live state from computed-output spans)
      var ltv          = txtById('basLtvOut');
      var ltvZone      = txtById('basLtvZone');
      var liqPrice     = txtById('basLiqPrice');
      var liqDrawdown  = txtById('basLiqDrawdown');
      var channelPos   = txtById('basChannelPos');
      var channelHint  = txtById('basChannelHint');
      var monthly      = txtById('basMonthlyInterest');
      var annual       = txtById('basAnnualInterest');
      var pctStack     = txtById('basAnnualPctStack');

      var outputsBody = document.getElementById('printOutputsBody');
      if (outputsBody) {
        outputsBody.innerHTML =
          rowHtml('Current LTV',           ltv + (ltvZone && ltvZone !== '—' ? ' (' + ltvZone + ')' : '')) +
          rowHtml('Liquidation price',     liqPrice + (liqDrawdown && liqDrawdown !== '—' ? ' — ' + liqDrawdown : '')) +
          rowHtml('Channel position',      channelPos + (channelHint && channelHint !== '—' ? ' — ' + channelHint : '')) +
          rowHtml('Monthly interest',      monthly) +
          rowHtml('Annual interest',       annual + (pctStack && pctStack !== '—' ? ' (' + pctStack + ' of stack)' : ''));
      }
    }

    // Run on any print intent — covers Cmd/Ctrl-P, browser menu, system print.
    window.addEventListener('beforeprint', populate);
    // Some browsers (Safari mobile) don't fire beforeprint reliably; pre-
    // populate once at load so data is in place even if the event never
    // fires. Inputs that change after load won't update without beforeprint
    // — acceptable trade-off for cross-browser robustness.
    populate();
  }

  bindPrintPopulation();
})();

// ═════════════════════════════════════════════════════════════════════
// CAGR-VS-RATES CHART — Bitcoin 4-year rolling CAGR vs lending-rate bands,
// with Power Law trend CAGR overlaid for context. All-time / Recent 2y
// toggle. Dynamic as-of callout values from PL_DATA.
//
// Two stories visible:
//   1. Power Law trend CAGR (dashed amber) — what the model predicts
//      the growth rate to be from the channel position, independent of
//      where current price sits inside the channel.
//   2. Realized 4-year rolling CAGR (solid amber) — what bitcoin
//      actually did over each trailing 4-year window.
//
// The gap between them = how far below (or above) trend bitcoin's
// price sat at each historical point. Currently bitcoin is ~0.59× trend,
// so realized CAGR is well below trend-implied CAGR — but the structural
// growth rate per the model remains intact.
//
// Computed from PL_DATA at page-load time so the trailing edge stays
// fresh with each monthly refresh (MONTHLY_REFRESH_CHECKLIST.md §1).
// ═════════════════════════════════════════════════════════════════════
(function(){
  var canvas = document.getElementById('cagrVsRatesChart');
  if (!canvas || typeof Chart === 'undefined' || typeof PL_DATA === 'undefined') return;

  var WINDOW_DAYS       = 1460;  // 4 years
  var X_MIN_ALLTIME     = 2400;  // ~late 2015 — skip extreme early outliers
  var Y_MAX_ALLTIME     = 250;   // clip; early peaks exceed
  var Y_MAX_RECENT      = 70;    // tight zoom for the modern compression
  var RECENT_WINDOW_DAYS = 730;   // ~2 years

  // ── Compute realized 4-year rolling CAGR series from PL_DATA samples
  function computeRealizedCAGR() {
    var out = [];
    for (var i = 0; i < PL_DATA.length; i++) {
      var dNow = PL_DATA[i][0], pNow = PL_DATA[i][1];
      var dPast = dNow - WINDOW_DAYS;
      if (dPast < PL_DATA[0][0]) continue;
      var prev = -1;
      for (var j = i; j >= 0; j--) {
        if (PL_DATA[j][0] <= dPast) { prev = j; break; }
      }
      if (prev < 0 || prev >= PL_DATA.length - 1) continue;
      var d0 = PL_DATA[prev][0],     p0 = PL_DATA[prev][1];
      var d1 = PL_DATA[prev + 1][0], p1 = PL_DATA[prev + 1][1];
      var t  = (dPast - d0) / (d1 - d0);
      var pPast = p0 * Math.pow(p1 / p0, t);
      var cagr  = Math.pow(pNow / pPast, 0.25) - 1;
      out.push({ x: dNow, y: cagr * 100 });
    }
    return out;
  }

  // ── Compute Power Law trend CAGR at each date (model-implied growth rate)
  // For each PL_DATA date, trend_CAGR = (trend_price(d) / trend_price(d - 4y))^(1/4) - 1
  function computeTrendCAGR() {
    var out = [];
    for (var i = 0; i < PL_DATA.length; i++) {
      var dNow = PL_DATA[i][0];
      var dPast = dNow - WINDOW_DAYS;
      if (dPast < 365) continue; // trend formula not meaningful for tiny day values
      var ratio = plPrice(dNow) / plPrice(dPast);
      var cagr  = Math.pow(ratio, 0.25) - 1;
      out.push({ x: dNow, y: cagr * 100 });
    }
    return out;
  }

  var realized = computeRealizedCAGR();
  var trend    = computeTrendCAGR();
  if (!realized.length || !trend.length) return;

  // ── Render the dated as-of callout from the most recent samples
  var lastSample        = realized[realized.length - 1];
  var lastSampleDate    = new Date(GENESIS_TS * 1000 + lastSample.x * 86400 * 1000);
  var dateStr           = lastSampleDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }).toUpperCase();
  var realizedNow       = lastSample.y;
  var trendNow          = trend[trend.length - 1].y;
  var lastSamplePrice   = PL_DATA[PL_DATA.length - 1][1];
  var lastSampleTrendP  = plPrice(lastSample.x);
  var trendMultiple     = lastSamplePrice / lastSampleTrendP;  // e.g. 0.59
  var fmt = function(n, p) { return n.toFixed(p == null ? 1 : p) + '%'; };

  var asOfLabel    = document.getElementById('cagrAsOfLabel');
  var trendValueEl = document.getElementById('cagrTrendValue');
  var realValueEl  = document.getElementById('cagrRealizedValue');
  var gapClauseEl  = document.getElementById('cagrGapClause');
  if (asOfLabel)    asOfLabel.textContent    = 'AS OF ' + dateStr;
  if (trendValueEl) trendValueEl.textContent = '~' + fmt(trendNow, 0);
  if (realValueEl)  realValueEl.textContent  = '~' + fmt(realizedNow, 0);
  if (gapClauseEl) {
    if (trendMultiple < 0.95) {
      gapClauseEl.textContent = 'the gap reflects how far below trend bitcoin is sitting right now (~' + trendMultiple.toFixed(2) + '× trend)';
    } else if (trendMultiple > 1.1) {
      gapClauseEl.textContent = 'bitcoin is trading above trend (~' + trendMultiple.toFixed(2) + '× trend), so realized currently exceeds the model rate';
    } else {
      gapClauseEl.textContent = 'bitcoin is trading near trend (~' + trendMultiple.toFixed(2) + '× trend), so realized and model-implied rates are close';
    }
  }

  // ── Build datasets. Pre-create both All-time and Recent 2y data
  //    slices. Toggle changes scales.x.min/max and scales.y.max.
  var xMaxData = realized[realized.length - 1].x;
  var lineAt = function(y, xMin, xMax) {
    return [{x: xMin, y: y}, {x: xMax, y: y}];
  };

  // Initial mode: All-time
  var currentMode = 'all';
  var currentXMin = X_MIN_ALLTIME;
  var currentXMax = xMaxData;
  var currentYMax = Y_MAX_ALLTIME;

  // Realized data clipped to current Y_MAX
  function clipRealizedToMode(yMax) {
    return realized.map(function(p) { return { x: p.x, y: Math.min(p.y, yMax) }; });
  }
  function clipTrendToMode(yMax) {
    return trend.map(function(p) { return { x: p.x, y: Math.min(p.y, yMax) }; });
  }

  var chart = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        // Band 1: multisig 12-16% (filled between top 16% line and bottom 12% line)
        { label: 'Multisig 16% (top)', data: lineAt(16, X_MIN_ALLTIME, xMaxData),
          borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, borderDash: [3,3],
          pointRadius: 0, fill: false, order: 6 },
        { label: 'Multisig 12% (bottom)', data: lineAt(12, X_MIN_ALLTIME, xMaxData),
          borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, borderDash: [3,3],
          backgroundColor: 'rgba(224,148,34,0.18)',
          pointRadius: 0, fill: '-1', order: 6 },
        // Band 2: CeFi 8-12% (filled between 12% top and 8% bottom)
        { label: 'CeFi 8% (bottom)', data: lineAt(8, X_MIN_ALLTIME, xMaxData),
          borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1, borderDash: [3,3],
          backgroundColor: 'rgba(224,148,34,0.10)',
          pointRadius: 0, fill: '-1', order: 6 },
        // Power Law trend CAGR — model-implied (dashed, secondary)
        { label: 'Power Law trend CAGR', data: clipTrendToMode(Y_MAX_ALLTIME),
          borderColor: 'rgba(224,148,34,0.55)', borderWidth: 1.6, borderDash: [6,4],
          pointRadius: 0, fill: false, order: 2, tension: 0 },
        // BTC realized 4-year rolling CAGR — hero line (solid, bright)
        { label: 'BTC 4-year rolling CAGR (realized)', data: clipRealizedToMode(Y_MAX_ALLTIME),
          borderColor: '#e09422', borderWidth: 2.2,
          pointRadius: 0, pointHoverRadius: 4,
          tension: 0.25, fill: false, order: 1 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', axis: 'x', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          titleColor: 'rgba(255,255,255,0.9)',
          bodyColor: 'rgba(255,255,255,0.8)',
          borderColor: 'rgba(224,148,34,0.4)',
          borderWidth: 1,
          filter: function(item) {
            var lbl = item.dataset.label;
            return lbl === 'BTC 4-year rolling CAGR (realized)' ||
                   lbl === 'Power Law trend CAGR';
          },
          callbacks: {
            title: function(items) {
              if (!items.length) return '';
              var d = new Date(GENESIS_TS * 1000 + items[0].parsed.x * 86400 * 1000);
              return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            },
            label: function(item) {
              var lbl = item.dataset.label === 'Power Law trend CAGR'
                ? 'Trend CAGR (model)'
                : 'Realized CAGR';
              return lbl + ': ' + item.parsed.y.toFixed(1) + '%';
            },
            afterBody: function() {
              return ['', 'CeFi rates: 8–12%', 'Multisig rates: 12–16%'];
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          min: X_MIN_ALLTIME,
          max: xMaxData,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: 'rgba(255,255,255,0.5)',
            font: { size: 10 },
            callback: function(v) {
              var d = new Date(GENESIS_TS * 1000 + v * 86400 * 1000);
              return d.getFullYear();
            },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          }
        },
        y: {
          min: 0,
          max: Y_MAX_ALLTIME,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: 'rgba(255,255,255,0.5)',
            font: { size: 10 },
            callback: function(v) { return v + '%'; }
          }
        }
      }
    }
  });

  // ── Time-range toggle handler
  function setMode(mode) {
    currentMode = mode;
    if (mode === 'all') {
      currentXMin = X_MIN_ALLTIME;
      currentXMax = xMaxData;
      currentYMax = Y_MAX_ALLTIME;
    } else {
      currentXMin = xMaxData - RECENT_WINDOW_DAYS;
      currentXMax = xMaxData;
      currentYMax = Y_MAX_RECENT;
    }
    chart.data.datasets[0].data = lineAt(16, currentXMin, currentXMax);
    chart.data.datasets[1].data = lineAt(12, currentXMin, currentXMax);
    chart.data.datasets[2].data = lineAt(8,  currentXMin, currentXMax);
    chart.data.datasets[3].data = clipTrendToMode(currentYMax);
    chart.data.datasets[4].data = clipRealizedToMode(currentYMax);
    chart.options.scales.x.min = currentXMin;
    chart.options.scales.x.max = currentXMax;
    chart.options.scales.y.max = currentYMax;
    if (mode === '2y') {
      chart.options.scales.x.ticks.callback = function(v) {
        var d = new Date(GENESIS_TS * 1000 + v * 86400 * 1000);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      };
    } else {
      chart.options.scales.x.ticks.callback = function(v) {
        var d = new Date(GENESIS_TS * 1000 + v * 86400 * 1000);
        return d.getFullYear();
      };
    }
    chart.update();
  }

  var toggleBtns = document.querySelectorAll('.bas-cagr-range-btn');
  toggleBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      toggleBtns.forEach(function(b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      setMode(btn.getAttribute('data-range'));
    });
  });
})();


// ═══════ SCENARIO URL SYNC & SHARE — BAS ═══════
// URL ⇄ input state for BAS scenario. Pattern follows SITE_GUIDE §17.5
// with BAS-specific schema. Runs at end of file so it executes AFTER
// the calculator IIFE's SHARED_PAIRS localStorage hydration — URL
// params correctly override stored values.
//
// Schema:
//   stack    BTC stack (decimal)        default 1.0
//   loan     loan amount USD (integer)  default 10000
//   rate     interest rate %            default 10
//   liq      liquidation LTV % (int)    default 80   (Loan Health tab)
//   horizon  BvS horizon yrs (integer)  default 5    (BvS tab)
//   cb       cost basis USD (integer)   default = current price (BvS)
//   cg       cap gains tax % (integer)  default 20   (BvS tab)
//
// `price` (basBtcPrice / bvsBtcPrice) is intentionally NOT in the URL:
// it's live-fetched and goes stale within hours, so a shared link
// lets the receiver's calculator pull fresh price rather than pin a
// past value (same reasoning as BvRE excludes fwdBtcNow).
//
// Shared inputs (stack, price, loan, rate) are mirrored across tabs
// via the SHARED_PAIRS state-sync layer. Setting either bas* or bvs*
// input + dispatching 'input' triggers the mirror — so the URL sync
// only writes to ONE of each pair (the bas* prefix) and the sync
// layer propagates to bvs*.
//
// Unknown params preserved on URL per §17.5 forward-compat.
(function(){
  if (typeof URLSearchParams === 'undefined') return;
  if (!document.getElementById('basBtcStack')) return;

  // Schema entries — `elId` is the canonical input to write/read; for
  // shared pairs we use the bas* member and let the sync layer mirror.
  var SCHEMA = {
    stack:   { elId: 'basBtcStack',     type: 'float', def: 1.0 },
    loan:    { elId: 'basLoanAmount',   type: 'int',   def: 10000 },
    rate:    { elId: 'basInterestRate', type: 'float', def: 10 },
    liq:     { elId: 'basLiqThreshold', type: 'int',   def: 80 },
    horizon: { elId: 'bvsHorizon',      type: 'int',   def: 5 },
    cb:      { elId: 'bvsCostBasis',    type: 'int',   def: null  /* default = current price; treated specially in syncUrl */ },
    cg:      { elId: 'bvsCapGains',     type: 'int',   def: 20 }
  };

  var _suppressWriter = false;

  function readNumber(el, type) {
    if (!el || el.value === '' || el.value === null) return NaN;
    var n = type === 'int' ? parseInt(el.value, 10) : parseFloat(el.value);
    return n;
  }

  function readUrlIntoInputs() {
    var params = new URLSearchParams(window.location.search);
    _suppressWriter = true;
    try {
      Object.keys(SCHEMA).forEach(function(key){
        if (!params.has(key)) return;
        var spec = SCHEMA[key];
        var el = document.getElementById(spec.elId);
        if (!el) return;
        var raw = params.get(key);
        var n = spec.type === 'int' ? parseInt(raw, 10) : parseFloat(raw);
        if (!isFinite(n)) return;
        el.value = String(n);
        // Dispatch both 'input' and 'change' so existing handlers
        // (state-sync mirror, persist, recompute) all fire.
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    } finally {
      _suppressWriter = false;
    }
  }

  // No URL write until the reader touches something. The calculator IIFE hydrates
  // shared inputs from localStorage before this runs, so an init-time write promoted
  // a returning reader's stored settings into a URL they never asked for.
  var _suppressUrlWrite = true;
  function syncUrl() {
    if (_suppressUrlWrite) return;
    if (!window.history || !window.history.replaceState) return;
    var params = new URLSearchParams(window.location.search);
    Object.keys(SCHEMA).forEach(function(key){
      var spec = SCHEMA[key];
      var el = document.getElementById(spec.elId);
      if (!el) return;
      var val = readNumber(el, spec.type);
      // Cost basis (`cb`) defaults to current price, which varies; we
      // omit it from URL when it equals the current price input,
      // signaling "use receiver's current price" rather than pinning.
      if (key === 'cb') {
        var priceEl = document.getElementById('bvsBtcPrice') || document.getElementById('basBtcPrice');
        var priceVal = priceEl ? parseFloat(priceEl.value) : NaN;
        // Still the auto-filled value (see the calculator IIFE) → not a reader choice.
        if (el.dataset && el.dataset.autofilled === '1') { params.delete(key); return; }
        if (!isFinite(val) || (isFinite(priceVal) && Math.abs(val - priceVal) < 1)) {
          params.delete(key);
        } else {
          params.set(key, String(Math.round(val)));
        }
        return;
      }
      if (!isFinite(val) || (spec.def !== null && val === spec.def)) {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    var qs = params.toString();
    var newUrl = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  }

  var _t = null;
  function scheduleSyncUrl() {
    if (_suppressWriter) return;
    if (_t) clearTimeout(_t);
    _t = setTimeout(syncUrl, 220);
  }

  function wireWriters() {
    // Bind to the same inputs we read. For shared pairs (stack/loan/
    // rate) the sync layer already mirrors bas* ⇄ bvs*, so binding
    // just to bas* is enough — but a user might drag the bvs* version,
    // so also bind to those for direct events.
    var PAIRS = [
      ['basBtcStack',     'bvsBtcStack'],
      ['basLoanAmount',   'bvsLoanAmount'],
      ['basInterestRate', 'bvsInterestRate']
    ];
    PAIRS.forEach(function(p){
      p.forEach(function(id){
        var el = document.getElementById(id);
        if (el) ['input','change'].forEach(function(e){ el.addEventListener(e, scheduleSyncUrl); });
      });
    });
    ['basLiqThreshold','bvsHorizon','bvsCostBasis','bvsCapGains'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) ['input','change'].forEach(function(e){ el.addEventListener(e, scheduleSyncUrl); });
    });
    // Preset and cost-basis preset buttons set values programmatically
    // and call recompute(); they don't always dispatch 'input', so bind
    // click directly.
    document.querySelectorAll('.bas-calc-preset, .bas-calc-bvs-cb-preset').forEach(function(btn){
      btn.addEventListener('click', scheduleSyncUrl);
    });
  }

  function init() {
    readUrlIntoInputs();
    wireWriters();
    // One capture-phase gate: the first real interaction unlocks URL writing, and
    // nothing during load (storage hydration, live-price fill) can slip past it.
    ['input', 'change', 'click'].forEach(function (ev) {
      document.addEventListener(ev, function () { _suppressUrlWrite = false; }, { capture: true, once: true });
    });
    // No syncUrl() here by design — a load leaves the address bar as the reader
    // arrived with it.
  }

  // Run AFTER the calculator IIFE's SHARED_PAIRS hydration. The
  // calculator IIFE is synchronous and finishes before any async event
  // (incl. DOMContentLoaded if script is at end of body). For safety
  // we wait for DOMContentLoaded if loading; otherwise run on next tick.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
})();


// ═══════ IN-PAGE SHARE SECTION — BAS ═══════
(function(){
  if (!document.getElementById('shareSection')) return;
  var SHARE_TITLE = 'Borrowing against your bitcoin stack — when it adds up.';

  function currentUrl() { return window.location.href; }
  function genericPageUrl() {
    return window.location.origin + window.location.pathname + window.location.hash;
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'absolute'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch(e){ ok = false; }
    document.body.removeChild(ta);
    return ok;
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

  var copyBtn = document.getElementById('shareCopy');
  if (copyBtn) {
    copyBtn.addEventListener('click', function(){
      var url = currentUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function(){ showCopiedFeedback(copyBtn); },
          function(){ if (fallbackCopy(url)) showCopiedFeedback(copyBtn); }
        );
      } else if (fallbackCopy(url)) {
        showCopiedFeedback(copyBtn);
      }
    });
  }
  var nativeBtn = document.getElementById('shareNative');
  if (nativeBtn && navigator.share) {
    nativeBtn.hidden = false;
    nativeBtn.addEventListener('click', function(){
      navigator.share({ title: 'Borrowing against your stack', text: SHARE_TITLE, url: currentUrl() })
        .catch(function(){ /* user cancelled — silent */ });
    });
  }

  function bindIntent(id, urlBuilder) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      window.open(urlBuilder(genericPageUrl()), '_blank', 'noopener,noreferrer,width=620,height=540');
    });
  }
  bindIntent('shareTwitter', function(url){
    return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) +
           '&text=' + encodeURIComponent(SHARE_TITLE);
  });
  bindIntent('shareLinkedIn', function(url){
    return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
  });
  bindIntent('shareFacebook', function(url){
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
  });
})();
