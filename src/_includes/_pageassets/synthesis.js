
/* ═══════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════ */
var components = [
    {
        id: 'pow',
        name: 'Proof of Work',
        shortName: 'Proof of\nWork',
        tagline: 'Component 1 of 6',
        desc: 'Converts energy into security. Miners compete in a brute-force lottery \u2014 repeatedly hashing until they find a value below the network\u2019s target. There is no shortcut; only energy expenditure. This makes it prohibitively expensive to attack the network \u2014 the cost of subversion must exceed the cost of honest participation.',
        deeper: 'Rooted in Adam Back\u2019s Hashcash (1997), Bitcoin\u2019s PoW uses two rounds of SHA-256 hashing. Miners search for a nonce that produces a hash below the network\u2019s target. The process is computationally intensive to perform but trivial to verify \u2014 asymmetry that underpins the entire security model.',
        removal: 'Without Proof of Work, there is no cost to proposing blocks. Any actor can flood the network with conflicting histories at zero expense. The entire security model \u2014 which depends on it being more expensive to attack than to participate honestly \u2014 collapses. You get a database, not a decentralized monetary system.',
        verdictLabel: 'System collapses',
        firstBadge: null
    },
    {
        id: 'difficulty',
        name: 'Difficulty Adjustment',
        shortName: 'Difficulty\nAdjustment',
        tagline: 'Component 2 of 6',
        desc: 'The network\u2019s metabolism. Every 2,016 blocks (~2 weeks), the protocol recalibrates the target threshold that miners must hash below. More miners join? The target tightens. Miners leave? It loosens. This maintains the 10-minute average block time regardless of hardware advances.',
        deeper: 'The 10-minute block interval is a deliberate engineering choice: long enough for blocks to propagate globally so nodes can converge on one truth, short enough to remain practical. Without this adjustment, Moore\u2019s Law and ASIC development would have accelerated block production to the point where all 21 million bitcoin would have been mined within the first few years.',
        removal: 'Without Difficulty Adjustment, the issuance schedule breaks immediately. As mining hardware improves, blocks are found faster and faster. The fixed 21 million supply gets exhausted in years instead of decades. Worse, the 10-minute propagation window \u2014 which gives global nodes time to converge \u2014 shrinks until the network can no longer maintain consensus.',
        verdictLabel: 'Issuance schedule breaks',
        firstBadge: null
    },
    {
        id: 'blockchain',
        name: 'Blockchain',
        shortName: 'Block-\nchain',
        tagline: 'Component 3 of 6',
        desc: 'The immutable chronological record. Each block contains the hash of the previous block, forming a cumulative chain. To alter any past transaction, an attacker would need to re-mine every subsequent block \u2014 a cost that grows exponentially with each confirmation.',
        deeper: 'The chaining mechanism uses SHA-256 hashes to link blocks in sequence. Combined with the P2P network, every node maintains an identical copy of this ledger. The Genesis Block, mined January 3, 2009, embedded The Times headline \u201CChancellor on brink of second bailout for banks\u201D \u2014 both a proof of existence and a statement of intent.',
        removal: 'Without the blockchain\u2019s chaining mechanism, there is no chronological ordering and no cumulative security. Transactions exist in isolation with no way to determine which came first. The double-spend problem \u2014 the fundamental challenge of digital money \u2014 returns in full force. You have digital tokens with no reliable history.',
        verdictLabel: 'Double-spend returns',
        firstBadge: 'First solution to the double-spend problem without a trusted third party'
    },
    {
        id: 'crypto',
        name: 'Public-Key Cryptography',
        shortName: 'Public-Key\nCryptography',
        tagline: 'Component 4 of 6',
        desc: 'Self-sovereign ownership through mathematics. A private key generates a public key via a one-way function (the secp256k1 elliptic curve). Digital signatures prove ownership without revealing the key itself. No identity documents. No intermediaries. Possession of the key is the only valid proof.',
        deeper: 'Bitcoin uses ECDSA (with Schnorr signatures added via Taproot) for transaction authorization. The mathematical relationship is strictly one-way: deriving a private key from its public key is computationally infeasible. This creates true self-sovereignty \u2014 but also means losing a private key results in permanent, irrecoverable loss. There is no \u201Cforgot password\u201D in a trustless system.',
        removal: 'Without public-key cryptography, there is no way to prove ownership of funds without a central authority. Anyone could claim anyone else\u2019s bitcoin. The system would require identity verification, access controls, and trusted administrators \u2014 recreating exactly the intermediary-dependent architecture Bitcoin was designed to eliminate.',
        verdictLabel: 'Ownership becomes meaningless',
        firstBadge: null
    },
    {
        id: 'incentive',
        name: 'Incentive Structure',
        shortName: 'Incentive\nStructure',
        tagline: 'Component 5 of 6',
        desc: 'Aligns self-interest with network security. Miners earn a block reward for honest work \u2014 comprising the block subsidy (newly minted bitcoin) and transaction fees. The halving \u2014 cutting the subsidy 50% every 210,000 blocks (~4 years) \u2014 creates a predictable, diminishing issuance rate that asymptotically approaches the 21 million hard cap. As the subsidy shrinks, transaction fees become the primary incentive securing the network.',
        deeper: 'This is Bitcoin\u2019s economic engine. The incentive design means that the most profitable strategy for any rational actor is to play by the rules. A 51% attack, while theoretically possible, would require such massive capital expenditure that the attacker would earn more by mining honestly. Game theory enforces what no regulator could.',
        removal: 'Without the incentive structure, no rational actor expends energy to secure the network. Mining becomes charity work. The hashrate drops to zero, and with it, all security guarantees. Meanwhile, with no fixed supply schedule, the monetary properties that make bitcoin valuable as a store of value \u2014 the entire economic thesis \u2014 disappear.',
        verdictLabel: 'No one secures the network',
        firstBadge: 'First provably finite digital asset \u2014 absolute digital scarcity'
    },
    {
        id: 'p2p',
        name: 'Peer-to-Peer Network',
        shortName: 'P2P\nNetwork',
        tagline: 'Component 6 of 6',
        desc: 'Eliminates single points of failure. Every node maintains an identical copy of the ledger and independently validates every transaction. Consensus emerges from the network following the chain with the most accumulated work \u2014 no leader, no central server, no authority to corrupt or coerce.',
        deeper: 'This is the component that eluded every predecessor. DigiCash required banks. RPOW required a central server. B-money and Bit Gold couldn\u2019t solve coordination without a leader. The P2P topology means there is no company to subpoena, no server to shut down, no CEO to arrest. The network persists as long as any nodes are running.',
        removal: 'Without peer-to-peer distribution, Bitcoin requires a central server. That server becomes a single point of failure \u2014 it can be shut down by governments, attacked by hackers, or corrupted by its operators. This is precisely why every digital cash attempt before Bitcoin failed. Centralization was the fatal flaw each time.',
        verdictLabel: 'Single point of failure returns',
        firstBadge: 'First trust-minimized peer-to-peer value transfer'
    }
];

var precursors = [
    { name: 'eCash (DigiCash)', year: '1989', creator: 'David Chaum',
      contribution: 'Introduced \u201Cblind signatures\u201D \u2014 cryptographic techniques enabling private digital token transfers. First real implementation of anonymous digital cash.',
      flaw: 'Centralized. Required bank participation to operate. When DigiCash went bankrupt in 1998, the entire system died with it.' },
    { name: 'Hashcash', year: '1997', creator: 'Adam Back',
      contribution: 'Developed the Proof-of-Work concept \u2014 requiring computational effort to send messages, originally to combat email spam. This became the direct foundation for Bitcoin\u2019s mining mechanism.',
      flaw: 'No ledger, no double-spend protection. Hashcash tokens were single-use stamps, not a functional currency. There was no way to track or transfer value.' },
    { name: 'B-money', year: '1998', creator: 'Wei Dai',
      contribution: 'First proposal for an anonymous, distributed electronic cash system where money creation required computational work. Outlined the blueprint Satoshi would later cite.',
      flaw: 'Theoretical only. Remained a whitepaper \u2014 it lacked a viable consensus mechanism and was never implemented.' },
    { name: 'Bit Gold', year: '1998', creator: 'Nick Szabo',
      contribution: 'Envisioned \u201Cunforgeably costly bits\u201D created through Proof of Work \u2014 digital objects whose creation cost was provable, mimicking precious metals.',
      flaw: 'Sybil-vulnerable. Without a decentralized consensus mechanism, attackers could create fake nodes to subvert the property registry. Never fully implemented.' },
    { name: 'RPOW', year: '2004', creator: 'Hal Finney',
      contribution: 'First working implementation of reusable Proof-of-Work tokens as currency. Tokens could be passed from person to person \u2014 the closest anyone had come to Bitcoin.',
      flaw: 'Centralized mint. Despite its innovation, RPOW relied on a single trusted server to validate token reuse \u2014 the exact single point of failure Bitcoin would eliminate.' }
];

/* ═══════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════ */
var CX = 250, CY = 250, RING_R = 160, ORB_R = 46, CORE_R = 48;
var explored = {};
var activeId = null;
var isComplete = false;
var isRemovalMode = false;
var removedId = null;

function getOrbPos(i) {
    var angle = (Math.PI * 2 * i / 6) - Math.PI / 2;
    return { x: CX + RING_R * Math.cos(angle), y: CY + RING_R * Math.sin(angle) };
}

/* Edge-to-edge line endpoints: point on circumference of circle A facing circle B */
function edgePoint(ax, ay, ar, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var dist = Math.sqrt(dx * dx + dy * dy);
    return { x: ax + (dx / dist) * ar, y: ay + (dy / dist) * ar };
}

function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) {
        if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
    }
    return el;
}

function findComp(id) {
    for (var i = 0; i < components.length; i++) {
        if (components[i].id === id) return components[i];
    }
    return null;
}

function exploredCount() {
    var n = 0;
    for (var k in explored) { if (explored[k]) n++; }
    return n;
}

/* ═══════════════════════════════════════════════
   BUILD SVG
   ═══════════════════════════════════════════════ */
function buildSVG() {
    var radialG = document.getElementById('radial-lines');
    var meshG = document.getElementById('mesh-lines');
    var orbsG = document.getElementById('component-orbs');
    radialG.innerHTML = '';
    meshG.innerHTML = '';
    orbsG.innerHTML = '';

    /* Radial lines (orb edge to core edge) */
    for (var i = 0; i < 6; i++) {
        var comp = components[i];
        var pos = getOrbPos(i);
        var fromEdge = edgePoint(pos.x, pos.y, ORB_R, CX, CY);
        var toEdge = edgePoint(CX, CY, CORE_R, pos.x, pos.y);

        var line = svgEl('line', {
            x1: fromEdge.x, y1: fromEdge.y, x2: toEdge.x, y2: toEdge.y,
            stroke: '#222', 'stroke-width': '1', 'stroke-dasharray': '4 4',
            id: 'radial-' + comp.id, opacity: '0.6'
        });
        line.style.transition = 'stroke 0.5s, opacity 0.5s, stroke-dasharray 0.5s, stroke-width 0.5s';
        radialG.appendChild(line);
    }

    /* Mesh lines (every pair, edge-to-edge, hidden initially) */
    for (var a = 0; a < 6; a++) {
        for (var b = a + 1; b < 6; b++) {
            var posA = getOrbPos(a);
            var posB = getOrbPos(b);
            var eA = edgePoint(posA.x, posA.y, ORB_R, posB.x, posB.y);
            var eB = edgePoint(posB.x, posB.y, ORB_R, posA.x, posA.y);

            var mline = svgEl('line', {
                x1: eA.x, y1: eA.y, x2: eB.x, y2: eB.y,
                stroke: 'rgba(247,147,26,0.35)', 'stroke-width': '1',
                id: 'mesh-' + components[a].id + '-' + components[b].id,
                'class': 'mesh-line', opacity: '0'
            });
            meshG.appendChild(mline);
        }
    }

    /* Component orbs */
    for (var i = 0; i < 6; i++) {
        var comp = components[i];
        var pos = getOrbPos(i);

        var g = svgEl('g', { id: 'orb-' + comp.id });
        g.style.cursor = 'pointer';
        g.style.transition = 'opacity 0.4s';

        var circle = svgEl('circle', {
            cx: pos.x, cy: pos.y, r: ORB_R,
            fill: 'rgba(15,15,15,0.9)', stroke: '#333', 'stroke-width': '1.5',
            id: 'circle-' + comp.id
        });
        circle.style.transition = 'stroke 0.4s, fill 0.4s, stroke-width 0.3s';
        g.appendChild(circle);

        var textLines = comp.shortName.split('\n');
        for (var li = 0; li < textLines.length; li++) {
            var txt = svgEl('text', {
                x: pos.x,
                y: pos.y + (li - (textLines.length - 1) / 2) * 14,
                'text-anchor': 'middle', 'dominant-baseline': 'central',
                fill: '#999', 'font-family': "'Outfit', sans-serif",
                'font-size': '11', 'font-weight': '600',
                'letter-spacing': '0.03em', 'class': 'orb-label',
                id: 'label-' + comp.id + '-' + li
            });
            txt.style.transition = 'fill 0.4s';
            txt.style.pointerEvents = 'none';
            txt.textContent = textLines[li];
            g.appendChild(txt);
        }

        var hit = svgEl('circle', {
            cx: pos.x, cy: pos.y, r: ORB_R + 8,
            fill: 'transparent', 'data-id': comp.id
        });
        hit.addEventListener('click', onOrbClick);
        hit.addEventListener('mouseenter', onOrbEnter);
        hit.addEventListener('mouseleave', onOrbLeave);
        g.appendChild(hit);

        orbsG.appendChild(g);
    }
}

/* ═══════════════════════════════════════════════
   INTERACTION
   ═══════════════════════════════════════════════ */
function onOrbClick(e) {
    var id = e.target.getAttribute('data-id');

    if (isRemovalMode) {
        handleRemoval(id);
        return;
    }

    // Mark as explored
    explored[id] = true;
    activeId = id;

    // Highlight this orb (persistent)
    styleExploredOrb(id, true);

    // Re-style all previously explored orbs (non-active get dimmer highlight)
    for (var k in explored) {
        if (explored[k] && k !== id) {
            styleExploredOrb(k, false);
        }
    }

    // Update progress
    updateProgress();

    // Show panel
    var comp = findComp(id);
    showExplorePanel(comp);

    // Check completion
    if (exploredCount() === 6 && !isComplete) {
        triggerCompletion();
    }
}

function onOrbEnter(e) {
    var id = e.target.getAttribute('data-id');
    if (explored[id] || removedId === id) return;
    var circle = document.getElementById('circle-' + id);
    circle.setAttribute('stroke', '#555');
    circle.setAttribute('stroke-width', '2');
}

function onOrbLeave(e) {
    var id = e.target.getAttribute('data-id');
    if (explored[id] || removedId === id) return;
    var circle = document.getElementById('circle-' + id);
    circle.setAttribute('stroke', '#333');
    circle.setAttribute('stroke-width', '1.5');
}

function styleExploredOrb(id, isActive) {
    var circle = document.getElementById('circle-' + id);
    var labels = document.querySelectorAll('#orb-' + id + ' .orb-label');
    var radial = document.getElementById('radial-' + id);

    if (isActive) {
        circle.setAttribute('stroke', '#F7931A');
        circle.setAttribute('stroke-width', '2.5');
        circle.setAttribute('fill', 'rgba(247,147,26,0.06)');
        circle.style.filter = 'url(#glow)';
        for (var i = 0; i < labels.length; i++) labels[i].setAttribute('fill', '#F7931A');
        radial.setAttribute('stroke', 'rgba(247,147,26,0.5)');
        radial.setAttribute('stroke-dasharray', 'none');
        radial.setAttribute('opacity', '1');
        radial.setAttribute('stroke-width', '1.5');
    } else {
        // Previously explored: softer persistent highlight
        circle.setAttribute('stroke', 'rgba(247,147,26,0.6)');
        circle.setAttribute('stroke-width', '1.8');
        circle.setAttribute('fill', 'rgba(247,147,26,0.03)');
        circle.style.filter = 'none';
        for (var i = 0; i < labels.length; i++) labels[i].setAttribute('fill', 'rgba(247,147,26,0.7)');
        radial.setAttribute('stroke', 'rgba(247,147,26,0.3)');
        radial.setAttribute('stroke-dasharray', 'none');
        radial.setAttribute('opacity', '0.8');
        radial.setAttribute('stroke-width', '1');
    }
}

function updateProgress() {
    var count = exploredCount();
    document.getElementById('progressFill').style.width = (count / 6 * 100) + '%';
    document.getElementById('progressCount').textContent = count;
    var resetBtn = document.getElementById('resetBtn');
    if (count > 0) {
        resetBtn.classList.add('show');
    } else {
        resetBtn.classList.remove('show');
    }
}

/* ═══════════════════════════════════════════════
   COMPLETION: Mesh lights up
   ═══════════════════════════════════════════════ */
function triggerCompletion() {
    isComplete = true;

    // Activate all mesh lines with staggered animation
    var meshLines = document.querySelectorAll('.mesh-line');
    for (var i = 0; i < meshLines.length; i++) {
        (function(line, delay) {
            setTimeout(function() {
                line.style.animationDelay = '0s';
                line.classList.add('active');
            }, delay);
        })(meshLines[i], i * 60);
    }

    // Light up core after mesh draws
    setTimeout(function() {
        activateCore();
        showCompletionPanel();
        isRemovalMode = true;

        // Add living pulse to the completed circuit
        startCircuitPulse();
    }, meshLines.length * 60 + 400);

    // Make all explored orbs fully bright
    for (var i = 0; i < components.length; i++) {
        styleExploredOrb(components[i].id, true);
        // Remove the extra-bright "active" glow, keep all equal
        var circle = document.getElementById('circle-' + components[i].id);
        circle.style.filter = 'url(#glow-soft)';
    }
}

function activateCore() {
    var ring = document.getElementById('core-ring');
    var fill = document.getElementById('core-fill');
    var txtBtc = document.getElementById('core-text-btc');
    var txtSym = document.getElementById('core-text-sym');
    var ambient = document.getElementById('core-ambient');

    ring.setAttribute('stroke', '#F7931A');
    ring.setAttribute('stroke-width', '2.5');
    ring.setAttribute('opacity', '1');
    ring.style.filter = 'url(#glow)';
    ring.style.transition = 'all 0.6s ease';

    fill.setAttribute('fill', 'rgba(247,147,26,0.06)');
    fill.style.transition = 'fill 0.6s ease';

    txtBtc.setAttribute('fill', '#F7931A');
    txtBtc.style.transition = 'fill 0.6s ease';

    txtSym.setAttribute('fill', 'rgba(247,147,26,0.7)');
    txtSym.style.transition = 'fill 0.6s ease';

    ambient.setAttribute('fill', 'url(#coreGradActive)');
    ambient.setAttribute('opacity', '0.8');
    ambient.style.transition = 'opacity 0.6s ease';
}

function deactivateCore() {
    var ring = document.getElementById('core-ring');
    var fill = document.getElementById('core-fill');
    var txtBtc = document.getElementById('core-text-btc');
    var txtSym = document.getElementById('core-text-sym');
    var ambient = document.getElementById('core-ambient');

    ring.setAttribute('stroke', '#333');
    ring.setAttribute('stroke-width', '2');
    ring.setAttribute('opacity', '0.6');
    ring.style.filter = 'none';

    fill.setAttribute('fill', 'rgba(15,15,15,0.8)');
    txtBtc.setAttribute('fill', '#555');
    txtSym.setAttribute('fill', '#444');
    ambient.setAttribute('fill', 'url(#coreGrad)');
    ambient.setAttribute('opacity', '0.5');
}

function startCircuitPulse() {
    // Mesh lines: lock drawn state, remove draw animation, then pulse
    var meshLines = document.querySelectorAll('.mesh-line.active');
    for (var i = 0; i < meshLines.length; i++) {
        meshLines[i].style.strokeDashoffset = '0';
        meshLines[i].style.opacity = '1';
        meshLines[i].style.strokeDasharray = 'none';
        meshLines[i].classList.remove('active');
        meshLines[i].classList.add('mesh-alive');
    }
    // Orb circles pulse
    for (var i = 0; i < components.length; i++) {
        var circle = document.getElementById('circle-' + components[i].id);
        circle.style.filter = '';
        circle.classList.add('circuit-alive');
    }
    // Core ring pulse
    var coreRing = document.getElementById('core-ring');
    coreRing.style.filter = '';
    coreRing.classList.add('circuit-alive');
    // Radial lines pulse
    for (var i = 0; i < components.length; i++) {
        var radial = document.getElementById('radial-' + components[i].id);
        radial.classList.add('mesh-alive');
    }
}

function stopCircuitPulse() {
    var meshLines = document.querySelectorAll('.mesh-alive');
    for (var i = 0; i < meshLines.length; i++) meshLines[i].classList.remove('mesh-alive');
    var alive = document.querySelectorAll('.circuit-alive');
    for (var i = 0; i < alive.length; i++) alive[i].classList.remove('circuit-alive');
}

/* ═══════════════════════════════════════════════
   REMOVAL MODE (post-completion)
   ═══════════════════════════════════════════════ */
function handleRemoval(id) {
    if (removedId === id) {
        // Restore (clicking the same removed component toggles it back)
        restoreFromRemoval();
        showCompletionPanel();
        return;
    }

    // If another component is already removed, restore it first
    // This ensures only one component is removed at a time,
    // reinforcing that ANY single removal breaks the system
    if (removedId !== null) {
        restoreFromRemoval();
    }

    // Remove a component
    removedId = id;
    var comp = findComp(id);

    // Stop the living pulse — circuit is broken
    stopCircuitPulse();
    // Dim the removed orb
    var circle = document.getElementById('circle-' + id);
    circle.setAttribute('stroke', '#e74c3c');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('stroke-dasharray', '6 4');
    circle.setAttribute('fill', 'rgba(231,76,60,0.04)');
    circle.style.filter = 'none';
    document.getElementById('orb-' + id).style.opacity = '0.5';

    var labels = document.querySelectorAll('#orb-' + id + ' .orb-label');
    for (var i = 0; i < labels.length; i++) labels[i].setAttribute('fill', 'rgba(231,76,60,0.5)');

    // Dim radial line
    var radial = document.getElementById('radial-' + id);
    radial.setAttribute('stroke', 'rgba(231,76,60,0.3)');
    radial.setAttribute('stroke-dasharray', '3 6');
    radial.setAttribute('opacity', '0.4');

    // Dim mesh lines involving this component
    for (var j = 0; j < components.length; j++) {
        if (components[j].id === id) continue;
        var meshId1 = 'mesh-' + id + '-' + components[j].id;
        var meshId2 = 'mesh-' + components[j].id + '-' + id;
        var mel = document.getElementById(meshId1) || document.getElementById(meshId2);
        if (mel) {
            mel.setAttribute('stroke', 'rgba(231,76,60,0.15)');
            mel.setAttribute('stroke-dasharray', '3 6');
            mel.style.opacity = '0.3';
        }
    }

    // Deactivate core (circuit broken)
    deactivateCore();

    // Dim the other orbs slightly to show system weakened
    for (var k = 0; k < components.length; k++) {
        if (components[k].id === id) continue;
        var otherCircle = document.getElementById('circle-' + components[k].id);
        otherCircle.setAttribute('stroke', 'rgba(247,147,26,0.35)');
        otherCircle.setAttribute('fill', 'rgba(247,147,26,0.02)');
        otherCircle.style.filter = 'none';
    }

    showRemovalPanel(comp);
}

function restoreFromRemoval() {
    removedId = null;

    // Restore all orbs to completed state
    for (var i = 0; i < components.length; i++) {
        var c = components[i];
        var circle = document.getElementById('circle-' + c.id);
        circle.setAttribute('stroke', 'rgba(247,147,26,0.8)');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('stroke-dasharray', 'none');
        circle.setAttribute('fill', 'rgba(247,147,26,0.04)');
        circle.style.filter = 'url(#glow-soft)';
        document.getElementById('orb-' + c.id).style.opacity = '1';

        var labels = document.querySelectorAll('#orb-' + c.id + ' .orb-label');
        for (var j = 0; j < labels.length; j++) labels[j].setAttribute('fill', 'rgba(247,147,26,0.8)');

        var radial = document.getElementById('radial-' + c.id);
        radial.setAttribute('stroke', 'rgba(247,147,26,0.4)');
        radial.setAttribute('stroke-dasharray', 'none');
        radial.setAttribute('opacity', '0.9');
        radial.setAttribute('stroke-width', '1.2');
    }

    // Restore mesh lines
    var meshLines = document.querySelectorAll('.mesh-line');
    for (var m = 0; m < meshLines.length; m++) {
        meshLines[m].setAttribute('stroke', 'rgba(247,147,26,0.35)');
        meshLines[m].setAttribute('stroke-dasharray', 'none');
        meshLines[m].style.opacity = '1';
    }

    // Re-activate core
    activateCore();

    // Restart the living pulse — circuit restored
    startCircuitPulse();
}

/* ═══════════════════════════════════════════════
   PANELS
   ═══════════════════════════════════════════════ */
function showExplorePanel(comp) {
    var panel = document.getElementById('infoPanel');
    var defaultEl = document.getElementById('panelDefault');
    var contentEl = document.getElementById('panelContent');

    panel.classList.remove('removal-mode', 'complete-mode');
    defaultEl.style.display = 'none';
    contentEl.style.display = 'block';

    var html = '';
    html += '<div class="concept-tag">' + comp.tagline + '</div>';
    html += '<div class="concept-name">' + comp.name + '</div>';
    html += '<div class="concept-desc">' + comp.desc + '</div>';
    if (comp.firstBadge) {
        html += '<div class="first-badge">\u26A1 ' + comp.firstBadge + '</div>';
    }
    html += '<div class="concept-deeper">';
    html += '<button class="deeper-toggle" onclick="toggleDeeper(this)">Go deeper \u2192</button>';
    html += '<div class="deeper-content">' + comp.deeper + '</div>';
    html += '</div>';

    contentEl.innerHTML = html;
    animatePanel(contentEl);
}

function showCompletionPanel() {
    var panel = document.getElementById('infoPanel');
    var defaultEl = document.getElementById('panelDefault');
    var contentEl = document.getElementById('panelContent');

    panel.classList.remove('removal-mode');
    panel.classList.add('complete-mode');
    defaultEl.style.display = 'none';
    contentEl.style.display = 'block';

    var html = '<div class="completion-panel">';
    html += '<div class="complete-title">The Circuit Is Complete</div>';
    html += '<div class="complete-desc">Six components, each borrowed from decades of prior work, synthesized into something none could achieve alone. The mesh you see represents total interdependence \u2014 every component relies on every other. This is not a system with redundancy. It is irreducible.</div>';
    html += '<div style="margin-bottom:16px; font-size:0.85rem; line-height:1.65; color:#bbb;">As Adam Back (inventor of Hashcash, cited in the Bitcoin whitepaper) explains: any deviation from this design necessarily introduces a compromise greater than the supposed benefit. The parameters aren\u2019t arbitrary \u2014 they\u2019re in equilibrium. <a href="https://x.com/LastCoinStandng/status/1714789695622955431" target="_blank" rel="noopener" style="color:#F7931A; text-decoration:underline; text-underline-offset:2px;">Watch the 2-minute summary \u2192</a></div>';
    html += '<div class="try-removal"><strong>Now try removing one.</strong> Click any component to break the circuit and see exactly what collapses \u2014 and why nothing less than the full synthesis could work.</div>';
    html += '</div>';

    contentEl.innerHTML = html;
    animatePanel(contentEl);
}

function showRemovalPanel(comp) {
    var panel = document.getElementById('infoPanel');
    var defaultEl = document.getElementById('panelDefault');
    var contentEl = document.getElementById('panelContent');

    panel.classList.add('removal-mode');
    panel.classList.remove('complete-mode');
    defaultEl.style.display = 'none';
    contentEl.style.display = 'block';

    var html = '';
    html += '<div class="concept-tag removal">Without this component</div>';
    html += '<div class="concept-name removal">' + comp.name + ' Removed</div>';
    html += '<div class="concept-desc">' + comp.removal + '</div>';
    html += '<div class="removal-verdict">';
    html += '<div class="verdict-label">\u26A0 ' + comp.verdictLabel + '</div>';
    html += '<div class="verdict-text">The system becomes fundamentally untenable. This is not a degradation \u2014 it is a collapse of the core guarantee.</div>';
    html += '</div>';

    contentEl.innerHTML = html;
    animatePanel(contentEl);
}

function showDefaultPanel() {
    var panel = document.getElementById('infoPanel');
    var defaultEl = document.getElementById('panelDefault');
    var contentEl = document.getElementById('panelContent');
    panel.classList.remove('removal-mode', 'complete-mode');
    defaultEl.style.display = 'block';
    contentEl.style.display = 'none';
}

function animatePanel(el) {
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = 'fadeUp 0.35s ease';
}

function toggleDeeper(btn) {
    var content = btn.nextElementSibling;
    if (content.classList.contains('show')) {
        content.classList.remove('show');
        btn.textContent = 'Go deeper \u2192';
    } else {
        content.classList.add('show');
        btn.textContent = '\u2190 Less detail';
    }
}

/* ═══════════════════════════════════════════════
   RESET
   ═══════════════════════════════════════════════ */
function resetAll() {
    explored = {};
    activeId = null;
    isComplete = false;
    isRemovalMode = false;
    removedId = null;

    // Reset all orbs
    for (var i = 0; i < components.length; i++) {
        var c = components[i];
        var circle = document.getElementById('circle-' + c.id);
        circle.setAttribute('stroke', '#333');
        circle.setAttribute('stroke-width', '1.5');
        circle.setAttribute('fill', 'rgba(15,15,15,0.9)');
        circle.setAttribute('stroke-dasharray', 'none');
        circle.style.filter = 'none';
        document.getElementById('orb-' + c.id).style.opacity = '1';

        var labels = document.querySelectorAll('#orb-' + c.id + ' .orb-label');
        for (var j = 0; j < labels.length; j++) labels[j].setAttribute('fill', '#999');

        var radial = document.getElementById('radial-' + c.id);
        radial.setAttribute('stroke', '#222');
        radial.setAttribute('stroke-width', '1');
        radial.setAttribute('stroke-dasharray', '4 4');
        radial.setAttribute('opacity', '0.6');
    }

    // Reset mesh lines - clone and replace to fully reset animation state
    var meshLines = document.querySelectorAll('.mesh-line');
    for (var m = 0; m < meshLines.length; m++) {
        var ml = meshLines[m];
        ml.classList.remove('active');
        ml.style.animation = 'none';
        ml.style.opacity = '0';
        ml.setAttribute('stroke', 'rgba(247,147,26,0.35)');
        ml.setAttribute('stroke-width', '1');
        ml.setAttribute('stroke-dasharray', '300');
        ml.setAttribute('stroke-dashoffset', '300');
        // Force reflow to reset animation state
        void ml.offsetWidth;
        ml.style.animation = '';
    }

    // Reset core
    deactivateCore();

    // Reset progress
    updateProgress();
    showDefaultPanel();
}

/* ═══════════════════════════════════════════════
   PRECURSORS
   ═══════════════════════════════════════════════ */
function buildPrecursors() {
    var grid = document.getElementById('precursorGrid');
    var html = '';
    for (var i = 0; i < precursors.length; i++) {
        var p = precursors[i];
        html += '<div class="precursor-card">';
        html += '<div class="precursor-year">' + p.year + ' \u00B7 ' + p.creator + '</div>';
        html += '<div class="precursor-name">' + p.name + '</div>';
        html += '<div class="precursor-contrib">' + p.contribution + '</div>';
        html += '<div class="precursor-flaw"><strong>Fatal flaw: </strong>' + p.flaw + '</div>';
        html += '</div>';
    }
    grid.innerHTML = html;
}

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */
buildSVG();
buildPrecursors();


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
