
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

const fs                   = require('fs');
const chalk                = require('chalk');

const { validateOptions }  = require('./src/validation.js');
const { generateSitemaps } = require('./src/sitemap.js');

module.exports = async function(api, vueCliOptions) {
	const options = vueCliOptions ? vueCliOptions.pluginOptions ? (vueCliOptions.pluginOptions.sitemap || null) : null : null;

	/**
	 * Add a new command to generate the sitemap
	 */
	api.registerCommand(
		'sitemap',
		{
			usage:       'vue-cli-service sitemap [options]',
			description: 'Generate the sitemap',

			options: {
				'-p, --pretty':                 'Prettify the XML to make the sitemap more human-readable',
				'-o <dir>, --output-dir <dir>': 'Output the sitemap to the specified path instead of the current working directory',
			},
		},
		async function(args) {
			if (!options) {
				console.error(`${chalk.black.bgRed(' ERROR ')} Please set up the plugin before using it (more infos at https://github.com/cheap-glitch/vue-cli-plugin-sitemap#setup)`);
				return;
			}

			// Use the config as the default for the CLI options
			const cliOptions = { ...options };
			if (args.pretty || args.p)
				cliOptions.pretty = true;

			await writeSitemap(cliOptions, args['output-dir'] || args['o'] || options.outputDir || '.');
		}
	);

	/**
	 * Modify the 'build' command to generate the sitemap automatically
	 */
	if (options) {
		const { build }     = api.service.commands;
		const buildFunction = build.fn;

		build.fn = async function(...args) {
			await buildFunction(...args);

			// Don't generate the sitemap if not in production and the option 'productionOnly' is set
			if (options.productionOnly && process.env.NODE_ENV !== 'production') return;

			await writeSitemap(options, options.outputDir || vueCliOptions.outputDir || 'dist');
		};
	}
}

async function writeSitemap(options, outputDir) {
	// Validate options and set default values
	validateOptions(options, true);

	// Generate the sitemaps and write them to the filesystem
	const sitemaps = await generateSitemaps(options);
	Object.keys(sitemaps).forEach(function(filename) {
		const output = `${outputDir}/${filename}.xml`;

		// Avoid writing the same sitemap twice when creating two bundles (e.g. using --modern option)
		if (!fs.existsSync(output)) {
			fs.writeFileSync(output, options.pretty ? sitemaps[filename] : sitemaps[filename].replace(/\t+|\n/g, ''));
			console.info(`${chalk.black.bgGreen(' DONE ')} Sitemap successfully generated (${output})`);
		}
	});
}
