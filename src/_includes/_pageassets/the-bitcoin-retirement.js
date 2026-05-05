/* The Bitcoin Retirement — page scripts
 * Phase 3 / commit 1: tab switching only.
 * The shared modeling-assumptions API and per-page interactivity
 * (slider clusters, math engine, chart, baseline cluster) land across
 * commits 2–7.
 */

(function(){
  var btns = document.querySelectorAll('.tab-btn');
  if (!btns.length) return;

  function activate(tabKey) {
    btns.forEach(function(x){ x.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(t){ t.classList.remove('active'); });
    var btn = document.querySelector('[data-tab="' + tabKey + '"]');
    var pane = document.getElementById('tab-' + tabKey);
    if (btn) btn.classList.add('active');
    if (pane) pane.classList.add('active');
  }

  btns.forEach(function(b){
    b.addEventListener('click', function(){
      var key = b.dataset.tab;
      activate(key);
      // Update URL hash without scrolling
      if (history.replaceState) {
        history.replaceState(null, '', '#' + key);
      }
    });
  });

  // Hash deep-linking on page load
  if (window.location.hash) {
    var hash = window.location.hash.replace('#','');
    if (document.querySelector('[data-tab="' + hash + '"]')) {
      activate(hash);
    }
  }
})();
