import middy from '@middy/core';
import {APIGatewayProxyResult} from 'aws-lambda';
import {LoggingConfiguration} from '../configuration/loggingConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {ClientError} from '../errors/clientError.js';
import {ErrorUtils} from '../errors/errorUtils.js';
import {ServerError} from '../errors/serverError.js';
import {LogEntryImpl} from '../logging/logEntryImpl.js';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent.js';
import {ResponseWriter} from '../utilities/responseWriter.js';

/*
 * The exception middleware coded in a class based manner
 */
export class ExceptionMiddleware implements
    middy.MiddlewareObj<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> {

    private readonly configuration: LoggingConfiguration;

    public constructor(configuration: LoggingConfiguration) {

        this.configuration = configuration;
        this.setupCallbacks();
    }

    /*
     * All exceptions are caught and returned from AWS here
     */
    public onError(request: middy.Request<APIGatewayProxyExtendedEvent, APIGatewayProxyResult>): void {

        // Get the log entry
        const logEntry = request.event.container.get<LogEntryImpl>(BASETYPES.LogEntry);

        // Get the error into a known object
        const error = ErrorUtils.fromException(request.error);

        let clientError: ClientError;
        if (error instanceof ServerError) {

            // Log the exception and convert to the client error
            logEntry.setServerError(error);
            clientError = error.toClientError(this.configuration.apiName);

        } else {

            // Inform the client of an invalid request
            logEntry.setClientError(error);
            clientError = error;
        }

        // In some cases we return a generic error code to the client and log a more specific one
        const logContext = clientError.getLogContext();
        if (logContext && logContext.code) {
            logEntry.setErrorCodeOverride(logContext.code);
        }

        // Finish the log entry for the exception case
        logEntry.setResponseStatus(clientError.getStatusCode());
        logEntry.end();
        logEntry.write();

        // Set the client error as the lambda response error, which will be serialized and returned via the API gateway
        request.response = ResponseWriter.errorResponse(clientError.getStatusCode(), clientError);
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private setupCallbacks(): void {
        this.onError = this.onError.bind(this);
    }
}
