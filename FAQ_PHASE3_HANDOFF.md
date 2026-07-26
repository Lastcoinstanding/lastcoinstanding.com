# FAQ component — Phase 3 handoff

_Temporary working note (remove before merge). Written 2026-07-26 near a context limit so a fresh
session can finish Phase 3 without reinventing Phases 1–2. Process: build on the branch, push,
verify on preview, **JM merges — do NOT self-merge.**_

## Status

- **Branch:** `faq-component`, off `main` @ `000b848`.
- **Commits:** `0cb734b` (Phase 1: component + docs) · `40d92d4` (Phase 2: migrate the 2 existing FAQs).
- **Phase 1 shipped:** the layout-level FAQ component (visible block + FAQPage JSON-LD from one
  `faq:` array) + docs (STYLE_GUIDE §6.40, NEW_PAGE_CHECKLIST §10, TECH_DEBT). All 10 §5 gates that
  applied were verified on preview via a throwaway test page (since removed; source tree clean).
- **Phase 2 shipped:** `/the-bitcoin-retirement` (5 Q) and `/discount-or-premium` (4 Q) migrated to
  `faq:` front matter; hand-rolled `<section>`, head-file FAQPage JSON-LD, and per-page `#faq` CSS
  removed on both. All gates passed (see "Phase 2 gates" below).
- **Phase 3 (LEFT TO DO — it's a MIGRATION, see the ⛔ section below):** `/bitcoin-allocation-sizing`,
  `/wait-or-deploy-now`, `/bitcoin-vs-real-estate` ALREADY have hand-rolled visible FAQs + head
  FAQPage schema (the July drafts were already shipped). Migrate each to `faq:` front matter derived
  from its SHIPPED visible text, and remove the hand-rolled section + head FAQPage + per-page CSS —
  exactly like Phase 2. A first attempt with the July drafts duplicated the FAQs and was reverted;
  branch tip is clean at Phase 2. Slugs verified present.

## Component contract (how it works)

- **Source:** one `faq:` front-matter array of `{q, a}` objects, 3–5 items. Example:
  ```yaml
  faq:
    - q: "How much bitcoin do I need to retire?"
      a: "There is no single number — it depends on…"     # may contain a curated inline <a>/<em>
  ```
- **⚠️ QUOTE every `q` and `a` value** (double quotes). FAQ prose has colons/apostrophes/em-dashes;
  an unquoted colon makes YAML invalid → **Eleventy aborts the whole build**, and on `main`
  Cloudflare silently keeps serving the last good deploy (no error). Inner HTML attrs use SINGLE
  quotes to avoid escaping (`<a href='/x'>`). No `"` inside values (none needed so far).
- **Visible block:** `src/_includes/components/page-faq.njk` — plain `h2.page-faq-title` + repeated
  `h3.faq-q` / `p.faq-a`, wrapper `section.page-faq#faq`. Included ONCE in `base.njk` **body**, after
  `{{ content }}`, before the related strip. NOT collapsible (answers in DOM on load). Site-wide CSS
  is in `base.njk` (`.page-faq …`). Self-guards: renders nothing without `faq`.
- **JSON-LD:** `src/_includes/components/faq-schema.njk` — FAQPage schema from the SAME array,
  included ONCE in `base.njk`'s `<head>` (base.njk sees front matter unconditionally; we did NOT
  route through the per-page `-head.html` files — that would be the ~40-file footgun this removes).
  Uses `| dump` (JSON.stringify escaping) + `| faqStripTags` (custom filter in `.eleventy.js`).
- **Link-handling rule:** an answer may carry a curated inline `<a>`/`<em>` in the visible block
  (`| safe`); the JSON-LD copy is **plain text** — `faqStripTags` removes the tags, leaving exactly
  the text the browser renders, so `schema string === visible textContent` by construction, even
  with a link. This is the contract, documented in STYLE_GUIDE §6.40.
- **Order on every FAQ page:** content → FAQ → related strip → feedback widget.

## Phase 2 gates + HOW each was verified (repeat these for Phase 3)

Verify on the branch preview build (see Cloudflare gotchas below re: alias lag). Drive via the
in-app browser `javascript_tool`.

1. **Renders / no-ops:** component present on FAQ pages; absent on a conceptual page + a hub
   (spot-checked power-law + calculators — both had no `.page-faq`, no `FAQPage`).
2/3. **Byte-identical (Phase 2 only; N/A for Phase 3 new content):** navigate browser to the branch
   preview page, extract `[...document.querySelectorAll('.page-faq .faq-q')].map(h=>h.textContent)`
   and the `.faq-a` answers; navigate to **production** `lastcoinstanding.com/<slug>`, extract the
   old `#faq .faq-q` / `#faq p`(or `.faq-a`) textContent; `JSON.stringify(a)===JSON.stringify(b)`.
   Cross-origin `fetch()` between the two is blocked, so capture one, navigate, capture the other,
   compare across calls. (Retirement: 5 Q byte-identical ✓. DP: 4 Q byte-identical ✓.)
4. **Valid JSON:** `JSON.parse` every `script[type="application/ld+json"]`; don't eyeball. Check an
   answer with an em-dash + apostrophe + inline link.
5. **JSON-LD ≡ visible (PROGRAMMATIC):** extract visible `.faq-q`/`.faq-a` textContent arrays AND
   the parsed FAQPage `mainEntity[].name` / `.acceptedAnswer.text`; `JSON.stringify` equality on
   both. (Both Phase-2 pages: qMatch & aMatch true.)
6. **Exactly one FAQPage per page:** count parsed blocks with `@type==='FAQPage'` (===1); confirm
   `grep '"@type": "FAQPage"'` count = 0 in the page's `-head.html` (no orphan), other JSON-LD block
   retained.
7. **Schema validity:** structurally canonical; run Google Rich Results Test on one URL for the
   external tick (couldn't from here).
8. **Order:** FAQ top-offset < related top-offset (feedback is after related in base.njk).
9. **375px:** resize mobile; no horizontal overflow, `.page-faq` within viewport. Not collapsible →
   no tap-target concern.
10. **No console errors:** `read_console_messages onlyErrors` on each page.

## DP curly-vs-straight apostrophe correction (deliberate)

`/discount-or-premium`'s **visible** FAQ used a curly `’` (`&rsquo;`) but its old **JSON-LD** used a
straight `'` — a real schema/visible drift (the exact thing the single source fixes). Phase 2 front
matter uses the **curly** `’` so the visible stays byte-identical to `main` (gate 3); the regenerated
JSON-LD is therefore curly too, now matching the visible. So the new JSON-LD is *semantically*
identical to the old but not *byte*-identical (curly vs straight) — intended, not a reword.
**House typographic convention is curly `’` and em-dash `—`** — use those in new Phase 3 answers.

## Cannibalization cautions (JM, applied in the Phase-3 front matter below)

1. **Wait-or-Deploy Q2 must NOT be lump-sum-vs-DCA** — `/lump-sum-or-ladder-in` owns that query;
   two pages competing splits the signal. REWORDED to WoD's own thesis (a deeper discount to trend
   vs the rising trend erasing it). Lump-sum-vs-DCA is left for the sibling's own FAQ later.
2. **BvRE vs `/bitcoin-vs-rental-property`** — checked: BvRE = "Which Builds More Wealth?" (real
   estate broadly + buying a home); rental-property = "The Honest Comparison" (rental *as a yield
   asset*). The BvRE draft's 3 questions target general real-estate / house-buying queries, none
   touch rental income/yield → **no split needed**; wire BvRE as drafted.

## Cloudflare / Eleventy gotchas (cost real time — see memory `eleventy-cf-build-preview-gotchas`)

- One template/data error (bad `layout:`, unquoted-colon YAML) **aborts the entire build**; an
  all-pages 404 on a fresh branch preview usually = one such error, not a global problem.
- `layout:` must be `base.njk` (NOT `layouts/base.njk`).
- The **branch alias `<branch>.lastcoinstanding-com.pages.dev` lags / per-path edge-caches**, and a
  **force-push may not trigger a rebuild** (normal push does, but the alias still updates minutes
  later). Do NOT gate a just-pushed change on the alias's 404/200. Reliable checks: the
  **per-deployment `<hash>.<project>.pages.dev` URL**, and — authoritative for "did it land / is the
  scaffold gone" — the **source tree** (`git ls-tree -r origin/<branch>`).
- Prefer normal commits over force-push when you need the alias to reflect the push.

## ⛔ Phase 3 is a MIGRATION, not a fresh add — SCOPE DISCOVERY (2026-07-26, mid-session)

**The build prompt was wrong that only 2 pages carry FAQs.** All THREE Phase-3 pages already have
**hand-rolled visible FAQ sections AND head-file FAQPage JSON-LD** (verified: `bitcoin-allocation-sizing`
4 Q, `wait-or-deploy-now` 3 Q, `bitcoin-vs-real-estate` 3 Q — visible `#faq` section + a `"@type":
"FAQPage"` block in each `-head.html`). The July drafts in `claude/FAQ_BLOCKS_AND_SCHEMA.md` were
already shipped by hand (rollout step 2). So Phase 3 is a **migration exactly like Phase 2**, NOT a
fresh add.

**What I did and reverted:** I wired the July-draft `faq:` front matter (commit `ae53da9`), which
created **duplicate** visible FAQs + duplicate FAQPage schema on all 3 (gate 6 = 2 blocks). Caught
via the allocation `faqPageBlocks: 2` check. Reverted those 3 files back to the Phase-2 state in the
next commit; branch tip is clean (Phase 1+2 only). **Do not re-apply the draft YAML blindly** — it
may not match the shipped visible text and would re-duplicate.

**Correct Phase-3 method (per page, mirror Phase 2):**
1. Read the SHIPPED visible FAQ (`#faq` section in the njk) and the head-file FAQPage block.
2. Derive `faq:` front matter from the **shipped VISIBLE text** (entities → literals, curly `’`,
   em-dash `—`, `×`; keep any inline `<a>` with its exact href, single-quoted attr). Match the live
   page, NOT the July draft.
3. Remove the hand-rolled visible `<section>`, the head-file FAQPage block (keep the other JSON-LD),
   and any per-page `#faq` CSS.
4. Verify byte-identical vs production (Phase-2 method) + gates 4/5/6/8/9/10.
- **Caution 1 (WoD Q2):** check the SHIPPED wait-or-deploy Q2. If it's the "lump sum vs DCA"
  question, reword off it (owned by `/lump-sum-or-ladder-in`) — a reworded version is drafted below.
  If the shipped Q2 is already something else, reconcile rather than blindly replacing.
- **Caution 2 (BvRE):** re-check the SHIPPED BvRE questions vs `/bitcoin-vs-rental-property`
  (BvRE owns general real-estate/home-buying; rental-property owns rental-as-yield). My earlier read
  of the *draft* questions found no split needed, but verify against what's actually shipped.

---

### DRAFT reference only (July `FAQ_BLOCKS_AND_SCHEMA.md` text — SUPERSEDED by shipped; reconcile, don't paste blindly). Curly `’`, em-dash `—`, `×`. Single-quoted inner `<a>`.

### `/bitcoin-allocation-sizing` (src/bitcoin-allocation-sizing.njk)
```yaml
faq:
  - q: "How much bitcoin should I have in my portfolio?"
    a: "There is no universal percentage — the honest question is what different allocations do to your portfolio, in both directions. This tool shows the growth and the drawdown consequences of 1%, 5%, 10%, or any allocation you choose, so you can find the size whose bad case you can actually live with."
  - q: "What happens to my portfolio if bitcoin crashes?"
    a: "The crash view models exactly that: pick a drawdown depth (including the historical worst cases) and a recovery path, and watch what it does to the whole portfolio at your chosen allocation. A tool that only showed the upside would be marketing; this one lets you stress the downside as hard as you like."
  - q: "Is a small bitcoin allocation even worth it?"
    a: "Sometimes yes, and the math is the point: because bitcoin’s historical growth has been so much higher than other assets’, even small allocations can move the long-run outcome materially — while keeping the crash exposure small. Run it both ways and compare; the numbers are all reproducible."
  - q: "Should I rebalance my bitcoin allocation?"
    a: "That is a real decision with real tradeoffs — trimming after surges caps both risk and upside, and in a taxable account each trim is a taxable event. The sibling page <a href='/disciplined-rebalancing'>Disciplined Rebalancing</a> treats it fully."
```

### `/wait-or-deploy-now` (src/wait-or-deploy-now.njk) — Q2 reworded per caution 1
```yaml
faq:
  - q: "Should I buy bitcoin now or wait for a dip?"
    a: "This page’s whole argument is that the question is subtler than it looks: because the Power Law trend rises with time, waiting for a lower fraction of trend can still mean paying a higher price if the wait is long enough. The tool lets you compare deploying now against waiting, across the historical record, rather than guessing."
  - q: "Is it worth waiting for a bigger discount to trend?"
    a: "That is the tradeoff this page makes visible. A deeper discount to trend is only a better entry if it arrives before the rising trend erases the saving — and how long the market stays cheap is not predictable. Deploying earlier has historically beaten waiting more often than not; the tool shows the full distribution, including the periods where waiting won."
  - q: "Can you time the bitcoin bottom?"
    a: "The record shown here suggests you should not plan on it. Below-trend entries have historically been attractive, but how long the market stays below trend is not predictable — which is precisely the tradeoff this tool makes visible instead of hiding."
```

### `/bitcoin-vs-real-estate` (src/bitcoin-vs-real-estate.njk) — wire as drafted (caution 2: no split)
```yaml
faq:
  - q: "Is bitcoin a better investment than real estate?"
    a: "Looking back, the comparison is not close — and the retrospective calculator shows the actual numbers for any start year you choose. Looking forward is a different question, which the projection mode treats under stated assumptions rather than as a verdict. Both views show their work."
  - q: "Should I buy a house or buy bitcoin?"
    a: "This page will not answer that for you — housing is shelter as well as an asset, and the honest comparison includes mortgage leverage, maintenance, taxes, and the value of living in what you own. What it will do is put real numbers on the tradeoff you would otherwise make on instinct."
  - q: "Does real estate hold its value better than bitcoin?"
    a: "Real estate is less volatile year to year; over the long span the comparison inverts. The page shows both facts rather than choosing one — volatility and long-run purchasing power are different questions, and conflating them is how most of this debate goes wrong."
```

**Placement:** `faq:` goes as a top-level front-matter key (after `related:`/`companion:`, before
`eleventyComputed:`). But per the discovery above, **derive the values from each page's SHIPPED
visible FAQ (byte-identical), not from this draft** — and in the SAME change remove that page's
hand-rolled `<section>`, its head-file FAQPage block, and its per-page `#faq` CSS. Voice-pass, flag
don't-rewrite. Normalize EOL (CRLF), commit, **normal push** (not force — alias won't rebuild),
run the gates. Remove THIS file before merge.

## Progress log
- [x] Phase 1 (component + docs) shipped — `0cb734b`.
- [x] Phase 2 (retirement + DP migrated) shipped + all gates passed — `40d92d4`.
- [x] Phase 3 attempted with July drafts (`ae53da9`) → found duplicate FAQs (pages already had them)
      → **reverted** the 3 front-matters back to Phase-2 state. Branch tip clean (Phase 1+2 only).
- [ ] **Phase 3 REDO as a migration** of `bitcoin-allocation-sizing`, `wait-or-deploy-now`,
      `bitcoin-vs-real-estate`: derive `faq:` from each page's shipped visible FAQ; remove the
      hand-rolled visible section + head FAQPage + per-page `#faq` CSS; verify byte-identical + gates.
- [ ] Confirm gate 6 = exactly ONE FAQPage per page after migration (the bug that surfaced this).
- [ ] Remove `FAQ_PHASE3_HANDOFF.md` before merge.
