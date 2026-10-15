/* ─────────────────────────────────────────────────────────────────
   chart-font-audit.js — find Chart.js charts still laid out for the
   fallback font (2026-10-14)

   WHY THIS EXISTS. Chart.js measures legend, title and tick text when
   it lays a chart out. A chart built before Inter loads is measured in
   the fallback font and later drawn in Inter, which is wider; a legend
   row that nearly fills its width then loses its last item, and axis
   labels can overrun. shared/chart-fonts.js (base.njk <head>) lays every
   chart out again after each batch of font loads. This audit is how to
   check that it still does: with the fonts held back 2.5s, half the
   visible charts on main (51 of 102 on 16 pages) failed it before the
   helper; none after.

   HOW TO RUN. Make the fonts arrive late, then audit once they are in:
     1. DevTools → Network: block the request pattern `fonts.gstatic.com`,
        or throttle to "Slow 3G", and reload the page.
     2. Unblock (or stop throttling) and wait until the page text is in
        Inter. Hover nothing; a hover redraws a chart.
     3. Paste this file into the console and run:
          await chartFontAudit()
   An empty `stale` list is a pass. Each entry names a chart (canvas id)
   whose legend or chart area changes when laid out again now, with the
   before and after. The audit leaves every chart laid out afresh.

   WHAT IT COMPARES, per live chart with a non-zero size: the legend's
   height, row count and item boxes, and the chart area. It clears each
   scale's tick-width cache first (Chart.js keys it by the font string,
   which is the same before and after the face loads).
   ───────────────────────────────────────────────────────────────── */
async function chartFontAudit() {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  var C = window.Chart;
  if (!C || !C.instances) return { charts: 0, stale: [], note: 'no Chart.js on this page' };
  var stale = [], n = 0;
  Object.keys(C.instances).forEach(function (k) {
    var c = C.instances[k];
    if (!c || !c.canvas || !c.canvas.isConnected || !c.width || !c.height) return;
    n++;
    function snap() {
      var L = c.legend, a = c.chartArea || {};
      var on = L && L.options && L.options.display !== false && L.legendItems && L.legendItems.length;
      return JSON.stringify({
        legend: on ? {
          height: Math.round(L.height),
          rows: (L.lineWidths || []).length,
          items: (L.legendHitBoxes || []).map(function (h) { return [Math.round(h.left), Math.round(h.top), Math.round(h.width)]; })
        } : null,
        area: [a.left, a.top, a.right, a.bottom].map(function (v) { return Math.round(v || 0); })
      });
    }
    var before = snap();
    Object.keys(c.scales || {}).forEach(function (s) { if (c.scales[s]._longestTextCache) c.scales[s]._longestTextCache = {}; });
    c.update('none');
    var after = snap();
    if (before !== after) stale.push({ chart: c.canvas.id || ('#' + k), before: JSON.parse(before), after: JSON.parse(after) });
  });
  return { charts: n, stale: stale };
}
