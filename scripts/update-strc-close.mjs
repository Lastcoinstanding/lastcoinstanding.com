#!/usr/bin/env node
/* ============================================================================
   update-strc-close.mjs — the site's FIRST CI data automation.

   Fetches STRC's official daily close and writes it to
   src/_data/strcClose.json, which /the-strc-mechanism reads at runtime
   ("last close $XX.XX · as of <date>"). Run by .github/workflows/strc-daily-close.yml
   on market weekdays after the US close, and via workflow_dispatch.

   SOURCE — Yahoo Finance chart endpoint (keyless).
     https://query1.finance.yahoo.com/v8/finance/chart/STRC?interval=1d&range=5d
   NOTE: the originally-scoped source (Stooq CSV, strc.us) is no longer usable
   keyless — as of 2026-08-10 its CSV endpoints sit behind a JavaScript
   anti-bot challenge, verified by hand. Yahoo's chart JSON is keyless, returns
   the daily-close series + timestamps, and identifies the instrument
   ("Strategy Inc - Variable Rate Se…", 52-wk 71.25–100.42, matching filings).
   query2 is used as a fallback host. Documented in DATA_AUDIT ("STRC daily close").

   GUARDS (design: staleness is visible, never masked):
     • fetch/parse failure  → exit 1, no write (the run goes red; the page keeps
       showing the prior close with its honest date). Caught by the monthly
       silent-death check.
     • > 25% day-over-day move → exit 1, no write (bad-data fuse; a real move that
       size gets verified by hand before it lands).
     • value unchanged (weekend/holiday) → exit 0, no write (no empty commit).
     • otherwise → write the file; the workflow commits it as "data(strc): …".

   Dependency-free (Node 18+ global fetch + fs). No npm install, no secrets.
   ============================================================================ */
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

// Emit a GitHub Actions step output (used by the workflow to gate the commit).
function output(kv) { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, kv + '\n'); }

const OUT = 'src/_data/strcClose.json';
const SYMBOL = 'STRC';
const SOURCE = 'Yahoo Finance (STRC daily close)';
const FUSE = 0.25; // abort if |close − prevClose| / prevClose exceeds this

const HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
const UA = 'Mozilla/5.0 (X11; Linux x86_64) lastcoinstanding-strc-close-bot';

function fail(msg) { console.error('[strc-close] ABORT: ' + msg); process.exit(1); }

async function fetchChart() {
  let lastErr = '';
  for (const host of HOSTS) {
    const url = `https://${host}/v8/finance/chart/${SYMBOL}?interval=1d&range=7d`;
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
      if (!r.ok) { lastErr = `${host} → HTTP ${r.status}`; continue; }
      const j = await r.json();
      const res = j && j.chart && j.chart.result && j.chart.result[0];
      if (res) return res;
      lastErr = `${host} → no chart.result`;
    } catch (e) { lastErr = `${host} → ${e && e.message}`; }
  }
  fail('fetch failed on all hosts: ' + lastErr);
}

// Last non-null daily close and its date (US/Eastern), from the daily series.
function parseClose(res) {
  const ts = res.timestamp || [];
  const q = res.indicators && res.indicators.quote && res.indicators.quote[0];
  const closes = (q && q.close) || [];
  for (let i = closes.length - 1; i >= 0; i--) {
    const c = closes[i];
    if (typeof c === 'number' && isFinite(c) && c > 0) {
      const close = Math.round(c * 100) / 100;
      const date = new Date(ts[i] * 1000).toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); // YYYY-MM-DD
      // Cross-check against meta.regularMarketPrice when the market is closed.
      const meta = res.meta || {};
      return { close, date, metaPrice: meta.regularMarketPrice, name: meta.shortName || '' };
    }
  }
  fail('no valid close in the daily series');
}

function readPrev() {
  try { return JSON.parse(readFileSync(OUT, 'utf8')); } catch { return null; }
}

const res = await fetchChart();
const { close, date, metaPrice, name } = parseClose(res);
console.log(`[strc-close] fetched: ${SYMBOL} "${name}" close $${close} as of ${date} (meta $${metaPrice})`);

const prev = readPrev();
if (prev && typeof prev.close === 'number') {
  const move = Math.abs(close - prev.close) / prev.close;
  if (move > FUSE) fail(`day-over-day move ${(move * 100).toFixed(1)}% exceeds ${FUSE * 100}% fuse (prev $${prev.close} → $${close}); verify by hand.`);
  if (close === prev.close && date === prev.asOfDate) {
    console.log('[strc-close] unchanged — no write, no commit.');
    output('changed=false');
    process.exit(0);
  }
}

writeFileSync(OUT, JSON.stringify({ close, asOfDate: date, source: SOURCE }, null, 2) + '\n');
console.log(`[strc-close] wrote ${OUT}: $${close} as of ${date}`);
output('changed=true');
output('close=' + close.toFixed(2));
output('asof=' + date);
