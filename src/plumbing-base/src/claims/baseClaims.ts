import {injectable} from 'inversify';
import {BaseErrorCodes} from '../errors/baseErrorCodes';
import {ErrorFactory} from '../errors/errorFactory';

/*
 * Base claims that are always included in the JWT
 */
@injectable()
export class BaseClaims {

    private _subject: string;
    private _scopes: string[];
    private _expiry: number;

    public static importData(data: any): BaseClaims {
        return new BaseClaims(data.subject, data.scopes.split(' '), data.expiry);
    }

    public constructor(subject: string, scopes: string[], expiry: number) {
        this._subject = subject;
        this._scopes = scopes;
        this._expiry = expiry;
        this._setupCallbacks();
    }

    public get subject(): string {
        return this._subject;
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
            'scopes': this._scopes.join(' '),
            'expiry': this._expiry,
        };
    }

    /*
     * Verify that we are allowed to access this type of data, via the scopes from the token
     */
    public verifyScope(requiredScope: string): void {

        if (!this.scopes.some((s) => s.indexOf(requiredScope) !== -1)) {

            throw ErrorFactory.createClientError(
                403,
                BaseErrorCodes.insufficientScope,
                'Access token does not have a valid scope for this API endpoint');
        }
    }

    /*
     * Plumbing to ensure the this parameter is available
     */
    private _setupCallbacks(): void {
        this.verifyScope = this.verifyScope.bind(this);
    }
}
