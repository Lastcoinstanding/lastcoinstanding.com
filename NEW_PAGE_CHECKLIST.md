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

- [ ] **The page defines its own `:root` palette AND a dark-canvas
  mechanism.** base.njk deliberately provides neither a palette nor a page
  background (a page `:root` renders after its blocks and wins). So a page's
  CSS must declare `:root { --bg / --text / --amber / --border … }` (copy
  the canonical set from `the-power-law.css`) **and** paint the dark canvas
  one of two ways: `body { background: var(--bg); color: var(--text) }` (the
  majority pattern) **or** `<meta name="color-scheme" content="dark">` in the
  head (the 11-page pattern). Omit both and var-based colours fall back to
  canvastext on the browser's light canvas — washed-out hero, black/white
  var-based borders. Bit the Bitcoin Hurdle Rate page (Aug 2026).

- [ ] **Every colour routes through a CSS variable — no hardcoded hex/rgb in
  page CSS or JS chart configs.** Beyond the base `:root` set above, any new
  colour a page introduces gets its own `--var` and is referenced by it
  (including colours passed into JS chart/canvas configs). This is the
  incremental path that retires the light-mode toggle's tokenize-everything
  prerequisite one page at a time, so we never owe a site-wide sweep later.
  Rationale + trigger fence: see the **Light-mode toggle** entry in
  PAGE_IDEAS_BACKLOG (Site & platform). Do not build a light palette
  speculatively — this line only asks that colours be *tokenized*, not that a
  second theme exist.

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
- **If the new page is in The Numbers**, add its row to **SITE_GUIDE §30's
  item table** — the nav renders automatically from `explorations.json`, but
  §30's table is a hand-maintained snapshot.
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

**Where to run these generators.** Neither needs JM's machine and neither needs
a repo checkout — both ran in the Claude chat sandbox on 2026-08-08. The
product-forward script screenshots live production URLs (reads nothing from the
repo); the brand-forward script needs only `og-synthesis.jpg` beside it. If the
sandbox you're in lacks Python/Pillow/Playwright, that's a fact about *that*
sandbox, not a blocker — upload the script (plus `og-synthesis.jpg` for
brand-forward) into the chat and run it there. See the *"Where the tooling
actually runs"* note in `§8` for the full verify-first-then-use rule.

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

## 8. Carousel slide — end-to-end video workflow

A new page doesn't ship with its carousel slide immediately — the slide needs a
Grok Imagine video that takes iteration, and it can land in a follow-up PR. What
follows is the whole procedure, prompt to inventory, written to be followed
cold. The depth lives elsewhere and this section is the thread that connects it:
prompt-craft patterns and tonal-camp guidance are `SITE_GUIDE §6`; the slide
inventory and per-slide iteration records (what each brief cost, and why) are
`SITE_GUIDE §13`. Follow the five steps in order.

### Where the tooling actually runs — check this FIRST

**Steps 3 and 4 do NOT need JM's machine.** They need `ffmpeg`/`ffprobe`, and
those live in the **Claude *chat* sandbox** (claude.ai) — not in the **Claude
*Code* sandbox** (this CLI / the win32 dev env), which has neither. These are two
different environments, and conflating them is the mistake this section exists to
prevent:

- **The Claude chat sandbox HAS:** `ffmpeg` 6.1.1 and `ffprobe` (extract frames,
  strip streams, probe stream counts); Python 3.12 with Pillow; Playwright with
  Chromium installable on demand; and network access to production. Both OG-card
  pipelines ran there on 2026-08-08.
- **The Claude Code sandbox has NONE of it,** so Claude Code correctly reports
  these steps as external to *itself* — and that then gets written down as
  *"blocked, needs JM's machine."* **That conclusion is wrong.** The actual
  answer is: **upload the raw files into the chat and run the steps there.**
  JM's machine is not required for frame-checking, stream-stripping, or OG
  generation — only Grok generation (step 2) is genuinely JM-external.
- **Rule: verify availability first, then use it.** Don't pre-declare a step
  blocked from memory. Probe whatever environment you're in — `ffmpeg -version`,
  `ffprobe -version`, `python -c "import PIL"`, `python -c "import playwright"` —
  and if the tool answers, do the work; if it doesn't, move the files to the
  sandbox that has it. "External to Claude Code" is not "external to JM's
  workflow."
- **OG generation carries no repo dependency worth checking out for.** The
  product-forward generator (`scripts/build-og-images.py`, Playwright)
  screenshots **live production URLs** — it reads nothing from the repo and runs
  from any directory. The brand-forward generator
  (`build-og-borrowing-against-your-stack.py`, Pillow) needs exactly one file
  beside it: `og-synthesis.jpg` (fonts are fetched from Google Fonts at
  runtime). So OG generation in the chat sandbox is: upload the one script (plus
  `og-synthesis.jpg` for brand-forward), run it, download the JPEG. See `§7`
  above and `STYLE_GUIDE §6.15`.

### 1. Write the prompt

Build it from `SITE_GUIDE §6` — the prompt skeleton (subject + setting +
lighting + motion + style + avoid-list), the palette and the three tonal camps
(warm-dark / golden-hour / engineered-luminous), and the negation/quantification
tools for strong-prior briefs. Three checks before you generate:

- **Palette + register.** Warm amber/gold, rich shadows, found-not-arranged;
  pick the tonal camp that fits the page's subject (§6's engineered-luminous for
  the financialized instruments, the meadow/golden-hour register for the
  living-element comparisons).
- **Avoid-list.** "No text, no words" in every prompt *and* in the Avoid block,
  plus the metaphor-specific negatives §6 prescribes (anti-archetypes for strong
  priors, "no floating disconnected droplets," etc.).
- **Cross-video distinctness — check against the `SITE_GUIDE §13` inventory
  before briefing.** Rule out any concept that collides with a shipped slide (the
  Heatmap already owns "aerial golden fields"; two golden-hour-sun scenes blur in
  rotation). Differentiate on an axis — stillness vs flow, terrain vs open sea,
  tabletop vs landscape — *before* you generate, not after.

### 2. Generate in Grok Imagine — JM's account (external), then iterate

Generation is the one genuinely JM-external step: it runs in Grok Imagine under
JM's account. Iterate on the brief with the §6 tools (negate strong priors,
quantify spatial bounds, name two object states when the motion is one Grok has
to invent). **Budget roughly two to four takes.** If the brief still isn't
landing after that, **accept the best semantically defensible take rather than
chasing it — the WMHTB precedent.** A take that renders resilience where you
briefed antifragility, or a half-pour where you briefed a stop-short, is usually
fine: let the slide headline and caption carry the sharper reading (as How Much
Bitcoin? and Risks to Bitcoin both did). Chasing a literal render past four
takes has repeatedly cost more than it returned.

### 3. Verify you have the right take — by content, NOT by filename

Grok downloads are opaque `grok-video-<uuid>.mp4`, and a single session
routinely produces several near-identical takes of the same scene — they are
genuinely hard to tell apart later (June 2026: 5 raws for 3 pages, and one pick
needed a human call among 3 sea-sunset takes). **Do not identify the final take
by filename or timestamp.** Extract a start frame and an end frame and confirm
the actual state change is the one you briefed:

```bash
ffmpeg -i take.mp4 -frames:v 1 start.png              # first frame
ffmpeg -sseof -0.1 -i take.mp4 -frames:v 1 end.png    # ~last frame
```

Then look at both. The escarpment's shadow edge either swept the foreground or
it didn't; the vine either reached the upper-right or it didn't. This is a chat
sandbox step (see the tooling note above) — `ffmpeg` does the extraction, no
JM's machine required.

### 4. Strip audio AND the mjpeg thumbnail stream

A Grok download carries THREE streams: h264 video, an AAC audio track, AND an
embedded mjpeg thumbnail. The mjpeg cover is itself a *video-type* stream, so
`-c:v copy` (or a bare `-c copy`) copies it through — only an explicit
`-map 0:v:0` selects the h264 stream alone and drops both the audio and the
thumbnail:

```bash
ffmpeg -i take.mp4 -map 0:v:0 -c copy -an -movflags +faststart videos/<slug>.mp4
```

`+faststart` relocates the moov atom to the front for web streaming. Re-encode
only if size or format needs it (the deployment trilogy's P2 needed a 2-pass
re-encode to land in the size band; the raw was ~11 MB). Target 3–10 MB, 720p,
~10 seconds.

**Verify the strip before committing — zero audio streams must remain.** The
primary check is `ffprobe`: list audio streams and confirm the output is empty.

```bash
ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 videos/<slug>.mp4
```

Empty output = no audio stream. While you're there, confirm exactly one video
stream (h264) and no mjpeg attachment (`ffprobe -show_streams`). **Fallback
where `ffprobe` isn't available** (e.g. the Claude Code sandbox, which has
`grep` but no ffprobe): binary-marker check — the file must contain NONE of
`soun` (audio handler), `mp4a` (AAC codec), or `mjpeg` (thumbnail stream), and
must still contain `avc1` (h264). Grepping for only `soun`/`mp4a` was the old
heuristic and passes an audio-stripped file that still carries the mjpeg
thumbnail — check all three markers. Committing an audio- or thumbnail-laden
master is a known bug class (Metcalfe, June 2026; see `SITE_GUIDE §13`).

### 5. Rename, commit, wire, promote

- **Name by the page's full slug:** `videos/<slug>.mp4` at repo root (e.g.
  `videos/wait-or-deploy-now.mp4`). Match the existing files.
- **Commit the silent master** — only after step 4 verifies clean.
- **Wire the slide into `src/index.njk`.** Add the slide config with a
  `video.carousel-video`; `index.js` plays/pauses whatever video sits in the
  active slide, so no per-id JS registration is needed.
- **Promote in `SITE_GUIDE §13`:** move the page's entry out of "Pending
  additions" into the inventory table, and add an **iteration record** — what
  each take cost and why, in the voice of the existing records. That record is
  how the §6 rules earn their evidence (every §6 rule traces to one); don't skip
  it.
- **Eyeball the slide on the branch preview before merging.** Slides are visual
  and hero-placed; a rendering fault is not something code review catches. Push
  and review live, don't merge blind.

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
  Under 60 characters where possible. Title tag carries the searched
  phrase including "Bitcoin"; the H1 may stay evocative per the house
  question-title family.
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
- **FAQ + FAQPage schema (tool/decision pages)** — add a short, honest
  FAQ (3–5 questions matching real search queries) via a `faq:` array in
  page front matter. **Automatic — like the related strip (§4):** `base.njk`
  renders the visible "Common questions" block *and* the matching `FAQPage`
  JSON-LD from that one array (STYLE_GUIDE §6.40). Do NOT hand-write the
  block or the schema, and do NOT add FAQPage to the `-head.html` file — the
  single-source component makes the visible/schema pair match by construction.
  **⚠️ Quote every `q` and `a` value.** FAQ prose carries colons, apostrophes,
  em-dashes and quotes; a colon in an *unquoted* YAML scalar makes the front
  matter invalid, which **aborts the whole Eleventy build** — and on `main`
  Cloudflare then silently keeps serving the last good deploy (no error page,
  the site just stops updating). Skip purely conceptual essays.

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

### Publish-day habit — resubmit the sitemap + request indexing

Adding the URL to `sitemap.xml` (§3 / above) makes the page *discoverable*; it does not make Google fetch it today. On publish day, once the page is live and the curls above pass, do the manual step in **Google Search Console**:

- **Resubmit the sitemap** (Sitemaps → re-submit `sitemap.xml`) so the new `<loc>` is picked up on the next crawl. **One click, no quota.** This is the whole publish-day search obligation.
- **Request Indexing for the new URL** (URL Inspection → paste the clean URL, e.g. `https://lastcoinstanding.com/<slug>` → Request Indexing) **if the daily quota allows** (~10 requests/day). If it does not, this is **not** a publish-day blocker — it rides the monthly Search Console indexing sweep in `MONTHLY_REFRESH_CHECKLIST`. Sitemap resubmission alone gets the page into the crawl queue.

> **Do not try to automate this.** Google **retired its sitemap ping endpoint** (`google.com/ping?sitemap=`) and Bing has done the same — verified 2026-08-20, returning **404** and **410 Gone** respectively. Any script or checklist step that "pings the sitemap" is now a no-op that reports success. Resubmission is a manual Search Console action, full stop.

This is a per-page publish-day habit, not a monthly task. (Recurring GSC hygiene — the indexing sweep and the indexed-count glance per episodic page — lives in `MONTHLY_REFRESH_CHECKLIST`.)

## 10.5 Interaction intent (the WHY principle)

Every interactive section opens by stating **the insight it exists to deliver** (why), not only its mechanics (how, or what to click). A section that opens "drag the slider to change the stack" has told the reader what their hands do and nothing about what their mind should get.

Where a page carries multiple interactions, they are framed as **a menu of different ways into the material — never an implied sequence** the reader must complete in order. A reader who lands mid-page and starts at the third instrument should not feel they have skipped a step.

In practice, for each interactive section ask:

- Does the opening copy name the *finding* the section produces, or only the controls?
- Would a reader who never touches the controls still learn the point from the lede?
- If the page has two or more instruments, does the copy say how they differ — and does it avoid implying an order?

Canonical example: `/bitcoin-escape-velocity` — "Set the plan" opens on confidence, lifestyle and the risk of running out before it mentions an arrow; "The Threshold" opens on what a threshold *is* and why small changes move it, then explains the mechanics in a second paragraph.

Source: Escape Velocity review rounds, 2026-08-19/20 (JM).

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
- **Deferred integration surfaces are tracked, not dropped.** The **OG card** (§7) and the **carousel slide** (§8) may each ship in a follow-up PR — which is precisely how they drift silently (the stale BAS OG asset; two slide-less pages sitting in `SITE_GUIDE §13` "Pending additions"; same failure class as the missing `:root` palette that §1 now guards). Both need external tooling that is often unavailable at launch (Grok Imagine for the slide; Python + Pillow/Playwright for the OG card), so deferral is legitimate — *untracked* deferral is the bug. If either is deferred, it MUST be logged as a **tracked** pending item recording the page slug: the carousel slide in `SITE_GUIDE §13` "Pending additions", the OG card in `TECH_DEBT` (or the OG handoff note). **A launch is not "done" until every §1–§10 surface is either shipped or on a tracked list.**

### Verifying a just-pushed change on Cloudflare Pages

- **Cloudflare is the only authoritative deploy signal.** The site deploys
  *only* via Cloudflare Pages — a stray Netlify integration that posted
  meaningless `deploy-preview` statuses was removed 2026-08-08 (see
  `SITE_GUIDE §7`). If any non-Cloudflare status check shows up green or red on
  a commit/PR, ignore it: it does not reflect what production is serving. Trust
  the `Cloudflare Pages` check-run and the source tree, nothing else.
- **Don't trust the branch alias for freshness.** The branch alias
  `<branch>.lastcoinstanding-com.pages.dev` **lags and per-path
  edge-caches**, and a **force-push may not trigger a rebuild at all** (a
  normal push does, but even then the alias updates minutes later). Do NOT
  gate a just-pushed change on whether the alias returns 404/200. Reliable
  checks instead: the **per-deployment `<hash>.<project>.pages.dev` URL**
  (never edge-stale), and — authoritative for "did it land / is the old
  markup gone" — the **source tree** itself
  (`git ls-tree -r origin/<branch>`, `git show origin/<branch>:<path>`).
  Prefer normal commits over force-push when you need the alias to reflect
  the push.
- **An all-pages 404 on a fresh branch preview is usually one bad file.**
  A single template/data error — a wrong `layout:` (must be `base.njk`,
  not `layouts/base.njk`), an unquoted-colon YAML value — **aborts the
  entire Eleventy build**. On `main`, Cloudflare then silently keeps
  serving the last good deploy (no error page; the site just stops
  updating). Suspect one file, not the platform. (Memory:
  `eleventy-cf-build-preview-gotchas`.)

### Byte-identical migration check (capture → navigate → compare)

When you move already-indexed on-page text to a new mechanism (e.g. lifting
a hand-rolled FAQ into the §10 `faq:` component), the migration must not
change a single rendered character — that byte-identity is the only thing
that lets you tell a *migration bug* from an *intended edit*. Verify it,
don't eyeball it:

- A cross-origin `fetch()` between the preview and production is blocked,
  so you cannot diff the two in one call. Instead **capture, navigate,
  compare**: open the **branch preview**, extract the text into arrays
  (`[...document.querySelectorAll('.page-faq .faq-q')].map(e=>e.textContent)`
  and the matching `.faq-a` answers); then open **production**
  `lastcoinstanding.com/<slug>`, extract the *old* markup's equivalent text
  (structure may differ — e.g. a question that shipped inside `<strong>`);
  assert `JSON.stringify(preview) === JSON.stringify(prod)` by embedding the
  first array as a literal in the second page's snippet.
- In the same pass, confirm the schema is single-sourced and correct:
  `JSON.parse` every `application/ld+json` block (don't eyeball validity),
  assert the parsed `FAQPage` `mainEntity[].name` / `.acceptedAnswer.text`
  equal the visible `.faq-q` / `.faq-a` arrays, and count blocks with
  `@type === 'FAQPage'` — it must be **exactly 1**. Two means an orphan
  schema was left behind in the `-head.html` file (the duplicate-FAQ bug
  that surfaced this whole migration).
- **Keep migrations and content edits in separate commits.** A mixed commit
  destroys the ability to run this check — you can no longer tell whether a
  text difference is a bug or a deliberate reword.

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
