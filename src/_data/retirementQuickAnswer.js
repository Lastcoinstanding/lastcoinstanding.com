// The quick answer on The Bitcoin Retirement, rendered at build time
// (2026-10-20, JM; SITE_GUIDE §17, "Quick answer").
//
// Runs the page's own browser modules in a Node vm, so the HTML a search
// engine reads comes from the same code the reader's browser runs:
//   modeling-assumptions → power-law-data → reversion-durations →
//   price-cases → retirement-engine → retirement-quick-answer
// The clock is set to the latest PL_DATA sample's date and the price is
// that sample's, so the figures are exactly "as of" a dated price rather
// than an old price read against today's trend. Storage is empty, so the
// sitewide assumptions are the defaults (inflation 6.5%). In the browser
// the module re-renders the block at today's price; see the module header.
//
// A failure here fails the build on purpose: printing a stale or partial
// table would be worse than not deploying.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SHARED = path.join(__dirname, '../_includes/_pageassets/shared');
const FILES = ['modeling-assumptions.js', 'power-law-data.js', 'reversion-durations.js',
               'price-cases.js', 'retirement-engine.js', 'retirement-quick-answer.js'];
const GENESIS_TS = 1230940800;

// The modules read the clock through Date: new Date() and Date.now() for
// "today", and local-time getters and new Date(y, m, d) for calendar dates.
// This Date is pinned to `nowMs` and keeps calendar time in UTC, so the build
// prints the same table on any machine, whatever its time zone (Cloudflare
// builds in UTC; a laptop may not).
// Covered: new Date(), new Date(ms), new Date(y, m, d…), Date.now, Date.UTC,
// the local getters below and every getUTC*/toISOString. NOT covered, and
// unused by the six modules today: the local setters, toLocale*/toString
// (they follow the machine's zone), date strings without a Z, and Date()
// called without `new` (a class throws). If a module starts using one, extend
// this class, or the build becomes time-zone dependent without an error.
function sandbox(nowMs) {
  const RealDate = Date;
  class FixedDate extends RealDate {
    constructor(...a) {
      if (a.length === 0) super(nowMs);
      else if (a.length >= 2 && a.every((x) => typeof x === 'number')) super(RealDate.UTC(...a));
      else super(...a);
    }
    static now() { return nowMs; }
    getFullYear() { return this.getUTCFullYear(); }
    getMonth() { return this.getUTCMonth(); }
    getDate() { return this.getUTCDate(); }
    getDay() { return this.getUTCDay(); }
    getHours() { return this.getUTCHours(); }
    getMinutes() { return this.getUTCMinutes(); }
    getSeconds() { return this.getUTCSeconds(); }
    getTimezoneOffset() { return 0; }
  }
  const store = {};
  const storage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
  const ctx = { Date: FixedDate, Math, JSON, console, localStorage: storage, sessionStorage: storage,
                isFinite, isNaN, parseFloat, parseInt, Object, Array, String, Number, Error,
                setTimeout, clearTimeout };
  ctx.window = ctx;
  vm.createContext(ctx);
  return ctx;
}

function load(ctx, files) {
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(SHARED, f), 'utf8'), ctx, { filename: f });
}

module.exports = function () {
  // First pass: read the latest sample, to set the clock to its date.
  const probe = sandbox(Date.now());
  load(probe, ['power-law-data.js']);
  const last = vm.runInContext('PL_DATA[PL_DATA.length - 1]', probe);
  const sampleMs = (GENESIS_TS + last[0] * 86400) * 1000;

  const ctx = sandbox(sampleMs);
  load(ctx, FILES);
  const RQA = ctx.RetirementQuickAnswer;
  if (!RQA) throw new Error('[retirementQuickAnswer] the module did not load');
  const d = RQA.compute();
  const p = RQA.parts(d, { priceNote: '' });
  const rowCount = (p.rows.match(/<tr>/g) || []).length;
  if (rowCount !== 5 || /NaN|undefined|Infinity/.test(p.lead + p.rows + p.notes + p.asof)) {
    throw new Error('[retirementQuickAnswer] the table did not compute cleanly (' + rowCount + ' rows)');
  }
  // `infl` goes on the section as data-rqa-infl: the browser keeps this
  // snapshot on a non-live price only while the reader's setting matches it.
  return Object.assign({ asOf: new Date(sampleMs).toISOString().slice(0, 10), price: last[1],
                         multiple: d.m, infl: d.infl }, p);
};
