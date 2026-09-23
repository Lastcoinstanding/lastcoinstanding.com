/* ─────────────────────────────────────────────────────────────────────────────
   tip-clamp.js — keep §6.13 help-tip bubbles on screen. Layout-level.

   THE DEFECT. §6.13 centres a 240px tip card on its trigger. That is right
   until the trigger sits within half a card of a viewport edge — then the
   bubble hangs off-screen and the reader gets half a sentence. Measured on
   production 2026-09-06: 88 tips across 19 pages at 375px, a third of every
   help-tip on the site, with overhangs up to 299px on a 375px viewport. Zero
   at 1280 — this is a phone defect, and it is the pattern's, not any page's.

   WHY CSS CANNOT DO IT. CSS has no way to know where the trigger is. The
   §6.13 width cap narrows the card and still centres it. The shift has to be
   measured when the tip opens.

   WHY THIS IS LAYOUT-LEVEL and not eighteen copies. Same argument as the nav
   CSS, the ribbon, the related strip, the feedback widget and the FAQ: a
   per-page include is a footgun that eventually misfires on the page nobody
   remembered. It also has to cover FAMILIES BEYOND `.help-tip` — the audit
   found `.dr-tt` on Disciplined Rebalancing, `.fl-tip` on The Bitcoin Floor
   and `.tip` on Metcalfe's Law, all the same pattern under page-local names.
   A page-by-page fix would have missed exactly those.

   ── Three implementation decisions worth keeping ────────────────────────────

   1. IT SHIFTS `left`, NOT `transform`. The variants disagree about transform:
      the centred one carries `translateX(-50%)`, `tip-end` carries none, and
      Metcalfe's animates `translateY` on hover. Overwriting transform would
      break whichever variant it did not anticipate. `getComputedStyle().left`
      returns the USED value in px even when the rule says `auto`, so reading
      it and writing it back plus the shift moves the box by exactly the shift
      and leaves every transform alone. `right` is set to auto alongside, so a
      right-anchored card is not over-constrained and can actually move.

   2. IT FORCES ITS OWN MEASUREMENT. On touch, `touchstart` fires BEFORE the
      reveal, so the bubble can still be hidden when this runs — and a hidden
      element measures zero, which yields a WRONG shift rather than no shift.
      Both reveal idioms are handled: `display:none` (§6.13) and
      `opacity:0 / visibility:hidden` (the Floor's and Metcalfe's).

   3. IT RESETS BEFORE EVERY MEASUREMENT. A tip near an edge that is opened,
      closed and reopened after a resize must not accumulate shifts.

   IT DOES NOT FIX `overflow: hidden` CLIPPING — that is a container problem
   and is fixed per page (see TECH_DEBT). The one container it does respect is
   a horizontally SCROLLING ancestor, whose left/right edges bound the card
   like the viewport's do, because a wrapper that must scroll cannot be fixed
   at the container (2026-09-22).
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* The families. Each is an inline `?`-style trigger with an absolutely
     positioned card as a descendant, revealed on :hover / :focus. Chart
     tooltips are deliberately absent: they follow the cursor, are positioned
     by JS, and have no anchored card to clamp. */
  var TRIGGERS = '.help-tip, .dr-tt, .fl-tip, .tip';
  var PAD = 8;               // keep this much clear of the viewport edge

  /* The card is found by POSITION, not by class name, so a page inventing its
     own naming still works. First absolutely-positioned descendant wins. */
  function cardOf(trigger) {
    var kids = trigger.querySelectorAll('*');
    for (var i = 0; i < kids.length; i++) {
      if (getComputedStyle(kids[i]).position === 'absolute') return kids[i];
    }
    return null;
  }

  function clamp(trigger) {
    var c = cardOf(trigger);
    if (!c) return;

    // Reset first — never accumulate across opens or across a resize.
    c.style.left = '';
    c.style.right = '';

    var cs = getComputedStyle(c);
    var forced = null;
    if (!c.getClientRects().length || cs.visibility === 'hidden' || cs.opacity === '0') {
      forced = { d: c.style.display, o: c.style.opacity, v: c.style.visibility };
      c.style.display = 'block';
      c.style.opacity = '1';
      c.style.visibility = 'visible';
    }

    var r = c.getBoundingClientRect();
    var usedLeft = parseFloat(getComputedStyle(c).left);

    if (forced) {
      c.style.display = forced.d;
      c.style.opacity = forced.o;
      c.style.visibility = forced.v;
    }

    if (!r.width || !isFinite(usedLeft)) return;

    /* The box the card must land in: the viewport, narrowed by any ancestor
       that scrolls horizontally. A scrolling table wrapper cannot have visible
       overflow (the spec forces both axes to scroll once one does), so a card
       that fits the window can still be cut off at the wrapper's edge — the
       /the-power-law exponent table did exactly this at phone widths
       (2026-09-22). Only the horizontal bound is taken, and only from
       scrolling ancestors: a wrapper that must keep scrolling cannot be fixed
       at the container, so the card moves. `overflow: hidden` panels are
       still container problems and are fixed per page. */
    var lo = PAD, hi = window.innerWidth - PAD;
    for (var a = c.parentElement; a && a !== document.body; a = a.parentElement) {
      var ox = getComputedStyle(a).overflowX;
      if (ox === 'auto' || ox === 'scroll') {
        var ar = a.getBoundingClientRect();
        lo = Math.max(lo, ar.left + 1);
        hi = Math.min(hi, ar.right - 1);
      }
    }

    var shift = 0;
    if (r.left < lo) shift = lo - r.left;
    else if (r.right > hi) shift = hi - r.right;
    if (!shift) return;

    /* Never push the far edge off in the process of rescuing the near one:
       on a box narrower than the card, land it flush left and let the §6.13
       width cap do the rest. */
    if (r.width > hi - lo) shift = lo - r.left;

    c.style.right = 'auto';
    c.style.left = Math.round(usedLeft + shift) + 'px';
  }

  ['pointerenter', 'focusin', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      var t = e.target && e.target.closest ? e.target.closest(TRIGGERS) : null;
      if (t) clamp(t);
    }, true);
  });

  /* A tip left open across an orientation change would keep a stale shift. */
  var t = null;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var open = document.querySelectorAll(TRIGGERS);
      for (var i = 0; i < open.length; i++) {
        var c = cardOf(open[i]);
        if (c) { c.style.left = ''; c.style.right = ''; }
      }
    }, 120);
  });
})();
