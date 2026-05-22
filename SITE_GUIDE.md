# Site Guide

_A working reference for the editorial voice, visual vocabulary, and technical patterns that define Last Coin Standing. Consult this before adding new content, and update it whenever a decision crystallizes into a principle worth preserving._

_For typography, color tokens, component recipes, and visual anti-patterns, see the companion **`STYLE_GUIDE.md`** at repo root. The Site Guide owns voice, content, and technical architecture; the Style Guide owns visual implementation details._

_For runnable procedures, two checklists at repo root: **`NEW_PAGE_CHECKLIST.md`** for everything that needs to land when a new exploration page ships (nav entries, sitemap, social cards, cross-links, docs); **`MONTHLY_REFRESH_CHECKLIST.md`** for recurring time-sensitive maintenance (TODAY constants, as-of dates, chart freshness captions). Open these when shipping or maintaining; the guides above are reference, the checklists are protocol._

---

## 1. Editorial posture

Last Coin Standing is a **statement piece, not a monetization funnel**. Its purpose is to explain Bitcoin structurally — through contrast and clarity — so that a thoughtful reader can understand what Bitcoin is by seeing what everything else isn't.

The voice is **restrained, declarative, and serious**, with quiet purpose and intent. The site earns the right to make structural claims ("for eternity," "impervious," "irreducible") through the seriousness of everything else on the page. It never overclaims, but it also doesn't hedge on what it actually believes.

Tone the site reaches for: elegiac seriousness. Tone the site avoids: maximalist marketing.

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
- **"The Fixed Pie" concept rename pass.** "Fixed" reads as limitation in ordinary language; the concept's actual thesis is permanence/imperviousness to dilution. Candidates: "The Share That Holds," "Your Permanent Share," "What Cannot Be Diluted." A rename touches: homepage carousel label, nav dropdown, tool page, sitemap, internal links, meta tags.
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

## 13. Homepage carousel — completed set (17 slides)

All 15 slides deployed with 16:9 widescreen silent videos, minimalist copy pattern (label + headline + CTA, no `.insight-desc`).

### Typography tune

- Label: 0.78rem, 2.5px tracking, 0.85 opacity
- Headline: 1.75rem, 1.35 line-height
- Gap: 0.9rem between elements
- Mobile: min-height auto (replaces fixed 640px/560px)

### Slide inventory

| # | Slide | Headline | Video concept |
|---|-------|----------|---------------|
| 1 | What Money Has To Be | One money must do three things at once — or it cannot do any of them | Three ornate brass lenses on oak workbench, candle behind; each shows same flame |
| 2 | Bitcoin vs. Real Estate | Housing became the default store of value by elimination, not merit | Golden hour → twilight → dark silhouette |
| 3 | Bitcoin and The Power Law | For every 13% increase in Bitcoin's age, the trend price doubles | Town at dusk, lawful illumination pattern |
| 4 | The Bitcoin Horizon | What looks like turbulence over the course of a day is trajectory over the course of a decade | Small ship at golden hour, crossing toward the horizon; near-shore chop, steady distant line; persistence-through-turbulence |
| 5 | Is Bitcoin a Bubble? | A thing isn't a bubble simply because it has been called one | ~10 bubbles burst; one amber object remains impervious |
| 6 | The Half-Life | How long until your money loses half its value? | Candle burning down asymptotically |
| 7 | The Melting Ice Cube | Holding cash is not safety. It's an active decision with an ongoing cost | Ice cube melts to fragment on weathered wood |
| 8 | The Bitcoin Synthesis | Six components. One irreducible synthesis | Six antique keys assemble into clockwork mechanism |
| 9 | What Bitcoin Is | Most people consider just a few dimensions. Bitcoin is all of them, simultaneously | Raw mineral crystal, traveling amber light |
| 10 | The Bitcoin Migration | From what can't be fixed, to what can't be broken | Heavy wooden door opens ~2/3, amber light |
| 11 | The Trilemma | Some problems are navigated, not solved | Three geometric counterweights in coupled sway |
| 12 | The Money Trees | Two systems. Different roots. One outcome | Two trees; left withers, right unchanged |
| 13 | The Bitcoin Retirement | A stack that lasts a lifetime — or runs out before you do | Solitary mature tree in golden-hour meadow; sun moves from behind canopy to streaming rays through it; latent-state opening, persistence across the arc |
| 14 | Disciplined Rebalancing | A model you believe in is a protocol you can run | Wheat field at golden hour, ears swaying in coupled bounded oscillation; fixed camera, stable disequilibrium |
| 15 | The Fixed Pie | Your share remains undiluted — for eternity | Unmarked gold coin; surrounding coins dissolve |
| 16 | Bitcoin vs. The Stock Market | Three growth curves. One decisive horizon | Three trees in a meadow at golden hour; the middle tree grows dramatically taller and fuller-canopied over 10 seconds while the flanking trees mature modestly; latent-state opening, divergent outcomes from identical conditions |
| 17 | Borrowing Against Your Stack | Every coin sold today is a coin that compounds for someone else | Solitary ancient standing stone — weathered, lichen-marked, ~six feet tall — in a golden-hour meadow; tall grasses bend in gentle wind, long shadow extends from the stone across the foreground; the stone itself does not move; quiet persistence as the visual argument |

### Iteration record — slide 16 (May 2026)

The BvSM slide took two video briefs to land. Captured here because the lesson generalizes to any future *bitcoin vs X* comparison slide; the prompt-craft principle now lives in §6 ("Comparison metaphors: prefer living elements over industrial ones").

The first brief proposed *three glass vessels filling at different rates under candlelight* — a comparison metaphor mechanically right (different fill rates = different growth rates, the amber vessel cresting and overflowing). Output was technically correct but the lab-bench register fought the site's atmospheric/lived-in voice; the cooler vessels also rose more than the brief specified, weakening the growth differential the slide depends on.

The trees brief — *three young trees in a meadow at golden hour, middle one growing dramatically more* — produced a substantially stronger take on first try. Living-element comparisons read more naturally than industrial-element ones in the site's tonal grammar; *single-element-with-different-states* (one tree grows more than another) is also more reliable than *multi-element-with-different-behaviors* (one vessel fills at a different rhythm than another) because the former matches a familiar time-lapse nature pattern while the latter requires Grok to invent visual logic.

The trees direction has light visual overlap with two other tree-themed slides (slide 12 Money Trees / two trees, slide 13 Bitcoin Retirement / one tree). Adjacency is broken by slide 14 (wheat field) and slide 15 (gold coin) between slides 13 and 16; framings differ enough (centered single vs wide three) that the shared visual vocabulary reinforces site identity rather than producing monotony — the carousel's overall grammar is part of what makes the set feel like one artifact.

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
| Current trajectory | `#a89c8a` (muted tan) | dashed `[4,3]` 1.5px | Anchored to live BTC price |
| Traditional 60/40 | `#5e7a92` (cool blue-gray) | dashed `[5,4]` 1.4px | Real-return benchmark |

Trend, drawdown, current-trajectory render with full saturation; floor and upper render with reduced visual weight to emphasize trend as the central case. A `bandFillPlugin` adds subtle amber `rgba(224,148,34,0.05)` fill between floor and upper. The legend has two group labels (`Power Law bands — per bitcoin` for the top three lines, `Portfolio value — total stack` for the bottom three).

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
7. **Disciplined Rebalancing** — applies the channel as a sell-and-rebuy protocol; deepest specialization

Phase 4 strengthens this reading order by separating *application* (BvSM, BvRE, retirement, disciplined rebalancing) from *foundation* (Power Law). BvSM was added at the top of the reading order in May 2026 because it requires the least personal context from the reader and proves the framework with the broadest comparator most readers already trust.

---

## 19. Bitcoin vs. The Stock Market (`/bitcoin-vs-the-stock-market.html`)

**Added:** May 2026. A decision-frame page for the bitcoin-vs-equities question, structured as a four-section progressive argument that uses the Power Law as the structural reference and the historical record as the stress test. Sits in The Numbers bucket per `_data/explorations.json` (`category: "numbers"`, `interactive: true`, `is_calculator: false` — the calculator takes a hypothetical dollar amount but does not take inputs about the user's life, so it doesn't earn a tile on the Calculators constellation page).

### Four-section progressive arc

The page reads as a single argument unfolding across four registers, each marked by a `.section-eyebrow` pill above its `h2` (see `STYLE_GUIDE §6.20`):

| § | Eyebrow | Section | Character |
|---|---|---|---|
| 1 | `FRAMEWORK` | The Power Law as cautionary tale | Visual + prose introduction to the model |
| 2 | `LOOKING BACK` | What the historical record says | Unified calculator (Lump sum / Weekly DCA toggle) |
| 3 | `LOOKING FORWARD` | The forward projection | Dual BTC trend-basis + current-price line vs S&P / NDQ |
| 4 | `TAKEAWAY` | The long-horizon argument | Synthesis, convergence sentence, methodology link |

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
- **Live BTC price fetch (Phase 2).** Currently using hardcoded `TODAY_DAYS` and `TODAY_PRICE` constants refreshed monthly per `MONTHLY_REFRESH_CHECKLIST.md`. Live fetch is on the Tech Debt list but deferred — see the checklist's *"Why not live fetch"* section.

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

_Last updated: May 2026. Update this document as editorial decisions crystallize into principles worth preserving._
