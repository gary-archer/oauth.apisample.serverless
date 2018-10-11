'use strict';

const validator = require('tv4');
const formatter = require('./tv4-formatter');

module.exports.validate = validate;

function validate(object, schema) {
    let validateResult = validator.validateResult(object, schema);
    let response = formatter.format(validateResult);
    return response;
}