import {Context} from 'aws-lambda';
import middy from 'middy';
import {cors, ICorsOptions} from 'middy/middlewares';
import {Configuration} from '../configuration/configuration';
import {AuthorizationMicroservice} from '../logic/authorizationMicroservice';
import {exceptionMiddleware} from './exceptionMiddleware';

/*
 * Set up middleware
 */
export class MiddlewareHelper {

    private _apiConfig: Configuration;
    private _authorizationMicroservice: AuthorizationMicroservice;
    private _corsConfig: ICorsOptions;

    /*
     * Receive dependencies
     */
    public constructor(apiConfig: Configuration, authorizationMicroservice: AuthorizationMicroservice) {
        this._apiConfig = apiConfig;
        this._authorizationMicroservice = authorizationMicroservice;
        this._corsConfig = {origins: apiConfig.app.trustedOrigins};
    }

    /*
     * Add cross cutting concerns to enrich the API operation
     * Middy works by always calling all middlewares, including the main operation
     */
    public enrichAuthOperation(operation: any): middy.IMiddy {

        return middy(async (event: any, context: Context) => {

            // Do the authorization which will set claims on the event
            return await operation(event, context);
        })
        .use(cors(this._corsConfig))
        .use(exceptionMiddleware());
    }

    /*
     * Add cross cutting concerns to enrich the API operation
     * Middy works by always calling all middlewares, including the main operation
     */
    public enrichApiOperation(operation: any): middy.IMiddy {

        return middy(async (event: any, context: Context) => {

            // TODO - remove once stable
            console.log('*** DEBUG OPERATION REQUEST CONTEXT');
            console.log(event.requestContext);

            // Only call the business entry point if authorization succeeded
            if (!event.requestContext ||
                !event.requestContext.authorizer ||
                !event.requestContext.authorizer.claims) {

                throw new Error('Unable to resolve claims from authorizer');
            }

            return await operation(event, context);

        })
        .use(cors(this._corsConfig))
        .use(exceptionMiddleware());
    }
}
