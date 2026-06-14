import {inject, injectable} from 'inversify';
import {createRemoteJWKSet, JWTVerifyGetKey, RemoteJWKSetOptions} from 'jose';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';

/*
 * A singleton that caches the result of createRemoteJWKSet, to ensure efficient lookup
 */
@injectable()
export class JwksRetriever {

    private readonly remoteJWKSet: JWTVerifyGetKey;

    public constructor(@inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration) {

        // Integration tests use a value of zero to ensure multiple test runs without unfound kid errors
        const jwksOptions: RemoteJWKSetOptions = {};
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
}
