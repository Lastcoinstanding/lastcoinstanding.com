
(function() {
    var hamburger = document.getElementById('hamburger');
    var overlay = document.getElementById('mobileOverlay');
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('open');
        overlay.classList.toggle('show');
        document.body.style.overflow = overlay.classList.contains('show') ? 'hidden' : '';
    });
    var overlayLinks = overlay.querySelectorAll('a');
    for (var i = 0; i < overlayLinks.length; i++) {
        overlayLinks[i].addEventListener('click', function() {
            hamburger.classList.remove('open');
            overlay.classList.remove('show');
            document.body.style.overflow = '';
        });
    }
})();


// Insight Carousel
(function() {
    var slides = document.querySelectorAll('.insight-slide');
    var dotsContainer = document.getElementById('insightDots');
    var prevBtn = document.getElementById('insightPrev');
    var nextBtn = document.getElementById('insightNext');
    if (!slides.length || !dotsContainer) return;

    var current = 0;
    var autoPlay = true;
    var advanceTimer = null;

    slides.forEach(function(_, i) {
        var dot = document.createElement('button');
        dot.className = 'insight-dot' + (i === 0 ? ' active' : '');
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

    var firstVid = slides[0].querySelector('video.carousel-video');
    if (firstVid) {
        firstVid.load();
        attachVideo(firstVid);
        firstVid.play().catch(function(){});
    }
})();
