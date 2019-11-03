import middy from 'middy';
import {RequestLogger} from './requestLogger';

/*
 * The middleware coded in a class based manner
 */
class RequestLoggerMiddleware {

    public constructor() {
        this._setupCallbacks();
    }

    /*
     * Create the log object
     */
    public before(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {
        handler.event.log = new RequestLogger();
        next();
    }

    /*
     * Log the request after normal completion
     */
    public after(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {
        handler.event.log.write();
        next();
    }

    /*
     * Log the request after failed completion
     */
    public onError(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {
        handler.event.log.write();
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

/*
 * Do the export plumbing
 */
export function requestLoggerMiddleware(): middy.IMiddyMiddlewareObject {

    const middleware = new RequestLoggerMiddleware();
    return {
        before: middleware.before,
        after: middleware.after,
        onError: middleware.onError,
    };
}
