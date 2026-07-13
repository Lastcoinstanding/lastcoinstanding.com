/* shared/crash-model.js — crash timing + recovery model shared by the
   Retirement Stress Test and the Bitcoin Portfolio Allocation drift chart.

   Extracted 2026-07 from three identical port-duplications (drift-chart Phases
   B–D): the crash multiplier + RECOVERY presets, the underwater span + plugin,
   and the band-label clamp. Pure — no DOM, no page state. Loaded before each
   page's script, same convention as power-law-data.js; exposes window.CrashModel.

   Per-page deltas (tint alpha, label wording, band draw position, focus gating,
   preset subset) are supplied by each consumer via config — the module reproduces
   both pages' prior behavior exactly. */
(function () {
  'use strict';

  // Recovery shapes → {years, shape, ceiling?, label, note}. All four; consumers
  // pick subsets (allocation exposes fast/historical/weak; the Stress Test all four).
  var RECOVERY = {
    fast:       { years: 2, shape: 'fast',       label: 'Fast', note: 'back to trend in about 2 years' },
    historical: { years: 3, shape: 'historical', label: 'Historical', note: 'about 3 years to trend, the reliable past pattern' },
    slow:       { years: 6, shape: 'slow',       label: 'Slow', note: 'a long, grinding 6 years to trend' },
    weak:       { years: 6, shape: 'never', ceiling: 0.6, label: 'Weak', note: 'never fully returns to trend, settling toward the Power Law floor' }
  };

  // Per-year price multiplier (≤1). Before the crash: 1. Slides to the trough over
  // troughLagYears, then recovers toward 1 (or a ceiling<1 for 'never') over
  // recoveryYears, eased by shape. Verbatim from both pages' identical copies.
  function crashMultiplier(year, crash) {
    if (!crash) return 1;
    if (year < crash.crashYear) return 1;
    var trough = 1 - crash.depthPct;
    var troughYear = crash.crashYear + crash.troughLagYears;
    if (year <= troughYear) {
      var f = crash.troughLagYears === 0 ? 1 : (year - crash.crashYear) / crash.troughLagYears;
      return 1 - f * crash.depthPct;
    }
    var into = year - troughYear;
    var r = Math.min(1, into / Math.max(1, crash.recoveryYears));
    if (crash.recoveryShape === 'never') {
      var ceil = (crash.recoveryCeiling != null) ? crash.recoveryCeiling : 0.6;
      return trough + r * (ceil - trough);
    }
    if (crash.recoveryShape === 'slow') r = r * r;
    else if (crash.recoveryShape === 'fast') r = Math.sqrt(r);
    return trough + r * (1 - trough);
  }

  function yearsWord(n) { n = Math.round(n); return n + (n === 1 ? ' year' : ' years'); }

  // Underwater span. onset = value AT the crash year (both pages' convention —
  // verified equal in discovery). Scan strictly after onset for the trough and
  // the first year the value regains onset. endY = recovery year, else depletion
  // year, else the horizon end. `valueAt(year)` returns the (crashed) total for a
  // year, or null to skip. Returns null when onset is not positive. The extra
  // fields (troughV/troughY/dropPct) let each page reproduce its copy exactly.
  function underwaterSpan(valueAt, onsetYear, endYear, depletionYear) {
    var onset = valueAt(onsetYear);
    if (onset == null || !(onset > 0)) return null;
    var troughV = onset, troughY = onsetYear, recY = null;
    for (var y = onsetYear + 1; y <= endYear; y++) {
      var v = valueAt(y);
      if (v == null) continue;
      if (v < troughV) { troughV = v; troughY = y; }
      if (recY === null && v >= onset) recY = y;
    }
    var recovered = recY !== null;
    var underwater = recovered ? (recY - onsetYear)
      : (depletionYear != null ? (depletionYear - onsetYear) : (endYear - onsetYear));
    return {
      onset: onset, onsetY: onsetYear, troughV: troughV, troughY: troughY,
      recY: recY, recovered: recovered,
      endY: recovered ? recY : (depletionYear != null ? depletionYear : endYear),
      underwater: Math.max(0, underwater),
      dropPct: Math.round(100 * (1 - troughV / onset))
    };
  }

  // Clamp a band label to the chart area so a late/edge band never clips the text
  // (drift-chart Phase D). Prefer centered over the band, clamp inside [left,right];
  // if too wide, wrap at "… / within your horizon"; else left-align (extend left).
  function drawBandLabel(ctx, text, x0, x1, left, right, topY) {
    var pad = 4, center = (x0 + x1) / 2, avail = right - left - 2 * pad;
    function place(t, y) {
      var w = ctx.measureText(t).width;
      var cx = Math.max(left + pad + w / 2, Math.min(center, right - pad - w / 2));
      ctx.textAlign = 'center'; ctx.fillText(t, cx, y);
    }
    if (ctx.measureText(text).width <= avail) { place(text, topY); return; }
    var idx = text.indexOf(' within ');
    if (idx > 0) { place(text.slice(0, idx), topY); place(text.slice(idx + 1), topY + 12); }
    else { ctx.textAlign = 'left'; ctx.fillText(text, left + pad, topY); }
  }

  // Factory for the underwater Chart.js plugin, parameterized for the per-page
  // deltas. cfg:
  //   id, spKey                     — chart property holding the span object ($sp/$uw)
  //   tint                          — band fill (color incl. alpha)
  //   bandBehind                    — true → draw band in beforeDatasetsDraw (behind)
  //   levelLineColor, levelLabelColor, levelLabel  — dashed pre-crash level line
  //   labelColor, label(sp)         — band label text for a span
  //   minUnderwater                 — only draw the label if sp.underwater ≥ this (default 0)
  //   active(chart)                 — optional draw gate (default: span present)
  function makeUnderwaterPlugin(cfg) {
    function span(c) { return c[cfg.spKey]; }
    function gate(c) { return (!cfg.active || cfg.active(c)) && span(c); }
    function drawBand(c) {
      var sp = span(c), xS = c.scales.x, yS = c.scales.y, ctx = c.ctx;
      var x0 = Math.max(xS.getPixelForValue(sp.onsetY), xS.left);
      var x1 = Math.min(xS.getPixelForValue(sp.endY), xS.right);
      if (x1 <= x0) return;
      ctx.save(); ctx.fillStyle = cfg.tint; ctx.fillRect(x0, yS.top, x1 - x0, yS.bottom - yS.top); ctx.restore();
    }
    return {
      id: cfg.id,
      beforeDatasetsDraw: function (c) { if (cfg.bandBehind && gate(c)) drawBand(c); },
      afterDatasetsDraw: function (c) {
        if (!gate(c)) return;
        var sp = span(c), xS = c.scales.x, yS = c.scales.y, ctx = c.ctx;
        if (!cfg.bandBehind) drawBand(c);
        // dashed pre-crash level line + label
        var yp = yS.getPixelForValue(sp.onset);
        if (yp >= yS.top && yp <= yS.bottom) {
          ctx.save();
          ctx.setLineDash([4, 3]); ctx.strokeStyle = cfg.levelLineColor; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(xS.left, yp); ctx.lineTo(xS.right, yp); ctx.stroke();
          ctx.setLineDash([]); ctx.fillStyle = cfg.levelLabelColor; ctx.font = '600 10px Inter, sans-serif'; ctx.textAlign = 'left';
          ctx.fillText(cfg.levelLabel, xS.left + 4, yp - 4);
          ctx.restore();
        }
        // band label, edge-clamped
        var x0 = Math.max(xS.getPixelForValue(sp.onsetY), xS.left);
        var x1 = Math.min(xS.getPixelForValue(sp.endY), xS.right);
        if (x1 > x0 && sp.underwater >= (cfg.minUnderwater || 0)) {
          ctx.save();
          ctx.fillStyle = cfg.labelColor; ctx.font = '700 11px Inter, sans-serif';
          drawBandLabel(ctx, cfg.label(sp), x0, x1, xS.left, xS.right, yS.top + 13);
          ctx.restore();
        }
      }
    };
  }

  window.CrashModel = {
    RECOVERY: RECOVERY,
    crashMultiplier: crashMultiplier,
    yearsWord: yearsWord,
    underwaterSpan: underwaterSpan,
    drawBandLabel: drawBandLabel,
    makeUnderwaterPlugin: makeUnderwaterPlugin
  };
})();
