
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
				routes:   [],
				urls:     [{ loc: 'https://website.net' }, { loc: 'https://website.net/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("generates a simple sitemap from partial URLs and a base URL", () => {
			expect(generateSitemapXML({
				baseURL:  'https://website.net',
				defaults: {},
				routes:   [],
				urls:     [{ loc: '/' }, { loc: '/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("removes trailing slashes", () => {
			expect(generateSitemapXML({
				baseURL:  'https://website.net',
				defaults: {},
				routes:   [],
				urls:     [{ loc: '/' }, { loc: '/about' }, { loc: '/page/' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url><url><loc>https://website.net/page</loc></url>`
			));
		});

		it("adds trailing slashes if the 'trailingSlash' option is set", () => {
			expect(generateSitemapXML({
				baseURL:  'https://website.net',
				defaults: {},
				routes:   [],
				urls:     [{ loc: '/' }, { loc: '/about' }, { loc: '/page/' }],
				trailingSlash: true,
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/</loc></url><url><loc>https://website.net/about/</loc></url><url><loc>https://website.net/page/</loc></url>`
			));
		});

		it("encodes URIs properly", () => {
			expect(generateSitemapXML({
				baseURL:  'https://website.net',
				defaults: {},
				routes:   [],
				urls:     [{ loc: '/search?color="always"&reverse-order' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/search?color=%22always%22&amp;reverse-order</loc></url>`
			));

			expect(generateSitemapXML({
				baseURL:  'https://éléphant.net',
				defaults: {},
				routes:   [],
				urls:     [{ loc: '/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://%C3%A9l%C3%A9phant.net/about</loc></url>`
			));
		});


		it("takes per-URL parameters into account", () => {
			expect(generateSitemapXML({
				baseURL:  '',
				defaults: {},
				routes:   [],
				urls:     [{
					loc:         'https://website.net/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));
		});

		it("takes default URL parameters into account", () => {
			expect(generateSitemapXML({
				baseURL:  '',
				defaults: {
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				},
				routes:   [],
				urls:     [{
					loc:         'https://website.net/about',
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));
		});

		it("prioritizes per-URL parameters over global defaults", () => {
			expect(generateSitemapXML({
				baseURL:  '',
				defaults: {
					changefreq:  'never',
					priority:    0.8,
				},
				routes:   [],
				urls:     [{
					loc:         'https://website.net/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));
		});
	});

	/**
	 * Routes
	 * ---------------------------------------------------------------------
	 */
	describe("from an array of routes", () => {

		/*
		it("generates a sitemap from simple routes", () => {
			expect(generateSitemapXML({
				baseURL:  'https://website.net',
				defaults: {},
				routes:   [{ path: '/' }, { path: '/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});
		*/
	});
});
