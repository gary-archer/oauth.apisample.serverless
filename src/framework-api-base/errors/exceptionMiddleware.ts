import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {ResponseHandler} from '../utilities/responseHandler';
import {ApiError} from './apiError';
import {ErrorHandler} from './errorHandler';

/*
 * The exception middleware coded in a class based manner
 */
export class ExceptionMiddleware implements MiddlewareObject<any, any> {

    public constructor() {
        this._setupCallbacks();
    }

    /*
     * All exceptions are caught and returned from AWS here
     */
    public onError(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Get the error into a known object
        const error = ErrorHandler.handleError(handler.error, handler.event.log);
        let clientError;

        // Convert to the client error
        if (error instanceof ApiError) {
            clientError = error.toClientError(ErrorHandler.apiName);
        } else {
            clientError = error;
        }

        // Set the client error as the lambda response error, which will be serialized and returned via the API gateway
        handler.response = ResponseHandler.objectResponse(clientError.getStatusCode(), clientError.toResponseFormat());

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
