# Page Ideas Backlog — Last Coin Standing

Candidate page / exploration ideas surfaced during ongoing work but not yet scheduled. This is **feature scope**, distinct from `TECH_DEBT.md` (known issues / deferred cleanups) — ideas here are net-new pages or explorations, captured so good ideas don't get lost in chat history.

**Guiding principle:** capture terse but with enough substance (concept, evidence/sources, where it connects to existing pages) that the idea can be picked up cold and developed into a proper design doc without re-deriving it. When an idea graduates to active development, mark it `→ promoted` with the design-doc name; when shipped, `- [x]` with the page slug + commit.

## Conventions
- **Status:** `- [ ]` open · `→ promoted` in development (note design doc) · `- [x]` shipped (note slug + SHA)
- **When adding:** concept in one line, then sub-bullets for evidence/sources, connections to existing pages, and any open design questions
- Keep entries terse; deep design lives in the eventual design doc
- **Verify-at-build flags** are written into the entry, not left to memory. Anything that would cost credibility if stated loosely gets an explicit blocking line.
- **Where the referenced docs live.** Two homes, and it matters for who can edit them. **Repo-tracked** (Claude Code edits directly): SITE_GUIDE, STYLE_GUIDE, TECH_DEBT, DATA_AUDIT, MONTHLY_REFRESH_CHECKLIST, NEW_PAGE_CHECKLIST, POSITIONING_STRATEGY_GUIDE, TOOLS_FORWARD_LANGUAGE_KIT, FEEDBACK_SETUP, and the design docs. **Project-only, no repo copy** (must be handed over as a file to be edited): `claude/OPEN_ITEMS`, `claude/X_STRATEGY_PLAYBOOK`, `claude/FUNDING_STRATEGY`, `claude/REACH_GROWTH_PLAN`, `claude/CREATOR_CREDIBILITY_KIT`, `claude/PARTNERSHIPS_REFERRALS_POLICY`. **Always cite project-only docs with the `claude/` prefix** — this doc has been inconsistent about it and a bare citation is ambiguous.

_Merge pass 2026-08-03: JM's two-batch idea dump (2026-08-02) folded in — 12 new entries, 6 merges into existing ones, and the open list regrouped into clusters now that it exceeds 30 items. Two phantom cross-references discharged (see MSTR and Owned audience entries)._

---

## Clusters & sequencing notes (2026-08-03)

Captured during the merge pass, because the backlog is now large enough that the *shape* of it is itself a decision.

- **The collateral/credit cluster is now a pillar, not a scatter** — six related entries (pristine collateral, margin-call calculator, services research, RE wedge, credit in a bitcoin world, plus MSTR's "bitcoin-backed credit" framing). Decide hub-and-spoke vs. six independent builds **before** any one of them is promoted.
- **Financialization is becoming the site's centre of gravity.** STRC shipped; MSTR, The Big Long and the collateral cluster all sit there. `STRC_BELOW_PAR_DESIGN` §2 deliberately held financialization *one row back from the flagship*. Three-plus more pieces makes that fence load-bearing — a conscious call, not drift.
- **Essay-to-build ratio is heavy on essays** (~9 Substack pieces vs. ~8 builds). The builds with compounding return — the dashboard and Power Law v2 — should not keep losing sequencing to essays that are read once.
- **Highest persuasion-per-unit-effort in the whole backlog: Power Law v2.** Mostly build-on-existing-data (the shared PL module, the static out-of-sample chart, the Doubling Ladder's already-computed register) rather than new research.
- **The three competing "come back here" surfaces are now resolved (JM, 2026-08-07).** The **dashboard is the single anchor destination**; the **channel-position chip is its site-wide entry point** (ships after the dashboard); the **Gallery highlights strip is closed**, absorbed as the dashboard's "jump back in" row. See the Dashboard entry for the full ruling. (Was: "resolve into one coherent return-visit story before building any of them" — done.)

---

## Open ideas

### Site & platform

- [ ] **The Bitcoin Dashboard — the site's return-visit surface.** New page. Strategically the answer to the site's structural weakness (explorations are read-once).
  Surfaced 2026-08-02.
  - **RETURN-VISIT RULING ADOPTED (JM, 2026-08-07) — this entry is now the single return-visit story; the other two surfaces are subordinate to it.** The structure JM confirmed:
    - **Dashboard = the anchor destination.** It is the one page the return-visit story routes to. Build it first.
    - **v1 tiles are live-computed only** — channel position, trend multiple, zone, drawdown-from-peak, days-to-next-doubling, time-above/below-trend, and the like: everything that computes from data already on the site (`PL_DATA` + spot). **Macro tiles are explicitly OUT of v1** (idle-$17T, fiscal-canary, MMF flows — each carries its own refresh tail; defer until the live-compute core proves the surface).
    - **The channel-position chip = the dashboard's site-wide entry point, and it ships AFTER the dashboard**, not before — the chip is the doorway, the dashboard is the room; a doorway to nothing is pointless. (Freshness entry below re-pointed accordingly.)
    - **The Gallery highlights strip is CLOSED** — absorbed as the dashboard's "jump back in" row (the deep-link-into-a-playground idea becomes a dashboard row, not a separate Gallery surface). Entry below closed with a pointer here.
  - **Concept:** a live, visual, bookmark-worthy dashboard of the dynamics that actually move — so readers come back weekly rather than once. Inspiration is **Clark Moody's dashboard** (`bitcoin.clarkmoody.com/dashboard/`), explicitly as a *foil*: Moody's is purely numeric, no visuals, unengaging, and scoped to **network health** rather than anything personally actionable.
  - **The differentiator, and it is defensible:** Moody owns network health. Nobody owns **"where are we in the channel, and what does that mean for your position"** — the site's own vocabulary, already built and already live-computed across ~20 tools.
  - **Engagement mechanics:** remembered settings are feasible — per-page `localStorage` is an established pattern (`STYLE_GUIDE §6.37`, first used on How Much Cash). Interactive/personalised state is the bookmark hook.
  - **The real cost to weigh:** every tile is monthly-refresh surface — the same maintenance tail that made "power law in other metrics" low priority. The v1-live-compute-only fence above exists precisely to hold that tail down. Bias tile selection hard toward things that compute live from data already on the site.
  - **Open design questions (post-ruling):** which live tiles make v1; grouping/layout; whether it earns a nav slot or lives as a linked surface; SEO is thin by nature (bookmark magnet, not a search target) so it complements rather than replaces exploration pages.

- [x] **Owned audience — email capture, honest update-only framing.** Site surface + policy. **Discharged the phantom cross-reference.**
  Surfaced 2026-08-02 (JM, via the TFTC question). **SHIPPED-AS-SUBSTACK-FIRST 2026-08-07** — JM approved the Substack-first shape; the list lives on Substack (exportable = still owned) and the site's job is channeling readers to it.
  - **What shipped:** a layout-level **Get Updates** house component (`src/_includes/components/get-updates.njk`, included from `base.njk` above the feedback widget, gated `{% if slug and get_updates != false %}`), rendering a styled block with one button to `https://lastcoinstanding.substack.com/subscribe?utm_source=site`. **NOT the Substack iframe embed** — zero third-party scripts, zero iframes, zero new privacy surface (the R1 ruling; one extra click is the price). Canon copy in **SITE_GUIDE (Get Updates section)**. Merged to main in `b5d4b4f`.
  - **Deferred alternative (the upgrade path):** a **native on-site list** (own the addresses directly, not via Substack) is the documented fallback *if Substack ever constrains* — reuse the feedback widget's Cloudflare-Function + KV plumbing (`functions/api/feedback.js`, `SITE_GUIDE §27`). Not needed while Substack export keeps the list owned.
  - **THE FIREWALL — restated (now moot in practice, kept load-bearing):** the site-wide page-feedback widget (`SITE_GUIDE §27`) collects **optional reply emails** under canon copy promising *"it goes straight to the author, never published"*, replies as the stated purpose. **Those addresses are never used for updates** and must never become the newsletter list — a consent violation and the single most brand-damaging move on a site whose pitch is "no funnel, nothing for sale." The Get Updates block is the newsletter's own opt-in surface with its own promise; the two channels stay separate by construction.
  - **Register (as shipped):** update-only, no drip sequence, no upsell — consistent with `claude/FUNDING_STRATEGY`'s permanently-free/ad-free/no-funnel commitment. Heading "Get the essays and tool updates"; body promises "a few emails a month … no funnel, nothing for sale, unsubscribe anytime."
  - **Analytics-lite:** `?utm_source=site` on the subscribe URL lets Substack's stats distinguish site-driven subscribers (feeds the Reach plan's funnel metric).
  - **Cross-links:** `claude/REACH_GROWTH_PLAN` §5 (its "email capture" line is now live), `claude/FUNDING_STRATEGY`, `claude/CREATOR_CREDIBILITY_KIT` (signups are an impact metric).

- [ ] **Audience-mechanics research — TFTC, firebtc, satsvsfiat. Task, not a page.**
  Surfaced 2026-08-02.
  - **Scope, deliberately fenced: copy the audience mechanics, NOT the monetization model.** TFTC monetizes via sponsorships/ads/paid newsletter; firebtc.io runs free-vs-paid tiers. **Both are the model `FUNDING_STRATEGY` explicitly excludes** — "corporate sponsorships/affiliates (funnel)" is on the exclude list, and the core is committed *"permanently free, ad-free, independent — never top-of-funnel for a premium service."* Research what they do to *build and hold an audience*; leave the revenue model alone.
  - **Targets:** **TFTC.io** — email capture, weekly cadence, loyalty/re-engagement mechanics. **firebtc.io** — bitcoin-native FIRE site with calculators; note theirs are *purely numerical, no graphs or trend lines*, which is a direct read on our visual differentiation. **satsvsfiat.com** (Joe Bryan) — **testimonials**, the one concrete import candidate already identified.
  - **Output:** research notes + a shortlist of specific mechanics worth importing, each mapped to an existing site surface.
  - **If JM wants to reopen the paid-tier question**, that is a `FUNDING_STRATEGY` amendment and belongs there — not smuggled in via this entry.

- [ ] **Testimonials — credibility surface.** Small build; spun out of the audience research above.
  Surfaced 2026-08-02. Prior art: satsvsfiat.com.
  - **Concept:** reader testimonials as a trust signal, in the site's register (no hype, no marketing gloss).
  - **Source already exists:** the feedback widget's private pipeline is the natural origin — **but every testimonial requires explicit permission to publish**, given the widget's "never published" promise. Ask, don't assume.
  - **Cross-links:** `CREATOR_CREDIBILITY_KIT` §2 already runs a capture loop for reshares and kind words — this is the public face of that file.

- [ ] **Video register remediation — some shipped videos read dark/creepy.** Task. Audit first.
  Surfaced 2026-08-02 (JM).
  - **Concept:** several carousel/exploration videos land in a dark or unsettling register. Target register is **sci-fi, optimistic, inviting, constructive** — mysterious, not menacing.
  - **The prompt-side learnings are already captured** in `claude/OPEN_ITEMS.md` working notes: *"Grok Imagine: open sky/horizon/scale prevent 'dank' drift; explicit Avoid entries weigh heavily; JM's register is 'mysterious, almost sci-fi,' not creepy."* What's missing is the **remediation sweep of the videos already shipped**.
  - **Method:** audit first — list every shipped video, rate each against the target register, redo only the offenders. Cheaper than a blanket redo and it produces the reusable prompt pattern.

- [ ] **Freshness signals — "New" / "Updated" badges, and an honest channel-position chip.**
  Surfaced 2026-07-14. Small, anytime.
  - **Badges:** "New" / "Updated" markers in nav + index, driven by the existing `src/_data/updates.json` on a ~30-day window. Optional per-page "Updated &lt;month&gt;" line, but only where it means something — not stamped site-wide.
  - **Channel-position chip (separate, more interesting):** price · trend multiple · zone vocabulary, with a subtle glow **gated on `todayPriceIsLive`**. This is the honest form of the "site is alive" idea: it says where we are in the channel, in the site's own vocabulary.
  - **RE-POINTED 2026-08-07 (return-visit ruling) — the chip is now the dashboard's site-wide entry point, and it ships AFTER the dashboard.** It is no longer piloted independently: the chip is the doorway that routes readers to the dashboard (the anchor destination), so it is built once the dashboard exists, not before. See the Dashboard entry's ruling. (Note: the site already ships a live channel *ribbon* site-wide — `SITE_GUIDE §40` — so the chip's job narrows to being the dashboard's linked entry point rather than a fresh "site is alive" pilot.)
  - **Badges half unchanged:** the "New" / "Updated" nav+index badges (driven by `src/_data/updates.json` on a ~30-day window) are already shipped (`SITE_GUIDE §40`) and are untouched by the return-visit ruling.
  - **Rejected:** a raw price ticker. Off-thesis — the site is about the channel, not the tape.

- [x] **Interactive highlights strip in The Gallery — deep-link cards into the best playgrounds. CLOSED 2026-08-07 — absorbed into the Dashboard entry.**
  Surfaced 2026-07-12 during the drift-chart Phase C build (which shipped the deep-link anchors this depends on).
  - **CLOSED by the return-visit ruling (JM, 2026-08-07):** the deep-link-into-a-preconfigured-playground idea is **not** a separate Gallery surface — it becomes the **dashboard's "jump back in" row**. One return-visit story, one destination. See the Dashboard entry's ruling for the absorbed structure. This entry is retired to avoid a third competing surface; the *idea* lives on as a dashboard row.
  - **What carries forward into the dashboard row (do not re-derive):** the 3–4 deep-link cards — e.g. the **allocation crash view** (`/bitcoin-allocation-sizing?…&cy=3&rec=weak#crash`), **Wait or Deploy Now**, the **Retirement Stress Test**, **The Bitcoin Retirement** — each landing the reader on an open, configured playground in one click. Depends on the Phase C deep-link anchors (**shipped**, `154f84a`-line drift work; other playgrounds already carry URL state). Open sub-questions for the dashboard build: which 3–4 to feature; static thumbnail vs. live mini-preview; per-card copy register.

- [ ] **Tool-hero sweep — apply STYLE_GUIDE §6.10a to the other tool pages.** Small, anytime.
  Surfaced 2026-07-15 with the How Much Cash v3 rebuild; JM's request, added to the guide as canon in that build and deliberately not swept there.
  - **The rule:** every tool/exploration hero states declaratively what the tool is and how to use it. No assumed reading order — a hero may not need a sibling page to parse. The failure it fixes: How Much Cash v2 opened *"The other end of the sizing question — for the reader who already went all in"*, legible only to someone who had read How Much Bitcoin.
  - **The shape that satisfies it:** subtitle names the question the tool answers; the line under it names the audience and the two or three actions. See `/how-much-cash` for the reference implementation.
  - **Candidates to audit:** every page with a `calculator_tile` (currently 20). Expect most to pass; the ones to check first are those whose subtitle opens on a relationship to another page rather than on their own question.
  - **Scope note:** copy-only, no engine risk. Natural to bundle with any other hero-touching pass.

- [ ] **Site-wide de-tell sweep — `honest`/`canonical` and similar tells in reader-facing copy.** Small, anytime; copy-only, no engine risk.
  Surfaced 2026-08-05 during the Power Law v2 polish audit. The power-law page was swept in that pass; this entry carries the rest of the site.
  - **The rule (now canon):** STYLE_GUIDE §5 "Copy register: show, don't claim" — never call our own copy honest/candid/transparent (the disclosure does the work; deletion beats substitution), and avoid "canonical" in reader-facing copy (say "the reference fit/value"). The STYLE_GUIDE rule prevents *new* imports; this sweep clears the existing ones.
  - **Candidates:** grep every page's reader-facing copy for `honest`/`honestly`/`candid`/`transparent` and reader-facing `canonical`. Expect most hits in older explorations. Bundleable with the tool-hero sweep above (both copy-only, both hero-/prose-touching).
  - **Exempt:** first-person Substack/memoir voice ("honestly, I…" is natural speech, not the site describing itself).

- [ ] **Mobile "full-canvas" notice — site UX. Small build.**
  Surfaced 2026-07-30. Pairs naturally with any future mobile-QA pass.
  - **Concept:** on canvas-heavy explorations, detect small viewports and show a dismissible one-line invitation — "this exploration rewards a bigger screen." Nudge, never nag, never gate.
  - **Implementation notes:** per-page front-matter flag (opt-in by page); appears once (dismiss persists per the no-storage constraint as best-effort — session in-memory only, acceptable to reappear per visit); zero SEO impact (content itself never hidden — mobile experience remains fully functional per the checklist QA standard).

### Power Law cluster

- [x] **Power Law v2 — a consolidated pass on `/the-power-law`.** Shipped as one pass; sub-items below are kept as the build record.
  **SHIPPED 2026-08-04 &mdash; commit `d492650` (branch `feat/power-law-v2`), all six sub-items in one pass (JM-approved all-six-in-one).** (a) The out-of-sample chart's training cutoff is now a drag handle + preset chips (end-2014/2016/2017/2020/2023, default end-2017); regression, projection and a live readout recompute in-browser and the view is deep-linkable via `?fit=YYYY-MM`. The end-2014 preset reproduces the documented bad fit (b=6.787) and the copy owns it. (b) Exponent survey table + page-local explorer ranking five plottable (a,b) pairs by implied PRICE at 2026/2035/2045/2060 (never by bare exponent); b-only sources (b1m.io 5.566, naive full-series 5.63) listed-not-plotted. (c) Live days-to-double stat strip from `TODAY_DAYS`. (d) Time above/below-trend split computed live from PL_DATA (~43% / ~57%, mean log-dev ≈ 0), framed as candor not confidence (R4). (e) "Two ways the model could break" caveat &mdash; floor breach (down) folded in + Mežinskis's upside break, graded as speculation (R5). (f) Proportionality constant resolved to 12.76% (2^(1/5.77)) / ~12.8% in prose; ~13% kept only as the hero hook. Canonical `PL_A`/`PL_B` untouched and byte-identical (R1) &mdash; everything is page-local and presentation-only. Bookkeeping in the same PR: SITE_GUIDE §11, DATA_AUDIT (survey-pair rows), MONTHLY_REFRESH_CHECKLIST, updates.json. **Deferred at ship (see TECH_DEBT):** live web re-verification of the external survey pairs (BitcoinPower.law, bitcoinretirement.net, b1m.io) and the Mežinskis OOS / upside-break prior-art cites &mdash; coefficient values were taken from this build prompt + in-repo records rather than freshly fetched; re-verify at the 2026-11-02 PL audit. Original capture + method notes follow.
  Surfaced 2026-08-02 (JM, across both batches; several sub-items are refinements of the 2026-07-30 CAGR idea, now folded here).
  **Why one entry:** five separate ideas all land on the same page cluster, all build on data the site already has, and shipping them piecemeal would mean five separate refresh/QA passes. Highest persuasion-per-effort in the backlog.

  - **(a) Dynamic out-of-sample validation — the strongest single build here.** Tab 1 already carries a **static** out-of-sample chart (regression fitted through end-2017 (slope 5.657), per the refit in commit 6604126, 2026-05-07, projected forward, overlaid with actual 2015–present). Make the **fit window draggable** so the reader chooses the training range and watches the extrapolation land. The reader does the convincing themselves.
    - **Source to verify + cite:** Mežinskis (Porkopolis) shows a fit through **2016** extrapolating to today, off by **~$14K** — statistically near-identical despite omitting the last decade. Locate the original and cite it.
    - **Anticipate, don't discover:** a draggable window will also surface windows where the fit is *poor* (very early data, or recent-only). On this site that's a feature — say so in the copy up front rather than look caught out.
    - **The refit history IS the argument for making this draggable.** DATA_AUDIT records that the original end-2014 cutoff gave slope 6.787 — dominated by the 2013 Mt. Gox rally on a small training sample — and over-projected by ~4x by 2025. Moving the cutoff to end-2017 gave 5.657 with near-zero out-of-sample bias. The site has already run this experiment; the feature just hands the dial to the reader.
  - **(b) Exponent survey + a reader-selectable exponent.** Different power-law proponents use different exponents, yielding materially different results. Document **what each uses and how they justify it**, then let the reader pick and see trend CAGR by decade.
    - **Known (a, b) pairs on the site — paired, because `a` and `b` trade off and neither is comparable alone:** canonical Porkopolis/Santostasi **(1.6×10⁻¹⁷, 5.77)** (DATA_AUDIT PL-1); Doubling Ladder's cited Porkopolis **(1.69×10⁻¹⁷, 5.763)** — its live self-fit display rounds to **5.76**; BitcoinPower.law **(10⁻¹⁶·⁴⁹³ ≈ 3.2×10⁻¹⁷, 5.68)**; OOS chart self-fit **(3.9×10⁻¹⁷, 5.657)** (fitted in-browser through end-2017; within 2% of canonical). **`a` not published by the source, so these cannot be paired or ranked:** naive full-series fit through 2026 (b **5.63**), b1m.io/Krueger (b **5.566**), bitcoinretirement.net (b **5.82**).
    - **Compare implied prices, never bare exponents.** `a` and `b` trade off. Worked example: bitcoinretirement.net has the HIGHEST exponent in the set (5.82) yet sits 2.0% BELOW canonical trend today, crossing above it by 2045 — because its `a` is lower. Ranking sources by exponent alone gets the ordering wrong. The survey must tabulate implied trend price at fixed dates.
    - **The real finding:** exponent choice barely moves *where we are* (all sources fitted to the same history agree within single digits today) and moves *where we're going* a great deal — the spread widens monotonically with horizon. Deviation from canonical Porkopolis: BitcoinPower.law -8.8% (2026) -> -14.6% (2045) -> -17.2% (2060); bitcoinretirement.net -2.0% -> +1.7% -> +3.4%. That asymmetry IS the risk-disclosure device.
    - **The two Porkopolis variants** in SITE_GUIDE (1.6e-17/5.77 in section 11 vs 1.69e-17/5.763 in the Doubling Ladder section) differ by only 0.66% today and 1.4% by 2060 — almost certainly two snapshots of the same source refitting over time, not a contradiction. No code change needed.
    - **The OOS chart is the only self-fit on the site.** Every other exponent above is used as a fixed canonical value; the out-of-sample chart is currently the *only* place that fits its own coefficients in-browser rather than using the canonical Porkopolis values (per DATA_AUDIT).
    - **The payoff framing (better than "here's the CAGR"):** *how much of the long-run return case rests on a parameter that is itself uncertain.* That is a risk-disclosure device in the site's register and exactly what an allocator looks for.
    - **ARCHITECTURE DECISION — do not skip.** `PL_A`/`PL_B` live in `shared/power-law-data.js` and feed ~20 tools. A reader-selectable exponent **on the Power Law page** is easy; site-wide is not. And JM's "update the exponent month to month" would **move the canonical trend line monthly** — breaking every shared scenario URL, every cached figure, and every as-of callout. **Recommended ruling:** exponent *explorer* on the Power Law page; canonical exponent stays pinned with a slow (annual) review, divergence disclosed.
    - **Fences:** does not own the fit-window caveat (Doubling Ladder does) and does not own withdrawal implications (retirement cluster does).
  - **(c) Days-to-double as a headline stat.** Currently days-to-double appears only in the Tab 1 tooltip and the projection widget. Promote it: **bitcoin is 6,420 days old** (genesis 3 Jan 2009; computed 2026-08-02), and at b=5.77 the doubling interval is **12.76% of its age → ~819 days ≈ 2.24 years**.
    - **The exponent sensitivity makes the point for (b):** 819 days at b=5.77 · 821 at 5.76 · 833 at 5.68 · 841 at 5.63 · 851 at 5.566. A ~4% spread on the headline number.
    - JM's original framing ("~6,000 days old, ~800 days") was close; use the computed figures.
  - **(d) Time above vs. below trend — CAUTION, it says the opposite of the intuition.** JM's idea was to show % time above/below trend "to give confidence about expected return to at or above trend." **The figure already exists** on the Doubling Ladder's verification register: over 191 months, **80 above / 111 below = 41.9% / 58.1%.** Bitcoin has spent *more* time below trend than above.
    - **Used naively as a confidence device this backfires.** The honest reading — already on the Doubling Ladder — is that mean log-deviation is **+0.014 (essentially zero)** because *a few violent overshoots balance many quiet undershoots.*
    - **The stronger, true framing:** *below trend is the normal condition; the returns arrive in bursts.* Which is a better argument for not selling during the quiet stretch than the one originally intended.
  - **(e) The power law breaking to the *upside*.** Mežinskis's point: bitcoin could turn exponential and break the power law upward, as the network's size and importance relative to fiat becomes unstable in a good way.
    - **Why it belongs:** the site already carries the *downside* break (falsifiability via floor breach) and Santostasi's ~2040 horizon warning. An upside-break section is the symmetric counterpart — and a site that will say "the model may break against us" earns the right to say "it may break for us."
    - **Historical analogues to test at build:** monetary regime transitions generally (JM suggested precious metals eclipsing prior money forms); technology S-curves.
  - **(f) Consistency sweep on the proportionality constant.** JM cites **~12.9%** (implies b≈5.70); the site variously says ~13%, 12.7%, 12.8%, 13.1%. Resolve into one stated figure or an explicit range tied to the exponent — this is (b)'s natural by-product.
  - **Also carries forward:** "bitcoin's growth is stable *and* scalable" — it can grow enormously in size and still hold the trend — as an explicit stated claim rather than an implication.

- [ ] **Power law in other metrics — hash rate, energy, addresses. Low priority.**
  Surfaced 2026-07-14. Extension, not a new page.
  - **Concept:** additional power laws beyond price — hash rate, energy, active addresses — as **sections on the existing Power Law (`/the-power-law`) or Metcalfe (`/bitcoin-and-metcalfes-law`) pages**. Explicitly not a new page.
  - **Check first:** what the Metcalfe address scatter already covers — the addresses angle may be substantially done.
  - **Cost to weigh:** each new series adds monthly-refresh surface. The maintenance tail is the reason this is low priority, not the difficulty.
  - **Sequencing note (2026-08-03):** if Power Law v2 happens, decide then whether this rides along or stays parked — v2 already adds refresh surface.

### Data & modeling assumptions

- [ ] **Stock-market comparator review — the "15% with dividends" question.** Data/assumptions review. **Contains a correction.**
  Surfaced 2026-08-02 (JM proposed raising the default stock-growth assumption to as high as 15% if dividends are reinvested).
  - **The correction, and it matters:** the site's figures **already include reinvested dividends.** BvSM's forward projection uses **S&P 500 TR 10.86%** and **NDQ-100 TR 16.26%** — "TR" *is* total return. `DATA_AUDIT` R-1 carries S&P long-run **real** return ~6.7% (Damodaran 1928–2024), likewise dividend-inclusive. So "we forgot dividends" is not the gap.
  - **What 15% actually is:** roughly the S&P's *post-2009* total return — a ~16-year window, not a long-run figure. Adopting it as the default would import a cherry-picked era.
  - **The worthwhile version:** add a selectable **"recent era (2009–present)" comparator** as a *stress test on bitcoin's case*. It's the strongest form of the sceptic's argument, and surfacing it is exactly the site's register. Conservative in the right direction — it makes bitcoin's edge look smaller, not larger.
  - **Affects:** `/bitcoin-vs-the-stock-market` primarily; check the sitewide real-returns preset (`STYLE_GUIDE §3.5`, `lcs.realReturns.preset`) and `DATA_AUDIT` R-1/R-3/R-4 for consistency.
  - **Verify at build:** current Damodaran long-run TR figures; the exact post-2009 window figure and its start date; whether NDQ 16.26% needs the same treatment.

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
  - **Cluster note (2026-08-03):** pairs with *Second-order effects of adoption* and *Deflation without fear* — same neutrality guardrail, adjacent arguments.

### Collateral & credit cluster

- [ ] **Bitcoin as pristine collateral — argument exploration + essay. Anchors the collateral cluster.**
  Surfaced 2026-07-30. Extended 2026-08-02. Timeliness: live product wave.
  - **Concept:** the emergent case the market hasn't priced — 24/7 liquidity, fully marked-to-market, fungible (vs real estate), verifiable, securable in multisig → better collateral → structurally lower rates and lender friction/risk.
  - **The sizing argument (added 2026-08-02):** roughly **80% of loans/debt is collateralized** — this converts "bitcoin is better collateral" from a qualitative claim into a **TAM**: this is the size of the market bitcoin is competing to collateralize.
    - **Verify at build:** the 80% figure is segment-dependent — US commercial bank lending, corporate bond markets and global secured credit differ wildly. Likely defensible for bank lending, likely *not* for total debt. Say which. Sources to try: Fed H.8, BIS credit statistics, SIFMA.
  - **The etymology (added 2026-08-02) — good opener:** collateral's pledge concept descends from Greek *hypotheke* (a pledge/deposit) → hypothecation; **rehypothecation** is pledging the same collateral again. Bitcoin's contribution is that a pledge can be *seen*: on-chain, marked to market, liquid, and verifiably not pledged twice.
  - **BLOCKING HONESTY FLAGS — both load-bearing:**
    1. **The rate claim runs against today's market.** Bitcoin-backed loans currently price **above** mortgages and often above unsecured corporate credit. The thesis is "lower over time"; the observable fact is "higher today." The page must explain the gap — regulatory capital treatment, rehypothecation/custody risk, lender cost of capital, novelty premium — and name what would have to change. That version survives an asset manager reading it; the assertion-of-endpoint version does not.
    2. **"Definitely not pledged twice" is conditional.** It holds for on-chain, self-custodied or visible-multisig collateral. It does **not** automatically hold for collateral at a custodian or exchange — which is where most institutional collateral actually sits. And proof-of-reserves without proof-of-liabilities is incomplete. The true claim is *"bitcoin makes verifiability possible,"* not *"bitcoin collateral is verified."*
  - **Register:** both — site Arguments/Numbers treatment (facts, mechanics, comparisons) + Substack for the "unrecognized-but-inevitable" thesis voice.

- [ ] **Margin-call / borrow-against-stack calculator — site tool (The Numbers).**
  Surfaced 2026-07-30. Collateral cluster.
  - **Concept:** loan amount, LTV, lender terms → the bitcoin price that triggers a margin call, stress-tested against house drawdown / power-law paths; compare offerings side-by-side.
  - **Prior art:** Strike's new borrow product has a calculator to review.
  - **Guardrails:** facts-not-signals; leverage content = elevated counsel attention; no lender recommendations — computed comparison only, PARTNERSHIPS_REFERRALS_POLICY applies.

- [ ] **Collateral/services company research + freshness pass — task, not a page.**
  Surfaced 2026-07-30. Collateral cluster.
  - **Research:** current offerings — AnchorWatch, People's Reserve, Strike borrow-against-bitcoin, **Debify** (L1 multisig — added 2026-08-02), "Horizon" (disambiguate at research — several bitcoin cos use the name).
  - **Purpose:** (a) keep borrowing/services-adjacent explorations current (freshness = credibility); (b) partner-candidate notes per PARTNERSHIPS_REFERRALS_POLICY (no coverage-for-consideration entanglement; research and partnership tracks stay separate).
  - **Output:** research notes + a freshness diff for affected pages.

- [ ] **Real estate as the wedge — People's Reserve / REIT angle.**
  Surfaced 2026-07-30. Collateral cluster; extends the Bitcoin-vs-Real-Estate cluster.
  - **Source:** CJKonstantinos (People's Reserve founder) on a recent podcast — significant inbound interest from REITs and real-estate syndicates in bitcoin-backed structures.
  - **Explore:** real-estate holders as a conversion audience (a "wedge" from RE toward bitcoin); possibly an essay angle + a page extension rather than a new page.
  - **Verify at build:** locate/cite the podcast episode. Partnership-adjacent — same separation discipline as the research task above.

- [ ] **Can there be credit in a bitcoin-denominated world? — essay. The cluster's third leg.**
  Surfaced 2026-08-02.
  - **Concept:** whether a credit system can or should exist in a bitcoin-denominated economy. Completes the arc: *pristine collateral* = the asset · *bitcoin-backed credit* = today's market · *this* = the endpoint.
  - **Why it earns its place:** it directly answers the standard objection that deflation kills lending — the strongest routine critique of the bitcoin monetary thesis. Answering it well is worth more than another bull argument.
  - **Tightly coupled to:** *Deflation without fear* (below). **Open question: one piece or a deliberate two-parter?** Decide at drafting; written separately they will overlap heavily.
  - **Terminology:** use **"bitcoin-backed credit"** over Saylor's "digital credit" (see MSTR entry) — more precise, and it links the cluster together.

### Financialization cluster

- [ ] **MSTR / Strategy — the examination. Discharges the STRC scope fence.**
  Surfaced 2026-08-02 (JM, both batches).
  - **Why flagged:** `STRC_BELOW_PAR_DESIGN.md` §6 fences *"Not the MSTR/mNAV examination (separate backlog idea; share no more than a cross-link)"* — **but that backlog idea did not exist.** This entry creates it and closes the dangling reference.
  - **The angles JM named:**
    - **S&P inclusion as a passive bid.** If/when MSTR enters the major indices, index demand creates a premium and a capital-raising flywheel. **Both-ways treatment required:** index flows are largely one-time rebalance events, not a perpetual bid, and inclusion creates symmetric **forced selling on removal**. *Verify current status* — eligibility has hinged on GAAP earnings under fair-value accounting (ASU 2023-08); do not assume.
    - **Bear-market criticism is not news.** The pile-on during bitcoin drawdowns is as unremarkable as the drawdown itself. Pairs with `STRC_BELOW_PAR_DESIGN` §10(b), which already makes the criticism-is-bear-correlated point.
    - **A young strategy, not yet assessable.** It needs a full bull *and* bear before a verdict is fair. **This is the most defensible frame on the page** — same evidence-grading posture Bull & Bear Cycles used.
    - **Balance-sheet comparison vs. Strive/SATA (ticker to confirm — ASST?).** Strive carries no debt; MSTR does, which may push Strategy toward retiring some. **Honest finding to state:** "no debt" is a *snapshot*, not a structural property — and zero debt also means no leverage-driven BTC-per-share accretion. It's a trade-off (cleaner risk / slower accumulation), not strictly cleaner positioning.
    - **Terminology:** Saylor calls the space "digital credit"; **"bitcoin-backed credit" is the better term** and links this piece to the collateral cluster.
  - **BLOCKING VERIFICATION — "the principal never comes due."** The stack has two halves that behave completely differently. **Convertible senior notes have maturities and holder put dates** — principal absolutely can come due. **The perpetual preferreds (STRK/STRF/STRD/STRC) have no maturity**, and dividends are payable only when declared. The accurate claim is *"the preferred stack never matures,"* not *"the principal never comes due."* Stated loosely this costs credibility with exactly the audience the site is built for.
  - **The analytical device — Hamilton Helmer's Seven Powers on MSTR (credit Helmer by name, house habit).** Preliminary read to test at build: plausible **Counter-Positioning** (incumbents structurally *cannot* hold BTC on balance sheet — accounting, mandate, career risk), **Scale Economies** (cheaper capital at size), **Branding** (Saylor), possibly **Cornered Resource** (index/capital-market access). Almost certainly absent: **Network Economies, Switching Costs, Process Power**. **The finding worth writing:** most of the powers it does have are *conditional on mNAV > 1* — not durable moats but a state. Original, defensible, and neither bull nor bear propaganda.
  - **Related framing:** MSTR could become the most valuable company in the world while being *a repository of capital*, not a killer app like Apple. Honest, and it's the frame that makes the Seven Powers analysis land.
  - **MAINTENANCE COLLISION:** BFI Tab II already ships a "Strategy (MSTR) at a glance" card and `MONTHLY_REFRESH_CHECKLIST §7` already maintains BTC held / mNAV / shares outstanding / ATM status. An MSTR page must **relocate or reuse** that card — not duplicate the refresh surface.
  - **Guardrails:** single-security coverage = counsel attention; no-position / no-compensation disclosure line (reuse the STRC page's, authored fresh there); the flagship/financialization prominence fence applies.

- [ ] **Three-track scenario comparison — extend the BFI calculator, do NOT build a new page.**
  Surfaced 2026-08-02.
  - **JM's idea:** compare owning **bitcoin** vs **STRC** vs **Treasuries** over time; bitcoin "wins" over ten years but less reliably over short horizons, and best when entered at the low end of the channel; STRC beats Treasuries but carries real risks (below par, company/management risk, dividend suspension); reader sets risks with sliders and runs scenarios, randomised by which risks hit.
  - **FINDING — most of this already exists.** `/bitcoin-fixed-income`'s calculator already carries `pa` = incomePath (`strc | sata | treasury | igcorp`), `st` = stressPreset (`base | mild | mreit | winter`), three Power-Law growth scenarios (`sc`), and a dynamic "income path's case is weaker/fair/stronger" verdict that already flips (weaker at 15yr default; stronger at Bitcoin-winter + 4yr).
  - **The genuinely net-new part, and it's the better idea:**
    1. **Randomised risk draws** instead of fixed stress presets — dice-roll below-par / dividend-suspension / management-risk events per run and show a *distribution* rather than one path.
    2. **Entry-point-in-the-channel as an explicit axis** — JM's instinct that entering near the floor changes the ranking is not currently exposed anywhere.
    3. **Dramatise the short-horizon flip** the calculator already discovers but presents quietly.
  - **PRECEDENT DECISION — flag before building.** Monte Carlo has been a deliberate site-wide *no*: `RETIREMENT_CALCULATOR_DESIGN_22` §3.6 states the scenario grid *"is **not** a Monte Carlo."* Randomised risk draws would be the first breach. Worth doing — but it's a precedent, not a feature, and it should be decided consciously and then applied consistently.
  - **Cross-links:** `/bitcoin-fixed-income` (the host), `/strc-below-par`, the retirement stress test.

### Tools & suite plumbing

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

- [ ] **"Sell, Borrow, or Wait?" — funding a real-world goal from a stack.**
  Surfaced 2026-07-14. New page, sequenced after **How Much Cash?**.
  - **Concept:** one concrete goal (house deposit, car), three strategies, all simulated on the channel: **sell at strength** (Disciplined Rebalancing's zone logic), **borrow** (the BAS math), or **delay the purchase** (Wait or Deploy Now's regime logic). The reader brings a goal, not a market view.
  - **Why this framing:** deliberately reframed from "when to sell" so it **triangulates** Borrowing Against Your Stack (`/borrowing-against-your-stack`) rather than competing with it. A "when to sell" page would duplicate DR and undercut BAS; a "fund this goal" page uses both as inputs.
  - **Cross-links:** DR (`/disciplined-rebalancing`), BAS (`/borrowing-against-your-stack`), WODN (`/wait-or-deploy-now`).
  - **Open design question — settle at spec time:** own page (lean) vs. an extension of Disciplined Rebalancing. Decide before drafting; the answer changes the scope substantially.

- [x] **What Daily Conviction Bought — daily-conviction DCA tool (The Numbers).** → shipped as `what-daily-conviction-bought` (`/what-daily-conviction-bought.html`) in `1601a05`, 2026-08-05. Full record in **SITE_GUIDE §43**.
  - **SHIPPED 2026-08-05.** Retrospective daily-DCA backtest: pick a start date + daily amount → BTC accumulated · total invested · value today · multiple · longest underwater stretch · deepest drawdown, plus a contributions-vs-value chart. Ports `scripts/thirty-a-day-chart.ps1` (log-linear daily interp of `PL_DATA`); parity gate passed exactly (crossing 2024-11-19 / $86,400 / day 2,880; drawdown −73.3%; latest $104,970 in / 11.3447 BTC). All six collision fences honored via cross-links (Doubling Ladder / Wait-or-Deploy / Power Law). Zero added refresh surface (reads shared `PL_DATA`).
  - **v1.1–v1.2 SHIPPED 2026-08-06** (one merge; JM's additions + preview audit): (1) "If the habit continued" forward scenario block — now a **two-band planning range (floor → trend)** after the v1.2 upper-demotion (upper excursions are brief spikes, per RETIREMENT_CALCULATOR_DESIGN's floor-vs-upper asymmetry; upper is a caption clause + Bull-&-Bear link, no `$` figure), with a `?stack=`+`?dca=` handoff into The Bitcoin Retirement and a humility clause linking the Power Law caveats; (2) an 8-card stat grid in four pairs, "Value"→"Current value", and a NEW **Annualized return** card = money-weighted **IRR** (~38%/yr legend, not the ~22% naive CAGR) with a live CAGR-contrast tooltip; (3) a Peak-value stat ("visible only in the rearview mirror"); (4) a rich chart hover/tap tooltip (date · contributions · value · BTC held · multiple); (5) BTC-bought copy reframed as the second-decade insight. Narrowly amends R1 (banded scenarios allowed; sustainability stays the retirement cluster's) — SITE_GUIDE §43. Parity untouched.
  - **v1.1 candidate STILL DEFERRED — worst-day / cycle-top start presets.** After v1.1, JM still holds these out: no cycle-top framing anywhere; only neutral convenience presets shipped (Jan 2017 / 5 years ago / 1 year ago). Adding cycle-top chips (e.g. "started at the Nov-2021 top") is the natural next candidate.
  - **Essay-edit reminder for JM:** the page links the Bitcoin Exit Substack essay; the essay still needs its reciprocal link back to the tool (edit post-launch — the essay↔page pair, STRC precedent).
  - **Original capture notes below.**
  - **Concept:** don't retell the $30/day legend — recompute it live: pick a start date + daily amount → BTC accumulated, total inputs, value today, multiple. The anecdote generalized into an instrument. Full price history, house live-compute conventions.
  - **Verify at build:** source the original anecdote (arithmetic dates it ~2023: $30/day from 2017 ≈ $66K inputs at ~6 yrs; run to 2026 ≈ $105K in — the live recompute IS the upgrade).
  - **Collision fences:** exponential-blindness belongs to the Doubling Ladder; lump-sum-vs-DCA belongs to Wait-or-Deploy — scope to the conviction-DCA computation only, cross-links do the rest.
  - **Seed exists (2026-08-03):** `scripts/thirty-a-day-chart.ps1` — sim + chart computed from `PL_DATA`, parameterized `-Daily`/`-StartDate`, log-linear daily interpolation. Written for The Bitcoin Exit's one-off chart but built to generalize. The essay is now live and will link the tool when built — the ready-made re-promotion moment.

- [ ] **Retirement-funds-to-bitcoin mechanics — SCOPING QUESTION (counsel-gated).**
  Surfaced 2026-07-30. Open question — decide at promotion time; do not build ahead of the counsel read.
  - **Why flagged:** the action-steps content ("how to actually move retirement funds") sits closer to the advice line than anything on the site, incl. STRC.
  - **Split:** JM's first-person experience → the Bitcoin Exit essay (memoir). Site version IF ANY = facts-only survey of existing mechanisms (self-directed IRA, ETF-in-IRA, rollover paths, custody trade-offs), US-flagged, heavily disclaimed, hard counsel gate — likely better as an extension of the retirement cluster than a standalone page.
  - **STATUS 2026-08-03 — memoir half discharged.** The first-person half shipped as **The Bitcoin Exit** (published 2026-08-03; see Promoted / shipped). What this entry still tracks is the *facts-only site survey* — which remains the open, counsel-gated question. Publishing the memoir does not move the counsel gate on the site version.

### Thesis, arguments & essays

- [ ] **The Big Long — the paper-vs-physical thesis (Darkside). Substack-first umbrella; multiple pieces.**
  Surfaced 2026-08-02. Credit **@DarkSide2030** by name — already in the credited macro/philosophy circle (`X_STRATEGY_PLAYBOOK` §6), so crediting is house habit *and* a relationship-layer win.
  - **The sub-claims, deliberately separated because they are not equally strong:**
    - **(a) The derivatives complex needs borrowable float.** Futures markets require the underlying to be freely loanable, longable and shortable; as that breaks, the machinery strains.
    - **(b) Paper → physical flight.** As it breaks, a flood from custodial/paper bitcoin into self-custody. Most participants currently see no difference between physical and paper bitcoin.
    - **(c) Delivery asymmetry vs gold.** You cannot take delivery of $100M in gold — certainly not in five minutes — but you can in bitcoin. Gold *requires* the paper/IOU layer; bitcoin does not.
    - **(d) The 2008 counterfactual.** Bitcoin would have been the exit for economic participants in 2008; instead a trillion dollars was printed overnight. In the next crisis, physical bitcoin *is* the exit — because bitcoin is a parallel economy, not merely another asset. **First time everyone has a viable exit.**
    - **(e) Fiat and bitcoin are ultimately incompatible.** They coexist for a period but not indefinitely; bitcoin's advantages become progressively obvious to people, institutions and governments — game theory does the rest. Bitcoin as the replacement for *both* fiat and gold.
    - **(f) Perpetual futures should trade at a premium — and sometimes don't.**
  - **BUILD OUTWARD FROM (f), NOT FROM (a).** Funding rates are publicly measurable and persistently negative episodes are documented (Coinglass and similar) — **(f) is the one sub-claim with a hard empirical spine.** By contrast **(a)/(b) are the weakest empirically** and are load-bearing for everything else:
    - Gold's paper-to-physical ratio is documented (LBMA/COMEX). **There is no credible published bitcoin equivalent**, and spot ETFs hold audited, *allocated* bitcoin — not the gold-unallocated-claim situation.
    - **Required discipline:** define "paper bitcoin" precisely; separate ETF (allocated/audited) from custodial IOU and rehypothecated derivative collateral; rest the directional argument on the *demonstrated* custody record — **Mt Gox, Celsius, FTX** — rather than an unverifiable multiple. That version is more persuasive to a sceptic, and it is the only version consistent with the house rule that the case needs no embellishment.
  - **SPLIT DECISION at drafting:** **(e) is arguably the singularity umbrella's thesis, not this piece's.** Decide the boundary before writing or it gets written twice.
  - **Check before drafting:** whether the existing bitcoin-vs-gold material already covers (c).

- [ ] **A new asset class / the paradigm layer — grand-thesis essay (Substack-first). "Singularity" umbrella.**
  Surfaced 2026-07-30. Extended 2026-08-02.
  - **Concept:** bitcoin as a category event like oil or electricity — not an asset/investment/speculation but an economy-wide (civilizational) transformation.
  - **Singularity kinship (per the merge check):** JM flags kinship with a "Bitcoin is a Singularity" idea. **No existing Singularity backlog entry as of 2026-07-30**, so this is created as the umbrella with two angles — the asset-class lens + the singularity framing; fold any future Singularity capture into this entry rather than duplicating.
  - **Punctuated equilibrium (added 2026-08-02) — more than a merge; it is in TENSION with the site's spine.** The power law says growth is smooth, proportional, sustainable. Punctuated equilibrium (Eldredge/Gould) says change is long stasis then rapid jumps. **Likely resolution to test:** *adoption* is punctuated (individuals → corporations → institutions → nation-states, each a step change) while *price* is smooth. But that is a design question, not a given. Handled well it's a real intellectual contribution; handled loosely it reads as two incompatible metaphors on one site.
  - **"Bitcoin stands alone" (added 2026-08-02):** the positive claim about bitcoin's uniqueness. This pushes the existing *why altcoins are stillborn* sub-topic toward being **its own piece** — "stands alone" is the affirmative version, "altcoins are stillborn" the negative; they are one argument told two ways.
  - **Sub-topic (in or out):** *why altcoins are stillborn* — see above; leaning out, decide at drafting.
  - **May also absorb:** The Big Long's sub-claim (e), fiat/bitcoin incompatibility — settle the boundary at drafting.

- [ ] **Bitcoin's CAGR as the new hurdle rate.** Arguably the highest-value idea in the backlog **for the asset-management ambition specifically**.
  Surfaced 2026-08-02.
  - **Concept:** the corporate-finance framing. If bitcoin's trend CAGR is X%, any project or investment returning less than X% destroys value relative to simply holding bitcoin. **This is how a CFO and an allocator actually think** — it makes the bitcoin case in the audience's own native language, with no ideology required.
  - **Explanatory power:** it accounts for treasury-company behaviour (why hold cash, why buy back stock, why issue against the stack) without appeal to conviction — and it generalises the opportunity-cost argument that runs implicitly under most of the site.
  - **Two counters the entry must carry:**
    1. **Hurdle rates are risk-adjusted.** A naive CAGR comparison overstates the hurdle given bitcoin's volatility — needs a vol- or Sharpe-adjusted treatment to be honest.
    2. **The hurdle declines over time** by the Doubling Ladder's own structure (trend CAGR ~28% today → ~14% in 2045 → ~10% in 2065, per the retirement calculator's live computation). That is itself the interesting finding, not a caveat to bury.
  - **Placement — open:** own short piece vs. a section inside an existing page. Natural homes: `/the-power-law` (Power Law v2), `/bitcoin-vs-the-stock-market`, or standalone.

- [ ] **Second-order effects of bitcoin adoption — essay.**
  Surfaced 2026-08-02.
  - **Concept:** what follows once adoption is assumed — monetization of debt goes away; government can no longer issue debt at will; reliance shifts to taxation only; the state contracts as a mechanical consequence.
  - **NEUTRALITY GUARDRAIL — load-bearing, same as the fiscal canary.** "Government naturally gets smaller" is a politically-coded conclusion. The version that survives an institutional reader presents the **mechanism mechanically** (no debt monetization → hard budget constraint) and carries the **counter-case at full strength**: counter-cyclical spending, social safety nets, war finance, and the transition path itself. Absent that, it reads as libertarian advocacy and forfeits the allocator audience the site is built for.
  - **Clusters with:** the fiscal canary, deflation without fear, credit in a bitcoin-denominated world.

- [ ] **Deflation without fear — Foundations-adjacent essay (Substack).**
  Surfaced 2026-07-30.
  - **Concept:** why deflation is not scary in a bitcoin-denominated world; why "money hoarding" fears don't apply.
  - **Open — JM to brief:** the argument set is deliberately not captured yet; JM to brief the reasons when promoted.
  - **Coupling note (2026-08-03):** tightly bound to *Can there be credit in a bitcoin-denominated world?* — the "deflation kills lending" objection is the hinge both pieces turn on. Decide one piece vs. two-parter at drafting.

- [ ] **The agentic economy runs on bitcoin — grand-thesis essay (Substack-first).**
  Surfaced 2026-07-30.
  - **Concept:** AI agents as a new demand front — machine-to-machine payments want money that is global, universal, borderless, permissionless, neutral, and machine-custodiable — properties dollars/banking rails lack.
  - **Timeliness:** agentic payments are a live industry topic.
  - **Maturation path:** revisit for a site Arguments page if/when concrete rails (Lightning / L2 agent payments) give it an evergreen factual spine.

- [ ] **Value creation vs. value capture — theme essay (Substack).**
  Surfaced 2026-07-30. JM flags as a personally favourite theme; good candidate for the essay cadence between heavier builds.
  - **Concept:** the creation/capture lens applied across bitcoin itself, bitcoin companies, and AI companies (the alternative-investment du jour).

---

## Promoted / shipped

- [x] **The Bitcoin Exit** — Substack essay on conviction vs. the act of stacking. → **published on Substack 2026-08-03:** https://lastcoinstanding.substack.com/p/the-bitcoin-exit
  Shipped as first-person memoir per the counsel-gate split; the generic retirement-mechanics survey remains a separate, still-gated backlog item (see *Retirement-funds-to-bitcoin mechanics* above — its memoir half is now discharged, the site survey is not).
  - **Recomputed the $30/day story from PL_DATA** — $86,400 in / day 2,880 / $1M crossed 2024-11-19; ~$715K in the drawdown since — which matched the widely-reported legend within rounding (report, don't force). The recompute + chart seed live in `scripts/thirty-a-day-chart.ps1` (see *What Daily Conviction Bought*, its ready-made tool artifact).
  - **Canonical record + full text:** `claude/THE_BITCOIN_EXIT_PUBLISHED.md` (project-only doc — hand over as a file to edit).

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
