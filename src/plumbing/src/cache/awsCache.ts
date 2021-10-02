import AWS from 'aws-sdk';
import {CachedClaims} from '../claims/cachedClaims';
import {CustomClaimsProvider} from '../claims/customClaimsProvider';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {CacheConfiguration} from '../configuration/cacheConfiguration';
import {BaseErrorCodes} from '../errors/baseErrorCodes';
import {ErrorUtils} from '../errors/errorUtils';
import {Cache} from './cache';

/*
 * An implementation that caches data in AWS, used when the API is deployed
 */
export class AwsCache implements Cache {

    private readonly _configuration: CacheConfiguration;
    private readonly _customClaimsProvider: CustomClaimsProvider;
    private readonly _database: AWS.DynamoDB;

    public constructor(configuration: CacheConfiguration, customClaimsProvider: CustomClaimsProvider) {

        try {

            this._configuration = configuration;
            this._customClaimsProvider = customClaimsProvider;
            AWS.config.update({region: configuration.region});
            this._database = new AWS.DynamoDB({apiVersion: '2012-08-10'});

        } catch (e) {

            throw ErrorUtils.fromCacheError(BaseErrorCodes.cacheConnect, e);
        }
    }

    /*
     * We validate a JWT on every lambda call but avoid calling the Cognito AWS endpoint every time
     * This is done by updating the cache entry with the JWKS keys whenever the JOSE library triggers a download
     */
    public async setJwksKeys(jwksText: string): Promise<void> {

        const params = {
            TableName: this._configuration.tableName,
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
            TableName: this._configuration.tableName,
            Key: {
                'CACHE_KEY': {S: 'JWKS'},
            },
            ProjectionExpression: 'CACHE_VALUE'
        };

        const data = await this._getItem(params);
        if (data && data.Item) {
            return data.Item['CACHE_VALUE'].S;
        }

        return null;
    }

    /*
     * When a new access token is received, we cache its keys with a time to live equal to that of the token's expiry
     */
    public async setExtraUserClaims(accessTokenHash: string, claims: CachedClaims): Promise<void> {

        // Get the data in way that handles private property names
        const dataAsJson = {
            userInfo: claims.userInfo.exportData(),
            custom: claims.custom.exportData(),
        };

        // Form the DynamoDB command
        const params = {
            TableName: this._configuration.tableName,
            Item: {
                'CACHE_KEY' : {S: accessTokenHash},
                'CACHE_VALUE' : {S: JSON.stringify(dataAsJson)},
                'TTL_VALUE': {N: `${this._getExpiry()}`},
            }
        };

        // Write the data
        await this._putItem(params);
    }

    /*
     * When an access token is received, see if its claims exist in the cache
     */
    public async getExtraUserClaims(accessTokenHash: string): Promise<CachedClaims | null> {

        // Form the DynamoDB command
        const params = {
            TableName: this._configuration.tableName,
            Key: {
                'CACHE_KEY': {S: accessTokenHash},
            },
            ProjectionExpression: 'CACHE_VALUE'
        };

        // Read the data
        const data = await this._getItem(params);
        if (data && data.Item) {

            const claimsText = data.Item['CACHE_VALUE'].S;
            const dataAsJson = JSON.parse(claimsText);

            // Get the data in way that handles private property names
            return new CachedClaims(
                UserInfoClaims.importData(dataAsJson.userInfo),
                this._customClaimsProvider.deserialize(dataAsJson.custom));
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
        return currentUtcTimeInEpochSeconds + this._configuration.claimsCacheTimeToLiveMinutes * 60;
    }
}
