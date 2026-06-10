/* ============================================================
   How Much Bitcoin? — Kelly curve explorer
   All formula outputs computed here; nothing quoted from
   research-corpus arithmetic (SITE_GUIDE verification rule).

   Model (continuous-time, two assets):
     mu  = arithmetic drift; g = compound growth; g ≈ mu − ½σ²
     f*  = (mu − r) / σ²
     g(f) = r + f(mu − r) − ½ f² σ²
     Drawdown odds at fraction c of Kelly (relative-wealth model):
       P(ever fall to x)        = x^(2/c − 1)
       P(halve before double)   = 1 − (2^θ − 1)/(2^θ − 2^−θ), θ = 2/c − 1
   ============================================================ */
(function () {
    var R = 0.04; // risk-free rate, as-of June 2026 (MONTHLY_REFRESH item)
    var GENESIS = new Date(2009, 0, 3);

    var svg = document.getElementById('curveChart');
    if (!svg || typeof PL_DATA === 'undefined') return;

    /* ── Trailing-decade inputs computed from the canonical series ── */
    function trailingDecade() {
        var n = PL_DATA.length;
        var endDay = PL_DATA[n - 1][0], endP = PL_DATA[n - 1][1];
        var startIdx = 0;
        for (var i = n - 1; i >= 0; i--) {
            if (endDay - PL_DATA[i][0] >= 3652.5) { startIdx = i; break; }
        }
        var startDay = PL_DATA[startIdx][0], startP = PL_DATA[startIdx][1];
        var years = (endDay - startDay) / 365.25;
        var g = Math.pow(endP / startP, 1 / years) - 1;
        // Annualized volatility from interval log returns, normalized per √day
        var zs = [];
        for (var j = startIdx + 1; j < n; j++) {
            var dd = PL_DATA[j][0] - PL_DATA[j - 1][0];
            if (dd <= 0) continue;
            zs.push(Math.log(PL_DATA[j][1] / PL_DATA[j - 1][1]) / Math.sqrt(dd));
        }
        var mean = zs.reduce(function (a, b) { return a + b; }, 0) / zs.length;
        var varr = zs.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (zs.length - 1);
        var sigma = Math.sqrt(varr) * Math.sqrt(365.25);
        var asof = new Date(GENESIS.getTime() + endDay * 86400000);
        return { g: g, sigma: sigma, asof: asof };
    }

    var TRAIL = trailingDecade();
    var PRESETS = {
        trailing: { g: TRAIL.g, sigma: TRAIL.sigma },
        maturation: { g: 0.30, sigma: 0.60 },
        conservative: { g: 0.10 - 0.5 * 0.36, sigma: 0.60 } // defined by mu=10%: g = mu − ½σ² = −8%
    };

    /* ── State ── */
    var state = { g: PRESETS.trailing.g, sigma: PRESETS.trailing.sigma, preset: 'trailing' };

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

    /* ── Chart ── */
    var W = 980, H = 480, PAD = { l: 64, r: 24, t: 26, b: 46 };
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

        // Danger zone beyond 2×Kelly
        if (2 * fs < xMax) {
            svg.appendChild(el('rect', { x: xS(2 * fs), y: PAD.t, width: xS(xMax) - xS(2 * fs), height: H - PAD.t - PAD.b, class: 'danger-zone' }));
        }
        // Fill above risk-free between 0 and 2×Kelly
        var fillD = 'M' + xS(0) + ',' + yS(R);
        var f2 = Math.min(2 * fs, xMax);
        for (var i = 0; i <= 120; i++) {
            var f = (i / 120) * f2;
            fillD += ' L' + xS(f).toFixed(1) + ',' + yS(growth(f)).toFixed(1);
        }
        fillD += ' L' + xS(f2) + ',' + yS(R) + ' Z';
        svg.appendChild(el('path', { d: fillD, class: 'curve-fill' }));

        // Axes
        svg.appendChild(el('line', { x1: PAD.l, y1: PAD.t, x2: PAD.l, y2: H - PAD.b, class: 'axis-line' }));
        svg.appendChild(el('line', { x1: PAD.l, y1: H - PAD.b, x2: W - PAD.r, y2: H - PAD.b, class: 'axis-line' }));
        svg.appendChild(el('text', { x: PAD.l - 8, y: PAD.t + 4, 'text-anchor': 'end', class: 'axis-label' }, 'growth'));
        svg.appendChild(el('text', { x: W - PAD.r, y: H - PAD.b + 30, 'text-anchor': 'end', class: 'axis-label' }, 'allocation (fraction of wealth)'));
        // X ticks at 0, 50%, 100%, … up to xMax
        var step = xMax > 2.6 ? 1.0 : 0.5;
        for (var tx = 0; tx <= xMax + 0.001; tx += step) {
            svg.appendChild(el('text', { x: xS(tx), y: H - PAD.b + 18, 'text-anchor': 'middle', class: 'axis-label' }, Math.round(tx * 100) + '%'));
        }

        // Risk-free reference line
        svg.appendChild(el('line', { x1: PAD.l, y1: yS(R), x2: W - PAD.r, y2: yS(R), class: 'rf-line' }));
        svg.appendChild(el('text', { x: W - PAD.r - 4, y: yS(R) - 7, 'text-anchor': 'end', class: 'mark-text dim' }, 'the risk-free rate \u2014 what doing nothing earns'));

        // The curve
        var d = '';
        for (var k = 0; k <= 240; k++) {
            var fx = (k / 240) * xMax;
            d += (k === 0 ? 'M' : ' L') + xS(fx).toFixed(1) + ',' + yS(growth(fx)).toFixed(1);
        }
        svg.appendChild(el('path', { d: d, class: 'curve-path' }));

        // Marks: ¼, ½, full, 2× Kelly
        var marks = [
            { f: 0.25 * fs, label: '\u00BC Kelly', cls: '' },
            { f: 0.5 * fs, label: '\u00BD Kelly', cls: '' },
            { f: fs, label: 'full Kelly \u2014 the peak', cls: 'peak' },
            { f: 2 * fs, label: '2\u00D7 \u2014 back to the risk-free rate', cls: 'double' }
        ];
        marks.forEach(function (m) {
            if (m.f > xMax) return;
            var gx = growth(m.f);
            svg.appendChild(el('line', { x1: xS(m.f), y1: yS(gx), x2: xS(m.f), y2: H - PAD.b, class: 'mark-line ' + m.cls }));
            svg.appendChild(el('circle', { cx: xS(m.f), cy: yS(gx), r: m.cls === 'peak' ? 5 : 3.5, class: 'mark-dot' }));
            var anchor = (xS(m.f) > W - 220) ? 'end' : 'start';
            var dx = anchor === 'end' ? -8 : 8;
            svg.appendChild(el('text', {
                x: xS(m.f) + dx, y: yS(gx) - 10, 'text-anchor': anchor,
                class: 'mark-text' + (m.cls === 'double' ? ' danger' : '')
            }, m.label));
        });
        if (2 * fs < xMax) {
            svg.appendChild(el('text', { x: xS(2 * fs) + 10, y: PAD.t + 18, class: 'mark-text danger' }, 'beyond: less growth than cash, more risk than full Kelly'));
        }

        renderReadout(fs);
        renderProse(fs);
    }

    /* ── Readout panel ── */
    function renderReadout(fs) {
        document.getElementById('roFstar').textContent = fmtP(fs, fs >= 1 ? 0 : 1) + ' of wealth';
        document.getElementById('roConv').textContent =
            'compound growth ' + fmtP(state.g, 0) + ' \u2192 arithmetic drift ' + fmtP(mu(), 1) +
            ' (volatility drag \u00BD\u03C3\u00B2 = ' + fmtP(0.5 * state.sigma * state.sigma, 1) + ')';

        var gFull = growth(fs), gHalf = growth(0.5 * fs), gQuart = growth(0.25 * fs);
        var exFull = gFull - R;
        var rows = '<tr><th>Fraction</th><th>Growth/yr</th><th>Of max excess</th></tr>' +
            '<tr><td>Full Kelly</td><td class="ro-strong">' + fmtP(gFull, 1) + '</td><td>100%</td></tr>' +
            '<tr><td>Half Kelly</td><td class="ro-strong">' + fmtP(gHalf, 1) + '</td><td>' + (exFull > 0 ? ((gHalf - R) / exFull * 100).toFixed(0) : '\u2014') + '%</td></tr>' +
            '<tr><td>Quarter Kelly</td><td class="ro-strong">' + fmtP(gQuart, 1) + '</td><td>' + (exFull > 0 ? ((gQuart - R) / exFull * 100).toFixed(0) : '\u2014') + '%</td></tr>';
        document.getElementById('roGrowth').innerHTML = rows;

        var draw = '<tr><th>Fraction</th><th>Ever halved</th><th>Halved before doubled</th></tr>' +
            [['Full Kelly', 1], ['Half Kelly', 0.5], ['Quarter Kelly', 0.25]].map(function (rw) {
                return '<tr><td>' + rw[0] + '</td><td class="ro-strong">' + fmtP(pEverHalve(rw[1]), 1) +
                    '</td><td class="ro-strong">' + fmtP(pHalveFirst(rw[1]), 1) + '</td></tr>';
            }).join('');
        document.getElementById('roDraw').innerHTML = draw;

        var flags = [];
        if (fs > 1) {
            flags.push('The formula is asking for <em>leverage</em>. For an unleveraged holder, the binding answer under these assumptions is simply \u201Call of it\u201D \u2014 see The Gap below.');
        }
        var gStandalone = mu() - 0.5 * state.sigma * state.sigma; // = state.g
        if (gStandalone < 0 && fs > 0) {
            flags.push('Under these assumptions bitcoin held <em>alone</em> compounds at ' + fmtP(gStandalone, 1) + ' a year \u2014 it loses money \u2014 yet the formula still allocates ' + fmtP(fs, 1) + '. A small, rebalanced slice harvests the volatility that destroys the standalone holding.');
        }
        if (mu() <= R) {
            flags.push('With no excess return over the risk-free rate, the formula allocates nothing \u2014 there is no edge to size.');
        }
        document.getElementById('roFlags').innerHTML = flags.map(function (f) { return '<div class="ro-flag">' + f + '</div>'; }).join('');
    }

    /* ── Prose numbers (§B + ladder) stay in lockstep with the engine ── */
    function renderProse() {
        var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        var pm = { g: PRESETS.trailing.g, sigma: PRESETS.trailing.sigma };
        var muT = pm.g + 0.5 * pm.sigma * pm.sigma;
        var fT = (muT - R) / (pm.sigma * pm.sigma);
        var sFTrail = document.getElementById('sFTrail');
        if (sFTrail) sFTrail.textContent = Math.round(fT * 100) + '%';
        var ladderTrail = document.getElementById('ladderTrail');
        if (ladderTrail) ladderTrail.textContent = '~' + Math.round(fT * 100) + '%';
        var asof = document.getElementById('asofTrailing');
        if (asof) asof.textContent = '(data through ' + months[TRAIL.asof.getMonth()] + ' ' + TRAIL.asof.getFullYear() +
            ': growth ' + fmtP(pm.g, 0) + '/yr, volatility ' + fmtP(pm.sigma, 0) + ')';
        var mMat = 0.30 + 0.5 * 0.36, fMat = (mMat - R) / 0.36;
        var sM = document.getElementById('sFMatur'); if (sM) sM.textContent = Math.round(fMat * 100) + '%';
        var fCons = (0.10 - R) / 0.36;
        var sC = document.getElementById('sFCons'); if (sC) sC.textContent = (fCons * 100).toFixed(0) + '%';
    }

    /* ── Controls ── */
    function syncSliders() {
        sliderG.value = Math.round(state.g * 100);
        sliderS.value = Math.round(state.sigma * 100);
        valG.textContent = Math.round(state.g * 100) + '% / yr';
        valS.textContent = Math.round(state.sigma * 100) + '%';
    }
    function setPreset(name) {
        state.preset = name;
        state.g = PRESETS[name].g;
        state.sigma = PRESETS[name].sigma;
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

    setPreset('trailing');
})();
