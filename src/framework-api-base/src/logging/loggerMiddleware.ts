import {HandlerLambda, MiddlewareObject, NextFunction} from 'middy';
import {LogEntryImpl} from './logEntryImpl';

/*
 * The middleware coded in a class based manner
 */
export class LoggerMiddleware implements MiddlewareObject<any, any> {

    private readonly _logEntry: LogEntryImpl;

    public constructor(logEntry: LogEntryImpl) {
        this._logEntry = logEntry;
        this._setupCallbacks();
    }

    /*
     * Start logging when a request begins
     */
    public before(handler: HandlerLambda<any, any>, next: NextFunction): void {

        this._logEntry.start(handler.event, handler.context);
        next();
    }

    /*
     * Finish logging after normal completion
     */
    public after(handler: HandlerLambda<any, any>, next: NextFunction): void {

        this._logEntry.end(handler.event, handler.context);
        this._logEntry.write();
        next();
    }

    /*
     * Finish logging after failed completion
     */
    public onError(handler: HandlerLambda<any, any>, next: NextFunction): void {

        this._logEntry.end(handler.event, handler.context);
        this._logEntry.write();
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
