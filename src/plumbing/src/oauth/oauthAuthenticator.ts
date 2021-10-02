import axios, {AxiosRequestConfig} from 'axios';
import {inject, injectable} from 'inversify';
import {ClaimsPayload} from '../claims/claimsPayload';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {BASETYPES} from '../dependencies/baseTypes';
import {ErrorUtils} from '../errors/errorUtils';
import {LogEntry} from '../logging/logEntry';
import {HttpProxy} from '../utilities/httpProxy';
import {using} from '../utilities/using';
import {JwtValidator} from './jwtValidator';

/*
 * A class to manage the calls to the Authorization Server
 */
@injectable()
export class OAuthAuthenticator {

    private readonly _configuration: OAuthConfiguration;
    private readonly _tokenValidator: JwtValidator;
    private readonly _logEntry: LogEntry;
    private readonly _httpProxy: HttpProxy;

    public constructor(
        @inject(BASETYPES.OAuthConfiguration) configuration: OAuthConfiguration,
        @inject(BASETYPES.JwtValidator) tokenValidator: JwtValidator,
        @inject(BASETYPES.LogEntry) logEntry: LogEntry,
        @inject(BASETYPES.HttpProxy) httpProxy: HttpProxy) {

        this._configuration = configuration;
        this._tokenValidator = tokenValidator;
        this._logEntry = logEntry;
        this._httpProxy = httpProxy;
        this._setupCallbacks();
    }

    /*
     * Do the work of performing token validation via the injected class
     */
    public async validateToken(accessToken: string): Promise<ClaimsPayload> {

        return using(this._logEntry.createPerformanceBreakdown('validateToken'), async () => {
            return this._tokenValidator.validateToken(accessToken);
        });
    }

    /*
     * Get stored access token claims not in the JWT from the user info endpoint
     */
    public async getUserInfo(accessToken: string): Promise<ClaimsPayload> {

        return using(this._logEntry.createPerformanceBreakdown('userInfoLookup'), async () => {

            try {

                const options = {
                    url: this._configuration.userInfoEndpoint,
                    method: 'POST',
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                        'accept': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    httpsAgent: this._httpProxy.agent,
                };

                const authServerResponse = await axios.request(options as AxiosRequestConfig);
                const userInfo = authServerResponse.data;
                return new ClaimsPayload(userInfo);

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
