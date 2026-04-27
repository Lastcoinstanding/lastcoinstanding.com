// Eleventy configuration for lastcoinstanding.com
//
// PHASE 1 (current): Scaffolding only. The build runs but produces an empty
// _site/ because src/ has no input files yet. The live site continues to be
// served by Cloudflare Pages from the repo root HTML files (untouched).
//
// PHASE 2 (next): Migrate the-bitcoin-migration.html as the pilot page.
// PHASE 3: Migrate remaining pages incrementally.
// PHASE 4: Switch Cloudflare Pages build to `npm run build` with output `_site`.

module.exports = function (eleventyConfig) {
  // Templating: Nunjucks for both .html and .njk
  eleventyConfig.setTemplateFormats(["html", "njk", "md"]);

  // Pass through static assets unchanged when they appear in src/
  // (No-op in Phase 1; relevant once we start moving files in)
  // eleventyConfig.addPassthroughCopy("src/assets");

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
