import {Context} from 'aws-lambda';
import {inject, injectable} from 'inversify';
import {ResponseHandler} from '../../../framework-api-base';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {AuthorizationMicroservice} from '../security/authorizationMicroservice';
import {OAuthAuthenticator} from '../security/oauthAuthenticator';

/*
 * The entry point for OAuth and claims processing logic
 */
@injectable()
 export class OAuthAuthorizer {

    private _authenticator: OAuthAuthenticator;
    private _authorizationMicroservice: AuthorizationMicroservice;

    public constructor(@inject(OAUTHINTERNALTYPES.OAuthAuthenticator) authenticator: OAuthAuthenticator) {
        this._authenticator = authenticator;
        this._authorizationMicroservice = new AuthorizationMicroservice();
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

        // Make OAuth calls to validate the token and get user info
        const result = await this._authenticator.authenticateAndSetClaims(accessToken);

        // Handle invalid or expired tokens
        if (!result.isValid) {
            return ResponseHandler.invalidTokenResponse(event);
        }

        // Next add product user data to claims
        await this._authorizationMicroservice.getProductClaims(result.claims!, accessToken);

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
