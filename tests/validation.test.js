
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
	 */
	it("there are extra properties on the main options object", () => {
		expect(validate({ someProp: true })).not.to.be.null;
	});
	it("both routes and URLs are provided", () => {
		expect(validateOptions({ urls: [{ loc: '/' }], routes: [{ path: '/' }] })).not.to.be.null;
	});

	/**
	 * Global options
	 */
	it("'baseURL' is not a proper URI", () => {
		expect(validate({ baseURL: 'not an URI' })).not.to.be.null;
		expect(validate({ baseURL: 'somedomain.wtf' })).not.to.be.null;
		expect(validate({ baseURL: 'https://missing-something' })).not.to.be.null;
	});
	// @TODO : default URL params
});
