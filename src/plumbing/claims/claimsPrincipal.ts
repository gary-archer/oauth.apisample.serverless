import {injectable} from 'inversify';
import {JWTPayload} from 'jose';
import {ExtraClaims} from './extraClaims.js';

/*
 * The total set of claims for this API
 */
@injectable()
export class ClaimsPrincipal {

    private _jwtClaims: JWTPayload;
    private _extraClaims: ExtraClaims;

    public constructor(jwtClaims: JWTPayload, extraClaims: ExtraClaims) {
        this._jwtClaims = jwtClaims;
        this._extraClaims = extraClaims;
    }

    public get jwt(): JWTPayload {
        return this._jwtClaims;
    }

    public get extra(): ExtraClaims {
        return this._extraClaims;
    }
}
