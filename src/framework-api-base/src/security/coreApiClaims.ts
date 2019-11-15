import {injectable} from 'inversify';

/*
 * Common API claims that our code OAuth plumbing understands
 */
@injectable()
export class CoreApiClaims {

    // The immutable user id from the access token, which may exist in the API's database
    public userId: string;

    // The client id, which typically represents the calling application
    public clientId: string;

    // OAuth scopes can represent high level areas of the business
    public scopes: string[];

    // Data from the OAuth user info endpoint
    public givenName: string;
    public familyName: string;
    public email: string;

    public constructor() {
        this.userId = '';
        this.clientId = '';
        this.scopes = [];
        this.givenName = '';
        this.familyName = '';
        this.email = '';
    }

    /*
     * Set token claims after introspection
     */
    public setTokenInfo(userId: string, clientId: string, scopes: string[]) {
        this.userId = userId;
        this.clientId = clientId;
        this.scopes = scopes;
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
