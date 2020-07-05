import {injectable} from 'inversify';

/*
 * Common API claims that our code OAuth plumbing understands
 */
@injectable()
export class CoreApiClaims {

    // Token claims
    public subject: string;
    public clientId: string;
    public scopes: string[];
    public expiry: number;

    // Data from the OAuth user info endpoint
    public givenName: string;
    public familyName: string;
    public email: string;

    // The database primary key from the API's own database
    public userDatabaseId: string;

    public constructor() {
        this.subject = '';
        this.clientId = '';
        this.scopes = [];
        this.expiry = 0;
        this.givenName = '';
        this.familyName = '';
        this.email = '';
        this.userDatabaseId = '';
    }

    /*
     * Set token claims after introspection
     */
    public setTokenInfo(subject: string, clientId: string, scopes: string[], expiry: number) {
        this.subject = subject;
        this.clientId = clientId;
        this.scopes = scopes;
        this.expiry = expiry;
    }

    /*
     * Set informational fields after user info lookup
     */
    public setCentralUserInfo(givenName: string, familyName: string, email: string) {
        this.givenName = givenName;
        this.familyName = familyName;
        this.email = email;
    }
}
