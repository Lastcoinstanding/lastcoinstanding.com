/* ─────────────────────────────────────────────────────────────────────────────
   measure-rolling-oos.js: rolling out-of-sample power-law fits, swept

   WHY THIS EXISTS. /the-power-law's out-of-sample chart lets a reader pick ONE
   training cutoff and see how that fit projects. This script sweeps every
   cutoff and measures the miss, so the question "when did the power law
   become reliable?" gets a measured answer, failures included. It changes
   nothing on the site. Report: ROLLING_OOS_FITS_2026-09-23.md.

   HOW TO RUN (from the repo root, Node 18+):
     node scripts/measure-rolling-oos.js           # yearly table
     node scripts/measure-rolling-oos.js --json    # quarterly, every field

   METHOD. It uses the page's own fit: log-log OLS over PL_DATA from the first
   sample through the cutoff, copied from the-power-law.js fit(). The cutoff is
   the first day of the month after the end of the named quarter or year.
     b          fitted exponent (canonical 5.77)
     today×     fitted trend at the last sample / canonical trend at the same day
     drift+4y   fitted trend / canonical trend, 4 years after the cutoff: how
                far the line a reader would have drawn had moved from today's
                reference line by then. This measures the model, not the market.
                Price's own distance from trend at any date mostly reflects the
                cycle phase, so it is deliberately not used as the "miss".
     in4y       share of samples in the 4 years after the cutoff inside the
                fitted channel (0.42x to 3.0x the fitted trend, the site's
                floor and ceiling multiples). A fixed window keeps cutoffs
                comparable. null when fewer than 4 years have elapsed.
     inAll      the same share over every post-cutoff sample
   CAVEAT, stated in the report: the canonical line is itself fitted to the
   whole record, so "drift" is measured against hindsight. The in-band shares
   do not depend on the canonical line.
   ───────────────────────────────────────────────────────────────────────────── */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const A = path.join(__dirname, '..', 'src', '_includes', '_pageassets', 'shared');
const ctx = { console, Math, Date, sessionStorage: { getItem() { return null; }, setItem() {} },
  fetch: () => Promise.reject(new Error('offline')) };
ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(A, 'power-law-data.js'), 'utf8'), ctx);
const D = ctx.PL_DATA, G = ctx.GENESIS_TS, canon = (d) => ctx.PL_A * Math.pow(d, ctx.PL_B);
const LAST = D[D.length - 1][0], YEAR = 365.25;
const dayOf = (y, m) => Math.floor((Date.UTC(y, m, 1) / 1000 - G) / 86400); // m 0-based

function fit(cut) { // verbatim method of the-power-law.js fit()
  let sx = 0, sy = 0, sxy = 0, sx2 = 0, n = 0;
  for (const [d, p] of D) if (d <= cut && p > 0) { const lx = Math.log(d), ly = Math.log(p); sx += lx; sy += ly; sxy += lx * ly; sx2 += lx * lx; n++; }
  const b = (n * sxy - sx * sy) / (n * sx2 - sx * sx), a = Math.exp((sy - b * sx) / n);
  return { a, b, n };
}
const med = (v) => { const s = v.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

function row(label, cut) {
  const f = fit(cut), tr = (d) => f.a * Math.pow(d, f.b);
  const post = D.filter(([d]) => d > cut);
  const share = (S) => (S.length ? Math.round(S.filter(([d, p]) => p / tr(d) >= 0.42 && p / tr(d) <= 3.0).length / S.length * 100) : null);
  const h4 = cut + 4 * YEAR;
  return { cutoff: label, n: f.n, b: +f.b.toFixed(3), todayX: +(tr(LAST) / canon(LAST)).toFixed(2),
    drift4y: h4 <= LAST ? +(tr(h4) / canon(h4)).toFixed(2) : null,
    in4y: h4 <= LAST ? share(post.filter(([d]) => d <= h4)) : null,
    inAll: share(post), postN: post.length };
}

const rows = [];
const quarterly = process.argv.includes('--json');
for (let y = 2011; y <= 2024; y++) for (let q = quarterly ? 1 : 4; q <= 4; q++) {
  const label = quarterly ? `${y}-Q${q}` : `end-${y}`;
  rows.push(row(label, dayOf(q === 4 ? y + 1 : y, q === 4 ? 0 : q * 3)));
}
const full = fit(LAST);
const meta = { lastSample: new Date((G + LAST * 86400) * 1000).toISOString().slice(0, 10),
  fullSeriesB: +full.b.toFixed(3), fullSeriesTodayX: +((full.a * Math.pow(LAST, full.b)) / canon(LAST)).toFixed(2),
  canonical: { a: ctx.PL_A, b: ctx.PL_B } };

if (quarterly) { console.log(JSON.stringify({ meta, rows }, null, 1)); process.exit(0); }
console.log(`last sample ${meta.lastSample} · full-series fit b=${meta.fullSeriesB}, today ${meta.fullSeriesTodayX}× canonical\n`);
console.log('cutoff     n     b      today×  drift+4y  in 4y   in all');
for (const r of rows) console.log(`${r.cutoff.padEnd(9)} ${String(r.n).padStart(3)}  ${r.b.toFixed(3)}  ${String(r.todayX).padStart(6)}  ${String(r.drift4y ?? '—').padStart(6)}  ${(r.in4y == null ? '—' : r.in4y + '%').padStart(5)}  ${String(r.inAll).padStart(4)}%`);
