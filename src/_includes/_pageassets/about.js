
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
