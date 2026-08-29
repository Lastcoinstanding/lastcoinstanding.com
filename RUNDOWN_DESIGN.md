# THE RUNDOWN — DESIGN v1

_2026-08-28. Drafting-chat origin; repo-bound (design docs are repo-tracked). Operationalizes
the PAGE_IDEAS_BACKLOG entry "The Rundown" as captured in PRE_VACATION_PACKAGE_2026-08-28 §3
Entry 1 — that entry is the requirements record; this document is the build spec. Open
decisions for JM are marked [JM-n] inline and collected in §15. Working conventions in
force: hold-and-report; disclosure legitimizes scope-crossing; custody = gate/wiring/
post-merge; green assertions prove only what they cover; SHA-1 in every handback._

_Revision same day: all eight [JM-n] decisions ruled by JM (recorded in §15); the
live-position hero added per JM's amendment to JM-1 (§2, §3, §11, §13)._

_Why v1 can build now despite the exhibits-first sequencing rule: the rule gates the
**era-filter toggles**, not the page. v1 ships with no toggles (full record only), no user
inputs, and no personalization — so it depends on nothing that isn't already live. The two
exhibits (rolling out-of-sample fits; the Narrowing Channel) build in parallel lanes and
gate v1.1, not v1._

---

## 0 · What this page is

One page that reads bitcoin's current position in its long-run power law channel and lays
out, for each major decision a reader might be carrying — deploying, laddering, cash
reserves, rebalancing, retirement timing, selling — what the historical record on this site
says about that decision from a position like today's, routing into the existing tools
preconfigured with the current position. WODN-register throughout: "here is what the data
suggests, based on the history" — clear guidance that stops short of recommendation. The
structural skeleton is the Playbook's three-step arc, self-serve: is this real → what would
it do to my situation → what do we do when it falls.

## 1 · v1 scope fences

**IN:** premise gate with off-ramp; live position strip; zone taxonomy; the decision rows
(§5), each computed from an existing engine; the Step-3 drawdown block; a "what this
position does not change" section; a what-would-break-this section; FAQ block; OG card;
Related block; NEW_PAGE_CHECKLIST in full.

**OUT — hard fences, no exceptions in v1:**
- Era-filter / assumption toggles. Full record only. Toggles are v1.1, gated on BOTH
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

## 2 · Page architecture

Order, top to bottom:
1. Hero: static title, **live standfirst** carrying the current trend multiple (§11, "The
   live hero"), the not-a-recommendation line per SITE_GUIDE §13 register canon.
2. **Position strip** (§3).
3. **Step 1 — Is this real?** The premise gate (§7).
4. **Step 2 — What would it do to my situation?** Decision rows R1–R6 (§5).
5. **Step 3 — What do we do when it falls?** Drawdown block R7 + holding-through-it
   paragraph (§5).
6. **What this position does not change** (§6).
7. **What would break this** (§8).
8. FAQ block (§9).
9. Related block: Bitcoin as Collateral, the Dashboard, the Power Law page, Discount or
   Premium, the Heatmap (final list settled at Phase 0 after overlap reads).

## 3 · The position strip

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

## 4 · Zone taxonomy

**Phase 0 check first:** does the site already define position bands? Discount, or Premium?
is the likely source; the Heatmap second. If an existing taxonomy is found, ADOPT it — one
site, one zone vocabulary — and report any tension between it and the default below.

**Default proposal if none exists [JM-5]:** five bands on the trend multiple —
- **< 0.5× — "Deep Below Trend"**
- **0.5–0.8× — "Below Trend"**
- **0.8–1.25× — "Near Trend"**
- **1.25–2.0× — "Above Trend"**
- **≥ 2.0× — "Far Above Trend"**

Rules regardless of source: names are descriptive position-states, never action-states —
no verbs, no "accumulation/euphoria/danger," nothing the rainbow chart would say. The
palette must not encode buy/sell semantics: no green-below/red-above; use house-neutral
accents and the luminance gate. Zone edges are analytical choices and therefore subject to
the sensitivity gate (§10). "Independent visit" needs a stated definition (proposal: a
visit ends when price closes outside the band for 30+ consecutive days; Phase 0 may
propose better from the data — report it).

## 5 · The decision rows

**Row anatomy — every row has six parts, no exceptions:**
1. *The question*, as the reader carries it ("I have new capital — does deploying now or
   waiting tend to work out better from positions like this?").
2. *What the record shows from this zone:* N stated, the distribution shown (an outcome
   strip — compact range/dot visualization of the historical outcomes), the spread always
   visible, never a median alone. Copy pattern: "From the N prior visits to this zone,
   deployed lump sums beat waiting over the following 12 months in X of N cases; the
   spread ran from …% to …%."
3. *The counter-case, named:* the visits where it went the other way, and why, in a
   sentence ("the exception entered the zone in [period] and kept falling for …").
4. *The route:* one link into the source tool, preconfigured with the current position,
   labeled as exploration ("run this with your own numbers"), never as confirmation.
5. *Sensitivity status* (build-time; §10).
6. *Sources:* the source tool + data provenance per house convention.

**Proposed v1 row set [JM-4]:**

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
- R7 — *The drawdown record from this zone:* depth and duration distributions of what
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

## 6 · What this position does not change

One short block, load-bearing for the register: some decisions are position-insensitive by
design, and the page says so. Allocation sizing to tolerance and horizon (route: the
sizer); custody and security; the decision to understand the asset before allocating at
all (route: the Power Law page / start-here surface). This section is the page's own
defense against a signal-service reading — it demonstrates the page knows the difference
between what position informs and what it doesn't.

## 7 · The premise gate (Step 1) — draft copy

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

## 8 · What would break this

Model-concentration statement (hurdle-rate precedent): single model, every row — the most
power-law-dependent page on the site, and it says so. Contents: the smooth-trend vs.
realized-path caveat; the floor-breach criterion referenced from the Power Law page's
canonical statement (link, don't restate — one canonical home per claim); breaks run in
both directions. When the rolling out-of-sample exhibit ships, it slots here as the
evidence link — placeholder rule: no dead links, the reference is added at that exhibit's
ship, not before.

## 9 · Register and compliance requirements

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

## 10 · Data, engines, and the sensitivity gate

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

## 11 · Title, slug, nav, dashboard wiring

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

## 12 · Build phases

**Phase 0 — verify and report. No page code before the report is answered.**
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

## 13 · Acceptance criteria

1. Zero user inputs anywhere on the page.
2. Every number reproducible on its source tool's page (test matrix = §5 table).
3. Every historical claim shows N; every distribution shows spread; no N<3 statistics.
4. Every row carries its counter-case.
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

## 14 · The forward ledger (not this build)

- **v1.1 — assumption options (era filters).** Gated on BOTH exhibits shipping. Governed
  by the five design rules in the backlog entry: bias-vs-variance stated on-page; options
  trim expectations, never soften the stress; the yardstick never toggles; no option
  without its exhibit; the toggle states its wager.
- **v1.1 — zone-event log.** The "entered/left" record as a fuller display (the position
  strip's transition line is the v1 seed).
- **v2 — sticky inputs / personalization.** Gated on the GA4 retention baseline and the
  Gilger 20/80 test. Raises the counsel tier; assume a counsel pass before any v2 ship.
- **iOS widget/notification kinship** stays in the app research entry.

## 15 · Rulings — 2026-08-28, JM (all eight decided)

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
