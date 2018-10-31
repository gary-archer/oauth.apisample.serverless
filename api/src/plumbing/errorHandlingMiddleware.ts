import {IHandlerLambda} from 'middy';
import {Configuration} from '../configuration/configuration';
import {ApiLogger} from './apiLogger';

/*
 * Custom middleware for error handling
 */
export const errorHandlingMiddleware = (config: Configuration) => {

    return ({
      onError: (handler: IHandlerLambda<any, any>, next: any) => {
        ApiLogger.info('ErrorMiddleware', handler.error);
      },
    });
};
