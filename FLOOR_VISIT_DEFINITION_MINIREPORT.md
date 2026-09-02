# FLOOR-VISIT DEFINITION — UNIFICATION MINI-REPORT

_2026-09-01. Filed under JM's Phase 0 v2 ruling 6: one visit definition site-wide,
canonical home The Bitcoin Floor — **with a hard gate that any resulting change to a
shipped page's published counts comes back as its own mini-report, counts before and
after, side by side, before that page is edited.**_

_**Nothing on The Bitcoin Floor has been touched.** This is the gate paper. The Rundown
ships on the unified definition, as instructed; the Floor edit waits for JM's word._

_All figures computed live from `PL_DATA` through the shipped modules
(`shared/power-law-data.js`, `shared/channel-entries.js`) in a browser harness, against
the working tree on `docs-rundown-v2-phase0`. Seed price $62,997 (2026-07-31, the last
sample); `TODAY_DAYS` 6451; trend today $153,344; today's multiple **0.411×**._

---

## 1 · The two definitions

| | **Current — Floor page** (`computeEpisodes`) | **Unified — the Rundown's rule** (`floorVisits`) |
|---|---|---|
| Qualifying sample | `multiple < 0.42` — strictly **below** the floor | `multiple ≤ 0.42 × 1.01` — **within 1% of, or below** |
| Episode boundary | **sample contiguity** — one non-qualifying sample ends the run | **a >100-day gap** between qualifying samples |
| Provenance | the page's own | the 100-day rule is `discount-or-premium.js`'s, already shared with the Rundown |

---

## 2 · Counts, before and after

**The headline count does not move. Everything underneath it does.**

| | Current rule | Unified rule |
|---|---|---|
| Episodes, all eras | **4** | **4** |
| Episodes, modern (2014+) | **3** | **3** |

That is the whole of the good news, and it is worth stating plainly before the detail:
**no published count changes.** The Floor page's FAQ, its tripwire copy and its section
lede all say *three* modern approaches, and they still say three afterwards.

**But it is a different three.**

### Current rule — what the Floor page renders today

| # | Window | Samples | Span | Deepest | Below the floor |
|---|---|---|---|---|---|
| 1 | 2010-08-30 → 2010-10-17 | 5 | 48 d | 0.241× | 42.6% *(genesis era — recorded, given no weight)* |
| 2 | 2015-08-28 | 1 | 0 d | 0.412× | 1.8% |
| 3 | 2015-09-21 → 2015-10-15 | 3 | 24 d | 0.398× | 5.2% |
| 4 | 2023-01-06 | 1 | 0 d | 0.418× | 0.4% |

### Unified rule — what it would render instead

| # | Window | Samples | Span | Deepest | Below the floor |
|---|---|---|---|---|---|
| 1 | 2010-08-30 → 2010-10-17 | 5 | 48 d | 0.241× | 42.6% *(unchanged)* |
| 2 | **2015-08-28 → 2015-10-15** | **4** | **48 d** | **0.398×** | **5.2%** |
| 3 | **2022-12-25 → 2023-01-06** | **2** | **12 d** | 0.418× | 0.4% |
| 4 | **2026-07-13 → 2026-07-31 — OPEN** | **2** | 18 d | **0.423×** | **none — it never went under** |

### The four changes, named

1. **The two 2015 episodes merge into one.** They are 24 days apart; the 100-day rule
   treats them as one approach. The page currently narrates them as separate episodes
   with separate depths (1.8% and 5.2% under); afterwards there is one episode reaching
   5.2% under across 48 days.
2. **The January 2023 episode gains a predecessor sample** and becomes a
   December 2022 – January 2023 episode. The graze band admits 2022-12-25, which sits
   within 1% of the floor without going under. Depth is unchanged; the **start date
   moves back twelve days** and the span goes from a single sample to 12 days.
3. **A fourth, open episode appears — July 2026, and it is happening now.** This is the
   substantive addition. It exists only under the graze band: its deepest sample is
   **0.423×**, which is *above* 0.42, so the current strict rule does not see it at all.
4. **`belowPct` goes negative for that episode.** The strip renders
   `<depth>% below the floor`; for July 2026 that value is **−0.7%**. The label is wrong
   for an approach that never breached. This is the one place where adoption is not a
   parameter change but a small render change.

---

## 3 · What else on the Floor page moves

Enumerated so the gate decision is made on the full cost, not on the table above.

- **The FAQ answer** (`the-bitcoin-floor.njk`, "Not in the modern record…") hardcodes all
  three depths in prose: *"1.8% under in August 2015, 5.1% under that September, 0.4% under
  in January 2023."* Under the unified rule that becomes two breaches (5.2% in
  Aug–Oct 2015, 0.4% in Dec 2022 – Jan 2023) plus one approach that never went under. The
  sentence needs rewriting, not retuning. It also says *"every one of those reverted,
  sitting above trend within 24 months"* — which cannot be said of an open episode.
- **The tripwire copy** (`fl-tripwire-why`) says *"the three modern approaches never met
  the pair, the deepest going 5.1% under and none of them holding."* Still true in
  substance; the count still reads three; the composition behind it changes and the
  "none of them holding" claim now has an open episode inside it.
- **The reversion statistics** — `flRevMedian` and `flRevOvershoot` are computed over
  modern episodes' `gap24`. Merging the 2015 pair removes one member from that set, and
  the open 2026 episode has no 24-month window yet, so it must be **excluded from the
  reversion stats explicitly** rather than counted as a zero.
- **`selectEpisode(modern[modern.length - 1].id)`** opens the strip on the most recent
  modern approach. Afterwards that is the **open** episode — a card with no outcome,
  where the page currently opens on a closed one whose conditions it describes as most
  resembling today. Arguably better, but it is a change to what a reader sees first.
- **`floorParityQA()` and `tripwireState()`** both read `computeEpisodes` and will need
  re-greening.

---

## 4 · Robustness of the unified rule's two constants

Both were checked by sweep, not asserted.

**The 100-day episode gap is completely insensitive.** Every value from 30 to 200 days
gives the same 4 / 3 split:

| gap | 30 d | 60 d | 90 d | **100 d** | 110 d | 150 d | 200 d |
|---|---|---|---|---|---|---|---|
| all eras / modern | 4 / 3 | 4 / 3 | 4 / 3 | **4 / 3** | 4 / 3 | 4 / 3 | 4 / 3 |

The rule is doing real work (it merges the 2015 pair, which are 24 days apart) but the
*value* is not load-bearing anywhere in the plausible range.

**The graze band is load-bearing at exactly one place — and that place is the open
episode.**

| graze | 1.000 | 1.005 | **1.009** | **1.010** | **1.011** | 1.020 | 1.050 |
|---|---|---|---|---|---|---|---|
| all eras / modern | 3 / 2 | 3 / 2 | 4 / 3 | **4 / 3** | 4 / 3 | 4 / 3 | 4 / 3 |

v1's recorded sensitivity check — *"perturbing GRAZE ±10% leaves the visit count
unchanged at four"* — is **confirmed**, and it is a check on the ±10% of the *margin*
(1.009–1.011), which is the right reading of it. But the sweep shows the honest shape of
it: **below about a 0.9% graze the current visit disappears**, because today's deepest
sample sits 0.7% above the floor. The band is what makes "price is at the floor now" a
true statement rather than a nearly-true one.

**That is the substantive question inside ruling 6, and it should be decided on its
merits rather than inherited:** is an approach that comes within 0.7% of the floor and
stops a visit to the floor? The Floor page's own published language says price has
*"approached the line"* and treats grazes as the phenomenon of interest — its episode
buttons are labelled graze vs break. The graze band is that language made numeric, which
is the argument for it. The argument against is that a page whose tripwire is defined by
*breaching* the floor now counts episodes that never breached it.

---

## 5 · Recommendation

**Adopt the unified rule on the Floor page**, with the four consequences in §2 and the
copy work in §3 done in the same commit — and treat the `belowPct` render (change 4) as
the one place needing new code rather than a new constant: an episode that never
breached should read *"came within 0.7% of the floor"*, not *"−0.7% below the floor."*

**Two things argue for doing it, and one against.**

For: it is the only way to have one visit definition site-wide, which is ruling 6's whole
point; and the merged 2015 episode is a **better description of what happened** — one
approach lasting 48 days, not two lasting zero and 24.

Against: it puts an **open, un-outcomed episode** into a page whose reversion statistics
and tripwire reporting are built on closed ones. That is manageable — the Rundown already
handles an open visit by describing it and scoring nothing — but it is real work on a
shipped flagship, and it is why this gate exists.

**Sequencing.** Nothing forces this now. The Rundown ships on the unified definition
today; until the Floor page adopts, the Rundown's A3 snack **states its own method and
routes to the Floor page for the narrated record** rather than claiming the two agree —
which is honest, is the pattern `v1 §16.2` already established for the WODN
pooled-vs-narrated split, and costs one line. When JM gives the word, the Floor page
adopts and that line comes out.

_Awaiting JM. No Floor-page edit until then._
