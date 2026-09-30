/* ============================================================
   Freshness badges — build-time NEW / UPDATED computation
   ============================================================
   Exposes a global `freshness` map { <slug>: 'new' | 'updated' } consumed by
   base.njk (nav dropdowns + mobile overlay) and calculators.njk (tiles) to
   render a quiet badge next to a page's label.

   SOURCE OF TRUTH: src/_data/updates.json ONLY. The updates.json entry you
   already write for a ship IS the badge — nothing is hand-placed, and badges
   self-expire by construction (see the standing rule in NEW_PAGE_CHECKLIST and
   the framework note in SITE_GUIDE).

   RULES (windows measured from the build clock, `new Date()`):
     • NEW      — the slug's FIRST updates.json entry is within 30 days.
     • UPDATED  — the slug's LATEST entry is within 7 days (and it is not NEW;
                  NEW suppresses UPDATED).
     • otherwise — no badge (key omitted).

   Because this runs at BUILD time (Eleventy, on every Cloudflare deploy), a
   badge expires at the first deploy AFTER its window closes — acceptable
   staleness for a site that deploys constantly, and it never needs a client
   fetch or a manual flag.

   CAVEAT (documented choice): "first entry" means first entry IN updates.json,
   not the page's original launch. A long-standing page whose only *logged*
   history is a recent rework will therefore read NEW for 30 days rather than
   UPDATED. updates.json is the only machine-readable signal available
   (explorations.json carries no launch date), and a heavy rework arguably
   warrants the louder badge anyway, so this is accepted rather than worked
   around.
============================================================ */

const updates = require('./updates.json');

// NEW stays 30 days; UPDATED 7 (JM, 2026-09-30): an UPDATED chip should mean
// "changed this week", so it stays a signal rather than wallpaper. The site
// deploys at least every market day (the strc-daily-close Action), so a chip
// expires within a day of its window.
const DAY_MS = 24 * 60 * 60 * 1000;
const NEW_WINDOW_MS = 30 * DAY_MS;
const UPDATED_WINDOW_MS = 7 * DAY_MS;

// Normalize an updates.json `page` field to an explorations slug:
// "/how-much-cash.html" | "/how-much-cash" | "/the-power-law.html#channel"
// all → "how-much-cash" / "the-power-law"; "/" → "index".
function toSlug(page) {
  if (!page || typeof page !== 'string') return null;
  let s = page.trim().replace(/#.*$/, '').replace(/^\//, '').replace(/\.html$/, '');
  return s === '' ? 'index' : s;
}

// Prefer an explicit ISO `date` field when present; otherwise parse the
// "M/D/YY" (or "M/D/YYYY") `display` string. Returns a Date (UTC) or null.
function entryDate(entry) {
  if (entry.date) {
    const d = new Date(entry.date + 'T00:00:00Z');
    if (!isNaN(d.getTime())) return d;
  }
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec((entry.display || '').trim());
  if (!m) return null;
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  return new Date(Date.UTC(year, parseInt(m[1], 10) - 1, parseInt(m[2], 10)));
}

module.exports = function () {
  const now = Date.now();

  // Fold updates into { slug: { first, latest } } millisecond bounds.
  const bounds = {};
  for (const entry of updates) {
    const slug = toSlug(entry.page);
    const d = entryDate(entry);
    if (!slug || !d) continue;
    const t = d.getTime();
    if (!bounds[slug]) bounds[slug] = { first: t, latest: t };
    else {
      if (t < bounds[slug].first) bounds[slug].first = t;
      if (t > bounds[slug].latest) bounds[slug].latest = t;
    }
  }

  const out = {};
  for (const slug in bounds) {
    const { first, latest } = bounds[slug];
    if (now - first <= NEW_WINDOW_MS) out[slug] = 'new';
    else if (now - latest <= UPDATED_WINDOW_MS) out[slug] = 'updated';
    // else: no badge — omit the key.
  }
  return out;
};
