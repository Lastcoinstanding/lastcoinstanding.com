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
| Body paragraph (dark bg) | `1.05rem` | 400 | line-height 1.6, max-width ~680px |
| Page subtitle (dark bg) | `clamp(1rem, 2vw, 1.2rem)` | 400 | color text-dim |
| UI label, button text | `0.85rem` | 500 | |
| Tab label | `0.95–1rem` | 500 | see §6.2 |
| Caps mini-label | `0.7rem` | 500 | letter-spacing 0.22em, uppercase |
| Caption / metadata | `0.78rem` | 400 | color text-dim or text-faint |
| Smallest label | `0.65rem` | 500 | letter-spacing 0.2em, uppercase — tab numbering, etc. |

**Mobile floor:** never render UI text below `0.7rem` on a 375px viewport. SVG-rendered interactive labels (Synthesis component circles, etc.) must remain ≥14px effective rendered size at narrow viewports.

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

The site uses two main width tiers, plus a documented mixed-content pattern.

**Editorial tier — 960px (canonical).** Used by Power Law, Half-Life, Fixed Pie, Melting Ice Cube, Horizon, Migration, Money Trees, About, Index, and What Money Has To Be. The reading-prose width that produces comfortable line-lengths for sustained text. This is the default for any new page that's primarily Inter body prose; deviating wider degrades narrative readability.

**System-diagrammatic tier — ~1140px.** Used by Synthesis (1140px), What Bitcoin Is (1140px), and Trilemma (1080px, marginally tighter). These pages lead with a centered SVG diagram or interactive visual that benefits from horizontal stage-room; the surrounding explanation panels position around the diagram, not on a reading-prose grid. The tier is not used for body prose. New pages of this character should target 1140px to harmonize with the existing two; 1080px is acceptable as a close-but-distinct value if the diagram's natural extent calls for it.

**Mixed-content pattern — wide page + constrained essay.** Used by Not-a-Bubble (1152px page, 44rem ≈ 704px essay block). Pattern: hero chart needs the page width, but a closing essay needs prose-grade line-length. Solution is to set the page wide enough for the chart and apply a narrower `max-width` to the essay block specifically (NOT to individual paragraphs). This is the only sanctioned use of an inner max-width on prose; the constraint must apply to the essay block as a whole.

**Do not apply paragraph-level max-width constraints in single-tier pages.** On editorial-tier pages, let prose fill the 960px container naturally — paragraph-level constraints create the "narrow text floating in a wider container" mismatch this rule is designed to prevent. The mixed-content pattern above is the documented exception, and it constrains the essay *block*, not individual paragraphs within it.

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
11. **Paragraph-level `max-width` constraints that fight the page container.** A global `p { max-width: 68ch }` (or similar) makes body text float as a narrow column inside a wider container, leaving visible empty space on the right and creating visual inconsistency vs. canonical pages where prose fills the container. → Remove the global `p` constraint; let prose fill its parent. Per-element constraints on specific cards (intro blocks, callouts, pull-quotes) are still fine — the anti-pattern is the *global* `p` rule.

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

**Schema:** every entry in `_data/explorations.json` has these fields:

```json
{
  "slug": "the-half-life",
  "title": "The Half-Life",
  "category": "arguments",
  "interactive": true,
  "is_calculator": false
}
```

- `category` (string, required): one of `foundations`, `arguments`, `numbers`. Determines which dropdown the entry appears under.
- `interactive` (boolean, required): `true` if the page has interactive UI elements (input fields, sliders, button-driven calculations, scrubbable charts). Items with `interactive: true` get a small amber dot marker (•) next to their nav link, marketing the site's character as an interactive tool collection rather than flat essays. Marker class is `.nav-interactive-marker`. Each dropdown menu shows a small italic legend at its bottom (`.nav-dropdown-legend`) reading *"• indicates pages with interactive tools"* so the meaning is discoverable in context. The mobile overlay shows a single legend at the bottom (`.mobile-legend`).
- `is_calculator` (boolean, required): `true` ONLY for personal-decision tools — calculators that take inputs about the user's life (their home price, their bitcoin holdings, their retirement age, etc.) and help them make or evaluate a real-life decision. By this stricter definition: BvRE, Power Law (forward tab), and the future retirement calculator are calculators. Half-Life, MIC, Fixed Share, Horizon are interactive demonstrations or projections without a personal decision-support frame; they get `is_calculator: false`. The Calculators constellation page reads from this flag to populate its content.

**Active-state behavior:** when the user is on a page in bucket X, the bucket-X dropdown button gets the active styling (amber color, amber-tint background, font-weight 600). Other dropdowns stay default. The link to the current page within its dropdown also gets the active styling. About is its own top-level link with separate active handling. This is implemented via a single `currentCat` lookup at the top of the nav block in `base.njk` that finds the current page's category from the explorations data.

**Footer:** mirrors the bucket structure. Four columns on desktop (Foundations, The Arguments, The Numbers, Site), two on mobile. Each column has a `.footer-nav-label` header and the relevant entries below. The Site column has just About for now; future site-utility pages (e.g. methodology, FAQ) would join it.

**Mobile overlay:** the hamburger overlay shows three labeled sections plus About at the bottom. Section labels use `.mobile-section-label` (small caps, dim color) to separate without making each item heavier.

**Multi-dropdown JS:** the canonical nav JS in `base.njk` was updated to handle multiple dropdowns. Each dropdown's button toggles its own dropdown (closing the others first); click-outside closes all. The previous single-dropdown `querySelector` was replaced with iteration over `querySelectorAll('.nav-dropdown')`. Hover-open still works on desktop via CSS; click-toggle is for mobile/touch.

**Adding a new page:** set `category`, `interactive`, and `is_calculator` in the explorations data. The page automatically appears in the right dropdown, with the right marker, and is automatically picked up by the constellation page if applicable. No nav-rendering changes required.

---

## 7. Mobile considerations

- All `clamp()` sizes have been chosen so the floor (mobile) is readable on a 375px viewport.
- SVG visualizations need explicit mobile breakpoints — text inside the SVG does not auto-scale to a readable floor. See `Synthesis` component circles (currently broken) as a counterexample.
- Tabs use `overflow-x: auto` for horizontal scroll on narrow viewports.
- Tables in §4 of pages with comparison grids show a "Swipe to see all columns →" affordance on mobile.
- Mobile nav: hamburger toggle, full-screen overlay, click-outside to close, Escape to close.

---

## 8. What this guide intentionally doesn't cover

- **Voice and content** — see `SITE_GUIDE.md` (the editorial register, "elegiac seriousness", argument structure, etc.)
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
