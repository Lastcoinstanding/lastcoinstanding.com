/* ============================================================
   RealEstateBaseline — the pair's shared Baseline assumptions
   ============================================================
   /bitcoin-vs-real-estate (BvRE) and /bitcoin-vs-rental-property
   (BvRP). PR 4f; REAL_ESTATE_PAIR_DESIGN.md §7, rulings M1 and P5.

   The two assumptions both pages share and the site keeps
   (shared/modeling-assumptions.js): nominal home appreciation
   (homeApprNominal) and the deflator for the Real view (inflation).
   Their words and preset buttons come from one file,
   components/real-estate-baseline.njk; each page lays them out in its
   own idiom and calls bind() once. One binder, so the two pages can't
   disagree about a value, a preset or a label.

   A page marks up, by id, with its prefix (BvRE 'fwd', BvRP 'rp'):
     <p>ApprPresets     preset buttons [data-preset], each with a
                        [data-reb-val] span the binder fills from
                        ModelingAssumptions, so the values have one home
     <p>HomeAppreciation text input, nominal % a year
     <p>ApprNotice      one-line notice (a converted pre-4a value, or a
                        link in the older format)
     <p>InflPresets     preset buttons for the deflator
     <p>Inflation       text input, % a year
     <p>DeflatorLine    the Real label: "Real: today's dollars, deflated at
                        6.5% a year (M2 growth)." (P5)
     <p>BaselineHint    the collapsed block's one-line summary
   Any of them may be absent.

   Behaviour, the same for both dimensions:
     - a preset button selects that preset; Custom keeps the current value
       as the starting point and focuses the input;
     - a typed value is committed on 'change': a value equal to a preset
       selects that preset (so restoring a default never writes a
       spurious "custom"), anything else is Custom; an unreadable entry
       puts the current value back;
     - every change goes through ModelingAssumptions, whose subscription
       re-syncs both pages (and other tabs) and calls opts.onChange.

   bind(opts) → { sync(), setLegacyNote(msg) }
     opts.prefix          id prefix (required)
     opts.onChange(dim)   the page re-renders ('homeApprNominal',
                          'inflation' or '*')
     opts.onInput(dim, v) optional: live typing, before it is committed
     opts.inputEventOnPreset  BvRE: fire 'input' on the field after a
                          preset button, so the page's URL writer, which
                          listens there, records the value
   ============================================================ */
(function(){
  'use strict';
  var MA = window.ModelingAssumptions;
  if (!MA) return;

  var INFL_NAMES = { 'cpi-official': 'CPI', 'm2-growth': 'M2 growth', 'shadow-stats': 'Shadow Stats', 'custom': 'custom' };
  var APPR_NAMES = { 'long-run': 'long run, since 1890', 'since-1990': 'since 1990', 'since-2000': 'since 2000', 'custom': 'custom' };

  function pct2(v){ return parseFloat(Number(v).toFixed(2)) + '%'; }
  function parse(el){ return parseFloat(String(el.value).replace(/[%\s]/g, '')); }

  // "deflated at 6.5% a year (M2 growth)": the deflator, named (P5).
  function deflatorPhrase(){
    var i = MA.get('inflation');
    return 'deflated at ' + pct2(i.value) + ' a year (' + INFL_NAMES[i.preset] + ')';
  }
  function realLabel(){ return 'Real: today’s dollars, ' + deflatorPhrase() + '.'; }
  function summary(){
    var a = MA.get('homeApprNominal'), i = MA.get('inflation');
    return 'home prices ' + pct2(a.value) + ' a year nominal (' + APPR_NAMES[a.preset] + ') · Real view deflated at ' +
           pct2(i.value) + ' (' + INFL_NAMES[i.preset] + ')';
  }
  // A pre-4a real value, converted once (ModelingAssumptions.migrationNote).
  function migrationText(){
    var n = MA.migrationNote && MA.migrationNote();
    return n ? ('Your saved home appreciation, ' + pct2(n.real) + ' a year real, was converted to ' + pct2(n.nominal) +
                ' nominal at the ' + pct2(n.inflation) + ' inflation assumption. The calculator now takes appreciation in nominal terms.') : '';
  }

  function bind(opts){
    var p = opts.prefix;
    function $(s){ return document.getElementById(p + s); }
    var ctl = { legacyNote: '' };
    var dims = [
      { dim: 'homeApprNominal', presets: $('ApprPresets'), input: $('HomeAppreciation'), notes: true },
      { dim: 'inflation',       presets: $('InflPresets'), input: $('Inflation') }
    ];

    // The presets' values, from the one place they are kept.
    dims.forEach(function(d){
      if (!d.presets) return;
      var vals = MA._dimensions[d.dim].presetValues;
      d.presets.querySelectorAll('[data-preset]').forEach(function(b){
        var v = vals[b.getAttribute('data-preset')], s = b.querySelector('[data-reb-val]');
        if (s && typeof v === 'number') s.textContent = pct2(v);
      });
    });

    function syncDim(d){
      var cur = MA.get(d.dim);
      // Not while the reader is typing in it.
      if (d.input && document.activeElement !== d.input && parse(d.input) !== cur.value) d.input.value = pct2(cur.value);
      if (d.presets) d.presets.querySelectorAll('[data-preset]').forEach(function(b){
        var on = b.getAttribute('data-preset') === cur.preset;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    function syncText(){
      var line = $('DeflatorLine'); if (line) line.textContent = realLabel();
      var hint = $('BaselineHint'); if (hint) hint.textContent = summary();
      var note = $('ApprNotice');
      if (note) {
        var msg = ctl.legacyNote || migrationText();
        note.textContent = msg;
        note.hidden = !msg;
      }
    }
    function sync(){ dims.forEach(syncDim); syncText(); }
    // Changing appreciation retires both notices.
    function clearNotes(){ ctl.legacyNote = ''; if (MA.clearMigrationNote) MA.clearMigrationNote(); }
    function commit(d, v){
      var pre = MA.presetFor(d.dim, v), cur = MA.get(d.dim);
      if (pre !== cur.preset || (pre === 'custom' && v !== cur.value)) {
        if (d.notes) clearNotes();
        if (pre === 'custom') MA.set(d.dim, 'custom', v); else MA.set(d.dim, pre);
      }
    }
    function fireInput(el){ el.dispatchEvent(new Event('input', { bubbles: true })); }

    dims.forEach(function(d){
      if (d.input) {
        if (opts.onInput) d.input.addEventListener('input', function(e){
          if (e.target !== d.input) return;
          var v = parse(d.input);
          if (isFinite(v)) opts.onInput(d.dim, v);
        });
        d.input.addEventListener('change', function(){
          var typed = parse(d.input);
          if (isFinite(typed)) commit(d, typed);
          // Show the value in force: the typed one, clamped by
          // ModelingAssumptions if out of range, or the current one if the
          // entry couldn't be read. If that differs from what the page last
          // computed with, re-run it.
          var shown = MA.get(d.dim).value;
          d.input.value = pct2(shown);
          if (!(typed === shown)) fireInput(d.input);
        });
      }
      if (d.presets) d.presets.querySelectorAll('[data-preset]').forEach(function(b){
        b.addEventListener('click', function(){
          var pre = b.getAttribute('data-preset');
          if (d.notes) clearNotes();
          if (pre === 'custom') {
            MA.set(d.dim, 'custom', MA.get(d.dim).value);
            if (d.input) { d.input.focus(); if (d.input.select) d.input.select(); }
          } else {
            MA.set(d.dim, pre);
          }
          if (opts.inputEventOnPreset && d.input) fireInput(d.input);
        });
      });
    });

    MA.subscribe(function(dim){
      if (dim !== '*' && dim !== 'homeApprNominal' && dim !== 'inflation') return;
      sync();
      if (opts.onChange) opts.onChange(dim);
    });
    sync();

    ctl.sync = sync;
    ctl.setLegacyNote = function(msg){ ctl.legacyNote = msg || ''; syncText(); };
    return ctl;
  }

  window.RealEstateBaseline = {
    bind: bind,
    deflatorPhrase: deflatorPhrase,
    realLabel: realLabel,
    summary: summary,
    INFL_NAMES: INFL_NAMES,
    APPR_NAMES: APPR_NAMES
  };
})();
