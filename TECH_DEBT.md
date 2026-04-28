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

- [ ] **Hamburger architectural fix.** Centralize the OPEN handler in `base.njk` rather than duplicating it per-page. The Real Estate mobile hamburger regression fixed in commit `a0dfcb6` was caused by this duplication pattern. Affects all pages with mobile nav.
- [ ] **Canonical nav CSS deduplication.** Extract nav styling into a shared partial; currently duplicated across page CSS files.
  - [ ] Bundle here: Horizon `.wrap` / `.wrap-narrow` / `.wrap-wide` are now identical (960px after commit `55fe517`) and could be consolidated. Also remove the dead `.intro .wrap-narrow` rule at L785 of `the-bitcoin-horizon.css` — orphaned reference, no markup uses that combo.

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

- [ ] **Mobile-floor sweep — Half-Life and Power Law caps labels.** Audit on 2026-04-28 found 5 selectors below STYLE_GUIDE §2.3's 0.7rem mobile floor that aren't compensated by §2.1's smallest-label slot tracking spec (0.65rem requires letter-spacing ≥0.2em):
  - **Half-Life** — `.header-quote cite` (0.65rem, ls 0.15em); `.lk .lk-label` (0.65rem, ls 0.18em); `.sp-label` (0.65rem, ls 0.18em). All three are at 0.65rem with tracking just below the 0.2em smallest-label spec. Either bump tracking to 0.2em or bump size to 0.7rem.
  - **Power Law** — `.calc-field label .opt` (0.68rem, no tracking compensation); `.calc-card .period-label` (0.68rem, ls 1.8px ≈ 0.11em). Bump to 0.7rem.
  
  Ship as a small page-pair commit when convenient — these aren't visually catastrophic but they read as inconsistent with the MIC and Fixed Pie mobile-floor work already done.

## 3. Sales-readiness

- [ ] **OG card audit.** Verify Open Graph cards render correctly on all pages and look good when shared externally. Becomes important once links start being shared in Sales conversations. Worth doing before any meaningful external sharing.

## 4. Width treatments

- [ ] **Width outliers vs. canonical 960px.** Five pages (Power Law / Half-Life / Fixed Pie / Melting Ice Cube / Horizon as of commit `55fe517`) use the 960px canonical. Two outliers:
  - Trilemma at 1080px (within §4.2 tolerance, marginal)
  - Not-a-Bubble at 1152px (exceeds §4.2's 1100px ceiling by 52px)
  
  Decide whether to converge or document as deliberate exceptions per page character.

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

## 6. Page-specific minor / design judgment

Items where the right call needs either visual review or a designer's judgment rather than a mechanical fix.

- [ ] **Horizon `footer .f-brand`** (1.3rem italic Cormorant). Possible §5.1 hit, not yet screenshot-confirmed.
- [ ] **Horizon `em.mark`** (1.08em amber italic Cormorant for inline emphasis). §1 allows Cormorant inline italic at display sizes; in body prose it's borderline. Need a body-prose screenshot before deciding.
- [ ] **Horizon body-prose `<em>` cascade question.** "riskier" and "guaranteed" in §2 looked like serif italic in screenshots when they should presumably be Inter italic. Possible cascade leak; worth investigating.
- [ ] **Real Estate `.hero h1` weight 300.** Only page using this thin weight (vs canonical wt 500). Cormorant 300 IS loaded so it renders as designed, but: intentional choice or copy-paste accident? Flagged in commit `a224e5f`.
- [ ] **Real Estate pull-quote pattern** (`bitcoin-vs-real-estate.njk` L123). Uses Cormorant upright with italic em emphasis on "postponed". §6.3 says pull-quotes on dark should use Source Serif italic, but the partial-italic case isn't explicitly covered. Worth review during eventual site-wide pull-quote consolidation.
- [ ] **Not-a-Bubble §5.3 uppercase Cormorant treatments** (`header h1` "IS BITCOIN A BUBBLE?" with letter-spacing 0.1em; `.essay h2` "THE PATTERN THAT DIDN'T REPEAT" with letter-spacing 0.07em). These are §5.3 candidates ("Wide-tracked uppercase Cormorant"), but §2.1 explicitly permits uppercase for h1, the sizes are large enough that strokes don't muddy, and the uppercase treatment reads as a deliberate editorial choice for this page's rhetorical framing. Confirm whether to keep as a documented exception or unify with Inter caps per §5.3.

## 7. Audit gaps (process improvements)

- [x] **Phase 5 §5.7 audit was incomplete — Real Estate-only fix.** The prior session's "all 10 anti-patterns resolved" status missed Not-a-Bubble — DM Sans was still being loaded and used as `--font-body` site-wide on that page. Caught and fixed in commit `89011ea`. Process implication: when running anti-pattern audits, grep all `_pageassets/*-head.html` AND all `_pageassets/*.css` for the offending pattern, not just the page where the issue was first noticed.

- [ ] **§5.7 sweep — four more pages still have rogue sans-serifs.** Site-wide grep on 2026-04-27 (during Melting Ice Cube audit) found:
  - `index` — loads DM Sans, used as `--font-reading: 'DM Sans'`
  - `money-trees` — loads DM Sans, applied directly
  - `synthesis` — loads **Outfit** (a third sans-serif family — not previously on §5.7's radar), used as `--font: 'Outfit'`
  - `what-bitcoin-is` — loads Outfit, used as `--font: 'Outfit'`
  
  Recommend a coordinated cleanup pass with screenshot review per page rather than blind drive-by fixes — body-font swaps can have non-obvious knock-on effects on layout density. Priority is medium–high since this directly affects "consistency-by-default" (4 of 15 pages currently render in non-canonical sans-serifs).

  Tangentially: STYLE_GUIDE §5.7 should be amended to call out Outfit by name once fixed, currently only references DM Sans by example.

---

## Recently closed

Move items here when shipped, with commit SHA. Keep the last 5–10 for reference; archive older ones to git history when this section gets long.

_(none yet — this section will populate as items get ticked off)_
