
import axios, {AxiosRequestConfig} from 'axios';
import {inject, injectable} from 'inversify';
import {CryptoKey, importJWK, JWK, JoseHeaderParameters} from 'jose';
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

    private readonly configuration: OAuthConfiguration;
    private readonly cache: Cache;
    private readonly httpProxy: HttpProxy;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration,
        @inject(BASETYPES.Cache) cache: Cache,
        @inject(BASETYPES.HttpProxy) httpProxy: HttpProxy) {

        this.configuration = configuration;
        this.cache = cache;
        this.httpProxy = httpProxy;
        this.setupCallbacks();
    }

    /*
     * Do our own DynamoDB based caching of JWKS keys since the JOSE library cannot cache them for lambdas
     */
    public async getKey(protectedHeader: JoseHeaderParameters): Promise<CryptoKey | Uint8Array> {

        try {

            // See if the JSON Web Key for this key id is cached outside this lambda
            const key = await this.getCachedKey(protectedHeader.kid);
            if (key) {
                return importJWK(key);
            }

            // If not then download all JSON web keys
            const keysText = await this.downloadKeys();
            const data = JSON.parse(keysText);
            const keys = data.keys as JWK[];

            // Then replace keys in the cache and return the result
            const foundKey = keys.find((k: JoseHeaderParameters) => k.kid === protectedHeader.kid);
            if (foundKey) {

                // Then replace JWKS keys in the cache, which will only occur rarely
                this.cache.setJwksKeys(keysText);

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
    private async getCachedKey(kid?: string): Promise<JWK | null> {

        const keysText = await this.cache.getJwksKeys();
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
    private async downloadKeys(): Promise<string> {

        try {

            const options = {
                url: this.configuration.jwksEndpoint,
                method: 'GET',
                responseType: 'arraybuffer',
                headers: {
                    'accept': 'application/json',
                },
                httpAgent: this.httpProxy.getAgent(),
            };

            const response = await axios.request(options as AxiosRequestConfig);
            return Buffer.from(response.data as any, 'binary').toString();

        } catch (e) {

            throw ErrorUtils.fromSigningKeyDownloadError(e, this.configuration.jwksEndpoint);
        }
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private setupCallbacks(): void {
        this.getKey = this.getKey.bind(this);
    }
}
