
// ════════════════════════════════════════════════════════════
// GEOMETRY: Flower of Life positions (code, not content)
// ════════════════════════════════════════════════════════════
const R = 80, S3 = Math.sqrt(3);
const POS = {
    'center':        [0, 0],
    'top':           [0, -R],
    'top-right':     [R*S3/2, -R/2],
    'bottom-right':  [R*S3/2, R/2],
    'bottom':        [0, R],
    'bottom-left':   [-R*S3/2, R/2],
    'top-left':      [-R*S3/2, -R/2],
    'r2-top':        [0, -2*R],
    'upper-right-a': [2*R*S3/2, -2*R/2],
    'upper-right-b': [R*S3/2, -R-R/2],
    'right':         [R*S3, 0],
    'lower-right-a': [2*R*S3/2, 2*R/2],
    'lower-right-b': [R*S3/2, R+R/2],
    'r2-bottom':     [0, 2*R],
    'lower-left-b':  [-R*S3/2, R+R/2],
    'lower-left-a':  [-2*R*S3/2, 2*R/2],
    'left':          [-R*S3, 0],
    'upper-left-a':  [-2*R*S3/2, -2*R/2],
    'upper-left-b':  [-R*S3/2, -R-R/2]
};

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════
let concepts = [], meta = {}, explored = new Set(), activeId = null, hoverTimeout = null;
const NS = 'http://www.w3.org/2000/svg';
function svgEl(t, a) { const e = document.createElementNS(NS, t); for (const [k,v] of Object.entries(a)) e.setAttribute(k,v); return e; }

// ════════════════════════════════════════════════════════════
// CMS LOADER
// ════════════════════════════════════════════════════════════
async function loadData() {
    try {
        const r = await fetch('concepts.json');
        const d = await r.json();
        meta = d.meta;
        concepts = d.concepts.map(c => {
            // Ring 2 'top'/'bottom' map to r2-top/r2-bottom
            let posKey = c.position;
            if (c.ring === 2 && (posKey === 'top' || posKey === 'bottom')) posKey = 'r2-' + posKey;
            const [x, y] = POS[posKey] || [0, 0];
            return { ...c, x, y };
        });
        applyMeta();
        render();
    } catch (e) {
        console.error('Failed to load concepts.json:', e);
        document.getElementById('panelIntro').textContent = 'Error loading content. Ensure concepts.json is in the same directory as this HTML file.';
    }
}

function applyMeta() {
    document.getElementById('pageTitle').textContent = meta.title;
    document.getElementById('pageSubtitle').textContent = meta.subtitle;
    document.getElementById('panelIntro').textContent = meta.panelIntro;
    document.getElementById('panelIntroSecondary').textContent = meta.panelIntroSecondary;
    document.getElementById('panelCta').textContent = meta.panelCta;
    document.getElementById('totalCount').textContent = concepts.length;
    document.title = meta.title + ' | Last Coin Standing';
}

// ════════════════════════════════════════════════════════════
// RENDER
// ════════════════════════════════════════════════════════════
function render() {
    const cG = document.getElementById('circles-group'), hG = document.getElementById('hit-group');
    [...concepts].sort((a,b) => b.ring - a.ring).forEach(c => {
        cG.appendChild(svgEl('circle', { cx:c.x, cy:c.y, r:R, class:`flower-circle ring-${c.ring} animate-in`, 'data-id':c.id, id:`circle-${c.id}` }));
    });
    concepts.forEach(c => {
        const hit = svgEl('circle', { cx:c.x, cy:c.y, r:40, class:'hit-area', 'data-id':c.id });
        hit.addEventListener('mouseenter', () => handleHover(c.id));
        hit.addEventListener('mouseleave', () => handleLeave(c.id));
        hit.addEventListener('click', () => handleClick(c.id));
        hit.addEventListener('touchstart', e => { e.preventDefault(); handleClick(c.id); }, { passive: false });
        hG.appendChild(hit);
    });
    setTimeout(() => { document.querySelectorAll('.flower-circle').forEach(el => { el.classList.add('visible'); el.classList.remove('animate-in'); }); }, 1800);
}

// ════════════════════════════════════════════════════════════
// INTERACTION
// ════════════════════════════════════════════════════════════
function handleHover(id) {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const el = document.getElementById(`circle-${id}`);
    if (!explored.has(id) && id !== activeId) el.classList.add('hover');
    showLabel(id);
}
function handleLeave(id) {
    document.getElementById(`circle-${id}`).classList.remove('hover');
    hoverTimeout = setTimeout(() => { activeId ? showLabel(activeId) : hideLabel(); }, 80);
}
function handleClick(id) {
    explored.add(id); activeId = id;
    concepts.forEach(c => {
        const el = document.getElementById(`circle-${c.id}`);
        el.classList.remove('hover','active','explored');
        if (c.id === activeId) { el.classList.add('active'); el.parentNode.appendChild(el); }
        else if (explored.has(c.id)) el.classList.add('explored');
    });
    document.getElementById('svgWrap').classList.add('has-explored');
    showLabel(id); updatePanel(id); updateProgress();
    if (explored.size === concepts.length) setTimeout(celebrate, 400);
}
function showLabel(id) {
    const c = concepts.find(x => x.id === id), l = document.getElementById('floatLabel');
    const isMobile = window.innerWidth <= 600;
    const fontSize = isMobile ? 21 : 15;
    const lineHeight = fontSize * 1.25;
    const strokeW = isMobile ? 3 : 4;
    
    // Clear previous content
    while (l.children.length > 1) l.removeChild(l.lastChild);
    const bg = l.querySelector('rect');
    
    const words = c.label.split(' ');
    const isMultiWord = words.length >= 2;
    
    if (isMultiWord) {
        // Split into two lines
        const mid = Math.ceil(words.length / 2);
        const line1 = words.slice(0, mid).join(' ');
        const line2 = words.slice(mid).join(' ');
        
        const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t1.setAttribute('class', 'label-text');
        t1.setAttribute('x', '0');
        t1.setAttribute('y', -lineHeight / 2);
        t1.style.fontSize = fontSize + 'px';
        t1.style.strokeWidth = strokeW + 'px';
        t1.textContent = line1;
        
        const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t2.setAttribute('class', 'label-text');
        t2.setAttribute('x', '0');
        t2.setAttribute('y', lineHeight / 2);
        t2.style.fontSize = fontSize + 'px';
        t2.style.strokeWidth = strokeW + 'px';
        t2.textContent = line2;
        
        // Size background rect
        const maxLen = Math.max(line1.length, line2.length) * fontSize * 0.58;
        bg.setAttribute('x', -maxLen / 2 - 6);
        bg.setAttribute('y', -lineHeight - 4);
        bg.setAttribute('width', maxLen + 12);
        bg.setAttribute('height', lineHeight * 2 + 8);
        
        l.appendChild(t1);
        l.appendChild(t2);
    } else {
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('class', 'label-text');
        t.setAttribute('x', '0');
        t.setAttribute('y', '0');
        t.style.fontSize = fontSize + 'px';
        t.style.strokeWidth = strokeW + 'px';
        t.textContent = c.label;
        
        const w = c.label.length * fontSize * 0.58;
        bg.setAttribute('x', -w / 2 - 6);
        bg.setAttribute('y', -fontSize / 2 - 4);
        bg.setAttribute('width', w + 12);
        bg.setAttribute('height', fontSize + 8);
        
        l.appendChild(t);
    }
    
    l.setAttribute('transform', `translate(${c.x},${c.y})`);
    l.style.opacity = '1';
}
function hideLabel() { document.getElementById('floatLabel').style.opacity = '0'; }

// ════════════════════════════════════════════════════════════
// PANEL
// ════════════════════════════════════════════════════════════
function updatePanel(id) {
    const c = concepts.find(x => x.id === id);
    const ct = document.getElementById('panelContent');
    ct.style.display = 'none'; void ct.offsetHeight;
    document.getElementById('conceptTag').textContent = c.tag;
    document.getElementById('conceptName').textContent = c.label;
    document.getElementById('conceptDesc').innerHTML = c.desc;
    const rel = document.getElementById('conceptRelation');
    if (c.relation) { rel.innerHTML = c.relation; rel.style.display = 'block'; }
    else rel.style.display = 'none';
    document.getElementById('panelDefault').style.display = 'none';
    ct.style.display = 'block';
}

// ════════════════════════════════════════════════════════════
// PROGRESS + COMPLETION + RESET
// ════════════════════════════════════════════════════════════
function updateProgress() {
    const n = explored.size;
    document.getElementById('count').textContent = n;
    document.getElementById('progressFill').style.width = `${(n/concepts.length)*100}%`;
    if (n >= 3) document.getElementById('resetBtn').classList.add('show');
}
function celebrate() {
    document.getElementById('svgWrap').classList.add('complete');
    const ct = document.getElementById('panelContent');
    ct.style.display = 'none'; void ct.offsetHeight;
    document.getElementById('conceptTag').textContent = `All ${concepts.length} Dimensions`;
    document.getElementById('conceptName').textContent = meta.completionTitle;
    document.getElementById('conceptDesc').innerHTML = meta.completionDesc;
    const rel = document.getElementById('conceptRelation');
    rel.innerHTML = meta.completionRelation; rel.style.display = 'block';
    ct.style.display = 'block';
}
function resetAll() {
    explored.clear(); activeId = null;
    concepts.forEach(c => { document.getElementById(`circle-${c.id}`).classList.remove('hover','active','explored'); });
    document.getElementById('svgWrap').classList.remove('has-explored','complete');
    hideLabel();
    document.getElementById('panelDefault').style.display = 'block';
    document.getElementById('panelContent').style.display = 'none';
    document.getElementById('count').textContent = '0';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('resetBtn').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', loadData);



