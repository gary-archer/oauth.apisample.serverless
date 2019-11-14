import {inject, injectable} from 'inversify';
import * as jwt from 'jsonwebtoken';
import jwks from 'jwks-rsa';
import * as OpenIdClient from 'openid-client';
import {CoreApiClaims, DebugProxyAgent, ErrorHandler} from '../../../framework-api-base';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {OAUTHINTERNALTYPES} from '../configuration/oauthInternalTypes';
import {TokenValidationResult} from './tokenValidationResult';

/*
 * A class to manage the calls to the Authorization Server
 */
@injectable()
export class OAuthAuthenticator {

    private _configuration: OAuthConfiguration;

    /*
     * Receive configuration and request metadata
     */
    public constructor(@inject(OAUTHINTERNALTYPES.Configuration) configuration: OAuthConfiguration) {

        this._configuration = configuration;
        this._setupCallbacks();

        // Configure the HTTP proxy if applicable
        OpenIdClient.Issuer.defaultHttpOptions = {
            agent: DebugProxyAgent.get(),
        };
    }

    /*
     * When we receive a new token, validate it and return token claims
     */
    public async authenticateAndSetClaims(accessToken: string): Promise<TokenValidationResult> {

        // First get metadata if required
        const issuer = await this._getMetadata();

        // First decoode the token without verifying it so that we get the key identifier
        const decoded = jwt.decode(accessToken, {complete: true});
        if (!decoded) {

            // Indicate an invalid token if we cannot decode it
            return {
                isValid: false,
            } as TokenValidationResult;
        }

        // Get the key identifier from the JWT header
        const keyIdentifier = decoded.header.kid;

        // Download the token signing public key for the key identifier and we'll return 401 if not found
        const tokenSigningPublicKey = await this._downloadJwksKeyForKeyIdentifier(issuer, keyIdentifier);
        if (!tokenSigningPublicKey) {
            return {
                isValid: false,
            } as TokenValidationResult;
        }

        // Use a library to verify the token's signature, issuer, audience and that it is not expired
        const [isValid, result] = this._validateTokenAndReadClaims(issuer, accessToken, tokenSigningPublicKey);

        // Indicate an invalid token if it failed verification
        if (!isValid) {
            return {
                isValid: false,
            } as TokenValidationResult;
        }

        // Get claims and use the immutable user id as the subject claim
        const apiClaims = new CoreApiClaims();
        apiClaims.setTokenInfo(result.sub, result.client_id, result.scope);

        // Look up user info to get the name and email
        await this._lookupCentralUserDataClaims(issuer, apiClaims, accessToken);

        // Indicate success
        return {
                isValid: true,
                claims: apiClaims,
            } as TokenValidationResult;
    }

    /*
     * Make a call to the metadata endpoint for the first API request
     */
    private async _getMetadata(): Promise<any> {

        try {
            return await OpenIdClient.Issuer.discover(
                `${this._configuration.authority}/.well-known/openid-configuration`);

        } catch (e) {
            throw ErrorHandler.fromMetadataError(e, this._configuration.authority);
        }
    }

    /*
     * Download the public key with which our access token is signed
     */
    private async _downloadJwksKeyForKeyIdentifier(issuer: any, tokenKeyIdentifier: string): Promise<string | null> {

        return new Promise<string | null>((resolve, reject) => {

            // Create the client to download the signing key
            const client = jwks({
                strictSsl: DebugProxyAgent.isDebuggingActive() ? false : true,
                cache: false,
                jwksUri: issuer.jwks_uri,
            });

            // Make a call to get the signing key
            client.getSigningKeys((err: any, keys: any[]) => {

                // Handle errors
                if (err) {
                    return reject(ErrorHandler.fromSigningKeyDownloadError(err, issuer.jwks_uri));
                }

                // Find the key in the download
                const key = keys.find((k) => k.kid === tokenKeyIdentifier);
                if (key) {
                    return resolve(key.publicKey || key.rsaPublicKey);
                }

                // Indicate not found
                return resolve(null);
            });
        });
    }

    /*
     * Call a third party library to do the token validation
     */
    private _validateTokenAndReadClaims(issuer: any, accessToken: string, tokenSigningPublicKey: string)
        : [boolean, any] {

        try {
            // Verify the token's signature, issuer, audience and that it is not expired
            const options = {
                issuer: issuer.issuer,
            };

            const claims = jwt.verify(accessToken, tokenSigningPublicKey, options);
            return [true, claims];

        } catch (e) {

            // Indicate failure
            return [false, e];
        }
    }

    /*
     * We will read central user data by calling the Open Id Connect User Info endpoint
     * For many companies it may instead make sense to call a Central User Info API
     */
    private async _lookupCentralUserDataClaims(issuer: any, claims: CoreApiClaims, accessToken: string): Promise<void> {

        // Create the Authorization Server client, which requires a client id
        const client = new issuer.Client({
            client_id: 'userinfoclient',
        });

        try {
            // Extend token data with central user info
            const response = await client.userinfo(accessToken);
            claims.setCentralUserInfo(response.given_name, response.family_name, response.email);

        } catch (e) {

            // Report introspection errors clearly
            throw ErrorHandler.fromUserInfoError(e, issuer.userinfo_endpoint);
        }
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.authenticateAndSetClaims = this.authenticateAndSetClaims.bind(this);
        this._getMetadata = this._getMetadata.bind(this);
        this._validateTokenAndReadClaims = this._validateTokenAndReadClaims.bind(this);
        this._lookupCentralUserDataClaims = this._lookupCentralUserDataClaims.bind(this);
    }
}
