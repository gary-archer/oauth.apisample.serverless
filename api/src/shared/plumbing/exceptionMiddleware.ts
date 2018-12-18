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

        // Get the error into an object
        const serverError = ErrorHandler.fromException(handler.error);

        // Process it which will add it to the log and return a client error
        const clientError = ErrorHandler.handleError(serverError, handler.event.log);

        // Set the lambda response
        handler.response = ResponseHandler.objectResponse(clientError.statusCode, clientError.asSerializable());

        // Set the context error object to return from the API gateway
        // The DEFAULT_4XX and DEFAULT_5XX properties in Serverless.yml reference this object
        (handler.context as any).errorResponse = clientError.asSerializable();
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
