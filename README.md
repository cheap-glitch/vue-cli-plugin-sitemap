# vue-cli-plugin-sitemap
![license badge](https://badgen.net/badge/license/ISC/green)
![latest release badge](https://badgen.net/github/release/cheap-glitch/vue-cli-plugin-sitemap?color=green)
[![codecov badge](https://codecov.io/gh/cheap-glitch/vue-cli-plugin-sitemap/branch/master/graph/badge.svg)](https://codecov.io/gh/cheap-glitch/vue-cli-plugin-sitemap)

 * [Installation](#installation)
 * [Setup](#setup)
   * [Use with `vue-router`](#use-with-vue-router)
   * [Use as a standalone plugin](#use-as-a-standalone-plugin)
 * [CLI](#cli)
   * [CLI options](#cli-options)
 * [Options](#options)
   * [Global options](#global-options)
   * [URL meta tags](#url-meta-tags)
   * [Dynamic routes](#dynamic-routes)
   * [Other route-specific options](#other-route-specific-options)
 * [Changelog](#changelog)
 * [License](#license)

**vue-cli-plugin-sitemap** generates sitemaps  for your webapps. You  can use it
on its own or integrate it in the definition of your routes. Features:
 * 🛣️ generate sitemaps from an array of routes
 * 🔀 support dynamic routes with single or multiple parameters
 * 🚧 automatically escape the URLs and enforce a (non-)trailing slash policy
 * ✂️  automatically split the large sitemaps and generate the associated sitemap index
 * ✨ optionally prettify the output

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
The recommended  way to provide data  to the plugin is  to pass it the  array of
routes used with `vue-router`. Below is an example of a very basic setup:
```javascript
// src/routes.js

module.exports = [
	{
		path:      '/',
		name:      'home',
		component: () => import(/* webpackChunkName: "home"  */ 'HomePage')
	},
	{
		path:      '/about',
		name:      'about',
		component: () => import(/* webpackChunkName: "about" */ 'AboutPage')
	},
]
```

```javascript
// vue.config.js

const routes = require('./src/routes');

module.exports = {
	pluginOptions: {
		sitemap: {
			baseURL: 'https://website.com',
			routes,
		}
	}
}
```

```javascript
// src/main.js

import Vue    from 'vue'
import Router from 'vue-router'

import App    from './App.vue'
import routes from './src/routes'

Vue.use(Router);
new Vue({
	render: h => h(App),
	router: new Router({
		mode: 'history',
		base: process.env.BASE_URL,
		routes,
	})
}).$mount('#app');
```

### Use as a standalone plugin
You can also directly provide some handwritten URLs to the plugin:
```javascript
// vue.config.js

module.exports = {
	pluginOptions: {
		sitemap: {
			urls: [
				'https://website.com/',
				'https://website.com/about',
			]
		}
	}
}
```

If both routes and  URLs are provided, they will be merged  together in a single
sitemap.  In the  case of  duplicated locations,  URLs will  prevail over  their
matching routes.

## CLI
To  examine the  output  without triggering  the whole  build  process, run  the
following command to generate a sitemap in the current working directory:
```
npm run sitemap
```

#### CLI options
When running the plugin  on the command line, it will follow  the options set in
`vue.config.js`. If needed, you can overwrite those with some CLI flags:
 * `-p`, `--pretty`: produce a human-readable output
 * `-o  <dir>`, `--output-dir <dir>`: specify  a directory in which  the sitemap
   will be written

> Note: when calling the CLI through npm  scripts, don't forget to add `--` before
> specifying the  options to  ensure that  npm won't capture  them, e.g.  `npm run
> sitemap -- --pretty -o dist/`.

## Options

### Global options
All the  global settings are optional  and can be omitted,  except for `baseURL`
that must be provided for route-based sitemaps.

```javascript
// vue.config.js

// The config object should of course be placed inside 'pluginOptions'
sitemap: {

	// Only generate during production builds (default: 'false')
	productionOnly: true,

	// Define the output directory (default: global 'outputDir')
	//
	// Note: the official specification strongly recommends placing
	//       the sitemap at the root of the website
	outputDir: '/temp/sitemap',

	// If set to 'true', add a trailing slash at the end of every URL
	// If set to 'false', always remove it (default: 'false')
	trailingSlash: false,

	// Insert line breaks and indent the tags to make the generated
	// file more readable (default: 'false')
	pretty: true,

	// Define an URL which will serve as a prefix for every URL in the sitemap
	// If it is provided, all URLs must be partial and not start with the
	// domain name (e.g. '/page/subpage')
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
	path:       '/about'
	component:  () => import(/* webpackChunkName: "about" */ 'AboutPage'),

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

### Dynamic routes
If you use dynamic routes (e.g. `/user/:id`), you must either provide some slugs
to generate the corresponding URLs, or set the `ignoreRoute` option to true:
```javascript
// src/routes.js

module.exports = [
	{
		path: '/articles/:title',
		meta: {
			sitemap: {
				slugs: [
					'my-amazing-article',
					'a-life-changing-method-for-folding-socks',

					// Slugs can have their own meta tags
					{
						title:     'a-very-important-article',
						priority:  1.0,
					}
				],
			}
		}
	},
	{
		path: '/blog/:category/:id/:post
		meta: {
			sitemap: {
				// For dynamic routes with multiple parameters,
				// each slug must be an object with a key for
				// each parameter
				slugs: [
					{
						id:        1,
						title:     'hello-world',
						category:  'infos',
					},
					{
						id:        2,
						title:     'how-to-fold-socks-faster',
						category:  'lifehacks',

						priority:  0.9,
						lastmod:   'February 02, 2020 09:24',
					},
				]
			}
		}
	},
	{
		path: '/user/:id',
		meta: {
			sitemap: {
				// Slugs can also be provided asynchronously
				// The callback must always return an array in the end
				slugs: async () => await getActiveUsers(),
			}
		}
	},
	{
		path: '/admin/secure/:config',

		// Explicitly ignore this route
		meta: { sitemap: { ignoreRoute: true } }
	},
	{
		// The "catch-all" routes will be automatically ignored
		path: '*',
		name: '404',
	},
]
```

### Other route-specific options
@TODO

## Changelog
You can consult the full changelog [here](https://github.com/cheap-glitch/vue-cli-plugin-sitemap/releases).

## License
This software is distributed under the ISC license.
