
/**
 * tests/sitemap.test.js
 */

const { expect }             = require('chai');
const { generateSitemapXML } = require('../src/sitemap');

const wrapSitemapXML = _xml => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${_xml}</urlset>`;

describe('vue-cli-plugin-sitemap sitemap generation', () => {

	it("generates a simple sitemap from URLs", () => {
		expect(generateSitemapXML({
			urls: [{ loc:  }]
		})).to.equal(wrapSitemapXML(
			`<url><loc></loc>`
		));
	});

});
