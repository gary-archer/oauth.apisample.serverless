import middy from 'middy';
import {ErrorHandler} from '../../shared/plumbing/errorHandler';
import {ResponseHandler} from './responseHandler';

/*
 * The middleware coded in a class based manner
 */
class ExceptionMiddleware {

    public constructor() {
        this._setupCallbacks();
    }

    public onError(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {

        // Process the error
        const serverError = ErrorHandler.fromException(handler.error);
        const [statusCode, clientError] = ErrorHandler.handleError(serverError);
        const response = ResponseHandler.objectResponse(statusCode, clientError);

        // Set the error object to return from the lambda
        handler.response = response;

        // Set the error object to return from the API gateway
        // The errorResponse property is double serialized against the context
        // The DEFAULT_5XX properties in Serverless.yml reference this object
        const context = handler.context as any;
        context.errorResponse = JSON.stringify(response.body);
        return next();
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
