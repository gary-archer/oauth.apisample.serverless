import {injectable} from 'inversify';
import NodeCache from 'node-cache';
import {ExtraClaimsProvider} from './extraClaimsProvider.js';

/*
 * A simple in memory claims cache for our API
 */
@injectable()
export class ClaimsCache {

    private readonly cache: NodeCache;
    private readonly extraClaimsProvider: ExtraClaimsProvider;
    private readonly defaultTimeToLiveSeconds: number;

    /*
     * Create the cache at application startup
     */
    public constructor(extraClaimsProvider: ExtraClaimsProvider, timeToLiveMinutes: number) {

        this.extraClaimsProvider = extraClaimsProvider;

        // Create the cache and set a maximum time to live in seconds
        this.defaultTimeToLiveSeconds = timeToLiveMinutes * 60;
        this.cache = new NodeCache({
            stdTTL: this.defaultTimeToLiveSeconds,
        });
    }

    /*
     * Add serialized claims to the cache until the token's time to live
     */
    public setExtraUserClaims(accessTokenHash: string, claims: any, exp: number): void {

        // Use the exp field to work out the token expiry time
        const epochSeconds = Math.floor((new Date().getTime()) / 1000);
        let secondsToCache = exp - epochSeconds;
        if (secondsToCache > 0) {

            // Do not exceed the maximum time we configured
            if (secondsToCache > this.defaultTimeToLiveSeconds) {
                secondsToCache = this.defaultTimeToLiveSeconds;
            }

            // Cache the claims until the above time
            this.cache.set(accessTokenHash, JSON.stringify(claims), secondsToCache);
        }
    }

    /*
     * Get serialized claims from the cache or return null if not found
     */
    public getExtraUserClaims(accessTokenHash: string): any {

        // Get the token hash and see if it exists in the cache
        const claimsJson = this.cache.get<string>(accessTokenHash);
        if (!claimsJson) {

            // If this is a new token and we need to do claims processing
            return null;
        }

        // Otherwise return cached claims
        return this.extraClaimsProvider.deserializeFromCache(claimsJson);
    }
}
