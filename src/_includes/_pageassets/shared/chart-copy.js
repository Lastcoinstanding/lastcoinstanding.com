/* =============================================================
   chart-copy.js — "Copy chart as image" utility (shared, declarative)

   A small, quiet affordance that lets a reader grab a single chart
   as a self-contained PNG — copied to the clipboard, or downloaded
   if clipboard-image write is blocked (Safari/Firefox). Deliberately
   understated: a low-opacity ghost camera button always present in
   the chart's top-right corner, brightening to full opacity on
   hover/focus and revealing a "Copy image" label. NOT a CTA.

   DECLARATIVE USAGE — mark a chart's wrapper element:
     <div class="chart-wrapper" data-chart-copy
          data-chart-title="Bitcoin & the Power Law — the channel"
          data-chart-filename="bitcoin-power-law-channel.png">
       <canvas id="..."></canvas>
     </div>
   The helper (loaded once, site-wide, from base.njk) scans for
   [data-chart-copy] on load and attaches a button to each, choosing
   the capture method from the wrapper's contents:
     - contains <canvas>  → canvas pixels (Chart.js OR hand-drawn)
     - contains <svg>     → serialize SVG → raster (computed styles inlined)
     - otherwise          → html-to-canvas (lazy-loads html2canvas) — e.g. a
                            CSS-grid heatmap of <div> cells
   Optional attrs: data-chart-bg (export bg, default #111110),
   data-chart-label (hover label, default "Copy image").

   CUSTOM CAPTURE — a page can own the export (e.g. not-a-bubble bakes in
   today's date + live price). Set, before/at load:
     wrapperEl._chartCopyCapture = function(){ return Promise<canvas|Blob>; };
   and the button copies/downloads that as-is (no extra framing).

   Pure ES5 (var/function). Only dependency is the lazily-loaded
   html2canvas, and only for DOM-grid charts.
   ============================================================= */
(function(){
  if (window.ChartCopy) return; // idempotent across includes

  var STYLE_ID = 'chart-copy-css';
  var HTML2CANVAS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  var CAMERA_SVG =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>' +
    '<circle cx="12" cy="13" r="4"/></svg>';
  var CHECK_SVG =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
    'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="20 6 9 17 4 12"/></svg>';

  function injectStyleOnce(){
    if (document.getElementById(STYLE_ID)) return;
    var css =
      '.chart-copy-host{position:relative;}' +
      '.chart-copy-btn{position:absolute;top:8px;right:8px;z-index:6;width:30px;height:30px;' +
        'display:inline-flex;align-items:center;justify-content:center;padding:0;' +
        'background:rgba(17,17,16,0.5);border:1px solid rgba(255,255,255,0.14);border-radius:6px;' +
        'color:rgba(220,214,206,0.9);cursor:pointer;opacity:0.55;' +
        'transition:opacity .2s ease,color .2s,border-color .2s,background .2s;' +
        '-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);}' +
      '.chart-copy-host:hover .chart-copy-btn{opacity:0.82;}' +
      '.chart-copy-btn:hover,.chart-copy-btn:focus-visible,.chart-copy-btn.is-done{opacity:1;}' +
      '.chart-copy-btn:hover{color:#e09422;border-color:rgba(224,148,34,0.4);background:rgba(17,17,16,0.9);}' +
      '.chart-copy-btn:focus-visible{outline:2px solid rgba(224,148,34,0.5);outline-offset:2px;color:#e09422;}' +
      '.chart-copy-btn.is-done{color:#e09422;border-color:rgba(224,148,34,0.45);}' +
      '.chart-copy-btn.is-busy{opacity:1;color:#e09422;}' +
      '.chart-copy-glyph{display:inline-flex;line-height:0;}' +
      '.chart-copy-glyph.spin{animation:chart-copy-spin .7s linear infinite;}' +
      '@keyframes chart-copy-spin{to{transform:rotate(360deg);}}' +
      '.chart-copy-tip{position:absolute;right:calc(100% + 8px);top:50%;transform:translateY(-50%) translateX(4px);' +
        'white-space:nowrap;font:600 11px/1 "Inter",-apple-system,sans-serif;letter-spacing:0.02em;' +
        'color:#e09422;background:rgba(17,17,16,0.96);border:1px solid rgba(224,148,34,0.3);' +
        'border-radius:4px;padding:4px 8px;opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;}' +
      '.chart-copy-btn:hover .chart-copy-tip,.chart-copy-btn:focus-visible .chart-copy-tip,' +
        '.chart-copy-btn.is-done .chart-copy-tip,.chart-copy-btn.is-busy .chart-copy-tip{opacity:1;transform:translateY(-50%) translateX(0);}' +
      '@media print{.chart-copy-btn{display:none;}}';
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  function exportScale(){ return Math.max(2, window.devicePixelRatio || 1); } // export px per CSS px

  // ── Frame a source bitmap onto an opaque dark canvas with a muted
  //    caption (title left, lastcoinstanding.com right), at >= 2x CSS res.
  function buildFramedExport(drawInto, cssW, cssH, title, bg){
    var scale = exportScale();
    var pad   = Math.round(scale * 14);
    var capH  = Math.round(scale * 30);
    var chartW = Math.round(cssW * scale);
    var chartH = Math.round(cssH * scale);
    var W = chartW + pad * 2;
    var H = chartH + pad + capH;

    var off = document.createElement('canvas');
    off.width = W; off.height = H;
    var c = off.getContext('2d');
    c.fillStyle = bg || '#111110';
    c.fillRect(0, 0, W, H);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    drawInto(c, pad, pad, chartW, chartH);        // caller blits the chart here

    var fs = Math.round(scale * 12);
    var cy = pad + chartH + Math.round(capH * 0.55);
    c.textBaseline = 'middle';
    c.font = '500 ' + fs + 'px "Inter", -apple-system, sans-serif';
    if (title) {
      c.textAlign = 'left';
      c.fillStyle = 'rgba(176,168,158,0.72)';
      c.fillText(title, pad, cy);
    }
    c.textAlign = 'right';
    c.fillStyle = 'rgba(224,148,34,0.85)';
    c.fillText('lastcoinstanding.com', W - pad, cy);
    return off;
  }

  // ── Source capture paths. Each resolves to { draw, cssW, cssH } where
  //    draw(ctx,x,y,w,h) blits the chart into the given rect. ──
  function fromCanvas(canvas){
    var cssW = canvas.clientWidth  || Math.round(canvas.width  / (window.devicePixelRatio || 1));
    var cssH = canvas.clientHeight || Math.round(canvas.height / (window.devicePixelRatio || 1));
    return Promise.resolve({
      cssW: cssW, cssH: cssH,
      draw: function(ctx, x, y, w, h){ ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, x, y, w, h); }
    });
  }

  // Inline a whitelist of computed styles so a serialized SVG isn't unstyled.
  var SVG_STYLE_PROPS = ['fill','fill-opacity','stroke','stroke-width','stroke-dasharray',
    'stroke-linecap','stroke-linejoin','opacity','color','font-family','font-size','font-weight',
    'font-style','text-anchor','dominant-baseline','letter-spacing'];
  function inlineSvgStyles(srcRoot, cloneRoot){
    var srcAll = srcRoot.querySelectorAll('*');
    var clAll  = cloneRoot.querySelectorAll('*');
    function apply(srcEl, clEl){
      var cs = window.getComputedStyle(srcEl);
      var decl = '';
      for (var i = 0; i < SVG_STYLE_PROPS.length; i++){
        var p = SVG_STYLE_PROPS[i], v = cs.getPropertyValue(p);
        if (v) decl += p + ':' + v + ';';
      }
      clEl.setAttribute('style', decl + (clEl.getAttribute('style') || ''));
    }
    apply(srcRoot, cloneRoot);
    for (var i = 0; i < srcAll.length && i < clAll.length; i++) apply(srcAll[i], clAll[i]);
  }
  function fromSvg(svg){
    var box = svg.getBoundingClientRect();
    var cssW = box.width, cssH = box.height, scale = exportScale();
    return new Promise(function(resolve, reject){
      var clone = svg.cloneNode(true);
      inlineSvgStyles(svg, clone);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      // Rasterize at 2x: the viewBox keeps coordinates, larger width/height
      // renders the vector crisply at export resolution.
      clone.setAttribute('width', cssW * scale);
      clone.setAttribute('height', cssH * scale);
      var xml = new XMLSerializer().serializeToString(clone);
      var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
      var img = new Image();
      img.onload = function(){
        resolve({ cssW: cssW, cssH: cssH,
          draw: function(ctx, x, y, w, h){ ctx.drawImage(img, x, y, w, h); } });
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function ensureHtml2Canvas(){
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = HTML2CANVAS_SRC;
      s.onload = function(){ resolve(window.html2canvas); };
      s.onerror = function(){ reject(new Error('html2canvas load failed')); };
      document.head.appendChild(s);
    });
  }
  function fromDom(el, bg){
    var box = el.getBoundingClientRect();
    var cssW = box.width, cssH = box.height;
    return ensureHtml2Canvas().then(function(h2c){
      return h2c(el, { backgroundColor: bg || '#111110', scale: exportScale(), logging: false, useCORS: true });
    }).then(function(raster){
      return { cssW: cssW, cssH: cssH,
        draw: function(ctx, x, y, w, h){ ctx.drawImage(raster, 0, 0, raster.width, raster.height, x, y, w, h); } };
    });
  }

  // ── Blob plumbing: copy to clipboard, else download. ──
  function canvasToBlob(canvas){
    return new Promise(function(resolve){
      if (canvas.toBlob) canvas.toBlob(function(b){ resolve(b); }, 'image/png');
      else {
        try {
          var url = canvas.toDataURL('image/png'), bin = atob(url.split(',')[1]);
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: 'image/png' }));
        } catch (e) { resolve(null); }
      }
    });
  }
  function toBlob(out){ // out may be a canvas or already a Blob
    if (out && typeof Blob !== 'undefined' && out instanceof Blob) return Promise.resolve(out);
    return canvasToBlob(out);
  }
  function attemptCopy(blobPromise){
    return new Promise(function(resolve, reject){
      if (!(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write)) { reject(); return; }
      try {
        var item = new ClipboardItem({ 'image/png': blobPromise });
        navigator.clipboard.write([item]).then(resolve, reject);
      } catch (e) { reject(); }
    });
  }
  function downloadBlob(blobPromise, filename){
    return blobPromise.then(function(blob){
      if (!blob) return false;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename || 'lastcoinstanding-chart.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
      return true;
    });
  }

  function slugify(s){
    return (s || 'chart').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'chart';
  }

  // ── Attach a button to one [data-chart-copy] host. ──
  function attach(host){
    if (!host || host.getAttribute('data-chart-copy-ready')) return;
    host.setAttribute('data-chart-copy-ready', '1');
    injectStyleOnce();
    host.classList.add('chart-copy-host');

    var title    = host.getAttribute('data-chart-title') || '';
    var bg       = host.getAttribute('data-chart-bg') || '#111110';
    var label    = host.getAttribute('data-chart-label') || 'Copy image';
    var filename = host.getAttribute('data-chart-filename') || (slugify(title) + '.png');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chart-copy-btn';
    btn.setAttribute('aria-label', label);
    btn.innerHTML = '<span class="chart-copy-glyph">' + CAMERA_SVG + '</span>' +
                    '<span class="chart-copy-tip" role="status" aria-live="polite"></span>';
    host.appendChild(btn);

    var glyph = btn.querySelector('.chart-copy-glyph');
    var tip   = btn.querySelector('.chart-copy-tip');
    tip.textContent = label;
    var resetTimer = null, busy = false;

    function setBusy(on){
      busy = on;
      btn.classList.toggle('is-busy', on);
      glyph.classList.toggle('spin', on);
      glyph.innerHTML = CAMERA_SVG;
      tip.textContent = on ? 'Copying…' : label;
    }
    function flash(text){
      btn.classList.remove('is-busy'); glyph.classList.remove('spin');
      btn.classList.add('is-done');
      glyph.innerHTML = CHECK_SVG;
      tip.textContent = text;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function(){
        btn.classList.remove('is-done');
        glyph.innerHTML = CAMERA_SVG;
        tip.textContent = label;
      }, 1500);
    }
    function fail(){
      btn.classList.remove('is-busy'); glyph.classList.remove('spin');
      glyph.innerHTML = CAMERA_SVG; tip.textContent = label;
    }

    // Resolve a Promise<canvas|Blob> for the export image.
    function capture(){
      if (typeof host._chartCopyCapture === 'function') {
        return Promise.resolve(host._chartCopyCapture()); // page owns the full image
      }
      // Capture path: explicit data-chart-capture wins, else auto-detect by
      // contents (canvas → svg → DOM-raster).
      var mode = host.getAttribute('data-chart-capture');
      var canvas = host.querySelector('canvas');
      var svg = host.querySelector('svg');
      var src;
      if (mode === 'dom') src = fromDom(host, bg);
      else if (mode === 'svg' && svg) src = fromSvg(svg);
      else if (mode === 'canvas' && canvas) src = fromCanvas(canvas);
      else if (canvas) src = fromCanvas(canvas);
      else if (svg) src = fromSvg(svg);
      else src = fromDom(host, bg);
      return src.then(function(s){
        return buildFramedExport(s.draw, s.cssW, s.cssH, title, bg);
      });
    }

    btn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      if (busy) return;
      setBusy(true);
      capture().then(function(out){
        var blobPromise = toBlob(out);
        attemptCopy(blobPromise).then(
          function(){ flash('Copied'); },
          function(){ downloadBlob(blobPromise, filename).then(function(ok){ ok ? flash('Downloaded') : fail(); }); }
        );
      }).catch(function(){ fail(); });
    });
  }

  function scan(root){
    var nodes = (root || document).querySelectorAll('[data-chart-copy]');
    for (var i = 0; i < nodes.length; i++) attach(nodes[i]);
  }

  // Programmatic attach (e.g. for a custom-capture chart wired in page JS).
  function attachChartCopy(host, opts){
    opts = opts || {};
    if (!host) return;
    if (opts.title)    host.setAttribute('data-chart-title', opts.title);
    if (opts.filename) host.setAttribute('data-chart-filename', opts.filename);
    if (opts.background) host.setAttribute('data-chart-bg', opts.background);
    if (opts.label)    host.setAttribute('data-chart-label', opts.label);
    if (opts.capture)  host._chartCopyCapture = opts.capture;
    host.setAttribute('data-chart-copy', '');
    attach(host);
  }

  window.ChartCopy = { scan: scan, attach: attach };
  window.attachChartCopy = attachChartCopy;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ scan(); });
  } else {
    scan();
  }
})();
