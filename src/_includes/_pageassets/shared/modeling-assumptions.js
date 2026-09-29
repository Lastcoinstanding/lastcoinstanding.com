/* ============================================================
   Modeling assumptions — sitewide-sticky preference store
   ============================================================
   See STYLE_GUIDE.md §3.5 for canonical values, framing, and rationale.
   See DATA_AUDIT.md for the citation registry behind preset values.

   Exposes window.ModelingAssumptions with this API:

     ModelingAssumptions.get('inflation')        -> {preset, value}
     ModelingAssumptions.set('inflation', preset [, customValue])
     ModelingAssumptions.presetFor('inflation', 6.5) -> 'm2-growth' (or 'custom')
     ModelingAssumptions.reset()                 -> clears all lcs.* keys
     ModelingAssumptions.subscribe(callback)     -> notifies on change
     ModelingAssumptions.unsubscribe(callback)

   localStorage keys (per STYLE_GUIDE §3.5):
     lcs.inflation.preset           cpi-official | m2-growth | shadow-stats | custom
     lcs.inflation.customValue      number (persisted across preset changes)
     lcs.realReturns.preset         conservative | diversified | sp500-historical
     lcs.homeApprNominal.preset     long-run | since-1990 | since-2000 | custom
     lcs.homeApprNominal.customValue number (nominal %/yr)
     lcs.homeApprNominal.migratedFrom  JSON note, see migrateRealEstate()
     lcs.btcGrowthModel.preset      powerlaw-floor | powerlaw-trend | linear-cagr-decay

   The "custom value" is preserved when a user switches to a non-custom preset,
   so re-selecting Custom restores the last value they entered.

   homeApprNominal replaced the real `realEstate` dimension in PR 4a
   (REAL_ESTATE_PAIR_RULINGS M1): home appreciation is NOMINAL, and
   inflation only deflates the Real display. The real presets (1 / 3.5 /
   5.5) were being re-inflated at M2 growth, which put the default house
   at ~10.2% a year nominal. migrateRealEstate() below converts a real
   custom value once and deletes the old keys.
============================================================ */
(function(){
  'use strict';

  var DIMS = {
    inflation: {
      defaultPreset: 'm2-growth',
      presetValues: {
        'cpi-official': 3.5,
        'm2-growth': 6.5,
        'shadow-stats': 8,
        'custom': null  // value comes from customValue
      },
      hasCustom: true
    },
    realReturns: {
      defaultPreset: 'diversified',
      presetValues: {
        'conservative': 3,
        'diversified': 5,
        'sp500-historical': 7
      },
      hasCustom: false
    },
    // Nominal US home-price growth, annual averages, end point = latest
    // full year (2025). DATA_AUDIT RE-3..RE-5; REAL_ESTATE_PAIR_PR4_SOURCES.md.
    // Default = the highest recorded window (rulings M1: the judgment call
    // leans against bitcoin's case). Consumers: /bitcoin-vs-real-estate
    // (projection) and /bitcoin-vs-rental-property.
    homeApprNominal: {
      defaultPreset: 'since-2000',
      presetValues: {
        'long-run': 3.41,    // Shiller 1890–2022 chained to Case-Shiller National to 2025
        'since-1990': 4.23,  // Case-Shiller National (FRED CSUSHPINSA), 1990–2025
        'since-2000': 4.68,  // Case-Shiller National, 2000–2025
        'custom': null
      },
      hasCustom: true
    },
    btcGrowthModel: {
      // Used by /the-bitcoin-retirement.html. Value is a model identifier
      // (string), not a rate — calculator code maps it to projection logic.
      defaultPreset: 'powerlaw-trend',
      presetValues: {
        'powerlaw-floor': 'powerlaw-floor',
        'powerlaw-trend': 'powerlaw-trend',
        'linear-cagr-decay': 'linear-cagr-decay'
      },
      hasCustom: false
    }
  };

  var subscribers = [];

  function presetKey(dim) { return 'lcs.' + dim + '.preset'; }
  function customKey(dim) { return 'lcs.' + dim + '.customValue'; }

  // Safe localStorage wrappers — degrade gracefully if storage is disabled
  function readStorage(key) {
    try { return localStorage.getItem(key); }
    catch(e) { return null; }
  }
  function writeStorage(key, value) {
    try { localStorage.setItem(key, value); return true; }
    catch(e) { return false; }
  }
  function removeStorage(key) {
    try { localStorage.removeItem(key); }
    catch(e) {}
  }

  function get(dim) {
    var spec = DIMS[dim];
    if (!spec) throw new Error('Unknown modeling-assumption dimension: ' + dim);

    var storedPreset = readStorage(presetKey(dim));
    var preset = (storedPreset && spec.presetValues.hasOwnProperty(storedPreset))
      ? storedPreset
      : spec.defaultPreset;

    var value;
    if (preset === 'custom') {
      var custom = parseFloat(readStorage(customKey(dim)));
      // If custom is selected but no value is stored (shouldn't happen normally),
      // fall back to default
      value = (isFinite(custom)) ? custom : spec.presetValues[spec.defaultPreset];
    } else {
      value = spec.presetValues[preset];
    }

    return { preset: preset, value: value };
  }

  function set(dim, preset, customValue) {
    var spec = DIMS[dim];
    if (!spec) throw new Error('Unknown modeling-assumption dimension: ' + dim);
    if (!spec.presetValues.hasOwnProperty(preset)) {
      throw new Error('Unknown preset "' + preset + '" for dimension "' + dim + '"');
    }
    if (preset === 'custom' && !spec.hasCustom) {
      throw new Error('Dimension "' + dim + '" does not support custom values');
    }

    writeStorage(presetKey(dim), preset);

    if (preset === 'custom' && customValue !== undefined) {
      // Validate range — soft guardrails per STYLE_GUIDE
      var num = parseFloat(customValue);
      if (!isFinite(num)) {
        throw new Error('Custom value must be a finite number');
      }
      // Allow -50% to +500% per Stage 1 spec; outside this range silently clamps
      var clamped = Math.max(-50, Math.min(500, num));
      writeStorage(customKey(dim), String(clamped));
    }
    // If switching AWAY from custom, we deliberately preserve the customValue
    // so re-selecting Custom restores it.

    notify(dim);
  }

  // The preset whose value equals `value`, else 'custom' (or null when the
  // dimension has no custom). Lets a typed value that matches a preset
  // select that preset instead of writing a spurious custom.
  function presetFor(dim, value) {
    var spec = DIMS[dim];
    if (!spec) throw new Error('Unknown modeling-assumption dimension: ' + dim);
    var num = parseFloat(value);
    var keys = Object.keys(spec.presetValues);
    for (var k = 0; k < keys.length; k++) {
      var v = spec.presetValues[keys[k]];
      if (typeof v === 'number' && isFinite(num) && Math.abs(v - num) < 1e-9) return keys[k];
    }
    return spec.hasCustom ? 'custom' : null;
  }

  function reset() {
    Object.keys(DIMS).forEach(function(dim) {
      removeStorage(presetKey(dim));
      removeStorage(customKey(dim));
    });
    removeStorage(MIGRATION_NOTE_KEY);
    subscribers.forEach(function(cb) {
      try { cb('*'); } catch(e) {}
    });
  }

  function subscribe(cb) {
    if (typeof cb !== 'function') throw new Error('subscribe expects a function');
    subscribers.push(cb);
  }
  function unsubscribe(cb) {
    var i = subscribers.indexOf(cb);
    if (i !== -1) subscribers.splice(i, 1);
  }
  function notify(dim) {
    subscribers.forEach(function(cb) {
      try { cb(dim); } catch(e) {}
    });
  }

  // Cross-tab synchronization: when another tab updates a preference,
  // notify subscribers in this tab too.
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', function(e) {
      if (!e.key || e.key.indexOf('lcs.') !== 0) return;
      // Extract dimension from key: lcs.<dim>.preset or lcs.<dim>.customValue
      var parts = e.key.split('.');
      if (parts.length >= 3) {
        notify(parts[1]);
      }
    });
  }

  // ── One-time migration: real `realEstate` → nominal `homeApprNominal` ──
  // (PR 4a, rulings M1.) A deliberate custom REAL value converts once to
  // nominal at the sitewide inflation in force, and a note is left for the
  // page to show in one line. Values equal to an old preset (1 / 3.5 / 5.5)
  // are dropped instead of converted: BvRE's storage restore used to fire a
  // 'change' that wrote the default 3.5 back as "custom" on every return
  // visit, so those are not choices, and converting them at M2 growth
  // would hand returning readers the ~10.2% nominal the ruling removes.
  // No picker for the old dimension ever existed, so its non-custom
  // presets were never chosen either. Old keys are deleted either way.
  var MIGRATION_NOTE_KEY = 'lcs.homeApprNominal.migratedFrom';
  function migrateRealEstate() {
    var oldPreset = readStorage('lcs.realEstate.preset');
    var oldCustom = readStorage('lcs.realEstate.customValue');
    if (oldPreset === null && oldCustom === null) return;
    var real = parseFloat(oldCustom);
    var legacyPresets = [1, 3.5, 5.5];
    var deliberate = oldPreset === 'custom' && isFinite(real) &&
      legacyPresets.every(function(v){ return Math.abs(v - real) > 1e-9; });
    if (deliberate && readStorage(presetKey('homeApprNominal')) === null) {
      var infl = get('inflation').value;
      var nominal = Math.round(((1 + real / 100) * (1 + infl / 100) - 1) * 10000) / 100;
      nominal = Math.max(-50, Math.min(500, nominal));
      writeStorage(presetKey('homeApprNominal'), 'custom');
      writeStorage(customKey('homeApprNominal'), String(nominal));
      writeStorage(MIGRATION_NOTE_KEY, JSON.stringify({ real: real, inflation: infl, nominal: nominal }));
    }
    removeStorage('lcs.realEstate.preset');
    removeStorage('lcs.realEstate.customValue');
  }
  migrateRealEstate();

  // The migration note, or null. Pages show it in one line and clear it
  // when the reader next changes home appreciation.
  function migrationNote() {
    var raw = readStorage(MIGRATION_NOTE_KEY);
    if (!raw) return null;
    try { var n = JSON.parse(raw); return (n && isFinite(n.real) && isFinite(n.nominal)) ? n : null; }
    catch (e) { return null; }
  }
  function clearMigrationNote() { removeStorage(MIGRATION_NOTE_KEY); }

  // Expose
  window.ModelingAssumptions = {
    get: get,
    set: set,
    presetFor: presetFor,
    migrationNote: migrationNote,
    clearMigrationNote: clearMigrationNote,
    reset: reset,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    // Expose dimension specs for UI rendering (read-only view)
    _dimensions: DIMS
  };
})();
