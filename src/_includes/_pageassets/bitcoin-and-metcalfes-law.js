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
    inst:   {beta:3.07, r2:0.77, label:'Institutional onset · holders'},
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
let chart;
function draw(){
  const f=FITS[cur.proxy][cur.era];
  document.getElementById('betaVal').textContent = f.beta.toFixed(2);
  document.getElementById('perDoubleVal').innerHTML = f.beta>0 ? `${perDouble(f.beta)}<small>×</small>` : '<small>inverted</small>';
  const tier=fitTier(f.r2);
  document.querySelector('#fitQ .dot').style.background=tier.c;
  const ft=document.getElementById('fitTxt'); ft.textContent=tier.t; ft.style.color=tier.c;
  document.getElementById('insight').innerHTML=insightText(f);
  const pts=[]; const N=120; const spread=Math.max(0.04,(1-f.r2)*1.1);
  for(let i=0;i<N;i++){const x=i/(N-1); pts.push({x, y:(f.beta/2)*x+0.5+(Math.random()*2-1)*spread});}
  const line=[{x:0,y:0.5},{x:1,y:(f.beta/2)+0.5}];
  const col=f.r2>=0.7?'#5a8f6b':(f.r2>=0.4?'#b07d2e':'#b3523a');
  const data={datasets:[
    {type:'scatter',data:pts,pointRadius:2.5,pointBackgroundColor:'rgba(217,154,43,.45)',borderColor:'transparent'},
    {type:'line',data:line,borderColor:col,borderWidth:2.5,pointRadius:0,borderDash:f.r2<0.4?[6,5]:[]}
  ]};
  const opts={responsive:true,maintainAspectRatio:false,animation:{duration:350},
    plugins:{legend:{display:false},tooltip:{enabled:false}},
    scales:{x:{title:{display:true,text:'Adoption  (log scale) →',color:'#6f6b63',font:{size:11}},ticks:{display:false},grid:{color:'#2a2e34'}},
            y:{title:{display:true,text:'Price  (log scale) →',color:'#6f6b63',font:{size:11}},ticks:{display:false},grid:{color:'#2a2e34'}}}};
  if(chart){chart.data=data;chart.options=opts;chart.update();}else chart=new Chart(document.getElementById('fitChart'),{data,options:opts});
}
function wire(id,key){document.querySelectorAll('#'+id+' button').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('#'+id+' button').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');cur[key]=b.dataset.v;draw();});});}
wire('proxySeg','proxy'); wire('eraSeg','era');
(function(){const r2s=[0.82,0.82,0.77,0.18,0.09];const rail=document.getElementById('sigRail');if(!rail)return;r2s.forEach(r=>{const s=document.createElement('div');s.className='sig-seg';s.style.background=`rgba(217,154,43,${0.15+r*0.85})`;rail.appendChild(s);});})();
draw();
