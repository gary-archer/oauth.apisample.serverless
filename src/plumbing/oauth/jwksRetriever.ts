import {inject, injectable} from 'inversify';
import {createRemoteJWKSet, customFetch, JWTVerifyGetKey, RemoteJWKSetOptions} from 'jose';
import {fetch, RequestInit} from 'undici';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {HttpProxy} from '../utilities/httpProxy';

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

        // Integration tests use a value of zero to ensure multiple test runs without unfound kid errors
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
     * Use an HTTP proxy to capture the JWKS URI request if required
     */
    private async fetchJwks(url: string): Promise<any> {

        const options: RequestInit = {
            dispatcher: this.httpProxy.getDispatcher() || undefined,
        };

        return await fetch(url, options);
    }

    /*
     * Set up async callbacks
     */
    private setupCallbacks(): void {
        this.fetchJwks = this.fetchJwks.bind(this);
    }
}
