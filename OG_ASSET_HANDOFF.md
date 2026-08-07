# OG asset handoff — BAS v2 + hurdle

**Status: PREP. Split sequencing — hurdle first, BAS second.**
Both cards are staged and ready to *generate*; generation is external (needs Python + Chromium/Pillow,
not runnable in the authoring sandbox). Nothing here merges until its JPEG exists.

**Do NOT use `?cb=` cache-busting.** It creates a second card entry instead of
refreshing the canonical one. The BAS filename bump (`-v2`) is the correct mechanism.

---

## 1. HURDLE — product-forward (§6.15.2). Branch: `og/hurdle-card` → main (FIRST)

`og-the-bitcoin-hurdle-rate.jpg` **does not exist**; the page shipped to production (PR #40) with its
head already referencing that path, so the card currently unfurls as a bare link. This is the urgent,
*broken* card — land it first, on its own branch, straight to main.

- **CARDS entries** live on **`og/hurdle-card`** (moved off this branch so they reach main with the
  hurdle asset rather than being stranded here). Two entries so JM can compare and pick:
  `name: "hurdle"` (`#hrAnswer` → `og-the-bitcoin-hurdle-rate.jpg`, the v1.2 hero) and
  `name: "hurdle-chart"` (`#hrChart` → `og-the-bitcoin-hurdle-rate-chart.jpg`).
- **Target is PRODUCTION** — both CARDS `url` = `https://lastcoinstanding.com/the-bitcoin-hurdle-rate`.
  The page is live, so no preview/URL edit is needed.
- **Generate** (from `og/hurdle-card`, repo root):
  `python3 scripts/build-og-images.py --only hurdle --only hurdle-chart`
  Note: `--only` is `action="append"` — pass it **once per card** (not `--only hurdle hurdle-chart`).
- **Pick the winner** → it must be named `og-the-bitcoin-hurdle-rate.jpg`; if `#hrChart` wins, rename
  the `-chart.jpg` to that. **Discard** the losing file — only the plain name is referenced/registered.
- **No reference bump, no `.eleventy.js` edit:** the head reference and the passthrough entry for
  `og-the-bitcoin-hurdle-rate.jpg` are already on main. Commit the winning JPEG on `og/hurdle-card`
  (it also carries the CARDS entries) → merge to main. Card + CARDS land together.

## 2. BAS — brand-forward (§6.15.1) `-v2` bump. Branch: `og/bas-hurdle-v2` → main (SECOND)

`og-borrowing-against-your-stack.jpg` bakes the stale subtitle *"A supplemental retirement framework…"*.
The page was repositioned (HODL as the baseline); the card is stale but *working*, so this waits behind
the hurdle card.

- **Generator EXISTS on this branch:** `build-og-borrowing-against-your-stack.py` (cloned from
  `build-og-bull-and-bear-cycles.py`; two-tier composite over `og-synthesis.jpg`). It carries the
  existing card's title treatment — "Borrowing" in italic amber, "Against Your Stack" bright — and the
  approved two-line, em-dash-free subtitle.
- **New subtitle (approved 2026-08-06):**
  `Bitcoin as collateral instead of selling it, / with HODL as the legitimate baseline.`
- **Generate** (from repo root; needs `pip install pillow requests` and network for the fonts):
  `python build-og-borrowing-against-your-stack.py` → writes `og-borrowing-against-your-stack-v2.jpg`.
- **Reference bump — DONE on this branch** in `borrowing-against-your-stack-head.html` (`og:image` +
  `twitter:image` → `-v2`; `…:alt` already current).
- **Passthrough — DONE on this branch:** `og-borrowing-against-your-stack-v2.jpg` added to the
  `.eleventy.js` `staticAssets` array (the `-v2` filename is new, so it needs its own entry).
- **Old asset kept:** `og-borrowing-against-your-stack.jpg` stays registered and in the repo — already
  posted/cached cards keep resolving; the `-v2` filename is what forces the re-scrape. Orphan cleanup
  can be its own later pass.
- **⚠️ VERIFY THE TITLE DIDN'T DRIFT — the intended change is the subtitle ONLY.** The title treatment
  in `build-og-borrowing-against-your-stack.py` is a *reconstruction* from the SITE_GUIDE §1363
  description ("italic-amber 'Borrowing'"), NOT a copy of the original card's script (there wasn't one).
  So when you eyeball the output, **compare it side-by-side against the currently-live
  `og-borrowing-against-your-stack.jpg`** — do not judge it in isolation. The title (wording, the
  italic-amber "Borrowing" accent, size, placement) should read the SAME as the live card; only the
  subtitle should have changed to the HODL-baseline line. A title that also shifts is an unintended
  second change — fix the script (title font/lines/accent) and regenerate before committing.
- Commit the generated JPEG on this branch → merge to main (after the hurdle card is live).

## Verify after each deploy

Wait for the Cloudflare build to report "Deployed successfully", then:
```
curl -I https://lastcoinstanding.com/og-the-bitcoin-hurdle-rate.jpg
curl -I https://lastcoinstanding.com/og-borrowing-against-your-stack-v2.jpg
```
Each **must** return `Content-Type: image/jpeg` — not the `200 text/html` fallback (the tell for a
missing/unregistered asset). Then force a re-scrape via Facebook's debugger
(developers.facebook.com/tools/debug/) and the X card validator / a draft tweet. Do not share the
hurdle URL anywhere until its `image/jpeg` check passes.
