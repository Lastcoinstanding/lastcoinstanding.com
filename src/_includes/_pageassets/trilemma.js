
(function() {
  var panels = { default: document.getElementById('panel-default'), decentralization: document.getElementById('panel-decentralization'), security: document.getElementById('panel-security'), scalability: document.getElementById('panel-scalability') };
  var infoPanel = document.getElementById('info-panel');
  var nodes = document.querySelectorAll('.tri-node');
  var edgeDSe = document.getElementById('edge-d-se');
  var edgeDSc = document.getElementById('edge-d-sc');
  var edgeSeSc = document.getElementById('edge-se-sc');
  var active = null;
  function showPanel(vertex) {
    if (active === vertex) { active = null; panels.default.style.display = 'block'; panels.decentralization.style.display = 'none'; panels.security.style.display = 'none'; panels.scalability.style.display = 'none'; infoPanel.className = 'info-panel'; resetNodes(); resetEdges(); return; }
    active = vertex;
    panels.default.style.display = 'none'; panels.decentralization.style.display = 'none'; panels.security.style.display = 'none'; panels.scalability.style.display = 'none';
    panels[vertex].style.display = 'block';
    infoPanel.className = 'info-panel';
    if (vertex === 'decentralization' || vertex === 'security') { infoPanel.classList.add('highlight-d'); } else { infoPanel.classList.add('highlight-sc'); }
    nodes.forEach(function(n) { var v = n.getAttribute('data-vertex'); var ring = n.querySelector('.node-ring'); var glow = n.querySelector('circle'); if (v === vertex) { ring.setAttribute('stroke-width', '3'); ring.style.filter = v === 'scalability' ? 'url(#glow-grey)' : 'url(#glow-orange)'; glow.style.opacity = '1'; } else { ring.setAttribute('stroke-width', v === 'scalability' ? '1.5' : '2'); ring.style.filter = 'none'; glow.style.opacity = '0'; } });
    resetEdges();
    if (vertex === 'decentralization') { edgeDSe.setAttribute('stroke', '#F7931A'); edgeDSe.setAttribute('stroke-opacity', '0.7'); edgeDSc.setAttribute('stroke', '#F7931A'); edgeDSc.setAttribute('stroke-opacity', '0.4'); }
    else if (vertex === 'security') { edgeDSe.setAttribute('stroke', '#F7931A'); edgeDSe.setAttribute('stroke-opacity', '0.7'); edgeSeSc.setAttribute('stroke', '#F7931A'); edgeSeSc.setAttribute('stroke-opacity', '0.4'); }
    else if (vertex === 'scalability') { edgeDSc.setAttribute('stroke', '#6a7580'); edgeDSc.setAttribute('stroke-opacity', '0.5'); edgeSeSc.setAttribute('stroke', '#6a7580'); edgeSeSc.setAttribute('stroke-opacity', '0.5'); }
  }
  function resetNodes() { nodes.forEach(function(n) { var ring = n.querySelector('.node-ring'); var glow = n.querySelector('circle'); var v = n.getAttribute('data-vertex'); ring.setAttribute('stroke-width', v === 'scalability' ? '1.5' : '2'); ring.style.filter = 'none'; glow.style.opacity = '0'; }); }
  function resetEdges() { edgeDSe.setAttribute('stroke', '#F7931A'); edgeDSe.setAttribute('stroke-opacity', '0.5'); edgeDSc.setAttribute('stroke', '#3a3530'); edgeDSc.setAttribute('stroke-opacity', '0.5'); edgeSeSc.setAttribute('stroke', '#3a3530'); edgeSeSc.setAttribute('stroke-opacity', '0.5'); }
  for (var i = 0; i < nodes.length; i++) { (function(node) { node.addEventListener('click', function() { showPanel(node.getAttribute('data-vertex')); }); node.addEventListener('mouseenter', function() { if (active === node.getAttribute('data-vertex')) return; node.querySelector('.node-ring').setAttribute('stroke-width', '3'); }); node.addEventListener('mouseleave', function() { if (active === node.getAttribute('data-vertex')) return; var v = node.getAttribute('data-vertex'); node.querySelector('.node-ring').setAttribute('stroke-width', v === 'scalability' ? '1.5' : '2'); }); })(nodes[i]); }
})();



