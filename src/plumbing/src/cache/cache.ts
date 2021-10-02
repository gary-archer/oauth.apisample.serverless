import {ApiClaims} from '../claims/apiClaims';

/*
 * An interface for in-memory caching of OAuth related data
 */
export interface Cache {

    addJwksKeys(keys: any): Promise<void>;

    getJwksKeys(): Promise<any>;

    addClaimsForToken(accessTokenHash: string, claims: ApiClaims): Promise<void>;

    getClaimsForToken(accessTokenHash: string): Promise<ApiClaims | null>;
}
