import {CoreApiClaims} from '../../../plumbing-base';

/*
 * Concrete APIs can override this class to include custom claims to the AWS cache
 */
export class CustomClaimsProvider<TClaims extends CoreApiClaims> {

    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async addCustomClaims(accessToken: string, claims: TClaims): Promise<void> {
    }
}
