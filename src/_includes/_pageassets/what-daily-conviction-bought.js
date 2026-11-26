/* ============================================================
   What Daily Conviction Bought — retrospective daily-DCA backtest
   ============================================================
   Ports scripts/thirty-a-day-chart.ps1: log-linear daily interpolation
   of PL_DATA, buying $amt of bitcoin every day from the chosen start
   through the latest PL_DATA sample. Retrospective only — the historical
   record of a past habit, never a projection.

   Page-local and presentation-only. Reads the shared module's PL_DATA /
   GENESIS_TS / plPrice / TODAY_PRICE / fetchTodayPrice / todayPriceLabel;
   writes nothing to shared state. Auto-freshens with the monthly PL_DATA
   refresh — no added manual refresh surface.
============================================================ */
(function(){
  if (typeof PL_DATA === 'undefined' || typeof GENESIS_TS === 'undefined' || typeof plPrice !== 'function') return;
  var $ = function(id){ return document.getElementById(id); };
  if (!$('dcCards')) return;

  // ── sample arrays + day/date helpers ──
  var SD = PL_DATA.map(function(x){ return x[0]; });
  var SP = PL_DATA.map(function(x){ return x[1]; });
  var FIRST_DAY = SD[0], LAST_DAY = SD[SD.length-1], LAST_PX = SP[SP.length-1];
  function dayToDate(d){ return new Date((GENESIS_TS + d*86400) * 1000); }
  function dateToDay(dt){ return Math.floor((dt.getTime()/1000 - GENESIS_TS) / 86400); }
  function isoDay(d){ return dayToDate(d).toISOString().slice(0,10); }
  function longDate(d){ return dayToDate(d).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}); }

  // start bounds: first sample … ~90 days before the latest sample
  var MIN_START = FIRST_DAY;
  var MAX_START = LAST_DAY - 90;

  // ── log-linear daily interpolation (mirrors the ps1 exactly) ──
  function interp(d){
    if (d <= FIRST_DAY) return SP[0];
    if (d >= LAST_DAY)  return LAST_PX;
    var lo = 0, hi = SD.length - 1;
    while (hi - lo > 1){ var mid = (lo + hi) >> 1; if (SD[mid] <= d) lo = mid; else hi = mid; }
    var t = (d - SD[lo]) / (SD[hi] - SD[lo]);
    return Math.exp(Math.log(SP[lo]) + t * (Math.log(SP[hi]) - Math.log(SP[lo])));
  }

  // ── the simulation ──
  function simulate(startDay, amt){
    var btc = 0, contrib = 0, peak = 0, peakDay = startDay, maxDD = 0, ddDay = startDay, ddVal = 0;
    var crossDay = null, crossContrib = 0, crossBtc = 0;
    var uwLen = 0, curStart = null, uwStart = startDay, uwEnd = startDay, uwEver = false;
    var contribPts = [], valuePts = [];
    // sample the chart every ~7 days for a light line; always include endpoints
    var step = Math.max(1, Math.round((LAST_DAY - startDay) / 900));
    for (var d = startDay; d <= LAST_DAY; d++){
      var px = interp(d);
      btc += amt / px;
      contrib += amt;
      var val = btc * px;
      if (val > peak){ peak = val; peakDay = d; }   // running max = peak value ever reached
      var dd = peak > 0 ? (val / peak - 1) : 0;
      if (dd < maxDD){ maxDD = dd; ddDay = d; ddVal = val; }
      if (crossDay === null && val >= 1e6){ crossDay = d; crossContrib = contrib; crossBtc = btc; }
      if (val < contrib){ uwEver = true; if (curStart === null) curStart = d; var len = d - curStart + 1; if (len > uwLen){ uwLen = len; uwStart = curStart; uwEnd = d; } }
      else curStart = null;
      if (d === startDay || d === LAST_DAY || (d - startDay) % step === 0){
        contribPts.push({ x: d, y: contrib });
        valuePts.push({ x: d, y: val, c: contrib, b: btc });   // c/b for the hover tooltip
      }
    }
    return {
      btc: btc, contrib: contrib, endValue: btc * LAST_PX,
      peak: peak, peakDay: peakDay,
      maxDD: maxDD, ddDay: ddDay, ddVal: ddVal,
      crossDay: crossDay, crossContrib: crossContrib, crossBtc: crossBtc,
      uwEver: uwEver, uwLen: uwLen, uwStart: uwStart, uwEnd: uwEnd,
      contribPts: contribPts, valuePts: valuePts,
      days: LAST_DAY - startDay + 1
    };
  }

  // ── forward band scenario: 10 more years of the same daily buy, from today,
  //    on top of the accumulated stack. Three bands, never one. Presentation-
  //    only (plPrice × band multiplier); no engine change to the retrospective. ──
  var FWD_YEARS = 10;
  function forwardBands(existingBtc, amt){
    var startFwd = (typeof TODAY_DAYS === 'number' ? TODAY_DAYS : LAST_DAY);
    var endFwd = startFwd + Math.round(FWD_YEARS * 365.25);
    // Two-band planning range (floor → trend). Upper-band excursions have been
    // brief spikes, not places price stays (RETIREMENT_CALCULATOR_DESIGN canon),
    // so upper is demoted to a caption clause — no $ figure computed here.
    var bands = [
      { key: 'floor', label: 'Floor', mult: (typeof PL_FLOOR === 'number' ? PL_FLOOR : 0.42) },
      { key: 'trend', label: 'Trend', mult: 1.0 }
    ];
    return bands.map(function(b){
      var fbtc = 0;
      for (var d = startFwd + 1; d <= endFwd; d++){ fbtc += amt / (plPrice(d) * b.mult); }
      var endPx = plPrice(endFwd) * b.mult;
      var total = existingBtc + fbtc;
      return { key: b.key, label: b.label, mult: b.mult, forwardBtc: fbtc, totalBtc: total, value: total * endPx, endDay: endFwd };
    });
  }

  // ── annualized return: money-weighted IRR on the actual daily cashflow, and
  //    the naive lump-sum-on-day-one CAGR-equivalent (tooltip contrast only).
  //    IRR ≠ (value/invested)^(1/years): that treats every dollar as invested on
  //    day one and understates a DCA stream. Solve amt·Σ(1+r)^t_i = value; the
  //    daily flows are evenly spaced, so Σ is a closed-form geometric sum. ──
  function annualReturns(startDay, amt, currentValue, valDay){
    var N = LAST_DAY - startDay + 1;
    var years = N / 365.25;
    var naive = (currentValue > 0 && amt > 0 && years > 0) ? Math.pow(currentValue / (amt * N), 1 / years) - 1 : 0;
    function f(r){
      var g = Math.pow(1 + r, 1 / 365.25);
      var sum = (Math.abs(g - 1) < 1e-12) ? N : Math.pow(g, valDay - LAST_DAY) * (Math.pow(g, N) - 1) / (g - 1);
      return amt * sum - currentValue;
    }
    var lo = -0.9, hi = 10;
    if (f(lo) > 0) return { irr: lo, naive: naive };
    if (f(hi) < 0) return { irr: hi, naive: naive };
    for (var i = 0; i < 80; i++){ var mid = (lo + hi) / 2; if (f(mid) > 0) hi = mid; else lo = mid; }
    return { irr: (lo + hi) / 2, naive: naive };
  }

  // ── state ──
  var DEF_AMT = 30, DEF_START = '2017-01-01';
  var S = { amt: DEF_AMT, startDay: dateToDay(new Date(DEF_START + 'T00:00:00Z')) };

  function clampStart(day){ return Math.max(MIN_START, Math.min(MAX_START, day)); }
  function clampAmt(a){ return Math.max(1, Math.min(1000, Math.round(a))); }

  // ── formatting ──
  function usd(v){ return '$' + Math.round(v).toLocaleString(); }
  function usdCompact(v){
    if (v >= 1e6) return '$' + (v/1e6).toFixed(2) + 'M';
    if (v >= 1e3) return '$' + Math.round(v/1e3).toLocaleString() + 'K';
    return '$' + Math.round(v);
  }
  function months(daysN){ return daysN / 30.44; }
  function durationStr(daysN){
    var mo = months(daysN);
    if (mo < 1) return daysN + (daysN === 1 ? ' day' : ' days');
    if (mo < 24) return Math.round(mo) + ' months';
    return (mo/12).toFixed(1) + ' years';
  }

  // ── live-price state for "value today" ──
  var livePrice = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0) ? TODAY_PRICE : LAST_PX;
  var liveSource = 'fallback';

  // ── render ──
  var chart = null;
  function render(){
    var r = simulate(S.startDay, S.amt);
    var valueNow = r.btc * livePrice;
    var isLive = (typeof todayPriceIsLive === 'function') ? todayPriceIsLive(liveSource) : (liveSource === 'live');

    // stat cards
    setNum('dcBtc', r.btc.toFixed(4) + ' BTC');
    setNum('dcInvested', usd(r.contrib));
    setNum('dcValue', usd(valueNow));
    $('dcValueSub').textContent = isLive ? 'at today’s price' : 'at the ' + lastSampleDateShort() + ' price';
    var mult = r.contrib > 0 ? valueNow / r.contrib : 0;
    setNum('dcMultiple', mult.toFixed(2) + '×');

    // annualized return — money-weighted IRR, with a live CAGR-contrast tooltip
    var ret = annualReturns(S.startDay, S.amt, valueNow, (typeof TODAY_DAYS === 'number' ? TODAY_DAYS : LAST_DAY));
    setNum('dcAnnual', (ret.irr * 100).toFixed(1) + '% / yr');
    var atip = $('dcAnnualTip');
    if (atip) atip.innerHTML = 'CAGR describes one lump sum growing from day one. This habit’s dollars arrived daily across the whole period — most had far less time to grow. The money-weighted return (IRR) is the single rate that makes every actual daily buy grow to today’s value. For comparison: a lump sum of the same total invested on day one would have needed only ~' + (ret.naive * 100).toFixed(1) + '%/yr (CAGR) to reach the same outcome — that’s the fair use of the simpler number, and why it isn’t the headline here.';

    // underwater
    if (!r.uwEver || r.uwLen <= 0){
      setNum('dcUnderwater', 'Never');
      $('dcUnderwaterSub').textContent = 'the stack was never worth less than the amount put in';
    } else {
      setNum('dcUnderwater', durationStr(r.uwLen));
      $('dcUnderwaterSub').innerHTML = 'worth less than invested, ' + longDate(r.uwStart) + ' → ' + longDate(r.uwEnd);
    }

    // deepest drawdown
    setNum('dcDrawdown', (r.maxDD*100).toFixed(1).replace('-', '−') + '%');
    $('dcDrawdownSub').innerHTML = 'peak-to-trough on the stack, trough ' + longDate(r.ddDay);

    // peak value — "what might have been", hindsight only
    setNum('dcPeak', usdCompact(r.peak));
    if ($('dcPeakSub')) $('dcPeakSub').innerHTML = 'reached ' + longDate(r.peakDay) + ' &mdash; visible only in the rearview mirror';

    // forward band scenario + retirement handoff
    renderForward(r.btc);

    // the sentence readout above the chart
    var lead;
    if (r.crossDay !== null){
      lead = '$' + S.amt + '/day from ' + longDate(S.startDay) + ' put in <strong>' + usd(r.contrib) +
        '</strong> and first crossed <strong>$1,000,000</strong> on ' + longDate(r.crossDay) +
        ' — ' + usd(r.crossContrib) + ' contributed by then, day ' + (r.crossDay - S.startDay + 1).toLocaleString() + ' of the habit.';
    } else {
      lead = '$' + S.amt + '/day from ' + longDate(S.startDay) + ' put in <strong>' + usd(r.contrib) +
        '</strong> and is worth <strong>' + usd(valueNow) + '</strong> ' + (isLive ? 'today' : 'at the ' + lastSampleDateShort() + ' price') +
        ' — a ' + mult.toFixed(2) + '× return on what went in.';
    }
    $('dcLead').innerHTML = lead;
    renderLedger(r, valueNow, ret, isLive);

    drawChart(r);
    syncUrl();
    syncControls();
  }
  function setNum(id, v){ var e = $(id); if (e) e.textContent = v; }

  // ── forward band cards + retirement handoff ──
  function renderForward(existingBtc){
    if (!$('dcFwd')) return;
    var bands = forwardBands(existingBtc, S.amt);
    bands.forEach(function(b){
      var v = $('dcFwdVal-' + b.key), c = $('dcFwdBtc-' + b.key);
      if (v) v.textContent = usdCompact(b.value);
      if (c) c.textContent = '+' + b.forwardBtc.toFixed(4) + ' BTC bought';
    });
    var yr = (typeof TODAY_DAYS === 'number') ? dayToDate(TODAY_DAYS + Math.round(FWD_YEARS*365.25)).getUTCFullYear() : '';
    if ($('dcFwdYear')) $('dcFwdYear').textContent = String(yr);
    // T4 — the second-decade insight (numbers live from the two paths)
    var floorB = bands[0], trendB = bands[1];
    var ratio = trendB.forwardBtc > 0 ? floorB.forwardBtc / trendB.forwardBtc : 0;
    if ($('dcFwdInsight')) $('dcFwdInsight').innerHTML =
      'The same habit that accumulated <strong>' + existingBtc.toFixed(2) + ' BTC</strong> in its first decade adds only about <strong>' +
      trendB.forwardBtc.toFixed(2) + ' BTC</strong> on the trend path in its second &mdash; the trend has moved, and the cheap-coin decade does not repeat. Along the floor path the habit gathers ' +
      (ratio >= 1.9 ? 'more than twice' : 'about ' + ratio.toFixed(1) + '×') +
      ' as many coins as along the trend &mdash; lower prices are the accumulator’s friend.';
    // handoff: carry the accumulated stack + this habit as a monthly DCA into Retirement
    var link = $('dcHandoff');
    if (link){
      var stackParam = existingBtc.toFixed(2);
      var dcaMonthly = Math.round(S.amt * 30.4);
      link.setAttribute('href', '/the-bitcoin-retirement?stack=' + stackParam + '&dca=' + dcaMonthly);
      if ($('dcHandoffNote')) $('dcHandoffNote').innerHTML =
        'Carries your <strong>' + existingBtc.toFixed(2) + ' BTC</strong> stack and this habit as a <strong>$' +
        dcaMonthly.toLocaleString() + '/mo</strong> contribution (≈ $' + S.amt + '/day × 30.4).';
    }
  }

  // ── chart: contributions (muted) vs stack value (amber), linear Y ──
  function drawChart(r){
    var canvas = $('dcChart');
    if (!canvas || typeof Chart === 'undefined') return;
    var cross = (r.crossDay !== null) ? [{ x: r.crossDay, y: 1e6 }] : [];
    var trough = [{ x: r.ddDay, y: r.ddVal }];
    var data = {
      datasets: [
        { label: 'Stack value', data: r.valuePts, borderColor: '#e09422', borderWidth: 2.4, pointRadius: 0, fill: false, tension: 0.1, order: 2 },
        { label: 'Contributions', data: r.contribPts, borderColor: '#8b8375', borderWidth: 2, pointRadius: 0, fill: false, order: 3 },
        { label: '$1M crossing', data: cross, showLine: false, pointRadius: cross.length ? 5 : 0, pointBackgroundColor: '#e09422', pointBorderColor: '#f2eee8', pointBorderWidth: 2, order: 1 },
        { label: 'Deepest drawdown', data: trough, showLine: false, pointRadius: 4, pointBackgroundColor: '#f2eee8', pointBorderColor: '#e09422', pointBorderWidth: 2, order: 1 }
      ]
    };
    var opts = {
      responsive: true, maintainAspectRatio: false, animation: { duration: 0 },
      parsing: true,
      scales: {
        x: {
          type: 'linear',
          min: r.contribPts.length ? r.contribPts[0].x : S.startDay, max: LAST_DAY,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#877e6f', font: { size: 10 }, maxTicksLimit: 9,
            callback: function(v){ return dayToDate(v).getUTCFullYear(); }
          }
        },
        y: {
          type: 'linear', beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#877e6f', font: { size: 10 }, callback: function(v){ return usdCompact(v); } }
        }
      },
      interaction: { mode: 'index', intersect: false },   // hover/tap a date → full readout; touch-friendly
      plugins: {
        legend: { display: true, position: 'top', labels: { color: '#9a9080', font: { size: 11, family: 'Inter' }, boxWidth: 12, padding: 14, usePointStyle: true, filter: function(l){ return l.text === 'Stack value' || l.text === 'Contributions'; } } },
        tooltip: {
          backgroundColor: 'rgba(10,9,8,0.95)', titleColor: '#f2eee8', bodyColor: '#d0c8c0',
          borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1, padding: 11, displayColors: false,
          filter: function(item){ return item.datasetIndex === 0 && item.raw && item.raw.c != null; }, // read the value series only
          callbacks: {
            title: function(items){ return items.length ? longDate(items[0].raw.x) : ''; },
            label: function(item){
              var p = item.raw, m = p.c > 0 ? (p.y / p.c) : 0;
              return [
                'Contributions: ' + usd(p.c),
                'Stack value: ' + usd(p.y),
                'BTC held: ' + p.b.toFixed(4),
                'Multiple: ' + m.toFixed(2) + '×'
              ];
            }
          }
        }
      }
    };
    if (chart){ chart.data = data; chart.options = opts; chart.update('none'); }
    else chart = new Chart(canvas.getContext('2d'), { type: 'line', data: data, options: opts });
  }

  // ── controls ──
  function syncControls(){
    var dateEl = $('dcStart'), amtNum = $('dcAmtNum'), amtSlider = $('dcAmtSlider');
    if (dateEl && document.activeElement !== dateEl) dateEl.value = isoDay(S.startDay);
    if (amtNum && document.activeElement !== amtNum) amtNum.value = String(S.amt);
    if (amtSlider) amtSlider.value = String(S.amt);
    // active preset chip
    var chips = document.querySelectorAll('.dc-preset');
    for (var i=0;i<chips.length;i++){
      var ps = chips[i].getAttribute('data-start');
      chips[i].classList.toggle('is-active', ps === isoDay(S.startDay));
    }
  }

  function setStart(day){ S.startDay = clampStart(day); render(); }
  function setAmt(a){ S.amt = clampAmt(a); render(); }

  // ── URL state (§17.5): ?amt= & start= — defaults omitted, decode before render ──
  function readUrl(){
    if (!window.URLSearchParams) return;
    var p = new URLSearchParams(location.search), v;
    if (p.has('amt')){ v = parseInt(p.get('amt'), 10); if (isFinite(v)) S.amt = clampAmt(v); }
    if (p.has('start')){
      var s = p.get('start');
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)){ var d = dateToDay(new Date(s + 'T00:00:00Z')); if (isFinite(d)) S.startDay = clampStart(d); }
    }
  }
  var _urlT = null;
  function syncUrl(){
    if (!window.history || !window.history.replaceState) return;
    if (_urlT) clearTimeout(_urlT);
    _urlT = setTimeout(function(){
      var p = new URLSearchParams();
      if (S.amt !== DEF_AMT) p.set('amt', String(S.amt));
      if (isoDay(S.startDay) !== DEF_START) p.set('start', isoDay(S.startDay));
      var q = p.toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
    }, 250);
  }

  // ── wire ──
  function wire(){
    var dateEl = $('dcStart'), amtNum = $('dcAmtNum'), amtSlider = $('dcAmtSlider');
    if (dateEl){
      dateEl.min = isoDay(MIN_START); dateEl.max = isoDay(MAX_START);
      dateEl.addEventListener('input', function(){
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateEl.value)){ setStart(dateToDay(new Date(dateEl.value + 'T00:00:00Z'))); }
      });
    }
    if (amtSlider){ amtSlider.addEventListener('input', function(){ setAmt(+amtSlider.value); }); }
    if (amtNum){ amtNum.addEventListener('input', function(){ if (amtNum.value !== '') setAmt(+amtNum.value); }); }
    var chips = document.querySelectorAll('.dc-preset');
    for (var i=0;i<chips.length;i++){
      chips[i].addEventListener('click', function(){ setStart(dateToDay(new Date(this.getAttribute('data-start') + 'T00:00:00Z'))); });
    }
    var reset = $('dcReset');
    if (reset) reset.addEventListener('click', function(){ S.amt = DEF_AMT; S.startDay = dateToDay(new Date(DEF_START + 'T00:00:00Z')); render(); });
  }

  // ── preset chip dates: fill "5 years ago" / "1 year ago" from today ──
  function fillPresetDates(){
    var todayDay = (typeof TODAY_DAYS === 'number') ? TODAY_DAYS : LAST_DAY;
    var map = { 'dcPreset5y': todayDay - Math.round(5*365.25), 'dcPreset1y': todayDay - Math.round(365.25) };
    Object.keys(map).forEach(function(id){
      var el = $(id); if (el){ el.setAttribute('data-start', isoDay(clampStart(map[id]))); }
    });
  }

  // ════════ CHECK THE WORK (STYLE_GUIDE §6.49; shared/ledger.js) ════════
  // Added 2026-11-26. The habit month by month and year by year (the same
  // daily loop as simulate(), totalled), the forward block year by year, then
  // the eight cards and the forward cards. Built from the page's own functions
  // (interp, simulate, annualReturns, forwardBands); nothing here changes a figure.
  var ledgerEl = $('dcLedger');
  var SPARSE_FROM = (function(){ for (var j = 1; j < SD.length; j++) if (SD[j] - SD[j-1] > 25) return SD[j-1]; return null; })();
  function shortDate(d){ return dayToDate(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); }
  function monthLabel(d){ return dayToDate(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  // The daily loop, in simulate()'s order, totalled by month and by year.
  function habitRows(startDay, amt){
    var months = [], years = [], btc = 0, inv = 0, cm = null, cy = null;
    for (var d = startDay; d <= LAST_DAY; d++){
      var px = interp(d), dt = dayToDate(d), mk = dt.getUTCFullYear() * 12 + dt.getUTCMonth(), yk = dt.getUTCFullYear();
      btc += amt / px; inv += amt;
      if (!cm || cm.key !== mk){ cm = { key: mk, label: monthLabel(d), days: 0, inv: 0, bought: 0 }; months.push(cm); }
      if (!cy || cy.key !== yk){ cy = { key: yk, label: String(yk), days: 0, inv: 0, bought: 0 }; years.push(cy); }
      [cm, cy].forEach(function(x){ x.days++; x.inv += amt; x.bought += amt / px; x.held = btc; x.toDate = inv; x.lastDay = d; x.px = px; });
    }
    return { months: months, years: years };
  }
  // forwardBands() year by year: the same running sums, cut at each year end.
  function forwardRows(existingBtc, amt){
    var startFwd = (typeof TODAY_DAYS === 'number' ? TODAY_DAYS : LAST_DAY), endFwd = startFwd + Math.round(FWD_YEARS * 365.25);
    var mults = [(typeof PL_FLOOR === 'number' ? PL_FLOOR : 0.42), 1.0], run = [0, 0], d = startFwd + 1, rows = [];
    for (var y = 1; y <= FWD_YEARS; y++){
      var yEnd = y === FWD_YEARS ? endFwd : startFwd + Math.round(y * 365.25), row = { y: y, end: yEnd, b: [] };
      var before = run.slice();
      for (; d <= yEnd; d++){ run[0] += amt / (plPrice(d) * mults[0]); run[1] += amt / (plPrice(d) * mults[1]); }
      mults.forEach(function(m, k){ var px = plPrice(yEnd) * m; row.b.push({ bought: run[k] - before[k], fwd: run[k], held: existingBtc + run[k], px: px, value: (existingBtc + run[k]) * px }); });
      rows.push(row);
    }
    return { rows: rows, start: startFwd, end: endFwd, mults: mults };
  }
  function ledgerSpec(r, valueNow, ret, isLive){
    var amt = S.amt, H = habitRows(S.startDay, amt), F = forwardRows(r.btc, amt), valDay = (typeof TODAY_DAYS === 'number' ? TODAY_DAYS : LAST_DAY);
    var cadence = 'about 12 days apart' + (SPARSE_FROM != null ? ', about a month apart since ' + monthLabel(SPARSE_FROM) : '');
    var pxWord = isLive ? 'today’s price' : 'the ' + lastSampleDateShort() + ' price';
    var gap = valDay - LAST_DAY;
    var common = function(unitLabel){ return [
      { label: unitLabel, unit: '', fmt: 'text', get: function(x){ return x.label; }, how: unitLabel === 'Month' ? 'A calendar month of the habit; the first and last can be part months.' : 'A calendar year of the habit; the first and last can be part years.' },
      { label: 'Days', unit: '', fmt: 'text', get: function(x){ return String(x.days); }, how: 'One buy a day, every day, from the start to the record’s last sample.' },
      { label: 'Invested', unit: '$', fmt: 'usd', get: function(x){ return x.inv; }, how: 'The daily amount ($' + amt + ') times the days.' },
      { label: 'Bitcoin bought', unit: '₿', fmt: 'btc', get: function(x){ return x.bought; },
        how: 'Each day’s amount divided by that day’s price, added up. A day’s price is read between the two record samples around it, on a straight line in the logarithm of price; the samples are ' + cadence + '.' },
      { label: 'Average price paid', unit: '$', fmt: 'price', get: function(x){ return x.inv / x.bought; }, how: 'Invested divided by bitcoin bought.' },
      { label: 'Bitcoin held', unit: '₿', fmt: 'btc', get: function(x){ return x.held; }, how: 'Every buy so far: the Bitcoin accumulated card on the last row.' },
      { label: 'Invested to date', unit: '$', fmt: 'usd', get: function(x){ return x.toDate; }, how: 'The Total invested card on the last row.' },
      { label: 'Price at the end', unit: '$', fmt: 'price', get: function(x){ return x.px; }, how: 'That day’s price on the last day of the ' + unitLabel.toLowerCase() + ' the habit bought.' },
      { label: 'Value at the end', unit: '$', fmt: 'usd', get: function(x){ return x.held * x.px; }, how: 'Bitcoin held times that price: the chart’s stack value at that date.' },
      { label: 'Multiple', unit: '×', fmt: 'mult', get: function(x){ return x.held * x.px / x.toDate; }, how: 'Value divided by invested to date.' }]; };
    var fwdCols = [{ label: 'Year', unit: '', fmt: 'text', get: function(x){ return 'Year ' + x.y + ' · ' + shortDate(x.end); },
      how: 'Ten more years of the same buy, from ' + shortDate(F.start + 1) + ' (tomorrow) to ' + shortDate(F.end) + (gap > 0 ? '. The ' + gap + ' days between the record’s last sample (' + shortDate(LAST_DAY) + ') and today are in neither the history nor this block' : '') + '.' }];
    ['Floor', 'Trend'].forEach(function(name, k){
      var m = F.mults[k], word = k === 0 ? 'the floor, ' + m.toFixed(2) + '× the trend' : 'the trend';
      fwdCols.push(
        { label: name + ': bought', unit: '₿', fmt: 'btc', get: function(x){ return x.b[k].bought; }, how: 'Each day’s amount divided by the price on ' + word + ' that day, added up over the year.' },
        { label: name + ': held', unit: '₿', fmt: 'btc', get: function(x){ return x.b[k].held; }, how: 'The ' + r.btc.toFixed(4) + ' BTC already accumulated plus every forward buy so far.' },
        { label: name + ': price', unit: '$', fmt: 'usd', get: function(x){ return x.b[k].px; }, how: 'The price on ' + word + ' at the year’s end.' },
        { label: name + ': value', unit: '$', fmt: 'usd', get: function(x){ return x.b[k].value; }, how: 'Held times that price. Year 10 is the ' + name + ' card.' });
    });
    var last = F.rows[F.rows.length - 1], fwdYear = dayToDate(F.end).getUTCFullYear();
    var N = r.days, naiveYears = N / 365.25;
    var fin = [
      { label: 'Days bought', fmt: 'text', values: [N.toLocaleString('en-US')], how: 'From ' + longDate(S.startDay) + ' to ' + longDate(LAST_DAY) + ', the record’s last sample.' },
      { label: 'Total invested', fmt: 'usd', values: [r.contrib], how: 'The daily amount times the days: the By month tab’s last Invested to date.' },
      { label: 'Bitcoin accumulated', fmt: 'btc', values: [r.btc], how: 'Every daily buy: the By month tab’s last Bitcoin held.' },
      { label: 'Current value', fmt: 'usd', values: [valueNow], card: 'The Current value card above',
        how: 'Bitcoin accumulated times ' + pxWord + ' (' + usd(livePrice) + ').' + (livePrice !== LAST_PX ? ' The By month tab\u2019s last row, like the chart, values the same bitcoin at the last sample\u2019s price (' + usd(LAST_PX) + ').' : '') },
      { label: 'Multiple', fmt: 'mult', values: [valueNow / r.contrib], how: 'Current value divided by total invested.' },
      { label: 'Annualized return, money-weighted', fmt: 'pct', values: [ret.irr],
        how: 'The single yearly rate at which every daily buy, grown from its own day to today (' + longDate(valDay) + '), adds up to the current value: the IRR the card shows.' },
      { label: 'As if all invested on day one', fmt: 'pct', values: [ret.naive],
        how: 'Total invested grown to the current value over the habit’s ' + naiveYears.toFixed(2) + ' years, as one lump on the first day. Lower, because most of the dollars went in later; the card’s tooltip quotes it.' },
      { label: 'Peak value', fmt: 'usd', values: [r.peak], how: 'The highest the stack was worth on any day, bitcoin held times that day’s price: ' + longDate(r.peakDay) + '. It falls between the month-end rows.' },
      { label: 'Deepest drawdown', fmt: 'pct', values: [r.maxDD], how: 'The largest fall from the stack’s highest value so far to a later day’s value, day by day; the trough was ' + longDate(r.ddDay) + ', at ' + usd(r.ddVal) + '.' },
      { label: 'Longest underwater', fmt: 'text', values: [(!r.uwEver || r.uwLen <= 0) ? 'Never' : durationStr(r.uwLen) + ', ' + shortDate(r.uwStart) + ' to ' + shortDate(r.uwEnd)],
        how: 'The longest run of days when the stack was worth less than everything put in by then.' },
      { label: 'First $1,000,000', fmt: 'text', values: [r.crossDay !== null ? shortDate(r.crossDay) + ', day ' + (r.crossDay - S.startDay + 1).toLocaleString('en-US') : 'Not reached'],
        how: r.crossDay !== null ? 'The first day the stack was worth $1,000,000 or more, with ' + usd(r.crossContrib) + ' put in by then: the sentence above the chart.' : 'The stack was never worth $1,000,000 on any day of the record.' },
      { label: 'Floor path in ' + fwdYear, fmt: 'usd', values: [last.b[0].value], how: 'The If the habit continued tab’s last row: the Floor card.' },
      { label: 'Trend path in ' + fwdYear, fmt: 'usd', values: [last.b[1].value], how: 'The same row: the Trend card.' }];
    var inputs = [
      ['Daily amount', '$' + amt + ' a day'],
      ['Start', longDate(S.startDay)],
      ['Through', longDate(LAST_DAY) + ', the record’s last sample'],
      ['Days', N.toLocaleString('en-US')],
      ['Each day’s price', 'read between the record’s samples (' + cadence + ')'],
      ['Current value at', usd(livePrice) + ' (' + pxWord + ')'],
      ['If the habit continued', 'ten more years of the same buy, on the floor (' + F.mults[0].toFixed(2) + '× trend) or the trend'],
      ['Today', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]];
    return {
      hint: 'the habit month by month, and the ten years ahead',
      inputs: inputs.map(function(m){ return { label: m[0], value: m[1] }; }),
      note: 'The habit as it ran on the record, totalled by month and by year, then the forward block year by year. The last table is the cards above.',
      tabs: [{ id: 'months', label: 'By month', columns: common('Month'), rows: H.months, strong: function(x){ return x === H.months[H.months.length - 1]; } },
             { id: 'years', label: 'By year', columns: common('Year'), rows: H.years, strong: function(x){ return x === H.years[H.years.length - 1]; } },
             { id: 'fwd', label: 'If the habit continued', columns: fwdCols, rows: F.rows, strong: function(x){ return x.y === FWD_YEARS; } }],
      final: { title: 'Your habit', csvTitle: 'Your habit (the cards)', howTitle: 'How these figures are worked out', cols: ['On the cards'], rows: fin },
      csv: { filename: 'what-daily-conviction-bought.csv', meta: [
        ['Last Coin Standing', 'What Daily Conviction Bought'],
        ['Amounts', 'dollars of the day; bitcoin in BTC'],
        ['Page', function(){ return window.location.origin + window.location.pathname + window.location.search; }]] }
    };
  }
  function renderLedger(r, valueNow, ret, isLive){
    if (!ledgerEl || !window.Ledger) return;
    window.Ledger.render(ledgerEl, ledgerSpec(r, valueNow, ret, isLive));
  }

  // ── QA (console: dcQA()) ──
  // The month and year tables against the simulation and each other, the
  // forward rows against forwardBands(), the last table against the cards'
  // text, the CSV's shape; then a sweep of starts and amounts through
  // render(), restoring the reader's settings after.
  window.dcQA = function(){
    var near = function(x, y){ return typeof x === 'number' && typeof y === 'number' && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y)); };
    function holds(){
      var sp = ledgerEl && ledgerEl._ledgerSpec, why = [];
      if (!sp) return { ok: false, why: ['no ledger'] };
      if (!window.Ledger.check(ledgerEl, { side: false })) why.push('Ledger.check');
      var r = simulate(S.startDay, S.amt), valueNow = r.btc * livePrice, fin = sp.final.rows;
      [sp.tabs[0], sp.tabs[1]].forEach(function(tb){
        var C = tb.columns, days = 0, inv = 0, bought = 0, prevHeld = 0;
        tb.rows.forEach(function(x){
          days += x.days; inv += C[2].get(x); bought += C[3].get(x);
          if (!near(C[2].get(x), x.days * S.amt) || !near(C[4].get(x), C[2].get(x) / C[3].get(x)) || !near(C[5].get(x) - prevHeld, C[3].get(x)) || !near(C[7].get(x), interp(x.lastDay)) || !near(C[8].get(x), C[5].get(x) * C[7].get(x)) || !near(C[9].get(x), C[8].get(x) / C[6].get(x))) why.push(tb.id + ' ' + x.label);
          prevHeld = C[5].get(x);
        });
        var L = tb.rows[tb.rows.length - 1];
        if (days !== r.days || !near(inv, r.contrib) || !near(bought, r.btc) || !near(C[5].get(L), r.btc) || !near(C[6].get(L), r.contrib)) why.push(tb.id + ' totals');
      });
      var B = forwardBands(r.btc, S.amt), fr = sp.tabs[2].rows, FL = fr[fr.length - 1];
      if (fr.length !== FWD_YEARS || B.some(function(b, k){ return !near(FL.b[k].fwd, b.forwardBtc) || !near(FL.b[k].value, b.value) || FL.end !== b.endDay; })) why.push('forward rows');
      fr.forEach(function(x){ x.b.forEach(function(b){ if (!near(b.value, b.held * b.px)) why.push('forward year ' + x.y); }); });
      var ret = annualReturns(S.startDay, S.amt, valueNow, (typeof TODAY_DAYS === 'number' ? TODAY_DAYS : LAST_DAY));
      var vals = fin.map(function(x){ return x.values[0]; });
      if (!near(vals[1], r.contrib) || !near(vals[2], r.btc) || !near(vals[3], valueNow) || !near(vals[5], ret.irr) || !near(vals[6], ret.naive) || !near(vals[7], r.peak) || !near(vals[8], r.maxDD)) why.push('final against the engine');
      var txt = function(id){ var e = $(id); return e ? e.textContent : null; };
      if (txt('dcBtc') !== vals[2].toFixed(4) + ' BTC' || txt('dcInvested') !== usd(vals[1]) || txt('dcValue') !== usd(vals[3]) || txt('dcMultiple') !== vals[4].toFixed(2) + '×'
        || txt('dcAnnual') !== (vals[5] * 100).toFixed(1) + '% / yr' || txt('dcPeak') !== usdCompact(vals[7]) || txt('dcDrawdown') !== (vals[8] * 100).toFixed(1).replace('-', '−') + '%'
        || txt('dcFwdVal-floor') !== usdCompact(vals[11]) || txt('dcFwdVal-trend') !== usdCompact(vals[12])) why.push('cards');
      if (r.crossDay !== null && txt('dcLead').indexOf(longDate(r.crossDay)) < 0) why.push('first million');
      if ((vals[9] === 'Never') !== (txt('dcUnderwater') === 'Never')) why.push('underwater');
      var csv = window.Ledger.toCsv(sp);
      if (!(csv.indexOf('# Last Coin Standing,') === 0 && (csv.match(/^# Input: /gm) || []).length === sp.inputs.length
        && (csv.match(/^# How each column is worked out$/gm) || []).length === 3 && csv.indexOf('# Your habit') > 0)) why.push('csv shape');
      return { ok: !why.length, why: why };
    }
    var out = [], live = holds();
    out.push(['live panel: months, years, the forward rows, the cards, CSV', live.ok, live.why.slice(0, 6).join('; ')]);
    var saved = { amt: S.amt, startDay: S.startDay };
    var D = function(s){ return clampStart(dateToDay(new Date(s + 'T00:00:00Z'))); };
    var V = [[30, '2017-01-01'], [1, isoDay(MIN_START)], [1000, isoDay(MAX_START)], [100, '2021-11-10'], [5, '2014-01-01'], [250, '2020-03-12'], [7, '2013-12-04']];
    try {
      V.forEach(function(v){ S.amt = clampAmt(v[0]); S.startDay = D(v[1]); render(); var r2 = holds(); out.push(['sweep: $' + S.amt + ' a day from ' + isoDay(S.startDay), r2.ok, r2.why.slice(0, 6).join('; ')]); });
    } finally { S.amt = saved.amt; S.startDay = saved.startDay; render(); }
    var ok = out.every(function(x){ return x[1]; });
    if (window.console) console.table(out.map(function(x){ return { check: x[0], pass: x[1], why: x[2] }; }));
    return { ok: ok, checks: out };
  };

  // ── init: URL beats defaults; restore before first render ──
  readUrl();
  fillPresetDates();
  wire();
  render();
  if (typeof fetchTodayPrice === 'function'){
    fetchTodayPrice(function(price, source){
      if (typeof price === 'number' && price > 0){ livePrice = price; liveSource = source; render(); }
    });
  }
})();
