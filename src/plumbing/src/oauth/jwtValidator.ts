import {inject, injectable} from 'inversify';
import {jwtVerify} from 'jose/jwt/verify';
import {ClaimsPayload} from '../claims/claimsPayload';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {ErrorFactory} from '../errors/errorFactory';
import {ServerError} from '../errors/serverError';
import {JwksRetriever} from './jwksRetriever';

/*
 * Validate JWT access tokens in the Serverless API
 */
@injectable()
export class JwtValidator {

    private readonly _configuration: OAuthConfiguration;
    private readonly _jwksRetriever: JwksRetriever;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration,
        @inject(BASETYPES.JwksRetriever) jwksRetriever: JwksRetriever) {

        this._jwksRetriever = jwksRetriever;
        this._configuration = configuration;
    }

    /*
     * Use the JOSE library to do standard JWT validation
     */
    public async validateToken(accessToken: string): Promise<ClaimsPayload> {

        try {

            // Set standard options
            const options = {
                algorithms: [this._configuration.algorithm],
                issuer: this._configuration.issuer,
                audience: this._configuration.audience,
            };

            // Perform the library validation
            const result = await jwtVerify(accessToken, this._jwksRetriever.getKey, options);
            return new ClaimsPayload(result.payload);

        } catch (e: any) {

            // Handle already caught JWKS download errors
            if (e instanceof ServerError) {
                throw e;
            }

            // Log the cause behind 401 errors
            let details = 'JWT verification failed';
            if (e.message) {
                details += ` : ${e.message}`;
            }

            throw ErrorFactory.createClient401Error(details);
        }
    }
}
