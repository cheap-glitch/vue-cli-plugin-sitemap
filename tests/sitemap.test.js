
/**
 * tests/sitemap.test.js
 */

const { expect }         = require('chai');
const generateSitemapXML = require('../src/sitemap');

// Wrap some <url> elements in the same XML elements as the sitemap
const wrapURLs = _xml => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${_xml}</urlset>`;

describe('vue-cli-plugin-sitemap sitemap generation', () => {

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

	// @TODO
});
