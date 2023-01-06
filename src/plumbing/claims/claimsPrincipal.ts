import {BaseClaims} from './baseClaims.js';
import {CustomClaims} from './customClaims.js';
import {UserInfoClaims} from './userInfoClaims.js';

/*
 * An extensible claims object for APIs
 */
export class ClaimsPrincipal {

    private _baseClaims: BaseClaims;
    private _userInfoClaims: UserInfoClaims;
    private _customClaims: CustomClaims;

    public constructor(baseClaims: BaseClaims, userInfoClaims: UserInfoClaims, customClaims: CustomClaims) {
        this._baseClaims = baseClaims;
        this._userInfoClaims = userInfoClaims;
        this._customClaims = customClaims;
    }

    public get token(): BaseClaims {
        return this._baseClaims;
    }

    public get userInfo(): UserInfoClaims {
        return this._userInfoClaims;
    }

    public get custom(): CustomClaims {
        return this._customClaims;
    }
}
