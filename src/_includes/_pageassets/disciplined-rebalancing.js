// ═══════════════════════════════════════════════════════════════════
// DISCIPLINED REBALANCING — page logic
//
// Three-tab page: Question / Calculator / Math. This file handles
// tab routing + the Calculator's full math engine (percentile
// computation, trigger detection state machine, cycle accumulation,
// tax drag, conditional projection) + UI wiring (sliders, presets,
// stickiness, output rendering).
//
// Math primitives per DISCIPLINED_REBALANCING_DESIGN.md §4. Output
// rendering per §5. Stickiness per §8.2 (per-calculator persistence,
// stack excluded — it's never written to localStorage).
//
// PL_DATA + Power Law constants are embedded here. They're also
// embedded in /the-power-law.js (canonical source) and inline in
// /bitcoin-vs-real-estate.js. The fourth-page TECH_DEBT trigger to
// promote these to /shared/power-law.js is now active — see PHASE4
// follow-up notes.
// ═══════════════════════════════════════════════════════════════════

// ═══════ POWER LAW CONSTANTS ═══════
var PL_A = 1.6e-17, PL_B = 5.77, PL_FLOOR = 0.42, PL_CEIL = 3.0;
var GENESIS_TS = 1230940800; // Jan 3, 2009 UTC in seconds
function plPrice(days){ return PL_A * Math.pow(days, PL_B); }

var PL_DATA=[[592.0,0.07],[604.0,0.07],[616.0,0.06],[628.0,0.06],[640.0,0.06],[652.0,0.11],[664.0,0.19],[676.0,0.32],[688.0,0.29],[700.0,0.26],[712.0,0.25],[724.0,0.27],[736.0,0.32],[748.0,0.38],[760.0,0.92],[772.0,1.08],[784.0,1.0],[796.0,0.88],[808.0,0.79],[820.0,0.8],[832.0,0.98],[844.0,1.78],[856.0,3.91],[868.0,6.98],[880.0,9.67],[892.0,23.66],[904.0,17.58],[916.0,16.1],[928.0,14.54],[940.0,14.58],[952.0,9.93],[964.0,11.3],[976.0,8.27],[988.0,5.02],[1000.0,4.94],[1012.0,4.16],[1024.0,3.32],[1036.0,3.22],[1048.0,2.6],[1060.0,2.64],[1072.0,3.12],[1084.0,3.98],[1096.0,5.37],[1108.0,7.04],[1120.0,5.7],[1132.0,5.84],[1144.0,4.5],[1156.0,4.81],[1168.0,5.44],[1180.0,4.77],[1192.0,4.8],[1204.0,5.24],[1216.0,5.18],[1228.0,5.05],[1240.0,5.15],[1252.0,5.56],[1264.0,6.56],[1276.0,6.71],[1288.0,7.85],[1300.0,8.8],[1312.0,11.23],[1324.0,14.48],[1336.0,10.91],[1348.0,11.24],[1360.0,12.28],[1372.0,12.97],[1384.0,11.98],[1396.0,10.93],[1408.0,10.95],[1420.0,12.32],[1432.0,13.09],[1444.0,13.63],[1456.0,13.65],[1468.0,13.99],[1480.0,17.13],[1492.0,21.0],[1504.0,27.2],[1516.0,31.2],[1528.0,45.6],[1540.0,70.25],[1552.0,131.0],[1564.0,68.1],[1576.0,128.5],[1588.0,112.69],[1600.0,122.7],[1612.0,122.42],[1624.0,99.98],[1636.0,104.0],[1648.0,76.49],[1660.0,89.39],[1672.0,104.62],[1684.0,109.35],[1696.0,113.28],[1708.0,117.61],[1720.0,127.12],[1732.0,126.25],[1744.0,127.59],[1756.0,195.33],[1768.0,252.59],[1780.0,475.0],[1792.0,1133.95],[1804.0,876.88],[1816.0,659.99],[1828.0,828.74],[1840.0,817.15],[1852.0,785.6],[1864.0,687.37],[1876.0,579.5],[1888.0,670.7],[1900.0,624.71],[1912.0,490.0],[1924.0,369.0],[1936.0,488.52],[1948.0,436.75],[1960.0,449.12],[1972.0,581.0],[1984.0,648.81],[1996.0,590.96],[2008.0,645.35],[2020.0,624.07],[2032.0,593.68],[2044.0,588.98],[2056.0,518.82],[2068.0,476.36],[2080.0,476.92],[2092.0,410.19],[2104.0,334.06],[2116.0,389.44],[2128.0,337.79],[2140.0,420.19],[2152.0,374.58],[2164.0,375.05],[2176.0,312.26],[2188.0,311.0],[2200.0,269.68],[2212.0,233.71],[2224.0,226.71],[2236.0,234.5],[2248.0,253.5],[2260.0,294.9],[2272.0,245.0],[2284.0,260.52],[2296.0,222.64],[2308.0,225.62],[2320.0,240.95],[2332.0,237.76],[2344.0,222.88],[2356.0,249.98],[2368.0,248.57],[2380.0,284.92],[2392.0,277.97],[2404.0,281.12],[2416.0,261.43],[2428.0,225.11],[2440.0,244.21],[2452.0,230.16],[2464.0,237.77],[2476.0,252.47],[2488.0,286.69],[2500.0,387.02],[2512.0,325.9],[2524.0,362.58],[2536.0,433.39],[2548.0,455.5],[2560.0,429.26],[2572.0,385.49],[2584.0,376.6],[2596.0,378.02],[2608.0,419.25],[2620.0,405.69],[2632.0,407.96],[2644.0,413.74],[2656.0,422.63],[2668.0,451.92],[2680.0,449.37],[2692.0,453.08],[2704.0,511.3],[2716.0,577.95],[2728.0,592.81],[2740.0,681.98],[2752.0,661.32],[2764.0,655.54],[2776.0,584.98],[2788.0,577.24],[2800.0,572.0],[2812.0,608.99],[2824.0,606.79],[2836.0,614.46],[2848.0,628.89],[2860.0,726.6],[2872.0,700.38],[2884.0,737.07],[2896.0,766.48],[2908.0,791.03],[2920.0,964.84],[2932.0,805.52],[2944.0,883.59],[2956.0,1011.08],[2968.0,1054.55],[2980.0,1224.98],[2992.0,1240.72],[3004.0,961.81],[3016.0,1193.73],[3028.0,1201.2],[3040.0,1354.8],[3052.0,1692.88],[3064.0,2421.49],[3076.0,2699.12],[3088.0,2629.76],[3100.0,2541.69],[3112.0,2310.93],[3124.0,2748.36],[3136.0,2856.52],[3148.0,4375.8],[3160.0,4376.66],[3172.0,4330.87],[3184.0,3600.92],[3196.0,4308.33],[3208.0,5691.69],[3220.0,5769.89],[3232.0,7468.44],[3244.0,8242.81],[3256.0,10912.87],[3268.0,16408.15],[3280.0,15677.99],[3292.0,16192.91],[3304.0,11506.51],[3316.0,10204.0],[3328.0,8895.72],[3340.0,9699.76],[3352.0,9324.5],[3364.0,8909.95],[3376.0,6827.54],[3388.0,7895.25],[3400.0,8870.14],[3412.0,9369.16],[3424.0,8242.07],[3436.0,7489.66],[3448.0,6553.0],[3460.0,6157.04],[3472.0,6628.59],[3484.0,7371.11],[3496.0,8171.49],[3508.0,6227.85],[3520.0,6525.96],[3532.0,7359.19],[3544.0,6497.37],[3556.0,6628.66],[3568.0,6581.07],[3580.0,6493.89],[3592.0,6361.3],[3604.0,5658.73],[3616.0,3828.45],[3628.0,3588.44],[3640.0,3899.83],[3652.0,3931.31],[3664.0,3682.48],[3676.0,3576.3],[3688.0,3394.76],[3700.0,3926.53],[3712.0,3814.58],[3724.0,3936.5],[3736.0,4048.51],[3748.0,5268.71],[3760.0,5309.28],[3772.0,5390.16],[3784.0,7992.69],[3796.0,8744.42],[3808.0,7998.29],[3820.0,9281.7],[3832.0,10578.72],[3844.0,11389.1],[3856.0,9875.17],[3868.0,11465.67],[3880.0,10317.6],[3892.0,9577.99],[3904.0,10159.32],[3916.0,9683.38],[3928.0,8147.69],[3940.0,8076.78],[3952.0,9433.35],[3964.0,9037.12],[3976.0,7286.35],[3988.0,7192.85],[4000.0,6879.54],[4012.0,7301.07],[4024.0,7817.92],[4036.0,8722.26],[4048.0,9314.56],[4060.0,10368.53],[4072.0,8785.52],[4084.0,7931.94],[4096.0,6189.85],[4108.0,6809.11],[4120.0,6871.95],[4132.0,7699.27],[4144.0,9821.8],[4156.0,9510.67],[4168.0,10204.23],[4180.0,9473.5],[4192.0,9240.85],[4204.0,9256.23],[4216.0,9214.66],[4228.0,11343.88],[4240.0,11573.11],[4252.0,11763.93],[4264.0,10159.62],[4276.0,10943.89],[4288.0,10840.8],[4300.0,11376.61],[4312.0,12944.52],[4324.0,14155.59],[4336.0,16725.15],[4348.0,17732.42],[4360.0,18247.76],[4372.0,23824.99],[4384.0,33000.78],[4396.0,36828.52],[4408.0,30419.17],[4420.0,46364.3],[4432.0,56001.2],[4444.0,48448.91],[4456.0,56872.38],[4468.0,55783.71],[4480.0,58102.58],[4492.0,53808.8],[4504.0,57213.33],[4516.0,46736.58],[4528.0,38445.29],[4540.0,33450.19],[4552.0,35592.35],[4564.0,33856.86],[4576.0,32814.61],[4588.0,37318.14],[4600.0,44634.13],[4612.0,46734.65],[4624.0,47155.87],[4636.0,46059.12],[4648.0,42815.56],[4660.0,55343.76],[4672.0,61971.59],[4684.0,61731.29],[4696.0,64838.81],[4708.0,57578.22],[4720.0,49380.43],[4732.0,46173.51],[4744.0,46408.87],[4756.0,41849.0],[4768.0,35071.43],[4780.0,37092.4],[4792.0,44536.2],[4804.0,37704.56],[4816.0,38741.04],[4828.0,42905.06],[4840.0,46611.26],[4852.0,40388.78],[4864.0,39770.04],[4876.0,31003.93],[4888.0,30278.94],[4900.0,29681.76],[4912.0,22550.79],[4924.0,20702.23],[4936.0,21582.6],[4948.0,23154.09],[4960.0,22981.77],[4972.0,24314.89],[4984.0,20233.32],[4996.0,19280.08],[5008.0,19542.2],[5020.0,19314.69],[5032.0,19383.33],[5044.0,20101.27],[5056.0,20920.33],[5068.0,16683.22],[5080.0,17170.62],[5092.0,17206.87],[5104.0,16838.1],[5116.0,16826.41],[5128.0,21145.18],[5140.0,23755.85],[5152.0,21638.55],[5164.0,24185.67],[5176.0,22410.62],[5188.0,26975.39],[5200.0,28033.06],[5212.0,30234.98],[5224.0,27590.55],[5236.0,29535.38],[5248.0,27398.27],[5260.0,27744.66],[5272.0,25852.82],[5284.0,29903.73],[5296.0,30774.87],[5308.0,30240.28],[5320.0,29316.12],[5332.0,29565.82],[5344.0,26123.41],[5356.0,25869.09],[5368.0,26536.02],[5380.0,26212.82],[5392.0,27937.18],[5404.0,29682.6],[5416.0,35440.51],[5428.0,36497.35],[5440.0,37800.94],[5452.0,43298.7],[5464.0,42262.62],[5476.0,42249.69],[5488.0,42843.98],[5500.0,40068.49],[5512.0,42653.29],[5524.0,51685.35],[5536.0,61172.49],[5548.0,71489.22],[5560.0,67226.33],[5572.0,67857.42],[5584.0,61280.51],[5596.0,63832.72],[5608.0,60805.78],[5620.0,67942.23],[5632.0,70553.24],[5644.0,66636.85],[5656.0,60315.67],[5668.0,57743.11],[5680.0,67597.26],[5692.0,60676.68],[5704.0,57523.47],[5716.0,59466.82],[5728.0,54857.17],[5740.0,63213.19],[5752.0,60639.47],[5764.0,66048.56],[5776.0,67018.78],[5788.0,75926.31],[5800.0,92369.46],[5812.0,97273.62],[5824.0,101467.53],[5836.0,99300.12],[5848.0,102253.31],[5860.0,104408.89],[5872.0,104743.97],[5884.0,95752.0],[5896.0,96274.79],[5908.0,86745.52],[5920.0,86867.58],[5932.0,82531.15],[5944.0,85283.27],[5956.0,93970.77],[5968.0,96818.39],[5980.0,106424.76],[5992.0,104027.67],[6004.0,108688.52],[6016.0,105380.3],[6028.0,108243.13],[6040.0,119276.85],[6052.0,117925.55],[6064.0,119295.42],[6076.0,116866.95],[6088.0,111737.55],[6100.0,115402.4],[6112.0,109688.85],[6124.0,121684.39],[6136.0,108448.06],[6148.0,110601.99],[6160.0,94399.23],[6172.0,90517.55],[6184.0,90643.57],[6196.0,88337.41],[6208.0,88735.0],[6220.0,95333.81],[6232.0,86570.94],[6244.0,70520.32],[6256.0,66427.8],[6268.0,68775.78],[6280.0,71218.64],[6292.0,68779.41],[6304.0,71949.58]];

// ═══════ TAB ROUTING ═══════
(function(){
  var btns = document.querySelectorAll('.tab-btn');
  if(!btns.length) return;
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      btns.forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(t){
        t.classList.remove('active');
      });
      var tab = document.getElementById('tab-' + b.dataset.tab);
      if(tab) tab.classList.add('active');
      history.replaceState(null, '', '#' + b.dataset.tab);
    });
  });
  var hash = location.hash.replace('#','');
  if(hash){
    var target = document.querySelector('[data-tab="'+hash+'"]');
    if(target) target.click();
  }
})();

// ═══════ MATH TAB CHART ═══════
// Companion chart for the Math tab: historical price/trend ratio
// across all of PL_DATA, with horizontal reference lines at canonical
// percentile thresholds. Renders lazily — only when the Math tab
// becomes active, to avoid Chart.js startup cost on initial page load.
(function(){
  var rendered = false;
  var canvas = document.getElementById('drMathChart');
  if(!canvas) return;

  function render(){
    if(rendered) return;
    rendered = true;
    if(typeof Chart === 'undefined') return;

    // Build the historical ratio series from PL_DATA.
    // X values are days-from-genesis (raw PL_DATA[i][0]), matching the
    // Power Law Channel chart's pattern. Linear x-axis + tick callback
    // formats years — avoids the chartjs date-adapter dependency that
    // 'type: time' would require (not loaded site-wide).
    var ratioSeries = [];
    for(var i = 0; i < PL_DATA.length; i++){
      var d = PL_DATA[i][0], p = PL_DATA[i][1];
      var trend = plPrice(d);
      if(trend > 0){
        ratioSeries.push({
          x: d,
          y: p / trend
        });
      }
    }

    // Horizontal reference percentile lines — values match the
    // canonical thresholds documented in the percentile table above.
    var refs = [
      { y: 0.87, label: '50th — historical median', color: 'rgba(255,255,255,0.25)' },
      { y: 1.34, label: '70th', color: 'rgba(224,148,34,0.35)' },
      { y: 1.78, label: '80th', color: 'rgba(224,148,34,0.55)' },
      { y: 2.83, label: '90th', color: 'rgba(224,148,34,0.75)' }
    ];

    // Build datasets: one for the historical ratio line, plus
    // straight horizontal lines for each reference percentile.
    // Each reference is rendered as a 2-point dataset spanning the
    // x-domain at constant y.
    var xMin = ratioSeries[0].x;
    var xMax = ratioSeries[ratioSeries.length-1].x;
    var refDatasets = refs.map(function(r){
      return {
        label: r.label,
        data: [{x: xMin, y: r.y}, {x: xMax, y: r.y}],
        borderColor: r.color,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0,
        order: 1
      };
    });

    var ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Bitcoin price / Power Law trend',
          data: ratioSeries,
          borderColor: 'rgba(224,148,34,0.85)',
          backgroundColor: 'rgba(224,148,34,0.08)',
          borderWidth: 1.4,
          pointRadius: 0,
          tension: 0.1,
          fill: false,
          order: 0
        }].concat(refDatasets)
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: {
          x: {
            type: 'linear',
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              maxTicksLimit: 10,
              callback: function(v){
                // v is days-from-genesis; convert to year
                var date = new Date(GENESIS_TS*1000 + v*86400*1000);
                return date.getFullYear();
              }
            }
          },
          y: {
            type: 'logarithmic',
            min: 0.25,
            max: 7,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(255,255,255,0.5)',
              font: { size: 10 },
              callback: function(v){
                if(v === 0.5 || v === 1 || v === 2 || v === 3 || v === 5) return v + '×';
                return '';
              }
            },
            title: { display: true, text: 'Price / trend', color: 'rgba(255,255,255,0.6)', font: { size: 11 } }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: 'rgba(255,255,255,0.65)',
              font: { size: 10 },
              boxWidth: 18,
              padding: 8,
              filter: function(item){
                // Only show labeled reference percentiles + main series
                return true;
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.85)',
            titleColor: 'rgba(255,255,255,0.9)',
            bodyColor: 'rgba(255,255,255,0.8)',
            borderColor: 'rgba(224,148,34,0.4)',
            borderWidth: 1,
            callbacks: {
              title: function(items){
                if(!items.length) return '';
                // parsed.x is days-from-genesis (linear axis); convert to date
                var d = new Date(GENESIS_TS*1000 + items[0].parsed.x*86400*1000);
                return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
              },
              label: function(item){
                if(item.dataset.label.indexOf('th') !== -1 && item.dataset.label.indexOf('historical') === -1){
                  return null;
                }
                return item.dataset.label + ': ' + item.parsed.y.toFixed(2) + '×';
              }
            }
          }
        }
      }
    });
  }

  // Trigger render when math tab is activated
  var mathBtn = document.querySelector('.tab-btn[data-tab="math"]');
  if(mathBtn){
    mathBtn.addEventListener('click', function(){
      // Defer one tick so tab activation completes first
      setTimeout(render, 30);
    });
  }

  // Initial-page-load case: if landing on #math, render now
  if(location.hash.replace('#','') === 'math'){
    setTimeout(render, 80);
  }

})();

// ═══════ CHANNEL VIZ — Calculator tab anchor visualization ═══════
//
// Shows the Power Law channel (floor / trend / upper) with historical
// price overlay AND the user's sell/rebuy thresholds as parallel-to-trend
// lines that update live as the percentile sliders move. Once the user
// enters a stack value, the calculator IIFE dispatches a 'dr:simResult'
// CustomEvent and we paint the simulated forward price path plus
// trigger markers (▼ sell, ▲ rebuy) on top.
//
// X-axis: linear days-from-genesis; year-formatting tick callback
// (matches the Tab 4 'Channel' chart on /the-power-law and the Math
// tab companion chart — no chartjs date-adapter needed).
// Y-axis: logarithmic USD price, autoscaled.
//
// Mežinskis / Porkopolis attribution lives in the markup below the chart.
(function(){
  var canvas = document.getElementById('drChannelChart');
  if(!canvas) return;
  if(typeof Chart === 'undefined') return;

  // ─── X-DOMAIN ───
  // Min: PL_DATA[0][0] (first historical sample; ~mid-2010)
  // Max: today + horizon × 365.25 (extends to user's projection end)
  // Today is fixed at script-load time.
  var todayD = (Date.now()/1000 - GENESIS_TS) / 86400;
  var minD = PL_DATA[0][0];
  function maxD(){
    var horizonEl = document.getElementById('drHorizon');
    var horizon = horizonEl ? parseInt(horizonEl.value) : 20;
    return todayD + horizon * 365.25;
  }

  // ─── BAND DATA ───
  // Sampled every 30 days for performance (matches Tab 4 cadence).
  function bandData(){
    var trend = [], floor = [], upper = [];
    var hi = maxD();
    for(var d = minD; d <= hi; d += 30){
      var t = plPrice(d);
      trend.push({x: d, y: t});
      floor.push({x: d, y: t * PL_FLOOR});
      upper.push({x: d, y: t * PL_CEIL});
    }
    return { trend: trend, floor: floor, upper: upper };
  }

  // User's threshold lines: ratio × trend at every day. Same x-grid
  // as the bands so they update cheaply (just rebuild y values).
  function thresholdData(ratio){
    var line = [];
    var hi = maxD();
    for(var d = minD; d <= hi; d += 30){
      line.push({x: d, y: plPrice(d) * ratio});
    }
    return line;
  }

  // Historical price as scatter data (PL_DATA is already day-indexed).
  var historicalData = PL_DATA.map(function(p){ return {x: p[0], y: p[1]}; });

  // ─── PERCENTILE → RATIO (mirrors calc IIFE; computed once at init) ───
  // We re-derive these here so the channel viz can render thresholds
  // BEFORE the calc IIFE runs (e.g. before the user enters a stack).
  var historicalRatios = [];
  for(var i = 0; i < PL_DATA.length; i++){
    var d = PL_DATA[i][0], p = PL_DATA[i][1];
    var t = plPrice(d);
    if(t > 0) historicalRatios.push(p / t);
  }
  historicalRatios.sort(function(a,b){ return a-b; });
  function percentileToRatio(P){
    if(P <= 0) return historicalRatios[0];
    if(P >= 100) return historicalRatios[historicalRatios.length-1];
    var idx = (P/100) * (historicalRatios.length - 1);
    var lo = Math.floor(idx), hi = Math.ceil(idx);
    if(lo === hi) return historicalRatios[lo];
    var frac = idx - lo;
    return historicalRatios[lo] * (1-frac) + historicalRatios[hi] * frac;
  }

  // ─── COLORS ───
  var amber = '#e09422';
  var rust = '#c0392b';
  var gold = '#e8c820';
  var historyColor = 'rgba(232,224,210,0.7)';
  var sellColor = '#e09422';
  var rebuyColor = '#27ae60';
  var muted = 'rgba(160,160,160,0.55)';

  // ─── "TODAY" VERTICAL LINE PLUGIN (mirrors Tab 4) ───
  var todayLinePlugin = {
    id: 'drTodayLine',
    afterDatasetsDraw: function(chart){
      var xScale = chart.scales.x;
      var area = chart.chartArea;
      if(!xScale || !area) return;
      var xPos = xScale.getPixelForValue(todayD);
      if(xPos < area.left || xPos > area.right) return;
      var ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = 'rgba(224,148,34,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4,4]);
      ctx.beginPath();
      ctx.moveTo(xPos, area.top);
      ctx.lineTo(xPos, area.bottom);
      ctx.stroke();
      ctx.fillStyle = amber;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Today', xPos, area.top + 12);
      ctx.restore();
    }
  };

  // ─── INITIAL RENDER ───
  var bands = bandData();
  // Read default slider values to render initial threshold lines
  var sellEl = document.getElementById('drSellPct');
  var rebuyEl = document.getElementById('drRebuyPct');
  var initialSellRatio = sellEl ? percentileToRatio(parseInt(sellEl.value)) : 1.78;
  var initialRebuyRatio = rebuyEl ? percentileToRatio(parseInt(rebuyEl.value)) : 0.87;

  // Dataset index map — used by update functions
  var DS = {
    floor: 0, trend: 1, upper: 2,
    sellLine: 3, rebuyLine: 4,
    history: 5,
    forwardPath: 6,
    sellMarkers: 7, rebuyMarkers: 8
  };

  var chart = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: [
        // 0: Floor band
        {
          label: 'Floor (0.42× trend)',
          data: bands.floor,
          borderColor: rust,
          borderWidth: 1.4,
          borderDash: [6, 3],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 5
        },
        // 1: Trend
        {
          label: 'Trend',
          data: bands.trend,
          borderColor: amber,
          borderWidth: 2,
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 4
        },
        // 2: Upper band
        {
          label: 'Upper (3.0× trend)',
          data: bands.upper,
          borderColor: gold,
          borderWidth: 1.2,
          borderDash: [1, 5],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 6
        },
        // 3: User's sell-threshold line (parallel to trend, scaled by sellRatio)
        {
          label: 'Your sell threshold',
          data: thresholdData(initialSellRatio),
          borderColor: sellColor,
          borderWidth: 1.6,
          borderDash: [8, 4],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 2
        },
        // 4: User's rebuy-threshold line
        {
          label: 'Your rebuy threshold',
          data: thresholdData(initialRebuyRatio),
          borderColor: rebuyColor,
          borderWidth: 1.6,
          borderDash: [8, 4],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 3
        },
        // 5: Historical price
        {
          label: 'Historical price',
          data: historicalData,
          borderColor: historyColor,
          borderWidth: 1.2,
          pointRadius: 0,
          showLine: true,
          tension: 0.15,
          order: 1
        },
        // 6: Forward-projected discipline price path (populated on sim event)
        {
          label: 'Projected price',
          data: [],
          borderColor: 'rgba(232,224,210,0.45)',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 0
        },
        // 7: Sell markers (▼)
        {
          label: 'Sell triggers',
          data: [],
          borderColor: sellColor,
          backgroundColor: sellColor,
          pointStyle: 'triangle',
          pointRotation: 180,
          pointRadius: 7,
          pointHoverRadius: 9,
          showLine: false,
          order: 0
        },
        // 8: Rebuy markers (▲)
        {
          label: 'Rebuy triggers',
          data: [],
          borderColor: rebuyColor,
          backgroundColor: rebuyColor,
          pointStyle: 'triangle',
          pointRadius: 7,
          pointHoverRadius: 9,
          showLine: false,
          order: 0
        }
      ]
    },
    plugins: [todayLinePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(10,9,8,0.95)',
          borderColor: 'rgba(224,148,34,0.5)',
          borderWidth: 1,
          titleColor: amber,
          bodyColor: '#ddd',
          callbacks: {
            title: function(items){
              if(!items.length) return '';
              var d = new Date(GENESIS_TS*1000 + items[0].parsed.x*86400*1000);
              return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            },
            label: function(item){
              var v = item.parsed.y;
              var fmt;
              if(v >= 1e6) fmt = '$' + (v/1e6).toFixed(2) + 'M';
              else if(v >= 1000) fmt = '$' + (v/1000).toFixed(1) + 'K';
              else if(v >= 1) fmt = '$' + v.toFixed(2);
              else fmt = '$' + v.toFixed(4);
              return item.dataset.label + ': ' + fmt;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Year', color: muted, font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
          min: minD,
          ticks: {
            color: muted,
            maxTicksLimit: 10,
            callback: function(v){
              var date = new Date(GENESIS_TS*1000 + v*86400*1000);
              return date.getFullYear();
            }
          }
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: 'BTC price (USD)', color: muted, font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: muted,
            callback: function(v){
              if(v >= 1e6) return '$' + (v/1e6) + 'M';
              if(v >= 1000) return '$' + (v/1000) + 'K';
              if(v >= 1) return '$' + v;
              return '$' + v.toFixed(2);
            }
          }
        }
      }
    }
  });

  // ─── DYNAMIC UPDATES ───

  // Update threshold lines when user moves sell/rebuy sliders.
  // Cheap: just rebuild the y-values for two datasets.
  function updateThresholds(){
    if(!sellEl || !rebuyEl) return;
    var sr = percentileToRatio(parseInt(sellEl.value));
    var rr = percentileToRatio(parseInt(rebuyEl.value));
    chart.data.datasets[DS.sellLine].data = thresholdData(sr);
    chart.data.datasets[DS.rebuyLine].data = thresholdData(rr);
    chart.update('none');
  }

  // Rebuild bands + thresholds when horizon changes (extends x-domain).
  function updateXDomain(){
    bands = bandData();
    chart.data.datasets[DS.floor].data = bands.floor;
    chart.data.datasets[DS.trend].data = bands.trend;
    chart.data.datasets[DS.upper].data = bands.upper;
    updateThresholds(); // re-extends sell/rebuy lines to new max
  }

  if(sellEl) sellEl.addEventListener('input', updateThresholds);
  if(rebuyEl) rebuyEl.addEventListener('input', updateThresholds);
  var horizonEl = document.getElementById('drHorizon');
  if(horizonEl) horizonEl.addEventListener('input', updateXDomain);

  // Listen for simulation results from the calculator IIFE.
  // Forward-projected path (in actual USD prices, days-from-genesis x)
  // and trigger markers populate datasets 6/7/8.
  document.addEventListener('dr:simResult', function(ev){
    var detail = ev.detail || {};
    var result = detail.result;
    if(!result || !result.sim){
      // Stack cleared — wipe the projection-related datasets.
      chart.data.datasets[DS.forwardPath].data = [];
      chart.data.datasets[DS.sellMarkers].data = [];
      chart.data.datasets[DS.rebuyMarkers].data = [];
      chart.update('none');
      return;
    }
    var sim = result.sim;
    // Forward price path: convert daysFromToday → daysFromGenesis
    chart.data.datasets[DS.forwardPath].data = sim.seriesPath.map(function(pt){
      return { x: pt.day + todayD, y: pt.price };
    });
    // Trigger markers
    var sells = [], rebuys = [];
    sim.trades.forEach(function(t){
      var point = { x: t.day + todayD, y: t.price };
      if(t.type === 'sell') sells.push(point);
      else if(t.type === 'rebuy') rebuys.push(point);
    });
    chart.data.datasets[DS.sellMarkers].data = sells;
    chart.data.datasets[DS.rebuyMarkers].data = rebuys;
    chart.update('none');
  });

})();

// ═══════ CALCULATOR ═══════
// Math engine + percentile computation + state machine + UI wiring.
(function(){
  // Bail if calculator surface not present (e.g., hash deep-link to non-calc tab and elements stripped)
  if(!document.getElementById('drStack')) return;

  // ─── PRECOMPUTE PERCENTILE-TO-RATIO MAPPING ───
  // For each historical day in PL_DATA, compute price/trend ratio. Sort.
  // Pth percentile threshold = ratio level such that P% of historical
  // ratios are at-or-below it.
  var ratios = [];
  for(var i = 0; i < PL_DATA.length; i++){
    var d = PL_DATA[i][0], p = PL_DATA[i][1];
    var trend = plPrice(d);
    if(trend > 0) ratios.push(p / trend);
  }
  ratios.sort(function(a,b){ return a-b; });

  function percentileToRatio(P){
    if(P <= 0) return ratios[0];
    if(P >= 100) return ratios[ratios.length-1];
    var idx = Math.floor(ratios.length * P / 100);
    return ratios[idx];
  }

  // ─── ELEMENT REFS ───
  var elStack = document.getElementById('drStack');
  var elHorizon = document.getElementById('drHorizon');
  var elHorizonValue = document.getElementById('drHorizonValue');
  var elSellPct = document.getElementById('drSellPct');
  var elSellPctReadout = document.getElementById('drSellPctReadout');
  var elRebuyPct = document.getElementById('drRebuyPct');
  var elRebuyPctReadout = document.getElementById('drRebuyPctReadout');
  var elSellFrac = document.getElementById('drSellFrac');
  var elSellFracReadout = document.getElementById('drSellFracReadout');
  var elTaxRate = document.getElementById('drTaxRate');
  var elTaxRateValue = document.getElementById('drTaxRateValue');
  var elTaxRow = document.getElementById('drTaxRow');
  var elInflation = document.getElementById('drInflation');
  var elInflationValue = document.getElementById('drInflationValue');
  var elStatBlock = document.getElementById('drStatBlockText');
  var elOutput = document.getElementById('drOutput');
  var elHero = document.getElementById('drHero');
  var elAccountPanel = document.getElementById('drAccountPanel');
  var elTradeTable = document.getElementById('drTradeTable');
  var elChart = document.getElementById('drChart');

  // ─── STATE & STICKINESS ───
  var STORAGE_PREFIX = 'dr:';
  // Stack is intentionally NOT in this list — sitewide convention §8.2
  var STICKY = {
    drHorizon: 'horizon',
    drSellPct: 'sellPct',
    drRebuyPct: 'rebuyPct',
    drSellFrac: 'sellFrac',
    drTaxRate: 'taxRate',
    drInflation: 'inflation'
  };
  var STICKY_TOGGLE = {
    accountType: 'retirement',
    growthModel: 'trend',
    preset: 'standard'
  };

  function saveSetting(key, value){
    try { localStorage.setItem(STORAGE_PREFIX + key, value); } catch(e){}
  }
  function loadSetting(key){
    try { return localStorage.getItem(STORAGE_PREFIX + key); } catch(e){ return null; }
  }
  function loadStickyValues(){
    Object.keys(STICKY).forEach(function(elId){
      var stored = loadSetting(STICKY[elId]);
      var el = document.getElementById(elId);
      if(stored != null && el) el.value = stored;
    });
    // Toggles
    var aT = loadSetting('accountType') || 'retirement';
    var gM = loadSetting('growthModel') || 'trend';
    var pS = loadSetting('preset') || 'standard';
    setAccountType(aT, true);
    setGrowthModel(gM, true);
    // preset is informational only; sliders carry the actual values
    document.querySelectorAll('.dr-preset-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.preset === pS);
    });
  }

  // ─── PRESETS ───
  var PRESETS = {
    conservative: { sellPct: 70, rebuyPct: 40, sellFrac: 35 },
    standard:     { sellPct: 80, rebuyPct: 50, sellFrac: 50 },
    aggressive:   { sellPct: 90, rebuyPct: 20, sellFrac: 65 }
  };
  function applyPreset(name){
    var p = PRESETS[name]; if(!p) return;
    elSellPct.value = p.sellPct;
    elRebuyPct.value = p.rebuyPct;
    elSellFrac.value = p.sellFrac;
    document.querySelectorAll('.dr-preset-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.preset === name);
    });
    saveSetting('preset', name);
    saveSetting('sellPct', p.sellPct);
    saveSetting('rebuyPct', p.rebuyPct);
    saveSetting('sellFrac', p.sellFrac);
    updateReadouts();
    runIfReady();
  }

  // ─── ACCOUNT TYPE / GROWTH MODEL TOGGLES ───
  var accountType = 'retirement';
  var growthModel = 'trend';

  function setAccountType(type, silent){
    accountType = type;
    document.querySelectorAll('[data-account]').forEach(function(b){
      b.classList.toggle('active', b.dataset.account === type);
    });
    elTaxRow.style.display = (type === 'regular') ? 'flex' : 'none';
    if(!silent){ saveSetting('accountType', type); runIfReady(); }
  }
  function setGrowthModel(model, silent){
    growthModel = model;
    document.querySelectorAll('[data-growth]').forEach(function(b){
      b.classList.toggle('active', b.dataset.growth === model);
    });
    if(!silent){ saveSetting('growthModel', model); runIfReady(); }
  }

  // ─── READOUT UPDATES (live) ───
  function updateReadouts(){
    elHorizonValue.textContent = elHorizon.value + ' years';
    var sP = parseInt(elSellPct.value);
    var rP = parseInt(elRebuyPct.value);
    var sF = parseInt(elSellFrac.value);
    var sR = percentileToRatio(sP);
    var rR = percentileToRatio(rP);
    elSellPctReadout.innerHTML = sP + 'th &middot; ~' + sR.toFixed(2) + '× trend &middot; ' + (100-sP) + '% of history';
    elRebuyPctReadout.innerHTML = rP + 'th &middot; ~' + rR.toFixed(2) + '× trend &middot; ' + (rP === 50 ? 'historical median' : (rP < 50 ? rP + '% below trend' : 'above trend'));
    elSellFracReadout.textContent = sF + '% of stack at each sell event';
    elTaxRateValue.textContent = elTaxRate.value + '%';
    elInflationValue.textContent = elInflation.value + '% / yr';
    updateStatBlock(sP, rP);
  }

  function updateStatBlock(sellPct, rebuyPct){
    var sR = percentileToRatio(sellPct);
    var rR = percentileToRatio(rebuyPct);
    var aboveSellPct = 100 - sellPct;
    var belowRebuyPct = rebuyPct;
    elStatBlock.innerHTML =
      'At your settings (sell <strong>' + sellPct + 'th</strong> / rebuy <strong>' + rebuyPct + 'th</strong>): bitcoin has crossed the ' + sellPct + 'th percentile in <strong>' + aboveSellPct + '%</strong> of historical days (price ≥ ' + sR.toFixed(2) + '× trend). It has been at-or-below the ' + rebuyPct + 'th percentile in <strong>' + belowRebuyPct + '%</strong> of historical days (≤ ' + rR.toFixed(2) + '× trend). These are facts about the data, not predictions about the future.';
  }

  // ─── PRICE PATH MODEL (cyclical projection) ───
  // Simulates a 4-year cycle pattern oscillating between historically-
  // realistic min and max ratios. For Trend growth model, that range
  // is roughly 25th-percentile (0.55× trend) to 80th-percentile (1.85×
  // trend) — matching the "average historical cycle" rather than the
  // extreme cycles (which have peaked at 6× and troughed at 0.3×).
  // This IS the conditional-projection assumption: "above-trend
  // windows with historical frequency" maps to ~80th percentile
  // amplitude, which Standard/Conservative presets can capture.
  // Aggressive preset (90th) requires above-historical-average cycles
  // to fire — and honestly surfaces as such.
  // Phase: cyclical01 = 0 at horizon start (mid-cycle on the way up),
  // peak at year 1, mid on way down at year 2, trough at year 3,
  // back to mid by year 4, repeating.
  function priceTrendRatio(daysFromToday){
    var todayDay = (Date.now()/1000 - GENESIS_TS) / 86400;
    var futureDay = todayDay + daysFromToday;
    var trend = plPrice(futureDay);
    var phase = (daysFromToday/365.25) / 4 * 2 * Math.PI;
    var cyclical01 = (1 + Math.sin(phase)) / 2; // normalize sin to 0..1
    var minRatio, maxRatio;
    if(growthModel === 'floor')      { minRatio = 0.30; maxRatio = 0.55; }
    else if(growthModel === 'upper') { minRatio = 1.50; maxRatio = 4.00; }
    else                             { minRatio = 0.55; maxRatio = 1.85; }
    var ratio = minRatio + (maxRatio - minRatio) * cyclical01;
    return { trend: trend, price: trend * ratio, ratio: ratio };
  }

  // ─── SIMULATION ENGINE ───
  function runSimulation(params){
    var stepDays = 30; // monthly resolution
    var totalDays = params.horizon * 365.25;
    var sim = {
      btc: params.stack,
      cash: 0,
      costBasis: 0, // weighted-avg cost per BTC (for Regular tax tracking)
      state: 'holding-stack',
      trades: [],
      taxPaidCumulative: 0,
      gainsCumulative: 0,
      seriesPath: [],     // [{day, value, btc, cash}]
      hodlPath: []        // [{day, value}]
    };
    // Compute starting cost basis from current trend price (assumption: user's stack is at-trend basis)
    var initial = priceTrendRatio(0);
    sim.costBasis = initial.price;

    var prevRatio = initial.ratio;

    // Step through projection
    for(var d = 0; d <= totalDays; d += stepDays){
      var here = priceTrendRatio(d);
      var ratio = here.ratio;
      var price = here.price;

      // Trigger detection
      if(sim.state === 'holding-stack'){
        if(prevRatio < params.sellThreshold && ratio >= params.sellThreshold){
          // SELL EVENT
          var btcSold = sim.btc * (params.sellFraction / 100);
          var cashGained = btcSold * price;
          var taxThis = 0;
          if(params.accountType === 'regular'){
            var gain = (price - sim.costBasis) * btcSold;
            if(gain > 0){
              taxThis = gain * (params.taxRate / 100);
              cashGained -= taxThis;
              sim.taxPaidCumulative += taxThis;
              sim.gainsCumulative += gain;
            }
          }
          sim.btc -= btcSold;
          sim.cash += cashGained;
          sim.state = 'holding-cash-and-stack';
          sim.trades.push({
            day: d, type: 'sell', price: price, btcDelta: -btcSold,
            cashDelta: cashGained, ratio: ratio, tax: taxThis
          });
        }
      } else {
        if(prevRatio > params.rebuyThreshold && ratio <= params.rebuyThreshold){
          // REBUY EVENT
          var btcBought = sim.cash / price;
          // Update cost basis (weighted average)
          if(sim.btc + btcBought > 0){
            sim.costBasis = (sim.costBasis * sim.btc + price * btcBought) / (sim.btc + btcBought);
          }
          sim.btc += btcBought;
          sim.cash = 0;
          sim.state = 'holding-stack';
          sim.trades.push({
            day: d, type: 'rebuy', price: price, btcDelta: btcBought,
            cashDelta: 0, ratio: ratio, tax: 0
          });
        }
      }

      // Record path values at this step
      var disciplineValue = sim.btc * price + sim.cash;
      var hodlValue = params.stack * price;
      sim.seriesPath.push({ day: d, value: disciplineValue, btc: sim.btc, cash: sim.cash, price: price });
      sim.hodlPath.push({ day: d, value: hodlValue });

      prevRatio = ratio;
    }

    // Final values
    var finalDay = sim.seriesPath[sim.seriesPath.length-1].day;
    var finalDiscipline = sim.seriesPath[sim.seriesPath.length-1].value;
    var finalHodl = sim.hodlPath[sim.hodlPath.length-1].value;

    return {
      sim: sim,
      finalBTC: sim.btc,
      finalCash: sim.cash,
      finalDiscipline: finalDiscipline,
      finalHodl: finalHodl,
      multiplier: finalHodl > 0 ? finalDiscipline / finalHodl : 1,
      cycleCount: sim.trades.filter(function(t){ return t.type === 'rebuy'; }).length,
      taxPaid: sim.taxPaidCumulative,
      gainsTotal: sim.gainsCumulative
    };
  }

  // ─── HERO METRIC RENDERING ───
  function renderHero(result){
    var multiplier = result.multiplier;
    var ts = result.sim.trades.length;
    var cycles = result.cycleCount;

    var prefix = 'Estimated';
    var multStr = multiplier.toFixed(2) + '× HODL';
    var multClass = multiplier >= 1 ? 'positive' : 'negative';
    var contextStr = '';
    if(ts === 0){
      contextStr = '<span style="color:var(--text-muted)">no triggers fired in this horizon — discipline reduced to holding through</span>';
    } else if(cycles === 0){
      contextStr = '<span style="color:var(--text-muted)">' + ts + ' sell event(s), no rebuys yet — terminal mid-cycle</span>';
    } else {
      contextStr = 'under historical-frequency cycle assumption · ' + cycles + ' completed cycle' + (cycles===1?'':'s');
    }

    var btcStr = result.finalBTC.toFixed(4) + ' BTC';
    var hodlBTC = result.sim.seriesPath[0].btc.toFixed(4);
    var btcDelta = result.finalBTC - parseFloat(hodlBTC);
    var btcLine = '<strong>BTC accumulated:</strong> ' + btcStr + ' (vs ' + hodlBTC + ' BTC HODL · ' + (btcDelta >= 0 ? '+' : '') + btcDelta.toFixed(4) + ' BTC)';

    elHero.innerHTML =
      '<span class="dr-hero-prefix">' + prefix + '</span>' +
      '<span class="dr-hero-multiplier">' + multStr + '</span>' +
      '<span class="dr-hero-context">' + contextStr + '</span>' +
      '<span class="dr-hero-secondary">' + btcLine + '</span>';
  }

  // ─── ACCOUNT-TYPE PANEL (Regular only) ───
  function renderAccountPanel(result, params){
    if(params.accountType !== 'regular'){
      elAccountPanel.style.display = 'none';
      return;
    }
    elAccountPanel.style.display = 'block';
    var taxPct = result.gainsTotal > 0 ? (result.taxPaid / result.gainsTotal * 100) : 0;
    elAccountPanel.innerHTML =
      '<div class="dr-account-panel-label">Tax drag at ' + params.taxRate + '% rate</div>' +
      '<div class="dr-comparison-line"><span>Total cycle gains:</span><strong>$' + Math.round(result.gainsTotal).toLocaleString() + '</strong></div>' +
      '<div class="dr-comparison-line"><span>Tax owed (' + params.taxRate + '%):</span><strong>$' + Math.round(result.taxPaid).toLocaleString() + ' (' + taxPct.toFixed(1) + '% effective)</strong></div>' +
      '<p style="margin-top:0.6rem"><em>Same trades inside a Retirement account: $0 tax owed.</em></p>';
  }

  // ─── TRADE HISTORY TABLE ───
  function renderTradeTable(result, params){
    var trades = result.sim.trades;
    if(trades.length === 0){
      elTradeTable.innerHTML = '<tr><td class="dr-trade-empty" colspan="6">No triggers fired in this horizon. Discipline reduced to holding through.</td></tr>';
      return;
    }
    var rows = ['<tr><th>Year</th><th>Type</th><th>Price</th><th>Ratio</th><th>BTC Δ</th><th>Cash Δ</th></tr>'];
    trades.forEach(function(t){
      var year = (t.day / 365.25).toFixed(1);
      var type = t.type === 'sell' ? '▼ Sell' : '▲ Rebuy';
      var price = '$' + Math.round(t.price).toLocaleString();
      var ratio = t.ratio.toFixed(2) + '×';
      var btcDelta = (t.btcDelta >= 0 ? '+' : '') + t.btcDelta.toFixed(4);
      var cashDelta = t.type === 'sell' ? '+$' + Math.round(t.cashDelta).toLocaleString() + (params.accountType === 'regular' ? ' (after $' + Math.round(t.tax).toLocaleString() + ' tax)' : '') : '—';
      rows.push('<tr class="dr-trade-' + t.type + '"><td>' + year + '</td><td>' + type + '</td><td>' + price + '</td><td>' + ratio + '</td><td>' + btcDelta + '</td><td>' + cashDelta + '</td></tr>');
    });
    elTradeTable.innerHTML = rows.join('');
  }

  // ─── CHART RENDERING ───
  var chartInstance = null;
  function renderChart(result){
    var disciplineData = result.sim.seriesPath.map(function(p){
      return { x: p.day / 365.25, y: p.value };
    });
    var hodlData = result.sim.hodlPath.map(function(p){
      return { x: p.day / 365.25, y: p.value };
    });

    // Trade markers (separate datasets so they show in legend distinctly)
    var sellMarkers = result.sim.trades.filter(function(t){return t.type==='sell';}).map(function(t){
      var pathPoint = result.sim.seriesPath.find(function(p){ return p.day === t.day; });
      return { x: t.day/365.25, y: pathPoint ? pathPoint.value : t.price * 1 };
    });
    var rebuyMarkers = result.sim.trades.filter(function(t){return t.type==='rebuy';}).map(function(t){
      var pathPoint = result.sim.seriesPath.find(function(p){ return p.day === t.day; });
      return { x: t.day/365.25, y: pathPoint ? pathPoint.value : t.price * 1 };
    });

    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(elChart, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Discipline',
            data: disciplineData,
            borderColor: 'rgba(247,147,26,0.9)',
            backgroundColor: 'rgba(247,147,26,0.05)',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.15,
            fill: false
          },
          {
            label: 'HODL',
            data: hodlData,
            borderColor: 'rgba(154,144,128,0.55)',
            borderWidth: 1.5,
            borderDash: [4,4],
            pointRadius: 0,
            tension: 0.15,
            fill: false
          },
          {
            label: 'Sells',
            data: sellMarkers,
            type: 'scatter',
            backgroundColor: '#c0392b',
            borderColor: '#c0392b',
            pointStyle: 'triangle',
            pointRadius: 7,
            pointRotation: 180,
            showLine: false
          },
          {
            label: 'Rebuys',
            data: rebuyMarkers,
            type: 'scatter',
            backgroundColor: '#27ae60',
            borderColor: '#27ae60',
            pointStyle: 'triangle',
            pointRadius: 7,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,9,8,0.95)',
            borderColor: 'rgba(247,147,26,0.6)',
            borderWidth: 1,
            titleColor: '#e09422',
            bodyColor: '#ddd',
            callbacks: {
              title: function(items){ return 'Year ' + items[0].parsed.x.toFixed(1); },
              label: function(item){
                var v = item.parsed.y;
                var fmt = v >= 1e6 ? '$'+(v/1e6).toFixed(2)+'M' : v >= 1000 ? '$'+(v/1000).toFixed(1)+'K' : '$'+Math.round(v).toLocaleString();
                return item.dataset.label + ': ' + fmt;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Years from today', color: 'rgba(160,160,160,0.55)', font: {size: 11} },
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(160,160,160,0.55)' }
          },
          y: {
            type: 'logarithmic',
            title: { display: true, text: 'Stack value (USD, real)', color: 'rgba(160,160,160,0.55)', font: {size: 11} },
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: 'rgba(160,160,160,0.55)',
              callback: function(v){
                if(v >= 1e6) return '$'+(v/1e6)+'M';
                if(v >= 1000) return '$'+(v/1000)+'K';
                return '$'+v;
              }
            }
          }
        }
      }
    });
  }

  // ─── MAIN COMPUTATION + RENDER PIPELINE ───
  function run(){
    var stackVal = parseFloat(elStack.value);
    if(!stackVal || stackVal <= 0){
      elOutput.style.display = 'none';
      // Notify channel viz to clear forward-projection datasets.
      document.dispatchEvent(new CustomEvent('dr:simResult', { detail: { result: null } }));
      return;
    }

    var params = {
      stack: stackVal,
      horizon: parseInt(elHorizon.value),
      sellThreshold: percentileToRatio(parseInt(elSellPct.value)),
      rebuyThreshold: percentileToRatio(parseInt(elRebuyPct.value)),
      sellFraction: parseInt(elSellFrac.value),
      accountType: accountType,
      taxRate: parseFloat(elTaxRate.value),
      growthModel: growthModel,
      inflation: parseFloat(elInflation.value)
    };

    var result = runSimulation(params);
    elOutput.style.display = 'block';
    renderHero(result);
    renderAccountPanel(result, params);
    renderTradeTable(result, params);
    renderChart(result);

    // Notify the channel viz: forward path + trigger markers.
    // Decoupled via CustomEvent so the calc IIFE doesn't need to know
    // whether the channel viz is wired up. See the channel viz IIFE
    // for the listener (handles the null case as a clear signal).
    document.dispatchEvent(new CustomEvent('dr:simResult', {
      detail: { result: result, params: params }
    }));
  }

  function runIfReady(){
    updateReadouts();
    run();
  }

  // ─── EVENT WIRING ───
  elStack.addEventListener('input', runIfReady);

  Object.keys(STICKY).forEach(function(elId){
    var el = document.getElementById(elId);
    if(!el) return;
    el.addEventListener('input', function(){
      saveSetting(STICKY[elId], el.value);
      // Slider changes mean we're off-preset (unless settings happen to match a preset)
      var matched = null;
      Object.keys(PRESETS).forEach(function(name){
        var p = PRESETS[name];
        if(p.sellPct == elSellPct.value && p.rebuyPct == elRebuyPct.value && p.sellFrac == elSellFrac.value){
          matched = name;
        }
      });
      document.querySelectorAll('.dr-preset-btn').forEach(function(b){
        b.classList.toggle('active', b.dataset.preset === matched);
      });
      saveSetting('preset', matched || '');
      runIfReady();
    });
  });

  document.querySelectorAll('.dr-preset-btn').forEach(function(b){
    b.addEventListener('click', function(){ applyPreset(b.dataset.preset); });
  });
  document.querySelectorAll('[data-account]').forEach(function(b){
    b.addEventListener('click', function(){ setAccountType(b.dataset.account); });
  });
  document.querySelectorAll('[data-growth]').forEach(function(b){
    b.addEventListener('click', function(){ setGrowthModel(b.dataset.growth); });
  });

  // ─── INIT ───
  loadStickyValues();
  updateReadouts();
  // Don't auto-run until user enters a stack value (privacy: no implicit re-runs with default stack)
})();
