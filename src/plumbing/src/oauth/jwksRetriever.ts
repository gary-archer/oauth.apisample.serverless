
import {createRemoteJWKSet} from 'jose/jwks/remote';
import {GetKeyFunction, KeyLike} from 'jose/types';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {ErrorUtils} from '../errors/errorUtils';
import {HttpProxy} from '../utilities/httpProxy';

/*
 * A wrapper to manage downloading the token signing public key
 */
export class JwksRetriever {

    private readonly _configuration: OAuthConfiguration;
    private readonly _remoteJwkSet: GetKeyFunction<any, any>;

    public constructor(configuration: OAuthConfiguration, httpProxy: HttpProxy) {

        this._configuration = configuration;
        const jwksOptions = {
            agent: httpProxy.agent,
        };

        this._remoteJwkSet = createRemoteJWKSet(new URL(configuration.jwksEndpoint), jwksOptions);
        this._setupCallbacks();
    }

    /*
     * Ensures that JWKS errors are handled separate to invalid token errors
     */
    public async getKey(protectedHeader: any, token: any): Promise<KeyLike> {

        try {

            // Try the request, which could fail if there is a connectivity problem
            return await this._remoteJwkSet(protectedHeader, token);

        } catch (e) {

            // Errors are reported as a 500 service error rather than 401s, to reduce work for clients
            throw ErrorUtils.fromSigningKeyDownloadError(e, this._configuration.jwksEndpoint);
        }
    }

    /*
     * Set up async callbacks
     */
    private _setupCallbacks(): void {
        this.getKey = this.getKey.bind(this);
    }
}
