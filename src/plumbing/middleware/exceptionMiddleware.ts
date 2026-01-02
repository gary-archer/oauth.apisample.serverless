import middy from '@middy/core';
import {APIGatewayProxyResult} from 'aws-lambda';
import {LoggingConfiguration} from '../configuration/loggingConfiguration';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {ClientError} from '../errors/clientError';
import {ErrorUtils} from '../errors/errorUtils';
import {ServerError} from '../errors/serverError';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent';
import {ResponseWriter} from '../utilities/responseWriter';

/*
 * The exception middleware coded in a class based manner
 */
export class ExceptionMiddleware implements
    middy.MiddlewareObj<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> {

    private readonly loggerFactory: LoggerFactoryImpl;
    private readonly loggingConfiguration: LoggingConfiguration;
    private readonly oauthConfiguration: OAuthConfiguration;

    public constructor(
        loggerFactory: LoggerFactoryImpl,
        loggingConfiguration: LoggingConfiguration,
        oauthConfiguration: OAuthConfiguration,
    ) {
        this.loggerFactory = loggerFactory;
        this.loggingConfiguration = loggingConfiguration;
        this.oauthConfiguration = oauthConfiguration;
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
            clientError = error.toClientError(this.loggingConfiguration.apiName);

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
        this.loggerFactory.getRequestLogger()?.write(logEntry.getRequestLog());
        this.loggerFactory.getAuditLogger()?.write(logEntry.getAuditLog());

        // Set the client error as the lambda response error, which will be serialized and returned via the API gateway
        request.response = ResponseWriter.errorResponse(
            clientError.getStatusCode(),
            clientError,
            this.oauthConfiguration.scope);
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private setupCallbacks(): void {
        this.onError = this.onError.bind(this);
    }
}
