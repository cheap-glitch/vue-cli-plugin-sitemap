
/**
 * tests/sitemap.test.js
 */

const { expect }         = require('chai');
const validateOptions    = require('../src/validation');
const generateSitemapXML = require('../src/sitemap');

// Wrap some <url> elements in the same XML elements as the sitemap
const wrapURLs = _xml => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${_xml}</urlset>`;

describe("vue-cli-plugin-sitemap sitemap generation", () => {

	/**
	 * URLs
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	describe("from an array of URLs", () => {

		it("generates a simple sitemap from full URLs", () => {
			expect(generateSitemapXML({
				baseURL:   '',
				defaults:  {},
				routes:    [],
				urls:      [{ loc: 'https://website.net' }, { loc: 'https://website.net/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("generates a simple sitemap from partial URLs and a base URL", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				routes:    [],
				urls:      [{ loc: '/' }, { loc: '/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("removes trailing slashes", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				routes:    [],
				urls:      [{ loc: '/' }, { loc: '/about' }, { loc: '/page/' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url><url><loc>https://website.net/page</loc></url>`
			));
		});

		it("adds trailing slashes if the 'trailingSlash' option is set", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				routes:    [],
				urls:      [{ loc: '/' }, { loc: '/about' }, { loc: '/page/' }],
				trailingSlash: true,
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/</loc></url><url><loc>https://website.net/about/</loc></url><url><loc>https://website.net/page/</loc></url>`
			));
		});

		it("encodes URIs properly", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				routes:    [],
				urls:      [{ loc: '/search?color="always"&reverse-order' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/search?color=%22always%22&amp;reverse-order</loc></url>`
			));

			expect(generateSitemapXML({
				baseURL:   'https://éléphant.net',
				defaults:  {},
				routes:    [],
				urls:      [{ loc: '/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://%C3%A9l%C3%A9phant.net/about</loc></url>`
			));
		});

		it("takes per-URL meta tags into account", () => {
			expect(generateSitemapXML({
				baseURL:   '',
				defaults:  {},
				routes:    [],
				urls:      [{
					loc:         'https://website.net/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));
		});

		it("takes default meta tags into account", () => {
			expect(generateSitemapXML({
				baseURL:   '',
				defaults:  {
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				},
				routes:    [],
				urls:      [{
					loc:         'https://website.net/about',
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));
		});

		it("prioritizes per-URL meta tags over global defaults", () => {
			expect(generateSitemapXML({
				baseURL:   '',
				defaults:  {
					changefreq:  'never',
					priority:    0.8,
				},
				routes:    [],
				urls:      [{
					loc:         'https://website.net/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));
		});

		it("handles dates in various formats", () => {
			const data = {
				urls: [
					{
						loc:      'https://website.net/about',
						lastmod:  'December 17, 1995 03:24:00',
					},
					{
						loc:      'https://website.net/info',
						lastmod:  new Date('December 17, 1995 03:24:00'),
					},
				]
			};
			validateOptions(data);
			expect(generateSitemapXML(data)).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url><url><loc>https://website.net/info</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url>`
			));
		});

		it("writes whole-number priorities with a decimal", () => {
			expect(generateSitemapXML({
				baseURL:   '',
				defaults:  {},
				routes:    [],
				urls:      [
					{
						loc:         'https://website.net/about',
						priority:    1.0,
					},
					{
						loc:         'https://website.net/old',
						priority:    0.0,
					},
				]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><priority>1.0</priority></url><url><loc>https://website.net/old</loc><priority>0.0</priority></url>`
			));
		});
	});

	/**
	 * }}}
	 */

	/**
	 * Routes
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	describe("from an array of routes", () => {

		it("generates a sitemap from simple routes", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{ path: '/' }, { path: '/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("handles routes with a 'loc' property", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{ path: '/' }, { path: '/complicated/path/here', loc: '/about' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("removes trailing slashes", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{ path: '/' }, { path: '/about' }, { path: '/page/' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url><url><loc>https://website.net/page</loc></url>`
			));
		});

		it("adds trailing slashes if the 'trailingSlash' option is set", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{ path: '/' }, { path: '/about' }, { path: '/page/' }],
				trailingSlash: true,
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/</loc></url><url><loc>https://website.net/about/</loc></url><url><loc>https://website.net/page/</loc></url>`
			));
		});

		it("takes per-route meta tags into account", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{
					path:        '/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));

			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{
					path: '/about',
					sitemap: {
						changefreq:  'monthly',
						lastmod:     '2020-01-01',
						priority:    0.3,
					}
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));
		});

		it("takes default meta tags into account", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				},
				urls:      [],
				routes:    [{
					path: '/about',
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));
		});

		it("prioritizes per-route meta tags over global defaults", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {
					changefreq:  'never',
					priority:    0.8,
				},
				urls:      [],
				routes:    [{
					path:        '/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/about</loc><lastmod>2020-01-01</lastmod><changefreq>monthly</changefreq><priority>0.3</priority></url>`
			));
		});

		it("generates an URL for each slug", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{
					path:  '/article/:title',
					slugs: [
						'my-first-article',
						'3-tricks-to-better-fold-your-socks',
					]
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/article/my-first-article</loc></url><url><loc>https://website.net/article/3-tricks-to-better-fold-your-socks</loc></url>`
			));

			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{
					path:  '/article/:title',
					sitemap: {
						slugs: [
							'my-first-article',
							'3-tricks-to-better-fold-your-socks',
						]
					}
				}]
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net/article/my-first-article</loc></url><url><loc>https://website.net/article/3-tricks-to-better-fold-your-socks</loc></url>`
			));
		});

		it("ignores routes with the 'ignoreRoute' option set to 'true'", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{ path: '/' }, { path: '/about' }, { path: '/ignore/me', ignoreRoute: true }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("ignores the catch-all route", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{ path: '/' }, { path: '/about' }, { path: '*', name: '404' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("ignores dynamic routes with no slugs", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				urls:      [],
				routes:    [{ path: '/' }, { path: '/about' }, { path: '/user/:id' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});
	});

	/**
	 * }}}
	 */

	/**
	 * Routes + URLs
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	describe("from both routes and URLs", () => {

		it("generates a simple sitemap", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				routes:    [{ path: '/about' }],
				urls:      [{ loc:  '/' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});

		it("discards duplicate URLs", () => {
			expect(generateSitemapXML({
				baseURL:   'https://website.net',
				defaults:  {},
				routes:    [{ path: '/' }, { path: '/about' }],
				urls:      [{ loc:  '/' }],
			})).to.equal(wrapURLs(
				`<url><loc>https://website.net</loc></url><url><loc>https://website.net/about</loc></url>`
			));
		});
	});

	/**
	 * }}}
	 */
});
