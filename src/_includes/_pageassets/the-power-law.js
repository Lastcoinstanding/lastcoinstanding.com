
// ═══════ PRICE DATA ═══════
// [days_since_genesis, price_usd] pairs
var PL_DATA = [[592.0,0.07],[604.0,0.07],[616.0,0.06],[628.0,0.06],[640.0,0.06],[652.0,0.11],[664.0,0.19],[676.0,0.32],[688.0,0.29],[700.0,0.26],[712.0,0.25],[724.0,0.27],[736.0,0.32],[748.0,0.38],[760.0,0.92],[772.0,1.08],[784.0,1.0],[796.0,0.88],[808.0,0.79],[820.0,0.8],[832.0,0.98],[844.0,1.78],[856.0,3.91],[868.0,6.98],[880.0,9.67],[892.0,23.66],[904.0,17.58],[916.0,16.1],[928.0,14.54],[940.0,14.58],[952.0,9.93],[964.0,11.3],[976.0,8.27],[988.0,5.02],[1000.0,4.94],[1012.0,4.16],[1024.0,3.32],[1036.0,3.22],[1048.0,2.6],[1060.0,2.64],[1072.0,3.12],[1084.0,3.98],[1096.0,5.37],[1108.0,7.04],[1120.0,5.7],[1132.0,5.84],[1144.0,4.5],[1156.0,4.81],[1168.0,5.44],[1180.0,4.77],[1192.0,4.8],[1204.0,5.24],[1216.0,5.18],[1228.0,5.05],[1240.0,5.15],[1252.0,5.56],[1264.0,6.56],[1276.0,6.71],[1288.0,7.85],[1300.0,8.8],[1312.0,11.23],[1324.0,14.48],[1336.0,10.91],[1348.0,11.24],[1360.0,12.28],[1372.0,12.97],[1384.0,11.98],[1396.0,10.93],[1408.0,10.95],[1420.0,12.32],[1432.0,13.09],[1444.0,13.63],[1456.0,13.65],[1468.0,13.99],[1480.0,17.13],[1492.0,21.0],[1504.0,27.2],[1516.0,31.2],[1528.0,45.6],[1540.0,70.25],[1552.0,131.0],[1564.0,68.1],[1576.0,128.5],[1588.0,112.69],[1600.0,122.7],[1612.0,122.42],[1624.0,99.98],[1636.0,104.0],[1648.0,76.49],[1660.0,89.39],[1672.0,104.62],[1684.0,109.35],[1696.0,113.28],[1708.0,117.61],[1720.0,127.12],[1732.0,126.25],[1744.0,127.59],[1756.0,195.33],[1768.0,252.59],[1780.0,475.0],[1792.0,1133.95],[1804.0,876.88],[1816.0,659.99],[1828.0,828.74],[1840.0,817.15],[1852.0,785.6],[1864.0,687.37],[1876.0,579.5],[1888.0,670.7],[1900.0,624.71],[1912.0,490.0],[1924.0,369.0],[1936.0,488.52],[1948.0,436.75],[1960.0,449.12],[1972.0,581.0],[1984.0,648.81],[1996.0,590.96],[2008.0,645.35],[2020.0,624.07],[2032.0,593.68],[2044.0,588.98],[2056.0,518.82],[2068.0,476.36],[2080.0,476.92],[2092.0,410.19],[2104.0,334.06],[2116.0,389.44],[2128.0,337.79],[2140.0,420.19],[2152.0,374.58],[2164.0,375.05],[2176.0,312.26],[2188.0,311.0],[2200.0,269.68],[2212.0,233.71],[2224.0,226.71],[2236.0,234.5],[2248.0,253.5],[2260.0,294.9],[2272.0,245.0],[2284.0,260.52],[2296.0,222.64],[2308.0,225.62],[2320.0,240.95],[2332.0,237.76],[2344.0,222.88],[2356.0,249.98],[2368.0,248.57],[2380.0,284.92],[2392.0,277.97],[2404.0,281.12],[2416.0,261.43],[2428.0,225.11],[2440.0,244.21],[2452.0,230.16],[2464.0,237.77],[2476.0,252.47],[2488.0,286.69],[2500.0,387.02],[2512.0,325.9],[2524.0,362.58],[2536.0,433.39],[2548.0,455.5],[2560.0,429.26],[2572.0,385.49],[2584.0,376.6],[2596.0,378.02],[2608.0,419.25],[2620.0,405.69],[2632.0,407.96],[2644.0,413.74],[2656.0,422.63],[2668.0,451.92],[2680.0,449.37],[2692.0,453.08],[2704.0,511.3],[2716.0,577.95],[2728.0,592.81],[2740.0,681.98],[2752.0,661.32],[2764.0,655.54],[2776.0,584.98],[2788.0,577.24],[2800.0,572.0],[2812.0,608.99],[2824.0,606.79],[2836.0,614.46],[2848.0,628.89],[2860.0,726.6],[2872.0,700.38],[2884.0,737.07],[2896.0,766.48],[2908.0,791.03],[2920.0,964.84],[2932.0,805.52],[2944.0,883.59],[2956.0,1011.08],[2968.0,1054.55],[2980.0,1224.98],[2992.0,1240.72],[3004.0,961.81],[3016.0,1193.73],[3028.0,1201.2],[3040.0,1354.8],[3052.0,1692.88],[3064.0,2421.49],[3076.0,2699.12],[3088.0,2629.76],[3100.0,2541.69],[3112.0,2310.93],[3124.0,2748.36],[3136.0,2856.52],[3148.0,4375.8],[3160.0,4376.66],[3172.0,4330.87],[3184.0,3600.92],[3196.0,4308.33],[3208.0,5691.69],[3220.0,5769.89],[3232.0,7468.44],[3244.0,8242.81],[3256.0,10912.87],[3268.0,16408.15],[3280.0,15677.99],[3292.0,16192.91],[3304.0,11506.51],[3316.0,10204.0],[3328.0,8895.72],[3340.0,9699.76],[3352.0,9324.5],[3364.0,8909.95],[3376.0,6827.54],[3388.0,7895.25],[3400.0,8870.14],[3412.0,9369.16],[3424.0,8242.07],[3436.0,7489.66],[3448.0,6553.0],[3460.0,6157.04],[3472.0,6628.59],[3484.0,7371.11],[3496.0,8171.49],[3508.0,6227.85],[3520.0,6525.96],[3532.0,7359.19],[3544.0,6497.37],[3556.0,6628.66],[3568.0,6581.07],[3580.0,6493.89],[3592.0,6361.3],[3604.0,5658.73],[3616.0,3828.45],[3628.0,3588.44],[3640.0,3899.83],[3652.0,3931.31],[3664.0,3682.48],[3676.0,3576.3],[3688.0,3394.76],[3700.0,3926.53],[3712.0,3814.58],[3724.0,3936.5],[3736.0,4048.51],[3748.0,5268.71],[3760.0,5309.28],[3772.0,5390.16],[3784.0,7992.69],[3796.0,8744.42],[3808.0,7998.29],[3820.0,9281.7],[3832.0,10578.72],[3844.0,11389.1],[3856.0,9875.17],[3868.0,11465.67],[3880.0,10317.6],[3892.0,9577.99],[3904.0,10159.32],[3916.0,9683.38],[3928.0,8147.69],[3940.0,8076.78],[3952.0,9433.35],[3964.0,9037.12],[3976.0,7286.35],[3988.0,7192.85],[4000.0,6879.54],[4012.0,7301.07],[4024.0,7817.92],[4036.0,8722.26],[4048.0,9314.56],[4060.0,10368.53],[4072.0,8785.52],[4084.0,7931.94],[4096.0,6189.85],[4108.0,6809.11],[4120.0,6871.95],[4132.0,7699.27],[4144.0,9821.8],[4156.0,9510.67],[4168.0,10204.23],[4180.0,9473.5],[4192.0,9240.85],[4204.0,9256.23],[4216.0,9214.66],[4228.0,11343.88],[4240.0,11573.11],[4252.0,11763.93],[4264.0,10159.62],[4276.0,10943.89],[4288.0,10840.8],[4300.0,11376.61],[4312.0,12944.52],[4324.0,14155.59],[4336.0,16725.15],[4348.0,17732.42],[4360.0,18247.76],[4372.0,23824.99],[4384.0,33000.78],[4396.0,36828.52],[4408.0,30419.17],[4420.0,46364.3],[4432.0,56001.2],[4444.0,48448.91],[4456.0,56872.38],[4468.0,55783.71],[4480.0,58102.58],[4492.0,53808.8],[4504.0,57213.33],[4516.0,46736.58],[4528.0,38445.29],[4540.0,33450.19],[4552.0,35592.35],[4564.0,33856.86],[4576.0,32814.61],[4588.0,37318.14],[4600.0,44634.13],[4612.0,46734.65],[4624.0,47155.87],[4636.0,46059.12],[4648.0,42815.56],[4660.0,55343.76],[4672.0,61971.59],[4684.0,61731.29],[4696.0,64838.81],[4708.0,57578.22],[4720.0,49380.43],[4732.0,46173.51],[4744.0,46408.87],[4756.0,41849.0],[4768.0,35071.43],[4780.0,37092.4],[4792.0,44536.2],[4804.0,37704.56],[4816.0,38741.04],[4828.0,42905.06],[4840.0,46611.26],[4852.0,40388.78],[4864.0,39770.04],[4876.0,31003.93],[4888.0,30278.94],[4900.0,29681.76],[4912.0,22550.79],[4924.0,20702.23],[4936.0,21582.6],[4948.0,23154.09],[4960.0,22981.77],[4972.0,24314.89],[4984.0,20233.32],[4996.0,19280.08],[5008.0,19542.2],[5020.0,19314.69],[5032.0,19383.33],[5044.0,20101.27],[5056.0,20920.33],[5068.0,16683.22],[5080.0,17170.62],[5092.0,17206.87],[5104.0,16838.1],[5116.0,16826.41],[5128.0,21145.18],[5140.0,23755.85],[5152.0,21638.55],[5164.0,24185.67],[5176.0,22410.62],[5188.0,26975.39],[5200.0,28033.06],[5212.0,30234.98],[5224.0,27590.55],[5236.0,29535.38],[5248.0,27398.27],[5260.0,27744.66],[5272.0,25852.82],[5284.0,29903.73],[5296.0,30774.87],[5308.0,30240.28],[5320.0,29316.12],[5332.0,29565.82],[5344.0,26123.41],[5356.0,25869.09],[5368.0,26536.02],[5380.0,26212.82],[5392.0,27937.18],[5404.0,29682.6],[5416.0,35440.51],[5428.0,36497.35],[5440.0,37800.94],[5452.0,43298.7],[5464.0,42262.62],[5476.0,42249.69],[5488.0,42843.98],[5500.0,40068.49],[5512.0,42653.29],[5524.0,51685.35],[5536.0,61172.49],[5548.0,71489.22],[5560.0,67226.33],[5572.0,67857.42],[5584.0,61280.51],[5596.0,63832.72],[5608.0,60805.78],[5620.0,67942.23],[5632.0,70553.24],[5644.0,66636.85],[5656.0,60315.67],[5668.0,57743.11],[5680.0,67597.26],[5692.0,60676.68],[5704.0,57523.47],[5716.0,59466.82],[5728.0,54857.17],[5740.0,63213.19],[5752.0,60639.47],[5764.0,66048.56],[5776.0,67018.78],[5788.0,75926.31],[5800.0,92369.46],[5812.0,97273.62],[5824.0,101467.53],[5836.0,99300.12],[5848.0,102253.31],[5860.0,104408.89],[5872.0,104743.97],[5884.0,95752.0],[5896.0,96274.79],[5908.0,86745.52],[5920.0,86867.58],[5932.0,82531.15],[5944.0,85283.27],[5956.0,93970.77],[5968.0,96818.39],[5980.0,106424.76],[5992.0,104027.67],[6004.0,108688.52],[6016.0,105380.3],[6028.0,108243.13],[6040.0,119276.85],[6052.0,117925.55],[6064.0,119295.42],[6076.0,116866.95],[6088.0,111737.55],[6100.0,115402.4],[6112.0,109688.85],[6124.0,121684.39],[6136.0,108448.06],[6148.0,110601.99],[6160.0,94399.23],[6172.0,90517.55],[6184.0,90643.57],[6196.0,88337.41],[6208.0,88735.0],[6220.0,95333.81],[6232.0,86570.94],[6244.0,70520.32],[6256.0,66427.8],[6268.0,68775.78],[6280.0,71218.64],[6292.0,68779.41],[6304.0,71949.58]];

// ═══════ POWER LAW CONSTANTS ═══════
var PL_A = 1.6e-17, PL_B = 5.77, PL_FLOOR = 0.42, PL_CEIL = 3.0;
var GENESIS_TS = 1230940800;

function plPrice(days){ return PL_A * Math.pow(days, PL_B); }

// ═══════ CHART ═══════
(function(){
  var ctx = document.getElementById('powerLawChart');
  if(!ctx) return;

  // Prepare datasets
  var actualPrices = PL_DATA.map(function(d){ return {x: d[0], y: d[1]}; });
  
  // Generate trend/floor/ceiling lines
  var minD = PL_DATA[0][0], maxD = PL_DATA[PL_DATA.length-1][0];
  // Extend trend lines slightly into future (2 more years)
  var futureD = maxD + 730;
  var trendLine = [], floorLine = [], ceilLine = [];
  for(var d = minD; d <= futureD; d += 30){
    var tv = plPrice(d);
    trendLine.push({x: d, y: tv});
    floorLine.push({x: d, y: tv * PL_FLOOR});
    ceilLine.push({x: d, y: tv * PL_CEIL});
  }

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'BTC Price',
          data: actualPrices,
          pointRadius: 1.5,
          pointBackgroundColor: 'rgba(247,147,26,0.6)',
          pointBorderWidth: 0,
          order: 2
        },
        {
          label: 'Trend (Fair Value)',
          data: trendLine,
          type: 'line',
          borderColor: '#e09422',
          borderWidth: 2,
          pointRadius: 0,
          borderDash: [],
          fill: false,
          order: 3
        },
        {
          label: 'Floor (0.42x)',
          data: floorLine,
          type: 'line',
          borderColor: 'rgba(76,175,80,0.6)',
          borderWidth: 1.5,
          pointRadius: 0,
          borderDash: [6,3],
          fill: false,
          order: 4
        },
        {
          label: 'Ceiling (3x)',
          data: ceilLine,
          type: 'line',
          borderColor: 'rgba(192,57,43,0.5)',
          borderWidth: 1.5,
          pointRadius: 0,
          borderDash: [6,3],
          fill: false,
          order: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'logarithmic',
          title: {display: true, text: 'Year (log scale — days since Genesis Block, Jan 3 2009)', color: '#706860', font: {size: 11}},
          grid: {color: 'rgba(255,255,255,0.04)'},
          ticks: {
            color: '#706860',
            font: {size: 10},
            callback: function(v){
              var yr = 2009 + v/365.25;
              var rounded = Math.round(yr);
              if(Math.abs(yr - rounded) < 0.3 && rounded >= 2010 && rounded <= 2028 && rounded % 2 === 0) return rounded.toString();
              return '';
            },
            maxTicksLimit: 12
          },
          afterBuildTicks: function(axis){
            // Override with year-based ticks for clearer labeling
            var yearTicks = [];
            for(var y = 2010; y <= 2028; y += 2){
              yearTicks.push({value: (y - 2009) * 365.25});
            }
            axis.ticks = yearTicks.map(function(t){return {value: t.value}});
          }
        },
        y: {
          type: 'logarithmic',
          title: {display: true, text: 'Price USD (log scale)', color: '#706860', font: {size: 11}},
          grid: {color: 'rgba(255,255,255,0.04)'},
          ticks: {
            color: '#706860',
            font: {size: 10},
            callback: function(v){
              if([0.01,0.1,1,10,100,1000,10000,100000,1000000].indexOf(v) >= 0){
                return '$' + (v>=1000 ? (v/1000)+'K' : v < 1 ? v : v.toLocaleString());
              }
              return '';
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#908880',
            font: {size: 11, family: 'Inter'},
            boxWidth: 12,
            padding: 16,
            usePointStyle: true,
            pointStyle: 'line'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10,9,8,0.95)',
          titleColor: '#f2eee8',
          bodyColor: '#d0c8c0',
          borderColor: 'rgba(247,147,26,0.3)',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function(items){
              var d = items[0].raw.x;
              var date = new Date((GENESIS_TS + d*86400)*1000);
              return date.toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
            },
            label: function(item){
              var d = item.raw.x, p = item.raw.y;
              var tv = plPrice(d), fv = tv*PL_FLOOR, cv = tv*PL_CEIL;
              var ratio = (p/tv).toFixed(2);
              var lines = [];
              var doublingFactor = Math.pow(2, 1/PL_B);
              var daysToDouble = Math.round(d * (doublingFactor - 1));
              var yearsToDouble = (daysToDouble/365.25).toFixed(1);
              if(item.datasetIndex === 0){
                lines.push('Price: $' + p.toLocaleString(undefined,{maximumFractionDigits:2}));
                lines.push('Trend: $' + Math.round(tv).toLocaleString());
                lines.push('Floor: $' + Math.round(fv).toLocaleString());
                lines.push('Position: ' + ratio + 'x trend');
                lines.push('Days to double: ' + daysToDouble.toLocaleString() + ' (' + yearsToDouble + ' yrs)');
              } else if(item.datasetIndex === 1){
                lines.push('Trend: $' + Math.round(p).toLocaleString());
                lines.push('Floor: $' + Math.round(fv).toLocaleString());
                lines.push('Ceiling: $' + Math.round(cv).toLocaleString());
                lines.push('Days to double: ' + daysToDouble.toLocaleString() + ' (' + yearsToDouble + ' yrs)');
              } else {
                return [];
              }
              return lines;
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        intersect: false,
        axis: 'x'
      }
    }
  });
})();

// ═══════ TABS ═══════
(function(){
  var btns = document.querySelectorAll('.tab-btn');
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      btns.forEach(function(x){x.classList.remove('active')});
      b.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(t){t.classList.remove('active')});
      var tab = document.getElementById('tab-' + b.dataset.tab);
      if(tab) tab.classList.add('active');
      history.replaceState(null, '', '#' + b.dataset.tab);
    });
  });
  // Init from hash
  var hash = location.hash.replace('#','');
  if(hash){
    var target = document.querySelector('[data-tab="'+hash+'"]');
    if(target) target.click();
  }
})();

// ═══════ NAV ═══════
(function(){var h=document.getElementById('hamburger'),o=document.getElementById('mobileOverlay');if(!h||!o)return;h.addEventListener('click',function(){h.classList.toggle('open');o.classList.toggle('show');document.body.style.overflow=o.classList.contains('show')?'hidden':''});var ls=o.querySelectorAll('a');for(var i=0;i<ls.length;i++)ls[i].addEventListener('click',function(){h.classList.remove('open');o.classList.remove('show');document.body.style.overflow=''})})();

// ═══════ CAGR COMPARISON CHART ═══════
(function(){
  var ctx = document.getElementById('cagrChart');
  if(!ctx) return;

  var targetYear = 2035;
  var targetDays = (targetYear - 2009) * 365.25;
  var targetPrice = plPrice(targetDays);

  var years = [];
  var cagrValues = [];
  var sp500Line = [];

  for(var y = 2015; y <= 2030; y++){
    var startDays = (y - 2009) * 365.25;
    var startPrice = plPrice(startDays);
    var yrsHeld = targetYear - y;
    if(yrsHeld <= 0) continue;
    var cagr = (Math.pow(targetPrice / startPrice, 1/yrsHeld) - 1) * 100;
    years.push(y.toString());
    cagrValues.push(+cagr.toFixed(1));
    sp500Line.push(10);
  }

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Bitcoin Power Law CAGR to 2035',
          data: cagrValues,
          backgroundColor: 'rgba(247,147,26,0.5)',
          borderColor: 'rgba(247,147,26,0.8)',
          borderWidth: 1,
          borderRadius: 3
        },
        {
          label: 'S&P 500 Historical Avg (~10%)',
          data: sp500Line,
          type: 'line',
          borderColor: 'rgba(150,150,150,0.6)',
          borderWidth: 2,
          borderDash: [6,3],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {color: 'rgba(255,255,255,0.04)'},
          ticks: {color: '#706860', font: {size: 10}},
          title: {display: true, text: 'Year of Bitcoin purchase', color: '#706860', font: {size: 11}}
        },
        y: {
          grid: {color: 'rgba(255,255,255,0.04)'},
          ticks: {color: '#706860', font: {size: 10}, callback: function(v){return v+'%'}},
          title: {display: true, text: 'Implied CAGR to 2035', color: '#706860', font: {size: 11}},
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {color: '#908880', font: {size: 11, family: 'Inter'}, boxWidth: 12, padding: 16}
        },
        tooltip: {
          backgroundColor: 'rgba(10,9,8,0.95)',
          titleColor: '#f2eee8',
          bodyColor: '#d0c8c0',
          borderColor: 'rgba(247,147,26,0.3)',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(item){
              if(item.datasetIndex === 0) return 'Bitcoin CAGR: ' + item.raw + '%';
              return 'S&P 500 avg: ~10%';
            }
          }
        }
      }
    }
  });
})();

// ═══════ OUT-OF-SAMPLE CHART ═══════
(function(){
  var ctx = document.getElementById('oosChart');
  if(!ctx) return;

  // Split data into training (<=2014) and test (>2014)
  var cutoffDays = (2015 - 2009) * 365.25; // ~2192 days
  var trainData = PL_DATA.filter(function(d){ return d[0] <= cutoffDays; });
  var testData = PL_DATA.filter(function(d){ return d[0] > cutoffDays; });

  // Fit power law to training data only using least squares on log-log
  // log(price) = log(a) + b*log(days)
  var sumX=0, sumY=0, sumXY=0, sumX2=0, n=0;
  trainData.forEach(function(d){
    if(d[1] > 0){
      var lx = Math.log(d[0]), ly = Math.log(d[1]);
      sumX += lx; sumY += ly; sumXY += lx*ly; sumX2 += lx*lx; n++;
    }
  });
  var earlyB = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX);
  var earlyLogA = (sumY - earlyB*sumX) / n;
  var earlyA = Math.exp(earlyLogA);

  function earlyPlPrice(days){ return earlyA * Math.pow(days, earlyB); }

  // Generate early-fit projection line (extending to present + 1yr)
  var maxD = PL_DATA[PL_DATA.length-1][0] + 365;
  var earlyLine = [];
  for(var d = trainData[0][0]; d <= maxD; d += 30){
    earlyLine.push({x: d, y: earlyPlPrice(d)});
  }

  // Training scatter (dimmer)
  var trainScatter = trainData.map(function(d){ return {x:d[0], y:d[1]}; });
  // Test scatter (brighter)
  var testScatter = testData.map(function(d){ return {x:d[0], y:d[1]}; });

  new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Training data (2010–2014)',
          data: trainScatter,
          pointRadius: 2,
          pointBackgroundColor: 'rgba(150,150,150,0.5)',
          pointBorderWidth: 0,
          order: 2
        },
        {
          label: 'Out-of-sample prices (2015–present)',
          data: testScatter,
          pointRadius: 1.8,
          pointBackgroundColor: 'rgba(247,147,26,0.7)',
          pointBorderWidth: 0,
          order: 2
        },
        {
          label: 'Regression fitted to 2010–2014 only',
          data: earlyLine,
          type: 'line',
          borderColor: 'rgba(76,175,80,0.8)',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: false,
          order: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'logarithmic',
          title: {display: true, text: 'Year (log scale)', color: '#706860', font: {size: 11}},
          grid: {color: 'rgba(255,255,255,0.04)'},
          ticks: {
            color: '#706860', font: {size: 10},
            callback: function(v){
              var yr = 2009 + v/365.25;
              var r = Math.round(yr);
              if(Math.abs(yr-r)<0.3 && r>=2010 && r<=2028 && r%2===0) return r.toString();
              return '';
            },
            maxTicksLimit: 12
          },
          afterBuildTicks: function(axis){
            var ticks = [];
            for(var y=2010;y<=2028;y+=2) ticks.push({value:(y-2009)*365.25});
            axis.ticks = ticks.map(function(t){return {value:t.value}});
          }
        },
        y: {
          type: 'logarithmic',
          title: {display: true, text: 'Price USD (log scale)', color: '#706860', font: {size: 11}},
          grid: {color: 'rgba(255,255,255,0.04)'},
          ticks: {
            color: '#706860', font: {size: 10},
            callback: function(v){
              if([0.01,0.1,1,10,100,1000,10000,100000,1000000].indexOf(v)>=0){
                return '$'+(v>=1000?(v/1000)+'K':v<1?v:v.toLocaleString());
              }
              return '';
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true, position: 'top',
          labels: {color:'#908880',font:{size:11,family:'Inter'},boxWidth:12,padding:16,usePointStyle:true}
        },
        tooltip: {
          backgroundColor:'rgba(10,9,8,0.95)',titleColor:'#f2eee8',bodyColor:'#d0c8c0',
          borderColor:'rgba(247,147,26,0.3)',borderWidth:1,padding:12,displayColors:false,
          callbacks: {
            title: function(items){
              var d = items[0].raw.x;
              var date = new Date((GENESIS_TS+d*86400)*1000);
              return date.toLocaleDateString('en-US',{year:'numeric',month:'short'});
            },
            label: function(item){
              var p = item.raw.y, d = item.raw.x;
              var earlyPred = earlyPlPrice(d);
              if(item.datasetIndex <= 1){
                return ['Price: $'+p.toLocaleString(undefined,{maximumFractionDigits:2}),
                        'Early model prediction: $'+Math.round(earlyPred).toLocaleString(),
                        'Ratio: '+(p/earlyPred).toFixed(2)+'x prediction'];
              }
              return 'Model: $'+Math.round(p).toLocaleString();
            }
          }
        }
      }
    }
  });
})();


// ═══════ KLEIBER'S LAW CHART ═══════
(function(){
  var ctx = document.getElementById('kleiberChart');
  if(!ctx) return;

  // Representative mammalian data: [body mass kg, metabolic rate watts]
  // Kleiber's law: rate = 70 * mass^0.75 (in kcal/day, converted approximately)
  var mammals = [
    {name:'Mouse', mass:0.02, rate:0.34},
    {name:'Rat', mass:0.3, rate:2.5},
    {name:'Rabbit', mass:2, rate:10},
    {name:'Cat', mass:4, rate:16},
    {name:'Dog', mass:15, rate:45},
    {name:'Sheep', mass:50, rate:115},
    {name:'Human', mass:70, rate:150},
    {name:'Pig', mass:120, rate:220},
    {name:'Cow', mass:500, rate:650},
    {name:'Horse', mass:600, rate:750},
    {name:'Elephant', mass:4000, rate:3500}
  ];

  var points = mammals.map(function(m){ return {x:m.mass, y:m.rate}; });
  var trendLine = [];
  for(var m=0.01; m<=10000; m*=2){
    trendLine.push({x:m, y:3.5*Math.pow(m,0.75)});
  }

  new Chart(ctx, {
    type:'scatter',
    data:{
      datasets:[
        {label:'Mammalian species',data:points,pointRadius:4,pointBackgroundColor:'rgba(247,147,26,0.8)',pointBorderWidth:0,order:1},
        {label:'Power law (mass^0.75)',data:trendLine,type:'line',borderColor:'rgba(224,148,34,0.6)',borderWidth:2,pointRadius:0,fill:false,order:2}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      scales:{
        x:{type:'logarithmic',title:{display:true,text:'Body Mass (kg, log scale)',color:'#706860',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#706860',font:{size:9},callback:function(v){if([0.01,0.1,1,10,100,1000,10000].indexOf(v)>=0)return v>=1?v+'kg':v+'kg';return''}}},
        y:{type:'logarithmic',title:{display:true,text:'Metabolic Rate (watts, log scale)',color:'#706860',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#706860',font:{size:9},callback:function(v){if([0.1,1,10,100,1000,10000].indexOf(v)>=0)return v;return''}}}
      },
      plugins:{
        legend:{display:true,position:'top',labels:{color:'#908880',font:{size:10,family:'Inter'},boxWidth:10,padding:12,usePointStyle:true}},
        tooltip:{backgroundColor:'rgba(10,9,8,0.95)',titleColor:'#f2eee8',bodyColor:'#d0c8c0',borderColor:'rgba(247,147,26,0.3)',borderWidth:1,padding:10,displayColors:false,
          callbacks:{
            title:function(items){
              var mass = items[0].raw.x;
              var m = mammals.find(function(mm){return Math.abs(mm.mass-mass)<mass*0.01});
              return m ? m.name : '';
            },
            label:function(item){
              if(item.datasetIndex===0) return ['Mass: '+item.raw.x+' kg','Metabolic rate: '+item.raw.y+' W'];
              return '';
            }
          }
        }
      }
    }
  });
})();

// ═══════ CITY SCALING CHART ═══════
(function(){
  var ctx = document.getElementById('cityChart');
  if(!ctx) return;

  // Representative city data: [population millions, GDP billions USD]
  // Illustrative of West's superlinear scaling (exponent ~1.15)
  var cities = [
    {name:'Zurich',pop:0.4,gdp:55},
    {name:'Denver',pop:0.7,gdp:85},
    {name:'San Francisco',pop:0.87,gdp:130},
    {name:'Madrid',pop:3.3,gdp:230},
    {name:'Berlin',pop:3.6,gdp:200},
    {name:'Singapore',pop:5.5,gdp:400},
    {name:'Hong Kong',pop:7.4,gdp:370},
    {name:'London',pop:9,gdp:850},
    {name:'Seoul',pop:10,gdp:700},
    {name:'Shanghai',pop:26,gdp:700},
    {name:'Tokyo',pop:37,gdp:1900},
    {name:'New York',pop:20,gdp:1800}
  ];

  var points = cities.map(function(c){return {x:c.pop,y:c.gdp}});
  var trendLine = [];
  for(var p=0.2;p<=50;p*=1.5){
    trendLine.push({x:p,y:90*Math.pow(p,1.15)});
  }

  new Chart(ctx, {
    type:'scatter',
    data:{
      datasets:[
        {label:'Global cities',data:points,pointRadius:4,pointBackgroundColor:'rgba(247,147,26,0.8)',pointBorderWidth:0,order:1},
        {label:'Power law (pop^1.15)',data:trendLine,type:'line',borderColor:'rgba(224,148,34,0.6)',borderWidth:2,pointRadius:0,fill:false,order:2}
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      scales:{
        x:{type:'logarithmic',title:{display:true,text:'Population (millions, log scale)',color:'#706860',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#706860',font:{size:9},callback:function(v){if([0.1,0.5,1,2,5,10,20,50].indexOf(v)>=0)return v+'M';return''}}},
        y:{type:'logarithmic',title:{display:true,text:'GDP (billions USD, log scale)',color:'#706860',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'#706860',font:{size:9},callback:function(v){if([10,50,100,200,500,1000,2000,5000].indexOf(v)>=0)return '$'+v+'B';return''}}}
      },
      plugins:{
        legend:{display:true,position:'top',labels:{color:'#908880',font:{size:10,family:'Inter'},boxWidth:10,padding:12,usePointStyle:true}},
        tooltip:{backgroundColor:'rgba(10,9,8,0.95)',titleColor:'#f2eee8',bodyColor:'#d0c8c0',borderColor:'rgba(247,147,26,0.3)',borderWidth:1,padding:10,displayColors:false,
          callbacks:{
            title:function(items){
              var pop=items[0].raw.x;
              var c=cities.find(function(cc){return Math.abs(cc.pop-pop)<pop*0.05});
              return c?c.name:'';
            },
            label:function(item){
              if(item.datasetIndex===0) return ['Population: '+item.raw.x+'M','GDP: $'+item.raw.y+'B'];
              return '';
            }
          }
        }
      }
    }
  });
})();


// ═══════ TOOL A: PRICE PROJECTION WIDGET ═══════
(function(){
  var slider = document.getElementById('projSlider');
  var yearEl = document.getElementById('projYear');
  if(!slider) return;

  function updateProjection(){
    var year = parseInt(slider.value);
    yearEl.textContent = year;
    var days = (year - 2009) * 365.25;
    var trend = plPrice(days);
    var floor = trend * PL_FLOOR;
    var ceil = trend * PL_CEIL;
    var doublingFactor = Math.pow(2, 1/PL_B);
    var daysToDouble = Math.round(days * (doublingFactor - 1));
    var yearsToDouble = (daysToDouble/365.25).toFixed(1);

    function fmt(v){ return v >= 1000000 ? '$'+( v/1000000).toFixed(2)+'M' : '$'+Math.round(v).toLocaleString(); }

    document.getElementById('projFloor').textContent = fmt(floor);
    document.getElementById('projTrend').textContent = fmt(trend);
    document.getElementById('projCeiling').textContent = fmt(ceil);
    document.getElementById('projFloorDetail').textContent = 'Most conservative boundary';
    document.getElementById('projTrendDetail').textContent = 'Days to double: '+daysToDouble.toLocaleString()+' ('+yearsToDouble+' yrs)';
    document.getElementById('projCeilingDetail').textContent = 'Historical bull market peaks';
  }

  slider.addEventListener('input', updateProjection);
  updateProjection();
})();

// ═══════ TOOL B: FORWARD CALCULATOR ═══════
(function(){
  var resultsEl = document.getElementById('fwdResults');
  if(!resultsEl) return;

  var scenario = 'floor';
  var method = 'mortgage';
  var LIVE_BTC_FALLBACK = 84000;

  // ── Populate time horizon based on current year ──
  var NOW_YEAR = new Date().getFullYear();
  var horizonSel = document.getElementById('fwdHorizon');
  [5, 10, 15, 20].forEach(function(h, i){
    var opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h + ' years (' + (NOW_YEAR + h) + ')';
    if(i === 1) opt.selected = true;
    horizonSel.appendChild(opt);
  });

  // ── Live BTC price fetch (CoinGecko; same as Is Bitcoin a Bubble tool) ──
  function fetchLiveBtcPrice(){
    var input = document.getElementById('fwdBtcNow');
    var status = document.getElementById('fwdBtcPriceStatus');
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {cache:'no-store'})
      .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
      .then(function(d){
        var p = Math.round(d.bitcoin.usd);
        input.value = p.toLocaleString();
        if(status) status.textContent = '(live)';
        runFwdCalc();
      })
      .catch(function(){
        input.value = LIVE_BTC_FALLBACK.toLocaleString();
        if(status) status.textContent = '(fallback)';
        runFwdCalc();
      });
  }

  // ── Power Law scenario buttons ──
  document.querySelectorAll('.scenario-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.scenario-btn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      scenario = btn.dataset.scenario;
      runFwdCalc();
    });
  });

  // ── Purchase method buttons ──
  document.querySelectorAll('.purchase-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.purchase-btn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      method = btn.dataset.method;
      // Reset the advanced toggle when switching methods (the toggle means different things in each)
      var check = document.getElementById('fwdAdvancedCheck');
      if(check) check.checked = false;
      updateAdvancedToggleLabel();
      runFwdCalc();
    });
  });

  function parseNum(id){
    var el = document.getElementById(id);
    if(!el) return 0;
    return parseFloat(el.value.replace(/[$,%\s]/g,'')) || 0;
  }
  function fmt(v){ return '$'+Math.round(v).toLocaleString(); }

  function updateAdvancedToggleLabel(){
    var text = document.getElementById('fwdAdvancedText');
    var rateWrap = document.getElementById('fwdAdvancedRateWrap');
    if(method === 'mortgage'){
      text.innerHTML = '<strong>Go deeper:</strong> DCA the rent-vs-mortgage savings into bitcoin each month?';
      rateWrap.style.display = 'none';
    } else {
      text.innerHTML = '<strong>Go deeper:</strong> Invest imputed rent savings (what the cash buyer isn\u2019t paying) in the S&amp;P 500';
      rateWrap.style.display = 'inline-flex';
    }
  }

  function runFwdCalc(){
    var horizonYrs = parseInt(horizonSel.value);
    var btcNow = parseNum('fwdBtcNow');
    var homePrice = parseNum('fwdHomePrice');
    var homeAppr = parseNum('fwdHomeAppreciation') / 100;
    var mortRate = parseNum('fwdMortgageRate');

    if(btcNow <= 0 || homePrice <= 0) return;

    var startYear = NOW_YEAR;
    var endYear = startYear + horizonYrs;
    var asOf = 'Jan 1, ' + endYear;

    // ── Derive investment amount from home price + method ──
    var amount = (method === 'cash') ? homePrice : homePrice * 0.2;

    // ── Mortgage math (needed for both modes: implied rent = 75% of equivalent mortgage) ──
    var loanAmt = homePrice * 0.8;
    var mr = mortRate / 100 / 12;
    var nPayments = 360;
    var monthlyMort = mr > 0 ? loanAmt * (mr * Math.pow(1+mr, nPayments)) / (Math.pow(1+mr, nPayments) - 1) : loanAmt / nPayments;
    var impliedRent = monthlyMort * 0.75;
    var totalRentPaid = impliedRent * 12 * horizonYrs;

    // ── BITCOIN SIDE ──
    var btcBought = amount / btcNow;
    var futureDays = (endYear - 2009) * 365.25;
    var futureTrend = plPrice(futureDays);
    var futureFloor = futureTrend * PL_FLOOR;
    var futureCeil = futureTrend * PL_CEIL;

    var futurePrice, scenarioLabel;
    if(scenario === 'floor'){ futurePrice = futureFloor; scenarioLabel = 'Floor (conservative)'; }
    else if(scenario === 'trend'){ futurePrice = futureTrend; scenarioLabel = 'Trend (fair value)'; }
    else { futurePrice = futureCeil; scenarioLabel = 'Upper (bull case)'; }

    var btcValue = btcBought * futurePrice;
    var btcNet = btcValue - totalRentPaid;
    var btcReturn = ((btcNet - amount) / amount * 100).toFixed(0);
    var btcCAGR = btcNet > 0 ? ((Math.pow(btcNet/amount, 1/horizonYrs) - 1) * 100).toFixed(1) : '—';

    // ── HOUSE SIDE ──
    var futureHomeValue = homePrice * Math.pow(1 + homeAppr, horizonYrs);
    var bal = 0, equity = futureHomeValue, interestPaid = 0, totalMortPaid = 0;
    if(method === 'mortgage'){
      var monthsPaid = horizonYrs * 12;
      bal = loanAmt;
      for(var i = 0; i < Math.min(monthsPaid, nPayments); i++){
        bal = bal * (1 + mr) - monthlyMort;
      }
      bal = Math.max(0, bal);
      equity = futureHomeValue - bal;
      totalMortPaid = monthlyMort * Math.min(monthsPaid, nPayments);
      interestPaid = totalMortPaid - (loanAmt - bal);
    }

    var propTax = homePrice * 0.012 * horizonYrs;
    var insurance = 150 * 12 * horizonYrs;
    var maintenance = homePrice * 0.01 * horizonYrs;
    var totalHouseCost = amount + totalMortPaid + propTax + insurance + maintenance;
    var houseCAGR = ((Math.pow(futureHomeValue/homePrice, 1/horizonYrs) - 1) * 100).toFixed(1);

    // ── HOUSES SUMMARY (computed early so it can go inside the Bitcoin card) ──
    var housesCanBuy = Math.max(0, btcNet / futureHomeValue);

    // Equity % for the house card ownership visual (mortgage mode only)
    var equityPct = futureHomeValue > 0 ? Math.round((equity / futureHomeValue) * 100) : 0;

    // ── House-ownership visual (single house icon, mirrors retrospective pattern) ──
    // Mortgage: red outline with amber fill-overlay scaled to equity %
    function buildOwnershipVisual(){
      if(method === 'cash'){
        return '<div style="display:flex;align-items:center;gap:.6rem;margin:.2rem 0 .9rem">' +
          '<svg viewBox="0 0 24 24" width="32" height="32">' +
            '<path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="var(--amber)" fill-opacity="0.18" stroke="#e09422" stroke-width="1.7" stroke-linejoin="round"/>' +
          '</svg>' +
          '<span style="font-size:.9rem;color:var(--text)">1 house, outright</span>' +
        '</div>';
      }
      var _fh = Math.max(0, Math.min(20, equityPct * 0.20));
      var outlineColor = equityPct >= 100 ? '#e09422' : '#c0392b';
      var label = equityPct < 0 ? '<span style="color:var(--red)">Underwater</span>' : equityPct + '% owned';
      return '<div style="display:flex;align-items:center;gap:.6rem;margin:.2rem 0 .9rem">' +
        '<svg viewBox="0 0 24 24" width="32" height="32">' +
          '<defs><clipPath id="ecFwd"><rect x="0" y="'+(24-_fh)+'" width="24" height="'+_fh+'"/></clipPath></defs>' +
          '<path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="'+outlineColor+'" stroke-width="1.5" stroke-linejoin="round"/>' +
          '<path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="var(--amber)" stroke-width="1.5" stroke-linejoin="round" clip-path="url(#ecFwd)"/>' +
        '</svg>' +
        '<span style="font-size:.9rem;color:var(--text)">'+label+'</span>' +
      '</div>';
    }
    var ownershipVisual = buildOwnershipVisual();

    // House-icon visualization (mirrors retrospective pattern)
    function buildHouseIcons(n){
      var fI = '<svg viewBox="0 0 24 24" width="32" height="32" style="margin:1px"><path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="var(--amber)" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      var pI = '<svg viewBox="0 0 24 24" width="32" height="32" style="margin:1px;opacity:0.45"><path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="var(--amber)" stroke-width="1.2" stroke-dasharray="2 2" stroke-linejoin="round"/></svg>';
      var fH = Math.floor(n), pt = n - fH, ic = '';
      for(var i = 0; i < Math.min(fH, 15); i++) ic += fI;
      if(pt > 0.05) ic += pI;
      if(fH === 0 && pt <= 0.05) ic += pI;
      var ov = fH > 15 ? '<span style="font-size:.8rem;color:var(--amber);margin-left:.4rem;align-self:center">+'+(fH-15)+' more</span>' : '';
      return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0;margin:.6rem 0 .8rem">' + ic + ov + '</div>';
    }
    var houseIconsHtml = buildHouseIcons(housesCanBuy);

    // ── RENDER: BITCOIN CARD (left) ──
    var btcHtml =
      '<div class="calc-card bitcoin">' +
        '<h4>&#8383; Bought Bitcoin + Rented ('+startYear+')</h4>' +
        '<div class="period-label">'+startYear+' \u00b7 Today</div>' +
        '<div class="invested-line">Invested <strong>'+fmt(amount)+'</strong></div>' +
        '<div class="period-divider"></div>' +
        '<div class="period-label">'+endYear+' \u00b7 Projected</div>' +
        '<div class="big-number">'+fmt(btcNet)+' <span style="font-size:.8rem;color:var(--text-muted)">net</span></div>' +
        '<div class="big-number-label">projected net position</div>' +
        houseIconsHtml +
        '<div class="detail-line">BTC purchased: '+btcBought.toFixed(4)+' @ '+fmt(btcNow)+'/BTC</div>' +
        '<div class="detail-line">Projected BTC price: <strong>'+fmt(futurePrice)+'</strong></div>' +
        '<div class="detail-line">Gross BTC value: '+fmt(btcValue)+'</div>' +
        '<div class="detail-line">Est. monthly rent: '+fmt(impliedRent)+'/mo <span style="font-size:.78rem;color:var(--text-muted)">(75% of equivalent mortgage)</span></div>' +
        '<div class="detail-line">Total rent paid: <span class="negative">'+fmt(totalRentPaid)+'</span></div>' +
        '<div class="detail-line">Total return: <span class="highlight">'+btcReturn+'%</span></div>' +
        (btcCAGR !== '—' ? '<div class="detail-line">Implied CAGR: <span class="highlight">'+btcCAGR+'%</span></div>' : '') +
        '<div class="detail-line" style="color:var(--amber);font-weight:500;margin-top:.6rem">You could buy '+housesCanBuy.toFixed(1)+' houses <strong>outright</strong> <span style="font-size:.78rem;color:var(--text-muted);font-weight:400">(projected home value: '+fmt(futureHomeValue)+' each)</span></div>' +
        '<div class="detail-line" style="margin-top:.6rem;font-size:.78rem;color:var(--text-muted)">No leverage. No interest. No property taxes. No maintenance.</div>' +
      '</div>';

    // ── RENDER: HOUSE CARD (right) ──
    var houseHtml;
    if(method === 'mortgage'){
      houseHtml =
        '<div class="calc-card house">' +
          '<h4>&#127968; Bought the House ('+startYear+')</h4>' +
          '<div class="period-label">'+startYear+' \u00b7 Today</div>' +
          '<div class="invested-line">Invested <strong>'+fmt(amount)+'</strong> <span style="text-transform:none;letter-spacing:0;font-size:.75rem;color:var(--text-muted)">(20% down of '+fmt(homePrice)+')</span></div>' +
          '<div class="period-divider"></div>' +
          '<div class="period-label">'+endYear+' \u00b7 Projected</div>' +
          '<div class="big-number">'+fmt(equity)+'</div>' +
          '<div class="big-number-label">projected equity</div>' +
          ownershipVisual +
          '<div class="detail-line">Home value in '+horizonYrs+' yrs: '+fmt(futureHomeValue)+' ('+houseCAGR+'%/yr)</div>' +
          '<div class="detail-line">Monthly mortgage: '+fmt(monthlyMort)+'/mo at '+mortRate+'%</div>' +
          '<div class="detail-line">Interest paid: <span class="negative">'+fmt(interestPaid)+'</span> <span style="font-size:.78rem;color:var(--text-muted)">(dead money)</span></div>' +
          '<div class="detail-line">Remaining loan: '+(bal > 0 ? '<span class="negative">'+fmt(bal)+'</span>' : 'Paid off')+'</div>' +
          '<div class="detail-line">Rent paid: $0 <span style="font-size:.78rem;color:var(--text-muted)">(you live in it)</span></div>' +
          '<div class="detail-line">Total cost of ownership: <span class="negative">'+fmt(totalHouseCost)+'</span></div>' +
        '</div>';
    } else {
      houseHtml =
        '<div class="calc-card house">' +
          '<h4>&#127968; Bought the House ('+startYear+')</h4>' +
          '<div class="period-label">'+startYear+' \u00b7 Today</div>' +
          '<div class="invested-line">Invested <strong>'+fmt(amount)+'</strong> <span style="text-transform:none;letter-spacing:0;font-size:.75rem;color:var(--text-muted)">(cash, paid in full)</span></div>' +
          '<div class="period-divider"></div>' +
          '<div class="period-label">'+endYear+' \u00b7 Projected</div>' +
          '<div class="big-number">'+fmt(futureHomeValue)+'</div>' +
          '<div class="big-number-label">projected home value</div>' +
          ownershipVisual +
          '<div class="detail-line">Home value in '+horizonYrs+' yrs: '+fmt(futureHomeValue)+' ('+houseCAGR+'%/yr)</div>' +
          '<div class="detail-line">Mortgage: $0 <span style="font-size:.78rem;color:var(--text-muted)">(no debt)</span></div>' +
          '<div class="detail-line">Interest paid: $0</div>' +
          '<div class="detail-line">Rent paid: $0 <span style="font-size:.78rem;color:var(--text-muted)">(you live in it)</span></div>' +
          '<div class="detail-line">Total cost of ownership: <span class="negative">'+fmt(totalHouseCost)+'</span></div>' +
          '<div class="detail-line" style="margin-top:.8rem;font-size:.78rem;color:var(--text-muted);font-style:italic">Cash buyer avoids rent \u2014 a real benefit not captured in projected value. Toggle "Go deeper" below to model it.</div>' +
        '</div>';
    }

    resultsEl.innerHTML =
      '<div class="calc-results-grid">' + btcHtml + houseHtml + '</div>';

    // ── ADVANCED SECTION ──
    renderAdvanced({
      method: method, amount: amount, horizonYrs: horizonYrs,
      startYear: startYear, endYear: endYear,
      monthlyMort: monthlyMort, impliedRent: impliedRent, totalRentPaid: totalRentPaid,
      btcNow: btcNow, futurePrice: futurePrice, btcValue: btcValue, btcBought: btcBought,
      futureHomeValue: futureHomeValue, scenarioLabel: scenarioLabel, equity: equity, btcNet: btcNet
    });
  }

  function renderAdvanced(s){
    var check = document.getElementById('fwdAdvancedCheck');
    var content = document.getElementById('fwdAdvancedContent');
    var note = document.getElementById('fwdAdvancedNote');
    var leftEl = document.getElementById('fwdAdvancedLeft');
    var rightEl = document.getElementById('fwdAdvancedRight');
    if(!check.checked){
      content.style.display = 'none';
      return;
    }
    content.style.display = 'block';

    if(s.method === 'mortgage'){
      // DCA the rent-vs-mortgage savings into BTC, using geometric interpolation of price over horizon
      var monthlySavings = Math.max(0, s.monthlyMort - s.impliedRent);
      var dcaBtc = 0;
      var totalMonths = s.horizonYrs * 12;
      if(monthlySavings > 0 && s.btcNow > 0 && s.futurePrice > 0){
        for(var m = 0; m < totalMonths; m++){
          // Geometric interpolation from btcNow to futurePrice
          var frac = m / totalMonths;
          var monthPrice = s.btcNow * Math.pow(s.futurePrice/s.btcNow, frac);
          dcaBtc += monthlySavings / monthPrice;
        }
      }
      var dcaValue = dcaBtc * s.futurePrice;
      var dcaTotalInvested = monthlySavings * totalMonths;
      note.innerHTML = 'If you rent instead of buying, your monthly housing cost is ~75% of a mortgage payment. The difference \u2014 <strong>'+fmt(monthlySavings)+'/mo</strong> \u2014 invested in bitcoin each month compounds the opportunity cost over the horizon.';
      leftEl.innerHTML =
        '<div class="calc-card bitcoin" style="border-style:dashed">' +
          '<h4>&#8383; Monthly DCA \u2014 Rent vs. Mortgage Savings</h4>' +
          '<div class="big-number">'+fmt(dcaValue)+'</div>' +
          '<div class="big-number-label">projected DCA value ('+s.endYear+')</div>' +
          '<div class="detail-line">Est. mortgage: '+fmt(s.monthlyMort)+'/mo</div>' +
          '<div class="detail-line">Est. rent: '+fmt(s.impliedRent)+'/mo</div>' +
          '<div class="detail-line">Monthly DCA into BTC: <span class="highlight">'+fmt(monthlySavings)+'/mo</span></div>' +
          '<div class="detail-line">BTC accumulated: '+dcaBtc.toFixed(4)+' BTC</div>' +
          '<div class="detail-line">Total invested via DCA: '+fmt(dcaTotalInvested)+'</div>' +
          '<div class="detail-line" style="margin-top:.8rem;font-size:.78rem;color:var(--text-muted);font-style:italic">DCA assumes BTC price follows a smooth geometric path from today\u2019s price to the projected endpoint.</div>' +
        '</div>';
      rightEl.innerHTML = '';
    } else {
      // Cash: S&P investment of imputed rent savings
      var rate = parseNum('fwdAdvancedRate') / 100;
      if(rate <= 0) rate = 0.07;
      var monthlyRate = rate / 12;
      var months = s.horizonYrs * 12;
      var spFV = monthlyRate > 0 ? s.impliedRent * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : s.impliedRent * months;
      var spInvested = s.impliedRent * months;
      note.innerHTML = 'As a cash buyer, you avoid paying rent \u2014 a real benefit worth roughly <strong>'+fmt(s.impliedRent)+'/mo</strong> (75% of an equivalent mortgage). If invested monthly at '+(rate*100).toFixed(1)+'%/yr (S&amp;P 500 real-return anchor), those savings compound into:';
      leftEl.innerHTML = '';
      rightEl.innerHTML =
        '<div class="calc-card house" style="border-style:dashed">' +
          '<h4>&#128200; Imputed Rent &rarr; S&amp;P 500</h4>' +
          '<div class="big-number">'+fmt(spFV)+'</div>' +
          '<div class="big-number-label">projected portfolio ('+s.endYear+')</div>' +
          '<div class="detail-line">Rent avoided: '+fmt(s.impliedRent)+'/mo</div>' +
          '<div class="detail-line">Invested monthly at: <span class="highlight">'+(rate*100).toFixed(1)+'%/yr</span></div>' +
          '<div class="detail-line">Total invested: '+fmt(spInvested)+'</div>' +
          '<div class="detail-line">Total gains: '+fmt(spFV - spInvested)+'</div>' +
          '<div class="detail-line" style="margin-top:.8rem;font-size:.78rem;color:var(--text-muted);font-style:italic">7% anchors to the S&amp;P 500\u2019s long-run real (inflation-adjusted) return. Override if you prefer nominal (~10%).</div>' +
        '</div>';
    }
  }

  // ── Event listeners ──
  ['fwdBtcNow','fwdHomePrice','fwdHomeAppreciation','fwdMortgageRate','fwdAdvancedRate'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('input', runFwdCalc);
  });
  horizonSel.addEventListener('change', runFwdCalc);
  document.getElementById('fwdAdvancedCheck').addEventListener('change', runFwdCalc);

  // ── Initial setup ──
  updateAdvancedToggleLabel();
  fetchLiveBtcPrice(); // runs runFwdCalc on completion
})();

