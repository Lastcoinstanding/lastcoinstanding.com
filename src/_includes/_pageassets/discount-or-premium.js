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
    var y = state.months / 12, hd = TODAY_DAYS + YEAR_D * y, p0 = price();
    return {
      dot: [{ x: TODAY_DAYS, y: p0 }],
      glide: [{ x: TODAY_DAYS, y: p0 }, { x: hd, y: plPrice(hd) }],
      never: [{ x: TODAY_DAYS, y: p0 }, { x: hd, y: multiple() * plPrice(hd) }]
    };
  }
  function dotColor() { return todayPriceIsLive(liveSource) ? PULSE : MUTED; }

  // ---- Date-anchored tooltip (shared by Price + Horizon views) ----
  // Rows are computed analytically from the hovered DATE, not read from the
  // nearest plotted point, so hovering anywhere shows every applicable series at
  // one date. beforeEvent resolves the pointer x → a day, ahead of the tooltip's
  // own event handling, so the rows are never a frame stale.
  var hoverDayPlugin = {
    id: 'dpHoverDay',
    beforeEvent: function (chart, args) {
      var e = args.event;
      if (e.type === 'mousemove') {
        var ca = chart.chartArea;
        chart.$hoverDay = (e.x >= ca.left && e.x <= ca.right) ? chart.scales.x.getValueForPixel(e.x) : null;
      } else if (e.type === 'mouseout') { chart.$hoverDay = null; }
    }
  };
  function dateTooltip(getRows) {
    return {
      enabled: true,
      backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.30)', borderWidth: 1,
      titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
      filter: function (item, i) { return i === 0; }, // one row-set, computed below
      callbacks: {
        title: function (items) { var c = items[0].chart, d = (c.$hoverDay != null) ? c.$hoverDay : items[0].parsed.x; return dayToDate(d); },
        label: function (ctx) { var c = ctx.chart, d = (c.$hoverDay != null) ? c.$hoverDay : ctx.parsed.x; return getRows(d); }
      }
    };
  }
  // Nearest monthly PL_DATA sample to day d (the "Price (history)" row).
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
  // Fixed-order Price-view rows; rows that don't apply at d are skipped.
  function priceRows(d) {
    var rows = [], lastD = PL_DATA[PL_DATA.length - 1][0], t = plPrice(d);
    if (d <= lastD) rows.push('Price (history): ' + moneyFull(nearestSample(d)));
    rows.push('Trend: ' + moneyFull(t));
    rows.push('0.42× floor: ' + moneyFull(PL_FLOOR * t));
    rows.push('3.0× upper band: ' + moneyFull(PL_CEIL * t));
    var d1 = TODAY_DAYS + YEAR_D * state.months / 12;
    if (d >= TODAY_DAYS && d <= d1) {
      rows.push(glideLabel() + ': ' + moneyFull(glideAt(d)));
      rows.push('If it never reverts: ' + moneyFull(multiple() * t));
      if (holdings > 0) rows.push('Your stack at trend: ' + moneyFull(holdings * t));
    }
    return rows;
  }
  // Horizon view spans only the future window, so fewer rows (glide, never, trend, stack).
  function horizonRows(d) {
    var t = plPrice(d), rows = [
      glideLabel() + ': ' + moneyFull(glideAt(d)),
      'If it never reverts: ' + moneyFull(multiple() * t),
      'Trend: ' + moneyFull(t)
    ];
    if (holdings > 0) rows.push('Your stack at trend: ' + moneyFull(holdings * t));
    return rows;
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

  // Small on-canvas "illustrative" tag at the glide endpoint (honesty, not decoration).
  function priceAnnoPlugin() {
    return {
      id: 'dpPriceAnno',
      afterDatasetsDraw: function (c) {
        var hd = TODAY_DAYS + YEAR_D * state.months / 12;
        var px = c.scales.x.getPixelForValue(hd), py = c.scales.y.getPixelForValue(plPrice(hd)), ctx = c.ctx;
        if (!isFinite(px) || !isFinite(py)) return;
        ctx.save();
        // Just beyond the reversion path's endpoint: offset up-right of the terminal
        // point, but clamp to a right-aligned position at the edge so it never clips.
        ctx.font = '600 10px "Inter", sans-serif';
        ctx.fillStyle = 'rgba(224,148,34,0.9)';
        ctx.textBaseline = 'bottom';
        var ca = c.chartArea, w = ctx.measureText('illustrative').width, ly = Math.max(py - 6, ca.top + 11);
        if (px + 6 + w <= ca.right - 2) { ctx.textAlign = 'left'; ctx.fillText('illustrative', px + 6, ly); }
        else { ctx.textAlign = 'right'; ctx.fillText('illustrative', Math.min(px, ca.right) - 2, ly); }
        ctx.restore();
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
          tooltip: dateTooltip(priceRows)
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
    var y = state.months / 12, d0 = TODAY_DAYS, d1 = TODAY_DAYS + YEAR_D * y, p0 = price();
    var Td1 = plPrice(d1), nv = multiple() * Td1;
    var trend = [], n = 48, i;
    for (i = 0; i <= n; i++) { var d = d0 + (d1 - d0) * i / n; trend.push({ x: d, y: plPrice(d) }); }
    return {
      d0: d0, d1: d1, Td1: Td1, nv: nv,
      trend: trend,
      glide: [{ x: d0, y: p0 }, { x: d1, y: Td1 }],
      never: [{ x: d0, y: p0 }, { x: d1, y: nv }],
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
        var h = horizonData(), xS = c.scales.x, yS = c.scales.y, ctx = c.ctx;
        var ex = xS.getPixelForValue(h.d1);
        var tY = yS.getPixelForValue(h.Td1), nY = yS.getPixelForValue(h.nv);
        if (!isFinite(ex) || !isFinite(tY)) return;
        ctx.save();
        ctx.font = '600 11px "Inter", sans-serif';
        ctx.textAlign = 'right';
        // Trend / glide endpoint $ (amber)
        ctx.fillStyle = 'rgba(224,148,34,0.95)';
        ctx.textBaseline = 'bottom';
        ctx.fillText(moneyFull(h.Td1), ex - 6, Math.max(tY - 4, c.chartArea.top + 12));
        // Never-reverts endpoint $ (blue) — only when it reads clear of the trend $
        if (isFinite(nY) && Math.abs(nY - tY) > 14) {
          ctx.fillStyle = 'rgba(109,179,212,0.95)';
          ctx.textBaseline = 'top';
          ctx.fillText(moneyFull(h.nv), ex - 6, Math.min(nY + 4, c.chartArea.bottom - 6));
        }
        // "illustrative" just beyond the path end — the endpoint sits at the right
        // edge here, so stack it above the trend-$ label, right-aligned, clamped in.
        ctx.font = '600 10px "Inter", sans-serif';
        ctx.fillStyle = 'rgba(224,148,34,0.9)';
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        var trendLabelY = Math.max(tY - 4, c.chartArea.top + 12);
        ctx.fillText('illustrative', Math.min(ex, c.chartArea.right) - 6, Math.max(trendLabelY - 14, c.chartArea.top + 11));
        ctx.restore();
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
            grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, font: { family: 'Inter, sans-serif', size: 11 }, callback: function (v) { return money(v); } }
          }
        },
        plugins: {
          legend: { display: true, position: 'top',
            labels: { color: DIM, font: { size: 10 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 8,
              generateLabels: lineLegendLabels } },
          tooltip: dateTooltip(horizonRows)
        }
      },
      plugins: [horizonAnnoPlugin(), hoverDayPlugin]
    });
  }
  function updateHorizonChart() {
    var h = horizonData();
    chart.options.scales.x.max = h.d1;
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
