import middy from '@middy/core';
import {Container} from 'inversify';
import {BASETYPES} from '../dependencies/baseTypes';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';

/*
 * The middleware coded in a class based manner
 */
export class LoggerMiddleware implements middy.MiddlewareObject<any, any> {

    private readonly _container: Container;
    private readonly _loggerFactory: LoggerFactoryImpl;

    public constructor(container: Container, loggerFactory: LoggerFactoryImpl) {
        this._container = container;
        this._loggerFactory = loggerFactory;
        this._setupCallbacks();
    }

    /*
     * Start logging when a request begins
     */
    public before(handler: middy.HandlerLambda<any, any>, next: middy.NextFunction): void {

        // Create the log entry for the current request
        const logEntry = this._loggerFactory.createLogEntry();

        // Bind it to the container
        this._container.rebind<LogEntryImpl>(BASETYPES.LogEntry).toConstantValue(logEntry);

        // Start request logging
        logEntry.start(handler.event, handler.context);
        next();
    }

    /*
     * Finish logging after normal completion
     */
    public after(handler: middy.HandlerLambda<any, any>, next: middy.NextFunction): void {

        // Get the log entry
        const logEntry = this._container.get<LogEntryImpl>(BASETYPES.LogEntry);

        // End logging
        if (handler.response && handler.response.statusCode) {
            logEntry.setResponseStatus(handler.response.statusCode);
        }
        logEntry.end();
        logEntry.write();

        // Move to next
        next();
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
        this.after = this.after.bind(this);
    }
}
