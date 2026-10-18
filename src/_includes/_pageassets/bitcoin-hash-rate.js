/* =============================================================
   Bitcoin's Hash Rate, as a Power Law — page script (2026-10-18)

   Everything is computed here at load from two shared series:
   HASH_WEEKLY (Blockchain.com weekly hash rate, shared/hash-rate-data.js)
   and PL_DATA (bitcoin's price, shared/power-law-data.js). Nothing on the
   page is typed, so a refresh of either series moves every figure.

   Method (SITE_GUIDE §64):
   - Hash rate against time: OLS of log10(EH/s) on log10(days since the
     genesis block), from three starts (2011, 2016, 2020), and over rolling
     four-year windows (the exponent's drift is the page's main finding).
   - Doubling time over a window: the slope of log2(hash) on days.
   - Price against hash rate: each PL_DATA sample against the hash rate of
     its week (interpolated), OLS of log10(price) on log10(hash), from 2011
     and from 2016.
   - Which moves first: the year-over-year change in log price and in log
     hash rate on a monthly grid from 2014, correlated at leads and lags of
     up to twelve months.
   - Today: the mean of the last seven daily estimates (fetchHashRate) and
     the live bitcoin price (fetchTodayPrice); each falls back to its
     latest sample, labelled.

   Console: window.hrQA().
   ============================================================= */
(function () {
  if (typeof HASH_WEEKLY === 'undefined' || typeof PL_DATA === 'undefined') return;

  var GENESIS_MS = Date.UTC(2009, 0, 3), DAY_MS = 86400000;
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var STARTS = ['2011-01-01', '2016-01-01', '2020-01-01'];
  var WINDOW_YEARS = 4;

  function dateOf(day) { return new Date(GENESIS_MS + day * DAY_MS); }
  function dayOf(iso) { return (Date.parse(iso + 'T00:00:00Z') - GENESIS_MS) / DAY_MS; }
  function yearFrac(day) { var d = dateOf(day), y0 = Date.UTC(d.getUTCFullYear(), 0, 1); return d.getUTCFullYear() + (d - y0) / (365.25 * DAY_MS); }
  function monthLabel(day) { var d = dateOf(day); return MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); }
  function css(n, f) { var v = getComputedStyle(document.documentElement).getPropertyValue(n); return (v && v.trim()) || f; }
  function setText(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }
  function setHtml(id, h) { var e = document.getElementById(id); if (e) e.innerHTML = h; }
  function fmtX(v) { return isFinite(v) ? v.toFixed(2) + '×' : '—'; }
  function fmtUsd(v) { return '$' + Math.round(v).toLocaleString('en-US'); }
  // Hash rate in the unit that reads best: ZH/s from 1,000 EH/s, EH/s, PH/s, TH/s, GH/s, MH/s.
  function fmtHash(eh) {
    var u = [['ZH/s', 1e3], ['EH/s', 1], ['PH/s', 1e-3], ['TH/s', 1e-6], ['GH/s', 1e-9], ['MH/s', 1e-12]];
    for (var i = 0; i < u.length; i++) if (eh >= u[i][1]) { var v = eh / u[i][1]; return (v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + ' ' + u[i][0]; }
    return (eh / 1e-15).toPrecision(2) + ' kH/s';
  }
  function fmtDays(d) { return d >= 730 ? (d / 365.25).toFixed(1) + ' years' : Math.round(d / 30.44) + ' months'; }

  function fitLogLog(xs, ys) {
    var n = xs.length, sx = 0, sy = 0, sxx = 0, sxy = 0, i, X, Y;
    for (i = 0; i < n; i++) { X = Math.log10(xs[i]); Y = Math.log10(ys[i]); sx += X; sy += Y; sxx += X * X; sxy += X * Y; }
    var b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n, my = sy / n, ssr = 0, sst = 0;
    for (i = 0; i < n; i++) { X = Math.log10(xs[i]); Y = Math.log10(ys[i]); ssr += Math.pow(Y - (a + b * X), 2); sst += Math.pow(Y - my, 2); }
    return { a: a, b: b, r2: 1 - ssr / sst, at: function (x) { return Math.pow(10, a + b * Math.log10(x)); } };
  }
  // Doubling time (days) from the slope of log2(y) on x (days).
  function doublingDays(xs, ys) {
    var n = xs.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (var i = 0; i < n; i++) { var Y = Math.log2(ys[i]); sx += xs[i]; sy += Y; sxx += xs[i] * xs[i]; sxy += xs[i] * Y; }
    return 1 / ((n * sxy - sx * sy) / (n * sxx - sx * sx));
  }
  function corr(a, b) {
    var n = a.length, ma = 0, mb = 0, i; for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
    var c = 0, va = 0, vb = 0; for (i = 0; i < n; i++) { c += (a[i] - ma) * (b[i] - mb); va += Math.pow(a[i] - ma, 2); vb += Math.pow(b[i] - mb, 2); }
    return c / Math.sqrt(va * vb);
  }
  function interpLog(xs, ys, x) {
    if (x <= xs[0]) return ys[0]; if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
    var lo = 0, hi = xs.length - 1;
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (xs[m] <= x) lo = m; else hi = m; }
    var t = (x - xs[lo]) / (xs[hi] - xs[lo]);
    return Math.exp(Math.log(ys[lo]) + t * (Math.log(ys[hi]) - Math.log(ys[lo])));
  }

  // ── the series ──
  var HD = HASH_WEEKLY.map(function (r) { return r[0]; }), HV = HASH_WEEKLY.map(function (r) { return r[1]; });
  var LASTW = HASH_WEEKLY[HASH_WEEKLY.length - 1];
  function sel(fromIso, toIso) {
    var d0 = dayOf(fromIso), d1 = toIso ? dayOf(toIso) : Infinity, xs = [], ys = [];
    for (var i = 0; i < HD.length; i++) if (HD[i] >= d0 && HD[i] < d1) { xs.push(HD[i]); ys.push(HV[i]); }
    return { xs: xs, ys: ys };
  }
  var FITS = STARTS.map(function (s) { var S = sel(s); var f = fitLogLog(S.xs, S.ys); f.from = s; return f; });

  // Rolling four-year exponent, a point every quarter.
  var ROLL = [];
  (function () {
    var y0 = 2010, y1 = dateOf(LASTW[0]).getUTCFullYear() + (dateOf(LASTW[0]).getUTCMonth() / 12);
    for (var end = y0 + WINDOW_YEARS; end <= y1 + 1e-9; end += 0.25) {
      var endDay = (Date.UTC(Math.floor(end), Math.round((end % 1) * 12), 1) - GENESIS_MS) / DAY_MS;
      var startDay = endDay - WINDOW_YEARS * 365.25, xs = [], ys = [];
      for (var i = 0; i < HD.length; i++) if (HD[i] >= startDay && HD[i] < endDay) { xs.push(HD[i]); ys.push(HV[i]); }
      if (xs.length < 150) continue;
      var f = fitLogLog(xs, ys);
      ROLL.push({ end: endDay, b: f.b, r2: f.r2, dbl: doublingDays(xs, ys) });
    }
  })();

  // Price against hash rate.
  var PH = [];
  PL_DATA.forEach(function (s) { if (s[0] >= HD[0] && s[0] <= LASTW[0]) PH.push({ day: s[0], usd: s[1], hash: interpLog(HD, HV, s[0]) }); });
  function priceFit(fromIso) {
    var d0 = dayOf(fromIso), R = PH.filter(function (p) { return p.day >= d0; });
    var f = fitLogLog(R.map(function (p) { return p.hash; }), R.map(function (p) { return p.usd; })); f.from = fromIso; f.rows = R; return f;
  }
  var PF = [priceFit('2011-01-01'), priceFit('2016-01-01')];

  // Which moves first: year-over-year log change, monthly grid from 2013 (so the YoY series starts in 2014).
  var LAG = (function () {
    var start = dayOf('2013-01-01'), end = Math.min(PL_DATA[PL_DATA.length - 1][0], LASTW[0]);
    var PD = PL_DATA.map(function (s) { return s[0]; }), PV = PL_DATA.map(function (s) { return s[1]; });
    var grid = []; for (var d = start; d <= end; d += 30.44) grid.push(d);
    var lp = grid.map(function (d) { return Math.log(interpLog(PD, PV, d)); }), lh = grid.map(function (d) { return Math.log(interpLog(HD, HV, d)); });
    var gp = [], gh = []; for (var i = 12; i < grid.length; i++) { gp.push(lp[i] - lp[i - 12]); gh.push(lh[i] - lh[i - 12]); }
    var out = [];
    for (var lag = -12; lag <= 12; lag++) {
      var a = [], b = [];
      for (var j = 0; j < gp.length; j++) { var k = j + lag; if (k >= 0 && k < gh.length) { a.push(gp[j]); b.push(gh[k]); } }
      out.push({ lag: lag, c: corr(a, b), n: a.length });
    }
    return out;
  })();
  var BEST = LAG.reduce(function (m, r) { return r.c > m.c ? r : m; });

  // ── today ──
  var TODAY = null;
  function computeToday(eh, hSrc, hAsOf, usd, pSrc) {
    var day = (typeof TODAY_DAYS !== 'undefined' && isFinite(TODAY_DAYS)) ? TODAY_DAYS : LASTW[0];
    TODAY = { day: day, eh: eh, hSrc: hSrc, hAsOf: hAsOf, usd: usd, pSrc: pSrc,
      mult: FITS.map(function (f) { return eh / f.at(day); }),
      priceMult: PF.map(function (f) { return usd / f.at(eh); }) };
  }

  // ── readout (enumerated) ──
  function renderReadout() {
    var t = TODAY; if (!t) return;
    setText('hrNow', fmtHash(t.eh));
    var recent = ROLL[ROLL.length - 1], early = ROLL.filter(function (r) { return dateOf(r.end).getUTCFullYear() <= 2017; });
    var earlyDbl = early.length ? early.reduce(function (s, r) { return s + r.dbl; }, 0) / early.length : NaN;
    setText('hrDblNow', fmtDays(recent.dbl));
    setText('hrDblEarly', fmtDays(earlyDbl));
    setText('hrBNow', recent.b.toFixed(1));
    var m = t.mult[0];
    var pos = m < 0.5 ? 'well below the line fitted to the whole record since 2011 (' + fmtX(m) + ')'
      : m < 0.9 ? 'below the line fitted to the whole record since 2011 (' + fmtX(m) + ')'
      : m <= 1.1 ? 'on the line fitted to the whole record since 2011 (' + fmtX(m) + ')'
      : 'above the line fitted to the whole record since 2011 (' + fmtX(m) + ')';
    setHtml('hrVerdict', 'The network is running at about <strong>' + fmtHash(t.eh) + '</strong>, ' + pos +
      ', because the growth has slowed: over the last four years hash rate doubled about every <strong>' + fmtDays(recent.dbl) + '</strong>, against about every ' + fmtDays(earlyDbl) + ' in the four-year windows ending by 2017.');
    var when = new Date(t.hAsOf), whenTxt = MONTHS[when.getUTCMonth()] + ' ' + when.getUTCDate() + ', ' + when.getUTCFullYear();
    setText('hrSource', t.hSrc === 'live' ? 'Mean of the last seven daily estimates from Blockchain.com, to ' + whenTxt + '.' : 'Latest weekly figure in the page’s series (week to ' + whenTxt + '); the live estimate did not load.');
  }

  // ── charts ──
  var charts = {};
  function yearTicks(v) { return Math.round(v) === v ? String(v) : ''; }
  function decadeTick(fmt) { return function (v) { var l = Math.log10(v); return Math.abs(l - Math.round(l)) < 1e-6 ? fmt(v) : ''; }; }
  function base(yTitle, yTick, xMin) {
    var grid = css('--hr-grid', 'rgba(255,255,255,.05)'), muted = css('--text-muted', '#706860'), dim = css('--text-dim', '#908880');
    return {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        legend: { position: 'top', align: 'start', labels: { color: dim, font: { family: 'Inter', size: 11 }, usePointStyle: true, pointStyle: 'line', boxWidth: 22, padding: 12,
          filter: function (it, data) { return !data.datasets[it.datasetIndex].hideInLegend; } } },
        tooltip: { backgroundColor: css('--hr-tip-bg', 'rgba(20,17,13,.95)'), borderColor: css('--hr-tip-border', 'rgba(224,148,34,.3)'), borderWidth: 1,
          titleColor: css('--text-bright', '#f2eee8'), bodyColor: css('--text', '#d8d2ca'), padding: 10 }
      },
      scales: {
        x: { type: 'linear', min: xMin, ticks: { color: muted, font: { size: 10 }, callback: yearTicks, autoSkip: false, maxRotation: 0 }, grid: { color: grid },
             afterBuildTicks: function (sc) { var step = (sc.chart.width || 800) < 520 ? 3 : 2, t = []; for (var y = Math.ceil(sc.min); y <= Math.floor(sc.max); y += step) t.push({ value: y }); sc.ticks = t; } },
        y: { type: 'logarithmic', title: { display: true, text: yTitle, color: muted, font: { size: 10 } }, ticks: { color: muted, font: { size: 10 }, callback: yTick }, grid: { color: grid } }
      }
    };
  }

  // The glowing "you are here" marker (STYLE_GUIDE §6.23); pulses only on a live reading.
  function pulseFor(id, getXY, live) {
    return { id: 'hrPulse' + id, afterRender: function (chart) {
      var el = document.getElementById(id), p = getXY(); if (!el || !p) return;
      var x = chart.scales.x.getPixelForValue(p.x), y = chart.scales.y.getPixelForValue(p.y);
      if (!isFinite(x) || !isFinite(y)) return;
      el.style.left = x + 'px'; el.style.top = y + 'px'; el.classList.add('is-visible'); el.classList.toggle('is-static', !live());
    } };
  }

  function renderHashChart() {
    var cv = document.getElementById('hrHashChart'); if (!cv || typeof Chart === 'undefined') return;
    var x0 = 2010.5, endDay = Math.max(LASTW[0], TODAY ? TODAY.day : 0);
    var pts = []; for (var i = 0; i < HD.length; i++) if (yearFrac(HD[i]) >= x0) pts.push({ x: yearFrac(HD[i]), y: HV[i], day: HD[i] });
    var colors = [css('--hr-fit-a', '#8fb3c9'), css('--hr-fit-b', '#d4a843'), css('--hr-fit-c', '#b07ad9')];
    var ds = [{ label: 'Hash rate (weekly mean)', data: pts, borderColor: css('--hr-hash', '#F7931A'), borderWidth: 1.6, pointRadius: 0 }];
    FITS.forEach(function (f, k) {
      var d0 = dayOf(f.from), line = [];
      for (var d = d0; d <= endDay + 1; d += 15) line.push({ x: yearFrac(d), y: f.at(d) });
      ds.push({ label: 'Fit from ' + f.from.slice(0, 4) + ' (exponent ' + f.b.toFixed(1) + ')', data: line, borderColor: colors[k], borderWidth: 1.4, borderDash: [6, 4], pointRadius: 0 });
    });
    if (TODAY) ds.push({ label: 'Today', data: [{ x: yearFrac(TODAY.day), y: TODAY.eh, today: true }], type: 'scatter', pointRadius: 0, pointHoverRadius: 6, pointHitRadius: 10, hideInLegend: true });
    var opt = base('Hash rate (log scale)', decadeTick(function (v) { return fmtHash(v).replace(/^(\d+)\.0+ /, '$1 '); }), x0);
    opt.scales.x.max = yearFrac(endDay) + 0.3;
    opt.plugins.tooltip.filter = function (it) { return it.datasetIndex === 0 || it.dataset.label === 'Today'; };
    opt.plugins.tooltip.callbacks = {
      title: function (it) { var p = it[0].raw; return p.today ? 'Today' : 'Week of ' + monthLabel(p.day); },
      label: function (it) {
        var p = it.raw, eh = p.today ? TODAY.eh : p.y, d = p.today ? TODAY.day : p.day;
        var lines = ['Hash rate: ' + fmtHash(eh)];
        FITS.forEach(function (f) { if (d >= dayOf(f.from)) lines.push(fmtX(eh / f.at(d)) + ' the fit from ' + f.from.slice(0, 4)); });
        return lines;
      }
    };
    if (charts.hash) charts.hash.destroy();
    charts.hash = new Chart(cv, { type: 'line', data: { datasets: ds }, options: opt,
      plugins: [pulseFor('hrPulse', function () { return TODAY && { x: yearFrac(TODAY.day), y: TODAY.eh }; }, function () { return TODAY && TODAY.hSrc === 'live'; })] });
  }

  function renderRollChart() {
    var cv = document.getElementById('hrRollChart'); if (!cv || typeof Chart === 'undefined') return;
    var pts = ROLL.map(function (r) { return { x: yearFrac(r.end), y: r.b, r: r }; });
    var opt = base('Exponent of the four years to that date', function (v) { return v; }, Math.floor(pts[0].x));
    opt.scales.y.type = 'linear'; opt.scales.y.min = 0;
    opt.scales.y.ticks.callback = function (v) { return Number.isInteger(v) && v % 2 === 0 ? String(v) : ''; };
    opt.scales.x.max = pts[pts.length - 1].x + 0.3;
    opt.plugins.tooltip.callbacks = {
      title: function (it) { var r = it[0].raw.r; return 'Four years to ' + monthLabel(r.end); },
      label: function (it) { var r = it.raw.r; return ['Exponent ' + r.b.toFixed(1) + ' (R² ' + r.r2.toFixed(2) + ')', 'Doubled about every ' + fmtDays(r.dbl)]; }
    };
    if (charts.roll) charts.roll.destroy();
    charts.roll = new Chart(cv, { type: 'line', data: { datasets: [{ label: 'Hash-rate exponent, rolling four-year fit', data: pts, borderColor: css('--hr-hash', '#F7931A'), backgroundColor: css('--hr-hash-soft', 'rgba(247,147,26,.12)'), fill: true, borderWidth: 1.8, pointRadius: 0, tension: 0.2 }] }, options: opt });
  }

  function renderPriceChart() {
    var cv = document.getElementById('hrPriceChart'); if (!cv || typeof Chart === 'undefined') return;
    var pts = PH.filter(function (p) { return p.day >= dayOf('2011-01-01'); }).map(function (p) { return { x: p.hash, y: p.usd, p: p }; });
    var xs = pts.map(function (p) { return p.x; }), lo = Math.min.apply(null, xs), hi = Math.max.apply(null, xs.concat(TODAY ? [TODAY.eh] : []));
    var colors = [css('--hr-fit-a', '#8fb3c9'), css('--hr-fit-b', '#d4a843')];
    var ds = [{ label: 'Monthly samples since 2011', data: pts, type: 'scatter', pointRadius: 2, pointHoverRadius: 4, backgroundColor: css('--hr-dot', 'rgba(247,147,26,.55)'), borderWidth: 0 }];
    PF.forEach(function (f, k) {
      var a = Math.max(lo, f.from === '2011-01-01' ? lo : interpLog(HD, HV, dayOf(f.from))), line = [];
      for (var l = Math.log10(a); l <= Math.log10(hi) + 0.01; l += 0.05) line.push({ x: Math.pow(10, l), y: f.at(Math.pow(10, l)) });
      ds.push({ label: 'Fit from ' + f.from.slice(0, 4) + ': price ∝ hash^' + f.b.toFixed(2), data: line, type: 'line', borderColor: colors[k], borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0 });
    });
    if (TODAY) ds.push({ label: 'Today', data: [{ x: TODAY.eh, y: TODAY.usd, today: true }], type: 'scatter', pointRadius: 0, pointHoverRadius: 6, pointHitRadius: 10, hideInLegend: true });
    var opt = base('Bitcoin price, USD (log scale)', decadeTick(function (v) { return '$' + v.toLocaleString('en-US'); }), lo);
    opt.interaction = { mode: 'nearest', intersect: true };
    opt.scales.x = { type: 'logarithmic', min: lo, max: hi * 1.6, title: { display: true, text: 'Hash rate (log scale)', color: css('--text-muted', '#706860'), font: { size: 10 } },
      ticks: { color: css('--text-muted', '#706860'), font: { size: 10 }, callback: decadeTick(function (v) { return fmtHash(v).replace(/^(\d+)\.0+ /, '$1 '); }), maxRotation: 0 }, grid: { color: css('--hr-grid', 'rgba(255,255,255,.05)') } };
    opt.plugins.tooltip.filter = function (it) { return it.datasetIndex === 0 || it.dataset.label === 'Today'; };
    opt.plugins.tooltip.callbacks = {
      title: function (it) { var r = it[0].raw; return r.today ? 'Today' : monthLabel(r.p.day); },
      label: function (it) {
        var r = it.raw, eh = r.today ? TODAY.eh : r.p.hash, usd = r.today ? TODAY.usd : r.p.usd;
        return ['Bitcoin ' + fmtUsd(usd) + ' · hash rate ' + fmtHash(eh), fmtX(usd / PF[0].at(eh)) + ' the price the 2011 fit gives that hash rate'];
      }
    };
    if (charts.price) charts.price.destroy();
    charts.price = new Chart(cv, { type: 'scatter', data: { datasets: ds }, options: opt,
      plugins: [pulseFor('hrPricePulse', function () { return TODAY && { x: TODAY.eh, y: TODAY.usd }; }, function () { return TODAY && TODAY.hSrc === 'live' && TODAY.pSrc === 'live'; })] });
  }

  function renderLagChart() {
    var cv = document.getElementById('hrLagChart'); if (!cv || typeof Chart === 'undefined') return;
    var hi = css('--hr-hash', '#F7931A'), lo = css('--hr-bar', 'rgba(143,179,201,.55)');
    var opt = base('Correlation', function (v) { return v; }, -12);
    opt.scales.x = { type: 'category', ticks: { color: css('--text-muted', '#706860'), font: { size: 10 }, autoSkip: false, maxRotation: 0, callback: function (v, i) { var l = LAG[i].lag; return l % 3 === 0 ? (l > 0 ? '+' + l : String(l)) : ''; } },
      title: { display: true, text: 'Months that price growth leads hash-rate growth (negative: hash rate leads)', color: css('--text-muted', '#706860'), font: { size: 10 } }, grid: { display: false } };
    opt.scales.y = { type: 'linear', min: -0.6, max: 0.8, ticks: { color: css('--text-muted', '#706860'), font: { size: 10 }, stepSize: 0.2, callback: function (v) { return v.toFixed(1); } }, grid: { color: css('--hr-grid', 'rgba(255,255,255,.05)') } };
    opt.plugins.legend = { display: false };
    opt.interaction = { mode: 'index', intersect: false };
    opt.plugins.tooltip.callbacks = {
      title: function (it) { var l = LAG[it[0].dataIndex].lag; return l === 0 ? 'Same month' : l > 0 ? 'Price growth ' + l + ' month' + (l > 1 ? 's' : '') + ' earlier' : 'Hash-rate growth ' + (-l) + ' month' + (l < -1 ? 's' : '') + ' earlier'; },
      label: function (it) { return 'Correlation ' + LAG[it.dataIndex].c.toFixed(2); }
    };
    if (charts.lag) charts.lag.destroy();
    charts.lag = new Chart(cv, { type: 'bar', data: { labels: LAG.map(function (r) { return r.lag; }), datasets: [{ data: LAG.map(function (r) { return r.c; }), backgroundColor: LAG.map(function (r) { return r.lag === BEST.lag ? hi : lo; }), borderWidth: 0 }] }, options: opt });
  }

  // ── tables and readings ──
  function renderFitTable() {
    var body = document.getElementById('hrFitBody'); if (!body) return;
    var day = TODAY ? TODAY.day : LASTW[0], eh = TODAY ? TODAY.eh : LASTW[1];
    body.innerHTML = FITS.map(function (f) {
      var dbl = day * (Math.pow(2, 1 / f.b) - 1);
      return '<tr><td>From ' + f.from.slice(0, 4) + '</td><td class="num">' + f.b.toFixed(2) + '</td><td class="num">' + f.r2.toFixed(2) + '</td><td class="num">' + fmtDays(dbl) + '</td><td class="num">' + fmtX(eh / f.at(day)) + '</td></tr>';
    }).join('');
    var peak = ROLL.reduce(function (m, r) { return r.b > m.b ? r : m; }), last = ROLL[ROLL.length - 1];
    var lowest = ROLL.filter(function (r) { return dateOf(r.end).getUTCFullYear() >= 2018; }).reduce(function (m, r) { return r.b < m.b ? r : m; });
    setText('hrFitRead', 'Each later start gives a smaller exponent: ' + FITS.map(function (f) { return f.b.toFixed(1) + ' from ' + f.from.slice(0, 4); }).join(', ') +
      '. A single power law would give the same exponent from any start. Over rolling four-year windows the exponent peaked at ' + peak.b.toFixed(1) + ' (the four years to ' + monthLabel(peak.end) + '), fell as low as ' + lowest.b.toFixed(1) + ' (to ' + monthLabel(lowest.end) + ') and stands at ' + last.b.toFixed(1) + ' now' +
      (last.b > lowest.b * 1.15 ? ', a little up from that low.' : '.'));
  }
  function renderPriceRead() {
    var f0 = PF[0], f1 = PF[1], t = TODAY;
    var x3 = Math.pow(10, f0.b);
    var pos = !t ? '' : (function () {
      var m = t.priceMult[0];
      return ' Today’s price is ' + fmtX(m) + ' what the 2011 fit gives for today’s hash rate' + (m > 1.2 ? ': price is ahead of hash rate.' : m < 0.83 ? ': price is behind hash rate.' : ', about on the line.');
    })();
    setText('hrPriceRead', 'Since 2011, price has risen about as the ' + (Math.abs(f0.b - 0.5) < 0.08 ? 'square root' : f0.b.toFixed(2) + ' power') + ' of hash rate (exponent ' + f0.b.toFixed(2) + ', R² ' + f0.r2.toFixed(2) + '): each tenfold rise in hash rate has come with about a ' + x3.toFixed(1) + '-fold rise in price. From 2016 the exponent is ' + f1.b.toFixed(2) + ' (R² ' + f1.r2.toFixed(2) + '), so this relationship moves with the start year too.' + pos);
  }
  function renderLagRead() {
    var at0 = LAG.filter(function (r) { return r.lag === 0; })[0], neg = LAG.filter(function (r) { return r.lag < 0; }).reduce(function (m, r) { return r.c > m.c ? r : m; });
    var txt = BEST.lag > 0
      ? 'The strongest match comes when price growth is set ' + BEST.lag + ' month' + (BEST.lag > 1 ? 's' : '') + ' ahead of hash-rate growth (correlation ' + BEST.c.toFixed(2) + ', against ' + at0.c.toFixed(2) + ' in the same month). Set the other way round, with hash-rate growth first, the best is ' + neg.c.toFixed(2) + '. Price moves first and hash rate follows.'
      : BEST.lag < 0 ? 'The strongest match comes when hash-rate growth is set ' + (-BEST.lag) + ' months ahead of price growth (correlation ' + BEST.c.toFixed(2) + '): on this record, hash rate moves first.'
      : 'The strongest match is in the same month (correlation ' + BEST.c.toFixed(2) + '): neither moves clearly first.';
    setText('hrLagRead', txt);
  }

  function renderAll() { renderReadout(); renderHashChart(); renderRollChart(); renderFitTable(); renderPriceChart(); renderPriceRead(); renderLagChart(); renderLagRead(); }

  window.hrQA = function () {
    return { weeks: HASH_WEEKLY.length, fits: FITS.map(function (f) { return { from: f.from, b: f.b, r2: f.r2 }; }), roll: { first: ROLL[0], last: ROLL[ROLL.length - 1], n: ROLL.length },
             price: PF.map(function (f) { return { from: f.from, b: f.b, r2: f.r2 }; }), lag: { best: BEST, all: LAG.map(function (r) { return [r.lag, +r.c.toFixed(3)]; }) }, today: TODAY };
  };

  function init() {
    computeToday(LASTW[1], 'fallback', GENESIS_MS + LASTW[0] * DAY_MS, PL_DATA[PL_DATA.length - 1][1], 'fallback');
    renderAll();
    var h = null, p = null;
    function both() { if (h && p) { computeToday(h.v, h.s, h.a, p.v, p.s); renderAll(); } }
    if (typeof fetchHashRate === 'function') fetchHashRate(function (v, s, a) { h = { v: v, s: s, a: a }; both(); }); else h = { v: LASTW[1], s: 'fallback', a: GENESIS_MS + LASTW[0] * DAY_MS };
    if (typeof fetchTodayPrice === 'function') fetchTodayPrice(function (v, s) { p = { v: v, s: s }; both(); }); else p = { v: PL_DATA[PL_DATA.length - 1][1], s: 'fallback' };
    both();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
