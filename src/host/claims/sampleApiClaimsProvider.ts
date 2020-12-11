import {CustomClaimsProvider} from '../../plumbing-oauth';
import {SampleApiClaims} from '../claims/sampleApiClaims';

/*
 * An example of including domain specific authorization rules during claims lookup
 */
export class SampleApiClaimsProvider implements CustomClaimsProvider<SampleApiClaims> {

    /*
     * Add custom claims that cannot be provided by the Authorization Server
     */
    public async addCustomClaims(accessToken: string, claims: SampleApiClaims): Promise<void> {

        // Look up the user id in the API's own database
        this._lookupDatabaseUserId(claims);

        // Look up authorization rules in the API's own data
        this._lookupAuthorizationData(claims);
    }

    /*
     * A real implementation would look up a user in the API's database
     * This might involve a SQL filter on the token's Subject claim or the user info's Email claim
     * 'SELECT * from USERS where OAUTH_ID=<token subject>'
     * 'SELECT * from USERS where EMAIL=<user info email>'
     */
    private _lookupDatabaseUserId(claims: SampleApiClaims): void {

        // In the API's own data this is likely to be a database primary key
        claims.userDatabaseId = '10345';
    }

    /*
     * A real implementation would look up authorization data from the API's own data
     * This could include user roles and any data used for enforcing authorization rules
     */
    private _lookupAuthorizationData(claims: SampleApiClaims): void {

        // We use a coverage based authorization rule where the user can only see data for these regions
        claims.regionsCovered = ['Europe', 'USA'];
    }
}


