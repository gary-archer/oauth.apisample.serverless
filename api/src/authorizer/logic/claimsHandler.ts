import {Context} from 'aws-lambda';
import {ApiLogger} from '../../shared/plumbing/apiLogger';
import {ErrorHandler} from '../../shared/plumbing/errorHandler';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {AuthorizationMicroservice} from '../logic/authorizationMicroservice';
import {ResponseHandler} from '../plumbing/responseHandler';
import {Authenticator} from './authenticator';

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

        try {
            // First read the token from the request header and report missing tokens
            const accessToken = this._readToken(event.authorizationToken);
            if (!accessToken) {
                ApiLogger.info('ClaimsHandler', 'No access token received');
                return ResponseHandler.invalidTokenResponse(event);
            }

            // Start by introspecting the token
            const authenticator = new Authenticator(this._oauthConfig);
            const result = await authenticator.validateTokenAndGetTokenClaims(accessToken);

            // Handle invalid or expired tokens
            if (!result.isValid) {
                ApiLogger.info('ClaimsHandler', 'Invalid or expired access token received');
                return ResponseHandler.invalidTokenResponse(event);
            }

            // Next add central user info to claims
            ApiLogger.info('ClaimsHandler', 'OAuth token validation succeeded');
            await authenticator.getCentralUserInfoClaims(result.claims!, accessToken);

            // Next add product user data to claims
            await this._authorizationMicroservice.getProductClaims(result.claims!, accessToken);

            // Then move onto the API controller to execute business logic
            ApiLogger.info('ClaimsHandler', 'Claims lookup completed successfully');
            return ResponseHandler.authorizedResponse(result.claims!, event);

        } catch (e) {

            // Log errors, then return an error response
            const serverError = ErrorHandler.fromException(e);
            const [statusCode, clientError] = ErrorHandler.handleError(serverError);
            return ResponseHandler.authorizationErrorResponse(500, clientError);
        }
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
