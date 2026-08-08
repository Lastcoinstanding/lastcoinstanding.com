# Reach & Growth Plan — Last Coin Standing

> **Migrated into the repo 2026-08-08.** Previously a project-only doc under the now-retired `claude/` location prefix; moved to repo root — tracked, alongside `TECH_DEBT.md` and `PAGE_IDEAS_BACKLOG.md` — so it can be read and updated directly in-session. Unreadable project-only copies had drifted (OPEN_ITEMS twice), which is why the split was retired. Everything below is the verbatim authoritative export as of the move; not rewritten. Internal `claude/…` cross-references below are pre-migration paths — the migrated planning docs now live at repo root without the prefix.

_Created 2026-07-22. Companion to `FUNDING_STRATEGY.md`. The reach workstream is the
highest-leverage thing on the whole roadmap, because **reach is the hinge** that converts the
low-traffic-friendly grant runway (now) into traffic-dependent bridge revenue (later)._

---

## Why reach is the whole game — the sequencing (JM, 2026-07-22)
- **Grants (OpenSats/Spiral) are merit- and mission-judged, not traffic-gated** → they can fund the work
  **now**, at low traffic.
- **The bridge model is pure top-of-funnel** → its revenue scales, roughly linearly, with traffic → it
  only pays off **later**, once reach exists.
- So the two funding paths are a **sequence, not a choice**: grants + Geyser/V4V fund the runway while you
  build reach; reach then unlocks bridges (and bigger crowdfunding, and the audience that wins a Satos
  vote). **Everything downstream is gated by reach — so building it deliberately is priority #1.**

## The operating principle: create once, distribute everywhere
Your scarce resource is time, not material — the rigorous pages already exist. Every reach activity should
be a **repurposing** of existing work, never net-new content. One exploration → one video → several short
clips → one article → several social posts. Build this as a **pipeline**, so a single hour of "new" work
(filming one page) yields a week of distribution.

## The content engine: the YouTube series (your idea, sharpened)
The core concept — one ~10-minute video per exploration, walking through it and demoing the calculator — is
right and evergreen. Refinements that make it work:

- **Let the interactivity carry it.** Screen-share the *live tool* and drive it — watching the numbers
  move as you change an input is the content. Talking-head is optional; the moving chart is the hook.
- **Lead with the insight, not the setup.** First ~15 seconds must state the surprising payoff, e.g.
  *"Bitcoin trading below trend isn't a loss — it's a ~55% CAGR waiting to happen, and here's the math."*
  This is the same "key-insight call-out" discipline already in your backlog, applied to video.
- **Title as an insight or a question people actually search.** *"Is Bitcoin's volatility actually risk?"*,
  *"What would $20k in Bitcoin be worth at retirement?"* — curiosity + searchability. (Ties to the
  retitling-as-insights backlog idea; YouTube is the #2 search engine, so question-titled evergreen videos
  keep earning views for years.)
- **Group into playlists by theme** — Retirement, Real Estate, Valuation/Power-Law, Risk — mirroring the
  "flagship focus areas" backlog idea. Playlists build binge-watching and topical authority.
- **Cadence: batch a "season," publish on a steady drumbeat.** Film 4–6 at once, release weekly or
  bi-weekly. Consistency beats frequency and beats production polish — the algorithm and the audience both
  reward a reliable schedule far more than occasional high-gloss.
- **Keep the production bar low early.** Clean screen capture + a decent mic + a tight edit is enough.
  Don't over-invest before you know which topics resonate; let the data tell you where to spend effort.
- **CTA is "go try it yourself," not "buy."** Every video sends viewers to the live tool on your site —
  that *is* the reach flywheel. Support asks (Geyser/V4V) come later and stay soft, consistent with the
  no-funnel brand.
- **Embed each video back on its page.** Cross-pollination: the page boosts the video, the video boosts the
  page's dwell time and SEO. Two-way lift for one asset.

## The distribution flywheel: one video → many assets
- **2–3 short vertical clips** per video (YouTube Shorts / X / Nostr) — the "watch the number move" moments
  are ideal short-form. Shorts are the cheapest new-audience discovery you have.
- **One Substack/article per exploration** — the video script *is* the draft; embed the video. (Your
  backlog's Substack-per-page idea.)
- **X + Nostr posts** — the key chart + the one-line insight, native (not just a link), pointing to the
  tool. Your live-computed charts are inherently screenshot-worthy.

## Complementary channels, ranked by leverage-for-effort
1. **SEO / organic search — highest leverage, compounding, mostly one-time.** Your pages are data-rich,
   evergreen, and answer real queries ("bitcoin vs real estate," "how much bitcoin to retire"). This is the
   quietest but most durable channel — optimize titles/meta, target real questions, make sure the tools and
   their shareable-scenario URLs are indexable. Underrated precisely because it isn't a "post."
2. **X + Nostr — daily distribution AND the relationship layer.** Where Bitcoiners are. Build in public,
   post charts natively, engage genuinely with the accounts you already follow. This doubles as how you
   cultivate the peer relationships that later drive Satos nominations, OpenSats reference letters, podcast
   invites, and bridge-partner intros — so it pays into funding and recognition, not just traffic.
3. **Shareable charts / borrowed audience.** Your rigor + original live-computed visuals are exactly what
   larger accounts screenshot and reshare (River's bear-market table is the pattern). Make charts branded,
   embeddable, and deep-linkable so *others* spread them — this is how niche rigor travels without a big
   following of your own.
4. **Guest podcast appearances.** Borrow established audiences, and simultaneously build the verifiable
   track record that earns a b.tc conference speaking slot (see FUNDING_STRATEGY recognition section).
5. **Substack + email capture — ✅ LIVE (2026-08-05).** The owned audience you're not renting from an
   algorithm. Shipped Substack-first: site-wide "Get Updates" block
   (`src/_includes/components/get-updates.njk`, merge `b5d4b4f`) above the feedback widget on every
   slugged page, prominent after-hero placement on the homepage; links out to the Substack subscribe
   page with `utm_source=site` — no iframe, no third-party scripts, honest update-only copy ("No funnel,
   nothing for sale, unsubscribe anytime"). Native-list upgrade path stays deferred in the backlog.
   The capture surface now exists at zero marginal cost; channel priority unchanged (Substack *content*
   cadence remains Phase 2 — the flywheel's article step feeds it when it starts).
6. **Communities (r/Bitcoin, Stacker News, BitcoinTalk).** Where your tools would be genuinely appreciated —
   but observe self-promo norms; lead with usefulness, not links.

## Don't boil the ocean — pick three
For a solo operator: **YouTube (the engine) + X/Nostr (distribution & relationships) + SEO (the passive
compounding base).** Everything else (Substack content cadence, podcasts, communities) is Phase 2. Three
channels done consistently beats six done sporadically. (The email-capture *surface* shipped early —
2026-08-05, see #5 — because it was near-zero effort and every future channel benefits from it; that
doesn't move Substack's Phase-2 slot as a content channel.)

## The Creator Credibility Kit (the assets this workstream runs on)
These are the reusable assets — build once, use across YouTube, Geyser, a Satos nomination, and any partner
conversation:
- **Narrative one-pager** — drafted, in the site's voice (see FUNDING_STRATEGY.md).
- **Portfolio + reach/metrics one-pager** — best tools/pages + current traffic/engagement (honest baseline;
  it only goes up from here).
- **Channel identity** — name, handle, and visual treatment consistent with the site's brand.
- **A short trailer / "about" video** — who you are and what the channel does, in 60–90 seconds.
- **Payout rails** — a Lightning address and a Nostr profile (both required for Geyser + V4V anyway).

## Metrics that matter (not vanity)
Track the **funnel**, not subscriber count: video views → site visits → tool engagement → returning
visitors / email signups / Geyser backers. Reach only counts if it converts to people *using the tools* —
that's what OpenSats calls "impact," what Geyser backers respond to, and what makes bridges viable later.
(Email signups just became measurable: Substack's subscriber dashboard + `utm_source=site` attribution.)

## Immediate next steps
1. **Lock channel identity + payout rails** (part of the Kit).
2. **Pick the first 3–4 explorations to film** — lead with the flagships (Retirement, Real Estate, and the
   Power-Law/CAGR "priced at a discount" insight — a strong, surprising hook).
3. **Set a sustainable cadence** — batch a season of 4–6, publish weekly or bi-weekly.
4. **Stand up the repurposing pipeline** (video → shorts → post → article) so distribution is near-free.
5. **Do a one-time SEO pass** on the existing pages in parallel — compounding, low ongoing effort.
6. **Begin the relationship layer** on X/Nostr — genuine engagement, not cold outreach; it feeds reach,
   funding, and recognition at once.
