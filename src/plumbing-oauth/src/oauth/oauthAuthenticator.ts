import {inject, injectable} from 'inversify';
import jsonwebtoken from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import {Client, custom, Issuer} from 'openid-client';
import {BASETYPES,
        CoreApiClaims,
        DebugProxyAgent,
        ErrorFactory,
        LogEntry,
        using} from '../../../plumbing-base';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {OAuthErrorUtils} from '../errors/oauthErrorUtils';

/*
 * A class to manage the calls to the Authorization Server
 */
@injectable()
export class OAuthAuthenticator {

    private readonly _configuration: OAuthConfiguration;
    private readonly _logEntry: LogEntry;
    private _issuer: Issuer<Client> | null;

    /*
     * Receive configuration and request metadata
     */
    public constructor(
        @inject(OAUTHINTERNALTYPES.Configuration) configuration: OAuthConfiguration,
        @inject(BASETYPES.LogEntry) logEntry: LogEntry) {

        this._configuration = configuration;
        this._logEntry = logEntry;
        this._issuer = null;
        this._setupCallbacks();

        // Set up OAuth HTTP requests and extend the default 1.5 second timeout
        custom.setHttpOptionsDefaults({
            timeout: 10000,
            agent: DebugProxyAgent.get(),
        });
    }

    /*
     * When we receive a new token, validate it and return token claims
     */
    public async authenticateAndSetClaims(accessToken: string, claims: CoreApiClaims): Promise<void> {

        // First load metadata
        await this._loadMetadata();

        // First decoode the token without verifying it so that we get the key identifier
        const decoded = jsonwebtoken.decode(accessToken, {complete: true}) as any;
        if (!decoded) {

            // Indicate an invalid token if we cannot decode it
            throw ErrorFactory.create401Error('Unable to decode received JWT');
        }

        // Get the key identifier from the JWT header
        const keyIdentifier = decoded.header.kid;

        // Download the token signing public key for the key identifier and we'll return 401 if not found
        const tokenSigningPublicKey = await this._downloadJwksKeyForKeyIdentifier(keyIdentifier);

        // Use a library to verify the token's signature, issuer, audience and that it is not expired
        const tokenData = await this._validateTokenInMemory(accessToken, tokenSigningPublicKey);

        // Read protocol claims and we will use the immutable user id as the subject claim
        const userId = this._getStringClaim(tokenData.sub, 'userId');
        const clientId = this._getStringClaim(tokenData.client_id, 'clientId');
        const scope = this._getStringClaim(tokenData.scope, 'scope');

        // Get claims and use the immutable user id as the subject claim
        claims.setTokenInfo(userId, clientId, scope.split(' '));

        // Look up user info to get the name and email
        await this._lookupCentralUserDataClaims(claims, accessToken);
    }

    /*
     * Load metadata first, to get endpoints
     */
    private  async _loadMetadata(): Promise<void> {

        return using (this._logEntry.createPerformanceBreakdown('loadMetadata'), async () => {

            try {
                const endpoint = `${this._configuration.authority}/.well-known/openid-configuration`;
                this._issuer = await Issuer.discover(endpoint);

            } catch (e) {
                throw OAuthErrorUtils.fromMetadataError(e, this._configuration.authority);
            }
        });
    }

    /*
     * Download the public key with which our access token is signed
     */
    private async _downloadJwksKeyForKeyIdentifier(tokenKeyIdentifier: string): Promise<string> {

        return using (this._logEntry.createPerformanceBreakdown('downloadJwksKey'), async () => {

            try {
                // Trigger a download of JWKS keys
                const keyStore = await this._issuer!.keystore(true);

                // Extend token data with central user info
                const keys = keyStore.all();
                const key = keys.find((k: any) => k.kid === tokenKeyIdentifier);
                if (key) {

                    // Convert to PEM format
                    return jwkToPem(key);
                }

            } catch (e) {

                // Report errors clearly
                throw OAuthErrorUtils.fromSigningKeyDownloadError(e, this._issuer!.metadata.jwks_uri!);
            }

            // Indicate not found
            throw ErrorFactory.create401Error(
                `Key with identifier: ${tokenKeyIdentifier} not found in JWKS download`);
        });
    }

    /*
     * Call a third party library to do the token validation, and return token claims
     */
    private async _validateTokenInMemory(accessToken: string, tokenSigningPublicKey: string): Promise<any> {

        return using (this._logEntry.createPerformanceBreakdown('validateTokenInMemory'), async () => {

            try {

                // Verify the token's signature, issuer, audience and that it is not expired
                const options = {
                    issuer: this._issuer!.metadata.issuer,
                };

                // On success return the claims JSON data
                return jsonwebtoken.verify(accessToken, tokenSigningPublicKey, options);

            } catch (e) {

                // Handle failures and capture the details
                let details = 'JWT verification failed';
                if (e.message) {
                    details += ` : ${e.message}`;
                }

                throw ErrorFactory.create401Error(details);
            }
        });
    }

    /*
     * We will read central user data by calling the Open Id Connect User Info endpoint
     * For many companies it may instead make sense to call a Central User Info API
     */
    private async _lookupCentralUserDataClaims(claims: CoreApiClaims, accessToken: string): Promise<void> {

        return using (this._logEntry.createPerformanceBreakdown('userInfoLookup'), async () => {

            // Create the Authorization Server client, which requires a dummy client id
            const client = new this._issuer!.Client({
                client_id: 'userinfo',
            });

            try {
                // Extend token data with central user info
                const userData = await client.userinfo(accessToken);

                // Sanity check the values before accepting them
                const givenName = this._getStringClaim(userData.given_name, 'given_name');
                const familyName = this._getStringClaim(userData.family_name, 'family_name');
                const email = this._getStringClaim(userData.email, 'email');
                claims.setCentralUserInfo(givenName, familyName, email);

            } catch (e) {

                // Report errors clearly
                throw OAuthErrorUtils.fromUserInfoError(e, this._issuer!.metadata.userinfo_endpoint!);
            }
        });
    }

    /*
     * Sanity checks when receiving claims to avoid failing later with a cryptic error
     */
    private _getStringClaim(claim: string | undefined, name: string): string {

        if (!claim) {
            throw OAuthErrorUtils.fromMissingClaim(name);
        }

        return claim;
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.authenticateAndSetClaims = this.authenticateAndSetClaims.bind(this);
        this._loadMetadata = this._loadMetadata.bind(this);
        this._validateTokenInMemory = this._validateTokenInMemory.bind(this);
        this._lookupCentralUserDataClaims = this._lookupCentralUserDataClaims.bind(this);
    }
}
