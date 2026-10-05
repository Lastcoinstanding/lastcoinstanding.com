/* ============================================================
   Freshness badges — build-time NEW / UPDATED computation
   ============================================================
   Exposes a global `freshness` map { <slug>: 'new' | 'updated' } consumed by
   base.njk (nav dropdowns + mobile overlay) and calculators.njk (tiles) to
   render a quiet badge next to a page's label.

   SOURCES: src/_data/updates.json (every badge-worthy change) and, for the
   launch date only, an optional `launched` field on the page's
   src/_data/explorations.json entry. Nothing is hand-placed, and badges
   self-expire by construction (see the standing rule in NEW_PAGE_CHECKLIST §5
   and the framework note in SITE_GUIDE §40.3).

   RULES (windows measured from the build clock, `new Date()`):
     • NEW      — the page LAUNCHED within 30 days. Launch date = the
                  explorations.json `launched` field ("YYYY-MM-DD") when
                  present, otherwise the slug's FIRST badge-counting
                  updates.json entry.
     • UPDATED  — the slug's LATEST badge-counting updates.json entry is within
                  7 days (and it is not NEW; NEW suppresses UPDATED).
     • otherwise — no badge (key omitted).

   `"badge": false` ON AN updates.json ENTRY (added 2026-10-04, JM): the entry
   still appears on the updates page but counts toward neither badge. Use it
   for data refreshes, dated status lines and wording fixes; leave it off for
   new features, new tabs and changed results. A routine refresh is no
   evidence of a launch either, which is why it is excluded from the NEW
   fallback as well as from UPDATED.

   WHY `launched` EXISTS (2026-10-04). The NEW fallback reads "first entry IN
   updates.json", not the page's launch, so a long-standing page whose first
   logged entry was a recent refresh read NEW for 30 days (Disciplined
   Rebalancing, Bitcoin vs. the Stock Market, Living on Bitcoin and others in
   October 2026). `launched` pins the real date: set it from the page's first
   commit (`git log --diff-filter=A --follow -- src/<slug>.njk`, or the root
   .html for pages that predate the April 2026 Eleventy migration). A hub that
   gathers existing tools takes its series' start, not its own commit (JM
   ruling on /bitcoin-and-real-estate), so it reads UPDATED, not NEW.

   Because this runs at BUILD time (Eleventy, on every Cloudflare deploy), a
   badge expires at the first deploy AFTER its window closes — acceptable
   staleness for a site that deploys constantly, and it never needs a client
   fetch or a manual flag.
============================================================ */

const updates = require('./updates.json');
const explorations = require('./explorations.json');

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

// Launch dates pinned in explorations.json: { slug: ms }.
function launchedMap() {
  const out = {};
  for (const e of explorations) {
    if (!e || !e.slug || !e.launched) continue;
    const d = new Date(e.launched + 'T00:00:00Z');
    if (!isNaN(d.getTime())) out[e.slug] = d.getTime();
  }
  return out;
}

module.exports = function () {
  const now = Date.now();
  const launched = launchedMap();

  // Fold badge-counting updates into { slug: { first, latest } } millisecond
  // bounds. `badge: false` entries are routine refreshes: skipped entirely.
  const bounds = {};
  for (const entry of updates) {
    if (entry.badge === false) continue;
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
  const slugs = new Set(Object.keys(bounds).concat(Object.keys(launched)));
  for (const slug of slugs) {
    const b = bounds[slug];
    const start = launched[slug] != null ? launched[slug] : (b ? b.first : null);
    if (start != null && now - start <= NEW_WINDOW_MS) out[slug] = 'new';
    else if (b && now - b.latest <= UPDATED_WINDOW_MS) out[slug] = 'updated';
    // else: no badge — omit the key.
  }
  return out;
};
