
/**
 * vue-cli-plugin-sitemap
 *
 * A Vue CLI plugin to generate simple or complex sitemaps effortlessly.
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

const fs                               = require('fs');
const { ajv, optionsValidator }        = require('./src/validation');
const { throwError, generateSitemaps } = require('./src/sitemap');

module.exports = async function(api, options)
{
	/**
	 * Add a new command to generate the sitemap
	 */
	api.registerCommand(
		'sitemap',
		{
			usage:        'vue-cli-service sitemap [options]',
			description:  'Generate the sitemap',

			options: {
				'-p, --pretty':                  'Prettify the XML to make the sitemap more human-readable',
				'-o [dir], --output-dir [dir]':  'Output the sitemap to the specified path instead of the current working directory',
			},
		},
		async function(args)
		{
			const cliOptions = { ...options.pluginOptions.sitemap };

			if (args.pretty || args.p)
				cliOptions.pretty = true;

			await writeSitemap(cliOptions, args['output-dir'] || args.o || options.pluginOptions.sitemap.outputDir || '.');
		}
	);

	/**
	 * Modify the 'build' command to generate the sitemap automatically
	 */
	const { build } = api.service.commands;
	const buildFn   = build.fn;
	build.fn = async function(...args)
	{
		await buildFn(...args);

		// Don't generate the sitemap if not in production and the option 'productionOnly' is set
		if (options.pluginOptions.sitemap.productionOnly && process.env.NODE_ENV !== 'production') return;

		await writeSitemap(options.pluginOptions.sitemap, options.pluginOptions.sitemap.outputDir || options.outputDir || 'dist');
	};
}

async function writeSitemap(options, outputDir)
{
	// Validate the config and set the default values
	if (!optionsValidator(options))
		throwError(ajv.errorsText(optionsValidator.errors).replace(/^data/, 'options'));

	// Generatethe sitemaps and write them to the filesystem
	const sitemaps = await generateSitemaps(options);
	Object.keys(sitemaps).forEach(function(filename)
	{
		fs.writeFileSync(`${outputDir}/${filename}.xml`, options.pretty ? sitemaps[filename] : sitemaps[filename].replace(/\t+|\n/g, ''));
		console.info(`Generated and written sitemap at '${outputDir.replace(/\/$/, '')}/${filename}.xml'`);
	});
}
