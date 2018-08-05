import {NextFunction, Request, Response} from 'express';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {AuthorizationMicroservice} from '../logic/authorizationMicroservice';
import {ApiLogger} from './apiLogger';
import {Authenticator} from './authenticator';
import {ClaimsCache} from './claimsCache';
import {ErrorHandler} from './errorHandler';
import {ResponseWriter} from './responseWriter';

/*
 * An entry point class for claims processing
 */
export class ClaimsMiddleware {

    /*
     * Fields
     */
    private _oauthConfig: OAuthConfiguration;
    private _authorizationMicroservice: AuthorizationMicroservice;

    /*
     * Receive configuration
     */
    public constructor(oauthConfig: OAuthConfiguration, authorizationMicroservice: AuthorizationMicroservice) {
        this._oauthConfig = oauthConfig;
        this._authorizationMicroservice = authorizationMicroservice;
    }

    /*
     * The entry point method to authorize a request
     */
    public async authorizeRequestAndSetClaims(
        request: Request,
        response: Response,
        next: NextFunction): Promise<void> {

        try {
            // First read the token from the request header and report missing tokens
            const accessToken = this._readToken(request.header('authorization'));
            if (accessToken === null) {
                ApiLogger.info('Claims Middleware', 'No access token received');
                ResponseWriter.writeMissingTokenResponse(response);
                return;
            }

            // Bypass validation and use cached results if they exist
            const cachedClaims = ClaimsCache.getClaimsForToken(accessToken);
            if (cachedClaims !== null) {
                response.locals.claims = cachedClaims;
                next();
                return;
            }

            // Otherwise start by introspecting the token
            const authenticator = new Authenticator(this._oauthConfig);
            const result = await authenticator.validateTokenAndGetTokenClaims(accessToken);

            // Handle invalid or expired tokens
            if (!result.isValid) {
                ApiLogger.info('Claims Middleware', 'Invalid or expired access token received');
                ResponseWriter.writeInvalidTokenResponse(response);
                return;
            }

            // Next add central user info to claims
            await authenticator.getCentralUserInfoClaims(result.claims!, accessToken);

            // Next add product user data to claims
            await this._authorizationMicroservice.getProductClaims(result.claims!, accessToken);

            // Next cache the results
            ClaimsCache.addClaimsForToken(accessToken, result.expiry!, result.claims!);

            // Then move onto the API controller to execute business logic
            ApiLogger.info('Claims Middleware', 'Claims lookup completed successfully');
            response.locals.claims = result.claims;
            next();

        } catch (e) {

            // Report any exceptions
            const serverError = ErrorHandler.fromException(e);
            const [statusCode, clientError] = ErrorHandler.handleError(serverError);
            ResponseWriter.writeObject(response, statusCode, clientError);
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
}
