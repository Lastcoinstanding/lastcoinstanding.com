# Positioning & Strategy Guide — Last Coin Standing

_Status: **living guide, JM owns it.** The mission, audience, and values sections (§1–§4)
are settled and reflect JM's stated intent (§1.5, verbatim) plus patterns validated in
building. The business-direction and growth sections (§5–§6) are now filled in with JM's own
strategic content (some parts explicitly marked as still evolving). The roadmap (§7) is
updated as work ships. Last updated after the retirement-calculator build, incorporating
JM's edits._

_Companion to **`SITE_GUIDE.md`**. The Site Guide owns editorial voice, content, and
technical architecture; the **Style Guide** owns visual implementation. This guide owns
**who the site is for, what it is becoming, and why** — the strategic layer above the
operational ones. Where this guide and the Site Guide's Section 1 differ, this guide is
the newer thinking and Section 1 should be updated to point here (see §4)._

---

## 0. Why this document exists

The Site Guide's Section 1 defines Last Coin Standing as "a statement piece, **not** a
monetization funnel." That framing was true and useful for the site's first phase. The
site's purpose is now **widening** — beyond a pure explanatory statement piece toward also
serving an **investment-education mission**, connected to JM's direction of partnering with
(or founding) an asset-management effort focused on helping people understand Bitcoin's
role in a portfolio.

This is a real evolution, and it carries a real risk: the site's credibility comes
precisely from *not* selling. If it drifts into a funnel while pretending otherwise, it
forfeits the trust that makes it worth building. This guide exists to **evolve the mission
deliberately and honestly** — keeping the restraint and no-hype voice intact while openly
acknowledging the broader purpose — rather than letting the drift happen unnamed.

**On "recommending" Bitcoin (JM).** Because Bitcoin is legally recognized as a commodity
(like gold) and as property (not unlike real estate), the idea of recommending its purchase
is arguably no more controversial than recommending gold or real estate. That said, the
intent is not to "sell" Bitcoin per se, but to *show* how — if one recognizes the efficacy
of the Power Law — the case for including Bitcoin in a portfolio becomes quite apparent. The
data should speak for itself; nothing here is a recommendation.

**On scope (JM).** Most of the foundational arguments and educational pieces are already
complete. The larger opportunity now is to expand the tools, explorations, and calculators
to *firm up* the case for Bitcoin as an asset class worthy of consideration for allocation.
There isn't necessarily a lot of scope for entirely *new* explorations — over time we'll
more likely refine and deepen a handful of existing ones.

---

## 1. The evolved mission

**Last Coin Standing explains Bitcoin structurally — with rigor, restraint, and no hype —
and, in doing so, helps thoughtful people understand what a considered Bitcoin allocation
could mean for their financial future.**

Two things held together:
- **The founding identity is preserved.** Still a statement piece. Still explains through
  contrast and clarity. Still "never overclaims, doesn't hedge on what it believes." The
  seriousness of the site is the source of its authority.
- **The purpose is openly widened.** The site now also serves investment education — not as
  a sales funnel, but as a place where a serious person (or a prospective
  asset-management partner) can satisfy themselves that the reasoning is sound before
  acting on it. **Education that respects the reader enough to show its work, not
  persuasion that hides the ball.**

The distinction that keeps this honest: **the site earns allocation decisions; it does not
extract them.** It is not neutral about Bitcoin — it never was — but it makes its case
through demonstrable rigor a skeptic can check, not through urgency, FOMO, or hype. If a
reader allocates, it's because the math held up under their own scrutiny.

---

## 1.5 Founder's stated intent (authoritative — the north star)

_This is JM's own statement of purpose, recorded verbatim so it does not have to be
re-derived each session. Where any other section of any guide conflicts with this, this
governs._

> I'm a Product Manager (generalist) by profession, and also a Bitcoin maximalist, with
> an intent to create explorations, tools and calculators to help users (both Bitcoiners
> and regular people) better understand and appreciate bitcoin, not just as a movement and
> positive benefit for society but also as an asset worthy of allocation to — an asset that
> belongs in their portfolio. A related intent is for my tools, explorations and
> calculators to give confidence and comfort to the potential investor in bitcoin.
> Ultimately, I hope to potentially partner my content with an Asset Management firm, or
> start my own firm with a group of people to advance the case for bitcoin as a viable
> asset worthy of investment. My explorations and tools are intended to be truthful, always
> acknowledging risks, gaps and shortcomings in the bitcoin thesis; my opinion is that the
> case for bitcoin is already overwhelming — I don't need to embellish any arguments to
> make it even more so.

**The operative principle that flows from this** — and the single most important line for
anyone (human or AI) building on this site:

> **The case for bitcoin is already overwhelming; we don't embellish to make it more so.**

Practically, this means every tool, chart, and page must:
- **State the truth even when it's less flattering.** Show downside cases as plainly as
  upside. A depleting scenario shows red as clearly as escape velocity shows green.
- **Acknowledge its own gaps.** Model approximations, data limitations, and assumptions
  are surfaced (footnotes, tooltips, methodology notes), never hidden.
- **Never manufacture urgency or inflate a number.** No FOMO, no cherry-picked windows, no
  superlatives the data doesn't earn. The rigor IS the persuasion.
- **Earn confidence, don't extract a decision.** The goal is a potential investor who
  feels *comfortable and informed*, because they were able to check the reasoning — not one
  who was rushed or dazzled into acting.

This is both an ethical commitment and the site's competitive moat: in a field saturated
with hype, a scrupulously honest resource is the rare thing an Asset Management partner can
safely stand behind.

---

## 2. Who the site is for (two audiences, one posture)

The evolved mission serves two distinct readers. Good pages serve both by **leading with an
intuitive answer and letting the rigor sit one layer down** for those who want to verify.

**Bitcoiners** (already convinced of Bitcoin; evaluating *this site's* seriousness).
- Want: live-computed proof, primary sources, no hand-waving, no hype.
- Will reject instantly: anything that smells like marketing, unearned superlatives,
  numbers they can't reproduce.
- Serve them with: the "verify the math" layer, exportable data, transparent
  methodology, honest disclosure of model limitations.

**Normies** (curious, not yet convinced; need orientation before rigor).
- Want: plain language, an intuitive picture, a reason to trust before they can follow
  the math.
- Will bounce from: jargon walls, intimidating density, anything that assumes prior
  conviction.
- Serve them with: the intuitive/narrative layer first (e.g. "watch it grow"), clear
  visuals, a gentle on-ramp to the deeper material.

**Design consequence (already showing up):** the retirement calculator's two-view
structure — narrative "Watch it grow" first, "Verify the math" audit below — is the
two-audience posture made concrete. Narrative for the normie's entry; proof for the
Bitcoiner's scrutiny; same underlying numbers so neither is a lie. This pattern
generalizes: **intuitive lens on top, verifiable rigor underneath, one honest dataset.**

**A third reader worth naming:** the **prospective asset-management partner** evaluating
whether to associate with the site. They read like a Bitcoiner (they'll check the rigor)
but with an institutional lens (they care about defensibility, honesty about risk, and
whether the site would embarrass them). Everything that serves the Bitcoiner serves this
reader — which is why the credibility posture is also the business strategy.

---

## 3. Values as positioning (not just ethics)

The site's honesty guardrails were originally editorial ethics. Under the evolved mission
they are also **competitive positioning** — the specific thing that differentiates this
site from the hype-saturated Bitcoin-content field and makes it safe for an AM partner.

- **Show the work.** Numbers are live-computed and reproducible; methodology is stated;
  data is exportable. "Take our whole projection to your own spreadsheet and check it" is
  the core trust move. (See the retirement export capability — export as credibility, not
  convenience.)
- **Disclose limitations honestly.** Model approximations (e.g. the DCA once-a-year
  approximation) are surfaced in footnotes/tooltips, not hidden. A visible limitation
  builds more trust than an invisible one.
- **Never let the optimistic lens overstate.** Where a view is aspirational ("watch it
  grow"), it must still show the bad outcome plainly (a depleting scenario trends red and
  names its depletion year). Escape velocity is earned by the data or it isn't shown.
- **Risk tools must stay risk tools.** Future downside analyses (e.g. sequence-of-returns /
  bear-market scenarios) must let the user choose severity — including historical-depth
  crashes — rather than baking in a reassuring default. A tool that only comforts is
  marketing; a tool that lets you scare yourself is credible.
- **No urgency, no FOMO, no funnel mechanics.** The founding "not a monetization funnel"
  discipline is retained as a hard constraint on *how* the site pursues its wider mission.

**One-line test for any new page or feature:** _Would this still be here if we had nothing
to sell?_ If yes, it belongs. If it only makes sense as a conversion mechanism, it doesn't.

---

## 3.5 Validated design patterns (from building)

These are concrete, reusable patterns that emerged from the retirement-calculator build and
proved out. They are the operative principles (§1.5) turned into repeatable moves — capture
them so future explorations inherit them rather than rediscovering them.

- **Two-view structure: intuitive lens on top, verifiable rigor underneath, one honest
  dataset.** The narrative view (e.g. "Your retirement, year by year") serves the normie
  entry; the audit view ("Verify the math") serves the Bitcoiner's scrutiny. Both render
  from the *same* computation, so they can never disagree — a reader who checks one against
  the other finds them consistent. This is the single most important structural pattern.

- **Reproducibility is the trust move.** Every displayed number should be reproducible by
  hand from adjacent numbers (e.g. "price × BTC = value; income ÷ price = BTC sold"), and
  exportable (CSV with the scenario's assumptions in the header, so an exported file
  carries its own provenance). "Take our whole projection to your spreadsheet and check it"
  is what an AM partner needs and what a skeptic respects.

- **Let the reader choose what their inputs mean.** Where an input is genuinely ambiguous
  (e.g. "$345K income" could be today's-dollars or a fixed future amount; a price basis
  could revert to trend or hold its current gap), expose the choice rather than silently
  assuming one. Default to the conservative/standard reading, make the alternative one tap
  away, and label which is active. Silently picking the flattering interpretation is a form
  of embellishment.

- **Every figure must respect every active assumption.** When a page has toggles (dollar
  basis, price basis, income basis), *all* displayed figures must follow them — a headline
  number on a different basis than the table below it is a contradiction that destroys
  trust. (Learned the hard way: several figures had to be made basis-aware after shipping
  because they silently used a single hardcoded basis.) When adding a toggle, audit every
  downstream number for whether it honors it.

- **Neutral framing over optimistic framing.** A section title or label must not presume
  the happy path when the same view can show a bad outcome. "Watch it grow" was renamed to
  "Your retirement, year by year" precisely because the view can show depletion — a title
  that promises growth over a table showing decline is dishonest by framing.

- **Disclosures belong in plain sight, not hidden in hovers.** A truthfulness caveat (e.g.
  "this is under your assumptions, not a fixed CAGR") shown as visible text serves everyone,
  including mobile users who can't hover. Reserve tooltips for supplementary depth, not for
  caveats a reader needs to interpret the number correctly.

- **Inputs live with the outputs they drive (the playground principle).** A calculator
  persuades by letting the reader watch the result respond to their hand. Any primary
  lever must be visible in the same viewport as the output it most directly drives —
  and when a page grows so that an output section scrolls away from its lever, mirror
  the control beside the output: **two representations of one state, never two states.**
  Wait or Deploy Now is the reference implementation (slider, chart, and verdict in one
  viewport); the allocation drift chart's mirrored slider is the retrofit example.
  Treat this as a design-time consideration for every new output section, not a
  post-ship fix. (Implementation recipe: STYLE_GUIDE §6.35.)

- **Carry the scenario, don't just cite the page.** Cross-page links between calculators
  carry the reader's state when — and only when — the quantities mean the same thing on
  both pages. Handoffs are explicit links that state what they carry and any conversion's
  arithmetic and price basis; parameters that don't correspond are never translated by
  guesswork. (Validated in the allocation→retirement/stress-test build, 2026-07: `depth→cdepth`
  and `rec→crecov` cross as identity maps; the BTC stack crosses as a stated conversion
  `port × alloc ÷ spot` labeled with its price basis via `todayPriceIsLive`; the allocation
  crash *year* `cy` — years-from-today — is deliberately NOT sent to the stress test's `ctime`
  — year-of-retirement — because they are different clocks; and Disciplined Rebalancing gets
  no carry because its inputs have no allocation-identical quantity. A handoff renders only
  when its conversion is meaningful — the retirement line needs a portfolio-$ input set,
  otherwise it hides.)

---

## 4. Reconciliation with the Site Guide (§1)

The Site Guide's Section 1 ("statement piece, not a monetization funnel") should be
**updated to reference this guide** rather than contradict it. Proposed edit (for JM's
approval — not yet applied):

- Keep the voice description (restrained, declarative, serious; never overclaims) verbatim
  — that is unchanged and remains authoritative.
- Revise the "not a monetization funnel" line to preserve its *intent* (no hype, no
  funnel mechanics) while acknowledging the widened purpose: e.g. _"Last Coin Standing is
  a statement piece and an investment-education resource — never a monetization funnel. It
  earns understanding (and, for some readers, allocation decisions) through rigor a
  skeptic can check, never through hype or urgency. See the Positioning & Strategy Guide
  for the full framing."_
- Cross-link the two-audience framing (§2) and values-as-positioning (§3) from the Site
  Guide's editorial-posture section.
- Add a one-line pointer to §1.5: e.g. _"Founder's authoritative statement of intent and
  the no-embellishment principle live in the Positioning & Strategy Guide §1.5 — consult
  it before building any tool or page."_ This is what stops the purpose from having to be
  re-litigated each session.

This keeps a single source of truth: operational voice/content rules stay in the Site
Guide; the strategic "why/for-whom" lives here and the Site Guide points to it.

---

## 5. Business direction

_Core intent is stated authoritatively in §1.5 (verbatim). This section holds the
operational/strategic specifics, now filled in by JM. Still evolving — JM revises as the
picture clarifies._

**Stated direction (per §1.5):** partner content with an Asset Management firm, or start
one with a group, to advance the case for Bitcoin as a viable asset worthy of investment —
with the site's tools/explorations serving as the credibility + confidence engine. Focus:
helping Bitcoiners and regular people get comfortable that Bitcoin belongs in a portfolio.

**The value to an AM partner.** The opportunity for an asset manager in partnering with Last
Coin Standing is twofold: (1) it may bring more traffic to the AM, but more importantly (2)
it brings **thought leadership and credibility** to the AM's efforts to position itself as a
Bitcoin partner — an ideal partner to help an investor take a position in Bitcoin. The
site's content provides an additional layer of credibility and thought leadership around
Bitcoin, further cementing the AM's positioning.

**What the AM effort concretely offers / partnership shape.** Undetermined and flexible. The
content might simply be *associated* with the AM, *white-labelled* under the AM's brand, or
formally *partnered/acquired* — the exact shape isn't decided yet; it will have to be seen.

**Partner profile — what JM/the site bring.** Most of the site's content is already useful to
an AM's existing investor audience and can attract a *new* audience of Bitcoin investors who
wouldn't otherwise become AM customers. JM's direct expertise and profile, plus the site,
could help an AM build a new Bitcoin investment "arm" from scratch — or bolster an existing
one — for better branding, positioning, and sales around Bitcoin.

**Relationship to JM's prior startup.** Essentially independent. Continued work on Last Coin
Standing improves JM's profile and "street credibility" in Bitcoin circles, which makes JM
more valuable to potential Bitcoin/Bitcoin-adjacent employers. The startup is still ongoing
but with narrower scope; JM's direct involvement is no longer required as it was, though JM
may re-engage after it hits certain milestones or secures someone to lead the US rollout.

**Free education vs. paid service.** JM does *not* foresee a "paid service" component on the
site itself. More likely, some content gets packaged/affiliated/white-labelled with an AM
partner, and *possibly* some becomes "AM customers only" — but that's uncertain. **Crucially:
these considerations should NOT influence what we build now.** The intent is to focus on
tools that help Bitcoiners and Normies prepare for their Bitcoin future — their
Bitcoin-denominated world and individual circumstances — and gain comfort, transparency, and
honest understanding of the prospects, benefits, *and risks* of their Bitcoin exposure.

**Scope guardrails (what the site is NOT about).** JM is keen to bring dynamism, live
updates, timely relevance, and "stickiness" to the site — but staying on mission and in the
right context. Explicitly *out of scope*: technical analysis, and heavy on-chain metrics —
both outside JM's expertise, and both would pull the tone and integrity of the site in a
different direction.

**Regulatory posture.** The investment-education vs. investment-advice line remains
important — flag for professional counsel before the site makes anything that reads as
advice. (JM: "Yes, this remains important.")

## 6. Growth & audience

**Stated goal:** grow usage and engagement among Bitcoiners and Normies.

**What "growth" means (JM).** Primarily *usage* — more new users, more engagement, more
retention and stickiness. Tools like The Bitcoin Retirement and other calculators are the
most relevant, engaging, and useful assets for this, and JM is keen to develop more of them
— potentially including **scenario analysis and simulations**.

**Supplementary channels JM is considering:**
- **YouTube video overviews** — one video per exploration/page, walking through it as an
  overview + tutorial (not new content, a companion to it). Aim: more traction, more personal
  identity for the site, more credibility for JM, and "bringing the site to life."
- **Substack articles** — again, one overview article per exploration to supplement/accompany
  each page.

These bring personal identity and reach without changing the site's on-mission core.

## 7. Roadmap alignment (how current work serves the mission)

The exploration pipeline maps onto the mission as follows (captured so build priorities
stay mission-aligned):

- **Retirement calculator (substantially complete)** — the two-view structure, the
  export-as-credibility principle, choose-your-own-input-meaning, and basis-consistency all
  made concrete here. It is the reference implementation of §3.5's patterns and the trust
  layer's proof-of-concept. Remaining ideas for it (roadmap, not urgent): sequence-of-returns
  scenario, allocation-sizing lens (both below).
- **Bull & Bear Cycles (next — the keystone)** — supplies the maturing-asset /
  shrinking-drawdown thesis and, more importantly, is the most direct expression of the
  "always acknowledge risk" half of the mission: its whole job is characterizing Bitcoin's
  drawdowns honestly. It is the sober counterweight to the retirement page's optimism, and
  it unblocks the sequence-risk tool. High priority.
- **Sequence-of-returns / bear-market scenario (after Bull & Bear)** — the honest downside
  counterpart; consumes Bull & Bear's output. Must be a risk tool, not reassurance (see §3):
  the user picks crash severity (including historical-depth), and the shrinking-drawdown
  thesis is a *selectable* assumption, never a reassuring default. **JM's framing:** a "what
  if" scenario analysis — e.g. *what happens to the retirement plan if a bear market hits at
  the start of retirement? Does it delay retirement or introduce other risks?* This is a
  strong engagement/stickiness driver as well as a credibility one.
- **Scenario analysis & simulations (roadmap theme)** — more broadly, JM sees "what if"
  scenarios and simulations as a high-value direction for engagement and usefulness, layered
  onto the existing calculators rather than as separate pages.
- **Allocation-sizing lens (roadmap)** — "what does 5% / 10% / 20% to Bitcoin do to the
  picture?" The most directly on-mission for the allocator question and for the AM-partner
  audience — it answers "some of your wealth," not "all-in."
- **Cross-page integration as a theme** — one exploration's output feeding another's input
  (Bull & Bear drawdowns → sequence-risk tool), not just "see also" links. Worth treating
  as a site principle.
- **Nav capacity (housekeeping)** — "The Numbers" dropdown was given a scroll fix as
  immediate relief; if it keeps growing, revisit the two-column / category-split as the
  durable answer.

---

## 8. What this guide is NOT
- Not a marketing plan or a pitch deck — it's the internal north star that keeps pages and
  features mission-aligned.
- Not legal/regulatory guidance — the education-vs-advice line (§5) needs real counsel.
- Not fully final where JM is still deciding (partnership shape, education-vs-paid line) —
  those parts of §5 are marked as evolving/undetermined by JM's own words, not gaps. This
  whole guide is JM's to revise. If it's wrong, it's wrong here first, on purpose, so it can
  be corrected in one place.
