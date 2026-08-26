# OG asset handoff — retirement-family batch (Compare + hub)

**Status: CLOSED 2026-08-26.** Both cards were generated chat-side per the spec below, visually
verified, and shipped with the WDCB rider in one PR. Per-card instructions are retired; what is kept
below is the durable half — the conventions and traps the next batch will need.

- `og-compare-retirement-plans.jpg` — **product-forward (§6.15.2)**, built with
  `scripts/build-og-images.py` against the **live page at default params**. The default Plan A / Plan B
  separation reads clearly at card size, so the explicit-params fallback was not needed; the
  suggested waits (1500 / 3500) worked on the first run with no tuning. The `CARDS` entry
  (`name: "compare-retirement"`) records that capture decision inline, including the explicit-params
  form to switch to if the separation ever stops reading.
- `og-bitcoin-retirement.jpg` — **brand-forward (§6.15.1)**, generator committed at repo root as
  `build-og-bitcoin-retirement.py`, cloned from the stress-test sibling and compositing over
  `og-synthesis.jpg`'s right half. Title "Plan Your" / italic-amber "Bitcoin" / "Retirement"; the
  two-line subtitle verbatim.
  **Diagnostic note, recorded so a future rerun is not misread as a defect:** the generator prints a
  `** WIDE` advisory for any line ending past `x=600`, and subtitle line 2 ends at **x=672**. It was
  visually verified clean — dark ground, well left of the template glyph — so that flag is expected
  output on every regeneration.
- **Rider shipped:** the What Daily Conviction Bought card was restored to The Numbers subsection
  (after Bitcoin Portfolio Allocation), markup verbatim from `3d2d832`. The Latest row was not touched.

**Previous batch — CLOSED 2026-08.** `og-the-bitcoin-hurdle-rate.jpg` and
`og-borrowing-against-your-stack-v2.jpg`, both re-verified serving `image/jpeg` from production on
2026-08-26.

---

## The durable half — what any future OG batch needs

**Generation is external to Claude Code.** It needs Python + Pillow (and Playwright/Chromium for the
product-forward path), which live in the **Claude *chat* sandbox**, not in this CLI environment. See
`NEW_PAGE_CHECKLIST §8` "Where the tooling actually runs" before assuming a step is blocked: only Grok
video generation is genuinely JM-external. **Nothing merges until its JPEG exists.**

**Do NOT use `?cb=` cache-busting.** It creates a second card entry instead of refreshing the
canonical one. A filename bump (`-v2`) is the correct mechanism when a card's content changes.

**The two generator paths, and how to pick.** `STYLE_GUIDE §6.15` is authoritative; the short version:

| Path | When | Tooling |
|---|---|---|
| **§6.15.1 brand-forward** | The page has no strong single visual — conceptual or essay register | Python + Pillow, two-tier composite over `og-synthesis.jpg`'s right half |
| **§6.15.2 product-forward** | The page's hero **is** an interactive visual | Playwright + headless Chromium, live-DOM clone |

**Where the pipeline lives.**

- **Product-forward:** `scripts/build-og-images.py` — the single multi-card script. Cards are entries
  in its `CARDS` list (schema documented just above the list: `name`, `url`, `hero_selector`,
  `wait_after_navigate_ms`, `wait_after_scroll_ms`, `chrome.{title, titleAccent, titleAfter, subtitle,
  statsHTML, urlText}`, `output_filename`).
  - Run: `python3 scripts/build-og-images.py --only <name>` — `--only` is `action="append"`, so pass
    it **once per card**, never `--only a b`. Or `npm run build-ogs -- --only <name>`.
  - Deps: `pip install playwright pillow` then `playwright install chromium`.
  - **It reads production.** A card for a page that is not yet live must point `url` at the branch
    preview and be pointed back before the entry is committed.
  - **Record the capture URL in the entry** whenever non-default page state is used, so the next
    regeneration reproduces the same card rather than a different one.
- **Brand-forward:** per-card scripts at repo root, `build-og-<slug>.py`. Clone the nearest sibling
  rather than starting fresh. Deps: `pip install pillow requests`, plus network for the fonts.
  Composite over **`og-synthesis.jpg`** — **never `og-the-power-law.jpg`**, which is a product-forward
  chart card whose right half drags the Power Law chart and its URL onto the new card (this bit the
  Metcalfe build, caught only on visual review).

**The registration trap.** `.eleventy.js` `staticAssets` has **no existence guard** —
`staticAssets.forEach(asset => addPassthroughCopy(...))` — so registering a filename before the file
exists risks the build. **Add the entry in the same commit as the JPEG, never ahead of it.**

**The silent failure mode.** Cloudflare serves the HTML shell with a `200` for any unknown path, so a
missing OG asset does not 404 — it returns `200 text/html`. `Content-Type` is the only honest check.
The same shape appears during the deploy propagation window on a page that *is* live, so a single
failing check right after a merge is worth repeating before it is believed.

**Data dependency.** Product-forward cards embed live chart screenshots and go stale on each monthly
data refresh; add every new one to `MONTHLY_REFRESH_CHECKLIST §6`. Brand-forward cards have no such
dependency.

## Verify after the deploy

Wait for the Cloudflare check to report "Deployed successfully" — it is the **only** authoritative
signal; any Netlify check on the PR is noise from a reconnected integration. Then:

```
curl -sSI https://lastcoinstanding.com/og-<slug>.jpg
```

Must return `Content-Type: image/jpeg`. A `200 text/html` is a failure, not a pass. Then force a
re-scrape via Facebook's debugger (developers.facebook.com/tools/debug/) and the X card validator or a
draft tweet. **Do not share a page's URL anywhere until its `image/jpeg` check passes.**
