import {Container} from 'inversify';
import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {CoreApiClaims} from '../../../framework-api-base';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {OAUTHPUBLICTYPES} from '../configuration/oauthPublicTypes';
import {OAuthAuthorizer} from './oauthAuthorizer';

/*
 * A middleware for the lambda authorizer, which does token processing and claims lookup
 */
export class OAuthAuthorizerMiddleware<TClaims extends CoreApiClaims> implements MiddlewareObject<any, any> {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
        this._setupCallbacks();
    }

    /*
     * Do the OAuth work
     */
    public async before(handler: HandlerLambda<any, any>, next: NextFunction): Promise<void> {

        // Resolve the authorizer
        const authorizer = this._container.get<OAuthAuthorizer<TClaims>>(OAUTHINTERNALTYPES.OAuthAuthorizer);

        // Get it to do the work
        const policyDocument = await authorizer.execute(handler.event, handler.context);

        // Claims must be forwarded from the lambda authorizer via a policy document
        this._container.bind<any>(OAUTHPUBLICTYPES.PolicyDocument).toConstantValue(policyDocument);

        // For async middleware, middy calls next for us, so do not call it here
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
