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
    'og-bitcoin-vs-rental-property.jpg',
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
