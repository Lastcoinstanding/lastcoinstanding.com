# OG CARD SPEC — /the-rundown

_2026-09-05. Handback for the drafting side, which has the render tooling.
Written against `STYLE_GUIDE §6.15.1` (brand-forward), `§6.15.2`
(product-forward), `§6.15.3` (staticAsset registration) and the Rundown's own
`RUNDOWN_DESIGN` Part I §11.9 / §8._

---

## 0 · The decision that drives everything: BRAND-FORWARD, not product-forward

**The Rundown's design doc forbids the product-forward pattern for this page.**
Part I §11.9 is unambiguous — *"OG static, no live figures; title/meta static"*
— and §8 repeats it: *"OG per §52/§52.1 (no live figures on the card)."*

A product-forward card (§6.15.2) works by screenshotting the page's live hero
and embedding it as a bitmap. Every candidate hero on this page is made of live
figures: the context header is four live cards, the position module prints a
live multiple and live durations, the mini-bar is a live marker. There is no
hero on this page that is not a live number.

**So: §6.15.1 brand-forward, the Pillow two-tier generator.** This also settles
a second problem before it starts — product-forward cards embed live data and
therefore go stale, which is why they sit in `MONTHLY_REFRESH_CHECKLIST §6`.
A brand-forward card has no such dependency, and the Rundown's whole §1 fence
is that it adds **zero** lines to the refresh checklist. A product-forward card
would break that fence on its first day.

**Superseded note.** `the-rundown-head.html` currently carries a deferred-OG
comment proposing *"the position strip + first visit card"* as the hero
selector. That was written before §11.9 was ruled and before the v2 rebuild;
it describes a product-forward capture and should be ignored. It is removed as
part of the listing pass.

---

## 1 · The card

**File:** `og-the-rundown.jpg` · **1280 × 720** · JPEG quality 82,
`optimize=True, progressive=True` · target 60–100 KB.

**Template:** composite the right half of **`og-synthesis.jpg`** — the canonical
brand-forward reference with the bare textured ₿. **Do not use
`og-the-power-law.jpg`**: despite the name it is a product-forward chart card,
and compositing its right half drags the Power Law chart and the wrong URL onto
the card. That mistake has been made once already (Metcalfe's Law, June 2026)
and was caught only on visual review.

Right portion `x >= 620` hard-pasted; seam feathered across `x = 620..820` with
an alpha gradient. Left half procedural per §6.15.1 — base `#100D0A`,
multi-scale Gaussian noise with green/blue at lower amplitude than red,
5–10 amber wear ellipses at ~12/255 alpha blurred `radius=2.5`, final
`radius=0.6` blur. Use a fresh per-card seed.

### Copy — static, and every word checked against the page

| Element | Content |
|---|---|
| Header | `LAST COIN STANDING` |
| **Title** | **The Rundown** |
| **Italic subtitle** | *What this position has meant for your situation* |
| URL footer | `LASTCOINSTANDING.COM/THE-RUNDOWN` |

**On the subtitle.** It is the page's own standfirst with the live clause
removed. The live line reads *"Bitcoin is at ‹0.52›× its long-run trend. What
has a position like this meant for your situation?"*; the card keeps the second
sentence, which carries no figure and is the page's actual claim. Past tense is
load-bearing — the page's spine is what a position **has meant**, and a
forward-leaning subtitle would misdescribe it on the one surface that travels
without context.

**Do not put a multiple, a price, a date or a count on this card.** That is the
§11.9 rule, and it is also the practical one: an OG image is cached by scrapers
for weeks, so a baked figure goes stale where nobody can see it.

### Layout coordinates (§6.15.1, unchanged)

| Element | Position | Font | Size | Colour |
|---|---|---|---|---|
| Header | `(100, 110)`, letterspaced ~5.5px | Inter Medium | 18px | `#827A6E` |
| Amber rule | `(100, 144) → (200, 144)`, 2px | — | — | `#E09422` |
| Title | `(100, 245)`, line-height 95px | Cormorant Garamond SemiBold | 78px | `#F2EEE8` |
| Italic subtitle | `(100, ~340)`, wrap at 480px | Cormorant Garamond Italic | 30px | `#BEB2A0` |
| URL footer | `(100, 668)`, letterspaced ~4.5px | Inter Medium | 18px | `#827A6E` |

**Title fit:** "The Rundown" is 11 characters and will not wrap at 78px inside
the 480px text column — no size reduction needed. The subtitle is 47 characters
and wraps to two lines at 30px; check the second line clears the URL footer at
`y = 668`.

---

## 2 · Wiring, at the listing pass and not before

The card is currently **deferred deliberately**: the page ships with **no
`og:image` / `twitter:image` tag at all**, because a tag pointing at a missing
file is worse than no tag — scrapers cache the 404. So the image lands first,
then the tags, in one commit.

1. **Place** `og-the-rundown.jpg` at the repo root.
2. **Register it in `.eleventy.js`** — add `'og-the-rundown.jpg'` to the
   `staticAssets` array. **This is the step that silently fails.** Without it
   Cloudflare serves the page's HTML at the image URL with a 200 status, and
   the social card breaks everywhere with no build error (§6.15.3).
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
4. **Remove the deferred-OG comment** from `the-rundown-head.html` in the same
   commit, so the file does not describe a plan that has happened.

### Validation, in this order

- `curl -I https://lastcoinstanding.com/og-the-rundown.jpg` → **`Content-Type: image/jpeg`**.
  A `text/html` at status 200 is the phantom-200 failure and means step 2 was
  missed.
- Scrape-check via metatags.io or a draft post. The page is `noindex`, which
  does **not** block OG scrapers, but see the sequencing note below.
- Add the card to the §52.1 watchlist check if one is running.

### Sequencing against the unlisted hold — the one thing to get right

`/the-rundown` is **unlisted and `noindex`** until JM's register review, and
merging `feat-sister-tabs-dashboard` is what makes it reachable at all.

**Generating and wiring the card does not publish the page** — the tags only
matter when someone shares the URL. But **do not scrape-test the live URL
through a third-party debugger before the listing pass**: services like
Facebook's debugger and metatags.io fetch and may retain the URL, which is a
way for an unlisted page to escape by accident. Validate with `curl` against
the image file only, and leave the social-preview check until listing.

---

## 3 · Refresh burden

**None, by construction.** The card carries no live figure and no chart, so it
does not enter `MONTHLY_REFRESH_CHECKLIST §6`'s regeneration list. It needs
regenerating only if the page's **title or standfirst copy changes** — which is
the failure mode that produced `og-compare-retirement-plans-v2.jpg` on its
first day (§52.1): the card was correct when made and the page changed
underneath it that afternoon.

Given this page is mid-review, the practical guidance is: **generate the card
after the register review settles the copy, not before.** The subtitle above is
the copy as it stands today; if the review moves the standfirst, the card moves
with it.
