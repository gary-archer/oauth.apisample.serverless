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

        // Handle returning a 500 error, which also requires updating context
        handler.response = ResponseHandler.exceptionErrorResponse(statusCode, clientError, handler.context);
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
