'use strict';
const logger = require('../src/lib/logging');

const consumerApi = require('../src/lib/lambda-utils/consumer-api-init');
const RequestHandlingClass = require('../src/get-dmc');
const getDmc = new RequestHandlingClass(consumerApi);
const Logger = require('../src/lib/logging');

const { lambdaExecutionAdapter } = require('../src/lib/lambda-utils');

module.exports.handler = async (event, context) => {
  logger.setRequestId(context.awsRequestId || '');
  logger.info('Apigee X-Correlation-Id', (event && event.headers && event.headers['X-Correlation-Id'] || ''));

  const response = await lambdaExecutionAdapter(async () => {
    const membershipNumber = event.pathParameters.id;
    Logger.info('GET DMC called for the following membershipNumber:' + membershipNumber);
    return await getDmc.process(membershipNumber)
  });

  return response;
};
