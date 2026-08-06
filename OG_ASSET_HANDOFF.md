# OG asset handoff — BAS v2 + hurdle (branch `og/bas-hurdle-v2`)

**Status: PREP ONLY. Do not merge this branch until the JPEGs exist.**
A 404 card is worse than a stale one, so the reference bumps below are **written
here, not applied to the page head files** — they must land in the *same commit*
as the generated assets. Regeneration is external (needs Python + Pillow /
Playwright + Chromium — not runnable in the authoring sandbox).

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
- **Reference bump — apply WITH the new JPEG, in one commit** in
  `src/_includes/_pageassets/borrowing-against-your-stack-head.html`:
  - `og:image` → `https://lastcoinstanding.com/og-borrowing-against-your-stack-v2.jpg`
  - `twitter:image` → `https://lastcoinstanding.com/og-borrowing-against-your-stack-v2.jpg`
  - (leave `og:image:alt` / `twitter:image:alt` as-is — already current)

## 2. Hurdle — generate the missing asset (product-forward, §6.15.2)

`og-the-bitcoin-hurdle-rate.jpg` **does not exist** (never tracked, not on disk).
The hero must be the **chart, not the input board**.

- **CARDS entry added on this branch** (`scripts/build-og-images.py`, `name: "hurdle"`)
  with `hero_selector: "#hrChart"` and the subtitle
  *"Does it beat bitcoin? The bar any use of capital has to clear — and why it
  falls as your horizon lengthens."*
- **Generate:** `python3 scripts/build-og-images.py --only hurdle`
  → writes `og-the-bitcoin-hurdle-rate.jpg`.
- **No reference bump / no `-v2`.** The page head already points at
  `og-the-bitcoin-hurdle-rate.jpg`, and no v1 ever deployed (PR #40 unmerged), so
  there is nothing cached on X to bust. Regen alone completes it.
  *(If you still want `-v2` for consistency, change the CARDS `output_filename`
  and add the same two-line head bump as BAS — one-line edits, this branch.)*
- The hurdle page ships on PR #40; sequence this so the asset lands with (or
  before) that page goes to production.

## Deploy sequence (both)

1. Generate the JPEG(s) externally.
2. Apply the reference bump(s) above (BAS only; hurdle needs none).
3. `git add` the JPEG(s) **and** the head-file bump(s) → **one commit**.
4. Verify `curl -I https://lastcoinstanding.com/og-borrowing-against-your-stack-v2.jpg`
   returns `Content-Type: image/jpeg`, then poke the Facebook debugger + a draft
   tweet to force a re-scrape (per `build-og-images.py` footer).
5. Only then merge.
