const AJV             = require('ajv');
const betterAjvErrors = require('better-ajv-errors');

const { validateW3CDate, slugsSchema, optionsSchema } = require('./schemas.js');

const ajv = new AJV({
	useDefaults: true,
	multipleOfPrecision: 3,

	// Needed for `better-ajv-errors`
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

// Add the options schema to allow recursive references
ajv.addSchema(optionsSchema, 'options.json');

// Compile the validators
const slugsValidator   = ajv.compile(slugsSchema);
const optionsValidator = ajv.compile(optionsSchema);

function throwError(message) {
	throw new Error(`[vue-cli-plugin-sitemap]: ${message}`);
}

/**
 * Validate the slugs
 */
function validateSlugs(slugs, errorMsg) {
	if (!slugsValidator(slugs)) {
		throwError(errorMsg);
	}
}

/**
 * Validate the config and set the default values
 */
function validateOptions(options, printError = false) {
	if (optionsValidator(options)) return;

	/* istanbul ignore if */
	if (printError) {
		console.log(betterAjvErrors(optionsSchema, options, optionsValidator.errors, { indent: 2 }) + '\n');
	}

	throwError('invalid configuration');
}

module.exports = {
	throwError,
	validateSlugs,
	validateOptions,
}
