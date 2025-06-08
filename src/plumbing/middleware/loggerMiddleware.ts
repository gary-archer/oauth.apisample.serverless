import middy from '@middy/core';
import {APIGatewayProxyResult} from 'aws-lambda';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {LogEntryImpl} from '../logging/logEntryImpl.js';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl.js';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent.js';

/*
 * A class to log API requests as JSON objects so that we get structured logging output
 */
export class LoggerMiddleware implements middy.MiddlewareObj<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> {

    private readonly loggerFactory: LoggerFactoryImpl;

    public constructor(loggerFactory: LoggerFactoryImpl) {
        this.loggerFactory = loggerFactory;
        this.setupCallbacks();
    }

    /*
     * Start logging when a request begins
     */
    public before(request: middy.Request<APIGatewayProxyExtendedEvent, APIGatewayProxyResult>): void {

        // Create the log entry for the current request
        const logEntry = this.loggerFactory.createLogEntry();

        // Bind it to the container
        request.event.container.bind<LogEntryImpl>(BASETYPES.LogEntry).toConstantValue(logEntry);

        // Start request logging
        logEntry.start(request.event, request.context);
    }

    /*
     * Finish logging after normal completion
     */
    public after(request: middy.Request<APIGatewayProxyExtendedEvent, APIGatewayProxyResult>): void {

        // Get the log entry for this request
        const logEntry = request.event.container.get<LogEntryImpl>(BASETYPES.LogEntry);

        // End logging
        if (request.response && request.response.statusCode) {
            logEntry.setResponseStatus(request.response.statusCode);
        }
        logEntry.end();
        logEntry.write();
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private setupCallbacks(): void {
        this.before = this.before.bind(this);
        this.after = this.after.bind(this);
    }
}
