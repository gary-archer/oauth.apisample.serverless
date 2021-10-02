import {CachedClaims} from '../claims/cachedClaims';

/*
 * An interface for in-memory caching of OAuth related data
 */
export interface Cache {

    setJwksKeys(keys: any): Promise<void>;

    getJwksKeys(): Promise<any>;

    setExtraUserClaims(accessTokenHash: string, claims: CachedClaims): Promise<void>;

    getExtraUserClaims(accessTokenHash: string): Promise<CachedClaims | null>;
}
