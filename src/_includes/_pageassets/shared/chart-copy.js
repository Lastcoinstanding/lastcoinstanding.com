/* =============================================================
   chart-copy.js — "Copy chart as image" utility (shared)

   A small, quiet affordance that lets a reader grab a single
   Chart.js chart as a self-contained PNG — copied to the
   clipboard, or downloaded if clipboard-image write is blocked
   (Safari/Firefox). Deliberately understated: a low-opacity
   ghost camera button always present in the chart's top-right
   corner, brightening to full opacity on hover/focus and
   revealing a "Copy image" label. Quiet, not hidden — so the
   affordance is discoverable. NOT a promotional CTA.

   Rollout is one call:
     attachChartCopy(chartInstance, {
       title: 'Bitcoin & The Power Law — the channel',
       filename: 'bitcoin-power-law-channel.png',
       background: '#111110'   // optional; defaults to the card bg
     });

   PROTOTYPE: currently wired only to the Power Law channel chart
   (the-power-law.js). Approve the pattern, then roll out.

   Exposes window.attachChartCopy. Pure ES5 (var / function) to
   match the rest of the page scripts. No dependencies beyond a
   live Chart.js instance.
   ============================================================= */
(function(){
  if (window.attachChartCopy) return; // idempotent across multiple includes

  var STYLE_ID = 'chart-copy-css';
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
      // Always present, but quiet: a low-opacity ghost in the corner. Brightens
      // to full opacity on hover/focus (and while showing feedback). Understated,
      // not hidden — so the affordance is discoverable.
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
      '.chart-copy-glyph{display:inline-flex;line-height:0;}' +
      // Hover label: quiet by default, text-clarity on hover. Reused for the
      // post-action "Copied"/"Downloaded" confirmation (shown via .is-done).
      '.chart-copy-tip{position:absolute;right:calc(100% + 8px);top:50%;transform:translateY(-50%) translateX(4px);' +
        'white-space:nowrap;font:600 11px/1 "Inter",-apple-system,sans-serif;letter-spacing:0.02em;' +
        'color:#e09422;background:rgba(17,17,16,0.96);border:1px solid rgba(224,148,34,0.3);' +
        'border-radius:4px;padding:4px 8px;opacity:0;pointer-events:none;transition:opacity .18s,transform .18s;}' +
      '.chart-copy-btn:hover .chart-copy-tip,.chart-copy-btn:focus-visible .chart-copy-tip,' +
        '.chart-copy-btn.is-done .chart-copy-tip{opacity:1;transform:translateY(-50%) translateX(0);}' +
      '@media print{.chart-copy-btn{display:none;}}';
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  // Build a self-contained export canvas: dark padded background, the
  // chart bitmap, and a muted caption (title left, lastcoinstanding.com
  // right). Rendered at >= 2x CSS resolution for crispness.
  function buildExportCanvas(chart, title, bg){
    var src = chart.canvas;
    var dpr = window.devicePixelRatio || 1;
    var scale = Math.max(2, dpr);                 // export px per CSS px
    var cssW = src.clientWidth  || Math.round(src.width / dpr);
    var cssH = src.clientHeight || Math.round(src.height / dpr);

    var pad   = Math.round(scale * 14);           // breathing room around the chart
    var capH  = Math.round(scale * 30);           // caption strip height
    var chartW = Math.round(cssW * scale);
    var chartH = Math.round(cssH * scale);
    var W = chartW + pad * 2;
    var H = chartH + pad + capH;

    var off = document.createElement('canvas');
    off.width = W; off.height = H;
    var c = off.getContext('2d');

    // Opaque dark background (never transparent — would look broken on
    // white surfaces like X / LinkedIn).
    c.fillStyle = bg || '#111110';
    c.fillRect(0, 0, W, H);

    // Chart bitmap. Source is the live canvas at its native (CSS x dpr)
    // pixels; scale it into the padded region.
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(src, 0, 0, src.width, src.height, pad, pad, chartW, chartH);

    // Caption row.
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

  function canvasToBlob(canvas){
    return new Promise(function(resolve){
      if (canvas.toBlob) { canvas.toBlob(function(b){ resolve(b); }, 'image/png'); }
      else {
        // Very old fallback: decode the data URL into a Blob.
        try {
          var url = canvas.toDataURL('image/png');
          var bin = atob(url.split(',')[1]);
          var arr = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          resolve(new Blob([arr], { type: 'image/png' }));
        } catch (e) { resolve(null); }
      }
    });
  }

  // Try clipboard-image write. Uses the ClipboardItem(Promise<Blob>) form
  // so Safari (which requires the promise be created synchronously in the
  // user gesture) is supported. Rejects on any unsupported / blocked path
  // so the caller can fall back to download.
  function attemptCopy(canvas){
    return new Promise(function(resolve, reject){
      if (!(navigator.clipboard && window.ClipboardItem && navigator.clipboard.write)) {
        reject(); return;
      }
      try {
        var item = new ClipboardItem({ 'image/png': canvasToBlob(canvas) });
        navigator.clipboard.write([item]).then(resolve, reject);
      } catch (e) { reject(); }
    });
  }

  function downloadCanvas(canvas, filename){
    return canvasToBlob(canvas).then(function(blob){
      if (!blob) return false;
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename || 'lastcoinstanding-chart.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
      return true;
    });
  }

  /**
   * Attach a copy-as-image button to a Chart.js chart.
   * @param {Chart} chart  - a live Chart.js instance
   * @param {Object} opts  - { title, filename, background, host, label }
   */
  function attachChartCopy(chart, opts){
    opts = opts || {};
    if (!chart || !chart.canvas) return;
    injectStyleOnce();

    var host = opts.host || chart.canvas.parentNode;
    if (!host) return;
    host.classList.add('chart-copy-host');
    // Idempotent: don't double-inject if called twice for the same chart.
    if (host.querySelector('.chart-copy-btn')) return;

    var title    = opts.title || '';
    var bg       = opts.background || '#111110';
    var filename = opts.filename || 'lastcoinstanding-chart.png';
    var label    = opts.label || 'Copy image';   // hover label (and accessible name)

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chart-copy-btn';
    btn.setAttribute('aria-label', label);
    // No native `title` — the custom .chart-copy-tip is the visible label, and a
    // title attr would double it with the browser's own tooltip.
    btn.innerHTML = '<span class="chart-copy-glyph">' + CAMERA_SVG + '</span>' +
                    '<span class="chart-copy-tip" role="status" aria-live="polite"></span>';
    host.appendChild(btn);

    var glyph = btn.querySelector('.chart-copy-glyph');
    var tip   = btn.querySelector('.chart-copy-tip');
    tip.textContent = label;          // resting label, revealed on hover/focus
    var resetTimer = null;

    function flash(text){
      btn.classList.add('is-done');
      glyph.innerHTML = CHECK_SVG;
      tip.textContent = text;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function(){
        btn.classList.remove('is-done');
        glyph.innerHTML = CAMERA_SVG;
        tip.textContent = label;      // restore the hover label
      }, 1500);
    }

    btn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      var canvas;
      try { canvas = buildExportCanvas(chart, title, bg); }
      catch (err) { return; } // never leave the click doing nothing visible; but if export itself fails, bail quietly
      attemptCopy(canvas).then(
        function(){ flash('Copied'); },
        function(){ downloadCanvas(canvas, filename).then(function(ok){ if (ok) flash('Downloaded'); }); }
      );
    });
  }

  window.attachChartCopy = attachChartCopy;
})();
