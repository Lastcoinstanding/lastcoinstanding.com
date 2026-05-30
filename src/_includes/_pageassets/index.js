



// Insight Carousel
(function() {
    var slides = document.querySelectorAll('.insight-slide');
    var dotsContainer = document.getElementById('insightDots');
    var prevBtn = document.getElementById('insightPrev');
    var nextBtn = document.getElementById('insightNext');
    if (!slides.length || !dotsContainer) return;

    // Start on a random slide so returning visitors don't always see
    // the same opening item; cycle order from there is unchanged.
    var current = Math.floor(Math.random() * slides.length);
    var autoPlay = true;
    var advanceTimer = null;

    // The HTML hardcodes .active on slide 0; if random pick is different,
    // swap the active class to the chosen starting slide.
    if (current !== 0) {
        slides[0].classList.remove('active');
        slides[current].classList.add('active');
    }

    slides.forEach(function(_, i) {
        var dot = document.createElement('button');
        dot.className = 'insight-dot' + (i === current ? ' active' : '');
        dot.setAttribute('aria-label', 'Slide ' + (i + 1));
        dot.addEventListener('click', function() { stopAuto(); goTo(i); });
        dotsContainer.appendChild(dot);
    });

    function attachVideo(vid) {
        if (!vid) return;
        vid.loop = false;
        vid.ontimeupdate = function() {
            if (!vid.duration) return;
            // Intercept 1.2s before end so the slide cross-fade begins while
            // the outgoing video is still playing — no freeze, no end-flash.
            if (vid.currentTime >= vid.duration - 1.2) {
                vid.ontimeupdate = null;
                if (autoPlay) {
                    goTo((current + 1) % slides.length);
                }
            }
        };
    }

    function goTo(n) {
        if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }

        var prevVid = slides[current].querySelector('video.carousel-video');
        if (prevVid) {
            prevVid.ontimeupdate = null;
            prevVid.loop = false;
            prevVid.pause();
            // Do NOT rewind here — we want the outgoing video to hold its
            // current frame during the cross-fade. It gets rewound on the
            // way back in (incoming branch sets currentTime = 0 before play).
        }

        slides[current].classList.remove('active');
        dotsContainer.children[current].classList.remove('active');
        current = n;
        slides[current].classList.add('active');
        dotsContainer.children[current].classList.add('active');

        var vid = slides[current].querySelector('video.carousel-video');
        if (vid) {
            if (vid.readyState === 0) { vid.load(); }
            vid.loop = false;
            vid.currentTime = 0;
            if (autoPlay) {
                attachVideo(vid); // intercept near-end for auto advance
            } else {
                vid.loop = true;  // user is manually browsing — loop the video
            }
            vid.play().catch(function(){});
        }
    }

    function next() { goTo((current + 1) % slides.length); }
    function prev() { goTo((current - 1 + slides.length) % slides.length); }

    function stopAuto() {
        autoPlay = false;
        if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
        // Switch current video to loop mode
        var vid = slides[current].querySelector('video.carousel-video');
        if (vid) { vid.ontimeupdate = null; vid.loop = true; }
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { stopAuto(); prev(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { stopAuto(); next(); });

    var firstVid = slides[current].querySelector('video.carousel-video');
    if (firstVid) {
        firstVid.load();
        attachVideo(firstVid);
        firstVid.play().catch(function(){});
    }

    // Make the whole slide surface clickable — visitors can click the
    // video, title, or subtitle (not just the CTA button) to navigate.
    // The visible CTA stays as a wayfinding cue. Arrow buttons and
    // CTA link have their own handlers and aren't intercepted.
    slides.forEach(function(slide) {
        var cta = slide.querySelector('a.insight-cta');
        if (!cta) return;
        var href = cta.getAttribute('href');
        slide.style.cursor = 'pointer';
        slide.addEventListener('click', function(e) {
            // Let nested links (the CTA itself, mostly) handle their own click
            if (e.target.closest('a')) return;
            window.location.href = href;
        });
    });
})();


// ═══════════════════════════════════════════════════════════════════
//  BITCOIN TICKER STRIP
//
//  Slim live data point sitting between the hero and the Recent
//  Updates strip. Single line: ₿ price · ×trend · state → CTA.
//
//  Reads from the shared/power-law-data.js module (TODAY_PRICE,
//  TODAY_DAYS, plPrice, fetchTodayPrice) so the homepage and the four
//  Power Law chart pages all agree on "today" — one source of truth.
//
//  First paint uses the seeded TODAY_PRICE (last PL_DATA monthly
//  sample) so the ticker is NEVER empty, even before the live fetch
//  resolves or if the fetch fails outright. The live fetch then
//  replaces the seed if it succeeds.
//
//  State classifier is the multi-state band model from PL_FLOOR=0.42
//  through trend=1.0 to PL_CEIL=3.0, with band boundaries chosen in
//  log space (midpoints in log between adjacent anchors) so the
//  classification is symmetric around the log-scale channel. Two
//  defensive extreme states ('below floor', 'above ceiling') cover
//  the rare cases where the spot price exceeds the channel — these
//  basically never display in normal market conditions but are
//  preferable to silently showing 'near floor' / 'near ceiling' when
//  the multiplier has actually exited the band.
// ═══════════════════════════════════════════════════════════════════
(function(){
    var priceEl = document.getElementById('tickerPrice');
    var multEl  = document.getElementById('tickerMultiple');
    var stateEl = document.getElementById('tickerState');
    if (!priceEl || !multEl || !stateEl) return;

    function formatPrice(p) {
        if (!isFinite(p) || p <= 0) return '$\u2014';
        if (p >= 1000) return '$' + (p / 1000).toFixed(1) + 'K';
        return '$' + Math.round(p).toLocaleString();
    }

    // Boundaries in log space: midpoints between PL_FLOOR (0.42),
    // trend (1.0), and PL_CEIL (3.0).
    //   log-midpoint(floor, trend)  ≈ 0.648  →  rounded to 0.65
    //   log-midpoint(trend, ceil)   ≈ 1.732  →  rounded to 1.80
    // The 'near-X' bands are the ±15% windows around each anchor.
    function classifyState(m) {
        if (!isFinite(m) || m <= 0) return '\u2014';
        if (m < 0.42) return 'below floor';
        if (m < 0.65) return 'near floor';
        if (m < 0.85) return 'below trend';
        if (m < 1.15) return 'near trend';
        if (m < 1.80) return 'above trend';
        if (m <= 3.0) return 'near ceiling';
        return 'above ceiling';
    }

    function render(price) {
        var trend = (typeof plPrice === 'function' && typeof TODAY_DAYS === 'number')
            ? plPrice(TODAY_DAYS) : null;
        if (!trend || !isFinite(trend) || trend <= 0) {
            priceEl.textContent = formatPrice(price);
            multEl.textContent  = '\u2014';
            stateEl.textContent = '\u2014';
            return;
        }
        var mult = price / trend;
        priceEl.textContent = formatPrice(price);
        multEl.textContent  = mult.toFixed(2) + '\u00d7 trend';
        stateEl.textContent = classifyState(mult);
    }

    // First paint: seeded value from PL_DATA (always present, never
    // empty). The shared module exposes TODAY_PRICE at this point.
    if (typeof TODAY_PRICE === 'number' && TODAY_PRICE > 0) render(TODAY_PRICE);

    // Live fetch: replaces the seed if the call succeeds; falls back
    // silently to the seed if it doesn't. fetchTodayPrice handles
    // both branches via the (price, source) callback.
    if (typeof fetchTodayPrice === 'function') {
        fetchTodayPrice(function(p /*, source */) { render(p); });
    }
})();
