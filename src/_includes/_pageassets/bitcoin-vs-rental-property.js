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
//     data refresh); fetchTodayPrice replaces it with the live spot when
//     CoinGecko resolves. The render path uses display-only DOM updates
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

  function render(){
    var card = document.getElementById('eti-card');
    if (!card) return;

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
      fetchTodayPrice(function(){
        // TODAY_PRICE is updated in place by the shared fetch helper.
        render();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
