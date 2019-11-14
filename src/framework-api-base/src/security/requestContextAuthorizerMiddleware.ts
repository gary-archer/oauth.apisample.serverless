import {Container} from 'inversify';
import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {APIFRAMEWORKTYPES} from '../configuration/apiFrameworkTypes';
import {CoreApiClaims} from '../security/coreApiClaims';
import {RequestContextAuthorizer} from './requestContextAuthorizer';

/*
 * A simple middleware to extract claims from the request context written by the lambda authorizer
 */
export class RequestContextAuthorizerMiddleware implements MiddlewareObject<any, any> {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
        this._setupCallbacks();
    }

    /*
     * Return claims that were provided by our lambda authorizer
     */
    public before(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Use the simple authorizer class to get the claims
        const authorizer = new RequestContextAuthorizer();
        const claims = authorizer.execute(handler.event, handler.context);

        // Make them available for injection into business logic
        this._container.bind<CoreApiClaims>(APIFRAMEWORKTYPES.CoreApiClaims).toConstantValue(claims);

        next();
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
