import axios, {AxiosRequestConfig} from 'axios';
import {randomUUID} from 'crypto';
import {generateKeyPair, exportJWK, KeyLike, SignJWT, GenerateKeyPairResult} from 'jose';
import {HttpProxy} from '../../src/plumbing/utilities/httpProxy.js';
import {MockTokenOptions} from './mockTokenOptions.js';

/*
 * A mock authorization server implemented with wiremock and a JOSE library
 */
export class MockAuthorizationServer {

    private readonly baseUrl: string;
    private readonly httpProxy: HttpProxy;
    private readonly algorithm: string;
    private jwk!: GenerateKeyPairResult<KeyLike>;
    private keyId: string;

    public constructor(useProxy = false) {

        this.baseUrl = 'http://login.authsamples-dev.com/__admin/mappings';
        this.httpProxy = new HttpProxy(useProxy, 'http://127.0.0.1:8888');
        this.algorithm = 'RS256';
        this.keyId = randomUUID();
    }

    /*
     * Create resources at the start of the test run
     */
    public async start(): Promise<void> {

        // Generate a JSON Web Key for our token issuing
        this.jwk = await generateKeyPair(this.algorithm);

        // Get the JSON Web Key Set containing the public key
        const jwk = await exportJWK(this.jwk.publicKey);
        jwk.kid = this.keyId;
        jwk.alg = this.algorithm;
        const keys = {
            keys: [
                jwk,
            ],
        };
        const keysJson = JSON.stringify(keys);

        // Publish the public keys at a Wiremock JWKS URI
        const stubbedResponse = {
            id: this.keyId,
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

        await this.register(stubbedResponse);
    }

    /*
     * Free resources at the end of the test run
     */
    public async stop(): Promise<void> {
        await this.unregister(this.keyId);
    }

    /*
     * Issue an access token with the supplied user and other test options
     */
    public async issueAccessToken(
        options: MockTokenOptions,
        jwk: GenerateKeyPairResult<KeyLike> | null = null): Promise<string> {

        const jwkToUse = jwk || this.jwk;
        return await new SignJWT( {
            iss: options.issuer,
            aud: options.audience,
            scope: options.scope,
            sub: options.subject,
            manager_id: options.managerId,
            role: options.role,
        })
            .setProtectedHeader( { kid: this.keyId, alg: this.algorithm } )
            .setExpirationTime(options.expiryTime)
            .sign(jwkToUse.privateKey);
    }

    /*
     * Add a stubbed response to Wiremock via its Admin API
     */
    private async register(stubbedResponse: any): Promise<void> {

        const options = {
            url: this.baseUrl,
            method: 'POST',
            data: stubbedResponse,
            headers: {
                'content-type': 'application/json',
            },
            httpsAgent: this.httpProxy.agent,
        } as AxiosRequestConfig;

        const response = await axios(options);
        if (response.status !== 201) {
            throw new Error(`Failed to add Wiremock stub: status ${response.status}`);
        }
    }

    /*
     * Delete a stubbed response from Wiremock via its Admin API
     */
    private async unregister(id: string): Promise<void> {

        const options = {
            url: `${this.baseUrl}/${id}`,
            method: 'DELETE',
            httpsAgent: this.httpProxy.agent,
        } as AxiosRequestConfig;

        const response = await axios(options);
        if (response.status !== 200) {
            throw new Error(`Failed to delete Wiremock stub: status ${response.status}`);
        }
    }
}
