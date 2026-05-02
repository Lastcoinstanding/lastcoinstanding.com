
/* ── TABS ── */
// Hash-based tab routing
var iceTabMap={'cube':'the-ice-cube','treasury':'treasury-model','companies':'real-companies'};
var iceReverseMap={};Object.keys(iceTabMap).forEach(function(k){iceReverseMap[iceTabMap[k]]=k});
function iceActivateTab(tabId){
    document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
    document.querySelectorAll('.tab-content').forEach(function(c){c.classList.remove('active');c.classList.add('js-hidden')});
    var btn=document.querySelector('.tab-btn[data-tab="'+tabId+'"]');
    var panel=document.getElementById('tab-'+tabId);
    if(btn)btn.classList.add('active');
    if(panel){panel.classList.add('active');panel.classList.remove('js-hidden')}
    tab1Active=(tabId==='cube');
    if(tab1Active) requestAnimationFrame(renderTab1);
    if(tabId==='treasury') setTimeout(function(){requestAnimationFrame(initT2Chart);},50);
    if(tabId==='companies') setTimeout(function(){requestAnimationFrame(initT3Chart);},50);
}
function iceInitFromHash(){
    var hash=window.location.hash.replace('#','');
    if(hash&&iceReverseMap[hash]){iceActivateTab(iceReverseMap[hash])}
    else{document.querySelectorAll('.tab-content').forEach(function(c){if(!c.classList.contains('active'))c.classList.add('js-hidden')})}
}
document.querySelectorAll('.tab-btn').forEach(function(btn){
  btn.addEventListener('click',function(){
    iceActivateTab(this.dataset.tab);
    history.replaceState(null,null,'#'+(iceTabMap[this.dataset.tab]||this.dataset.tab));
  });
});
window.addEventListener('hashchange',iceInitFromHash);
iceInitFromHash();

/* ═══════════════════════════════
   TAB 1 — CANVAS
═══════════════════════════════ */
var tab1Active=true;
// inflation1 is computed from the canonical ModelingAssumptions on every read
function getInflation1(){return window.ModelingAssumptions.get('inflation').value;}
var years1=0;
var batteryPhase=0;
var drops=[];
var dropTimer=0;

var iceCubeCanvas=document.getElementById('iceCubeCanvas');
var batteryCanvas=document.getElementById('batteryCanvas');

function setupCanvas(canvas){
  var dpr=window.devicePixelRatio||1;
  var w=canvas.offsetWidth, h=canvas.offsetHeight;
  canvas.width=w*dpr; canvas.height=h*dpr;
  var ctx=canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  return {ctx:ctx,w:w,h:h};
}

function drawIceCube(ctx,W,H,fraction,drops){
  ctx.clearRect(0,0,W,H);
  var cx=W/2;
  var cubeW=Math.min(W*0.62,160);
  var maxH=H*0.56;
  var cubeH=Math.max(maxH*fraction,2);
  var depth=cubeW*0.3;
  var baseY=H*0.72;
  var topY=baseY-cubeH;
  var alpha=0.15+fraction*0.3;

  /* Puddle */
  var puddleR=cubeW*0.45*(1-fraction)*1.6;
  if(puddleR>3){
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx,baseY+depth*0.35+14,puddleR*1.3,puddleR*0.28,0,0,Math.PI*2);
    ctx.fillStyle='rgba(100,180,240,0.07)';ctx.fill();
    ctx.strokeStyle='rgba(120,190,250,0.12)';ctx.lineWidth=0.8;ctx.stroke();
    ctx.restore();
  }

  if(fraction<0.02){
    ctx.fillStyle='rgba(100,180,240,0.35)';
    ctx.font='500 11px Inter,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('melted',cx,baseY+20);
    return;
  }

  /* Right face */
  ctx.beginPath();
  ctx.moveTo(cx+cubeW/2,topY);
  ctx.lineTo(cx+cubeW/2+depth,topY-depth*0.5);
  ctx.lineTo(cx+cubeW/2+depth,baseY-depth*0.5);
  ctx.lineTo(cx+cubeW/2,baseY);
  ctx.closePath();
  ctx.fillStyle='rgba(80,155,220,'+(alpha*0.75)+')';ctx.fill();
  ctx.strokeStyle='rgba(140,200,255,'+(0.3+fraction*0.2)+')';ctx.lineWidth=0.8;ctx.stroke();

  /* Front face */
  var fg=ctx.createLinearGradient(cx-cubeW/2,topY,cx+cubeW/2,baseY);
  fg.addColorStop(0,'rgba(180,225,255,'+(alpha+0.12)+')');
  fg.addColorStop(0.45,'rgba(140,200,255,'+alpha+')');
  fg.addColorStop(1,'rgba(90,165,235,'+(alpha-0.04)+')');
  ctx.beginPath();ctx.rect(cx-cubeW/2,topY,cubeW,cubeH);
  ctx.fillStyle=fg;ctx.fill();
  ctx.strokeStyle='rgba(160,215,255,'+(0.38+fraction*0.18)+')';ctx.lineWidth=1;ctx.stroke();

  /* Top face */
  ctx.beginPath();
  ctx.moveTo(cx-cubeW/2,topY);
  ctx.lineTo(cx-cubeW/2+depth,topY-depth*0.5);
  ctx.lineTo(cx+cubeW/2+depth,topY-depth*0.5);
  ctx.lineTo(cx+cubeW/2,topY);
  ctx.closePath();
  var tg=ctx.createLinearGradient(cx,topY-depth*0.5,cx,topY);
  tg.addColorStop(0,'rgba(220,242,255,'+(alpha+0.18)+')');
  tg.addColorStop(1,'rgba(170,220,255,'+(alpha+0.06)+')');
  ctx.fillStyle=tg;ctx.fill();
  ctx.strokeStyle='rgba(200,235,255,'+(0.45+fraction*0.15)+')';ctx.lineWidth=1;ctx.stroke();

  /* Highlight shimmer */
  if(fraction>0.12&&cubeH>20){
    ctx.save();
    ctx.beginPath();ctx.rect(cx-cubeW/2+5,topY+5,cubeW*0.18,cubeH*0.45);
    var sg=ctx.createLinearGradient(cx-cubeW/2+5,topY,cx-cubeW/2+5+cubeW*0.18,topY);
    sg.addColorStop(0,'rgba(255,255,255,'+(fraction*0.14)+')');
    sg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sg;ctx.fill();ctx.restore();
  }

  /* Drops */
  drops.forEach(function(d){
    ctx.save();ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);
    ctx.fillStyle='rgba(130,195,250,'+d.opacity+')';ctx.fill();ctx.restore();
  });
}

function drawBattery(ctx,W,H,phase){
  ctx.clearRect(0,0,W,H);
  var cx=W/2;
  var bW=Math.min(W*0.42,90);
  var bH=Math.min(H*0.62,170);
  var bX=cx-bW/2;
  var bY=H*0.13;
  var tW=bW*0.38;
  var tH=bH*0.055;
  var glow=28+Math.sin(phase)*12;

  /* Ambient radial glow behind battery */
  var ambient=ctx.createRadialGradient(cx,bY+bH*0.5,0,cx,bY+bH*0.5,bW*1.6);
  ambient.addColorStop(0,'rgba(247,147,26,'+(0.18+Math.sin(phase)*0.07)+')');
  ambient.addColorStop(0.5,'rgba(247,147,26,'+(0.06+Math.sin(phase)*0.03)+')');
  ambient.addColorStop(1,'rgba(247,147,26,0)');
  ctx.save();
  ctx.fillStyle=ambient;
  ctx.fillRect(0,0,W,H);
  ctx.restore();

  ctx.save();
  ctx.shadowColor='rgba(247,147,26,'+(0.7+Math.sin(phase)*0.2)+')';
  ctx.shadowBlur=glow;

  /* Terminal */
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(cx-tW/2,bY-tH,tW,tH,2);
  else ctx.rect(cx-tW/2,bY-tH,tW,tH);
  ctx.strokeStyle='rgba(247,147,26,0.9)';ctx.lineWidth=2;ctx.stroke();

  /* Body */
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(bX,bY,bW,bH,7);
  else ctx.rect(bX,bY,bW,bH);
  ctx.strokeStyle='rgba(247,147,26,0.95)';ctx.lineWidth=2.5;ctx.stroke();
  ctx.restore();

  /* Fill */
  var fillH=bH*0.91, fillY=bY+bH-fillH-bH*0.045;
  var fillX=bX+3, fillW=bW-6;
  ctx.save();
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(fillX,fillY,fillW,fillH,5);
  else ctx.rect(fillX,fillY,fillW,fillH);
  var fg=ctx.createLinearGradient(fillX,fillY,fillX,fillY+fillH);
  fg.addColorStop(0,'rgba(255,180,60,0.95)');
  fg.addColorStop(0.35,'rgba(247,147,26,0.82)');
  fg.addColorStop(0.7,'rgba(220,120,20,0.75)');
  fg.addColorStop(1,'rgba(247,147,26,0.88)');
  ctx.fillStyle=fg;ctx.fill();ctx.restore();

  /* Bright inner highlight strip */
  ctx.save();ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(fillX+4,fillY+5,fillW*0.25,fillH*0.42,3);
  else ctx.rect(fillX+4,fillY+5,fillW*0.25,fillH*0.42);
  ctx.fillStyle='rgba(255,230,160,'+(0.30+Math.sin(phase)*0.08)+')';ctx.fill();ctx.restore();

  /* Segment lines */
  for(var i=1;i<5;i++){
    var sy=fillY+(fillH/5)*i;
    ctx.beginPath();ctx.moveTo(fillX+2,sy);ctx.lineTo(fillX+fillW-2,sy);
    ctx.strokeStyle='rgba(10,9,8,0.25)';ctx.lineWidth=1;ctx.stroke();
  }

  /* Outer pulse glow ring */
  var ring=bH*0.55+Math.sin(phase*1.2)*bH*0.04;
  ctx.save();
  ctx.globalAlpha=0.22+Math.sin(phase)*0.10;
  ctx.beginPath();ctx.arc(cx,bY+bH*0.5,ring*0.55,0,Math.PI*2);
  ctx.strokeStyle='rgba(247,147,26,1)';ctx.lineWidth=10;ctx.stroke();
  ctx.restore();

  /* Inner pulse glow ring */
  ctx.save();
  ctx.globalAlpha=0.15+Math.sin(phase*0.8+1)*0.08;
  ctx.beginPath();ctx.arc(cx,bY+bH*0.5,ring*0.32,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,200,80,1)';ctx.lineWidth=6;ctx.stroke();
  ctx.restore();

  /* Label */
  ctx.save();
  ctx.shadowColor='rgba(247,147,26,0.9)';
  ctx.shadowBlur=12;
  ctx.font='700 '+Math.round(bW*0.19)+'px Inter,sans-serif';
  ctx.fillStyle='rgba(255,220,100,0.98)';
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('100%',cx,bY+bH*0.5);
  ctx.restore();
}

function updateDrops(cubeBounds){
  var inflation1=getInflation1();
  dropTimer++;
  var dropEvery=Math.max(3,Math.round(28-inflation1*1.2));
  var frac=1/Math.pow(1+inflation1/100,years1);
  if(dropTimer>=dropEvery&&frac>0.04){
    dropTimer=0;
    drops.push({x:cubeBounds.x+(Math.random()*0.7+0.15)*cubeBounds.w,y:cubeBounds.bottom,speed:1.4+Math.random()*1.8,opacity:0.55+Math.random()*0.3,r:1.4+Math.random()*1.8});
  }
  for(var i=drops.length-1;i>=0;i--){
    drops[i].y+=drops[i].speed;drops[i].opacity-=0.012;
    if(drops[i].y>cubeBounds.baseY+35||drops[i].opacity<=0) drops.splice(i,1);
  }
}

function renderTab1(){
  if(!tab1Active) return;
  var inflation1=getInflation1();
  var ib=setupCanvas(iceCubeCanvas);
  var bb=setupCanvas(batteryCanvas);
  var fraction=1/Math.pow(1+inflation1/100,years1);

  var cubeW=Math.min(ib.w*0.62,160);
  var maxH=ib.h*0.56;
  var cubeH=Math.max(maxH*fraction,2);
  var baseY=ib.h*0.72;
  var cubeBounds={x:ib.w/2-cubeW/2,w:cubeW,bottom:baseY-cubeH,baseY:baseY};

  updateDrops(cubeBounds);
  drawIceCube(ib.ctx,ib.w,ib.h,fraction,drops);
  batteryPhase+=0.025;
  drawBattery(bb.ctx,bb.w,bb.h,batteryPhase);

  var pct=(fraction*100).toFixed(1);
  document.getElementById('cashPctCard').textContent=pct+'%';
  document.getElementById('cashPctSub').textContent='at '+inflation1+'% expansion, '+Math.round(years1)+' yr'+(years1!==1?'s':'');
  var hl=window.CalcHelpers.purchasingPowerHalfLife(inflation1);
  document.getElementById('halfLifeCard').textContent=(isFinite(hl)?hl.toFixed(1):'\u221E')+' yrs';
  document.getElementById('halfLifeSub').textContent='at '+inflation1+'% annual expansion';

  // Bitcoin issuance rate — halves every ~4 years from today
  // Current epoch (2024-2028): ~0.83%/yr
  // Next halving ~2028 = yr 2, then ~2032 = yr 6, ~2036 = yr 10, ~2040 = yr 14, ~2044 = yr 18
  var baseRate=0.83;
  var halvings=0;
  if(years1>=2)  halvings=1;
  if(years1>=6)  halvings=2;
  if(years1>=10) halvings=3;
  if(years1>=14) halvings=4;
  if(years1>=18) halvings=5;
  var issuanceRate=(baseRate/Math.pow(2,halvings));
  var issuanceStr=issuanceRate<0.03?'~0%':issuanceRate.toFixed(2)+'%';
  var epochLabels=['2024–2028','2028–2032','2032–2036','2036–2040','2040–2044','2044+'];
  document.getElementById('issuanceCard').textContent=issuanceStr+'/yr';
  document.getElementById('issuanceSub').textContent='now · halving every ~4 yrs';
  document.getElementById('issuanceEpochLabel').textContent='Current epoch: '+epochLabels[halvings];

  requestAnimationFrame(renderTab1);
}

document.getElementById('yearSlider1').addEventListener('input',function(){
  years1=+this.value;
  document.getElementById('yearDisplay1').textContent=years1+' year'+(years1!==1?'s':'');
  drops=[];
});

// Unified inflation setter — writes to the sitewide canonical, all three button
// groups (inflBtns, infl2Btns, t3InflBtns) sync to it.
function setMicInflation(btn){
  var preset=btn.dataset.preset;
  if(preset==='custom'){
    // Show all custom-input rows; if a stored custom value exists, surface it
    var stored=parseFloat(localStorage.getItem('lcs.inflation.customValue'));
    showMicCustomRows(true);
    if(isFinite(stored)){
      window.ModelingAssumptions.set('inflation','custom',stored);
      // Sync inputs to stored value
      document.querySelectorAll('.mic-custom-input').forEach(function(inp){inp.value=stored;});
    } else {
      // Focus first input for entry; don't write a custom preset until user enters value
      var firstInput=document.querySelector('.mic-custom-input');
      if(firstInput){firstInput.value='';firstInput.focus();}
      // Visually mark Custom buttons as selected even without a stored value
      syncMicInflationButtons('custom');
      drops=[]; drawT2Chart(); drawT3Chart();
      return;
    }
  } else {
    showMicCustomRows(false);
    window.ModelingAssumptions.set('inflation',preset);
  }
  drops=[];
  drawT2Chart();
  drawT3Chart();
}

// Reset link handler
function resetMicInflation(e){
  e.preventDefault();
  window.ModelingAssumptions.reset();
  showMicCustomRows(false);
  syncMicInflation();
  drops=[];
  drawT2Chart();
  drawT3Chart();
}

// Show or hide all three custom-input rows together
function showMicCustomRows(show){
  document.querySelectorAll('.mic-custom-row').forEach(function(row){
    row.style.display=show?'':'none';
  });
}

// Sync the visual selection across all three button groups to match the
// current canonical state. Called on load and on canonical-change events.
function syncMicInflationButtons(activePreset){
  ['inflBtns','infl2Btns','t3InflBtns'].forEach(function(groupId){
    var group=document.getElementById(groupId);
    if(!group) return;
    group.querySelectorAll('.opt-btn').forEach(function(btn){
      btn.classList.remove('sel','sel-blue','sel-red');
      if(btn.dataset.preset===activePreset){
        // Use sel-red on the first group (matches existing visual style),
        // sel on the others
        if(groupId==='inflBtns') btn.classList.add('sel-red');
        else btn.classList.add('sel');
      }
    });
  });
}

function syncMicInflation(){
  var current=window.ModelingAssumptions.get('inflation');
  syncMicInflationButtons(current.preset);
  if(current.preset==='custom'){
    showMicCustomRows(true);
    document.querySelectorAll('.mic-custom-input').forEach(function(inp){
      if(parseFloat(inp.value)!==current.value) inp.value=current.value;
    });
  } else {
    showMicCustomRows(false);
  }
}

// Bind all custom-input fields to write through to the canonical
function bindMicCustomInputs(){
  document.querySelectorAll('.mic-custom-input').forEach(function(input){
    input.addEventListener('input',function(){
      var v=parseFloat(input.value);
      if(isFinite(v)){
        window.ModelingAssumptions.set('inflation','custom',v);
        // Sync the OTHER inputs so all three reflect the same value
        document.querySelectorAll('.mic-custom-input').forEach(function(other){
          if(other!==input) other.value=v;
        });
        drops=[];
        drawT2Chart();
        drawT3Chart();
      }
    });
  });
}

window.addEventListener('resize',function(){drops=[];});
requestAnimationFrame(renderTab1);

/* ═══════════════════════════════
   TAB 2 — TREASURY CHART
═══════════════════════════════ */
// t2.inflation now reads from the sitewide canonical via getInflation1()
var t2={size:10000000,alloc:10,cagr:'powerlaw'};
Object.defineProperty(t2,'inflation',{get:function(){return getInflation1();}});
var t2ShowFullBtc=false, t2ScrubYear=10;

function fmtM(n){
  var abs=Math.abs(n);
  if(abs>=1e12) return (n<0?'-':'')+'$'+(Math.abs(n)/1e12).toFixed(2)+'T';
  if(abs>=1e9)  return (n<0?'-':'')+'$'+(Math.abs(n)/1e9).toFixed(2)+'B';
  if(abs>=1e6)  return (n<0?'-':'')+'$'+(Math.abs(n)/1e6).toFixed(1)+'M';
  if(abs>=1e3)  return (n<0?'-':'')+'$'+Math.round(Math.abs(n)/1e3)+'K';
  return (n<0?'-':'')+'$'+Math.round(Math.abs(n));
}
function fmtSign(n){return (n>=0?'+':'')+fmtM(n);}

/* Power Law: Price = 1.6e-17 * days^5.77  (porkopolis.io/thechart) */
var PL_A=1.6e-17, PL_B=5.77;
var PL_GENESIS=new Date(2009,0,3); // Jan 3, 2009
function daysFromGenesis(offsetYears){
  var d=new Date();
  d.setFullYear(d.getFullYear()+offsetYears);
  return (d-PL_GENESIS)/(1000*60*60*24);
}
function plPrice(offsetYears){
  return PL_A*Math.pow(daysFromGenesis(offsetYears),PL_B);
}
/* Growth factor vs today for Power Law */
function plGrowthFactor(years){
  return plPrice(years)/plPrice(0);
}
/* Effective CAGR implied by Power Law at a given year */
function plCAGR(years){
  if(years===0) return 0;
  return (Math.pow(plGrowthFactor(years),1/years)-1)*100;
}

/* BTC growth factor at year Y for chosen model */
function btcGrowth(years){
  if(t2.cagr==='powerlaw') return plGrowthFactor(years);
  return Math.pow(1+t2.cagr/100,years);
}

/* Series: all in real (inflation-adjusted) purchasing power */
function fiatSeries(size,infl,yrs){
  var s=[];for(var y=0;y<=yrs;y++) s.push(size*Math.pow(1+infl/100,-y));return s;
}
function blendSeries(size,alloc,infl,yrs){
  var btc=size*(alloc/100),cash=size-btc;
  var s=[];for(var y=0;y<=yrs;y++)
    s.push(btc*btcGrowth(y)+cash*Math.pow(1+infl/100,-y));
  return s;
}
function fullBtcSeries(size,yrs){
  var s=[];for(var y=0;y<=yrs;y++) s.push(size*btcGrowth(y));return s;
}

function drawT2Chart(){
  var canvas=document.getElementById('t2Chart');
  if(!canvas) return;
  var wrap=canvas.closest('.chart-canvas-wrap')||canvas.parentElement;
  var cssW=wrap?wrap.getBoundingClientRect().width:canvas.offsetWidth;
  if(!cssW||cssW<100) return;
  var dpr=window.devicePixelRatio||1;
  var cssH=300;
  canvas.style.height=cssH+'px';
  canvas.width=Math.round(cssW*dpr);
  canvas.height=Math.round(cssH*dpr);
  var ctx=canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  var W=cssW,H=cssH;

  var PAD={top:18,right:18,bottom:38,left:74};
  var cW=W-PAD.left-PAD.right;
  var cH=H-PAD.top-PAD.bottom;
  var YEARS=20;

  var fs=fiatSeries(t2.size,t2.inflation,YEARS);
  var bs=blendSeries(t2.size,t2.alloc,t2.inflation,YEARS);
  var bts=fullBtcSeries(t2.size,YEARS);

  /* Y scale: cap blend series to avoid the chart being unreadable */
  var maxVal=bs[YEARS];
  if(t2ShowFullBtc) maxVal=Math.max(maxVal,bts[YEARS]);
  maxVal*=1.1;
  var minVal=0;

  function xP(yr){return PAD.left+cW*(yr/YEARS);}
  function yP(v){return PAD.top+cH*(1-(v-minVal)/(maxVal-minVal));}

  /* Grid lines + Y labels */
  var yTicks=5;
  for(var i=0;i<=yTicks;i++){
    var gv=minVal+(maxVal-minVal)*(i/yTicks);
    var gy=yP(gv);
    ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(PAD.left,gy);ctx.lineTo(PAD.left+cW,gy);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.28)';ctx.font='10px Inter,sans-serif';
    ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillText(fmtM(gv),PAD.left-6,gy);
  }
  /* X labels */
  [0,4,8,12,16,20].forEach(function(yr){
    ctx.fillStyle='rgba(255,255,255,.28)';ctx.font='10px Inter,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText('Yr '+yr,xP(yr),H-PAD.bottom+6);
  });

  /* Draw area fills first */
  function areaFill(series,color){
    ctx.beginPath();
    ctx.moveTo(xP(0),yP(series[0]));
    for(var y=1;y<=YEARS;y++) ctx.lineTo(xP(y),yP(series[y]));
    ctx.lineTo(xP(YEARS),yP(minVal));ctx.lineTo(xP(0),yP(minVal));
    ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  areaFill(fs,'rgba(122,184,216,0.07)');
  areaFill(bs,'rgba(247,147,26,0.08)');
  if(t2ShowFullBtc) areaFill(bts,'rgba(255,204,102,0.05)');

  /* Draw gap fill between fiat and blend */
  ctx.beginPath();
  ctx.moveTo(xP(0),yP(bs[0]));
  for(var y=1;y<=YEARS;y++) ctx.lineTo(xP(y),yP(bs[y]));
  for(var y2=YEARS;y2>=0;y2--) ctx.lineTo(xP(y2),yP(fs[y2]));
  ctx.closePath();
  ctx.fillStyle='rgba(247,147,26,0.06)';ctx.fill();

  /* Draw lines */
  function drawLine(series,color,width,dash){
    ctx.beginPath();ctx.lineWidth=width;ctx.strokeStyle=color;
    if(dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
    ctx.moveTo(xP(0),yP(series[0]));
    for(var y=1;y<=YEARS;y++) ctx.lineTo(xP(y),yP(series[y]));
    ctx.stroke();ctx.setLineDash([]);
  }
  if(t2ShowFullBtc) drawLine(bts,'rgba(255,204,102,0.75)',2,[6,3]);
  drawLine(fs,'rgba(122,184,216,0.9)',2.5);
  drawLine(bs,'rgba(247,147,26,0.95)',3);

  /* Scrubber vertical line */
  var sx=xP(t2ScrubYear);
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
  ctx.beginPath();ctx.moveTo(sx,PAD.top);ctx.lineTo(sx,PAD.top+cH);ctx.stroke();
  ctx.setLineDash([]);

  /* Scrubber dots */
  function dot(val,color){
    var sy=yP(val);
    ctx.beginPath();ctx.arc(sx,sy,5,0,Math.PI*2);
    ctx.fillStyle=color;ctx.fill();
    ctx.strokeStyle='rgba(10,9,8,0.9)';ctx.lineWidth=1.5;ctx.stroke();
  }
  dot(fs[t2ScrubYear],'rgba(122,184,216,1)');
  dot(bs[t2ScrubYear],'rgba(247,147,26,1)');
  if(t2ShowFullBtc) dot(bts[t2ScrubYear],'rgba(255,204,102,0.9)');

  /* Update callout cards */
  var fv=fs[t2ScrubYear],bv=bs[t2ScrubYear],dv=bv-fv;
  document.getElementById('coFiat').textContent=fmtM(fv);
  document.getElementById('coBlend').textContent=fmtM(bv);
  document.getElementById('coDelta').textContent=fmtSign(dv);
  document.getElementById('coDelta').style.color=dv>=0?'var(--green)':'var(--red)';
  /* Dynamic blend label showing allocation % */
  var blendLbl=t2.alloc+'% BTC blend';
  document.getElementById('coBlendLabel').textContent=blendLbl;
  document.getElementById('legendBlend').textContent=blendLbl;
  document.getElementById('scrubYearLabel').textContent='Year '+t2ScrubYear;
  /* Implied CAGR note for Power Law */
  if(t2.cagr==='powerlaw'&&t2ScrubYear>0){
    var implied=plCAGR(t2ScrubYear).toFixed(1);
    document.getElementById('coBlendSub').textContent='Power Law ~'+implied+'% CAGR at yr '+t2ScrubYear;
  } else {
    document.getElementById('coBlendSub').textContent='inflation-adjusted';
  }
}

function setAllocSlider(el){
  t2.alloc=+el.value;
  var pct=((t2.alloc-1)/99*100).toFixed(0);
  el.style.setProperty('--pct',pct+'%');
  document.getElementById('allocPct').textContent=t2.alloc;
  drawT2Chart();
}
function setScrubYear(el){
  t2ScrubYear=+el.value;
  el.style.setProperty('--pct',(t2ScrubYear/20*100).toFixed(1)+'%');
  drawT2Chart();
}
function toggleFullBtc(){
  t2ShowFullBtc=!t2ShowFullBtc;
  document.getElementById('togFullBtc').classList.toggle('active-btc',t2ShowFullBtc);
  document.querySelector('.cl-fullbtc-item').style.display=t2ShowFullBtc?'flex':'none';
  drawT2Chart();
}

function selBtn(groupId,activeBtn,cls){
  document.querySelectorAll('#'+groupId+' .opt-btn').forEach(function(b){b.classList.remove('sel','sel-blue');});
  activeBtn.classList.add(cls||'sel');
}
function setCashflow(positive){
  document.getElementById('cqYes').classList.toggle('sel',positive);
  document.getElementById('cqNo').classList.toggle('sel',!positive);
  document.getElementById('riskWarning').classList.toggle('show',!positive);
}
function setSize(btn){selBtn('tSizeBtns',btn);t2.size=+btn.dataset.val;drawT2Chart();}
function setCagr(btn){
  selBtn('cagrBtns',btn);
  t2.cagr=btn.dataset.val==='powerlaw'?'powerlaw':+btn.dataset.val;
  var note=document.getElementById('cagrNote');
  if(note) note.style.display=(t2.cagr==='powerlaw')?'block':'none';
  drawT2Chart();
}
function setInfl2(btn){setMicInflation(btn);}

/* Init */
(function(){
  var sl=document.getElementById('allocSlider');
  if(sl){var pct=((10-1)/99*100).toFixed(0);sl.style.setProperty('--pct',pct+'%');}
  var ys=document.getElementById('yearScrubber');
  if(ys){ys.style.setProperty('--pct','50%');}
})();
function initT2Chart(){
  var c=document.getElementById('t2Chart');
  if(c&&c.offsetWidth>0) drawT2Chart();
}
window.addEventListener('resize',function(){
  if(document.getElementById('tab-treasury').classList.contains('active')) drawT2Chart();
});

/* ═══════════════════════════════
   TAB 3 — REAL COMPANIES
═══════════════════════════════ */
// t3.inflation now reads from the sitewide canonical via getInflation1()
var t3={treasury:157000000000,name:'Apple',ticker:'AAPL',alloc:5,cagr:'powerlaw'};
Object.defineProperty(t3,'inflation',{get:function(){return getInflation1();}});
var t3ShowFullBtc=false, t3ScrubYear=10;

function selectCo(card){
  document.querySelectorAll('#coCards .co-card').forEach(function(c){c.classList.remove('sel');});
  card.classList.add('sel');
  t3.treasury=+card.dataset.treasury;
  t3.name=card.dataset.name;
  t3.ticker=card.dataset.ticker;
  drawT3Chart();
}
function setT3Cagr(btn){
  selBtn('t3CagrBtns',btn);
  t3.cagr=btn.dataset.val==='powerlaw'?'powerlaw':+btn.dataset.val;
  var note=document.getElementById('t3CagrNote');
  if(note) note.style.display=(t3.cagr==='powerlaw')?'block':'none';
  drawT3Chart();
}
function setT3Infl(btn){setMicInflation(btn);}
function setT3AllocSlider(el){
  t3.alloc=+el.value;
  var pct=((t3.alloc-1)/99*100).toFixed(0);
  el.style.setProperty('--pct',pct+'%');
  document.getElementById('t3AllocPct').textContent=t3.alloc;
  drawT3Chart();
}
function setT3ScrubYear(el){
  t3ScrubYear=+el.value;
  el.style.setProperty('--pct',(t3ScrubYear/20*100).toFixed(1)+'%');
  drawT3Chart();
}
function t3ToggleFullBtc(){
  t3ShowFullBtc=!t3ShowFullBtc;
  document.getElementById('t3TogFullBtc').classList.toggle('active-btc',t3ShowFullBtc);
  document.querySelector('.cl-t3-fullbtc-item').style.display=t3ShowFullBtc?'flex':'none';
  drawT3Chart();
}

/* Reuse Power Law helpers from Tab 2 */
function t3BtcGrowth(years){
  if(t3.cagr==='powerlaw') return plGrowthFactor(years);
  return Math.pow(1+t3.cagr/100,years);
}

function drawT3Chart(){
  var canvas=document.getElementById('t3Chart');
  if(!canvas) return;
  var wrap=canvas.closest('.chart-canvas-wrap')||canvas.parentElement;
  var cssW=wrap?wrap.getBoundingClientRect().width:canvas.offsetWidth;
  if(!cssW||cssW<100) return;
  var dpr=window.devicePixelRatio||1;
  var cssH=300;
  canvas.style.height=cssH+'px';
  canvas.width=Math.round(cssW*dpr);
  canvas.height=Math.round(cssH*dpr);
  var ctx=canvas.getContext('2d');
  ctx.scale(dpr,dpr);
  var W=cssW,H=cssH;
  var PAD={top:18,right:18,bottom:38,left:74};
  var cW=W-PAD.left-PAD.right,cH=H-PAD.top-PAD.bottom,YEARS=20;

  /* Series */
  var fs=[],bs=[],bts=[];
  for(var y=0;y<=YEARS;y++){
    fs.push(t3.treasury*Math.pow(1+t3.inflation/100,-y));
    var btc=t3.treasury*(t3.alloc/100),cash=t3.treasury-btc;
    bs.push(btc*t3BtcGrowth(y)+cash*Math.pow(1+t3.inflation/100,-y));
    bts.push(t3.treasury*t3BtcGrowth(y));
  }

  var maxVal=bs[YEARS];
  if(t3ShowFullBtc) maxVal=Math.max(maxVal,bts[YEARS]);
  maxVal*=1.1;
  var minVal=0;

  function xP(yr){return PAD.left+cW*(yr/YEARS);}
  function yP(v){return PAD.top+cH*(1-(v-minVal)/(maxVal-minVal));}

  /* Grid */
  for(var i=0;i<=5;i++){
    var gv=minVal+(maxVal-minVal)*(i/5),gy=yP(gv);
    ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(PAD.left,gy);ctx.lineTo(PAD.left+cW,gy);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.28)';ctx.font='10px Inter,sans-serif';
    ctx.textAlign='right';ctx.textBaseline='middle';
    ctx.fillText(fmtM(gv),PAD.left-6,gy);
  }
  [0,4,8,12,16,20].forEach(function(yr){
    ctx.fillStyle='rgba(255,255,255,.28)';ctx.font='10px Inter,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='top';
    ctx.fillText('Yr '+yr,xP(yr),H-PAD.bottom+6);
  });

  /* Area fills */
  function areaFill(series,color){
    ctx.beginPath();ctx.moveTo(xP(0),yP(series[0]));
    for(var y=1;y<=YEARS;y++) ctx.lineTo(xP(y),yP(series[y]));
    ctx.lineTo(xP(YEARS),yP(minVal));ctx.lineTo(xP(0),yP(minVal));
    ctx.closePath();ctx.fillStyle=color;ctx.fill();
  }
  areaFill(fs,'rgba(122,184,216,0.07)');
  areaFill(bs,'rgba(247,147,26,0.08)');
  if(t3ShowFullBtc) areaFill(bts,'rgba(255,204,102,0.05)');
  /* Gap fill */
  ctx.beginPath();ctx.moveTo(xP(0),yP(bs[0]));
  for(var y=1;y<=YEARS;y++) ctx.lineTo(xP(y),yP(bs[y]));
  for(var y2=YEARS;y2>=0;y2--) ctx.lineTo(xP(y2),yP(fs[y2]));
  ctx.closePath();ctx.fillStyle='rgba(247,147,26,0.06)';ctx.fill();

  /* Lines */
  function drawLine(series,color,width,dash){
    ctx.beginPath();ctx.lineWidth=width;ctx.strokeStyle=color;
    if(dash) ctx.setLineDash(dash); else ctx.setLineDash([]);
    ctx.moveTo(xP(0),yP(series[0]));
    for(var y=1;y<=YEARS;y++) ctx.lineTo(xP(y),yP(series[y]));
    ctx.stroke();ctx.setLineDash([]);
  }
  if(t3ShowFullBtc) drawLine(bts,'rgba(255,204,102,0.75)',2,[6,3]);
  drawLine(fs,'rgba(122,184,216,0.9)',2.5);
  drawLine(bs,'rgba(247,147,26,0.95)',3);

  /* Scrubber */
  var sx=xP(t3ScrubYear);
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.setLineDash([3,3]);
  ctx.beginPath();ctx.moveTo(sx,PAD.top);ctx.lineTo(sx,PAD.top+cH);ctx.stroke();
  ctx.setLineDash([]);
  function dot(val,color){
    ctx.beginPath();ctx.arc(sx,yP(val),5,0,Math.PI*2);
    ctx.fillStyle=color;ctx.fill();
    ctx.strokeStyle='rgba(10,9,8,0.9)';ctx.lineWidth=1.5;ctx.stroke();
  }
  dot(fs[t3ScrubYear],'rgba(122,184,216,1)');
  dot(bs[t3ScrubYear],'rgba(247,147,26,1)');
  if(t3ShowFullBtc) dot(bts[t3ScrubYear],'rgba(255,204,102,0.9)');

  /* Callout cards */
  var fv=fs[t3ScrubYear],bv=bs[t3ScrubYear],dv=bv-fv;
  document.getElementById('t3CoFiat').textContent=fmtM(fv);
  document.getElementById('t3CoBlend').textContent=fmtM(bv);
  document.getElementById('t3CoDelta').textContent=fmtSign(dv);
  document.getElementById('t3CoDelta').style.color=dv>=0?'var(--green)':'var(--red)';
  var lbl=t3.alloc+'% BTC blend';
  document.getElementById('t3CoBlendLabel').textContent=lbl;
  document.getElementById('t3LegendBlend').textContent=lbl;
  document.getElementById('t3ScrubYearLabel').textContent='Year '+t3ScrubYear;
  document.getElementById('t3ChartTitle').textContent=t3.name+' — real treasury purchasing power over 20 years';
  if(t3.cagr==='powerlaw'&&t3ScrubYear>0){
    document.getElementById('t3CoBlendSub').textContent='Power Law ~'+plCAGR(t3ScrubYear).toFixed(1)+'% CAGR at yr '+t3ScrubYear;
  } else {
    document.getElementById('t3CoBlendSub').textContent='inflation-adjusted';
  }
}

function initT3Chart(){
  var sl=document.getElementById('t3AllocSlider');
  if(sl){sl.style.setProperty('--pct',((5-1)/99*100).toFixed(0)+'%');}
  var ys=document.getElementById('t3YearScrubber');
  if(ys){ys.style.setProperty('--pct','50%');}
  var c=document.getElementById('t3Chart');
  if(c&&c.offsetWidth>0) drawT3Chart();
}
window.addEventListener('resize',function(){
  if(document.getElementById('tab-companies').classList.contains('active')) drawT3Chart();
});

// ─── Canonical inflation integration ──────────────────────
// Sync UI to canonical state on load, bind custom inputs, subscribe to changes.
window.addEventListener('load',function(){
  syncMicInflation();
  bindMicCustomInputs();
});
if(window.ModelingAssumptions && window.ModelingAssumptions.subscribe){
  window.ModelingAssumptions.subscribe(function(dim){
    if(dim==='inflation'||dim==='*'){
      syncMicInflation();
      drops=[];
      // Re-render whichever charts are present
      if(document.getElementById('t2Chart')) drawT2Chart();
      if(document.getElementById('t3Chart')) drawT3Chart();
    }
  });
}
