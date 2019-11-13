import {Container} from 'inversify';
import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {BASEFRAMEWORKTYPES} from '../../framework-base';
import {LogEntryImpl} from './logEntryImpl';

/*
 * The middleware coded in a class based manner
 */
export class RequestLoggerMiddleware implements MiddlewareObject<any, any> {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
        this._setupCallbacks();
    }

    /*
     * Create the log object
     */
    public before(handler: HandlerLambda<any, any>, next: NextFunction): void {

        // Create the log entry for this request
        const logEntry = this._container.get<LogEntryImpl>(BASEFRAMEWORKTYPES.LogEntry);

        // Start logging
        handler.event.log = logEntry;
        handler.event.log.start();
        next();
    }

    /*
     * Log the request after normal completion
     */
    public after(handler: HandlerLambda<any, any>, next: NextFunction): void {
        handler.event.log.end();
        next();
    }

    /*
     * Log the request after failed completion
     */
    public onError(handler: HandlerLambda<any, any>, next: NextFunction): void {
        handler.event.log.end();
        next();
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
        this.after = this.after.bind(this);
        this.onError = this.onError.bind(this);
    }
}
