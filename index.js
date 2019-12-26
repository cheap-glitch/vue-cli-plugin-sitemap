
/**
 * vue-cli-plugin-sitemap
 *
 * A Vue CLI 3 plugin to generate sitemaps automatically.
 *
 * Copyright (c) 2019-present, cheap glitch
 *
 *
 * Permission  to use,  copy, modify,  and/or distribute  this software  for any
 * purpose  with or  without  fee is  hereby granted,  provided  that the  above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS  SOFTWARE INCLUDING ALL IMPLIED  WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE  AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL  DAMAGES OR ANY DAMAGES  WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER  TORTIOUS ACTION,  ARISING OUT  OF  OR IN  CONNECTION WITH  THE USE  OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

const fs                 = require('fs');
const validateOptions    = require('./src/validation');
const generateSitemapXML = require('./src/sitemap');

module.exports = function(_api, _options)
{
	/**
	 * Add a new command to generate the sitemap
	 */
	_api.registerCommand(
		'sitemap',
		{
			usage:        'vue-cli-service sitemap [options]',
			options:      { '--pretty': 'Prettify the XML to make the sitemap more human-readable' },
			description:  'Generate the sitemap',
		},
		function(__args)
		{
			const options = { ..._options.pluginOptions.sitemap };

			if (__args.pretty)
				options.pretty = true;

			writeSitemap(options);
		}
	);

	/**
	 * Modify the 'build' command to generate the sitemap automatically
	 */
	const { build } = _api.service.commands;
	const buildFn   = build.fn;
	build.fn = async function(...__args)
	{
		await buildFn(...__args);

		// Don't generate the sitemap if not in production and the option 'productionOnly' is set
		if (_options.pluginOptions.sitemap.productionOnly && process.env.NODE_ENV !== 'production') return;

		writeSitemap(_options.pluginOptions.sitemap, ('outputDir' in _options === true) ? _options.outputDir : 'dist');
	};
}

function writeSitemap(_options, _outputDir = '.')
{
	// Validate the config and set the default values
	const error = validateOptions(_options);
	if (error !== null)
	{
		console.error(`[vue-cli-plugin-sitemap]: ${error.replace(/^data/, 'options')}`);
		return;
	}

	// Generate the sitemap and write it to the disk
	try {
		fs.writeFileSync(
			`${_outputDir}/sitemap.xml`,
			generateSitemapXML(_options),
		);
	}
	catch (error) {
		console.log(error);
		return;
	}

	console.log(`Generated and written sitemap at '${_outputDir}/sitemap.xml'`);
}
