import {Context} from 'aws-lambda';
import {injectable} from 'inversify';
import {CoreApiClaims} from '../security/coreApiClaims';

/*
 * A simple authorizer to extract claims from the request context
 */
@injectable()
export class RequestContextAuthenticator {

    /*
     * Read claims passed into the request context as a result of the previously returned policy document
     */
    public authorizeRequestAndGetClaims(event: any, context: Context): CoreApiClaims {

        if (!event.requestContext ||
            !event.requestContext.authorizer ||
            !event.requestContext.authorizer.claims) {

            throw new Error('Unable to resolve authorizer claims from request context');
        }

        if (typeof event.requestContext.authorizer.claims === 'string') {

            // In AWS we receive a serialized object
            return JSON.parse(event.requestContext.authorizer.claims);

        } else {

            // On a local PC we have configured an object in our test/*.json files
            return event.requestContext.authorizer.claims;
        }
    }
}
