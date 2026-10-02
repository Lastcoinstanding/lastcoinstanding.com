#!/usr/bin/env node
/* lender-watch — has any lender's own page changed since last week?
   (JM 2026-10-01; MONTHLY_REFRESH_CHECKLIST §7.6; SITE_GUIDE §57)

   Reads every page a /bitcoin-lenders card cites (each card's `sources` and
   `site` in src/_data/lenders.json) in a real browser, keeps only the lines that
   carry terms (a figure with %, $ or a term-like word, or rehypothecation /
   availability language), and compares them with the previous run's snapshot.

   It never edits the site. A changed page is a lead for a person to read, not
   a fact: the card changes only after the change is verified on the lender's
   page and logged in src/_data/lenderLog.json, which is what readers see.

   Usage:
     node scripts/lender-watch.mjs --prev prev/state.json --out out/
   Writes out/state.json (this run's snapshot), out/report.md, and, under
   GitHub Actions, `changed`, `blocked` and `checked` step outputs.
   Needs `playwright` resolvable (the workflow installs it; it is not a
   dependency of the site) or PLAYWRIGHT_MODULE pointing at it. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? a.concat([[v.slice(2), all[i + 1]]]) : a), []));
const OUT = args.out || 'lender-watch-out';
const PREV = args.prev && fs.existsSync(args.prev) ? JSON.parse(fs.readFileSync(args.prev, 'utf8')) : null;

/* Pages whose figures move by the minute (live markets and offer books) and
   pages that only grow (forum threads). Read by hand at the monthly re-read. */
const SKIP = [
  [/^https:\/\/app\.aave\.com\//, 'live market'],
  [/^https:\/\/app\.morpho\.org\//, 'live market'],
  [/^https:\/\/debifi\.com\/offers/, 'live offer book'],
  [/^https:\/\/lend\.hodlhodl\.com\/offers/, 'live offer book'],
  [/^https:\/\/governance\.aave\.com\//, 'forum thread'],
  [/^https:\/\/www\.sec\.gov\//, 'regulator record'],
];

/* Lines kept for comparison: terms and the page's sentences, not its chrome. */
const KEEP = /%|\$|€|£|₿|\bLTV\b|\bAPR\b|rehypothec|re-?pledg|lend (it )?out|not available|unavailable|available in|liquidat|margin call|minimum|maximum|origination|fee\b|fees\b|per cent|basis points|\bstates?\b|custod/i;
const DROP = [
  /min read/i, /downloads?\b/i, /five-star|reviews?\b/i, /©|copyright/i, /cookie/i,
  /\b\d+\s+(seconds?|minutes?|hours?|days?)\s+ago\b/i,
  /price\b.*\$|\$.*\bprice\b/i,   // calculator outputs that follow the live bitcoin price
  /₿\s?\d/,                       // calculator collateral in BTC
  /^\$?[\d,.]+\s*(k|m|b)?\+?$/i,  // bare counters
  /^[+\-−]?\d+(\.\d+)?\s?%$/,     // bare percentages: price tickers
  /\bmarket is (up|down)\b|in the last 24 hours/i,
  /was this (article|page|answer) helpful|found this helpful/i,
];
/* State and territory names on their own line: availability lists. */
const STATES = new Set(('Alabama Alaska Arizona Arkansas California Colorado Connecticut Delaware Florida Georgia Hawaii Idaho Illinois Indiana Iowa Kansas Kentucky Louisiana Maine Maryland Massachusetts Michigan Minnesota Mississippi Missouri Montana Nebraska Nevada New_Hampshire New_Jersey New_Mexico New_York North_Carolina North_Dakota Ohio Oklahoma Oregon Pennsylvania Rhode_Island South_Carolina South_Dakota Tennessee Texas Utah Vermont Virginia Washington West_Virginia Wisconsin Wyoming D.C. Washington_D.C. District_of_Columbia Puerto_Rico').split(' ').map((x) => x.replace(/_/g, ' ')));
function signal(text) {
  const seen = new Set(), out = [];
  for (let line of text.split('\n')) {
    line = line.replace(/\s+/g, ' ').trim();
    if (line.length < 3 || line.length > 600) continue;
    const terms = KEEP.test(line) && /\d|rehypothec|re-?pledg|not available|unavailable/i.test(line);
    const prose = line.length >= 40 && line.split(' ').length >= 7;   // the page's sentences, not its menus
    if (!terms && !prose && !STATES.has(line)) continue;
    if (DROP.some((r) => r.test(line))) continue;
    if (seen.has(line)) continue;
    seen.add(line); out.push(line);
  }
  return out;
}

const lenders = JSON.parse(fs.readFileSync('src/_data/lenders.json', 'utf8')).lenders;
const pages = new Map();   // url -> [lender names]
for (const l of lenders) for (const u of [...l.sources, l.site]) {
  if (!pages.has(u)) pages.set(u, []);
  if (!pages.get(u).includes(l.name)) pages.get(u).push(l.name);
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36' });
const state = { run: new Date().toISOString(), pages: {} };

async function read(url) {
  const skip = SKIP.find(([re]) => re.test(url));
  if (skip) return { status: 'skipped', why: skip[1] };
  if (/\.pdf(\?|$)/i.test(url)) {   // a PDF: compare the file itself
    try {
      const r = await ctx.request.get(url, { timeout: 45000 });
      if (!r.ok()) return { status: r.status() === 403 ? 'blocked' : 'error', why: `HTTP ${r.status()}` };
      const hash = createHash('sha256').update(await r.body()).digest('hex').slice(0, 16);
      return { status: 'ok', final: url, lines: ['PDF file fingerprint ' + hash] };
    } catch (e) { return { status: 'error', why: e.message.split('\n')[0].slice(0, 160) }; }
  }
  const p = await ctx.newPage();
  try {
    const resp = await p.goto(url, { waitUntil: 'load', timeout: 45000 });
    await p.waitForTimeout(3000);
    await p.$$eval('details', (ds) => ds.forEach((d) => { d.open = true; })).catch(() => {});
    const title = await p.title();
    // the article itself where the page marks one, so a blog's list of other posts doesn't count
    const [main, whole] = await p.evaluate(() => {
      const el = document.querySelector('article') || document.querySelector('main');
      return [el ? el.innerText : '', document.body ? document.body.innerText : ''];
    });
    const code = resp ? resp.status() : 0;
    if (/just a moment|attention required|access denied/i.test(title) || code === 403 || code === 429)
      return { status: 'blocked', why: `HTTP ${code}${title ? ' · ' + title : ''}` };
    if (code >= 400) return { status: 'error', why: `HTTP ${code}` };
    let lines = signal(main);
    if (!lines.length) lines = signal(whole);   // some sites wrap only a sliver of the page in <main>
    if (!lines.length) return { status: 'empty', why: 'no lines with terms found (page layout changed, or rendered nothing)', final: p.url() };
    return { status: 'ok', final: p.url(), lines };
  } catch (e) {
    return { status: 'error', why: e.message.split('\n')[0].slice(0, 160) };
  } finally {
    await p.close();
  }
}

const urls = [...pages.keys()].sort();
const CONC = 4;
for (let i = 0; i < urls.length; i += CONC) {
  const batch = urls.slice(i, i + CONC);
  const res = await Promise.all(batch.map(read));
  batch.forEach((u, k) => { state.pages[u] = Object.assign({ lenders: pages.get(u) }, res[k]); });
}
await browser.close();

/* Compare with last week. */
const changed = [], blocked = [], gone = [];
for (const u of urls) {
  const now = state.pages[u];
  if (now.status === 'skipped') continue;
  if (now.status !== 'ok') { blocked.push(u); continue; }
  const before = PREV && PREV.pages && PREV.pages[u];
  if (!before || before.status !== 'ok') continue;   // no comparable baseline yet
  const was = new Set(before.lines), is = new Set(now.lines);
  const added = now.lines.filter((x) => !was.has(x)), removed = before.lines.filter((x) => !is.has(x));
  const moved = before.final && now.final && before.final !== now.final;
  if (added.length || removed.length || moved) changed.push({ u, added, removed, moved: moved ? [before.final, now.final] : null });
}
for (const u of Object.keys((PREV && PREV.pages) || {})) if (!pages.has(u)) gone.push(u);

const by = (u) => state.pages[u].lenders.join(', ');
const cap = (xs, n) => xs.slice(0, n).map((x) => '  - `' + x.replace(/`/g, "'").slice(0, 240) + '`').join('\n') + (xs.length > n ? `\n  - …and ${xs.length - n} more` : '');
const ok = urls.filter((u) => state.pages[u].status === 'ok').length;
const skipped = urls.filter((u) => state.pages[u].status === 'skipped').length;

let md = `## Lender pages: ${changed.length} changed since the last run\n\n`;
md += PREV ? `Compared with the run of ${PREV.run.slice(0, 10)}. ` : `**First run: this snapshot is the baseline; nothing to compare yet.** `;
md += `${ok} of ${urls.length} pages read, ${blocked.length} couldn't be read, ${skipped} not watched (live markets and forum threads, read by hand monthly).\n\n`;
md += `A change here is a lead, not a fact. Before a card changes: read the lender's page, edit \`src/_data/lenders.json\`, and log it in \`src/_data/lenderLog.json\` with \`changes\` (MONTHLY_REFRESH_CHECKLIST §7.6). Many hits are wording or layout.\n\n`;
for (const c of changed) {
  md += `### ${by(c.u)}\n${c.u}\n`;
  if (c.moved) md += `- Now redirects: ${c.moved[0]} → ${c.moved[1]}\n`;
  if (c.removed.length) md += `- Lines gone:\n${cap(c.removed, 12)}\n`;
  if (c.added.length) md += `- Lines new:\n${cap(c.added, 12)}\n`;
  md += '\n';
}
if (blocked.length) {
  md += `### Couldn't read (check by hand at the monthly re-read)\n`;
  for (const u of blocked) md += `- ${by(u)}: ${u} (${state.pages[u].status}: ${state.pages[u].why})\n`;
  md += '\n';
}
if (gone.length) md += `### No longer cited by any card\n${gone.map((u) => '- ' + u).join('\n')}\n`;

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'state.json'), JSON.stringify(state, null, 1));
fs.writeFileSync(path.join(OUT, 'report.md'), md);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed.length}\nblocked=${blocked.length}\nchecked=${ok}\nbaseline=${PREV ? 'no' : 'yes'}\n`);
console.log(md);
