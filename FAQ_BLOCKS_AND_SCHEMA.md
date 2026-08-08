# FAQ Blocks + FAQPage Schema — Drafts & Template

> **Migrated into the repo 2026-08-08.** Previously a project-only doc under the now-retired `claude/` location prefix; moved to repo root — tracked, alongside `TECH_DEBT.md` and `PAGE_IDEAS_BACKLOG.md` — so it can be read and updated directly in-session. Unreadable project-only copies had drifted (OPEN_ITEMS twice), which is why the split was retired. Everything below is the verbatim authoritative export as of the move; not rewritten. Internal `claude/…` cross-references below are pre-migration paths — the migrated planning docs now live at repo root without the prefix.

> **STATUS CORRECTED 2026-07-26 — read before using this doc.**
>
> **Five pages carry FAQs today**, not one: `/the-bitcoin-retirement` (5 Q), `/discount-or-premium`
> (4 Q), and — contrary to what this doc and `SEO_AUDIT.md` §Priority 3 said until today — all three
> pages drafted below were **already shipped by hand**: `/bitcoin-allocation-sizing` (4 Q),
> `/wait-or-deploy-now` (3 Q), `/bitcoin-vs-real-estate` (3 Q). Rollout step 2 is **done**.
>
> **The drafts below are therefore historical.** The shipped on-page text is the source of truth and
> may differ from these drafts. Never wire these drafts onto a page without first reading what that
> page actually ships — a build prompt written from this doc's stale status caused exactly that error
> on 2026-07-26 (duplicate FAQ blocks and duplicate schema on three indexed pages, caught on a gate
> and reverted before merge).
>
> **Rollout step 4 is in flight** on branch `faq-component`: the FAQ is now a layout-level component
> driven by a `faq:` front-matter array, rendered once as the visible block and once as the FAQPage
> JSON-LD from a single source. STYLE_GUIDE §6.40 and NEW_PAGE_CHECKLIST §10 document it. Retirement
> and Discount-or-Premium are migrated; the other three await the same migration.
>
> **Standing rule this incident establishes:** this doc records intent, not repo state. Verify current
> page state against the repo before acting on anything here.

_Created 2026-07-22. Executes Priority 3 of `claude/SEO_AUDIT.md`: a short, honest FAQ at the bottom of
each flagship page, marked up with FAQPage JSON-LD. The Bitcoin Retirement is the fully-worked example
(visible HTML + matching JSON-LD); the other flagships get drafted Q&As to wire the same way. All
answers are in the site's register — plain, honest, no hype — and written to match real search queries._

---

## Honest expectations note (read first)
Since 2023, Google **restricts FAQ *rich results* (the expandable Q&A snippet in search) to a narrow set
of authoritative sites** — so don't count on the visual snippet. The FAQ blocks still earn their keep
three other ways, which is why they remain Priority 3:
1. **Query matching** — the questions put the exact words people search onto the page ("how much bitcoin
   do I need to retire"), which the evocative copy currently lacks. This is the main SEO value.
2. **AI-answer eligibility** — structured Q&A is exactly what AI search (Google AI Overviews, Perplexity,
   ChatGPT search) lifts and cites; pairs with the site's existing `llms.txt`.
3. **Reader value** — this *is* the "key-insights call-out" from the backlog: the spoon-fed takeaway for
   readers who want the point before the depth.

## Implementation rules
- **Visible text and JSON-LD must match** (Google policy: schema may not describe content that isn't on
  the page). Write the block first; paste the same strings into the JSON-LD.
- Place the FAQ **after the main content, before the related-pages strip**. Keep to **3–5 questions**.
- Wire per the house pattern: markup in the page template; JSON-LD added to
  `src/_includes/_pageassets/<slug>-head.html` alongside the existing Article/WebPage block (a page can
  carry both — use separate `<script type="application/ld+json">` blocks).
- Adapt classes to `STYLE_GUIDE` components (the markup below is deliberately generic — restyle to the
  house look; a `<details>` disclosure or a plain H2 + H3 stack both work. **If styled as collapsible,
  the text must still be in the DOM**, not injected on click).
- Voice check: every answer should pass POSITIONING §1.5 — state limits plainly, no manufactured
  certainty, never "this shows you'll be fine."

---

## 1. The Bitcoin Retirement (`/the-bitcoin-retirement`) — fully worked example

### Visible FAQ block (HTML)

```html
<section class="page-faq" id="faq">
  <h2>Common questions</h2>

  <h3>How much bitcoin do I need to retire?</h3>
  <p>There is no single number — it depends on your target income, your retirement year, and what you
  assume about bitcoin's price path. This calculator lets you set all three and shows whether a given
  stack sustains your income year by year, including the scenarios where it depletes. The honest answer
  is a range you explore, not a figure anyone can hand you.</p>

  <h3>Can you really retire on bitcoin alone?</h3>
  <p>Under some assumptions yes, under others no — and the difference is visible in the projection. A
  stack that reaches escape velocity under one price model can deplete under a harsher one, and a bear
  market early in retirement changes the picture more than one that comes late. The companion
  <a href="/the-bitcoin-retirement-stress-test">Stress Test</a> models exactly that risk.</p>

  <h3>How does the calculator project bitcoin's future price?</h3>
  <p>It uses the Power Law trend — a regression of bitcoin's full price history against time, with
  coefficients credited to Porkopolis Economics — as a central-tendency assumption, not a forecast. You
  choose the price basis and inflation assumptions yourself, and every projected number is reproducible
  from the adjacent ones. The model's limits are stated on the page, not hidden.</p>

  <h3>What withdrawal strategies does it model?</h3>
  <p>Three: selling bitcoin as needed, borrowing against the stack, and disciplined rebalancing. Each has
  a different shape of risk — tax events, liquidation exposure, sequence risk — and each links to a
  dedicated page that treats it in depth.</p>

  <h3>Is this financial advice?</h3>
  <p>No. It is an educational tool: you choose the assumptions, the math runs live, and you can export the
  full projection to CSV and check every number in your own spreadsheet. What you decide is yours; what
  we owe you is arithmetic you can verify.</p>
</section>
```

### Matching JSON-LD (add to `the-bitcoin-retirement-head.html`)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much bitcoin do I need to retire?",
      "acceptedAnswer": { "@type": "Answer", "text": "There is no single number — it depends on your target income, your retirement year, and what you assume about bitcoin's price path. This calculator lets you set all three and shows whether a given stack sustains your income year by year, including the scenarios where it depletes. The honest answer is a range you explore, not a figure anyone can hand you." }
    },
    {
      "@type": "Question",
      "name": "Can you really retire on bitcoin alone?",
      "acceptedAnswer": { "@type": "Answer", "text": "Under some assumptions yes, under others no — and the difference is visible in the projection. A stack that reaches escape velocity under one price model can deplete under a harsher one, and a bear market early in retirement changes the picture more than one that comes late. The companion Stress Test models exactly that risk." }
    },
    {
      "@type": "Question",
      "name": "How does the calculator project bitcoin's future price?",
      "acceptedAnswer": { "@type": "Answer", "text": "It uses the Power Law trend — a regression of bitcoin's full price history against time, with coefficients credited to Porkopolis Economics — as a central-tendency assumption, not a forecast. You choose the price basis and inflation assumptions yourself, and every projected number is reproducible from the adjacent ones. The model's limits are stated on the page, not hidden." }
    },
    {
      "@type": "Question",
      "name": "What withdrawal strategies does it model?",
      "acceptedAnswer": { "@type": "Answer", "text": "Three: selling bitcoin as needed, borrowing against the stack, and disciplined rebalancing. Each has a different shape of risk — tax events, liquidation exposure, sequence risk — and each links to a dedicated page that treats it in depth." }
    },
    {
      "@type": "Question",
      "name": "Is this financial advice?",
      "acceptedAnswer": { "@type": "Answer", "text": "No. It is an educational tool: you choose the assumptions, the math runs live, and you can export the full projection to CSV and check every number in your own spreadsheet. What you decide is yours; what we owe you is arithmetic you can verify." }
    }
  ]
}
</script>
```

---

## 2. Bitcoin Portfolio Allocation (`/bitcoin-allocation-sizing`) — drafted Q&As

**How much bitcoin should I have in my portfolio?**
There is no universal percentage — the honest question is what different allocations *do* to your
portfolio, in both directions. This tool shows the growth and the drawdown consequences of 1%, 5%, 10%,
or any allocation you choose, so you can find the size whose bad case you can actually live with.

**What happens to my portfolio if bitcoin crashes?**
The crash view models exactly that: pick a drawdown depth (including the historical worst cases) and a
recovery path, and watch what it does to the whole portfolio at your chosen allocation. A tool that only
showed the upside would be marketing; this one lets you stress the downside as hard as you like.

**Is a small bitcoin allocation even worth it?**
Sometimes yes, and the math is the point: because bitcoin's historical growth has been so much higher
than other assets', even small allocations can move the long-run outcome materially — while keeping the
crash exposure small. Run it both ways and compare; the numbers are all reproducible.

**Should I rebalance my bitcoin allocation?**
That is a real decision with real tradeoffs — trimming after surges caps both risk and upside, and in a
taxable account each trim is a taxable event. The sibling page
<a href="/disciplined-rebalancing">Disciplined Rebalancing</a> treats it fully.

---

## 3. Wait, or Deploy Now? (`/wait-or-deploy-now`) — drafted Q&As

**Should I buy bitcoin now or wait for a dip?**
This page's whole argument is that the question is subtler than it looks: because the Power Law trend
rises with time, waiting for a *lower fraction of trend* can still mean paying a *higher price* if the
wait is long enough. The tool lets you compare deploying now against waiting, across the historical
record, rather than guessing.

**Is lump sum or dollar-cost averaging better for bitcoin?**
Historically, deploying earlier has beaten waiting more often than not — the same result the lump-sum
vs. DCA literature finds for other assets — but the page shows you the full distribution, including the
periods where waiting won. The point is to see the odds honestly, not to receive a verdict.

**Can you time the bitcoin bottom?**
The record shown here suggests you should not plan on it. Below-trend entries have historically been
attractive, but *how long* the market stays below trend is not predictable — which is precisely the
tradeoff this tool makes visible instead of hiding.

---

## 4. Bitcoin vs. Real Estate (`/bitcoin-vs-real-estate`) — drafted Q&As

**Is bitcoin a better investment than real estate?**
Looking back, the comparison is not close — and the retrospective calculator shows the actual numbers
for any start year you choose. Looking forward is a different question, which the projection mode treats
under stated assumptions rather than as a verdict. Both views show their work.

**Should I buy a house or buy bitcoin?**
This page will not answer that for you — housing is shelter as well as an asset, and the honest
comparison includes mortgage leverage, maintenance, taxes, and the value of living in what you own. What
it will do is put real numbers on the tradeoff you would otherwise make on instinct.

**Does real estate hold its value better than bitcoin?**
Real estate is less volatile year to year; over the long span the comparison inverts. The page shows
both facts rather than choosing one — volatility and long-run purchasing power are different questions,
and conflating them is how most of this debate goes wrong.

---

## Rollout order — status as of 2026-07-26
1. ✅ **DONE** — Retirement block + schema shipped.
2. ✅ **DONE** — Allocation, Wait-or-Deploy and BvRE all shipped by hand (this line said "later pass"
   until 2026-07-26; it was stale, and a build prompt written from it caused a duplicate-FAQ error).
   Discount-or-Premium also shipped its own FAQ as part of that page's build.
3. ⬜ **OPEN — the remaining backfill.** Candidates, highest query-intent first: Bull & Bear Cycles
   ("bitcoin 4 year cycle"), Borrowing Against Your Stack, Lump Sum or Ladder In (this one owns the
   "lump sum vs DCA bitcoin" query — keep it off Wait-or-Deploy), The Power Law, Bitcoin vs. The Stock
   Market, How Much Bitcoin?, How Much Cash?, the Stress Test, Disciplined Rebalancing, Bitcoin-Backed
   Mortgages. **Do not** add FAQs to conceptual pages (Bitcoin Defined, The Synthesis, What Money Is
   For, Half-Life, Fixed Pie) or hubs — low query intent, and an FAQ appended to an essay reads as
   furniture and cheapens the pattern where it does real work.
4. 🔄 **IN FLIGHT** — branch `faq-component`: layout-level component + `faq:` front matter, single-
   sourcing the visible block and the JSON-LD; STYLE_GUIDE §6.40 and NEW_PAGE_CHECKLIST §10 written.
   Phases 1–2 gate-verified; the three-page migration remains.

_Verify slugs against the repo before wiring (a couple above are inferred). Edit freely for voice — these
are drafts written to be cut, and the JSON-LD must always mirror the final on-page text._
