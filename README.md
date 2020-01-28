# vue-cli-plugin-sitemap
![license badge](https://badgen.net/badge/license/ISC/green)
![latest release badge](https://badgen.net/github/release/cheap-glitch/vue-cli-plugin-sitemap?color=green)
[![codecov badge](https://codecov.io/gh/cheap-glitch/vue-cli-plugin-sitemap/branch/master/graph/badge.svg)](https://codecov.io/gh/cheap-glitch/vue-cli-plugin-sitemap)

 * [Installation](#installation)
 * [Setup](#setup)
 * [Options](#options)
 * [Changelog](#changelog)
 * [License](#license)

**vue-cli-plugin-sitemap** generates sitemaps  for your webapps. You  can use it
on its own or integrate it in the definition of your routes. Features:
 * generate sitemaps from an array of routes
 * support for dynamic routes
 * automatically escape the URLs and enforce a (non-)trailing slash policy
 * optionally prettify the output

#### What are sitemaps?
From [sitemaps.org](https://www.sitemaps.org):
> Sitemaps are an easy way for webmasters  to inform search engines about pages on
> their sites that are available for crawling.  In its simplest form, a sitemap is
> an XML file that lists URLs for a site along with additional metadata about each
> URL (when it was  last updated, how often it usually  changes, and how important
> it is,  relative to  other URLs  in the site)  so that  search engines  can more
> intelligently crawl  the site.  Web crawlers usually  discover pages  from links
> within the  site and from  other sites. Sitemaps  supplement this data  to allow
> crawlers that  support sitemaps  to pick up  all URLs in  the sitemap  and learn
> about those URLs using the associated  metadata. Using the sitemap protocol does
> not guarantee that web pages are  included in search engines, but provides hints
> for web crawlers to do a better job of crawling your site.

## Installation
```
vue add sitemap
```

The plugin will  add a script called `sitemap` to  your `package.json`. No other
files will be modified.

## Setup

### Use with `vue-router`
The recommended  way to  provide data  to the plugin  is to  pass it  the router
object used by the webapp. Below is an example of a very simple setup:

@TODO

```javascript
// vue.config.js

const router = require('./src/routes');

module.exports = {
	pluginOptions: {
		// […]

		sitemap: {
			router,
		}
	}
}
```

### Use as a standalone plugin
You can also directly provide some handwritten URLs to the plugin:
```javascript
// vue.config.js

sitemap: {
	// […]

	urls: [
		'https://website.com/'
		'https://website.com/about',
	]
}
```

If both routes and  URLs are provided, they will be merged  together in a single
sitemap.  In the  case of  duplicated locations,  URLs will  prevail over  their
matching routes.

## Options

### Global settings
All the  global settings are optional  and can be omitted,  except for `baseURL`
that must be provided for routes-based sitemaps.

```javascript
// vue.config.js

// The config object should be placed inside 'pluginOptions'
sitemap: {

	// Only generate for production builds (default: 'false')
	productionOnly: true,

	// Define the output directory (default is global 'outputDir')
	// Note: the official specification strongly recommend placing
	//       the sitemap at the root of the website
	outputDir: '/temp/sitemap',

	// If set to 'true', add a trailing slash at the end of every URL
	// Remove it if set to 'false' (the default)
	trailingSlash: false,

	// Insert line breaks and indent the tags to make the generated
	// file more readable (default: 'false')
	pretty: true,

	// Define an URL which will serve as a prefix for every URL in the sitemap
	// If it is provided, all URLs must be partial (e.g. '/page/subpage')
	// and not start with the domain name
	//
	// Note: this is required if some routes are provided, because
	//       every URL in the sitemap must be a full URL that includes
	//       the protocol and domain
	baseURL: 'https://webapp.com',

	// Default meta tags for every URL
	// These will be overridden by URL-specific tags
	defaults: {
		lastmod:    '2020-01-01',
		changefreq: 'weekly',
		priority:   1.0,
	},
}
```

### URL meta tags
In the sitemap format,  each URL can be associated with  some optional meta tags
to help the crawlers navigate the pages and prioritize the critical URLs:

  Meta tag   |                                       Accepted values for the equivalent property                                         | Default value if absent
------------ | ------------------------------------------------------------------------------------------------------------------------- | -----------------------
`lastmod`    | a date string in the [W3C format](https://www.w3.org/TR/NOTE-datetime), a JavaScript timestamp string, or a `Date` object | Ø
`changefreq` | `"always"`, `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`, `"yearly"`, `"never"`                                         | Ø
`priority`   | a multiple of `0.1` between `0.0` and `1.0`                                                                               | `0.5`

For  more  information  on  those  meta  tags,  you  can  consult  the  [official
specification](https://www.sitemaps.org/protocol.html#xmlTagDefinitions).

Example with a route object:
```javascript
{
	path:       'https://website.com/about'
	component:  () => import(/* webpackChunkName: "about-page" */ 'AboutPage'),

	meta: {
		sitemap: {
			lastmod:    'December 22, 2019',
			priority:    0.8,
			changefreq: 'daily',
		}
	}
}
```

Example with a handwritten URL:
```javascript
sitemap: {
	urls: [
		{
			loc:        'https://website.com/about'
			lastmod:    'December 22, 2019',
			priority:    0.8,
			changefreq: 'daily',
		},
	]
}
```

### Route-specific options
@TODO ↓
```javascript
[
	{
		path:    '/articles/:title',
		lastmod: new Date('December 17, 1995'),

		// Dynamic routes need explicit slugs to generate URLs
		// If no slugs are provided, the dynamic route will be ignored
		slugs: [
			'my-amazing-article',
			'a-life-changing-method-for-folding-socks',

			// Slugs can have their own meta tags
			{
				slug:      'a-very-important-article',
				priority:  1.0,
				lastmod:   '2020-01-01',
			}
		],
	},
	{
		path:    '/user/:id',
		lastmod: 1578503451000,
		// Slugs can also be provided via an asynchronous function
		slugs: async () => [...await someAsyncCallToADatabase()]
	},
	{
		path: '/some/very-long/or/complicated/path',

		// Directly provide an URL that will override the path
		loc: '/simplified-url'
	},
	{
		// The "catch-all" routes will be automatically ignored
		path: '*',
		name: '404',
	},
	{
		path: '/admin/protected-page',

		// Explicitly ignore this route
		ignoreRoute: true,
	},
]
```

## CLI
To  examine the  output  without triggering  the whole  build  process, run  the
following command to generate a sitemap in the current working directory:
```
npm run sitemap
```

#### CLI Options
When running the plugin  on the command line, it will follow  the options set in
`vue.config.js`. If needed, you can overwrite those with some CLI flags:
 * `-p`, `--pretty`: produce a human-readable output
 * `-o <dir>`, `--output-dir <dir>`: specify a directory in which the sitemap will be written

> Note: when calling the CLI through npm  scripts, don't forget to add `--` before
> specifying the  options to  ensure that  npm won't capture  them, e.g.  `npm run
> sitemap -- -p -o dist/`.

## Changelog
You can consult the full changelog [here](https://github.com/cheap-glitch/vue-cli-plugin-sitemap/releases).

## License
This software is distributed under the ISC license.
