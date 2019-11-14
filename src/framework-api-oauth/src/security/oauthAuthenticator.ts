import {inject, injectable} from 'inversify';
import * as jwt from 'jsonwebtoken';
import jwks from 'jwks-rsa';
import {Client, custom, Issuer} from 'openid-client';
import {CoreApiClaims, DebugProxyAgent, DefaultClientError, ErrorHandler} from '../../../framework-api-base';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {ErrorUtils} from '../errors/errorUtils';

/*
 * A class to manage the calls to the Authorization Server
 */
@injectable()
export class OAuthAuthenticator {

    private _configuration: OAuthConfiguration;
    private _issuer: Issuer<Client> | null;

    /*
     * Receive configuration and request metadata
     */
    public constructor(
        @inject(OAUTHINTERNALTYPES.Configuration) configuration: OAuthConfiguration) {

        this._configuration = configuration;
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
        const decoded = jwt.decode(accessToken, {complete: true});
        if (!decoded) {

            // Indicate an invalid token if we cannot decode it
            throw DefaultClientError.create401('Unable to decode received JWT');
        }

        // Get the key identifier from the JWT header
        const keyIdentifier = decoded.header.kid;

        // Download the token signing public key for the key identifier and we'll return 401 if not found
        const tokenSigningPublicKey = await this._downloadJwksKeyForKeyIdentifier(keyIdentifier);

        // Use a library to verify the token's signature, issuer, audience and that it is not expired
        const result = this._validateTokenInMemory(accessToken, tokenSigningPublicKey);

        // Get claims and use the immutable user id as the subject claim
        const apiClaims = new CoreApiClaims();
        apiClaims.setTokenInfo(result.sub, result.client_id, result.scope);

        // Look up user info to get the name and email
        await this._lookupCentralUserDataClaims(apiClaims, accessToken);
    }

    /*
     * Load metadata first, to get endpoints
     */
    private  async _loadMetadata(): Promise<void> {

        try {
            const endpoint = `${this._configuration.authority}/.well-known/openid-configuration`;
            this._issuer = await Issuer.discover(endpoint);
        } catch (e) {
            throw ErrorUtils.fromMetadataError(e, this._configuration.authority);
        }
    }

    /*
     * Download the public key with which our access token is signed
     */
    private async _downloadJwksKeyForKeyIdentifier(tokenKeyIdentifier: string): Promise<string> {

        return new Promise<string>((resolve, reject) => {

            // Create the client to download the signing key
            const client = jwks({
                strictSsl: DebugProxyAgent.isDebuggingActive() ? false : true,
                cache: false,
                jwksUri: this._issuer!.metadata.jwks_uri!,
            });

            // Make a call to get the signing key
            client.getSigningKeys((err: any, keys: any[]) => {

                // Handle errors
                if (err) {
                    return reject(ErrorHandler.fromSigningKeyDownloadError(err, this._issuer!.metadata.jwks_uri!));
                }

                // Find the key in the download
                const key = keys.find((k) => k.kid === tokenKeyIdentifier);
                if (key) {
                    return resolve(key.publicKey || key.rsaPublicKey);
                }

                // Indicate not found
                return reject(
                    DefaultClientError.create401(
                        `Key with identifier: ${tokenKeyIdentifier} not found in JWKS download`));
            });
        });
    }

    /*
     * Call a third party library to do the token validation, and return token claims
     */
    private _validateTokenInMemory(accessToken: string, tokenSigningPublicKey: string): any {

        try {
            // Verify the token's signature, issuer, audience and that it is not expired
            const options = {
                issuer: this._issuer!.metadata.issuer,
            };

            // On success return the claims JSON data
            return jwt.verify(accessToken, tokenSigningPublicKey, options);

        } catch (e) {

            // Handle failures and capture the details
            let details = 'JWT verification failed';
            if (e.message) {
                details += ` : ${e.message}`;
            }
            if (e.stack) {
                details += ` : ${e.stack}`;
            }

            throw DefaultClientError.create401(details);
        }
    }

    /*
     * We will read central user data by calling the Open Id Connect User Info endpoint
     * For many companies it may instead make sense to call a Central User Info API
     */
    private async _lookupCentralUserDataClaims(claims: CoreApiClaims, accessToken: string): Promise<void> {

        // Create the Authorization Server client, which requires a dummy client id
        const client = new this._issuer!.Client({
            client_id: 'userinfo',
        });

        try {
            // Extend token data with central user info
            const response = await client.userinfo(accessToken);
            claims.setCentralUserInfo(response.given_name!, response.family_name!, response.email!);

        } catch (e) {

            // Report errors clearly
            throw ErrorHandler.fromUserInfoError(e, this._issuer!.metadata.userinfo_endpoint!);
        }
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
