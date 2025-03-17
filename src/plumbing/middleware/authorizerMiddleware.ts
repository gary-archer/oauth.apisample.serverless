import middy from '@middy/core';
import {APIGatewayProxyResult} from 'aws-lambda';
import {ClaimsPrincipal} from '../claims/claimsPrincipal.js';
import {ClaimsReader} from '../claims/claimsReader.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {ClientError} from '../errors/clientError.js';
import {LogEntryImpl} from '../logging/logEntryImpl.js';
import {OAuthFilter} from '../oauth/oauthFilter.js';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent.js';

/*
 * A middleware class as the entry point for OAuth authorization
 */
export class AuthorizerMiddleware implements middy.MiddlewareObj<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> {

    /*
     * The entry point does the OAuth work as well as AWS specific processing
     */
    public async before(request: middy.Request<APIGatewayProxyExtendedEvent, APIGatewayProxyResult>): Promise<void> {

        // Get the log entry for this request
        const logEntry = request.event.container.get<LogEntryImpl>(BASETYPES.LogEntry);

        try {

            // Get the filter and call it to do the work and return claims
            const filter =  request.event.container.get<OAuthFilter>(BASETYPES.OAuthFilter);
            const claimsPrincipal = await filter.execute(request.event);

            // Include identity details in logs as soon as we have them
            logEntry.setIdentity(ClaimsReader.getStringClaim(claimsPrincipal.jwt, 'sub'));

            // Bind it to make claims injectable
            request.event.container.bind<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal).toConstantValue(claimsPrincipal);

        } catch (e) {

            // Log the cause of any 401 errors
            if (e instanceof ClientError) {

                logEntry.setClientError(e);
                logEntry.setResponseStatus(401);
            }

            // Rethrow the error
            throw e;
        }

        // For async middleware, middy calls next for us, so do not call it here
    }
}
