/* ═══════════════════════════════════════════════════════════════════════════
   Bitcoin Defined — interaction layer
   The 8 word cards are rendered from the data array below into the #bdCards
   container, ordered, with only the first active. Each card's Continue button
   advances the active state by one. The sticky sentence at the top stays in
   sync — the active word pulses, revealed words light up amber. After all 8
   are revealed, the final-state section fades in.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── DATA ─── */
/* Each card carries the word's display label, eyebrow ("Word 3 of 8"), the
   short definitional sentence (in Cormorant serif), the longer elaboration
   (1-2 paragraphs in Inter), and an inline SVG placeholder that gets
   displayed in the image slot until a real Grok Imagine still is dropped in.
   The SVGs are intentionally abstract and amber-on-warm — they're meant to
   read as 'the visual concept of this word' rather than illustrative. */

var bdWords = [
    {
        id: 'network',
        label: 'Network',
        eyebrow: 'Word 1 of 8',
        definition: 'A network is not a thing; it is a relationship between things. Bitcoin is the persistent agreement among tens of thousands of nodes, millions of wallets, and the global community of people who hold, run, and transact on the same shared ledger.',
        elaboration: '<p>Calling Bitcoin an asset misses what it actually is. The asset only exists because the network does &mdash; the bitcoin you hold is meaningful only as a recognized entry on a ledger that millions of unrelated parties agree upon, and converge upon.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g stroke="#F7931A" stroke-width="0.8" fill="none" opacity="0.55"><line x1="40" y1="50" x2="100" y2="80"/><line x1="100" y1="80" x2="160" y2="55"/><line x1="40" y1="50" x2="60" y2="130"/><line x1="100" y1="80" x2="60" y2="130"/><line x1="100" y1="80" x2="140" y2="135"/><line x1="160" y1="55" x2="140" y2="135"/><line x1="60" y1="130" x2="90" y2="170"/><line x1="140" y1="135" x2="90" y2="170"/><line x1="40" y1="50" x2="160" y2="55"/><line x1="100" y1="80" x2="90" y2="170"/></g><g fill="#F7931A"><circle cx="40" cy="50" r="4"/><circle cx="100" cy="80" r="5"/><circle cx="160" cy="55" r="4"/><circle cx="60" cy="130" r="4"/><circle cx="140" cy="135" r="4"/><circle cx="90" cy="170" r="3.5"/></g></svg>'
    },
    {
        id: 'open',
        label: 'Open',
        eyebrow: 'Word 2 of 8',
        definition: 'The source code is open. The protocol\u2019s rules are visible. The full transaction history is auditable &mdash; by anyone, indefinitely. No proprietary layers, no closed components, no privileged participants who own the system or sit above its rules.',
        elaboration: '<p>Closed systems require trust in their operators; open systems require only that you can read. The radical move is not just publishing the code &mdash; it is making the entire apparatus inspectable, forever, by anyone with curiosity and time. No one owns the protocol. No one is elevated above it.</p><p>This is how a system earns credibility, confidence, and assurance. The reader does not have to take anyone\u2019s word. The playing field is, structurally, level &mdash; and every claim Bitcoin makes about itself is checkable from first principles.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#F7931A" stroke-width="1.2" opacity="0.7"><path d="M 50 170 L 50 90 Q 50 50 100 50 Q 150 50 150 90 L 150 170"/></g><g stroke="#F7931A" stroke-width="0.6" opacity="0.35"><line x1="50" y1="170" x2="150" y2="170"/></g><g fill="#F7931A" opacity="0.85"><circle cx="100" cy="50" r="2"/></g><g stroke="#F7931A" stroke-width="0.4" opacity="0.25"><line x1="100" y1="170" x2="100" y2="55"/></g></svg>'
    },
    {
        id: 'permissionless',
        label: 'Permissionless',
        eyebrow: 'Word 3 of 8',
        definition: 'Open lets you read the system. Permissionless lets you join it &mdash; anywhere, anytime, no application, no approval, no identity check. Anyone, at their own discretion alone, can run a node, mine, hold, send, or build. Bitcoin is, in this sense, both global and borderless.',
        elaboration: '<p>The protocol has no gatekeeper because it has no central party that could be one. This is a different category of access than even the open internet, where platforms, payment rails, and ISPs still mediate participation.</p><p>Bitcoin\u2019s permissionless quality is closer to gravity than to a service. It does not ask who you are or where you are from before it works for you, in the exact same way it works for anyone else on the network. For most of human history, monetary participation has been conditioned on someone\u2019s permission. This is the first money for which that is no longer true &mdash; the first where the right to participate is structural, equal, and not given to be taken away.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bd-road" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stop-color="#F7931A" stop-opacity="0.7"/><stop offset="100%" stop-color="#F7931A" stop-opacity="0.05"/></linearGradient></defs><path d="M 60 180 L 90 60 L 110 60 L 140 180 Z" fill="url(#bd-road)"/><g stroke="#F7931A" stroke-width="0.8" opacity="0.6"><line x1="100" y1="170" x2="100" y2="155" stroke-dasharray="2,3"/><line x1="100" y1="140" x2="100" y2="125" stroke-dasharray="2,3"/><line x1="100" y1="110" x2="100" y2="98" stroke-dasharray="1.5,2.5"/><line x1="100" y1="83" x2="100" y2="75" stroke-dasharray="1,2"/></g><circle cx="100" cy="55" r="1.5" fill="#F7931A" opacity="0.8"/></svg>'
    },
    {
        id: 'decentralized',
        label: 'Decentralized',
        eyebrow: 'Word 4 of 8',
        definition: 'No single party &mdash; no founder, no company, no government, no consortium &mdash; can change the rules, freeze the ledger, or shut the network down. Authority is dispersed across the participants, none of whom hold special power.',
        elaboration: '<p>The blockchain trilemma is real: decentralization, scalability, and security cannot all be maximized at once. Bitcoin chose decentralization and security, accepting limited base-layer throughput as the trade. This is not an oversight. This is the entire point.</p><p>Decentralization is what makes the protocol resilient against the most dangerous attack of all: capture by those who would change it. The system\u2019s strongest defense is that there is no one in charge to be co-opted.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g fill="#F7931A" opacity="0.75"><circle cx="50" cy="55" r="3.5"/><circle cx="100" cy="40" r="3"/><circle cx="155" cy="60" r="3.5"/><circle cx="35" cy="105" r="3"/><circle cx="80" cy="95" r="2.5"/><circle cx="125" cy="105" r="3"/><circle cx="170" cy="115" r="2.5"/><circle cx="55" cy="145" r="3"/><circle cx="105" cy="155" r="3.5"/><circle cx="150" cy="145" r="3"/><circle cx="75" cy="175" r="2.5"/><circle cx="135" cy="175" r="2.5"/></g><g stroke="#F7931A" stroke-width="0.3" opacity="0.18"><line x1="50" y1="55" x2="100" y2="40"/><line x1="100" y1="40" x2="155" y2="60"/><line x1="50" y1="55" x2="80" y2="95"/><line x1="155" y1="60" x2="125" y2="105"/><line x1="80" y1="95" x2="125" y2="105"/><line x1="35" y1="105" x2="55" y2="145"/><line x1="170" y1="115" x2="150" y2="145"/><line x1="55" y1="145" x2="105" y2="155"/><line x1="105" y1="155" x2="150" y2="145"/><line x1="75" y1="175" x2="135" y2="175"/></g></svg>'
    },
    {
        id: 'secure',
        label: 'Secure',
        eyebrow: 'Word 5 of 8',
        definition: 'Bitcoin\u2019s security is not a wall but an economic gradient &mdash; the cost of attacking the network must always exceed the cost of participating honestly. The longer the chain grows, the more expensive every past block becomes to attack.',
        elaboration: '<p>Proof-of-work makes this concrete. Billions of dollars of mining hardware and electricity are continuously expended to extend the chain, and any attacker would need to outspend that cumulative cost to rewrite history.</p><p>Security in this sense is not a static property but a continuous expenditure, refreshed every ten minutes. Every block buried under another block is another block that becomes more expensive, again, to rewrite. The past hardens.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g fill="#F7931A"><rect x="40" y="155" width="120" height="22" rx="2" opacity="0.75"/><rect x="46" y="128" width="108" height="20" rx="2" opacity="0.62"/><rect x="52" y="103" width="96" height="18" rx="2" opacity="0.5"/><rect x="58" y="80" width="84" height="16" rx="2" opacity="0.38"/><rect x="64" y="60" width="72" height="14" rx="2" opacity="0.28"/><rect x="70" y="43" width="60" height="12" rx="2" opacity="0.2"/></g><g stroke="#F7931A" stroke-width="0.3" opacity="0.15"><line x1="40" y1="153" x2="160" y2="153"/><line x1="46" y1="126" x2="154" y2="126"/><line x1="52" y1="101" x2="148" y2="101"/></g></svg>'
    },
    {
        id: 'protocol',
        label: 'Protocol',
        eyebrow: 'Word 6 of 8',
        definition: 'Bitcoin is a protocol, not a product, not a company, not a technology in the conventional sense. A protocol is a set of agreed-upon rules &mdash; TCP/IP is a protocol; HTTP is a protocol; SMTP is a protocol. None has a CEO. None has a headquarters.',
        elaboration: '<p>This distinction is load-bearing. Companies can be acquired, regulated, dissolved. Protocols, once widely adopted, become a kind of public infrastructure &mdash; older than the institutions built on top of them, more durable than any of their participants.</p><p>Bitcoin\u2019s protocol is something else still: a universal language of value. For the first time, every person on earth has access to the same monetary grammar &mdash; the same rules for storing, transferring, and recognizing economic energy. Borders, currencies, intermediaries become optional. What the internet did for words, this protocol does for value &mdash; it makes it fluent across the entire human species.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g stroke="#F7931A" fill="none"><path d="M 30 175 L 95 60" stroke-width="1.4" opacity="0.7"/><path d="M 170 175 L 105 60" stroke-width="1.4" opacity="0.7"/></g><g stroke="#F7931A" stroke-width="0.6" opacity="0.4"><line x1="40" y1="165" x2="160" y2="165"/><line x1="55" y1="140" x2="145" y2="140"/><line x1="68" y1="118" x2="132" y2="118"/><line x1="78" y1="100" x2="122" y2="100"/><line x1="86" y1="86" x2="114" y2="86"/><line x1="92" y1="74" x2="108" y2="74"/></g><circle cx="100" cy="60" r="2.5" fill="#F7931A" opacity="0.85"/></svg>'
    },
    {
        id: 'bounded-by-energy',
        label: 'Bounded by energy',
        eyebrow: 'Word 7 of 8',
        definition: 'To create new bitcoin, you must expend real-world energy. Not metaphorical effort, not promised work &mdash; measured, verifiable joules. The protocol calibrates difficulty so this expenditure stays high, regardless of how efficient the hardware becomes.',
        elaboration: '<p>This binding to thermodynamics is what makes bitcoin\u2019s issuance impossible to fake and its supply curve impossible to game. Fiat money has no such binding; it is created with a keystroke, and every new unit silently dilutes the worth of every existing one. Economic energy you have already earned and stored is extracted from you, slowly and without your consent, by anyone with access to that keystroke.</p><p>Bitcoin is the first money in the digital era whose existence is physically expensive. The cost is not a side effect &mdash; it is the proof that the system is honest; theft is no longer tolerated. And because no one can issue more by decree, the energy you store in bitcoin stays yours. It cannot be quietly taken back.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bd-flame" cx="50%" cy="65%" r="55%"><stop offset="0%" stop-color="#F7931A" stop-opacity="0.85"/><stop offset="55%" stop-color="#F7931A" stop-opacity="0.45"/><stop offset="100%" stop-color="#F7931A" stop-opacity="0"/></radialGradient></defs><path d="M 100 35 Q 78 75 80 110 Q 81 145 100 165 Q 119 145 120 110 Q 122 75 100 35 Z" fill="url(#bd-flame)"/><path d="M 100 60 Q 90 90 92 115 Q 93 140 100 152 Q 107 140 108 115 Q 110 90 100 60 Z" fill="#F7931A" opacity="0.45"/><path d="M 100 85 Q 96 105 98 122 Q 99 138 100 145 Q 101 138 102 122 Q 104 105 100 85 Z" fill="#F7931A" opacity="0.7"/></svg>'
    },
    {
        id: 'absolutely-scarce',
        label: 'Absolutely scarce',
        eyebrow: 'Word 8 of 8',
        definition: 'Most things called scarce are actually rate-limited. Gold is scarce because new gold is hard to extract \u2014 but the total stock grows. Bitcoin\u2019s scarcity is different in kind: 21 million units, and not one more, ever.',
        elaboration: '<p>The cap is enforced not by promise but by code that every node independently verifies. This is the first asset in human history with a mathematically provable, absolutely fixed supply. Once issued, no committee can vote to issue more; no emergency can authorize an exception.</p><p>Demand can rise without limit. Supply cannot. This asymmetry, sustained over decades, is what makes the math of Bitcoin\u2019s monetary properties unlike anything the human species has ever held.</p>',
        svg: '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bd-sphere" cx="38%" cy="38%" r="65%"><stop offset="0%" stop-color="#F7931A" stop-opacity="0.95"/><stop offset="70%" stop-color="#F7931A" stop-opacity="0.55"/><stop offset="100%" stop-color="#F7931A" stop-opacity="0.2"/></radialGradient></defs><g opacity="0.18"><circle cx="100" cy="100" r="75" fill="none" stroke="#F7931A" stroke-width="0.5"/><circle cx="100" cy="100" r="55" fill="none" stroke="#F7931A" stroke-width="0.5"/></g><circle cx="100" cy="100" r="32" fill="url(#bd-sphere)"/><g opacity="0.65"><circle cx="35" cy="40" r="0.8" fill="#F7931A"/><circle cx="165" cy="55" r="0.6" fill="#F7931A"/><circle cx="170" cy="155" r="0.7" fill="#F7931A"/><circle cx="25" cy="170" r="0.6" fill="#F7931A"/><circle cx="50" cy="155" r="0.5" fill="#F7931A"/><circle cx="160" cy="35" r="0.5" fill="#F7931A"/></g><text x="100" y="106" text-anchor="middle" fill="#0a0908" font-family="Inter, sans-serif" font-size="12" font-weight="600" opacity="0.55">21M</text></svg>'
    }
];

/* ─── STATE ─── */
var bdState = {
    activeIndex: 0,  // which card is currently revealable
    revealedCount: 0 // how many have been clicked through
};

/* ─── RENDER ─── */
function bdRenderCards() {
    var container = document.getElementById('bdCards');
    if (!container) return;
    var html = '';
    for (var i = 0; i < bdWords.length; i++) {
        var w = bdWords[i];
        html += '<article class="bd-card" id="bd-card-' + w.id + '" data-index="' + i + '">' +
            '<div class="bd-card-image">' + w.svg + '</div>' +
            '<p class="bd-card-eyebrow">' + w.eyebrow + '</p>' +
            '<h2 class="bd-card-word">' + w.label + '</h2>' +
            '<p class="bd-card-definition">' + w.definition + '</p>' +
            '<div class="bd-card-elaboration">' + w.elaboration + '</div>' +
            '<div class="bd-card-cta-wrap">' +
            '<span class="bd-card-revealed-marker">Revealed</span>' +
            '<button class="bd-card-cta" data-action="advance" data-index="' + i + '" aria-label="Reveal next word">' +
            (i < bdWords.length - 1 ? 'Continue' : 'Complete') +
            '<span class="bd-card-cta-arrow">' + (i < bdWords.length - 1 ? '&rarr;' : '&#10003;') + '</span>' +
            '</button>' +
            '</div>' +
            '</article>';
    }
    container.innerHTML = html;
}

/* ─── STATE TRANSITIONS ─── */
function bdApplyState() {
    /* Update cards: each is either active, revealed, or pending */
    var cards = document.querySelectorAll('.bd-card');
    for (var i = 0; i < cards.length; i++) {
        cards[i].classList.remove('bd-card-active', 'bd-card-revealed');
        if (i < bdState.revealedCount) {
            cards[i].classList.add('bd-card-revealed');
        } else if (i === bdState.activeIndex && bdState.activeIndex < bdWords.length) {
            cards[i].classList.add('bd-card-active');
        }
    }

    /* Update sticky sentence: each word is revealed, active, or pending */
    var sentence = document.getElementById('bdStickySentence');
    if (sentence) {
        var words = sentence.querySelectorAll('.bd-word');
        for (var j = 0; j < words.length; j++) {
            words[j].classList.remove('bd-active', 'bd-revealed');
            if (j < bdState.revealedCount) {
                words[j].classList.add('bd-revealed');
            } else if (j === bdState.activeIndex && bdState.activeIndex < bdWords.length) {
                words[j].classList.add('bd-active');
            }
        }
    }

    /* Update progress counter */
    var count = document.getElementById('bdProgressCount');
    if (count) count.textContent = bdState.revealedCount;
    var progress = document.getElementById('bdProgress');
    if (progress) progress.classList.toggle('bd-progress-complete', bdState.revealedCount === bdWords.length);

    /* Final state: when all 8 revealed, fade in final section and add 'complete' class to sticky */
    var finalSection = document.getElementById('bdFinal');
    if (bdState.revealedCount === bdWords.length) {
        if (sentence) sentence.classList.add('bd-complete');
        if (finalSection) finalSection.classList.add('bd-final-active');
    } else {
        if (sentence) sentence.classList.remove('bd-complete');
        if (finalSection) finalSection.classList.remove('bd-final-active');
    }
}

/* Smooth-scroll the next card into a comfortable viewport position. Aim for the
   card's top to land just below the sticky sentence (which itself is offset
   below the site nav). Total clearance = nav (65px) + sticky-wrap height + breathing room. */
function bdScrollToCard(index) {
    var card = document.getElementById('bd-card-' + bdWords[index].id);
    if (!card) return;
    var stickyEl = document.querySelector('.bd-sticky-wrap');
    var offset = (stickyEl ? stickyEl.offsetHeight : 80) + 65 + 24;
    var rect = card.getBoundingClientRect();
    var targetY = window.scrollY + rect.top - offset;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
}

function bdAdvance() {
    if (bdState.revealedCount >= bdWords.length) return;
    bdState.revealedCount += 1;
    bdState.activeIndex = bdState.revealedCount;  // next pending becomes active
    bdApplyState();
    /* Scroll to the next card if there is one; otherwise scroll to the final reveal */
    if (bdState.activeIndex < bdWords.length) {
        setTimeout(function() { bdScrollToCard(bdState.activeIndex); }, 120);
    } else {
        setTimeout(function() {
            var fin = document.getElementById('bdFinal');
            if (fin) {
                var rect = fin.getBoundingClientRect();
                var stickyEl = document.querySelector('.bd-sticky-wrap');
                var offset = (stickyEl ? stickyEl.offsetHeight : 80) + 65 + 24;
                window.scrollTo({ top: window.scrollY + rect.top - offset, behavior: 'smooth' });
            }
        }, 320);
    }
}

/* ─── EVENT BINDING ─── */
function bdBindEvents() {
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action="advance"]');
        if (btn) {
            e.preventDefault();
            bdAdvance();
        }
    });

    /* Allow clicking the active word in the sticky sentence to also advance.
       This is the alternate interaction JM mentioned ("click the word"). */
    document.addEventListener('click', function(e) {
        var word = e.target.closest('.bd-word.bd-active');
        if (word) {
            e.preventDefault();
            bdAdvance();
        }
    });

    /* Keyboard: Enter or Space when an active CTA has focus already works via
       native button semantics. Add arrow key shortcut for power users. */
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
            if (document.activeElement && document.activeElement.tagName === 'BUTTON') return;
            if (bdState.revealedCount < bdWords.length) {
                /* Only intercept if the user isn't typing somewhere */
                var tag = document.activeElement && document.activeElement.tagName;
                if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
                    e.preventDefault();
                    bdAdvance();
                }
            }
        }
    });
}

/* ─── INIT ─── */
function bdInit() {
    bdRenderCards();
    bdApplyState();
    bdBindEvents();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bdInit);
} else {
    bdInit();
}
