# THE RUNDOWN — DESIGN v2 · "The Briefing"

> **LANDING NOTE — 2026-09-01. This file now carries two parts; read Part I first.**
> **Part I (§0–§12) is DESIGN v2, "The Briefing", and it is authoritative.** It lands here
> verbatim from the drafting chat's `RUNDOWN_DESIGN_v2.md`
> (SHA-1 `253494152d98d337d310cdb31fa60867e5d02b87`, verified before ingest); nothing in it
> was rewritten in the move. Where Part I's preamble and §1 speak of superseding "the v1
> body (RUNDOWN_DESIGN.md)", that body is now **Part II of this file** — the supersession is
> in force, the text is simply co-located.
> **Part II is DESIGN v1, verbatim, as marked historical record.** Its body is superseded;
> it is kept in place because it is the record of the reasoning, per the house pattern
> (`RETIREMENT_SCENARIO_COMPARISON_DESIGN.md`, and v1's own §16 supersession). Its headings
> are prefixed **`v1 §`** so that cross-references from Part I resolve unambiguously; the
> `§n` references *inside* Part II are to v1's own numbering and are unchanged.
> **Where Part I and Part II conflict, Part I governs** — without exception.
>
> **What in Part II is still load-bearing, and carries forward:**
> - **`v1 §16` in full** — the ratified Phase 0 scope reframe and its rulings record. It
>   remains the record of what was decided on 2026-08-28 and why; v2 does not reopen it.
> - **The derivation-exception class and its register** (`v1 §16.2`, sub-heading "The
>   `WAIT_CAP` exception"). Carried by Part I §4 in the same four conditions, with the same
>   population — **one entry: the entry-anchored 4-year horizon lookups** — and the same
>   rule that a number not named there has no exception. The register lives at `v1 §16.2`;
>   new entries are added there by name.
> - **`v1 §16.4`'s carried-forward build notes** — the `matchPos()` sub-floor clamp, the
>   knife-edge zone label, the second site-wide position vocabulary, and the 3× band as a
>   stipulated constant. All four still bind any build against these engines.
> - **Everything Part I §9 names as carrying from v1 verbatim** — hero + live standfirst
>   spec, zone taxonomy, the 100-day independent-visit rule, the consistency test, the N<3
>   rule, the sensitivity gate, title/slug and nav rulings, and the rest of that list.
>
> **`RUNDOWN_PHASE0_REPORT.md` stands** — it is v1's Phase 0, filed and ratified
> 2026-08-28, and Part I §6 and §10 reference its findings as prior work rather than
> replacing it. The v2 Phase 0 output is the separate `RUNDOWN_PHASE0_V2_REPORT.md`.

_2026-09-01. Drafting-chat origin; repo-bound. Supersedes the v1 body (RUNDOWN_DESIGN.md)
following JM's register review of the v1 unlisted preview and the rulings recorded in §12.
v1's §16 rulings record, the Phase 0 findings report, and the derivation-exception class
remain historical record and carry forward where §9 says so. Working conventions in force:
hold-and-report; disclosure legitimizes scope-crossing; custody = gate/wiring/post-merge;
green assertions prove only what they cover; SHA-1 in every handback._

_Why v2 exists, in one line: v1 built an essay; the site's genius is instruments. JM's
review (2026-09-01) ruled the text-dense body superseded and returned the page to its
original capture — "an expanded, more personal dashboard" — now with the identity that
makes it non-duplicative: the Dashboard is the glance, the Gallery is the record, and
**the Rundown is the briefing.**_

---

## 0 · Identity — three surfaces, one home each

**The Dashboard is the glance.** Where is bitcoin right now? Zero inputs, universal,
live, ten seconds, identical for every visitor at a given moment.

**The Gallery is the record.** What does the history look like? Timeless exhibits,
universal, browsed in any order, static by design — exhibits hang on walls; you don't
turn their knobs.

**The Rundown is the briefing.** What has this position meant for *my* situation and
*my* question? Current to the moment AND personal to the person in the chair. Present
tense with no subject; past tense with no subject; second person conditional.

**The one-canonical-home rule (the decision test for every future "should the Rundown
have X?"):** every element has exactly one canonical home. If a proposed module would
render identically for every visitor at a given moment, it does not belong on the
Rundown — it is a Dashboard tile if live-positional, a Gallery exhibit if timeless. The
Rundown owns no data and no exhibits; **it owns the composition** — position × situation
× intent — plus compact *echoes* that route to canonical homes. A briefing is assembled
from the file room and arranged for the person in the chair; it never pretends to be the
file room.

**The instrument test for charts:** every chart on the Rundown is parameterized by the
reader's position and inputs and exists to answer the reader's question. A chart that
means the same thing to everyone is a Gallery candidate in the wrong room.

**Standing fences, both directions:** the Dashboard never gains inputs (its zero-input
purity is what makes "not a signal" credible); the Rundown never grows general tiles.
Echo semantics govern overlap: an echo is compact, labeled, and routes to its canonical
home — it does not duplicate it.

## 1 · What changed from v1, and why

1. **The body recomposes from prose to snacks** (§4). v1's narrated case-study rows —
   correct under the N<3 rule, wrong as a reading experience — are superseded by
   bite-sized, visually-deep modules. The N<3 honesty survives inside the snacks (§4
   rules); the walls of text do not.
2. **Inputs are ruled IN** (JM, 2026-09-01), superseding v1's zero-inputs architecture
   and the v1-era GA-retention gate on personalization. The compliance posture moves
   from "no inputs, structurally a publication" to "client-side inputs, structurally
   private" (§3, §8).
3. **Prediction-leaning content is permitted** under the named conditional-projection
   pattern (§5), on the precedent of Discount-or-Premium's shipped "Your window" view.
   Unconditional forward statements remain banned.
4. **The separation mandate** (§0) is the standing identity test, added at JM's
   direction so the Rundown has a home and a raison d'être beside the Dashboard and the
   Gallery with minimal-to-no overlap.

## 2 · Page architecture v2

1. **Hero** — carries from v1 unchanged: static H1, live standfirst (single engine call,
   no-JS fallback without a number, no placeholder numerals, CLS-checked).
2. **Context header** — the v1 position strip, recast: explicitly a compact echo of the
   Dashboard (labeled as such, links to it). Price · trend · multiple · zone ·
   visit-began · prior visits. Fence: never grows tiles.
3. **Premise gate, compressed** — two sentences plus the route; the honesty moves into
   the modules. Draft copy:
   > Everything below is conditional on the power law holding — the model, its fit, and
   > what would break it live on [the Power Law page], and that examination comes before
   > this one. Reject the model and this page has nothing for you; accept it and hold it
   > loosely.
4. **The briefing setup** — inputs and intent (§3).
5. **The snack grid** — always-on cluster, then the intent-selected cluster (§6).
6. **"What is not here yet"** — the roadmap coda carries from v1, now intent-aware:
   absent decisions are named per intent where relevant, absent because nothing on the
   site yet conditions them on position; snacks accrete as engines ship.
7. **What would break this, compressed** — model-concentration statement + Power Law
   route + the out-of-sample exhibit slot (link added at that exhibit's ship, not
   before).
8. **FAQ** — carries, updated (§8): adds the inputs/privacy and intent questions.
9. **Related** — carries.

## 3 · The briefing setup — inputs and intent

**Inputs (v2 set):**
- **Retirement year** (target)
- **Target retirement income** (annual, today's dollars)
- **Stack** (BTC; optional; sensitive)
- Phase 0 may propose **horizon** as a fourth if any ratified snack needs it; otherwise
  horizon stays per-snack.

**Privacy pattern — the shipped precedent, extended:** Discount-or-Premium already ships
"Your stack (optional): … *Stays on this page — never stored or sent.*" The Rundown
extends it one notch: per-field **"remember on this device"** toggles (localStorage per
STYLE_GUIDE §6.37 sticky-state precedent), with **stack defaulting to OFF** — entered
freely, forgotten on close unless the reader opts in. Page carries, verbatim-class:
"Everything you enter stays in your browser — never stored on a server, never sent." A
**clear-all** control sits beside the fields. No accounts, no cookies for these values,
no analytics events carrying them (acceptance-tested, §11).

**Intent chips (display router):** `Deploy new capital` · `Start or continue a DCA` ·
`Raise cash` · `Rebalance` · `Plan retirement` · `Just looking` (always-on cluster
only). **The router filters which snacks render; it never generates a recommendation.**
Selecting an intent is the reader stating their question, not the page issuing an
answer; every snack that renders inherits its source tool's own register, verdict
language, and exploration banner semantics. Intent choice may persist under the same
toggle pattern; default OFF.

## 4 · The snack — anatomy and rules

A snack is a bite-sized, position-aware module with visual depth and a hard text budget.

**Anatomy (in order):**
1. **The question line** — second person conditional, as the reader carries it ("There
   is capital to deploy — has deploying at a position like this one beaten waiting?").
2. **The verdict line** — inheriting the source tool's own shipped verdict language and
   tense ("Waiting was almost always the wrong call here," as a historical verdict at a
   position). The Rundown never softens *or* strengthens a source tool's verdict.
3. **2–3 stat cards** — the source tool's own headline figures for the current position.
4. **One compact interaction or chart** — scaled from the source tool; slider optional
   where it earns its space, fixed-at-today with a route otherwise. Must pass the
   instrument test (§0).
5. **The register line** — one line: "Historical, at this position — not a prediction,"
   or the §5 conditional-projection variant where that pattern applies.
6. **The route** — "The full instrument →" to the canonical home (which carries the
   full counter-case, sensitivity, and sources).

**Rules:**
- **Text budget:** ≤ 75 words of prose per snack outside cards, labels, and axis text.
  The budget is an acceptance criterion, not an aspiration.
- **Consistency test carries from v1:** every figure reproducible on its source page to
  displayed precision; the snack map's engine column is the test matrix.
- **N and spread rules carry:** no distribution statistics on N<3; thin evidence is
  named in one line with the route to the fuller treatment ("Two prior visits is not a
  base rate — the full record, narrated: →").
- **Counter-case, compressed:** one line + route where the canonical page carries the
  full version; never omitted, never expanded into paragraphs here.
- Imperative ban, second-person-directive ban, banned-words list: carry in full.
- **Derivation-exception class carries:** any figure not reproduced from a shipped tool
  must be enumerated in the design doc's exception register (population currently one:
  the entry-anchored 4-year lookups), same four conditions, same "a number not named
  there has no exception."

## 5 · The conditional-projection pattern (named device; D-or-P precedent)

Prediction-leaning content is permitted **only** in this form, ruled by JM 2026-09-01 on
the precedent of Discount-or-Premium's "Your window" view. Five mandatory elements:

1. **The condition is in the title** — "Implied CAGR *if it reverts* by [date]." Never a
   bare forward number.
2. **The path is labeled `illustrative`** on the chart itself.
3. **A baseline or alternative renders alongside** — the at-trend baseline, and/or the
   never-reverts path — so the conditional never stands alone.
4. **The arithmetic line:** "That is arithmetic, not a forecast" (or the source tool's
   own equivalent).
5. **Caveat inheritance:** the snack links the what-would-break-this section / Power Law
   caveats like every other module.

Unconditional forward statements remain banned everywhere on the page. A snack using
this pattern says so in its register line (element 5 of §4 anatomy).

## 6 · Snack map v2 — candidate set (Phase 0 verifies before any is ratified)

| Id | Cluster / intent | Question | Canonical home (route) | Engine | Inputs used | Projection pattern? |
|---|---|---|---|---|---|---|
| A1 | Always-on | (hero) | — | shared position engine | — | no |
| A2 | Always-on | Where does this sit? | The Dashboard | shared position engine | — | no |
| A3 | Always-on | When has price been here before? | The Bitcoin Floor | episode logic (100-day rule) | — | no |
| A4 | Always-on | What bar does this position set? | The Bitcoin Hurdle Rate | hurdle engine | — | no |
| D1 | Deploy | Deploy now, or wait for lower? | Wait, or Deploy Now? | channel-entries (matched set) | stack (optional, $ framing) | no |
| D2 | Deploy | All at once, or ladder in? | Lump Sum or Ladder In | LSLI position engine | — | no |
| D3 | Deploy / Always-on candidate | What is the discount worth if it reverts? | Discount, or Premium? ("Your window") | D-or-P reversion engine | stack (optional), horizon | **yes — §5** |
| C1 | DCA | Start now, or wait to start? | Phase 0 proposes the honest read (LSLI / WODN framing) | tbd | — | no |
| R1 | Raise cash | Sell here hoping to rebuy lower — what has that done? | How Much Cash? | shared channel-entries (sell side) | stack (optional) | no |
| R2 | Raise cash | How long have stretches like this lasted? | Discount, or Premium? | episode stats (median/max to trend) | — | no |
| B1 | Rebalance | How far are the bands from triggering here? | Disciplined Rebalancing | DR band logic — **feasibility check** | allocation fields? (Phase 0) | no |
| P1 | Retirement | What stack does my target need, read from here? | Retirement flagship | shared/retirement-engine.js | retirement year, income, stack | floor-case framing; §5 check |
| P2 | Retirement | What have drawdowns from this zone looked like? | Stress Test | zone drawdown record | — | no |

Notes binding the map:
- A3 renders as a **visual timeline** (Gallery-inspired, position-current — today's
  marker on it), replacing v1's narrated visit cards; the narration lives at the
  canonical home.
- D1 is the model snack — JM's screenshot of WODN's module (slider, verdict, three stat
  cards, one chart) is the reference for scale and density.
- P1 with stack present adds one gap/surplus line ("your stated stack vs. the
  requirement read from trend / from the floor case"); with stack absent it renders in
  requirement terms only.
- v1 Phase 0's overlap cut of the lump-vs-ladder row (Your Deployment Plan "owns that
  ground") is **re-evaluated under echo semantics**: an echo routes, it does not
  compete. Phase 0 re-checks D2/C1 canonical homes (LSLI vs. YDP) and reports.

## 7 · Canonical-home applications already ruled

- The three-visit record: canonical home **The Bitcoin Floor**; the Rundown carries the
  timeline echo only.
- The position read: canonical home **the Dashboard**; the Rundown carries the context
  header echo only.
- Nav story, for the nav-capacity session (not this build): three ways into the numbers
  — the glance, the record, the briefing.

## 8 · Register and compliance v2

- Inputs raise the counsel tier back up; v1's "no-inputs argues the lower tier" argument
  is retired with the architecture. **Ship gate:** build → unlisted → JM register review
  → counsel pass per the standing JM-6 assumption (counsel assumed before v2
  personalization goes public; mechanics at JM's election) → public listing on JM's
  word.
- The router filters display only. No path from inputs or intent to a generated
  recommendation. Snacks inherit source-tool register wholesale, including the
  for-exploration-only banner semantics.
- Privacy statements as §3; their truth is acceptance-tested (§11.6).
- FAQ additions (drafts at build, register-checked): "What happens to what I enter
  here?" · "Why does the page ask what I'm trying to do?" · plus v1's carried set,
  re-answered at snack length.
- All v1 register machinery carries: banned words, imperative grep, map-never-
  recommendation, SITE_GUIDE §13 canon placement, OG per §52/§52.1 (no live figures on
  the card).

## 9 · Carries from v1 verbatim (do not redesign)

Hero + live standfirst spec (fallbacks, single engine call, CLS gate) · zone taxonomy =
`positionLabel` canon · independent-visit definition = the 100-day episode rule ·
derivation-exception class + register · consistency test · N<3 rule · live-compute-only,
zero additions to MONTHLY_REFRESH_CHECKLIST · sensitivity gate where distributions
render · NEW_PAGE_CHECKLIST in full · unlisted-ship discipline · the icon-include
reconciliation at merge (OPEN_ITEMS carries it; git will not flag it) · title/slug
(`/the-rundown`) and nav placement rulings.

## 10 · Build phases v2

**Phase 0 — verify and report. No page code before ratification.**
1. **Embeddability audit, per snack:** is the source interaction componentized (shared
   module) or page-baked? Cost class per snack: `reuse` (import as-is) / `extract`
   (lift to shared component, source page adopts it back) / `rebuild-compact` (small
   purpose-built echo against the same engine). This determines whether v2 is
   composition or extraction work — report it as the headline.
2. Engine feasibility where v1 flagged gaps: **B1** (DR band-distance from current
   state — a now-read, not historical conditioning; may be cheap even though v1 found
   no position-conditioned history) and **P1** (retirement-engine.js wiring to
   year/income inputs; floor-case read).
3. **D3 componentization:** can D-or-P's "Your window" render compact (two cards + the
   uplift line + one chart) without forking its engine?
4. Inputs persistence: confirm the §6.37 pattern + D-or-P's non-persistent field
   compose into the per-field-toggle design; propose the storage keys and the clear-all.
5. Overlap re-check under echo semantics (D2/C1 canonical home; anything else the rule
   catches).
6. Output: **RUNDOWN_PHASE0_V2_REPORT.md** — findings not fixes, ending in the proposed
   final snack set with cost classes and a build order. JM ratifies; then build.
**Phase 1** — briefing setup (inputs, toggles, intent router), carried hero/header/gate,
page shell.
**Phase 2** — snacks in ratified order: always-on cluster, then Deploy, then the rest;
each lands with its consistency test green and its text budget audited.
**Phase 3** — coda, WWBT, FAQ, Related.
**Phase 4** — register pass, text-budget audit page-wide, privacy acceptance test,
mobile + CLS, checklist, unlisted ship for JM review.

Branch mechanics: continue on `feat-the-rundown` or branch from it — Claude Code's
call, reported; the v1 hero/header/gate/episode work carries either way.

## 11 · Acceptance criteria v2

1. Snack text budget: ≤75 words prose per snack outside cards/labels; page-wide audit
   in Phase 4.
2. Every snack routes to its canonical home; no element duplicates a canonical home's
   full treatment.
3. Nothing outside the always-on cluster renders identically for all visitors at a
   given moment; always-on echoes are labeled as echoes.
4. Every figure reproducible on its source page (matrix = §6 engine column);
   exceptions only via the enumerated register.
5. Intent changes display only; no input or intent value alters any computed verdict's
   wording beyond selecting which shipped verdicts render.
6. **Privacy, tested:** with fields filled and toggles on/off, no network request
   carries any input value; storage appears only under the documented keys; clear-all
   clears them; stack persists only when its toggle is explicitly on.
7. Projection-pattern snacks carry all five §5 elements.
8. Hero/CLS/fallback criteria carry from v1; N<3 and counter-case-present rules carry.
9. OG static, no live figures; title/meta static.
10. Unlisted until JM's word; counsel gate per §8 before public.

## 12 · Rulings record — 2026-09-01, JM (v1 register review)

- **Separation mandate:** the Rundown must have its own raison d'être beside the
  Dashboard and the Gallery, minimal overlap — resolved as §0's taxonomy and the
  one-canonical-home rule.
- **Body recomposition:** v1's text-dense body superseded; bite-sized, position-aware,
  visually-deep snacks per §4; Dashboard/Gallery named as the inspiration pair.
- **Inputs IN:** retirement year, target income, stack (sensitive — sticky opt-in,
  default off), possible intent persistence; supersedes the GA gate on personalization.
- **Intent router ruled in** as display-filtering only.
- **Prediction-leaning permitted** under the §5 pattern; Discount-or-Premium's "Your
  window" named by JM as the precedent and ruled a snack candidate (D3).
- **Proceed to v2 requirements and the Phase 0 scoping pass.** v1 does not merge; its
  foundations carry.

---

# PART II · THE RUNDOWN — DESIGN v1 (historical record)

> **SUPERSEDED AS A BODY — 2026-09-01**, by Part I of this file (DESIGN v2, "The
> Briefing"), on JM's register review of the v1 unlisted preview. The ruling is recorded at
> Part I §12; what changed and why is Part I §1.
>
> **This part is not the spec.** It is kept verbatim, in place, because it explains why the
> shipped v1 preview took the shape it did and because parts of it still bind — see the
> landing note at the top of this file for the enumerated carries (`v1 §16` in full, the
> derivation-exception register at `v1 §16.2`, the `v1 §16.4` build notes, and the Part I §9
> verbatim list). **Nothing here may be used to justify a v2 build decision that Part I
> settles differently.**
>
> **Reading the numbering:** headings in this part carry a `v1 §` prefix, added at the
> landing. The `§n` cross-references written *inside* the v1 text are to v1's own sections
> and are unchanged — read them as `v1 §n`. Section numbers collide with Part I's by
> coincidence of independent numbering, not by relation.
>
> **v1 did not merge.** Its build survives as the unlisted preview on `feat-the-rundown` and
> as the reference for what the hero, header, gate and episode computations already do
> (Part I §9, §12).

_2026-08-28. Drafting-chat origin; repo-bound (design docs are repo-tracked). Operationalizes
the PAGE_IDEAS_BACKLOG entry "The Rundown" as captured in PRE_VACATION_PACKAGE_2026-08-28 §3
Entry 1 — that entry is the requirements record; this document is the build spec. Open
decisions for JM are marked [JM-n] inline and collected in §15. Working conventions in
force: hold-and-report; disclosure legitimizes scope-crossing; custody = gate/wiring/
post-merge; green assertions prove only what they cover; SHA-1 in every handback._

_Revision same day: all eight [JM-n] decisions ruled by JM (recorded in §15); the
live-position hero added per JM's amendment to JM-1 (§2, §3, §11, §13)._

_**Revision 2 — Phase 0 ratified, v1 scope reframed (ruling 2026-08-28; recorded in §16).**
`RUNDOWN_PHASE0_REPORT.md` was filed and ratified. §16 is now the authoritative statement of
v1 scope and supersedes §4's zone-taxonomy default, §5's proposed row set, and the parts of
§1/§10 that fence v1 to the full record. Sections superseded by §16 are marked in place and
kept as the record of the reasoning — read §16 first. **The premise gate (§7), the live hero
(§11), the row anatomy (§5), and every gate in §9/§10/§13 are unchanged.**_

_Why v1 can build now despite the exhibits-first sequencing rule: the rule gates the
**era-filter toggles**, not the page. v1 ships with no toggles (the source engine's record,
disclosed — see §1 as amended), no user
inputs, and no personalization — so it depends on nothing that isn't already live. The two
exhibits (rolling out-of-sample fits; the Narrowing Channel) build in parallel lanes and
gate v1.1, not v1._

---

## v1 §0 · What this page is

One page that reads bitcoin's current position in its long-run power law channel and lays
out, for each major decision a reader might be carrying — deploying, laddering, cash
reserves, rebalancing, retirement timing, selling — what the historical record on this site
says about that decision from a position like today's, routing into the existing tools
preconfigured with the current position. WODN-register throughout: "here is what the data
suggests, based on the history" — clear guidance that stops short of recommendation. The
structural skeleton is the Playbook's three-step arc, self-serve: is this real → what would
it do to my situation → what do we do when it falls.

## v1 §1 · v1 scope fences

**IN:** premise gate with off-ramp; live position strip; zone taxonomy; the decision rows
(§5), each computed from an existing engine; the Step-3 drawdown block; a "what this
position does not change" section; a what-would-break-this section; FAQ block; OG card;
Related block; NEW_PAGE_CHECKLIST in full.

**OUT — hard fences, no exceptions in v1:**
- Era-filter / assumption toggles. ~~Full record only.~~ **AMENDED 2026-08-28 — "the source
  engine's record, disclosed."** Phase 0 found the shipped engine is *already* era-filtered:
  `channel-entries.js` sets `TABLE_CUT` at **2014-01-01** and excludes everything before it
  as the "pre-$15 curiosity era". The fence as written was contradicted by the only engine
  v1 can compute from. The row set therefore inherits a post-2014 sample and **must say so
  on the page** — v1 adds no era filter of its own, and does not claim a full-record basis
  it does not have. Toggles are v1.1, gated on BOTH
  exhibits shipping (backlog Entries 3–4) and governed by the five design rules in the
  backlog entry.
- Sticky inputs, personalization, saved state of any kind. v2, gated on the GA4 retention
  baseline. v1 takes **no user inputs at all** — this is deliberate: with zero inputs the
  page is structurally a publication, which keeps the publisher/adviser line wide.
- The borrowing row. Bitcoin as Collateral appears in Related; no position-conditioned
  borrowing content anywhere on the page.
- Notifications, alerts, email capture beyond the site-standard footer.
- Any row requiring a new computational engine (see row feasibility rule, §5).
- Any addition to MONTHLY_REFRESH_CHECKLIST. Live-compute-only, same discipline as the
  dashboard. If a proposed element would need manual refresh, it is out of scope.
- Monte Carlo / randomized draws (the three-track precedent question stays untouched).
- Dashboard changes beyond the single routing chip in §11 [JM-3].

## v1 §2 · Page architecture

Order, top to bottom:
1. Hero: static title, **live standfirst** carrying the current trend multiple (§11, "The
   live hero"), the not-a-recommendation line per SITE_GUIDE §13 register canon.
2. **Position strip** (§3).
3. **Step 1 — Is this real?** The premise gate (§7).
4. **Step 2 — What would it do to my situation?** ~~Decision rows R1–R6 (§5).~~ **Per §16,
   three parts in this order:**
   1. **Opening block — the third floor visit** (§16.3a). The organizing fact, with the
      prior two visits named by date, depth and duration. Placed **immediately after the
      premise gate and before the decision rows**, so the historical framing inherits the
      gate's conditionality rather than standing on its own. **A framing block, not a row —
      the six-part anatomy (§5) does not apply to it.**
   2. **The decision rows:** R1 as case studies, then R3 (§16.3).
   3. **Coda — the roadmap** (§16.3b). After the last row: what is not here yet, named as
      absent because nothing on the site yet conditions it on position, accreting as
      engines ship. A map, growing — never a matrix, padded.
5. **Step 3 — What do we do when it falls?** Drawdown block R7 (reduced to
   depth-and-frequency, §5) + holding-through-it paragraph (§5).
6. **What this position does not change** (§6).
7. **What would break this** (§8) — carries the sub-floor-continuation scenario that R1's
   counter-case cross-links to (§5 anatomy 3, as amended).
8. FAQ block (§9).
9. Related block: Bitcoin as Collateral, the Dashboard, the Power Law page, **The Bitcoin
   Floor** (added at Phase 0 — it examines exactly where price is standing now), Discount
   or Premium, the Heatmap (slug `/heatmap`, not `/the-bitcoin-heatmap`).

## v1 §3 · The position strip

Reuses the dashboard's channel-position computation — same engine, same figures, to the
digit. Elements: current price · trend price · trend multiple (e.g. 0.43×) · zone name ·
date this zone was entered · number of prior independent visits to this zone in the record.

Engine requirement: reuse whatever module the dashboard uses. If the dashboard's position
math is not yet a shared module, extract it ONLY if the extraction is trivial and the
dashboard's own output is byte-identical after (green assertions prove only what they
cover); otherwise duplicate minimally and file the consolidation in TECH_DEBT. Do not let
engine refactoring become this build. The hero standfirst (§11) and the position strip
render from ONE computation — a single engine call, two render targets; the hero never
computes independently.

## v1 §4 · Zone taxonomy

**Phase 0 check first:** does the site already define position bands? Discount, or Premium?
is the likely source; the Heatmap second. If an existing taxonomy is found, ADOPT it — one
site, one zone vocabulary — and report any tension between it and the default below.

**PHASE 0 ANSWER — a taxonomy exists; the default below is STRUCK (ratified 2026-08-28).**
The source is not Discount, or Premium? but `positionLabel()` in
`shared/power-law-data.js` — **six bands on normalized log-space channel position** (0 = the
0.42× floor, 1 = the 3× upper band), plus three sub-floor gradings, consumed by the
dashboard, the ribbon, WODN, How Much Cash and Your Deployment Plan. **It is canon; the
Rundown adopts it unchanged.** Full table and the reported tensions: `RUNDOWN_PHASE0_REPORT.md`
§12.2, and §16 below. The five-band proposal that follows is kept only as the record of what
was proposed — **its edges differ from canon (0.5×/0.8× vs. 0.60×/0.85×), so building to it
would have made every row's sample set disagree with WODN's for the same position.**

~~**Default proposal if none exists [JM-5]:**~~ **STRUCK — five bands on the trend multiple —**
- **< 0.5× — "Deep Below Trend"**
- **0.5–0.8× — "Below Trend"**
- **0.8–1.25× — "Near Trend"**
- **1.25–2.0× — "Above Trend"**
- **≥ 2.0× — "Far Above Trend"**

Rules regardless of source: names are descriptive position-states, never action-states —
no verbs, no "accumulation/euphoria/danger," nothing the rainbow chart would say. The
palette must not encode buy/sell semantics: no green-below/red-above; use house-neutral
accents and the luminance gate. Zone edges are analytical choices and therefore subject to
the sensitivity gate (§10). ~~"Independent visit" needs a stated definition (proposal: a
visit ends when price closes outside the band for 30+ consecutive days; Phase 0 may
propose better from the data — report it).~~ **RESOLVED — the site already defines it, and
the 30-day proposal is STRUCK (ratified 2026-08-28).** `discount-or-premium.js` builds
episodes with a **~100-day gap rule**: a gap greater than ~100 days between qualifying
samples starts a new episode. The Rundown adopts it, so the two pages cannot publish
different visit counts for the same history. The 30-day proposal was not merely
unnecessary but wrong against this data — `PL_DATA` is a ~12-day grid whose gaps *inside* a
single continuous episode reach 96 days, so a 30-day rule would have split one real visit
into four.

## v1 §5 · The decision rows

**Row anatomy — every row has six parts, no exceptions:**
1. *The question*, as the reader carries it ("I have new capital — does deploying now or
   waiting tend to work out better from positions like this?").
2. *What the record shows from this zone:* N stated, the distribution shown (an outcome
   strip — compact range/dot visualization of the historical outcomes), the spread always
   visible, never a median alone. ~~Copy pattern: "From the N prior visits to this zone,
   deployed lump sums beat waiting over the following 12 months in X of N cases; the
   spread ran from …% to …%."~~ **CORRECTED 2026-08-28 — this pattern does not match the
   engine.** `bandMetrics()` uses a **two-year** window (`WAIT_CAP`) and measures **coins
   acquired** (`ratio = p0 / waitPrice`), not a 12-month percentage return. Rows must adopt
   the engine's actual window and unit or their numbers will not reproduce on the source
   page. **And where N < 3 the distribution form is banned outright** — see §16's case-study
   treatment, which is how R1 actually publishes.
3. *The counter-case, named:* the visits where it went the other way, and why, in a
   sentence ("the exception entered the zone in [period] and kept falling for …").
   **AMENDED 2026-08-28 — the unanimous-record case.** Phase 0 found that at today's
   position the record is one-sided (waiting beat deploying in 0 of 26 samples), so there
   is no counter-case to name and the "no exceptions" rule would otherwise cut a true row.
   **Where the in-zone record is unanimous, the counter-case is the thinness itself plus
   the unsampled scenario** — for R1 that is sub-floor continuation — cross-linked to
   "what would break this" (§8). This is not a weaker counter-case; it is the honest one.
   **One sentence is mandatory in that construction:** the engine **clamps sub-floor
   positions to the floor for entry matching** (`matchPos()` in `wait-or-deploy-now.js`),
   so the record holds **no example of the floor failing** — and that absence is *risk, not
   evidence*. A row that reports unanimity without that sentence is misreporting a
   limitation of the sample as a property of the world.
4. *The route:* one link into the source tool, preconfigured with the current position,
   labeled as exploration ("run this with your own numbers"), never as confirmation.
5. *Sensitivity status* (build-time; §10).
6. *Sources:* the source tool + data provenance per house convention.

**SUPERSEDED BY §16 (ratified 2026-08-28).** Phase 0 found that R2's ground is owned
outright by Your Deployment Plan, and that Disciplined Rebalancing, Discount or Premium and
the Stress Test contain **zero position-conditioning code** — so R4, R5 and R6 cannot be
computed from an existing engine and fail this section's own feasibility rule. **R2, R4, R5
and R6 are cut; R1, R3 and a reduced R7 survive.** R6 therefore cuts itself on feasibility
before its register question is reached, which discharges the "JM decides in/out at Phase 0"
line below. The table that follows is kept as the record of what was proposed.

~~**Proposed v1 row set [JM-4]:**~~ **SUPERSEDED — see §16:**

| Row | Question | Source engine (Phase 0 verifies feasibility + slug) |
|---|---|---|
| R1 | Deploy new capital now, or wait? | Wait, or Deploy Now? |
| R2 | Lump sum, or ladder in? | Lump Sum or Ladder In |
| R3 | How much cash to hold against the position? | How Much Cash |
| R4 | Would rebalancing bands be anywhere near triggering from here? | Disciplined Rebalancing |
| R5 | What has starting retirement from this zone meant for sequence risk? | Retirement flagship + Stress Test |
| R6 | What has selling from this zone meant? | Discount or Premium + the DR sell-band logic |

**R6 is the sensitive row** and the one to cut if the register review wobbles. It is
proposed IN because it is the row readers most need honesty on — selling from deep
discounts is where the record is most one-sided — but its copy must carry the legitimate
reasons people sell (need, risk reduction, plan adherence) at full weight, never framed as
mistakes. JM decides in/out at Phase 0 report.

**Step 3 rows:**
- **R7 — REDUCED 2026-08-28 to depth-and-frequency.** Duration is not computed by any
  shipped engine, so the "duration distributions" half is cut rather than approximated.
  What ships computes from `bandMetrics()` — `ddProb` (share of entries that saw a ≥20%
  drawdown within two years), `ddDepth` (median depth) and `neverFell` — all conditioned on
  position and **all already rendered on WODN** (`wdDdProb` / `wdDdDepth`), so every figure
  is reproducible on a live source page today. The Stress Test remains the route, as a
  scenario tool, but is **not** the source of these figures. Original spec follows.
- ~~R7 — *The drawdown record from this zone:*~~ depth and duration distributions of what
  followed entries into this zone; the worst case named, not averaged away; route into the
  Stress Test preconfigured.
- Holding-through-it paragraph: brief, register-canon, routes to the Stress Test and the
  retirement family's drawdown content. Do NOT import Playbook method claims (the 24-hour
  pause, plan-field mechanics, commitment-device framing) — the Playbook's provenance
  rules govern those and they are advisor-context claims; this page stays with the record.

**Row feasibility rule:** a row ships only if it computes from an existing engine and every
number is reproducible on the source page. Rows failing Phase 0 feasibility are reported
with what they'd need — not approximated, not built on new logic.

**Overlap rule:** Phase 0 reads `/your-deployment-plan` (slug unverified — resolve in
repo), Discount or Premium, and the Heatmap before the row set is final. If Your
Deployment Plan already owns R1/R2/R3 ground, the Phase 0 report proposes the split
(likely: the Rundown conditions on position and routes; the Deployment Plan owns the plan
mechanics) rather than duplicating. Findings, not fixes.

## v1 §6 · What this position does not change

One short block, load-bearing for the register: some decisions are position-insensitive by
design, and the page says so. Allocation sizing to tolerance and horizon (route: the
sizer); custody and security; the decision to understand the asset before allocating at
all (route: the Power Law page / start-here surface). This section is the page's own
defense against a signal-service reading — it demonstrates the page knows the difference
between what position informs and what it doesn't.

## v1 §7 · The premise gate (Step 1) — draft copy

Draft, for placement; JM's register pass may tighten:

> Everything on this page is conditional, and the condition comes first. The rows below
> read bitcoin's current position in its long-run power law channel and show what the
> historical record has said from positions like it. If the power law does not hold, none
> of this means anything. The model, its fit, and what would break it are examined on
> [the Power Law page] — if you haven't made that examination, it comes before this page,
> not after. If you've made it and rejected the model, this page has nothing for you, and
> that is the page working as designed: a map drawn on a projection you reject is not
> your map. If you accept it, hold it loosely anyway — the record below includes the
> times the pattern bent, and the section at the bottom names what would break it.

## v1 §8 · What would break this

Model-concentration statement (hurdle-rate precedent): single model, every row — the most
power-law-dependent page on the site, and it says so. Contents: the smooth-trend vs.
realized-path caveat; the floor-breach criterion referenced from the Power Law page's
canonical statement (link, don't restate — one canonical home per claim); breaks run in
both directions. When the rolling out-of-sample exhibit ships, it slots here as the
evidence link — placeholder rule: no dead links, the reference is added at that exhibit's
ship, not before.

## v1 §9 · Register and compliance requirements

- The word is *map*, never *recommendation*. Imperative voice banned; second-person
  directives banned; the reader always the decider.
- Banned-words sweep per STYLE_GUIDE §11 (Claude Code holds the live list) plus
  page-specific bans: "signal," "buy zone," "opportunity," "discount to capture,"
  "time to," "should" directed at the reader.
- Every historical claim carries its N and its spread. Zones with N < 3 prior visits show
  the visits individually — no distribution statistics on two data points.
- Counter-case mandatory in every row (§5 anatomy, part 3).
- No user inputs in v1 (§1) — the structural guarantee that nothing on the page is
  individualized. Nothing position-keyed addresses the reader's holdings, because the
  page never knows them.
- Not-advice framing per SITE_GUIDE §13 register canon, house placement.
- **Ship gate [JM-6]:** build to done, ship UNLISTED (no nav, no sitemap, noindex) for
  JM's register review; counsel pass at JM's election before public listing. Counsel-
  attention tier was set at funds-mechanics level in the backlog entry; the no-inputs v1
  design argues the lower tier, but that judgment is JM's, not the build's.
- FAQ block (spec + two draft answers):
  - "Is this page telling me what to do?" — draft: "No. Every row shows what the
    historical record says about a decision from positions like today's — how often each
    path worked out, by how much, and the times it didn't. Which path fits your
    situation, horizon, and tolerance is yours to decide; the tools linked in each row
    exist so you can test it with your own numbers."
  - "How is this different from technical analysis?" — draft: "Technical analysis reads
    price against its own recent pattern. This page measures price against an
    independent yardstick — the long-run power law trend — the way equity investors
    measure price against earnings. The yardstick moves slowly, is fitted on the whole
    record, and is falsifiable: the Power Law page states what would break it. Whether
    that yardstick deserves your trust is examined there, not assumed here."
  - Spec'd, answers drafted at build: "Why do some rows show only three or four past
    cases?" · "Why does the page say it has nothing for me if I reject the power law?" ·
    "Why is there nothing here about borrowing against bitcoin?"
- OG card per SITE_GUIDE §52/§52.1 including the watchlist check.

## v1 §10 · Data, engines, and the sensitivity gate

- Live-compute-only; no new external data dependencies beyond what the dashboard already
  uses; zero manual refresh burden (hard fence, §1).
- **Consistency acceptance test:** every number on the page reproducible by its source
  tool, to the displayed precision. The row → engine mapping in §5 is the test matrix.
- **Sensitivity gate (build-time analysis, not on-page decoration):** for each row,
  recompute the headline result with zone edges perturbed ±10%. If the row's qualitative
  reading flips (e.g., "beat waiting in most cases" stops being true), the row does not
  ship, and the Phase 0/2 report says so with the numbers. Rows that survive may carry a
  one-line note only where the margin is thin. This is the "rows that fail perturbation
  don't ship" rule from the backlog entry, operationalized.
- Trend fit: one trend, fitted on everything, identical to the site's canonical fit. No
  per-page refits, no era-filtered fits, anywhere in v1.

## v1 §11 · Title, slug, nav, dashboard wiring

- **Working title "The Rundown" [JM-1 — ruled, with amendment].** Ship title: **The
  Rundown**, slug `/the-rundown`. The static subtitle is replaced by the live standfirst
  below.
- **The live hero [ruled 2026-08-28, JM]:** the H1 stays static; the standfirst under it
  carries the live position. Pattern: "Bitcoin is at **0.43×** its long-run trend today.
  Here is what positions like this one have meant — decision by decision." Rules:
  - The number is client-computed from the same engine call as the position strip (§3)
    and matches the strip and the dashboard to the digit.
  - The dynamic element is the *descriptive position only* — the multiple, nothing else.
    No zone adjectives in the hero, no action flavor; the dashboard's "a read of where
    things stand" precedent is the register cover for liveness.
  - No-JS / pre-hydration fallback is the static sentence WITHOUT a number ("Bitcoin's
    position in its long-run channel — and what positions like it have meant, decision
    by decision"). Never render a placeholder or loading numeral in the hero; the text
    swap must not shift layout (mobile CLS check).
  - The HTML `<title>` and meta description stay static and register-canonical. The OG
    card carries NO live figure — §52's pre-rendered discipline; a baked number goes
    stale in scraper caches the day it ships.
  - Kinship, for the record: this hero is the page-local seed of the site-wide
    channel-position chip (the dashboard entry's successor item). If that chip ships
    later, hero and chip share the component; do not build the chip in this project.
- **Nav [JM-2]:** recommended The Numbers group. No new top-level item (919px nav-capacity
  constraint stands; that project decides top-level additions, not this build).
- **Dashboard wiring [JM-3]:** one chip added to the dashboard's "Take your position into
  a tool" row, routing to the Rundown. This touches the anchor page, so it ships only on
  JM's explicit yes, as its own small commit, after the Rundown is public.
- No family strip — the Rundown is a spoke off the dashboard, not a family member. The
  consider/don't-consider framing never migrates onto the dashboard itself.

## v1 §12 · Build phases

**Phase 0 — COMPLETE (report filed 2026-08-28, ratified 2026-08-28).** Output:
`RUNDOWN_PHASE0_REPORT.md`. All six items below were run; findings and deviations are in
§16. **Phase 1 begins only after the ratification PR merges** — not on ratification alone.
The gate as originally written follows.

~~**Phase 0 — verify and report. No page code before the report is answered.**~~
1. Overlap reads: Your Deployment Plan, Discount or Premium, the Heatmap. Report: row-set
   implications, proposed final row set, any taxonomy conflict.
2. Zone taxonomy: existing vocabulary or the §4 default; the independent-visit definition
   proposed from the data.
3. Engine feasibility per row (can from-zone conditioning be computed from the existing
   engine, with numbers matching the source page?). Per-row verdict.
4. Position-engine reuse path per §3.
5. Zone-edge sensitivity first pass on R1 (the flagship row) as proof of method.
6. Slug verification for every route target.
Report format: findings-not-fixes, one document, ending in the proposed final row set and
any deviations from this spec. JM ratifies; then build.

**Phase 1** — page shell, position strip, zone engine, premise gate.
**Phase 2** — rows, each landing with its consistency test green and its sensitivity
verdict recorded.
**Phase 3** — Step-3 block, not-changed block, what-would-break-this, FAQ, Related.
**Phase 4** — register pass (banned words, imperative grep), luminance gate, OG + §52.1
watchlist, mobile pass, NEW_PAGE_CHECKLIST, unlisted ship for JM review.

Chart typography: the 12/13/12 house-default ruling is pending JM's word. v1's only
chart-like elements are the outcome strips; build them to current site defaults unless the
ruling lands first, and let the eventual sweep catch them — do not couple this build to
that ruling [JM-7].

## v1 §13 · Acceptance criteria

1. Zero user inputs anywhere on the page.
2. Every number reproducible on its source tool's page (test matrix = §5 table) — **except
   numbers in the §16.2a exception class, which must satisfy all four of its conditions,
   appear by name in that section's exception register, and still pass a re-derivation from
   `PL_DATA` to the displayed precision. The exception is from source-tool reproduction,
   never from verification. The register holds one entry in v1; a number not named there
   has no exception.**
2a. **Method consistency within a row (§16.2a):** all horizon figures in a case study
   compute by the same entry-anchored lookup — no mixing of `bandMetrics()` outputs and
   lookups in one narrative. The row states that it answers a different question than
   WODN's pooled view, and the WODN route is labelled as the pooled exploration, **not** as
   verification.
3. Every historical claim shows N; every distribution shows spread; no N<3 statistics —
   **and where N<3, the case-study treatment of §16.2a replaces the distribution.**
4. Every row carries its counter-case — **or, where the in-zone record is unanimous, the
   §5 anatomy-3 substitute (the thinness plus the unsampled scenario), including the
   mandatory sub-floor-clamp sentence.** The two framing blocks of §16.3 are not rows and
   this criterion does not apply to them.
5. No banned words (§11 live list + §9 page-specific list); imperative grep clean.
6. No additions to MONTHLY_REFRESH_CHECKLIST; no new external data dependencies.
7. Sensitivity gate run per row; failing rows absent; report filed.
8. Premise gate present with off-ramp and Power Law route.
9. "What this position does not change" present.
10. Luminance gate, OG §52/§52.1 + watchlist, mobile pass, NEW_PAGE_CHECKLIST complete.
11. Ships unlisted; public listing only on JM's word.
12. Dashboard untouched except the [JM-3] chip, which is its own later commit.
13. Hero standfirst number identical to the position strip and the dashboard at render;
    no-JS fallback carries no number; no placeholder or loading numerals ever visible;
    the hero text swap passes the mobile layout-shift check.
14. HTML `<title>` and meta description static; OG card contains no live figure.

## v1 §14 · The forward ledger (not this build)

- **v1.1 — assumption options (era filters).** Gated on BOTH exhibits shipping. Governed
  by the five design rules in the backlog entry: bias-vs-variance stated on-page; options
  trim expectations, never soften the stress; the yardstick never toggles; no option
  without its exhibit; the toggle states its wager.
- **v1.1 — zone-event log.** The "entered/left" record as a fuller display (the position
  strip's transition line is the v1 seed).
- **v2 — sticky inputs / personalization.** Gated on the GA4 retention baseline and the
  Gilger 20/80 test. Raises the counsel tier; assume a counsel pass before any v2 ship.
- **iOS widget/notification kinship** stays in the app research entry.

## v1 §15 · Rulings — 2026-08-28, JM (all eight decided)

- **[JM-1] Title/slug — RULED, with amendment:** The Rundown, `/the-rundown`; static
  subtitle replaced by the live-position standfirst ("bitcoin at 0.43× the channel"
  pattern) so the page reads as alive. Full spec and fallbacks in §11.
- **[JM-2] Nav — RULED:** The Numbers group; no top-level item.
- **[JM-3] Dashboard chip — RULED:** yes; its own commit, after public ship.
- **[JM-4] Row set — RULED:** R1–R7 ratified; R6 (selling) IN with the counter-case
  discipline as specified; first candidate to cut if the register review wobbles.
- **[JM-5] Zone taxonomy — RULED:** existing site vocabulary wins if Phase 0 finds one;
  otherwise the five-band default and names stand as specified.
- **[JM-6] Ship gate — RULED:** build to done → unlisted → JM register review → public;
  counsel pass at JM's election for v1; assumed mandatory before any v2 personalization.
- **[JM-7] Chart typography — RULED:** build outcome strips to current site defaults;
  the 12/13/12 sweep catches them if that ruling lands.
- **[JM-8] Exhibits — RULED:** backlog Entries 3–4 commissioned in the same Claude Code
  batch as parallel lanes; they gate v1.1's toggles, not v1.

The build is unblocked. The next artifact is the Phase 0 report.

## v1 §16 · Phase 0 ratified — the v1 scope reframe (JM, 2026-08-28)

_This section is the authoritative statement of v1 scope. Where it conflicts with §1, §4,
§5, §10 or §12, this section governs; those sections are marked in place and kept as the
record of the reasoning. The premise gate (§7), the live hero (§11), the row anatomy (§5,
as amended), and every gate in §9, §10 and §13 are unchanged._

### v1 §16.1 · Ratified as found

1. **Zone taxonomy:** adopt `positionLabel`'s six bands as canon (JM-5 as ruled). §4's
   five-band default is struck.
2. **Independent visit:** adopt the ~100-day episode gap. The 30-day proposal is struck.
3. **Row cuts stand** as reported — R2 on overlap, R4/R5/R6 on engine feasibility. The
   survivors stand. **No new engines in v1.**
4. **Exhibits:** placement as the Phase 0 report proposes — both as sections on the Power
   Law page.
5. **Footer** "free, open, verifiable" stands as-is (a site-wide item, recorded here only
   because the Phase 0 pass raised it).

### v1 §16.2 · The scope ruling — v1 reframes rather than shrinks

Phase 0 reduced the row set from seven to four, which reads as a diminished page only if
the page is conceived as a matrix of decisions. It is not. **The organizing fact of v1 is
that bitcoin is in the third floor visit of the record, and it is happening now.** That is
not a residue left after the cuts; it is a stronger page than the seven-row version, because
it is the one thing the site can say from this position that nothing else says.

The reframe has three parts, and all three are requirements, not options.

**(a) R1 publishes as case studies, not as a distribution.** §9's N<3 rule fires at today's
position: the 26 samples the engine returns are **two independent visits** under the
100-day rule (Aug 2015 – Oct 2016, 21 samples; Nov 2022 – Jan 2023, 5 samples). So R1 does
not show a distribution and does not show "0 of 26". It **narrates each prior visit in
full** — entry, depth, duration, and the deploy outcomes at **1, 2 and 4 years** — and then
shows **the current visit descriptively, in progress**, with no outcome claimed because
none exists yet. Three visits on the page: two closed, one open. The reader sees the record
as a record, which is what two data points can honestly support.

**The `WAIT_CAP` exception — accepted and hardened into a rule (JM, 2026-08-28).** The
1/2/4-year outcome horizons are **wider than `bandMetrics()`'s two-year `WAIT_CAP`**, so the
4-year figure does not exist in any shipped engine. It is a direct entry-anchored lookup
against `PL_DATA` — not a new conditioning engine, so it sits inside the no-new-engines
fence — but it does not reproduce on WODN. Rather than wave it through, it defines an
exception class with four conditions, ALL of which must hold:

> **(a)** No shipped tool computes the number.
> **(b)** The derivation is **plain arithmetic on canonical data** — no parameters, no
> modeling. (A number that needs a fitted parameter or a modeling choice is not in this
> class and does not ship.)
> **(c)** The method is **stated on-page**, in the row's sources line (§5 anatomy part 6).
> **(d)** The consistency test (§10) **applies to the stated method exactly** — re-derive
> from `PL_DATA` and match to the displayed precision. The exception is from
> *source-tool reproduction*, never from verification.

**The exception register. v1 holds exactly one entry: this one** — the entry-anchored
horizon lookup for R1's case studies. Any future exception is added here by name, or it is
not an exception. An empty-looking register is the point: it is a list, so it can be seen
to be short.

**Method consistency within a row — the rule that matters more than the exception.** All of
a case study's horizon figures — **1y, 2y and 4y** — compute by the **same entry-anchored
lookup**. Never mix `bandMetrics()` outputs and lookups inside one narrative, *even where
the 1y and 2y figures could legitimately come from WODN.* A visit narrated from its own
entry date and a pooled band statistic are answers to different questions, and splicing
them would produce a row whose numbers are individually defensible and collectively
incoherent.

Two consequences the build must carry on-page:

- **The row states the difference in question**, in its own words: *WODN pools every
  in-zone sample; this narrates each visit from its entry date.*
- **The WODN route is labelled as the pooled exploration, not as verification.** It is
  where the reader goes to see the whole band; it is not the place their eye is sent to
  check these figures, because it will not match them and should not.

**(b) The counter-case, where the record is unanimous, is the thinness plus the unsampled
scenario.** Specified in full at §5 anatomy part 3 as amended. The mandatory sentence about
the engine clamping sub-floor positions is load-bearing and is not a caveat: the record
holds no example of the floor failing, and **that absence is risk, not evidence.** It
cross-links to §8, "what would break this," which is where the sub-floor-continuation
scenario belongs.

**(c) The page states its own roadmap.** The decisions that are **not** yet
position-conditioned anywhere on the site — **rebalancing, retirement timing, selling** —
are **named as absent**, with one line each on what would have to exist for them to appear.
They accrete as engines ship. This is the section that makes the reduced row set legible as
design rather than as omission, and it is also the honest statement of what the site can
and cannot currently do.

**The governing phrase, and the test every future addition is measured against: a map,
growing — never a matrix, padded.** A row is added when an engine exists to compute it from
and its numbers reproduce on a source page. Never to fill the grid.

### v1 §16.3 · The v1 row set, and the two blocks that frame it

**R0 does not exist as a row — the wrapper comes off (JM, 2026-08-28).** What was proposed
as R0 splits into two blocks that bracket the decision rows. **The content is unchanged from
what R0 carried; placement is the only change**, and neither block is subject to the §5
six-part anatomy.

**(a) The opening block of Step 2 — the third floor visit.** The organizing fact, with the
prior two visits named by **date, depth and duration**. It sits **immediately after the
premise gate and before the first decision row**, so the historical framing **inherits the
gate's conditionality** instead of standing as an independent claim — the whole reason it is
a framing block rather than the page's lede. Computed from `positionLabel` + the 100-day
episode count. Routes: The Power Law · The Bitcoin Floor.

**(b) The coda of Step 2 — the roadmap.** After the last decision row: rebalancing,
retirement timing and selling **named as absent**, because nothing on the site yet
conditions them on position, with one line each on what would have to exist. They accrete as
engines ship. This is what makes the reduced row set legible as design rather than omission.
**A map, growing — never a matrix, padded.**

**The rows themselves:**

| Row | Question | Engine | Route |
|---|---|---|---|
| **R1** | Deploy new capital now, or wait for a lower entry? | `bandMetrics()` — case studies per 16.2(a) | Wait, or Deploy Now? → Your Deployment Plan for *how* |
| **R3** | How much cash to hold against the position? | How Much Cash via `ChannelEntries` | How Much Cash |
| **R7** | What has followed entries at this position — how often, how deep? | `bandMetrics()` `ddProb` / `ddDepth` / `neverFell` | Stress Test (as a scenario tool, not as the source) |

Plus the §6 "what this position does not change" block, which the reframe makes more
load-bearing rather than less.

**Cut, with the reason on the record:** R2 (Your Deployment Plan owns the plan mechanics and
is today-anchored by design); R4, R5, R6 (no position-conditioning engine exists — R4 would
additionally need user inputs, which v1 forbids).

**So Step 2 reads: framing block → R1 → R3 → coda.** Two rows, bracketed. The page is a
position read that opens with the record it is standing in and closes by naming what it
cannot yet say.

### v1 §16.4 · Carried forward into the build

- **`matchPos()` is the highest-risk line in the reuse path.** WODN clamps sub-floor
  positions to zero for entry matching while leaving the display sub-floor. Bitcoin is
  sub-floor on today's live-trend reading, so the Rundown must apply the identical clamp or
  its numbers diverge from WODN's on day one.
- **The zone label is knife-edge today** — position sits within ±0.01 of the floor
  boundary, so the label can flip between "near the floor" and "just below the floor" on a
  ~1% price move. The page needs an answer for the day it flips; the case-study framing of
  16.2(a) largely supplies one, because a narrated visit does not stop being the third
  visit when the label moves.
- **A second position vocabulary exists site-wide** — Discount-or-Premium's
  discount/at-trend/premium with a 0.95–1.05× dead band, against `positionLabel`'s at-trend
  band of 0.85–1.20×. Not resolved here; not blocking v1, which uses `positionLabel` only.
  Recorded so the Rundown is not blamed for the disagreement when it surfaces.
- **The 3× upper band is a stipulated constant, not an empirical maximum** (record maximum
  14.01×, June 2011; 8.1% of samples above the band). Nothing in v1 should describe it as a
  ceiling. A DATA_AUDIT row is proposed in the Phase 0 report §B.
