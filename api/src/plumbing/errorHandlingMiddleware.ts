import {IHandlerLambda} from 'middy';
import {Configuration} from '../configuration/configuration';
import {ApiLogger} from './apiLogger';

/*
 * The middleware coded in a class based manner
 */
class ErrorHandlingMiddleware {

    private _apiConfig: Configuration;

    public constructor(apiConfig: Configuration) {
        this._apiConfig = apiConfig;
        this.onError = this.onError.bind(this);
  }

    public onError(handler: IHandlerLambda<any, any>, next: any) {
        handler.response = {
            statusCode: 500,
            body: JSON.stringify(handler.error.message),
        };

        // TODO: Error objects - including 403
        // Also do a response writer class

        return next();
    }
}

/*
 * Do the export plumbing
 */
export const errorHandlingMiddleware = (config: Configuration) => {
    const middleware = new ErrorHandlingMiddleware(config);
    return ({
        onError: middleware.onError,
    });
};
