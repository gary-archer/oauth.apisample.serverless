import {CustomClaims} from './customClaims.js';
import {UserInfoClaims} from './userInfoClaims.js';

/*
 * Claims that are cached between requests to the lambda
 */
export class CachedClaims {

    private _userInfoClaims: UserInfoClaims;
    private _customClaims: CustomClaims;

    public constructor(userInfoClaims: UserInfoClaims, customClaims: CustomClaims) {
        this._userInfoClaims = userInfoClaims;
        this._customClaims = customClaims;
    }

    public get userInfo(): UserInfoClaims {
        return this._userInfoClaims;
    }

    public get custom(): CustomClaims {
        return this._customClaims;
    }
}
