/* ============================================================
   How Much Bitcoin? — Kelly curve explorer (v2: Power Law presets)
   All formula outputs computed here; nothing quoted from
   research-corpus arithmetic (SITE_GUIDE verification rule).

   Growth scenarios mirror the canonical BvRP/BFI chips:
     revert — price closes its gap to the Power Law trend over 10y
     stay   — price holds today's trend multiple (trend-rate growth)
   Both embed the trend's DECLINING growth rate, averaged over the
   next ten years; Kelly needs a single (mu, sigma) and the 10-year
   trend-implied CAGR is the honest mapping.

   Model (continuous-time, two assets):
     mu  = arithmetic drift; g = compound growth; g ≈ mu − ½σ²
     f*  = (mu − r) / σ²;  g(f) = r + f(mu − r) − ½ f² σ²
     P(ever fall to x) at fraction c = x^(2/c − 1)
     P(halve before double): θ = 2/c − 1 → 1 − (2^θ−1)/(2^θ−2^−θ)
   ============================================================ */
(function () {
    var R = 0.04; // risk-free rate, as-of June 2026 (MONTHLY_REFRESH item)
    var H_YEARS = 10, H_DAYS = 3652.5;

    var svg = document.getElementById('curveChart');
    if (!svg || typeof PL_DATA === 'undefined' || typeof plPrice === 'undefined') return;

    /* ── Realized volatility over the most recent ten years of the canonical series ── */
    function trailingVol() {
        var n = PL_DATA.length, endDay = PL_DATA[n - 1][0], startIdx = 0;
        for (var i = n - 1; i >= 0; i--) {
            if (endDay - PL_DATA[i][0] >= H_DAYS) { startIdx = i; break; }
        }
        var zs = [];
        for (var j = startIdx + 1; j < n; j++) {
            var dd = PL_DATA[j][0] - PL_DATA[j - 1][0];
            if (dd <= 0) continue;
            zs.push(Math.log(PL_DATA[j][1] / PL_DATA[j - 1][1]) / Math.sqrt(dd));
        }
        var mean = zs.reduce(function (a, b) { return a + b; }, 0) / zs.length;
        var v = zs.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (zs.length - 1);
        return Math.sqrt(v) * Math.sqrt(365.25);
    }
    var VOL = trailingVol();

    /* ── Power Law scenario growth rates (10y forward CAGR) ── */
    var SC;
    function scenarioRates() {
        var trendNow = plPrice(TODAY_DAYS), trendThen = plPrice(TODAY_DAYS + H_DAYS);
        return {
            multiple: TODAY_PRICE / trendNow,
            gStay: Math.pow(trendThen / trendNow, 1 / H_YEARS) - 1,
            gRevert: Math.pow(trendThen / TODAY_PRICE, 1 / H_YEARS) - 1
        };
    }
    SC = scenarioRates();
    function PRESETS() {
        return {
            revert: { g: SC.gRevert, sigma: VOL },
            stay: { g: SC.gStay, sigma: VOL },
            conservative: { g: 0.10 - 0.5 * 0.36, sigma: 0.60 } // mu = 10% → g = −8%
        };
    }

    /* ── State + helpers ── */
    var state = { g: 0, sigma: VOL, preset: 'revert' };
    var sliderG = document.getElementById('sliderG');
    var sliderS = document.getElementById('sliderS');
    var valG = document.getElementById('valG');
    var valS = document.getElementById('valS');

    function mu() { return state.g + 0.5 * state.sigma * state.sigma; }
    function fstar() { return (mu() - R) / (state.sigma * state.sigma); }
    function growth(f) { return R + f * (mu() - R) - 0.5 * f * f * state.sigma * state.sigma; }
    function pEverHalve(c) { return Math.pow(0.5, 2 / c - 1); }
    function pHalveFirst(c) {
        var th = 2 / c - 1, up = Math.pow(2, th);
        return 1 - (up - 1) / (up - 1 / up);
    }
    var fmtP = function (x, d) { return (x * 100).toFixed(d === undefined ? 1 : d) + '%'; };
    var fmtP0 = function (x) { return Math.round(x * 100) + '%'; };

    /* ── Chart ── */
    var W = 980, H = 480, PAD = { l: 64, r: 24, t: 30, b: 46 };
    var NS = 'http://www.w3.org/2000/svg';
    function el(tag, attrs, text) {
        var e = document.createElementNS(NS, tag);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function render() {
        var fs = fstar();
        if (!(fs > 0)) fs = 0.0001;
        var xMax = Math.max(2.5 * fs, 1.2);
        var gPeak = growth(fs);
        var yMax = gPeak + (gPeak - R) * 0.25 + 0.02;
        var yMin = Math.min(growth(xMax), R - (gPeak - R) * 0.6, -0.02);
        var xS = function (f) { return PAD.l + (f / xMax) * (W - PAD.l - PAD.r); };
        var yS = function (g) { return PAD.t + (1 - (g - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b); };

        svg.innerHTML = '';

        if (2 * fs < xMax) {
            svg.appendChild(el('rect', { x: xS(2 * fs), y: PAD.t, width: xS(xMax) - xS(2 * fs), height: H - PAD.t - PAD.b, class: 'danger-zone' }));
        }
        var fillD = 'M' + xS(0) + ',' + yS(R);
        var f2 = Math.min(2 * fs, xMax);
        for (var i = 0; i <= 120; i++) {
            var f = (i / 120) * f2;
            fillD += ' L' + xS(f).toFixed(1) + ',' + yS(growth(f)).toFixed(1);
        }
        fillD += ' L' + xS(f2) + ',' + yS(R) + ' Z';
        svg.appendChild(el('path', { d: fillD, class: 'curve-fill' }));

        svg.appendChild(el('line', { x1: PAD.l, y1: PAD.t, x2: PAD.l, y2: H - PAD.b, class: 'axis-line' }));
        svg.appendChild(el('line', { x1: PAD.l, y1: H - PAD.b, x2: W - PAD.r, y2: H - PAD.b, class: 'axis-line' }));
        // Y ticks: quantify the growth axis
        var ySpan = yMax - yMin, ySteps = [0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1], ystep = ySteps[ySteps.length - 1];
        for (var si = 0; si < ySteps.length; si++) { if (ySpan / ySteps[si] <= 6.5) { ystep = ySteps[si]; break; } }
        for (var ty = Math.ceil(yMin / ystep) * ystep; ty <= yMax + 1e-9; ty += ystep) {
            svg.appendChild(el('line', { x1: PAD.l, y1: yS(ty), x2: W - PAD.r, y2: yS(ty), class: 'grid-line' }));
            svg.appendChild(el('text', { x: PAD.l - 8, y: yS(ty) + 4, 'text-anchor': 'end', class: 'axis-label' }, (ty > 1e-9 ? '+' : '') + Math.round(ty * 100) + '%'));
        }
        svg.appendChild(el('text', { x: PAD.l + 10, y: PAD.t + 8, 'text-anchor': 'start', class: 'axis-label' }, 'wealth growth, % / yr'));
        svg.appendChild(el('text', { x: W - PAD.r, y: H - PAD.b + 30, 'text-anchor': 'end', class: 'axis-label' }, 'allocation (fraction of wealth)'));
        var step = xMax > 2.6 ? 1.0 : 0.5;
        for (var tx = 0; tx <= xMax + 0.001; tx += step) {
            svg.appendChild(el('text', { x: xS(tx), y: H - PAD.b + 18, 'text-anchor': 'middle', class: 'axis-label' }, Math.round(tx * 100) + '%'));
        }

        // Risk-free reference line — label LEFT and BELOW the line so it can
        // never collide with the 2× mark label on the right (review fix Jun 2026)
        svg.appendChild(el('line', { x1: PAD.l, y1: yS(R), x2: W - PAD.r, y2: yS(R), class: 'rf-line' }));
        svg.appendChild(el('text', { x: PAD.l + 8, y: yS(R) + 17, 'text-anchor': 'start', class: 'mark-text dim' }, 'cash baseline \u2014 the ' + fmtP(R, 1) + ' risk-free rate, what doing nothing earns'));

        var d = '';
        for (var k = 0; k <= 240; k++) {
            var fx = (k / 240) * xMax;
            d += (k === 0 ? 'M' : ' L') + xS(fx).toFixed(1) + ',' + yS(growth(fx)).toFixed(1);
        }
        svg.appendChild(el('path', { d: d, class: 'curve-path' }));

        // Marks with collision-aware label placement (review fix Jun 2026)
        var qx = xS(0.25 * fs), hx = xS(0.5 * fs);
        var crowded = (hx - qx) < 90;
        var marks = [
            { f: 0.25 * fs, label: '\u00BC Kelly', cls: '', dy: crowded ? -28 : -10 },
            { f: 0.5 * fs, label: '\u00BD Kelly', cls: '', dy: -10 },
            { f: fs, label: 'full Kelly \u2014 the peak', cls: 'peak', dy: -12 },
            { f: 2 * fs, label: '2\u00D7 Kelly \u2014 growth falls back to cash', cls: 'double', dy: -12 }
        ];
        marks.forEach(function (m) {
            if (m.f > xMax) return;
            var gx = growth(m.f);
            svg.appendChild(el('line', { x1: xS(m.f), y1: yS(gx), x2: xS(m.f), y2: H - PAD.b, class: 'mark-line ' + m.cls }));
            svg.appendChild(el('circle', { cx: xS(m.f), cy: yS(gx), r: m.cls === 'peak' ? 5 : 3.5, class: 'mark-dot' }));
            var anchor = (xS(m.f) > W - 250) ? 'end' : 'start';
            var dx = anchor === 'end' ? -8 : 8;
            svg.appendChild(el('text', {
                x: xS(m.f) + dx, y: yS(gx) + m.dy, 'text-anchor': anchor,
                class: 'mark-text' + (m.cls === 'double' ? ' danger' : '')
            }, m.label));
        });
        // Danger-zone caption: right-aligned inside the zone, shortened (review fix)
        if (2 * fs < xMax) {
            svg.appendChild(el('text', { x: W - PAD.r - 8, y: PAD.t + 18, 'text-anchor': 'end', class: 'mark-text danger' }, 'beyond 2\u00D7 Kelly: less growth than cash, more risk'));
        }

        CUR = { xMax: xMax, xS: xS, yS: yS };
        buildHover();
        renderTakeaways(fs);
        renderReadout(fs);
    }

    /* ── Hover point-legend (review request, Jun 2026) ── */
    var CUR = null, hov = null;
    function buildHover() {
        var g = el('g', { visibility: 'hidden' });
        var line = el('line', { y1: PAD.t, y2: H - PAD.b, class: 'hv-line' });
        var dot = el('circle', { r: 4.5, class: 'hv-dot' });
        var box = el('rect', { width: 268, height: 76, rx: 6, y: PAD.t + 6, class: 'hv-box' });
        var t1 = el('text', { y: PAD.t + 28, class: 'hv-text hv-strong' });
        var t2 = el('text', { y: PAD.t + 48, class: 'hv-text' });
        var t3 = el('text', { y: PAD.t + 68, class: 'hv-text hv-note' });
        g.appendChild(line); g.appendChild(dot); g.appendChild(box); g.appendChild(t1); g.appendChild(t2); g.appendChild(t3);
        svg.appendChild(g);
        hov = { g: g, line: line, dot: dot, box: box, t1: t1, t2: t2, t3: t3 };
    }
    svg.addEventListener('pointermove', function (e) {
        if (!CUR || !hov) return;
        var rect = svg.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width * W;
        var f = (px - PAD.l) / (W - PAD.l - PAD.r) * CUR.xMax;
        if (f < 0 || f > CUR.xMax) { hov.g.setAttribute('visibility', 'hidden'); return; }
        var gv = growth(f);
        var x = CUR.xS(f), y = CUR.yS(gv);
        var bx = (x > W - 296) ? x - 280 : x + 12;
        hov.g.setAttribute('visibility', 'visible');
        hov.line.setAttribute('x1', x); hov.line.setAttribute('x2', x);
        hov.dot.setAttribute('cx', x); hov.dot.setAttribute('cy', y);
        hov.box.setAttribute('x', bx);
        hov.t1.setAttribute('x', bx + 12); hov.t2.setAttribute('x', bx + 12); hov.t3.setAttribute('x', bx + 12);
        hov.t1.textContent = 'at ' + Math.round(f * 100) + '% allocation';
        hov.t2.textContent = 'expected growth \u2248 ' + (gv >= 0 ? '+' : '') + (gv * 100).toFixed(1) + '% / yr';
        hov.t3.textContent = 'under your assumptions \u2014 not a forecast';
    });
    svg.addEventListener('pointerleave', function () { if (hov) hov.g.setAttribute('visibility', 'hidden'); });

    /* ── Spoon-fed takeaways (review request, Jun 2026) ── */
    function renderTakeaways(fs) {
        var list = document.getElementById('takeawaysList');
        if (!list) return;
        var items = [];
        if (state.g < 0 && mu() > R) {
            items.push('Even under assumptions where bitcoin held <em>alone</em> would lose ' + fmtP(Math.abs(state.g), 0) + ' a year in compound terms, the formula still allocates <strong>' + fmtP(fs, 1) + '</strong> \u2014 a small, rebalanced slice harvests volatility the standalone holding cannot.');
        } else if (mu() <= R) {
            items.push('With no expected edge over the risk-free rate, the formula allocates <strong>nothing</strong> \u2014 there is no excess return to size.');
        } else {
            items.push('Under these assumptions the formula\u2019s answer \u2014 the peak of the curve \u2014 is <strong>' + fmtP0(fs) + ' of your wealth</strong>' + (fs > 1 ? ' \u2014 past 100%: the math is suggesting <em>leverage</em> for wealth-growth optimization under these expectations of growth and volatility. For an unleveraged holder, the practical ceiling is 100%.' : '.'));
        }
        if (mu() > R) {
            items.push('<strong>Half-Kelly</strong> (' + fmtP0(fs / 2) + ') keeps 75% of the achievable growth while cutting the odds of ever seeing your wealth halved from 50% to 12.5%; <strong>quarter-Kelly</strong> (' + fmtP0(fs / 4) + ') keeps about 44% with that risk near zero.');
            items.push('Right of the peak, <em>more bitcoin buys less growth</em> \u2014 and past ' + fmtP0(2 * fs) + ' (twice the peak), wealth compounds slower than cash while carrying far more risk. Over-betting is the only true mistake on this chart.');
        }
        list.innerHTML = items.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    }

    function tipHtml(txt, end) {
        return ' <span class="help-tip" tabindex="0">?<span class="tip-content' + (end ? ' tip-end' : '') + '">' + txt + '</span></span>';
    }

    /* ── Readout ── */
    function renderReadout(fs) {
        document.getElementById('roFstar').textContent = fmtP(fs, fs >= 1 ? 0 : 1) + ' of wealth';
        document.getElementById('roConv').innerHTML =
            'compound growth ' + fmtP(state.g, 0) + ' \u2192 arithmetic drift ' + fmtP(mu(), 1) +
            ' (volatility drag \u00BD\u03C3\u00B2 = ' + fmtP(0.5 * state.sigma * state.sigma, 1) + ')' + tipHtml('The formula wants the simple average annual return (\u201Carithmetic drift\u201D), not the compound rate usually quoted. Volatility makes compound growth lag that average by about \u00BD\u03C3\u00B2, so the page converts your compound-growth input upward before sizing.');

        var gFull = growth(fs), gHalf = growth(0.5 * fs), gQuart = growth(0.25 * fs);
        var exFull = gFull - R;
        var rows = '<tr><th>Fraction</th><th>Growth/yr</th><th>Of max excess' + tipHtml('Of the growth above cash that the full-Kelly peak achieves, the share this fraction keeps. Half-Kelly keeps 75% of it; quarter-Kelly about 44%.', true) + '</th></tr>' +
            '<tr><td>Full Kelly</td><td class="ro-strong">' + fmtP(gFull, 1) + '</td><td>100%</td></tr>' +
            '<tr><td>Half Kelly</td><td class="ro-strong">' + fmtP(gHalf, 1) + '</td><td>' + (exFull > 0 ? ((gHalf - R) / exFull * 100).toFixed(0) : '\u2014') + '%</td></tr>' +
            '<tr><td>Quarter Kelly</td><td class="ro-strong">' + fmtP(gQuart, 1) + '</td><td>' + (exFull > 0 ? ((gQuart - R) / exFull * 100).toFixed(0) : '\u2014') + '%</td></tr>';
        document.getElementById('roGrowth').innerHTML = rows;

        var draw = '<tr><th>Fraction</th><th>Ever halved' + tipHtml('The model\u2019s odds that, at some point over a long horizon, total wealth falls to half its starting value.', true) + '</th><th>Halved before doubled' + tipHtml('The odds that the halving arrives before the first doubling \u2014 the path-order risk that defines how brutal the ride feels.', true) + '</th></tr>' +
            [['Full Kelly', 1], ['Half Kelly', 0.5], ['Quarter Kelly', 0.25]].map(function (rw) {
                return '<tr><td>' + rw[0] + '</td><td class="ro-strong">' + fmtP(pEverHalve(rw[1]), 1) +
                    '</td><td class="ro-strong">' + fmtP(pHalveFirst(rw[1]), 1) + '</td></tr>';
            }).join('');
        document.getElementById('roDraw').innerHTML = draw;

        var flags = [];
        if (fs > 1) {
            flags.push('The formula is asking for <em>leverage</em>. For an unleveraged holder, the binding answer under these assumptions is simply \u201Call of it\u201D \u2014 see The Gap below.');
        }
        if (state.g < 0 && fs > 0 && mu() > R) {
            flags.push('Bitcoin held <em>alone</em> compounds at ' + fmtP(state.g, 1) + ' a year under these assumptions \u2014 yet the formula still allocates ' + fmtP(fs, 1) + '. The rebalanced slice harvests the volatility.');
        }
        if (mu() <= R) {
            flags.push('With no excess return over the risk-free rate, the formula allocates nothing \u2014 there is no edge to size.');
        }
        document.getElementById('roFlags').innerHTML = flags.map(function (f) { return '<div class="ro-flag">' + f + '</div>'; }).join('');
    }

    /* ── Prose (§B), ladder (§F), and chip sub-labels — same engine ── */
    function fillStatics() {
        var P = PRESETS();
        var fOf = function (p) { var m = p.g + 0.5 * p.sigma * p.sigma; return (m - R) / (p.sigma * p.sigma); };
        var fRevert = fOf(P.revert), fStay = fOf(P.stay), fCons = fOf(P.conservative);

        var set = function (id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt; };
        set('gRevertTxt', fmtP0(P.revert.g));
        set('gStayTxt', fmtP0(P.stay.g));
        set('volTxt', fmtP0(VOL));
        set('multTxt', SC.multiple.toFixed(2));
        set('sFRevert', fmtP0(fRevert));
        set('sFStay', fmtP0(fStay));
        set('sFCons', fmtP0(fCons));
        set('ladderRevert', '~' + fmtP0(fRevert));
        set('ladderStay', '~' + fmtP0(fStay));
        set('ladderHalf', '~' + fmtP0(fStay / 2));
        set('ladderQuart', '~' + fmtP0(fStay / 4));
        set('subRevert', '\u2248' + fmtP0(P.revert.g) + '/yr \u00B7 vol ' + fmtP0(VOL));
        set('subStay', '\u2248' + fmtP0(P.stay.g) + '/yr \u00B7 vol ' + fmtP0(VOL));
        set('subCons', '\u22128%/yr \u00B7 vol 60%');
        set('ctxMult', SC.multiple.toFixed(2) + '\u00D7');
        var pe = document.getElementById('ctxPrice');
        if (pe) pe.textContent = '$' + Math.round(TODAY_PRICE).toLocaleString('en-US');
    }

    /* ── Controls ── */
    function syncSliders() {
        sliderG.value = Math.round(state.g * 100);
        sliderS.value = Math.round(state.sigma * 100);
        valG.textContent = Math.round(state.g * 100) + '% / yr';
        valS.textContent = Math.round(state.sigma * 100) + '%';
    }
    function setPreset(name) {
        var P = PRESETS();
        state.preset = name;
        state.g = P[name].g;
        state.sigma = P[name].sigma;
        document.querySelectorAll('.kpreset-btn').forEach(function (b) {
            b.classList.toggle('active', b.dataset.preset === name);
        });
        syncSliders();
        render();
    }
    document.querySelectorAll('.kpreset-btn').forEach(function (b) {
        b.addEventListener('click', function () { setPreset(b.dataset.preset); });
    });
    function onSlide() {
        state.g = parseInt(sliderG.value, 10) / 100;
        state.sigma = parseInt(sliderS.value, 10) / 100;
        state.preset = null;
        document.querySelectorAll('.kpreset-btn').forEach(function (b) { b.classList.remove('active'); });
        valG.textContent = sliderG.value + '% / yr';
        valS.textContent = sliderS.value + '%';
        render();
    }
    sliderG.addEventListener('input', onSlide);
    sliderS.addEventListener('input', onSlide);

    /* ── Boot: series price first, then refine via the shared live fetch ── */
    fillStatics();
    setPreset('revert');
    if (typeof fetchTodayPrice === 'function') {
        fetchTodayPrice(function () {
            SC = scenarioRates();
            fillStatics();
            if (state.preset) { setPreset(state.preset); } else { render(); }
        });
    }
})();
