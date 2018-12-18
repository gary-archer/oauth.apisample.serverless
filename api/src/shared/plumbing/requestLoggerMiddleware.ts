import middy from 'middy';
import {ApiLogger} from './requestLogger';
import {ErrorHandler} from './errorHandler';

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
        handler.event.log = {};
        handler.event.log.info = [];
        next();
    }

    /*
     * Log the request after normal completion
     */
    public after(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {
        ApiLogger.info(JSON.stringify(handler.event.log));
        next();
    }

    /*
     * Log the request after failed completion
     */
    public onError(handler: middy.IHandlerLambda<any, object>, next: middy.IMiddyNextFunction): any {
        ApiLogger.info(JSON.stringify(handler.event.log));
        next();
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
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
