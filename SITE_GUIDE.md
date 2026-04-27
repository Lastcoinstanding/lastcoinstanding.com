# Site Guide

_A working reference for the editorial voice, visual vocabulary, and technical patterns that define Last Coin Standing. Consult this before adding new content, and update it whenever a decision crystallizes into a principle worth preserving._

_For typography, color tokens, component recipes, and visual anti-patterns, see the companion **`STYLE_GUIDE.md`** at repo root. The Site Guide owns voice, content, and technical architecture; the Style Guide owns visual implementation details._

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
- PAT scope needed: `public_repo`. **Rotate PAT after work session.**

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

Twelve featured insight slides, each pairing:
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
- ~~**Style Guide compliance fixes**~~ — substantially complete (April 27, 2026). 8 of 10 anti-patterns from `STYLE_GUIDE.md` §5 fully resolved across four commits this day (`60b051e`, `a7be484`, `228b5d2`, `430134e`). Two items remain deferred:
  - **§5.8 Real Estate canonical tab migration.** Real Estate's tabs ("THE POSTPONED PURCHASE", etc.) are still the uppercase-tracked single-line pattern. Migrating to `STYLE_GUIDE.md` §6.2 canonical (Roman numeral on top + Inter title below) would change tab HTML structure plus CSS. Bigger than a typography swap but well-scoped.
  - **§5.10 Synthesis SVG mobile legibility.** Component circle labels render at ~7-9px effective on narrow mobile viewports (the 92-unit-diameter circles bottleneck the achievable text size). Commit `430134e` bumped labels to 13-14px on mobile breakpoints — partial mitigation. Full fix requires resizing `ORB_R` on mobile via JS and bumping circle visual area, possibly redesigning the layout to allow labels outside the circles instead of inside.
- **Power Law nav normalization** ~~moved About inside `.nav-links` to match the other 13 pages~~ — completed by the refactor (was a side-effect of using the canonical layout).

---

_See section 14 for latest Chart.js patterns. See section 11 for Power Law page details. See section 12 for WMHTB page details._

## 11. Bitcoin and The Power Law (`/the-power-law.html`)

**Added:** April 18, 2026. A four-tab page presenting the Bitcoin Power Law as an accessible but intellectually rigorous explainer, with an interactive forward-looking calculator.

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

### Tab 4: Forward-Looking Calculator

- Scenario selection: Floor (default, conservative) / Trend / Upper toggle buttons
- Six inputs: investment amount ($60K default), time horizon (5/10/15/20 years), current BTC price ($84K), home price ($420K), home appreciation (3.5%/yr), mortgage rate (6.8%)
- Two result cards: Bitcoin side (projected value, CAGR, return %) vs House side (projected value, equity, monthly mortgage, interest paid, remaining loan, total cost of ownership)
- Summary bar: "You could buy X.X houses outright in [year]"
- Cross-reference to retrospective calculator on bitcoin-vs-real-estate.html
- Disclaimer: not investment advice, model-based projection

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

## 13. Homepage carousel — completed set (12 slides)

All 12 slides deployed with 16:9 widescreen silent videos, minimalist copy pattern (label + headline + CTA, no `.insight-desc`).

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
| 4 | Is Bitcoin a Bubble? | A thing isn't a bubble simply because it has been called one | ~10 bubbles burst; one amber object remains impervious |
| 5 | The Half-Life | How long until your money loses half its value? | Candle burning down asymptotically |
| 6 | The Melting Ice Cube | Holding cash is not safety. It's an active decision with an ongoing cost | Ice cube melts to fragment on weathered wood |
| 7 | The Bitcoin Synthesis | Six components. One irreducible synthesis | Six antique keys assemble into clockwork mechanism |
| 8 | What Bitcoin Is | Most people consider just a few dimensions. Bitcoin is all of them, simultaneously | Raw mineral crystal, traveling amber light |
| 9 | The Bitcoin Migration | From what can't be fixed, to what can't be broken | Heavy wooden door opens ~2/3, amber light |
| 10 | The Trilemma | Some problems are navigated, not solved | Three geometric counterweights in coupled sway |
| 11 | The Money Trees | Two systems. Different roots. One outcome | Two trees; left withers, right unchanged |
| 12 | The Fixed Pie | Your share remains undiluted — for eternity | Unmarked gold coin; surrounding coins dissolve |

## 14. Bitcoin vs. Real Estate — custom interest rate input

**Added:** April 18, 2026. Third optional input field "Your interest rate" on Tab 3 (Postponed Purchase calculator).

- Grid changed from 2-col to 3-col (1fr 1fr 1fr) for the three optional inputs
- Custom rate overrides `mortgageRates[sy]` throughout all calculations
- Shows `(vs. prevailing X%)` parenthetical in scenario text when custom rate active
- Clears on year change; placeholder updates to show new year's average
- Clamped 0.5%-15%
- Flows through to: monthly payment, remaining balance, total cost, rent estimate, DCA savings
- Mobile responsive at 768px and 480px stacks to single column

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

_Last updated: April 27, 2026. Update this document as editorial decisions crystallize into principles worth preserving._
