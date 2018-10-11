'use strict';
const md5 = require('md5');
const errorHandler = require('../exceptions/errorHandler');
const {ValidationError} = require('../exceptions/errors');

module.exports.lambdaExecutionAdapter = lambdaExecutionAdapter;

async function lambdaExecutionAdapter(fx) {
    let result;
    try {
        let res = await fx.call(this);
        result = {
            statusCode: res.statusCode,
            body: res.data
        };

        if (res.headers){
          result.headers = res.headers;
        }
    } catch(exception) {
        let error = errorHandler.handleServerException(exception);

        if(error instanceof ValidationError) {
            result = {
                statusCode: error.statusCode,
                body: {
                    code: error.statusCode.toString(),
                    error: error.errorCode,
                    description: error.message
                }
            };
        } else {
            result = {
                statusCode: error.statusCode,
                body: {
                    code: error.statusCode.toString(),
                    error: error.errorCode,
                    description: error.message,
                    correlationId: error.correlationId,
                    utcTime: new Date(error.time).toISOString()
                }
            }
        }
    }
    result.body = isEmpty(result.body)? '' : JSON.stringify(result.body);
    return result;
}

function isEmpty(result) {
    return result === null || result === undefined;
}