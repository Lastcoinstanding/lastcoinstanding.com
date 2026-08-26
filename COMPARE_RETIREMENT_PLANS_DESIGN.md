# Compare Retirement Plans — Design

> ## ⚠️ AMENDMENT 2026-08-26 — THIS DOC IS HISTORICAL FROM HERE
>
> **The page shipped.** `SITE_GUIDE §52` (and `§52.1` for the OG card) is **authoritative for current state**; this file records the design as it stood before the build, and is kept for the reasoning behind decisions rather than as a description of the page.
>
> **§9's four open items were all ratified as recommended:** hero chart **Option 1** (paired balance curves); **delta strip above** the verdict table; **Plan B initialises as Plan A with retirement year +1**; hub slug **`/bitcoin-retirement`** and title **"Plan Your Bitcoin Retirement"**, both as specced.
>
> **Where the as-built diverges from this doc**, all from the JM copy review the same day, all recorded in §52's iteration record:
>
> - **The title is now *Compare Bitcoin Retirement Plans*** — the H1 accent falls on *Bitcoin*. The **slug is frozen** at `/compare-retirement-plans` because namespaced `a_`/`b_` links were already circulating; the general rule that sets is in `STYLE_GUIDE §10.4`.
> - **URL params use the family's own short names** (`a_stack` / `a_retire` / `a_income`), not this doc's provisional `a_year` / `a_wd` — §6 delegated exact naming to build, and `SITE_GUIDE §46` says senders speak the receiver's vocabulary.
> - **A "Ten years in" verdict row** was added after Depletes/holds, anchored at each plan's *own* retirement + 10. Not in this doc; it reads the existing ledger, so it is not new modeling.
> - **A delta-suppression rule** drops the threshold-margin sentence when the plans differ only in stack, because it then restates an input rather than reporting a finding.
> - **Orientation copy** above the columns, a **threshold gloss** at first use linking Escape Velocity, the chart **legend cut to two entries** with the marker meanings moved into the curve tooltip, and the **shared card's prose collapsed** behind expanders.
> - **The engine is a shared module** (`shared/retirement-engine.js`) rather than a fourth in-page copy. §8.2's "extend `evParityQA`" could not be done literally — that function lives inside the EV page's closure — so `crpParityQA` asserts against **golden vectors captured from the deployed EV page**. Repointing the other three family pages at the module is filed in `TECH_DEBT §1` as the family's most important structural debt.
> - **Both §3 and §6 verify-at-build contingencies did not fire:** the bear path was already single-sourced in `shared/crash-model.js`, and the Stress Test already exposes receiver params, so neither the promotion nor the separate-item fallback was needed.
> - **§10's hub shipped, then gained two prominence surfaces** it does not describe: a grouped **Retirement** subsection in The Numbers dropdown and the family strip on the homepage (JM ruling, options 1+2). A top-level nav item — option 3 — remains unbuilt and filed with the nav-capacity project, so §10's "not a nav change" fence holds for the **bar**, which is what it was always about.


**Page title:** Compare Retirement Plans (JM naming ruling 2026-08-21; verb-first per the toolbox naming canon, `STYLE_GUIDE §10.4`)
**Slug:** `/compare-retirement-plans`
**This file:** `COMPARE_RETIREMENT_PLANS_DESIGN.md` — deliberately NOT `RETIREMENT_SCENARIO_COMPARISON_DESIGN.md`, which already exists at repo root and documents a different, shipped feature (the flagship's on-page `rt-compare` panel, 2026-07-25; authoritative behaviour in `RT_COMPARE_HANDOFF.md` §2, catalogued `SITE_GUIDE §17`). The two must never be confused; see §1 for the fence between them.
**Design session:** 2026-08-26, JM + chat-side. Promotes the backlog entry surfaced 2026-08-21 (`PAGE_IDEAS_BACKLOG` → Retirement family), which itself promotes the deferred note in `ESCAPE_VELOCITY_DESIGN.md` §5.
**Status:** **SHIPPED 2026-08-26** — all four §9 items ratified as recommended. See the amendment above; `SITE_GUIDE §52` is authoritative for current state.

---

## §1 — The one question this page owns

**"Which of my options do I take?"**

The retirement family is a decision funnel; each page owns one question and refuses the others:

| Page | Question | Shape |
|---|---|---|
| The Bitcoin Retirement (flagship) | What does my plan look like? | One plan, full model context (bands, 60/40 foil, variants) |
| Bitcoin Escape Velocity | How much is enough? | One plan, threshold-finding + unit sensitivities |
| **Compare Retirement Plans (this page)** | **Which of my options?** | **Two complete, independently configured plans, side by side** |
| Retirement Stress Test | Does the winner survive bad luck? | The chosen plan against timing and crashes |

The hub (§10) is these four questions in order.

**Fences, stated precisely:**

- vs. the flagship's `rt-compare` panel: that is one plan ± canned relative nudges ("what if I retire two years later?") — variants derived from a base. This page is plan-vs-plan: two independently configured scenarios with no base/variant relationship.
- vs. Escape Velocity's "one step in any direction" rows: those are **unit sensitivity** — automatic, ±1 increment per input, terrain around a single plan. This page's delta is a **chosen alternative** — the reader configures a complete second plan (one input different, or three) and the delta describes the bundle actually being weighed. EV answers "how steep is the ground around my plan"; this page answers "which path do I take." EV's rows are the on-ramp: a reader intrigued by "+1 yr crosses the threshold" builds that as a full Plan B here.
- vs. the Stress Test: **the uncontrollable lives there.** Per-column differences on this page are inputs the reader controls — nothing else (§2). The one exception is the shared environment toggle (§3), which applies to both plans identically and therefore never confounds the comparison.
- Not to be confused with *Three-track scenario comparison* (Financialization cluster): that is bitcoin-vs-STRC-vs-Treasuries, scoped as a `/bitcoin-fixed-income` extension with a standing "do NOT build a new page" ruling. Unrelated despite the phrase.

---

## §2 — Inputs: per-column, controllables only

Each column carries exactly three inputs — the things a reader actually controls:

1. **Stack at retirement** (BTC)
2. **Retirement year**
3. **Annual withdrawal** ($/yr, the engine's existing withdrawal model — no new modeling)

Controls follow flagship/EV stepper conventions. Column labels fixed at **Plan A** / **Plan B** (no naming UI in v1).

**Plan B initialization (ratify, §9):** on first load — or on carry-in (§6) — Plan B starts as a copy of Plan A with retirement year +1. The page opens showing a meaningful comparison, never a blank column, and the default provocation ("what does one more year buy?") is the question most readers arrive holding.

**Rationale for inputs-only columns (the honesty argument, verbatim from the design session):** if column B could carry a different growth model or a private crash, every verdict row silently becomes a confounded model-vs-model claim — a reader could "win" a comparison by giving one plan a friendlier world without realizing that is what they did. Attribution is the entire product: every visible difference in outcome must be traceable to a choice the reader made.

---

## §3 — Shared assumptions: one card

A single card between/above the columns, governing both:

- **Growth path:** power-law trend (the follows-trend variant only), constants from the shared PL module. The gap-persists variant, bands, and the 60/40 foil are flagship territory and do not appear here.
- **Horizon:** the engine's existing horizon constant (EV displays value-at-2065, chart to 2075) — read from shared code, never re-declared.
- **Bear-market toggle:** "Test both plans against a bear market at retirement." Off by default. When on, the Stress Test's bear path is injected into **both columns identically**. The card carries one line of copy explaining the rule: the crash always hits both plans, so the comparison stays about the choice, not the luck. The question it answers is decision-relevant and unique to this page: *does my option's advantage grow or shrink when the market turns hostile?*
  - **Verify-at-build:** the crash path must come from the Stress Test's own definition, single-sourced. If it is page-local there today, promote it to `shared/` rather than duplicating; hold-and-report if the promotion is nontrivial.

---

## §4 — Page anatomy, top to bottom

1. **Lede** (meets `NEW_PAGE_CHECKLIST §10.5` + the finding-then-cue standard, `STYLE_GUIDE`):
   > Every plan is a choice against the plan you didn't pick — retire this year or next, draw more or less, wait for a bigger stack. Set both plans side by side and read what the difference actually buys.
2. **Input columns** A | B (§2) with the shared card (§3).
3. **Hero chart** (§5).
4. **Delta strip** — two to three plain-language sentences, the page's payload (§7). Placement above the verdict table (ratify, §9).
5. **Verdict table** — A | B | Δ (§7).
6. **Collapsibles** — "Verify the math — Plan A" and "— Plan B," flagship pattern, one per column.
7. **Cross-link block** — the funnel, with carry (§6): *Size it first* → Escape Velocity · *Stress-test the winner* → Stress Test (carries the chosen column) · *Build one plan in full context* → the flagship.

Mobile (375px, blocking QA): input columns stack under a sticky A/B segmented switcher controlling which plan's inputs are being edited; the chart always shows both curves; delta strip renders before the table; the table keeps three columns with compact headers (A · B · Δ) — values are short enough. Verify no horizontal overflow at 375.

---

## §5 — The hero chart: two options, JM picks one (§9)

Both options obey the same constraint: this chart has one job — *which line holds* — and earns radical simplicity because the flagship already owns full model context. No bands, no 60/40, no gap-persists variant, no per-bitcoin lines.

**Option 1 — paired balance curves (recommended default).** Two curves, one per plan: total stack value over time on the follows-trend path. Each plan's retirement year gets an axis tick; a marker lands where either plan escapes (growth permanently outruns withdrawal) or depletes. Log y-axis per house convention. Hover/tap on a column or legend entry emphasizes that plan's curve and dims the other — inspection without a toggle. (A back-and-forth toggle was considered and declined: comparison requires simultaneity; flipping asks working memory to hold a curve shape across the flip, which is the failure mode side-by-side exists to fix.)

**Option 2 — mirrored growing-vs-spending bars.** EV's existing per-retirement-year bar chart (gained/lost after withdrawal, green vs. the negative colour), doubled: Plan A's years rise above the axis, Plan B's mirror below. Where each plan's good years end is immediately visible as the colour turn on each side. On-family with EV's visual language; less conventional at first read.

Whichever is chosen: **typography ships at the house standard from day one** — ticks 12, axis titles 13, legend 12, tick labels at body ink (the `/the-bitcoin-floor` reference values). The site-wide sweep ruling is still pending, but a new build has no reason to ship undersized.

---

## §6 — Shareability and carry (first-class, not follow-up)

- **Namespaced URL params from the first commit** (retrofitting breaks every shared link): `a_stack`, `a_year`, `a_wd`, `b_stack`, `b_year`, `b_wd`, plus the shared toggle (suggest `bear=1`). Match house param conventions (`SITE_GUIDE §46` suite vocabulary) — verify exact naming style at build.
- **Carry-in:** arriving from the flagship or EV with a plan in hand pre-fills Plan A; Plan B initializes per §2. Senders speak the receiver's vocabulary (house rule).
- **Carry-out:** the "Stress-test the winner" link carries the reader's chosen column into the Stress Test's params. Verify-at-build: confirm what the Stress Test accepts as receiver params today; if it has no receiver, that is a small separate item — do not build it silently inside this page.
- Write-back on interaction: `replaceState`, debounced; reset strips all params (WODN precedent, `SITE_GUIDE §34/§46`).

---

## §7 — Verdicts and the delta

**Verdict table rows** (aligned to EV's vocabulary so the family reads as one system):

| Row | A | B | Δ |
|---|---|---|---|
| Crosses the threshold | yes/no (+ margin) | yes/no (+ margin) | sentence |
| Stack needed to escape vs. held | x.xx vs x.xx BTC | … | sentence |
| Sustainable withdrawal vs. planned | $/yr vs $/yr | … | sentence |
| Earliest crossing year vs. chosen | yyyy vs yyyy | … | sentence |
| Depletes / holds | year or "holds" | … | sentence |
| Value at horizon | $ | $ | sentence |

**The Δ column is sentences, not arithmetic.** Two columns of numbers make the reader do the subtraction; the insight is the sentence. Templates:

- "Retiring one year later: the plan holds eleven years longer and ends $2.1M higher at 2065."
- "Both plans cross the threshold; Plan B's margin is 0.19 BTC wider."
- "Plan A runs out in 2054; Plan B holds through the horizon."

**Delta strip** = the two or three sentences that matter most, promoted above the table (ratify placement, §9). This is the screenshot-and-share unit, and it is where the page gets to surprise: power-law compounding makes small input changes buy outsized outcome changes, and stating that plainly lands harder than displaying it.

**Register rules for delta language:** state what each plan buys and costs, symmetrically; no winner-crowning copy — verdicts are facts (crosses / depletes / holds), the reader chooses. Depletion markers and run-out sentences do not flinch and do not editorialize. All flagship caveats inherit: the model is a historical fit, not a forecast; the humility clause links to the Power Law caveats as on the flagship. Draft copy complies with `STYLE_GUIDE §11` (banned-words list).

---

## §8 — Engineering requirements (blocking)

1. **One engine.** Both columns run off one engine instance's constants — flagship projection + EV threshold solver, 100% reuse, no new modeling, no new research (backlog ruling). Any constant re-declared per column is a defect.
2. **Parity tripwire.** Extend the existing `evParityQA` rather than writing a second one. Assert: (a) identical inputs in A and B produce identical outputs; (b) each column's outputs match the flagship/EV engines for the same inputs; (c) both columns read the same shared constants object.
3. **No consequence rows.** EV's "one step in any direction" engine is flagged possibly vestigial (`ESCAPE_VELOCITY_DESIGN.md` §5); this page deliberately does not lean on it, dissolving the dependency rather than auditing it.
4. **Params namespaced from commit one** (§6).
5. **375px pass** per §4; no console errors; the standard preview verification set.
6. **Carousel slide + video** follow the §13 register canon and the luminance acceptance gate (floor ≥ ~25%, rising arc, closing frame brightest; chat-side verification per `NEW_PAGE_CHECKLIST §8`). Concept brief drafted at build handoff, not here.

---

## §9 — Open items for JM before build

1. **Hero chart:** Option 1 (paired curves — recommended) or Option 2 (mirrored bars)?
2. **Delta strip placement:** above the verdict table (recommended — it is the headline) or below?
3. **Plan B initialization:** copy of A with retirement year +1 (recommended) — ratify or replace.
4. **Hub naming** (§10): ratify slug and title.

Everything else in this doc is settled per the 2026-08-26 session unless JM reopens it.

---

## §10 — The hub (ships with or immediately after this page)

The fourth spoke fires the "family earns a hub before nav grows" trigger (`SITE_GUIDE §49`; `PAGE_IDEAS_BACKLOG` Retirement family, 2026-08-21). Deliberately small:

- **What it is:** a short landing page — the four questions of §1 in order, one sentence per tool, each linking its page. One line making the carry explicit: "your inputs follow you between these tools." Targets the **"bitcoin retirement"** head term (re-pull GSC at build per the backlog's base-rate caution; the entry must not defend existing volume).
- **What it is not:** a nav change. **The dashboard precedent governs:** `category: hub`, no nav slot, surfaced via a `/calculators` tile, a homepage card, and cross-links from all four family pages. The desktop nav has no capacity for a seventh item (measured: wraps the wordmark, 65→90px, breaks hardcoded sticky offsets — `SITE_GUIDE §47`); the nav question rejoins the separately filed capacity work later, with usage data behind it. The hub is not coupled to that project.
- **Naming (ratify):** slug **`/bitcoin-retirement`** (the head term; distinct from the flagship's `/the-bitcoin-retirement` — the article does the disambiguation), title/H1 **"Plan Your Bitcoin Retirement"** (verb-first per the toolbox canon, and carries the head term). Nav label question ("Retirement" vs "Plan Your Retirement") is explicitly deferred with the nav itself.
- **Future spoke slot:** the counsel-gated retirement-funds-mechanics survey, if it ever clears counsel, lands as a hub section rather than a standalone page (the backlog already notes a hub section is also the lightest way past the gate). The hub's layout leaves room; nothing is built now.

---

## §11 — What this page refuses (recorded so it is not re-litigated)

- A third scenario (v1: no, per the backlog; the `a_`/`b_` namespace extends to `c_` if a third ever earns its cost).
- Per-column assumptions, growth paths, or stress — the confounding argument in §2 is the permanent reason.
- Monte Carlo — the site-wide no stands (`RETIREMENT_CALCULATOR_DESIGN_22` §3.6). The randomized-draws idea in the Financialization cluster's three-track entry is a separately flagged precedent decision and does not enter here.
- Bands, the 60/40 foil, gap-persists — flagship context, one click away.
- Consequence rows (§8.3).
- Withdrawal-strategy variants beyond the engine's existing model — no new modeling in this build.
