import middy from '@middy/core';
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {LogEntryImpl} from '../logging/logEntryImpl.js';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl.js';

/*
 * The middleware coded in a class based manner
 */
export class LoggerMiddleware implements middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> {

    private readonly loggerFactory: LoggerFactoryImpl;

    public constructor(loggerFactory: LoggerFactoryImpl) {
        this.loggerFactory = loggerFactory;
        this.setupCallbacks();
    }

    /*
     * Start logging when a request begins
     */
    public before(request: middy.Request<APIGatewayProxyEvent, APIGatewayProxyResult>): void {

        // Create the log entry for the current request
        const container = (request.event as any).container as Container;
        const logEntry = this.loggerFactory.createLogEntry();

        // Bind it to the container
        container.bind<LogEntryImpl>(BASETYPES.LogEntry).toConstantValue(logEntry);

        // Start request logging
        logEntry.start(request.event, request.context);
    }

    /*
     * Finish logging after normal completion
     */
    public after(request: middy.Request<APIGatewayProxyEvent, APIGatewayProxyResult>): void {

        // Get the log entry for this request
        const container = (request.event as any).container as Container;
        const logEntry = container.get<LogEntryImpl>(BASETYPES.LogEntry);

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
