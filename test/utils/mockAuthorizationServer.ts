import axios, {AxiosRequestConfig} from 'axios';
import {Guid} from 'guid-typescript';
import {generateKeyPair, exportJWK, KeyLike, SignJWT, GenerateKeyPairResult} from 'jose';
import {HttpProxy} from '../../src/plumbing/utilities/httpProxy.js';
import {MockTokenOptions} from './mockTokenOptions.js';

/*
 * A mock authorization server implemented with wiremock and a JOSE library
 */
export class MockAuthorizationServer {

    private readonly _baseUrl: string;
    private readonly _httpProxy: HttpProxy;
    private readonly _algorithm: string;
    private _jwk!: GenerateKeyPairResult<KeyLike>;
    private _keyId: string;

    public constructor(useProxy = false) {

        this._baseUrl = 'http://login.authsamples-dev.com/__admin/mappings';
        this._httpProxy = new HttpProxy(useProxy, 'http://127.0.0.1:8888');
        this._algorithm = 'RS256';
        this._keyId = Guid.create().toString();
    }

    /*
     * Create resources at the start of the test run
     */
    public async start(): Promise<void> {

        // Generate a JSON Web Key for our token issuing
        this._jwk = await generateKeyPair(this._algorithm);

        // Get the JSON Web Key Set containing the public key
        const jwk = await exportJWK(this._jwk.publicKey);
        jwk.kid = this._keyId;
        jwk.alg = this._algorithm;
        const keys = {
            keys: [
                jwk,
            ],
        };
        const keysJson = JSON.stringify(keys);

        // Publish the public keys at a Wiremock JWKS URI
        const stubbedResponse = {
            id: this._keyId,
            priority: 1,
            request: {
                method: 'GET',
                url: '/.well-known/jwks.json'
            },
            response: {
                status: 200,
                body: keysJson,
            },
        };

        await this._register(stubbedResponse);
    }

    /*
     * Free resources at the end of the test run
     */
    public async stop(): Promise<void> {
        await this._unregister(this._keyId);
    }

    /*
     * Issue an access token with the supplied user and other test options
     */
    public async issueAccessToken(
        options: MockTokenOptions,
        jwk: GenerateKeyPairResult<KeyLike> | null = null): Promise<string> {

        const jwkToUse = jwk || this._jwk;
        return await new SignJWT( {
            iss: options.issuer,
            aud: options.audience,
            scope: options.scope,
            sub: options.subject,
            manager_id: options.managerId,
            role: options.role,
        })
            .setProtectedHeader( { kid: this._keyId, alg: this._algorithm } )
            .setExpirationTime(options.expiryTime)
            .sign(jwkToUse.privateKey);
    }

    /*
     * Add a stubbed response to Wiremock via its Admin API
     */
    private async _register(stubbedResponse: any): Promise<void> {

        const options = {
            url: this._baseUrl,
            method: 'POST',
            data: stubbedResponse,
            headers: {
                'content-type': 'application/json',
            },
            httpsAgent: this._httpProxy.agent,
        } as AxiosRequestConfig;

        const response = await axios(options);
        if (response.status !== 201) {
            throw new Error(`Failed to add Wiremock stub: status ${response.status}`);
        }
    }

    /*
     * Delete a stubbed response from Wiremock via its Admin API
     */
    private async _unregister(id: string): Promise<void> {

        const options = {
            url: `${this._baseUrl}/${id}`,
            method: 'DELETE',
            httpsAgent: this._httpProxy.agent,
        } as AxiosRequestConfig;

        const response = await axios(options);
        if (response.status !== 200) {
            throw new Error(`Failed to delete Wiremock stub: status ${response.status}`);
        }
    }
}
