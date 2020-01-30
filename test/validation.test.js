
/**
 * tests/validation.test.js
 */

const { expect }           = require('chai');
const { optionsValidator } = require('../src/validation');

// Wrap the options to test in a minimal valid option object
const validate = options => optionsValidator({ baseURL: 'https://url.com', routes: [{ path: '/' }], ...options});

describe("the validation of the options returns an error when:", () => {

	/**
	 * Meta
	 * ---------------------------------------------------------------------
	 */
	it("there are extra properties on the main options object", () => {
		expect(validate({ someProp: true })).to.be.false;
	});

	it("neither routes nor URLs are provided", () => {
		expect(optionsValidator({ pretty: true, baseURL: 'https://whatever.com' })).to.be.false;
		expect(optionsValidator({ urls: [], routes: [] })).to.be.false;
	});

	/**
	 * Global options
	 * ---------------------------------------------------------------------
	 */
	it("'outputDir' is not a string", () => {
		expect(validate({ outputDir: true })).to.be.false;
		expect(validate({ outputDir: 10 })).to.be.false;

		expect(validate({ outputDir: './sitemap' })).to.be.true;
	});

	it("'baseURL' is not a proper URI", () => {
		expect(validate({ baseURL: 'not an URI' })).to.be.false;
		expect(validate({ baseURL: 'somedomain.wtf' })).to.be.false;
		expect(validate({ baseURL: 'https://missing-something' })).to.be.false;

		expect(validate({ baseURL: 'https://domain.fr' })).to.be.true;
		expect(validate({ baseURL: 'http://www.other-domain.fr' })).to.be.true;
	});

	describe("the default URL meta tags are invalid, because", () => {

		it("'defaults' is not an object", () => {
			expect(validate({ defaults: true })).to.be.false;
			expect(validate({ defaults: 'weekly' })).to.be.false;
		});

		it("'defaults' has extraneous properties", () => {
			expect(validate({ defaults: { loc: '/lorem/ipsum' } })).to.be.false;
			expect(validate({ defaults: { path: '/lorem/ipsum' } })).to.be.false;
			expect(validate({ defaults: { path: '/lorem/ipsum' } })).to.be.false;
		});

		it("'lastmod' is not a Date object or a string", () => {
			expect(validate({ defaults: { lastmod: true } })).to.be.false;
			expect(validate({ defaults: { lastmod: { date: '2012-12-21' } } })).to.be.false;
		});

		it("'lastmod' is an invalid Date object", () => {
			expect(validate({ defaults: { lastmod: new Date('the first day of the universe') } })).to.be.false;
			expect(validate({ defaults: { lastmod: new Date('last tuesday, when it was raining') } })).to.be.false;
			expect(validate({ defaults: { lastmod: new Date('1867/45/90') } })).to.be.false;

			expect(validate({ defaults: { lastmod: new Date('2019-12-28') } })).to.be.true;
			expect(validate({ defaults: { lastmod: new Date('2019-12-28T21:17:34') } })).to.be.true;
		});

		it("'lastmod' is an invalid date", () => {
			expect(validate({ defaults: { lastmod: 'the first day of the universe' } })).to.be.false;
			expect(validate({ defaults: { lastmod: 'last tuesday, when it was raining' } })).to.be.false;
			expect(validate({ defaults: { lastmod: '1867/45/90' } })).to.be.false;

			expect(validate({ defaults: { lastmod: '2019-12-28' } })).to.be.true;
			expect(validate({ defaults: { lastmod: '2019-12-28T21:17:34' } })).to.be.true;
		});

		it("'lastmod' is an invalid timestamp", () => {
			expect(validate({ defaults: { lastmod: 99999999999999999 } })).to.be.false;

			expect(validate({ defaults: { lastmod: 1578485452000 } })).to.be.true;
		});

		it("'changefreq' is not a valid value", () => {
			expect(validate({ defaults: { changefreq: 25 } })).to.be.false;
			expect(validate({ defaults: { changefreq: 'often' } })).to.be.false;
			expect(validate({ defaults: { changefreq: 'sometimes' } })).to.be.false;
			expect(validate({ defaults: { changefreq: 'every 12 seconds' } })).to.be.false;

			expect(validate({ defaults: { changefreq: 'monthly' } })).to.be.true;
			expect(validate({ defaults: { changefreq: 'never' } })).to.be.true;
		});

		it("'priority' is not a valid value", () => {
			expect(validate({ defaults: { priority: 'high' } })).to.be.false;
			expect(validate({ defaults: { priority: 100 } })).to.be.false;
			expect(validate({ defaults: { priority: 100.0 } })).to.be.false;
			expect(validate({ defaults: { priority: 1.1 } })).to.be.false;
			expect(validate({ defaults: { priority: 0.88 } })).to.be.false;
			expect(validate({ defaults: { priority: -1.0 } })).to.be.false;

			expect(validate({ defaults: { priority: 0.3 } })).to.be.true;
			expect(validate({ defaults: { priority: 0.8 } })).to.be.true;
			expect(validate({ defaults: { priority: 0.0 } })).to.be.true;
			expect(validate({ defaults: { priority: 0.1 } })).to.be.true;
		});
	});

	/**
	 * Routes
	 * ---------------------------------------------------------------------
	 */
	describe("the routes are invalid, because", () => {

		it("'routes' is not an array", () => {
			expect(optionsValidator({ routes: {} })).to.be.false;
			expect(optionsValidator({ routes: true })).to.be.false;
		});

		it("there is a route with no 'path' property", () => {
			expect(validate({ routes: [{}] })).to.be.false;
			expect(validate({ routes: [{ changefreq: 'weekly' }] })).to.be.false;
			expect(validate({ routes: [{ path: '/' }, {}] })).to.be.false;
			expect(validate({ routes: [{ path: '/' }, { changefreq: 'weekly' }] })).to.be.false;

			expect(validate({ routes: [{ path: '/' }] })).to.be.true;
			expect(validate({ routes: [{ path: '/' }, { path: '/about' }] })).to.be.true;
		});

		it("there is a route with invalid URL properties", () => {
			expect(validate({ routes: [{ path: '/', changefreq: true }] })).to.be.false;
			expect(validate({ routes: [{ path: '/', lastmod: 'yesterday' }] })).to.be.false;
			expect(validate({ routes: [{ path: '/', priority: 72 }] })).to.be.false;
			expect(validate({ routes: [{ path: '/', sitemap: { changefreq: true } }] })).to.be.false;
			expect(validate({ routes: [{ path: '/', sitemap: { lastmod: 'yesterday' } }] })).to.be.false;
			expect(validate({ routes: [{ path: '/', sitemap: { priority: 72 } }] })).to.be.false;
		});

		it("a route has invalid slugs", () => {
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: {} }] })).to.be.false;
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: [{}] }] })).to.be.false;
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: [{ changefreq: 'yearly', priority: 1.0 }] }] })).to.be.false;
			expect(validate({ routes: [{ path: '/article/:title', slugs: [false, 'title'] }] })).to.be.false;

			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: ['ok', 'pseudo'] }] })).to.be.true;
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: ['ok', { slug: 'pseudo'}] }] })).to.be.true;
		});

		it("a route has slugs with invalid meta tags", () => {
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: [{ slug: 'pseudo', priority: 22 }] }] })).to.be.false;
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: [{ slug: 'pseudo', priority: 'high' }] }] })).to.be.false;
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: [{ slug: 'pseudo', lastmod: 'a while ago' }] }] })).to.be.false;
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: [{ slug: 'pseudo', changefreq: 'a whole lot' }] }] })).to.be.false;
		});
	});

	/**
	 * URLs
	 * ---------------------------------------------------------------------
	 */
	describe("the URLs are invalid, because", () => {

		it("the 'urls' property is not an array", () => {
			expect(optionsValidator({ urls: {} })).to.be.false;
			expect(optionsValidator({ urls: 'https://mywebsite.com' })).to.be.false;

			expect(optionsValidator({ urls: ['https://www.site.org'] })).to.be.true;
			expect(optionsValidator({ urls: [{ loc: 'https://www.site.org' }] })).to.be.true;
		});

		it("some URLs are missing the 'loc' property", () => {
			expect(optionsValidator({ urls: [{}]})).to.be.false;
			expect(optionsValidator({ urls: [{ lastmod: '2020-01-01' }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'about' }, { changefreq: 'always' }]})).to.be.false;

			expect(optionsValidator({ urls: ['https://website.com', { loc: 'https://website.com/about' }]})).to.be.true;
		});

		it("the locations are full URIs even though a base URL is provided", () => {
			expect(optionsValidator({ baseURL: 'https://domain.com', urls: ['https://domain.com/about'] })).to.be.false;
			expect(optionsValidator({ baseURL: 'https://domain.com', urls: [{ loc: 'https://domain.com/about' }] })).to.be.false;
			expect(optionsValidator({ baseURL: 'https://www.awesome-stuff.net', urls: ['https://www.awesome-stuff.net/about'] })).to.be.false;
			expect(optionsValidator({ baseURL: 'https://www.awesome-stuff.net', urls: [{ loc: 'https://www.awesome-stuff.net/about' }] })).to.be.false;

			expect(optionsValidator({ baseURL: 'https://domain.com', urls: ['/about'] })).to.be.true;
			expect(optionsValidator({ baseURL: 'https://domain.com', urls: [{ loc: '/about' }] })).to.be.true;
			expect(optionsValidator({ baseURL: 'https://www.awesome-stuff.net', urls: ['about'] })).to.be.true;
			expect(optionsValidator({ baseURL: 'https://www.awesome-stuff.net', urls: [{ loc: 'about' }] })).to.be.true;
		});

		it("the locations are partial URIs even though no base URL is provided", () => {
			expect(optionsValidator({ urls: ['/about'] })).to.be.false;
			expect(optionsValidator({ urls: [{ loc: '/about' }] })).to.be.false;
			expect(optionsValidator({ urls: ['about'] })).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'about' }] })).to.be.false;
		});

		it("there is an URL with invalid URL properties", () => {
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', changefreq: false }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', changefreq: {} }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', changefreq: 'sometimes' }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', lastmod: true }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', lastmod: 'yesterday' }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', priority: 'low' }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', priority: 'high' }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', priority: 10 }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', sitemap: { changefreq: false } }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', sitemap: { changefreq: {} } }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', sitemap: { changefreq: 'sometimes' } }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', sitemap: { lastmod: true } }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', sitemap: { lastmod: 'yesterday' } }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', sitemap: { priority: 'low' } }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', sitemap: { priority: 'high' } }]})).to.be.false;
			expect(optionsValidator({ urls: [{ loc: 'https://website.com', sitemap: { priority: 10 } }]})).to.be.false;
		});
	});
});
