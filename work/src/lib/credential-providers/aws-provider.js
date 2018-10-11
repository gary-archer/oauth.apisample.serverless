'use strict';

const AWS = require('aws-sdk');
const Logger = require('../logging');
const { ServerError } = require('../exceptions/errors');

const defaultRegion = process.env.AWS_DEFAULT_REGION || 'eu-west-1';

class AWSCredentialsProvider {
    constructor(region = defaultRegion) {
        this._client = new AWS.SecretsManager({
            endpoint: `https://secretsmanager.${region}.amazonaws.com`,
            region: region
        });
    }

    async getCredentials(credentialsName) {
        let data;
        try {
           data = await this._client.getSecretValue({SecretId: credentialsName}).promise();
        } catch(error) {
            
            // If we cannot get credentials then something unexpected has happened
            throw new ServerError({
                statusCode: 500,
                errorCode: 'internal_server_error',
                message: 'A technical problem was encountered in a Collinson API',
                details: {
                    summary: 'Unable to download AWS secret',
                    code: error.code,
                    message: error.message
                }
            });
        }

        if(data && data.SecretString !== '') {
            return JSON.parse(data.SecretString);
        }

        throw Error('Binary value is currently not supported');
    }
}

module.exports = AWSCredentialsProvider;