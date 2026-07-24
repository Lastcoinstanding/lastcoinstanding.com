# Design Doc — Discount, or Premium? (`/discount-or-premium`)

_Created 2026-07-23. Promoted from the backlog's "reversion CAGR" idea (JM placement call: standalone
exploration; JM title direction: two-sided and evergreen, not pushy). This page is also the designated
**pilot for the content pipeline** — the appendix carries the X thread and video script, built on the
verified numbers below. House workflow: this doc → Code-tab build prompt → JM review → ship per
`NEW_PAGE_CHECKLIST`._

---

## 1. Thesis and why this page

Most people think in CAGR; the Power Law doesn't move in CAGR terms — it implies a *declining* growth
rate along a rising trend, and a price that oscillates around it. This page gives the reader one clean,
two-sided lens: **where is bitcoin right now relative to its long-run trend — at a discount or a
premium — and what does *returning to trend* imply for the years ahead?**

- **Below trend** (as now), reversion implies an *elevated* near-term CAGR — the "discount" insight.
- **Above trend**, the same arithmetic implies a *depressed* or negative near-term CAGR — the honest
  mirror that most "it's cheap!" content never shows.

The two-sidedness is the whole editorial point (and JM's title requirement): this is an instrument, not
a pitch. It would have said harsh things at every past top, and the page *shows that* (§5). Evergreen by
construction — the page stays truthful and useful at 0.4× and at 3×.

**Title:** H1 **"Discount, or Premium?"** — joins the house question-title family ("Wait, or Deploy
Now?", "How Much Cash?", "Lump Sum or Ladder In?"), comma included per the family pattern. Evergreen,
two-sided, zero push.
**SEO title tag (hybrid, per the SEO-pass convention):**
`Is Bitcoin at a Discount or a Premium? — Mean Reversion & CAGR`
**Meta description:** "Where bitcoin sits against its long-run Power Law trend right now — discount or
premium — and the CAGR that reverting to trend would imply, at any speed you choose."
**Slug:** `/discount-or-premium`. **Category:** The Numbers → Models & Trends. `interactive: true`,
**no `calculator_tile`** (market-state explorer, no personal inputs — same posture as the Doubling
Ladder / Metcalfe / Heatmap). **Tool-framing strip: YES** (decision-implying).

## 2. The math (nothing new — all from the shared module)

All quantities compute live from `shared/power-law-data.js` (canonical `PL_A = 1.6e-17`, `PL_B = 5.77`,
`GENESIS_TS`, `PL_DATA`, `fetchTodayPrice()` with latest-sample fallback). No new constants, no new
data dependencies, nothing added to the monthly refresh beyond the automatic.

- Trend: `T(d) = PL_A · d^PL_B` (d = days since Genesis).
- Multiple of trend: `m = P₀ / T(d₀)` — **the page's central number**; `m < 1` → discount `(1−m)`,
  `m > 1` → premium `(m−1)`.
- Implied reversion CAGR to horizon `y` years: `CAGR_rev = (T(d₀ + 365.25·y) / P₀)^(1/y) − 1`.
- At-trend baseline (counterfactual bought-at-trend, and also the "multiple never changes" case):
  `CAGR_trend = (T(d₁)/T(d₀))^(1/y) − 1`.
- Uplift (or drag): `CAGR_rev − CAGR_trend` — positive below trend, negative above. Same formula both
  sides; no branching.

**Verified reference values (computed 2026-07-23; anchor = latest PL_DATA sample $61,928 @ 2026-07-13;
live spot replaces this at page load):** trend today ≈ **$147.8K**; multiple **0.42×** (−58%); implied
reversion CAGR **+229% / +111% / +81% / +67% / +59%** at 1–5y vs at-trend **~38→34%**; Dec-2030
horizon: **63% vs 34%**. Note for QA: 0.42× equals `PL_FLOOR` — the page is currently sitting *on* the
historical floor (see §6 guardrails; verify against live spot at build, which will differ from the
monthly sample).

## 3. Page structure

1. **Hero.** H1 + subtitle in house voice. Draft subtitle: *"Bitcoin runs above and below its long-run
   trend — sometimes far above, sometimes far below. This page tells you, live, which one is true right
   now — and what returning to trend would mean."*
2. **Live status strip (the emblem).** Three figures, computed live, two-sided copy that flips
   automatically on the sign of `m`: current price · trend today · **multiple of trend** with the word
   *discount* or *premium* and the percentage. As-of caption per house convention (live spot; labeled
   "latest monthly data" on fallback — never "live" when it isn't).
3. **The interactive: "If it returns to trend…"** A single horizon slider (6 months – 5 years) driving:
   - the **implied CAGR** readout (large), beside the **at-trend baseline** readout (same size — the
     comparison IS the content), and their difference labeled *uplift* (below trend) / *drag* (above);
   - a small chart of implied CAGR vs horizon (the full curve, so the slider position is seen in
     context — fast reversions are visibly extreme, the curve flattens toward the trend slope);
   - a permanently-visible **"and if it never reverts"** line: multiple unchanged → you earn the trend
     slope (~34%/yr today, declining) — the assumption-free floor case… plus the honest sentence that
     the multiple can also *fall further*: the floor is historical, not guaranteed.
   Playground principle (§3.5): slider, readouts, and chart in one viewport.
4. **The honesty backtest: "What this lens said at past extremes."** Static-feeling but live-computed
   table (from the model, not hardcoded): Dec 2013 (12.0×): −76/−23/+9 · Dec 2017 (6.46×): −71/−30/−6 ·
   Nov 2021 (2.82×): −45/−10/+6 · Oct 2025 ATH (1.12×): +25/+31/+32 · Today (live). One line of copy:
   *"The same arithmetic that reads high today read deeply negative at every major top. That is what an
   instrument, rather than a pitch, looks like."* (Register: state it once, no self-congratulation —
   de-tell discipline.)
5. **Context: why CAGR falls over time.** Short section — the trend's slope itself declines (34% →
   ~28% → ~23% across the 2030s). Two jobs: pre-answers "why not extrapolate today's CAGR forever," and
   is the **merge point for the backlog's "Bitcoin's CAGR head-on" lens** (declining-but-still-superior
   vs. other assets) when that gets built — design the section to grow.
6. **FAQ block** (ship with it, per the new site pattern + FAQPage schema; drafts in §7).
7. **Sources & disclosures.** Porkopolis credit via The Channel link (house pattern: pages *applying*
   the framework link to The Channel rather than re-crediting); model-not-destiny language; link the
   Power Law caveats.

**Related (bidirectional):** The Power Law (the model), Bull & Bear Cycles (the cycle context around
trend), Wait or Deploy Now (the entry-decision sibling — this page is the *return* lens, that one is
the *entry* lens; cross-link explicitly), The Doubling Ladder (Deviation Wave = the same oscillation,
peak-focused).

## 4. What this page is NOT (scope fences)

- **Not a forecast.** Reversion is a *user-selected assumption*; the tool computes its arithmetic
  consequence. The never-reverts case is permanent UI, not a footnote.
- **Not an entry-timing signal.** No "buy zones," no green/red coloring of the multiple itself.
  Anti-timing framing per the trilogy discipline; the tool-framing strip carries the standard language.
- **Not a new model.** Zero new coefficients; strictly the canonical Power Law re-expressed in CAGR
  terms.

## 5. Guardrails (§1.5 discipline, enumerated for build QA)

- Implied CAGR **never displayed without** the at-trend baseline beside it and the never-reverts case
  visible. The 1-year row (+229% today) must always render inside the curve context, never as a
  standalone headline.
- The word *discount* appears only when `m < 1`; *premium* only when `m > 1`; near-trend (0.95–1.05×)
  copy says *"roughly at trend"* and the uplift row reads ~0 — no manufactured drama at the boundary.
- **At-the-floor honesty (current state):** when `m` ≤ PL_FLOOR·1.05, a visible one-liner: *"Bitcoin is
  currently at the bottom of its historical channel. The floor has held for the length of the record —
  which is evidence, not a law."* Link the Power Law caveats. (This also future-proofs: the line
  disappears when the state does.)
- Backtest table is computed, not asserted; dates/multiples must match the How-Much-Bitcoin preset
  annotations (12.1×/6.4×/2.8×/1.12× family figures — reconcile the 12.0 vs 12.1 rounding at build
  against the shared data, and match whichever the site already publishes).
- Fallback-price labeling per the 2026-07 honesty fix ("latest monthly data," never "live").

## 6. Build & ship notes

- **Assets:** `src/discount-or-premium.njk` + `_pageassets/discount-or-premium-{head.html,css,js}`;
  `dp-` class prefix; mixed-content width tier; reads shared `power-law-data.js`. Full ship list per
  `NEW_PAGE_CHECKLIST` (explorations.json + group "Models & Trends", sitemap @0.9, llms.txt, homepage
  concept card + Latest, updates.json, OG card, related back-links, SITE_GUIDE section, FAQ +
  FAQPage/WebApplication schema in head).
- **OG card:** product-forward (the live status strip IS the argument) → register in MONTHLY_REFRESH §6
  regen list. If deferring the OG pipeline, brand-forward placeholder first.
- **Carousel slide:** pending per house norm; tonal direction TBD later (candidate register: structural
  observation — oscillation around a persistent line — but brief it separately; don't rush it).
- **URL state:** `?y=<horizon-years>` only (page-local; the multiple is market state, not user state).

## 7. FAQ drafts (visible text = FAQPage schema text, verbatim)

**Is bitcoin at a discount or a premium right now?**
The page computes it live: bitcoin's price divided by its long-run Power Law trend. Below 1.0× is a
discount to trend, above is a premium — and the answer changes over time, which is why this page
computes rather than asserts it.

**What is mean reversion in bitcoin terms?**
Bitcoin's price has oscillated around a remarkably steady long-run trend for its entire history —
running far above it in manias and far below it in bear markets. Mean reversion is the tendency to
return toward that trend; this page shows what a return would imply mathematically, at whatever speed
you assume. It is a historical pattern, not a guarantee.

**What CAGR does reverting to trend imply?**
That depends on where price sits and how fast it reverts — which is exactly what the slider explores.
From a deep discount, reversion implies returns well above the trend's own growth rate; from a premium,
it implies returns below it, sometimes sharply negative. The same arithmetic, both directions.

**Is a big discount a buy signal?**
No — and this page refuses to treat it as one. A discount can persist or deepen, the floor is
historical rather than guaranteed, and reversion timing is unknowable. What the page offers is honest
arithmetic about the possibilities, including the one where nothing reverts at all.

## 8. Verified numbers block (for build QA — recompute at build)

Anchor 2026-07-23, sample $61,928 (2026-07-13): trend $147,806 · multiple 0.4190× · discount 58%.
Reversion CAGRs 1–5y: 228.5 / 110.9 / 81.0 / 67.1 / 58.9%. At-trend 1–5y: 37.6 / 36.5 / 35.4 / 34.5 /
33.5%. Dec-2030: trend $536,977; 63.4% vs 34.1%. Backtest: 2013-12-04 12.00× (−76/−23/+9);
2017-12-17 6.46× (−71/−30/−6); 2021-11-10 2.82× (−45/−10/+6); 2025-10-06 1.12× (+25/+31/+32).
Trend-slope decline: 2026→30 34.5%, 2030→34 27.8%, 2034→38 23.3%.

---

# Appendix — Pilot content (create-once-distribute-everywhere)

_Publish AFTER the page ships; both point at `/discount-or-premium`. Numbers below use the verified
anchors — refresh against the live page on publish day (they move)._

## A. X thread (chart-first; sober; both-sided)

1. Bitcoin has spent 17 years oscillating around one long-run trend. Right now it sits at **0.42× that
   trend** — a 58% discount, and the bottom of its historical channel. Here's what that does and
   doesn't mean. 🧵 *(attach: the status strip / channel chart)*
2. Most people think in CAGR. The Power Law trend implies bitcoin's "baseline" CAGR is ~34%/yr today —
   and falling, by design, as it matures. That's the boring case: price keeps its current distance from
   trend forever.
3. The interesting arithmetic: if price *returns to trend*, the distance itself becomes return. From
   today's level, reversion within 3 years implies **~81%/yr**. Within 5 years, **~59%/yr**. Versus
   ~34–35% for someone who bought at trend. *(attach: implied-CAGR-vs-horizon curve)*
4. Before that reads as a pitch — run the same lens at past tops. Dec 2017, 6.5× trend: reversion
   implied **−71%/yr** over one year. Nov 2021, 2.8×: **−45%**. The arithmetic is symmetric. It says
   harsh things at premiums and generous things at discounts. *(attach: backtest table)*
5. What it does NOT say: that reversion happens, or when. The discount can persist — you'd earn the
   trend slope. It can deepen — the floor has held for the whole record, which is evidence, not a law.
   All three cases are on the page.
6. That's the point of building it as an instrument instead of a take: you pick the assumption, the
   math shows its consequence, and every number is reproducible from the model on the page.
7. Explore it yourself — slider, live data, no paywall, no ads: lastcoinstanding.com/discount-or-premium

## B. Video script (~10 min; JM prep format: purpose → key insights → demo → why I built it)

**Cold open (0:00–0:40).** Screen on the live status strip. "Right now, bitcoin is trading at 0.42
times its long-run trend — a 58% discount, and literally the floor of its historical channel. I built a
page that tells you, on any day, whether bitcoin is at a discount or a premium — and what returning to
trend would actually mean in the numbers everyone thinks in: CAGR. Including what it would have said at
the tops — because a tool that only flatters the present is marketing."
**Beat 1 — the lens (0:40–2:30).** The Power Law trend in one minute (link out for depth); the multiple
of trend as the one number; discount vs premium as its two signs.
**Beat 2 — the interactive (2:30–5:30).** Drive the slider live: 1y (extreme — say so), 3y, 5y; the
at-trend baseline beside it every time; the never-reverts line ("this is the no-assumption case: you
earn the trend's own slope, about 34% and declining").
**Beat 3 — the honesty backtest (5:30–7:30).** Walk the table: 2017 top −71%, 2021 top −45%, 2025 ATH
roughly at-trend. "Same arithmetic. If this page had existed in 2021 it would have told you reversion
implied negative returns. That's the test any 'cheap or expensive' claim should pass."
**Beat 4 — limits (7:30–9:00).** Reversion is an assumption; the floor is historical; the model can
break (what would falsify it — link the caveats). "The case doesn't need embellishing. At 0.42× the
honest arithmetic is striking enough."
**Close (9:00–10:00).** Why I built it; free, live, reproducible; go drag the slider. CTA to the page;
soft mention the whole site works this way.
**Short-clip moments:** the slider sweep with both readouts moving (Beat 2); the backtest-table reveal
(Beat 3); the cold-open status strip.
