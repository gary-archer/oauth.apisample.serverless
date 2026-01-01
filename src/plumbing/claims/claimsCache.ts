import {injectable} from 'inversify';
import NodeCache from 'node-cache';
import {ExtraClaims} from './extraClaims';

/*
 * A singleton memory cache for extra authorization values
 */
@injectable()
export class ClaimsCache {

    private readonly cache: NodeCache;
    private readonly defaultTimeToLiveSeconds: number;

    /*
     * Create the cache at application startup
     */
    public constructor(timeToLiveMinutes: number) {

        this.defaultTimeToLiveSeconds = timeToLiveMinutes * 60;
        this.cache = new NodeCache({
            stdTTL: this.defaultTimeToLiveSeconds,
        });
    }

    /*
     * Add an item to the cache and do not exceed the token's expiry or the configured time to live
     */
    public setItem(accessTokenHash: string, claims: ExtraClaims, exp: number): void {

        const epochSeconds = Math.floor((new Date().getTime()) / 1000);
        let secondsToCache = exp - epochSeconds;
        if (secondsToCache > 0) {

            if (secondsToCache > this.defaultTimeToLiveSeconds) {
                secondsToCache = this.defaultTimeToLiveSeconds;
            }

            this.cache.set(accessTokenHash, claims, secondsToCache);
        }
    }

    /*
     * Get an item from the cache for this token's hash, or return null if not found
     */
    public getItem(accessTokenHash: string): ExtraClaims | null  {

        const claims = this.cache.get<ExtraClaims>(accessTokenHash);
        if (!claims) {

            return null;
        }

        return claims;
    }
}
