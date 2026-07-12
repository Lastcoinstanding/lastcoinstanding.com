# STYLE_GUIDE.md

The visual and technical style guide for **Last Coin Standing**. Companion to `SITE_GUIDE.md` (which covers voice, content, and editorial register).

This guide is the spec the build refactor targets — when in doubt, this document is the authority. If something on a page contradicts this guide, the page is wrong, not the guide.

Last updated: 2026-04-26 (initial draft from survey of 7 pages)

---

## 1. Type system

The site uses **five typefaces**. Each has one job. Don't introduce a sixth without revising this guide.

| Family | Role | Where it appears |
|---|---|---|
| **Cormorant Garamond** | Display | h1, h2, large pull quotes, drop caps, inline italic emphasis at display sizes, "section closer" flourish at 1.35rem |
| **EB Garamond** | Essay body | Long-form prose paragraphs, TOC links, key concepts — **only on cream/parchment background** |
| **Source Serif** (italic) | Small-size italic flourish | OG card subtitles, page hero subtitles where an italic serif is wanted |
| **Inter** | Editorial sans-serif | Body on dark backgrounds, UI labels, captions, page subtitles, tabs, buttons, metadata — on editorial pages and chart-explorer pages (see tier mapping below) |
| **Outfit** | System / diagrammatic sans-serif | Body, panel labels, technical descriptors — on diagrammatic pages where the page is fundamentally a structural specification (currently: The Bitcoin Synthesis, What Bitcoin Is) |

### Sans-serif register: editorial vs. system-diagrammatic

The two sans-serif families are not interchangeable. Each carries a register:

- **Inter** is humanist — it reads warm, editorial, literary. Right for prose-driven pages where the reader is moving through paragraphs of argument, narrative, or contrast.
- **Outfit** is geometric/schematic — it reads engineered, structural, specification-like. Right for diagrammatic pages where the page IS the system spec (component diagrams, structural-property frameworks) and the prose serves the diagram, not vice versa.

When introducing a new page, ask: *is this a piece of writing, or is it a diagram with explanatory copy?* Editorial pages get Inter. System/diagrammatic pages get Outfit. **Don't mix within a page.** **Don't choose by aesthetic preference** — choose by page character.

### Page-character tiers (typographic register)

The site uses three typographic registers, mapped by page character:

- **Editorial pages** — prose-led pages and pages with a substantive prose tab. Use §2.1 canonical scale + Inter body. Includes Index, Money Trees, The Bitcoin Migration, The Bitcoin Horizon, What Money Has To Be, About, Bitcoin vs. Real Estate, Power Law, Half-Life. The criterion is presence of authorial argument the reader is meant to settle into and read — even if the page also has charts and an interactive tool, if it contains an essay-grade tab, it belongs here.
- **Chart-explorer pages** — pages where every tab is chart-led with brief explanatory copy and no essay tab. Use §2.5 chart-explorer scale + Inter body. Currently: The Fixed Pie, The Melting Ice Cube. Compact h1 + heavier weights + tighter body suit the dense-utility character.
- **System-diagrammatic pages** — pages where the page IS a structural specification (component diagrams, structural-property frameworks). Use §2.1 canonical scale + Outfit body. Currently: The Bitcoin Synthesis, What Bitcoin Is, Trilemma. The diagram defines the page; prose serves the diagram.

When introducing a new page, ask: *is this primarily a piece of writing (with or without supporting charts and tools)? Is it primarily a chart explorer? Or is the page itself a diagram?* Editorial gets §2.1 + Inter. Chart-explorer gets §2.5 + Inter. System-diagrammatic gets §2.1 + Outfit. **Don't mix within a page.** **Don't choose by aesthetic preference** — choose by page character.

A common shape that belongs in the editorial tier: a page that contains both an essay tab and a calculator or chart-explorer tab. The editorial frame holds; the calculator's own controls use UI typography (§2.3) at the tab level. Bitcoin vs. Real Estate is the canonical example — its page-frame typography is editorial (with a documented hero weight-300 exception per §5), and the calculator tab sits comfortably inside that frame using UI controls. Power Law and Half-Life follow this pattern after the migration shipped in commits `4aa777d` / `9780b4c`.

### Anti-pattern: DM Sans

DM Sans was previously rogue on Real Estate, Not-a-Bubble, Index, and Money Trees. It does the same job as Inter but is not part of the canonical type system. **Don't reintroduce.** Cleaned up via commits 89011ea (Not-a-Bubble CSS), 6c6c7c2 (Index, Money Trees).

One residual surface: `not-a-bubble.js` Chart.js + canvas font calls still reference DM Sans for chart-label rendering. Logged in TECH_DEBT — chart-canvas font selection may have different metric considerations than CSS body prose; pending separate decision.

### CSS variables

```css
--font-display: 'Cormorant Garamond', serif;
--font-essay: 'EB Garamond', serif;
--font-flourish: 'Source Serif 4', serif;  /* always paired with font-style: italic */
--font-body: 'Inter', sans-serif;           /* editorial pages — default */
/* --font-body: 'Outfit', sans-serif;       *//* system/diagrammatic pages — declared per-page */
```

### Font loading

Inter must be loaded with italic@400 and italic@500 in addition to its upright weights. Without these, body-prose `<em>` (and any other Inter element with `font-style: italic`) falls back to browser-synthesized faux italic — non-deterministic across browsers/OSes, and produces inferior glyphs versus a real italic font. Site-wide fix shipped in commit `2391882`.

When introducing a new page, copy the head.html font URL from a peer of the same register (editorial → an existing editorial page; system-diagrammatic → Synthesis or What Bitcoin Is). Don't construct a font URL from scratch — the canonical Inter declaration is:

```
Inter:ital,wght@0,<upright_weights>;1,400;1,500
```

The same logic applies to any other family that's used italic anywhere on the site: declare both the upright weights you use and any italic weights you use; never rely on browser font-synthesis.

### Site-wide `<body>` rule

The canonical body font-family, font-size, and line-height live in `base.njk` and apply to every page automatically. New pages should NOT declare their own `body { font-family / font-size / line-height }` rule — see §2.3 for the canonical values and the rationale. A page omitting all body styling used to silently fall back to Times New Roman (the browser default serif), which manifested on Disciplined Rebalancing for months before being caught — the `base.njk` default eliminates this failure mode.

---

## 2. Type scale

All sizes use `clamp()` for fluid responsive scaling. The first value is the mobile floor; the last is the desktop ceiling.

### 2.1 Display (Cormorant Garamond)

| Slot | Size | Weight | Case | Notes |
|---|---|---|---|---|
| **Essay cover h1** | `clamp(2.8rem, 6vw, 4.5rem)` | 500 | Mixed | Migration only — biggest type on the site |
| **Standard page h1** | `clamp(2rem, 4vw, 3.4rem)` | 500 | Mixed *or* uppercase | Homepage, WMHTB, Half-Life, all explorations |
| **Section h2** | `clamp(1.8rem, 3.4vw, 2.6rem)` | 500 | Mixed | "Money vs. Currency?", "The Shoulders It Stands On" |
| **Subsection h3** | `clamp(1.4rem, 2.4vw, 1.8rem)` | 500 | Mixed | Card titles, layer-card names |
| **Section closer flourish** | `1.35rem` | 500 | Mixed | "Six components. Three functions. One money." — single-line tonal grace note before a CTA |

**Canonical hero patterns.** Two patterns, one per page-type. Pages that drift from these read as visually inconsistent with the rest of the site.

**Pattern 1 — Editorial hero** (long-form prose pages: Power Law, Half-Life, Melting Ice Cube, Fixed Pie, Migration, Money Trees, Bitcoin Horizon, Money Trees, About):

```css
.page-header h1   /* clamp(2rem, 4vw, 3.4rem), Cormorant Garamond, weight 500 */
.subtitle         /* clamp(1.05rem, 2vw, 1.3rem), Source Serif 4 italic, weight 400 */
                  /* color text-dim, max-width 700px, line-height 1.6 */
```

No eyebrow caps-label above the h1 (the page name lives in the nav and the `<title>`). No `min-height` on the hero — let content size the section naturally. Hero padding canonical: `3rem 0 2rem` or similar; nothing approaching `60vh`.

**Pattern 2 — Tool/calculator hero** (interactive pages: Half-Life-as-tool, BvRE, Disciplined Rebalancing, Bitcoin Retirement):

```css
.page-header h1   /* same as Pattern 1 */
.subtitle         /* 1rem, Inter regular (sans-serif), weight 400 */
                  /* color text-dim, max-width ~600px, line-height 1.7 */
```

Inter for the subtitle (not Source Serif italic) — the pragmatic register matches the calculator's nature. Below the subtitle: `FOR EXPLORATION ONLY` disclaimer banner, then tab navigation. Same no-eyebrow / no-min-height rules as Pattern 1.

**Anti-patterns (caught in audit, do not introduce):**
- `min-height: 60vh` (or any hero min-height) — leaves no content above the fold
- Caps eyebrow above h1 — duplicates the nav
- h1 max larger than `3.4rem` — drifts from the canonical scale
- `font-weight: 300` on subtitle Source Serif — too thin, breaks the Power Law-as-reference pattern; canonical is `400`
- Separate `.intro` section between hero and first content section with its own border-top — creates visible disconnect; lede paragraph should sit naturally after the subtitle
- **Hard-coded h2 `font-size` without a `clamp()`** — e.g. `font-size: 2.6rem` instead of `font-size: clamp(1.8rem, 3.4vw, 2.6rem)`. The fixed value gets applied at every breakpoint, so mobile inherits the desktop max and produces oversized headings that wrap badly. Always use the canonical clamp expression for `h2`; same for `h1` and `h3` with their respective canonical ranges. Caught on BvSM in the May 2026 audit.

**Mobile line-wrap policy.** All `h1`, `h2`, and `h3` elements receive `text-wrap: balance` site-wide via the `<style id="canonical-typography-css">` block in `base.njk`. This applies before any per-page CSS loads, so every page gets balanced line wrapping by default — avoids the orphan-word problem on mobile (e.g. "Up front: what we recommend, **and** / what we don't" or "What if you bought at the / **worst time?**" — both observed in the May 2026 audit). Browser support: Chrome 114+, Edge 114+, Firefox 121+, Safari 17.5+. Pre-2024 browsers fall back to default greedy wrap — progressive enhancement, no visual regression. Per-page CSS that needs different wrap behavior on a specific heading can override with `text-wrap: wrap` (default) or `text-wrap: pretty`.

### 2.2 Essay body (EB Garamond, on cream)

| Slot | Size | Weight | Notes |
|---|---|---|---|
| Body paragraph | `1.15rem` | 400 | line-height 1.82, hanging punctuation |
| Pull-quote | `1.15rem` | 400 italic | with amber left rule |
| Inline emphasis | inherit | italic | within prose |
| TOC link | `1.05rem` | 400 | |

### 2.3 UI / body (Inter)

| Slot | Size | Weight | Notes |
|---|---|---|---|
| Body paragraph (dark bg) | `1.05rem` | 400 | line-height 1.7 |
| Page subtitle (dark bg) | `clamp(1rem, 2vw, 1.2rem)` | 400 | color text-dim |
| UI label, button text | `0.85rem` | 500 | |
| Tab label | `0.95–1rem` | 500 | see §6.2 |
| Caps mini-label | `0.7rem` | 500 | letter-spacing 0.22em, uppercase |
| Caption / metadata | `0.78rem` | 400 | color text-dim or text-faint |
| Smallest label | `0.65rem` | 500 | letter-spacing 0.2em, uppercase — tab numbering, etc. |

**Mobile floor:** never render UI text below `0.7rem` on a 375px viewport. SVG-rendered interactive labels (Synthesis component circles, etc.) must remain ≥14px effective rendered size at narrow viewports.

**Site-wide body invariants (set in `base.njk`, not per-page).** The site-wide `<body>` rule lives in `base.njk` and sets the canonical body font-family, size, and line-height for every page. New pages do NOT need to declare a `body { font-family / font-size / line-height }` rule of their own — they inherit. Pages still set their own `body { background, color }` to match their palette, and may set their own `font-family` to override (cream-bg essay pages using EB Garamond, for example), but the size and line-height should not be re-declared at the body level. The canonical values are:

```css
body {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 1.05rem;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
```

A page omitting its own body rule entirely (as Disciplined Rebalancing did pre-fix) used to fall back to browser-default Times New Roman; the global rule now prevents that failure mode site-wide. CSS variables for body font (`--font-b`, `--font-body`, `--font` — all currently in use across different pages) are technical debt to be unified in a future pass; treat the global `body` rule above as the source of truth, not the variables.

**Per-tab body prose must match canonical `1.05rem / 1.7`.** On multi-tab pages where each tab's prose has its own selector, the temptation is to tune type per tab (Question tab at 1rem / 1.8 felt different from Math tab at 1.05rem / 1.7 on Disciplined Rebalancing for several months — the divergence wasn't intentional, just inconsistent application). All editorial prose on dark backgrounds is `1.05rem` with `1.7` line-height, regardless of which tab or section it lives in.

**Site-wide horizontal anchor (set in `base.njk`, not per-page).** The base layout's `<style id="canonical-body-css">` block also locks horizontal scroll at the document level via `html, body { overflow-x: clip; }`. Without this rule, any element that accidentally exceeds viewport width — a wide chart container, a long word, a misconfigured grid, a heatmap that didn't fit on a small device — lets the entire page slide left/right under finger gestures on mobile, which reads as a layout bug rather than a feature. Observed and fixed on `/heatmap` and `/bitcoin-vs-the-stock-market` on 2026-05-28. `clip` is preferred over `hidden` here: it doesn't create a new scroll context and doesn't break `position: sticky` descendants, which the site uses in several places (heatmap y-axis label column, table headers, etc.). Per-page CSS may still create nested horizontal scroll containers where that's the right affordance (e.g. wide data tables wrapped in `overflow-x: auto`); the document-level anchor only prevents the whole page from drifting.

### 2.4 Italic flourish (Source Serif italic)

| Slot | Size | Notes |
|---|---|---|
| OG card subtitle | `30px` (fixed) | rendered at 1280×720 |
| Page hero subtitle (when italic wanted) | `clamp(1.05rem, 2vw, 1.3rem)` | use this **instead of** Cormorant italic at small sizes |

### 2.5 Chart-explorer tier (deliberate variant)

A compact alternative to §2.1 for pages where every tab is chart-led with brief explanatory copy and no essay tab. Currently: The Fixed Pie, The Melting Ice Cube. Heavier weights and slightly tighter body suit the dense-utility character of chart-and-control surfaces; the smaller h1 cap keeps the page-frame from competing with the chart for attention.

| Slot | Size | Weight | Notes |
|---|---|---|---|
| Page h1 | `clamp(2rem, 4.5vw, 3rem)` | 600 | Cormorant; ~13% smaller cap than §2.1, heavier weight |
| Section h2 | `clamp(1.2rem, 2.5vw, 1.6rem)` | 500–600 | Cormorant; significantly tighter than §2.1's 2.6rem cap |
| Body paragraph | `0.95–1rem` | 400 | Inter; line-height 1.7–1.8 |
| Subsection h3 | `1.1–1.2rem` | 500 | Cormorant or Inter depending on slot |

**Use this tier only when the page has no prose tab.** If a page has any essay-grade tab, the editorial scale (§2.1) is correct — even if the other tabs are chart-led — because the page-frame typography is set by the most prose-heavy tab. Bitcoin vs. Real Estate, Power Law, and Half-Life all contain calculator or chart tabs but have at least one substantive prose tab, so they belong on §2.1, not here. See §1's tier mapping for the full classification.

This tier was historically called "calc-tier," a label that conflated functional character (page contains a calculator) with typographic register. Renamed and clarified after the audit shipped in commits `4aa777d` / `9780b4c`.

### 2.6 Essay-prose tier (prose-tab inside an interactive page)

A third tier between §2.1 canonical editorial and §2.5 chart-explorer, designed for long-form essay content embedded inside an interactive page (Bitcoin Retirement's Question / Strategies / Math tabs are the canonical example).

```css
.essay-prose                 /* container — max-width 720px, centered */
.essay-prose .tab-thesis     /* Power-Law-style hero claim, top of tab */
.essay-prose .section-title  /* H2 — Cormorant, clamped 1.6–2.2rem */
.essay-prose .prose          /* paragraph — Inter 1.04rem, line-height 1.72 */
.essay-prose .prose strong   /* ink-bright bold for emphatic terms */
.essay-prose .prose em       /* inherits ink, italic for conceptual emphasis */
.essay-prose .prose.closing  /* slightly larger ink-bright italic close */
.essay-prose .prose.teaser-link   /* forward-pointer with phase-tag */
.essay-prose .essay-callout  /* centered amber-tinted blockquote */
```

**Tab-thesis pattern (anchoring header).** Each prose-led tab opens with a centered Cormorant Garamond claim, with amber-italic emphasis on the punchy half:

```html
<div class="tab-thesis">
  <h2>Three legitimate questions, <em>each with a defensible range</em>.</h2>
</div>
```

This parallels the Power Law page's `.hero-stat` pattern but uses the host page's design tokens. Anchors the reader before the lede prose begins. The pattern: `[setup phrase], em-amber [punchy claim].` Setup is in `--ink-bright`; the em-tag is colored `--amber` and italicized. Used on Question, Strategies, and Math tabs.

**Math tab specification helpers.** For specification-style content (equations, parameter tables, honest-limits lists):

```css
.essay-prose .math-block     /* monospace equation panel, dark tinted bg */
.essay-prose .math-eq        /* equation typography */
.essay-prose .math-eq-small  /* annotation/footnote variant */
.essay-prose .math-table     /* parameter tables, ink-bright caps headers */
.essay-prose .math-list      /* honest-limits + sources lists */
```

The math-block uses monospace (`SF Mono`, `Monaco`, `Consolas`, `Courier New`) with `overflow-x: auto` for long equations on narrow viewports. Equations use `<sub>` and `<sup>` for proper subscript/superscript rendering of variables and exponents.

**When to use this tier.** Appropriate for: editorial essays embedded in a multi-tab calculator/explorer page (Question, Strategies); specification documentation embedded in a multi-tab page (Math); any prose content that needs Cormorant + Inter editorial register but lives inside a `tab-content` container rather than as the page's primary content. *Not* appropriate for pages that are entirely prose (those are §2.1) or pages that are primarily chart-led (those are §2.5).

**Mobile breakpoints.** All essay-prose elements collapse cleanly at 640px. At 480px, math-tables get `display: block; overflow-x: auto` as a defensive fallback for 3-column tables; prose paragraphs get `overflow-wrap: anywhere` to prevent long URLs or equation variable names from causing page overflow.

---

## 3. Color tokens

The palette is dark by default. Migration's essay-mode is the only cream-background context.

```css
/* Backgrounds */
--bg-page:        #0a0908;   /* primary dark */
--bg-card:        #14110d;   /* slight lift for cards */
--bg-essay:       #f4ede0;   /* Migration parchment — essay mode only */

/* Inks (text) */
--ink-bright:     #ece4d6;   /* primary text on dark */
--ink:            #ccc6b8;   /* default body */
--ink-dim:        #968b7a;   /* secondary, captions */
--ink-faint:      #5a5247;   /* metadata, very tertiary */
--ink-essay:      #2a2520;   /* dark ink on cream — Migration only */
--ink-essay-dim:  #5a5247;   /* dim ink on cream */

/* Brand */
--amber:          #e09422;   /* primary brand amber */
--amber-bright:   #F7931A;   /* Bitcoin-orange, used sparingly for emphasis */

/* Structure */
--border:         rgba(224, 148, 34, 0.15);   /* dim amber rule */
--border-strong:  rgba(224, 148, 34, 0.3);    /* visible amber rule */
```

### Color usage rules

- Brand amber (`--amber`) for: hover states, accent rules, CTAs, "active" states in tabs/pills, the second word in two-tone titles, mini-label caps text (`EXPLORE`, `EMERGENT PROPERTY`).
- Bitcoin-orange (`--amber-bright`) reserved for: the homepage Bitcoin B image, OG card accent rules, places where the brighter orange is doing real visual work. **Don't use as default text color.**
- Never use red except for explicit warning labels (`FATAL FLAW:` on Synthesis is the canonical case).
- Two-tone titles: first word `--ink-bright`, emphasized word `--amber`. Use sparingly — Half-Life pattern is the canonical case.

### Heatmap tier palette (canonical)

The Bitcoin Heatmap (`/heatmap` and the BvSM in-page heatmap section) uses a six-tier solid-color palette mapped from BTC's outperformance multiple over the comparator. **Solid hex per tier, not alpha-varying a single base** — an earlier version varied the alpha on one amber and one red base color (`rgba(224,148,34, .25/.55/.95)` / `rgba(196,70,60, .38/.78)`); against the dark page background, dim amber and dim red converged into the same muddy-brown chromatic neighborhood, making positive cells look like negative ones at the 7-px cell scale. Solid hex per tier fixes that:

```
loss-deep   #BE3A30   bright red          (outperf < -0.5)
loss        #6B2A23   dim red             (-0.5 ≤ outperf < -0.1)
flat        #1F1F1F   near-black          (-0.1 ≤ outperf < +0.1; no chromatic claim)
win-mild    #E0BC50   golden yellow       (+0.1 ≤ outperf < +1.0; i.e. up to 2×)
win-mid     #F5C240   golden amber-yellow (+1.0 ≤ outperf < +4.0; i.e. 2× to 5×)
win-deep    #F7931A   bitcoin orange      (outperf ≥ +4.0; i.e. >5×)
future      transparent                   (window extends past today)
```

The progression deep-orange → golden-yellow → pale-yellow on the win side is intentional: all three read as "warm / positive" but with clear visual hierarchy (most-saturated = strongest outperformance). The single-step from `#1F1F1F` (flat) up to `#E0BC50` (mild positive) and down to `#6B2A23` (mild negative) crosses the chromatic axis sharply enough that a viewer can identify win-vs-loss at thumbnail scale without reading the legend.

**Synced across three files** — when changing the palette, update all three together (no inheritance chain, no shared variable yet):

- `src/_includes/_pageassets/bitcoin-vs-the-stock-market.js` — `hmColor(tier)` function (canonical source)
- `src/_includes/_pageassets/bitcoin-vs-the-stock-market.css` — `.bvsm-heatmap-legend-cell[data-tier="*"]::before` rules (legend swatches)
- `src/_includes/_pageassets/calculators-minis.js` — `tierColor(tier)` function in the /tools mini-heatmap renderer

A future cleanup could lift this to a shared CSS variable + JS constant; not done yet because the duplication is small (six tokens) and stable.

---

## 3.5 Modeling assumptions canonical

Sitewide values used by every calculator. The site has a single point of view on inflation, real returns, and real estate appreciation; every calculator that needs these values pulls from this canonical, and a user's choice on any one calculator persists across all of them.

### Two-zone calculator layout

Calculator pages organize their inputs into two visually distinct zones:

- **Baseline assumptions zone** — at the top of the inputs section. Slow-changing, sitewide-sticky, rarely revisited after first selection. Inflation, real return, real estate appreciation, growth model selections live here.
- **Active variables zone** — inline below. Page-specific, never sticky, never sitewide. The user iteratively plays with these. Bitcoin holdings, contribution amounts, retirement age, target lifestyle expenses, etc. live here.

The two zones are visually distinct (different backgrounds or borders, clear separation) so the user understands at a glance which inputs are world-shape assumptions vs. specific-question variables.

### Inflation / monetary debasement

Four-card picker, default = 6.5% (M2 growth).

| # | Value | Label | Framing |
|---|---|---|---|
| 1 | 3.5% | CPI Official | Government's published CPI. Most economists agree it under-reports actual purchasing-power loss. |
| 2 | **6.5%** *(default)* | M2 growth (true inflation) | 50-year US average money-supply growth. The most accurate measure of monetary debasement. |
| 3 | 8% | Shadow Stats | John Williams's pre-1980 CPI methodology. A widely-cited alternative methodology that argues CPI revisions since 1980 systematically understate inflation. |
| 4 | user-input | Custom rate | For other currencies, alternative methodologies, or your own assumptions. |

**Component decomposition** (used in the rich card UI per Stage 2):

- **CPI Official 3.5%** — Long-run BLS CPI-U average (~3.3%), rounded to 3.5%. Excludes asset prices; uses owner-equivalent rent rather than house prices; methodology revisions since 1980 reduce reported figure.
- **M2 growth 6.5%** — 50-yr US M2 average (~6.8%) rounded to 6.5%. The headline 6.5% is monetary expansion itself. Subtracting real GDP growth (~2.5%) gives the price-inflation rate (~4.3%) most people experience as "inflation"; the larger figure is the actual debasement.
- **Shadow Stats 8%** — Anchored to John Williams's reconstructed pre-1980 CPI methodology. Adjusts for hedonic adjustments and basket changes that critics argue have understated CPI since the early 1980s. Treat as one credible alternative; methodology is debated.
- **Custom** — For non-US currencies (Eurozone ~5%, UK ~6%, Japan ~3%, Argentina 100%+), deflationary stress-testing (negative values valid), or user's own assumptions.

**localStorage keys:** `lcs.inflation.preset` (string: `cpi-official` | `m2-growth` | `shadow-stats` | `custom`), `lcs.inflation.customValue` (number, persisted even when preset != custom so re-selecting Custom restores last value).

### Real returns (diversified portfolio)

Three-card picker, no Custom field. Default = 5% (diversified portfolio).

| # | Value | Label | Framing |
|---|---|---|---|
| 1 | 3% real | Conservative | Pessimistic forward-looking estimate. Reflects elevated valuations, demographic headwinds, lower expected returns from Vanguard, GMO, and others. |
| 2 | **5% real** *(default)* | Diversified portfolio | Long-run real return for a typical 60/40 stocks/bonds portfolio. The honest baseline for most users' actual asset allocation. |
| 3 | 7% real | S&P 500 historical | The S&P 500's long-run real return. Achieved only with full equity exposure and discipline through every drawdown. |

**Component decomposition:**

- **Conservative 3%** — Vanguard 10-yr forward US equity assumptions ~3.5–5% nominal; GMO 7-yr forecasts often −2 to +2% real; 3% sits at the optimistic end of the pessimist range.
- **Diversified portfolio 5%** — S&P 500 long-run real return ~6.7% × 60% + US 10-yr Treasury long-run real ~2.0% × 40% = ~4.8%, rounded to 5%. Most users' retirement money is in target-date funds; this is the realistic baseline.
- **S&P 500 historical 7%** — S&P 500 real return 1928–2024 ~6.7%, rounded to 7%. Assumes full reinvestment of dividends, full holding through 1929/1973/2000/2008 drawdowns.

**localStorage key:** `lcs.realReturns.preset` (string: `conservative` | `diversified` | `sp500-historical`).

### Real estate appreciation

Four-card picker including Custom. Default = 3.5% real (Recent decades). All values in **real** terms; UI shows nominal-equivalent based on the selected inflation rate.

| # | Value | Label | Framing |
|---|---|---|---|
| 1 | 1% real | Long-run real | Case-Shiller's century-long real home appreciation. Homes have rarely been a real-return investment in their own right; wealth-building reputation comes from leverage, tax advantages, and forced savings. |
| 2 | **3.5% real** *(default)* | Recent decades | Real appreciation since 2000, driven by falling rates, monetary expansion, supply constraints. Historically anomalous. |
| 3 | 5.5% real | Optimistic / continued boom | Top-end forecast assuming continued monetary expansion, supply constraints, rate suppression. Bull-case housing thesis. |
| 4 | user-input | Custom rate | For other markets, down-market scenarios (negative values for stress-testing), or your own assumptions. |

**Component decomposition:**

- **Long-run 1%** — Case-Shiller US National HPI real terms 1890–2024 ~0.4%, rounded up to 1% for a slightly more generous baseline. At 6.5% M2 inflation, equivalent to ~7.5% nominal.
- **Recent decades 3.5%** — Case-Shiller 2000–2024 real ~3.7%, rounded to 3.5%. At 6.5% M2 inflation, ~10% nominal — close to the 2000–2024 actual nominal experience. Driven by falling rates (Fed funds 6%→0%) and supply constraints; unlikely to persist if rates normalize.
- **Optimistic 5.5%** — Best 25-yr Case-Shiller real return windows reach ~5%, e.g. 1997–2022; 5.5% as bull-case extrapolation. At 6.5% inflation, ~12% nominal — aggressive but not unprecedented in specific markets.
- **Custom** — Local market data (Zillow / Redfin), market-correction scenarios (−5% to 0% real), non-US markets (Tokyo flat since 1990; UK ~3% real; emerging markets vary widely).

**localStorage keys:** `lcs.realEstate.preset`, `lcs.realEstate.customValue`.

### Active variables — never sticky

Bitcoin holdings, contribution amounts, retirement age, target lifestyle expenses, and similar **page-specific** inputs are never persisted across pages. These are active variables (the things the user iteratively explores in a single sitting), not baseline assumptions. Each calculator manages its own active-variable state without writing to localStorage.

The principle: assumptions about the world are sitewide; questions specific to "what does this mean for me on this page" are local.

### Privacy and reset

- All localStorage values stored on-device only; never transmitted.
- Each calculator's assumption panel includes a "Reset to defaults" link that clears all `lcs.*` keys and re-applies defaults.
- A small persistent footnote near the picker reads: *"Saved on this device only. Never transmitted."*

### Implementation infrastructure

A shared JS module (`src/_includes/_pageassets/shared/modeling-assumptions.js`) exposes a clean API for read/write/subscribe across all calculator pages. Pages import from this single source rather than each writing localStorage logic inline. The Stage 2 rich card-based selector component will be built against the same API. Sources for all cited values are tracked in `DATA_AUDIT.md` with six-month audit cadence.

### Stage 1 vs. Stage 2

**Stage 1 (current):** Existing calculators adopt the canonical *values* and labels in their existing per-page UI styles (preset buttons, no rich card decomposition yet), with localStorage stickiness wired up. Half-Life, Melting Ice Cube, and Power Law forward-looking tab updated to match.

**Stage 2 (future):** A rich card-based selector component built once and applied across all calculator pages. Replaces ad-hoc preset buttons with full decomposition cards showing how each value is built (component bullets with per-component citations). First-time visitors see expanded breakdowns; returning visitors see collapsed cards. Two-zone calculator layout fully realized visually.

---

## 4. Alignment principles

### 4.1 The default rule

| Content type | Alignment | Rationale |
|---|---|---|
| **Narrative prose** (paragraphs, essays) | Left | Prose reads better with a fixed left margin and a ragged right; centered prose creates wandering line-starts |
| **Headlines and titles** | Center | Page-level titles, section h2s — these are statements, not reading material |
| **UI controls, button rows, tab bars** | Center | Within their container; the container itself may be left-aligned |
| **Captions, metadata, mini-labels** | Match the element they describe | A caps label above a centered title is centered; a caps label above a left-aligned section is left-aligned |
| **Pull-quotes** | Left, with amber left rule | Migration pattern |
| **Caps mini-labels** standalone | Center | "FEATURED INSIGHT", "EXPLORE", "RELATED" |

### 4.2 Container width (per §16 of `SITE_GUIDE.md`)

The site uses three canonical width tiers. **Every page must adopt one of these tiers.** Non-canonical container widths (e.g. 1000px, 1080px, 1100px-as-outlier) are tech debt; existing instances should be migrated on any layout-touching update pass.

**Canonical inventory:**

| Tier | Page width | Essay block | Used by |
|---|---|---|---|
| Editorial | **960px** | none (prose fills) | Power Law, Half-Life, Fixed Pie, Melting Ice Cube, Horizon, Migration, Money Trees, About, Index, What Money Has To Be† |
| Mixed-content | **1100px** | **880px centered** | Disciplined Rebalancing, Bitcoin vs Real Estate, Not-a-Bubble, Paper Bitcoin |
| System-diagrammatic | **1140px** | none | Synthesis, What Bitcoin Is, Trilemma |

† **WMHTB currently ships off-canon** — a 1240px container with 720px paragraph-level constraints (anti-pattern #11), pending migration (see TECH_DEBT). 

**Scaffolding warning (added June 2026).** When building a new page from a sister-page scaffold, take the structure, interaction grammar, and component recipes — but always re-derive container and prose widths from the table above, never from the donor page's CSS. Observed failure mode: Paper Bitcoin initially inherited WMHTB's 1240px/720px values and shipped with visibly compressed prose relative to canonical pages; corrected to the mixed-content tier (1100/880) in the June 2026 pass. The donor page may itself be carrying pre-canonical debt.

**Editorial tier — 960px (canonical).** The reading-prose width that produces comfortable line-lengths for sustained text. This is the default for any new page that's primarily Inter body prose; deviating wider degrades narrative readability. Prose fills the container naturally; do not apply inner max-widths.

**System-diagrammatic tier — 1140px.** Used by pages that lead with a centered SVG diagram or interactive visual benefiting from horizontal stage-room; the surrounding explanation panels position around the diagram, not on a reading-prose grid. The tier is not used for body prose. New pages of this character target 1140px to harmonize with the existing pages.

**Mixed-content pattern — wide page + constrained essay.** Page width **1100px**, essay block **880px** centered. Used by Disciplined Rebalancing, Bitcoin vs Real Estate, and Not-a-Bubble. Pattern: hero chart needs the page width, but a closing essay needs prose-grade line-length. Solution is to set the page wide enough for the chart and apply a narrower `max-width` to the essay block specifically (NOT to individual paragraphs). This is the only sanctioned use of an inner max-width on prose; the constraint must apply to the essay block as a whole.

**Constrained blocks MUST be centered with `margin: 0 auto`.** A constrained essay block without auto margins left-aligns within the wider container, leaving visible empty space on the right — the "narrow text floating with empty right column" anti-pattern. Canonical pattern:

```css
.page  { max-width: 1100px; margin: 0 auto; }   /* mixed-content page width */
.essay { max-width:  880px; margin: 0 auto; }   /* essay block, centered */
```

The constrained block's `margin: 0 auto` is what makes the essay sit in the optical center of the page. Constraint without centering is an incomplete fix and visually worse than no constraint at all.

**880px essay block is the canonical reading width on mixed-content tier**, chosen to match the editorial-tier effective prose width (~912px on a 960px page minus padding). Editorial and mixed-content pages therefore read body prose at visually similar column widths even though their page containers differ. Earlier values (704px / 720px / 760px) are pre-canonical and should be migrated to 880px on any update pass touching layout.

**Do not apply paragraph-level max-width constraints in single-tier pages.** On editorial-tier pages, let prose fill the 960px container naturally — paragraph-level constraints create the "narrow text floating in a wider container" mismatch this rule is designed to prevent. The mixed-content pattern above is the documented exception, and it constrains the essay *block*, not individual paragraphs within it. When refactoring an existing page that has paragraph-level constraints (anti-pattern #11), the fix is to lift the `max-width` up to the wrapping block element (`.section`, `.essay`, `.narrative`, etc.) and add `margin: 0 auto` there.

**Hero subtitles** can have `max-width: 680px` independent of tier, to keep them visually balanced under a centered title. Apply this only to hero subtitles, not to body prose.

---

## 5. Anti-patterns (what NOT to do)

These have all been observed on the site and need fixing.

1. **Cormorant italic at <1.5rem on dark backgrounds.** The typeface's thin strokes lose detail at small sizes. → Use Source Serif italic, OR Inter, OR bump size to ≥1.5rem.
2. **Cormorant at <1.3rem with weight ≥600.** Strokes thicken and read muddy. → Bump size, drop weight to 500, or switch to Inter.
3. **Wide-tracked uppercase Cormorant.** Fights the typeface's strengths. → Use mixed-case Cormorant, OR use Inter caps with tracking.
4. **Inter Bold Orange as page title.** Outlier on What Bitcoin Is and The Bitcoin Synthesis only. → Use canonical Cormorant per §2.1.
5. **Peer labels with diverging typography.** When three items are conceptually equal (e.g., the Trilemma triangle edges), they should share typography and differ by *one variable* (typically color). → Unify type; vary by color or weight, not by case+weight+style+font all at once.
6. **Editorial attributions inside the shared footer.** Page-specific citations (Vitalik Buterin on Trilemma, data sources on Real Estate) are *content*, not chrome. → Use a `.page-attribution` content section above the canonical footer (see §6.5).
7. **Sans-serif chosen by aesthetic preference rather than page register.** The right question for a new page is not "which sans do I like?" but "is this page editorial (Inter) or system/diagrammatic (Outfit)?" — see §1. DM Sans was previously rogue on multiple pages and is forbidden in either register; cleaned up via 89011ea + 6c6c7c2.
8. **Inconsistent tab styling across pages.** → Use the canonical tab component (§6.2).
9. **Low-contrast text below 0.5 opacity.** Migration cover subtitle hits this. → Keep text-on-dark above 0.6 opacity for body text; mini-labels can go to 0.5 if size is ≥0.7rem.
10. **SVG-rendered text below 14px effective size on mobile.** Synthesis component circles hit this. → Add mobile breakpoint that bumps SVG container or text size.
11. **Paragraph-level `max-width` constraints that fight the page container.** A global `p { max-width: 68ch }` (or similar) makes body text float as a narrow column inside a wider container, leaving visible empty space on the right and creating visual inconsistency vs. canonical pages where prose fills the container. → Remove the global `p` constraint; let prose fill its parent. If a narrower reading column is required (mixed-content pattern, see §4.2), apply the `max-width` to the wrapping *block* element (`.section`, `.essay`, `.narrative`) AND add `margin: 0 auto` so the block centers in the container. Per-element constraints on specific cards (intro blocks, callouts, pull-quotes) are still fine — the anti-pattern is the *global* `p` rule and any constrained block missing its centering margins.

12. **Decorative 3px-side or 3px-top accent borders on cards.** Vestigial visual signal that earns no editorial benefit. The structural relationship between cards is what carries meaning, not a colored stripe. Color-coding (Fixed Pie's money-type cards, Half-Life's preset rates) is preserved through colored title text and progress bars; the stripe was redundant. → Drop decorative side/top borders site-wide. Preserve only borders that serve a *structural* role — `.tab-btn.active` indicator (transparent → colored bottom border), `.timeline` 2px structural rail on Half-Life History tab, timeline event dots, card containers' overall 1px border. Sweep applied across 8 page CSS files plus `.tool-framing-expanded` on `base.njk`. If a new page adds a decorative `border-left: 3px` or `border-top: 2px` accent, review against this principle before landing.

### Documented exceptions

These violate one of the rules above (or §2.1's canonical scale) but are kept deliberately because the typographic register-shift is doing real editorial work that the canonical treatment wouldn't. Reviewed and approved 2026-05-01.

- **Horizon `em.mark` — Cormorant italic at 1.15rem on dark (violates §5.1).** Inline emphasis on Horizon's thesis sentences (e.g. "*it is a network being adopted, not a price being discovered.*"). The amber color carries the emphasis weight independently of stroke detail, the phrases are sentence-fragments rather than single words (Cormorant italic shows its character better in extended phrases), and the typeface clash against Inter body prose is the editorial signal — it reads as authorial register-shift, like a pull-quote inline. Switching to Inter italic would still mark the emphasis but lose the gravitas. Used sparingly (~2 instances on the page).

- **Not-a-Bubble uppercase Cormorant — page hero "IS BITCOIN A BUBBLE?" and section heading "THE PATTERN THAT DIDN'T REPEAT" (violates §5.3).** This page is a polemic. The wide-tracked uppercase register matches the page's argumentative register — hard structural assertions presented as headline statements. The tracking is restrained (~0.04em, not extreme) and the letterspacing is even. Cormorant's strengths *are* being fought here; that's the point. Per-page exception only — do not extrapolate this to other pages.

- **Real Estate `.hero h1` Cormorant weight 300 (deviates from §2.1's wt 500 canonical).** "*Bitcoin* vs. Real Estate" with amber italic "Bitcoin" against the lighter-weight roman "vs. Real Estate" creates an editorial, magazine-cover feel that reinforces the page's "The Opportunity Cost" framing. Cormorant 300 is loaded and renders as designed (this is not a faux-weight fallback). Real Estate is an editorial-tier page per §1 — the weight-300 hero is a deliberate single-page deepening of that register, not a calc-tier compromise. Per-page exception only — do not extrapolate.

---

## 6. Component recipes

Reusable patterns that appear across pages. When building a new page, prefer these over inventing variations.

### 6.1 Caps mini-label

```html
<p class="caps-label">FEATURED INSIGHT</p>
```
```css
.caps-label {
  font-family: var(--font-body);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--amber);  /* or --ink-dim for de-emphasized variants */
}
```

Use for: section labels (`EXPLORE`, `EMERGENT PROPERTY`, `RELATED`), date-author lines (`1989 · DAVID CHAUM`), tab numbering (`LAYER 1`).

### 6.2 Tab component (canonical)

```html
<nav class="tab-nav">
  <button class="tab-btn active">
    <span class="tab-num">I</span>
    <span class="tab-title">The Half-Life</span>
  </button>
  <button class="tab-btn">
    <span class="tab-num">II</span>
    <span class="tab-title">The Leak</span>
  </button>
</nav>
```
```css
.tab-nav {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 28px;
  overflow-x: auto;  /* mobile horizontal scroll */
  scrollbar-width: none;
}
.tab-btn {
  flex: 1;
  padding: 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  text-align: center;
  transition: all 0.25s;
}
.tab-btn .tab-num {
  display: block;
  font-family: var(--font-body);
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 4px;
}
.tab-btn .tab-title {
  display: block;
  font-family: var(--font-body);  /* Inter, NOT Cormorant */
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--ink-dim);
}
.tab-btn.active { border-bottom-color: var(--amber); }
.tab-btn.active .tab-num { color: var(--amber); }
.tab-btn.active .tab-title { color: var(--ink-bright); font-weight: 600; }
```

Roman-numeral tab numbering is the canonical pattern (Half-Life). UPPERCASE tracked-text tabs (Real Estate's current pattern) should be migrated to this.

**URL fragment / deep-link support.** Every multi-tab page should support URL-fragment deep-linking so external links and the constellation page can target a specific tab directly (e.g. `/the-power-law.html#calculator`). Convention:

- Tab IDs match the URL fragment one-to-one. If the fragment is `#calculator`, the tab ID should be `calculator` or `tab-calculator` with a clear short-name convention.
- On page load, read `window.location.hash` and activate the matching tab. If hash is empty or unknown, fall back to default tab.
- Bind a `hashchange` listener so the user can navigate via browser back/forward and the tab follows.
- When the user clicks a tab, update the URL hash via `history.replaceState(null, null, '#'+tabId)` so the URL stays shareable. Use `replaceState`, not `pushState`, to avoid spamming history with every click.

Pages currently supporting fragment deep-links: Half-Life (`#interactive` / `#history` / `#takeaway`), Melting Ice Cube (`#cube` / `#treasury` / `#companies`), Power Law (`#summary` / `#nature` / `#theory` / `#calculator`), Bitcoin vs. Real Estate (`#calculator` and others, with internal tabMap), Fixed Pie (`#slice` / `#energy`). The Bitcoin Horizon is a single-section page so browser-default `#calculator` scroll-to-anchor handles it without JS.

### 6.3 Pull-quote

```html
<blockquote class="pull-quote">
  <p>The exodus from an inherently broken monetary network…</p>
</blockquote>
```
```css
.pull-quote {
  border-left: 2px solid var(--amber);
  padding-left: 1.5rem;
  margin: 2rem 0;
}
.pull-quote p {
  font-family: var(--font-essay);  /* on cream */
  font-style: italic;
  font-size: 1.15rem;
  line-height: 1.65;
  color: var(--ink-essay);
}
```

For pull-quotes on dark backgrounds (non-essay pages), substitute `font-family: var(--font-flourish)` (Source Serif italic) and ink colors.

**Scope note.** §6.3 covers cited quotes — someone else's words pulled out for emphasis (Migration's three pull-quotes are the canonical examples). It does *not* cover authorial commentary blocks where the page's author is speaking in their own voice. Those are a distinct pattern: visually similar (left border, indented box) but typographically different (Inter body, not Source Serif italic; emphasis via inline `<em>` rather than the whole block being italic). Bitcoin vs. Real Estate uses `.narrative` for this — six instances on that page, with the calculator-tab framing block at L122 carrying inline Cormorant overrides for additional weight at a key UI moment. Authorial-commentary blocks remain page-specific patterns, not site-wide components; document them inline in their page's CSS.

### 6.4 Two-tone title

```html
<h1 class="title-twotone">
  The <span class="accent">Half-Life</span>
</h1>
```
```css
.title-twotone {
  font-family: var(--font-display);
  font-weight: 500;
  font-size: clamp(2rem, 4vw, 3.4rem);
  color: var(--ink-bright);
}
.title-twotone .accent { color: var(--amber); }
```

Use sparingly — only when the second word *is* the concept being introduced. Half-Life is the canonical case. Don't apply by default to all titles.

### 6.5 Page attribution (above footer)

For citations, data sources, or other page-specific editorial content that must survive footer normalization:

```html
<section class="page-attribution">
  <p>The Blockchain Trilemma was first articulated by <strong>Vitalik Buterin</strong> in 2017…</p>
</section>
```
```css
.page-attribution {
  padding: 3rem 2rem 1rem;
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  border-top: 1px solid var(--border);
}
.page-attribution p {
  font-family: var(--font-body);
  font-size: 0.82rem;
  color: rgba(255,255,255,0.5);
  line-height: 1.7;
  margin: 0;
}
.page-attribution strong { color: rgba(255,255,255,0.75); }
```

Place **above** `<footer class="site-footer">`, never inside it. Survives footer normalization passes.

### 6.6 Section closer flourish

```html
<p class="section-closer">Six components. Three functions. One money.</p>
```
```css
.section-closer {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 500;
  color: var(--ink-bright);
  text-align: center;
  margin: 2rem 0 1rem;
}
```

Single-line tonal grace note, typically before a CTA at the end of a section. Synthesis is the canonical case.

### 6.7 Drop cap (essay mode)

```html
<p class="lead-paragraph">
  <span class="dropcap">M</span>oney is just a ledger of who owns what…
</p>
```
```css
.dropcap {
  font-family: var(--font-display);
  font-size: 4rem;
  font-weight: 500;
  color: var(--amber);
  float: left;
  line-height: 0.9;
  margin: 0.1em 0.15em -0.1em 0;
}
```

Migration's first paragraph is the canonical case. Use only in essay-mode contexts.

### 6.8 Site nav (canonical)

The site nav (hamburger, mobile overlay, dropdown, brand) is rendered by base.njk and styled by `<style id="canonical-nav-css">` in the same file. Centralized in commit `9937cc5` (Phase 1) with per-page CSS reduced to deliberate-divergence overrides only across `67d7bd8`, `0e69ec6`, and `1780bda`.

When introducing a new page, **don't write nav CSS unless something needs to deliberately diverge.** The canonical block covers structural and typographic properties for `.site-nav`, `.brand`, `.nav-links`, `.hamburger`, `.mobile-overlay`, and `.nav-dropdown*`. Source order: canonical loads BEFORE page_styles in the head, so per-page CSS naturally overrides canonical when needed.

What stays per-page when needed:

- **Palette accent colors** — `.brand:hover`, `.nav-links a.active`, `.mobile-overlay a.active`, `.nav-dropdown-menu a.active`. The active/hover *color* varies by page palette (`var(--orange)` on the compact-nav pages below = `#F7931A`, `var(--amber)` on Migration/Horizon/BvRE/Not-a-Bubble = `#e09422`). Canonical declares the *structural* properties (background, font-weight) so per-page CSS only needs to declare the color override.
- **Compact-nav variant** — Power Law / Half-Life / Fixed Pie / Melting Ice Cube / What Money Has To Be share a set of nav overrides for chart-page UX (these pages carry chart context that should stay visible during nav interaction). The variant is independent of typographic tier — it applies whether the page uses §2.1 (Power Law, Half-Life) or §2.5 (Fixed Pie, MIC). Specifics:
  - **Below-nav drawer overlay** — `top: 50px; padding: 2rem 1.5rem; gap: .5rem; z-index: 998-999; no opacity transition` instead of canonical's full-coverage overlay. Reason: chart context stays visible while the menu is open.
  - **Larger hamburger touch target** — `padding: 8px` on `.hamburger` instead of canonical's `4px`.
  - **Tighter nav-links sizing** — smaller `font-size` and `padding` (and `gap: 4px` or `2px` instead of `8px`) to fit more nav items in narrow chart-control surfaces.
- **Page-specific responsive overrides** — e.g. `@media (max-width: 480px) { .site-nav { padding: 10px 14px; } }` is declared per-page; canonical doesn't have a 480px breakpoint for this.
- **Migration `position: fixed`** — paired with the page's progress-bar at `top: 48px`. The progress bar depends on the nav being position-fixed; sticky might also work but is untested with this layout.
- **Bitcoin vs. Real Estate custom site-nav** — substantially divergent pre-existing design (`z-index: 100`, `padding: 0.8rem 2rem`, `background: rgba(10,9,8,0.92)`). Preserved as-is; this page also styles `.nav-dropdown-btn` as a full nav-link (custom design).

When you find yourself writing more than ~7-8 lines of nav CSS in a new page, stop and check whether the difference is genuinely deliberate vs. drift. Drift-class differences (color tokens with different names that resolve to the same hex, property order variations, `var(--font-body)` vs literal `'Inter'` when both resolve to Inter) should NOT be reintroduced — let canonical handle them.

---

### 6.9 Bucketed nav with content-character categories

Phase 1B reorganized the site's flat exploration list into three content-character buckets, plus standalone About. Future pages slot into the right bucket via their `category` field in `_data/explorations.json`.

**Buckets:**

- **Foundations** — definitional / primer content (e.g. *What Money Has To Be*, *What Bitcoin Is*, *Synthesis*, *Trilemma*). `category: "foundations"`.
- **The Arguments** — narrative cases making the bitcoin argument (e.g. *Migration*, *Half-Life*, *Money Trees*, *Melting Ice Cube*, *Bubble*). `category: "arguments"`.
- **The Numbers** — quantitative comparison and projection (e.g. *Fixed Share*, *BvRE*, *Power Law*, *Horizon*). `category: "numbers"`.

A fourth top-level link (Calculators) leads to the standalone calculator constellation page (Commit 2 of Phase 1B). About remains its own top-level link.

**Schema:** every entry in `_data/explorations.json` has these required base fields:

```json
{
  "slug": "the-half-life",
  "title": "The Half-Life",
  "category": "arguments",
  "interactive": true
}
```

- `category` (string, required): one of `foundations`, `arguments`, `numbers`. Determines which dropdown the entry appears under. Two additional category values (`hub`) exist for non-dropdown pages — base.njk only iterates the three nav buckets above.
- `interactive` (boolean, required): `true` if the page has interactive UI elements (input fields, sliders, button-driven calculations, scrubbable charts). Items with `interactive: true` get a small amber dot marker (•) next to their nav link, marketing the site's character as an interactive tool collection rather than flat essays. Marker class is `.nav-interactive-marker`. Each dropdown menu shows a small italic legend at its bottom (`.nav-dropdown-legend`) reading *"• indicates pages with interactive tools"* so the meaning is discoverable in context. The mobile overlay shows a single legend at the bottom (`.mobile-legend`).

**Optional `calculator_tile` block** — entries that should also appear as a tile on the `/calculators` constellation page carry an additional object. The presence of this block (not a separate boolean) is the single source of truth for /calculators inclusion. See §6.9.1 for the full schema and the rationale behind the data-driven refactor that removed the previous `is_calculator` boolean.

**Active-state behavior:** when the user is on a page in bucket X, the bucket-X dropdown button gets the active styling (amber color, amber-tint background, font-weight 600). Other dropdowns stay default. The link to the current page within its dropdown also gets the active styling. About is its own top-level link with separate active handling. This is implemented via a single `currentCat` lookup at the top of the nav block in `base.njk` that finds the current page's category from the explorations data.

**Footer:** mirrors the bucket structure. Four columns on desktop (Foundations, The Arguments, The Numbers, Site), two on mobile. Each column has a `.footer-nav-label` header and the relevant entries below. The Site column has just About for now; future site-utility pages (e.g. methodology, FAQ) would join it.

**Mobile overlay:** the hamburger overlay shows three labeled sections plus About at the bottom. Section labels use `.mobile-section-label` (small caps, dim color) to separate without making each item heavier.

**Multi-dropdown JS:** the canonical nav JS in `base.njk` was updated to handle multiple dropdowns. Each dropdown's button toggles its own dropdown (closing the others first); click-outside closes all. The previous single-dropdown `querySelector` was replaced with iteration over `querySelectorAll('.nav-dropdown')`. Hover-open still works on desktop via CSS; click-toggle is for mobile/touch.

**Adding a new page:** set `category` and `interactive` in the explorations data. The page automatically appears in the right dropdown with the right marker. If the page is also a calculator that should appear on /calculators, add a `calculator_tile` block per §6.9.1. No template changes required for either nav or /calculators.

### 6.9.1 Calculators constellation page (`/calculators.html`)

A standalone destination at `/calculators.html` that introduces every interactive calculator and decision-support tool on the site. Accessible via the top-level "Calculators" nav slot (between The Numbers and About). Reached two ways: directly via the standalone link, and indirectly via The Numbers dropdown for users navigating by content character.

**Why a separate page rather than just a dropdown:** dropdowns can only show names. The constellation page introduces each calculator with a one-line tagline framing the question it answers (*"When can I retire on bitcoin?"* / *"Bitcoin or a house — looking back, or projecting forward?"*). This is decision-support orientation, not just a list — it helps users pick the right tool for *their* question. Six tiles also carry a *live* mini-chart preview (rendered by `calculators-minis.js`) so the reader sees the actual shape of the tool's output before clicking in.

**Content character:** the page currently shows 12 tiles — 2 in a Featured row up top (The Bitcoin Retirement + BvSM) and 10 in the "All calculators" grid. The set spans personal-decision calculators (BvRE, BvRP, Disciplined Rebalancing, Borrowing, BBM, BvSM, Retirement) and interactive demonstrations (Power Law channel, Horizon, Fixed Share, Half-Life, MIC). The previous "strict" definition (`is_calculator: true` only for personal-decision tools with user-life inputs) has been retired — the page is broader than that in practice, and a `calculator_tile` block on any sufficiently interactive entry is the new threshold for inclusion.

**Data-driven architecture (June 2026 refactor).** The page renders from `src/_data/explorations.json`. Every entry with a `calculator_tile` object becomes a tile; entries without that block don't. Tile order, copy, preview type, and href anchor all come from the registry. The `calculators.njk` template iterates the explorations data, splits by featured/non-featured, sorts by `position`, and renders.

**`calculator_tile` schema:**

```json
"calculator_tile": {
  "tagline": "...",
  "preview_kind": "svg" | "live-chart",
  "preview_id": "mini-bvsm-chart",
  "anchor": "#calculator",
  "featured": false,
  "position": 5
}
```

- `tagline` (required) — one-line copy in the editorial register. HTML entities allowed (rendered with `| safe`).
- `preview_kind` (required) — `"svg"` for a static custom SVG icon; `"live-chart"` for a JS-rendered mini-chart preview.
- `preview_id` (required if `preview_kind === "live-chart"`) — DOM id that `calculators-minis.js` looks up in its renderer map. Adding a new live-chart tile means wiring a new renderer in that file too.
- `anchor` (optional, defaults to `"#calculator"`) — appended to the tile href. Set `""` for single-pane pages (Half-Life, MIC, Fixed Pie). Set custom value (`#bvsmCalc`, `#channel`, `#explorer`) where the calculator lives at a different anchor.
- `featured` (optional, defaults `false`) — top row vs. grid placement.
- `position` (required) — integer sort key. Featured and grid both sort by this; lower numbers come first.

**SVG icons.** For `preview_kind: "svg"` tiles, the SVG markup lives at `src/_includes/components/calc-tile-icons/<slug>.njk` and is auto-resolved by slug. Each file is just the inner `<svg viewBox="0 0 80 60">…</svg>`. The 80×60 viewBox is the family convention; use amber `#e09422` for outline strokes, bitcoin orange `#F7931A` for the bitcoin glyph and primary accent, and 5–10% opacity fills.

**Custom Nunjucks filter.** A small `sortByCalculatorTilePosition` filter is registered in `.eleventy.js` for the position-based sort (Nunjucks doesn't have a clean one-liner for sorting by a nested object property). The filter is local to the `/calculators` page; everywhere else the explorations registry is used in its source order (which dictates nav dropdown order).

**Why no per-tile JSON for SVG markup.** Inline SVG in JSON requires aggressive escaping (every quote, every `<` and `>`) and is unreadable. Per-slug `.njk` files keep the markup editable and version-controlled in a sensible form. The cost is one extra file per svg-preview tile; the alternative is one massive escaped string.

**Adding a new calculator tile.** Two steps:

1. Add the `calculator_tile` block to the page's entry in `src/_data/explorations.json` per the schema above.
2. If `preview_kind: "svg"`, create the SVG markup at `src/_includes/components/calc-tile-icons/<slug>.njk`. If `preview_kind: "live-chart"`, add a renderer in `src/_includes/_pageassets/calculators-minis.js` and register it in the `{ id → render-function }` map at the bottom of that file.

No edits to `calculators.njk` required for either case.

**Removing a tile.** Delete the `calculator_tile` block (the entry stays in the registry for the nav dropdown).

### 6.10 Related component (cross-reference cards)

A reusable Nunjucks include at `src/_includes/components/related.njk` that renders a "Continue exploring" card group from a page's front-matter. Used by every page that wants to surface thematic next-steps to the reader. CSS lives in `base.njk`'s canonical-footer-css block so any page using the component gets styling for free.

**Front-matter schema.** Each page declares a `related:` array. Three formats supported per entry:

```yaml
related:
  # Bare slug — internal page, label/description from explorations data
  - the-half-life

  # Object form for internal pages — adds a custom description and optional
  # label override (label defaults to the page's title from explorations.json)
  - slug: the-melting-ice-cube
    desc: "The corporate-treasury view of the same problem."
    label: "View the corporate side"        # optional
    fragment: calculator                     # optional — links to /...html#calculator

  # External link — Substack, YouTube, or other off-site companion content
  - url: https://substack.com/p/why-i-built-power-law
    title: "Why I built the Power Law calculator"
    kind: substack                           # substack | youtube | external (default)
    desc: "The story behind the tool, in long-form."
    label: "Read on Substack"                # optional CTA text
```

**Rendering rules.**
- The component is a graceful no-op when `related:` is empty or missing — no markup at all.
- Internal slugs are joined against `_data/explorations.json` to pull the page's title, category, and interactive flag. The category is shown as a small caps marker above the card title (FOUNDATIONS / THE ARGUMENTS / THE NUMBERS) so users see at a glance which bucket the related page belongs to.
- The interactive marker (•) appears next to the bucket label if the related page has `interactive: true`, mirroring the nav treatment.
- External entries get a kind-specific marker ("Substack ↗" / "Video ↗" / "External ↗") and `target="_blank" rel="noopener"`.

**Visual character.** Mirrors the homepage's `concept-card` pattern at smaller scale — same hover-lift, amber border on hover, orange top-bar appearing on hover, Cormorant title, dim caps marker. Cards are `auto-fit minmax(280px, 1fr)` so 3 fit comfortably on desktop, stack on mobile.

**Placement.** Automatic — `base.njk` includes the component once for every page, after the content block and above the feedback widget (centralized 2026-06-12 after the per-page include was forgotten twice: how-much-bitcoin pre-launch, bitcoin-vs-rental-property in production). **Never add `{% include 'components/related.njk' %}` to a page template** — declaring `related:` front matter is the entire per-page step; the component renders nothing when the front matter is absent. It handles its own top-border, spacing, and width.

**When to use a related-card vs. inline link.** Use an inline `<a>` for inline references in body prose ("see the half-life of the dollar"). Use the related component for the deliberate end-of-page "now go here" moment with two-or-three thematically chosen next steps. Don't use both for the same destination on the same page — pick the placement that does more work.

**Migration of older inline ad-hoc related blocks.** Several pages had hand-built related blocks before this component existed (e.g. Half-Life had an inline aside linking to *What Money Has To Be*). The migration pattern: move the destination into `related:` front-matter, copy the description text, delete the inline block. The new component renders a card that does the same work in a consistent visual treatment.

### 6.11 Tool-framing strip (collapsible disclaimer)

A persistent "for exploration only" disclaimer applied to calculator pages and decision-implying argument pages. Lives between the page hero and the tool/calculator content. Component file: `src/_includes/components/tool-framing.njk`. CSS in `base.njk`.

**When to apply.** Page risk-stratification:

- **Apply** to personal-decision tools (Power Law forward calc, BvRE, future retirement calculator) and to decision-implying argument pages (Half-Life, Melting Ice Cube). These are pages where a user could reasonably read the page as a buy/sell signal.
- **Skip** for pure-essay pages (foundations, narrative arguments without inputs), low-risk demonstrations (Fixed Pie, Horizon), and index/landing pages that don't directly invite tool interaction (e.g. the Calculators constellation page — disclaimer is shown on the downstream tool pages, repeating it on the index would be duplicate-disclaimer fatigue).

**Behavior.**
- First-time visitors (no sessionStorage flag): rendered in expanded state with full disclaimer body and a × dismiss button.
- Returning visitors within the same browser session (flag set): rendered in collapsed state as a small "ⓘ For exploration only · click to read full disclaimer" button that re-expands on click.
- State persists per-tab via sessionStorage key `lcs.toolFraming.dismissed`. Intentionally NOT localStorage — a fresh browser session should re-show the full disclaimer once.

**Wording (canonical).**

> **For exploration only.** This tool is for educational and informational purposes; nothing here is financial advice. Bitcoin involves significant risk including potential total loss. Consult a qualified financial advisor before making decisions based on what you see here.

The "Bitcoin involves significant risk including potential total loss" sentence is the most consequential — it explicitly names the downside in direct voice. Don't soften.

**Visual character.** Amber-tinted background and border (rgba ~0.04 / 0.18). Amber 3px left-edge accent on the expanded state. No red anywhere (per §3 color usage). Reads as "information affordance," not "alert banner."

**Placement convention.** Insert `{% include 'components/tool-framing.njk' %}` between the page-header div and the tab-nav (or first calculator content block). After the page title and any introductory copy, before the user touches the tool. Pages adopting tabs: place outside the tab-content blocks so the strip is visible regardless of which tab the user lands on.

### 6.12 Companion content (off-site deep-dives)

Distinct from Related (§6.10). Where Related surfaces lateral moves *within* the site (other pages here), Companion surfaces vertical moves *off* the site — longer-form treatments of *this* page's specific topic. Substack articles, YouTube videos, podcast appearances. Component file: `src/_includes/components/companion-content.njk`. CSS in `base.njk`.

**When to use.**
- Use Companion for deep-dive content the author has produced *about this page specifically*. Example: a Substack article walking through how to use the Power Law calculator and why it was built.
- Don't use Companion for general background reading or third-party content. The component implies authorial endorsement of the linked content as the deeper version of this page's topic.
- A page can have both Related and Companion blocks (Related renders first, Companion below it).

**Front-matter schema.**

```yaml
companion:
  - url: https://lastcoinstanding.substack.com/p/why-i-built-power-law
    title: "Why I built the Power Law calculator"
    kind: substack          # substack | youtube | podcast | external
    desc: "The story behind the tool, in long-form."
  - url: https://www.youtube.com/watch?v=...
    title: "Walkthrough: using the Power Law calculator"
    kind: youtube
    desc: "10-minute video tour of the calculator and how to interpret its outputs."
```

**Rendering rules.**
- Graceful no-op when `companion:` is missing or empty — no markup at all.
- Each entry renders as a horizontal row: kind label on left ("Substack ↗" / "Video ↗" / "Podcast ↗"), title + optional desc on right.
- Single-column layout. Companion content is typically 1-2 items per page; full-width rows read better than narrow cards.
- All links open in a new tab via `target="_blank" rel="noopener"`.

**Visual treatment is intentionally quieter than Related.** Companion content is supplementary, not a peer alternative. No Cormorant title at full weight, no card-grid, no orange top-bar on hover. Subtle border, gentle hover-tint.

**Placement.** Insert `{% include 'components/companion-content.njk' %}` near the bottom of the page, AFTER the Related component. Reading order: main content → "Continue exploring" (lateral on-site) → "Going deeper" (vertical off-site). Both blocks lead the user away from the current page; ordering them this way (lateral first, then vertical) gives priority to keeping users on the site.

**When the first piece of companion content ships.** Add the entry to the page's `companion:` front-matter array. The component renders immediately — no other markup or CSS changes needed. When you publish a Substack article walking through the Power Law calculator, that's a one-line edit to `the-power-law.njk`'s front-matter. Same for a YouTube video. The component is staged on Power Law and BvRE in commit 5 (empty `companion: []` arrays) so the front-matter slot exists ready for population.

### 6.13 Help-tip / inline tooltip

Small `?`-in-circle trigger sitting next to a label or section title; expands a dark tooltip card on hover, focus, or tap. Use whenever an input, output, or label is non-obvious enough to benefit from one or two sentences of explanation, but not important enough to displace into the page's body prose. Inputs on a calculator surface are the canonical case.

**Glyph: `?`, not `i`.** Question-mark-in-a-circle is the convention across the site (Bitcoin Retirement uses `.help-tip`, Disciplined Rebalancing uses `.dr-tt`). Letter-i variants — italic `i`, plain `i`, lowercase `ⓘ` — read as ornament rather than help affordance and are visually less assertive at small sizes. Information-circle is reserved for non-help affordances if ever needed (currently nowhere).

**Mandatory pattern:**

```html
<!-- Inside a label, after the label text -->
<label>Sell percentile
  <span class="help-tip" tabindex="0">?<span class="tip-content">
    The price-to-trend ratio at-or-above which you sell. Higher
    percentile = rarer triggers at more extreme prices.
  </span></span>
</label>
```

The trigger is `tabindex="0"` (or a real `<button>`) so it's keyboard-focusable and the tooltip opens via `:focus` as well as `:hover`. The card is a sibling `<span>` with absolute positioning. Use `display: none / block` (not `opacity: 0/1`) for the show/hide state — `opacity: 0` keeps the absolutely-positioned card in layout, which on mobile causes horizontal page overflow whenever the trigger sits within the card's width of the right edge. Lesson banked from `the-bitcoin-retirement.css` (commit referenced inline in that file).

**Sizing and color.** 14×14px circle. Border-color and text color both `--text-muted` (or whatever the page's equivalent muted ink is); on `:hover` and `:focus`, both shift to `--amber`. Card width 240px (cap at `min(240px, calc(100vw - 32px))` on narrow viewports). Card body Inter at 0.8rem, line-height 1.5; `--text` (or page equivalent ink-bright) for body copy, `--bg-card` background, amber-translucent border, soft shadow.

**Placement of the card.** Default: `top: calc(100% + 8px); left: 0` — opens below and to the right of the trigger. For triggers near the right edge of a row, add a right-anchored modifier (e.g. `.dr-tt-right` on Disciplined Rebalancing, or just `right: 0; left: auto;` inline) so the card opens leftward. Centering the card horizontally over the trigger is also fine when the trigger sits in the middle of a row, but anchoring to one edge is more predictable across responsive layouts.

**Copy guidance.** One to two sentences. Surface the *what* and the *why this matters* — leave deeper methodology explanation to a Math tab or Methodology footnote. If a tooltip starts needing a paragraph to do its job, the right answer is to surface a methodology section with an anchor link from the tooltip, not to grow the tooltip into a paragraph.

**When NOT to use.** Don't add tooltips on every label by default. Use them where the label *itself* doesn't carry enough of the meaning — e.g. "Sell percentile" needs a tooltip because the percentile-of-what is non-obvious; "Bitcoin stack" with a "never saved" inline note may not need one. The page's tooltip density should track the page's intrinsic complexity, not be a stylistic flourish.

### 6.14 Chart inside a hidden tab — deferred layout

A pattern for any Chart.js chart whose container ancestor has `display: none` at script-execution time — the canonical case is a chart inside `.tab-content` that isn't the active tab on page load. Without this pattern, layout-changing chart updates fired during page initialization read the canvas's 0×0 dimensions and corrupt every element's pixel position to 0; the chart appears broken when the user finally clicks into the tab.

**Where this bites.** Sticky-values restoration (`localStorage` → slider → `dispatchEvent('input')` chain at end of page-init IIFE) commonly triggers a re-layout on a hidden chart. So does any data-driven scale change that fires during init. Even `chart.update('none')` looks like a no-op layout-wise, but Chart.js v4's layout cache survives it more aggressively than the docs suggest — once stale element positions are baked at canvas-width 0, subsequent `update('none')` calls don't fix them.

**The right invalidation call.** Empirically (Chart.js 4.4.x):

| Call | Behavior on stale layout cache |
|---|---|
| `chart.update('none')` | Doesn't fix |
| `chart.update()` (default) | Doesn't fix |
| `chart.update('reset')` | Fixes, but flickers (resets to base y-values then animates back) |
| `chart.resize()` | No-op when canvas dimensions haven't changed |
| `chart.update('resize')` | **Fixes, no flicker, no dimension dependency** |

`chart.update('resize')` is the right call for layout-changing updates that don't change the canvas size — e.g. data-domain shrinks (horizon-slider tick), x-scale max recompute, anything that ought to invalidate element pixel positions without changing the canvas itself.

**Mandatory pattern when the chart can be initialized inside a hidden ancestor:**

```js
var pendingLayoutFix = false;

function applyDataChange(){
  // ... mutate chart.data.datasets[*].data ...
  chart.update('none');                  // cheap data-only update
  if (canvas.clientWidth > 0) {
    chart.update('resize');               // layout-cache invalidation
  } else {
    pendingLayoutFix = true;              // defer; canvas is hidden
  }
}

if (typeof ResizeObserver !== 'undefined') {
  var ro = new ResizeObserver(function(){
    if (pendingLayoutFix && canvas.clientWidth > 0) {
      pendingLayoutFix = false;
      chart.update('resize');
    }
  });
  ro.observe(canvas);
}
```

The guard prevents the hidden-canvas corruption. The `ResizeObserver` catches the canvas going from 0×0 to real dimensions (when the user activates the tab) and runs the deferred fix exactly once. ResizeObserver is well-supported in evergreen browsers (Chrome 64+, Safari 13.4+, Firefox 69+); when absent, the deferred path silently doesn't fire and the worst case is a slightly stale chart on first tab-view, which is the original bug — i.e. the fallback is no worse than not having the pattern.

**Where this lives in practice.** Disciplined Rebalancing's channel viz uses this pattern (see the `pendingLayoutFix` / `ResizeObserver` block in `disciplined-rebalancing.js`). New chart-bearing pages that use the `.tab-content` system should adopt it whenever sticky-values or any other init-time event can change the chart's data domain. Pages whose chart is the only thing on the page (no tabs, always visible) don't need it — the canvas always has dimensions when init runs.

### 6.15 OG card generation pattern

The site has **two complementary OG generation approaches**, used depending on whether the page's visual hero is conceptual (brand-forward) or product-forward (showing the actual interactive tool).

| Pattern | When to use | Pipeline | Examples |
|---|---|---|---|
| §6.15.1 brand-forward | Page has no strong single visual; conceptual / essay register | Python + Pillow, two-tier composite | Synthesis (the reference template), BvRE, WMHTB, Half-Life, Money Trees, Migration, Trilemma, Bitcoin & Metcalfe's Law, Homepage (May 2026). _(Power Law moved to product-forward — its card is now the chart; see §6.15.2.)_ |
| §6.15.2 product-forward | Page's hero IS an interactive visual (chart, grid, mosaic) | Playwright, live page DOM clone | Heatmap, BvSM (May 2026), Retirement (May 2026), Tools |

When building a new page, pick the pattern that matches the page's character — if the tool/visualization IS the argument, product-forward shows that; if the argument is conceptual or essayistic, brand-forward keeps the family identity.

### 6.15.1 OG card — brand-forward (Pillow two-tier)

A reusable Python + Pillow generator for site OG cards (1280×720 JPG) lives in the dev environment (not committed — fonts and the canonical template image are fetched at generation time). Visual register matches the canonical refined cards (Power Law, BvRE, WMHTB, BvSM).

**Two-tier approach** — the technique that distinguishes refined cards from earlier generations:

- **Right half preserved from a canonical template.** The atmospheric Bitcoin glyph (textured ₿ with soft multi-pass radial halo + ember-dust particles + paper-canvas grain) is the *signature* of the refined family. Rather than regenerating it per card (drift-prone), the generator composites the right half of an existing canonical card — **`og-synthesis.jpg` is the reference template** (a clean brand-forward card whose right half is the bare textured ₿) — into every new card. (Do **not** use `og-the-power-law.jpg` despite its name: it is now a *product-forward* chart card per §6.15.2, with no ₿ glyph, so compositing its right half drags the Power Law chart and its `/the-power-law` URL onto the new card. This bit the Bitcoin & Metcalfe's Law OG build, June 2026 — caught only on visual review.) The template's right portion (roughly `x >= 620`) is hard-pasted onto the working canvas; the seam is feathered into the left side over `x = 620..820` with an alpha gradient.

- **Left half built procedurally.** The text region (LCS header, title, italic subtitle, URL footer) sits on a procedurally-generated dark grain background. Three layers: (1) base color `#100D0A` (near-black with slight warm undertone) — *not* `#0a0908`, which reads as too-pure black against the right half's warmer cast; (2) multi-scale Gaussian noise — `gauss(0, 3.5)` for coarse variation plus `gauss(0, 5.0)` for grain, with the green and blue channels at slightly lower amplitude than red to preserve the warm undertone; (3) 5–10 wear marks — large soft amber-tinted ellipses at low alpha (~12/255), blurred by `radius=2.5`. Apply a final `radius=0.6` Gaussian blur to settle the noise into paper-grain rather than reading as digital noise. A per-card seed lets you vary the procedural pattern slightly between cards while keeping the family consistent.

**Layout coordinates** (1280×720 canvas):

| Element | Position | Font | Size | Color |
|---|---|---|---|---|
| `LAST COIN STANDING` header | `(100, 110)`, letterspaced ~5.5px | Inter Medium | 18px | `#827A6E` (TEXT_MUTED) |
| Amber rule under header | `(100, 144) → (200, 144)`, 2px | — | — | `#E09422` (AMBER) |
| Title (Cormorant) | `(100, 245)`, line-height 95px | Cormorant Garamond SemiBold | 78px | `#F2EEE8` (TEXT_BRIGHT) |
| Italic subtitle | `(100, ~340)`, word-wrap at 480px | Cormorant Garamond Italic | 30px | `#BEB2A0` (TEXT_DIM) |
| URL footer | `(100, 668)`, letterspaced ~4.5px | Inter Medium | 18px | `#827A6E` (TEXT_MUTED) |

**Font sourcing.** Cormorant Garamond pulled at generation time via the Google Fonts CSS API (`https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap`) — parse the latin font-face blocks for woff2 URLs, download, convert to TTF via `fontTools`. Inter via the `fonts-inter` apt package (system-installed). No font assets committed to the repo.

**Save as JPEG quality 80 with `optimize=True`** to land at ~75–95 KB per card, matching the size of existing OG images. (All shipped per-page `build-og-*.py` scripts use `quality=80`; the doc previously said 88 — corrected 2026-07 to match the scripts.) Cormorant Garamond doesn't include U+20BF (`₿`); use Inter for that single character if it appears in a title.

**When you generate a card,** use the page's headline (carousel slide headline, if defined) as the italic subtitle text. Keep the subtitle under three wrapped lines at the 480px max-width — longer subtitles compete visually with the right-half atmosphere.

**The "unrefined" anti-pattern.** Two earlier-generation cards (Disciplined Rebalancing v1, Bitcoin Retirement v1) used a clean digital solid-orange ₿ with simple radial glow instead of the textured atmospheric ₿. Both were regenerated in May 2026 using the two-tier approach above. The unrefined style reads as e-commerce / digital-product and breaks the family. If a new card looks digital instead of atmospheric, the right half wasn't composited from the canonical template.

### 6.15.2 OG card — product-forward (Playwright live-DOM clone)

Used when the page's argument IS the visual — a chart, an interactive grid, a tile mosaic. Rather than describing the tool in text, the OG shows the tool directly, framed in editorial chrome that names the page and surfaces the key takeaway. Established in the 2026-05-17 OG rollout (heatmap → BvSM → Retirement → Tools → Homepage).

**Pipeline.** `scripts/build-og-images.py` (runnable via `npm run build-ogs`) opens each page in headless Chromium, waits for the page's own JS to render its visual hero, takes a Playwright `element.screenshot()` of the hero (works equally on DOM subtrees and Chart.js canvases — captures painted pixels), and embeds that PNG as `<img>` inside a programmatically-injected OG frame. The frame uses Google Fonts (already loaded by the visited page) for typography. Rendered at 2x device-scale for crispness, then downsampled to 1280×720 via Pillow `Image.LANCZOS` and saved at JPEG quality 82 with `optimize=True, progressive=True`. Final files land at ~60–100 KB.

**Per-page hero capture.** All four cards use the same approach: scroll the hero element into view, wait long enough for any intersection-observer-triggered renders to finish painting (Chart.js animations on BvSM and Retirement; mini-tile renderers in the Tools featured row), then `element.screenshot()`. Per-card wait timings are encoded as `wait_after_scroll_ms` in the script's CARDS config. The hero PNG is base64-encoded into a `data:` URL and embedded as `<img>` in the injected frame, so the composed page has no external network dependency at screenshot time.

A pure DOM-clone variant (cloning the hero subtree into the OG frame rather than capturing it as a bitmap) was tried first but doesn't work for the heatmap: the grid's CSS-grid column widths are sized by flexbox container context, and cloning the subtree loses that context, so cells nearly double in size and overflow horizontally. Element-screenshot dodges this entirely and works for both DOM and canvas heroes.

**Shared editorial chrome** (so all product-forward cards read as a family with the brand-forward cards):

| Element | Position | Font | Size | Color |
|---|---|---|---|---|
| Title (e.g. *Bitcoin* vs. The Stock Market) | top-left, `padding 48 64` | Cormorant Garamond, weight 500, italic accent in amber | 56px | `#f2eee8` (em: `#F7931A`) |
| Subtitle (one-sentence Inter description) | beneath title | Inter, weight 400 | 19px | `#c8c2b8` |
| Brand mark (•&nbsp;LAST COIN STANDING) | top-right | Inter, weight 600 | 12px caps, letterspaced 0.22em | `rgba(255,255,255,0.55)` with amber dot |
| Hero visual | center, ~`flex: 1` | — | typically 350-380px tall | — |
| Stats line (key takeaway) | bottom-left | Inter, weight 400 | 16.5px | `#d6cfc3`, `strong` in amber |
| URL | bottom-right | Inter, weight 500 | 13px caps, letterspaced 0.16em | `rgba(255,255,255,0.5)` |

Background is `linear-gradient(135deg, #0a0908 0%, #15130f 100%)` with a subtle `radial-gradient(ellipse at top right, rgba(247, 147, 26, 0.07) 0%, transparent 55%)` amber-glow accent at the top right.

**Italic-amber accent in titles.** Every product-forward card has at least one word italicized in `#F7931A` matching the page's own H1 styling (`<em>Bitcoin</em>`, `<em>Tools</em>`). This is the visual hook that ties the OG family back to the site's typographic identity.

**Validation.** After deploy, the OG image URL must return `HTTP 200` with `Content-Type: image/jpeg` (a Cloudflare HTML fallback at 200 status is the silent failure mode — see §6.15.3 below). Validate the social card preview via metatags.io, Facebook's debugger, or by pasting the URL into a draft tweet.

**Regeneration discipline.** Product-forward OGs embed live chart data. When the underlying data refreshes (BTC weekly prices, comparator returns), the OGs go stale. Plan to run `npm run build-ogs` after each data refresh — see `MONTHLY_REFRESH_CHECKLIST.md` §6. Brand-forward OGs (§6.15.1) don't have this dependency.

### 6.15.3 OG staticAsset registration (applies to both patterns)

Eleventy's repo-root passthrough is opt-in per file (the folder-level passthrough only covers `videos/`). Every new OG image must be added to the `staticAssets` array in `.eleventy.js`:

```javascript
const staticAssets = [
  // ... existing entries ...
  'og-<slug>.jpg',
];
```

Without this, Cloudflare serves the page's HTML at the OG image URL — a phantom-200 failure mode that produces broken social cards on Twitter/LinkedIn/Slack without any visible build error. Detection: `curl -I https://lastcoinstanding.com/og-<slug>.jpg` must return `Content-Type: image/jpeg`, not `text/html`. This bit us in the past (commit `64ae655`-era; TECH_DEBT lists the historical fix) — the lesson stuck.


### 6.16 Print stylesheet pattern (single-page PDF)

Pattern for adding print stylesheets to calculator pages. Reusable for any future calculator that needs a printable scenario summary.

**Used by.** `/the-bitcoin-retirement` (canonical first use, shipped May 2026), `/borrowing-against-your-stack` (Loan Health tab, May 2026 — note: BAS print scaffolding lives only on Tab II; other BAS tabs degrade to printing on-screen content with global chrome hidden, per the BAS print CSS scope comment).

**Architecture.** Two `display: none` print-only blocks interleaved in the calculator DOM:

```html
<div class="tab-content active" id="tab-calculator">

  <!-- PRINT-ONLY: header + inputs (appears before chart in print) -->
  <div class="print-only print-block print-block-pre" aria-hidden="true">
    <div class="print-page-head">
      <div class="print-brand">LAST COIN STANDING</div>
      <div class="print-meta">
        <span class="print-url">lastcoinstanding.com/[page-slug]</span>
        <span class="print-meta-sep">·</span>
        <span id="printDate">—</span>
      </div>
    </div>
    <h2 class="print-title">[Page Name] — Scenario</h2>
    <table class="print-inputs-table">
      <thead><tr><th colspan="2">Inputs</th></tr></thead>
      <tbody id="printInputsBody"><!-- populated by JS --></tbody>
    </table>
  </div>

  <!-- Regular calculator UI (most hidden in print, chart visible) -->
  ...

  <!-- PRINT-ONLY: outputs + footer (appears after chart in print) -->
  <div class="print-only print-block print-block-post" aria-hidden="true">
    <h3 class="print-section-title">[Output section label]</h3>
    <div class="print-sust-grid"><!-- two value-blocks --></div>
    <p class="print-sust-detail" id="printSustDetail">—</p>
    <p class="print-disclaimer">For exploration and education only. ...</p>
  </div>
</div>
```

DOM order produces the right print sequence naturally: header → inputs → chart → outputs → footer.

**CSS structure.**

```css
/* Default: hidden on screen */
.print-only { display: none; }

@media print {
  /* Override CSS variables for ink-friendliness */
  :root {
    --bg-page: white;
    --ink-bright: black;
    --amber: #b06a18;            /* darker amber for ink contrast */
  }
  body { background: white !important; color: black !important; }

  /* Hide screen chrome — actual class names matter, audit against rendered HTML */
  nav, header.site-header, .site-nav, .site-header,
  .tool-framing,                    /* disclaimer button strip */
  footer, .site-footer,
  .footer-cta,                      /* "Continue Exploring" h3 */
  .related-block, .related-grid,    /* related-card tiles */
  .page-header, .tab-nav,
  .tab-content:not(.active),
  .help-tip                         /* ? icons and tooltips */
  { display: none !important; }

  /* Show print-only blocks */
  .print-only { display: block; }

  /* Tighten the chart container for print */
  .projection { padding: 8pt !important; page-break-inside: avoid; }
  .chart-wrapper { height: 280pt !important; page-break-inside: avoid; }

  @page { margin: 14mm 12mm 12mm 12mm; size: letter; }
}
```

**JS state population on `beforeprint`.**

```javascript
function bindPrintPopulation() {
  function populate() {
    document.getElementById('printDate').textContent =
      new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    // Build #printInputsBody from existing screen value displays
    // Copy output values to print blocks (preserve classes like escape-velocity)
  }
  window.addEventListener('beforeprint', populate);
  populate();  // Safari-mobile fallback (beforeprint is unreliable there)
}
```

**Critical: audit selectors against actual rendered HTML.** The print stylesheet's "hide screen chrome" selectors must match the actual class names in rendered output, not speculative names. Verify with `curl https://[site] | grep class=` before shipping. The Bitcoin Retirement initial print ship missed two: `.tool-framing` (not `.tool-framing-strip`) and `.footer-cta` + `.related-block` (not `.related-set`). Fixed in commit `64ae655`.

**Page-break management.** Charts and grouped output panels carry `page-break-inside: avoid` to keep them whole. On letter-size paper at default zoom, a typical scenario lands cleanly on one page; on A4 it should also fit. Audit print preview at letter and adjust font-size / spacing as needed.

**Lighter CSS-only variant — when applicable.** Added June 2026 with `/bitcoin-fixed-income`. The Retirement / BAS pattern above uses two print-only DOM blocks populated by a `beforeprint` JS handler — the right call when on-screen UI is dense with interactive controls and the print page needs a completely different layout (curated header + inputs table + outputs table + footer). For pages whose on-screen *readout* surfaces are already print-friendly — labeled value rows for inputs, clear output-cards for results, an expandable cashflow table — the same outcome is achievable with `@media print` rules alone: hide interactive controls (range inputs, inactive chips/buttons), let the existing `.calc-slider-val` readouts and `.headline-output` cards show through, force `<details>` open, attach a disclaimer footer via `::after`. No JS, no duplicated DOM. Trade-off: print layout is constrained by screen DOM; for pages that want a deliberately different print layout, the full pattern above is the right call. Used by `/bitcoin-fixed-income` (Tab IV Calculator). Decision rule: if your screen DOM already shows "name → value" cleanly for every input you'd want in a printout, prefer the lighter variant. If it doesn't, use the two-block pattern.

### 6.17 Calc-mode-toggle (Money-Trees-style yin-yang)

**Use case:** When a page surface holds two conceptually-paired views or modes that shouldn't be diluted into separate tabs. Best for *temporal duality* (past/future, before/after) or *binary opposition* (with/without, A/B). Inspired by the Money Trees page's Bitcoin/Fiat toggle. Canonical implementation: BvRE Calculator tab (Retrospective / Projection).

**Core principle:** Two equal-weight labels flank a sliding switch in the middle. The switch physically moves left↔right (or top↔bottom on mobile) when toggled, communicating "these are paired by design, not just two unrelated options."

```html
<div class="calc-mode-toggle" data-active-mode="retrospective" role="tablist" aria-label="Calculator mode">
  <button type="button" class="calc-mode-label retrospective active"
          data-mode="retrospective" role="tab" aria-selected="true"
          aria-controls="calc-mode-retrospective">
    <span class="calc-mode-name">Retrospective</span>
    <span class="calc-mode-sub">What if you'd bought bitcoin?</span>
  </button>
  <button type="button" class="calc-mode-switch" aria-label="Toggle calculator mode">
    <span class="calc-mode-thumb"></span>
  </button>
  <button type="button" class="calc-mode-label projection"
          data-mode="projection" role="tab" aria-selected="false"
          aria-controls="calc-mode-projection">
    <span class="calc-mode-name">Projection</span>
    <span class="calc-mode-sub">What might happen going forward?</span>
  </button>
</div>

<div class="calc-mode-content active" id="calc-mode-retrospective" role="tabpanel">[content for mode 1]</div>
<div class="calc-mode-content" id="calc-mode-projection" role="tabpanel">[content for mode 2]</div>
```

**Visual design.** Two labels at 0.5 opacity when inactive, full when active. Active label color signals the mode (gray/cool for retrospective, amber for projection in BvRE). Label structure: Cormorant Garamond title (1.5rem) + Inter subtitle (0.78rem, italic, muted). Switch: 64×32px pill (mobile: 32×64px). Track shifts color when active mode is on the right side. Thumb (24×24px circle) slides with `transition: left 0.3s cubic-bezier(.4,.0,.2,1)`. Active state driven by `data-active-mode` attribute on `.calc-mode-toggle` parent; CSS uses attribute selector to swap thumb position and track color. Both labels and the central switch are clickable.

**JS pattern.**

```js
(function bindCalcModeToggle(){
  var toggle = document.querySelector('.calc-mode-toggle');
  if(!toggle) return;
  var labels = toggle.querySelectorAll('.calc-mode-label');
  var switchBtn = toggle.querySelector('.calc-mode-switch');
  var contents = document.querySelectorAll('.calc-mode-content');

  function setMode(mode){
    toggle.dataset.activeMode = mode;
    labels.forEach(function(l){
      var isActive = l.dataset.mode === mode;
      l.classList.toggle('active', isActive);
      l.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    contents.forEach(function(c){
      c.classList.toggle('active', c.id === 'calc-mode-' + mode);
    });
  }

  labels.forEach(function(l){ l.addEventListener('click', function(){ setMode(l.dataset.mode); }); });
  switchBtn.addEventListener('click', function(){
    setMode(toggle.dataset.activeMode === 'retrospective' ? 'projection' : 'retrospective');
  });
})();
```

Mobile breakpoint at **640px** stacks the toggle vertically and rotates the switch (32×64, thumb slides top↔bottom). See `/src/_includes/_pageassets/bitcoin-vs-real-estate.css` for the canonical CSS.

**When to use this vs. tabs.** Use this when the two views are a *paired set* and the page already has tabs at a higher level (sub-toggle inside a tab works well). Use this when the conceptual relationship is a duality (past/future, A/B, with/without). Use tabs instead when there are 3+ views, or when the views are *parallel* rather than *paired*.

### 6.18 Porkopolis credit block

**Use case:** Prominent attribution to Matthew Mežinskis at Porkopolis Economics for the Power Law channel framework. Use any time a page references the channel framework (floor at 0.42× trend, upper at 3× trend, daily-close stress-test convention) or applies it as a decision frame.

**Core principle:** Credit should be prominent — not a footnote, not buried in a Sources block — but it shouldn't dominate the page either. An amber-tinted callout with an uppercase label and 1–2 sentences of attribution.

```html
<div class="porkopolis-credit">
  <div class="porkopolis-credit-label">Channel framework &amp; coefficients</div>
  <p>The Power Law channel framework on this page &mdash; the structural floor at 0.42&times; trend, the upper band at 3&times; trend, and the daily-close-as-stress-test convention &mdash; was developed and refined by <a href="https://www.porkopolis.io/thechart/" target="_blank" rel="noopener"><strong>Matthew Me&zcaron;inskis</strong></a> at <a href="https://www.porkopolis.io" target="_blank" rel="noopener">Porkopolis Economics</a>. This visualization is built on his coefficients (a&nbsp;=&nbsp;1.6&times;10<sup>&minus;17</sup>, b&nbsp;=&nbsp;5.77) and band ratios. For the canonical version with live data and ongoing analysis, see <a href="https://www.porkopolis.io/thechart/" target="_blank" rel="noopener">Porkopolis: The Chart</a> directly.</p>
</div>
```

**Visual design.** Background `rgba(224,148,34,0.04)` (very light amber tint), border `1px solid rgba(224,148,34,0.18)`. Label uppercase, 0.7rem, letter-spacing 1.5px, amber, weight 500. Body 0.95rem, line-height 1.7, in `--text-dim`. Links amber, underline on hover. Mežinskis name `<strong>` for emphasis. Mobile: padding tightens to 1.1rem 1.2rem at 720px breakpoint.

**Where to use it.**

- **The Channel page** (Tab 4 of Power Law) — canonical home; credit block at the top of tab content, before the chart.
- **Future pages applying the channel framework** — where attribution context is needed (e.g. a smaller variant for inline references on Disciplined Rebalancing).
- **Not needed on** retirement page or BvRE projection mode — these pages cross-link to The Channel page where the credit is prominent. Convention: link forward to The Channel for full attribution; quietly reference Porkopolis coefficients in methodology footnotes when needed.

See `/src/_includes/_pageassets/the-power-law.css` for the canonical CSS.

### 6.19 Channel control surface (axis toggle + band visibility)

**Use case:** Any chart where the user benefits from controlling the axis scale or hiding/showing individual datasets. Established for The Channel page; reusable for any future analytical chart.

```html
<div class="channel-container">
  <div class="channel-controls">
    <div class="channel-axis-toggle" role="tablist" aria-label="Time axis scale">
      <button type="button" class="channel-axis-btn active" data-axis="linear">Linear time</button>
      <button type="button" class="channel-axis-btn" data-axis="log">Log time</button>
    </div>
    <div class="channel-band-toggles" role="group" aria-label="Band visibility">
      <label class="channel-band-toggle"><input type="checkbox" data-band="floor" checked><span>Floor</span></label>
      <label class="channel-band-toggle"><input type="checkbox" data-band="trend" checked><span>Trend</span></label>
      <label class="channel-band-toggle"><input type="checkbox" data-band="upper" checked><span>Upper</span></label>
      <label class="channel-band-toggle"><input type="checkbox" data-band="history" checked><span>Price history</span></label>
    </div>
  </div>
  <div class="channel-chart-wrapper"><canvas id="channelChart"></canvas></div>
  <div class="channel-status" id="channelStatus">[live status line]</div>
</div>
```

**Visual design.** Container: `--bg-card` background, `--border` 1px outline, 8px radius, 1.5rem 1.8rem padding. Controls row: flex space-between, wraps on mobile, border-bottom separator. Axis toggle: segmented buttons (sharing borders); active state = amber tint background + amber text. Band toggles: standard checkbox + label pairs, accent-color amber, 0.82rem text in `--text-dim`. Chart wrapper: fixed height 460px desktop, 380px mobile (lets Chart.js compute proportions cleanly). Status line: monospace (`SF Mono` / `Monaco`), 0.85rem in `--text-muted`, separated from chart by border-top.

Mobile breakpoint at **720px** collapses controls to vertical stack, shrinks chart to 380px, status line to 0.78rem.

**When to use it.** The Channel page (canonical home). Future analytical charts with multi-band data and axis-mode-relevance. *Not* for simple display charts where users don't need controls — the pattern is for *interactive analysis*, not just visualization.

### 6.20 Section eyebrow (`section-eyebrow`)

A small uppercase amber pill placed above an `h2` to orient the reader at major editorial transitions on a long-scroll page. Introduced on BvSM to mark the four-section progressive arc: *Framework → Looking Back → Looking Forward → Takeaway*. The pattern is reusable on any multi-section page whose argument unfolds across distinct registers.

**Markup:**

```html
<div class="section-eyebrow">FRAMEWORK</div>
<h2>The Power Law as cautionary tale</h2>
```

**CSS:**

```css
.section-eyebrow {
  display: inline-block;
  padding: 0.3rem 0.85rem;
  border-radius: 999px;
  background: rgba(224, 148, 34, 0.08);
  border: 1px solid rgba(224, 148, 34, 0.22);
  color: var(--amber);
  font-family: 'Inter', sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 1.2rem;
}
```

**When to use it.** Long pages (1500+ words / 4+ scroll sections) where the reader benefits from a "you are entering a new register" marker. Skip on shorter pages — eyebrows on a 600-word page read as overdesigned.

**Vocabulary discipline.** Eyebrow labels should be single-word or two-word categorical markers (`FRAMEWORK`, `LOOKING BACK`, `THE PROTOCOL`, `TAKEAWAY`), not section titles. The `h2` underneath is the section title; the eyebrow is the *kind* of section. If the eyebrow paraphrases the `h2`, drop the eyebrow.

### 6.21 As-of callout (`as-of-callout`)

A bordered callout that surfaces a time-sensitive data point (e.g., *"bitcoin is currently 0.59× trend"*) with explicit as-of dating. Introduced on BvSM §1 and §3 to honestly stamp every present-moment claim with the freshness date that backs it. The pattern preserves editorial honesty as the page ages between monthly refreshes (see `MONTHLY_REFRESH_CHECKLIST.md`).

**Markup:**

```html
<div class="as-of-callout">
  <div class="as-of-label">AS OF MAY 2026</div>
  <div class="as-of-body">
    Bitcoin sits at <strong>0.59× trend</strong> — about 41% below the
    Power Law trendline. By the historical distribution this is inside
    the lower-percentile band where prior cyclical floors have sat.
  </div>
</div>
```

**CSS:**

```css
.as-of-callout {
  background: rgba(224, 148, 34, 0.04);
  border-left: 3px solid var(--amber);
  padding: 1rem 1.3rem;
  margin: 1.6rem 0;
  border-radius: 0 4px 4px 0;
}
.as-of-label {
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--amber);
  margin-bottom: 0.5rem;
}
.as-of-body {
  font-size: 0.98rem;
  line-height: 1.55;
  color: var(--text);
}
.as-of-body strong {
  color: var(--text-bright);
  font-weight: 600;
}
```

**Update discipline.** The date string is hardcoded; refresh monthly in lockstep with `TODAY_DAYS` / `TODAY_PRICE` (see `MONTHLY_REFRESH_CHECKLIST.md §3`). When you update the constants, grep the page for `AS OF` and update every callout to the current month.

### 6.22 Chart time-range toggle (`chart-range-toggle`)

A segmented button group placed above a chart to switch between viewing windows (e.g., *All-time* vs *Recent 2y*). Introduced on the BvSM §1 Power Law chart to let the reader either see the full nine-orders-of-magnitude sweep or zoom into recent cycles for entry-quality context.

**Markup:**

```html
<div class="chart-range-toggle" role="tablist">
  <button class="range-btn active" data-range="all" role="tab" aria-selected="true">All-time</button>
  <button class="range-btn"        data-range="2y"  role="tab" aria-selected="false">Recent 2y</button>
</div>
```

**CSS** (canonical pattern shared with §6.19 Channel control surface's axis toggle):

```css
.chart-range-toggle {
  display: inline-flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.8rem;
}
.range-btn {
  background: transparent;
  color: var(--text-dim);
  border: none;
  padding: 0.4rem 0.95rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  cursor: pointer;
  border-right: 1px solid var(--border);
  transition: background 0.12s ease, color 0.12s ease;
}
.range-btn:last-child { border-right: none; }
.range-btn.active {
  background: rgba(224, 148, 34, 0.12);
  color: var(--amber);
}
```

**JS** sets the Chart.js `scales.x.min` and `scales.x.max` on click and calls `chart.update()`. For log-scale price axes, recompute `scales.y.min` to the local-window minimum to avoid a near-empty plot when zooming in.

**When to use it.** Charts where two viewing windows tell genuinely different stories — long-arc structural argument vs near-term entry-quality context. Don't use for charts where the entire data window is the argument (e.g., the 135-year housing series on BvRE — there is no "recent" view that adds anything).

### 6.23 "You are here" pulse marker (`you-are-here-pulse`)

An animated radial halo positioned at the current-state data point on a chart, drawing the reader's eye to *where we are now* relative to the broader pattern. Introduced on BvSM §1 to mark today's bitcoin position inside the Power Law channel without resorting to a chart annotation that visually competes with the price line.

**Markup** — a positioned `div` sibling of the chart canvas, both inside a `position: relative` wrapper:

```html
<div class="chart-wrapper">
  <canvas id="pl-chart"></canvas>
  <div class="you-are-here-pulse" id="pl-pulse"></div>
</div>
```

**CSS:**

```css
.chart-wrapper { position: relative; height: 460px; }
.you-are-here-pulse {
  position: absolute;
  width: 16px; height: 16px;
  border-radius: 50%;
  pointer-events: none;
  z-index: 2;
  display: none;  /* JS toggles to block once positioned */
}
.you-are-here-pulse::before,
.you-are-here-pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--amber);
}
.you-are-here-pulse::before {
  animation: pulse-halo 2.2s ease-out infinite;
  opacity: 0.45;
}
.you-are-here-pulse::after {
  transform: scale(0.35);
  box-shadow: 0 0 8px var(--amber);
}
@keyframes pulse-halo {
  0%   { transform: scale(0.35); opacity: 0.55; }
  100% { transform: scale(3.2);  opacity: 0; }
}
```

**JS positioning** — Chart.js `afterRender` plugin sets `left` / `top` to the pixel coordinates of the (`TODAY_DAYS`, `TODAY_PRICE`) point so the pulse follows the chart's responsive resize:

```javascript
const pulsePlugin = {
  id: 'youAreHerePulse',
  afterRender(chart) {
    const xScale = chart.scales.x, yScale = chart.scales.y;
    const x = xScale.getPixelForValue(TODAY_DAYS);
    const y = yScale.getPixelForValue(TODAY_PRICE);
    const pulse = document.getElementById('pl-pulse');
    pulse.style.left = (x - 8) + 'px';
    pulse.style.top  = (y - 8) + 'px';
    pulse.style.display = 'block';
  }
};
```

**Canonical class name: `lcs-pulse-halo` (promoted 2026-05-28).** The pulse rolled out across tactical chart pages where a live, animated anchor is the right cue — currently DR and BAS (BAS promotes its previously-static green "Current price" dot into the pulse so there's no second marker). The shared class name is `lcs-pulse-halo` and the keyframe animation is `lcsPulseRing`, matching across all consumers. The original BvSM `bvsm-you-are-here-pulse` rules stay in place on that page for now (they work; visual parity is preserved by matching keyframes); future BvSM CSS work can swap to the canonical name at no behavioral cost.

**Retirement intentionally does NOT use the pulse.** Initially included in the rollout, then removed (session-9 review) because on the long-horizon projection chart the animation read as distracting against the gentle wealth curve — the chart's character is reflective/planning, not real-time/tactical. Retirement instead uses the same Channel-style today's-price caption below its chart (see "Today's bitcoin price" status-line treatment on `/the-power-law#channel`, `/bitcoin-vs-the-stock-market`, and `/the-bitcoin-retirement`).

**CSS is duplicated per-page CSS file rather than living in a shared module** — this site doesn't yet have a base.css, and adding one purely for this is out of scope. The duplication is mechanical (the rule body is identical across consumers) and the canonical class name carries the "shared" identity. If a base.css is added later, this is the obvious first inhabitant.

**Conceptual / educational pages should NOT adopt the pulse** — e.g., the Power Law Channel tab is foundational/explanatory rather than tactical, so the pulse would over-signal "live performance" on a chart whose argument is the multi-decade arc. The rule of thumb: pulse on tactical decision tools, plain on conceptual explainers — and on chart pages whose character is reflective/planning rather than active-decision, prefer the today's-price caption alone.

### 6.24 Combined presets + slider input group (`start-input-group`)

A visual enclosure that frames a preset-button row and a slider as one logical input — used when the user can either *pick a named scenario* (preset) or *dial in a custom point* (slider) for the same parameter. Introduced on BvSM §2 to combine four cyclical-top presets (2013 top, 2017 top, 2021 top, 2025 ATH) with a free-scrubbing start-date slider, both setting the same `start_date` variable.

**Markup:**

```html
<div class="start-input-group">
  <div class="cluster-label">
    <span class="cluster-label-main">Start date</span>
    <span class="cluster-label-help">— pick a named entry or scrub the slider</span>
  </div>
  <div class="preset-row">
    <button class="preset-btn" data-start="2013-12-04">
      2013 top <span class="preset-multiple">(12.1×)</span>
    </button>
    <button class="preset-btn" data-start="2017-12-17">
      2017 top <span class="preset-multiple">(6.4×)</span>
    </button>
    <button class="preset-btn" data-start="2021-11-10">
      2021 top <span class="preset-multiple">(2.8×)</span>
    </button>
    <button class="preset-btn" data-start="2025-01-20">
      2025 ATH <span class="preset-multiple">(1.12×)</span>
    </button>
  </div>
  <input type="range" class="start-slider" min="..." max="..." value="...">
  <div class="slider-readout">Start: <strong>15 Dec 2017</strong></div>
</div>
```

**CSS:**

```css
.start-input-group {
  background: rgba(224, 148, 34, 0.04);
  border: 1px solid rgba(224, 148, 34, 0.20);
  border-radius: 8px;
  padding: 1.2rem 1.5rem;
  margin: 1.5rem 0;
}
.preset-row {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
  margin: 0.8rem 0 1rem;
}
.preset-btn {
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.45rem 0.9rem;
  border-radius: 4px;
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}
.preset-btn:hover { border-color: rgba(224, 148, 34, 0.35); }
.preset-btn.active {
  background: rgba(224, 148, 34, 0.14);
  border-color: var(--amber);
  color: var(--amber);
}
```

**Behavior pattern — slider clears preset.** When the user clicks a preset, it sets the slider value AND adds `.active` to the preset button. When the user moves the slider, the JS clears `.active` from all preset buttons (the slider's freely-scrubbed value isn't one of the named scenarios anymore). This preserves the *"you are on a named scenario right now"* signal honestly.

**When to use it.** Inputs where named scenarios carry editorial weight (the four cyclical-top entries above are the page's *worst-case stress test* — naming them is a pedagogical choice) AND the user might also want to dial in something between or outside the named points. Skip when the inputs are purely continuous (just use a slider) or purely categorical (just use buttons).

### 6.25 Inline preset annotation (`preset-multiple`)

A small parenthetical annotation inside a preset button text, showing a *value-at-that-preset* that helps the reader understand the relative scale of the named options. Used on the BvSM §2 preset row to show each cyclical top's multiple-of-trend (e.g., `2013 top (12.1×)`), making explicit how dramatically more elevated the earlier tops were than the most recent one.

**Markup** — inline `<span>` inside the preset button:

```html
<button class="preset-btn" data-start="2013-12-04">
  2013 top <span class="preset-multiple">(12.1×)</span>
</button>
```

**CSS:**

```css
.preset-multiple {
  font-size: 0.78rem;
  color: var(--text-dim);
  font-weight: 400;
  margin-left: 0.15rem;
}
.preset-btn.active .preset-multiple {
  color: rgba(224, 148, 34, 0.75);
}
```

**Vocabulary discipline.** The annotation should be a *comparable number on the same axis* across all presets — not a mix of magnitudes and absolute prices. The BvSM annotation is multiple-of-trend for all four (12.1× / 6.4× / 2.8× / 1.12×), which lets the reader compare the entries at a glance. Mixing units inside the annotation (e.g., `(12.1×) / ($1,150) / (high) / (recent)`) defeats the purpose.

### 6.26 Share-this-scenario section (`share-section`)

**Use case:** Any page with a shareable scenario URL (the URL captures the user's current state via query params — see `SITE_GUIDE §17.5`). The section makes the otherwise-invisible shareability discoverable and provides one-click options for the two functionally-distinct intents users actually have. Introduced on the Retirement page at the same time as the page-URL sync; designed for reuse on every calculator page where the URL becomes meaningful as the user dials in inputs.

**Core principle: two intents, two URL flavors.** Users sharing a calculator scenario have two genuinely different goals: *send my specific projection to a friend, spouse, or advisor* (direct messaging, often private), and *tell people about this calculator* (public posts, often promotional). These map to different URL flavors:

- **Scenario URL** (`?stack=…&income=…&…`) → Copy link, native share. The receiver sees what the sender configured.
- **Generic page URL** (no query params) → X, LinkedIn, Facebook. The receiver lands on a clean page and explores their own scenario.

Mixing the two in one button row is a real privacy footgun: a user clicking "X" with their actual retirement target and BTC stack baked into the URL doesn't realize they're broadcasting personal numbers to their followers. Splitting the two groups visually *and* functionally — with each button class fixed to the right URL flavor — makes the choice explicit. A user who wants to publish their scenario publicly can still copy the link and paste into a tweet; that one extra step is worth the protection it gives to everyone else.

**Markup:**

```html
<section class="share-section" id="shareSection">
  <div class="share-groups">
    <div class="share-group">
      <div class="share-group-header">
        <span class="share-group-label">Share this scenario</span>
        <span class="share-group-help">A link that carries your current sliders &mdash; for sending a specific projection to a friend, your spouse, or your advisor.</span>
      </div>
      <div class="share-actions">
        <button type="button" class="share-btn" id="shareCopy" aria-label="Copy link to clipboard">
          <svg class="share-icon">...</svg><span class="share-btn-label">Copy link</span>
        </button>
        <button type="button" class="share-btn share-btn-native" id="shareNative" aria-label="Share via system" hidden>
          <svg class="share-icon">...</svg><span class="share-btn-label">Share&hellip;</span>
        </button>
      </div>
    </div>
    <div class="share-group">
      <div class="share-group-header">
        <span class="share-group-label">Share the calculator</span>
        <span class="share-group-help">A clean link to the page &mdash; without your specific settings &mdash; for public posts and broader sharing.</span>
      </div>
      <div class="share-actions">
        <a class="share-btn" id="shareTwitter" href="#" target="_blank" rel="noopener">
          <svg class="share-icon">...</svg><span class="share-btn-label">X</span>
        </a>
        <a class="share-btn" id="shareLinkedIn" href="#" target="_blank" rel="noopener">
          <svg class="share-icon">...</svg><span class="share-btn-label">LinkedIn</span>
        </a>
        <a class="share-btn" id="shareFacebook" href="#" target="_blank" rel="noopener">
          <svg class="share-icon">...</svg><span class="share-btn-label">Facebook</span>
        </a>
      </div>
    </div>
  </div>
</section>
```

**Visual design.** Outer section: top border + 1.5rem padding-top to separate from the result above. Two share-groups in a `1fr 1fr` grid with a 2.5rem column gap, stacking to 1 column at 720px. Each group header uses the canonical eyebrow register (0.7rem, uppercase, 0.22em letter-spacing, amber) with a muted italic help line below. Buttons are inline-flex with a subtle dark-tint background, 1px border, 4px radius; on hover they pick up an amber tint and brighter text. Copy-link feedback applies a `.share-btn-copied` class that switches to amber-tinted background + amber text for ~1.8 seconds. Native-share button stays hidden by default; the IIFE un-hides it only when `navigator.share` is available (mobile + Safari).

**Behavior pattern.** The IIFE binds two URL getters:
- `currentUrl()` → `window.location.href` (scenario-laden) — used by Copy link and Native share.
- `genericPageUrl()` → `window.location.origin + window.location.pathname + window.location.hash` (strips `?query`, preserves `#tab`) — used by all social-intent buttons.

Buttons read their URL at *click time*, not page-load, so the share target always reflects whatever the user has just configured. Social buttons open in a popup-sized new tab using standard share-intent endpoints:
- X/Twitter: `https://twitter.com/intent/tweet?url=...&text=...`
- LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=...`
- Facebook: `https://www.facebook.com/sharer/sharer.php?u=...`

Copy uses `navigator.clipboard.writeText` with an `execCommand` fallback for legacy browsers. Native share uses `navigator.share`.

**Placement.** Insert after the page's "aha moment" UI (Sustainability readout on Retirement, equivalent on other pages) and before the next interactive section (Baseline Assumptions on Retirement). The top border separates it visually from the result above; the section sits at the natural "I've configured this, now what?" pause point.

**Print:** Hidden via `display: none !important` in the page's `@media print` block — it's pure on-screen interaction.

**When to add it to a new page.** Any page that:
- Has a shareable URL (per `SITE_GUIDE §17.5` or equivalent), or could trivially be given one;
- Has a result the user might want to spread (a chart, a number, a verdict);
- Has a calm pause point between the result and any continued exploration.

Pages where it probably doesn't earn space: pure-prose pages with no interactive state to share, or pages whose primary CTA is something else (e.g. a checkout or a sign-up). For those, a generic page-level share button at the top or in the footer might be more appropriate; the `share-section` is for *scenario sharing*, not generic page promotion.

**Where it's used.** Two distinct surfaces, applied independently:

*In-page two-group share section* — placed near the result, scenario-laden. Consumers:
- Retirement (canonical home, 2026-05-22)
- Disciplined Rebalancing (2026-05-22)
- Bitcoin vs. Real Estate (2026-05-22) — inside `panel-calculator` so it only appears on the calculator tab
- Borrowing Against Your Stack (2026-05-22) — outside the tab structure (after all tab-content divs, before related/companion) so it's visible regardless of active tab; scenario state is shared across BAS tabs via the SHARED_PAIRS state-sync layer, so a tab-independent share section captures the same scenario from any tab
- Bitcoin Fixed Income (June 2026) — **simplified single-action variant**: only a "Copy share link" button + status, not the full two-group component. Reasons: the page's first-person register doesn't ask for social-promotion buttons, and the layout-level "Share this page" surface auto-injected by `base.njk` already covers public sharing. URL contract follows the canonical convention (query params, defaults omitted, ~250ms debounced `history.replaceState`) so existing `currentUrl()`-equivalent logic on other pages remains compatible. Future alignment to the full two-group component tracked in TECH_DEBT as part of any future sales/promotion register for BFI.

The right-hand group's eyebrow varies slightly per page register — *"Share the calculator"* on Retirement reads as natural; on DR / BvRE / BAS the surface is more analytic than calculator-like so *"Share the page"* fits better. The pattern accommodates that copy flex without changing markup or CSS structure.

*Layout-level "Share this page"* — auto-injected by `base.njk` between page content and the canonical footer on **every** page (added 2026-05-22). Single-group, generic-URL only (no query params). Frontmatter `share_in_layout: false` opts a specific page out.

CSS, markup, and JS for the layout-level surface all live inline in `base.njk` (same pattern as the canonical-body, canonical-nav, canonical-footer, and Related component blocks). Class names are `.page-share*` to namespace-separate from the in-page section's `.share-section / .share-group / .share-btn`, so the two surfaces coexist without CSS or JS collisions on calculator pages.

JS targeting strategy:
- **Layout-level** uses data attributes (`[data-page-share]`, `[data-share-action="copy|native|twitter|linkedin|facebook"]`) so multiple instances could theoretically coexist (though only one is auto-injected today)
- **In-page** uses IDs (`#shareSection`, `#shareCopy`, etc.) per the existing calculator-page convention

Each calculator page wires its own in-page IIFE; the layout-level IIFE in `base.njk` handles the auto-injected surface for every page.

### 6.27 Sentence-as-navigation carousel (`bd-explorer`)

For sequential editorial content with N short, named components that compose a single sentence or thesis — when the goal is to let the reader explore each component in place without scroll-and-reorient friction between them.

Introduced on the Bitcoin Defined page (May 2026 rebuild). Replaced an earlier stacked-cards design where the user had to scroll between sections after clicking Continue; users reported that each click required additional manual scrolling to find the next image, text, and button. The fix is to swap content in place within a single fixed card slot, and to make the sentence itself the navigation.

**Markup.** Two persistent containers above the carousel: a sticky sentence (rendered with each load-bearing term as a clickable span) and a progress counter. Below: a single card slot whose innards are swapped by JS; below the card, a Prev / counter / Next nav strip; below that, an optional reset link that appears only after 2+ components have been visited.

```html
<div class="bd-sticky-wrap">
  <div class="bd-sticky-sentence" id="bdStickySentence" aria-label="...Each idea is a navigable section.">
    <span class="bd-fixed">The Bitcoin&nbsp;</span>
    <span class="bd-word" data-word="network" role="button" tabindex="0">network</span>
    <span class="bd-fixed">&nbsp;is the&nbsp;</span>
    <span class="bd-word" data-word="open" role="button" tabindex="0">open</span>
    <!-- ...each load-bearing term gets a .bd-word span -->
  </div>
  <div class="bd-progress" id="bdProgress" aria-live="polite">
    <span id="bdProgressCount">0</span> of N revealed &middot;
    <span class="bd-progress-hint">click any idea to jump</span>
  </div>
</div>

<main class="bd-explorer">
  <article class="bd-card" id="bdCard">
    <div class="bd-card-inner">
      <div class="bd-card-image" id="bdCardImage"></div>
      <div class="bd-card-text-col">
        <p class="bd-card-eyebrow" id="bdCardEyebrow"></p>
        <h2 class="bd-card-word" id="bdCardWord"></h2>
        <p class="bd-card-definition" id="bdCardDefinition"></p>
        <div class="bd-card-elaboration" id="bdCardElaboration"></div>
      </div>
    </div>
  </article>
  <div class="bd-explorer-nav">
    <button class="bd-nav-btn bd-nav-prev" id="bdPrev">← Previous</button>
    <div class="bd-nav-counter" id="bdCounter" aria-live="polite">Idea 1 of N</div>
    <button class="bd-nav-btn bd-nav-next" id="bdNext">Continue →</button>
  </div>
  <div class="bd-explorer-reset" id="bdResetWrap" style="display:none">
    <button class="bd-reset-btn" id="bdReset">Reset progress</button>
  </div>
</main>
```

**Layout.** Side-by-side on desktop (image left ~50%, text right ~50%) so image and text don't compete for vertical viewport budget; stacks on mobile (<880px). Card padding ~1.75rem; sticky-sentence padding tightened to ~1rem top/bot (~110px total sticky-header height including progress line). On a 768px-tall viewport: site nav 65 + sticky 110 + card ~370 + nav controls ~68 = ~613px, fits with ~155px headroom. Image is rendered as `<img>` with `object-fit: cover` inside an aspect-ratio: 16/9 container; a fallback inline SVG is used for any component without a generated photo yet (graceful degradation while photography is in-flight).

**JS state model.** Two pieces of state: `{ currentIndex, visited }`. `currentIndex` is the integer of the currently-displayed component (0..N-1). `visited` is an object-as-set tracking which indices the reader has touched — drives the sentence-word highlighting (`.bd-revealed` for visited, `.bd-active` for current) and the progress counter. URL hash mirrors the current word's slug (`/page#component-id`) via `history.replaceState` so bookmarking and back/forward both work without polluting history. On page load, `parseHash()` resolves the initial component; on hash change (back/forward), the carousel updates with `{ skipAnimation: true }`.

**Content swap.** ~180ms opacity fade — JS adds `.bd-swapping` to the card, sets a `setTimeout` for the actual content swap, then removes the class. Editorial register, not flashy; matches the site's calm voice. No slide animations.

**Navigation surfaces.** Three ways to navigate:
1. **Sentence-word click** — any of the N spans in the sticky sentence is clickable. Click jumps directly. Visited words light up amber, current pulses. Sentence is the navigation.
2. **Continue / Previous buttons** — standard linear traversal. Continue stays labeled `Continue →` on every card including the last (don't relabel to "Complete" — readers may decide they're done and not click, missing the final reveal). On the last card, Continue scrolls smoothly to the final reveal section.
3. **Keyboard** — Arrow Right / Left for next/prev; Enter / Space on a focused sentence-word activates it.

**Final-reveal pattern.** When `visited.size === N`, a final section reveals (fade-in) showing the full completed sentence with all components lit, plus a closing reflection. The reflection should affirm what the page does (definition / accumulation / synthesis) and explicitly hand off the "what follows from this" arguments to other pages — to prevent overlap with sibling pages that make the consequence-of-each-component argument.

**When to use it.**

- Editorial content with N short, named components (3–10 range; below 3 a stack is fine, above 10 it's an exploration not a sequence)
- The components compose a coherent whole (the sentence, the framework, the system) — not a checklist
- Sequential reading order is the default but random-access matters too (readers may want to revisit a specific component)
- Each component has roughly comparable content depth — variation is fine but order-of-magnitude differences make the fixed-height slot fight you

**When to skip it.**

- The components aren't sequenced (no natural reading order → use a 2D map or grid)
- A reader needs to compare two components side-by-side (carousel makes that impossible by design)
- Components are too long to swap meaningfully (>1 screen of text per component → stack or paginate)

Currently consumed by `/bitcoin-defined` (May 2026). When a second consumer arrives, promote the `.bd-` prefix to a generic `.carousel-` or `.explorer-` namespace.

### Naming convention reminder

Several patterns above follow the convention `{purpose}-{role}`: `calc-mode-*`, `porkopolis-credit*`, `channel-*`, `start-input-*`. When introducing future patterns, prefer this convention over generic names like `.toggle` or `.controls` to avoid collisions across pages. Recipes §6.20–6.25 above were introduced on BvSM in May 2026 and are currently page-scoped (`.bvsm-section-eyebrow`, `.bvsm-as-of-callout`, etc. in the live page CSS); the recipe names above use the unprefixed canonical form. When a second consumer of any of these patterns arrives, promote the CSS into the shared layer and drop the prefix.

### 6.28 Two-level purposes hierarchy (`purposes-layout`)

A two-tier layout pattern for arguments where one concept is foundational and two others are derived from it. Used on `/what-money-is-for` (`SITE_GUIDE §12.1`) where Save sits as a full-width foundation row above Invest and Consume in a two-column row below. Sister to the WMHTB triangle (which depicts three symmetrically-coupled functions) — use this pattern when the relationship is hierarchical / asymmetric, not when it's symmetric / coupled.

**Markup.**

```html
<div class="purposes-layout">
  <!-- TOP TIER: foundational concept -->
  <section class="purpose-block" data-purpose="save">
    <header class="purpose-header">
      <div class="purpose-eyebrow">The default</div>
      <div class="purpose-title">Save</div>
      <div class="purpose-subtitle">...</div>
    </header>
    <div class="purpose-grid purpose-grid-4">
      <!-- 4 property cards in a 2x2 grid -->
    </div>
  </section>

  <!-- Visual bracket showing the branching -->
  <div class="purposes-bracket" aria-hidden="true">
    <svg viewBox="0 0 400 36" preserveAspectRatio="none">
      <line x1="200" y1="0"   x2="200" y2="13"  class="bracket-stem"/>
      <line x1="80"  y1="13"  x2="320" y2="13"  class="bracket-rule"/>
      <line x1="80"  y1="13"  x2="80"  y2="34"  class="bracket-stem"/>
      <line x1="320" y1="13"  x2="320" y2="34"  class="bracket-stem"/>
    </svg>
    <div class="purposes-bracket-label">from saving, two choices</div>
  </div>

  <!-- BOTTOM TIER: two derived choices, side-by-side -->
  <div class="purposes-row-secondary">
    <section class="purpose-block" data-purpose="invest"> ... </section>
    <section class="purpose-block" data-purpose="consume"> ... </section>
  </div>
</div>
```

**CSS skeleton.**

- `.purposes-layout` — `display: flex; flex-direction: column; gap: 0;` (sections own their margins / spacing via `.purpose-block`)
- `.purpose-block` — standard editorial card border + padding; `.purpose-block[data-purpose="save"]` overrides border + background to amber-tint (`rgba(247, 147, 26, 0.22)` border, `rgba(247, 147, 26, 0.02)` background) to telegraph foundational primacy
- `.purpose-grid-4` — `grid-template-columns: repeat(2, 1fr)` at desktop, collapses to `1fr` at ≤900px (4 cards stack vertically on mobile)
- `.purpose-grid-stack` — `grid-template-columns: 1fr` always (3 cards stack vertically inside their column)
- `.purposes-row-secondary` — `grid-template-columns: 1fr 1fr` at desktop, collapses to `1fr` + gap at ≤900px
- `.purposes-bracket` — 320×36 SVG with two horizontal stems and a connecting rule, amber stroke at 35% alpha; `display: none` at ≤900px (the hierarchy is implicit when stacked)

**Header treatment.** The `.purpose-header` is center-aligned (different from WMHTB's `.column-header` which is left-aligned). The `.purpose-eyebrow` is `--orange` for Save and `--text-dim` for Invest / Consume — the eyebrow color reinforces the foundation/derived distinction in addition to the border tint. Eyebrow letter-spacing is `0.22em`, slightly wider than the WMHTB column-eyebrow (`0.16em`), to fit "THE DEFAULT" comfortably as a small all-caps label.

**Inheritance from WMHTB.** The `.purpose-block` cards use the same four-state decoration vocabulary as WMHTB (resonant / depleted / decaying / dying) on the `.state-btn` pills inside each `.property` card. The CSS lives at the page level for now (not promoted to a shared layer), but the conventions are sitewide per the WMHTB precedent. Pills, palette, and transition timings should match WMHTB exactly so the two pages read as a family.

**When to use.** Concept where one element is structurally primary and two others derive from it. Examples: saving as the default with investing / consuming as choices (the canonical case); a foundation principle with two applications; one cause with two effects. Don't use when the three elements are symmetric or coupled — those want the WMHTB triangle pattern. Don't use when there are four or more derived elements — the bracket SVG and two-column row don't generalise cleanly past two.

### 6.29 Inline link inside descriptor cell (`.property-desc a`)

When a categorical-matrix cell (WMHTB / WMIF descriptor) wants an inline link to an off-site canonical learn-more source. First instance: the WMIF Gold / Independent-of-counterparty cell ending with `(rule 6102)` linked to the Executive Order 6102 Wikipedia article.

**JS rendering shift.** The descriptor render must use `.innerHTML` rather than `.textContent` so HTML markup in the data renders. WMHTB uses `.textContent` for its cells; WMIF uses `.innerHTML`. Both are valid for their own page; a page adopting links must use innerHTML.

```javascript
const desc = prop.querySelector('.property-desc');
if (desc) desc.innerHTML = entry.desc;  // not textContent
```

**Data form.**

```javascript
'independence': {
  value: 'constrained',
  decoration: 'depleted',
  desc: 'A bearer asset in principle, often centralized in practice. Seizable by decree, as the 1933 confiscation demonstrated (<a href="https://en.wikipedia.org/wiki/Executive_Order_6102" target="_blank" rel="noopener" class="desc-link">rule 6102</a>).'
}
```

**CSS.**

```css
.property-desc a,
.property-desc a.desc-link {
  color: var(--orange);
  text-decoration: none;
  border-bottom: 1px dotted rgba(247, 147, 26, 0.5);
  transition: color 0.2s ease, border-bottom-style 0.2s ease, border-bottom-color 0.2s ease;
}
.property-desc a:hover {
  color: var(--orange-bright);
  border-bottom-style: solid;
  border-bottom-color: var(--orange);
}
```

**Color rationale.** The orange dotted-underline reads as an affordance against the `--text-dim` body color of the cell — bright enough to signal "clickable" without competing with the active state pill's amber. Hover state goes solid + brighter to confirm interactivity. Selecting the `.desc-link` class explicitly (in addition to the bare `a` selector) lets future authors opt cells into a styled inline link without inheriting the base behaviour on links that might appear elsewhere in the markup.

**XSS note.** Data is hardcoded in the page's JS module; there's no user-supplied content path. innerHTML is safe in this context. If WMIF or a future sister page ever takes external input into a descriptor cell, sanitisation must be added or rendering must revert to `.textContent` for that field.

**When to use.** Inline footnote-style references where the term in the cell has a canonical learn-more source (Wikipedia, regulatory filing, primary text). Don't use for cross-links to other pages on this site — those belong in the page's `related:` front-matter and render via `§6.10` Related component. Inline links inside cells are reserved for off-site references that meaningfully enrich the term.

---


### 6.30 Two-line preset chip (`kp-name` / `kp-sub`)

A preset pill that carries its assumptions on its face: scenario name on the top line, computed inputs on the second (e.g. *"≈30%/yr · vol 67%"*), filled by JS so the chip can never go stale. Markup: `<button class="kpreset-btn"><span class="kp-name">…</span><span class="kp-sub" id="…"></span></button>`. Pair the cluster with a `cluster-title` ("Default scenarios") opposite a slider cluster titled "Custom assumptions" so the preset/slider relationship is explicit. **When to use:** any control where a named scenario encodes ≥2 numeric assumptions a Normie would otherwise have to guess. **When to skip:** binary toggles or presets whose meaning is self-evident. Canonical instance: How Much Bitcoin? §C (page-scoped `kp-` prefix).

### 6.31 Chart takeaways block ("What the chart is saying")

A 2–3 bullet plain-language block directly beneath an interactive chart, recomputed live with the active inputs — spoon-fed interpretation, with branch variants for qualitatively different regimes (e.g. a leverage variant when f* > 100%). Markup: `.takeaways` > `.takeaways-title` + `<ul id="…">`; JS rebuilds `innerHTML` on every input event. **Rule:** bullets state what the *current* configuration means, never generic chart-reading advice. **When to use:** any chart whose correct reading requires holding ≥2 ideas at once. Canonical instance: How Much Bitcoin? §C; review-driven (June 2026).

### 6.32 SVG hover point-legend (crosshair + readout box)

Pointer-tracking readout for hand-rolled SVG charts: dashed vertical crosshair, dot riding the curve, floating two/three-line box ("at 73% allocation / expected growth ≈ +18.4%/yr / under your assumptions — not a forecast") that flips sides near the right edge. Listeners attach once to the `<svg>`; scale closures are stashed module-level on each render; the hover group is rebuilt per render (innerHTML wipe) and toggled via `visibility`. Touch works via pointer events. **Conditional-language rule:** if the chart shows model outputs, the readout must carry the "under your assumptions" qualifier (third line, `hv-note` class). Canonical instance: How Much Bitcoin? §C.

### 6.33 Tooltip case-guard and right-anchored variant (`tip-end`)

Two hard-won rules for the §6.13 `?`-tooltips. (1) **Case-guard:** `.tip-content` must declare `text-transform: none; letter-spacing: normal; text-align: left;` — tooltips placed inside uppercase contexts (table `th`, block titles) inherit the transform and render ALLCAPS otherwise (caught in How Much Bitcoin review, June 2026). (2) **`tip-end`:** for tooltips in right-aligned table headers near a panel edge, add `tip-content tip-end` (`left: auto; right: -6px; transform: none;`) so the bubble doesn't clip outside the container. Generate via a JS `tipHtml(txt, end)` helper when tables are built client-side.


### 6.34 Page feedback widget (layout-level component)

**When:** automatic — any page with `slug` front matter gets it from `base.njk`; nothing to add per page. Hub/utility pages opt out with `feedback: false`. Never duplicate the include in a page template.

**Files:** `components/page-feedback.njk` (markup + styles + JS, fully self-contained, `.pf-*` class prefix); backend `functions/api/feedback.js`. Copy is canon — see SITE_GUIDE §27 before changing a word; the never-public principle is non-negotiable.

**Behavior:** async POST to `/api/feedback`; success replaces the form with `.pf-done`; failure rewires `.pf-fine` into a mailto fallback. Honeypot input `#pfHp` (absolute-positioned off-screen; do not display:none — some bots skip those). 2,000-char textarea cap enforced client and server side.

**Reusable pattern — Chrome autofill on dark themes:** autofilled inputs get Chrome's pale background unless countered. The working counter (from commit `974224b`):

```css
input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px <field-bg> inset;
  -webkit-text-fill-color: <field-text>;
  caret-color: <field-text>;
  transition: background-color 600000s 0s;
}
```

Use on any future dark-theme form (the inset shadow repaints over the autofill color; the absurd transition delay defers Chrome's repaint indefinitely).

### 6.35 Mirrored control (one state, many representations)

**When:** any page where a primary lever's output section can scroll out of the lever's viewport (the playground principle — POSITIONING_STRATEGY_GUIDE §3.5). Mirror the control beside the distant output so hand and response share a viewport. **When to skip:** outputs already adjacent to their inputs — do not mirror by default; a duplicate control is only justified by the viewport gap.

**The hard rule: two representations, one state — never two states.** Every representation (each `<input>`, each numeric readout) binds to the **same** state key. There is no "which one wins" logic and the representations never talk to each other — they only read shared state.

**Mechanics** (from the allocation drift chart, `bitcoin-allocation-sizing.js`):

- **One sync function** pushes state → every representation, called from the shared update path (and from init / Reset / URL-restore), never from the individual handlers:
  ```js
  function syncAllocControls(from) {
    var a = byId('asAlloc'), aS = byId('asAllocSlider'),
        aM = byId('asAllocMirror'), aMV = byId('asAllocMirrorVal');
    if (from !== 'num'    && a)  a.value  = S.allocPct;   // guard the element the user
    if (from !== 'slider' && aS) aS.value = String(S.allocPct); // is actively editing —
    if (from !== 'mirror' && aM) aM.value = String(S.allocPct); // a range is safe to rewrite,
    if (aMV) aMV.textContent = S.allocPct + '%';          // a text/number input's caret is not
    setSeg('asAllocPresets', S.allocPct);
  }
  ```
- **Handlers only write state + recompute**, then delegate the sync: `input → setAlloc(v, from)` where `setAlloc` sets `S.allocPct`, calls `syncAllocControls(from)`, then `renderAll()`. The `from` token is the sole "don't clobber my caret" guard — it does **not** encode precedence.
- **Drag path is shared**: the mirror's `input` goes through the same in-place-dataset-mutation + `chart.update('none')` path as the origin control; no second render path.

**A11y:** every representation of the same control shares the **same accessible name** (both allocation sliders are `aria-label="Bitcoin allocation"`), so a screen reader announces one control, not two. Keyboard arrows on either must drive the identical update.

**No preset chips on the mirror.** Presets are a starting-point affordance; they stay with the origin control. The mirror exists for continuous play, so it carries only the label + live readout + range input.

**Example markup** (the drift-chart mirror, inserted between the section sub-line and the chart):
```html
<div class="as-drift-lever">
  <div class="as-drift-lever-head">
    <span class="as-drift-lever-label">Bitcoin allocation</span>
    <span class="as-drift-lever-val" id="asAllocMirrorVal">10%</span>
  </div>
  <input type="range" id="asAllocMirror" class="as-range" min="0" max="100" step="1" aria-label="Bitcoin allocation">
</div>
```
Verify Reset and URL-restore visually move **every** representation (they write the one key; the sync pass propagates).

### 6.36 Underwater band / pre-crash level (crash-path charts)

**When:** any chart that drops a crash onto a value path and wants to show how long the portfolio stays below where it was — used on the Retirement **Stress Test** (origin, `underwaterPlugin`) and the allocation **drift chart** (`driftUnderwaterPlugin`). Two pages share this now; if a third needs it, extract to a shared module (tracked in TECH_DEBT alongside the crash-engine extraction).

**Technique:** an **inline Chart.js plugin — no external dependency** (do NOT add `chartjs-plugin-annotation`). Draw in `afterDatasetsDraw` (over the fills) when the sleeves are opaque; `beforeDatasetsDraw` (behind) is fine when the datasets are unfilled lines (Stress Test). Read a span object off the chart instance (`c.$uw` / `c.$sp`) set during render, so drag updates flow through the normal `update('none')` path.

**Tint + tokens (reuse verbatim across pages):**
- Band wash: `rgba(192,57,43,0.09–0.10)` (rose/danger red, very low alpha).
- Pre-crash level line: dashed `[4,3]`, `rgba(236,228,214,0.55)`; label `pre-crash level` in `rgba(236,228,214,0.8)`, `600 10px Inter`, left-anchored just above the line.
- Band label: `#e08a7a`, `700 11px Inter`, centered over the band near the top.

**Span math:** `onset` = the value the year the crash lands (the pre-drop level, since the crash multiplier holds year `cy` at 1.0 and dips over `cy→cy+1`). Scan strictly after `cy`: `recY` = first year the value regains `onset`; if the trough never dips below `onset`, draw nothing; if it never regains `onset` by the horizon, run the band to the end and label `not recovered within your horizon`. Grammar via `yearsWord(n)` (`n + (n===1?' year':' years')`).

```js
var underwaterPlugin = { id: 'asUnderwater', afterDatasetsDraw: function (c) {
  var sp = c.$uw; if (!sp) return;
  var xS = c.scales.x, yS = c.scales.y, ctx = c.ctx; ctx.save();
  var x0 = Math.max(xS.getPixelForValue(sp.onsetY), xS.left), x1 = Math.min(xS.getPixelForValue(sp.endY), xS.right);
  if (x1 > x0) { ctx.fillStyle = 'rgba(192,57,43,0.10)'; ctx.fillRect(x0, yS.top, x1 - x0, yS.bottom - yS.top); }
  var yp = yS.getPixelForValue(sp.onset); /* dashed pre-crash line + labels … */ ctx.restore();
}};
```

**Pair with a pinned axis** (see the drift chart): while the crash view is open, pin `y.max` to a nice ceiling of the *smooth* path's max so recovery/timing changes are apples-to-apples; recompute only on assumption change, not on crash-year/recovery drag.

## 7. Mobile considerations

- All `clamp()` sizes have been chosen so the floor (mobile) is readable on a 375px viewport.
- SVG visualizations need explicit mobile breakpoints — text inside the SVG does not auto-scale to a readable floor. See `Synthesis` component circles (currently broken) as a counterexample.
- Tabs use `overflow-x: auto` for horizontal scroll on narrow viewports.
- Tables in §4 of pages with comparison grids show a "Swipe to see all columns →" affordance on mobile.
- Mobile nav: hamburger toggle, full-screen overlay, click-outside to close, Escape to close.
- **Chart.js tooltips on narrow viewports.** Default font and padding are sized for desktop. On a 375px viewport the chart's inner plot area is ~150px wide, and a default-sized tooltip card with 6+ dataset rows covers most of the chart. Pages with multi-dataset tooltips should branch on `window.matchMedia('(max-width: 480px)').matches` at chart-init and apply: `titleFont: { size: 11 }`, `bodyFont: { size: 11 }`, `padding: 6`, `boxPadding: 3`. Also shorten labels that carry parenthetical detail already visible in the legend (e.g. "Floor (0.42× trend)" → "Floor"). For sparse marker-only datasets (sell/rebuy ▼/▲ triggers, etc.), give those datasets a tighter pixel-tolerance in the interaction mode so they don't show in the tooltip when the cursor is years away — on a narrow chart a generic 15-pixel tolerance can span 2–3 years and pulls in markers the user already sees on the chart itself. See Disciplined Rebalancing channel viz `xPerDataset` mode for the canonical implementation.

---

## 8. What this guide intentionally doesn't cover

- **Voice and content** — see `SITE_GUIDE.md` (the editorial register, "elegiac seriousness", argument structure, etc.). Exception: two cross-cutting *house-style* conventions (don't announce your own honesty; prefer commas/hyphens over em-dashes) are codified in **§10** below, because they govern phrasing and punctuation on every page and every Claude Code build.
- **Page-level information architecture** — what sections each exploration page must have, how charts are framed, etc. Belongs in a future `PAGE_PATTERNS.md` if it becomes worth codifying.
- **Animation and motion design** — site is largely static. If we add motion later, this guide gets a §9.
- **Specific chart styling** — chart-specific decisions (colors of BTC vs S&P series, axis treatments, etc.) are page-specific. Codify if patterns emerge.

---

## 9. How to use this guide

**When building a new page:**
1. Pick the page-title pattern from §2.1.
2. Use the component recipes in §6 wherever possible — don't reinvent.
3. Stay inside the type scale §2 and color tokens §3.
4. Run the anti-pattern checklist §5 before shipping.

**When editing an existing page:**
- If the page contradicts this guide and the contradiction looks deliberate, flag it for discussion before changing it. Some pages may have intentional reasons to deviate.
- If the page contradicts this guide and looks like accidental drift, fix it.

**When proposing a change to this guide:**
- Note the date and reason at the top.
- The bar for adding a fifth typeface, a new color token, or a new pattern recipe is high. The bar for tightening a rule (e.g., "Cormorant italic floor is now 1.7rem instead of 1.5rem") is lower.

---

## 10. Voice & punctuation conventions (house style)

_Added 2026-07, from the Bull & Bear Cycles review. These are durable house style for all pages and all Claude Code builds. Voice more broadly lives in `SITE_GUIDE.md`; these two live here because they are mechanical, cross-cutting, and easy to check._

### 10.1 Describe, don't announce your honesty

The site's credibility comes from *being* honest, not from *saying* it is honest. Do not write sentences whose job is to reassure the reader that the content is candid, balanced, or non-promotional. Show the caveat; never narrate that you are showing it. Self-referential honesty language is both tiresome and self-undermining — a page that keeps insisting on its own integrity reads as less trustworthy, not more, and it is a tell of AI-generated copy.

**Avoid (self-referential / defensive):**
- "The honesty is the point."
- "If a claim here has a caveat, the caveat is printed next to it, at the same size."
- "This page does not try to sell you… or scare you…"
- "grades its own evidence, out loud"
- "documented, and refused" / "the counter-case is cited as prominently as the thesis"
- "This is arithmetic, not narrative." / "a plausible story, but…"
- Any framing where we tell the reader how trustworthy or balanced we are being.

**Prefer:** state the fact and its caveat plainly, and stop. Let the balance be visible in the content itself.
- Instead of *"The honesty is the point; we refuse to guess the bottom"* → *"We can't identify the bottom, but we can describe the dynamics at play."*
- Instead of *"Even Bitcoin-favourable analysts model it, and we cite them honestly"* → *"Even Bitcoin-favourable analysts model it: VanEck's base case is about 15%…"*

The target voice is **frank, direct, and dispassionately descriptive** — the same plain register used in working conversation, not a defensive or reassuring one. Describe Bitcoin's phenomena as they are; the reader draws their own conclusions. Words that flag AI/defensive authorship and should be cut or replaced unless genuinely needed: "honest/honestly," "to be clear," "the truth is," "let's be honest," and similar throat-clearing.

### 10.2 Prefer commas and simple hyphens over em-dashes

The long em-dash ("—"), especially in pairs bracketing a clause, is a tell of AI-generated text and does not match JM's own writing. Default to a **comma** or a **simple hyphen ("-")** where either works. Reserve the em-dash for the rare case where a comma genuinely would not carry the break.

- Avoid: *"the falls — they are the up-swing and the down-swing — of one oscillation"*
- Prefer: *"the falls, the up-swing and the down-swing of one oscillation"*
- Avoid stacking multiple em-dash asides in a single paragraph; if a paragraph has more than one, rewrite at least one with a comma or a full stop.

This is a house-style preference, not a grammar rule; apply it in new copy and when editing existing pages, without contorting a sentence to avoid a dash that is genuinely the clearest choice.

---

## Appendix A: Survey findings (2026-04-26)

Initial draft was based on a survey of 7 pages with John McCabe noting issues. Anti-patterns §5 are direct outputs of the survey. Pages reviewed:

1. Homepage — italic-Cormorant subtitle fails (anti-pattern 1)
2. What Money Has To Be — clean, canonical example
3. What Bitcoin Is — Inter Bold Orange title outlier (anti-pattern 4)
4. The Bitcoin Synthesis — Inter Bold Orange title outlier (anti-pattern 4); SVG mobile floor issue (anti-pattern 10)
5. The Bitcoin Migration — italic-Cormorant subtitle fails; canonical essay-cover title pattern; introduces EB Garamond as essay-body face
6. The Bitcoin Trilemma — undersized title; italic-Cormorant subtitle fails; wide-tracked uppercase Cormorant (anti-pattern 3); peer-label divergence on triangle edges (anti-pattern 5); citation lost during footer normalization (anti-pattern 6, fixed)
7. The Half-Life — italic-Cormorant subtitle fails; tab title weight too heavy (anti-pattern 2); two-tone title pattern surfaced; revealed DM Sans usage on Real Estate (anti-pattern 7) and tab inconsistency (anti-pattern 8)

The survey did not cover Money Trees, The Bitcoin Fixed Share, The Melting Ice Cube, Is Bitcoin a Bubble?, BTC vs. Real Estate, Bitcoin & The Power Law, The Bitcoin Horizon, About — but the patterns identified are likely sufficient to extrapolate. The remaining pages will be checked against this guide during the build refactor.
