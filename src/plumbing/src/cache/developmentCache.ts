import {ApiClaims} from '../claims/apiClaims';
import {Cache} from './cache';

/*
 * A null implementation when running sls invoke on a development computer
 */
export class DevelopmentCache implements Cache {

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async addJwksKeys(keys: any): Promise<void> {
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async getJwksKeys(): Promise<any> {
        return null;
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async addClaimsForToken(accessTokenHash: string, claims: ApiClaims): Promise<void> {
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async getClaimsForToken(accessTokenHash: string): Promise<ApiClaims | null> {
        return null;
    }
}
