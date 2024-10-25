import middy from '@middy/core';
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {Container} from 'inversify';
import {ClaimsPrincipal} from '../claims/claimsPrincipal.js';
import {ClaimsReader} from '../claims/claimsReader.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {ClientError} from '../errors/clientError.js';
import {LogEntryImpl} from '../logging/logEntryImpl.js';
import {OAuthFilter} from '../oauth/oauthFilter.js';

/*
 * A middleware class as the entry point for OAuth authorization
 */
export class AuthorizerMiddleware implements middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> {

    private readonly container: Container;

    public constructor(container: Container) {
        this.container = container;
        this.setupCallbacks();
    }

    /*
     * The entry point does the OAuth work as well as AWS specific processing
     */
    public async before(request: middy.Request<APIGatewayProxyEvent, APIGatewayProxyResult>): Promise<void> {

        const logEntry = this.container.get<LogEntryImpl>(BASETYPES.LogEntry);
        try {

            // Get the filter and call it to do the work and return claims
            const filter =  this.container.get<OAuthFilter>(BASETYPES.OAuthFilter);
            const claimsPrincipal = await filter.execute(request.event);

            // Include identity details in logs as soon as we have them
            logEntry.setIdentity(ClaimsReader.getStringClaim(claimsPrincipal.jwt, 'sub'));

            // Make claims injectable
            this.container.rebind<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal).toConstantValue(claimsPrincipal);

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

    /*
     * Set up async callbacks
     */
    private setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
