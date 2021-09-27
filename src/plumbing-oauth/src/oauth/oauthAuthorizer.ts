import middy from '@middy/core';
import {CustomAuthorizerResult} from 'aws-lambda';
import {Container} from 'inversify';
import {ApiClaims, BaseAuthorizerMiddleware, ClientError} from '../../../plumbing-base';
import {ClaimsProvider} from '../claims/claimsProvider';
import {OAUTHTYPES} from '../dependencies/oauthTypes';
import {AccessTokenRetriever} from './accessTokenRetriever';
import {OAuthAuthenticator} from './oauthAuthenticator';
import {PolicyDocumentWriter} from './policyDocumentWriter';

/*
 * A middleware for the lambda authorizer, which does token processing and claims lookup
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

        let authorizerResult: CustomAuthorizerResult;
        try {

            // Ask the authorizer to do the work and return claims
            const claims = await this._execute(handler.event);

            // Include identity details in logs
            super.logIdentity(this._container, claims.token);

            // Write an authorized policy document so that the REST call continues to the lambda
            // AWS will then cache the claims in the policy document for subsequent API requests with the same token
            authorizerResult = PolicyDocumentWriter.authorizedResponse(claims, handler.event);

        } catch (e) {

            // Rethrow exceptions and we will handle 401s specially
            if (!(e instanceof ClientError)) {
                throw e;
            }

            // Include 401 failure details in logs
            super.logUnauthorized(this._container, e);

            // We must return write an unauthorized policy document in order to return a 401 to the caller
            authorizerResult = PolicyDocumentWriter.invalidTokenResponse(handler.event);
        }

        // Add the policy document to the container, which will be retrieved by the handler
        this._container.rebind<CustomAuthorizerResult>(OAUTHTYPES.AuthorizerResult)
            .toConstantValue(authorizerResult);

        // For async middleware, middy calls next for us, so do not call it here
    }

    /*
     * Do the token validation and claims lookup
     */
    private async _execute(event: any): Promise<ApiClaims> {

        // Resolve dependencies
        const accessTokenRetriever = this._container.get<AccessTokenRetriever>(OAUTHTYPES.AccessTokenRetriever);
        const authenticator = this._container.get<OAuthAuthenticator>(OAUTHTYPES.OAuthAuthenticator);

        // First read the token from received headers and report missing tokens
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
