import {BaseClaims} from './baseClaims';
import {CustomClaims} from './customClaims';
import {UserInfoClaims} from './userInfoClaims';

/*
 * A class to deal with domain specific claims, needed for business authorization
 */
export class CustomClaimsProvider {

    /*
     * This can be overridden by derived classes
     */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async get(accessToken: string, token: BaseClaims, userInfo: UserInfoClaims): Promise<CustomClaims> {
        return new CustomClaims();
    }

    /*
     * This can be overridden by derived classes
     */
    public deserialize(data: any): CustomClaims {
        return CustomClaims.importData(data);
    }
}
