import {SampleCustomClaims} from '../../logic/entities/sampleCustomClaims';
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
            return new SampleCustomClaims('20116', 'admin', []);

        } else {

            // For other users we hard code this user id, assign a role of 'user' and grant access to only one region
            // The CompanyService class will use these claims to return only transactions for the US region
            return new SampleCustomClaims('10345', 'user', ['USA']);
        }
    }
}
