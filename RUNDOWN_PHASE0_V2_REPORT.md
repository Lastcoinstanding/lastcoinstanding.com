# THE RUNDOWN — PHASE 0 v2 REPORT

_2026-09-01. Filed against `RUNDOWN_DESIGN.md` Part I (DESIGN v2, "The Briefing"),
landed this session from the drafting chat's `RUNDOWN_DESIGN_v2.md`, SHA-1
`253494152d98d337d310cdb31fa60867e5d02b87`, verified before ingest. This report
executes v2 §10 Phase 0 in full._

_**Findings, not fixes.** No page code was written this session, and none should be
until JM ratifies. Every claim below was read out of the working tree on
`docs-rundown-v2-phase0`; nothing was inferred from the design docs. Code is cited
by **function name and file**, per the house rule that line numbers drift — line
numbers appear only where a duplicate name makes them necessary._

_Green assertions prove only what they cover: this is a **static read** of the
sources. Nothing here was executed in a browser. Where a finding would change a
displayed number, it is marked as needing a runtime check in Phase 2, not as
verified._

---

## 0 · The headline — composition or extraction?

**v2 is composition work, with three small extractions. It is not an extraction
project.** Of thirteen mapped snacks:

| Cost class | Count | Snacks |
|---|---|---|
| `reuse` — import the shared module as-is | **6** | A1, A2, D1, R1, P1 (engine), P2 |
| `rebuild-compact` — small echo against the same engine | **4** | A3, A4, D3, B1 |
| `extract` — lift to `shared/`, source page adopts it back | **3** | D2 (+C1), R2, and one optional parameter on `RetirementEngine` |

**Zero snacks require forking an engine. Zero require new modeling. Zero need a new
data source.** The total extraction budget is roughly **130 lines of pure,
DOM-free arithmetic** across three lifts.

The reason is worth stating precisely, because it is not luck. The two heavy
engines the map leans on — `shared/channel-entries.js` and
`shared/retirement-engine.js` — **are already shared**, and were already shared
before v2 was drafted. The remaining engines are page-baked in their *rendering*,
not in their *arithmetic*: every computation the map needs from a page-baked file
is a pure function of `PL_DATA` and `plPrice`, with no DOM read and no page state.
That is what makes the compact echoes cheap.

**So the cost of v2 does not sit in the engines. It sits in three other places,
and Phase 0's real finding is that these are the schedule risk:**

1. **Three canonical homes in the §6 map are wrong or under-defined** (A3, P1, P2).
   Each one is a §11.4 reproducibility failure as currently specified — a snack
   routing to a page that does not publish, and in one case cannot publish, the
   figure the snack shows. §3.5 and §4 below.
2. **The inputs contract is short by one field, and the persistence design collides
   with a shipped site-wide convention.** §3.2 and §3.4.
3. **Two mapped snacks compute the same number under different names** — proved
   algebraically in §4.1, not asserted. Under the one-canonical-home rule this is
   the sharpest overlap in the map and it needs a ruling, not a build decision.

---

## 1 · The mechanism finding — what "reuse" can and cannot mean here

This governs every row of the audit, so it comes first.

**Pages do not import modules. `page_scripts` inlines whole files into the page.**
Every page declares its JS in `eleventyComputed.page_scripts` as a list of
nunjucks `include`s, and the build inlines each file's full text into the rendered
page. The Rundown's v1 build already does this:

```
page_scripts: "{% include '_pageassets/shared/power-law-data.js' %}\n
               {% include '_pageassets/shared/channel-entries.js' %}\n
               {% include '_pageassets/the-rundown.js' %}"
```

Two consequences bind Phase 1 and Phase 2:

- **A page's own JS file can never be "reused."** Every page asset is an IIFE that
  self-initialises on `DOMContentLoaded` against that page's element ids —
  verified on all nine mapped source pages (`discount-or-premium`,
  `lump-sum-or-ladder-in`, `disciplined-rebalancing`, `the-bitcoin-hurdle-rate`,
  `the-bitcoin-floor`, `the-bitcoin-retirement-stress-test`,
  `wait-or-deploy-now`, `how-much-cash`, `the-bitcoin-retirement`). Including
  `discount-or-premium.js` on the Rundown would inline 1,137 lines that then hunt
  for `dpRevNum`, `dpHorizonReadout` and thirty more absent ids. The files are
  null-guarded enough not to throw, which is worse, not better: it would ship a
  kilobyte-heavy silent no-op.
- **Therefore `reuse` in this report means exactly one thing: reuse of a
  `shared/` module.** For page-baked logic there are only two honest options —
  `extract` it to `shared/` (and have the source page adopt it back, so the two
  cannot drift), or `rebuild-compact` it against the same inputs. The audit below
  uses the words in that strict sense.

**Page-weight note for Phase 4.** The Rundown will carry `power-law-data.js`
(which includes the full `PL_DATA` blob, ~500 samples inline),
`channel-entries.js`, and — once P1 lands — `modeling-assumptions.js` and
`retirement-engine.js`, plus the new shared extracts. v1 already carries the first
two. This is a CLS and payload item for the Phase 4 pass, not a blocker, but it
should be measured rather than assumed, because v2 §2.1 keeps v1's CLS gate on the
live standfirst.

---

## 2 · The embeddability audit, per snack

Cost class per v2 §10.1. "Engine home" is where the arithmetic actually lives
today, which is not always where the §6 map says the snack routes.

| Id | Engine home today | Componentized? | Cost | Note |
|---|---|---|---|---|
| **A1** | `the-rundown.js` `renderHero`, on `power-law-data` | n/a — already built | `reuse` | Ships in the v1 branch. Carries per v2 §9. |
| **A2** | `the-rundown.js` `renderStrip`, on `positionLabel` | n/a — already built | `reuse` | Recast as a labelled Dashboard echo. **See §4.2 — it collides with the site-wide ribbon.** |
| **A3** | **two implementations disagree** | no | `rebuild-compact` + **ruling** | **Blocker. See §4.3.** |
| **A4** | `the-bitcoin-hurdle-rate.js` — `chanK`, `posCAGR`, `trendCAGR`, `spotToFloorCAGR`, `trendMultiple` | page-baked, but pure one-liners | `rebuild-compact` | Each is a single expression on `plPrice`/`TODAY_DAYS`/live spot. Exact reproduction is trivial. **But see §4.1.** |
| **D1** | `shared/channel-entries.js` — `bandMetrics`, `entryMetrics` | **yes, shared** | **`reuse`** | Already imported and already rendering in v1 (`renderRows`, `rdR1*`). The model snack is the cheapest snack on the map. |
| **D2** | `lump-sum-or-ladder-in.js` — `ladderAdvantage`, `bucketAt`, `advantageCurve`, `eraStartDay` | page-baked, pure, DOM-free | **`extract`** | ~40 lines. Runs unmodified on `ChannelEntries.S` — see §2.1. |
| **D3** | `discount-or-premium.js` — `multiple`, `revCAGR`, `trendCAGR` | page-baked, three one-line functions | `rebuild-compact` | **Answers v2 §10.3: yes, compact, no engine fork.** §3.3. |
| **C1** | **nothing** | — | **cut or fold into D2** | No position-conditioned DCA engine exists anywhere on the site. §3.5.2. |
| **R1** | `shared/channel-entries.js` (sell side, via `how-much-cash.js`) | **yes, shared** | **`reuse`** | The HMC/WODN mirror twin. v1 already renders it as R3. |
| **R2** | `discount-or-premium.js` — `scanDurations` | page-baked, pure, DOM-free, returns a plain object | **`extract`** | ~50 lines. Position-conditioned, two-sided, auto-widening. **Caveat: hides itself in the dead band** — §2.2. |
| **B1** | `disciplined-rebalancing.js` — `thresholdData`, `percentileToRatio` | page-baked; the *now-read* is arithmetic | `rebuild-compact` + **ruling** | Cheap as v2 §10.2 guessed, but needs threshold inputs the v2 set does not have. §3.1. |
| **P1** | `shared/retirement-engine.js` — `lineFor`, `computeVerdict`, `projectForBasis` | **yes, shared** | **`reuse`** + tiny `extract` | Engine does exactly this. Three findings, one a blocker. §3.2. |
| **P2** | `shared/channel-entries.js` — `bandMetrics().ddProb`/`ddDepth`/`neverFell` | **yes, shared** | **`reuse`** | **The Stress Test does not compute this** — §4.4. |

### 2.1 · Why D2's extract is clean

`lump-sum-or-ladder-in.js` builds its own sample array `S` as
`{d, p, pos: posOf(p, d), yr}`. `shared/channel-entries.js` builds `S` as
`{d, p, pos: posOf(p, d)}`, from the same `PL_DATA`, with the identical `posOf`
definition (`(log(price/plPrice(days)) − log(PL_FLOOR)) / (log(PL_CEIL) −
log(PL_FLOOR))`). `ladderAdvantage`, `bucketAt` and `advantageCurve` read only
`.d`, `.p` and `.pos`. **They run on `ChannelEntries.S` unmodified.** The `yr`
field is used only by LSLI's own chart labelling, not by the advantage math.

Two differences to disclose on the snack rather than silently absorb:

- **Era.** LSLI's default era is `full` (`MIN_D − 1`, i.e. the whole record
  including the pre-exchange era). `ChannelEntries.elig` excludes everything
  before 2014 via `TABLE_CUT`. `bucketAt` takes the era as a parameter, so the
  Rundown must **choose and state** which — and the choice should match whatever
  LSLI's snack routes into, or the snack will not reproduce.
- **Thin-band behaviour.** `bucketAt` uses a fixed window `WIN = 0.075` and
  returns `{n: 0}` when the band is thin. `bandMetrics` starts at the same
  `half = 0.075` but **widens in 0.03 steps until n ≥ 8**. Two snacks reading
  "the same neighbourhood" would therefore describe different sample sets at a
  sparse position. Not a defect in either page; a disclosure requirement for a
  page that renders both, which the Rundown does (D1 and D2 in the same cluster).

### 2.2 · R2's self-hiding behaviour

`scanDurations()` returns `{state: 'hidden'}` whenever today's multiple sits in
D-or-P's near-trend dead band (`0.95 ≤ m ≤ 1.05`), and the page hides the whole
duration module. A Rundown snack built on it inherits that: **on a day when price
is near trend, R2 renders nothing.** v2 §4 anatomy has no empty state, and §11.3
assumes every non-always-on snack renders. Phase 1 needs either an explicit empty
state for R2 or a rule that a snack may withhold itself — a design question, not a
feasibility one, but it must be answered before R2 is built.

---

## 3 · The named feasibility checks (v2 §10.2–§10.5)

### 3.1 · B1 — DR band-distance from current state

**Feasible and cheap, as v2 §10.2 suspected — but it is blocked on an input
question, not an engine question.**

The now-read is pure arithmetic. DR's threshold lines are `plPrice(d) × ratio`
(`thresholdData`), so "how far is the band from triggering" at today's position is
`todayRatio` vs `sellRatio` / `rebuyRatio`, where `todayRatio = spot / plPrice(today)`
— a figure the Rundown's context header already computes. No backtest, no
historical conditioning, no new engine. **~20 lines.** v1's finding that no
position-conditioned *history* exists for rebalancing stands and is not
contradicted: this is a now-read, and v2 §10.2 was right to separate them.

**The blocker: whose thresholds?** DR's sell and rebuy ratios are not constants.
They are derived from two percentile sliders (`drSellPct`, `drRebuyPct`) through
`percentileToRatio`, with presets. The v2 §3 input set has no allocation or
threshold field, so B1 as mapped has nothing to read. Three options, all needing a
ruling:

1. **Render against DR's shipped default preset**, name the preset on the snack,
   and route. Cheapest; keeps the input set at three; the snack says "at the
   standard thresholds" and is honest about it.
2. **Add threshold inputs** — pushes the briefing setup from three fields to five
   and gives the Rebalance intent inputs no other intent uses.
3. **Cut B1.** The Rebalance intent then has no snack, which §2.6's "what is not
   here yet" coda already has a shape for.

**Recommendation: option 1.** It is the only one that keeps the §3 input set as
ruled while still answering the reader's question, and the preset is a shipped,
nameable, reproducible thing.

**One hazard for whoever builds it.** `disciplined-rebalancing.js` defines
`percentileToRatio` **twice** — at line 647 and again at line 1751, in two
different IIFEs. They are not obviously identical in the `ratios` array they close
over. Anyone extracting or reproducing this must establish which one is
authoritative before copying either. Flagged, not resolved: resolving it is DR's
business, not the Rundown's, and it is a `TECH_DEBT` candidate.

### 3.2 · P1 — retirement-engine wiring, and the floor-case read

**The engine does exactly what P1 asks, and it is already shared.**
`RetirementEngine.lineFor('stack', scenario, basis)` bisects to the minimum
`btcStack` whose `computeVerdict` returns `escape`, rounding **up** so the stated
value still escapes. That *is* "what stack does my target need, read from here."
`basis: 'current'` scales the trend path by `currentRatio()` — today's live price
over today's trend price — which is precisely the position-conditioning v2 wants,
and it re-reads the live global on every call, so a snack that renders before and
after the price fetch gets the right answer both times.

`LIMITS` maps onto the v2 §3 input set almost exactly:

| `RetirementEngine.LIMITS` | v2 §3 input | Range |
|---|---|---|
| `retirementYear` | Retirement year | 2026–2055 |
| `targetIncomeUSD` | Target retirement income | $20,000–$500,000 |
| `btcStack` | Stack (optional) | 0.01–100 BTC |

**Three findings.**

**(a) The input set is short by one field — this answers v2 §3's open question.**
Every `scenario` the engine takes carries a fourth required field,
`yearsInRetirement`, used by `computeVerdict` to set the horizon
(`retirementYear + yearsInRetirement`) and by `projectCore` to set `endYear`. It
is not optional and has no engine default; the flagship's own scenario seeds it at
`30`. So v2 §3's "Phase 0 may propose horizon as a fourth if any ratified snack
needs it" resolves as: **yes, if P1 ships.** Either add it as the fourth input, or
fix it at 30 and state the constant on the snack. **Recommendation: fix at 30 and
state it.** A fourth field costs the briefing setup more than the reader gains,
30 is the flagship's own default so the figure reproduces there without the reader
changing anything, and the snack's route carries the reader to the page where the
horizon is adjustable.

**(b) The canonical home in the §6 map is wrong — this is a §11.4 blocker.**
`lineFor` is **not called anywhere in `the-bitcoin-retirement.js`.** The flagship
does not publish a stack requirement. The threshold read ships on **Bitcoin
Escape Velocity** (`bitcoin-escape-velocity.js`, which caches
`lineFor('stack'|'income'|'retire', SCENARIO, PRICE_BASIS)`) and on
**Compare Retirement Plans** (`compare-retirement-plans.js`, via `E.lineFor`). As
mapped, P1's figure would route to a page that cannot reproduce it. **P1's
canonical home is `/bitcoin-escape-velocity`, not the flagship** — which is also
consistent with EV's own load-bearing design fact that the *threshold*, not the
year, is what that page owns. Needs JM's ruling to change the map.

**(c) The floor-case read needs one small parameter, or a ten-line local solver.**
There is no `basis: 'floor'`. `projectForBasis` branches only on `'current'` vs
everything else, and takes its growth model from the **site-wide**
`ModelingAssumptions` store (`lcs.btcGrowthModel.preset`, whose values are
`powerlaw-floor | powerlaw-trend | linear-cagr-decay`). So the floor case is
reachable — but only by mutating a setting that affects every retirement page on
the site, which the Rundown must not do to render one snack. Two honest routes:

- **`extract` (recommended):** add an optional `growthKey` override to
  `projectForBasis` and `lineFor`, defaulting to the current MA read so every
  existing caller is unchanged. EV and Compare adopt it back. Maybe fifteen lines,
  and it makes the floor case reachable for every future consumer.
- **`reuse` + local solver:** the Rundown runs its own bisection over
  `projectCore(scenario, 'powerlaw-floor', infl)` → `computeVerdict`, both already
  exported. Also ~fifteen lines, but it duplicates `lineFor`'s bisection, and a
  duplicated solver is exactly the kind of drift the shared engine exists to
  prevent.

**Reproducibility caveat either way:** a floor-case figure on the Rundown
reproduces on EV **only if the reader's site-wide growth model is set to
`powerlaw-floor`**. That is a shipped, reader-facing control, so the figure is
reproducible — but the snack's sources line must say *how*, or §11.4 is not
satisfied in practice. This is a copy requirement, and it should be written at
build time, not discovered at the register pass.

**(d) New dependencies.** P1 adds `shared/modeling-assumptions.js` and
`shared/retirement-engine.js` to the Rundown's `page_scripts`. Both are shared and
both are pure; the note is for the payload budget in §1, not a feasibility
concern.

### 3.3 · D3 — can "Your window" render compact without forking the engine?

**Yes. This is the cleanest snack on the map after D1.**

The entire arithmetic is three one-line functions on `plPrice` and the live price:

- `multiple()` — `price() / plPrice(TODAY_DAYS)`
- `revCAGR(y)` — `(plPrice(TODAY_DAYS + 365.25y) / price())^(1/y) − 1`
- `trendCAGR(y)` — the same shape with today's **trend** as the denominator

and the uplift line is their subtraction. There is no state to fork, no fitted
parameter, no cached series. A compact render — two stat cards (reversion CAGR,
at-trend baseline), the uplift/drag line, and one chart — reproduces to displayed
precision by construction, because the source page's own numbers come from these
same three expressions.

**The §5 pattern is fully shipped on D-or-P, and Phase 0 confirms all five
elements exist**, which is what makes it usable as precedent rather than as an
aspiration:

1. **Condition in the title** — the "Your window" view; `glideLabel()` renders
   *"If it reverts by &lt;month year&gt;"*, recomputed from the slider.
2. **`illustrative` on the chart itself** — drawn on-canvas along the reversion
   path at ~78% of its length (`drawIllustrativeAlong`), on all three chart views.
3. **Baseline or alternative alongside** — both. The at-trend baseline is a
   permanent stat card, and the never-reverts path renders as a second, fainter
   line (`neverAt`, and the `dpNever` copy block).
4. **The arithmetic line** — shipped verbatim on the page: *"That is just
   arithmetic, not a forecast."*
5. **Caveat inheritance** — the `dpNever` block names the 0.42× floor as
   *"evidence, not a guarantee"* and the page carries the Power Law route.

The snack should **quote element 4 verbatim** rather than paraphrase it, per §4's
rule that the Rundown never softens or strengthens a source tool's language.

**One scope note.** D-or-P's *duration* module (`scanDurations`, the R2 engine) is
a different module from the "Your window" view. D3 and R2 route to the same page
but read different engines; they are not one snack split in two, and building
either does not give you the other.

### 3.4 · Inputs persistence — the §6.37 pattern, and a convention collision

**Three persistence patterns are shipped, not one.** Phase 0 enumerated every
`localStorage` key in `_pageassets`:

| Pattern | Shape | Shipped on |
|---|---|---|
| **§6.37 canonical** | one key `lcs.<slug>.state`, single JSON blob; URL > store > defaults; store only non-default; Reset removes the key; silent degrade | How Much Cash (`lcs.how-much-cash.state`) |
| **§6.37 + version suffix** | same shape, versioned key | Hurdle Rate (`lcs.bhr.calc.v1`), Escape Velocity (`lcs.ev.plan`), BvRE (`lcs.bvre.calc.v1`) |
| **Pre-§6.37 per-field** | prefix `dr:` with one key per field; restore dispatches synthetic `input` events | Disciplined Rebalancing |

Plus two things that are **not** page state and must not be confused with it: the
site-wide baseline-assumption store (`lcs.inflation.*`, `lcs.btcGrowthModel.preset`)
via `shared/modeling-assumptions.js` under STYLE_GUIDE §3.5, and `lcs.todayPrice`,
the ten-minute live-price cache in `shared/power-law-data.js`.

**Do §6.37 and D-or-P's non-persistent field compose into v2 §3's per-field-toggle
design? Yes — with one shape change, and one conflict.**

The shape change: §6.37 mandates **one key per page**, which is what gives
cross-page isolation for free. v2 §3 asks for **per-field toggles**, which reads
like per-field keys. These reconcile cleanly if the per-field decision is
expressed *inside* the single blob rather than as separate keys: a field whose
toggle is off is simply **absent from the blob**. That preserves every §6.37
property — one key, cross-page isolation, "store only a non-default state",
"Reset removes the key, verify it is gone" — while delivering exactly the reader
behaviour v2 describes.

**Proposed storage design, for ratification:**

- **One key: `lcs.the-rundown.state.v1`.** Versioned, per the three-page
  precedent above, because the input set is likely to grow as snacks accrete.
- **Blob shape:**
  `{ v: 1, remember: {retirementYear: bool, targetIncomeUSD: bool, intent: bool},
  retirementYear?, targetIncomeUSD?, intent? }` — each value present **only**
  when its own remember flag is true.
- **Precedence: URL params (any present) > stored state > defaults**, strictly, per
  §6.37. The Rundown has no URL params today; the rule should be written into the
  code anyway, because the first shared link will otherwise be a defect.
- **Clear-all** calls `clearStore()` (removing the key entirely, not writing an
  empty blob) and resets the fields and toggles to defaults. The Phase 4 privacy
  test asserts **the key is gone**, not that it is empty — §6.37 is explicit that
  a leftover defaults blob is the failure mode.
- **Every read and write in try/catch, no-op on failure, zero console errors** in
  private browsing. §6.37, verbatim.

**The conflict, and it needs JM, not Phase 0: stack persistence.**

v2 §3 rules stack persistable behind an opt-in toggle defaulting to OFF. Phase 0
finds that this crosses a convention the codebase currently holds without
exception:

- **Every shipped page that takes a stack keeps it non-persistent.** D-or-P holds
  `holdings` in a closure variable with an explicit comment that it *"lives HERE
  and nowhere else — never written to the URL, sessionStorage, localStorage, or
  any network request."*
- **Disciplined Rebalancing's sticky map carries the rule in code**, as a comment
  on the `STICKY` object: *"Stack is intentionally NOT in this list — sitewide
  convention."*
- **D-or-P ships the promise in reader-facing copy**: *"Stays on this page — never
  stored or sent."*

The v2 §3 verbatim-class line — *"Everything you enter stays in your browser —
never stored on a server, never sent"* — remains **true** under `localStorage`,
which is why this is a convention conflict and not an honesty defect. But the
Rundown is specifically the page that renders a **compact echo of D-or-P** (D3).
Shipping a persisted stack one scroll away from an echo of the module that
promises *"never stored"* puts two contradictory-sounding promises on the same
page, and the reader has no way to know that "stored" means two different things
in the two places.

**Recommendation: do not persist the stack.** The reader benefit is one number
re-entered in a few seconds; the cost is a durable on-device artifact and a
site-wide convention broken on its first page. **If JM overrules** — which is JM's
call and the v2 ruling already leans that way — the minimum fences are: toggle off
by default; the label says *"remember on this device"* so "where" is explicit; and
D3's echo carries D-or-P's own non-persistence line **unchanged**, so the stronger
promise is not silently weakened by proximity.

**One further judgment call for JM.** §6.37 opens with *"Do NOT apply by default —
a page that is purely exploratory should start fresh every visit; persistence is a
deliberate per-page decision,"* and gates the pattern on a **tracking or managing**
use-case. The briefing framing plausibly qualifies — a reader returning to re-read
their own position is the tracking case. But it is a judgment call against an
explicit "do not apply by default," so it should be ruled, not assumed.

### 3.5 · Overlap re-check under echo semantics

#### 3.5.1 · D2 — the v1 cut is reversed

v1's Phase 0 cut the lump-vs-ladder row because Your Deployment Plan *"owns that
ground and is today-anchored by design."* Under v2's echo semantics that reasoning
no longer reaches the snack, and Phase 0 recommends **reinstating D2**.

The two pages have distinct, self-documented roles, in their own `related:` copy:

- **Lump Sum or Ladder In** is *"the teaching demonstration… the general lesson on
  how channel position shifts the lump-vs-ladder choice."* Its engine
  (`bucketAt`, `advantageCurve`) is **explicitly position-conditioned** — the
  advantage curve is a function of channel position.
- **Your Deployment Plan** is *"the personal companion… your sum, your cadence,
  your time horizon,"* built on `shared/deployment-projection.js`, forward-looking
  and today-anchored.

v1 cut on the *plan mechanics*, which YDP does own. **The snack does not carry plan
mechanics.** It carries one position-conditioned historical verdict — at a position
like today's, did laddering get more coins than a lump sum — which is LSLI's
subject and only LSLI's.

**Canonical home: Lump Sum or Ladder In.** The route reads *"The full instrument
→"* to LSLI; LSLI's own related strip already carries the reader onward to YDP for
*how*, so §4's one-route anatomy is not strained. Nothing is duplicated: the echo
carries a verdict and a curve, and the canonical page carries the era controls, the
ladder-length control, the commitment backstop and the sources.

#### 3.5.2 · C1 — no engine exists; fold it into D2 or cut it

v2 §6 asks Phase 0 to propose the honest read for *"Start now, or wait to start?"*
Phase 0's finding is that **no position-conditioned DCA engine exists on the
site.** The obvious candidate is not one: **What Daily Conviction Bought**
simulates a daily DCA from a chosen **start date** (`simulate(startDay, amt)`) and
reads only `PL_DATA` and `plPrice` — it is start-date conditioned, never position
conditioned. Nothing in it varies with where price sits in the channel.

**The honest read, and it is a good one:** for a DCA, "start now or wait to start"
is *close to the question the ladder already answers*, because a ladder started
today spans the positions the waiter is waiting for. LSLI's `bucketAt` at today's
position gives the mean advantage and win rate of laddering in from here — which is
the nearest thing the record supports.

**Recommendation: fold C1 into D2 as a second framing line rather than build it as
its own snack** — one snack, two questions, both answered by one shipped
verdict — and let the DCA intent chip route to that snack. This costs nothing
beyond D2's extract and avoids a snack whose question the site cannot honestly
answer. **The alternative is to cut C1** and name it in the §2.6 "what is not here
yet" coda, which is what that coda is for. Either is defensible; the fold is
better for the reader, the cut is more conservative. JM's call.

#### 3.5.3 · What else the one-canonical-home rule catches

Three more, found by applying §0's test to the map rather than by being asked:

- **A4 × D3 compute the same number.** Proved in §4.1. This is the sharpest
  overlap in the map.
- **A2 × the site-wide channel ribbon.** §4.2.
- **A3 × R2 are adjacent, and converge when price is at the floor.** A3 asks "when
  has price been here before" and counts floor visits; R2 asks "how long have
  stretches like this lasted" and measures time back to trend. Different clocks,
  different questions — but at a position at or near the floor they describe the
  same episodes, and today's position is at the floor. They are mapped to
  different clusters (always-on vs Raise cash), so they will not normally render
  together; if the intent router ever renders both, a distinguishing line is
  mandatory. Recorded so it is not discovered late.

---

## 4 · Findings Phase 0 was not asked for

These came out of applying §0's decision test to the §6 map. Each one changes the
map, so each needs a ruling before Phase 1.

### 4.1 · A4 and D3 are algebraically the same number

Not "similar" — **identical**, and the derivation is short enough to check by eye.

The Hurdle Rate's position-view CAGR:

```
posCAGR(H) = ( (1/chanK) · ((t + 365.25H)/t)^PL_B )^(1/H) − 1
   where chanK = spot / plPrice(t),  plPrice(d) = PL_A · d^PL_B
```

Substituting `1/chanK = plPrice(t)/spot = PL_A·t^PL_B / spot`:

```
(1/chanK) · ((t + 365.25H)/t)^PL_B
   = (PL_A · t^PL_B / spot) · (t + 365.25H)^PL_B / t^PL_B
   = PL_A · (t + 365.25H)^PL_B / spot
   = plPrice(t + 365.25H) / spot
```

so

```
posCAGR(H) = ( plPrice(t + 365.25H) / spot )^(1/H) − 1
```

which is, expression for expression, D-or-P's

```
revCAGR(y) = ( plPrice(TODAY_DAYS + 365.25y) / price() )^(1/y) − 1
```

Both `spot` and `price()` are the live price with the same seed fallback; both
`tDays()` and `TODAY_DAYS` are today in days since genesis. **At the same horizon
these print the same number.**

This is not a defect on either page — the two pages ask genuinely different
questions and arrive at one shared piece of arithmetic, which is a sign the model
is coherent. **But it is squarely what §0's one-canonical-home rule exists to
catch**, and on the Rundown the two snacks would sit in the same briefing, one
labelled "the bar this position sets" and the other "what the discount is worth if
it reverts," printing the same percentage.

**Options for JM:**

1. **Differentiate by content.** A4 renders the **floor-case** bar
   (`spotToFloorCAGR`) plus the trend multiple — the "what would it take to get to
   the floor / how far above trend" read that D3 does not carry. D3 keeps the
   dated conditional window with its `illustrative` path and the never-reverts
   alternative. The shared number then appears once.
2. **Drop one.** A4 leaves the always-on cluster and the Hurdle Rate route lives in
   D3's snack instead.
3. **Ship both with a mandatory distinguishing line.** Weakest — it asks the copy
   to do what the architecture should.

**Recommendation: option 1.** It keeps both routes, gives each snack a figure the
other does not have, and is a copy-and-selection decision rather than an
engineering one.

*Caveat, honestly stated: this identity is derived from the source, not observed in
a browser. It should be confirmed numerically in Phase 2 by rendering both at the
same horizon — the algebra is straightforward, but "verified by reading" is not
"verified."*

### 4.2 · A2 duplicates the site-wide channel ribbon

`components/channel-ribbon.njk` is included by `base.njk` on **every content page
that does not opt out**, and renders `● 0.43× trend · near the floor · $64,144` —
multiple, zone word, price — directly beneath the sticky nav. **The Rundown does
not opt out**; `src/the-rundown.njk` sets no `channel_ribbon: false`. The Dashboard
does opt out, precisely because it would be echoing itself.

So v2's context header (`price · trend · multiple · zone · visit-began · prior
visits`) would render three of its six fields a few hundred pixels below a strip
that already shows them. Both are labelled echoes routing to the Dashboard, so this
is not a §0 violation — but it is visible duplication on the page whose whole
identity claim is that it does not duplicate.

**Two clean resolutions:**

1. **Opt the Rundown out of the ribbon** (`channel_ribbon: false`), on the
   Dashboard's own precedent, and let the context header be the page's single
   position echo. Loses the ribbon's live pulse dot at the very top of the page.
2. **Keep the ribbon and slim the header** to the three fields the ribbon cannot
   carry — trend price today, visit-began, prior visits — with the header labelled
   as *additional* to the strip above it.

**Recommendation: option 2.** The ribbon is site-wide furniture and suppressing it
on a page about position is the odder move; and a slimmer header is more in keeping
with §2.2's "never grows tiles" fence.

### 4.3 · A3's two visit definitions disagree — the sharpest blocker

**Two implementations of "a floor visit" exist, they are not the same rule, and
they will publish different counts for the same history.**

| | `the-bitcoin-floor.js` `computeEpisodes()` | `the-rundown.js` `floorVisits()` (v1 build) |
|---|---|---|
| Qualifying sample | `multiple < PL_FLOOR` — **strictly below** the floor | `multiple ≤ PL_FLOOR × 1.01` — **within 1% of, or below** |
| Episode boundary | **sample contiguity** — any non-qualifying sample ends the run | **a 100-day gap** between qualifying samples |
| Era handling | none in the grouping | tags `modern` at 2014 (`MODERN_D`) |

The Rundown's rule is the more considered one — its `GRAZE = 1.01` makes the Floor
page's own published phrase *"approached the line"* numeric, its `EPISODE_D = 100`
is the site's independent-visit rule (lifted from `discount-or-premium.js`, where
Phase 0 confirms the same 100-day gap governs `scanDurations`' episode grouping),
and v1's report recorded a sensitivity check on `GRAZE`. **But v2 §6 makes The
Bitcoin Floor A3's canonical home, and §11.4 requires every figure to reproduce on
its source page.** A timeline echo showing four visits, routing to a page whose own
episode strip is built on a different rule, fails that test — and it fails it
visually, in the one place a reader is most likely to check.

This is not an engine problem. Both implementations are cheap and correct for their
own definition. It is a **canon problem**, and it belongs to JM:

1. **The Floor page adopts the Rundown's rule** — graze band plus 100-day merge.
   Best for the site: it makes one independent-visit definition canonical across
   the Floor page, D-or-P and the Rundown, and it is the rule that already has a
   recorded sensitivity check. Cost: a change to a shipped flagship, with its own
   parity/tripwire assertions to re-green (`floorParityQA`, `tripwireState`,
   `renderEpisodeStrip` all read `computeEpisodes`).
2. **The Rundown adopts the Floor page's rule** — cheapest, changes nothing
   shipped, and A3's timeline reproduces exactly. Cost: the Rundown loses the graze
   band, so a visit that came within 1% of the floor without crossing it stops
   counting — and v1's whole "third floor visit" framing was built on the graze
   definition. The count on the page may change.
3. **Keep both and disclose** — a stated method difference, in the shape of v1
   §16.2's WODN pooled-vs-narrated disclosure. Honest, precedented, and it is the
   pattern the site already uses for exactly this situation. Cost: a second
   standing method disclosure on a page whose §4 budget is 75 words per snack.

**Recommendation: option 1**, with option 3 as the fallback if the Floor page's
assertions prove expensive to re-green. Option 2 is the cheapest to build and the
worst for the page, because it retires the framing v1 established.

**Note:** whichever is ruled, the answer changes the context header too — `A2`'s
"visit-began" and "prior visits on record" cells are computed from
`floorVisits()`. This ruling is upstream of both A2 and A3.

### 4.4 · P2's canonical home is a route, not a source

v2 §6 gives P2 the engine "zone drawdown record" and the canonical home "Stress
Test." Phase 0 finds the Stress Test computes no such thing:
`the-bitcoin-retirement-stress-test.js` runs `shared/crash-model.js` plus
`RetirementEngine` — a **retirement crash simulator**, parameterized by crash
timing and depth, with no channel-position conditioning anywhere in it.

The figures P2 wants — how often a drawdown followed entries at this position, how
deep, and how often price never fell below the entry at all — are
`bandMetrics().ddProb`, `.ddDepth` and `.neverFell` in
`shared/channel-entries.js`, i.e. **the WODN/HMC engine the Rundown already
imports**. Two consequences:

- **P2 is `reuse`, and cheap** — it reads fields the Rundown is already
  computing for D1.
- **The route must be labelled as v1 §16.3 already ruled for R7**: the Stress Test
  is *"a scenario tool, not as the source."* That ruling carries forward and
  resolves this row; the v2 map simply lost the qualifier in the rewrite.
- **The window is two years.** `bandMetrics` measures within `WAIT_CAP = 2 × 365.25`
  days, and `DD_THRESH = 0.20` defines a drawdown as a ≥20% fall. Both are the
  engine's stipulated constants and both must appear in the snack's register or
  sources line, because "what have drawdowns from this zone looked like" reads as
  unbounded and the answer is not.

---

## 5 · Rulings needed before Phase 1

Ordered by what blocks the most downstream work.

| # | Ruling | Blocks | Phase 0's recommendation |
|---|---|---|---|
| **1** | **A3's visit definition** — Floor page adopts the graze + 100-day rule, Rundown adopts the Floor page's rule, or both stand with a stated method difference | A3, **and A2's header cells** | Floor page adopts (§4.3 option 1); disclosure as fallback |
| **2** | **A4 × D3** — the two snacks print the same number (§4.1) | A4, D3 | Differentiate: A4 becomes the floor-case bar; D3 keeps the dated window |
| **3** | **P1's canonical home** — flagship or Escape Velocity | P1 | Escape Velocity — the flagship never calls `lineFor` |
| **4** | **`yearsInRetirement`** — fourth input, or fixed at 30 and stated | P1, and the §3 input set | Fix at 30 and state it |
| **5** | **Stack persistence** — permit per v2 §3, or hold the site-wide convention | The whole persistence design, and D3's copy | Do not persist; if overruled, the three fences in §3.4 |
| **6** | **B1's thresholds** — DR's default preset, new inputs, or cut B1 | B1, and the §3 input set | DR's default preset, named on the snack |
| **7** | **C1** — fold into D2, or cut and name in the coda | C1 | Fold into D2 |
| **8** | **A2 × the ribbon** — opt out of the ribbon, or slim the header | A2 | Slim the header |
| **9** | **§6.37's "do not apply by default"** — does the briefing qualify as a tracking use-case | The persistence design | Yes, but rule it explicitly |
| **10** | **R2's empty state** — what renders in the dead band | R2 | Needs a design answer; Phase 0 has no recommendation |

---

## 6 · Proposed final snack set

Eleven snacks, down from thirteen candidates: **C1 folds into D2**, and **A4
narrows** to the floor-case bar so it stops colliding with D3. Every row is
conditional on its ruling in §5.

| Id | Cluster | Question | Canonical home | Cost | Conditional on |
|---|---|---|---|---|---|
| **A1** | Always-on | (hero) | — | `reuse` (built) | — |
| **A2** | Always-on | Where does this sit? | The Dashboard | `reuse` (built) | Rulings 1, 8 |
| **A3** | Always-on | When has price been here before? | The Bitcoin Floor | `rebuild-compact` | **Ruling 1** |
| **A4** | Always-on | What bar does this position set? | The Bitcoin Hurdle Rate | `rebuild-compact` | **Ruling 2** |
| **D1** | Deploy | Deploy now, or wait for lower? | Wait, or Deploy Now? | **`reuse`** | — |
| **D2** | Deploy + DCA | All at once, or ladder in — and does starting a DCA now change it? | Lump Sum or Ladder In | **`extract`** (~40 lines) | Ruling 7 |
| **D3** | Deploy | What is the discount worth if it reverts? | Discount, or Premium? | `rebuild-compact` | Ruling 2 |
| **R1** | Raise cash | Sell here hoping to rebuy lower — what has that done? | How Much Cash? | **`reuse`** | — |
| **R2** | Raise cash | How long have stretches like this lasted? | Discount, or Premium? | **`extract`** (~50 lines) | Ruling 10 |
| **B1** | Rebalance | How far are the bands from triggering here? | Disciplined Rebalancing | `rebuild-compact` | **Ruling 6** |
| **P1** | Retirement | What stack does my target need, read from here? | **Bitcoin Escape Velocity** | **`reuse`** + small `extract` | **Rulings 3, 4** |
| **P2** | Retirement | What have drawdowns from this zone looked like? | Stress Test *(route, not source)* | **`reuse`** | — |

**Totals: 6 `reuse`, 4 `rebuild-compact`, 3 `extract`** (D2, R2, and the
`RetirementEngine` growth-key override). Four snacks — D1, R1, P2 and A1 — are
buildable the day Phase 1 lands, because they need no ruling at all.

**The three extractions, named:**

| New module | Lifted from | Adopted back by | Size |
|---|---|---|---|
| `shared/ladder-advantage.js` | `lump-sum-or-ladder-in.js` — `ladderAdvantage`, `bucketAt`, `advantageCurve`, `eraStartDay` | Lump Sum or Ladder In | ~40 lines |
| `shared/reversion-durations.js` | `discount-or-premium.js` — `scanDurations` | Discount, or Premium? | ~50 lines |
| optional `growthKey` param | `shared/retirement-engine.js` — `projectForBasis`, `lineFor` | Escape Velocity, Compare Retirement Plans | ~15 lines |

All three are pure, DOM-free, and adopted back by their source page in the same
commit, so the echo and the canonical home cannot drift — which is the mechanism
§11.4's consistency test depends on.

---

## 7 · Proposed build order

Sequenced so that no snack is built before the ruling it depends on, and so the
riskiest unknown is retired first.

**Phase 1 — the shell.** Briefing setup (three inputs, per-field remember toggles
inside the single `lcs.the-rundown.state.v1` blob, clear-all), the intent router as
a display filter, plus the carried hero, context header and compressed gate. The
v1 build supplies the hero, strip and gate; the header's cells wait on ruling 1.

**Phase 2a — the four unblocked snacks: D1, R1, P2, A1.** All `reuse`, all on
`channel-entries` which the page already imports. This is deliberately first: it
proves the snack anatomy, the text budget and the consistency test on the cheapest
possible ground, and D1 is the model snack the whole grid is scaled against.

**Phase 2b — the extractions: D2 (+C1), R2.** Each lands with its source page
adopting the shared module back **in the same commit**, and each source page's
existing figures re-verified unchanged. Do these before the compact rebuilds,
because an extraction that breaks a shipped page is the one failure mode that
costs more than the snack is worth.

**Phase 2c — the compact rebuilds: A4, D3, A3, B1.** In that order. A4 and D3 are
independent of everything once ruling 2 lands. A3 waits on ruling 1 and may
require Floor-page work with its own assertions to re-green — it is scheduled late
deliberately, because it is the only snack whose ruling can reach into a shipped
flagship. B1 waits on ruling 6.

**Phase 2d — P1.** Last of the snacks: it is the only one adding new
`page_scripts` dependencies (`modeling-assumptions`, `retirement-engine`), the only
one needing a shared-engine parameter change, and it depends on two rulings. Its
floor-case sources line is written **at build time**, not at the register pass.

**Phase 3 — coda, what-would-break-this, FAQ, Related**, per v2 §2.6–§2.9. The
coda names whatever §5 rulings cut — C1 if it is not folded, B1 if it is dropped.

**Phase 4 — the gates**, per v2 §10: page-wide text-budget audit, register pass,
privacy acceptance test (**assert the key is absent after clear-all**, not empty),
payload and CLS measurement per §1, mobile, NEW_PAGE_CHECKLIST, unlisted ship for
JM's review.

---

## 8 · What this report does not cover

Stated so that a green assertion is not read as covering more than it does.

- **Nothing was executed.** Every finding is a static read of the working tree.
  The algebraic identity in §4.1, the sample-array compatibility in §2.1, and the
  visit-count divergence in §4.3 are all derived from source and all need a
  numeric confirmation in Phase 2.
- **No copy was drafted.** §4's question lines, verdict lines and register lines
  are build-time work; this report proposes no wording beyond quoting what is
  already shipped.
- **The OG card, the nav placement and the dashboard routing chip are untouched.**
  They carry from v1 §9 / v1 §11 and are not Phase 0's business.
- **The derivation-exception register is unchanged.** Population remains one — the
  entry-anchored horizon lookups at `v1 §16.2`. **No snack proposed here adds an
  entry**: every figure in §6 reproduces from a shipped tool, which is the whole
  point of the cost-class exercise. If ruling 1 goes to option 3 (both definitions
  stand with a stated difference), that is a **method disclosure**, not a new
  exception — the A3 figures still reproduce, from a stated method, exactly as v1
  §16.2's WODN disclosure works.
- **DR's duplicated `percentileToRatio`** (§3.1) is recorded, not resolved. It is
  Disciplined Rebalancing's business and a `TECH_DEBT` candidate.
- **The second site-wide position vocabulary** — D-or-P's 0.95–1.05 dead band
  against `positionLabel`'s 0.85–1.20 at-trend band — is v1 §16.4's open item and
  **still open**. v2 makes it sharper, because the Rundown now renders both
  vocabularies on one page: the context header uses `positionLabel`, and D3 and R2
  both branch on D-or-P's dead band. Not blocking, but it will be visible to a
  reader in a way it has never been before, and it should be ruled before public
  listing rather than after.

_Filed for JM's ratification. No Phase 1 work begins until §5 is ruled._
