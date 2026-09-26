import express, {Application, Request, Response} from 'express';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import https from 'node:https';
import {generateKeyPair, exportJWK, SignJWT, GenerateKeyPairResult, JWTPayload} from 'jose';
import {MockTokenOptions} from './mockTokenOptions.js';

/*
 * A mock authorization server implemented with an HTTP server and a JOSE library
 */
export class MockAuthorizationServer {

    private application: Application;
    private httpsServer: https.Server | null;
    private readonly algorithm: string;
    private keypair!: GenerateKeyPairResult;
    private keyId: string;
    private keysJson: string;

    public constructor() {

        this.application = express();
        this.httpsServer = null;
        this.algorithm = 'ES256';
        this.keyId = randomUUID();
        this.keysJson = '';
        this.getJwks = this.getJwks.bind(this);
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
        this.keysJson = JSON.stringify(keys);

        // Load certificate details
        const pfxFile = await readFile('./certs/authsamples-dev.ssl.p12');
        const serverOptions = {
            pfx: pfxFile,
            passphrase: 'Password1',
        };

        // Start listening over HTTPS
        console.log('4');
        this.application.get('/.well-known/jwks.json', this.getJwks);
        this.httpsServer = https.createServer(serverOptions, this.application);
        this.httpsServer.listen(447);
        console.log('5');
    }

    /*
     * Free resources at the end of the test run
     */
    public stop(): void {
        this.httpsServer?.close();
    }

    /*
     * Issue an access token with the supplied user and other test options
     */
    public async issueAccessToken(
        options: MockTokenOptions,
        keypair: GenerateKeyPairResult | null = null): Promise<string> {

        const keypairToUse = keypair || this.keypair;

        const payload: JWTPayload = {
            iss: options.issuer,
            aud: options.audience,
            scope: options.scope,
            delegation_id: options.delegationId,
            client_id: 'TestClient',
            sub: options.subject,
            manager_id: options.managerId,
            role: options.role,
        };

        return await new SignJWT(payload)
            .setProtectedHeader( { kid: this.keyId, alg: this.algorithm } )
            .setExpirationTime(options.expiryTime)
            .sign(keypairToUse.privateKey);
    }

    /*
     * Serve the JSON web keyset with public keys
     */
    private getJwks(request: Request, response: Response): void {

        response.setHeader('content-type', 'application/json');
        response.status(200).send(this.keysJson);
    }
}
