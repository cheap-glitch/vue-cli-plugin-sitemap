
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

const AJV = require('ajv');

/**
 * Create a validator for the routes
 */
const validator = new AJV();
const validate  = validator.compile({
	type: 'array',
	items: {
		type: 'object',

		properties: {
			loc: {
				type:   'string',
				format: 'uri',
			},
			lastmod: {
				type:   'string',

				/**
				 * @TODO:
				 * Check that the date follows the W3C format:
				 *
				 * YYYY-MM-DDThh:mm:ss.sTZD
				 *
				 * where:
				 *    YYYY = four-digit year
				 *    MM   = two-digit month (01=January, etc.)
				 *    DD   = two-digit day of month (01 through 31)
				 *    hh   = two digits of hour (00 through 23) (am/pm NOT allowed)
				 *    mm   = two digits of minute (00 through 59)
				 *    ss   = two digits of second (00 through 59)
				 *    s    = one or more digits representing a decimal fraction of a second
				 *    TZD  = time zone designator (Z or +hh:mm or -hh:mm)
				 */
				pattern: '',
			},
			changefreq: {
				type:   'string',
				enum:   ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'],
			},
		},
		additionalProperties: true,
	},
});

/**
 * Helper functions to generate XML
 */
const fullTag    = (_tag, _innerText, _attrs) => `${openingTag(_tag, _attrs)}${_innerText}${closingTag(_tag)}`;
const openingTag = (_tag, _attrs)             => `<${_tag}${this.attrStr(_attrs)}>`;
const closingTag = _tag                       => `</${_tag}>`;
const singleTag  = (_tag, _attrs)             => `<${_tag}${this.attrStr(_attrs)} />`;
const attrStr    = _attrs                     => Object.keys(_attrs).reduce((_s, _a) => _attrs[_a] !== null ? _s + `${_a}="${_attrs[_a]}"` : _s);

/**
 * Function to generate the XML sitemap from an array of routes
 */
function generateSitemap(_routes)
{

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
