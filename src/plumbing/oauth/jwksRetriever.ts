
import axios, {AxiosRequestConfig} from 'axios';
import {inject, injectable} from 'inversify';
import {FlattenedJWSInput, importJWK, JWK, JoseHeaderParameters, KeyLike} from 'jose';
import {Cache} from '../cache/cache.js';
import {OAuthConfiguration} from '../configuration/oauthConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {ErrorFactory} from '../errors/errorFactory.js';
import {ServerError} from '../errors/serverError.js';
import {ErrorUtils} from '../errors/errorUtils.js';
import {HttpProxy} from '../utilities/httpProxy.js';

/*
 * This class deals with downloading and caching JWKS keys for lambda environments
 */
@injectable()
export class JwksRetriever {

    private readonly _configuration: OAuthConfiguration;
    private readonly _cache: Cache;
    private readonly _httpProxy: HttpProxy;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration,
        @inject(BASETYPES.Cache) cache: Cache,
        @inject(BASETYPES.HttpProxy) httpProxy: HttpProxy) {

        this._configuration = configuration;
        this._cache = cache;
        this._httpProxy = httpProxy;
        this._setupCallbacks();
    }

    /*
     * Do our own DynamoDB based caching of JWKS keys since the JOSE library cannot cache them for lambdas
     */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async getKey(
        protectedHeader: JoseHeaderParameters,
        token: FlattenedJWSInput): Promise<Uint8Array | KeyLike> {

        try {

            // See if the JSON Web Key for this key id is cached outside this lambda
            const key = await this._getCachedKey(protectedHeader.kid);
            if (key) {
                return importJWK(key);
            }

            // If not then download all JSON web keys
            const keysText = await this._downloadKeys();
            const data = JSON.parse(keysText);
            const keys = data.keys as JWK[];

            // Then replace keys in the cache and return the result
            const foundKey = keys.find((k: JoseHeaderParameters) => k.kid === protectedHeader.kid);
            if (foundKey) {

                // Then replace JWKS keys in the cache, which will only occur rarely
                this._cache.setJwksKeys(keysText);

                // Then parse the JWK into a crypto object
                return importJWK(foundKey);
            }

            throw ErrorFactory.createClient401Error('A JWT kid field was received that does not exist in JWS keys');

        } catch (e) {

            if (e instanceof ServerError) {
                throw e;
            }

            // Errors are reported as a 500 service error rather than 401s, to reduce work for clients
            throw ErrorUtils.fromJwksProcessingError(e);
        }
    }

    /*
     * The jose library caches downloaded JWKS keys, but a new lambda is spun up on every request
     * Therefore we instead cache keys in DynamoDB cache for the deployed system
     */
    private async _getCachedKey(kid?: string): Promise<JWK | null> {

        const keysText = await this._cache.getJwksKeys();
        if (keysText) {

            const data = JSON.parse(keysText);
            const keys = data.keys as JWK[];
            const foundKey = keys.find((k: any) => k.kid === kid);
            if (foundKey) {
                return foundKey;
            }
        }

        return null;
    }

    /*
     * Get the keys as raw text and work around this issue: https://github.com/axios/axios/issues/907
     */
    private async _downloadKeys(): Promise<string> {

        try {

            const options = {
                url: this._configuration.jwksEndpoint,
                method: 'GET',
                responseType: 'arraybuffer',
                headers: {
                    'accept': 'application/json',
                },
                httpAgent: this._httpProxy.agent,
            };

            const response = await axios.request(options as AxiosRequestConfig);
            return Buffer.from(response.data as any, 'binary').toString();

        } catch (e) {

            throw ErrorUtils.fromSigningKeyDownloadError(e, this._configuration.jwksEndpoint);
        }
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.getKey = this.getKey.bind(this);
    }
}
