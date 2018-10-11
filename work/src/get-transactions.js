'use strict';
const { ValidationError, ServerError } = require('./lib/exceptions/errors');
const isValidDateFormat = require('./lib/processing/date-validator');
const Operation = require('./lib/operation');
const Logger = require('./lib/logging');
const itemTypeMapping = require('./lib/processing/item-type-mapping');
const elasticSearchWrapper = require('./lib/elasticsearch/elasticsearch-wrapper');

module.exports = class extends Operation {
  constructor(consumerApi) {
    super();
    this._consumerApi = consumerApi;
  }

  async process(membershipNumber, queryStringParameters) {
    queryStringParameters = validateParameters(queryStringParameters);

    const membershipDetails = await this._consumerApi.lookupMembershipNumber(membershipNumber, this.lookupMembershipErrorMapper);
    Logger.info('membership number lookup response: ' + JSON.stringify(membershipDetails.data));

    const visitDetailsBody = {
      ProductCode: membershipDetails.data.ProductCode,
      LoungeVisitDateFrom: queryStringParameters.transactionDateFrom || '',
      LoungeVisitDateTo: queryStringParameters.transactionDateTo || ''
    };

    const visitsResponse = await this._consumerApi.postVisits(membershipDetails.data.ConsumerNumber, visitDetailsBody);
    const visits = visitsResponse && visitsResponse.data;

    if (!visits || visits.length === 0) {
      return this.okResponse({data: []});
    }

    const transactions = transactionsTransform(visits);
    const enhancedTransactions = await enhanceTransactions(transactions, membershipDetails.data.ProductCode, queryStringParameters.languageCode, queryStringParameters.includeSection);

    return this.okResponse({data: enhancedTransactions});
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

// Pre processing to do basic validation before calling LB API
const validateParameters = function(queryStringParameters) {
  if (!queryStringParameters || !queryStringParameters.languageCode) {
    throw new ValidationError({errorCode: 'parameter.missing.languageCode', errorDescription: 'The mandatory parameter languageCode was not provided'});
  }
  if (queryStringParameters.transactionDateFrom && !isValidDateFormat(queryStringParameters.transactionDateFrom)) {
    throw new ValidationError({errorCode: 'parameter.format.transactionDateFrom', errorDescription: 'The transaction from date is not a valid ISO timestamp'});
  } 
  if (queryStringParameters.transactionDateTo && !isValidDateFormat(queryStringParameters.transactionDateTo)) {
    throw new ValidationError({errorCode: 'parameter.format.transactionDateTo', errorDescription: 'The transaction to date is not a valid ISO timestamp'});
  }
  if (queryStringParameters.includeSection) {
    const allowedOptionalSections = {
      Location: 'Data.Location',
      Media: 'Data.Media'
    };

    const includeSectionsCamelized = queryStringParameters.includeSection.split(',').map(i => camelize(i.trim()));
    queryStringParameters.includeSection = includeSectionsCamelized.map(i => {
      if (!allowedOptionalSections[i]) {
        throw new ValidationError({errorDescription: `The includeSection parameter must only contain ${Object.keys(allowedOptionalSections).toString()}`, errorCode: 'parameter.format.includeSection'});
      }
      return allowedOptionalSections[i];
    });
  }

  return queryStringParameters;
}

const camelize = function(str) {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

const transactionsTransform = function(visits) {
  return visits.map(visit => ({
    ItemType: itemTypeMapping[visit.VisitType] || visit.VisitType,
    MemberChargeDeclined: visit.MemberChargeDeclined,
    MemberChargeFee: visit.MemberChargeFee,
    MemberChargeCount: visit.MemberChargeCount,
    MemberChargeCurrency: visit.MemberChargeCurrency,
    NonMemberChargeCount: visit.NonMemberChargeCount,
    OutletCode: visit.LoungeCode,
    TotalGuests: visit.TotalGuests,
    TotalVisitors: visit.TotalVisitors,
    ProcessedDate: visit.CreationDate,
    VisitDate: visit.VisitDate,
    VisitReference: visit.VisitReference
  }));
}

const enhanceTransactions = async function(transactions, productCode, languageCode, includeSection) {
  const outletCodes = transactions.map(i => i.OutletCode && i.OutletCode.toString());
  const uniqueOutletCodes = Array.from(new Set(outletCodes)).join(',');

  const elasticSearch = new elasticSearchWrapper();
  const loungeData = await elasticSearch.getLounges(uniqueOutletCodes, productCode, languageCode, includeSection);

  if (!loungeData) {
    throw new ServerError({message: 'An internal server error has occurred'});
  }

  return enhanceTransactionsTransform(transactions, loungeData);
}

const enhanceTransactionsTransform = function(transactions, loungeData) {
  return transactions.map(transaction => {
    const foundLounge = loungeData.find(lounge => lounge.id === transaction.OutletCode);
    const foundLoungeData = foundLounge && foundLounge.data;
    
    if (foundLoungeData && foundLoungeData.Media) {
      transaction['Media'] = foundLoungeData.Media[0];
    }
    if (foundLoungeData && foundLoungeData.Location) {
      transaction['Location'] = foundLoungeData.Location;
    }
    if (foundLoungeData && foundLoungeData.Lounge) {
      transaction['OutletName'] = foundLoungeData.Lounge;
    }
    
    return transaction;
  });
}