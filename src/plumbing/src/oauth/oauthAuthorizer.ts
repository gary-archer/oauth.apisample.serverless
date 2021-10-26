import middy from '@middy/core';
import {Container} from 'inversify';
import hasher from 'js-sha256';
import {Cache} from '../cache/cache';
import {ClaimsPrincipal} from '../claims/claimsPrincipal';
import {BaseClaims} from '../claims/baseClaims';
import {CachedClaims} from '../claims/cachedClaims';
import {CustomClaims} from '../claims/customClaims';
import {CustomClaimsProvider} from '../claims/customClaimsProvider';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {BASETYPES} from '../dependencies/baseTypes';
import {ClientError} from '../errors/clientError';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {AccessTokenRetriever} from './accessTokenRetriever';
import {OAuthAuthenticator} from './oauthAuthenticator';

/*
 * A middleware for OAuth handling, which does token processing and custom claims handling
 */
export class OAuthAuthorizer implements middy.MiddlewareObject<any, any> {

    private readonly _container: Container;
    private readonly _customClaimsProvider: CustomClaimsProvider;
    private readonly _cache: Cache;

    public constructor(
        container: Container,
        customClaimsProvider: CustomClaimsProvider,
        cache: Cache) {

        this._container = container;
        this._customClaimsProvider = customClaimsProvider;
        this._cache = cache;
        this._setupCallbacks();
    }

    /*
     * The entry point does the OAuth work as well as AWS specific processing
     */
    public async before(handler: middy.HandlerLambda<any, any>): Promise<void> {

        const logEntry = this._container.get<LogEntryImpl>(BASETYPES.LogEntry);
        try {

            // Ask the authorizer to do the work and return claims
            const claims = await this._execute(handler.event);

            // Include identity details in logs as soon as we have them
            logEntry.setIdentity(claims.token);

            // Make claims injectable
            this._container.rebind<BaseClaims>(BASETYPES.BaseClaims).toConstantValue(claims.token);
            this._container.rebind<UserInfoClaims>(BASETYPES.UserInfoClaims).toConstantValue(claims.userInfo);
            this._container.rebind<CustomClaims>(BASETYPES.CustomClaims).toConstantValue(claims.custom);

        } catch (e) {

            // Log the cause of any 401 errors
            if (e instanceof ClientError) {

                logEntry.setClientError(e);
                logEntry.setResponseStatus(401);
            }

            // Rethrow the error
            throw e;
        }

        // For async middleware, middy calls next for us, so do not call it here
    }

    /*
     * Do the token validation and claims lookup
     */
    private async _execute(event: any): Promise<ClaimsPrincipal> {

        // First get the access token from the incoming request
        const accessTokenRetriever = this._container.get<AccessTokenRetriever>(BASETYPES.AccessTokenRetriever);
        const accessToken = accessTokenRetriever.getAccessToken(event);

        // On every lambda HTTP request we validate the JWT, in a zero trust manner
        const authenticator = this._container.get<OAuthAuthenticator>(BASETYPES.OAuthAuthenticator);
        const tokenClaims = await authenticator.validateToken(accessToken);

        // If cached results exist for other claims then return them
        const accessTokenHash = hasher.sha256(accessToken);
        const cachedClaims = await this._cache.getExtraUserClaims(accessTokenHash);
        if (cachedClaims) {
            return new ClaimsPrincipal(tokenClaims, cachedClaims.userInfo, cachedClaims.custom);
        }

        // Otherwise look up user info claims and domain specific claims
        const userInfo = await authenticator.getUserInfo(accessToken);
        const customClaims = await this._customClaimsProvider.get(accessToken, tokenClaims, userInfo);
        const claimsToCache = new CachedClaims(userInfo, customClaims);

        // Cache the extra claims for subsequent requests with the same access token
        await this._cache.setExtraUserClaims(accessTokenHash, claimsToCache);

        // Return the final claims
        return new ClaimsPrincipal(tokenClaims, userInfo, customClaims);
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
