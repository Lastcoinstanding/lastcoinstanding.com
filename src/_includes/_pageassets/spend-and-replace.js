/* ─── Spend and Replace — footnote interaction ───
   Tiny IIFE that intercepts clicks on footnote markers and their
   back-arrow returns, applying smooth scroll behavior consistent
   across browsers. Without this, the browser's default jump is
   instantaneous and the reader can lose visual context between
   the body and the Notes & References section. The :target CSS
   rule in spend-and-replace.css applies a brief amber highlight
   so the destination note is easy to spot after the scroll.
   No state, no globals, no listeners outside this scope. */
(function () {
  'use strict';

  function smoothScrollTo(hash) {
    if (!hash || hash.charAt(0) !== '#') return;
    var id = hash.slice(1);
    var target = document.getElementById(id);
    if (!target) return;
    // Use the browser's native smooth scroll; site nav is sticky
    // so scroll-margin-top in CSS handles the offset cleanly.
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // History push so the URL reflects the navigation and the
    // :target highlight fires.
    if (history.pushState) {
      history.pushState(null, '', hash);
      // Force the :target match — without this, identical-hash
      // re-clicks don't re-trigger the animation. Toggle to a
      // sentinel, then back.
      history.replaceState(null, '', '#');
      requestAnimationFrame(function () {
        history.replaceState(null, '', hash);
      });
    }
  }

  function bindMarker(a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#') return;
      e.preventDefault();
      smoothScrollTo(href);
    });
  }

  document.querySelectorAll('sup.fn-mark a, a.fn-back').forEach(bindMarker);
})();
