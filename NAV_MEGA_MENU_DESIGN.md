# The Numbers Mega-Menu — Design Document

> **STATUS: DESIGN DOC ONLY — awaiting JM approval. No build until this doc is
> approved.** (2026-08-12.) The build is a separate prompt; this document is the
> thing under review.

_Created 2026-08-12. Trigger: **The Numbers** dropdown has grown to **26 items
across 4 subgroups** (one column, `overflow-y: auto`, roughly half of it below
the fold at a common laptop height). It has outgrown the single-column pattern.
House workflow: this doc → JM review → Claude Code build prompt → JM review on
preview → merge._

_JM rulings already taken (recorded here, carried into the design):_
- _**Top-level labels UNCHANGED.** The **Foundations / The Arguments / The
  Numbers** triad stays. The ruling: the descriptive **column headers** inside
  the panel resolve the "what does 'The Numbers' mean" ambiguity; renames are
  revisited **only with evidence**, not pre-emptively._
- _**Foundations and The Arguments keep their current simple dropdowns** — they
  fit on one screen (6 and 9 items). **Only The Numbers becomes a mega-panel.**_
- _**Badges preserved** (NEW / UPDATED) and the interactive-tool marker preserved._
- _**Mobile:** an accordion with the same groups._

---

## 1. The problem (why now)

The Numbers dropdown renders every `category: "numbers"` page as one vertical
list, grouped by four non-clickable sub-headers. The list is now long enough
that the menu sets `max-height: calc(100vh - 72px); overflow-y: auto` and
**scrolls** — the CSS already concedes the overflow. On a 1366×768 laptop the
fold lands around the eighth or ninth item, so the whole **Positioning &
Strategy** and **Living on Bitcoin** groups sit below it, reachable only by
scrolling inside a floating panel (a notoriously easy target to lose).

| Dropdown | Items | Subgroups | Fits one screen? |
|---|---:|---|---|
| Foundations | 6 | — (flat) | ✅ yes |
| The Arguments | 9 | 4 | ✅ yes |
| **The Numbers** | **26** | **4** | ❌ **scrolls; ~half below fold** |

A single 240px-wide column cannot show 26 items plus 4 headers (~30 rows,
~900px tall) inside an ~720px viewport. The fix is to stop going down and start
going across: a **multi-column mega-panel** where each existing subgroup is a
labeled column, so the entire IA of The Numbers is visible **at a glance**,
without scrolling, at desktop widths.

---

## 2. Research pass (cited)

Five authoritative sources (NN/g ×2, W3C WAI-ARIA APG, Adrian Roselli, plus the
APG Menu-pattern rationale). Conclusions, one page:

| Question | Conclusion |
|---|---|
| **Hover vs click** | **Click/tap is the safer cross-device default.** Hover is acceptable on desktop *only* with an intent delay (~0.3–0.5s open; don't close on brief cursor drift). Hover alone fails on touch and is weaker for a11y. |
| **Keyboard + ARIA** | Use the **Disclosure pattern** — a `<button>` with `aria-expanded` + `aria-controls` revealing a plain `<ul>` of links. **Not** `role="menu"`/`menuitem` (that's for application command menus and demands composite focus management + typeahead that AT users don't expect on site nav). |
| **Touch** | Separate the concerns: a **real link** navigates, a **separate disclosure button** opens the panel — so one element never has to both navigate and toggle. (For us the trigger has no landing page, so it is *purely* a disclosure button — the clean case.) |
| **When a mega-panel wins** | Once a single column would need **scrolling** to reveal all options. A multi-column panel with labeled group headings shows many IA levels at once. No source gives a hard item count — the rule is functional (scrolling), not numeric. |
| **CSS-only vs minimal-JS** | CSS-only `:hover`/`:focus-within` **cannot** do Escape-to-close, expose `aria-expanded`, or detect click/tap-outside. **Minimal JS is required** to meet keyboard / screen-reader / touch expectations. |

**Load-bearing evidence:**
- Click/tap = explicit intent; reveal within ~0.1s and keep open until the user
  dismisses. Hover is ambiguous and needs an intent delay to avoid accidental
  opens — and **don't** close a mega-menu just because the cursor drifts off.
  ([Timing Guidelines for Exposing Hidden Content — NN/g](https://www.nngroup.com/articles/timing-exposing-content/);
  [Mega Menus Work Well — NN/g](https://www.nngroup.com/articles/mega-menus-work-well/))
- "This implementation of site navigation does **not** use the `menu` role
  because it does not provide the complex functionality [composite focus
  management, first-character typeahead] that assistive technologies expect."
  Buttons carry `aria-expanded` (hidden/visible) + `aria-controls` (the panel's
  IDREF).
  ([Disclosure Navigation Menu — W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/))
- Keyboard behaviors (APG disclosure): Enter/Space toggles; **Escape closes the
  open dropdown and returns focus to its controlling button**; Tab moves among
  buttons and into the revealed links (and out); arrow-key navigation is
  **optional** (required only for the full menubar pattern).
  ([W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/))
- Keep the **state on a `<button>`, not on a link** — mixing "navigate" and
  "disclose" on one element confuses screen-reader users; minimal JS buys exactly
  the three things CSS can't: toggle `aria-expanded`, Escape-to-close, and
  click/tap-outside.
  ([Link + Disclosure Widget Navigation — Adrian Roselli](https://adrianroselli.com/2019/06/link-disclosure-widget-navigation.html))
- A plain single-column dropdown "hides most of the user's options" and forces
  scrolling that conceals the top items; a mega-menu shows the IA at a glance —
  which is why it suits large, feature-rich sites. Group columns under labeled
  headings. ([Mega Menus Work Well — NN/g](https://www.nngroup.com/articles/mega-menus-work-well/))

**Caveats / where sources differ:** NN/g's mega-menu piece treats hover, click,
and tap as all "viable" and concentrates on hover *timing*; its own timing
article and Roselli lean click/tap as less error-prone. Net: **click/tap
primary, hover optional-with-delay on desktop.** Touch is the least-specified
area across all sources — the link/button split is the practical resolution, and
click-outside dismissal on touch must be added in JS (it is not free).

**Sources**
1. [Mega Menus Work Well for Site Navigation — NN/g](https://www.nngroup.com/articles/mega-menus-work-well/)
2. [Timing Guidelines for Exposing Hidden Content — NN/g](https://www.nngroup.com/articles/timing-exposing-content/)
3. [Disclosure Navigation Menu Example — W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)
4. [Link + Disclosure Widget Navigation — Adrian Roselli](https://adrianroselli.com/2019/06/link-disclosure-widget-navigation.html)
5. [Menu & Menubar Pattern — W3C WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/menu/) (corroborates why nav uses disclosure, not `menu`)

---

## 3. Current-state inventory

### 3.1 The nav data structure

The nav is **fully data-driven** from `src/_data/explorations.json`. Each entry
carries `slug`, `title`, `category`, an optional `group`, and `interactive`.
`base.njk` renders three dropdowns by filtering on `category`
(`foundations` / `arguments` / `numbers`); `hub` pages (Start Here, Dashboard,
Gallery) are excluded from dropdowns. Sub-header order inside a dropdown is
controlled by two hard-coded arrays in `base.njk`:

```njk
{%- set numbersGroups   = ["Models & Trends", "Bitcoin vs. Other Assets",
                           "Positioning & Strategy", "Living on Bitcoin"] -%}
{%- set argumentsGroups = ["Why Fiat Fails", "Why Bitcoin Endures",
                           "Objections, Answered", "Holding & Spending"] -%}
```

Item order **within** a group follows `explorations.json` array order.
**Footgun (documented, SITE_GUIDE §30):** a page whose `group` string does not
match one of these array strings **exactly** silently drops out of the dropdown.
Any redesign must preserve this contract or the item count regresses invisibly.

### 3.2 The Numbers — full item inventory (26 items, 4 groups)

Every Numbers page is an interactive tool (all carry the `•` marker). Titles as
rendered:

| Column (group) | # | Items (in array order) |
|---|---:|---|
| **Models & Trends** | 6 | Bitcoin & The Power Law · Bitcoin & Metcalfe's Law · The Bitcoin Doubling Ladder · The Bitcoin Heatmap · Bitcoin Bull & Bear Cycles · Discount, or Premium? |
| **Bitcoin vs. Other Assets** | 3 | Bitcoin vs. The Stock Market · BTC vs. Real Estate · BTC vs. Rental Property |
| **Positioning & Strategy** | 12 | Lump Sum or Ladder In? · Your Bitcoin Deployment Plan · Wait, or Deploy Now? · The Bitcoin Retirement · The Bitcoin Retirement Stress Test · Bitcoin Portfolio Allocation · Disciplined Rebalancing · The Bitcoin Hurdle Rate · How Much Bitcoin? · How Much Cash? · What Daily Conviction Bought · The Bitcoin Horizon |
| **Living on Bitcoin** | 5 | Borrowing Against Your Stack · Bitcoin-Backed Mortgages · Living on Bitcoin · Bitcoin and Fixed Income · The STRC Mechanism |

**Positioning & Strategy (12)** is the tall column and the main driver of the
overflow. The other two dropdowns for context:

- **Foundations (6, flat, no groups):** What Money Has To Be · What Money Is For · What Bitcoin Is · The Bitcoin Synthesis · Bitcoin Defined · The Bitcoin Trilemma.
- **The Arguments (9, 4 groups):** *Why Fiat Fails* (The Half-Life, Money Trees, The Melting Ice Cube, The Bitcoin Fixed Share) · *Why Bitcoin Endures* (The Bitcoin Migration) · *Objections, Answered* (Is Bitcoin a Bubble?, Risks to Bitcoin) · *Holding & Spending* (Paper Bitcoin vs. Real Bitcoin, Bitcoin Spend and Replace).

### 3.3 Badge mechanics (NEW / UPDATED)

Build-time, one source of truth. `src/_data/freshness.js` reads
`src/_data/updates.json` and returns a `{ slug: 'new' | 'updated' }` map on
every Eleventy build. Rules (windows from the build clock):

- **NEW** — the slug's *first* updates.json entry is within 30 days.
- **UPDATED** — the slug's *latest* entry is within 30 days and it is not NEW
  (**NEW suppresses UPDATED**).
- otherwise no badge (key omitted).

`base.njk` renders it through one macro reused across every nav surface:
`{{ freshnessBadge(freshness[e.slug]) }}` → `<span class="nav-badge nav-badge-new">New</span>`
or `nav-badge-updated`. Badges **self-expire** at the first deploy after the
window closes; nothing is hand-placed. **The mega-panel must call the identical
macro per item** — no new badge path.

### 3.4 Desktop dropdown mechanics today

- Structure: `.nav-dropdown` (relative) › trigger `.nav-dropdown-btn`
  (**an `<a href="#">`**, label + `▾`) › `.nav-dropdown-menu` (absolute,
  `display:none`).
- **Activation is hover *and* click:** CSS `.nav-dropdown:hover .nav-dropdown-menu`
  opens on hover with **no intent delay**; the nav JS also toggles an `.open`
  class on click and closes the others. Panel is `min-width:240px`,
  `left:50%; transform:translateX(-50%)`, `max-height:calc(100vh-72px)`,
  `overflow-y:auto` (the scroll).
- Group headers: `.nav-dropdown-group-label` — muted caps, `pointer-events:none`
  (decorative, non-clickable).
- Each panel ends with a `.nav-dropdown-legend` ("• indicates pages with
  interactive tools").
- Active state: the current page's link gets `.active`; its parent dropdown gets
  `.active-bucket` and the trigger gets `.active` (amber).

### 3.5 Mobile nav today

- A full-screen fixed overlay `#mobileOverlay` (`.mobile-overlay`, `display:none`
  → `.show` = flex), toggled by the `.hamburger` button, `body` scroll locked.
- It renders **every item, fully expanded**, as one long vertical scroll:
  `.mobile-section-label` per category, `.mobile-section-sublabel` per group,
  then all links. There is **no accordion** — Foundations + all 9 Arguments +
  all 26 Numbers are laid out at once (~45 tappable rows).
- Close: tapping a link, tapping the backdrop, or Escape.

### 3.6 Accessibility gaps in the current nav (baseline to fix)

The nav already ships minimal JS (click-toggle, click-outside, Escape). What it
is missing, measured against the APG disclosure pattern:

1. **Trigger is `<a href="#">`, not a `<button>`** — no `aria-expanded`, no
   `aria-controls`, no `aria-haspopup`. Screen-reader users get no state.
2. **Escape closes but does not return focus** to the trigger (APG requires the
   return).
3. **Hover-open has no intent delay** — accidental opens on cursor pass-through
   (worse for a wide mega-panel than for a slim list).
4. **Hamburger** has `aria-label="Menu"` but no `aria-expanded` /
   `aria-controls`.
5. No `prefers-reduced-motion` consideration on menu reveal (currently there is
   no transition, so this is only relevant if the redesign adds one).

These are **not caused by this project**, but the redesign is the right moment
to close them, and doing so is nearly free because the JS already exists.

---

## 4. Proposed design

### 4.1 Desktop — The Numbers opens a multi-column mega-panel

The Numbers trigger opens a panel laid out as **four labeled columns, one per
existing subgroup**, in `numbersGroups` order:

```
┌───────────────────────────────────────────────────────────────────────┐
│  MODELS & TRENDS   BITCOIN VS. OTHER   POSITIONING & STRATEGY   LIVING  │
│  Power Law         Stock Market        Lump Sum or Ladder In?   Borrow… │
│  Metcalfe's Law    Real Estate         Deployment Plan          Mortg…  │
│  Doubling Ladder   Rental Property     Wait, or Deploy Now?      Living… │
│  Heatmap                               Retirement                Fixed… │
│  Bull & Bear                           Retirement Stress Test    STRC   │
│  Discount/Premium?                     Portfolio Allocation             │
│                                        Disciplined Rebalancing          │
│                                        Hurdle Rate                      │
│                                        How Much Bitcoin?                │
│                                        How Much Cash?                   │
│                                        What Daily Conviction Bought     │
│                                        The Bitcoin Horizon              │
│  • indicates pages with interactive tools                              │
└───────────────────────────────────────────────────────────────────────┘
```

- **All 26 items visible without scroll at 1280px.** The tallest column
  (Positioning & Strategy, 12 rows) governs panel height:
  12 rows × ~34px + column header ~28px + panel padding ~24px ≈ **~460px**.
  Panel top sits at the nav's bottom (~48px), so the panel bottom ≈ **~508px**,
  well inside a 720px (or 800px) viewport. **No `overflow-y` scroll on the
  panel** — that's the point.
- **Columns are the groups.** `.nav-dropdown-group-label` stops being a stacked
  row header and becomes a **column header** at the top of each column. The
  visual weight and copy stay the same (small letterspaced muted caps).
- **Width & positioning.** Four columns at a fixed ~230px each + gaps ≈ **~1000px**.
  A 1000px panel cannot use the current per-button `left:50%; translateX(-50%)`
  (it would overflow the right edge, since the Numbers trigger sits right-of-center).
  The mega-panel instead **right-aligns to the nav** (or centers in a
  viewport-clamped container: `width: min(1040px, 100vw - 32px)`), so it never
  bleeds past the viewport. This is the one genuinely new layout rule.
- **Long titles wrap, they don't nowrap.** "The Bitcoin Retirement Stress Test"
  exceeds a 230px column; inside the panel we drop `white-space:nowrap` and let a
  title wrap to a second line (row height auto). This keeps the panel ≤~1040px
  instead of forcing very wide columns.
- **Badges + interactive marker preserved** exactly — same `freshnessBadge()`
  macro, same `.nav-interactive-marker` bullet, same per-panel legend (now spanning
  the full panel width beneath the columns).
- **Active state preserved** — the current page's link keeps `.active`; the
  Numbers trigger keeps `.active` / `.active-bucket`.
- **Foundations and The Arguments are untouched** — they keep the current
  single-column dropdown (they fit). Only their **trigger semantics** change with
  the shared a11y fix in §4.4 (button + `aria-expanded`), because all three
  triggers run through the same markup and JS.

**Open layout sub-question (for JM, §6):** the 12-tall Positioning column is
visually unbalanced against a 3-tall neighbor. Options: (a) accept it — unequal
column heights are normal for mega-menus and the IA (group = column) stays
honest [**recommended**]; (b) split Positioning & Strategy into two stacked
sub-columns under one header. (a) keeps the mental model 1:1 with the site's
existing grouping; (b) balances the rectangle at the cost of a two-column group.

### 4.2 The label-ambiguity ruling (no rename)

Per JM's ruling, the **top-level triad stays** (Foundations / The Arguments /
The Numbers). The concern that "The Numbers" is opaque is answered structurally:
the panel's **four column headers** (Models & Trends, Bitcoin vs. Other Assets,
Positioning & Strategy, Living on Bitcoin) name the content the moment the panel
opens. Renames are revisited **only with evidence** (analytics or reader
feedback), not designed in now. This doc treats the labels as fixed.

### 4.3 Mobile — accordion with the same groups

Replace the fully-expanded overlay with an **accordion**:

- Each **category** (Foundations / The Arguments / The Numbers) becomes a
  collapsible section with a header row that toggles its body. **Collapsed by
  default**, except the section containing the **current page**, which starts
  **expanded** (so a reader deep in The Numbers lands oriented).
- Inside The Numbers, the four **group sub-labels remain** as in-section headers
  (the same `.mobile-section-sublabel`); the accordion collapses at the
  *category* level, not per-group, to keep taps shallow.
- The Gallery / Calculators / About stay as flat top-level links below the
  accordions.
- This turns ~45 rows of initial scroll into **three headers + one expanded
  section**, which is the whole point on a phone.

### 4.4 CSS-only vs minimal-JS — recommendation

**Recommendation: minimal-JS disclosure (enhance the existing nav script).**
Not CSS-only.

Per the research, a CSS-only menu (`:hover` / `:focus-within`, or the checkbox
hack) **cannot**: fire Escape-to-close, expose `aria-expanded` to a screen
reader, detect click/tap-outside, or behave correctly on touch. We **already
ship** the nav JS that does click-toggle / click-outside / Escape, so the
incremental cost of doing this right is small and the a11y win is real. Concrete
plan:

- **Convert all three triggers** `<a href="#">…▾</a>` → **`<button type="button"
  aria-expanded="false" aria-controls="nav-panel-{cat}">`**. (They never
  navigated — there is no "Numbers" landing page — so a button is strictly more
  correct and removes the `href="#"`.)
- Give each panel an `id` matching `aria-controls`. The panel stays a **plain
  list of links** — **no `role="menu"`** (APG: nav uses disclosure, not menu).
- JS keeps `aria-expanded` in sync with the `.open` class (both toggle together).
- **Escape** closes the open panel **and returns focus to its trigger button**
  (new — closes the current gap). `focusout` off the whole dropdown also closes
  it (keyboard Tab-away).
- **Activation:** click/Enter/Space is the load-bearing, accessible path. Retain
  hover-open on desktop pointers **with a ~300ms intent delay** on open and a
  forgiving close (don't close on brief drift) — or drop hover entirely and go
  click-only. **Recommendation:** keep hover for continuity but gate it with the
  delay; the keyboard/click path is identical regardless, so a11y does not depend
  on hover.
- **Hamburger** gains `aria-expanded` + `aria-controls="mobileOverlay"`; the
  mobile accordion headers are `<button aria-expanded>` too.
- Any expand/collapse transition respects `prefers-reduced-motion`.

**A11y implications, stated:** this moves the nav onto the APG **disclosure**
pattern end to end — correct roles, state exposed to AT, Escape with focus
return, no bogus `menu` semantics, and a keyboard path that does not rely on
hover. It is a net accessibility **improvement** over today, not just a layout
change.

### 4.5 What stays the same (scope fence)

`explorations.json` and the `group` strings — **untouched**. The
`numbersGroups` / `argumentsGroups` arrays — untouched (they now drive columns
instead of stacked headers). The `freshnessBadge` macro, `updates.json`,
`freshness.js` — untouched. Foundations/Arguments panel **layout** — untouched.
Top-level labels — untouched. No content, no data, no engine change. The entire
change lives in **`base.njk`** (nav markup + the `canonical-nav-css` block + the
nav JS), plus doc updates.

---

## 5. Risk & rollout

### 5.1 Blast radius

`base.njk` is **the most shared component on the site** — it wraps every one of
the ~44 explorations, the homepage, and the hub pages. Two consequences:

- **A single template error aborts the whole Eleventy build** (documented
  failure mode). The change must be verified to build before anything else.
- Any regression ships to **every page at once**. There is no partial exposure.

This argues for a tightly-scoped change, preview-first, with the matrix below.

### 5.2 Verification matrix (page types × viewport × input)

| Page type (sample slug) | Desktop ≥1280 | Tablet ~800 | Mobile ≤480 | Keyboard-only | Screen-reader smoke |
|---|---|---|---|---|---|
| Foundation (`what-bitcoin-is`) | dropdown unchanged | — | accordion | Tab/Enter/Esc | `aria-expanded` announced |
| Argument (`the-half-life`) | dropdown unchanged | — | accordion | ✓ | ✓ |
| **Numbers (`the-bitcoin-hurdle-rate`)** | **mega-panel, no scroll** | panel fits / clamps | accordion | Tab through 26 links, Esc returns focus | disclosure, not menu |
| Numbers active page | `.active` + `.active-bucket` correct | — | active section auto-expanded | focus lands sensibly | active link announced |
| Hub (`dashboard`, `the-gallery`) | nav renders; ribbon rules unaffected | — | accordion | ✓ | ✓ |
| Homepage (`/`) | nav renders | — | accordion | ✓ | ✓ |
| About (`about`) | nav renders | — | accordion | ✓ | ✓ |

**Content-integrity checks (every build):**
- **All 26 Numbers items present** in the panel (the `group`-string footgun: a
  mismatch silently drops an item — assert the count).
- All four column headers render, in `numbersGroups` order.
- Badges render where `freshness[slug]` is set; interactive `•` markers render;
  the legend renders once per panel.
- No horizontal page overflow at 1280 / 1024 / 768 / 480; the panel clamps to the
  viewport and never bleeds past the right edge.

**Keyboard/a11y specifics:** trigger is a `<button aria-expanded>` toggling
true/false; Enter/Space opens; Escape closes **and focus returns to the
trigger**; Tab enters the panel links and Tab-away closes; no keyboard trap.

### 5.3 The §10 post-deploy curl sample

After the preview builds (and again post-merge), run the house **§10 curl smoke
test** across a **representative page of each type** — foundation, argument,
numbers, hub, homepage — asserting:

- `curl -sI` → **HTTP 200** and `Content-Type: text/html` for each.
- `curl -sL` of one Numbers page → grep the served HTML for (a) the mega-panel
  container, (b) all **four** column-header strings, (c) a count of **26**
  `numbers` links, (d) badge markup where expected. This catches a silent
  item-drop and a build that "succeeded" but rendered the wrong nav.

(Precedent: the same source-tree / curl verification stood in for the node-less
local harness on the ribbon and dashboard work.)

### 5.4 Revert plan

**Clean, single-commit revert.** The change is confined to `base.njk` (+ doc
files); `explorations.json` and all data are untouched, so there is nothing to
migrate back. If a regression surfaces post-merge: `git revert <merge>` restores
the current single-column nav verbatim, and because the nav is data-driven the
reverted menu immediately reflects current content. No feature flag is required,
though the mega-panel CSS could be gated behind a body/nav class if JM prefers a
staged toggle — noted, not recommended (adds surface for little gain on a
reversible, layout-only change).

### 5.5 Scope estimate (honest)

| Piece | Rough size | Risk |
|---|---|---|
| `base.njk` Numbers branch → panel markup | rewrite ~15 lines | low (data-driven) |
| `canonical-nav-css` — mega-panel grid + right-align/clamp + column headers | ~60–90 new lines | **medium** (shared, cross-viewport) |
| Mobile accordion markup + CSS | ~30–50 lines | medium (touch QA) |
| Nav JS — `aria-expanded` sync, Escape focus-return, hover intent delay, accordion toggle, hamburger ARIA | ~30–45 lines | medium |
| Trigger `<a href="#">` → `<button>` (all three) | ~6 lines + JS selector check | low |
| Docs — SITE_GUIDE §30 (nav grouping), STYLE_GUIDE nav tokens, NEW_PAGE_CHECKLIST note | small | low |
| Cross-page + keyboard + SR QA on preview | the real cost | **the gate** |

**Net:** one focused build session. **No engine or data risk; LOW content risk;
MEDIUM layout/QA risk** because it is the most-shared component and touches every
page. The honest cost is not the code — it's the verification matrix in §5.2.

---

## 6. Open questions for JM

1. **Positioning column balance (§4.1):** accept the tall 12-item column
   [recommended], or split Positioning & Strategy into two stacked sub-columns
   under one header?
2. **Hover on the mega-panel (§4.4):** keep hover-open with a ~300ms intent delay
   [recommended], or make The Numbers **click-only** on desktop (hover does
   nothing)? Click-only is the most predictable for a wide panel; hover-with-delay
   preserves the current feel.
3. **A11y upgrade scope (§4.4):** apply the `<button>` + `aria-expanded` +
   Escape-focus-return fix to **all three** triggers in this change [recommended,
   it's shared code], or scope strictly to The Numbers and leave Foundations/
   Arguments as-is for a separate a11y pass?
4. **Mobile default state (§4.3):** accordion **collapsed by default with the
   current page's section expanded** [recommended], or all-collapsed always?
5. **Panel alignment (§4.1):** right-align to the nav [recommended] vs. a
   viewport-centered clamped container — a visual-taste call best made on the
   preview.

_On approval, these resolve into a rulings block (house pattern) and the build
prompt is written against this doc._
