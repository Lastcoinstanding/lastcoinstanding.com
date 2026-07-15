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

- [ ] **"How Much Cash?" — the cash-buffer question for the fully-allocated. PRIORITY: NEXT BUILD.**
  Surfaced 2026-07-14. New page.
  - **Concept:** how much fiat buffer to hold alongside a stack, and why. Three arguments, in order of weight:
    - **(a) Never be forced to sell into a drawdown** — the sequence-risk argument. Historical simulation of expense shocks (job loss, roof, medical) against a 100%-BTC baseline, built on the existing crash / PL machinery rather than new modelling.
    - **(b) Dry powder at floor-zone entries** — inherits Wait or Deploy Now's historical-not-prediction posture. What a buffer bought you at past floor-zone entries, stated as history, never as a forecast.
    - **(c) The behavioral case** — the buffer you hold so you can hold the stack.
  - **Non-negotiable:** the page MUST show the buffer's cost honestly — expected drag versus 100% BTC, presented as the price of insurance, not hidden behind the three arguments for it. Same discipline as the trilogy's risk shed.
  - **Framing:** the mirror-bookend of **How Much Bitcoin** (`/how-much-bitcoin`). That page is about *entering*; this one is about *de-risking from all-in*. The pair should read as two ends of one question.
  - **Cross-links:** Disciplined Rebalancing (`/disciplined-rebalancing`), Wait or Deploy Now (`/wait-or-deploy-now`), the Retirement Stress Test (`/the-bitcoin-retirement-stress-test`), allocation sizing (`/bitcoin-allocation-sizing`).

- [ ] **"Sell, Borrow, or Wait?" — funding a real-world goal from a stack.**
  Surfaced 2026-07-14. New page, sequenced after **How Much Cash?**.
  - **Concept:** one concrete goal (house deposit, car), three strategies, all simulated on the channel: **sell at strength** (Disciplined Rebalancing's zone logic), **borrow** (the BAS math), or **delay the purchase** (Wait or Deploy Now's regime logic). The reader brings a goal, not a market view.
  - **Why this framing:** deliberately reframed from "when to sell" so it **triangulates** Borrowing Against Your Stack (`/borrowing-against-your-stack`) rather than competing with it. A "when to sell" page would duplicate DR and undercut BAS; a "fund this goal" page uses both as inputs.
  - **Cross-links:** DR (`/disciplined-rebalancing`), BAS (`/borrowing-against-your-stack`), WODN (`/wait-or-deploy-now`).
  - **Open design question — settle at spec time:** own page (lean) vs. an extension of Disciplined Rebalancing. Decide before drafting; the answer changes the scope substantially.

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

- [x] **Bull & bear market cycles — a dedicated exploration.** → shipped as `bull-and-bear-cycles` (`/bull-and-bear-cycles.html`) in `c0bea4a`, 2026-07-06.
  Surfaced 2026-06-30 during the deployment-trilogy work, when the page-1 risk shed raised the question of how to present drawdown/bear-market severity. Decided NOT to fold into page 1 (scope/measure-mismatch); built as its own page. Went straight to build — no interim design doc.
  - **The spine moved.** The idea was captured as a *volatility-compression* page ("each successive bear market is shallower than the last" as the headline pattern). What shipped is built on **"the volatility is the price of the returns"** — return and volatility as inseparable. Compression survives as *one graded mechanism among several*, not the thesis: the page states the drawdowns have been getting shallower, then grades how much to trust it (an econometric read finds the 2014–2020 downtrend statistically weak) and immediately prices the other side — maturation compresses the upside too, so you cannot sell the shallower drawdowns without also selling the mid-teens returns. Worth knowing if this page is ever revisited: the compression framing was tried and deliberately demoted, not overlooked.
  - **Open question (a) — River vs. own computation: resolved, River dropped.** No River citation on the page at all. Headline drawdowns use documented daily-close cycle extremes; visuals use the shared ~12-day Power-Law series, with the methodology disclosed and the method-dependence stated ("depending on method; the shallower daily-close read is the one used here"). The "everything computed live" integrity option won outright, so the attribution question is moot unless River's table is reintroduced.
  - **Open question (b) — duplicate the Deviation Wave?: resolved by an explicit carve,** now written into the page's own `related` block: Bull & Bear reads the cycles *as deviations from the Power Law*; the Doubling Ladder maps *the trend itself and the wave around it*. Same split for How Much Bitcoin — Bull & Bear owns why sizing is the survival mechanism, How Much Bitcoin owns the Kelly maths. Additive, not redundant.
  - **Open question (c) — anti-timing guardrails: resolved, and made a feature.** The prediction trap is documented *and refused* on the page; no next-bottom prediction. The "shallower each time" pattern is explicitly named as the thing that seduces people into timing the bottom, which is why the mechanisms are evidence-graded. Sources & methodology balances bull and skeptic citations.
  - **Shipped cross-links:** Stress Test, Horizon, Doubling Ladder, How Much Bitcoin, Wait or Deploy Now, Disciplined Rebalancing.
  - **Follow-on commits:** `ff0f78b` (plainer voice, bull/bear callout, price-state live status), `30c2fdb` (OG card + title rename), `9e3e7d1` (live-status tile framed by ratio, not state), `9a83a97` (site-wide fix: "live" never labels a stale fallback).
  - **Still unbanked from the original capture:** the note that River's *cycle peak-to-trough bear drawdown* is a different measure from the trilogy's *drawdown-within-2-years-of-an-upper-channel-entry*. Nothing depends on it today, but if both measures ever appear on one page, say which is which.
