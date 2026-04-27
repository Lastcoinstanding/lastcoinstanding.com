
// Data will be loaded from data.json
let data = null;
let allLeaves = [];

// Load data
fetch('data.json')
  .then(r => r.json())
  .then(d => {
    data = d;
    document.getElementById('loading').classList.add('hidden');
    renderTree('btc-tree', data.bitcoin.clusters, 'btc');
    renderTree('fiat-tree', data.fiat.clusters, 'fiat');
  })
  .catch(e => {
    console.error('Error loading data:', e);
    document.getElementById('loading').textContent = 'Error loading data. Please refresh.';
  });

// Toggle view
function toggleView() {
  const body = document.body;
  const btcView = document.getElementById('btc-view');
  const fiatView = document.getElementById('fiat-view');
  const btcLabel = document.querySelector('.toggle-label.btc');
  const fiatLabel = document.querySelector('.toggle-label.fiat');
  
  body.classList.toggle('fiat-active');
  
  if (body.classList.contains('fiat-active')) {
    btcView.classList.remove('active');
    fiatView.classList.add('active');
    btcLabel.classList.remove('active');
    fiatLabel.classList.add('active');
  } else {
    btcView.classList.add('active');
    fiatView.classList.remove('active');
    btcLabel.classList.add('active');
    fiatLabel.classList.remove('active');
  }
}

// Measure text width
function measureTextWidth(text, fontSize) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `600 ${fontSize}px 'Cormorant Garamond', Georgia, serif`;
  return ctx.measureText(text).width;
}

// Layout and render tree with branches and labels
function renderTree(svgId, clusters, type) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  svg.innerHTML = '';
  
  const mobile = window.innerWidth <= 768;
  const isBtc = type === 'btc';
  const leafColor = isBtc ? '#f7931a' : '#6a7580';
  const leafColorAlt = isBtc ? '#e88510' : '#5a6570';
  const branchColor = isBtc ? '#5a4030' : '#454550';
  const labelColor = isBtc ? '#f7931a' : '#8a9098';
  const textColor = isBtc ? '#1a1510' : '#f0f0f0';
  
  // Responsive dimensions
  const width = mobile ? 380 : 750;
  const clusterSpacing = mobile ? 140 : 160; // Tighter vertical spacing
  const headerSpace = mobile ? 50 : 60;
  const footerSpace = mobile ? 70 : 90;
  
  // Calculate total height based on clusters
  let totalHeight = headerSpace;
  clusters.forEach(cluster => {
    const numWords = cluster.words.length;
    const rows = Math.ceil(numWords / (mobile ? 2 : 3)); // Fewer per row = more rows
    const leafGapY = mobile ? 52 : 56;
    const clusterHeight = Math.max(clusterSpacing, rows * leafGapY + (mobile ? 90 : 85));
    totalHeight += clusterHeight;
  });
  totalHeight += footerSpace;
  
  const height = totalHeight;
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
  
  const trunkX = width / 2;
  const trunkTop = headerSpace;
  const trunkBottom = height - footerSpace + 30;
  
  // Draw trunk
  const trunkWidth = mobile ? 14 : 18;
  const trunk = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  trunk.setAttribute('d', `
    M${trunkX - trunkWidth} ${trunkBottom}
    Q${trunkX - trunkWidth * 0.8} ${trunkBottom - (trunkBottom - trunkTop) * 0.3} ${trunkX - trunkWidth * 0.4} ${trunkTop + 30}
    L${trunkX + trunkWidth * 0.4} ${trunkTop + 30}
    Q${trunkX + trunkWidth * 0.8} ${trunkBottom - (trunkBottom - trunkTop) * 0.3} ${trunkX + trunkWidth} ${trunkBottom}
    Z
  `);
  trunk.setAttribute('fill', branchColor);
  svg.appendChild(trunk);
  
  // Draw roots
  const rootAngles = [-30, -10, 10, 30];
  rootAngles.forEach(angle => {
    const rad = angle * Math.PI / 180;
    const root = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const rootLen = mobile ? 35 : 50;
    const endX = trunkX + Math.sin(rad) * rootLen;
    const endY = trunkBottom + Math.cos(rad) * rootLen * 0.7;
    root.setAttribute('d', `M${trunkX} ${trunkBottom} Q${trunkX + Math.sin(rad) * rootLen * 0.5} ${trunkBottom + 15} ${endX} ${endY}`);
    root.setAttribute('stroke', branchColor);
    root.setAttribute('stroke-width', mobile ? '6' : '8');
    root.setAttribute('fill', 'none');
    root.setAttribute('stroke-linecap', 'round');
    svg.appendChild(root);
  });
  
  // Process each cluster
  let currentY = headerSpace + 35;
  
  clusters.forEach((cluster, ci) => {
    // Alternate which side the branch goes, but leaves spread BOTH sides
    const branchGoesLeft = ci % 2 === 0;
    const branchDirection = branchGoesLeft ? -1 : 1;
    const numWords = cluster.words.length;
    
    // Branch parameters - varied angles for organic feel
    const baseAngle = mobile ? 25 : 30;
    const angleVariation = (ci % 3) * 5;
    const branchAngle = branchDirection * (baseAngle + angleVariation);
    const branchRad = branchAngle * Math.PI / 180;
    const branchLen = mobile ? 45 : 70;
    
    const branchStartX = trunkX;
    const branchStartY = currentY + 15;
    const branchEndX = trunkX + Math.sin(branchRad) * branchLen;
    const branchEndY = branchStartY - Math.abs(Math.cos(branchRad)) * branchLen * 0.12;
    
    // Draw branch with curve
    const branch = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const ctrlX = branchStartX + (branchEndX - branchStartX) * 0.6;
    const ctrlY = branchStartY - 6;
    branch.setAttribute('d', `M${branchStartX} ${branchStartY} Q${ctrlX} ${ctrlY} ${branchEndX} ${branchEndY}`);
    branch.setAttribute('stroke', branchColor);
    branch.setAttribute('stroke-width', mobile ? '9' : '11');
    branch.setAttribute('fill', 'none');
    branch.setAttribute('stroke-linecap', 'round');
    svg.appendChild(branch);
    
    // Draw cluster label - position at end of branch
    const labelFontSize = mobile ? 15 : 15;
    const labelText = cluster.name;
    const labelWidth = measureTextWidth(labelText, labelFontSize) + (mobile ? 18 : 18);
    const labelHeight = mobile ? 26 : 24;
    const labelX = branchEndX + branchDirection * 5;
    const labelY = branchEndY - (mobile ? 18 : 16);
    
    // Label background
    const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    labelBg.setAttribute('x', branchGoesLeft ? labelX - labelWidth : labelX);
    labelBg.setAttribute('y', labelY - labelHeight / 2);
    labelBg.setAttribute('width', labelWidth);
    labelBg.setAttribute('height', labelHeight);
    labelBg.setAttribute('rx', '3');
    labelBg.setAttribute('fill', 'rgba(10,12,15,0.92)');
    labelBg.setAttribute('stroke', isBtc ? 'rgba(247,147,26,0.5)' : 'rgba(100,120,140,0.5)');
    labelBg.setAttribute('stroke-width', '1');
    svg.appendChild(labelBg);
    
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', branchGoesLeft ? labelX - labelWidth / 2 : labelX + labelWidth / 2);
    label.setAttribute('y', labelY + 1);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'middle');
    label.setAttribute('fill', labelColor);
    label.setAttribute('font-size', labelFontSize);
    label.setAttribute('font-weight', '600');
    label.setAttribute('font-family', "'Cormorant Garamond', Georgia, serif");
    label.textContent = labelText;
    svg.appendChild(label);
    
    // Calculate leaf positions - SPREAD ACROSS BOTH SIDES of branch
    const leafRadius = mobile ? 34 : 36;
    const fontSize = mobile ? 12 : 13;
    
    // Leaves fan out from branch end in a natural canopy pattern
    const leafStartY = branchEndY + (mobile ? 36 : 38);
    
    // Create positions that spread both left and right of the branch
    const positions = [];
    const spreadWidth = mobile ? 180 : 280; // Total width for leaves
    const baseX = branchEndX; // Center around branch end
    
    // Generate organic positions with collision detection
    cluster.words.forEach((word, wi) => {
      // Alternate between left and right of branch center
      const side = wi % 2 === 0 ? -1 : 1;
      
      // Calculate base row (roughly 2-3 per row for more vertical spread)
      const effectiveRow = Math.floor(wi / (mobile ? 2 : 3));
      const posInRow = wi % (mobile ? 2 : 3);
      
      // Horizontal spread - alternate sides with more spacing
      const hSpread = mobile ? 75 : 95;
      let offsetX = side * (hSpread * 0.6 + posInRow * hSpread * 0.5);
      
      // Add randomness for organic feel (reduced to prevent overlaps)
      offsetX += (Math.sin(wi * 2.3) * (mobile ? 8 : 14));
      
      // Vertical position with variation
      const vSpacing = mobile ? 52 : 56;
      let offsetY = effectiveRow * vSpacing;
      
      // Stagger vertically for organic feel
      offsetY += (Math.cos(wi * 1.7) * (mobile ? 6 : 10));
      offsetY += (wi % 3) * (mobile ? 5 : 8); // Additional stagger
      
      let finalX = baseX + offsetX;
      let finalY = leafStartY + offsetY;
      
      // Calculate this word's ellipse width for proper collision detection
      const wordText = word.word;
      const textWidth = measureTextWidth(wordText, fontSize);
      const thisRx = Math.max(leafRadius, textWidth / 2 + (mobile ? 14 : 18));
      
      // Collision check with all previously placed leaves
      const minDist = mobile ? 72 : 85;
      let iterations = 0;
      let hasCollision = true;
      
      while (hasCollision && iterations < 15) {
        hasCollision = false;
        for (let p of positions) {
          const dx = finalX - p.x;
          const dy = finalY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const requiredDist = (thisRx + p.rx) * 0.85 + 8; // Account for ellipse widths
          
          if (dist < requiredDist) {
            hasCollision = true;
            // Nudge away more aggressively
            const nudge = (requiredDist - dist) / 2 + 5;
            const angle = Math.atan2(dy, dx) || (Math.random() * Math.PI * 2);
            finalX += Math.cos(angle) * nudge;
            finalY += Math.sin(angle) * nudge * 0.6; // Less vertical nudge
            break;
          }
        }
        iterations++;
      }
      
      positions.push({
        x: finalX,
        y: finalY,
        rx: thisRx,
        word: word
      });
    });
    
    // Draw twigs and leaves
    positions.forEach((pos, wi) => {
      // Draw twig from branch to leaf
      const twig = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const twigMidX = branchEndX + (pos.x - branchEndX) * 0.3;
      const twigMidY = branchEndY + (pos.y - branchEndY) * 0.2;
      twig.setAttribute('d', `M${branchEndX} ${branchEndY} Q${twigMidX} ${twigMidY} ${pos.x} ${pos.y - leafRadius * 0.5}`);
      twig.setAttribute('stroke', branchColor);
      twig.setAttribute('stroke-width', mobile ? '1.5' : '2');
      twig.setAttribute('fill', 'none');
      twig.setAttribute('opacity', '0.5');
      svg.appendChild(twig);
      
      // Draw leaf (ellipse) - use pre-calculated rx
      const wordText = pos.word.word;
      const rx = pos.rx; // Use stored rx from collision detection
      const ry = leafRadius * 0.58;
      
      const leafGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      leafGroup.setAttribute('class', 'leaf');
      leafGroup.setAttribute('style', 'cursor: pointer;');
      
      // Store leaf data for tooltip
      const leafIndex = allLeaves.length;
      allLeaves.push({
        word: wordText,
        desc: pos.word.description,
        insight: pos.word.deeperInsight,
        contrast: pos.word.contrast,
        synonyms: pos.word.synonyms,
        cluster: cluster.name,
        type: type
      });
      
      leafGroup.setAttribute('onmouseenter', `showTooltip(event, ${leafIndex})`);
      leafGroup.setAttribute('onmouseleave', 'hideTooltip()');
      leafGroup.setAttribute('onmousemove', 'moveTooltip(event)');
      leafGroup.setAttribute('ontouchstart', `showTooltip(event, ${leafIndex})`);
      
      const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      ellipse.setAttribute('cx', pos.x);
      ellipse.setAttribute('cy', pos.y);
      ellipse.setAttribute('rx', rx);
      ellipse.setAttribute('ry', ry);
      ellipse.setAttribute('fill', wi % 2 === 0 ? leafColor : leafColorAlt);
      ellipse.setAttribute('style', 'transition: transform 0.2s, filter 0.2s;');
      leafGroup.appendChild(ellipse);
      
      // Leaf text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pos.x);
      text.setAttribute('y', pos.y + 1);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', textColor);
      text.setAttribute('font-size', fontSize);
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', "'Cormorant Garamond', Georgia, serif");
      text.setAttribute('pointer-events', 'none');
      text.textContent = wordText;
      leafGroup.appendChild(text);
      
      // Hover effect
      leafGroup.addEventListener('mouseenter', () => {
        ellipse.style.filter = 'brightness(1.15)';
        ellipse.style.transform = 'scale(1.05)';
        ellipse.style.transformOrigin = `${pos.x}px ${pos.y}px`;
      });
      leafGroup.addEventListener('mouseleave', () => {
        ellipse.style.filter = '';
        ellipse.style.transform = '';
      });
      
      svg.appendChild(leafGroup);
    });
    
    // Calculate max Y used by this cluster's leaves
    const maxLeafY = Math.max(...positions.map(p => p.y)) + leafRadius;
    const clusterBottom = maxLeafY + (mobile ? 25 : 35);
    
    // Update Y position for next cluster
    currentY = clusterBottom;
  });
}

// Tooltip functions
const tooltip = document.getElementById('tooltip');
const tooltipOverlay = document.getElementById('tooltip-overlay');
const isMobile = () => window.innerWidth <= 768;

function showTooltip(e, leafIndex) {
  e.preventDefault();
  e.stopPropagation();
  
  const leaf = allLeaves[leafIndex];
  if (!leaf) return;
  
  const isBtc = leaf.type === 'btc';
  
  // Update tooltip class
  tooltip.className = 'tooltip ' + leaf.type;
  
  // Update content
  document.getElementById('tip-word').textContent = leaf.word;
  document.getElementById('tip-word').className = 'tooltip-word ' + leaf.type;
  document.getElementById('tip-desc').textContent = leaf.desc;
  
  // Deeper insight
  const insightSection = document.getElementById('tip-insight-section');
  const insightTitle = document.getElementById('tip-insight-title');
  const insightContent = document.getElementById('tip-insight');
  if (leaf.insight) {
    insightSection.style.display = 'block';
    insightTitle.className = 'tooltip-section-title ' + leaf.type;
    insightContent.textContent = leaf.insight;
  } else {
    insightSection.style.display = 'none';
  }
  
  // Contrast
  const contrastSection = document.getElementById('tip-contrast-section');
  const contrastTitle = document.getElementById('tip-contrast-title');
  const contrastContent = document.getElementById('tip-contrast');
  if (leaf.contrast) {
    contrastSection.style.display = 'block';
    // Use OPPOSITE color for contrast header
    contrastTitle.className = 'tooltip-section-title ' + (isBtc ? 'fiat' : 'btc');
    contrastTitle.textContent = isBtc ? 'Fiat Contrast' : 'Bitcoin Contrast';
    contrastContent.textContent = leaf.contrast;
  } else {
    contrastSection.style.display = 'none';
  }
  
  // Synonyms
  const synContainer = document.getElementById('tip-synonyms');
  if (leaf.synonyms && leaf.synonyms.length > 0) {
    synContainer.innerHTML = '<strong>Related:</strong> ' + 
      leaf.synonyms.map(s => `<span class="${leaf.type}">${s}</span>`).join('');
    synContainer.style.display = 'block';
  } else {
    synContainer.style.display = 'none';
  }
  
  tooltip.style.display = 'block';
  
  if (isMobile()) {
    // Mobile: show overlay and center tooltip
    tooltipOverlay.style.display = 'block';
    tooltip.style.top = '50%';
    tooltip.style.transform = 'translateY(-50%)';
    document.body.style.overflow = 'hidden';
  } else {
    moveTooltip(e);
  }
}

function moveTooltip(e) {
  if (isMobile()) return;
  
  const x = e.clientX || (e.touches && e.touches[0].clientX);
  const y = e.clientY || (e.touches && e.touches[0].clientY);
  
  const rect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = x + 20;
  let top = y + 15;
  
  // Keep tooltip in viewport
  if (left + rect.width > viewportWidth - 20) {
    left = x - rect.width - 20;
  }
  if (top + rect.height > viewportHeight - 20) {
    top = y - rect.height - 15;
  }
  if (left < 10) left = 10;
  if (top < 10) top = 10;
  
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
  tooltip.style.transform = 'none';
}

function hideTooltip() {
  tooltip.style.display = 'none';
  tooltipOverlay.style.display = 'none';
  document.body.style.overflow = '';
}

// Hide tooltip on scroll
window.addEventListener('scroll', hideTooltip);

// Re-render on resize (for orientation changes)
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (data) {
      allLeaves = [];
      renderTree('btc-tree', data.bitcoin.clusters, 'btc');
      renderTree('fiat-tree', data.fiat.clusters, 'fiat');
    }
  }, 250);
});


(function() {
    var hamburger = document.getElementById('hamburger');
    var overlay = document.getElementById('mobileOverlay');
    if (!hamburger || !overlay) return;
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('open');
        overlay.classList.toggle('show');
        document.body.style.overflow = overlay.classList.contains('show') ? 'hidden' : '';
    });
    var links = overlay.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
        links[i].addEventListener('click', function() {
            hamburger.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
})();
