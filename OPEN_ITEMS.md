# Open Items Tracker — Last Coin Standing

> **Migrated into the repo 2026-08-08.** Previously a project-only doc under the now-retired `claude/` location prefix; moved to repo root — tracked, alongside `TECH_DEBT.md` and `PAGE_IDEAS_BACKLOG.md` — so it can be read and updated directly in-session. Unreadable project-only copies had drifted (this tracker twice), which is why the split was retired. Everything below is the verbatim authoritative export as of the move; not rewritten. Internal `claude/…` cross-references below are pre-migration paths — the migrated planning docs now live at repo root without the prefix.

_Created 2026-07-23. The single running list of dated, in-flight items across all workstreams — each
points to the doc that holds the detail. Reminders marked ⏰ are scheduled to fire back into the Cowork
session automatically. Close items here when done; this file is the "what's cooking" view, not the plan
(plans live in the linked docs)._

---

## In flight (dated)

- [ ] **MERGE-ORDER RECONCILIATION — `feat-the-rundown` drops its old-pattern icon lines.**
  Recorded 2026-08-29, before the brand branch merged. `feat-brand-mark-adoption` **landed
  first** and made `components/head-icons.njk` the single source for the favicon cascade,
  removing the icon block from all 52 per-page `-head.html` files. `feat-the-rundown` was
  branched before that and its `the-rundown-head.html` still carries **5 old-pattern icon
  `<link>` lines**. **Before or at that branch's merge**, delete those 5 lines so the page
  inherits the shared include like every other page; leaving them renders the cascade twice.
  Git will not flag it — the Rundown's head file is a new file on its branch, so there is no
  textual conflict, only a duplicated block in the built page. **Neither branch reverts the
  other**; the collision is additive. Detail: `SITE_GUIDE` (icon include) and the Rundown's
  own unlisted-preview record.

- [ ] **Aug 6 (Thu) — WDCB launch thread.** Draft delivered (wdcb-thread-draft.md, 2026-08-05);
  morning-of: verify figures against live page, X-card scrape, essay reciprocal link first, chart
  export, post AM window, pin. Day-3 IRR beat + Day-7 harvest per X_STRATEGY_PLAYBOOK §7. This
  jumps the queue ahead of the Discount-or-Premium pilot (JM-agreed); DoP becomes next week's
  anchor with fresh numbers.

- [ ] **OVERDUE (was Jul 26) — Sitemap status recheck.** Formality — JM screenshot already showed
  "Success" (Jul 24). Close if still green. Detail: `SEO_AUDIT.md`.

- [ ] **OVERDUE (was Jul 27) — Satos Awards nomination.** 5-minute procedure; drafted texts in
  `CREATOR_CREDIBILITY_KIT.md` §7. Confirm the window is still open — if it has closed,
  record that and close the item.

- [ ] **OVERDUE (was Jul 27) — Pilot publish (X thread + video script).** Superseded in part: WDCB
  is now the first anchor thread (Aug 6); Discount-or-Premium becomes the week-2 anchor with
  refreshed numbers. The video script half still needs its own date.

- [x] **CLOSED-BY-RULING (2026-08-28) — Open-source decision call (JM), and the OpenSats/grant lane
  with it.** JM ruled: pursue conventional commercial pathways (licensing / platform, fractional),
  **not** open-sourcing plus small grants. **The code stays proprietary**, which resolves the pending
  open-source scope question, and the **OpenSats application drafted 2026-08-11 (Aug 24–28 window) is
  shelved unsubmitted**. The two reference letters are no longer on the critical path for this
  decision — Tom (Satsback) and Joe Bryan are owed courtesy release notes (JM's action, tracked
  project-side, not here). The `OWN_JOB_STRATEGY` §1 grants-vs-employment interaction is **moot**:
  with the grant lane retired there is nothing for employment to substitute against. Full record:
  `FUNDING_STRATEGY.md` (ruling at the head of the doc; Path 1 retired, lanes reordered).
  `OPENSOURCE_DECISION_BRIEF.md` and `GRANTS_RESEARCH_KIT.md` become reference material rather than
  live lanes. **Unchanged by this ruling:** the reader-facing promise — permanently free, ad-free,
  no funnel, verifiable in the browser. Free-to-use and open-source were always different
  commitments and the site only ever made the first.

- [x] **DONE (2026-08-10) — Dashboard build (v1, anchor destination). LIVE IN PRODUCTION.** Built as
  **`/dashboard`** on `feat/dashboard-v1` (build `fd00ee2`, OG `897fa46`), **merged via PR #43 as
  `8d184bc`** and auto-deployed. **Post-deploy verified on production:** four §10 curls all pass,
  canonical clean, OG serves `image/jpeg` (200), tiles compute live in-browser (0.43× / near the
  floor, "Today (live)"). Five live-compute-only tiles + a six-link jump-back-in row; `?pos=` carried
  into the two existing receivers only; no nav slot (`category: hub`, surfaced via `/calculators` tile
  + homepage Latest card); ribbon suppressed on-page. The v1 fence held: zero new data sources, zero
  new monthly-refresh lines. Full record: `SITE_GUIDE §47`; backlog entry shipped. **One follow-up
  remains: the chip (below); OG handback closed below.**

- [x] **CLOSED-AS-RESCOPED (2026-08-10) — Dashboard follow-up #1 — the channel-position chip.**
  Resolved in **dashboard v2** (`feat/dashboard-v2`, PR pending) **without building a separate chip
  element**: the site-wide **channel ribbon** (§40) was repointed from `/the-power-law` to `/dashboard`
  with a "see where we are →" CTA — the ribbon already reads channel position on every page, so it IS
  the site-wide entry the chip would have been. The deferred **companion reciprocal back-links** shipped
  in the same PR (`/dashboard` added to Wait-or-Deploy + How Much Cash `related:`). Full record:
  `SITE_GUIDE §47` v2 block.
  - **AMENDED 2026-08-18 — the rescope left a real gap, now closed.** "The ribbon IS the site-wide
    entry" held on desktop but **not on mobile**: the ribbon `display:none`s its links ≤480px (the
    documented narrow-viewport degradation), and the dashboard had no nav entry on either breakpoint,
    so on a phone there was no path to the page from the menu at all, and none from most pages. The
    dashboard now carries a **hardcoded flat nav anchor in the mobile overlay** ("The Dashboard",
    beside The Gallery) — hub-category pages reach the nav only by being hardcoded, which is the
    detail the original rescope missed. **Desktop stays ribbon-only for now:** a matching desktop
    anchor was built and measured, then reverted before merge because the desktop row has no capacity
    for a 7th item (it wraps the wordmark and grows the nav below ~1150px, and clips "About" below
    ~919px). That is acceptable on desktop precisely because the ribbon keeps its links there. Filed
    as *Desktop nav capacity + The Dashboard entry* in PAGE_IDEAS_BACKLOG. See `SITE_GUIDE §47`.
    **Lesson for future rescopes: a surface that degrades responsively cannot be the sole entry point
    for anything** — check what it looks like at the breakpoint where it sheds elements before
    accepting it as a replacement for a dedicated one.

- [x] **DONE (2026-08-10) — Dashboard OG card handback (`og-dashboard.jpg`).** JM handed back the
  1280×720 JPEG (93 KB); committed (`897fa46`) and registered in `.eleventy.js` `staticAssets`.
  **Production-verified after merge:** `curl -I https://lastcoinstanding.com/og-dashboard.jpg` →
  `200 · Content-Type: image/jpeg` (95080 bytes) — no phantom-200.

- [ ] **~Aug 11 (early next week) — Substack essay: The Bitcoin Hurdle Rate.** Page is live and
  final (`/the-bitcoin-hurdle-rate`, prod 2026-08-07). JM writes the prose himself — personal
  register is his (Bitcoin Exit precedent). Follow the page's CORRECTED framing: the bar is high,
  and most bars are set far too low; the *declining* hurdle is a precision refinement, not the
  finding. Likely sharpest concrete moment: the idle-treasury passage. Hold the
  surplus-capital-at-the-margin limit — it keeps the essay publishable rather than promotional. At
  publish: reciprocal link both ways (essay ↔ page), the Exit precedent nearly missed it.

- [ ] **~Aug 13 — Monthly refresh due.** PL_DATA append + as-of strings + CLARITY check + MSTR/STRC
  snapshots + Bull & Bear triggers. /discount-or-premium needs nothing beyond the shared PL_DATA
  append (all figures live-computed, incl. the duration record).

- [ ] **Late Aug — SEO performance re-tune** (first Search Console read; + deferred
  /the-bitcoin-horizon retitle). Detail: `SEO_AUDIT.md`.

## Own-job / industry outreach — status: NEW workstream (2026-08-05)

Strategy doc created: **`OWN_JOB_STRATEGY.md`** — door-agnostic positioning (full-time /
fractional / licensing), both-tier target map (Fidelity DA, Bitwise, Onramp, Swan, Unchained,
River, NYDIG, DACFP, bitcoin-native RIAs), the two structural rules (sell the capability never the
site; the register is the differentiator), compliance notes, outreach gate (~mid-Sept: capability
one-pager + real metrics + 4–6 threads running).

- [ ] **JM ruling:** parallel track vs FUNDING_STRATEGY reorder + confirm the site-independence
  red line (doc §8.1).
- [ ] **Claude:** capability one-pager draft (after WDCB thread ships).
- [ ] **JM:** NotebookLM corpus start (doc §7 list).
- [ ] **Claude:** top-3 deep-dive briefs (Fidelity DA, Bitwise, Onramp) — on JM's go.

## Get Updates (Substack-first) — status: SHIPPED + fully bookkept (2026-08-05)

Merged `--no-ff` as **`b5d4b4f`**; follow-ups on main: `408350d` (K1 SHA fill), `9a401fb` (§10 date
line), + a date-reset commit. Production verified on all three page types. Feature branch deleted.
K1/K2/K3 in-repo ✓, K4 project-side ✓ (REACH_GROWTH_PLAN #5 LIVE with path + SHA), K5 export ✓,
**mirror ✓ (2026-08-05):** PAGE_IDEAS_BACKLOG (`c75443da…`), SITE_GUIDE (`c8057569…`),
MONTHLY_REFRESH_CHECKLIST (`346e7bec…`) replaced at their exact project paths (content-verified:
§44 present, `b5d4b4f` annotations, CRLF intact).

**Date convention — resolved to real-clock (option b).** Mirrored checklist reads 2026-08-05; no
2026-08-07 strings remain. Standing rule: **refresh lines and as-of strings use the real clock
date, never forward-dated.** Residual: confirm the date-reset commit is pushed to main.

Remaining tail:
- [x] **§10 SEO/ship verification — DONE (2026-08-10).** Ran the four `NEW_PAGE_CHECKLIST` §10 curl
  checks against a live affected page (`/the-bitcoin-hurdle-rate`): `gtag|googletagmanager`=2,
  `rel="canonical"`=1, `og:image`=5, `application/ld+json`=2 — all ≥1, plus the Get Updates surface
  itself present (`substack.com/subscribe` link=1). The §10 export/verification tail is closed;
  nothing outstanding on the ship side.
- [ ] **First signal check (~mid-Aug):** Substack subscriber dashboard + `utm_source=site` (+ now
  `utm_source=x` from the thread) — the honest baseline for the metrics one-pager, which the
  own-job workstream also needs.

## Discount, or Premium? — status: COMPLETE + Phase 4 shipped

Page fully launched 2026-07-25 (all phases, polish rounds, SEO 10/10, OG, carousel video, phone pass)
**plus same-day Phase 4:** the time-to-trend duration record — labelled fastest/median/longest slider
markers (off-scale/above-range handling, collision stacking, mobile fallback), the episode strip with
open-ended ongoing bar, two-sided premium flip, dead-band hidden. Commits `7799667` + `21eba9b`.
Independently verified on production (12 checks + duration recompute reconciles exactly). Spec: repo
design doc §9 Phase 4.

Remaining tail:
- [ ] **X card scrape** for the page (+ the four retitled pages) — now due before its week-2 thread.
- [ ] **Branch prune — NEEDS RE-SCOPING.** Tracker said "13 merged dp branches," but Claude Code's
  clone (2026-08-05) shows **no `dp/*` branches at all** — only `feat/daily-conviction` and
  `feat/daily-conviction-v11` remain. Re-verify with `git branch -a` before acting.
- [ ] **JM eyeball of the labelled slider markers on production** (fastest/median/longest row).
- [ ] **Optional cue-line harmonization (JM call, open):** cue cites the single 2022 precedent
  (16 months) vs the slider's full record (median ~14, longest ~21).

## Next-steps queue (proposed 2026-07-25; amended 2026-08-05)

1. **X strategy playbook — now RUNNING** (WDCB thread Aug 6 = anchor #1; DoP = anchor #2).
2. ~~**Reference-letter outreach (JM)** — critical path for the open-source decision.~~ **CLOSED
   2026-08-28** with the grant lane (above): no longer critical path. Courtesy release notes to the
   two referees are JM's, tracked project-side.
3. **Geyser page + V4V confirmation (top-10 #4).** Still available as a zero-strings channel, but
   **no longer part of a funding lane the strategy depends on** — the 2026-08-28 ruling made the
   commercial lanes primary. Do it if wanted, not because the plan needs it.
4. **YouTube pilot video (top-10 #10)** — film from the refreshed script.
5. **Next build: Retirement scenario comparison (top-10 #8)** — design doc first (after dashboard).
6. **STRC below-par examination (top-10 #9)** — ✅ **SHIPPED** as `/the-strc-mechanism`, live in production (carousel slide 36). Was stale in this queue — the page deployed before the 2026-08-05 amend.

## In flight (undated / JM quick tasks)

- [x] **DONE (2026-08-08) — Hurdle Rate v2 below-trend-language sweep, the pre-production gate.**
  Whole-page grep for the listed advocacy words, judged in context, before merge:
  - **"optimistic" / "the upside" / "while it lasts"** — absent (the v1 "optimistic edge" card was
    reworked into the neutral position-adjustment card at build time).
  - **"opportunity"** — every instance is "opportunity cost" (the page's thesis, explicitly exempted)
    or neutral ("reinvestment opportunities", "act on opportunities during a drawdown"). Not advocacy.
  - **"discount"** — sole instance names *both* "a discount or a premium" in the `/discount-or-premium`
    cross-link. Neutral.
  - **"edge"** — all geometric (band-edge references in code comments); the one user-facing instance,
    the near-touch caption's "floor-path edge", was tidied to "floor case" to match the legend rename
    (removes the literal word too). Not advocacy in any instance.
  Verified at the simulated above-trend position (`?k=1.5`) across every new/changed string over the
  build (the sweep caught and fixed one non-neutral near-touch draft, `99a00d9`). Neutral copy fenced
  from build (`efb958e`); decline-as-headline demoted in meta/JSON-LD/FAQ5/"what would break this?"
  (`ca43d85`); floor-path-edge tidy shipped with the merge. **Read as written and found genuinely
  swept — no advocacy language remains.**

- [ ] **The Bitcoin Exit essay → reciprocal link to /what-daily-conviction-bought** — do BEFORE
  Thursday's thread (closes the thread → tool → essay loop).
- [ ] **Eyeball the three new FAQ sections** (allocation, wait-or-deploy, BvRE; desktop + 375px).
- [ ] **X card re-scrape — four retitled pages:** /bull-and-bear-cycles, /borrowing-against-your-stack,
  /disciplined-rebalancing, /lump-sum-or-ladder-in.
- [ ] **X card re-scrape — /the-strc-mechanism** (renamed from /strc-below-par, 2026-08-10; do AFTER merge,
  and after the new OG card lands — see the handback below).
- [ ] **OG card handback — `og-the-strc-mechanism.jpg`** (STRC overhaul, `feat/strc-mechanism`). The head
  still points `og:image` at the old `og-strc-below-par.jpg` (kept served — no phantom-200) until the
  drafting chat generates the new product-forward card for "The STRC Mechanism"; then Claude Code registers
  it in `.eleventy.js` `staticAssets` and repoints the meta. Post-landing: `curl -I …/og-the-strc-mechanism.jpg`
  → `image/jpeg`.
- [ ] **STRC daily-close Action — first live confirmation (post-merge).** `workflow_dispatch` isn't available
  until the workflow is on `main` (GitHub limitation), so it couldn't run pre-merge. After merge, run one
  `gh workflow run strc-daily-close.yml` and confirm the green run + the `data(strc):` commit; then the
  weekday schedule maintains it. Monthly silent-death check is in `MONTHLY_REFRESH §7.6`.
- [ ] **LinkedIn update (Satmo / Joe Bryan)** — JM personal, timing his call.

## Working notes (pipeline learnings)

- **EOL is per-file, not per-repo** — check the HEAD blob. (Recurred on get-updates; standard now:
  never convert encodings through PowerShell string round-trips.)
- **Mirror refreshes: hash-gate the handoff.** The 2026-08-05 mirror caught a stale-Downloads
  handoff purely via the SHA-256 check. Always export fresh from the working tree and verify.
- **Real-clock dating, never forward-dating** — resolved 2026-08-05.
- **Assets land before merge** — bridge-commit binaries pre-merge; missing referenced asset = stop.
- **Chart.js legend + usePointStyle hides borderDash** — custom generateLabels must also carry
  fontColor. Site-wide audit now tracked in TECH_DEBT §1 (moved 2026-08-08).
- **curl verifies the bundle, not the pixels** — "pixel-probe what you visually changed."
- **CF Pages branch alias lags** — use the per-commit deployment URL for eyeball passes.
- **Grok Imagine:** open sky/horizon/scale prevent "dank" drift; JM's register is "mysterious,
  almost sci-fi," not creepy.
- **Branch discipline:** "create branch FIRST" stays explicit in prompts.

## Recently closed
- [x] **Get Updates — SHIPPED + full bookkeeping closed** (`b5d4b4f` + follow-ups, 2026-08-05).
- [x] **Discount, or Premium? — Phase 4 + labelled duration markers** (`7799667`, `21eba9b`,
  2026-07-25).
- [x] **Discount, or Premium? — FULL LAUNCH** (2026-07-25).
- [x] **Chart-copy export bug** (`b0919f5`); **SEO passes 1–2**; **robots.txt + AI-crawler policy**
  (`eccea6a`); **Bull & Bear carousel video** (2026-07-23/24).
