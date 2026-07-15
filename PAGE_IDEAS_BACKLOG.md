# Page Ideas Backlog — Last Coin Standing

Candidate page / exploration ideas surfaced during ongoing work but not yet scheduled. This is **feature scope**, distinct from `TECH_DEBT.md` (known issues / deferred cleanups) — ideas here are net-new pages or explorations, captured so good ideas don't get lost in chat history.

**Guiding principle:** capture terse but with enough substance (concept, evidence/sources, where it connects to existing pages) that the idea can be picked up cold and developed into a proper design doc without re-deriving it. When an idea graduates to active development, mark it `→ promoted` with the design-doc name; when shipped, `- [x]` with the page slug + commit.

## Conventions
- **Status:** `- [ ]` open · `→ promoted` in development (note design doc) · `- [x]` shipped (note slug + SHA)
- **When adding:** concept in one line, then sub-bullets for evidence/sources, connections to existing pages, and any open design questions
- Keep entries terse; deep design lives in the eventual design doc

---

## Open ideas

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
