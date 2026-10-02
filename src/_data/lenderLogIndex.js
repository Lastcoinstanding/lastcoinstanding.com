/* lenderLogIndex — the /bitcoin-lenders change log, sorted and indexed at build.
   Source of truth: src/_data/lenderLog.json (entries in any order). Exposes:
     entries    newest first, each with `label` ("25 Aug 2026") and `name`
                (the lender's card name, when the entry names a lender)
     byLender   { <card id>: [entries, newest first] } for card badges/history
     latest     the newest entry (the section's "last checked" line)
     checked    { <card id>: {date, label} } the card's "Checked" line
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

/* checked[id]: the date this card was last read against the lender's own
   pages, shown on the card ("Checked 1 Oct 2026"). The later of the card's
   asOf and the newest `check` entry that covered it; a check entry with no
   `lenders` list covered every card on the page. */
const FIELDS = ['rate', 'open', 'call', 'liq', 'trig', 'coins', 'terms', 'minimum', 'where', 'track'];
const checked = {};
for (const l of lenders.lenders) {
  let d = l.asOf;
  for (const e of entries) {
    if (e.kind !== 'check') continue;
    if (e.lenders && e.lenders.indexOf(l.id) < 0) continue;
    if (e.date > d) d = e.date;
    break;
  }
  checked[l.id] = { date: d, label: label(d) };
}
for (const e of entries) {
  (e.lenders || []).forEach((id) => { if (!names[id]) throw new Error('lenderLog: unknown lender id ' + id + ' in a check entry'); });
  (e.changes || []).forEach((c) => { if (FIELDS.indexOf(c.field) < 0) throw new Error('lenderLog: unknown field ' + c.field + ' (one of ' + FIELDS.join(', ') + ')'); });
}

// The span of those dates, for the line above the cards ("30 Sep – 1 Oct 2026").
const ds = Object.values(checked).map((c) => c.date).sort();
const lo = ds[0], hi = ds[ds.length - 1];
const checkedRange = !lo ? '' : lo === hi ? label(lo)
  : (lo.slice(0, 4) === hi.slice(0, 4) ? label(lo).replace(/ \d{4}$/, '') : label(lo)) + ' – ' + label(hi);

module.exports = { entries, byLender, latest: entries[0] || null, lastCheck, checked, checkedRange,
  nextCheck: log.nextCheck, nextCheckLabel: log.nextCheckLabel };
