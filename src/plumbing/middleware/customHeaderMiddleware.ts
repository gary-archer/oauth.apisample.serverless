import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import middy from '@middy/core';
import {BaseErrorCodes} from '../errors/baseErrorCodes.js';
import {ErrorFactory} from '../errors/errorFactory.js';

/*
 * A middleware for special header processing, used to simulate exceptions and check deployed error handling
 */
export class CustomHeaderMiddleware implements middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> {

    private readonly _apiName: string;

    public constructor(apiName: string) {
        this._apiName = apiName;
        this._setupCallbacks();
    }

    /*
     * Simulate a 500 error if a particular test header is received
     */
    public before(request: middy.Request<APIGatewayProxyEvent, APIGatewayProxyResult>): void {

        const textExceptionHeaderName = 'x-authsamples-test-exception';

        if (request.event.headers) {
            const apiToBreak = request.event.headers[textExceptionHeaderName];
            if (apiToBreak) {
                if (apiToBreak.toLowerCase() === this._apiName.toLowerCase()) {
                    throw ErrorFactory.createServerError(
                        BaseErrorCodes.exceptionSimulation,
                        'An exception was simulated in the API');
                }
            }
        }
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
