import {Context} from 'aws-lambda';
import middy from 'middy';
import {customHeaderMiddleware} from '../../shared/plumbing/customHeaderMiddleware';
import {exceptionMiddleware} from '../../shared/plumbing/exceptionMiddleware';
import {requestLoggerMiddleware} from '../../shared/plumbing/requestLoggerMiddleware';

/*
 * Set up middleware for the lambda authorizer
 */
export class Middleware {

    public static apply(operation: any): middy.IMiddy {

        return middy(async (event: any, context: Context) => {
            return await operation(event, context);
        })
        .use(exceptionMiddleware())
        .use(requestLoggerMiddleware())
        .use(customHeaderMiddleware('authorizer'));
    }
}
