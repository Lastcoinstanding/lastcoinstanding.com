# Tech Debt — Last Coin Standing

A running list of known issues, inconsistencies, and architectural improvements identified during ongoing work but deferred from immediate sessions. Items here are deliberately not blocking to ship — they're tracked so we can prioritize and address them in dedicated cleanup passes rather than losing them in chat history.

**Guiding principle:** consistency-by-default across all pages and all new pages; introduce inconsistencies only when there's a clear rationale. Items below are usually ones that violate this principle, or that capture a strategic decision worth making deliberately rather than drive-by.

## Conventions

- **Status:** `- [ ]` open, `- [x]` closed
- **When closing:** move to "Recently closed" with the commit SHA
- **When adding:** keep entries terse; deep context lives in the relevant commit message (`git log --grep` works well)
- **Bundles:** when one item is a sub-task of another, indent under the parent

---

## 1. Architecture & DRY

_(no open items)_

## 2. Type system compliance

- [x] **Coordinated §5.2 sweep across calculator/explorer-tier pages.** Multiple selectors per page violate STYLE_GUIDE §5.2 ("Cormorant at <1.3rem with weight ≥600"). The prescribed fix is mechanical — drop weight from 600 → 500 — but the surface area is large enough that it warrants a single coordinated pass with screenshot review. Status by page:
  - **Half-Life** — [x] complete in commit `d375426`. Six selectors fixed (`.tl-ttl`, `.callout .c-t`, `.lk .lk-type`, `.tk h3`, `.scenario-prompt`, `.sp-type`). Note on provenance: these fixes were sitting as uncommitted local edits in `the-half-life.css` from a prior session and were swept into the Fixed Pie commit by `git add -A`. Surfaced and documented post-commit. The `.section-title` selector originally listed in this entry is at clamp(1.3rem,...) — at the §5.2 floor, not below — so not a strict §5.2 hit; the calc-tier wt-600 deviation is captured on item #5 instead.
  - **Power Law** — [x] complete in commit `6359515`. One selector (`.section h3`, the one originally flagged in commit `fdce1fc`) fixed via uncommitted prior-session work surfaced after the Half-Life sweep-up incident.
  - **Melting Ice Cube** — [x] complete in commit `6359515`. Ten selectors fixed: `.section-title`, `.vp-name`, `.slider-header .sl-value`, `.takeaway h3`, `.cq-title`, `.chart-title`, `.ys-year`, `.cos-val` (wt 700 → 500), `.co-name`, `.results-header h3`. Same provenance as Half-Life — uncommitted prior-session work surfaced and shipped deliberately this time. This effectively closes the audit gap noted on commit `31c0f58`.
  - **Real Estate** — [x] audited 2026-04-28 during the coordinated-sweep verification; **no §5.2 hits**. Page uses Cormorant at clamp(2.4rem,5vw,3.8rem) wt 300, clamp(1.6rem,3vw,2.2rem) wt 400, and 1.7rem/2rem/2.2rem wt 600 (all ≥1.3rem). Cleanest of the calc-tier on this anti-pattern.
  - **Fixed Pie** — [x] complete in commit `d375426`: 9 selectors fixed (`.tab-btn .tab-title`, `.sc-name`, `.chart-heading`, `.slider-header .sl-value`, `.takeaway h3`, `.kf-text h4`, `.cagr-section h3`, `.projection-section h3`, `.proj-control label span`).
  
  Process improvement learned from Fixed Pie audit: when a calc-tier page comes up for screenshot review, audit the FULL §5.2 surface — every Cormorant selector with size <1.3rem and weight ≥600 — not just the most visually-prominent offenders. This avoids the kind of retroactive miss noted on MIC above.
  
  Process improvement #2 (from the Half-Life sweep-up incident): always run `git status` before staging to confirm only intended files have changes; uncommitted work from prior sessions can otherwise hitchhike on focused commits without notice.
  
  Process improvement #3 (from 2026-04-28 verification session): when the user authorizes a "coordinated sweep" across multiple pages, **first run `git status` and `git log --oneline -10` to establish a true baseline state**, BEFORE running an audit. The placeholder text `<this commit>` on TECH_DEBT.md item #2 misled this session into believing the sweep was outstanding when it had actually been completed in commits `d375426` and `6359515`. An hour of audit work was no-op'd against an already-fixed working tree.
  - [x] Bundle here closed: Power Law `.section h3` (1.2rem wt 600) fixed in `6359515`.

- [x] **Mobile-floor sweep — Half-Life and Power Law caps labels.** Audit on 2026-04-28 found 5 selectors below STYLE_GUIDE §2.3's 0.7rem mobile floor that aren't compensated by §2.1's smallest-label slot tracking spec (0.65rem requires letter-spacing ≥0.2em). Closed in commit `dcb9470`.
  - **Half-Life** — `.header-quote cite` (0.65 → 0.7rem), `.lk .lk-label` (0.65 → 0.7rem), `.sp-label` (0.65 → 0.7rem)
  - **Power Law** — `.calc-field label .opt` (0.68 → 0.7rem), `.calc-card .period-label` (0.68 → 0.7rem)
  
  All 5 fixes preserve weight/color/tracking — only size moved.

## 3. Sales-readiness

- [x] **OG card audit.** Two-phase audit completed 2026-04-28.
  
  **Phase 1** (commit `a99fcde`) — mechanical: added `og:image:alt` and `twitter:image:alt` to all 15 pages (was: 0 pages); standardized title separator to em dash on the 3 outliers (`bitcoin-vs-real-estate`, `the-bitcoin-migration`, `the-fixed-pie`); added missing `og:image:type` on 2 pages; **fixed real bug** — `the-bitcoin-migration` declared `og:image:width=1200, og:image:height=630` but the actual file is `1280×720`, which would have caused cropping on platforms that respect declared dimensions for layout (Facebook, LinkedIn).
  
  **Phase 2** (commit `47db5f5`) — editorial: enriched `og:title` and `twitter:title` on 6 pages from bland `[Page] — Last Coin Standing` to rich `[Page] — [Why framing]`, matching the existing pattern on Synthesis / Trilemma / Bubble / Money Trees / What Bitcoin Is. About left intentionally minimal (about pages don't benefit from hooks). Pattern preserved: browser `<title>` stays minimal/branded, only OG/Twitter titles carry the rich framing.
  
  Verified during audit: all 16 OG image files present at correct 1280×720 dimensions, all properly registered in `.eleventy.js` staticAssets list, all visually consistent with site brand template (dark background, Cormorant title, italic tagline, glowing Bitcoin glyph, brand header + URL footer).

## 4. Width treatments

_(no open items)_

## 5. Cross-page strategic — biggest open item

- [ ] **STYLE_GUIDE §2.1 vs. calculator/explorer-tier actual practice.** Five pages (Power Law, Half-Life, Fixed Pie, Melting Ice Cube, Real Estate) share a near-identical type system that diverges from §2.1's canonical scale in the same direction:
  
  | Slot | Tier-actual | §2.1 canonical |
  |---|---|---|
  | h1 | `clamp(2rem,4.5vw,3rem)` wt 600 | `clamp(2rem,4vw,3.4rem)` wt 500 |
  | h2 | ~1.5rem wt 600 | `clamp(1.8rem,3.4vw,2.6rem)` wt 500 |
  | h3 | 1.1–1.2rem wt 600 | `clamp(1.4rem,2.4vw,1.8rem)` wt 500 |
  | body | 0.95–1rem | 1.05rem |
  
  Two paths:
  - **(a) Codify the practice.** Amend §2.1 to add a calculator/explorer-tier scale. Less work, ships fast, accepts the smaller/heavier feel as deliberate.
  - **(b) Migrate upward to §2.1.** Apply §2.1's stated values to all five pages. Bigger headings, lighter weight, bigger body — visually significant change; pages would feel more publication-grade, like Migration / Horizon.
  
  Sales context: (b) reads as more publication-grade and substantial; (a) preserves the dense-utility feel of the calculator pages. Worth a deliberate decision.

- [ ] **Calculator-tier font register — Inter or Outfit?** All five calc-tier pages currently use Inter (the editorial register, per STYLE_GUIDE §1 tier system). A case can be made they're closer in character to system-diagrammatic — chart-and-control surfaces, technical descriptors, less reading prose — and would benefit from Outfit's geometric/schematic feel (the same rationale that justified keeping Outfit on Synthesis + What Bitcoin Is in commit `6c6c7c2`). Worth deciding in coordination with the §2.1 scale question above: same five pages, same coordinated-sweep risk profile, and the two decisions interact (Outfit at the existing tier-actual sizes vs. Outfit at canonical §2.1 sizes vs. Inter at either — four possible end states).

## 6. Page-specific minor / design judgment

Items where the right call needs either visual review or a designer's judgment rather than a mechanical fix.

- [ ] **Real Estate pull-quote pattern** (`bitcoin-vs-real-estate.njk` L123). Uses Cormorant upright with italic em emphasis on "postponed". §6.3 says pull-quotes on dark should use Source Serif italic, but the partial-italic case isn't explicitly covered. Worth review during eventual site-wide pull-quote consolidation.

## 7. Audit gaps (process improvements)

- [x] **Phase 5 §5.7 audit was incomplete — Real Estate-only fix.** The prior session's "all 10 anti-patterns resolved" status missed Not-a-Bubble — DM Sans was still being loaded and used as `--font-body` site-wide on that page. Caught and fixed in commit `89011ea`. Process implication: when running anti-pattern audits, grep all `_pageassets/*-head.html` AND all `_pageassets/*.css` for the offending pattern, not just the page where the issue was first noticed.

- [x] **§5.7 sweep — closed via split decision (commit `6c6c7c2`).** Site-wide grep on 2026-04-27 found 4 pages with non-canonical sans-serifs. Resolution split along page-character lines rather than uniform consolidation:
  - `index` — DM Sans → Inter (`6c6c7c2`)
  - `money-trees` — DM Sans → Inter (`6c6c7c2`)
  - `synthesis` — Outfit → **kept** (documented in STYLE_GUIDE §1 as canonical for system/diagrammatic pages)
  - `what-bitcoin-is` — Outfit → **kept** (same rationale)
  
  Rationale: Outfit's geometric/schematic character actively reinforces the diagram-spec voice on Synthesis + What Bitcoin Is in a way Inter would soften. Editorial pages (reading-prose) get Inter; system/diagrammatic pages (the page IS a structural specification) get Outfit. STYLE_GUIDE §1 amended to codify the tier system + forward-looking guidance for new pages. §5 item 7 reframed from "consolidate to Inter" to "choose by page register".

- [ ] **not-a-bubble.js DM Sans → Inter swap (residual from §5.7 sweep).** ~25 hardcoded `'DM Sans', sans-serif` references in Chart.js options + `ctx.font` canvas declarations (L160–728 in `src/_includes/_pageassets/not-a-bubble.js`). Not part of the §5.7 CSS sweep — these are chart-label rendering where DM Sans's narrower metrics may have been deliberately chosen for tight numeric labels. Decision criteria: do the chart labels visibly degrade if swapped to Inter? Mostly low-risk swap (both humanist sans), but warrants screenshot-verified pass rather than blind global replace. Page is on the editorial register (not system-diagrammatic) so the canonical choice is Inter; question is whether the chart-rendering context wants something different.

---

## Recently closed

Move items here when shipped, with commit SHA. Keep the last 5–10 for reference; archive older ones to git history when this section gets long.

- [x] **Width outliers vs. canonical 960px — formalized as deliberate tiers (STYLE_GUIDE §4.2 revision, no code change).** Audit revealed a richer reality than the original TECH_DEBT flag suggested: alongside Trilemma (1080px) and Not-a-Bubble (1152px), Synthesis and What Bitcoin Is *also* sit at 1140px — outside the original §4.2 "up to ~1100px" ceiling, just unflagged. The actual practice across the site is a coherent two-tier system plus one mixed-content pattern, which §4.2 was under-describing. Revised §4.2 to formalize: (1) **Editorial tier 960px** for prose-led pages (the canonical, used by 10+ pages including Power Law, Half-Life, Migration, Horizon); (2) **System-diagrammatic tier ~1140px** for SVG-led / interactive-diagram pages (Synthesis 1140, What Bitcoin Is 1140, Trilemma 1080) where horizontal stage-room serves the centered visual; (3) **Mixed-content pattern** for pages with a hero chart that needs page width but a closing essay that needs prose-grade line-length (Not-a-Bubble 1152 page + 44rem essay block) — the only sanctioned use of an inner max-width on prose, and it must apply to the essay block as a whole, not paragraph-by-paragraph. With §4.2 revised to match practice, all four "outlier" pages are documented as deliberate; Trilemma and Not-a-Bubble in particular are no longer outliers but legitimate examples of tiers 2 and 3. No CSS changes — the tiers were already coherent, the documentation just hadn't caught up.

- [x] **Horizon `.wrap` consolidation + orphaned rule removal (commit `68e52af`).** Three cleanups on `the-bitcoin-horizon.css`. (1) Deleted the bare `.wrap` rule — markup audit found no `class="wrap"` elements on Horizon (only `.wrap-narrow` ×5 and `.wrap-wide` ×1), so it was dead code, not just redundant. (2) Consolidated `.wrap-narrow` and `.wrap-wide` (bit-identical declarations since `55fe517`) into a single grouped-selector rule, keeping both class names valid in markup so the semantic distinction (narrative containers vs §4's comparison-table section) is preserved. (3) Removed the orphaned `.intro .wrap-narrow` rule from the 768px @media block — the `.intro` section in markup contains only `.intro-block` and a `<p>`, no `.wrap-narrow` element nested inside; the selector never matched anything. Closes the last open item in §1 Architecture & DRY.

- [x] **Canonical nav CSS deduplication (commits `9937cc5` Phase 1 + `67d7bd8` Phase 2 + `0e69ec6` Phase 3 partial + `1780bda` Phase 3 final).** Extracted nav styling into a `<style id="canonical-nav-css">` block in `base.njk`, with structural+typography rules as the canonical source of truth. Per-page CSS reduced to deliberate-divergence overrides only (palette accents, calc-tier overlay design, BvRE custom site-nav, Migration position:fixed pairing with progress-bar). Cumulative across 4 commits: ~480 LOC removed from per-page CSS, replaced by 37-line canonical block in base.njk; site-wide nav CSS surface goes from ~360 lines duplicated across 15 files to ~37 lines centralized + ~80 lines of intentional per-page overrides. Drift fixes baked in: z-index 1000 universal (was 999 typo on 4 pages), font-weight: 600 universal on `.nav-links a.active` (was missing on 5 calc-tier pages — visible: active links now appear bolder on those pages), full active-state styling on `.nav-dropdown-menu a.active` in canonical (background + font-weight, was lost in Phase 2 deletion of not-a-bubble's rule and remediated in Phase 3 partial). Stealth color shifts shipped: not-a-bubble + BvRE dropdown-active text shifted from #F7931A to #e09422 — both pages' other accents already used #e09422, so this harmonizes their nav rather than regresses it. Calc-tier pages (Half-Life, Power Law, Fixed Pie, MIC, WMHTB) keep per-page `.nav-dropdown-menu a.active` rule with var(--orange) = #F7931A to preserve their bright-orange palette consistency across all 4 nav accent points. Three-phase execution: (1) add canonical to base.njk before page_styles for source-order override precedence; (2) delete bit-identical rules from 8 majority-canonical pages; (3) reduce 7 divergent pages to small override-only blocks. Each phase deployed and verified live before the next started. The Real Estate hamburger regression class of bug — drift between near-duplicate per-page CSS — is now architecturally less likely: per-page nav blocks are 4-13 lines of intentional overrides instead of 24+ lines of mostly-duplicated structure.

- [x] **Tier 3 page-specific judgment bundle — three documented exceptions (STYLE_GUIDE update only, no code change).** Screenshot-driven review on 2026-05-01 of three flagged items, all approved as deliberate exceptions to §5 anti-pattern rules. Documented inline in STYLE_GUIDE §5 under a new "Documented exceptions" sub-section so future readers can't miss them.
  - **Horizon `em.mark`** — Cormorant italic at 1.15rem on dark violates §5.1 in the abstract, but reads well in practice: amber color carries emphasis weight independently of stroke detail, phrases are sentence-fragments where Cormorant italic shows its character, and the typeface clash against Inter body prose is the editorial signal (authorial register-shift, like a pull-quote inline). Used sparingly (~2 instances on Horizon).
  - **Not-a-Bubble uppercase Cormorant** — page hero "IS BITCOIN A BUBBLE?" + section heading "THE PATTERN THAT DIDN'T REPEAT" violate §5.3 in the abstract, but the page is a polemic and the wide-tracked uppercase register matches its argumentative register. Tracking is restrained (~0.04em), letterspacing even. Per-page exception only.
  - **Real Estate `.hero h1` weight 300** — deviates from §2.1's wt 500 canonical. Lightness reads as deliberate editorial choice (magazine-cover feel, reinforced by "The Opportunity Cost" subtitle), not accident. Cormorant 300 is loaded and renders as designed. Per-page exception only.
  
  Pattern observation: all three are cases where a generally-good rule needs documentation of when it doesn't apply. The "Documented exceptions" section in STYLE_GUIDE §5 is now the canonical place for these — future similar judgments should land there rather than getting lost in commit messages.

- [x] **Horizon footer dead-CSS removal (commit `26c8fbf`).** TECH_DEBT §6 had flagged Horizon `.f-brand` as a possible §5.1 anti-pattern (Cormorant italic at 1.3rem on dark). Audit found it isn't an anti-pattern at all — it's orphaned CSS. The .f-brand selector + sibling .f-line + parent `footer { ... }` block exist in the stylesheet but no markup uses them; only the canonical `.site-footer` from base.njk renders. 19 lines of dead CSS removed; no visual change. Likely a remnant from before the Eleventy refactor centralized the footer into base.njk.

- [x] **Hamburger architectural fix (commits `55319e2` Phase A + `2bbf85d` Phase B).** Centralized the mobile-nav OPEN handler in `base.njk`, eliminating per-page duplication that had caused the Real Estate hamburger regression in commit `a0dfcb6`. Pre-fix surface: 15 distinct implementations across 14 .js files + 1 inline head.html script, in 6 stylistic variants. Behavioral audit caught real divergence — body-scroll-lock on open was present on 8/15 pages, close-on-link-click was present on 12/15, defensive null guard on 10/15. The centralized handler implements all three universally; pages that were missing them silently gained them. Phase A deployed and verified live before Phase B's deletions; Phase B verified by site-wide grep returning zero remaining handlers in pageassets, plus deployed-HTML check on Horizon and Half-Life confirming the canonical handler runs and duplicates are absent. Net change: 16 files, +16 insertions, −206 deletions (-190 LOC). The Real Estate hamburger regression class of bug is now architecturally impossible: there is one source of truth. Companion item in §1 (Canonical nav CSS deduplication) is now closed too — see entry above.

- [x] **OG description tightening — half-life and melting-ice-cube (commit `4777094`).** Phase 2's og:title enrichment (commit `47db5f5`) left both pages with descriptions that opened with the same hook as the new title. Tightened so each tag carries its own weight in the social card. Half-Life: 6 locations updated (meta name=description, og:description, og:image:alt, twitter:description, twitter:image:alt, JSON-LD WebPage description) — all leading question dropped, kept the elaboration. Melting Ice Cube: 4 social-card locations updated (og:description, og:image:alt, twitter:description, twitter:image:alt) — Saylor melting-ice-cube quote dropped from the lead. MIC's meta name=description left intentionally as-is (already substantively different from og:description — longer SEO-oriented copy, doesn't echo the og:title). Result is a deliberate asymmetry between MIC's SEO description and social descriptions; both work standalone, different audiences/contexts.

- [x] **Horizon body-prose `<em>` rendering issue (commit `2391882`).** Originally logged as a possible cascade leak — "riskier" and "guaranteed" in §1 looked off in screenshots. Investigation found no CSS rule explaining the rendering. Actual root cause: **no Inter italic was loaded on any page site-wide** — every head.html font URL specified Inter at upright weights only. The browser was falling back to font-synthesis (faux italic) for every body-prose `<em>` on every page. Fixed by adding italic@400 + italic@500 to the Inter declaration in all 15 head.html files; codified as canonical in STYLE_GUIDE §1 "Font loading". Process implication: a "page-specific cascade question" turned out to be a site-wide font-loading bug — the diagnostic value of investigating the smaller question was high. When a rendering issue resists a CSS-rule explanation, check the @font-face / font URL load before assuming cascade.
