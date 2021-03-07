import {injectable} from 'inversify';

/*
 * Claims included in the JWT
 */
@injectable()
export class TokenClaims {

    private _subject: string;
    private _clientId: string;
    private _scopes: string[];
    private _expiry: number;

    public static importData(data: any): TokenClaims {
        return new TokenClaims(data.subject, data.clientId, data.scopes.split(' '), data.expiry);
    }

    public constructor(subject: string, clientId: string, scopes: string[], expiry: number) {
        this._subject = subject;
        this._clientId = clientId;
        this._scopes = scopes;
        this._expiry = expiry;
    }

    public get subject(): string {
        return this._subject;
    }

    public get clientId(): string {
        return this._clientId;
    }

    public get scopes(): string[] {
        return this._scopes;
    }

    public get expiry(): number {
        return this._expiry;
    }

    public exportData(): any {

        return {
            'subject': this._subject,
            'clientId': this._clientId,
            'scopes': this._scopes.join(' '),
            'expiry': this._expiry,
        };
    }
}
