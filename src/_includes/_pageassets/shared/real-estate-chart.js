/* ============================================================
   RealEstateChart — Bitcoin vs. Real Estate's wealth chart (PR 6c)
   ============================================================
   REAL_ESTATE_PAIR_DESIGN.md §9; rulings M3, M7, P4, P7. One chart per
   calculator (the look-back and the projection), under the cards and the
   toggle: the house and the bitcoin each year, If sold after tax (the
   default) or Held, the difference as the heaviest line, and the Floor
   drawn faintly in the projection. The colours and line styles are Bitcoin
   vs. Rental Property's (PR 6b), so the pair reads alike.

   RealEstateChart.bind(prefix, onChange) wires the block's two toggles
   (data-basis, data-zoom) and returns { basis(), zoom() }.
   RealEstateChart.render(prefix, spec) draws <prefix>Chart:
     spec.labels   one per point
     spec.series   [{ key, label, data, style: 'house'|'btc'|'floor'|'diff' }]
     spec.fmt      money formatter
   ============================================================ */
(function(){
  'use strict';
  var STYLE = {
    house: { color: '#3987e5', dash: [4, 3], width: 2 },
    btc:   { color: '#e8801c', dash: [],     width: 2.75 },
    floor: { color: 'rgba(212,205,192,0.5)', dash: [2, 3], width: 1.25 },
    diff:  { color: '#f4efe6', dash: [],     width: 3 }
  };
  var charts = {};
  function bind(prefix, onChange){
    var block = document.getElementById(prefix + 'ChartBlock');
    var st = { basis: 'ifsold', zoom: 'full' };
    if (block) block.querySelectorAll('[data-basis], [data-zoom]').forEach(function(b){
      b.addEventListener('click', function(){
        var k = b.hasAttribute('data-basis') ? 'basis' : 'zoom', v = b.getAttribute('data-' + k);
        st[k] = v;
        block.querySelectorAll('[data-' + k + ']').forEach(function(x){
          var on = x.getAttribute('data-' + k) === v;
          x.classList.toggle('active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        if (charts[prefix]) { charts[prefix].destroy(); charts[prefix] = null; }
        onChange();
      });
    });
    return { basis: function(){ return st.basis; }, zoom: function(){ return st.zoom; } };
  }
  function render(prefix, spec){
    var canvas = document.getElementById(prefix + 'Chart');
    if (!canvas || typeof Chart === 'undefined') return;
    var datasets = spec.series.map(function(x){
      var t = STYLE[x.style];
      return { label: x.label, data: x.data, borderColor: t.color, backgroundColor: t.color, borderWidth: t.width, borderDash: t.dash,
               pointRadius: 0, pointHoverRadius: 5, fill: false, tension: 0.15, order: x.style === 'diff' ? 0 : (x.style === 'floor' ? 5 : 2) };
    });
    if (charts[prefix]) { charts[prefix].data.labels = spec.labels; charts[prefix].data.datasets = datasets; charts[prefix].update('resize'); return; }
    var small = window.matchMedia && window.matchMedia('(max-width: 480px)').matches;
    charts[prefix] = new Chart(canvas, {
      type: 'line',
      data: { labels: spec.labels, datasets: datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: 'rgba(232,224,212,0.8)', boxWidth: 18, font: { size: small ? 10 : 11 } } },
          tooltip: { backgroundColor: 'rgba(15,14,13,0.95)', borderColor: 'rgba(224,148,34,0.3)', borderWidth: 1,
                     titleFont: { size: small ? 11 : 12 }, bodyFont: { size: small ? 11 : 12 }, padding: small ? 6 : 10,
                     callbacks: { label: function(c){ return c.dataset.label + ': ' + spec.fmt(c.parsed.y); } } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(232,224,212,0.6)', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(232,224,212,0.6)', font: { size: 11 }, callback: function(v){ return spec.fmt(v); } } }
        }
      }
    });
  }
  function data(prefix){ var c = charts[prefix]; return c ? { labels: c.data.labels.slice(), datasets: c.data.datasets.map(function(d){ return { label: d.label, data: d.data.slice() }; }) } : null; }
  window.RealEstateChart = { bind: bind, render: render, data: data };
})();
