import {ExtraClaims} from '../claims/extraClaims.js';

/*
 * An interface for in-memory caching of OAuth related data
 */
export interface Cache {

    setJwksKeys(keys: any): Promise<void>;

    getJwksKeys(): Promise<any>;

    setExtraUserClaims(accessTokenHash: string, claims: ExtraClaims): Promise<void>;

    getExtraUserClaims(accessTokenHash: string): Promise<ExtraClaims | null>;
}
