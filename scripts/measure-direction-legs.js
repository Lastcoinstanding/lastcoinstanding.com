/* ─────────────────────────────────────────────────────────────────────────────
   measure-direction-legs.js: pooled vs falling-leg vs rising-leg channel entries

   WHY THIS EXISTS. shared/channel-entries.js matches historical samples on
   channel position alone. A stretch below or above trend is crossed twice,
   once going down and once coming back, so one matched set pools entries
   made into a deepening fall with entries made into a recovery. This script
   measures how much that pooling hides. It changes nothing on the site.
   Report: DIRECTION_AWARE_MATCHING_2026-09-23.md.

   HOW TO RUN (from the repo root, Node 18+):
     node scripts/measure-direction-legs.js            # table at W = 60 days
     node scripts/measure-direction-legs.js --json     # everything, as JSON

   METHOD.
   - The engine is loaded unmodified: power-law-data.js and channel-entries.js
     run in a vm sandbox, and bandMetrics() is called exactly as Wait-or-Deploy
     calls it (default target, i.e. the first entry at least 0.15 lower).
   - LEG is decided only from data before the entry, so there is no
     look-ahead. It is the sign of (position now) minus (position W days
     earlier), interpolated between samples: falling if negative, rising
     otherwise. W is 36, 60 or 96 days; the report leads with 60.
   - EPISODES are runs of consecutive 12-day samples in a set. CYCLES are the
     halving epochs contributing (post-2014 eligibility allows at most four).
     Samples are serially correlated, so cycles are the honest count of
     independent evidence, not n.
   ───────────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const A = path.join(__dirname, '..', 'src', '_includes', '_pageassets', 'shared');
const ctx = { console, Math, Date, sessionStorage: { getItem() { return null; }, setItem() {} },
  fetch: () => Promise.reject(new Error('offline')) };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(A, 'power-law-data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(A, 'channel-entries.js'), 'utf8'), ctx);
const CE = ctx.ChannelEntries, S = CE.S, med = CE.median;

function posAtDay(day) {
  if (day <= S[0].d) return S[0].pos;
  for (let i = 1; i < S.length; i++) if (S[i].d >= day) {
    const a = S[i - 1], b = S[i], t = (day - a.d) / (b.d - a.d); return a.pos * (1 - t) + b.pos * t;
  }
  return S[S.length - 1].pos;
}
const leg = (i, W) => (S[i].pos - posAtDay(S[i].d - W) < 0 ? 'falling' : 'rising');
const HALV = [[2012, 11, 28], [2016, 7, 9], [2020, 5, 11], [2024, 4, 20]]
  .map(([y, m, d]) => (Date.UTC(y, m - 1, d) / 1000 - ctx.GENESIS_TS) / 86400);
const cycles = (M) => new Set(M.map((m) => HALV.filter((h) => m.d0 >= h).length)).size;

function summ(M) {
  const n = M.length; if (!n) return { n: 0 };
  const idx = M.map((m) => m.i).sort((a, b) => a - b);
  let ep = 1; for (let k = 1; k < idx.length; k++) if (idx[k] !== idx[k - 1] + 1) ep++;
  const pct = (f) => Math.round(M.filter(f).length / n * 100);
  return { n, episodes: ep, cycles: cycles(M), paid: pct((m) => m.paid),
    ratio: med(M.map((m) => m.ratio)), dd: pct((m) => m.hadDD),
    never: pct((m) => !m.arrived), depth: Math.round(med(M.map((m) => m.depth)) * 100) };
}

const todayPos = S[S.length - 1].pos;
const positions = [];
for (let p = 0; p <= 0.951; p += 0.05) positions.push(+p.toFixed(2));
positions.push(+todayPos.toFixed(3));

const out = { lastSample: CE.monthYear(S[S.length - 1].d), todayPos: +todayPos.toFixed(3),
  todayX: +CE.ratioOf(todayPos).toFixed(2), eligible: CE.elig.length,
  eligibleSpan: CE.monthYear(S[CE.elig[0]].d) + ' to ' + CE.monthYear(S[CE.elig[CE.elig.length - 1]].d),
  rows: [] };
for (const W of [36, 60, 96]) for (const p of positions) {
  const b = CE.bandMetrics(p); if (!b) continue;
  out.rows.push({ W, pos: p, x: +CE.ratioOf(p).toFixed(2), half: +b.half.toFixed(3),
    pooled: summ(b.metrics),
    falling: summ(b.metrics.filter((m) => leg(m.i, W) === 'falling')),
    rising: summ(b.metrics.filter((m) => leg(m.i, W) === 'rising')) });
}

if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }
console.log(`last sample ${out.lastSample} · position ${out.todayPos} (${out.todayX}× trend) · ` +
  `${out.eligible} eligible entries, ${out.eligibleSpan}\n`);
const f = (s) => (s.n ? `n${String(s.n).padStart(3)} ep${String(s.episodes).padStart(2)} cyc${s.cycles}  ` +
  `paid ${String(s.paid).padStart(3)}%  ratio ${s.ratio.toFixed(2)}  dd ${String(s.dd).padStart(3)}%  never ${String(s.never).padStart(3)}%` : 'n0');
for (const r of out.rows.filter((r) => r.W === 60)) {
  console.log(`${String(r.pos).padEnd(6)} ${(r.x + '×').padEnd(6)} pooled  ${f(r.pooled)}`);
  console.log(`${''.padEnd(13)} falling ${f(r.falling)}`);
  console.log(`${''.padEnd(13)} rising  ${f(r.rising)}`);
}
