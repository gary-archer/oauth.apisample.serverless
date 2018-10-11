'use strict';

const ErrorHandler = require('../exceptions/errorHandler');
const { ServerError, TravelExperiencesError, ValidationError } = require('../exceptions/errors');

const default_400_message = 'An invalid request was received, containing incomplete or malformed input';
const default_403_message = 'The caller is not authorized to access the resource specified in the request';
const default_404_message = 'The resource requested was not found';
const default_500_message = 'A technical problem was encountered in a Collinson API'

module.exports = class {
    handleResponse(apiResponse) {
        return {
            statusCode: apiResponse.statusCode,
            statusMessage: apiResponse.statusMessage,
            data: apiResponse.body
        };
    }

    // Do common work to translate from LB API errors to Swagger errors
    handleError(error, url, errorMapper) {

        // If we have already been processed, as for failures downloading the AWS secret, then just rethrow
        if(error instanceof TravelExperiencesError) {
            throw error;
        }

        // Handle general HTTP errors in common code but record the attempted URL
        if(!error.statusCode) {
            const serverError = ErrorHandler.errorFromException(error);
            serverError.details.url = url;
            throw serverError;
        }

        // Do the common work to read LB API error details if they exist
        const lbApiData = {
            url,
            errors: []
        };
        if(error.response && error.response.body) {
            lbApiData.errors = parseLbApiErrorResponse(error.response.body);
            if(lbApiData.errors.length === 0) {
                lbApiData.response = error.response.body;
            }
        }

        // Handle errors written by LB API code and sanitize them
        let defaultError = error;
        switch(error.statusCode) {
            case 400:
                defaultError = validationErrorResponse(lbApiData);
                break;

            case 401:
                defaultError = unauthorizedResponse(lbApiData);
                break;

            case 403:
                defaultError = forbiddenResponse(lbApiData);
                break;

            case 404:
                defaultError = notFoundErrorResponse(lbApiData);
                break;

            case 500:
                defaultError = serverErrorResponse(lbApiData);
                break;
        }

        // Next we give each operation a change to improve LB API errors
        let sanitizedError = defaultError;
        if(errorMapper && typeof errorMapper === 'function') {
            sanitizedError = errorMapper(sanitizedError) || sanitizedError;
        }

        throw sanitizedError;
    }
}

function validationErrorResponse(lbApiData) {
        
    if(lbApiData.errors.length === 0) {
        return new ValidationError({
            statusCode: 400,
            errorCode: 'request.invalid',
            errorDescription: default_400_message,
            details: lbApiData
        });
    }
    else {
        return new ValidationError({
            statusCode: 400,
            errorCode: lbApiData.errors[0].ErrorCode,
            errorDescription: lbApiData.errors[0].ErrorMessage,
            details: lbApiData
        });
    }
}

// If we fail an API operation due to expiry of an LB API token it is a bug in XAPI code or a configuration problem
// XAPI should deal with token renewal and LB API token expiry must not result in Mastercard receiving a 401
function unauthorizedResponse(lbApiData) {
        
    return new ServerError({
        statusCode: 500,
        errorCode: 'internal_server_error',
        message: default_500_message,
        details: lbApiData
    });
}

function forbiddenResponse(lbApiData) {
        
    return new ValidationError({
        statusCode: 403,
        errorCode: 'request.forbidden',
        errorDescription: default_403_message,
        details: lbApiData
    });
}

function notFoundErrorResponse(lbApiData) {

    if(lbApiData.errors.length === 0) {
        return new ValidationError({
            statusCode: 404,
            errorCode: 'resource.not_found',
            errorDescription: default_404_message,
            details: lbApiData
        });
    }
    else {
        return new ValidationError({
            statusCode: 404,
            errorCode: lbApiData.errors[0].ErrorCode,
            errorDescription: lbApiData.errors[0].ErrorMessage,
            details: lbApiData
        });
    }
}

function serverErrorResponse(lbApiData) {
        
    if(lbApiData.errors.length === 0) {
        return new ServerError({
            statusCode: 500,
            errorCode: 'internal_server_error',
            message: default_500_message,
            details: lbApiData
        });
    }
    else {
        return new ServerError({
            statusCode: 500,
            errorCode: 'internal_server_error',
            message: default_500_message,
            details: lbApiData
        });
    }
}

// Return an array of LB API errors, which most commonly contains a single element
function parseLbApiErrorResponse(data) {
    if(isLBErrorMessage(data)) {
        return [data];
    }

    if(Array.isArray(data)) {
        return data.filter(t => isLBErrorMessage(t));
    }

    return [];
}

function isLBErrorMessage(data) {
    return data && data.hasOwnProperty('ErrorCode') && data.hasOwnProperty('ErrorMessage');
}
