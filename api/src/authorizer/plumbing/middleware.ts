import {Context} from 'aws-lambda';
import middy from 'middy';
import {requestLoggerMiddleware} from '../../shared/plumbing/requestLoggerMiddleware';
import {exceptionMiddleware} from './exceptionMiddleware';

/*
 * Set up middleware for the lambda authorizer
 */
export class Middleware {

    public static apply(operation: any): middy.IMiddy {

        return middy(async (event: any, context: Context) => {
            return await operation(event, context);
        })
        .use(exceptionMiddleware())
        .use(requestLoggerMiddleware());
    }
}
