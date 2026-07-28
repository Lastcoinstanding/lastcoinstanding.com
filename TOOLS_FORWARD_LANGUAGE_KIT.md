# Language Kit + Build Prompt — Tools-Forward Repositioning (Homepage / About / Meta)

_Created 2026-07-28 (JM + drafting chat). Executes the on-page half of the backlog item
"Reframe the site's purpose from 'education' toward 'insights / tools / toolbox'" (the SEO
title pass of 2026-07 already did the head-of-page half). Decisions locked with JM this date:
tools-forward NOW, but "education" language deliberately RETAINED until the OpenSats
education-track application is submitted (~Aug 31) — the site's self-description and the
application must agree while reviewers may be looking. A deeper education-language pass is a
separate, later decision (post-submission)._

---

## Part 1 — The language kit (final strings)

### 1. Homepage hero
- **H1 / hero line:** `Interactive tools to see Bitcoin clearly.`
- **Hero subline:** `Free, live-computed, every assumption stated — for Bitcoiners, and for
  the Bitcoin-curious still deciding.`
  - ("Bitcoin-curious" is JM's term of art — keep exactly; it names a real audience segment
    and recurs in JM's own voice across channels.)

### 2. About page
- **Mission heading:** `Building for Bitcoin.`
  - Deliberately "for," not "on" — the site doesn't build on-chain and doesn't claim to.
    If a sentence near the heading explains the mission, it may make this explicit in one
    clause (honesty-as-positioning), e.g.: `Not building on Bitcoin's rails — building for
    Bitcoin's case: tools anyone can use to test it.`
- **Education-as-integrity line (RETAINED, per JM):** keep the About page's education
  framing, adding or adapting toward: `Call it education if you like — we call it showing
  our work. Every number on this site can be checked, every assumption changed, every
  conclusion re-derived by you.`
- **Audience line (if the About page carries one):** `For Bitcoiners, and for the
  Bitcoin-curious. Come skeptical — check the numbers yourself.`

### 3. Site-wide meta / OG descriptors
- **Default/site og:description + meta description pattern:**
  `Free interactive Bitcoin tools & explorations — retirement, allocation, valuation, and
  more. Live-computed, every assumption stated.`
- Apply to: homepage meta description + og:description, the site-level default description
  (base layout fallback if one exists), and the About page's own meta. Do NOT touch
  per-exploration page descriptions (those were tuned in the 2026-07 SEO pass).

### 4. Footer / small descriptors
- Where the footer (or any shared chrome) carries a one-line site descriptor, align to:
  `Interactive Bitcoin tools & explorations — free, open, verifiable.`
- The word "education" is not purged anywhere it currently appears in body copy; this pass
  changes the *lead* framing only.

### Register rules for any judgment calls during the port
- No conversion language ("turn," "convince," "orange-pill") in on-site copy — invitation
  register only ("come skeptical," "check it yourself"). "Normie" never appears on-site.
- No superlatives or hype (POSITIONING §1.5). The tools claim is demonstrated by the
  constellation of calculators, not asserted with adjectives.

---

## Part 2 — Code-tab build prompt (paste below into Claude Code after the STRC PR clears)

You are making a small, coordinated copy pass on lastcoinstanding.com. Branch:
`copy/tools-forward-repositioning`. This pass changes homepage hero, About-page framing, and
site-level meta descriptors ONLY, per the language kit in Part 1 of
`TOOLS_FORWARD_LANGUAGE_KIT.md` (JM: save this file to repo root first).

Steps:
1. Read the kit (Part 1) — the strings are final; your job is placement fidelity, not
   copywriting. Read the current homepage + About templates and identify the elements that
   correspond to each kit item (hero H1, hero subline, About mission heading, About
   education paragraph, meta/og descriptions, footer descriptor).
2. Make the swaps. Follow STYLE_GUIDE hero conventions (Cormorant for H1/hero display,
   subtitle max-width constraints). Where the kit adds a line that has no current
   equivalent (e.g., the audience line), place it where the About page's structure
   naturally accommodates it — do not restructure the page.
3. Scope fences — do NOT: rename nav buckets or categories, touch explorations.json,
   change any per-exploration page's title/meta (SEO-pass work, already tuned), remove the
   word "education" from body copy anywhere, or bundle the audience-toggle idea.
4. This change touches SEO/social metadata and shared chrome → per SITE_GUIDE §0.1 this is
   a preview-first exception. Open a PR with before/after strings listed in the summary;
   do NOT merge. JM reviews rendered preview + validates the OG description on the social
   validator, then merges.
5. Post-merge checks (JM or follow-up): the four curl greps from NEW_PAGE_CHECKLIST §10 on
   homepage + About; social-card re-scrape for both URLs.

Commit message: `copy(positioning): tools-forward hero/about/meta — education retained
(pre-OpenSats posture) — per TOOLS_FORWARD_LANGUAGE_KIT.md`

---

## Follow-ups deliberately NOT in this pass (tracked in backlog)
- Deeper education-language decision — revisit after OpenSats submission (~Sep).
- Audience bifurcation / toggle (separate IA effort).
- "Arguments → Philosophy" nav rename (separate, flagged uncertain).
- Key-insights call-out component (separate content-treatment pass; pairs with this
  repositioning but ships on its own).
