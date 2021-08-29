import {CustomClaims} from '../../plumbing-base';
import {ClaimsPayload, ClaimsProvider} from '../../plumbing-oauth';

/*
 * This class provides any API specific custom claims
 */
export class SampleClaimsProvider extends ClaimsProvider {

    /*
     * Simulate some API logic for identifying the user from OAuth data, via either the subject or email claims
     * A real API would then do a database lookup to find the user's custom claims
     */
    protected async supplyCustomClaims(tokenData: ClaimsPayload, userInfoData: ClaimsPayload): Promise<CustomClaims> {

        const email = userInfoData.getClaim('email');
        const isAdmin = email.toLowerCase().indexOf('admin') !== -1;
        if (isAdmin) {

            // For admin users we hard code this user id, assign a role of 'admin' and grant access to all regions
            // The CompanyService class will use these claims to return all transaction data
            return this._sampleCustomClaims('20116', 'admin', []);

        } else {

            // For other users we hard code this user id, assign a role of 'user' and grant access to only one region
            // The CompanyService class will use these claims to return only transactions for the US region
            return this._sampleCustomClaims('10345', 'user', ['USA']);
        }
    }

    /*
     * Return a simplified version of the SampleCustomClaims instance but without referencing the class
     * This makes AWS packaging easier, since the authorizer zip file does not include the logic folder
     */
    private _sampleCustomClaims(userId: string, userRole: string, userRegions: string[]): any {

        return {
            exportData: () => {
                return {
                    userId,
                    userRole,
                    userRegions,
                };
            },
        };
    }
}
