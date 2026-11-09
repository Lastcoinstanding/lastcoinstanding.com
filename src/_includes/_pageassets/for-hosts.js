/* For Podcast Hosts — copy buttons for the two bios.
   Each button names the element it copies (data-copy="<id>"). Uses the
   Clipboard API where present; otherwise selects the text so the reader can
   copy it themselves. The label says what happened for two seconds. */
(function () {
  var btns = document.querySelectorAll('.fh-copy-btn');
  Array.prototype.forEach.call(btns, function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-copy'));
      if (!el) return;
      var text = el.textContent.replace(/\s+/g, ' ').trim();
      function say(msg) {
        btn.textContent = msg;
        setTimeout(function () { btn.textContent = 'Copy'; }, 2000);
      }
      function selectIt() {
        try {
          var r = document.createRange(); r.selectNodeContents(el);
          var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
          say('Selected');
        } catch (e) { /* nothing more to do */ }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { say('Copied'); }, selectIt);
      } else {
        selectIt();
      }
    });
  });
})();
