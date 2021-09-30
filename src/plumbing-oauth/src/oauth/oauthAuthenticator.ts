import {inject, injectable} from 'inversify';
import {custom, Issuer} from 'openid-client';
import {BASETYPES, HttpProxy, LogEntry, using} from '../../../plumbing-base';
import {ClaimsPayload} from '../claims/claimsPayload';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHTYPES} from '../dependencies/oauthTypes';
import {OAuthErrorUtils} from '../errors/oauthErrorUtils';
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
        @inject(OAUTHTYPES.Configuration) configuration: OAuthConfiguration,
        @inject(OAUTHTYPES.JwtValidator) tokenValidator: JwtValidator,
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

            const issuer = new Issuer({
                issuer: this._configuration.issuer,
                userinfo_endpoint: this._configuration.userInfoEndpoint,
            });

            const client = new issuer.Client({
                client_id: 'dummy',
            });
            client[custom.http_options] = this._httpProxy.agent;

            try {

                const data = await client.userinfo(accessToken);
                return new ClaimsPayload(data);

            } catch (e) {

                throw OAuthErrorUtils.fromUserInfoError(e, this._configuration.userInfoEndpoint);
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
