// ═══════ DISCIPLINED REBALANCING — TAB ROUTING ═══════
//
// Tab switching for the three-tab structure: Question / Calculator / Math.
// Reads location.hash on load to deep-link to a specific tab. Uses
// history.replaceState so tab changes don't pollute the back-button stack.
//
// Calculator math engine, output rendering, and Math tab content ship
// in subsequent commits (see DISCIPLINED_REBALANCING_DESIGN.md §9.1).
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

  // Init from hash on page load
  var hash = location.hash.replace('#','');
  if(hash){
    var target = document.querySelector('[data-tab="'+hash+'"]');
    if(target) target.click();
  }
})();
