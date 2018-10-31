import {ApiLogger} from './apiLogger';

/*
 * Custom middleware for error handling
 */
export const errorHandlingMiddleware = (config: any) => {

    return ({
      onError: (handler: any, next: any) => {
        ApiLogger.info('ErrorMiddleware', 'error');
        ApiLogger.info('ErrorMiddleware', handler.error);
      },
    });
};
