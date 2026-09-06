/* ─────────────────────────────────────────────────────────────────────────────
   tip-audit.js — find §6.13 help-tips that cannot render

   WHY THIS EXISTS. A `.tip-content` is absolutely positioned and opens UPWARD,
   out of its container. Any ancestor with `overflow: hidden` clips it, usually
   to a sliver, which reads as "a stray line above the card, no bubble" rather
   than as a missing tooltip. Nothing errors and nothing logs. On The Rundown
   this was reported once, fixed once, and a SECOND instance of the identical
   bug was sitting on the same page — found by this check, not by looking.
   That is the whole argument for scripting it: eyeballing found one of two.

   HOW TO RUN. Paste into the console on the page under test, at each width
   that matters (375 / 768 / 1280), and read the returned object. It mutates
   nothing permanently — every style it sets is restored before it returns.

     await tipAudit()                 // current viewport
     await tipAudit({ pad: 6 })       // looser edge tolerance

   WHAT IT CHECKS, and why each one is here:

     clipBy      an ancestor with non-visible overflow whose box does not
                 contain the tip. THE PRIMARY DEFECT.
     offLeft     the tip opens past the left edge of the viewport. §6.13
                 centres a 240px card on its trigger, so any trigger within
                 half a card of an edge overflows. At 375 this was ten of
                 The Rundown's fourteen tips.
     offRight    the same at the right edge.
     collapsed   the tip measured at or near zero size — usually a hidden
                 ancestor, occasionally a broken rule.
     occluded    something paints over the tip's own top-left corner. Catches
                 z-index losses that clipping tests miss.
     notRevealed the CSS did not show the tip on :focus. NOTE: this fires
                 falsely when the browser window is not focused — `:focus`
                 does not match a document that does not have focus, even
                 though activeElement is set. The audit reports `windowFocused`
                 so a run full of notRevealed can be recognised as a harness
                 artefact rather than a page defect.

   THE MEASUREMENT ORDER IS DELIBERATE. The audit dispatches `pointerenter`
   BEFORE making the tip visible, which is the worst case: on touch,
   `touchstart` fires before the reveal, so any measured-clamp logic runs
   against a hidden element. A hidden element measures zero, which produces a
   WRONG shift rather than no shift. Testing the easy order hides that bug.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  window.tipAudit = async function (opts) {
    opts = opts || {};
    var pad = opts.pad != null ? opts.pad : 0.5;
    var sel = opts.selector || '.help-tip';
    var seen = {}, findings = [];

    /* Some pages only mount a tip's container in one UI state (a selected
       intent, an open tab, a chosen scenario). Clicking every such control
       first is what makes the audit cover the page rather than its landing
       state. Extend `states` per page when a tip lives behind a control this
       list does not name. */
    var states = [].slice.call(document.querySelectorAll(
      opts.states || '.rd-chip, .seg-btn, [role="tab"], .tab-btn'
    ));

    async function pass() {
      var tips = [].slice.call(document.querySelectorAll(sel));
      for (var i = 0; i < tips.length; i++) {
        var t = tips[i], c = t.querySelector('.tip-content');
        if (!c) continue;

        // Skip tips whose own ancestors are display:none — not this audit's
        // business, and they cannot be measured meaningfully.
        var p = t.parentElement, hidden = false;
        while (p && p !== document.body) {
          if (getComputedStyle(p).display === 'none') { hidden = true; break; }
          p = p.parentElement;
        }
        if (hidden) continue;

        var key = (t.parentElement && t.parentElement.textContent || '').trim().slice(0, 40);
        var prevDisplay = c.style.display, prevTransform = c.style.transform;
        t.scrollIntoView({ block: 'center' });

        c.style.display = ''; c.style.transform = '';
        t.dispatchEvent(new Event('pointerenter', { bubbles: true }));  // worst-case order
        var revealedByCss = getComputedStyle(c).display !== 'none';
        c.style.display = 'block';

        var r = c.getBoundingClientRect(), issues = [];
        if (r.left < -pad) issues.push('offLeft:' + Math.round(r.left));
        if (r.right > window.innerWidth + pad) issues.push('offRight:' + Math.round(r.right - window.innerWidth));
        if (r.width < 40 || r.height < 10) issues.push('collapsed:' + Math.round(r.width) + 'x' + Math.round(r.height));

        // THE PRIMARY CHECK — every ancestor, not just the parent.
        var q = c.parentElement;
        while (q && q !== document.body) {
          var ov = getComputedStyle(q);
          if (ov.overflow !== 'visible' || ov.overflowX !== 'visible' || ov.overflowY !== 'visible') {
            var pr = q.getBoundingClientRect();
            if (r.top < pr.top - pad || r.left < pr.left - pad ||
                r.right > pr.right + pad || r.bottom > pr.bottom + pad) {
              issues.push('clipBy:' + (q.className || q.tagName) + '[' + ov.overflow + ']');
            }
          }
          q = q.parentElement;
        }

        var hx = Math.round(r.left + 8), hy = Math.round(r.top + 8);
        if (r.width > 40 && hy >= 0 && hy < window.innerHeight && hx >= 0) {
          var el = document.elementFromPoint(hx, hy);
          if (el && !c.contains(el) && el !== c) issues.push('occluded');
        }

        c.style.display = prevDisplay; c.style.transform = prevTransform;

        // The :focus reveal path, checked separately from geometry.
        t.focus();
        if (getComputedStyle(c).display === 'none' && document.hasFocus()) issues.push('notRevealed');
        t.blur();

        seen[key] = 1;
        if (issues.length && !findings.some(function (f) { return f.tip === key && f.issues.join() === issues.join(); })) {
          findings.push({ tip: key, issues: issues, revealedByCss: revealedByCss });
        }
      }
    }

    await pass();
    for (var s = 0; s < states.length; s++) {
      try { states[s].click(); } catch (e) {}
      await new Promise(function (r) { setTimeout(r, 260); });
      await pass();
    }

    var d = document.documentElement;
    return {
      url: location.pathname,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      windowFocused: document.hasFocus(),
      distinctTips: Object.keys(seen).length,
      statesExercised: states.length,
      hOverflow: d.scrollWidth - d.clientWidth,
      findings: findings
    };
  };
})();
