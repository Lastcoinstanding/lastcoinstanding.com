// Eleventy configuration for lastcoinstanding.com

module.exports = function (eleventyConfig) {
  eleventyConfig.setTemplateFormats(["html", "njk", "md"]);

  // Static assets: copy from repo root into _site/ at build time.
  // Path is relative to the project root (where .eleventy.js lives).
  // Each entry maps source-path -> destination-path-within-output.
  const staticAssets = [
    'hero-bg.jpg',
    'profile.jpg',
    'apple-touch-icon.png',
    'favicon.ico',
    'favicon.svg',
    'favicon-16x16.png',
    'favicon-32x32.png',
    // 48px added 2026-08-29 with the brand-mark favicon set. The 16/32/48 +
    // apple-touch-icon rasters and favicon.svg all render the same 5-coin mark
    // (sources in brand/); 192 predates them and is NOT in the <head> set —
    // it is retained for a future web-app manifest only.
    'favicon-48x48.png',
    'favicon-192x192.png',
    // The header mark (nav, left of the wordmark). Source: brand/lcs-mark-5.svg.
    'lcs-mark.svg',
    'sitemap.xml',
    'llms.txt',
    'robots.txt',
    'concepts.json',
    'data.json',
    // OG cards
    'og-image.jpg',
    'og-about.jpg',
    'og-money-trees.jpg',
    'og-not-a-bubble.jpg',
    'og-synthesis.jpg',
    'og-how-much-cash.jpg',
    'og-what-daily-conviction-bought.jpg',
    'og-bitcoin-defined.jpg',
    'og-the-bitcoin-horizon.jpg',
    'og-the-bitcoin-migration.jpg',
    'og-the-fixed-pie.jpg',
    'og-the-half-life.jpg',
    'og-the-melting-ice-cube.jpg',
    'og-the-power-law.jpg',
    'og-bitcoin-and-metcalfes-law.jpg',
    'og-the-doubling-ladder.jpg',
    'og-the-bitcoin-hurdle-rate.jpg',
    'og-trilemma.jpg',
    'og-what-bitcoin-is.jpg',
    'og-what-money-has-to-be.jpg',
    'og-what-money-is-for.jpg',
    'og-bitcoin-vs-real-estate.jpg',
    'og-bitcoin-vs-rental-property.jpg',       // kept: already-cached social cards still point here
    'og-bitcoin-vs-rental-property-v2.jpg',    // 2026-09-23 retitle; the old card had "The honest comparison" printed on it
    'og-bitcoin-vs-the-stock-market.jpg',
    'og-the-bitcoin-retirement.jpg',
    'og-disciplined-rebalancing.jpg',
    'og-borrowing-against-your-stack.jpg',
    'og-borrowing-against-your-stack-v2.jpg',
    'og-bitcoin-backed-mortgages.jpg',
    'og-bitcoin-fixed-income.jpg',
    'og-strc-below-par.jpg',
    'og-the-strc-mechanism.jpg',
    'og-lump-sum-or-ladder-in.jpg',
    'og-your-deployment-plan.jpg',
    'og-wait-or-deploy-now.jpg',
    'og-bull-and-bear-cycles.jpg',
    'og-discount-or-premium.jpg',
    'og-the-bitcoin-retirement-stress-test.jpg',
    'og-bitcoin-allocation-sizing.jpg',
    'og-living-on-bitcoin.jpg',
    'og-paper-bitcoin.jpg',
    'og-bitcoin-as-collateral.jpg',
    'og-risks-to-bitcoin.jpg',
    'og-how-much-bitcoin.jpg',
    'og-spend-and-replace.jpg',
    'og-heatmap.jpg',
    'og-calculators.jpg',
    'og-the-gallery.jpg',
    'og-start-here.jpg',
    'og-dashboard.jpg',
    'og-bitcoin-escape-velocity.jpg',
    'og-the-bitcoin-floor.jpg',
    'og-compare-retirement-plans.jpg',
    'og-compare-retirement-plans-v2.jpg',
    'og-bitcoin-retirement.jpg',
    'og-the-rundown.jpg',
    // -v2 2026-09-07: same encode, new name, to force a re-scrape. v1 above STAYS
    // registered per §52.1 — already-scraped cards keep resolving. See OPEN_ITEMS.
    'og-the-rundown-v2.jpg',
    // Gallery companion graphic (full-res PNG; scaled for display via CSS, full-res on click-through)
    'middle-seat-infographic.png',
    // Bitcoin Defined illustrations (1280x720). Eight Grok-generated
    // atmospheric still images, one per load-bearing idea.
    'bd-network.jpg',
    'bd-open.jpg',
    'bd-permissionless.jpg',
    'bd-decentralized.jpg',
    'bd-secure.jpg',
    'bd-protocol.jpg',
    'bd-bounded-by-energy.jpg',
    'bd-absolutely-scarce.jpg',
    // Admin tool stays as standalone HTML
    'admin.html',
    // Misc legacy
    'json-ld-snippets.html',
    'the-opportunity-cost.html',
  ];

  staticAssets.forEach(asset => {
    eleventyConfig.addPassthroughCopy({ [asset]: asset });
  });

  // Videos folder — only enable when present locally (production has it; local test may not)
  eleventyConfig.addPassthroughCopy({ 'videos': 'videos' });
  // Lightning Address endpoint — Cloudflare Pages serves .well-known files; _headers sets Content-Type
  eleventyConfig.addPassthroughCopy({ '.well-known': '.well-known' });
  eleventyConfig.addPassthroughCopy({ '_headers': '_headers' });
  eleventyConfig.addPassthroughCopy({ '_redirects': '_redirects' });
  // Unlisted outreach demos. Passthrough (not `src/`) on purpose: these are
  // self-contained one-file artifacts that must ship byte-identical to the
  // version reviewed and linked in an email, and anything under `src/` would
  // be run through Nunjucks (htmlTemplateEngine: "njk") on the way out.
  // Deliberately absent from sitemap.xml, llms.txt, nav, the homepage and
  // every related strip: reachable only by direct link, and _headers marks
  // /demo/* noindex, nofollow.
  eleventyConfig.addPassthroughCopy({ 'demo': 'demo' });

  // Sort helper for the /calculators page (src/calculators.njk).
  // Sorts an explorations.json array by calculator_tile.position ascending.
  // Entries without a calculator_tile block sort to the end (effectively
  // filtered out — the template guards with `{% if ex.calculator_tile %}`).
  eleventyConfig.addFilter('sortByCalculatorTilePosition', (arr) => {
    if (!Array.isArray(arr)) return arr;
    return [...arr].sort((a, b) => {
      const ap = (a.calculator_tile && a.calculator_tile.position) || 9999;
      const bp = (b.calculator_tile && b.calculator_tile.position) || 9999;
      return ap - bp;
    });
  });

  // faqStripTags — reduce an FAQ answer to plain text for the FAQPage JSON-LD
  // (components/faq-schema.njk). Answers may carry a curated inline <a> in the
  // visible block; the schema answer text is safest as plain text, and this
  // makes the schema string match the visible block's textContent (which the
  // browser also renders tag-free). Whitespace is preserved so the two strings
  // stay identical.
  //
  // ENTITIES ARE DECODED TOO (fix 2026-08-22, the C1 defect from the site-wide
  // hygiene audit). Stripping tags alone left the schema carrying the SOURCE
  // text — "bitcoin&rsquo;s trend growth" — while the visible block renders the
  // decoded character, because the browser decodes entities when it parses the
  // FAQ markup. Google's FAQPage policy requires the schema text to match what
  // the reader sees, so the two have to be decoded the same way. Affected 10
  // FAQ-bearing pages; The Bitcoin Hurdle Rate carried 15 occurrences alone.
  //
  // Named set is scoped to what FAQ prose actually uses (audited across every
  // faq: block: mdash, rsquo, quot, times, rdquo, minus, ldquo), plus ndash,
  // hellip, nbsp and the structural four for headroom; numeric entities are
  // handled generically. Deliberately NOT a general-purpose HTML decoder —
  // `| dump` still JSON-escapes the result, so the output stays valid JSON, and
  // a narrow table is easier to reason about than a dependency.
  const FAQ_ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
    mdash: '—', ndash: '–', minus: '−',
    lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
    times: '×', hellip: '…', nbsp: ' '
  };
  eleventyConfig.addFilter('faqStripTags', (s) =>
    String(s == null ? '' : s)
      .replace(/<[^>]*>/g, '')
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      // &amp; last would double-decode "&amp;mdash;"; the named pass runs once,
      // left to right, so each entity is replaced exactly one time.
      .replace(/&([a-zA-Z]+);/g, (m, name) =>
        Object.prototype.hasOwnProperty.call(FAQ_ENTITIES, name) ? FAQ_ENTITIES[name] : m));

  // ─── Build lints (2026-09-23; TECH_DEBT "A lint for page_scripts YAML" and
  // "base.njk could carry a DEFAULT palette"). Both FAIL the build: each
  // guards a defect that renders without an error and stays invisible until
  // something else touches the line.
  const lintFs = require('fs');
  const lintPath = require('path');

  // (1) Front-matter include lists. page_scripts / page_styles / head_extras
  // are YAML double-quoted scalars holding {% include %} tags separated by the
  // two characters \n. A real newline is folded to a space by YAML, so the page
  // still builds; two includes with no separator at all concatenate the files.
  // Checked on the raw source, because after YAML parsing the two are
  // indistinguishable. Rule: the scalar opens and closes on its own line, and
  // holds exactly one \n between consecutive includes.
  eleventyConfig.on('eleventy.before', () => {
    const errs = [];
    const walk = (dir) => lintFs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
      const p = lintPath.join(dir, d.name);
      if (d.isDirectory()) { if (d.name !== '_includes' && d.name !== '_data') walk(p); return; }
      if (!p.endsWith('.njk')) return;
      const src = lintFs.readFileSync(p, 'utf8');
      const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fm) return;
      const re = /^[ \t]*(page_scripts|page_styles|head_extras):[ \t]*(.*)$/gm;
      let m;
      while ((m = re.exec(fm[1]))) {
        const v = m[2].trim();
        const closed = v.length > 1 && v.startsWith('"') && v.endsWith('"');
        const inc = (v.match(/\{%\s*include/g) || []).length;
        const sep = (v.match(/\\n/g) || []).length;
        if (!closed) errs.push(`${p}: ${m[1]} must be one double-quoted line (a raw newline is folded to a space by YAML)`);
        else if (inc !== sep + 1) errs.push(`${p}: ${m[1]} has ${inc} includes but ${sep} \\n separators (want ${inc - 1})`);
      }
    });
    walk('src');

    // Slider cursors (2026-09-23): base.njk owns the cursor for every range
    // input and its thumb. A page rule that sets `cursor` on a thumb
    // pseudo-element or on an input[type=range] selector overrides that and
    // reintroduces the mixed pointer/grab convention. (Class-only selectors
    // such as `.wd-slider` cannot be told apart from non-slider classes here,
    // so this covers the two forms 79 of the 83 removed rules used.)
    const pa = lintPath.join('src', '_includes', '_pageassets');
    lintFs.readdirSync(pa).filter((f) => f.endsWith('.css')).forEach((f) => {
      const css = lintFs.readFileSync(lintPath.join(pa, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
      let r;
      while ((r = ruleRe.exec(css))) {
        if (!/(^|;|\s)cursor\s*:/.test(r[2])) continue;
        const hit = r[1].split(',').some((s) => {
          const last = s.trim().split(/[\s>+~]+/).pop();
          return /slider-thumb|range-thumb/.test(s) || /\[type=["']?range/.test(last);
        });
        if (hit) errs.push(`${pa}/${f}: sets cursor on a slider (${r[1].trim().slice(0, 60)}); base.njk owns slider cursors`);
      }
    });
    if (errs.length) throw new Error('Source lint failed (front-matter includes / slider cursors):\n  ' + errs.join('\n  '));
  });

  // (2) Undefined CSS custom properties. Each page defines its own palette
  // (there is no site-wide default; one was considered and rejected on
  // 2026-09-23 because pages rely on var() fallbacks that a default would
  // silently override). A var(--x) with NO fallback that the page never
  // defines is invalid at computed-value time: colour quietly inherits,
  // borders fall to currentColor. Checked on the rendered HTML, so shared
  // modules and layout CSS are included. Comments are stripped first.
  eleventyConfig.on('eleventy.after', ({ results }) => {
    const errs = [];
    (results || []).forEach((r) => {
      if (!r.outputPath || !r.outputPath.endsWith('.html') || typeof r.content !== 'string') return;
      const html = r.content
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[\s;{}(,])\/\/[^\n]*/g, '$1');
      const defined = new Set();
      let m;
      const defRe = /(--[\w-]+)\s*:/g;
      while ((m = defRe.exec(html))) defined.add(m[1]);
      const setRe = /setProperty\(\s*['"](--[\w-]+)/g;
      while ((m = setRe.exec(html))) defined.add(m[1]);
      const missing = new Set();
      const useRe = /var\(\s*(--[\w-]+)\s*\)/g;
      while ((m = useRe.exec(html))) if (!defined.has(m[1])) missing.add(m[1]);
      if (missing.size) errs.push(`${r.outputPath}: ${[...missing].join(', ')}`);
    });
    if (errs.length) throw new Error('Undefined CSS variable lint failed (define it in the page :root, or give the var() a fallback):\n  ' + errs.join('\n  '));
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
