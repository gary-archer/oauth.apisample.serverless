import middy from '@middy/core';
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {createHash} from 'crypto';
import {Container} from 'inversify';
import {Cache} from '../cache/cache.js';
import {ClaimsPrincipal} from '../claims/claimsPrincipal.js';
import {CustomClaimsProvider} from '../claims/customClaimsProvider.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {ClientError} from '../errors/clientError.js';
import {ErrorFactory} from '../errors/errorFactory.js';
import {LogEntryImpl} from '../logging/logEntryImpl.js';
import {AccessTokenValidator} from './accessTokenValidator.js';

/*
 * A middleware for OAuth handling, which does token processing and custom claims handling
 */
export class OAuthAuthorizer implements middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> {

    private readonly _container: Container;
    private readonly _customClaimsProvider: CustomClaimsProvider;
    private readonly _cache: Cache;

    public constructor(
        container: Container,
        customClaimsProvider: CustomClaimsProvider,
        cache: Cache) {

        this._container = container;
        this._customClaimsProvider = customClaimsProvider;
        this._cache = cache;
        this._setupCallbacks();
    }

    /*
     * The entry point does the OAuth work as well as AWS specific processing
     */
    public async before(request: middy.Request<APIGatewayProxyEvent, APIGatewayProxyResult>): Promise<void> {

        const logEntry = this._container.get<LogEntryImpl>(BASETYPES.LogEntry);
        try {

            // Ask the authorizer to do the work and return claims
            const claims = await this._execute(request.event);

            // Include identity details in logs as soon as we have them
            logEntry.setIdentity(claims.subject);

            // Make claims injectable
            this._container.rebind<ClaimsPrincipal>(BASETYPES.ClaimsPrincipal).toConstantValue(claims);

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
     * Do the token validation and claims lookup
     */
    private async _execute(event: APIGatewayProxyEvent): Promise<ClaimsPrincipal> {

        // First get the access token from the incoming request
        const accessToken = this._readAccessToken(event);

        // On every lambda HTTP request we validate the JWT, in a zero trust manner
        const tokenValidator = this._container.get<AccessTokenValidator>(BASETYPES.AccessTokenValidator);
        const tokenClaims = await tokenValidator.execute(accessToken);

        // If cached results exist for other claims then return them
        const accessTokenHash = createHash('sha256').update(accessToken).digest('hex');
        let customClaims = await this._cache.getExtraUserClaims(accessTokenHash);
        if (customClaims) {
            return new ClaimsPrincipal(tokenClaims, customClaims);
        }

        // Otherwise look up custom claims
        customClaims = await this._customClaimsProvider.lookupForNewAccessToken(accessToken, tokenClaims);

        // Cache the extra claims for subsequent requests with the same access token
        await this._cache.setExtraUserClaims(accessTokenHash, customClaims!);

        // Return the final claims
        return new ClaimsPrincipal(tokenClaims, customClaims!);
    }

    /*
     * Try to read the token from the authorization header
     */
    public _readAccessToken(event: APIGatewayProxyEvent): string {

        // First look for a bearer token
        if (event && event.headers) {

            const authorizationHeader = event.headers.authorization || event.headers.Authorization;
            if (authorizationHeader) {
                const parts = authorizationHeader.split(' ');
                if (parts.length === 2 && parts[0] === 'Bearer') {
                    return parts[1];
                }
            }
        }

        throw ErrorFactory.createClient401Error('No access token was found in an API request');
    }

    /*
     * Set up async callbacks
     */
    private _setupCallbacks(): void {
        this.before = this.before.bind(this);
    }
}
