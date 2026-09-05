# OG CARD SPEC — /the-rundown

_2026-09-05, handback revision. For the drafting side, which has the render
tooling. Written against `STYLE_GUIDE §6.15.1` (brand-forward), `§6.15.2`
(product-forward), `§6.15.3` (staticAsset registration), `§6.33`, and the
Rundown's own `RUNDOWN_DESIGN` Part I §11.9 / §8._

**Status: CLEARED TO RENDER.** The copy gate in §5 below is satisfied —
register round two shipped and round three closed with no further edits
(JM, 2026-09-05). Every string in §3 has been checked against the page as it
stands today, not against the version this spec was first written for.

---

## 0 · Read this first: there is no viewport and no selector

The handback asked for the exact viewport, selector, dimensions and chrome.
**Three of those four do not exist for this card, and that is the design, not
an omission.**

| Asked for | Answer |
|---|---|
| Viewport | **None.** No browser is involved. |
| Selector | **None.** Nothing is screenshotted. |
| Chrome | **None.** No browser frame, no page chrome, no device bezel. |
| Dimensions | **1280 × 720**, RGB, no alpha. See §2. |

The card is **brand-forward** (`§6.15.1`): a 1280×720 canvas composited by the
Pillow generator from a procedural left half and a hard-pasted right half of an
existing card. It is not a page capture. A product-forward card (`§6.15.2`) is
the one that needs a viewport and a selector, and **this page is forbidden that
pattern** — see §1.

**A stale line pointed the other way and has been removed.** Until today
`the-rundown-head.html` carried a comment reading *"The hero selector is the
position strip + first visit card, not the full page."* That was written before
§11.9 was ruled and before the v2 rebuild; it described a product-forward
capture. It is deleted, and the comment now states plainly that there is no
selector. If you are working from an older copy of that file, ignore it.

---

## 1 · Why brand-forward, and why it is not reopenable

**The Rundown's design doc forbids the product-forward pattern for this page.**
Part I §11.9 is unambiguous — *"OG static, no live figures; title/meta static"*
— and §8 repeats it: *"OG per §52/§52.1 (no live figures on the card)."*

A product-forward card works by screenshotting the page's live hero and
embedding it as a bitmap. **Every candidate hero on this page is made of live
figures:** the context header is four live cards, the position module prints a
live multiple and live durations, the mini-bar is a live marker. There is no
hero on this page that is not a live number.

This also settles a second problem before it starts. Product-forward cards
embed live data and therefore go stale, which is why they sit in
`MONTHLY_REFRESH_CHECKLIST §6`. A brand-forward card has no such dependency,
and the Rundown's whole §1 fence is that it adds **zero** lines to the refresh
checklist. A product-forward card would break that fence on its first day.

---

## 2 · Render parameters

### 2.1 Canvas and output

| Parameter | Value |
|---|---|
| Dimensions | **1280 × 720** px |
| Colour mode | RGB (no alpha in the output) |
| Format | JPEG |
| Quality | `quality=82` |
| Encoder flags | `optimize=True, progressive=True` |
| Target file size | 60–100 KB |
| Filename | `og-the-rundown.jpg` |
| Location | **repo root**, not `src/` — see §4 |

### 2.2 The composite source — get this one right

**Template: the right half of `og-synthesis.jpg`.** Verified present at the
repo root, **1280 × 720** (SOF0 header checked, 2026-09-05), 75,578 bytes. It
is the canonical brand-forward reference with the bare textured ₿.

> **Do not use `og-the-power-law.jpg`.** Despite the name it is a
> product-forward chart card. Compositing its right half drags the Power Law
> chart and the wrong URL onto this card. That mistake has been made once
> already — Metcalfe's Law, June 2026 — and was caught only on visual review.

| Step | Value |
|---|---|
| Hard paste | source region `x >= 620` copied verbatim |
| Seam feather | alpha gradient across `x = 620 … 820` (200 px ramp, 0 → 1) |
| Left half | procedural, per §2.3 |

### 2.3 The procedural left half (`§6.15.1`)

| Layer | Recipe |
|---|---|
| Base | flat `#100D0A` |
| Noise | multi-scale Gaussian; **green and blue at lower amplitude than red** |
| Wear | 5–10 amber ellipses at ~`12/255` alpha, blurred `radius=2.5` |
| Finish | whole-canvas Gaussian blur `radius=0.6` |
| Seed | **fresh per card** — do not reuse another card's seed |

### 2.4 Type, colour and coordinates

All coordinates are top-left origin on the 1280 × 720 canvas.

| Element | Position | Font | Size | Colour | Notes |
|---|---|---|---|---|---|
| Header | `(100, 110)` | Inter Medium | 18 px | `#827A6E` | letterspacing ~5.5 px |
| Amber rule | `(100, 144) → (200, 144)` | — | 2 px stroke | `#E09422` | |
| Title | `(100, 245)` | Cormorant Garamond SemiBold | 78 px | `#F2EEE8` | line-height 95 px |
| Italic subtitle | `(100, ~340)` | Cormorant Garamond Italic | 30 px | `#BEB2A0` | wrap at 480 px |
| URL footer | `(100, 668)` | Inter Medium | 18 px | `#827A6E` | letterspacing ~4.5 px |

**Fit checks.** "The Rundown" is 11 characters and will not wrap at 78 px inside
the 480 px column — no size reduction needed. The subtitle is 47 characters and
wraps to two lines at 30 px; confirm the second line clears the URL footer at
`y = 668`.

---

## 3 · The copy — static, every string checked against the live page

| Element | Content |
|---|---|
| Header | `LAST COIN STANDING` |
| **Title** | **The Rundown** |
| **Italic subtitle** | *What this position has meant for your situation* |
| URL footer | `LASTCOINSTANDING.COM/THE-RUNDOWN` |

**On the subtitle, and why it is stable.** It is the second half of the page's
own `<title>`, which reads *"The Rundown — What This Position Has Meant for
Your Situation"* and is carried verbatim in the static `og:title` and
`twitter:title` tags in `the-rundown-head.html`. Those are hardcoded, not
computed, so the card and the tags cannot drift apart.

It also matches the standfirst's second sentence in substance. The standfirst
is set from script and currently reads *"As of ‹September 5, 2026›, bitcoin is
at ‹0.52›× its long-run trend. What has a position like this meant for your
situation?"* — the card takes the claim and drops the live clause and the date.

**Past tense is load-bearing.** The page's spine is what a position **has
meant**; a forward-leaning subtitle would misdescribe it on the one surface
that travels without context.

> **Do not put a multiple, a price, a date or a count on this card.** That is
> the §11.9 rule, and it is also the practical one: scrapers cache an OG image
> for weeks, so a baked figure goes stale where nobody can see it.

---

## 4 · Wiring — at the listing pass, not before

The card is **deferred deliberately**: the page currently ships with **no
`og:image` / `twitter:image` tag at all**, because a tag pointing at a missing
file is worse than no tag — scrapers cache the 404. So the image lands first,
then the tags, in one commit.

1. **Place** `og-the-rundown.jpg` at the **repo root**.
2. **Register it in `.eleventy.js`** — add `'og-the-rundown.jpg'` to the
   `staticAssets` array. **This is the step that silently fails.** Without it
   Cloudflare serves the page's HTML at the image URL with a **200** status,
   and the social card breaks everywhere with no build error (`§6.15.3`).
3. **Add the tags** to `the-rundown-head.html`, beside the existing static
   `og:` block:
   ```html
   <meta property="og:image" content="https://lastcoinstanding.com/og-the-rundown.jpg">
   <meta property="og:image:width" content="1280">
   <meta property="og:image:height" content="720">
   <meta property="og:image:type" content="image/jpeg">
   <meta property="og:image:alt" content="The Rundown — what this position in bitcoin's long-run channel has meant for your situation.">
   <meta name="twitter:image" content="https://lastcoinstanding.com/og-the-rundown.jpg">
   <meta name="twitter:image:alt" content="The Rundown — what bitcoin's position in its long-run channel has meant, decision by decision.">
   ```
4. **Replace the deferred-OG comment** in `the-rundown-head.html` in the same
   commit, so the file does not describe a plan that has already happened.

### Validation, in this order

- `curl -I https://lastcoinstanding.com/og-the-rundown.jpg` →
  **`Content-Type: image/jpeg`**. A `text/html` at status 200 is the
  phantom-200 failure and means step 2 was missed.
- Scrape-check via a debugger or a draft post. The page is `noindex`, which
  does **not** block OG scrapers — but see the sequencing note below.
- Add the card to the `§52.1` watchlist check if one is running.

### Sequencing against the unlisted hold — the one thing to get right

`/the-rundown` is **unlisted and `noindex`** until the counsel pass and the
listing pass, and merging `feat-sister-tabs-dashboard` is what makes it
reachable at all.

**Generating and wiring the card does not publish the page** — the tags only
matter when someone shares the URL. But **do not scrape-test the live URL
through a third-party debugger before the listing pass**: services like
Facebook's debugger and metatags.io fetch and may retain the URL, which is a
way for an unlisted page to escape by accident. Validate with `curl` against
the image file only, and leave the social-preview check until listing.

---

## 5 · Refresh burden

**None, by construction.** The card carries no live figure and no chart, so it
does not enter `MONTHLY_REFRESH_CHECKLIST §6`'s regeneration list. It needs
regenerating only if the page's **title or standfirst copy changes** — which is
the failure mode that produced `og-compare-retirement-plans-v2.jpg` on its
first day (`§52.1`): the card was correct when made and the page changed
underneath it that afternoon.

**That gate is now cleared.** The guidance used to read "generate the card
after the register review settles the copy, not before." The review has run:
round two shipped on 2026-09-05 and round three closed the same day with no
further edits. The strings in §3 are the settled copy.
