import {ErrorUtils} from '../errors/errorUtils';

/*
 * A simple wrapper for the claims in a decoded JWT or introspection / user info response
 */
export class ClaimsPayload {

    private readonly _claims: any;

    public constructor(claims: any) {
        this._claims = claims;
    }

    /*
     * Sanity checks when receiving claims to avoid failing later with a cryptic error
     */
    public getClaim(name: string): any {

        const value = this._claims[name];
        if (!value) {
            throw ErrorUtils.fromMissingClaim(name);
        }

        return value;
    }
}
