/* =============================================================
   chart-startup.js — build charts when they are about to be seen,
   and skip their entrance animation (shared; base.njk, 2026-10-31)

   WHY. A chart page used to build every chart while the page loaded,
   including charts far down the page and in tabs nobody had opened,
   and each chart then animated in over ~1 s, redrawing every frame.
   On a mid-range phone (Lighthouse, 4x CPU) that was ~1.1 s of main
   thread blocked on The Power Law and ~0.7 s on Bitcoin vs. Real
   Estate, during which taps went unanswered.

   lcsWhenNear(el, build)
     Runs build() once, when `el` (an element or its id) comes within
     600px of the viewport. A canvas inside a hidden tab
     (display:none) has no box, so it never intersects; its chart is
     built when the tab is opened and the canvas is near. Without
     IntersectionObserver, build() runs at once. Code that updates a
     lazily built chart must cope with it not existing yet (keep the
     state in variables; build from the current state).
     lcsWhenNear.flush() builds everything still pending (print, the
     QA harnesses, anything that reads every chart's data).

   Entrance animation. On pages with `chart_entrance: false` in front
   matter, base.njk calls lcsChartStartup.noEntrance(): charts built
   while the page loads, and charts built later by lcsWhenNear, draw
   at once instead of animating in. Updates after that (sliders,
   toggles, the live price) animate exactly as before: the default is
   restored after the first frame following 'load', and around each
   lazy build.

   Pure ES5; no-op without Chart.js. Idempotent. See SITE_GUIDE
   "Speed: fonts, Chart.js, minified inline code" and STYLE_GUIDE §6.14.
   ============================================================= */
(function () {
  if (window.lcsWhenNear) return;

  var noEntrance = false;
  // Run fn with Chart.js animation off, when this page asked for it.
  function quiet(fn) {
    var C = window.Chart;
    if (!noEntrance || !C || !C.defaults) return fn();
    var saved = C.defaults.animation;
    C.defaults.animation = false;
    try { return fn(); } finally { C.defaults.animation = saved; }
  }

  var pending = [];
  var io = ('IntersectionObserver' in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) run(e.target); });
      }, { rootMargin: '600px 0px' })
    : null;

  function run(el) {
    for (var i = pending.length - 1; i >= 0; i--) {
      if (pending[i].el !== el) continue;
      var build = pending[i].build;
      pending.splice(i, 1);
      try { quiet(build); } catch (err) { setTimeout(function () { throw err; }); }
    }
    if (io) io.unobserve(el);
  }

  window.lcsWhenNear = function (el, build) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el) return;
    if (!io) { quiet(build); return; }
    pending.push({ el: el, build: build });
    io.observe(el);
  };
  window.lcsWhenNear.flush = function () {
    pending.slice().forEach(function (p) { run(p.el); });
  };
  window.addEventListener('beforeprint', function () { window.lcsWhenNear.flush(); });

  window.lcsChartStartup = {
    noEntrance: function () {
      var C = window.Chart;
      if (!C || !C.defaults || noEntrance) return;
      noEntrance = true;
      var saved = C.defaults.animation;
      C.defaults.animation = false;
      function restore() {
        requestAnimationFrame(function () { C.defaults.animation = saved; });
      }
      if (document.readyState === 'complete') restore();
      else window.addEventListener('load', restore);
    }
  };
})();
