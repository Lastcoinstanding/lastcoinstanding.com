/* =============================================================
   Bitcoin, Priced in Gold — page script (2026-10-18)

   Everything on the page is computed here, at load, from two shared
   series: PL_DATA (bitcoin in dollars, shared/power-law-data.js) and
   GOLD_MONTHLY (gold in dollars, World Bank monthly averages,
   shared/gold-monthly-data.js). Nothing is typed into the page, so a
   monthly refresh of either series moves every figure by itself.

   Method (SITE_GUIDE §63):
   - Each PL_DATA sample is priced in ounces: its dollar price divided
     by gold's average for the same calendar month (UTC).
   - The gold trend is an ordinary least-squares fit of log10(ounces)
     on log10(days since the genesis block), from FIT_FROM (2011),
     re-fitted at every load. It is this page's fit, not the site's
     dollar reference model (a = 1.6e-17, b = 5.77).
   - The dollar line it is compared with is fitted the same way over
     the same months, so the two are like for like.
   - "The usual range" is the 5th to 95th percentile of the monthly
     multiples since FIT_FROM: 90% of months have sat inside it.
   - Today: the live bitcoin price (fetchTodayPrice) over today's gold
     price (fetchGoldPrice); either falls back to its latest sample,
     and the readout names which.

   Console: window.gbQA() returns the fits and today's reading.
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof GOLD_MONTHLY === 'undefined') return;

  var FIT_FROM = '2011-01-01';
  var GENESIS_MS = Date.UTC(2009, 0, 3);
  var DAY_MS = 86400000;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // ── helpers ──
  function dateOf(day) { return new Date(GENESIS_MS + day * DAY_MS); }
  function dayOf(iso) { return (Date.parse(iso + 'T00:00:00Z') - GENESIS_MS) / DAY_MS; }
  function monthKey(day) { var d = dateOf(day); return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2); }
  function yearFrac(day) { var d = dateOf(day); var y0 = Date.UTC(d.getUTCFullYear(), 0, 1); return d.getUTCFullYear() + (d - y0) / (365.25 * DAY_MS); }
  function monthLabel(day) { var d = dateOf(day); return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function keyLabel(k) { return MONTHS_LONG[+k.slice(5, 7) - 1] + ' ' + k.slice(0, 4); }
  function fmtOz(v) {
    if (!isFinite(v)) return '—';
    if (v >= 100) return Math.round(v).toLocaleString('en-US');
    if (v >= 10) return v.toFixed(1);
    if (v >= 1) return v.toFixed(2);
    return v.toPrecision(2);
  }
  function fmtX(v) { return isFinite(v) ? v.toFixed(2) + '×' : '—'; }
  function fmtUsd(v) { return '$' + Math.round(v).toLocaleString('en-US'); }
  function pct(v) { return Math.round(v * 100) + '%'; }
  function css(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v && v.trim()) || fallback;
  }
  function setText(id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt; }
  function setHtml(id, html) { var e = document.getElementById(id); if (e) e.innerHTML = html; }

  // Least squares of log10(y) on log10(x).
  function fitLogLog(xs, ys) {
    var n = xs.length, sx = 0, sy = 0, sxx = 0, sxy = 0, i, X, Y;
    for (i = 0; i < n; i++) { X = Math.log10(xs[i]); Y = Math.log10(ys[i]); sx += X; sy += Y; sxx += X * X; sxy += X * Y; }
    var b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
    var my = sy / n, ssr = 0, sst = 0;
    for (i = 0; i < n; i++) { X = Math.log10(xs[i]); Y = Math.log10(ys[i]); ssr += Math.pow(Y - (a + b * X), 2); sst += Math.pow(Y - my, 2); }
    return { a: a, b: b, r2: 1 - ssr / sst, at: function (d) { return Math.pow(10, a + b * Math.log10(d)); } };
  }
  function quantile(sorted, q) {
    var p = (sorted.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (p - lo);
  }

  // ── the series: each PL_DATA sample priced in ounces ──
  var GOLD = {};
  GOLD_MONTHLY.forEach(function (r) { GOLD[r[0]] = r[1]; });
  var ROWS = [];
  PL_DATA.forEach(function (s) {
    var k = monthKey(s[0]);
    if (GOLD[k]) ROWS.push({ day: s[0], usd: s[1], gold: GOLD[k], oz: s[1] / GOLD[k], key: k });
  });
  var FROM_DAY = dayOf(FIT_FROM);
  function rowsFrom(iso) { var d0 = dayOf(iso); return ROWS.filter(function (r) { return r.day >= d0; }); }
  function fitsFrom(iso) {
    var R = rowsFrom(iso), xs = R.map(function (r) { return r.day; });
    return { rows: R, gold: fitLogLog(xs, R.map(function (r) { return r.oz; })), usd: fitLogLog(xs, R.map(function (r) { return r.usd; })) };
  }
  var MAIN = fitsFrom(FIT_FROM);
  var FIT_ROWS = MAIN.rows;
  FIT_ROWS.forEach(function (r) { r.mg = r.oz / MAIN.gold.at(r.day); r.mu = r.usd / MAIN.usd.at(r.day); });
  var SORTED_G = FIT_ROWS.map(function (r) { return r.mg; }).sort(function (a, b) { return a - b; });
  var SORTED_U = FIT_ROWS.map(function (r) { return r.mu; }).sort(function (a, b) { return a - b; });
  var BAND_LO = quantile(SORTED_G, 0.05), BAND_HI = quantile(SORTED_G, 0.95);
  function rankBelow(sorted, v) { var n = 0; for (var i = 0; i < sorted.length; i++) if (sorted[i] < v) n++; return n / sorted.length; }
  var LAST = ROWS[ROWS.length - 1];

  // Today's reading; filled from the latest sample, then from the live prices.
  var TODAY = null;
  function computeToday(btcUsd, btcSrc, goldUsd, goldSrc, goldLabel) {
    var day = (typeof TODAY_DAYS !== 'undefined' && isFinite(TODAY_DAYS)) ? TODAY_DAYS : LAST.day;
    var oz = btcUsd / goldUsd, trend = MAIN.gold.at(day), mg = oz / trend, mu = btcUsd / MAIN.usd.at(day);
    TODAY = { day: day, btcUsd: btcUsd, btcSrc: btcSrc, goldUsd: goldUsd, goldSrc: goldSrc, goldLabel: goldLabel,
              oz: oz, trendOz: trend, mg: mg, mu: mu, rankG: rankBelow(SORTED_G, mg), rankU: rankBelow(SORTED_U, mu) };
    return TODAY;
  }

  // ── §1 the readout (enumerated states, STYLE_GUIDE §12) ──
  function zoneOf(m) {
    if (m < BAND_LO) return 'below';
    if (m < 0.75) return 'low';
    if (m <= 1.33) return 'near';
    if (m <= BAND_HI) return 'high';
    return 'above';
  }
  var ZONE_TEXT = {
    below: 'below the range that has held 90% of months since 2011',
    low: 'in the lower part of its usual range',
    near: 'close to its gold trend',
    high: 'in the upper part of its usual range',
    above: 'above the range that has held 90% of months since 2011'
  };
  function rankSentence(r) {
    // r = share of months since 2011 with a LOWER multiple than today.
    if (r < 0.5) return 'Only ' + pct(r) + ' of months since 2011 sat lower against the gold trend.';
    return pct(r) + ' of months since 2011 sat lower against the gold trend.';
  }
  function sourceNote(t) {
    var b = t.btcSrc === 'live' ? 'live bitcoin price' : 'bitcoin at its ' + monthLabel(LAST.day) + ' sample';
    var g = t.goldSrc === 'live' ? 'the live gold price (' + t.goldLabel + ')' : 'gold’s ' + keyLabel(GOLD_MONTHLY[GOLD_MONTHLY.length - 1][0]) + ' average';
    return 'From the ' + b + ' and ' + g + '.';
  }
  function renderReadout() {
    var t = TODAY; if (!t) return;
    setText('gbOzNow', fmtOz(t.oz));
    setText('gbTrendNow', fmtOz(t.trendOz));
    setText('gbMultNow', fmtX(t.mg));
    setText('gbUsdMultNow', fmtX(t.mu));
    setText('gbGoldUsd', fmtUsd(t.goldUsd));
    setText('gbBtcUsd', fmtUsd(t.btcUsd));
    var z = zoneOf(t.mg);
    setHtml('gbVerdict', 'Bitcoin sits at <strong>' + fmtX(t.mg) + '</strong> its gold trend, ' + ZONE_TEXT[z] + '. ' + rankSentence(t.rankG) +
      ' In dollars, against the same kind of fit, it sits at <strong>' + fmtX(t.mu) + '</strong>' +
      (t.rankU < 0.5 ? ', with ' + pct(t.rankU) + ' of months lower.' : ', with ' + pct(t.rankU) + ' of months lower.'));
    setText('gbSource', sourceNote(t));
    var el = document.getElementById('gbReadout'); if (el) el.setAttribute('data-zone', z);
  }

  // ── charts ──
  var charts = {};
  function yearTicks(v) { return Math.round(v) === v ? String(v) : ''; }
  function ozTick(v) {
    var l = Math.log10(v);
    if (Math.abs(l - Math.round(l)) > 1e-6) return '';
    return (v >= 1 ? v.toLocaleString('en-US') : String(+v.toPrecision(1))) + ' oz';
  }
  function xTick(v) {
    var l = Math.log10(v);
    if (Math.abs(l - Math.round(l)) > 1e-6 && [0.2, 0.5, 2, 5].indexOf(+v.toPrecision(1)) < 0) return '';
    return +v.toPrecision(2) + '×';
  }
  function baseOptions(yTitle, yTick) {
    var grid = css('--gb-grid', 'rgba(255,255,255,0.05)'), muted = css('--text-muted', '#706860'), dim = css('--text-dim', '#908880');
    return {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        legend: { position: 'top', align: 'start', labels: { color: dim, font: { family: 'Inter', size: 11 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 12,
          filter: function (it, data) { return !data.datasets[it.datasetIndex].hideInLegend; } } },
        tooltip: { backgroundColor: css('--gb-tip-bg', 'rgba(20,17,13,0.95)'), borderColor: css('--gb-tip-border', 'rgba(224,148,34,0.3)'), borderWidth: 1,
          titleColor: css('--text-bright', '#f2eee8'), bodyColor: css('--text', '#d8d2ca'), padding: 10 }
      },
      scales: {
        x: { type: 'linear', min: 2011, ticks: { color: muted, font: { size: 10 }, callback: yearTicks, autoSkip: false, maxRotation: 0 }, grid: { color: grid },
             // Whole years only, every second year (every third on a phone).
             afterBuildTicks: function (sc) {
               var step = (sc.chart.width || 800) < 520 ? 3 : 2, t = [];
               for (var y = Math.ceil(sc.min); y <= Math.floor(sc.max); y += step) t.push({ value: y });
               sc.ticks = t;
             } },
        y: { type: 'logarithmic', title: { display: true, text: yTitle, color: muted, font: { size: 10 } }, ticks: { color: muted, font: { size: 10 }, callback: yTick }, grid: { color: grid } }
      }
    };
  }

  function renderOzChart() {
    var cv = document.getElementById('gbOzChart'); if (!cv || typeof Chart === 'undefined') return;
    var pts = FIT_ROWS.map(function (r) { return { x: yearFrac(r.day), y: r.oz, day: r.day }; });
    var endDay = Math.max(LAST.day, TODAY ? TODAY.day : 0);
    var trend = [], lo = [], hi = [];
    for (var d = FROM_DAY; d <= endDay + 1; d += 15) {
      var t = MAIN.gold.at(d), x = yearFrac(d);
      trend.push({ x: x, y: t }); lo.push({ x: x, y: t * BAND_LO }); hi.push({ x: x, y: t * BAND_HI });
    }
    var btc = css('--gb-btc', '#F7931A'), gold = css('--gb-trend', '#d4a843'), band = css('--gb-band', 'rgba(212,168,67,0.45)'), now = css('--gb-now', '#f2eee8');
    var ds = [
      { label: 'Bitcoin in ounces of gold', data: pts, borderColor: btc, borderWidth: 1.8, pointRadius: 0, tension: 0 },
      { label: 'Gold trend', data: trend, borderColor: gold, borderWidth: 1.6, borderDash: [6, 4], pointRadius: 0 },
      { label: 'Usual range (90% of months)', data: hi, borderColor: band, borderWidth: 1, borderDash: [2, 3], pointRadius: 0 },
      { label: 'Usual range low', data: lo, borderColor: band, borderWidth: 1, borderDash: [2, 3], pointRadius: 0, hideInLegend: true }
    ];
    if (TODAY) ds.push({ label: 'Today', data: [{ x: yearFrac(TODAY.day), y: TODAY.oz }], type: 'scatter', pointRadius: 5, pointHoverRadius: 6, backgroundColor: now, borderColor: btc, borderWidth: 2, hideInLegend: true });
    var opt = baseOptions('Ounces of gold per bitcoin (log scale)', ozTick);
    opt.scales.x.max = yearFrac(endDay) + 0.3;
    opt.plugins.tooltip.callbacks = {
      title: function (it) { var p = it[0].raw; return p.day != null ? monthLabel(p.day) : (it[0].dataset.label === 'Today' ? 'Today' : ''); },
      label: function (it) { return it.dataset.label.replace(' low', '') + ': ' + fmtOz(it.parsed.y) + ' oz'; }
    };
    opt.plugins.tooltip.filter = function (it) { return it.datasetIndex === 0 || it.dataset.label === 'Today'; };
    if (charts.oz) charts.oz.destroy();
    charts.oz = new Chart(cv, { type: 'line', data: { datasets: ds }, options: opt });
  }

  function renderMultChart() {
    var cv = document.getElementById('gbMultChart'); if (!cv || typeof Chart === 'undefined') return;
    var g = FIT_ROWS.map(function (r) { return { x: yearFrac(r.day), y: r.mg, day: r.day }; });
    var u = FIT_ROWS.map(function (r) { return { x: yearFrac(r.day), y: r.mu, day: r.day }; });
    var endDay = Math.max(LAST.day, TODAY ? TODAY.day : 0);
    var one = [{ x: 2011, y: 1 }, { x: yearFrac(endDay) + 0.3, y: 1 }];
    var ds = [
      { label: 'Priced in gold', data: g, borderColor: css('--gb-trend', '#d4a843'), borderWidth: 1.8, pointRadius: 0 },
      { label: 'Priced in dollars', data: u, borderColor: css('--gb-usd', '#8fb3c9'), borderWidth: 1.5, pointRadius: 0 },
      { label: 'On trend (1×)', data: one, borderColor: css('--gb-one', 'rgba(242,238,232,0.35)'), borderWidth: 1, borderDash: [4, 4], pointRadius: 0 }
    ];
    if (TODAY) {
      ds.push({ label: 'Today, gold', data: [{ x: yearFrac(TODAY.day), y: TODAY.mg }], type: 'scatter', pointRadius: 5, backgroundColor: css('--gb-now', '#f2eee8'), borderColor: css('--gb-trend', '#d4a843'), borderWidth: 2, hideInLegend: true });
      ds.push({ label: 'Today, dollars', data: [{ x: yearFrac(TODAY.day), y: TODAY.mu }], type: 'scatter', pointRadius: 5, backgroundColor: css('--gb-now', '#f2eee8'), borderColor: css('--gb-usd', '#8fb3c9'), borderWidth: 2, hideInLegend: true });
    }
    var opt = baseOptions('Multiple of its own trend (log scale)', xTick);
    opt.scales.x.max = yearFrac(endDay) + 0.3;
    opt.plugins.tooltip.callbacks = {
      title: function (it) { var p = it[0].raw; return p.day != null ? monthLabel(p.day) : 'Today'; },
      label: function (it) { return it.dataset.label + ': ' + fmtX(it.parsed.y); }
    };
    opt.plugins.tooltip.filter = function (it) { return it.dataset.label.indexOf('On trend') < 0; };
    if (charts.mult) charts.mult.destroy();
    charts.mult = new Chart(cv, { type: 'line', data: { datasets: ds }, options: opt });
  }

  // ── §3 the cycle lows (windows are definitional: each bear market's low) ──
  var LOWS = [
    { label: '2015 low', from: '2014-12-01', to: '2015-12-31' },
    { label: '2018–19 low', from: '2018-11-01', to: '2019-03-31' },
    { label: 'March 2020', from: '2020-02-15', to: '2020-04-30' },
    { label: '2022–23 low', from: '2022-06-01', to: '2023-01-31' },
    { label: 'This bear market, since the October 2025 high', from: '2025-10-06', to: null }
  ];
  function lowIn(from, to, key) {
    var d0 = dayOf(from), d1 = to ? dayOf(to) : Infinity, best = null;
    FIT_ROWS.forEach(function (r) { if (r.day >= d0 && r.day <= d1 && (!best || r[key] < best[key])) best = r; });
    return best;
  }
  function renderLows() {
    var body = document.getElementById('gbLowsBody'); if (!body) return;
    var html = '', deepestPriorG = Infinity, deepestPriorU = Infinity, cur = null;
    LOWS.forEach(function (w, i) {
      var g = lowIn(w.from, w.to, 'mg'), u = lowIn(w.from, w.to, 'mu');
      if (!g || !u) return;
      var open = !w.to;
      if (!open) { deepestPriorG = Math.min(deepestPriorG, g.mg); deepestPriorU = Math.min(deepestPriorU, u.mu); }
      else cur = { g: g, u: u };
      html += '<tr' + (open ? ' class="gb-row-now"' : '') + '><td>' + w.label + (open ? ' <span class="gb-open">still open</span>' : '') + '</td>' +
        '<td class="num"><strong>' + fmtX(g.mg) + '</strong> <span class="gb-when">' + monthLabel(g.day) + '</span></td>' +
        '<td class="num"><strong>' + fmtX(u.mu) + '</strong> <span class="gb-when">' + monthLabel(u.day) + '</span></td></tr>';
    });
    body.innerHTML = html;
    if (cur) {
      var gr = cur.g.mg / deepestPriorG, ur = cur.u.mu / deepestPriorU;
      var gTxt = gr < 0.9 ? 'In gold, this bear market has gone well below every low since 2015: ' + fmtX(cur.g.mg) + ', against ' + fmtX(deepestPriorG) + ' at the deepest of them.'
        : gr <= 1.1 ? 'In gold, this bear market has reached about the depth of the deepest low since 2015 (' + fmtX(cur.g.mg) + ' against ' + fmtX(deepestPriorG) + ').'
        : 'In gold, this bear market has stayed above the lows since 2015 (' + fmtX(cur.g.mg) + ', against ' + fmtX(deepestPriorG) + ' at the deepest).';
      var shallowU = Math.max.apply(null, LOWS.slice(0, 4).map(function (w) { var r = lowIn(w.from, w.to, 'mu'); return r ? r.mu : 0; }));
      var uTxt = cur.u.mu < deepestPriorU * 0.9 ? 'In dollars it has gone deeper than any of them too (' + fmtX(cur.u.mu) + ' against ' + fmtX(deepestPriorU) + ').'
        : cur.u.mu <= shallowU ? 'In dollars it looks like an ordinary bear market: ' + fmtX(cur.u.mu) + ', inside the range of the earlier lows (' + fmtX(deepestPriorU) + ' to ' + fmtX(shallowU) + ').'
        : 'In dollars it has stayed shallower than all of them (' + fmtX(cur.u.mu) + ', against ' + fmtX(shallowU) + ' at the shallowest).';
      setText('gbLowsRead', gTxt + ' ' + uTxt);
    }
  }

  // ── §4 why the lines parted: gold's own run ──
  function renderGoldRun() {
    var k0 = '2024-01', g0 = GOLD[k0], peak = GOLD_MONTHLY.reduce(function (m, r) { return r[1] > m[1] ? r : m; }, ['', 0]);
    var lastG = GOLD_MONTHLY[GOLD_MONTHLY.length - 1];
    if (!g0) return;
    setText('gbGold2024', fmtUsd(g0));
    setText('gbGoldPeak', fmtUsd(peak[1]));
    setText('gbGoldPeakWhen', keyLabel(peak[0]));
    setText('gbGoldRunX', (peak[1] / g0).toFixed(1) + '×');
    setText('gbGoldLast', fmtUsd(lastG[1]));
    setText('gbGoldLastWhen', keyLabel(lastG[0]));
    // Bitcoin in ounces at its October 2025 high (the sample nearest 6 Oct 2025) and today.
    var hi = null, dh = dayOf('2025-10-06');
    ROWS.forEach(function (r) { if (!hi || Math.abs(r.day - dh) < Math.abs(hi.day - dh)) hi = r; });
    setText('gbOzAtHigh', fmtOz(hi.oz));
    if (TODAY) { setText('gbOzToday2', fmtOz(TODAY.oz)); setText('gbOzFall', pct(1 - TODAY.oz / hi.oz)); setText('gbUsdFall', pct(1 - TODAY.btcUsd / hi.usd)); }
  }

  // ── §4b the reading of the parted lines (enumerated on depth) ──
  function renderParted() {
    var d0 = dayOf('2025-10-06'), curMin = Infinity;
    FIT_ROWS.forEach(function (r) { if (r.day >= d0) curMin = Math.min(curMin, r.mg); });
    if (TODAY) curMin = Math.min(curMin, TODAY.mg);
    var prior = null;
    FIT_ROWS.forEach(function (r) { if (r.day < d0 && r.mg <= curMin) prior = r; });
    var depth = prior
      ? 'pushed bitcoin\u2019s gold price further below its trend than at any time since ' + dateOf(prior.day).getUTCFullYear()
      : 'pushed bitcoin\u2019s gold price further below its trend than at any time since this fit begins, in 2011';
    var uLows = LOWS.slice(0, 4).map(function (w) { var r = lowIn(w.from, w.to, 'mu'); return r ? r.mu : null; }).filter(function (v) { return v != null; });
    var uCur = lowIn('2025-10-06', null, 'mu'), uMin = Math.min.apply(null, uLows);
    var usdPart = !uCur ? '' : uCur.mu >= uMin * 0.9
      ? 'So the gap between the two lines is mostly not bitcoin doing something unusual: in dollars, this bear market\u2019s low (' + fmtX(uCur.mu) + ') sits among the earlier ones. '
      : 'In dollars, too, this bear market has gone deeper than the earlier ones (' + fmtX(uCur.mu) + ' against ' + fmtX(uMin) + '), so the gap between the lines is gold\u2019s run on top of an unusually deep fall. ';
    setText('gbPartedRead', usdPart + 'What stands out is the timing: the fall came during gold\u2019s run, and the two together have ' + depth + '.');
  }

  // ── §5 how sturdy: the fit from three start years ──
  var STARTS = ['2011-01-01', '2013-01-01', '2016-01-01'];
  function renderSturdy() {
    var body = document.getElementById('gbSturdyBody'); if (!body) return;
    var html = '', bs = [], todays = [];
    STARTS.forEach(function (s) {
      var F = fitsFrom(s), day = TODAY ? TODAY.day : LAST.day;
      var mg = TODAY ? TODAY.oz / F.gold.at(day) : LAST.oz / F.gold.at(LAST.day);
      var mu = TODAY ? TODAY.btcUsd / F.usd.at(day) : LAST.usd / F.usd.at(LAST.day);
      bs.push(F); todays.push(mg);
      html += '<tr><td>From ' + s.slice(0, 4) + '</td>' +
        '<td class="num">' + F.gold.b.toFixed(2) + '</td><td class="num">' + F.gold.r2.toFixed(2) + '</td><td class="num">' + fmtX(mg) + '</td>' +
        '<td class="num">' + F.usd.b.toFixed(2) + '</td><td class="num">' + F.usd.r2.toFixed(2) + '</td><td class="num">' + fmtX(mu) + '</td></tr>';
    });
    body.innerHTML = html;
    var gSpread = Math.max.apply(null, bs.map(function (F) { return F.gold.b; })) - Math.min.apply(null, bs.map(function (F) { return F.gold.b; }));
    var uSpread = Math.max.apply(null, bs.map(function (F) { return F.usd.b; })) - Math.min.apply(null, bs.map(function (F) { return F.usd.b; }));
    setText('gbSturdyRead', gSpread > uSpread * 1.5
      ? 'The gold trend moves more with the starting year than the dollar trend does: its exponent spans ' + gSpread.toFixed(2) + ' across these three starts, against ' + uSpread.toFixed(2) + ' in dollars, and its fit explains less of the record from 2016.' +
        (todays.every(function (m) { return m < 0.75; }) ? ' Bitcoin reads low against gold whichever start you pick, but how low depends on the choice more than it does in dollars.' : ' Where bitcoin reads against gold today depends on that choice more than it does in dollars.')
      : 'The gold trend holds about as steady as the dollar trend across these three starts (exponents spanning ' + gSpread.toFixed(2) + ' in gold and ' + uSpread.toFixed(2) + ' in dollars).');
  }

  // ── §5b what earlier lows this deep were followed by ──
  function renderEarlier() {
    var el = document.getElementById('gbEarlier'); if (!el) return;
    // Runs of months below the usual range, a gap of more than 100 days starting a new run.
    var runs = [], cur = null;
    FIT_ROWS.forEach(function (r) {
      if (r.mg < BAND_LO) {
        if (cur && r.day - cur[cur.length - 1].day <= 100) cur.push(r); else { if (cur) runs.push(cur); cur = [r]; }
      }
    });
    if (cur) runs.push(cur);
    var current = runs.length && runs[runs.length - 1][0].day >= dayOf('2025-10-06') ? runs.pop() : null;
    var parts = runs.map(function (run) {
      var low = run.reduce(function (m, r) { return r.mg < m.mg ? r : m; });
      var later = null, target = low.day + 730.5;
      if (target <= LAST.day) ROWS.forEach(function (r) { if (!later || Math.abs(r.day - target) < Math.abs(later.day - target)) later = r; });
      var a = monthLabel(run[0].day), z = monthLabel(run[run.length - 1].day);
      return a + (z !== a ? ' to ' + z : '') +
        ' (low ' + fmtX(low.mg) + ' in ' + monthLabel(low.day) + (later ? '; two years later bitcoin bought ' + (later.oz / low.oz).toFixed(0) + '× as many ounces' : '') + ')';
    });
    var txt;
    if (!runs.length) txt = 'No earlier stretch since 2011 went below the usual range in gold. This is the first.';
    else {
      var lastRun = runs[runs.length - 1], lastYear = dateOf(lastRun[lastRun.length - 1].day).getUTCFullYear();
      var allEarly = lastYear <= 2013;
      txt = 'Before this bear market, bitcoin went below its usual range against gold in ' + (runs.length === 1 ? 'one stretch' : runs.length + ' stretches') +
        (allEarly ? ', all of them by ' + lastYear + ', when one bitcoin cost at most ' + fmtUsd(Math.max.apply(null, runs.map(function (run) { return Math.max.apply(null, run.map(function (r) { return r.usd; })); }))) + ' and almost nobody held it: ' : ': ') + parts.join('; ') + '. ' +
        (allEarly ? 'A tiny asset can multiply like that. It says little about what an asset worth well over a trillion dollars does next. After ' + lastYear + ', no month fell below the range again until this bear market.'
                  : 'Each was followed by a rise in ounces, though a handful of episodes is a small record to learn from.');
    }
    if (current) txt += ' The current stretch began in ' + monthLabel(current[0].day) + ' and has no outcome yet.';
    el.textContent = txt;
  }

  function renderStatic() {
    setText('gbFitB', MAIN.gold.b.toFixed(2));
    setText('gbFitR2', MAIN.gold.r2.toFixed(2));
    setText('gbFitUsdB', MAIN.usd.b.toFixed(2));
    setText('gbBandLo', fmtX(BAND_LO));
    setText('gbBandHi', fmtX(BAND_HI));
    setText('gbMonths', String(FIT_ROWS.length));
    setText('gbLastSample', monthLabel(LAST.day));
    setText('gbGoldLastKey', keyLabel(GOLD_MONTHLY[GOLD_MONTHLY.length - 1][0]));
  }

  // The "two readings" paragraph is about a deep low against gold; it shows
  // only while bitcoin is in the lower part of its range (STYLE_GUIDE §12).
  function renderTwoReadings() {
    var el = document.getElementById('gbTwoReadings'); if (!el || !TODAY) return;
    el.hidden = !(TODAY.mg < 0.75);
  }

  function renderAll() {
    renderTwoReadings();
    renderReadout(); renderOzChart(); renderMultChart(); renderLows(); renderGoldRun(); renderParted(); renderSturdy(); renderEarlier();
  }

  window.gbQA = function () {
    return { fitFrom: FIT_FROM, months: FIT_ROWS.length, gold: { a: MAIN.gold.a, b: MAIN.gold.b, r2: MAIN.gold.r2 }, usd: { a: MAIN.usd.a, b: MAIN.usd.b, r2: MAIN.usd.r2 },
             band: [BAND_LO, BAND_HI], last: { month: LAST.key, oz: LAST.oz, mg: LAST.mg }, today: TODAY };
  };

  function init() {
    renderStatic();
    // First paint from the latest samples, so nothing waits on the network.
    computeToday(LAST.usd, 'fallback', GOLD_MONTHLY[GOLD_MONTHLY.length - 1][1], 'fallback', null);
    renderAll();
    var btc = null, gold = null;
    function both() {
      if (!btc || !gold) return;
      computeToday(btc.p, btc.s, gold.p, gold.s, gold.l);
      renderAll();
    }
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (p, s) { btc = { p: p, s: s }; both(); });
    else btc = { p: LAST.usd, s: 'fallback' };
    if (typeof fetchGoldPrice === 'function') fetchGoldPrice(function (p, s, l) { gold = { p: p, s: s, l: l }; both(); });
    else gold = { p: GOLD_MONTHLY[GOLD_MONTHLY.length - 1][1], s: 'fallback', l: null };
    both();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
