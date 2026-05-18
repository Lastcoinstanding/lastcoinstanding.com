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

  // ─── Scenario carry-over from sibling pages ──────────────────────────
  // /the-bitcoin-retirement (the primary calculator) builds links to
  // BAS with the user's scenario serialized as URL query parameters.
  // Read the relevant subset here so the user doesn't re-enter inputs.
  //
  // Schema (full spec in SITE_GUIDE §17.5):
  //   stack     BTC stack (decimal)    ← only param BAS reads in v1
  //   retire    retirement year         ← unused on BAS
  //   income    target income USD       ← unused on BAS
  //   years     years in retirement     ← unused on BAS (BAS's Tab-III
  //                                       horizon slider is independent)
  //   dca       monthly DCA USD         ← unused on BAS
  //   withdraw  withdrawal rate %       ← unused on BAS
  //
  // Baseline assumptions (inflation preset, growth model, real-returns
  // preset) carry across pages via the ModelingAssumptions localStorage
  // module, so they don't need URL-param help.
  //
  // Unknown params are preserved on the URL so any subsequent navigation
  // (e.g., back-link to /the-bitcoin-retirement) sees the full state.
  if (typeof URLSearchParams !== 'undefined') {
    var params = new URLSearchParams(window.location.search);
    var stackParam = params.get('stack');
    if (stackParam !== null) {
      var parsed = parseFloat(stackParam);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100000) {
        stackInput.value = parsed;
      }
    }
  }

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

  // Auto-fill current BTC price from most recent PL_DATA sample
  if (typeof PL_DATA !== 'undefined' && PL_DATA.length) {
    var latest = PL_DATA[PL_DATA.length - 1];
    if (!priceInput.value || priceInput.value === '0') {
      priceInput.value = Math.round(latest[1] / 100) * 100;
    }
  }

  // Auto-fill cost basis with current price on first render — defaults to
  // 'no embedded gain' which is the most conservative assumption for the
  // sell path (zero tax bill, so the sell path is most competitive against
  // borrowing). If the user lowers cost basis, the sell path's tax burden
  // rises and the borrow path's advantage grows accordingly.
  if (costBasisInput && (!costBasisInput.value || costBasisInput.value === '0')) {
    costBasisInput.value = priceInput.value;
  }

  var chart = null;

  // ─── Formatters ───
  function fmtUsd(n) {
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
               hint:  'Floor has held historically; some buffer but less than the conservative case.' };
    }
    if (liqRatio < PL_CEIL) {
      return { label: 'In upper channel', cls: 'bas-zone-bad',
               hint:  'Routine mean-reversion to trend would liquidate this position.' };
    }
    return { label: 'Above channel ceiling', cls: 'bas-zone-bad',
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
    var bvs = computeBorrowVsSell({
      stack: stack, currentPrice: price, loan: loan, rate: rate,
      horizonYears: horizonYears, costBasis: costBasis, taxRate: taxRate
    });
    renderBorrowVsSell(bvs, {stack: stack, loan: loan, rate: rate});

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
        detail: 'Bitcoin would need to break the long-term structural support that has held across every cycle of the last fifteen years for your position to liquidate.'
      });
    } else if (s.liqRatio < 1.0) {
      checks.push({
        status: 'warn',
        title: 'Liquidation price between floor and trend',
        detail: 'Floor has held historically; some buffer, but a typical bear-market drawdown brings price close to your liquidation.'
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
        title: 'Originating near or above the channel ceiling',
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
        '<p>The channel position you\'re originating at is structurally the mirror image of <a href="/disciplined-rebalancing.html">Disciplined Rebalancing</a>. Where Disciplined Rebalancing sells at a high-percentile zone and rebuys at a low-percentile zone, the mirror is to <strong>borrow at a low-percentile zone and repay from appreciated bitcoin at a high-percentile zone</strong>. The destination is the same &mdash; <em>took some off the table at the top</em> &mdash; but the BAS variant gets you liquidity at the bottom along the way, and the psychological framing is sharper: paying off a loan with appreciated bitcoin at the cycle peak feels like <em>releasing an obligation</em> rather than <em>selling</em>. A structured surface for modeling this is on the calculator\'s roadmap.</p>' +
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
      examples: 'Nexo, Binance Loans, Matrixport',
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
  // Two paths over the chosen horizon, evaluated at the Power Law trend
  // price at end-of-horizon:
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
  // Future BTC price is the Power Law trend at end-of-horizon — the
  // central-tendency expectation. NOT a forecast. The page is explicit
  // about this in the section subtitle.
  function computeBorrowVsSell(args) {
    var stack         = args.stack;
    var currentPrice  = args.currentPrice;
    var loan          = args.loan;
    var rate          = args.rate / 100;        // APR as decimal
    var horizonYears  = args.horizonYears;
    var costBasis     = args.costBasis;
    var taxRate       = args.taxRate / 100;     // % as decimal

    // Future price at end of horizon = Power Law trend
    var todayDays  = (Date.now()/1000 - GENESIS_TS) / 86400;
    var futureDays = todayDays + horizonYears * 365.25;
    var futurePrice = plPrice(futureDays);

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
      row('Net wealth at year ' + horizonYears      + tip('Stack at horizon &times; the Power Law trend price at year ' + horizonYears + '. Mathematically the highest of the three paths &mdash; HODL sells nothing and pays nothing, so its terminal wealth is the wealth-maximising baseline.'), fmtUsd(r.hodl.terminalWealth), true);

    // ─── Borrow path card ───
    // Labels match HODL and Sell row-for-row for visual alignment; the
    // timing context ("at horizon" / "now") that was previously in the
    // label now lives in the tooltip for each row.
    bvsBorrowHeadline.textContent = fmtBtc(r.borrow.btcRetained);
    bvsBorrowRows.innerHTML =
      row('Need funded today'                       + tip('The loan amount, available in cash today. Same dollar figure as the sell path; HODL funds nothing.'),                                                                                                                                  fmtUsd(r.loan)) +
      row('BTC sold'                                + tip('Sold <strong>at horizon</strong> to repay the loan principal. At year ' + horizonYears + ', the trend price is higher than today, so fewer BTC are needed to repay the same loan amount &mdash; the structural advantage of borrowing.'), fmtBtc(r.borrow.btcSoldAtHorizon)) +
      row('Cap gains tax'                           + tip('Owed <strong>at horizon</strong> when those BTC are sold. Cost basis is your original purchase price; the gain is the difference between that and the future trend price.'),                                                            fmtUsd(r.borrow.taxPaid)) +
      row('Cumulative interest paid'                + tip('Total interest paid over the full horizon &mdash; paid from external income, not from the bitcoin stack. Simple-interest model: loan &times; rate &times; horizon years.'),                                                              fmtUsd(r.borrow.cumulativeInterest)) +
      row('Net wealth at year ' + horizonYears      + tip('Value of BTC retained at horizon (at the future trend price), minus the cumulative interest paid along the way. Always less than HODL &mdash; the difference is the wealth cost of funding the need this way.'),                        fmtUsd(r.borrow.terminalWealth), true);

    // ─── Sell path card ───
    bvsSellHeadline.textContent = fmtBtc(r.sell.btcRetained);
    bvsSellRows.innerHTML =
      row('Need funded today'                       + tip('The loan amount, available in cash today &mdash; net of capital gains tax. Same dollar figure as the borrow path; HODL funds nothing.'),                                                                                                fmtUsd(r.loan)) +
      row('BTC sold'                                + tip('Sold <strong>now</strong> at today\'s price to net the loan amount after capital gains tax. Higher cost basis or lower tax rate means fewer BTC sold.'),                                                                                  fmtBtc(r.sell.btcSold)) +
      row('Cap gains tax'                           + tip('Owed <strong>now</strong> when the BTC is sold. Will be $0 if your cost basis equals today\'s price (no embedded gain) &mdash; use the cost-basis presets to model typical cycle entry points.'),                                          fmtUsd(r.sell.taxPaid)) +
      row('Cumulative interest paid'                + tip('Zero &mdash; the sell path has no interest cost, because there\'s no loan.'),                                                                                                                                                            '$0') +
      row('Net wealth at year ' + horizonYears      + tip('Value of BTC retained at horizon (at the future trend price). Always less than HODL &mdash; the difference is the wealth cost of funding the need this way.'),                                                                          fmtUsd(r.sell.terminalWealth), true);

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
      verdictHtml = '<p><strong>The borrow path isn\'t feasible to fully unwind at horizon.</strong> The trend price at year ' + horizonYears + ' isn\'t high enough to repay the loan from a fraction of your stack at the configured tax rate.</p>';
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
            borderColor: '#27ae60', backgroundColor: '#27ae60',
            pointRadius: 6, pointHoverRadius: 8, showLine: false, order: 0 }
        ]
      },
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
