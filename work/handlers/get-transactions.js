'use strict';

const consumerApi = require('../src/lib/lambda-utils/consumer-api-init');
const RequestHandlingClass = require('../src/get-transactions');
const getTransactions = new RequestHandlingClass(consumerApi);
const logger = require('../src/lib/logging');

const { lambdaExecutionAdapter } = require('../src/lib/lambda-utils');

exports.handler = async (event, context) => {
  logger.setRequestId(context.awsRequestId || '');
  logger.info('Apigee X-Correlation-Id', (event && event.headers && event.headers['X-Correlation-Id'] || ''));

  const memberId = event.pathParameters.id;

  const response = await lambdaExecutionAdapter(async () => {
      return await getTransactions.process(memberId, event.queryStringParameters)
  });

  return response;
};