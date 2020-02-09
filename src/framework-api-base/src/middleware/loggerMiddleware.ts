import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {BASEFRAMEWORKTYPES} from '../../../framework-base';
import {LogEntryImpl} from '../logging/logEntryImpl';
import {LoggerFactoryImpl} from '../logging/loggerFactoryImpl';
import {ContainerHelper} from '../utilities/containerHelper';

/*
 * The middleware coded in a class based manner
 */
export class LoggerMiddleware implements MiddlewareObject<any, any> {

    private readonly _loggerFactory: LoggerFactoryImpl;

    public constructor(loggerFactory: LoggerFactoryImpl) {
        this._loggerFactory = loggerFactory;
        this._setupCallbacks();
    }

    /*
     * Start logging when a request begins
     */
    public before(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Create the log entry for the current request
        const logEntry = this._loggerFactory.createLogEntry();

        // Bind it to the container
        const container = ContainerHelper.current(handler.event);
        container.bind<LogEntryImpl>(BASEFRAMEWORKTYPES.LogEntry).toConstantValue(logEntry);

        // Start request logging
        logEntry.start(handler.event, handler.context);
        next();
    }

    /*
     * Finish logging after normal completion
     */
    public after(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Get the log entry
        const container = ContainerHelper.current(handler.event);
        const logEntry = container.get<LogEntryImpl>(BASEFRAMEWORKTYPES.LogEntry);

        // End logging
        logEntry.end(handler.response);
        logEntry.write(handler.event);

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
