import {JWTPayload} from 'jose';
import {CustomClaims} from './customClaims.js';

/*
 * A null implementation that can be overridden to provide custom claims
 */
export class CustomClaimsProvider {

    /*
     * Look up custom claims when details are not available in the cache, such as for a new access token
     */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async lookupForNewAccessToken(accessToken: string, jwtClaims: JWTPayload): Promise<CustomClaims> {
        return new CustomClaims();
    }

    /*
     * Deserialize custom claims after they have been read from the cache
     */
    public deserializeFromCache(data: any): CustomClaims {
        return CustomClaims.importData(data);
    }
}
