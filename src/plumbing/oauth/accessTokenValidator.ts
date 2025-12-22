import {AxiosError} from 'axios';
import {inject, injectable} from 'inversify';
import {JWTPayload, JWTVerifyOptions, decodeJwt, jwtVerify} from 'jose';
import {ClaimsReader} from '../claims/claimsReader.js';
import {CustomClaimNames} from '../claims/customClaimNames.js';
import {OAuthConfiguration} from '../configuration/oauthConfiguration.js';
import {BASETYPES} from '../dependencies/baseTypes.js';
import {ErrorFactory} from '../errors/errorFactory.js';
import {ErrorUtils} from '../errors/errorUtils.js';
import {JwksRetriever} from './jwksRetriever.js';
import {IdentityLogData} from '../logging/identityLogData.js';
import {LogEntryImpl} from '../logging/logEntryImpl.js';

/*
 * A class to deal with OAuth JWT access token validation
 */
@injectable()
export class AccessTokenValidator {

    private readonly configuration: OAuthConfiguration;
    private readonly logEntry: LogEntryImpl;
    private readonly jwksRetriever: JwksRetriever;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration,
        @inject(BASETYPES.LogEntry) logEntry: LogEntryImpl,
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

        let claims: JWTPayload;
        try {

            // Validate the token and get its claims
            const result = await jwtVerify(accessToken, this.jwksRetriever.getRemoteJWKSet(), options);
            claims = result.payload;

            // Add identity data to logs
            this.logEntry.setIdentityData(this.getIdentityData(claims));

        } catch (e: any) {

            // Handle failures downloading or deserializing token signing public keys
            if (e instanceof AxiosError || e.code === 'ERR_JOSE_GENERIC') {
                throw ErrorUtils.fromSigningKeyDownloadError(e, this.configuration.jwksEndpoint);
            }

            // For expired access tokens, add identity data to logs.
            // Do the same for my expired access token testing, which causes invalid signatures.
            if (e.code === 'ERR_JWT_EXPIRED' || e.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
                claims = decodeJwt(accessToken);
                this.logEntry.setIdentityData(this.getIdentityData(claims));
            }

            // For most errors return 401s
            let details = 'JWT verification failed';
            if (e.code && e.message) {
                details += ` : ${e.code} : ${e.message}`;
            }

            throw ErrorFactory.createClient401Error(details);
        }

        return claims;
    }

    /*
     * Collect identity data to add to logs
     */
    public getIdentityData(claims: JWTPayload): IdentityLogData {

        return {
            userId: ClaimsReader.getStringClaim(claims, 'sub', false),
            sessionId: ClaimsReader.getStringClaim(claims, this.configuration.sessionIdClaimName, false),
            clientId: ClaimsReader.getStringClaim(claims, 'client_id', false),
            scope: ClaimsReader.getStringClaim(claims, 'scope', false),
            claims: {
                managerId: ClaimsReader.getStringClaim(claims, CustomClaimNames.managerId, false),
                role: ClaimsReader.getStringClaim(claims, CustomClaimNames.role, false),
            },
        };
    }
}
