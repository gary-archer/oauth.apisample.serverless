import {CustomClaims} from '../claims/customClaims.js';

/*
 * An interface for in-memory caching of OAuth related data
 */
export interface Cache {

    setJwksKeys(keys: any): Promise<void>;

    getJwksKeys(): Promise<any>;

    setExtraUserClaims(accessTokenHash: string, claims: CustomClaims): Promise<void>;

    getExtraUserClaims(accessTokenHash: string): Promise<CustomClaims | null>;
}
