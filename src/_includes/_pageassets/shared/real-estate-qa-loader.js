/* rePairQA loader — the real-estate pair's byte-identity harness loads only
   when the URL carries ?qa, so ordinary visitors never download it.
   The harness (shared/real-estate-qa.js) is passthrough-copied to
   /qa/real-estate-qa.js (.eleventy.js); _headers marks /qa/* noindex.
   Usage: open /bitcoin-vs-real-estate?qa or /bitcoin-vs-rental-property?qa,
   then run `await rePairQA.all()` in the console. */
(function(){
  if (!/[?&]qa(?:[=&]|$)/.test(location.search)) return;
  var s = document.createElement('script');
  s.src = '/qa/real-estate-qa.js';
  s.onload = function(){ console.log('rePairQA loaded: await rePairQA.all()  ·  run()  ·  booksCheck()  ·  parityCheck()  ·  taxParityCheck()'); };
  s.onerror = function(){ console.error('rePairQA: /qa/real-estate-qa.js failed to load'); };
  document.head.appendChild(s);
})();
