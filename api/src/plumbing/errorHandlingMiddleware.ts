import {IHandlerLambda} from 'middy';
import {Configuration} from '../configuration/configuration';
import {ErrorHandler} from './errorHandler';

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

        const serverError = ErrorHandler.fromException(handler.error);
        const [statusCode, clientError] = ErrorHandler.handleError(serverError);

        handler.response = {
            statusCode,
            body: JSON.stringify(clientError),
        };

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
