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
     on log10(days since the genesis block), from FIT_FROM, re-fitted at
     every load. FIT_FROM is the reader's choice of start year (2011 by
     default; 2013, 2016 or 2020; ?from=YYYY), added 2026-10-20 after a
     reader showed how much the reading moves with the start. Every
     figure built on the fit follows it. It is this page's fit, not the site's
     dollar reference model (a = 1.6e-17, b = 5.77).
   - The dollar line it is compared with is fitted the same way over
     the same months, so the two are like for like.
   - "The usual range" is the 5th to 95th percentile of the monthly
     multiples since FIT_FROM: 90% of months have sat inside it.
   - "Did an early fit predict today?" (2026-10-20): the Power Law page's
     out-of-sample test, run in both units. Each fit starts at the first
     sample (mid-2010, as on The Power Law) and stops at a cutoff (end of
     2014 / 2016 / 2017 / 2020 / 2023; ?fit=YYYY-12); its line, carried
     to today, is compared with the line fitted to every sample. This is
     a different question from the start-year buttons, and the section
     says so. Independent of START_YEAR.
   - Gold's side of the gap: the dollar fit divided by the gold fit is
     a dollar trend for gold implied by the two (not a model of gold).
     Bitcoin's gold multiple = its dollar multiple ÷ gold's multiple of
     that implied trend, exactly.
   - Today: the live bitcoin price (fetchTodayPrice) over today's gold
     price (fetchGoldPrice); either falls back to its latest sample,
     and the readout names which.

   Console: window.gbQA() returns the fits and today's reading.
   ============================================================= */
(function () {
  if (typeof PL_DATA === 'undefined' || typeof GOLD_MONTHLY === 'undefined') return;

  var START_YEARS = [2011, 2013, 2016, 2020];
  var START_YEAR = 2011;
  (function () {
    var q = /[?&]from=(\d{4})/.exec(location.search || '');
    if (q && START_YEARS.indexOf(+q[1]) >= 0) START_YEAR = +q[1];
  })();
  var FIT_FROM = START_YEAR + '-01-01';
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
  function rowsFrom(iso) { var d0 = dayOf(iso); return ROWS.filter(function (r) { return r.day >= d0; }); }
  function fitsFrom(iso) {
    var R = rowsFrom(iso), xs = R.map(function (r) { return r.day; });
    return { rows: R, gold: fitLogLog(xs, R.map(function (r) { return r.oz; })), usd: fitLogLog(xs, R.map(function (r) { return r.usd; })) };
  }
  // The fit and everything derived from it, for the chosen start year.
  var FROM_DAY, MAIN, FIT_ROWS, SORTED_G, SORTED_U, BAND_LO, BAND_HI;
  function applyStart(year) {
    START_YEAR = year; FIT_FROM = year + '-01-01'; FROM_DAY = dayOf(FIT_FROM);
    MAIN = fitsFrom(FIT_FROM);
    // Copies, so each start's multiples never leak into another's.
    FIT_ROWS = MAIN.rows.map(function (r) { return { day: r.day, usd: r.usd, gold: r.gold, oz: r.oz, key: r.key, mg: r.oz / MAIN.gold.at(r.day), mu: r.usd / MAIN.usd.at(r.day) }; });
    SORTED_G = FIT_ROWS.map(function (r) { return r.mg; }).sort(function (a, b) { return a - b; });
    SORTED_U = FIT_ROWS.map(function (r) { return r.mu; }).sort(function (a, b) { return a - b; });
    BAND_LO = quantile(SORTED_G, 0.05); BAND_HI = quantile(SORTED_G, 0.95);
  }
  applyStart(START_YEAR);
  function rankBelow(sorted, v) { var n = 0; for (var i = 0; i < sorted.length; i++) if (sorted[i] < v) n++; return n / sorted.length; }
  var LAST = ROWS[ROWS.length - 1];

  // Today's reading; filled from the latest sample, then from the live prices.
  // The dollar multiple above comes from this page's own fit (monthly, from the start year,
  // refitted on load) so gold and dollars are compared like for like. The site's
  // reference model (The Power Law, fixed a and b) gives a different dollar
  // multiple; name it, so the two figures are never read as a contradiction.
  function refNote(t) {
    if (typeof plPrice !== 'function') return '';
    var ref = t.btcUsd / plPrice(t.day);
    if (!isFinite(ref) || ref <= 0) return '';
    return ' The <a href="/the-power-law">site\u2019s reference model</a>, a separate fixed fit, puts it at <strong>' + fmtX(ref) + '</strong> its dollar trend; this page refits dollars the same way as gold so the two compare like for like.';
  }

  var TODAY = null, TODAY_IN = null;
  function computeToday(btcUsd, btcSrc, goldUsd, goldSrc, goldLabel) {
    TODAY_IN = [btcUsd, btcSrc, goldUsd, goldSrc, goldLabel];
    var day = (typeof TODAY_DAYS !== 'undefined' && isFinite(TODAY_DAYS)) ? TODAY_DAYS : LAST.day;
    var oz = btcUsd / goldUsd, trend = MAIN.gold.at(day), mg = oz / trend, mu = btcUsd / MAIN.usd.at(day);
    // Gold's side: the dollar trend for gold the two fits imply (usd ÷ oz).
    var goldTrendUsd = MAIN.usd.at(day) / trend;
    TODAY = { day: day, btcUsd: btcUsd, btcSrc: btcSrc, goldUsd: goldUsd, goldSrc: goldSrc, goldLabel: goldLabel,
              oz: oz, trendOz: trend, mg: mg, mu: mu, rankG: rankBelow(SORTED_G, mg), rankU: rankBelow(SORTED_U, mu),
              goldTrendUsd: goldTrendUsd, gm: goldUsd / goldTrendUsd };
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
  function zoneText(z) {
    return { below: 'below the range that has held 90% of months since ' + START_YEAR,
             low: 'in the lower part of its usual range',
             near: 'close to its gold trend',
             high: 'in the upper part of its usual range',
             above: 'above the range that has held 90% of months since ' + START_YEAR }[z];
  }
  function rankSentence(r) {
    // r = share of months since the start year with a LOWER multiple than today.
    if (r < 0.5) return 'Only ' + pct(r) + ' of months since ' + START_YEAR + ' sat lower against the gold trend.';
    return pct(r) + ' of months since ' + START_YEAR + ' sat lower against the gold trend.';
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
    setHtml('gbVerdict', 'Bitcoin sits at <strong>' + fmtX(t.mg) + '</strong> its gold trend, ' + zoneText(z) + '. ' + rankSentence(t.rankG) +
      ' In dollars, against the same kind of fit, it sits at <strong>' + fmtX(t.mu) + '</strong>' +
      ', with ' + pct(t.rankU) + ' of months lower.' + refNote(t));
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
        x: { type: 'linear', min: START_YEAR, ticks: { color: muted, font: { size: 10 }, callback: yearTicks, autoSkip: false, maxRotation: 0 }, grid: { color: grid },
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

  // Tooltip lines for a month (or today) on either chart.
  function tipLines(p) {
    if (p.today && TODAY) {
      return ['Bitcoin: ' + fmtOz(TODAY.oz) + ' oz of gold',
              fmtUsd(TODAY.btcUsd) + ' a bitcoin \u00b7 ' + fmtUsd(TODAY.goldUsd) + ' an ounce',
              fmtX(TODAY.mg) + ' the gold trend (' + fmtOz(TODAY.trendOz) + ' oz)',
              fmtX(TODAY.mu) + ' the dollar trend'];
    }
    var r = p.row; if (!r) return '';
    return ['Bitcoin: ' + fmtOz(r.oz) + ' oz of gold',
            fmtUsd(r.usd) + ' a bitcoin \u00b7 ' + fmtUsd(r.gold) + ' an ounce (month avg.)',
            fmtX(r.mg) + ' the gold trend (' + fmtOz(MAIN.gold.at(r.day)) + ' oz)',
            fmtX(r.mu) + ' the dollar trend'];
  }

  // The glowing "you are here" marker (STYLE_GUIDE §6.23, lcs-pulse-halo).
  // Honesty binding: it pulses only when both today's prices are live; on
  // either fallback it is a still dot.
  var pulsePlugin = {
    id: 'gbPulse',
    afterRender: function (chart) {
      var el = document.getElementById('gbPulse'); if (!el || !TODAY) return;
      var x = chart.scales.x.getPixelForValue(yearFrac(TODAY.day)), y = chart.scales.y.getPixelForValue(TODAY.oz);
      if (!isFinite(x) || !isFinite(y)) return;
      el.style.left = x + 'px'; el.style.top = y + 'px';
      el.classList.add('is-visible');
      el.classList.toggle('is-static', !(TODAY.btcSrc === 'live' && TODAY.goldSrc === 'live'));
    }
  };

  function renderOzChart() {
    var cv = document.getElementById('gbOzChart'); if (!cv || typeof Chart === 'undefined') return;
    var pts = FIT_ROWS.map(function (r) { return { x: yearFrac(r.day), y: r.oz, day: r.day, row: r }; });
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
    // Today: an invisible hover target (the glowing marker is the pulse below).
    if (TODAY) ds.push({ label: 'Today', data: [{ x: yearFrac(TODAY.day), y: TODAY.oz, today: true }], type: 'scatter', pointRadius: 0, pointHoverRadius: 6, pointHitRadius: 10, backgroundColor: now, borderColor: btc, borderWidth: 2, hideInLegend: true });
    var opt = baseOptions('Ounces of gold per bitcoin (log scale)', ozTick);
    opt.scales.x.max = yearFrac(endDay) + 0.3;
    opt.plugins.tooltip.callbacks = {
      title: function (it) { var p = it[0].raw; return p.today ? 'Today' : (p.day != null ? monthLabel(p.day) : ''); },
      // The month's reading in full: ounces, the two prices behind it, and its
      // place against the gold trend (JM, 2026-10-18).
      label: function (it) { return tipLines(it.raw); }
    };
    opt.plugins.tooltip.filter = function (it) { return it.datasetIndex === 0 || it.dataset.label === 'Today'; };
    if (charts.oz) charts.oz.destroy();
    charts.oz = new Chart(cv, { type: 'line', data: { datasets: ds }, options: opt, plugins: [pulsePlugin] });
  }

  function renderMultChart() {
    var cv = document.getElementById('gbMultChart'); if (!cv || typeof Chart === 'undefined') return;
    var g = FIT_ROWS.map(function (r) { return { x: yearFrac(r.day), y: r.mg, day: r.day, row: r }; });
    var u = FIT_ROWS.map(function (r) { return { x: yearFrac(r.day), y: r.mu, day: r.day, row: r }; });
    var endDay = Math.max(LAST.day, TODAY ? TODAY.day : 0);
    var one = [{ x: START_YEAR, y: 1 }, { x: yearFrac(endDay) + 0.3, y: 1 }];
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
      label: function (it) { return it.dataset.label + ': ' + fmtX(it.parsed.y); },
      afterBody: function (it) {
        var p = it[0] && it[0].raw;
        if (p && p.row) return [fmtOz(p.row.oz) + ' oz \u00b7 ' + fmtUsd(p.row.usd) + ' a bitcoin \u00b7 ' + fmtUsd(p.row.gold) + ' an ounce'];
        if (TODAY && p && p.day == null) return [fmtOz(TODAY.oz) + ' oz \u00b7 ' + fmtUsd(TODAY.btcUsd) + ' a bitcoin \u00b7 ' + fmtUsd(TODAY.goldUsd) + ' an ounce'];
        return [];
      }
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
    var html = '', deepestPriorG = Infinity, deepestPriorU = Infinity, cur = null, firstYear = null;
    LOWS.forEach(function (w, i) {
      var g = lowIn(w.from, w.to, 'mg'), u = lowIn(w.from, w.to, 'mu');
      if (!g || !u) return;
      if (firstYear == null && w.to) firstYear = dateOf(Math.min(g.day, u.day)).getUTCFullYear();
      var open = !w.to;
      if (!open) { deepestPriorG = Math.min(deepestPriorG, g.mg); deepestPriorU = Math.min(deepestPriorU, u.mu); }
      else cur = { g: g, u: u };
      html += '<tr' + (open ? ' class="gb-row-now"' : '') + '><td>' + w.label + (open ? ' <span class="gb-open">still open</span>' : '') + '</td>' +
        '<td class="num"><strong>' + fmtX(g.mg) + '</strong> <span class="gb-when">' + monthLabel(g.day) + '</span></td>' +
        '<td class="num"><strong>' + fmtX(u.mu) + '</strong> <span class="gb-when">' + monthLabel(u.day) + '</span></td></tr>';
    });
    body.innerHTML = html;
    if (cur && deepestPriorG < Infinity) {
      var since = 'since ' + firstYear;
      var gr = cur.g.mg / deepestPriorG, ur = cur.u.mu / deepestPriorU;
      var gTxt = gr < 0.9 ? 'In gold, this bear market has gone well below every low ' + since + ': ' + fmtX(cur.g.mg) + ', against ' + fmtX(deepestPriorG) + ' at the deepest of them.'
        : gr <= 1.1 ? 'In gold, this bear market has reached about the depth of the deepest low ' + since + ' (' + fmtX(cur.g.mg) + ' against ' + fmtX(deepestPriorG) + ').'
        : 'In gold, this bear market has stayed above the lows ' + since + ' (' + fmtX(cur.g.mg) + ', against ' + fmtX(deepestPriorG) + ' at the deepest).';
      var shallowU = Math.max.apply(null, LOWS.slice(0, 4).map(function (w) { var r = lowIn(w.from, w.to, 'mu'); return r ? r.mu : 0; }));
      var uTxt = cur.u.mu < deepestPriorU * 0.9 ? 'In dollars it has gone deeper than any of them too (' + fmtX(cur.u.mu) + ' against ' + fmtX(deepestPriorU) + ').'
        : cur.u.mu <= shallowU ? 'In dollars it looks like an ordinary bear market: ' + fmtX(cur.u.mu) + ', inside the range of the earlier lows (' + fmtX(deepestPriorU) + ' to ' + fmtX(shallowU) + ').'
        : 'In dollars it has stayed shallower than all of them (' + fmtX(cur.u.mu) + ', against ' + fmtX(shallowU) + ' at the shallowest).';
      setText('gbLowsRead', gTxt + ' ' + uTxt);
    } else setText('gbLowsRead', '');
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
      : 'pushed bitcoin\u2019s gold price further below its trend than at any time since this fit begins, in ' + START_YEAR;
    var uLows = LOWS.slice(0, 4).map(function (w) { var r = lowIn(w.from, w.to, 'mu'); return r ? r.mu : null; }).filter(function (v) { return v != null; });
    var uCur = lowIn('2025-10-06', null, 'mu'), uMin = uLows.length ? Math.min.apply(null, uLows) : Infinity;
    var uMax = uLows.length ? Math.max.apply(null, uLows) : -Infinity;
    var usdPart = (!uCur || !uLows.length) ? '' : uCur.mu > uMax
      ? 'So the gap between the two lines is not bitcoin doing something unusual: in dollars, this bear market\u2019s low (' + fmtX(uCur.mu) + ') is shallower than the earlier ones. '
      : uCur.mu >= uMin * 0.9
      ? 'So the gap between the two lines is mostly not bitcoin doing something unusual: in dollars, this bear market\u2019s low (' + fmtX(uCur.mu) + ') sits among the earlier ones. '
      : 'In dollars, too, this bear market has gone deeper than the earlier ones (' + fmtX(uCur.mu) + ' against ' + fmtX(uMin) + '), so the gap between the lines is gold\u2019s run on top of an unusually deep fall. ';
    setText('gbPartedRead', usdPart + 'What stands out is the timing: the fall came during gold\u2019s run, and the two together have ' + depth + '.');
  }

  // ── §5 how sturdy: the fit from three start years ──
  var STARTS = START_YEARS.map(function (y) { return y + '-01-01'; });
  function renderSturdy() {
    var body = document.getElementById('gbSturdyBody'); if (!body) return;
    var html = '', bs = [], todays = [];
    STARTS.forEach(function (s) {
      var F = fitsFrom(s), day = TODAY ? TODAY.day : LAST.day;
      var mg = TODAY ? TODAY.oz / F.gold.at(day) : LAST.oz / F.gold.at(LAST.day);
      var mu = TODAY ? TODAY.btcUsd / F.usd.at(day) : LAST.usd / F.usd.at(LAST.day);
      bs.push(F); todays.push(mg);
      html += '<tr' + (+s.slice(0, 4) === START_YEAR ? ' class="gb-row-now"' : '') + '><td>From ' + s.slice(0, 4) + '</td>' +
        '<td class="num">' + F.gold.b.toFixed(2) + '</td><td class="num">' + F.gold.r2.toFixed(2) + '</td><td class="num">' + fmtX(mg) + '</td>' +
        '<td class="num">' + F.usd.b.toFixed(2) + '</td><td class="num">' + F.usd.r2.toFixed(2) + '</td><td class="num">' + fmtX(mu) + '</td></tr>';
    });
    body.innerHTML = html;
    var weakest = 0; bs.forEach(function (F, i) { if (F.gold.r2 < bs[weakest].gold.r2) weakest = i; });
    var weakTxt = 'its fit explains least of the record from ' + STARTS[weakest].slice(0, 4) + ' (R\u00b2 ' + bs[weakest].gold.r2.toFixed(2) + ').';
    var gSpread = Math.max.apply(null, bs.map(function (F) { return F.gold.b; })) - Math.min.apply(null, bs.map(function (F) { return F.gold.b; }));
    var uSpread = Math.max.apply(null, bs.map(function (F) { return F.usd.b; })) - Math.min.apply(null, bs.map(function (F) { return F.usd.b; }));
    setText('gbSturdyRead', gSpread > uSpread * 1.5
      ? 'The gold trend moves more with the starting year than the dollar trend does: its exponent spans ' + gSpread.toFixed(2) + ' across these four starts, against ' + uSpread.toFixed(2) + ' in dollars, and ' + weakTxt +
        (todays.every(function (m) { return m < 0.75; }) ? ' Bitcoin reads low against gold whichever start you pick, but how low depends on the choice more than it does in dollars.' : ' Where bitcoin reads against gold today depends on that choice more than it does in dollars.')
      : 'The gold trend holds about as steady as the dollar trend across these four starts (exponents spanning ' + gSpread.toFixed(2) + ' in gold and ' + uSpread.toFixed(2) + ' in dollars).');
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
    if (!runs.length) txt = 'No earlier stretch since ' + START_YEAR + ' went below the usual range in gold. This is the first.';
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
    setText('gbFitFromLabel', 'January ' + START_YEAR);
    // The chosen start's fit quality, said plainly; a loose fit is flagged.
    setText('gbStartsFit', 'From ' + START_YEAR + ', the gold fit uses ' + FIT_ROWS.length + ' monthly samples and explains ' + Math.round(MAIN.gold.r2 * 100) + '% of their variation (R\u00b2 ' + MAIN.gold.r2.toFixed(2) + '; in dollars ' + MAIN.usd.r2.toFixed(2) + ').' +
      (MAIN.gold.r2 < 0.7 ? ' That is a loose fit: a few years of prices are mostly one cycle, so read the figures below loosely.' : ''));
    setText('gbKickerFrom', String(START_YEAR));
    setText('gbLastSample', monthLabel(LAST.day));
    setText('gbGoldLastKey', keyLabel(GOLD_MONTHLY[GOLD_MONTHLY.length - 1][0]));
  }

  // The "two readings" paragraph is about a deep low against gold; it shows
  // only while bitcoin is in the lower part of its range (STYLE_GUIDE §12).
  function renderTwoReadings() {
    var el = document.getElementById('gbTwoReadings'); if (!el || !TODAY) return;
    el.hidden = !(TODAY.mg < 0.75);
  }

  // ── §1b gold's side of the gap (prompted by a reader on X, 2026-10-20) ──
  function renderGap() {
    var t = TODAY; if (!t) return;
    setText('gbGapUsd', fmtX(t.mu));
    setText('gbGapGold', fmtX(t.gm));
    setText('gbGapGoldTrend', fmtUsd(t.goldTrendUsd));
    setText('gbGapGoldNow', fmtUsd(t.goldUsd));
    setText('gbGapResult', fmtX(t.mg));
    var lead = 'Bitcoin\u2019s ' + fmtX(t.mg) + ' against its gold trend is its ' + fmtX(t.mu) + ' against its dollar trend divided by gold\u2019s ' + fmtX(t.gm) + ' against the dollar trend the two fits imply for it (' + fmtUsd(t.goldTrendUsd) + ' an ounce; gold is at ' + fmtUsd(t.goldUsd) + '). ';
    var read;
    // Enumerated on which side is away from trend (STYLE_GUIDE §12).
    if (t.mu < 1 && t.gm > 1) read = 'Both sides contribute: bitcoin is below its dollar trend and gold is above the trend implied for it' + (t.gm > 1 / t.mu ? ', and gold\u2019s side is the larger.' : ', and bitcoin\u2019s side is the larger.');
    else if (t.mu >= 1 && t.gm > 1) read = 'The gap is gold\u2019s: bitcoin is at or above its dollar trend, and gold is above the trend implied for it.';
    else if (t.mu < 1 && t.gm <= 1) read = 'The gap is bitcoin\u2019s: gold is at or below the trend implied for it, and bitcoin is below its dollar trend.';
    else read = 'Bitcoin is at or above its dollar trend and gold is at or below the trend implied for it, so bitcoin reads high in ounces.';
    setText('gbGapRead', lead + read + ' The gap can close from either side, by bitcoin rising or by gold falling back, or not at all.');
  }

  function wireStarts() {
    document.querySelectorAll('.gb-chip[data-from]').forEach(function (b) {
      var y = +b.getAttribute('data-from'), on = y === START_YEAR;
      b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (y === START_YEAR) return;
        applyStart(y);
        if (TODAY_IN) computeToday.apply(null, TODAY_IN);
        document.querySelectorAll('.gb-chip[data-from]').forEach(function (o) { var o2 = +o.getAttribute('data-from') === y; o.classList.toggle('is-active', o2); o.setAttribute('aria-pressed', o2 ? 'true' : 'false'); });
        try { var u = new URL(location.href); if (y === 2011) u.searchParams.delete('from'); else u.searchParams.set('from', String(y)); history.replaceState(null, '', u.toString()); } catch (e) {}
        renderStatic(); renderAll();
      });
    });
  }

  // ── §5c did an early fit predict today? (out of sample, both units) ──
  var OOS_CUTS = [2014, 2016, 2017, 2020, 2023], OOS_CUT = 2017;
  (function () {
    var q = /[?&]fit=(\d{4})-12/.exec(location.search || '');
    if (q && OOS_CUTS.indexOf(+q[1]) >= 0) OOS_CUT = +q[1];
  })();
  var FIRST = ROWS[0];
  function fitRows(R) { var xs = R.map(function (r) { return r.day; }); return { gold: fitLogLog(xs, R.map(function (r) { return r.oz; })), usd: fitLogLog(xs, R.map(function (r) { return r.usd; })) }; }
  var OOS_FULL = fitRows(ROWS);
  function oosFor(year) {
    var end = dayOf((year + 1) + '-01-01');
    var train = ROWS.filter(function (r) { return r.day < end; }), test = ROWS.filter(function (r) { return r.day >= end; });
    return { year: year, end: end, train: train, test: test, fit: fitRows(train) };
  }
  function signPct(v) { var n = Math.round(v * 100); return (n > 0 ? '+' : n < 0 ? '\u2212' : '\u00b1') + Math.abs(n) + '%'; }
  function renderOos() {
    var cv = document.getElementById('gbOosChart'); if (!cv) return;
    var O = oosFor(OOS_CUT), day = TODAY ? TODAY.day : LAST.day;
    var gE = O.fit.gold.at(day), gF = OOS_FULL.gold.at(day), uE = O.fit.usd.at(day), uF = OOS_FULL.usd.at(day);
    var gMiss = gE / gF - 1, uMiss = uE / uF - 1;
    setText('gbOosFirst', monthLabel(FIRST.day));
    setText('gbOosCutLabel', 'end-' + OOS_CUT);
    setText('gbOosUsdEarly', fmtUsd(uE)); setText('gbOosUsdFull', fmtUsd(uF)); setText('gbOosUsdMiss', signPct(uMiss));
    setText('gbOosGoldEarly', fmtOz(gE) + ' oz'); setText('gbOosGoldFull', fmtOz(gF) + ' oz'); setText('gbOosGoldMiss', signPct(gMiss));
    setText('gbOosB', 'Fitted to the data up to end-' + OOS_CUT + ' (' + O.train.length + ' monthly samples), the exponent is ' + O.fit.usd.b.toFixed(2) + ' in dollars and ' + O.fit.gold.b.toFixed(2) + ' in gold; fitted to every sample, ' + OOS_FULL.usd.b.toFixed(2) + ' and ' + OOS_FULL.gold.b.toFixed(2) + '. "Every sample" here includes 2010, so its gold trend (' + fmtOz(OOS_FULL.gold.at(day)) + ' oz today) differs a little from the one at the top of the page (' + fmtOz(MAIN.gold.at(day)) + ' oz, fitted from ' + START_YEAR + ').');
    var au = Math.abs(uMiss), ag = Math.abs(gMiss), yrs = Math.round((day - O.end) / 365.25);
    // Gold's own move from the cutoff to today, in words (computed, never typed).
    var gCut = GOLD[OOS_CUT + '-12'], gNow = TODAY ? TODAY.goldUsd : GOLD_MONTHLY[GOLD_MONTHLY.length - 1][1];
    var gRatio = gCut ? gNow / gCut : NaN;
    var goldMove = !isFinite(gRatio) ? 'gold\u2019s own price has moved since then'
      : 'gold\u2019s own price has gone from ' + fmtUsd(gCut) + ' an ounce at the end of ' + OOS_CUT + ' to ' + fmtUsd(gNow) + ' (' + (gRatio >= 1 ? gRatio.toFixed(1) + '\u00d7' : 'down ' + pct(1 - gRatio)) + ')';
    setText('gbOosGoldCut', gCut ? fmtUsd(gCut) : '\u2014'); setText('gbOosGoldCutYear', String(OOS_CUT)); setText('gbOosGoldNow', fmtUsd(gNow));
    var read;
    // Enumerated on how each unit fared (STYLE_GUIDE §12).
    if (O.train.length < 150) read = 'With data only to end-' + OOS_CUT + ', there is too little record for either fit to say much: both miss today\u2019s trend widely.';
    else if (au <= 0.1 && ag > 0.25) read = 'In dollars, a line that saw nothing after end-' + OOS_CUT + ' lands within ' + Math.max(1, Math.round(au * 100)) + '% of today\u2019s trend, ' + yrs + ' years on. In gold the same test misses by ' + Math.round(ag * 100) + '%: the early fit ' + (gMiss > 0 ? 'expected bitcoin to buy far more gold today than the full record says.' : 'expected bitcoin to buy far less gold today than the full record says.') + ' The difference is the unit: ' + goldMove + ', and a line fitted to ounces up to the cutoff could not know it.';
    else if (au <= 0.25 && ag <= 0.25) read = 'Both units hold up: from end-' + OOS_CUT + ', the early line lands within ' + Math.round(au * 100) + '% of today\u2019s trend in dollars and ' + Math.round(ag * 100) + '% in gold.';
    else read = 'From end-' + OOS_CUT + ', the early line misses today\u2019s trend by ' + Math.round(au * 100) + '% in dollars and ' + Math.round(ag * 100) + '% in gold' + (ag > au ? '; the gold line misses by more.' : '; the dollar line misses by more.');
    setText('gbOosRead', read);
    // The chart: bitcoin in ounces, training vs later samples, early and full lines.
    if (typeof Chart === 'undefined') return;
    var x0 = yearFrac(FIRST.day), endDay = Math.max(LAST.day, day);
    var line = function (F) { var out = []; for (var d = FIRST.day; d <= endDay + 1; d += 15) out.push({ x: yearFrac(d), y: F.at(d) }); return out; };
    var muted = css('--gb-oos-train', 'rgba(242,238,232,0.35)');
    var ds = [
      { label: 'Training data (up to end-' + OOS_CUT + ')', data: O.train.map(function (r) { return { x: yearFrac(r.day), y: r.oz, day: r.day, row: r }; }), borderColor: muted, backgroundColor: muted, borderWidth: 1.4, pointRadius: 0 },
      { label: 'After the cutoff (the test)', data: O.test.map(function (r) { return { x: yearFrac(r.day), y: r.oz, day: r.day, row: r }; }), borderColor: css('--gb-btc', '#F7931A'), borderWidth: 1.8, pointRadius: 0 },
      { label: 'Line fitted to end-' + OOS_CUT + ' only', data: line(O.fit.gold), borderColor: css('--gb-oos-early', '#7fbf8a'), borderWidth: 1.8, pointRadius: 0 },
      { label: 'Line fitted to every sample', data: line(OOS_FULL.gold), borderColor: css('--gb-trend', '#d4a843'), borderWidth: 1.4, borderDash: [6, 4], pointRadius: 0 }
    ];
    var opt = baseOptions('Ounces of gold per bitcoin (log scale)', ozTick);
    opt.scales.x.min = Math.floor(x0); opt.scales.x.max = yearFrac(endDay) + 0.3;
    opt.plugins.tooltip.callbacks = {
      title: function (it) { var p = it[0].raw; return p.day != null ? monthLabel(p.day) : ''; },
      label: function (it) { var p = it.raw; return p.row ? 'Bitcoin: ' + fmtOz(p.row.oz) + ' oz of gold' : ''; },
      afterBody: function (it) { var p = it[0] && it[0].raw; if (!p || p.day == null) return []; return ['Early line: ' + fmtOz(O.fit.gold.at(p.day)) + ' oz \u00b7 full line: ' + fmtOz(OOS_FULL.gold.at(p.day)) + ' oz']; }
    };
    opt.plugins.tooltip.filter = function (it) { return it.datasetIndex <= 1; };
    if (charts.oos) charts.oos.destroy();
    charts.oos = new Chart(cv, { type: 'line', data: { datasets: ds }, options: opt });
  }
  function wireOos() {
    document.querySelectorAll('.gb-oos-chip').forEach(function (b) {
      var y = +b.getAttribute('data-cut'), on = y === OOS_CUT;
      b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (y === OOS_CUT) return;
        OOS_CUT = y;
        document.querySelectorAll('.gb-oos-chip').forEach(function (o) { var o2 = +o.getAttribute('data-cut') === y; o.classList.toggle('is-active', o2); o.setAttribute('aria-pressed', o2 ? 'true' : 'false'); });
        try { var u = new URL(location.href); if (y === 2017) u.searchParams.delete('fit'); else u.searchParams.set('fit', y + '-12'); history.replaceState(null, '', u.toString()); } catch (e) {}
        renderOos();
      });
    });
  }

  function renderAll() {
    renderTwoReadings();
    renderGap();
    renderReadout(); renderOzChart(); renderMultChart(); renderLows(); renderGoldRun(); renderParted(); renderSturdy(); renderEarlier(); renderOos();
  }

  window.gbQA = function () {
    var O = oosFor(OOS_CUT), d = TODAY ? TODAY.day : LAST.day;
    return { oos: { cut: OOS_CUT, n: O.train.length, goldEarly: O.fit.gold.at(d), goldFull: OOS_FULL.gold.at(d), usdEarly: O.fit.usd.at(d), usdFull: OOS_FULL.usd.at(d), bGold: O.fit.gold.b, bUsd: O.fit.usd.b },
             fitFrom: FIT_FROM, startYear: START_YEAR, months: FIT_ROWS.length, gold: { a: MAIN.gold.a, b: MAIN.gold.b, r2: MAIN.gold.r2 }, usd: { a: MAIN.usd.a, b: MAIN.usd.b, r2: MAIN.usd.r2 },
             band: [BAND_LO, BAND_HI], last: { month: LAST.key, oz: LAST.oz, mg: LAST.mg }, today: TODAY };
  };

  function init() {
    wireStarts(); wireOos();
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
