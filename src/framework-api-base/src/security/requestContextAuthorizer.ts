import {Container} from 'inversify';
import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {APIFRAMEWORKTYPES} from '../configuration/apiFrameworkTypes';
import {INTERNALTYPES} from '../configuration/internalTypes';
import {BaseAuthorizerMiddleware} from './baseAuthorizerMiddleware';
import {CoreApiClaims} from './coreApiClaims';
import {RequestContextAuthenticator} from './requestContextAuthenticator';

/*
 * A simple middleware to extract claims from the request context written by the lambda authorizer
 */
export class RequestContextAuthorizer
       extends BaseAuthorizerMiddleware implements MiddlewareObject<any, any> {

    private readonly _container: Container;

    public constructor(container: Container) {
        super();
        this._container = container;
        this._setupCallbacks();
    }

    /*
     * Return claims that were provided by our lambda authorizer
     */
    public before(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Resolve the class that does the work
        const authenticator =
            this._container.get<RequestContextAuthenticator>(INTERNALTYPES.RequestContextAuthenticator);

        // Read claims from the request context
        const claims = authenticator.authorizeRequestAndGetClaims(handler.event, handler.context);

        // Make them available for injection into business logic
        this._container.rebind<CoreApiClaims>(APIFRAMEWORKTYPES.CoreApiClaims).toConstantValue(claims);

        // Include identity details in logs
        super.logIdentity(this._container, claims);

        next();
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
