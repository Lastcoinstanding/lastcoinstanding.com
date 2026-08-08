# Open-Source Decision Brief — Last Coin Standing

> **Migrated into the repo 2026-08-08.** Previously a project-only doc under the now-retired `claude/` location prefix; moved to repo root — tracked, alongside `TECH_DEBT.md` and `PAGE_IDEAS_BACKLOG.md` — so it can be read and updated directly in-session. Unreadable project-only copies had drifted (OPEN_ITEMS twice), which is why the split was retired. Everything below is the verbatim authoritative export as of the move; not rewritten. Internal `claude/…` cross-references below are pre-migration paths — the migrated planning docs now live at repo root without the prefix.

_Created 2026-07-23. The one decision gating the grant-anchor path (FUNDING_STRATEGY Path 1).
Decision needed by **~Aug 10** to comfortably make OpenSats' Q3 window (**closes ~Aug 31**; the real
lead-time item is the two reference letters). This brief exists so the call is made deliberately, with
the tradeoffs on the table — not drifted past._

---

## The decision, in one sentence
Whether to publish the site's calculators and educational content under free/open licenses — which
unlocks OpenSats (the most realistic sustained, Bitcoin-native grant income) — using a **bifurcated,
dual-licensed** structure that keeps the brand and commercial optionality intact.

## What OpenSats requires (verified against opensats.org, 2026-07-23)
- Three criteria: **"Good for Bitcoin," "Free and Open-Source," "Transparency & Education."**
- A **"proper open-source license"** — source and materials available to "access, edit, and
  redistribute free of charge and without restrictions." (GPL/MIT for code and CC BY-SA for content
  qualify under FOSS norms; **CC "non-commercial" licenses do NOT** — NC is a restriction.)
- Application: **one page**, well-written and concise; **two reference letters** from recognized peers
  (per the education-wave pattern); global and **nym-friendly**; individuals eligible.
- Reporting: 30-day progress reports for the first three months, then 90-day (missed reports suspend
  funds). General Fund grants are periodic/renewable — education-wave grantees include writers,
  podcasters, and educators, i.e., **your archetype**.

## The fact that reframes the whole decision
**The calculators are already public.** The site is static; every line of calculator JavaScript ships
to every visitor's browser and is readable via view-source today. Open-licensing therefore does **not
disclose anything secret** — it changes only the *legal permission to reuse* what anyone can already
read. The "destroys proprietary IP" framing from the earlier research assumed hidden IP; there is none.
What you'd actually be granting is the right to copy/adapt **with attribution and share-alike strings
attached** — see the license recipe.

## The bifurcation — what opens, what stays yours
**Open (licensed):**
- The exploration/calculator code (page JS, shared modules like `power-law-data.js`).
- The educational content (prose of the explorations), as a body of CC-licensed writing.

**Yours regardless (not touched by any license):**
- The **brand**: the Last Coin Standing name/mark, the domain, the visual identity, the OG/video art.
- The **live operation**: the monthly-refreshed data, the site as served, the traffic, the audience,
  the X presence — the things that actually make the tools worth visiting.
- **Copyright ownership itself** — you license out; you never assign.

## The license recipe (protective + compliant)
- **Code: GPLv3** (copyleft). Anyone may reuse — but derivatives must stay open and carry the license.
  A company **cannot** take your calculators closed/commercial. This *blocks* the freeloading scenario
  people fear, rather than enabling it.
- **Content: CC BY-SA 4.0** (attribution + share-alike). Reuse requires credit and equally-open terms.
- **Dual-licensing preserved:** as sole copyright holder you can *additionally* grant a **separate
  commercial license** to a chosen partner (white-label, AM arrangement) on any terms you like. The
  public copyleft license and a private commercial license coexist — this is standard practice
  (MySQL/Qt model). **The white-label/AM optionality survives open-sourcing.** The only thing you lose
  is the ability to sell *exclusivity* over code the public version already covers — new/future work
  can still be held back or licensed differently.

## What it unlocks
- **OpenSats education track** — the most realistic sustained, Bitcoin-native grant anchor (Goal #1 in
  FUNDING_STRATEGY: grant-funded independence). Renewable; funds people exactly like you.
- **Spiral** (rolling) as a second door.
- **Standing in the culture you're courting.** FOSS is status currency with precisely the community
  that votes on Satos, writes reference letters, reshares charts, and staffs the podcasts. "The site is
  open source" is itself a credibility line in every bio and application.
- **Mission coherence**: diffusion is the stated goal; open licensing is diffusion policy. It also
  strengthens the "verify everything" trust story — the ultimate show-your-work.

## Honest costs
- **Legal clones with attribution** become permitted (they're merely *possible* today). Mitigation is
  structural: clones get a static snapshot that **rots** — your monthly data refresh, live price feeds,
  ongoing new explorations, brand, and audience are the moat, and share-alike keeps clones open and
  attributing. Bridges monetize trust + traffic, not tool-exclusivity (per FUNDING_STRATEGY).
- **Admin**: repo hygiene to publish (README, license headers), then OpenSats' 30/90-day reporting if
  funded.
- **No guarantee**: OpenSats is competitive; open-sourcing is the *ticket*, not the prize. (Though the
  act itself pays the culture-credibility dividend even if a given application misses.)
- **Effectively irreversible**: released versions stay licensed forever (future work can change terms,
  but you can't un-open the past).
- **Reference letters require relationships** — the real critical path, and worth building regardless.

## Recommendation
**Lean yes, via the bifurcation.** The decisive facts: the code is already readable (so the marginal
disclosure is ~zero), copyleft blocks closed commercial clones (so the feared downside is legally
fenced), and dual-licensing preserves the partner/white-label upside. Against that, the unlock is the
single most plausible route to your stated first-choice outcome — grant-funded independence — plus a
durable credibility asset in the exact community your reach plan targets. The genuine remaining costs
(admin, clone-rot-management, irreversibility) are real but modest. **The call is yours** — if the
answer is no or not-yet, nothing is lost but the Q3 window (Q4 opens Oct–Nov).

## If yes — the path to Aug 31
1. **Now → Aug 3:** decide; pick the two **reference-letter** candidates and open those conversations
   (the long pole — respected Bitcoiners who know the work; the X relationship layer's first real ask
   alongside the Satos nomination).
2. **By ~Aug 10:** repo hygiene — LICENSE files (GPLv3 + CC BY-SA), README stating the licensing split,
   publish the repo (or a cleaned mirror).
3. **By ~Aug 20:** one-page proposal (I'll draft it from the Credibility Kit narrative): who you are,
   what the site is, what's now open-licensed, what the grant funds (your time: maintaining and
   extending free, open Bitcoin investment education — new explorations, monthly data refresh, the
   video/education pipeline), impact signals (GA engagement, notable reshares), and the ask.
4. **Before Aug 31:** submit; letters in hand.
