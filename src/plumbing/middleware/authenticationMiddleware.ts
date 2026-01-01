import middy from '@middy/core';
import {APIGatewayProxyResult} from 'aws-lambda';
import {ClaimsPrincipal} from '../claims/claimsPrincipal';
import {ClaimsReader} from '../claims/claimsReader';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {BaseErrorCodes} from '../errors/baseErrorCodes';
import {ErrorFactory} from '../errors/errorFactory';
import {OAuthFilter} from '../oauth/oauthFilter';
import {APIGatewayProxyExtendedEvent} from '../utilities/apiGatewayExtendedProxyEvent';

/*
 * A custom authentication filter to take finer control over processing of tokens and claims
 */
export class AuthenticationMiddleware implements
    middy.MiddlewareObj<APIGatewayProxyExtendedEvent, APIGatewayProxyResult> {

    private readonly configuration: OAuthConfiguration;

    public constructor(configuration: OAuthConfiguration) {
        this.configuration = configuration;
        this.before = this.before.bind(this);
    }

    /*
     * Do the main work to process tokens, claims and log identity details
     */
    public async before(request: middy.Request<APIGatewayProxyExtendedEvent, APIGatewayProxyResult>): Promise<void> {

        // Get the filter and call it to do the work and return claims
        const filter =  request.event.container.get<OAuthFilter>(BASETYPES.OAuthFilter);
        const claimsPrincipal = await filter.execute(request.event);

        // Bind claims to make them injectable
        request.event.container.bind<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal).toConstantValue(claimsPrincipal);

        // The sample API requires the same scope for all endpoints, so enforce it here
        // In AWS this is a URL value of the form https://api.authsamples.com/investments
        const scopes = ClaimsReader.getStringClaim(claimsPrincipal.getJwt(), 'scope').split(' ');
        if (scopes.indexOf(this.configuration.scope) === -1) {

            throw ErrorFactory.createClientError(
                403,
                BaseErrorCodes.insufficientScope,
                'The token does not contain sufficient scope for this API');
        }

        // For async middleware, middy calls next for us, so do not call it here
    }
}
