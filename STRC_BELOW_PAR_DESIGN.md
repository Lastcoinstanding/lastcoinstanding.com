# Design Doc — STRC Below Par: Discount, or Warning?

> **RENAMED 2026-08-10 → "The STRC Mechanism" (slug `/the-strc-mechanism`; old `/strc-below-par` 301s via `_redirects`).** The page was reframed **condition-neutral**: it now explains the mechanism and reads price against par in *either* direction (below par: higher effective yield *and* a priced risk; above par: the market accepting less than the stated rate — the mechanism's credibility being paid for), rather than taking "below par" as its premise. The page also gained the site's **first CI automation** — a daily official-close updater (see SITE_GUIDE §42). This filename is kept so the design history stays findable; the section numbers and the below-par framing below are the original 2026-07-28 record, not the current page. Current page copy and structure live in `src/the-strc-mechanism.njk`; current documentation is SITE_GUIDE §42.


_Created 2026-07-28. Promoted from the backlog's STRC deep-dive block (§ "STRC deep-dive," incl. JM's
below-par argument of 2026-07-21) and OPEN_ITEMS top-10 #9 ("timely while STRC ~$83"). House workflow:
this doc → JM review → Claude Code build prompt → JM review on preview → merge._

_Timeliness note (2026-07-28, chronology corrected twice — final version is 8-K-sourced via
NotebookLM Q4, JM's paste on file): STRC closed Jul 27 at **$88.32** (52-wk range $71.25–$100.42;
ATH Jan 13, 2026; ATL Jun 26, 2026); current rate **12.00%**, paid semi-monthly ($0.50 × 2)
since Jul 2026. The episode's filing-sourced arc: IPO Jul 29, 2025 at 9.00% → framework ratchet
to 11.50% by Mar 2026 → flat near par Apr–Jun → **May–Jun de-anchoring** (STRC to $71.25 as BTC
drew down; May 26–31: 32 BTC / $2.5M sold — the "inoculation" sale; May: $1.5B convert
repurchase) → **Jun 29: the Digital Credit Capital Framework 8-K** (rate +50bps to 12.00% +
semi-monthly transition; $1.0B Digital Credit Securities repurchase auth; $1.0B MSTR repurchase
auth; $1.25B BTC Monetization Program) → **Jun 29–Jul 5: 3,588 BTC / $216.0M sold** under that
program to fund distributions and replenish the reserve → **Jul 20–26: first STRC buyback**
(288,930 sh / $25.0M / avg $86.52; ~$975M remaining; zero other series or MSTR repurchased) →
**Jul 27 8-K:** standing below-par bid policy (pace greater at deeper discounts, tapering to
par); no new STRC issuance below $100; USD Reserve $3.75B (~25 months of preferred dividends;
walled off from funding buybacks); hold-at-12% posture until sustained par. The page's central
question is being asked — and actively contested by the issuer under a formalized framework —
in real time._

---

## 1. Concept — the sibling lens

**Central question (and working title): "STRC below par: discount, or warning?"** — deliberately
echoing `/discount-or-premium`. The two pages are siblings: the same two-sided discipline (a low
price is *either* opportunity *or* information, and honest analysis shows the reader both readings
with arithmetic, not adjectives), applied first to bitcoin against its trend, now to a
bitcoin-backed yield instrument against its par.

The below-par state is genuinely double-edged, which is what makes the page honest rather than
promotional in either direction:

- **The discount reading:** at $88.32, STRC's 12% coupon is a **13.6% effective yield**, and any
  return to par adds capped capital upside on top.
- **The warning reading:** STRC carries a mechanism *designed to hold it near $100* — the dividend
  rate adjusts monthly precisely "to encourage trading around par." A persistent 12% discount
  *despite* that mechanism means the market is demanding more than the mechanism delivers: it is
  pricing some combination of dividend risk, issuer stress, and structural doubt. The July BTC
  sales are the market's concern made concrete.

Register: essayistic + computed, per the parent page (`/bitcoin-fixed-income`) — the **Risks to
Bitcoin steelman model** (present the strongest bull AND bear case; de-tell language; let structure
carry the argument; never editorialize).

## 2. Placement — recommendation: linked sub-page, not a sixth tab

The backlog left this open ("a new tab or a linked sub-page"). **Recommend: standalone sub-page**
at **`/strc-below-par`**, linked prominently from `/bitcoin-fixed-income`'s Instruments and Risks
tabs (and back via the related component). Rationale:

1. The parent already carries five tabs; a sixth with its own interactive bloats it.
2. A distinct URL is the shareable anchor the X playbook wants for the fixed-income circle's
   thread (Walton/Krueger's circle — both already credited on the parent page).
3. SEO: "STRC below par," "STRC discount," "STRC 12%" are live search queries this month; a
   dedicated URL with a question-title can rank for them; a tab cannot.
4. It preserves the parent's evergreen register while letting the sub-page be honestly *dated* —
  this page is **an examination of a live episode**, and should say so (see §7, aging policy).

**DECIDED 2026-07-28 (JM, revised same day): standalone sub-page, confirmed and strengthened —
now with nested, episodic navigation presence.** The research phase settled the
tab-vs-page question on structural grounds: the lever board is a *tracking instrument* (daily
live readouts, monthly dial updates, filings-driven log appends) while the parent's tabs are
evergreen education on a monthly-refresh cadence — different registers, different cadences,
different species; merging weakens both. The page is also the site's first with native
return-visit utility, which justifies navigation presence under two conditions that answer the
original center-of-gravity concern:
1. **Nested, not top-level:** the nav entry (short label: "STRC Below Par") sits within the
   fixed-income cluster's grouping, not as a top-level peer of the flagships — the nav is the
   site's self-portrait and financialization stays one row back. (If the nav structure is flat,
   revisit at build with JM.)
2. **Episodic, with a sunset rule (rides §7's aging policy):** nav presence lasts while the
   episode is live; when the monthly refresh declares it resolved and the page converts to
   post-mortem, the nav slot retires and reachability reverts to parent + related links. The
   site never carries a stale dashboard in its nav.
Prominence control: **a homepage carousel slide under The Numbers only, NOT Featured**
(REVISED 2026-07-28, JM — supersedes the original "no homepage slide" line: the slide
ships in the Numbers category with `data-feat="0"`, so it rotates within The Numbers but
never enters the ~10-slot Featured rotation; the flagship/financialization fence still holds
one row back). §6 fences otherwise hold. §C's "why not simply own bitcoin?" remains the
re-centering device. Build-prompt note: return utility argues for cheap "what changed"
surfacing — latest-log-entry badges per lever.

## 3. Page structure (four sections + one interactive)

### §A — The three levers (the mechanism, built evergreen)
What STRC is (one paragraph, linking to the parent for depth): Strategy's variable-rate perpetual
preferred, dividends in cash, with a stated design goal of trading near $100 par. Then the page's
core device — **the lever board** (JM direction, 2026-07-28: mechanics populated with data, not
verbal news coverage; structure evergreen, events append as rows):

Three levers the issuer holds against a below-par price, each rendered as a **status readout +
append-only action log**:

1. **The rate lever** — _mechanics verified from 424B5/CoD via NotebookLM, 2026-07-28; JM's
   paste on file._ Status readouts: current annualized rate (12.00%, live-badged); **the bracket
   dial** — prior-month VWAP plotted against the published policy brackets (<$95 → recommend
   +50bps or more; $95–$98.99 → +25bps; $99–$100.99 → hold ±25bps; ≥$101 → cut ≥25bps and/or
   reissue), showing side-by-side: *what the framework recommends* (computed from VWAP), *what
   the board did* (the log), *declared posture* (dated row: "hold at 12% until sustained par —
   Jul 27, 2026"). One required honesty row, verbatim-sourced: the brackets are management
   policy — non-binding, modifiable or abandonable at any time without shareholder consent;
   rate-setting is board sole discretion and dividends are payable only when declared.
   **Downward guardrails as status fields** (the asymmetry): max monthly cut = 25bps + intra-
   month 1-mo SOFR decline; absolute floor = 1-mo term SOFR; **cuts legally barred while any
   cumulative dividends remain unpaid** (dividends are cumulative — also fix on parent page
   status if understated there). Log: **fully populated by Q4** (paste on file) — 9.00% at IPO
   (Jul 29, 2025), +100bps Sep 2025, +25bps monthly Oct 2025–Mar 2026 to 11.50%, flat Apr–Jun
   2026 near par, +50bps to 12.00% (Jun 29, 2026 8-K, with the semi-monthly transition), one
   dated row per change. The bracket dial's honest baseline: the VWAP framework was formalized
   **Feb 5, 2026** (dial only meaningful from there); the Jun 29 +50bps matched the <$95
   bracket; the Jul 27 hold-posture is the first declared divergence from it — the dial shows
   this as data, not drama. Payouts semi-monthly ($0.50 × 2) since Jul 2026 — §B accrual and
   the interactive use semi-monthly compounding.
   _Follow-ups (a) and (b): CLOSED by Q4 — June 2026 framework detailed in the timeliness note;
   semi-monthly mechanics confirmed._
2. **The supply lever** — status: issuance policy (no new STRC below $100). Log: dated policy
   rows as they occur.
3. **The bid lever** — status: cumulative repurchased ($ and shares, avg price), authorization
   remaining (~$975M of $1B), refreshed monthly. Log: one row per disclosed repurchase period
   (first row, exact per Jul 27 8-K: Jul 20–26, 288,930 sh, $25.0M, avg $86.52 — **$28.89M of
   par retired for $25.0M, eliminating ~$3.5M/yr of perpetual dividend obligation**; zero
   STRF/STRK/STRD/MSTR repurchased that week). Sibling authorizations on the gauge: $1.0B MSTR
   repurchase auth (unused), $1.25B BTC Monetization Program ($218.5M used: $2.5M May +
   $216.0M Jun/Jul).

A fourth board column, **the fuel gauge**, carries what feeds the levers: USD Reserve level
($3.75B ≈ ~25 months of preferred dividends; not authorized to fund buybacks) and the disclosed
funding sources for the bid (MSTR ATM; conditionally BTC sales) — status figures, refreshed, not
narrated. The May 2026 BTC sale (~3,588 BTC / ~$216M) appears as a dated row in this column's
log, not as a story. _Added from Q2 findings (2026-07-28):_ the gauge also carries **the
obligation denominator** (annual preferred bill, ~$1.2B+, computed from float × rates) against
**operating cash flow** (~$320–500M/yr, dated), and the company's own **BTC Breakeven ARR
(~2.3%)** — the bitcoin appreciation rate at which the treasury alone sustains dividends
indefinitely (company modeling; §5 requires methodology verification and independent recompute
before display). Claim-stack status facts for context: $6.7B senior unsecured converts,
~0.42% avg coupon (~$35M/yr), 2028–2032 maturities, **no margin/coverage liquidation triggers**
— no creditor can force asset sales in a drawdown. The **bid-lever cost metric**: BTC Yield
decay (13.3% → 4.5% YTD 2026) — the dilution cost of the par defense, tracked, dated.
The **supply lever** carries its dual reading as one status row, de-tell: no-issuance-below-par
is stated discipline (company) *and* economic necessity (below par, primary ATM issuance is
uneconomic and the accumulation flywheel halts on its own — Cipolaro/NYDIG); same fact, both
camps, no referee.

_Q3 findings folded (2026-07-28):_ the gauge's **coverage readout is a three-number block, each
labeled, all live-computed** from BTC spot + claim-stack constants (constants refreshed from
filings on the monthly checklist): (1) **gross-BTC / STRC notional** — the popular "dashboard"
metric (~4.6–5.0× in recent windows; the infographic's figure); (2) **standalone cushion** —
net assets after senior claims ÷ STRC notional (~4.86× at $65.5K spot); (3) **all-claims
coverage** (a.k.a. full-waterfall; "waterfall" is credit-desk jargon and was retired from the
page's visible labels 2026-07-30 for the Treasury-shore reader) — total liquid assets ÷ all
claims senior-and-including STRC (~3.20×). One
explanation line, de-tell: the popular metric treats STRC as the sole liability, omitting
$7.98B of senior claims; the three numbers answer three different questions, and the page shows
all three. Claim-stack constants (per late-Jul 2026 filings, verify at build): converts $6.70B
(reduced from $8.2B via **May 2026 $1.5B cash repurchase** — its own dated fuel-gauge log row;
note the May pattern: BTC sales *and* deleveraging preceded the STRC bid by two months); STRF
senior $1.284B; STRC ~$10.49B notional (~104.9M sh, net of buybacks); no pari series; STRK/STRD
junior. **Blocking flag (§5): the annual preferred bill does not reconcile across sources** —
Q2's "~$1.2B+" vs STRC alone ≈ $1.26B at 12% vs the company's 25-months-at-$3.75B implying
~$1.8B/yr incl. debt interest — the board computes the bill from float × rate per series from
filings and inherits no one's figure. _Accepted from notebook: the coverage stress-test offer
(50%/75% BTC drawdowns, exact breakeven prices) — it replaces the parent page's stale
$33K/$21K thresholds and populates §D's which-number-to-watch links._

The prose around the board is one short paragraph and stays true regardless of what happens next:
*a peg that isn't pinning is information; a below-par preferred with a determined issuer is a
measurable contest between the market's demanded yield and the issuer's balance sheet — the board
shows the issuer's side, live; bitcoin's path sets the other side.* No editorial refresh needed —
the monthly checklist appends rows and updates readouts.

- Verify at build: the precise adjustment mechanics and any caps/floors from the prospectus (how
  fast can the rate rise? at whose discretion? SOFR-linked or board-set?). The mechanism's
  *limits* are load-bearing for the honest reading — if the rate can't rise fast enough to clear
  the market's demanded yield, below-par is the pressure valve. Do not paraphrase from memory.

### §B — The below-par arithmetic (live-computed, the page's spine)
The same "one line of math, both directions" discipline as the sibling page. All figures live from
the price feed; worked examples below at $88.32 for design reference:

- **Effective yield:** coupon ÷ price = **13.59%** (vs 12.00% at par).
- **The discount, denominated in time:** $11.68 below par = **~11.7 months of coupon**. A buyer at
  par who sells here gives back roughly a year of yield — which is the backlog's point made exact:
  *a par buyer from ~6 months ago selling today is at **−5.7% total return** despite collecting the
  full coupon throughout; even a 12-month par holder is only ~+0.3%.* The coupon is real; the
  mark-to-market has fully consumed it.
- **Return-to-par CAGR (the transferred device):** if price returns to $100 within T, annualized
  return = coupon + pull-to-par: **6mo → 44.0%/yr; 12mo → 26.8%/yr; 24mo → 18.5%/yr; 36mo →
  15.5%/yr; never (dividend intact) → 13.6%/yr.** Same slider mechanics as
  `/discount-or-premium`'s reversion device — "if it reverts by ___, the arithmetic says ___."
  Assumption, not prediction, labelled as on the sibling page.

### §C — The sharp question (the honesty beat)
JM's argument from the backlog, given its own section because it is the strongest single point on
the page: **if the case for buying/holding STRC below par is "wait for bitcoin to recover and the
price returns to par," the reader should ask why not simply own bitcoin.** Present the comparison
as a computed table, both columns honest:

| | STRC at 0.88× par | BTC at 0.43× trend |
|---|---|---|
| "Wait for recovery" upside | capped at par (+13%) + coupon | uncapped; trend reversion arithmetic (~107%/yr at 2y per the sibling page, live-linked) |
| Cash flow while waiting | ~13.6% yield **if sustained** | none |
| What recovery requires | the same thing: bitcoin recovering | bitcoin recovering |
| If bitcoin doesn't recover | dividend at risk (see §D); no floor demonstrated ($71.25 low) | the 0.42× floor — held for the record's length; evidence, not law |
| Claim seniority | preferred claim on a leveraged BTC treasury | the asset itself |

The de-tell framing: the page does not conclude which column wins — it shows that **the below-par
bull case and the bitcoin bull case are the same bet with different payoff shapes**, and lets the
reader see what they're actually choosing between. This directly interrogates the "unique third
position" (Krueger) claim from the parent page — credited, steelmanned, then examined.

### §D — What each lever costs, and who pays (the honest accounting)
With events living as board rows (§A), this section carries only the **evergreen cost
arithmetic** of each lever — computed, dated, never narrated:

- **Rate lever cost:** each 0.5pp of rate is $X/yr of additional perpetual obligation across the
  outstanding float (computed live from shares outstanding) — the spiral risk from the parent's
  Risks tab, quantified. **And the asymmetry, computed both ways:** rate rises are unlimited and
  discretionary; rate cuts are capped (~25bps+SOFR-decline/month), floored at SOFR, and legally
  barred while cumulative arrears exist — holder-friendly stickiness *and* issuer-side ratchet,
  the same fact, both readings shown.
- **Bid lever cost/benefit, both ways:** retiring a $100-stated share at the log's average price
  extinguishes a $12/yr perpetual obligation — a **~13.9% return on the buyback dollar at
  current prices** (accretion case, CEO framing, credited) — *and* the funding column shows the
  dollars come from MSTR common dilution (and conditionally BTC sales): the par defense is paid
  for outside the preferred. Both sentences computed, neither softened.
- **Fuel constraints:** the reserve/repurchase wall (reserve pays dividends, cannot fund the
  bid), months-of-dividends coverage, and the parent Risks-tab failure taxonomy (bitcoin winter,
  ATM closure, coverage erosion, rate spiral) each linked to the board figure that would show it
  happening — so the reader knows *which number to watch* for each risk, rather than being told
  a story about it.

- Include the backlog's **stress-test inputs** in reduced form: not a full second calculator, but
  2–3 adjustable assumptions inside the interactive (dividend sustained / cut by X% / suspended;
  optional coverage-context readout from the parent's capital-stack figures). The full
  stress-test calculator remains backlog (§6).
- Verify at build: coverage arithmetic against the **current** capital stack (the parent's Q1-2026
  stack and $33K/-47%, $21K/-67% thresholds predate the July sales and current BTC holdings —
  recompute, don't inherit).

### §E — The record strip (STRC's own backtest)
The sibling page's honesty pattern: run the lens over the instrument's whole (short) history.
A simple price-vs-par strip since issuance: launch near par → ATH $100.42 (Jan 13, 2026) → ATL
$71.25 (Jun 26, 2026) → ~$88 today, annotated with the rate adjustments along the way. What it
shows honestly: the peg held for months, then broke with bitcoin's drawdown — par is a magnet in
calm and an aspiration in stress, on the evidence so far. One year of history is thin; say so
("the record is short — that is itself a risk disclosure, not a footnote").

## 4. The interactive — "the below-par lens"
One device, same grammar as the sibling page's reversion slider:

- **Input:** return-to-par horizon slider (6mo → 5y, plus "never").
- **Primary readout:** implied annualized return (the §B table, continuous).
- **Assumption toggles (the §D stress inputs):** dividend sustained / cut / suspended — the curve
  recomputes and the "never" case goes visibly negative where appropriate.
- **Comparison overlays (opt-in):** BTC-at-current-multiple reversion curve (live from the
  sibling page's model — house code reuse), 10yr Treasury flat line (parent-page data reuse).
- **The demanded-yield ↔ price converter (small, neutral, added from Q2):** price = annual
  coupon ÷ demanded yield. Spans every camp's scenario as pure arithmetic — 12% demanded = par;
  ~13.6% = today; 35% (a distressed-repricing fear) → ~$34 — with no scenario endorsed. Two-way
  dial: set a yield, see the price; set a price, see the implied demanded yield.
- Facts-not-signals framing throughout: "Estimated:" prefixes, no buy zones, no verdicts. URL
  params per house convention (`h=` horizon, `dv=` dividend scenario, `ov=` overlays) for
  shareable scenarios.

### Source roster (Q2, 2026-07-28 — steelman credit lines for §C/§D and the Substack piece)
- **Durability case:** Strategy leadership (Saylor/Le/Kang — reserve, accretion, breakeven ARR,
  no-trigger debt); Standard Chartered's Kendrick ("whatever it takes" par-defense framing);
  BitMEX Research ("built to bend, not break" — preferred-not-debt flexibility: cut-to-floor,
  accrue arrears, no default); Benchmark's Palmer (treasury as over-collateralized backup);
  Strive's Walton & Cole (liquidity $250–400M/day, Sharpe, $50M corporate allocation).
- **Fragility case:** Schiff (circular funding; ops cash < half the bill; BTC Yield decay);
  Kerrisdale's Adrangi (mNAV compression closing both ATM engines); NYDIG's Cipolaro ("selling
  a put on bitcoin asset coverage"; ATM freeze below par; subordination/governance risk —
  senior-series issuance right and discretionary dividends); Coffeezilla (cost-of-capital
  compounding vs BTC CAGR; retail-marketing concern); Motley Fool (no-maturity yield-trap
  structure).
- Sourcing rule: named institutional/analyst voices are credited on-page per house habit;
  pseudonymous forum material is not named on the site — its substantive point (distressed
  repricing) survives as the converter arithmetic. Full roster usable in the Substack piece.

## 5. Guardrails (this page sits closest to the advice line of anything on the site)
- **POSITIONING §1.5 + §5 apply in full**, and this page is single-security commentary — the
  closest thing on the site to the advice line. **Flag for counsel pass before publish** (the
  backlog already requires this). Standard educational-content disclaimer block; consider a
  sentence acknowledging the site holds no position / receives nothing from any issuer (per
  PARTNERSHIPS_REFERRALS_POLICY).
- **Steelman register both ways:** the bull mechanism (daily accrual, Walton; TAM/arbitrage,
  Krueger — credited by name, house habit) presented at full strength *and* the bear case at full
  strength. No de-tell violations: no "obviously," no "merely," no rhetorical questions except
  §C's, which is the page's licensed one.
- **Verify-at-build checklist (blocking):** current price/discount at publish day; exact current
  dividend rate + adjustment mechanics from the prospectus; SATA current terms if referenced;
  the BTC-sale figures against primary sources (8-K / press release, not aggregators); coverage
  arithmetic against the current capital stack; Walton/Krueger claims re-verified against their
  actual posts before crediting.
- **Moving-number discipline:** every dated figure carries its as-of date in-copy; the status
  strip computes live; the monthly refresh checklist gets a "re-verify STRC rate + price" line.

## 6. Scope fences
- **Not** the full "why STRC works long-term" deep-dive (that remains the backlog's larger idea;
  this page is the below-par examination it called for, shippable now while timely).
- **Not** the full stress-test calculator (backlog; the interactive's toggles are its seed).
- **Not** the MSTR/mNAV examination (separate backlog idea; share no more than a cross-link).
- SATA: mention-and-link level only (same instrument class, its own below/at-par state noted),
  no parallel treatment — avoids doubling the verification surface.

## 7. Aging policy (new for the site — this page is deliberately episodic)
Unlike the evergreen pages, this examines a live episode. Two honest states, decided at each
monthly refresh: (a) episode ongoing → live numbers carry it; (b) resolved (par regained, or
dividend action taken) → the page converts to a **post-mortem of the episode** — "what below-par
was telling you, and how it resolved" — which may be its most valuable long-term form. Either way
the page never pretends to be timeless; the title's question stays answerable by the reader.

## 8. Connections
- Parent: `/bitcoin-fixed-income` (Instruments + Risks tabs link in; related component links back).
- Sibling: `/discount-or-premium` (the lens pattern, the BTC overlay, explicit cross-reference
  in §C). Related component: both, plus the retirement stress test (drawdown-honesty kinship).
- SEO/meta per NEW_PAGE_CHECKLIST + FAQ_BLOCKS_AND_SCHEMA: question-title, FAQ block ("Why is
  STRC below par?", "Is STRC's dividend safe?" — answered in the page's both-sides register),
  OG card + carousel video per house pipeline.
- Content pipeline: this is the **fixed-income circle's anchor thread** (playbook §6). Thread +
  video script drafted at publish with live numbers, per the pilot's refreshed process — appendix
  added to this doc at that time (lesson from the pilot: appendix travels in the repo doc AND
  the project copy).

## 10. The Substack companion (the opinion, split from the lens)
**DECIDED 2026-07-28 (JM):** the site page stays verdict-free; JM's foundational take ships as a
**Substack article** — the REACH plan's first article, cross-linked via the related component
(`kind: substack`) and linking back to the page and parent. Working brief for the draft:

- **The thesis (JM's):** STRC is a *glitch being arbitraged* — a unique middle seat between
  bitcoin's very high but variable CAGR and fiat's very low fixed yield. The bridge infographic
  (JM's, NotebookLM-produced) illustrates it and appears in the article — **with two claims
  explicitly annotated as precision upgrades the episode taught**: "at par / low volatility"
  (pre-episode; the peg broke) and "4.6x–5x overcollateralization" (gross-BTC basis; ~3.2×
  across the full senior stack per the Q3 waterfall math) — which is the article's engine:
- **The strongest angle:** a thesis retrospective, not a restatement — "what the below-par
  episode did to my middle-seat thesis." The live question the article must actually wrestle
  with: is a persistent 12% discount the arb *widening* (the seat got cheaper) or the thesis
  *leaking* (the market doubting the seat exists)? The buyback program is fresh evidence for the
  wrestling — an issuer paying ~13.9% risk-free to defend the seat is itself a data point both
  readings can claim.
- **JM's supporting themes (opinion register — they live here, NOT on the site page):**
  (a) *new-territory grace* — nobody has run a bitcoin-backed variable-rate perpetual before;
  missteps and mid-course corrections (rate hikes, the reserve policy, the buyback pivot) are
  learnings in an unprecedented instrument class, par for the course. (The site page carries
  only the factual kernel: the record is ~1 year old — §E.)
  (b) *criticism is bear-market-correlated* — the pile-on against Saylor/Strategy tracks the
  drawdown, as criticism of bitcoin itself always has, and a bull leg plausibly reverts both
  sentiment and price (MSTR as levered bitcoin noted in broad strokes only — **no MSTR
  coverage**, on Substack or site, per the scope fence).
- **Credit line:** the TAM/middle-seat arbitrage argument is credited to **Fred Krueger** (house
  habit; the backlog records his articulation 2026-07-21); JM's synthesis and the
  glitch-retrospective framing are the article's own contribution. Walton's daily-accrual point
  credited where used.
- **Same honesty floor as the site** (it's still the brand speaking): dated figures, the
  both-ways buyback arithmetic, no yield-is-safe assertions — and the disclosure line if JM
  holds any position in STRC/MSTR (decide and state either way).

## 11. NotebookLM research plan (JM runs; paste load-bearing answers back)
**Both modes needed, in sequence** (JM's question, answered): NotebookLM's chat answers *only from
sources already in the notebook* — so the queries are only as good as the source list, and the
below-par episode largely post-dates the notebook's build. **Phase 1: add sources; Phase 2: ask.**

**Phase 1 — add (via "Add sources" URL-paste or the Discover/web-search feature):**
- The **Jul 27, 2026 buyback press release** (strategy.com/press) and its **8-K** (SEC EDGAR) —
  certainly newer than the notebook.
- The **8-K covering the May 2026 BTC sales** (~3,588 BTC / ~$216M) if not already present.
- The **June 2026 repurchase-program authorization 8-K** (may already be in — the source list
  shows an 8-K; confirm which one).
- **3–5 current below-par commentary pieces, deliberately both camps:** Krueger and Walton's
  recent threads/posts on one side; the most credible skeptical treatments on the other (seek
  the strongest critic, not the loudest). Without these, Query 2 can only reconstruct old
  arguments.

**Phase 2 — ask (against the enlarged notebook):**
1. **Peg mechanics:** "From the 424B5/prospectus: exactly how does STRC's monthly dividend-rate
   adjustment work — who sets it, against what reference, and what caps/floors or discretion
   limit how fast it can rise?" _(load-bearing for §A's rate lever)_
2. **Both-camps below-par commentary:** "Summarize the strongest arguments in the sources for
   and against STRC's durability now that it trades below par — attribute each argument to its
   named source." _(steelman fuel for §C and the Substack piece)_
3. **Coverage math, current:** "Using the most recent filings, compute current asset coverage
   for STRC given ~843,775 BTC held, the USD Reserve at $3.75B, and the full claim stack senior
   and pari to STRC — and reconcile against any 4.6–5x overcollateralization claims." _(feeds
   the fuel gauge; checks the infographic's figure)_
4. **The board's opening rows, primary-sourced:** "From the 8-Ks: exact dates, amounts, and
   stated rationales for (a) the 2026 bitcoin sales used to support payments, (b) the June 2026
   repurchase authorization, (c) the July 20–26 first repurchases, and (d) each STRC dividend-
   rate change since issuance." _(populates the lever board's launch logs verbatim)_

## 12. Status
- [x] Placement decided — sub-page with prominence control (§2, JM 2026-07-28)
- [x] Substack companion decided — opinion split from lens (§10, JM 2026-07-28)
- [x] NotebookLM queries 1–4 + both follow-ups: CLOSED (pastes on file, 2026-07-28) —
      mechanics, both-camps roster, coverage reconciliation, and all board launch logs are
      filing-sourced. Declined offers: SATA comparison (§6 fence), 8-K/price-impact timeline
      (duplicates §E build). Accepted, still pending: **coverage stress-test (50%/75% BTC
      drawdowns, breakeven prices)** — last research item.
- [ ] JM review of remaining doc (§C table register; §D stress-toggle scope)
- [ ] Counsel flag acknowledged (§5)
- [ ] Claude Code build prompt (after review + stress-test paste)
- [ ] Verify-at-build checklist executed (blocking, §5 — incl. dividend-bill reconciliation)
- [ ] Preview → JM screenshot pass → merge
- [ ] Publish-day: thread + video + sitemap resubmit + Request Indexing (the new habit)
- [ ] Substack draft (parallel track — does not gate the build)
