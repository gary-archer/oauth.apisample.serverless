import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {BASEFRAMEWORKTYPES} from '../../../framework-base';
import {ApiError} from '../errors/apiError';
import {ApplicationExceptionHandler} from '../errors/applicationExceptionHandler';
import {ErrorUtils} from '../errors/errorUtils';
import {ServerlessOfflineUnauthorizedError} from '../errors/serverlessOfflineUnauthorizedError';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {ContainerHelper} from '../utilities/containerHelper';
import {ResponseWriter} from '../utilities/responseWriter';

/*
 * The exception middleware coded in a class based manner
 */
export class ExceptionMiddleware implements MiddlewareObject<any, any> {

    private readonly _applicationExceptionHandler: ApplicationExceptionHandler | null;

    public constructor(appExceptionHandler: ApplicationExceptionHandler | null) {
        this._applicationExceptionHandler = appExceptionHandler;
        this._setupCallbacks();
    }

    /*
     * All exceptions are caught and returned from AWS here
     */
    public onError(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Get the log entry
        const container = ContainerHelper.current(handler.event);
        const logEntry = container.get<LogEntryImpl>(BASEFRAMEWORKTYPES.LogEntry);

        // Special handling for Serverless Offline
        if (ServerlessOfflineUnauthorizedError.catch(handler.error)) {
            next(handler.error);
            return;
        }

        // Get the exception to handle and allow the application to implement its own error logic first
        let exceptionToHandle = handler.error;
        if (this._applicationExceptionHandler) {
            exceptionToHandle = this._applicationExceptionHandler.translate(exceptionToHandle);
        }

        // Get the error into a known object
        const error = ErrorUtils.fromException(exceptionToHandle);

        // Log the error and convert to the client error
        let clientError;
        if (error instanceof ApiError) {
            logEntry.setApiError(error);
            clientError = error.toClientError('SampleApi');
        } else {
            logEntry.setClientError(error);
            clientError = error;
        }

        // Finish the log entry for the exception case
        logEntry.end(handler.response);
        logEntry.write(handler.event);

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
