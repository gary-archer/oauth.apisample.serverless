import middy from 'middy';
import {ResponseHandler} from '../../shared/plumbing/responseHandler';
import {ErrorHandler} from './errorHandler';

/*
 * The exception middleware coded in a class based manner
 */
class ExceptionMiddleware {

    public constructor() {
        this._setupCallbacks();
    }

    /*
     * All exceptions are caught and returned from AWS here
     */
    public onError(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {

        // Process it which will add it to the log and return a client error
        const clientError = ErrorHandler.handleError(handler.error, handler.event.log);

        // Set the client error as the lambda response error, which will be serialized and returned via the API gateway
        handler.response = ResponseHandler.objectResponse(clientError.statusCode, clientError.toResponseFormat());

        // With middy we always move to the next
        next();
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.onError = this.onError.bind(this);
    }
}

/*
 * Do the export plumbing
 */
export function exceptionMiddleware(): middy.IMiddyMiddlewareObject {

    const middleware = new ExceptionMiddleware();
    return {
        onError: middleware.onError,
    };
}
