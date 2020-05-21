import {Container} from 'inversify';
import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {ErrorUtils} from '../errors/errorUtils';
import {ServerError} from '../errors/ServerError';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {ResponseWriter} from '../utilities/responseWriter';

/*
 * The exception middleware coded in a class based manner
 */
export class ExceptionMiddleware implements MiddlewareObject<any, any> {

    private readonly _container: Container;
    private readonly _configuration: LoggingConfiguration;

    public constructor(container: Container, configuration: LoggingConfiguration) {

        this._container = container;
        this._configuration = configuration;
        this._setupCallbacks();
    }

    /*
     * All exceptions are caught and returned from AWS here
     */
    public onError(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Get the log entry
        const logEntry = this._container.get<LogEntryImpl>(BASETYPES.LogEntry);

        // Get the error into a known object
        const error = ErrorUtils.fromException(handler.error);

        // Log the error and convert to the client error
        let clientError;
        if (error instanceof ServerError) {
            logEntry.setServerError(error);
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
