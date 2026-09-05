# REVERSION BASIS — SAMPLES vs EPISODES — MINI-REPORT

_2026-09-04. Filed under JM's ruling that a change to published anchor figures
comes back as a mini-report, before/after side by side, before anything is
built. **Nothing in this report is implemented.** The Dashboard and
Discount-or-Premium are untouched by it; the branch it describes does not exist
yet._

_Figures computed live from the shipped `shared/reversion-durations.js` at a
pinned price of **$79,827** against a trend of **$153,756** — **0.52× trend**,
48% below. Rates read through `shared/return-window.js`, so §10.3.1 applies
throughout: nothing under twelve months is annualised._

---

## 1 · What the two bases are

The same scan produces both. It finds every price sample at or below today's
depth, then groups them into episodes with the site's 100-day independent-visit
rule. The question is which population a statistic is taken over.

- **Samples** — every ~12-day observation that qualifies. Answers *"from any
  point inside a stretch like this one, how long did it take?"*
- **Episodes** — those samples grouped into distinct stretches. Answers *"from
  the start of a stretch like this one, how long did it take?"*

Neither is wrong. They answer different questions, and the difference is not
small: **65 samples fall into 6 completed episodes** at today's depth. A long
stretch contributes dozens of samples and one episode, so the sample basis is
weighted toward long stretches by construction.

---

## 2 · Dashboard — before and after, side by side

| Figure | **Before** (samples, published today) | **After** (episodes, proposed) |
|---|---|---|
| Headline: median | **~145% in total** over **~9.1 months** | **~141% in total** over **~8.5 months** |
| Quickest | **~2.0 months** | **~4.3 months** |
| Slowest | **~24 months**, ~90%/yr | **~24 months**, ~90%/yr *(unchanged)* |
| Count | **65 completed samples** | **6 completed episodes** |

**The headline barely moves; the quickest more than doubles; the count falls by
an order of magnitude.** That last one is the substantive change, and it is a
change in the direction of the truth: "65 completed" invites the reader to
think the record is far deeper than it is. Six is the number of independent
things that have actually happened.

The full episode set, for the record: **4.3 · 5.5 · 6.7 · 10.2 · 15.8 · 23.7
months**, plus one still open.

**One consequence to accept deliberately.** On the episode basis the N<3 rule
comes into range. Six is comfortably clear of it today, but at a shallower
depth the episode count falls fast, and the tile would then have to name the
stretches rather than publish a median — the same rule the Rundown's module
already follows. On the sample basis that never happens, because the count is
always large. **That is a reason to move, not a reason to stay:** a statistic
that can never trip the thinness rule is not thereby robust; it has just
stopped measuring independence.

---

## 3 · Discount-or-Premium — publishing both, labelled

Its duration module is the canonical home of this record, so it is the right
page to carry both bases rather than choose. Proposed labels, as ruled:

> **From the start of a stretch** · 6 episodes · fastest 4.3 mo · median 8.5 mo
> · slowest 23.7 mo
> **From any point inside one** · 65 samples · fastest 2.0 mo · median 9.1 mo ·
> slowest 23.7 mo

**Proposed layout.** The module already renders a duration strip with
fastest/median/slowest markers. Rather than duplicating that strip, add a
**two-row readout beneath it**, one row per basis, each row carrying its own
count and its three figures on the existing three-column rhythm:

```
How long stretches like this took to get back
┌──────────────────────────────────────────────────────────────┐
│ From the start of a stretch      6 episodes                  │
│   fastest 4.3 mo   median 8.5 mo   slowest 23.7 mo           │
├──────────────────────────────────────────────────────────────┤
│ From any point inside one        65 samples                  │
│   fastest 2.0 mo   median 9.1 mo   slowest 23.7 mo           │
└──────────────────────────────────────────────────────────────┘
Both read the same record; they differ in what counts as one observation.
```

**Which row leads.** The episode row goes first. It is the one that answers the
question a reader arrives with — *if this stretch started now, how long?* — and
it is the one whose count is honest about how much evidence there is. The
sample row is the finer-grained view and reads as the supporting detail, which
is what it is.

**The markers on the existing strip stay on the episode basis**, matching the
Rundown's ticks, so the two pages' visual furniture agrees as well as their
numbers.

---

## 4 · After the change: do the two pages agree?

**Yes, to the digit, on every shared figure — provided the Dashboard moves and
D-or-P's episode row is the one the Rundown echoes.**

| Figure | Dashboard (after) | Rundown (today) | D-or-P episode row |
|---|---|---|---|
| Completed episodes | 6 | 6 | 6 |
| Fastest | 4.3 mo | 4.3 mo | 4.3 mo |
| Median | 8.5 mo | 8.5 mo | 8.5 mo |
| Slowest | 23.7 mo | 23.7 mo | 23.7 mo |

They agree because they would be reading the same statistic over the same
population from the same module — not because three implementations were tuned
to match.

**One caveat, and it is about the clock rather than the code.** `TODAY_DAYS`
advances daily, so the trend price and therefore the depth-matched set move.
Two pages loaded on the same day agree; the same page compared against a
screenshot from last week will not, and that is correct behaviour rather than
drift. It bit this session once — a median read 146% and then 145% minutes
later, purely because the day ticked over — so any future parity check should
compare within one page load.

---

## 5 · What it would take

- **Dashboard:** `reversionRecord()` returns `comp` (samples). It would group
  by the same 100-day rule the shared module already applies and take its
  statistics over episodes. The tile's copy changes with it — "65 completed
  samples" becomes "6 completed episodes", and the note explaining the two
  bases can then be cut rather than expanded.
- **Discount-or-Premium:** the scan already returns both populations
  (`nCompleted`/`min`/`median`/`max` for samples, `episodes[]` for episodes),
  so this is a rendering addition, not new computation.
- **Rundown:** unchanged. It is already on the episode basis.
- **Sequence:** D-or-P first (it is the canonical home and gains a row), then
  the Dashboard (it changes a headline), then re-verify all three agree in one
  page load.
- **Branch:** one branch for both public pages, since the point is that they
  agree; splitting them would put a half-changed pair on production between
  merges. Under 28 characters — `fix-reversion-basis`.

_Awaiting JM's word. Nothing built._
