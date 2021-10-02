import {BaseClaims} from './baseClaims';
import {CustomClaims} from './customClaims';
import {UserInfoClaims} from './userInfoClaims';

/*
 * An extensible claims object for APIs
 */
export class ApiClaims {

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
