# Retirement family — coherence read, 2026-09-23

The deliberate one-sitting read that `PAGE_IDEAS_BACKLOG` → *Family coherence pass* called for, run four weeks after Compare and the hub shipped. **Audit only: nothing on the five surfaces was edited.** Findings are filed below and cross-filed to `TECH_DEBT` (defects, mechanical copy) or `PAGE_IDEAS_BACKLOG` (small builds and rulings), per the entry's method.

**Surfaces read:** `/bitcoin-retirement` (hub) · `/the-bitcoin-retirement` (Build) · `/bitcoin-escape-velocity` (Size) · `/compare-retirement-plans` (Choose) · `/the-bitcoin-retirement-stress-test` (Stress).

**How it was read.** Against production at `0bc5911`, rendered as a reader meets it: every tab's text, every tooltip, every link between family pages as rendered after an input change, and every receiver tested by loading it with a distinctive scenario in the URL (`stack=2.37&retire=2041&income=137000&years=27`). Verdicts were compared on one plan across all four tools, then the disagreement was sized on an 80-plan grid through `window.RetirementEngine` itself. Nothing below rests on reading source alone; each claim was measured on the live page.

**What held.** The four-question fences in `COMPARE_RETIREMENT_PLANS_DESIGN §1` held once built: each page owns its question and refuses the others, Compare's delta reads as a chosen alternative rather than EV's unit sensitivities, and the uncontrollable lives only on the Stress Test. The shared engine agrees with itself: EV, Compare and the Stress Test's no-crash path tell one story about the same plan. What follows is where the family does not.

---

## F1 — The flagship calls a plan "escape velocity" that the other three pages say is shrinking. HIGH · defect → `TECH_DEBT`

One plan — **1 BTC, retire 2035, $100K/yr in today's dollars, 30 years**, same inflation (6.5%) and growth path on every page:

| Page | What it tells the reader |
|---|---|
| The Bitcoin Retirement | "Projected years stack lasts **∞ — escape velocity**" · "Stack grows 1.5× in real terms over the window — **comfortably above escape velocity**." |
| Bitcoin Escape Velocity | "Survives your 30-year window, but **growth stops covering your withdrawals from 2057** — and it is still falling at 2065. On pace to deplete around 2085." |
| Compare Retirement Plans | "this plan **never crosses the threshold** — growth never outruns the draw — but it outlives the horizon: it turns over in 2057." |
| Stress Test (no-crash path) | "the same plan lasts the full 30, to 2065." |

The reader reaches the flagship's reading **from Compare's own link** ("Open Plan A in the full retirement calculator →"), so the contradiction is one click apart.

**Cause: two definitions of the same word.** The shared engine's `computeVerdict` (EV, Compare) calls it escape only when the stack's real value is still rising through the end of the horizon, and `shrink` when it survives but is falling. The flagship's `computeEscapeVelocity` / `updateSustainability` print "∞ — escape velocity" for **any plan that does not deplete inside the window**, and grade it by an end-to-start ratio. The flagship's own hero defines the term the engine's way — *"the point where the stack's growth outruns your withdrawals"* — and then does not implement that definition.

**A second fault inside the flagship's ratio:** "grows 1.5× in real terms over the window" takes `firstPoint` = the first positive point on the projection, which is **today**, not the retirement year. So "over the window" means "from now", and a plan can read as growing across a retirement in which it only ever shrinks.

**Size.** On an 80-plan grid (stack 0.25–3 BTC × retire 2028–2040 × $50K–150K, 30 years, trend, 6.5%), **6 plans — 1 in 7 of those that don't deplete — get "escape velocity" on the flagship and `shrink` everywhere else.** The EV and Compare default plan is one of them. The flagship draws 30% of the site's users.

**Why nothing caught it.** PR #93 put all four pages on one engine and the parity assertions pass. They assert the **arithmetic**; the flagship's verdict is a separate classifier layered on top, which no assertion covers. It is the same lesson `TECH_DEBT` §1 already records ("a green assertion is evidence about what it covers"), in a new place.

**Shape of the fix (for its own PR, not made here):** the flagship classifies from `RetirementEngine.computeVerdict`, so "escape velocity" means one thing site-wide; its `shrink` state gets its own wording ("lasts the window — but shrinking from 2057"); the spectrum detail measures from the retirement year. **Needs JM's copy ruling on the shrink wording**, because this changes what the most-visited page tells a reader about their plan, in the less flattering direction for a real share of plans. That is the correct direction.

---

## F2 — "Your plan travels between them" is true for two of the four tools. HIGH · small build → `PAGE_IDEAS_BACKLOG`

The claim appears on all five family surfaces (the strip's foot: *"the links each page offers carry the plan you are looking at, so you rarely re-type a number"*), the hub subtitle and the homepage lede. Measured link by link:

| From | Carries the plan to | Carries nothing to |
|---|---|---|
| **The Bitcoin Retirement** (Build) | — | Stress Test (its only body link), EV, Compare |
| Bitcoin Escape Velocity | the flagship | — |
| Compare Retirement Plans | the flagship (A and B), EV, Stress Test | — |
| **Stress Test** | — | the flagship (its only family link) |

The strip's own links are plain by design (`SITE_GUIDE §53.1`: "the strip is coherence, a page's own carry links are state"), and browser storage does not bridge them: a plan set on any page was lost on every plain strip hop, tested for all twelve directed pairs.

**The gap sits at the funnel's entrance.** The flagship's link sender (`TEASER_SELECTORS`) targets only Borrowing Against Your Stack, so a reader who builds a plan on the first page carries nothing into Size, Choose or Stress.

**The receivers are already built.** EV, Compare (as Plan A) and the Stress Test all adopted `stack`/`retire`/`income`/`years` when loaded with them. Closing the gap is sender work only: add the family's links to the flagship's `TEASER_SELECTORS`, and give the Stress Test the same sender. Until that ships, the strip's foot overstates.

---

## F3 — Compare silently replaces a carried retirement length with 30 years, and passes 30 on. MEDIUM → `PAGE_IDEAS_BACKLOG`

Arriving with `years=27`, Compare computes with its fixed 30-year horizon (by design: `COMPARE_RETIREMENT_PLANS_DESIGN §3`, horizon is a shared assumption, and the page does say "30 years horizon"). But it does not say the reader's 27 was replaced, and every outbound link then carries `years=30`. So the Stress Test, reached through Compare, runs a longer retirement than the one the reader set upstream. **Options for JM:** read `years` as the shared horizon when it arrives; or keep 30 and say so on carry-in ("your 27-year horizon is shown here at the page's 30"), and forward the reader's original value.

---

## F4 — The Stress Test still speaks the two-page era. MEDIUM · copy → `TECH_DEBT`

Written when the family was The Bitcoin Retirement plus its stress test:

- The part-note tag under the hero, **"Part 2 of 2"** (`.st-partnote-tag`); intro "think of it as Part 1. This is Part 2"; inputs panel "That page is the natural Part 1 to this Part 2"; related card "The Bitcoin Retirement — **Part 1.** …".
- Related card for EV: "**The third page of the family**, on the same engine." EV is the **second** question (Size); the ordinal is its ship order, not its place in the funnel.
- The flagship's related card for the Stress Test: "**The sober counterpart.**" — two-page framing again.

The family now reads Build → Size → Choose → Stress everywhere else, including the strip on the same page. The tool-hero sweep (2026-08-08, `433e064`) rewrote the Stress Test's hero out of sibling framing; these are the part-note, body and related-card instances it was not scoped to reach.

---

## F5 — One input, four names; one word, two quantities. MEDIUM · ruling → `PAGE_IDEAS_BACKLOG`

**The spending input** is the same number carried under the same URL param (`income`), but it is labelled *"Target income"* (flagship), *"Target annual income (USD)"* (Stress Test), and *"Annual withdrawal"* (EV, Compare), with *draw* / *withdrawals* / *spending* / *income* used interchangeably in the prose of all four. A reader who follows a carry link sees the number arrive under a different name.

**"Stack"** means two different quantities: today's holdings, grown by monthly buying (flagship, Stress Test, labelled "Bitcoin stack"), versus the stack you retire with (EV, Compare, labelled "Stack at retirement"). The carry itself is safe: a carried stack lands with monthly buying at 0, verified on a returning browser that had set $500/mo earlier. But the receiving page does not say that the number it just received is being read as today's holdings.

**Ask:** one family label for spending (the suggestion is "Annual withdrawal", which already names two of the four), and one sentence on the flagship and Stress Test when a carried stack arrives.

---

## F6 — Smaller drift. LOW → `TECH_DEBT`

- **Price-basis naming.** The same default path is "reverts to trend" (flagship, EV) and "Power Law trend" (Compare).
- **Chart units.** The Stress Test's chart is in nominal dollars; the EV and Compare charts are in today's dollars. A reader moving Compare → Stress Test sees the same plan's curve on a different scale without a note.
- **Tool names.** Compare's `<title>` and H1 read "Compare **Bitcoin** Retirement Plans", while nav, strip and hub say "Compare Retirement Plans"; the Stress Test is "Retirement Stress Test" on the hub cards and in Compare's body, and "The Bitcoin Retirement Stress Test" elsewhere. Possibly deliberate for search; worth one ruling.
- **Related coverage.** Compare is absent from the related strips of the flagship, EV and the Stress Test; it is reachable from them only through the family strip.

## F7 — Overlap: acceptable as it stands. NOTE

The warrant *"its implied growth rate declines with time, which is why [the answer] is checked across the whole horizon"* appears near-verbatim on the hub, EV and Compare, and in two related cards. That is repetition of the family's shared premise rather than three explanations competing, and it is short; no consolidation is proposed. The one surface that does *not* carry it is the flagship, which is also the one surface that does not check across the horizon (F1). Fixing F1 is what makes the repetition true everywhere.

---

## Suggested order

1. **F1** — the only finding where the site tells a reader two different things about their plan. Engine-level; follow `TECH_DEBT` §1's standing recipe (flagship audit-table hash, EV both bases, `stFlexQA`, fresh-tab consoles).
2. **F4** — copy only, cheap, and it removes the most visible sign the family was assembled over time.
3. **F2** — sender work only; makes the family's most repeated promise true.
4. **F3, F5** — rulings, then small edits.
5. **F6** — batch with whichever of the above touches the same files.
