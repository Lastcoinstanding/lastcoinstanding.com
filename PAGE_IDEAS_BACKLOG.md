# Page Ideas Backlog — Last Coin Standing

Candidate page / exploration ideas surfaced during ongoing work but not yet scheduled. This is **feature scope**, distinct from `TECH_DEBT.md` (known issues / deferred cleanups) — ideas here are net-new pages or explorations, captured so good ideas don't get lost in chat history.

**Guiding principle:** capture terse but with enough substance (concept, evidence/sources, where it connects to existing pages) that the idea can be picked up cold and developed into a proper design doc without re-deriving it. When an idea graduates to active development, mark it `→ promoted` with the design-doc name; when shipped, `- [x]` with the page slug + commit.

## Conventions
- **Status:** `- [ ]` open · `→ promoted` in development (note design doc) · `- [x]` shipped (note slug + SHA)
- **When adding:** concept in one line, then sub-bullets for evidence/sources, connections to existing pages, and any open design questions
- Keep entries terse; deep design lives in the eventual design doc

---

## Open ideas

- [ ] **WODN position receiver — enable the underwater-manager handoff from How Much Cash.**
  Surfaced 2026-07-16 during the How Much Cash v3.3 build (addendum A2).
  - **Concept:** teach `/wait-or-deploy-now` to read its slider position from a URL param (it currently encodes nothing in URL state). Then How Much Cash's underwater-manager block ("the target never came → deciding when to redeploy is Wait-or-Deploy's question") can carry **today's channel position** into WODN, so the reader lands on the deploy-or-wait question already at their spot — suite carry pattern (senders speak the receiver's vocabulary).
  - **Why it's blocked today:** WODN has no URL handling, so the handoff link is currently **plain**. This is the receiver half; the sender (HMC) is ready.
  - **Cross-links:** How Much Cash (`/how-much-cash`, the sender), WODN (`/wait-or-deploy-now`, the receiver). Mirror-twin pair already share `shared/channel-entries.js`.
  - **Open design question:** WODN's slider is a channel position (0–1) like HMC's — decide the param name/encoding to match HMC's `pos`/`rebuy` convention so the suite reads consistently.

- [ ] **How Much Cash tracking input — enter your actual sell, auto-set the sell slider.**
  Surfaced 2026-07-16 (v3.3 spec §6, deferred). For the reader **managing** an existing position, not exploring a hypothetical.
  - **Concept:** a small input — enter the date or price you actually sold at — that auto-positions slider 1 to where you sold, so the manager sees their real round trip's stats without hunting for the position by hand. The v3.3 copy already addresses this reader (the manager/underwater passage); this is the input that serves them directly.
  - **Why deferred:** v3.3 covered the manager in **copy + routing** (the underwater block + WODN handoff); the dedicated input is the next step, not the same build.
  - **Cross-links:** builds on `/how-much-cash`'s existing sell slider + sticky-state persistence (STYLE_GUIDE §6.37 — a tracked position would persist naturally).
  - **Open design question:** date→position vs price→position (price alone is ambiguous without the date, since the trend moves); likely needs both, or date with price as a cross-check.

- [ ] **Interactive highlights strip in The Gallery — deep-link cards into the best playgrounds.**
  Surfaced 2026-07-12 during the drift-chart Phase C build (which shipped the deep-link anchors this depends on).
  - **Concept:** a 3–4 card strip in The Gallery, each card deep-linking into a preconfigured interaction — e.g. the **allocation crash view** (`/bitcoin-allocation-sizing?…&cy=3&rec=weak#crash`), **Wait or Deploy Now**, the **Retirement Stress Test**, and **The Bitcoin Retirement**. Each card lands the reader on the open, configured playground in one click.
  - **Why not a nav item:** an alternative to adding a top-nav "Interactions" entry (which worsens the dropdown-overflow problem already flagged). Revisit nav only if the strip earns it.
  - **Depends on:** Phase C deep-link anchors (**shipped** in `154f84a`-line drift work — the crash view is deep-linkable today; other playgrounds already carry URL state).
  - **Open design questions:** which 3–4 to feature; whether cards show a static thumbnail or a live mini-preview; copy register for each card.

- [ ] **"Sell, Borrow, or Wait?" — funding a real-world goal from a stack.**
  Surfaced 2026-07-14. New page, sequenced after **How Much Cash?**.
  - **Concept:** one concrete goal (house deposit, car), three strategies, all simulated on the channel: **sell at strength** (Disciplined Rebalancing's zone logic), **borrow** (the BAS math), or **delay the purchase** (Wait or Deploy Now's regime logic). The reader brings a goal, not a market view.
  - **Why this framing:** deliberately reframed from "when to sell" so it **triangulates** Borrowing Against Your Stack (`/borrowing-against-your-stack`) rather than competing with it. A "when to sell" page would duplicate DR and undercut BAS; a "fund this goal" page uses both as inputs.
  - **Cross-links:** DR (`/disciplined-rebalancing`), BAS (`/borrowing-against-your-stack`), WODN (`/wait-or-deploy-now`).
  - **Open design question — settle at spec time:** own page (lean) vs. an extension of Disciplined Rebalancing. Decide before drafting; the answer changes the scope substantially.

- [ ] **Tool-hero sweep — apply STYLE_GUIDE §6.10a to the other tool pages.** Small, anytime.
  Surfaced 2026-07-15 with the How Much Cash v3 rebuild; JM's request, added to the guide as canon in that build and deliberately not swept there.
  - **The rule:** every tool/exploration hero states declaratively what the tool is and how to use it. No assumed reading order — a hero may not need a sibling page to parse. The failure it fixes: How Much Cash v2 opened *"The other end of the sizing question — for the reader who already went all in"*, legible only to someone who had read How Much Bitcoin.
  - **The shape that satisfies it:** subtitle names the question the tool answers; the line under it names the audience and the two or three actions. See `/how-much-cash` for the reference implementation.
  - **Candidates to audit:** every page with a `calculator_tile` (currently 20). Expect most to pass; the ones to check first are those whose subtitle opens on a relationship to another page rather than on their own question.
  - **Scope note:** copy-only, no engine risk. Natural to bundle with any other hero-touching pass.

- [ ] **Freshness signals — "New" / "Updated" badges, and an honest channel-position chip.**
  Surfaced 2026-07-14. Small, anytime.
  - **Badges:** "New" / "Updated" markers in nav + index, driven by the existing `src/_data/updates.json` on a ~30-day window. Optional per-page "Updated &lt;month&gt;" line, but only where it means something — not stamped site-wide.
  - **Channel-position chip (separate, more interesting):** price · trend multiple · zone vocabulary, with a subtle glow **gated on `todayPriceIsLive`**. This is the honest form of the "site is alive" idea: it says where we are in the channel, in the site's own vocabulary. Pilot on 2–3 pages before committing to the layout.
  - **Rejected:** a raw price ticker. Off-thesis — the site is about the channel, not the tape.

- [ ] **Power law in other metrics — hash rate, energy, addresses. Low priority.**
  Surfaced 2026-07-14. Extension, not a new page.
  - **Concept:** additional power laws beyond price — hash rate, energy, active addresses — as **sections on the existing Power Law (`/the-power-law`) or Metcalfe (`/bitcoin-and-metcalfes-law`) pages**. Explicitly not a new page.
  - **Check first:** what the Metcalfe address scatter already covers — the addresses angle may be substantially done.
  - **Cost to weigh:** each new series adds monthly-refresh surface. The maintenance tail is the reason this is low priority, not the difficulty.

- [ ] **The Bitcoin Exit — Substack essay on conviction vs. the act of stacking.** Substack (opinion/memoir).
  Surfaced 2026-07-30. Near-term candidate — JM says it's largely written in his head.
  - **Concept:** why believing and *acting* are different muscles; DCA as conviction made mechanical; JM's firsthand experience moving retirement funds (memoir register — "what I did, what surprised me"). Hook: the $30/day-since-2017 anecdote as the human-brain-vs-exponentials story.
  - **Pairs with:** the daily-conviction DCA tool below, as its live artifact — same essay↔page pattern as the STRC essay↔page pair.

- [ ] **What Daily Conviction Bought — daily-conviction DCA tool (The Numbers).** Working title.
  Surfaced 2026-07-30. The live artifact for "The Bitcoin Exit" essay.
  - **Concept:** don't retell the $30/day legend — recompute it live: pick a start date + daily amount → BTC accumulated, total inputs, value today, multiple. The anecdote generalized into an instrument. Full price history, house live-compute conventions.
  - **Verify at build:** source the original anecdote (arithmetic dates it ~2023: $30/day from 2017 ≈ $66K inputs at ~6 yrs; run to 2026 ≈ $105K in — the live recompute IS the upgrade).
  - **Collision fences:** exponential-blindness belongs to the Doubling Ladder; lump-sum-vs-DCA belongs to Wait-or-Deploy — scope to the conviction-DCA computation only, cross-links do the rest.

- [ ] **Retirement-funds-to-bitcoin mechanics — SCOPING QUESTION (counsel-gated).**
  Surfaced 2026-07-30. Open question — decide at promotion time; do not build ahead of the counsel read.
  - **Why flagged:** the action-steps content ("how to actually move retirement funds") sits closer to the advice line than anything on the site, incl. STRC.
  - **Split:** JM's first-person experience → the Bitcoin Exit essay (memoir). Site version IF ANY = facts-only survey of existing mechanisms (self-directed IRA, ETF-in-IRA, rollover paths, custody trade-offs), US-flagged, heavily disclaimed, hard counsel gate — likely better as an extension of the retirement cluster than a standalone page.

- [ ] **Bitcoin as pristine collateral — argument exploration + essay. Anchors the collateral cluster.**
  Surfaced 2026-07-30. Timeliness: live product wave.
  - **Concept:** the emergent case the market hasn't priced — 24/7 liquidity, fully marked-to-market, fungible (vs real estate), verifiable, securable in multisig → better collateral → structurally lower rates and lender friction/risk.
  - **Register:** both — site Arguments/Numbers treatment (facts, mechanics, comparisons) + Substack for the "unrecognized-but-inevitable" thesis voice.

- [ ] **Margin-call / borrow-against-stack calculator — site tool (The Numbers).**
  Surfaced 2026-07-30. Collateral cluster.
  - **Concept:** loan amount, LTV, lender terms → the bitcoin price that triggers a margin call, stress-tested against house drawdown / power-law paths; compare offerings side-by-side.
  - **Prior art:** Strike's new borrow product has a calculator to review.
  - **Guardrails:** facts-not-signals; leverage content = elevated counsel attention; no lender recommendations — computed comparison only, PARTNERSHIPS_REFERRALS_POLICY applies.

- [ ] **Collateral/services company research + freshness pass — task, not a page.**
  Surfaced 2026-07-30. Collateral cluster.
  - **Research:** current offerings — AnchorWatch, People's Reserve, Strike borrow-against-bitcoin, "Horizon" (disambiguate at research — several bitcoin cos use the name).
  - **Purpose:** (a) keep borrowing/services-adjacent explorations current (freshness = credibility); (b) partner-candidate notes per PARTNERSHIPS_REFERRALS_POLICY (no coverage-for-consideration entanglement; research and partnership tracks stay separate).
  - **Output:** research notes + a freshness diff for affected pages.

- [ ] **Real estate as the wedge — People's Reserve / REIT angle.**
  Surfaced 2026-07-30. Collateral cluster; extends the Bitcoin-vs-Real-Estate cluster.
  - **Source:** CJKonstantinos (People's Reserve founder) on a recent podcast — significant inbound interest from REITs and real-estate syndicates in bitcoin-backed structures.
  - **Explore:** real-estate holders as a conversion audience (a "wedge" from RE toward bitcoin); possibly an essay angle + a page extension rather than a new page.
  - **Verify at build:** locate/cite the podcast episode. Partnership-adjacent — same separation discipline as the research task above.

- [ ] **The agentic economy runs on bitcoin — grand-thesis essay (Substack-first).**
  Surfaced 2026-07-30.
  - **Concept:** AI agents as a new demand front — machine-to-machine payments want money that is global, universal, borderless, permissionless, neutral, and machine-custodiable — properties dollars/banking rails lack.
  - **Timeliness:** agentic payments are a live industry topic.
  - **Maturation path:** revisit for a site Arguments page if/when concrete rails (Lightning / L2 agent payments) give it an evergreen factual spine.

- [ ] **A new asset class / the paradigm layer — grand-thesis essay (Substack-first). "Singularity" umbrella.**
  Surfaced 2026-07-30.
  - **Concept:** bitcoin as a category event like oil or electricity — not an asset/investment/speculation but an economy-wide (civilizational) transformation.
  - **Singularity kinship (per the merge check):** JM flags kinship with a "Bitcoin is a Singularity" idea. **No existing Singularity backlog entry as of 2026-07-30**, so this is created as the umbrella with two angles — the asset-class lens + the singularity framing; fold any future Singularity capture into this entry rather than duplicating.
  - **Sub-topic (in or out):** *why altcoins are stillborn* — either a section here or its own piece; decide at drafting.

- [ ] **Value creation vs. value capture — theme essay (Substack).**
  Surfaced 2026-07-30. JM flags as a personally favourite theme; good candidate for the essay cadence between heavier builds.
  - **Concept:** the creation/capture lens applied across bitcoin itself, bitcoin companies, and AI companies (the alternative-investment du jour).

- [ ] **Deflation without fear — Foundations-adjacent essay (Substack).**
  Surfaced 2026-07-30.
  - **Concept:** why deflation is not scary in a bitcoin-denominated world; why "money hoarding" fears don't apply.
  - **Open — JM to brief:** the argument set is deliberately not captured yet; JM to brief the reasons when promoted.

- [ ] **The idle $17T — money-market dry powder vs. bitcoin (macro data addition).**
  Surfaced 2026-07-30.
  - **Concept:** US+EU money-market funds as parked "monetary energy" — a live/periodic on-site figure ("the sidelines, measured") + a what-if device (X% of MMF assets moving → effect vs bitcoin market cap). A natural section for STRC-persona content (the Treasury-shore reader's neighborhood).
  - **Verify the figure at build:** ~$17T per JM — US MMF AUM is ~$7T range, EU adds meaningfully; source current numbers (likely ICI + EFAMA).
  - **Distinct from:** allocation-sizing (personal) — this is macro flows.

- [ ] **The fiscal canary — national debt as the fiat signal (macro data addition).**
  Surfaced 2026-07-30.
  - **Concept:** track US national debt (and interest-payments trajectory) as a standing signal of fiat-credit unsustainability — "fiscal dominance's canary" — alongside/within the Power Law exploration, or as a Half-Life-adjacent mini-exploration (melting-ice-cube kinship). Plus an updated **debt-by-president infographic** (JM has a reference image): the trajectory barely depends on who governs.
  - **Register guardrail (load-bearing):** the entire value of the by-president framing is its bipartisanship — scrupulously even-handed, zero partisan language; the inexorability IS the argument (site political-neutrality rules apply in full).
  - **Open design question:** overlay on an existing page vs. standalone — decide at promotion.

- [ ] **Mobile "full-canvas" notice — site UX. Small build.**
  Surfaced 2026-07-30. Pairs naturally with any future mobile-QA pass.
  - **Concept:** on canvas-heavy explorations, detect small viewports and show a dismissible one-line invitation — "this exploration rewards a bigger screen." Nudge, never nag, never gate.
  - **Implementation notes:** per-page front-matter flag (opt-in by page); appears once (dismiss persists per the no-storage constraint as best-effort — session in-memory only, acceptable to reappear per visit); zero SEO impact (content itself never hidden — mobile experience remains fully functional per the checklist QA standard).

---

## Promoted / shipped

- [x] **"How Much Cash?" — the cash-buffer question for the fully-allocated.** → shipped as `how-much-cash` (`/how-much-cash.html`) in `44c4139` (engine + page) + site integration, 2026-07-14. Went spec → build; design doc `HOW_MUCH_CASH_DESIGN_1.md`, build spec `HOW_MUCH_CASH_BUILD_SPEC_1.md`. Full record in **SITE_GUIDE §39**.
  - **The honest-cost requirement drove the whole page.** The entry insisted the buffer's drag be shown as the price of insurance. Built, it turned out stronger than "a drag": at today's ~0.42×-trend floor a 6-month buffer costs ~58% of a 1 BTC stack to raise, so **the default verdict is that the buffer cost more coins than it saved**. JM ruled to ship that as the first paint rather than tune it away, which moved the page's posture from "here is the price of insurance" to "this insurance is expensive right now, and here is exactly when it pays".
  - **The mirror-bookend framing held** — the page opens on How Much Bitcoin ending at a fraction of Kelly, and names the remainder's job. All three arguments (a)/(b)/(c) shipped, in the captured order.
  - **(b) dry powder needed the reconciliation the entry predicted.** WODN's historical-not-prediction posture is inherited, and dry powder ships as contingent on the insurance job — deploy fires only at the crash trough, from what the shock did not need. See §39 for why the spec's floor-zone trigger could not work.
  - **All four cross-links landed and are reciprocal** (DR, WODN, Stress Test, allocation — plus How Much Bitcoin and BAS).

- [x] **Bull & bear market cycles — a dedicated exploration.** → shipped as `bull-and-bear-cycles` (`/bull-and-bear-cycles.html`) in `c0bea4a`, 2026-07-06.
  Surfaced 2026-06-30 during the deployment-trilogy work, when the page-1 risk shed raised the question of how to present drawdown/bear-market severity. Decided NOT to fold into page 1 (scope/measure-mismatch); built as its own page. Went straight to build — no interim design doc.
  - **The spine moved.** The idea was captured as a *volatility-compression* page ("each successive bear market is shallower than the last" as the headline pattern). What shipped is built on **"the volatility is the price of the returns"** — return and volatility as inseparable. Compression survives as *one graded mechanism among several*, not the thesis: the page states the drawdowns have been getting shallower, then grades how much to trust it (an econometric read finds the 2014–2020 downtrend statistically weak) and immediately prices the other side — maturation compresses the upside too, so you cannot sell the shallower drawdowns without also selling the mid-teens returns. Worth knowing if this page is ever revisited: the compression framing was tried and deliberately demoted, not overlooked.
  - **Open question (a) — River vs. own computation: resolved, River dropped.** No River citation on the page at all. Headline drawdowns use documented daily-close cycle extremes; visuals use the shared ~12-day Power-Law series, with the methodology disclosed and the method-dependence stated ("depending on method; the shallower daily-close read is the one used here"). The "everything computed live" integrity option won outright, so the attribution question is moot unless River's table is reintroduced.
  - **Open question (b) — duplicate the Deviation Wave?: resolved by an explicit carve,** now written into the page's own `related` block: Bull & Bear reads the cycles *as deviations from the Power Law*; the Doubling Ladder maps *the trend itself and the wave around it*. Same split for How Much Bitcoin — Bull & Bear owns why sizing is the survival mechanism, How Much Bitcoin owns the Kelly maths. Additive, not redundant.
  - **Open question (c) — anti-timing guardrails: resolved, and made a feature.** The prediction trap is documented *and refused* on the page; no next-bottom prediction. The "shallower each time" pattern is explicitly named as the thing that seduces people into timing the bottom, which is why the mechanisms are evidence-graded. Sources & methodology balances bull and skeptic citations.
  - **Shipped cross-links:** Stress Test, Horizon, Doubling Ladder, How Much Bitcoin, Wait or Deploy Now, Disciplined Rebalancing.
  - **Follow-on commits:** `ff0f78b` (plainer voice, bull/bear callout, price-state live status), `30c2fdb` (OG card + title rename), `9e3e7d1` (live-status tile framed by ratio, not state), `9a83a97` (site-wide fix: "live" never labels a stale fallback).
  - **Still unbanked from the original capture:** the note that River's *cycle peak-to-trough bear drawdown* is a different measure from the trilogy's *drawdown-within-2-years-of-an-upper-channel-entry*. Nothing depends on it today, but if both measures ever appear on one page, say which is which.
