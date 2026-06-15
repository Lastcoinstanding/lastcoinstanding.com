/* ════════════════════════════════════════════════════════════════════
   The Doubling Ladder — page script
   --------------------------------------------------------------------
   Standalone companion to The Power Law. Two visuals + a verification
   register, all driven by data computed from the FULL daily BTC history
   (api.blockchain.info/charts/market-price, genesis = 2009-01-03).

   The two arrays below were computed offline from that daily series and
   embedded so the page renders the *verified* figures deterministically
   (no runtime dependence on a third-party endpoint). Methodology:

     • Trendline:  price = a · day^b,  a = 1.69e-17,  b = 5.763
       (the canonical Porkopolis / Santostasi fit; reproduced here by an
       OLS log-log fit through end-2023, which yields b = 5.768,
       a = 1.79e-17. A naive fit over the full series through 2026 yields
       b ≈ 5.63 — the documented time-origin sensitivity, see caveats.)

     • LADDER:     each doubling of $0.06 up to ~$2.0M. trendDay solves
       a·day^b = level; the actual crossing is the FIRST daily close at
       or above the level. lead = trendDay − actualDay (days the market
       reached the rung *before* the trend, +early / −late).

     • DEVIATION:  month-end ln(actual / trend), 191 months.

   CHECKSUM (must hold — see verification register):
       months = 191 · mean ln-dev = +0.0136 · above 80 (41.9%) / below 111 (58.1%)
   ════════════════════════════════════════════════════════════════════ */

var GENESIS_TS = 1230940800;          // Jan 3, 2009 UTC (seconds)
var DL_A = 1.69e-17, DL_B = 5.763;    // trendline coefficients (see header)
function dlTrend(days){ return DL_A * Math.pow(days, DL_B); }

// ── LADDER: doublings of $0.06; trend date vs first actual crossing ──
var LADDER = [
  {lvl:0.06, tDay:499.2, tDate:"2010-05-17", aDay:592.0, aDate:"2010-08-18", lead:-92},
  {lvl:0.12, tDay:563.0, tDate:"2010-07-20", aDay:621.0, aDate:"2010-09-16", lead:-57},
  {lvl:0.24, tDay:635.0, tDate:"2010-09-29", aDay:670.0, aDate:"2010-11-04", lead:-34},
  {lvl:0.48, tDay:716.1, tDate:"2010-12-20", aDay:758.0, aDate:"2011-01-31", lead:-41},
  {lvl:0.96, tDay:807.7, tDate:"2011-03-21", aDay:768.0, aDate:"2011-02-10", lead:40},
  {lvl:1.92, tDay:910.9, tDate:"2011-07-02", aDay:845.0, aDate:"2011-04-28", lead:66},
  {lvl:3.84, tDay:1027.3, tDate:"2011-10-27", aDay:848.0, aDate:"2011-05-01", lead:179},
  {lvl:7.68, tDay:1158.6, tDate:"2012-03-06", aDay:861.0, aDate:"2011-05-14", lead:298},
  {lvl:15.36, tDay:1306.7, tDate:"2012-08-01", aDay:883.0, aDate:"2011-06-05", lead:424},
  {lvl:30.72, tDay:1473.7, tDate:"2013-01-15", aDay:887.0, aDate:"2011-06-09", lead:587},
  {lvl:61.44, tDay:1662.0, tDate:"2013-07-23", aDay:1538.0, aDate:"2013-03-21", lead:124},
  {lvl:122.9, tDay:1874.5, tDate:"2014-02-20", aDay:1552.0, aDate:"2013-04-04", lead:322},
  {lvl:245.8, tDay:2114.0, tDate:"2014-10-18", aDay:1768.0, aDate:"2013-11-06", lead:346},
  {lvl:491.5, tDay:2384.2, tDate:"2015-07-15", aDay:1781.0, aDate:"2013-11-19", lead:603},
  {lvl:983, tDay:2688.9, tDate:"2016-05-14", aDay:1791.0, aDate:"2013-11-29", lead:898},
  {lvl:1966, tDay:3032.6, tDate:"2017-04-23", aDay:3060.0, aDate:"2017-05-21", lead:-26},
  {lvl:3932, tDay:3420.2, tDate:"2018-05-16", aDay:3145.0, aDate:"2017-08-14", lead:275},
  {lvl:7864, tDay:3857.3, tDate:"2019-07-27", aDay:3240.0, aDate:"2017-11-17", lead:617},
  {lvl:15729, tDay:4350.3, tDate:"2020-12-01", aDay:3261.0, aDate:"2017-12-08", lead:1089},
  {lvl:31457, tDay:4906.3, tDate:"2022-06-10", aDay:4383.0, aDate:"2021-01-03", lead:523},
  {lvl:62915, tDay:5533.4, tDate:"2024-02-27", aDay:4484.0, aDate:"2021-04-14", lead:1049},
  {lvl:125829, tDay:6240.6, tDate:"2026-02-03", aDay:null, aDate:null, lead:null},
  {lvl:251658, tDay:7038.2, tDate:"2028-04-11", aDay:null, aDate:null, lead:null},
  {lvl:503316, tDay:7937.7, tDate:"2030-09-27", aDay:null, aDate:null, lead:null},
  {lvl:1006633, tDay:8952.2, tDate:"2033-07-08", aDay:null, aDate:null, lead:null},
  {lvl:2013266, tDay:10096.4, tDate:"2036-08-25", aDay:null, aDate:null, lead:null}
];

// ── DEVIATION: month-end ln(actual/trend). [daysSinceGenesis, lnDev] ──
var DEVIATION = [
  [605,-0.9534],[635,-1.3864],[666,-0.5084],[696,-0.3746],[727,-0.5567],[758,-0.3274],
  [786,0.1567],[817,-0.2485],[847,0.8819],[878,1.7701],[908,2.2196],[939,1.8159],[970,1.1947],
  [1000,0.4072],[1031,-0.0880],[1061,-0.4395],[1092,-0.2000],[1123,-0.1342],[1152,-0.4002],
  [1183,-0.5776],[1213,-0.6916],[1244,-0.8036],[1274,-0.6881],[1305,-0.5029],[1336,-0.4699],
  [1366,-0.4627],[1397,-0.7263],[1427,-0.7049],[1458,-0.7553],[1489,-0.4832],[1517,-0.1492],
  [1548,0.8188],[1578,1.1545],[1609,0.9277],[1639,0.5162],[1670,0.5347],[1701,0.5755],
  [1731,0.4919],[1762,0.8733],[1792,2.4815],[1823,1.9511],[1854,1.9367],[1882,1.5340],
  [1913,1.1998],[1943,1.0866],[1974,1.3224],[2004,1.2006],[2035,1.0491],[2066,0.8447],
  [2096,0.4689],[2127,0.3048],[2157,0.3082],[2188,0.0373],[2219,-0.3588],[2247,-0.3260],
  [2278,-0.4214],[2308,-0.5914],[2339,-0.6391],[2369,-0.6152],[2400,-0.5710],[2431,-0.8784],
  [2461,-0.9123],[2492,-0.6588],[2522,-0.6050],[2553,-0.5320],[2584,-0.7300],[2613,-0.6574],
  [2644,-0.7683],[2674,-0.7361],[2705,-0.6588],[2735,-0.5333],[2766,-0.5693],[2797,-0.7616],
  [2827,-0.7754],[2858,-0.6949],[2888,-0.7091],[2919,-0.4988],[2950,-0.6002],[2978,-0.3939],
  [3009,-0.5968],[3039,-0.4007],[3070,0.0440],[3100,0.1301],[3131,0.1475],[3162,0.6054],
  [3192,0.4553],[3223,0.7868],[3253,1.1863],[3284,1.3997],[3315,1.1217],[3343,1.1259],
  [3374,0.6341],[3404,0.8987],[3435,0.6056],[3465,0.3841],[3496,0.6051],[3527,0.3976],
  [3557,0.2908],[3588,0.1956],[3618,-0.2395],[3649,-0.3903],[3680,-0.5470],[3708,-0.4911],
  [3739,-0.4683],[3769,-0.2686],[3800,0.1369],[3830,0.4544],[3861,0.1928],[3892,0.1456],
  [3922,-0.0716],[3953,0.0118],[3983,-0.1984],[4014,-0.3150],[4045,-0.0846],[4074,-0.2125],
  [4105,-0.5638],[4135,-0.2907],[4166,-0.2340],[4196,-0.3297],[4227,-0.1815],[4258,-0.1716],
  [4288,-0.2890],[4319,-0.1064],[4349,0.1472],[4380,0.5677],[4411,0.7004],[4439,0.9603],
  [4470,1.1611],[4500,1.0308],[4531,0.5847],[4561,0.5513],[4592,0.6757],[4623,0.7459],
  [4653,0.5831],[4684,0.9414],[4714,0.8393],[4745,0.5970],[4776,0.3420],[4804,0.3026],
  [4835,0.4873],[4865,0.2533],[4896,0.0203],[4926,-0.4717],[4957,-0.3446],[4988,-0.5584],
  [5018,-0.6028],[5049,-0.5871],[5079,-0.8487],[5110,-0.8736],[5141,-0.5895],[5169,-0.5923],
  [5200,-0.4503],[5230,-0.4411],[5261,-0.5293],[5291,-0.4676],[5322,-0.5406],[5353,-0.6438],
  [5383,-0.6902],[5414,-0.4751],[5444,-0.4138],[5475,-0.3394],[5506,-0.3531],[5535,-0.0083],
  [5566,0.0679],[5596,-0.0503],[5627,-0.0138],[5657,-0.1603],[5688,-0.1082],[5719,-0.2525],
  [5749,-0.1782],[5780,-0.1118],[5810,0.1570],[5841,0.0753],[5872,0.1675],[5900,-0.0730],
  [5931,-0.1308],[5961,-0.0245],[5992,0.0440],[6022,0.0563],[6053,0.1102],[6084,0.0010],
  [6114,0.0229],[6145,-0.0610],[6175,-0.2650],[6206,-0.3207],[6237,-0.3993],[6265,-0.6698],
  [6296,-0.6857],[6326,-0.5854],[6357,-0.6407],[6371,-0.7886]
];

// ── MONTHLY_HIGH: [daySinceGenesis (of the month's high), highest daily
//    price that month]. Same daily Blockchain.info series as LADDER /
//    DEVIATION; the highest close in each calendar month. Drawn as a
//    continuous line on Visual A so the mania spikes are legible — one
//    run sweeps near-vertically through several rungs at once. ──
var MONTHLY_HIGH = [
  [592,0.07],[621,0.15],[662,0.19],[674,0.47],[726,0.3],[758,0.48],[771,1],[788,0.97],[847,3],
  [874,9],[889,34],[909,17],[940,15],[971,9],[1001,5],[1034,3],[1092,4],[1101,7],[1126,6],
  [1167,5],[1205,5],[1238,5],[1266,7],[1296,10],[1323,15],[1357,13],[1371,13],[1424,13],
  [1442,14],[1489,20],[1517,31],[1548,92],[1558,231],[1579,139],[1611,129],[1670,108],
  [1701,125],[1719,139],[1761,216],[1792,1134],[1797,1137],[1830,916],[1856,817],[1886,682],
  [1930,526],[1974,621],[1978,670],[2007,650],[2037,596],[2071,489],[2111,402],[2140,420],
  [2160,380],[2189,321],[2234,258],[2259,297],[2284,261],[2317,243],[2369,256],[2382,311],
  [2405,285],[2440,244],[2492,328],[2497,408],[2538,464],[2561,459],[2606,438],[2614,437],
  [2671,468],[2703,527],[2722,765],[2738,701],[2767,624],[2806,625],[2857,712],[2878,751],
  [2917,976],[2924,1109],[2978,1194],[2982,1287],[3039,1333],[3064,2421],[3082,2955],
  [3121,2840],[3161,4595],[3164,4908],[3222,6136],[3252,9919],[3270,19280],[3291,17156],
  [3336,11246],[3348,11517],[3399,9658],[3410,9838],[3439,7714],[3490,8418],[3497,7735],
  [3532,7359],[3566,6641],[3596,6537],[3620,4188],[3656,4072],[3704,4140],[3738,4116],
  [3763,5518],[3797,8770],[3827,12933],[3840,12587],[3870,11996],[3896,10621],[3950,9552],
  [3958,9418],[3984,7558],[4045,9502],[4060,10369],[4081,9156],[4135,8778],[4143,10002],
  [4168,10204],[4227,11115],[4245,12294],[4260,11923],[4316,13651],[4344,19173],[4380,28857],
  [4389,40670],[4433,57488],[4453,61259],[4484,63554],[4509,58929],[4546,40526],[4592,42214],
  [4616,49524],[4630,52677],[4674,66064],[4693,67562],[4716,57230],[4747,47763],[4792,44536],
  [4834,47448],[4840,46611],[4870,39675],[4897,31776],[4955,23856],[4971,24447],[5001,22393],
  [5048,20816],[5055,21293],[5094,17802],[5140,23756],[5162,24835],[5199,28356],[5215,30486],
  [5236,29535],[5289,30699],[5305,31485],[5331,29768],[5373,27222],[5413,34532],[5430,37891],
  [5453,44184],[5484,46972],[5535,62499],[5549,73094],[5575,71646],[5617,71443],[5633,71084],
  [5686,68257],[5690,65298],[5748,65888],[5779,72706],[5803,99012],[5828,106156],[5863,106158],
  [5873,102406],[5903,94256],[5960,94998],[5984,111722],[6002,110300],[6045,120001],
  [6067,123359],[6103,117129],[6121,124777],[6148,110602],[6179,93468],[6221,96932],
  [6240,78680],[6282,74860],[6323,78649],[6337,82146],[6358,73571]
];

// ── helpers ──────────────────────────────────────────────────────────
function dlDateFromDay(d){
  var dt = new Date(GENESIS_TS*1000 + d*86400*1000);
  return dt.getUTCFullYear() + '-' + String(dt.getUTCMonth()+1).padStart(2,'0') + '-' + String(dt.getUTCDate()).padStart(2,'0');
}
function dlYearLabel(d){ return new Date(GENESIS_TS*1000 + d*86400*1000).getUTCFullYear(); }
function dlFmtUSD(v){
  if(v >= 1e6) return '$' + (v/1e6).toFixed(2) + 'M';
  if(v >= 1000) return '$' + (v/1000).toFixed(v >= 1e4 ? 0 : 1) + 'K';
  if(v >= 1) return '$' + v.toLocaleString(undefined,{maximumFractionDigits:0});
  return '$' + v.toFixed(2);
}
// year-aligned linear-axis ticks (ported from the-power-law.js channel chart)
function dlYearTicks(axis){
  if(axis.type !== 'linear') return;
  var startYear = new Date((GENESIS_TS + axis.min*86400)*1000).getUTCFullYear();
  var endYear   = new Date((GENESIS_TS + axis.max*86400)*1000).getUTCFullYear();
  var span = endYear - startYear + 1, stride = span > 20 ? 5 : (span > 10 ? 2 : 1);
  var first = Math.ceil(startYear/stride)*stride, ticks = [];
  for(var y = first; y <= endYear; y += stride){
    var jan1 = (Date.UTC(y,0,1)/1000 - GENESIS_TS)/86400;
    if(jan1 >= axis.min && jan1 <= axis.max) ticks.push({value: jan1});
  }
  axis.ticks = ticks;
}

// ════════════ VISUAL A — THE DOUBLING LADDER (log-log staircase) ════════
(function(){
  var ctx = document.getElementById('ladderChart');
  if(!ctx || typeof Chart === 'undefined') return;

  // Trend staircase: stepped line through each rung's (trendDay, level).
  var staircase = LADDER.map(function(r){ return {x:r.tDay, y:r.lvl, rung:r}; });
  // Rung markers sitting on the trend.
  var trendDots = LADDER.map(function(r){ return {x:r.tDay, y:r.lvl, rung:r}; });
  // Where the market ACTUALLY first reached each level (null until reached).
  var earlyDots = [], lateDots = [];
  LADDER.forEach(function(r){
    if(r.aDay == null) return;
    var pt = {x:r.aDay, y:r.lvl, rung:r};
    (r.lead >= 0 ? earlyDots : lateDots).push(pt);
  });
  // Actual monthly-high price, connected — the line that sweeps through
  // several rungs in a mania and sags below the staircase in a bear.
  var monthlyHigh = MONTHLY_HIGH.map(function(m){ return {x:m[0], y:m[1]}; });

  function rungTooltip(item){
    var r = item.raw.rung; if(!r) return '';
    var lines = ['Level: ' + dlFmtUSD(r.lvl)];
    lines.push('Trend reaches: ' + r.tDate);
    if(r.aDay == null){ lines.push('Not yet reached by the market'); return lines; }
    lines.push('Market first reached: ' + r.aDate);
    if(r.lead >= 0) lines.push('→ ' + r.lead.toLocaleString() + ' days EARLY (overshoot)');
    else            lines.push('→ ' + Math.abs(r.lead).toLocaleString() + ' days LATE (lagging trend)');
    return lines;
  }

  new Chart(ctx, {
    type: 'scatter',
    data: { datasets: [
      { label:'Trend staircase', data:staircase, type:'line', showLine:true, stepped:true,
        borderColor:'rgba(224,148,34,0.55)', borderWidth:1.6, pointRadius:0, fill:false, order:6 },
      { label:'Monthly high (actual)', data:monthlyHigh, type:'line', showLine:true,
        borderColor:'rgba(92,158,173,0.75)', borderWidth:1.2, pointRadius:0, fill:false, tension:0.1, order:5 },
      { label:'Trend doubling level', data:trendDots, pointRadius:4, pointHoverRadius:6,
        pointBackgroundColor:'#e09422', pointBorderColor:'#e09422', order:3 },
      { label:'First reached early (mania)', data:earlyDots, pointRadius:4.5, pointHoverRadius:6.5,
        pointStyle:'rectRot', pointBackgroundColor:'rgba(127,174,94,0.9)', pointBorderColor:'#7fae5e', order:1 },
      { label:'First reached late', data:lateDots, pointRadius:4.5, pointHoverRadius:6.5,
        pointStyle:'rectRot', pointBackgroundColor:'rgba(224,122,109,0.9)', pointBorderColor:'#e07a6d', order:2 }
    ]},
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'nearest', intersect:true },
      scales:{
        x:{ type:'logarithmic',
            title:{display:true, text:'Days since Genesis (log) — labelled by year', color:'#706860', font:{size:11}},
            grid:{color:'rgba(255,255,255,0.04)'},
            min:400, max:11000,
            ticks:{ color:'#706860', font:{size:10}, autoSkip:false,
              callback:function(v){
                var marks={500:1,730:1,1095:1,1826:1,2922:1,4017:1,5113:1,6209:1,7305:1,8401:1,9131:1,10227:1};
                return marks[Math.round(v)] ? dlYearLabel(v) : '';
              }
            },
            afterBuildTicks:function(axis){
              axis.ticks = [500,730,1095,1826,2922,4017,5113,6209,7305,8401,9131,10227].map(function(v){return {value:v};});
            }
        },
        y:{ type:'logarithmic',
            title:{display:true, text:'Price level — each rung doubles the last (log)', color:'#706860', font:{size:11}},
            grid:{color:'rgba(255,255,255,0.04)'},
            ticks:{ color:'#706860', font:{size:10},
              callback:function(v){
                var marks=[0.1,1,10,100,1000,10000,100000,1000000];
                return marks.indexOf(v)>=0 ? dlFmtUSD(v) : '';
              }
            }
        }
      },
      plugins:{
        legend:{ display:true, position:'top',
          labels:{color:'#908880', font:{size:11, family:'Inter'}, boxWidth:10, padding:14, usePointStyle:true} },
        tooltip:{ backgroundColor:'rgba(10,9,8,0.95)', titleColor:'#f2eee8', bodyColor:'#d0c8c0',
          borderColor:'rgba(247,147,26,0.3)', borderWidth:1, padding:12, displayColors:false,
          callbacks:{
            title:function(items){ var raw=items[0].raw; return raw.rung ? 'Doubling to ' + dlFmtUSD(raw.rung.lvl) : dlDateFromDay(raw.x); },
            label:function(item){ return item.raw.rung ? rungTooltip(item) : 'Monthly high: ' + dlFmtUSD(item.raw.y); },
            beforeBody:function(){ return ''; }
          }
        }
      }
    }
  });
})();

// ════════════ VISUAL B — THE DEVIATION WAVE (gap around zero) ═══════════
(function(){
  var ctx = document.getElementById('waveChart');
  if(!ctx || typeof Chart === 'undefined') return;

  // Split the signed series into a green (above) and red (below) half,
  // each clamped at the zero centerline and filled to the origin. The
  // top edge of each fill traces the actual deviation, so together they
  // read as a single wave straddling zero.
  var pos = DEVIATION.map(function(d){ return {x:d[0], y:Math.max(0, d[1]), raw:d[1]}; });
  var neg = DEVIATION.map(function(d){ return {x:d[0], y:Math.min(0, d[1]), raw:d[1]}; });

  // Mean ln-deviation (computed live from the embedded series so the
  // centerline annotation can never drift from the data).
  var meanLn = DEVIATION.reduce(function(s,d){ return s+d[1]; }, 0) / DEVIATION.length;

  // ── Cycle ceiling & floor: linear fits (x = days since genesis) through
  //    the four cycle peaks and the four cycle troughs in the month-end
  //    log-deviation series. The ceiling slopes down (each mania overshoots
  //    less than the last, R²≈0.83); the floor is essentially flat (every
  //    bear bottoms near the same depth, R²≈0). Recomputed here from the
  //    embedded peak/trough points so the lines can't drift from the data.
  var CYCLE_PEAKS   = [[908,2.22],[1792,2.48],[3284,1.40],[4470,1.16]];   // 2011,2013,2017,2021
  var CYCLE_TROUGHS = [[1244,-0.80],[2461,-0.91],[3680,-0.55],[5110,-0.87]]; // 2012,2015,2019,2022
  function olsLine(pts){
    var n=pts.length, sx=0, sy=0, sxy=0, sxx=0;
    pts.forEach(function(p){ sx+=p[0]; sy+=p[1]; sxy+=p[0]*p[1]; sxx+=p[0]*p[0]; });
    var m=(n*sxy-sx*sy)/(n*sxx-sx*sx); return {m:m, c:(sy-m*sx)/n};
  }
  var xMin = DEVIATION[0][0], xMax = DEVIATION[DEVIATION.length-1][0];
  var fitCeil = olsLine(CYCLE_PEAKS), fitFloor = olsLine(CYCLE_TROUGHS);
  var ceilLine  = [{x:xMin, y:fitCeil.m*xMin+fitCeil.c},  {x:xMax, y:fitCeil.m*xMax+fitCeil.c}];
  var floorLine = [{x:xMin, y:fitFloor.m*xMin+fitFloor.c}, {x:xMax, y:fitFloor.m*xMax+fitFloor.c}];

  var meanLinePlugin = {
    id:'meanLine',
    afterDatasetsDraw:function(chart){
      var y = chart.scales.y, area = chart.chartArea, c = chart.ctx;
      if(!y || !area) return;
      var yp = y.getPixelForValue(meanLn);
      c.save();
      c.strokeStyle='rgba(236,228,214,0.45)'; c.lineWidth=1; c.setLineDash([5,4]);
      c.beginPath(); c.moveTo(area.left, yp); c.lineTo(area.right, yp); c.stroke();
      c.setLineDash([]); c.fillStyle='rgba(236,228,214,0.75)';
      c.font='10px Inter, sans-serif'; c.textAlign='right';
      c.fillText('15-yr average  ·  +'+meanLn.toFixed(3)+' ln  (≈'+(Math.exp(meanLn)).toFixed(2)+'× trend)', area.right-6, yp-5);
      c.restore();
    }
  };

  new Chart(ctx, {
    type:'line',
    data:{ datasets:[
      { label:'Above trend', data:pos, borderColor:'rgba(90,138,58,0.85)', borderWidth:1.2,
        backgroundColor:'rgba(90,138,58,0.22)', pointRadius:0, fill:'origin', tension:0.25, order:3 },
      { label:'Below trend', data:neg, borderColor:'rgba(192,57,43,0.8)', borderWidth:1.2,
        backgroundColor:'rgba(192,57,43,0.18)', pointRadius:0, fill:'origin', tension:0.25, order:4 },
      { label:'Cycle-peak ceiling (falling)', data:ceilLine, borderColor:'rgba(90,138,58,0.75)',
        borderWidth:1.4, borderDash:[6,4], pointRadius:0, fill:false, tension:0, order:1 },
      { label:'Cycle floor (flat)', data:floorLine, borderColor:'rgba(192,57,43,0.75)',
        borderWidth:1.4, borderDash:[6,4], pointRadius:0, fill:false, tension:0, order:1 }
    ]},
    plugins:[meanLinePlugin],
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      scales:{
        x:{ type:'linear',
            title:{display:true, text:'Year', color:'#706860', font:{size:11}},
            grid:{color:'rgba(255,255,255,0.04)'},
            ticks:{ color:'#706860', font:{size:10}, callback:function(v){ return dlYearLabel(v); } },
            afterBuildTicks:dlYearTicks
        },
        y:{ type:'linear', min:-1.8, max:2.7,
            title:{display:true, text:'Distance from trend — ln(actual ÷ trend)', color:'#706860', font:{size:11}},
            grid:{ color:function(c){ return c.tick.value===0 ? 'rgba(236,228,214,0.25)' : 'rgba(255,255,255,0.04)'; } },
            ticks:{ color:'#706860', font:{size:10},
              callback:function(v){ var r=Math.exp(v); return v.toFixed(1)+'  ('+r.toFixed(r<1?2:1)+'×)'; } }
        }
      },
      plugins:{
        legend:{ display:true, position:'top',
          labels:{color:'#908880', font:{size:11, family:'Inter'}, boxWidth:12, padding:14, usePointStyle:true} },
        tooltip:{ backgroundColor:'rgba(10,9,8,0.95)', titleColor:'#f2eee8', bodyColor:'#d0c8c0',
          borderColor:'rgba(247,147,26,0.3)', borderWidth:1, padding:12, displayColors:false,
          // Datasets 0/1 are the two clamped halves of the wave (one holds the
          // value, the other is pinned to 0); 2/3 are the straight ceiling/floor
          // fit lines. Keep only the wave half carrying the real value, and drop
          // the fit lines, so each month shows once.
          filter:function(item){ if(item.datasetIndex>1) return false; var ln=item.raw.raw; return item.datasetIndex===0 ? ln>=0 : ln<0; },
          callbacks:{
            title:function(items){ return dlDateFromDay(items[0].parsed.x); },
            label:function(item){
              var ln = item.raw.raw, ratio = Math.exp(ln);
              var where = ln>=0 ? 'above trend' : 'below trend';
              return [ 'Deviation: ' + (ln>=0?'+':'') + ln.toFixed(3) + ' ln',
                       ratio.toFixed(2) + '× trend (' + where + ')' ];
            }
          }
        }
      }
    }
  });
})();

// ════════════ VERIFICATION REGISTER (stats + ladder table) ══════════════
(function(){
  // Recompute the checksum stats live from DEVIATION so the published
  // numbers are provably the ones the chart is drawn from.
  var n = DEVIATION.length;
  var sum = DEVIATION.reduce(function(s,d){ return s+d[1]; }, 0);
  var above = DEVIATION.filter(function(d){ return d[1] > 0; }).length;
  var below = n - above;
  var mean = sum / n;

  function set(id, txt){ var el = document.getElementById(id); if(el) el.textContent = txt; }
  set('dl-stat-exp', '5.76');
  set('dl-stat-mean', '+' + mean.toFixed(3));
  set('dl-stat-above', above + ' / ' + below);
  set('dl-stat-split', Math.round(100*above/n) + '% / ' + Math.round(100*below/n) + '%');

  // Build the ladder table.
  var tbody = document.getElementById('dl-ladder-body');
  if(tbody){
    LADDER.forEach(function(r){
      var tr = document.createElement('tr');
      var lead;
      if(r.aDay == null) lead = '<span class="dl-lead-pending">— pending —</span>';
      else if(r.lead >= 0) lead = '<span class="dl-lead-early">+' + r.lead.toLocaleString() + ' d early</span>';
      else lead = '<span class="dl-lead-late">' + r.lead.toLocaleString() + ' d late</span>';
      tr.innerHTML =
        '<td class="lvl num">' + dlFmtUSD(r.lvl) + '</td>' +
        '<td class="num">' + r.tDate + '</td>' +
        '<td class="num">' + (r.aDate || '<span class="dl-lead-pending">not yet</span>') + '</td>' +
        '<td class="num">' + lead + '</td>';
      tbody.appendChild(tr);
    });
  }
})();

// ════════════ SCENARIO SLIDER — future rungs, early/late ════════════════
// The five trend levels still above today's price, with their trend-projected
// arrival dates. The slider shifts every arrival by the same offset (−730 to
// +730 days) so the reader can re-date the whole upper ladder on their own
// assumption — a scenario to reason from, not a schedule.
(function(){
  var slider  = document.getElementById('dl-scenario-slider');
  var readout = document.getElementById('dl-scenario-readout');
  var body    = document.getElementById('dl-scenario-body');
  if(!slider || !body) return;

  var FUTURE_RUNGS = [
    {price:135367,   date:'2026-04-27'},
    {price:270734,   date:'2028-07-14'},
    {price:541467,   date:'2031-01-13'},
    {price:1082934,  date:'2033-11-07'},
    {price:2165869,  date:'2037-01-11'}
  ];

  function shiftDate(iso, offsetDays){
    var p = iso.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1]-1, +p[2]));
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth()+1).padStart(2,'0') + '-' + String(d.getUTCDate()).padStart(2,'0');
  }

  // Build the rows once; the scenario cell is updated live by id.
  FUTURE_RUNGS.forEach(function(r, i){
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="lvl num">' + dlFmtUSD(r.price) + '</td>' +
      '<td class="num">' + r.date + '</td>' +
      '<td class="num" id="dl-scn-' + i + '">' + r.date + '</td>';
    body.appendChild(tr);
  });

  function update(){
    var off = parseInt(slider.value, 10);
    FUTURE_RUNGS.forEach(function(r, i){
      document.getElementById('dl-scn-' + i).textContent = shiftDate(r.date, off);
    });
    if(off === 0){
      readout.textContent = 'on the line';
      readout.className = 'dl-scenario-readout';
    } else {
      var yrs = Math.abs(off) / 365.25;
      readout.textContent = Math.abs(off).toLocaleString() + ' days (' + yrs.toFixed(1) + ' yr) ' + (off < 0 ? 'early' : 'late');
      readout.className = 'dl-scenario-readout ' + (off < 0 ? 'early' : 'late');
    }
  }
  slider.addEventListener('input', update);
  update();
})();
