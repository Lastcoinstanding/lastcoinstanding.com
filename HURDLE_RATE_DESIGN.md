# Bitcoin as the Hurdle Rate — Design Document

> **STATUS: APPROVED FOR BUILD (JM, 2026-08-06).** All §10 questions resolved. Page title **"The
> Bitcoin Hurdle Rate"**, slug `/the-bitcoin-hurdle-rate`. Build prompt: `HURDLE_RATE_BUILD_PROMPT.md`.


_Created 2026-08-06. Promoted from the backlog entry "Bitcoin's CAGR as the new hurdle rate"
(surfaced 2026-08-02), flagged there as "arguably the highest-value idea in the backlog **for the
asset-management ambition specifically**." House workflow: this doc → JM review → Claude Code build
prompt → JM review on preview → merge._

_JM rulings already taken (2026-08-06): **standalone page, not a section** on `/the-power-law` or
`/bitcoin-vs-the-stock-market`; **page first, Substack essay second** (inverting the Bitcoin Exit
order, because the claim is analytical rather than memoir); **both audiences on one page** — the
corporate/CFO lens and the personal-allocator lens, with the divergence between them treated as
content in its own right._

---

## 1. Editorial thesis

Every capital decision is a comparison against the next-best use of the money. Corporate finance
already has a name and a machine for this — the hurdle rate: a project that returns less than the
cost of capital destroys value and should not be done. The page's claim is that for anyone who
holds bitcoin, or could, **bitcoin's trend growth is the honest hurdle**, and most capital
decisions are being measured against the wrong one.

This is the site's argument translated into the audience's native language. Nothing about it
requires conviction, ideology, or a monetary thesis: it is opportunity cost, which every CFO and
every allocator already accepts as binding. That is precisely why it is worth building — it makes
the case to the reader the asset-management ambition needs, using a tool they already trust,
without asking them to adopt any belief first.

It also has explanatory power the site currently gets no credit for. Treasury-company behaviour —
why hold bitcoin rather than cash, why buy back stock, why issue debt against the stack — falls out
of a high hurdle mechanically, with no appeal to Saylor's conviction or anyone else's. An
explanation that predicts behaviour is worth more than an argument that praises it.

**The finding that makes it a page rather than a paragraph:** the hurdle is not a number. It is a
declining curve, and it must be matched to the horizon of the decision being made. Most of the
page's value is in that structure.

## 2. Audience and the two lenses

### 2.1 Both lenses, one engine

The arithmetic is identical for a company and for a person; only the inputs, the examples and the
frictions differ. So: **one shared engine, two lenses, selected by the `calc-mode-toggle`
(`STYLE_GUIDE §6.17`)** — the recipe explicitly exists for "two conceptually-paired views that
shouldn't be diluted into separate tabs," which is this case exactly.

| | **The Company lens** | **The Personal lens** |
|---|---|---|
| Reader | CFO, treasurer, board member, allocator | Individual holder with a capital decision |
| The question | Does this project clear the bar? | Does this use of money clear the bar? |
| Candidate uses | Capex, acquisition, buyback, debt paydown, cash held at money-market rates, R&D | Mortgage paydown, business investment, rental property, index fund, cash savings |
| Native rate | Project IRR / WACC | Loan rate, expected return, savings rate |
| Frictions | Corporate tax, covenants, accounting treatment, mandate, career risk | CGT on sale, income tax, mortgage deductibility, liquidity needs |

### 2.2 The comparison IS content — the third surface

JM's call, and it's right: the two framings are interesting to each other's audience. A section
below the calculator — **"Where the two lenses diverge"** — does the work the toggle can't, and it
is the part a reader will quote:

- **The company faces a mandate constraint the individual doesn't.** A CFO who understands the
  hurdle perfectly may still be unable to act — fiduciary duty, board tolerance, accounting
  treatment, career risk. This is the site's own counter-positioning observation (already noted in
  the MSTR backlog entry as plausible Counter-Positioning under Helmer's Seven Powers) arriving
  from the other direction.
- **The individual faces a concentration constraint the company doesn't.** A company can hold a
  volatile treasury asset across shareholders who chose the exposure; a person holding their whole
  net worth against a −73% drawdown may be forced to sell at the worst moment. The individual's
  effective hurdle is therefore *lower* than the arithmetic one, and honestly so.
- **They agree on the thing that matters:** both are being measured against a benchmark that most
  of them have never explicitly written down.

**The unifying insight (JM, 2026-08-06) — this is the section's spine, not another bullet.** The two
lenses are asking *the same question in different vocabulary*. §4.3(c) conditions the personal
hurdle on "can this capital wait?" The corporate expression of that identical condition is **is the
company cashflow positive?**

- **If it is not**, bitcoin's volatility eats into *survivability* — the company may be forced to
  realise a drawdown to meet obligations, which is the corporate form of selling at the bottom. The
  hurdle does not apply to them, and the page should say so directly rather than leave them to work
  it out. This is the single most useful sentence on the page for a sceptical CFO, because it is the
  site declining to make its own argument where the argument doesn't hold.
- **If it is**, volatility eats only into short-term *optionality* — the ability to act on
  opportunities during a drawdown — which is a real cost but a survivable one, and one that
  compresses over a long enough horizon.

**The second engine (JM, 2026-08-06) — build it in, with its limit attached.** For most companies,
bitcoin's trend CAGR is higher than the return on their own core business. Holding bitcoin on the
balance sheet therefore behaves as a second compounding engine running alongside the operating one.
The arithmetic is straightforward and the implication for treasury behaviour is direct.

> **BLOCKING LIMIT — this idea is one sentence away from the page's worst claim.** If bitcoin's
> return exceeds a company's return on its own operations, the naive conclusion is *stop reinvesting
> in the business*. That is the reductio §7 flag 1 exists to prevent and the strongest existing
> critique of treasury companies ("you are not a business, you are a levered fund"). The honest
> statement: **the hurdle applies to surplus capital at the margin, not to the capital that
> generates the cashflow in the first place.** A company that stops maintaining its core business
> stops producing the cash that buys the bitcoin — the strategy is self-consuming past the margin.
> Stated with the limit, this is an original and defensible finding; stated without it, it is
> advocacy and it fails with the exact reader the page targets.

**Copy register note:** no "turbo-charged," no "supercharged," no amplifying adjectives anywhere in
this passage. The arithmetic is dramatic on its own; adjectives make it read as a pitch and breach
`STYLE_GUIDE §5` (show, don't claim).

**This section is where the page earns its "both audiences" decision.** If it is thin, the two
lenses were the wrong call and one should be cut. Treat it as load-bearing at build, not as a
footer.

## 3. Why this is its own page

The backlog left placement open (a section on `/the-power-law` or `/bitcoin-vs-the-stock-market`).
Standalone, per JM, for three reasons worth recording:

1. **Audience reach.** This is the one page on the site addressed directly to the corporate-finance
   reader. Buried inside the Power Law page it is invisible to them; the Power Law page's own
   audience is people evaluating the model, not people evaluating a capital decision.
2. **Different job.** `/the-power-law` argues the trend exists. This page *assumes* the trend and
   asks what follows for a decision. Mixing "is the model true" with "what does the model imply"
   weakens both.
3. **It is a tool, not a claim.** The reader brings their own number. That needs an input surface,
   a chart and a verdict — not a section.

## 4. Math primitives

### 4.1 Horizon-matched trend CAGR — the core primitive

Under the canonical power law (`PL_A` 1.6×10⁻¹⁷, `PL_B` 5.77 — `DATA_AUDIT` PL-1), trend price
scales as `t^b` in days since genesis. The annualised trend growth over a horizon of `H` years,
starting at age `t` days, is:

```
trendCAGR(t, H) = ( (t + 365.25·H) / t )^(b/H) − 1
```

Computed 2026-08-06 (t = 6,424 days since 2009-01-03), **illustrative — recompute live at build**:

| Horizon | Trend CAGR | Total trend multiple |
|---|---|---|
| 1 yr | 37.6% | 1.38× |
| 3 yr | 35.4% | 2.48× |
| 5 yr | 33.5% | 4.24× |
| 10 yr | 29.7% | 13.4× |
| 15 yr | 26.8% | 35.1× |
| 20 yr | 24.5% | 80.0× |
| 30 yr | 21.1% | 312× |
| 40 yr | 18.7% | 938× |

**The editorial payload:** the hurdle *declines with the horizon of the decision*, because the
power law's growth rate decays with age. A three-year equipment purchase is measured against ~35%;
a thirty-year infrastructure asset against ~21%. Comparing every decision to a single headline CAGR
is wrong in a direction that matters, and being the site that says so is worth more than being the
site that quotes the biggest number.

**VERIFY AT BUILD — reconciliation with the existing figure.** The backlog cites the retirement
calculator's "trend CAGR ~28% today → ~14% in 2045 → ~10% in 2065." Recomputing as a *ten-year
forward* window reproduces this closely (29.7% / 15.0% / 9.8% at 2026 / 2045 / 2065), which implies
the retirement calculator's figure is a 10-year-forward measure rather than an instantaneous rate.
**Confirm against the actual implementation before publishing either number.** If the two pages
state different CAGRs for "today" without explaining the window, that is a credibility leak of
exactly the kind the site cannot afford. Whatever the finding, the page must state its window
explicitly wherever a CAGR appears.

### 4.2 The hurdle band — floor and trend, never a single line

A single trend number implies a precision the model does not have. Follow the house floor/trend
planning asymmetry (`RETIREMENT_CALCULATOR_DESIGN_22`; reaffirmed in the WDCB v1.2 upper-demotion,
`SITE_GUIDE §43`): present the hurdle as a **band from the floor path to the trend path**.

- Floor multiplier `PL_FLOOR` = 0.42 × trend (`DATA_AUDIT` BR-2).
- Because the floor is a constant multiple of trend, floor-to-floor growth *equals* trend growth.
  The band therefore comes entirely from **where spot sits today relative to trend** — the realised
  CAGR from today's spot to trend-at-horizon versus to floor-at-horizon.
- **Consequence to state plainly on the page:** the hurdle is higher when bitcoin is cheap relative
  to trend and lower when it is expensive. Entry position changes the bar. This is the same insight
  the backlog's three-track entry wanted exposed, arriving here for free.

**Upper channel is excluded**, per the WDCB v1.2 precedent — upper excursions are brief spikes and
a hurdle computed off them would be dishonest in the flattering direction.

### 4.3 Risk adjustment — the hard part, and the page's credibility test

The naive comparison ("your project returns 12%, bitcoin's trend returns 30%, so the project
destroys value") **overstates the hurdle**, and the backlog entry already flags this as counter #1.
Three candidate treatments, in ascending order of honesty:

- **(a) Caveat only** — state that the comparison is not risk-adjusted, move on. Cheapest. Not
  sufficient for this page: the whole point is to be legible to allocators, and an allocator's
  first objection is exactly this one.
- **(b) Sharpe-style adjustment** — compare `(r − rf)/σ` for both sides. Rigorous in form, weak in
  practice: the reader almost never knows their project's σ, and inventing one for them is worse
  than not adjusting. Available as a secondary readout at most.
- **(c) Access-conditioned hurdle — RECOMMENDED.** The honest reason the arithmetic hurdle is too
  high is not variance in the abstract; it is that **bitcoin's return is not reliably available at
  the moment you need the money**. A project returning 12% delivers roughly 12%. Bitcoin's trend
  return is realised only if you can hold through a drawdown the site already documents at −73%
  without being forced to sell. So the page asks the reader the question that actually determines
  their hurdle: *can this capital wait, and through what?* The floor path (§4.2) is the quantitative
  expression of the pessimistic answer.

Treatment (c) reuses machinery the site already has, requires no invented volatility inputs from
the reader, and produces the page's most defensible sentence: **the arithmetic hurdle is the
ceiling on the hurdle, not the hurdle.**

### 4.4 The tax and financing wedge — lens-specific, and easy to get wrong

A pre-tax project IRR compared to a pre-tax bitcoin CAGR is apples to apples. Several of the most
natural reader inputs are **not** pre-tax, and the page must handle the mismatch rather than let the
reader make a flattering error:

- **Personal lens — mortgage paydown.** Paying down a 6% mortgage returns a *guaranteed, after-tax*
  6%. Comparing it to a pre-tax, uncertain 30% flatters bitcoin twice over. The tool should ask
  whether the candidate return is pre- or post-tax and adjust one side accordingly.
- **Personal lens — selling bitcoin to fund the thing.** If the capital comes *out of* an existing
  stack, CGT is a real cost of switching and belongs in the comparison. If it is new savings, it
  isn't.
- **Company lens — cost of capital, not just IRR.** The CFO comparison is usually project IRR vs.
  WACC vs. the bitcoin hurdle, three-way. Debt-funded and equity-funded decisions differ.
- **Company lens — accounting treatment.** Under fair-value accounting (ASU 2023-08) bitcoin's
  swings hit earnings. That is not an economic cost but it is a real constraint on decisions, and it
  belongs in the divergence section (§2.2), not smuggled into the arithmetic.

**VERIFY AT BUILD:** current CGT treatment references stay generic and jurisdiction-flagged (US
default, per house practice). No tax advice; the tool exposes the mechanism, the reader supplies
their rate.

## 5. Calculator specification

### 5.1 Input surface

Shared across lenses:

- **Candidate return** — the number the reader is testing (slider + numeric entry; 0–50%).
- **Horizon** — years, 1–40, default 10. Drives §4.1 directly; this is the input most tools get
  wrong by omitting.
- **Pre-tax / post-tax** toggle on the candidate return (§4.4).

Company lens adds: cost of capital (optional, enables the three-way readout); funding source
(cash / debt / equity).

Personal lens adds: capital source (new savings / sale from stack) — enables the CGT wedge; and a
"can this money wait?" control feeding §4.3(c), expressed in the site's vocabulary rather than as a
risk-tolerance slider.

### 5.2 Hero output

**The hurdle curve.** X-axis: horizon in years. Y-axis: annualised return. Plot the trend hurdle as
a declining curve with the floor-path band beneath it, and the reader's candidate return as a flat
horizontal line. The reader sees immediately where their line crosses the band.

**Hero readout, facts-not-signals register:** the crossing point, stated as a fact.

> Estimated: a 12% return clears bitcoin's trend hurdle at horizons beyond about **N years**; below
> that, holding bitcoin has been the higher-returning use of the same capital *if the trend holds
> and the capital can wait*.

No verdict adjectives, no "you should." The two conditions are stated every time the verdict is —
they are not a footnote, they are part of the sentence.

### 5.3 Secondary stat strip

Total multiple at horizon (trend and floor); the same capital's terminal value under each choice;
the crossover year; and — the treasury-behaviour payoff — **the implied buyback/paydown comparison**
in the company lens.

### 5.4 Presets

Company: *money-market cash (~current rate)* · *typical corporate WACC ~9%* · *S&P 500 long-run TR
10.86%* (reuse BvSM's figure, `DATA_AUDIT` R-1 family) · *a strong project, 20%*.
Personal: *mortgage 6%* · *savings account* · *index fund 10.86%* · *rental property* (link
`/bitcoin-vs-real-estate`).

**Preset figures are dated constants** → add the page to `MONTHLY_REFRESH_CHECKLIST §2` if any
preset carries a live rate. Prefer presets that are stable or clearly labelled as-of, to keep the
refresh tail near zero (the backlog's standing concern).

## 6. The Question section — the argument, on-page

Short prose beneath the tool, in the site's essay register:

1. **What a hurdle rate is** — for the personal reader who has never used the term. One paragraph,
   no condescension.
2. **Why bitcoin is a candidate benchmark** — the trend, its horizon-dependence, and the honest
   statement that it is a model and not a law (link `/the-power-law`).
3. **What this explains** — treasury-company behaviour, without appeal to conviction.
4. **Where the two lenses diverge** (§2.2).
5. **What would break this** — §7.

## 7. Blocking honesty flags

Both load-bearing. The page does not ship without them.

1. **The overclaim this page is one careless sentence away from.** "Anything returning less than
   ~30% destroys value" implies nobody should ever do anything except hold bitcoin — a conclusion
   that is absurd on its face and would discredit the site with the exact reader it targets. The
   page must state the limits explicitly: the hurdle applies to *capital that can wait*, at the
   *margin*, for a holder who can survive the drawdown; it says nothing about capital with a
   deadline, a covenant, a payroll, or a liquidity need. Businesses also produce things other than
   returns.
2. **The hurdle is only as good as the model.** Every figure on this page inherits the power law's
   uncertainty in full — including the possibility of a floor breach or a break in either direction
   (`/the-power-law` §(e), shipped in v2). A hurdle derived from a model must carry the model's
   caveats on the same screen, not one click away. The declining-hurdle finding (§4.1) is itself the
   most useful humility device available: the page's own arithmetic says the bar falls over time.

Secondary but required: **no advice register anywhere** — this page sits close to the line
precisely because it addresses capital decisions. Facts-not-signals throughout; no "you should."

## 8. Page-level decisions

- **Fences (write into the related strip, not just this doc).** `/the-power-law` owns whether the
  model is true and its break cases. The Doubling Ladder owns the trend and the wave around it.
  `/bitcoin-vs-the-stock-market` owns the equity comparator. The retirement cluster owns withdrawal
  and sustainability. `/borrowing-against-your-stack` owns borrowing math. `/how-much-bitcoin` owns
  Kelly sizing. **This page owns opportunity cost as a decision rule, and nothing else.**
  **JM ruling 2026-08-06: agreed — no ground re-covered.**
- **Contextualised cross-links (JM ruling 2026-08-06).** A bare "Continue exploring" strip is not
  enough: each destination gets a line explaining *why it is relevant to the decision this page just
  helped the reader make*. Two mechanisms, and they are not the same:
  - **Per-card context — already supported, use it.** The `related:` front-matter schema takes a
    `desc` string per entry (`STYLE_GUIDE §6.10`). This is the primary vehicle and needs no
    component change. Every entry on this page carries a `desc`; none ship as bare slugs.
  - **Group lead-in — a component change, scope it deliberately.** A framing sentence above the
    whole strip does not exist today, and `related.njk` is included from `base.njk` for every
    slugged page — so it must land as an **optional** front-matter field (`related_intro:`) that
    renders nothing when absent, or it silently alters ~20 pages. **Open: does this page pilot the
    field, or does it become canon with a sweep?** (§10.6.)
  - **The one-placement rule still binds.** §6.10: don't use an inline link *and* a related card for
    the same destination. This page breaches it by default — the hero references `/the-power-law`,
    which is also the most obvious strip entry. **Resolution: Power Law lives inline in the hero,
    not in the strip.** It is load-bearing for parsing the page's central number, so it belongs
    where the number is. The strip carries the *after* destinations —
    `/bitcoin-vs-the-stock-market`, the Doubling Ladder, `/bitcoin-vs-real-estate`,
    `/borrowing-against-your-stack`.
- **The MSTR fence, specifically.** This page owns the *general principle* that explains
  treasury-company behaviour; the backlog's MSTR entry owns the *company examination*. One
  cross-link each way when that page exists; no single-security analysis here (it would drag counsel
  attention onto a page that otherwise needs none).
- **URL state** — the candidate return and horizon are the shareable payload (`?r=`&`?h=`&`?lens=`).
  This page is unusually shareable ("here's the bar your project has to clear") and that argues for
  getting URL state right at v1 rather than retrofitting, as WODN now needs.
- **Stickiness** — per-page `localStorage` (`STYLE_GUIDE §6.37`).
- **Hero copy** — must satisfy `STYLE_GUIDE §6.10a`: state what the tool is and how to use it, with
  no assumed reading order and no dependence on a sibling page. **JM ruling 2026-08-06:** the hero
  may carry a *reference link* to `/the-power-law` (the foundational thesis behind the high trend
  CAGR), but the link only — the hero must remain parseable by a reader who never follows it. The
  §6.10a failure mode is a hero that *depends* on the sibling, not one that cites it.
- **Refresh surface** — target zero beyond the shared `PL_DATA` append. Everything in §4 computes
  live. Only §5.4 presets risk adding a tail; keep them few and clearly dated.
- **SEO (JM ruling 2026-08-06 — hurdle-rate keyword targeting confirmed, FAQ in scope).** Full
  `NEW_PAGE_CHECKLIST §10` baseline; WebApplication JSON-LD; **FAQ block ships with v1** rather than
  being backfilled (`claude/SEO_AUDIT` Priority 3 lists FAQ backfill as open on ten pages —
  shipping this one inline avoids adding an eleventh). Query surface to cover across title, meta,
  early H2 and FAQ questions: *hurdle rate* · *opportunity cost of holding bitcoin* · *cost of
  capital bitcoin* · *is bitcoin a better investment than paying off my mortgage* · *why do
  companies hold bitcoin instead of cash*. Note the FAQ rich-result deprecation (Google, May 2026,
  per `claude/SEO_AUDIT`) — the argument for the block here is query matching and AI-answer
  eligibility, not the snippet. Validate at validator.schema.org, not Rich Results Test.
  **Cannibalization check at build:** confirm no existing page owns *opportunity cost* in its title
  or meta — BvSM and the Doubling Ladder both run adjacent arguments in prose.

## 9. Build plan

1. Page scaffolding + front matter + hero (§6.10a-compliant).
2. Engine: `trendCAGR(t, H)`, floor band, reading canonical `PL_A`/`PL_B`/`PL_FLOOR` from the shared
   module — **no local copies** (`DATA_AUDIT` already flags duplicated constants as debt).
3. Input surface + lens toggle (§6.17 recipe).
4. Hurdle curve chart + hero readout.
5. Stat strip + presets.
6. Question section prose + honesty flags.
7. Cross-links, related strip, FAQ, SEO/OG, `explorations.json` + `calculator_tile`.
8. Documentation sweep per `NEW_PAGE_CHECKLIST §9` (SITE_GUIDE section, DATA_AUDIT rows if any new
   constants, MONTHLY_REFRESH if any preset is dated, backlog entry → shipped with slug + SHA).

## 10. Resolved — JM rulings, 2026-08-06

All six questions closed. Recorded here rather than deleted, because several were close calls.

1. **Title and slug — RESOLVED.** Page title **"The Bitcoin Hurdle Rate"** (slug
   `/the-bitcoin-hurdle-rate`). JM's reasoning: it sets the context immediately, where the
   question-form title assumes the reader already has the frame. **"Does it beat bitcoin?" survives
   as a recurring refrain** — the question the page wants the reader to carry away and keep asking
   of their own decisions. Deliberately a *question*, never a slogan: every appearance is followed
   by, or adjacent to, the two conditions (the trend holds; the capital can wait). Placement: hero
   subtitle, above the verdict readout, and as the closing line of the Question section. Three
   appearances, not more — a refrain repeated too often becomes a jingle and breaches the
   facts-not-signals register.
2. **Risk adjustment — RESOLVED.** §4.3(c), the access-conditioned hurdle, is the primary treatment.
   Sharpe (b) is dropped from v1 rather than kept as a secondary readout — it requires a project
   volatility the reader does not have, and a number the reader guesses at is worse than no number.
3. **Company-lens depth — RESOLVED: two-way in v1.** Candidate return vs. the bitcoin hurdle. The
   three-way IRR/WACC/hurdle readout is deferred. **Action at build:** add a new
   `PAGE_IDEAS_BACKLOG` entry for the fuller corporate treatment (three-way readout, funding-source
   mechanics, accounting-treatment constraints, and the §2.2 second-engine analysis at length) —
   captured properly per the backlog's guiding principle so it can be picked up cold.
4. **Substack essay — RESOLVED: after preview.** JM's framing of the page may shift on review, and
   the essay should follow the page's final shape rather than lead it. **Log the reciprocal-link
   reminder at ship**, per the Exit precedent where the essay→tool link was nearly missed.
5. **The §2.2 divergence section — RESOLVED: held, and materially expanded.** JM's cashflow-positive
   precondition and second-engine observation are now the section's spine (see §2.2). Both lenses
   ship.
6. **`related_intro` scope — RESOLVED: defer.** Get the page into production and fully baked first;
   decide afterwards whether the group lead-in becomes a `STYLE_GUIDE §6.10` amendment with a sweep.
   Per-card `desc` (already supported) carries the contextualisation requirement in v1, so nothing
   is blocked by this deferral.
