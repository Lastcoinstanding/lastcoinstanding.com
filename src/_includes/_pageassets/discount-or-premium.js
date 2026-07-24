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

    if (elMeta) {
      elMeta.textContent = (todayPriceIsLive(liveSource) ? 'Live: ' : 'Latest monthly data: ')
        + moneyFull(p) + ' · ' + m.toFixed(2) + '× trend · recomputed every page load.';
    }

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
    if (elTrSub) elTrSub.textContent = 'per year for someone who bought AT trend — the model’s own growth rate.';

    // Uplift (below trend) / drag (above trend) — same subtraction both ways.
    var elDelta = document.getElementById('dpDelta');
    if (elDelta) {
      var cls = 'dp-delta ', txt;
      if (s === 'at-trend' || Math.abs(delta) < 0.015) {
        cls += 'dp-delta-flat';
        txt = 'Price is roughly at trend, so reversion adds <strong>almost nothing</strong> either way — the two figures above are essentially the same number.';
      } else if (delta > 0) {
        cls += 'dp-delta-up';
        txt = 'The discount is worth an <strong>uplift of ' + signPct0(delta) + '/yr</strong> over the at-trend baseline — that gap is the whole of what reversion buys you.';
      } else {
        cls += 'dp-delta-down';
        txt = 'The premium is a <strong>drag of ' + signPct0(delta) + '/yr</strong> against the at-trend baseline — reverting from a premium means giving return back.';
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
        + signPct0(tr) + '/yr</strong> over this horizon, declining as bitcoin matures. That is the assumption-free case. '
        + 'The multiple can also <em>fall further</em>: the ' + PL_FLOOR.toFixed(2)
        + '× floor has held for the length of the record, which is evidence, not a law.';
    }

    updateChart();
    syncUrl();
  }

  function horizonDateLabel() {
    var d = new Date((GENESIS_TS + (TODAY_DAYS + YEAR_D * state.months / 12) * 86400) * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  // ════════ CHART — implied CAGR vs horizon, with the baseline beneath ════════
  var chart = null;
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
  function buildChart() {
    var el = document.getElementById('dpChart');
    if (!el || typeof Chart === 'undefined') return;
    var c = curves();
    chart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: {
        datasets: [
          { label: 'Implied CAGR if it reverts to trend', data: c.rev, borderColor: AMBER, backgroundColor: AMBER, borderWidth: 2.2, pointRadius: 0, tension: 0.25, fill: false },
          { label: 'At-trend baseline (never reverts)', data: c.tr, borderColor: BLUE, backgroundColor: BLUE, borderWidth: 1.8, borderDash: [5, 4], pointRadius: 0, tension: 0.25, fill: false }
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
              label: function (it) { return it.dataset.label + ': ' + Math.round(it.parsed.y) + '%/yr'; }
            }
          }
        }
      },
      plugins: [markerPlugin()]
    });
  }
  function updateChart() {
    if (!chart) { buildChart(); return; }
    var c = curves();
    chart.data.datasets[0].data = c.rev;
    chart.data.datasets[1].data = c.tr;
    chart.update('none');
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
    var html = TOPS.map(function (t) { return backtestRow(t.d, t.p, t.lbl, false); }).join('');
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
