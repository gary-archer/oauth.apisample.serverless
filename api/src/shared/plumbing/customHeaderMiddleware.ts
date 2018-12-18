import middy from 'middy';

/*
 * A middleware for special header processing, used for error testing
 */
class CustomHeaderMiddleware {

    private _operationType: string;

    public constructor(operationType: string) {
        this._setupCallbacks();
        this._operationType = operationType;
    }

    /*
     * Simulate a 500 error if a particular test header is received
     */
    public before(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {

        if (handler.event.headers) {
            if (handler.event.headers['x-test-exception'] === this._operationType) {
                throw new Error(`Simulating an exception for operation type ${this._operationType}`);
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

/*
 * Do the export plumbing
 */
export function customHeaderMiddleware(type: string): middy.IMiddyMiddlewareObject {

    const middleware = new CustomHeaderMiddleware(type);
    return {
        before: middleware.before,
    };
}
