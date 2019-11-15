import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {ResponseWriter} from '../utilities/responseWriter';
import {ApiError} from './apiError';
import {ApplicationExceptionHandler} from './applicationExceptionHandler';
import {ErrorUtils} from './errorUtils';

/*
 * The exception middleware coded in a class based manner
 */
export class ExceptionMiddleware implements MiddlewareObject<any, any> {

    private readonly _logEntry: LogEntryImpl;
    private readonly _applicationExceptionHandler: ApplicationExceptionHandler | null;

    public constructor(logEntry: LogEntryImpl, appExceptionHandler: ApplicationExceptionHandler | null) {
        this._logEntry = logEntry;
        this._applicationExceptionHandler = appExceptionHandler;
        this._setupCallbacks();
    }

    /*
     * All exceptions are caught and returned from AWS here
     */
    public onError(handler: HandlerLambda<any, any>, next: NextFunction): void {

        console.log('*** EXCEPTION MIDDLEWARE ERROR');

        // Get the exception to handle and allow the application to implement its own error logic first
        let exceptionToHandle = handler.error;
        if (this._applicationExceptionHandler) {
            exceptionToHandle = this._applicationExceptionHandler.translate(exceptionToHandle);
        }

        // Get the error into a known object
        const error = ErrorUtils.fromException(exceptionToHandle);

        // Convert to the client error
        let clientError;
        if (error instanceof ApiError) {
            this._logEntry.setApiError(error);
            clientError = error.toClientError('SampleApi');
        } else {
            this._logEntry.setClientError(error);
            clientError = error;
        }

        // Set the client error as the lambda response error, which will be serialized and returned via the API gateway
        handler.response = ResponseWriter.objectResponse(clientError.getStatusCode(), clientError.toResponseFormat());

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
