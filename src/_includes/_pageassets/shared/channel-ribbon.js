/* ============================================================
   Channel Ribbon — site-wide barometer strip renderer
   ============================================================
   Fills the [data-channel-ribbon] strip (components/channel-ribbon.njk,
   injected once by base.njk on every content page) with the live channel
   read: trend multiple, canonical zone word, and spot price.

   Reuses the SAME shared power-law-data.js helpers the trilogy pages use —
   plPrice / positionLabel / TODAY_DAYS / fetchTodayPrice — so the ribbon can
   never disagree with a page's own "today" readout (there is one call path,
   not a second source). power-law-data.js is loaded site-wide immediately
   before this file in base.njk.

   Live gating (canon): the dot pulses only when the fetched source is 'live';
   on fallback the dot is static and the dated register (" · as of Sep 12",
   from the shared todayPriceAsOf helper, so it names the day the price is
   from) is revealed. No animation of the numbers, no 24h delta, no red/green —
   this is a barometer, not a ticker. The price carries a hover title naming
   its source (live: the provider that answered; fallback: the sample's date).

   First paint uses the seeded TODAY_PRICE (last PL_DATA sample) so the strip
   is never empty, then fetchTodayPrice replaces it (and the cache/dedupe rider
   in power-law-data.js keeps the site to one fetch per 10 minutes per tab).
============================================================ */
(function(){
  var root = document.querySelector('[data-channel-ribbon]');
  if (!root) return;

  var multEl = root.querySelector('.cr-mult-value');
  var zoneEl = root.querySelector('.cr-zone');
  var priceEl = root.querySelector('.cr-price');
  var registerEl = root.querySelector('.cr-register');
  var dotEl = root.querySelector('.cr-dot');
  if (!multEl || !zoneEl || !priceEl) return;

  // Full price with thousands separators — matches the spec's "$64,144"
  // register (the barometer shows the real figure, not the ticker's compact
  // "$64.1K"). Sub-$1000 spot is never realistic for BTC but is handled.
  function formatPrice(p){
    if (!isFinite(p) || p <= 0) return '$—';
    return '$' + Math.round(p).toLocaleString('en-US');
  }

  // Map a ×-trend multiple to the shared log-space channel position (0 = floor
  // at PL_FLOOR×, 1 = upper band at PL_CEIL×), then hand it to the canonical
  // positionLabel vocabulary. Same transform the trilogy uses, so the zone word
  // here matches "where in the channel" everywhere else on the site.
  function zoneWord(mult){
    if (!(mult > 0) || typeof positionLabelForMultiple !== 'function') return '—';
    return positionLabelForMultiple(mult);
  }

  function render(price, source){
    var live = (typeof todayPriceIsLive === 'function') ? todayPriceIsLive(source) : (source === 'live');
    var trend = (typeof plPrice === 'function' && typeof TODAY_DAYS === 'number') ? plPrice(TODAY_DAYS) : null;

    priceEl.textContent = formatPrice(price);

    if (!trend || !isFinite(trend) || trend <= 0 || !(price > 0)) {
      multEl.textContent = '—';
      zoneEl.textContent = '—';
    } else {
      var mult = price / trend;
      multEl.textContent = mult.toFixed(2) + '×';
      zoneEl.textContent = zoneWord(mult);
    }

    // Live gating: pulse + no register when live; static dot + dated register
    // on fallback (and on the pre-fetch seed paint, which is the same sample).
    root.classList.toggle('is-live', !!live);
    if (dotEl) dotEl.classList.toggle('cr-dot-static', !live);
    if (registerEl) {
      if (!live && typeof todayPriceAsOf === 'function') registerEl.textContent = '\u00a0\u00b7 ' + todayPriceAsOf();
      registerEl.hidden = !!live;
    }
    var provider = (live && typeof todayPriceProviderName === 'function') ? todayPriceProviderName() : '';
    priceEl.title = live
      ? ('Live bitcoin price' + (provider ? ' from ' + provider : ''))
      : ('Live price unavailable \u2014 the most recent price in the site\u2019s data' + (typeof lastSampleDateLong === 'function' ? ', ' + lastSampleDateLong() : ''));
  }

  // First paint from the seed (source is not 'live' yet → static dot +
  // register), so the strip reads honestly even if the fetch never resolves.
  if (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0) render(TODAY_PRICE, 'fallback');

  if (typeof fetchTodayPrice === 'function') {
    fetchTodayPrice(function(p, source){ render(p, source); });
  }
})();
