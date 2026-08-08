# SEO Audit & Action Plan — Last Coin Standing

> **Migrated into the repo 2026-08-08.** Previously a project-only doc under the now-retired `claude/` location prefix; moved to repo root — tracked, alongside `TECH_DEBT.md` and `PAGE_IDEAS_BACKLOG.md` — so it can be read and updated directly in-session. Unreadable project-only copies had drifted (OPEN_ITEMS twice), which is why the split was retired. Everything below is the verbatim authoritative export as of the move; not rewritten. Internal `claude/…` cross-references below are pre-migration paths — the migrated planning docs now live at repo root without the prefix.

_Created 2026-07-22. Based on the live site + the project docs (NEW_PAGE_CHECKLIST §10, SITE_GUIDE) +
the July-2026 Google Analytics snapshot. Companion to `REACH_GROWTH_PLAN.md`. **SEO is the
highest-headroom channel:** organic search is near-zero today (~5 users / 84 sessions in the sample)
despite strong content and excellent engagement — so this is greenfield to capture, not broken plumbing
to fix._

**STATUS 2026-07-23: implemented and shipped.** Priorities 1–4 are done — titles/metas live on nine
pages (`d178c7d`), WebApplication schema on all calculators, Retirement FAQ + FAQPage schema live,
Power Law Article schema (`fc6ca03`), Search Console verified, sitemap submitted. See **Open items**
at the bottom for what remains in flight.

---

## The diagnosis — good news, then the real gap
- **Your technical SEO foundation is already strong** — stronger than most independent sites. Per your
  own `NEW_PAGE_CHECKLIST §10`, every page ships with GA4, a self-referential canonical (clean URLs,
  Cloudflare-aware), full Open Graph + Twitter cards, JSON-LD Article/WebPage schema, `sitemap.xml`, and
  even `llms.txt` for AI search. A May-2026 audit already closed the earlier gaps. **This is not a
  "you're missing the basics" situation** — don't waste effort re-plumbing.
- **The real gap is search-intent packaging.** Your titles, meta descriptions, and H1s are written in the
  site's *evocative* voice — "The Bitcoin Retirement," meta "*A scenario laboratory… find your escape
  velocity*." Beautiful for brand; but they contain almost none of the words people actually type into
  Google. There's little for the search engine to match to a query. That's why great content + great
  engagement still produces ~zero organic: the packaging is optimized for **evocation, not discovery.**
- **Engagement proves the content converts** — 4m 25s average, and 9–13% bounce on the tool pages
  (How Much Cash?, Portfolio Allocation). So nearly every additional searcher you capture is likely to
  stick. The only constraint is getting found.

## Reconciling brand voice with search (you don't have to choose)
The evocative names are an asset — keep them. The move is a **hybrid `<title>` tag**: the evocative brand
name *plus* the plain-language question, e.g.

> *The Bitcoin Retirement: How Much Bitcoin Do You Need to Retire? — Last Coin Standing*

The `<title>` tag (what Google shows in results) does the search work; your on-page **H1 can stay the
pure evocative title.** Title tag ≠ H1 — you get to keep both. This is simply your "insights, not
education" retitling idea applied to the head of the page.

## Priority 1 — Measure first: set up Google Search Console ✅ DONE 2026-07-23
Verified (domain property) + sitemap submitted. Performance data begins accumulating from verification;
first meaningful read ~late August.

## Priority 2 — Search-align titles + meta on the flagship pages ✅ SHIPPED (d178c7d)
Nine pages live with hybrid titles (see `SEO_IMPLEMENTATION_PACK.md` for the exact strings and
the how-much-bitcoin vs. allocation-sizing cannibalization split). Later-pass candidates still open:
`/bull-and-bear-cycles`, `/borrowing-against-your-stack`, `/disciplined-rebalancing` (incl. its
pre-existing title/og:title mismatch), `/lump-sum-or-ladder-in`, and the `/the-bitcoin-horizon` retitle
(coordinate with the branding pass).

## Priority 3 — FAQ blocks + FAQPage schema ✅ FIVE PAGES SHIPPED (corrected 2026-07-26)
**This section understated reality until 2026-07-26** — it said only Retirement had shipped and the
other three were "drafted-and-ready… later pass." In fact all of them shipped by hand shortly after
this was written, and nobody updated the line. A build prompt written from the stale status then tried
to add FAQs to pages that already had them, producing duplicate visible blocks and duplicate FAQPage
schema on three indexed pages — caught on a gate and reverted before merge. **Lesson: these project
docs record intent, not repo state; verify against the repo before acting.**

Live today (5 pages): `/the-bitcoin-retirement` (5 Q) · `/discount-or-premium` (4 Q) ·
`/bitcoin-allocation-sizing` (4 Q) · `/wait-or-deploy-now` (3 Q) · `/bitcoin-vs-real-estate` (3 Q).

**SHIPPED 2026-07-26 — the FAQ is now a layout-level component** (branch `faq-component`, merged;
closes rollout step 4 of `FAQ_BLOCKS_AND_SCHEMA.md`, which had never been done). A `faq:`
front-matter array is rendered once as the visible block and once as the FAQPage JSON-LD from a single
source in `base.njk`, so the two can no longer drift — which matters, because migrating
Discount-or-Premium revealed it had been shipping a real mismatch (curly apostrophe in the visible
text, straight in the schema) that nothing would ever have flagged. All five FAQ pages are on the
component, each migrated byte-identically. Documented as STYLE_GUIDE §6.40 and NEW_PAGE_CHECKLIST §10;
§11 gained the Cloudflare deploy gotchas and the byte-identical migration method. Third member of the
layout-level family alongside the related strip and the feedback widget. **Adding an FAQ to any
further page is now a front-matter edit** — the expensive part is writing honest questions, not wiring.

**Cannibalization fix shipped alongside:** Wait-or-Deploy's Q2 ("Is lump sum or dollar-cost averaging
better for bitcoin?") was carrying FAQPage schema on a query `/lump-sum-or-ladder-in` owns in its title
and meta but only in prose. Q2 was reworded onto Wait-or-Deploy's own thesis, leaving the query
uncontested; when the sibling gets its FAQ from the backlog below, that question belongs there.

**FAQ rich results are DEPRECATED (Google, May 2026) — updated 2026-07-27.** The expandable Q&A snippet
no longer exists for anyone, and Google's Rich Results Test **no longer reports `FAQPage`**: testing
`/the-bitcoin-retirement` on 2026-07-26 returned only the WebApplication item, which is correct
behaviour, not a schema fault. Validate FAQ schema at **validator.schema.org** instead.

**This does not weaken the FAQ programme.** The plan never rested on the snippet (see the honest-
expectations note in `FAQ_BLOCKS_AND_SCHEMA.md`). Query matching and reader value are unchanged,
and AI-answer eligibility — structured Q&A being what AI search lifts and cites — is now the dominant
SEO argument rather than a secondary one. It pairs with the existing `llms.txt` and with the
allow-AI-crawling decision in Open Items §3.

_Note: the WebApplication item flags "missing aggregateRating (optional)". Deliberately not fixed —
the only way to satisfy it is to publish a self-declared rating for our own tool, which is dishonest
and contrary to Google's own guidance on self-serving review markup._

**Remaining backfill (open),** highest query-intent first: Bull & Bear Cycles ("bitcoin 4 year cycle"),
Borrowing Against Your Stack, Lump Sum or Ladder In (owns "lump sum vs DCA bitcoin" — keep that query
off Wait-or-Deploy), The Power Law, Bitcoin vs. The Stock Market, How Much Bitcoin?, How Much Cash?,
the Stress Test, Disciplined Rebalancing, Bitcoin-Backed Mortgages. Conceptual pages and hubs are
deliberately excluded — low query intent, and an FAQ on an essay reads as furniture.

## Priority 4 — WebApplication schema on calculator pages ✅ SHIPPED
All calculator pages now carry WebApplication JSON-LD (eight added; the five newest already had it).
Power Law additionally gained Article schema with git-history datePublished 2026-04-18 (`fc6ca03`).

## Priority 5 — Keyword-aware headings + anchor text (light) — OPEN
Add the plain-language question as an early H2 on flagship pages where natural; descriptive anchor text
in `related:` cross-links. Low urgency; fold into future page work.

## Honest expectations + how SEO fits with X
SEO compounds over **months**, not days — it's the long-term, near-passive base, not an instant lever.
X stays your near-term engine (the GA data proves it: t.co + x.com dominate your referrals). The way to
hold it: **X brings the spikes now; SEO builds the floor that keeps rising underneath them.**

---

## Open items (as of 2026-07-23)

1. **Sitemap "Couldn't fetch" — recheck ~Jul 26.** Submission (Jul 23) shows "Couldn't fetch" with empty
   Last-read — the classic fresh-property display quirk; the sitemap itself verified healthy from
   outside (200, `application/xml`, 62 URLs). If not "Success" by ~Jul 26, resubmit once. _(Reminder
   scheduled in-session for Jul 26.)_
2. **robots.txt defect — fix in flight (Claude Code).** `/robots.txt` currently returns Cloudflare's
   managed content-signals block **plus a full HTML page appended** (no real robots.txt exists in the
   repo; the clean-URL fallback serves HTML for the path, and Cloudflare prepends to it). Fix: commit a
   static `robots.txt` (User-agent: * / Allow: / / `Sitemap:` directive) + passthrough registration.
3. **AI-crawler policy — DECIDED 2026-07-23 (JM): ALLOW AI crawling.** Cloudflare's default was blocking
   training crawlers (GPTBot, ClaudeBot, CCBot, Google-Extended, Bytespider, Amazonbot,
   meta-externalagent) via managed robots.txt with "search=yes, ai-train=no." JM's call: allow — the
   mission is diffusion of free education, reach is the bottleneck, and training-set inclusion spreads
   the site's arguments; consistent with the `llms.txt` AI-search strategy. Action: flip the toggle in
   Cloudflare **AI Crawl Control** (dash.cloudflare.com → lastcoinstanding.com zone → AI Crawl Control;
   older UI: Security → Bots → "Block AI bots"), and disable the managed-robots.txt injection there if
   offered. Verify afterward: the per-bot `Disallow: /` entries disappear from the served robots.txt.
4. **Performance re-tune — late August.** Read Search Console Performance (~4–6 weeks of data); re-tune
   the two or three pages where impressions climb but clicks lag; ship the later-pass titles + remaining
   FAQ blocks in the same pass.
