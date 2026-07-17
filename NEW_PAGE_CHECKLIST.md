# New Page Launch Checklist — Last Coin Standing

Every new exploration page that ships on the site needs the same set of
integration steps to land *cleanly* — wired into the nav, discoverable from
the homepage, indexed in the sitemap, decorated with proper social cards,
cross-linked with companion pages, and reflected in the documentation. The
checklist below is the runnable procedure. Run it once per page launch;
each item is independent and can be checked off as it lands.

Companion docs:

- `SITE_GUIDE.md` — editorial and structural conventions (page sections,
  carousel inventory, reading order)
- `STYLE_GUIDE.md` — typography, color tokens, component recipes
- `TECH_DEBT.md` — open architectural items
- `MONTHLY_REFRESH_CHECKLIST.md` — recurring time-sensitive maintenance
  separate from per-page launch

---

## 1. Page implementation

Assumed complete by the time you reach this checklist. The page is a
`src/<slug>.njk` template with a `base.njk` layout, page-scoped assets in
`src/_includes/_pageassets/<slug>/`, and a clean dev build. Skip ahead.

One check is NOT assumed and must be made explicitly before shipping:

- [ ] **Container width adopts a canonical STYLE_GUIDE §4.2 tier** (editorial
  960 / mixed-content 1100+880 / system-diagrammatic 1140). Never inherit
  widths from the scaffolding donor page — donors can carry pre-canonical
  debt (WMHTB's 1240px container bit Paper Bitcoin in June 2026). Prose
  blocks on mixed-content pages are 880px with `margin: 0 auto`; no
  paragraph-level max-widths anywhere.

## 2. Eleventy/build wiring

Verify the page's front-matter has the four expected fields:

```yaml
---
layout: base.njk
permalink: /<slug>.html
slug: <slug>
eleventyComputed:
  head_extras:  "{% include '_pageassets/<slug>-head.html' %}"
  page_styles:  "{% include '_pageassets/<slug>.css' %}"
  page_scripts: "{% include '_pageassets/<slug>.js' %}"
  body_chrome:  "{% include '_pageassets/<slug>-chrome.html' %}"  # if needed
---
```

If the page uses shared assets (e.g., `power-law-data.js`), include them
explicitly in `page_scripts` with `\n` between includes — Eleventy renders
them in order.

## 3. Navigation entry points

### `src/_data/explorations.json` — the canonical exploration registry

Add a new entry to the array:

```json
{
  "slug": "<slug>",
  "title": "<Display Title>",
  "category": "<foundations | arguments | numbers>",
  "interactive": true | false
}
```

- **`category`** determines which top-nav dropdown the entry appears under
  (Foundations / The Arguments / The Numbers). See `STYLE_GUIDE §6.9`.
- **`interactive`** — `true` if the page has buttons, sliders, scrubbable
  charts, or any user-driven UI. Adds the amber • marker next to the
  nav link.

If the page should appear on the `/calculators` constellation page, add a
`calculator_tile` object to the same entry. The presence of this block is
the single source of truth for /calculators inclusion (the page is
data-driven from this registry; see `STYLE_GUIDE §6.9.1`):

```json
"calculator_tile": {
  "tagline": "One-line copy describing what the calculator answers, in the editorial register. HTML entities ok (&mdash;, &rsquo;, etc.).",
  "preview_kind": "svg",
  "anchor": "#calculator",
  "featured": false,
  "position": 5
}
```

- **`tagline`** (required) — one-line copy for the tile body. Short
  declarative em-dash structure matches the family voice (e.g. *"Bitcoin
  or a house — looking back, or projecting forward?"*).
- **`preview_kind`** (required) — `"svg"` or `"live-chart"`.
  - For `"svg"`: create a markup file at
    `src/_includes/components/calc-tile-icons/<slug>.njk` containing the
    inline `<svg viewBox="0 0 80 60">…</svg>`. The template
    auto-resolves it by slug.
  - For `"live-chart"`: add a `"preview_id": "mini-<something>"` to the
    block and wire a renderer in `src/_includes/_pageassets/calculators-minis.js`
    via the `{ id → render-function }` map near the bottom of that file.
- **`anchor`** (optional, defaults to `"#calculator"`) — appended to the
  tile href. Set to `""` for single-pane pages that have no tab anchor
  (Half-Life, MIC, Fixed Pie). Set to a custom value (`#bvsmCalc`,
  `#channel`, `#explorer`) for pages whose calculator lives at a
  different anchor.
- **`featured`** (optional, defaults to `false`) — `true` places the
  tile in the top Featured row with the large-card styling. Reserved
  for the two highest-leverage personal-decision tools (currently
  Bitcoin Retirement and BvSM).
- **`position`** (required) — integer sort key. Featured and grid
  sections are sorted by position independently, so featured entries
  should have the lowest positions overall and grid entries should
  number sequentially from there.

Note: the previous boolean `is_calculator` flag was retired in the June 2026
data-driven refactor. The flag was dead code (no template read it) and its
documented semantic ("personal-decision tools with user inputs only") had
drifted from the page's actual contents.

Validate the JSON after editing — HTML quotes inside JSON strings must be
single-quoted or unicode-escaped:

```bash
python3 -c "import json; json.load(open('src/_data/explorations.json'))"
```

### `sitemap.xml` — search-engine discoverability

Add the page URL at priority `0.9`. Group with other top-level exploration
pages:

```xml
<url><loc>https://lastcoinstanding.com/<slug></loc><priority>0.9</priority></url>
```

If the page has named sections worth indexing as fragments (per the BvRE
pattern), add fragment URLs at priority `0.8`:

```xml
<url><loc>https://lastcoinstanding.com/<slug>#section</loc><priority>0.8</priority></url>
```

## 4. Cross-linking via `related:` front-matter

Use the `STYLE_GUIDE §6.10` related-component pattern. The new page should
*both* link to companion pages AND have companion pages link back to it.

**The strip itself is automatic** — `base.njk` renders it for any page with
`related:` front matter. Do NOT add a per-page include (that pattern is
retired; it was forgotten twice). Front matter is the only step here.

### On the new page

```yaml
related:
  - slug: <companion-slug>
    desc: "One-sentence framing of why this related page matters in this context."
```

Pick 3–4 companions. Editorial criteria:

- One page that's *foundational* to this page's argument (typically Power Law)
- One page that's *thematically adjacent* (decision-frame siblings)
- One page that's *contextually deeper* (where to go after engaging here)

### On the companion pages

For each companion you linked TO, add the new page to their `related:`
array as well. This is the bidirectional discipline — if A points to B,
B should point back to A.

## 5. Homepage

The homepage's Explore section has multiple subsections (Latest, Foundations,
The Arguments, The Numbers). New pages land in their categorical subsection
*and* in Latest while they're still fresh.

### `src/index.njk` — concept card

Add an `<a class="concept-card">` block in the appropriate subsection (the
one matching the page's `category`). The card has four parts:

- `.card-icon` — a custom inline SVG, 48×48 viewBox, that visually telegraphs
  the page's argument (not a generic icon). Examples: BvSM's three-curves
  growth-rate icon, Power Law's exponential curve, Money Trees' two-trees
  icon. Use amber `#e09422` or BTC-orange `#F7931A` for primary strokes
  and complementary muted colors for secondary elements.
- `.card-title` — the page's display title (matches `explorations.json`)
- `.card-desc` — one or two sentences in the site's editorial register,
  matching the voice of other concept cards in the same subsection. The
  description should make the page's *question* or *argument* visible,
  not just describe what the page contains.
- `.card-cta` — usually `Read more →` for prose pages, the specific
  interaction for tool pages (e.g., `Find your number →`, `Run the comparison →`)

### Latest subsection

`Latest` is a rolling 2–3 card display of the most recent ships. When a
new page lands, evaluate whether it should bump an older entry. Default
behavior: insert the new card at the top of Latest; if Latest is already
at 3 cards, evaluate which to remove (typically the oldest of the three).

### `src/_data/updates.json` — Recent Updates strip

The homepage's "Recent updates" strip (below the carousel, above the
Explore section) is a live signal of what's new on the site. Every new
page **and every meaningful page update** should add an entry to the top
of `src/_data/updates.json`:

```json
{
  "display": "M/D/YY",
  "page": "/your-page.html",
  "summary": "One or two lines, user-readable, ~20–40 words. What the page does, not how it was built."
}
```

**Copy register: write for readers, not for builders.** This is the
single most-violated rule of the strip historically. Updates are read by
returning visitors trying to figure out whether anything they care about
has changed — not by people who want a technical changelog. Aim for:

- **What it does, not how it was implemented.** "Includes an interactive
  calculator that runs your scenario across growth and exit paths" ✓,
  not "Refactored from a hash-based prototype to query-param scenario
  encoding per SITE_GUIDE §17.5" ✗.
- **Pithy framing over completeness.** A reader who wants the full story
  clicks through. A reader who doesn't, doesn't.
- **No file paths, no commit SHAs, no section numbers.** Those belong in
  TECH_DEBT, not on the homepage.
- **20–40 words is the working range.** Hard cap at ~60 unless the page
  itself genuinely needs that much context (rare).

Good examples (existing entries):
- *"Homepage ticker polish: ₿ + price in Bitcoin orange with a slow heartbeat glow"* (14 words)
- *"Bitcoin vs. Real Estate: seesaw chart start-year selector + start-price transparency in copy"* (14 words)
- *"New: Start Here — a curated orientation pathway for newcomers. Seven explorations sequenced so each one earns the next, with explicit payoff per step."* (24 words)

When in doubt, write it long, then cut by half.

> **Freshness badges are automatic — never hand-place one.** The
> `updates.json` entry you write here IS the badge. `_data/freshness.js`
> computes a quiet `NEW` chip (within 30 days of a slug's first entry) and
> `UPDATED` chip (within 30 days of its latest entry, suppressed while NEW
> shows) at build time, surfaced in the nav dropdowns and `/calculators`
> tiles. Badges self-expire at the next deploy after their window closes.
> There is no manual flag to set and no chip to remove later. (Framework:
> SITE_GUIDE §40.3; token styling: STYLE_GUIDE §6.39.)

## 6. Tool-framing strip

If the page is decision-implying — meaning a reader could reasonably read
it as a buy/sell signal — include the `tool-framing` component near the
top of the page body:

```html
{% include 'components/tool-framing.njk' %}
```

See `STYLE_GUIDE §6.11` for when to apply vs skip. Decision tools
(BvSM, BvRE, Power Law forward calc, Retirement, Disciplined Rebalancing)
get the strip. Pure-essay pages (Foundations, narrative Arguments without
inputs) and low-risk demonstrations (Fixed Pie, Horizon) skip it.

## 7. OG / social card

### Choose a pattern

Two OG generation approaches exist on the site, documented in STYLE_GUIDE §6.15. Pick based on the page's character:

| Pattern | When to use | Pipeline |
|---|---|---|
| §6.15.1 brand-forward | Page is conceptual / essayistic; no strong single visual hero | Python + Pillow two-tier composite |
| §6.15.2 product-forward | Page's hero IS an interactive visual (chart, grid, mosaic) | Playwright + live page DOM clone |

If unsure, look at the page's H1 and ask: would a screenshot of the page communicate the argument? If yes, product-forward will land harder. If no, brand-forward keeps the family identity.

### Generate the image — brand-forward (§6.15.1)

Run the Pillow generator with the page's display title and a one-sentence italic subtitle (often the carousel headline). Follow `STYLE_GUIDE §6.15.1`:

- Output: `og-<slug>.jpg`, 1280×720, JPEG quality 88, target ~75–95 KB
- The right half is composited from the canonical Power Law template — preserves the textured atmospheric ₿ + ember sparks + paper-canvas grain that define the refined family
- The left half is procedurally generated grain background with text rendered on top
- Title in Cormorant Garamond SemiBold, italic subtitle in Cormorant Garamond Italic, LCS header and URL in Inter Medium

### Generate the image — product-forward (§6.15.2)

Run `build-ogs.py` (or its in-repo successor at `scripts/build-og-images.py` once moved — see TECH_DEBT §1). The script will need a per-page entry that names the hero strategy (live DOM clone, canvas screenshot, or background-image layer) and the editorial chrome content (title with italic-amber accent, subtitle, stats line, URL). Follow the existing entries (`build_bvsm`, `build_retirement`, `build_tools`, `build_homepage`) as templates.

- Output: `og-<slug>.jpg`, 1280×720, JPEG quality 82, target ~40–70 KB
- Shared editorial chrome matches §6.15.2 layout (Cormorant title with italic amber accent, Inter subtitle, dot+wordmark brand mark top-right, stats line + URL bottom row, subtle amber-glow gradient at top right)
- The hero visual comes from the actual live page — chart, grid, or asset

Place the file at the repo root (`og-<slug>.jpg`) alongside the other OG images.

### Wire the meta tags

In `src/_includes/_pageassets/<slug>-head.html`, add the full social-card
meta tag block. Follow the BvSM head HTML as the reference. Required tags:

```html
<meta name="description" content="...">
<meta property="og:type" content="website">
<meta property="og:url" content="https://lastcoinstanding.com/<slug>">
<meta property="og:title" content="<Page Title> — Last Coin Standing">
<meta property="og:description" content="...">
<meta property="og:image" content="https://lastcoinstanding.com/og-<slug>.jpg">
<meta property="og:image:width" content="1280">
<meta property="og:image:height" content="720">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:alt" content="...">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<Page Title> — Last Coin Standing">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://lastcoinstanding.com/og-<slug>.jpg">
<meta name="twitter:image:alt" content="...">
```

**IMPORTANT — clean URLs only in og:url, canonical, and JSON-LD url/@id.** Cloudflare Pages serves this site with clean URLs and 308-redirects every `.html` URL to its bare-slug form. If a page's self-claimed canonical URL contains `.html` while the URL scrapers actually fetch does NOT, Twitter (and some other social scrapers) treat the mismatch as a red flag and refuse to cache the OG card — the link unfurls as a plain text URL instead of a card. The slug-only form (e.g. `/bitcoin-defined`, not `/bitcoin-defined.html`) is what Cloudflare serves and what the sitemap and `llms.txt` use; `og:url`, `canonical`, JSON-LD `url`, and JSON-LD `@id` must all match. The `permalink` in page front-matter still uses `/<slug>.html` since that's what Eleventy needs to emit the file; only the public-facing URL references should drop the extension. Bug encountered May 2026 — see TECH_DEBT §1 closure.

### `.eleventy.js` static asset registration

Add the OG image to the `staticAssets` config so it gets copied into `dist/`
on build. Without this, Cloudflare serves the page's HTML at the OG image
URL — a silent failure mode that produces broken social cards on X/Twitter
without any visible build error. (Documented in STYLE_GUIDE §6.15.3.)

```javascript
eleventyConfig.addPassthroughCopy('og-<slug>.jpg');
```

### Post-deploy verification

After deploy, hit the OG image URL directly and verify the response:

```bash
curl -I https://lastcoinstanding.com/og-<slug>.jpg
```

Must return `Content-Type: image/jpeg` and the expected file size. If it
returns `Content-Type: text/html`, the `.eleventy.js` staticAsset
registration is missing.

Test the social card preview with the actual X/LinkedIn debuggers:

- X: <https://cards-dev.twitter.com/validator> (legacy validator) or
  paste the URL into a draft post
- LinkedIn: <https://www.linkedin.com/post-inspector/>
- Facebook: <https://developers.facebook.com/tools/debug/>
- All-in-one preview: <https://metatags.io/>

### If product-forward — note the data dependency

Product-forward OGs embed live chart data and go stale when the underlying data refreshes. After this page ships, add an entry to `MONTHLY_REFRESH_CHECKLIST §6` so the OG gets regenerated alongside the data refresh.

## 8. Carousel slide

A new page doesn't ship with its carousel slide immediately — the slide
needs a Grok Imagine video that takes iteration. The carousel slide can
land in a follow-up PR.

When the video is ready:

- Strip audio + thumbnail stream with `ffmpeg -c:v copy -an input.mp4 output.mp4`
  (copies the video stream, drops audio — fast, no re-encode). Re-encode only if
  size or format needs it (the trilogy's P2 needed a 2-pass re-encode to land in
  the size band; the raw was ~11 MB).
- Target file size 3–10 MB, 720p, 10 seconds, silent (verified)
- **Name by the page's full slug:** `videos/<slug>.mp4` at repo root (e.g.
  `videos/wait-or-deploy-now.mp4`). Match the existing files.
- **Label your final picks before hand-off.** Grok downloads are opaque
  `grok-video-<uuid>.mp4`, and you will usually generate more takes than pages.
  Either rename raws to slugs yourself, or expect to be asked which take is
  final — frame content identifies *some* videos, but not near-identical takes
  of the same scene (June 2026: 5 raws for 3 pages, and the P3 pick needed a
  human call among 3 sea-sunset takes).
- Add the slide config to the homepage carousel data
- Update `SITE_GUIDE §13` to promote the page's entry from "Pending
  additions" into the main inventory table
- **Eyeball the slide on the branch preview before merging.** Slides are visual
  and hero-placed; a rendering fault is not something code review catches. Push
  and review live, don't merge blind.

See `SITE_GUIDE §6` for prompt-craft patterns and tonal-camp guidance, and
`SITE_GUIDE §13` for the per-slide iteration records (what each brief cost, and
why).

## 9. Documentation

### `SITE_GUIDE.md`

Add a new page section parallel to existing page sections (§14 BvRE, §17
Bitcoin Retirement, §19 BvSM are the references). The section should
document:

- Page-level thesis and structural elements
- Tab structure or section structure if applicable
- Key editorial moves and decisions worth preserving
- Page-specific design lessons that emerged during the build
- Cross-linking strategy
- Open enhancements (carousel slide pending, deferred ideas, etc.)

**Closing is part of shipping.** Whenever you ship a feature, sweep `TECH_DEBT.md`
*and* the touched pages' SITE_GUIDE "Open items" blocks for anything the work
satisfies, and close them — strike through and record what shipped, per the house
pattern. Pending-state records outlive their resolution unless closing is part of
the ship step; a stale "pending" reads as truth and has repeatedly misdirected
later builds.

Update the **editorial reading order** (§18) to place the page in the
right position — most accessible / requires-least-personal-context first,
deepest specialization last.

If the page introduces a tonal-camp variant or carousel slide concept
worth recording, add a note in **§13 Homepage carousel** under "Pending
additions" with the proposed slide copy and video direction.

### `STYLE_GUIDE.md`

If the page introduces new component patterns (eyebrows, callouts, toggles,
input groups, etc.), add a new recipe in §6 following the existing recipe
format: markup example, CSS, behavior notes, "when to use it / when to
skip" guidance. Use the next available `§6.N` number; if the pattern is
page-scoped via prefix, document the unprefixed canonical form and note
the prefix in the recipe text.

### `TECH_DEBT.md`

If the page surfaces new tech debt — duplicate constants that should be
consolidated, near-canonical components that diverge, deferred enhancements
— add an open item under the appropriate section. Close items in the
"Recently closed" section if the page's work resolved any.

### `MONTHLY_REFRESH_CHECKLIST.md`

If the page bakes in any time-sensitive constants (TODAY_PRICE, TODAY_DAYS,
as-of date strings, chart freshness captions, monthly PL_DATA samples),
add the page's file path under §2 "Page-level TODAY constants" so the
monthly grep doesn't miss it.

## 10. SEO + analytics

Every new page must ship with the same SEO baseline as the rest of the
site. Establishing this in the new-page workflow (rather than retrofitting
later) avoids the gaps caught in the May 2026 audit: 3 pages missing
Google Analytics, 3 missing canonical URLs, 7 missing from the sitemap,
1 missing OG image, 10 missing JSON-LD structured data.

The per-page `_pageassets/<slug>-head.html` file MUST include all of
the following. Copy from a complete reference (e.g.
`bitcoin-vs-the-stock-market-head.html`) when creating a new one:

- **Favicons** — 5 link tags for SVG, ICO, two PNG sizes, apple-touch-icon.
- **Google Analytics** — the GA4 snippet with measurement ID
  `G-WNGLLPPR5M`. Two `<script>` tags: async loader + inline config.
  Missing GA = the page produces no analytics signal, period.
- **Title tag** — `<title>Page Name — Last Coin Standing</title>`.
  Under 60 characters where possible.
- **Meta description** — single declarative sentence, 140-155
  characters, no marketing language. Should read as a useful summary
  even out of context.
- **Canonical link** — `<link rel="canonical" href="https://lastcoinstanding.com/<slug>">`.
  Self-referential. Required for every page even if there are no
  duplicates today; protects against future URL parameter drift.
  **No `.html` extension** — Cloudflare Pages 308-redirects `.html` URLs
  to clean form; mismatch between canonical-claimed URL and actually-
  served URL breaks Twitter OG cards. See the IMPORTANT callout under
  §7 above for the full failure mode.
- **Open Graph tags** — `og:type`, `og:url`, `og:title`,
  `og:description`, `og:image`, `og:image:width`, `og:image:height`,
  `og:image:type`, `og:image:alt`. The image must be 1280×720 JPEG;
  every new page needs a custom `/og-<slug>.jpg` per §7 of this
  checklist.
- **Twitter card tags** — `twitter:card=summary_large_image`,
  `twitter:title`, `twitter:description`, `twitter:image`,
  `twitter:image:alt`. Same content as OG but separately declared so
  Twitter's older parser picks them up reliably.
- **Font preconnects + Google Fonts stylesheet** — matches the site's
  Cormorant + Inter (+ Source Serif 4 for some pages) loading pattern.

Additionally for content-type pages (essays, data-analysis pages):

- **JSON-LD structured data** — `<script type="application/ld+json">`
  block with `Article` or `WebPage` schema. At minimum: `@type`,
  `headline`, `description`, `author`, `publisher`, `datePublished`.
  This is the signal Google AI Overviews, Perplexity, ChatGPT search,
  and other AI engines use to understand what the page is about and
  decide whether to cite it. Half the site was missing this in the
  May 2026 audit; AI search visibility was correspondingly weaker
  than it should have been. Reference: `the-fixed-pie-head.html`,
  `synthesis-head.html`, `index-head.html` — all have working
  JSON-LD to copy from.

After creating the head file, two more places to update:

- **`sitemap.xml`** — add the new page URL with appropriate priority
  (`0.9` for interactive Numbers pages, `0.8` for editorial Arguments
  and Foundations, `0.5-0.7` for hubs and meta). Without this entry,
  search engines find the page slowly (via link crawling) instead of
  immediately (via sitemap discovery).
- **`llms.txt`** — add the page to the appropriate section
  (Foundations / The Arguments / The Numbers / Tools) with a one-line
  description. This is the curated map AI search engines use to
  understand the site's content shape; entries here are more likely
  to be surfaced in AI-generated answers about Bitcoin topics the
  page covers.

Verification commands for SEO presence on a deployed page (replace
`<slug>` with the page slug):

```
curl -sL https://lastcoinstanding.com/<slug> | grep -cE "gtag|googletagmanager"
curl -sL https://lastcoinstanding.com/<slug> | grep -c 'rel="canonical"'
curl -sL https://lastcoinstanding.com/<slug> | grep -c "og:image"
curl -sL https://lastcoinstanding.com/<slug> | grep -c "application/ld+json"
```

Each command should return at least `1`. Zero indicates a gap.

## 11. Verification

Before announcing the page or sharing the URL externally:

- **Load the page in browser** — render, scroll, interact. Verify all
  sections appear and respond.
- **Mobile responsive check** — open at 375px viewport. Verify the
  responsive treatments work (no horizontal scroll, tap targets ≥ 44px,
  text legible).
- **Nav check** — verify the new entry appears in its category dropdown
  with the correct interactive marker, and the active-state styling works
  when you're on the page.
- **Homepage card click** — verify the homepage concept card navigates
  correctly.
- **Cross-links click-through** — click each `related:` card on the page
  and the back-links from companion pages.
- **OG card preview** — share the URL in a draft X/LinkedIn post (don't
  publish) and verify the card unfurls correctly with title, description,
  and image.
- **Console clean** — open DevTools, verify no JS errors or 404s on page
  load.
- **Feedback widget check** — automatic for any page with `slug` (layout-level, base.njk); verify it renders on the deployed page below the related strip (eyebrow "Feedback or questions?"). Hub/utility pages opt out with `feedback: false`. Do NOT add a per-page include. (SITE_GUIDE §27)

---

## Worked example — BvSM (May 2026)

For reference, the BvSM launch ran through this checklist as follows:

- **§3 explorations.json** — added `{slug: "bitcoin-vs-the-stock-market", category: "numbers", interactive: true, calculator_tile: {tagline: "…", preview_kind: "live-chart", preview_id: "mini-bvsm-chart", anchor: "#bvsmCalc", featured: true, position: 2}}` (the `calculator_tile.featured: true` puts it in the top Featured row alongside The Bitcoin Retirement)
- **§3 sitemap.xml** — added `<url><loc>...bitcoin-vs-the-stock-market</loc><priority>0.9</priority></url>`
- **§4 related** — linked from BvSM to Power Law, Bitcoin Retirement, BvRE, Disciplined Rebalancing; bidirectional links added on those pages too
- **§5 homepage** — concept card in The Numbers subsection with custom three-curves SVG icon (one rising amber line plus two flatter sage/blue-grey lines)
- **§6 tool-framing** — included (decision-implying page)
- **§7 OG card** — `og-bitcoin-vs-the-stock-market.jpg` generated via §6.15 two-tier procedure; meta tags wired in head HTML; passthroughCopy added in `.eleventy.js`; post-deploy curl returned `image/jpeg`, 82,675 bytes
- **§8 carousel slide** — pending Grok Imagine video; entry in SITE_GUIDE §13 "Pending additions" with proposed copy and video direction (three trees with one growing taller / fuller canopy)
- **§9 docs** — SITE_GUIDE §19 added (page section with four-arc structure, editorial moves, design lessons); STYLE_GUIDE §6.20–6.25 added (six new component recipes: section eyebrow, as-of callout, chart time-range toggle, "you are here" pulse marker, combined presets+slider input group, inline preset annotation); MONTHLY_REFRESH_CHECKLIST.md created (covering TODAY_PRICE/TODAY_DAYS and as-of date strings)

The page landed cleanly into the site's information architecture; the only
thing left is the carousel video, which doesn't gate the page being
production-ready and shareable.
