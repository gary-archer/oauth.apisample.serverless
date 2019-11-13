import {Container} from 'inversify';
import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {FRAMEWORKTYPES} from '../configuration/frameworkTypes';
import {ApiClaims} from '../security/apiClaims';
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

        // Make then available for injection into business logic
        this._container.bind<ApiClaims>(FRAMEWORKTYPES.ApiClaims).toConstantValue(claims);

        next();
    }

    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
