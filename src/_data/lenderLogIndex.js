/* lenderLogIndex — the /bitcoin-lenders change log, sorted and indexed at build.
   Source of truth: src/_data/lenderLog.json (entries in any order). Exposes:
     entries    newest first, each with `label` ("25 Aug 2026") and `name`
                (the lender's card name, when the entry names a lender)
     byLender   { <card id>: [entries, newest first] } for card badges/history
     latest     the newest entry (the section's "last checked" line)
   A wrong lender id fails the build loudly rather than rendering a dead link. */
const log = require('./lenderLog.json');
const lenders = require('./lenders.json');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function label(iso) { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MONTHS[m - 1] + ' ' + y; }
const names = Object.fromEntries(lenders.lenders.map((l) => [l.id, l.name]));

const entries = log.entries.map((e, i) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) throw new Error('lenderLog: bad date ' + e.date);
  if (e.lender && !names[e.lender]) throw new Error('lenderLog: unknown lender id ' + e.lender);
  return Object.assign({}, e, { label: label(e.date), name: e.lender ? names[e.lender] : null, _i: i });
}).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a._i - b._i));

const byLender = {};
for (const e of entries) if (e.lender) (byLender[e.lender] = byLender[e.lender] || []).push(e);
const lastCheck = entries.find((e) => e.kind === 'check') || null;

module.exports = { entries, byLender, latest: entries[0] || null, lastCheck,
  nextCheck: log.nextCheck, nextCheckLabel: log.nextCheckLabel };
