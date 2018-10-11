'use strict';

const got = require('got');
const url = require('url');
const Logger = require('../logging');
const lbApiSecret = process.env.LbApiSecret || 'lb-api/travel-experiences-aws-client';

let tunnelAgent
if (process.env.NODE_ENV === 'development') {
    tunnelAgent = require('tunnel-agent');
}

module.exports = class {
    constructor(baseUrl, credentialsProvider) {
        this._baseUrl = baseUrl;
        this._credentialsProvider = credentialsProvider;
        this._token = new Authorization();
    }

    async request(method, endpoint, body, retry, authenticateRequest) {
        let url = `${this._baseUrl}${endpoint}`;
        let accessToken;
        if (authenticateRequest){
            accessToken = await this._getAccessToken();
        }
        let result;
        try {
            let requestParameters = {
                method: method,
                body: body,
                json: true,
                agent: this.getHttpDebugAgent()
            };

            if (authenticateRequest){
                requestParameters.headers = {};
                requestParameters.headers['Authorization'] = `Bearer ${accessToken}`;
            }

            result = await got(url, requestParameters);
        } catch(error) {
            if(error.statusCode === 401 && retry) {
                // If authentication expired or revoked, retry (once) using a new token
                Logger.debug('Unauthenticated - retrying using fresh token');
                if (authenticateRequest){
                    await this._refreshToken();
                }
                return await this.request(method, endpoint, body, false, authenticateRequest);
            }
            Logger.debug('HTTP invocation failed', error);
            throw error;
        }
        return result;
    }

    isClientError(error) {
        // We handle server to server communication, authentication and to some extend the translation of the payloads
        // therefore the only http error that should bubble up to the client is 400 bad request and potentially 404 not found
        // This is however not always the case
        if(this.isHttpError(error) && error.statusCode) {
            return [400, 404].some(x => x == error.statusCode);
        }
        return false;
    }

    isHttpError(error) {
        return error instanceof got.HTTPError;
    }

    async _getAccessToken() {
        if(this._token.expired()) {
            Logger.debug('Token has/is about to expire ... refreshing');
            await this._refreshToken();
        }
        return this._token.getAccessToken();
    }

    async _refreshToken() {
        let credentials = await this._credentialsProvider.getCredentials(lbApiSecret);
        let data = {
            ClientId: credentials.ClientId,
            ClientSecret: credentials.ClientSecret,
            Username: credentials.Username,
            Password: credentials.Password,
            ProductCode: '',
            GrantType: 'password'
        };
        let output;
        try {
            output = await got.post(`${this._baseUrl}/api/v1/admin/token`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: data,
                json: true,
                agent: this.getHttpDebugAgent()
            });
        } catch(error) {
            Logger.debug('Failed to obtain an access token', error);
            throw error;
        }
        if(output) {
            this._token = new Authorization(output.body.access_token, output.body['expires_in']);
        }
    }

    // This function enables us to see Fiddler traffic to LB API on a developer PC to improve our productivity
    // It always returns null when code runs from AWS, whereas on a developer PC these 2 environment variables can be set
    //   SET HTTPS_PROXY=http://127.0.0.1:8888
    //   SET NODE_TLS_REJECT_UNAUTHORIZED=0
    // The feature is very useful to enable us to visualize traffic and think about issues related to data and errors
    getHttpDebugAgent() {
        if (process.env.NODE_ENV === 'development' && process.env.HTTPS_PROXY) {
            const opts = url.parse(process.env.HTTPS_PROXY);
                return tunnelAgent.httpsOverHttp({
                    proxy: opts,
            });
        }

        return null;
    }
}

class Authorization {
    constructor(accessToken, expiresIn = 0) {
        this.accessToken = accessToken;
        this.expiresIn = expiresIn;
        this.expires = new Date();
        this.expires.setSeconds(this.expires.getSeconds() + expiresIn - 60);
    }

    getAccessToken() {
        if(this.expired()) {
            throw new Error('Access token has expired');
        }
        return this.accessToken;
    }

    expired() {
        return Date.now() > this.expires;
    }
}
