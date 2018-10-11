'use strict';

const Logger = require('../logging');

class LOCALCredentialsProvider {
    constructor() {

    }

    async getCredentials() {
        return {
            ClientId: 'apiGateway',
            ClientSecret: 'apiGatewaySecret',
            Username: 'ApiGatewayUsername',
            Password: 'ApiGatewayPassword',
        }
    }
}

module.exports = LOCALCredentialsProvider;