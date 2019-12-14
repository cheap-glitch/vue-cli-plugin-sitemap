
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

const xml       = require('./src/xml');
const validator = require('./src/validation');

function generateSitemap(_routes)
{
	return `<?xml version="1.0" encoding="UTF-8"?>
		<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
		${
			_routes.map(_route => {

			});
		}
		</urlset>`;
}

/**
 * Webpack plugin
 */
// @TODO

/**
 * Service plugin
 */
module.exports = function(_api, _options)
{
	_api.registerCommand(
		'sitemap',
		{
			usage:        'vue-cli-service sitemap',
			description:  'Generate a sitemap file',
			options: {
				'--pretty': 'Add line breaks and tabs to make the sitemap human-readable',
			}
		},
		() => {
		}
	);
}
