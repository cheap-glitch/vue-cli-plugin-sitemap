
/**
 * tests/sitemap.test.js
 */

const { expect }         = require('chai');
const generateSitemapXML = require('../src/sitemap');

// Wrap some <url> elements in the same XML elements as the sitemap
const wrapURLs = _xml => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${_xml}</urlset>`;

describe("vue-cli-plugin-sitemap sitemap generation", () => {

	/**
	 * URLs
	 * ---------------------------------------------------------------------
	 */
	describe("from an array of URLs", () => {

		it("generates a simple sitemap from full URLs", () => {
			expect(generateSitemapXML({
				baseURL:  '',
				defaults: {},
				urls:     [{ loc: 'https://website.net' }, { loc: 'https://website.net/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("generates a simple sitemap from partial URLs and a base URL", () => {
			expect(generateSitemapXML({
				baseURL:  'https://website.net',
				defaults: {},
				urls:     [{ loc: '/' }, { loc: '/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("removes trailing slashes", () => {
			expect(generateSitemapXML({
				baseURL:  'https://website.net',
				defaults: {},
				urls:     [{ loc: '/' }, { loc: '/about' }, { loc: '/page/' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url><url><loc>https://website.net/page</loc></url>`
			));
		});

		it("adds trailing slashes if the 'trailingSlash' option is set", () => {
			expect(generateSitemapXML({
				baseURL:  'https://website.net',
				defaults: {},
				urls:     [{ loc: '/' }, { loc: '/about' }, { loc: '/page/' }],
				trailingSlash: true,
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/</loc></url><url><loc>https://website.net/about/</loc></url><url><loc>https://website.net/page/</loc></url>`
			));
		});
	});

	/**
	 * Routes
	 * ---------------------------------------------------------------------
	 */
	describe("from an array of routes", () => {
		// @TODO
	});
});
