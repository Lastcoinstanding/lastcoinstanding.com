# Site Guide

_A working reference for the editorial voice, visual vocabulary, and technical patterns that define Last Coin Standing. Consult this before adding new content, and update it whenever a decision crystallizes into a principle worth preserving._

_For typography, color tokens, component recipes, and visual anti-patterns, see the companion **`STYLE_GUIDE.md`** at repo root. The Site Guide owns voice, content, and technical architecture; the Style Guide owns visual implementation details._

_For runnable procedures, two checklists at repo root: **`NEW_PAGE_CHECKLIST.md`** for everything that needs to land when a new exploration page ships (nav entries, sitemap, social cards, cross-links, docs); **`MONTHLY_REFRESH_CHECKLIST.md`** for recurring time-sensitive maintenance (TODAY constants, as-of dates, chart freshness captions). Open these when shipping or maintaining; the guides above are reference, the checklists are protocol._

---

## 0. How work moves to production (standing workflow — do not re-negotiate)

This site is built across two kinds of Claude session. They have fixed,
non-overlapping roles. Every page follows the same path; there is nothing to
decide fresh each time. (Mechanical build steps live in `NEW_PAGE_CHECKLIST`;
this section governs WHO does WHAT and HOW handoff happens.)

### The two roles

**1. The research/drafting chat (claude.ai, with project knowledge + web + tools).**
Does everything that does NOT touch the repo: research, data pulls, fact-checking
and primary-source verification, drafting page content, building the design/
interactive as a standalone HTML mockup, writing the verified-claims register and
source ledger, and producing the **Code-tab build prompt** (below). It CANNOT push
to the repo, click inside GitHub/Cloudflare, or place binary files — and does not
try to. It hands off via a prompt + draft files.

**2. The Claude Code tab (local clone, authenticated to GitHub).**
Does everything that DOES touch the repo: porting the mockup into the `.njk` +
`_pageassets` template structure, running `NEW_PAGE_CHECKLIST`, committing on a
branch, opening the PR, merging to main. JM is authenticated here; this is the
only path that can push. Cloudflare auto-deploys on merge to main.

### The handoff artifact

The drafting chat produces a **Code-tab build prompt** — a single pasteable block
instructing Claude Code to build and ship the page per `NEW_PAGE_CHECKLIST` and the
relevant sibling-page conventions. JM pastes it into the Code tab; Claude Code
executes; JM reviews the PR and merges. This prompt-handoff is the standard
mechanism for EVERY page. (Do not invent per-conversation alternatives like
browser automation, GitHub-API-from-chat, or asking JM to hand-edit — those are
the legacy/hot-fix exceptions documented in `NEW_PAGE_CHECKLIST`, not the default.)

### JM's role at the boundary

JM is the bridge: pastes the prompt into the Code tab, screenshots Code-tab output
back to the drafting chat if verification is needed there, performs the authenticated
push/merge, and does the ~2-minute live verification (OG card curl, page load,
social-card validator) after deploy. The drafting chat verifies results by reading
the public repo (`raw.githubusercontent.com`) and the live URL — it does not need
to see inside the Code tab except via JM's screenshots.

### One-line summary

**Drafting chat researches, verifies, drafts, and writes the build prompt → JM
pastes it into Claude Code → Claude Code builds, PRs, and (on merge) deploys → JM
verifies live.** Every page. No renegotiation.

### Legacy/exception mechanisms (NOT the default)

Direct GitHub-API commits from a chat (PAT-based) remain documented for hot-fixes
when no local checkout is at hand — see the "Direct GitHub-API commits" note in
`NEW_PAGE_CHECKLIST`. Use only for small urgent fixes, never as the page-build path.

## 0.1 Direct-to-production by default (standing policy)

The site currently gets low traffic, so the cost of a bad deploy is small and
quickly correctable. Accordingly, the **default** is to push merged PRs straight
to `main` (production) and verify on the live page — NOT to gate on a Cloudflare
preview or local build first. Seeing the change in production and noting any issue
there is the preferred, faster path. Do not ask JM to eyeball a preview before
merging unless one of the exceptions below applies.

### Always required, even on the fast path

Pushing direct does NOT mean skipping verification. After every production deploy,
run the post-deploy checks and report results:
- The relevant `curl -I` on any new/changed static asset (OG image, video, data
  file) — confirm `Content-Type` is correct, NOT `text/html`. (The phantom-200
  silent-failure mode — Cloudflare serving an HTML fallback at 200 for a missing
  asset — is the single most recurrent launch bug on this site; see `TECH_DEBT`.
  It is invisible on the page and only a curl catches it.)
- For a page change: load the live URL and confirm the specific changed behavior
  renders.
- For SEO/schema changes: the four `curl … | grep` checks (gtag, canonical,
  og:image, ld+json) from `NEW_PAGE_CHECKLIST` §10.

### Preview-first exceptions (the only times to gate before merge)

Push direct EXCEPT when the change can fail invisibly or affect pages beyond the
one being edited. Preview first (or at minimum verify with extra care) when the
change:
1. **Touches a shared template / layout / global include** (`base.njk`,
   `related.njk`, nav, anything under `_includes` used by multiple pages) — a
   regression here breaks pages you won't think to check.
2. **Affects SEO/structured-data/social metadata** — failures are invisible on the
   rendered page and surface only in crawlers/validators.
3. **Introduces a new static asset referenced in head/meta** (OG image, etc.) —
   the phantom-200 risk; verify the asset serves before relying on it.
4. **Is a large structural refactor** where a build error would take the page down
   entirely rather than degrade gracefully.

For everything else — copy edits, single-page content, a self-contained interactive
tweak, a new page that doesn't touch shared chrome — push direct and verify live.

### One-line summary

**Default: merge to production, then verify live (always run the asset curls).
Preview first only for shared-template, SEO/meta, new-head-asset, or
take-the-site-down-if-it-breaks changes.**

---

## 1. Editorial posture

Last Coin Standing is a **statement piece and an investment-education resource — never a monetization funnel**. Its purpose is to explain Bitcoin structurally — through contrast and clarity — so that a thoughtful reader can understand what Bitcoin is by seeing what everything else isn't, and (for some readers) can satisfy themselves that a considered Bitcoin allocation is sound. It earns understanding and allocation decisions through rigor a skeptic can check, never through hype or urgency. See **`POSITIONING_STRATEGY_GUIDE.md`** for the full framing — including the authoritative statement of intent (§1.5) and the no-embellishment principle that governs every tool and page.

The voice is **restrained, declarative, and serious**, with quiet purpose and intent. The site earns the right to make structural claims ("for eternity," "impervious," "irreducible") through the seriousness of everything else on the page. It never overclaims, but it also doesn't hedge on what it actually believes.

Tone the site reaches for: elegiac seriousness. Tone the site avoids: maximalist marketing.

**Who the site is for, and values as positioning:** the site serves two audiences — Bitcoiners (who want live-computed proof and no hand-waving) and newcomers ("normies," who need an intuitive on-ramp before rigor) — plus a third reader, the prospective asset-management partner evaluating the site's credibility. The honesty guardrails (show the work, disclose limitations, never let the optimistic lens overstate, no funnel mechanics) are not just ethics but the site's competitive positioning. Full detail in `POSITIONING_STRATEGY_GUIDE.md` §2 (audiences) and §3 (values as positioning).

### Denomination: USD is canonical

All dollar figures throughout the site are in USD, intentionally. The full editorial reasoning lives on the About page at `/about.html#why-usd`; the short version for engineering and editorial decisions:

1. **Bitcoin trades primarily against USD.** Order books, historical record, and the Power Law fit are all USD-anchored. Projecting bitcoin's path in any other currency means *also* projecting that currency against USD for the same horizon — adding uncertainty without adding precision.
2. **USD is the conservative presentation for non-US readers.** For audiences in countries with currencies devaluing faster than USD (which is most of the world), their bitcoin's local purchasing power will grow *faster* than what these numbers show. Converting at today's spot rate would understate, not overstate, bitcoin's case.
3. **Editorial register matters.** A currency selector on a calculator subtly reframes the site from "essays with interactive support" to "financial product." That trade isn't worth making for a marginal-utility feature.

This decision was made 2026-05-22 after reconsidering a planned multi-currency feature. Calculator pages include a small italic footnote (`.usd-footnote`, defined in `base.njk`) just above each in-page share section, linking to `/about.html#why-usd`. The link is editorial-tier — addresses non-US readers without disrupting US-reader flow. Future calculator pages with prominent dollar figures should adopt the same footnote.

## 2. Core arguments the site makes

- **Bitcoin is a discovery more than an invention.** The design space is narrow; any change to the synthesis degrades it. This is why no "better Bitcoin" has ever emerged.
- **Bitcoin is a category of thing, not a better version of fiat.** Bearer asset, no counterparty, absolute scarcity. Fiat is a promise; Bitcoin simply is.
- **Fiat decay is asymptotic, not catastrophic.** Purchasing power halves continuously at a structural rate. The argument is a curve, not a crisis.
- **Holding cash is an active decision, not the absence of one.** Omission bias obscures this; the site names it directly.
- **Structural forces over individual agency.** The migration is underway; participation matters; inevitability is not claimed.

## 3. Copy register

### Preferred structure for standalone hooks (carousel, page subtitles, callouts)

A **three-beat minimalist pattern**:

1. **Label** — the concept name (e.g., "The Half-Life")
2. **Headline** — a single declarative sentence that does philosophical work, not description. Under fifteen words. Pairs with the visual rather than repeating it.
3. **CTA** — invites the page's *specific actual interaction*, not a generic "learn more." Example: "Try removing one →" works only because the Synthesis page lets users remove components and watch what collapses.

### Headline test

A good headline for this site can be read twice and each read yields more than the last. The second read rewards attention. Examples worth studying:

- *"A thing isn't a bubble simply because it has been called one."*
- *"Some problems are navigated, not solved."*
- *"From what can't be fixed, to what can't be broken."*
- *"Two systems. Different roots. One outcome."*

### CTA test

Can a reader who taps this CTA actually *do what it promises*? "Calculate the melt" works because the page has a calculator. "Try removing one" works because components are removable. Generic CTAs ("Learn more," "Read the essay") should be resisted unless the page really is just an essay.

## 4. Vocabulary

### Words worth preserving — these are the site's

- **Impervious** — the unifying adjective for Bitcoin's quality. It does not resist the forces acting on others; it is simply not subject to them.
- **Asymptotic** — the shape of fiat decay. Halving forever, never quite zero.
- **Lawful** — decay that follows structural rules rather than turbulent events.
- **Residue** — what remains when form is gone but material persists (melted ice in its own puddle; fiat nominal value without purchasing power).
- **Structural** — the site's preferred alternative to "fundamental" or "systemic."
- **Synthesis** — Bitcoin as the coherent combination of components, rather than any single component.
- **Revealed by attention** — the idea that careful observation uncovers category differences invisible to casual glance.
- **Irreducible** — something that cannot be decomposed without ceasing to be itself.
- **Undiluted** — the preferred alternative to "fixed" when describing Bitcoin's share property.

### Words and framings to avoid

- **"Crypto"** as shorthand for cryptography or for Bitcoin. Bitcoin is Bitcoin; cryptography is cryptography.
- **"Fixed"** in descriptions of Bitcoin's supply property — the word implies limitation. "Undiluted," "permanent," "impervious" carry the right connotation. (The "Fixed Pie" concept name is slated for a future rename pass.)
- **Investment framing** — "price target," "will go up," "buy now." The site argues structurally, not speculatively.
- **Collapse rhetoric** — "fiat will collapse," "the crash is coming." Asymptotic decay is a stronger, more defensible argument.
- **Maximalist triumph** — "Bitcoin wins," "fiat loses." The site observes; it does not cheer.
- **"The direction is already settled"** or other inevitabilist claims that remove reader agency.
- **"Breakthroughs"** applied to Bitcoin's individual components — none is a breakthrough alone; the synthesis is the breakthrough.
- **"Properties"** applied to Bitcoin's Synthesis components specifically — the word is reserved for "properties of sound money" (divisible, scarce, verifiable, portable, fungible, durable), which is a different list. The six Synthesis elements are **components**, **insights**, or **inventions**.

## 5. Visual vocabulary

### Palette

- **Amber-bronze** is the house color, used for both fiat-diagnosis and Bitcoin-argument slides — it is the register of the whole artifact, not a Bitcoin-coded signal.
- **Dark background** (`#0a0908`). Film grain and ember-particle atmosphere throughout.
- **Accent orange** `#e09422` for active/interactive elements.
- Cool tones (blue, gray, green) are used sparingly and only where philosophically necessary; they read off-register if used decoratively.

### Warm / cool camp semantics (from WMHTB state system)

When visually encoding a spectrum of monies or states, **warmth is earned by structural soundness; coolness signals captured or failing monies.** The WMHTB page encodes this explicitly across four states:

- **Resonant** (Bitcoin): warm orange `#F7931A` — animated, pulsing, alive
- **Depleted** (Gold): warm umber `#a06a28` — static, dim, honorable
- **Decaying** (USD): cool slate `#6a7580` — static, off-register
- **Dying** (Hyperinflating fiat): darker slate `#454550` — broken coupling, dashed lines

The **warm/cool boundary sits between Gold and USD** — not between Bitcoin and everything else. This is a philosophically loaded choice: commodity money (gold), even when impractical, retains the register; fiat money, once unmoored, does not. Preserve this boundary in any future state-based visualization.

### Compositional principles

- **Unmarked objects carry arguments.** No Bitcoin logos on coins. No signage on houses. No ornamentation on the persistent/central subject. Structural facts don't need labels.
- **Fixed camera for decay arcs.** The object changes, not the framing. Zoom-out masquerading as shrinkage is a failure mode.
- **Latent-state openings.** Frame zero should already contain hints of what's about to unfold. Seeds of order in dark (Bitcoin slides); seeds of imperfection in beauty (fiat slides). Transitions are recognitions, not impositions.
- **Asymmetric, off-center compositions** over symmetric staged ones. "Found" over "arranged." Weathered surfaces over clean plates.
- **Residue as argument.** Fiat decay ends in diminished form, not vanishing. The flame persists tiny; the ice persists as puddle; the coins dissolve without trace but the bearer-asset remains. The shape of the ending matters.

### Tonal camps for videos and illustrations

- **Fiat-diagnosis decay** — beauty → decay arc. Golden hour to dusk. Candle to ember. Ice to puddle. Asymptotic pacing: 9s active decay, 1s held diminished state.
- **Bitcoin-argument emergence** — darkness → order arc. Crystal reveal. Door opening. Six keys cohering.
- **Structural observation** — stable disequilibrium. Trilemma counterweights in permanent unresolved tension. Persistence-amid-flux.

### The "impervious" signature

Three slides (Fixed Pie, Money Trees' right tree, Is Bitcoin a Bubble) share the same editorial move: *Bitcoin persists unchanged while things around it decay, fail, or reveal themselves as a different category.* Across the carousel, this repetition accumulates persuasive weight without feeling redundant because the metaphors differ. If adding a new slide, consider whether it extends or departs from this signature — both are legitimate choices, but it should be intentional.

### Aesthetic registers to avoid

- **Product photography / studio staging.** Clean plates, even lighting, centered symmetry. The site's visuals are atmospheric and lived-in, not e-commerce.
- **Sci-fi energy-orb aesthetic.** Glowing throbbing central objects read as fantasy, not structural argument.
- **Triumph cinematography.** Light bursts, camera pushes, climactic reveals. The site's register is quiet continuation, not resolution.

## 6. Prompt-craft patterns (for generative video with Grok)

- **16:9 widescreen, 10 seconds, 720p, silent.** Silent means both (a) prompt instruction "no audio component required; video-only" and (b) post-hoc `ffmpeg -c:v copy -an` strip.
- **9s active transition + 1s held tail.** Clean loop when start and end states are near-identical (Bitcoin-argument), held final state when the argument has resolved (decay).
- **Explicit negation for strong priors.** When Grok's defaults fight your instruction, negate directly: "does not extinguish," "do not show more than six keys," "not an opaque orange ball." Positive specification alone often isn't enough.
- **"Nothing random or by chance."** Decay and transitions should read as lawful, not turbulent. No wind events, no magic, no storm of leaves — just structural process visible on an observable curve.
- **Persistent objects do not grow, glow, or triumph.** Bitcoin's persistence is continuation of what it already was, not victory over what failed.
- **"Not X; Y"** as a prompt pattern. "Not six things that unlock something else, but six things whose combination is itself the thing." Explicit framing of what the composition is not helps steer Grok away from generic interpretations.
- **Unprompted Grok choices often do philosophical work.** First question for unexpected visual elements is *what is it arguing*, not *should I remove it*.
- **Comparison metaphors: prefer living elements over industrial ones.** When the slide's argument is *"three things behave differently under the same conditions"* (the canonical pattern for any *bitcoin vs X* comparison page), choose three trees, three plants, three flames, three streams — not three vessels, three lanterns, three instruments. The site's tonal grammar (golden hour, weathered surfaces, found-not-arranged, lived-in) already lives in the natural-element register; industrial elements fight that voice even when the metaphor is mechanically right. **Single-element-with-different-states** ("this tree grows more than that tree") is also more reliable than **multi-element-with-different-behaviors** ("this vessel fills at a different rhythm than that vessel") — Grok handles the former easily because it's a familiar pattern from time-lapse nature footage; the latter requires the model to invent visual logic. The BvSM iteration (May 2026) confirmed this: vessels-filling produced a technically-correct take that didn't feel in-family; trees-growing produced a substantially stronger result on first try. See `§13` carousel inventory iteration record.

## 7. Technical patterns

### Build pipeline (Eleventy + Cloudflare Pages)

The site is built by **Eleventy 3.1.5** from `src/` templates, deployed by Cloudflare Pages on every push to `main`. Builds take ~30s; the live URL updates without further action.

**Where to edit content:**

| You want to change… | File to edit |
|---|---|
| Body content of a page | `src/<slug>.njk` |
| Page CSS | `src/_includes/_pageassets/<slug>.css` |
| Page-specific JS | `src/_includes/_pageassets/<slug>.js` |
| Page `<head>` (title, meta, OG tags, JSON-LD, fonts, favicons, GA) | `src/_includes/_pageassets/<slug>-head.html` |
| Page-specific atmospheric chrome (`grain-overlay`, `atmosphere`, etc.) before nav | `src/_includes/_pageassets/<slug>-chrome.html` |
| Site-wide nav, footer, generic JS | `src/_includes/layouts/base.njk` (affects all pages) |
| Nav dropdown / footer-nav exploration list | `src/_data/explorations.json` |
| Static asset (image, font, JSON, video) | Drop file at repo root, then add filename to the `staticAssets` array in `.eleventy.js` |

**Where the page templates live:** Each public page is a `src/<slug>.njk` file with frontmatter declaring its layout (`base.njk`), permalink (`/<slug>.html`), slug, and `eleventyComputed` block that pulls in the four `_pageassets/` files via Nunjucks `include`. The slot pattern is documented in `base.njk` itself.

**Adding a new page:**

1. Create `src/<newslug>.njk` with frontmatter referencing `_pageassets/<newslug>-*` files
2. Create the matching `_pageassets/<newslug>-head.html`, `<newslug>.css`, `<newslug>.js` (and optionally `<newslug>-chrome.html`)
3. Add an entry to `src/_data/explorations.json` if the page should appear in the nav dropdown
4. Push to main; CF builds and deploys

**Local dev:** `npm install` once, then `npm run build` produces `_site/`. `npm run serve` runs Eleventy with hot reload at `localhost:8080`.

**Direct GitHub-API commits** (legacy mechanism, useful for hot-fixes when local checkout isn't at hand):

- Fetch current SHA of the file before any commit
- `base64 -w 0` on Linux (prevents line-wrap corruption of binary files)
- Raw file fetches via `raw.githubusercontent.com`
- Repo: `Lastcoinstanding/lastcoinstanding.com`, branch `main`
- PAT scope needed: `public_repo` (or fine-grained equivalent: `Contents: read/write` + `Pull requests: read/write`, scoped to this repo). **PATs are reusable across multi-day sessions** for this personal site — paste once, reuse across conversations as needed; rotate every ~30 days or when expiration warrants, not after each session. The blast radius of a leaked token is bounded to this public-content repo and fully recoverable from git history, which is what makes the convenience tradeoff reasonable here.

### Cloudflare Pages caching

Short deployment delay (~30-60s) after GitHub push. Retry live URL checks after a pause. **Videos are aggressively cached by browsers** — use hard refresh or incognito to verify new video deployments. For future video swaps, consider cache-busting query parameters (`?v=YYYY-MM-DD`) on video source URLs.

**Avoid rapid-fire commits.** CF Pages free tier allows one concurrent build; pushing 15+ commits in quick succession can jam the queue (a stuck deployment may not recover automatically and can block production deployments for hours or days). For batch changes, prefer **one atomic commit via the Git Tree API** that bundles many file changes into a single push. If the queue does jam, recovery requires cancelling stuck deployments via the CF API (`DELETE /pages/projects/{project}/deployments/{id}`) and triggering a fresh production deployment. After bulk operations, purge the zone cache (`POST /zones/{id}/purge_cache` with `{"purge_everything":true}`) to ensure the new content is what users see.

### Open Graph / Twitter card meta tags — REQUIRED on every shareable page

Every user-facing page must include the full set of social meta tags. Without `og:image` + `twitter:card`, links unfurl as text-only on Twitter and Facebook — visually indistinguishable from broken links. Tags live in `src/_includes/_pageassets/<slug>-head.html`. The standard block is:

```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://lastcoinstanding.com/<slug>.html">
<meta property="og:title" content="<Page Title> — Last Coin Standing">
<meta property="og:description" content="<under 160 chars>">
<meta property="og:image" content="https://lastcoinstanding.com/og-<slug>.jpg">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="720">
<meta property="og:image:type" content="image/jpeg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<Page Title> — Last Coin Standing">
<meta name="twitter:description" content="<same as og:description>">
<meta name="twitter:image" content="https://lastcoinstanding.com/og-<slug>.jpg">
```

Each page has a custom `og-<slug>.jpg` card (1280×720, left-aligned text + Bitcoin "B" on right; rendered at 2x via Playwright). The Migration page's pre-refactor metadata claimed 1200×630 — the actual cards are 1280×720, and the post-refactor templates use the correct dimensions. Audit existing pages before shipping new ones.

**Deploy-gate (silent failure mode):** the JPEG filename must be added to the `staticAssets` array in `.eleventy.js` — without that, Eleventy never copies the file to `_site/`, Cloudflare serves the SPA HTML fallback at 200 OK (`Content-Type: text/html`), and social shares unfurl broken. The meta tags look fine, the repo file looks fine, but the asset is silently undeployed. The folder-level passthrough that covers `videos/` does **not** apply to OG cards at repo root; each one must be registered by name. Verify after every new card with `curl -I https://lastcoinstanding.com/og-<slug>.jpg` — should return `image/jpeg`, not `text/html`.

### Typography: Cormorant for display only

Cormorant Garamond is **display-only, 1.5rem floor**. Below 1.5rem use Inter — at body sizes Cormorant italic becomes unreadable and the mix looks unintentional. Use Cormorant for H1, H2, hero subtitles; Inter for body, captions, editorial labels (even when italicized). Property names and card titles: Inter 500-weight, not Cormorant.

For the full type scale (display, essay body, UI/body, italic flourish), four-typeface system, color tokens, and component recipes, see `STYLE_GUIDE.md`.

### Responsive design standard

Mobile-first, fluid grids, flexible images, `rem`/`em` units. Breakpoints: 480/768/1024px. Minimum 44px tap targets.

### JSON safety

HTML attribute quotes inside JSON strings must use single quotes or unicode escapes. Validate after edits: `python3 -c "import json; json.load(open('file.json'))"`.

### Large file access

For HTML files that exceed fetch token limits, use `curl | tail -n 300` rather than web_fetch.

## 8. Content structure

### Homepage carousel

Fifteen featured insight slides, each pairing:
- A 16:9 atmospheric silent video (720p, ~3-10MB)
- A three-beat minimalist text block (label + headline + CTA)

Slides are arranged to alternate tonal camps; consecutive fiat-decay slides should be avoided to prevent monotony. The set reads as a unified artifact when encountered as a whole.

### Tool pages

Each concept has its own dedicated page (trilemma.html, money-trees.html, the-half-life.html, etc.) with interactive visualizations. The tool is the argument, not illustration of an essay.

### Interactive features are the CTAs

Every carousel CTA should invite the specific interaction the destination page provides. The site's pedagogy is hands-on: remove a component, model your treasury, find your number, calculate the melt.

## 9. Interaction design principles (from WMHTB)

The What Money Has To Be page consolidated four principles worth preserving for future interactive pages:

### Categorical over continuous

When a distinction is about **kind, not degree**, use state buttons not sliders. WMHTB's four-preset selector (Bitcoin / Gold / USD / Hyperinflating fiat) is categorical — these aren't points on a spectrum, they are different categories of monetary regime. Sliders would falsely imply interpolation between them. This principle applies to any page where the user switches between discrete cases rather than tuning a parameter.

### One interactive control per page, visually firm

If a page has only one primary interactive control, **visually distinguish it from everything that merely responds to it**. WMHTB's 12 property cards each contain state-indicator pills that look button-like but are read-only — they reflect the preset selection, not individual clickability. Without clear demarcation between "the control" and "the response," users try to tap indicators and feel confused when nothing happens. The fix is structural: wrap the control in a labeled panel with its own enclosure (border, tint, "SELECT A MONEY TO COMPARE" label), and make response elements subtler (transparent borders with only the active state fully bordered).

### Subtle-enclosure grouping pattern

For grouping related properties without heavy visual weight: **1px border `#1e1c1a`, 3px radius, 1.5rem padding, `rgba(255,255,255,0.015)` tint**. State-neutral — does not change with the active preset. Used in WMHTB for all four property groupings (SoV, MoE, UoA, Structural). This is the site's default "these belong together" treatment, distinct from the stronger preset-panel enclosure which signals interactivity.

### Hierarchical nesting over flat width

When a page has a natural visual hierarchy (e.g., triangle → UoA properties → cross-cutting structural properties), nest the narrower sections under the element they belong to, rather than letting them span full width. The cross-cutting Structural Properties section on WMHTB sits inside the center-stack column (matching the UoA box width) rather than spanning the full 1240px page, which preserves the "these belong to the center argument" relationship visually.

## 10. Open tasks and future rename considerations

- **`/synthesis.html` → `/the-bitcoin-synthesis.html`** URL alignment to match label convention.
- **"The Fixed Pie" concept rename pass.** "Fixed" reads as limitation in ordinary language; the concept's actual thesis is permanence/imperviousness to dilution. Candidates: "The Share That Holds," "Your Permanent Share," "What Cannot Be Diluted." A rename touches: homepage carousel label, nav dropdown, tool page, sitemap, internal links, meta tags. (Note: as of June 2026 this page lives in **The Arguments → Why Fiat Fails**, not The Numbers — see §30.)
- ~~**Mobile responsive tweak** on Bitcoin vs. Real Estate page~~ — completed (now 3-col input row with responsive stacking).
- **Audit of `.insight-desc` blocks** on older carousel slides — the minimalist pattern drops these; ensure consistency across the set.
- ~~**OG/Twitter card meta tags on WMHTB and Power Law pages**~~ — completed (both pages retrofitted with full social meta tag block).
- ~~**Eleventy refactor**~~ — completed April 27, 2026. All 14 public pages migrated to `src/<slug>.njk` templates with shared base layout. CF Pages now builds via `npm run build`. The 15-copy chrome maintenance burden is retired.
- **CSS deduplication** (post-refactor cleanup). The canonical nav CSS (`.site-nav`, `.nav-links`, `.nav-dropdown`, `.hamburger`, `.mobile-overlay`) is currently duplicated across the 14 page-specific CSS files. Could be extracted to a shared partial in `src/_includes/_pageassets/_canonical-nav.css` and included into each `<slug>.css`. Lower priority — internal cleanup, no reader-visible change. Risk of regression is real (each page's nav CSS has tiny variations); do this with one-page-at-a-time visual diff.
- ~~**Style Guide compliance fixes**~~ — initial sweep complete (April 27, 2026). All 10 anti-patterns from `STYLE_GUIDE.md` §5 resolved across the Phase 5 commits (`60b051e`, `a7be484`, `228b5d2`, `430134e`, `1c529b7`, `fc82f82`). Closes:
  - **§5.8 Real Estate canonical tab migration** — completed in commit `1c529b7`.
  - **§5.10 Synthesis SVG mobile legibility** — completed in commit `fc82f82` (coordinated `ORB_R` + label bump).
  
  Ongoing screenshot-driven audit work (post-Phase 5) has surfaced retroactive misses on individual pages — §5.7 audit gap on Not-a-Bubble (commit `89011ea`), retroactive §5.2 sweep across calc-tier pages (commits `d375426` / `6359515`), mobile-floor sweeps on MIC / Half-Life / Power Law / Fixed Pie. **The live status of any remaining compliance work — open items, audit gaps, and process improvements — lives in `TECH_DEBT.md` at the repo root.** That file is the working document; this section is now a historical anchor.
- **Power Law nav normalization** ~~moved About inside `.nav-links` to match the other 13 pages~~ — completed by the refactor (was a side-effect of using the canonical layout).

---

_See section 14 for latest Chart.js patterns. See section 11 for Power Law page details. See section 12 for WMHTB page details._

## 11. Bitcoin and The Power Law (`/the-power-law.html`)

**Added:** April 18, 2026. **Refreshed:** May 7, 2026 (Phase 4 restructure). A four-tab page presenting the Bitcoin Power Law as an accessible but intellectually rigorous explainer. *Foundational page about the Power Law model itself — not a calculator page.* The model home; visualizations and explainers anchor the conceptual framework that other pages then *apply*. After Phase 4, Tab 4 — "The Channel" — is an interactive visualization of the bands across bitcoin's lifetime, not a forward-looking calculator (the projection calculator now lives on BvRE; see §14).

### Model parameters (Porkopolis coefficients)

- Formula: `Price = a × (days since Genesis Block)^b`
- `a = 1.6 × 10⁻¹⁷`, `b = 5.77`
- Genesis Block: January 3, 2009
- Floor multiplier: 0.42× trend (R² > 0.99)
- Ceiling multiplier: 3× trend
- Key insight: "For every ~13% increase in Bitcoin's age, the trend price doubles"
- Doubling factor derivation: `2^(1/5.77) ≈ 1.127`, i.e., ~12.7% more days
- Alternative coefficients exist (BitcoinPower.law: A=10⁻¹⁶·⁴⁹³, n=5.68; b1m.io: b=5.566) — variation across implementations is noted transparently in a footer table for credibility

### Vocabulary introduced on this page

- **"Proportional"** — Bitcoin's growth scales as a constant proportion of its own age, not at a fixed calendar interval. This is the structural distinction from exponential growth. Credit: Matthew Mežinskis.
- **"Sustainable"** — power law growth naturally decelerates, avoiding the unsustainable acceleration that collapses exponential models. Credit: Matthew Mežinskis.
- **"System, not an asset"** — power laws describe systems (cities, organisms, networks), not assets. Bitcoin following a power law is evidence that it's a scaling system, not a tradeable commodity.
- **"Bottom-side physics" vs. "top-side noise"** — market floors are governed by structural constraints (mining cost, HODLer conviction); market peaks are driven by psychology. This is why the floor has a higher R² than the trend.
- **"Goldilocks trajectory"** — power law growth sits between linear (too slow) and superexponential (unsustainable collapse). Fast enough to be transformative, slow enough to be sustainable.
- **"Zero monetary entropy"** — Bitcoin's fixed supply means it doesn't require open-ended monetary expansion to sustain itself, unlike fiat systems.

### Attribution structure

Superscript citations are used inline, with full credits in the footer:

1. **sup¹** — "Proportional and sustainable" attributed to Matthew Mežinskis (Porkopolis Economics, @1basemoney). Appears after first use of each word.
2. **sup²** — R² explanation footnote (what the statistic means for non-technical readers).
3. **sup³** — Stock-to-Flow context (PlanB, 2019 origin, 2020-2021 popularity, 50-80% miss in 2021-2022).
4. **sup⁴** — CAGR comparison analysis credited to Mežinskis.

Full credits section lists: Giovanni Santostasi (theory creator), Matthew Mežinskis (implementation + vocabulary), Fred Krueger (popularization + book), Trolololo (catalyst), Geoffrey West (scientific foundation).

### Tab 1: The Power Law (Summary)

- Hero: the ~13% doubling insight with "proportional and sustainable" attribution
- Interactive log-log Chart.js chart: historical BTC price scatter + trend/floor/ceiling corridors
- Tooltip shows: date, price, trend, floor, position, days-to-double
- "What Proportional Growth Means" section with concrete doubling examples (1000→128 days, 5000→638, 6000→766)
- Note on CAGR being technically wrong lens for Bitcoin
- CAGR Comparison Chart: bar chart showing Bitcoin's implied CAGR from various purchase years to 2035 vs S&P 500 ~10% baseline
- S2F Comparison box with sup³ footnote
- Milestones table: $1K–$10M with "Trend reaches" and "Floor secures" columns, confirmed/in-progress/projected status
- Out-of-Sample Validation chart: regression fitted to 2010-2014 data only, projected forward, overlaid with actual 2015-present prices
- Price Projection Widget: year slider (2025-2045) showing Floor/Trend/Ceiling projections with days-to-double
- Caveats section: empirical not physical law, Santostasi's ~2040 horizon warning, falsifiability via floor breach
- Credits with links to all primary sources

### Tab 2: Power Laws in Nature

- Opening: "A System, Not an Asset" framing
- Kleiber's Law section: Chart.js scatter of mammalian body mass vs metabolic rate (11 species), power law trend (exponent 0.75)
- Branching Networks section: SVG illustration showing three branching trees (River Delta / Vascular System / Bitcoin Network) in amber/red/orange
- City Scaling section: dual-visual layout — left SVG showing concentric growth rings (Village→Town→City→Metropolis), right Chart.js scatter of 12 global cities GDP vs population (exponent 1.15). West's "15% rule" paralleled with Bitcoin's ~13%
- Network Adoption section: telephone networks, fax machine critical mass, Metcalfe's Law, Bitcoin's curbed adoption (difficulty adjustment + investment risk transform exponential → power law)
- Unifying Pattern closing: mentions Gutenberg-Richter (earthquakes), Zipf's Law (word frequency), Pareto (wealth distribution)

### Tab 3: The Theory in Depth

- Derivation chain: t³ adoption × Metcalfe's u² = t⁶ ≈ t⁵·⁸
- Difficulty adjustment as thermostat (corrected: prevents premature emission schedule completion, not "runaway network growth")
- Triple feedback loop: Adoption → Value → Security → Trust → Adoption
- "Bottom-side physics" vs "top-side noise" explaining why floor R² > trend R²
- Volatility compression: Cycle 1 peaked ~8× over trend, Cycle 4 ~2.5×
- Zero monetary entropy: fixed supply, no dependence on perpetual expansion; cross-links to Half-Life and Melting Ice Cube pages
- Further Reading links to all primary sources

### Tab 4: The Channel

**NEW after Phase 4 (commit `36c13a0`).** Replaces the forward-looking calculator that previously lived here.

- Interactive deep-dive on the Power Law channel: bands across bitcoin's lifetime with daily price overlaid. Chart.js scatter with four datasets (Floor, Trend, Upper, Historical price) plus a custom `todayLinePlugin` rendering a dashed vertical "Today" marker.
- **Linear-time / Log-time axis toggle** swaps the x-axis scale between `linear` and `logarithmic`. Educational design move: same Power Law looks like curves on linear-time, straight lines on log-log; toggling between them is itself the lesson.
- **Band visibility toggles** — three checkboxes (Floor, Trend, Upper) plus a Price History toggle. Uses `chart.setDatasetVisibility()`.
- **Live status line** below chart: current BTC spot via CoinGecko, with `PL_DATA` graceful fallback.
- **Prominent Porkopolis credit block** at top of Tab — amber-tinted callout naming Matthew Mežinskis at Porkopolis Economics for the channel framework + coefficients, with direct link to `porkopolis.io/thechart`. The canonical attribution surface for the framework. Pages that *apply* the channel forward (BvRE projection, Bitcoin Retirement, Disciplined Rebalancing) link back here rather than re-stating attribution. See `STYLE_GUIDE` Porkopolis credit-block component spec.
- **Tab nav button** uses `data-tab="channel"`; the tab-routing JS reads `data-tab` and matches to `id="tab-{value}"` so no other JS changed.

### What's no longer here (was Tab 4 before Phase 4)

The previous Tab 4 was **"Calculator"** (`data-tab="calculator"`) — a forward-looking real-estate calculator. That calculator was migrated to BvRE's Calculator tab as the projection mode (commit `0b2d203`); Tab 4 was rewritten as The Channel (commit `36c13a0`). Inbound `/the-power-law.html#calculator` deep-links **redirect** client-side via `location.replace()` to `/bitcoin-vs-real-estate.html#projection` (top of TABS IIFE; runs before any tab logic). Cross-link role: BvRE hosts both retrospective and projection real-estate calculators; Power Law is the *model* they apply, not a competing decision frame.

### Tool A vs The Channel

Tab 1 has a small interactive widget — **"Project a Future Date"** (`#projSlider`) — that gives Floor / Trend / Ceiling price *numbers* at a user-selected year. Preserved unchanged through Phase 4. The Channel (Tab 4) gives the visual context; Tool A gives point estimates. Same model, different reads. Editorially complementary.

### Price data

- Source: Blockchain.info API (1431 valid data points, 2010-08-18 to 2026-04-16)
- Cached as compact JSON (477 downsampled [days, price] pairs, ~8KB inline)
- Chart.js version: 4.4.1 via CDN

### Research sources (from NotebookLM session)

- Giovanni Santostasi Medium post (March 2024)
- Porkopolis "The Chart": porkopolis.io/thechart/
- Fulgur Ventures executive summary
- Fred Krueger's b1m.io dashboard
- Geoffrey West "Scale" (2017) + Bettencourt & West (Nature, 2010)
- BitcoinPower.law (alternative coefficients)

### Planned enhancements

- City growth video for Tab 2: Grok-generated cinematic video of a city growing from village to metropolis, paired with mathematical chart
- Interactive out-of-sample slider: let user choose regression cutoff date and see how early-fitted model predicts subsequent years
- PAGR concept: "Proportional Annual Growth Rate" as alternative to CAGR — concept discussed but not yet coined on the page (risk of premature neologism)
- ~~Homepage carousel slot for Power Law page~~ — completed (slide 3, video deployed).

## 12. What Money Has To Be (`/what-money-has-to-be.html`)

The site's most foundational concept page. Thesis: a good money must simultaneously serve as Store of Value (persistence across time), Medium of Exchange (movement across space), and Unit of Account (shared measurement). These three functions are structurally coupled — unbundling degrades each. Bitcoin is the first money to deliver all three simultaneously.

### Structural elements

- **Four-preset state system** — Bitcoin / Gold / USD / Hyperinflating fiat. Categorical, not continuous (see Section 9). Each preset updates the full page: triangle node colors + animation state, coupling-line styles (solid pulsing orange for Resonant, dashed slate for Dying, etc.), and all 12 property descriptor cells.
- **Triangle visualization** — three nodes (SoV top, MoE bottom-left, UoA bottom-right) connected by coupling lines. Uses Synthesis-style `circuitGlow` keyframe and Melting-Ice-Cube-style `nodeBreathe` layered box-shadows, synced on 3s period. SVG `feGaussianBlur + feMerge` filter needs `filterUnits="userSpaceOnUse"` — the default `objectBoundingBox` collapses on horizontal lines.
- **Flanking property columns** — SoV on the left flank, MoE on the right flank, UoA + Structural Properties in the center stack below the triangle. Structural Properties are cross-cutting (affect all three functions) and live inside the center column at UoA's width, not spanning full page.
- **Closing sections** — "Money vs. Currency?" (defends the claim that the three functions are not unbundleable) and "Additively stronger than the sum of its parts" (closes on Bitcoin as a category of thing, first-and-also-last). Closing callout links to Adam Back's 2-minute summary on Bitcoin's narrow design space — same link used at end of Synthesis page, creating cross-page structural reference.

### Copy patterns established here

- **≤15 words per property descriptor cell.** Forces concision and rewards the reader.
- **USD = Hyperinflating at MoE layer.** Editorial insight locked during prose review: on Settlement finality, Cross-border friction, and Open-source, USD and Hyperinflating fiat read the same. The difference between them lives at SoV — when a reader clicks USD → Hyper, they see where the divergence actually is.
- **"not just the first money, but thereby also the last"** — the "also" is load-bearing. Without it, first-and-last reads as one claim (obvious). With it, the second claim becomes distinct (Bitcoin is a one-time discovery, not an iterable technology) which is the argument many readers miss.

### Cross-links

- From Half-Life (via Durability / "persistence across time")
- From Synthesis (as companion: six components / three functions)

### Page-specific design lessons

All four principles in Section 9 originated here. See that section for the general patterns; this section documents the page-specific application.

## 12.1 What Money Is For (`/what-money-is-for.html`)

Sister page to *What Money Has To Be* (§12), launched May 2026 (commit `93a39982d2`, editorial pass `270f84ef93`, OG iteration `[follow-up]`). Thesis: money serves three purposes — saving, investing, consuming — and these are not equal-status alternatives. Saving is the structural default; investing and consuming are choices that flow from a saver deciding to do something with what they have set aside. A money that cannot serve saving forces a person into the other two. WMHTB asks what money has to **be**; WMIF asks what those properties are **for**.

### Structural elements

- **Two-level hierarchy layout.** Save sits in a full-width row at the top with an amber-tinted border that signals foundational primacy; Invest and Consume sit below in a two-column row of stacked property cards (`STYLE_GUIDE §6.28`). The two tiers are joined by a small `purposes-bracket` SVG that draws a branching connector with the italic label *"from saving, two choices"*. Mobile (≤900px) collapses everything to a single column and hides the bracket.
- **Same four-preset state system as WMHTB.** Bitcoin / Gold / USD / Hyperinflating fiat. Categorical, not continuous. Inherits the four-state decoration vocabulary (resonant / depleted / decaying / dying) wholesale from WMHTB; pills, color palette, transition timings all identical so the two pages read as a family.
- **10 property cards × 4 monies = 40 descriptor cells.** Save has 4 cards (Purchasing power over time, Independent of counterparty, No active management required, The default state of wealth); Invest has 3 (Stable measuring stick, Long-horizon planning, Required exposure); Consume has 3 (Daily transaction practicality, Pressure to spend now, Cross-border use).
- **Closing sections.** *"Where did savings go?"* (the structural argument: credit-based money requires units to melt, so savers must be penalised first; what happens to that displaced economic energy is malinvestment, state debt absorption, and zombie-firm preservation — the suppression of Joseph Schumpeter's *creative destruction*). *"The forced bet"* (even the optimal portfolio chosen under fiat is chosen under duress; sound money returns the no-exposure default to the menu).

### Copy patterns established here

- **Descriptor cell length varies by argumentative weight, not by uniform target.** WMHTB enforces ≤15 words per cell. WMIF was drafted under a ≤25-word target but JM's editorial pass intentionally pushed several cells to 30–43 words where the argument needed the room. USD/Required-exposure at 43 words is the densest cell, carrying the state-malinvestment / zombie-firm argument that builds across all three USD Invest cells. The longer cells deliberately telegraph argumentative weight via card height — when toggling between presets, USD/Required-exposure visibly grows relative to its Bitcoin counterpart (10 words), and that asymmetry is a feature, not a defect.
- **The "or should be" qualifier in the hero subtitle.** *"Saving is the default. Investing and consuming are — or should be — choices."* The em-dashed qualifier surfaces the page's central tension (under fiat, the "are choices" framing is false — investing and consuming are forced) immediately, before the reader scrolls. The same qualifier is mirrored in the `og:description` meta tag, so the social-card preview surfaces it too.
- **Reframed Bitcoin/daily-transaction friction as policy, not technology.** Lightning and on-chain final settlement make bitcoin technically capable for daily transactions. The brake is fiat-era US tax law treating every spend as a taxable disposition — an artificial construct expected to fade. The cell language ("an artificial construct that should eventually free up bitcoin's usage") makes the impermanence explicit. Spend-and-Replace exists as the practical workaround in the current regime.
- **State-malinvestment / zombification argument woven across three USD Invest cells.** Stable-measuring-stick names "state debt and money-printing inflates prices system-wide"; Long-horizon names "state capital allocation crowds out the signals private investment depends on"; Required-exposure names "Zombie companies get created that the state feels compelled to keep alive". The closing prose then picks the argument up by name (Schumpeter's creative destruction → "The zombies stay.")
- **Inline link inside a descriptor cell — first WMIF cell to use one.** Gold/Independent-of-counterparty cell ends with `(rule 6102)` linking to the Executive Order 6102 Wikipedia article. Required switching the JS rendering from `.textContent` to `.innerHTML`. CSS recipe at `STYLE_GUIDE §6.29`. WMHTB cells remain plain text — the two pages have diverged on rendering model, but each is internally consistent.
- **"Unconfiscatable" admitted as bitcoin-community vernacular.** Bitcoin/Independent-of-counterparty uses the single word where my draft had a three-clause expansion. The term is bitcoin-native and load-bearing; the editorial pass elevated it.

### Cross-links

- From *What Money Has To Be* (sister page; the two argue the same point from opposite faces — properties vs. purposes)
- From *The Bitcoin Migration* (the source essay this page distils)
- From *The Melting Ice Cube* (the empirical case on the savings-destruction side)

### OG card iteration (v1 → v2)

The brand-forward OG image went through one iteration during launch review:

- **v1** placed Save at the bottom-center as a large bright bitcoin-orange circle, with Invest and Consume as smaller amber circles above (foundation reading — Save anchors, choices grow up from it).
- **v2** flips the vertical layout: Save at the top-center, Invest and Consume below (source/family-tree reading — Save originates, choices flow down from it).

v2 aligns with the homepage concept-card icon (which had Save at top from the start). The family-tree direction was the preferred reading; recorded here so future pages in this family don't relearn the decision. Generator script at `/home/claude/lcs-build/og_what_money_is_for_v2.py` in build history.

### Page-specific design lessons

- **Two-level hierarchy reads cleanly without a coupled-network diagram.** Where WMHTB's three functions are structurally coupled (removing one breaks all three) and the triangle visualization carries that coupling argument, WMIF's three purposes are NOT coupled in the same way — saving is foundational; investing and consuming are derived. The two-level visual hierarchy (foundation row + branching connector + two columns) telegraphs the asymmetric relationship at a glance. The `purposes-bracket` SVG between the tiers does the visual work of showing the branching without needing dynamic coupling-line animations.
- **JS rendering switched from textContent to innerHTML to support inline links.** Data is hardcoded in `what-money-is-for.js`; no XSS risk. The architectural shift is small but worth knowing — if a third page in the WMHTB/WMIF family wants the same affordance, it should also use `.innerHTML` for the descriptor cell.
- **Sister-page launches should pull from the senior page's references, not duplicate them.** This build pulled `what-money-has-to-be.njk / .css / .js / head.html` fresh from main as scaffolding before authoring WMIF, rather than re-deriving the patterns. Saved roughly 60% of the work and ensured the visual family stays tight. Worth doing on any future sister-page launch.

## 13. Homepage carousel — completed set (24 slides)

All slides deployed with 16:9 widescreen silent videos, minimalist copy pattern (label + headline + CTA, no `.insight-desc`).

**Renumber, June 2026:** the BvRP slide landed at position 3 to sit adjacent to its sister page BvRE (slide 2). Slides previously numbered 3–22 are now numbered 4–23. Iteration-record section headers updated to track the slides they describe (slide 16 → 17, slide 21 → 22, slide 22 → 23); internal cross-references in the BvSM iteration record likewise updated to the post-renumber values.

**Paper Bitcoin slide added at position 1 (June 2026).** The newest page leads the Featured set; live markup slides previously 1–24 are now 2–25 (the prior "23 slides" count was itself one short of live markup — markup is truth). Table rows below still read at +1; a full renumber is now LOW priority because the June 2026 tab restructure makes absolute carousel position secondary to tab membership. Video: bulb-with-cord and freestanding candle, first-take accept (see iteration record below).

**How Much Bitcoin? slide added at position 1 (June 2026).** Newest page leads the Featured set, per the Paper Bitcoin precedent; the pre-JS `active` class moved to it. Video: macro slow pour of amber liquid into a rocks glass, stopping deliberately at HALF a glass — first-take accept. The half-pour was a happy accident upgrading the brief: "stop short of the brim" mapped to just-below-full-Kelly (the page's warning); stopping at half maps to half-Kelly (the page's conclusion). Slide copy: label `THE NUMBERS` → rendered as page-title label "How Much Bitcoin?", headline *"The peak is not the target."*, CTA *"How much is the question →"*. The whiskey reading was weighed with JM and accepted: "know your limit, stop pouring" reinforces the restraint thesis, and the caption anchors intent; the recorded hedge, if it ever bothers, is the identical shot grammar with amber tea (tea-ceremony register, zero liquor connotation). Curation per the §13 rule: **The Melting Ice Cube retired from Featured** (`data-feat` removed; remains in the Arguments tab) — Featured holds at 10.

**Risks to Bitcoin slide added (June 2026).** Inserted at carousel position 3 (after Paper Bitcoin), Featured. Video: a lone headland of dark hard rock under heavy golden-hour storm light, powerful ordered swells breaking against its base in rhythmic sets while the rock stands utterly unmoved — first-take accept. The brief asked for a differential-erosion beat (soft rock carved away to reveal the hard core more sharply = antifragility) which did NOT render; shipped as RESILIENCE, with the antifragility thesis carried by the slide headline and the page itself (same move as How Much Bitcoin's whiskey-pour: video shows resilience, copy/caption supplies the sharper reading). The lawful-not-turbulent sea was the key §6 success — explicit triple-negation of "chaotic/turbulent" steered Grok away from the storm prior into ordered, cinematic swells that sit in-family beside the standing-stone (slide 19) and basin (slide 23) slides. Slide copy: label "Risks to Bitcoin"; headline *"Every storm has only made it harder."* ("harder" = both more-difficult-to-destroy and physically-harder-like-rock); CTA *"See what it survives →"*. Curation per the §13 rule: **Is Bitcoin a Bubble? retired from Featured** (`data-feat` removed; remains in the Arguments tab) — the nearest thematic neighbour (skeptic-rebuttal Arguments page), so the swap preserves categorical balance. Featured holds at 10.

**The Bitcoin Doubling Ladder slide added (June 2026).** Inserted at carousel position 4, immediately after its parent page **Bitcoin and The Power Law**, Featured. Carries a 16:9 silent video (`vid-doublingladder`, `/videos/the-doubling-ladder.mp4`), wired into the carousel the same generic way as every other slide — `index.js` plays/pauses whatever `video.carousel-video` sits in the active slide, so no per-id JS registration is needed. Slide copy: label "The Bitcoin Doubling Ladder"; headline *"Each step takes longer than the last."*; CTA *"Climb the ladder →"*. Curation per the §13 rule: **Bitcoin and The Power Law demoted from Featured** (`data-feat="1"` → `data-feat="0"`; the slide stays in the Numbers tab) — the Doubling Ladder is the Power Law's visual companion, so demoting the parent both makes room and avoids two adjacent Power-Law-family slides in the Featured rotation. Featured holds at 10.

**Bitcoin & Metcalfe's Law slide added (June 2026).** Inserted at carousel position immediately after its sibling **Bitcoin and The Power Law** (and before The Doubling Ladder), so the two network-science slides sit together, Featured. Carries a 16:9 silent video (`vid-bitcoin-and-metcalfes-law`, `/videos/bitcoin-and-metcalfes-law.mp4`), wired the generic `video.carousel-video` way — `index.js` plays/pauses whatever sits in the active slide, so no per-id JS registration is needed. Slide copy: label "Bitcoin & Metcalfe's Law"; headline *"The network is still there. We just can't see it anymore."*; CTA *"See what the data misses →"*. Curation per the §13 rule: **The Bitcoin Doubling Ladder demoted from Featured** (`data-feat="1"` → `data-feat="0"`; stays in the Numbers tab) — it is the nearest thematic neighbour (Power-Law family, the physically adjacent slide), so only one of the three adjacent network/Power-Law-family slides (Power Law / Metcalfe / Doubling Ladder) is Featured at a time — the same logic by which the Doubling Ladder demoted its parent Power Law. Featured holds at 10. **Audio caveat:** the supplied video master still carried an audio track; no `ffmpeg` was available on the authoring machine at PR time to strip it (the standard `ffmpeg -i in.mp4 -c:v copy -an out.mp4` step). It is harmless in-carousel (the `<video>` is `muted playsinline`), but the silent-video convention isn't yet satisfied — flagged for a same-filename silent re-drop.

**Category tabs + curated Featured set (June 2026 homepage pass).** The carousel now has four tabs — **Featured (deterministic default every session) | Foundations | Arguments | Numbers** — rendered as pill buttons above the slides. Each slide carries `data-cat` (derived from `explorations.json` categories) and the Featured ten carry `data-feat="1"`. The controller (`index.js`) cycles, auto-advances, and builds dots within the active tab's subset only; random-start now applies *within* the chosen tab (deterministic tab, varied entry point — replaces the old random-start-across-all-25). Current Featured set: Paper Bitcoin vs. Real Bitcoin, What Money Has To Be, The Bitcoin Migration, Bitcoin vs. The Stock Market, The Bitcoin Retirement, The Power Law, The Fixed Pie, Is Bitcoin a Bubble?, Bitcoin Fixed Income, The Melting Ice Cube. **Curation rule:** when a new page ships its carousel slide, promote it into Featured and retire one — Featured stays at ~10. In the same pass, the Recent Updates strip was capped at the latest 8 entries with an "All updates →" row linking to the new `/updates` archive page (full history, editorial-tier layout, sitemap 0.4).

### Pending additions

_None currently._ The **deployment-trilogy** slides (Lump Sum or Ladder In?, Your Bitcoin Deployment Plan, Wait, or Deploy Now?) shipped June 2026 and are now in the inventory table below — the videos landed as a tonal arc rather than the literal channel-diagram directions first proposed (firelit two-glass pour → aerial golden river valley → sun emerging from cloud over calm sea). The Bitcoin & Metcalfe's Law slide shipped June 2026 as well (see the slide-added note above and the iteration record below).

**Documentation drift resolved (May 2026):** the previously-flagged drift between markup and this inventory was closed when slide 22 (What Money Is For) landed. The three previously-undocumented slides (`vid-heatmap`, `vid-bbm`, `vid-lob`) have had their inventory rows scraped from `src/index.njk` and added to the table below; the prior slide-17 entry (Borrowing Against Your Stack) has been renumbered to 18 to match the live markup. The table below now matches `src/index.njk` slide-for-slide.

### Typography tune

- Label: 0.78rem, 2.5px tracking, 0.85 opacity
- Headline: 1.75rem, 1.35 line-height
- Gap: 0.9rem between elements
- Mobile: min-height auto (replaces fixed 640px/560px)

### Slide inventory

| # | Slide | Headline | Video concept |
|---|-------|----------|---------------|
| 1 | Paper Bitcoin vs. Real Bitcoin | Same light — different asset. | Dark wooden table at dusk: a vintage glass bulb with a visible fabric cord trailing out of frame, and a freestanding candle, giving identical warm light. ~5s in, the bulb fades to dark — power withdrawn through the wire — while the flame continues unchanged; held final state. Extends the "impervious" signature. First-take accept: prompt asked for an instant cut; Grok delivered a lawful gradual fade, judged semantically better (fits the §6 "nothing random" grammar; a hard cut risks reading as an edit artifact). The cord is the argument: same light, different dependency. |
| 2* | What Money Has To Be | One money must do three things at once — or it cannot do any of them | Three ornate brass lenses on oak workbench, candle behind; each shows same flame |
| 2 | Bitcoin vs. Real Estate | Housing became the default store of value by elimination, not merit | Golden hour → twilight → dark silhouette |
| 3 | Bitcoin vs. Rental Property | What if the yield were higher — and the weather quieter. | Wide cinematic shot of a sweeping field of tall grass at the moment a storm passes. First ~4 seconds: heavy rain falls diagonally, wind bends the grass in waves, slate-gray storm clouds churn low overhead, distant lightning hinted. The clouds then break in the upper third of the frame — golden god-rays pierce through, illuminating the wet field in patches, mist rising off the warm ground. Rain tapers; camera slowly pushes in. By the end, the storm has moved off to the right edge, warm dawn light bathes the field, droplets on grass catch the gold. Same field, different sky — storm reads as the landlord burden (operational load, gross-to-net leakage, policy risk), sun reads as bitcoin's quieter yield. v2 landed warmer/more natural than v1 on the close. |
| 4 | Bitcoin and The Power Law | For every 13% increase in Bitcoin's age, the trend price doubles | Town at dusk, lawful illumination pattern |
| 5 | The Bitcoin Horizon | What looks like turbulence over the course of a day is trajectory over the course of a decade | Small ship at golden hour, crossing toward the horizon; near-shore chop, steady distant line; persistence-through-turbulence |
| 6 | Is Bitcoin a Bubble? | A thing isn't a bubble simply because it has been called one | ~10 bubbles burst; one amber object remains impervious |
| 7 | The Half-Life | How long until your money loses half its value? | Candle burning down asymptotically |
| 8 | The Melting Ice Cube | Holding cash is not safety. It's an active decision with an ongoing cost | Ice cube melts to fragment on weathered wood |
| 9 | The Bitcoin Synthesis | Six components. One irreducible synthesis | Six antique keys assemble into clockwork mechanism |
| 10 | What Bitcoin Is | Most people consider just a few dimensions. Bitcoin is all of them, simultaneously | Raw mineral crystal, traveling amber light |
| 11 | The Bitcoin Migration | From what can't be fixed, to what can't be broken | Heavy wooden door opens ~2/3, amber light |
| 12 | The Trilemma | Some problems are navigated, not solved | Three geometric counterweights in coupled sway |
| 13 | The Money Trees | Two systems. Different roots. One outcome | Two trees; left withers, right unchanged |
| 14 | The Bitcoin Retirement | A stack that lasts a lifetime — or runs out before you do | Solitary mature tree in golden-hour meadow; sun moves from behind canopy to streaming rays through it; latent-state opening, persistence across the arc |
| 15 | Disciplined Rebalancing | A model you believe in is a protocol you can run | Wheat field at golden hour, ears swaying in coupled bounded oscillation; fixed camera, stable disequilibrium |
| 16 | The Fixed Pie | Your share remains undiluted — for eternity | Unmarked gold coin; surrounding coins dissolve |
| 17 | Bitcoin vs. The Stock Market | Three growth curves. One decisive horizon | Three trees in a meadow at golden hour; the middle tree grows dramatically taller and fuller-canopied over 10 seconds while the flanking trees mature modestly; latent-state opening, divergent outcomes from identical conditions |
| 18 | The Bitcoin Heatmap | The pattern reveals itself *only when you zoom out.* | (concept retrospectively documented — see live markup `src/index.njk` for the as-shipped video) |
| 19 | Borrowing Against Your Stack | Every coin sold today is a coin that compounds for someone else | Solitary ancient standing stone — weathered, lichen-marked, ~six feet tall — in a golden-hour meadow; tall grasses bend in gentle wind, long shadow extends from the stone across the foreground; the stone itself does not move; quiet persistence as the visual argument |
| 20 | Bitcoin-Backed Mortgages | The home opens. *The stack stays.* | (concept retrospectively documented — see live markup `src/index.njk` for the as-shipped video) |
| 21 | Living on Bitcoin | Save in bitcoin. Spend in fiat. *The float holds.* | (concept retrospectively documented — see live markup `src/index.njk` for the as-shipped video) |
| 22 | Bitcoin Defined | Define it. *Then debate it.* | Bed of glowing embers in deep darkness — same composition as Card 7 (Bounded by Energy) on the page. Camera fixed throughout. Four-layer subtle motion: heat shimmer above the bed, asymmetric ember pulse (no two embers in sync), a small natural wood-fire flame at center-left with irregular asymmetric tongues whose base merges with the surrounding embers, wisps of pale smoke rising and dissipating. Seamlessly looping 10-second silent video. |
| 23 | What Money Is For | Saving is the default. The rest is choice — *or should be.* | Small ancient weathered stone basin set into a leaf-carpeted forest clearing in late autumn; the basin is full to the brim with water held still, gentle source-welling at center; two narrow channels carved into the basin's lip on either side remain dry throughout (paths the water could take but does not); birches with golden foliage and a sun-lit clearing opening behind; warm low-angle late-afternoon sun, bronze/amber/ochre palette; fixed camera; the basin's persistence is the visual argument |
| 24 | Bitcoin & Metcalfe's Law | The network is still there. *We just can't see it anymore.* | A single off-center bare tree on a still lakeshore at golden hour; the real tree and landscape stay crisp and sharp throughout while its mirror reflection in the water progressively blurs and breaks into unreadable ripples — the network persists while the on-chain reflection of it goes blind. (v2; see iteration record.) Carries an audio track at PR time — pending a same-filename silent re-drop. _(Table drift note: the Doubling Ladder slide, shipped June 2026, is not separately tabled; `src/index.njk` is the source of truth for absolute order.)_ |
| 25 | Lump Sum or Ladder In? | Deploy it all, or ladder in? *History sorts it out.* | Deployment trilogy P1. Firelit two-glass pour on a wooden table before a fireplace — a bold, full pour into one glass beside a thin, measured pour into the other; the lump-vs-ladder decision as two ways of filling the same vessel. Silent, 720p, ~10s. Grouped with P2/P3 as a tonal arc, in reading order, adjacent to the Doubling Ladder slide. |
| 26 | Your Bitcoin Deployment Plan | Your capital, your timeline — *modeled against the channel.* | Deployment trilogy P2. Aerial golden-hour flight over a river valley: a smaller tributary joining the main river as both wind toward the sun on the horizon — personal capital converging on a plan. Silent, 720p, ~10s (2-pass re-encode to land in the 3–10 MB band; the raw was ~11 MB). |
| 27 | Wait, or Deploy Now? | Wait for a lower entry, or deploy now? *The channel tells you when.* | Deployment trilogy P3. Sun emerging from behind a low cloud bank over a calm sea, rays breaking across the water — patience resolving into clarity; echoes the page's quiet-when-low, live-when-high spine. Silent, 720p, ~10s. |

### Iteration record — slide 17 (May 2026)

The BvSM slide took two video briefs to land. Captured here because the lesson generalizes to any future *bitcoin vs X* comparison slide; the prompt-craft principle now lives in §6 ("Comparison metaphors: prefer living elements over industrial ones").

The first brief proposed *three glass vessels filling at different rates under candlelight* — a comparison metaphor mechanically right (different fill rates = different growth rates, the amber vessel cresting and overflowing). Output was technically correct but the lab-bench register fought the site's atmospheric/lived-in voice; the cooler vessels also rose more than the brief specified, weakening the growth differential the slide depends on.

The trees brief — *three young trees in a meadow at golden hour, middle one growing dramatically more* — produced a substantially stronger take on first try. Living-element comparisons read more naturally than industrial-element ones in the site's tonal grammar; *single-element-with-different-states* (one tree grows more than another) is also more reliable than *multi-element-with-different-behaviors* (one vessel fills at a different rhythm than another) because the former matches a familiar time-lapse nature pattern while the latter requires Grok to invent visual logic.

The trees direction has light visual overlap with two other tree-themed slides (slide 13 Money Trees / two trees, slide 14 Bitcoin Retirement / one tree). Adjacency is broken by slide 15 (wheat field) and slide 16 (gold coin) between slides 14 and 17; framings differ enough (centered single vs wide three) that the shared visual vocabulary reinforces site identity rather than producing monotony — the carousel's overall grammar is part of what makes the set feel like one artifact.

### Iteration record — slide 22 (May 2026)

The Bitcoin Defined slide took two video briefs to land. Captured here because the lesson generalizes to any future video prompt that needs to describe a *stable, small* flame.

The first brief described the flame as flickering softly *"like a candle in still air"* — the simile was meant to convey **stability** (small, contained, not leaping). Grok took it literally and rendered the canonical candle-on-wick: a single symmetric teardrop sitting on top of one ember, base clearly separated from the surrounding bed. Everything else in the video (ember texture, color gradient, the warm glow holding through the bed, the seamless loop) landed beautifully on v1 — only the flame failed.

The revision dropped the candle simile entirely, anchored the flame as **part of** the ember bed rather than a separate object on top of it ("emerges from a hot pocket within the ember bed itself — its base merges visually with the surrounding embers"), specified wood-fire flame anatomy ("irregular and asymmetric, with two or three small uneven tongues that flicker, split, and merge back together — never a single symmetric teardrop"), and added explicit anti-pattern language to the exclude block ("no candle flame; no symmetric teardrop-shaped flame; no single-wick flame appearance; no flame sitting on top of a discrete object; the flame must be part of the burning ember bed itself, not separate from it"). v2 landed cleanly with two organic tongues emerging from within the bed.

The prompt-craft principle: **never use a candle as a stability simile when the rendered subject is fire of any kind**. The simile is too strong a visual prior — the model will render the candle, not the stability. The same caution likely applies to any other subject-as-stability simile where the source object has a distinctive visual archetype (a sundial as a stillness simile would invoke the sundial itself, a glacier as a slowness simile would invoke ice, etc.). Describe the property you want (small, asymmetric, stable in envelope) using neutral physical language; reserve similes for properties that don't have a strong visual archetype in the model's training data.

### Iteration record — slide 23 (May 2026)

The What Money Is For slide took two video briefs to land. Captured here because the lesson generalizes to any future *forest-set golden-hour* slide.

The first brief named the setting as *"forest clearing in late autumn, golden hour"* and described the basin as *"moss-covered"* twice (basin moss-covered, ground moss-covered). Output was structurally clean — the basin landed, the two carved channels stayed dry through all 10 seconds (the load-bearing element of the visual argument), the source-welling at center was barely-perceptible as intended — but the overall palette was a bright spring/summer forest green rather than the bronze/amber/ochre tone the site's family register lives in. The visual register fought the site's tonal grammar.

The revision led with a labelled `OVERALL TONAL DIRECTION` block at the top of the prompt — pushing the color call to the most-weighted position rather than embedding it inside the setting paragraph. Named a specific color temperature (3000K) and three concrete reference images (brass instrument lit by candle, meadow in late October, brass lantern at dusk). Changed *"moss-covered stone basin"* to *"weathered stone with patches of dormant, gold-green and rust-tinged lichen"* — lichen reads more autumnal than moss, and *"dormant"* preempts the bright-green default. Changed *"forest clearing"* to *"edge of a deciduous broadleaf forest clearing"* with named tree species (birches, beeches, oaks, alders) and explicit *"leaves turned to gold, russet, bronze, ochre"* so the forest backdrop had to be autumnal. Changed *"moss-covered ground"* to *"carpet of fallen autumn leaves in browns, golds, and copper tones"* — and called out *"NOT a green moss carpet"* inline. The exclude block was reordered to lead with color/foliage exclusions before structural ones; added *"no green coniferous trees (no pines, no spruces, no firs)"* with named tree types to suppress Grok's default-forest prior. v2 landed in the bronze register cleanly.

The prompt-craft principles, generalizable beyond this slide:

1. **Forest-set golden hour reads as bright daytime forest by default.** "Golden hour" alone isn't enough to push a forest setting into bronze territory — Grok's "forest" prior is vibrant green coniferous by default, and "golden hour" gets weighted as one element among many. Explicit autumnal foliage + named bronze color palette + named excluded tree species is needed to hold the family tone in a forest setting. A meadow setting (slides 13 / 16) avoids this problem entirely because meadow + golden hour is a familiar pairing for the model.
2. **Repeated terms over-weight their priors.** "Moss-covered" appearing twice in v1 pulled the whole composition toward bright green even though the prompt also said "golden hour" and "late autumn". When a setting-element appears multiple times with the same descriptor, the model treats that descriptor as the dominant visual direction. Vary the language ("dormant lichen", "rust-tinged moss", "weathered stone") to keep any one prior from over-dominating.
3. **Labelled prompt blocks weight more heavily than embedded paragraph copy.** Leading with an `OVERALL TONAL DIRECTION (most important):` block in v2 gave the color call disproportionate weight relative to the setting/composition/motion paragraphs that followed. Worth doing whenever a single dimension (color, mood, motion-quality) is the load-bearing element that the slide depends on.

### Iteration record — Bitcoin & Metcalfe's Law (June 2026)

The Metcalfe slide took two video briefs to land. Captured here because the lesson generalizes to any slide whose argument is *"the thing is still real, but our view of it degrades."*

The first brief leaned on a **two-tree** composition (a real tree and its counterpart) to carry the real-vs-reflection idea. Output rendered the two trees with unintended near-**symmetry**, which read as a balanced pair rather than original-vs-degraded-copy — the argument was ambiguous (which one is the "real" network?), and the symmetry fought the asymmetric, off-center grammar the rest of the set uses.

The revision dropped to a **single off-center bare tree on a still lakeshore**, and made the contrast explicit and directional: the real tree and landscape stay **crisp and sharp** for the full clip while only its **mirror reflection** in the water progressively blurs and breaks into unreadable ripples. That maps cleanly onto the page's thesis — the network (the real tree) persists; the *on-chain reflection of it* (the water image) is what goes blind. v2 landed the argument unambiguously.

The prompt-craft principle, generalizable: **for a "the real thing persists, the image of it degrades" metaphor, use one subject plus its reflection/shadow — not two peer copies.** Two peers invite a symmetry the model will happily render, and symmetry erases the original-vs-degraded distinction the slide depends on; a subject-and-its-reflection encodes the asymmetry structurally (one is primary, one is derivative) so only the derivative needs to degrade.

## 14. Bitcoin vs. Real Estate (`/bitcoin-vs-real-estate.html`)

**Added:** April 18, 2026. **Refreshed:** May 7, 2026 (Phase 4 restructure). Decision-frame page for the bitcoin-vs-housing question. After Phase 4 hosts both retrospective and projection calculators on the same canvas, paired via a temporal toggle.

### Tab structure (4 tabs)

| Tab | `data-tab` | Panel id | Notes |
|---|---|---|---|
| The Postponed Purchase | `calculator` | `panel-calculator` | The dual-mode calculator (default tab; see sub-section below) |
| A Home Priced in Bitcoin | `btc-house` | `panel-btc-house` | Historical comparison: same house in dollars vs. in bitcoin over time |
| The Ceiling | `ceiling` | `panel-ceiling` | Affordability ceiling chart |
| The Affordability Crisis | `crisis` | `panel-crisis` | Home-price-to-income ratio across monetary eras (Nominal Revolution, Bretton Woods, etc.) |

Tab nav order is *not* the same as DOM order — `panel-calculator` is the active default and lives mid-page in the DOM. Tab nav controls visibility.

### Calculator tab dual-mode pattern (NEW — Phase 4)

The Calculator tab hosts two calculators paired via a Money-Trees-style toggle (commit `0b2d203`):

- **Retrospective mode** (default) — pick a past year, see what bitcoin would have done with the same money over the same period
- **Projection mode** — use the Power Law to compare buying a house *today* vs. holding bitcoin *today*, over a chosen horizon. Migrated from the former Power Law Tab 4.

Architecturally:

```
#panel-calculator
├── .calc-mode-toggle [data-active-mode]
│   ├── .calc-mode-label.retrospective (button)
│   ├── .calc-mode-switch (sliding switch, central)
│   └── .calc-mode-label.projection (button)
├── #calc-mode-retrospective (.calc-mode-content.active by default)
│   └── [retrospective UI]
└── #calc-mode-projection (.calc-mode-content)
    └── [projection UI, migrated from former Power Law Tab 4]
```

The toggle is a sub-tab; tab routing remains at the parent (4-tab nav). User flips between modes without leaving the Calculator tab. See `STYLE_GUIDE` calc-mode-toggle pattern for the canonical recipe.

### Deep-link routing

Three hashes resolve cleanly:

| Hash | Behavior |
|---|---|
| `#calculator` | Calculator tab (default), retrospective mode |
| `#projection` | Calculator tab AND projection mode auto-activated. Canonical short alias. |
| `#calc-mode-projection` | Same as `#projection` (legacy long form, matches the DOM id; routes correctly and rewrites the URL to `#projection` on landing via `history.replaceState`) |

`applyHashToMode()` inside the BvRE js handles both initial page load and subsequent `hashchange` events. The pattern is reusable for any future page with sub-mode states reachable via hash.

### Custom interest-rate input (Retrospective mode)

Third optional input field "Your interest rate" on Retrospective mode (originally added April 18, 2026):

- Grid is 3-col (1fr 1fr 1fr) for the three optional inputs
- Custom rate overrides `mortgageRates[sy]` throughout all calculations
- Shows `(vs. prevailing X%)` parenthetical in scenario text when custom rate active
- Clears on year change; placeholder updates to show new year's average
- Clamped 0.5%–15%
- Flows through to: monthly payment, remaining balance, total cost, rent estimate, DCA savings
- Mobile responsive at 768px and 480px stacks to single column

### Cross-link role

- BvRE applies the Power Law channel as a forward projection (in Projection mode); BvRE's related-set points to The Channel page (Power Law Tab 4) as the canonical visualization of the bands.
- BvRE no longer describes Power Law as a "forward-looking companion" — the projection lives here now. BvRE describes Power Law as "the growth model behind the projection."
- The retirement page applies the same channel as a retirement projection; both BvRE and retirement reference Power Law as the model home.

## 15. Chart.js patterns and lessons

- **Version:** 4.4.1 via CDN (`cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`)
- **Log-log charts:** Use `type: 'scatter'` with both axes set to `type: 'logarithmic'`. Trend lines as `type: 'line'` datasets overlaid.
- **Tooltip conflicts on multi-dataset charts:** When tooltip picks up values from model-line datasets (trend/floor/ceiling), either suppress them (return `[]` from label callback) or add proper labels. Bare unlabeled values confuse users.
- **Year labels on log-scale x-axis:** Use `afterBuildTicks` to override with year-based ticks. Raw day values are meaningless to readers.
- **CAGR bar chart:** `type: 'bar'` with a `type: 'line'` dataset overlaid for the S&P 500 reference line.
- **Out-of-sample chart:** Perform the regression in-browser using least-squares on log-transformed data. Split price data into training/test sets by day cutoff.

---

## 16. Page layout & content centering

Every tool page uses a **centered hero block** above a **wide outer container**, and lets prose, headings, charts, and tables fill that container naturally. Do not constrain prose at the paragraph level — it creates a visual mismatch with full-width charts and tables and reads as drift.

### The pattern

**Hero block (mandatory):**
- `text-align: center` on the hero block itself
- `max-width: 820–1100px` on the hero block, with `margin: 0 auto`
- Hero subtitle (when present): narrower constraint, `max-width: 600–680px`, also `margin: 0 auto`
- The H1 inside the hero gets `text-align: center` and `margin: 0 auto`

**Body container (mandatory):**
- Outer wrapper: `max-width: 1000–1240px`, `margin: 0 auto`, with horizontal padding
- Use a single wide outer wrapper for the whole section body, not multiple narrow wrappers per section
- **Do not apply paragraph-level `max-width` constraints.** Let prose fill the container width, the way every reference page does. The line-length-ergonomics argument for paragraph constraints is real in the abstract but loses to the visual asymmetry it creates when adjacent charts and tables fill the full container.

### Why this rule looks the way it does

The first version of this section (April 25, 2026 morning) prescribed paragraph-level reading-width constraints (`p { max-width: 65ch }`, etc.) on the theory that long line-lengths hurt readability. The Horizon page implemented it that way and the result was an obvious visual mismatch: prose at ~700px, charts at ~1100px, with a noticeable empty corridor down the right side of every prose section while charts filled the container. The reference pages I had audited (Half-Life, Power Law, WMHTB, Bitcoin vs. RE) don't do paragraph-level constraints — their prose just runs wide. On a 1440px+ viewport that's marginally less optimal for line-length, but visually consistent. **Visual consistency wins; the rule was corrected in the same day.**

### Reference page conformance (April 2026 audit)

| Page | Hero pattern | Outer container | Paragraph-level constraints |
|---|---|---|---|
| Half-Life | `.page-header { text-align: center }` + subtitle `max-width: 600px; margin: 0 auto` | `.container { max-width: 1240px }` | None |
| Power Law | `.page-header { text-align: center }` + `.hero-insight { max-width: 780px; margin: 0 auto; text-align: center }` | `.container { max-width: 1240px }` | None |
| WMHTB | `.hero { text-align: center }` + `.subtitle { max-width: 680px; margin: 0 auto }` | `.container { max-width: 1240px }` | None |
| Bitcoin vs. RE | `.hero { text-align: center; max-width: 820px; margin: 0 auto }` | `.content-area { max-width: 1000px }` | None |
| Bitcoin Horizon | `.hero-block { text-align: center; max-width: 820px; margin: 0 auto }` | `.wrap { max-width: 1100px }` | None |

### Ancillary typography rules (cross-references)

Several typography failures co-occur with layout issues and should be checked together:

- **Cormorant Garamond is display-only, 1.5rem floor** (per §7). Below 1.5rem — captions, footnotes, disclosures, chart annotations — use Inter. Cormorant italic at small sizes is the most common manifestation of this rule being violated.
- **Disclosures and footnotes use Inter at `--ink-dim`** (not `--ink-faint`), `0.88rem`, `line-height: 1.55`. If a disclosure is multi-sentence and centered, `max-width: 72ch` keeps it from sprawling — but this is on the *callout/disclosure box itself*, not on the body prose paragraphs of the page.

### Lesson banked

When the urge strikes to add a "thoughtful" reading-width constraint on prose: don't. The site already solved this problem implicitly through wide containers and consistent typography. Adding constraints to fix an imagined ergonomics problem creates a real visual problem.

---

## 17. The Bitcoin Retirement (`/the-bitcoin-retirement.html`)

**Added:** May 2026. A four-tab editorial-tier calculator page exploring how a bitcoin position supports a retirement. Architecture: graph-first, exploration-first — the chart leads, sliders sit beneath as the primary interaction surface, a single Sustainability readout replaces the traditional headline-number pattern.

### The three legitimate questions

The page frames retirement-with-bitcoin around three interrelated questions, none with a single answer:

1. *How much BTC do I need?* — pedagogical scaffolding (prose + static Smitty-style visualization on the Question tab)
2. *When can I retire?* — interactive (Retirement year slider in the target cluster)
3. *What income can I retire on?* — interactive (Target annual income slider in the target cluster)

The two interactive questions share the same continuous math; users drag whichever slider matches the question they are asking, and the rest of the readout updates to stay consistent.

### Tab structure

| Tab | Character | Content |
|---|---|---|
| The Question | Editorial prose | The decumulation paradox, three legitimate questions, strategy plurality posture |
| The Calculator | Tool-led | Live slider clusters, Power Law projection chart, Sustainability readout |
| The Strategies | Editorial prose | Three frameworks (sell-as-needed deep, borrow-against teaser, disciplined-rebalancing teaser) |
| The Math | Specification-led | Equations, parameter tables, honest limits |

Each prose tab opens with a Cormorant Garamond thesis statement (`.tab-thesis`) — a centered Power-Law-style hero claim that anchors the tab. See `STYLE_GUIDE` essay-prose tier for the pattern.

### Model parameters

The calculator uses Porkopolis Power Law coefficients, matching `/the-power-law.html`:

- `Price(t) = a × (days since Genesis)^b`, where `a = 1.6 × 10⁻¹⁷`, `b = 5.77`
- Genesis Block: 3 January 2009
- Floor multiplier: `0.42 × trend`
- Upper multiplier: `3.0 × trend`
- Live BTC price via CoinGecko, falling back to `LIVE_BTC_FALLBACK = 108000`
- Default withdrawal rate: 6% (sliderable 2–15%); Trinity-Study 4% rule referenced as anchor in slider labels but is not the default — bitcoin's growth profile under the Power Law makes 6% the more honest default

### Chart datasets (six lines, asymmetric treatment)

| Dataset | Color | Stroke | Role |
|---|---|---|---|
| Floor band | `#b04525` (rust) | dashed `[6,3]` 1.6px | Conservative anchor |
| Trend | `#e09422` (signature amber) | solid 2.5px | Central case |
| Upper band | `#e8c820` (gold) | sparse-dashed `[1,6]` 1.2px | Spike envelope |
| Drawdown | `#ece4d6` (cream) | solid 2px | User stack under sell-as-needed |
| Current trajectory | `#a89c8a` (muted tan) | dashed `[4,3]` 1.5px | Anchored to live BTC price; plots from current year at mark-to-market |
| Traditional 60/40 | `#5e7a92` (cool blue-gray) | dashed `[5,4]` 1.4px | Real-return benchmark; plots from current year at mark-to-market |

Trend, drawdown, current-trajectory render with full saturation; floor and upper render with reduced visual weight to emphasize trend as the central case. A `bandFillPlugin` adds subtle amber `rgba(224,148,34,0.05)` fill between floor and upper. The legend has two group labels (`Power Law bands — per bitcoin` for the top three lines, `Portfolio value — total stack` for the bottom three).

**Line-start behavior.** The two portfolio-value comparison lines — current trajectory and Traditional 60/40 — both plot the accumulation phase, beginning at the current year at today's mark-to-market stack value (`btcStack × live BTC price`) and diverging across the window (60/40 compounds slower). The at-trend **drawdown** line keeps a `null` prefix and begins only at the retirement year: starting it earlier would draw it at the Power Law *trend* price and misrepresent the user's actual below-/above-trend position today. In `projectStackOverTime` this asymmetry is a `plotAccumulation` flag passed `true` only for the current-trajectory line; `projectTraditionalPortfolio` emits its running balance during accumulation rather than `null`.

### Sustainability readout

Single readout card with two values plus a spectrum bar:

- *Projected years stack lasts* (or "∞ — escape velocity")
- *Projected stack value at retirement* (in today's dollars, inflation-adjusted)

Spectrum bar maps the stack's real-terms multiplier (`(stack_end / stack_start) / (1 + inflation)^years`) onto a Depleting → Threshold → Escape velocity continuum. The threshold tick at 1× indicates real-terms break-even.

**Power Law disclosure pattern.** All five tooltip targets on the sustainability surface — *Projected years stack lasts*, *Projected stack value at retirement*, and the three spectrum-bar zones (Depleting, Threshold, Escape velocity) — carry a one-line disclosure that the projection assumes the Power Law trend price. Deliberately repetitive: tooltips are read independently, so each must be honest in isolation. Pattern documented in `STYLE_GUIDE` help-tip section.

### Tax treatment (no Account Type toggle)

The v1 model is **pretax throughout**. There is no Account Type toggle on this page — earlier iterations included a documentary-only toggle (Regular vs Retirement) that was later removed because it implied differentiation the math didn't actually deliver. The structural arithmetic of sell-as-needed (stack value over time, withdrawal pressure, real-terms sustainability) runs the same regardless of account type.

Tax-distinct mechanics surface on the sibling Disciplined Rebalancing page, where IRA-internal sells avoid the per-sell taxable event a regular account incurs and the rebalancing math materially diverges. The Account Type concept returns there as a primary computational input.

The illustrative tax line in the income slider tooltip — *"a 20% effective tax would reduce real take-home to roughly 80%"* — is preserved as a one-line magnitude acknowledgment, appropriate in any retirement context.

### Print output

`Cmd/Ctrl+P` produces a single-page PDF with: header strip (brand + URL + date) → page title → 9-row inputs table (6 sliders + 3 baseline picker selections) → projection chart → sustainability summary → disclaimer footer. Pattern is reusable for sibling pages — documented in `STYLE_GUIDE` print stylesheet section.

### Scenario carry-over to sibling pages

The Retirement page is the entry point for two sibling-page strategies — Borrowing Against Your Stack (§21) and Disciplined Rebalancing — and serializes its current scenario state into the URL when the user clicks through to either sibling. The sibling page reads the params on load and pre-populates its inputs, so the user doesn't re-enter what they just configured.

**The canonical schema** (all params optional; missing or invalid params fall back to the sibling page's HTML defaults):

| Param | Type | Source slider | Notes |
|---|---|---|---|
| `stack` | decimal | `slider-btcStack` | BTC stack |
| `retire` | integer | `slider-retirementYear` | 4-digit year |
| `income` | integer | `slider-targetIncomeUSD` | Target annual income USD |
| `years` | integer | `slider-yearsInRetirement` | Years in retirement |
| `dca` | integer | `slider-monthlyDcaUSD` | Monthly DCA USD |
| `withdraw` | decimal | `slider-withdrawalRatePct` | Withdrawal rate % |

**Out of scope for the URL contract:** baseline assumptions (inflation preset, growth model, real-returns preset). These live in `localStorage` via the shared `ModelingAssumptions` module, so they carry across pages automatically without URL-param help. The URL schema deliberately covers *only* page-local Retirement state.

**Sender mechanics:** a self-contained IIFE at the end of `the-bitcoin-retirement.js` wires an `input` listener on each of the six sliders. On any change, the IIFE rebuilds the query string and rewrites the `href` of every link matching `a[href^="/borrowing-against-your-stack"]` or `a[href^="/disciplined-rebalancing"]`. The match-by-prefix selector means new teaser links added to the page later (with the same base path) are picked up automatically without HTML hooks.

**Receiver mechanics:** the sibling page parses `URLSearchParams` inside its calculator's init code, *before* the first compute. Each param is validated (numeric range, sane bounds) before being applied to the matching input. Unknown or invalid params are silently ignored, and unknown params remain on the URL so any subsequent navigation sees the full state.

**Forward compatibility:** the BAS receiver currently uses only `stack` because BAS's other inputs (loan amount, liquidation threshold, interest rate) are BAS-specific and don't map to any Retirement state. The receiver explicitly preserves unknown params so any later additions (BAS Tab III's horizon slider eventually reading `years`, for instance) can layer on without breaking the link contract.

**Shareable scenario URL on Retirement itself.** Added 2026-05-22. The same schema now also drives the Retirement page's own URL: on init the reader applies any URL params to `SCENARIO` before the first render; on every slider change a debounced (`~220ms`) `history.replaceState` rewrites the address bar to reflect current state. Defaults are omitted from the URL — a clean `/the-bitcoin-retirement.html` represents the default scenario, only the user's deviations show as query params. `withdraw` is intentionally skipped in the *writer* (though still accepted in the reader for forward-compat) because the rate is a derived value that gets reconciled locally from income+stack+baselines; including it would produce URL cruft like `?withdraw=6.7` on a fresh load. Baseline assumptions remain out of scope per the original §17.5 contract — they carry across pages via `localStorage`, not the URL.

**Shareable scenario URL on Disciplined Rebalancing.** Added 2026-05-22. DR adopts the same pattern with its own page-local schema (DR has no `stack`/`income`/etc. surface):

| Param | Type | Source input | Notes |
|---|---|---|---|
| `sell` | integer | `slider-drSellPct` | Sell percentile (60–95, default 80) |
| `rebuy` | integer | `slider-drRebuyPct` | Rebuy percentile (5–55, default 50) |
| `tax` | integer | `slider-drTaxRate` | Effective cap-gains rate (0–40, default 15) |
| `account` | enum | `[data-account].active` | `retirement` (default) or `regular` |

Reader runs on `DOMContentLoaded`, AFTER the calculator IIFE's `loadStickyValues()` (so URL params override localStorage rather than being overwritten by it); writer is debounced ~220ms on slider `input` and account-button `click`. Account button changes go through the existing `setAccountType()` handler (the reader programmatically `.click()`s the matching button rather than re-implementing the toggle's side effects).

Unknown params (including Retirement's `stack`/`income`/etc. when a user navigates between sibling pages) are preserved on the URL untouched — `URLSearchParams.set/delete` only touches keys explicitly in DR's schema, leaving everything else as-is. This keeps the cross-page carry-over working in both directions even when each page only writes its own schema.

**Shareable scenario URL on Bitcoin vs. Real Estate.** Added 2026-05-22. BvRE has two calculator modes (retrospective + projection) with disjoint input sets; the URL schema covers both, with the mode itself captured by the existing `#projection` hash convention (handled by `applyHashToMode`):

| Param | Type | Mode | Source input | Notes |
|---|---|---|---|---|
| `year` | integer | retro | `#calcYear` | 2014–2021, default 2017 |
| `dca` | bool | retro | `#calcDCA` | `'1'` if checked, omitted otherwise |
| `home` | integer | proj | `#fwdHomePrice` | comma-formatted in DOM; URL strips commas; default 420000 |
| `horizon` | integer | proj | `#fwdHorizon` | one of `5`/`10`/`15`/`20`, default 10 |
| `appr` | decimal | proj | `#fwdHomeAppreciation` | real %/yr, default 3.5 |
| `mortgage` | decimal | proj | `#fwdMortgageRate` | nominal %, default 6.8 |
| `method` | enum | proj | `.purchase-btn.active` | `'cash'` or `'mortgage'` (default) |
| `pscenario` | enum | proj | `.scenario-btn.active` | `'floor'` (default), `'trend'`, or `'upper'` |
| `advanced` | bool | proj | `#fwdAdvancedCheck` | `'1'` if checked, omitted otherwise |
| `advrate` | decimal | proj | `#fwdAdvancedRate` | real %/yr, default 7 |

`fwdBtcNow` (current BTC price) is intentionally NOT in the URL — it's a live-fetched value that goes stale within hours, so a shared link lets the receiver's calculator pull fresh price rather than pin a past value.

For purchase-method and Power Law scenario (which are button groups, not form inputs), the reader programmatically `.click()`s the matching button so the existing handlers (which trigger `runFwdCalc`) run. Button-group changes also fire the URL writer via direct `click` listeners.

**Shareable scenario URL on Borrowing Against Your Stack.** Added 2026-05-22. Extends BAS's prior single-param (`stack`) receiver to a full 7-key schema:

| Param | Type | Source input | Notes |
|---|---|---|---|
| `stack` | decimal | `#basBtcStack` | default 1.0; mirrored to `#bvsBtcStack` via SHARED_PAIRS |
| `loan` | integer | `#basLoanAmount` | default 10000; mirrored |
| `rate` | decimal | `#basInterestRate` | default 10; mirrored |
| `liq` | integer | `#basLiqThreshold` | Loan Health tab; 70–95, default 80 |
| `horizon` | integer | `#bvsHorizon` | BvS tab; 1–15, default 5 |
| `cb` | integer | `#bvsCostBasis` | BvS tab; defaults to current price — omitted from URL when equal to current price (within $1) so a shared link lets the receiver's calculator default to their current price rather than pin the sender's |
| `cg` | integer | `#bvsCapGains` | BvS tab; 0–40, default 20 |

`price` (basBtcPrice / bvsBtcPrice) is excluded for the same staleness reason as BvRE's `fwdBtcNow`.

The new URL sync IIFE runs at the end of `borrowing-against-your-stack.js`, AFTER the calculator IIFE's `SHARED_PAIRS` localStorage hydration — so URL params correctly override stored values. The previous inline single-param receiver inside the calculator IIFE was removed; a comment block now points future readers to the new full sync IIFE at the end of the file.

For shared inputs (stack/loan/rate), the writer binds to BOTH the bas* and bvs* members of each pair (so direct events from either tab feed the writer); the state-sync layer mirrors values across pairs and the writer reads from the bas* member as canonical.

**Universal layout-level "Share this page".** Added 2026-05-22. A second share surface, auto-injected by `base.njk` between `{{ content | safe }}` and the canonical footer on every page. Single-group, generic-URL only (`window.location.origin + pathname + hash` — query params stripped). Frontmatter `share_in_layout: false` opts a specific page out.

This surface is for *page promotion* — the eyebrow reads "Share this page" — and intentionally does not carry scenario state. Calculator pages with their own in-page two-group share section (Retirement, DR, BvRE, BAS) keep that surface for "Share this scenario" (which still uses `currentUrl()` with query params). The two surfaces serve different intents at different points in the reading flow.

URL strategy summary across the site:

| Share surface | URL used | Strip query params? | Where it lives |
|---|---|---|---|
| In-page "Share this scenario" (Copy / Native) | `currentUrl()` | No — full scenario URL | Per-page IIFE, near the result |
| In-page "Share the page" (X / LinkedIn / Facebook) | `genericPageUrl()` | Yes | Same per-page IIFE |
| Layout-level "Share this page" (all buttons) | `genericPageUrl()` | Yes | `base.njk` inline IIFE, every page |

Tab-aware sharing works for free on every page: `genericPageUrl()` preserves the URL hash (which captures the active tab on pages with tab navigation), so a user on `/the-power-law.html#theory` shares a link that lands the receiver on the Theory tab.

### Voice / editorial register

Editorial-tier per `STYLE_GUIDE §1` (it has prose tabs); typography matches §2.1 canonical with Inter body and Cormorant display. Voice calibrated against the user's *Bitcoin Migration* essay: long structured sentences with semicolons; italicized conceptual emphasis on terms like *structurally*, *contextual not computational*, *delays*; concession-and-pivot moves; sober, intelligent register; no jargon-as-drama.

The site does not endorse retirement strategies; it presents them. The Strategies tab's *"these are for entertainment only"* and the Math tab's *"What the model does not do"* honesty preserve the descriptive-not-prescriptive register.

### Cross-linking

- **Related** (`§6.10`): cross-links to `the-power-law` (the price model behind the projection), `bitcoin-vs-real-estate` (retrospective decision-support companion), `the-half-life` (decay of cash over time)
- The Power Law text in the Question and Strategies essays hyperlinks to `/the-power-law.html` for users who want to drill into the model
- The Math tab references both the Power Law page and the Disciplined Rebalancing page

---

## 18. Editorial reading order (after Phase 4)

For a reader new to the site landing on the calculators:

1. **Bitcoin vs. The Stock Market** — most accessible entry point; the comparison everyone has in their head (*"what would have happened if I'd bought bitcoin instead of the index?"*); no property or retirement timeline required; introduces the Power Law as the structural reference without requiring deep engagement with it
2. **The Bitcoin Retirement** — most life-relevant, anchors most directly on the channel, provides motivation
3. **BvRE — Retrospective mode** — the historical case that bitcoin has been the better store of value vs. housing
4. **BvRE — Projection mode** — the same question forward; introduces the channel framing without going deep
5. **The Power Law — The Channel tab** — the foundational visualization; readers arrive ready to grok the framework
6. **The Power Law — other tabs** — the deeper conceptual case (Theory, In Nature)
6a. **Bitcoin & Metcalfe's Law** — the network-effect engine *under* the Power Law: where the Power Law models price-vs-time, this measures price-vs-adoption and shows why that on-chain signal is going blind in the ETF era. Reads naturally right after the Power Law's conceptual case, before the applied sizing/maintenance pages.
7. **How Much Bitcoin?** — the sizing question every applied page eventually meets, answered descriptively through the Kelly criterion; reads naturally after the Power Law (which supplies its scenario inputs) and immediately before Disciplined Rebalancing, its sister page (sizing → maintenance)
8. **Disciplined Rebalancing** — applies the channel as a sell-and-rebuy protocol; deepest specialization on the *selling* side
9. **Bitcoin Fixed Income** — the income-instrument decision frame for readers who want cashflow today without selling the stack; sits at the same depth tier as Disciplined Rebalancing but addresses a different mechanism (preferred dividends vs. percentile selling)

Risks to Bitcoin (shipped June 2026) sits late in the reading order — it is a steelman-and-rebuttal page that lands best once a reader already grasps the bull case, since it argues against bitcoin in order to test that case. Place it after the core Arguments and before the deepest Numbers specializations.

Phase 4 strengthens this reading order by separating *application* (BvSM, BvRE, retirement, disciplined rebalancing) from *foundation* (Power Law). BvSM was added at the top of the reading order in May 2026 because it requires the least personal context from the reader and proves the framework with the broadest comparator most readers already trust.

The deployment trilogy sits in the applied-Numbers tier, after the foundational Power Law and the broad comparators, since it assumes the reader already grasps the channel. Read in order — **Lump Sum or Ladder In?** (the general lump-vs-ladder lesson) → **Your Bitcoin Deployment Plan** (model your own deployment today) → **Wait, or Deploy Now?** (the position-aware whether/when question). The three escalate from general principle to personal plan to the timing-adjacent edge case, so they earn each other in that sequence; placing "Wait, or Deploy Now?" last is deliberate — it's the most timing-adjacent and lands best once the reader already holds the decisive-deployment default.

**Bull & Bear Cycles** (§35, shipped July 2026) sits alongside the applied-Numbers tier as the *temperament* page: it assumes the reader grasps the channel and the long-horizon recovery case, then frames the emotional/structural cost of holding through the swings (volatility ≠ risk, loss aversion, sizing as survival). It reads well **after The Bitcoin Horizon** (which supplies the "every hold recovered" reassurance this page depends on) and **before or beside How Much Bitcoin** (to which it hands the sizing calculation). Because it refuses to time the bottom, it is safe to place late without a reader mistaking it for a signal.

---

## 19. Bitcoin vs. The Stock Market (`/bitcoin-vs-the-stock-market.html`)

**Added:** May 2026. A decision-frame page for the bitcoin-vs-equities question, structured as a four-section progressive argument that uses the Power Law as the structural reference and the historical record as the stress test. Sits in The Numbers bucket per `_data/explorations.json` (`category: "numbers"`, `interactive: true`) and earns a Featured tile on `/calculators` via its `calculator_tile` block (the live-chart `mini-bvsm-chart` preview, anchor `#bvsmCalc`, position 2 alongside The Bitcoin Retirement at position 1). The previous "strict" inclusion criterion for /calculators (personal-decision tools only, requiring user-life inputs) was retired in the June 2026 data-driven refactor — BvSM's hypothetical-amount calculator now qualifies on the broader threshold of "interactive calculator worth surfacing on /calculators."

### Four-section progressive arc

The page reads as a single argument unfolding across four registers, each marked by a `.section-eyebrow` pill above its `h2` (see `STYLE_GUIDE §6.20`):

| § | Eyebrow | Section | Character |
|---|---|---|---|
| 1 | `FRAMEWORK` | The Power Law as cautionary tale | Visual + prose introduction to the model |
| 2 | `LOOKING BACK` | What the historical record says | Unified calculator (Lump sum / Weekly DCA toggle) |
| 4 | `LOOKING FORWARD` | The forward projection | Dual BTC trend-basis + current-price line vs S&P / NDQ |
| 5 | `TAKEAWAY` | The long-horizon argument | Synthesis, convergence sentence, methodology link |

The eyebrow pattern was introduced on this page; the four-step structure is reusable on any page with a present-tense argument that benefits from a past → future → synthesis arc.

### Editorial moves

- **Strict conservatism in §2.** The four preset entries (2013 top, 2017 top, 2021 top, 2025 ATH) are the *worst-case historical entries*. Annotating each with its multiple-of-trend (12.1× / 6.4× / 2.8× / 1.12×, via `STYLE_GUIDE §6.25`) makes explicit *how much more elevated* the earlier tops were than the most recent one — pre-empting the *"but those were different times"* objection by showing the reader the actual quantitative distance.
- **As-of callouts in §1 and §3.** Time-sensitive claims (*"bitcoin is currently 0.59× trend"*, *"trend value at today ≈ $138,580"*) are surfaced in dated callout boxes (`STYLE_GUIDE §6.21`) rather than buried in prose. Honest dating preserves editorial discipline as the page ages between refreshes; see `MONTHLY_REFRESH_CHECKLIST.md`.
- **Convergence sentence in §4.** *"Even at the 40-year horizon, bitcoin's trendline expected returns remain substantially higher than any conventional stock-market comparator."* This sentence is the page's load-bearing claim — it acknowledges that the gap narrows asymptotically (true, mathematically) while reasserting that the gap doesn't close for any reader's actual investing horizon (also true). Earlier drafts that tried to be more precise about convergence years ("around 2066-2080 for NDQ, ~2139 for SP") read as quantitative theater; the looser sentence does more honest work.

### Power Law cautionary tale viz (§1)

The §1 chart pairs the full nine-orders-of-magnitude price series with five cyclical-top markers, four floor markers, and a *"you are here"* pulse (`STYLE_GUIDE §6.23`) at the current `(TODAY_DAYS, TODAY_PRICE)` point. Two viewing modes — *All-time* and *Recent 2y* — switch via a time-range toggle (`STYLE_GUIDE §6.22`) so the reader can either see the structural argument or zoom into recent-cycle entry-quality context.

### Calculator (§2) — unified calc with two modes

Single calculator UI; *Lump sum* and *Weekly DCA* are selected via a Money-Trees-style yin-yang mode toggle (`STYLE_GUIDE §6.17`). The four cyclical-top presets and the start-date slider sit inside a unified `.start-input-group` enclosure (`STYLE_GUIDE §6.24`); selecting a preset sets the slider; moving the slider clears the active preset. Chart sits above the result cards (verdict + multiple-of-stock + multiple-of-trend); decision was made to put the chart first so the reader sees the shape before the numbers.

Removed in iteration:

- The earlier *Held N years* mode was dropped in favor of always-cumulative results — the *N years* framing turned into a partial-data hazard (a user could pick a long N that included only six months of actual data).
- A gold comparator was dropped from §2. Adding gold weakened the page's argument (which is *bitcoin vs equities*, not *bitcoin vs all alternative stores of value*); the cleaner pair was strictly stronger.

### Forward projection (§3)

Dual BTC line treatment — *trend-basis projection* (solid, starting from the Power Law trend price at TODAY) and *current-price projection* (dashed, starting from TODAY_PRICE itself, i.e., 0.59× trend at the time of writing). The dashed line is the honest *what if the current discount holds* baseline; the solid line is the *what if bitcoin returns to trend* central case. Both are plotted against S&P 500 TR (10.86% CAGR) and NDQ-100 TR (16.26% CAGR) projections from the same starting wealth.

### Page-specific design lessons (worth preserving)

- **Section eyebrows earn their place on long-scroll pages.** This page is 4,500+ words; the eyebrow pills make the four registers visually distinct so the reader can scroll-skim and know which kind of section they're in. On shorter pages eyebrows read as overdesigned (see `STYLE_GUIDE §6.20`).
- **As-of callouts are an editorial-honesty pattern, not a UI flourish.** They force the writer to keep present-tense claims accurate as the page ages — and they give the reader a reason to trust the dated claims more than the un-dated prose. Pattern reusable on any page making time-sensitive structural claims.
- **The "you are here" pulse beats chart annotations** when the *position relative to a structural envelope* is the editorial point. A static label competes with the price line for attention; a pulsing halo signals *attention here* without obscuring the data.
- **Strict conservatism framing.** When the comparison being made is "bitcoin vs X," and bitcoin has historically outperformed, the page is *automatically* vulnerable to the *"yeah but you cherry-picked"* objection. The defense isn't to argue against cherry-picking — it's to *pre-cherry-pick the worst-case*. The four cyclical-top presets in §2 are the worst possible entries; if bitcoin still wins from those, the page's argument survives the strongest version of the objection.

### Cross-linking

- **Related** (`§6.10`): cross-links to `the-power-law` (the growth model behind the projection), `the-bitcoin-retirement` (companion: *if this answers should I start, the Retirement page answers can I retire on it*), `bitcoin-vs-real-estate` (same comparison machinery, different decision frame), `disciplined-rebalancing` (the protocol layered on top once the position is established)
- The Power Law text in §1 hyperlinks to `/the-power-law.html` for users who want to drill into the model
- The §4 takeaway prose ends pointing forward into the Bitcoin Retirement page

### Open enhancements

- **Carousel slide (slide 16) — shipped May 2026.** Trees-in-meadow video landed in carousel position 16; see `§13` inventory and iteration record.
- **Heatmap visualization — shipped May 2026.** Initially deferred; now shipped both as an in-page §2 visualization on BvSM AND as a standalone `/heatmap` marquee page. See §20 below.
- **Live BTC price fetch (shipped 2026-05-28).** `TODAY_DAYS` and `TODAY_PRICE` now live in `shared/power-law-data.js`. `TODAY_DAYS` is computed at load, `TODAY_PRICE` seeds to the latest `PL_DATA` sample and is overwritten by the live CoinGecko spot via `fetchTodayPrice()` — one shared call across BvSM, the Power Law Channel, the Bitcoin Retirement, and Borrowing Against Your Stack so the four pages can no longer disagree on "today." Fallback is the latest `PL_DATA` sample (always self-fresh after the monthly refresh) rather than a separately-maintained constant. See `MONTHLY_REFRESH_CHECKLIST.md` (the "Why not live fetch" section is preserved in git history as the reasoning that was reversed).

- **Live-price labelling is canon — "live" NEVER labels a non-live value (fix 2026-07-13).** A user saw `/borrowing-against-your-stack` read *"Today (live): $71.9K"* while spot was ~$62K: the CoinGecko fetch had failed (429 / ad-block), the helper correctly fell back to the last `PL_DATA` sample (April 8, 2026), but every consumer kept the hardcoded **"live"** label — and the `source: 'live' | 'fallback'` flag the helper already passed was **unused by all of them**. The pre-resolve seed window had the same mislabel transiently. **Rule (canon):** the value is "live" ONLY on `source === 'live'`; the pre-resolve seed AND `'fallback'` are the latest monthly sample and must read *"latest monthly data"* (or an equivalent honest provenance). **One shared helper family in `power-law-data.js` — `todayPriceIsLive(source)`, `todayPriceLabel(source)` ("Today (live)" | "Today (latest monthly data)"), `todayPriceNote(source)` (inline suffix)** — is consumed by every price readout so the wording can't drift into hand-rolled variants again. **All 11 rendering consumers audited** (BAS Loan-Health caption, Disciplined Rebalancing channel caption, Gallery channel status, Bitcoin Fixed Income treasury "live" tag, BvRP ETI eyebrow, Wait-or-Deploy + Your-Deployment-Plan live meta, Lump-Sum-or-Ladder-In channel line, Bull & Bear live status, the Power Law status line, BvSM + Retirement chart captions). Non-rendering consumers (homepage ticker — no "live" word; allocation-sizing, how-much-bitcoin, BvRP calc chips — value-only, no liveness claim) were reviewed and left unchanged. **`fetchTodayPrice` now retries once after ~3s** before falling back, converting transient 429s into live values; the callback contract is unchanged. See `MONTHLY_REFRESH_CHECKLIST.md` §1 for the seed-freshness/fallback interplay (a stale monthly refresh degrades the fallback path first). Deferred (TECH_DEBT): a first-party price proxy to dodge ad-blockers/rate-limits entirely.

---

## 20. The Bitcoin Heatmap (`/heatmap.html`)

**Added:** May 2026 (commits `7f87e8` initial → `448c30` v2 full-canvas → `852c7b` v3 width+pattern-above → `5b6d7b` v4 no-scroll-on-click; subsequent refinement series `61361b` axis labels + mode-aware tooltip → `652471` palette + legend → `5a005a` polish → `5a3976c` view toggle / Period return vs Held to today). Standalone marquee page presenting the heatmap as the page-level argument — every monthly entry since 2010, every common holding horizon, in a single colored grid. Companion to the BvSM page's §2 visualization; the v3 redesign brought the wealth-over-time chart onto the standalone page below the heatmap so cell-click updates a chart in place rather than navigating away — the heatmap + chart pair together IS the page.

### What the page argues

A grid where rows are holding-period horizons (6mo / 1y / 2y / 3y / 4y / 5y / 7y / 10y, longest at top) and columns are entry months from 2010 to today. Each cell's color encodes BTC's outperformance multiple over the comparator (S&P 500 TR or NASDAQ-100 TR) for that (entry, horizon) window. The eye reads the staircase: dense bright orange across the top-left (long horizons + early entries = always wins by huge multiples), gradient through golden yellow to pale yellow as horizons shorten and entries get more recent, scattered red where short-horizon entries near cyclical tops haven't recovered yet. The page's takeaway lives in the pattern strip above the heatmap: at 4y+ horizons, bitcoin outperformed in 100% of cases (149 of 149 windows); at 7y, average outperformance is 164.5×; at 1y, bitcoin won in 74% of cases — *short-horizon entry timing matters; long-horizon entry timing doesn't*.

### Page architecture

The standalone page reuses the BvSM heatmap component — same JS (`bvsm.js` IIFE), same CSS (`bvsm-heatmap-*` selectors), same data pipeline. The standalone-specific layout is gated by a `.heatmap-standalone` class on `<main>`, which CSS overrides in `heatmap.css` use to:

- Move the pattern strip from a right-rail sidebar (BvSM behavior) to a horizontal label-block-above-grid layout
- Restructure the y-axis sticky-left wrapper to carry both the *"HOLDING PERIOD"* axis title (rotated -90°) AND the horizon labels, so both stay glued to the left edge during horizontal scroll on mobile
- Expand the grid to full canvas width on desktop (no horizontal scroll); preserve the BvSM-style fixed-cell-width + horizontal scroll on mobile
- Disable the cell-click `scrollIntoView` behavior that BvSM uses to bring the calc chart into view (irrelevant when there's no chart below)

### Interaction model

- **Click any cell** → loads the (entry, horizon) scenario into the wealth-over-time chart on the same page (v3 redesign, May 2026). On `/heatmap` the chart sits directly below the heatmap and updates in place; on BvSM the same JS targets the §2 calculator chart with the same effect. No page navigation in either context — the click is a chart-state update, not a route.
- **View toggle** (Period return / Held to today) — switches the cells between two outperformance interpretations. *Period return*: cell value = BTC outperformance over the cell's nominal window (entry → entry+horizon). *Held to today*: cell value = BTC outperformance from entry to today, for a continuous holder; all cells in the same entry-month column resolve to the same value. The wealth-over-time chart below the heatmap is always entry-to-today regardless of view (this is deliberate — see "View toggle" subsection below)
- **Mode toggle** (Lump-sum / Weekly DCA) — switches the entire grid between two outperformance interpretations
- **Comparator toggle** (S&P 500 TR / NASDAQ-100 TR) — switches the comparator series
- **Hover cell** → tooltip with: window header (view-aware) · BTC return · comparator return · price row(s) · outperformance multiple · "click to load" CTA

### View toggle (Period return / Held to today)

Added 2026-05-17 (commit `5a3976cce5`). The toggle exists because the default *Period return* view, while honestly measuring window-by-window outperformance, can mislead a reader whose actual alternative is *not holding any bitcoin at all*. A 6mo cell starting Oct 2019 shows red (BTC -24% vs S&P over those six months) — true within the window, but a user who actually entered Oct 2019 and is reading this page in May 2026 is up several-hundred percent on that entry. The *Held to today* view surfaces that long-term-thinking-wins framing without erasing the Period return view, which still tells the volatility-risk story honestly.

Mechanics: the cell-validity check uses the nominal horizon end in both views (so the grid structure is identical between modes — only colors change, not the shape of the grid). The Period view uses entry+horizon as the value endpoint; the Held view uses today (`maxWeekIdx`) as the value endpoint. In Held view, the row label becomes "intended commitment" rather than "actual exit" — all cells in the same entry-month column resolve to the same value, producing a 1D-ribbon-shaped reading inside the 2D grid. JM accepted this flatness as the message: long-term entry timing has rewarded patience across nearly every starting point.

Sidebar text branches on view: Period mode keeps the three original bullets (100%-wins horizon, 7y average outperformance, 1y honest-disclosure). Held mode shows two bullets — *"Held to today, bitcoin outperformed [cmp] in X% of monthly entries since 2010"* and *"Average outperformance from entry to today is M×."* The 6mo row's stats drive both bullets (longest history of valid entries).

Tooltip head text branches on the cell's `data-view` attribute: window mode keeps the original `start → end · horizon` head; held mode shows `start → today · held through`. All other tooltip rows (BTC return, comparator return, entry price, outperformance, CTA) use the cell's currently-computed values, so they update automatically.

Editorial design call: the wealth-over-time chart below the heatmap stays entry-to-today regardless of view. When the heatmap is in *Period return* mode, the cell measures one window while the chart shows what happened next — that tension is itself part of the lesson (windowed risk vs long-run reward). When the heatmap is in *Held to today* mode, the chart matches the cell's framing — both are entry-to-today.

### Mode-aware tooltip price row

The tooltip's price row is mode-conditional:

- **Lump-sum mode:** single row, `Entry price: $X` where X is `weeklyBtc[startW]` — the BTC price at the start of the window. This is what the lump-sum buyer actually paid; matches the row's window header and the x-axis column for that month.
- **Weekly DCA mode:** TWO rows, `Entry price: $X` AND `Avg buy price: $Y`. Entry price is the same start-date BTC price (so the user can mentally compare to the lump-sum counterfactual); Avg buy price is the arithmetic mean of weekly BTC prices across the window (which IS the cost basis under uniform $1/week contributions). Showing both surfaces the front-loading trade-off: for long rising windows entry << avg buy, which is the visual signature of *"lump-sum would have beaten DCA across this same window."* For falling/sideways windows the two are close, or entry > avg buy, which means DCA reduced the cost basis below the lump-sum entry point.

Implementation: every cell carries `data-entry-btc`, `data-avg-btc`, AND `data-mode` attributes; the tooltip handler reads `data-mode` and branches on which row(s) to render. `entryBtc` is part of `hmCellValue`'s return object in both modes (cheap to compute; `weeklyBtc[startW]` is already in scope).

### Color palette

Six-tier solid-color palette mapped from outperformance multiple. Documented canonically in `STYLE_GUIDE §3` — "Heatmap tier palette (canonical)". Synced across three files (`bvsm.js` hmColor, `bvsm.css` legend swatches, `calculators-minis.js` tierColor in the /tools mini-heatmap renderer).

### Editorial moves

- **"red means it lost (so far)"** — the subtitle frames any loss cell as a window-bounded outcome, not a verdict. Two-word editorial nod that the long-term Power Law trajectory keeps going regardless of any single short-horizon loss. Distinguishes a loss WINDOW (which the cell shows) from a permanent loss (which would be a different and stronger claim).
- **Axis labels (rotated y-axis title, x-axis title with directional arrow)** — added 2026-05-17 after JM noted "what are the rows and columns" wasn't obvious without explicit labels. *HOLDING PERIOD* runs vertically along the y-axis (writing-mode: vertical-rl + transform: rotate(180deg) to read bottom-to-top); *ENTRY MONTH →* sits horizontally centered below the year ticks. Both in small caps Inter, dim color, so they read as axis annotation rather than competing chrome.
- **Mode/comparator metadata grouped with the panel title** — the pattern strip's *LUMP-SUM · VS S&P 500 TR* footer sits directly beneath *THE PATTERN* title rather than floating in the far-right corner (where it was in v1). Co-locating title + its metadata is cleaner info hierarchy.

### Cross-linking

- The BvSM page's §2 heatmap section uses the same component; clicking a cell on either heatmap updates the wealth-over-time chart on the same page (no navigation in either context — that was a pre-v3 design that v3 replaced with in-place chart updating)
- Listed as a featured tile on `/calculators` (Tools index) with a live mini-heatmap preview
- `og-heatmap.jpg` is the dedicated OG card — product-forward (§6.15.2), regenerated via `npm run build-ogs` (`scripts/build-og-images.py`)

### Open enhancements

- **OG image regeneration cadence.** The heatmap OG embeds a screenshot of the live grid; when new monthly data lands (per `MONTHLY_REFRESH_CHECKLIST` §6), the OG goes slightly stale. Refresh with `npm run build-ogs` after each monthly data refresh — covered in the checklist.

## 21. Borrowing Against Your Stack (`/borrowing-against-your-stack.html`)

**Added:** May 2026 (initial build → ongoing refinements; closed as feature-complete in commit `01d8f35` 2026-05-17). A four-tab supplemental page exploring the borrow-against-bitcoin path as an *honestly-framed alternative to selling*, with HODL as the legitimate baseline and the structural risks made fully visible. Sister page to The Bitcoin Retirement (`/the-bitcoin-retirement.html` §17) — Retirement is the primary decision frame; BAS is one of three strategies the Strategies tab points at, here given its own dedicated surface with proper editorial weight.

### The page's editorial frame

The hero subtitle anchors the whole page: *"Bitcoin as collateral instead of selling it — with HODL as the legitimate baseline and the structural risks made fully visible."* The premise the page argues against is the reflexive *"borrowing against bitcoin is anti-ethos"* dismissal — the page's first H2 (*"Compared to what?"*) reframes the comparison: when the alternative is *selling part of your stack to fund a genuine life-event need*, the borrow-and-retain path deserves careful evaluation against its actual risks, not against a strawman of irresponsibility. The framing essay is honest about the failure cases (Celsius, BlockFi) and the lender-counterparty taxonomy that determines what kind of risk you're actually taking.

### Tab structure

| Tab | Character | Content |
|---|---|---|
| I. The Question | Editorial prose | 9 H2 sections: "Compared to what?", what this page actually is, what we recommend / don't, tactical vs strategic uses, the four lender categories, rehypothecation as the single biggest variable, the cautionary record (Celsius / BlockFi / Genesis / Voyager), when borrowing makes sense, what HODL actually wins |
| II. Loan Health | Tool-led | Liquidation-on-Power-Law-channel viz + LTV / liquidation-price / channel-position / interest-burden outputs |
| III. Borrow vs. Sell vs. HODL | Tool-led | Three-path comparison surface over a chosen horizon, including capital-gains tax math on the Sell path |
| IV. The Math | Specification-led | Bitcoin 4-year rolling CAGR vs lending-rate bands chart, with Power Law trend CAGR overlaid |

A persistent *"FOR EXPLORATION ONLY"* disclaimer banner sits between the hero and the tabs — financial-advice disclosure given the page's interactive surfaces deal in real loan figures.

### Loan Health tab — the risk surface

Inputs (5):

| Input | Type | Default | Range |
|---|---|---|---|
| BTC stack | number | 1.0 | 0–100000 |
| Current BTC price (USD) | number | live (PL_DATA fallback) | 0–100000000 |
| Loan amount (USD) | number | 10000 | 0–1000000000 |
| Liquidation threshold (LTV) | range slider | 80% | 70–95% (step 1) |
| Interest rate (APR) | range slider | 10.0% | 2–20% (step 0.5) |

Outputs: current LTV with zone-tier badge (good / caution / warning), liquidation price + drawdown distance from current price, channel position (where current price sits inside the Power Law channel: trough / floor-adjacent / mid-channel / trend-adjacent / peak), monthly + annual interest burden.

The signature visual is `basChannelChart` — a log-scale Power Law channel with the current-price marker plotted at `(TODAY_DAYS, current_btc_price)` and a horizontal red dashed line projected forward at the liquidation price. The vertical distance between current-price and liquidation marker IS the structural buffer; if the liquidation marker sits BELOW the Power Law channel floor, bitcoin would need to break its long-term structural support before liquidation triggers — the visual makes that buffer instantly readable.

### Borrow vs. Sell vs. HODL tab — cross-strategy comparison

Three-path comparison over a user-chosen horizon (1–15 years). Inputs: stack, current BTC price, loan amount (the dollar need being funded, identical in both Borrow and Sell paths), interest rate, horizon, cost basis, capital-gains rate (0–40% slider). Outputs: end-of-horizon wealth for each path, expressed in BTC terms at trend price plus USD.

The HODL path is the baseline — it doesn't fund the dollar need but preserves the most wealth by definition. The Borrow path takes a loan and repays at horizon. The Sell path crystallizes BTC at today's price to fund the need (with capital-gains tax applied). The HODL path quantifies the *wealth cost of any active decision*; the borrow-vs-sell comparison answers *which of the two active paths is cheaper if the dollar need is real*.

Future BTC price is the Power Law trend at end-of-horizon — central-tendency expectation, not a forecast. The page is explicit about this in tooltip prose. Exceeds the §4.2 design-spec requirement for *"an honest comparison surface against sell-as-needed at the same inputs"* — the three-path comparison adds the do-nothing baseline that makes both active paths' costs legible.

### The Math tab — CAGR-vs-rates chart

`cagrVsRatesChart` displays two stories simultaneously:

1. **Power Law trend CAGR** (dashed amber) — what the model predicts the growth rate to be from the channel position, independent of where current price sits inside the channel.
2. **Realized 4-year rolling CAGR** (solid amber) — what bitcoin actually did over each trailing 4-year window.

The gap between them = how far below (or above) trend bitcoin's price sat at each historical point. Lending-rate bands (typical 8–14% range) are overlaid as horizontal reference lines. The chart's pedagogical move: even at bitcoin's worst realized 4-year CAGR over the past 8 years, the rate sat above the upper edge of the lending-rate band — which is the structural argument for why a loan at trend-implied growth is *not absurd*, even granting realized-vs-trend gaps.

All-time / Recent 2y axis toggle (`STYLE_GUIDE §6.22` pattern). Computed from `PL_DATA` at page-load time so the trailing edge stays fresh with each monthly data refresh.

### UX design choice: dollar inputs over percentage sliders

The `RETIREMENT_CALCULATOR_DESIGN §4.2` spec proposed `"25% LTV slider (sliderable to 50%) + % of stack borrowed slider (default 100%, sliderable to 0%)"`. The actual UX took a different shape — **dollar-denominated loan amount + liquidation-LTV slider** — for two reasons. First, *users thinking about borrowing have a dollar number in mind*, not a percentage; *"I need $50K for a remodel"* is a more concrete entry point than *"I want to borrow X% of my stack at Y% LTV"*. Second, the **liquidation LTV** (default 80%, 70–95% range) is the lender-determined variable that actually controls risk — the origination LTV is the *output*, derived from `loanAmount / (stack × price)`. Putting the lender's liquidation threshold on the slider and origination LTV in the output zone matches the actual mental model. Math is equivalent to the spec; the framing is more user-honest.

### Editorial moves

- **The four-lender-category taxonomy.** Tactical insight: lenders aren't fungible. The categories (rehypothecating CeFi, non-rehypothecating CeFi, DeFi over-collateralized protocols, self-custodied collateralized loans) carry different risks, and *rehypothecation is the single biggest variable* — the next H2 spells out why. Editorial gold that other content doesn't articulate clearly; preserved here as the structural argument for choosing carefully.
- **"The cautionary record."** Names Celsius / BlockFi / Genesis / Voyager explicitly. Refuses to soft-pedal: borrowers in those failures didn't lose only their collateral; they lost their *over-collateral* (the BTC that was supposed to be safely securing the loan). Rehypothecation explains the mechanism.
- **HODL as the legitimate baseline.** Most strategy-comparison content treats sell-as-needed as the default and asks *"is borrow better?"* — this page treats HODL as the default and asks *"is borrow better than selling, given the dollar need is real?"* That re-baselining is the page's central editorial move.
- **"FOR EXPLORATION ONLY" disclaimer banner.** Dismissible (✕ button) but persistent across reloads via sessionStorage. Surfaces the financial-advice non-claim without being preachy.

### Cross-linking

- `/the-bitcoin-retirement.html` §17 references borrowing-against-the-stack in its Strategies tab; the deep-link from Retirement points here as the dedicated treatment
- `/disciplined-rebalancing.html` is a *mirror* surface — DR is *sell-to-rebalance at high channel positions*, BAS is *borrow-to-avoid-selling*; together they cover the two active-management strategies inside the Power Law frame, with HODL as the third-and-default no-action baseline
- `og-borrowing-against-your-stack.jpg` is the dedicated OG card — brand-forward family aesthetic per `STYLE_GUIDE §6.15.1` (Cormorant title with italic-amber *"Borrowing"*, atmospheric ₿ glyph, italic subtitle, brand mark)
- Featured tile on `/calculators` (Tools index)

### Print output

Added 2026-05-18. `Cmd/Ctrl+P` produces a single-page PDF of the Loan Health tab: header strip (brand + URL + date) → page title → inputs table (5 rows: Bitcoin stack, current BTC price, loan amount, liquidation threshold, interest rate) → `basChannelChart` (Power Law channel with current-price marker and liquidation horizontal line) → outputs summary table (current LTV with zone, liquidation price + drawdown, channel position, monthly + annual interest with annual-%-of-stack) → disclaimer footer.

Pattern is the canonical `STYLE_GUIDE §6.16` (second use after `/the-bitcoin-retirement`). Two `print-only` blocks bracket the on-screen calculator inside `#tab-loan-health`; the chart stays visible in print, the screen input controls and output panels are hidden. JS `bindPrintPopulation()` runs on `beforeprint` *and* once at load (Safari-mobile fallback). The on-screen state is the source of truth — current slider values and computed output spans are read directly.

**Scope note.** Print scaffolding lives only on the Loan Health tab. Borrow vs. Sell (III) and The Math (IV) tabs degrade to printing their on-screen content with global chrome hidden — functional but lacks the dedicated header + summary-table treatment. Multi-tab print coverage is tracked as a follow-up in TECH_DEBT; trigger is a user wanting to print a Borrow-vs-Sell scenario specifically.

### Scenario carry-over from /the-bitcoin-retirement

Added 2026-05-18. BAS reads the canonical scenario-carry-over schema documented in §17.5 above. In v1, only the `stack` param is *used* — BAS's other inputs (loan amount, liquidation threshold, interest rate) are BAS-specific and don't map to any Retirement state. Unknown params are preserved on the URL so navigating back to `/the-bitcoin-retirement` (or any other sibling) sees the full scenario state.

The receiver lives inside the BAS calculator IIFE, between the element-reference declarations and the cost-basis-preset block. It runs *before* the first `recompute()` so the override value is used in the initial render — no event-dispatch race with the input wiring.

## 22. Living on Bitcoin (`/living-on-bitcoin.html`)

**Added:** May 2026. A four-tab supplemental page on the *practice* of holding operating cash in bitcoin and paying fiat bills as they come due. Positioned editorially as "icing not the cake" — explicitly secondary to the Retirement and BAS pages where the real economic case for bitcoin lives. The page is honest that the practice is values-aligned and modestly economic rather than wealth-building.

### The page's editorial frame

The hero subtitle anchors the position: *"Holding operating cash in bitcoin and paying fiat bills as they come due — a values-aligned practice with modest economics and real friction."* The Question tab leads with "a practice, not a strategy" — distinguishing this page from Retirement (the wealth-building surface) and BAS (the access-without-selling surface). The editorial position is *skeptical-but-values-respectful*: the economic case is real but small, eaten by friction; the psychological case (unit-of-account shift, bitcoin-as-money normalization) is what most practitioners actually come for, and the page does not pretend otherwise.

### Tab structure

| Tab | Character | Content |
|---|---|---|
| I. The Question | Editorial prose | 6 H2/H3 sections: practice vs strategy, economic case eaten by friction, the psychological reason, three honest costs (conversion drag, tax-event load, drawdown sequence), who this is for / isn't for, where-to-go bridge |
| II. The Tools | Categorical survey | 4 categories (conversion service, bitcoin-back card, dedicated paycheck router, Lightning rail) with brief named examples (Strike, River, Swan, Cash App, Gemini, Coinbase One, Fold, Bitwage) and honest tradeoffs; not a comparison matrix |
| III. The Calculator | Tool-led | Float-vs-friction wealth comparison over user-chosen horizon, with drawdown stress test |
| IV. The Math | Specification-led | Formulas, HIFO holding-period assumption, de-minimis approximation, what's not modelled |

### The Calculator — wealth comparison surface

Inputs (7):

| Input | Type | Default | Range |
|---|---|---|---|
| Cash float held as bitcoin (USD) | range slider | $5,000 | $1,000–$50,000 (step $500) |
| Monthly bills paid from bitcoin (USD) | range slider | $2,000 | $0–$10,000 (step $100) |
| Horizon (years) | range slider | 5 | 1–10 (step 1) |
| Conversion fee per side (%) | range slider | 1.0% | 0.4–3.0% (step 0.1) |
| Capital gains tax rate (%) | range slider | 22% | 0–37% (step 1) |
| Bitcoin annual growth (%) | range slider | 25% | 0–50% (step 1) |
| De-minimis exemption | toggle | Off | on/off |
| Drawdown stress year | range slider | 3 | 1–10 (step 1) |

Outputs: net differential (LoB wealth minus cash baseline, after fees and taxes) as the headline number, cumulative conversion fees, cumulative tax events, gross appreciation (pre-friction), net of friction, drawdown stress end-state with delta vs cash baseline.

The signature visual is `lobChart` — a three-line chart over the horizon showing the flat cash baseline (dashed gray), the LoB net-of-friction trajectory (solid orange), and the drawdown stress overlay (dashed red, dropping 50% at the chosen year and resuming compounding from the new floor).

### The math model

Under steady-state refilling, the BTC quantity held stays constant at *B/P₀* — each month the user sells $M of BTC for bills and buys $M of BTC from paycheck. The dollar value of the float compounds at growth rate *r*. Friction comes in two channels: conversion fees (`2 × 12 × M × f/100` per year) and tax events on conversion gains.

Under HIFO with monthly cadence, sold lots are very recently bought, so per-dollar gain is small (≈ *r*/12) and annual taxable gain ≈ *M × r*. This makes the tax friction *modest at typical bills*. The de-minimis toggle zeros this out for monthly bills under $200 per transaction (PARITY-style approximation). The drawdown stress test applies a single 50% shock at end of chosen year, with recovery and continued compounding thereafter — the point isn't realistic vol modelling, it's a single visual answer to "what if I'm unlucky?"

The model is intentionally simpler than the Retirement Power Law projection or the BAS borrow-vs-sell comparison. Living on Bitcoin is a marginal economic play, and higher-fidelity math would be precision theater. The Math tab spells out the simplifications and what's not modelled.

### Editorial moves

- **"Icing not the cake."** The page's central editorial frame. Most "live on bitcoin" content treats the practice as a wealth-building strategy; this page explicitly says it isn't, and points the reader to the Retirement and BAS pages for where the real economic case lives. Honesty earns trust on a topic where most content is promotional.
- **Psychological dimension foregrounded.** §3 of Tab I ("The reason this practice exists anyway") names the unit-of-account shift and identity payoff as the *actual* reason most practitioners do this. The page assumes the reader is sympathetic enough to bitcoin to value the practice for its own sake, not just its economics.
- **Tax recordkeeping reframed.** §4 of Tab I refuses to pretend the user can do hand-tracking — instead names the services (Strike, Swan, River, Fold) that handle it via 1099-DA at year-end. Honest about the friction without making it the reader's pencil-and-paper problem.
- **De-minimis horizon noted but not load-bearing.** The PARITY/Lummis legislation is mentioned in both Tab I and the Calculator's de-minimis toggle, but the page is written to today's law. Avoids the trap of "if this passes, then..." reasoning that ages badly.
- **Strike/XXI/Elektron merger as italicized aside.** Tab II mentions the proposed April 29, 2026 merger inside the Strike tool card as an italicized note, deliberately marking it as a moving piece that may need refresh. Doesn't lean on the merger as load-bearing context.

### Modeling assumptions integration

The BTC growth slider reads its initial value from `ModelingAssumptions.get('btcGrowthModel')` via a simple preset-to-approx-rate translation (`powerlaw-trend → 30%`, `powerlaw-floor → 20%`, `linear-cagr-decay → 15%`). The slider becomes the source of truth once the user touches it; subscribes to `*` changes so any sitewide preset change re-syncs the slider value. This is a simplified treatment compared to the Retirement page's full Power Law trajectory — appropriate for this page's "directional honesty not financial-plan accuracy" register.

### Cross-linking

- `/the-bitcoin-retirement.html` §17 and `/borrowing-against-your-stack.html` §21 are the primary wealth-building surfaces; this page links them in the hero subtitle and in Tab I §1 and §5 as "where the real economic case lives"
- `/disciplined-rebalancing.html` is referenced in the `related` block as the inverse-side sibling
- `/the-power-law.html` is referenced as the growth-model basis for the Calculator's BTC appreciation assumption
- Featured tile on `/calculators` (Tools index) — added via `_data/explorations.json` entry in the `numbers` category, after BAS and before bitcoin-backed-mortgages

### Future work

- **OG image.** Skipped for v1 to keep the build focused. Pattern is `STYLE_GUIDE §6.15.1` brand-forward family aesthetic; tracked in TECH_DEBT.
- **Print stylesheet.** Not in v1. Pattern would mirror `STYLE_GUIDE §6.16` from Retirement / BAS — Cmd+P produces a single-page PDF of the Calculator scenario with inputs table and chart. Lower priority than the Retirement / BAS prints because Living on Bitcoin is less likely to be shared as a printout.
- **Card-rewards modeling.** The Calculator omits the bitcoin-back-card layer. For most card-using practitioners, rewards add 0.5–2% of card-charged spend per year — modest but real. A future enhancement could add a card-rewards slider and roll the accumulated rewards into the LoB total.
- **Long-term capital gains transitions.** Under HIFO with monthly cadence, most lots are short-term, but a small fraction may straddle into long-term territory. Not modeled in v1.

---

## 23. Bitcoin Defined (`/bitcoin-defined.html`)

**Added:** earlier (pre-May 2026, as essay format). **Rebuilt as carousel:** May 2026. A Foundations page that defines Bitcoin in a single sentence and unpacks each of its eight load-bearing ideas one at a time. Sits in the Foundations bucket per `_data/explorations.json` (`category: "foundations"`, `interactive: true`; no `calculator_tile` block — it's not a calculator).

### Editorial framing — definition, not argument

This page's job is narrower than its siblings: fix what is meant when someone says *Bitcoin*. It does not argue for Bitcoin's value, predict adoption, or claim the components are individually necessary (that last argument is the **Synthesis** page's whole thesis, made over six different components — repeating it here would blur the distinction). The closing reflection makes the role-differentiation explicit: *"This is a definition, not yet an argument. What follows from the definition lives elsewhere on this site."*

### The sentence

> The Bitcoin *network* is the *open*, *permissionless*, *decentralized*, *secure* *protocol* — *bounded by energy*, *absolutely scarce*.

Six single words plus two phrases ("bounded by energy", "absolutely scarce") = **eight load-bearing ideas**. UI throughout the page calls these "ideas" — earlier copy used "words" but that undersold the framing and was technically inaccurate for the two phrases. Extends Jeff Booth's original phrasing of Bitcoin as *"an open, permissionless, decentralized, secure protocol bounded by energy that couldn't be changed by governments,"* with two additions: *network* prepended (topological frame) and *absolutely scarce* appended (supply property). Booth credit is preserved in the citation block below the final reveal.

### Carousel interaction (STYLE_GUIDE §6.27)

The page uses the **sentence-as-navigation carousel** pattern (`STYLE_GUIDE §6.27`). The sticky sentence at the top doubles as navigation — each of the eight terms is a clickable span. A single explorer card sits below the sentence; content swaps in place via a brief opacity fade when the reader navigates. Prev / counter / Continue controls in a fixed position below the card. Keyboard arrows also work.

Three navigation paths:
- **Sentence-word click** — direct random access to any of the 8 ideas
- **Continue / Previous** — linear traversal. Continue label stays "Continue →" on the last card (not "Complete") — relabeling to "Complete" risked readers deciding they were done and not clicking through to see the final lit-up sentence reveal
- **Keyboard** — Arrow Left / Right; Enter / Space on a focused sentence-word

URL hash mirrors the current idea (`/bitcoin-defined#decentralized` deep-links into that card). Back/forward buttons navigate between visited ideas.

### Visual treatment

Each idea has a Grok-generated 1280×720 atmospheric photograph at repo root (`bd-network.jpg` through `bd-absolutely-scarce.jpg`). All eight cards ship with real photography as of May 2026.

Image curation reading:
- **Network** — sandhill cranes in shallow water (collective behavior; only living-being image, acceptable outlier)
- **Open** — natural sea arch (an opening formed by elemental forces, not gatekept)
- **Permissionless** — winding path through tall grass (organic emergence, no toll)
- **Decentralized** — ancient olive grove (gnarled trees, distributed, none dominant)
- **Secure** — stratified rock cliff (immutable geological layers)
- **Protocol** — Roman aqueduct (repeating arches read as blocks; civilizational endurance)
- **Bounded by energy** — embers with small live flame (past work crystallized into structure + present work still expending — represents ongoing PoW, not "completion")
- **Absolutely scarce** — full moon over calm dark sea (singular, eternal, impossible to mint another; the only cool-tone-anchored image in the set, with a warm amber-rose horizon band bridging back to the seven warm cards so it doesn't feel tonally orphaned)

### Cross-linking

- `/synthesis.html` is the bidirectional companion — Synthesis names the six components; Bitcoin Defined names the eight ideas; same system, two angles of approach
- `/what-money-has-to-be.html` — the requirements side of the definition (why these properties matter)
- `/what-bitcoin-is.html` — the dimensional companion (asset / network / technology / money)
- `/the-bitcoin-migration.html` — the practical question that follows once the definition lands

All four companions have reciprocal `related:` entries pointing back to Bitcoin Defined.

### Future work

- **Dead CSS cleanup.** The carousel rebuild left harmless dead CSS rules from the prior stacked-cards design (`.bd-card-cta-wrap`, `.bd-card-cta`, `.bd-card-revealed-marker`). Tracked in TECH_DEBT §6 for a follow-up sweep.

### Recently closed

- **Card 8 image (Absolutely Scarce)** shipped May 2026 (commit `7ea1725`). Moon-over-calm-sea Grok-generated photo wired in; the eight-card set is complete on the photography axis.
- **Homepage carousel slide** shipped May 2026. 10-second silent embers video animated from Card 7's still composition; caption "Define it. Then debate it." Slide is row 21 in the carousel inventory. Iteration record (candle-simile failure → wood-fire revision) in `SITE_GUIDE §13`.

---

## 24. Bitcoin and Fixed Income (`/bitcoin-fixed-income.html`)

**Display title renamed June 2026** from "Bitcoin Fixed Income" → **"Bitcoin and Fixed Income"** (honesty fix: the old name implied bitcoin has an inherent fixed-income/yield component; it doesn't — the page is about bitcoin *and* the fixed-income question). The change is display-only: nav label (registry `title` in `explorations.json`), `<title>`/OG/Twitter titles + alts + JSON-LD `name`, homepage carousel label, homepage concept card, and the `updates.json` entry. **The slug stays `/bitcoin-fixed-income`** — renaming a live slug would need a 301 and break inbound links/SEO; `slug ≠ title` is fine. The editorial **page H1 remains "The Income Question"** (it never carried the misleading phrasing). Nav home: The Numbers → *Living on Bitcoin* group (see §30). OG card `og-bitcoin-fixed-income.jpg` regenerated with the new title at the same filename (registration unchanged).

**Added:** June 2026. The income-instrument decision page. Asks the structurally honest question about bitcoin-backed preferreds (STRC, SATA) and conventional fixed income: when do these actually beat just holding bitcoin? Editorial register is essayistic — five tabs of structured argument with a calculator as one tab among five, not the hero.

### Tab structure (5 tabs)

| Tab | `data-tab` | Notes |
|---|---|---|
| The Income Question | `question` | The framing tab. Opens with the structural argument for *why* a bitcoin-anchored portfolio might want cashflow today. Default tab. |
| The Instruments | `instruments` | Concrete instrument inventory: STRC (Strategy 11.5% ROC), SATA (Strive 13% ROC), 10yr Treasury, IG Corp. Capital stack diagram placeholder. |
| The Mechanism | `mechanism` | How the mNAV+ATM machinery works — corporate side. Acknowledges this is the engine, not magic. |
| The Calculator | `calculator` | Interactive head-to-head. Income path vs sell-as-needed bitcoin, with stress overlays (Base / Mild / 2008 mREIT-style / Bitcoin winter) and three Power-Law-anchored growth scenarios (Stay / Revert to trend / Reach upper channel). |
| The Risks | `risks` | The bear case for the bear case. Where the mechanism can fail — bitcoin winter, ATM channel closure, structural arrears, dividend-rate spiral. |

### Editorial moves worth preserving

- **The Tab IV reframing.** Title is *"Where the income path actually wins — bitcoin-backed preferreds as bear-case insurance"* — not "wealth maximization." This was the single most consequential editorial decision. Under base-case bitcoin growth, just holding bitcoin wins on terminal wealth, comfortably, at any reasonable Power Law assumption. The honest case for the instruments isn't beating bitcoin; it's: bear-case insurance, volatility elimination, and tax-efficient cashflow *today*. The intro prose, the chip framing, and the dynamic verdict logic all align to this thesis.
- **Bitcoin winter not crypto winter.** Site-wide convention avoids the word "crypto" because it tends to legitimize the broader crypto space. Stress preset display name + Tab V prose both use "Bitcoin winter"; internal `data-preset="winter"` key unchanged for forward-compat.
- **Verbatim BvRP growth-scenario language.** The three growth chips (Stay at current trend multiple / Revert to Power Law trend / Reach Power Law upper channel) carry the exact tooltip text used by Bitcoin vs Rental Property. Same Power Law model + same canonical phrasing = cross-page consistency.

### Calculator architecture

- **Power Law shared module.** Reads from `/_pageassets/shared/power-law-data.js` for `TODAY_PRICE`, `TODAY_DAYS`, `PL_A`, `PL_B`, `plPrice(days)`. Single source of truth — same as BvRP, BvRE, Bitcoin Retirement, Disciplined Rebalancing, the-power-law itself. Monthly PL_DATA refresh automatically updates this page; nothing here needs touching.
- **Entry-conditions indicator.** Top of calculator surfaces `BTC TODAY 0.XX× trend` (static — fact about today's price) and `INCOME PATH'S CASE IS [weaker / fair / stronger]` (dynamic — comparison of income vs bitcoin end-of-horizon real wealth). The verdict responds to scenario + stress + horizon, not just the static multiple. At default settings (15yr, no stress) it reads *weaker*; at Bitcoin winter + 4yr horizon it flips to *stronger*.
- **BvRP-pattern slider rows.** Label + formatted-value above, slider below — eliminates the input crowding that the older two-column input pattern caused.
- **CSS subgrid for spectrum cards.** Cross-column row alignment via `display: contents` on the inner UL. Canonical pattern for any 3-column spectrum where corresponding rows across columns should align baselines.

### Cross-linking

The page has five reciprocal `related:` companions (each pointing in both directions):

- `/the-bitcoin-migration` — the structural argument for why conventional fixed income destroys purchasing power; foundation BFI rests on
- `/the-bitcoin-retirement` — the sell-as-needed path; the long-horizon comparison the BFI calculator references
- `/borrowing-against-your-stack` — the individual-lending alternative; same broad objective, opposite side of the same balance sheet
- `/bitcoin-vs-rental-property` — where the yield-instrument question first surfaced on the site
- `/the-power-law` — the growth model the calculator uses

### Open enhancements

- **Drawdown threshold sourcing.** Tab II's $33K (-47%) and $21K (-67%) drawdown thresholds were verified arithmetically (the $21K = 1× coverage threshold, the $33K = 2× coverage threshold, both against the ~$54B asset pool and the $7.98B + $10.49B claim stack above + including STRC). A short methodology footnote linking to the calculation would be a nice-to-have.
- **§6.26 full-component alignment.** Current share UI is a simplified single-action variant ("Copy share link" only). Aligning to the full two-group `share-section` component used by Retirement / DR / BvRE / BAS would add X/LinkedIn/Facebook social-promotion buttons. Not urgent; the layout-level "Share this page" surface from `base.njk` already covers public promotion.
- **Multi-tab print scaffolding.** Print stylesheet currently uses the lighter CSS-only variant (STYLE_GUIDE §6.16) scoped to the Calculator tab. Other tabs print on-screen content with site chrome hidden — functional but lacks curated print layouts. Right answer if needed: per-tab print-only blocks per the §6.16 two-block pattern. Trigger is a user wanting to print the Risks tab specifically.

### URL schema (scenario sharing)

Six dimensions of calculator state are carried in the URL query string per the canonical convention (SITE_GUIDE §17.5):

| Param | State key | Type | Default | Domain |
|---|---|---|---|---|
| `in` | `incomeNeed` | number | 60000 | 10000–500000, step 5000 |
| `po` | `position` | number | 1000000 | 100000–10000000, step 50000 |
| `hz` | `horizon` | number | 15 | 1–30 |
| `sc` | `btcScenario` | enum | `trend` | `stay` \| `trend` \| `upper` |
| `pa` | `incomePath` | enum | `strc` | `strc` \| `sata` \| `treasury` \| `igcorp` |
| `st` | `stressPreset` | enum | `base` | `base` \| `mild` \| `mreit` \| `winter` |

Defaults are omitted from the URL — a clean `/bitcoin-fixed-income` represents the default scenario. The decoder applies overrides via the existing slider/chip click handlers before the first render so all side effects (active class, stress-preset table values, etc.) fire correctly. `recalc()` debounces a `history.replaceState` write at ~250ms so dragging a slider doesn't hammer the browser's history API. Advanced state fields (`taxBracket`, `ltcgRate`, `inflation`, `preferredTaxTreatment`) are intentionally NOT in the URL — they're modeling assumptions, not scenario inputs.

Example: `/bitcoin-fixed-income?in=120000&po=3000000&hz=20&sc=upper&pa=sata&st=mreit` decodes to $120k annual income on a $3M position over a 20-year horizon, Upper-channel growth, SATA path, with 2008-mREIT-style stress overlay.

### Recently closed

- **Strategy (MSTR) at a glance indicator** (June 2026, Tab II). Snapshot card placed above the capital structure diagram providing factual ground-truth for the analysis. BTC count (845,256) verified live from CoinGecko's `public_treasury` endpoint and used to compute a live treasury USD value via the shared `TODAY_PRICE`. mNAV (~1.7&times;), shares outstanding (~282M), and ATM issuance status are snapshot values refreshed monthly per MONTHLY_REFRESH_CHECKLIST &sect;7. The mNAV and ATM ISSUANCE labels carry `.help-tip` `?` indicators (site-wide tooltip convention, matched against the calculator-tab pattern) with definitions of each term, and a "Reading right now" insight callout below the data grid translates the snapshot values into an interpretation of Strategy's current accumulation mode. The ticker `(MSTR)` is included in the eyebrow title to disambiguate from generic prose use of "strategy" elsewhere on the site.
- **Homepage carousel slide** (June 2026). Autumn-forest stream cascade — a moss-edged natural stone weir across a forest stream, water flowing gently over the top in a thin continuous sheet, calm pool gathering behind, leaves drifting at the edges. Caption: *"High yield, without bitcoin's volatility."* Placed in the carousel between Bitcoin vs. Rental Property and Bitcoin and The Power Law so the two income-comparison pages sit together before the main argument flow resumes.
- **Iter B — BvRP `#calc-current-multiple` desync** (June 2026). BvRP's ETI card subscribed to `fetchTodayPrice` and showed the live CoinGecko spot (e.g. 0.45×); the chip-picker's readout did not subscribe and stayed on the seeded fallback (e.g. 0.51×). Five-line patch: chip-picker `renderCAGRChips(state)` now also subscribes to the live-fetch callback. Both indicators now read the same `TODAY_PRICE` global. Pattern banked: when adding live-price-dependent readouts on a page, each must subscribe to the fetch callback explicitly.
- **Saylor quote reframed as editorial paraphrase** (June 2026). Earlier draft's blockquote wasn't sourceable to a single transcript. Reframed as paraphrase with sourcing methodology (Natalie Brunell interview themes, "best credit instrument in the world" X post). Preserves the argument, removes the false-attribution problem.
- **Capital stack SVG diagram** (June 2026, Tab II). Replaced the placeholder block with an inline 820×420 SVG showing all six tranches of Strategy's Q1 2026 capital structure, bar widths proportional to notional, STRC amber-highlighted, subordinate cushion annotated.
- **Print stylesheet** (June 2026, lighter CSS-only variant of §6.16). `@media print` rules hide site chrome and interactive controls, let the existing `.calc-slider-val` readouts show through, force the cashflow `<details>` open, attach a disclaimer footer via `::after`. No JS, no duplicated DOM. Works because BFI's on-screen readouts are already print-friendly.
- **URL scenario sharing** (June 2026). Query-param-based per SITE_GUIDE §17.5 convention. Six dimensions encoded as `?in=…&po=…&hz=…&sc=…&pa=…&st=…`. See URL schema subsection above for details. Refactored from an initial hash-based prototype after discovering the site-wide query-param convention.

---

## 25. Paper Bitcoin vs. Real Bitcoin (`/paper-bitcoin.html`)

**Retitled June 2026** from "Paper Bitcoin" — the comparison-instrument nature of the page (five custody models × ten dimensions) was undersold by the single-term title, which read as an editorial about one flavor. "Real" chosen over "Physical" for the title because "physical bitcoin" collides in search with Casascius-style collectible coins; in-page prose keeps both terms ("the real bitcoin — the physical bitcoin"). Slug unchanged at `/paper-bitcoin` (live, indexed, shared). First Arguments page with a "vs." title — a deliberate exception to the vs.-signals-Numbers convention, justified by the page genuinely being a comparison instrument.

**Added:** June 2026. The custody exploration: every way of holding bitcoin is essentially a different asset, and only self-custody retains the full property set the Foundations pages describe. Sits in The Arguments (`category: "arguments"`, `interactive: true`). Prose-led page with one interactive (WMHTB interaction grammar) plus a static 2×2 diagram. Mixed-content width tier (1100/880 per STYLE_GUIDE §4.2). Research basis: a dedicated NotebookLM corpus (custody models, ETF prospectuses, the Lopp physical-attacks dataset, 6102/capital-controls history, Celsius/Cyprus precedent), with independently verified key claims.

### Page structure

1. **What happened to gold** — 6102 caught gold in both forms: paper cancelled by memo; physical surrendered because use was compromised and possession criminal. Cross-links the Migration.
2. **The four quadrants** — static 2×2 (Gold|Bitcoin × Paper|Physical); three quadrants captured, one alight. The page's shareable unit and the bridge from gold to bitcoin. Caption: gold fell in both its forms; bitcoin can fall in only one — and that form is a choice.
3. **What paper bitcoin is** — the five-claim chain (broker → DTC/Cede & Co. → trust → custodian → prime execution agent) and the IBIT prospectus "relatively untested" admission, with sponsor (BlackRock) and custodian (Coinbase) named precisely.
4. **One bitcoin, five ways to hold it** — the interactive. Five presets in two groups (Paper forms: ETF, Exchange | Physical forms: Collaborative multisig, Single-sig, DIY multisig), each preset with a plain-language `?` tooltip and a "You hold:" descriptor. Ten dimensions in two camps: warm (what survives of bitcoin's nature — states Intact/Mostly intact/Compromised/Severed) and cool (what life requires of you — Light/Moderate/Heavy/Structural). 50 cells; severity drives chip + descriptor styling. Single-sig is the landing preset. Design thesis: no column wins; legend says so.
5. **Prose arguments** — the cul-de-sac and the open door (exchange withdrawal = non-taxable exit vs. ETF sale = taxed exit; honest IRA exception); the risk that follows the records (France wrench-attack wave, Ledger/Waltio breaches, insider data sale — physical risk follows records of ownership, not location of private keys; ETF honestly mitigates, single-sig concentrates, multisig structurally mitigates); the steelman (2.3–4M coins permanently lost; sovereignty vs. fallibility resolved via multisig — "it can be both"; links to Unchained/Casa/Bitcoiner.guide/10x Security).
6. **One event, two outcomes** — Canada 2022 (exchange accounts froze; self-custody moved); precedent stack (1933, Cyprus 2013 bail-in, Celsius 2023 $4.2B ToS ruling); the 6102 game theory, labeled inference (an order that strengthens what it targets; every self-custodied coin raises its price); the closing properties walk. Styled closing line: "6102 caught gold in the vault and gold in the hand. It can catch bitcoin only on paper."
7. **Referral callout** — whether/what, not how; mechanics referred out to Unchained, Casa, Bitcoiner.guide, 10x Security.

### Editorial register — lessons from the June 2026 review passes (apply to all future pages)

- **Migration register is the site's prose standard.** Full, measured sentences; no staccato fragments ("Not confiscated. Not stolen.") and no marketing-flash taglines. The styled two-line closing epigraph is the sanctioned exception.
- **Topical subtitles.** Sections complete one topic before the next begins (gold finished before ETFs began); headings name the topic plainly.
- **Define-before-use for Normie readers.** Any term a newcomer may not know (ETF, multisig, hardware wallet, seed phrase) gets a canonical `?` tooltip at first interactive use — the preset buttons carry tooltips, not just the dimension rows.
- **Name roles precisely.** Sponsor vs. custodian vs. issuer; "seller" was ambiguous and got flagged. Precision survives review; compression doesn't.
- **Neutral comparative framing in updates-strip copy.** "How X compares against Y and Z," never "when X actually beats Y" — strip summaries read as recommendations faster than page prose does.
- **Vocabulary parity:** "essentially an IOU for bitcoin" is the page's plain-language descriptor for exchange balances; "physical bitcoin" is the coined term for self-custody, used in hero, presets, and closing.

### Interactive architecture

`paper-bitcoin.js` holds the full data model (`models` object: 5 models × 10 dims, each `{state, desc}` plus a `hold` line). `applyModel()` re-renders chips, descriptors, and row decoration classes (`warm-intact`…`cool-structural`). Scale chips are non-interactive spans (one-control rule); presets are the only control. 15 canonical tooltips total (5 preset + 10 dimension), STYLE_GUIDE §6.13 recipe with a centered-tip variant for the preset panel.

### Cross-linking

`related:` — Migration (foundational history), WMHTB (property-grid sister), Borrowing Against Your Stack (collaborative-custody vaults in practice), Bitcoin Fixed Income (the other claim-shaped-like-bitcoin page). All four carry reciprocal links. Suggested reading position: immediately after the Migration (its personal-application sequel).

### Verified claims worth preserving (June 2026)

Coinbase Custody secures >80% of US spot-ETF bitcoin (84% by AUM, Apr 2026 — refresh on monthly passes); IBIT 424B3 (Jul 2025) carries the "relatively untested" / "general unsecured creditor" / "risk of total loss" language; France ≈25% of global wrench attacks and ≈80% of European (the corpus's "70% of global" was wrong and is retired); the second breach is Waltio Jan 2026 (the corpus's "Global-e" claim failed verification and was dropped); Celsius figure is $4.2B and is Earn-ToS-scoped.

### Open items / deferred

- ~~Title variant~~ — resolved June 2026: retitled to "Paper Bitcoin vs. Real Bitcoin" (see section header note).
- ~~Carousel slide~~ — shipped June 2026 at carousel position 1 (bulb-and-candle video, "Same light — different asset."; see §13). The earlier three-doors concept was superseded by the two-lights metaphor.
- The 2×2 quadrant as a Gallery entry.
- ~~Build-time citation niceties~~ CLOSED June 2026: Sources block added (SIPC "What SIPC Protects", Unchained passphrase-vs-multisig duress doc, Casa multisig page) with an inline cite on the §"keys" duress sentence. Pattern: `.sources-block` endnote list, small type, verified links only.
- Parked future pages seeded here: the CDS framing (bitcoin as a credit default swap on the fiat/banking system — Greg Foss's thesis, credited; pairs with the Kelly exploration) and an estate-planning companion (Fiduciary Integration Framework report).

---

## 26. How Much Bitcoin? (`/how-much-bitcoin.html`)

**Added:** June 2026. The Numbers; `interactive: true`; mixed-content width tier (1100/880, taken from the §4.2 table, not scaffolded). The position-sizing page: applies the Kelly criterion to bitcoin descriptively — the formula's startling raw answer, the asymmetric growth curve around the peak, and the honest case for fractional sizing. Calculator tile on `/calculators` (svg preview, anchor `#curve`, position 4, beside its sister page Disciplined Rebalancing at 3). Tool-framing strip on (decision-implying).

### Structure

Hero (two-tone H1; subtitle names the Kelly criterion up front — review lesson: the page's central concept must not wait for §A) → §A Bell Labs pedigree (Kelly 1956, Shannon, Thorp/Princeton Newport ~20%/yr for 19 years, Gross) → §B three worked scenarios + Fidelity/BlackRock institutional anchors → §C the interactive curve → §D three discounts in ascending force (estimation error / asymmetry / drawdowns + absorbing barrier) → §E fractional Kelly as formally optimal, position-on-trend reconciliation, sister-page operation → §F the nine-rung gap ladder → §G descriptive close + two-line epigraph.

### The interactive (§C, `#curve`)

g(f) growth-vs-allocation curve, all math computed in-page. Presets are the two canonical Power Law scenarios (**Revert to Power Law trend** / **Stay at current trend multiple**, both computed live from `PL_DATA`/`plPrice` with the current trend multiple displayed Gallery-style) plus a hostile **Conservative** case (μ=10%, σ=60% → standalone g=−8%, f*≈17% — the volatility-harvesting nugget). Two-line preset chips (name + computed assumptions); cluster titles "Default scenarios" / "Custom assumptions"; sliders deselect presets. Readout: f*, explicit CAGR→drift conversion (½σ² shown), expected-growth table, drawdown 2×2, contextual honesty flags (leverage; negative-standalone). "What the chart is saying" spoon-fed takeaways recompute live. Hover point-legend with "expected … under your assumptions — not a forecast" third line. The same JS engine fills §B prose numbers and the ladder's live rungs, so copy and chart cannot disagree.

### Verified-claims register (do not re-derive from the research corpus)

- Curve math locked: f* = (μ−r)/σ²; g(2f*) = r; half-Kelly keeps 75% of excess growth, quarter 43.75%. Cite MacLean/Thorp/Ziemba.
- Drawdown 2×2 locked (the corpus repeatedly conflates the two quantities): P(ever halve) at fraction c = 0.5^(2/c−1) → 50% / 12.5% / ~0.78%; P(halve before double) via θ=2/c−1 → ⅓ / ⅑ / ~0.78%. These depend **only on the fraction of Kelly** — the fact behind §E's position-on-trend paragraph.
- Fidelity "Getting Off Zero: Evaluating Bitcoin in 2026" (Kuiper, Mar 25 2026) verified at primary: 9.4% max-Sharpe (0% bonds; stocks 14.5/15.5, bonds 2/5, BTC 25/50), 65% discrete Kelly (70% win, +288%/−50%), 10% conservative-forward, and the footnote conceding the generalized formula gives a higher position (~130%, leverage).
- **RETRACTED:** "Fidelity published an 84% continuous Kelly" is a corpus hallucination — never reintroduce. Our labeled computation on their inputs gives 92%.
- BlackRock 1–2% risk budget (Dec 2024; Cohen/Henderson/Mitchnick/Paul; ≈ single Mag-7 risk share) — current as of 2026 AND implemented in BlackRock Target Allocation model portfolios since early 2025.
- Chopra & Ziemba 1993: mean errors ≈ 11× variance errors at RT50, growing with risk tolerance.
- Power-law exponent specification-sensitivity (~3× across time-origin shifts): **Baquero & Menezes**, arXiv:2605.21316 (May 2026) — author attribution verified at launch; linked from §D. Two-sided finding (weak structure, yet bitcoin uniquely beats single growth curves) is precisely calibrated for this page.
- Credit (JM request, June 2026): Fred Krueger (@dotkrueger) credited in §A as the popularizer of Kelly-for-bitcoin specifically, with a link to *Bitcoin One Million: The Final Chapter of Fiat* (Krueger & Sigman, 2025 — its description confirms a Kelly chapter). Credit is for popularization only; the page does not endorse the book's price thesis.
- Linked citations (June 2026): Kelly 1956 (Princeton-hosted PDF, verified 200), MacLean/Thorp/Ziemba (Berkeley PDF, verified 200), BlackRock "Sizing bitcoin in portfolios" (institutions/en-zz URL, ladder rung), Fidelity and arXiv already linked inline. Chopra & Ziemba cited by name only (no stable public PDF).
- Upside-skew wrinkle (volatility slider tooltip): sourced from Fidelity's 7-up/+288% vs 3-down/−50% tally; symmetric model therefore *understates* f* — the conservative direction.

### Editorial lessons

- **Expectations, not forecasts** (JM review): every output the reader can mistake for a prediction carries conditional language — hover legend third line, "Expected growth" block title, slider tooltips.
- **Label the axis with numbers, not just a word.** The unquantified Y axis was the root cause of round-2 confusion; the misread "2×" label ("2× the risk-free rate") proved chart labels must name their referent ("2× Kelly — growth falls back to cash").
- **Tooltips must force `text-transform: none`** — they inherit uppercase from table headers and block titles (fixed in page CSS; consider canonicalizing).
- **The related component is included per-page, not by the layout** — this page shipped three review rounds with no related strip before the missing include was caught. See TECH_DEBT.
- Sister-series framing with Disciplined Rebalancing: operating a Kelly weight IS the rebalancing protocol (trim after surges, add after falls). Bidirectional related links carry "sister page" language; DR's array leads with this page.
- "More bullish than the maximalist" (§B) survived review explicitly — JM approved the phrasing.
- Human-capital aside: **omitted by decision** (closest research item to advice-shaped); revisit only on reader demand.

### Open enhancements

- Carousel slide SHIPPED June 2026 as Featured lead (see §13).
- ~~Candidate STYLE_GUIDE recipes~~ CLOSED June 2026: canonicalized as §6.30–6.33.
- Sources & credits block added (June 2026): all seven register primaries linked (Kelly 1956 PDF, MacLean/Thorp/Ziemba PDF, Chopra-Ziemba, Fidelity, BlackRock, Baquero-Menezes, Krueger-Sigman). §A carries the popularizer credit: Fred Krueger (@dotkrueger), *Bitcoin One Million* (with Ben Sigman) — JM-requested, verified June 2026. The Power Law page hero gained the shift-parameter caveat sentence with the arXiv link (same pass).
- Parked sister-content: Foss CDS framing pairs with this page (see §25 parked list).

---

_Last updated: June 2026. Update this document as editorial decisions crystallize into principles worth preserving._


## 27. Page feedback widget (site-wide component)

**What it is.** A private reader-to-author channel at the bottom of every exploration page: message box (2,000 chars), optional reply email, async POST. **Nothing is ever published** — this is the component's defining principle and must survive any future redesign. It is not comments and must never become comments; the public face is silence, the private value is a pipeline of real reader questions (tooltip ideas, FAQ material, future-page topics, warm contacts).

**Where it lives.** `src/_includes/components/page-feedback.njk` (markup + self-contained `.pf-*` styles + vanilla JS), included once from `base.njk` after `{{ content | safe }}`, gated `{% if slug and feedback != false %}`. Every slugged page — all 29 explorations and any future page — inherits it automatically; `index`, `about`, and `calculators` opt out via `feedback: false` front matter. Layout-level by design so the related-strip per-page-include footgun cannot recur here (TECH_DEBT, 2026-06-11). Renders below the related cards, above the footer.

**Register copy (canon — reuse verbatim if rebuilt):**
- Eyebrow: "Feedback or questions?" (JM decision: direct, not cute; rejected "A question or a quibble?")
- Lede: "Every page on this site has been improved by someone pushing on it. Ask a question, flag an error, or suggest what's missing — it goes straight to the author, never published."
- Fine print: "Nothing you write here is posted publicly." (JM trimmed the auto-attach sentence.)
- Success: "Received — thank you. If you left an email, replies usually land within a few days."
- Failure: "Something hiccuped. You can email directly instead: [mailto johnmc190@gmail.com] — mention the page you were reading."

**Backend.** Cloudflare Pages Function `functions/api/feedback.js`, POST `/api/feedback`: honeypot (silent accept) → validation (length caps, email syntax) → rate limit 5/hour/IP via KV (`rl:` keys, TTL 1h; IP sha256-hashed transiently, never stored with submissions) → optional Turnstile (enforced only when `TURNSTILE_SECRET` env exists; OFF as of rollout) → KV archive (`fb:<ISO-ts>:<id>` → `{page, message, email|null, ts}`; source of truth) → best-effort email. Email path: `NOTIFY` send_email binding if present, else Resend via `RESEND_KEY` env (ACTIVE; account = johnmc190@gmail.com, free tier delivers only to account owner — correct here), else KV-only. `FEEDBACK_TO` env overrides destination. Subject format `[LCS feedback] /<slug>`; reader email becomes Reply-To.

**Account config (live since 2026-06-11):** KV namespace `FEEDBACK` bound as `FEEDBACK` (Production); `RESEND_KEY` secret set. Submissions browsable at dashboard → Storage & databases → Workers KV → FEEDBACK. Setup click-paths and the Turnstile enable procedure: `FEEDBACK_SETUP.md` (repo root).

**Ops.** Expected volume: low. No moderation duty exists (nothing public). Replies are one click (Reply-To). If volume ever outgrows the inbox, a private KV-reading digest page is a half-day add.

**Editorial pipeline (future).** The best questions may seed "What readers asked" blocks on pages — author-written content, never raw comments. Track candidates as they arrive.

**History.** Designed via FEEDBACK_WIDGET_DESIGN doc (chat deliverable, JM-reviewed with Word comments); trial on /how-much-bitcoin 2026-06-11 (commit `ecf1a13`); Chrome-autofill dark-theme fix (`974224b`, see STYLE_GUIDE §6.34); rollout site-wide same day.



## 28. Risks to Bitcoin (`/risks-to-bitcoin.html`)

**Category:** The Arguments. **Interactive:** no (restraint by design — a risk page with a toy would undercut its seriousness). **Shipped:** 2026-06-14.

**Thesis.** The site's other pages argue *for* bitcoin; this one argues *against* it, better than the critics do, and earns the rest of the site its credibility in the process. The frame is antifragility: bitcoin has survived seventeen years of attacks, bans, crashes, and competition not by adapting but by refusing to change, and the page tests that claim by stating each risk in its strongest form and asking what would have to be true for it to become real.

**Structure.** Ten risks in four named parts — Death by decree (state attack, infrastructure catastrophe), Death by economics (security budget, mining centralization, custody concentration), Death by failure (protocol catastrophe, ossification, quantum, privacy), Death by irrelevance (a better coin / stagnation / containment as one section). Every risk runs the same three beats: **The case** (steelman, granted fully) → **The reply** (the answer, including where unresolved) → a **tripwire block** ("The risk becomes credible when…", 2–3 observable markers). Closes with **The scoreboard** (tested-and-survived / live-and-watched / catastrophic-but-shared) and a temperament link to How Much Bitcoin.

**Key editorial decisions (from JM review rounds).**
- Title is "Risks to Bitcoin," not "What Could Kill Bitcoin?" — deliberate register, and avoids the bait-and-switch of a kill-titled page concluding most risks are survivable.
- The "win" framing was removed throughout (not a competition) → "becomes credible / a real threat." Beat labels are "The case." / "The reply." — NOT "honest answer" (an AI-tell; see the de-tell note below).
- **Bitcoin** (capital B) = the network/protocol; **bitcoin** (lowercase) = the monetary asset. Applied consistently; maintain it in any edits.
- "Governance" avoided — bitcoin has consensus rules and social consensus, not governance in the altcoin sense. §7 is "Ossification, and the limits of changing the rules."
- **De-tell discipline:** the words "honest/honestly" and "load-bearing," and self-congratulatory candor lines ("we're being honest with you"), are AI-tells JM flagged. Kept near-zero; let the arguments stand on their own terms. Preserve this in future edits.
- Depth follows substance: security budget and quantum run full-length (the genuinely contested/clocked ones); others are compact.
- Two JM substantive corrections worth preserving: (a) the AI/HPC-bids-away-mining-energy claim was CUT — AI needs firm always-on baseload and can pay for it; mining monetizes intermittent stranded power; not the same customers. (b) Quantum: weaker cryptography elsewhere breaks first and in public = a warning, not a surprise; Satoshi's coins are many scattered 50-BTC coinbase addresses, not one honeypot; old key formats are the warning shots.

**Verified-claims register.** Data-audit at launch (2026-06-14): the 2021 China-ban hashrate drop is **~50%** (175→85 EH/s; multiple sources) — an earlier draft's "71%" was WRONG and corrected to "roughly half." Covert-China-resident mining hedged to "by various estimates 15–20%" (sources span 14–21%). Blocks where fees exceeded subsidy: VERIFIED (April 2024 halving block, 37+ BTC fees vs 3.125 subsidy; Ordinals/Runes 2023–24). Budish, Carlsten et al., Blocksize War, 2010/2018 protocol bugs, Circular 42 (Feb 2026), Google quantum paper (March 2026) — all sourced in the page's Sources block.

**Cross-linking.** Related (bidirectional): How Much Bitcoin (temperament companion — NOT a "size around failure probability" framing; JM removed that), Paper Bitcoin (custody deferral), The Power Law (model ≠ destiny), Trilemma (the design-is-correct foundation under the Bitcoin-2.0 rebuttal).

**Annual refresh (JM flag).** The opening's time-anchored facts — "seventeen years old," "as of 2026," the proof-of-work-dominance claim — need a yearly update. Logged in MONTHLY_REFRESH §2.

**Open enhancements.** Carousel slide shipped June 2026 (resilience video, antifragility carried by headline + page; see §13 iteration record). All statistics were rounded/hedged at launch pending firmer dated primaries; the data-audit register above is the canonical record.

## 29. Bitcoin & Metcalfe's Law (`/bitcoin-and-metcalfes-law.html`)

**Category:** The Numbers. **Interactive:** yes (proxy/era selector + live log-log fit chart; no `calculator_tile` — it is an explanatory data explorer, not a personal-decision tool, like the Doubling Ladder and the Heatmap). **Shipped:** 2026-06-19. **Sibling to** `/the-power-law` (§11): the Power Law models **price vs. time**; this page measures **price vs. adoption** — the network-effect engine running underneath that trend. The two are a bidirectional related-pair.

**Thesis.** A two-move argument. (1) *Measured, not assumed:* the popular "double the users, quadruple the price" heuristic (Metcalfe, exponent 2) is directionally right but generous — when you let the data choose the exponent instead of imposing it, it lands **below** two (our fit ≈1.84 on non-zero-balance addresses; Wheatley/Sornette 1.69), exactly the diminishing-returns shortfall Briscoe–Odlyzko–Tilly predicted in 2006. (2) *The signal is going blind:* the revealing number isn't the exponent, it's the **fit**. Era by era, on-chain holders explained ~80% of price variation in the retail era and under 10% in the ETF era. The collapse is structural — as ownership moves into ETFs, custodians, and corporate treasuries, a single on-chain address represents many beneficial owners, so on-chain counts increasingly understate real ownership. The narrow, sturdy claim is the *collapse in fit*, not any individual era exponent (those are boundary-sensitive and not quoted as constants).

**Section structure (single-scroll essay, not tabs).** Hero (conformed page-header H1 + subtitle + a "signature rail" whose segment brightness encodes era-by-era fit) → **I · The Claim** (Krueger's quadratic heuristic, Peterson, Santostasi/Perrenod — all *assume* exponent 2) → **II · The Measurement** (exponent table; every *measured* exponent < 2) → **III · The Theory** (Odlyzko's n·log(n) rebuttal predicts below-two) → **IV · See For Yourself** (the interactive) → **V · A Missing Variable** (conviction / value-weighting; the price→conviction loop is strong, conviction→price weak; the durable result is the long-term-held share rising ~30% → ~67%) → **VI · The Headline** (the era-by-era fit collapse; the holder-growth-vs-ETF-absorption visual; "what this is and isn't" callout) → Sources & credits (9 numbered citations).

**The interactive (`bitcoin-and-metcalfes-law.js`).** A `FITS[proxy][era]` table drives a readout (exponent β, price-per-doubling = 2^β, fit-quality tier) and a Chart.js scatter+line whose noise scales with (1−R²) and whose line dashes/reddens as the fit breaks. Proxy = `bal` (holders, non-zero-balance addresses) or `act` (active addresses). Era = full / retail / institutional / ETF. Default `bal`/`all` (β 1.84). The insight text branches on `inverted` → `r2<0.4 (collapsed)` → `unstable` (full-history) → clean-era.

**Verified-claims register / data provenance.**
- `bal` cells (holders) are **exact OLS fits** on Coin Metrics `AdrBalCnt` vs `PriceUSD`, log-log, by era (full 1.84/R²0.95; retail 1.48/0.82; inst **3.14/0.78**; ETF 2.86/0.09). The institutional cell was updated at launch from the draft's analyst estimate (3.07/0.77) to the calibrated fit (3.14/0.78) so the displayed figure matches the method; the others reproduced the draft values to rounding.
- `act` cells (active addresses) were **recomputed at launch** (the draft's were analyst estimates). Live pull from **Blockchain.com Charts** (`n-unique-addresses`, `market-price`), OLS log-log, over the **same era boundaries** used for `bal`. Boundaries were calibrated by reproducing the exact `bal` values: retail = 2011-01-01→2016-12-31; **institutional onset = 2017-01-01→2020-03-31** (the COVID-crash boundary — the calibrated `bal` inst fit here is 3.14/R²0.78, the closest match across candidate end-dates to the draft's 3.07/0.77 estimate; the displayed `bal` inst cell was updated to this calibrated value at launch); ETF = 2024-01-01→present; full = 2011→present. Cross-checked against Coin Metrics `AdrActCnt` (same shape).
- Recomputed `act` values shipped (β / R²): full **2.09 / 0.81**; retail **1.37 / 0.90**; institutional **0.59 / 0.02**; ETF **−0.19 / 0.01** (inverted/broken). Diff vs the draft estimates: full β 1.92→2.09; retail R² 0.78→0.90; **institutional materially changed** (1.29/0.46 → 0.59/0.02 — the fit collapses, reinforcing the page's thesis); **ETF magnitude materially changed** (−1.66/0.11 → −0.19/0.01 — still inverted, but the relationship is near-flat noise, not a steep inversion).
- Time-sensitive figures (ETF holdings 1.28M BTC / ≈6.5% of supply; ETF AUM ~$82.5B; ETF-era holder growth ~3.7%/yr; long-term-held share ~67%) are logged in MONTHLY_REFRESH_CHECKLIST.

**Key editorial decisions.**
- **Hero conformed to the canonical convention.** The standalone mockup used a small-eyebrow-over-large-H1; this was a noted review inconsistency. Conformed to the Power Law / BvRE page-header pattern: H1 is the page title (`Bitcoin & Metcalfe's Law`, key term in amber italic), the mockup's thesis line ("Adoption is real — but the data is going blind") rides as the `hero-subtitle` the way BvRE carries "The Opportunity Cost," and the prose drops to `.subtitle`. No eyebrow.
- **Tool-framing strip skipped.** The page is epistemic (can we even measure adoption?) rather than a buy/sell decision tool, and it carries its own "what this is and isn't" disclaimer callout. Consistent with §6's skip guidance for essays/demonstrations without an input-driven decision frame.
- **Collapse-message edit (consequence of the recompute).** Recomputing `act` dropped the institutional-era fit below 0.4, so it now triggers the JS "this fit has collapsed" branch (the draft estimate, R²0.46, hit the clean-era branch). The generic collapse copy was made era-agnostic — "Ownership and activity have moved off-chain — into **exchanges, custodians, ETFs, and treasuries**" — so it reads accurately for both the institutional era (exchange batching) and the ETF era, rather than attributing a 2017–2020 collapse to ETFs that didn't yet exist.
- **Container = mixed-content tier** (STYLE_GUIDE §4.2): `.page` 1100 / `.essay` 880, prose centered.

**Cross-linking (bidirectional).** Related set on the page: **The Power Law** ("the price model this builds on" — price-vs-time vs. this page's price-vs-adoption), **The Fixed Share** (supply-side companion: participants vs. your claim on fixed supply), **Paper Bitcoin** (where the intermediation/custody gap this page measures bites hardest). Back-links added on all three. Homepage: concept card in The Numbers (custom network-graph SVG icon whose edges/nodes brighten left and fade right — Metcalfe's network effect plus the signal going blind), inserted at the top of Latest (How Much Bitcoin retired from Latest to hold it at three; it keeps its permanent Numbers card). `updates.json`, `sitemap.xml` (0.9), `llms.txt` (The Numbers) all updated.

**Shipped (June 2026), all live on production.**
- **Carousel slide** — `vid-bitcoin-and-metcalfes-law`, `/videos/bitcoin-and-metcalfes-law.mp4`; Featured, placed between the Power Law and Doubling Ladder slides; the Doubling Ladder was demoted to hold Featured at 10. See §13 for the slide note and iteration record.
- **Real OG card** — `og-bitcoin-and-metcalfes-law.jpg` is the real brand-forward card (STYLE_GUIDE §6.15.1, ~84 KB, composited from `og-synthesis.jpg`), replacing the launch placeholder. Verified live (`Content-Type: image/jpeg`). `.eleventy.js` registration unchanged.
- **Real-data fit chart** — the §IV scatter now plots the real price-vs-adoption series on real logarithmic axes ($ and holder-count ticks), driven by the pinned weekly dataset `bitcoin-and-metcalfes-law-data.js` (808 points), with per-era filtering and the canonical-β fit line. Replaced the original synthetic 0–1 schematic. Refresh cadence: MONTHLY_REFRESH §9.
- **Carousel video audio strip** — done (PR #27, June 2026). The master shipped with an AAC track; stripped via stream copy (`-map 0:v:0 -c:v copy -an`, no re-encode → identical video quality), also dropping the mjpeg cover-art per the §6 convention. Now video-only, 0 audio streams (1280×720, 10.04 s, ~2.95 MB). Verified on the deployed file via ffprobe.

**Open items.** None — the page and all its assets are shipped and verified live.

## 30. Nav dropdown grouping (sub-headers)

**Added June 2026.** The Numbers and The Arguments dropdowns are organized into named **sub-groups** under non-clickable sub-header labels, rather than one flat list each. Foundations stays flat (six items). The grouping renders in both the desktop dropdowns and the mobile overlay, and the footer continues to list each bucket flat (in `explorations.json` array order, which now follows the grouped order so the footer reads sensibly too).

### How it works

- **Data.** Each `numbers`/`arguments` entry in `src/_data/explorations.json` carries a **`group`** field (a string). Foundations and hub entries have no `group`. The `group` value must match — character-for-character, raw `&` not `&amp;` — one of the group names listed in `base.njk` (below), or that page silently drops out of its dropdown.
- **Order.** Two Nunjucks arrays at the top of the nav in `src/_includes/layouts/base.njk` control the **display order of the sub-headers**: `numbersGroups` and `argumentsGroups`. The **item order within a group** follows `explorations.json` array order. So: to reorder groups, edit the arrays; to reorder items inside a group, reorder the JSON entries.
- **Render.** For each group name, the template emits a `<div class="nav-dropdown-group-label">` (desktop) / `<div class="mobile-section-sublabel">` (mobile) then loops `explorations` filtered by `category == cat and group == g`. The labels are `<div>`s with `pointer-events: none` — **non-clickable by construction** (labels, not links). The per-item `·interactive` dot convention is unchanged. Styling lives in the `canonical-nav-css` block: small letterspaced muted caps, matching the `footer-nav-label` / `mobile-section-label` register.

### The groups (as of June 2026)

**The Numbers** (15 items):

| Group | Pages |
|---|---|
| Models & Trends | Bitcoin & The Power Law · Bitcoin & Metcalfe's Law · The Bitcoin Doubling Ladder · The Bitcoin Heatmap |
| Bitcoin vs. Other Assets | Bitcoin vs. The Stock Market · BTC vs. Real Estate · BTC vs. Rental Property |
| Positioning & Strategy | The Bitcoin Retirement · Disciplined Rebalancing · How Much Bitcoin? · The Bitcoin Horizon |
| Living on Bitcoin | Borrowing Against Your Stack · Bitcoin-Backed Mortgages · Living on Bitcoin · Bitcoin and Fixed Income |

**The Arguments** (9 items):

| Group | Pages |
|---|---|
| Why Fiat Fails | The Half-Life · Money Trees · The Melting Ice Cube · **The Bitcoin Fixed Share** |
| Why Bitcoin Endures | The Bitcoin Migration |
| Objections, Answered | Is Bitcoin a Bubble? · Risks to Bitcoin |
| Holding & Spending | Paper Bitcoin vs. Real Bitcoin · Bitcoin Spend and Replace |

*Note: "Why Bitcoin Endures" currently holds a single page (The Bitcoin Migration, the flagship essay). It stands alone deliberately; if a second positive-thesis page lands, it joins here.*

### The Bitcoin Fixed Share moved to The Arguments (June 2026)

`the-fixed-pie` (display title "The Bitcoin Fixed Share") **moved from The Numbers to The Arguments**, into the *Why Fiat Fails* group, placed directly after **The Melting Ice Cube** as its conceptual mirror — fiat's share melts; your bitcoin share stays fixed. It is a philosophical/conceptual page, not a data/tool page, so it belongs with the arguments. The move touched: `explorations.json` (`category` numbers→arguments + `group`), `sitemap.xml` and `llms.txt` (relocated to the Arguments section). **Its slug (`/the-fixed-pie`), page content, and OG card are unchanged — only its nav home moved.** Cross-links to it are slug-based (`related:` entries) and resolve regardless of category.

### Adding a new page

Set its `category` (`numbers`/`arguments`) **and** a `group` matching one of the arrays in `base.njk`. To introduce a *new* group, add the name to the relevant array in `base.njk` (in the position you want the sub-header to appear) and tag the page(s) with it. Place the JSON entry among its group-mates so item order reads correctly.

## 31. "Copy chart as image" button (site-wide)

**Added June 2026.** Every data chart has a small, quiet **camera button** in its top-right corner that exports just the chart (not the page) as a self-contained PNG — **copied to the clipboard**, or **downloaded** if clipboard-image write is blocked (Safari/Firefox). It is a deliberately understated affordance (low-opacity ghost, ~0.55, brightening to full opacity on hover/focus with a "Copy image" label) — *not* a promotional CTA. It replaced the heavy "Generate & Download Chart" button that used to live on /not-a-bubble.

### How it works — declarative

The helper `src/_includes/_pageassets/shared/chart-copy.js` is loaded **once, site-wide, from `base.njk`** (after `page_scripts`). On load it scans for **`[data-chart-copy]`** wrappers and attaches a button to each. It's a no-op on pages without charts. To give a chart the button, mark the element that **tightly wraps** it (so the corner button sits on the plot):

```html
<div class="chart-wrapper" data-chart-copy
     data-chart-title="Bitcoin price vs. the Power Law trend">
  <canvas id="..."></canvas>
</div>
```

The exported PNG is rendered at **≥2× CSS resolution**, on an **opaque dark background** (`#111110`, never transparent — it must read on white surfaces like X/LinkedIn), with a muted **caption** baked in: *chart title* (left) · `lastcoinstanding.com` (right).

Optional attributes: `data-chart-filename` (default = slug of the title), `data-chart-bg` (default `#111110`), `data-chart-label` (default `Copy image`), and `data-chart-capture` (force a capture path — see below).

### Three capture paths (auto-detected from the wrapper's contents)

| Chart kind | Detection | Capture |
|---|---|---|
| **Chart.js or hand-drawn `<canvas>`** | wrapper contains a `<canvas>` | the canvas pixels are blitted directly (works for both — capture doesn't care how the canvas was painted) |
| **inline `<svg>`** (e.g. how-much-bitcoin's Kelly `curveChart`) | wrapper contains an `<svg>` | the SVG is cloned, its **computed styles inlined** (so it isn't unstyled), serialized, and rasterized at 2×. Force with `data-chart-capture="svg"`. |
| **composite DOM / CSS-grid** (the outperformance heatmap — a grid of `<div>` cells) | no canvas/svg | **html-to-canvas** via lazily-loaded `html2canvas` (CDN, loaded only on first click of such a chart). Force with `data-chart-capture="dom"`. |

The DOM-grid heatmap capture is **verified working in-browser** (June 2026): the export renders the full grid, legend, and attribution via `html2canvas`, with the copy button itself excluded (`ignoreElements`) — a supported path, not a known-risky one.

### Custom capture (a page owns the full image)

A page can supply its own finished image instead of the standard framed export — set, at load:

```js
wrapperEl._chartCopyCapture = function(){ return Promise<canvas|Blob>; };
```

**/not-a-bubble** uses this: its export bakes in **today's date and the live BTC price** (the chart's whole point is "today, bitcoin is at \$X vs every historical bubble"), so that richer 1600×900 image — built by `buildBubbleExportCanvas()` in `not-a-bubble.js` — is what the quiet button copies. Every other chart uses the plain framed capture.

### Coverage & exclusions

~51 data charts across 20 pages carry the button. **Excluded** (conceptual/decorative, not data charts): the trilemma triangle, what-bitcoin-is flower, synthesis orbs, money-trees, the melting-ice-cube ice-cube + battery animations, the bitcoin-fixed-income capital-stack diagram, the paper-bitcoin quadrant, the Foundations property matrices, the spend-and-replace sequence diagram, the power-law branching-trees SVG, and the metcalfe ETF-absorption illustration. Also skipped: bitcoin-vs-real-estate's `housesVisual` and `returnTable` (illustrative, not plotted).

### Adding the button to a future chart

Just add `data-chart-copy` + `data-chart-title="…"` to the chart's wrapper. The capture path is auto-detected. For a DOM-grid or an SVG that should be captured whole (including non-SVG labels in the frame), add `data-chart-capture="dom"`.
## 32. Lump Sum or Ladder In? (`/lump-sum-or-ladder-in.html`)

**Added June 2026.** A channel-applying decision tool in **The Numbers** (group *Positioning & Strategy*). Sibling to `/disciplined-rebalancing` (DR) and `/bitcoin-vs-real-estate` projection mode; reuses DR's channel-viz / Chart.js patterns, the shared `power-law-data.js` globals, and the mixed-content width tier (1100 page / 880 prose). Built in two stages (2A core, 2B projective + integration), then **refocused in Stage 2C-①** (see the amendment at the end of this section).

> **⚠️ Stage 2C-① refocus (see the amendment below before trusting this section).** The single page was split into two by reviewer direction. **This page (slug unchanged) is now the retrospective *teaching demonstration* only** — the projective lens, manual-blend, and recurring-windfall planner are gone; the live "deploy / hedge" recommendation moved off this page. The descriptions of "Two lenses" and the Stage-2B amendments below are **historical**, retained for provenance. The forward (projective) view and the hybrid model move to **Page 2, `/your-deployment-plan`** (Stage 2C-②, not yet built).

**Thesis.** Lump sum vs. DCA isn't about timing or temperament — it's about **valuation relative to the Power Law channel**. Low in the channel → deploy decisively; stretched into the upper channel → spreading is the model-rational hedge; mid-channel → a coin-flip. Underneath it all, the commitment backstop: over a long horizon *every* entry recovers, so the tactic is a margin and commitment is the foundation.

**Everything is computed live from the current `PL_DATA` at load** — the advantage curve, the commitment-backstop table, the volatility-compression table, the worst-entry recovery, and today's channel position. **Nothing is hard-coded** (the build-time re-run discipline becomes a load-time one). Step 1 of the build re-ran the four analyses against canonical data and reproduced the design figures to rounding; the figures that ship are the freshly-computed ones.

### Structure (single-scroll, not tabbed)
The page is one decision on one continuum, so it deliberately avoids DR's tab split. Controls: a **channel-position scrubber** (the single star lever), a **binary all-now ↔ ladder-in toggle** (the core decision; *not* a blend slider), a **lens toggle** (Retrospective ↔ Projective, 2B), and an **era segmented control** (Full / Post-2017 / Post-2020, default recent) that does double duty — it buckets the backtest *and* sets the channel chart's x-range. Quiet config: sum (cosmetic — the advantage is amount-invariant), ladder duration, hold horizon. Then: live readout, commitment-backstop table, volatility-compression (secondary), honesty layer, methodology footer. Advanced/optional disclosure (collapsed `<details>`): a manual %-now/%-laddered blend and a recurring-windfall planner.

### Two lenses (the credibility argument)
- **Retrospective** — the lump-vs-ladder advantage as a function of entry channel position, the "settled debate flips on its axis" curve (amber = all-now territory below zero, blue = laddering above), with a scrubbed marker and a live "today" line.
- **Projective** — anchored at today, three forward channel-scenario paths (revert-to-trend / ride-floor / stretch-then-revert), **excursions sized to recent-era (compressed) amplitude, never early-era** (design §4.5). Shows all-now-vs-ladder *robust across permitted paths*, never a point forecast; the faint retrospective curve overlays for the two-lens agreement.

### Stage-2B amendments (build decisions worth preserving)
- **Forward channel extension folded into the projective lens (Amendment 1).** The orientation chart extends the floor/trend/upper bands forward to the hold-horizon year **only in the projective lens** (retrospective stays strictly historical — flagged choice). The forward (extrapolated) portion renders **faded + finely dashed** via Chart.js `segment` styling so fitted history is visually distinct from extrapolation, and it carries a **non-negotiable right-hand-edge caveat** (`#lslFwdCaveat`): the bands are a mathematical extrapolation of an empirical regularity, not a forecast.
- **Era control drives the channel x-range with a y-refit (Amendment 2).** Selecting an era clips x to `[era-start … (retrospective: ~today | projective: horizon-year)]` **and** refits the log-Y envelope to that window so the bands open up. The "today" line and the forward bands always stay on-canvas.

### Cross-cutting discipline
- **No live value in static copy (rule #1).** The scrubber opens at a fixed low-channel *teaching* default (0.15), not today's value; today's position renders only in the live component via `fetchTodayPrice`.
- **Live readout + caveats are one eyeful (rule #2).** The right-hand-edge and panic-threshold caveats sit in the same card as the live "deploy" reading.
- **Locked precision conventions** (methodology footer): 8-year backstop exit = nearest sample to (entry + 8×365.25 days); worst-entry recovery quoted as the live range. Porkopolis attribution links to The Channel rather than restating it. No URL carry-over.

### Integration
`explorations.json` (group *Positioning & Strategy*, `calculator_tile` `mini-lump-vs-dca` at position 15); `calculators-minis.js` renderer (the advantage-curve flip); `sitemap.xml` @0.9; `llms.txt`; homepage concept card (deploy-vs-ladder bar SVG) in The Numbers + Latest; `updates.json`; bidirectional `related:` with The Power Law, The Bitcoin Horizon, BvSM, Disciplined Rebalancing; OG card `og-lump-sum-or-ladder-in.jpg` (§6.15.1 brand-forward).

### Open items
- **Deferred polish (post-split pass):** tooltips for load-bearing terms (channel position, trend, floor, upper band) will reuse the existing Style-Guide tooltip component verbatim; DCA-footnote wording confirmed against house style; a possible "sit in fiat and wait" third option (evaluate vs. confusion). None built yet.
- **Carousel slide** pending (needs a Grok Imagine video) per the usual NEW_PAGE_CHECKLIST §8 cadence.

### Stage 2C-① amendment — refocused to the teaching demonstration (current state)
Per reviewer direction (`STAGE_2C_REBUILD_SPEC.md` + `Lump_Sum_or_Ladder_In_-_Content_v2_two_pages.docx`), the single page that tried to be both a teaching demonstration *and* a personal calculator was split. **Stage ① (this PR) refocuses Page 1 down to the retrospective demonstration; the slug, nav slot, OG image, and inbound links are preserved.** What changed:

- **Removed the projective lens entirely** — the lens toggle, the three forward-scenario paths on the advantage chart, and the forward channel extension on the orientation chart. Page 1 is retrospective only. The forward path model (`PATHS` / `pathPos` / `simFwdAdv` / `projectiveCurve`, recent-era amplitude cap, `TREND_POS`) was **lifted, not deleted**, into `_pageassets/shared/deployment-projection.js` (global `DeploymentProjection`), self-contained on the shared Power Law globals, ready for Page 2.
- **Removed the advanced disclosure** (manual %-now/%-laddered blend + recurring-windfall planner) and the cosmetic **Sum-to-deploy** control (it had no effect once those were gone — the advantage is amount-invariant). Both planners move to Page 2.
- **Removed the live "deploy / hedge" recommendation block.** The upper-channel hedge is shown as *historical fact* here and softened to a *recommendation* only on Page 2. Page 1's sole live element is now a **factual position callout** ("Today: channel position X · Y× trend · near the floor"), computed live (rule #1 intact — no value baked into static copy).
- **Promoted the channel-orientation chart ABOVE the scrubber** into a new **"Where are we right now?"** context section, and gave it the canonical **"you are here" glowing-rings pulse** (`lcs-pulse-halo`, STYLE_GUIDE §6.23 — reused verbatim from The Gallery's Chart 1: `todayGlow` radial halo + `lcsPulse` element positioner). It still draws the scrubbed entry-valuation line, so the reader sees today's glow *and* watches the tested valuation slide through the channel as they scrub below. Bands stop just past today (no forward extension).
- **Kept** the novel advantage-by-channel-position chart; the era control (Full / Post-2017 / Post-2020) still buckets the backtest *and* sets the context chart's x-range with a y-refit. **Kept** the commitment-backstop and volatility-compression tables ("shared idea, shown here too" — they also appear on Page 2).
- **Reframed copy** to the plained-down "this is a demonstration, not advice for your situation" voice throughout; added the **DCA footnote** at first use; honesty layer is now the doc's three items (empirical-not-guaranteed / hindsight-flatters / demonstration-not-advice), the negative-space "what this is not" list retained.
- **Added the hand-off card** to `/your-deployment-plan` (`.lsl-handoff`). **This is a dead link until Stage 2C-② ships** — wired deliberately per spec.

**Stage 2C-② (built — same PR #34, reviewed together):** new page `/your-deployment-plan` — see §33. Page 1's hand-off card now resolves to it.

---

## 33. Your Bitcoin Deployment Plan (`/your-deployment-plan.html`)

**Added June 2026 (Stage 2C-②).** The personal model in **The Numbers** (group *Positioning & Strategy*), companion to §32 *Lump Sum or Ladder In?*. Where Page 1 is the retrospective teaching demonstration, this page is about *your* situation: your sum, your cadence, your horizon — modelled both back across real history and forward under the Power Law. New slug `/your-deployment-plan`; no URL carry-over from Page 1 (DR §8.1).

**Thesis.** You have a sum to deploy. Lump it, ladder it, or do some of each? The **hybrid** (deploy X% now, ladder the rest over N months) is the differentiator — the option many people actually choose: a decisive core with some hedged comfort. The page lets you compare all three for your own case, on an intuitive value-over-time axis.

### Structure
- **Primary control: deployment style** (Lump / Ladder / Hybrid) — the thing you manipulate (rule #3). Then quiet plan inputs: sum, ladder/blend duration, hybrid front-load %, hold horizon. A **view toggle** (Retrospective / Projective).
- **Chart chassis borrowed from The Bitcoin Retirement — SHAPE ONLY** (time on the x-axis, the Power Law channel floor-at-the-bottom). Imports **none** of Retirement's age/withdrawal/lifespan inputs; keeps this page's own controls and voice. The chart plots **price-per-BTC** with the floor/trend/upper channel and the forward/real price path, **anchored at the live spot (projective) or the matched historical entry price (retrospective)** — not the deployed sum. Amber **buy-point markers** show where the plan's purchases land (one dot for a lump, several along the path for a ladder/hybrid), so the chart reflects the style. The **dollar value + multiples live in the verdict**, not the chart axis. (Earlier builds plotted value-space bands scaled by `sum/spot`, which pinned t=0 to the deployed sum and read as mis-anchored — see `BUG_projective_anchor`; fixed by moving to the price channel.) Floor at the bottom still fixes the inverted-floor confusion of the old Page-1 projective advantage chart.
- **Two views.** **Retrospective** has two anchors (review-round rebuild, fixes the 2015-pin): **channel-anchored** (default) finds every historical entry within ±0.07 of today's live channel position, deploys the plan from each at real prices, holds for the chosen horizon, and reports a **distribution** (median + typical range across matches) — the horizon slider sets *hold length*, not the entry; the chart replays the most recent match with a "you deployed here" marker while the verdict speaks to the whole set. **Time-anchored** (secondary, lower-weight toggle, never disabled) deploys the horizon's-worth of years ago and replays to today. **Projective** deploys today and extends two Power Law paths — **reversion-to-trend** and **stay-on-current-trajectory** — as a shaded *range*, never a forecast (the **lifted `DeploymentProjection`** module). Channel-position is shown sitewide as "×trend · plain label", never raw coordinates (review item 3); a **three-zone upper-channel risk flag** fires on the live position here (and the scrubbed position on Page 1), flipping the lean from "deploy decisively" to "drawdown hedge" and degrading the channel-anchored sample gracefully when it thins (review item 12).
- **Live readout** carries the softened recommendation (deploy / coin-flip / hedge) **with its caveats in the same eyeful** (rule #2) and links into the Cautions.
- **Cautions** — the required four (rule #4), loud and headed (`#cautions`): rising-channel-means-you-may-never-enter / sideways-for-years / Bitcoin-could-break-the-Power-Law / never-capitulates. This is where the upper-channel hedge is softened from Page 1's historical fact to a *recommendation*.
- **Commitment backstop + volatility-compression** tables, computed live (the doc places them here too). Prerequisite + methodology + attribution as sitewide.

### Cross-cutting discipline
- **Rule #1:** no live value in static copy; today's position renders only via `fetchTodayPrice` (live readout + the chart anchor). The retrospective analog is chosen *from* the live position at load — described in logic, never a baked value.
- **Reuse:** Power Law constants + channel math copied locally per rule #5; `DeploymentProjection` consumed for the reversion path; Mežinskis/Porkopolis attribution links to The Channel.

### Integration
`explorations.json` (group *Positioning & Strategy*, `calculator_tile` `mini-deployment-plan` at position 16); `calculators-minis.js` renderer (forward value-range cone); `sitemap.xml` @0.9; `llms.txt`; homepage concept card (value-fork-into-range SVG) in The Numbers + Latest (rolled The Gallery out of Latest); `updates.json`; **bidirectional `related:`** with Lump Sum or Ladder In?, The Bitcoin Retirement, The Power Law, The Bitcoin Horizon, Disciplined Rebalancing, **and The Bitcoin Heatmap** (the holding-period companion — empirical backstop for this page's commitment-first claim); OG card `og-your-deployment-plan.jpg` (§6.15.1 brand-forward).

### Open items
- **Carousel slide** pending (needs a Grok Imagine video) per NEW_PAGE_CHECKLIST §8.
- **Deferred polish** shared with §32: tooltips for load-bearing terms; final voice pass against the live designed pages.
- **BvSM cross-link** considered (the entry-at-the-tops stress-test sibling) but left out of the related set to keep it focused on the deployment-decision family; easy to add if wanted.

---

## 34. Wait, or Deploy Now? (`/wait-or-deploy-now.html`)

**Added June 2026 (Stages 4–6, same PR #34).** The third page of the deployment trilogy in **The Numbers** (group *Positioning & Strategy*), after §32 *Lump Sum or Ladder In?* and §33 *Your Bitcoin Deployment Plan*. Where Page 1 teaches the general lesson and Page 2 models deploying *today*, this page owns the question the other two deliberately leave alone: from a given position in the channel, **did waiting for a lower entry historically leave you with more Bitcoin — or did the dip you were waiting for usually never come?** Page-scoped classes use the `wd-` prefix; reads the shared `power-law-data.js` globals (incl. `positionLabel`) and the mixed-content width tier (1100 page / 880 prose).

**Thesis.** This is the trilogy's *whether/when* page, and the most timing-adjacent surface on the site — so it is framed as a **retrospective, position-aware read, never a signal**. "Waiting" is **position-based, not calendar-based**: hold out for a *lower channel position* (capped at two years), never a claim that price *will* drop. The outcome is measured in **Bitcoin acquired** (1 / price), waiter vs. deploy-now. The honest payload: low in the channel there is essentially no advantage to waiting (deploying decisively is the clear call); high in the channel, *whether* to deploy becomes a real question worth digesting.

**Everything is computed live from the current `PL_DATA` at load** — the waiting-paid rate, the drawdown likelihood/depth, the never-arrived share, and today's channel position. **Nothing is hard-coded** (rule #1).

### Structure (single comparator surface)
A continuous **position explorer**, top to bottom: a **position-aware live state** band (quiet when low — "deploying decisively is the clear call" — flipping LIVE high in the channel, the `pos < 0.53` threshold shared with Page 2's timing link); then the comparator — a **sub-floor-capable slider** (`#wdSlider`) with a persistent **▲ today** marker and a "snap back to today" link; a **full-width Power Law channel chart** (`#wdChart`) directly under the slider whose dashed line + blue dots move as you drag; and a **compact result band**: the **waiting-paid hero %** on the left (how often waiting left you with more Bitcoin) beside the **bonded dual-impact drawdown pair** (likelihood × depth as one grouped unit with a shared "not a forecast" caveat). Below: the **never-arrived counterweight** (the share where no lower entry came within two years), then secondary wait-length/sample lines. Cautions + methodology close the page.

### Key editorial moves
- **Anti-timing integrity** — the page is quiet at the floor and only goes "live" high in the channel; it never tells you price will fall, and when the waiting-paid rate is low the clear reading is *deploy decisively*. The waiting mechanism is prose-only (channel geometry, "not a forecast"), never a win-rate or "cheaper" stat that would make it a timing tool.
- **Position-based waiting** (not a market call) — "wait" means a lower *channel position*, capped at two years; if no lower entry arrives, the waiter deploys at the two-year price (waiting failed). The rising trend means "lower in the channel" can still mean a *higher absolute price* after waiting — stated explicitly.
- **Sub-floor vocabulary originates here** — the graduated "far below / below / just below the floor" grading was added to the shared `positionLabel` (Stage 5) so today's ~0.40× reads as "just below the floor" rather than clamping to "near the floor"; the `pos≥0` bands are byte-for-byte unchanged and only the trilogy (the sole callers) inherits the grading. See TECH_DEBT §1 (zone-vocabulary divergence) for the sitewide consistency note.

### Design lessons (the 5A→5C density arc)
The result surface went through three compaction passes worth preserving: **5A** (three tall stat slabs) → **5B** (full-width chart moved *above* a compact result band; the three slabs collapse to hero % | bonded drawdown pair) → **5C** (CSS-only one-viewport fit: chart height became a responsive `clamp(260px, 38vh, 340px)` — generous on tall displays, compressing toward the floor on a ~1366×768 laptop — plus tightened result-band padding and inter-section gaps). The goal across the arc: slider → chart → headline answer visible together without scrolling, legible across the clamp range, mobile still stacking cleanly. **Page 1's risk section was later shed (Stage 6)** down to a concise static figure + a teaser link here, delegating the full waiting/drawdown depth to this page so the two don't duplicate.

### Cross-cutting discipline
- **Rule #1:** no live value in static copy; today's position renders only via `fetchTodayPrice` (the live-state band, the slider's today marker, the live readout).
- **Reuse:** shared Power Law globals + `positionLabel`; the canonical `.help-tip` tooltip; the slider/today-tick conventions from the trilogy siblings.

### Integration
`explorations.json` (group *Positioning & Strategy*, `calculator_tile` at position 17, `interactive: true`); `sitemap.xml` @0.9; `llms.txt` (The Numbers); homepage concept card (rising-channel-with-wait-dip marker SVG) in The Numbers + Latest (rolled Bitcoin & Metcalfe's Law and The Doubling Ladder out of Latest, leaving the trilogy as the three newest); `updates.json` (6/30/26); **bidirectional `related:`** with Lump Sum or Ladder In?, Your Bitcoin Deployment Plan, The Power Law, The Bitcoin Horizon, and the Heatmap (Page 1 and Page 2 both link back per the Stage 7 audit fix); OG card `og-wait-or-deploy-now.jpg` (§6.15.1 brand-forward).

### Open items
- **Carousel slide** pending (needs a Grok Imagine video) per NEW_PAGE_CHECKLIST §8 — see §13 "Pending additions" for the proposed copy + video direction.
- **Zone-vocabulary divergence** (TECH_DEBT §1): the non-trilogy "zone" pages (`the-power-law`, BvSM, retirement) and the homepage `classifyState` still use their own position-label vocabulary; migrate-vs-document is deferred to the future bull/bear-cycles page (PAGE_IDEAS_BACKLOG).

## 35. Bull & Bear Cycles (`/bull-and-bear-cycles.html`)

**Added July 2026.** A cyclical-model page in **The Numbers** (group *Models & Trends*, next to the Doubling Ladder / Metcalfe / Heatmap), `interactive: true`, **no `calculator_tile`** (it is an analytical page, not a personal-decision calculator — same posture as the Doubling Ladder and Heatmap). Page-scoped classes use the `bb-` prefix; reads the shared `power-law-data.js` globals and the mixed-content width tier (1100 page / 880 prose).

**Governing principle — this is the honesty page; its credibility IS the product.** The spine is **CAGR + volatility ("the volatility is the price of the returns")**, *not* "drawdowns are shrinking" (which would invite the timing trap). Every optimistic claim carries its caveat at **equal visual weight** (small-sample, compression, rising correlation, non-stationarity). Uses "has behaved," not "behaves." Evidence is **graded visibly**. **There is no next-bottom prediction anywhere on the page, by design** — the prediction trap is catalogued and explicitly refused.

**The hybrid data seam (the key methodological move).** Headline cycle drawdowns are **documented daily-close extremes** hard-coded in the `CYCLES` constant (−93%\*/−85/−84/−77/ongoing), *not* computed from the sampled series — the shared ~12-day `PL_DATA` runs shallow because a peak/trough between samples is smoothed. The **visuals** (day-zero overlay, volatility) *are* computed from `PL_DATA` (so the live "where are we now" number ties exactly to the other channel pages), and each cycle line is **annotated with its true documented depth** to reconcile the smooth line against the stated %. A "How we measure a drawdown" note in the collapsible Sources section discloses this, plus the intraday-is-deeper alternative (2013–15: −81.6% to −87.7%) and the **2011 asterisk** (Mt. Gox artifacts; included in the narrative, excluded from every trend line).

### Structure (top to bottom)
Hero → tool-framing → hook (return *and* volatility are one fact; BlackRock "best 8 / worst 3 of 11 years") → **live "where are we now"** (drawdown-from-peak, days-since-peak vs the 100-day structural-bear threshold, rank vs prior bears at the same age, and the *conditional* ~$29–33K reversion reference framed as conditional) → **history of the pain** (cycle summary table + day-zero bear overlay with toggles) → **the pattern, graded** (evidence-backed / contested / unproven maturation mechanisms) → **the measured volatility** (computed rolling-vol chart + cross-asset anchors + the daily-close-vs-intraday and post-2020-break caveats) → **volatility ≠ risk** (dispersion vs permanent loss; Sortino 1.86 vs Sharpe; the XBTO quote attributed as commercial-interest) → **loss aversion** (Kahneman & Tversky; the grind; the verified Saylor "price they deserve" quote + the 32-BTC episode; worst-5yr-hold cited from NYDIG) → **the counterweight** (compression, rising correlation/not-a-safe-haven, reflexive floor claw-back, model-is-not-an-oracle) + **the prediction trap** (the $25K–$68K analyst spread, refused) → **position sizing as the survival mechanism** (non-linear risk contribution *with* the 1–2% caps; Kelly handed to How Much Bitcoin) → where-this-connects cards → collapsible **Sources & methodology**.

### Key editorial moves
- **Caveat-at-equal-weight as a visual rule** — optimistic blocks (evidence-backed grade, empirical holding-period line) are paired with a caveat block (`.bb-guard`, `.bb-callout`, `.bb-live-caveat`, the counterweight grid) rendered at the same size, never a footnote.
- **Graded-evidence three-card pattern** (`.bb-grade-strong` / `-mid` / `-weak`, green/amber/red) — reusable recipe for "here is exactly how much to trust this," used for the maturation mechanisms.
- **Computed-vs-cited is explicit** in the Sources section: live drawdown/day-count, cycle geometry, overlay, and volatility are computed; the worst-5yr hold, cross-asset multiples, CAGR/Sortino, caps, recovery magnitudes, and every named institutional claim are cited. Sources are **deliberately balanced** — commercial-interest bulls (BlackRock, VanEck, XBTO) tagged as such and paired with skeptic-leaning research (Galaxy, Baquero & Menezes).

### Cross-cutting discipline
- **The 2025 peak/trough are the only hard-coded live-framing constants** (`CYCLES`), documented for event-driven refresh in MONTHLY_REFRESH_CHECKLIST §2. Everything else is computed from the shared globals.
- **Reuse:** shared Power Law data module; `data-chart-copy` on the table + charts; the layout-level related strip, share section, and feedback widget.

### Integration
`explorations.json` (group *Models & Trends*, `interactive: true`, no tile); `sitemap.xml` @0.9; `llms.txt` (The Numbers); homepage concept card (rising-trend-with-shrinking-drawdowns SVG, amber up-swings / red down-swings) in The Numbers + Latest (rolled *Lump Sum or Ladder In?* out of Latest); `updates.json` (7/6/26); **bidirectional `related:`** with The Bitcoin Horizon, The Doubling Ladder, How Much Bitcoin, Wait-or-Deploy, and Disciplined Rebalancing.

### Revision (2026-07, content review)
A revision pass after JM's content review, in two parts:
- **Voice + correctness (text).** Removed the self-referential "we're being honest / balanced / refused" framing throughout (it reads as defensive and as an AI tell), reduced em-dashes to commas/hyphens per the new house style (now codified in **STYLE_GUIDE §10**, added the same pass), and dropped the unattributed XBTO "volatility is not risk" quote in favour of stating the point in the page's own words. Fixed a correctness error that conflated **drawdown depth** with **volatility** (they are separate measures; the page now defines volatility plainly before first heavy use and never equates the two number series). Swapped the "speculation migrating to altcoins" bullet for a properly-hedged **CLARITY Act / regulatory** note (House-passed 2025, Senate-Banking-cleared May 2026, not yet law), kept in the "Unproven" bucket.
- **New two-sided bull/bear callout** (`#define`, `.bb-define` red-bear | green-bull, stacks on mobile) inserted after the history section: defines the terms in Bitcoin context (the conventional −20% rule is useless; the depth+duration definition = 100+ days AND historically ≥77%) and how Bitcoin cycles differ from equity ones. The "Four completed cycles" lead-in now states the count (five bear markets, four complete, the fifth unresolved).
- **Live-status rebuilt as a Power-Law-anchored state machine.** The panel now reads accurately in every price regime, not just a bear: `renderLive` picks one of deep-bear / recovery / near-ATH / new-ATH / extended-above-trend from `fromPeak` and the price/trend `ratio`, and every state leads with the **Power Law position** (`ratio×` and the "% of history below/above this level" stat) as the consistent descriptive spine. The two old disclosures were merged into one message; the "$29–33K / 77% reversion" string was removed (it implied a scenario not expected given compressing volatility and price near the PL floor); the extended-above-trend state carries a symmetric "extension this far has preceded drawdowns, descriptive not a forecast" caution. Thresholds are explicit constants in the JS and flagged for review in MONTHLY_REFRESH §2.

### OG card + title rename (2026-07)
- **OG card shipped.** `og-bull-and-bear-cycles.jpg` generated via `build-og-bull-and-bear-cycles.py` (brand-forward §6.15.1, cloned from the wait-or-deploy sibling): two-tier composite over the canonical `og-synthesis.jpg` template, Cormorant title + italic subtitle, registered in `.eleventy.js` staticAssets. The one intentional deviation from the donor is a two-line subtitle drawn explicitly so the break lands at the sentence boundary.
- **Display title renamed to "Bitcoin Bull & Bear Cycles"** for SEO (the bare "Bull & Bear Cycles" was generic). Propagated across `<title>` / `og:title` / `twitter:title` / image alts / JSON-LD headline, the page H1, `explorations.json` (nav + footer), the homepage concept cards, `llms.txt`, and `updates.json`. **The URL slug stays `/bull-and-bear-cycles`** (renaming a live slug buys no SEO the title tags don't already give, and breaks links). Cross-link `desc` prose on sibling pages still uses the short "Bull & Bear Cycles" as a natural running-text reference; the related-card *title* is pulled from the registry and updates automatically.

### Open items
- **Carousel slide** pending (needs a Grok Imagine video) per NEW_PAGE_CHECKLIST §8.

## 36. The Bitcoin Retirement Stress Test (`/the-bitcoin-retirement-stress-test.html`)

**Added July 2026.** A calculator in **The Numbers** (group *Positioning & Strategy*), sibling and sober counterpart to §17 The Bitcoin Retirement. `interactive: true`, has a `calculator_tile` (SVG icon at `components/calc-tile-icons/`). Page-scoped classes use the `st-` prefix.

**Thesis.** Models **sequence-of-returns risk**: the retirement calculator projects the plan on the upside path; this page injects a *timed* bear market and shows what a crash does when you are selling Bitcoin to fund income. The honesty trap here is the *opposite* of Bull & Bear's, it risks being falsely *reassuring* ("Bitcoin's growth saves you anyway"), so it is built to show failure plainly (depletion in red), defaults recovery to Historical not Fast with a prominent **Weak** (never-fully-recovers) option, carries the non-stationarity caveat, and makes **no probability claims** (a what-if, never a forecast).

**Engine reuse (the core design).** Copies the retirement engine's projection math verbatim for baseline parity, `daysSince` / `plPriceAtDate` / `dateForYear` / `projPriceForGrowth`, the `SCENARIO` shape, and the year-by-year sell-to-cover-income loop, and reads the shared `ModelingAssumptions` (inflation 6.5% m2-growth, Power Law trend) so the no-crash path matches the Retirement page exactly. The one new piece is `crashMultiplier(year, crash)`: a timed price-path perturbation that multiplies onto the trend **price only**. The withdrawal math is untouched, so the same nominal income is funded by selling more BTC at the depressed price. The lasting stack damage is emergent sequence risk, not a special case. The loop runs twice (baseline `mult=1` and crashed) to produce the two paths.

**The three inputs.** Crash depth (−40 / −60 / **−77% historical characteristic** / custom, default −60, not the worst); crash timing (year of retirement it begins, the decisive variable, made prominent); recovery shape (Fast / **Historical default** / Slow / **Weak**, where Weak asymptotes to a ceiling below trend). All URL-encoded (reuses the retirement param names `stack`/`retire`/`income`/`years`/`dca`/`incbasis` plus `cdepth`/`ctime`/`crecov`) so scenarios are shareable and carry between the two pages.

**Outputs.** (a) Two-path overlay chart, baseline vs crashed, with crash-year and depletion markers; (b) a plain survive/deplete headline that swaps green→red and states failure without softening ("your plan does not survive this scenario, the stack drains to zero in [year]"); (c) the **timing-sensitivity view**, the core lesson, the same crash at years 1/3/5/10/15 as a bar chart + table against the no-crash baseline, framing early-crash-brutal and late-crash-harmless with equal weight; (d) two-view audit table (crashed path, crash years flagged, BTC-sold column visibly rising) + CSV carrying the scenario and crash params.

**v2 (shipped July 2026, three commits).** The two JM-deferred features plus a shared-module refactor. **(1) Shared crash model.** `crashMultiplier`, the four-preset `RECOVERY` table, `underwaterSpan`, `drawBandLabel`, and a `makeUnderwaterPlugin(cfg)` factory were extracted to **`src/_includes/_pageassets/shared/crash-model.js`**, consumed by both this page and the allocation drift chart (which had ported verbatim copies); bit-identical on both. Closed the three TECH_DEBT duplication entries (STYLE_GUIDE §6.36 repointed at the module). **(2) Spending-cut lever** (labelled **"Spending cut"** — renamed from "Spending flexibility" in v2.1 for the terse noun-phrase register of its siblings; presets read −10/−20/−30%)**.** A "Spending cut" control (slider 0–50, presets 0/10/20/30, default 0 = off) cuts withdrawals by X% **while the market sits below its pre-crash level** — the cut window is derived from the *price path* (`crashMultiplier(y) < 1`), NOT the stack's underwater span (the stack lags because coins sold cheap are gone; binding to it would overstate the mitigation, guarded by `assertFlexWindow` and `window.stFlexQA()`). The crashed loop runs twice when active (full-spend + reduced-spend, plus baseline = three paths); `flex = 0` is bit-identical to v1. The verdict extends with the mitigation result — the headline case is the **survival flip** (full spending depletes, the cut survives), stated with its cost in forgone income; non-flip cases quantify the improvement, and a no-rescue branch says so plainly. **Weak-recovery consequence stated, not hidden:** under Weak the market never regains its pre-crash level, so the cut persists to the horizon (copy renders when Weak is active). Chart gets a third dashed line, the timing-sensitivity view gets paired full-vs-reduced bars, audit/CSV flag cut years (✂) and total forgone income. URL param `flex` (absent/0 = off). **(3) Worst-case-timing finder.** A "Find the worst timing" button by the crash-timing control scans crash years 1..retirement-years under ALL current settings (depth, recovery, and the cut lever as set), sets the timing input to the winner (full recompute + URL sync), and renders one result line in the "worst timing, not a prediction" register. The line **clears on any input change** (it describes a scan of a now-stale config — cleared at the top of `renderAll`, re-set by the finder after its own recompute). Synchronous (years × the existing loop is trivial); no probability language. **Scoring (v2.1 fix — record the WHY):** worst = earliest depletion, then among survivors the **smallest minimum inflation-adjusted stack ALONG the path** (the post-crash trough, `minRealStack`), then earlier crash year. v2 originally used the *ending* stack, which handed the title to a **year-30 crash on pure terminal mark-to-market** — a final-year drop with no recovery runway — contradicting sequence risk and the page's own "early is brutal / the final gap is not what you would feel" copy. The v1 timing view only sampled years 1/3/5/10/15, so the near-horizon artifact never surfaced until the finder scanned every year. The trough measure makes an early crash (sold into for years) score worst, as it should; depletion unifies naturally (trough = 0).

**v2.1 polish (JM production review, 2026-07).** The finder re-scoring above is the substantive item; the rest are copy/visual: lever renamed **Spending flexibility → Spending cut** (full occurrence sweep — label, tooltip, aria, chart legends + the legend filter that keys on the label, verdict/mitigation copy, audit caption, flex-summary, CSV header, §36); cut presets show the **minus sign** (`−10/−20/−30%`, display-only, `flex` stays a positive int). Sweep-chart **mitigated bars moved to amber/cream** (`C_MIT #e6c88f`) out of the rose crash family so the three-bar groups read apart (the main overlay's mitigation *line* stays dashed rose — distinguished by dash, not hue). Comparison table column **"Cost vs no crash" → "Final stack vs no crash"**, cells `61% smaller → −61%`, with a header `?` tooltip; note the **CSV has no such column** (it exports the audit table, not the sweep), so that clause was N/A. **No-crash mean-reversion tooltip (canon):** on the faint no-crash bar — *the price reverts to trend, the stack does not; the residual gap is the sequence cost, priced.* Phrasing rule recorded: never write "the stack reverts to trend" (false — the coins sold cheap are gone). "Reading the result" gained a real-levers sentence + an inline cross-link to **Bitcoin Portfolio Allocation** (the stack-sizing question; distinct from the related-cards, which carry How Much Bitcoin).

**v2.2 (line-colour unification + verdict-copy rationalization, 2026-07).** Two build items. **(1) Cut = amber, everywhere.** The main-overlay mitigation *line* moved from the rose-lighter (`#eab4a2`) to the sweep's amber `C_MIT #e6c88f` (dash retained), closing the v2.1 item-D remainder: the overlay now reads blue baseline / rose crash (solid) / **amber cut (dashed)** — three distinguishable hues, no longer dash-only against rose. The "Reduced depleted" marker follows to amber, and the verdict-area cut identity moves with it — `.st-mitigation` accent + tint, `.st-flex-summary`, and the audit ✂ `.st-cut` glyph all shift from the rose family to the amber family (`rgba(230,200,143,…)` / `#e6c88f`), so a mitigation message is never framed in crash-rose and "the cut" reads one colour across chart, verdict, and audit. **(2) Verdict copy rationalized to STYLE_GUIDE §10.3 ("Numbers in verdict prose").** The survive verdict's stress-period sentence is now **origin-first**: "the crash takes the stack from about `{$preCrash}` to `{$trough}` — a `{Z}% fall`" — `$preCrash` is the underwater-band **onset** level, `$trough` the path minimum, and `Z = round(100·(1 − trough/onset))`, so the three figures reconcile by construction and match the band. The endpoint sentence's `$` pair moved into em-dashes beside its `%` (`— $A versus $B —`; a deliberate §10.2 exception, the pair bracketing the anchor is the clearest break). A **not-recovered sentence shape** was added for Weak/never-regain spans ("…stays below that pre-crash level through the horizon, never regaining it… the stack never climbs back… N below the line"), so the old "before regaining it" no longer dangles when there is no recovery. **Canon correction (record, do not re-derive from the spec file):** the tweak spec asserted the mitigation's "lean years" is "the same window" as the verdict's underwater span and should bind to it. **That premise is retracted.** The verdict's `{N}` is the **stack** underwater span (years the stack stays below its pre-crash value); the mitigation's `{$F}` (forgone income) is summed over the **price-path cut window** (`crashMultiplier < 1`). They coincide only at the Historical-recovery default (both 3, JM's screenshot) and diverge in ~55% of adjustable survive cases (2196/4000 scanned). So the mitigation cost is stated **self-anchored** — "…costs about `{$F}` of income across **the `{M}` years the cut ran**" (`M = m.cutYears`) — **never** "those `{N}` years", which would assert a false identity with the verdict span. This is the concrete case behind STYLE_GUIDE §10.3 rule-4's corollary.

**v2.2.1 (finder display basis, 2026-07).** JM caught the worst-timing finder reading "$788K at its lowest" while the verdict and chart showed a ~$1.0M trough at the same settings — both correct, but the finder's figure differed on two unlabeled dimensions (it displayed its *scoring* metric: the today's-dollars minimum of the *funded/reduced* path, deflated ~5 years at 6.5% from the ~$1.08M nominal reduced trough). Fix is **display-only**: scoring still ranks by the today's-$ minimum along the funded path (cross-year fairness, unchanged), but the finder now **displays that timing's nominal trough** to match the page's verdict/chart currency — the full-spend crashed trough when the cut is off (so it equals verdict sentence 1 exactly), the reduced-path trough named "**with your `{X}%` cut**" when the cut is on (its trough is legitimately higher; the clause explains the small gap vs the full-spend figure). Records STYLE_GUIDE §10.3 rule 5 (adjacent figures share a basis or name it).

### Integration
`explorations.json` (group *Positioning & Strategy*, `interactive: true`, `calculator_tile` SVG at position 18); `sitemap.xml` @0.9; `llms.txt` (The Numbers); homepage concept card in The Numbers + Latest (rolled *Your Bitcoin Deployment Plan* out of Latest); `updates.json` (7/6/26); **bidirectional `related:`** with The Bitcoin Retirement, Bull & Bear Cycles, How Much Bitcoin, and Disciplined Rebalancing; OG card `og-the-bitcoin-retirement-stress-test.jpg` via `build-og-the-bitcoin-retirement-stress-test.py` (brand-forward §6.15.1, three-line title).

### Open items (stress test)
- **Carousel slide** pending (needs a Grok Imagine video) per NEW_PAGE_CHECKLIST §8.

_(v2 features — the worst-case-timing finder and the Spending cut lever — shipped July 2026; see the "v2 (shipped)" + "v2.1 polish" paragraphs above. The v1 placeholder prose in "what this means" was replaced with live prose describing the shipped lever, and its TECH_DEBT entry closed.)_

## 37. Bitcoin Portfolio Allocation (`/bitcoin-allocation-sizing.html`)

**Added July 2026** (title "Bitcoin Portfolio Allocation"; slug/permalink stays `bitcoin-allocation-sizing`). A calculator in **The Numbers** (group *Positioning & Strategy*), the consequences counterpart to §-How Much Bitcoin. `interactive: true`, `calculator_tile` (SVG icon). Page-scoped classes use the `as-` prefix. US spelling ("math").

**Thesis (v2, after two content reviews).** How Much Bitcoin answers *what fraction is optimal* (Kelly); this page answers **one question and lands it**: over a long horizon, does adding bitcoin make a portfolio meaningfully better despite the drawdowns? It leads with a computed **verdict** (the affirmative case stated WITH its cost in the same breath); the three effects are supporting evidence. **The v2 reframe (JM #53/#54) fixes a real contradiction with §-The Bitcoin Horizon:** the old third face called bitcoin's volatility share "risk," but Horizon argues at length that *volatility is not risk*. So the third effect is now **"Portfolio influence"** — the neutral, double-edged *engine* (how much of the portfolio's movement bitcoin drives, historically more of it to the upside), explicitly NOT a hazard. **True risk is named correctly:** permanent loss, being shaken out and selling into the drawdown you cannot hold through. The #54 point is present (there is no inflation-beating portfolio built only from low-volatility assets). Cross-links Horizon. It makes **no optimal-% recommendation**.

**The math + the Power Law projection (v2).** Two portfolios, `w` in BTC and `1−w` in a broad-market sleeve (BTC vol 45%, sleeve vol 12%, correlation **0.50**, kept high per the post-ETF note). `btcInfluence(w)` = bitcoin's share of portfolio variance; `drawdownHit(w,d)=w·d`; upside `w·mBtc+(1−w)·mTrad`. **Bitcoin growth is now projected from the shared Power Law, not a flat CAGR** (which contradicted the site's own declining-CAGR thesis). Reads `plPrice`/`TODAY_DAYS`/`TODAY_PRICE`/`fetchTodayPrice` from `power-law-data.js`; `trendGrowth(H) = plPrice(today+H)/plPrice(today)`; `currentRatio = spot/plPrice(today)` (live). Three modes: **hold today's ratio** (`mBtc = trendGrowth`), **return to trend** (`mBtc = trendGrowth/ratio`), **flat rate** (override). **Regime-aware default:** below trend → hold-ratio (grow with the trend from a discount, don't bank on it closing); at/above trend → return-to-trend (don't bake in a premium the PL mean-reverts). At today's ~0.43× discount, hold-ratio ≈ 13.6x over 10y, so the 10% verdict reads about **+42%** (up from the old flat-15% +5.6%) — higher because a methodological inconsistency was fixed, not an input tuned; the **regime transparency line** near the verdict states the ratio and why the number is what it is, which is what keeps a large default honest. Influence-share reference points unchanged: 2%→4%, 5%→11%, **10%→24%**, **20%→48%**, 50%→85%. (Heads-up: the horizon clause reaches +110% at 20y under hold-mode PL growth; aggressive but the honest PL reading.)

**Inputs.** Primary lever: allocation % (slider 0–100, presets 1/5/10/20), in the **"Is it worth it?"** section. The **assumptions sit ABOVE it** (JM #57, "the ground rules"): time horizon, bitcoin Power-Law projection (hold / return-to-trend / flat + rate slider — the hold mode's **display label** is "Today's gap to trend persists", JM's on-thesis wording; the URL key stays `btc=hold`), sleeve rate, **crash depth default −40%** (shrinking-drawdowns copy, not −77%-as-characteristic), optional comma-formatted portfolio $, and a **Reset defaults** button. URL-encoded (`alloc`/`hz`/`tradr`/`depth`/`btc`/`flat`/`port`, plus `strat`=`ride`|`rebal` and `cmp`=`1` for the drift chart — absent = defaults, so legacy links decode unchanged).

**Outputs.** (a) The **verdict** (answer + cost + the "small position, outsized weight" drift and horizon-scaling clause); (b) the **regime transparency line**; (c) the three **effects** (extra return / drawdown-as-price-of-admission / portfolio-influence-as-engine); (d) **"Your portfolio, year by year"** — the drift chart (see below); (e) the **comparison** across allocations (grouped bars + table); (f) **"can you hold it?"**; (g) audit + CSV (now including the year-by-year path). *The standalone rebalancing-tension "After you choose" section was removed in the drift-chart PR; its content lives in the chart's disclosure caption.*

**The drift chart ("Your portfolio, year by year", `#portfolio-over-time`).** A Chart.js stacked-area line (`asDriftChart`), inserted **after the three effects, before the comparison**. Shows the two sleeves growing over the horizon — **Traditional** blue-gray `#5e7a92` on the bottom (`fill:'origin'`), **Bitcoin** `#F7931A` stacked on top (`fill:'-1'`) — plus horizontal **composition bars** ("Today" / "At year H") and an endnote, all reading `computePaths(S)`'s `btcShare` as the single source. **Sleeve→color binding is asserted on the render, not just the data** (`assertDriftBinding` / `window.asDriftBinding`): Phase A shipped inverted because a Chart.js `order` override reordered the *stack* while the data arrays stayed correct — the lesson is **verifying data arrays is not verifying the chart; assert the series→color binding explicitly, since a wrong mapping can accidentally render the story everyone expects**. Fix: drop `order` so array order (trad→btc) governs stacking. (Phase A removed an earlier dashed crash *envelope*; crash modeling returned as the crash disclosure below.)

**The crash disclosure (Phase B).** A second progressive disclosure in the drift section, **after the composition endnote, before the rebalance disclosure** — opening it (`S.crashOn`) drops a bitcoin crash on the path. Controls: a **crash-year slider** (1..H−1, clamps on read when the horizon shrinks), a **recovery** segmented control (**Fast / Historical / Weak** — the Stress Test's preset display names verbatim; its "Slow" is omitted for a minimal surface), and depth **reuses the `−{depth}%` assumptions input** (no new depth control). The crash applies the Stress Test's `crashMultiplier` as a per-year **price** multiplier on the BTC path only (traditional sleeve untouched, stated in the honesty notes); `crashMultiplier` + the recovery presets are **ported verbatim** into this page (they live in the Stress Test's IIFE, not a shared module — extraction candidate logged in TECH_DEBT). With crash off the multiplier is identically 1, so `computePaths` is **bit-identical** to Phase A (the parity guard). Both strategies run the crashed path, so **rebalance's annual reset buys bitcoin while it is down** — volatility harvesting made visible (a crash-aware caption appends to the §5.2 block when both disclosures are open). A dashed **no-bitcoin benchmark** (`P0·(1+tradr)^t`, neutral dim — not danger red) renders while open; the **verdict** compares the crashed portfolio to it at year H with three branches — **ahead / behind / near-even** — and the *behind* branch is required copy (an early crash + Weak recovery at a short horizon genuinely loses; a crash tool that only reassures is not analysis). URL: `cy` (presence ⇒ crash on) + `rec` (omitted when Historical); Reset clears the crash; the legend filter and binding assertion extend to crash mode (orange ÷ total = crashed `btcShare[H]`). A **mirrored allocation slider** sits directly above the chart (a second representation of the top allocation lever — two representations, one `S.allocPct` state, synced via `syncAllocControls()`; no preset chips on the mirror) so the slider and its chart response share a viewport (the playground principle, POSITIONING_STRATEGY_GUIDE §3.5 / STYLE_GUIDE §6.35). A **progressive-disclosure** control ("What if you rebalanced back to your target each year?") reveals a **let-it-ride / rebalance-annually** toggle and a thin comparison-overlay line of the other strategy's total (that overlay is **filtered out of the legend** while the disclosure is closed, so it never renders struck-through). **The merged caption is canon copy** (record verbatim; JM tweaks in prod): it carries the winner-drifts-up rebalancing tension *and* the §5.2 honesty caveat — that on a smooth trend path rebalancing always shows the lower endpoint, so this is the drift trade-off, not a verdict on rebalancing (DR cross-link on the final phrase).

**Phase C refinements (crash view).** Four additions on top of Phase B: (1) an **underwater band** — while the crash is open, an inline Chart.js plugin (`driftUnderwaterPlugin`) draws a rose wash (`rgba(192,57,43,0.14)` — bumped in Phase D for legibility over the opaque orange fills; the Stress Test keeps its lower alpha) from the crash year to the recovery year, a dashed cream **`pre-crash level`** line at the active strategy's crashed total *at* the crash year (`onset`; the multiplier keeps year `cy` at 1.0 and dips over `cy→cy+1`, so `cy` is the honest pre-drop level), and a label **`{n} years underwater`** / **`not recovered within your horizon`** (edge-clamped in Phase D via `drawBandLabel` so a late/flush-right band never clips — the same fix was ported to the Stress Test's plugin, which had the same latent bug). This is a **verbatim port of the Stress Test's `underwaterPlugin`** technique + tint/label tokens (the origin; both pages now use it — see STYLE_GUIDE §6.36, and TECH_DEBT for the shared-extraction note). Band drawn *over* the fills (the sleeves are opaque, unlike the Stress Test's unfilled lines). Underwater is measured on the **total**, not the bitcoin sleeve. (2) **Value-scaled bars** (`.as-drift-bars`, three rows: **Today** / **At year {H}** / **No bitcoin, year {H}**) — **Phase D** replaced BOTH the old fixed-width composition bars and the Phase-C endpoint text line (`.as-drift-endpoint` fully removed — element, CSS, and renderer). Bar length ∝ value on ONE shared **linear** scale (max of the three; the always-on no-bitcoin bar can win in deep-crash states — no special-casing), internal segments ∝ composition; captions are basis-aware — dollars (matching the axis/audit) when portfolio $ is set, else **multiples of start** (`5.4×`; Today `1.0×`; never raw index numbers). The no-bitcoin bar is **always visible** (the everyday ambassador of the no-bitcoin comparison; the chart's no-bitcoin *line* stays crash-disclosure-only). Linear scale is honest — at long horizons the Today bar is a sliver, which is the message; only a 2px segment minimum keeps things from vanishing. Reads the same `computePaths` result (single source); the drift **endnote sentence stays** (it narrates the share drift the bars show but don't say). (3) A **pinned y-axis** while the crash is open: `y.max = niceCeil(max(smoothPathStackMax, currentRenderedMax))`, recomputed only when *assumptions* change (a `driftPinKey` of alloc/horizon/rates/mode/depth/portfolio/strategy) — **not** on crash-year or recovery change, so dragging the crash year slides the dip under a fixed frame and Fast/Historical/Weak redraw against an identical scale; closed → `y.max` cleared, auto-scaling resumes (open/close goes through `update('resize')`). (4) **Deep-link anchors**: the drift section keeps `id="portfolio-over-time"`; the crash wrapper adds `id="crash"`. On load, `cy` (or `#crash`) opens the crash disclosure, `cmp=1` opens the comparison, and the drift section is scrolled into view after render via a double `requestAnimationFrame` (so it doesn't fight native hash scroll) — a paramless, hashless load behaves exactly as before. Example: `…?alloc=20&hz=10&cy=3&rec=weak#crash`.

**Engine / parity.** `computePaths(state)` walks the portfolio one year at a time for both strategies; it does **not** fork the assumptions. **Return-to-trend path shape:** the Retirement engine's revert convention values its stack at the *trend* price throughout (terminal factor `g`), which cannot start from this page's below-trend spot and would break parity (the closed-form revert multiple here is `g/r`). Resolved to the design-doc **geometric-amortization fallback** — `gBtc(t) = [plPrice(t)/plPrice(t−1)]·(1/r)^(1/H)`, trend-shaped and closing the gap to trend by year H; its horizon product equals `g/r` exactly, so `ride.total[H]/P0` reproduces the shipped `effects(w).withBtc` to machine precision for all three modes. **Parity is dual-source, not refactored:** the verdict/comparison keep the closed form; the loop is a parallel path with a runtime `console.assert` on the active allocation plus a full-matrix `paritySweep()` (presets × 3 modes × horizons × sleeve rates) run silent-on-pass at init and exposed as `window.asParitySweep()` for QA. Dual-source is logged in TECH_DEBT.

### Integration
`explorations.json` (group *Positioning & Strategy*, `interactive: true`, `calculator_tile` SVG at position 19); `sitemap.xml` @0.9; `llms.txt` (The Numbers); homepage concept card in The Numbers (after How Much Bitcoin) + Latest; `updates.json` (7/9/26); **bidirectional `related:`** with How Much Bitcoin, Bull & Bear Cycles, The Bitcoin Retirement, and Disciplined Rebalancing (reciprocal backlink added to How Much Bitcoin); OG card `og-bitcoin-allocation-sizing.jpg` via `build-og-bitcoin-allocation-sizing.py` (brand-forward §6.15.1, three-line title).

### Open items (allocation sizing)
- **Carousel slide** pending (needs a Grok Imagine video) per NEW_PAGE_CHECKLIST §8.
