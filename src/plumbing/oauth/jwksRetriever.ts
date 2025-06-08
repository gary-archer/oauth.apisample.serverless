import axios from 'axios';
import {inject, injectable} from 'inversify';
import {createRemoteJWKSet, customFetch, JWTVerifyGetKey, RemoteJWKSetOptions} from 'jose';
import {OAuthConfiguration} from '../configuration/oauthConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {HttpProxy} from '../utilities/httpProxy.js';

/*
 * A singleton that caches the result of createRemoteJWKSet, to ensure efficient lookup
 */
@injectable()
export class JwksRetriever {

    private readonly remoteJWKSet: JWTVerifyGetKey;
    private readonly httpProxy: HttpProxy;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration,
        @inject(BASETYPES.HttpProxy) httpProxy: HttpProxy) {

        this.httpProxy = httpProxy;
        this.setupCallbacks();

        // View requests via an HTTP proxy if required
        const jwksOptions = {
            [customFetch]: this.fetchJwks,
        } as RemoteJWKSetOptions;

        // Integration tests use a value of zero to ensure multiple test runs without unfound JWK errors
        if (configuration.jwksCooldownDuration !== undefined) {
            jwksOptions.cooldownDuration = configuration.jwksCooldownDuration;
        }

        // Create this object only once
        this.remoteJWKSet = createRemoteJWKSet(new URL(configuration.jwksEndpoint), jwksOptions);
    }

    /*
     * Return the global object
     */
    public getRemoteJWKSet(): JWTVerifyGetKey {
        return this.remoteJWKSet;
    }

    /*
     * To support the use of an HTTP proxy I use axios to download the JWKS
     */
    private async fetchJwks(url: string): Promise<any> {

        const options = {
            url,
            method: 'GET',
            headers: {
                'accept': 'application/json',
            },
            httpsAgent: this.httpProxy.getAgent(),
        };

        const response = await axios.request(options);
        return {
            status: response.status,
            json: async () => response.data,
        };
    }

    /*
     * Set up async callbacks
     */
    private setupCallbacks(): void {
        this.fetchJwks = this.fetchJwks.bind(this);
    }
}
