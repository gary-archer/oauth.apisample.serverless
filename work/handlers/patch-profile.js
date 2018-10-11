'use strict';
const logger = require('../src/lib/logging');
const consumerApi = require('../src/lib/lambda-utils/consumer-api-init');
const { ValidationError } = require('../src/lib/exceptions/errors');
const updateMemberProfileSchema = require('../src/schemas/update-member-profile').schema;

const RequestHandlingClass = require('../src/patch-profile');
const RequestHandlingImplementation = new RequestHandlingClass(consumerApi, updateMemberProfileSchema);

const { lambdaExecutionAdapter } = require('../src/lib/lambda-utils');

exports.handler = async (event, context) => {
    logger.setRequestId(context.awsRequestId || '');
    logger.info('Apigee X-Correlation-Id', (event && event.headers && event.headers['X-Correlation-Id'] || ''));

    const memberId = event.pathParameters.id;

    const response = await lambdaExecutionAdapter(async () => {
        let payload = null;
        if (typeof event.body === 'string') {
            try {
                payload = JSON.parse(event.body);
            } catch (error) {
                throw new ValidationError({ errorCode: 'body.format', errorDescription: 'The request body is invalid' });
            }
        }
        else {
            payload = event.body;
        }
        return await RequestHandlingImplementation.process(memberId, payload);
    });

    return response;
};

