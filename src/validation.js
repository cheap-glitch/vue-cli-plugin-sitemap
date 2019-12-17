
/**
 * src/validation.js
 */

const AJV       = require('ajv');
const validator = new AJV();

/**
 * Regex to check that the date follows the W3C format
 *
 * Acceptable formats:
 *    YYYY
 *    YYYY-MM
 *    YYYY-MM-DD
 *    YYYY-MM-DDThh:mmTZD
 *    YYYY-MM-DDThh:mm:ssTZD
 *    YYYY-MM-DDThh:mm:ss.sTZD
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
const YYYY = '^[12]\\d{3}';
const MM   = '(?:0[1-9]|1[0-2])';
const DD   = '(?:0[1-9]|2\\d|3[01])';
const hh   = '(?:[01]\\d|2[0-3])';
const mm   = '[0-5]\\d';
const ss   = '[0-5]\\d';
const s    = '\\d+';
const TZD  = `(?:Z|[+-]${hh}:${mm})`;
const W3CDatePattern = `^${YYYY}(?:-${MM}(?:-${DD}(?:T${hh}:${mm}(?::${ss}(?:\\.${s})?)?${TZD})?)?$`;

/**
 * Create a validator for the array of routes
 */
module.exports = validator.compile({
	type: 'array',
	items: {
		type: 'object',

		properties: {
			sitemap: {
				type: 'object',

				properties: {
					loc: {
						type:        'string',
						format:      'uri',
					},
					lastmod: {
						type:        'string',
						pattern:     W3CDatePattern;
					},
					changefreq: {
						type:        'string',
						enum:        ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'],
					},
					priority: {
						type:        'number',
						multipleOf:  0.1,
						minimum:     0.0,
						maximum:     1.0,
					},
				},
				additionalProperties: false
			}
		},
		additionalProperties: true
	},
});
