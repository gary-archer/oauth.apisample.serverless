import {inject, injectable} from 'inversify';
import {JWTPayload, JWTVerifyOptions, jwtVerify} from 'jose';
import {ClaimsReader} from '../claims/claimsReader.js';
import {OAuthConfiguration} from '../configuration/oauthConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {BaseErrorCodes} from '../errors/baseErrorCodes.js';
import {ErrorFactory} from '../errors/errorFactory.js';
import {ErrorUtils} from '../errors/errorUtils.js';
import {JwksRetriever} from './jwksRetriever.js';
import {LogEntry} from '../logging/logEntry.js';
import {using} from '../utilities/using.js';

/*
 * A class to deal with OAuth JWT access token validation
 */
@injectable()
export class AccessTokenValidator {

    private readonly _configuration: OAuthConfiguration;
    private readonly _logEntry: LogEntry;
    private readonly _jwksRetriever: JwksRetriever;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration,
        @inject(BASETYPES.LogEntry) logEntry: LogEntry,
        @inject(BASETYPES.JwksRetriever) jwksRetriever: JwksRetriever) {

        this._configuration = configuration;
        this._logEntry = logEntry;
        this._jwksRetriever = jwksRetriever;
    }

    /*
     * Do the work of performing token validation via the injected class
     */
    public async execute(accessToken: string): Promise<JWTPayload> {

        return using(this._logEntry.createPerformanceBreakdown('tokenValidator'), async () => {

            const options = {
                algorithms: [this._configuration.algorithm],
                issuer: this._configuration.issuer,
            } as JWTVerifyOptions;

            // Allow for AWS Cognito, which does not include an audience claim in access tokens
            if (this._configuration.audience) {
                options.audience = this._configuration.audience;
            }

            // Validate the token and get its claims
            let claims: JWTPayload;
            try {

                const result = await jwtVerify(accessToken, this._jwksRetriever.getKey, options);
                claims = result.payload;

            } catch (e: any) {

                // JWKS URI connection failures return a 500
                if (e.code === 'ERR_JOSE_GENERIC' || e.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
                    throw ErrorUtils.fromSigningKeyDownloadError(e, this._configuration.jwksEndpoint);
                }

                // Otherwise return a 401 error, such as when a JWT with an invalid 'kid' value is supplied
                let details = 'JWT verification failed';
                if (e.message) {
                    details += ` : ${e.message}`;
                }

                throw ErrorFactory.createClient401Error(details);
            }

            // The sample API requires the same scope for all endpoints, and it is enforced here
            const scopes = ClaimsReader.getStringClaim(claims, 'scope').split(' ');
            if (scopes.indexOf(this._configuration.scope) === -1) {

                throw ErrorFactory.createClientError(
                    403,
                    BaseErrorCodes.insufficientScope,
                    'The token does not contain sufficient scope for this API');
            }

            return claims;
        });
    }
}
