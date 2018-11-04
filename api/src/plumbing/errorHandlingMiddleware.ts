import * as middy from 'middy';
import {ErrorHandler} from './errorHandler';
import {ResponseHandler} from './responseHandler';

/*
 * The middleware coded in a class based manner
 */
class ErrorHandlingMiddleware {

    public constructor() {
        this.onError = this.onError.bind(this);
    }

    public onError(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {

        const serverError = ErrorHandler.fromException(handler.error);
        const [statusCode, clientError] = ErrorHandler.handleError(serverError);
        handler.response = ResponseHandler.objectResponse(statusCode, clientError);

        return next();
    }
}

/*
 * Do the export plumbing
 */
export function errorHandlingMiddleware(): middy.IMiddyMiddlewareObject {

    const middleware = new ErrorHandlingMiddleware();
    return {
        onError: middleware.onError,
    };
};
