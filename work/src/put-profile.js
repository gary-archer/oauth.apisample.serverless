const truncateTransformer = require('./lib/processing/transform-truncate');
const removeNullsTransformer = require('./lib/processing/transform-remove-nulls');
const validator = require('./lib/processing/tv4-validator');
const {ValidationError} = require('./lib/exceptions/errors');
const Operation = require('./lib/operation');

module.exports = class extends Operation {
    constructor(consumerApi, schema) {
        super();
        this._consumerApi = consumerApi;
        this._schema = schema;
    }

    async process(membershipNumber, data) {

        // Preprocess the request
        const payload = truncateTransformer.process(data, this._schema['client-request']);

        // Validate the request
        const validationResult = validator.validate(payload, this._schema['client-request']);

        if(!validationResult.success) {
            throw new ValidationError(validationResult);
        }

        // Lookup member information
        const lookupResponse = await this._consumerApi.lookupMembershipNumber(membershipNumber, this.lookupMembershipErrorMapper);
        const consumer = lookupResponse && lookupResponse.data;

        // All good? call several backend mehtods to update the details
        const profileUpdateRequestPayload = removeNullsTransformer.process(prepareProfilePayload(consumer.ProductCode, payload));
        await this._consumerApi.updatePersonalDetails(consumer.ConsumerNumber, profileUpdateRequestPayload);

        const addressUpdateRequestPayload = removeNullsTransformer.process(prepareAddressPayload(consumer.ProductCode, payload));
        await this._consumerApi.updateDeliveryAddress(consumer.ConsumerNumber, addressUpdateRequestPayload);

        // Return appropriate response
        return this.okResponse();
    }

    // Post processing to map from LB API unfriendly errors to the friendly errors in our Swagger Spec
    lookupMembershipErrorMapper(lbapiError) {
    
        if(lbapiError.statusCode === 404) {
            lbapiError.errorCode = 'parameter.value.membershipNumber';
            lbapiError.message = 'The membership number was not found';
        }
        return lbapiError;
    }
}

function prepareProfilePayload(productCode, data) {
    let response = {
        ProductCode: productCode,
        Surname: data.Surname,
        Forename: data.Forename,
        Title: data.Title,
        CountryOfResidence: data.AddressDetails.ISOCountryCode
    };

    if(data.PhoneNumber && data.PhoneNumber.length) {
        response.PhoneNumber = {
            Number: data.PhoneNumber
        }
    }

    return response;
}

function prepareAddressPayload(productCode, data) {
    let response = {
        ProductCode: productCode,
        AddressLine1: data.AddressDetails.AddressLine1,
        AddressLine2: data.AddressDetails.AddressLine2,
        AddressLine3: data.AddressDetails.AddressLine3,
        City: data.AddressDetails.City,
        USStateCode: data.AddressDetails.USStateCode,
        Province: data.AddressDetails.Province,
        Postcode: data.AddressDetails.Postcode,
        IsBusinessAddress: true,
        ISOCountryCode: data.AddressDetails.ISOCountryCode
    };
    return response;
}