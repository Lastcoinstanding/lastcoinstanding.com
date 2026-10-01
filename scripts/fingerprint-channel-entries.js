/* ─────────────────────────────────────────────────────────────────────────────
   fingerprint-channel-entries.js: prove a change to shared/channel-entries.js
   is additive. Hashes every pre-#115 field bandMetrics/entryMetrics return,
   over positions 0.00–1.00 (step 0.01) × five rebuy targets (505 cases). Run it
   before and after an engine change; the hash must not move unless a published
   figure is meant to. At 2026-10-01 (PL_DATA through 2026-09-30): 0c8cfd7f63b5d388.
     node scripts/fingerprint-channel-entries.js
   ───────────────────────────────────────────────────────────────────────────── */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const A=path.join(__dirname,'..','src','_includes','_pageassets','shared');
const ctx={console,Math,Date,sessionStorage:{getItem(){return null},setItem(){}},fetch:()=>Promise.reject(new Error('x'))};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(A,'power-law-data.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(A,'channel-entries.js'),'utf8'),ctx);
const CE=ctx.ChannelEntries,OLD=['i','d0','p0','P','waitPrice','waitDay','ratio','paid','arrived','waitLen','depth','hadDD'];
const BK=['n','half','paid','ratio','condRatio','nArrived','ddProb','ddDepth','neverFell','never','waitLen','entries'];
const out=[];
for(let p=0;p<=1.0001;p+=0.01)for(const t of [undefined,'trend','floor',0.2,0.5]){const b=CE.bandMetrics(+p.toFixed(2),t);if(!b){out.push(null);continue;}
 const o={};for(const k of BK)o[k]=b[k];o.metrics=b.metrics.map(m=>OLD.map(k=>m[k]));out.push(o);}
const h=crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex').slice(0,16);
console.log('engine fingerprint',h,'rows',out.length);
