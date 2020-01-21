
/**
 * src/sitemap.js
 */

const { ajv, slugsValidator } = require('./validation');

const MAX_NB_URLS = 50000;

/**
 * Generate one or more sitemaps, and an accompanying sitemap index if needed
 * Return an object of text blobs to save to different files ([filename]: [contents])
 */
async function generateSitemap(_options)
{
	// If a base URL is specified, make sure it ends with a slash
	const baseURL = _options.baseURL ? `${_options.baseURL.replace(/\/+$/, '')}/` : '';

	const urls = [..._options.urls, ...await generateURLsFromRoutes(_options.routes)]
		// Generate the location of each URL
		.map(_url => ({ ..._url, loc: escapeUrl(baseURL + _url.loc.replace(/^\//, '')).replace(/\/$/, '') + (_options.trailingSlash ? '/' : '') }))
		// Remove duplicate URLs (static URLs have preference over routes)
		.filter((_url, _index, _urls) => !('path' in _url) || _urls.every((__url, __index) => (_url.loc != __url.loc || _index == __index)));

	let blobs    = {};
	let sitemaps = [urls];

	// If there is more than 50,000 URLs, split them into several sitemaps
	if (urls.length > MAX_NB_URLS)
	{
		sitemaps = [];
		const nb_sitemaps = Math.ceil(urls.length / MAX_NB_URLS);

		// Split the URLs into batches of 50,000
		for (let i=0; i<nb_sitemaps; i++)
			sitemaps.push(urls.slice(i*MAX_NB_URLS, (i+1)*MAX_NB_URLS));

		// Generate the sitemap index
		blobs['sitemap-index'] = generateSitemapIndexXML(nb_sitemaps, _options);
	}

	// Generate the sitemaps
	await Promise.all(sitemaps.forEach(async function(__urls, __index, __sitemaps)
	{
		const filename  = (__sitemaps.length > 1)
		                ? `sitemap-${__index.toString().padStart(__sitemaps.length.toString().length, '0')}`
		                : 'sitemap'

		blobs[filename] = await generateSitemapXML(__urls, _options);
	}));

	return blobs;
}

async function generateSitemapIndexXML(_nbSitemaps, _options)
{
	const sitemaps = [...new Array(_nbSitemaps).keys()]
		.map(function(__index)
		{
			const filename = `sitemap-${__index.toString().padStart(_nbSitemaps.toString().length, '0')}.xml`;

			return '<sitemap>\n'
			     +     `\t<loc>${_options.baseURL.replace(/\/$/, '')}/${filename}</loc>\n`
			     + '</sitemap>'
		});

	const index = '<?xml version="1.0" encoding="UTF-8"?>\n'
	            + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
	            +     sitemaps.join('\n')
	            + '</sitemapindex>';

	return _options.pretty ? index : index.replace(/\t|\n/g, '');
}

async function generateSitemapXML(_urls, _options)
{
	const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
	              + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
	              +     `${_urls.map(__url => generateURLTag(__url, _options)).join('')}`
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
			if (value == 0) value = '0.0';
			if (value == 1) value = '1.0';
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
		if (!slugsValidator(slugs))
			throw new Error(`[vue-cli-plugin-sitemap]: ${ajv.errorsText(slugsValidator.errors).replace(/^data/, 'slugs')}`);

		// Build the array of URLs
		urls = urls.concat(
			[...new Set(slugs)].map(function(__slug)
			{
				// If the slug is an object (slug + additional meta tags)
				if (Object.prototype.toString.call(__slug) == '[object Object]')
					return { loc: path.replace(param, __slug.slug), ...url, ...__slug };

				// Else if the slug is just a simple value
				return { loc: path.replace(param, __slug), ...url }
			})
		);
	}

	return urls;
}

module.exports = generateSitemapXML;
