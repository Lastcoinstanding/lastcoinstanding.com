// PL_DATA + constants + plPrice() now live in shared/power-law-data.js (loaded before this file via njk page_scripts)
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
  // Hash-based redirect: the projection real-estate calculator that
  // previously lived at /the-power-law.html#calculator now lives at
  // /bitcoin-vs-real-estate.html#projection (Phase 4 restructure commits
  // 0b2d203 + 36c13a0; canonicalized to the short hash in commit TBD).
  // Carry inbound deep-links over so users arriving from old bookmarks
  // or external links still land on the tool.
  if(location.hash === '#calculator'){
    location.replace('/bitcoin-vs-real-estate.html#projection');
    return;
  }

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

  // Split data into training (<=2017) and test (>2017)
  // Training cutoff is end-of-2017 — the year before Mežinskis's formal
  // publication. This window produces a slope (~5.66) that lands within
  // 2% of the canonical Porkopolis exponent (5.77), and the projection
  // tracks 2018–present prices to within ~50% in either direction.
  // (Earlier 2010–2014 cutoff produced a slope of ~6.79 that drifted
  // ~4× above actual prices by 2024 — see commit message for details.)
  var cutoffDays = (2018 - 2009) * 365.25; // ~3287 days
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
          label: 'Training data (2010–2017)',
          data: trainScatter,
          pointRadius: 2,
          pointBackgroundColor: 'rgba(150,150,150,0.5)',
          pointBorderWidth: 0,
          order: 2
        },
        {
          label: 'Out-of-sample prices (2018–present)',
          data: testScatter,
          pointRadius: 1.8,
          pointBackgroundColor: 'rgba(247,147,26,0.7)',
          pointBorderWidth: 0,
          order: 2
        },
        {
          label: 'Regression fitted to 2010–2017 only',
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

// ═══════ THE CHANNEL — interactive Power Law visualization (Tab 4) ═══════
//
// Builds a Chart.js scatter chart with three Power Law band lines (Floor,
// Trend, Upper) and a fourth dataset for historical price (PL_DATA), plus
// a Today marker. Two axis modes — Linear time (default) and Log time —
// switchable via the .channel-axis-toggle controls. Each band can be
// individually hidden via .channel-band-toggle checkboxes. Live BTC price
// is fetched from CoinGecko for the status line; falls back to the most
// recent PL_DATA sample if the fetch fails.
//
// Replaces the previous Tool B: Forward Calculator (now lives at
// /bitcoin-vs-real-estate.html#projection — see commit 0b2d203 and the
// Phase 4 restructure).
(function(){
  var canvas = document.getElementById('channelChart');
  if(!canvas) return;

  // Today in days-since-genesis
  var todayD = (Date.now()/1000 - GENESIS_TS) / 86400;
  var minD = PL_DATA[0][0];
  var futureD = todayD + 365.25 * 5; // project 5 years past today

  // Custom Chart.js interaction mode: 'xNearest'.
  //
  // Why this exists: Chart.js's built-in 'index' mode matches by array
  // INDEX across datasets, not by x value. On this chart, the band
  // lines have ~190 sampled points (every 30 days) while the
  // historical line has 5500+ daily points — so array index N
  // corresponds to wildly different x values in different datasets.
  // Hovering on a historical point at index 4900 (some date in 2026)
  // either omits the bands (only 190 entries exist there) or, in
  // mirrored cases, returns band[N] at one date and historical[N] at
  // some other date so the tooltip displays inconsistent x values.
  //
  // Native 'nearest' with axis 'x' returns only ONE item across all
  // datasets — also wrong; we want one item per dataset.
  //
  // This mode: pick up the cursor's x value via the x-scale, then for
  // each visible dataset find the point with the smallest |point.x -
  // cursorX| and return one item per dataset. Result: every series
  // appears in the tooltip at its own nearest-by-date point.
  if (typeof Chart !== 'undefined' && Chart.Interaction && Chart.Interaction.modes && !Chart.Interaction.modes.xNearest) {
    Chart.Interaction.modes.xNearest = function(chart, e, options, useFinalPosition){
      var position = (Chart.helpers && Chart.helpers.getRelativePosition)
        ? Chart.helpers.getRelativePosition(e, chart)
        : { x: e.x, y: e.y };
      var xScale = chart.scales.x;
      if(!xScale) return [];
      var cursorX = xScale.getValueForPixel(position.x);
      // Stash cursorX on the chart so the tooltip title callback can read
      // it. The title needs the cursor's actual data-space x to render
      // the right date — picking it from any returned item is wrong when
      // the historical-line dataset ends at "today" (its nearest point
      // for any cursor past today is the today-extension point, so the
      // title would freeze at today's date as the user hovers further).
      chart._lastCursorX = cursorX;
      // Threshold: 5% of the visible x range. If a dataset's nearest
      // point is farther than this from the cursor, treat the dataset
      // as "not present here" and skip it. This drops the historical
      // line from the tooltip when the user hovers far past today —
      // otherwise we'd show today's price with a future cursor's date
      // (the "Historical price: $61K" appearing alongside bands at
      // their 2027 values). The bands themselves stay included since
      // their 30-day-step sampling extends through futureD.
      var threshold = (xScale.max - xScale.min) * 0.05;
      var items = [];
      chart.data.datasets.forEach(function(dataset, datasetIndex){
        if(!chart.isDatasetVisible(datasetIndex)) return;
        var data = dataset.data;
        if(!data || !data.length) return;
        var nearestIdx = 0;
        var nearestDist = Math.abs((data[0].x !== undefined ? data[0].x : 0) - cursorX);
        for(var i = 1; i < data.length; i++){
          var x = data[i].x !== undefined ? data[i].x : i;
          var dist = Math.abs(x - cursorX);
          if(dist < nearestDist){
            nearestDist = dist;
            nearestIdx = i;
          }
        }
        if(nearestDist > threshold) return;
        var meta = chart.getDatasetMeta(datasetIndex);
        if(meta && meta.data && meta.data[nearestIdx]){
          items.push({
            element: meta.data[nearestIdx],
            datasetIndex: datasetIndex,
            index: nearestIdx
          });
        }
      });
      return items;
    };
  }

  // Generate band lines: trend / floor / upper, sampled every 30 days
  var trendLine = [], floorLine = [], upperLine = [];
  for(var d = minD; d <= futureD; d += 30){
    var t = plPrice(d);
    trendLine.push({x: d, y: t});
    floorLine.push({x: d, y: t * PL_FLOOR});
    upperLine.push({x: d, y: t * PL_CEIL});
  }

  // Historical price as dataset. We append a today-point at the end so
  // the white line reaches the today marker rather than terminating at
  // PL_DATA's last seeded sample (which may be weeks/months stale). To
  // make the tooltip work continuously across the gap (Chart.js's 'index'
  // mode shows only existing data points, not interpolated values), we
  // also fill the gap with weekly linearly-interpolated points. Without
  // this, hovering between PL_DATA's last point and today shows the band
  // lines but omits Historical from the tooltip even though the visual
  // line passes through. Both the gap points and the today point are
  // mutated in place by fetchTodayPrice when the live spot lands.
  var historicalLine = PL_DATA.map(function(p){ return {x: p[0], y: p[1]}; });
  var lastPlX = PL_DATA[PL_DATA.length - 1][0];
  var lastPlY = PL_DATA[PL_DATA.length - 1][1];

  // Live-price seed (mutated by fetchTodayPrice when CoinGecko resolves)
  var liveTodayPrice = (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0)
    ? TODAY_PRICE
    : lastPlY;

  // Weekly gap-fill (only when gap > 1 week — otherwise interpolation is
  // visually identical to the single-segment connection)
  if (todayD > lastPlX + 7) {
    var gap = todayD - lastPlX;
    for (var gx = lastPlX + 7; gx < todayD; gx += 7) {
      var ft = (gx - lastPlX) / gap;
      historicalLine.push({ x: gx, y: lastPlY * (1 - ft) + liveTodayPrice * ft });
    }
  }
  historicalLine.push({ x: todayD, y: liveTodayPrice });

  // Today marker (single point)
  var todayPrice = plPrice(todayD);

  // Theming
  var amber = 'rgba(247,147,26,0.9)';
  var rust = '#b04525';
  var gold = '#e8c820';
  var muted = 'rgba(160,160,160,0.55)';
  var historyColor = 'rgba(232,224,210,0.8)';

  // Plugin: render a "Today" vertical line across the chart
  var todayLinePlugin = {
    id: 'todayLine',
    afterDatasetsDraw: function(chart){
      var xScale = chart.scales.x;
      var area = chart.chartArea;
      if(!xScale || !area) return;
      var xPos = xScale.getPixelForValue(todayD);
      if(xPos < area.left || xPos > area.right) return;
      var ctx = chart.ctx;
      ctx.save();
      ctx.strokeStyle = 'rgba(247,147,26,0.4)';
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

  // Chart type 'line' (not 'scatter') even though the data points are
  // {x, y} objects with a linear x-axis. The reason is tooltip
  // behavior: with type 'scatter', interaction.mode 'index' matches by
  // array index across datasets — which fails here because the band
  // lines have ~200 sampled points while the historical line has
  // 5000+ daily points, so the array indices don't align to the same
  // x values. With type 'line', the same 'index' mode matches by
  // x-value, so a hover at any x position shows Floor / Trend / Upper
  // / Historical simultaneously. The {x, y} data format works for
  // 'line' too when the x-axis is type 'linear' (which it is).
  var chart = new Chart(canvas, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Floor (0.42× trend)',
          data: floorLine,
          borderColor: rust,
          borderWidth: 1.6,
          borderDash: [6,3],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 3
        },
        {
          label: 'Trend (central case)',
          data: trendLine,
          borderColor: amber,
          borderWidth: 2.5,
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 2
        },
        {
          label: 'Upper (3× trend)',
          data: upperLine,
          borderColor: gold,
          borderWidth: 1.2,
          borderDash: [1,6],
          pointRadius: 0,
          showLine: true,
          tension: 0.2,
          order: 4
        },
        {
          label: 'Historical price',
          data: historicalLine,
          borderColor: historyColor,
          backgroundColor: 'rgba(232,224,210,0.05)',
          borderWidth: 1.4,
          pointRadius: 0,
          showLine: true,
          fill: false,
          tension: 0.15,
          order: 1
        }
      ]
    },
    plugins: [todayLinePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'xNearest', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 14,
            color: 'rgba(180,180,180,0.85)',
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(10,9,8,0.95)',
          borderColor: 'rgba(247,147,26,0.6)',
          borderWidth: 1,
          titleColor: amber,
          bodyColor: '#ddd',
          callbacks: {
            title: function(items){
              if(!items.length) return '';
              // Date comes from the cursor's data-space x (stashed by the
              // xNearest interaction mode at the start of each event), not
              // from any item's parsed.x — items can be off by ±15 days
              // from the cursor due to the bands' 30-day sampling, and the
              // historical-line item's x freezes at today for any cursor
              // past today.
              var chart = items[0].chart;
              var d = (chart && chart._lastCursorX !== undefined)
                ? chart._lastCursorX
                : items[0].parsed.x;
              var date = new Date(GENESIS_TS*1000 + d*86400*1000);
              return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
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
          title: { display: true, text: 'Time (year)', color: muted, font: {size:11}},
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: muted,
            maxTicksLimit: 10,
            // Year-aligned tick override — prevents duplicate-year labels
            // on zoomed (small-span) views. Chart.js's autoSkip otherwise
            // picks evenly-spaced ticks that don't land on Jan 1, causing
            // adjacent ticks to fall in the same calendar year. With this
            // override, every visible year appears exactly once. For wide
            // ranges the stride spaces ticks (every 2y on >10y windows,
            // every 5y on >20y).
            callback: function(v){
              var date = new Date(GENESIS_TS*1000 + v*86400*1000);
              return date.getFullYear();
            }
          },
          afterBuildTicks: function(axis){
            if(axis.type !== 'linear') return;
            var startMs = (GENESIS_TS + axis.min * 86400) * 1000;
            var endMs   = (GENESIS_TS + axis.max * 86400) * 1000;
            var startYear = new Date(startMs).getUTCFullYear();
            var endYear   = new Date(endMs).getUTCFullYear();
            var span = endYear - startYear + 1;
            var stride = 1;
            if (span > 20) stride = 5;
            else if (span > 10) stride = 2;
            var firstYear = Math.ceil(startYear / stride) * stride;
            var ticks = [];
            for (var y = firstYear; y <= endYear; y += stride) {
              var jan1Days = (Date.UTC(y, 0, 1) / 1000 - GENESIS_TS) / 86400;
              if (jan1Days >= axis.min && jan1Days <= axis.max) {
                ticks.push({ value: jan1Days });
              }
            }
            axis.ticks = ticks;
          }
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: 'BTC Price (USD)', color: muted, font: {size:11}},
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

  // Axis toggle handler
  document.querySelectorAll('.channel-axis-btn').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.channel-axis-btn').forEach(function(x){
        x.classList.remove('active');
        x.setAttribute('aria-selected', 'false');
      });
      b.classList.add('active');
      b.setAttribute('aria-selected', 'true');
      var newType = b.dataset.axis === 'log' ? 'logarithmic' : 'linear';
      chart.options.scales.x.type = newType;
      // For log time, x axis can't be 0 (logarithmic), and PL_DATA starts at 592 days — we're fine
      chart.update('none');
    });
  });

  // Band visibility toggles
  // Dataset indices: 0=Floor, 1=Trend, 2=Upper, 3=History
  var bandIndex = { floor: 0, trend: 1, upper: 2, history: 3 };
  document.querySelectorAll('.channel-band-toggle input').forEach(function(input){
    input.addEventListener('change', function(){
      var idx = bandIndex[input.dataset.band];
      if(idx === undefined) return;
      chart.setDatasetVisibility(idx, input.checked);
      chart.update('none');
    });
  });

  // Range / zoom controls — relative presets (All-time, last 5y/2y/1y)
  // plus absolute year-jump buttons (2017…2026). Each button sets the
  // x-axis min/max bounds and rebuilds. The y-axis stays logarithmic so
  // the bands stay visually meaningful at any zoom level.
  //
  // Bounds for the year-N case run from Jan 1 of year N to Dec 31 of
  // year N. For relative presets, the upper bound stays at the chart's
  // futureD (today + 5y) so the forward projection cone stays visible.
  function rangeBoundsFor(rangeKey){
    if(rangeKey === 'all'){
      return { min: minD, max: futureD };
    }
    if(rangeKey === 'recent-5y'){
      return { min: todayD - 365.25 * 5, max: futureD };
    }
    if(rangeKey === 'recent-2y'){
      return { min: todayD - 365.25 * 2, max: futureD };
    }
    if(rangeKey === 'recent-1y'){
      return { min: todayD - 365.25 * 1, max: futureD };
    }
    if(rangeKey.indexOf('year-') === 0){
      var y = parseInt(rangeKey.slice(5), 10);
      var start = (Date.UTC(y,     0, 1) / 1000 - GENESIS_TS) / 86400;
      var end   = (Date.UTC(y + 1, 0, 1) / 1000 - GENESIS_TS) / 86400;
      return { min: start, max: end };
    }
    return { min: minD, max: futureD };
  }

  document.querySelectorAll('.channel-range-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.channel-range-btn').forEach(function(b){
        b.classList.remove('active');
      });
      btn.classList.add('active');
      var bounds = rangeBoundsFor(btn.dataset.range);
      chart.options.scales.x.min = bounds.min;
      chart.options.scales.x.max = bounds.max;
      // When zoomed to a year-N window, the log-time axis can't represent
      // a window that doesn't include the full lifetime origin sensibly —
      // force linear axis for year-specific zooms so the user always sees
      // a meaningful x-axis. Don't touch the axis toggle for relative
      // presets; the user's choice between linear/log stays respected.
      if(btn.dataset.range.indexOf('year-') === 0 &&
         chart.options.scales.x.type === 'logarithmic'){
        chart.options.scales.x.type = 'linear';
        document.querySelectorAll('.channel-axis-btn').forEach(function(x){
          var on = x.dataset.axis === 'linear';
          x.classList.toggle('active', on);
          x.setAttribute('aria-selected', on ? 'true' : 'false');
        });
      }
      chart.update('none');
    });
  });

  // Status line: live BTC price + position relative to channel
  var statusEl = document.getElementById('channelStatus');
  function fmtUSD(v){
    if(v >= 1e6) return '$' + (v/1e6).toFixed(2) + 'M';
    if(v >= 1000) return '$' + (v/1000).toFixed(1) + 'K';
    return '$' + Math.round(v).toLocaleString();
  }
  function updateStatus(currentPrice, isLive){
    if(!statusEl) return;
    var multiplier = currentPrice / todayPrice;
    var bandLabel;
    if(multiplier < PL_FLOOR){
      bandLabel = '<span style="color:'+rust+'">below floor</span>';
    } else if(multiplier < 1){
      bandLabel = 'within Floor &rarr; Trend zone';
    } else if(multiplier < PL_CEIL){
      bandLabel = '<span style="color:'+amber+'">within Trend &rarr; Upper zone</span>';
    } else {
      bandLabel = '<span style="color:'+gold+'">above upper band</span>';
    }
    var src = isLive ? '' : ' <span style="opacity:0.6">(last sample)</span>';
    statusEl.innerHTML =
      '<strong>Today&rsquo;s bitcoin price:</strong> <span style="color:var(--amber)">' + fmtUSD(currentPrice) + '</span>' + src +
      ' &middot; <span style="color:var(--amber)">' + multiplier.toFixed(2) + '&times; trend</span>' +
      ' &middot; ' + bandLabel +
      ' <span style="opacity:0.55;margin-left:0.5rem">(Power Law trend = ' + fmtUSD(todayPrice) + ')</span>';
  }

  // Live BTC via the shared helper (one fetch + one consistent fallback
  // across every Power Law page, so the "Today" value can't disagree page
  // to page). Status-line rendering is unchanged. When the live price
  // arrives we also re-interpolate the historical-line gap-fill points
  // (and the trailing today point) so the white line and its tooltip
  // values converge on the live spot rather than the seeded TODAY_PRICE.
  fetchTodayPrice(function(price, source){
    updateStatus(price, source === 'live');
    if(source === 'live'){
      liveTodayPrice = price;
      var histDs = chart.data.datasets[3];
      if(histDs && histDs.data && histDs.data.length){
        var gap = todayD - lastPlX;
        for(var i = 0; i < histDs.data.length; i++){
          var pt = histDs.data[i];
          if(pt.x > lastPlX && pt.x <= todayD){
            var t = (pt.x - lastPlX) / gap;
            pt.y = lastPlY * (1 - t) + price * t;
          }
        }
        // update('resize') not 'none' — last-point mutation otherwise
        // leaves the element pixel cached at the seeded value
        // (STYLE_GUIDE §6.14).
        chart.update('resize');
      }
    }
  });

  // "Copy chart as image" — quiet top-right affordance (PROTOTYPE: this
  // one chart only). Self-contained PNG with the site's dark card bg and a
  // muted "lastcoinstanding.com" caption; copies to clipboard, falls back
  // to download where clipboard-image write is blocked. See chart-copy.js.
  if (window.attachChartCopy) {
    window.attachChartCopy(chart, {
      title: 'Bitcoin & The Power Law — the channel',
      filename: 'bitcoin-power-law-channel.png',
      background: '#111110'
    });
  }
})();

