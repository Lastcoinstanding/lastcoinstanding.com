// ═══════════════════════════════════════════════════════════════════
// BORROWING AGAINST YOUR STACK — page logic
//
// Three-tab page: Question / Calculator / Math. This file currently
// handles only tab routing. The Calculator's interactive surface
// (scenario modeling, channel-position chart, borrow-vs-sell view,
// three-flavor loss-scenario backtests) ships in subsequent commits
// alongside the Math tab's methodology notes.
//
// Tab-routing pattern matches Disciplined Rebalancing for consistency.
// ═══════════════════════════════════════════════════════════════════

// ═══════ TAB ROUTING ═══════
(function(){
  var btns = document.querySelectorAll('.tab-btn');
  if(!btns.length) return;
  btns.forEach(function(b){
    b.addEventListener('click', function(){
      btns.forEach(function(x){ x.classList.remove('active'); });
      b.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(function(t){
        t.classList.remove('active');
      });
      var tab = document.getElementById('tab-' + b.dataset.tab);
      if(tab) tab.classList.add('active');
      history.replaceState(null, '', '#' + b.dataset.tab);
    });
  });
  // Honor deep-link via URL hash on initial load
  var hash = location.hash.replace('#','');
  if(hash){
    var target = document.querySelector('[data-tab="'+hash+'"]');
    if(target) target.click();
  }
})();
