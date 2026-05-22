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
    'favicon-192x192.png',
    'sitemap.xml',
    'llms.txt',
    'concepts.json',
    'data.json',
    // OG cards
    'og-image.jpg',
    'og-about.jpg',
    'og-money-trees.jpg',
    'og-not-a-bubble.jpg',
    'og-synthesis.jpg',
    'og-bitcoin-defined.jpg',
    'og-the-bitcoin-horizon.jpg',
    'og-the-bitcoin-migration.jpg',
    'og-the-fixed-pie.jpg',
    'og-the-half-life.jpg',
    'og-the-melting-ice-cube.jpg',
    'og-the-power-law.jpg',
    'og-trilemma.jpg',
    'og-what-bitcoin-is.jpg',
    'og-what-money-has-to-be.jpg',
    'og-bitcoin-vs-real-estate.jpg',
    'og-bitcoin-vs-the-stock-market.jpg',
    'og-the-bitcoin-retirement.jpg',
    'og-disciplined-rebalancing.jpg',
    'og-borrowing-against-your-stack.jpg',
    'og-bitcoin-backed-mortgages.jpg',
    'og-living-on-bitcoin.jpg',
    'og-heatmap.jpg',
    'og-calculators.jpg',
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
