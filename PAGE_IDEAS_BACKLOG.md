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

- [ ] **Bull & bear market cycles — a dedicated exploration (volatility compression over time).**
  Surfaced 2026-06-30 during the deployment-trilogy work, when the page-1 risk shed raised the question of how to present drawdown/bear-market severity. Decided NOT to fold into page 1 (scope/measure-mismatch — see below); captured here as its own page instead.
  - **Concept:** a standalone "exploration"-genre page on Bitcoin's bull/bear cycle structure, centered on the thesis that **each successive bear market is shallower than the last** (volatility compression / maturing market). Bull and bear phases with associated graphs; gets into the weeds on decreasing drawdown severity in a way the trilogy deliberately keeps light.
  - **Evidence / sources to synthesize:**
    - **River Financial's bear-market table** (seen via @River on X, ~Jun 2026): peak-to-trough drawdown by cycle — 2011 −93% (~5mo), 2013–2015 −87% (~14mo), 2017–2018 −84% (~12mo), 2021–2022 −77% (~12mo), 2025–2026 −53% (~9mo). The monotonic *shrinking* drawdown is the headline pattern. **Cite River with credit** (third-party data — attribute, don't pass off as our own computation). NOTE: this measures *cycle peak-to-trough bear drawdown*, which is DIFFERENT from the trilogy's *drawdown-within-2-years-of-an-upper-channel-entry* metric — be explicit about which is which if both ever appear.
    - **The Deviation Wave** (`/the-doubling-ladder`, "Visual B · centerpiece"): already argues this visually — falling green cycle-peak ceiling (~9× 2011 → 4× 2017 → 3× 2021), holding red floor, long-run average pinned to the line. This is our OWN live-computed version of the compression thesis; the new page should build on / cross-link it heavily rather than re-derive.
    - **The Bitcoin Horizon** (worst-entry-recovery sibling): the recovery-over-long-holds angle — even the deepest drawdowns recover given a long enough hold. Complements the "drawdowns are shrinking AND they recover" story.
  - **Connections:** sits in "The Numbers" / explorations genre alongside the Deviation Wave, the Horizon, the Heatmap. Likely cross-links: the deployment trilogy (page 3 especially — the drawdown-by-position story), the Doubling Ladder (Deviation Wave), the Horizon.
  - **Open design questions:** (a) how much to lean on River's table vs. our own live computation — ideally compute our own cycle-drawdown series from PL_DATA and use River as corroboration/credit rather than the spine, to keep the "everything computed live" integrity; (b) does this subsume or duplicate the Deviation Wave's argument? — need to carve a distinct angle (cycles/bull-bear framing vs. the Wave's deviation-from-trend framing) so it's additive, not redundant; (c) anti-timing guardrails — a "bear markets are shrinking" page must not become a "so time the bottom" page, same discipline as the trilogy.
  - **Once the trilogy merges,** this is a natural next build. Promote to a design doc (`BULL_BEAR_CYCLES_DESIGN.md` or similar) when scheduled.

---

## Promoted / shipped
_(none yet)_
