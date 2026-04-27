# STYLE_GUIDE.md

The visual and technical style guide for **Last Coin Standing**. Companion to `SITE_GUIDE.md` (which covers voice, content, and editorial register).

This guide is the spec the build refactor targets — when in doubt, this document is the authority. If something on a page contradicts this guide, the page is wrong, not the guide.

Last updated: 2026-04-26 (initial draft from survey of 7 pages)

---

## 1. Type system

The site uses **four typefaces**. Each has one job. Don't introduce a fifth without revising this guide.

| Family | Role | Where it appears |
|---|---|---|
| **Cormorant Garamond** | Display | h1, h2, large pull quotes, drop caps, inline italic emphasis at display sizes, "section closer" flourish at 1.35rem |
| **EB Garamond** | Essay body | Long-form prose paragraphs, TOC links, key concepts — **only on cream/parchment background** |
| **Source Serif** (italic) | Small-size italic flourish | OG card subtitles, page hero subtitles where an italic serif is wanted |
| **Inter** | Everything else | Body on dark backgrounds, all UI labels, captions, page subtitles where no italic flourish is wanted, tabs, buttons, metadata |

### Anti-pattern: DM Sans

DM Sans currently appears only on the BTC vs. Real Estate tabs. It does the same job as Inter. **Consolidate all DM Sans use to Inter.** Don't reintroduce.

### CSS variables

```css
--font-display: 'Cormorant Garamond', serif;
--font-essay: 'EB Garamond', serif;
--font-flourish: 'Source Serif 4', serif;  /* always paired with font-style: italic */
--font-body: 'Inter', sans-serif;
```

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

The canonical page-content container is `max-width: 960px`. This is the value used by Power Law, Half-Life, Fixed Pie, and Melting Ice Cube. Up to ~1100px is acceptable for pages with wider visual content (charts, two-column grids), but stay within 960–1100px for narrative pages — content that's noticeably wider than 1100px makes line-lengths uncomfortable; content noticeably narrower than 960px wastes desktop real estate and feels visually inconsistent next to the canonical pages.

**Do not apply paragraph-level max-width constraints.** Let prose fill the container width naturally — this prevents the visual mismatch between narrow text floating inside a wider container with empty space on either side.

The exception: page hero subtitles can have `max-width: 680px` to keep them visually balanced under a centered title. Apply this only to hero subtitles, not to body prose.

---

## 5. Anti-patterns (what NOT to do)

These have all been observed on the site and need fixing.

1. **Cormorant italic at <1.5rem on dark backgrounds.** The typeface's thin strokes lose detail at small sizes. → Use Source Serif italic, OR Inter, OR bump size to ≥1.5rem.
2. **Cormorant at <1.3rem with weight ≥600.** Strokes thicken and read muddy. → Bump size, drop weight to 500, or switch to Inter.
3. **Wide-tracked uppercase Cormorant.** Fights the typeface's strengths. → Use mixed-case Cormorant, OR use Inter caps with tracking.
4. **Inter Bold Orange as page title.** Outlier on What Bitcoin Is and The Bitcoin Synthesis only. → Use canonical Cormorant per §2.1.
5. **Peer labels with diverging typography.** When three items are conceptually equal (e.g., the Trilemma triangle edges), they should share typography and differ by *one variable* (typically color). → Unify type; vary by color or weight, not by case+weight+style+font all at once.
6. **Editorial attributions inside the shared footer.** Page-specific citations (Vitalik Buterin on Trilemma, data sources on Real Estate) are *content*, not chrome. → Use a `.page-attribution` content section above the canonical footer (see §6.5).
7. **Multiple sans-serif families.** DM Sans on Real Estate. → Consolidate to Inter.
8. **Inconsistent tab styling across pages.** → Use the canonical tab component (§6.2).
9. **Low-contrast text below 0.5 opacity.** Migration cover subtitle hits this. → Keep text-on-dark above 0.6 opacity for body text; mini-labels can go to 0.5 if size is ≥0.7rem.
10. **SVG-rendered text below 14px effective size on mobile.** Synthesis component circles hit this. → Add mobile breakpoint that bumps SVG container or text size.
11. **Paragraph-level `max-width` constraints that fight the page container.** A global `p { max-width: 68ch }` (or similar) makes body text float as a narrow column inside a wider container, leaving visible empty space on the right and creating visual inconsistency vs. canonical pages where prose fills the container. → Remove the global `p` constraint; let prose fill its parent. Per-element constraints on specific cards (intro blocks, callouts, pull-quotes) are still fine — the anti-pattern is the *global* `p` rule.

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
