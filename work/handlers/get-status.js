'use strict';
const logger = require('../src/lib/logging');

const consumerApi = require('../src/lib/lambda-utils/consumer-api-init');
const RequestHandlingClass = require('../src/get-status');
const getStatus = new RequestHandlingClass(consumerApi);
const Logger = require('../src/lib/logging');

const { lambdaExecutionAdapter } = require('../src/lib/lambda-utils');

module.exports.handler = async (event, context) => {
  logger.setRequestId(context.awsRequestId || '');
  let apigeeCorrelationId = event && event.headers && event.headers['X-Correlation-Id'] || '';
  logger.info('Apigee X-Correlation-Id', apigeeCorrelationId);

  const response = await lambdaExecutionAdapter(async () => {
    Logger.info("GET status called");
    return await getStatus.process(event.path, apigeeCorrelationId);
  });

  return response;
};
