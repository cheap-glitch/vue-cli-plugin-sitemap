const chai                 = require('chai');
const expect               = chai.expect;
const chaiAsPromised       = require('chai-as-promised');

const { generateSitemaps } = require('../src/sitemap');
const { validateOptions  } = require('../src/validation');

chai.use(chaiAsPromised);

describe("single sitemap", () => {

	/**
	 * URLs
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	describe("from an array of URLs", () => {

		it("generates a simple sitemap from full URLs", async () => {
			expect(await generate({
				urls: ['https://example.com', 'https://example.com/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));

			expect(await generate({
				urls: [{ loc: 'https://example.com' }, { loc: 'https://example.com/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));
		});

		it("generates a simple sitemap from partial URLs and a base URL", async () => {
			expect(await generate({
				baseURL:   'https://example.com',
				urls:      ['/', '/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));

			expect(await generate({
				baseURL:   'https://example.com',
				urls:      [{ loc: '/' }, { loc: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));

			expect(await generate({
				baseURL:   'https://example.com:7000',
				urls:      ['/', '/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com:7000</loc></url><url><loc>https://example.com:7000/about</loc></url>'
			));

			expect(await generate({
				baseURL:   'https://162.75.90.1',
				urls:      ['/', '/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://162.75.90.1</loc></url><url><loc>https://162.75.90.1/about</loc></url>'
			));
		});

		it("removes trailing slashes", async () => {
			expect(await generate({
				baseURL:   'https://example.com',
				urls:      ['/', '/about', '/page'],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>',
				'<url><loc>https://example.com/page</loc></url>',
			]));
		});

		it("adds trailing slashes if the `trailingSlash` option is set", async () => {
			expect(await generate({
				trailingSlash: true,
				baseURL:   'https://example.com',
				urls:      ['/', '/about', '/page'],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/</loc></url><url><loc>https://example.com/about/</loc></url>',
				'<url><loc>https://example.com/page/</loc></url>',
			]));
		});

		it("encodes uris properly", async () => {
			expect(await generate({
				baseURL:   'https://example.com',
				urls:      ['/search?color="always"&reverse-order'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com/search?color=%22always%22&amp;reverse-order</loc></url>'
			));

			expect(await generate({
				baseURL:   'https://éléphant.net',
				defaults:  {},
				routes:    [],
				urls:      ['/about'],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://%C3%A9l%C3%A9phant.net/about</loc></url>'
			));
		});

		it("takes per-url meta tags into account", async () => {
			expect(await generate({
				urls: [{
					loc:         'https://example.com/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://example.com/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("takes default meta tags into account", async () => {
			expect(await generate({
				defaults:  {
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				},
				urls: ['https://example.com/about'],
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://example.com/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("prioritizes per-url meta tags over global defaults", async () => {
			expect(await generate({
				defaults:  {
					changefreq:  'never',
					priority:    0.8,
				},
				urls: [{
					loc:         'https://example.com/about',
					changefreq:  'monthly',
					lastmod:     '2020-01-01',
					priority:    0.3,
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://example.com/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("handles dates in various formats", async () => {
			const data = {
				urls: [
					{
						loc:      'https://example.com/about',
						lastmod:  'December 17, 1995 03:24:00',
					},
					{
						loc:      'https://example.com/info',
						lastmod:  new Date('December 17, 1995 03:24:00'),
					},
					{
						loc:      'https://example.com/page',
						lastmod:  1578485826000,
					},
				]
			};
			validateOptions(data);
			expect(await generate(data)).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/about</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url>',
				'<url><loc>https://example.com/info</loc><lastmod>1995-12-17T02:24:00.000Z</lastmod></url>',
				'<url><loc>https://example.com/page</loc><lastmod>2020-01-08T12:17:06.000Z</lastmod></url>',
			]));
		});

		it("writes whole-number priorities with a decimal", async () => {
			expect(await generate({
				urls: [
					{
						loc:         'https://example.com/about',
						priority:    1.0,
					},
					{
						loc:         'https://example.com/old',
						priority:    0.0,
					},
				]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/about</loc><priority>1.0</priority></url>',
				'<url><loc>https://example.com/old</loc><priority>0.0</priority></url>',
			]));
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

		it("generates a sitemap from simple routes", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/' }, { path: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));
		});

		it("handles routes with a `loc` property", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/' }, { path: '/complicated/path/here', meta: { sitemap: { loc: '/about' } } }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));
		});

		it("removes trailing slashes", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/' }, { path: '/about' }, { path: '/page/' }],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>',
				'<url><loc>https://example.com/page</loc></url>',
			]));
		});

		it("adds trailing slashes if the `trailingSlash` option is set", async () => {
			expect(await generate({
				baseURL:       'https://example.com',
				routes:        [{ path: '/' }, { path: '/about' }, { path: '/page/' }],
				trailingSlash: true,
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/</loc></url>',
				'<url><loc>https://example.com/about/</loc></url>',
				'<url><loc>https://example.com/page/</loc></url>',
			]));
		});

		it("supports hash mode if the option is set", async () => {
			expect(await generate({
				baseURL:  'https://example.com',
				routes:   [{ path: '/' }, { path: '/about' }, { path: '/page' }],
				hashMode: true,
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/#</loc></url>',
				'<url><loc>https://example.com/#/about</loc></url>',
				'<url><loc>https://example.com/#/page</loc></url>',
			]));
		});

		it("supports hash mode if `hashMode` is set to `true`", async () => {
			expect(await generate({
				baseURL:  'https://example.com',
				routes:   [{ path: '/' }, { path: '/about' }, { path: '/page' }],
				hashMode: true,
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/#</loc></url>',
				'<url><loc>https://example.com/#/about</loc></url>',
				'<url><loc>https://example.com/#/page</loc></url>',
			]));
		});

		it("works with both `trailingSlash` and `hashMode`", async () => {
			expect(await generate({
				baseURL:       'https://example.com',
				routes:        [{ path: '/' }, { path: '/about' }, { path: '/page' }],
				hashMode:      true,
				trailingSlash: true,
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/#/</loc></url>',
				'<url><loc>https://example.com/#/about/</loc></url>',
				'<url><loc>https://example.com/#/page/</loc></url>',
			]));
		});

		it("takes per-route meta tags into account", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/about',
					meta: {
						sitemap: {
							changefreq: 'monthly',
							lastmod:    '2020-01-01',
							priority:   0.3,
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://example.com/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("ignores other non-sitemap-related meta properties", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/about',
					meta: {
						progressbar: {
							color: 'pink',
							width: '10px',
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/about</loc></url>',
			]));

			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/about',
					meta: {
						progressbar: {
							color:      'pink',
							width:      '10px',
						},
						sitemap: {
							changefreq: 'monthly',
							lastmod:    '2020-01-01',
							priority:   0.3,
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://example.com/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("takes default meta tags into account", async () => {
			expect(await generate({
				baseURL:  'https://example.com',
				defaults: {
					changefreq: 'monthly',
					lastmod:    '2020-01-01',
					priority:   0.3,
				},
				routes: [{ path: '/about' }]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://example.com/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("prioritizes per-route meta tags over global defaults", async () => {
			expect(await generate({
				baseURL:  'https://example.com',
				defaults: {
					changefreq:  'never',
					priority:    0.8,
				},
				routes: [{
					path: '/about',
					meta: {
						sitemap: {
							changefreq: 'monthly',
							lastmod:    '2020-01-01',
							priority:   0.3,
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://example.com/about</loc>',
					'<lastmod>2020-01-01</lastmod>',
					'<changefreq>monthly</changefreq>',
					'<priority>0.3</priority>',
				'</url>',
			]));
		});

		it("generates an URL for each slug", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/article/:title',
					meta: {
						sitemap: {
							slugs: [
								'my-first-article',
								'3-tricks-to-better-fold-your-socks',
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/article/my-first-article</loc></url>',
				'<url><loc>https://example.com/article/3-tricks-to-better-fold-your-socks</loc></url>',
			]));
		});

		it("works for multiple parameters", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/article/:category/:id/:title',
					meta: {
						sitemap: {
							slugs: [
								{
									id:       1,
									category: 'blog',
									title:    'my-first-article',
								},
								{
									id:       14,
									category: 'lifehacks',
									title:    '3-tricks-to-better-fold-your-socks',
								},
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/article/blog/1/my-first-article</loc></url>',
				'<url><loc>https://example.com/article/lifehacks/14/3-tricks-to-better-fold-your-socks</loc></url>',
			]));
		});

		it("works with optional and regexp-tested parameters", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/article/:category/:id(\\d+)/:title?',
					meta: {
						sitemap: {
							slugs: [
								{
									id:       1,
									category: 'blog',
									title:    'my-first-article',
								},
								{
									id:       3,
									category: 'misc',
									title:    '',
								},
								{
									id:       14,
									category: 'lifehacks',
									title:    '3-tricks-to-better-fold-your-socks',
								},
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/article/blog/1/my-first-article</loc></url>',
				'<url><loc>https://example.com/article/misc/3</loc></url>',
				'<url><loc>https://example.com/article/lifehacks/14/3-tricks-to-better-fold-your-socks</loc></url>',
			]));
		});

		it("removes duplicate slugs", async () => {
			expect(await generate({
				baseURL:  'https://example.com',
				defaults: {},
				urls:     [],

				routes: [{
					path: '/article/:title',
					meta: {
						sitemap: {
							slugs: [
								'my-first-article',
								'my-first-article',
								'3-tricks-to-better-fold-your-socks',
								'3-tricks-to-better-fold-your-socks',
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/article/my-first-article</loc></url>',
				'<url><loc>https://example.com/article/3-tricks-to-better-fold-your-socks</loc></url>',
			]));
		});

		it("takes slug-specific meta tags into account", async () => {
			expect(await generate({
				baseURL:  'https://example.com',
				defaults: {},
				urls:     [],

				routes: [{
					path: '/article/:title',
					meta: {
						sitemap: {
							slugs: [
								'my-first-article',
								{
									title:      '3-tricks-to-better-fold-your-socks',
									changefreq: 'never',
									lastmod:    '2018-06-24',
									priority:   0.8,
								}
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/article/my-first-article</loc></url>',
				'<url>',
					'<loc>https://example.com/article/3-tricks-to-better-fold-your-socks</loc>',
					'<lastmod>2018-06-24</lastmod>',
					'<changefreq>never</changefreq>',
					'<priority>0.8</priority>',
				'</url>',
			]));
			expect(await generate({
				baseURL:  'https://example.com',
				defaults: {},
				urls:     [],

				routes: [{
					path: '/article/:category/:title',
					meta: {
						sitemap: {
							slugs: [
								{
									title:      'my-first-article',
									category:   'blog',
								},
								{
									title:      '3-tricks-to-better-fold-your-socks',
									category:   'lifehacks',

									changefreq: 'never',
									lastmod:    '2018-06-24',
									priority:   0.8,
								},
							]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/article/blog/my-first-article</loc></url>',
				'<url>',
					'<loc>https://example.com/article/lifehacks/3-tricks-to-better-fold-your-socks</loc>',
					'<lastmod>2018-06-24</lastmod>',
					'<changefreq>never</changefreq>',
					'<priority>0.8</priority>',
				'</url>',
			]));
		});

		it("prioritizes slug-specific meta tags over route meta tags and global defaults", async () => {
			expect(await generate({
				baseURL:  'https://example.com',
				defaults: {
					priority:    0.1,
					changefreq:  'always',
				},
				routes: [{
					path: '/article/:title',
					meta: {
						sitemap: {
							lastmod: '2020-01-01',
							slugs: [{
								title:      '3-tricks-to-better-fold-your-socks',
								changefreq: 'never',
								lastmod:    '2018-06-24',
								priority:   0.8,
							}]
						}
					}
				}]
			})).to.deep.equal(wrapSitemap([
				'<url>',
					'<loc>https://example.com/article/3-tricks-to-better-fold-your-socks</loc>',
					'<lastmod>2018-06-24</lastmod>',
					'<changefreq>never</changefreq>',
					'<priority>0.8</priority>',
				'</url>',
			]));
		});

		it("accepts a synchronous generator for the slugs", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/user/:id',
					meta: { sitemap: { slugs: () => [1, 2, 3] } },
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/user/1</loc></url>',
				'<url><loc>https://example.com/user/2</loc></url>',
				'<url><loc>https://example.com/user/3</loc></url>',
			]));
		});

		it("accepts an asynchronous generator for the slugs", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/user/:id',
					meta: { sitemap: { slugs: async () => [1, 2, 3] } },
				}]
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/user/1</loc></url>',
				'<url><loc>https://example.com/user/2</loc></url>',
				'<url><loc>https://example.com/user/3</loc></url>',
			]));
		});

		it("ignores routes with the 'ignoreRoute' option set to `true`", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/' }, { path: '/about' }, { path: '/ignore/me', meta: { sitemap: { ignoreRoute: true } } }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));
		});

		it("ignores the catch-all route", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/' }, { path: '/about' }, { path: '*', name: '404' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));
		});

		it("ignores routes with a glob in their path", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/' }, { path: '/about' }, { path: '/glob/*' }, { path: '/another/*/glob' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));
		});

		it("include glob routes that have a `loc` meta property", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/' }, { path: '/about' }, { path: '/lorem/ipsum/*', meta: { sitemap: { loc: '/lorem/ipsum/dolor' } } }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url><url><loc>https://example.com/lorem/ipsum/dolor</loc></url>'
			));
		});

		it("throws an error when dynamic routes are not given slugs", async () => {
			return expect(Promise.resolve(generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/' }, { path: '/about' }, { path: '/user/:id' }],
			}))).to.eventually.be.rejected;
		});

		it("throws an error when slugs don't match the regex pattern of their corresponding parameter", async () => {
			return expect(Promise.resolve(generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/user/:id(\\d+)', meta: { sitemap: { slugs: [1, 2, 'invalid-slug'] } } }],
			}))).to.eventually.be.rejected;
		});

		it("throws an error if the asynchronously generated slugs are invalid", async () => {
			return expect(Promise.resolve(generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/user/:id',
					meta: { sitemap: { slugs: async () => [null] } },
				}]
			}))).to.eventually.be.rejected;
		});

		it("throws an error if the parameter of a dynamic route doesn't have an associated slug", async () => {
			return expect(Promise.resolve(generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/user/:id',
					meta: { sitemap: { slugs: [{ title: 5 }] } },
				}]
			}))).to.eventually.be.rejected;
		});
	});
	/**
	 * }}}
	 */

	/**
	 * Nested routes
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	describe("from an array of nested routes", () => {

		it("generates a sitemap from nested routes", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/', children: [{ path: '/about' }] }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com/about</loc></url>'
			));
		});

		it("generates a sitemap from deeply nested routes", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/',
					children: [{
						path: '/about',
						children: [{
							path: '/contact',
							children: [{
								path: '/infos'
							}]
						}]
					}]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/infos</loc></url>',
			]));
		});

		it("generates a sitemap from nested routes with relative paths", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/',
					children: [{
						path: 'about',
						children: [{
							path: 'contact',
							children: [{
								path: 'infos'
							}]
						}]
					}]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/about/contact/infos</loc></url>',
			]));
		});

		it("generates a sitemap from nested routes and parent routes", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/',
					children: [
						{ path: '' },
						{
							path: 'about',
							children: [
								{ path: '' },
								{
									path: 'contact',
									children: [{ path: '' }, { path: 'infos' }]
								},
							]
						},
					]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com</loc></url>',
				'<url><loc>https://example.com/about</loc></url>',
				'<url><loc>https://example.com/about/contact</loc></url>',
				'<url><loc>https://example.com/about/contact/infos</loc></url>',
			]));
		});

		it("generates a sitemap from nested routes with relative and absolute paths", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/',
					children: [{
						path: 'about',
						children: [{
							path: '/contact',
							children: [{
								path: 'infos'
							}]
						}]
					}]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/contact/infos</loc></url>',
			]));
		});

		it("generates a sitemap from nested dynamic routes", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/site',
					children: [
						{
							path: 'user/:id',
							meta: { sitemap: { slugs: [1, 2] } },
						},
						{
							path: 'article/:title',
							meta: { sitemap: { slugs: ['hello-world', 'on-folding-socks'] } },
						}
					]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/site/user/1</loc></url>',
				'<url><loc>https://example.com/site/user/2</loc></url>',
				'<url><loc>https://example.com/site/article/hello-world</loc></url>',
				'<url><loc>https://example.com/site/article/on-folding-socks</loc></url>',
			]));
		});

		it("generates a sitemap from dynamic routes with children", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/user/:id',
					meta: { sitemap: { slugs: [1, 2] } },

					children: [{ path: 'posts' }, { path: 'profile' }]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/user/1/posts</loc></url>',
				'<url><loc>https://example.com/user/1/profile</loc></url>',
				'<url><loc>https://example.com/user/2/posts</loc></url>',
				'<url><loc>https://example.com/user/2/profile</loc></url>',
			]));
		});

		it("generates a sitemap from nested dynamic routes", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/user/:id',
					meta: { sitemap: { slugs: [1, 2] } },

					children: [{
						path: 'post/:id',
						meta: { sitemap: { slugs: [1, 2] } }
					}]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/user/1/post/1</loc></url>',
				'<url><loc>https://example.com/user/1/post/2</loc></url>',
				'<url><loc>https://example.com/user/2/post/1</loc></url>',
				'<url><loc>https://example.com/user/2/post/2</loc></url>',
			]));
		});

		it("generates a sitemap from nested dynamic routes with multiple parameters", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/user/:pseudo/:id',
					meta: { sitemap: { slugs: [
						{ id: 1, pseudo: 'foo' },
						{ id: 2, pseudo: 'bar' },
					] } },

					children: [{
						path: 'post/:title/:id',
						meta: { sitemap: { slugs: [
							{ id: 1, title: 'foobar' },
							{ id: 2, title: 'foobaz' },
						] } }
					}]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/user/foo/1/post/foobar/1</loc></url>',
				'<url><loc>https://example.com/user/foo/1/post/foobaz/2</loc></url>',
				'<url><loc>https://example.com/user/bar/2/post/foobar/1</loc></url>',
				'<url><loc>https://example.com/user/bar/2/post/foobaz/2</loc></url>',
			]));
		});

		it("ignores children routes if the parent route is ignored", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/', meta: { sitemap: { ignoreRoute: true } }, children: [{ path: '/about' }] }],
			})).to.deep.equal(wrapSitemap(''));
		});

		it("takes meta properties from nested routes into account", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/',
					children: [
						{ path: '/about', meta: { sitemap: { lastmod: '2020-02-03' } } },
						{ path: '/error', meta: { sitemap: { ignoreRoute: true     } } },
						{ path: '/blog',
							children: [
								{ path: 'articles', meta: { sitemap: { priority: 1.0 } } },
								{ path: 'notes',    meta: { sitemap: { priority: 0.5 } } },
							]
						},
					]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/about</loc><lastmod>2020-02-03</lastmod></url>',
				'<url><loc>https://example.com/blog/articles</loc><priority>1.0</priority></url>',
				'<url><loc>https://example.com/blog/notes</loc><priority>0.5</priority></url>',
			]));
		});

		it("inherits meta properties form parent routes in nested routes", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/',
					children: [
						{ path: '/about', meta: { sitemap: { lastmod: '2020-02-03' } } },
						{ path: '/error', meta: { sitemap: { ignoreRoute: true     } } },
						{ path: '/blog',  meta: { sitemap: { changefreq: 'weekly'  } },
							children: [
								{ path: 'articles', meta: { sitemap: { priority: 1.0 } } },
								{ path: 'notes',    meta: { sitemap: { priority: 0.5 } } },
							]
						},
					]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/about</loc><lastmod>2020-02-03</lastmod></url>',
				'<url><loc>https://example.com/blog/articles</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>',
				'<url><loc>https://example.com/blog/notes</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>',
			]));
		});

		it("overwrites inherited meta properties", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{
					path: '/',
					children: [
						{ path: '/about', meta: { sitemap: { lastmod: '2020-02-03' } } },
						{ path: '/error', meta: { sitemap: { ignoreRoute: true     } } },
						{ path: '/blog',  meta: { sitemap: { changefreq: 'weekly'  } },
							children: [
								{ path: 'articles', meta: { sitemap: { priority: 1.0 } } },
								{ path: 'notes',    meta: { sitemap: { priority: 0.5, changefreq: 'monthly' } } },
							]
						},
					]
				}],
			})).to.deep.equal(wrapSitemap([
				'<url><loc>https://example.com/about</loc><lastmod>2020-02-03</lastmod></url>',
				'<url><loc>https://example.com/blog/articles</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>',
				'<url><loc>https://example.com/blog/notes</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>',
			]));
		});

		it("takes the `loc` property into account", async () => {
			expect(await generate({
				baseURL: 'https://example.com',
				routes:  [{ path: '/', meta: { sitemap: { loc: '/other-path' } }, children: [{ path: 'about' }] }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com/other-path/about</loc></url>'
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

		it("generates a simple sitemap", async () => {
			expect(await generate({
				baseURL:   'https://example.com',
				urls:      ['/'],
				routes:    [{ path: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));
		});

		it("discards duplicate URLs", async () => {
			expect(await generate({
				baseURL:   'https://example.com',
				urls:      ['/'],
				routes:    [{ path: '/' }, { path: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));
		});

		it("prioritizes handwritten URLs over routes", async () => {
			expect(await generate({
				baseURL:   'https://example.com',
				urls:      ['/'],
				routes:    [{ path: '/', meta: { sitemap: { changefreq: 'always' } } }, { path: '/about' }],
			})).to.deep.equal(wrapSitemap(
				'<url><loc>https://example.com</loc></url><url><loc>https://example.com/about</loc></url>'
			));
		});
	});
	/**
	 * }}}
	 */

	/**
	 * Misc
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	it("keeps tabs and line breaks when option `pretty` is specified", async () => {
		expect((await generate({
			baseURL:   'https://example.com',
			routes:    [{ path: '/about' }],
			urls:      ['/'],
		}, true)).sitemap).to.include('\t', '\n');
	});
	/**
	 * }}}
	 */
});

describe("multiple sitemaps", () => {

	/**
	 * URLs
	 * {{{
	 * ---------------------------------------------------------------------
	 */
	it("generates several sitemaps and a sitemap index if the total number of URLs exceeds 50,000", async () => {
		expect(await generate({
			urls:    [...Array(50001).keys()].map(n => `https://example.com/${n+1}`)
		})).to.deep.equal({
			'sitemap-part-1': wrapSitemapXML([...Array(50000).keys()].map(n => `<url><loc>https://example.com/${n+1}</loc></url>`)),
			'sitemap-part-2': wrapSitemapXML('<url><loc>https://example.com/50001</loc></url>'),
			'sitemap-index':  wrapSitemapIndexXML([
				'<sitemap><loc>/sitemap-part-1.xml</loc></sitemap>',
				'<sitemap><loc>/sitemap-part-2.xml</loc></sitemap>',
			]),
		});

		expect(await generate({
			baseURL: 'https://example.com',
			urls:    [...Array(50001).keys()].map(n => `${n+1}`)
		})).to.deep.equal({
			'sitemap-part-1': wrapSitemapXML([...Array(50000).keys()].map(n => `<url><loc>https://example.com/${n+1}</loc></url>`)),
			'sitemap-part-2': wrapSitemapXML('<url><loc>https://example.com/50001</loc></url>'),
			'sitemap-index':  wrapSitemapIndexXML([
				'<sitemap><loc>https://example.com/sitemap-part-1.xml</loc></sitemap>',
				'<sitemap><loc>https://example.com/sitemap-part-2.xml</loc></sitemap>',
			]),
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
	it("generates several sitemaps and a sitemap index if the total number of routes exceeds 50,000", async () => {
		expect(await generate({
			baseURL: 'https://example.com',
			routes:  [{
				path: '/user/:id',
				meta: {
					sitemap: {
						slugs: [...Array(50001).keys()].map(n => n +1)
					}
				}
			}]
		})).to.deep.equal({
			'sitemap-part-1': wrapSitemapXML([...Array(50000).keys()].map(n => `<url><loc>https://example.com/user/${n+1}</loc></url>`)),
			'sitemap-part-2': wrapSitemapXML('<url><loc>https://example.com/user/50001</loc></url>'),
			'sitemap-index':  wrapSitemapIndexXML([
				'<sitemap><loc>https://example.com/sitemap-part-1.xml</loc></sitemap>',
				'<sitemap><loc>https://example.com/sitemap-part-2.xml</loc></sitemap>',
			]),
		});
	});
	/**
	 * }}}
	 */
});

/**
 * Call 'generateSitemaps' with some default options
 * Also take care of the removing of the formatting characters
 */
async function generate(options, pretty = false) {
	const sitemaps = await generateSitemaps({
		baseURL:  '',
		defaults: {},

		routes:   [],
		urls:     [],

		...options,
	});

	if (!pretty) Object.keys(sitemaps).forEach(sitemap => sitemaps[sitemap] = sitemaps[sitemap].replace(/\t+|\n/g, ''));

	return sitemaps;
}

/**
 * Wrap a sitemap inside an object to mimic
 * the output of 'generateSitemaps' with a single sitemap
 */
function wrapSitemap(sitemap) {
	return { sitemap: wrapSitemapXML(sitemap) };
}

/**
 * Wrap some XML inside the markup of a sitemap
 */
function wrapSitemapXML(xml) {
	return '<?xml version="1.0" encoding="UTF-8"?>'
	     + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
	         + (Array.isArray(xml) ? xml.join('') : xml)
	     + '</urlset>';
}

/**
 * Wrap some XML inside the markup of a sitemap index
 */
function wrapSitemapIndexXML(xml) {
	return '<?xml version="1.0" encoding="UTF-8"?>'
	     + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
	         + (Array.isArray(xml) ? xml.join('') : xml)
	     + '</sitemapindex>';
}
