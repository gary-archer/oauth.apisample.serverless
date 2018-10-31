import {IHandlerLambda} from 'middy';
import {Configuration} from '../configuration/configuration';
import {ApiLogger} from './apiLogger';

/*
 * Custom middleware for error handling
 */
export const errorHandlingMiddleware = (config: Configuration) => {

    return ({
      onError: (handler: IHandlerLambda<any, any>, next: any) => {

        handler.response = {
            statusCode: 500,
            body: JSON.stringify(handler.error.message),
        };

        // TODO: Handle errors as objects
        return next();
      },
    });
};
