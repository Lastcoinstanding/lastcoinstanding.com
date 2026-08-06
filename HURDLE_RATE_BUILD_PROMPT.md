# Build Prompt — The Bitcoin Hurdle Rate (`/the-bitcoin-hurdle-rate`)

_For Claude Code. Design doc: `HURDLE_RATE_DESIGN.md` (approved 2026-08-06). Read the design doc
first — this prompt is the build order, not a replacement for it. Where the two disagree, the design
doc wins and flag the conflict rather than resolving it silently._

---

## 0. Before anything else

**Create the branch first:** `feat/hurdle-rate`. Do not work on `main`.

Then read, in order:
1. `HURDLE_RATE_DESIGN.md` — the full design.
2. `NEW_PAGE_CHECKLIST.md` — the launch procedure; every section applies.
3. `STYLE_GUIDE.md` §4.2 (container widths), §5 (copy register), §6.10 (related strip), §6.10a
   (tool hero), §6.17 (calc-mode-toggle), §6.37 (per-page stickiness).
4. `DATA_AUDIT.md` PL-1 and BR-2 (the constants), and the "duplicated constants" table.

**Scaffolding donor:** pick a *mixed-content* page and adopt the canonical §4.2 tier explicitly
(1100 outer / 880 prose). **Do not inherit the donor's container width** — WMHTB's 1240px container
bit Paper Bitcoin in June 2026 exactly this way.

## 1. What this page is

A calculator that answers: **does this use of capital beat holding bitcoin?** The reader supplies a
candidate return and a horizon; the page computes bitcoin's trend hurdle *matched to that horizon*
and shows where the reader's number crosses it.

Two lenses over one shared engine — **Company** and **Personal** — via the §6.17 yin-yang toggle.

**The page's central finding, which the whole design serves:** the hurdle is not a single number. It
declines with the horizon of the decision, because the power law's growth rate decays with age. Most
people compare every decision to one headline CAGR; that is wrong in a direction that matters.

## 2. Engine (build this first, verify it, then build UI on top)

### 2.1 Constants — shared module only

Read `PL_A`, `PL_B`, `PL_FLOOR` from `shared/power-law-data.js` via `page_scripts`. **Do not copy
constants locally.** `DATA_AUDIT` already tracks local duplication of these as open debt; do not add
a row to it.

### 2.2 Core function

```js
// t = days since genesis (2009-01-03), H = horizon in years
function trendCAGR(t, H) {
  return Math.pow((t + 365.25 * H) / t, PL_B / H) - 1;
}
```

Expected values at t = 6,424 days (2026-08-06), `PL_B` = 5.77 — **use these as the unit-test
fixture**, recomputing `t` live from the actual date at runtime:

| H (yr) | trendCAGR | total multiple |
|---|---|---|
| 1 | 37.6% | 1.38× |
| 3 | 35.4% | 2.48× |
| 5 | 33.5% | 4.24× |
| 10 | 29.7% | 13.4× |
| 20 | 24.5% | 80.0× |
| 30 | 21.1% | 312× |

### 2.3 BLOCKING VERIFICATION GATE — the cross-page CAGR reconciliation

**Do this before building any UI, and report the result before proceeding.**

`/the-bitcoin-retirement` computes a trend CAGR quoted elsewhere as "~28% today → ~14% in 2045 →
~10% in 2065." Recomputing as a **ten-year-forward window** reproduces that closely (29.7% / 15.0% /
9.8%), which implies the retirement calculator's figure is a 10-year-forward measure rather than an
instantaneous rate.

1. Read the retirement calculator's actual implementation and determine which window it uses.
2. Report the finding.
3. **If the two pages would state different CAGRs for "today" without both naming their window, stop
   and flag it.** Two pages on the same site disagreeing about the same number is a credibility leak
   of exactly the kind this site cannot afford.
4. Whatever the outcome: **every CAGR rendered on this page names its window.** No bare "bitcoin's
   CAGR is X%" anywhere, including in the FAQ and meta description.

### 2.4 The hurdle band

Present the hurdle as a band, never a single line (house floor/trend planning asymmetry —
`RETIREMENT_CALCULATOR_DESIGN_22`, reaffirmed by the WDCB v1.2 upper-demotion, `SITE_GUIDE §43`).

- `PL_FLOOR` = 0.42 × trend (`DATA_AUDIT` BR-2).
- Because the floor is a constant multiple of trend, floor-to-floor growth *equals* trend growth.
  The band comes from **where spot sits today relative to trend**: realised CAGR from today's spot
  to trend-at-horizon (upper edge) versus to floor-at-horizon (lower edge).
- **Upper channel is excluded.** Upper excursions are brief spikes; a hurdle computed off them
  flatters bitcoin. Same call as WDCB v1.2.
- Spot comes from the site's existing live-price path. **`todayPriceIsLive` gating applies** — if
  spot is a stale fallback, the page must not label anything "live" (site-wide fix `9a83a97`).

## 3. UI

### 3.1 Hero (must satisfy §6.10a)

States what the tool is and how to use it, parseable by a reader who has never seen the site. It may
carry a *reference link* to `/the-power-law` but must not **depend** on it to be understood.

- H1: **The Bitcoin Hurdle Rate**
- Subtitle: names the question the tool answers.
- Line under it: names the audience and the two or three actions.
- The refrain **"Does it beat bitcoin?"** appears here as a question — see §3.6.

### 3.2 Lens toggle

`STYLE_GUIDE §6.17` recipe verbatim (markup, CSS, JS pattern, ARIA). Labels: **Company** /
**Personal**, each with the recipe's Cormorant title + italic Inter subtitle.

### 3.3 Inputs

Shared: candidate return (slider + numeric, 0–50%); horizon (1–40 yr, default 10); pre-tax/post-tax
toggle on the candidate return.

Company lens adds: funding source (cash / debt / equity) and the **cashflow-positive** control (see
§3.5 — this is not decoration, it gates the verdict).

Personal lens adds: capital source (new savings / sale from stack — enables the CGT wedge) and the
"can this capital wait?" control.

**v1 is a two-way comparison** (candidate vs. hurdle). The three-way IRR/WACC/hurdle readout is
explicitly deferred — see §6.4.

### 3.4 Hero output — the hurdle curve

X: horizon (years). Y: annualised return. Plot the trend hurdle as a declining curve with the
floor-path band beneath it, and the reader's candidate return as a flat horizontal line. The
crossing point is the answer and should be legible without reading a number.

Verdict copy, facts-not-signals, "Estimated:" framing:

> Estimated: a 12% return clears bitcoin's trend hurdle at horizons beyond about **N years**. Below
> that, holding bitcoin has been the higher-returning use of the same capital — **if the trend holds
> and the capital can wait.**

The two conditions are part of the sentence, not a footnote. No verdict adjectives. No "you should."

### 3.5 The access condition — the page's honesty mechanism

The arithmetic hurdle is the **ceiling** on the hurdle, not the hurdle. Bitcoin's trend return is
realised only by capital that can survive a drawdown the site documents at −73% without being sold.

The two lenses ask the same question in different vocabulary, and the UI must make that visible:

- **Personal:** "can this capital wait?"
- **Company:** "is the business cashflow positive?"

**If the company lens is set to not-cashflow-positive, the verdict changes rather than being
decorated.** Copy to that effect, plainly: volatility eats into survivability, not just optionality;
the hurdle does not apply. This is the site declining to make its own argument where it doesn't
hold, and it is the most credible thing on the page for a sceptical CFO. Do not soften it.

### 3.6 The refrain

**"Does it beat bitcoin?"** — three appearances, no more: hero subtitle, above the verdict readout,
and closing the Question section. Always a question, never a slogan; each appearance sits adjacent
to the two conditions. If it starts reading as a jingle, cut one.

### 3.7 Question section (prose below the tool)

Per design doc §6: what a hurdle rate is · why bitcoin is a candidate benchmark (and that it is a
model, not a law) · what this explains about treasury behaviour · **where the two lenses diverge**
(design doc §2.2 — treat as load-bearing content, including the cashflow-positive precondition and
the second-engine passage **with its limit attached**) · what would break this.

## 4. Blocking honesty flags — the page does not ship without these

1. **The overclaim.** "Anything returning less than ~30% destroys value" implies nobody should ever
   do anything but hold bitcoin — absurd, and it would discredit the site with the exact reader it
   targets. State the limits explicitly and *in the verdict itself*: the hurdle applies to capital
   that can wait, **at the margin**, for a holder who can survive the drawdown. It says nothing
   about capital with a deadline, a covenant, a payroll, or a liquidity need.
2. **The model's uncertainty travels with its output.** Every figure inherits the power law's
   uncertainty in full, including a floor breach or a break in either direction (`/the-power-law`
   §(e), shipped in v2). The caveat link sits on the same screen as the number, not one click away.
3. **The second-engine limit** (design doc §2.2). The hurdle applies to **surplus** capital at the
   margin, never to the capital that generates the cashflow. A company that stops maintaining its
   core business stops producing the cash that buys the bitcoin. Without this sentence the passage
   is advocacy.
4. **No advice register anywhere.** This page sits closer to the advice line than most of the site
   because it addresses capital decisions. Facts-not-signals throughout.
5. **Copy register (`STYLE_GUIDE §5`).** No "turbo-charged," "supercharged," or amplifying
   adjectives — especially in the second-engine passage. No calling our own copy honest/candid/
   transparent. No reader-facing "canonical."

## 5. Integration (per `NEW_PAGE_CHECKLIST`)

- **Front matter:** the four expected `eleventyComputed` fields; `permalink: /the-bitcoin-hurdle-rate.html`.
- **`src/_data/explorations.json`:** category **The Numbers**, `interactive: true`, plus a
  `calculator_tile` object for `/calculators`.
- **URL state:** `?r=` (candidate return), `?h=` (horizon), `?lens=` (company|personal). Get this
  right at v1 — WODN is currently blocked precisely because it shipped without URL state.
- **Stickiness:** per-page `localStorage` (§6.37).
- **Related strip:** every entry carries a `desc` explaining *why it is relevant to the decision the
  reader just made*. **No bare-slug entries.** Destinations: `/bitcoin-vs-the-stock-market`, the
  Doubling Ladder, `/bitcoin-vs-real-estate`, `/borrowing-against-your-stack`.
  **`/the-power-law` goes in the hero inline, NOT in the strip** — §6.10 forbids both placements for
  one destination, and the hero link does more work here.
- **FAQ block ships with v1** (front-matter edit, §6.40 component). Cover: hurdle rate · opportunity
  cost of holding bitcoin · cost of capital bitcoin · paying off a mortgage vs. holding bitcoin ·
  why companies hold bitcoin instead of cash. **Cannibalization check before writing:** confirm no
  existing page owns "opportunity cost" in its title or meta (BvSM and the Doubling Ladder both run
  adjacent arguments in prose). Validate schema at **validator.schema.org**, not Rich Results Test —
  FAQ rich results are deprecated as of May 2026 and the Rich Results Test no longer reports
  `FAQPage`; that is correct behaviour, not a fault.
- **Head file:** full `NEW_PAGE_CHECKLIST §10` baseline — favicons ×5, GA4 `G-WNGLLPPR5M`, title
  (<60 chars, carries "Bitcoin"), meta description (140–155 chars, declarative), canonical **without
  `.html`**, OG/Twitter, WebApplication JSON-LD. Sitemap entry.
- **OG image:** generate from the branch preview per the house procedure; hero selector should be
  the hurdle curve chart, not the input board (STRC precedent: dense boards don't read at card
  scale). Asset lands **before** merge.

## 6. Bookkeeping in the same PR

1. **`SITE_GUIDE.md`** — new page section parallel to §14/§17/§19; document the thesis, the
   horizon-matched hurdle finding, the two-lens structure and why both ship, the access condition,
   and the CAGR-window reconciliation outcome from §2.3. Add to the §18 editorial reading order.
   Add the page to the §13 carousel "Pending additions" with proposed slide copy.
2. **`MONTHLY_REFRESH_CHECKLIST.md`** — only if any §5.4 preset carries a dated rate. Target is zero
   added refresh surface; if a preset forces a row, say so explicitly in the PR description.
3. **`DATA_AUDIT.md`** — no new rows expected (everything reads PL-1/BR-2 via the shared module). If
   a new constant appears, that is a design deviation — flag it rather than adding a row quietly.
4. **`PAGE_IDEAS_BACKLOG.md`** — two edits:
   - Mark **"Bitcoin's CAGR as the new hurdle rate"** shipped: `- [x]` with slug + SHA.
   - **Add a new open entry** for the deferred fuller corporate treatment: three-way IRR/WACC/hurdle
     readout, funding-source mechanics, accounting-treatment constraints (ASU 2023-08), and the
     second-engine analysis at length. Capture it per the backlog's guiding principle — enough
     substance to be picked up cold — and note the MSTR-entry fence (this page owns the general
     principle; the MSTR entry owns the company examination).
5. **`updates.json`** — new-page entry so the "New" badge fires.
6. **`TECH_DEBT.md`** — sweep for anything this build closes; add anything it opens.

## 7. Verification before requesting review

- [ ] §2.3 reconciliation gate reported and resolved.
- [ ] Unit fixture in §2.2 reproduces (recompute `t` from the live date; the percentages should
      track).
- [ ] Container width is a canonical §4.2 tier, not inherited from the donor.
- [ ] Constants read from the shared module; zero local copies.
- [ ] Every rendered CAGR names its window.
- [ ] The not-cashflow-positive path changes the verdict, not just the copy.
- [ ] Both conditions ("trend holds", "capital can wait") appear in the verdict sentence itself.
- [ ] Refrain appears exactly three times.
- [ ] No amplifying adjectives; §5 de-tell grep clean (`honest`, `candid`, `transparent`,
      reader-facing `canonical`).
- [ ] URL state round-trips; stickiness persists; deep link restores lens + both inputs.
- [ ] Mobile pass at 375px — chart legible, toggle stacks per §6.17's mobile orientation.
- [ ] **Pixel-probe what you visually changed** on the per-commit deployment URL — `curl` verifies
      the bundle, not the pixels, and the CF Pages branch alias lags.
- [ ] OG asset committed before merge; `curl -I` returns `image/jpeg` post-merge.

## 8. Out of scope for this build

Do not build: the three-way IRR/WACC readout (deferred, §6.4); any single-security or MSTR-specific
analysis (separate backlog entry, and it drags counsel attention onto a page that otherwise needs
none); a Sharpe-adjusted readout (dropped — it needs a project volatility the reader doesn't have);
the `related_intro` group lead-in (deferred pending a separate scope decision); the Substack
companion essay (drafted after preview, per JM).
