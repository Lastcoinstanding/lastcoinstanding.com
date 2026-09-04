# The Rundown v2.1 — Class C proposals

_2026-09-04. Filed against JM's review-round-1 rulings, from
`RUNDOWN_REVIEW_ROUND1_DISPOSITIONS` (SHA-1
`1d1d173d69b0e30df87b081e84229f614a17bc9f`, verified before ingest). Class A and
Class B are built and live on the unlisted page; this is the Class C
verify-and-propose pass. **No Class C item is built.**_

_Every figure below was computed live from the shipped modules in a browser
against production's own price. Where a proposal rests on a judgement rather
than a measurement, it says so._

---

## 0 · What the verification changed

Three of the four things worth reporting are things the recommendation as
written would have run into. Taking them first, because two of them need a
ruling before the module can be specified at all.

1. **C1 is feasible on the premium side — comfortably.** The check JM asked
   for came back stronger than the discount side it would replace. §1.
2. **But the reversion module goes blank in the dead band**, and C1 makes it
   *always-on*. An always-on module with a state in which it renders nothing
   is a contradiction, and it is a 10%-wide state. **Ruling needed.** §2.
3. **The implied rates are arithmetically correct and rhetorically
   dangerous.** At today's depth the median reversion implies **248% a year**
   and the shortest **745% a year**. Both are honest annualisations and both
   are screenshot bait. **Ruling needed.** §3.
4. **C2's tick marks cannot land on A4's slider as it is built** — the
   durations are months and the slider is whole years from 1. §5.

---

## 1 · C1 feasibility — the premium-side duration record

**Verified: usable, and better-populated than the discount side.**
`ReversionDurations.scan()` probed across the channel:

| Multiple | State | Episodes | Completed samples | Band widened? | Median |
|---|---|---|---|---|---|
| 0.38× | discount | 4 | 11 | **yes → 0.43** | 14.2 mo |
| 0.42× | discount | 3 | 10 | no | 9.7 mo |
| **0.52× (today)** | **discount** | **7 (6 closed)** | **66** | **no** | **9.1 mo** |
| 0.70× | discount | 7 | 170 | no | 8.9 mo |
| 0.90× | discount | 8 | 234 | no | 7.1 mo |
| 1.00× | — | **hidden (dead band)** | — | — | — |
| 1.10× | premium | 8 | 183 | no | 7.5 mo |
| 1.30× | premium | 5 | 150 | no | 8.3 mo |
| 1.60× | premium | 4 | 112 | no | 9.9 mo |
| 2.00× | premium | 5 | 81 | no | 9.5 mo |
| 2.50× | premium | 6 | 59 | no | 9.9 mo |

**The premium side needs no special handling.** Every premium probe returns
four or more episodes with no band widening, which is more evidence than the
at-floor case the module ships with today (three episodes at 0.42×). The
symmetry JM assumed is real, and it is real because the scan was written
two-sided from the start — the only thing that changes across 1.0× is the
direction of the comparison.

**Two things the module must disclose, both visible in the table.**

- **Band widening below the floor.** At 0.38× the scan widens its band to
  0.43× to reach five completed samples. That is the module quietly answering
  a slightly different question, and `widened` is exposed for exactly this
  reason. The module states the band it actually used whenever it differs from
  today's multiple.
- **Episodes, not samples, govern the N<3 rule.** At today's depth the scan
  returns 66 completed *samples* from **6 completed episodes** — so a
  distribution is publishable here, and the module is on firmer ground than R2
  ever was at the floor. At 0.42× it is exactly 3 and the rule is one episode
  from firing. The module counts episodes.

---

## 2 · The dead band — the one structural problem with C1

**`scan()` returns `{state:'hidden'}` for any multiple between 0.95× and
1.05×.** Verified at 0.98× and 1.02×; both hidden. That is
Discount-or-Premium's own rule, and it is a good one — near trend there is no
gap to measure, and a "time to close the gap" figure computed there would be
noise with a decimal point.

The problem is what C1 does with it. Today R2 is an *intent* module: if it
withholds itself, the Raise-cash cluster is one module shorter and nothing
breaks. C1 promotes that engine to the **always-on** cluster, where a module
that renders nothing leaves the page's permanent furniture with a hole in it —
and B3 now prints a module count that would have to count it.

**Three options.**

1. **A third identity: at-trend.** The module renders a short, true statement —
   price is at trend, there is no gap to close, here is the floor history and
   the route — and carries no duration figures. Cheapest, honest, and it keeps
   the always-on cluster at a fixed size in every state.
2. **Fall back to the floor-visit module in the dead band.** Consistent with
   C1's own logic (the module already switches identity by state) but odd in
   substance: the floor is furthest from the reader's attention at 1.00×,
   which is the objection C21 raised in the first place.
3. **Widen the module's band below D-or-P's.** Rejected, and worth saying why:
   it would publish figures the canonical home declines to publish, which
   breaks the one rule the whole echo architecture rests on.

**Recommendation: option 1.** It costs one short copy state, it is the honest
content for that position, and it means the always-on cluster is two modules at
every point in the channel rather than two-or-sometimes-one.

---

## 3 · The implied rates — a register problem, not an arithmetic one

At today's 0.52×, reading from the completed episodes:

| Card | Duration | Reverts by | Trend price then | **Implied rate** |
|---|---|---|---|---|
| Shortest | 4.3 mo | Jan 2027 | $172,658 | **+745.5% a year** |
| Median | 8.5 mo | May 2027 | $192,612 | **+248.0% a year** |
| Longest | 23.7 mo | Aug 2028 | $282,822 | **+90.0% a year** |

Every one of those is correct. A 92% price move completed in four months
annualises to 745%, and §5's machinery — condition in the title, `illustrative`
on the path, baseline alongside, "arithmetic, not a forecast" — is designed
precisely to carry numbers like these.

**It is still the wrong headline.** §5 governs what the page says; it cannot
govern what survives a screenshot. "745% a year" lifted out of its module is
indistinguishable from a price prediction, and this is the page most likely to
be quoted out of context — it is the one with the reader's own situation in it.
The three-figure rates are also an artefact of *short* windows: the shorter the
assumed reversion, the more absurd the annualisation, so the module's most
eye-catching number is the one resting on the least evidence.

**Recommendation: lead each card with the date and the trend price at it, and
demote the rate to the card's sub-line.** "Reverts by May 2027 · $192,612" is
the same claim, conditional in the same way, and it is legible when quoted
alone. Keep the rate — it is the comparable figure across cards — but not as
the number the eye lands on. For any card under twelve months, show the
**total** move rather than an annualised one, or show both with the total
first.

This is a judgement about register rather than a measurement, and it is
squarely JM's call. Flagging it rather than deciding it.

---

## 4 · C1 — proposed module spec

**Identity by state**, using the state function built for B6:

| State | Identity |
|---|---|
| below-floor · at-floor | **Floor approach module** — as built (A3). The approach is the occasion; the timeline stays. |
| below-trend · above-trend | **Reversion module** — below. |
| near-trend | **At-trend statement** — §2 option 1, no duration figures. |

**Reversion module anatomy** (§4 rules carry — ≤75 words of prose):

- **Question:** "Price is at ‹0.52›× trend, ‹48›% below. How long have
  stretches like this taken to get back?"
- **Verdict:** "Six completed stretches at or below this depth since 2010.
  They took between ‹4.3› and ‹23.7› months, median ‹8.5›." *(Above trend, the
  same sentence with "at or above" and no change in structure.)*
- **Three cards:** shortest · median · longest — each *date-and-price first*
  per §3, rate as sub-line, all three carrying the §5 conditional framing.
- **One line of floor context, routed** — the timeline retires to this:
  "Last floor approach July 2026, the third since 2014 → The Bitcoin Floor."
- **Register line:** §5 conditional-projection variant.
- **Route:** "Discount, or Premium? →".

**R2 merges in and is deleted.** Same engine, same figures, and the
same-number-never-headlines-twice rule forbids both.

**Revised cluster counts** (always-on stays 2 in every state):

| Intent | Now | After C1 |
|---|---|---|
| Just looking | 2 | 2 |
| Deploy new capital | 5 | 5 |
| Start or continue a DCA | 3 | 3 |
| **Raise cash** | **4** | **3** *(R2 merged away)* |
| Rebalance | 3 | 3 |
| Plan retirement | 4 | 4 |

---

## 5 · C2 — the three bars, and a slider problem

**The reslice works, and it resolves the A4≡D3 identity cleanly.** Figures at
today's price:

| Horizon | Ends at floor | Bought at trend | Returns to trend |
|---|---|---|---|
| 3 years | 25.9% | 35.2% | **68.2%** |
| 10 years | 26.8% | 29.5% | **38.3%** |

A4 headlines the trio; D3 keeps the reverts-by slider, the path chart, the
never-reverts line and the stack dollars, and refers to the rate as "the rate
above" rather than printing it as its own headline. The identity stops being a
duplication the moment one page shows the number *comparatively* and the other
shows it *over time* — which is what JM's reslice does.

**Above trend the third bar goes negative on short horizons**, which is the
risk read C27 was after, delivered by the chart's own geometry rather than by a
warning sentence. That is the strongest argument for the trio.

**The slider problem.** C2 asks for tick marks at shortest/median/longest
reversion on A4's horizon slider. Those durations are **4.3, 8.5 and 23.7
months** — 0.36, 0.71 and 1.98 years. **A4's slider runs 1–30 in whole years**,
so two of the three ticks fall below its minimum and the third lands between
stops. The ticks cannot be drawn on the control as built.

Two ways out, both small:

1. **Re-scale A4's slider to months, matching D3's** (which already runs 6–60
   months). The two always-on/deploy sliders then share a scale, which is worth
   something on its own.
2. **Keep years and clamp the ticks to the slider's range**, drawing only those
   that fall inside it. Cheaper, but at today's depth it would draw one tick of
   three, which is worse than none.

**Recommendation: option 1**, with A4's range widened to cover both jobs
(≈6–360 months). It is the only version where the ticks mean what they say.

---

## 6 · C3 — the sister-page control

**Proposed markup**, identical on both pages, differing only in which item
carries `is-active` and `aria-current`:

```html
<nav class="sister-tabs" aria-label="Two ways into the numbers">
  <a href="/dashboard" class="sister-tab is-active" aria-current="page">
    <span class="sister-tab-n">The Dashboard</span>
    <span class="sister-tab-d">the glance</span>
  </a>
  <a href="/the-rundown" class="sister-tab">
    <span class="sister-tab-n">The Rundown</span>
    <span class="sister-tab-d">your situation</span>
  </a>
</nav>
```

**Placement: immediately below the `<h1>`, above the standfirst**, inside
`.hero` on both pages. Reasons: it is a statement about *what this page is*,
which belongs with the title rather than floating above it; it sits inside the
container whose content box is already aligned to the module width on the
Rundown; and putting it above the H1 would give a page two competing first
elements.

**On the Rundown it replaces the "Reading from the strip above…" line
outright**, which is what C5 asked for — that line was doing this job in prose
and doing it wordily.

**Two notes on shipping it.**

- **The Dashboard opts out of the channel ribbon** (`channel_ribbon: false`),
  the Rundown does not. So on the Dashboard the tabs sit directly under the
  nav, and on the Rundown they sit under the ribbon. That is fine — it is one
  strip lower on one page — but it is worth seeing on the preview before it
  goes public, because the Dashboard is a public anchor page.
- **The Gallery stays in the nav.** Two tabs, not three, per the disposition:
  the control is for the two live-position pages, and adding a timeless
  exhibits page to a positional pair would undo the §0 taxonomy it exists to
  render.

**Sequencing, as ruled.** The Rundown side is page-local and unlisted and can
land with the rest of Class C. **The Dashboard side is a public anchor change:
own branch, preview URL, JM's merge.** Nothing touches `dashboard.njk` until
that branch exists.

---

## 7 · The ruling list

| # | Decision | Recommendation |
|---|---|---|
| 1 | **Dead-band identity** (§2) — third at-trend identity, floor fallback, or widen the band | Third identity; keeps the always-on cluster at two in every state |
| 2 | **Rate presentation** (§3) — headline rate, or headline date-and-price with rate demoted | Demote the rate; lead with the date and the trend price |
| 3 | **A4 slider scale** (§5) — months, or clamp the ticks | Months, range widened, shared with D3 |
| 4 | Module spec as §4 | — |
| 5 | Three bars as §5, D3 demoted to "the rate above" | — |
| 6 | Sister-tabs markup and placement as §6 | — |

**Nothing is built until these are ruled.** On JM's word, the build order is:
C1 (module + R2 deletion + counts) → C2 (bars, then the slider re-scale, then
ticks, which depend on C1's figures) → C3 Rundown side → C3 Dashboard branch
for preview and merge.
