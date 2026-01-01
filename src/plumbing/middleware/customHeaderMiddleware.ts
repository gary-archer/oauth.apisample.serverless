import {APIGatewayProxyResult} from 'aws-lambda';
import middy from '@middy/core';
import {BaseErrorCodes} from '../errors/baseErrorCodes.js';
import {ErrorFactory} from '../errors/errorFactory.js';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent.js';

/*
 * A middleware for special header processing, used to simulate exceptions and check deployed error handling
 */
export class CustomHeaderMiddleware implements
    middy.MiddlewareObj<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> {

    private readonly apiName: string;

    public constructor(apiName: string) {
        this.apiName = apiName;
        this.setupCallbacks();
    }

    /*
     * Simulate a 500 error if a particular test header is received
     */
    public before(request: middy.Request<APIGatewayProxyExtendedEvent, APIGatewayProxyResult>): void {

        const apiToBreak = this.getHeader(request.event, 'api-exception-simulation');
        if (apiToBreak) {
            if (apiToBreak.toLowerCase() === this.apiName.toLowerCase()) {
                throw ErrorFactory.createServerError(
                    BaseErrorCodes.exceptionSimulation,
                    'An exception was simulated in the API');
            }
        }
    }

    /*
     * Get a header value if supplied
     */
    private getHeader(event: APIGatewayProxyExtendedEvent, key: string): string | null {

        if (event.headers) {

            const found = Object.keys(event.headers).find((h) => h.toLowerCase() === key);
            if (found) {
                return event.headers[found] as string;
            }
        }

        return null;
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
