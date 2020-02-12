import {Container} from 'inversify';
import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {BASEFRAMEWORKTYPES} from '../../../framework-base';
import {FrameworkConfiguration} from '../configuration/frameworkConfiguration';
import {ApiError} from '../errors/apiError';
import {ApplicationExceptionHandler} from '../errors/applicationExceptionHandler';
import {ErrorUtils} from '../errors/errorUtils';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {ResponseWriter} from '../utilities/responseWriter';

/*
 * The exception middleware coded in a class based manner
 */
export class ExceptionMiddleware implements MiddlewareObject<any, any> {

    private readonly _container: Container;
    private readonly _configuration: FrameworkConfiguration;
    private readonly _applicationExceptionHandler: ApplicationExceptionHandler;

    public constructor(
        container: Container,
        configuration: FrameworkConfiguration,
        appExceptionHandler: ApplicationExceptionHandler) {

        this._container = container;
        this._configuration = configuration;
        this._applicationExceptionHandler = appExceptionHandler;
        this._setupCallbacks();
    }

    /*
     * All exceptions are caught and returned from AWS here
     */
    public onError(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Get the log entry
        const logEntry = this._container.get<LogEntryImpl>(BASEFRAMEWORKTYPES.LogEntry);

        // Get the exception to handle and allow the application to implement its own error logic first
        const exceptionToHandle = this._applicationExceptionHandler.translate(handler.error);

        // Get the error into a known object
        const error = ErrorUtils.fromException(exceptionToHandle);

        // Log the error and convert to the client error
        let clientError;
        if (error instanceof ApiError) {
            logEntry.setApiError(error);
            clientError = error.toClientError(this._configuration.apiName);
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
