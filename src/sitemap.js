const { throwError, validateSlugs } = require('./validation');

const MAX_NB_URLS = 50000;

/**
 * Generate one or more sitemaps, and an accompanying sitemap index if needed
 * Return an object of text blobs to save to different files ([filename]: [contents])
 */
async function generateSitemaps(options) {
	// If a base URL is specified, make sure it ends with a slash
	const baseURL = options.baseURL ? `${options.baseURL.replace(/\/+$/, '')}/${options.hashMode ? '#/' : ''}` : '';

	const seen = {};
	const urls = [...options.urls.map(url => (typeof url == 'string') ? { loc: url } : url), ...await generateURLsFromRoutes(options.routes)]
		// Generate the location of each URL
		.map(url => ({...url, loc: escapeUrl(baseURL + url.loc.replace(/^\//, '')).replace(/\/$/, '') + (options.trailingSlash ? '/' : '') }))
		// Remove duplicate URLs (handwritten URLs have preference over routes)
		.filter(url => Object.prototype.hasOwnProperty.call(seen, url.loc) ? false : (seen[url.loc] = true));

	let blobs    = {};
	let sitemaps = [urls];

	// If there is more than 50,000 URLs, split them into several sitemaps
	if (urls.length > MAX_NB_URLS) {
		sitemaps = [];
		const nb_sitemaps = Math.ceil(urls.length / MAX_NB_URLS);

		// Split the URLs into batches of 50,000
		for (let i=0; i<nb_sitemaps; i++)
			sitemaps.push(urls.slice(i*MAX_NB_URLS, (i+1)*MAX_NB_URLS));

		// Generate the sitemap index
		blobs['sitemap-index'] = await generateSitemapIndexXML(nb_sitemaps, options);
	}

	// Generate the sitemaps
	await Promise.all(sitemaps.map(async function(urls, index, sitemaps) {
		const filename  = (sitemaps.length > 1)
		                ? `sitemap-part-${(index + 1).toString().padStart(sitemaps.length.toString().length, '0')}`
		                : 'sitemap'

		blobs[filename] = generateSitemapXML(urls, options);
	}));

	return blobs;
}

async function generateSitemapIndexXML(nbSitemaps, options) {
	const sitemaps = [...Array(nbSitemaps).keys()].map(index =>
		  '\t<sitemap>\n'
		+     `\t\t<loc>${options.baseURL.replace(/\/$/, '')}/${`sitemap-part-${(index + 1).toString().padStart(nbSitemaps.toString().length, '0')}.xml`}</loc>\n`
		+ '\t</sitemap>\n'
	);

	return '<?xml version="1.0" encoding="UTF-8"?>\n'
	     + '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
	     +     sitemaps.join('')
	     + '</sitemapindex>';
}

function generateSitemapXML(urls, options) {
	return '<?xml version="1.0" encoding="UTF-8"?>\n'
	     + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
	     +     `${urls.map(url => generateURLTag(url, options)).join('')}`
	     + '</urlset>';
}

function generateURLTag(url, options) {
	// Create a tag for each meta property
	const metaTags = ['lastmod', 'changefreq', 'priority'].map(function(tag) {
		if (tag in url == false && tag in options.defaults == false) {
			return '';
		}

		let value = (tag in url) ? url[tag] : options.defaults[tag];

		// Fix the bug of whole-number priorities
		if (tag == 'priority') {
			if (value == 0) value = '0.0';
			if (value == 1) value = '1.0';
		}

		return `\t\t<${tag}>${value}</${tag}>\n`;
	});

	return `\t<url>\n\t\t<loc>${url.loc}</loc>\n${metaTags.join('')}\t</url>\n`;
}

function escapeUrl(url) {
	return encodeURI(url)
		.replace('&',  '&amp;')
		.replace("'", '&apos;')
		.replace('"', '&quot;')
		.replace('<',   '&lt;')
		.replace('>',   '&gt;');
}

async function generateURLsFromRoutes(routes, parentPath = '', parentMeta = {}) {
	const urls = await Promise.all(routes.map(async function(route) {
		// Avoid "contaminating" children route with parent 'loc' property
		delete parentMeta.loc;

		const path   = (route.path.startsWith('/') ? route.path : `${parentPath}/${route.path}`).replace(/^\/+/, '');
		const meta   = { ...parentMeta, ...(route.meta ? (route.meta.sitemap || {}) : {}) };
		const params = (path.match(/:\w+(:?\(.+?\)|\?)?/g) || []).map(param => ({
			str:        param,
			name:       param.slice(1).replace(/\(.+?\)/, '').replace('?', ''),
			regexp:     /\(.+?\)/.test(param) ? new RegExp(param.match(/\((.+?)\)/)[1]) : null,
			isOptional: param.endsWith('?'),
		}));

		/**
		 * Ignored route
		 */
		if (meta.ignoreRoute || (route.path.includes('*') && !('loc' in meta))) return null;

		/**
		 * Static route
		 */
		if ('loc' in meta)  return ('children' in route) ? await generateURLsFromRoutes(route.children, meta.loc, meta) : meta;
		if (!params.length) return ('children' in route) ? await generateURLsFromRoutes(route.children, path,     meta) : { loc: path, ...meta };

		/**
		 * Dynamic route
		 */
		if (!meta.slugs) throwError(`need slugs to generate URLs from dynamic route '${route.path}'`);

		let slugs = (typeof meta.slugs == 'function') ? await meta.slugs.call() : meta.slugs;
		validateSlugs(slugs, `invalid slug for route '${route.path}'`);

		// Build the array of URLs
		return simpleFlat(await Promise.all(slugs.map(async function(slug) {
			// Wrap the slug in an object if needed
			if (typeof slug != 'object') slug = { [params[0].name]: slug };

			// Replace each parameter by its corresponding value
			const loc = params.reduce(function(result, param) {
				// Check that the correct slug exists
				if (param.name in slug === false)
					throwError(`need slug for param '${param.name}' of route '${route.path}'`);

				// Check that the slug matched a potential regex pattern used to validate the param
				if (param.regexp && !param.regexp.test(slug[param.name].toString()))
					throwError(`the slug \`${slug[param.name]}\` for param '${param.name}' doesn't match its regex pattern ${param.regexp.toString()}`);

				return result.replace(param.str, slug[param.name]);
			}, path);

			return ('children' in route) ? await generateURLsFromRoutes(route.children, loc, meta) : { loc, ...slug };
		})));
	}))

	// Filter and flatten the array of URLs
	return simpleFlat(urls.filter(url => url !== null));
}

/**
 * Flatten an array with a depth of 1
 * Don't use `flat()` to be compatible with Node 10 and under
 */
function simpleFlat(array) {
	return array.reduce(function(flat, item) {
		if (Array.isArray(item)) {
			Array.prototype.push.apply(flat, item);
		} else {
			flat.push(item);
		}

		return flat;
	}, []);
}

module.exports = { generateSitemaps };
