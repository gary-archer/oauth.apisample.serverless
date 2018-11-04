import * as OpenIdClient from 'openid-client';
import * as TunnelAgent from 'tunnel-agent';
import * as Url from 'url';
import {OAuthConfiguration} from '../configuration/oauthConfiguration';
import {ApiClaims} from '../entities/apiClaims';
import {TokenValidationResult} from '../entities/tokenValidationResult';
import {ErrorHandler} from './errorHandler';

/*
 * This handles debugging to Fiddler or Charles so that we can view requests to Okta
 */
if (process.env.HTTPS_PROXY) {

    const opts = Url.parse(process.env.HTTPS_PROXY as string);
    OpenIdClient.Issuer.defaultHttpOptions = {
        agent: TunnelAgent.httpsOverHttp({
            proxy: opts,
        }),
    };
}

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
    }

    /*
     * When we receive a new token, validate it and return token claims
     */
    public async validateTokenAndGetTokenClaims(accessToken: string): Promise<TokenValidationResult> {

        await this._getMetadata();
        return await this._introspectTokenAndGetClaims(accessToken);
    }

    /*
     * This sample uses Okta user info as the source of central user data
     * Since getting user info is an OAuth operation we include that in this class also
     */
    public async getCentralUserInfoClaims(claims: ApiClaims, accessToken: string) {

        await this._getMetadata();
        return await this._lookupCentralUserDataClaims(claims, accessToken);
    }

    /*
     * Make a call to the metadata endpoint for the first API request
     */
    private async _getMetadata(): Promise<void> {

        if (Authenticator._issuer) {
            return;
        }

        try {
            Authenticator._issuer = await OpenIdClient.Issuer.discover(this._oauthConfig.authority);
        } catch (e) {
            throw ErrorHandler.fromMetadataError(e, this._oauthConfig.authority);
        }
    }

    /*
     * Make a call to the introspection endpoint to read our token
     */
    private async _introspectTokenAndGetClaims(accessToken: string): Promise<TokenValidationResult> {

        // Create the Authorization Server client
        const client = new Authenticator._issuer.Client({
            client_id: this._oauthConfig.clientId,
            client_secret: this._oauthConfig.clientSecret,
        });

        try {

            // Make a client request to do the introspection
            const tokenData = await client.introspect(accessToken);

            // Return an invalid result if the token is invalid or expired
            if (!tokenData.active) {
                return {
                    isValid: false,
                } as TokenValidationResult;
            }

            // Otherise return a valid result and wrap claims in an object
            return {
                isValid: true,
                expiry: tokenData.exp,
                claims: new ApiClaims(tokenData.sub, tokenData.cid, tokenData.scope),
            } as TokenValidationResult;

        } catch (e) {

            // Report introspection errors clearly
            throw ErrorHandler.fromIntrospectionError(e, Authenticator._issuer.introspection_endpoint);
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
        this._introspectTokenAndGetClaims = this._introspectTokenAndGetClaims.bind(this);
        this._lookupCentralUserDataClaims = this._lookupCentralUserDataClaims.bind(this);
    }
}
