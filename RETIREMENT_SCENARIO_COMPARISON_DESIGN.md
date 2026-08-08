# Design Doc — Scenario Comparison on The Bitcoin Retirement

> **Migrated into the repo 2026-08-08.** Previously a project-only doc under the now-retired `claude/` location prefix; moved to repo root — tracked, alongside `TECH_DEBT.md` and `PAGE_IDEAS_BACKLOG.md` — so it can be read and updated directly in-session. Unreadable project-only copies had drifted (OPEN_ITEMS twice), which is why the split was retired. Everything below is the verbatim authoritative export as of the move; not rewritten. Internal `claude/…` cross-references below are pre-migration paths — the migrated planning docs now live at repo root without the prefix.

> **STATUS: SHIPPED (2026-07-25).** This document is the *design record* — what was intended and
> why. Several parts were superseded during the build and are annotated inline as **[SUPERSEDED]**;
> they are kept because they explain why the shipped design took the shape it did.
>
> **For current behaviour and the reasoning that must not be undone, read
> `RT_COMPARE_HANDOFF.md` §2 before changing anything in this module.** That document, not
> this one, is authoritative for how the module works today.

_Created 2026-07-25. Promoted from the backlog's "Side-by-side scenario comparison" idea (JM,
2026-07-18: "let the reader run 2–3 retirement scenarios on the same page and see the delta —
e.g. 'retire two years later' vs. base, surfacing the incremental income gained… comparison-first
rather than one result at a time"). House workflow: this doc → JM review → Claude Code build prompt →
JM review on preview → merge._

_Lineage note: the original `RETIREMENT_CALCULATOR_DESIGN_22.md` already designed two adjacent
Phase-3.5 surfaces that never shipped — the 3×3 **scenario grid** (§3.6, assumption-sensitivity) and
the **spectrum-graph view** (§11.3.5, continuous axis). This feature is a THIRD shape, and it ships
first because it is JM's sharpest ask: not "how sensitive is my answer to assumptions" but **"what
does a concrete alternative choice buy me?"** The grid and spectrum remain future options; nothing
here forecloses them. All settled decisions of the original doc are honored — no mode toggle,
exploration-first, facts-not-signals, "Estimated:" framing, floor/trend planning asymmetry._

---

## 1. Concept — comparison-first, delta-headlined

The current page answers one configuration at a time. The insight JM wants surfaced is the
**delta between choices**: retiring two years later is worth *this much* more income; dropping the
target by $25K brings retirement *this many* years closer; the same stack at a 4% withdrawal
*reaches escape velocity where the base case depletes*. Comparisons "make bitcoin's value more
clear and obvious" and reward extended play.

The unit of comparison is a **scenario variant**: the user's current slider configuration (the
"base") plus one or two variants derived from it. Each variant answers a plain-language question of
the form *"what if I ___ instead?"*

_Shipped as designed._

## 2. The core design decision — variants are RELATIVE, and live

Two possible models:
- **Frozen snapshots** ("duplicate current config, then edit the copy") — flexible, but the copies
  go stale the moment the user drags a base slider, and managing divergent copies is the saved-
  scenarios complexity the original doc deliberately de-scoped (§8.2).
- **Relative variants** (recommended): a variant is a *rule applied to the base* — "base, but
  retirement year +2" — recomputed live from whatever the base currently is. Drag any base slider
  and all columns update together; the comparison never goes stale. This preserves the page's
  exploration DNA (the whole surface stays live) and keeps state trivial (a variant is just
  {label, field, delta}).

Recommendation: **relative variants**. It is also the honest framing — the question "what does
retiring 2 years later buy me?" is only meaningful relative to a live base.

_Shipped as designed. This decision held up through every subsequent revision._

## 3. UX

**Placement:** a compact module directly below the Sustainability readout — the natural "and
compared to what?" position after the user has seen their single-scenario answer. _Shipped as
designed._

**Interaction:** a row of preset chips under the header "Compare — what if you…":

**[SUPERSEDED — chip set]** The draft set was:
- *Retired 2 years later* · *Retired 5 years later* · *Retired 2 years earlier*
- *Wanted $25K/yr less* · *Wanted $25K/yr more*
- *Withdrew 4% (the traditional rule)*
- *Kept DCA going 2 more years* (only visible when DCA > 0)

Three changes during the build, each with its reasoning in the handoff:
- **"Kept DCA going 2 more years" was cut.** DCA accumulates to `retirementYear` and there is no
  DCA end-year field, so the chip was either unrepresentable or byte-identical to *Retired 2 years
  later* — it shipped briefly as the latter and was removed (handoff §2.4).
- **"Retired 5 years earlier" was added.** The draft set was 2:1 toward waiting, which tilts the
  module toward "reasons to retire later" and violates the §4 symmetry guardrail (handoff §2.5).
- **The ±$25K chips became ±25%.** A flat $25K is a 6% nudge at a $410K target and more than the
  whole target at $20K. The proportional rule is self-scaling and cannot falsify its own label
  (handoff §2.1).

Shipped set (7): *Retired 2 years later* · *Retired 5 years later* · *Retired 2 years earlier* ·
*Retired 5 years earlier* · *Wanted 25% less ($X)* · *Wanted 25% more ($X)* · *Withdrew 4% (the
traditional rule)*. The income chips carry live labels showing the resolved figure.

Tapping a chip adds that variant as a column (max 2 variants + base = 3 columns; tapping a third
chip replaces the oldest variant; tapping an active chip removes it). Chips are one-line,
verb-first, concrete — each is a *choice a person could actually make*, which is what
distinguishes this surface from the assumption-sensitivity grid. _Shipped as designed._

**The columns:** Base (labelled "Your current scenario", always leftmost, live) + variants.

**[SUPERSEDED — column rows]** The draft specified three outputs. Shipped with four:
1. **Years the stack lasts** (or "∞ — escape velocity")
2. **Stack value at retirement (today's $)** — the only figure ever compared across columns
3. **Stack value at retirement (that column's own retirement-year dollars)** — added so the panel
   reconciles with the Sustainability card, which defaults to nominal (handoff §2.6)
4. **Target income** — the draft called this "Sustainable income", which contradicted itself in any
   depleting column: the income shown is precisely what *causes* the depletion (handoff §2.8)

**The delta row — the whole point:** under each variant, the differences vs. base, signed and
plain: "+$31K/yr income · retire 2033 instead of 2031". When a variant crosses the escape-velocity
threshold that the base doesn't (or vice versa), that IS the headline delta: *"reaches escape
velocity — the base case depletes in ~27 years."* Delta selection rule: escape-velocity flip >
years-of-stack change > income change > stack-value change; show the top two.

_Shipped as designed, with one discipline added: the delta row reads the **real** figures only.
Nominal figures in different columns are in different years' units, so a nominal delta would read
inflation as growth (handoff §2.6)._

**[SUPERSEDED — chart overlay]** The draft called for each active variant's drawdown curve to
overlay the main projection chart as a thin, lighter line, "the visual payoff — two futures
diverging on one chart."

It shipped in `4570bf9` and was **removed** in `34daf4c`. The module sits well below the chart, so
at the moment the user taps a chip the chart is off-screen — the payoff landed where they weren't
looking. On a log axis, variants a few years apart also sit nearly on top of the base curve, and
the chart already carries six datasets. The claim above was oversold. Column dots are now
slot-based identifiers only and reference nothing on the chart (handoff §2.3).

**Mobile (≤720px):** columns stack vertically (base first), delta rows keep their position under
each variant; chips wrap to two rows. _Shipped as designed; chips wrap further now that the income
chips carry $-figures._

## 4. Honesty guardrails (inherited + specific)

- **Both directions, always.** "Retire 2 years earlier" is a first-class chip and its deltas show
  the *cost* as plainly as later-retirement shows the gain. The chip set is symmetric by
  construction; the module must never read as "reasons to wait longer."
- **No winner.** No highlighting of a "best" column, no green-vs-red column tinting (delta signs
  get the standard pos/neg number colors only, as the backtest table does). The module makes the
  tradeoff visible; the user chooses.
- **"Estimated:" framing** carries into every variant output, same convention as the page.
- **Same engine, provably.** Variant columns are computed by the page's existing projection
  function with modified inputs — zero new math. QA gate: setting the base sliders to a variant's
  effective values must reproduce that variant's column exactly.
- **No storage.** Variants are in-memory UI state only (consistent with the page's privacy posture
  and the de-scoped saved-scenarios decision). Not URL-persisted in v1 (revisit if sharing demand
  appears).
- The near-trend/dead-band disciplines of other pages don't apply here (personal tool, not market
  state), but the volatility caption stays in view — variant CAGRs inherit the same
  trend-not-guarantee caveat.

_All held. Two guardrails were added during the build and are recorded in the handoff:_
- _**A chip must never lie about its own magnitude** — hence the availability model, where a rule
  that can't be applied at full magnitude disables its chip with a stated reason rather than
  silently clamping into a mislabelled column (handoff §2.1)._
- _**The exact-equality gate verifies consistency, not effect** — a rule that does nothing passes it
  trivially. Hence the non-degeneracy gate: no rendered variant column may equal the base, and no
  two active columns may be identical._

## 5. Build shape (for the Claude Code prompt)

- New njk block (comparison module) below the Sustainability readout; `rt`-prefixed classes per the
  page idiom; chips as buttons with aria-pressed.
- JS: variant registry [{id,label,apply(baseConfig)→config}]; on any slider input or chip toggle,
  recompute base + active variants through the existing engine; render columns + deltas.
  **[SUPERSEDED]** _The draft added "maintain chart overlay datasets (reuse the page's chart
  instance; add/remove datasets on toggle)". Overlays were removed (§3); and the add/remove-on-
  toggle approach was wrong regardless — `renderChart()` rebuilds its datasets fresh each tick._
  The shipped registry also carries `available(base)` and, for the income chips, `chipLabel(base)`.
- Delta formatting reuses the page's formatters; delta-priority rule as §3.
- Perf: 3 engine runs per drag tick at most (debounced as the page already is); memoize where the
  engine allows.
- QA gates: variant column ≡ base column when its rule is applied to the base sliders directly
  (exact-equality gate); escape-velocity flip renders the flip-headline; both-direction chips
  present; chips cap at 2 + replacement behavior; mobile stack at 375px; no console errors;
  pixel-probe the new module; FAQ/JSON-LD untouched (note: the FAQ block has **5** Question
  entries, not 4 — an error in the original post-ship checklist).
  **[SUPERSEDED]** _"chart overlay legend line-style-faithful" — no longer applicable._
- Page docs: SITE_GUIDE section update; this doc's Status updated with what shipped.

## 6. Open questions for JM — RESOLVED

1. **Chip set** — approved as drafted, then amended during the build: DCA chip cut, *Retired 5
   years earlier* added, ±$25K → ±25%. No "+1 BTC" chip; buy-more chips edge toward prescription.
   See §3.
2. **Max variants** — 2 + base (3 columns) on all breakpoints, oldest-replacement on a third chip.
   Shipped as drafted.
3. **Chart overlay** — shipped in v1, then removed. See §3.
4. **Sustainable-income row** — apples-to-apples at the base's withdrawal for all columns except
   the 4% chip's own column (footnoted "at 4% withdrawal"). Shipped as drafted; the row was later
   renamed **Target income** for accuracy. See §3.

## 7. Status — SHIPPED

| Commit | What |
|---|---|
| `4570bf9` | Original module — relative variants, 3 columns, delta row, chart overlays |
| `465cbb7` | Bounds availability; duplicate DCA chip removed; *Retired 5 years earlier* added; `rule4` single-lever |
| `fa6aebf` | 4% chip made absolute (not bound-gated) |
| `1bc1672` | Zero-stack degeneracy guard on the 4% chip |
| `34daf4c` | rev2: overlays removed; income chips proportional ±25%; dual-basis stack rows |
| `4db243f` | rev2: income-basis toggle renamed "Rises with inflation" / "Same every year" |
| `fb90273` | "Sustainable income" → "Target income" row rename |
| `b38ae46` | SITE_GUIDE §17 worked examples |

Live on `/the-bitcoin-retirement`, verified on production.

**Before changing anything in this module, read `RT_COMPARE_HANDOFF.md` §2.** It records
eight decisions that each look like an inconsistency and are not — most notably that the income and
4% chips are deliberately bound-free while the year chips are bound-gated, and that the nominal
stack row is deliberately never compared across columns.

**Process note:** the original build prompt authorized self-merge, and the module reached
production before any audit — which is how the duplicate DCA chip and unclamped variant scenarios
got in front of users. Every subsequent round ran as *push, verify on preview, JM merges*, and
every defect after that was caught before it shipped. Worth making the default in future build
prompts.
