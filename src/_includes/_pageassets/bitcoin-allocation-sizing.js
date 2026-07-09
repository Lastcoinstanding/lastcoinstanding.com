/* =============================================================
   Bitcoin Allocation Sizing — what does X% actually do to you?

   The LIVED experience of a portfolio allocation to bitcoin, distinct
   from How Much Bitcoin's Kelly/optimal-fraction maths. The reader sets
   an allocation % (a slice of bitcoin, the rest in a traditional
   sleeve) and sees three faces TOGETHER, never upside alone:
     1. Upside captured   — how the allocation lifts portfolio growth.
     2. Drawdown stomached — the whole-portfolio hit in a bitcoin bear.
     3. Risk contribution  — bitcoin's share of total portfolio risk,
        the non-linear gut-punch (10% of money is ~a quarter of risk).

   All figures COMPUTED live. Stated illustrative defaults, not forecasts.
   The page shows consequences; it makes no optimal-% recommendation.

   Reference points (QA, matches BlackRock's published figures):
     risk share  2%→~4%, 5%→~11%, 10%→~24%, 20%→~48%, 50%→~85%
     drawdown @−77%  5%→−4%, 10%→−8%, 20%→−15%, 50%→−38%
     upside @BTC 5x / trad 1.4x  10%→1.76x, 20%→2.12x vs 1.40x
   ============================================================= */
(function () {
  'use strict';

  // ── Stated illustrative assumptions (sourced to the Bull & Bear register) ──
  // Volatility/correlation are stated defaults, NOT user sliders. Correlation is
  // deliberately 0.5, on the honest high side: bitcoin's diversification benefit
  // has weakened post-ETF (register: corr has run 0.5–0.88).
  var BTC_VOL = 0.45;    // ~45% annualised
  var TRAD_VOL = 0.12;   // ~12% annualised (a 60/40-ish sleeve)
  var CORR = 0.50;       // BTC ↔ traditional correlation

  // ── Palette (house conventions) ──
  var C_UP = '#6fae6f', C_DOWN = '#e08a7a', C_RISK = '#e09422';
  var MUTED = '#7a7367', DIM = '#9a9080';

  // ── State ──
  var S = {
    allocPct: 10,        // bitcoin as % of total portfolio (primary lever)
    crashDepthPct: 77,   // bitcoin bear depth, peak-to-trough
    upsideMult: 5,       // bitcoin does Nx over the hold
    tradMult: 1.4,       // traditional sleeve does Yx over the hold (stated default, adjustable)
    portfolioUSD: null   // optional total portfolio $; null = pure %
  };
  var PRESETS = [1, 5, 10, 20]; // classic allocation presets
  var COMPARE_ALLOCS = [1, 5, 10, 20, 50]; // the shape of the trade-off

  // ════════ THE MATH (all pure, all live) ════════
  function portVol(w) {
    return Math.sqrt(Math.pow(w * BTC_VOL, 2) + Math.pow((1 - w) * TRAD_VOL, 2)
      + 2 * w * (1 - w) * CORR * BTC_VOL * TRAD_VOL);
  }
  // Bitcoin's share of total portfolio variance — the non-linear risk contribution.
  function btcRiskShare(w) {
    var covBtcPort = w * BTC_VOL * BTC_VOL + (1 - w) * CORR * BTC_VOL * TRAD_VOL;
    var tv = Math.pow(portVol(w), 2);
    return tv > 0 ? (w * covBtcPort) / tv : 0;
  }
  // Whole-portfolio hit from the bitcoin leg falling by depth d (e.g. 0.77).
  function drawdownHit(w, d) { return w * d; }
  // Single-hold portfolio multiple: bitcoin does mBtc x, the rest does mTrad x.
  function upsideMultiple(w, mBtc, mTrad) { return w * mBtc + (1 - w) * mTrad; }

  // Bundle the three faces for an allocation w (0–1), at the current scenario.
  function faces(w) {
    var d = S.crashDepthPct / 100;
    var withBtc = upsideMultiple(w, S.upsideMult, S.tradMult);
    var without = S.tradMult;
    return {
      w: w,
      risk: btcRiskShare(w),                 // share of portfolio risk (0–1)
      drawdown: drawdownHit(w, d),           // whole-portfolio hit (0–1, positive magnitude)
      withBtc: withBtc,                      // portfolio multiple with bitcoin
      without: without,                      // portfolio multiple with no bitcoin
      uplift: without > 0 ? withBtc / without - 1 : 0 // relative extra growth vs no bitcoin
    };
  }

  // ════════ FORMATTERS ════════
  function pct(v, dp) { return (v * 100).toFixed(dp == null ? 0 : dp) + '%'; }
  function mult(v) { return v.toFixed(2) + 'x'; }
  function usd(v) {
    if (v == null || !isFinite(v)) return '—';
    var a = Math.abs(v), s = v < 0 ? '-$' : '$';
    if (a >= 1e9) return s + (a / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return s + (a / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return s + Math.round(a / 1e3) + 'K';
    return s + Math.round(a);
  }
  function hasUSD() { return S.portfolioUSD != null && isFinite(S.portfolioUSD) && S.portfolioUSD > 0; }

  // ════════ THE THREE FACES PANEL (always together, never upside alone) ════════
  function renderFaces() {
    var w = S.allocPct / 100, f = faces(w);
    var P = S.portfolioUSD;

    // Upside captured
    var upEl = document.getElementById('faceUpside');
    if (upEl) {
      var upDetail = 'Your whole portfolio grows <strong>' + mult(f.withBtc) + '</strong> instead of ' + mult(f.without)
        + ' with no bitcoin, if bitcoin does ' + mult(S.upsideMult) + ' and the rest does ' + mult(S.tradMult) + '.';
      if (hasUSD()) upDetail += ' On ' + usd(P) + ', that is ' + usd(P * f.withBtc) + ' versus ' + usd(P * f.without) + '.';
      setFace(upEl, '+' + pct(f.uplift), 'more growth than no bitcoin', upDetail);
    }

    // Drawdown stomached
    var dnEl = document.getElementById('faceDrawdown');
    if (dnEl) {
      var dnDetail = 'A ' + S.crashDepthPct + '% bitcoin bear takes about <strong>' + pct(f.drawdown, 1) + ' off your whole portfolio</strong> from the bitcoin leg alone.';
      if (hasUSD()) dnDetail += ' That is roughly ' + usd(-P * f.drawdown) + ' of a ' + usd(P) + ' portfolio.';
      setFace(dnEl, '−' + pct(f.drawdown), 'of the whole portfolio', dnDetail);
    }

    // Risk contribution (the prominent, least-intuitive face)
    var rkEl = document.getElementById('faceRisk');
    if (rkEl) {
      var rkDetail = 'You put in <strong>' + S.allocPct + '% of your money</strong>, but bitcoin now drives about <strong>' + pct(f.risk) + ' of your portfolio&rsquo;s risk</strong>. A small dollar allocation is a large risk allocation.';
      setFace(rkEl, pct(f.risk), 'of your portfolio risk', rkDetail);
    }
  }
  function setFace(el, big, unit, detail) {
    var b = el.querySelector('.as-face-num'), u = el.querySelector('.as-face-unit'), d = el.querySelector('.as-face-detail');
    if (b) b.textContent = big;
    if (u) u.textContent = unit;
    if (d) d.innerHTML = detail;
  }

  // ════════ "CAN YOU HOLD IT?" ════════
  function renderHold() {
    var el = document.getElementById('asHold'); if (!el) return;
    var w = S.allocPct / 100, f = faces(w);
    var dollarBit = hasUSD() ? ' (about ' + usd(-S.portfolioUSD * f.drawdown) + ')' : '';
    el.innerHTML = 'A <strong>' + S.allocPct + '%</strong> allocation means watching your whole portfolio fall about <strong>' + pct(f.drawdown, 1) + '</strong>' + dollarBit
      + ' in a ' + S.crashDepthPct + '% bitcoin bear, while bitcoin drives ' + pct(f.risk) + ' of your risk. Could you hold through that without selling? '
      + 'If the honest answer is no, the allocation is too big for you, whatever the maths says. That is the conviction question <a href="/bull-and-bear-cycles">Bull &amp; Bear Cycles</a> is about.';
  }

  // ════════ COMPARISON: the shape of the trade-off (all three faces across allocations) ════════
  var compareChart = null;
  function compareRows() {
    var allocs = COMPARE_ALLOCS.slice();
    if (allocs.indexOf(S.allocPct) < 0 && S.allocPct > 0) allocs.push(S.allocPct);
    allocs.sort(function (a, b) { return a - b; });
    return allocs.map(function (a) {
      var f = faces(a / 100);
      return { alloc: a, current: a === S.allocPct, uplift: f.uplift, drawdown: f.drawdown, risk: f.risk, withBtc: f.withBtc };
    });
  }
  function renderCompareChart(rows) {
    var el = document.getElementById('asCompareChart');
    if (!el || typeof Chart === 'undefined') return;
    var labels = rows.map(function (r) { return r.alloc + '%'; });
    var upData = rows.map(function (r) { return +(r.uplift * 100).toFixed(1); });
    var dnData = rows.map(function (r) { return +(r.drawdown * 100).toFixed(1); });
    var rkData = rows.map(function (r) { return +(r.risk * 100).toFixed(1); });
    var ds = [
      { label: 'Upside uplift', data: upData, backgroundColor: 'rgba(111,174,111,0.75)', borderWidth: 0, borderRadius: 3 },
      { label: 'Drawdown', data: dnData, backgroundColor: 'rgba(224,138,122,0.8)', borderWidth: 0, borderRadius: 3 },
      { label: 'Risk contribution', data: rkData, backgroundColor: 'rgba(224,148,34,0.8)', borderWidth: 0, borderRadius: 3 }
    ];
    if (compareChart) {
      compareChart.data.labels = labels;
      compareChart.data.datasets[0].data = upData; compareChart.data.datasets[1].data = dnData; compareChart.data.datasets[2].data = rkData;
      compareChart.$rows = rows; compareChart.update('none'); return;
    }
    compareChart = new Chart(el.getContext('2d'), {
      type: 'bar',
      data: { labels: labels, datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
        scales: {
          x: { grid: { display: false }, ticks: { color: DIM, font: { size: 12 } }, title: { display: true, text: 'Bitcoin allocation (share of your money)', color: MUTED, font: { size: 10 } } },
          y: { grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { size: 11 }, callback: function (v) { return v + '%'; } }, title: { display: true, text: 'Percent', color: MUTED, font: { size: 10 } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: 11 }, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, padding: 12 } },
          tooltip: {
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1, titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: 10,
            callbacks: {
              title: function (it) { return it.length ? (compareChart.$rows[it[0].dataIndex].alloc + '% in bitcoin') : ''; },
              label: function (it) {
                var r = compareChart.$rows[it.dataIndex];
                if (it.datasetIndex === 0) return 'Upside uplift: +' + (r.uplift * 100).toFixed(0) + '% (portfolio ' + mult(r.withBtc) + ')';
                if (it.datasetIndex === 1) return 'Drawdown: −' + (r.drawdown * 100).toFixed(1) + '% of the whole portfolio';
                return 'Risk contribution: ' + (r.risk * 100).toFixed(0) + '% of portfolio risk';
              }
            }
          }
        }
      }
    });
    compareChart.$rows = rows;
  }
  function renderCompareTable(rows) {
    var tb = document.getElementById('asCompareBody'); if (!tb) return;
    var showUsd = hasUSD();
    var head = document.getElementById('asCompareHead');
    if (head) head.innerHTML = '<tr><th>Allocation</th><th class="as-num">Upside</th><th class="as-num">Drawdown</th><th class="as-num">Risk share</th>'
      + (showUsd ? '<th class="as-num">Drawdown $</th>' : '') + '</tr>';
    tb.innerHTML = rows.map(function (r) {
      return '<tr' + (r.current ? ' class="as-row-current"' : '') + '>'
        + '<td><strong>' + r.alloc + '%</strong></td>'
        + '<td class="as-num">' + mult(r.withBtc) + '</td>'
        + '<td class="as-num as-neg">−' + pct(r.drawdown, 1) + '</td>'
        + '<td class="as-num as-risk">' + pct(r.risk) + '</td>'
        + (showUsd ? '<td class="as-num as-neg">' + usd(-S.portfolioUSD * r.drawdown) + '</td>' : '')
        + '</tr>';
    }).join('');
  }

  function renderAudit(rows) {
    var tb = document.getElementById('asAuditBody'); if (!tb) return;
    var showUsd = hasUSD();
    var head = document.getElementById('asAuditHead');
    if (head) head.innerHTML = '<tr><th>Allocation</th><th class="as-num">Portfolio upside</th><th class="as-num">Upside uplift</th><th class="as-num">Drawdown</th><th class="as-num">Risk share</th>'
      + (showUsd ? '<th class="as-num">Drawdown $</th>' : '') + '</tr>';
    tb.innerHTML = rows.map(function (r) {
      return '<tr' + (r.current ? ' class="as-row-current"' : '') + '>'
        + '<td><strong>' + r.alloc + '%</strong></td>'
        + '<td class="as-num">' + mult(r.withBtc) + '</td>'
        + '<td class="as-num as-up">+' + pct(r.uplift) + '</td>'
        + '<td class="as-num as-neg">−' + pct(r.drawdown, 1) + '</td>'
        + '<td class="as-num as-risk">' + pct(r.risk) + '</td>'
        + (showUsd ? '<td class="as-num as-neg">' + usd(-S.portfolioUSD * r.drawdown) + '</td>' : '')
        + '</tr>';
    }).join('');
  }

  // ════════ ASSUMPTIONS LINE ════════
  function renderAssumptions() {
    var el = document.getElementById('asAssumptions'); if (!el) return;
    el.innerHTML = 'Illustrative inputs, not forecasts: bitcoin volatility <strong>' + Math.round(BTC_VOL * 100) + '%</strong>, traditional sleeve <strong>' + Math.round(TRAD_VOL * 100) + '%</strong>, correlation <strong>' + CORR.toFixed(2) + '</strong> (kept on the high side, since bitcoin&rsquo;s diversification benefit has weakened since the ETFs). Single-hold: bitcoin does ' + mult(S.upsideMult) + ', the rest ' + mult(S.tradMult) + '. Risk contribution is bitcoin&rsquo;s share of total portfolio variance, matching the published figures.';
  }

  // ════════ AUDIT / CSV ════════
  function buildCsv(rows) {
    var L = [];
    L.push('# Last Coin Standing — Bitcoin allocation sizing (lived experience of an allocation)');
    L.push('# Bitcoin volatility,' + Math.round(BTC_VOL * 100) + '%');
    L.push('# Traditional sleeve volatility,' + Math.round(TRAD_VOL * 100) + '%');
    L.push('# Correlation,' + CORR.toFixed(2));
    L.push('# Crash depth,' + S.crashDepthPct + '%');
    L.push('# Bitcoin upside multiple,' + S.upsideMult + 'x');
    L.push('# Traditional sleeve multiple,' + S.tradMult + 'x');
    if (hasUSD()) L.push('# Total portfolio,$' + Math.round(S.portfolioUSD));
    L.push('# Live scenario URL,' + window.location.href);
    L.push('');
    L.push('Allocation %,Portfolio upside (x),Upside uplift vs no BTC (%),Drawdown of whole portfolio (%),Risk contribution (%)' + (hasUSD() ? ',Drawdown ($)' : ''));
    rows.forEach(function (r) {
      L.push([r.alloc, r.withBtc.toFixed(3), (r.uplift * 100).toFixed(1), (r.drawdown * 100).toFixed(1), (r.risk * 100).toFixed(1)]
        .concat(hasUSD() ? [Math.round(-S.portfolioUSD * r.drawdown)] : []).join(','));
    });
    return L.join('\n');
  }

  // ════════ RENDER ALL ════════
  function renderAll() {
    renderFaces();
    renderHold();
    var rows = compareRows();
    renderCompareChart(rows);
    renderCompareTable(rows);
    renderAudit(rows);
    renderAssumptions();
    syncUrl();
    _lastRows = rows;
  }
  var _lastRows = null;

  // ════════ INPUTS + WIRING ════════
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function setSeg(groupId, value) {
    var g = document.getElementById(groupId); if (!g) return;
    g.querySelectorAll('[data-val]').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-val') === String(value)); });
  }

  function initControls() {
    var a = document.getElementById('asAlloc'), aS = document.getElementById('asAllocSlider');
    if (a) a.value = S.allocPct; if (aS) aS.value = String(S.allocPct);
    var ds = document.getElementById('asDepthSlider'); if (ds) ds.value = String(S.crashDepthPct);
    var up = document.getElementById('asUpside'), upV = document.getElementById('asUpsideVal');
    if (up) up.value = String(S.upsideMult); if (upV) upV.textContent = mult(S.upsideMult);
    var tr = document.getElementById('asTrad'), trV = document.getElementById('asTradVal');
    if (tr) tr.value = String(S.tradMult); if (trV) trV.textContent = mult(S.tradMult);
    var pf = document.getElementById('asPortfolio'); if (pf && hasUSD()) pf.value = S.portfolioUSD;
    setSeg('asAllocPresets', S.allocPct);
    setSeg('asDepth', String(S.crashDepthPct));
    setDepthVal();
  }
  function setDepthVal() { var dv = document.getElementById('asDepthVal'); if (dv) dv.innerHTML = '−' + S.crashDepthPct + '%'; }

  function wire() {
    // Allocation: number + slider + presets (synced)
    var a = document.getElementById('asAlloc'), aS = document.getElementById('asAllocSlider');
    function setAlloc(v, from) {
      if (!isFinite(v)) return;
      S.allocPct = clamp(Math.round(v), 0, 100);
      if (from !== 'num' && a) a.value = S.allocPct;
      if (from !== 'slider' && aS) aS.value = String(S.allocPct);
      setSeg('asAllocPresets', S.allocPct);
      renderAll();
    }
    if (a) a.addEventListener('input', function () { setAlloc(parseFloat(a.value), 'num'); });
    if (aS) aS.addEventListener('input', function () { setAlloc(parseInt(aS.value, 10), 'slider'); });
    var presets = document.getElementById('asAllocPresets');
    if (presets) presets.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; setAlloc(parseInt(b.getAttribute('data-val'), 10), 'preset'); });

    // Crash depth: slider + presets (reuse the stress-test look)
    var ds = document.getElementById('asDepthSlider');
    if (ds) ds.addEventListener('input', function () { var v = parseInt(ds.value, 10); if (isFinite(v)) { S.crashDepthPct = clamp(v, 1, 99); setSeg('asDepth', String(v)); setDepthVal(); renderAll(); } });
    var depth = document.getElementById('asDepth');
    if (depth) depth.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; var v = parseInt(b.getAttribute('data-val'), 10); S.crashDepthPct = v; if (ds) ds.value = String(v); setSeg('asDepth', String(v)); setDepthVal(); renderAll(); });

    // Upside multiple slider
    var up = document.getElementById('asUpside'), upV = document.getElementById('asUpsideVal');
    if (up) up.addEventListener('input', function () { var v = parseFloat(up.value); if (isFinite(v)) { S.upsideMult = v; if (upV) upV.textContent = mult(v); renderAll(); } });

    // Traditional sleeve multiple slider (stated default, adjustable)
    var tr = document.getElementById('asTrad'), trV = document.getElementById('asTradVal');
    if (tr) tr.addEventListener('input', function () { var v = parseFloat(tr.value); if (isFinite(v)) { S.tradMult = v; if (trV) trV.textContent = mult(v); renderAll(); } });

    // Optional total portfolio $
    var pf = document.getElementById('asPortfolio');
    if (pf) pf.addEventListener('input', function () { var v = parseFloat(pf.value); S.portfolioUSD = (isFinite(v) && v > 0) ? v : null; renderAll(); });

    // Audit accordion
    var at = document.getElementById('asAuditToggle'), ab = document.getElementById('asAuditBody2');
    if (at && ab) at.addEventListener('click', function () { var open = at.getAttribute('aria-expanded') === 'true'; at.setAttribute('aria-expanded', String(!open)); ab.hidden = open; });

    // CSV
    var csvBtn = document.getElementById('asCsvBtn');
    if (csvBtn) csvBtn.addEventListener('click', function () {
      if (!_lastRows) return;
      var blob = new Blob([buildCsv(_lastRows)], { type: 'text/csv' });
      var el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = 'bitcoin-allocation-sizing.csv';
      document.body.appendChild(el); el.click(); document.body.removeChild(el);
      var lbl = csvBtn.querySelector('.as-csv-label'); if (lbl) { var o = lbl.textContent; lbl.textContent = 'Downloaded'; setTimeout(function () { lbl.textContent = o; }, 1600); }
    });

    initControls();
  }

  // ════════ URL STATE (shareable) ════════
  function readUrl() {
    if (!window.URLSearchParams) return;
    var p = new URLSearchParams(window.location.search);
    if (p.has('alloc')) { var a = parseInt(p.get('alloc'), 10); if (isFinite(a)) S.allocPct = clamp(a, 0, 100); }
    if (p.has('depth')) { var d = parseInt(p.get('depth'), 10); if (isFinite(d)) S.crashDepthPct = clamp(d, 1, 99); }
    if (p.has('up')) { var u = parseFloat(p.get('up')); if (isFinite(u)) S.upsideMult = clamp(u, 1, 20); }
    if (p.has('trad')) { var t = parseFloat(p.get('trad')); if (isFinite(t)) S.tradMult = clamp(t, 0.5, 5); }
    if (p.has('port')) { var v = parseFloat(p.get('port')); if (isFinite(v) && v > 0) S.portfolioUSD = v; }
  }
  var _urlT = null;
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    if (_urlT) clearTimeout(_urlT);
    _urlT = setTimeout(function () {
      var p = new URLSearchParams(window.location.search);
      p.set('alloc', String(S.allocPct)); p.set('depth', String(S.crashDepthPct));
      p.set('up', String(S.upsideMult)); p.set('trad', String(S.tradMult));
      if (hasUSD()) p.set('port', String(Math.round(S.portfolioUSD))); else p.delete('port');
      window.history.replaceState(null, '', window.location.pathname + '?' + p.toString() + window.location.hash);
    }, 250);
  }

  // ════════ INIT ════════
  function init() { readUrl(); wire(); renderAll(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
