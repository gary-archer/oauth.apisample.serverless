import {Context} from 'aws-lambda';
import {OAuthConfiguration} from '../../shared/configuration/oauthConfiguration';
import {RequestLogger} from '../../shared/plumbing/requestLogger';
import {ResponseHandler} from '../../shared/plumbing/responseHandler';
import {AuthorizationMicroservice} from '../logic/authorizationMicroservice';
import {DebugProxyAgent} from '../plumbing/debugProxyAgent';
import {Authenticator} from './authenticator';

/*
 * The middleware coded in a class based manner
 */
export class ClaimsHandler {

    /*
     * Dependencies
     */
    private _oauthConfig: OAuthConfiguration;
    private _log: RequestLogger;
    private _authorizationMicroservice: AuthorizationMicroservice;

    /*
     * Receive configuration
     */
    public constructor(
        oauthConfig: OAuthConfiguration,
        event: any,
        authorizationMicroservice: AuthorizationMicroservice) {

        this._oauthConfig = oauthConfig;
        this._log = event.log;
        this._authorizationMicroservice = authorizationMicroservice;
        this._setupCallbacks();
    }

    /*
     * Do the authorization and set claims, or return an unauthorized response
     */
    public async authorizeRequestAndSetClaims(event: any, context: Context) {

        // Configure a proxy for OAuth requests if the HTTPS_PROXY environment variable is set
        await DebugProxyAgent.initialize();

        // First read the token from the request header and report missing tokens
        const accessToken = this._readToken(event.authorizationToken);
        if (!accessToken) {
            this._log.debug('ClaimsHandler', 'No access token received');
            return ResponseHandler.invalidTokenResponse(event);
        }

        // Start by introspecting the token
        const authenticator = new Authenticator(this._oauthConfig, this._log);
        const result = await authenticator.validateTokenAndGetTokenClaims(accessToken);

        // Handle invalid or expired tokens
        if (!result.isValid) {
            this._log.debug('ClaimsHandler', 'Invalid or expired access token received');
            return ResponseHandler.invalidTokenResponse(event);
        }

        // Next add product user data to claims
        this._log.debug('ClaimsHandler', 'OAuth token validation and user lookup succeeded');
        await this._authorizationMicroservice.getProductClaims(result.claims!, accessToken);

        // Then move onto the API controller to execute business logic
        this._log.debug('ClaimsHandler', 'Claims handler completed successfully');
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
