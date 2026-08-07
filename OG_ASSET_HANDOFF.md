# OG asset handoff — BAS v2 + hurdle (branch `og/bas-hurdle-v2`)

**Status: PREP. Do not merge this branch until the JPEGs exist.**
The BAS `-v2` reference bumps are now **applied and committed on this branch** (per JM's "stage the
bumps" instruction). Safe while *unmerged*: production never sees the bumped reference until this
branch merges to main, and it will not merge until the generated JPEGs are committed to it — so there
is no production window pointing at a missing file. (The branch *preview* will 404 the BAS card until
the JPEG lands; harmless — X scrapes production, not the preview.) Regeneration is external (needs
Python + Pillow / Playwright + Chromium — not runnable in the authoring sandbox).

**Do NOT use `?cb=` cache-busting.** It creates a second card entry instead of
refreshing the canonical one. The filename bump (BAS) is the correct mechanism.

---

## 1. BAS — regenerate + `-v2` bump (brand-forward, §6.15.1)

`og-borrowing-against-your-stack.jpg` bakes the stale subtitle
*"A supplemental retirement framework — using bitcoin as collateral instead of
selling it."* The page was repositioned; its `og:image:alt` now reads
*"…with HODL as the legitimate baseline."* Card on X is fine — the asset is stale.

- **Card type:** brand-forward (atmospheric ₿ + title + italic subtitle). There is
  **no** `build-og-borrowing-against-your-stack.py`; regenerate via the
  brand-forward Pillow pipeline (right-half composited from `og-synthesis.jpg`
  per §6.15.1), or by adding a `build-og-borrowing-against-your-stack.py` in the
  style of the other `build-og-*.py` scripts.
- **New subtitle (approved 2026-08-06):**
  `Bitcoin as collateral instead of selling it — with HODL as the legitimate baseline.`
- **Output filename:** `og-borrowing-against-your-stack-v2.jpg` (new path forces
  X to re-scrape; the old cached card keeps serving until it does).
- **Reference bump — DONE (applied on this branch)** in
  `src/_includes/_pageassets/borrowing-against-your-stack-head.html`: `og:image` and `twitter:image`
  now point at `og-borrowing-against-your-stack-v2.jpg` (`…:alt` left as-is, already current). Just
  add the generated `og-borrowing-against-your-stack-v2.jpg` to the branch — the reference awaits it.

## 2. Hurdle — generate the missing asset (product-forward, §6.15.2)

`og-the-bitcoin-hurdle-rate.jpg` **does not exist** (never tracked, not on disk).

- **Hero (v1.2 decision):** the **verdict + stat-strip block (`#hrAnswer`)**, the page's visual
  centre after the v1.2 reorder moved the chart to last. Two CARDS entries on this branch so JM can
  compare and pick: `name: "hurdle"` (`hero_selector: "#hrAnswer"` → `og-the-bitcoin-hurdle-rate.jpg`)
  and `name: "hurdle-chart"` (`hero_selector: "#hrChart"` → `og-the-bitcoin-hurdle-rate-chart.jpg`).
  Subtitle (both): *"Does it beat bitcoin? The bar any use of capital has to clear — and why it falls
  as your horizon lengthens."*
- **Generate:** `python3 scripts/build-og-images.py --only hurdle hurdle-chart` → writes both.
  **Generate against the feat/hurdle-rate PREVIEW** — the page and its `#hrAnswer`/`#hrChart` elements
  are on PR #40, not production yet; point the CARDS `url` at the branch-preview URL for the run (or
  generate from a checkout that has the page). Pick the winner → it takes `og-the-bitcoin-hurdle-rate.jpg`;
  discard the other file.
- **No reference bump / no `-v2`** for the hurdle: the head already points at
  `og-the-bitcoin-hurdle-rate.jpg` and no v1 ever deployed, so nothing is cached to bust. (The hurdle
  head lives on `feat/hurdle-rate`, not this branch.)

## Deploy sequence (both)

1. Generate the JPEG(s) externally.
2. Apply the reference bump(s) above (BAS only; hurdle needs none).
3. `git add` the JPEG(s) **and** the head-file bump(s) → **one commit**.
4. Verify `curl -I https://lastcoinstanding.com/og-borrowing-against-your-stack-v2.jpg`
   returns `Content-Type: image/jpeg`, then poke the Facebook debugger + a draft
   tweet to force a re-scrape (per `build-og-images.py` footer).
5. Only then merge.
