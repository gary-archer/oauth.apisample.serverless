import {Context} from 'aws-lambda';
import {CoreApiClaims} from '../security/coreApiClaims';

/*
 * A simple authorizer to extract claims from the request context
 */
export class RequestContextAuthorizer {

    /*
     * Execute the simple logic to return claims
     */
    public execute(event: any, context: Context): CoreApiClaims {

        if (!event.requestContext ||
            !event.requestContext.authorizer ||
            !event.requestContext.authorizer.claims) {

            throw new Error('Unable to resolve authorizer claims from request context');
        }

        if (typeof event.requestContext.authorizer.claims === 'string') {

            // In AWS we receive a serialized object
            return JSON.parse(event.requestContext.authorizer.claims);
        } else {

            // On a local PC we have an object
            return event.requestContext.authorizer.claims;
        }
    }
}
