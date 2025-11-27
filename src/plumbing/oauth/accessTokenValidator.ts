import {AxiosError} from 'axios';
import {inject, injectable} from 'inversify';
import {JWTPayload, JWTVerifyOptions, jwtVerify} from 'jose';
import {OAuthConfiguration} from '../configuration/oauthConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {ErrorFactory} from '../errors/errorFactory.js';
import {ErrorUtils} from '../errors/errorUtils.js';
import {JwksRetriever} from './jwksRetriever.js';
import {LogEntry} from '../logging/logEntry.js';

/*
 * A class to deal with OAuth JWT access token validation
 */
@injectable()
export class AccessTokenValidator {

    private readonly configuration: OAuthConfiguration;
    private readonly logEntry: LogEntry;
    private readonly jwksRetriever: JwksRetriever;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration,
        @inject(BASETYPES.LogEntry) logEntry: LogEntry,
        @inject(BASETYPES.JwksRetriever) jwksRetriever: JwksRetriever) {

        this.configuration = configuration;
        this.logEntry = logEntry;
        this.jwksRetriever = jwksRetriever;
    }

    /*
     * Do the work of performing token validation via the injected class
     */
    /* eslint-disable @typescript-eslint/no-unused-vars */
    public async execute(accessToken: string): Promise<JWTPayload> {

        using breakdown = this.logEntry.createPerformanceBreakdown('tokenValidator');

        const options = {
            algorithms: [this.configuration.algorithm],
            issuer: this.configuration.issuer,
        } as JWTVerifyOptions;

        // Allow for AWS Cognito, which does not include an audience claim in access tokens
        if (this.configuration.audience) {
            options.audience = this.configuration.audience;
        }

        // Validate the token and get its claims
        let claims: JWTPayload;
        try {

            const result = await jwtVerify(accessToken, this.jwksRetriever.getRemoteJWKSet(), options);
            claims = result.payload;

        } catch (e: any) {

            // Handle failures downloading or deserializing token signing public keys
            if (e instanceof AxiosError || e.code === 'ERR_JOSE_GENERIC') {
                throw ErrorUtils.fromSigningKeyDownloadError(e, this.configuration.jwksEndpoint);
            }

            // Otherwise return a 401 error, such as when a JWT with an invalid 'kid' value is supplied
            let details = 'JWT verification failed';
            if (e.message) {
                details += ` : ${e.message}`;
            }

            throw ErrorFactory.createClient401Error(details);
        }

        return claims;
    }
}
