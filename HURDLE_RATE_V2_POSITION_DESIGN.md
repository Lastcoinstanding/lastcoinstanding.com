# Channel-Position-Aware Hurdle — Design Document (Hurdle Rate v2)

_Created 2026-08-08. Promoted from the `PAGE_IDEAS_BACKLOG` entry captured during the v1.1 build,
flagged HIGH priority by JM. Extends `/the-bitcoin-hurdle-rate` (live since 2026-08-07)._

> **DRAFTED AGAINST A STALE COPY — RECONCILED 2026-08-08, SHIPPED.** This doc was written from the
> pre-migration `HURDLE_RATE_DESIGN.md` and the v1.2 page as reviewed on 2026-08-07. The §0.1
> reconciliation against the repo's §4.2/§12 was completed before any code: **no contradiction** —
> §4.2 framed the non-drawing of `spot→trend` as a presentation choice, not a data limitation. The
> one correction: reviving the geometry needs BOTH the own y-axis (clears the legibility objection)
> AND the H≥3 fence (clears the §7-flag-1 overclaim); the fence is load-bearing for §4.2, not
> editorial. Migrated into the repo from Downloads 2026-08-08 (LF). Canonical shipped record:
> `HURDLE_RATE_DESIGN.md §13`.

---

## 1. What v1 computes, and what it ignores

The hurdle in v1 is trend-to-trend: `trendCAGR(t, H) = ((t + 365.25H)/t)^(b/H) − 1`. It answers
*what has bitcoin's trend grown at over a window of this length* — a structural property of the
model, independent of price today.

That deliberately ignores where bitcoin actually sits. The page displays channel position in its
ribbon (`0.43× trend · near the floor`) and nothing downstream consumes it. The one exception is
the "optimistic edge" stat card, which shows the spot→trend return at the chosen horizon and is
the only place position touches the arithmetic.

**The gap:** a capital decision made when bitcoin is at 0.43× trend faces a materially different
bar than the same decision at 1.5× trend, and v1 reports the same number for both.

## 2. The finding — the reversion premium decays with horizon

Define channel position `k = spot / trend(t)`. The position-aware hurdle is the return bitcoin
delivers from *today's price* to trend at the horizon:

```
posCAGR(t, H, k) = ( (1/k) · (t + 365.25H)/t)^b )^(1/H) − 1
```

The difference from `trendCAGR` is the **position adjustment**. Computed at t = 6,424 days
(2026-08-08), b = 5.77 — illustrative, recompute live:

| Horizon | Trend hurdle | At k = 0.43 (today) | Adjustment | At k = 1.5 | Adjustment |
|---|---|---|---|---|---|
| 1 yr | 37.6% | 220.0% | **+182.4** | −8.3% | **−45.9** |
| 3 yr | 35.4% | 79.4% | +44.0 | 18.3% | −17.1 |
| 5 yr | 33.5% | 58.0% | +24.5 | 23.1% | −10.4 |
| 10 yr | 29.7% | 41.1% | +11.4 | 24.5% | −5.2 |
| 20 yr | 24.5% | 29.9% | +5.4 | 22.0% | −2.5 |
| 30 yr | 21.1% | 24.6% | +3.5 | 19.5% | −1.6 |

**The editorial payload: entry position dominates short-horizon decisions and barely touches long
ones.** Over thirty years, buying 57% below trend adds three and a half points to the bar. Over one
year it adds a hundred and eighty. This is structurally the same shape as v1's declining-hurdle
finding — a large effect that decays with the window — and the page can state both in one breath.

It is also the honest counterweight to the large short-horizon numbers. They are real, and they are
real *only* for someone whose horizon is a year, which is not the reader this page is written for.

## 3. What makes this worth building — the tool can say no

At k = 1.5 with a one-year horizon, the position-aware hurdle is **negative**. Bitcoin, on the
model's own terms, would be expected to *lose* value returning to trend, so almost any positive
return beats it. The tool would tell a reader: bitcoin is expensive right now; your project clears
the bar; don't buy.

**A bitcoin site shipping a calculator that can tell you not to buy bitcoin is worth more to a
sceptical allocator than anything else on the page.** It is the strongest available demonstration
that the tool computes rather than advocates. That capability exists only if the symmetry is
genuine, which is why §5 is a blocking requirement rather than a nicety.

## 4. Design

### 4.0 The framing this rests on (JM, 2026-08-08) — two insights, one each

The toggle is not a settings control. It exists because there are **two separate insights** and
trying to convey both at once conveys neither:

- **View 1 — the structural insight.** Bitcoin's trend growth is high, and it declines with the
  horizon of the decision. This is a property of the model, true regardless of price today. It is
  the page's primary claim and it leads.
- **View 2 — the position correction.** The structural answer must be tempered or augmented,
  sometimes substantially, by where bitcoin currently sits in the channel.

**Supplemental in what sense — the distinction that matters (JM, 2026-08-08, after the first build
read it the wrong way).** "Supplemental" here means supplemental *in importance and default
prominence* — view 1 leads, view 2 is opt-in and off by default. It does **not** mean supplemental
*as a surface*: view 2 is **not** an annotation layered on a trend-based answer. **When selected, the
position view is the COMPLETE reading — the verdict, every stat card, and the chart all compute on its
basis. It is a different answer to the same question, not a footnote on the trend answer.** The
original §4.0 wording ("modifies insight 1 rather than replacing it") was ambiguous between these two
readings; the first v2 build reasonably implemented the surface reading (the toggle drove only the
chart and one card, leaving the verdict on the trend basis), which produced a page whose verdict
contradicted its own chart at `?view=position&r=50` — the headline said "clears at every horizon"
while the position curve it sat above showed the candidate not clearing until year six. That
contradiction is what forced the distinction to be stated explicitly. Each view, when selected, is
internally complete and self-consistent; the toggle chooses *which whole answer*, not *which chart*.

Each view says one thing. Design decisions below should be tested against that: if a change makes
a view carry part of the other's argument, it is the wrong change.

### 4.1 The control — a view toggle, not an overlay

Two curves on one chart would be unreadable at these magnitudes. Instead the chart plots **one
hurdle curve in one of two views**, selected by a small toggle above the chart:

- **From the trend** (default) — `trendCAGR`. The structural bar. What v1 shows today.
- **From today's price** (opt-in) — `posCAGR`. The bar given where bitcoin actually is.

Default is the trend view. The position view is opt-in because it carries an assumption the
structural view doesn't (§6.1).

**The floor band travels with the view.** In the trend view it is the floor path as built. In the
position view the band's edges become spot→floor (lower) and spot→trend (upper) — which is the
band geometry the original design doc specified before the v1 build correctly rejected it for
being unreadable at short horizons. It is readable here because the position view owns the
magnitudes rather than sharing an axis with the structural view.

### 4.2 One persistent surface for insight 2 — the reworked stat card

**The tension to resolve.** Insight 2 is supplemental, so insight 1 leads — but this feature is
high priority *because* it is time-sensitive, and a timely finding parked behind a tab most readers
never open is not doing its job. Defaulting to the trend view without a persistent surface would
bury the thing that made the feature urgent.

**The resolution: the existing "optimistic edge" stat card is reworked into the position-adjustment
card, and it renders in BOTH views.** A reader who never touches the toggle still sees where bitcoin
sits and what that does to their bar; the toggle exists for readers who want the shape of it across
horizons. One surface, no duplication.

Card content, position-neutral (§5):

> **41.1%** — from today's position over 10 yr
> _0.43× trend · adds 11.4 pts to the bar_

Above trend the identical structure renders *1.52× trend · subtracts 5.2 pts*. Only the multiplier
and the sign change; the sentence shape does not.

**No separate readout line.** An earlier draft put a sentence under the chart saying the same thing.
Two surfaces reporting one number is the internal inconsistency the CAGR-window reconciliation
existed to prevent — the card is the single carrier. The position view's chart caption explains the
*curve*, not the number.

### 4.3 Minimum horizon in the position view

The position view starts at **H = 3 years**, not 1. Below three years the assumption in §6.1 stops
being a planning input and becomes a bet on timing, and the numbers (220% at one year, 647% at six
months) would breach `HURDLE_RATE_DESIGN §7` flag 1 on any screenshot.

State the fence on the page rather than silently clamping the axis:

> This view starts at three years. Inside that, the number depends almost entirely on *when*
> bitcoin returns to trend rather than *whether* — that's a bet on timing, not a capital plan.

**This is a design fence, not a data limit.** The engine computes below three years; the view
declines to plot it. **The alternative — axis from one year with the caveat in copy — is CLOSED, not
open (JM, 2026-08-08; see §8.1).** Taking it reintroduces the ~227%/H=1 figure §4.2 rejected, so it
reopens a settled build outcome rather than being a copy choice.

### 4.4 Stat strip consequences

Reworking the card (§4.2) rather than adding one keeps the strip at five cards — the 3+2 company /
2+2 personal grid settled in v1.2 is unaffected. The card keeps its slot and changes its label,
its sub-line and its neutrality; the figure it reports is the same computation.

## 5. BLOCKING — label neutrality

Because position drives the computation, the arithmetic is symmetric for free. **The labels are
not.** Any wording that presumes the below-trend case bakes today's position into the page and
reads as advocacy the moment bitcoin trades above trend — and nobody will notice, because the
numbers will still be correct.

**Banned in this feature's copy:** "the opportunity", "the upside", "the discount", "what you gain
by entering here", "optimistic", "edge", "while it lasts". Every one of these is a below-trend word.

**Required instead:** neutral, sign-carrying constructions — *adds / subtracts*, *raises / lowers*,
*above / below trend*, *position adjustment*.

**Verification, and it is mandatory before ship:** review every string in this feature at a
**simulated above-trend position** (`k = 1.5`), not only at today's. A label that reads naturally at
0.43× and absurdly at 1.5× is a defect, not a stylistic preference. Ship a debug override or a URL
param for the reviewer to force `k` — checking this by waiting for the market is not a plan.

## 6. Honest fences

### 6.1 The assumption, stated precisely

The position view assumes **bitcoin returns to trend at some point within the horizon and tracks it
thereafter**. Note this is weaker and more defensible than "reverts exactly at the horizon": a path
that reaches trend early and then tracks it ends at the same place, so the formula covers both.

What it does *not* assume is any particular timing inside the window. What it *does* assume is that
reversion happens at all — which is the power law holding, the same assumption the whole page rests
on, and no stronger.

### 6.2 Model uncertainty travels with the output

Everything in §2 inherits the power law's uncertainty in full, including a floor breach or a break
in either direction. The position view amplifies the consequence of the model being wrong, because
it leans on reversion rather than on trend growth alone. `HURDLE_RATE_DESIGN §7` flag 2 applies with
more force here, not less, and the caveat link belongs on the same screen.

### 6.3 The overclaim limit still binds

`§7` flag 1 — the hurdle applies to capital that can wait, at the margin, for a holder who can
survive the drawdown — is unchanged. A higher bar does not widen the claim; it narrows the set of
alternatives that clear it.

## 7. Build notes

- **Consume the ribbon's `k`, don't recompute it.** The channel ribbon already derives position from
  live spot and `plPrice(t)`. Two derivations of the same number will diverge under a stale-price
  fallback.
- **`todayPriceIsLive` gating is load-bearing here.** The position view is *entirely* a function of
  spot. If the live price falls back to the `PL_DATA` seed, the view must say so or be disabled —
  a position-aware hurdle computed from a stale seed is worse than no position view. This is
  stricter than v1, where spot only set the band's width.
- **URL state** — the view belongs in the shareable payload (`?view=trend|position`), alongside
  `?r=`, `?h=`, `?lens=`.
- **Cross-link `/discount-or-premium`** — that page owns channel position as a subject; this view is
  its application to a capital decision. One link each way; note the §6.10 one-placement rule.
- **Refresh surface: zero.** Everything computes live from `PL_DATA` + spot.

## 8. Resolved — JM rulings, 2026-08-08

1. **Minimum horizon in the position view — RESOLVED: three years, and the fence is LOAD-BEARING.**
   Below three, the number turns on *when* reversion happens rather than whether, and the
   short-horizon figures (220% at one year, 647% at six months) would breach §7 flag 1 on any
   screenshot. The engine still computes below three; the view declines to plot it, and says why on
   the page. **§8.1 — the "axis from H=1 with the caveat in copy" alternative is CLOSED, not open
   (JM, 2026-08-08).** §4.2 rejected drawing `spot→trend` for two reasons — the §7-flag-1 overclaim
   AND y-axis legibility. The position view's own axis clears only legibility; the H≥3 fence is what
   clears the overclaim. So the fence and the separate axis *together* revive the geometry — either
   alone does not, and running the axis from H=1 reopens the §4.2 rejection. It is a decision to
   revisit a settled build outcome, not a copy tweak, and needs an explicit ruling to reopen. An open
   question that quietly undoes a settled decision is worse than no question.
2. **Default view — RESOLVED: the trend view leads.** Follows directly from §4.0: insight 2 is
   supplemental and modifies insight 1 rather than replacing it. The time-sensitivity concern is
   handled by the persistent card (§4.2), not by changing the default.
3. **The "optimistic edge" card — RESOLVED: reworked, not removed.** It becomes the always-visible
   carrier of insight 2 (§4.2). JM could not judge this without seeing it live; if the reworked card
   reads poorly on the preview, removing it and relying on the toggle alone is the fallback — but
   then insight 2 is invisible to anyone who doesn't click, which §4.2 exists to prevent.
4. **Neutrality sweep scope — RESOLVED: fence to new copy, with an explicit pre-ship gate.** v1
   strings stay as they are during the build. **But this feature supersedes the "optimistic edge"
   card, so that string is in scope regardless** — the exception is because the card is being
   rebuilt, not because the fence moved.

   **OPEN ITEM, blocking production ship:** sweep the whole page for below-trend language before
   these updates go to production. Add to `OPEN_ITEMS.md` at build time so it cannot be forgotten
   between the build and the ship — it is exactly the kind of deferred item the §11 gate exists to
   catch.

## 9. Sequencing note

This is a v2 on a page that shipped 2026-08-07. It is an enhancement to a live page, not a new
build, so it inherits the live page's verification list rather than `NEW_PAGE_CHECKLIST` in full:
preview eyeball, mobile 375px, URL state round-trip, de-tell grep, pixel-probe on the per-commit
deployment. **No new OG card or carousel slide is needed** — both exist and neither is invalidated
by adding a view.
