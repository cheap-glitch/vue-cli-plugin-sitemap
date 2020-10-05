<p align="center"><img src="./docs/banner.png" alt="banner"></p>

<div align="center"><h1>vue-cli-plugin-sitemap</h1></div>

<div align="center">
	<img src="https://badgen.net/github/license/cheap-glitch/vue-cli-plugin-sitemap?color=green" alt="license badge">
	<img src="https://badgen.net/github/release/cheap-glitch/vue-cli-plugin-sitemap?color=green" alt="latest release badge">
	<a href="https://codecov.io/gh/cheap-glitch/vue-cli-plugin-sitemap"><img src="https://codecov.io/gh/cheap-glitch/vue-cli-plugin-sitemap/branch/main/graph/badge.svg" alt="codecov badge"></a>
</div>

<p></p>

**vue-cli-plugin-sitemap** generates sitemaps for your Vue web apps. You can use
it on  its own  or integrate  it in  the definition  of the  routes used  in Vue
Router. Features:
 * 🛣️ generate sitemaps from an array of routes
 * 🔀 support dynamic routes with single or multiple parameters
 * 🍱 support nested routes
 * 🚧 automatically escape the URLs and enforce a (non-)trailing slash policy
 * ✂️  automatically split the large sitemaps (more than 50,000 URLs) and generate
      the associated sitemap index
 * ✨ optionally prettify the output

#### Table of contents
 * [Installation](#installation)
 * [Setup](#setup)
   * [Usage with `vue-router`](#usage-with-vue-router)
   * [Usage as a standalone plugin](#usage-as-a-standalone-plugin)
 * [CLI](#cli)
   * [CLI options](#cli-options)
 * [Options](#options)
   * [Global options](#global-options)
   * [URL meta tags](#url-meta-tags)
   * [Dynamic routes](#dynamic-routes)
   * [Nested routes](#nested-routes)
   * [Other route-specific options](#other-route-specific-options)
 * [Changelog](#changelog)
 * [License](#license)

## Installation
```
vue add sitemap
```

The plugin will  add a script called `sitemap` to  your `package.json`. No other
files will be modified.

## Setup

### Usage with `vue-router`
The recommended  way to provide data  to the plugin is  to pass it the  array of
routes used by Vue  Router. To do this, you'll need  to separate the declaration
of  the routes  and  the instantiation  of  the Vue  Router  into two  different
modules.

Below is a simplified example of this setup, using [`esm`](https://github.com/standard-things/esm)
to load ES6 modules into `vue.config.js` (this is needed until [#4477](https://github.com/vuejs/vue-cli/issues/4477)
is implemented). Note that this comes with a few restrictions in `src/routes.js`:
 * you can import other JS modules, but no `.vue` files because `esm` won't know
   how  to  load  them (you'll  have  to  rely on  dynamic imports  using Node's
   `require()` for the `component` property)
 * you can't use the `@` placeholder in the inclusion paths, as this is a bit of
   sugar syntax defined by `vue-loader` to shorten paths when loading files with
   webpack

```javascript
// vue.config.js

require = require('esm')(module);
const { routes } = require('./src/routes.js');

module.exports = {
	pluginOptions: {
		sitemap: {
			baseURL: 'https://example.com',
			routes,
		}
	}
}
```
```javascript
// src/routes.js

export const routes = [
	{
		path: '/',
		name: 'home',
		component: () => import(/* webpackChunkName: "home" */ './views/Home.vue')
	},
	{
		path: '/about',
		name: 'about',
		component: () => import(/* webpackChunkName: "about" */ './views/About.vue')
	},
]
```
```javascript
// src/main.js

import Vue        from 'vue'
import Router     from 'vue-router'
import App        from './App.vue'
import { routes } from './routes.js'

Vue.use(Router);
const router = new Router({
	mode: 'history',
	base: process.env.BASE_URL,
	routes,
});

new Vue({ router, render: h => h(App) }).$mount('#app');
```

### Usage as a standalone plugin
You can also directly provide some handwritten URLs to the plugin:
```javascript
// vue.config.js

module.exports = {
	pluginOptions: {
		sitemap: {
			urls: [
				'https://example.com/',
				'https://example.com/about',
			]
		}
	}
}
```

If both routes and  URLs are provided, they will be merged  together in a single
sitemap. In the case of duplicated locations, handwritten URLs will prevail over
their matching routes.

## CLI
To  examine the  output  without triggering  the whole  build  process, run  the
following command to generate a sitemap in the current working directory:
```
npm run sitemap
```

#### CLI options
When running the plugin  on the command line, it will follow  the options set in
`vue.config.js`. If needed, you can overwrite those with some CLI options:
 * `-p`, `--pretty`: produce a human-readable output
 * `-o  <dir>`, `--output-dir <dir>`: specify  a directory in which  the sitemap
   will be written

> Note: when calling the CLI through npm  scripts, don't forget to add `--` before
> specifying the  options to  ensure that  npm won't capture  them, e.g.  `npm run
> sitemap -- --pretty -o dist/`.

## Options

### Global options
All the  global options are  optional and can  be omitted, except  for `baseURL`
that must be provided for route-based sitemaps.

```javascript
sitemap: {
	// Only generate during production builds (default: `false`)
	productionOnly: true,

	// Define the output directory (default: global `outputDir`)
	//
	// Note: the official specification strongly recommends placing
	//       the sitemap at the root of the website
	outputDir: '/temp/sitemap',

	// If set to `true`, add a trailing slash at the end of every URL
	// If set to `false`, always remove it (default: `false`)
	trailingSlash: false,

	// Set to `true` to produce URLs compatible with hash mode
	// (default: `false`)
	hashMode: false,

	// Insert line breaks and tabulations to make the generated
	// file more readable (default: `false`)
	pretty: true,

	// Define an URL which will serve as a prefix for every URL
	// in the sitemap
	// If it is provided, all URLs must be partial and not start with the
	// domain name (e.g. '/page/subpage')
	//
	// Note: this is required if some routes are provided, because
	//       every URL in the sitemap must be a full URL that includes
	//       the protocol and domain
	baseURL: 'https://example.com',

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
to help the crawlers update the pages and prioritize the critical URLs:

  Meta tag   |                                                  Accepted values for the equivalent property                                                  | Default value if absent
------------ | --------------------------------------------------------------------------------------------------------------------------------------------- | -----------------------
`lastmod`    | a date string in the [W3C format](https://www.w3.org/TR/NOTE-datetime), a JavaScript timestamp string, a numeric timestamp or a `Date` object | Ø
`changefreq` | `"always"`, `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`, `"yearly"`, `"never"`                                                             | Ø
`priority`   | a multiple of `0.1` between `0.0` and `1.0`                                                                                                   | `0.5`

> For more information on those meta tags, you can consult the [official specification](https://www.sitemaps.org/protocol.html#xmlTagDefinitions).

Example with a route object:
```javascript
{
	path: '/about'
	component: () => import(/* webpackChunkName: "about" */ './About')

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
			loc:        'https://example.com/about',
			lastmod:    'December 22, 2019',
			priority:    0.8,
			changefreq: 'daily',
		},
	]
}
```

### Dynamic routes
If you  use dynamic routes  (e.g. `/user/:id`), you  must provide some  slugs to
generate the corresponding URLs (or set the `ignoreRoute` option to true):
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
		// Optional and regexp-validated parameters are supported
		path: '/blog/:category/:id(\\d+)/:post?',
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
					{
						// Slugs that don't match the regex
						// pattern of their parameter will
						// throw an error
						id:        'invalid-slug',

						title:     'another-post',
						category:  'misc',
					}
				]
			}
		}
	},
	{
		path: '/user/:id',
		meta: {
			sitemap: {
				// Slugs can also be provided asynchronously
				// The callback must always return an array
				slugs: async () => await getActiveUsers(),
			}
		}
	},
]
```

### Nested routes
Nested routes are supported:
```javascript
// src/routes.js

module.exports = [
	{
		path: '/user/:id',
		meta: {
			sitemap: {
				// Meta properties on parent will be
				// inherited by their children
				changefreq: 'monthly',
				priority:   0.7,

				slugs: getUserList(),
			}
		},

		children: [
			{
				path: 'profile',
				meta: {
					sitemap: {
						// Meta properties on children
						// override those on parents
						changefreq: 'weekly',
					}
				}
			},
		]
	},
]
```

This example will produce the following sitemap:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>https://example.com/user/1/profile</loc>
		<priority>0.7</priority>
		<changefreq>weekly</changefreq>
	</url>
	<url>
		<loc>https://example.com/user/2/profile</loc>
		<priority>0.7</priority>
		<changefreq>weekly</changefreq>
	</url>
	<!-- [...] -->
</urlset>
```

### Other route-specific options
```javascript
// src/routes.js

module.exports = [
	{
		path: '/admin/secure-page',

		// Explicitly ignore this route and all its children
		meta: { sitemap: { ignoreRoute: true } }
	},
	{
		// Routes with a glob in their path will be ignored...
		path: '*',
		name: '404',
	},
	{
		path: '/glob/*',

		// ...unless you provide a handwritten path to replace it
		meta: { sitemap: { loc: '/glob/lorem/ipsum' } }
	},
]
```

## Changelog
You can consult the full changelog [here](https://github.com/cheap-glitch/vue-cli-plugin-sitemap/releases).

## License
This software is distributed under the ISC license.
