
/**
 * src/sitemap.js
 */

function generateSitemapXML(_options)
{
	// If a base URL is specified, make sure it ends with a slash
	const baseURL = _options.baseURL ? `${_options.baseURL.replace(/\/+$/, '')}/` : '';

	const urls = [..._options.urls, ...generateURLsFromRoutes(_options.routes)]
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
	// Generate an XML tag for each meta tag
	const tags = ['lastmod', 'changefreq', 'priority']
		.filter(__tag => __tag in _url || __tag in _options.defaults)
		.map(   __tag => `\t\t<${__tag}>${(__tag in _url) ? _url[__tag] : _options.defaults[__tag]}</${__tag}>\n`);

	return `\t<url>\n\t\t<loc>${_url.loc}</loc>\n${tags.join('')}\t</url>\n`;
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

		/**
		 * Static URLs
		 */
		if ('loc' in url) return [..._urls, url];

		/**
		 * Static routes
		 */

		// Ignore the "catch-all" 404 route
		if (_route.path == '*') return _urls;

		// Remove a potential slash at the beginning of the path
		const path = _route.path.replace(/^\/+/, '');

		// For static routes, simply prepend the base URL to the path
		if (!_route.path.includes(':')) return [..._urls, { loc: path, ...url }];

		/**
		 * Dynamic routes
		 */

		// Ignore dynamic routes if no slugs are provided
		if (!url.slugs) return _urls;

		// Get the name of the dynamic parameter
		const param = _route.path.match(/:\w+/)[0];

		return [..._urls, ...url.slugs.map(__slug => ({ loc: path.replace(param, __slug), ...url }))];
	}, []);
}

module.exports = generateSitemapXML;
