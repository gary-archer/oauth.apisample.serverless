'use strict';

const tv4 = require('tv4');

module.exports.format = formatTv4Response;

const tv4Formatters = {};
tv4Formatters[tv4.errorCodes.INVALID_TYPE] = formatInvalidValue;
tv4Formatters[tv4.errorCodes.OBJECT_REQUIRED] = formatMissingProperty;
tv4Formatters[tv4.errorCodes.STRING_LENGTH_SHORT] = formatInvalidValue;
tv4Formatters[tv4.errorCodes.STRING_LENGTH_LONG] = formatInvalidValue;
tv4Formatters[tv4.errorCodes.STRING_PATTERN] = formatInvalidValue;

const defaultFormatter = (error) => {
    return {
        error: 'invalid_request',
        description: error.message
    }
}

function formatTv4Response(tv4Response) {
    let response = {
        success: true,
        statusCode: 200,
        errorCode: '',
        errorDescription: '',
        headers: {}
    };

    if(!tv4Response.valid) {
        response.statusCode = 400;
        response.success = false;

        let formatter = tv4Formatters[tv4Response.error.code] || defaultFormatter;
        let formattedError = formatter.call(this, tv4Response.error);
        response.errorCode = formattedError.error;
        response.errorDescription = formattedError.description;
    }

    return response;
}

function formatInvalidValue(error) {
    let parameter = error.dataPath.split('/').pop();
    return {
        error: 'parameter.format.' + parameter,
        description: error.message
    }
}

function formatMissingProperty(error) {
    return {
        error: 'parameter.required.' + error.params.key,
        description: error.message
    }
}