'use strict';

const { ServerError } = require('../lib/exceptions/errors');

const default_500_message = 'A technical problem was encountered in a Collinson API';

// Post processing to map from LB API unfriendly errors to the friendly errors in our Swagger Spec
module.exports.LookupMembershipErrorMapper = lookupMembershipErrorMapper;
module.exports.GetProfileErrorMapper = getProfileErrorMapper;
module.exports.UpdateAddressErrorMapper = updateAddressErrorMapper;
module.exports.UpdatePersonalDetailsErrorMapper = updatePersonalDetailsErrorMapper;

function lookupMembershipErrorMapper(lbApiError) {

    if (lbApiError.statusCode === 404) {
        lbApiError.errorCode = 'parameter.value.membershipNumber';
        lbApiError.message = 'The membership number was not found';
    }
    return lbApiError;
}

function getProfileErrorMapper(lbApiError) {
    if (lbApiError.statusCode === 404) {
        lbApiError.errorCode = 'parameter.value.membershipNumber';
        lbApiError.message = 'The membership number was not found';
    } else if (lbApiError.errorCode === 'consumerDoesNotExist') {
        lbApiError.statusCode = 404;
        lbApiError.errorCode = 'parameter.value.membershipNumber';
        lbApiError.message = 'The membership number was not found';
    } else if (lbApiError.errorCode === 'consumerProductCodeMismatch') {
        // This should never happen since we looked up those two values ourselves
        // So if it does - it should be treated as 500 internal error
        lbApiError = serverErrorResponse(lbApiError);
    }
    return lbApiError;
}

function updatePersonalDetailsErrorMapper(lbApiError) {
    switch (lbApiError.errorCode) {
        case 'consumerDoesNotExist':
            lbApiError.statusCode = 404;
            lbApiError.errorCode = 'parameter.value.membershipNumber';
            lbApiError.message = 'The membership number was not found';
            break;
        case 'parameterInvalid_title':
            // Should we expose an endpoint of available titles?
            lbApiError.errorCode = 'parameter.value.Title';
            lbApiError.message = 'The title is not available';
            break;
        case 'parameterInvalid_forename':
            lbApiError.errorCode = 'parameter.value.Forename';
            lbApiError.message = 'The forename is invalid';
            break;
        case 'parameterInvalid_surname':
            lbApiError.errorCode = 'parameter.value.Surname';
            lbApiError.message = 'The surname is invalid';
            break;
        case 'updateError': // This seems to be thrown for any uncaught update error
            lbApiError = serverErrorResponse(lbApiError);
            break;
    }
    return lbApiError;
}

function updateAddressErrorMapper(lbApiError) {
    switch (lbApiError.errorCode) {
        case 'consumerNotFound':
            lbApiError.statusCode = 404;
            lbApiError.errorCode = 'parameter.value.membershipNumber';
            lbApiError.message = 'The membership number was not found';
            break;
        case 'parameterInvalid_addressPurpose':
            lbApiError = serverErrorResponse(lbApiError);
            break;
        case 'parameterInvalid_ISOCountryCode':
            lbApiError.errorCode = 'parameter.value.ISOCountryCode';
            lbApiError.message = 'The value of countryCode is not formatted correctly, it must adhere to ISO 3166-1 alpha-3 code, e.g., GBR (* may be changed to a 2 digit ISO code)';
            break;
        case 'parameterInvalid_addressLine1':
            lbApiError.errorCode = 'parameter.value.AddressLine1';
            lbApiError.message = 'The address line is invalid';
            break;
        case 'parameterInvalid_postcode':
            lbApiError.errorCode = 'parameter.value.Postcode';
            lbApiError.message = 'The post code is invalid';
            break;
        case 'parameterInvalid_city':
            lbApiError.errorCode = 'parameter.value.City';
            lbApiError.message = 'The city is invalid';
            break;
        case 'parameterInvalid_state':
            lbApiError.errorCode = 'parameter.value.USStateCode';
            lbApiError.message = 'The US state code is invalid';
            break;
        case 'updateError':// This seems to be thrown for any uncaught update error
            lbApiError = serverErrorResponse(lbApiError);
            break;
    }
    return lbApiError;
}

function serverErrorResponse(exception) {
    // Make sure we retain stack and details
    const serverError = new ServerError({
        statusCode: 500,
        errorCode: 'internal_server_error',
        message: default_500_message,
        details: exception.details
    });
    serverError.stack = exception.stack;
    return serverError;
}