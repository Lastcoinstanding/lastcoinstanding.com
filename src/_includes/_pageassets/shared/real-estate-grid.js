/* ============================================================
   RealEstateGrid — the sensitivity grid, both pages (PR 7)
   ============================================================
   REAL_ESTATE_PAIR_DESIGN.md §10; rulings R9 / P1. A 3×3 map of the
   after-tax difference, if sold (the bitcoin path minus the property), as
   two assumptions move; the reader's own configuration is the outlined cell.
   Built to be reusable (the retirement flagship could adopt it): the page
   supplies the axes and a function that computes one cell.

   RealEstateGrid.render(el, spec):
     spec.axes      [{ id, label, rows: {label, items:[{label, v}]}, cols: {...} }]
                    each axis pair; the reader's toggle picks one
     spec.cell(pairId, rowV, colV)  → the difference in display dollars
     spec.mine(pairId)              → [rowIndex, colIndex] of the reader's cell, or null
     spec.ahead     ['Bitcoin ahead', 'House ahead'] (positive, negative)
   The chosen pair survives a re-render. Colour: a diverging scale, orange
   where bitcoin is ahead and blue where the property is (the pair's series
   colours), grey at zero, strength by size; every cell is labelled, and the
   text stays in the ink colour.
   ============================================================ */
(function(){
  'use strict';
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  // Compact dollars, so a 3×3 map fits a phone: $472.7K, $1.00M.
  function compact(v){
    var a = Math.abs(v), sign = v < 0 ? '\u2212' : '';
    if (a >= 1e6) return sign + '$' + (a / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return sign + '$' + (a / 1e3).toFixed(1) + 'K';
    return sign + '$' + Math.round(a);
  }
  function render(el, spec){
    if (!el) return;
    var pair = el.getAttribute('data-pair') || spec.axes[0].id;
    var ax = spec.axes.filter(function(a){ return a.id === pair; })[0] || spec.axes[0];
    pair = ax.id;
    var vals = ax.rows.items.map(function(r){ return ax.cols.items.map(function(c){ return spec.cell(pair, r.v, c.v); }); });
    var max = 0; vals.forEach(function(row){ row.forEach(function(v){ max = Math.max(max, Math.abs(v)); }); });
    var mine = spec.mine(pair);
    function bg(v){
      if (!(max > 0)) return 'rgba(255,255,255,0.03)';
      var a = 0.08 + 0.32 * Math.min(1, Math.abs(v) / max);
      return v > 0 ? 'rgba(232,128,28,' + a.toFixed(3) + ')' : v < 0 ? 'rgba(57,135,229,' + a.toFixed(3) + ')' : 'rgba(255,255,255,0.05)';
    }
    var toggles = spec.axes.length > 1 ? '<div class="re-seg re-grid-axes" role="group" aria-label="Axes">' + spec.axes.map(function(a){
      return '<button type="button" class="re-seg-btn' + (a.id === pair ? ' active' : '') + '" data-pair="' + a.id + '" aria-pressed="' + (a.id === pair) + '">' + esc(a.label) + '</button>'; }).join('') + '</div>' : '';
    var head = '<tr><th class="re-grid-corner">' + esc(ax.rows.label) + ' ↓ / ' + esc(ax.cols.label) + ' →</th>' +
      ax.cols.items.map(function(c){ return '<th>' + esc(c.label) + '</th>'; }).join('') + '</tr>';
    var body = ax.rows.items.map(function(r, i){
      return '<tr><th>' + esc(r.label) + '</th>' + ax.cols.items.map(function(c, j){
        var v = vals[i][j], me = mine && mine[0] === i && mine[1] === j;
        return '<td class="' + (me ? 're-grid-mine' : '') + '" style="background:' + bg(v) + '"><span class="re-grid-v">' + (v > 0 ? '+' : '') + compact(v) + '</span>' +
               '<span class="re-grid-w">' + (v > 0 ? spec.ahead[0] : v < 0 ? spec.ahead[1] : 'even') + (me ? ' · yours' : '') + '</span></td>';
      }).join('') + '</tr>';
    }).join('');
    el.innerHTML = '<div class="re-grid-block"><div class="re-chart-head"><div class="re-chart-title">How the answer moves <span class="re-chart-frame">' + esc(spec.frame || '') + '</span></div>' + toggles + '</div>' +
      '<div class="re-ledger-scroll"><table class="re-grid">' + '<thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="re-chart-note">' + (spec.note || '') + '</p></div>';
    el.setAttribute('data-pair', pair);
    el._gridValues = { pair: pair, rows: ax.rows.items.map(function(r){ return r.label; }), cols: ax.cols.items.map(function(c){ return c.label; }), values: vals, mine: mine };
    el.querySelectorAll('[data-pair]').forEach(function(b){
      if (b === el) return;
      b.addEventListener('click', function(){ el.setAttribute('data-pair', b.getAttribute('data-pair')); render(el, spec); });
    });
  }
  window.RealEstateGrid = { render: render };
})();
