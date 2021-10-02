import AWS from 'aws-sdk';
import {ApiClaims} from '../claims/apiClaims';
import {Cache} from './cache';
import {ClaimsProvider} from '../claims/claimsProvider';
import {CacheConfiguration} from '../configuration/cacheConfiguration';
import {BaseErrorCodes} from '../errors/baseErrorCodes';
import {ErrorUtils} from '../errors/errorUtils';

/*
 * An implementation that caches data in AWS, used when the API is deployed
 */
export class AwsCache implements Cache {

    private readonly _cacheConfiguration: CacheConfiguration;
    private readonly _claimsProvider: ClaimsProvider;
    private readonly _database: AWS.DynamoDB;

    public constructor(claimsProvider: ClaimsProvider, cacheConfiguration: CacheConfiguration) {

        try {

            this._claimsProvider = claimsProvider;
            this._cacheConfiguration = cacheConfiguration;
            AWS.config.update({region: cacheConfiguration.region});
            this._database = new AWS.DynamoDB({apiVersion: '2012-08-10'});

        } catch (e) {

            throw ErrorUtils.fromCacheError(BaseErrorCodes.cacheConnect, e);
        }
    }

    /*
     * We validate a JWT on every lambda call but avoid calling the Cognito AWS endpoint every time
     * This is done by updating the cache entry with the JWKS keys whenever the JOSE library triggers a download
     */
    public async addJwksKeys(jwksText: string): Promise<void> {

        const params = {
            TableName: this._cacheConfiguration.tableName,
            Item: {
                'CACHE_KEY' : {S: 'JWKS'},
                'CACHE_VALUE' : {S: jwksText},
                'TTL_VALUE': {N: `${this._getExpiry()}`},
            }
        };

        await this._putItem(params);
    }

    /*
     * On the vast majority of requests our JWKS retriever gets keys from the database
     */
    public async getJwksKeys(): Promise<any> {

        const params = {
            TableName: this._cacheConfiguration.tableName,
            Key: {
                'CACHE_KEY': {S: 'JWKS'},
            },
            ProjectionExpression: 'CACHE_VALUE'
        };

        const data = await this._getItem(params);
        if (data && data.Item) {
            const jwksText = data.Item['CACHE_VALUE'].S;
            return jwksText;
        }

        return null;
    }

    /*
     * When a new access token is received, we cache its keys with a time to live equal to that of the token's expiry
     */
    public async addClaimsForToken(accessTokenHash: string, claims: ApiClaims): Promise<void> {

        const claimsText = this._claimsProvider.serializeToCache(claims);
        const params = {
            TableName: this._cacheConfiguration.tableName,
            Item: {
                'CACHE_KEY' : {S: accessTokenHash},
                'CACHE_VALUE' : {S: claimsText},
                'TTL_VALUE': {N: `${this._getExpiry()}`},
            }
        };

        await this._putItem(params);
    }

    /*
     * When an access token is received, see if its claims exist in the cache
     */
    public async getClaimsForToken(accessTokenHash: string): Promise<ApiClaims | null> {

        const params = {
            TableName: this._cacheConfiguration.tableName,
            Key: {
                'CACHE_KEY': {S: accessTokenHash},
            },
            ProjectionExpression: 'CACHE_VALUE'
        };

        const data = await this._getItem(params);
        if (data && data.Item) {

            const claimsText = data.Item['CACHE_VALUE'].S;
            return this._claimsProvider.deserializeFromCache(claimsText);
        }

        return null;
    }

    /*
     * Wrap the put item call in a promise and handle errors
     */
    private async _putItem(params: AWS.DynamoDB.PutItemInput): Promise<void> {

        return new Promise((resolve, reject) => {

            this._database.putItem(params, (error) => {

                if (error) {
                    reject(ErrorUtils.fromCacheError(BaseErrorCodes.cacheWrite, error));
                }

                resolve();
            });
        });
    }

    /*
     * Wrap the get item call in a promise and handle errors
     */
    private async _getItem(params: AWS.DynamoDB.GetItemInput): Promise<any> {

        return new Promise((resolve, reject) => {

            this._database.getItem(params, (error, data) => {

                if (error) {
                    reject(ErrorUtils.fromCacheError(BaseErrorCodes.cacheRead, error));
                }

                resolve(data);
            });
        });
    }

    /*
     * Extra claims are cached for 30 minutes after the current UTC time
     */
    private _getExpiry(): number {

        const currentUtcTimeInEpochSeconds = Math.floor(new Date().getTime() / 1000);
        return currentUtcTimeInEpochSeconds + this._cacheConfiguration.claimsCacheTimeToLiveMinutes * 60;
    }
}
