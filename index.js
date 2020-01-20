
/**
 * vue-cli-plugin-sitemap
 *
 * A Vue CLI plugin to generate simple or complex sitemaps easily.
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

const fs                        = require('fs');
const generateSitemapXML        = require('./src/sitemap');
const { ajv, optionsValidator } = require('./src/validation');

module.exports = async function(_api, _options)
{
	/**
	 * Add a new command to generate the sitemap
	 */
	_api.registerCommand(
		'sitemap',
		{
			usage:        'vue-cli-service sitemap [options]',
			description:  'Generate the sitemap',

			options: {
				'-p, --pretty':                  'Prettify the XML to make the sitemap more human-readable',
				'-o [dir], --output-dir [dir]':  'Output the sitemap to the specified path instead of the current working directory',
			},
		},
		async function(__args)
		{
			const options = { ..._options.pluginOptions.sitemap };

			if (__args.pretty || __args.p)
				options.pretty = true;

			await writeSitemap(options, __args['output-dir'] || __args.o || options.outputDir || '.');
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

		await writeSitemap(_options.pluginOptions.sitemap, _options.pluginOptions.sitemap.outputDir || _options.outputDir || 'dist');
	};
}

async function writeSitemap(_options, _outputDir)
{
	// Validate the config and set the default values
	if (!optionsValidator(_options))
		throw new Error(`[vue-cli-plugin-sitemap]: ${ajv.errorsText(optionsValidator.errors).replace(/^data/, 'options')}`);

	// Generate the sitemap and write it to the disk
	fs.writeFileSync(
		`${_outputDir}/sitemap.xml`,
		await generateSitemapXML(_options),
	);

	console.info(`Generated and written sitemap at '${_outputDir.replace(/\/$/, '')}/sitemap.xml'`);
}
