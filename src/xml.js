
/**
 * src/xml.js
 */

/**
 * Helper functions to generate XML
 */
const attrStr    = _attrs => Object.keys(_attrs).reduce((__str, __attr) => _attrs[__attr] !== null ? __str + `${__attr}="${_attrs[__attr]}"` : __str);
const openingTag = (_tag, _attrs)             => `<${_tag}${attrStr(_attrs)}>`;
const closingTag = _tag                       => `</${_tag}>`;
const singleTag  = (_tag, _attrs)             => `<${_tag}${attrStr(_attrs)} />`;
const fullTag    = (_tag, _innerText, _attrs) => `${openingTag(_tag, _attrs)}${_innerText}${closingTag(_tag)}`;

module.exports = {
	openingTag,
	closingTag,
	singleTag,
	fullTag,
};
