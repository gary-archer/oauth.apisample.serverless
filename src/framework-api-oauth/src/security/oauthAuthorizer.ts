import {Context} from 'aws-lambda';
import {inject, injectable} from 'inversify';
import {CoreApiClaims, ResponseHandler} from '../../../framework-api-base';
import {ClaimsSupplier} from '../claims/claimsSupplier';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {OAuthAuthenticator} from '../security/oauthAuthenticator';

/*
 * The entry point for OAuth and claims processing logic
 */
@injectable()
 export class OAuthAuthorizer<TClaims extends CoreApiClaims> {

    private _authenticator: OAuthAuthenticator;
    private _claimsSupplier: ClaimsSupplier<TClaims>;

    public constructor(
        @inject(OAUTHINTERNALTYPES.OAuthAuthenticator) authenticator: OAuthAuthenticator,
        @inject(OAUTHINTERNALTYPES.ClaimsSupplier) claimsSupplier: ClaimsSupplier<TClaims>) {

        this._authenticator = authenticator;
        this._claimsSupplier = claimsSupplier;
    }

    /*
     * Do the authorization and set claims, or return an unauthorized response
     */
    public async execute(event: any, context: Context): Promise<any> {

        // First read the token from the request header and report missing tokens
        const accessToken = this._readAccessToken(event.authorizationToken);
        if (!accessToken) {
            return ResponseHandler.invalidTokenResponse(event);
        }

        // Create new claims which we will then populate
        const claims = this._claimsSupplier.createEmptyClaims();

        // Make OAuth calls to validate the token and get user info
        const result = await this._authenticator.authenticateAndSetClaims(accessToken);

        // Handle invalid or expired tokens
        if (!result.isValid) {
            return ResponseHandler.invalidTokenResponse(event);
        }

        // Add any custom product specific custom claims if required
        await this._claimsSupplier.createCustomClaimsProvider().addCustomClaims(accessToken, claims);

        // Return the success result
        return ResponseHandler.authorizedResponse(result.claims!, event);
    }

    /*
     * Try to read the token from the authorization header
     */
    private _readAccessToken(authorizationHeader: string | undefined): string | null {

        if (authorizationHeader) {
            const parts = authorizationHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                return parts[1];
            }
        }

        return null;
    }
}
