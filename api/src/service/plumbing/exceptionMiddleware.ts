import middy from 'middy';
import {ErrorHandler} from '../../shared/plumbing/errorHandler';
import {ResponseHandler} from './responseHandler';
import { isContext } from 'vm';

/*
 * The middleware coded in a class based manner
 */
class ExceptionMiddleware {

    public constructor() {
        this._setupCallbacks();
    }

    public onError(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {

        const serverError = ErrorHandler.fromException(handler.error);
        const [statusCode, clientError] = ErrorHandler.handleError(serverError);
        const response = ResponseHandler.objectResponse(statusCode, clientError);

        // Set the error response to return from the lambda
        // In AWS this is passed through to the API gateway
        handler.response = response;

        // The error response for API Gateway needs to be double serialized
        // The response template for DEFAULT_5XX errors captures the errorResponse object properties
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
