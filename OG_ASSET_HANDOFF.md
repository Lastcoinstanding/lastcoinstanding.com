# OG asset handoff — retirement-family batch (Compare + hub)

**Status: PREP. Two cards, one rider, one PR.**
Generation is external to Claude Code — it needs Python + Pillow (and Playwright/Chromium for the
product-forward path), which live in the **Claude *chat* sandbox**, not in this CLI environment. See
`NEW_PAGE_CHECKLIST §8` "Where the tooling actually runs" before assuming anything is blocked: only
Grok video generation is genuinely JM-external. Nothing here merges until its JPEG exists.

**Do NOT use `?cb=` cache-busting.** It creates a second card entry instead of refreshing the
canonical one. A filename bump (`-v2`) is the correct mechanism when a card's content changes.

**Previous batch — CLOSED 2026-08.** `og-the-bitcoin-hurdle-rate.jpg` and
`og-borrowing-against-your-stack-v2.jpg` both shipped and were re-verified serving `image/jpeg` from
production on 2026-08-26. Their per-card instructions have been retired from this file; the durable
lessons (compare a regenerated card side-by-side against the live one so an unintended title change
cannot ride along on a subtitle fix; `og-synthesis.jpg` is the brand-forward right-half template and
`og-the-power-law.jpg` is NOT) live in `STYLE_GUIDE §6.15.1`.

---

## What chat-side needs to know before running anything

**The two generator paths, and how to pick.** `STYLE_GUIDE §6.15` is authoritative; the short version:

| Path | When | Tooling |
|---|---|---|
| **§6.15.1 brand-forward** | The page has no strong single visual — conceptual or essay register | Python + Pillow, two-tier composite over `og-synthesis.jpg`'s right half |
| **§6.15.2 product-forward** | The page's hero **is** an interactive visual | Playwright + headless Chromium, live-DOM clone |

**Where the pipeline lives.**

- **Product-forward:** `scripts/build-og-images.py` — the single multi-card script. Cards are entries
  in its `CARDS` list (schema documented in the file, just above the list: `name`, `url`,
  `hero_selector`, `wait_after_navigate_ms`, `wait_after_scroll_ms`, `chrome.{title, titleAccent,
  titleAfter, subtitle, statsHTML, urlText}`, `output_filename`). It visits the **live page**,
  screenshots the hero element, embeds it in an injected OG frame, and downsamples to 1280×720.
  - Run: `python3 scripts/build-og-images.py --only <name>` — `--only` is `action="append"`, so pass
    it **once per card**, never `--only a b`.
  - Or `npm run build-ogs -- --only <name>`.
  - Deps: `pip install playwright pillow` then `playwright install chromium`.
  - **It reads production.** A card for a page that is not yet live must point `url` at the branch
    preview instead, and be pointed back before the entry is committed.
- **Brand-forward:** per-card scripts at repo root, `build-og-<slug>.py` (ten of them; clone the
  nearest sibling rather than starting fresh). Deps: `pip install pillow requests` plus network for
  the fonts.

**The registration step that is deliberately NOT done yet.** Neither card is in `.eleventy.js`
`staticAssets`. That array has **no existence guard** — `staticAssets.forEach(asset =>
addPassthroughCopy(...))` — so registering a filename before the file exists risks the build. Add the
entry in the same commit as the JPEG, never ahead of it.

**The silent failure mode.** Cloudflare serves the HTML shell with a `200` for any unknown path, so a
missing OG asset does not 404 — it returns `200 text/html`. `Content-Type` is the only honest check.

---

## Priority 1 — `og-compare-retirement-plans.jpg` (BROKEN reference today)

`/compare-retirement-plans` shipped 2026-08-26 with its head already pointing at this filename, so the
card currently unfurls as a bare link. This is the urgent one — same failure the hurdle card had.

- **Path: product-forward (§6.15.2).** The page's hero *is* the argument: the paired balance curves
  plus the delta strip beneath them. A brand-forward card would preview the brand for a page whose
  whole point is that you can see two plans diverge.
- **Suggested `CARDS` entry** (drop into `scripts/build-og-images.py`; tune the waits on first run):
  ```python
  {
      "name": "compare-retirement",
      "url": "https://lastcoinstanding.com/compare-retirement-plans",
      "hero_selector": "#crpChart",
      "wait_after_navigate_ms": 1500,
      "wait_after_scroll_ms": 3500,   # Chart.js settle; the page renders on load, no observer gate
      "chrome": {
          "title": "Compare ",
          "titleAccent": "Retirement",
          "titleAfter": " Plans",
          "subtitle": "Every plan is a choice against the plan you didn't pick. Two complete plans, side by side, and what the difference actually buys.",
          "statsHTML": (
              '<strong style="color:#F7931A; font-weight:700;">Plan A vs Plan B</strong>'
              '  ·  one shared set of assumptions  ·  the difference in plain sentences'
          ),
          "urlText": "lastcoinstanding.com/compare-retirement-plans",
      },
      "output_filename": "og-compare-retirement-plans.jpg",
  },
  ```
- **House conventions this card must honour (`SITE_GUIDE §52`):**
  - **Neither column may be styled as the winner.** Plan A is amber (`--crp-a #e09422`), Plan B is
    slate (`--crp-b #6db3d4`) — deliberately not green-vs-red. If the captured hero happens to show a
    depleting plan, that is fine and honest; what is not fine is chrome copy that crowns one.
  - **No winner-crowning in the subtitle or stats.** Verdicts are facts (crosses / depletes / holds);
    the reader chooses. The subtitle above is the page's own lede for exactly this reason.
  - **The page defaults to Plan A = 1.00 BTC / $100,000 / 2035 and Plan B = the same with the year
    +1**, so a default capture shows two curves that separate slightly — which is the picture we want.
    If the separation reads too subtle at card size, capture with explicit params rather than
    inventing a scenario: e.g.
    `?a_stack=1&a_retire=2035&a_income=100000&b_stack=1&b_retire=2040&b_income=100000`.
    **Record whatever URL was used in the `CARDS` entry**, so the next regeneration reproduces it.
  - **Data dependency:** this is a product-forward card, so it goes stale when the Power Law data
    refreshes. Add it to the `MONTHLY_REFRESH_CHECKLIST §6` regeneration list in the same PR.

## Priority 2 — `og-bitcoin-retirement.jpg` (hub; currently borrowing the flagship's)

`/bitcoin-retirement` shipped pointing `og:image` at `og-the-bitcoin-retirement.jpg`. That is
on-family and *works* — it is generic, not broken, which is why it sits behind Priority 1.

- **Path: brand-forward (§6.15.1).** The hub has no instrument to photograph; it is four questions.
  Clone the nearest sibling `build-og-<slug>.py` and composite over `og-synthesis.jpg`'s right half
  (**not** `og-the-power-law.jpg` — that is a product-forward chart card and dragging its right half
  in has bitten a build before).
- **Title treatment:** "Plan Your " + italic-amber **"Bitcoin"** + " Retirement".
- **Subtitle (two lines, em-dash-free per the BAS precedent):**
  `Four questions, in the order they actually arrive. /
   Build a plan, size it, choose between options, then stress it.`
- **When it lands:** bump `og:image` + `twitter:image` + both `…:alt` values in
  `src/_includes/_pageassets/bitcoin-retirement-head.html` off the flagship filename, and add the new
  filename to `.eleventy.js` `staticAssets`.

## Rider — the What Daily Conviction Bought category card

**JM ruling 2026-08-26: ship this with the OG batch, not as its own PR.** When the hub card entered
the homepage **Latest** row on 2026-08-26, `/what-daily-conviction-bought` rotated off — and unlike
the STRC card that rotated off the same day, it has **no category card** further down the page. It
keeps carousel slide #20, so it is not delisted from the homepage, but it is currently absent from the
Explore grid. This restores it.

- **Where:** `src/index.njk`, **The Numbers** subsection, in the *Positioning & Strategy* neighbourhood
  — immediately after the Bitcoin Portfolio Allocation card reads naturally, but any placement inside
  The Numbers is fine.
- **Markup — this is the card verbatim as it stood in Latest before the rotation** (recovered from
  `3d2d832`), so nothing has to be re-authored:
  ```html
        <!-- What Daily Conviction Bought -->
        <a href="/what-daily-conviction-bought" class="concept-card">
            <div class="card-icon">
                <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <!-- The straight-climbing contributions line under the soaring, volatile stack value; the dot marks the $1M crossing. -->
                    <line x1="5" y1="42" x2="43" y2="42" stroke="#2a2a2a" stroke-width="1"/>
                    <path d="M 5 41 L 12 38 L 17 40 L 23 30 L 29 20 L 32 24 L 37 12 L 41 18" stroke="#F7931A" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M 5 41 L 43 34" stroke="#8b8375" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                    <circle cx="37" cy="12" r="2.1" fill="#F7931A" stroke="#e8e0d4" stroke-width="0.9"/>
                </svg>
            </div>
            <div class="card-title">What Daily Conviction Bought</div>
            <div class="card-desc">$30 a day since 2017, recomputed live. Pick a start date and a daily amount and replay the habit against bitcoin&rsquo;s real price history &mdash; what it accumulated, what it cost, what it&rsquo;s worth, and how deep the drawdown went. The record of a habit, not a recommendation.</div>
            <div class="card-cta">Replay the habit &rarr;</div>
        </a>
  ```
- **Do not touch the Latest row.** It is at six and correct; this is an addition to The Numbers only.

---

## Verify after the deploy

Wait for the Cloudflare check to report "Deployed successfully" (it is the **only** authoritative
signal — any Netlify check on the PR is noise from a reconnected integration), then:

```
curl -sSI https://lastcoinstanding.com/og-compare-retirement-plans.jpg
curl -sSI https://lastcoinstanding.com/og-bitcoin-retirement.jpg
```

Each **must** return `Content-Type: image/jpeg`. A `200 text/html` is the tell for a missing or
unregistered asset, not a success. Then force a re-scrape via Facebook's debugger
(developers.facebook.com/tools/debug/) and the X card validator or a draft tweet.

**Do not share the `/compare-retirement-plans` URL anywhere until its `image/jpeg` check passes** —
that is the card that is broken today.

## Close-out

When both cards are live, close all four mirrored records together: the `TECH_DEBT` entry for the
Compare card, `SITE_GUIDE §52`'s deferred-items paragraph, `§53`'s closing "Open" line, and this file's
Priority sections.
