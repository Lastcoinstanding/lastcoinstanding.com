/* ============================================================
   RealEstateLedger — "Show the calculation", both pages
   ============================================================
   PR 6a (REAL_ESTATE_PAIR_DESIGN.md §9; rulings M2, M7, P2, P7).
   Renders the engine's year-by-year rows as a disclosure with tabs, the
   final rows per path (market value → selling costs → before tax → tax →
   after tax), and a CSV download of every tab with a #-prefixed
   provenance header, as the retirement family's CSVs have.

   RealEstateLedger.render(el, spec) — el is the container; spec:
     note     HTML above the tabs: the dollars the table is in
     tabs     [{ id, label, columns: [{ label, unit, get(row), fmt }], rows }]
              fmt: 'usd' | 'btc' | 'text'
     final    { cols: ['House', 'Bitcoin'], rows: [{ label, values: [a, b] }] }
              (values in dollars, or null for a blank cell)
     csv      { filename, meta: [[label, value], ...] }
   The disclosure's open state and the chosen tab survive a re-render.
   RealEstateLedger.toCsv(spec) returns the CSV text (rePairQA hashes it).
   ============================================================ */
(function(){
  'use strict';
  function usd(v){ return (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US'); }
  function fmt(v, kind){
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return '';
    if (kind === 'btc') return Number(v).toFixed(4);
    if (kind === 'text') return String(v);
    return usd(v);
  }
  function csvCell(v, kind){
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return '';
    if (kind === 'btc') return Number(v).toFixed(6);
    if (kind === 'text') return '"' + String(v).replace(/"/g, '""') + '"';
    return String(Math.round(v));
  }
  function head(c){ return c.label + (c.unit ? ' (' + c.unit + ')' : ''); }
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function toCsv(spec){
    var L = [];
    (spec.csv && spec.csv.meta || []).forEach(function(m){ L.push('# ' + m[0] + ',' + String(m[1]).replace(/,/g, ';')); });
    spec.tabs.forEach(function(t){
      L.push(''); L.push('# ' + t.label);
      L.push(t.columns.map(function(c){ return '"' + head(c).replace(/"/g, '""') + '"'; }).join(','));
      t.rows.forEach(function(r){ L.push(t.columns.map(function(c){ return csvCell(c.get(r), c.fmt); }).join(',')); });
    });
    if (spec.final) {
      L.push(''); L.push('# If sold at the end (USD, nominal)');
      L.push(['Step'].concat(spec.final.cols).join(','));
      spec.final.rows.forEach(function(r){ L.push(['"' + r.label + '"'].concat(r.values.map(function(v){ return csvCell(v, 'usd'); })).join(',')); });
    }
    return L.join('\n') + '\n';
  }

  function render(el, spec){
    if (!el) return;
    var prev = el.querySelector('details.re-ledger');
    var open = prev ? prev.open : false;
    var active = el.getAttribute('data-tab') || spec.tabs[0].id;
    if (!spec.tabs.some(function(t){ return t.id === active; })) active = spec.tabs[0].id;
    var tabs = spec.tabs.map(function(t){
      return '<button type="button" class="re-ledger-tab' + (t.id === active ? ' active' : '') + '" data-tab="' + t.id + '" aria-pressed="' + (t.id === active) + '">' + esc(t.label) + '</button>';
    }).join('');
    var tables = spec.tabs.map(function(t){
      return '<div class="re-ledger-scroll" data-panel="' + t.id + '"' + (t.id === active ? '' : ' hidden') + '><table class="re-ledger-table"><thead><tr>' +
        t.columns.map(function(c){ return '<th>' + esc(c.label) + (c.unit ? '<span class="re-ledger-unit">' + esc(c.unit) + '</span>' : '') + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        t.rows.map(function(r){ return '<tr>' + t.columns.map(function(c){ return '<td>' + fmt(c.get(r), c.fmt) + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table></div>';
    }).join('');
    var final = spec.final ? ('<div class="re-ledger-scroll"><table class="re-ledger-table re-ledger-final"><thead><tr><th>If sold at the end</th>' +
      spec.final.cols.map(function(c){ return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      spec.final.rows.map(function(r){ return '<tr' + (r.strong ? ' class="re-ledger-strong"' : '') + '><td>' + esc(r.label) + '</td>' + r.values.map(function(v){ return '<td>' + fmt(v, 'usd') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div>') : '';
    el.innerHTML = '<details class="re-ledger"' + (open ? ' open' : '') + '><summary>Show the calculation <span class="re-ledger-hint">year by year, and the sale at the end</span></summary>' +
      '<div class="re-ledger-body"><p class="re-ledger-note">' + (spec.note || '') + '</p>' +
      '<div class="re-ledger-tabs" role="group" aria-label="Ledger">' + tabs + '</div>' + tables + final +
      '<button type="button" class="re-ledger-csv">Download CSV</button></div></details>';
    el.setAttribute('data-tab', active);
    el.querySelectorAll('.re-ledger-tab').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-tab');
        el.setAttribute('data-tab', id);
        el.querySelectorAll('.re-ledger-tab').forEach(function(x){ var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        el.querySelectorAll('[data-panel]').forEach(function(p){ p.hidden = p.getAttribute('data-panel') !== id; });
      });
    });
    var btn = el.querySelector('.re-ledger-csv');
    btn.addEventListener('click', function(){
      var blob = new Blob([toCsv(spec)], { type: 'text/csv' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (spec.csv && spec.csv.filename) || 'ledger.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      var o = btn.textContent; btn.textContent = 'Downloaded'; setTimeout(function(){ btn.textContent = o; }, 1600);
    });
    el._ledgerSpec = spec;
  }

  window.RealEstateLedger = { render: render, toCsv: toCsv };
})();
