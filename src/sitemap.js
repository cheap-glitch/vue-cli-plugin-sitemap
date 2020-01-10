
/**
 * src/sitemap.js
 */

const { ajv, slugsValidator } = require('./validation');

async function generateSitemapXML(_options)
{
	// If a base URL is specified, make sure it ends with a slash
	const baseURL = _options.baseURL ? `${_options.baseURL.replace(/\/+$/, '')}/` : '';

	const urls = [..._options.urls, ...await generateURLsFromRoutes(_options.routes)]
		// Generate the location of each URL
		.map(_url => ({ ..._url, loc: escapeUrl(baseURL + _url.loc.replace(/^\//, '')).replace(/\/$/, '') + (_options.trailingSlash ? '/' : '') }))
		// Remove duplicate URLs (static URLs have preference over routes)
		.filter((_url, _index, _urls) => !('path' in _url) || _urls.every((__url, __index) => (_url.loc != __url.loc || _index == __index)));

	const sitemap =
	       '<?xml version="1.0" encoding="UTF-8"?>\n'
	     + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
	     +     `${urls.map(__url => generateURLTag(__url, _options)).join('')}`
	     + '</urlset>';

	return _options.pretty ? sitemap : sitemap.replace(/\t|\n/g, '');
}

function generateURLTag(_url, _options)
{
	const metaTags = ['lastmod', 'changefreq', 'priority'].map(function(__tag)
	{
		if (__tag in _url == false && __tag in _options.defaults == false)
			return '';

		let value = (__tag in _url) ? _url[__tag] : _options.defaults[__tag];

		// Fix the bug of whole-number priorities
		if (__tag == 'priority')
		{
			if (value === 0) value = '0.0';
			if (value === 1) value = '1.0';
		}

		return `\t\t<${__tag}>${value}</${__tag}>\n`;
	});

	return `\t<url>\n\t\t<loc>${_url.loc}</loc>\n${metaTags.join('')}\t</url>\n`;
}

function escapeUrl(_url)
{
	return encodeURI(_url)
		.replace('&',  '&amp;')
		.replace("'", '&apos;')
		.replace('"', '&quot;')
		.replace('<',   '&lt;')
		.replace('>',   '&gt;');
}

async function generateURLsFromRoutes(_routes)
{
	let urls = [];

	for (const _route of _routes)
	{
		// Merge the properties located directly in the
		// route object and those in the 'sitemap' sub-property
		const url = { ..._route, ..._route.sitemap };

		if (url.ignoreRoute) continue;

		/**
		 * Static URLs
		 */
		if ('loc' in url)
		{
			urls.push(url);
			continue;
		}

		/**
		 * Static routes
		 */

		// Ignore the "catch-all" 404 route
		if (_route.path == '*') continue;

		// Remove a potential slash at the beginning of the path
		const path = _route.path.replace(/^\/+/, '');

		// For static routes, simply prepend the base URL to the path
		if (!_route.path.includes(':'))
		{
			urls.push({ loc: path, ...url });
			continue;
		}

		/**
		 * Dynamic routes
		 */

		// Ignore dynamic routes if no slugs are provided
		if (!url.slugs) continue;

		// Get the name of the dynamic parameter
		const param = _route.path.match(/:\w+/)[0];

		// If the 'slug' property is a generator, execute it
		const slugs = await (typeof url.slugs == 'function' ? url.slugs.call() : url.slugs);

		// Check the validity of the slugs
		if (!slugsValidator(slugs)) throw `[vue-cli-plugin-sitemap]: ${ajv.errorsText().replace(/^data/, 'slugs')}`;

		// Build the array of URLs
		urls = urls.concat(
			[...new Set(slugs)].map(function(__slug)
			{
				// If the slug is an object (slug + additional meta tags)
				if (Object.prototype.toString.call(__slug) === '[object Object]')
					return { loc: path.replace(param, __slug.slug), ...url, ...__slug };

				// Else if the slug is just a simple value
				return { loc: path.replace(param, __slug), ...url }
			})
		);
	}

	return urls;
}

module.exports = generateSitemapXML;
