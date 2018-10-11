'use strict';
const truncateTransformer = require('./lib/processing/transform-truncate');
const validator = require('./lib/processing/tv4-validator');
const isValidEmailFormat = require('./lib/processing/email-validator');
const isValidISOCountryCodeFormat = require('./lib/processing/isocountrycode-validator');
const { ValidationError } = require('./lib/exceptions/errors');
const removeNullsTransformer = require('./lib/processing/transform-remove-nulls');
const Operation = require('./lib/operation');

module.exports = class extends Operation {
  constructor(consumerApi,schema) {
    super();
    this._consumerApi = consumerApi;
    this._schema = schema;
  }
  async process(data){
    // validate enrolToken exists as string
    if(!data.EnrolToken || typeof data.EnrolToken != 'string'){
      throw new ValidationError({errorCode: 'parameter.required.EnrolToken', errorDescription: 'Missing required property EnrolToken'});
    }
    // validate the token is correct format
    const token = tokenValidation(data.EnrolToken);
    data.AddressDetails = data.AddressDetails || {};
    data.countryOfResidence = data.countryOfResidence || data.AddressDetails.ISOCountryCode || '';
    data.PhoneNumber = data.PhoneNumber || '';
    
    // Preprocess the request
    const payload = truncateTransformer.process(data, this._schema['client-request']);
    // Validate the request
    const validationResult = validator.validate(payload, this._schema['client-request']);
    
    if(!validationResult.success) {
      throw new ValidationError(validationResult);
    }

    //validate correct email address format
    if(payload.CommunicationDetails.Email && !isValidEmailFormat(payload.CommunicationDetails.Email)){
      throw new ValidationError({errorCode: 'parameter.format.Email', errorDescription: 'The email address does not match a standard email format'});
    }
    // PreferredISOLanguageCode 
    payload.CommunicationDetails.PreferredISOLanguageCode = languageCodeValidation(token.ProductCode, payload.CommunicationDetails.PreferredISOLanguageCode);
    if(!payload.CommunicationDetails.PreferredISOLanguageCode.length){
      return this.notFoundResponse({errorCode: 'parameter.format.PreferredISOLanguageCode', message: 'A valid ISO language code in the form en-US must be provided'});
    }
    //validate  correct ISOCountryCode format
    if(!isValidISOCountryCodeFormat(payload.AddressDetails.ISOCountryCode)){
      throw new ValidationError({errorCode: 'parameter.format.ISOCountryCode', errorDescription: 'The value of countryCode is not formatted correctly, it must adhere to ISO 3166-1 alpha-3 code'});
    }

    const memberEnrolPayload = removeNullsTransformer.process(prepareEnrolPayload(token.SourceCode, token.ProductCode, token.CardRegistrationToken, payload));
    const memberEnrolResponse = await this._consumerApi.createDummyBankCardMember(memberEnrolPayload);
    
    // TODO: some resposne validation ?
    const returnRespose = {statusCode: memberEnrolResponse.statusCode, statusMessage: memberEnrolResponse.statusMessage, data: {'MembershipNumber': memberEnrolResponse.data.MembershipNumber}};
    if(memberEnrolResponse.statusCode == 201){
      return this.createdResponse(returnRespose);
    } else {
      return this.okResponse(returnRespose);
    }
  }   
}

function prepareEnrolPayload(sourceCode, productCode,CardRegistrationToken, data){
  let payload  = {
    Addresses: {
      DELIVERY: {
        AddressLine1: data.AddressDetails.AddressLine1,
        AddressLine2: data.AddressDetails.AddressLine2,
        AddressLine3: data.AddressDetails.AddressLine3,
        City: data.AddressDetails.City,
        USStateCode:data.AddressDetails.USStateCode,
        Province: data.AddressDetails.Province,
        Postcode: data.AddressDetails.Postcode,
        ISOCountryCode: data.AddressDetails.ISOCountryCode
      }
    },
    CommunicationDetails: data.CommunicationDetails,
    Surname: data.Surname,
    Forename: data.Forename,
    Title: data.title,
    PhoneNumber: data.PhoneNumber.Number,
    ProductCode: productCode,
    SourceCode: sourceCode,
    CardRegistrationToken: CardRegistrationToken,
    countryOfResidence: data.countryOfResidence
  };
  return payload;
}

function tokenValidation(EnrolToken) {
  var token = EnrolToken.split('|')
  if (token.length !== 3) {
    throw new ValidationError({errorCode: 'parameter.format.EnrolToken', errorDescription: 'The enrolment token has an invalid format different to that returned from the tokenize endpoint'});
  }
  return { CardRegistrationToken: token[0], SourceCode: token[1], ProductCode: token[2] }
}

function languageCodeValidation(productCode, languageCode) {
  //TODO: move this to lib validation
  if (languageCode.length != 5 || !languageCode.includes('-'))
  {
    return '';
  }
  var lbCode = languageCode.split('-')[0];
  // Chinese is the only case where we keep 5 letter codes
  if (lbCode === 'zh') {
    // special case for TW for LK product
    if (productCode === 'LK' && languageCode === 'zh-TW') {
      return 'zh-HK';
    } else {
      return languageCode;
    }
  } else {
    return lbCode;
  }
}

