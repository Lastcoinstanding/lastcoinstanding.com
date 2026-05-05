/* The Bitcoin Retirement — page scripts
 * Phase 3 / commit 1: tab switching only.
 * The shared modeling-assumptions API and per-page interactivity
 * (slider clusters, math engine, chart, baseline cluster) land across
 * commits 2–7.
 */

(function(){
  var btns = document.querySelectorAll('.tab-btn');
  if (!btns.length) return;

  function activate(tabKey) {
    btns.forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(t){ t.classList.remove('active'); });
    var btn = document.querySelector('[data-tab="' + tabKey + '"]');
    var pane = document.getElementById('tab-' + tabKey);
    if (btn) btn.classList.add('active');
    if (pane) pane.classList.add('active');
  }

  btns.forEach(function(b){
    b.addEventListener('click', function(){
      var key = b.dataset.tab;
      activate(key);
      // Update URL hash without scrolling
      if (history.replaceState) {
        history.replaceState(null, '', '#' + key);
      }
    });
  });

  // Hash deep-linking on page load
  if (window.location.hash) {
    var hash = window.location.hash.replace('#','');
    if (document.querySelector('[data-tab="' + hash + '"]')) {
      activate(hash);
    }
  }
})();

/* ════════════════════════════════════════════════════════════════
   Phase 3 / commit 2 — Baseline assumptions cluster
   Wires the picker UI to the shared ModelingAssumptions API.
   Three pickers: Inflation (4 cards), Bitcoin growth model (3 cards),
   Traditional portfolio benchmark (3 cards). Plus Hide affordance,
   Custom inflation inline input, Reset link.
   See RETIREMENT_CALCULATOR_DESIGN §9.2.9.
═══════════════════════════════════════════════════════════════════ */

(function(){
  if (!window.ModelingAssumptions) return; // graceful no-op if shared script absent

  var MA = window.ModelingAssumptions;
  var STORAGE_KEY_BASELINE_HIDDEN = 'lcs.theBitcoinRetirement.baselineHidden';

  // ─── Picker rendering: reflect canonical state into card .active classes
  function renderPicker(dim) {
    var grid = document.querySelector('.picker[data-dim="' + dim + '"]');
    if (!grid) return;
    var current = MA.get(dim);
    var cards = grid.querySelectorAll('.picker-card');
    cards.forEach(function(card){
      if (card.dataset.preset === current.preset) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
    // Reveal/hide custom inflation input
    if (dim === 'inflation') {
      var wrap = document.getElementById('inflationCustomWrap');
      var input = document.getElementById('inflationCustom');
      if (wrap && input) {
        if (current.preset === 'custom') {
          wrap.hidden = false;
          // Sync visible value from canonical (only if input is not focused mid-edit)
          if (document.activeElement !== input) {
            var v = current.value;
            if (isFinite(v)) input.value = v;
          }
        } else {
          wrap.hidden = true;
        }
      }
    }
  }
  function renderAll() {
    renderPicker('inflation');
    renderPicker('btcGrowthModel');
    renderPicker('realReturns');
  }

  // ─── Picker click delegation
  function bindPicker(dim) {
    var grid = document.querySelector('.picker[data-dim="' + dim + '"]');
    if (!grid) return;
    grid.addEventListener('click', function(e){
      var card = e.target.closest('.picker-card');
      if (!card || !grid.contains(card)) return;
      var preset = card.dataset.preset;
      if (!preset) return;
      try { MA.set(dim, preset); } catch (err) { /* unknown preset — ignore */ }
      // For Custom inflation, focus the input so the user can type immediately
      if (dim === 'inflation' && preset === 'custom') {
        var input = document.getElementById('inflationCustom');
        if (input) {
          // wait for the wrap to un-hide via renderPicker (subscribe callback)
          setTimeout(function(){ input.focus(); input.select(); }, 0);
        }
      }
    });
  }

  // ─── Custom inflation input — write back to canonical on change
  function bindCustomInflationInput() {
    var input = document.getElementById('inflationCustom');
    if (!input) return;
    function commit() {
      var v = parseFloat(input.value);
      if (!isFinite(v)) return;
      try { MA.set('inflation', 'custom', v); } catch (err) {}
    }
    // Debounce while typing; commit on blur and Enter
    var t = null;
    input.addEventListener('input', function(){
      if (t) clearTimeout(t);
      t = setTimeout(commit, 200);
    });
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function(e){
      if (e.key === 'Enter') { e.preventDefault(); commit(); input.blur(); }
    });
  }

  // ─── Hide / Show baseline cluster body, with localStorage persistence
  function bindHideToggle() {
    var cluster = document.getElementById('baselineCluster');
    var toggle = document.getElementById('baselineToggle');
    if (!cluster || !toggle) return;
    function applyState(hidden) {
      cluster.classList.toggle('collapsed', hidden);
      toggle.textContent = hidden ? 'Show baseline assumptions' : 'Hide';
      try { localStorage.setItem(STORAGE_KEY_BASELINE_HIDDEN, hidden ? '1' : '0'); } catch(e) {}
    }
    // Initial state from storage
    var initiallyHidden = false;
    try { initiallyHidden = localStorage.getItem(STORAGE_KEY_BASELINE_HIDDEN) === '1'; } catch(e) {}
    if (initiallyHidden) applyState(true);
    else toggle.textContent = 'Hide';
    toggle.addEventListener('click', function(e){
      e.preventDefault();
      applyState(!cluster.classList.contains('collapsed'));
    });
  }

  // ─── Reset baseline link — clear all canonical baseline values
  function bindResetLink() {
    var link = document.getElementById('baselineReset');
    if (!link) return;
    link.addEventListener('click', function(e){
      e.preventDefault();
      // ModelingAssumptions.reset() clears every dimension. That includes
      // realEstate (which this page doesn't expose) — fine; resetting an
      // unused dimension is a harmless no-op for this page.
      MA.reset();
      // Subscribe callback below will renderAll(); explicit call is just defense.
      renderAll();
    });
  }

  // ─── Cross-tab sync: re-render when any baseline dim changes
  if (MA.subscribe) {
    MA.subscribe(function(dim){
      if (dim === 'inflation' || dim === '*') renderPicker('inflation');
      if (dim === 'btcGrowthModel' || dim === '*') renderPicker('btcGrowthModel');
      if (dim === 'realReturns' || dim === '*') renderPicker('realReturns');
    });
  }

  // ─── Initial wire-up
  renderAll();
  bindPicker('inflation');
  bindPicker('btcGrowthModel');
  bindPicker('realReturns');
  bindCustomInflationInput();
  bindHideToggle();
  bindResetLink();
})();
