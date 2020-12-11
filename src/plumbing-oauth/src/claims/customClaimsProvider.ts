import {CoreApiClaims} from '../../../plumbing-base';

/*
 * Concrete APIs can override this class to include custom claims to the AWS cache
 */
export class CustomClaimsProvider<TClaims extends CoreApiClaims> {

    public async addCustomClaims(accessToken: string, claims: TClaims): Promise<void> {
    }
}
