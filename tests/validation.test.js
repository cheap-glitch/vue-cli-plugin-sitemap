
/**
 * tests/validation.test.js
 */

const { expect }      = require('chai');
const validateOptions = require('../src/validation');

// Wrap the options to test in a minimal valid option object
const validate = _options => validateOptions({ routes: [{ path: '/' }], ..._options});

describe('validation of the options returns an error when:', () => {
	/**
	 * Meta
	 * ---------------------------------------------------------------------
	 */
	it("there are extra properties on the main options object", () => {
		expect(validate({ someProp: true })).not.to.be.null;
	});
	it("both routes and URLs are provided", () => {
		expect(validateOptions({ urls: [{ loc: '/' }], routes: [{ path: '/' }] })).not.to.be.null;
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
	describe("the default URL params are invalid, because", () => {
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
		// @TODO : changefreq
		// @TODO : priority
	});

	/**
	 * URLs
	 * ---------------------------------------------------------------------
	 */
	// @TODO

	/**
	 * Routes
	 * ---------------------------------------------------------------------
	 */
	// @TODO
});
