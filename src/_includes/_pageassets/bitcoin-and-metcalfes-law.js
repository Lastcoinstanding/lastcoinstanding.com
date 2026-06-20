// Bitcoin & Metcalfe's Law — proxy/era selector + log-log fit chart.
// FITS holds the measured power-law exponent (beta) and fit quality (r2)
// for each (adoption proxy × era) combination.
//
//   bal  = non-zero-balance addresses (Coin Metrics AdrBalCnt) — the
//          preferred ownership proxy. These cells are exact OLS fits.
//   act  = active addresses (Blockchain.com Charts) — activity, not
//          ownership. Recomputed June 2026 directly from Blockchain.com
//          active-address + price series, OLS on log-log, over the same
//          era boundaries used for the holders fit (calibrated against
//          the exact AdrBalCnt values). See SITE_GUIDE §20 + credits [5].
//
// Era boundaries (analyst-chosen; see the "What this is and isn't"
// callout): retail = pre-2017; institutional onset = 2017→2020 (COVID
// crash boundary); ETF era = 2024→present; full = 2011→present.
const FITS = {
  bal: {
    all:    {beta:1.84, r2:0.95, label:'Full history · holders'},
    retail: {beta:1.48, r2:0.82, label:'Retail era · holders'},
    inst:   {beta:3.14, r2:0.78, label:'Institutional onset · holders'},
    etf:    {beta:2.86, r2:0.09, label:'ETF era · holders'},
  },
  act: {
    all:    {beta:2.09, r2:0.81, label:'Full history · active addr', unstable:true},
    retail: {beta:1.37, r2:0.90, label:'Retail era · active addr'},
    inst:   {beta:0.59, r2:0.02, label:'Institutional onset · active addr'},
    etf:    {beta:-0.19,r2:0.01, label:'ETF era · active addr', inverted:true},
  }
};
let cur={proxy:'bal', era:'all'};
function perDouble(b){ return Math.pow(2,b).toFixed(1); }
function fitTier(r2){
  if(r2>=0.7) return {c:'var(--good)', t:`R² ${r2.toFixed(2)} — strong`};
  if(r2>=0.4) return {c:'var(--warn)', t:`R² ${r2.toFixed(2)} — weak`};
  return {c:'var(--bad)', t:`R² ${r2.toFixed(2)} — broken`};
}
function insightText(f){
  if(f.inverted) return `<strong>The proxy has inverted.</strong> In the ETF era, active addresses move <em>opposite</em> to price: on-chain activity fell while price rose, because ETFs and Layer-2 moved transactions off-chain. This isn't a Metcalfe exponent — it's a broken instrument, and the clearest possible sign that activity is no longer a good measure of adoption.`;
  if(f.r2<0.4) return `<strong>This fit has collapsed.</strong> With R² this low, the exponent is not meaningful. Ownership and activity have moved off-chain — into exchanges, custodians, ETFs, and treasuries — so on-chain counts no longer track who owns Bitcoin. This collapse is the page's central finding, not a number to quote.`;
  if(f.unstable) return `<strong>A high fit, but a misleading one.</strong> A full-history fit averages eras that behave very differently into one tidy exponent — and any two series that both rise over time will appear to agree. Switch eras to watch it come apart.`;
  if(cur.era==='all') return `This is the single most-cited number (β ${f.beta}, a strong fit) — but it blends eras that behave very differently. There is no one Metcalfe exponent for Bitcoin; the era buttons reveal the instability the average hides.`;
  return `A clean era: on-chain holders genuinely tracked price here (R² ${f.r2.toFixed(2)}). The measured exponent sits below Metcalfe's 2.0 — the diminishing-returns shortfall Odlyzko predicted.`;
}
// Era date ranges — the same OLS boundaries used to compute FITS above.
const ERA_RANGE = {
  all:    ['2011-01-01','2026-12-31'],
  retail: ['2011-01-01','2016-12-31'],
  inst:   ['2017-01-01','2020-03-31'],
  etf:    ['2024-01-01','2026-12-31'],
};
// Real pinned weekly series: [dateISO, priceUSD, holders(AdrBalCnt), active|null].
const SERIES = Array.isArray(window.METCALFE_SERIES) ? window.METCALFE_SERIES : [];
// Real (x = adoption, y = price) points for the current proxy + era.
function eraPoints(proxy, era){
  const r = ERA_RANGE[era] || ERA_RANGE.all, lo=r[0], hi=r[1];
  const xi = proxy === 'act' ? 3 : 2;   // active-address vs holders column
  const out=[];
  for(const row of SERIES){
    const d=row[0], p=row[1], x=row[xi];
    if(d<lo || d>hi || !(p>0) || !(x>0)) continue;
    out.push({x:x, y:p});
  }
  return out;
}
// Label decade ticks only (1, 10, 100 …) — keeps real log axes legible at 375px.
function isDecade(v){ const l=Math.log10(v); return Math.abs(l-Math.round(l))<0.02; }
function fmtPrice(v){ if(!isDecade(v)) return ''; return v>=1e6?'$'+(v/1e6)+'M':v>=1e3?'$'+(v/1e3)+'K':'$'+(v<1?v:Math.round(v)); }
function fmtCount(v){ if(!isDecade(v)) return ''; return v>=1e6?(v/1e6)+'M':v>=1e3?(v/1e3)+'K':''+Math.round(v); }

let chart;
function draw(){
  const f=FITS[cur.proxy][cur.era];
  document.getElementById('betaVal').textContent = f.beta.toFixed(2);
  document.getElementById('perDoubleVal').innerHTML = f.beta>0 ? `${perDouble(f.beta)}<small>×</small>` : '<small>inverted</small>';
  const tier=fitTier(f.r2);
  document.querySelector('#fitQ .dot').style.background=tier.c;
  const ft=document.getElementById('fitTxt'); ft.textContent=tier.t; ft.style.color=tier.c;
  document.getElementById('insight').innerHTML=insightText(f);

  // Real scatter: actual price-vs-adoption points for this proxy + era.
  const pts=eraPoints(cur.proxy,cur.era);
  // Fitted line at the canonical exponent f.beta: solve the intercept so the
  // line passes through the data's log-log centroid (reproduces the OLS line
  // whose slope is the β shown in the readout, on the real points).
  const line=[];
  if(pts.length>1){
    let sx=0,sy=0,xmin=Infinity,xmax=-Infinity;
    for(const q of pts){ sx+=Math.log10(q.x); sy+=Math.log10(q.y); if(q.x<xmin)xmin=q.x; if(q.x>xmax)xmax=q.x; }
    const b=sy/pts.length - f.beta*(sx/pts.length);
    line.push({x:xmin, y:Math.pow(10, b+f.beta*Math.log10(xmin))});
    line.push({x:xmax, y:Math.pow(10, b+f.beta*Math.log10(xmax))});
  }
  const col=f.r2>=0.7?'#5a8f6b':(f.r2>=0.4?'#b07d2e':'#b3523a');
  const xTitle=cur.proxy==='act' ? 'Active addresses (log scale)' : 'On-chain holders (non-zero-balance addresses, log scale)';
  const data={datasets:[
    {type:'scatter',data:pts,pointRadius:2,pointBackgroundColor:'rgba(217,154,43,.40)',borderColor:'transparent'},
    {type:'line',data:line,borderColor:col,borderWidth:2.5,pointRadius:0,borderDash:f.r2<0.4?[6,5]:[]}
  ]};
  const opts={responsive:true,maintainAspectRatio:false,animation:{duration:350},
    plugins:{legend:{display:false},tooltip:{enabled:false}},
    scales:{
      x:{type:'logarithmic',title:{display:true,text:xTitle,color:'#6f6b63',font:{size:11}},
         ticks:{display:true,color:'#6f6b63',font:{size:10},autoSkip:false,maxRotation:0,callback:fmtCount},
         grid:{color:'#2a2e34'}},
      y:{type:'logarithmic',title:{display:true,text:'Price (USD, log scale)',color:'#6f6b63',font:{size:11}},
         ticks:{display:true,color:'#6f6b63',font:{size:10},autoSkip:false,callback:fmtPrice},
         grid:{color:'#2a2e34'}}
    }};
  if(chart){chart.data=data;chart.options=opts;chart.update();}else chart=new Chart(document.getElementById('fitChart'),{data,options:opts});
}
function wire(id,key){document.querySelectorAll('#'+id+' button').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('#'+id+' button').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');cur[key]=b.dataset.v;draw();});});}
wire('proxySeg','proxy'); wire('eraSeg','era');
(function(){const r2s=[0.82,0.82,0.77,0.18,0.09];const rail=document.getElementById('sigRail');if(!rail)return;r2s.forEach(r=>{const s=document.createElement('div');s.className='sig-seg';s.style.background=`rgba(217,154,43,${0.15+r*0.85})`;rail.appendChild(s);});})();
draw();
