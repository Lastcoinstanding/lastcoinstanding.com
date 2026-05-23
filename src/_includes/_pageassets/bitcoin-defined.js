/* ═══════════════════════════════════════════════════════════════════════════
   Bitcoin Defined — sentence-as-navigation carousel
   ───────────────────────────────────────────────────────────────────────────
   Single card slot that swaps content in place. The sticky sentence at the
   top is both progress indicator and navigation — each of the 8 words is
   clickable. State is { currentIndex, visited }. URL hash mirrors the
   current word so `/bitcoin-defined#decentralized` deep-links into that
   card. The final-state section reveals when all 8 words have been visited.

   Pattern documented in STYLE_GUIDE §6.x (TODO) — sentence-as-nav for
   sequential editorial content with N components.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── DATA ───
   Each word has a real Grok-generated image (Network through Bounded by
   Energy), plus an inline SVG used as fallback for Absolutely Scarce until
   the matching image is generated. When the moon image is dropped in,
   change image: null to image: '/bd-absolutely-scarce.jpg'. */
var bdWords = [
    {
        id: 'network',
        label: 'Network',
        eyebrow: 'Word 1 of 8',
        image: '/bd-network.jpg',
        alt: 'A flock of sandhill cranes standing in shallow reflective water at sunset, some flying overhead — many distinct individuals forming a single coordinated whole.',
        definition: 'A network is not a thing; it is a relationship between things. Bitcoin is the persistent agreement among tens of thousands of nodes, millions of wallets, and the global community of people who hold, run, and transact on the same shared ledger.',
        elaboration: '<p>Calling Bitcoin an asset misses what it actually is. The asset only exists because the network does &mdash; the bitcoin you hold is meaningful only as a recognized entry on a ledger that millions of unrelated parties agree upon, and converge upon.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g stroke="#F7931A" stroke-width="0.8" fill="none" opacity="0.55"><line x1="40" y1="50" x2="100" y2="80"/><line x1="100" y1="80" x2="160" y2="55"/><line x1="40" y1="50" x2="60" y2="130"/><line x1="100" y1="80" x2="60" y2="130"/><line x1="100" y1="80" x2="140" y2="135"/><line x1="160" y1="55" x2="140" y2="135"/><line x1="60" y1="130" x2="90" y2="170"/><line x1="140" y1="135" x2="90" y2="170"/><line x1="40" y1="50" x2="160" y2="55"/><line x1="100" y1="80" x2="90" y2="170"/></g><g fill="#F7931A"><circle cx="40" cy="50" r="4"/><circle cx="100" cy="80" r="5"/><circle cx="160" cy="55" r="4"/><circle cx="60" cy="130" r="4"/><circle cx="140" cy="135" r="4"/><circle cx="90" cy="170" r="3.5"/></g></svg>'
    },
    {
        id: 'open',
        label: 'Open',
        eyebrow: 'Word 2 of 8',
        image: '/bd-open.jpg',
        alt: 'A natural sea arch at sunset over the ocean — sunlight passing through an opening formed by elemental forces, not gatekept.',
        definition: 'The source code is open. The protocol\u2019s rules are visible. The full transaction history is auditable &mdash; by anyone, indefinitely. No proprietary layers, no closed components, no privileged participants who own the system or sit above its rules.',
        elaboration: '<p>Closed systems require trust in their operators; open systems require only that you can read. The radical move is not just publishing the code &mdash; it is making the entire apparatus inspectable, forever, by anyone with curiosity and time. No one owns the protocol. No one is elevated above it.</p><p>This is how a system earns credibility, confidence, and assurance. The reader does not have to take anyone\u2019s word. The playing field is, structurally, level &mdash; and every claim Bitcoin makes about itself is checkable from first principles.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#F7931A" stroke-width="1.2" opacity="0.7"><path d="M 50 170 L 50 90 Q 50 50 100 50 Q 150 50 150 90 L 150 170"/></g><g stroke="#F7931A" stroke-width="0.6" opacity="0.35"><line x1="50" y1="170" x2="150" y2="170"/></g><g fill="#F7931A" opacity="0.85"><circle cx="100" cy="50" r="2"/></g><g stroke="#F7931A" stroke-width="0.4" opacity="0.25"><line x1="100" y1="170" x2="100" y2="55"/></g></svg>'
    },
    {
        id: 'permissionless',
        label: 'Permissionless',
        eyebrow: 'Word 3 of 8',
        image: '/bd-permissionless.jpg',
        alt: 'A dirt path winding through tall grasslands at sunset — open access in any direction, no gatekeeper, no toll, worn by use rather than centrally planned.',
        definition: 'Open lets you read the system. Permissionless lets you join it &mdash; anywhere, anytime, no application, no approval, no identity check. Anyone, at their own discretion alone, can run a node, mine, hold, send, or build. Bitcoin is, in this sense, both global and borderless.',
        elaboration: '<p>The protocol has no gatekeeper because it has no central party that could be one. This is a different category of access than even the open internet, where platforms, payment rails, and ISPs still mediate participation.</p><p>Bitcoin\u2019s permissionless quality is closer to gravity than to a service. It does not ask who you are or where you are from before it works for you, in the exact same way it works for anyone else on the network. For most of human history, monetary participation has been conditioned on someone\u2019s permission. This is the first money for which that is no longer true &mdash; the first where the right to participate is structural, equal, and not given to be taken away.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bd-road" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#F7931A" stop-opacity="0.7"/><stop offset="100%" stop-color="#F7931A" stop-opacity="0.05"/></linearGradient></defs><path d="M 60 180 L 90 60 L 110 60 L 140 180 Z" fill="url(#bd-road)"/><g stroke="#F7931A" stroke-width="0.8" opacity="0.6"><line x1="100" y1="170" x2="100" y2="155" stroke-dasharray="2,3"/><line x1="100" y1="140" x2="100" y2="125" stroke-dasharray="2,3"/><line x1="100" y1="110" x2="100" y2="98" stroke-dasharray="1.5,2.5"/><line x1="100" y1="83" x2="100" y2="75" stroke-dasharray="1,2"/></g><circle cx="100" cy="55" r="1.5" fill="#F7931A" opacity="0.8"/></svg>'
    },
    {
        id: 'decentralized',
        label: 'Decentralized',
        eyebrow: 'Word 4 of 8',
        image: '/bd-decentralized.jpg',
        alt: 'An olive grove at golden hour — ancient gnarled trees, each with its own individual character, distributed across the landscape, none dominant.',
        definition: 'No single party &mdash; no founder, no company, no government, no consortium &mdash; can change the rules, freeze the ledger, or shut the network down. Authority is dispersed across the participants, none of whom hold special power.',
        elaboration: '<p>The blockchain trilemma is real: decentralization, scalability, and security cannot all be maximized at once. Bitcoin chose decentralization and security, accepting limited base-layer throughput as the trade. This is not an oversight. This is the entire point.</p><p>Decentralization is what makes the protocol resilient against the most dangerous attack of all: capture by those who would change it. The system\u2019s strongest defense is that there is no one in charge to be co-opted.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g fill="#F7931A" opacity="0.75"><circle cx="50" cy="55" r="3.5"/><circle cx="100" cy="40" r="3"/><circle cx="155" cy="60" r="3.5"/><circle cx="35" cy="105" r="3"/><circle cx="80" cy="95" r="2.5"/><circle cx="125" cy="105" r="3"/><circle cx="170" cy="115" r="2.5"/><circle cx="55" cy="145" r="3"/><circle cx="105" cy="155" r="3.5"/><circle cx="150" cy="145" r="3"/><circle cx="75" cy="175" r="2.5"/><circle cx="135" cy="175" r="2.5"/></g><g stroke="#F7931A" stroke-width="0.3" opacity="0.18"><line x1="50" y1="55" x2="100" y2="40"/><line x1="100" y1="40" x2="155" y2="60"/><line x1="50" y1="55" x2="80" y2="95"/><line x1="155" y1="60" x2="125" y2="105"/><line x1="80" y1="95" x2="125" y2="105"/><line x1="35" y1="105" x2="55" y2="145"/><line x1="170" y1="115" x2="150" y2="145"/><line x1="55" y1="145" x2="105" y2="155"/><line x1="105" y1="155" x2="150" y2="145"/><line x1="75" y1="175" x2="135" y2="175"/></g></svg>'
    },
    {
        id: 'secure',
        label: 'Secure',
        eyebrow: 'Word 5 of 8',
        image: '/bd-secure.jpg',
        alt: 'A massive stratified rock cliff at sunset — layer upon layer of accumulated geological time, immutable by individual action.',
        definition: 'Bitcoin\u2019s security is not a wall but an economic gradient &mdash; the cost of attacking the network must always exceed the cost of participating honestly. The longer the chain grows, the more expensive every past block becomes to attack.',
        elaboration: '<p>Proof-of-work makes this concrete. Billions of dollars of mining hardware and electricity are continuously expended to extend the chain, and any attacker would need to outspend that cumulative cost to rewrite history.</p><p>Security in this sense is not a static property but a continuous expenditure, refreshed every ten minutes. Every block buried under another block is another block that becomes more expensive, again, to rewrite. The past hardens.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g fill="#F7931A"><rect x="40" y="155" width="120" height="22" rx="2" opacity="0.75"/><rect x="46" y="128" width="108" height="20" rx="2" opacity="0.62"/><rect x="52" y="103" width="96" height="18" rx="2" opacity="0.5"/><rect x="58" y="80" width="84" height="16" rx="2" opacity="0.38"/><rect x="64" y="60" width="72" height="14" rx="2" opacity="0.28"/><rect x="70" y="43" width="60" height="12" rx="2" opacity="0.2"/></g><g stroke="#F7931A" stroke-width="0.3" opacity="0.15"><line x1="40" y1="153" x2="160" y2="153"/><line x1="46" y1="126" x2="154" y2="126"/><line x1="52" y1="101" x2="148" y2="101"/></g></svg>'
    },
    {
        id: 'protocol',
        label: 'Protocol',
        eyebrow: 'Word 6 of 8',
        image: '/bd-protocol.jpg',
        alt: 'A Roman aqueduct at sunset, identical arches repeating into the distance — engineering that persists across centuries, carrying something reliably.',
        definition: 'Bitcoin is a protocol, not a product, not a company, not a technology in the conventional sense. A protocol is a set of agreed-upon rules &mdash; TCP/IP is a protocol; HTTP is a protocol; SMTP is a protocol. None has a CEO. None has a headquarters.',
        elaboration: '<p>This distinction is load-bearing. Companies can be acquired, regulated, dissolved. Protocols, once widely adopted, become a kind of public infrastructure &mdash; older than the institutions built on top of them, more durable than any of their participants.</p><p>Bitcoin\u2019s protocol is something else still: a universal language of value. For the first time, every person on earth has access to the same monetary grammar &mdash; the same rules for storing, transferring, and recognizing economic energy. Borders, currencies, intermediaries become optional. What the internet did for words, this protocol does for value &mdash; it makes it fluent across the entire human species.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g stroke="#F7931A" fill="none"><path d="M 30 175 L 95 60" stroke-width="1.4" opacity="0.7"/><path d="M 170 175 L 105 60" stroke-width="1.4" opacity="0.7"/></g><g stroke="#F7931A" stroke-width="0.6" opacity="0.4"><line x1="40" y1="165" x2="160" y2="165"/><line x1="55" y1="140" x2="145" y2="140"/><line x1="68" y1="118" x2="132" y2="118"/><line x1="78" y1="100" x2="122" y2="100"/><line x1="86" y1="86" x2="114" y2="86"/><line x1="92" y1="74" x2="108" y2="74"/></g><circle cx="100" cy="60" r="2.5" fill="#F7931A" opacity="0.85"/></svg>'
    },
    {
        id: 'bounded-by-energy',
        label: 'Bounded by energy',
        eyebrow: 'Word 7 of 8',
        image: '/bd-bounded-by-energy.jpg',
        alt: 'A bed of glowing embers on wooden planks with a small live flame at center — past work crystallized into structure, present work still expending.',
        definition: 'To create new bitcoin, you must expend real-world energy. Not metaphorical effort, not promised work &mdash; measured, verifiable joules. The protocol calibrates difficulty so this expenditure stays high, regardless of how efficient the hardware becomes.',
        elaboration: '<p>This binding to thermodynamics is what makes bitcoin\u2019s issuance impossible to fake and its supply curve impossible to game. Fiat money has no such binding; it is created with a keystroke, and every new unit silently dilutes the worth of every existing one. Economic energy you have already earned and stored is extracted from you, slowly and without your consent, by anyone with access to that keystroke.</p><p>Bitcoin is the first money in the digital era whose existence is physically expensive. The cost is not a side effect &mdash; it is the proof that the system is honest; theft is no longer tolerated. And because no one can issue more by decree, the energy you store in bitcoin stays yours. It cannot be quietly taken back.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bd-flame" cx="50%" cy="65%" r="55%"><stop offset="0%" stop-color="#F7931A" stop-opacity="0.85"/><stop offset="55%" stop-color="#F7931A" stop-opacity="0.45"/><stop offset="100%" stop-color="#F7931A" stop-opacity="0"/></radialGradient></defs><path d="M 100 35 Q 78 75 80 110 Q 81 145 100 165 Q 119 145 120 110 Q 122 75 100 35 Z" fill="url(#bd-flame)"/><path d="M 100 60 Q 90 90 92 115 Q 93 140 100 152 Q 107 140 108 115 Q 110 90 100 60 Z" fill="#F7931A" opacity="0.45"/><path d="M 100 85 Q 96 105 98 122 Q 99 138 100 145 Q 101 138 102 122 Q 104 105 100 85 Z" fill="#F7931A" opacity="0.7"/></svg>'
    },
    {
        id: 'absolutely-scarce',
        label: 'Absolutely scarce',
        eyebrow: 'Word 8 of 8',
        image: null,  // pending Grok generation — moon over dark sea
        alt: 'A single luminous moon over a calm dark sea — singular, eternal, impossible to mint another.',
        definition: 'Most things called scarce are actually rate-limited. Gold is scarce because new gold is hard to extract \u2014 but the total stock grows. Bitcoin\u2019s scarcity is different in kind: 21 million units, and not one more, ever.',
        elaboration: '<p>The cap is enforced not by promise but by code that every node independently verifies. This is the first asset in human history with a mathematically provable, absolutely fixed supply. Once issued, no committee can vote to issue more; no emergency can authorize an exception.</p><p>Demand can rise without limit. Supply cannot. This asymmetry, sustained over decades, is what makes the math of Bitcoin\u2019s monetary properties unlike anything the human species has ever held.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bd-sphere" cx="38%" cy="38%" r="65%"><stop offset="0%" stop-color="#F7931A" stop-opacity="0.95"/><stop offset="70%" stop-color="#F7931A" stop-opacity="0.55"/><stop offset="100%" stop-color="#F7931A" stop-opacity="0.2"/></radialGradient></defs><g opacity="0.18"><circle cx="100" cy="100" r="75" fill="none" stroke="#F7931A" stroke-width="0.5"/><circle cx="100" cy="100" r="55" fill="none" stroke="#F7931A" stroke-width="0.5"/></g><circle cx="100" cy="100" r="32" fill="url(#bd-sphere)"/><g opacity="0.65"><circle cx="35" cy="40" r="0.8" fill="#F7931A"/><circle cx="165" cy="55" r="0.6" fill="#F7931A"/><circle cx="170" cy="155" r="0.7" fill="#F7931A"/><circle cx="25" cy="170" r="0.6" fill="#F7931A"/><circle cx="50" cy="155" r="0.5" fill="#F7931A"/><circle cx="160" cy="35" r="0.5" fill="#F7931A"/></g><text x="100" y="106" text-anchor="middle" fill="#0a0908" font-family="Inter, sans-serif" font-size="12" font-weight="600" opacity="0.55">21M</text></svg>'
    }
];

/* ─── STATE ─── */
/* currentIndex: which word is showing (0..7)
   visited: Set of word indices the user has visited (current word is always
            in this set). Drives the sentence-word highlighting and the
            progress counter. */
var bdState = {
    currentIndex: 0,
    visited: {}  // using object-as-set for older-browser friendliness
};

/* ─── HELPERS ─── */
function bdVisitedCount() {
    var n = 0;
    for (var k in bdState.visited) if (Object.prototype.hasOwnProperty.call(bdState.visited, k)) n++;
    return n;
}

function bdWordIdToIndex(id) {
    for (var i = 0; i < bdWords.length; i++) if (bdWords[i].id === id) return i;
    return -1;
}

function bdParseHash() {
    var h = (window.location.hash || '').replace(/^#/, '');
    if (!h) return -1;
    return bdWordIdToIndex(h);
}

function bdWriteHash(index) {
    if (!window.history || !window.history.replaceState) return;
    var newHash = '#' + bdWords[index].id;
    if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
    }
}

/* ─── RENDER: current word into the card slot ─── */
function bdRenderCurrent() {
    var w = bdWords[bdState.currentIndex];
    if (!w) return;

    var imageEl   = document.getElementById('bdCardImage');
    var eyebrowEl = document.getElementById('bdCardEyebrow');
    var wordEl    = document.getElementById('bdCardWord');
    var defEl     = document.getElementById('bdCardDefinition');
    var elabEl    = document.getElementById('bdCardElaboration');

    if (imageEl) {
        if (w.image) {
            imageEl.innerHTML = '<img src="' + w.image + '" alt="' + (w.alt || '') + '" loading="eager">';
            imageEl.classList.add('bd-card-image-with-photo');
        } else {
            imageEl.innerHTML = w.svg;
            imageEl.classList.remove('bd-card-image-with-photo');
        }
    }
    if (eyebrowEl) eyebrowEl.textContent = w.eyebrow;
    if (wordEl)    wordEl.textContent    = w.label;
    if (defEl)     defEl.innerHTML       = w.definition;
    if (elabEl)    elabEl.innerHTML      = w.elaboration;

    /* Nav button enabled/disabled state */
    var prev = document.getElementById('bdPrev');
    var next = document.getElementById('bdNext');
    if (prev) prev.disabled = bdState.currentIndex === 0;
    if (next) {
        if (bdState.currentIndex === bdWords.length - 1) {
            next.querySelector('.bd-nav-btn-label').textContent = 'Complete';
            next.querySelector('.bd-nav-btn-arrow').innerHTML   = '&#10003;';
        } else {
            next.querySelector('.bd-nav-btn-label').textContent = 'Continue';
            next.querySelector('.bd-nav-btn-arrow').innerHTML   = '&rarr;';
        }
    }

    /* Counter mid-nav reads "Word X of 8" */
    var counter = document.getElementById('bdCounter');
    if (counter) counter.textContent = 'Word ' + (bdState.currentIndex + 1) + ' of ' + bdWords.length;
}

/* ─── RENDER: sticky-sentence word states + progress + final reveal ─── */
function bdRenderSentenceAndProgress() {
    var sentence = document.getElementById('bdStickySentence');
    if (sentence) {
        var sentenceWords = sentence.querySelectorAll('.bd-word');
        for (var j = 0; j < sentenceWords.length; j++) {
            sentenceWords[j].classList.remove('bd-active', 'bd-revealed');
            if (j === bdState.currentIndex) {
                sentenceWords[j].classList.add('bd-active');
            }
            if (bdState.visited[j]) {
                sentenceWords[j].classList.add('bd-revealed');
            }
        }
    }

    var visitedCount = bdVisitedCount();
    var count = document.getElementById('bdProgressCount');
    if (count) count.textContent = visitedCount;
    var progress = document.getElementById('bdProgress');
    if (progress) progress.classList.toggle('bd-progress-complete', visitedCount === bdWords.length);

    /* Final reveal section: shown once user has visited all 8 */
    var finalSection = document.getElementById('bdFinal');
    if (visitedCount === bdWords.length) {
        if (sentence) sentence.classList.add('bd-complete');
        if (finalSection) finalSection.classList.add('bd-final-active');
    } else {
        if (sentence) sentence.classList.remove('bd-complete');
        if (finalSection) finalSection.classList.remove('bd-final-active');
    }

    /* Reset button: only show after at least 2 words have been visited
       (don't tease it when there's nothing to reset). */
    var resetWrap = document.getElementById('bdResetWrap');
    if (resetWrap) resetWrap.style.display = visitedCount >= 2 ? '' : 'none';
}

/* ─── NAVIGATION ─── */
function bdGoto(index, options) {
    options = options || {};
    if (index < 0 || index >= bdWords.length) return;
    if (index === bdState.currentIndex && !options.force) return;

    /* Fade out current content, swap, fade in */
    var card = document.getElementById('bdCard');
    if (card && !options.skipAnimation) {
        card.classList.add('bd-swapping');
        setTimeout(function() {
            bdState.currentIndex = index;
            bdState.visited[index] = true;
            bdRenderCurrent();
            bdRenderSentenceAndProgress();
            bdWriteHash(index);
            card.classList.remove('bd-swapping');
        }, 180);
    } else {
        bdState.currentIndex = index;
        bdState.visited[index] = true;
        bdRenderCurrent();
        bdRenderSentenceAndProgress();
        bdWriteHash(index);
    }
}

function bdNext() {
    if (bdState.currentIndex < bdWords.length - 1) {
        bdGoto(bdState.currentIndex + 1);
    } else {
        /* On the last word, "Complete" just marks it visited (no advance).
           If user clicks again with all 8 visited, scroll to final section. */
        bdState.visited[bdState.currentIndex] = true;
        bdRenderSentenceAndProgress();
        if (bdVisitedCount() === bdWords.length) {
            setTimeout(function() {
                var fin = document.getElementById('bdFinal');
                if (fin) fin.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }
}

function bdPrev() {
    if (bdState.currentIndex > 0) bdGoto(bdState.currentIndex - 1);
}

function bdReset() {
    bdState.visited = {};
    bdState.visited[0] = true;
    bdGoto(0, { force: true });
}

/* ─── EVENT BINDING ─── */
function bdBindEvents() {
    /* Sticky-sentence word clicks: any word becomes nav. The .bd-word spans
       in the markup already have data-word="<id>" attributes. */
    var sentence = document.getElementById('bdStickySentence');
    if (sentence) {
        sentence.addEventListener('click', function(e) {
            var word = e.target.closest('.bd-word');
            if (!word) return;
            var id = word.getAttribute('data-word');
            var idx = bdWordIdToIndex(id);
            if (idx >= 0) bdGoto(idx);
        });
        /* Keyboard activation for sentence words (Enter/Space) — they each
           have tabindex set in the markup. */
        sentence.addEventListener('keydown', function(e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            var word = e.target.closest('.bd-word');
            if (!word) return;
            e.preventDefault();
            var id = word.getAttribute('data-word');
            var idx = bdWordIdToIndex(id);
            if (idx >= 0) bdGoto(idx);
        });
    }

    /* Prev / Next / Reset button clicks */
    var prev = document.getElementById('bdPrev');
    var next = document.getElementById('bdNext');
    var reset = document.getElementById('bdReset');
    if (prev)  prev.addEventListener('click', bdPrev);
    if (next)  next.addEventListener('click', bdNext);
    if (reset) reset.addEventListener('click', bdReset);

    /* Global arrow-key navigation. Don't intercept when user is typing in
       an input or interacting with a button via Space/Enter. */
    document.addEventListener('keydown', function(e) {
        var tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key === 'ArrowRight') { e.preventDefault(); bdNext(); }
        else if (e.key === 'ArrowLeft')  { e.preventDefault(); bdPrev(); }
    });

    /* External hash changes (e.g., back/forward button) */
    window.addEventListener('hashchange', function() {
        var idx = bdParseHash();
        if (idx >= 0 && idx !== bdState.currentIndex) {
            bdGoto(idx, { skipAnimation: true });
        }
    });
}

/* ─── INIT ─── */
function bdInit() {
    /* Initial word: URL hash if valid, otherwise word 0 */
    var startIdx = bdParseHash();
    if (startIdx < 0) startIdx = 0;
    bdState.currentIndex = startIdx;
    bdState.visited[startIdx] = true;

    bdRenderCurrent();
    bdRenderSentenceAndProgress();
    bdBindEvents();

    /* If we landed via a hash deep-link, scroll the card into view so the
       receiver isn't staring at the page header. */
    if (window.location.hash) {
        setTimeout(function() {
            var card = document.getElementById('bdCard');
            if (card) {
                var rect = card.getBoundingClientRect();
                if (rect.top < 50 || rect.top > window.innerHeight - 200) {
                    var sticky = document.querySelector('.bd-sticky-wrap');
                    var offset = (sticky ? sticky.offsetHeight : 80) + 65 + 20;
                    window.scrollTo({ top: window.scrollY + rect.top - offset, behavior: 'smooth' });
                }
            }
        }, 80);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bdInit);
} else {
    bdInit();
}
