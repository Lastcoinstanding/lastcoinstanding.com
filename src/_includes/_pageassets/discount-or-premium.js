/* =============================================================
   Discount, or Premium? — page script

   One two-sided lens: where is bitcoin right now relative to its
   long-run Power Law trend (a discount below 1×, a premium above),
   and what does RETURNING to trend imply for annualised return?

   The editorial spine is symmetry. The same arithmetic runs both
   directions with no branching: below trend it produces an elevated
   implied CAGR, above trend a depressed or negative one. It would
   have said harsh things at every past top, and the backtest section
   shows exactly that — computed from the model, not asserted.

   Reads PL_A/PL_B/PL_FLOOR + GENESIS_TS + plPrice + TODAY_DAYS/
   TODAY_PRICE + fetchTodayPrice + todayPriceIsLive/todayPriceNote
   from shared/power-law-data.js. NO new constants and no new data
   dependency: every figure is the canonical trend re-expressed in
   CAGR terms, recomputed live on each load.

   Guardrails enforced here (design doc §5) — these are structural,
   not cosmetic:
     • The implied CAGR is never written without the at-trend baseline
       and the never-reverts line, which live in the same render pass.
     • "discount" only when m < 1, "premium" only when m > 1; between
       0.95× and 1.05× the copy says "roughly at trend" and the delta
       row reads ~0 rather than manufacturing drama at the boundary.
     • The at-the-floor line renders only while m <= PL_FLOOR*1.05 and
       removes itself when the state changes.
     • Fallback prices are labelled "latest monthly data", never "live".
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof plPrice !== 'function') return;

  // ── Palette (shared conventions) ──
  var AMBER = '#e09422', BLUE = '#6db3d4', MUTED = '#7a7367', DIM = '#9a9080';

  // ── Horizon bounds: 6 months – 5 years, in whole months ──
  var MIN_M = 6, MAX_M = 60, YEAR_D = 365.25;

  // ── Near-trend dead-band: no "discount"/"premium" language inside it ──
  var NEAR_LO = 0.95, NEAR_HI = 1.05;

  var state = { months: 36 };
  var livePrice = null, liveSource = 'seed';

  // Optional holdings (BTC). Privacy fence (design doc §9 Phase 2): this value
  // lives HERE and nowhere else — never written to the URL, sessionStorage,
  // localStorage, or any network request. syncUrl() below only ever writes ?y=.
  var holdings = 0;
  var MAX_BTC = 21000000;

  function price() { return livePrice != null ? livePrice : TODAY_PRICE; }
  function trendToday() { return plPrice(TODAY_DAYS); }
  function multiple() { return price() / trendToday(); }

  // Core arithmetic. Both use the same shape — the only difference is the
  // denominator: today's PRICE for the reversion case, today's TREND for the
  // baseline. That symmetry is why no branching is needed for premiums.
  function revCAGR(y) { return Math.pow(plPrice(TODAY_DAYS + YEAR_D * y) / price(), 1 / y) - 1; }
  function trendCAGR(y) { return Math.pow(plPrice(TODAY_DAYS + YEAR_D * y) / trendToday(), 1 / y) - 1; }

  // ── Format helpers ──
  function pct0(v) { return Math.round(v * 100) + '%'; }
  function signPct0(v) { var r = Math.round(v * 100); return (r > 0 ? '+' : r < 0 ? '−' : '') + Math.abs(r) + '%'; }
  function money(v) {
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }
  function moneyFull(v) { return '$' + Math.round(v).toLocaleString(); }
  function fmtHorizon(months) {
    if (months < 12) return months + ' months';
    var y = months / 12;
    return (months % 12 === 0) ? y + (y === 1 ? ' year' : ' years') : y.toFixed(1) + ' years';
  }

  // ── Two-sided vocabulary. The ONLY place discount/premium words are
  //    chosen, so the boundary rule cannot drift between call sites. ──
  function stance(m) {
    if (m < NEAR_LO) return 'discount';
    if (m > NEAR_HI) return 'premium';
    return 'at-trend';
  }

  // ════════ THE EMBLEM — live status strip ════════
  function renderStatus() {
    var p = price(), t = trendToday(), m = multiple(), s = stance(m);

    var elPrice = document.getElementById('dpPrice');
    var elTrend = document.getElementById('dpTrend');
    var elMult = document.getElementById('dpMult');
    var elMultSub = document.getElementById('dpMultSub');
    var elPriceSub = document.getElementById('dpPriceSub');
    var elMeta = document.getElementById('dpStatusMeta');

    if (elPrice) elPrice.textContent = moneyFull(p);
    if (elTrend) elTrend.textContent = moneyFull(t);
    if (elMult) elMult.textContent = m.toFixed(2) + '×';

    if (elPriceSub) {
      elPriceSub.textContent = todayPriceIsLive(liveSource)
        ? 'Live spot price.'
        : 'Latest monthly data — the live fetch did not resolve.';
    }

    if (elMultSub) {
      if (s === 'discount') {
        elMultSub.innerHTML = 'Bitcoin is trading at a <strong>' + pct0(1 - m) + ' discount</strong> to its long-run trend.';
      } else if (s === 'premium') {
        elMultSub.innerHTML = 'Bitcoin is trading at a <strong>' + pct0(m - 1) + ' premium</strong> to its long-run trend.';
      } else {
        elMultSub.innerHTML = 'Bitcoin is <strong>roughly at trend</strong> — neither a meaningful discount nor a premium.';
      }
    }

    // Per-coin dollar gap beneath the multiple verdict. No holdings needed.
    // Hidden inside the near-trend dead band — same 0.95–1.05× boundary as the
    // verdict. gap = |trend − price|; its provenance is the price's (live/fallback).
    var elGap = document.getElementById('dpGapLine');
    if (elGap) {
      if (s === 'at-trend') {
        elGap.hidden = true;
      } else {
        var gap = Math.abs(t - p);
        elGap.innerHTML = 'That’s ≈ <strong>' + moneyFull(gap) + '</strong> per coin '
          + (p < t ? 'below' : 'above') + ' what the trend puts bitcoin at today.';
        elGap.hidden = false;
      }
    }

    if (elMeta) {
      elMeta.textContent = (todayPriceIsLive(liveSource) ? 'Live: ' : 'Latest monthly data: ')
        + moneyFull(p) + ' · ' + m.toFixed(2) + '× trend · recomputed every page load.';
    }

    // Live pulse dot — honesty guardrail, not decoration: shown ONLY when the
    // fetch actually resolved to a live spot price, hidden on the monthly-data
    // fallback so the pulse can never imply liveness it doesn't have.
    var liveDot = document.getElementById('dpLiveDot');
    if (liveDot) liveDot.hidden = !todayPriceIsLive(liveSource);

    // At-the-floor honesty line — conditional, self-removing.
    var floorNote = document.getElementById('dpFloorNote');
    if (floorNote) floorNote.hidden = !(m <= PL_FLOOR * 1.05);
  }

  // ════════ THE INTERACTIVE ════════
  function renderCalc() {
    var y = state.months / 12, m = multiple(), s = stance(m);
    var rev = revCAGR(y), tr = trendCAGR(y), delta = rev - tr;

    var elH = document.getElementById('dpHorizonReadout');
    if (elH) elH.innerHTML = 'Reverting to trend over <strong>' + fmtHorizon(state.months) + '</strong>';

    var elRev = document.getElementById('dpRevNum');
    var elRevSub = document.getElementById('dpRevSub');
    var elTr = document.getElementById('dpTrendNum');
    var elTrSub = document.getElementById('dpTrendSub');
    if (elRev) elRev.textContent = signPct0(rev);
    if (elTr) elTr.textContent = signPct0(tr);
    if (elRevSub) elRevSub.textContent = 'per year, if price returns to trend by ' + horizonDateLabel();
    if (elTrSub) elTrSub.textContent = 'per year for someone who bought AT trend — the trend’s own growth, annualized from today to ' + horizonDateLabel() + '. This rate declines as the horizon extends.';

    // Per-holdings dollar lines — shown only when a stack is entered; the empty
    // state leaves both cards exactly as before. Values are algebraically the
    // same ratios the CAGRs above are built from, so they can't disagree (the
    // self-consistency gate, design doc §9 Phase 2, verifies this). Their $
    // provenance is the live/fallback price they derive from.
    var elRevMoney = document.getElementById('dpRevMoney');
    var elTrMoney = document.getElementById('dpTrendMoney');
    if (holdings > 0) {
      var hzTrend = plPrice(TODAY_DAYS + YEAR_D * y); // trend price at the horizon
      var stackToday = holdings * price();
      var stackAtTrend = holdings * hzTrend;                 // reverts to trend
      var stackNeverChanges = holdings * m * hzTrend;        // multiple held fixed
      if (elRevMoney) {
        elRevMoney.innerHTML = 'Your stack: <strong>' + moneyFull(stackToday) + '</strong> today &rarr; <strong>'
          + moneyFull(stackAtTrend) + '</strong> at trend on ' + horizonDateLabel() + '.';
        elRevMoney.hidden = false;
      }
      if (elTrMoney) {
        elTrMoney.innerHTML = '&rarr; <strong>' + moneyFull(stackNeverChanges)
          + '</strong> if the multiple never changes.';
        elTrMoney.hidden = false;
      }
    } else {
      if (elRevMoney) { elRevMoney.hidden = true; elRevMoney.textContent = ''; }
      if (elTrMoney) { elTrMoney.hidden = true; elTrMoney.textContent = ''; }
    }

    // Uplift (below trend) / drag (above trend) — same subtraction both ways.
    var elDelta = document.getElementById('dpDelta');
    if (elDelta) {
      var cls = 'dp-delta ', txt;
      if (s === 'at-trend' || Math.abs(delta) < 0.015) {
        cls += 'dp-delta-flat';
        txt = 'Price is roughly at trend, so reversion adds <strong>almost nothing</strong> either way — the two figures above are essentially the same number.';
      } else if (delta > 0) {
        cls += 'dp-delta-up';
        txt = 'The discount is worth an <strong>additional uplift of ' + signPct0(delta) + '/yr</strong> over the at-trend baseline for your chosen horizon — this is what makes buying below trend buying at a <strong>discount</strong>.';
      } else {
        cls += 'dp-delta-down';
        txt = 'The premium is a <strong>drag of ' + signPct0(delta) + '/yr</strong> against the at-trend baseline — reverting from a premium means a lower CAGR than the trend’s own, over your chosen horizon.';
      }
      elDelta.className = cls;
      elDelta.innerHTML = txt;
    }

    // The never-reverts case — permanent UI. Uses the trend slope at the SAME
    // horizon so the reader is comparing like with like.
    var elNever = document.getElementById('dpNever');
    if (elNever) {
      elNever.innerHTML = '<span class="dp-never-tag">And if it never reverts</span> '
        + 'If the multiple simply stays where it is, you earn the trend’s own slope — about <strong>'
        + signPct0(tr) + '/yr</strong> annualized over this horizon, a rate that itself declines as bitcoin matures (see below). That is the assumption-free case. '
        + 'The multiple can also <em>fall further</em>: the ' + PL_FLOOR.toFixed(2)
        + '× floor has held for the length of the record, which is evidence, not a guarantee.';
    }

    updateChart();
    syncUrl();
  }

  function horizonDateLabel() {
    var d = new Date((GENESIS_TS + (TODAY_DAYS + YEAR_D * state.months / 12) * 86400) * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  // The reversion path's name — the date it assumes reversion completes by.
  // Recomputed wherever it appears (legend + tooltip) so it tracks the slider.
  function glideLabel() { return 'If it reverts by ' + horizonDateLabel(); }

  // ════════ CHART — two views (design doc §9 Phase 3) ════════
  // Rate view: implied CAGR vs horizon (Phase 1/2 behaviour, unchanged). Price
  // view: price on a log axis over the whole channel, with the glide path the
  // slider implies. The Chart.js instance is rebuilt on toggle; the slider state
  // is shared across both views. `view` is NOT URL-persisted (default Rate).
  var chart = null;
  var view = 'rate';                      // 'rate' | 'price'
  var PULSE = '#F7931A', RED = '#c0392b'; // live-price accent + floor/low red
  function curves() {
    var rev = [], tr = [], mo;
    for (mo = MIN_M; mo <= MAX_M; mo++) {
      var y = mo / 12;
      rev.push({ x: y, y: revCAGR(y) * 100 });
      tr.push({ x: y, y: trendCAGR(y) * 100 });
    }
    return { rev: rev, tr: tr };
  }
  function markerPlugin() {
    return {
      id: 'dpMarker',
      afterDatasetsDraw: function (c) {
        var y = state.months / 12;
        var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx;
        var px = xS.getPixelForValue(y), py = yS.getPixelForValue(revCAGR(y) * 100);
        if (!isFinite(px) || !isFinite(py)) return;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(px, c.chartArea.top); ctx.lineTo(px, c.chartArea.bottom);
        ctx.strokeStyle = 'rgba(242,238,232,0.25)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = AMBER; ctx.fill();
        ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      }
    };
  }
  function buildRateChart() {
    var el = document.getElementById('dpChart');
    if (!el || typeof Chart === 'undefined') return;
    var c = curves();
    chart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: {
        datasets: [
          { label: 'Implied CAGR if it reverts to trend', data: c.rev, borderColor: AMBER, backgroundColor: AMBER, borderWidth: 2.2, pointRadius: 0, tension: 0.25, fill: false },
          { label: 'At-trend implied CAGR (never reverts)', data: c.tr, borderColor: BLUE, backgroundColor: BLUE, borderWidth: 1.8, borderDash: [5, 4], pointRadius: 0, tension: 0.25, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 14, right: 10 } },
        scales: {
          x: {
            type: 'linear', min: MIN_M / 12, max: MAX_M / 12,
            title: { display: true, text: 'Years to revert to trend', color: MUTED, font: { family: 'Inter, sans-serif', size: 11 } },
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { return v + 'y'; } }
          },
          y: {
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { return Math.round(v) + '%'; } }
          }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 9 } },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1,
            titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function (it) { return it.length ? 'Reverting over ' + it[0].parsed.x.toFixed(1) + ' years' : ''; },
              label: function (it) { return it.dataset.label + ': ' + Math.round(it.parsed.y) + '%/yr'; },
              // The trend price at the hovered horizon (always), and the stack's
              // value at trend then (only when a stack is entered). $ provenance
              // is the live/fallback spot the reversion figures derive from.
              afterBody: function (items) {
                if (!items || !items.length) return '';
                var tp = plPrice(TODAY_DAYS + YEAR_D * items[0].parsed.x);
                var lines = ['Trend price then: ' + moneyFull(tp)];
                if (holdings > 0) lines.push('Your stack at trend: ' + moneyFull(holdings * tp));
                return lines;
              }
            }
          }
        }
      },
      plugins: [markerPlugin()]
    });
  }
  function updateRateChart() {
    var c = curves();
    chart.data.datasets[0].data = c.rev;
    chart.data.datasets[1].data = c.tr;
    chart.update('none');
  }

  // ---- PRICE VIEW ----
  // Canonical cycle lows (same anchors as the backtest) and the days where price
  // later regained trend (≈May 2017 / May 2019 / Mar 2024) — subtle highlights.
  var LOW_MARKERS = [{ d: 2202, p: 180 }, { d: 3633, p: 3183 }, { d: 5070, p: 15476 }];
  var REGAIN_DAYS = [3062, 3784, 5548];

  function dayToDate(d) {
    return new Date((GENESIS_TS + d * 86400) * 1000)
      .toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  function priceTick(v) {
    if (v >= 1e6) return '$' + (v / 1e6) + 'M';
    if (v >= 1e3) return '$' + (v / 1e3) + 'K';
    return '$' + v;
  }
  // Static channel series over the full record + 5 years, so every slider horizon
  // fits without a rescale. x = days since genesis; y = USD (log axis).
  function priceStatic() {
    var minD = PL_DATA[0][0], maxD = TODAY_DAYS + YEAR_D * 5, i;
    var hist = [];
    for (i = 0; i < PL_DATA.length; i++) hist.push({ x: PL_DATA[i][0], y: PL_DATA[i][1] });
    var trend = [], floor = [], ceil = [], N = 160;
    for (i = 0; i <= N; i++) {
      var d = minD + (maxD - minD) * i / N;
      trend.push({ x: d, y: plPrice(d) });
      floor.push({ x: d, y: PL_FLOOR * plPrice(d) });
      ceil.push({ x: d, y: PL_CEIL * plPrice(d) });
    }
    var lows = LOW_MARKERS.map(function (o) { return { x: o.d, y: o.p }; });
    var regains = REGAIN_DAYS.map(function (d) { return { x: d, y: plPrice(d) }; });
    return { hist: hist, trend: trend, floor: floor, ceil: ceil, lows: lows, regains: regains, minD: minD, maxD: maxD };
  }
  // Dynamic paths that track the slider. A straight line between two points on a
  // log y-axis IS straight in log space, so two points each suffice.
  function pricePaths() {
    var hd = TODAY_DAYS + YEAR_D * state.months / 12;
    return {
      dot: [{ x: TODAY_DAYS, y: price() }],
      glide: samplePath(glideAt, TODAY_DAYS, hd),   // constant-CAGR (straight in log)
      never: samplePath(neverAt, TODAY_DAYS, hd)    // constant-multiple (parallel to trend)
    };
  }
  function dotColor() { return todayPriceIsLive(liveSource) ? PULSE : MUTED; }

  // ---- Date-anchored crosshair (shared by Full history + Your window) ----
  // One source of truth: priceSeriesAt / horizonSeriesAt compute every series' value
  // at a date. The HTML tooltip rows, their colour chips, and the on-canvas marker
  // dots all read from it, so they can never disagree. hoverDayPlugin resolves the
  // pointer x → a day (ahead of the tooltip's own handling) and forces a re-render so
  // the crosshair tracks smoothly; it draws the guide line + dots ONLY while hovering
  // ($hoverDay != null), so camera exports — taken with no hover — stay clean.
  var hoverDayPlugin = {
    id: 'dpHoverDay',
    beforeEvent: function (chart, args) {
      var e = args.event;
      if (e.type === 'mousemove') {
        var ca = chart.chartArea;
        var nd = (e.x >= ca.left && e.x <= ca.right) ? chart.scales.x.getValueForPixel(e.x) : null;
        if (nd !== chart.$hoverDay) { chart.$hoverDay = nd; args.changed = true; }
      } else if (e.type === 'mouseout') {
        if (chart.$hoverDay != null) { chart.$hoverDay = null; args.changed = true; }
      }
    },
    afterDatasetsDraw: function (chart) {
      var d = chart.$hoverDay;
      if (d == null) return;
      var xS = chart.scales.x, yS = chart.scales.y, ctx = chart.ctx, ca = chart.chartArea;
      var px = xS.getPixelForValue(d);
      if (!isFinite(px) || px < ca.left || px > ca.right) return;
      var series = (yS.type === 'logarithmic') ? priceSeriesAt(d) : horizonSeriesAt(d);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(px, ca.top); ctx.lineTo(px, ca.bottom);
      ctx.strokeStyle = 'rgba(242,238,232,0.16)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke();
      ctx.setLineDash([]);
      for (var i = 0; i < series.length; i++) {
        var s = series[i];
        if (!s.line) continue;
        var py = yS.getPixelForValue(s.value);
        if (!isFinite(py) || py < ca.top - 1 || py > ca.bottom + 1) continue;
        ctx.beginPath(); ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = s.color; ctx.fill();
        ctx.strokeStyle = '#0a0908'; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
    }
  };

  // Nearest monthly PL_DATA sample to day d (the "Price (history)" row/dot).
  function nearestSample(d) {
    var best = PL_DATA[0], bd = Math.abs(PL_DATA[0][0] - d);
    for (var i = 1; i < PL_DATA.length; i++) { var dd = Math.abs(PL_DATA[i][0] - d); if (dd < bd) { bd = dd; best = PL_DATA[i]; } }
    return best[1];
  }
  // Glide value at day d — straight in LOG space between (today, price) and
  // (today + y, trend at horizon), exactly how the glide is drawn on the log axis.
  function glideAt(d) {
    var d0 = TODAY_DAYS, d1 = TODAY_DAYS + YEAR_D * state.months / 12, p0 = price(), p1 = plPrice(d1);
    if (d <= d0) return p0;
    if (d >= d1) return p1;
    var f = (d - d0) / (d1 - d0);
    return Math.exp(Math.log(p0) + (Math.log(p1) - Math.log(p0)) * f);
  }
  // Never-reverts value at day d: the multiple held constant × trend at that date.
  function neverAt(d) { return multiple() * plPrice(d); }
  // Sample a path fn(day) at monthly steps across [d0, d1] (endpoint included). This
  // is what makes the dashed paths correct on a log axis: the constant-CAGR reversion
  // (glideAt) renders straight, the constant-multiple never-reverts (neverAt) renders
  // parallel to the trend's curve — instead of both being 2-point straight segments.
  function samplePath(fn, d0, d1) {
    var pts = [], step = YEAR_D / 12, d;
    for (d = d0; d < d1 - 1e-6; d += step) pts.push({ x: d, y: fn(d) });
    pts.push({ x: d1, y: fn(d1) });
    return pts;
  }

  // Series present at date d, in fixed row order. Each entry: label, value, colour
  // (chip + dot), dashed (chip/line style), line (has a plotted line → gets a dot).
  // `line:false` rows (Your stack at trend) get a row + chip but no dot — there is
  // no stack line on the chart. Colours are the readable form of each series' hue.
  function priceSeriesAt(d) {
    var lastD = PL_DATA[PL_DATA.length - 1][0], t = plPrice(d), d1 = TODAY_DAYS + YEAR_D * state.months / 12, out = [];
    if (d <= lastD) out.push({ label: 'Price (history)', value: nearestSample(d), color: MUTED, dashed: false, line: true });
    out.push({ label: 'Trend', value: t, color: AMBER, dashed: false, line: true });
    out.push({ label: '0.42× floor', value: PL_FLOOR * t, color: 'rgba(192,57,43,0.9)', dashed: true, line: true });
    out.push({ label: '3.0× upper band', value: PL_CEIL * t, color: 'rgba(224,148,34,0.55)', dashed: true, line: true });
    if (d >= TODAY_DAYS && d <= d1) {
      out.push({ label: glideLabel(), value: glideAt(d), color: AMBER, dashed: true, line: true });
      out.push({ label: 'If it never reverts', value: multiple() * t, color: 'rgba(109,179,212,0.85)', dashed: true, line: true });
      if (holdings > 0) out.push({ label: 'Your stack at trend', value: holdings * t, color: AMBER, dashed: false, line: false });
    }
    return out;
  }
  function horizonSeriesAt(d) {
    var t = plPrice(d), out = [
      { label: glideLabel(), value: glideAt(d), color: AMBER, dashed: true, line: true },
      { label: 'If it never reverts', value: multiple() * t, color: 'rgba(109,179,212,0.85)', dashed: true, line: true },
      { label: 'Trend', value: t, color: AMBER, dashed: false, line: true }
    ];
    if (holdings > 0) out.push({ label: 'Your stack at trend', value: holdings * t, color: AMBER, dashed: false, line: false });
    return out;
  }

  // ---- External (HTML) tooltip with a colour chip per row ----
  function dpTooltipEl(chart) {
    var parent = chart.canvas.parentNode, el = parent.querySelector('.dp-tt');
    if (!el) { el = document.createElement('div'); el.className = 'dp-tt'; parent.appendChild(el); }
    return el;
  }
  function hideDpTooltip() {
    var els = document.querySelectorAll('.dp-chart-block .dp-tt');
    for (var i = 0; i < els.length; i++) els[i].style.opacity = '0';
  }
  function positionDpTooltip(el, chart) {
    var px = chart.scales.x.getPixelForValue(chart.$hoverDay), ca = chart.chartArea, tt = chart.tooltip;
    var w = el.offsetWidth, hgt = el.offsetHeight, cw = chart.width;
    var x = px + 16;                        // right of the guide by default…
    if (x + w > ca.right) x = px - 16 - w;  // …flip left if it would run past the plot
    if (x < ca.left) x = ca.left + 2;
    if (x + w > cw) x = cw - w - 2;
    if (x < 0) x = 2;
    var cy = (tt && isFinite(tt.caretY)) ? tt.caretY : (ca.top + ca.bottom) / 2;
    var y = Math.max(ca.top, Math.min(cy - hgt / 2, ca.bottom - hgt));
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
  }
  function htmlTooltip(view) {
    return {
      enabled: false,
      external: function (context) {
        var chart = context.chart, tt = context.tooltip, el = dpTooltipEl(chart);
        if (!tt || tt.opacity === 0 || chart.$hoverDay == null) { el.style.opacity = '0'; return; }
        var d = chart.$hoverDay, series = (view === 'horizon') ? horizonSeriesAt(d) : priceSeriesAt(d);
        var html = '<div class="dp-tt-title">' + dayToDate(d) + '</div>';
        for (var i = 0; i < series.length; i++) {
          var s = series[i];
          html += '<div class="dp-tt-row"><span class="dp-tt-chip" style="border-top-style:' + (s.dashed ? 'dashed' : 'solid')
            + ';border-top-color:' + s.color + '"></span><span class="dp-tt-label">' + s.label
            + '</span><span class="dp-tt-val">' + moneyFull(s.value) + '</span></div>';
        }
        el.innerHTML = html;
        positionDpTooltip(el, chart);
        el.style.opacity = '1';
      }
    };
  }

  // "illustrative" tag drawn ALONG the reversion path (~78% to its end) and offset
  // perpendicular so it never touches the line or collides with the endpoint $ label.
  function fillPill(ctx, x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath(); ctx.fill();
  }
  // Draw text with a subtle dark backing pill (house tooltip fill at ~85%) so the
  // label stays legible when a line passes beneath it — in exports too, since it's
  // drawn on the canvas in afterDatasetsDraw. Assumes ctx.font/align/baseline are
  // set; uses the current ctx.fillStyle as the text colour.
  function drawChipText(ctx, text, x, y, align, baseline, fontPx) {
    var w = ctx.measureText(text).width, pad = 3.5;
    var left = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    var top = baseline === 'top' ? y : baseline === 'bottom' ? y - fontPx : y - fontPx / 2;
    var textColor = ctx.fillStyle;
    ctx.fillStyle = 'rgba(20,17,13,0.85)';
    fillPill(ctx, left - pad, top - pad + 1, w + pad * 2, fontPx + pad * 2 - 2, 3);
    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
  }
  // "illustrative" tag ~78% along the reversion path (15–25% before the end),
  // offset perpendicular onto the path's OPEN side: below when the path rises to
  // trend (multiple < 1) and above when it descends (multiple > 1), so it always
  // points at its own line. Backed by a chip; clamped to the chart area.
  function drawIllustrativeAlong(c, sx, sy, ex, ey) {
    if (!(isFinite(sx) && isFinite(sy) && isFinite(ex) && isFinite(ey))) return;
    var ctx = c.ctx, ca = c.chartArea, f = 0.78;
    var ax = sx + (ex - sx) * f, ay = sy + (ey - sy) * f;
    var dx = ex - sx, dy = ey - sy, len = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / len, ny = dx / len;
    var wantDown = multiple() < 1;                 // below a rising path, above a descending one
    if (wantDown ? (ny < 0) : (ny > 0)) { nx = -nx; ny = -ny; }
    var off = 14, tx = ax + nx * off, ty = ay + ny * off, baseline = wantDown ? 'top' : 'bottom';
    ctx.save();
    ctx.font = '600 10px "Inter", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = baseline;
    var w = ctx.measureText('illustrative').width;
    tx = Math.max(ca.left + w / 2 + 4, Math.min(tx, ca.right - w / 2 - 4));
    ty = wantDown ? Math.max(ca.top + 4, Math.min(ty, ca.bottom - 14))
                  : Math.max(ca.top + 14, Math.min(ty, ca.bottom - 4));
    ctx.fillStyle = 'rgba(224,148,34,0.95)';
    drawChipText(ctx, 'illustrative', tx, ty, 'center', baseline, 10);
    ctx.restore();
  }

  // Custom legend labels: Chart.js's default generateLabels reads the POINT style
  // under usePointStyle, which has no borderDash — so dashes were lost and every
  // marker rendered solid. Read each line dataset's own borderColor/borderDash so
  // the legend shows the real line style. Skips _noLegend datasets; the reversion
  // path's label is dynamic (tracks the slider) via the _glide flag.
  function lineLegendLabels(chart) {
    var ds = chart.data.datasets, out = [];
    for (var i = 0; i < ds.length; i++) {
      if (ds[i]._noLegend) continue;
      out.push({
        text: ds[i]._glide ? glideLabel() : ds[i].label,
        // fontColor is what the default generator supplies from labels.color; the
        // custom generator must set it too or the text renders dark-on-dark. Match
        // the Rate view legend exactly (labels.color: DIM).
        fontColor: DIM,
        strokeStyle: ds[i].borderColor,
        fillStyle: ds[i].borderColor,
        lineWidth: ds[i].borderWidth || 1,
        lineDash: ds[i].borderDash || [],
        lineCap: 'butt',
        pointStyle: 'line',
        hidden: !chart.isDatasetVisible(i),
        datasetIndex: i
      });
    }
    return out;
  }

  // "illustrative" tag drawn alongside the reversion path (not at its endpoint), so
  // it can't collide with anything anchored at the terminal point.
  function priceAnnoPlugin() {
    return {
      id: 'dpPriceAnno',
      afterDatasetsDraw: function (c) {
        var d0 = TODAY_DAYS, d1 = TODAY_DAYS + YEAR_D * state.months / 12;
        var xS = c.scales.x, yS = c.scales.y;
        drawIllustrativeAlong(c, xS.getPixelForValue(d0), yS.getPixelForValue(price()),
          xS.getPixelForValue(d1), yS.getPixelForValue(plPrice(d1)));
      }
    };
  }

  function buildPriceChart() {
    var el = document.getElementById('dpChart');
    if (!el || typeof Chart === 'undefined') return;
    var s = priceStatic(), pp = pricePaths();
    chart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: {
        // Array order = draw order (index 0 at the back). Highlight markers, the
        // two paths, and the current-position dot sit on top of the channel lines.
        datasets: [
          { label: 'Price history', data: s.hist, borderColor: MUTED, borderWidth: 1, pointRadius: 0, tension: 0, fill: false },
          { label: '3.0× upper band', data: s.ceil, borderColor: 'rgba(224,148,34,0.28)', borderWidth: 1, borderDash: [3, 4], pointRadius: 0, tension: 0, fill: false },
          { label: '0.42× floor — historical', data: s.floor, borderColor: 'rgba(192,57,43,0.55)', borderWidth: 1.2, borderDash: [6, 4], pointRadius: 0, tension: 0, fill: false },
          { label: 'Trend', data: s.trend, borderColor: AMBER, borderWidth: 2, pointRadius: 0, tension: 0, fill: false },
          { label: 'Regained trend', data: s.regains, showLine: false, pointRadius: 3, borderColor: BLUE, backgroundColor: 'rgba(109,179,212,0.55)', _noLegend: true },
          { label: 'Cycle low', data: s.lows, showLine: false, pointRadius: 3, borderColor: RED, backgroundColor: 'rgba(192,57,43,0.6)', _noLegend: true },
          { label: 'If it never reverts', data: pp.never, borderColor: 'rgba(109,179,212,0.55)', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, tension: 0, fill: false },
          { label: glideLabel(), _glide: true, data: pp.glide, borderColor: AMBER, borderWidth: 2, borderDash: [6, 4], pointRadius: 0, tension: 0, fill: false },
          { label: 'Bitcoin now', data: pp.dot, showLine: false, pointRadius: 5, borderColor: '#0a0908', borderWidth: 1.5, backgroundColor: dotColor(), _noLegend: true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'nearest', axis: 'x' },
        layout: { padding: { top: 14, right: 10 } },
        scales: {
          x: {
            type: 'linear', min: s.minD, max: s.maxD,
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: { color: MUTED, maxTicksLimit: 9, autoSkip: true, font: { family: 'Inter, sans-serif', size: 11 },
              callback: function (v) { return new Date((GENESIS_TS + v * 86400) * 1000).getUTCFullYear(); } }
          },
          y: {
            type: 'logarithmic',
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 },
              callback: function (v) { var l = Math.log(v) / Math.LN10; if (Math.abs(l - Math.round(l)) > 0.01) return ''; return priceTick(v); } }
          }
        },
        plugins: {
          legend: { display: true, position: 'top',
            labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 8,
              generateLabels: lineLegendLabels } },
          tooltip: htmlTooltip('price')
        }
      },
      plugins: [priceAnnoPlugin(), hoverDayPlugin]
    });
  }
  function updatePriceChart() {
    var pp = pricePaths();
    chart.data.datasets[6].data = pp.never;
    chart.data.datasets[7].data = pp.glide;
    chart.data.datasets[8].data = pp.dot;
    chart.data.datasets[8].backgroundColor = dotColor();
    chart.update('none');
  }

  // ---- HORIZON VIEW ----
  // Just the chosen window (today → today + y) on a LINEAR y-axis, drawn to scale
  // so the trend / glide / never-reverts gap is visible. Everything re-renders as
  // the slider moves the right edge.
  function horizonData() {
    var d0 = TODAY_DAYS, d1 = TODAY_DAYS + YEAR_D * state.months / 12, p0 = price();
    var Td1 = plPrice(d1), nv = multiple() * Td1;
    var trend = samplePath(plPrice, d0, d1);
    var glide = samplePath(glideAt, d0, d1);   // constant-CAGR → straight in log
    var never = samplePath(neverAt, d0, d1);   // constant-multiple → parallel to the trend
    // Fit the log y-range tightly to the window's own values (start price → top
    // endpoint) so the window fills the plot instead of starting a decade below.
    var lo = p0, hi = p0, arrs = [trend, glide, never], a, i;
    for (a = 0; a < arrs.length; a++) for (i = 0; i < arrs[a].length; i++) { var v = arrs[a][i].y; if (v < lo) lo = v; if (v > hi) hi = v; }
    return {
      d0: d0, d1: d1, Td1: Td1, nv: nv, lo: lo, hi: hi,
      trend: trend, glide: glide, never: never,
      dot: [{ x: d0, y: p0 }],
      trendEnd: [{ x: d1, y: Td1 }],
      neverEnd: [{ x: d1, y: nv }]
    };
  }
  // On-canvas annotations: the "illustrative" tag on the glide, plus a $ label at
  // each endpoint (trend/glide endpoint and the never-reverts endpoint).
  function horizonAnnoPlugin() {
    return {
      id: 'dpHorizonAnno',
      afterDatasetsDraw: function (c) {
        var h = horizonData(), xS = c.scales.x, yS = c.scales.y, ctx = c.ctx, ca = c.chartArea;
        var ex = xS.getPixelForValue(h.d1);
        var tY = yS.getPixelForValue(h.Td1), nY = yS.getPixelForValue(h.nv);
        if (!isFinite(ex) || !isFinite(tY)) return;
        // Side choice, away from the lines that pass between the two endpoints: the
        // higher endpoint's $ sits above it, the lower one's below. Flips with the
        // sign of the premium; the chip covers any residual line the side can't dodge.
        var trendUpper = h.Td1 >= h.nv;
        ctx.save();
        ctx.font = '600 11px "Inter", sans-serif';
        ctx.textAlign = 'right';
        var tBase = trendUpper ? 'bottom' : 'top';
        var tYc = trendUpper ? Math.max(tY - 4, ca.top + 12) : Math.min(tY + 4, ca.bottom - 6);
        ctx.textBaseline = tBase;
        ctx.fillStyle = 'rgba(224,148,34,0.95)';
        drawChipText(ctx, moneyFull(h.Td1), ex - 6, tYc, 'right', tBase, 11);
        // Never-reverts endpoint $ (blue) — only when it reads clear of the trend $
        if (isFinite(nY) && Math.abs(nY - tY) > 14) {
          var nBase = trendUpper ? 'top' : 'bottom';
          var nYc = trendUpper ? Math.min(nY + 4, ca.bottom - 6) : Math.max(nY - 4, ca.top + 12);
          ctx.textBaseline = nBase;
          ctx.fillStyle = 'rgba(109,179,212,0.95)';
          drawChipText(ctx, moneyFull(h.nv), ex - 6, nYc, 'right', nBase, 11);
        }
        ctx.restore();
        // "illustrative" alongside the path (~78% along), offset perpendicular, so it
        // no longer collides with the endpoint $ label at the terminal point.
        drawIllustrativeAlong(c, xS.getPixelForValue(h.d0), yS.getPixelForValue(price()), ex, tY);
      }
    };
  }
  function buildHorizonChart() {
    var el = document.getElementById('dpChart');
    if (!el || typeof Chart === 'undefined') return;
    var h = horizonData();
    chart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: {
        datasets: [
          { label: 'Trend', data: h.trend, borderColor: AMBER, borderWidth: 2, pointRadius: 0, tension: 0, fill: false },
          { label: 'If it never reverts', data: h.never, borderColor: 'rgba(109,179,212,0.55)', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, tension: 0, fill: false },
          { label: glideLabel(), _glide: true, data: h.glide, borderColor: AMBER, borderWidth: 2, borderDash: [6, 4], pointRadius: 0, tension: 0, fill: false },
          { label: 'Bitcoin now', data: h.dot, showLine: false, pointRadius: 5, borderColor: '#0a0908', borderWidth: 1.5, backgroundColor: dotColor(), _noLegend: true },
          { label: 'Trend endpoint', data: h.trendEnd, showLine: false, pointRadius: 4, borderColor: '#0a0908', borderWidth: 1.2, backgroundColor: AMBER, _noLegend: true },
          { label: 'Never-reverts endpoint', data: h.neverEnd, showLine: false, pointRadius: 4, borderColor: '#0a0908', borderWidth: 1.2, backgroundColor: BLUE, _noLegend: true }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, parsing: false, animation: { duration: 0 },
        interaction: { intersect: false, mode: 'nearest', axis: 'x' },
        layout: { padding: { top: 14, right: 10 } },
        scales: {
          x: {
            type: 'linear', min: h.d0, max: h.d1,
            grid: { color: 'rgba(224,148,34,0.05)' },
            ticks: { color: MUTED, maxTicksLimit: 6, autoSkip: true, font: { family: 'Inter, sans-serif', size: 11 },
              callback: function (v) { return dayToDate(v); } }
          },
          y: {
            type: 'logarithmic',
            min: h.lo / 1.12, max: h.hi * 1.12,
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, maxTicksLimit: 7, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { return money(v); } }
          }
        },
        plugins: {
          legend: { display: true, position: 'top',
            labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 8,
              generateLabels: lineLegendLabels } },
          tooltip: htmlTooltip('horizon')
        }
      },
      plugins: [horizonAnnoPlugin(), hoverDayPlugin]
    });
  }
  function updateHorizonChart() {
    var h = horizonData();
    chart.options.scales.x.max = h.d1;
    chart.options.scales.y.min = h.lo / 1.12;
    chart.options.scales.y.max = h.hi * 1.12;
    chart.data.datasets[0].data = h.trend;
    chart.data.datasets[1].data = h.never;
    chart.data.datasets[2].data = h.glide;
    chart.data.datasets[3].data = h.dot;
    chart.data.datasets[3].backgroundColor = dotColor();
    chart.data.datasets[4].data = h.trendEnd;
    chart.data.datasets[5].data = h.neverEnd;
    chart.update('none');
  }

  // ---- View dispatch ----
  function buildChart() {
    if (view === 'price') buildPriceChart();
    else if (view === 'horizon') buildHorizonChart();
    else buildRateChart();
  }
  function updateChart() {
    if (!chart) { buildChart(); return; }
    if (view === 'price') updatePriceChart();
    else if (view === 'horizon') updateHorizonChart();
    else updateRateChart();
  }
  var VIEW_META = {
    rate: { cap: 'dpCaptionRate', title: 'Implied CAGR if bitcoin reverts to trend, by horizon', file: 'bitcoin-implied-reversion-cagr.png' },
    price: { cap: 'dpCaptionPrice', title: 'Bitcoin full price history in the Power Law channel, with the reversion path', file: 'bitcoin-full-history-channel.png' },
    horizon: { cap: 'dpCaptionHorizon', title: 'Your chosen window — trend, reversion path, and the never-reverts case', file: 'bitcoin-reversion-window.png' }
  };
  function setView(v) {
    if (!VIEW_META[v] || v === view) return;
    view = v;
    var btns = document.querySelectorAll('.dp-view-btn');
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-view') === v;
      btns[i].classList.toggle('is-active', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    for (var k in VIEW_META) {
      if (!VIEW_META.hasOwnProperty(k)) continue;
      var cap = document.getElementById(VIEW_META[k].cap);
      if (cap) cap.hidden = (k !== v);
    }
    // Keep the chart-copy export self-labelled to the active view.
    var host = document.querySelector('.dp-chart-block');
    if (host) {
      host.setAttribute('data-chart-title', VIEW_META[v].title);
      host.setAttribute('data-chart-filename', VIEW_META[v].file);
    }
    hideDpTooltip(); // don't let a Full-history/Your-window tooltip linger into another view
    if (chart) { chart.destroy(); chart = null; }
    buildChart();
  }

  // ════════ THE HONESTY BACKTEST ════════
  // Cyclical-top anchors are the site's already-published canonical set
  // (days_since_genesis + market price), reused verbatim from
  // bitcoin-vs-the-stock-market.js so the two pages can never disagree on
  // what a top was worth. Multiples and CAGRs are COMPUTED from those
  // anchors here — nothing in this table is asserted.
  var TOPS = [
    { d: 1792, p: 1147, lbl: 'Dec 2013 top' },
    { d: 3270, p: 19500, lbl: 'Dec 2017 top' },
    { d: 4694, p: 69000, lbl: 'Nov 2021 top' },
    { d: 6121, p: 126200, lbl: 'Oct 2025 ATH' }
  ];
  // Cyclical-low anchors — the site's canonical troughs, the same set Bull &
  // Bear Cycles uses, so the two pages can never disagree on what a low was
  // worth. Computed here, not asserted, exactly like the tops.
  var LOWS = [
    { d: 2202, p: 180, lbl: 'Jan 2015 low' },
    { d: 3633, p: 3183, lbl: 'Dec 2018 low' },
    { d: 5070, p: 15476, lbl: 'Nov 2022 low' }
  ];
  var BT_YEARS = [1, 2, 3];

  function backtestRow(d, p, label, isToday) {
    var m = p / plPrice(d);
    var cells = BT_YEARS.map(function (y) {
      var v = Math.pow(plPrice(d + YEAR_D * y) / p, 1 / y) - 1;
      var cls = v < 0 ? 'dp-neg' : 'dp-pos';
      return '<td class="' + cls + '">' + signPct0(v) + '</td>';
    }).join('');
    return '<tr' + (isToday ? ' class="dp-today-row"' : '') + '>'
      + '<td>' + label + '</td>'
      + '<td>' + m.toFixed(2) + '×</td>'
      + cells + '</tr>';
  }

  function renderBacktest() {
    var body = document.getElementById('dpBacktestBody');
    if (!body) return;
    // Render order: four tops, a subtle group separator, three lows, then Today.
    var html = TOPS.map(function (t) { return backtestRow(t.d, t.p, t.lbl, false); }).join('');
    html += '<tr class="dp-group-sep"><td colspan="5"></td></tr>';
    html += LOWS.map(function (t) { return backtestRow(t.d, t.p, t.lbl, false); }).join('');
    html += backtestRow(TODAY_DAYS, price(), 'Today', true);
    body.innerHTML = html;
  }

  // ════════ WHY CAGR FALLS — trend slope by era ════════
  function renderSlope() {
    var wrap = document.getElementById('dpSlopeGrid');
    if (!wrap) return;
    var startYear = new Date((GENESIS_TS + TODAY_DAYS * 86400) * 1000).getUTCFullYear();
    var eras = [[startYear, startYear + 4], [startYear + 4, startYear + 8], [startYear + 8, startYear + 12]];
    wrap.innerHTML = eras.map(function (e) {
      var d0 = yearToDays(e[0]), d1 = yearToDays(e[1]);
      var g = Math.pow(plPrice(d1) / plPrice(d0), 1 / ((d1 - d0) / YEAR_D)) - 1;
      return '<div class="dp-slope-card"><div class="dp-slope-era">' + e[0] + '–' + e[1]
        + '</div><div class="dp-slope-num">' + pct0(g) + '</div></div>';
    }).join('');
  }
  function yearToDays(y) {
    return Math.floor((Date.UTC(y, 6, 23) / 1000 - GENESIS_TS) / 86400);
  }

  // ════════ URL STATE (?y=<horizon-years>) ════════
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var y = (state.months / 12);
    var v = (state.months % 12 === 0) ? String(y) : y.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    try { window.history.replaceState(null, '', '?y=' + v); } catch (e) { /* file:// or blocked */ }
  }
  function readUrl() {
    var m = /[?&]y=([0-9.]+)/.exec(window.location.search);
    if (!m) return;
    var y = parseFloat(m[1]);
    if (!isFinite(y)) return;
    var months = Math.round(y * 12);
    if (months >= MIN_M && months <= MAX_M) state.months = months;
  }

  // ════════ WIRING ════════
  function renderAll() { renderStatus(); renderCalc(); renderBacktest(); }

  function wire() {
    var sl = document.getElementById('dpSlider');
    if (sl) {
      sl.value = state.months;
      sl.addEventListener('input', function () {
        state.months = parseInt(this.value, 10);
        renderCalc();
      });
    }
    // Holdings input. Clamp to [0, MAX_BTC], accept any decimals. The value is
    // held only in the `holdings` closure variable — never persisted or sent.
    var stackInput = document.getElementById('dpStack');
    if (stackInput) {
      stackInput.addEventListener('input', function () {
        var v = parseFloat(this.value);
        if (!isFinite(v) || v < 0) v = 0;
        if (v > MAX_BTC) { v = MAX_BTC; this.value = MAX_BTC; }
        holdings = v;
        renderCalc();
      });
    }
    // Rate / Price segmented toggle. Rebuilds the chart; slider state is shared.
    var viewBtns = document.querySelectorAll('.dp-view-btn');
    for (var i = 0; i < viewBtns.length; i++) {
      viewBtns[i].addEventListener('click', function () { setView(this.getAttribute('data-view')); });
    }
  }

  function init() {
    readUrl();
    wire();
    buildChart();
    renderSlope();
    renderAll();
    if (typeof fetchTodayPrice === 'function') {
      fetchTodayPrice(function (p, source) {
        livePrice = p; liveSource = source;
        renderAll();
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
