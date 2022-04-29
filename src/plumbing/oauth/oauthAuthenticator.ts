import axios, {AxiosRequestConfig} from 'axios';
import {inject, injectable} from 'inversify';
import {jwtVerify} from 'jose';
import {BaseClaims} from '../claims/baseClaims';
import {ClaimsReader} from '../claims/claimsReader';
import {UserInfoClaims} from '../claims/userInfoClaims';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {ErrorFactory} from '../errors/errorFactory';
import {ErrorUtils} from '../errors/errorUtils';
import {ServerError} from '../errors/serverError';
import {LogEntry} from '../logging/logEntry';
import {HttpProxy} from '../utilities/httpProxy';
import {using} from '../utilities/using';
import {JwksRetriever} from './jwksRetriever';

/*
 * A class to manage the calls to the Authorization Server
 */
@injectable()
export class OAuthAuthenticator {

    private readonly _configuration: OAuthConfiguration;
    private readonly _jwksRetriever: JwksRetriever;
    private readonly _logEntry: LogEntry;
    private readonly _httpProxy: HttpProxy;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration,
        @inject(BASETYPES.JwksRetriever) jwksRetriever: JwksRetriever,
        @inject(BASETYPES.LogEntry) logEntry: LogEntry,
        @inject(BASETYPES.HttpProxy) httpProxy: HttpProxy) {

        this._configuration = configuration;
        this._jwksRetriever = jwksRetriever;
        this._logEntry = logEntry;
        this._httpProxy = httpProxy;
        this._setupCallbacks();
    }

    /*
     * Do the work of performing token validation via the injected class
     */
    public async validateToken(accessToken: string): Promise<BaseClaims> {

        return using(this._logEntry.createPerformanceBreakdown('validateToken'), async () => {

            try {

                // Set standard options
                const options = {
                    algorithms: ['RS256'],
                    issuer: this._configuration.issuer,
                    audience: this._configuration.audience,
                };

                // Perform the library validation
                const result = await jwtVerify(accessToken, this._jwksRetriever.getKey, options);
                return ClaimsReader.baseClaims(result.payload);

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
        });
    }

    /*
     * Get stored access token claims not in the JWT from the user info endpoint
     */
    public async getUserInfo(accessToken: string): Promise<UserInfoClaims> {

        return using(this._logEntry.createPerformanceBreakdown('userInfoLookup'), async () => {

            try {

                const options = {
                    url: this._configuration.userInfoEndpoint,
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    httpsAgent: this._httpProxy.agent,
                };

                const authServerResponse = await axios.request(options as AxiosRequestConfig);
                return ClaimsReader.userInfoClaims(authServerResponse.data);

            } catch (e) {

                throw ErrorUtils.fromUserInfoError(e, this._configuration.userInfoEndpoint);
            }
        });
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.validateToken = this.validateToken.bind(this);
        this.getUserInfo = this.getUserInfo.bind(this);
    }
}
