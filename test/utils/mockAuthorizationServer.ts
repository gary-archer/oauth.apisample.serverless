import axios, {AxiosRequestConfig} from 'axios';
import {randomUUID} from 'crypto';
import {generateKeyPair, exportJWK, SignJWT, GenerateKeyPairResult} from 'jose';
import {HttpProxy} from '../../src/plumbing/utilities/httpProxy.js';
import {MockTokenOptions} from './mockTokenOptions.js';

/*
 * A mock authorization server implemented with wiremock and a JOSE library
 */
export class MockAuthorizationServer {

    private readonly baseUrl: string;
    private readonly httpProxy: HttpProxy;
    private readonly algorithm: string;
    private keypair!: GenerateKeyPairResult;
    private keyId: string;

    public constructor(useProxy: boolean) {

        this.baseUrl = 'https://login.authsamples-dev.com:447/__admin/mappings';
        this.httpProxy = new HttpProxy(useProxy, 'http://127.0.0.1:8888');
        this.algorithm = 'ES256';
        this.keyId = randomUUID();
    }

    /*
     * Create resources at the start of the test run
     */
    public async start(): Promise<void> {

        // Generate a JSON Web Key for our token issuing
        this.keypair = await generateKeyPair(this.algorithm);

        // Get the JSON Web Key Set containing the public key
        const jwk = await exportJWK(this.keypair.publicKey);
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
        keypair: GenerateKeyPairResult | null = null): Promise<string> {

        const keypairToUse = keypair || this.keypair;
        return await new SignJWT( {
            iss: options.issuer,
            aud: options.audience,
            scope: options.scope,
            delegation_id: options.delegationId,
            client_id: 'TestClient',
            sub: options.subject,
            manager_id: options.managerId,
            role: options.role,
        })
            .setProtectedHeader( { kid: this.keyId, alg: this.algorithm } )
            .setExpirationTime(options.expiryTime)
            .sign(keypairToUse.privateKey);
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
            httpsAgent: this.httpProxy.getAgent(),
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
            httpsAgent: this.httpProxy.getAgent(),
        } as AxiosRequestConfig;

        const response = await axios(options);
        if (response.status !== 200) {
            throw new Error(`Failed to delete Wiremock stub: status ${response.status}`);
        }
    }
}
