



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
