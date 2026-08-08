# RT_COMPARE — close-out handoff

> **Migrated into the repo 2026-08-08.** Previously a project-only doc under the now-retired `claude/` location prefix; moved to repo root — tracked, alongside `TECH_DEBT.md` and `PAGE_IDEAS_BACKLOG.md` — so it can be read and updated directly in-session. Unreadable project-only copies had drifted (OPEN_ITEMS twice), which is why the split was retired. Everything below is the verbatim authoritative export as of the move; not rewritten. Internal `claude/…` cross-references below are pre-migration paths — the migrated planning docs now live at repo root without the prefix.

_Updated 2026-07-25 after rev2. The comparison module is **shipped, live, and complete**. No open
blockers. Supersedes all earlier RT_COMPARE handoffs._

---

## 1. What shipped

| Commit | What |
|---|---|
| `4570bf9` | Original Compare module — relative variants, 3 columns, delta row, chart overlays |
| `465cbb7` | Bounds availability (no silent clamping); removed duplicate DCA chip; added *Retired 5 years earlier*; `rule4` back to a single lever |
| `fa6aebf` | 4% chip made absolute (not bound-gated) |
| `1bc1672` | Zero-stack degeneracy guard on the 4% chip |
| `34daf4c` | rev2 items 1–3: overlays removed; income chips proportional ±25%; dual-basis stack rows |
| `4db243f` | rev2 item 4: income-basis toggle rename |
| `fb90273` | "Sustainable income" → "Target income" row rename (current `main` HEAD) |

**Final chip set (7):** Retired 2 years later · Retired 5 years later · Retired 2 years earlier ·
Retired 5 years earlier · Wanted 25% less ($X) · Wanted 25% more ($X) · Withdrew 4% (the
traditional rule). The two income chips carry live labels showing the resolved figure.

**Production verification (independent, against the live bundle):** `cmpRetireAvail` and
`cmpRule4Avail` byte-unchanged across all six commits; `cmpIncomeAvail` absent; zero overlay code
paths; "Sustainable income" absent, "Target income" present; toggle reads the new labels with
"Fixed future" absent; FAQ JSON-LD byte-identical to the pre-feature page.

## 2. Principles a future session must not "tidy away"

Each of these looks like an inconsistency and is not. Every one was reasoned to deliberately, and
several were fixed *after* shipping wrong.

**2.1 Availability guards are asymmetric on purpose.**

- **Delta rules** — ±2, ±5 years — state an absolute magnitude that clamping would falsify. A
  column labelled "Retired 5 years earlier" that is actually 1 year earlier is a false statement and
  understates the cost in the delta row. These stay bound-gated via `cmpRetireAvail`.
- **Proportional rules** — ±25% income — cannot falsify their label: "25% less" is exactly 25% less
  at any positive income. `cmpIncomeAvail` was **deliberately deleted**; do not reintroduce a floor
  or ceiling guard. Multiplying a positive income can't reach zero, so no degeneracy guard either.
- **Absolute rules** — the 4% chip — make no magnitude claim a bound could falsify, so they are
  bound-free too, carrying only a degeneracy guard.

Governing principle: **disable when the rule produces a nonsense scenario; allow when it produces a
truthful scenario that merely can't be dialed on a slider.**

Worked examples worth keeping in SITE_GUIDE verbatim: 4% of a small stack is **$592/yr** — below
the $20,000 slider floor, unreachable by dragging, and still the honest answer, so it renders. 25%
less of $20,000 is **$15,000** — likewise below the floor and likewise shown. Contrast negative
income (`$20,000 − $25,000`, the old ±$25K rule) and zero stack (`4% × 0`), which are nonsense and
are blocked.

**2.2 The zero-stack guard is a degeneracy guard, not a UI-floor bound.**

`slider-btcStack` has `min="0"`. At stack 0 with no DCA the 4% rule yields $0, a zero withdrawal
never depletes, and the column would read "∞ — escape velocity" at $0 income — true arithmetic,
false meaning. DCA alone still builds a real stack, so the guard fires only when there is genuinely
nothing to draw from. The reasoning is a code comment; keep it there.

**2.3 There is no chart overlay, and that is deliberate.**

Variant drawdown lines shipped in `4570bf9` and were removed in `34daf4c`. The module sits well
below the chart, so at the moment the user taps a chip the chart is off-screen — the payoff landed
where they weren't looking. On a log axis, variants a few years apart also sit nearly on top of the
base curve, and the chart already carries six datasets. The original design doc called the overlay
"the visual payoff"; that was oversold. Column dots are slot-based identifiers only and no longer
reference anything on the chart.

**2.4 There is no DCA chip, and that is deliberate.**

DCA accumulates over `for (y = startYear; y < scenario.retirementYear; y++)` — there is no DCA
end-year field (`dcaEndYear` / `dcaYears` appear nowhere in the bundle). A "kept DCA going 2 more
years" chip is therefore either unrepresentable or byte-identical to *Retired 2 years later*. It
shipped briefly as the latter and was removed: it could place two identical columns side by side,
and it credited continued DCA for gains that come from two extra years of growth and two fewer
drawdown years. "Keep stacking past retirement" is a different question needing a `dcaEndYear`
field; it gets its own spec.

**2.5 Chip symmetry is a guardrail.**

+2/+5/−2/−5 years and ±25% income. The set shipped briefly as +2/+5/−2 — two ways to wait, one way
to go early — which tilts the module toward "reasons to retire later." Any new chip needs its
mirror.

**2.6 Two stack rows, and only one of them is ever compared.**

Each column shows today's $ **and** the raw nominal figure in that column's *own* retirement-year
dollars, labelled with that year. The nominal row exists so the panel reconciles with the
Sustainability card (which defaults to `RT_DOLLARS = 'nominal'`); before it existed the card could
read $10.20M directly above a panel reading $3.08M for the same quantity.

**The delta row reads the real figures only.** Nominal figures in different columns are in different
years' units — a 5-year gap at 6.5% inflation is ~1.38× of apparent growth that isn't growth. The
per-column year label is what makes that visible instead of hiding it; don't "simplify" it away.

**2.7 `incomeBasis` is never called "nominal".**

`RT_DOLLARS = 'nominal' | 'real'` already owns that word for the independent *display-basis* toggle.
The two are orthogonal — a user can be in real display with a fixed-dollar plan — so naming both
"nominal" makes that state unexplainable. The income-basis toggle is behavioral and named
behaviorally: **"Rises with inflation" / "Same every year"**.

**2.8 The income row is "Target income", not "Sustainable income".**

The value is `scenario.targetIncomeUSD` — the draw the column applies. It shipped labelled
"Sustainable income", which contradicted itself in any depleting column: "Years stack lasts ~29
years" sitting four rows above "Sustainable income $555K", when that income is precisely what
causes the depletion. "Target income" is accurate in every column and matches the slider's own
label.

## 3. Open / future work

Nothing blocking. Two ideas worth their own specs:

- **Genuine sustainable income per column** — solving for the draw an escape-velocity stack could
  support indefinitely, rather than echoing the target. This is new math (the current row is a
  constant reference across the four year-chips) and would make the row do real work in every
  column.
- **"Keep stacking past retirement"** — see §2.4; needs a `dcaEndYear` field.

## 4. Doc corrections

- **The post-ship checklist's "FAQ JSON-LD, 4 Questions" is wrong — the page has 5**, and had 5
  before this feature. Verified by diffing the block across every commit (2,547 bytes, unchanged
  throughout). Fix the checklist figure.
- Confirm SITE_GUIDE §17 carries §2.1 *with both worked examples* ($592 and $15,000). The examples
  are what make the asymmetry survive future edits; the principle alone reads as an oversight.
- `RETIREMENT_SCENARIO_COMPARISON_DESIGN.md` §8 should record the commits above. Its §7 (pre-build
  reconciliation) and its chart-overlay spec in §3 are now historical — mark them so rather than
  deleting, since they document why the DCA chip, the 4% rule, and the overlay took the shapes they
  did.

## 5. Process note

The original build prompt authorized self-merge, and the module reached production before any audit
— which is how the duplicate DCA chip and the unclamped variant scenarios got in front of users.
Every subsequent round ran as *push, verify on preview, JM merges*, and every defect after that was
caught before it shipped. Worth making the default in future build prompts.

Reviewing on the real page with real numbers also caught what specs didn't: the "Sustainable income"
contradiction was invisible until a depleting column sat beside an escape-velocity one.
