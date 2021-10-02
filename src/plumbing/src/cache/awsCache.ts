import AWS from 'aws-sdk';
import {ApiClaims} from '../claims/apiClaims';
import {Cache} from './cache';
import {ClaimsProvider} from '../claims/claimsProvider';
import {CacheConfiguration} from '../configuration/cacheConfiguration';

/*
 * An implementation that caches data in AWS, used when the API is deployed
 */
export class AwsCache implements Cache {

    private readonly _cacheConfiguration: CacheConfiguration;
    private readonly _database: AWS.DynamoDB;

    public constructor(cacheConfiguration: CacheConfiguration, claimsProvider: ClaimsProvider) {

        this._cacheConfiguration = cacheConfiguration;
        AWS.config.update({region: cacheConfiguration.region});
        this._database = new AWS.DynamoDB({apiVersion: '2012-08-10'});
    }

    /*
     * We validate a JWT on every lambda call but avoid calling the Cognito AWS endpoint every time
     * This is done by updating the cache entry with the JWKS keys whenever the JOSE library triggers a download
     */
    public async addJwksKeys(keys: any): Promise<void> {
    }

    /*
     * On the vast majority of requests our JWKS retriever gets keys from the database
     */
    public async getJwksKeys(): Promise<any> {
        return null;
    }

    /*
     * When a new access token is received, we cache its keys with a time to live equal to that of the token's expiry
     */
    public async addClaimsForToken(accessTokenHash: string, claims: ApiClaims): Promise<void> {

        const params = {
            TableName: this._cacheConfiguration.tableName,
            Item: {
                'CACHE_KEY' : {S: accessTokenHash},
                'CACHE_VALUE' : {S: 'Richard Roe one more time'}
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
        if (data) {
            const claims = data.Item['CACHE_VALUE'].S;

            /*
            {
                Item: {
                    'cache-value': { S: 'Richard Roe updated innit' },
                    'cache-key': {
                    S: '6ca0b2603bd362f34f82c51ae3b47a23f499f1a4c410c532a47eca9f43e560ae'
                    }
                }
            }
            */

        } else {
            console.log('*** NO CLAIMS FOUND IN CACHE');
        }

        return null;
    }

    /*
     * Wrap the put item call in a promise and handle errors
     */
    private async _putItem(params: AWS.DynamoDB.PutItemInput): Promise<void> {

        return new Promise((resolve, reject) => {

            this._database.putItem(params, function(err, data) {

                if (err) {
                    reject(new Error('Unable to update cache'));
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

            this._database.getItem(params, function(err, data) {

                if (err) {
                    console.log(err);
                    reject(new Error('Unable to get from cache'));
                }

                resolve(data);
            });
        });
    }
}
