# Analysis notes

Dated, self-contained analysis notes. Created 2026-08-20 — there was no home for this kind
of work, so findings either went into a page (which forces a design decision before the
analysis is settled) or into chat history (which loses them).

**What belongs here:** an investigation and its numbers, with the method stated well enough
to reproduce, and the limits stated well enough to stop the numbers being over-quoted.
Notes are analysis *inputs* to page and backlog decisions, not page copy.

**Conventions**

- **Filename:** `YYYY-MM-DD-<topic>.md`, dated the day the analysis was run.
- **Name the source module and the exact constants** the run read, so a reader can tell
  whether a later data refresh has invalidated the note.
- **Limits go at the top, not the bottom.** Sample sizes, in-sample circularity,
  autocorrelation, terminal-date sensitivity — anything that would make a number travel
  further than it should belongs before the number, not after it.
- **Notes are not maintained.** A note is a snapshot of what the data said on its date.
  Do not silently update one; write a new one and link back. If a page ever depends on a
  figure from a note, that figure belongs in `DATA_AUDIT.md` with a refresh cadence — not
  cited from here.
- Working scripts are session-local and generally not committed; the note carries the
  method.

## Index

- [`2026-08-20-power-law-floor.md`](2026-08-20-power-law-floor.md) — how well the 0.42×
  floor has held (10 of 481 samples below, in 4 episodes; deepest 42.6% under in 2010),
  whether its exponent matches the trend's (identical by construction; empirical lower
  envelope nearer 5.88), and what entering near it bought (median −0.3% excess over trend
  CAGR — a result dominated by today's position being back at the floor).
