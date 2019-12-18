
/**
 * src/sitemap.js
 */

function generateSitemapXML(_options)
{
	const urls = _options.urls || generateUrlsFromRoutes(_options.routes, _options.baseUrl);

	return `<?xml version="1.0" encoding="UTF-8"?>
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
			${urls.map(_url => generateUrlXML(_url)).join()}
		</urlset>`
		.replace(/\n|\s+/g, '');
}

function generateUrlXML(_url)
{
	// Generate a tag for each optional parameter
	const tags = ['lastmod', 'changefreq', 'priority'].map(
		__param => (__param in _url === true)
			? `<${__param}>${_url[__param]}</${__param}>`
			: ''
	);

	return `<loc>${_url.loc}</loc>${tags.join()}`;
}

function generateUrlsFromRoutes(_routes, _baseUrl)
{
	return _routes.reduce(function(_urls, _route)
	{
		const url = { ..._route.sitemap };

		// Get location from route path if needed
		if ('loc' in url === false)
		{
			// Ignore the "catch-all" 404 route
			if (_route.path == '*') return _urls;

			// For static routes, simply prepend the base URL to the path
			if (!_route.path.includes(':')) return [..._urls, { loc: `${_baseUrl}${_route.path}`, ...url }];

			// Ignore dynamic routes if no slugs are provided
			if (!url.slugs) return _urls;

			// Get the name of the dynamic parameter
			const param = _route.path.match(/:\w+/)[0];

			// Build an array of URLs
			return [..._urls, ...url.slugs.map(__slug => ({ loc: `${_baseUrl}${_route.path.replace(param, __slug)}`, ...url }))];
		}
	}, []);
}

module.exports = generateSitemapXML;
