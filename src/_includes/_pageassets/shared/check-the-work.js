/* Check the work: the sitewide treatment (shared/check-the-work.css).
   Helpers for pages that keep their own audit table: the "What went in"
   strip, and the two export buttons' behaviour. The real-estate ledger
   (real-estate-ledger.js) renders the same markup itself. */
(function(){
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  // items: [[label, value], ...]. Build them from the scenario the engine ran, never from the DOM.
  function inputsHtml(items){
    return '<div class="re-ledger-inputs"><div class="re-ledger-sub">What went in</div><dl>' +
      items.map(function(m){ return '<div><dt>' + esc(m[0]) + '</dt><dd>' + esc(m[1]) + '</dd></div>'; }).join('') + '</dl></div>';
  }
  function download(text, filename){
    var blob = new Blob([text], { type: 'text/csv' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
  }
  function copy(text, btn){
    var html = btn.innerHTML, done = function(){ btn.classList.add('copied'); btn.textContent = 'Copied \u2713'; setTimeout(function(){ btn.classList.remove('copied'); btn.innerHTML = html; }, 1500); };
    var fallback = function(){ var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); done(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback); else fallback();
  }
  window.CheckTheWork = { inputsHtml: inputsHtml, download: download, copy: copy };
})();
