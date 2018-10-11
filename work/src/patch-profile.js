const truncateTransformer = require('./lib/processing/transform-truncate');
const removeNullsTransformer = require('./lib/processing/transform-remove-nulls');
const validator = require('./lib/processing/tv4-validator');
const { ValidationError } = require('./lib/exceptions/errors');
const Operation = require('./lib/operation');
const patchSchema = require('./schemas/json-patch').schema;
const deepEqual = require('deep-equal');
const jsonPatch = require('fast-json-patch');
const LBMemberErrors = require('./mapping/lb-member-error-mappers');

module.exports = class extends Operation {
    constructor(consumerApi, schema) {
        super();
        this._consumerApi = consumerApi;
        this._schema = schema;
    }

    async process(membershipNumber, data) {
        // Validate patch request is syntactically correct; the actual data check is performed below, after the path operations have been applied
        const patchValidation = validator.validate(data, patchSchema);
        if (!patchValidation.success) {
            throw new ValidationError({ errorCode: 'body.format', errorDescription: 'The request body is not a valid patch request' });
        }

        const lookupResponse = await this._consumerApi.lookupMembershipNumber(membershipNumber, LBMemberErrors.LookupMembershipErrorMapper);
        const consumer = lookupResponse && lookupResponse.data;

        const consumerProfile = await this._consumerApi.getConsumerProfile(consumer.ProductCode, consumer.ConsumerNumber, LBMemberErrors.GetProfileErrorMapper);

        const payloadOrigin = getXapiPayloadFromBackendData(consumerProfile.data);

        const addressOrigin = prepareAddressPayload(consumer.ProductCode, payloadOrigin);
        const profileOrigin = prepareProfilePayload(consumer.ProductCode, payloadOrigin);

        const patchError = jsonPatch.validate(data, payloadOrigin);
        if (patchError) {
            throw new ValidationError({ errorCode: 'parameter.invalid.patchOperation', errorDescription: patchError.message });
        }
        const patchResult = jsonPatch.applyPatch(payloadOrigin, data);
        let updatedProfile = patchResult.newDocument;

        updatedProfile = truncateTransformer.process(updatedProfile, this._schema['client-request']);

        const validationResult = validator.validate(updatedProfile, this._schema['client-request']);

        if (!validationResult.success) {
            throw new ValidationError(validationResult);
        }

        // Prepare profile payload and update ONLY if any changes on the profile itself (ref the profileOrigin above)
        const profileUpdate = removeNullsTransformer.process(prepareProfilePayload(consumer.ProductCode, updatedProfile));
        if (!deepEqual(profileUpdate, profileOrigin)) {
            await this._consumerApi.updatePersonalDetails(consumer.ConsumerNumber, profileUpdate, LBMemberErrors.UpdatePersonalDetailsErrorMapper);
        }
        // Prepare address payload and execute update ONLY if anything changes on the address itself (ref the addressOrigin above)
        const addressUpdate = removeNullsTransformer.process(prepareAddressPayload(consumer.ProductCode, updatedProfile));
        if (!deepEqual(addressUpdate, addressOrigin)) {
            await this._consumerApi.updateDeliveryAddress(consumer.ConsumerNumber, addressUpdate, LBMemberErrors.UpdateAddressErrorMapper);
        }

        return this.okResponse();
    }
}

function getXapiPayloadFromBackendData(source) {
    let response = {
        Surname: source.Surname,
        Forename: source.Forename,
        Title: source.Title,
        PhoneNumber: source.PhoneNumber.Number,
        CommunicationDetails: {
            PreferredISOLanguageCode: source.ConsumerCommunication.PreferredISOLanguageCode,
            Email: source.ConsumerSecurity.Email
        },
        AddressDetails: {
            AddressLine1: source.DeliveryAddress.AddressLine1,
            AddressLine2: source.DeliveryAddress.AddressLine2,
            AddressLine3: source.DeliveryAddress.AddressLine3,
            City: source.DeliveryAddress.City,
            USStateCode: source.DeliveryAddress.USStateCode,
            Province: source.DeliveryAddress.Province,
            Postcode: source.DeliveryAddress.PostCode,
            ISOCountryCode: source.DeliveryAddress.ISOCountryCode
        }
    }
    return response;
}

function prepareProfilePayload(productCode, data) {
    let response = {
        ProductCode: productCode,
        Surname: getPatchStringValue(data.Surname),
        Forename: getPatchStringValue(data.Forename),
        Title: getPatchStringValue(data.Title),
        CountryOfResidence: getPatchStringValue(data.AddressDetails.ISOCountryCode),
        PhoneNumber: {
            Number: getPatchStringValue(data.PhoneNumber)
        }
    };
    return response;
}

function prepareAddressPayload(productCode, data) {
    let response = {
        ProductCode: productCode,
        AddressLine1: getPatchStringValue(data.AddressDetails.AddressLine1),
        AddressLine2: getPatchStringValue(data.AddressDetails.AddressLine2),
        AddressLine3: getPatchStringValue(data.AddressDetails.AddressLine3),
        City: getPatchStringValue(data.AddressDetails.City),
        USStateCode: getPatchStringValue(data.AddressDetails.USStateCode),
        Province: getPatchStringValue(data.AddressDetails.Province),
        Postcode: getPatchStringValue(data.AddressDetails.Postcode),
        ISOCountryCode: getPatchStringValue(data.AddressDetails.ISOCountryCode)
    };
    return response;
}

// For our LB use case, patch operation of removing an object property should translate to
// resetting the value of the property to it's default (in case of strings => to an empty string)
function getPatchStringValue(value) {
    return value || '';
}