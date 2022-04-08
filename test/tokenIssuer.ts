import {generateKeyPair, KeyLike, SignJWT} from 'jose';

/*
 * A token issuer for testing
 */
export class TokenIssuer {

    private readonly _algorithm: string;
    private _tokenSigningPrivateKey: KeyLike | null;
    private _tokenSigningPublicKey: KeyLike | null;

    public constructor() {
        this._algorithm = 'RS256';
        this._tokenSigningPrivateKey = null;
        this._tokenSigningPublicKey = null;
    }

    /*
     * Create keys for testing
     */
    public async initialize(): Promise<void> {

        const keys = await generateKeyPair(this._algorithm);
        this._tokenSigningPrivateKey = keys.privateKey;
        this._tokenSigningPublicKey = keys.publicKey;
    }

    /*
     * Issue an access token with the supplied subject claim
     */
    public async issueAccessToken(sub: string): Promise<string> {

        const now = Date.now();

        return await new SignJWT( {
            sub,
            iss: 'testissuer.com',
            aud: 'api.mycompany.com',
        })
            .setProtectedHeader( { kid: '1', alg: this._algorithm } )
            .setIssuedAt(now - 30000)
            .setExpirationTime(now + 30000)
            .sign(this._tokenSigningPrivateKey!);
    }

    /*
     * Called by the API to get the JSON Web Key Set
     */
    public getTokenSigningPublicKeys(): string {
        return this._tokenSigningPublicKey!.toString();
    }
}
