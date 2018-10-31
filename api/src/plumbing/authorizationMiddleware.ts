import {APIGatewayEvent, Context} from 'aws-lambda';
import {ApiLogger} from './apiLogger';

/*
 * Custom middleware for authorization
 */
export const authorizationMiddleware = (config: any) => {

    return ({
      before: (handler: any, next: any) => {

        ApiLogger.info('AuthorizationMiddleware', 'before');
        return next();
      },
    });
};
