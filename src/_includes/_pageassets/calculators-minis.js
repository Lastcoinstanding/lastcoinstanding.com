/* ============================================================
   /calculators — live mini-render module (v2: 7 live renderers)
   ============================================================
   Live previews for the marquee tools on /calculators. Each
   renderer is small, self-contained, and reads from inlined or
   global data so the file has no runtime dependencies beyond
   shared/power-law-data.js (which is already loaded before this
   file via the page_scripts include order).

   Renderers (target div → function):
     #mini-heatmap     → renderMiniHeatmap       (BTC outperformance grid)
     #mini-bvsm-chart  → renderMiniBvsmChart    (3-line wealth chart, BTC/SP/NDQ)
     #mini-power-law   → renderMiniPowerLaw     (log-log scatter + trend)
     #mini-retirement  → renderMiniRetirement   (forward PL projection)
     #mini-rebalancing → renderMiniRebalancing  (channel + recent price + markers)
     #mini-horizon     → renderMiniHorizon      (long-range projection)
     #mini-half-life   → renderMiniHalfLife     (purchasing power decay)

   All renderers write directly to target.innerHTML; rendering is
   one-shot at page load (no interactivity in the previews — the
   user clicks the tile to open the full tool). Total CPU budget
   at page load: ~150-250ms, dominated by the mini-heatmap's
   ~980 cell loop.

   Data layer:
   - PL_DATA, GENESIS_TS, PL_A, PL_B, PL_FLOOR, PL_CEIL, plPrice():
     globals from shared/power-law-data.js
   - SP500_TR_DATA, NDQ_TR_DATA: inlined below (TR-SYNC marker).
     Canonical source is bvsm.js. When the BvSM page updates its
     comparator data, this file must update too. Future cleanup:
     extract both to shared/comparator-data.js the same way
     PL_DATA was promoted (third-consumer trigger).
   ============================================================ */

(function() {
  'use strict';

  /* ═══════ TR-SYNC: SP500 + NDQ comparator data ═══════ */
  /* Canonical copies live in bitcoin-vs-the-stock-market.js.   */
  /* Marker comment also in that file. When updating monthly    */
  /* values, change BOTH files. ~10KB total.                    */
  /* SP500_TR_DATA: see shared/tr-comparator-data.js (loaded before this script). */
  /* NDQ_TR_DATA: see shared/tr-comparator-data.js (loaded before this script). */
  /* ═══════════════════════════════════════════════════════════
     SHARED HELPERS
     ═══════════════════════════════════════════════════════════ */

  var FONT = 'Inter, sans-serif';
  var C = {
    btc:    '#F7931A',
    btcDim: '#e09422',
    sp:     '#5fc6d4',
    ndq:    '#7fd4b8',
    grid:   '#2a2a2a',
    gridLt: '#3a3a3a',
    label:  '#888',
    lblDim: '#666',
    bg:     '#0a0908'
  };

  function daysSinceGenesisFromDate(d) {
    return (d.getTime() / 1000 - GENESIS_TS) / 86400;
  }

  function dateFromDaysSinceGenesis(days) {
    return new Date((days * 86400 + GENESIS_TS) * 1000);
  }

  function btcPriceAt(days) {
    if (typeof PL_DATA === 'undefined') return null;
    if (days <= PL_DATA[0][0]) return PL_DATA[0][1];
    if (days >= PL_DATA[PL_DATA.length - 1][0]) return PL_DATA[PL_DATA.length - 1][1];
    for (var i = 0; i < PL_DATA.length - 1; i++) {
      if (PL_DATA[i][0] <= days && days <= PL_DATA[i+1][0]) {
        var t = (days - PL_DATA[i][0]) / (PL_DATA[i+1][0] - PL_DATA[i][0]);
        return PL_DATA[i][1] * Math.pow(PL_DATA[i+1][1] / PL_DATA[i][1], t);
      }
    }
    return null;
  }

  function seriesPriceAt(arr, date) {
    var ms = date.getTime();
    if (ms <= new Date(arr[0][0]).getTime()) return arr[0][1];
    if (ms >= new Date(arr[arr.length - 1][0]).getTime()) return arr[arr.length - 1][1];
    for (var i = 0; i < arr.length - 1; i++) {
      var t0 = new Date(arr[i][0]).getTime();
      var t1 = new Date(arr[i+1][0]).getTime();
      if (t0 <= ms && ms <= t1) {
        var t = (ms - t0) / (t1 - t0);
        return arr[i][1] * Math.pow(arr[i+1][1] / arr[i][1], t);
      }
    }
    return null;
  }

  function spPriceAt(date)  { return seriesPriceAt(SP500_TR_DATA, date); }
  function ndqPriceAt(date) { return seriesPriceAt(NDQ_TR_DATA,   date); }

  /* Power Law trend / channel at given days since genesis */
  function plTrend(days) { return PL_A * Math.pow(days, PL_B); }
  function plFloor(days) { return plTrend(days) * PL_FLOOR; }
  function plCeil(days)  { return plTrend(days) * PL_CEIL; }

  /* SVG escaping helper for safe text-content insertion */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Set target div content to a complete SVG wrapper around child markup */
  function setSvg(target, vbW, vbH, body) {
    target.innerHTML =
      '<svg viewBox="0 0 ' + vbW + ' ' + vbH + '" xmlns="http://www.w3.org/2000/svg"' +
      ' style="width:100%;height:auto;display:block" preserveAspectRatio="xMidYMid meet">' +
      body + '</svg>';
  }

  /* ═══════════════════════════════════════════════════════════
     1. MINI HEATMAP  (existing — unchanged from v1)
     ═══════════════════════════════════════════════════════════ */

  function hmTier(outperf) {
    if (outperf <= 0.5) return 'loss-deep';
    if (outperf <= 0.9) return 'loss';
    if (outperf <= 1.1) return 'flat';
    if (outperf <= 2.0) return 'win-mild';
    if (outperf <= 5.0) return 'win-mid';
    return 'win-deep';
  }
  function tierColor(tier) {
    return {
      'loss-deep': '#BE3A30', 'loss': '#6B2A23', 'flat': '#1F1F1F',
      'win-mild':  '#E0BC50', 'win-mid': '#F5C240', 'win-deep': '#F7931A',
      'future':    '#1a1a1a'
    }[tier];
  }

  function renderMiniHeatmap(target) {
    var W = 400, H = 110, ml = 22, mt = 4, mb = 10, mr = 4;
    var horizons = [12, 24, 36, 60, 84];
    var labels   = ['1y','2y','3y','5y','7y'];
    var startDates = [];
    var today = new Date();
    var d = new Date(2010, 0, 15);
    while (d < today) { startDates.push(new Date(d)); d.setMonth(d.getMonth() + 1); }
    var nCols = startDates.length, nRows = horizons.length;
    var cellW = (W - ml - mr) / nCols, cellH = (H - mt - mb) / nRows, gap = 0.5;
    var parts = [];
    for (var r = 0; r < nRows; r++) {
      var hMo = horizons[nRows - 1 - r];
      for (var c = 0; c < nCols; c++) {
        var sd = startDates[c];
        var ed = new Date(sd); ed.setMonth(ed.getMonth() + hMo);
        var x = ml + c * cellW, y = mt + r * cellH;
        var w = Math.max(cellW - gap, 0.5), h = Math.max(cellH - gap, 1);
        var tier;
        if (ed > today) { tier = 'future'; }
        else {
          var bs = btcPriceAt(daysSinceGenesisFromDate(sd));
          var be = btcPriceAt(daysSinceGenesisFromDate(ed));
          var ss = spPriceAt(sd), se = spPriceAt(ed);
          tier = (!bs || !be || !ss || !se) ? 'future' : hmTier((be/bs) / (se/ss));
        }
        parts.push('<rect x="'+x.toFixed(2)+'" y="'+y.toFixed(2)+'" width="'+w.toFixed(2)+'" height="'+h.toFixed(2)+'" fill="'+tierColor(tier)+'"/>');
      }
    }
    for (var i = 0; i < nRows; i++) {
      var lbl = labels[nRows - 1 - i];
      var ly = mt + i * cellH + cellH / 2 + 2;
      parts.push('<text x="'+(ml-3)+'" y="'+ly.toFixed(2)+'" font-size="6.5" font-family="'+FONT+'" fill="'+C.label+'" text-anchor="end">'+lbl+'</text>');
    }
    var lastYear = null;
    for (c = 0; c < nCols; c++) {
      var yr = startDates[c].getFullYear();
      if (yr !== lastYear && (yr === 2010 || yr === 2014 || yr === 2018 || yr === 2022 || yr === 2026)) {
        var xx = ml + c * cellW + cellW / 2;
        parts.push('<text x="'+xx.toFixed(2)+'" y="'+(H-1)+'" font-size="6" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="middle">'+yr+'</text>');
        lastYear = yr;
      }
    }
    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     2. MINI BVSM WEALTH CHART
     3 paths showing $10k invested in BTC / SP500 / NDQ from
     2010-07 (first reliable BTC price) to today, log-Y.
     ═══════════════════════════════════════════════════════════ */

  function renderMiniBvsmChart(target) {
    var W = 400, H = 110;
    var pl = 28, pt = 18, pr = 8, pb = 14;     // plot area margins
    var x0 = pl, x1 = W - pr;
    var y0 = pt, y1 = H - pb;

    // Compute series — monthly samples from PL_DATA[0] date to today
    var startDays = PL_DATA[0][0];                   // ~592
    var endDays   = PL_DATA[PL_DATA.length - 1][0];  // most recent
    var months = [];                                  // [{days, date, btc, sp, ndq}]
    var sd = dateFromDaysSinceGenesis(startDays);
    sd.setDate(28);
    var ed = new Date();
    var startBtc = btcPriceAt(startDays);
    var startSp  = spPriceAt(sd);
    var startNdq = ndqPriceAt(sd);
    var amount = 10000;
    var cur = new Date(sd);
    while (cur < ed) {
      var days = daysSinceGenesisFromDate(cur);
      var bp = btcPriceAt(days);
      var sp = spPriceAt(cur);
      var np = ndqPriceAt(cur);
      months.push({
        date: new Date(cur),
        btc:  amount * (bp / startBtc),
        sp:   amount * (sp / startSp),
        ndq:  amount * (np / startNdq)
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    // Find log-Y bounds (with a little headroom)
    var maxVal = 0;
    months.forEach(function(m) {
      if (m.btc > maxVal) maxVal = m.btc;
      if (m.sp  > maxVal) maxVal = m.sp;
      if (m.ndq > maxVal) maxVal = m.ndq;
    });
    var yMin = amount;                  // $10k floor
    var yMax = maxVal * 1.2;             // 20% headroom above max BTC
    var logMin = Math.log10(yMin);
    var logMax = Math.log10(yMax);

    function xPos(idx) { return x0 + (x1 - x0) * (idx / (months.length - 1)); }
    function yPos(v)   { return y1 - (y1 - y0) * (Math.log10(v) - logMin) / (logMax - logMin); }

    function buildPath(key) {
      var s = '';
      months.forEach(function(m, i) {
        s += (i === 0 ? 'M ' : 'L ') + xPos(i).toFixed(2) + ' ' + yPos(m[key]).toFixed(2) + ' ';
      });
      return s;
    }

    var parts = [];

    // Subtle gridlines (decades on log scale)
    for (var dec = Math.ceil(logMin); dec <= Math.floor(logMax); dec++) {
      var gy = yPos(Math.pow(10, dec));
      parts.push('<line x1="'+x0+'" y1="'+gy.toFixed(2)+'" x2="'+x1+'" y2="'+gy.toFixed(2)+'" stroke="'+C.grid+'" stroke-width="0.5" stroke-dasharray="2 3"/>');
    }
    // Axis frame
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Series — draw SP500 + NDQ first, BTC on top
    parts.push('<path d="'+buildPath('sp') +'" stroke="'+C.sp +'" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
    parts.push('<path d="'+buildPath('ndq')+'" stroke="'+C.ndq+'" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
    parts.push('<path d="'+buildPath('btc')+'" stroke="'+C.btc+'" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');

    // Mini legend (top-left)
    parts.push('<circle cx="'+(x0+8)+'" cy="10" r="2" fill="'+C.btc+'"/>');
    parts.push('<text x="'+(x0+14)+'" y="13" font-size="7" font-family="'+FONT+'" fill="#aaa">Bitcoin</text>');
    parts.push('<circle cx="'+(x0+90)+'" cy="10" r="2" fill="'+C.ndq+'"/>');
    parts.push('<text x="'+(x0+96)+'" y="13" font-size="7" font-family="'+FONT+'" fill="#aaa">NASDAQ-100</text>');
    parts.push('<circle cx="'+(x0+186)+'" cy="10" r="2" fill="'+C.sp+'"/>');
    parts.push('<text x="'+(x0+192)+'" y="13" font-size="7" font-family="'+FONT+'" fill="#aaa">S&amp;P 500</text>');

    // Year tick labels
    parts.push('<text x="'+x0+'" y="'+(H-3)+'" font-size="6" font-family="'+FONT+'" fill="'+C.lblDim+'">2010</text>');
    parts.push('<text x="'+((x0+x1)/2).toFixed(2)+'" y="'+(H-3)+'" font-size="6" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="middle">2018</text>');
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="6" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">2026</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     3. MINI POWER LAW  (log-log scatter + trend line)
     ═══════════════════════════════════════════════════════════ */

  function renderMiniPowerLaw(target) {
    var W = 200, H = 120, pl = 16, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    // Domain: log days from PL_DATA[0] to last, log prices from min to max + headroom
    var startDays = PL_DATA[0][0];
    var endDays   = PL_DATA[PL_DATA.length - 1][0];
    // Extend trend line slightly past today + 2 yrs for slope continuity
    var trendEndDays = endDays + 730;
    var xLogMin = Math.log10(startDays);
    var xLogMax = Math.log10(trendEndDays);
    // Y bounds: from min observed price to max observed (+ trend at trendEnd)
    var yMaxObs = 0, yMinObs = Infinity;
    PL_DATA.forEach(function(p) {
      if (p[1] > yMaxObs) yMaxObs = p[1];
      if (p[1] < yMinObs) yMinObs = p[1];
    });
    var yLogMin = Math.log10(yMinObs * 0.5);
    var yLogMax = Math.log10(Math.max(yMaxObs, plTrend(trendEndDays)) * 1.2);

    function xPos(days)  { return x0 + (x1 - x0) * (Math.log10(days)  - xLogMin) / (xLogMax - xLogMin); }
    function yPos(price) { return y1 - (y1 - y0) * (Math.log10(price) - yLogMin) / (yLogMax - yLogMin); }

    var parts = [];

    // Frame
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Trend line (PL_A * d^PL_B) — straight line on log-log
    var d1 = startDays, d2 = trendEndDays;
    parts.push('<line x1="'+xPos(d1).toFixed(2)+'" y1="'+yPos(plTrend(d1)).toFixed(2)+'" x2="'+xPos(d2).toFixed(2)+'" y2="'+yPos(plTrend(d2)).toFixed(2)+'" stroke="'+C.btc+'" stroke-width="1.4" stroke-linecap="round"/>');

    // Channel floor + ceil — dashed
    parts.push('<line x1="'+xPos(d1).toFixed(2)+'" y1="'+yPos(plFloor(d1)).toFixed(2)+'" x2="'+xPos(d2).toFixed(2)+'" y2="'+yPos(plFloor(d2)).toFixed(2)+'" stroke="'+C.btcDim+'" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.6"/>');
    parts.push('<line x1="'+xPos(d1).toFixed(2)+'" y1="'+yPos(plCeil(d1)).toFixed(2)+'"  x2="'+xPos(d2).toFixed(2)+'" y2="'+yPos(plCeil(d2)).toFixed(2)+'"  stroke="'+C.btcDim+'" stroke-width="0.6" stroke-dasharray="2 2" opacity="0.6"/>');

    // Scatter — every 4th PL_DATA point to keep mini uncluttered
    for (var i = 0; i < PL_DATA.length; i += 4) {
      var p = PL_DATA[i];
      parts.push('<circle cx="'+xPos(p[0]).toFixed(2)+'" cy="'+yPos(p[1]).toFixed(2)+'" r="0.9" fill="'+C.btcDim+'" opacity="0.85"/>');
    }

    // Axis labels (tiny)
    parts.push('<text x="'+(x0-1)+'" y="'+(y0+5)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">$100k</text>');
    parts.push('<text x="'+(x0-1)+'" y="'+(y1-1)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">$0.1</text>');
    parts.push('<text x="'+x0+'"     y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'">log(days)</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     4. MINI RETIREMENT  (forward PL projection, next 25 years)
     ═══════════════════════════════════════════════════════════ */

  function renderMiniRetirement(target) {
    var W = 200, H = 120, pl = 22, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    // Today + 25 years ahead. Linear time on X, log-Y for price.
    var today = new Date();
    var todayDays = daysSinceGenesisFromDate(today);
    var horizonYears = 25;
    var endDays = todayDays + horizonYears * 365.25;

    // Y bounds: from today's floor to horizon's ceil (with headroom)
    var yMinPrice = plFloor(todayDays) * 0.7;
    var yMaxPrice = plCeil(endDays)    * 1.1;
    var logMin = Math.log10(yMinPrice);
    var logMax = Math.log10(yMaxPrice);

    function xPos(days)  { return x0 + (x1 - x0) * (days - todayDays) / (endDays - todayDays); }
    function yPos(price) { return y1 - (y1 - y0) * (Math.log10(price) - logMin) / (logMax - logMin); }

    var parts = [];

    // Frame
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Build floor / trend / ceil paths
    var nSteps = 30;
    function buildBandPath(fn) {
      var s = '';
      for (var i = 0; i <= nSteps; i++) {
        var t = i / nSteps;
        var d = todayDays + t * (endDays - todayDays);
        s += (i === 0 ? 'M ' : 'L ') + xPos(d).toFixed(2) + ' ' + yPos(fn(d)).toFixed(2) + ' ';
      }
      return s;
    }

    // Filled band between floor and ceil
    var floorStr = '', ceilStr = '';
    for (var i = 0; i <= nSteps; i++) {
      var t = i / nSteps;
      var d = todayDays + t * (endDays - todayDays);
      floorStr += (i === 0 ? 'M ' : 'L ') + xPos(d).toFixed(2) + ' ' + yPos(plFloor(d)).toFixed(2) + ' ';
    }
    for (i = nSteps; i >= 0; i--) {
      t = i / nSteps;
      d = todayDays + t * (endDays - todayDays);
      ceilStr += 'L ' + xPos(d).toFixed(2) + ' ' + yPos(plCeil(d)).toFixed(2) + ' ';
    }
    parts.push('<path d="'+floorStr+ceilStr+'Z" fill="'+C.btc+'" fill-opacity="0.08"/>');

    // Dashed floor + ceil lines
    parts.push('<path d="'+buildBandPath(plFloor)+'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.6"/>');
    parts.push('<path d="'+buildBandPath(plCeil) +'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.6"/>');
    // Trend line
    parts.push('<path d="'+buildBandPath(plTrend)+'" stroke="'+C.btc+'" stroke-width="1.6" fill="none" stroke-linecap="round"/>');

    // Today marker
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.btc+'" stroke-width="0.8" opacity="0.5"/>');
    parts.push('<text x="'+(x0+1)+'" y="'+(y0+6)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.btc+'">today</text>');

    // Horizon end label
    var endYear = today.getFullYear() + horizonYears;
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">+'+horizonYears+'y</text>');

    // Price labels
    var trendEndK = (plTrend(endDays) / 1000).toFixed(0);
    parts.push('<text x="'+(x0-2)+'" y="'+(y0+5)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">$'+trendEndK+'k</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(y1-1)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">$'+(plFloor(todayDays)/1000).toFixed(0)+'k</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     5. MINI REBALANCING  (channel + recent price + markers)
     Recent 6 years of BTC price overlaid on the PL channel,
     highlighting where price touched / crossed the upper or
     lower bands — the protocol's trigger conditions.
     ═══════════════════════════════════════════════════════════ */

  function renderMiniRebalancing(target) {
    var W = 200, H = 120, pl = 22, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    var today = new Date();
    var todayDays = daysSinceGenesisFromDate(today);
    var startDays = todayDays - 6 * 365.25;     // 6-year lookback
    // Find PL_DATA samples in range
    var samples = PL_DATA.filter(function(p) { return p[0] >= startDays && p[0] <= todayDays; });

    var yMinPrice = Math.min(plFloor(startDays), plFloor(todayDays)) * 0.85;
    var yMaxPrice = Math.max(plCeil(startDays),  plCeil(todayDays))  * 1.05;
    // Also account for actual prices in case they swing outside the band
    samples.forEach(function(p) {
      if (p[1] < yMinPrice) yMinPrice = p[1] * 0.9;
      if (p[1] > yMaxPrice) yMaxPrice = p[1] * 1.05;
    });
    var logMin = Math.log10(yMinPrice);
    var logMax = Math.log10(yMaxPrice);

    function xPos(days)  { return x0 + (x1 - x0) * (days - startDays) / (todayDays - startDays); }
    function yPos(price) { return y1 - (y1 - y0) * (Math.log10(price) - logMin) / (logMax - logMin); }

    var parts = [];
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Channel lines
    var nSteps = 20;
    function bandPath(fn) {
      var s = '';
      for (var i = 0; i <= nSteps; i++) {
        var t = i / nSteps;
        var d = startDays + t * (todayDays - startDays);
        s += (i === 0 ? 'M ' : 'L ') + xPos(d).toFixed(2) + ' ' + yPos(fn(d)).toFixed(2) + ' ';
      }
      return s;
    }
    parts.push('<path d="'+bandPath(plCeil) +'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.65"/>');
    parts.push('<path d="'+bandPath(plTrend)+'" stroke="'+C.btcDim+'" stroke-width="0.6" fill="none" opacity="0.4"/>');
    parts.push('<path d="'+bandPath(plFloor)+'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.65"/>');

    // Actual price path
    var priceStr = '';
    samples.forEach(function(p, idx) {
      priceStr += (idx === 0 ? 'M ' : 'L ') + xPos(p[0]).toFixed(2) + ' ' + yPos(p[1]).toFixed(2) + ' ';
    });
    parts.push('<path d="'+priceStr+'" stroke="'+C.btc+'" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');

    // Rebalance markers — find points where price/ceil > 0.85 (sell trigger zone)
    // or price/floor < 1.15 (rebuy trigger zone)
    samples.forEach(function(p) {
      var ratioCeil  = p[1] / plCeil(p[0]);
      var ratioFloor = p[1] / plFloor(p[0]);
      if (ratioCeil > 0.85) {
        parts.push('<path d="M '+xPos(p[0]).toFixed(2)+' '+(yPos(p[1])-3).toFixed(2)+' l 2 -3 l -4 0 Z" fill="'+C.btc+'"/>');
      } else if (ratioFloor < 1.18) {
        parts.push('<path d="M '+xPos(p[0]).toFixed(2)+' '+(yPos(p[1])+3).toFixed(2)+' l 2 3 l -4 0 Z" fill="'+C.btc+'"/>');
      }
    });

    // Tiny corner labels
    parts.push('<text x="'+(x0-2)+'" y="'+(y0+5)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">ceil</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(y1-1)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">floor</text>');
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">6y</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     6. MINI HORIZON  (long-range PL projection, 40 years)
     ═══════════════════════════════════════════════════════════ */

  function renderMiniHorizon(target) {
    var W = 200, H = 120, pl = 26, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    var today = new Date();
    var todayDays = daysSinceGenesisFromDate(today);
    // Show recent ~8y of history + 32y of projection
    var startDays = todayDays - 8 * 365.25;
    var horizonYears = 32;
    var endDays = todayDays + horizonYears * 365.25;

    var yMinPrice = Math.min(plFloor(startDays), plFloor(todayDays)) * 0.85;
    var yMaxPrice = plCeil(endDays) * 1.1;
    PL_DATA.forEach(function(p) {
      if (p[0] >= startDays && p[1] < yMinPrice) yMinPrice = p[1] * 0.85;
    });
    var logMin = Math.log10(yMinPrice);
    var logMax = Math.log10(yMaxPrice);

    function xPos(days)  { return x0 + (x1 - x0) * (days - startDays) / (endDays - startDays); }
    function yPos(price) { return y1 - (y1 - y0) * (Math.log10(price) - logMin) / (logMax - logMin); }

    var parts = [];
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    var nSteps = 40;
    function band(fn) {
      var s = '';
      for (var i = 0; i <= nSteps; i++) {
        var t = i / nSteps;
        var d = startDays + t * (endDays - startDays);
        s += (i === 0 ? 'M ' : 'L ') + xPos(d).toFixed(2) + ' ' + yPos(fn(d)).toFixed(2) + ' ';
      }
      return s;
    }
    // Filled band between floor + ceil (projection region only)
    var fillPath = '';
    for (var i = 0; i <= nSteps; i++) {
      var tt = i / nSteps;
      var dd = startDays + tt * (endDays - startDays);
      if (dd < todayDays) continue;
      fillPath += (fillPath === '' ? 'M ' : 'L ') + xPos(dd).toFixed(2) + ' ' + yPos(plFloor(dd)).toFixed(2) + ' ';
    }
    for (i = nSteps; i >= 0; i--) {
      tt = i / nSteps;
      dd = startDays + tt * (endDays - startDays);
      if (dd < todayDays) break;
      fillPath += 'L ' + xPos(dd).toFixed(2) + ' ' + yPos(plCeil(dd)).toFixed(2) + ' ';
    }
    if (fillPath) parts.push('<path d="'+fillPath+'Z" fill="'+C.btc+'" fill-opacity="0.10"/>');

    parts.push('<path d="'+band(plFloor)+'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.6"/>');
    parts.push('<path d="'+band(plCeil) +'" stroke="'+C.btcDim+'" stroke-width="0.7" stroke-dasharray="2 2" fill="none" opacity="0.6"/>');
    parts.push('<path d="'+band(plTrend)+'" stroke="'+C.btc+'" stroke-width="1.5" fill="none" stroke-linecap="round"/>');

    // Recent price points (historical, before today)
    var recent = PL_DATA.filter(function(p) { return p[0] >= startDays && p[0] <= todayDays; });
    var rs = '';
    recent.forEach(function(p, idx) {
      rs += (idx === 0 ? 'M ' : 'L ') + xPos(p[0]).toFixed(2) + ' ' + yPos(p[1]).toFixed(2) + ' ';
    });
    if (rs) parts.push('<path d="'+rs+'" stroke="'+C.btc+'" stroke-width="1.1" fill="none" opacity="0.6" stroke-linejoin="round"/>');

    // Today divider
    parts.push('<line x1="'+xPos(todayDays).toFixed(2)+'" y1="'+y0+'" x2="'+xPos(todayDays).toFixed(2)+'" y2="'+y1+'" stroke="'+C.label+'" stroke-width="0.6" stroke-dasharray="1 2" opacity="0.55"/>');
    parts.push('<text x="'+(xPos(todayDays)+2).toFixed(2)+'" y="'+(y0+6)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.label+'">today</text>');

    // Range labels
    var endYear = today.getFullYear() + horizonYears;
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">'+endYear+'</text>');
    parts.push('<text x="'+x0+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'">'+(today.getFullYear()-8)+'</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     7. MINI HALF-LIFE  (purchasing power decay curve)
     Pure math: PP(t) = (1 - inflation_rate)^t, with reference
     markers at ½ (~20y) and ¼ (~40y) assuming ~3.5% inflation.
     ═══════════════════════════════════════════════════════════ */

  function renderMiniHalfLife(target) {
    var W = 200, H = 120, pl = 22, pt = 8, pr = 6, pb = 14;
    var x0 = pl, x1 = W - pr, y0 = pt, y1 = H - pb;

    var inflationRate = 0.035;   // ~3.5% annual
    var horizonYears = 80;
    var halfLifeYears = Math.log(0.5) / Math.log(1 - inflationRate);   // ~19.5 years

    function xPos(years) { return x0 + (x1 - x0) * (years / horizonYears); }
    function yPos(pp)    { return y1 - (y1 - y0) * pp; }  // 1.0 at top, 0 at bottom

    var parts = [];
    parts.push('<line x1="'+x0+'" y1="'+y0+'" x2="'+x0+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');
    parts.push('<line x1="'+x0+'" y1="'+y1+'" x2="'+x1+'" y2="'+y1+'" stroke="'+C.grid+'" stroke-width="0.5"/>');

    // Reference horizontals
    parts.push('<line x1="'+x0+'" y1="'+yPos(0.5).toFixed(2) +'" x2="'+x1+'" y2="'+yPos(0.5).toFixed(2) +'" stroke="'+C.gridLt+'" stroke-width="0.5" stroke-dasharray="2 2"/>');
    parts.push('<line x1="'+x0+'" y1="'+yPos(0.25).toFixed(2)+'" x2="'+x1+'" y2="'+yPos(0.25).toFixed(2)+'" stroke="'+C.gridLt+'" stroke-width="0.5" stroke-dasharray="2 2"/>');
    parts.push('<line x1="'+x0+'" y1="'+yPos(0.125).toFixed(2)+'" x2="'+x1+'" y2="'+yPos(0.125).toFixed(2)+'" stroke="'+C.gridLt+'" stroke-width="0.5" stroke-dasharray="2 2"/>');

    // Decay curve
    var nSteps = 40;
    var pathStr = '';
    for (var i = 0; i <= nSteps; i++) {
      var t = (i / nSteps) * horizonYears;
      var pp = Math.pow(1 - inflationRate, t);
      pathStr += (i === 0 ? 'M ' : 'L ') + xPos(t).toFixed(2) + ' ' + yPos(pp).toFixed(2) + ' ';
    }
    parts.push('<path d="'+pathStr+'" stroke="'+C.btc+'" stroke-width="1.7" fill="none" stroke-linecap="round"/>');

    // Y labels
    parts.push('<text x="'+(x0-2)+'" y="'+(y0+5)+'" font-size="6" font-family="'+FONT+'" fill="'+C.btc+'" text-anchor="end">$1</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(yPos(0.5)+2).toFixed(2)+'"  font-size="5.5" font-family="'+FONT+'" fill="'+C.label+'" text-anchor="end">½</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(yPos(0.25)+2).toFixed(2)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.label+'" text-anchor="end">¼</text>');
    parts.push('<text x="'+(x0-2)+'" y="'+(yPos(0.125)+2).toFixed(2)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.label+'" text-anchor="end">⅛</text>');

    // X labels
    parts.push('<text x="'+x0+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'">today</text>');
    parts.push('<text x="'+x1+'" y="'+(H-3)+'" font-size="5.5" font-family="'+FONT+'" fill="'+C.lblDim+'" text-anchor="end">+'+horizonYears+'y</text>');

    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     LUMP SUM OR LADDER IN — the advantage curve "flip"
     ═══════════════════════════════════════════════════════════ */

  function renderMiniLumpVsDca(target) {
    var W = 400, H = 110, ml = 24, mt = 10, mb = 16, mr = 10;
    var LF = Math.log(PL_FLOOR), LC = Math.log(PL_CEIL), SPAN = LC - LF;
    var N = PL_DATA.length, ladderN = 30;
    function posOf(p, d) { return (Math.log(p / plTrend(d)) - LF) / SPAN; }
    var pos = []; for (var i = 0; i < N; i++) pos.push(posOf(PL_DATA[i][1], PL_DATA[i][0]));
    function adv(idx) {
      if (idx + ladderN - 1 > N - 1) return null;
      var lump = 1 / PL_DATA[idx][1], dca = 0;
      for (var k = 0; k < ladderN; k++) dca += (1 / ladderN) / PL_DATA[idx + k][1];
      return (dca / lump - 1) * 100;
    }
    var pts = [];
    for (var g = 0; g <= 1.0001; g += 0.05) {
      var vals = [];
      for (var j = 0; j < N; j++) { if (Math.abs(pos[j] - g) > 0.08) continue; var a = adv(j); if (a !== null) vals.push(a); }
      if (vals.length >= 4) { var m = 0; for (var v = 0; v < vals.length; v++) m += vals[v]; pts.push({ g: g, y: m / vals.length }); }
    }
    if (pts.length < 2) { target.innerHTML = ''; return; }
    var ymin = Infinity, ymax = -Infinity;
    pts.forEach(function (p) { if (p.y < ymin) ymin = p.y; if (p.y > ymax) ymax = p.y; });
    ymin = Math.min(ymin, -5); ymax = Math.max(ymax, 5);
    var pd = (ymax - ymin) * 0.12; ymin -= pd; ymax += pd;
    function X(g) { return ml + g * (W - ml - mr); }
    function Y(y) { return mt + (1 - (y - ymin) / (ymax - ymin)) * (H - mt - mb); }
    var parts = [];
    var y0 = Y(0);
    parts.push('<line x1="' + ml + '" y1="' + y0.toFixed(1) + '" x2="' + (W - mr) + '" y2="' + y0.toFixed(1) + '" stroke="' + C.gridLt + '" stroke-width="0.6" stroke-dasharray="2 2"/>');
    for (var p2 = 0; p2 < pts.length - 1; p2++) {
      var a0 = pts[p2], b0 = pts[p2 + 1], col = ((a0.y + b0.y) / 2 < 0) ? '#e09422' : '#6db3d4';
      parts.push('<line x1="' + X(a0.g).toFixed(1) + '" y1="' + Y(a0.y).toFixed(1) + '" x2="' + X(b0.g).toFixed(1) + '" y2="' + Y(b0.y).toFixed(1) + '" stroke="' + col + '" stroke-width="1.9"/>');
    }
    parts.push('<text x="' + ml + '" y="' + (H - 3) + '" font-size="6.5" font-family="' + FONT + '" fill="' + C.label + '">Floor</text>');
    parts.push('<text x="' + (W - mr) + '" y="' + (H - 3) + '" font-size="6.5" font-family="' + FONT + '" fill="' + C.label + '" text-anchor="end">Upper</text>');
    parts.push('<text x="3" y="' + Math.max(mt + 6, Y(ymax * 0.6)).toFixed(1) + '" font-size="6" font-family="' + FONT + '" fill="#6db3d4">ladder</text>');
    parts.push('<text x="3" y="' + Math.min(H - mb, Y(ymin * 0.6)).toFixed(1) + '" font-size="6" font-family="' + FONT + '" fill="#e09422">lump</text>');
    setSvg(target, W, H, parts.join(''));
  }

  /* ═══════════════════════════════════════════════════════════
     INIT — find each target div and run its renderer
     ═══════════════════════════════════════════════════════════ */

  var RENDERERS = {
    'mini-heatmap':      renderMiniHeatmap,
    'mini-bvsm-chart':   renderMiniBvsmChart,
    'mini-power-law':    renderMiniPowerLaw,
    'mini-retirement':   renderMiniRetirement,
    'mini-rebalancing':  renderMiniRebalancing,
    'mini-horizon':      renderMiniHorizon,
    'mini-half-life':    renderMiniHalfLife,
    'mini-lump-vs-dca':  renderMiniLumpVsDca
  };

  function init() {
    if (typeof PL_DATA === 'undefined' || typeof GENESIS_TS === 'undefined' ||
        typeof PL_A === 'undefined') {
      console.warn('calculators-minis: required globals not loaded');
      return;
    }
    Object.keys(RENDERERS).forEach(function(id) {
      var target = document.getElementById(id);
      if (!target) return;
      try {
        RENDERERS[id](target);
      } catch (e) {
        console.error('mini render failed:', id, e);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
