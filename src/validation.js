
/**
 * src/validation.js
 */

const AJV = require('ajv');

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
const YYYY = '[12]\\d{3}';
const MM   = '(?:0[1-9]|1[0-2])';
const DD   = '(?:0[1-9]|[12]\\d|3[01])';
const hh   = '(?:[01]\\d|2[0-3])';
const mm   = '[0-5]\\d';
const ss   = '[0-5]\\d';
const s    = '\\d+';
const TZD  = `(?:Z|[+-]${hh}:${mm})`;
const W3CDatePattern = `^${YYYY}(?:-${MM}(?:-${DD}(?:T${hh}:${mm}(?::${ss}(?:\\.${s})?)?${TZD})?)?)?$`;

/**
 * Schemas for the URL parameters
 */
const URLParamsSchemas = {
	lastmod: {
		W3CDate:     true,
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
}

module.exports = function validateOptions(_options)
{
	const validator = new AJV({ useDefaults: true });

	// Add a keyword to validate the dates
	validator.addKeyword('W3CDate', {
		validate(_data, _dataPath, _parentData, _parentDataPropName)
		{
			// If the provided data is a Date object
			if (Object.prototype.toString.call(_data) === "[object Date]")
			{
				// Export the date in a W3C-approved format
				_parentData[_parentDataPropName] = _data.toISOString();

				return true;
			}

			// If the data is a string
			if (typeof _data == 'string')
			{
				// Check that it matches the W3C date format
				const W3CDateFormat = new RegExp(W3CDatePattern);
				if (W3CDateFormat.test(_data))
					return true;

				// Else, try to create a Date object and to export it as a string
				const date = new Date(_data);
				if (isNaN(date.getTime()))
					return false;

				_parentData[_parentDataPropName] = date.toISOString();

				return true;
			}

			return false;
		},
		schema:    false,
		modifying: true,
	});

	const schema = {
		type: 'object',

		// Require either the 'urls' or 'routes' property, but not both
		oneOf: [
			{ required: ['urls']   },
			{ required: ['routes'] },
		],

		properties: {

			/**
			 * Meta options
			 * -------------------------------------------------------------
			 */
			productionOnly: {
				type:     'boolean',
				default:  false,
			},
			baseUrl: {
				type:     'string',
				format:   'uri',
				default:  null,
			},
			trailingSlash: {
				type:     'boolean',
				default:  false,
			},
			pretty: {
				type:     'boolean',
				default:  false,
			},

			/**
			 * Default URL parameters
			 * -------------------------------------------------------------
			 */
			defaults: {
				type:                  'object',
				properties:            URLParamsSchemas,
				additionalProperties:  false,
				default:               {},
			},

			/**
			 * Routes
			 * -------------------------------------------------------------
			 */
			routes: {
				type: 'array',

				items: {
					type: 'object',

					properties: {
						sitemap: {
							type: 'object',

							properties: {
								slugs: {
									type:  'array',
									items: { type: ['number', 'string'] }
								},
								...URLParamsSchemas
							},
							additionalProperties: false
						},
						...URLParamsSchemas
					},
					additionalProperties: true
				}
			},

			/**
			 * URLs
			 * -------------------------------------------------------------
			 */
			urls: {
				type: 'array',

				items: {
					type: 'object',

					properties: {
						loc: {
							type:   'string',
							format: 'uri',
						},
						...URLParamsSchemas
					},
					required:              ['loc'],
					additionalProperties:  false,
				}
			},
		},
		additionalProperties: false,
	};

	return !validator.validate(schema, _options) ? validator.errorsText() : null;
}
