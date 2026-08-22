# Escape Velocity — Design Doc v1.2 (as-built, canonical)

> **Committed to the repo 2026-08-21.** Previously chat-side only, as
> `claude_ESCAPE_VELOCITY_DESIGN_v1_2.md`. Escape Velocity shipped (PR #56, 2026-08-20)
> without its design record in the repo, which left two live citations pointing at a
> document nobody could open — `TECH_DEBT` (flagship year-by-year deprecation) and the
> *Retirement family* cluster in `PAGE_IDEAS_BACKLOG`. Both are repaired against this
> file in the same commit. Everything below the banner is the verbatim v1.2 export; not
> rewritten.
>
> **Filename:** the `claude_` prefix and the `_v1_2` suffix are dropped to match the root
> design-doc convention (`HURDLE_RATE_DESIGN.md`, `STRC_BELOW_PAR_DESIGN.md`,
> `DISCOUNT_OR_PREMIUM_DESIGN.md`) — the version lives in the H1 above, so a future
> revision does not create a second file and a second round of citation churn. The
> `claude/` location prefix is retired site-wide (`SITE_GUIDE §7`); cite this as
> `ESCAPE_VELOCITY_DESIGN.md`.
>
> **One dangling reference, left as-is:** the intro below points at
> `claude_EV_PRODUCTION_PACKAGE_PROMPT.md`, which is a chat-side build prompt and is not
> in the repo. It is a spent artifact — the production package it drove has shipped — so
> it is flagged here rather than chased. Nothing in this document depends on it.

_2026-08-20. Supersedes v1.1 and the three round prompts. This is the record of the page
AS BUILT on feat-escape-velocity after review rounds 1–3, plus the decisions ledger and
the reusable patterns the build produced. Written for project Files + the repo docs pass.
Production package prompt: claude_EV_PRODUCTION_PACKAGE_PROMPT.md._

## 1 · What shipped (page order)

**Bitcoin Escape Velocity** (`/bitcoin-escape-velocity`). Subtitle: "A retirement
portfolio is supposed to draw down. Under bitcoin's historical growth curve there is a
line past which yours runs up instead — and the surprise is how little it takes to
cross it."

1. **Hero** + tool-framing strip (collapsible disclaimer).
2. **Set the plan** — three steppers (Retire in 2026–2055 · Stack 0.01–100 BTC ·
   Annual withdrawal $20K–$500K), gradation chips (0.05/0.25/1.0 BTC; $5K/$10K/$25K),
   direct entry, hold-repeat, keyboard, reset-to-defaults. Two-paragraph lede: the
   why (confidence/lifestyle/risk) + the purchasing-power frame. Defaults **1.00 BTC /
   $100,000 / 2035** ("the wholecoiner default") — first load lands failure-side on
   both bases, one to two clicks from the line.
3. **The verdict** — "Does your planned retirement reach escape velocity?" Three
   branches, equal weight: escape ("permanently exceeds spending from YYYY"), shrink
   ("survives the window, growth stops covering withdrawals from YYYY… on pace to
   deplete around YYYY, beyond the window" — loop extended to retirement+60), deplete
   ("depletes in YYYY"). Explainer names horizon arithmetic + links the Power Law at
   first mention. Dynamic-conservative robustness line (basis producing the later
   escape / earlier depletion; shrink-shaped wording on both directions). Nominal
   disclaimer; above-trend footnote (fires when spot >1.05× on gap-persists). Value
   blocks (stack at retirement; value at horizon, year explicit, no age input).
   Spectrum bar with flagship semantics (real multiplier = pace) + the CAGR-decay
   legibility tooltip. Volatility caveat → Stress Test.
4. **The Threshold** (merged sensitivity section, eyebrow HOW LITTLE IT TAKES) —
   intent lede + mechanics lede. Three full-range live sliders (stack log-scaled),
   snap = gradation chips, threshold tick labels positioned AT the tick
   (pixel-measured clamping), **click tick/label to jump exactly to the threshold**.
   Result block directly beneath: "Where your thresholds sit" with a dynamic status
   line (Above / Below / "On the threshold — one step decides it", the last defined
   as within one snap step on any axis). Directional out-of-range copy (solver-derived
   rescue tips naming the variable, not a target value). Supplement below: "One step
   in any direction" bidirectional consequences rows. **Section vocabulary:
   "threshold", never "line"; page-local input vocabulary: "withdrawal", never
   "drawdown"; shared components keep flagship labels.** Live state page-wide — no
   Apply anywhere.
5. **Year by year — Growing versus spending** — per-year real residual bars (the
   flagship's green-bar language), four caption variants (shrink/escape/deplete/
   never-covers), instant full-column hover: "2048 · stack $1.47M · +$28K more than
   spent" (stack follows display basis, labelled "(future $)" in nominal to mark the
   basis seam against the always-real bars).
6. **Assumptions** — collapsed one-line state summary → single aligned card. Page-
   local: price basis (dynamic-conservative pair), RT_DOLLARS real*/nominal, incbasis
   (flagship labels verbatim), horizon 20/30*/40. Sitewide (live-subscribed since
   round 1): inflation, growth model. **Inherited-preset note** when the sitewide
   value has no chip on this card ("Set to Linear CAGR with decay on another
   calculator — the projection is using it. Pick one here to override.").
7. **Verify the math** — collapsed audit table (flagship renderer, no duplicated
   toggles, Copy as CSV), scenario cross-link to the flagship carrying URL params.
8. **The other side of this** (sequence-risk both ways) · related links · 4-question
   FAQ front matter.

Chrome: desktop docked plan bar (timestamp-throttled scroll, self-measuring offset);
mobile ≤760px slim plan repeat; sessionStorage stickiness for inputs + steps (never
localStorage for the stack); URL params `stack/retire/income/years/incbasis` + display
basis + `btcstep/incstep`; `-head.html` with noindex guard (removed at production).

## 2 · Engine & correctness

- Flagship engine reuse (SCENARIO shape, projection functions, sell-to-cover loop);
  shared ModelingAssumptions with live subscribe + cross-tab storage events.
- Escape-year definition: first year Y with real residual ≥ 0 for EVERY year Y→horizon.
  Monotone under this engine → verdicts are effectively retirement+1-or-never; the
  page's payload is therefore the THRESHOLD (input-space crossing), not the year.
- One solver (`lineFor(basis)`) places slider ticks, writes the result sentences,
  drives rescue tips, and powers click-to-jump — QA asserts tick == sentence == jump
  on every axis, both bases.
- `evParityQA()`: 20 vectors × 2 bases, EV verdicts vs flagship sustainability
  semantics, boundary classifications stable across the shrink-loop extension;
  live-assumption recompute ≡ hard refresh across growth models and inflation rates.

## 3 · Decisions ledger (who decided what)

| Decision | Outcome | Round |
|---|---|---|
| Title / subtitle | Bitcoin Escape Velocity / "surprisingly large outcomes" | 1 / 3 |
| Thesis verb | "draw down" (noun "drawdown" banned page-locally) | 3 |
| Defaults | 1.00 BTC / $100K / 2035 (JM: "1 BTC is iconic"); soft-no on trend + hard-no in robustness line accepted deliberately | interim |
| Verdict basis | Real by default, labeled inline; nominal opt-in with disclaimer | v1 |
| Conservative basis | Dynamic (later escape / earlier depletion), never hardcoded | v1 |
| Sections | One-step + Threshold MERGED; result above supplement | 2 / 3 |
| Apply | Removed page-wide; live shared state is the interaction contract | 2 |
| Docked bar | Kept page-wide (JM reversed initial drop suggestion) | 2 |
| Spectrum semantics | Flagship multiplier kept (parity); CAGR-decay tooltip added (JM wording) | 3 |
| Vocabulary | threshold (section) / withdrawal (inputs) / income (shared components — accepted seam) | 2–3 |
| Horizon | Year-explicit, no age input (v0's "value at 85" resolved) | build |
| Consequences rows | Kept as supplement; flagged possibly vestigial — revisit post-launch with usage | 3 |

## 4 · Patterns produced (→ docs pass)

1. **Stepper input pattern** (value + arrows + gradation chips + direct entry) — mobile-
   first alternative to sliders for plan inputs.
2. **Threshold-slider pattern** — full-range slider with solver-placed tick, label at
   tick (pixel clamp), click-to-jump, status line; one solver for all surfaces.
3. **No-Apply live-state contract** — every control writes shared state; the page hint
   promises it; QA enforces recompute equality with reload.
4. **Assumptions card presentation** — collapsed state summary → aligned grid; kills
   stacked-toggle muddle. Candidate for flagship adoption (TECH_DEBT).
5. **Inherited-preset note** — any page with a REDUCED sitewide-picker chip set must
   render the inherited value when no chip matches, or the control looks dead.
6. **Docked-bar lessons (three failures, all silent, all deploy-only):** position:
   sticky killed by ancestor overflow; IntersectionObserver built pre-layout fires
   once; requestAnimationFrame suspended when not compositing. Ship: timestamp-
   throttled passive scroll + self-measured offset + fonts.ready re-measure.
7. **WHY-principle** (JM): every interactive section opens with the insight it
   delivers; multiple interactions = menu, not sequence. → NEW_PAGE_CHECKLIST + a
   retrofit backlog entry for existing pages.

## 5 · Deferred / open (not blocking production)

- Consequences-rows keep/cut review after real usage.
- Flagship year-by-year section deprecation → pointer at EV (decide post-launch).
- Flagship localStorage stack-stickiness policy (site-wide privacy question).
- Flagship adoption of the assumptions-card presentation.
- Possible future: compare-scenarios feature reusing the consequences engine; optional
  age input if users ask.
