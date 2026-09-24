# Direction-aware matching: measurement, 2026-09-23

The measure-first mini-report that `PAGE_IDEAS_BACKLOG` → *Direction-aware matching* asked for before anything is built. **Measurement only. No figure on the site changed.** Reproduce it with `node scripts/measure-direction-legs.js` (add `--json` for every row and window). The engine was loaded unmodified and called exactly as Wait-or-Deploy calls it.

**The question.** `shared/channel-entries.js` matches historical entries on channel position alone. Price crosses a stretch of the channel twice, once falling into it and once rising out of it, so one matched set pools the two. How much does the pooled figure hide? Would splitting it leave numbers too thin to publish?

**Method, in one paragraph.** An entry's *leg* is the sign of its channel-position change over the previous 60 days: *falling* if lower than 60 days earlier, *rising* otherwise. It uses only data before the entry, so a reader could know it at the time: there is no look-ahead. Windows of 36 and 96 days were run as a sensitivity check. The data is the same record the site publishes from: 326 eligible entries, Jan 2014 to Sep 2024, sampled every 12 days, each with a full two-year window. Consecutive 12-day samples are not independent evidence. So each set is also counted in **episodes** (runs of consecutive samples) and in **cycles** (halving epochs contributing, at most four). Cycles are the honest measure of how much independent history stands behind a number.

---

## Finding 1: at today's position, pooling hides almost nothing

At the last sample (Sep 2026, position 0.088, **0.50× trend**), the figures Wait-or-Deploy, How Much Cash and the Rundown headline barely move when split:

| At 0.50× trend | n | cycles | waiting paid | median ratio | a lower entry never came |
|---|---|---|---|---|---|
| Pooled (published) | 67 | 3 | 7% | 0.17 | 90% |
| Falling leg | 43 | 3 | 7% | 0.10 | 88% |
| Rising leg | 24 | 3 | 8% | 0.20 | 92% |

Near the floor the story is the same on both legs: waiting almost never paid. The pooled number is a fair summary of both. **No published figure needs to change today.**

## Finding 2: around and above trend, pooling hides a real split

From about 0.6× to 2.2× trend, "waiting paid" is much higher on a falling leg than on a rising one. At every position from 0.20 to 0.85 the falling leg's rate is higher under all three windows, with one exception: at 0.45 on the 36-day window it is 61% vs 65%. At 60 days:

| Position | × trend | Pooled paid | Falling leg | Rising leg |
|---|---|---|---|---|
| 0.30 | 0.76× | 31% (n 62) | 43% (n 35, 4 cycles) | 15% (n 27, 2 cycles) |
| 0.40 | 0.92× | 54% (n 37) | 72% (n 18, 4 cycles) | 37% (n 19, 3 cycles) |
| 0.50 | 1.12× | 71% (n 34) | 93% (n 15, 4 cycles) | 53% (n 19, 2 cycles) |
| 0.60 | 1.37× | 86% (n 36) | 96% (n 23, 3 cycles) | 69% (n 13, 2 cycles) |
| 0.70 | 1.66× | 80% (n 30) | 100% (n 19, 3 cycles) | 45% (n 11, 2 cycles) |

**At 0.92× trend the pooled 54% sits on either side of 50%.** On a falling leg, waiting beat deploying about three times in four. On a rising leg, deploying beat waiting nearly two times in three. A pooled "about a coin flip" is the average of two situations that each had a clear lean, in opposite directions. That matters to anyone deciding whether to deploy cash near trend.

**Plain reading:** within two years, the channel has shown momentum. A fall that is under way has tended to continue far enough for a patient buyer to do better. A rise that is under way has tended to leave a waiting buyer behind. This fits the site's "a record, not a distribution" register. It is what happened, not a law.

At the very top of the channel (≥ 2.46× trend) the pattern reverses: rising-leg entries paid 100% of the time. These are blow-off tops, where the next lower entry was almost certain whichever way price arrived.

## Finding 3: the split is thin by independence, not by sample count

- **Sample counts are not the problem.** The smallest split set anywhere is n = 10 (rising leg at 0.65), above the engine's 8-sample neighbourhood floor, and every set has at least 5 episodes.
- **The number of cycles is the problem.** From 0.30 to 0.80 the rising leg draws on **only 2 halving cycles** at the 60-day window, sometimes 3. A 45% vs 100% difference resting on two cycles is a pattern worth disclosing, not a rate worth headlining.
- The backlog's worry was that splitting "roughly halves each matched set" and pushes figures toward the N<3 fence. That half-happens: the samples halve, but no set approaches the fence. The real constraint is the one the site already names elsewhere: few independent eras.

## Recommendation

1. **Build the `leg` field, additively.** Add `leg` (and the 60-day position change) to each `entryMetrics()` result, and split counts to `bandMetrics()`. Consumers that don't read them are byte-for-byte unchanged, the same discipline as the `neverFell` addition. Verify with the WODN / HMC figure hashes before and after.
2. **Don't replace any pooled figure.** Keep the published number pooled and add a single disclosure sentence, shown only when the two legs differ materially. Candidate gate: legs more than 20 percentage points apart **and** each leg with at least 10 samples (a stricter version also requires at least 3 cycles; see point 4). Example wording at 0.92×: *"This pools two situations. Entries made while price was already falling here saw waiting pay 72% of the time; entries made into a rise, 37% — the second from only three cycles."*
3. **Name the reader's own leg only where the page already knows it.** The Dashboard and the Rundown know today's 60-day direction, so they could say "price has been falling into this position" beside the pooled figure. Wait-or-Deploy's slider position has no direction, so it would show both legs rather than pick one.
4. **Today this changes nothing a reader sees**, because at 0.50× the legs agree (Finding 1). But the strict gate in (2) switches on only in a narrow band: from about **0.69× to 1.02× trend** (0.69×, 0.84×, 0.92×, 1.02×). Above that, the rising leg rests on two cycles almost everywhere, and even inside the band 0.76× fails. Dropping the cycle test, so the gate only asks for more than 20 points apart and at least 10 samples each, switches it on continuously from 0.69× to 2.02×. A page would show the sentence and flicker it off one tick later. **The better design is the loose gate with the cycle count printed in the sentence** ("…from only two cycles"). Then the thinness is disclosed rather than used as a switch. Either way this is build-when-convenient, not urgent.

**Needs JM's ruling:** whether to build (1)+(2) at all, and the gate thresholds. Both are editorial calls about how much a two-cycle pattern should be allowed to say.
