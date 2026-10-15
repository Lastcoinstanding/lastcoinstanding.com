/* =============================================================
   chart-fonts.js — lay every Chart.js chart out again once the web
   fonts have loaded (shared, site-wide, from base.njk <head>; 2026-10-14)

   WHY. Chart.js measures legend, title and tick text when it lays a
   chart out, and draws on later frames. A chart built before Inter
   arrives is measured in the fallback font and then drawn in Inter,
   which is wider. A legend row that nearly fills its width then wraps
   its last item out of the legend box, and that item is not drawn at
   all: BvSM's projection chart lost "NASDAQ-100", and its §1 chart lost
   "Upper band (3× trend)" at 375px. Axis labels are cached per font
   string, so an update on its own would keep their fallback widths.

   WHAT. After each batch of font loads (the FontFaceSet 'loadingdone'
   event), clear each scale's text-width cache and update every live
   chart. The listener is registered in <head>, before any page script
   runs and before any font starts to load, so no load is missed. A
   chart built after the fonts arrive is measured right the first time
   and is left alone unless another font loads later. update() keeps
   the chart's own animation settings, so an entrance animation that
   is still running carries on rather than jumping to its end.

   No-op without Chart.js or the CSS Font Loading API. Pure ES5,
   registered once. Charts drawn by hand on a canvas are not covered;
   SVG and HTML text re-flow on their own when a font loads.
   See TECH_DEBT ("Chart.js legends measured before Inter loads") and
   SITE_GUIDE §31.
   ============================================================= */
(function () {
  if (window.__lcsChartFonts) return; // idempotent across includes
  window.__lcsChartFonts = true;

  var fonts = document.fonts;
  if (!fonts || typeof fonts.addEventListener !== 'function') return;

  function relayout() {
    var C = window.Chart;
    var all = C && C.instances;
    if (!all) return;
    Object.keys(all).forEach(function (id) {
      var chart = all[id];
      if (!chart || !chart.canvas) return;
      try {
        // Tick-label widths are cached per font string (Chart.js 4,
        // Scale._longestTextCache); the string is the same before and
        // after the font loads, so drop the cache or the axes keep the
        // fallback widths.
        var scales = chart.scales || {};
        Object.keys(scales).forEach(function (k) {
          if (scales[k] && scales[k]._longestTextCache) scales[k]._longestTextCache = {};
        });
        chart.update();
      } catch (e) { /* a page's chart is its own business; never break the page */ }
    });
  }

  fonts.addEventListener('loadingdone', relayout);
})();
