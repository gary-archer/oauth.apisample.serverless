import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';

/*
 * A middleware for special header processing, used to simulate exceptions and check deployed error handling
 */
export class CustomHeaderMiddleware implements MiddlewareObject<any, any> {

    private _isLambdaAuthorizer: boolean;

    public constructor(isLambdaAuthorizer: boolean) {
        this._setupCallbacks();
        this._isLambdaAuthorizer = isLambdaAuthorizer;
    }

    /*
     * Simulate a 500 error if a particular test header is received
     */
    public before(handler: HandlerLambda<any, any>, next: NextFunction): void {

        const textExceptionHeaderName = 'x-mycompany-test-exception';

        if (this._isLambdaAuthorizer) {

            // For the authorizer we can't use custom headers so we'll use a magic token instead
            if (handler.event.authorizationToken === `Bearer ${textExceptionHeaderName}`) {
                throw new Error(`Simulating an exception for an authorizer operation`);
            }
        } else {

            if (handler.event.headers) {

                // For normal lambdas we can pass a custom header to simulate an exception
                if (handler.event.headers[textExceptionHeaderName] === 'true') {
                    throw new Error(`Simulating an exception for a lambda operation`);
                }
            }
        }

        next();
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
