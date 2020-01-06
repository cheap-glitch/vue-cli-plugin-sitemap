
/**
 * tests/validation.test.js
 */

const { expect }      = require('chai');
const validateOptions = require('../src/validation');

// Wrap the options to test in a minimal valid option object
const validate = _options => validateOptions({ baseURL: 'https://url.com', routes: [{ path: '/' }], ..._options});

describe("validation of the options returns an error when:", () => {

	/**
	 * Meta
	 * ---------------------------------------------------------------------
	 */
	it("there are extra properties on the main options object", () => {
		expect(validate({ someProp: true })).not.to.be.null;
	});

	it("neither routes nor URLs are provided", () => {
		expect(validateOptions({ pretty: true, baseURL: 'https://whatever.com' })).not.to.be.null;
		expect(validateOptions({ urls: [], routes: [] })).not.to.be.null;
	});

	/**
	 * Global options
	 * ---------------------------------------------------------------------
	 */
	it("'baseURL' is not a proper URI", () => {
		expect(validate({ baseURL: 'not an URI' })).not.to.be.null;
		expect(validate({ baseURL: 'somedomain.wtf' })).not.to.be.null;
		expect(validate({ baseURL: 'https://missing-something' })).not.to.be.null;

		expect(validate({ baseURL: 'https://domain.fr' })).to.be.null;
		expect(validate({ baseURL: 'http://www.other-domain.fr' })).to.be.null;
	});

	describe("the default URL meta tags are invalid, because", () => {

		it("'defaults' is not an object", () => {
			expect(validate({ defaults: true })).not.to.be.null;
			expect(validate({ defaults: 'weekly' })).not.to.be.null;
		});

		it("'defaults' has extraneous properties", () => {
			expect(validate({ defaults: { loc: '/lorem/ipsum' } })).not.to.be.null;
			expect(validate({ defaults: { path: '/lorem/ipsum' } })).not.to.be.null;
			expect(validate({ defaults: { path: '/lorem/ipsum' } })).not.to.be.null;
		});

		it("'lastmod' is not a Date object or a string", () => {
			expect(validate({ defaults: { lastmod: true } })).not.to.be.null;
			expect(validate({ defaults: { lastmod: { date: '2012-12-21' } } })).not.to.be.null;
		});

		it("'lastmod' is an invalid Date object", () => {
			expect(validate({ defaults: { lastmod: new Date('the first day of the universe') } })).not.to.be.null;
			expect(validate({ defaults: { lastmod: new Date('last tuesday, when it was raining') } })).not.to.be.null;
			expect(validate({ defaults: { lastmod: new Date('1867/45/90') } })).not.to.be.null;

			expect(validate({ defaults: { lastmod: new Date('2019-12-28') } })).to.be.null;
			expect(validate({ defaults: { lastmod: new Date('2019-12-28T21:17:34') } })).to.be.null;
		});

		it("'lastmod' is an invalid date", () => {
			expect(validate({ defaults: { lastmod: 'the first day of the universe' } })).not.to.be.null;
			expect(validate({ defaults: { lastmod: 'last tuesday, when it was raining' } })).not.to.be.null;
			expect(validate({ defaults: { lastmod: '1867/45/90' } })).not.to.be.null;

			expect(validate({ defaults: { lastmod: '2019-12-28' } })).to.be.null;
			expect(validate({ defaults: { lastmod: '2019-12-28T21:17:34' } })).to.be.null;
		});

		it("'changefreq' is not a valid value", () => {
			expect(validate({ defaults: { changefreq: 25 } })).not.to.be.null;
			expect(validate({ defaults: { changefreq: 'often' } })).not.to.be.null;
			expect(validate({ defaults: { changefreq: 'sometimes' } })).not.to.be.null;
			expect(validate({ defaults: { changefreq: 'every 12 seconds' } })).not.to.be.null;

			expect(validate({ defaults: { changefreq: 'monthly' } })).to.be.null;
			expect(validate({ defaults: { changefreq: 'never' } })).to.be.null;
		});

		it("'priority' is not a valid value", () => {
			expect(validate({ defaults: { priority: 'high' } })).not.to.be.null;
			expect(validate({ defaults: { priority: 100 } })).not.to.be.null;
			expect(validate({ defaults: { priority: 100.0 } })).not.to.be.null;
			expect(validate({ defaults: { priority: 1.1 } })).not.to.be.null;
			expect(validate({ defaults: { priority: 0.88 } })).not.to.be.null;
			expect(validate({ defaults: { priority: -1.0 } })).not.to.be.null;

			expect(validate({ defaults: { priority: 0.3 } })).to.be.null;
			expect(validate({ defaults: { priority: 0.8 } })).to.be.null;
			expect(validate({ defaults: { priority: 0.0 } })).to.be.null;
			expect(validate({ defaults: { priority: 0.1 } })).to.be.null;
		});
	});

	/**
	 * Routes
	 * ---------------------------------------------------------------------
	 */
	describe("the routes are invalid, because", () => {

		it("'routes' is not an array", () => {
			expect(validateOptions({ routes: {} })).not.to.be.null;
			expect(validateOptions({ routes: true })).not.to.be.null;
		});

		it("there is a route with no 'path' property", () => {
			expect(validate({ routes: [{}] })).not.to.be.null;
			expect(validate({ routes: [{ changefreq: 'weekly' }] })).not.to.be.null;
			expect(validate({ routes: [{ path: '/' }, {}] })).not.to.be.null;
			expect(validate({ routes: [{ path: '/' }, { changefreq: 'weekly' }] })).not.to.be.null;

			expect(validate({ routes: [{ path: '/' }] })).to.be.null;
			expect(validate({ routes: [{ path: '/' }, { path: '/about' }] })).to.be.null;
		});

		it("there is a route with invalid URL properties", () => {
			expect(validate({ routes: [{ path: '/', changefreq: true }] })).not.to.be.null;
			expect(validate({ routes: [{ path: '/', lastmod: 'yesterday' }] })).not.to.be.null;
			expect(validate({ routes: [{ path: '/', priority: 72 }] })).not.to.be.null;
			expect(validate({ routes: [{ path: '/', sitemap: { changefreq: true } }] })).not.to.be.null;
			expect(validate({ routes: [{ path: '/', sitemap: { lastmod: 'yesterday' } }] })).not.to.be.null;
			expect(validate({ routes: [{ path: '/', sitemap: { priority: 72 } }] })).not.to.be.null;
		});

		it("a route has invalid slugs", () => {
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: {} }] })).not.to.be.null;
			expect(validate({ routes: [{ path: '/user/:pseudo', slugs: [{}] }] })).not.to.be.null;
			expect(validate({ routes: [{ path: '/article/:title', slugs: [false, 'title'] }] })).not.to.be.null;
		});
	});

	/**
	 * URLs
	 * ---------------------------------------------------------------------
	 */
	describe("the URLs are invalid, because", () => {

		it("the 'urls' property is not an array", () => {
			expect(validateOptions({ urls: {} })).not.to.be.null;
			expect(validateOptions({ urls: 'https://mywebsite.com' })).not.to.be.null;

			expect(validateOptions({ urls: [{ loc: 'https://www.site.org' }] })).to.be.null;
		});

		it("some URLs are missing the 'loc' property", () => {
			expect(validateOptions({ urls: [{}]})).not.to.be.null;
			expect(validateOptions({ urls: [{ lastmod: '2020-01-01' }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'about' }, { changefreq: 'always' }]})).not.to.be.null;

			expect(validateOptions({ urls: [{ loc: 'https://website.com' }]})).to.be.null;
		});

		it("the locations are full URIs even though a base URL is provided", () => {
			expect(validateOptions({ baseURL: 'https://domain.com', urls: [{ loc: 'https://domain.com/about' }] })).not.to.be.null;
			expect(validateOptions({ baseURL: 'https://www.awesome-stuff.net', urls: [{ loc: 'https://www.awesome-stuff.net/about' }] })).not.to.be.null;

			expect(validateOptions({ baseURL: 'https://domain.com', urls: [{ loc: '/about' }] })).to.be.null;
			expect(validateOptions({ baseURL: 'https://www.awesome-stuff.net', urls: [{ loc: 'about' }] })).to.be.null;
		});

		it("the locations are partial URIs even though no base URL is provided", () => {
			expect(validateOptions({ urls: [{ loc: '/about' }] })).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'about' }] })).not.to.be.null;
		});

		it("there is an URL with invalid URL properties", () => {
			expect(validateOptions({ urls: [{ loc: 'https://website.com', changefreq: false }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', changefreq: {} }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', changefreq: 'sometimes' }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', lastmod: true }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', lastmod: 'yesterday' }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', priority: 'low' }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', priority: 'high' }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', priority: 10 }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', sitemap: { changefreq: false } }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', sitemap: { changefreq: {} } }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', sitemap: { changefreq: 'sometimes' } }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', sitemap: { lastmod: true } }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', sitemap: { lastmod: 'yesterday' } }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', sitemap: { priority: 'low' } }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', sitemap: { priority: 'high' } }]})).not.to.be.null;
			expect(validateOptions({ urls: [{ loc: 'https://website.com', sitemap: { priority: 10 } }]})).not.to.be.null;
		});
	});
});
