import {Context} from 'aws-lambda';
import {Container} from 'inversify';
import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {BaseAuthorizerMiddleware, CoreApiClaims, DefaultClientError } from '../../../framework-api-base';
import {ClaimsSupplier} from '../claims/claimsSupplier';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {OAUTHPUBLICTYPES} from '../configuration/oauthPublicTypes';
import {PolicyDocumentWriter} from '../utilities/policyDocumentWriter';
import {OAuthAuthenticator} from './oauthAuthenticator';

/*
 * A middleware for the lambda authorizer, which does token processing and claims lookup
 */
export class OAuthAuthorizer<TClaims extends CoreApiClaims>
       extends BaseAuthorizerMiddleware implements MiddlewareObject<any, any> {

    public constructor(container: Container) {
        super(container);
        this._setupCallbacks();
    }

    /*
     * The entry point does the OAuth work as well as AWS specific processing
     */
    public async before(handler: HandlerLambda<any, any>, next: NextFunction): Promise<void> {

        try {

            // Ask the authorizer to do the work and return claims
            const claims = await this._execute(handler.event, handler.context);

            // Include identity details in logs
            super.logIdentity(claims);

            // We must write an authorized policy document to enable the REST call to continue to the lambda
            // This is returned as the actual handler response later
            const policyDocument = PolicyDocumentWriter.authorizedResponse(claims, handler.event);
            this.container.bind<any>(OAUTHPUBLICTYPES.PolicyDocument).toConstantValue(policyDocument);

        } catch (e) {

            // Rethrow exceptions and we will handle 401s specially
            if (!(e instanceof DefaultClientError)) {
                throw e;
            }

            // Include 401 failure details in logs
            super.logUnauthorized(e);

            // We must return write an unauthorized policy document in order to return a 401 to the caller
            const policyDocument = PolicyDocumentWriter.invalidTokenResponse(handler.event);
            this.container.bind<any>(OAUTHPUBLICTYPES.PolicyDocument).toConstantValue(policyDocument);
        }

        // For async middleware, middy calls next for us, so do not call it here
    }

    /*
     * Do the token validation and claims lookup
     */
    private async _execute(event: any, context: Context): Promise<TClaims> {

        // Resolve dependencies
        const claimsSupplier = this.container.get<ClaimsSupplier<TClaims>>(OAUTHINTERNALTYPES.ClaimsSupplier);
        const authenticator = this.container.get<OAuthAuthenticator>(OAUTHINTERNALTYPES.OAuthAuthenticator);

        // First read the token from the request header and report missing tokens
        const accessToken = this._readAccessToken(event.authorizationToken);
        if (!accessToken) {
            throw DefaultClientError.create401('No access token was supplied in the bearer header');
        }

        // Create new claims which we will then populate
        const claims = claimsSupplier.createEmptyClaims();

        // Make OAuth calls to validate the token and get user info
        await authenticator.authenticateAndSetClaims(accessToken, claims);

        // Add any custom product specific custom claims if required
        await claimsSupplier.createCustomClaimsProvider().addCustomClaims(accessToken, claims);
        return claims;
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

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
