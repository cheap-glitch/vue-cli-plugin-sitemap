
/**
 * src/sitemap.js
 */

function generateUrlsFromRoutes(_routes, _options)
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
			if (!_route.path.includes(':')) return [..._urls, { loc: `${_options.baseUrl}${_route.path}`, ...url }];

			// Ignore dynamic routes if no slugs are provided
			if (!url.slugs) return _urls;

			// Get the name of the dynamic parameter
			const param = _route.path.match(/:\w+/)[0];

			// Build an array of URLs
			return [..._urls, ...url.slugs.map(_slug => ({ loc: `${_options.baseUrl}${_route.path.replace(param, _slug)}`, ...url }))];
		}
	}, []);
}

function generateUrlXML(_urls)
{
	// Generate a tag for each optional parameter
	const tags = ['lastmod', 'changefreq', 'priority'].map(
		_param => (_param in _url === true)
			? `<${_param}>${_url[_param]}</${_param}>`
			: ''
	);

	return `<loc>${_url.loc}</loc>${tags.join()}`;
}

function generateSitemapXML(_routes, _options)
{
	return `<?xml version="1.0" encoding="UTF-8"?>
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
			${generateUrlsFromRoutes(_routes, _options).map(__url => generateUrlXML(__url)).join()}
		</urlset>`
		.replace(/\n|\s+/g, '');
}

module.exports = generateSitemapXML;
