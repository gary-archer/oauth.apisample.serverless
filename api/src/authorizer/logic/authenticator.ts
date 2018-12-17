import * as jwt from 'jsonwebtoken';
import jwks from 'jwks-rsa';
import * as OpenIdClient from 'openid-client';
import {OAuthConfiguration} from '../../shared/configuration/oauthConfiguration';
import {ApiClaims} from '../../shared/entities/apiClaims';
import {ApiLogger} from '../../shared/plumbing/apiLogger';
import {ErrorHandler} from '../../shared/plumbing/errorHandler';
import {DebugProxyAgent} from '../plumbing/debugProxyAgent';
import {TokenValidationResult} from './tokenValidationResult';

/*
 * The entry point for OAuth related operations
 */
export class Authenticator {

    /*
     * Metadata is read once only
     */
    private static _issuer: any = null;

    /*
     * Instance fields
     */
    private _oauthConfig: OAuthConfiguration;

    /*
     * Receive configuration and request metadata
     */
    public constructor(oauthConfig: OAuthConfiguration) {

        this._oauthConfig = oauthConfig;
        this._setupCallbacks();

        // Configure the HTTP proxy if applicable
        OpenIdClient.Issuer.defaultHttpOptions = {
            agent: DebugProxyAgent.get(),
        };
    }

    /*
     * When we receive a new token, validate it and return token claims
     */
    public async validateTokenAndGetTokenClaims(accessToken: string): Promise<TokenValidationResult> {

        // First get metadata if required
        await this._getMetadata();

        // First decoode the token without verifying it so that we get the key identifier
        const decoded = jwt.decode(accessToken, {complete: true});
        if (!decoded) {

            // Indicate an invalid token if we cannot decode it
            ApiLogger.warn('Authenticator', 'Unable to decode received JWT');
            return {
                isValid: false,
            } as TokenValidationResult;
        }

        // Get the key identifier from the JWT header
        const keyIdentifier = decoded.header.kid;
        ApiLogger.info('Authenticator', `Token key identifier is ${keyIdentifier}`);

        // Download the token signing public key for the key identifier and we'll return 401 if not found
        const tokenSigningPublicKey = await this._downloadJwksKeyForKeyIdentifier(keyIdentifier);
        if (!tokenSigningPublicKey) {
            return {
                isValid: false,
            } as TokenValidationResult;
        }

        ApiLogger.info('Authenticator', `Token signing public key for ${keyIdentifier} downloaded successfully`);

        // Use a library to verify the token's signature, issuer, audience and that it is not expired
        const [isValid, result] = this._validateTokenAndReadClaims(accessToken, tokenSigningPublicKey);

        // Indicate an invalid token if it failed verification
        if (!isValid) {
            ApiLogger.warn('Authenticator', `JWT verification failed: ${result}`);
            return {
                isValid: false,
            } as TokenValidationResult;
        }

        // Get token claims
        const apiClaims = new ApiClaims(result.sub, result.client_id, result.scope);

        // Look up user info to get the name and email
        await this._lookupCentralUserDataClaims(apiClaims, accessToken);

        // Indicate success
        return {
                isValid: true,
                expiry: result.exp,
                claims: apiClaims,
            } as TokenValidationResult;
    }

    /*
     * Make a call to the metadata endpoint for the first API request
     */
    private async _getMetadata(): Promise<void> {

        if (Authenticator._issuer) {
            return;
        }

        try {
            ApiLogger.info('Authenticator', `Downloading metadata from: ${this._oauthConfig.authority}`);
            Authenticator._issuer = await OpenIdClient.Issuer.discover(this._oauthConfig.authority);
        } catch (e) {
            throw ErrorHandler.fromMetadataError(e, this._oauthConfig.authority);
        }
    }

    /*
     * Download the public key with which our access token is signed
     */
    private async _downloadJwksKeyForKeyIdentifier(tokenKeyIdentifier: string): Promise<string | null> {

        return new Promise<string | null>((resolve, reject) => {

            // Create the client to download the signing key
            const client = jwks({
                strictSsl: DebugProxyAgent.isDebuggingActive() ? false : true,
                cache: false,
                jwksUri: Authenticator._issuer.jwks_uri,
            });

            // Make a call to get the signing key
            ApiLogger.info('Authenticator', `Downloading JWKS key from: ${Authenticator._issuer.jwks_uri}`);
            client.getSigningKeys((err: any, keys: jwks.Jwk[]) => {

                // Handle errors
                if (err) {
                    return reject(ErrorHandler.fromSigningKeyDownloadError(err, Authenticator._issuer.jwks_uri));
                }

                // Find the key in the download
                const key = keys.find((k) => k.kid === tokenKeyIdentifier);
                if (key) {
                    return resolve(key.publicKey || key.rsaPublicKey);
                }

                // Indicate not found
                ApiLogger.info('Authenticator', `Failed to find JWKS key with identifier: ${tokenKeyIdentifier}`);
                return resolve(null);
            });
        });
    }

    /*
     * Call a third party library to do the token validation
     */
    private _validateTokenAndReadClaims(accessToken: string, tokenSigningPublicKey: string): [boolean, any] {

        try {
            // Verify the token's signature, issuer, audience and that it is not expired
            const options = {
                issuer: Authenticator._issuer.issuer,
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
    private async _lookupCentralUserDataClaims(claims: ApiClaims, accessToken: string): Promise<void> {

        // Create the Authorization Server client
        const client = new Authenticator._issuer.Client();

        try {
            // Extend token data with central user info
            ApiLogger.info(
                'Authenticator',
                `Downloading user info from: ${Authenticator._issuer.userinfo_endpoint}`);
            const response = await client.userinfo(accessToken);
            claims.setCentralUserData(response.given_name, response.family_name, response.email);

        } catch (e) {

            // Report introspection errors clearly
            throw ErrorHandler.fromUserInfoError(e, Authenticator._issuer.userinfo_endpoint);
        }
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this._validateTokenAndReadClaims = this._validateTokenAndReadClaims.bind(this);
        this._lookupCentralUserDataClaims = this._lookupCentralUserDataClaims.bind(this);
    }
}
