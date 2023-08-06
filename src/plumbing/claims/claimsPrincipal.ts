import {JWTPayload} from 'jose';
import {CustomClaims} from './customClaims.js';
import {ClaimsReader} from './claimsReader.js';

/*
 * The total set of claims for this API
 */
export class ClaimsPrincipal {

    private _jwtClaims: JWTPayload;
    private _customClaims: CustomClaims;

    public constructor(jwtClaims: JWTPayload, customClaims: CustomClaims) {
        this._jwtClaims = jwtClaims;
        this._customClaims = customClaims;
    }

    public get subject(): string {
        return ClaimsReader.getStringClaim(this._jwtClaims, 'sub');
    }

    public get custom(): CustomClaims {
        return this._customClaims;
    }
}
