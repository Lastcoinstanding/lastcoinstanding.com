# FEEDBACK WIDGET — ONE-TIME SETUP (JM, ~10 minutes)

The widget is live on the trial page but submissions will show the friendly
failure state until step 1 is done. Steps 1–2 make it fully work; step 3 is
optional hardening.

## 1. KV namespace (required — the archive + rate limiter)

1. Cloudflare dashboard → **Workers & Pages → KV** → *Create a namespace* → name it `FEEDBACK`.
2. **Workers & Pages → [the lastcoinstanding.com Pages project] → Settings → Functions → KV namespace bindings** → *Add binding*:
   - Variable name: `FEEDBACK`
   - KV namespace: the one you just created.
3. Redeploy (Deployments → ⋯ on latest → *Retry deployment*) so the binding takes effect.

After this step the widget works end-to-end: every submission is stored
durably. Email notification needs step 2; until then you'd read submissions
in the KV browser (Workers & Pages → KV → FEEDBACK → *View*).

## 2. Email notification (pick ONE path)

**Path A — Cloudflare Email Routing (preferred, same vendor, free):**
1. Dashboard → the **lastcoinstanding.com zone → Email → Email Routing** → enable.
2. *Destination addresses* → add `johnmc190@gmail.com` → click the verification link Cloudflare emails you.
3. Back in the **Pages project → Settings → Functions**: look for a **Send email** (Email) binding option. If present: add it, variable name `NOTIFY`, destination = the verified address. Redeploy.
4. **If the Pages UI has no email binding option** (this is the one piece I couldn't verify from here): use Path B — the function automatically falls back.

**Path B — Resend (2-minute fallback):**
1. Sign up at resend.com **with johnmc190@gmail.com** (matters: their free no-domain tier only delivers to the account owner's own address — exactly our use case).
2. Create an API key → Pages project → **Settings → Environment variables** → add `RESEND_KEY` = the key (Production). Redeploy.

## 3. Turnstile (optional anti-bot — can be added any time, zero code changes)

1. Dashboard → **Turnstile** → *Add site* → domain `lastcoinstanding.com`, widget mode **Managed**.
2. Copy the **Secret key** → Pages project → Settings → Environment variables → add `TURNSTILE_SECRET`. Redeploy.
3. Tell Claude the **Site key** — the widget markup needs it added (one small commit) so browsers can fetch a token. Until both halves exist, the function simply skips Turnstile (honeypot + rate limit still protect the form).

## What the function does (for reference)

honeypot → validation (2,000-char cap, email syntax) → rate limit (5/hour/IP;
IP hashed transiently for the counter, never stored with submissions) →
optional Turnstile → KV archive (`fb:<timestamp>:<id>`) → email notify
(best-effort; KV is the source of truth).

Stored per submission: page slug, message, optional reply email, timestamp.
Nothing else. Nothing is ever published.

## Rollout flip (after JM approves the trial page)

In `src/_includes/layouts/base.njk`, change the gate from
`{% if feedback %}` to `{% if slug and feedback != false %}` — every
exploration page gets the widget; `feedback: false` opts a page out.
Claude handles this plus the docs pass (SITE_GUIDE / STYLE_GUIDE /
NEW_PAGE_CHECKLIST) at rollout.
