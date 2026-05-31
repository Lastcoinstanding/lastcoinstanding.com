
    /* homeData: see shared/bvre-annual-data.js (loaded before this script). */
const incomeData={1965:6957,1970:9867,1975:13719,1980:21023,1985:23620,1990:29940,1995:34076,2000:42148,2005:46326,2010:49276,2013:51939,2014:53657,2015:56516,2016:59039,2017:61372,2018:63179,2019:68703,2020:67521,2021:70784,2022:74580,2023:80610,2024:81500,2025:83150};
    /* btcData: see shared/bvre-annual-data.js (loaded before this script). */
const mortgageRates={2013:3.98,2014:4.17,2015:3.85,2016:3.65,2017:3.99,2018:4.54,2019:3.94,2020:3.11,2021:2.96,2022:5.34,2023:6.81,2024:6.72,2025:6.80};

    const gridColor='rgba(224,148,34,0.06)',tickColor='#6a6256',amber='#e09422',amberLight='rgba(224,148,34,0.15)',red='#c0392b',redLight='rgba(192,57,43,0.15)',textColor='#e8e0d4',greenColor='#27ae60';
    Chart.defaults.font.family="'Inter', -apple-system, sans-serif";Chart.defaults.font.size=12;Chart.defaults.color=tickColor;
    function cso(t){return{grid:{color:gridColor,drawBorder:false},ticks:{color:tickColor,font:{size:11}},title:{display:!!t,text:t,color:tickColor,font:{size:11,weight:400}}}}

    // TAB 1: ERA BAR CHART
    const eraLabels=['Gold Standard\n1890–1912','Fed Era\n1913–1943','Bretton Woods\n1944–1971','Early Fiat\n1971–2000','Late Fiat\n2000–2025','2025 →\n?'];
    const eraRatios=[2.0,2.5,2.5,3.5,5.0,null];
    new Chart(document.getElementById('eraBarChart'),{type:'bar',data:{labels:eraLabels,datasets:[{label:'Home-Price-to-Income Ratio',data:[2.0,2.5,2.5,3.5,5.0,null],backgroundColor:['rgba(39,174,96,0.7)','rgba(224,148,34,0.5)','rgba(224,148,34,0.6)','rgba(192,57,43,0.55)','rgba(192,57,43,0.75)','transparent'],borderColor:[greenColor,amber,amber,red,red,'transparent'],borderWidth:1.5,borderRadius:4,barPercentage:0.7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(10,9,8,0.95)',borderColor:amber,borderWidth:1,titleColor:amber,bodyColor:textColor,filter:c=>c.parsed.y!==null,callbacks:{title:c=>c[0].label.replace('\n',' · '),label:c=>'~'+c.parsed.y.toFixed(1)+'× income'}}},scales:{x:{...cso(),ticks:{color:function(c){return c.index===5?red:tickColor},font:{size:9},maxRotation:0,callback:function(v,i){return eraLabels[i].split('\n')}}},y:{...cso('Home-Price-to-Income Ratio'),min:0,max:6,ticks:{color:tickColor,font:{size:10},stepSize:1,callback:v=>v+'×'}}}}});

    // TAB 1: DIVERGENCE
    const divYears=[1985,1990,1995,2000,2005,2010,2015,2020,2025];
    const homeIdx=divYears.map(y=>+((homeData[y]/homeData[1985])*100).toFixed(1));
    const incIdx=divYears.map(y=>+((incomeData[y]/incomeData[1985])*100).toFixed(1));
    new Chart(document.getElementById('divergenceChart'),{type:'line',data:{labels:divYears.map(String),datasets:[{label:'Home Prices',data:homeIdx,borderColor:red,backgroundColor:redLight,borderWidth:2.5,pointRadius:3,fill:true,tension:0.3},{label:'Household Income',data:incIdx,borderColor:greenColor,backgroundColor:'rgba(39,174,96,0.08)',borderWidth:2.5,pointRadius:3,fill:true,tension:0.3}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'top',align:'center',labels:{boxWidth:10,usePointStyle:true,pointStyle:'circle',padding:24,color:tickColor,font:{size:10}}},tooltip:{backgroundColor:'rgba(10,9,8,0.95)',borderColor:amber,borderWidth:1,titleColor:amber,bodyColor:textColor,callbacks:{label:c=>c.dataset.label+': '+c.parsed.y.toFixed(0)+' (indexed)'}}},scales:{x:{...cso()},y:{...cso('Index (1985 = 100)'),min:80}}}});

    // TAB 1: GLOBAL AFFORDABILITY — international price-to-income comparison.
    // Demographia International Housing Affordability annual editions 2006–2025;
    // each edition reports Q3 data for the prior calendar year, so data_year =
    // edition_year - 1. Hong Kong first appeared in the 2011 edition (Q3 2010),
    // so HK values 2005-2009 are null. The 'affordable' threshold of 3.0× is
    // shown as a dashed green reference line (Demographia's own threshold).
    // All values cross-checked against the source PDFs; see DATA_AUDIT BR-8 for
    // the per-value provenance map and MONTHLY_REFRESH_CHECKLIST for the
    // annual update procedure (Demographia releases each May).
    const globalYears=[2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024];
    const ratHK=[null,null,null,null,null,11.4,12.6,13.5,14.9,17.0,19.0,18.1,19.4,20.9,20.8,20.7,23.2,18.8,16.7,14.4];
    const ratSydney=[8.5,8.5,8.6,8.3,9.1,9.6,9.2,8.3,9.0,9.8,12.2,12.2,12.9,11.7,11.0,11.8,15.3,13.3,13.3,13.8];
    const ratVancouver=[6.6,7.7,8.4,8.4,9.3,9.5,10.6,9.5,10.3,10.6,10.8,11.8,12.6,12.6,11.9,13.0,13.3,12.0,12.3,11.8];
    const ratLondon=[6.9,8.3,7.7,6.8,6.7,7.2,6.9,6.8,7.3,6.9,7.1,7.1,6.9,6.9,8.2,8.6,8.0,8.7,8.1,9.1];
    const ratUS=[4.6,3.7,3.6,3.2,2.9,3.3,3.1,3.2,3.5,3.6,3.7,3.9,3.8,3.9,3.9,4.2,5.0,5.0,4.8,4.8];
    const affordThresh=globalYears.map(()=>3.0);
    const hkColor='#c0392b',sydColor='#d97326',vanColor='#b07a2e',lonColor='#7a8c92';
    new Chart(document.getElementById('globalAffordabilityChart'),{type:'line',data:{labels:globalYears.map(String),datasets:[
      {label:'Hong Kong',data:ratHK,borderColor:hkColor,backgroundColor:'transparent',borderWidth:2.5,pointRadius:2.5,pointHoverRadius:5,tension:0.3,spanGaps:false},
      {label:'Sydney',data:ratSydney,borderColor:sydColor,backgroundColor:'transparent',borderWidth:2.5,pointRadius:2.5,pointHoverRadius:5,tension:0.3},
      {label:'Vancouver',data:ratVancouver,borderColor:vanColor,backgroundColor:'transparent',borderWidth:2.5,pointRadius:2.5,pointHoverRadius:5,tension:0.3},
      {label:'Greater London',data:ratLondon,borderColor:lonColor,backgroundColor:'transparent',borderWidth:2.5,pointRadius:2.5,pointHoverRadius:5,tension:0.3},
      {label:'United States (national)',data:ratUS,borderColor:amber,backgroundColor:amberLight,borderWidth:3.5,pointRadius:3.5,pointHoverRadius:6,tension:0.3,fill:true},
      {label:"\u2018Affordable\u2019 threshold (3.0\u00d7)",data:affordThresh,borderColor:greenColor,backgroundColor:'transparent',borderWidth:1.5,borderDash:[6,4],pointRadius:0,pointHoverRadius:0,tension:0,fill:false}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'top',align:'center',labels:{boxWidth:10,usePointStyle:true,pointStyle:'circle',padding:12,color:tickColor,font:{size:10}}},tooltip:{backgroundColor:'rgba(10,9,8,0.95)',borderColor:amber,borderWidth:1,titleColor:amber,bodyColor:textColor,filter:c=>c.parsed.y!==null,callbacks:{label:c=>c.dataset.label+': '+c.parsed.y.toFixed(1)+'\u00d7 income'}}},scales:{x:{...cso()},y:{...cso('Price-to-Income Ratio'),min:2,max:25,ticks:{color:tickColor,font:{size:10},stepSize:5,callback:v=>v+'\u00d7'}}}}});

    // TAB 2: BTC HOUSE with trend projection
    const btcYears=Object.keys(btcData).map(Number);
    const btcHouseValues=btcYears.map(y=>+(homeData[y]/btcData[y]).toFixed(1));
    // Project trend to 2032 using log-linear regression on historical data
    const projYears=[2026,2027,2028,2029,2030,2031,2032];
    const allLabels=[...btcYears.map(String),...projYears.map(String)];
    // Simple exponential decay projection from observed trend (~98.6% decline over 12 years)
    const lastVal=btcHouseValues[btcHouseValues.length-1];
    const projValues=projYears.map((y,i)=>{const decay=Math.pow(0.72,i+1);return+(lastVal*decay).toFixed(2)});
    const historicalFull=[...btcHouseValues,...projYears.map(()=>null)];
    const trendFull=[...btcYears.map(()=>null),...[lastVal,...projValues.slice(0,-1)]];
    // Smooth trend line across full range for visual
    const trendLineData=btcYears.map((y,i)=>{const t=(y-2013)/(2032-2013);return+(367*Math.pow(1.5/367,t)).toFixed(2)});
    const trendLineFull=[...trendLineData,...projYears.map((y)=>{const t=(y-2013)/(2032-2013);return+(367*Math.pow(1.5/367,t)).toFixed(2)})];
    new Chart(document.getElementById('btcHouseChart'),{type:'line',data:{labels:allLabels,datasets:[{label:'Actual',data:historicalFull,borderColor:amber,backgroundColor:amberLight,borderWidth:2.5,pointBackgroundColor:amber,pointRadius:4,pointHoverRadius:7,fill:true,tension:0.3},{label:'Trend',data:trendLineFull,borderColor:'rgba(224,148,34,0.4)',backgroundColor:'transparent',borderWidth:2,borderDash:[8,4],pointRadius:0,tension:0.4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'top',align:'center',labels:{boxWidth:10,usePointStyle:true,pointStyle:'circle',padding:20,color:tickColor,font:{size:10},filter:item=>item.text!=='Projection'}},tooltip:{backgroundColor:'rgba(10,9,8,0.95)',borderColor:amber,borderWidth:1,titleColor:amber,bodyColor:textColor,callbacks:{title:c=>c[0].label,label:c=>{const y=parseInt(c.label);const isProj=y>2025;if(c.datasetIndex===1)return'Trend: ~'+c.parsed.y.toFixed(1)+' BTC';if(isProj)return null;return[c.parsed.y.toFixed(1)+' BTC','House: $'+(homeData[y]||0).toLocaleString(),'BTC price: $'+(btcData[y]||0).toLocaleString()]}}}},scales:{x:{...cso(),ticks:{color:function(c){return c.index>12?'rgba(106,98,86,0.5)':tickColor},font:{size:9}}},y:{...cso('Bitcoin Required'),type:'logarithmic',min:1,ticks:{color:tickColor,font:{size:10},callback:v=>{const a=[1,2,5,10,20,50,100,200,500];return a.includes(v)?v.toLocaleString():''}}}}}});

    // TAB 2: OPPORTUNITY COST CHART (indexed, log scale, fixed tooltips)
    // TAB 2: SEESAW — Real Opportunity Cost (growth of $1 invested, log scale).
    // Switchable start year: 2014, 2016, 2018, 2020, 2022 — matching the
    // 'It's Not Just Since 2013' table below the chart so readers can pivot
    // both views to the same anchor. Default is 2018 (recent enough to feel
    // realistic, with enough holding time to still show a ~9× outperformance
    // on log scale). The original 2013 anchor was editorially flattering but
    // dismissable as cherry-picked; the toggle replaces a fixed-default
    // chart with a reader-controlled comparison.
    let seesawInstance=null;
    function renderSeesaw(startYear){
      const visYrs=btcYears.filter(y=>y>=startYear);
      const idxBtc=visYrs.map(y=>+((btcData[y]/btcData[startYear])*100).toFixed(1));
      const idxHome=visYrs.map(y=>+((homeData[y]/homeData[startYear])*100).toFixed(1));
      const sub=document.getElementById('seesawSubtitle');
      if(sub) sub.textContent='Growth of $1 invested in '+startYear+' \u2014 bitcoin vs. housing (log scale)';
      if(seesawInstance) seesawInstance.destroy();
      seesawInstance=new Chart(document.getElementById('seesawChart'),{type:'line',data:{labels:visYrs.map(String),datasets:[{label:'Bitcoin',data:idxBtc,borderColor:amber,backgroundColor:'rgba(224,148,34,0.08)',borderWidth:2.5,pointRadius:3,tension:0.3,fill:true},{label:'Housing',data:idxHome,borderColor:red,backgroundColor:'transparent',borderWidth:2.5,pointRadius:3,tension:0.3,borderDash:[6,3]}]},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:true,position:'top',align:'center',labels:{boxWidth:10,usePointStyle:true,pointStyle:'circle',padding:24,color:tickColor,font:{size:10}}},tooltip:{backgroundColor:'rgba(10,9,8,0.95)',borderColor:amber,borderWidth:1,titleColor:amber,bodyColor:textColor,callbacks:{label:c=>{const pct=(c.parsed.y-100).toFixed(0);const sign=pct>=0?'+':'';const yr=visYrs[c.dataIndex];const actual=c.dataset.label==='Bitcoin'?btcData[yr]:homeData[yr];const priceFmt='$'+actual.toLocaleString();return c.dataset.label+': '+sign+Number(pct).toLocaleString()+'% since '+startYear+' ('+priceFmt+')'}}}},scales:{x:{...cso()},y:{...cso('Growth of $1 Invested'),type:'logarithmic',min:30,ticks:{color:tickColor,font:{size:10},callback:v=>{const a=[50,100,200,500,1000,2000,5000,10000,12000];if(!a.includes(v))return'';if(v===100)return'$1 (start)';return'$'+(v/100).toFixed(0)}}}}}});
    }
    document.querySelectorAll('.seesaw-start-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.seesaw-start-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        renderSeesaw(parseInt(btn.dataset.startyear,10));
      });
    });
    renderSeesaw(2018);

    // TAB 2: HOUSES VISUAL with mortgage comparison
    (function(){
        const invest=60000;const endBtc=88000;const endHome=416900;
        const scenarios=[
            {year:2015,btcPrice:272,homePrice:294000,rate:3.85},
            {year:2017,btcPrice:4348,homePrice:323500,rate:3.99},
            {year:2019,btcPrice:7362,homePrice:321500,rate:3.94},
            {year:2020,btcPrice:11072,homePrice:336900,rate:3.11}
        ];
        const houseFilled='<svg viewBox="0 0 24 24" width="26" height="26" style="margin:1px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))"><path d="M3 13l9-9 9 9" fill="none" stroke="#e09422" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" fill="none" stroke="#e09422" stroke-width="1.5"/><path d="M10 20v-5h4v5" fill="none" stroke="#e09422" stroke-width="1.2"/></svg>';
        const housePartial='<svg viewBox="0 0 24 24" width="26" height="26" style="margin:1px;opacity:0.25"><path d="M3 13l9-9 9 9" fill="none" stroke="#e09422" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" fill="none" stroke="#e09422" stroke-width="1.5"/><path d="M10 20v-5h4v5" fill="none" stroke="#e09422" stroke-width="1.2"/></svg>';
        const houseFilled32=houseFilled.replace('width="26" height="26"','width="32" height="32"');
        const housePartial32=housePartial.replace('width="26" height="26"','width="32" height="32"');
        const houseHollow='<svg viewBox="0 0 24 24" width="26" height="26" style="margin:1px;opacity:0.35"><path d="M3 13l9-9 9 9" fill="none" stroke="#c0392b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7" fill="none" stroke="#c0392b" stroke-width="1.2" stroke-dasharray="3 2"/><path d="M10 20v-5h4v5" fill="none" stroke="#c0392b" stroke-width="1" stroke-dasharray="2 2"/></svg>';
        function mp(p,r,y){const mr=r/100/12,n=y*12;return p*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1)}
        let html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;padding:0 0 0.8rem;border-bottom:1px solid var(--border);margin-bottom:0.2rem"><div style="border-right:1px solid var(--border);padding-right:1.5rem;font-size:0.82rem;text-transform:uppercase;letter-spacing:1.2px;color:var(--amber);font-weight:500">₿ Bought Bitcoin</div><div style="font-size:0.82rem;text-transform:uppercase;letter-spacing:1.2px;color:var(--red);font-weight:500">🏠 Bought the House</div></div>';
        scenarios.forEach(s=>{
            const btcBought=invest/s.btcPrice;
            const btcValue=btcBought*endBtc;
            const houses=btcValue/endHome;
            const fullH=Math.floor(houses);
            const partial=houses-fullH;
            let btcIcons='';
            for(let i=0;i<Math.min(fullH,15);i++)btcIcons+=houseFilled;
            if(partial>0.05)btcIcons+=housePartial;
            if(fullH>15)btcIcons+='<span style="font-size:0.8rem;color:var(--amber);margin-left:0.4rem;align-self:center">+'+(fullH-15)+' more\</span>';
            // Mortgage reality
            const loan=s.homePrice-invest;
            const yrsElapsed=2025-s.year;
            const monthlyPmt=mp(loan,s.rate,30);
            const totalPaid=Math.round(invest+(monthlyPmt*yrsElapsed*12));
            const mr2=s.rate/100/12;let bal=loan;for(let i=0;i<yrsElapsed*12;i++)bal=bal*(1+mr2)-monthlyPmt;bal=Math.max(0,Math.round(bal));
            const equity=endHome-bal;
            const equityPct=Math.round((equity/endHome)*100);

            html+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;padding:1.2rem 0;border-bottom:1px solid var(--border)">';
            // BTC side
            html+='<div style="border-right:1px solid var(--border);padding-right:1.5rem">';
            html+='<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem"><div style="font-family:Cormorant Garamond,serif;font-size:1.1rem;color:var(--amber)">'+s.year+'</div><div style="font-size:0.82rem;color:var(--text-muted)">$'+invest.toLocaleString()+' → Bitcoin</div></div>';
            html+='<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0;line-height:1;min-height:32px">'+btcIcons+'</div>';
            html+='<div style="font-size:0.85rem;color:var(--amber);margin-top:0.4rem;font-weight:500">'+houses.toFixed(1)+' houses <strong>outright</strong> · no debt</div>';
            html+='</div>';
            // Mortgage side
            html+='<div>';
            html+='<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem"><div style="font-family:Cormorant Garamond,serif;font-size:1.1rem;color:var(--red)">'+s.year+'</div><div style="font-size:0.82rem;color:var(--text-muted)">$'+invest.toLocaleString()+' → Down payment</div></div>';
            var fillH=Math.max(0,Math.min(20,equityPct*0.20));var eqHouse='<svg viewBox="0 0 24 24" width="26" height="26" style="margin:1px"><defs><clipPath id="c'+s.year+'"><rect x="0" y="'+(24-fillH)+'" width="24" height="'+fillH+'"/></clipPath></defs><path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="'+(equityPct>=100?'#e09422':'#c0392b')+'" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="var(--amber)" stroke-width="1.5" stroke-linejoin="round" clip-path="url(#c'+s.year+')"/></svg>';html+='<div style="min-height:32px;display:flex;align-items:center;gap:0.5rem">'+eqHouse+'<span style="font-size:0.78rem;color:var(--text-muted)">'+(equityPct<0?'<span style=\'color:var(--red)\'>Underwater</span>':equityPct+'% owned')+'</span></div>';
            html+='<div style="font-size:0.82rem;color:var(--text-muted);margin-top:0.4rem">1 house · '+equityPct+'% equity · <span style="color:var(--red)">$'+bal.toLocaleString()+' still owed</span></div>';
            html+='</div>';
            html+='</div>';
        });
        document.getElementById('housesVisual').innerHTML=html;
    })();

    // TAB 2: COMPARISON TABLE (fixed column)
    (function(){
        const startYears=[2014,2016,2018,2020,2022];
        const endY=2025;
        const thStyle='padding:0.6rem 0.8rem;color:var(--text-muted);font-size:0.78rem;text-transform:uppercase;letter-spacing:1px';
        // "BTC at start" column added so readers can see the actual entry
        // price the row's BTC Return % is computed against. End price is
        // constant across rows (2025 BTC ≈ \$88K), so we only surface the
        // start-year price; the end price is implied by '<start> → 2025'
        // plus the return %.
        let rows='<tr style="border-bottom:1px solid var(--border)"><td style="'+thStyle+'">Start Year</td><td style="'+thStyle+'">BTC at start</td><td style="'+thStyle+'">BTC Return</td><td style="'+thStyle+'">Housing Return</td><td style="'+thStyle+'">Difference</td></tr>';
        startYears.forEach(y=>{
            const btcR=((btcData[endY]-btcData[y])/btcData[y]*100).toFixed(0);
            const homeR=((homeData[endY]-homeData[y])/homeData[y]*100).toFixed(0);
            // Wealth ratio: $1 in BTC vs $1 in housing at start year. Ratio of
            // the multipliers (1 + return) — meaningful regardless of sign.
            // Previous version divided the two return percentages directly,
            // which is mathematically nonsense and produced a non-monotonic
            // series (2016 showed a larger 'ratio' than 2014 even with less
            // holding time). It also broke entirely when housing's return was
            // negative — Math.max(homeR, 1) collapsed the divisor to 1 and
            // displayed the BTC return itself as the 'ratio'.
            const btcMult=btcData[endY]/btcData[y];
            const homeMult=homeData[endY]/homeData[y];
            const ratio=Math.round(btcMult/homeMult);
            const homeSign=homeR<0?'':'+';
            rows+='<tr style="border-bottom:1px solid rgba(224,148,34,0.06)"><td style="padding:0.6rem 0.8rem;color:var(--text);font-weight:500">'+y+' → '+endY+'</td><td style="padding:0.6rem 0.8rem;color:var(--text-dim)">$'+btcData[y].toLocaleString()+'</td><td style="padding:0.6rem 0.8rem;color:var(--amber);font-weight:500">+'+Number(btcR).toLocaleString()+'%</td><td style="padding:0.6rem 0.8rem;color:var(--text-dim)">'+homeSign+homeR+'%</td><td style="padding:0.6rem 0.8rem;color:var(--amber);font-size:0.75rem">BTC outperformed '+ratio+'\u00d7</td></tr>';
        });
        document.getElementById('returnTable').innerHTML=rows;
        // End-price reference line above the table — surfaces the 2025 BTC
        // and median-home values that every row's return % is computed
        // against. Without this, readers could see the start price (new
        // 'BTC at start' column) and the % return, but couldn't reconstruct
        // the end price without hovering the chart. Sourced from the same
        // data constants so future MONTHLY_REFRESH updates flow through.
        const endRef=document.getElementById('returnTableEndPrices');
        if(endRef){
            endRef.innerHTML='All rows end at <strong>'+endY+'</strong> prices: <strong style="color:var(--amber)">BTC $'+btcData[endY].toLocaleString()+'</strong> &middot; <strong>Median US home $'+homeData[endY].toLocaleString()+'</strong>';
        }
    })();

    // TAB 4: BURDEN - line chart with threshold lines
    function monthlyPayment(p,r,y){const mr=r/100/12,n=y*12;if(mr===0)return p/n;return p*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1)}
    const burdenYears=btcYears;
    const burdenValues=burdenYears.map(y=>{const p=homeData[y],d=p*0.2,l=p-d,r=mortgageRates[y],m=monthlyPayment(l,r,30),mi=incomeData[y]/12;return+((m/mi)*100).toFixed(1)});
    // Threshold datasets
    const costBurdened=burdenYears.map(()=>30);
    const severelyBurdened=burdenYears.map(()=>40);
    const breakingPoint=burdenYears.map(()=>50);
    new Chart(document.getElementById('burdenChart'),{type:'line',data:{labels:burdenYears.map(String),datasets:[
        {label:'Mortgage as % of Income',data:burdenValues,borderColor:amber,backgroundColor:amberLight,borderWidth:2.5,pointBackgroundColor:burdenValues.map(v=>v>=30?red:amber),pointRadius:5,pointHoverRadius:7,fill:true,tension:0.3},
        {label:'Cost-Burdened (30%)',data:costBurdened,borderColor:'rgba(192,57,43,0.5)',borderWidth:1.5,borderDash:[8,4],pointRadius:0,fill:false},
        {label:'Severely Burdened (40%)',data:severelyBurdened,borderColor:'rgba(192,57,43,0.3)',borderWidth:1,borderDash:[4,4],pointRadius:0,fill:false},
        {label:'Breaking Point (50%)',data:breakingPoint,borderColor:'rgba(192,57,43,0.2)',borderWidth:1,borderDash:[2,4],pointRadius:0,fill:false}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'top',align:'center',labels:{boxWidth:10,usePointStyle:false,padding:16,color:tickColor,font:{size:9},filter:item=>item.text!=='Mortgage as % of Income'}},tooltip:{backgroundColor:'rgba(10,9,8,0.95)',borderColor:amber,borderWidth:1,titleColor:amber,bodyColor:textColor,filter:c=>c.datasetIndex===0,callbacks:{label:c=>{const v=c.parsed.y;const status=v>=30?' — cost-burdened':'';return v.toFixed(1)+'% of gross income'+status}}}},scales:{x:{...cso()},y:{...cso('% of Gross Monthly Income'),min:0,max:55,ticks:{color:tickColor,font:{size:10},stepSize:10,callback:v=>v+'%'}}}}});

    // TAB 4: TOTAL COST - with gap multiplier labels
    const costYears=[2015,2018,2021,2025];
    const purchasePrices=costYears.map(y=>homeData[y]);
    const totalCosts=costYears.map(y=>{const p=homeData[y],d=p*0.2,l=p-d,r=mortgageRates[y],m=monthlyPayment(l,r,30),tt=p*0.012*30,ti=1800*30,tm=p*0.01*30;return Math.round(d+(m*360)+tt+ti+tm)});
    const costLabels=costYears.map(y=>'Purchased '+y);
    const costMultipliers=costYears.map((y,i)=>(totalCosts[i]/purchasePrices[i]).toFixed(1));
    // Custom plugin to draw multiplier labels
    const multiplierPlugin={id:'multiplierLabels',afterDraw:function(chart){
        const ctx=chart.ctx;const meta=chart.getDatasetMeta(1);
        meta.data.forEach((bar,i)=>{
            const x=bar.x;const y=bar.y-8;
            ctx.save();ctx.textAlign='center';ctx.textBaseline='bottom';
            ctx.font='bold 15px Inter, sans-serif';ctx.fillStyle=red;
            ctx.fillText(costMultipliers[i]+'×',x,y-14);
            ctx.font='11px Inter, sans-serif';ctx.fillStyle='#9a9080';
            ctx.fillText('purchase price',x,y);
            ctx.restore();
        });
    }};
    new Chart(document.getElementById('totalCostChart'),{type:'bar',data:{labels:costLabels,datasets:[{label:'Purchase Price',data:purchasePrices,backgroundColor:'rgba(224,148,34,0.4)',borderColor:amber,borderWidth:1,borderRadius:3},{label:'True All-In Cost',data:totalCosts,backgroundColor:'rgba(192,57,43,0.5)',borderColor:red,borderWidth:1,borderRadius:3}]},plugins:[multiplierPlugin],options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true,position:'top',align:'center',labels:{boxWidth:10,usePointStyle:true,pointStyle:'circle',padding:20,color:tickColor,font:{size:10}}},tooltip:{backgroundColor:'rgba(10,9,8,0.95)',borderColor:amber,borderWidth:1,titleColor:amber,bodyColor:textColor,callbacks:{label:c=>{if(c.datasetIndex===1)return c.dataset.label+': $'+c.parsed.y.toLocaleString()+' ('+costMultipliers[c.dataIndex]+'× purchase price)';return c.dataset.label+': $'+c.parsed.y.toLocaleString()}}}},scales:{x:{...cso(),ticks:{font:{size:9}}},y:{...cso('US Dollars'),ticks:{color:tickColor,font:{size:10},callback:v=>'$'+(v/1000).toFixed(0)+'K'}}}}});

    // TAB 3: CALCULATOR
    function runCalculator(){
        const sy=parseInt(document.getElementById('calcYear').value);
        // Scope to .toggle-group so we pick the retrospective method
        // toggle's active button, never the Real/Nominal display-mode
        // toggle (which also has .toggle-btn class and a .active state).
        // Defensive fallback to 'leverage' (markup default) if no active
        // button is found.
        const _retroBtn = document.querySelector('.toggle-group .toggle-btn.active');
        const mode = _retroBtn ? _retroBtn.dataset.mode : 'leverage';
        const dca=document.getElementById('calcDCA').checked;
        const ey=2025;
        const medianHs=homeData[sy],medianHe=homeData[ey],bs=btcData[sy],be=btcData[ey];const _customRaw=(document.getElementById('customHomePrice')||{}).value||'';const _customNum=parseFloat(_customRaw.replace(/[$,\s]/g,''));const _customValid=!isNaN(_customNum)&&_customNum>=50000&&_customNum<=10000000;const hs=_customValid?_customNum:medianHs;const he=_customValid?Math.round(_customNum*(medianHe/medianHs)):medianHe;const _isCustom=_customValid;
        const _prevailingRate=mortgageRates[sy];const _rateRaw=(document.getElementById('customRate')||{}).value||'';const _rateNum=parseFloat(_rateRaw.replace(/[%\s]/g,''));const _rateValid=!isNaN(_rateNum)&&_rateNum>=0.5&&_rateNum<=15;const rate=_rateValid?_rateNum:_prevailingRate;const _isCustomRate=_rateValid;const yrs=ey-sy;
        const dp=mode==='cash'?hs:Math.round(hs*0.2);
        const asOf='April 2025';
        const medianRef=_isCustom?('at $'+Math.round(hs).toLocaleString()+' each'):('at $'+he.toLocaleString()+' each (median)');

        // Assumptions display
        const assumeEl=document.getElementById('calcAssumptions');
        if(mode==='cash'){
            assumeEl.innerHTML='<strong style="color:var(--text-dim)">Scenario:</strong> You had $'+dp.toLocaleString()+' in '+sy+' (median home price). You either bought the house outright in cash, or invested the full amount in bitcoin and continued renting.';
        }else{
            assumeEl.innerHTML='<strong style="color:var(--text-dim)">Scenario:</strong> You had $'+dp.toLocaleString()+' in '+sy+' (20% of median home price $'+hs.toLocaleString()+'). You either used it as a down payment with a 30-year fixed mortgage at '+rate+'%'+(_isCustomRate?' <span style="font-size:0.78rem;color:var(--text-muted)">(vs. prevailing '+_prevailingRate+'%)</span>':'')+', or invested it in bitcoin and rented instead.';
        }

        // ── SHARED CALCS ──
        const bb=dp/bs;
        const lumpValue=bb*be;
        const lumpReturn=((lumpValue-dp)/dp*100).toFixed(0);
        const mortgageMonthly=monthlyPayment(hs*0.8,rate,30);
        const _defaultRent=Math.round(mortgageMonthly*0.75);const _rentRaw=(document.getElementById('customRent')||{}).value||'';const _rentNum=parseFloat(_rentRaw.replace(/[$,\s]/g,''));const _rentValid=!isNaN(_rentNum)&&_rentNum>=100&&_rentNum<=50000;const _isCustomRent=_rentValid;const estRent=_rentValid?Math.round(_rentNum):_defaultRent;
        const totalRentPaid=estRent*yrs*12;
        const lumpNet=lumpValue-totalRentPaid;
        const lumpHouses=lumpNet/he;

        // ── HOUSE SIDE ──
        let houseEquity=0,monthlyMortgage=0,houseTotalSpent=0,remainingBal=0,equityPct=0,debtFreeYear=sy+30;
        let hL,hD;
        if(mode==='cash'){
            const ha=((he-hs)/hs*100).toFixed(1);
            houseEquity=he;houseTotalSpent=hs;remainingBal=0;equityPct=100;debtFreeYear=sy;
            monthlyMortgage=mortgageMonthly;
            hL='$'+Math.round(he).toLocaleString();
            var _cv='<div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.8rem"><svg viewBox="0 0 24 24" width="32" height="32"><path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="var(--amber)" fill-opacity="0.18" stroke="#e09422" stroke-width="1.7" stroke-linejoin="round"/></svg><span style="font-size:0.9rem;color:var(--text)">1 house, outright</span></div>';
            hD=_cv+'Home appreciation: '+ha+'%<br>'+
               'Current value: $'+Math.round(he).toLocaleString()+(_isCustom?' <span style="font-size:0.78rem;color:var(--text-muted)">(applied same appreciation rate)</span>':'')+'<br>'+
               'Rent paid: $0 <span style="font-size:0.78rem;color:var(--text-muted)">(you live in it)</span><br>'+
               'No debt — but no bitcoin either';
        }else{
            const la=hs*0.8;monthlyMortgage=monthlyPayment(la,rate,30);
            const mps=yrs*12;const r=rate/100/12;
            let bal=la;for(let i=0;i<mps;i++)bal=bal*(1+r)-monthlyMortgage;bal=Math.max(0,bal);
            remainingBal=bal;houseEquity=he-bal;equityPct=Math.round((houseEquity/he)*100);debtFreeYear=sy+30;
            const pt=hs*0.012*yrs,ins=150*mps,mnt=hs*0.01*yrs;
            houseTotalSpent=(monthlyMortgage*mps)+dp+pt+ins+mnt;
            const interestMain=Math.round((monthlyMortgage*mps)-(la-bal));
            hL='$'+Math.round(houseEquity).toLocaleString();
            var _fh=Math.max(0,Math.min(20,equityPct*0.20));var _ev='<div style=\"display:flex;align-items:center;gap:0.6rem;margin-bottom:0.8rem\"><svg viewBox=\"0 0 24 24\" width=\"32\" height=\"32\"><defs><clipPath id=\"ec\"><rect x=\"0\" y=\"'+(24-_fh)+'\" width=\"24\" height=\"'+_fh+'\"/></clipPath></defs><path d=\"M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5\" fill=\"none\" stroke=\"'+(equityPct>=100?'#e09422':'#c0392b')+'\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/><path d=\"M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5\" fill=\"none\" stroke=\"var(--amber)\" stroke-width=\"1.5\" stroke-linejoin=\"round\" clip-path=\"url(#ec)\"/></svg><span style=\"font-size:0.9rem;color:var(--text)\">'+(equityPct<0?'<span style=\\\'color:var(--red)\\\'>Underwater</span>':equityPct+'% owned')+'</span></div>';hD=_ev+
               'Monthly mortgage: $'+Math.round(monthlyMortgage).toLocaleString()+'/mo<br>'+
               'Interest paid so far: <span style="color:var(--red)">$'+interestMain.toLocaleString()+'</span> <span style="font-size:0.78rem;color:var(--text-muted)">(dead money)</span><br>'+
               'Remaining loan: <span style="color:var(--red)">$'+Math.round(bal).toLocaleString()+'</span><br>'+
               'Rent paid: $0 <span style="font-size:0.78rem;color:var(--text-muted)">(you live in it)</span>';
        }

        // ── MAIN CARDS ──
        document.getElementById('calcResultsContainer').innerHTML=
            '<div class="calc-result-card bitcoin">'+
                '<h4>\u20BF Bought Bitcoin + Rented ('+sy+')</h4>'+
                '<div class="period-label">'+sy+' \u00B7 Purchased</div>'+
                '<div class="invested-line">Invested <strong>$'+dp.toLocaleString()+'</strong>'+(mode==='leverage'?' <span class="note">(20% down)</span>':' <span class="note">(cash equivalent)</span>')+'</div>'+
                '<div class="period-divider"></div>'+
                '<div class="period-label">'+asOf+' \u00B7 Current Value</div>'+
                '<div class="result-value">$'+Math.round(lumpNet).toLocaleString()+' <span style="font-size:0.85rem;color:var(--text-muted)">net</span></div>'+
                '<div style="font-size:0.78rem;color:var(--text-muted);margin-top:-0.3rem;margin-bottom:0.7rem;font-style:italic">after $'+totalRentPaid.toLocaleString()+' rent paid over '+yrs+' years</div>'+
                '<div class="result-detail">'+(function(){var lh=lumpHouses;var fH=Math.floor(lh);var pt=lh-fH;var ic='';var fI='<svg viewBox=\"0 0 24 24\" width=\"32\" height=\"32\" style=\"margin:1px\"><path d=\"M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5\" fill=\"none\" stroke=\"var(--amber)\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/></svg>';var pI='<svg viewBox=\"0 0 24 24\" width=\"32\" height=\"32\" style=\"margin:1px;opacity:0.45\"><path d=\"M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5\" fill=\"none\" stroke=\"var(--amber)\" stroke-width=\"1.2\" stroke-dasharray=\"2 2\" stroke-linejoin=\"round\"/></svg>';for(var i=0;i<Math.min(fH,15);i++)ic+=fI;if(pt>0.05)ic+=pI;var ov=fH>15?'<span style=\"font-size:0.8rem;color:var(--amber);margin-left:0.4rem;align-self:center\">+'+(fH-15)+' more</span>':'';return '<div style=\"display:flex;flex-wrap:wrap;align-items:center;gap:0;margin-bottom:0.8rem\">'+ic+ov+'</div>';})()+
                    'BTC purchased: '+bb.toFixed(2)+' @ $'+bs.toLocaleString()+'<br>'+
                    'Gross BTC value:<span class="help-tip" tabindex="0">?<span class="tip-content">Value of your BTC holdings at today\u2019s market price, before subtracting rent paid during the holding period.</span></span> $'+Math.round(lumpValue).toLocaleString()+' <span style="font-size:0.78rem;color:var(--text-muted)">(before rent)</span><br>'+
                    'Est. monthly rent: $'+estRent.toLocaleString()+'/mo'+(mode==='leverage'?(' <span style="font-size:0.78rem;color:var(--text-muted)">(vs. mortgage $'+Math.round(mortgageMonthly).toLocaleString()+')</span>'):'')+'<br>'+
                    'Total rent paid: $'+totalRentPaid.toLocaleString()+'<br>'+
                    '<span style="color:var(--amber);font-weight:500">You could now buy '+lumpHouses.toFixed(1)+' houses <strong>outright</strong></span> <span style="font-size:0.78rem;color:var(--text-muted)">('+medianRef+')</span><br>'+
                    '<span style="font-size:0.78rem;color:var(--text-muted);display:block;margin-top:0.4rem">No leverage. No interest. No property taxes. No maintenance.</span>'+
                '</div>'+
            '</div>'+
            '<div class="calc-result-card house">'+
                '<h4>\uD83C\uDFE0 Bought the House ('+sy+')</h4>'+
                '<div class="period-label">'+sy+' \u00B7 Purchased</div>'+
                '<div class="invested-line">Invested <strong>$'+dp.toLocaleString()+'</strong>'+(mode==='leverage'?' <span class="note">(20% down of $'+hs.toLocaleString()+')</span>':' <span class="note">(cash, paid in full)</span>')+'</div>'+
                '<div class="period-divider"></div>'+
                '<div class="period-label">'+asOf+' \u00B7 Current Value</div>'+
                '<div class="result-value">'+hL+'</div>'+
                '<div class="result-detail">'+hD+'</div>'+
            '</div>';

        // ── DCA SECTION ──
        const dcaContainer=document.getElementById('dcaResultContainer');
        const totalSummary=document.getElementById('totalSummary');
        const totalWrapper=document.getElementById('totalSummaryWrapper');

        if(dca){
            const monthlySavings=Math.round(mortgageMonthly-estRent);
            let dcaBtc=0,dcaTotalInvested=0;
            for(let yr=sy;yr<ey;yr++){
                const ybp=btcData[yr]||btcData[ey];
                dcaBtc+=(monthlySavings/ybp)*12;
                dcaTotalInvested+=monthlySavings*12;
            }
            const dcaValue=dcaBtc*be;
            const totalBtc=bb+dcaBtc;
            const totalBtcValue=totalBtc*be;
            const totalBtcNet=totalBtcValue-totalRentPaid;
            const totalHouses=totalBtcNet/he;
            const extraHouses=totalHouses-1;
            const totalInvested=dp+dcaTotalInvested;
            const yrsRemaining=debtFreeYear-2025;
            const principalRepaid=(hs*0.8)-remainingBal;
            const interestPaid=Math.round((mortgageMonthly*yrs*12)-principalRepaid);
            const houseOutflow=Math.round(houseTotalSpent);
            const btcOutflow=Math.round(totalInvested+totalRentPaid);

            dcaContainer.innerHTML=
                '<div class="calc-result-card bitcoin" style="border-style:dashed">'+
                    '<h4>\u20BF Monthly DCA — Rent vs. Mortgage Savings</h4>'+
                    '<div class="result-value">$'+Math.round(dcaValue).toLocaleString()+'</div>'+
                    '<div class="result-detail">'+
                        'Est. mortgage: $'+Math.round(mortgageMonthly).toLocaleString()+'/mo<br>'+
                        'Est. rent: $'+estRent.toLocaleString()+'/mo<br>'+
                        'Monthly DCA into BTC: <span style="color:var(--amber)">$'+monthlySavings.toLocaleString()+'/mo</span><br>'+
                        'BTC accumulated: '+dcaBtc.toFixed(2)+' BTC<br>'+
                        '<span>Total invested via DCA: $'+dcaTotalInvested.toLocaleString()+'</span>'+
                        ' <span style="font-size:0.78rem;color:var(--text-muted)">($'+monthlySavings.toLocaleString()+'/mo \u00d7 '+(yrs*12)+' months)</span>'+
                    '</div>'+
                '</div>';

            const ls='font-size:0.88rem;line-height:2.2;';
            const lm='color:var(--text-muted)';
            const lr='color:var(--red)';
            const la='color:var(--amber)';
            totalWrapper.style.display='block';
            var _bh = (function(){var hf='<svg viewBox="0 0 24 24" width="32" height="32" style="margin:1px"><path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="#e09422" stroke-width="1.5" stroke-linejoin="round"/></svg>';var hp='<svg viewBox="0 0 24 24" width="32" height="32" style="margin:1px;opacity:0.3"><path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="#e09422" stroke-width="1.5" stroke-dasharray="2 2" stroke-linejoin="round"/></svg>';var lh=Math.max(0,totalHouses);var fH=Math.floor(lh);var pt=lh-fH;var ic="";for(var i=0;i<Math.min(fH,15);i++)ic+=hf;if(pt>0.05)ic+=hp;if(fH===0&&pt<=0.05)ic+=hp;var ov=fH>15?('<span style="font-size:0.8rem;color:var(--amber);margin-left:0.4rem;align-self:center">+'+(fH-15)+' more</span>'):"";return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0;margin:0.4rem 0 0.6rem">'+ic+ov+'</div>';})();
            totalSummary.innerHTML=
                '<div style="background:var(--bg-card);border:1px solid var(--amber-dim);border-radius:8px;padding:1.5rem 2rem">'+
                    '<div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:1.2px;color:var(--amber);margin-bottom:0.5rem">\u20BF Bitcoin — Total Position</div>'+
                    '<div style="font-family:Cormorant Garamond,serif;font-size:1.8rem;font-weight:600;color:var(--amber);margin-bottom:0.15rem;line-height:1.1">$'+Math.round(totalBtcNet).toLocaleString()+' <span style="font-size:0.8rem;color:var(--text-muted)">net</span></div>'+
                    '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.7rem;font-style:italic">= $'+Math.round(lumpValue).toLocaleString()+' gross BTC + $'+Math.round(dcaValue).toLocaleString()+' DCA \u2212 $'+totalRentPaid.toLocaleString()+' rent</div>'+_bh+
                    '<div style="font-size:0.78rem;color:var(--amber-dim);margin-bottom:0.6rem">values as of '+asOf+'</div>'+
                    '<div style="border-top:1px solid var(--border);padding-top:0.6rem">'+
                        '<div style="'+ls+la+'">You could now buy <strong>the house, outright</strong></div>'+
                        '<div style="'+ls+la+'">Debt outstanding: $0</div>'+
                        (mode==='leverage'?'<div style="'+ls+la+'">Interest paid: $0</div>':'')+
                        '<div style="'+ls+la+'">Debt-free: <strong>now</strong></div>'+
                        '<div style="'+ls+la+';font-weight:600">You could now buy '+extraHouses.toFixed(1)+' additional houses, also outright <span style="color:var(--text-muted);font-weight:400;font-size:0.82rem">('+(1+extraHouses).toFixed(1)+' total)</span></div>'+
                        '<div style="'+ls+'color:var(--text-dim)">Rent paid: $'+totalRentPaid.toLocaleString()+'</div>'+
                        '<div style="'+ls+'color:var(--text);border-top:1px solid var(--border);padding-top:0.3rem;margin-top:0.3rem;font-weight:500">Total outflow: $'+btcOutflow.toLocaleString()+'</div>'+
                    '</div>'+
                '</div>'+
                '<div style="background:var(--bg-card);border:1px solid var(--red-dim);border-radius:8px;padding:1.5rem 2rem">'+
                    '<div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:1.2px;color:var(--red);margin-bottom:0.5rem">\uD83C\uDFE0 House — Total Position</div>'+
                    '<div style="font-family:Cormorant Garamond,serif;font-size:1.8rem;font-weight:600;color:var(--text-dim);margin-bottom:0.3rem">$'+Math.round(houseEquity).toLocaleString()+'</div>'+(function(){var fh=Math.max(0,Math.min(20,equityPct*0.20));var st=equityPct>=100?'#e09422':'#c0392b';return '<div style="display:flex;align-items:center;gap:0.6rem;margin:0.4rem 0 0.6rem"><svg viewBox="0 0 24 24" width="32" height="32"><defs><clipPath id="tlc"><rect x="0" y="'+(24-fh)+'" width="24" height="'+fh+'"/></clipPath></defs>'+'<path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="'+st+'" stroke-width="1.5" stroke-linejoin="round"/>'+'<path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="var(--amber)" stroke-width="1.7" stroke-linejoin="round" clip-path="url(#tlc)"/></svg>'+'<span style="font-size:0.85rem;color:var(--text-muted)">'+(equityPct>=100?'fully owned':equityPct+'% owned')+'</span></div>';})()+
                    '<div style="font-size:0.78rem;'+lm+';margin-bottom:0.6rem">values as of '+asOf+'</div>'+
                    '<div style="border-top:1px solid var(--border);padding-top:0.6rem">'+
                        '<div style="'+ls+lm+'">Ownership: <span style="color:var(--text)">'+equityPct+'% of 1 home</span></div>'+
                        (mode==='leverage'?'<div style="'+ls+lr+'">Debt outstanding: $'+Math.round(remainingBal).toLocaleString()+'</div>':'')+
                        (mode==='leverage'?'<div style="'+ls+lr+'">Interest paid: $'+interestPaid.toLocaleString()+' <span style="'+lm+';font-size:0.78rem">(dead money)</span></div>':'')+
                        (mode==='leverage'?'<div style="'+ls+lr+'">Debt-free: '+debtFreeYear+' <span style="'+lm+'">('+yrsRemaining+' yrs away)</span></div>':'')+
                        '<div style="'+ls+lm+'">Rent paid: $0 <span style="font-size:0.78rem">(you live in it)</span></div>'+
                        '<div style="'+ls+'color:var(--text);border-top:1px solid var(--border);padding-top:0.3rem;margin-top:0.3rem;font-weight:500">Total outflow: $'+houseOutflow.toLocaleString()+'</div>'+
                    '</div>'+
                '</div>';
        }else{
            dcaContainer.innerHTML='';
            totalWrapper.style.display='none';
            totalSummary.innerHTML='';
        }
        var _crUpdate=document.getElementById('customRent');if(_crUpdate&&typeof _defaultRent!=='undefined'){_crUpdate.placeholder='$'+_defaultRent.toLocaleString()+' (our estimate)';}
    }

    // EVENT LISTENERS
    // Hash-based tab routing
    var tabMap={'crisis':'affordability','btc-house':'priced-in-bitcoin','calculator':'postponed-purchase','ceiling':'the-ceiling'};
    var reverseMap={};Object.keys(tabMap).forEach(function(k){reverseMap[tabMap[k]]=k});
    function activateTab(tabId){
        document.querySelectorAll('.tab-btn').forEach(function(x){x.classList.remove('active')});
        document.querySelectorAll('.tab-panel').forEach(function(x){x.classList.remove('active');x.classList.add('js-hidden')});
        var btn=document.querySelector('.tab-btn[data-tab="'+tabId+'"]');
        var panel=document.getElementById('panel-'+tabId);
        if(btn)btn.classList.add('active');
        if(panel){panel.classList.add('active');panel.classList.remove('js-hidden')}
        setTimeout(function(){window.dispatchEvent(new Event('resize'))},100);
    }
    function initTabFromHash(){
        var hash=window.location.hash.replace('#','');
        if(hash&&reverseMap[hash]){activateTab(reverseMap[hash])}
        else{
            document.querySelectorAll('.tab-panel').forEach(function(x){if(!x.classList.contains('active'))x.classList.add('js-hidden')});
        }
    }
    document.querySelectorAll('.tab-btn').forEach(function(b){b.addEventListener('click',function(){
        activateTab(b.dataset.tab);
        var slug=tabMap[b.dataset.tab]||b.dataset.tab;
        history.replaceState(null,null,'#'+slug);
    })});
    window.addEventListener('hashchange',initTabFromHash);
    initTabFromHash();
    // Scope to .toggle-group: this handler manages ONLY the retrospective
    // method toggle (Cash / 20% Down + Mortgage). Without the scope, this
    // would match every .toggle-btn on the page — including the Real/Nominal
    // display-mode toggle and the seesaw start-year buttons — and a click
    // anywhere would strip .active from retrospective method buttons. Each
    // other group has its own scoped click handler defined elsewhere.
    document.querySelectorAll('.toggle-group .toggle-btn').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('.toggle-group .toggle-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');runCalculator()})});
    document.getElementById('calcYear').addEventListener('change',function(){var cp=document.getElementById('customHomePrice');if(cp){cp.value='';var y=parseInt(this.value);var m=homeData[y];if(m)cp.placeholder='$'+m.toLocaleString()+' ('+y+' median)';}var cr=document.getElementById('customRent');if(cr){cr.value='';}var crt=document.getElementById('customRate');if(crt){crt.value='';var yr=parseInt(this.value);var mr=mortgageRates&&mortgageRates[yr];if(mr)crt.placeholder=mr+'% ('+yr+' avg)';}runCalculator();});var _cpEl=document.getElementById('customHomePrice');if(_cpEl){_cpEl.addEventListener('input',runCalculator);var _yVal=parseInt(document.getElementById('calcYear').value);if(homeData[_yVal])_cpEl.placeholder='$'+homeData[_yVal].toLocaleString()+' ('+_yVal+' median)';}var _crEl=document.getElementById('customRent');if(_crEl){_crEl.addEventListener('input',runCalculator);}var _crtEl=document.getElementById('customRate');if(_crtEl){_crtEl.addEventListener('input',runCalculator);var _yrInit=parseInt(document.getElementById('calcYear').value);if(mortgageRates[_yrInit])_crtEl.placeholder=mortgageRates[_yrInit]+'% ('+_yrInit+' avg)';}
    document.getElementById('calcDCA').addEventListener('change',function(){
        document.getElementById('dcaSection').style.display=this.checked?'block':'none';
        runCalculator();
    });
    // Format-on-blur for the three custom optional inputs. Strips
    // non-numeric chars and reformats with $ and commas (money) or %
    // suffix (rate). Empty values stay empty so the placeholder remains
    // visible. Parsers in runCalculator already strip $ , % whitespace
    // so internal math is unaffected.
    (function(){
        function fmtMoney(el){if(!el) return;var raw=(el.value||'').replace(/[^0-9.]/g,'');if(!raw){el.value='';return;}var n=parseFloat(raw);if(!isFinite(n)){el.value='';return;}el.value='$'+Math.round(n).toLocaleString();}
        function fmtPercent(el){if(!el) return;var raw=(el.value||'').replace(/[^0-9.]/g,'');if(!raw){el.value='';return;}var n=parseFloat(raw);if(!isFinite(n)){el.value='';return;}el.value=parseFloat(n.toFixed(2))+'%';}
        var hp=document.getElementById('customHomePrice');if(hp) hp.addEventListener('blur',function(){fmtMoney(hp);});
        var rt=document.getElementById('customRent');if(rt) rt.addEventListener('blur',function(){fmtMoney(rt);});
        var rate=document.getElementById('customRate');if(rate) rate.addEventListener('blur',function(){fmtPercent(rate);});
    })();
    runCalculator();
    

/* ═══════════════════════════════════════════════════════════════════
   PROJECTION CALCULATOR — migrated from /the-power-law.js
   Lives inside #calc-mode-projection. PL_A, PL_B, PL_FLOOR, PL_CEIL,
   GENESIS_TS, and plPrice() are now provided by shared/power-law-data.js
   (loaded before this file via njk page_scripts) — same source of
   truth as /the-power-law and /disciplined-rebalancing.
   ═══════════════════════════════════════════════════════════════════ */

// ═══════ TOOL B: FORWARD CALCULATOR ═══════
(function(){
  var resultsEl = document.getElementById('fwdResults');
  if(!resultsEl) return;

  // JS state mirrors the active scenario / purchase-method buttons. The
  // initial values here MUST match the .active class set in the markup
  // and the SCHEMA def: keys (single source of truth: the markup).
  // Belt-and-suspenders DOM-sync at end of init() force-syncs these
  // regardless, so a future drift in any of the three defaults gets
  // corrected before the first calc render.
  var scenario = 'trend';
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
        input.value = '$' + p.toLocaleString();
        if(status) status.textContent = '(live)';
        runFwdCalc();
      })
      .catch(function(){
        input.value = '$' + LIVE_BTC_FALLBACK.toLocaleString();
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

  // ── Display mode toggle (Real vs Nominal) ──────────────────────────
  // Controls whether projected values render in today's purchasing
  // power (real) or future dollars (nominal). Default 'real'. Mode
  // state is read live from the DOM via _displayMode() inside the
  // render function, so this handler only needs to update the active
  // class and trigger a re-render.
  document.querySelectorAll('.display-mode-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.display-mode-btn').forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      runFwdCalc();
    });
  });
  function _displayMode(){
    var b = document.querySelector('.display-mode-btn.active');
    return b ? b.getAttribute('data-mode') : 'real';
  }

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

  // Compute DCA accumulation for the projection. Returns null when DCA
  // doesn't apply (cash method, or no positive monthly savings, or invalid
  // BTC price inputs). Used by runFwdCalc to drive the Total Comparison
  // visibility + augmented totals, and by renderAdvanced to populate the
  // DCA card in the "go deeper" panel. Single source of truth so the two
  // surfaces can't drift apart.
  function computeProjectionDca(method, btcNow, futurePrice, monthlyMort, impliedRent, horizonYrs){
    if(method !== 'mortgage') return null;
    var monthlySavings = Math.max(0, monthlyMort - impliedRent);
    if(monthlySavings <= 0 || btcNow <= 0 || futurePrice <= 0) return null;
    var dcaBtc = 0;
    var totalMonths = horizonYrs * 12;
    for(var m = 0; m < totalMonths; m++){
      // Geometric interpolation of BTC price across the horizon — same
      // assumption used in the renderAdvanced display logic.
      var frac = m / totalMonths;
      var monthPrice = btcNow * Math.pow(futurePrice/btcNow, frac);
      dcaBtc += monthlySavings / monthPrice;
    }
    return {
      dcaBtc: dcaBtc,
      dcaInvested: monthlySavings * totalMonths,
      monthlySavings: monthlySavings
    };
  }

  function runFwdCalc(){
    // Display-mode helpers (Real vs Nominal toggle). Read once per render
    // and use throughout to pick which value/label to emit. modeVal picks
    // between two pre-computed values; modeUnit / modePeriodLabel /
    // modeBigNumberLabel return the human-readable annotation that
    // accompanies the value.
    var _mode = _displayMode();
    function modeVal(realV, nomV){ return _mode === 'real' ? realV : nomV; }
    function modeUnit(){ return _mode === 'real' ? "in today\u2019s $" : "nominal"; }
    function modePeriodLabel(){ return _mode === 'real' ? 'real, today\u2019s $' : 'nominal, future $'; }
    function modeBigLabel(metric){ return _mode === 'real' ? ('projected ' + metric + ' in today\u2019s purchasing power') : ('projected ' + metric + ' in future dollars'); }
    var horizonYrs = parseInt(horizonSel.value);
    var btcNow = parseNum('fwdBtcNow');
    var homePrice = parseNum('fwdHomePrice');
    // Home appreciation input is now in REAL terms (per canonical §3.5).
    // Combine with sitewide inflation to get nominal rate for the math below,
    // which produces nominal future values.
    var homeApprReal = parseNum('fwdHomeAppreciation');
    var inflRate = window.ModelingAssumptions.get('inflation').value;
    var homeApprNominalPct = window.CalcHelpers.realToNominal(homeApprReal, inflRate);
    var homeAppr = homeApprNominalPct / 100;
    var mortRate = parseNum('fwdMortgageRate');

    if(btcNow <= 0 || homePrice <= 0) return;

    // ── Stage 5b helpers — real-terms display layer ──
    // Math throughout this function continues to produce NOMINAL future values
    // (the existing calculations are unchanged). At display time we deflate
    // those values to today's purchasing power using the sitewide inflation
    // rate, and present real as primary with nominal as secondary.
    function toReal(nominalFutureValue) {
      return window.CalcHelpers.deflateToToday(nominalFutureValue, inflRate, horizonYrs);
    }
    // Format a value pair for real-primary display: real value as primary,
    // nominal-equivalent shown in a smaller dim secondary line below.
    function fmtDual(nominalValue, realValueOpt) {
      var real = (realValueOpt !== undefined) ? realValueOpt : toReal(nominalValue);
      return '<span class="dual-real">'+fmt(real)+'</span>' +
             '<span class="dual-nominal" style="display:block;font-size:.7rem;color:var(--text-muted);font-weight:400;letter-spacing:0;text-transform:none">'+fmt(nominalValue)+' nominal</span>';
    }
    // Inline variant for use inside detail-line prose where the dual treatment
    // should be compact (real (nominal nominal)).
    function fmtDualInline(nominalValue, realValueOpt) {
      var real = (realValueOpt !== undefined) ? realValueOpt : toReal(nominalValue);
      return fmt(real) + ' <span style="font-size:.78rem;color:var(--text-muted)">('+fmt(nominalValue)+' nominal)</span>';
    }

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
    // Optional user-override for monthly rent. Default = 75% of equivalent
    // mortgage (the established assumption used elsewhere in the page).
    // Mirrors the customRent override pattern from retrospective.
    var _fwdRentEl = document.getElementById('fwdMonthlyRent');
    var _fwdRentRaw = _fwdRentEl ? (_fwdRentEl.value || '').replace(/[$,\s]/g, '') : '';
    var _fwdRentNum = parseFloat(_fwdRentRaw);
    var _fwdRentValid = isFinite(_fwdRentNum) && _fwdRentNum >= 100 && _fwdRentNum <= 50000;
    var impliedRent = _fwdRentValid ? _fwdRentNum : (monthlyMort * 0.75);
    // Update placeholder to reflect the live default
    if (_fwdRentEl && !_fwdRentValid) {
      _fwdRentEl.placeholder = '$' + Math.round(monthlyMort * 0.75).toLocaleString() + ' (75% of mortgage)';
    }
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
    else { futurePrice = futureCeil; scenarioLabel = 'Upper (cycle peak)'; }

    var btcValue = btcBought * futurePrice;
    var btcNet = btcValue - totalRentPaid;
    // Real-terms equivalents (today's purchasing power)
    var btcValueReal = toReal(btcValue);
    var futurePriceReal = toReal(futurePrice);
    // For btcNet: btcValue is a future-dollar amount (deflate to real);
    // totalRentPaid is accumulated nominal payments — first-order approximation,
    // we treat its dollar magnitude as today's-equivalent purchasing power
    // (each monthly payment is in then-dollars, but the user thinks of rent as
    // a today's-dollar cost; per Approach 3 we don't do per-payment deflation
    // at this stage). The accumulated totals retain their nominal magnitudes.
    var btcNetReal = btcValueReal - totalRentPaid;
    // Returns and CAGRs computed against real values for consistency with the
    // real-primary display. Real return is the honest "purchasing-power gain"
    // figure; nominal return would inflate the apparent gain by inflation.
    var btcReturn = ((btcNetReal - amount) / amount * 100).toFixed(0);
    var btcCAGR = btcNetReal > 0 ? ((Math.pow(btcNetReal/amount, 1/horizonYrs) - 1) * 100).toFixed(1) : '—';

    // ── HOUSE SIDE ──
    var futureHomeValue = homePrice * Math.pow(1 + homeAppr, horizonYrs);
    var futureHomeValueReal = toReal(futureHomeValue);
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
    // Real equity: equity = futureHomeValue - bal, both at end-of-horizon
    // dollars; deflate to today's purchasing power
    var equityReal = toReal(equity);

    var propTax = homePrice * 0.012 * horizonYrs;
    var insurance = 150 * 12 * horizonYrs;
    var maintenance = homePrice * 0.01 * horizonYrs;
    var totalHouseCost = amount + totalMortPaid + propTax + insurance + maintenance;
    // House CAGR: real appreciation rate is exactly the canonical homeApprReal
    // input (the user picked it). Display that directly rather than recomputing.
    var houseCAGR = homeApprReal.toFixed(1);

    // ── HOUSES SUMMARY ──
    // Ratio is dimension-independent: btcNet/futureHomeValue (both nominal) =
    // btcNetReal/futureHomeValueReal. Use real values to keep the result well-
    // defined when btcNetReal goes near zero.
    var housesCanBuy = Math.max(0, btcNetReal / futureHomeValueReal);

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
        '<div class="period-label">'+endYear+' \u00b7 Projected ('+modePeriodLabel()+')</div>' +
        '<div class="big-number">'+fmt(modeVal(btcNetReal, btcNet))+' <span style="font-size:.8rem;color:var(--text-muted)">net</span></div>' +
        '<div class="big-number-label">'+modeBigLabel('net position')+'</div>' +
        houseIconsHtml +
        '<div class="detail-line">BTC purchased: '+btcBought.toFixed(4)+' @ '+fmt(btcNow)+'/BTC</div>' +
        '<div class="detail-line">Projected BTC price: <strong>'+fmt(modeVal(futurePriceReal, futurePrice))+'</strong> <span style="font-size:.78rem;color:var(--text-muted)">'+modeUnit()+'</span></div>' +
        '<div class="detail-line">Gross BTC value:<span class="help-tip" tabindex="0">?<span class="tip-content">Value of your BTC holdings at the projected future market price, before subtracting rent paid during the holding period.</span></span> '+fmt(modeVal(btcValueReal, btcValue))+' <span style="font-size:.78rem;color:var(--text-muted)">'+modeUnit()+'</span></div>' +
        '<div class="detail-line">Est. monthly rent: '+fmt(impliedRent)+'/mo <span style="font-size:.78rem;color:var(--text-muted)">(75% of equivalent mortgage)</span></div>' +
        '<div class="detail-line">Total rent paid: <span class="negative">'+fmt(totalRentPaid)+'</span> <span style="font-size:.72rem;color:var(--text-muted)">accumulated</span></div>' +
        '<div class="detail-line">Total real return: <span class="highlight">'+btcReturn+'%</span> <span style="font-size:.72rem;color:var(--text-muted)">in purchasing-power terms</span></div>' +
        (btcCAGR !== '—' ? '<div class="detail-line">Implied real CAGR: <span class="highlight">'+btcCAGR+'%</span></div>' : '') +
        '<div class="detail-line" style="color:var(--amber);font-weight:500;margin-top:.6rem">You could buy '+housesCanBuy.toFixed(1)+' houses <strong>outright</strong> in '+endYear+' <span style="font-size:.78rem;color:var(--text-muted);font-weight:400">\u2014 projected home value '+fmt(modeVal(futureHomeValueReal, futureHomeValue))+' each '+modeUnit()+', vs. '+fmt(homePrice)+' today</span></div>' +
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
          '<div class="period-label">'+endYear+' \u00b7 Projected ('+modePeriodLabel()+')</div>' +
          '<div class="big-number">'+fmt(modeVal(equityReal, equity))+'</div>' +
          '<div class="big-number-label">'+modeBigLabel('equity')+'</div>' +
          ownershipVisual +
          '<div class="detail-line">Home value in '+horizonYrs+' yrs: '+fmt(modeVal(futureHomeValueReal, futureHomeValue))+' <span style="font-size:.78rem;color:var(--text-muted)">'+modeUnit()+'; '+houseCAGR+'%/yr real</span></div>' +
          '<div class="detail-line">Monthly mortgage: '+fmt(monthlyMort)+'/mo at '+mortRate+'%</div>' +
          '<div class="detail-line">Interest paid: <span class="negative">'+fmt(interestPaid)+'</span> <span style="font-size:.78rem;color:var(--text-muted)">(dead money, accumulated)</span></div>' +
          '<div class="detail-line">Remaining loan: '+(bal > 0 ? '<span class="negative">'+fmt(bal)+'</span>' : 'Paid off')+'</div>' +
          '<div class="detail-line">Rent paid: $0 <span style="font-size:.78rem;color:var(--text-muted)">(you live in it)</span></div>' +
          '<div class="detail-line">Total cost of ownership: <span class="negative">'+fmt(totalHouseCost)+'</span> <span style="font-size:.72rem;color:var(--text-muted)">accumulated</span></div>' +
        '</div>';
    } else {
      houseHtml =
        '<div class="calc-card house">' +
          '<h4>&#127968; Bought the House ('+startYear+')</h4>' +
          '<div class="period-label">'+startYear+' \u00b7 Today</div>' +
          '<div class="invested-line">Invested <strong>'+fmt(amount)+'</strong> <span style="text-transform:none;letter-spacing:0;font-size:.75rem;color:var(--text-muted)">(cash, paid in full)</span></div>' +
          '<div class="period-divider"></div>' +
          '<div class="period-label">'+endYear+' \u00b7 Projected ('+modePeriodLabel()+')</div>' +
          '<div class="big-number">'+fmt(modeVal(futureHomeValueReal, futureHomeValue))+'</div>' +
          '<div class="big-number-label">'+modeBigLabel('home value')+'</div>' +
          ownershipVisual +
          '<div class="detail-line">Home value in '+horizonYrs+' yrs: '+fmt(modeVal(futureHomeValueReal, futureHomeValue))+' <span style="font-size:.78rem;color:var(--text-muted)">'+modeUnit()+'; '+houseCAGR+'%/yr real</span></div>' +
          '<div class="detail-line">Mortgage: $0 <span style="font-size:.78rem;color:var(--text-muted)">(no debt)</span></div>' +
          '<div class="detail-line">Interest paid: $0</div>' +
          '<div class="detail-line">Rent paid: $0 <span style="font-size:.78rem;color:var(--text-muted)">(you live in it)</span></div>' +
          '<div class="detail-line">Total cost of ownership: <span class="negative">'+fmt(totalHouseCost)+'</span> <span style="font-size:.72rem;color:var(--text-muted)">accumulated</span></div>' +
          '<div class="detail-line" style="margin-top:.8rem;font-size:.78rem;color:var(--text-muted);font-style:italic">Cash buyer avoids rent \u2014 a real benefit not captured in projected value. Toggle "Go deeper" below to model it.</div>' +
        '</div>';
    }

    resultsEl.innerHTML =
      '<div class="calc-results-grid">' + btcHtml + houseHtml + '</div>';

    // ── TOTAL COMPARISON (parity with retrospective) ───────────────────
    // Mirrors retrospective behavior: only renders when the user toggles
    // "go deeper" (DCA the rent-vs-mortgage savings into bitcoin). Without
    // DCA, the headline cards above already surface the lump-sum position
    // and the Total Comparison would just restate them — same logic that
    // gates the retrospective's wrapper on its dca flag. When DCA is
    // active, the BTC card here aggregates the lump-sum BTC position with
    // the BTC accumulated by DCA'ing monthly savings (single source of
    // truth: computeProjectionDca helper, also used by renderAdvanced).
    // The augmented figures are meaningfully different from the headline
    // cards — that delta IS the point of showing this section.
    var fwdTotalWrapper = document.getElementById('fwdTotalSummaryWrapper');
    var fwdTotalSummary = document.getElementById('fwdTotalSummary');
    if(fwdTotalWrapper && fwdTotalSummary){
      var advancedCheck = document.getElementById('fwdAdvancedCheck');
      var dcaResult = computeProjectionDca(method, btcNow, futurePrice, monthlyMort, impliedRent, horizonYrs);
      var dcaActive = !!(advancedCheck && advancedCheck.checked && dcaResult);
      if(!dcaActive){
        fwdTotalWrapper.style.display = 'none';
        fwdTotalSummary.innerHTML = '';
      } else {
        // ── DCA-augmented BTC position ────────────────────────────────
        // Lump-sum BTC + DCA-accumulated BTC, valued at the projected
        // future BTC price. Outflow = down payment + DCA cash + rent paid.
        // dcaActive guarantees method === 'mortgage' (computeProjectionDca
        // returns null for cash), so debt-related lines can assume mortgage.
        var totalBtcBought = btcBought + dcaResult.dcaBtc;
        var totalBtcValueNominal = totalBtcBought * futurePrice;
        var totalBtcValueReal = toReal(totalBtcValueNominal);
        // Component breakdown for the inline math sub-line. The headline
        // totalBtcNetReal equals btcLumpReal + dcaValueReal − totalRentPaid
        // (totalRentPaid stays nominal per the established convention for
        // accumulated payment streams; same mixing used in retrospective).
        var btcLumpReal = toReal(btcBought * futurePrice);
        var dcaValueReal = toReal(dcaResult.dcaBtc * futurePrice);
        var totalBtcNetReal = totalBtcValueReal - totalRentPaid;
        var totalBtcNetNominal = totalBtcValueNominal - totalRentPaid;
        var totalInvestedCash = amount + dcaResult.dcaInvested;
        var btcOutflowAugmented = totalInvestedCash + totalRentPaid;
        var housesCanBuyAugmented = Math.max(0, totalBtcNetReal / futureHomeValueReal);
        var mortgageEndYear = startYear + 30;
        var debtFreeLabel = (endYear >= mortgageEndYear ? 'before horizon' : (mortgageEndYear + ' (' + (mortgageEndYear - endYear) + ' yrs past horizon)'));
        var ls = 'font-size:0.88rem;line-height:2.2;';
        var lm = 'color:var(--text-muted)';
        var lr = 'color:var(--red)';
        var la = 'color:var(--amber)';
        var bhVisual = (function(){
          var hf = '<svg viewBox="0 0 24 24" width="32" height="32" style="margin:1px"><path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="#e09422" stroke-width="1.5" stroke-linejoin="round"/></svg>';
          var hp = '<svg viewBox="0 0 24 24" width="32" height="32" style="margin:1px;opacity:0.3"><path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="#e09422" stroke-width="1.5" stroke-dasharray="2 2" stroke-linejoin="round"/></svg>';
          var lh = Math.max(0, housesCanBuyAugmented);
          var fH = Math.floor(lh);
          var pt = lh - fH;
          var ic = '';
          for(var i = 0; i < Math.min(fH, 15); i++) ic += hf;
          if(pt > 0.05) ic += hp;
          if(fH === 0 && pt <= 0.05) ic += hp;
          var ov = fH > 15 ? ('<span style="font-size:0.8rem;color:var(--amber);margin-left:0.4rem;align-self:center">+' + (fH - 15) + ' more</span>') : '';
          return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:0;margin:0.4rem 0 0.6rem">' + ic + ov + '</div>';
        })();
        var equityVisual = (function(){
          var fh = Math.max(0, Math.min(20, equityPct * 0.20));
          var st = equityPct >= 100 ? '#e09422' : '#c0392b';
          var clipId = 'fwdTlc';
          return '<div style="display:flex;align-items:center;gap:0.6rem;margin:0.4rem 0 0.6rem"><svg viewBox="0 0 24 24" width="32" height="32"><defs><clipPath id="' + clipId + '"><rect x="0" y="' + (24 - fh) + '" width="24" height="' + fh + '"/></clipPath></defs>'
            + '<path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="' + st + '" stroke-width="1.5" stroke-linejoin="round"/>'
            + '<path d="M3 13l9-9 9 9M5 12v8h14v-8M10 20v-5h4v5" fill="none" stroke="var(--amber)" stroke-width="1.7" stroke-linejoin="round" clip-path="url(#' + clipId + ')"/></svg>'
            + '<span style="font-size:0.85rem;color:var(--text-muted)">' + (equityPct >= 100 ? 'fully owned' : equityPct + '% owned') + '</span></div>';
        })();
        var extraHouses = Math.max(0, housesCanBuyAugmented - 1);
        var canBuyOutright = housesCanBuyAugmented >= 1;
        fwdTotalWrapper.style.display = 'block';
        fwdTotalSummary.innerHTML =
          '<div style="background:var(--bg-card);border:1px solid var(--amber-dim);border-radius:8px;padding:1.5rem 2rem">'
          + '<div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:1.2px;color:var(--amber);margin-bottom:0.5rem">\u20BF Bitcoin \u2014 Total Position</div>'
          + '<div style="font-family:Cormorant Garamond,serif;font-size:1.8rem;font-weight:600;color:var(--amber);margin-bottom:0.15rem;line-height:1.1">' + fmt(modeVal(totalBtcNetReal, totalBtcNetNominal)) + ' <span style="font-size:0.8rem;color:var(--text-muted);font-weight:400">net</span></div>'
          + '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.6rem;font-style:italic">= ' + fmt(modeVal(btcLumpReal, btcBought*futurePrice)) + ' gross BTC + ' + fmt(modeVal(dcaValueReal, dcaResult.dcaBtc*futurePrice)) + ' DCA \u2212 ' + fmt(totalRentPaid) + ' rent <span style="font-size:0.72rem">(' + modeUnit() + ')</span></div>'
          + bhVisual
          + '<div style="font-size:0.78rem;color:var(--amber-dim);margin-bottom:0.6rem">projected to ' + asOf + ' \u2014 ' + scenarioLabel + ' \u00b7 lump sum + DCA</div>'
          + '<div style="border-top:1px solid var(--border);padding-top:0.6rem">'
            + (canBuyOutright
                ? '<div style="' + ls + la + '">You could buy <strong>the house, outright</strong></div>'
                : '<div style="' + ls + la + '">You could buy <strong>' + (housesCanBuyAugmented * 100).toFixed(0) + '%</strong> of the house outright</div>')
            + '<div style="' + ls + la + '">Debt outstanding: $0</div>'
            + '<div style="' + ls + la + '">Interest paid: $0</div>'
            + '<div style="' + ls + la + '">Debt-free: <strong>always</strong></div>'
            + (canBuyOutright && extraHouses > 0.05
                ? '<div style="' + ls + la + ';font-weight:600">You could buy ' + extraHouses.toFixed(1) + ' additional house' + (extraHouses >= 1.05 ? 's' : '') + ', also outright <span style="color:var(--text-muted);font-weight:400;font-size:0.82rem">(' + housesCanBuyAugmented.toFixed(1) + ' total)</span></div>'
                : '')
            + '<div style="' + ls + 'color:var(--text-dim)">Rent paid: ' + fmt(totalRentPaid) + '</div>'
            + '<div style="' + ls + 'color:var(--text);border-top:1px solid var(--border);padding-top:0.3rem;margin-top:0.3rem;font-weight:500">Total outflow: ' + fmt(btcOutflowAugmented) + '</div>'
          + '</div>'
        + '</div>'
        + '<div style="background:var(--bg-card);border:1px solid var(--red-dim);border-radius:8px;padding:1.5rem 2rem">'
          + '<div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:1.2px;color:var(--red);margin-bottom:0.5rem">\uD83C\uDFE0 House \u2014 Total Position</div>'
          + '<div style="font-family:Cormorant Garamond,serif;font-size:1.8rem;font-weight:600;color:var(--text-dim);margin-bottom:0.5rem;line-height:1.1">' + fmt(modeVal(equityReal, equity)) + '</div>'
          + equityVisual
          + '<div style="font-size:0.78rem;' + lm + ';margin-bottom:0.6rem">projected to ' + asOf + '</div>'
          + '<div style="border-top:1px solid var(--border);padding-top:0.6rem">'
            + '<div style="' + ls + lm + '">Ownership: <span style="color:var(--text)">' + equityPct + '% of 1 home</span></div>'
            + '<div style="' + ls + lr + '">Debt outstanding: ' + fmt(Math.round(bal)) + '</div>'
            + '<div style="' + ls + lr + '">Interest paid: ' + fmt(Math.round(interestPaid)) + ' <span style="' + lm + ';font-size:0.78rem">(dead money)</span></div>'
            + '<div style="' + ls + lr + '">Debt-free: ' + debtFreeLabel + '</div>'
            + '<div style="' + ls + lm + '">Rent paid: $0 <span style="font-size:0.78rem">(you live in it)</span></div>'
            + '<div style="' + ls + 'color:var(--text);border-top:1px solid var(--border);padding-top:0.3rem;margin-top:0.3rem;font-weight:500">Total outflow: ' + fmt(Math.round(totalHouseCost)) + '</div>'
          + '</div>'
        + '</div>';
      }
    }

    // ── ADVANCED SECTION ──
    renderAdvanced({
      method: method, amount: amount, horizonYrs: horizonYrs, inflRate: inflRate,
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

    // Local helper for deflating the advanced section's future values to today's $
    function toReal(nominalFutureValue) {
      return window.CalcHelpers.deflateToToday(nominalFutureValue, s.inflRate, s.horizonYrs);
    }

    // Display mode helpers (mirror runFwdCalc — read live from DOM so the
    // advanced section honors the same Real/Nominal toggle as the main
    // result cards).
    var _mode = _displayMode();
    function modeVal(realV, nomV){ return _mode === 'real' ? realV : nomV; }
    function modeUnit(){ return _mode === 'real' ? "in today\u2019s $" : "nominal"; }
    function modeBigLabel(metric){ return _mode === 'real' ? ('projected ' + metric + ' in today\u2019s purchasing power') : ('projected ' + metric + ' in future dollars'); }

    if(s.method === 'mortgage'){
      // DCA the rent-vs-mortgage savings into BTC. Math lives in
      // computeProjectionDca (single source of truth, also used by the
      // Total Comparison block in runFwdCalc).
      var dcaR = computeProjectionDca(s.method, s.btcNow, s.futurePrice, s.monthlyMort, s.impliedRent, s.horizonYrs);
      var monthlySavings = dcaR ? dcaR.monthlySavings : Math.max(0, s.monthlyMort - s.impliedRent);
      var dcaBtc = dcaR ? dcaR.dcaBtc : 0;
      var totalMonths = s.horizonYrs * 12;
      var dcaValue = dcaBtc * s.futurePrice;
      var dcaValueReal = toReal(dcaValue);
      var dcaTotalInvested = dcaR ? dcaR.dcaInvested : monthlySavings * totalMonths;
      note.innerHTML = 'If you rent instead of buying, your monthly housing cost is ~75% of a mortgage payment. The difference \u2014 <strong>'+fmt(monthlySavings)+'/mo</strong> \u2014 invested in bitcoin each month compounds the opportunity cost over the horizon.';
      leftEl.innerHTML =
        '<div class="calc-card bitcoin" style="border-style:dashed">' +
          '<h4>&#8383; Monthly DCA \u2014 Rent vs. Mortgage Savings</h4>' +
          '<div class="big-number">'+fmt(modeVal(dcaValueReal, dcaValue))+'</div>' +
          '<div class="big-number-label">'+modeBigLabel('DCA value')+' ('+s.endYear+')</div>' +
          '<div class="detail-line">Est. mortgage: '+fmt(s.monthlyMort)+'/mo</div>' +
          '<div class="detail-line">Est. rent: '+fmt(s.impliedRent)+'/mo</div>' +
          '<div class="detail-line">Monthly DCA into BTC: <span class="highlight">'+fmt(monthlySavings)+'/mo</span></div>' +
          '<div class="detail-line">BTC accumulated: '+dcaBtc.toFixed(4)+' BTC</div>' +
          '<div class="detail-line">Total invested via DCA: '+fmt(dcaTotalInvested)+' <span style="font-size:.72rem;color:var(--text-muted)">accumulated (\u2248'+fmt(monthlySavings)+'/mo \u00d7 '+totalMonths+' months)</span></div>' +
          '<div class="detail-line" style="margin-top:.8rem;font-size:.78rem;color:var(--text-muted);font-style:italic">DCA assumes BTC price follows a smooth geometric path from today\u2019s price to the projected endpoint (itself derived from the <a href="/the-power-law.html" style="color:var(--amber)">Power Law</a> scenario above).</div>' +
        '</div>';
      rightEl.innerHTML = '';
    } else {
      // Cash: S&P investment of imputed rent savings.
      // Input is REAL return per canonical §3.5; convert to nominal for math.
      var spReal = parseNum('fwdAdvancedRate');
      if(spReal <= 0) spReal = 7;
      var inflForSp = window.ModelingAssumptions.get('inflation').value;
      var rate = window.CalcHelpers.realToNominal(spReal, inflForSp) / 100;
      var monthlyRate = rate / 12;
      var months = s.horizonYrs * 12;
      var spFV = monthlyRate > 0 ? s.impliedRent * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) : s.impliedRent * months;
      var spFVReal = toReal(spFV);
      var spInvested = s.impliedRent * months;
      note.innerHTML = 'As a cash buyer, you avoid paying rent \u2014 a real benefit worth roughly <strong>'+fmt(s.impliedRent)+'/mo</strong> (75% of an equivalent mortgage). If invested monthly at '+spReal.toFixed(1)+'%/yr real (sitewide real-return assumption; ~'+(rate*100).toFixed(1)+'%/yr nominal at today\u2019s inflation), those savings compound into:';
      leftEl.innerHTML = '';
      rightEl.innerHTML =
        '<div class="calc-card house" style="border-style:dashed">' +
          '<h4>&#128200; Imputed Rent &rarr; S&amp;P 500</h4>' +
          '<div class="big-number">'+fmt(modeVal(spFVReal, spFV))+'</div>' +
          '<div class="big-number-label">'+modeBigLabel('portfolio')+' ('+s.endYear+')</div>' +
          '<div class="detail-line">Rent avoided: '+fmt(s.impliedRent)+'/mo</div>' +
          '<div class="detail-line">Invested monthly at: <span class="highlight">'+spReal.toFixed(1)+'%/yr real</span></div>' +
          '<div class="detail-line">Total invested: '+fmt(spInvested)+' <span style="font-size:.72rem;color:var(--text-muted)">accumulated</span></div>' +
          '<div class="detail-line">Total real gains: '+fmt(spFVReal - spInvested)+' <span style="font-size:.72rem;color:var(--text-muted)">in today\u2019s purchasing power</span></div>' +
          '<div class="detail-line" style="margin-top:.8rem;font-size:.78rem;color:var(--text-muted);font-style:italic">Default rate is the sitewide real-return assumption (5% diversified portfolio). 7% S&amp;P historical and 3% conservative are also valid choices; preference syncs across calculators on this site.</div>' +
        '</div>';
    }
  }

  // ── Event listeners ──
  ['fwdBtcNow','fwdHomePrice','fwdHomeAppreciation','fwdMortgageRate','fwdAdvancedRate','fwdMonthlyRent'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener('input', runFwdCalc);
  });
  // Format-on-blur for projection inputs — parity with retrospective
  // calculator (commit 7fd3284). Money fields get $X,XXX; percent fields
  // get X.X%. Empty leaves placeholder visible. Values are parsed back
  // via parseNum() inside runFwdCalc, which strips $/,/%/whitespace, so
  // the formatting is purely cosmetic and doesn't affect math.
  (function(){
    function bindMoney(id){
      var el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('blur', function(){
        var raw = (el.value || '').replace(/[^0-9.]/g, '');
        if(!raw){ el.value = ''; return; }
        var n = parseFloat(raw);
        if(!isFinite(n)){ el.value = ''; return; }
        el.value = '$' + Math.round(n).toLocaleString();
      });
    }
    function bindPercent(id){
      var el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('blur', function(){
        var raw = (el.value || '').replace(/[^0-9.\-]/g, '');
        if(!raw){ el.value = ''; return; }
        var n = parseFloat(raw);
        if(!isFinite(n)){ el.value = ''; return; }
        // One decimal place — matches the rate-style convention used
        // for retrospective's custom-rate input and the canonical inputs.
        el.value = (Math.round(n * 10) / 10) + '%';
      });
    }
    bindMoney('fwdHomePrice');
    bindMoney('fwdBtcNow');
    bindMoney('fwdMonthlyRent');
    bindPercent('fwdHomeAppreciation');
    bindPercent('fwdMortgageRate');
    bindPercent('fwdAdvancedRate');
  })();
  horizonSel.addEventListener('change', runFwdCalc);
  document.getElementById('fwdAdvancedCheck').addEventListener('change', runFwdCalc);

  // ── Canonical integration (per STYLE_GUIDE §3.5) ──
  // Real estate appreciation input is bound to lcs.realEstate canonical.
  // S&P advanced rate input is bound to lcs.realReturns canonical.
  // Both are REAL terms; the math above converts to nominal for the existing
  // calc (Stage 5b will convert outputs to real-primary display).

  function syncFwdHomeApprFromCanonical(){
    var current = window.ModelingAssumptions.get('realEstate');
    var input = document.getElementById('fwdHomeAppreciation');
    if(input && parseFloat(input.value) !== current.value) {
      // Apply % format to match the blur formatter (consistent appearance
      // whether the value comes from canonical, URL/storage, or user edit).
      input.value = (Math.round(current.value * 10) / 10) + '%';
    }
  }
  function syncFwdAdvancedRateFromCanonical(){
    var current = window.ModelingAssumptions.get('realReturns');
    var input = document.getElementById('fwdAdvancedRate');
    if(input && parseFloat(input.value) !== current.value) {
      input.value = (Math.round(current.value * 10) / 10) + '%';
    }
  }

  var apprInput = document.getElementById('fwdHomeAppreciation');
  if(apprInput){
    apprInput.addEventListener('change', function(){
      var v = parseFloat(apprInput.value);
      if(isFinite(v)) {
        window.ModelingAssumptions.set('realEstate', 'custom', v);
      }
    });
  }
  var advInput = document.getElementById('fwdAdvancedRate');
  if(advInput){
    advInput.addEventListener('change', function(){
      // realReturns has no Custom field per canonical, but we still let users
      // type a value here; we map it to the closest preset by rounding.
      // For Stage 1 simplicity, just write the typed value to the canonical
      // by treating as "diversified" preset override via the preset value
      // mechanism. Stage 2's rich UI will replace this with proper preset
      // selection.
      // For now, we just don't write (canonical drives the input on load,
      // user override stays local to the input).
    });
  }

  // Subscribe to canonical changes (cross-tab, reset events)
  if(window.ModelingAssumptions && window.ModelingAssumptions.subscribe){
    window.ModelingAssumptions.subscribe(function(dim){
      if(dim === 'realEstate' || dim === '*') syncFwdHomeApprFromCanonical();
      if(dim === 'realReturns' || dim === '*') syncFwdAdvancedRateFromCanonical();
      if(dim === 'inflation' || dim === '*') runFwdCalc();
      runFwdCalc();
    });
  }

  // ── Initial setup ──
  syncFwdHomeApprFromCanonical();
  syncFwdAdvancedRateFromCanonical();
  updateAdvancedToggleLabel();
  fetchLiveBtcPrice(); // runs runFwdCalc on completion

  // Expose for the calc-mode toggle handler (allows safety re-trigger
  // if initial run happened while #calc-mode-projection was hidden).
  window.runFwdCalc = runFwdCalc;
})();

/* ═══════════════════════════════════════════════════════════════════
   CALC-MODE TOGGLE HANDLER — Retrospective ↔ Projection
   Wires the toggle UI inside #panel-calculator. Clicking either label
   activates that mode; clicking the central switch toggles between them.
   On first switch to projection, kicks runFwdCalc() if available so
   results render even before any input change.
   ═══════════════════════════════════════════════════════════════════ */
(function bindCalcModeToggle(){
    var toggle = document.querySelector('.calc-mode-toggle');
    if(!toggle) return;
    var labels = toggle.querySelectorAll('.calc-mode-label');
    var switchBtn = toggle.querySelector('.calc-mode-switch');
    var contents = document.querySelectorAll('.calc-mode-content');
    var projectionInitialized = false;

    function setMode(mode){
        toggle.dataset.activeMode = mode;
        labels.forEach(function(l){
            var isActive = l.dataset.mode === mode;
            l.classList.toggle('active', isActive);
            l.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        contents.forEach(function(c){
            c.classList.toggle('active', c.id === 'calc-mode-' + mode);
        });
        if(mode === 'projection' && !projectionInitialized){
            projectionInitialized = true;
            // The forward calculator IIFE wires its own listeners on load,
            // but its initial run may have happened while #calc-mode-projection
            // was display:none. Re-run if the function is exposed globally.
            if(typeof window.runFwdCalc === 'function'){
                try { window.runFwdCalc(); } catch(e){}
            }
        }
    }

    labels.forEach(function(l){
        l.addEventListener('click', function(){ setMode(l.dataset.mode); });
    });
    switchBtn.addEventListener('click', function(){
        var current = toggle.dataset.activeMode || 'retrospective';
        setMode(current === 'retrospective' ? 'projection' : 'retrospective');
    });

    // Auto-activate projection mode when arriving with a deep-link.
    // Recognized hashes:
    //   #projection                — canonical short form (public-facing alias)
    //   #calc-mode-projection      — legacy long form; matches the DOM id
    //                                of the projection panel. Still routes
    //                                correctly for any external links that
    //                                use it, but the URL is rewritten to the
    //                                short form on landing so the browser
    //                                bar shows the cleaner alias.
    // The base tab routing handles #calculator (default tab). When the
    // page lands with one of the projection hashes, we ensure the tab
    // is also calculator (where the toggle lives) and then flip the mode.
    function applyHashToMode(){
        var h = location.hash.replace('#','');
        if(h === 'projection' || h === 'calc-mode-projection'){
            // Canonicalize the URL to the short form. replaceState avoids
            // polluting browser history and avoids firing hashchange again.
            if(h === 'calc-mode-projection'){
                history.replaceState(null, '', '#projection');
            }
            // Make sure the calculator tab is active first
            var calcTabBtn = document.querySelector('.tab-btn[data-tab="calculator"]');
            if(calcTabBtn && !calcTabBtn.classList.contains('active')){
                calcTabBtn.click();
            }
            setMode('projection');
        }
    }
    applyHashToMode();
    window.addEventListener('hashchange', applyHashToMode);
})();


// ═══════ SCENARIO URL SYNC & SHARE — BvRE ═══════
// URL ⇄ input state for both calculator modes (retrospective and
// projection). The mode itself is captured by the existing #projection
// hash convention (see applyHashToMode); this IIFE handles only the
// query-param surface for slider/select/checkbox state. Pattern
// follows SITE_GUIDE §17.5 with BvRE-specific schema:
//
//   Retrospective:
//     year       integer 2014–2021       default 2017
//     dca        '1' if checked          omit otherwise
//   Projection:
//     home       integer (USD)            default 420000
//     horizon    integer 5|10|15|20       default 10
//     appr       decimal (home appr %)    default 3.5
//     mortgage   decimal (mortgage %)     default 6.8
//     method     'cash' | 'mortgage'      default 'mortgage'
//     pscenario  'floor'|'trend'|'upper'  default 'trend'
//     advanced   '1' if checked           omit otherwise
//     advrate    decimal (investment %)   default 7
//
// fwdBtcNow is intentionally NOT in the URL — it's a live-fetched
// value that goes stale within hours, so a shared link should let the
// receiver's calculator fetch the current price rather than pin a
// past value. Same reasoning as BAS's exclusion of `price`.
//
// Unknown params preserved on the URL per §17.5 forward-compat. The
// retrospective/projection IIFEs above wire 'input'/'change' to their
// own runCalculator/runFwdCalc paths; this IIFE adds writer hooks on
// the same events and reader logic that programmatically sets values
// + dispatches 'input' so existing pipelines pick up shared scenarios.
(function(){
  if (typeof URLSearchParams === 'undefined') return;
  if (!document.getElementById('calcYear') && !document.getElementById('fwdHomePrice')) return;

  // ── Schema ──────────────────────────────────────────────────────
  // type tags: int, float, thousands (comma-formatted), bool, enum
  // SCHEMA entries with persist:false are excluded from localStorage —
  // i.e. they don't survive across sessions. URL params still work
  // (shareable links), and per-session clicks still update the URL.
  // Used for editorial framing choices (Power Law scenario, display
  // mode) where the editorial default should always render on fresh
  // page loads, not the visitor's last selection.
  var SCHEMA = {
    year:      { elId: 'calcYear',             type: 'int',       def: 2017,    evt: 'change' },
    dca:       { elId: 'calcDCA',              type: 'bool',                    evt: 'change' },
    home:      { elId: 'fwdHomePrice',         type: 'thousands', def: 420000,  evt: 'input'  },
    horizon:   { elId: 'fwdHorizon',           type: 'int',       def: 10,      evt: 'change' },
    appr:      { elId: 'fwdHomeAppreciation',  type: 'float',     def: 3.5,     evt: 'input'  },
    mortgage:  { elId: 'fwdMortgageRate',      type: 'float',     def: 6.8,     evt: 'input'  },
    advanced:  { elId: 'fwdAdvancedCheck',     type: 'bool',                    evt: 'change' },
    advrate:   { elId: 'fwdAdvancedRate',      type: 'float',     def: 7,       evt: 'input'  },
    method:    { type: 'btn-method',    sel: '.purchase-btn',   attr: 'method',   def: 'mortgage' },
    pscenario: { type: 'btn-pscenario', sel: '.scenario-btn',   attr: 'scenario', def: 'trend',    persist: false },
    displaymode: { type: 'btn-displaymode', sel: '.display-mode-btn', attr: 'mode', def: 'real',  persist: false }
  };

  function parseThousands(str) {
    if (str === null || str === undefined || str === '') return NaN;
    // Strip $, commas, and whitespace so format-on-blur values
    // ("$1,200,000") parse correctly when rehydrated from URL/storage.
    return parseFloat(String(str).replace(/[$,\s]/g, ''));
  }
  function formatThousands(num) {
    if (!isFinite(num)) return '';
    return Math.round(num).toLocaleString('en-US');
  }

  var _suppressWriter = false;

  function readValue(key) {
    var spec = SCHEMA[key];
    if (spec.type === 'btn-method' || spec.type === 'btn-pscenario' || spec.type === 'btn-displaymode') {
      var active = document.querySelector(spec.sel + '.active');
      return active ? active.getAttribute('data-' + spec.attr) : spec.def;
    }
    var el = document.getElementById(spec.elId);
    if (!el) return undefined;
    if (spec.type === 'bool') return el.checked ? 1 : 0;
    if (spec.type === 'thousands') return parseThousands(el.value);
    if (spec.type === 'int')   return parseInt(el.value, 10);
    if (spec.type === 'float') return parseFloat(el.value);
    return el.value;
  }

  function applyValue(key, raw) {
    var spec = SCHEMA[key];
    if (spec.type === 'btn-method' || spec.type === 'btn-pscenario' || spec.type === 'btn-displaymode') {
      var btn = document.querySelector(spec.sel + '[data-' + spec.attr + '="' + raw + '"]');
      if (btn && !btn.classList.contains('active')) btn.click();
      return;
    }
    var el = document.getElementById(spec.elId);
    if (!el) return;
    if (spec.type === 'bool') {
      var want = raw === '1' || raw === 'true';
      if (el.checked !== want) {
        el.checked = want;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }
    if (spec.type === 'thousands') {
      var n = parseFloat(raw);
      if (!isFinite(n)) return;
      // Format with $ prefix to match the blur formatter — so values
      // rehydrated from URL/storage look identical to user-blurred values.
      el.value = '$' + formatThousands(n);
    } else if (spec.type === 'int') {
      var i = parseInt(raw, 10);
      if (!isFinite(i)) return;
      el.value = String(i);
    } else if (spec.type === 'float') {
      var f = parseFloat(raw);
      if (!isFinite(f)) return;
      // Apply % suffix on rehydration — matches the blur formatter, so
      // first-load appearance is consistent with edited appearance.
      el.value = (Math.round(f * 10) / 10) + '%';
    } else {
      el.value = String(raw);
    }
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function readUrlIntoInputs() {
    var params = new URLSearchParams(window.location.search);
    _suppressWriter = true;
    try {
      Object.keys(SCHEMA).forEach(function(key){
        if (!params.has(key)) return;
        applyValue(key, params.get(key));
      });
    } finally {
      _suppressWriter = false;
    }
  }

  // ── localStorage persistence layer ─────────────────────────────────
  // Lets calculator settings survive across sessions and fresh visits
  // (i.e. URLs without query params). URL params still take precedence
  // when present, so shared scenario links override stored prefs as
  // expected. Storage gets written alongside the URL on every input
  // change. No PII captured — only the same scalar/enum/bool inputs
  // that the URL schema already exposes (year, home price, scenario,
  // horizon, etc.). Live BTC price is intentionally not stored (same
  // staleness reasoning as its exclusion from the URL schema). Wrapped
  // in try/catch for environments with disabled storage (Safari private
  // mode, browser settings, quota errors); failure is silent.
  var STORAGE_KEY = 'lcs.bvre.calc.v1';

  function readStorageIntoInputs() {
    if (typeof localStorage === 'undefined') return;
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch(e) { return; }
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch(e) { return; }
    if (!data || typeof data !== 'object') return;
    _suppressWriter = true;
    try {
      Object.keys(SCHEMA).forEach(function(key){
        // Skip keys that opt out of storage persistence (editorial framing
        // choices — Power Law scenario, display mode — always render with
        // the markup default on fresh loads regardless of stored value).
        if (SCHEMA[key].persist === false) return;
        if (!Object.prototype.hasOwnProperty.call(data, key)) return;
        applyValue(key, data[key]);
      });
    } finally {
      _suppressWriter = false;
    }
  }

  function syncStorage() {
    if (typeof localStorage === 'undefined') return;
    var data = {};
    Object.keys(SCHEMA).forEach(function(key){
      // Match readStorageIntoInputs — never write keys flagged
      // persist:false. Belt-and-suspenders: the read side would skip
      // them anyway, but excluding from the write keeps the storage
      // blob clean and migrates existing users on their next save.
      if (SCHEMA[key].persist === false) return;
      var val = readValue(key);
      if (val === undefined) return;
      data[key] = val;
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) { /* quota or disabled */ }
  }

  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    var params = new URLSearchParams(window.location.search);
    Object.keys(SCHEMA).forEach(function(key){
      var spec = SCHEMA[key];
      var val = readValue(key);
      // 'undefined' means the input doesn't exist in DOM (shouldn't happen
      // post-init, but be defensive); leave the param as-is in that case.
      if (val === undefined) return;
      // Booleans: omit when false; serialize as '1' when true
      if (spec.type === 'bool') {
        if (val === 1) params.set(key, '1');
        else params.delete(key);
        return;
      }
      // Number types: omit when equal to default or NaN
      if (spec.type === 'int' || spec.type === 'thousands' || spec.type === 'float') {
        if (!isFinite(val) || val === spec.def) params.delete(key);
        else params.set(key, String(val));
        return;
      }
      // Enums (button groups): omit when equal to default
      if (val === spec.def) params.delete(key);
      else params.set(key, val);
    });
    var qs = params.toString();
    var newUrl = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  }

  var _t = null;
  function scheduleSyncUrl() {
    if (_suppressWriter) return;
    if (_t) clearTimeout(_t);
    _t = setTimeout(function(){
      syncUrl();
      syncStorage();
    }, 220);
  }

  function wireWriters() {
    Object.keys(SCHEMA).forEach(function(key){
      var spec = SCHEMA[key];
      if (spec.type === 'btn-method' || spec.type === 'btn-pscenario' || spec.type === 'btn-displaymode') {
        document.querySelectorAll(spec.sel).forEach(function(b){
          b.addEventListener('click', scheduleSyncUrl);
        });
        return;
      }
      var el = document.getElementById(spec.elId);
      if (!el) return;
      el.addEventListener(spec.evt || 'input', scheduleSyncUrl);
      // For text/number inputs, also listen to 'change' so blur-paste flows
      // through the writer even when 'input' didn't fire.
      if ((spec.evt || 'input') === 'input' && spec.type !== 'bool') {
        el.addEventListener('change', scheduleSyncUrl);
      }
    });
  }

  function init() {
    // Read order matters: storage is the base layer, URL overrides
    // per-key when present. So a shared link with ?home=420000 wins
    // for that param but leaves storage-restored year/horizon/etc.
    // intact for any param the URL didn't specify.
    readStorageIntoInputs();
    readUrlIntoInputs();

    // ── DOM-sync of JS state from active buttons ─────────────────────
    // applyValue() skips btn.click() when the target button is already
    // active (line ~1285), which means JS variables `scenario` and
    // `method` can desync from the visual state when the rehydrated
    // value happens to match the markup default. E.g.: markup has
    // Trend active, user lands on the page with no URL/storage params,
    // the SCHEMA default is also 'trend' so applyValue is never even
    // called for that key — but the module-init JS variable could be
    // stale. Force-syncing from the DOM here guarantees the calc uses
    // whatever the user actually sees highlighted.
    var _activeScenarioBtn = document.querySelector('.scenario-btn.active');
    if (_activeScenarioBtn) scenario = _activeScenarioBtn.dataset.scenario;
    var _activeMethodBtn = document.querySelector('.purchase-btn.active');
    if (_activeMethodBtn) method = _activeMethodBtn.dataset.method;

    wireWriters();
    syncUrl();
    syncStorage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


// ═══════ IN-PAGE SHARE SECTION — BvRE ═══════
// Two-group share affordance (STYLE_GUIDE §6.26). Mirrors Retirement
// and DR's IIFE. Lives inside panel-calculator so it's only visible on
// the calculator tab.
(function(){
  if (!document.getElementById('shareSection')) return;
  var SHARE_TITLE = 'Bitcoin vs. Real Estate — what the trend really shows.';

  function currentUrl() { return window.location.href; }
  function genericPageUrl() {
    return window.location.origin + window.location.pathname + window.location.hash;
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'absolute'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch(e){ ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function showCopiedFeedback(btn) {
    var labelEl = btn.querySelector('.share-btn-label');
    if (!labelEl) return;
    var original = labelEl.textContent;
    labelEl.textContent = 'Copied';
    btn.classList.add('share-btn-copied');
    setTimeout(function(){
      labelEl.textContent = original;
      btn.classList.remove('share-btn-copied');
    }, 1800);
  }

  var copyBtn = document.getElementById('shareCopy');
  if (copyBtn) {
    copyBtn.addEventListener('click', function(){
      var url = currentUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function(){ showCopiedFeedback(copyBtn); },
          function(){ if (fallbackCopy(url)) showCopiedFeedback(copyBtn); }
        );
      } else if (fallbackCopy(url)) {
        showCopiedFeedback(copyBtn);
      }
    });
  }
  var nativeBtn = document.getElementById('shareNative');
  if (nativeBtn && navigator.share) {
    nativeBtn.hidden = false;
    nativeBtn.addEventListener('click', function(){
      navigator.share({ title: 'Bitcoin vs. Real Estate', text: SHARE_TITLE, url: currentUrl() })
        .catch(function(){ /* user cancelled — silent */ });
    });
  }

  function bindIntent(id, urlBuilder) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      window.open(urlBuilder(genericPageUrl()), '_blank', 'noopener,noreferrer,width=620,height=540');
    });
  }
  bindIntent('shareTwitter', function(url){
    return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) +
           '&text=' + encodeURIComponent(SHARE_TITLE);
  });
  bindIntent('shareLinkedIn', function(url){
    return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
  });
  bindIntent('shareFacebook', function(url){
    return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
  });
})();
