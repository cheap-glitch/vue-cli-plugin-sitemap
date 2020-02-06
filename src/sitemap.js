
/**
 * src/sitemap.js
 */

const { ajv, slugsValidator } = require('./validation');

const MAX_NB_URLS = 50000;

function flat(input, depth = 1, stack = [])
{
	input.forEach(item => {
		if(item instanceof Array && depth > 0) flat(item, depth - 1, stack)
		else stack.push(item)
	})

	return stack;
}

if (!Array.prototype.flat)
{
	Object.defineProperty(Array.prototype, 'flat',
		{
			value: function(depth = 1, stack = [])
			{
				this.forEach(item => {
					if (item instanceof Array && depth > 0) item.flat(depth - 1, stack);
					else stack.push(item);
				})
				return stack;
			}
		});
}

/**
 * Generate one or more sitemaps, and an accompanying sitemap index if needed
 * Return an object of text blobs to save to different files ([filename]: [contents])
 */
async function generateSitemaps(options)
{
	// If a base URL is specified, make sure it ends with a slash
	const baseURL = options.baseURL ? `${options.baseURL.replace(/\/+$/, '')}/` : '';

	const seen = {};
	const urls = [...options.urls.map(url => (typeof url == 'string') ? { loc: url } : url), ...await generateURLsFromRoutes(options.routes)]

		// Generate the location of each URL
		.map(url => ({...url, loc: escapeUrl(baseURL + url.loc.replace(/^\//, '')).replace(/\/$/, '') + (options.trailingSlash ? '/' : '') }))

		// Remove duplicate URLs (handwritten URLs have preference over routes)
		.filter(url => Object.prototype.hasOwnProperty.call(seen, url.loc) ? false : (seen[url.loc] = true));

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
		blobs['sitemap-index'] = await generateSitemapIndexXML(nb_sitemaps, options);
	}

	// Generate the sitemaps
	await Promise.all(sitemaps.map(async function(urls, index, sitemaps)
	{
		const filename  = (sitemaps.length > 1)
		                ? `sitemap-part-${(index + 1).toString().padStart(sitemaps.length.toString().length, '0')}`
		                : 'sitemap'

		blobs[filename] = generateSitemapXML(urls, options);
	}));

	return blobs;
}

async function generateSitemapIndexXML(nbSitemaps, options)
{
	const sitemaps = [...new Array(nbSitemaps).keys()]
		.map(function(index)
		{
			const filename = `sitemap-part-${(index + 1).toString().padStart(nbSitemaps.toString().length, '0')}.xml`;

			return '\t<sitemap>\n'
			     +     `\t\t<loc>${options.baseURL.replace(/\/$/, '')}/${filename}</loc>\n`
			     + '\t</sitemap>\n'
		});

	return '<?xml version="1.0" encoding="UTF-8"?>\n'
	     + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
	     +     sitemaps.join('')
	     + '</sitemapindex>';
}

function generateSitemapXML(urls, options)
{
	return '<?xml version="1.0" encoding="UTF-8"?>\n'
	     + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
	     +     `${urls.map(url => generateURLTag(url, options)).join('')}`
	     + '</urlset>';
}

function generateURLTag(url, options)
{
	// Create a tag for each meta property
	const metaTags = ['lastmod', 'changefreq', 'priority'].map(function(tag)
	{
		if (tag in url == false && tag in options.defaults == false)
			return '';

		let value = (tag in url) ? url[tag] : options.defaults[tag];

		// Fix the bug of whole-number priorities
		if (tag == 'priority')
		{
			if (value == 0) value = '0.0';
			if (value == 1) value = '1.0';
		}

		return `\t\t<${tag}>${value}</${tag}>\n`;
	});

	return `\t<url>\n\t\t<loc>${url.loc}</loc>\n${metaTags.join('')}\t</url>\n`;
}

function escapeUrl(url)
{
	return encodeURI(url)
		.replace('&',  '&amp;')
		.replace("'", '&apos;')
		.replace('"', '&quot;')
		.replace('<',   '&lt;')
		.replace('>',   '&gt;');
}

async function generateURLsFromRoutes(routes)
{
	const urls = await Promise.all(routes.map(async function(route)
	{
		const path   = route.path.replace(/^\/+/, '');
		const meta   = route.meta ? (route.meta.sitemap || {}) : {};
		const params = path.match(/:\w+/g);

		if (meta.ignoreRoute || route.path === '*') return null;

		/**
		 * Static routes
		 */
		if ('loc' in meta) return meta;
		if (!params)       return { loc: path, ...meta };

		/**
		 * Dynamic routes
		 */
		if (!meta.slugs) throwError(`need slugs to generate URLs from dynamic route '${route.path}'`);

		let slugs = await (typeof meta.slugs == 'function' ? meta.slugs.call() : meta.slugs);
		if (!slugsValidator(slugs))
			throwError(ajv.errorsText(slugsValidator.errors).replace(/^data/, 'slugs'));

		// Build the array of URLs
		return slugs.map(function(slug)
		{
			// Wrap the slug in an object if needed
			if (typeof slug != 'object') slug = { [params[0].slice(1)]: slug };

			// Replace each parameter by its corresponding value
			let urlPath = path;
			params.forEach(function(param)
			{
				const paramName = param.slice(1);

				if (paramName in slug === false)
					throwError(`need slug for param '${paramName}' of route '${route.path}'`);

				urlPath = urlPath.replace(param, slug[paramName]);
			});

			return { loc: urlPath, ...slug };
		});
	}));

	// Filter and flatten the array before returning it
	return urls.filter(url => url !== null).flat();
}

function throwError(message)
{
	throw new Error(`[vue-cli-plugin-sitemap]: ${message}`);
}

module.exports = {
	throwError,
	generateSitemaps,
}
