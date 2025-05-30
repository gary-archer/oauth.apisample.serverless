import {injectable} from 'inversify';
import {JWTPayload} from 'jose';

/*
 * The total set of claims for this API, with claims from the access token and extra claims
 */
@injectable()
export class ClaimsPrincipal {

    private jwtClaims: JWTPayload;
    private extraClaims: any;

    public constructor(jwtClaims: JWTPayload, extraClaims: any) {
        this.jwtClaims = jwtClaims;
        this.extraClaims = extraClaims;
    }

    public getJwt(): JWTPayload {
        return this.jwtClaims;
    }

    public getExtra(): any {
        return this.extraClaims;
    }
}
