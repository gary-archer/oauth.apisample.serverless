import middy from '@middy/core';
import {BaseErrorCodes} from '../errors/baseErrorCodes';
import {ErrorFactory} from '../errors/errorFactory';

/*
 * A middleware for special header processing, used to simulate exceptions and check deployed error handling
 */
export class CustomHeaderMiddleware implements middy.MiddlewareObject<any, any> {

    private readonly _apiName: string;

    public constructor(apiName: string) {
        this._apiName = apiName;
        this._setupCallbacks();
    }

    /*
     * Simulate a 500 error if a particular test header is received
     */
    public before(handler: middy.HandlerLambda<any, any>, next: middy.NextFunction): void {

        const textExceptionHeaderName = 'x-mycompany-test-exception';

        if (handler.event.headers) {
            const apiToBreak = handler.event.headers[textExceptionHeaderName];
            if (apiToBreak) {
                if (apiToBreak.toLowerCase() === this._apiName.toLowerCase()) {
                    throw ErrorFactory.createServerError(
                        BaseErrorCodes.exceptionSimulation,
                        'An exception was simulated in the API');
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
