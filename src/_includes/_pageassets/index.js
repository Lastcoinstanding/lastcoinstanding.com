



// Insight Carousel — category tabs (Featured default) + subset cycling
(function() {
    var allSlides = Array.prototype.slice.call(document.querySelectorAll('.insight-slide'));
    var dotsContainer = document.getElementById('insightDots');
    var prevBtn = document.getElementById('insightPrev');
    var nextBtn = document.getElementById('insightNext');
    var tabsEl = document.getElementById('insightTabs');
    if (!allSlides.length || !dotsContainer) return;

    var slides = [];          // active subset for the current tab
    var current = 0;          // index within `slides`
    var autoPlay = true;
    var advanceTimer = null;

    function subsetFor(tab) {
        var list = (tab === 'featured')
            ? allSlides.filter(function(s) { return s.dataset.feat === '1'; })
            : allSlides.filter(function(s) { return s.dataset.cat === tab; });
        return list.length ? list : allSlides;
    }

    function pauseCurrent() {
        if (!slides.length) return;
        var vid = slides[current] && slides[current].querySelector('video.carousel-video');
        if (vid) { vid.ontimeupdate = null; vid.loop = false; vid.pause(); }
    }

    function buildDots() {
        dotsContainer.innerHTML = '';
        slides.forEach(function(_, i) {
            var dot = document.createElement('button');
            dot.className = 'insight-dot' + (i === current ? ' active' : '');
            dot.setAttribute('aria-label', 'Slide ' + (i + 1));
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
                if (autoPlay) { goTo((current + 1) % slides.length); }
            }
        };
    }

    function activate(n) {
        current = n;
        slides[current].classList.add('active');
        if (dotsContainer.children[current]) dotsContainer.children[current].classList.add('active');
        var vid = slides[current].querySelector('video.carousel-video');
        if (vid) {
            if (vid.readyState === 0) { vid.load(); }
            vid.loop = false;
            vid.currentTime = 0;
            if (autoPlay) { attachVideo(vid); } else { vid.loop = true; }
            vid.play().catch(function(){});
        }
    }

    function goTo(n) {
        if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
        pauseCurrent();
        slides[current].classList.remove('active');
        if (dotsContainer.children[current]) dotsContainer.children[current].classList.remove('active');
        activate(n);
    }

    function setTab(tab) {
        if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
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
                b.classList.toggle('active', b.dataset.tab === tab);
            });
        }
    }

    function next() { goTo((current + 1) % slides.length); }
    function prev() { goTo((current - 1 + slides.length) % slides.length); }

    function stopAuto() {
        autoPlay = false;
        if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
        var vid = slides[current].querySelector('video.carousel-video');
        if (vid) { vid.ontimeupdate = null; vid.loop = true; }
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { stopAuto(); prev(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { stopAuto(); next(); });
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

    // Boot: Featured is the deterministic default tab every session.
    setTab('featured');
})();
