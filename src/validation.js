
/**
 * src/validation.js
 */

const AJV             = require('ajv');
const betterAjvErrors = require('better-ajv-errors');

const { validateW3CDate, slugsSchema, optionsSchema } = require('./schemas');

const ajv = new AJV({
	useDefaults:          true,
	multipleOfPrecision:  3,

	// Needed for better-ajv-errors
	jsonPointers: true,
});

// Add extra keywords
require('ajv-keywords')(ajv, ['typeof', 'instanceof', 'patternRequired']);

// Add a keyword to validate the dates
ajv.addKeyword('W3CDate', {
	validate:  validateW3CDate,
	type:      ['object', 'string', 'number'],
	schema:    false,
	modifying: true,
});

// Compile the validators
const slugsValidator   = ajv.compile(slugsSchema);
const optionsValidator = ajv.compile(optionsSchema);

function throwError(message)
{
	throw new Error(`[vue-cli-plugin-sitemap]: ${message}`);
}

/**
 * Validate the slugs
 */
function validateSlugs(slugs)
{
	if (!slugsValidator(slugs))
		throwError(betterAjvErrors(optionsSchema, slugs, optionsValidator.errors));
}

/**
 * Validate the config and set the default values
 */
function validateOptions(options)
{
	if (!optionsValidator(options))
		throwError(betterAjvErrors(optionsSchema, options, optionsValidator.errors));
}

module.exports = {
	throwError,
	validateSlugs,
	validateOptions,
}
