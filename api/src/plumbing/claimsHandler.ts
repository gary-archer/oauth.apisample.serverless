import {Context} from 'aws-lambda';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {AuthorizationMicroservice} from '../logic/authorizationMicroservice';
import {ApiLogger} from './apiLogger';
import {Authenticator} from './authenticator';
import {ClaimsCache} from './claimsCache';
import {ResponseHandler} from './responseHandler';

/*
 * The middleware coded in a class based manner
 */
export class ClaimsHandler {

    /*
     * Dependencies
     */
    private _oauthConfig: OAuthConfiguration;
    private _authorizationMicroservice: AuthorizationMicroservice;

    /*
     * Receive configuration
     */
    public constructor(oauthConfig: OAuthConfiguration, authorizationMicroservice: AuthorizationMicroservice) {
        this._oauthConfig = oauthConfig;
        this._authorizationMicroservice = authorizationMicroservice;
        this._setupCallbacks();
    }

    /*
     * Do the authorization and set claims, or return an unauthorized response
     */
    public async authorizeRequestAndSetClaims(event: any, context: Context) {

        // First read the token from the request header and report missing tokens
        const accessToken = this._readToken(event.authorizationToken);
        if (!accessToken) {
            ApiLogger.info('ClaimsHandler', 'No access token received');
            return ResponseHandler.missingTokenResponse(event);
        }

        // Bypass validation and use cached results if they exists
        const cachedClaims = ClaimsCache.getClaimsForToken(accessToken);
        if (cachedClaims !== null) {
            return ResponseHandler.authorizedResponse(cachedClaims, event);
        }

        // Otherwise start by introspecting the token
        const authenticator = new Authenticator(this._oauthConfig);
        const result = await authenticator.validateTokenAndGetTokenClaims(accessToken);

        // Handle invalid or expired tokens
        if (!result.isValid) {
            ApiLogger.info('ClaimsHandler', 'Invalid or expired access token received');
            return ResponseHandler.invalidTokenResponse(event);
        }

        // Next add central user info to claims
        await authenticator.getCentralUserInfoClaims(result.claims!, accessToken);

        // Next add product user data to claims
        await this._authorizationMicroservice.getProductClaims(result.claims!, accessToken);

        // Next cache the results
        ClaimsCache.addClaimsForToken(accessToken, result.expiry!, result.claims!);

        // Then move onto the API controller to execute business logic
        ApiLogger.info('ClaimsHandler', 'Claims lookup completed successfully');
        return ResponseHandler.authorizedResponse(result.claims!, event);
    }

    /*
     * Try to read the token from the authorization header
     */
    private _readToken(authorizationHeader: string | undefined): string | null {

        if (authorizationHeader) {
            const parts = authorizationHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                return parts[1];
            }
        }

        return null;
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.authorizeRequestAndSetClaims = this.authorizeRequestAndSetClaims.bind(this);
    }
}
