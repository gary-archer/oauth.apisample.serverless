import {injectable} from 'inversify';
import {JWTPayload} from 'jose';
import {ExtraClaims} from './extraClaims.js';

/*
 * The total set of claims for this API
 */
@injectable()
export class ClaimsPrincipal {

    private readonly jwtClaims: JWTPayload;
    private readonly extraClaims: ExtraClaims;

    public constructor(jwtClaims: JWTPayload, extraClaims: ExtraClaims) {
        this.jwtClaims = jwtClaims;
        this.extraClaims = extraClaims;
    }

    public get jwt(): JWTPayload {
        return this.jwtClaims;
    }

    public get extra(): ExtraClaims {
        return this.extraClaims;
    }
}
