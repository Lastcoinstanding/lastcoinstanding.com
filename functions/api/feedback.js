/**
 * POST /api/feedback — private reader feedback for Last Coin Standing.
 *
 * Pipeline: honeypot → validation → rate limit (KV) → optional Turnstile
 * (enforced only when TURNSTILE_SECRET is set) → KV archive → email notify.
 *
 * Bindings / env (configured in Cloudflare dashboard — see FEEDBACK_SETUP.md):
 *   FEEDBACK        KV namespace (required: archive + rate limiting)
 *   NOTIFY          send_email binding to verified destination (preferred), or
 *   RESEND_KEY      Resend API key (fallback email path), or neither (KV-only)
 *   TURNSTILE_SECRET  enables Turnstile verification when present
 *   FEEDBACK_TO     destination address (default below)
 */
const DEST_DEFAULT = 'johnmc190@gmail.com';
const FROM_ADDR = 'feedback@lastcoinstanding.com';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch { return json(400, { ok: false, error: 'bad json' }); }

  // Honeypot: silently accept so bots learn nothing.
  if (body.website) return json(200, { ok: true });

  const page = String(body.page || '').slice(0, 120).replace(/[^\w\-\/\.]/g, '');
  const message = String(body.message || '').trim().slice(0, 2000);
  const email = String(body.email || '').trim().slice(0, 200);
  if (!message || message.length < 3) return json(400, { ok: false, error: 'empty message' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { ok: false, error: 'bad email' });

  if (!env.FEEDBACK) return json(503, { ok: false, error: 'storage not configured' });

  // Rate limit: 5 submissions / hour / IP. IP used transiently for the
  // counter key only — never stored with the submission.
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const ipHash = await sha256(ip + 'lcs-fb');
  const rlKey = `rl:${ipHash}`;
  const count = parseInt((await env.FEEDBACK.get(rlKey)) || '0', 10);
  if (count >= 5) return json(429, { ok: false, error: 'rate limited' });
  await env.FEEDBACK.put(rlKey, String(count + 1), { expirationTtl: 3600 });

  // Turnstile — enforced only when the secret is configured.
  if (env.TURNSTILE_SECRET) {
    const tsOk = await verifyTurnstile(env.TURNSTILE_SECRET, body.turnstile, ip);
    if (!tsOk) return json(403, { ok: false, error: 'verification failed' });
  }

  // Durable archive (source of truth).
  const ts = new Date().toISOString();
  const key = `fb:${ts}:${crypto.randomUUID().slice(0, 8)}`;
  const record = { page, message, email: email || null, ts };
  await env.FEEDBACK.put(key, JSON.stringify(record));

  // Email notification (best-effort; archive already succeeded).
  const dest = env.FEEDBACK_TO || DEST_DEFAULT;
  try {
    if (env.NOTIFY) {
      const raw = buildMime(FROM_ADDR, dest, `[LCS feedback] /${page}`, formatBody(record), email);
      const { EmailMessage } = await import('cloudflare:email');
      await env.NOTIFY.send(new EmailMessage(FROM_ADDR, dest, raw));
    } else if (env.RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'LCS Feedback <onboarding@resend.dev>',
          to: [dest],
          subject: `[LCS feedback] /${page}`,
          text: formatBody(record),
          ...(email ? { reply_to: email } : {}),
        }),
      });
    }
  } catch (e) {
    // Swallow: the submission is safe in KV; email is a convenience layer.
  }

  return json(200, { ok: true });
}

function formatBody(r) {
  return `Page: /${r.page}\nWhen: ${r.ts}\nReply-to: ${r.email || '(none left)'}\n\n${r.message}\n`;
}

function buildMime(from, to, subject, text, replyTo) {
  const headers = [
    `From: LCS Feedback <${from}>`,
    `To: <${to}>`,
    replyTo ? `Reply-To: <${replyTo}>` : null,
    `Subject: ${subject.replace(/[\r\n]/g, ' ')}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@lastcoinstanding.com>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
  ].filter(Boolean);
  return headers.join('\r\n') + '\r\n\r\n' + text;
}

async function verifyTurnstile(secret, token, ip) {
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const d = await r.json();
    return !!d.success;
  } catch { return false; }
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}
