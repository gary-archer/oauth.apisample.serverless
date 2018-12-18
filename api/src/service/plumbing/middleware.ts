import {Context} from 'aws-lambda';
import middy from 'middy';
import {cors, ICorsOptions} from 'middy/middlewares';
import {AppConfiguration} from '../../shared/configuration/appConfiguration';
import {requestLoggerMiddleware} from '../../shared/plumbing/requestLoggerMiddleware';
import {exceptionMiddleware} from './exceptionMiddleware';

/*
 * Set up middleware for a normal lambda function
 */
export class Middleware {

    /*
     * Add each common middleware to the supplied operation
     */
    public static apply(operation: any, apiConfig: AppConfiguration): middy.IMiddy {

        const corsConfig = {origins: apiConfig.trustedOrigins};

        return middy(async (event: any, context: Context) => {

            Middleware._deserializeClaims(event);
            return await operation(event, context);
        })
        .use(exceptionMiddleware())
        .use(requestLoggerMiddleware())
        .use(cors(corsConfig));
    }

    /*
     * Deserialize claims received from the API gateway with lambda authorizer results
     */
    private static _deserializeClaims(event: any): void {

        if (!event.requestContext ||
            !event.requestContext.authorizer ||
            !event.requestContext.authorizer.claims) {

            throw new Error('Unable to resolve claims from authorizer');
        }

        if (typeof event.requestContext.authorizer.claims === 'string') {

            // In AWS we receive a serialized object
            event.claims = JSON.parse(event.requestContext.authorizer.claims);
        } else {

            // On a local PC we have an object
            event.claims = event.requestContext.authorizer.claims;
        }
    }
}
