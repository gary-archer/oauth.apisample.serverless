import {ApiClaims} from '../claims/apiClaims';
import {Cache} from './cache';

/*
 * A null implementation when running sls invoke on a development computer
 */
export class DevelopmentCache implements Cache {

    public async addJwksKeys(keys: any): Promise<void> {
    }

    public async getJwksKeys(): Promise<any> {
        return null;
    }

    public async addClaimsForToken(accessTokenHash: string, claims: ApiClaims): Promise<void> {
    }

    public async getClaimsForToken(accessTokenHash: string): Promise<ApiClaims | null> {
        return null;
    }
}
