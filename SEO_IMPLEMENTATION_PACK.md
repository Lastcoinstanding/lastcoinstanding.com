# SEO Implementation Pack — Titles, Metas & Calculator Schema

> **Migrated into the repo 2026-08-08.** Previously a project-only doc under the now-retired `claude/` location prefix; moved to repo root — tracked, alongside `TECH_DEBT.md` and `PAGE_IDEAS_BACKLOG.md` — so it can be read and updated directly in-session. Unreadable project-only copies had drifted (OPEN_ITEMS twice), which is why the split was retired. Everything below is the verbatim authoritative export as of the move; not rewritten. Internal `claude/…` cross-references below are pre-migration paths — the migrated planning docs now live at repo root without the prefix.

_Created 2026-07-22. Executes Priorities 2 and 4 of `SEO_AUDIT.md` as copy-paste blocks. All
slugs verified against the live `sitemap.xml`. Edit freely for voice — but keep the searched phrase in
the title, near the front. H1s on the pages stay evocative and unchanged; only the head changes._

---

## How to apply (per page)
In `src/_includes/_pageassets/<slug>-head.html`:
1. Replace the `<title>` text.
2. Replace `meta name="description"`.
3. Mirror the new title/description into `og:title`, `og:description`, `twitter:title`,
   `twitter:description` (house rule: og and twitter carry the same strings).
4. Leave canonical, og:image, and everything else untouched.
5. **After deploy, re-scrape the X card** for any page whose og:title changed (paste the URL in a draft
   post to force a refresh) — otherwise X serves the cached old card.

Two conventions I deliberately bent, with reasons:
- **Length.** NEW_PAGE_CHECKLIST §10 says titles under 60 chars "where possible." The hybrid titles run
  longer; Google truncates at ~600px and keeps the front, which is where the searched phrase sits. The
  tradeoff is deliberate: full display of a phrase nobody searches is worth less than partial display of
  one they do.
- **Suffix.** I've dropped "— Last Coin Standing" from the longest titles (Google usually appends the
  site name itself). Keep it where length allows; it's brand, not ranking.

**One cannibalization fix (important):** `/how-much-bitcoin` (Kelly) and `/bitcoin-allocation-sizing`
were both aimed at "how much bitcoin should I own" — two of your own pages competing for one query. The
titles below split them: Allocation takes *"how much bitcoin should you own"* (portfolio %), Kelly takes
*"how much bitcoin is enough"* (position sizing). Keep that split when editing.

---

## Priority 2 — Title + meta rewrites (nine pages)

### 1. `/the-bitcoin-retirement`
```html
<title>How Much Bitcoin Do You Need to Retire? — The Bitcoin Retirement</title>
<meta name="description" content="Free bitcoin retirement calculator: set your income, retirement year, and stack, and see whether it lasts — across three withdrawal strategies, every number checkable.">
```

### 2. `/bitcoin-allocation-sizing`
```html
<title>How Much Bitcoin Should You Own? — Bitcoin Portfolio Allocation</title>
<meta name="description" content="See what a 1%, 5%, or 10% bitcoin allocation does to a portfolio — growth and crash scenarios side by side, with the math shown and reproducible.">
```

### 3. `/the-bitcoin-retirement-stress-test`
```html
<title>What If a Bear Market Hits Your Bitcoin Retirement? — The Stress Test</title>
<meta name="description" content="Stress-test a bitcoin retirement plan against a bear market: choose the crash depth and timing — including history's worst — and see what survives.">
```

### 4. `/how-much-cash`
```html
<title>How Much Cash Should a Bitcoin Holder Keep? — How Much Cash?</title>
<meta name="description" content="A calculator for the cash-buffer question: how many months of expenses to hold in cash alongside a bitcoin stack — and what that buffer costs over time.">
```

### 5. `/wait-or-deploy-now`
```html
<title>Buy Bitcoin Now or Wait for a Dip? — Wait, or Deploy Now?</title>
<meta name="description" content="Should you deploy now or wait for a lower entry? Compare both against bitcoin's full history — including how often waiting for the dip meant paying more.">
```

### 6. `/bitcoin-vs-real-estate`
```html
<title>Bitcoin vs. Real Estate: Which Builds More Wealth?</title>
<meta name="description" content="Bitcoin or a house? Run the comparison for any start year, or project it forward under stated assumptions — leverage, costs, and taxes included.">
```

### 7. `/the-power-law`
```html
<title>Bitcoin's Power Law, Explained — with Live Charts</title>
<meta name="description" content="What the bitcoin Power Law is, why price has tracked it for fifteen years, and where its limits are — interactive charts computed live from the full price history.">
```

### 8. `/how-much-bitcoin`
```html
<title>How Much Bitcoin Is Enough? Position Sizing with the Kelly Criterion</title>
<meta name="description" content="A position-sizing exploration built on the Kelly criterion: what the math says about how much bitcoin to hold, and why the peak is not the target.">
```

### 9. `/bitcoin-vs-the-stock-market`
```html
<title>Bitcoin vs. the Stock Market: Returns Compared From Any Entry</title>
<meta name="description" content="Compare bitcoin's returns against the stock market from any entry month since 2010, over every holding period — honest about the windows where stocks won.">
```

_Later passes: `/bull-and-bear-cycles` ("Do Bitcoin Bear Markets Keep Getting Smaller?"),
`/borrowing-against-your-stack` ("Borrowing Against Bitcoin: Rates, Risks & the Math"),
`/disciplined-rebalancing`, `/lump-sum-or-ladder-in` ("Lump Sum vs. DCA for Bitcoin"),
`/the-bitcoin-horizon` (the "volatility is not risk" retitle candidate — coordinate with the branding
pass in the backlog before renaming)._

---

## Priority 4 — WebApplication schema for calculator pages

Add as a **separate** `<script type="application/ld+json">` block in each calculator page's head file
(alongside, not replacing, the existing Article/WebPage block). Template, filled for Retirement:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "The Bitcoin Retirement Calculator",
  "url": "https://lastcoinstanding.com/the-bitcoin-retirement",
  "description": "Free interactive calculator: how much bitcoin you need to retire. Set income, retirement year, and stack; see sustainability across three withdrawal strategies.",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "browserRequirements": "Requires JavaScript",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "publisher": { "@type": "Organization", "name": "Last Coin Standing", "url": "https://lastcoinstanding.com" }
}
</script>
```

Clone with these `name` / `description` values (url = the page's clean URL; everything else identical):

| Page | `name` | `description` (one line) |
|---|---|---|
| `/bitcoin-allocation-sizing` | Bitcoin Portfolio Allocation Calculator | Interactive tool showing what a 1–10%+ bitcoin allocation does to portfolio growth and drawdowns, including crash scenarios. |
| `/the-bitcoin-retirement-stress-test` | Bitcoin Retirement Stress Test | Stress-test a bitcoin retirement plan against bear markets of chosen depth and timing, including historical worst cases. |
| `/how-much-cash` | Cash Buffer Calculator | Calculates how many months of expenses to hold in cash alongside a bitcoin stack, and the long-run cost of the buffer. |
| `/wait-or-deploy-now` | Wait or Deploy Now Comparison Tool | Compares deploying capital into bitcoin now versus waiting for a lower entry, tested against the full historical record. |
| `/bitcoin-vs-real-estate` | Bitcoin vs. Real Estate Calculator | Compares bitcoin against home ownership for any start year, retrospective and projected, with leverage, costs, and taxes. |
| `/bitcoin-vs-the-stock-market` | Bitcoin vs. Stock Market Comparison | Compares bitcoin returns against the stock market from any entry month since 2010 over every holding period. |
| `/how-much-bitcoin` | Bitcoin Position Sizing (Kelly) Explorer | Explores bitcoin position sizing through the Kelly criterion, with interactive growth and drawdown curves. |
| `/disciplined-rebalancing` | Bitcoin Rebalancing Calculator | Models trim-after-surge, add-after-fall bitcoin rebalancing, including tax handling by account type. |
| `/borrowing-against-your-stack` | Borrow Against Bitcoin Calculator | Models borrowing against a bitcoin stack — LTV, liquidation risk, interest drag — against selling or holding. |
| `/lump-sum-or-ladder-in` | Lump Sum vs. Ladder-In Tool | Compares deploying bitcoin capital all at once versus laddering in, across the historical record. |
| `/your-deployment-plan` | Bitcoin Deployment Plan Builder | Builds a personal bitcoin deployment plan — capital and timeline modeled against the Power Law channel. |
| `/bitcoin-fixed-income` | Bitcoin Fixed Income Calculator | Compares bitcoin-backed income instruments against holding bitcoin and conventional fixed income, with stress scenarios. |

**Verification** (per NEW_PAGE_CHECKLIST §10 house pattern): after deploy,
`curl -sL https://lastcoinstanding.com/<slug> | grep -c "WebApplication"` should return ≥1, and spot-check
one page in Google's Rich Results Test.

---

## Sequencing note
Ship titles/metas and schema in one pass per page (same head file, one edit each). Then: Search Console
(if not yet verified) → wait 4–6 weeks → read the Performance report and re-tune the two or three pages
where impressions are climbing but clicks lag. The FAQ blocks (`FAQ_BLOCKS_AND_SCHEMA.md`) can
ship in the same pass or separately — they're independent.
