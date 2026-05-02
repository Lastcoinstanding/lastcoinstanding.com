/* ============================================================
   Modeling assumptions — sitewide-sticky preference store
   ============================================================
   See STYLE_GUIDE.md §3.5 for canonical values, framing, and rationale.
   See DATA_AUDIT.md for the citation registry behind preset values.

   Exposes window.ModelingAssumptions with this API:

     ModelingAssumptions.get('inflation')        -> {preset, value}
     ModelingAssumptions.set('inflation', preset [, customValue])
     ModelingAssumptions.reset()                 -> clears all lcs.* keys
     ModelingAssumptions.subscribe(callback)     -> notifies on change
     ModelingAssumptions.unsubscribe(callback)

   localStorage keys (per STYLE_GUIDE §3.5):
     lcs.inflation.preset           cpi-official | m2-growth | shadow-stats | custom
     lcs.inflation.customValue      number (persisted across preset changes)
     lcs.realReturns.preset         conservative | diversified | sp500-historical
     lcs.realEstate.preset          long-run | recent-decades | optimistic | custom
     lcs.realEstate.customValue     number

   The "custom value" is preserved when a user switches to a non-custom preset,
   so re-selecting Custom restores the last value they entered.
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
    realEstate: {
      defaultPreset: 'recent-decades',
      presetValues: {
        'long-run': 1,
        'recent-decades': 3.5,
        'optimistic': 5.5,
        'custom': null
      },
      hasCustom: true
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

  function reset() {
    Object.keys(DIMS).forEach(function(dim) {
      removeStorage(presetKey(dim));
      removeStorage(customKey(dim));
    });
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

  // Expose
  window.ModelingAssumptions = {
    get: get,
    set: set,
    reset: reset,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    // Expose dimension specs for UI rendering (read-only view)
    _dimensions: DIMS
  };
})();
