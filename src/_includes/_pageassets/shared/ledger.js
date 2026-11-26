/* ============================================================
   Ledger — the shared "Check the work" ledger (STYLE_GUIDE §6.49)
   ============================================================
   Built for the real-estate pair as RealEstateLedger (PR 6a,
   REAL_ESTATE_PAIR_DESIGN.md §9; rulings M2, M7, P2, P7) and renamed
   with its first page outside the series, Borrowing Against Your Stack
   (2026-11-26, TECH_DEBT §1.x). Renders a page engine's rows as the
   sitewide Check the work disclosure: What went in, tabs of tables, the
   final rows, How each column is worked out, then Download CSV and Copy
   as CSV. The CSV opens with a #-prefixed provenance header, as the
   retirement family's CSVs do.

   Ledger.render(el, spec): el is the container; spec:
     note     HTML above the tabs: the dollars the table is in
     tabs     [{ id, label, columns: [{ label, unit, get(row), fmt }], rows,
                 strong(row) (optional: true sets the row in bold, e.g. a median) }]
              fmt: 'usd' | 'btc' | 'text' | 'pct' (a fraction: 0.115 shows
              11.5%) | 'mult' (a multiple: 0.25 shows 0.25×)
     final    { cols: ['House', 'Bitcoin'], rows: [{ label, values: [a, b] }] }
              (values in dollars, or null for a blank cell; a row may set
              fmt: 'btc' or 'text' instead)
     csv      { filename, meta: [[label, value], ...] } (a value may be a
              function, read when the CSV is made: the live link, say)
   Optional, and all of them default to the real-estate pages' words, so a
   spec that leaves them out renders and exports exactly as before:
     hint             the muted words after "Check the work"
                      ('year by year, and the sale at the end')
     final.title      the final table's first header ('If sold at the end')
     final.csvTitle   its block heading in the CSV
                      ('If sold at the end (USD, nominal)')
     final.howTitle   its folded sentences' summary
                      ('How the sale at the end is worked out')
   The clarity additions (piloted 2026-11-25; CHECK_THE_WORK_AUDIT):
     inputs   [{ label, value }]: "What went in", above the note and in
              the CSV header as "# Input:" lines. Build it from the object
              the engine ran with, never from the DOM.
     columns[].how   one sentence on how the column is made; listed under
              the table ("How each column is worked out") and in the CSV.
     final.rows[].card   words naming the result card that shows this
              row's figure; marks the row. final.rows[].how as columns'.
   A "side by side" view is an ordinary tab the page builds.
   The disclosure's open state and the chosen tab survive a re-render.
   Ledger.toCsv(spec) returns the CSV text (rePairQA hashes it).
   Ledger.check(el, { side }) is the shared QA for a rendered ledger.
   The CSS classes keep their re-ledger- prefix: shared/check-the-work.css
   and ten pages' Check the work panels share it.
   ============================================================ */
(function(){
  'use strict';
  function usd(v){ return (v < 0 ? '−' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US'); }
  function fmt(v, kind){
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return '';
    if (kind === 'btc') return Number(v).toFixed(4);
    if (kind === 'text') return String(v);
    if (kind === 'pct') return (v < 0 ? '−' : '') + (Math.abs(v) * 100).toFixed(1) + '%';
    if (kind === 'mult') return Number(v).toFixed(2) + '×';
    return usd(v);
  }
  function csvCell(v, kind){
    if (v === null || v === undefined || (typeof v === 'number' && !isFinite(v))) return '';
    if (kind === 'btc') return Number(v).toFixed(6);
    if (kind === 'text') return '"' + String(v).replace(/"/g, '""') + '"';
    if (kind === 'pct') return (Number(v) * 100).toFixed(2);
    if (kind === 'mult') return Number(v).toFixed(4);
    return String(Math.round(v));
  }
  function head(c){ return c.label + (c.unit ? ' (' + c.unit + ')' : ''); }
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  // The pilot's "#" lines: a label and a value are two cells; a sentence
  // is one quoted cell, so its commas stay commas in a spreadsheet.
  function q(s){ s = String(s).replace(/\s+/g, ' '); return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function line(s){ return '"' + String(s).replace(/\s+/g, ' ').replace(/"/g, '""') + '"'; }
  function hasHow(list){ return (list || []).some(function(x){ return !!x.how; }); }
  function howBlock(title, list, attrs){
    if (!hasHow(list)) return '';
    return '<details class="re-ledger-how"' + attrs + '><summary>' + title + '</summary><ul>' +
      list.map(function(x){ return x.how ? '<li><strong>' + esc(x.label) + ':</strong> ' + esc(x.how) + '</li>' : ''; }).join('') + '</ul></details>';
  }
  function finalTitle(f){ return f.title || 'If sold at the end'; }
  function finalCsvTitle(f){ return f.csvTitle || 'If sold at the end (USD, nominal)'; }
  function finalHowTitle(f){ return f.howTitle || 'How the sale at the end is worked out'; }

  function toCsv(spec){
    var L = [];
    (spec.csv && spec.csv.meta || []).forEach(function(m){ L.push('# ' + m[0] + ',' + String(typeof m[1] === 'function' ? m[1]() : m[1]).replace(/,/g, ';')); });
    (spec.inputs || []).forEach(function(m){ L.push(q('# Input: ' + m.label) + ',' + q(m.value)); });
    spec.tabs.forEach(function(t){
      L.push(''); L.push('# ' + t.label);
      L.push(t.columns.map(function(c){ return '"' + head(c).replace(/"/g, '""') + '"'; }).join(','));
      t.rows.forEach(function(r){ L.push(t.columns.map(function(c){ return csvCell(c.get(r), c.fmt); }).join(',')); });
      if (hasHow(t.columns)) {
        L.push('# How each column is worked out');
        t.columns.forEach(function(c){ if (c.how) L.push(line('# ' + c.label + ': ' + c.how)); });
      }
    });
    if (spec.final) {
      L.push(''); L.push('# ' + finalCsvTitle(spec.final));
      L.push(['Step'].concat(spec.final.cols).join(','));
      spec.final.rows.forEach(function(r){ L.push(['"' + r.label + '"'].concat(r.values.map(function(v){ return csvCell(v, r.fmt || 'usd'); })).join(',')); });
      spec.final.rows.forEach(function(r){ if (r.card) L.push(line('# Headline: ' + r.label + ' = ' + r.card)); });
      if (hasHow(spec.final.rows)) {
        L.push('# ' + finalHowTitle(spec.final));
        spec.final.rows.forEach(function(r){ if (r.how) L.push(line('# ' + r.label + ': ' + r.how)); });
      }
    }
    return L.join('\n') + '\n';
  }

  function render(el, spec){
    if (!el) return;
    var prev = el.querySelector('details.re-ledger');
    var open = prev ? prev.open : false;
    var howOpen = el.getAttribute('data-how') === '1';
    var active = el.getAttribute('data-tab') || spec.tabs[0].id;
    if (!spec.tabs.some(function(t){ return t.id === active; })) active = spec.tabs[0].id;
    var tabs = spec.tabs.map(function(t){
      return '<button type="button" class="re-ledger-tab' + (t.id === active ? ' active' : '') + '" data-tab="' + t.id + '" aria-pressed="' + (t.id === active) + '">' + esc(t.label) + '</button>';
    }).join('');
    var tables = spec.tabs.map(function(t){
      return '<div class="re-ledger-scroll" data-panel="' + t.id + '"' + (t.id === active ? '' : ' hidden') + '><table class="re-ledger-table"><thead><tr>' +
        t.columns.map(function(c){ return '<th>' + esc(c.label) + (c.unit ? '<span class="re-ledger-unit">' + esc(c.unit) + '</span>' : '') + '</th>'; }).join('') +
        '</tr></thead><tbody>' +
        t.rows.map(function(r){ return '<tr' + (t.strong && t.strong(r) ? ' class="re-ledger-strong"' : '') + '>' + t.columns.map(function(c){ return '<td>' + fmt(c.get(r), c.fmt) + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table></div>' +
        howBlock('How each column is worked out', t.columns, ' data-panel="' + t.id + '"' + (t.id === active ? '' : ' hidden') + (howOpen ? ' open' : ''));
    }).join('');
    var inputs = (spec.inputs && spec.inputs.length) ? ('<div class="re-ledger-inputs"><div class="re-ledger-sub">What went in</div><dl>' +
      spec.inputs.map(function(m){ return '<div><dt>' + esc(m.label) + '</dt><dd>' + esc(m.value) + '</dd></div>'; }).join('') + '</dl></div>') : '';
    var final = spec.final ? ('<div class="re-ledger-scroll"><table class="re-ledger-table re-ledger-final"><thead><tr><th>' + esc(finalTitle(spec.final)) + '</th>' +
      spec.final.cols.map(function(c){ return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      spec.final.rows.map(function(r){ return '<tr' + (r.strong ? ' class="re-ledger-strong"' : '') + '><td>' + esc(r.label) + (r.card ? '<span class="re-ledger-mark">' + esc(r.card) + '</span>' : '') + '</td>' + r.values.map(function(v){ return '<td>' + fmt(v, r.fmt || 'usd') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div>' + howBlock(esc(finalHowTitle(spec.final)), spec.final.rows, howOpen ? ' open' : '')) : '';
    el.innerHTML = '<details class="re-ledger"' + (open ? ' open' : '') + '><summary>Check the work <span class="re-ledger-hint">' + esc(spec.hint || 'year by year, and the sale at the end') + '</span></summary>' +
      '<div class="re-ledger-body">' + inputs + '<p class="re-ledger-note">' + (spec.note || '') + '</p>' +
      '<div class="re-ledger-tabs" role="group" aria-label="Ledger">' + tabs + '</div>' + tables + final +
      '<div class="ctw-actions"><button type="button" class="re-ledger-csv">Download CSV</button><button type="button" class="re-ledger-csv re-ledger-copy">Copy as CSV</button></div></div></details>';
    el.setAttribute('data-tab', active);
    el.querySelectorAll('.re-ledger-tab').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-tab');
        el.setAttribute('data-tab', id);
        el.querySelectorAll('.re-ledger-tab').forEach(function(x){ var on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        el.querySelectorAll('[data-panel]').forEach(function(p){ p.hidden = p.getAttribute('data-panel') !== id; });
      });
    });
    el.querySelectorAll('details.re-ledger-how').forEach(function(d){
      d.addEventListener('toggle', function(){
        if (d.hidden) return;
        el.setAttribute('data-how', d.open ? '1' : '0');
        el.querySelectorAll('details.re-ledger-how').forEach(function(x){ if (x !== d && x.open !== d.open) x.open = d.open; });
      });
    });
    var btn = el.querySelector('.re-ledger-csv');
    btn.addEventListener('click', function(){
      var blob = new Blob([toCsv(spec)], { type: 'text/csv' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (spec.csv && spec.csv.filename) || 'ledger.csv';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      var o = btn.textContent; btn.textContent = 'Downloaded'; setTimeout(function(){ btn.textContent = o; }, 1600);
    });
    var cp = el.querySelector('.re-ledger-copy');
    if (cp) cp.addEventListener('click', function(){
      var text = toCsv(spec), o = cp.textContent, done = function(){ cp.classList.add('copied'); cp.textContent = 'Copied ✓'; setTimeout(function(){ cp.classList.remove('copied'); cp.textContent = o; }, 1500); };
      var fallback = function(){ var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
        document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); done(); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback); else fallback();
    });
    el._ledgerSpec = spec;
  }

  // QA for the clarity additions on a rendered ledger: the inputs strip, one
  // marked row, every tab and final row explained and, by default, a Side by
  // side tab whose last row equals its difference column and, on If sold,
  // the marked row (the real-estate pages' shape). A page whose Side by side
  // tab has another shape, or that has none, passes { side: false } and
  // checks its own books.
  // Pages' own QA functions call it.
  function check(el, opts){
    var sp = el && el._ledgerSpec; if (!sp) return false;
    var wantSide = !(opts && opts.side === false);
    var near = function(a, b){ return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b)); };
    var side = sp.tabs.filter(function(t){ return t.id === 'side'; })[0], fin = sp.final.rows.filter(function(r){ return r.card; });
    if (!(sp.inputs && sp.inputs.length > 5) || fin.length !== 1 || (wantSide && !side)) return false;
    if (!sp.tabs.every(function(t){ return hasHow(t.columns); }) || !sp.final.rows.every(function(r){ return !!r.how; })) return false;
    if (!wantSide) return true;
    var last = side.rows[side.rows.length - 1], a = side.columns[1].get(last), b = side.columns[2].get(last);
    if (!near(side.columns[3].get(last), b - a)) return false;
    if (/if sold/.test(side.columns[1].unit) && !(near(a, fin[0].values[0]) && near(b, fin[0].values[1]))) return false;
    return true;
  }
  window.Ledger = { render: render, toCsv: toCsv, check: check };
})();
