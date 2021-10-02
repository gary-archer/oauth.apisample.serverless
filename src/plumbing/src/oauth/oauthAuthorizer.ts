import middy from '@middy/core';
import {Container} from 'inversify';
import hasher from 'js-sha256';
import {Cache} from '../cache/cache';
import {ApiClaims} from '../claims/apiClaims';
import {BaseClaims} from '../claims/baseClaims';
import {ClaimsProvider} from '../claims/claimsProvider';
import {CustomClaims} from '../claims/customClaims';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {BASETYPES} from '../dependencies/baseTypes';
import {ClientError} from '../errors/clientError';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {AccessTokenRetriever} from './accessTokenRetriever';
import {OAuthAuthenticator} from './oauthAuthenticator';

/*
 * A middleware for OAuth handling, which does token processing and claims lookup
 */
export class OAuthAuthorizer implements middy.MiddlewareObject<any, any> {

    private readonly _container: Container;
    private readonly _claimsProvider: ClaimsProvider;
    private readonly _cache: Cache;

    public constructor(container: Container, claimsProvider: ClaimsProvider, cache: Cache) {
        this._container = container;
        this._claimsProvider = claimsProvider;
        this._cache = cache;
        this._setupCallbacks();
    }

    /*
     * The entry point does the OAuth work as well as AWS specific processing
     */
    public async before(handler: middy.HandlerLambda<any, any>): Promise<void> {

        try {

            // Ask the authorizer to do the work and return claims
            const claims = await this._execute(handler.event);

            // Include identity details in logs
            this._logIdentity(this._container, claims.token);

            // Make claims injectable
            this._container.rebind<BaseClaims>(BASETYPES.BaseClaims).toConstantValue(claims.token);
            this._container.rebind<UserInfoClaims>(BASETYPES.UserInfoClaims).toConstantValue(claims.userInfo);
            this._container.rebind<CustomClaims>(BASETYPES.CustomClaims).toConstantValue(claims.custom);

        } catch (e) {

            // Log 401s and causes
            if (e instanceof ClientError) {
                this._logUnauthorized(this._container, e);
            }

            // Rethrow the error
            throw e;
        }

        // For async middleware, middy calls next for us, so do not call it here
    }

    /*
     * Do the token validation and claims lookup
     */
    private async _execute(event: any): Promise<ApiClaims> {

        // First get the access token from the incoming request
        const accessTokenRetriever = this._container.get<AccessTokenRetriever>(BASETYPES.AccessTokenRetriever);
        const accessToken = accessTokenRetriever.getAccessToken(event);

        // If cached results already exist for this token then return them immediately
        const accessTokenHash = hasher.sha256(accessToken);
        const cachedClaims = await this._cache.getClaimsForToken(accessTokenHash);
        if (cachedClaims) {
            return cachedClaims;
        }

        // Otherwise resolve the authenticator for this request
        const authenticator = this._container.get<OAuthAuthenticator>(BASETYPES.OAuthAuthenticator);

        // Validate the token and get token claims
        const token = await authenticator.validateToken(accessToken);

        // Look up user info claims
        const userInfo = await authenticator.getUserInfo(accessToken);

        // Ask the claims provider to create the final claims object
        const apiClaims = await this._claimsProvider.supplyClaims(token, userInfo);

        // Cache the claims against the token hash until the token's expiry time
        await this._cache.addClaimsForToken(accessTokenHash, apiClaims);
        return apiClaims;
    }

    /*
     * Include identity details in both authorizer and lambda logs
     */
    private _logIdentity(container: Container, claims: BaseClaims): void {

        const logEntry = container.get<LogEntryImpl>(BASETYPES.LogEntry);
        logEntry.setIdentity(claims);
    }

    /*
     * Log any authorization failures
     */
    private _logUnauthorized(container: Container, error: ClientError): void {

        const logEntry = container.get<LogEntryImpl>(BASETYPES.LogEntry);
        logEntry.setClientError(error);
        logEntry.setResponseStatus(401);
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
