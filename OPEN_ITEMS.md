# Open Items Tracker — Last Coin Standing

> **Migrated into the repo 2026-08-08.** Previously a project-only doc under the now-retired `claude/` location prefix; moved to repo root — tracked, alongside `TECH_DEBT.md` and `PAGE_IDEAS_BACKLOG.md` — so it can be read and updated directly in-session. Unreadable project-only copies had drifted (this tracker twice), which is why the split was retired. Everything below is the verbatim authoritative export as of the move; not rewritten. Internal `claude/…` cross-references below are pre-migration paths — the migrated planning docs now live at repo root without the prefix.

_Created 2026-07-23. The single running list of dated, in-flight items across all workstreams — each
points to the doc that holds the detail. Reminders marked ⏰ are scheduled to fire back into the Cowork
session automatically. Close items here when done; this file is the "what's cooking" view, not the plan
(plans live in the linked docs)._

---

## In flight (dated)

- [ ] **THE RUNDOWN v2 — LISTING PASS EXECUTED ON ONE BRANCH; AWAITING JM'S MERGE.**
  Merged to production 2026-09-02 (PR #97, merge `fc773b6`) carrying v2 "The Briefing" and
  the site-wide unified floor-visit definition. **`/the-rundown` is live but unlisted** —
  `noindex, nofollow`, and absent from `sitemap.xml`, `llms.txt`, `explorations.json` and the
  nav, each verified individually on production after the merge.

  **Status of the review, kept in the record because the record needed it.** For three days
  this entry read that the review **had not happened** — an earlier "Reviewed both surfaces"
  instruction went out with the review still to come, and the merge proceeded on it. Nothing
  public shipped unauthorized: the Floor-page changes were separately and explicitly ruled on
  their own before/after table (JM ruling 6, `FLOOR_VISIT_DEFINITION_MINIREPORT.md`), and the
  Rundown itself was unlisted, so no unreviewed surface was reachable by a reader who was not
  handed the URL. **The review has since run in full** — visual pass, v2.1 rounds one and
  two, and round three — and is closed.

  **Register round two is DONE and shipped (2026-09-05).** Both parts ratified by JM:
  part one (date wording, module-count line, module titles, state-aware title, tooltips,
  two defects) and part two (the header card recast to "Times at the floor since 2014",
  the tooltip clipping fix on both grids plus a measured off-screen clamp, inline tip
  placement per §6.13, and the 2010/2014 era clause). Two further duplications were found
  and removed under JM's rule that **no card in any state duplicates the header** — the
  at-trend third card, replaced by the longest stretch away from trend on record, and the
  floor identity's count card, now carrying only the completed/open split. All page-local
  and direct to main; the page stays unlisted. The whole-months, episode-basis and `?mult=`
  branches were merged the same day and their branches deleted.

  **Register round three closed 2026-09-05 with no further edits** (JM). The register
  review is therefore complete.

  **THE COUNSEL PASS IS DONE (2026-09-07) — formal counsel WAIVED for public listing.**
  The decision record is filed **verbatim** at the foot of this tracker, as
  *"Counsel decision record — The Rundown — 2026-09-07"*, on JM's instruction and with its
  SHA1 verified at filing time (`c4f19361…`). Headline: no registration attaches at any
  level (federal securities, federal commodities, state, BitLicense); the publisher
  exclusion is satisfied by the page's design rather than by disclaimer; the one live
  exposure is anti-fraud **accuracy**, which the register already governs, closed by five
  boundary edits. Formal review is engaged at the first licensing engagement, where it is
  needed regardless and is funded within that deal. The licensee-tier versioning spec in
  that record is **not** applied to the public page and must not leak onto it.

  **THE LISTING PASS IS EXECUTED, ON ONE BRANCH, AWAITING JM'S MERGE (2026-09-07).**
  Branch `feat-rundown-listing`; `feat-sister-tabs-dashboard` was rebased onto main and
  merged into it, so there is one branch and one preview, per JM. **The merge to main is
  JM's.** Status of each item:

  - **Steps 1–7 — done.** `noindex` and the preview guard deleted; the preview note and its
    dead CSS rule removed (`rd-preview-note` greps to zero); registered in
    `explorations.json` beside `discount-or-premium` in Models & Trends (array position is
    dropdown position); no nav anchor added or wanted; `sitemap.xml`, `llms.txt` and
    `updates.json` each carry one new entry, the `llms.txt` one written fresh; the OG card
    image, its `staticAssets` registration and both tag blocks landed **in one commit**;
    reciprocal `related:` entries with written `desc:` lines added to the seven siblings,
    the Dashboard deliberately excluded.
  - **Step 8 — done.** `feat-sister-tabs-dashboard` merged (rebased first). It is the first
    and only inbound link, and the Dashboard tab points at `/the-rundown`, verified.
  - **Step 9 — done.** `SITE_GUIDE §54` rewritten to the v2 page and retitled (it was
    "UNLISTED PREVIEW"). The **[JM-3] routing-chip paragraph is struck**, the "Open at the
    unlisted ship" list is rewritten as a shipped record, and the register-review history
    and the counsel decision are folded in. Also corrected while there: §54's **"the page
    takes zero user inputs"** claim, which was v1's structural guarantee and had gone false
    — v2 takes three inputs plus a question, and the guarantee is now what they *do*
    (browser-local, filter-only, never advice), which is the basis the counsel pass actually
    tested the publisher exclusion against.
  - **Step 10 — nothing to do.** Carousel slide stays ruled out; now recorded in §54 too, so
    it is not re-opened from the guide either.
  - **OG card — delivered and shipped, ahead of the note above.** The card *was* in
    Downloads (`og-the-rundown.jpg`, plus its generator), and `OG_SPEC_THE_RUNDOWN.md` was
    already in the repo — the "spec still needed" note was stale. Checked against the spec
    before installing: 1280×720, RGB, 65,542 bytes (§2.1 target 60–100 KB), the four §3
    strings exact, brand-forward with the bare textured ₿, and **no multiple, price, date or
    count** (§11.9). The generator is committed as `build-og-the-rundown.py`, beside the
    other `build-og-*.py` scripts, and it composites from `og-synthesis.jpg` — the template
    the spec names, not `og-the-power-law.jpg`, which the spec explicitly warns against.
  - **Vocabulary — done.** "stretches" → "episode(s)" on the Rundown, tooltip kept and now
    defining the same noun. This makes the visible prose agree with the noun the page was
    already computing in: the data model, the N<3 thinness rule and the sources lines all
    counted in **episodes** already. Carried across to Discount-or-Premium, where "stretch"
    was the visible synonym for the same thing. The one place it was first held back — the slider caption, which was on the sample basis — was ruled by JM the same day and is now on the episode basis with the markers beside it; see the rulings below.
  - **Counsel edits 3, 4 and 5 — applied as exact strings.** P2 takes the floor-holds
    condition (plus the standard "what would break this" anchor the other conditional
    register lines already carry); the Coda's DCA item drops the "honest read" self-label;
    P1 states that it models bitcoin alone.
  - **Counsel edit 1 — applied as an exact string, after JM resolved the host.** As first
    written, edits 1 and 2 had **no target on the site**: edit 1 replaced "the line that
    reads *not a registered investment advisor*" and no such line existed anywhere, and
    edit 2 named an **"exploration ribbon"** that is not a component here (the site-wide
    strip is the **Channel Ribbon**, `§40`, a barometer of live readings that
    "before fees, spreads and taxes" does not describe; the Rundown's own `.rd-ribbon` is
    page-local). Rather than guess a host for two boundary statements the counsel decision
    rests on, the question went back to JM, who **folded edit 2 into edit 1** and put both
    in **`components/tool-framing.njk`** — the collapsible "For exploration only" strip,
    which is the site's actual disclaimer surface and renders on **28 pages**, the Rundown
    among them. The record was reissued to match (see its edit 1, and edit 2 now reading
    *folded into 1*), and the filed copy below was replaced from the reissued file. The
    applied string was diffed back against the record: **byte-identical, 662 bytes.**
    The strip is **extended, not replaced** — the three added clauses are the
    fee/spread/tax basis, the no-registration line, and the computes-in-your-browser line,
    which is the one doing the real work: the publisher exclusion is satisfied by what the
    tools *do*, not by asserting it. A comment above the markup says so, because the
    "commodity interests" list is a CEA term of art and reads like padding to anyone who
    does not know that.

  **BOTH OPEN ITEMS RULED BY JM, 2026-09-07, on the same branch before merge.**
  Each was found while executing the pass and neither was in the counsel record; both are
  now closed, and the record itself is untouched — these sit beside it, not inside it.

  1. **D2's register line takes the same fix as counsel edit 4 — RULED, applied.** The
     record's Q4 named the *"honest read"* self-label as the fix but its edit 4 reached
     only the Coda. The identical phrase was also in **D2's register line**; JM ruled the
     same wording there: *"…a ladder begun today is the **closest available comparison**."*
     Recorded beside edit 4 on JM's instruction, because the two are one fix applied in two
     places, and a future reader comparing the page against the record would otherwise find
     a string the record does not account for. **`"honest read"` now greps to zero across
     `src/`** — the only surviving instance is a sentence in `updates.json` about a
     *different* page (the Stress Test's "honest reading of a recovery"), which is a
     historical entry in a different sense and is not touched.
     D2's module header comment was updated in the same commit so the comment and the
     register line it describes do not disagree.

  2. **The Discount-or-Premium slider caption reads the EPISODE basis — RULED, applied.**
     JM: read from the episode row, noun *"episodes"*, so the caption agrees with the row
     beneath it; **the sample basis stays in its labelled row only.** Applied, and that last
     clause turned out to reach further than the caption:
     - **The slider markers had the same defect.** `fastest / median / longest` sat
       immediately above the caption and also read `rec.median` / `rec.max` — the sample
       basis. Fixing only the caption would have printed *median 8 months* in the caption
       under a marker tooltip reading *median: ~9 months*, on one control. They are moved
       to the episode basis too, which is what "sample basis in its labelled row only"
       requires. **`rec.min/median/max` now appear in exactly two places: the labelled
       sample row, and the `[dp-duration]` console QA line.**
     - **Episode stats are hoisted out of the row's closure.** They lived inside the
       episode row's own IIFE, which is *why* the markers and caption were left on the
       sample basis — the episode numbers were not in scope where they were needed. Three
       consumers now read one computation, so they cannot drift apart again.
     - **The N<3 rule had to come with it.** The caption previously used samples, which are
       always plentiful, so it never met the thinness rule. Episodes can be thin, and a
       caption publishing a median off two episodes would break the site's own rule on the
       page that owns it. Under three completed episodes the caption now names them and
       says why, and the markers show one per episode rather than averaging a median into
       existence. The zero-completed case is handled too.
     - **The "all inside this slider's left half" clause is now computed, not asserted.**
       It was a hardcoded claim. The longest *episode* can exceed the longest *sample* —
       an episode is measured from its start, a sample from any point inside it — so
       moving the caption to episodes is exactly the change that could have made that
       sentence false without anyone noticing. It now states the reach it measures.

  **THE BRIEFING-SETUP CHIP — RULED AND FIXED, 2026-09-07, same branch before merge.**
  Two defects, both JM's call, both verified on the preview.

  1. **The chip went stale.** `renderSetupChip()` was called from `renderAll()` only, and
     `renderAll()` does not run when the year, the income or the intent changes — those
     handlers render the modules that depend on them and nothing else. A reader could set
     **2040 / $250K / Raise cash**, collapse the panel, and be left reading a chip that
     still said **2035 / $100K / Just looking** — the summary of their situation,
     describing someone else's. It is now re-rendered from every control that can change
     what it says: both sliders, the six intent chips, and the remember toggles.
  2. **It was a one-way door.** "change ▾" opened the panel and the chip then vanished, so
     there was no way back and no summary while editing. It is now a disclosure toggle —
     **"change ▾" / "done ▴"** — with the chip visible in **both** states. The caret follows
     `aria-expanded` in CSS and the word is set by the script from that same state, so the
     two cannot disagree. Focus moves into the form on open and back to the chip on close,
     so a keyboard reader is never stranded on an element that just became hidden.

  **The state had to be made to survive a reload, which is what "same state" needs.** It
  could not before: collapse was *derived* from whether the URL or the store had seeded a
  value, so a reader who collapsed and reloaded got the panel back when nothing was seeded,
  and one who **expanded** and reloaded had it collapse again. The panel's open/closed state
  is now kept, deliberately apart from the value store:

  - **sessionStorage, not localStorage** — it lasts a reload and dies with the tab, the same
    lifetime the stack has, so collapsing a panel leaves nothing on the device.
  - **Its own key** (`lcs.the-rundown.ui.v1`), so it can never be mistaken for a remembered
    *value* and the per-field "remember on this device" toggles keep meaning what they say.
  - **Cleared by "Clear everything"**, and neither that button nor a page load writes it
    back — only a reader's own click does. So the button's promise (*nothing is left in this
    browser's storage for this page*) stays literally true, and **a first visit still leaves
    nothing behind**. Verified: before → `ui:"closed"`, `store:present`; after → both `null`.

  A reader's own choice outranks the seeded rule; with no preference set the seeded rule is
  unchanged, so a first visit still gets the panel rather than a chip.

  **The retired "numbers they never chose" note was rewritten, not dropped.** That reasoning
  belonged to the replace-the-panel design, where a chip standing **alone** read as a record
  of the reader's choices. Sitting directly above the open panel it reads as a live summary
  of the controls beneath it, which is what it now is. What survives is the part that still
  holds: the panel still **opens** on a first visit and only starts collapsed when something
  actually supplied a value.

  **Verified on the preview**, in JM's order: chip tracked `2035 · $100K · Just looking` →
  `2040 · …` → `… · $250K · …` → `… · Raising cash` live, one control at a time; three
  toggle clicks round-tripped collapsed → expanded → collapsed with the right label, caret,
  `aria-expanded` and focus each time; **reload while collapsed → collapsed**, and **reload
  while expanded with values seeded from the URL → expanded** (the case that previously
  forced a collapse). Tooltip audit re-run clean at 1280 / 768 / 375, no console errors.

  **Verification still to run, on the preview and then after the merge.** Each listing
  surface individually, the same discipline used to confirm the page was unlisted, run in
  reverse; `curl -I` on the OG image expecting **`Content-Type: image/jpeg`** (a `text/html`
  at 200 is the phantom-200 failure); then resubmit the sitemap and request indexing
  (`NEW_PAGE_CHECKLIST §10`). **No third-party scrape tests** — JM's instruction, and the
  spec's sequencing note says the same.

  **Gated on it, in order (amended 2026-09-05; all gates now cleared 2026-09-07):**
  ~~register round two~~ → ~~register round three~~ → ~~the **counsel pass**~~ →
  ~~the **listing pass**, whose *step one* is now merging the branch
  `feat-sister-tabs-dashboard`~~. That branch was **rebased onto main and merged into
  `feat-rundown-listing`** on 2026-09-07; the hold is lifted, its own preview is
  superseded, and everything now rides on the one listing branch below. It is the first
  and only inbound link to `/the-rundown`, so merging it is what makes the page reachable.

  ---

  #### THE LISTING PASS — written out in full (2026-09-05); EXECUTED 2026-09-07 on `feat-rundown-listing`

  **The counsel pass has cleared, and this was executed on 2026-09-07** — kept below as written, because it is the record of what was specified as well as the instructions that were followed. Deviations and open items are listed in the execution record above; the one substantive addition JM made on the day was a set of page-content edits, which is why the last sentence of this paragraph no longer holds.
  The order matters in two places and is called out where it does; otherwise it is one
  commit's worth of work. **Nothing here is a page-content change** — the page ships as
  reviewed.

  **0 · Before anything, get the card in hand.** The OG image comes from the drafting
  side against `OG_SPEC_THE_RUNDOWN.md` (brand-forward; **no viewport, no selector** — the
  spec's §0 table answers this). It is **cleared to render**: round three closed the copy
  gate. If it is not in hand, do steps 1–7 anyway and land the card separately — a missing
  card does not block listing, but a **tag pointing at a missing file does**, so steps 6a
  and 6b never separate.

  1. **`noindex` off.** `src/_includes/_pageassets/the-rundown-head.html` — delete
     `<meta name="robots" content="noindex, nofollow">` **and** the multi-line guard
     comment above it that explains the hold. Leave the `<title>`, description and canonical
     untouched; they are register-canonical and static by design.

  2. **The unlisted-preview note.** `src/the-rundown.njk` — remove the
     `<!-- ═══ PREVIEW NOTE ... ═══ -->` block and its `.rd-preview-note` div (one block,
     near the foot of the template). Then remove the now-dead `.rd-preview-note` rule from
     `src/_includes/_pageassets/the-rundown.css`. **Grep `rd-preview-note` afterwards and
     expect zero hits** — the CSS rule is the half that gets left behind.

  3. **`src/_data/explorations.json`.** Add the entry in the **Models & Trends** group of
     the **numbers** category, beside `discount-or-premium`:
     ```json
     {
       "slug": "the-rundown",
       "title": "The Rundown",
       "category": "numbers",
       "group": "Models & Trends",
       "interactive": true
     }
     ```
     **No `calculator_tile`.** The page takes inputs but issues no personal calculation —
     it filters which record is shown. Same posture as Discount-or-Premium, and the
     `/calculators` grid is for tools that compute *your* number.

  4. **Nav — The Numbers group, no new top-level item.** Registration in step 3 is what
     puts it in the dropdown; `base.njk` iterates the registry for the three category
     menus, so **no hardcoded anchor is needed or wanted.** The desktop nav row has no
     headroom for a 7th top-level item (measured: the wordmark wraps below ~950px already,
     `SITE_GUIDE §56`), which is exactly why this goes in a group rather than beside it.

  5. **`sitemap.xml` and `llms.txt`.**
     - `sitemap.xml`, in The Numbers block beside `discount-or-premium`:
       `<url><loc>https://lastcoinstanding.com/the-rundown</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>`
     - `llms.txt`, The Numbers section: one entry in the house shape —
       `- [The Rundown](https://lastcoinstanding.com/the-rundown): …` — describing the
       composition (position → question → modules, each routed to the tool that owns it),
       the thinness rule, and that it is a briefing rather than a recommendation. Write it
       fresh; do not paste the meta description, which is shorter and aimed elsewhere.
     - **`updates.json`** — one entry, per the per-commit rule at the head of
       `MONTHLY_REFRESH_CHECKLIST`. This is the page's public debut.

  6. **The OG card, in one commit, in this order.** (`OG_SPEC_THE_RUNDOWN.md` §4.)
     a. `og-the-rundown.jpg` at the **repo root**, and `'og-the-rundown.jpg'` added to the
        `staticAssets` array in `.eleventy.js`. **This is the step that silently fails** —
        without it Cloudflare serves the page's HTML at the image URL with a 200 and the
        card breaks everywhere with no build error.
     b. The `og:image` / `twitter:image` block into `the-rundown-head.html`, replacing
        the deferred-OG comment so the file stops describing a plan that has happened.
     c. Validate with `curl -I` → **`Content-Type: image/jpeg`**. A `text/html` at 200 means
        (a) was missed. Third-party scrape-testing is now safe — the page is public.

  7. **Related strips on the siblings.** The Rundown's own `related:` names eight pages;
     the house convention is bidirectional (`SITE_GUIDE §41`). Add a `the-rundown` entry
     with a written `desc:` to: `dashboard`*, `the-power-law`, `the-bitcoin-floor`,
     `wait-or-deploy-now`, `lump-sum-or-ladder-in`, `discount-or-premium`, `how-much-cash`,
     `bitcoin-escape-velocity`. **\*The Dashboard is the exception** — it carries no
     `related:` front matter at all (the jump-back-in row does that job, `SITE_GUIDE §47`),
     and the sister-tabs control is its link. Leave it out rather than introducing a strip.
     Each `desc:` is a sentence about what the Rundown gives *that page's* reader, not a
     generic blurb — a route label names its destination (`STYLE_GUIDE §10.7`).

  8. **`feat-sister-tabs-dashboard` — merge.** Held until here. It is the reciprocal half
     of the control already live on the Rundown, and merging it is what makes the page
     reachable from the Dashboard.

  9. **`SITE_GUIDE §54` update.** Deferred to this pass by JM's ruling of 2026-09-05.
     Two known-stale things to fix while there, both already ruled elsewhere: the
     **hero-selector clause** (struck 2026-09-05 in place, since the drafting side could
     have acted on it — but §54's "Open at the unlisted ship" list still needs rewriting as
     a *shipped* record), and the **[JM-3] routing-chip paragraph**, which describes a
     commit that is cancelled, not pending. Retitle the section — it is no longer
     "UNLISTED PREVIEW" — and fold in the register-review history.

  10. **Carousel slide — NO.** Ruled: a position read is the same case the Dashboard made
      for having no slide (`SITE_GUIDE §13`). Recorded so nobody re-opens it.

  **After deploy, verify each surface individually** — the same discipline used to confirm
  the page was unlisted, run in reverse: the page appears in the nav dropdown, in
  `sitemap.xml`, in `llms.txt`, in the exploration registry and on each sibling's strip;
  `noindex` is gone from the served HTML; the OG image returns `image/jpeg`. Then resubmit
  the sitemap and request indexing (`NEW_PAGE_CHECKLIST §10`, publish-day habit; the
  standing sweep is `MONTHLY_REFRESH_CHECKLIST §9.5`).

  **Registry ordering note:** `base.njk` builds the three category menus by iterating
  `explorations.json` **in array order**, so where the entry sits in the file is where it
  sits in the dropdown. Placing it beside `discount-or-premium` in step 3 is what puts it
  next to the page it most resembles; it is not cosmetic.

  **The JM-3 dashboard routing chip is RETIRED, superseded by the sister-tabs control**
  (JM, 2026-09-04). JM-3 specified one chip added to the Dashboard pointing at the Rundown,
  as its own commit after public listing. The sister-tabs control does that job better and
  does it symmetrically — it states the two pages' relationship on both, rather than adding
  a one-way pointer on one — so the chip is not deferred, it is cancelled. `RUNDOWN_DESIGN.md`
  still carries the JM-3 ruling in four places; those are historical record and are not
  amended, but nothing should be built from them.

  Detail: `RUNDOWN_DESIGN.md` Part I §8 (ship gate) and §12, `RUNDOWN_PHASE0_V2_REPORT.md`,
  `RUNDOWN_V21_CLASS_C_PROPOSALS.md` §6.

- [x] **MERGE-ORDER RECONCILIATION — the Rundown's old-pattern icon lines. DONE**
  (`6f67dfe`, 2026-09-02.) Recorded 2026-08-29, before the brand branch merged, and it played
  out exactly as predicted: `feat-brand-mark-adoption` landed first and made
  `components/head-icons.njk` the single source for the favicon cascade; the Rundown's
  `-head.html` was a new file on its own branch, so git had nothing to conflict with and the
  duplicate survived the merge of main silently. Caught by measuring the built page rather
  than reading the diff — **11 icon `<link>`s on `/the-rundown` against 6 on
  `/discount-or-premium` as a control** — and the local copy was also the *pre-adoption* set,
  missing `favicon-48x48.png`. The block is deleted; both pages now read 6. The one merge item
  `RUNDOWN_DESIGN` Part I §9 warned git would not surface, and it was right.

- [ ] **Aug 6 (Thu) — WDCB launch thread.** Draft delivered (wdcb-thread-draft.md, 2026-08-05);
  morning-of: verify figures against live page, X-card scrape, essay reciprocal link first, chart
  export, post AM window, pin. Day-3 IRR beat + Day-7 harvest per X_STRATEGY_PLAYBOOK §7. This
  jumps the queue ahead of the Discount-or-Premium pilot (JM-agreed); DoP becomes next week's
  anchor with fresh numbers.

- [ ] **OVERDUE (was Jul 26) — Sitemap status recheck.** Formality — JM screenshot already showed
  "Success" (Jul 24). Close if still green. Detail: `SEO_AUDIT.md`.

- [ ] **OVERDUE (was Jul 27) — Satos Awards nomination.** 5-minute procedure; drafted texts in
  `CREATOR_CREDIBILITY_KIT.md` §7. Confirm the window is still open — if it has closed,
  record that and close the item.

- [ ] **OVERDUE (was Jul 27) — Pilot publish (X thread + video script).** Superseded in part: WDCB
  is now the first anchor thread (Aug 6); Discount-or-Premium becomes the week-2 anchor with
  refreshed numbers. The video script half still needs its own date.

- [x] **CLOSED-BY-RULING (2026-08-28) — Open-source decision call (JM), and the OpenSats/grant lane
  with it.** JM ruled: pursue conventional commercial pathways (licensing / platform, fractional),
  **not** open-sourcing plus small grants. **The code stays proprietary**, which resolves the pending
  open-source scope question, and the **OpenSats application drafted 2026-08-11 (Aug 24–28 window) is
  shelved unsubmitted**. The two reference letters are no longer on the critical path for this
  decision — Tom (Satsback) and Joe Bryan are owed courtesy release notes (JM's action, tracked
  project-side, not here). The `OWN_JOB_STRATEGY` §1 grants-vs-employment interaction is **moot**:
  with the grant lane retired there is nothing for employment to substitute against. Full record:
  `FUNDING_STRATEGY.md` (ruling at the head of the doc; Path 1 retired, lanes reordered).
  `OPENSOURCE_DECISION_BRIEF.md` and `GRANTS_RESEARCH_KIT.md` become reference material rather than
  live lanes. **Unchanged by this ruling:** the reader-facing promise — permanently free, ad-free,
  no funnel, verifiable in the browser. Free-to-use and open-source were always different
  commitments and the site only ever made the first.

- [x] **DONE (2026-08-10) — Dashboard build (v1, anchor destination). LIVE IN PRODUCTION.** Built as
  **`/dashboard`** on `feat/dashboard-v1` (build `fd00ee2`, OG `897fa46`), **merged via PR #43 as
  `8d184bc`** and auto-deployed. **Post-deploy verified on production:** four §10 curls all pass,
  canonical clean, OG serves `image/jpeg` (200), tiles compute live in-browser (0.43× / near the
  floor, "Today (live)"). Five live-compute-only tiles + a six-link jump-back-in row; `?pos=` carried
  into the two existing receivers only; no nav slot (`category: hub`, surfaced via `/calculators` tile
  + homepage Latest card); ribbon suppressed on-page. The v1 fence held: zero new data sources, zero
  new monthly-refresh lines. Full record: `SITE_GUIDE §47`; backlog entry shipped. **One follow-up
  remains: the chip (below); OG handback closed below.**

- [x] **CLOSED-AS-RESCOPED (2026-08-10) — Dashboard follow-up #1 — the channel-position chip.**
  Resolved in **dashboard v2** (`feat/dashboard-v2`, PR pending) **without building a separate chip
  element**: the site-wide **channel ribbon** (§40) was repointed from `/the-power-law` to `/dashboard`
  with a "see where we are →" CTA — the ribbon already reads channel position on every page, so it IS
  the site-wide entry the chip would have been. The deferred **companion reciprocal back-links** shipped
  in the same PR (`/dashboard` added to Wait-or-Deploy + How Much Cash `related:`). Full record:
  `SITE_GUIDE §47` v2 block.
  - **AMENDED 2026-08-18 — the rescope left a real gap, now closed.** "The ribbon IS the site-wide
    entry" held on desktop but **not on mobile**: the ribbon `display:none`s its links ≤480px (the
    documented narrow-viewport degradation), and the dashboard had no nav entry on either breakpoint,
    so on a phone there was no path to the page from the menu at all, and none from most pages. The
    dashboard now carries a **hardcoded flat nav anchor in the mobile overlay** ("The Dashboard",
    beside The Gallery) — hub-category pages reach the nav only by being hardcoded, which is the
    detail the original rescope missed. **Desktop stays ribbon-only for now:** a matching desktop
    anchor was built and measured, then reverted before merge because the desktop row has no capacity
    for a 7th item (it wraps the wordmark and grows the nav below ~1150px, and clips "About" below
    ~919px). That is acceptable on desktop precisely because the ribbon keeps its links there. Filed
    as *Desktop nav capacity + The Dashboard entry* in PAGE_IDEAS_BACKLOG. See `SITE_GUIDE §47`.
    **Lesson for future rescopes: a surface that degrades responsively cannot be the sole entry point
    for anything** — check what it looks like at the breakpoint where it sheds elements before
    accepting it as a replacement for a dedicated one.

- [x] **DONE (2026-08-10) — Dashboard OG card handback (`og-dashboard.jpg`).** JM handed back the
  1280×720 JPEG (93 KB); committed (`897fa46`) and registered in `.eleventy.js` `staticAssets`.
  **Production-verified after merge:** `curl -I https://lastcoinstanding.com/og-dashboard.jpg` →
  `200 · Content-Type: image/jpeg` (95080 bytes) — no phantom-200.

- [ ] **~Aug 11 (early next week) — Substack essay: The Bitcoin Hurdle Rate.** Page is live and
  final (`/the-bitcoin-hurdle-rate`, prod 2026-08-07). JM writes the prose himself — personal
  register is his (Bitcoin Exit precedent). Follow the page's CORRECTED framing: the bar is high,
  and most bars are set far too low; the *declining* hurdle is a precision refinement, not the
  finding. Likely sharpest concrete moment: the idle-treasury passage. Hold the
  surplus-capital-at-the-margin limit — it keeps the essay publishable rather than promotional. At
  publish: reciprocal link both ways (essay ↔ page), the Exit precedent nearly missed it.

- [ ] **~Aug 13 — Monthly refresh due.** PL_DATA append + as-of strings + CLARITY check + MSTR/STRC
  snapshots + Bull & Bear triggers. /discount-or-premium needs nothing beyond the shared PL_DATA
  append (all figures live-computed, incl. the duration record).

- [ ] **Late Aug — SEO performance re-tune** (first Search Console read; + deferred
  /the-bitcoin-horizon retitle). Detail: `SEO_AUDIT.md`.

## Own-job / industry outreach — status: NEW workstream (2026-08-05)

Strategy doc created: **`OWN_JOB_STRATEGY.md`** — door-agnostic positioning (full-time /
fractional / licensing), both-tier target map (Fidelity DA, Bitwise, Onramp, Swan, Unchained,
River, NYDIG, DACFP, bitcoin-native RIAs), the two structural rules (sell the capability never the
site; the register is the differentiator), compliance notes, outreach gate (~mid-Sept: capability
one-pager + real metrics + 4–6 threads running).

- [ ] **JM ruling:** parallel track vs FUNDING_STRATEGY reorder + confirm the site-independence
  red line (doc §8.1).
- [ ] **Claude:** capability one-pager draft (after WDCB thread ships).
- [ ] **JM:** NotebookLM corpus start (doc §7 list).
- [ ] **Claude:** top-3 deep-dive briefs (Fidelity DA, Bitwise, Onramp) — on JM's go.

## Get Updates (Substack-first) — status: SHIPPED + fully bookkept (2026-08-05)

Merged `--no-ff` as **`b5d4b4f`**; follow-ups on main: `408350d` (K1 SHA fill), `9a401fb` (§10 date
line), + a date-reset commit. Production verified on all three page types. Feature branch deleted.
K1/K2/K3 in-repo ✓, K4 project-side ✓ (REACH_GROWTH_PLAN #5 LIVE with path + SHA), K5 export ✓,
**mirror ✓ (2026-08-05):** PAGE_IDEAS_BACKLOG (`c75443da…`), SITE_GUIDE (`c8057569…`),
MONTHLY_REFRESH_CHECKLIST (`346e7bec…`) replaced at their exact project paths (content-verified:
§44 present, `b5d4b4f` annotations, CRLF intact).

**Date convention — resolved to real-clock (option b).** Mirrored checklist reads 2026-08-05; no
2026-08-07 strings remain. Standing rule: **refresh lines and as-of strings use the real clock
date, never forward-dated.** Residual: confirm the date-reset commit is pushed to main.

Remaining tail:
- [x] **§10 SEO/ship verification — DONE (2026-08-10).** Ran the four `NEW_PAGE_CHECKLIST` §10 curl
  checks against a live affected page (`/the-bitcoin-hurdle-rate`): `gtag|googletagmanager`=2,
  `rel="canonical"`=1, `og:image`=5, `application/ld+json`=2 — all ≥1, plus the Get Updates surface
  itself present (`substack.com/subscribe` link=1). The §10 export/verification tail is closed;
  nothing outstanding on the ship side.
- [ ] **First signal check (~mid-Aug):** Substack subscriber dashboard + `utm_source=site` (+ now
  `utm_source=x` from the thread) — the honest baseline for the metrics one-pager, which the
  own-job workstream also needs.

## Discount, or Premium? — status: COMPLETE + Phase 4 shipped

Page fully launched 2026-07-25 (all phases, polish rounds, SEO 10/10, OG, carousel video, phone pass)
**plus same-day Phase 4:** the time-to-trend duration record — labelled fastest/median/longest slider
markers (off-scale/above-range handling, collision stacking, mobile fallback), the episode strip with
open-ended ongoing bar, two-sided premium flip, dead-band hidden. Commits `7799667` + `21eba9b`.
Independently verified on production (12 checks + duration recompute reconciles exactly). Spec: repo
design doc §9 Phase 4.

Remaining tail:
- [ ] **X card scrape** for the page (+ the four retitled pages) — now due before its week-2 thread.
- [ ] **Branch prune — NEEDS RE-SCOPING.** Tracker said "13 merged dp branches," but Claude Code's
  clone (2026-08-05) shows **no `dp/*` branches at all** — only `feat/daily-conviction` and
  `feat/daily-conviction-v11` remain. Re-verify with `git branch -a` before acting.
- [ ] **JM eyeball of the labelled slider markers on production** (fastest/median/longest row).
- [ ] **Optional cue-line harmonization (JM call, open):** cue cites the single 2022 precedent
  (16 months) vs the slider's full record (median ~14, longest ~21).

## Next-steps queue (proposed 2026-07-25; amended 2026-08-05)

1. **X strategy playbook — now RUNNING** (WDCB thread Aug 6 = anchor #1; DoP = anchor #2).
2. ~~**Reference-letter outreach (JM)** — critical path for the open-source decision.~~ **CLOSED
   2026-08-28** with the grant lane (above): no longer critical path. Courtesy release notes to the
   two referees are JM's, tracked project-side.
3. **Geyser page + V4V confirmation (top-10 #4).** Still available as a zero-strings channel, but
   **no longer part of a funding lane the strategy depends on** — the 2026-08-28 ruling made the
   commercial lanes primary. Do it if wanted, not because the plan needs it.
4. **YouTube pilot video (top-10 #10)** — film from the refreshed script.
5. **Next build: Retirement scenario comparison (top-10 #8)** — design doc first (after dashboard).
6. **STRC below-par examination (top-10 #9)** — ✅ **SHIPPED** as `/the-strc-mechanism`, live in production (carousel slide 36). Was stale in this queue — the page deployed before the 2026-08-05 amend.

## In flight (undated / JM quick tasks)

- [x] **DONE (2026-08-08) — Hurdle Rate v2 below-trend-language sweep, the pre-production gate.**
  Whole-page grep for the listed advocacy words, judged in context, before merge:
  - **"optimistic" / "the upside" / "while it lasts"** — absent (the v1 "optimistic edge" card was
    reworked into the neutral position-adjustment card at build time).
  - **"opportunity"** — every instance is "opportunity cost" (the page's thesis, explicitly exempted)
    or neutral ("reinvestment opportunities", "act on opportunities during a drawdown"). Not advocacy.
  - **"discount"** — sole instance names *both* "a discount or a premium" in the `/discount-or-premium`
    cross-link. Neutral.
  - **"edge"** — all geometric (band-edge references in code comments); the one user-facing instance,
    the near-touch caption's "floor-path edge", was tidied to "floor case" to match the legend rename
    (removes the literal word too). Not advocacy in any instance.
  Verified at the simulated above-trend position (`?k=1.5`) across every new/changed string over the
  build (the sweep caught and fixed one non-neutral near-touch draft, `99a00d9`). Neutral copy fenced
  from build (`efb958e`); decline-as-headline demoted in meta/JSON-LD/FAQ5/"what would break this?"
  (`ca43d85`); floor-path-edge tidy shipped with the merge. **Read as written and found genuinely
  swept — no advocacy language remains.**

- [ ] **The Bitcoin Exit essay → reciprocal link to /what-daily-conviction-bought** — do BEFORE
  Thursday's thread (closes the thread → tool → essay loop).
- [ ] **Eyeball the three new FAQ sections** (allocation, wait-or-deploy, BvRE; desktop + 375px).
- [ ] **X card re-scrape — four retitled pages:** /bull-and-bear-cycles, /borrowing-against-your-stack,
  /disciplined-rebalancing, /lump-sum-or-ladder-in.
- [ ] **X card re-scrape — /the-strc-mechanism** (renamed from /strc-below-par, 2026-08-10; do AFTER merge,
  and after the new OG card lands — see the handback below).
- [ ] **OG card handback — `og-the-strc-mechanism.jpg`** (STRC overhaul, `feat/strc-mechanism`). The head
  still points `og:image` at the old `og-strc-below-par.jpg` (kept served — no phantom-200) until the
  drafting chat generates the new product-forward card for "The STRC Mechanism"; then Claude Code registers
  it in `.eleventy.js` `staticAssets` and repoints the meta. Post-landing: `curl -I …/og-the-strc-mechanism.jpg`
  → `image/jpeg`.
- [ ] **STRC daily-close Action — first live confirmation (post-merge).** `workflow_dispatch` isn't available
  until the workflow is on `main` (GitHub limitation), so it couldn't run pre-merge. After merge, run one
  `gh workflow run strc-daily-close.yml` and confirm the green run + the `data(strc):` commit; then the
  weekday schedule maintains it. Monthly silent-death check is in `MONTHLY_REFRESH §7.6`.
- [ ] **LinkedIn update (Satmo / Joe Bryan)** — JM personal, timing his call.

## Working notes (pipeline learnings)

- **EOL is per-file, not per-repo** — check the HEAD blob. (Recurred on get-updates; standard now:
  never convert encodings through PowerShell string round-trips.)
- **Mirror refreshes: hash-gate the handoff.** The 2026-08-05 mirror caught a stale-Downloads
  handoff purely via the SHA-256 check. Always export fresh from the working tree and verify.
- **Real-clock dating, never forward-dating** — resolved 2026-08-05.
- **Assets land before merge** — bridge-commit binaries pre-merge; missing referenced asset = stop.
- **Chart.js legend + usePointStyle hides borderDash** — custom generateLabels must also carry
  fontColor. Site-wide audit now tracked in TECH_DEBT §1 (moved 2026-08-08).
- **curl verifies the bundle, not the pixels** — "pixel-probe what you visually changed."
- **CF Pages branch alias lags** — use the per-commit deployment URL for eyeball passes.
- **Grok Imagine:** open sky/horizon/scale prevent "dank" drift; JM's register is "mysterious,
  almost sci-fi," not creepy.
- **Branch discipline:** "create branch FIRST" stays explicit in prompts.

## Recently closed
- [x] **Get Updates — SHIPPED + full bookkeeping closed** (`b5d4b4f` + follow-ups, 2026-08-05).
- [x] **Discount, or Premium? — Phase 4 + labelled duration markers** (`7799667`, `21eba9b`,
  2026-07-25).
- [x] **Discount, or Premium? — FULL LAUNCH** (2026-07-25).
- [x] **Chart-copy export bug** (`b0919f5`); **SEO passes 1–2**; **robots.txt + AI-crawler policy**
  (`eccea6a`); **Bull & Bear carousel video** (2026-07-23/24).

---

## Counsel decision record — The Rundown — 2026-09-07 (filed verbatim)

_Filed into this tracker 2026-09-07 at the listing pass, on JM's instruction, as **the**
counsel-decision record. Source file: `claude_COUNSEL_RECORD_THE_RUNDOWN_2026-09-07.md`
(Downloads), SHA1 `c4f1936150e170f17808dc0b6139a781951863f6` — verified against the file at
filing time. **Reproduced verbatim and not to be edited in place**: corrections or
supersessions go in a dated note beneath, never into the text. Its five public-page edits
are tracked against the listing pass in the in-flight item above._

# Counsel decision — The Rundown — 2026-09-07

**Method.** Option (c): an internal pass against the project's own compliance reference
(`claude_COMPLIANCE_REFERENCE_INTERACTIVE_TOOLS`) and claims report
(`marketing-compliance-claims-report`), plus a 219-source public-rule corpus assembled in
NotebookLM from six discovery queries, with the live page copy (`RUNDOWN_LIVE_COPY_2026-09-07`,
all modules, all intents, all engine template branches) and `RUNDOWN_DESIGN_v2` §5/§8
uploaded as sources. Nine scoped questions, then a citation audit of every authority relied
on (13 of 13 present, with passages). Reviewed by JM with the drafting chat. Not legal
advice: a decision-support pass so that the waiver below is made on findings, not by default.

## Findings, by question

- **Q1 Status.** Spot bitcoin is a non-security commodity (*In re Coinflip* 2015; *CFTC v.
  McDonnell* and *CFTC v. My Big Coin Pay* 2018; SEC Chair statement 2024-01-10). The
  Advisers Act and state adviser statutes reach *securities* only; the CTA definition (CEA
  §1a(12)) reaches *commodity interests* only; *Taucher v. Born* protects impersonal
  publishers under the First Amendment. No licence or registration attaches. Anti-fraud
  authority over spot markets (CEA §6(c)(1); Reg. 180.1) still applies: **accuracy and
  balance are the publisher's exposure.**
- **Q2 Publisher exclusion.** *Lowe* factors satisfied: impersonal (inputs stay in the
  browser; intent is a display filter; no recommendation), bona fide (no conflict), general
  circulation. *Lingley v. Seeking Alpha* (S.D.N.Y. 2024): user-directed filters do not make
  generally available content personal. Strained factor: the stack-conditional lines (P1, R1,
  D3), mitigated because the underlying figure is identical for everyone and the
  personalization is arithmetic on a number the reader typed. Public page keeps them;
  licensee tier makes them removable.
- **Q3 CTA.** No: spot only. Statutory publisher exclusion (CEA §1a(12)(B)(iv)) plus
  *Taucher*. Standing fences recorded: no leveraged or margined purchases, no perpetuals, no
  swaps. (The Collateral and Mortgage pages describe loans against holdings — not commodity
  interests.)
- **Q4 Anti-fraud strings.** One impression-level fix (the drawdown line assumed the floor
  holds without saying so); one self-labelling fix ("honest read"). Verdict lines kept:
  historical, accurate, with the register line adjacent. The "hit rate" string is a code
  comment and never renders.
- **Q5 Licensee lens.** The 2210(d)(1)(F)(i) "mathematical illustration" exception does *not*
  apply (the page models a specific asset). The Investment Analysis Tool pathway (FINRA 2214;
  SEC 206(4)-1(e)(8)) does, conditionally, for D3 and P1. The §5 conditional-projection
  pattern maps onto both safe harbors. Spec below.
- **Q6 DOL IB 96-1.** ERISA does not reach the publisher (no plan, no fee from plan assets).
  For a licensee the retirement module is single-asset education, not an allocation model:
  conditions (ii) and (iv) met, (i) strained by design, (iii) partial, (v) met by the new
  "models bitcoin alone" line. Licensee wrapper below.
- **Q7 State / BitLicense.** State adviser statutes are securities-only; state commodity
  codes exempt spot with delivery; every BitLicense trigger (23 NYCRR 200.2(q)) is custody,
  transmission, exchange, or issuance — none applies to a page that computes in the reader's
  browser. (California DFAL software exemption discussed; citation not audited — verify
  before external use.)
- **Q8 Customary disclosure.** Gaps are licensee-tier (fee drag, SIPC/custody, universe
  considered, actuarial block). The publisher's share is one clause ("before fees, spreads
  and taxes"); the inflation basis is already specified on the page ("today's dollars").
- **Q9 Synthesis.** **Low risk, with minor string updates.** Drivers: commodity status
  removes registration; filter-only client-side design preserves the exclusion; the live
  exposure is accuracy, which the register already governs.

## Public-page edits — five, all boundary statements, no voice changes

1. **Site disclaimer body** (`components/tool-framing.njk`, the collapsible "For
   exploration only" strip on every tool page — extended, not replaced): "This tool is for
   educational and informational purposes; nothing here is financial advice. Bitcoin involves
   significant risk, including potential total loss. Figures are before fees, spreads and
   taxes. Consult a qualified financial adviser before making decisions based on what you see
   here. Last Coin Standing is not a registered investment adviser, broker-dealer, or
   commodity trading advisor. Everything here computes in your browser: it does not custody,
   transfer, or execute transactions in bitcoin or any other asset, and it does not analyze
   or facilitate transactions in commodity interests — futures, options, swaps, or margined
   or leveraged positions."
2. *(folded into 1 — the "before fees, spreads and taxes" clause lives in the same body.)*
3. **P2 register line:** "Shallow falls from here are close to arithmetic, so long as the
   floor holds: an entry near the floor has less room beneath it than one near the trend line.
   What would break this →"
4. **Coda, DCA item:** "The ladder module above is the closest available comparison, not a
   substitute for one."
5. **P1**, one sentence: "This models bitcoin alone; your other assets and income sit outside
   it."

**Not adopted on the public page** (accurate voice, register-lined; licensee tier only):
softened verdicts ("Waiting was almost always the wrong call here" stays); intent-selector
legalese; "Plan retirement" relabel; SIPC/custody block; fee-drag paragraph; universe block.
Rule applied throughout: *fix a misleading impression; keep an accurate voice.*

## Licensee tier — versioning spec (never on the public page)

- **Pathway:** Investment Analysis Tool — FINRA 2214 / SEC 206(4)-1(e)(8). Not the
  mathematical-illustration exception.
- **Verbatim disclosure** (2214(c)(4); 206(4)-1(e)(8)(A)(4)) in a prominent box at the
  briefing header: "IMPORTANT: The projections or other information generated by this
  interactive analysis tool regarding the likelihood of various investment outcomes are
  hypothetical in nature, do not reflect actual investment results and are not guarantees of
  future results."
- **Methodology & universe block** (206(4)-1(e)(8)(A)(1)–(3); 2214(c)(1)–(3)): criteria and
  methodology; results vary with each use and over time; bitcoin only, and other assets not
  considered may have similar or superior characteristics.
- **Fee note:** figures gross of fees; a firm's advisory/platform/custody fees compound and
  reduce illustrated returns / raise the required stack — or run net of a configured fee.
- **SIPC / custody line:** bitcoin is not a security and not SIPC-protected; custody risks
  named; custodian identified.
- **Retirement wrapper** (IB 96-1 customary): broader-picture statement; actuarial assumptions
  stated (real dollars, 30-year horizon, growth-rate bounds); fiduciary carve-out; tax and
  early-withdrawal note. Present as single-asset education, not an allocation model.
- **Optional relabels:** softened verdict variants; intent-selector wording; stack-conditional
  lines removable.
- **Firm-side workflow:** registered-principal pre-use approval; Exchange Act 17a-4 /
  Advisers Act 204-2 recordkeeping; 2214 filing with FINRA Advertising Regulation within 10
  days of first use; audience-relevance policies for any hypothetical performance outside
  the tool carve-out. Pending FINRA projection proposals (SR-FINRA-2023-016 stayed;
  SR-FINRA-2026-004 proposed) are not relied on.

## Decision

**Formal counsel waived for public listing.** Reasons: no registration attaches at any
level (federal securities, federal commodities, state, BitLicense); the publisher exclusion is
satisfied by the page's design rather than by disclaimer; the one live exposure — anti-fraud
accuracy — is governed by the site's register and closed by five boundary edits; every
authority relied on was citation-audited. **Formal review engaged at the first licensing
engagement**, where it is needed regardless (an exemptive-status opinion; B2B licensing
agreements allocating liability and indemnity), and funded within that deal.

Not carried into this record (asserted in the pass, not verified in the audit): the FINRA
crypto retail-communications sweep figure; the DOL five-part-test effective date; DFAL/SB 97
specifics.

## Sources verified (citation audit, 2026-09-07 — all present in corpus with passages)

*Lowe v. SEC*, 472 U.S. 181 (1985) · *Lingley v. Seeking Alpha* (S.D.N.Y. 2024; as
summarized by Katten and Greenberg Traurig) · *Taucher v. Born* (D.D.C. 1999) · *In re
Coinflip* (CFTC 2015) · *CFTC v. McDonnell* (E.D.N.Y. 2018) · *CFTC v. My Big Coin Pay*
(D. Mass. 2018) · SEC Chair statement on spot bitcoin ETPs (2024-01-10) · SEC Marketing Rule
sweep, nine advisers (2023-09-11) · 17 CFR 275.206(4)-1(e)(8) · FINRA Rules 2210(d)(1)(F) and
2214 · SR-FINRA-2023-016 / SR-FINRA-2026-004 · DOL Interpretive Bulletin 96-1 · 23 NYCRR
200.2(q).
