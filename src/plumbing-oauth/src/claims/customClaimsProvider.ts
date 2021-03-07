import {CustomClaims, TokenClaims, UserInfoClaims} from '../../../plumbing-base';

/*
 * Concrete APIs can override this class to include custom claims to the AWS cache
 */
export class CustomClaimsProvider {

    /*
     * Return empty custom claims
     */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async getCustomClaims(token: TokenClaims, userInfo: UserInfoClaims): Promise<CustomClaims> {
        return new CustomClaims();
    }
}
