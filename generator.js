
/**
 * vue-cli-plugin-sitemap/generator.js
 */

// Add a "sitemap" script to package.json
module.exports = _api => _api.extendPackage({ scripts: { sitemap: "vue-cli-service sitemap" } });
