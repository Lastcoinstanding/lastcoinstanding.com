# THE RUNDOWN — PHASE 0 REPORT

_2026-08-28. Findings, not fixes. Runs `RUNDOWN_DESIGN.md` §12 Phase 0 in full, plus the
exhibits scoping commissioned alongside it (§B below). No page code was written and none
should be until JM ratifies this report — §12's gate. Where this report disagrees with the
design doc, the design doc is quoted and the disagreement is stated as a proposal for JM's
ruling, not as a change already made._

**What "verified" means in this document, precisely.** There is no Node and no Python on
this machine, so nothing here was produced by running the site. Every figure below comes
from an **awk port of the shipped engine** (`shared/channel-entries.js` `bandMetrics()`,
default target) run against the canonical `PL_DATA` extracted from
`shared/power-law-data.js` — 481 samples, matching the documented count. The port
reproduces the shipped algorithm line by line, but **it has not been checked against the
rendered page in a browser.** Green assertions prove only what they cover: these numbers
are reproducible *in principle* and the reproduction is *pending on-page verification*,
which is a Phase 1 gate, not a Phase 0 claim.

**One more precision caveat.** The live pages read a live spot price via `fetchTodayPrice`.
This report used the fallback the pages themselves use when the fetch has not resolved —
the latest `PL_DATA` sample, **$62,997 at day 6,418** — against trend at
**TODAY_DAYS ≈ 6,446** (2026-08-28). Today's rendered figures will differ slightly from
these. Nothing in the findings turns on that difference, and where it *would* turn on it,
that is itself reported (see Finding 2).

---

## The seven findings that should decide the build

1. **The site already has a canonical zone taxonomy, and it is not the one §4 proposes.**
   `positionLabel()` in `shared/power-law-data.js` is six bands on normalized log-space
   channel position, not five bands on the trend multiple. Per JM-5 it wins. §4's default
   should be struck, not adapted.
2. **Today's position sits on a knife edge, and the zone label is not stable.** Bitcoin is
   at ≈0.41–0.42× trend, which puts channel position within **±0.01 of zero** — the exact
   boundary between "near the floor" and "just below the floor". The label the reader sees
   can flip on a ~1% price move. A page whose whole architecture is "what does *this* zone
   mean" needs an answer for this before it ships.
3. **The flagship row's evidence base is two independent visits, not twenty-six samples.**
   At today's position the engine returns n = 26 — but under the site's own episode rule
   those 26 samples are **2 independent visits** (Aug 2015–Oct 2016, and Nov 2022–Jan
   2023). The design doc's own §9 rule then fires: "Zones with N < 3 prior visits show the
   visits individually — no distribution statistics on two data points."
4. **R1 has no counter-case in the record, and §5 makes the counter-case mandatory.**
   Waiting beat deploying in **0 of 26** cases at this position. The spec says every row
   carries its counter-case "no exceptions". At this position there is nothing to carry.
5. **The source engine is already era-filtered, which contradicts the v1 "full record
   only" fence.** `channel-entries.js` sets `TABLE_CUT` at 2014-01-01 and excludes
   everything before it. Any row built on it inherits a post-2014 sample. §1 and §10 say
   v1 is full-record; the shipped engine is not.
6. **Three of the seven rows have no position-conditioned engine to compute from.**
   Disciplined Rebalancing, Discount or Premium, and the Stress Test contain **zero**
   position-conditioning code. Under §5's own feasibility rule those rows do not ship as
   specified.
7. **R1's sensitivity gate passes, and passes decisively** — the qualitative reading is
   unchanged at every perturbation tested. The row's problem is not robustness; it is
   small-N and the missing counter-case.

---

## §12.1 · Overlap reads — and what they do to the row set

### Your Deployment Plan (`/your-deployment-plan` — slug verified)

**It owns R2's ground outright, and it is deliberately today-anchored.** From the page
script's own header: _"TODAY-ANCHORED only: the reader has capital to deploy now, the
channel is where it is now, and the only live decision is HOW — lump / ladder / hybrid.
Entry is not a variable (today IS the entry); entry-position/'when' exploration lives on
the future timing page."_

That single sentence resolves the overlap the design doc flagged as unresolved, and it
resolves it in the Rundown's favour on R1 and against it on R2:

- The site already runs a deliberate **three-page split**: *Lump Sum or Ladder In* is the
  retrospective teaching demonstration, *Your Deployment Plan* is the personal model, and
  the "when" question is routed away from both to Wait-or-Deploy-Now. SITE_GUIDE §33
  states the companion relationship explicitly.
- So **R1 (deploy vs. wait) is the Rundown's to condition** — it is the question the
  existing pages route *out* to, and WODN answers it from a position.
- **R2 (lump vs. ladder) is not.** Your Deployment Plan takes the reader's sum, cadence,
  horizon and front-load percentage. The Rundown v1 takes **no inputs at all** (§1), so it
  cannot pose R2's question in the form the reader carries it without becoming a worse copy
  of a shipped page.

**Proposed split, per §5's overlap rule:** the Rundown conditions on position and routes;
Your Deployment Plan owns the plan mechanics. Concretely — R2 is **cut as a row** and
becomes a *route* inside R1: once the deploy-or-wait question is answered from the record,
the reader is handed to Your Deployment Plan for *how*. This costs the page nothing it can
honestly deliver and removes a duplication the design doc predicted.

### Discount, or Premium?

**It carries a second, incompatible position vocabulary.** `discount-or-premium.js`
computes on the **raw trend multiple** with a three-state vocabulary — `discount` /
`at-trend` / `premium` — and a **near-trend dead band of 0.95×–1.05×** inside which the
discount/premium words are banned outright.

That collides with `positionLabel()`, whose "at trend" band runs **0.85×–1.20×**. The two
disagree about what "at trend" means by a wide margin. A Rundown that labels a position
"at trend" from `positionLabel` while routing to a page that calls the same position a
"discount" would contradict itself in one click. **This tension is reportable, not
resolvable by the build** — it is a site-wide vocabulary question and it is JM's.

**It also already defines "independent visit", which §4 asked Phase 0 to propose.** See
§12.2 below — this is the most useful thing the overlap read turned up.

### The Heatmap (`/heatmap` — note the slug)

**No zone taxonomy, and no engine the Rundown can condition on.** The page has no JS asset
of its own (`heatmap-head.html` and `heatmap.css` only); it is a cohort × holding-period
grid — start date against horizon — not a channel-position instrument. It contributes
**nothing to the row set and nothing to the taxonomy question.** It stays in Related as a
cross-link, which is where the design doc already had it.

Worth recording: the slug is **`/heatmap`**, not `/the-bitcoin-heatmap`, even though
SITE_GUIDE §20 titles it "The Bitcoin Heatmap". Any route built from the title will 404.

---

## §12.2 · Zone taxonomy — the source check, and the answer

### The site's taxonomy exists, is canonical, and is shared

`shared/power-law-data.js` defines `positionLabel(pos)`, described in its own comment as
_"one graduated label for 'where in the channel', consumed everywhere a position is
described so the slider readout and the prose can never disagree."_ It is consumed by the
dashboard, the channel ribbon, WODN, How Much Cash and Your Deployment Plan.

`pos` is **normalized log-space channel position**: 0 = the floor (0.42× trend), 1 = the
upper band (3× trend). The bands, with the ×-trend ranges the module's own comment
verifies them against:

| `pos` range | Label | ×-trend |
|---|---|---|
| `pos < 0`, ratio < 0.30× | far below the floor | < 0.30× |
| `pos < 0`, ratio < 0.40× | below the floor | 0.30–0.40× |
| `pos < 0`, else | just below the floor | 0.40–0.42× |
| 0 – 0.18 | near the floor | 0.42–0.60× |
| 0.18 – 0.36 | below trend | 0.60–0.85× |
| 0.36 – 0.53 | at trend | 0.85–1.20× |
| 0.53 – 0.79 | above trend | 1.20–2.00× |
| 0.79 – 0.95 | high in the channel | 2.00–2.70× |
| ≥ 0.95 | near or above the upper band | ≥ 2.70× |

**Verdict against JM-5** ("existing site vocabulary wins if Phase 0 finds one"): a source
exists, so **the §4 five-band default is struck**. The Rundown adopts `positionLabel`.

**Tensions to report, as §4 requires:**

1. **Nine states, not five.** Six bands above the floor plus three sub-floor gradings. A
   decision map with a row set per zone has more zones to account for than the design
   assumed — and the sub-floor gradings are exactly where bitcoin sits today.
2. **The design doc's proposed edges do not line up with the canonical ones.** §4 proposed
   a break at 0.5× and another at 0.8×; the canonical breaks are at 0.60× and 0.85×. Had
   the default been adopted, every row's sample set would have differed from WODN's for
   the same position — the mirror-twin failure `channel-entries.js` was extracted to
   prevent.
3. **The names pass §4's own rule.** Every label is a descriptive position-state; not one
   is a verb or an action-state. The palette question (§4's "no green-below/red-above") is
   untested here and stays a Phase 4 luminance-gate item.
4. **Discount-or-Premium's three-state vocabulary is a genuine second taxonomy** (above).

### "Independent visit" — the site already defines it, and it is 100 days

§4 proposed "a visit ends when price closes outside the band for 30+ consecutive days" and
invited Phase 0 to propose better from the data. **Better already exists and is shipped.**
`discount-or-premium.js` builds episodes with this rule, in its own comment: _"Episodes: a
gap > ~100 days between qualifying samples starts a new one."_

**Recommendation: adopt the 100-day rule, not a new 30-day one.** Same reasoning as the
taxonomy — if the Rundown counts episodes differently from Discount-or-Premium, the two
pages publish different visit counts for the same history. A 30-day rule would also be
actively wrong against this data: `PL_DATA` is a **~12-day grid**, and the sample gaps
inside a single continuous episode already reach **96 days** (see §12.5). A 30-day rule
would shatter one visit into four.

**Consequence, and it is the report's most important number:** applying the 100-day rule to
the flagship row's own sample set turns n = 26 into **N = 2 independent visits**.

---

## §12.3 · Per-row engine feasibility — verdicts

The §5 rule: _"a row ships only if it computes from an existing engine and every number is
reproducible on the source page."_ Applied strictly.

| Row | Engine | From-position conditioning? | Verdict |
|---|---|---|---|
| **R1** Deploy now, or wait? | `channel-entries.js` `bandMetrics()` via WODN | **Yes — native.** The engine's whole purpose. | **SHIPS**, with the small-N and counter-case amendments below |
| **R2** Lump sum, or ladder? | Lump Sum or Ladder In / Your Deployment Plan | Partial — `posOf` present, but the pages are input-driven and today-anchored | **CUT as a row**; becomes a route inside R1 (§12.1) |
| **R3** How much cash? | How Much Cash — consumes `ChannelEntries` directly | **Yes — native.** The mirror twin of R1. | **SHIPS** |
| **R4** Rebalancing bands near triggering? | `disciplined-rebalancing.js` | **No — zero position-conditioning code.** Bands are *user-set* sell/rebuy thresholds. | **DOES NOT SHIP.** Would need both a new engine and user inputs — two v1 fences at once |
| **R5** Retirement from this zone? | Retirement flagship + Stress Test | **No — zero position-conditioning code.** | **DOES NOT SHIP** as specified. See note |
| **R6** Selling from this zone? | Discount or Premium + DR sell-band logic | **No — zero position-conditioning code** in either | **DOES NOT SHIP** as specified. See note |
| **R7** Drawdown record from this zone | Stress Test (spec'd) → **`bandMetrics` (actual)** | Stress Test: no. `bandMetrics`: **yes** | **SHIPS in reduced form** — see below |

**What R4 would need:** a position-conditioned reading of the *default* bands rather than
the reader's own. That is a new engine and it changes what the row asks. Reported, not
approximated.

**What R5 would need:** the retirement engine conditioned on entry position — i.e. running
the withdrawal loop from each historical entry in the position band. That is a genuinely
new computation over an existing engine, and it is the most valuable row on the page. It is
a strong v1.1 candidate; it is not a v1 row under §5's rule.

**What R6 would need:** the same conditioning on Discount-or-Premium's episode scan. Note
separately that R6 was already flagged in §5 as the sensitive row and the first to cut.
**It cuts itself on feasibility before the register question is even reached** — which is
the cleanest possible resolution of the JM-4 "in or out" question, and it means JM does not
have to make the hard call this build.

**R7's reduced form is feasible and already published.** `bandMetrics` returns `ddProb`
(share of entries that saw a ≥20% drawdown within two years), `ddDepth` (median depth), and
`neverFell` (share that never traded below the entry price) — all conditioned on position,
all **already rendered on WODN** (`wdDdProb` / `wdDdDepth`), so they are reproducible on a
source page today. What it cannot do is the spec's "depth *and duration* distributions" —
duration is not computed. **R7 ships as depth-and-frequency, not depth-and-duration.**

---

## §12.4 · Position-engine reuse path

**§3's requirement is already satisfied — there is nothing to extract.** The design doc
worried that the dashboard's position math might not be a shared module and set a
trivial-extraction-or-duplicate rule. It is a shared module: `positionLabel()` and the
`posOf` transform live in `shared/power-law-data.js`, and `ChannelEntries.posOf` /
`ratioOf` in `shared/channel-entries.js`. The dashboard, ribbon, WODN, HMC and YDP all read
them.

**Path: consume, do not extract, do not duplicate.** No `TECH_DEBT` consolidation entry is
needed, and §3's "do not let engine refactoring become this build" is satisfied by doing
nothing.

**Two mechanical details the build must honour, both easy to get wrong:**

1. **`matchPos()`.** WODN clamps sub-floor positions to zero *for entry matching* while
   leaving the *display* sub-floor: `function matchPos(p) { return Math.max(0, p); }`.
   Since bitcoin is sub-floor on today's live-trend reading (Finding 2), the Rundown must
   apply the identical clamp or its row numbers will diverge from WODN's on day one. This
   is the single highest-risk line in the whole reuse path.
2. **One call, two render targets.** §3 and §11 require the hero standfirst and the
   position strip to come from one computation. The live-price path makes this concrete:
   `fetchTodayPrice` resolves asynchronously and `livePos()` falls back to the stale sample
   until it does. Two independent calls would render two different multiples in the same
   viewport during that window.

---

## §12.5 · R1 zone-edge sensitivity — first pass, as proof of method

**Method.** §10's gate: recompute the headline with zone edges perturbed ±10%; if the
qualitative reading flips, the row does not ship. The engine's operative "edge" is
`bandMetrics`'s neighbourhood half-width (0.075 in `pos`, widening by 0.03 until n ≥ 8), so
±10% is 0.0675 / 0.0825. Position perturbations were run alongside, because Finding 2 makes
the position itself uncertain.

**Baseline** — P = `matchPos(livePos())` = 0, the value WODN itself would use:

| | n | waiting beat deploying | median coin ratio | ≥20% drawdown | median depth |
|---|---|---|---|---|---|
| **Baseline (half 0.075)** | 26 | **0 of 26 — 0.0%** | 0.058 | 0.0% | 0.0% |
| half −10% (0.0675) | 24 | **0 of 24 — 0.0%** | — | — | — |
| half +10% (0.0825) | 31 | **0 of 31 — 0.0%** | — | — | — |
| P at sample-day (0.0038) | 28 | **0 of 28 — 0.0%** | 0.062 | 0.0% | 0.0% |
| P sub-floor, unclamped (−0.009) | 22 | **0 of 22 — 0.0%** | 0.062 | 0.0% | 0.0% |
| P at near-floor upper edge (0.18) | 81 | 17 of 81 — 21.0% | 0.273 | 7.4% | −7.5% |
| P at the at-trend edge (0.36) | 42 | 16 of 42 — 38.1% | 0.858 | 26.2% | −10.5% |

**Verdict: R1 PASSES the sensitivity gate, decisively.** The qualitative reading — deploying
beat waiting — is not merely stable under ±10%, it is **unanimous across every perturbation
inside the zone**, and stays the majority reading all the way out to the at-trend boundary,
two zones away. No thin-margin note is warranted. This is the strongest possible result the
gate can return, and it is worth saying plainly that the gate did its job: it was run to
find a flip, and there is none.

**But the gate is not the row's problem, and the method's real yield is what follows.**

**(a) The headline is not what the copy pattern says it is.** `nArrived = 0` in every
in-zone run. The engine's "wait" branch never fired once: from a position this low, a
further 0.15 drop in channel position **never arrived within two years, in any case in the
record**. So the honest headline is not "deploying beat waiting" — it is "**the lower entry
the waiter was waiting for never came**". That is a stronger statement and a narrower one,
and it is the sentence the row should carry.

**(b) The spec's copy pattern does not match the engine.** §5 drafts R1 as _"deployed lump
sums beat waiting over the following 12 months … the spread ran from …% to …%"_. The engine
uses a **two-year** window (`WAIT_CAP`) and measures **coins acquired** (`ratio = p0 /
waitPrice`), not percentage return. The row must adopt the engine's actual question and
window or its numbers will not reproduce on WODN. Median ratio 0.058 means waiting bought
**about 6% as many coins** — the spread ran 0.036 to 0.185.

**(c) N = 2, and §9 fires.** The 26 samples resolve, under the site's own 100-day episode
rule, into two visits:

| Episode | Span | Samples |
|---|---|---|
| 1 | Aug 2015 – Oct 2016 | 21 of 26 |
| 2 | Nov 2022 – Jan 2023 | 5 of 26 |

Within episode 1 the largest internal gap is **96 days** — under the 100-day threshold, so
it is correctly one visit and would have been wrongly split into four by §4's proposed
30-day rule. §9 requires that zones with N < 3 show the visits individually and carry no
distribution statistics. **At today's position, R1 must show two visits, not a
distribution.** Both the median ratio and the "0 of 26" framing are distribution statistics
on two data points and cannot be published as spec'd.

**(d) There is no counter-case.** §5 anatomy part 3 makes it mandatory "no exceptions". The
record contains none at this position. Proposal for JM: amend the anatomy so that a row
with a one-sided record **says so explicitly and names why it is thin** — "in both prior
visits it went the same way; two visits is not a base rate" — rather than either
suppressing the row or manufacturing a counter-case from a neighbouring zone. That is the
honest form of the same discipline, and it is arguably a better read than a counter-case
would have been.

**(e) The sample is post-2014.** `TABLE_CUT = 2014-01-01`, described in the engine as the
"pre-$15 curiosity era excluded". §1 and §10 fence v1 to the full record; the engine
contradicts that fence. The exclusion is defensible — and note it is *why* episode 1 starts
in 2015 rather than at the 2010 sub-floor low — but the page cannot claim full-record
honesty while publishing a post-2014 number. **Either the fence is amended to "the source
engine's record, disclosed", or the rows are wrong about their own provenance.**

---

## §12.6 · Slug verification — every route target

Verified against `src/*.njk` and the `permalink:` front matter.

| Target | Slug | Status |
|---|---|---|
| Wait, or Deploy Now? | `/wait-or-deploy-now` | OK |
| Lump Sum or Ladder In | `/lump-sum-or-ladder-in` | OK |
| How Much Cash | `/how-much-cash` | OK |
| Disciplined Rebalancing | `/disciplined-rebalancing` | OK |
| Discount, or Premium? | `/discount-or-premium` | OK |
| The Power Law | `/the-power-law` | OK |
| The Bitcoin Retirement | `/the-bitcoin-retirement` | OK |
| Retirement Stress Test | `/the-bitcoin-retirement-stress-test` | OK |
| Your Bitcoin Deployment Plan | `/your-deployment-plan` | OK — §5's "slug unverified" is discharged |
| Bitcoin as Collateral | `/bitcoin-as-collateral` | OK |
| The Bitcoin Dashboard | `/dashboard` | OK |
| The Bitcoin Heatmap | **`/heatmap`** | **Deviation** — the title is "The Bitcoin Heatmap"; the slug is not |
| The Bitcoin Floor | `/the-bitcoin-floor` | OK — a strong Related candidate, see below |
| The Rundown (proposed) | `/the-rundown` | Free — no collision |

---

## Proposed final row set

Reduced from seven to four. Every row below computes from a shipped engine and every number
is reproducible on a live page.

| Row | Question | Engine | Route |
|---|---|---|---|
| **R1** | Deploy new capital now, or wait for a lower entry? | `bandMetrics().paid` / `ratio` | Wait, or Deploy Now? → then Your Deployment Plan for *how* |
| **R3** | How much cash to hold against the position? | How Much Cash via `ChannelEntries` | How Much Cash |
| **R7** | What has followed entries at this position — how often, how deep? | `bandMetrics().ddProb` / `ddDepth` / `neverFell` | Stress Test (as scenario tool, not as the source of the figures) |
| **R0** | *(new, proposed)* What this position is, and how thin the record for it is | `positionLabel` + the 100-day episode count | The Power Law / The Bitcoin Floor |

**Cut:** R2 (owned by Your Deployment Plan), R4, R5, R6 (no position-conditioned engine).

**R0 is a proposal, not a spec item.** With N = 2 at today's position, the honest page leads
with the thinness rather than burying it in each row's caveat. It also gives the sub-floor
knife-edge (Finding 2) a place to live, and it gives **The Bitcoin Floor** — shipped
2026-08-22, and the site's own examination of exactly where price is standing right now — a
route it otherwise would not get. JM's call.

**A consequence worth stating plainly.** Four rows is not the flagship the design doc
describes, and three of the four are variations on one engine's output. It is worth JM
deciding whether the Rundown at this scope is still the right page, or whether the honest
v1 is smaller and differently framed — a *position read* with two decisions attached rather
than a decision *map*. That is a scope question, and it is above the build's pay grade.

---

## Deviations from spec — the full list for ratification

1. **§4's five-band default is struck** — the site's `positionLabel` taxonomy wins (JM-5).
2. **The independent-visit rule is 100 days, not 30** — adopted from Discount-or-Premium.
3. **R2, R4, R5, R6 do not ship** — one on overlap, three on engine feasibility.
4. **R7 ships as depth-and-frequency, not depth-and-duration** — duration is not computed.
5. **R1's window is two years and its unit is coins**, not "12 months" and percent.
6. **§5's mandatory counter-case cannot be met at today's position** — amendment proposed.
7. **§1/§10's "full record only" fence is contradicted by the source engine's 2014 cut** —
   needs amending or disclosing.
8. **A new row R0 is proposed**, which the spec does not contain.
9. **The Heatmap's slug is `/heatmap`**, not what its title implies.
10. **A second position vocabulary exists** (Discount-or-Premium's discount/at-trend/premium
    with a 0.95–1.05× dead band) that disagrees with `positionLabel`'s at-trend band of
    0.85–1.20×. Site-wide question; JM's.

---

# §B · Exhibits scoping (backlog Entries 3–4)

Commissioned as parallel lanes. Scoping only — no exhibit is built until ratified.

## Entry 4's data note — RESOLVED, and the reconciliation is not the one the entry expected

**The question.** Reconcile JM's cited ~5× early spikes against the channel's stated 3×
upper band, "likely a definition-window question (which era the band edges were measured
over)".

**The answer: it is not a definition-window question at all.** Computed across all 481
`PL_DATA` samples against the canonical trend:

| | Value | When |
|---|---|---|
| Maximum trend multiple in the record | **14.01×** | June 2011 |
| Minimum trend multiple in the record | **0.241×** | October 2010 |
| Samples at or above the 3× upper band | **39 of 481 (8.1%)** | — |

**`PL_CEIL = 3.0` is a stipulated constant, not a fitted envelope** — exactly as
`PL_FLOOR = 0.42` is. Price has exceeded it in 8.1% of the record. So there is no conflict
to reconcile: 3× is a *band definition*, and 5× and 14× are *observed excursions above it*.
Stating it as "the channel's upper band" and stating it as "the maximum" are two different
claims, and only the first is true.

**JM's ~5× is right about the modern era and low for the early one.** Per-year maxima:

| Year | Max ×trend | | Year | Max ×trend |
|---|---|---|---|---|
| 2011 | **14.01×** | | 2018 | 5.12× |
| 2013 | 11.99× | | 2021 | **3.19×** |
| 2014 | 7.81× | | 2024 | 1.19× |
| 2017 | 5.41× | | 2025 | 1.19× |

~5× is the **2017–2018** peak, not an early spike. The genuinely early spikes are 2–3×
larger again. **This strengthens the exhibit's thesis rather than complicating it.**

**Recommended DATA_AUDIT treatment.** One row recording that `PL_CEIL = 3.0` is a stipulated
band and **not** an empirical maximum, with the 14.01× record maximum and the 8.1%
above-band share as the supporting figures. This matters beyond the exhibit: any page that
describes 3× as a ceiling is making a claim the data does not support, and the dashboard
tiles and the exhibit need to agree before either is published. This row should land
**before** the exhibit ships, per the entry's own blocking note.

## Entry 4 — The Narrowing Channel: the finding, quantified

**The asymmetry is real, and it is larger than the entry claims.** Per-year extremes:

- **Top edge, collapsing:** 14.01× (2011) → 11.99× (2013) → 7.81× (2014) → 5.41× (2017) →
  5.12× (2018) → **3.19× (2021)** → 1.19× (2024) → 1.19× (2025) → 0.77× (2026 to date).
  Monotonic across cycles. 2021 is the last year that touched the upper band at all.
- **Bottom edge, unmoved:** the sub-floor years are **2010 (0.241×), 2015 (0.398×), 2023
  (0.418×)** — and 2026 currently sits at **0.423×**. The lows are landing in the same
  place they always have.

**That is the exhibit, and it needs almost no construction** — it is one chart of
residual-spread-over-time, or even the two per-year extreme series overlaid. The finding
survives the counterpoints the entry requires be carried at equal weight: small N of cycles,
the October 2025 leverage cascade, and the standing rebuttal that the floor edge has not
lifted — which the numbers above now *demonstrate* rather than assert.

**Placement recommendation: a section on the Power Law page, not a standalone.** Same
reasoning the entry gives for Entry 3, and stronger here: the finding is a property *of the
channel*, and the channel's canonical home is `/the-power-law`. A standalone would need its
own premise gate for a claim the Power Law page already establishes. It cross-links Bull &
Bear Cycles and the Heatmap from there.

**Data and implementation:** zero new data. `PL_DATA` + `plPrice` + `PL_FLOOR` / `PL_CEIL`,
all shared. No monthly-refresh surface. This is the cheapest exhibit on the backlog.

## Entry 3 — Rolling out-of-sample fits: scoping

**Most of the machinery is already shipped.** Power Law v2 (`d492650`) built a draggable
training-cutoff OOS chart with presets (end-2014 / 2016 / 2017 / 2020 / 2023), an
**in-browser refit**, and `?fit=YYYY-MM` deep-linking. It is the site's only self-fitting
chart. The end-2014 preset already reproduces the documented bad fit (b = 6.787).

**So Entry 3 is not a new build — it is a sweep over an existing one.** The exhibit runs the
existing refit across *every* cutoff rather than five presets, and plots **the miss** —
projected vs. realized at a fixed horizon — as a function of cutoff year. That single curve
is the whole exhibit: high and erratic early, falling and flattening from about 2017.

**Implementation approach:** reuse the v2 refit function; sweep the cutoff; plot miss vs.
cutoff. Precompute at build time or compute in-browser — the v2 chart already refits live,
so in-browser is proven feasible and keeps the monthly-refresh tail at zero.

**Register requirement from the entry, and it is the important one:** name what would count
as the fit degrading *again* — falsifiability forward, not just backward — and state the
small number of independent eras plainly. Note this exhibit is in the awkward position of
being **partly in-sample by construction**: the coefficients it validates were fitted on
this history. The entry should carry that the way the Floor analysis carries it.

**Placement: a section on the Power Law page**, per the entry's own lean. It strengthens the
page the Rundown depends on, and it sits directly beside the v2 chart it generalizes.

## Sequencing note for both

Both exhibits gate the Rundown's **v1.1 era-filter toggles**, not v1 (JM-8). Nothing in this
report changes that. But Finding 5 is worth carrying into the exhibit work: the site's
position engine **already** applies a 2014 era cut, silently. The toggles will be presenting
era-filtering as a new, disclosed choice on a page whose underlying engine has been making
an undisclosed one since it was written. Whichever exhibit lands first should probably say
so.

---

## Open questions for JM — the ratification list

1. **Is a four-row Rundown still the page you want** (and is R0 in)? — the scope question.
2. **The counter-case amendment** — may a one-sided row say so, rather than being cut?
3. **The full-record fence** — amend to "the source engine's record, disclosed", or hold the
   fence and lose the rows?
4. **The sub-floor knife edge** — what does the page say on a day when the label flips?
5. **The two vocabularies** — does `positionLabel` or Discount-or-Premium's dead band govern
   the word "at trend", site-wide?
6. **R6** — cut on feasibility, so the register call is not needed this build. Confirm you
   are content to leave it there rather than commissioning the engine.

Nothing proceeds past this report until it is ratified.
