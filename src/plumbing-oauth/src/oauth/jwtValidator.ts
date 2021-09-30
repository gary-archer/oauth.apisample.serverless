import {inject, injectable} from 'inversify';
import {jwtVerify} from 'jose/jwt/verify';
import {ErrorFactory} from '../../../plumbing-base';
import {ClaimsPayload} from '../claims/claimsPayload';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHTYPES} from '../dependencies/oauthTypes';
import {JwksRetriever} from './jwksRetriever';

/*
 * Validate JWT access tokens in the Serverless API
 */
@injectable()
export class JwtValidator {

    private readonly _configuration: OAuthConfiguration;
    private readonly _jwksRetriever: JwksRetriever;

    public constructor(
        @inject(OAUTHTYPES.Configuration) configuration: OAuthConfiguration,
        @inject(OAUTHTYPES.JwksRetriever) jwksRetriever: JwksRetriever) {

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

            // Log the cause behind 401 errors
            let details = 'JWT verification failed';
            if (e.message) {
                details += ` : ${e.message}`;
            }

            throw ErrorFactory.createClient401Error(details);
        }
    }
}
