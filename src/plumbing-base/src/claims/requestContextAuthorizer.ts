import middy from '@middy/core';
import {Container} from 'inversify';
import {CoreApiClaims} from '../claims/coreApiClaims';
import {BASETYPES} from '../dependencies/baseTypes';
import {BaseAuthorizerMiddleware} from './baseAuthorizerMiddleware';
import {RequestContextAuthenticator} from './requestContextAuthenticator';

/*
 * Normal lambdas use this to finish setting up authorization aspects
 */
export class RequestContextAuthorizer
       extends BaseAuthorizerMiddleware implements middy.MiddlewareObject<any, any> {

    private readonly _container: Container;

    public constructor(container: Container) {
        super();
        this._container = container;
        this._setupCallbacks();
    }

    /*
     * Return claims that were provided by our lambda authorizer
     */
    public before(handler: middy.HandlerLambda<any, any>, next: middy.NextFunction): void {

        // Resolve the class that does the work
        const authenticator =
            this._container.get<RequestContextAuthenticator>(BASETYPES.RequestContextAuthenticator);

        // Read claims from the request context
        const claims = authenticator.authorizeRequestAndGetClaims(handler.event, handler.context);

        // Make them available for injection into business logic
        this._container.rebind<CoreApiClaims>(BASETYPES.CoreApiClaims).toConstantValue(claims);

        // Include identity details in logs
        super.logIdentity(this._container, claims);

        next();
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
