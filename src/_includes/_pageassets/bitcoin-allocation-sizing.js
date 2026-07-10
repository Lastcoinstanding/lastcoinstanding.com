/* =============================================================
   Bitcoin Portfolio Allocation — does bitcoin earn its place?

   Answers ONE question: over a long horizon, does adding bitcoin make
   a portfolio meaningfully better, despite the drawdowns? The headline
   states the affirmative case WITH its cost in the same breath, and the
   three effects sit beneath it:
     1. Extra return       — the reward.
     2. Drawdown           — the price of admission; the REAL risk is being
        shaken out and selling into it (permanent loss), not the swing.
     3. Portfolio influence — the neutral, double-edged engine: how much of
        your portfolio's MOVEMENT bitcoin drives. That movement is what does
        the outsized work; it is not a hazard (see The Bitcoin Horizon:
        volatility is not risk).

   Bitcoin growth is projected from the shared Power Law, with a
   REGIME-AWARE default: below trend, hold today's ratio (grow with the
   trend from a discount); at/above trend, grow back to trend, not a
   persistent premium. A flat-rate override is available. The math (risk
   share, drawdown, upside) is unchanged; only the bitcoin projection and
   the framing change. Makes no optimal-% recommendation.

   Reads plPrice / TODAY_DAYS / TODAY_PRICE / fetchTodayPrice from
   power-law-data.js. Reference points reproduced: influence/risk share
   2%→~4%, 5%→~11%, 10%→~24%, 20%→~48%, 50%→~85%.
   ============================================================= */
(function () {
  'use strict';
  if (typeof plPrice !== 'function' || typeof TODAY_DAYS === 'undefined') return;

  // ── Stated illustrative assumptions ──
  var BTC_VOL = 0.45, TRAD_VOL = 0.12, CORR = 0.50;

  // ── Palette ──
  var MUTED = '#7a7367', DIM = '#9a9080';

  // ── Live Power Law context (spot vs trend today) ──
  var spot = TODAY_PRICE;
  function trendToday() { return plPrice(TODAY_DAYS); }
  function currentRatio() { var t = trendToday(); return t > 0 ? spot / t : 1; }
  function belowTrend() { return currentRatio() < 0.98; }
  function trendGrowth(years) {
    var dEnd = TODAY_DAYS + years * 365.25;
    var t0 = plPrice(TODAY_DAYS);
    return t0 > 0 ? plPrice(dEnd) / t0 : 1;
  }

  // ── State ──
  var DEFAULTS = { allocPct: 10, horizonYears: 10, tradRatePct: 10, crashDepthPct: 40, btcMode: null, btcFlatPct: 15 };
  var S = {
    allocPct: 10,
    horizonYears: 10,
    tradRatePct: 10,       // traditional sleeve nominal CAGR (S&P long-run ~10%)
    crashDepthPct: 40,     // modern default: bitcoin's bears have been getting shallower
    btcMode: null,         // 'hold' | 'revert' | 'flat'; null = regime-aware default
    btcFlatPct: 15,        // flat-rate override (VanEck base case floor)
    portfolioUSD: null
  };
  var COMPARE_ALLOCS = [1, 5, 10, 20, 50];

  function regimeMode() { return belowTrend() ? 'hold' : 'revert'; } // the regime-aware default
  function activeMode() { return S.btcMode || regimeMode(); }

  // Bitcoin single-hold multiple from the Power Law projection.
  function btcMult() {
    var H = S.horizonYears, m = activeMode();
    if (m === 'flat') return Math.pow(1 + S.btcFlatPct / 100, H);
    var g = trendGrowth(H), r = currentRatio();
    if (m === 'revert') return r > 0 ? g / r : g;  // price returns to trend by horizon end
    return g;                                        // 'hold': keeps today's ratio, grows with trend
  }
  function tradMult() { return Math.pow(1 + S.tradRatePct / 100, S.horizonYears); }

  // ════════ THE MATH ════════
  function portVol(w) {
    return Math.sqrt(Math.pow(w * BTC_VOL, 2) + Math.pow((1 - w) * TRAD_VOL, 2)
      + 2 * w * (1 - w) * CORR * BTC_VOL * TRAD_VOL);
  }
  function btcInfluence(w) { // bitcoin's share of portfolio movement (variance) — the neutral engine
    var covBtcPort = w * BTC_VOL * BTC_VOL + (1 - w) * CORR * BTC_VOL * TRAD_VOL;
    var tv = Math.pow(portVol(w), 2);
    return tv > 0 ? (w * covBtcPort) / tv : 0;
  }
  function drawdownHit(w, d) { return w * d; }

  function effects(w) {
    var d = S.crashDepthPct / 100, mB = btcMult(), mT = tradMult();
    var withBtc = w * mB + (1 - w) * mT, without = mT;
    return {
      w: w, influence: btcInfluence(w), drawdown: drawdownHit(w, d),
      withBtc: withBtc, without: without,
      uplift: without > 0 ? withBtc / without - 1 : 0,
      endBtcShare: withBtc > 0 ? (w * mB) / withBtc : w
    };
  }

  // ════════ FORMATTERS ════════
  function pct(v, dp) { return (v * 100).toFixed(dp == null ? 0 : dp) + '%'; }
  function signedPct(v, dp) { return (v >= 0 ? '+' : '') + pct(v, dp); }
  function mult(v) { return v.toFixed(2) + 'x'; }
  function ratioX(v) { return v.toFixed(2) + '×'; }
  function usd(v) {
    if (v == null || !isFinite(v)) return '—';
    var a = Math.abs(v), s = v < 0 ? '-$' : '$';
    if (a >= 1e9) return s + (a / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return s + (a / 1e6).toFixed(2) + 'M';
    if (a >= 1e3) return s + Math.round(a / 1e3) + 'K';
    return s + Math.round(a);
  }
  function commas(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function hasUSD() { return S.portfolioUSD != null && isFinite(S.portfolioUSD) && S.portfolioUSD > 0; }

  // ════════ REGIME TRANSPARENCY LINE (why the number is what it is) ════════
  function renderRegime() {
    var el = document.getElementById('asRegime'); if (!el) return;
    var r = currentRatio(), g = trendGrowth(S.horizonYears), m = activeMode();
    var line;
    if (m === 'flat') {
      line = 'You are overriding the Power Law projection with a flat <strong>' + S.btcFlatPct + '%/yr</strong> (about ' + mult(btcMult()) + ' over ' + S.horizonYears + ' years). For context, bitcoin sits at about <strong>' + ratioX(r) + '</strong> its Power Law trend today.';
    } else if (belowTrend()) {
      line = 'Bitcoin is about <strong>' + ratioX(r) + '</strong> its Power Law trend right now, a historical discount, and that is why the expected uplift is this large. The default holds that discount and grows with the trend, about <strong>' + mult(g) + '</strong> over ' + S.horizonYears + ' years; it does not bank on the discount closing (returning to trend would be more). If bitcoin were at or above trend, the default would instead assume growth back to trend, not a lasting premium, and read more modestly.';
    } else {
      line = 'Bitcoin is about <strong>' + ratioX(r) + '</strong> its Power Law trend right now. The default assumes it grows back toward trend from here, about <strong>' + mult(btcMult()) + '</strong> over ' + S.horizonYears + ' years, rather than holding a premium the Power Law says mean-reverts.';
    }
    el.innerHTML = line;
  }

  // ════════ THE VERDICT (the answer, upside WITH its cost) ════════
  function upliftAt(w, years) {
    var m = activeMode(), mB, mT = Math.pow(1 + S.tradRatePct / 100, years);
    if (m === 'flat') mB = Math.pow(1 + S.btcFlatPct / 100, years);
    else { var g = trendGrowth(years), r = currentRatio(); mB = (m === 'revert' && r > 0) ? g / r : g; }
    var wb = w * mB + (1 - w) * mT;
    return mT > 0 ? wb / mT - 1 : 0;
  }
  function renderConclusion() {
    var el = document.getElementById('asVerdict'); if (!el) return;
    var w = S.allocPct / 100, f = effects(w), P = S.portfolioUSD;
    var cls = 'as-verdict-yes', main, detail;

    if (S.allocPct <= 0) {
      cls = 'as-verdict-neutral';
      main = 'With no bitcoin, your portfolio would grow <strong>' + mult(f.without) + '</strong> over ' + S.horizonYears + ' years, and take no bitcoin drawdown.';
      detail = 'Add a position above to see what it does. Over a long enough hold, a modest allocation has added more return than its drawdowns cost.';
    } else if (f.uplift <= 0.0005) {
      cls = 'as-verdict-neutral';
      main = 'At these assumptions, a <strong>' + S.allocPct + '% bitcoin</strong> allocation would not earn its place: your portfolio grows to about <strong>' + mult(f.withBtc) + '</strong>, versus ' + mult(f.without) + ' with none.';
      detail = 'It adds a <strong>~' + pct(f.drawdown, 1) + '</strong> drawdown you have to be able to hold through, without adding return. The case for bitcoin here rests on a higher forward path or a longer hold than you have set.';
    } else {
      var longerH = S.horizonYears < 20 ? 20 : Math.min(40, S.horizonYears + 10);
      var upLong = upliftAt(w, longerH);
      var toX = hasUSD() ? usd(P * f.withBtc) : mult(f.withBtc);
      var fromX = hasUSD() ? usd(P * f.without) : mult(f.without);
      var moreBit = hasUSD() ? usd(P * (f.withBtc - f.without)) + ' more' : signedPct(f.uplift, 1) + ' more';
      var ddBit = hasUSD() ? '~' + pct(f.drawdown, 1) + ' (about ' + usd(-P * f.drawdown) + ')' : '~' + pct(f.drawdown, 1);
      main = 'Over a <strong>' + S.horizonYears + '-year</strong> hold, a <strong>' + S.allocPct + '% bitcoin</strong> allocation would take your whole portfolio to <strong>' + toX + '</strong>, versus <strong>' + fromX + '</strong> with none, about <strong>' + moreBit + '</strong>, from a position that is only ' + S.allocPct + '% of your money.';
      detail = 'That position pulls its weight and then some: it grows into roughly <strong>' + pct(f.endBtcShare) + '</strong> of your final portfolio, more than you put in. The price of admission is a one-time <strong>' + ddBit + '</strong> fall in the whole portfolio in a ' + S.crashDepthPct + '% bitcoin bear. The real risk is not that swing, it is being shaken out and selling into it, so the return only shows up if you can hold through. That movement is also the engine: bitcoin drives about ' + pct(f.influence) + ' of your portfolio&rsquo;s swings, and there is no inflation-beating portfolio built only from things that sit still. Over a long enough hold a modest position has added more return than its drawdowns cost, and the longer the horizon the more the case builds: at ' + longerH + ' years the same ' + S.allocPct + '% position adds closer to <strong>' + signedPct(upLong, 0) + '</strong>.';
    }
    el.className = 'as-verdict ' + cls;
    el.innerHTML = '<div class="as-verdict-main">' + main + '</div><p class="as-verdict-detail">' + detail + '</p>';
  }

  // ════════ THE THREE EFFECTS ════════
  function renderEffects() {
    var w = S.allocPct / 100, f = effects(w), P = S.portfolioUSD;

    var upEl = document.getElementById('faceUpside');
    if (upEl) {
      var upDetail = 'Your portfolio grows <strong>' + mult(f.withBtc) + '</strong> over ' + S.horizonYears + ' years instead of ' + mult(f.without) + ' with none.';
      if (hasUSD()) upDetail += ' On ' + usd(P) + ', ' + usd(P * f.withBtc) + ' versus ' + usd(P * f.without) + '.';
      setFace(upEl, signedPct(f.uplift, 1), 'more final wealth than no bitcoin', upDetail);
    }

    var dnEl = document.getElementById('faceDrawdown');
    if (dnEl) {
      var dnDetail = 'A ' + S.crashDepthPct + '% bitcoin bear takes about <strong>' + pct(f.drawdown, 1) + ' off the whole portfolio</strong> in one fall. This is the price of admission: the real risk is being shaken out and selling into it, which turns a paper dip into a permanent loss.';
      if (hasUSD()) dnDetail += ' Roughly ' + usd(-P * f.drawdown) + ' on ' + usd(P) + '.';
      setFace(dnEl, '−' + pct(f.drawdown), 'the fall you must hold through', dnDetail);
    }

    var rkEl = document.getElementById('faceRisk');
    if (rkEl) {
      var rkDetail = 'Bitcoin drives about <strong>' + pct(f.influence) + ' of your portfolio&rsquo;s movement</strong> from a ' + S.allocPct + '% position. This is not a hazard, it is the engine: the same movement that does the outsized work, historically more of it to the upside. It cuts both ways, but it is why a small position earns so much.';
      setFace(rkEl, pct(f.influence), 'of your portfolio’s movement', rkDetail);
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
    var w = S.allocPct / 100, f = effects(w);
    var dollarBit = hasUSD() ? ' (about ' + usd(-S.portfolioUSD * f.drawdown) + ')' : '';
    el.innerHTML = 'A <strong>' + S.allocPct + '%</strong> allocation means watching your whole portfolio fall about <strong>' + pct(f.drawdown, 1) + '</strong>' + dollarBit
      + ' in a ' + S.crashDepthPct + '% bitcoin bear, probably more than once over a ' + S.horizonYears + '-year hold. The return only shows up if you do not sell into that fall. '
      + 'If the honest answer is that you would sell, the allocation is too big for you, whatever the numbers say. That is the conviction question <a href="/bull-and-bear-cycles">Bull &amp; Bear Cycles</a> is about, and why <a href="/the-bitcoin-horizon">The Bitcoin Horizon</a> argues the swing is only a risk if it shakes you out.';
  }

  // ════════ REBALANCING TEMPTATION ════════
  function renderRebalance() {
    var el = document.getElementById('asRebalance'); if (!el) return;
    var w = S.allocPct / 100, f = effects(w);
    if (S.allocPct <= 0 || f.endBtcShare <= w + 0.001) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = 'If bitcoin does outperform over the hold, your allocation does not stay put. A <strong>' + S.allocPct + '%</strong> position grows into about <strong>' + pct(f.endBtcShare) + '</strong> of the portfolio by year ' + S.horizonYears + '. '
      + 'The reflex is to rebalance it back to target, but that means selling your best-performing asset to buy the laggards. There is an honest tension with <a href="/disciplined-rebalancing">Disciplined Rebalancing</a>: trimming into strength harvests the swings and controls the position, but cutting a long-term winner back to a small target can also cap the return you sized it for. Which side you land on comes down to whether the position has grown past what you can still hold through.';
  }

  // ════════ COMPARISON ════════
  var compareChart = null;
  function compareRows() {
    var allocs = COMPARE_ALLOCS.slice();
    if (allocs.indexOf(S.allocPct) < 0 && S.allocPct > 0) allocs.push(S.allocPct);
    allocs.sort(function (a, b) { return a - b; });
    return allocs.map(function (a) {
      var f = effects(a / 100);
      return { alloc: a, current: a === S.allocPct, uplift: f.uplift, drawdown: f.drawdown, influence: f.influence, withBtc: f.withBtc };
    });
  }
  function renderCompareChart(rows) {
    var el = document.getElementById('asCompareChart');
    if (!el || typeof Chart === 'undefined') return;
    var labels = rows.map(function (r) { return r.alloc + '%'; });
    var upData = rows.map(function (r) { return +(r.uplift * 100).toFixed(1); });
    var dnData = rows.map(function (r) { return +(r.drawdown * 100).toFixed(1); });
    var inData = rows.map(function (r) { return +(r.influence * 100).toFixed(1); });
    var ds = [
      { label: 'Extra return', data: upData, backgroundColor: 'rgba(111,174,111,0.75)', borderWidth: 0, borderRadius: 3 },
      { label: 'Drawdown', data: dnData, backgroundColor: 'rgba(224,138,122,0.8)', borderWidth: 0, borderRadius: 3 },
      { label: 'Portfolio influence', data: inData, backgroundColor: 'rgba(224,148,34,0.8)', borderWidth: 0, borderRadius: 3 }
    ];
    if (compareChart) {
      compareChart.data.labels = labels;
      compareChart.data.datasets[0].data = upData; compareChart.data.datasets[1].data = dnData; compareChart.data.datasets[2].data = inData;
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
                if (it.datasetIndex === 0) return 'Extra return: +' + (r.uplift * 100).toFixed(1) + '% more final wealth (portfolio ' + mult(r.withBtc) + ')';
                if (it.datasetIndex === 1) return 'Drawdown: −' + (r.drawdown * 100).toFixed(1) + '% you must hold through';
                return 'Portfolio influence: ' + (r.influence * 100).toFixed(0) + '% of the movement';
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
    if (head) head.innerHTML = '<tr><th>Allocation</th><th class="as-num">Portfolio</th><th class="as-num">Extra return</th><th class="as-num">Drawdown</th><th class="as-num">Influence</th>'
      + (showUsd ? '<th class="as-num">Drawdown $</th>' : '') + '</tr>';
    tb.innerHTML = rows.map(function (r) {
      return '<tr' + (r.current ? ' class="as-row-current"' : '') + '>'
        + '<td><strong>' + r.alloc + '%</strong></td>'
        + '<td class="as-num">' + mult(r.withBtc) + '</td>'
        + '<td class="as-num as-up">' + signedPct(r.uplift, 1) + '</td>'
        + '<td class="as-num as-neg">−' + pct(r.drawdown, 1) + '</td>'
        + '<td class="as-num as-risk">' + pct(r.influence) + '</td>'
        + (showUsd ? '<td class="as-num as-neg">' + usd(-S.portfolioUSD * r.drawdown) + '</td>' : '')
        + '</tr>';
    }).join('');
  }
  function renderAudit(rows) {
    var tb = document.getElementById('asAuditBody'); if (!tb) return;
    var showUsd = hasUSD();
    var head = document.getElementById('asAuditHead');
    if (head) head.innerHTML = '<tr><th>Allocation</th><th class="as-num">Portfolio upside</th><th class="as-num">Extra return</th><th class="as-num">Drawdown</th><th class="as-num">Influence</th>'
      + (showUsd ? '<th class="as-num">Drawdown $</th>' : '') + '</tr>';
    tb.innerHTML = rows.map(function (r) {
      return '<tr' + (r.current ? ' class="as-row-current"' : '') + '>'
        + '<td><strong>' + r.alloc + '%</strong></td>'
        + '<td class="as-num">' + mult(r.withBtc) + '</td>'
        + '<td class="as-num as-up">' + signedPct(r.uplift, 1) + '</td>'
        + '<td class="as-num as-neg">−' + pct(r.drawdown, 1) + '</td>'
        + '<td class="as-num as-risk">' + pct(r.influence) + '</td>'
        + (showUsd ? '<td class="as-num as-neg">' + usd(-S.portfolioUSD * r.drawdown) + '</td>' : '')
        + '</tr>';
    }).join('');
  }

  // ════════ ASSUMPTIONS LINE ════════
  function renderAssumptions() {
    var el = document.getElementById('asAssumptions'); if (!el) return;
    el.innerHTML = 'What we assume, and why: a <strong>' + S.horizonYears + '-year</strong> hold (bitcoin is a long-term commitment, and a long enough hold has historically absorbed even a surprise drawdown, see <a href="/the-bitcoin-horizon">The Bitcoin Horizon</a>); the traditional sleeve at <strong>' + S.tradRatePct + '%/yr</strong> (roughly the S&amp;P&rsquo;s long-run nominal return, about ' + mult(tradMult()) + '); bitcoin projected from its <strong>Power Law</strong> (about ' + mult(btcMult()) + ' over the hold, regime-aware, see <a href="/bull-and-bear-cycles">Bull &amp; Bear Cycles</a>); volatility <strong>45%</strong> and correlation <strong>0.50</strong> (kept high, since bitcoin&rsquo;s diversification benefit has weakened since the ETFs). Illustrative, not forecasts. Every one is adjustable.';
  }

  // ════════ CSV ════════
  function buildCsv(rows) {
    var L = [];
    L.push('# Last Coin Standing — Bitcoin portfolio allocation');
    L.push('# Horizon,' + S.horizonYears + ' years');
    L.push('# Bitcoin projection,' + activeMode() + ' (' + mult(btcMult()) + ' over hold)');
    L.push('# Bitcoin ratio to Power Law trend today,' + currentRatio().toFixed(3));
    L.push('# Traditional sleeve rate,' + S.tradRatePct + '%/yr (' + mult(tradMult()) + ' over hold)');
    L.push('# Bitcoin volatility,' + Math.round(BTC_VOL * 100) + '%');
    L.push('# Traditional sleeve volatility,' + Math.round(TRAD_VOL * 100) + '%');
    L.push('# Correlation,' + CORR.toFixed(2));
    L.push('# Crash depth,' + S.crashDepthPct + '%');
    if (hasUSD()) L.push('# Total portfolio,$' + Math.round(S.portfolioUSD));
    L.push('# Live scenario URL,' + window.location.href);
    L.push('');
    L.push('Allocation %,Portfolio upside (x),Extra return vs no BTC (%),Drawdown of whole portfolio (%),Portfolio influence (%)' + (hasUSD() ? ',Drawdown ($)' : ''));
    rows.forEach(function (r) {
      L.push([r.alloc, r.withBtc.toFixed(3), (r.uplift * 100).toFixed(1), (r.drawdown * 100).toFixed(1), (r.influence * 100).toFixed(1)]
        .concat(hasUSD() ? [Math.round(-S.portfolioUSD * r.drawdown)] : []).join(','));
    });
    return L.join('\n');
  }

  // ════════ RENDER ALL ════════
  function renderAll() {
    renderRegime();
    renderConclusion();
    renderEffects();
    renderHold();
    renderRebalance();
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
    var hz = document.getElementById('asHorizon'); if (hz) hz.value = String(S.horizonYears);
    var tr = document.getElementById('asTradRate'); if (tr) tr.value = String(S.tradRatePct);
    var ds = document.getElementById('asDepthSlider'); if (ds) ds.value = String(S.crashDepthPct);
    var fr = document.getElementById('asFlatRate'); if (fr) fr.value = String(S.btcFlatPct);
    var pf = document.getElementById('asPortfolio'); if (pf && hasUSD()) pf.value = commas(S.portfolioUSD);
    setSeg('asAllocPresets', S.allocPct);
    setSeg('asDepth', String(S.crashDepthPct));
    setSeg('asBtcMode', activeMode());
    updateReadouts();
  }
  function updateReadouts() {
    var hzV = document.getElementById('asHorizonVal'); if (hzV) hzV.textContent = S.horizonYears + (S.horizonYears === 1 ? ' year' : ' years');
    var trV = document.getElementById('asTradRateVal'); if (trV) trV.textContent = S.tradRatePct + '%/yr → ' + mult(tradMult());
    var bmV = document.getElementById('asBtcModeVal'); if (bmV) bmV.textContent = mult(btcMult()) + ' over ' + S.horizonYears + ' yrs';
    var frWrap = document.getElementById('asFlatWrap'); if (frWrap) frWrap.hidden = (activeMode() !== 'flat');
    var frV = document.getElementById('asFlatRateVal'); if (frV) frV.textContent = S.btcFlatPct + '%/yr';
    var dv = document.getElementById('asDepthVal'); if (dv) dv.innerHTML = '−' + S.crashDepthPct + '%';
  }

  function wire() {
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

    var hz = document.getElementById('asHorizon');
    if (hz) hz.addEventListener('input', function () { var v = parseInt(hz.value, 10); if (isFinite(v)) { S.horizonYears = clamp(v, 1, 40); updateReadouts(); renderAll(); } });
    var tr = document.getElementById('asTradRate');
    if (tr) tr.addEventListener('input', function () { var v = parseFloat(tr.value); if (isFinite(v)) { S.tradRatePct = clamp(v, 0, 20); updateReadouts(); renderAll(); } });

    // Bitcoin projection mode (Power Law): hold / revert / flat. Default = regime-aware.
    var bm = document.getElementById('asBtcMode');
    if (bm) bm.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; S.btcMode = b.getAttribute('data-val'); setSeg('asBtcMode', activeMode()); updateReadouts(); renderAll(); });
    var fr = document.getElementById('asFlatRate');
    if (fr) fr.addEventListener('input', function () { var v = parseFloat(fr.value); if (isFinite(v)) { S.btcFlatPct = clamp(v, 0, 40); updateReadouts(); renderAll(); } });

    var ds = document.getElementById('asDepthSlider');
    if (ds) ds.addEventListener('input', function () { var v = parseInt(ds.value, 10); if (isFinite(v)) { S.crashDepthPct = clamp(v, 1, 99); setSeg('asDepth', String(v)); updateReadouts(); renderAll(); } });
    var depth = document.getElementById('asDepth');
    if (depth) depth.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b) return; var v = parseInt(b.getAttribute('data-val'), 10); S.crashDepthPct = v; if (ds) ds.value = String(v); setSeg('asDepth', String(v)); updateReadouts(); renderAll(); });

    var pf = document.getElementById('asPortfolio');
    if (pf) pf.addEventListener('input', function () {
      var raw = pf.value.replace(/[^0-9.]/g, ''), v = parseFloat(raw);
      S.portfolioUSD = (isFinite(v) && v > 0) ? v : null;
      var caretEnd = pf.selectionStart === pf.value.length;
      if (hasUSD()) pf.value = commas(v);
      if (caretEnd) { try { pf.setSelectionRange(pf.value.length, pf.value.length); } catch (e) {} }
      renderAll();
    });

    // Reset defaults
    var reset = document.getElementById('asReset');
    if (reset) reset.addEventListener('click', function () {
      S.horizonYears = DEFAULTS.horizonYears; S.tradRatePct = DEFAULTS.tradRatePct; S.crashDepthPct = DEFAULTS.crashDepthPct;
      S.btcMode = null; S.btcFlatPct = DEFAULTS.btcFlatPct;
      initControls(); renderAll();
    });

    // Audit accordion + CSV
    var at = document.getElementById('asAuditToggle'), ab = document.getElementById('asAuditBody2');
    if (at && ab) at.addEventListener('click', function () { var open = at.getAttribute('aria-expanded') === 'true'; at.setAttribute('aria-expanded', String(!open)); ab.hidden = open; });
    var csvBtn = document.getElementById('asCsvBtn');
    if (csvBtn) csvBtn.addEventListener('click', function () {
      if (!_lastRows) return;
      var blob = new Blob([buildCsv(_lastRows)], { type: 'text/csv' });
      var el = document.createElement('a'); el.href = URL.createObjectURL(blob); el.download = 'bitcoin-portfolio-allocation.csv';
      document.body.appendChild(el); el.click(); document.body.removeChild(el);
      var lbl = csvBtn.querySelector('.as-csv-label'); if (lbl) { var o = lbl.textContent; lbl.textContent = 'Downloaded'; setTimeout(function () { lbl.textContent = o; }, 1600); }
    });

    initControls();
  }

  // ════════ URL STATE ════════
  function readUrl() {
    if (!window.URLSearchParams) return;
    var p = new URLSearchParams(window.location.search);
    if (p.has('alloc')) { var a = parseInt(p.get('alloc'), 10); if (isFinite(a)) S.allocPct = clamp(a, 0, 100); }
    if (p.has('hz')) { var h = parseInt(p.get('hz'), 10); if (isFinite(h)) S.horizonYears = clamp(h, 1, 40); }
    if (p.has('tradr')) { var t = parseFloat(p.get('tradr')); if (isFinite(t)) S.tradRatePct = clamp(t, 0, 20); }
    if (p.has('depth')) { var d = parseInt(p.get('depth'), 10); if (isFinite(d)) S.crashDepthPct = clamp(d, 1, 99); }
    if (p.has('btc') && ['hold', 'revert', 'flat'].indexOf(p.get('btc')) >= 0) S.btcMode = p.get('btc');
    if (p.has('flat')) { var fl = parseFloat(p.get('flat')); if (isFinite(fl)) S.btcFlatPct = clamp(fl, 0, 40); }
    if (p.has('port')) { var v = parseFloat(p.get('port')); if (isFinite(v) && v > 0) S.portfolioUSD = v; }
  }
  var _urlT = null;
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    if (_urlT) clearTimeout(_urlT);
    _urlT = setTimeout(function () {
      var p = new URLSearchParams(window.location.search);
      p.set('alloc', String(S.allocPct)); p.set('hz', String(S.horizonYears));
      p.set('tradr', String(S.tradRatePct)); p.set('depth', String(S.crashDepthPct));
      if (S.btcMode) p.set('btc', S.btcMode); else p.delete('btc');
      if (activeMode() === 'flat') p.set('flat', String(S.btcFlatPct)); else p.delete('flat');
      if (hasUSD()) p.set('port', String(Math.round(S.portfolioUSD))); else p.delete('port');
      window.history.replaceState(null, '', window.location.pathname + '?' + p.toString() + window.location.hash);
    }, 250);
  }

  // ════════ INIT ════════
  function init() {
    readUrl(); wire(); renderAll();
    // Refresh the spot price (and with it the regime + projection) from the live feed.
    try { fetchTodayPrice(function (price) { if (isFinite(price) && price > 0) { spot = price; if (S.btcMode == null) setSeg('asBtcMode', activeMode()); updateReadouts(); renderAll(); } }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
