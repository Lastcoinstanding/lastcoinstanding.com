/**
 * GET /api/price — today's BTC/USD price, served from the site's own domain.
 *
 * Why (TECH_DEBT "First-party price proxy", built 2026-11-06): every page's
 * "today" comes from fetchTodayPrice (shared/power-law-data.js), which used to
 * ask public price APIs straight from the reader's browser. Two weaknesses:
 *   - a reader whose ad-blocker or network blocks all four hosts always saw the
 *     dated fallback;
 *   - every reader's browser made its own request, so a provider's rate limit
 *     (the CoinGecko 429s, the 2026-09-29 fault) hit readers one by one.
 * This endpoint is same-origin (nothing to block, no CORS), asks the providers
 * server-side, and caches the answer at the edge for CACHE_SECONDS, so one
 * upstream request serves every reader in that window at that data centre.
 *
 * Upstreams, in order; the first sane answer wins. Server-side there is no
 * CORS limit, so Bitstamp (unusable from a browser) joins as a fifth source.
 *
 * Response 200: { price: number, provider: id, providerName, ts: ms, cached: bool }
 * Response 503: { error } when every upstream fails. The browser then walks
 * its own direct list (unchanged), then the dated PL_DATA fallback.
 *
 * No secrets, no bindings, no reader data: the request carries nothing and
 * nothing is stored beyond the edge cache entry.
 */
const CACHE_SECONDS = 30;
const UPSTREAM_TIMEOUT_MS = 3000;
// Plausibility only; the browser applies the tighter 0.1×–10× PL_DATA bound.
const MIN_PRICE = 1000;
const MAX_PRICE = 10000000;

const UPSTREAMS = [
  { id: 'coinbase', name: 'Coinbase',
    url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot',
    pick: d => (d && d.data && d.data.currency === 'USD') ? parseFloat(d.data.amount) : NaN },
  { id: 'kraken', name: 'Kraken',
    url: 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD',
    pick: d => {
      if (!d || (d.error && d.error.length) || !d.result) return NaN;
      for (const k in d.result) {
        const t = d.result[k];
        if (t && t.c && t.c.length) return parseFloat(t.c[0]);
      }
      return NaN;
    } },
  { id: 'bitstamp', name: 'Bitstamp',
    url: 'https://www.bitstamp.net/api/v2/ticker/btcusd/',
    pick: d => d ? parseFloat(d.last) : NaN },
  { id: 'mempool', name: 'mempool.space',
    url: 'https://mempool.space/api/v1/prices',
    pick: d => d ? d.USD : NaN },
  { id: 'coingecko', name: 'CoinGecko',
    url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
    pick: d => d && d.bitcoin ? d.bitcoin.usd : NaN },
];

const sane = p => typeof p === 'number' && isFinite(p) && p >= MIN_PRICE && p <= MAX_PRICE;

const reply = (status, body, maxAge) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
    'X-Robots-Tag': 'noindex',
  },
});

async function fetchJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json', 'User-Agent': 'lastcoinstanding-price/1.0' },
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function lookUp() {
  for (const u of UPSTREAMS) {
    try {
      const p = u.pick(await fetchJson(u.url));
      if (sane(p)) return { price: p, provider: u.id, providerName: u.name, ts: Date.now() };
    } catch (e) { /* next upstream */ }
  }
  return null;
}

export async function onRequestGet(context) {
  // A fixed cache key: query strings never split the cache.
  const cache = (typeof caches !== 'undefined') ? caches.default : null;
  const key = new Request(new URL('/api/price', context.request.url).toString(), { method: 'GET' });

  if (cache) {
    const hit = await cache.match(key);
    if (hit) {
      const body = await hit.json();
      return reply(200, { ...body, cached: true }, CACHE_SECONDS);
    }
  }

  const found = await lookUp();
  if (!found) return reply(503, { error: 'no price source answered' });

  const res = reply(200, { ...found, cached: false }, CACHE_SECONDS);
  if (cache) context.waitUntil(cache.put(key, res.clone()));
  return res;
}
