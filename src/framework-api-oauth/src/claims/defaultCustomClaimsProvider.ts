import {CoreApiClaims} from '../../../framework-api-base';
import {CustomClaimsProvider} from './customClaimsProvider';

/*
 * A default custom claims provider for APIs that only use core claims
 */
export class DefaultCustomClaimsProvider implements CustomClaimsProvider<CoreApiClaims> {

    public async addCustomClaims(accessToken: string, claims: CoreApiClaims): Promise<void> {
    }
}
