import {Context} from 'aws-lambda';
import {inject, injectable} from 'inversify';
import {CoreApiClaims, DefaultClientError, ResponseHandler} from '../../../framework-api-base';
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

        try {

            // First read the token from the request header and report missing tokens
            const accessToken = this._readAccessToken(event.authorizationToken);
            if (!accessToken) {
                throw DefaultClientError.create401('No access token was supplied in the bearer header');
            }

            // Create new claims which we will then populate
            const claims = this._claimsSupplier.createEmptyClaims();

            // Make OAuth calls to validate the token and get user info
            await this._authenticator.authenticateAndSetClaims(accessToken, claims);

            // Add any custom product specific custom claims if required
            await this._claimsSupplier.createCustomClaimsProvider().addCustomClaims(accessToken, claims);

            // Return the success result
            return ResponseHandler.authorizedResponse(claims, event);

        } catch (e) {

            // Write a 401 policy document
            if (e instanceof DefaultClientError) {
                return ResponseHandler.invalidTokenResponse(event);
            }

            // Rethrow otherwise
            throw e;
        }
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
