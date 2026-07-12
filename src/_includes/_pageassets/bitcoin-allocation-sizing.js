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
  var MUTED = '#7a7367', DIM = '#9a9080', C_DOWN = '#e08a7a';
  // Drift-chart sleeve colors (page-scoped per STYLE_GUIDE §8): bitcoin "Resonant"
  // orange and the site's traditional-60/40 blue-gray, matching the Retirement chart.
  var BTC_ORANGE = '#F7931A', TRAD_BLUE = '#5e7a92';

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
  var DEFAULTS = { allocPct: 10, horizonYears: 10, tradRatePct: 10, crashDepthPct: 40, btcMode: null, btcFlatPct: 15, strat: 'ride', cmp: false };
  var S = {
    allocPct: 10,
    horizonYears: 10,
    tradRatePct: 10,       // traditional sleeve nominal CAGR (S&P long-run ~10%)
    crashDepthPct: 40,     // modern default: bitcoin's bears have been getting shallower
    btcMode: null,         // 'hold' | 'revert' | 'flat'; null = regime-aware default
    btcFlatPct: 15,        // flat-rate override (VanEck base case floor)
    portfolioUSD: null,
    strat: 'ride',         // drift chart: 'ride' (let it ride) | 'rebal' (rebalance annually)
    cmp: false             // drift chart: rebalance-comparison disclosure open
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

  // ════════ YEARLY PATH ENGINE (drift chart) ════════
  // Year-by-year portfolio path for BOTH strategies. Does NOT fork the
  // assumptions: same modes, same growth math as the closed-form verdict, just
  // walked one year at a time. Parity is exact — ride.total[H]/P0 reproduces
  // effects(w).withBtc for every mode (see assertParity / paritySweep).
  //
  // Return-to-trend path shape: the Retirement engine's revert convention values
  // its stack at TREND price throughout (terminal factor g), which cannot start
  // from today's below-trend spot and so would break parity here (this page's
  // revert multiple is g/r). We use the design-doc fallback — geometric
  // amortization of the ratio: gBtc(t) = [plPrice(t)/plPrice(t-1)] × (1/r)^(1/H).
  // That is trend-shaped and closes the gap to trend smoothly by year H, and its
  // product over the horizon equals g/r exactly.
  function pathModeFor(state) { return state.btcMode || regimeMode(); }
  function computePaths(state) {
    var st = state || S;
    var H = Math.max(1, st.horizonYears);
    var w = st.allocPct / 100;
    var P0 = (st.portfolioUSD != null && isFinite(st.portfolioUSD) && st.portfolioUSD > 0) ? st.portfolioUSD : 100;
    var depth = st.crashDepthPct / 100;
    var gTrad = 1 + st.tradRatePct / 100;
    var mode = pathModeFor(st);
    var r = currentRatio();
    function gBtcAt(t) {
      if (mode === 'flat') return 1 + st.btcFlatPct / 100;
      var pPrev = plPrice(TODAY_DAYS + (t - 1) * 365.25);
      var pCur = plPrice(TODAY_DAYS + t * 365.25);
      var g = pPrev > 0 ? pCur / pPrev : 1;
      if (mode === 'revert' && r > 0) return g * Math.pow(1 / r, 1 / H);
      return g; // 'hold'
    }

    var years = [];
    var ride = { btc: [], trad: [], total: [], envelope: [], btcShare: [] };
    var rebal = { btc: [], trad: [], total: [], envelope: [], btcShare: [], trimmedCum: [] };
    var rBtc = P0 * w, rTrad = P0 * (1 - w);
    var bBtc = P0 * w, bTrad = P0 * (1 - w), trimmed = 0;

    for (var t = 0; t <= H; t++) {
      if (t > 0) {
        var g = gBtcAt(t);
        rBtc *= g; rTrad *= gTrad;             // let it ride: sleeves compound independently
        bBtc *= g; bTrad *= gTrad;             // rebalance: grow, then reset to target below
        var bTot0 = bBtc + bTrad, target = bTot0 * w;
        if (bBtc > target) trimmed += (bBtc - target); // only count trims OUT of bitcoin
        bBtc = target; bTrad = bTot0 * (1 - w);
      }
      years.push(t);
      var rTot = rBtc + rTrad;
      ride.btc.push(rBtc); ride.trad.push(rTrad); ride.total.push(rTot);
      ride.envelope.push(rTot - rBtc * depth);
      ride.btcShare.push(rTot > 0 ? rBtc / rTot : w);
      var bTot = bBtc + bTrad;
      rebal.btc.push(bBtc); rebal.trad.push(bTrad); rebal.total.push(bTot);
      rebal.envelope.push(bTot - bBtc * depth);
      rebal.btcShare.push(bTot > 0 ? bBtc / bTot : w);
      rebal.trimmedCum.push(trimmed);
    }
    return { years: years, ride: ride, rebal: rebal, P0: P0, w: w, H: H, depth: depth };
  }

  // Runtime parity guard (dev): the loop's year-H total must equal the shipped
  // closed-form verdict for the active allocation, or the two are a contradiction.
  function assertParity(paths) {
    var cf = effects(S.allocPct / 100).withBtc;
    var loop = paths.ride.total[paths.H] / paths.P0;
    if (cf > 0 && Math.abs(loop - cf) / cf > 0.005) {
      console.error('[drift-parity] loop/closed-form mismatch', { loop: loop, closedForm: cf,
        alloc: S.allocPct, mode: activeMode(), horizon: S.horizonYears, tradRate: S.tradRatePct });
    }
  }

  // Full-matrix parity sweep (QA): presets × 3 modes × horizons × sleeve rates.
  // Silent on success; logs on any failure. Exposed as window.asParitySweep()
  // so it can be run from the live console during verification (§8.2).
  function paritySweep() {
    var presets = [1, 5, 10, 20, 50], modes = ['hold', 'revert', 'flat'],
      horizons = [5, 10, 20, 30], rates = [0, 10, 20];
    var pass = 0, fails = [];
    presets.forEach(function (a) { modes.forEach(function (m) { horizons.forEach(function (H) { rates.forEach(function (tr) {
      var st = { allocPct: a, horizonYears: H, tradRatePct: tr, crashDepthPct: S.crashDepthPct,
        btcMode: m, btcFlatPct: S.btcFlatPct, portfolioUSD: null };
      var w = a / 100, mT = Math.pow(1 + tr / 100, H), mB;
      if (m === 'flat') mB = Math.pow(1 + st.btcFlatPct / 100, H);
      else { var g = trendGrowth(H), rr = currentRatio(); mB = (m === 'revert' && rr > 0) ? g / rr : g; }
      var cf = w * mB + (1 - w) * mT;
      var loop = computePaths(st).ride.total[H] / 100;
      if (cf > 0 && Math.abs(loop - cf) / cf <= 0.005) pass++;
      else fails.push({ alloc: a, mode: m, horizon: H, tradRate: tr, closedForm: cf, loop: loop });
    }); }); }); });
    var res = { pass: pass, fail: fails.length, total: pass + fails.length, fails: fails };
    if (fails.length) console.error('[drift-parity sweep] FAILURES', res);
    return res;
  }
  if (typeof window !== 'undefined') window.asParitySweep = paritySweep;

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

  // ════════ DRAWDOWN DIP CHART (real depth, illustrative recovery) ════════
  // Single-hold model, so this conveys SHAPE, not a path: the dip's DEPTH is the reader's
  // computed drawdown; the timing and recovery are a stylized, labeled illustration.
  var dipChart = null;
  var DIP_SHAPE = [0, 0, 0.32, 1, 0.86, 0.56, 0.3, 0.1, 0.02, 0, 0]; // fraction of full depth (1 = trough)
  var dipPlugin = {
    id: 'asDip',
    afterDatasetsDraw: function (c) {
      var dd = c.$dd; if (dd == null) return;
      var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx;
      var y100 = yS.getPixelForValue(100);
      ctx.save();
      ctx.setLineDash([4, 3]); ctx.strokeStyle = 'rgba(236,228,214,0.4)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xS.left, y100); ctx.lineTo(xS.right, y100); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = 'rgba(236,228,214,0.55)'; ctx.font = '600 9px Inter, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('before the bear', xS.left + 4, y100 - 4);
      var tx = xS.getPixelForValue(3), ty = yS.getPixelForValue(100 - dd * 100);
      ctx.fillStyle = '#e08a7a'; ctx.font = '700 12px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('−' + (dd * 100).toFixed(1) + '%', tx, ty + 15);
      ctx.fillStyle = 'rgba(236,228,214,0.55)'; ctx.font = '600 9px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('held through, recovered', xS.right - 4, y100 - 4);
      ctx.restore();
    }
  };
  function renderDipChart() {
    var el = document.getElementById('asDipChart'); if (!el || typeof Chart === 'undefined') return;
    var dd = effects(S.allocPct / 100).drawdown;
    var pts = DIP_SHAPE.map(function (s, i) { return { x: i, y: +(100 - s * dd * 100).toFixed(2) }; });
    var yMin = Math.min(94, 100 - dd * 100 * 1.5);
    if (dipChart) {
      dipChart.data.datasets[0].data = pts; dipChart.options.scales.y.min = yMin; dipChart.$dd = dd; dipChart.update('none'); return;
    }
    dipChart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: { datasets: [{ data: pts, borderColor: C_DOWN, backgroundColor: 'rgba(224,138,122,0.12)', borderWidth: 2, pointRadius: 0, tension: 0.35, fill: 'origin' }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 }, layout: { padding: { top: 6 } },
        scales: {
          x: { type: 'linear', min: 0, max: 10, grid: { display: false }, ticks: { display: false }, title: { display: true, text: 'illustrative timeline, not a modeled path', color: MUTED, font: { size: 9 } } },
          y: { min: yMin, max: 101.5, grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { size: 10 }, callback: function (v) { return v + '%'; } } }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      },
      plugins: [dipPlugin]
    });
    dipChart.$dd = dd;
  }

  // ════════ HONEST NET FRAMING (reward for holding through, NOT extra-minus-drawdown) ════════
  function renderNet() {
    var el = document.getElementById('asNet'); if (!el) return;
    var f = effects(S.allocPct / 100);
    if (S.allocPct <= 0) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = 'The <strong>' + signedPct(f.uplift, 1) + '</strong> extra return is the reward for holding through this dip, not a bonus you keep no matter what. It is yours only if you do not sell into the fall. So the question is not whether ' + signedPct(f.uplift, 1) + ' beats a ' + pct(f.drawdown, 1) + ' fall, it is whether you can sit through the <strong>−' + pct(f.drawdown, 1) + '</strong>, and the deeper ones a larger position brings, to earn it.';
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

  // ════════ DRIFT CHART — your portfolio, year by year ════════
  var driftChart = null;
  function activeStrat() { return S.strat === 'rebal' ? 'rebal' : 'ride'; }
  function driftFmt(v) { return hasUSD() ? usd(v) : commas(v); }

  function renderDrift() {
    var paths = computePaths(S);
    assertParity(paths);
    renderDriftComposition(paths);
    renderDriftEndnote(paths);
    renderDriftChart(paths);
    renderPathAudit(paths);
  }

  // Composition bars + endnote read the SINGLE shipped source (the loop's
  // btcShare), never a parallel computation, so they can't drift from the verdict.
  function setCompBar(btcId, tradId, share) {
    var b = document.getElementById(btcId), t = document.getElementById(tradId);
    if (b) b.style.width = (share * 100).toFixed(1) + '%';
    if (t) t.style.width = ((1 - share) * 100).toFixed(1) + '%';
  }
  function renderDriftComposition(paths) {
    var strat = activeStrat(), w = S.allocPct / 100;
    var sh0 = paths[strat].btcShare[0], shH = paths[strat].btcShare[paths.H];
    setCompBar('asCompBtc0', 'asCompTrad0', sh0);
    var s0 = document.getElementById('asCompShare0'); if (s0) s0.textContent = pct(sh0) + ' bitcoin';
    var whenH = document.getElementById('asCompWhenH'); if (whenH) whenH.textContent = 'At year ' + S.horizonYears;
    var sH = document.getElementById('asCompShareH');
    if (strat === 'rebal') {
      setCompBar('asCompBtcH', 'asCompTradH', w);
      if (sH) sH.textContent = 'held at ' + S.allocPct + '% by annual trimming';
    } else {
      setCompBar('asCompBtcH', 'asCompTradH', shH);
      if (sH) sH.textContent = pct(shH) + ' bitcoin';
    }
  }
  function renderDriftEndnote(paths) {
    var el = document.getElementById('asDriftEndnote'); if (!el) return;
    if (activeStrat() === 'rebal') {
      var trimmed = paths.rebal.trimmedCum[paths.H];
      el.innerHTML = 'Annual rebalancing holds bitcoin at <strong>' + S.allocPct + '%</strong> of the portfolio throughout &mdash; by trimming <strong>' + driftFmt(trimmed) + '</strong> out of the position along the way.';
    } else {
      var shH = paths.ride.btcShare[paths.H];
      el.innerHTML = 'A <strong>' + S.allocPct + '%</strong> position today drifts to <strong>' + pct(shH) + '</strong> of the portfolio by year ' + S.horizonYears + ' under your assumptions.';
    }
  }

  function driftDatasets(paths) {
    var strat = activeStrat();
    var main = paths[strat], other = strat === 'ride' ? paths.rebal : paths.ride;
    var yrs = paths.years;
    function xy(arr) { return arr.map(function (v, i) { return { x: yrs[i], y: v }; }); }
    var narrow = typeof matchMedia === 'function' && matchMedia('(max-width: 480px)').matches;
    var envLabel = narrow ? 'after crash' : ('after a −' + S.crashDepthPct + '% bitcoin crash landing that year');
    var overlayLabel = (strat === 'ride' ? 'Rebalance annually' : 'Let it ride') + ' (total)';
    return [
      { label: 'Traditional sleeve', data: xy(main.trad), fill: 'origin', stack: 'main',
        borderColor: TRAD_BLUE, backgroundColor: 'rgba(94,122,146,0.5)', borderWidth: 1.5, pointRadius: 0, tension: 0.2, order: 3 },
      { label: 'Bitcoin sleeve', data: xy(main.btc), fill: '-1', stack: 'main',
        borderColor: BTC_ORANGE, backgroundColor: 'rgba(247,147,26,0.75)', borderWidth: 1.5, pointRadius: 0, tension: 0.2, order: 2 },
      { label: envLabel, data: xy(main.envelope), fill: false, stack: 'env',
        borderColor: C_DOWN, borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, tension: 0.2, order: 1 },
      { label: overlayLabel, data: xy(other.total), fill: false, stack: 'ovl',
        borderColor: DIM, borderWidth: 1.4, pointRadius: 0, tension: 0.2, order: 0, hidden: !S.cmp }
    ];
  }
  function renderDriftChart(paths) {
    var el = document.getElementById('asDriftChart');
    if (!el || typeof Chart === 'undefined') return;
    var strat = activeStrat();
    var ds = driftDatasets(paths);
    if (driftChart) {
      var needResize = (driftChart._lastH !== paths.H) || (driftChart._lastBasis !== hasUSD());
      driftChart.data.datasets = ds;
      driftChart._main = paths[strat];
      driftChart.options.scales.x.max = paths.H;
      driftChart.options.scales.x.ticks.stepSize = paths.H <= 12 ? 1 : (paths.H <= 24 ? 2 : 5);
      driftChart.options.scales.y.title.text = hasUSD() ? 'Portfolio value ($)' : 'Growth of 100';
      driftChart._lastH = paths.H; driftChart._lastBasis = hasUSD();
      driftChart.update(needResize ? 'resize' : 'none');
      return;
    }
    var narrow = typeof matchMedia === 'function' && matchMedia('(max-width: 480px)').matches;
    driftChart = new Chart(el.getContext('2d'), {
      type: 'line',
      data: { datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { type: 'linear', min: 0, max: paths.H, offset: false,
            grid: { display: false },
            ticks: { color: MUTED, font: { size: 11 }, stepSize: paths.H <= 12 ? 1 : (paths.H <= 24 ? 2 : 5), precision: 0 },
            title: { display: true, text: 'years from today', color: MUTED, font: { size: 10 } } },
          y: { stacked: true, beginAtZero: true, grid: { color: 'rgba(224,148,34,0.06)' },
            ticks: { color: MUTED, font: { size: 11 }, callback: function (v) { return hasUSD() ? usd(v) : commas(v); } },
            title: { display: true, text: hasUSD() ? 'Portfolio value ($)' : 'Growth of 100', color: MUTED, font: { size: 10 } } }
        },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: DIM, font: { size: narrow ? 10 : 11 }, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, padding: 10 } },
          tooltip: {
            mode: 'index', intersect: false, displayColors: false,
            backgroundColor: 'rgba(20,17,13,0.95)', borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1,
            titleColor: '#ece4d6', bodyColor: '#ccc6b8', padding: narrow ? 6 : 10,
            titleFont: { size: narrow ? 11 : 13 }, bodyFont: { size: narrow ? 11 : 12 }, boxPadding: narrow ? 3 : 5,
            filter: function (it) { return it.datasetIndex === 0; },
            callbacks: {
              title: function (items) { return items.length ? ('Year ' + items[0].parsed.x) : ''; },
              label: function (ctx) {
                var i = ctx.dataIndex, m = driftChart._main; if (!m) return '';
                return [
                  'Bitcoin sleeve: ' + driftFmt(m.btc[i]),
                  'Traditional: ' + driftFmt(m.trad[i]),
                  'Total: ' + driftFmt(m.total[i]),
                  'Bitcoin share: ' + pct(m.btcShare[i]),
                  'After −' + S.crashDepthPct + '% crash: ' + driftFmt(m.envelope[i]),
                  'expected values under your assumptions — not a forecast'
                ];
              }
            }
          }
        }
      }
    });
    driftChart._main = paths[strat];
    driftChart._lastH = paths.H; driftChart._lastBasis = hasUSD();
  }

  // Year-by-year audit table: the active strategy's path, plus the rebalance
  // total + cumulative BTC trimmed when the comparison is open.
  function renderPathAudit(paths) {
    var tb = document.getElementById('asPathBody'); if (!tb) return;
    var head = document.getElementById('asPathHead');
    var strat = activeStrat(), main = paths[strat], other = strat === 'ride' ? paths.rebal : paths.ride;
    var showCmp = S.cmp;
    var otherLabel = strat === 'ride' ? 'Rebalanced total' : 'Let-it-ride total';
    if (head) head.innerHTML = '<tr><th>Year</th><th class="as-num">BTC sleeve</th><th class="as-num">Traditional</th><th class="as-num">Total</th><th class="as-num">After −' + S.crashDepthPct + '% crash</th>'
      + (showCmp ? '<th class="as-num">' + otherLabel + '</th><th class="as-num">BTC trimmed (cum.)</th>' : '') + '</tr>';
    var rowsHtml = '';
    for (var i = 0; i < paths.years.length; i++) {
      rowsHtml += '<tr>'
        + '<td>' + paths.years[i] + '</td>'
        + '<td class="as-num">' + driftFmt(main.btc[i]) + '</td>'
        + '<td class="as-num">' + driftFmt(main.trad[i]) + '</td>'
        + '<td class="as-num">' + driftFmt(main.total[i]) + '</td>'
        + '<td class="as-num as-neg">' + driftFmt(main.envelope[i]) + '</td>'
        + (showCmp ? '<td class="as-num">' + driftFmt(other.total[i]) + '</td><td class="as-num">' + driftFmt(paths.rebal.trimmedCum[i]) + '</td>' : '')
        + '</tr>';
    }
    tb.innerHTML = rowsHtml;
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
    // Extra return + drawdown are uncapped magnitudes (bars, left axis). Portfolio influence is
    // a bounded 0–100% share, a different kind of thing, so it rides its own line + right axis
    // rather than being compared in bar height against the uncapped bars.
    var ds = [
      { type: 'bar', label: 'Extra return', data: upData, backgroundColor: 'rgba(111,174,111,0.75)', borderWidth: 0, borderRadius: 3, yAxisID: 'y', order: 2 },
      { type: 'bar', label: 'Drawdown', data: dnData, backgroundColor: 'rgba(224,138,122,0.8)', borderWidth: 0, borderRadius: 3, yAxisID: 'y', order: 2 },
      { type: 'line', label: 'Portfolio influence (share)', data: inData, borderColor: '#e09422', backgroundColor: '#e09422', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#e09422', tension: 0.25, yAxisID: 'y1', order: 1 }
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
          y: { position: 'left', grid: { color: 'rgba(224,148,34,0.06)' }, ticks: { color: MUTED, font: { size: 11 }, callback: function (v) { return v + '%'; } }, title: { display: true, text: 'Return / drawdown', color: MUTED, font: { size: 10 } } },
          y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { color: 'rgba(224,148,34,0.8)', font: { size: 11 }, callback: function (v) { return v + '%'; } }, title: { display: true, text: 'Influence (share)', color: 'rgba(224,148,34,0.8)', font: { size: 10 } } }
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
    L.push('# Drift strategy,' + (S.strat === 'rebal' ? 'rebalance annually' : 'let it ride'));
    L.push('# Rebalance comparison,' + (S.cmp ? 'open' : 'closed'));
    L.push('# Live scenario URL,' + window.location.href);
    L.push('');
    L.push('Allocation %,Portfolio upside (x),Extra return vs no BTC (%),Drawdown of whole portfolio (%),Portfolio influence (%)' + (hasUSD() ? ',Drawdown ($)' : ''));
    rows.forEach(function (r) {
      L.push([r.alloc, r.withBtc.toFixed(3), (r.uplift * 100).toFixed(1), (r.drawdown * 100).toFixed(1), (r.influence * 100).toFixed(1)]
        .concat(hasUSD() ? [Math.round(-S.portfolioUSD * r.drawdown)] : []).join(','));
    });

    // Year-by-year path (the drift chart), on the chart's basis ($ or growth-of-100).
    var paths = computePaths(S), strat = activeStrat(), main = paths[strat], other = strat === 'ride' ? paths.rebal : paths.ride;
    var basis = hasUSD() ? 'dollars' : 'growth of 100 (indexed)';
    var otherLabel = strat === 'ride' ? 'Rebalanced total' : 'Let-it-ride total';
    L.push('');
    L.push('# Year-by-year path,' + (strat === 'rebal' ? 'rebalance annually' : 'let it ride') + ',basis: ' + basis);
    L.push('Year,BTC sleeve,Traditional sleeve,Total,After -' + S.crashDepthPct + '% crash'
      + (S.cmp ? ',' + otherLabel + ',BTC trimmed (cumulative)' : ''));
    for (var i = 0; i < paths.years.length; i++) {
      var row = [paths.years[i], Math.round(main.btc[i]), Math.round(main.trad[i]), Math.round(main.total[i]), Math.round(main.envelope[i])];
      if (S.cmp) row.push(Math.round(other.total[i]), Math.round(paths.rebal.trimmedCum[i]));
      L.push(row.join(','));
    }
    return L.join('\n');
  }

  // ════════ RENDER ALL ════════
  function renderAll() {
    renderRegime();
    renderConclusion();
    renderEffects();
    renderDipChart();
    renderNet();
    renderHold();
    renderDrift();
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
    setSeg('asDriftStrat', S.strat);
    var disc = document.getElementById('asDriftDisclosure'), discBody = document.getElementById('asDriftRebalBody');
    if (disc) disc.setAttribute('aria-expanded', String(S.cmp));
    if (discBody) discBody.hidden = !S.cmp;
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

    // Drift chart: rebalance-comparison disclosure + strategy toggle
    var disc = document.getElementById('asDriftDisclosure'), discBody = document.getElementById('asDriftRebalBody');
    if (disc && discBody) disc.addEventListener('click', function () {
      S.cmp = !S.cmp;
      disc.setAttribute('aria-expanded', String(S.cmp));
      discBody.hidden = !S.cmp;
      renderAll();
    });
    var stratSeg = document.getElementById('asDriftStrat');
    if (stratSeg) stratSeg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-val]'); if (!b) return;
      S.strat = b.getAttribute('data-val') === 'rebal' ? 'rebal' : 'ride';
      setSeg('asDriftStrat', S.strat);
      renderAll();
    });

    // Reset defaults
    var reset = document.getElementById('asReset');
    if (reset) reset.addEventListener('click', function () {
      S.horizonYears = DEFAULTS.horizonYears; S.tradRatePct = DEFAULTS.tradRatePct; S.crashDepthPct = DEFAULTS.crashDepthPct;
      S.btcMode = null; S.btcFlatPct = DEFAULTS.btcFlatPct;
      S.strat = DEFAULTS.strat; S.cmp = DEFAULTS.cmp;
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
    if (p.has('strat') && ['ride', 'rebal'].indexOf(p.get('strat')) >= 0) S.strat = p.get('strat');
    if (p.has('cmp') && p.get('cmp') === '1') S.cmp = true;
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
      if (S.strat === 'rebal') p.set('strat', 'rebal'); else p.delete('strat');
      if (S.cmp) p.set('cmp', '1'); else p.delete('cmp');
      window.history.replaceState(null, '', window.location.pathname + '?' + p.toString() + window.location.hash);
    }, 250);
  }

  // ════════ INIT ════════
  function init() {
    readUrl(); wire(); renderAll();
    paritySweep(); // dev self-check: full matrix loop-vs-closed-form parity (silent unless it fails)
    // Refresh the spot price (and with it the regime + projection) from the live feed.
    try { fetchTodayPrice(function (price) { if (isFinite(price) && price > 0) { spot = price; if (S.btcMode == null) setSeg('asBtcMode', activeMode()); updateReadouts(); renderAll(); } }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
