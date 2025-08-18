import middy from '@middy/core';
import {APIGatewayProxyResult} from 'aws-lambda';
import {ClaimsPrincipal} from '../claims/claimsPrincipal.js';
import {ClaimsReader} from '../claims/claimsReader.js';
import {CustomClaimNames} from '../claims/customClaimNames.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {BaseErrorCodes} from '../errors/baseErrorCodes.js';
import {ErrorFactory} from '../errors/errorFactory.js';
import {LogEntryImpl} from '../logging/logEntryImpl.js';
import {OAuthFilter} from '../oauth/oauthFilter.js';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent.js';

/*
 * A middleware class as the entry point for OAuth authorization
 */
export class AuthorizerMiddleware implements middy.MiddlewareObj<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> {

    private readonly requiredScope: string;

    public constructor(requiredScope: string) {
        this.requiredScope = requiredScope;
        this.before = this.before.bind(this);
    }

    /*
     * The entry point does the OAuth work as well as AWS specific processing
     */
    public async before(request: middy.Request<APIGatewayProxyExtendedEvent, APIGatewayProxyResult>): Promise<void> {

        // Get the log entry for this request
        const logEntry = request.event.container.get<LogEntryImpl>(BASETYPES.LogEntry);

        // Get the filter and call it to do the work and return claims
        const filter =  request.event.container.get<OAuthFilter>(BASETYPES.OAuthFilter);
        const claimsPrincipal = await filter.execute(request.event);

        // Include selected token details in audit logs
        const userId = ClaimsReader.getStringClaim(claimsPrincipal.getJwt(), 'sub');
        const scope = ClaimsReader.getStringClaim(claimsPrincipal.getJwt(), 'scope');
        const loggedClaims = {
            managerId: ClaimsReader.getStringClaim(claimsPrincipal.getJwt(), CustomClaimNames.managerId),
            role: ClaimsReader.getStringClaim(claimsPrincipal.getJwt(), CustomClaimNames.role),
        };
        logEntry.setIdentity(userId, scope.split(' '), loggedClaims);

        // Bind claims to make them injectable
        request.event.container.bind<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal).toConstantValue(claimsPrincipal);

        // The sample API requires the same scope for all endpoints, so enforce it here
        // In AWS this is a URL value of the form https://api.authsamples.com/investments
        const scopes = ClaimsReader.getStringClaim(claimsPrincipal.getJwt(), 'scope').split(' ');
        if (scopes.indexOf(this.requiredScope) === -1) {

            throw ErrorFactory.createClientError(
                403,
                BaseErrorCodes.insufficientScope,
                'The token does not contain sufficient scope for this API');
        }

        // For async middleware, middy calls next for us, so do not call it here
    }
}
