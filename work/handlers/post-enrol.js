'use strict';
const logger = require('../src/lib/logging');
const RequestHandlingClass = require('../src/post-enrol');
const consumerApi = require('../src/lib/lambda-utils/consumer-api-init');
const { ValidationError } = require('../src/lib/exceptions/errors');
const enrolMemberSchema = require('../src/schemas/update-member-profile').schema;

const enrolMember = new RequestHandlingClass(consumerApi, enrolMemberSchema);

const { lambdaExecutionAdapter } = require('../src/lib/lambda-utils');

module.exports.handler = async (event, context) => {
  logger.setRequestId(context.awsRequestId || '');
  logger.info('Apigee X-Correlation-Id', (event && event.headers && event.headers['X-Correlation-Id'] || ''));

  const response = await lambdaExecutionAdapter(async () => {
    let payload = null;
    if(typeof event.body === 'string') {
        try{
          payload = JSON.parse(event.body);
        } catch(error){
            throw new ValidationError({errorCode: 'body.format', errorDescription: 'The request body is invalid'});
        }
    }
    else {
        payload = event.body;
    }
    return await enrolMember.process(payload);
  });

  return response;
};
 
