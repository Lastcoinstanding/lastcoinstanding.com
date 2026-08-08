# Build Prompt — Hurdle Rate v2: the channel-position view

> **EXECUTED on `feat/hurdle-position-view`, 2026-08-08. Migrated into the repo from Downloads (LF).**
> §0.1 reconciliation reported and confirmed before any code. Canonical shipped record:
> `HURDLE_RATE_DESIGN.md §13`. Note §0.1's "legible once the position view owns its own y-axis"
> framing was incomplete — the axis clears only the legibility objection; the H≥3 fence clears the
> §7-flag-1 overclaim, and both are needed (the fence is load-bearing for §4.2). The §8.1 "axis from
> H=1" alternative is closed (see the design doc §8.1).

_For Claude Code. Design doc: `HURDLE_RATE_V2_POSITION_DESIGN.md` (approved 2026-08-08). Read it
first — this prompt is the build order, not a replacement. Where the two disagree, the design doc
wins and flag the conflict rather than resolving it silently._

_This is an enhancement to a page that is already in production (`/the-bitcoin-hurdle-rate`, live
since 2026-08-07). Treat it accordingly: the bar for not breaking what's there is higher than for
adding what's new._

---

## 0. Before writing any code

**Create the branch first:** `feat/hurdle-position-view`. Do not work on `main`.

### 0.1 BLOCKING — reconcile the design doc against the repo

The design doc was drafted from a pre-migration copy of `HURDLE_RATE_DESIGN.md` and from the v1.2
page as reviewed on 2026-08-07. Since then the repo version gained **§12** (the chart reorder
rationale) and the **§4.2 BUILD OUTCOME** block recording the band geometry that shipped.

**This v2 touches that exact geometry.** Before coding:

1. Read the repo's `HURDLE_RATE_DESIGN.md` §4.2 and §12 in full.
2. Report any conflict between what those record and what the v2 doc proposes — particularly the
   band-edge definitions in the position view (§4.1 of the v2 doc proposes spot→floor / spot→trend,
   which is the geometry §4.2 explicitly rejected for v1).
3. **Do not resolve a conflict silently.** A v2 that contradicts a recorded build outcome is how the
   next reader gets misled. Report and wait.

The v2 doc's position is that the rejected geometry becomes legible once the position view owns its
own y-axis rather than sharing one with the structural view. Confirm that reasoning holds against
what §4.2 actually says, or flag that it doesn't.

### 0.2 Then read

- `HURDLE_RATE_DESIGN.md` in full (the live page's design record)
- `STYLE_GUIDE` §5 (copy register), §6.17 (toggle recipe), §6.37 (stickiness)
- The page source: `src/the-bitcoin-hurdle-rate.njk`, `src/_includes/_pageassets/the-bitcoin-hurdle-rate.js`, and its CSS

## 1. The engine

### 1.1 The new function

```js
// k = spot / trendPrice(t)  — channel position today
// Returns the annualised return from today's spot to trend at horizon H.
function posCAGR(t, H, k) {
  return Math.pow((1 / k) * Math.pow((t + 365.25 * H) / t, PL_B), 1 / H) - 1;
}
```

**Unit-test fixture**, computed at t = 6,424 days (2026-08-08), `PL_B` = 5.77. Recompute `t` live;
the percentages should track.

| H | trendCAGR | posCAGR at k=0.43 | adjustment | posCAGR at k=1.5 | adjustment |
|---|---|---|---|---|---|
| 3 | 35.4% | 79.4% | +44.0 | 18.3% | −17.1 |
| 5 | 33.5% | 58.0% | +24.5 | 23.1% | −10.4 |
| 10 | 29.7% | 41.1% | +11.4 | 24.5% | −5.2 |
| 20 | 24.5% | 29.9% | +5.4 | 22.0% | −2.5 |
| 30 | 21.1% | 24.6% | +3.5 | 19.5% | −1.6 |

**Note the k=1.5 column includes a negative result at H=1 (−8.3%).** That is correct, not a bug: if
bitcoin is well above trend and the horizon is short, the model expects it to lose value returning
to trend. The tool must be able to report that. See §4.

### 1.2 Where `k` comes from — consume, don't recompute

The channel ribbon already derives position from live spot and `plPrice(t)`. **Read that same
value.** Two derivations of one number will diverge under a stale-price fallback, and the whole
view is a function of `k`.

### 1.3 BLOCKING — `todayPriceIsLive` gating, stricter than v1

In v1, spot only set the band's width; a stale fallback made the page slightly wrong. **In the
position view, spot is the entire computation** — a position-aware hurdle derived from the
`PL_DATA` seed is fiction, not approximation.

Required: if `todayPriceIsLive` is false, the position view must **either be disabled with a stated
reason, or display its figures explicitly labelled as computed from the last monthly sample rather
than a live price.** Pick one and say which. It must not silently render as though live.

This applies to the persistent stat card (§3) as well as the view.

## 2. The view toggle

Two views over one chart, per design §4.1. **Not two curves on one axis** — the magnitudes differ
by an order of magnitude and the structural curve would flatten to a line.

- **"From the trend"** (default) — plots `trendCAGR`. This is exactly what ships today; the default
  path must be visually unchanged.
- **"From today's price"** (opt-in) — plots `posCAGR` using live `k`.

Use the `STYLE_GUIDE §6.17` toggle recipe if it fits, or the page's existing segmented-control
pattern if that reads better at this size — the lens toggle is already a §6.17 yin-yang and two of
those on one page may be one too many. **Your call; report which you chose and why.**

**Y-axis scales per view.** The position view's range is much larger; do not lock a shared axis.

**The band travels with the view** — see §0.1, do not implement until that reconciliation is
reported.

### 2.1 Minimum horizon in the position view

The position view plots from **H = 3 years**, not 1. The engine still computes below three; the view
declines to plot it. State the fence on the page rather than silently clamping:

> This view starts at three years. Inside that, the number depends almost entirely on *when*
> bitcoin returns to trend rather than *whether* — that's a bet on timing, not a capital plan.

If the horizon slider is set below 3 while the position view is active, decide and report the
behaviour: clamp the marker to 3, or show the view greyed with the fence copy. Prefer whichever
makes the fence legible rather than mysterious.

## 3. The persistent card — insight 2 without a click

The existing **"optimistic edge"** stat card is reworked into the position-adjustment card. It
renders in **both views**, so a reader who never touches the toggle still sees insight 2.

> **41.1%** — from today's position over 10 yr
> _0.43× trend · adds 11.4 pts to the bar_

Above trend the identical structure renders `1.52× trend · subtracts 5.2 pts`. The card keeps its
slot; the 3+2 / 2+2 grid from v1.2 is unaffected. **Do not add a sixth card.**

## 4. BLOCKING — label neutrality, and it must be testable

The arithmetic is symmetric because position drives it. **The labels are not symmetric for free.**
Wording that presumes the below-trend case bakes today's position into the page and reads as
advocacy the moment bitcoin trades above trend — and nobody will notice, because the numbers will
still be correct.

**Banned in this feature's copy:** "the opportunity", "the upside", "the discount", "what you gain
by entering here", "optimistic", "edge", "while it lasts".

**Required:** neutral sign-carrying constructions — *adds / subtracts*, *raises / lowers*,
*above / below trend*, *position adjustment*.

**Ship a debug override so this is checkable.** A URL param (e.g. `?k=1.5`) forcing channel position
for review purposes. Without it, the neutrality requirement can only be verified by waiting for the
market, which is not a plan. Document the param in `SITE_GUIDE`; it does not need hiding, but it
must not be linked from the page.

**Then actually use it:** review every string this feature adds at `?k=1.5` before requesting
review, and report what you checked. A label that reads naturally at 0.43× and absurdly at 1.5× is
a defect.

## 5. Honest fences (from design §6, all required on-page)

- **The assumption, stated:** the position view assumes bitcoin returns to trend at some point
  within the horizon and tracks it thereafter. This is weaker than "reverts exactly at the horizon"
  — a path that reaches trend early and tracks it ends in the same place — and the copy should say
  the weaker thing, because it is both more defensible and more accurate.
- **Model uncertainty:** the position view leans on reversion, not just trend growth, so
  `HURDLE_RATE_DESIGN §7` flag 2 applies with *more* force here. The caveat link belongs on the same
  screen as the number.
- **§7 flag 1 is unchanged:** the hurdle applies to capital that can wait, at the margin. A higher
  bar does not widen the claim.

## 6. Integration

- **URL state:** add `?view=trend|position` to the existing `?r=`, `?h=`, `?lens=` payload. Deep
  links must restore all four.
- **Stickiness:** the view joins the per-page `localStorage` payload (§6.37).
- **Cross-link `/discount-or-premium`** — that page owns channel position as a subject; this view
  applies it to a capital decision. One link each way, and mind the §6.10 one-placement rule against
  the existing related strip.
- **Refresh surface: zero.** Everything computes live from `PL_DATA` + spot. If anything you build
  would add a `MONTHLY_REFRESH` row, stop and report.

## 7. Documentation

- **`HURDLE_RATE_DESIGN.md`** — add a v2 section recording the two-insight framing (design §4.0),
  the view toggle, the three-year fence and why, and the reconciliation outcome from §0.1.
- **`SITE_GUIDE` §45** — update for the new view and the debug param.
- **`OPEN_ITEMS.md` — add at build time, not at ship time:** *pre-production sweep of the whole
  hurdle page for below-trend language ("optimistic", "edge", "opportunity", "discount"), scoped
  beyond the v2 copy to the v1 strings left in place.* This is a deferred item on a live page and
  must be tracked, per the `NEW_PAGE_CHECKLIST` §11 gate.
- **`DATA_AUDIT`** — no new rows expected; `PL_B` and `PL_FLOOR` are already tracked.

## 8. Verification

This is an enhancement to a live page, so it inherits the page's verification list rather than
`NEW_PAGE_CHECKLIST` in full.

- [ ] §0.1 reconciliation reported and resolved before any code was written.
- [ ] Engine fixture reproduces (§1.1), including the negative result at k=1.5, H=1.
- [ ] **The default path is visually unchanged** — trend view at default inputs should be
      pixel-identical to production apart from the new toggle and the reworked card.
- [ ] `todayPriceIsLive` false → position view disabled or explicitly labelled; never silently live.
- [ ] Every new string reviewed at `?k=1.5` and reported.
- [ ] Position view plots from H=3; the fence copy is visible, not a silent clamp.
- [ ] The card renders in both views and reads correctly above and below trend.
- [ ] URL state round-trips all four params; stickiness persists the view.
- [ ] Mobile 375px: toggle stacks, chart legible in both views, no horizontal scroll.
- [ ] §5 de-tell grep clean; refrain still appears exactly three times.
- [ ] Pixel-probe the per-commit deployment URL, not the branch alias.

## 9. Out of scope

The v1 below-trend-language sweep beyond the reworked card (tracked in `OPEN_ITEMS`, blocking
production ship — not this build). Any change to the trend view's own geometry. A sixth stat card.
New OG card or carousel slide — both exist and neither is invalidated by adding a view. The
funding-source arithmetic and the US spelling sweep, both separately backlogged.
