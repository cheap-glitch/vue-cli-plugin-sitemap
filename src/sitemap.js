
/**
 * src/sitemap.js
 */

function generateSitemapXML(_options)
{
	const urls = _options.urls || generateURLsFromRoutes(_options.routes);

	const sitemap =
	       '<?xml version="1.0" encoding="UTF-8"?>\n'
	     + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
	     + `${urls.map(__url => generateURLTag(__url, _options)).join('')}`
	     + '</urlset>';

	return _options.pretty ? sitemap : sitemap.replace(/\t|\n/g, '');
}

function generateURLTag(_url, _options)
{
	// If a base URL is specified, make sure it ends with a slash
	const baseUrl = _options.baseUrl ? `${_options.baseUrl.replace(/\/+$/, '')}/` : '';

	// Create the URL location
	let loc = escapeUrl(`${baseUrl}${_url.loc}`).replace(/\/$/, '') + (_options.trailingSlash ? '/' : '');

	// Generate a tag for each optional parameter
	const tags = ['lastmod', 'changefreq', 'priority']
		.filter(__param => __param in _url === true || __param in _options.defaults === true)
		.map(   __param => `\t\t<${__param}>${(__param in _url === true) ? _url[__param] : _options.defaults[__param]}</${__param}>\n`);

	return `\t<url>\n\t\t<loc>${loc}</loc>\n${tags.join('')}\t</url>\n`;
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

function generateURLsFromRoutes(_routes)
{
	return _routes.reduce(function(_urls, _route)
	{
		const url = { ..._route, ..._route.sitemap };

		// Get location from route path if needed
		if ('loc' in url === false)
		{
			// Ignore the "catch-all" 404 route
			if (_route.path == '*') return _urls;

			// Remove a potential slash at the beginning of the path
			const path = _route.path.replace(/^\/+/, '');

			// For static routes, simply prepend the base URL to the path
			if (!_route.path.includes(':')) return [..._urls, { loc: path, ...url }];

			// Ignore dynamic routes if no slugs are provided
			if (!url.slugs) return _urls;

			// Get the name of the dynamic parameter
			const param = _route.path.match(/:\w+/)[0];

			// Build an array of URLs
			return [..._urls, ...url.slugs.map(__slug => ({ loc: path.replace(param, __slug), ...url }))];
		}
	}, []);
}

module.exports = generateSitemapXML;
