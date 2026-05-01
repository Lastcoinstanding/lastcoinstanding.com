
        // Ember particles
        const emberField = document.getElementById('emberField');
        for (let i = 0; i < 25; i++) {
            const ember = document.createElement('div');
            ember.className = 'ember';
            ember.style.left = Math.random() * 100 + '%';
            ember.style.bottom = Math.random() * 30 + '%';
            ember.style.animationDuration = (4 + Math.random() * 6) + 's';
            ember.style.animationDelay = Math.random() * 8 + 's';
            ember.style.width = (1.5 + Math.random() * 2) + 'px';
            ember.style.height = ember.style.width;
            emberField.appendChild(ember);
        }

        // Progress bar
        const progressBar = document.getElementById('progressBar');
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = progress + '%';
        });

        // Fade-in on scroll
        const fadeEls = document.querySelectorAll('.fade-in');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        fadeEls.forEach(el => observer.observe(el));
    