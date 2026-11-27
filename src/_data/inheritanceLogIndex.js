/* inheritanceLogIndex — the /bitcoin-inheritance-planning change log, sorted
   and indexed at build. The same shape as lenderLogIndex.js (the lender page's
   log), so the two pages keep their logs the same way.
   Source of truth: src/_data/inheritanceLog.json (entries in any order). Exposes:
     entries    newest first, each with `label` ("29 Jul 2026") and `name`
                (the card's name, when the entry names a plan)
     byPlan     { <card id>: [entries, newest first] } for card badges/history
     checked    { <card id>: {date, label} } the card's "Checked" line
     checkedRange  the span of those dates ("25 – 26 Nov 2026")
   A wrong plan id, or an unknown field in `changes`, fails the build loudly
   rather than rendering a dead link or a highlight that never shows. */
const log = require('./inheritanceLog.json');
const data = require('./inheritance.json');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function label(iso) { const [y, m, d] = iso.split('-').map(Number); return d + ' ' + MONTHS[m - 1] + ' ' + y; }
const names = Object.fromEntries(data.plans.map((p) => [p.id, p.name + (p.nameNote ? ' (' + p.nameNote + ')' : '')]));
const FIELDS = ['wait', 'heir', 'without', 'renew', 'steps', 'price', 'keys', 'keep', 'gone', 'identity', 'beneficiary', 'probate', 'time', 'documents'];
const KINDS = ['check', 'page', 'provider'];

const entries = log.entries.map((e, i) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date)) throw new Error('inheritanceLog: bad date ' + e.date);
  if (KINDS.indexOf(e.kind) < 0) throw new Error('inheritanceLog: unknown kind ' + e.kind);
  if (e.plan && !names[e.plan]) throw new Error('inheritanceLog: unknown plan id ' + e.plan);
  (e.plans || []).forEach((id) => { if (!names[id]) throw new Error('inheritanceLog: unknown plan id ' + id + ' in a check entry'); });
  (e.changes || []).forEach((c) => { if (FIELDS.indexOf(c.field) < 0) throw new Error('inheritanceLog: unknown field ' + c.field + ' (one of ' + FIELDS.join(', ') + ')'); });
  return Object.assign({}, e, { label: label(e.date), name: e.plan ? names[e.plan] : null, _i: i });
}).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a._i - b._i));

const byPlan = {};
for (const e of entries) if (e.plan) (byPlan[e.plan] = byPlan[e.plan] || []).push(e);

/* checked[id]: the later of the card's asOf and the newest `check` entry that
   covered it (an entry with no `plans` list covered every card). */
const checked = {};
for (const p of data.plans) {
  let d = p.asOf;
  for (const e of entries) {
    if (e.kind !== 'check') continue;
    if (e.plans && e.plans.indexOf(p.id) < 0) continue;
    if (e.date > d) d = e.date;
    break;
  }
  checked[p.id] = { date: d, label: label(d) };
}

const ds = Object.values(checked).map((c) => c.date).sort();
const lo = ds[0], hi = ds[ds.length - 1];
const checkedRange = !lo ? '' : lo === hi ? label(lo)
  : (lo.slice(0, 4) === hi.slice(0, 4) ? label(lo).replace(/ \d{4}$/, '') : label(lo)) + ' – ' + label(hi);

module.exports = { entries, byPlan, checked, checkedRange,
  nextCheck: log.nextCheck, nextCheckLabel: log.nextCheckLabel };
