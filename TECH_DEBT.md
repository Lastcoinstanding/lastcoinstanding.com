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

- [ ] **Half-Life weight-600 audit.** Multiple selectors violate STYLE_GUIDE §5.2 ("Cormorant at <1.3rem with weight ≥600"): `section-title`, `tl-ttl`, `callout c-t`, `lk-type`, `tk h3`, `scenario-prompt`. Same fix pattern as the prior tab-title fix.
  - [ ] Bundle here: Power Law `.section h3` (1.2rem wt 600) — same §5.2 hit, identical fix. Flagged in commit `fdce1fc`.

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

---

## Recently closed

Move items here when shipped, with commit SHA. Keep the last 5–10 for reference; archive older ones to git history when this section gets long.

_(none yet — this section will populate as items get ticked off)_
