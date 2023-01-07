import {CachedClaims} from '../claims/cachedClaims.js';
import {Cache} from './cache.js';

/*
 * A null implementation when running sls invoke on a development computer
 */
export class NullCache implements Cache {

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async setJwksKeys(keys: any): Promise<void> {
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async getJwksKeys(): Promise<any> {
        return null;
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async setExtraUserClaims(accessTokenHash: string, claims: CachedClaims): Promise<void> {
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async getExtraUserClaims(accessTokenHash: string): Promise<CachedClaims | null> {
        return null;
    }
}
