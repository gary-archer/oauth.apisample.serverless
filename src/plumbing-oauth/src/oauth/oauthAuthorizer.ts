import middy from '@middy/core';
import {Container} from 'inversify';
import {
    ApiClaims,
    BASETYPES,
    BaseAuthorizerMiddleware,
    BaseClaims,
    ClientError,
    CustomClaims,
    UserInfoClaims} from '../../../plumbing-base';
import {ClaimsProvider} from '../claims/claimsProvider';
import {OAUTHTYPES} from '../dependencies/oauthTypes';
import {AccessTokenRetriever} from './accessTokenRetriever';
import {OAuthAuthenticator} from './oauthAuthenticator';

/*
 * A middleware for OAuth handling, which does token processing and claims lookup
 */
export class OAuthAuthorizer extends BaseAuthorizerMiddleware implements middy.MiddlewareObject<any, any> {

    private readonly _container: Container;
    private readonly _claimsProvider: ClaimsProvider;

    public constructor(container: Container, claimsProvider: ClaimsProvider) {
        super();
        this._container = container;
        this._claimsProvider = claimsProvider;
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
            super.logIdentity(this._container, claims.token);

            // Make claims injectable
            this._container.rebind<BaseClaims>(BASETYPES.BaseClaims).toConstantValue(claims.token);
            this._container.rebind<UserInfoClaims>(BASETYPES.UserInfoClaims).toConstantValue(claims.userInfo);
            this._container.rebind<CustomClaims>(BASETYPES.CustomClaims).toConstantValue(claims.custom);

        } catch (e) {

            // Log 401s and causes
            if (e instanceof ClientError) {
                super.logUnauthorized(this._container, e);
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

        // Resolve dependencies
        const accessTokenRetriever = this._container.get<AccessTokenRetriever>(OAUTHTYPES.AccessTokenRetriever);
        const authenticator = this._container.get<OAuthAuthenticator>(OAUTHTYPES.OAuthAuthenticator);

        // First get the token from received headers and report missing tokens
        const accessToken = accessTokenRetriever.getAccessToken(event);

        // Validate the token and get token claims
        const token = await authenticator.validateToken(accessToken);

        // Look up user info claims
        const userInfo = await authenticator.getUserInfo(accessToken);

        // Ask the claims provider to supply the final claims
        return this._claimsProvider.supplyClaims(token, userInfo);
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
