



// Insight Carousel — category tabs (Featured default) + subset cycling.
//
// Loading and motion (2026-10-29, SITE_GUIDE §13 "Loading and motion"):
//   - Nothing downloads until the carousel nears the viewport. Posters live in
//     data-poster and are set on the active slide and the next one only once the
//     carousel is within PRIME_MARGIN of the screen (every slide is rendered at
//     opacity 0, so a poster attribute in the markup would fetch all of them).
//   - A clip plays only while the slides are on screen and the browser tab is
//     visible; it pauses when either stops being true, so auto-advance never
//     fetches clips nobody is watching.
//   - The pause control (#insightPause) stops the clip and auto-advance until the
//     reader presses it again. prefers-reduced-motion and Save-Data start paused:
//     the reader sees the posters and can press play.
(function() {
    var allSlides = Array.prototype.slice.call(document.querySelectorAll('.insight-slide'));
    var dotsContainer = document.getElementById('insightDots');
    var slidesEl = document.getElementById('insightSlides');
    var prevBtn = document.getElementById('insightPrev');
    var nextBtn = document.getElementById('insightNext');
    var pauseBtn = document.getElementById('insightPause');
    var tabsEl = document.getElementById('insightTabs');
    if (!allSlides.length || !dotsContainer) return;

    var slides = [];          // active subset for the current tab
    var current = 0;          // index within `slides`
    var autoPlay = true;      // auto-advance; manual navigation turns it off (the clip then loops)

    var PRIME_MARGIN = '300px 0px';  // posters may load once the carousel is this close
    var PLAY_RATIO = 0.3;            // share of the slides area on screen before a clip plays

    var reduceMotion = false;
    try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var saveData = !!(navigator.connection && navigator.connection.saveData);
    var paused = reduceMotion || saveData;   // the reader's pause state
    var primed = false;    // near the viewport: posters may load
    var onScreen = false;  // enough of the slides area is visible to play

    function videoOf(slide) { return slide ? slide.querySelector('video.carousel-video') : null; }

    function setPoster(slide) {
        var vid = videoOf(slide);
        if (vid && vid.dataset.poster && !vid.getAttribute('poster')) vid.setAttribute('poster', vid.dataset.poster);
    }

    // The active slide's poster, and the next one's so the cross-fade lands on a picture.
    function primePosters() {
        if (!primed || !slides.length) return;
        setPoster(slides[current]);
        setPoster(slides[(current + 1) % slides.length]);
    }

    function canPlay() { return onScreen && !paused && !document.hidden; }

    function subsetFor(tab) {
        var list = (tab === 'featured')
            ? allSlides.filter(function(s) { return s.dataset.feat === '1'; })
            : allSlides.filter(function(s) { return s.dataset.cat === tab; });
        return list.length ? list : allSlides;
    }

    function pauseCurrent() {
        if (!slides.length) return;
        var vid = videoOf(slides[current]);
        if (vid) { vid.ontimeupdate = null; vid.loop = false; vid.pause(); }
    }

    function buildDots() {
        dotsContainer.innerHTML = '';
        slides.forEach(function(_, i) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'insight-dot' + (i === current ? ' active' : '');
            dot.setAttribute('aria-label', 'Slide ' + (i + 1));
            if (i === current) dot.setAttribute('aria-current', 'true');
            dot.addEventListener('click', function() { stopAuto(); goTo(i); });
            dotsContainer.appendChild(dot);
        });
    }

    function attachVideo(vid) {
        if (!vid) return;
        vid.loop = false;
        vid.ontimeupdate = function() {
            if (!vid.duration) return;
            // Intercept 1.2s before end so the cross-fade begins while the
            // outgoing video is still playing — no freeze, no end-flash.
            if (vid.currentTime >= vid.duration - 1.2) {
                vid.ontimeupdate = null;
                if (autoPlay && !paused) { goTo((current + 1) % slides.length); }
            }
        };
    }

    // Play the active slide's clip if the reader can see it and hasn't paused;
    // otherwise make sure it is stopped. `fromStart` is true for a newly shown slide.
    function playCurrent(fromStart) {
        var vid = videoOf(slides[current]);
        if (!vid) return;
        if (!canPlay()) { vid.ontimeupdate = null; vid.pause(); return; }
        // load() only on an element that has never fetched; calling it while a
        // fetch is in flight (NETWORK_LOADING) would restart the download.
        if (vid.readyState === 0 && vid.networkState !== 2) { vid.load(); }
        if (fromStart) vid.currentTime = 0;
        if (autoPlay) { attachVideo(vid); } else { vid.ontimeupdate = null; vid.loop = true; }
        var p = vid.play();
        if (p && p.catch) p.catch(function(){});
    }

    function activate(n) {
        current = n;
        slides[current].classList.add('active');
        var dot = dotsContainer.children[current];
        if (dot) { dot.classList.add('active'); dot.setAttribute('aria-current', 'true'); }
        primePosters();
        playCurrent(true);
    }

    function goTo(n) {
        pauseCurrent();
        slides[current].classList.remove('active');
        var dot = dotsContainer.children[current];
        if (dot) { dot.classList.remove('active'); dot.removeAttribute('aria-current'); }
        activate(n);
    }

    function setTab(tab) {
        pauseCurrent();
        allSlides.forEach(function(s) { s.classList.remove('active'); });
        slides = subsetFor(tab);
        // Random start within the subset — same freshness mechanism as before,
        // now scoped to the chosen tab (deterministic tab, varied entry point).
        current = Math.floor(Math.random() * slides.length);
        buildDots();
        activate(current);
        if (tabsEl) {
            Array.prototype.forEach.call(tabsEl.querySelectorAll('.insight-tab'), function(b) {
                var on = b.dataset.tab === tab;
                b.classList.toggle('active', on);
                b.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }
    }

    function next() { goTo((current + 1) % slides.length); }
    function prev() { goTo((current - 1 + slides.length) % slides.length); }

    function stopAuto() {
        autoPlay = false;
        var vid = videoOf(slides[current]);
        if (vid) { vid.ontimeupdate = null; vid.loop = true; }
    }

    function renderPause() {
        if (!pauseBtn) return;
        var label = paused ? 'Play the slideshow' : 'Pause the slideshow';
        pauseBtn.setAttribute('aria-label', label);
        pauseBtn.setAttribute('title', label);
        pauseBtn.classList.toggle('is-paused', paused);
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { stopAuto(); prev(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { stopAuto(); next(); });
    if (pauseBtn) {
        pauseBtn.addEventListener('click', function() {
            paused = !paused;
            renderPause();
            if (paused) { pauseCurrent(); } else { primed = true; primePosters(); playCurrent(false); }
        });
    }
    if (tabsEl) {
        Array.prototype.forEach.call(tabsEl.querySelectorAll('.insight-tab'), function(b) {
            b.addEventListener('click', function() { setTab(b.dataset.tab); });
        });
    }

    // Make the whole slide surface clickable — visitors can click the
    // video, title, or subtitle (not just the CTA button) to navigate.
    allSlides.forEach(function(slide) {
        var cta = slide.querySelector('a.insight-cta');
        if (!cta) return;
        var href = cta.getAttribute('href');
        slide.style.cursor = 'pointer';
        slide.addEventListener('click', function(e) {
            if (e.target.closest('a')) return;
            window.location.href = href;
        });
    });

    // Boot: Featured is the deterministic default tab every session. Nothing
    // plays or loads yet: the observers below decide when the carousel is near.
    renderPause();
    setTab('featured');

    var target = slidesEl || dotsContainer.parentNode;
    if ('IntersectionObserver' in window && target) {
        new IntersectionObserver(function(entries) {
            if (entries[entries.length - 1].isIntersecting && !primed) { primed = true; primePosters(); }
        }, { rootMargin: PRIME_MARGIN }).observe(target);
        new IntersectionObserver(function(entries) {
            var e = entries[entries.length - 1];
            onScreen = e.isIntersecting && e.intersectionRatio >= PLAY_RATIO;
            if (onScreen) { primed = true; primePosters(); }
            playCurrent(false);
        }, { threshold: [0, PLAY_RATIO] }).observe(target);
    } else {
        // No IntersectionObserver: behave as before, playing from boot.
        primed = true;
        onScreen = true;
        primePosters();
        playCurrent(false);
    }
    document.addEventListener('visibilitychange', function() { playCurrent(false); });
})();
